// Supports loading (requesting) assets with XHR (XmlHttpRequest)
/* eslint-disable guard-for-in, complexity, no-try-catch */

/* global XMLHttpRequest, Image */
import {uid, noop} from '../utils';
import {Texture2D} from '../webgl';
import assert from 'assert';

/*
 * Loads (Requests) multiple files asynchronously
 */
export async function loadFiles({urls, onProgress = noop, ...opts}) {
  assert(urls.every(url => typeof url === 'string'),
    'loadImages: {urls} must be array of strings');
  let count = 0;
  return await Promise.all(urls.map(
    url => {
      const promise = loadFile(url, opts);
      promise.then(file => onProgress({
        progress: ++count / urls.length,
        count,
        total: urls.length,
        url
      }));
      return promise;
    }
  ));
}

/*
 * Loads (requests) multiple images asynchronously
 */
export async function loadImages({urls, onProgress = noop, ...opts}) {
  assert(urls.every(url => typeof url === 'string'),
    'loadImages: {urls} must be array of strings');
  let count = 0;
  return await Promise.all(urls.map(
    url => {
      const promise = loadImage(url, opts);
      promise.then(file => onProgress({
        progress: ++count / urls.length,
        count,
        total: urls.length,
        url
      }));
      return promise;
    }
  ));
}

// Load multiple textures from images
export async function loadTextures(gl, {urls, parameters}) {
  const images = await loadImages({urls});
  const textures = [];
  images.forEach((img, i) => {
    let params = Array.isArray(parameters) ? parameters[i] : parameters;
    params = params === undefined ? {} : params;
    textures.push(new Texture2D(gl, {
      ...params,
      data: img
    }));
  });
  return textures;
}

/*
 * Loads images asynchronously
 * returns a promise tracking the load
 */
function loadImage(url) {
  return new Promise(function(resolve, reject) {
    try {
      const image = new Image();
      image.onload = function() {
        resolve(image);
      };
      image.onerror = function() {
        reject(new Error(`Could not load image ${url}.`));
      };
      image.src = url;
    } catch (error) {
      reject(error);
    }
  });
}

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
          opt.url += (opt.url.indexOf('?') >= 0 ? '&' : '?') + uid();
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

function loadFile(url, opts) {
  return new XHR({url, ...opts}).sendAsync();
}
