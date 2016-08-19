'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _glConstants = require('gl-constants');

var _glConstants2 = _interopRequireDefault(_glConstants);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Extracts constants from WebGL prototype
function getWebGLConstants() {
  var constants = {};
  var WebGLContext = glob.WebGL2RenderingContext || WebGLRenderingContext;
  for (var key in WebGLContext.prototype) {
    if (typeof WebGLContext[key] !== 'function') {
      constants[key] = WebGLContext[key];
    }
  }
  Object.freeze(constants);
  return constants;
}

// const GL = getWebGLConstants();

// WEBGL BUILT-IN TYPES
exports.default = _glConstants2.default;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC93ZWJnbC1jb25zdGFudHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ0E7Ozs7Ozs7QUFHQSxTQUFTLGlCQUFULEdBQTZCO0FBQzNCLE1BQU0sWUFBWSxFQUFsQjtBQUNBLE1BQU0sZUFDSixLQUFLLHNCQUFMLElBQStCLHFCQURqQztBQUVBLE9BQUssSUFBTSxHQUFYLElBQWtCLGFBQWEsU0FBL0IsRUFBMEM7QUFDeEMsUUFBSSxPQUFPLGFBQWEsR0FBYixDQUFQLEtBQTZCLFVBQWpDLEVBQTZDO0FBQzNDLGdCQUFVLEdBQVYsSUFBaUIsYUFBYSxHQUFiLENBQWpCO0FBQ0Q7QUFDRjtBQUNELFNBQU8sTUFBUCxDQUFjLFNBQWQ7QUFDQSxTQUFPLFNBQVA7QUFDRCIsImZpbGUiOiJ3ZWJnbC1jb25zdGFudHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBXRUJHTCBCVUlMVC1JTiBUWVBFU1xuaW1wb3J0IEdMIGZyb20gJ2dsLWNvbnN0YW50cyc7XG5cbi8vIEV4dHJhY3RzIGNvbnN0YW50cyBmcm9tIFdlYkdMIHByb3RvdHlwZVxuZnVuY3Rpb24gZ2V0V2ViR0xDb25zdGFudHMoKSB7XG4gIGNvbnN0IGNvbnN0YW50cyA9IHt9O1xuICBjb25zdCBXZWJHTENvbnRleHQgPVxuICAgIGdsb2IuV2ViR0wyUmVuZGVyaW5nQ29udGV4dCB8fCBXZWJHTFJlbmRlcmluZ0NvbnRleHQ7XG4gIGZvciAoY29uc3Qga2V5IGluIFdlYkdMQ29udGV4dC5wcm90b3R5cGUpIHtcbiAgICBpZiAodHlwZW9mIFdlYkdMQ29udGV4dFtrZXldICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjb25zdGFudHNba2V5XSA9IFdlYkdMQ29udGV4dFtrZXldO1xuICAgIH1cbiAgfVxuICBPYmplY3QuZnJlZXplKGNvbnN0YW50cyk7XG4gIHJldHVybiBjb25zdGFudHM7XG59XG5cbi8vIGNvbnN0IEdMID0gZ2V0V2ViR0xDb25zdGFudHMoKTtcblxuZXhwb3J0IGRlZmF1bHQgR0w7XG4iXX0=