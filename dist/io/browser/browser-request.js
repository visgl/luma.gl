'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.loadFile = loadFile;

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Supports loading (requesting) assets with XHR (XmlHttpRequest)
/* eslint-disable guard-for-in, complexity, no-try-catch */

/* global XMLHttpRequest */
function noop() {}

var XHR_STATES = {
  UNINITIALIZED: 0,
  LOADING: 1,
  LOADED: 2,
  INTERACTIVE: 3,
  COMPLETED: 4
};

var XHR = function () {
  function XHR(_ref) {
    var url = _ref.url;
    var _ref$path = _ref.path;
    var path = _ref$path === undefined ? null : _ref$path;
    var _ref$method = _ref.method;
    var method = _ref$method === undefined ? 'GET' : _ref$method;
    var _ref$async = _ref.async;
    var async = _ref$async === undefined ? true : _ref$async;
    var _ref$noCache = _ref.noCache;
    var noCache = _ref$noCache === undefined ? false : _ref$noCache;
    var _ref$sendAsBinary = _ref.sendAsBinary;
    var
    // body = null,
    sendAsBinary = _ref$sendAsBinary === undefined ? false : _ref$sendAsBinary;
    var _ref$responseType = _ref.responseType;
    var responseType = _ref$responseType === undefined ? false : _ref$responseType;
    var _ref$onProgress = _ref.onProgress;
    var onProgress = _ref$onProgress === undefined ? noop : _ref$onProgress;
    var _ref$onSuccess = _ref.onSuccess;
    var onSuccess = _ref$onSuccess === undefined ? noop : _ref$onSuccess;
    var _ref$onError = _ref.onError;
    var onError = _ref$onError === undefined ? noop : _ref$onError;
    var _ref$onAbort = _ref.onAbort;
    var onAbort = _ref$onAbort === undefined ? noop : _ref$onAbort;
    var _ref$onComplete = _ref.onComplete;
    var onComplete = _ref$onComplete === undefined ? noop : _ref$onComplete;

    var opt = _objectWithoutProperties(_ref, ['url', 'path', 'method', 'async', 'noCache', 'sendAsBinary', 'responseType', 'onProgress', 'onSuccess', 'onError', 'onAbort', 'onComplete']);

    _classCallCheck(this, XHR);

    this.url = path ? path.join(path, url) : url;
    this.method = method;
    this.async = async;
    this.noCache = noCache;
    this.sendAsBinary = sendAsBinary;
    this.responseType = responseType;

    this.req = new XMLHttpRequest();

    this.req.onload = function (e) {
      return onComplete(e);
    };
    this.req.onerror = function (e) {
      return onError(e);
    };
    this.req.onabort = function (e) {
      return onAbort(e);
    };
    this.req.onprogress = function (e) {
      if (e.lengthComputable) {
        onProgress(e, Math.round(e.loaded / e.total * 100));
      } else {
        onProgress(e, -1);
      }
    };
  }

  _createClass(XHR, [{
    key: 'setRequestHeader',
    value: function setRequestHeader(header, value) {
      this.req.setRequestHeader(header, value);
      return this;
    }
  }, {
    key: 'sendAsync',
    value: function sendAsync() {
      var _this = this;

      var body = arguments.length <= 0 || arguments[0] === undefined ? this.body || null : arguments[0];

      return new Promise(function (resolve, reject) {
        try {
          (function () {
            var req = _this.req;
            var method = _this.method;
            var async = _this.async;
            var noCache = _this.noCache;
            var sendAsBinary = _this.sendAsBinary;
            var responseType = _this.responseType;


            var url = _this.url;
            if (noCache) {
              url += (url.indexOf('?') >= 0 ? '&' : '?') + Date.now();
            }

            req.open(method, url, async);

            if (responseType) {
              req.responseType = responseType;
            }

            if (async) {
              req.onreadystatechange = function (e) {
                if (req.readyState === XHR_STATES.COMPLETED) {
                  if (req.status === 200) {
                    resolve(req.responseType ? req.response : req.responseText);
                  } else {
                    reject(new Error(req.status + ': ' + url));
                  }
                }
              };
            }

            if (sendAsBinary) {
              req.sendAsBinary(body);
            } else {
              req.send(body);
            }

            if (!async) {
              if (req.status === 200) {
                resolve(req.responseType ? req.response : req.responseText);
              } else {
                reject(new Error(req.status + ': ' + url));
              }
            }
          })();
        } catch (error) {
          reject(error);
        }
      });
    }
  }]);

  return XHR;
}();

