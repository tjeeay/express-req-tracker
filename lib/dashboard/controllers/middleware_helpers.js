'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.renderCatcher = renderCatcher;
exports.jsonRes = jsonRes;
exports.jsonCatcher = jsonCatcher;
function renderCatcher(view) {
  var locals = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var res = this;

  return function (error) {
    res.render(view, Object.assign(locals, { error: error }));
  };
}

function jsonRes(code, message, data) {
  var res = this;

  if (typeof code === 'string') {
    if ((typeof message === 'undefined' ? 'undefined' : _typeof(message)) === 'object') {
      data = message;
    }
    message = code;
    code = 0;
  } else if ((typeof code === 'undefined' ? 'undefined' : _typeof(code)) === 'object') {
    data = code;
    code = 0;
    message = 'OK';
  } else if ((typeof message === 'undefined' ? 'undefined' : _typeof(message)) === 'object') {
    data = message;
    message = 'OK';
  }
  res.json({ code: code, message: message, data: data });
}

function jsonCatcher(code, message) {
  var res = this;

  if (typeof code === 'string') {
    message = code;
    code = -1;
  }
  return function (error) {
    res.json({ error: error, code: code, message: message });
  };
}