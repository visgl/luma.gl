'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loadTextures = exports.XHRGroup = exports.XHR = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // Provides loading of assets with XHR and JSONP methods.
/* eslint-disable guard-for-in, complexity */

/* global document, XMLHttpRequest, Image */


// Load multiple images async.
// rye: TODO this needs to implement functionality from the
//           original Images function.

var loadImages = function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(srcs) {
    var imagePromises, results, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, imagePromise;

    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            imagePromises = srcs.map(function (src) {
              return loadImage(src);
            });
            results = [];
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            _context2.prev = 5;
            _iterator = imagePromises[Symbol.iterator]();

          case 7:
            if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
              _context2.next = 17;
              break;
            }

            imagePromise = _step.value;
            _context2.t0 = results;
            _context2.next = 12;
            return imagePromise;

          case 12:
            _context2.t1 = _context2.sent;

            _context2.t0.push.call(_context2.t0, _context2.t1);

          case 14:
            _iteratorNormalCompletion = true;
            _context2.next = 7;
            break;

          case 17:
            _context2.next = 23;
            break;

          case 19:
            _context2.prev = 19;
            _context2.t2 = _context2['catch'](5);
            _didIteratorError = true;
            _iteratorError = _context2.t2;

          case 23:
            _context2.prev = 23;
            _context2.prev = 24;

            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }

          case 26:
            _context2.prev = 26;

            if (!_didIteratorError) {
              _context2.next = 29;
              break;
            }

            throw _iteratorError;

          case 29:
            return _context2.finish(26);

          case 30:
            return _context2.finish(23);

          case 31:
            return _context2.abrupt('return', results);

          case 32:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this, [[5, 19, 23, 31], [24,, 26, 30]]);
  }));

  return function loadImages(_x3) {
    return ref.apply(this, arguments);
  };
}();

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


