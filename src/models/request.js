import { parse } from 'querystring';
import mongoose from './mongoose';
import { schemaOptions } from './_options';

const Schema = mongoose.Schema;
const { Types } = Schema;

const requestSchemaDefinition = {
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

const requestSchema = new Schema(requestSchemaDefinition, schemaOptions);

// declare indexes
requestSchema.index('url', { background: true });
requestSchema.index('ip', { background: true });
requestSchema.index('duration', { background: true });
requestSchema.index('reqBeganAt', { background: true });
requestSchema.index({ url: 1, ip: 1, reqBeganAt: 1 }, { background: true });

// virtuals
requestSchema.virtual('rawUrl').get(function() {
  return `${this.protocol}://${this.host}${this.url}`;
});
requestSchema.virtual('query').get(function() {
  const index = this.url.indexOf('?');
  if (index >= 0) {
    const str = this.url.substr(index + 1);
    return parse(str);
  }
  return {};
});
requestSchema.virtual('reqDuration').get(function() {
  return this.getDuration('req');
});
requestSchema.virtual('resDuration').get(function() {
  return this.getDuration('res');
});
requestSchema.virtual('contentType').get(function() {
  return ((this.resHeaders || {})['Content-Type'] || '').split(';')[0];
});
requestSchema.virtual('bodySize').get(function() {
  if (this.body) {
    return JSON.stringify(this.body).length;
  }
  return 0;
});
requestSchema.virtual('contentLength').get(function() {
  return Number((this.resHeaders || {})['Content-Length'] || '0');  
});

requestSchema.methods.getDuration = function(type) {
  let endAt = this.resEndAt;
  let beganAt = this.reqBeganAt;

  if (type) {
    endAt = this[`${type}EndAt`];
    beganAt = this[`${type}BeganAt`];
  }

  if (endAt && beganAt) {
    return endAt - beganAt;
  }
  return '-';
};

const Request = mongoose.model('Request', requestSchema, 'tracker_requests');

export default Request;
