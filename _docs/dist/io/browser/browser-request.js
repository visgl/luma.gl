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

    /* eslint-disable max-statements */

  }, {
    key: 'sendAsync',
    value: function sendAsync() {
      var _this = this;

      var body = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.body || null;

      return new Promise(function (resolve, reject) {
        try {
          (function () {
            var req = _this.req;
            var method = _this.method;
            var async = _this.async;
            var noCache = _this.noCache;
            var sendAsBinary = _this.sendAsBinary;
            var responseType = _this.responseType;


            var url = noCache ? _this.url + (_this.url.indexOf('?') >= 0 ? '&' : '?') + Date.now() : _this.url;

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
    /* eslint-enable max-statements */

  }]);

  return XHR;
}();

function loadFile(opts) {
  var xhr = new XHR(opts);
  return xhr.sendAsync();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9pby9icm93c2VyL2Jyb3dzZXItcmVxdWVzdC5qcyJdLCJuYW1lcyI6WyJsb2FkRmlsZSIsIm5vb3AiLCJYSFJfU1RBVEVTIiwiVU5JTklUSUFMSVpFRCIsIkxPQURJTkciLCJMT0FERUQiLCJJTlRFUkFDVElWRSIsIkNPTVBMRVRFRCIsIlhIUiIsInVybCIsInBhdGgiLCJtZXRob2QiLCJhc3luYyIsIm5vQ2FjaGUiLCJzZW5kQXNCaW5hcnkiLCJyZXNwb25zZVR5cGUiLCJvblByb2dyZXNzIiwib25TdWNjZXNzIiwib25FcnJvciIsIm9uQWJvcnQiLCJvbkNvbXBsZXRlIiwib3B0Iiwiam9pbiIsInJlcSIsIlhNTEh0dHBSZXF1ZXN0Iiwib25sb2FkIiwiZSIsIm9uZXJyb3IiLCJvbmFib3J0Iiwib25wcm9ncmVzcyIsImxlbmd0aENvbXB1dGFibGUiLCJNYXRoIiwicm91bmQiLCJsb2FkZWQiLCJ0b3RhbCIsImhlYWRlciIsInZhbHVlIiwic2V0UmVxdWVzdEhlYWRlciIsImJvZHkiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsImluZGV4T2YiLCJEYXRlIiwibm93Iiwib3BlbiIsIm9ucmVhZHlzdGF0ZWNoYW5nZSIsInJlYWR5U3RhdGUiLCJzdGF0dXMiLCJyZXNwb25zZSIsInJlc3BvbnNlVGV4dCIsIkVycm9yIiwic2VuZCIsImVycm9yIiwib3B0cyIsInhociIsInNlbmRBc3luYyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7UUE0R2dCQSxRLEdBQUFBLFE7Ozs7OztBQTVHaEI7QUFDQTs7QUFFQTtBQUNBLFNBQVNDLElBQVQsR0FBZ0IsQ0FBRTs7QUFFbEIsSUFBTUMsYUFBYTtBQUNqQkMsaUJBQWUsQ0FERTtBQUVqQkMsV0FBUyxDQUZRO0FBR2pCQyxVQUFRLENBSFM7QUFJakJDLGVBQWEsQ0FKSTtBQUtqQkMsYUFBVztBQUxNLENBQW5COztJQVFNQyxHO0FBQ0oscUJBZUc7QUFBQSxRQWREQyxHQWNDLFFBZERBLEdB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QUM3QixNQUFNQyxNQUFNLElBQUkvQyxHQUFKLENBQVE4QyxJQUFSLENBQVo7QUFDQSxTQUFPQyxJQUFJQyxTQUFKLEVBQVA7QUFDRCIsImZpbGUiOiJicm93c2VyLXJlcXVlc3QuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBTdXBwb3J0cyBsb2FkaW5nIChyZXF1ZXN0aW5nKSBhc3NldHMgd2l0aCBYSFIgKFhtbEh0dHBSZXF1ZXN0KVxuLyogZXNsaW50LWRpc2FibGUgZ3VhcmQtZm9yLWluLCBjb21wbGV4aXR5LCBuby10cnktY2F0Y2ggKi9cblxuLyogZ2xvYmFsIFhNTEh0dHBSZXF1ZXN0ICovXG5mdW5jdGlvbiBub29wKCkge31cblxuY29uc3QgWEhSX1NUQVRFUyA9IHtcbiAgVU5JTklUSUFMSVpFRDogMCxcbiAgTE9BRElORzogMSxcbiAgTE9BREVEOiAyLFxuICBJTlRFUkFDVElWRTogMyxcbiAgQ09NUExFVEVEOiA0XG59O1xuXG5jbGFzcyBYSFIge1xuICBjb25zdHJ1Y3Rvcih7XG4gICAgdXJsLFxuICAgIHBhdGggPSBudWxsLFxuICAgIG1ldGhvZCA9ICdHRVQnLFxuICAgIGFzeW5jID0gdHJ1ZSxcbiAgICBub0NhY2hlID0gZmFsc2UsXG4gICAgLy8gYm9keSA9IG51bGwsXG4gICAgc2VuZEFzQmluYXJ5ID0gZmFsc2UsXG4gICAgcmVzcG9uc2VUeXBlID0gZmFsc2UsXG4gICAgb25Qcm9ncmVzcyA9IG5vb3AsXG4gICAgb25TdWNjZXNzID0gbm9vcCxcbiAgICBvbkVycm9yID0gbm9vcCxcbiAgICBvbkFib3J0ID0gbm9vcCxcbiAgICBvbkNvbXBsZXRlID0gbm9vcCxcbiAgICAuLi5vcHRcbiAgfSkge1xuICAgIHRoaXMudXJsID0gcGF0aCA/IHBhdGguam9pbihwYXRoLCB1cmwpIDogdXJsO1xuICAgIHRoaXMubWV0aG9kID0gbWV0aG9kO1xuICAgIHRoaXMuYXN5bmMgPSBhc3luYztcbiAgICB0aGlzLm5vQ2FjaGUgPSBub0NhY2hlO1xuICAgIHRoaXMuc2VuZEFzQmluYXJ5ID0gc2VuZEFzQmluYXJ5O1xuICAgIHRoaXMucmVzcG9uc2VUeXBlID0gcmVzcG9uc2VUeXBlO1xuXG4gICAgdGhpcy5yZXEgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgIHRoaXMucmVxLm9ubG9hZCA9IGUgPT4gb25Db21wbGV0ZShlKTtcbiAgICB0aGlzLnJlcS5vbmVycm9yID0gZSA9PiBvbkVycm9yKGUpO1xuICAgIHRoaXMucmVxLm9uYWJvcnQgPSBlID0+IG9uQWJvcnQoZSk7XG4gICAgdGhpcy5yZXEub25wcm9ncmVzcyA9IGUgPT4ge1xuICAgICAgaWYgKGUubGVuZ3RoQ29tcHV0YWJsZSkge1xuICAgICAgICBvblByb2dyZXNzKGUsIE1hdGgucm91bmQoZS5sb2FkZWQgLyBlLnRvdGFsICogMTAwKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvblByb2dyZXNzKGUsIC0xKTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgc2V0UmVxdWVzdEhlYWRlcihoZWFkZXIsIHZhbHVlKSB7XG4gICAgdGhpcy5yZXEuc2V0UmVxdWVzdEhlYWRlcihoZWFkZXIsIHZhbHVlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qIGVzbGludC1kaXNhYmxlIG1heC1zdGF0ZW1lbnRzICovXG4gIHNlbmRBc3luYyhib2R5ID0gdGhpcy5ib2R5IHx8IG51bGwpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3Qge1xuICAgICAgICAgIHJlcSwgbWV0aG9kLCBhc3luYywgbm9DYWNoZSwgc2VuZEFzQmluYXJ5LCByZXNwb25zZVR5cGVcbiAgICAgICAgfSA9IHRoaXM7XG5cbiAgICAgICAgY29uc3QgdXJsID0gbm9DYWNoZSA/XG4gICAgICAgICAgdGhpcy51cmwgKyAodGhpcy51cmwuaW5kZXhPZignPycpID49IDAgPyAnJicgOiAnPycpICsgRGF0ZS5ub3coKSA6XG4gICAgICAgICAgdGhpcy51cmw7XG5cbiAgICAgICAgcmVxLm9wZW4obWV0aG9kLCB1cmwsIGFzeW5jKTtcblxuICAgICAgICBpZiAocmVzcG9uc2VUeXBlKSB7XG4gICAgICAgICAgcmVxLnJlc3BvbnNlVHlwZSA9IHJlc3BvbnNlVHlwZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhc3luYykge1xuICAgICAgICAgIHJlcS5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBlID0+IHtcbiAgICAgICAgICAgIGlmIChyZXEucmVhZHlTdGF0ZSA9PT0gWEhSX1NUQVRFUy5DT01QTEVURUQpIHtcbiAgICAgICAgICAgICAgaWYgKHJlcS5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmUocmVxLnJlc3BvbnNlVHlwZSA/IHJlcS5yZXNwb25zZSA6IHJlcS5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoYCR7cmVxLnN0YXR1c306ICR7dXJsfWApKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc2VuZEFzQmluYXJ5KSB7XG4gICAgICAgICAgcmVxLnNlbmRBc0JpbmFyeShib2R5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXEuc2VuZChib2R5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghYXN5bmMpIHtcbiAgICAgICAgICBpZiAocmVxLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgICByZXNvbHZlKHJlcS5yZXNwb25zZVR5cGUgPyByZXEucmVzcG9uc2UgOiByZXEucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihgJHtyZXEuc3RhdHVzfTogJHt1cmx9YCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICAvKiBlc2xpbnQtZW5hYmxlIG1heC1zdGF0ZW1lbnRzICovXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2FkRmlsZShvcHRzKSB7XG4gIGNvbnN0IHhociA9IG5ldyBYSFIob3B0cyk7XG4gIHJldHVybiB4aHIuc2VuZEFzeW5jKCk7XG59XG4iXX0=