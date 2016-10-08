'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.writeFile = writeFile;
exports.readFile = readFile;

var _utils = require('../../utils');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// TODO hack - trick filesaver.js to skip loading under node
/* global global*/
/* eslint-disable no-try-catch */
var savedNavigatorExists = 'navigator' in global;
var savedNavigator = global.navigator;
if (!_utils.isBrowser) {
  global.navigator = { userAgent: 'MSIE 9.' };
}
var saveAs = require('filesaver.js');
if (!_utils.isBrowser) {
  if (savedNavigatorExists) {
    global.navigator = savedNavigator;
  } else {
    delete global.navigator;
  }
}
// END hack

var window = require('global/window');
var File = window.File;
var Blob = window.Blob;

/**
 * File system write function for the browser, similar to Node's fs.writeFile
 *
 * Saves a file by downloading it with the given file name.
 *
 * @param {String} file - file name
 * @param {String|Blob} data - data to be written to file
 * @param {String|Object} options -
 * @param {Function} callback - Standard node (err, data) callback
 * @return {Promise} - promise, can be used instead of callback
 */
function writeFile(file, data, options) {
  var callback = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : function () {};

  // options is optional
  if (callback === undefined && typeof options === 'function') {
    options = undefined;
    callback = options;
  }
  if (typeof data === 'string') {
    data = new Blob(data);
  }
  return new Promise(function (resolve, reject) {
    var result = void 0;
    try {
      result = saveAs(data, file, options);
    } catch (error) {
      reject(error);
      return callback(error, null);
    }
    resolve();
    return callback(null, result);
  });
}

/**
 * File reader function for the browser, intentionally similar
 * to node's fs.readFile API, however returns a Promise rather than
 * callbacks
 *
 * @param {File|Blob} file  HTML File or Blob object to read as string
 * @returns {Promise.string}  Resolves to a string containing file contents
 */
function readFile(file) {
  return new Promise(function (resolve, reject) {
    try {
      (function () {
        (0, _assert2.default)(File, 'window.File not defined. Must run under browser.');
        (0, _assert2.default)(file instanceof File, 'parameter must be a File object');

        var reader = new window.FileReader();

        reader.onerror = function (e) {
          return reject(new Error(getFileErrorMessage(e)));
        };
        reader.onabort = function () {
          return reject(new Error('Read operation was aborted.'));
        };
        reader.onload = function () {
          return resolve(reader.result);
        };

        reader.readAsText(file);
      })();
    } catch (error) {
      reject(error);
    }
  });
}

// NOTES ON ERROR HANDLING
//
// Prepared to externalize error message texts
//
// The weird thing about the FileReader API is that the error definitions
// are only available on the error event instance that is passed to the
// handler. Thus we need to create definitions that are avialble outside
// the handler.
//
// https://developer.mozilla.org/en-US/docs/Web/API/FileReader
//
// Side Note: To complicate matters, there are also a DOMError string set on
// filereader object (error property). Not clear how or if these map
// to the event error codes. These strings are not currently used by this api.
//
// https://developer.mozilla.org/en-US/docs/Web/API/DOMError

