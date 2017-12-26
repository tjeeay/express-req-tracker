'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = configRouter;

var _path = require('path');

var _express = require('express');

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _builder = require('./controllers/builder');

var _builder2 = _interopRequireDefault(_builder);

var _controllers = require('./controllers');

var _controllers2 = _interopRequireDefault(_controllers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = (0, _express.Router)();

function configRouter(manager, baseUrl) {
  baseUrl = (0, _path.join)('/', baseUrl).replace(/\\/g, '/');

  _builder2.default.setManager(manager);

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = _controllers2.default[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var ctrl = _step.value;

      var path = (0, _path.join)(baseUrl, ctrl.prefix).replace(/\\/g, '/');
      router.use(path, ctrl.router);
    }
    // trace request
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

  router.use(RegExp('^(?!' + baseUrl + ')'), manager.handle.bind(manager));
  // config static path
  router.use(baseUrl, (0, _express.static)(_config2.default.rootPath));

  return router;
}