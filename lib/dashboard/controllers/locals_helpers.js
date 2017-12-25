'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mime = require('mime');

var _mime2 = _interopRequireDefault(_mime);

var _path = require('path');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Helpers = {};

Helpers.normalizeSize = function (length) {
  var unit = 'B';
  if (length >= 1024) {
    unit = 'KB';
    length = (length / 1024).toFixed(2);
  }
  return Number(length) + ' ' + unit;
};

Helpers.normalizeDuration = function (duration) {
  return duration + ' ms';
};

Helpers.getFileCategory = function (contenType) {
  var url = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

  var mapping = {
    css: ['css'],
    html: ['html'],
    image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    js: ['js'],
    json: ['json']
  };

  var ext = _mime2.default.extension(contenType) || (0, _path.extname)(url);
  if (ext.indexOf('.') === 0) {
    var end = ext.indexOf('?');
    if (end === -1) {
      end = ext.length;
    }
    ext = ext.substr(1, end);
  }

  return Object.keys(mapping).find(function (key) {
    return ~mapping[key].indexOf(ext);
  }) || 'default';
};

exports.default = Helpers;