function getFileErrorMessage(e) {
  // Map event's error codes to static error codes so that we can
  // externalize error code to error message mapping
  switch (e.target.error.code) {
    case e.target.error.NOT_FOUND_ERR:
      return 'File not found.';
    case e.target.error.NOT_READABLE_ERR:
      return 'File not readable.';
    case e.target.error.ABORT_ERR:
      return 'Read operation was aborted.';
    case e.target.error.SECURITY_ERR:
      return 'File is in a locked state.';
    case e.target.error.ENCODING_ERR:
      return 'File is too long to encode in "data://" URL.';
    default:
      return 'Read error.';
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9pby9icm93c2VyL2Jyb3dzZXItZnMuanMiXSwibmFtZXMiOlsid3JpdGVGaWxlIiwicmVhZEZpbGUiLCJzYXZlZE5hdmlnYXRvckV4aXN0cyIsImdsb2JhbCIsInNhdmVkTmF2aWdhdG9yIiwibmF2aWdhdG9yIiwidXNlckFnZW50Iiwic2F2ZUFzIiwicmVxdWlyZSIsIndpbmRvdyIsIkZpbGUiLCJCbG9iIiwiZmlsZSIsImRhdGEiLCJvcHRpb25zIiwiY2FsbGJhY2siLCJ1bmRlZmluZWQiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsInJlc3VsdCIsImVycm9yIiwicmVhZGVyIiwiRmlsZVJlYWRlciIsIm9uZXJyb3IiLCJFcnJvciIsImdldEZpbGVFcnJvck1lc3NhZ2UiLCJlIiwib25hYm9ydCIsIm9ubG9hZCIsInJlYWRBc1RleHQiLCJ0YXJnZXQiLCJjb2RlIiwiTk9UX0ZPVU5EX0VSUiIsIk5PVF9SRUFEQUJMRV9FUlIiLCJBQk9SVF9FUlIiLCJTRUNVUklUWV9FUlIiLCJFTkNPRElOR19FUlIiXSwibWFwcGluZ3MiOiI7Ozs7O1FBb0NnQkEsUyxHQUFBQSxTO1FBOEJBQyxRLEdBQUFBLFE7O0FBakVoQjs7QUFDQTs7Ozs7O0FBRUE7QUFDQTtBQUxBO0FBTUEsSUFBTUMsdUJBQXVCLGVBQWVDLE1BQTVDO0FBQ0EsSUFBTUMsaUJBQWlCRCxPQUFPRSxTQUE5QjtBQUNBLElBQUksaUJBQUosRUFBZ0I7QUFDZEYsU0FBT0UsU0FBUCxHQUFtQixFQUFDQyxXQUFXLFNBQVosRUFBbkI7QUFDRDtBQUNELElBQU1DLFNBQVNDLFFBQVEsY0FBUixDQUFmO0FBQ0EsSUFBSSxpQkFBSixFQUFnQjtBQUNkLE1BQUlOLG9CQUFKLEVBQTBCO0FBQ3hCQyxXQUFPRSxTQUFQLEdBQW1CRCxjQUFuQjtBQUNELEdBRkQsTUFFTztBQUNMLFdBQU9ELE9BQU9FLFNBQWQ7QUFDRDtBQUNGO0FBQ0Q7O0FBRUEsSUFBTUksU0FBU0QsUUFBUSxl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IGVzbGludC1kaXNhYmxlIG5vLXRyeS1jYXRjaCAqL1xuaW1wb3J0IHtpc0Jyb3dzZXJ9IGZyb20gJy4uLy4uL3V0aWxzJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuLy8gVE9ETyBoYWNrIC0gdHJpY2sgZmlsZXNhdmVyLmpzIHRvIHNraXAgbG9hZGluZyB1bmRlciBub2RlXG4vKiBnbG9iYWwgZ2xvYmFsKi9cbmNvbnN0IHNhdmVkTmF2aWdhdG9yRXhpc3RzID0gJ25hdmlnYXRvcicgaW4gZ2xvYmFsO1xuY29uc3Qgc2F2ZWROYXZpZ2F0b3IgPSBnbG9iYWwubmF2aWdhdG9yO1xuaWYgKCFpc0Jyb3dzZXIpIHtcbiAgZ2xvYmFsLm5hdmlnYXRvciA9IHt1c2VyQWdlbnQ6ICdNU0lFIDkuJ307XG59XG5jb25zdCBzYXZlQXMgPSByZXF1aXJlKCdmaWxlc2F2ZXIuanMnKTtcbmlmICghaXNCcm93c2VyKSB7XG4gIGlmIChzYXZlZE5hdmlnYXRvckV4aXN0cykge1xuICAgIGdsb2JhbC5uYXZpZ2F0b3IgPSBzYXZlZE5hdmlnYXRvcjtcbiAgfSBlbHNlIHtcbiAgICBkZWxldGUgZ2xvYmFsLm5hdmlnYXRvcjtcbiAgfVxufVxuLy8gRU5EIGhhY2tcblxuY29uc3Qgd2luZG93ID0gcmVxdWlyZSgnZ2xvYmFsL3dpbmRvdycpO1xuY29uc3QgRmlsZSA9IHdpbmRvdy5GaWxlO1xuY29uc3QgQmxvYiA9IHdpbmRvdy5CbG9iO1xuXG4vKipcbiAqIEZpbGUgc3lzdGVtIHdyaXRlIGZ1bmN0aW9uIGZvciB0aGUgYnJvd3Nlciwgc2ltaWxhciB0byBOb2RlJ3MgZnMud3JpdGVGaWxlXG4gKlxuICogU2F2ZXMgYSBmaWxlIGJ5IGRvd25sb2FkaW5nIGl0IHdpdGggdGhlIGdpdmVuIGZpbGUgbmFtZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZmlsZSAtIGZpbGUgbmFtZVxuICogQHBhcmFtIHtTdHJpbmd8QmxvYn0gZGF0YSAtIGRhdGEgdG8gYmUgd3JpdHRlbiB0byBmaWxlXG4gKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R9IG9wdGlvbnMgLVxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBTdGFuZGFyZCBub2RlIChlcnIsIGRhdGEpIGNhbGxiYWNrXG4gKiBAcmV0dXJuIHtQcm9taXNlfSAtIHByb21pc2UsIGNhbiBiZSB1c2VkIGluc3RlYWQgb2YgY2FsbGJhY2tcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlRmlsZShmaWxlLCBkYXRhLCBvcHRpb25zLCBjYWxsYmFjayA9ICgpID0+IHt9KSB7XG4gIC8vIG9wdGlvbnMgaXMgb3B0aW9uYWxcbiAgaWYgKGNhbGxiYWNrID09PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICBvcHRpb25zID0gdW5kZWZpbmVkO1xuICAgIGNhbGxiYWNrID0gb3B0aW9ucztcbiAgfVxuICBpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XG4gICAgZGF0YSA9IG5ldyBCbG9iKGRhdGEpO1xuICB9XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgbGV0IHJlc3VsdDtcbiAgICB0cnkge1xuICAgICAgcmVzdWx0ID0gc2F2ZUFzKGRhdGEsIGZpbGUsIG9wdGlvbnMpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcbiAgICB9XG4gICAgcmVzb2x2ZSgpO1xuICAgIHJldHVybiBjYWxsYmFjayhudWxsLCByZXN1bHQpO1xuICB9KTtcbn1cblxuLyoqXG4gKiBGaWxlIHJlYWRlciBmdW5jdGlvbiBmb3IgdGhlIGJyb3dzZXIsIGludGVudGlvbmFsbHkgc2ltaWxhclxuICogdG8gbm9kZSdzIGZzLnJlYWRGaWxlIEFQSSwgaG93ZXZlciByZXR1cm5zIGEgUHJvbWlzZSByYXRoZXIgdGhhblxuICogY2FsbGJhY2tzXG4gKlxuICogQHBhcmFtIHtGaWxlfEJsb2J9IGZpbGUgIEhUTUwgRmlsZSBvciBCbG9iIG9iamVjdCB0byByZWFkIGFzIHN0cmluZ1xuICogQHJldHVybnMge1Byb21pc2Uuc3RyaW5nfSAgUmVzb2x2ZXMgdG8gYSBzdHJpbmcgY29udGFpbmluZyBmaWxlIGNvbnRlbnRzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWFkRmlsZShmaWxlKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGFzc2VydChGaWxlLCAnd2luZG93LkZpbGUgbm90IGRlZmluZWQuIE11c3QgcnVuIHVuZGVyIGJyb3dzZXIuJyk7XG4gICAgICBhc3NlcnQoZmlsZSBpbnN0YW5jZW9mIEZpbGUsICdwYXJhbWV0ZXIgbXVzdCBiZSBhIEZpbGUgb2JqZWN0Jyk7XG5cbiAgICAgIGNvbnN0IHJlYWRlciA9IG5ldyB3aW5kb3cuRmlsZVJlYWRlcigpO1xuXG4gICAgICByZWFkZXIub25lcnJvciA9IGUgPT4gcmVqZWN0KG5ldyBFcnJvcihnZXRGaWxlRXJyb3JNZXNzYWdlKGUpKSk7XG4gICAgICByZWFkZXIub25hYm9ydCA9ICgpID0+IHJlamVjdChuZXcgRXJyb3IoJ1JlYWQgb3BlcmF0aW9uIHdhcyBhYm9ydGVkLicpKTtcbiAgICAgIHJlYWRlci5vbmxvYWQgPSAoKSA9PiByZXNvbHZlKHJlYWRlci5yZXN1bHQpO1xuXG4gICAgICByZWFkZXIucmVhZEFzVGV4dChmaWxlKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICB9XG4gIH0pO1xufVxuXG4vLyBOT1RFUyBPTiBFUlJPUiBIQU5ETElOR1xuLy9cbi8vIFByZXBhcmVkIHRvIGV4dGVybmFsaXplIGVycm9yIG1lc3NhZ2UgdGV4dHNcbi8vXG4vLyBUaGUgd2VpcmQgdGhpbmcgYWJvdXQgdGhlIEZpbGVSZWFkZXIgQVBJIGlzIHRoYXQgdGhlIGVycm9yIGRlZmluaXRpb25zXG4vLyBhcmUgb25seSBhdmFpbGFibGUgb24gdGhlIGVycm9yIGV2ZW50IGluc3RhbmNlIHRoYXQgaXMgcGFzc2VkIHRvIHRoZVxuLy8gaGFuZGxlci4gVGh1cyB3ZSBuZWVkIHRvIGNyZWF0ZSBkZWZpbml0aW9ucyB0aGF0IGFyZSBhdmlhbGJsZSBvdXRzaWRlXG4vLyB0aGUgaGFuZGxlci5cbi8vXG4vLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRmlsZVJlYWRlclxuLy9cbi8vIFNpZGUgTm90ZTogVG8gY29tcGxpY2F0ZSBtYXR0ZXJzLCB0aGVyZSBhcmUgYWxzbyBhIERPTUVycm9yIHN0cmluZyBzZXQgb25cbi8vIGZpbGVyZWFkZXIgb2JqZWN0IChlcnJvciBwcm9wZXJ0eSkuIE5vdCBjbGVhciBob3cgb3IgaWYgdGhlc2UgbWFwXG4vLyB0byB0aGUgZXZlbnQgZXJyb3IgY29kZXMuIFRoZXNlIHN0cmluZ3MgYXJlIG5vdCBjdXJyZW50bHkgdXNlZCBieSB0aGlzIGFwaS5cbi8vXG4vLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRE9NRXJyb3JcblxuZnVuY3Rpb24gZ2V0RmlsZUVycm9yTWVzc2FnZShlKSB7XG4gIC8vIE1hcCBldmVudCdzIGVycm9yIGNvZGVzIHRvIHN0YXRpYyBlcnJvciBjb2RlcyBzbyB0aGF0IHdlIGNhblxuICAvLyBleHRlcm5hbGl6ZSBlcnJvciBjb2RlIHRvIGVycm9yIG1lc3NhZ2UgbWFwcGluZ1xuICBzd2l0Y2ggKGUudGFyZ2V0LmVycm9yLmNvZGUpIHtcbiAgY2FzZSBlLnRhcmdldC5lcnJvci5OT1RfRk9VTkRfRVJSOlxuICAgIHJldHVybiAnRmlsZSBub3QgZm91bmQuJztcbiAgY2FzZSBlLnRhcmdldC5lcnJvci5OT1RfUkVBREFCTEVfRVJSOlxuICAgIHJldHVybiAnRmlsZSBub3QgcmVhZGFibGUuJztcbiAgY2FzZSBlLnRhcmdldC5lcnJvci5BQk9SVF9FUlI6XG4gICAgcmV0dXJuICdSZWFkIG9wZXJhdGlvbiB3YXMgYWJvcnRlZC4nO1xuICBjYXNlIGUudGFyZ2V0LmVycm9yLlNFQ1VSSVRZX0VSUjpcbiAgICByZXR1cm4gJ0ZpbGUgaXMgaW4gYSBsb2NrZWQgc3RhdGUuJztcbiAgY2FzZSBlLnRhcmdldC5lcnJvci5FTkNPRElOR19FUlI6XG4gICAgcmV0dXJuICdGaWxlIGlzIHRvbyBsb25nIHRvIGVuY29kZSBpbiBcImRhdGE6Ly9cIiBVUkwuJztcbiAgZGVmYXVsdDpcbiAgICByZXR1cm4gJ1JlYWQgZXJyb3IuJztcbiAgfVxufVxuIl19