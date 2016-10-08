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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9pby9sb2FkLWZpbGVzLmpzIl0sIm5hbWVzIjpbImxvYWRGaWxlcyIsImxvYWRJbWFnZXMiLCJsb2FkVGV4dHVyZXMiLCJsb2FkUHJvZ3JhbSIsImxvYWRNb2RlbCIsInBhcnNlTW9kZWwiLCJub29wIiwidXJscyIsIm9uUHJvZ3Jlc3MiLCJvcHRzIiwiZXZlcnkiLCJ1cmwiLCJjb3VudCIsIlByb21pc2UiLCJhbGwiLCJtYXAiLCJwcm9taXNlIiwidGhlbiIsInByb2dyZXNzIiwibGVuZ3RoIiwidG90YWwiLCJnbCIsImltYWdlcyIsImltZyIsImkiLCJwYXJhbXMiLCJBcnJheSIsImlzQXJyYXkiLCJwYXJhbWV0ZXJzIiwidW5kZWZpbmVkIiwiaWQiLCJkYXRhIiwidnMiLCJmcyIsInZzVGV4dCIsImZzVGV4dCIsImZpbGUiLCJwcm9ncmFtIiwianNvbiIsInBhcnNlSlNPTiIsImF0dHJpYnV0ZXMiLCJtb2RlbE9wdGlvbnMiLCJrZXkiLCJ2YWx1ZSIsIlVpbnQxNkFycmF5IiwiRmxvYXQzMkFycmF5IiwiZ2VvbWV0cnkiLCJKU09OIiwicGFyc2UiLCJlcnJvciIsIkVycm9yIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O1FBV2dCQSxTLEdBQUFBLFM7UUFxQkFDLFUsR0FBQUEsVTtRQWtCQUMsWSxHQUFBQSxZO1FBZ0JBQyxXLEdBQUFBLFc7UUFRQUMsUyxHQUFBQSxTO1FBU0FDLFUsR0FBQUEsVTs7QUFsRmhCOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7Nk5BSkE7OztBQU1BLFNBQVNDLElBQVQsR0FBZ0IsQ0FBRTs7QUFFbEI7OztBQUdPLFNBQVNOLFNBQVQsT0FBdUQ7QUFBQSxNQUFuQ08sSUFBbUMsUUFBbkNBLElBQW1DO0FBQUEsNkJBQTdCQyxVQUE2QjtBQUFBLE1BQTdCQSxVQUE2QixtQ0FBaEJGLElBQWdCOztBQUFBLE1BQVBHLElBQU87O0FBQzVELHdCQUFPRixLQUFLRyxLQUFMLENBQVc7QUFBQSxXQUFPLE9BQU9DLEdBQVAs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LEtBSEQsTUFHTztBQUNMRixtQkFBYUMsR0FBYixJQUFvQkMsS0FBcEI7QUFDRDtBQUNGOztBQUVELFNBQU87QUFDTE4sb0JBREs7QUFFTFMsY0FBVSxtQkFBYSxFQUFDTixzQkFBRCxFQUFiO0FBRkwsS0FHRkMsWUFIRSxFQUlGaEMsSUFKRSxFQUFQO0FBTUQ7O0FBRUQsU0FBUzhCLFNBQVQsQ0FBbUJILElBQW5CLEVBQXlCO0FBQ3ZCLE1BQUk7QUFDRixXQUFPVyxLQUFLQyxLQUFMLENBQVdaLElBQVgsQ0FBUDtBQUNELEdBRkQsQ0FFRSxPQUFPYSxLQUFQLEVBQWM7QUFDZCxVQUFNLElBQUlDLEtBQUosNEJBQW1DRCxLQUFuQyxDQUFOO0FBQ0Q7QUFDRiIsImZpbGUiOiJsb2FkLWZpbGVzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgZ3VhcmQtZm9yLWluLCBjb21wbGV4aXR5LCBuby10cnktY2F0Y2ggKi9cbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcbmltcG9ydCB7bG9hZEZpbGUsIGxvYWRJbWFnZX0gZnJvbSAnLi9wbGF0Zm9ybSc7XG5pbXBvcnQge1Byb2dyYW0sIFRleHR1cmUyRH0gZnJvbSAnLi4vd2ViZ2wnO1xuaW1wb3J0IHtHZW9tZXRyeSwgTW9kZWx9IGZyb20gJy4uL2NvcmUnO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxuLypcbiAqIExvYWRzIChSZXF1ZXN0cykgbXVsdGlwbGUgZmlsZXMgYXN5bmNocm9ub3VzbHlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvYWRGaWxlcyh7dXJscywgb25Qcm9ncmVzcyA9IG5vb3AsIC4uLm9wdHN9KSB7XG4gIGFzc2VydCh1cmxzLmV2ZXJ5KHVybCA9PiB0eXBlb2YgdXJsID09PSAnc3RyaW5nJyksXG4gICAgJ2xvYWRJbWFnZXM6IHt1cmxzfSBtdXN0IGJlIGFycmF5IG9mIHN0cmluZ3MnKTtcbiAgbGV0IGNvdW50ID0gMDtcbiAgcmV0dXJuIFByb21pc2UuYWxsKHVybHMubWFwKFxuICAgIHVybCA9PiB7XG4gICAgICBjb25zdCBwcm9taXNlID0gbG9hZEZpbGUoe3VybCwgLi4ub3B0c30pO1xuICAgICAgcHJvbWlzZS50aGVuKGZpbGUgPT4gb25Qcm9ncmVzcyh7XG4gICAgICAgIHByb2dyZXNzOiArK2NvdW50IC8gdXJscy5sZW5ndGgsXG4gICAgICAgIGNvdW50LFxuICAgICAgICB0b3RhbDogdXJscy5sZW5ndGgsXG4gICAgICAgIHVybFxuICAgICAgfSkpO1xuICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuICApKTtcbn1cblxuLypcbiAqIExvYWRzIChyZXF1ZXN0cykgbXVsdGlwbGUgaW1hZ2VzIGFzeW5jaHJvbm91c2x5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkSW1hZ2VzKHt1cmxzLCBvblByb2dyZXNzID0gbm9vcCwgLi4ub3B0c30pIHtcbiAgYXNzZXJ0KHVybHMuZXZlcnkodXJsID0+IHR5cGVvZiB1cmwgPT09ICdzdHJpbmcnKSxcbiAgICAnbG9hZEltYWdlczoge3VybHN9IG11c3QgYmUgYXJyYXkgb2Ygc3RyaW5ncycpO1xuICBsZXQgY291bnQgPSAwO1xuICByZXR1cm4gUHJvbWlzZS5hbGwodXJscy5tYXAoXG4gICAgdXJsID0+IHtcbiAgICAgIGNvbnN0IHByb21pc2UgPSBsb2FkSW1hZ2UodXJsKTtcbiAgICAgIHByb21pc2UudGhlbihmaWxlID0+IG9uUHJvZ3Jlc3Moe1xuICAgICAgICBwcm9ncmVzczogKytjb3VudCAvIHVybHMubGVuZ3RoLFxuICAgICAgICBjb3VudCxcbiAgICAgICAgdG90YWw6IHVybHMubGVuZ3RoLFxuICAgICAgICB1cmxcbiAgICAgIH0pKTtcbiAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH1cbiAgKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2FkVGV4dHVyZXMoZ2wsIHt1cmxzLCBvblByb2dyZXNzID0gbm9vcCwgLi4ub3B0c30pIHtcbiAgYXNzZXJ0KHVybHMuZXZlcnkodXJsID0+IHR5cGVvZiB1cmwgPT09ICdzdHJpbmcnKSxcbiAgICAnbG9hZFRleHR1cmVzOiB7dXJsc30gbXVzdCBiZSBhcnJheSBvZiBzdHJpbmdzJyk7XG4gIHJldHVybiBsb2FkSW1hZ2VzKHt1cmxzLCBvblByb2dyZXNzLCAuLi5vcHRzfSlcbiAgLnRoZW4oaW1hZ2VzID0+IGltYWdlcy5tYXAoKGltZywgaSkgPT4ge1xuICAgIGxldCBwYXJhbXMgPSBBcnJheS5pc0FycmF5KG9wdHMucGFyYW1ldGVycykgP1xuICAgICAgb3B0cy5wYXJhbWV0ZXJzW2ldIDogb3B0cy5wYXJhbWV0ZXJzO1xuICAgIHBhcmFtcyA9IHBhcmFtcyA9PT0gdW5kZWZpbmVkID8ge30gOiBwYXJhbXM7XG4gICAgcmV0dXJuIG5ldyBUZXh0dXJlMkQoZ2wsIHtcbiAgICAgIGlkOiB1cmxzW2ldLFxuICAgICAgLi4ucGFyYW1zLFxuICAgICAgZGF0YTogaW1nXG4gICAgfSk7XG4gIH0pKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRQcm9ncmFtKGdsLCB7dnMsIGZzLCBvblByb2dyZXNzID0gbm9vcCwgLi4ub3B0c30pIHtcbiAgcmV0dXJuIGxvYWRGaWxlcyh7dXJsczogW3ZzLCBmc10sIG9uUHJvZ3Jlc3MsIC4uLm9wdHN9KVxuICAudGhlbihcbiAgICAoW3ZzVGV4dCwgZnNUZXh0XSkgPT4gbmV3IFByb2dyYW0oZ2wsIHt2czogdnNUZXh0LCBmczogZnNUZXh0LCAuLi5vcHRzfSlcbiAgKTtcbn1cblxuLy8gTG9hZHMgYSBzaW1wbGUgSlNPTiBmb3JtYXRcbmV4cG9ydCBmdW5jdGlvbiBsb2FkTW9kZWwoZ2wsIHtcbiAgdXJsLFxuICBvblByb2dyZXNzID0gbm9vcCxcbiAgLi4ub3B0c1xufSkge1xuICByZXR1cm4gbG9hZEZpbGVzKHt1cmxzOiBbdXJsXSwgb25Qcm9ncmVzcywgLi4ub3B0c30pXG4gIC50aGVuKChbZmlsZV0pID0+IHBhcnNlTW9kZWwoZ2wsIHtmaWxlLCAuLi5vcHRzfSkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VNb2RlbChnbCwge1xuICBmaWxlLFxuICBwcm9ncmFtID0gbmV3IFByb2dyYW0oZ2wpLFxuICAuLi5vcHRzXG59KSB7XG4gIGNvbnN0IGpzb24gPSB0eXBlb2YgZmlsZSA9PT0gJ3N0cmluZycgPyBwYXJzZUpTT04oZmlsZSkgOiBmaWxlO1xuICAvLyBSZW1vdmUgYW55IGF0dHJpYnV0ZXMgc28gdGhhdCB3ZSBjYW4gY3JlYXRlIGEgZ2VvbWV0cnlcbiAgLy8gVE9ETyAtIGNoYW5nZSBmb3JtYXQgdG8gcHV0IHRoZXNlIGluIGdlb21ldHJ5IHN1YiBvYmplY3Q/XG4gIGNvbnN0IGF0dHJpYnV0ZXMgPSB7fTtcbiAgY29uc3QgbW9kZWxPcHRpb25zID0ge307XG4gIGZvciAoY29uc3Qga2V5IGluIGpzb24pIHtcbiAgICBjb25zdCB2YWx1ZSA9IGpzb25ba2V5XTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIGF0dHJpYnV0ZXNba2V5XSA9IGtleSA9PT0gJ2luZGljZXMnID9cbiAgICAgICAgbmV3IFVpbnQxNkFycmF5KHZhbHVlKSA6IG5ldyBGbG9hdDMyQXJyYXkodmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBtb2RlbE9wdGlvbnNba2V5XSA9IHZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuZXcgTW9kZWwoe1xuICAgIHByb2dyYW0sXG4gICAgZ2VvbWV0cnk6IG5ldyBHZW9tZXRyeSh7YXR0cmlidXRlc30pLFxuICAgIC4uLm1vZGVsT3B0aW9ucyxcbiAgICAuLi5vcHRzXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBwYXJzZUpTT04oZmlsZSkge1xuICB0cnkge1xuICAgIHJldHVybiBKU09OLnBhcnNlKGZpbGUpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIHBhcnNlIEpTT046ICR7ZXJyb3J9YCk7XG4gIH1cbn1cbiJdfQ==