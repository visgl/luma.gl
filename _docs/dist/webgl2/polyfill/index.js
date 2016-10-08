'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = initPolyfill;

require('instanced-arrays');

require('vertex-array-object');

var _drawBuffers = require('draw-buffers');

var _drawBuffers2 = _interopRequireDefault(_drawBuffers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function initPolyfill(gl) {
  (0, _drawBuffers2.default)(gl);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy93ZWJnbDIvcG9seWZpbGwvaW5kZXguanMiXSwibmFtZXMiOlsiaW5pdFBvbHlmaWxsIiwiZ2wiXSwibWFwcGluZ3MiOiI7Ozs7O2tCQUl3QkEsWTs7QUFKeEI7O0FBQ0E7O0FBQ0E7Ozs7OztBQUVlLFNBQVNBLFlBQVQsQ0FBc0JDLEVBQXRCLEVBQTBCO0FBQ3ZDLDZCQUFzQkEsRUFBdEI7QUFDRCIsImZpbGUiOiJpbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAnaW5zdGFuY2VkLWFycmF5cyc7XG5pbXBvcnQgJ3ZlcnRleC1hcnJheS1vYmplY3QnO1xuaW1wb3J0IGluaXRpYWxpemVEcmF3QnVmZmVycyBmcm9tICdkcmF3LWJ1ZmZlcnMnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBpbml0UG9seWZpbGwoZ2wpIHtcbiAgaW5pdGlhbGl6ZURyYXdCdWZmZXJzKGdsKTtcbn1cbiJdfQ==