function loadFile(opts) {
  var xhr = new XHR(opts);
  return xhr.sendAsync();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9pby9icm93c2VyL2Jyb3dzZXItcmVxdWVzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztRQTJHZ0IsUSxHQUFBLFE7Ozs7Ozs7Ozs7QUF2R2hCLFNBQVMsSUFBVCxHQUFnQixDQUFFOztBQUVsQixJQUFNLGFBQWE7QUFDakIsaUJBQWUsQ0FERTtBQUVqQixXQUFTLENBRlE7QUFHakIsVUFBUSxDQUhTO0FBSWpCLGVBQWEsQ0FKSTtBQUtqQixhQUFXO0FBTE0sQ0FBbkI7O0lBUU0sRztBQUNKLHFCQWVHO0FBQUEsUUFkRCxHQWNDLFFBZEQsR0FjQztBQUFBLHlCQWJELElBYUM7QUFBQSxRQWJELElBYUMsNkJBYk0sSUFhTjtBQUFBLDJCQVpELE1BWUM7QUFBQSxRQVpELE1BWUMsK0JBWlEsS0FZUjtBQUFBLDBCQVhELEtBV0M7QUFBQSxRQVhELEtBV0MsOEJBWE8sSUFXUDtBQUFBLDRCQVZELE9BVUM7QUFBQSxRQVZELE9BVUMsZ0NBVlMsS0FVVDtBQUFBLGlDQVJELFlBUUM7QUFBQTs7QUFSRCxnQkFRQyxxQ0FSYyxLQVFkO0FBQUEsaUNBUEQsWUFPQztBQUFBLFFBUEQsWUFPQyxxQ0FQYyxLQU9kO0FBQUEsK0JBTkQsVUFNQztBQUFBLFFBTkQsVUFNQyxtQ0FOWSxJQU1aO0FBQUEsOEJBTEQsU0FLQztBQUFBLFFBTEQsU0FLQyxrQ0FMVyxJQUtYO0FBQUEsNEJBSkQsT0FJQztBQUFBLFFBSkQsT0FJQyxnQ0FKUyxJQUlUO0FBQUEsNEJBSEQsT0FHQztBQUFBLFFBSEQsT0FHQyxnQ0FIUyxJQUdUO0FBQUEsK0JBRkQsVUFFQztBQUFBLFFBRkQsVUFFQyxtQ0FGWSxJQUVaOztBQUFBLFFBREUsR0FDRjs7QUFBQTs7QUFDRCxTQUFLLEdBQUwsR0FBVyxPQUFPLEtBQUssSUFBTCxDQUFVLElBQVYsRUFBZ0IsR0FBaEIsQ0FBUCxHQUE4QixHQUF6QztBQUNBLFNBQUssTUFBTCxHQUFjLE1BQWQ7QUFDQSxTQUFLLEtB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QVAsRUFBYztBQUNkLGlCQUFPLEtBQVA7QUFDRDtBQUNGLE9BN0NNLENBQVA7QUE4Q0Q7Ozs7OztBQUdJLFNBQVMsUUFBVCxDQUFrQixJQUFsQixFQUF3QjtBQUM3QixNQUFNLE1BQU0sSUFBSSxHQUFKLENBQVEsSUFBUixDQUFaO0FBQ0EsU0FBTyxJQUFJLFNBQUosRUFBUDtBQUNEIiwiZmlsZSI6ImJyb3dzZXItcmVxdWVzdC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFN1cHBvcnRzIGxvYWRpbmcgKHJlcXVlc3RpbmcpIGFzc2V0cyB3aXRoIFhIUiAoWG1sSHR0cFJlcXVlc3QpXG4vKiBlc2xpbnQtZGlzYWJsZSBndWFyZC1mb3ItaW4sIGNvbXBsZXhpdHksIG5vLXRyeS1jYXRjaCAqL1xuXG4vKiBnbG9iYWwgWE1MSHR0cFJlcXVlc3QgKi9cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5jb25zdCBYSFJfU1RBVEVTID0ge1xuICBVTklOSVRJQUxJWkVEOiAwLFxuICBMT0FESU5HOiAxLFxuICBMT0FERUQ6IDIsXG4gIElOVEVSQUNUSVZFOiAzLFxuICBDT01QTEVURUQ6IDRcbn07XG5cbmNsYXNzIFhIUiB7XG4gIGNvbnN0cnVjdG9yKHtcbiAgICB1cmwsXG4gICAgcGF0aCA9IG51bGwsXG4gICAgbWV0aG9kID0gJ0dFVCcsXG4gICAgYXN5bmMgPSB0cnVlLFxuICAgIG5vQ2FjaGUgPSBmYWxzZSxcbiAgICAvLyBib2R5ID0gbnVsbCxcbiAgICBzZW5kQXNCaW5hcnkgPSBmYWxzZSxcbiAgICByZXNwb25zZVR5cGUgPSBmYWxzZSxcbiAgICBvblByb2dyZXNzID0gbm9vcCxcbiAgICBvblN1Y2Nlc3MgPSBub29wLFxuICAgIG9uRXJyb3IgPSBub29wLFxuICAgIG9uQWJvcnQgPSBub29wLFxuICAgIG9uQ29tcGxldGUgPSBub29wLFxuICAgIC4uLm9wdFxuICB9KSB7XG4gICAgdGhpcy51cmwgPSBwYXRoID8gcGF0aC5qb2luKHBhdGgsIHVybCkgOiB1cmw7XG4gICAgdGhpcy5tZXRob2QgPSBtZXRob2Q7XG4gICAgdGhpcy5hc3luYyA9IGFzeW5jO1xuICAgIHRoaXMubm9DYWNoZSA9IG5vQ2FjaGU7XG4gICAgdGhpcy5zZW5kQXNCaW5hcnkgPSBzZW5kQXNCaW5hcnk7XG4gICAgdGhpcy5yZXNwb25zZVR5cGUgPSByZXNwb25zZVR5cGU7XG5cbiAgICB0aGlzLnJlcSA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgdGhpcy5yZXEub25sb2FkID0gZSA9PiBvbkNvbXBsZXRlKGUpO1xuICAgIHRoaXMucmVxLm9uZXJyb3IgPSBlID0+IG9uRXJyb3IoZSk7XG4gICAgdGhpcy5yZXEub25hYm9ydCA9IGUgPT4gb25BYm9ydChlKTtcbiAgICB0aGlzLnJlcS5vbnByb2dyZXNzID0gZSA9PiB7XG4gICAgICBpZiAoZS5sZW5ndGhDb21wdXRhYmxlKSB7XG4gICAgICAgIG9uUHJvZ3Jlc3MoZSwgTWF0aC5yb3VuZChlLmxvYWRlZCAvIGUudG90YWwgKiAxMDApKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG9uUHJvZ3Jlc3MoZSwgLTEpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBzZXRSZXF1ZXN0SGVhZGVyKGhlYWRlciwgdmFsdWUpIHtcbiAgICB0aGlzLnJlcS5zZXRSZXF1ZXN0SGVhZGVyKGhlYWRlciwgdmFsdWUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2VuZEFzeW5jKGJvZHkgPSB0aGlzLmJvZHkgfHwgbnVsbCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgcmVxLCBtZXRob2QsIGFzeW5jLCBub0NhY2hlLCBzZW5kQXNCaW5hcnksIHJlc3BvbnNlVHlwZVxuICAgICAgICB9ID0gdGhpcztcblxuICAgICAgICBsZXQgdXJsID0gdGhpcy51cmw7XG4gICAgICAgIGlmIChub0NhY2hlKSB7XG4gICAgICAgICAgdXJsICs9ICh1cmwuaW5kZXhPZignPycpID49IDAgPyAnJicgOiAnPycpICsgRGF0ZS5ub3coKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlcS5vcGVuKG1ldGhvZCwgdXJsLCBhc3luYyk7XG5cbiAgICAgICAgaWYgKHJlc3BvbnNlVHlwZSkge1xuICAgICAgICAgIHJlcS5yZXNwb25zZVR5cGUgPSByZXNwb25zZVR5cGU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYXN5bmMpIHtcbiAgICAgICAgICByZXEub25yZWFkeXN0YXRlY2hhbmdlID0gZSA9PiB7XG4gICAgICAgICAgICBpZiAocmVxLnJlYWR5U3RhdGUgPT09IFhIUl9TVEFURVMuQ09NUExFVEVEKSB7XG4gICAgICAgICAgICAgIGlmIChyZXEuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlcS5yZXNwb25zZVR5cGUgPyByZXEucmVzcG9uc2UgOiByZXEucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKGAke3JlcS5zdGF0dXN9OiAke3VybH1gKSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNlbmRBc0JpbmFyeSkge1xuICAgICAgICAgIHJlcS5zZW5kQXNCaW5hcnkoYm9keSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVxLnNlbmQoYm9keSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWFzeW5jKSB7XG4gICAgICAgICAgaWYgKHJlcS5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgcmVzb2x2ZShyZXEucmVzcG9uc2VUeXBlID8gcmVxLnJlc3BvbnNlIDogcmVxLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoYCR7cmVxLnN0YXR1c306ICR7dXJsfWApKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRGaWxlKG9wdHMpIHtcbiAgY29uc3QgeGhyID0gbmV3IFhIUihvcHRzKTtcbiAgcmV0dXJuIHhoci5zZW5kQXN5bmMoKTtcbn1cbiJdfQ==