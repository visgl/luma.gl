// io.js
// Provides loading of assets with XHR and JSONP methods.
/* eslint-disable guard-for-in */
/* global XMLHttpRequest */
/* global document */
import {uid, splat, merge, noop}  from './utils';
import Img from './media';
import {Texture2D} from './texture.js';

export class XHR {

  constructor(opt = {}) {
    opt = {
      url: 'http:// philogljs.org/',
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
    this.initXHR();
  }

  initXHR() {
    const req = this.req = new XMLHttpRequest();
    const self = this;

    ['Progress', 'Error', 'Abort', 'Load'].forEach(event => {
      if (req.addEventListener) {
        req.addEventListener(event.toLowerCase(), e => {
          self['handle' + event](e);
        }, false);
      } else {
        req['on' + event.toLowerCase()] = e => {
          self['handle' + event](e);
        };
      }
    });
  }

  sendAsync(body) {
    return new Promise((resolve, reject) => {
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
          if (req.readyState === XHR.State.COMPLETED) {
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
    });
  }

  send(body) {
    const {req, opt} = this;
    const async = opt.async;

    if (opt.noCache) {
      opt.url += (opt.url.indexOf('?') >= 0 ? '&' : '?') + uid();
    }

    req.open(opt.method, opt.url, async);

    if (opt.responseType) {
      req.responseType = opt.responseType;
    }

    if (async) {
      req.onreadystatechange = e => {
        if (req.readyState === XHR.State.COMPLETED) {
          if (req.status === 200) {
            opt.onSuccess(req.responseType ? req.response : req.responseText);
          } else {
            opt.onError(req.status);
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
        opt.onSuccess(req.responseType ? req.response : req.responseText);
      } else {
        opt.onError(req.status);
      }
    }
  }

  setRequestHeader(header, value) {
    this.req.setRequestHeader(header, value);
    return this;
  }

  handleProgress(e) {
    if (e.lengthComputable) {
      this.opt.onProgress(e, Math.round(e.loaded / e.total * 100));
    } else {
      this.opt.onProgress(e, -1);
    }
  }

  handleError(e) {
    this.opt.onError(e);
  }

  handleAbort(e) {
    this.opt.onAbort(e);
  }

  handleLoad(e) {
    this.opt.onComplete(e);
  }
}

XHR.State = {};
['UNINITIALIZED', 'LOADING', 'LOADED', 'INTERACTIVE', 'COMPLETED']
.forEach((stateName, i) => {
  XHR.State[stateName] = i;
});

// Make parallel requests and group the responses.
export class XHRGroup {

  constructor(opt = {}) {
    opt = {
      urls: [],
      onSuccess: noop,
      method: 'GET',
      async: true,
      noCache: false,
      // body: null,
      sendAsBinary: false,
      responseType: false,
      ...opt
    };

    var urls = splat(opt.urls);
    this.reqs = urls.map((url, i) => new XHR({
      url: url,
      method: opt.method,
      async: opt.async,
      noCache: opt.noCache,
      sendAsBinary: opt.sendAsBinary,
      responseType: opt.responseType,
      body: opt.body,
    }));
  }

  async sendAsync() {
    return await Promise.all(this.reqs.map(req => req.sendAsync()));
  }

};

export function JSONP(opt) {
  opt = merge({
    url: 'http:// philogljs.org/',
    data: {},
    noCache: false,
    onComplete: noop,
    callbackKey: 'callback'
  }, opt || {});

  var index = JSONP.counter++;
  // create query string
  var data = [];
  for (var prop in opt.data) {
    data.push(prop + '=' + opt.data[prop]);
  }
  data = data.join('&');
  // append unique id for cache
  if (opt.noCache) {
    data += (data.indexOf('?') >= 0 ? '&' : '?') + uid();
  }
  // create source url
  var src = opt.url +
    (opt.url.indexOf('?') > -1 ? '&' : '?') +
    opt.callbackKey + '=PhiloGL IO.JSONP.requests.request_' + index +
    (data.length > 0 ? '&' + data : '');

  // create script
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = src;

  // create callback
  JSONP.requests['request_' + index] = function(json) {
    opt.onComplete(json);
    // remove script
    if (script.parentNode) {
      script.parentNode.removeChild(script);
    }
    if (script.clearAttributes) {
      script.clearAttributes();
    }
  };

  // inject script
  document.getElementsByTagName('head')[0].appendChild(script);
}

JSONP.counter = 0;
JSONP.requests = {};

// Creates an image-loading promise.
function loadImage(src) {
  return new Promise(function(resolve, reject) {
    var image = new Image();
    image.onload = function() {
      resolve(image);
    };
    image.onerror = function() {
      reject(new Error(`Could not load image ${src}.`));
    };
    image.src = src;
  });
}

// Load multiple images async.
// rye: TODO this needs to implement functionality from the
//           original Images function.
async function loadImages(srcs) {
  let imagePromises = srcs.map((src) => loadImage(src));
  let results = [];
  for (const imagePromise of imagePromises) {
    results.push(await imagePromise);
  }
  return results;
}

// // Load multiple Image assets async
// export function Images(opt) {
//   opt = merge({
//     src: [],
//     noCache: false,
//     onProgress: noop,
//     onComplete: noop
//   }, opt || {});
//
//   let count = 0;
//   let l = opt.src.length;
//
//   let images;
//   // Image onload handler
//   var load = () => {
//     opt.onProgress(Math.round(++count / l * 100));
//     if (count === l) {
//       opt.onComplete(images);
//     }
//   };
//   // Image error handler
//   var error = () => {
//     if (++count === l) {
//       opt.onComplete(images);
//     }
//   };
//
//   // uid for image sources
//   const noCache = opt.noCache;
//   const uid = uid();
//   function getSuffix(s) {
//     return (s.indexOf('?') >= 0 ? '&' : '?') + uid;
//   }
//
//   // Create image array
//   images = opt.src.map((src, i) => {
//     const img = new Image();
//     img.index = i;
//     img.onload = load;
//     img.onerror = error;
//     img.src = src + (noCache ? getSuffix(src) : '');
//     return img;
//   });
//
//   return images;
// }

// Load multiple textures from images
// rye: TODO this needs to implement functionality from
//           the original loadTextures function.
export async function loadTextures(gl, opt) {
  var images = await loadImages(opt.src);
  var textures = [];
  images.forEach((img, i) => {
    var params = Array.isArray(opt.parameters) ? opt.parameters[i] : opt.parameters;
    params = params === undefined ? {} : params;
    textures.push(new Texture2D(gl, merge({
      data: img
    }, params)));
  });
  return textures;
}

// // Load multiple textures from images
// export function loadTextures(opt = {}) {
//   opt = {
//     src: [],
//     noCache: false,
//     onComplete: noop,
//     ...opt
//   };
//
//   Images({
//     src: opt.src,
//     noCache: opt.noCache,
//     onComplete(images) {
//       var textures = {};
//       images.forEach((img, i) => {
//         textures[opt.id && opt.id[i] || opt.src && opt.src[i]] = merge({
//           data: {
//             value: img
//           }
//         }, opt);
//       });
//       app.setTextures(textures);
//       opt.onComplete();
//     }
//   });
// }
