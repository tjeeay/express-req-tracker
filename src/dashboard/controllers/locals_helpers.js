import mime from 'mime/lite';
import { extname } from 'path';

const Helpers = {};

Helpers.normalizeSize = (length) => {
  let unit = 'B';
  if (length >= 1024) {
    unit = 'KB';
    length = (length / 1024).toFixed(2);
  }
  return `${Number(length)} ${unit}`;
};

Helpers.normalizeDuration = (duration) => {
  return `${duration} ms`;
};

Helpers.getFileCategory = (contenType, url = '') => {
  const mapping = {
    css: ['css'],
    html: ['html'],
    image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    js: ['js'],
    json: ['json'],
  };

  let ext = mime.getExtension(contenType) || extname(url);
  if (ext.indexOf('.') === 0) {
    let end = ext.indexOf('?');
    if (end === -1) {
      end = ext.length;
    }
    ext = ext.substr(1, end);
  }

  return Object.keys(mapping).find(key => ~mapping[key].indexOf(ext)) || 'default';
};

export default Helpers;
