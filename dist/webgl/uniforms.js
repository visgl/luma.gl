'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _UNIFORM_BASE_DESCRIP;

exports.parseUniformName = parseUniformName;
exports.getUniformSetter = getUniformSetter;
exports.checkUniformValues = checkUniformValues;
exports.getUniformsTable = getUniformsTable;

var _webglTypes = require('./webgl-types');

var _texture = require('./texture');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// TODO - use tables to reduce complexity of method below
/* eslint-disable max-len */
var UNIFORM_BASE_DESCRIPTORS = (_UNIFORM_BASE_DESCRIP = {}, _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.WebGL.FLOAT, { function: 'uniform1f', type: Float32Array }), _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.WebGL.INT, { function: 'uniform1i', type: Uint16Array }), _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.WebGL.BOOL, { function: 'uniform1i', type: Uint16Array }), _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.WebGL.FLOAT_VEC2, { function: 'uniform2fv', type: Float32Array, elements: 2 }), _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.WebGL.FLOAT_VEC3, { function: 'uniform3fv', type: Float32Array, elements: 3 }), _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.WebGL.FLOAT_VEC4, { function: 'uniform4fv', type: Float32Array, elements: 4 }), _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.WebGL.INT_VEC2, { function: 'uniform2iv', type: Uint16Array, elements: 2 }), _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.WebGL.INT_VEC3, { function: 'uniform3iv', type: Uint16Array, elements: 3 }), _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.WebGL.INT_VEC4, { function: 'uniform4iv', type: Uint16Array, elements: 4 }), _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.WebGL.BOOL_VEC2, { function: 'uniform2iv', type: Uint16Array, elements: 2 }), _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.WebGL.BOOL_VEC3, { function: 'uniform3fv', type: Uint16Array, elements: 3 }), _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.WebGL.BOOL_VEC4, { function: 'uniform4iv', type: Uint16Array, elements: 4 }), _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.WebGL.FLOAT_MAT2, { function: 'uniformMatrix2fv', type: Float32Array, matrix: true, elements: 4 }), _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.WebGL.FLOAT_MAT3, { mfunction: 'uniformMatrix3fv', type: Float32Array, matrix: true, elements: 9 }), _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.WebGL.FLOAT_MAT4, { function: 'uniformMatrix4fv', type: Float32Array, matrix: true, elements: 16 }), _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.WebGL.SAMPLER_2D, { function: 'uniform1i', type: Uint16Array, texture: true }), _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.WebGL.SAMPLER_CUBE, { function: 'uniform1i', type: Uint16Array, texture: true }), _UNIFORM_BASE_DESCRIP);
/* eslint-enable max-len */

