'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _utils = require('../../utils');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// TODO hack - trick filesaver.js to skip loading under node
/* global global*/
/* eslint-disable no-try-catch */
if (!(0, _utils.isBrowser)()) {
  global.navigator = { userAgent: 'MSIE 9.' };
}
var saveAs = require('filesaver.js');
if (!(0, _utils.isBrowser)()) {
  delete global.navigator;
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
  var callback = arguments.length <= 3 || arguments[3] === undefined ? function () {} : arguments[3];

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

exports.default = {
  writeFile: writeFile,
  readFile: readFile
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9pby9icm93c2VyL2Jyb3dzZXItZnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ0E7O0FBQ0E7Ozs7Ozs7OztBQUlBLElBQUksQ0FBQyx1QkFBTCxFQUFrQjtBQUNoQixTQUFPLFNBQVAsR0FBbUIsRUFBQyxXQUFXLFNBQVosRUFBbkI7QUFDRDtBQUNELElBQU0sU0FBUyxRQUFRLGNBQVIsQ0FBZjtBQUNBLElBQUksQ0FBQyx1QkFBTCxFQUFrQjtBQUNoQixTQUFPLE9BQU8sU0FBZDtBQUNEOzs7QUFHRCxJQUFNLFNBQVMsUUFBUSxlQUFSLENBQWY7QUFDQSxJQUFNLE9BQU8sT0FBTyxJQUFwQjtBQUNBLElBQU0sT0FBTyxPQUFPLElBQXBCOzs7Ozs7Ozs7Ozs7O0FBYUEsU0FBUyxTQUFULENBQW1CLElBQW5CLEVBQXlCLElBQXpCLEVBQStCLE9BQS9CLEVBQTZEO0FBQUEsTUFBckIsUUFBcUIseURBQVYsWUFBTSxDQUFFLENBQUU7OztBQUUzRCxNQUFJLGFBQWEsU0FBYixJQUEwQixPQUFPLE9BQVAsS0FBbUIsVUFBakQsRUFBNkQ7QUFDM0QsY0FBVSxTQUFWO0FBQ0EsZUFBVyxPQUFYO0FBQ0Q7QUFDRCxNQUFJLE9BQU8sSUFBUCxLQUFnQixRQUFwQixFQUE4QjtBQUM1QixXQUFPLElBQUksSUFBSixDQUFTLElBQVQsQ0FBUDtBQUNEO0FBQ0QsU0FBTyxJQUFJLE9BQUosQ0FBWSxVQUFDLE9BQUQsRUFBVSxNQUFWLEVBQXFCO0FBQ3RDLFFBQUksZUFBSjtBQUNBLFFBQUk7QUFDRixlQUFTLE9BQU8sSUFBUCxFQUFhLElBQWIsRUFBbUIsT0FBbkIsQ0FBVDtBQUNELEtBRkQsQ0FFRSxPQUFPLEtBQVAsRUFBYztBQUNkLGFBQU8sS0FBUDtBQUNBLGFBQU8sU0FBUyxLQUFULEVBQWdCLElBQWhCLENBQVA7QUFDRDtBQUNEO0FBQ0EsV0FBTyxTQUFTLElBQVQsRUFBZSxNQUFmLENBQVA7QUFDRCxHQVZNLENBQVA7QUFXRDs7Ozs7Ozs7OztBQVVELFNBQVMsUUFBVCxDQUFrQixJQUFsQixFQUF3QjtBQUN0QixTQUFPLElBQUksT0FBSixDQUFZLFVBQUMsT0FBRCxFQUFVLE1BQVYsRUFBcUI7QUFDdEMsUUFBSTtBQUFBO0FBQ0YsOEJBQU8sSUFBUCxFQUFhLGtEQUFiO0FBQ0EsOEJBQU8sZ0JBQWdCLElBQXZCLEVBQTZCLGlDQUE3Qjs7QUFFQSxZQUFNLFNBQVMsSUFBSSxPQUFPLFVBQVgsRUFBZjs7QUFFQSxlQUFPLE9BQVAsR0FBaUI7QUFBQSxpQkFBSyxPQUFPLElBQUksS0FBSixDQUFVLG9CQUFvQixDQUFwQixDQUFWLENBQVAsQ0FBTDtBQUFBLFNBQWpCO0FBQ0EsZUFBTyxPQUFQLEdBQWlCO0FBQUEsaUJBQU0sT0FBTyxJQUFJLEtBQUosQ0FBVSw2QkFBVixDQUFQLENBQU47QUFBQSxTQUFqQjtBQUNBLGVBQU8sTUFBUCxHQUFnQjtBQUFBLGlCQUFNLFFBQVEsT0FBTyxNQUFmLENBQU47QUFBQSxTQUFoQjs7QUFFQSxlQUFPLFVBQVAsQ0FBa0IsSUFBbEI7QUFWRTtBQVdILEtBWEQsQ0FXRSxPQUFPLEtBQVAsRUFBYztBQUNkLGFBQU8sS0FBUDtBQUNEO0FBQ0YsR0FmTSxDQUFQO0FBZ0JEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUJELFNBQVMsbUJBQVQsQ0FBNkIsQ0FBN0IsRUFBZ0M7OztBQUc5QixVQUFRLEVBQUUsTUFBRixDQUFTLEtBQVQsQ0FBZSxJQUF2QjtBQUNBLFNBQUssRUFBRSxNQUFGLENBQVMsS0FBVCxDQUFlLGFBQXBCO0FBQ0UsYUFBTyxpQkFBUDtBQUNGLFNBQUssRUFBRSxNQUFGLENBQVMsS0FBVCxDQUFlLGdCQUFwQjtBQUNFLGFBQU8sb0JBQVA7QUFDRixTQUFLLEVBQUUsTUFBRixDQUFTLEtBQVQsQ0FBZSxTQUFwQjtBQUNFLGFBQU8sNkJBQVA7QUFDRixTQUFLLEVBQUUsTUFBRixDQUFTLEtBQVQsQ0FBZSxZQUFwQjtBQUNFLGFBQU8sNEJBQVA7QUFDRixTQUFLLEVBQUUsTUFBRixDQUFTLEtBQVQsQ0FBZSxZQUFwQjtBQUNFLGFBQU8sOENBQVA7QUFDRjtBQUNFLGFBQU8sYUFBUDtBQVpGO0FBY0Q7O2tCQUVjO0FBQ2Isc0JBRGE7QUFFYjtBQUZhLEMiLCJmaWxlIjoiYnJvd3Nlci1mcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIG5vLXRyeS1jYXRjaCAqL1xuaW1wb3J0IHtpc0Jyb3dzZXJ9IGZyb20gJy4uLy4uL3V0aWxzJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuLy8gVE9ETyBoYWNrIC0gdHJpY2sgZmlsZXNhdmVyLmpzIHRvIHNraXAgbG9hZGluZyB1bmRlciBub2RlXG4vKiBnbG9iYWwgZ2xvYmFsKi9cbmlmICghaXNCcm93c2VyKCkpIHtcbiAgZ2xvYmFsLm5hdmlnYXRvciA9IHt1c2VyQWdlbnQ6ICdNU0lFIDkuJ307XG59XG5jb25zdCBzYXZlQXMgPSByZXF1aXJlKCdmaWxlc2F2ZXIuanMnKTtcbmlmICghaXNCcm93c2VyKCkpIHtcbiAgZGVsZXRlIGdsb2JhbC5uYXZpZ2F0b3I7XG59XG4vLyBFTkQgaGFja1xuXG5jb25zdCB3aW5kb3cgPSByZXF1aXJlKCdnbG9iYWwvd2luZG93Jyk7XG5jb25zdCBGaWxlID0gd2luZG93LkZpbGU7XG5jb25zdCBCbG9iID0gd2luZG93LkJsb2I7XG5cbi8qKlxuICogRmlsZSBzeXN0ZW0gd3JpdGUgZnVuY3Rpb24gZm9yIHRoZSBicm93c2VyLCBzaW1pbGFyIHRvIE5vZGUncyBmcy53cml0ZUZpbGVcbiAqXG4gKiBTYXZlcyBhIGZpbGUgYnkgZG93bmxvYWRpbmcgaXQgd2l0aCB0aGUgZ2l2ZW4gZmlsZSBuYW1lLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBmaWxlIC0gZmlsZSBuYW1lXG4gKiBAcGFyYW0ge1N0cmluZ3xCbG9ifSBkYXRhIC0gZGF0YSB0byBiZSB3cml0dGVuIHRvIGZpbGVcbiAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdH0gb3B0aW9ucyAtXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIFN0YW5kYXJkIG5vZGUgKGVyciwgZGF0YSkgY2FsbGJhY2tcbiAqIEByZXR1cm4ge1Byb21pc2V9IC0gcHJvbWlzZSwgY2FuIGJlIHVzZWQgaW5zdGVhZCBvZiBjYWxsYmFja1xuICovXG5mdW5jdGlvbiB3cml0ZUZpbGUoZmlsZSwgZGF0YSwgb3B0aW9ucywgY2FsbGJhY2sgPSAoKSA9PiB7fSkge1xuICAvLyBvcHRpb25zIGlzIG9wdGlvbmFsXG4gIGlmIChjYWxsYmFjayA9PT0gdW5kZWZpbmVkICYmIHR5cGVvZiBvcHRpb25zID09PSAnZnVuY3Rpb24nKSB7XG4gICAgb3B0aW9ucyA9IHVuZGVmaW5lZDtcbiAgICBjYWxsYmFjayA9IG9wdGlvbnM7XG4gIH1cbiAgaWYgKHR5cGVvZiBkYXRhID09PSAnc3RyaW5nJykge1xuICAgIGRhdGEgPSBuZXcgQmxvYihkYXRhKTtcbiAgfVxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGxldCByZXN1bHQ7XG4gICAgdHJ5IHtcbiAgICAgIHJlc3VsdCA9IHNhdmVBcyhkYXRhLCBmaWxlLCBvcHRpb25zKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgIHJldHVybiBjYWxsYmFjayhlcnJvciwgbnVsbCk7XG4gICAgfVxuICAgIHJlc29sdmUoKTtcbiAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgcmVzdWx0KTtcbiAgfSk7XG59XG5cbi8qKlxuICogRmlsZSByZWFkZXIgZnVuY3Rpb24gZm9yIHRoZSBicm93c2VyLCBpbnRlbnRpb25hbGx5IHNpbWlsYXJcbiAqIHRvIG5vZGUncyBmcy5yZWFkRmlsZSBBUEksIGhvd2V2ZXIgcmV0dXJucyBhIFByb21pc2UgcmF0aGVyIHRoYW5cbiAqIGNhbGxiYWNrc1xuICpcbiAqIEBwYXJhbSB7RmlsZXxCbG9ifSBmaWxlICBIVE1MIEZpbGUgb3IgQmxvYiBvYmplY3QgdG8gcmVhZCBhcyBzdHJpbmdcbiAqIEByZXR1cm5zIHtQcm9taXNlLnN0cmluZ30gIFJlc29sdmVzIHRvIGEgc3RyaW5nIGNvbnRhaW5pbmcgZmlsZSBjb250ZW50c1xuICovXG5mdW5jdGlvbiByZWFkRmlsZShmaWxlKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGFzc2VydChGaWxlLCAnd2luZG93LkZpbGUgbm90IGRlZmluZWQuIE11c3QgcnVuIHVuZGVyIGJyb3dzZXIuJyk7XG4gICAgICBhc3NlcnQoZmlsZSBpbnN0YW5jZW9mIEZpbGUsICdwYXJhbWV0ZXIgbXVzdCBiZSBhIEZpbGUgb2JqZWN0Jyk7XG5cbiAgICAgIGNvbnN0IHJlYWRlciA9IG5ldyB3aW5kb3cuRmlsZVJlYWRlcigpO1xuXG4gICAgICByZWFkZXIub25lcnJvciA9IGUgPT4gcmVqZWN0KG5ldyBFcnJvcihnZXRGaWxlRXJyb3JNZXNzYWdlKGUpKSk7XG4gICAgICByZWFkZXIub25hYm9ydCA9ICgpID0+IHJlamVjdChuZXcgRXJyb3IoJ1JlYWQgb3BlcmF0aW9uIHdhcyBhYm9ydGVkLicpKTtcbiAgICAgIHJlYWRlci5vbmxvYWQgPSAoKSA9PiByZXNvbHZlKHJlYWRlci5yZXN1bHQpO1xuXG4gICAgICByZWFkZXIucmVhZEFzVGV4dChmaWxlKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICB9XG4gIH0pO1xufVxuXG4vLyBOT1RFUyBPTiBFUlJPUiBIQU5ETElOR1xuLy9cbi8vIFByZXBhcmVkIHRvIGV4dGVybmFsaXplIGVycm9yIG1lc3NhZ2UgdGV4dHNcbi8vXG4vLyBUaGUgd2VpcmQgdGhpbmcgYWJvdXQgdGhlIEZpbGVSZWFkZXIgQVBJIGlzIHRoYXQgdGhlIGVycm9yIGRlZmluaXRpb25zXG4vLyBhcmUgb25seSBhdmFpbGFibGUgb24gdGhlIGVycm9yIGV2ZW50IGluc3RhbmNlIHRoYXQgaXMgcGFzc2VkIHRvIHRoZVxuLy8gaGFuZGxlci4gVGh1cyB3ZSBuZWVkIHRvIGNyZWF0ZSBkZWZpbml0aW9ucyB0aGF0IGFyZSBhdmlhbGJsZSBvdXRzaWRlXG4vLyB0aGUgaGFuZGxlci5cbi8vXG4vLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRmlsZVJlYWRlclxuLy9cbi8vIFNpZGUgTm90ZTogVG8gY29tcGxpY2F0ZSBtYXR0ZXJzLCB0aGVyZSBhcmUgYWxzbyBhIERPTUVycm9yIHN0cmluZyBzZXQgb25cbi8vIGZpbGVyZWFkZXIgb2JqZWN0IChlcnJvciBwcm9wZXJ0eSkuIE5vdCBjbGVhciBob3cgb3IgaWYgdGhlc2UgbWFwXG4vLyB0byB0aGUgZXZlbnQgZXJyb3IgY29kZXMuIFRoZXNlIHN0cmluZ3MgYXJlIG5vdCBjdXJyZW50bHkgdXNlZCBieSB0aGlzIGFwaS5cbi8vXG4vLyBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRE9NRXJyb3JcblxuZnVuY3Rpb24gZ2V0RmlsZUVycm9yTWVzc2FnZShlKSB7XG4gIC8vIE1hcCBldmVudCdzIGVycm9yIGNvZGVzIHRvIHN0YXRpYyBlcnJvciBjb2RlcyBzbyB0aGF0IHdlIGNhblxuICAvLyBleHRlcm5hbGl6ZSBlcnJvciBjb2RlIHRvIGVycm9yIG1lc3NhZ2UgbWFwcGluZ1xuICBzd2l0Y2ggKGUudGFyZ2V0LmVycm9yLmNvZGUpIHtcbiAgY2FzZSBlLnRhcmdldC5lcnJvci5OT1RfRk9VTkRfRVJSOlxuICAgIHJldHVybiAnRmlsZSBub3QgZm91bmQuJztcbiAgY2FzZSBlLnRhcmdldC5lcnJvci5OT1RfUkVBREFCTEVfRVJSOlxuICAgIHJldHVybiAnRmlsZSBub3QgcmVhZGFibGUuJztcbiAgY2FzZSBlLnRhcmdldC5lcnJvci5BQk9SVF9FUlI6XG4gICAgcmV0dXJuICdSZWFkIG9wZXJhdGlvbiB3YXMgYWJvcnRlZC4nO1xuICBjYXNlIGUudGFyZ2V0LmVycm9yLlNFQ1VSSVRZX0VSUjpcbiAgICByZXR1cm4gJ0ZpbGUgaXMgaW4gYSBsb2NrZWQgc3RhdGUuJztcbiAgY2FzZSBlLnRhcmdldC5lcnJvci5FTkNPRElOR19FUlI6XG4gICAgcmV0dXJuICdGaWxlIGlzIHRvbyBsb25nIHRvIGVuY29kZSBpbiBcImRhdGE6Ly9cIiBVUkwuJztcbiAgZGVmYXVsdDpcbiAgICByZXR1cm4gJ1JlYWQgZXJyb3IuJztcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIHdyaXRlRmlsZSxcbiAgcmVhZEZpbGVcbn1cbiJdfQ==