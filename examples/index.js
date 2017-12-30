import express from 'express';
import bodyParser from 'body-parser';

import reqTracker from '../src';

const app = express();

// use req-tracker
app.use(reqTracker({
  app: 'my-project',
  mongodb: 'mongodb://localhost/req-tracker-sample',
  options: {
    immediate: true
  }
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const users = [];
/* eslint-disable new-cap */
const router = express.Router();
/* eslint-enable */

router.route('/')
  .get((req, res) => {
    res.json(users);
  })
  .post((req, res) => {
    const uid = users.length + 1;
    const user = {
      id: uid,
      name: (req.body && req.body.name) || `User${uid}`
    };
    users.push(user);
    res.status(201).json(user);
  });

router.route('/:id')
  .get((req, res) => {
    const uid = Number(req.params.id);
    const user = users.find(u => u.id === uid);
    if (!user) {
      return res.status(404).end();
    }
    res.json(user);
  })
  .patch(() => {
    throw new Error('Not Implemented.');
  })
  .delete((req, res) => {
    const uid = Number(req.params.id);
    const index = users.findIndex(u => u.id === uid);
    if (index === -1) {
      return res.status(404).end();
    }
    users.splice(index, 1);
    res.end();
  });

app.use('/users', router);

export default app;
