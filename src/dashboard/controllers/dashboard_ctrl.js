import Promise from 'bluebird';
import { Types } from 'mongoose';
import { Request } from '../../models';
import CtrlBuilder from './builder';

const dashboardCtrl = CtrlBuilder.create('/dashboard');

function searchRequests(req, res) {
  const params = req.query;  
  const limit = Math.min(params.limit || 200, 1000);

  const appId = CtrlBuilder.appId;
  const query = { app: appId };
  if (params.statusCode) {
    const code = Number(params.statusCode[0]) * 100;
    if (!Number.isNaN(code)) {
      query.statusCode = {
        $gte: code,
        $lt: code + 99
      };
    }
  }
  if (params.url) {
    query.url = RegExp(params.url, 'i');
  }
  if (params.ip) {
    query.ip = params.ip;
  }
  
  const counterPipe = [{
    $match: Object.assign({}, query, {
      app: new Types.ObjectId(appId)
    })
  }, {
    $group: {
      _id: '$statusCode',
      count: { $sum: 1 }
    }
  }];

  const performancePipe = [{
    $match: Object.assign({}, query, {
      app: new Types.ObjectId(appId),
      duration: { $gt: 0 }
    })
  }, {
    $group: {
      _id: null,
      fastest: { $min: '$duration' },
      lowest: { $max: '$duration' },
      average: { $avg: '$duration' }
    }
  }];

  Promise.props({
    requests: Request.find(query).sort('-reqBeganAt').limit(limit),
    counterStats: Request.aggregate(counterPipe).exec(),
    performanceStats: Request.aggregate(performancePipe).exec()
  }).then(({requests, counterStats, performanceStats}) => {
    const counter = {
      total: 0
    };
    const performance = performanceStats[0] || {};
    delete performance._id;

    counterStats.forEach(({ _id, count }) => {
      const key = `${String(_id)[0]}xx`;
      counter[key] = counter[key] || 0;
      counter[key] += count;
      counter.total += count;
    });

    res.render('index', {
      requests,
      counter,
      performance,
      params
    });
    }, res.renderCatcher('index'));
}

dashboardCtrl.get('/', searchRequests);

export default dashboardCtrl;
