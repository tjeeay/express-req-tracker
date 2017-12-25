import { join } from 'path';
import { Router } from 'express';
import { renderFile } from 'ejs';
import makeDebug from 'debug';
import config from '../config';
import localsHelpers from './locals_helpers';
import { jsonRes, jsonCatcher, renderCatcher } from './middleware_helpers';

const debug = makeDebug('req-tracker:dashboard:ctrls:builder');

const EXT = '.ejs';

function wrapRender(res) {
  const origin = res.render;
  return (view, locals, cb) => {
    if (view.indexOf('.') === -1) {
      view = view + EXT;
    }
    view = join(config.rootPath, view);
    origin.call(res, view, locals, cb);
  };
}

function extendRes(res) {
  res.jsonRes = jsonRes.bind(res);
  res.jsonCatcher = jsonCatcher.bind(res);
  res.renderCatcher = renderCatcher.bind(res);
}

class CtrlBuilder {
  static _builders = [];
  static getAllBuilders() {
    return CtrlBuilder._builders;
  }
  static create(prefix) {
    return new CtrlBuilder(prefix);
  }

  static _manager;
  static get appId() {
    return CtrlBuilder._manager.app && CtrlBuilder._manager.app.id;
  }
  static setManager(manager) {
    this._manager = manager;
  }

  prefix;
  router;
  constructor(prefix) {
    this.prefix = prefix;
    this.router = Router();

    CtrlBuilder._builders.push(this);
  }

  get(path, fn) {
    return this.define('get', path, fn);
  }

  post(path, fn) {
    return this.define('post', path, fn);
  }

  put(path, fn) {
    return this.define('put', path, fn);
  }

  patch(path, fn) {
    return this.define('patch', path, fn);
  }

  delete(path, fn) {
    return this.define('delete', path, fn);
  }

  all(path, fn) {
    return this.define('all', path, fn);
  }

  define(method, path, fn) {
    const self = this;
    const origin = fn;

    if (typeof fn === 'function') {
      fn = function handler(req, res, next) {
        const app = req.app;
    
        // check view engine
        if (!(EXT in app.engines)) {
          app.engine('ejs', renderFile);
        }

        // extend res methods
        extendRes(res);

        // due to express cannot set multi 'view' path
        res.render = wrapRender(res);
    
        res.locals.Helpers = localsHelpers;

        origin.call(app, req, res, next);
      }; 
    } else {
      fn = function notFound(req, res, next) {
        debug(`NotFound handler '${path}' in ${self.prefix} api.`);
        next();
      };
    }

    const fullPath = join('/', self.prefix, path);
    debug(`mount api: ${method.toUpperCase()} ${fullPath}`);

    self.router[method](path, fn);
  }
}

export default CtrlBuilder;
