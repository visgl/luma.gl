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

var _geometry = require('../geometry');

var _geometry2 = _interopRequireDefault(_geometry);

var _model = require('../model');

var _model2 = _interopRequireDefault(_model);

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

  return new _model2.default(_extends({
    program: program,
    geometry: new _geometry2.default({ attributes: attributes })
  }, modelOptions, opts));
}

function parseJSON(file) {
  try {
    return JSON.parse(file);
  } catch (error) {
    throw new Error('Failed to parse JSON: ' + error);
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9pby9sb2FkLWZpbGVzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7UUFZZ0IsUyxHQUFBLFM7UUFxQkEsVSxHQUFBLFU7UUFrQkEsWSxHQUFBLFk7UUFnQkEsVyxHQUFBLFc7UUFRQSxTLEdBQUEsUztRQVdBLFUsR0FBQSxVOztBQXJGaEI7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUNBOzs7Ozs7Ozs7QUFFQSxTQUFTLElBQVQsR0FBZ0IsQ0FBRTs7Ozs7QUFLWCxTQUFTLFNBQVQsT0FBdUQ7QUFBQSxNQUFuQyxJQUFtQyxRQUFuQyxJQUFtQztBQUFBLDZCQUE3QixVQUE2QjtBQUFBLE1BQTdCLFVBQTZCLG1DQUFoQixJQUFnQjs7QUFBQSxNQUFQLElBQU87O0FBQzVELHdCQUFPLEtBQUssS0FBTCxDQUFXO0FBQUEsV0FBTyxPQUFPLEdBQVAsS0FBZSxRQUF0QjtBQUFBLEdBQVgsQ0FBUCxFQUNFLDZDQURGO0FBRUEsTUFBSSxRQUFRLENBQVo7QUFDQSxTQUFPLFFBQVEsR0FBUixDQUFZLEtBQUssR0FBTCxDQUNqQixlQUFPO0FBQ0wsUUFBTSxVQUFVLG1DQUFVLFFBQVYsSUFBa0IsSUFBbEIsRUFBaEI7QUFDQSxZQUFRLElBQVIsQ0FBYTtBQUFBLGFBQVEsV0FBVztBQUM5QixrQkFBVSxFQUFFLEtBQUYsR0FBVSxLQUFLLE1BREs7QUFFOUIsb0JBRjhCO0FBRzlCLGVBQU8sS0FBSyxNQUhrQjtBQUk5QjtBQUo4QixPQUFYLENBQVI7QUFBQSxLQUFiO0FBTUEsV0FBTyxPQUFQO0FBQ0QsR0FWZ0IsQ0FBWixDQUFQO0FBWUQ7Ozs7O0FBS00sU0FBUyxVQUFULFFBQXdEO0FBQUEsTUFBbkMsSUFBbUMsU0FBbkMsSUFBbUM7QUFBQSwrQkFBN0IsVUFBNkI7QUFBQSxNQUE3QixVQUE2QixvQ0FBaEIsSUFBZ0I7O0FBQUEsTUFBUCxJQUFPOztBQUM3RCx3QkFBTyxLQUFLLEtBQUwsQ0FBVztBQUFBLFdBQU8sT0FBTyxH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ZSxFQUFyQjtBQUNBLE9BQUssSUFBTSxHQUFYLElBQWtCLElBQWxCLEVBQXdCO0FBQ3RCLFFBQU0sUUFBUSxLQUFLLEdBQUwsQ0FBZDtBQUNBLFFBQUksTUFBTSxPQUFOLENBQWMsS0FBZCxDQUFKLEVBQTBCO0FBQ3hCLGlCQUFXLEdBQVgsSUFBa0IsUUFBUSxTQUFSLEdBQ2hCLElBQUksV0FBSixDQUFnQixLQUFoQixDQURnQixHQUNTLElBQUksWUFBSixDQUFpQixLQUFqQixDQUQzQjtBQUVELEtBSEQsTUFHTztBQUNMLG1CQUFhLEdBQWIsSUFBb0IsS0FBcEI7QUFDRDtBQUNGOztBQUVELFNBQU87QUFDTCxvQkFESztBQUVMLGNBQVUsdUJBQWEsRUFBQyxzQkFBRCxFQUFiO0FBRkwsS0FHRixZQUhFLEVBSUYsSUFKRSxFQUFQO0FBTUQ7O0FBRUQsU0FBUyxTQUFULENBQW1CLElBQW5CLEVBQXlCO0FBQ3ZCLE1BQUk7QUFDRixXQUFPLEtBQUssS0FBTCxDQUFXLElBQVgsQ0FBUDtBQUNELEdBRkQsQ0FFRSxPQUFPLEtBQVAsRUFBYztBQUNkLFVBQU0sSUFBSSxLQUFKLDRCQUFtQyxLQUFuQyxDQUFOO0FBQ0Q7QUFDRiIsImZpbGUiOiJsb2FkLWZpbGVzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgZ3VhcmQtZm9yLWluLCBjb21wbGV4aXR5LCBuby10cnktY2F0Y2ggKi9cbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcbmltcG9ydCB7bG9hZEZpbGUsIGxvYWRJbWFnZX0gZnJvbSAnLi9wbGF0Zm9ybSc7XG5pbXBvcnQge1Byb2dyYW0sIFRleHR1cmUyRH0gZnJvbSAnLi4vd2ViZ2wnO1xuaW1wb3J0IEdlb21ldHJ5IGZyb20gJy4uL2dlb21ldHJ5JztcbmltcG9ydCBNb2RlbCBmcm9tICcuLi9tb2RlbCc7XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG4vKlxuICogTG9hZHMgKFJlcXVlc3RzKSBtdWx0aXBsZSBmaWxlcyBhc3luY2hyb25vdXNseVxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZEZpbGVzKHt1cmxzLCBvblByb2dyZXNzID0gbm9vcCwgLi4ub3B0c30pIHtcbiAgYXNzZXJ0KHVybHMuZXZlcnkodXJsID0+IHR5cGVvZiB1cmwgPT09ICdzdHJpbmcnKSxcbiAgICAnbG9hZEltYWdlczoge3VybHN9IG11c3QgYmUgYXJyYXkgb2Ygc3RyaW5ncycpO1xuICBsZXQgY291bnQgPSAwO1xuICByZXR1cm4gUHJvbWlzZS5hbGwodXJscy5tYXAoXG4gICAgdXJsID0+IHtcbiAgICAgIGNvbnN0IHByb21pc2UgPSBsb2FkRmlsZSh7dXJsLCAuLi5vcHRzfSk7XG4gICAgICBwcm9taXNlLnRoZW4oZmlsZSA9PiBvblByb2dyZXNzKHtcbiAgICAgICAgcHJvZ3Jlc3M6ICsrY291bnQgLyB1cmxzLmxlbmd0aCxcbiAgICAgICAgY291bnQsXG4gICAgICAgIHRvdGFsOiB1cmxzLmxlbmd0aCxcbiAgICAgICAgdXJsXG4gICAgICB9KSk7XG4gICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9XG4gICkpO1xufVxuXG4vKlxuICogTG9hZHMgKHJlcXVlc3RzKSBtdWx0aXBsZSBpbWFnZXMgYXN5bmNocm9ub3VzbHlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvYWRJbWFnZXMoe3VybHMsIG9uUHJvZ3Jlc3MgPSBub29wLCAuLi5vcHRzfSkge1xuICBhc3NlcnQodXJscy5ldmVyeSh1cmwgPT4gdHlwZW9mIHVybCA9PT0gJ3N0cmluZycpLFxuICAgICdsb2FkSW1hZ2VzOiB7dXJsc30gbXVzdCBiZSBhcnJheSBvZiBzdHJpbmdzJyk7XG4gIGxldCBjb3VudCA9IDA7XG4gIHJldHVybiBQcm9taXNlLmFsbCh1cmxzLm1hcChcbiAgICB1cmwgPT4ge1xuICAgICAgY29uc3QgcHJvbWlzZSA9IGxvYWRJbWFnZSh1cmwpO1xuICAgICAgcHJvbWlzZS50aGVuKGZpbGUgPT4gb25Qcm9ncmVzcyh7XG4gICAgICAgIHByb2dyZXNzOiArK2NvdW50IC8gdXJscy5sZW5ndGgsXG4gICAgICAgIGNvdW50LFxuICAgICAgICB0b3RhbDogdXJscy5sZW5ndGgsXG4gICAgICAgIHVybFxuICAgICAgfSkpO1xuICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuICApKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRUZXh0dXJlcyhnbCwge3VybHMsIG9uUHJvZ3Jlc3MgPSBub29wLCAuLi5vcHRzfSkge1xuICBhc3NlcnQodXJscy5ldmVyeSh1cmwgPT4gdHlwZW9mIHVybCA9PT0gJ3N0cmluZycpLFxuICAgICdsb2FkVGV4dHVyZXM6IHt1cmxzfSBtdXN0IGJlIGFycmF5IG9mIHN0cmluZ3MnKTtcbiAgcmV0dXJuIGxvYWRJbWFnZXMoe3VybHMsIG9uUHJvZ3Jlc3MsIC4uLm9wdHN9KVxuICAudGhlbihpbWFnZXMgPT4gaW1hZ2VzLm1hcCgoaW1nLCBpKSA9PiB7XG4gICAgbGV0IHBhcmFtcyA9IEFycmF5LmlzQXJyYXkob3B0cy5wYXJhbWV0ZXJzKSA/XG4gICAgICBvcHRzLnBhcmFtZXRlcnNbaV0gOiBvcHRzLnBhcmFtZXRlcnM7XG4gICAgcGFyYW1zID0gcGFyYW1zID09PSB1bmRlZmluZWQgPyB7fSA6IHBhcmFtcztcbiAgICByZXR1cm4gbmV3IFRleHR1cmUyRChnbCwge1xuICAgICAgaWQ6IHVybHNbaV0sXG4gICAgICAuLi5wYXJhbXMsXG4gICAgICBkYXRhOiBpbWdcbiAgICB9KTtcbiAgfSkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbG9hZFByb2dyYW0oZ2wsIHt2cywgZnMsIG9uUHJvZ3Jlc3MgPSBub29wLCAuLi5vcHRzfSkge1xuICByZXR1cm4gbG9hZEZpbGVzKHt1cmxzOiBbdnMsIGZzXSwgb25Qcm9ncmVzcywgLi4ub3B0c30pXG4gIC50aGVuKGZ1bmN0aW9uKFt2c1RleHQsIGZzVGV4dF0pIHtcbiAgICByZXR1cm4gbmV3IFByb2dyYW0oZ2wsIHt2czogdnNUZXh0LCBmczogZnNUZXh0LCAuLi5vcHRzfSk7XG4gIH0pO1xufVxuXG4vLyBMb2FkcyBhIHNpbXBsZSBKU09OIGZvcm1hdFxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRNb2RlbChnbCwge1xuICB1cmwsXG4gIG9uUHJvZ3Jlc3MgPSBub29wLFxuICAuLi5vcHRzXG59KSB7XG4gIHJldHVybiBsb2FkRmlsZXMoe3VybHM6IFt1cmxdLCBvblByb2dyZXNzLCAuLi5vcHRzfSlcbiAgLnRoZW4oZnVuY3Rpb24oW2ZpbGVdKSB7XG4gICAgcmV0dXJuIHBhcnNlTW9kZWwoZ2wsIHtmaWxlLCAuLi5vcHRzfSk7XG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VNb2RlbChnbCwge1xuICBmaWxlLFxuICBwcm9ncmFtID0gbmV3IFByb2dyYW0oZ2wpLFxuICAuLi5vcHRzXG59KSB7XG4gIGNvbnN0IGpzb24gPSB0eXBlb2YgZmlsZSA9PT0gJ3N0cmluZycgPyBwYXJzZUpTT04oZmlsZSkgOiBmaWxlO1xuICAvLyBSZW1vdmUgYW55IGF0dHJpYnV0ZXMgc28gdGhhdCB3ZSBjYW4gY3JlYXRlIGEgZ2VvbWV0cnlcbiAgLy8gVE9ETyAtIGNoYW5nZSBmb3JtYXQgdG8gcHV0IHRoZXNlIGluIGdlb21ldHJ5IHN1YiBvYmplY3Q/XG4gIGNvbnN0IGF0dHJpYnV0ZXMgPSB7fTtcbiAgY29uc3QgbW9kZWxPcHRpb25zID0ge307XG4gIGZvciAoY29uc3Qga2V5IGluIGpzb24pIHtcbiAgICBjb25zdCB2YWx1ZSA9IGpzb25ba2V5XTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIGF0dHJpYnV0ZXNba2V5XSA9IGtleSA9PT0gJ2luZGljZXMnID9cbiAgICAgICAgbmV3IFVpbnQxNkFycmF5KHZhbHVlKSA6IG5ldyBGbG9hdDMyQXJyYXkodmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBtb2RlbE9wdGlvbnNba2V5XSA9IHZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuZXcgTW9kZWwoe1xuICAgIHByb2dyYW0sXG4gICAgZ2VvbWV0cnk6IG5ldyBHZW9tZXRyeSh7YXR0cmlidXRlc30pLFxuICAgIC4uLm1vZGVsT3B0aW9ucyxcbiAgICAuLi5vcHRzXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBwYXJzZUpTT04oZmlsZSkge1xuICB0cnkge1xuICAgIHJldHVybiBKU09OLnBhcnNlKGZpbGUpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIHBhcnNlIEpTT046ICR7ZXJyb3J9YCk7XG4gIH1cbn1cbiJdfQ==