'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('mongoose');

var mongoose = new _mongoose.Mongoose();
mongoose.Promise = Promise;

if (process.env.ENABLE_MONGOOSE_DEBUG) {
  mongoose.set('debug', true);
}

exports.default = mongoose;