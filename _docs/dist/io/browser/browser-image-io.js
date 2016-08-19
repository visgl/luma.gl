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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9pby9icm93c2VyL2Jyb3dzZXItaW1hZ2UtaW8uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7UUFnQmdCLGEsR0FBQSxhO1FBMkJBLFMsR0FBQSxTOztBQXRDaEI7Ozs7QUFDQTs7Ozs7O0FBRUE7Ozs7Ozs7O0FBUkE7QUFDQTtBQUNBOztBQUVBO0FBWU8sU0FBUyxhQUFULENBQXVCLEtBQXZCLEVBQThCLElBQTlCLEVBQW9DO0FBQ3pDLE1BQUksaUJBQWlCLGlCQUFyQixFQUF3QztBQUN0QyxRQUFNLFVBQVMsS0FBZjtBQUNBLFdBQU8sUUFBTyxTQUFQLENBQWlCLElBQWpCLENBQVA7QUFDRDs7QUFFRCx3QkFBTyxpQkFBaUIsS0FBeEIsRUFBK0Isc0NBQS9CO0FBQ0EsTUFBTSxTQUFTLFNBQVMsYUFBVCxDQUF1QixRQUF2QixDQUFmO0FBQ0EsU0FBTyxLQUFQLEdBQWUsTUFBTSxLQUFyQjtBQUNBLFNBQU8sTUFBUCxHQUFnQixNQUFNLE1BQXRCO0FBQ0EsU0FBTyxVQUFQLENBQWtCLElBQWxCLEVBQXdCLFNBQXhCLENBQWtDLEtBQWxDLEVBQXlDLENBQXpDLEVBQTRDLENBQTVDOztBQUVBO0FBQ0EsTUFBTSxPQUNKLE9BQU8sU0FBUCxDQUFpQixRQUFRLEtBQXpCLEVBQ0csT0FESCxDQUNXLGdDQURYLEVBQzZDLEVBRDdDLENBREY7O0FBSUE7QUFDQSxNQUFNLFNBQVMsd0JBQWY7QUFDQSxVQUFRLFFBQVIsQ0FBaUI7QUFBQSxXQUFNLE9BQU8sR0FBUCxDQUFXLElBQUksTUFBSixDQUFXLElBQVgsRUFBaUIsUUFBakIsQ0FBWCxDQUFOO0FBQUEsR0FBakI7QUFDQSxTQUFPLE1BQVA7QUFDRDs7QUFFRDs7OztBQUlPLFNBQVMsU0FBVCxDQUFtQixHQUFuQixFQUF3QjtBQUM3QixTQUFPLElBQUksT0FBSixDQUFZLFVBQVMsT0FBVCxFQUFrQixNQUFsQixFQUEwQjtBQUMzQyxRQUFJO0FBQUE7QUFDRixZQUFNLFFBQVEsSUFBSSxLQUFKLEVBQWQ7QUFDQSxjQUFNLE1BQU4sR0FBZSxZQUFXO0FBQ3hCLGtCQUFRLEtBQVI7QUFDRCxTQUZEO0FBR0EsY0FBTSxPQUFOLEdBQWdCLFlBQVc7QUFDekIsaUJBQU8sSUFBSSxLQUFKLDJCQUFrQyxHQUFsQyxPQUFQO0FBQ0QsU0FGRDtBQUdBLGNBQU0sR0FBTixHQUFZLEdBQVo7QUFSRTtBQVNILEtBVEQsQ0FTRSxPQUFPLEtBQVAsRUFBYztBQUNkLGFBQU8sS0FBUDtBQUNEO0FBQ0YsR0FiTSxDQUFQO0FBY0QiLCJmaWxlIjoiYnJvd3Nlci1pbWFnZS1pby5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIEltYWdlIGxvYWRpbmcvc2F2aW5nIGZvciBicm93c2VyXG4vKiBnbG9iYWwgZG9jdW1lbnQsIEhUTUxDYW52YXNFbGVtZW50LCBJbWFnZSAqL1xuLyogZXNsaW50LWRpc2FibGUgZ3VhcmQtZm9yLWluLCBjb21wbGV4aXR5LCBuby10cnktY2F0Y2ggKi9cblxuLyogZ2xvYmFsIHByb2Nlc3MsIEJ1ZmZlciAqL1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuaW1wb3J0IHRocm91Z2ggZnJvbSAndGhyb3VnaCc7XG5cbi8qXG4gKiBSZXR1cm5zIGRhdGEgYnl0ZXMgcmVwcmVzZW50aW5nIGEgY29tcHJlc3NlZCBpbWFnZSBpbiBQTkcgb3IgSlBHIGZvcm1hdCxcbiAqIFRoaXMgZGF0YSBjYW4gYmUgc2F2ZWQgdXNpbmcgZmlsZSBzeXN0ZW0gKGYpIG1ldGhvZHMgb3JcbiAqIHVzZWQgaW4gYSByZXF1ZXN0LlxuICogQHBhcmFtIHtJbWFnZX0gIGltYWdlIC0gSW1hZ2Ugb3IgQ2FudmFzXG4gKiBAcGFyYW0ge1N0cmluZ30gb3B0LnR5cGU9J3BuZycgLSBwbmcsIGpwZyBvciBpbWFnZS9wbmcsIGltYWdlL2pwZyBhcmUgdmFsaWRcbiAqIEBwYXJhbSB7U3RyaW5nfSBvcHQuZGF0YVVSST0gLSBXaGV0aGVyIHRvIGluY2x1ZGUgYSBkYXRhIFVSSSBoZWFkZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXByZXNzSW1hZ2UoaW1hZ2UsIHR5cGUpIHtcbiAgaWYgKGltYWdlIGluc3RhbmNlb2YgSFRNTENhbnZhc0VsZW1lbnQpIHtcbiAgICBjb25zdCBjYW52YXMgPSBpbWFnZTtcbiAgICByZXR1cm4gY2FudmFzLnRvRGF0YVVSTCh0eXBlKTtcbiAgfVxuXG4gIGFzc2VydChpbWFnZSBpbnN0YW5jZW9mIEltYWdlLCAnZ2V0SW1hZ2VEYXRhIGFjY2VwdHMgaW1hZ2Ugb3IgY2FudmFzJyk7XG4gIGNvbnN0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICBjYW52YXMud2lkdGggPSBpbWFnZS53aWR0aDtcbiAgY2FudmFzLmhlaWdodCA9IGltYWdlLmhlaWdodDtcbiAgY2FudmFzLmdldENvbnRleHQoJzJkJykuZHJhd0ltYWdlKGltYWdlLCAwLCAwKTtcblxuICAvLyBHZXQgcmF3IGltYWdlIGRhdGFcbiAgY29uc3QgZGF0YSA9XG4gICAgY2FudmFzLnRvRGF0YVVSTCh0eXBlIHx8ICdwbmcnKVxuICAgICAgLnJlcGxhY2UoL15kYXRhOmltYWdlXFwvKHBuZ3xqcGcpO2Jhc2U2NCwvLCAnJyk7XG5cbiAgLy8gRHVtcCBkYXRhIGludG8gc3RyZWFtIGFuZCByZXR1cm5cbiAgY29uc3QgcmVzdWx0ID0gdGhyb3VnaCgpO1xuICBwcm9jZXNzLm5leHRUaWNrKCgpID0+IHJlc3VsdC5lbmQobmV3IEJ1ZmZlcihkYXRhLCAnYmFzZTY0JykpKTtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLypcbiAqIExvYWRzIGltYWdlcyBhc3luY2hyb25vdXNseVxuICogcmV0dXJucyBhIHByb21pc2UgdHJhY2tpbmcgdGhlIGxvYWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvYWRJbWFnZSh1cmwpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBpbWFnZSA9IG5ldyBJbWFnZSgpO1xuICAgICAgaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlc29sdmUoaW1hZ2UpO1xuICAgICAgfTtcbiAgICAgIGltYWdlLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVqZWN0KG5ldyBFcnJvcihgQ291bGQgbm90IGxvYWQgaW1hZ2UgJHt1cmx9LmApKTtcbiAgICAgIH07XG4gICAgICBpbWFnZS5zcmMgPSB1cmw7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHJlamVjdChlcnJvcik7XG4gICAgfVxuICB9KTtcbn1cbiJdfQ==