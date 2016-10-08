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
          return resolve(image);
        };
        image.onerror = function () {
          return reject(new Error('Could not load image ' + url + '.'));
        };
        image.src = url;
      })();
    } catch (error) {
      reject(error);
    }
  });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9pby9icm93c2VyL2Jyb3dzZXItaW1hZ2UtaW8uanMiXSwibmFtZXMiOlsiY29tcHJlc3NJbWFnZSIsImxvYWRJbWFnZSIsImltYWdlIiwidHlwZSIsIkhUTUxDYW52YXNFbGVtZW50IiwiY2FudmFzIiwidG9EYXRhVVJMIiwiSW1hZ2UiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJ3aWR0aCIsImhlaWdodCIsImdldENvbnRleHQiLCJkcmF3SW1hZ2UiLCJkYXRhIiwicmVwbGFjZSIsInJlc3VsdCIsInByb2Nlc3MiLCJuZXh0VGljayIsImVuZCIsIkJ1ZmZlciIsInVybCIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0Iiwib25sb2FkIiwib25lcnJvciIsIkVycm9yIiwic3JjIiwiZXJyb3IiXSwibWFwcGluZ3MiOiI7Ozs7O1FBZWdCQSxhLEdBQUFBLGE7UUEyQkFDLFMsR0FBQUEsUzs7QUF0Q2hCOzs7O0FBQ0E7Ozs7OztBQUVBOzs7Ozs7OztBQVBBO0FBQ0E7O0FBRUE7QUFZTyxTQUFTRCxhQUFULENBQXVCRSxLQUF2QixFQUE4QkMsSUFBOUIsRUFBb0M7QUFDekMsTUFBSUQsaUJBQWlCRSxpQkFBckIsRUFBd0M7QUFDdEMsUUFBTUMsVUFBU0gsS0FBZjtBQUNBLFdBQU9HLFFBQU9DLFNBQVAsQ0FBaUJILElBQWpCLENBQVA7QUFDRDs7QUFFRCx3QkFBT0QsaUJBQWlCSyxLQUF4QixFQUErQixzQ0FBL0I7QUFDQSxNQUFNRixTQUFTRyxTQUFTQyxhQUFULENBQXVCLFFBQXZCLENBQWY7QUFDQUosU0FBT0ssS0FBUCxHQUFlUixNQUFNUSxLQUFyQjtBQUNBTCxTQUFPTSxNQUFQLEdBQWdCVCxNQUFNUyxNQUF0QjtBQUNBTixTQUFPTyxVQUFQLENBQWtCLElBQWxCLEVBQXdCQyxTQUF4QixDQUFrQ1gsS0FBbEMsRUFBeUMsQ0FBekMsRUFBNEMsQ0FBNUM7O0FBRUE7QUFDQSxNQUFNWSxPQUNKVCxPQUFPQyxTQUFQLENBQWlCSCxRQUFRLEtBQXpCLEVBQ0dZLE9BREgsQ0FDVyxnQ0FEWCxFQUM2QyxFQUQ3QyxDQURGOztBQUlBO0FBQ0EsTUFBTUMsU0FBUyx3QkFBZjtBQUNBQyxVQUFRQyxRQUFSLENBQWlCO0FBQUEsV0FBTUYsT0FBT0csR0FBUCxDQUFXLElBQUlDLE1BQUosQ0FBV04sSUFBWCxFQUFpQixRQUFqQixDQUFYLENBQU47QUFBQSxHQUFqQjtBQUNBLFNBQU9FLE1BQVA7QUFDRDs7QUFFRDs7OztBQUlPLFNBQVNmLFNBQVQsQ0FBbUJvQixHQUFuQixFQUF3QjtBQUM3QixTQUFPLElBQUlDLE9BQUosQ0FBWSxVQUFDQyxPQUFELEVBQVVDLE1BQVYsRUFBcUI7QUFDdEMsUUFBSTtBQUFBO0FBQ0YsWUFBTXRCLFFBQVEsSUFBSUssS0FBSixFQUFkO0FBQ0FMLGNBQU11QixNQUFOLEdBQWU7QUFBQSxpQkFBTUYsUUFBUXJCLEtBQVIsQ0FBTjtBQUFBLFNBQWY7QUFDQUEsY0FBTXdCLE9BQU4sR0FBZ0I7QUFBQSxpQkFBTUYsT0FBTyxJQUFJRyxLQUFKLDJCQUFrQ04sR0FBbEMsT0FBUCxDQUFOO0FBQUEsU0FBaEI7QUFDQW5CLGNBQU0wQixHQUFOLEdBQVlQLEdBQVo7QUFKRTtBQUtILEtBTEQsQ0FLRSxPQUFPUSxLQUFQLEVBQWM7QUFDZEwsYUFBT0ssS0FBUDtBQUNEO0FBQ0YsR0FUTSxDQUFQO0FBVUQiLCJmaWxlIjoiYnJvd3Nlci1pbWFnZS1pby5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIEltYWdlIGxvYWRpbmcvc2F2aW5nIGZvciBicm93c2VyXG4vKiBnbG9iYWwgZG9jdW1lbnQsIEhUTUxDYW52YXNFbGVtZW50LCBJbWFnZSAqL1xuXG4vKiBnbG9iYWwgcHJvY2VzcywgQnVmZmVyICovXG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5pbXBvcnQgdGhyb3VnaCBmcm9tICd0aHJvdWdoJztcblxuLypcbiAqIFJldHVybnMgZGF0YSBieXRlcyByZXByZXNlbnRpbmcgYSBjb21wcmVzc2VkIGltYWdlIGluIFBORyBvciBKUEcgZm9ybWF0LFxuICogVGhpcyBkYXRhIGNhbiBiZSBzYXZlZCB1c2luZyBmaWxlIHN5c3RlbSAoZikgbWV0aG9kcyBvclxuICogdXNlZCBpbiBhIHJlcXVlc3QuXG4gKiBAcGFyYW0ge0ltYWdlfSAgaW1hZ2UgLSBJbWFnZSBvciBDYW52YXNcbiAqIEBwYXJhbSB7U3RyaW5nfSBvcHQudHlwZT0ncG5nJyAtIHBuZywganBnIG9yIGltYWdlL3BuZywgaW1hZ2UvanBnIGFyZSB2YWxpZFxuICogQHBhcmFtIHtTdHJpbmd9IG9wdC5kYXRhVVJJPSAtIFdoZXRoZXIgdG8gaW5jbHVkZSBhIGRhdGEgVVJJIGhlYWRlclxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcHJlc3NJbWFnZShpbWFnZSwgdHlwZSkge1xuICBpZiAoaW1hZ2UgaW5zdGFuY2VvZiBIVE1MQ2FudmFzRWxlbWVudCkge1xuICAgIGNvbnN0IGNhbnZhcyA9IGltYWdlO1xuICAgIHJldHVybiBjYW52YXMudG9EYXRhVVJMKHR5cGUpO1xuICB9XG5cbiAgYXNzZXJ0KGltYWdlIGluc3RhbmNlb2YgSW1hZ2UsICdnZXRJbWFnZURhdGEgYWNjZXB0cyBpbWFnZSBvciBjYW52YXMnKTtcbiAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gIGNhbnZhcy53aWR0aCA9IGltYWdlLndpZHRoO1xuICBjYW52YXMuaGVpZ2h0ID0gaW1hZ2UuaGVpZ2h0O1xuICBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKS5kcmF3SW1hZ2UoaW1hZ2UsIDAsIDApO1xuXG4gIC8vIEdldCByYXcgaW1hZ2UgZGF0YVxuICBjb25zdCBkYXRhID1cbiAgICBjYW52YXMudG9EYXRhVVJMKHR5cGUgfHwgJ3BuZycpXG4gICAgICAucmVwbGFjZSgvXmRhdGE6aW1hZ2VcXC8ocG5nfGpwZyk7YmFzZTY0LC8sICcnKTtcblxuICAvLyBEdW1wIGRhdGEgaW50byBzdHJlYW0gYW5kIHJldHVyblxuICBjb25zdCByZXN1bHQgPSB0aHJvdWdoKCk7XG4gIHByb2Nlc3MubmV4dFRpY2soKCkgPT4gcmVzdWx0LmVuZChuZXcgQnVmZmVyKGRhdGEsICdiYXNlNjQnKSkpO1xuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKlxuICogTG9hZHMgaW1hZ2VzIGFzeW5jaHJvbm91c2x5XG4gKiByZXR1cm5zIGEgcHJvbWlzZSB0cmFja2luZyB0aGUgbG9hZFxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZEltYWdlKHVybCkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuICAgICAgaW1hZ2Uub25sb2FkID0gKCkgPT4gcmVzb2x2ZShpbWFnZSk7XG4gICAgICBpbWFnZS5vbmVycm9yID0gKCkgPT4gcmVqZWN0KG5ldyBFcnJvcihgQ291bGQgbm90IGxvYWQgaW1hZ2UgJHt1cmx9LmApKTtcbiAgICAgIGltYWdlLnNyYyA9IHVybDtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICB9XG4gIH0pO1xufVxuIl19