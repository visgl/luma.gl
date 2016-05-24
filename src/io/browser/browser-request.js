// Supports loading (requesting) assets with XHR (XmlHttpRequest)
/* eslint-disable guard-for-in, complexity, no-try-catch */

/* global XMLHttpRequest */
function noop() {}

const XHR_STATES = {
  UNINITIALIZED: 0,
  LOADING: 1,
  LOADED: 2,
  INTERACTIVE: 3,
  COMPLETED: 4
};

class XHR {
  constructor(opt = {}) {
    opt = {
      url: null,
      method: 'GET',
      async: true,
      noCache: false,
      // body: null,
      sendAsBinary: false,
      responseType: false,
      onProgress: noop,
      onSuccess: noop,
      onError: noop,
      onAbort: noop,
      onComplete: noop,
      ...opt
    };

    this.opt = opt;
    this.req = new XMLHttpRequest();

    this.req.onprogress = e => {
      if (e.lengthComputable) {
        this.opt.onProgress(e, Math.round(e.loaded / e.total * 100));
      } else {
        this.opt.onProgress(e, -1);
      }
    };

    this.req.onerror = e => this.opt.onError(e);

    this.req.onabort = e => this.opt.onAbort(e);

    this.req.onload = e => this.opt.onComplete(e);
  }

  setRequestHeader(header, value) {
    this.req.setRequestHeader(header, value);
    return this;
  }

  sendAsync(body) {
    return new Promise((resolve, reject) => {
      try {
        const {req, opt} = this;
        const {async} = opt;

        if (opt.noCache) {
          opt.url += (opt.url.indexOf('?') >= 0 ? '&' : '?') + Date.now();
        }

        req.open(opt.method, opt.url, async);

        if (opt.responseType) {
          req.responseType = opt.responseType;
        }

        if (async) {
          req.onreadystatechange = e => {
            if (req.readyState === XHR_STATES.COMPLETED) {
              if (req.status === 200) {
                resolve(req.responseType ? req.response : req.responseText);
              } else {
                reject(new Error(req.status));
              }
            }
          };
        }

        if (opt.sendAsBinary) {
          req.sendAsBinary(body || opt.body || null);
        } else {
          req.send(body || opt.body || null);
        }

        if (!async) {
          if (req.status === 200) {
            resolve(req.responseType ? req.response : req.responseText);
          } else {
            reject(new Error(req.status));
          }
        }
      } catch (error) {
        reject(error);
      }
    });
  }
}

export function loadFile(opts) {
  const xhr = new XHR(opts);
  return xhr.sendAsync();
}
