'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Request = exports.App = exports.disconnectDB = exports.connectDB = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _app = require('./app');

Object.defineProperty(exports, 'App', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_app).default;
  }
});

var _request = require('./request');

Object.defineProperty(exports, 'Request', {
  enumerable: true,
  get: function get() {
    return _interopRequireDefault(_request).default;
  }
});

var _util = require('util');

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _mongoose = require('./mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _options = require('./_options');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('req-tracker:models');

function _connectDB(mongodb, cb) {
  if (cb === undefined) {
    cb = function callback(err) {
      if (err) {
        throw new Error((0, _util.format)('connect to db server [%s] error: %s', mongodb.uri || mongodb, err.message));
      }
    };
  }

  debug('connecting db');
  (typeof mongodb === 'undefined' ? 'undefined' : _typeof(mongodb)) === 'object' ? _mongoose2.default.connect(mongodb.uri || '', Object.assign({}, _options.dbOptions, mongodb.options || {}), cb) : _mongoose2.default.connect(mongodb, _options.dbOptions, cb);
}

function _disconnectDB(cb) {
  debug('disconnecting db');
  _mongoose2.default.disconnect(cb);
}

var connectDB = exports.connectDB = _connectDB;
var disconnectDB = exports.disconnectDB = _disconnectDB;