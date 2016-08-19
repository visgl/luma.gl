'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.compressImage = compressImage;
exports.loadImage = loadImage;

var _getPixels = require('get-pixels');

var _getPixels2 = _interopRequireDefault(_getPixels);

var _savePixels = require('save-pixels');

var _savePixels2 = _interopRequireDefault(_savePixels);

var _ndarray = require('ndarray');

var _ndarray2 = _interopRequireDefault(_ndarray);

var _fs = require('fs');

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Returns data bytes representing a compressed image in PNG or JPG format,
 * This data can be saved using file system (f) methods or
 * used in a request.
 * @param {Image} image to save
 * @param {String} opt.type='png' - png, jpg or image/png, image/jpg are valid
 * @param {String} opt.dataURI= - Whether to include a data URI header
 * @return {*} bytes
 */
function compressImage(image) {
  var type = arguments.length <= 1 || arguments[1] === undefined ? 'png' : arguments[1];

  return (0, _savePixels2.default)((0, _ndarray2.default)(image.data, [image.width, image.height, 4], [4, image.width * 4, 1], 0), type.replace('image/', ''));
} // Use stackgl modules for DOM-less reading and writing of images
// NOTE: These are not dependencies of luma.gl.
// They need to be imported by the app.


var getPixelsAsync = (0, _utils.promisify)(_getPixels2.default);

function loadImage(url) {
  return getPixelsAsync(url);
}

_utils.lumaGlobals.modules.getPixels = _getPixels2.default;
_utils.lumaGlobals.modules.savePixels = _savePixels2.default;
_utils.lumaGlobals.modules.ndarray = _ndarray2.default;

