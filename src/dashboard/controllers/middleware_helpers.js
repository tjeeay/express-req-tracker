

export function renderCatcher(view, locals = {}) {
  const res = this;

  return function (error) {
    res.render(view, Object.assign(locals, { error }));
  };
}

export function jsonRes(code, message, data) {
  const res = this;

  if (typeof code === 'string') {
    if (typeof message === 'object') {
      data = message;
    }
    message = code;
    code = 0;
  } else if (typeof code === 'object') {
    data = code;
    code = 0;
    message = 'OK';
  } else if (typeof message === 'object') {
    data = message;
    message = 'OK';
  }
  res.json({ code, message, data });
}

export function jsonCatcher(code, message) {
  const res = this;

  if (typeof code === 'string') {
    message = code;
    code = -1;
  }
  return function (error) {
    res.json({ error, code, message });
  };
}
