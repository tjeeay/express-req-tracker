import mime from 'mime';
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

  let ext = mime.extension(contenType) || extname(url);
  if (ext.indexOf('.') === 0) {
    let end = ext.indexOf('?');
    if (end === -1) {
      end = ext.length;
    }
    ext = ext.substr(1, end);
  }

  return Object.keys(mapping).find(key => ~mapping[key].indexOf(ext)) || 'default';
};

Helpers.formatBody = (rawBody) => {
  var body;
  if (typeof rawBody === 'string') {
    try {
      body = JSON.parse(rawBody);
    } catch (err) {
      // ignore
    }
  }
  return body ? JSON.stringify(body, null, 2) : rawBody;
};

Helpers.generageCurl = (req) => {
  let cmd = `curl -X '${req.method}' '${req.rawUrl}'`;
  
  // headers
  Object.keys(req.reqHeaders || {}).forEach(key => {
    cmd += ` -H '${`${key}: ${req.reqHeaders[key]}`}'`;
  });

  // body
  let body = req.body;
  if (body) {
    if (typeof body !== 'string') {
      body = JSON.stringify(body);
    }
    cmd += ` --data '${body}'`;
  }
  cmd += ' --compressed';

  return cmd;
};

export default Helpers;