function parseUniformName(name) {
  // name = name[name.length - 1] === ']' ?
  // name.substr(0, name.length - 3) : name;

  // if array name then clean the array brackets
  var UNIFORM_NAME_REGEXP = /([^\[]*)(\[[0-9]+\])?/;
  var matches = name.match(UNIFORM_NAME_REGEXP);
  if (!matches || matches.length < 2) {
    throw new Error('Failed to parse GLSL uniform name ' + name);
  }

  return {
    name: matches[1],
    length: matches[2] || 1,
    isArray: Boolean(matches[2])
  };
}

// Returns a Magic Uniform Setter
/* eslint-disable complexity */
function getUniformSetter(gl, location, info) {
  var descriptor = UNIFORM_BASE_DESCRIPTORS[info.type];
  if (!descriptor) {
    throw new Error('Unknown GLSL uniform type ' + info.type);
  }

  var glFunction = gl[descriptor.function].bind(gl);
  var TypedArray = descriptor.type;

  // How many data elements does app need to provide
  var flatArrayLength = info.size * (descriptor.elements || 1);

  // console.log('getSetter', location, info, flatArrayLength);

  // Set a uniform array
  var setter = void 0;
  if (flatArrayLength > 1) {
    setter = function setter(val) {
      if (!(val instanceof TypedArray)) {
        var typedArray = new TypedArray(flatArrayLength);
        typedArray.set(val);
        val = typedArray;
      }
      (0, _assert2.default)(val.length === flatArrayLength);
      if (descriptor.matrix) {
        // Second param: whether to transpose the matrix. Must be false.
        glFunction(location, false, val);
      } else {
        glFunction(location, val);
      }
    };
  } else {
    setter = function setter(val) {
      return glFunction(location, val);
    };
  }

  // Set a primitive-valued uniform
  return setter;
}

// Basic checks of uniform values without knowledge of program
// To facilitate early detection of e.g. undefined values in JavaScript
function checkUniformValues(uniforms, source) {
  for (var uniformName in uniforms) {
    var value = uniforms[uniformName];
    if (!checkUniformValue(value)) {
      // Add space to source
      source = source ? source + ' ' : '';
      /* eslint-disable no-console */
      /* global console */
      // Value could be unprintable so write the object on console
      console.error(source + ' Bad uniform ' + uniformName, value);
      /* eslint-enable no-console */
      throw new Error(source + ' Bad uniform ' + uniformName);
    }
  }
  return true;
}

function checkUniformValue(value) {
  var ok = true;

  // Test for texture (for sampler uniforms)
  // WebGL2: if (value instanceof Texture || value instanceof Sampler) {
  if (value instanceof _texture.Texture) {
    ok = true;
    // Check that every element in array is a number, and at least 1 element
  } else if (Array.isArray(value)) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = value[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var element = _step.value;

        if (!isFinite(element)) {
          ok = false;
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    ok = ok && value.length > 0;
    // Typed arrays can only contain numbers, but check length
  } else if (ArrayBuffer.isView(value)) {
    ok = value.length > 0;
    // Check that single value is a number
  } else if (!isFinite(value)) {
    ok = false;
  }

  return ok;
}

// Prepares a table suitable for console.table
function getUniformsTable() {
  var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  var _ref$header = _ref.header;
  var header = _ref$header === undefined ? 'Uniforms' : _ref$header;
  var program = _ref.program;
  var uniforms = _ref.uniforms;

  (0, _assert2.default)(program);

  var uniformLocations = program._uniformSetters;
  var table = _defineProperty({}, header, {});

  // Add program's provided uniforms
  for (var uniformName in uniformLocations) {
    var uniform = uniforms[uniformName];
    if (uniform !== undefined) {
      table[uniformName] = {
        Type: uniform,
        Value: uniform.toString()
      };
    }
  }

  // Add program's unprovided uniforms
  for (var _uniformName in uniformLocations) {
    var _uniform = uniforms[_uniformName];
    if (_uniform === undefined) {
      table[_uniformName] = {
        Type: 'NOT PROVIDED',
        Value: 'N/A'
      };
    }
  }

  // List any unused uniforms
  for (var _uniformName2 in uniforms) {
    var _uniform2 = uniforms[_uniformName2];
    if (!table[_uniformName2]) {
      table[_uniformName2] = {
        Type: 'NOT USED: ' + _uniform2,
        Value: _uniform2.toString()
      };
    }
  }

  return table;
}

/*
  if (vector) {
    switch (type) {
    case WebGL.FLOAT:
      glFunction = gl.uniform1f;
      break;
    case WebGL.FLOAT_VEC2:
      glFunction = gl.uniform2fv;
      TypedArray = isArray ? Float32Array : new Float32Array(2);
      break;
    case WebGL.FLOAT_VEC3:
      glFunction = gl.uniform3fv;
      TypedArray = isArray ? Float32Array : new Float32Array(3);
      break;
    case WebGL.FLOAT_VEC4:
      glFunction = gl.uniform4fv;
      TypedArray = isArray ? Float32Array : new Float32Array(4);
      break;
    case WebGL.INT:
    case WebGL.BOOL:
    case WebGL.SAMPLER_2D:
    case WebGL.SAMPLER_CUBE:
      glFunction = gl.uniform1i;
      break;
    case WebGL.INT_VEC2:
    case WebGL.BOOL_VEC2:
      glFunction = gl.uniform2iv;
      TypedArray = isArray ? Uint16Array : new Uint16Array(2);
      break;
    case WebGL.INT_VEC3:
    case WebGL.BOOL_VEC3:
      glFunction = gl.uniform3iv;
      TypedArray = isArray ? Uint16Array : new Uint16Array(3);
      break;
    case WebGL.INT_VEC4:
    case WebGL.BOOL_VEC4:
      glFunction = gl.uniform4iv;
      TypedArray = isArray ? Uint16Array : new Uint16Array(4);
      break;
    case WebGL.FLOAT_MAT2:
      matrix = true;
      glFunction = gl.uniformMatrix2fv;
      break;
    case WebGL.FLOAT_MAT3:
      matrix = true;
      glFunction = gl.uniformMatrix3fv;
      break;
    case WebGL.FLOAT_MAT4:
      matrix = true;
      glFunction = gl.uniformMatrix4fv;
      break;
    default:
      break;
    }
  }
*/
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC91bmlmb3Jtcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztRQTJCZ0IsZ0IsR0FBQSxnQjtRQW9CQSxnQixHQUFBLGdCO1FBeUNBLGtCLEdBQUEsa0I7UUE0Q0EsZ0IsR0FBQSxnQjs7QUFwSWhCOztBQUNBOztBQUNBOzs7Ozs7OztBQUVBO0FBQ0E7QUFDQSxJQUFNLCtGQUNILGtCQUFNLEtBREgsRUFDVyxFQUFDLFVBQVUsV0FBWCxFQUF3QixNQUFNLFlBQTlCLEVBRFgsMENBRUgsa0JBQU0sR0FGSCxFQUVTLEVBQUMsVUFBVSxXQUFYLEVBQXdCLE1BQU0sV0FBOUIsRUFGVCwwQ0FHSCxrQkFBTSxJQUhILEVBR1UsRUFBQyxVQUFVLFdBQVgsRUFBd0IsTUFBTSxXQUE5QixFQUhWLDBDQUlILGtCQUFNLFVBSkgsRUFJZ0IsRUFBQyxVQUFVLFlBQVgsRUFBeUIsTUFBTSxZQUEvQixFQUE2QyxVQUFVLENBQXZELEVBSmhCLDBDQUtILGtCQUFNLFVBTEgsRUFLZ0IsRUFBQyxVQUFVLFlBQVgsRUFBeUIsTUFBTSxZQUEvQixFQUE2QyxVQUFVLENBQXZELEVBTGhCLDBDQU1ILGtCQUFNLFVBTkgsRUFNZ0IsRUFBQyxVQUFVLFlBQVgsRUFBeUIsTUFBTSxZQUEvQixFQUE2QyxVQUFVLENBQXZELEVBTmhCLDBDQU9ILGtCQUFNLFFBUEgsRUFPYyxFQUFDLFVBQVUsWUFBWCxFQUF5QixNQUFNLFdBQS9CLEVBQTRDLFVBQVUsQ0FBdEQsRUFQZCwwQ0FRSCxrQkFBTSxRQVJILEVBUWMsRUFBQyxVQUFVLFlBQVgsRUFBeUIsTUFBTSxXQUEvQixFQUE0QyxVQUFVLENBQXRELEVBUmQsMENBU0gsa0JBQU0sUUFUSCxFQVNjLEVBQUMsVUFBVSxZQUFYLEVBQXlCLE1BQU0sV0FBL0IsRUFBNEMsVUFBVSxDQUF0RCxFQVRkLDBDQVVILGtCQUFNLFNBVkgsRUFVZSxFQUFDLFVBQVUsWUFBWCxFQUF5QixNQUFNLFdBQS9CLEVBQTRD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QVMsZ0JBQVQsR0FJQztBQUFBLG1FQUFKLEVBQUk7O0FBQUEseUJBSE4sTUFHTTtBQUFBLE1BSE4sTUFHTSwrQkFIRyxVQUdIO0FBQUEsTUFGTixPQUVNLFFBRk4sT0FFTTtBQUFBLE1BRE4sUUFDTSxRQUROLFFBQ007O0FBQ04sd0JBQU8sT0FBUDs7QUFFQSxNQUFNLG1CQUFtQixRQUFRLGVBQWpDO0FBQ0EsTUFBTSw0QkFBVSxNQUFWLEVBQW1CLEVBQW5CLENBQU47O0FBRUE7QUFDQSxPQUFLLElBQU0sV0FBWCxJQUEwQixnQkFBMUIsRUFBNEM7QUFDMUMsUUFBTSxVQUFVLFNBQVMsV0FBVCxDQUFoQjtBQUNBLFFBQUksWUFBWSxTQUFoQixFQUEyQjtBQUN6QixZQUFNLFdBQU4sSUFBcUI7QUFDbkIsY0FBTSxPQURhO0FBRW5CLGVBQU8sUUFBUSxRQUFSO0FBRlksT0FBckI7QUFJRDtBQUNGOztBQUVEO0FBQ0EsT0FBSyxJQUFNLFlBQVgsSUFBMEIsZ0JBQTFCLEVBQTRDO0FBQzFDLFFBQU0sV0FBVSxTQUFTLFlBQVQsQ0FBaEI7QUFDQSxRQUFJLGFBQVksU0FBaEIsRUFBMkI7QUFDekIsWUFBTSxZQUFOLElBQXFCO0FBQ25CLGNBQU0sY0FEYTtBQUVuQixlQUFPO0FBRlksT0FBckI7QUFJRDtBQUNGOztBQUVEO0FBQ0EsT0FBSyxJQUFNLGFBQVgsSUFBMEIsUUFBMUIsRUFBb0M7QUFDbEMsUUFBTSxZQUFVLFNBQVMsYUFBVCxDQUFoQjtBQUNBLFFBQUksQ0FBQyxNQUFNLGFBQU4sQ0FBTCxFQUF5QjtBQUN2QixZQUFNLGFBQU4sSUFBcUI7QUFDbkIsY0FBTSxlQUFlLFNBREY7QUFFbkIsZUFBTyxVQUFRLFFBQVI7QUFGWSxPQUFyQjtBQUlEO0FBQ0Y7O0FBRUQsU0FBTyxLQUFQO0FBQ0Q7O0FBRUQiLCJmaWxlIjoidW5pZm9ybXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1dlYkdMfSBmcm9tICcuL3dlYmdsLXR5cGVzJztcbmltcG9ydCB7VGV4dHVyZX0gZnJvbSAnLi90ZXh0dXJlJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuLy8gVE9ETyAtIHVzZSB0YWJsZXMgdG8gcmVkdWNlIGNvbXBsZXhpdHkgb2YgbWV0aG9kIGJlbG93XG4vKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG5jb25zdCBVTklGT1JNX0JBU0VfREVTQ1JJUFRPUlMgPSB7XG4gIFtXZWJHTC5GTE9BVF06IHtmdW5jdGlvbjogJ3VuaWZvcm0xZicsIHR5cGU6IEZsb2F0MzJBcnJheX0sXG4gIFtXZWJHTC5JTlRdOiB7ZnVuY3Rpb246ICd1bmlmb3JtMWknLCB0eXBlOiBVaW50MTZBcnJheX0sXG4gIFtXZWJHTC5CT09MXToge2Z1bmN0aW9uOiAndW5pZm9ybTFpJywgdHlwZTogVWludDE2QXJyYXl9LFxuICBbV2ViR0wuRkxPQVRfVkVDMl06IHtmdW5jdGlvbjogJ3VuaWZvcm0yZnYnLCB0eXBlOiBGbG9hdDMyQXJyYXksIGVsZW1lbnRzOiAyfSxcbiAgW1dlYkdMLkZMT0FUX1ZFQzNdOiB7ZnVuY3Rpb246ICd1bmlmb3JtM2Z2JywgdHlwZTogRmxvYXQzMkFycmF5LCBlbGVtZW50czogM30sXG4gIFtXZWJHTC5GTE9BVF9WRUM0XToge2Z1bmN0aW9uOiAndW5pZm9ybTRmdicsIHR5cGU6IEZsb2F0MzJBcnJheSwgZWxlbWVudHM6IDR9LFxuICBbV2ViR0wuSU5UX1ZFQzJdOiB7ZnVuY3Rpb246ICd1bmlmb3JtMml2JywgdHlwZTogVWludDE2QXJyYXksIGVsZW1lbnRzOiAyfSxcbiAgW1dlYkdMLklOVF9WRUMzXToge2Z1bmN0aW9uOiAndW5pZm9ybTNpdicsIHR5cGU6IFVpbnQxNkFycmF5LCBlbGVtZW50czogM30sXG4gIFtXZWJHTC5JTlRfVkVDNF06IHtmdW5jdGlvbjogJ3VuaWZvcm00aXYnLCB0eXBlOiBVaW50MTZBcnJheSwgZWxlbWVudHM6IDR9LFxuICBbV2ViR0wuQk9PTF9WRUMyXToge2Z1bmN0aW9uOiAndW5pZm9ybTJpdicsIHR5cGU6IFVpbnQxNkFycmF5LCBlbGVtZW50czogMn0sXG4gIFtXZWJHTC5CT09MX1ZFQzNdOiB7ZnVuY3Rpb246ICd1bmlmb3JtM2Z2JywgdHlwZTogVWludDE2QXJyYXksIGVsZW1lbnRzOiAzfSxcbiAgW1dlYkdMLkJPT0xfVkVDNF06IHtmdW5jdGlvbjogJ3VuaWZvcm00aXYnLCB0eXBlOiBVaW50MTZBcnJheSwgZWxlbWVudHM6IDR9LFxuICBbV2ViR0wuRkxPQVRfTUFUMl06IHtmdW5jdGlvbjogJ3VuaWZvcm1NYXRyaXgyZnYnLCB0eXBlOiBGbG9hdDMyQXJyYXksIG1hdHJpeDogdHJ1ZSwgZWxlbWVudHM6IDR9LFxuICBbV2ViR0wuRkxPQVRfTUFUM106IHttZnVuY3Rpb246ICd1bmlmb3JtTWF0cml4M2Z2JywgdHlwZTogRmxvYXQzMkFycmF5LCBtYXRyaXg6IHRydWUsIGVsZW1lbnRzOiA5fSxcbiAgW1dlYkdMLkZMT0FUX01BVDRdOiB7ZnVuY3Rpb246ICd1bmlmb3JtTWF0cml4NGZ2JywgdHlwZTogRmxvYXQzMkFycmF5LCBtYXRyaXg6IHRydWUsIGVsZW1lbnRzOiAxNn0sXG4gIFtXZWJHTC5TQU1QTEVSXzJEXToge2Z1bmN0aW9uOiAndW5pZm9ybTFpJywgdHlwZTogVWludDE2QXJyYXksIHRleHR1cmU6IHRydWV9LFxuICBbV2ViR0wuU0FNUExFUl9DVUJFXToge2Z1bmN0aW9uOiAndW5pZm9ybTFpJywgdHlwZTogVWludDE2QXJyYXksIHRleHR1cmU6IHRydWV9XG59O1xuLyogZXNsaW50LWVuYWJsZSBtYXgtbGVuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVVuaWZvcm1OYW1lKG5hbWUpIHtcbiAgLy8gbmFtZSA9IG5hbWVbbmFtZS5sZW5ndGggLSAxXSA9PT0gJ10nID9cbiAgLy8gbmFtZS5zdWJzdHIoMCwgbmFtZS5sZW5ndGggLSAzKSA6IG5hbWU7XG5cbiAgLy8gaWYgYXJyYXkgbmFtZSB0aGVuIGNsZWFuIHRoZSBhcnJheSBicmFja2V0c1xuICBjb25zdCBVTklGT1JNX05BTUVfUkVHRVhQID0gLyhbXlxcW10qKShcXFtbMC05XStcXF0pPy87XG4gIGNvbnN0IG1hdGNoZXMgPSBuYW1lLm1hdGNoKFVOSUZPUk1fTkFNRV9SRUdFWFApO1xuICBpZiAoIW1hdGNoZXMgfHwgbWF0Y2hlcy5sZW5ndGggPCAyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gcGFyc2UgR0xTTCB1bmlmb3JtIG5hbWUgJHtuYW1lfWApO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiBtYXRjaGVzWzFdLFxuICAgIGxlbmd0aDogbWF0Y2hlc1syXSB8fCAxLFxuICAgIGlzQXJyYXk6IEJvb2xlYW4obWF0Y2hlc1syXSlcbiAgfTtcbn1cblxuLy8gUmV0dXJucyBhIE1hZ2ljIFVuaWZvcm0gU2V0dGVyXG4vKiBlc2xpbnQtZGlzYWJsZSBjb21wbGV4aXR5ICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VW5pZm9ybVNldHRlcihnbCwgbG9jYXRpb24sIGluZm8pIHtcbiAgY29uc3QgZGVzY3JpcHRvciA9IFVOSUZPUk1fQkFTRV9ERVNDUklQVE9SU1tpbmZvLnR5cGVdO1xuICBpZiAoIWRlc2NyaXB0b3IpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gR0xTTCB1bmlmb3JtIHR5cGUgJHtpbmZvLnR5cGV9YCk7XG4gIH1cblxuICBjb25zdCBnbEZ1bmN0aW9uID0gZ2xbZGVzY3JpcHRvci5mdW5jdGlvbl0uYmluZChnbCk7XG4gIGNvbnN0IFR5cGVkQXJyYXkgPSBkZXNjcmlwdG9yLnR5cGU7XG5cbiAgLy8gSG93IG1hbnkgZGF0YSBlbGVtZW50cyBkb2VzIGFwcCBuZWVkIHRvIHByb3ZpZGVcbiAgY29uc3QgZmxhdEFycmF5TGVuZ3RoID0gaW5mby5zaXplICogKGRlc2NyaXB0b3IuZWxlbWVudHMgfHwgMSk7XG5cbiAgLy8gY29uc29sZS5sb2coJ2dldFNldHRlcicsIGxvY2F0aW9uLCBpbmZvLCBmbGF0QXJyYXlMZW5ndGgpO1xuXG4gIC8vIFNldCBhIHVuaWZvcm0gYXJyYXlcbiAgbGV0IHNldHRlcjtcbiAgaWYgKGZsYXRBcnJheUxlbmd0aCA+IDEpIHtcbiAgICBzZXR0ZXIgPSB2YWwgPT4ge1xuICAgICAgaWYgKCEodmFsIGluc3RhbmNlb2YgVHlwZWRBcnJheSkpIHtcbiAgICAgICAgY29uc3QgdHlwZWRBcnJheSA9IG5ldyBUeXBlZEFycmF5KGZsYXRBcnJheUxlbmd0aCk7XG4gICAgICAgIHR5cGVkQXJyYXkuc2V0KHZhbCk7XG4gICAgICAgIHZhbCA9IHR5cGVkQXJyYXk7XG4gICAgICB9XG4gICAgICBhc3NlcnQodmFsLmxlbmd0aCA9PT0gZmxhdEFycmF5TGVuZ3RoKTtcbiAgICAgIGlmIChkZXNjcmlwdG9yLm1hdHJpeCkge1xuICAgICAgICAvLyBTZWNvbmQgcGFyYW06IHdoZXRoZXIgdG8gdHJhbnNwb3NlIHRoZSBtYXRyaXguIE11c3QgYmUgZmFsc2UuXG4gICAgICAgIGdsRnVuY3Rpb24obG9jYXRpb24sIGZhbHNlLCB2YWwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZ2xGdW5jdGlvbihsb2NhdGlvbiwgdmFsKTtcbiAgICAgIH1cbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIHNldHRlciA9IHZhbCA9PiBnbEZ1bmN0aW9uKGxvY2F0aW9uLCB2YWwpO1xuICB9XG5cbiAgLy8gU2V0IGEgcHJpbWl0aXZlLXZhbHVlZCB1bmlmb3JtXG4gIHJldHVybiBzZXR0ZXI7XG59XG5cbi8vIEJhc2ljIGNoZWNrcyBvZiB1bmlmb3JtIHZhbHVlcyB3aXRob3V0IGtub3dsZWRnZSBvZiBwcm9ncmFtXG4vLyBUbyBmYWNpbGl0YXRlIGVhcmx5IGRldGVjdGlvbiBvZiBlLmcuIHVuZGVmaW5lZCB2YWx1ZXMgaW4gSmF2YVNjcmlwdFxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrVW5pZm9ybVZhbHVlcyh1bmlmb3Jtcywgc291cmNlKSB7XG4gIGZvciAoY29uc3QgdW5pZm9ybU5hbWUgaW4gdW5pZm9ybXMpIHtcbiAgICBjb25zdCB2YWx1ZSA9IHVuaWZvcm1zW3VuaWZvcm1OYW1lXTtcbiAgICBpZiAoIWNoZWNrVW5pZm9ybVZhbHVlKHZhbHVlKSkge1xuICAgICAgLy8gQWRkIHNwYWNlIHRvIHNvdXJjZVxuICAgICAgc291cmNlID0gc291cmNlID8gYCR7c291cmNlfSBgIDogYGA7XG4gICAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby1jb25zb2xlICovXG4gICAgICAvKiBnbG9iYWwgY29uc29sZSAqL1xuICAgICAgLy8gVmFsdWUgY291bGQgYmUgdW5wcmludGFibGUgc28gd3JpdGUgdGhlIG9iamVjdCBvbiBjb25zb2xlXG4gICAgICBjb25zb2xlLmVycm9yKGAke3NvdXJjZX0gQmFkIHVuaWZvcm0gJHt1bmlmb3JtTmFtZX1gLCB2YWx1ZSk7XG4gICAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLWNvbnNvbGUgKi9cbiAgICAgIHRocm93IG5ldyBFcnJvcihgJHtzb3VyY2V9IEJhZCB1bmlmb3JtICR7dW5pZm9ybU5hbWV9YCk7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBjaGVja1VuaWZvcm1WYWx1ZSh2YWx1ZSkge1xuICBsZXQgb2sgPSB0cnVlO1xuXG4gIC8vIFRlc3QgZm9yIHRleHR1cmUgKGZvciBzYW1wbGVyIHVuaWZvcm1zKVxuICAvLyBXZWJHTDI6IGlmICh2YWx1ZSBpbnN0YW5jZW9mIFRleHR1cmUgfHwgdmFsdWUgaW5zdGFuY2VvZiBTYW1wbGVyKSB7XG4gIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFRleHR1cmUpIHtcbiAgICBvayA9IHRydWU7XG4gIC8vIENoZWNrIHRoYXQgZXZlcnkgZWxlbWVudCBpbiBhcnJheSBpcyBhIG51bWJlciwgYW5kIGF0IGxlYXN0IDEgZWxlbWVudFxuICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgZm9yIChjb25zdCBlbGVtZW50IG9mIHZhbHVlKSB7XG4gICAgICBpZiAoIWlzRmluaXRlKGVsZW1lbnQpKSB7XG4gICAgICAgIG9rID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIG9rID0gb2sgJiYgKHZhbHVlLmxlbmd0aCA+IDApO1xuICAvLyBUeXBlZCBhcnJheXMgY2FuIG9ubHkgY29udGFpbiBudW1iZXJzLCBidXQgY2hlY2sgbGVuZ3RoXG4gIH0gZWxzZSBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KHZhbHVlKSkge1xuICAgIG9rID0gdmFsdWUubGVuZ3RoID4gMDtcbiAgLy8gQ2hlY2sgdGhhdCBzaW5nbGUgdmFsdWUgaXMgYSBudW1iZXJcbiAgfSBlbHNlIGlmICghaXNGaW5pdGUodmFsdWUpKSB7XG4gICAgb2sgPSBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiBvaztcbn1cblxuLy8gUHJlcGFyZXMgYSB0YWJsZSBzdWl0YWJsZSBmb3IgY29uc29sZS50YWJsZVxuZXhwb3J0IGZ1bmN0aW9uIGdldFVuaWZvcm1zVGFibGUoe1xuICBoZWFkZXIgPSAnVW5pZm9ybXMnLFxuICBwcm9ncmFtLFxuICB1bmlmb3Jtc1xufSA9IHt9KSB7XG4gIGFzc2VydChwcm9ncmFtKTtcblxuICBjb25zdCB1bmlmb3JtTG9jYXRpb25zID0gcHJvZ3JhbS5fdW5pZm9ybVNldHRlcnM7XG4gIGNvbnN0IHRhYmxlID0ge1toZWFkZXJdOiB7fX07XG5cbiAgLy8gQWRkIHByb2dyYW0ncyBwcm92aWRlZCB1bmlmb3Jtc1xuICBmb3IgKGNvbnN0IHVuaWZvcm1OYW1lIGluIHVuaWZvcm1Mb2NhdGlvbnMpIHtcbiAgICBjb25zdCB1bmlmb3JtID0gdW5pZm9ybXNbdW5pZm9ybU5hbWVdO1xuICAgIGlmICh1bmlmb3JtICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRhYmxlW3VuaWZvcm1OYW1lXSA9IHtcbiAgICAgICAgVHlwZTogdW5pZm9ybSxcbiAgICAgICAgVmFsdWU6IHVuaWZvcm0udG9TdHJpbmcoKVxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvLyBBZGQgcHJvZ3JhbSdzIHVucHJvdmlkZWQgdW5pZm9ybXNcbiAgZm9yIChjb25zdCB1bmlmb3JtTmFtZSBpbiB1bmlmb3JtTG9jYXRpb25zKSB7XG4gICAgY29uc3QgdW5pZm9ybSA9IHVuaWZvcm1zW3VuaWZvcm1OYW1lXTtcbiAgICBpZiAodW5pZm9ybSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0YWJsZVt1bmlmb3JtTmFtZV0gPSB7XG4gICAgICAgIFR5cGU6ICdOT1QgUFJPVklERUQnLFxuICAgICAgICBWYWx1ZTogJ04vQSdcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgLy8gTGlzdCBhbnkgdW51c2VkIHVuaWZvcm1zXG4gIGZvciAoY29uc3QgdW5pZm9ybU5hbWUgaW4gdW5pZm9ybXMpIHtcbiAgICBjb25zdCB1bmlmb3JtID0gdW5pZm9ybXNbdW5pZm9ybU5hbWVdO1xuICAgIGlmICghdGFibGVbdW5pZm9ybU5hbWVdKSB7XG4gICAgICB0YWJsZVt1bmlmb3JtTmFtZV0gPSB7XG4gICAgICAgIFR5cGU6ICdOT1QgVVNFRDogJyArIHVuaWZvcm0sXG4gICAgICAgIFZhbHVlOiB1bmlmb3JtLnRvU3RyaW5nKClcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRhYmxlO1xufVxuXG4vKlxuICBpZiAodmVjdG9yKSB7XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSBXZWJHTC5GTE9BVDpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtMWY7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFdlYkdMLkZMT0FUX1ZFQzI6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTJmdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBpc0FycmF5ID8gRmxvYXQzMkFycmF5IDogbmV3IEZsb2F0MzJBcnJheSgyKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgV2ViR0wuRkxPQVRfVkVDMzpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtM2Z2O1xuICAgICAgVHlwZWRBcnJheSA9IGlzQXJyYXkgPyBGbG9hdDMyQXJyYXkgOiBuZXcgRmxvYXQzMkFycmF5KDMpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBXZWJHTC5GTE9BVF9WRUM0OlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm00ZnY7XG4gICAgICBUeXBlZEFycmF5ID0gaXNBcnJheSA/IEZsb2F0MzJBcnJheSA6IG5ldyBGbG9hdDMyQXJyYXkoNCk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFdlYkdMLklOVDpcbiAgICBjYXNlIFdlYkdMLkJPT0w6XG4gICAgY2FzZSBXZWJHTC5TQU1QTEVSXzJEOlxuICAgIGNhc2UgV2ViR0wuU0FNUExFUl9DVUJFOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0xaTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgV2ViR0wuSU5UX1ZFQzI6XG4gICAgY2FzZSBXZWJHTC5CT09MX1ZFQzI6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTJpdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBpc0FycmF5ID8gVWludDE2QXJyYXkgOiBuZXcgVWludDE2QXJyYXkoMik7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFdlYkdMLklOVF9WRUMzOlxuICAgIGNhc2UgV2ViR0wuQk9PTF9WRUMzOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0zaXY7XG4gICAgICBUeXBlZEFycmF5ID0gaXNBcnJheSA/IFVpbnQxNkFycmF5IDogbmV3IFVpbnQxNkFycmF5KDMpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBXZWJHTC5JTlRfVkVDNDpcbiAgICBjYXNlIFdlYkdMLkJPT0xfVkVDNDpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtNGl2O1xuICAgICAgVHlwZWRBcnJheSA9IGlzQXJyYXkgPyBVaW50MTZBcnJheSA6IG5ldyBVaW50MTZBcnJheSg0KTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgV2ViR0wuRkxPQVRfTUFUMjpcbiAgICAgIG1hdHJpeCA9IHRydWU7XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybU1hdHJpeDJmdjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgV2ViR0wuRkxPQVRfTUFUMzpcbiAgICAgIG1hdHJpeCA9IHRydWU7XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybU1hdHJpeDNmdjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgV2ViR0wuRkxPQVRfTUFUNDpcbiAgICAgIG1hdHJpeCA9IHRydWU7XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybU1hdHJpeDRmdjtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiovIl19