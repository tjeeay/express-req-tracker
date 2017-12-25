import assert from 'assert';
import makeDebug from 'debug';
import Tracker from './tracker';
import dashboardRouter from './dashboard/router';
import * as models from './models';

const debug = makeDebug('req-tracker:manager');

const DEFAULT_OPTIONS = {
  immediate: false,
  capacity: 200,
  delay: 5000 
};

class TrackerManager {
  app;
  _config;
  initialized;
  readyStatus;
  saveTimer;
  queuingRequests = new Set();
  activeTrackers = new Map();
  finishedRequestIds = new Set();

  constructor(config) {
    this._config = config;
    this._config.options = Object.assign({}, DEFAULT_OPTIONS, config.options);

    this.init();
    process.on('exit', this.beforProcessExit.bind(this));
  }

  init() {
    const self = this;
    const {
      app,
      mongodb
    } = self._config;

    if (self.initialized === true) {
      return;
    }
    self.initialized = true;

    // connent db and initialize app
    models.connectDB(mongodb, err => {
      if (err) {
        throw err;
      }

      debug('db connected');

      models.App.findOneAndUpdate({
        name: app.name
      }, {
        name: app.name,
        icon: app.icon,
        description: app.description
      }, {
        upsert: true,
        new: true
      }).then(doc => {
        self.app = doc;
        self.setReadyState('OK');
        debug(`tracker initialized for ${app.name}.`);
      }, err => {
        self.setReadyState('Error');
        debug(`tracker initialized for ${app.name} with error.`, err);
        throw err;
      });
    });
  }

  beforProcessExit(code) {
    debug(`process will exit with code: ${code}`);
    // clear timeout
    this.clearSaveTimeout();
    // save all requests
    this.bulkSaveRequests(() => {
      // disconnect db
      models.disconnectDB();
    });
  }

  setReadyState(status) {
    this.readyStatus = status;
  }

  isReady() {
    return this.readyStatus === 'OK';
  }

  addTracker(tracker) {
    this.activeTrackers.set(tracker.requestId, tracker);
  }

  removeTracker(requestId) {
    this.activeTrackers.delete(requestId);
  }

  handle(req, res, next) {
    const self = this;
    if (self.isReady()) {
      if (self.queuingRequests.size > 0) {
        for(let ctx of self.queuingRequests) {
          self._handleOne(ctx);
        }
      }
      self._handleOne({ req, res });
    } else {
      self.queuingRequests.add({ req, res });
    }
    next();
  }

  _handleOne(ctx) {
    const self = this;
    const { options } = self._config;

    const tracker = new Tracker(self.app, ctx, self._config.options);
    self.addTracker(tracker);
    if (Boolean(options.immediate) === false) {
      // 1. bulk save requests after specified milliseconds
      self.resetSaveTimeout();
      // 2. or when capacity exceed
      tracker.on('finished', () => {
        self.finishedRequestIds.add(tracker.requestId);
        if (self.finishedRequestIds.size >= options.capacity) {
          self.bulkSaveRequests([...self.finishedRequestIds]);
          self.resetSaveTimeout();
        }
      });
    } else {
      tracker.on('saved', () => {
        self.removeTracker(tracker.requestId);
      });
    }
  }

  bulkSaveRequests(arg, cb) {
    let onlyFinished;
    let requestIds;

    switch (typeof arg) {
      case 'boolean':
        onlyFinished = arg;
        break;
      case 'array':
        requestIds = arg;
        break;
    }

    const self = this;
    let trackers = [...self.activeTrackers.values()];

    if (onlyFinished) {
      trackers = trackers.filter(t => t.finished);
    } else if (requestIds) {
      trackers = trackers.filter(t => requestIds.include(t.requestId) > -1);
    }

    let requests = trackers.map(t => t.request);
    models.Request.insertMany(requests, cb);

    debug(`bulk saved ${requests.length} requests`);

    // remove from activeTrackers
    trackers.forEach(t => {
      self.removeTracker(t.requestId);
      self.finishedRequestIds.delete(t.requestId);
    });
  }
  setSaveTimeout() {
    const self = this;
    const { options } = self._config;
    self.saveTimer = setTimeout(self.bulkSaveRequests.bind(self), options.delay, true);
  }
  resetSaveTimeout() {
    this.clearSaveTimeout();
    this.setSaveTimeout();
  }
  clearSaveTimeout() {
    clearTimeout(this.saveTimer);
  }
}


function setupTracker(config) {
  const cfg = Object.assign({
    defaultBaseUrl: 'req-tracker'
  }, config);

  if (typeof cfg.app === 'string') {
    cfg.app = {
      name: cfg.app
    };
  }

  const { app, mongodb } = cfg;
  assert(typeof app === 'object', 'app must be an object');
  assert(app.name, 'must provide app name');
  assert(mongodb, 'must provide mongodb');

  const manager = new TrackerManager(cfg);
  return dashboardRouter(manager, cfg.defaultBaseUrl);
}

export default setupTracker;
