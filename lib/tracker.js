'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _onFinished = require('on-finished');

var _onFinished2 = _interopRequireDefault(_onFinished);

var _rawBody = require('raw-body');

var _rawBody2 = _interopRequireDefault(_rawBody);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _models = require('./models');

var models = _interopRequireWildcard(_models);

var _utils = require('./utils');

var utils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var debug = (0, _debug2.default)('req-tracker');

var HAS_BODY_METHODS = ['POST', 'PUT', 'PATCH'];
var REQ_PROPS = ['ip', 'protocol', 'httpVersion', 'method', ['originalUrl', 'url'], 'query', 'body'];
var RES_PROPS = ['statusCode', 'statusMessage'];

var _serverIP = utils.getServerIP();

var Tracker = function (_EventEmitter) {
  _inherits(Tracker, _EventEmitter);

  _createClass(Tracker, [{
    key: 'appId',
    get: function get() {
      return this.app.id;
    }
  }, {
    key: 'request',
    get: function get() {
      return this._request;
    }
  }, {
    key: 'requestId',
    get: function get() {
      return this._request.id;
    }
  }, {
    key: 'finished',
    get: function get() {
      var _this2 = this;

      return Object.keys(this.status).every(function (s) {
        return _this2.status[s];
      });
    }
  }]);

  function Tracker(app, ctx, options) {
    _classCallCheck(this, Tracker);

    var _this = _possibleConstructorReturn(this, (Tracker.__proto__ || Object.getPrototypeOf(Tracker)).call(this));

    _this.status = {
      reqFinished: false,
      resFinished: false
    };

    _this.app = app;
    _this.ctx = ctx;
    _this.options = options;
    _this._request = new models.Request();

    var req = _this.ctx.req;

    var propValues = utils.fetchValues(req, REQ_PROPS);
    var data = Object.assign({
      app: _this.appId,
      traceId: req.trace_id || req.x_request_id || undefined,
      pid: process.pid,
      serverIP: _serverIP,
      host: req.headers['host'],
      reqHeaders: utils.fetchRawRequestHeaders(req),
      reqBeganAt: new Date()
    }, propValues);

    // extract request body
    if (~HAS_BODY_METHODS.indexOf(req.method)) {
      // if the application doesn't use any body-parser,
      // then get the raw request body by raw-body
      (0, _rawBody2.default)(req, 'utf-8', function (err, body) {
        debug('get request raw body completed ' + (err ? 'with' : 'without') + ' error.', err || '');
        _this.assignRequest({ body: body });
      });
    }

    _this.assignRequest(data);
    _this._addEventListener();
    return _this;
  }

  _createClass(Tracker, [{
    key: 'assignRequest',
    value: function assignRequest(data) {
      if (_typeof(data.body) === 'object') {
        data.body = JSON.stringify(data.body);
      }
      this._request.set(data);
    }
  }, {
    key: 'saveRequest',
    value: function saveRequest(cb) {
      var self = this;
      var _self$_request = self._request,
          method = _self$_request.method,
          url = _self$_request.url;


      var defaultCallback = function defaultCallback(err, request) {
        debug(method + ' ' + url + ' finished ' + (err ? 'with' : 'without') + ' error.', err || '');
        if (typeof cb === 'function') {
          cb(err, request);
        }
        self.emit('saved', self.requestId);
      };

      self._request.save(defaultCallback);
    }
  }, {
    key: '_addEventListener',
    value: function _addEventListener() {
      var self = this;
      var _self$ctx = self.ctx,
          req = _self$ctx.req,
          res = _self$ctx.res;
      // rewrite res.send and res.sendFile/sendfile/download
      // to catch response body

      var origin = {
        send: res.send,
        sendFile: res.sendFile,
        sendfile: res.sendfile,
        download: res.download
      };
      var wrap = function wrap(fn) {
        return function () {
          for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          var data = {
            resBeganAt: self._request.resBeganAt || new Date()
          };

          if (fn === 'send') {
            var body = args[0];
            if (!Buffer.isBuffer(body)) {
              data.resBody = body;
            }
          }

          self.assignRequest(data);
          origin[fn].apply(res, [].concat(args));
        };
      };
      ['send', 'sendFile', 'sendfile', 'download'].forEach(function (fn) {
        res[fn] = wrap(fn);
      });

      (0, _onFinished2.default)(req, self._reqOnFinish.bind(self));
      (0, _onFinished2.default)(res, self._resOnFinish.bind(self));

      self.once('reqFinished', self._handleFinished.bind(self, 'reqFinished'));
      self.once('resFinished', self._handleFinished.bind(self, 'resFinished'));
    }
  }, {
    key: '_reqOnFinish',
    value: function _reqOnFinish() {
      var self = this;

      self.assignRequest({
        reqEndAt: new Date()
      });

      debug('req finished');
      self.emit('reqFinished');
    }
  }, {
    key: '_resOnFinish',
    value: function _resOnFinish() {
      var self = this;
      var res = self.ctx.res;


      var data = Object.assign({
        resHeaders: utils.fetchRawResponseHeaders(res),
        resEndAt: new Date()
      }, utils.fetchValues(res, RES_PROPS));

      if (this.request.reqBeganAt) {
        data.duration = data.resEndAt - this.request.reqBeganAt;
      }
      self.assignRequest(data);

      debug('res finished');
      self.emit('resFinished');
    }
  }, {
    key: '_handleFinished',
    value: function _handleFinished(status) {
      var self = this;
      self.status[status] = true;

      if (self.finished) {
        debug('completely finished');
        self.emit('finished', self.requestId);
        if (self.options.immediate) {
          self.saveRequest();
        }
      }
    }
  }, {
    key: 'cleanup',
    value: function cleanup() {
      process.nextTick(this.removeAllListeners.bind(this));
    }
  }]);

  return Tracker;
}(_events2.default);

exports.default = Tracker;