var loadTextures = exports.loadTextures = function () {
  var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(gl, opt) {
    var images, textures;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return loadImages(opt.src);

          case 2:
            images = _context3.sent;
            textures = [];

            images.forEach(function (img, i) {
              var params = Array.isArray(opt.parameters) ? opt.parameters[i] : opt.parameters;
              params = params === undefined ? {} : params;
              textures.push(new _webgl.Texture2D(gl, (0, _utils.merge)({
                data: img
              }, params)));
            });
            return _context3.abrupt('return', textures);

          case 6:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function loadTextures(_x4, _x5) {
    return ref.apply(this, arguments);
  };
}();

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


exports.JSONP = JSONP;

var _utils = require('./utils');

var _webgl = require('./webgl');

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var XHR = exports.XHR = function () {
  function XHR() {
    var opt = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, XHR);

    opt = _extends({
      url: 'http:// philogljs.org/',
      method: 'GET',
      async: true,
      noCache: false,
      // body: null,
      sendAsBinary: false,
      responseType: false,
      onProgress: _utils.noop,
      onSuccess: _utils.noop,
      onError: _utils.noop,
      onAbort: _utils.noop,
      onComplete: _utils.noop
    }, opt);

    this.opt = opt;
    this.initXHR();
  }

  _createClass(XHR, [{
    key: 'initXHR',
    value: function initXHR() {
      var req = this.req = new XMLHttpRequest();
      var self = this;

      ['Progress', 'Error', 'Abort', 'Load'].forEach(function (event) {
        if (req.addEventListener) {
          req.addEventListener(event.toLowerCase(), function (e) {
            self['handle' + event](e);
          }, false);
        } else {
          req['on' + event.toLowerCase()] = function (e) {
            self['handle' + event](e);
          };
        }
      });
    }
  }, {
    key: 'sendAsync',
    value: function sendAsync(body) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        var req = _this.req;
        var opt = _this.opt;
        var async = opt.async;


        if (opt.noCache) {
          opt.url += (opt.url.indexOf('?') >= 0 ? '&' : '?') + (0, _utils.uid)();
        }

        req.open(opt.method, opt.url, async);

        if (opt.responseType) {
          req.responseType = opt.responseType;
        }

        if (async) {
          req.onreadystatechange = function (e) {
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
  }, {
    key: 'send',
    value: function send(body) {
      var req = this.req;
      var opt = this.opt;

      var async = opt.async;

      if (opt.noCache) {
        opt.url += (opt.url.indexOf('?') >= 0 ? '&' : '?') + (0, _utils.uid)();
      }

      req.open(opt.method, opt.url, async);

      if (opt.responseType) {
        req.responseType = opt.responseType;
      }

      if (async) {
        req.onreadystatechange = function (e) {
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
  }, {
    key: 'setRequestHeader',
    value: function setRequestHeader(header, value) {
      this.req.setRequestHeader(header, value);
      return this;
    }
  }, {
    key: 'handleProgress',
    value: function handleProgress(e) {
      if (e.lengthComputable) {
        this.opt.onProgress(e, Math.round(e.loaded / e.total * 100));
      } else {
        this.opt.onProgress(e, -1);
      }
    }
  }, {
    key: 'handleError',
    value: function handleError(e) {
      this.opt.onError(e);
    }
  }, {
    key: 'handleAbort',
    value: function handleAbort(e) {
      this.opt.onAbort(e);
    }
  }, {
    key: 'handleLoad',
    value: function handleLoad(e) {
      this.opt.onComplete(e);
    }
  }]);

  return XHR;
}();

XHR.State = {};
['UNINITIALIZED', 'LOADING', 'LOADED', 'INTERACTIVE', 'COMPLETED'].forEach(function (stateName, i) {
  XHR.State[stateName] = i;
});

// Make parallel requests and group the responses.

var XHRGroup = exports.XHRGroup = function () {
  function XHRGroup() {
    var opt = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, XHRGroup);

    opt = _extends({
      urls: [],
      onSuccess: _utils.noop,
      method: 'GET',
      async: true,
      noCache: false,
      // body: null,
      sendAsBinary: false,
      responseType: false
    }, opt);

    var urls = (0, _utils.splat)(opt.urls);
    this.reqs = urls.map(function (url, i) {
      return new XHR({
        url: url,
        method: opt.method,
        async: opt.async,
        noCache: opt.noCache,
        sendAsBinary: opt.sendAsBinary,
        responseType: opt.responseType,
        body: opt.body
      });
    });
  }

  _createClass(XHRGroup, [{
    key: 'sendAsync',
    value: function () {
      var ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return Promise.all(this.reqs.map(function (req) {
                  return req.sendAsync();
                }));

              case 2:
                return _context.abrupt('return', _context.sent);

              case 3:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function sendAsync() {
        return ref.apply(this, arguments);
      }

      return sendAsync;
    }()
  }]);

  return XHRGroup;
}();

function JSONP(opt) {
  opt = (0, _utils.merge)({
    url: 'http:// philogljs.org/',
    data: {},
    noCache: false,
    onComplete: _utils.noop,
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
    data += (data.indexOf('?') >= 0 ? '&' : '?') + (0, _utils.uid)();
  }
  // create source url
  var src = opt.url + (opt.url.indexOf('?') > -1 ? '&' : '?') + opt.callbackKey + '=PhiloGL IO.JSONP.requests.request_' + index + (data.length > 0 ? '&' + data : '');

  // create script
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = src;

  // create callback
  JSONP.requests['request_' + index] = function (json) {
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
  return new Promise(function (resolve, reject) {
    var image = new Image();
    image.onload = function () {
      resolve(image);
    };
    image.onerror = function () {
      reject(new Error('Could not load image ' + src + '.'));
    };
    image.src = src;
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pby5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztzREF3UUEsa0JBQTBCLElBQTFCO1FBQ00sZUFDQSx5RkFDTzs7Ozs7O0FBRlAsNEJBQWdCLEtBQUssR0FBTCxDQUFTLFVBQUMsR0FBRDtxQkFBUyxVQUFVLEdBQVY7YUFBVDtBQUN6QixzQkFBVTs7Ozs7d0JBQ2E7Ozs7Ozs7O0FBQWhCOzJCQUNUOzttQkFBbUI7Ozs7O3lCQUFYOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OENBRUg7Ozs7Ozs7O0dBTlQ7O2tCQUFlOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3NEQTJEUixrQkFBNEIsRUFBNUIsRUFBZ0MsR0FBaEM7UUFDRCxRQUNBOzs7Ozs7bUJBRGUsV0FBVyxJQUFJLEdBQUo7OztBQUExQjtBQUNBLHVCQUFXOztBQUNmLG1CQUFPLE9BQVAsQ0FBZSxVQUFDLEdBQUQsRUFBTSxDQUFOLEVBQVk7QUFDekIsa0JBQUksU0FBUyxNQUFNLE9BQU4sQ0FBYyxJQUFJLFVBQUosQ0FBZCxHQUNYLElBQUksVUFBSixDQUFlLENBQWYsQ0FEVyxHQUNTLElBQUksVUFBSixDQUZHO0FBR3pCLHVCQUFTLFdBQVcsU0FBWCxHQUF1QixFQUF2QixHQUE0QixNQUE1QixDQUhnQjtBQUl6Qix1QkFBUyxJQUFULENBQWMscUJBQWMsRUFBZCxFQUFrQixrQkFBTTtBQUNwQyxzQkFBTSxHQUFOO2VBRDhCLEVBRTdCLE1BRjZCLENBQWxCLENBQWQsRUFKeUI7YUFBWixDQUFmOzhDQVFPOzs7Ozs7OztHQVhGOztrQkFBZTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FBOUhOOztBQWpNaEI7O0FBQ0E7Ozs7OztJQUVhO0FBRVgsV0FGVyxHQUVYLEdBQXNCO1FBQVYsNERBQU0sa0JBQUk7OzBCQUZYLEtBRVc7O0FBQ3BCO0FB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QUFXO0FBQ3pCLGFBQU8sSUFBSSxLQUFKLDJCQUFrQyxTQUFsQyxDQUFQLEVBRHlCO0tBQVgsQ0FMMkI7QUFRM0MsVUFBTSxHQUFOLEdBQVksR0FBWixDQVIyQztHQUExQixDQUFuQixDQURzQjtDQUF4QiIsImZpbGUiOiJpby5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFByb3ZpZGVzIGxvYWRpbmcgb2YgYXNzZXRzIHdpdGggWEhSIGFuZCBKU09OUCBtZXRob2RzLlxuLyogZXNsaW50LWRpc2FibGUgZ3VhcmQtZm9yLWluLCBjb21wbGV4aXR5ICovXG5cbi8qIGdsb2JhbCBkb2N1bWVudCwgWE1MSHR0cFJlcXVlc3QsIEltYWdlICovXG5pbXBvcnQge3VpZCwgc3BsYXQsIG1lcmdlLCBub29wfSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCB7VGV4dHVyZTJEfSBmcm9tICcuL3dlYmdsJztcblxuZXhwb3J0IGNsYXNzIFhIUiB7XG5cbiAgY29uc3RydWN0b3Iob3B0ID0ge30pIHtcbiAgICBvcHQgPSB7XG4gICAgICB1cmw6ICdodHRwOi8vIHBoaWxvZ2xqcy5vcmcvJyxcbiAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICBhc3luYzogdHJ1ZSxcbiAgICAgIG5vQ2FjaGU6IGZhbHNlLFxuICAgICAgLy8gYm9keTogbnVsbCxcbiAgICAgIHNlbmRBc0JpbmFyeTogZmFsc2UsXG4gICAgICByZXNwb25zZVR5cGU6IGZhbHNlLFxuICAgICAgb25Qcm9ncmVzczogbm9vcCxcbiAgICAgIG9uU3VjY2Vzczogbm9vcCxcbiAgICAgIG9uRXJyb3I6IG5vb3AsXG4gICAgICBvbkFib3J0OiBub29wLFxuICAgICAgb25Db21wbGV0ZTogbm9vcCxcbiAgICAgIC4uLm9wdFxuICAgIH07XG5cbiAgICB0aGlzLm9wdCA9IG9wdDtcbiAgICB0aGlzLmluaXRYSFIoKTtcbiAgfVxuXG4gIGluaXRYSFIoKSB7XG4gICAgY29uc3QgcmVxID0gdGhpcy5yZXEgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgIFsnUHJvZ3Jlc3MnLCAnRXJyb3InLCAnQWJvcnQnLCAnTG9hZCddLmZvckVhY2goZXZlbnQgPT4ge1xuICAgICAgaWYgKHJlcS5hZGRFdmVudExpc3RlbmVyKSB7XG4gICAgICAgIHJlcS5hZGRFdmVudExpc3RlbmVyKGV2ZW50LnRvTG93ZXJDYXNlKCksIGUgPT4ge1xuICAgICAgICAgIHNlbGZbJ2hhbmRsZScgKyBldmVudF0oZSk7XG4gICAgICAgIH0sIGZhbHNlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlcVsnb24nICsgZXZlbnQudG9Mb3dlckNhc2UoKV0gPSBlID0+IHtcbiAgICAgICAgICBzZWxmWydoYW5kbGUnICsgZXZlbnRdKGUpO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgc2VuZEFzeW5jKGJvZHkpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3Qge3JlcSwgb3B0fSA9IHRoaXM7XG4gICAgICBjb25zdCB7YXN5bmN9ID0gb3B0O1xuXG4gICAgICBpZiAob3B0Lm5vQ2FjaGUpIHtcbiAgICAgICAgb3B0LnVybCArPSAob3B0LnVybC5pbmRleE9mKCc/JykgPj0gMCA/ICcmJyA6ICc/JykgKyB1aWQoKTtcbiAgICAgIH1cblxuICAgICAgcmVxLm9wZW4ob3B0Lm1ldGhvZCwgb3B0LnVybCwgYXN5bmMpO1xuXG4gICAgICBpZiAob3B0LnJlc3BvbnNlVHlwZSkge1xuICAgICAgICByZXEucmVzcG9uc2VUeXBlID0gb3B0LnJlc3BvbnNlVHlwZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGFzeW5jKSB7XG4gICAgICAgIHJlcS5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBlID0+IHtcbiAgICAgICAgICBpZiAocmVxLnJlYWR5U3RhdGUgPT09IFhIUi5TdGF0ZS5DT01QTEVURUQpIHtcbiAgICAgICAgICAgIGlmIChyZXEuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgICAgcmVzb2x2ZShyZXEucmVzcG9uc2VUeXBlID8gcmVxLnJlc3BvbnNlIDogcmVxLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKHJlcS5zdGF0dXMpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIGlmIChvcHQuc2VuZEFzQmluYXJ5KSB7XG4gICAgICAgIHJlcS5zZW5kQXNCaW5hcnkoYm9keSB8fCBvcHQuYm9keSB8fCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlcS5zZW5kKGJvZHkgfHwgb3B0LmJvZHkgfHwgbnVsbCk7XG4gICAgICB9XG5cbiAgICAgIGlmICghYXN5bmMpIHtcbiAgICAgICAgaWYgKHJlcS5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgIHJlc29sdmUocmVxLnJlc3BvbnNlVHlwZSA/IHJlcS5yZXNwb25zZSA6IHJlcS5yZXNwb25zZVRleHQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IocmVxLnN0YXR1cykpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBzZW5kKGJvZHkpIHtcbiAgICBjb25zdCB7cmVxLCBvcHR9ID0gdGhpcztcbiAgICBjb25zdCBhc3luYyA9IG9wdC5hc3luYztcblxuICAgIGlmIChvcHQubm9DYWNoZSkge1xuICAgICAgb3B0LnVybCArPSAob3B0LnVybC5pbmRleE9mKCc/JykgPj0gMCA/ICcmJyA6ICc/JykgKyB1aWQoKTtcbiAgICB9XG5cbiAgICByZXEub3BlbihvcHQubWV0aG9kLCBvcHQudXJsLCBhc3luYyk7XG5cbiAgICBpZiAob3B0LnJlc3BvbnNlVHlwZSkge1xuICAgICAgcmVxLnJlc3BvbnNlVHlwZSA9IG9wdC5yZXNwb25zZVR5cGU7XG4gICAgfVxuXG4gICAgaWYgKGFzeW5jKSB7XG4gICAgICByZXEub25yZWFkeXN0YXRlY2hhbmdlID0gZSA9PiB7XG4gICAgICAgIGlmIChyZXEucmVhZHlTdGF0ZSA9PT0gWEhSLlN0YXRlLkNPTVBMRVRFRCkge1xuICAgICAgICAgIGlmIChyZXEuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgIG9wdC5vblN1Y2Nlc3MocmVxLnJlc3BvbnNlVHlwZSA/IHJlcS5yZXNwb25zZSA6IHJlcS5yZXNwb25zZVRleHQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvcHQub25FcnJvcihyZXEuc3RhdHVzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKG9wdC5zZW5kQXNCaW5hcnkpIHtcbiAgICAgIHJlcS5zZW5kQXNCaW5hcnkoYm9keSB8fCBvcHQuYm9keSB8fCBudWxsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVxLnNlbmQoYm9keSB8fCBvcHQuYm9keSB8fCBudWxsKTtcbiAgICB9XG5cbiAgICBpZiAoIWFzeW5jKSB7XG4gICAgICBpZiAocmVxLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgIG9wdC5vblN1Y2Nlc3MocmVxLnJlc3BvbnNlVHlwZSA/IHJlcS5yZXNwb25zZSA6IHJlcS5yZXNwb25zZVRleHQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3B0Lm9uRXJyb3IocmVxLnN0YXR1cyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc2V0UmVxdWVzdEhlYWRlcihoZWFkZXIsIHZhbHVlKSB7XG4gICAgdGhpcy5yZXEuc2V0UmVxdWVzdEhlYWRlcihoZWFkZXIsIHZhbHVlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGhhbmRsZVByb2dyZXNzKGUpIHtcbiAgICBpZiAoZS5sZW5ndGhDb21wdXRhYmxlKSB7XG4gICAgICB0aGlzLm9wdC5vblByb2dyZXNzKGUsIE1hdGgucm91bmQoZS5sb2FkZWQgLyBlLnRvdGFsICogMTAwKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMub3B0Lm9uUHJvZ3Jlc3MoZSwgLTEpO1xuICAgIH1cbiAgfVxuXG4gIGhhbmRsZUVycm9yKGUpIHtcbiAgICB0aGlzLm9wdC5vbkVycm9yKGUpO1xuICB9XG5cbiAgaGFuZGxlQWJvcnQoZSkge1xuICAgIHRoaXMub3B0Lm9uQWJvcnQoZSk7XG4gIH1cblxuICBoYW5kbGVMb2FkKGUpIHtcbiAgICB0aGlzLm9wdC5vbkNvbXBsZXRlKGUpO1xuICB9XG59XG5cblhIUi5TdGF0ZSA9IHt9O1xuWydVTklOSVRJQUxJWkVEJywgJ0xPQURJTkcnLCAnTE9BREVEJywgJ0lOVEVSQUNUSVZFJywgJ0NPTVBMRVRFRCddXG4uZm9yRWFjaCgoc3RhdGVOYW1lLCBpKSA9PiB7XG4gIFhIUi5TdGF0ZVtzdGF0ZU5hbWVdID0gaTtcbn0pO1xuXG4vLyBNYWtlIHBhcmFsbGVsIHJlcXVlc3RzIGFuZCBncm91cCB0aGUgcmVzcG9uc2VzLlxuZXhwb3J0IGNsYXNzIFhIUkdyb3VwIHtcblxuICBjb25zdHJ1Y3RvcihvcHQgPSB7fSkge1xuICAgIG9wdCA9IHtcbiAgICAgIHVybHM6IFtdLFxuICAgICAgb25TdWNjZXNzOiBub29wLFxuICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgIGFzeW5jOiB0cnVlLFxuICAgICAgbm9DYWNoZTogZmFsc2UsXG4gICAgICAvLyBib2R5OiBudWxsLFxuICAgICAgc2VuZEFzQmluYXJ5OiBmYWxzZSxcbiAgICAgIHJlc3BvbnNlVHlwZTogZmFsc2UsXG4gICAgICAuLi5vcHRcbiAgICB9O1xuXG4gICAgdmFyIHVybHMgPSBzcGxhdChvcHQudXJscyk7XG4gICAgdGhpcy5yZXFzID0gdXJscy5tYXAoKHVybCwgaSkgPT4gbmV3IFhIUih7XG4gICAgICB1cmw6IHVybCxcbiAgICAgIG1ldGhvZDogb3B0Lm1ldGhvZCxcbiAgICAgIGFzeW5jOiBvcHQuYXN5bmMsXG4gICAgICBub0NhY2hlOiBvcHQubm9DYWNoZSxcbiAgICAgIHNlbmRBc0JpbmFyeTogb3B0LnNlbmRBc0JpbmFyeSxcbiAgICAgIHJlc3BvbnNlVHlwZTogb3B0LnJlc3BvbnNlVHlwZSxcbiAgICAgIGJvZHk6IG9wdC5ib2R5XG4gICAgfSkpO1xuICB9XG5cbiAgYXN5bmMgc2VuZEFzeW5jKCkge1xuICAgIHJldHVybiBhd2FpdCBQcm9taXNlLmFsbCh0aGlzLnJlcXMubWFwKHJlcSA9PiByZXEuc2VuZEFzeW5jKCkpKTtcbiAgfVxuXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBKU09OUChvcHQpIHtcbiAgb3B0ID0gbWVyZ2Uoe1xuICAgIHVybDogJ2h0dHA6Ly8gcGhpbG9nbGpzLm9yZy8nLFxuICAgIGRhdGE6IHt9LFxuICAgIG5vQ2FjaGU6IGZhbHNlLFxuICAgIG9uQ29tcGxldGU6IG5vb3AsXG4gICAgY2FsbGJhY2tLZXk6ICdjYWxsYmFjaydcbiAgfSwgb3B0IHx8IHt9KTtcblxuICB2YXIgaW5kZXggPSBKU09OUC5jb3VudGVyKys7XG4gIC8vIGNyZWF0ZSBxdWVyeSBzdHJpbmdcbiAgdmFyIGRhdGEgPSBbXTtcbiAgZm9yICh2YXIgcHJvcCBpbiBvcHQuZGF0YSkge1xuICAgIGRhdGEucHVzaChwcm9wICsgJz0nICsgb3B0LmRhdGFbcHJvcF0pO1xuICB9XG4gIGRhdGEgPSBkYXRhLmpvaW4oJyYnKTtcbiAgLy8gYXBwZW5kIHVuaXF1ZSBpZCBmb3IgY2FjaGVcbiAgaWYgKG9wdC5ub0NhY2hlKSB7XG4gICAgZGF0YSArPSAoZGF0YS5pbmRleE9mKCc/JykgPj0gMCA/ICcmJyA6ICc/JykgKyB1aWQoKTtcbiAgfVxuICAvLyBjcmVhdGUgc291cmNlIHVybFxuICB2YXIgc3JjID0gb3B0LnVybCArXG4gICAgKG9wdC51cmwuaW5kZXhPZignPycpID4gLTEgPyAnJicgOiAnPycpICtcbiAgICBvcHQuY2FsbGJhY2tLZXkgKyAnPVBoaWxvR0wgSU8uSlNPTlAucmVxdWVzdHMucmVxdWVzdF8nICsgaW5kZXggK1xuICAgIChkYXRhLmxlbmd0aCA+IDAgPyAnJicgKyBkYXRhIDogJycpO1xuXG4gIC8vIGNyZWF0ZSBzY3JpcHRcbiAgdmFyIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICBzY3JpcHQudHlwZSA9ICd0ZXh0L2phdmFzY3JpcHQnO1xuICBzY3JpcHQuc3JjID0gc3JjO1xuXG4gIC8vIGNyZWF0ZSBjYWxsYmFja1xuICBKU09OUC5yZXF1ZXN0c1sncmVxdWVzdF8nICsgaW5kZXhdID0gZnVuY3Rpb24oanNvbikge1xuICAgIG9wdC5vbkNvbXBsZXRlKGpzb24pO1xuICAgIC8vIHJlbW92ZSBzY3JpcHRcbiAgICBpZiAoc2NyaXB0LnBhcmVudE5vZGUpIHtcbiAgICAgIHNjcmlwdC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHNjcmlwdCk7XG4gICAgfVxuICAgIGlmIChzY3JpcHQuY2xlYXJBdHRyaWJ1dGVzKSB7XG4gICAgICBzY3JpcHQuY2xlYXJBdHRyaWJ1dGVzKCk7XG4gICAgfVxuICB9O1xuXG4gIC8vIGluamVjdCBzY3JpcHRcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXS5hcHBlbmRDaGlsZChzY3JpcHQpO1xufVxuXG5KU09OUC5jb3VudGVyID0gMDtcbkpTT05QLnJlcXVlc3RzID0ge307XG5cbi8vIENyZWF0ZXMgYW4gaW1hZ2UtbG9hZGluZyBwcm9taXNlLlxuZnVuY3Rpb24gbG9hZEltYWdlKHNyYykge1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXNvbHZlKGltYWdlKTtcbiAgICB9O1xuICAgIGltYWdlLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoYENvdWxkIG5vdCBsb2FkIGltYWdlICR7c3JjfS5gKSk7XG4gICAgfTtcbiAgICBpbWFnZS5zcmMgPSBzcmM7XG4gIH0pO1xufVxuXG4vLyBMb2FkIG11bHRpcGxlIGltYWdlcyBhc3luYy5cbi8vIHJ5ZTogVE9ETyB0aGlzIG5lZWRzIHRvIGltcGxlbWVudCBmdW5jdGlvbmFsaXR5IGZyb20gdGhlXG4vLyAgICAgICAgICAgb3JpZ2luYWwgSW1hZ2VzIGZ1bmN0aW9uLlxuYXN5bmMgZnVuY3Rpb24gbG9hZEltYWdlcyhzcmNzKSB7XG4gIGxldCBpbWFnZVByb21pc2VzID0gc3Jjcy5tYXAoKHNyYykgPT4gbG9hZEltYWdlKHNyYykpO1xuICBsZXQgcmVzdWx0cyA9IFtdO1xuICBmb3IgKGNvbnN0IGltYWdlUHJvbWlzZSBvZiBpbWFnZVByb21pc2VzKSB7XG4gICAgcmVzdWx0cy5wdXNoKGF3YWl0IGltYWdlUHJvbWlzZSk7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbi8vIC8vIExvYWQgbXVsdGlwbGUgSW1hZ2UgYXNzZXRzIGFzeW5jXG4vLyBleHBvcnQgZnVuY3Rpb24gSW1hZ2VzKG9wdCkge1xuLy8gICBvcHQgPSBtZXJnZSh7XG4vLyAgICAgc3JjOiBbXSxcbi8vICAgICBub0NhY2hlOiBmYWxzZSxcbi8vICAgICBvblByb2dyZXNzOiBub29wLFxuLy8gICAgIG9uQ29tcGxldGU6IG5vb3Bcbi8vICAgfSwgb3B0IHx8IHt9KTtcbi8vXG4vLyAgIGxldCBjb3VudCA9IDA7XG4vLyAgIGxldCBsID0gb3B0LnNyYy5sZW5ndGg7XG4vL1xuLy8gICBsZXQgaW1hZ2VzO1xuLy8gICAvLyBJbWFnZSBvbmxvYWQgaGFuZGxlclxuLy8gICB2YXIgbG9hZCA9ICgpID0+IHtcbi8vICAgICBvcHQub25Qcm9ncmVzcyhNYXRoLnJvdW5kKCsrY291bnQgLyBsICogMTAwKSk7XG4vLyAgICAgaWYgKGNvdW50ID09PSBsKSB7XG4vLyAgICAgICBvcHQub25Db21wbGV0ZShpbWFnZXMpO1xuLy8gICAgIH1cbi8vICAgfTtcbi8vICAgLy8gSW1hZ2UgZXJyb3IgaGFuZGxlclxuLy8gICB2YXIgZXJyb3IgPSAoKSA9PiB7XG4vLyAgICAgaWYgKCsrY291bnQgPT09IGwpIHtcbi8vICAgICAgIG9wdC5vbkNvbXBsZXRlKGltYWdlcyk7XG4vLyAgICAgfVxuLy8gICB9O1xuLy9cbi8vICAgLy8gdWlkIGZvciBpbWFnZSBzb3VyY2VzXG4vLyAgIGNvbnN0IG5vQ2FjaGUgPSBvcHQubm9DYWNoZTtcbi8vICAgY29uc3QgdWlkID0gdWlkKCk7XG4vLyAgIGZ1bmN0aW9uIGdldFN1ZmZpeChzKSB7XG4vLyAgICAgcmV0dXJuIChzLmluZGV4T2YoJz8nKSA+PSAwID8gJyYnIDogJz8nKSArIHVpZDtcbi8vICAgfVxuLy9cbi8vICAgLy8gQ3JlYXRlIGltYWdlIGFycmF5XG4vLyAgIGltYWdlcyA9IG9wdC5zcmMubWFwKChzcmMsIGkpID0+IHtcbi8vICAgICBjb25zdCBpbWcgPSBuZXcgSW1hZ2UoKTtcbi8vICAgICBpbWcuaW5kZXggPSBpO1xuLy8gICAgIGltZy5vbmxvYWQgPSBsb2FkO1xuLy8gICAgIGltZy5vbmVycm9yID0gZXJyb3I7XG4vLyAgICAgaW1nLnNyYyA9IHNyYyArIChub0NhY2hlID8gZ2V0U3VmZml4KHNyYykgOiAnJyk7XG4vLyAgICAgcmV0dXJuIGltZztcbi8vICAgfSk7XG4vL1xuLy8gICByZXR1cm4gaW1hZ2VzO1xuLy8gfVxuXG4vLyBMb2FkIG11bHRpcGxlIHRleHR1cmVzIGZyb20gaW1hZ2VzXG4vLyByeWU6IFRPRE8gdGhpcyBuZWVkcyB0byBpbXBsZW1lbnQgZnVuY3Rpb25hbGl0eSBmcm9tXG4vLyAgICAgICAgICAgdGhlIG9yaWdpbmFsIGxvYWRUZXh0dXJlcyBmdW5jdGlvbi5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsb2FkVGV4dHVyZXMoZ2wsIG9wdCkge1xuICB2YXIgaW1hZ2VzID0gYXdhaXQgbG9hZEltYWdlcyhvcHQuc3JjKTtcbiAgdmFyIHRleHR1cmVzID0gW107XG4gIGltYWdlcy5mb3JFYWNoKChpbWcsIGkpID0+IHtcbiAgICB2YXIgcGFyYW1zID0gQXJyYXkuaXNBcnJheShvcHQucGFyYW1ldGVycykgP1xuICAgICAgb3B0LnBhcmFtZXRlcnNbaV0gOiBvcHQucGFyYW1ldGVycztcbiAgICBwYXJhbXMgPSBwYXJhbXMgPT09IHVuZGVmaW5lZCA/IHt9IDogcGFyYW1zO1xuICAgIHRleHR1cmVzLnB1c2gobmV3IFRleHR1cmUyRChnbCwgbWVyZ2Uoe1xuICAgICAgZGF0YTogaW1nXG4gICAgfSwgcGFyYW1zKSkpO1xuICB9KTtcbiAgcmV0dXJuIHRleHR1cmVzO1xufVxuXG4vLyAvLyBMb2FkIG11bHRpcGxlIHRleHR1cmVzIGZyb20gaW1hZ2VzXG4vLyBleHBvcnQgZnVuY3Rpb24gbG9hZFRleHR1cmVzKG9wdCA9IHt9KSB7XG4vLyAgIG9wdCA9IHtcbi8vICAgICBzcmM6IFtdLFxuLy8gICAgIG5vQ2FjaGU6IGZhbHNlLFxuLy8gICAgIG9uQ29tcGxldGU6IG5vb3AsXG4vLyAgICAgLi4ub3B0XG4vLyAgIH07XG4vL1xuLy8gICBJbWFnZXMoe1xuLy8gICAgIHNyYzogb3B0LnNyYyxcbi8vICAgICBub0NhY2hlOiBvcHQubm9DYWNoZSxcbi8vICAgICBvbkNvbXBsZXRlKGltYWdlcykge1xuLy8gICAgICAgdmFyIHRleHR1cmVzID0ge307XG4vLyAgICAgICBpbWFnZXMuZm9yRWFjaCgoaW1nLCBpKSA9PiB7XG4vLyAgICAgICAgIHRleHR1cmVzW29wdC5pZCAmJiBvcHQuaWRbaV0gfHwgb3B0LnNyYyAmJiBvcHQuc3JjW2ldXSA9IG1lcmdlKHtcbi8vICAgICAgICAgICBkYXRhOiB7XG4vLyAgICAgICAgICAgICB2YWx1ZTogaW1nXG4vLyAgICAgICAgICAgfVxuLy8gICAgICAgICB9LCBvcHQpO1xuLy8gICAgICAgfSk7XG4vLyAgICAgICBhcHAuc2V0VGV4dHVyZXModGV4dHVyZXMpO1xuLy8gICAgICAgb3B0Lm9uQ29tcGxldGUoKTtcbi8vICAgICB9XG4vLyAgIH0pO1xuLy8gfVxuIl19