var assert = require('assert');
var request = require('supertest');

require('babel-register');
const app = require('../examples').default;

describe('POST /users', function () {
  it('respond with 201', function (done) {
    request(app)
      .post('/users')
      .send({ name: 'Tee Jay' })
      .expect('Content-Type', /json/)
      .expect(201, done);
  });
});

describe('GET /users', function () {
  it('respond with json', function (done) {
    request(app)
      .get('/users')
      .expect('Content-Type', /json/)
      .expect(200, done);
  });
});

describe('GET /users/:id', function () {
  it('respond with json', function (done) {
    request(app)
      .get('/users/1')
      .expect('Content-Type', /json/)
      .expect(200, done);
  });
});

describe('PATCH /users/:id', function () {
  it('respond with error', function (done) {
    request(app)
      .patch('/users/1')
      .expect(500, done);
  });
});

describe('DELETE /users/:id', function () {
  it('respond with success', function (done) {
    request(app)
      .delete('/users/1')
      .expect(200, done);
  });
});
