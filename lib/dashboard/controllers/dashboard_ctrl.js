'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _mongoose = require('mongoose');

var _models = require('../../models');

var _builder = require('./builder');

var _builder2 = _interopRequireDefault(_builder);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var dashboardCtrl = _builder2.default.create('/dashboard');

function searchRequests(req, res) {
  var params = req.query;
  var limit = Math.min(params.limit || 200, 1000);

  var appId = _builder2.default.appId;
  var query = { app: appId };
  if (params.statusCode) {
    var code = Number(params.statusCode[0]) * 100;
    if (!Number.isNaN(code)) {
      query.statusCode = {
        $gte: code,
        $lt: code + 99
      };
    }
  }
  if (params.url) {
    query.url = RegExp(params.url, 'i');
  }
  if (params.ip) {
    query.ip = params.ip;
  }

  var counterPipe = [{
    $match: Object.assign({}, query, {
      app: new _mongoose.Types.ObjectId(appId)
    })
  }, {
    $group: {
      _id: '$statusCode',
      count: { $sum: 1 }
    }
  }];

  var performancePipe = [{
    $match: Object.assign({}, query, {
      app: new _mongoose.Types.ObjectId(appId),
      duration: { $gt: 0 }
    })
  }, {
    $group: {
      _id: null,
      fastest: { $min: '$duration' },
      lowest: { $max: '$duration' },
      average: { $avg: '$duration' }
    }
  }];

  _bluebird2.default.props({
    requests: _models.Request.find(query).sort('-reqBeganAt').limit(limit),
    counterStats: _models.Request.aggregate(counterPipe).exec(),
    performanceStats: _models.Request.aggregate(performancePipe).exec()
  }).then(function (_ref) {
    var requests = _ref.requests,
        counterStats = _ref.counterStats,
        performanceStats = _ref.performanceStats;

    var counter = {
      total: 0
    };
    var performance = performanceStats[0] || {};
    delete performance._id;

    counterStats.forEach(function (_ref2) {
      var _id = _ref2._id,
          count = _ref2.count;

      var key = String(_id)[0] + 'xx';
      counter[key] = counter[key] || 0;
      counter[key] += count;
      counter.total += count;
    });

    res.render('index', {
      requests: requests,
      counter: counter,
      performance: performance,
      params: params
    });
  }, res.renderCatcher('index'));
}

dashboardCtrl.get('/', searchRequests);

exports.default = dashboardCtrl;