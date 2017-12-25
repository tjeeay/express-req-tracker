import EventEmitter from 'events';
import onFinished from 'on-finished';
import getRawBody from 'raw-body';
import makeDebug from 'debug';

import * as models from './models';
import * as utils from './utils';

const debug = makeDebug('req-tracker');

const HAS_BODY_METHODS = ['POST', 'PUT', 'PATCH'];
const REQ_PROPS = ['ip', 'protocol', 'httpVersion', 'method', ['originalUrl', 'url'], 'query', 'body'];
const RES_PROPS = ['statusCode', 'statusMessage'];

const _serverIP = utils.getServerIP();

class Tracker extends EventEmitter {
  app;
  ctx;
  options;
  _request;
  status = {
    reqFinished: false,
    resFinished: false,
  };

  get appId() {
    return this.app.id;
  }

  get request() {
    return this._request;
  }

  get requestId() {
    return this._request.id;
  }

  get finished() {
    return Object.keys(this.status).every(s => this.status[s]);
  }

  constructor(app, ctx, options) {
    super();
    this.app = app;
    this.ctx = ctx;
    this.options = options;
    this._request = new models.Request();

    const { req } = this.ctx;
    const propValues = utils.fetchValues(req, REQ_PROPS);
    const data = Object.assign({
      app: this.appId,
      traceId: req.trace_id || req.x_request_id || undefined,
      pid: process.pid,
      serverIP: _serverIP,
      host: req.headers['host'],
      reqHeaders: utils.fetchRawRequestHeaders(req),
      reqBeganAt: new Date(),
    }, propValues);

    // extract request body
    if (~HAS_BODY_METHODS.indexOf(req.method)) {
      // if the application doesn't use any body-parser,
      // then get the raw request body by raw-body
      getRawBody(req, 'utf-8', (err, body) => {
        debug(`get request raw body completed ${ err ? 'with' : 'without' } error.`, err || '');
        this.assignRequest({ body });
      });
    }

    this.assignRequest(data);
    this._addEventListener();
  }

  assignRequest(data) {
    if (typeof data.body === 'object') {
      data.body = JSON.stringify(data.body);
    }
    this._request.set(data);
  }

  saveRequest(cb) {
    const self = this;
    const { method, url } = self._request;

    const defaultCallback = (err, request) => {
      debug(`${method} ${url} finished ${err ? 'with' : 'without'} error.`, err || '');
      if (typeof cb === 'function') {
        cb(err, request);
      }
      self.emit('saved', self.requestId);
    };

    self._request.save(defaultCallback);
  }

  _addEventListener() {
    const self = this;
    const { req, res } = self.ctx;
    // rewrite res.send and res.sendFile/sendfile/download
    // to catch response body
    const origin = {
      send: res.send,
      sendFile: res.sendFile,
      sendfile: res.sendfile,
      download: res.download,
    };
    const wrap = fn => {
      return (...args) => {
        const data = {
          resBeganAt: self._request.resBeganAt || new Date()
        };

        if (fn === 'send') {
          const body = args[0];
          if (!Buffer.isBuffer(body)) {
            data.resBody = body;
          }
        }

        self.assignRequest(data);
        origin[fn].apply(res, [...args]);
      };
    };
    ['send', 'sendFile', 'sendfile', 'download'].forEach(fn => {
      res[fn] = wrap(fn);
    });

    onFinished(req, self._reqOnFinish.bind(self));
    onFinished(res, self._resOnFinish.bind(self));

    self.once('reqFinished', self._handleFinished.bind(self, 'reqFinished'));
    self.once('resFinished', self._handleFinished.bind(self, 'resFinished'));
  }

  _reqOnFinish() {
    const self = this;

    self.assignRequest({
      reqEndAt: new Date()
    });

    debug('req finished');
    self.emit('reqFinished');
  }

  _resOnFinish() {
    const self = this;
    const { res } = self.ctx;

    const data = Object.assign({
      resHeaders: utils.fetchRawResponseHeaders(res),
      resEndAt: new Date()
    }, utils.fetchValues(res, RES_PROPS));

    if (this.request.reqBeganAt) {
      data.duration = data.resEndAt - this.request.reqBeganAt;
    }
    self.assignRequest(data);

    debug('res finished');
    self.emit('resFinished');
  }

  _handleFinished(status) {
    const self = this;
    self.status[status] = true;

    if (self.finished) {
      debug('completely finished');
      self.emit('finished', self.requestId);
      if (self.options.immediate) {
        self.saveRequest();
      }
    }
  }
  cleanup() {
    process.nextTick(this.removeAllListeners.bind(this));
  }
}

export default Tracker;
