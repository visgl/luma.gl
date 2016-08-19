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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC91bmlmb3Jtcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztRQTJCZ0IsZ0IsR0FBQSxnQjtRQW9CQSxnQixHQUFBLGdCO1FBeUNBLGtCLEdBQUEsa0I7UUE0Q0EsZ0IsR0FBQSxnQjs7QUFwSWhCOztBQUNBOztBQUNBOzs7Ozs7Ozs7O0FBSUEsSUFBTSwrRkFDSCxrQkFBTSxLQURILEVBQ1csRUFBQyxVQUFVLFdBQVgsRUFBd0IsTUFBTSxZQUE5QixFQURYLDBDQUVILGtCQUFNLEdBRkgsRUFFUyxFQUFDLFVBQVUsV0FBWCxFQUF3QixNQUFNLFdBQTlCLEVBRlQsMENBR0gsa0JBQU0sSUFISCxFQUdVLEVBQUMsVUFBVSxXQUFYLEVBQXdCLE1BQU0sV0FBOUIsRUFIViwwQ0FJSCxrQkFBTSxVQUpILEVBSWdCLEVBQUMsVUFBVSxZQUFYLEVBQXlCLE1BQU0sWUFBL0IsRUFBNkMsVUFBVSxDQUF2RCxFQUpoQiwwQ0FLSCxrQkFBTSxVQUxILEVBS2dCLEVBQUMsVUFBVSxZQUFYLEVBQXlCLE1BQU0sWUFBL0IsRUFBNkMsVUFBVSxDQUF2RCxFQUxoQiwwQ0FNSCxrQkFBTSxVQU5ILEVBTWdCLEVBQUMsVUFBVSxZQUFYLEVBQXlCLE1BQU0sWUFBL0IsRUFBNkMsVUFBVSxDQUF2RCxFQU5oQiwwQ0FPSCxrQkFBTSxRQVBILEVBT2MsRUFBQyxVQUFVLFlBQVgsRUFBeUIsTUFBTSxXQUEvQixFQUE0QyxVQUFVLENBQXRELEVBUGQsMENBUUgsa0JBQU0sUUFSSCxFQVFjLEVBQUMsVUFBVSxZQUFYLEVBQXlCLE1BQU0sV0FBL0IsRUFBNEMsVUFBVSxDQUF0RCxFQVJkLDBDQVNILGtCQUFNLFFBVEgsRUFTYyxFQUFDLFVBQVUsWUFBWCxFQUF5QixNQUFNLFdBQS9CLEVBQTRDLFVBQVUsQ0FBdEQsRUFUZCwwQ0FVSCxrQkFBTSxTQVZILEVBVWUsRUFBQyxVQUFVLFlBQVgsRUFBeUIsTUFBTSxXQUEvQixFQUE0QyxVQUFVLENB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TUFETixRQUNNLFFBRE4sUUFDTTs7QUFDTix3QkFBTyxPQUFQOztBQUVBLE1BQU0sbUJBQW1CLFFBQVEsZUFBakM7QUFDQSxNQUFNLDRCQUFVLE1BQVYsRUFBbUIsRUFBbkIsQ0FBTjs7O0FBR0EsT0FBSyxJQUFNLFdBQVgsSUFBMEIsZ0JBQTFCLEVBQTRDO0FBQzFDLFFBQU0sVUFBVSxTQUFTLFdBQVQsQ0FBaEI7QUFDQSxRQUFJLFlBQVksU0FBaEIsRUFBMkI7QUFDekIsWUFBTSxXQUFOLElBQXFCO0FBQ25CLGNBQU0sT0FEYTtBQUVuQixlQUFPLFFBQVEsUUFBUjtBQUZZLE9BQXJCO0FBSUQ7QUFDRjs7O0FBR0QsT0FBSyxJQUFNLFlBQVgsSUFBMEIsZ0JBQTFCLEVBQTRDO0FBQzFDLFFBQU0sV0FBVSxTQUFTLFlBQVQsQ0FBaEI7QUFDQSxRQUFJLGFBQVksU0FBaEIsRUFBMkI7QUFDekIsWUFBTSxZQUFOLElBQXFCO0FBQ25CLGNBQU0sY0FEYTtBQUVuQixlQUFPO0FBRlksT0FBckI7QUFJRDtBQUNGOzs7QUFHRCxPQUFLLElBQU0sYUFBWCxJQUEwQixRQUExQixFQUFvQztBQUNsQyxRQUFNLFlBQVUsU0FBUyxhQUFULENBQWhCO0FBQ0EsUUFBSSxDQUFDLE1BQU0sYUFBTixDQUFMLEVBQXlCO0FBQ3ZCLFlBQU0sYUFBTixJQUFxQjtBQUNuQixjQUFNLGVBQWUsU0FERjtBQUVuQixlQUFPLFVBQVEsUUFBUjtBQUZZLE9BQXJCO0FBSUQ7QUFDRjs7QUFFRCxTQUFPLEtBQVA7QUFDRCIsImZpbGUiOiJ1bmlmb3Jtcy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7V2ViR0x9IGZyb20gJy4vd2ViZ2wtdHlwZXMnO1xuaW1wb3J0IHtUZXh0dXJlfSBmcm9tICcuL3RleHR1cmUnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG4vLyBUT0RPIC0gdXNlIHRhYmxlcyB0byByZWR1Y2UgY29tcGxleGl0eSBvZiBtZXRob2QgYmVsb3dcbi8qIGVzbGludC1kaXNhYmxlIG1heC1sZW4gKi9cbmNvbnN0IFVOSUZPUk1fQkFTRV9ERVNDUklQVE9SUyA9IHtcbiAgW1dlYkdMLkZMT0FUXToge2Z1bmN0aW9uOiAndW5pZm9ybTFmJywgdHlwZTogRmxvYXQzMkFycmF5fSxcbiAgW1dlYkdMLklOVF06IHtmdW5jdGlvbjogJ3VuaWZvcm0xaScsIHR5cGU6IFVpbnQxNkFycmF5fSxcbiAgW1dlYkdMLkJPT0xdOiB7ZnVuY3Rpb246ICd1bmlmb3JtMWknLCB0eXBlOiBVaW50MTZBcnJheX0sXG4gIFtXZWJHTC5GTE9BVF9WRUMyXToge2Z1bmN0aW9uOiAndW5pZm9ybTJmdicsIHR5cGU6IEZsb2F0MzJBcnJheSwgZWxlbWVudHM6IDJ9LFxuICBbV2ViR0wuRkxPQVRfVkVDM106IHtmdW5jdGlvbjogJ3VuaWZvcm0zZnYnLCB0eXBlOiBGbG9hdDMyQXJyYXksIGVsZW1lbnRzOiAzfSxcbiAgW1dlYkdMLkZMT0FUX1ZFQzRdOiB7ZnVuY3Rpb246ICd1bmlmb3JtNGZ2JywgdHlwZTogRmxvYXQzMkFycmF5LCBlbGVtZW50czogNH0sXG4gIFtXZWJHTC5JTlRfVkVDMl06IHtmdW5jdGlvbjogJ3VuaWZvcm0yaXYnLCB0eXBlOiBVaW50MTZBcnJheSwgZWxlbWVudHM6IDJ9LFxuICBbV2ViR0wuSU5UX1ZFQzNdOiB7ZnVuY3Rpb246ICd1bmlmb3JtM2l2JywgdHlwZTogVWludDE2QXJyYXksIGVsZW1lbnRzOiAzfSxcbiAgW1dlYkdMLklOVF9WRUM0XToge2Z1bmN0aW9uOiAndW5pZm9ybTRpdicsIHR5cGU6IFVpbnQxNkFycmF5LCBlbGVtZW50czogNH0sXG4gIFtXZWJHTC5CT09MX1ZFQzJdOiB7ZnVuY3Rpb246ICd1bmlmb3JtMml2JywgdHlwZTogVWludDE2QXJyYXksIGVsZW1lbnRzOiAyfSxcbiAgW1dlYkdMLkJPT0xfVkVDM106IHtmdW5jdGlvbjogJ3VuaWZvcm0zZnYnLCB0eXBlOiBVaW50MTZBcnJheSwgZWxlbWVudHM6IDN9LFxuICBbV2ViR0wuQk9PTF9WRUM0XToge2Z1bmN0aW9uOiAndW5pZm9ybTRpdicsIHR5cGU6IFVpbnQxNkFycmF5LCBlbGVtZW50czogNH0sXG4gIFtXZWJHTC5GTE9BVF9NQVQyXToge2Z1bmN0aW9uOiAndW5pZm9ybU1hdHJpeDJmdicsIHR5cGU6IEZsb2F0MzJBcnJheSwgbWF0cml4OiB0cnVlLCBlbGVtZW50czogNH0sXG4gIFtXZWJHTC5GTE9BVF9NQVQzXToge21mdW5jdGlvbjogJ3VuaWZvcm1NYXRyaXgzZnYnLCB0eXBlOiBGbG9hdDMyQXJyYXksIG1hdHJpeDogdHJ1ZSwgZWxlbWVudHM6IDl9LFxuICBbV2ViR0wuRkxPQVRfTUFUNF06IHtmdW5jdGlvbjogJ3VuaWZvcm1NYXRyaXg0ZnYnLCB0eXBlOiBGbG9hdDMyQXJyYXksIG1hdHJpeDogdHJ1ZSwgZWxlbWVudHM6IDE2fSxcbiAgW1dlYkdMLlNBTVBMRVJfMkRdOiB7ZnVuY3Rpb246ICd1bmlmb3JtMWknLCB0eXBlOiBVaW50MTZBcnJheSwgdGV4dHVyZTogdHJ1ZX0sXG4gIFtXZWJHTC5TQU1QTEVSX0NVQkVdOiB7ZnVuY3Rpb246ICd1bmlmb3JtMWknLCB0eXBlOiBVaW50MTZBcnJheSwgdGV4dHVyZTogdHJ1ZX1cbn07XG4vKiBlc2xpbnQtZW5hYmxlIG1heC1sZW4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlVW5pZm9ybU5hbWUobmFtZSkge1xuICAvLyBuYW1lID0gbmFtZVtuYW1lLmxlbmd0aCAtIDFdID09PSAnXScgP1xuICAvLyBuYW1lLnN1YnN0cigwLCBuYW1lLmxlbmd0aCAtIDMpIDogbmFtZTtcblxuICAvLyBpZiBhcnJheSBuYW1lIHRoZW4gY2xlYW4gdGhlIGFycmF5IGJyYWNrZXRzXG4gIGNvbnN0IFVOSUZPUk1fTkFNRV9SRUdFWFAgPSAvKFteXFxbXSopKFxcW1swLTldK1xcXSk/LztcbiAgY29uc3QgbWF0Y2hlcyA9IG5hbWUubWF0Y2goVU5JRk9STV9OQU1FX1JFR0VYUCk7XG4gIGlmICghbWF0Y2hlcyB8fCBtYXRjaGVzLmxlbmd0aCA8IDIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBwYXJzZSBHTFNMIHVuaWZvcm0gbmFtZSAke25hbWV9YCk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIG5hbWU6IG1hdGNoZXNbMV0sXG4gICAgbGVuZ3RoOiBtYXRjaGVzWzJdIHx8IDEsXG4gICAgaXNBcnJheTogQm9vbGVhbihtYXRjaGVzWzJdKVxuICB9O1xufVxuXG4vLyBSZXR1cm5zIGEgTWFnaWMgVW5pZm9ybSBTZXR0ZXJcbi8qIGVzbGludC1kaXNhYmxlIGNvbXBsZXhpdHkgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRVbmlmb3JtU2V0dGVyKGdsLCBsb2NhdGlvbiwgaW5mbykge1xuICBjb25zdCBkZXNjcmlwdG9yID0gVU5JRk9STV9CQVNFX0RFU0NSSVBUT1JTW2luZm8udHlwZV07XG4gIGlmICghZGVzY3JpcHRvcikge1xuICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBHTFNMIHVuaWZvcm0gdHlwZSAke2luZm8udHlwZX1gKTtcbiAgfVxuXG4gIGNvbnN0IGdsRnVuY3Rpb24gPSBnbFtkZXNjcmlwdG9yLmZ1bmN0aW9uXS5iaW5kKGdsKTtcbiAgY29uc3QgVHlwZWRBcnJheSA9IGRlc2NyaXB0b3IudHlwZTtcblxuICAvLyBIb3cgbWFueSBkYXRhIGVsZW1lbnRzIGRvZXMgYXBwIG5lZWQgdG8gcHJvdmlkZVxuICBjb25zdCBmbGF0QXJyYXlMZW5ndGggPSBpbmZvLnNpemUgKiAoZGVzY3JpcHRvci5lbGVtZW50cyB8fCAxKTtcblxuICAvLyBjb25zb2xlLmxvZygnZ2V0U2V0dGVyJywgbG9jYXRpb24sIGluZm8sIGZsYXRBcnJheUxlbmd0aCk7XG5cbiAgLy8gU2V0IGEgdW5pZm9ybSBhcnJheVxuICBsZXQgc2V0dGVyO1xuICBpZiAoZmxhdEFycmF5TGVuZ3RoID4gMSkge1xuICAgIHNldHRlciA9IHZhbCA9PiB7XG4gICAgICBpZiAoISh2YWwgaW5zdGFuY2VvZiBUeXBlZEFycmF5KSkge1xuICAgICAgICBjb25zdCB0eXBlZEFycmF5ID0gbmV3IFR5cGVkQXJyYXkoZmxhdEFycmF5TGVuZ3RoKTtcbiAgICAgICAgdHlwZWRBcnJheS5zZXQodmFsKTtcbiAgICAgICAgdmFsID0gdHlwZWRBcnJheTtcbiAgICAgIH1cbiAgICAgIGFzc2VydCh2YWwubGVuZ3RoID09PSBmbGF0QXJyYXlMZW5ndGgpO1xuICAgICAgaWYgKGRlc2NyaXB0b3IubWF0cml4KSB7XG4gICAgICAgIC8vIFNlY29uZCBwYXJhbTogd2hldGhlciB0byB0cmFuc3Bvc2UgdGhlIG1hdHJpeC4gTXVzdCBiZSBmYWxzZS5cbiAgICAgICAgZ2xGdW5jdGlvbihsb2NhdGlvbiwgZmFsc2UsIHZhbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBnbEZ1bmN0aW9uKGxvY2F0aW9uLCB2YWwpO1xuICAgICAgfVxuICAgIH07XG4gIH0gZWxzZSB7XG4gICAgc2V0dGVyID0gdmFsID0+IGdsRnVuY3Rpb24obG9jYXRpb24sIHZhbCk7XG4gIH1cblxuICAvLyBTZXQgYSBwcmltaXRpdmUtdmFsdWVkIHVuaWZvcm1cbiAgcmV0dXJuIHNldHRlcjtcbn1cblxuLy8gQmFzaWMgY2hlY2tzIG9mIHVuaWZvcm0gdmFsdWVzIHdpdGhvdXQga25vd2xlZGdlIG9mIHByb2dyYW1cbi8vIFRvIGZhY2lsaXRhdGUgZWFybHkgZGV0ZWN0aW9uIG9mIGUuZy4gdW5kZWZpbmVkIHZhbHVlcyBpbiBKYXZhU2NyaXB0XG5leHBvcnQgZnVuY3Rpb24gY2hlY2tVbmlmb3JtVmFsdWVzKHVuaWZvcm1zLCBzb3VyY2UpIHtcbiAgZm9yIChjb25zdCB1bmlmb3JtTmFtZSBpbiB1bmlmb3Jtcykge1xuICAgIGNvbnN0IHZhbHVlID0gdW5pZm9ybXNbdW5pZm9ybU5hbWVdO1xuICAgIGlmICghY2hlY2tVbmlmb3JtVmFsdWUodmFsdWUpKSB7XG4gICAgICAvLyBBZGQgc3BhY2UgdG8gc291cmNlXG4gICAgICBzb3VyY2UgPSBzb3VyY2UgPyBgJHtzb3VyY2V9IGAgOiBgYDtcbiAgICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnNvbGUgKi9cbiAgICAgIC8qIGdsb2JhbCBjb25zb2xlICovXG4gICAgICAvLyBWYWx1ZSBjb3VsZCBiZSB1bnByaW50YWJsZSBzbyB3cml0ZSB0aGUgb2JqZWN0IG9uIGNvbnNvbGVcbiAgICAgIGNvbnNvbGUuZXJyb3IoYCR7c291cmNlfSBCYWQgdW5pZm9ybSAke3VuaWZvcm1OYW1lfWAsIHZhbHVlKTtcbiAgICAgIC8qIGVzbGludC1lbmFibGUgbm8tY29uc29sZSAqL1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke3NvdXJjZX0gQmFkIHVuaWZvcm0gJHt1bmlmb3JtTmFtZX1gKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGNoZWNrVW5pZm9ybVZhbHVlKHZhbHVlKSB7XG4gIGxldCBvayA9IHRydWU7XG5cbiAgLy8gVGVzdCBmb3IgdGV4dHVyZSAoZm9yIHNhbXBsZXIgdW5pZm9ybXMpXG4gIC8vIFdlYkdMMjogaWYgKHZhbHVlIGluc3RhbmNlb2YgVGV4dHVyZSB8fCB2YWx1ZSBpbnN0YW5jZW9mIFNhbXBsZXIpIHtcbiAgaWYgKHZhbHVlIGluc3RhbmNlb2YgVGV4dHVyZSkge1xuICAgIG9rID0gdHJ1ZTtcbiAgLy8gQ2hlY2sgdGhhdCBldmVyeSBlbGVtZW50IGluIGFycmF5IGlzIGEgbnVtYmVyLCBhbmQgYXQgbGVhc3QgMSBlbGVtZW50XG4gIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgdmFsdWUpIHtcbiAgICAgIGlmICghaXNGaW5pdGUoZWxlbWVudCkpIHtcbiAgICAgICAgb2sgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgb2sgPSBvayAmJiAodmFsdWUubGVuZ3RoID4gMCk7XG4gIC8vIFR5cGVkIGFycmF5cyBjYW4gb25seSBjb250YWluIG51bWJlcnMsIGJ1dCBjaGVjayBsZW5ndGhcbiAgfSBlbHNlIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcodmFsdWUpKSB7XG4gICAgb2sgPSB2YWx1ZS5sZW5ndGggPiAwO1xuICAvLyBDaGVjayB0aGF0IHNpbmdsZSB2YWx1ZSBpcyBhIG51bWJlclxuICB9IGVsc2UgaWYgKCFpc0Zpbml0ZSh2YWx1ZSkpIHtcbiAgICBvayA9IGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIG9rO1xufVxuXG4vLyBQcmVwYXJlcyBhIHRhYmxlIHN1aXRhYmxlIGZvciBjb25zb2xlLnRhYmxlXG5leHBvcnQgZnVuY3Rpb24gZ2V0VW5pZm9ybXNUYWJsZSh7XG4gIGhlYWRlciA9ICdVbmlmb3JtcycsXG4gIHByb2dyYW0sXG4gIHVuaWZvcm1zXG59ID0ge30pIHtcbiAgYXNzZXJ0KHByb2dyYW0pO1xuXG4gIGNvbnN0IHVuaWZvcm1Mb2NhdGlvbnMgPSBwcm9ncmFtLl91bmlmb3JtU2V0dGVycztcbiAgY29uc3QgdGFibGUgPSB7W2hlYWRlcl06IHt9fTtcblxuICAvLyBBZGQgcHJvZ3JhbSdzIHByb3ZpZGVkIHVuaWZvcm1zXG4gIGZvciAoY29uc3QgdW5pZm9ybU5hbWUgaW4gdW5pZm9ybUxvY2F0aW9ucykge1xuICAgIGNvbnN0IHVuaWZvcm0gPSB1bmlmb3Jtc1t1bmlmb3JtTmFtZV07XG4gICAgaWYgKHVuaWZvcm0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGFibGVbdW5pZm9ybU5hbWVdID0ge1xuICAgICAgICBUeXBlOiB1bmlmb3JtLFxuICAgICAgICBWYWx1ZTogdW5pZm9ybS50b1N0cmluZygpXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIC8vIEFkZCBwcm9ncmFtJ3MgdW5wcm92aWRlZCB1bmlmb3Jtc1xuICBmb3IgKGNvbnN0IHVuaWZvcm1OYW1lIGluIHVuaWZvcm1Mb2NhdGlvbnMpIHtcbiAgICBjb25zdCB1bmlmb3JtID0gdW5pZm9ybXNbdW5pZm9ybU5hbWVdO1xuICAgIGlmICh1bmlmb3JtID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRhYmxlW3VuaWZvcm1OYW1lXSA9IHtcbiAgICAgICAgVHlwZTogJ05PVCBQUk9WSURFRCcsXG4gICAgICAgIFZhbHVlOiAnTi9BJ1xuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvLyBMaXN0IGFueSB1bnVzZWQgdW5pZm9ybXNcbiAgZm9yIChjb25zdCB1bmlmb3JtTmFtZSBpbiB1bmlmb3Jtcykge1xuICAgIGNvbnN0IHVuaWZvcm0gPSB1bmlmb3Jtc1t1bmlmb3JtTmFtZV07XG4gICAgaWYgKCF0YWJsZVt1bmlmb3JtTmFtZV0pIHtcbiAgICAgIHRhYmxlW3VuaWZvcm1OYW1lXSA9IHtcbiAgICAgICAgVHlwZTogJ05PVCBVU0VEOiAnICsgdW5pZm9ybSxcbiAgICAgICAgVmFsdWU6IHVuaWZvcm0udG9TdHJpbmcoKVxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGFibGU7XG59XG5cbi8qXG4gIGlmICh2ZWN0b3IpIHtcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICBjYXNlIFdlYkdMLkZMT0FUOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0xZjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgV2ViR0wuRkxPQVRfVkVDMjpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtMmZ2O1xuICAgICAgVHlwZWRBcnJheSA9IGlzQXJyYXkgPyBGbG9hdDMyQXJyYXkgOiBuZXcgRmxvYXQzMkFycmF5KDIpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBXZWJHTC5GTE9BVF9WRUMzOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0zZnY7XG4gICAgICBUeXBlZEFycmF5ID0gaXNBcnJheSA/IEZsb2F0MzJBcnJheSA6IG5ldyBGbG9hdDMyQXJyYXkoMyk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFdlYkdMLkZMT0FUX1ZFQzQ6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTRmdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBpc0FycmF5ID8gRmxvYXQzMkFycmF5IDogbmV3IEZsb2F0MzJBcnJheSg0KTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgV2ViR0wuSU5UOlxuICAgIGNhc2UgV2ViR0wuQk9PTDpcbiAgICBjYXNlIFdlYkdMLlNBTVBMRVJfMkQ6XG4gICAgY2FzZSBXZWJHTC5TQU1QTEVSX0NVQkU6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTFpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBXZWJHTC5JTlRfVkVDMjpcbiAgICBjYXNlIFdlYkdMLkJPT0xfVkVDMjpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtMml2O1xuICAgICAgVHlwZWRBcnJheSA9IGlzQXJyYXkgPyBVaW50MTZBcnJheSA6IG5ldyBVaW50MTZBcnJheSgyKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgV2ViR0wuSU5UX1ZFQzM6XG4gICAgY2FzZSBXZWJHTC5CT09MX1ZFQzM6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTNpdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBpc0FycmF5ID8gVWludDE2QXJyYXkgOiBuZXcgVWludDE2QXJyYXkoMyk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFdlYkdMLklOVF9WRUM0OlxuICAgIGNhc2UgV2ViR0wuQk9PTF9WRUM0OlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm00aXY7XG4gICAgICBUeXBlZEFycmF5ID0gaXNBcnJheSA/IFVpbnQxNkFycmF5IDogbmV3IFVpbnQxNkFycmF5KDQpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBXZWJHTC5GTE9BVF9NQVQyOlxuICAgICAgbWF0cml4ID0gdHJ1ZTtcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtTWF0cml4MmZ2O1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBXZWJHTC5GTE9BVF9NQVQzOlxuICAgICAgbWF0cml4ID0gdHJ1ZTtcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtTWF0cml4M2Z2O1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBXZWJHTC5GTE9BVF9NQVQ0OlxuICAgICAgbWF0cml4ID0gdHJ1ZTtcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtTWF0cml4NGZ2O1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuKi8iXX0=