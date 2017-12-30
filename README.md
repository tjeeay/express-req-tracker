# express-req-tracker

[![Travis-CI][travis-badge]][travis-url]
[![NPM downloads][download-badge]][package-url]

[![NPM package-info][package-info-badge]][package-url]

[travis-url]: https://travis-ci.org/tjeeay/express-req-tracker
[travis-badge]: https://travis-ci.org/tjeeay/express-req-tracker.svg?branch=master

[package-url]: https://npmjs.org/package/express-req-tracker
[download-badge]: https://img.shields.io/npm/dm/kdniaosdk.svg?style=flat
[package-info-badge]: https://nodei.co/npm/express-req-tracker.png?compact=true

A Express middleware for tracking request and responses.

## Installation

```bash
yarn add express-req-tracker
# or
npm install -S express-req-tracker
```

## Usage

```js
import express from 'express';
import reqTracker from 'express-req-tracker';

const app = express();

// use req-tracker
app.use(reqTracker({
  app: 'my-project',
  mongodb: 'mongodb://localhost/req-tracker-sample',
  options: {
    immediate: true
  }
}));

app.get('/', (req, res) => {
  res.json('hello world');
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`server is running at: http://localhost:${PORT}`);
});
```

## Run Example

>`Notice`: before run example, please ensure you have installed and running MongoDB.

```bash
# first: run unit test to produce request logs
npm run test

# second: run sample
npm run start
```

after running example, then you can open the dashboard [http://localhost:7001/req-tracker/dashboard](http://localhost:7001/req-tracker/dashboard) to view the request logs.

![](./dashboard/img/snapshot.png)

## License

MIT