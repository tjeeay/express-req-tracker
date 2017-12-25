import { format } from 'util';
import makeDebug from 'debug';

import mongoose from './mongoose';
import { dbOptions } from './_options';

const debug = makeDebug('req-tracker:models');

function _connectDB(mongodb, cb) {
  if (cb === undefined) {
    cb = function callback(err) {
      if (err) {
        throw new Error(format('connect to db server [%s] error: %s', mongodb.uri || mongodb, err.message));
      }
    };
  }

  debug('connecting db');
  (typeof mongodb === 'object')
    ? mongoose.connect(mongodb.uri || '', Object.assign({}, dbOptions, mongodb.options || {}), cb)
    : mongoose.connect(mongodb, dbOptions, cb);
}

function _disconnectDB(cb) {
  debug('disconnecting db');
  mongoose.disconnect(cb);
}

export const connectDB = _connectDB;
export const disconnectDB = _disconnectDB;

export { default as App } from './app';
export { default as Request } from './request';
