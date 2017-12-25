import { networkInterfaces } from 'os';

export function getServerIP() {
  const interfaces = networkInterfaces();
  for (let key in interfaces) {
    let addresses = interfaces[key];
    for (let i = 0; i < addresses.length; i++) {
      let addr = addresses[i];
      if (addr.family === 'IPv4' && addr.address !== '127.0.0.1' && !addr.internal) {
        return addr.address;
      }
    }
  }
  return null;
}

export function fetchValues(source, props) {
  const obj = {};
  props.forEach(function (prop) {
    if (Array.isArray(prop) && prop.length === 2) {
      const [field, alias] = prop;
      obj[alias] = source[field];
    } else {
      obj[prop] = source[prop];
    }
  });
  return obj;
}

export function fetchRawRequestHeaders(req) {
  const headers = {};
  for (let i = 0; i < req.rawHeaders.length; i=i+2) {
    const header = req.rawHeaders[i];
    headers[header] = req.rawHeaders[i + 1];
  }
  return headers;
}

export function fetchRawResponseHeaders(res) {
  const headers = {};
  (res._header || '').split('\r\n').forEach(function (row) {
    const pair = row.split(': ');
    if (pair.length >= 2) {
      const header = pair.shift();
      headers[header] = pair.join('');
    }
  });
  return headers;
}
