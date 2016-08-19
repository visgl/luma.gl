'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.compressImage = compressImage;
exports.loadImage = loadImage;

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _through = require('through');

var _through2 = _interopRequireDefault(_through);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
 * Returns data bytes representing a compressed image in PNG or JPG format,
 * This data can be saved using file system (f) methods or
 * used in a request.
 * @param {Image}  image - Image or Canvas
 * @param {String} opt.type='png' - png, jpg or image/png, image/jpg are valid
 * @param {String} opt.dataURI= - Whether to include a data URI header
 */
// Image loading/saving for browser
/* global document, HTMLCanvasElement, Image */
/* eslint-disable guard-for-in, complexity, no-try-catch */

/* global process, Buffer */
function compressImage(image, type) {
  if (image instanceof HTMLCanvasElement) {
    var _canvas = image;
    return _canvas.toDataURL(type);
  }

  (0, _assert2.default)(image instanceof Image, 'getImageData accepts image or canvas');
  var canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  canvas.getContext('2d').drawImage(image, 0, 0);

  // Get raw image data
  var data = canvas.toDataURL(type || 'png').replace(/^data:image\/(png|jpg);base64,/, '');

  // Dump data into stream and return
  var result = (0, _through2.default)();
  process.nextTick(function () {
    return result.end(new Buffer(data, 'base64'));
  });
  return result;
}

/*
 * Loads images asynchronously
 * returns a promise tracking the load
 */
