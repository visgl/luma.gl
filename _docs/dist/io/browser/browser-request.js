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
    var sendAsBinary = _ref$sendAsBinary === undefined ? false : _ref$sendAsBinary;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9pby9icm93c2VyL2Jyb3dzZXItcmVxdWVzdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztRQTJHZ0IsUSxHQUFBLFE7Ozs7OztBQTNHaEI7QUFDQTs7QUFFQTtBQUNBLFNBQVMsSUFBVCxHQUFnQixDQUFFOztBQUVsQixJQUFNLGFBQWE7QUFDakIsaUJBQWUsQ0FERTtBQUVqQixXQUFTLENBRlE7QUFHakIsVUFBUSxDQUhTO0FBSWpCLGVBQWEsQ0FKSTtBQUtqQixhQUFXO0FBTE0sQ0FBbkI7O0lBUU0sRztBQUNKLHFCQWVHO0FBQUEsUUFkRCxHQWNDLFFBZEQsR0FjQztBQUFBLHlCQWJELElBYUM7QUFBQSxRQWJELElBYUMsNkJBYk0sSUFhTjtBQUFBLDJCQVpELE1BWUM7QUFBQSxRQVpELE1BWUMsK0JBWlEsS0FZUjtBQUFBLDBCQVhELEtBV0M7QUFBQSxRQVhELEtBV0MsOEJBWE8sSUFXUDtBQUFBLDRCQVZELE9BVUM7QUFBQSxRQVZELE9BVUMsZ0NBVlMsS0FVVDtBQUFBLGlDQVJELFlBUUM7QUFBQSxRQVJELFlBUUMscUNBUmMsS0FRZDtBQUFBLGlDQVBELFlBT0M7QUFBQSxRQVBELFlBT0MscUNBUGMsS0FPZDtBQUFBLCtCQU5ELFVBTUM7QUFBQSxRQU5ELFVBTUMsbUNBTlksSUFNWjtBQUFBLDhCQUxELFNBS0M7QUFBQSxRQUxELFNBS0Msa0NBTFcsSUFLWDtBQUFBLDRCQUpELE9BSUM7QUFBQSxRQUpELE9BSUMsZ0NBSlMsSUFJVDtBQUFBLDRCQUhELE9BR0M7QUFBQSxRQUhELE9BR0MsZ0NBSFMsSUFHVDtBQUFBLCtCQUZELFVBRUM7QUFBQSxRQUZELFVBRUMsbUNBRlksSUFFWjs7QUFBQSxRQURFLEdBQ0Y7O0FBQUE7O0FBQ0QsU0FBSyxHQUFMLEdBQVcsT0FBTyxLQUFLLElBQUwsQ0FBVSxJQUFWLEVBQWdCLEdBQWhCLENBQVAsR0FBOEIsR0FBekM7QUFDQSxTQUFLLE1BQUwsR0FBYyxNQUFkO0FBQ0EsU0FBSyxLQUFMLEdBQWEsS0FBYjtBQUNBLFNBQUssT0FBTCxHQUFlLE9BQWY7QUFDQSxTQUFLLFlBQUwsR0FBb0IsWUFBcEI7QUFDQSxTQUFLLFlBQUwsR0FBb0IsWUFBcEI7O0FBRUEsU0FBSyxHQUFMLEdBQVcsSUFBSSxjQUFKLEVBQVg7O0FBRUEsU0FBSyxHQUFMLENBQVMsTUFBVCxHQUFrQjtBQUFBLGFBQUssV0FBVyxDQUFYLENBQUw7QUFBQSxLQUFsQjtBQUNBLFNBQUssR0FBTCxDQUFTLE9BQVQsR0FBbUI7QUFBQSxhQUFLLFFBQVEsQ0FBUixDQUFMO0FBQUEsS0FBbkI7QUFDQSxTQUFLLEdBQUwsQ0FBUyxPQUFULEdBQW1CO0FBQUEsYUFBSyxRQUFRLENBQVIsQ0FBTDtBQUFBLEtBQW5CO0FBQ0EsU0FBSyxHQUFMLENBQVMsVUFBVCxHQUFzQixhQUFLO0FBQ3pCLFVBQUksRUFBRSxnQkFBTixFQUF3QjtBQUN0QixtQkFBVyxDQUFYLEVBQWMsS0FBSyxLQUFMLENBQVcsRUFBRSxNQUFGLEdBQVcsRUFBRSxLQUFiLEdBQXFCLEdBQWhDLENBQWQ7QUFDRCxPQUZELE1BRU87QUFDTCxtQkFBVyxDQUFYLEVBQWMsQ0FBQyxDQUFmO0FBQ0Q7QUFDRixLQU5EO0FBT0Q7Ozs7cUNBRWdCLE0sRUFBUSxLLEVBQU87QUFDOUIsV0FBSyxHQUFMLENBQVMsZ0JBQVQsQ0FBMEIsTUFBMUIsRUFBa0MsS0FBbEM7QUFDQSxhQUFPLElBQVA7QUFDRDs7O2dDQUVtQztBQUFBOztBQUFBLFVBQTFCLElBQTBCLHlEQUFuQixLQUFLLElBQUwsSUFBYSxJQUFNOztBQUNsQyxhQUFPLElBQUksT0FBSixDQUFZLFVBQUMsT0FBRCxFQUFVLE1BQVYsRUFBcUI7QUFDdEMsWUFBSTtBQUFBO0FBQUEsZ0JBRUEsR0FGQSxTQUVBLEdBRkE7QUFBQSxnQkFFSyxNQUZMLFNBRUssTUFGTDtBQUFBLGdCQUVhLEtBRmIsU0FFYSxLQUZiO0FBQUEsZ0JBRW9CLE9BRnBCLFNBRW9CLE9BRnBCO0FBQUEsZ0JBRTZCLFlBRjdCLFNBRTZCLFlBRjdCO0FBQUEsZ0JBRTJDLFlBRjNDLFNBRTJDLFlBRjNDOzs7QUFLRixnQkFBSSxNQUFNLE1BQUssR0FBZjtBQUNBLGdCQUFJLE9BQUosRUFBYTtBQUNYLHFCQUFPLENBQUMsSUFBSSxPQUFKLENBQVksR0FBWixLQUFvQixDQUFwQixHQUF3QixHQUF4QixHQUE4QixHQUEvQixJQUFzQyxLQUFLLEdBQUwsRUFBN0M7QUFDRDs7QUFFRCxnQkFBSSxJQUFKLENBQVMsTUFBVCxFQUFpQixHQUFqQixFQUFzQixLQUF0Qjs7QUFFQSxnQkFBSSxZQUFKLEVBQWtCO0FBQ2hCLGtCQUFJLFlBQUosR0FBbUIsWUFBbkI7QUFDRDs7QUFFRCxnQkFBSSxLQUFKLEVBQVc7QUFDVCxrQkFBSSxrQkFBSixHQUF5QixhQUFLO0FBQzVCLG9CQUFJLElBQUksVUFBSixLQUFtQixXQUFXLFNBQWxDLEVBQTZDO0FBQzNDLHNCQUFJLElBQUksTUFBSixLQUFlLEdBQW5CLEVBQXdCO0FBQ3RCLDRCQUFRLElBQUksWUFBSixHQUFtQixJQUFJLFFBQXZCLEdBQWtDLElBQUksWUFBOUM7QUFDRCxtQkFGRCxNQUVPO0FBQ0wsMkJBQU8sSUFBSSxLQUFKLENBQWEsSUFBSSxNQUFqQixVQUE0QixHQUE1QixDQUFQO0FBQ0Q7QUFDRjtBQUNGLGVBUkQ7QUFTRDs7QUFFRCxnQkFBSSxZQUFKLEVBQWtCO0FBQ2hCLGtCQUFJLFlBQUosQ0FBaUIsSUFBakI7QUFDRCxhQUZELE1BRU87QUFDTCxrQkFBSSxJQUFKLENBQVMsSUFBVDtBQUNEOztBQUVELGdCQUFJLENBQUMsS0FBTCxFQUFZO0FBQ1Ysa0JBQUksSUFBSSxNQUFKLEtBQWUsR0FBbkIsRUFBd0I7QUFDdEIsd0JBQVEsSUFBSSxZQUFKLEdBQW1CLElBQUksUUFBdkIsR0FBa0MsSUFBSSxZQUE5QztBQUNELGVBRkQsTUFFTztBQUNMLHVCQUFPLElBQUksS0FBSixDQUFhLElBQUksTUFBakIsVUFBNEIsR0FBNUIsQ0FBUDtBQUNEO0FBQ0Y7QUF4Q0M7QUF5Q0gsU0F6Q0QsQ0F5Q0UsT0FBTyxLQUFQLEVBQWM7QUFDZCxpQkFBTyxLQUFQO0FBQ0Q7QUFDRixPQTdDTSxDQUFQO0FBOENEOzs7Ozs7QUFHSSxTQUFTLFFBQVQsQ0FBa0IsSUFBbEIsRUFBd0I7QUFDN0IsTUFBTSxNQUFNLElBQUksR0FBSixDQUFRLElBQVIsQ0FBWjtBQUNBLFNBQU8sSUFBSSxTQUFKLEVBQVA7QUFDRCIsImZpbGUiOiJicm93c2VyLXJlcXVlc3QuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBTdXBwb3J0cyBsb2FkaW5nIChyZXF1ZXN0aW5nKSBhc3NldHMgd2l0aCBYSFIgKFhtbEh0dHBSZXF1ZXN0KVxuLyogZXNsaW50LWRpc2FibGUgZ3VhcmQtZm9yLWluLCBjb21wbGV4aXR5LCBuby10cnktY2F0Y2ggKi9cblxuLyogZ2xvYmFsIFhNTEh0dHBSZXF1ZXN0ICovXG5mdW5jdGlvbiBub29wKCkge31cblxuY29uc3QgWEhSX1NUQVRFUyA9IHtcbiAgVU5JTklUSUFMSVpFRDogMCxcbiAgTE9BRElORzogMSxcbiAgTE9BREVEOiAyLFxuICBJTlRFUkFDVElWRTogMyxcbiAgQ09NUExFVEVEOiA0XG59O1xuXG5jbGFzcyBYSFIge1xuICBjb25zdHJ1Y3Rvcih7XG4gICAgdXJsLFxuICAgIHBhdGggPSBudWxsLFxuICAgIG1ldGhvZCA9ICdHRVQnLFxuICAgIGFzeW5jID0gdHJ1ZSxcbiAgICBub0NhY2hlID0gZmFsc2UsXG4gICAgLy8gYm9keSA9IG51bGwsXG4gICAgc2VuZEFzQmluYXJ5ID0gZmFsc2UsXG4gICAgcmVzcG9uc2VUeXBlID0gZmFsc2UsXG4gICAgb25Qcm9ncmVzcyA9IG5vb3AsXG4gICAgb25TdWNjZXNzID0gbm9vcCxcbiAgICBvbkVycm9yID0gbm9vcCxcbiAgICBvbkFib3J0ID0gbm9vcCxcbiAgICBvbkNvbXBsZXRlID0gbm9vcCxcbiAgICAuLi5vcHRcbiAgfSkge1xuICAgIHRoaXMudXJsID0gcGF0aCA/IHBhdGguam9pbihwYXRoLCB1cmwpIDogdXJsO1xuICAgIHRoaXMubWV0aG9kID0gbWV0aG9kO1xuICAgIHRoaXMuYXN5bmMgPSBhc3luYztcbiAgICB0aGlzLm5vQ2FjaGUgPSBub0NhY2hlO1xuICAgIHRoaXMuc2VuZEFzQmluYXJ5ID0gc2VuZEFzQmluYXJ5O1xuICAgIHRoaXMucmVzcG9uc2VUeXBlID0gcmVzcG9uc2VUeXBlO1xuXG4gICAgdGhpcy5yZXEgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgIHRoaXMucmVxLm9ubG9hZCA9IGUgPT4gb25Db21wbGV0ZShlKTtcbiAgICB0aGlzLnJlcS5vbmVycm9yID0gZSA9PiBvbkVycm9yKGUpO1xuICAgIHRoaXMucmVxLm9uYWJvcnQgPSBlID0+IG9uQWJvcnQoZSk7XG4gICAgdGhpcy5yZXEub25wcm9ncmVzcyA9IGUgPT4ge1xuICAgICAgaWYgKGUubGVuZ3RoQ29tcHV0YWJsZSkge1xuICAgICAgICBvblByb2dyZXNzKGUsIE1hdGgucm91bmQoZS5sb2FkZWQgLyBlLnRvdGFsICogMTAwKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvblByb2dyZXNzKGUsIC0xKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgc2V0UmVxdWVzdEhlYWRlcihoZWFkZXIsIHZhbHVlKSB7XG4gICAgdGhpcy5yZXEuc2V0UmVxdWVzdEhlYWRlcihoZWFkZXIsIHZhbHVlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNlbmRBc3luYyhib2R5ID0gdGhpcy5ib2R5IHx8IG51bGwpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgIHJlcSwgbWV0aG9kLCBhc3luYywgbm9DYWNoZSwgc2VuZEFzQmluYXJ5LCByZXNwb25zZVR5cGVcbiAgICAgICAgfSA9IHRoaXM7XG5cbiAgICAgICAgbGV0IHVybCA9IHRoaXMudXJsO1xuICAgICAgICBpZiAobm9DYWNoZSkge1xuICAgICAgICAgIHVybCArPSAodXJsLmluZGV4T2YoJz8nKSA+PSAwID8gJyYnIDogJz8nKSArIERhdGUubm93KCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXEub3BlbihtZXRob2QsIHVybCwgYXN5bmMpO1xuXG4gICAgICAgIGlmIChyZXNwb25zZVR5cGUpIHtcbiAgICAgICAgICByZXEucmVzcG9uc2VUeXBlID0gcmVzcG9uc2VUeXBlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGFzeW5jKSB7XG4gICAgICAgICAgcmVxLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGUgPT4ge1xuICAgICAgICAgICAgaWYgKHJlcS5yZWFkeVN0YXRlID09PSBYSFJfU1RBVEVTLkNPTVBMRVRFRCkge1xuICAgICAgICAgICAgICBpZiAocmVxLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZXEucmVzcG9uc2VUeXBlID8gcmVxLnJlc3BvbnNlIDogcmVxLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihgJHtyZXEuc3RhdHVzfTogJHt1cmx9YCkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzZW5kQXNCaW5hcnkpIHtcbiAgICAgICAgICByZXEuc2VuZEFzQmluYXJ5KGJvZHkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlcS5zZW5kKGJvZHkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFhc3luYykge1xuICAgICAgICAgIGlmIChyZXEuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgIHJlc29sdmUocmVxLnJlc3BvbnNlVHlwZSA/IHJlcS5yZXNwb25zZSA6IHJlcS5yZXNwb25zZVRleHQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZWplY3QobmV3IEVycm9yKGAke3JlcS5zdGF0dXN9OiAke3VybH1gKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2FkRmlsZShvcHRzKSB7XG4gIGNvbnN0IHhociA9IG5ldyBYSFIob3B0cyk7XG4gIHJldHVybiB4aHIuc2VuZEFzeW5jKCk7XG59XG4iXX0=