_utils.lumaGlobals.nodeIO = {
  readFile: _fs.readFile,
  writeFile: _fs.writeFile,
  compressImage: compressImage,
  loadImage: loadImage
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9oZWFkbGVzcy1pby5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztRQW1CZ0IsYSxHQUFBLGE7UUFVQSxTLEdBQUEsUzs7QUExQmhCOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOztBQUVBOzs7O0FBRUE7Ozs7Ozs7OztBQVNPLFNBQVMsYUFBVCxDQUF1QixLQUF2QixFQUE0QztBQUFBLE1BQWQsSUFBYyx5REFBUCxLQUFPOztBQUNqRCxTQUFPLDBCQUFXLHVCQUNoQixNQUFNLElBRFUsRUFFaEIsQ0FBQyxNQUFNLEtBQVAsRUFBYyxNQUFNLE1BQXBCLEVBQTRCLENBQTVCLENBRmdCLEVBR2hCLENBQUMsQ0FBRCxFQUFJLE1BQU0sS0FBTixHQUFjLENBQWxCLEVBQXFCLENBQXJCLENBSGdCLEVBSWhCLENBSmdCLENBQVgsRUFJRCxLQUFLLE9BQUwsQ0FBYSxRQUFiLEVBQXVCLEVBQXZCLENBSkMsQ0FBUDtBQUtELEMsQ0F6QkQ7QUFDQTtBQUNBOzs7QUF5QkEsSUFBTSxpQkFBaUIsMENBQXZCOztBQUVPLFNBQVMsU0FBVCxDQUFtQixHQUFuQixFQUF3QjtBQUM3QixTQUFPLGVBQWUsR0FBZixDQUFQO0FBQ0Q7O0FBR0QsbUJBQVksT0FBWixDQUFvQixTQUFwQjtBQUNBLG1CQUFZLE9BQVosQ0FBb0IsVUFBcEI7QUFDQSxtQkFBWSxPQUFaLENBQW9CLE9BQXBCOztBQUVBLG1CQUFZLE1BQVosR0FBcUI7QUFDbkIsd0JBRG1CO0FBRW5CLDBCQUZtQjtBQUduQiw4QkFIbUI7QUFJbkI7QUFKbUIsQ0FBckIiLCJmaWxlIjoiaGVhZGxlc3MtaW8uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBVc2Ugc3RhY2tnbCBtb2R1bGVzIGZvciBET00tbGVzcyByZWFkaW5nIGFuZCB3cml0aW5nIG9mIGltYWdlc1xuLy8gTk9URTogVGhlc2UgYXJlIG5vdCBkZXBlbmRlbmNpZXMgb2YgbHVtYS5nbC5cbi8vIFRoZXkgbmVlZCB0byBiZSBpbXBvcnRlZCBieSB0aGUgYXBwLlxuaW1wb3J0IGdldFBpeGVscyBmcm9tICdnZXQtcGl4ZWxzJztcbmltcG9ydCBzYXZlUGl4ZWxzIGZyb20gJ3NhdmUtcGl4ZWxzJztcbmltcG9ydCBuZGFycmF5IGZyb20gJ25kYXJyYXknO1xuaW1wb3J0IHtyZWFkRmlsZSwgd3JpdGVGaWxlfSBmcm9tICdmcyc7XG5cbmltcG9ydCB7cHJvbWlzaWZ5LCBsdW1hR2xvYmFsc30gZnJvbSAnLi91dGlscyc7XG5cbi8qKlxuICogUmV0dXJucyBkYXRhIGJ5dGVzIHJlcHJlc2VudGluZyBhIGNvbXByZXNzZWQgaW1hZ2UgaW4gUE5HIG9yIEpQRyBmb3JtYXQsXG4gKiBUaGlzIGRhdGEgY2FuIGJlIHNhdmVkIHVzaW5nIGZpbGUgc3lzdGVtIChmKSBtZXRob2RzIG9yXG4gKiB1c2VkIGluIGEgcmVxdWVzdC5cbiAqIEBwYXJhbSB7SW1hZ2V9IGltYWdlIHRvIHNhdmVcbiAqIEBwYXJhbSB7U3RyaW5nfSBvcHQudHlwZT0ncG5nJyAtIHBuZywganBnIG9yIGltYWdlL3BuZywgaW1hZ2UvanBnIGFyZSB2YWxpZFxuICogQHBhcmFtIHtTdHJpbmd9IG9wdC5kYXRhVVJJPSAtIFdoZXRoZXIgdG8gaW5jbHVkZSBhIGRhdGEgVVJJIGhlYWRlclxuICogQHJldHVybiB7Kn0gYnl0ZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXByZXNzSW1hZ2UoaW1hZ2UsIHR5cGUgPSAncG5nJykge1xuICByZXR1cm4gc2F2ZVBpeGVscyhuZGFycmF5KFxuICAgIGltYWdlLmRhdGEsXG4gICAgW2ltYWdlLndpZHRoLCBpbWFnZS5oZWlnaHQsIDRdLFxuICAgIFs0LCBpbWFnZS53aWR0aCAqIDQsIDFdLFxuICAgIDApLCB0eXBlLnJlcGxhY2UoJ2ltYWdlLycsICcnKSk7XG59XG5cbmNvbnN0IGdldFBpeGVsc0FzeW5jID0gcHJvbWlzaWZ5KGdldFBpeGVscyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2FkSW1hZ2UodXJsKSB7XG4gIHJldHVybiBnZXRQaXhlbHNBc3luYyh1cmwpO1xufVxuXG5cbmx1bWFHbG9iYWxzLm1vZHVsZXMuZ2V0UGl4ZWxzID0gZ2V0UGl4ZWxzO1xubHVtYUdsb2JhbHMubW9kdWxlcy5zYXZlUGl4ZWxzID0gc2F2ZVBpeGVscztcbmx1bWFHbG9iYWxzLm1vZHVsZXMubmRhcnJheSA9IG5kYXJyYXk7XG5cbmx1bWFHbG9iYWxzLm5vZGVJTyA9IHtcbiAgcmVhZEZpbGUsXG4gIHdyaXRlRmlsZSxcbiAgY29tcHJlc3NJbWFnZSxcbiAgbG9hZEltYWdlXG59O1xuIl19