function loadImage(url) {
  return new Promise(function (resolve, reject) {
    try {
      (function () {
        var image = new Image();
        image.onload = function () {
          resolve(image);
        };
        image.onerror = function () {
          reject(new Error('Could not load image ' + url + '.'));
        };
        image.src = url;
      })();
    } catch (error) {
      reject(error);
    }
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9pby9icm93c2VyL2Jyb3dzZXItaW1hZ2UtaW8uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7UUFnQmdCLGEsR0FBQSxhO1FBMkJBLFMsR0FBQSxTOztBQXRDaEI7Ozs7QUFDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQVVPLFNBQVMsYUFBVCxDQUF1QixLQUF2QixFQUE4QixJQUE5QixFQUFvQztBQUN6QyxNQUFJLGlCQUFpQixpQkFBckIsRUFBd0M7QUFDdEMsUUFBTSxVQUFTLEtBQWY7QUFDQSxXQUFPLFFBQU8sU0FBUCxDQUFpQixJQUFqQixDQUFQO0FBQ0Q7O0FBRUQsd0JBQU8saUJBQWlCLEtBQXhCLEVBQStCLHNDQUEvQjtBQUNBLE1BQU0sU0FBUyxTQUFTLGFBQVQsQ0FBdUIsUUFBdkIsQ0FBZjtBQUNBLFNBQU8sS0FBUCxHQUFlLE1BQU0sS0FBckI7QUFDQSxTQUFPLE1BQVAsR0FBZ0IsTUFBTSxNQUF0QjtBQUNBLFNBQU8sVUFBUCxDQUFrQixJQUFsQixFQUF3QixTQUF4QixDQUFrQyxLQUFsQyxFQUF5QyxDQUF6QyxFQUE0QyxDQUE1Qzs7O0FBR0EsTUFBTSxPQUNKLE9BQU8sU0FBUCxDQUFpQixRQUFRLEtBQXpCLEVBQ0csT0FESCxDQUNXLGdDQURYLEVBQzZDLEVBRDdDLENBREY7OztBQUtBLE1BQU0sU0FBUyx3QkFBZjtBQUNBLFVBQVEsUUFBUixDQUFpQjtBQUFBLFdBQU0sT0FBTyxHQUFQLENBQVcsSUFBSSxNQUFKLENBQVcsSUFBWCxFQUFpQixRQUFqQixDQUFYLENBQU47QUFBQSxHQUFqQjtBQUNBLFNBQU8sTUFBUDtBQUNEOzs7Ozs7QUFNTSxTQUFTLFNBQVQsQ0FBbUIsR0FBbkIsRUFBd0I7QUFDN0IsU0FBTyxJQUFJLE9BQUosQ0FBWSxVQUFTLE9BQVQsRUFBa0IsTUFBbEIsRUFBMEI7QUFDM0MsUUFBSTtBQUFBO0FBQ0YsWUFBTSxRQUFRLElBQUksS0FBSixFQUFkO0FBQ0EsY0FBTSxNQUFOLEdBQWUsWUFBVztBQUN4QixrQkFBUSxLQUFSO0FBQ0QsU0FGRDtBQUdBLGNBQU0sT0FBTixHQUFnQixZQUFXO0FBQ3pCLGlCQUFPLElBQUksS0FBSiwyQkFBa0MsR0FBbEMsT0FBUDtBQUNELFNBRkQ7QUFHQSxjQUFNLEdBQU4sR0FBWSxHQUFaO0FBUkU7QUFTSCxLQVRELENBU0UsT0FBTyxLQUFQLEVBQWM7QUFDZCxhQUFPLEtBQVA7QUFDRDtBQUNGLEdBYk0sQ0FBUDtBQWNEIiwiZmlsZSI6ImJyb3dzZXItaW1hZ2UtaW8uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBJbWFnZSBsb2FkaW5nL3NhdmluZyBmb3IgYnJvd3NlclxuLyogZ2xvYmFsIGRvY3VtZW50LCBIVE1MQ2FudmFzRWxlbWVudCwgSW1hZ2UgKi9cbi8qIGVzbGludC1kaXNhYmxlIGd1YXJkLWZvci1pbiwgY29tcGxleGl0eSwgbm8tdHJ5LWNhdGNoICovXG5cbi8qIGdsb2JhbCBwcm9jZXNzLCBCdWZmZXIgKi9cbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcbmltcG9ydCB0aHJvdWdoIGZyb20gJ3Rocm91Z2gnO1xuXG4vKlxuICogUmV0dXJucyBkYXRhIGJ5dGVzIHJlcHJlc2VudGluZyBhIGNvbXByZXNzZWQgaW1hZ2UgaW4gUE5HIG9yIEpQRyBmb3JtYXQsXG4gKiBUaGlzIGRhdGEgY2FuIGJlIHNhdmVkIHVzaW5nIGZpbGUgc3lzdGVtIChmKSBtZXRob2RzIG9yXG4gKiB1c2VkIGluIGEgcmVxdWVzdC5cbiAqIEBwYXJhbSB7SW1hZ2V9ICBpbWFnZSAtIEltYWdlIG9yIENhbnZhc1xuICogQHBhcmFtIHtTdHJpbmd9IG9wdC50eXBlPSdwbmcnIC0gcG5nLCBqcGcgb3IgaW1hZ2UvcG5nLCBpbWFnZS9qcGcgYXJlIHZhbGlkXG4gKiBAcGFyYW0ge1N0cmluZ30gb3B0LmRhdGFVUkk9IC0gV2hldGhlciB0byBpbmNsdWRlIGEgZGF0YSBVUkkgaGVhZGVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wcmVzc0ltYWdlKGltYWdlLCB0eXBlKSB7XG4gIGlmIChpbWFnZSBpbnN0YW5jZW9mIEhUTUxDYW52YXNFbGVtZW50KSB7XG4gICAgY29uc3QgY2FudmFzID0gaW1hZ2U7XG4gICAgcmV0dXJuIGNhbnZhcy50b0RhdGFVUkwodHlwZSk7XG4gIH1cblxuICBhc3NlcnQoaW1hZ2UgaW5zdGFuY2VvZiBJbWFnZSwgJ2dldEltYWdlRGF0YSBhY2NlcHRzIGltYWdlIG9yIGNhbnZhcycpO1xuICBjb25zdCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgY2FudmFzLndpZHRoID0gaW1hZ2Uud2lkdGg7XG4gIGNhbnZhcy5oZWlnaHQgPSBpbWFnZS5oZWlnaHQ7XG4gIGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpLmRyYXdJbWFnZShpbWFnZSwgMCwgMCk7XG5cbiAgLy8gR2V0IHJhdyBpbWFnZSBkYXRhXG4gIGNvbnN0IGRhdGEgPVxuICAgIGNhbnZhcy50b0RhdGFVUkwodHlwZSB8fCAncG5nJylcbiAgICAgIC5yZXBsYWNlKC9eZGF0YTppbWFnZVxcLyhwbmd8anBnKTtiYXNlNjQsLywgJycpO1xuXG4gIC8vIER1bXAgZGF0YSBpbnRvIHN0cmVhbSBhbmQgcmV0dXJuXG4gIGNvbnN0IHJlc3VsdCA9IHRocm91Z2goKTtcbiAgcHJvY2Vzcy5uZXh0VGljaygoKSA9PiByZXN1bHQuZW5kKG5ldyBCdWZmZXIoZGF0YSwgJ2Jhc2U2NCcpKSk7XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qXG4gKiBMb2FkcyBpbWFnZXMgYXN5bmNocm9ub3VzbHlcbiAqIHJldHVybnMgYSBwcm9taXNlIHRyYWNraW5nIHRoZSBsb2FkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkSW1hZ2UodXJsKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICAgIGltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXNvbHZlKGltYWdlKTtcbiAgICAgIH07XG4gICAgICBpbWFnZS5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlamVjdChuZXcgRXJyb3IoYENvdWxkIG5vdCBsb2FkIGltYWdlICR7dXJsfS5gKSk7XG4gICAgICB9O1xuICAgICAgaW1hZ2Uuc3JjID0gdXJsO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICByZWplY3QoZXJyb3IpO1xuICAgIH1cbiAgfSk7XG59XG4iXX0=