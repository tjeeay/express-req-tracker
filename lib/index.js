'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _tracker = require('./tracker');

var _tracker2 = _interopRequireDefault(_tracker);

var _router = require('./dashboard/router');

var _router2 = _interopRequireDefault(_router);

var _models = require('./models');

var models = _interopRequireWildcard(_models);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var debug = (0, _debug2.default)('req-tracker:manager');

var DEFAULT_OPTIONS = {
  immediate: false,
  capacity: 200,
  delay: 5000,
  maxcount: 50000
};

var TrackerManager = function () {
  function TrackerManager(config) {
    _classCallCheck(this, TrackerManager);

    this.queuingRequests = new Set();
    this.activeTrackers = new Map();
    this.finishedRequestIds = new Set();

    this._config = config;
    this._config.options = Object.assign({}, DEFAULT_OPTIONS, config.options);

    this.init();
    process.on('exit', this.beforProcessExit.bind(this));
  }

  _createClass(TrackerManager, [{
    key: 'init',
    value: function init() {
      var self = this;
      var _self$_config = self._config,
          app = _self$_config.app,
          mongodb = _self$_config.mongodb;


      if (self.initialized === true) {
        return;
      }
      self.initialized = true;

      // connent db and initialize app
      models.connectDB(mongodb, function (err) {
        if (err) {
          throw err;
        }

        debug('db connected');

        models.App.findOneAndUpdate({
          name: app.name
        }, {
          name: app.name,
          icon: app.icon,
          description: app.description
        }, {
          upsert: true,
          new: true
        }).then(function (doc) {
          self.app = doc;
          self.setReadyState('OK');
          debug('tracker initialized for ' + app.name + '.');

          // release database
          self.releaseStorage();
        }, function (err) {
          self.setReadyState('Error');
          debug('tracker initialized for ' + app.name + ' with error.', err);
          throw err;
        });
      });
    }
  }, {
    key: 'releaseStorage',
    value: function releaseStorage() {
      var self = this;
      var _self$_config2 = self._config,
          app = _self$_config2.app,
          options = _self$_config2.options;


      models.Request.count({ app: self.app.id }).then(function (count) {
        debug('current request logs count: ' + count);
        if (count >= options.maxcount) {
          return models.Request.find({}, 'createdAt').skip(Math.floor(count / 2)).limit(1);
        }
        return null;
      }).then(function (reqs) {
        if (reqs && reqs.length) {
          return models.Request.deleteMany({ _id: { $lt: reqs[0].id } });
        }
      }).then(function (r) {
        if (r) debug('database was released.');
      }, function (err) {
        debug('release database for ' + app.name + ' with error.', err);
      });
    }
  }, {
    key: 'beforProcessExit',
    value: function beforProcessExit(code) {
      debug('process will exit with code: ' + code);
      // clear timeout
      this.clearSaveTimeout();
      // save all requests
      this.bulkSaveRequests(function () {
        // disconnect db
        models.disconnectDB();
      });
    }
  }, {
    key: 'setReadyState',
    value: function setReadyState(status) {
      this.readyStatus = status;
    }
  }, {
    key: 'isReady',
    value: function isReady() {
      return this.readyStatus === 'OK';
    }
  }, {
    key: 'addTracker',
    value: function addTracker(tracker) {
      this.activeTrackers.set(tracker.requestId, tracker);
    }
  }, {
    key: 'removeTracker',
    value: function removeTracker(requestId) {
      this.activeTrackers.delete(requestId);
    }
  }, {
    key: 'handle',
    value: function handle(req, res, next) {
      var self = this;
      if (self.isReady()) {
        if (self.queuingRequests.size > 0) {
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = self.queuingRequests[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var ctx = _step.value;

              self._handleOne(ctx);
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }
        }
        self._handleOne({ req: req, res: res });
      } else {
        self.queuingRequests.add({ req: req, res: res });
      }
      next();
    }
  }, {
    key: '_handleOne',
    value: function _handleOne(ctx) {
      var self = this;
      var options = self._config.options;


      var tracker = new _tracker2.default(self.app, ctx, self._config.options);
      self.addTracker(tracker);
      if (Boolean(options.immediate) === false) {
        // 1. bulk save requests after specified milliseconds
        self.resetSaveTimeout();
        // 2. or when capacity exceed
        tracker.on('finished', function () {
          self.finishedRequestIds.add(tracker.requestId);
          if (self.finishedRequestIds.size >= options.capacity) {
            self.bulkSaveRequests([].concat(_toConsumableArray(self.finishedRequestIds)));
            self.resetSaveTimeout();
          }
        });
      } else {
        tracker.on('saved', function () {
          self.removeTracker(tracker.requestId);
        });
      }
    }
  }, {
    key: 'bulkSaveRequests',
    value: function bulkSaveRequests(arg, cb) {
      var onlyFinished = void 0;
      var requestIds = void 0;

      switch (typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) {
        case 'boolean':
          onlyFinished = arg;
          break;
        case 'array':
          requestIds = arg;
          break;
      }

      var self = this;
      var trackers = [].concat(_toConsumableArray(self.activeTrackers.values()));

      if (onlyFinished) {
        trackers = trackers.filter(function (t) {
          return t.finished;
        });
      } else if (requestIds) {
        trackers = trackers.filter(function (t) {
          return requestIds.include(t.requestId) > -1;
        });
      }

      var requests = trackers.map(function (t) {
        return t.request;
      });
      models.Request.insertMany(requests, cb);

      debug('bulk saved ' + requests.length + ' requests');

      // remove from activeTrackers
      trackers.forEach(function (t) {
        self.removeTracker(t.requestId);
        self.finishedRequestIds.delete(t.requestId);
      });
    }
  }, {
    key: 'setSaveTimeout',
    value: function setSaveTimeout() {
      var self = this;
      var options = self._config.options;

      self.saveTimer = setTimeout(self.bulkSaveRequests.bind(self), options.delay, true);
    }
  }, {
    key: 'resetSaveTimeout',
    value: function resetSaveTimeout() {
      this.clearSaveTimeout();
      this.setSaveTimeout();
    }
  }, {
    key: 'clearSaveTimeout',
    value: function clearSaveTimeout() {
      clearTimeout(this.saveTimer);
    }
  }]);

  return TrackerManager;
}();

function setupTracker(config) {
  var cfg = Object.assign({
    defaultBaseUrl: 'req-tracker'
  }, config);

  if (typeof cfg.app === 'string') {
    cfg.app = {
      name: cfg.app
    };
  }

  var app = cfg.app,
      mongodb = cfg.mongodb;

  (0, _assert2.default)((typeof app === 'undefined' ? 'undefined' : _typeof(app)) === 'object', 'app must be an object');
  (0, _assert2.default)(app.name, 'must provide app name');
  (0, _assert2.default)(mongodb, 'must provide mongodb');

  var manager = new TrackerManager(cfg);
  return (0, _router2.default)(manager, cfg.defaultBaseUrl);
}

exports.default = setupTracker;