'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var dbOptions = exports.dbOptions = {
  useMongoClient: true
};

var schemaOptions = exports.schemaOptions = {
  timestamps: true,
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  },
  get autoIndex() {
    return process.env.NODE_ENV === 'development' ? true : false;
  }
};