'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.loadFiles = loadFiles;
exports.loadImages = loadImages;
exports.loadTextures = loadTextures;
exports.loadProgram = loadProgram;
exports.loadModel = loadModel;
exports.parseModel = parseModel;

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _platform = require('./platform');

var _webgl = require('../webgl');

var _core = require('../core');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; } /* eslint-disable guard-for-in, complexity, no-try-catch */


function noop() {}

/*
 * Loads (Requests) multiple files asynchronously
 */
function loadFiles(_ref) {
  var urls = _ref.urls;
  var _ref$onProgress = _ref.onProgress;
  var onProgress = _ref$onProgress === undefined ? noop : _ref$onProgress;

  var opts = _objectWithoutProperties(_ref, ['urls', 'onProgress']);

  (0, _assert2.default)(urls.every(function (url) {
    return typeof url === 'string';
  }), 'loadImages: {urls} must be array of strings');
  var count = 0;
  return Promise.all(urls.map(function (url) {
    var promise = (0, _platform.loadFile)(_extends({ url: url }, opts));
    promise.then(function (file) {
      return onProgress({
        progress: ++count / urls.length,
        count: count,
        total: urls.length,
        url: url
      });
    });
    return promise;
  }));
}

/*
 * Loads (requests) multiple images asynchronously
 */
function loadImages(_ref2) {
  var urls = _ref2.urls;
  var _ref2$onProgress = _ref2.onProgress;
  var onProgress = _ref2$onProgress === undefined ? noop : _ref2$onProgress;

  var opts = _objectWithoutProperties(_ref2, ['urls', 'onProgress']);

  (0, _assert2.default)(urls.every(function (url) {
    return typeof url === 'string';
  }), 'loadImages: {urls} must be array of strings');
  var count = 0;
  return Promise.all(urls.map(function (url) {
    var promise = (0, _platform.loadImage)(url);
    promise.then(function (file) {
      return onProgress({
        progress: ++count / urls.length,
        count: count,
        total: urls.length,
        url: url
      });
    });
    return promise;
  }));
}

function loadTextures(gl, _ref3) {
  var urls = _ref3.urls;
  var _ref3$onProgress = _ref3.onProgress;
  var onProgress = _ref3$onProgress === undefined ? noop : _ref3$onProgress;

  var opts = _objectWithoutProperties(_ref3, ['urls', 'onProgress']);

  (0, _assert2.default)(urls.every(function (url) {
    return typeof url === 'string';
  }), 'loadTextures: {urls} must be array of strings');
  return loadImages(_extends({ urls: urls, onProgress: onProgress }, opts)).then(function (images) {
    return images.map(function (img, i) {
      var params = Array.isArray(opts.parameters) ? opts.parameters[i] : opts.parameters;
      params = params === undefined ? {} : params;
      return new _webgl.Texture2D(gl, _extends({
        id: urls[i]
      }, params, {
        data: img
      }));
    });
  });
}

function loadProgram(gl, _ref4) {
  var vs = _ref4.vs;
  var fs = _ref4.fs;
  var _ref4$onProgress = _ref4.onProgress;
  var onProgress = _ref4$onProgress === undefined ? noop : _ref4$onProgress;

  var opts = _objectWithoutProperties(_ref4, ['vs', 'fs', 'onProgress']);

  return loadFiles(_extends({ urls: [vs, fs], onProgress: onProgress }, opts)).then(function (_ref5) {
    var _ref6 = _slicedToArray(_ref5, 2);

    var vsText = _ref6[0];
    var fsText = _ref6[1];

    return new _webgl.Program(gl, _extends({ vs: vsText, fs: fsText }, opts));
  });
}

// Loads a simple JSON format
function loadModel(gl, _ref7) {
  var url = _ref7.url;
  var _ref7$onProgress = _ref7.onProgress;
  var onProgress = _ref7$onProgress === undefined ? noop : _ref7$onProgress;

  var opts = _objectWithoutProperties(_ref7, ['url', 'onProgress']);

  return loadFiles(_extends({ urls: [url], onProgress: onProgress }, opts)).then(function (_ref8) {
    var _ref9 = _slicedToArray(_ref8, 1);

    var file = _ref9[0];

    return parseModel(gl, _extends({ file: file }, opts));
  });
}

