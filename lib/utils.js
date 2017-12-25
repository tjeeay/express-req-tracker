'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.getServerIP = getServerIP;
exports.fetchValues = fetchValues;
exports.fetchRawRequestHeaders = fetchRawRequestHeaders;
exports.fetchRawResponseHeaders = fetchRawResponseHeaders;

var _os = require('os');

function getServerIP() {
  var interfaces = (0, _os.networkInterfaces)();
  for (var key in interfaces) {
    var addresses = interfaces[key];
    for (var i = 0; i < addresses.length; i++) {
      var addr = addresses[i];
      if (addr.family === 'IPv4' && addr.address !== '127.0.0.1' && !addr.internal) {
        return addr.address;
      }
    }
  }
  return null;
}

function fetchValues(source, props) {
  var obj = {};
  props.forEach(function (prop) {
    if (Array.isArray(prop) && prop.length === 2) {
      var _prop = _slicedToArray(prop, 2),
          field = _prop[0],
          alias = _prop[1];

      obj[alias] = source[field];
    } else {
      obj[prop] = source[prop];
    }
  });
  return obj;
}

function fetchRawRequestHeaders(req) {
  var headers = {};
  for (var i = 0; i < req.rawHeaders.length; i = i + 2) {
    var header = req.rawHeaders[i];
    headers[header] = req.rawHeaders[i + 1];
  }
  return headers;
}

function fetchRawResponseHeaders(res) {
  var headers = {};
  (res._header || '').split('\r\n').forEach(function (row) {
    var pair = row.split(': ');
    if (pair.length >= 2) {
      var header = pair.shift();
      headers[header] = pair.join('');
    }
  });
  return headers;
}