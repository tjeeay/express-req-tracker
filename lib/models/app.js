'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('./mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _options = require('./_options');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var appSchemaDefinition = {
  name: { type: String, required: true },
  description: String,
  icon: String
};

var appSchema = new _mongoose2.default.Schema(appSchemaDefinition, _options.schemaOptions);

// declare indexes
appSchema.index('name', { unique: true, background: true });

var App = _mongoose2.default.model('App', appSchema, 'tracker_apps');

exports.default = App;