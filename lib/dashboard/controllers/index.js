'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

require('./dashboard_ctrl');

var _builder = require('./builder');

var _builder2 = _interopRequireDefault(_builder);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _builder2.default.getAllBuilders();