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

var _utils = require('../utils');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// TODO - use tables to reduce complexity of method below
/* eslint-disable max-len */
var UNIFORM_BASE_DESCRIPTORS = (_UNIFORM_BASE_DESCRIP = {}, _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.GL.FLOAT, { function: 'uniform1f', type: Float32Array }), _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.GL.INT, { function: 'uniform1i', type: Uint16Array }), _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.GL.BOOL, { function: 'uniform1i', type: Uint16Array }), _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.GL.FLOAT_VEC2, { function: 'uniform2fv', type: Float32Array, elements: 2 }), _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.GL.FLOAT_VEC3, { function: 'uniform3fv', type: Float32Array, elements: 3 }), _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.GL.FLOAT_VEC4, { function: 'uniform4fv', type: Float32Array, elements: 4 }), _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.GL.INT_VEC2, { function: 'uniform2iv', type: Uint16Array, elements: 2 }), _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.GL.INT_VEC3, { function: 'uniform3iv', type: Uint16Array, elements: 3 }), _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.GL.INT_VEC4, { function: 'uniform4iv', type: Uint16Array, elements: 4 }), _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.GL.BOOL_VEC2, { function: 'uniform2iv', type: Uint16Array, elements: 2 }), _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.GL.BOOL_VEC3, { function: 'uniform3fv', type: Uint16Array, elements: 3 }), _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.GL.BOOL_VEC4, { function: 'uniform4iv', type: Uint16Array, elements: 4 }), _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.GL.FLOAT_MAT2, { function: 'uniformMatrix2fv', type: Float32Array, matrix: true, elements: 4 }), _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.GL.FLOAT_MAT3, { mfunction: 'uniformMatrix3fv', type: Float32Array, matrix: true, elements: 9 }), _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.GL.FLOAT_MAT4, { function: 'uniformMatrix4fv', type: Float32Array, matrix: true, elements: 16 }), _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.GL.SAMPLER_2D, { function: 'uniform1i', type: Uint16Array, texture: true }), _defineProperty(_UNIFORM_BASE_DESCRIP, _webglTypes.GL.SAMPLER_CUBE, { function: 'uniform1i', type: Uint16Array, texture: true }), _UNIFORM_BASE_DESCRIP);
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
/* eslint-disable max-statements */
function getUniformsTable() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

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
        Value: (0, _utils.formatValue)(uniform)
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

  var unusedTable = {};
  var unusedCount = 0;

  // List any unused uniforms
  for (var _uniformName2 in uniforms) {
    var _uniform2 = uniforms[_uniformName2];
    if (!table[_uniformName2]) {
      unusedCount++;
      unusedTable[_uniformName2] = {
        Type: 'NOT USED: ' + _uniform2,
        Value: (0, _utils.formatValue)(_uniform2)
      };
    }
  }

  return { table: table, unusedTable: unusedTable, unusedCount: unusedCount };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC91bmlmb3Jtcy5qcyJdLCJuYW1lcyI6WyJwYXJzZVVuaWZvcm1OYW1lIiwiZ2V0VW5pZm9ybVNldHRlciIsImNoZWNrVW5pZm9ybVZhbHVlcyIsImdldFVuaWZvcm1zVGFibGUiLCJVTklGT1JNX0JBU0VfREVTQ1JJUFRPUlMiLCJGTE9BVCIsImZ1bmN0aW9uIiwidHlwZSIsIkZsb2F0MzJBcnJheSIsIklOVCIsIlVpbnQxNkFycmF5IiwiQk9PTCIsIkZMT0FUX1ZFQzIiLCJlbGVtZW50cyIsIkZMT0FUX1ZFQzMiLCJGTE9BVF9WRUM0IiwiSU5UX1ZFQzIiLCJJTlRfVkVDMyIsIklOVF9WRUM0IiwiQk9PTF9WRUMyIiwiQk9PTF9WRUMzIiwiQk9PTF9WRUM0IiwiRkxPQVRfTUFUMiIsIm1hdHJpeCIsIkZMT0FUX01BVDMiLCJtZnVuY3Rpb24iLCJGTE9BVF9NQVQ0IiwiU0FNUExFUl8yRCIsInRleHR1cmUiLCJTQU1QTEVSX0NVQkUiLCJuYW1lIiwiVU5JRk9STV9OQU1FX1JFR0VYUCIsIm1hdGNoZXMiLCJtYXRjaCIsImxlbmd0aCIsIkVycm9yIiwiaXNBcnJheSIsIkJvb2xlYW4iLCJnbCIsImxvY2F0aW9uIiwiaW5mbyIsImRlc2NyaXB0b3IiLCJnbEZ1bmN0aW9uIiwiYmluZCIsIlR5cGVkQXJyYXkiLCJmbGF0QXJyYXlMZW5ndGgiLCJzaXplIiwic2V0dGVyIiwidmFsIiwidHlwZWRBcnJheSIsInNldCIsInVuaWZvcm1zIiwic291cmNlIiwidW5pZm9ybU5hbWUiLCJ2YWx1ZSIsImNoZWNrVW5pZm9ybVZhbHVlIiwiY29uc29sZSIsImVycm9yIiwib2siLCJBcnJheSIsImVsZW1lbnQiLCJpc0Zpbml0ZSIsIkFycmF5QnVmZmVyIiwiaXNWaWV3IiwiaGVhZGVyIiwicHJvZ3JhbSIsInVuaWZvcm1Mb2NhdGlvbnMiLCJfdW5pZm9ybVNldHRlcnMiLCJ0YWJsZSIsInVuaWZvcm0iLCJ1bmRlZmluZWQiLCJUeXBlIiwiVmFs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LEVBQW9DO0FBQ2xDLFFBQU1rQixZQUFVbEIsU0FBU0UsYUFBVCxDQUFoQjtBQUNBLFFBQUksQ0FBQ2UsTUFBTWYsYUFBTixDQUFMLEVBQXlCO0FBQ3ZCcUI7QUFDQUQsa0JBQVlwQixhQUFaLElBQTJCO0FBQ3pCa0IsNkJBQW1CRixTQURNO0FBRXpCRyxlQUFPLHdCQUFZSCxTQUFaO0FBRmtCLE9BQTNCO0FBSUQ7QUFDRjs7QUFFRCxTQUFPLEVBQUNELFlBQUQsRUFBUUssd0JBQVIsRUFBcUJDLHdCQUFyQixFQUFQO0FBQ0Q7O0FBRUQiLCJmaWxlIjoidW5pZm9ybXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0dMfSBmcm9tICcuL3dlYmdsLXR5cGVzJztcbmltcG9ydCB7VGV4dHVyZX0gZnJvbSAnLi90ZXh0dXJlJztcbmltcG9ydCB7Zm9ybWF0VmFsdWV9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuLy8gVE9ETyAtIHVzZSB0YWJsZXMgdG8gcmVkdWNlIGNvbXBsZXhpdHkgb2YgbWV0aG9kIGJlbG93XG4vKiBlc2xpbnQtZGlzYWJsZSBtYXgtbGVuICovXG5jb25zdCBVTklGT1JNX0JBU0VfREVTQ1JJUFRPUlMgPSB7XG4gIFtHTC5GTE9BVF06IHtmdW5jdGlvbjogJ3VuaWZvcm0xZicsIHR5cGU6IEZsb2F0MzJBcnJheX0sXG4gIFtHTC5JTlRdOiB7ZnVuY3Rpb246ICd1bmlmb3JtMWknLCB0eXBlOiBVaW50MTZBcnJheX0sXG4gIFtHTC5CT09MXToge2Z1bmN0aW9uOiAndW5pZm9ybTFpJywgdHlwZTogVWludDE2QXJyYXl9LFxuICBbR0wuRkxPQVRfVkVDMl06IHtmdW5jdGlvbjogJ3VuaWZvcm0yZnYnLCB0eXBlOiBGbG9hdDMyQXJyYXksIGVsZW1lbnRzOiAyfSxcbiAgW0dMLkZMT0FUX1ZFQzNdOiB7ZnVuY3Rpb246ICd1bmlmb3JtM2Z2JywgdHlwZTogRmxvYXQzMkFycmF5LCBlbGVtZW50czogM30sXG4gIFtHTC5GTE9BVF9WRUM0XToge2Z1bmN0aW9uOiAndW5pZm9ybTRmdicsIHR5cGU6IEZsb2F0MzJBcnJheSwgZWxlbWVudHM6IDR9LFxuICBbR0wuSU5UX1ZFQzJdOiB7ZnVuY3Rpb246ICd1bmlmb3JtMml2JywgdHlwZTogVWludDE2QXJyYXksIGVsZW1lbnRzOiAyfSxcbiAgW0dMLklOVF9WRUMzXToge2Z1bmN0aW9uOiAndW5pZm9ybTNpdicsIHR5cGU6IFVpbnQxNkFycmF5LCBlbGVtZW50czogM30sXG4gIFtHTC5JTlRfVkVDNF06IHtmdW5jdGlvbjogJ3VuaWZvcm00aXYnLCB0eXBlOiBVaW50MTZBcnJheSwgZWxlbWVudHM6IDR9LFxuICBbR0wuQk9PTF9WRUMyXToge2Z1bmN0aW9uOiAndW5pZm9ybTJpdicsIHR5cGU6IFVpbnQxNkFycmF5LCBlbGVtZW50czogMn0sXG4gIFtHTC5CT09MX1ZFQzNdOiB7ZnVuY3Rpb246ICd1bmlmb3JtM2Z2JywgdHlwZTogVWludDE2QXJyYXksIGVsZW1lbnRzOiAzfSxcbiAgW0dMLkJPT0xfVkVDNF06IHtmdW5jdGlvbjogJ3VuaWZvcm00aXYnLCB0eXBlOiBVaW50MTZBcnJheSwgZWxlbWVudHM6IDR9LFxuICBbR0wuRkxPQVRfTUFUMl06IHtmdW5jdGlvbjogJ3VuaWZvcm1NYXRyaXgyZnYnLCB0eXBlOiBGbG9hdDMyQXJyYXksIG1hdHJpeDogdHJ1ZSwgZWxlbWVudHM6IDR9LFxuICBbR0wuRkxPQVRfTUFUM106IHttZnVuY3Rpb246ICd1bmlmb3JtTWF0cml4M2Z2JywgdHlwZTogRmxvYXQzMkFycmF5LCBtYXRyaXg6IHRydWUsIGVsZW1lbnRzOiA5fSxcbiAgW0dMLkZMT0FUX01BVDRdOiB7ZnVuY3Rpb246ICd1bmlmb3JtTWF0cml4NGZ2JywgdHlwZTogRmxvYXQzMkFycmF5LCBtYXRyaXg6IHRydWUsIGVsZW1lbnRzOiAxNn0sXG4gIFtHTC5TQU1QTEVSXzJEXToge2Z1bmN0aW9uOiAndW5pZm9ybTFpJywgdHlwZTogVWludDE2QXJyYXksIHRleHR1cmU6IHRydWV9LFxuICBbR0wuU0FNUExFUl9DVUJFXToge2Z1bmN0aW9uOiAndW5pZm9ybTFpJywgdHlwZTogVWludDE2QXJyYXksIHRleHR1cmU6IHRydWV9XG59O1xuLyogZXNsaW50LWVuYWJsZSBtYXgtbGVuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVVuaWZvcm1OYW1lKG5hbWUpIHtcbiAgLy8gbmFtZSA9IG5hbWVbbmFtZS5sZW5ndGggLSAxXSA9PT0gJ10nID9cbiAgLy8gbmFtZS5zdWJzdHIoMCwgbmFtZS5sZW5ndGggLSAzKSA6IG5hbWU7XG5cbiAgLy8gaWYgYXJyYXkgbmFtZSB0aGVuIGNsZWFuIHRoZSBhcnJheSBicmFja2V0c1xuICBjb25zdCBVTklGT1JNX05BTUVfUkVHRVhQID0gLyhbXlxcW10qKShcXFtbMC05XStcXF0pPy87XG4gIGNvbnN0IG1hdGNoZXMgPSBuYW1lLm1hdGNoKFVOSUZPUk1fTkFNRV9SRUdFWFApO1xuICBpZiAoIW1hdGNoZXMgfHwgbWF0Y2hlcy5sZW5ndGggPCAyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gcGFyc2UgR0xTTCB1bmlmb3JtIG5hbWUgJHtuYW1lfWApO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiBtYXRjaGVzWzFdLFxuICAgIGxlbmd0aDogbWF0Y2hlc1syXSB8fCAxLFxuICAgIGlzQXJyYXk6IEJvb2xlYW4obWF0Y2hlc1syXSlcbiAgfTtcbn1cblxuLy8gUmV0dXJucyBhIE1hZ2ljIFVuaWZvcm0gU2V0dGVyXG4vKiBlc2xpbnQtZGlzYWJsZSBjb21wbGV4aXR5ICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VW5pZm9ybVNldHRlcihnbCwgbG9jYXRpb24sIGluZm8pIHtcbiAgY29uc3QgZGVzY3JpcHRvciA9IFVOSUZPUk1fQkFTRV9ERVNDUklQVE9SU1tpbmZvLnR5cGVdO1xuICBpZiAoIWRlc2NyaXB0b3IpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFVua25vd24gR0xTTCB1bmlmb3JtIHR5cGUgJHtpbmZvLnR5cGV9YCk7XG4gIH1cblxuICBjb25zdCBnbEZ1bmN0aW9uID0gZ2xbZGVzY3JpcHRvci5mdW5jdGlvbl0uYmluZChnbCk7XG4gIGNvbnN0IFR5cGVkQXJyYXkgPSBkZXNjcmlwdG9yLnR5cGU7XG5cbiAgLy8gSG93IG1hbnkgZGF0YSBlbGVtZW50cyBkb2VzIGFwcCBuZWVkIHRvIHByb3ZpZGVcbiAgY29uc3QgZmxhdEFycmF5TGVuZ3RoID0gaW5mby5zaXplICogKGRlc2NyaXB0b3IuZWxlbWVudHMgfHwgMSk7XG5cbiAgLy8gY29uc29sZS5sb2coJ2dldFNldHRlcicsIGxvY2F0aW9uLCBpbmZvLCBmbGF0QXJyYXlMZW5ndGgpO1xuXG4gIC8vIFNldCBhIHVuaWZvcm0gYXJyYXlcbiAgbGV0IHNldHRlcjtcbiAgaWYgKGZsYXRBcnJheUxlbmd0aCA+IDEpIHtcbiAgICBzZXR0ZXIgPSB2YWwgPT4ge1xuICAgICAgaWYgKCEodmFsIGluc3RhbmNlb2YgVHlwZWRBcnJheSkpIHtcbiAgICAgICAgY29uc3QgdHlwZWRBcnJheSA9IG5ldyBUeXBlZEFycmF5KGZsYXRBcnJheUxlbmd0aCk7XG4gICAgICAgIHR5cGVkQXJyYXkuc2V0KHZhbCk7XG4gICAgICAgIHZhbCA9IHR5cGVkQXJyYXk7XG4gICAgICB9XG4gICAgICBhc3NlcnQodmFsLmxlbmd0aCA9PT0gZmxhdEFycmF5TGVuZ3RoKTtcbiAgICAgIGlmIChkZXNjcmlwdG9yLm1hdHJpeCkge1xuICAgICAgICAvLyBTZWNvbmQgcGFyYW06IHdoZXRoZXIgdG8gdHJhbnNwb3NlIHRoZSBtYXRyaXguIE11c3QgYmUgZmFsc2UuXG4gICAgICAgIGdsRnVuY3Rpb24obG9jYXRpb24sIGZhbHNlLCB2YWwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZ2xGdW5jdGlvbihsb2NhdGlvbiwgdmFsKTtcbiAgICAgIH1cbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIHNldHRlciA9IHZhbCA9PiBnbEZ1bmN0aW9uKGxvY2F0aW9uLCB2YWwpO1xuICB9XG5cbiAgLy8gU2V0IGEgcHJpbWl0aXZlLXZhbHVlZCB1bmlmb3JtXG4gIHJldHVybiBzZXR0ZXI7XG59XG5cbi8vIEJhc2ljIGNoZWNrcyBvZiB1bmlmb3JtIHZhbHVlcyB3aXRob3V0IGtub3dsZWRnZSBvZiBwcm9ncmFtXG4vLyBUbyBmYWNpbGl0YXRlIGVhcmx5IGRldGVjdGlvbiBvZiBlLmcuIHVuZGVmaW5lZCB2YWx1ZXMgaW4gSmF2YVNjcmlwdFxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrVW5pZm9ybVZhbHVlcyh1bmlmb3Jtcywgc291cmNlKSB7XG4gIGZvciAoY29uc3QgdW5pZm9ybU5hbWUgaW4gdW5pZm9ybXMpIHtcbiAgICBjb25zdCB2YWx1ZSA9IHVuaWZvcm1zW3VuaWZvcm1OYW1lXTtcbiAgICBpZiAoIWNoZWNrVW5pZm9ybVZhbHVlKHZhbHVlKSkge1xuICAgICAgLy8gQWRkIHNwYWNlIHRvIHNvdXJjZVxuICAgICAgc291cmNlID0gc291cmNlID8gYCR7c291cmNlfSBgIDogJyc7XG4gICAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby1jb25zb2xlICovXG4gICAgICAvKiBnbG9iYWwgY29uc29sZSAqL1xuICAgICAgLy8gVmFsdWUgY291bGQgYmUgdW5wcmludGFibGUgc28gd3JpdGUgdGhlIG9iamVjdCBvbiBjb25zb2xlXG4gICAgICBjb25zb2xlLmVycm9yKGAke3NvdXJjZX0gQmFkIHVuaWZvcm0gJHt1bmlmb3JtTmFtZX1gLCB2YWx1ZSk7XG4gICAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLWNvbnNvbGUgKi9cbiAgICAgIHRocm93IG5ldyBFcnJvcihgJHtzb3VyY2V9IEJhZCB1bmlmb3JtICR7dW5pZm9ybU5hbWV9YCk7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBjaGVja1VuaWZvcm1WYWx1ZSh2YWx1ZSkge1xuICBsZXQgb2sgPSB0cnVlO1xuXG4gIC8vIFRlc3QgZm9yIHRleHR1cmUgKGZvciBzYW1wbGVyIHVuaWZvcm1zKVxuICAvLyBXZWJHTDI6IGlmICh2YWx1ZSBpbnN0YW5jZW9mIFRleHR1cmUgfHwgdmFsdWUgaW5zdGFuY2VvZiBTYW1wbGVyKSB7XG4gIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFRleHR1cmUpIHtcbiAgICBvayA9IHRydWU7XG4gIC8vIENoZWNrIHRoYXQgZXZlcnkgZWxlbWVudCBpbiBhcnJheSBpcyBhIG51bWJlciwgYW5kIGF0IGxlYXN0IDEgZWxlbWVudFxuICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgZm9yIChjb25zdCBlbGVtZW50IG9mIHZhbHVlKSB7XG4gICAgICBpZiAoIWlzRmluaXRlKGVsZW1lbnQpKSB7XG4gICAgICAgIG9rID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIG9rID0gb2sgJiYgKHZhbHVlLmxlbmd0aCA+IDApO1xuICAvLyBUeXBlZCBhcnJheXMgY2FuIG9ubHkgY29udGFpbiBudW1iZXJzLCBidXQgY2hlY2sgbGVuZ3RoXG4gIH0gZWxzZSBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KHZhbHVlKSkge1xuICAgIG9rID0gdmFsdWUubGVuZ3RoID4gMDtcbiAgLy8gQ2hlY2sgdGhhdCBzaW5nbGUgdmFsdWUgaXMgYSBudW1iZXJcbiAgfSBlbHNlIGlmICghaXNGaW5pdGUodmFsdWUpKSB7XG4gICAgb2sgPSBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiBvaztcbn1cblxuLy8gUHJlcGFyZXMgYSB0YWJsZSBzdWl0YWJsZSBmb3IgY29uc29sZS50YWJsZVxuLyogZXNsaW50LWRpc2FibGUgbWF4LXN0YXRlbWVudHMgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRVbmlmb3Jtc1RhYmxlKHtcbiAgaGVhZGVyID0gJ1VuaWZvcm1zJyxcbiAgcHJvZ3JhbSxcbiAgdW5pZm9ybXNcbn0gPSB7fSkge1xuICBhc3NlcnQocHJvZ3JhbSk7XG5cbiAgY29uc3QgdW5pZm9ybUxvY2F0aW9ucyA9IHByb2dyYW0uX3VuaWZvcm1TZXR0ZXJzO1xuICBjb25zdCB0YWJsZSA9IHtbaGVhZGVyXToge319O1xuXG4gIC8vIEFkZCBwcm9ncmFtJ3MgcHJvdmlkZWQgdW5pZm9ybXNcbiAgZm9yIChjb25zdCB1bmlmb3JtTmFtZSBpbiB1bmlmb3JtTG9jYXRpb25zKSB7XG4gICAgY29uc3QgdW5pZm9ybSA9IHVuaWZvcm1zW3VuaWZvcm1OYW1lXTtcbiAgICBpZiAodW5pZm9ybSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0YWJsZVt1bmlmb3JtTmFtZV0gPSB7XG4gICAgICAgIFR5cGU6IHVuaWZvcm0sXG4gICAgICAgIFZhbHVlOiBmb3JtYXRWYWx1ZSh1bmlmb3JtKVxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvLyBBZGQgcHJvZ3JhbSdzIHVucHJvdmlkZWQgdW5pZm9ybXNcbiAgZm9yIChjb25zdCB1bmlmb3JtTmFtZSBpbiB1bmlmb3JtTG9jYXRpb25zKSB7XG4gICAgY29uc3QgdW5pZm9ybSA9IHVuaWZvcm1zW3VuaWZvcm1OYW1lXTtcbiAgICBpZiAodW5pZm9ybSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0YWJsZVt1bmlmb3JtTmFtZV0gPSB7XG4gICAgICAgIFR5cGU6ICdOT1QgUFJPVklERUQnLFxuICAgICAgICBWYWx1ZTogJ04vQSdcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgY29uc3QgdW51c2VkVGFibGUgPSB7fTtcbiAgbGV0IHVudXNlZENvdW50ID0gMDtcblxuICAvLyBMaXN0IGFueSB1bnVzZWQgdW5pZm9ybXNcbiAgZm9yIChjb25zdCB1bmlmb3JtTmFtZSBpbiB1bmlmb3Jtcykge1xuICAgIGNvbnN0IHVuaWZvcm0gPSB1bmlmb3Jtc1t1bmlmb3JtTmFtZV07XG4gICAgaWYgKCF0YWJsZVt1bmlmb3JtTmFtZV0pIHtcbiAgICAgIHVudXNlZENvdW50Kys7XG4gICAgICB1bnVzZWRUYWJsZVt1bmlmb3JtTmFtZV0gPSB7XG4gICAgICAgIFR5cGU6IGBOT1QgVVNFRDogJHt1bmlmb3JtfWAsXG4gICAgICAgIFZhbHVlOiBmb3JtYXRWYWx1ZSh1bmlmb3JtKVxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge3RhYmxlLCB1bnVzZWRUYWJsZSwgdW51c2VkQ291bnR9O1xufVxuXG4vKlxuICBpZiAodmVjdG9yKSB7XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSBXZWJHTC5GTE9BVDpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtMWY7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFdlYkdMLkZMT0FUX1ZFQzI6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTJmdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBpc0FycmF5ID8gRmxvYXQzMkFycmF5IDogbmV3IEZsb2F0MzJBcnJheSgyKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgV2ViR0wuRkxPQVRfVkVDMzpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtM2Z2O1xuICAgICAgVHlwZWRBcnJheSA9IGlzQXJyYXkgPyBGbG9hdDMyQXJyYXkgOiBuZXcgRmxvYXQzMkFycmF5KDMpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBXZWJHTC5GTE9BVF9WRUM0OlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm00ZnY7XG4gICAgICBUeXBlZEFycmF5ID0gaXNBcnJheSA/IEZsb2F0MzJBcnJheSA6IG5ldyBGbG9hdDMyQXJyYXkoNCk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFdlYkdMLklOVDpcbiAgICBjYXNlIFdlYkdMLkJPT0w6XG4gICAgY2FzZSBXZWJHTC5TQU1QTEVSXzJEOlxuICAgIGNhc2UgV2ViR0wuU0FNUExFUl9DVUJFOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0xaTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgV2ViR0wuSU5UX1ZFQzI6XG4gICAgY2FzZSBXZWJHTC5CT09MX1ZFQzI6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTJpdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBpc0FycmF5ID8gVWludDE2QXJyYXkgOiBuZXcgVWludDE2QXJyYXkoMik7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFdlYkdMLklOVF9WRUMzOlxuICAgIGNhc2UgV2ViR0wuQk9PTF9WRUMzOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0zaXY7XG4gICAgICBUeXBlZEFycmF5ID0gaXNBcnJheSA/IFVpbnQxNkFycmF5IDogbmV3IFVpbnQxNkFycmF5KDMpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBXZWJHTC5JTlRfVkVDNDpcbiAgICBjYXNlIFdlYkdMLkJPT0xfVkVDNDpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtNGl2O1xuICAgICAgVHlwZWRBcnJheSA9IGlzQXJyYXkgPyBVaW50MTZBcnJheSA6IG5ldyBVaW50MTZBcnJheSg0KTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgV2ViR0wuRkxPQVRfTUFUMjpcbiAgICAgIG1hdHJpeCA9IHRydWU7XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybU1hdHJpeDJmdjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgV2ViR0wuRkxPQVRfTUFUMzpcbiAgICAgIG1hdHJpeCA9IHRydWU7XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybU1hdHJpeDNmdjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgV2ViR0wuRkxPQVRfTUFUNDpcbiAgICAgIG1hdHJpeCA9IHRydWU7XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybU1hdHJpeDRmdjtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiovXG4iXX0=