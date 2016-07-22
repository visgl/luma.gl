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

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Use stackgl modules for DOM-less reading and writing of images


var getPixelsAsync = (0, _utils.promisify)(_getPixels2.default);

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
}

function loadImage(url) {
  return getPixelsAsync(url);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9pby9ub2RlL25vZGUtaW1hZ2UtaW8uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7UUFpQmdCLGEsR0FBQSxhO1FBUUEsUyxHQUFBLFM7O0FBeEJoQjs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7OztBQUVBLElBQU0saUJBQWlCLDBDQUF2Qjs7Ozs7Ozs7Ozs7QUFXTyxTQUFTLGFBQVQsQ0FBdUIsS0FBdkIsRUFBNEM7QUFBQSxNQUFkLElBQWMseURBQVAsS0FBTzs7QUFDakQsU0FBTywwQkFBVyx1QkFDaEIsTUFBTSxJQURVLEVBRWhCLENBQUMsTUFBTSxLQUFQLEVBQWMsTUFBTSxNQUFwQixFQUE0QixDQUE1QixDQUZnQixFQUdoQixDQUFDLENBQUQsRUFBSSxNQUFNLEtBQU4sR0FBYyxDQUFsQixFQUFxQixDQUFyQixDQUhnQixFQUloQixDQUpnQixDQUFYLEVBSUQsS0FBSyxPQUFMLENBQWEsUUFBYixFQUF1QixFQUF2QixDQUpDLENBQVA7QUFLRDs7QUFFTSxTQUFTLFNBQVQsQ0FBbUIsR0FBbkIsRUFBd0I7QUFDN0IsU0FBTyxlQUFlLEdBQWYsQ0FBUDtBQUNEIiwiZmlsZSI6Im5vZGUtaW1hZ2UtaW8uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBVc2Ugc3RhY2tnbCBtb2R1bGVzIGZvciBET00tbGVzcyByZWFkaW5nIGFuZCB3cml0aW5nIG9mIGltYWdlc1xuaW1wb3J0IGdldFBpeGVscyBmcm9tICdnZXQtcGl4ZWxzJztcbmltcG9ydCBzYXZlUGl4ZWxzIGZyb20gJ3NhdmUtcGl4ZWxzJztcbmltcG9ydCBuZGFycmF5IGZyb20gJ25kYXJyYXknO1xuaW1wb3J0IHtwcm9taXNpZnl9IGZyb20gJy4uL3V0aWxzJztcblxuY29uc3QgZ2V0UGl4ZWxzQXN5bmMgPSBwcm9taXNpZnkoZ2V0UGl4ZWxzKTtcblxuLyoqXG4gKiBSZXR1cm5zIGRhdGEgYnl0ZXMgcmVwcmVzZW50aW5nIGEgY29tcHJlc3NlZCBpbWFnZSBpbiBQTkcgb3IgSlBHIGZvcm1hdCxcbiAqIFRoaXMgZGF0YSBjYW4gYmUgc2F2ZWQgdXNpbmcgZmlsZSBzeXN0ZW0gKGYpIG1ldGhvZHMgb3JcbiAqIHVzZWQgaW4gYSByZXF1ZXN0LlxuICogQHBhcmFtIHtJbWFnZX0gaW1hZ2UgdG8gc2F2ZVxuICogQHBhcmFtIHtTdHJpbmd9IG9wdC50eXBlPSdwbmcnIC0gcG5nLCBqcGcgb3IgaW1hZ2UvcG5nLCBpbWFnZS9qcGcgYXJlIHZhbGlkXG4gKiBAcGFyYW0ge1N0cmluZ30gb3B0LmRhdGFVUkk9IC0gV2hldGhlciB0byBpbmNsdWRlIGEgZGF0YSBVUkkgaGVhZGVyXG4gKiBAcmV0dXJuIHsqfSBieXRlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcHJlc3NJbWFnZShpbWFnZSwgdHlwZSA9ICdwbmcnKSB7XG4gIHJldHVybiBzYXZlUGl4ZWxzKG5kYXJyYXkoXG4gICAgaW1hZ2UuZGF0YSxcbiAgICBbaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCwgNF0sXG4gICAgWzQsIGltYWdlLndpZHRoICogNCwgMV0sXG4gICAgMCksIHR5cGUucmVwbGFjZSgnaW1hZ2UvJywgJycpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRJbWFnZSh1cmwpIHtcbiAgcmV0dXJuIGdldFBpeGVsc0FzeW5jKHVybCk7XG59XG4iXX0=