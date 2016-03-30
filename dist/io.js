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

      return function sendAsync() {
        return ref.apply(this, arguments);
      };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pby5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztzREF3UUEsa0JBQTBCLElBQTFCO1FBQ00sZUFDQSx5RkFDTzs7Ozs7O0FBRlAsNEJBQWdCLEtBQUssR0FBTCxDQUFTLFVBQUMsR0FBRDtxQkFBUyxVQUFVLEdBQVY7YUFBVDtBQUN6QixzQkFBVTs7Ozs7d0JBQ2E7Ozs7Ozs7O0FBQWhCOzJCQUNUOzttQkFBbUI7Ozs7O3lCQUFYOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OENBRUg7Ozs7Ozs7O0dBTlQ7O2tCQUFlOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O3NEQTJEUixrQkFBNEIsRUFBNUIsRUFBZ0MsR0FBaEM7UUFDRCxRQUNBOzs7Ozs7bUJBRGUsV0FBVyxJQUFJLEdBQUo7OztBQUExQjtBQUNBLHVCQUFXOztBQUNmLG1CQUFPLE9BQVAsQ0FBZSxVQUFDLEdBQUQsRUFBTSxDQUFOLEVBQVk7QUFDekIsa0JBQUksU0FBUyxNQUFNLE9BQU4sQ0FBYyxJQUFJLFVBQUosQ0FBZCxHQUNYLElBQUksVUFBSixDQUFlLENBQWYsQ0FEVyxHQUNTLElBQUksVUFBSixDQUZHO0FBR3pCLHVCQUFTLFdBQVcsU0FBWCxHQUF1QixFQUF2QixHQUE0QixNQUE1QixDQUhnQjtBQUl6Qix1QkFBUyxJQUFULENBQWMscUJBQWMsRUFBZCxFQUFrQixrQkFBTTtBQUNwQyxzQkFBTSxHQUFOO2VBRDhCLEVBRTdCLE1BRjZCLENBQWxCLENBQWQsRUFKeUI7YUFBWixDQUFmOzhDQVFPOzs7Ozs7OztHQVhGOztrQkFBZTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FBOUhOOzs7Ozs7Ozs7O0lBOUxIO0FBRVgsV0FGVyxHQUVYLEdBQXNCO1FBQVYsNERBQU0sa0JBQUk7OzBCQUZYLEtBRVc7O0FBQ3BCO0FBQ0UsV0FBSyx3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QUFPLElBQUksS0FBSiwyQkFBa0MsU0FBbEMsQ0FBUCxFQUR5QjtLQUFYLENBTDJCO0FBUTNDLFVBQU0sR0FBTixHQUFZLEdBQVosQ0FSMkM7R0FBMUIsQ0FBbkIsQ0FEc0I7Q0FBeEIiLCJmaWxlIjoiaW8uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBQcm92aWRlcyBsb2FkaW5nIG9mIGFzc2V0cyB3aXRoIFhIUiBhbmQgSlNPTlAgbWV0aG9kcy5cbi8qIGVzbGludC1kaXNhYmxlIGd1YXJkLWZvci1pbiwgY29tcGxleGl0eSAqL1xuXG4vKiBnbG9iYWwgZG9jdW1lbnQsIFhNTEh0dHBSZXF1ZXN0LCBJbWFnZSAqL1xuaW1wb3J0IHt1aWQsIHNwbGF0LCBtZXJnZSwgbm9vcH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQge1RleHR1cmUyRH0gZnJvbSAnLi93ZWJnbCc7XG5cbmV4cG9ydCBjbGFzcyBYSFIge1xuXG4gIGNvbnN0cnVjdG9yKG9wdCA9IHt9KSB7XG4gICAgb3B0ID0ge1xuICAgICAgdXJsOiAnaHR0cDovLyBwaGlsb2dsanMub3JnLycsXG4gICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgYXN5bmM6IHRydWUsXG4gICAgICBub0NhY2hlOiBmYWxzZSxcbiAgICAgIC8vIGJvZHk6IG51bGwsXG4gICAgICBzZW5kQXNCaW5hcnk6IGZhbHNlLFxuICAgICAgcmVzcG9uc2VUeXBlOiBmYWxzZSxcbiAgICAgIG9uUHJvZ3Jlc3M6IG5vb3AsXG4gICAgICBvblN1Y2Nlc3M6IG5vb3AsXG4gICAgICBvbkVycm9yOiBub29wLFxuICAgICAgb25BYm9ydDogbm9vcCxcbiAgICAgIG9uQ29tcGxldGU6IG5vb3AsXG4gICAgICAuLi5vcHRcbiAgICB9O1xuXG4gICAgdGhpcy5vcHQgPSBvcHQ7XG4gICAgdGhpcy5pbml0WEhSKCk7XG4gIH1cblxuICBpbml0WEhSKCkge1xuICAgIGNvbnN0IHJlcSA9IHRoaXMucmVxID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICBbJ1Byb2dyZXNzJywgJ0Vycm9yJywgJ0Fib3J0JywgJ0xvYWQnXS5mb3JFYWNoKGV2ZW50ID0+IHtcbiAgICAgIGlmIChyZXEuYWRkRXZlbnRMaXN0ZW5lcikge1xuICAgICAgICByZXEuYWRkRXZlbnRMaXN0ZW5lcihldmVudC50b0xvd2VyQ2FzZSgpLCBlID0+IHtcbiAgICAgICAgICBzZWxmWydoYW5kbGUnICsgZXZlbnRdKGUpO1xuICAgICAgICB9LCBmYWxzZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXFbJ29uJyArIGV2ZW50LnRvTG93ZXJDYXNlKCldID0gZSA9PiB7XG4gICAgICAgICAgc2VsZlsnaGFuZGxlJyArIGV2ZW50XShlKTtcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHNlbmRBc3luYyhib2R5KSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IHtyZXEsIG9wdH0gPSB0aGlzO1xuICAgICAgY29uc3Qge2FzeW5jfSA9IG9wdDtcblxuICAgICAgaWYgKG9wdC5ub0NhY2hlKSB7XG4gICAgICAgIG9wdC51cmwgKz0gKG9wdC51cmwuaW5kZXhPZignPycpID49IDAgPyAnJicgOiAnPycpICsgdWlkKCk7XG4gICAgICB9XG5cbiAgICAgIHJlcS5vcGVuKG9wdC5tZXRob2QsIG9wdC51cmwsIGFzeW5jKTtcblxuICAgICAgaWYgKG9wdC5yZXNwb25zZVR5cGUpIHtcbiAgICAgICAgcmVxLnJlc3BvbnNlVHlwZSA9IG9wdC5yZXNwb25zZVR5cGU7XG4gICAgICB9XG5cbiAgICAgIGlmIChhc3luYykge1xuICAgICAgICByZXEub25yZWFkeXN0YXRlY2hhbmdlID0gZSA9PiB7XG4gICAgICAgICAgaWYgKHJlcS5yZWFkeVN0YXRlID09PSBYSFIuU3RhdGUuQ09NUExFVEVEKSB7XG4gICAgICAgICAgICBpZiAocmVxLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgICAgIHJlc29sdmUocmVxLnJlc3BvbnNlVHlwZSA/IHJlcS5yZXNwb25zZSA6IHJlcS5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihyZXEuc3RhdHVzKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICBpZiAob3B0LnNlbmRBc0JpbmFyeSkge1xuICAgICAgICByZXEuc2VuZEFzQmluYXJ5KGJvZHkgfHwgb3B0LmJvZHkgfHwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXEuc2VuZChib2R5IHx8IG9wdC5ib2R5IHx8IG51bGwpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWFzeW5jKSB7XG4gICAgICAgIGlmIChyZXEuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICByZXNvbHZlKHJlcS5yZXNwb25zZVR5cGUgPyByZXEucmVzcG9uc2UgOiByZXEucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZWplY3QobmV3IEVycm9yKHJlcS5zdGF0dXMpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgc2VuZChib2R5KSB7XG4gICAgY29uc3Qge3JlcSwgb3B0fSA9IHRoaXM7XG4gICAgY29uc3QgYXN5bmMgPSBvcHQuYXN5bmM7XG5cbiAgICBpZiAob3B0Lm5vQ2FjaGUpIHtcbiAgICAgIG9wdC51cmwgKz0gKG9wdC51cmwuaW5kZXhPZignPycpID49IDAgPyAnJicgOiAnPycpICsgdWlkKCk7XG4gICAgfVxuXG4gICAgcmVxLm9wZW4ob3B0Lm1ldGhvZCwgb3B0LnVybCwgYXN5bmMpO1xuXG4gICAgaWYgKG9wdC5yZXNwb25zZVR5cGUpIHtcbiAgICAgIHJlcS5yZXNwb25zZVR5cGUgPSBvcHQucmVzcG9uc2VUeXBlO1xuICAgIH1cblxuICAgIGlmIChhc3luYykge1xuICAgICAgcmVxLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGUgPT4ge1xuICAgICAgICBpZiAocmVxLnJlYWR5U3RhdGUgPT09IFhIUi5TdGF0ZS5DT01QTEVURUQpIHtcbiAgICAgICAgICBpZiAocmVxLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgICBvcHQub25TdWNjZXNzKHJlcS5yZXNwb25zZVR5cGUgPyByZXEucmVzcG9uc2UgOiByZXEucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3B0Lm9uRXJyb3IocmVxLnN0YXR1cyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmIChvcHQuc2VuZEFzQmluYXJ5KSB7XG4gICAgICByZXEuc2VuZEFzQmluYXJ5KGJvZHkgfHwgb3B0LmJvZHkgfHwgbnVsbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlcS5zZW5kKGJvZHkgfHwgb3B0LmJvZHkgfHwgbnVsbCk7XG4gICAgfVxuXG4gICAgaWYgKCFhc3luYykge1xuICAgICAgaWYgKHJlcS5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICBvcHQub25TdWNjZXNzKHJlcS5yZXNwb25zZVR5cGUgPyByZXEucmVzcG9uc2UgOiByZXEucmVzcG9uc2VUZXh0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9wdC5vbkVycm9yKHJlcS5zdGF0dXMpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHNldFJlcXVlc3RIZWFkZXIoaGVhZGVyLCB2YWx1ZSkge1xuICAgIHRoaXMucmVxLnNldFJlcXVlc3RIZWFkZXIoaGVhZGVyLCB2YWx1ZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBoYW5kbGVQcm9ncmVzcyhlKSB7XG4gICAgaWYgKGUubGVuZ3RoQ29tcHV0YWJsZSkge1xuICAgICAgdGhpcy5vcHQub25Qcm9ncmVzcyhlLCBNYXRoLnJvdW5kKGUubG9hZGVkIC8gZS50b3RhbCAqIDEwMCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm9wdC5vblByb2dyZXNzKGUsIC0xKTtcbiAgICB9XG4gIH1cblxuICBoYW5kbGVFcnJvcihlKSB7XG4gICAgdGhpcy5vcHQub25FcnJvcihlKTtcbiAgfVxuXG4gIGhhbmRsZUFib3J0KGUpIHtcbiAgICB0aGlzLm9wdC5vbkFib3J0KGUpO1xuICB9XG5cbiAgaGFuZGxlTG9hZChlKSB7XG4gICAgdGhpcy5vcHQub25Db21wbGV0ZShlKTtcbiAgfVxufVxuXG5YSFIuU3RhdGUgPSB7fTtcblsnVU5JTklUSUFMSVpFRCcsICdMT0FESU5HJywgJ0xPQURFRCcsICdJTlRFUkFDVElWRScsICdDT01QTEVURUQnXVxuLmZvckVhY2goKHN0YXRlTmFtZSwgaSkgPT4ge1xuICBYSFIuU3RhdGVbc3RhdGVOYW1lXSA9IGk7XG59KTtcblxuLy8gTWFrZSBwYXJhbGxlbCByZXF1ZXN0cyBhbmQgZ3JvdXAgdGhlIHJlc3BvbnNlcy5cbmV4cG9ydCBjbGFzcyBYSFJHcm91cCB7XG5cbiAgY29uc3RydWN0b3Iob3B0ID0ge30pIHtcbiAgICBvcHQgPSB7XG4gICAgICB1cmxzOiBbXSxcbiAgICAgIG9uU3VjY2Vzczogbm9vcCxcbiAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICBhc3luYzogdHJ1ZSxcbiAgICAgIG5vQ2FjaGU6IGZhbHNlLFxuICAgICAgLy8gYm9keTogbnVsbCxcbiAgICAgIHNlbmRBc0JpbmFyeTogZmFsc2UsXG4gICAgICByZXNwb25zZVR5cGU6IGZhbHNlLFxuICAgICAgLi4ub3B0XG4gICAgfTtcblxuICAgIHZhciB1cmxzID0gc3BsYXQob3B0LnVybHMpO1xuICAgIHRoaXMucmVxcyA9IHVybHMubWFwKCh1cmwsIGkpID0+IG5ldyBYSFIoe1xuICAgICAgdXJsOiB1cmwsXG4gICAgICBtZXRob2Q6IG9wdC5tZXRob2QsXG4gICAgICBhc3luYzogb3B0LmFzeW5jLFxuICAgICAgbm9DYWNoZTogb3B0Lm5vQ2FjaGUsXG4gICAgICBzZW5kQXNCaW5hcnk6IG9wdC5zZW5kQXNCaW5hcnksXG4gICAgICByZXNwb25zZVR5cGU6IG9wdC5yZXNwb25zZVR5cGUsXG4gICAgICBib2R5OiBvcHQuYm9keVxuICAgIH0pKTtcbiAgfVxuXG4gIGFzeW5jIHNlbmRBc3luYygpIHtcbiAgICByZXR1cm4gYXdhaXQgUHJvbWlzZS5hbGwodGhpcy5yZXFzLm1hcChyZXEgPT4gcmVxLnNlbmRBc3luYygpKSk7XG4gIH1cblxufVxuXG5leHBvcnQgZnVuY3Rpb24gSlNPTlAob3B0KSB7XG4gIG9wdCA9IG1lcmdlKHtcbiAgICB1cmw6ICdodHRwOi8vIHBoaWxvZ2xqcy5vcmcvJyxcbiAgICBkYXRhOiB7fSxcbiAgICBub0NhY2hlOiBmYWxzZSxcbiAgICBvbkNvbXBsZXRlOiBub29wLFxuICAgIGNhbGxiYWNrS2V5OiAnY2FsbGJhY2snXG4gIH0sIG9wdCB8fCB7fSk7XG5cbiAgdmFyIGluZGV4ID0gSlNPTlAuY291bnRlcisrO1xuICAvLyBjcmVhdGUgcXVlcnkgc3RyaW5nXG4gIHZhciBkYXRhID0gW107XG4gIGZvciAodmFyIHByb3AgaW4gb3B0LmRhdGEpIHtcbiAgICBkYXRhLnB1c2gocHJvcCArICc9JyArIG9wdC5kYXRhW3Byb3BdKTtcbiAgfVxuICBkYXRhID0gZGF0YS5qb2luKCcmJyk7XG4gIC8vIGFwcGVuZCB1bmlxdWUgaWQgZm9yIGNhY2hlXG4gIGlmIChvcHQubm9DYWNoZSkge1xuICAgIGRhdGEgKz0gKGRhdGEuaW5kZXhPZignPycpID49IDAgPyAnJicgOiAnPycpICsgdWlkKCk7XG4gIH1cbiAgLy8gY3JlYXRlIHNvdXJjZSB1cmxcbiAgdmFyIHNyYyA9IG9wdC51cmwgK1xuICAgIChvcHQudXJsLmluZGV4T2YoJz8nKSA+IC0xID8gJyYnIDogJz8nKSArXG4gICAgb3B0LmNhbGxiYWNrS2V5ICsgJz1QaGlsb0dMIElPLkpTT05QLnJlcXVlc3RzLnJlcXVlc3RfJyArIGluZGV4ICtcbiAgICAoZGF0YS5sZW5ndGggPiAwID8gJyYnICsgZGF0YSA6ICcnKTtcblxuICAvLyBjcmVhdGUgc2NyaXB0XG4gIHZhciBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgc2NyaXB0LnR5cGUgPSAndGV4dC9qYXZhc2NyaXB0JztcbiAgc2NyaXB0LnNyYyA9IHNyYztcblxuICAvLyBjcmVhdGUgY2FsbGJhY2tcbiAgSlNPTlAucmVxdWVzdHNbJ3JlcXVlc3RfJyArIGluZGV4XSA9IGZ1bmN0aW9uKGpzb24pIHtcbiAgICBvcHQub25Db21wbGV0ZShqc29uKTtcbiAgICAvLyByZW1vdmUgc2NyaXB0XG4gICAgaWYgKHNjcmlwdC5wYXJlbnROb2RlKSB7XG4gICAgICBzY3JpcHQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzY3JpcHQpO1xuICAgIH1cbiAgICBpZiAoc2NyaXB0LmNsZWFyQXR0cmlidXRlcykge1xuICAgICAgc2NyaXB0LmNsZWFyQXR0cmlidXRlcygpO1xuICAgIH1cbiAgfTtcblxuICAvLyBpbmplY3Qgc2NyaXB0XG4gIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0uYXBwZW5kQ2hpbGQoc2NyaXB0KTtcbn1cblxuSlNPTlAuY291bnRlciA9IDA7XG5KU09OUC5yZXF1ZXN0cyA9IHt9O1xuXG4vLyBDcmVhdGVzIGFuIGltYWdlLWxvYWRpbmcgcHJvbWlzZS5cbmZ1bmN0aW9uIGxvYWRJbWFnZShzcmMpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgIHZhciBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuICAgIGltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmVzb2x2ZShpbWFnZSk7XG4gICAgfTtcbiAgICBpbWFnZS5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICByZWplY3QobmV3IEVycm9yKGBDb3VsZCBub3QgbG9hZCBpbWFnZSAke3NyY30uYCkpO1xuICAgIH07XG4gICAgaW1hZ2Uuc3JjID0gc3JjO1xuICB9KTtcbn1cblxuLy8gTG9hZCBtdWx0aXBsZSBpbWFnZXMgYXN5bmMuXG4vLyByeWU6IFRPRE8gdGhpcyBuZWVkcyB0byBpbXBsZW1lbnQgZnVuY3Rpb25hbGl0eSBmcm9tIHRoZVxuLy8gICAgICAgICAgIG9yaWdpbmFsIEltYWdlcyBmdW5jdGlvbi5cbmFzeW5jIGZ1bmN0aW9uIGxvYWRJbWFnZXMoc3Jjcykge1xuICBsZXQgaW1hZ2VQcm9taXNlcyA9IHNyY3MubWFwKChzcmMpID0+IGxvYWRJbWFnZShzcmMpKTtcbiAgbGV0IHJlc3VsdHMgPSBbXTtcbiAgZm9yIChjb25zdCBpbWFnZVByb21pc2Ugb2YgaW1hZ2VQcm9taXNlcykge1xuICAgIHJlc3VsdHMucHVzaChhd2FpdCBpbWFnZVByb21pc2UpO1xuICB9XG4gIHJldHVybiByZXN1bHRzO1xufVxuXG4vLyAvLyBMb2FkIG11bHRpcGxlIEltYWdlIGFzc2V0cyBhc3luY1xuLy8gZXhwb3J0IGZ1bmN0aW9uIEltYWdlcyhvcHQpIHtcbi8vICAgb3B0ID0gbWVyZ2Uoe1xuLy8gICAgIHNyYzogW10sXG4vLyAgICAgbm9DYWNoZTogZmFsc2UsXG4vLyAgICAgb25Qcm9ncmVzczogbm9vcCxcbi8vICAgICBvbkNvbXBsZXRlOiBub29wXG4vLyAgIH0sIG9wdCB8fCB7fSk7XG4vL1xuLy8gICBsZXQgY291bnQgPSAwO1xuLy8gICBsZXQgbCA9IG9wdC5zcmMubGVuZ3RoO1xuLy9cbi8vICAgbGV0IGltYWdlcztcbi8vICAgLy8gSW1hZ2Ugb25sb2FkIGhhbmRsZXJcbi8vICAgdmFyIGxvYWQgPSAoKSA9PiB7XG4vLyAgICAgb3B0Lm9uUHJvZ3Jlc3MoTWF0aC5yb3VuZCgrK2NvdW50IC8gbCAqIDEwMCkpO1xuLy8gICAgIGlmIChjb3VudCA9PT0gbCkge1xuLy8gICAgICAgb3B0Lm9uQ29tcGxldGUoaW1hZ2VzKTtcbi8vICAgICB9XG4vLyAgIH07XG4vLyAgIC8vIEltYWdlIGVycm9yIGhhbmRsZXJcbi8vICAgdmFyIGVycm9yID0gKCkgPT4ge1xuLy8gICAgIGlmICgrK2NvdW50ID09PSBsKSB7XG4vLyAgICAgICBvcHQub25Db21wbGV0ZShpbWFnZXMpO1xuLy8gICAgIH1cbi8vICAgfTtcbi8vXG4vLyAgIC8vIHVpZCBmb3IgaW1hZ2Ugc291cmNlc1xuLy8gICBjb25zdCBub0NhY2hlID0gb3B0Lm5vQ2FjaGU7XG4vLyAgIGNvbnN0IHVpZCA9IHVpZCgpO1xuLy8gICBmdW5jdGlvbiBnZXRTdWZmaXgocykge1xuLy8gICAgIHJldHVybiAocy5pbmRleE9mKCc/JykgPj0gMCA/ICcmJyA6ICc/JykgKyB1aWQ7XG4vLyAgIH1cbi8vXG4vLyAgIC8vIENyZWF0ZSBpbWFnZSBhcnJheVxuLy8gICBpbWFnZXMgPSBvcHQuc3JjLm1hcCgoc3JjLCBpKSA9PiB7XG4vLyAgICAgY29uc3QgaW1nID0gbmV3IEltYWdlKCk7XG4vLyAgICAgaW1nLmluZGV4ID0gaTtcbi8vICAgICBpbWcub25sb2FkID0gbG9hZDtcbi8vICAgICBpbWcub25lcnJvciA9IGVycm9yO1xuLy8gICAgIGltZy5zcmMgPSBzcmMgKyAobm9DYWNoZSA/IGdldFN1ZmZpeChzcmMpIDogJycpO1xuLy8gICAgIHJldHVybiBpbWc7XG4vLyAgIH0pO1xuLy9cbi8vICAgcmV0dXJuIGltYWdlcztcbi8vIH1cblxuLy8gTG9hZCBtdWx0aXBsZSB0ZXh0dXJlcyBmcm9tIGltYWdlc1xuLy8gcnllOiBUT0RPIHRoaXMgbmVlZHMgdG8gaW1wbGVtZW50IGZ1bmN0aW9uYWxpdHkgZnJvbVxuLy8gICAgICAgICAgIHRoZSBvcmlnaW5hbCBsb2FkVGV4dHVyZXMgZnVuY3Rpb24uXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbG9hZFRleHR1cmVzKGdsLCBvcHQpIHtcbiAgdmFyIGltYWdlcyA9IGF3YWl0IGxvYWRJbWFnZXMob3B0LnNyYyk7XG4gIHZhciB0ZXh0dXJlcyA9IFtdO1xuICBpbWFnZXMuZm9yRWFjaCgoaW1nLCBpKSA9PiB7XG4gICAgdmFyIHBhcmFtcyA9IEFycmF5LmlzQXJyYXkob3B0LnBhcmFtZXRlcnMpID9cbiAgICAgIG9wdC5wYXJhbWV0ZXJzW2ldIDogb3B0LnBhcmFtZXRlcnM7XG4gICAgcGFyYW1zID0gcGFyYW1zID09PSB1bmRlZmluZWQgPyB7fSA6IHBhcmFtcztcbiAgICB0ZXh0dXJlcy5wdXNoKG5ldyBUZXh0dXJlMkQoZ2wsIG1lcmdlKHtcbiAgICAgIGRhdGE6IGltZ1xuICAgIH0sIHBhcmFtcykpKTtcbiAgfSk7XG4gIHJldHVybiB0ZXh0dXJlcztcbn1cblxuLy8gLy8gTG9hZCBtdWx0aXBsZSB0ZXh0dXJlcyBmcm9tIGltYWdlc1xuLy8gZXhwb3J0IGZ1bmN0aW9uIGxvYWRUZXh0dXJlcyhvcHQgPSB7fSkge1xuLy8gICBvcHQgPSB7XG4vLyAgICAgc3JjOiBbXSxcbi8vICAgICBub0NhY2hlOiBmYWxzZSxcbi8vICAgICBvbkNvbXBsZXRlOiBub29wLFxuLy8gICAgIC4uLm9wdFxuLy8gICB9O1xuLy9cbi8vICAgSW1hZ2VzKHtcbi8vICAgICBzcmM6IG9wdC5zcmMsXG4vLyAgICAgbm9DYWNoZTogb3B0Lm5vQ2FjaGUsXG4vLyAgICAgb25Db21wbGV0ZShpbWFnZXMpIHtcbi8vICAgICAgIHZhciB0ZXh0dXJlcyA9IHt9O1xuLy8gICAgICAgaW1hZ2VzLmZvckVhY2goKGltZywgaSkgPT4ge1xuLy8gICAgICAgICB0ZXh0dXJlc1tvcHQuaWQgJiYgb3B0LmlkW2ldIHx8IG9wdC5zcmMgJiYgb3B0LnNyY1tpXV0gPSBtZXJnZSh7XG4vLyAgICAgICAgICAgZGF0YToge1xuLy8gICAgICAgICAgICAgdmFsdWU6IGltZ1xuLy8gICAgICAgICAgIH1cbi8vICAgICAgICAgfSwgb3B0KTtcbi8vICAgICAgIH0pO1xuLy8gICAgICAgYXBwLnNldFRleHR1cmVzKHRleHR1cmVzKTtcbi8vICAgICAgIG9wdC5vbkNvbXBsZXRlKCk7XG4vLyAgICAgfVxuLy8gICB9KTtcbi8vIH1cbiJdfQ==