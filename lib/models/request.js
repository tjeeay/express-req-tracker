'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _querystring = require('querystring');

var _mongoose = require('./mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _options = require('./_options');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Schema = _mongoose2.default.Schema;
var Types = Schema.Types;


var requestSchemaDefinition = {
  app: { type: Types.ObjectId, ref: 'App' },
  traceId: String,
  pid: Number,
  serverIP: String,
  ip: String,
  protocol: String,
  httpVersion: String,
  host: String,
  method: String,
  url: { type: String, required: true },
  reqHeaders: Types.Mixed,
  resHeaders: Types.Mixed,
  body: Types.Mixed,
  resBody: Types.Mixed,
  statusCode: Number,
  statusMessage: String,
  reqBeganAt: Date,
  reqEndAt: Date,
  resBeganAt: Date,
  resEndAt: Date,
  duration: { type: Number, default: 0 }
};

var requestSchema = new Schema(requestSchemaDefinition, _options.schemaOptions);

// declare indexes
requestSchema.index('url', { background: true });
requestSchema.index('ip', { background: true });
requestSchema.index('statusCode', { background: true });
requestSchema.index('duration', { background: true });
requestSchema.index({ reqBeganAt: 1, reqEndAt: 1 }, { background: true });
requestSchema.index({ resBeganAt: 1, resEndAt: 1 }, { background: true });

// virtuals
requestSchema.virtual('rawUrl').get(function () {
  return this.protocol + '://' + this.host + this.url;
});
requestSchema.virtual('query').get(function () {
  var index = this.url.indexOf('?');
  if (index >= 0) {
    var str = this.url.substr(index + 1);
    return (0, _querystring.parse)(str);
  }
  return {};
});
requestSchema.virtual('reqDuration').get(function () {
  return this.getDuration('req');
});
requestSchema.virtual('resDuration').get(function () {
  return this.getDuration('res');
});
requestSchema.virtual('contentType').get(function () {
  return ((this.resHeaders || {})['Content-Type'] || '').split(';')[0];
});
requestSchema.virtual('bodySize').get(function () {
  if (this.body) {
    return JSON.stringify(this.body).length;
  }
  return 0;
});
requestSchema.virtual('contentLength').get(function () {
  return Number((this.resHeaders || {})['Content-Length'] || '0');
});

requestSchema.methods.getDuration = function (type) {
  var endAt = this.resEndAt;
  var beganAt = this.reqBeganAt;

  if (type) {
    endAt = this[type + 'EndAt'];
    beganAt = this[type + 'BeganAt'];
  }

  if (endAt && beganAt) {
    return endAt - beganAt;
  }
  return '-';
};

var Request = _mongoose2.default.model('Request', requestSchema, 'tracker_requests');

exports.default = Request;