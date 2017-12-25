'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _path = require('path');

var _express = require('express');

var _ejs = require('ejs');

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _locals_helpers = require('./locals_helpers');

var _locals_helpers2 = _interopRequireDefault(_locals_helpers);

var _middleware_helpers = require('./middleware_helpers');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var debug = (0, _debug2.default)('req-tracker:dashboard:ctrls:builder');

var EXT = '.ejs';

function wrapRender(res) {
  var origin = res.render;
  return function (view, locals, cb) {
    if (view.indexOf('.') === -1) {
      view = view + EXT;
    }
    view = (0, _path.join)(_config2.default.rootPath, view);
    origin.call(res, view, locals, cb);
  };
}

function extendRes(res) {
  res.jsonRes = _middleware_helpers.jsonRes.bind(res);
  res.jsonCatcher = _middleware_helpers.jsonCatcher.bind(res);
  res.renderCatcher = _middleware_helpers.renderCatcher.bind(res);
}

var CtrlBuilder = function () {
  _createClass(CtrlBuilder, null, [{
    key: 'getAllBuilders',
    value: function getAllBuilders() {
      return CtrlBuilder._builders;
    }
  }, {
    key: 'create',
    value: function create(prefix) {
      return new CtrlBuilder(prefix);
    }
  }, {
    key: 'setManager',
    value: function setManager(manager) {
      this._manager = manager;
    }
  }, {
    key: 'appId',
    get: function get() {
      return CtrlBuilder._manager.app && CtrlBuilder._manager.app.id;
    }
  }]);

  function CtrlBuilder(prefix) {
    _classCallCheck(this, CtrlBuilder);

    this.prefix = prefix;
    this.router = (0, _express.Router)();

    CtrlBuilder._builders.push(this);
  }

  _createClass(CtrlBuilder, [{
    key: 'get',
    value: function get(path, fn) {
      return this.define('get', path, fn);
    }
  }, {
    key: 'post',
    value: function post(path, fn) {
      return this.define('post', path, fn);
    }
  }, {
    key: 'put',
    value: function put(path, fn) {
      return this.define('put', path, fn);
    }
  }, {
    key: 'patch',
    value: function patch(path, fn) {
      return this.define('patch', path, fn);
    }
  }, {
    key: 'delete',
    value: function _delete(path, fn) {
      return this.define('delete', path, fn);
    }
  }, {
    key: 'all',
    value: function all(path, fn) {
      return this.define('all', path, fn);
    }
  }, {
    key: 'define',
    value: function define(method, path, fn) {
      var self = this;
      var origin = fn;

      if (typeof fn === 'function') {
        fn = function handler(req, res, next) {
          var app = req.app;

          // check view engine
          if (!(EXT in app.engines)) {
            app.engine('ejs', _ejs.renderFile);
          }

          // extend res methods
          extendRes(res);

          // due to express cannot set multi 'view' path
          res.render = wrapRender(res);

          res.locals.Helpers = _locals_helpers2.default;

          origin.call(app, req, res, next);
        };
      } else {
        fn = function notFound(req, res, next) {
          debug('NotFound handler \'' + path + '\' in ' + self.prefix + ' api.');
          next();
        };
      }

      var fullPath = (0, _path.join)('/', self.prefix, path);
      debug('mount api: ' + method.toUpperCase() + ' ' + fullPath);

      self.router[method](path, fn);
    }
  }]);

  return CtrlBuilder;
}();

CtrlBuilder._builders = [];
exports.default = CtrlBuilder;