function parseModel(gl, _ref10) {
  var file = _ref10.file;
  var _ref10$program = _ref10.program;
  var program = _ref10$program === undefined ? new _webgl.Program(gl) : _ref10$program;

  var opts = _objectWithoutProperties(_ref10, ['file', 'program']);

  var json = typeof file === 'string' ? parseJSON(file) : file;
  // Remove any attributes so that we can create a geometry
  // TODO - change format to put these in geometry sub object?
  var attributes = {};
  var modelOptions = {};
  for (var key in json) {
    var value = json[key];
    if (Array.isArray(value)) {
      attributes[key] = key === 'indices' ? new Uint16Array(value) : new Float32Array(value);
    } else {
      modelOptions[key] = value;
    }
  }

  return new _core.Model(_extends({
    program: program,
    geometry: new _core.Geometry({ attributes: attributes })
  }, modelOptions, opts));
}

function parseJSON(file) {
  try {
    return JSON.parse(file);
  } catch (error) {
    throw new Error('Failed to parse JSON: ' + error);
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9pby9sb2FkLWZpbGVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7UUFXZ0IsUyxHQUFBLFM7UUFxQkEsVSxHQUFBLFU7UUFrQkEsWSxHQUFBLFk7UUFnQkEsVyxHQUFBLFc7UUFRQSxTLEdBQUEsUztRQVdBLFUsR0FBQSxVOztBQXBGaEI7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs2TkFKQTs7O0FBTUEsU0FBUyxJQUFULEdBQWdCLENBQUU7O0FBRWxCOzs7QUFHTyxTQUFTLFNBQVQsT0FBdUQ7QUFBQSxNQUFuQyxJQUFtQyxRQUFuQyxJQUFtQztBQUFBLDZCQUE3QixVQUE2QjtBQUFBLE1BQTdCLFVBQTZCLG1DQUFoQixJQUFnQjs7QUFBQSxNQUFQLElBQU87O0FBQzVELHdCQUFPLEtBQUssS0FBTCxDQUFXO0FBQUEsV0FBTyxPQUFPLEdBQVAsS0FBZSxRQUF0QjtBQUFBLEdBQVgsQ0FBUCxFQUNFLDZDQURGO0FBRUEsTUFBSSxRQUFRLENBQVo7QUFDQSxTQUFPLFFBQVEsR0FBUixDQUFZLEtBQUssR0FBTCxDQUNqQixlQUFPO0FBQ0wsUUFBTSxVQUFVLG1DQUFVLFFBQVYsSUFBa0IsSUFBbEIsRUFBaEI7QUFDQSxZQUFRLElBQVIsQ0FBYTtBQUFBLGFBQVEsV0FBVztBQUM5QixrQkFBVSxFQUFFLEtBQUYsR0FBVSxLQUFLLE1BREs7QUFFOUIsb0JBRjhCO0FBRzlCLGVBQU8sS0FBSyxNQUhrQjtBQUk5QjtBQUo4QixPQUFYLENBQVI7QUFBQSxLQUFiO0FBTUEsV0FBTyxPQUFQO0FBQ0QsR0FWZ0IsQ0FBWixDQUFQO0FBWUQ7O0FBRUQ7OztBQUdPLFNBQVMsVUFBVCxRQUF3RDtBQUFBLE1BQW5DLElBQW1DLFNBQW5DLElBQW1DO0FBQUEsK0JBQTdCLFVBQTZCO0FBQUEsTUFBN0IsVUFBNkIsb0NBQWhCLElBQWdCOztBQUFBLE1BQVAsSUFBTzs7QUFDN0Qsd0JBQU8sS0FBSyxLQUFMLENBQVc7QUFBQSxXQUFPLE9B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bkI7QUFDQSxNQUFNLGVBQWUsRUFBckI7QUFDQSxPQUFLLElBQU0sR0FBWCxJQUFrQixJQUFsQixFQUF3QjtBQUN0QixRQUFNLFFBQVEsS0FBSyxHQUFMLENBQWQ7QUFDQSxRQUFJLE1BQU0sT0FBTixDQUFjLEtBQWQsQ0FBSixFQUEwQjtBQUN4QixpQkFBVyxHQUFYLElBQWtCLFFBQVEsU0FBUixHQUNoQixJQUFJLFdBQUosQ0FBZ0IsS0FBaEIsQ0FEZ0IsR0FDUyxJQUFJLFlBQUosQ0FBaUIsS0FBakIsQ0FEM0I7QUFFRCxLQUhELE1BR087QUFDTCxtQkFBYSxHQUFiLElBQW9CLEtBQXBCO0FBQ0Q7QUFDRjs7QUFFRCxTQUFPO0FBQ0wsb0JBREs7QUFFTCxjQUFVLG1CQUFhLEVBQUMsc0JBQUQsRUFBYjtBQUZMLEtBR0YsWUFIRSxFQUlGLElBSkUsRUFBUDtBQU1EOztBQUVELFNBQVMsU0FBVCxDQUFtQixJQUFuQixFQUF5QjtBQUN2QixNQUFJO0FBQ0YsV0FBTyxLQUFLLEtBQUwsQ0FBVyxJQUFYLENBQVA7QUFDRCxHQUZELENBRUUsT0FBTyxLQUFQLEVBQWM7QUFDZCxVQUFNLElBQUksS0FBSiw0QkFBbUMsS0FBbkMsQ0FBTjtBQUNEO0FBQ0YiLCJmaWxlIjoibG9hZC1maWxlcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIGd1YXJkLWZvci1pbiwgY29tcGxleGl0eSwgbm8tdHJ5LWNhdGNoICovXG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5pbXBvcnQge2xvYWRGaWxlLCBsb2FkSW1hZ2V9IGZyb20gJy4vcGxhdGZvcm0nO1xuaW1wb3J0IHtQcm9ncmFtLCBUZXh0dXJlMkR9IGZyb20gJy4uL3dlYmdsJztcbmltcG9ydCB7R2VvbWV0cnksIE1vZGVsfSBmcm9tICcuLi9jb3JlJztcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbi8qXG4gKiBMb2FkcyAoUmVxdWVzdHMpIG11bHRpcGxlIGZpbGVzIGFzeW5jaHJvbm91c2x5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkRmlsZXMoe3VybHMsIG9uUHJvZ3Jlc3MgPSBub29wLCAuLi5vcHRzfSkge1xuICBhc3NlcnQodXJscy5ldmVyeSh1cmwgPT4gdHlwZW9mIHVybCA9PT0gJ3N0cmluZycpLFxuICAgICdsb2FkSW1hZ2VzOiB7dXJsc30gbXVzdCBiZSBhcnJheSBvZiBzdHJpbmdzJyk7XG4gIGxldCBjb3VudCA9IDA7XG4gIHJldHVybiBQcm9taXNlLmFsbCh1cmxzLm1hcChcbiAgICB1cmwgPT4ge1xuICAgICAgY29uc3QgcHJvbWlzZSA9IGxvYWRGaWxlKHt1cmwsIC4uLm9wdHN9KTtcbiAgICAgIHByb21pc2UudGhlbihmaWxlID0+IG9uUHJvZ3Jlc3Moe1xuICAgICAgICBwcm9ncmVzczogKytjb3VudCAvIHVybHMubGVuZ3RoLFxuICAgICAgICBjb3VudCxcbiAgICAgICAgdG90YWw6IHVybHMubGVuZ3RoLFxuICAgICAgICB1cmxcbiAgICAgIH0pKTtcbiAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH1cbiAgKSk7XG59XG5cbi8qXG4gKiBMb2FkcyAocmVxdWVzdHMpIG11bHRpcGxlIGltYWdlcyBhc3luY2hyb25vdXNseVxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZEltYWdlcyh7dXJscywgb25Qcm9ncmVzcyA9IG5vb3AsIC4uLm9wdHN9KSB7XG4gIGFzc2VydCh1cmxzLmV2ZXJ5KHVybCA9PiB0eXBlb2YgdXJsID09PSAnc3RyaW5nJyksXG4gICAgJ2xvYWRJbWFnZXM6IHt1cmxzfSBtdXN0IGJlIGFycmF5IG9mIHN0cmluZ3MnKTtcbiAgbGV0IGNvdW50ID0gMDtcbiAgcmV0dXJuIFByb21pc2UuYWxsKHVybHMubWFwKFxuICAgIHVybCA9PiB7XG4gICAgICBjb25zdCBwcm9taXNlID0gbG9hZEltYWdlKHVybCk7XG4gICAgICBwcm9taXNlLnRoZW4oZmlsZSA9PiBvblByb2dyZXNzKHtcbiAgICAgICAgcHJvZ3Jlc3M6ICsrY291bnQgLyB1cmxzLmxlbmd0aCxcbiAgICAgICAgY291bnQsXG4gICAgICAgIHRvdGFsOiB1cmxzLmxlbmd0aCxcbiAgICAgICAgdXJsXG4gICAgICB9KSk7XG4gICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9XG4gICkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbG9hZFRleHR1cmVzKGdsLCB7dXJscywgb25Qcm9ncmVzcyA9IG5vb3AsIC4uLm9wdHN9KSB7XG4gIGFzc2VydCh1cmxzLmV2ZXJ5KHVybCA9PiB0eXBlb2YgdXJsID09PSAnc3RyaW5nJyksXG4gICAgJ2xvYWRUZXh0dXJlczoge3VybHN9IG11c3QgYmUgYXJyYXkgb2Ygc3RyaW5ncycpO1xuICByZXR1cm4gbG9hZEltYWdlcyh7dXJscywgb25Qcm9ncmVzcywgLi4ub3B0c30pXG4gIC50aGVuKGltYWdlcyA9PiBpbWFnZXMubWFwKChpbWcsIGkpID0+IHtcbiAgICBsZXQgcGFyYW1zID0gQXJyYXkuaXNBcnJheShvcHRzLnBhcmFtZXRlcnMpID9cbiAgICAgIG9wdHMucGFyYW1ldGVyc1tpXSA6IG9wdHMucGFyYW1ldGVycztcbiAgICBwYXJhbXMgPSBwYXJhbXMgPT09IHVuZGVmaW5lZCA/IHt9IDogcGFyYW1zO1xuICAgIHJldHVybiBuZXcgVGV4dHVyZTJEKGdsLCB7XG4gICAgICBpZDogdXJsc1tpXSxcbiAgICAgIC4uLnBhcmFtcyxcbiAgICAgIGRhdGE6IGltZ1xuICAgIH0pO1xuICB9KSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2FkUHJvZ3JhbShnbCwge3ZzLCBmcywgb25Qcm9ncmVzcyA9IG5vb3AsIC4uLm9wdHN9KSB7XG4gIHJldHVybiBsb2FkRmlsZXMoe3VybHM6IFt2cywgZnNdLCBvblByb2dyZXNzLCAuLi5vcHRzfSlcbiAgLnRoZW4oZnVuY3Rpb24oW3ZzVGV4dCwgZnNUZXh0XSkge1xuICAgIHJldHVybiBuZXcgUHJvZ3JhbShnbCwge3ZzOiB2c1RleHQsIGZzOiBmc1RleHQsIC4uLm9wdHN9KTtcbiAgfSk7XG59XG5cbi8vIExvYWRzIGEgc2ltcGxlIEpTT04gZm9ybWF0XG5leHBvcnQgZnVuY3Rpb24gbG9hZE1vZGVsKGdsLCB7XG4gIHVybCxcbiAgb25Qcm9ncmVzcyA9IG5vb3AsXG4gIC4uLm9wdHNcbn0pIHtcbiAgcmV0dXJuIGxvYWRGaWxlcyh7dXJsczogW3VybF0sIG9uUHJvZ3Jlc3MsIC4uLm9wdHN9KVxuICAudGhlbihmdW5jdGlvbihbZmlsZV0pIHtcbiAgICByZXR1cm4gcGFyc2VNb2RlbChnbCwge2ZpbGUsIC4uLm9wdHN9KTtcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZU1vZGVsKGdsLCB7XG4gIGZpbGUsXG4gIHByb2dyYW0gPSBuZXcgUHJvZ3JhbShnbCksXG4gIC4uLm9wdHNcbn0pIHtcbiAgY29uc3QganNvbiA9IHR5cGVvZiBmaWxlID09PSAnc3RyaW5nJyA/IHBhcnNlSlNPTihmaWxlKSA6IGZpbGU7XG4gIC8vIFJlbW92ZSBhbnkgYXR0cmlidXRlcyBzbyB0aGF0IHdlIGNhbiBjcmVhdGUgYSBnZW9tZXRyeVxuICAvLyBUT0RPIC0gY2hhbmdlIGZvcm1hdCB0byBwdXQgdGhlc2UgaW4gZ2VvbWV0cnkgc3ViIG9iamVjdD9cbiAgY29uc3QgYXR0cmlidXRlcyA9IHt9O1xuICBjb25zdCBtb2RlbE9wdGlvbnMgPSB7fTtcbiAgZm9yIChjb25zdCBrZXkgaW4ganNvbikge1xuICAgIGNvbnN0IHZhbHVlID0ganNvbltrZXldO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgYXR0cmlidXRlc1trZXldID0ga2V5ID09PSAnaW5kaWNlcycgP1xuICAgICAgICBuZXcgVWludDE2QXJyYXkodmFsdWUpIDogbmV3IEZsb2F0MzJBcnJheSh2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG1vZGVsT3B0aW9uc1trZXldID0gdmFsdWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5ldyBNb2RlbCh7XG4gICAgcHJvZ3JhbSxcbiAgICBnZW9tZXRyeTogbmV3IEdlb21ldHJ5KHthdHRyaWJ1dGVzfSksXG4gICAgLi4ubW9kZWxPcHRpb25zLFxuICAgIC4uLm9wdHNcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHBhcnNlSlNPTihmaWxlKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2UoZmlsZSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gcGFyc2UgSlNPTjogJHtlcnJvcn1gKTtcbiAgfVxufVxuIl19