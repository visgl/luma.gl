'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // Creates programs out of shaders and provides convenient methods for loading
// buffers attributes and uniforms

/* eslint-disable no-console, complexity */

/* global console */


var _context = require('./context');

var _utils = require('../utils');

var _shader = require('./shader');

var _shaders = require('../shaders');

var _shaders2 = _interopRequireDefault(_shaders);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Program = function () {

  /*
   * @classdesc
   * Handles creation of programs, mapping of attributes and uniforms
   *
   * @class
   * @param {WebGLRenderingContext} gl - gl context
   * @param {Object} opts - options
   * @param {String} opts.vs - Vertex shader source
   * @param {String} opts.fs - Fragment shader source
   * @param {String} opts.id= - Id
   */

  function Program(gl, opts, fs, id) {
    _classCallCheck(this, Program);

    var vs = undefined;
    if (typeof opts === 'string') {
      console.warn('DEPRECATED: New use: Program(gl, {vs, fs, id})');
      vs = opts;
    } else {
      vs = opts.vs;
      fs = opts.fs;
      id = opts.id;
    }

    vs = vs || _shaders2.default.Vertex.Default;
    fs = fs || _shaders2.default.Fragment.Default;

    var program = gl.createProgram();
    if (!program) {
      throw new Error('Failed to create program');
    }

    gl.attachShader(program, new _shader.VertexShader(gl, vs).handle);
    gl.attachShader(program, new _shader.FragmentShader(gl, fs).handle);
    gl.linkProgram(program);
    var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked) {
      throw new Error('Error linking ' + gl.getProgramInfoLog(program));
    }

    this.gl = gl;
    this.id = id || (0, _utils.uid)();
    this.program = program;
    // determine attribute locations (i.e. indices)
    this.attributeLocations = getAttributeLocations(gl, program);
    // prepare uniform setters
    this.uniformSetters = getUniformSetters(gl, program);
    // no attributes enabled yet
    this.attributeEnabled = {};
  }

  _createClass(Program, [{
    key: 'use',
    value: function use() {
      this.gl.useProgram(this.program);
      return this;
    }
  }, {
    key: 'setTexture',
    value: function setTexture(texture, index) {
      texture.bind(index);
      return this;
    }
  }, {
    key: 'setUniform',
    value: function setUniform(name, value) {
      if (name in this.uniformSetters) {
        this.uniformSetters[name](value);
      }
      return this;
    }
  }, {
    key: 'setUniforms',
    value: function setUniforms(uniformMap) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Object.keys(uniformMap)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var name = _step.value;

          if (name in this.uniformSetters) {
            this.uniformSetters[name](uniformMap[name]);
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

      return this;
    }
  }, {
    key: 'setBuffer',
    value: function setBuffer(buffer) {
      var location = this.attributeLocations[buffer.attribute];
      buffer.attachToLocation(location);
      return this;
    }
  }, {
    key: 'setBuffers',
    value: function setBuffers(buffers) {
      (0, _assert2.default)(Array.isArray(buffers), 'Program.setBuffers expects array');
      buffers = buffers.length === 1 && Array.isArray(buffers[0]) ? buffers[0] : buffers;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = buffers[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var buffer = _step2.value;

          this.setBuffer(buffer);
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      return this;
    }
  }, {
    key: 'unsetBuffer',
    value: function unsetBuffer(buffer) {
      var location = this.attributeLocations[buffer.attribute];
      buffer.detachFromLocation(location);
      return this;
    }
  }, {
    key: 'unsetBuffers',
    value: function unsetBuffers(buffers) {
      (0, _assert2.default)(Array.isArray(buffers), 'Program.setBuffers expects array');
      buffers = buffers.length === 1 && Array.isArray(buffers[0]) ? buffers[0] : buffers;
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = buffers[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var buffer = _step3.value;

          this.unsetBuffer(buffer);
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      return this;
    }
  }]);

  return Program;
}();

// TODO - use tables to reduce complexity of method below
// const glUniformSetter = {
//   FLOAT: {function: 'uniform1fv', type: Float32Array},
//   FLOAT_VEC3: {function: 'uniform3fv', type: Float32Array},
//   FLOAT_MAT4: {function: 'uniformMatrix4fv', type: Float32Array},
//   INT: {function: 'uniform1iv', type: Uint16Array},
//   BOOL: {function: 'uniform1iv', type: Uint16Array},
//   SAMPLER_2D: {function: 'uniform1iv', type: Uint16Array},
//   SAMPLER_CUBE: {function: 'uniform1iv', type: Uint16Array}
// };

// Returns a Magic Uniform Setter


exports.default = Program;
function getUniformSetter(gl, glProgram, info, isArray) {
  var name = info.name;
  var type = info.type;

  var loc = gl.getUniformLocation(glProgram, name);

  var matrix = false;
  var vector = true;
  var glFunction = undefined;
  var TypedArray = undefined;

  if (info.size > 1 && isArray) {
    switch (type) {

      case gl.FLOAT:
        glFunction = gl.uniform1fv;
        TypedArray = Float32Array;
        vector = false;
        break;

      case gl.FLOAT_VEC3:
        glFunction = gl.uniform3fv;
        TypedArray = Float32Array;
        vector = true;
        break;

      case gl.FLOAT_MAT4:
        glFunction = gl.uniformMatrix4fv;
        TypedArray = Float32Array;
        vector = true;
        break;

      case gl.INT:
      case gl.BOOL:
      case gl.SAMPLER_2D:
      case gl.SAMPLER_CUBE:
        glFunction = gl.uniform1iv;
        TypedArray = Uint16Array;
        vector = false;
        break;

      default:
        throw new Error('Uniform: Unknown GLSL type ' + type);

    }
  }

  if (vector) {
    switch (type) {
      case gl.FLOAT:
        glFunction = gl.uniform1f;
        break;
      case gl.FLOAT_VEC2:
        glFunction = gl.uniform2fv;
        TypedArray = isArray ? Float32Array : new Float32Array(2);
        break;
      case gl.FLOAT_VEC3:
        glFunction = gl.uniform3fv;
        TypedArray = isArray ? Float32Array : new Float32Array(3);
        break;
      case gl.FLOAT_VEC4:
        glFunction = gl.uniform4fv;
        TypedArray = isArray ? Float32Array : new Float32Array(4);
        break;
      case gl.INT:case gl.BOOL:case gl.SAMPLER_2D:case gl.SAMPLER_CUBE:
        glFunction = gl.uniform1i;
        break;
      case gl.INT_VEC2:case gl.BOOL_VEC2:
        glFunction = gl.uniform2iv;
        TypedArray = isArray ? Uint16Array : new Uint16Array(2);
        break;
      case gl.INT_VEC3:case gl.BOOL_VEC3:
        glFunction = gl.uniform3iv;
        TypedArray = isArray ? Uint16Array : new Uint16Array(3);
        break;
      case gl.INT_VEC4:case gl.BOOL_VEC4:
        glFunction = gl.uniform4iv;
        TypedArray = isArray ? Uint16Array : new Uint16Array(4);
        break;
      case gl.FLOAT_MAT2:
        matrix = true;
        glFunction = gl.uniformMatrix2fv;
        break;
      case gl.FLOAT_MAT3:
        matrix = true;
        glFunction = gl.uniformMatrix3fv;
        break;
      case gl.FLOAT_MAT4:
        matrix = true;
        glFunction = gl.uniformMatrix4fv;
        break;
      default:
        break;
    }
  }

  glFunction = glFunction.bind(gl);

  // Set a uniform array
  if (isArray && TypedArray) {

    return function (val) {
      glFunction(loc, new TypedArray(val));
      (0, _context.glCheckError2)(gl);
    };
  } else if (matrix) {
    // Set a matrix uniform
    return function (val) {
      glFunction(loc, false, val.toFloat32Array());
      (0, _context.glCheckError2)(gl);
    };
  } else if (TypedArray) {

    // Set a vector/typed array uniform
    return function (val) {
      TypedArray.set(val.toFloat32Array ? val.toFloat32Array() : val);
      glFunction(loc, TypedArray);
      (0, _context.glCheckError2)(gl);
    };
  }
  // Set a primitive-valued uniform
  return function (val) {
    glFunction(loc, val);
    (0, _context.glCheckError2)(gl);
  };
}

// create uniform setters
// Map of uniform names to setter functions
function getUniformSetters(gl, glProgram) {
  var uniformSetters = {};
  var length = gl.getProgramParameter(glProgram, gl.ACTIVE_UNIFORMS);
  for (var i = 0; i < length; i++) {
    var info = gl.getActiveUniform(glProgram, i);
    var name = info.name;
    // if array name then clean the array brackets
    name = name[name.length - 1] === ']' ? name.substr(0, name.length - 3) : name;
    uniformSetters[name] = getUniformSetter(gl, glProgram, info, info.name !== name);
  }
  return uniformSetters;
}

// determine attribute locations (maps attribute name to index)
function getAttributeLocations(gl, glProgram) {
  var length = gl.getProgramParameter(glProgram, gl.ACTIVE_ATTRIBUTES);
  var attributeLocations = {};
  for (var i = 0; i < length; i++) {
    var info = gl.getActiveAttrib(glProgram, i);
    var index = gl.getAttribLocation(glProgram, info.name);
    attributeLocations[info.name] = index;
  }
  return attributeLocations;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9wcm9ncmFtLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBWXFCOzs7Ozs7Ozs7Ozs7OztBQWFuQixXQWJtQixPQWFuQixDQUFZLEVBQVosRUFBZ0IsSUFBaEIsRUFBc0IsRUFBdEIsRUFBMEIsRUFBMUIsRUFBOEI7MEJBYlgsU0FhVzs7QUFDNUIsUUFBSSxjQUFKLENBRDRCO0FBRTVCLFFBQUksT0FBTyxJQUFQLEtBQWdCLFFBQWhCLEVBQTBCO0FBQzVCLGNBQVEsSUFBUixDQUFhLGdEQUFiLEVBRDRCO0FBRTVCLFdBQUssSUFBTCxDQUY0QjtLQUE5QixNQUdPO0FBQ0wsV0FBSyxLQUFLLEVBQUwsQ0FEQTtBQUVMLFdBQUssS0FBSyxFQUFMLENBRkE7QUFHTCxXQUFLLEtBQUssRUFBTCxDQUhBO0tBSFA7O0FBU0EsU0FBSyxNQUFNLGtCQUFRLE1BQVIsQ0FBZSxPQUFmLENBWGlCO0FBWTVCLFNBQUssTUFBTSxrQkFBUSxRQUFSLENBQWlCLE9BQWpCLENBWmlCOztBQWM1QixRQUFNLFVBQVUsR0FBRyxhQUFILEVBQVYsQ0Fkc0I7QUFlNUIsUUFBSSxDQUFDLE9BQUQsRUFBVTtBQUNaLFlBQU0sSUFBSSxLQUFKLENBQVUsMEJBQVYsQ0FBTixDQURZO0tBQWQ7O0FBSUEsT0FBRyxZQUFILENBQWdCLE9BQWhCLEVBQXlCLHlCQUFpQixFQUFqQixFQUFxQixFQUFyQixFQUF5QixNQUF6QixDQUF6QixDQW5CNEI7QUFvQjVCLE9BQUcsWUFBSCxDQUFnQixPQUFoQixFQUF5QiwyQkFBbUIsRUFBbkIsRUFBdUIsRUFBdkIsRUFBMkIsTUFBM0IsQ0FBekIsQ0FwQjRCO0FBcUI1QixPQUFHLFdBQUgsQ0FBZSxPQUFmLEVBckI0QjtBQXNCNUIsUUFBTSxTQUFTLEdBQUcsbUJBQUgsQ0FBdUIsT0FBdkIsRUFBZ0MsR0FBRyxXQUFILENBQXpDLENBdEJzQjtBQXVCNUIsUUFBSSxD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SUFBTCxDQUF4QyxDQUZ5QjtBQUcvQix1QkFBbUIsS0FBSyxJQUFMLENBQW5CLEdBQWdDLEtBQWhDLENBSCtCO0dBQWpDO0FBS0EsU0FBTyxrQkFBUCxDQVI0QztDQUE5QyIsImZpbGUiOiJwcm9ncmFtLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ3JlYXRlcyBwcm9ncmFtcyBvdXQgb2Ygc2hhZGVycyBhbmQgcHJvdmlkZXMgY29udmVuaWVudCBtZXRob2RzIGZvciBsb2FkaW5nXG4vLyBidWZmZXJzIGF0dHJpYnV0ZXMgYW5kIHVuaWZvcm1zXG5cbi8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnNvbGUsIGNvbXBsZXhpdHkgKi9cblxuLyogZ2xvYmFsIGNvbnNvbGUgKi9cbmltcG9ydCB7Z2xDaGVja0Vycm9yMn0gZnJvbSAnLi9jb250ZXh0JztcbmltcG9ydCB7dWlkfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQge1ZlcnRleFNoYWRlciwgRnJhZ21lbnRTaGFkZXJ9IGZyb20gJy4vc2hhZGVyJztcbmltcG9ydCBTaGFkZXJzIGZyb20gJy4uL3NoYWRlcnMnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQcm9ncmFtIHtcblxuICAvKlxuICAgKiBAY2xhc3NkZXNjXG4gICAqIEhhbmRsZXMgY3JlYXRpb24gb2YgcHJvZ3JhbXMsIG1hcHBpbmcgb2YgYXR0cmlidXRlcyBhbmQgdW5pZm9ybXNcbiAgICpcbiAgICogQGNsYXNzXG4gICAqIEBwYXJhbSB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fSBnbCAtIGdsIGNvbnRleHRcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMgLSBvcHRpb25zXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBvcHRzLnZzIC0gVmVydGV4IHNoYWRlciBzb3VyY2VcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMuZnMgLSBGcmFnbWVudCBzaGFkZXIgc291cmNlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBvcHRzLmlkPSAtIElkXG4gICAqL1xuICBjb25zdHJ1Y3RvcihnbCwgb3B0cywgZnMsIGlkKSB7XG4gICAgbGV0IHZzO1xuICAgIGlmICh0eXBlb2Ygb3B0cyA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbnNvbGUud2FybignREVQUkVDQVRFRDogTmV3IHVzZTogUHJvZ3JhbShnbCwge3ZzLCBmcywgaWR9KScpO1xuICAgICAgdnMgPSBvcHRzO1xuICAgIH0gZWxzZSB7XG4gICAgICB2cyA9IG9wdHMudnM7XG4gICAgICBmcyA9IG9wdHMuZnM7XG4gICAgICBpZCA9IG9wdHMuaWQ7XG4gICAgfVxuXG4gICAgdnMgPSB2cyB8fCBTaGFkZXJzLlZlcnRleC5EZWZhdWx0O1xuICAgIGZzID0gZnMgfHwgU2hhZGVycy5GcmFnbWVudC5EZWZhdWx0O1xuXG4gICAgY29uc3QgcHJvZ3JhbSA9IGdsLmNyZWF0ZVByb2dyYW0oKTtcbiAgICBpZiAoIXByb2dyYW0pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIGNyZWF0ZSBwcm9ncmFtJyk7XG4gICAgfVxuXG4gICAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIG5ldyBWZXJ0ZXhTaGFkZXIoZ2wsIHZzKS5oYW5kbGUpO1xuICAgIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBuZXcgRnJhZ21lbnRTaGFkZXIoZ2wsIGZzKS5oYW5kbGUpO1xuICAgIGdsLmxpbmtQcm9ncmFtKHByb2dyYW0pO1xuICAgIGNvbnN0IGxpbmtlZCA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIocHJvZ3JhbSwgZ2wuTElOS19TVEFUVVMpO1xuICAgIGlmICghbGlua2VkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIGxpbmtpbmcgJHtnbC5nZXRQcm9ncmFtSW5mb0xvZyhwcm9ncmFtKX1gKTtcbiAgICB9XG5cbiAgICB0aGlzLmdsID0gZ2w7XG4gICAgdGhpcy5pZCA9IGlkIHx8IHVpZCgpO1xuICAgIHRoaXMucHJvZ3JhbSA9IHByb2dyYW07XG4gICAgLy8gZGV0ZXJtaW5lIGF0dHJpYnV0ZSBsb2NhdGlvbnMgKGkuZS4gaW5kaWNlcylcbiAgICB0aGlzLmF0dHJpYnV0ZUxvY2F0aW9ucyA9IGdldEF0dHJpYnV0ZUxvY2F0aW9ucyhnbCwgcHJvZ3JhbSk7XG4gICAgLy8gcHJlcGFyZSB1bmlmb3JtIHNldHRlcnNcbiAgICB0aGlzLnVuaWZvcm1TZXR0ZXJzID0gZ2V0VW5pZm9ybVNldHRlcnMoZ2wsIHByb2dyYW0pO1xuICAgIC8vIG5vIGF0dHJpYnV0ZXMgZW5hYmxlZCB5ZXRcbiAgICB0aGlzLmF0dHJpYnV0ZUVuYWJsZWQgPSB7fTtcbiAgfVxuXG4gIHVzZSgpIHtcbiAgICB0aGlzLmdsLnVzZVByb2dyYW0odGhpcy5wcm9ncmFtKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFRleHR1cmUodGV4dHVyZSwgaW5kZXgpIHtcbiAgICB0ZXh0dXJlLmJpbmQoaW5kZXgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0VW5pZm9ybShuYW1lLCB2YWx1ZSkge1xuICAgIGlmIChuYW1lIGluIHRoaXMudW5pZm9ybVNldHRlcnMpIHtcbiAgICAgIHRoaXMudW5pZm9ybVNldHRlcnNbbmFtZV0odmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFVuaWZvcm1zKHVuaWZvcm1NYXApIHtcbiAgICBmb3IgKGNvbnN0IG5hbWUgb2YgT2JqZWN0LmtleXModW5pZm9ybU1hcCkpIHtcbiAgICAgIGlmIChuYW1lIGluIHRoaXMudW5pZm9ybVNldHRlcnMpIHtcbiAgICAgICAgdGhpcy51bmlmb3JtU2V0dGVyc1tuYW1lXSh1bmlmb3JtTWFwW25hbWVdKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRCdWZmZXIoYnVmZmVyKSB7XG4gICAgY29uc3QgbG9jYXRpb24gPSB0aGlzLmF0dHJpYnV0ZUxvY2F0aW9uc1tidWZmZXIuYXR0cmlidXRlXTtcbiAgICBidWZmZXIuYXR0YWNoVG9Mb2NhdGlvbihsb2NhdGlvbik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRCdWZmZXJzKGJ1ZmZlcnMpIHtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheShidWZmZXJzKSwgJ1Byb2dyYW0uc2V0QnVmZmVycyBleHBlY3RzIGFycmF5Jyk7XG4gICAgYnVmZmVycyA9IGJ1ZmZlcnMubGVuZ3RoID09PSAxICYmIEFycmF5LmlzQXJyYXkoYnVmZmVyc1swXSkgP1xuICAgICAgYnVmZmVyc1swXSA6IGJ1ZmZlcnM7XG4gICAgZm9yIChjb25zdCBidWZmZXIgb2YgYnVmZmVycykge1xuICAgICAgdGhpcy5zZXRCdWZmZXIoYnVmZmVyKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB1bnNldEJ1ZmZlcihidWZmZXIpIHtcbiAgICBjb25zdCBsb2NhdGlvbiA9IHRoaXMuYXR0cmlidXRlTG9jYXRpb25zW2J1ZmZlci5hdHRyaWJ1dGVdO1xuICAgIGJ1ZmZlci5kZXRhY2hGcm9tTG9jYXRpb24obG9jYXRpb24pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdW5zZXRCdWZmZXJzKGJ1ZmZlcnMpIHtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheShidWZmZXJzKSwgJ1Byb2dyYW0uc2V0QnVmZmVycyBleHBlY3RzIGFycmF5Jyk7XG4gICAgYnVmZmVycyA9IGJ1ZmZlcnMubGVuZ3RoID09PSAxICYmIEFycmF5LmlzQXJyYXkoYnVmZmVyc1swXSkgP1xuICAgICAgYnVmZmVyc1swXSA6IGJ1ZmZlcnM7XG4gICAgZm9yIChjb25zdCBidWZmZXIgb2YgYnVmZmVycykge1xuICAgICAgdGhpcy51bnNldEJ1ZmZlcihidWZmZXIpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG59XG5cbi8vIFRPRE8gLSB1c2UgdGFibGVzIHRvIHJlZHVjZSBjb21wbGV4aXR5IG9mIG1ldGhvZCBiZWxvd1xuLy8gY29uc3QgZ2xVbmlmb3JtU2V0dGVyID0ge1xuLy8gICBGTE9BVDoge2Z1bmN0aW9uOiAndW5pZm9ybTFmdicsIHR5cGU6IEZsb2F0MzJBcnJheX0sXG4vLyAgIEZMT0FUX1ZFQzM6IHtmdW5jdGlvbjogJ3VuaWZvcm0zZnYnLCB0eXBlOiBGbG9hdDMyQXJyYXl9LFxuLy8gICBGTE9BVF9NQVQ0OiB7ZnVuY3Rpb246ICd1bmlmb3JtTWF0cml4NGZ2JywgdHlwZTogRmxvYXQzMkFycmF5fSxcbi8vICAgSU5UOiB7ZnVuY3Rpb246ICd1bmlmb3JtMWl2JywgdHlwZTogVWludDE2QXJyYXl9LFxuLy8gICBCT09MOiB7ZnVuY3Rpb246ICd1bmlmb3JtMWl2JywgdHlwZTogVWludDE2QXJyYXl9LFxuLy8gICBTQU1QTEVSXzJEOiB7ZnVuY3Rpb246ICd1bmlmb3JtMWl2JywgdHlwZTogVWludDE2QXJyYXl9LFxuLy8gICBTQU1QTEVSX0NVQkU6IHtmdW5jdGlvbjogJ3VuaWZvcm0xaXYnLCB0eXBlOiBVaW50MTZBcnJheX1cbi8vIH07XG5cbi8vIFJldHVybnMgYSBNYWdpYyBVbmlmb3JtIFNldHRlclxuZnVuY3Rpb24gZ2V0VW5pZm9ybVNldHRlcihnbCwgZ2xQcm9ncmFtLCBpbmZvLCBpc0FycmF5KSB7XG4gIGNvbnN0IHtuYW1lLCB0eXBlfSA9IGluZm87XG4gIGNvbnN0IGxvYyA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihnbFByb2dyYW0sIG5hbWUpO1xuXG4gIGxldCBtYXRyaXggPSBmYWxzZTtcbiAgbGV0IHZlY3RvciA9IHRydWU7XG4gIGxldCBnbEZ1bmN0aW9uO1xuICBsZXQgVHlwZWRBcnJheTtcblxuICBpZiAoaW5mby5zaXplID4gMSAmJiBpc0FycmF5KSB7XG4gICAgc3dpdGNoICh0eXBlKSB7XG5cbiAgICBjYXNlIGdsLkZMT0FUOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0xZnY7XG4gICAgICBUeXBlZEFycmF5ID0gRmxvYXQzMkFycmF5O1xuICAgICAgdmVjdG9yID0gZmFsc2U7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgZ2wuRkxPQVRfVkVDMzpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtM2Z2O1xuICAgICAgVHlwZWRBcnJheSA9IEZsb2F0MzJBcnJheTtcbiAgICAgIHZlY3RvciA9IHRydWU7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgZ2wuRkxPQVRfTUFUNDpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtTWF0cml4NGZ2O1xuICAgICAgVHlwZWRBcnJheSA9IEZsb2F0MzJBcnJheTtcbiAgICAgIHZlY3RvciA9IHRydWU7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgZ2wuSU5UOlxuICAgIGNhc2UgZ2wuQk9PTDpcbiAgICBjYXNlIGdsLlNBTVBMRVJfMkQ6XG4gICAgY2FzZSBnbC5TQU1QTEVSX0NVQkU6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTFpdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBVaW50MTZBcnJheTtcbiAgICAgIHZlY3RvciA9IGZhbHNlO1xuICAgICAgYnJlYWs7XG5cbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmlmb3JtOiBVbmtub3duIEdMU0wgdHlwZSAnICsgdHlwZSk7XG5cbiAgICB9XG4gIH1cblxuICBpZiAodmVjdG9yKSB7XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgY2FzZSBnbC5GTE9BVDpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtMWY7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLkZMT0FUX1ZFQzI6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTJmdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBpc0FycmF5ID8gRmxvYXQzMkFycmF5IDogbmV3IEZsb2F0MzJBcnJheSgyKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuRkxPQVRfVkVDMzpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtM2Z2O1xuICAgICAgVHlwZWRBcnJheSA9IGlzQXJyYXkgPyBGbG9hdDMyQXJyYXkgOiBuZXcgRmxvYXQzMkFycmF5KDMpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5GTE9BVF9WRUM0OlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm00ZnY7XG4gICAgICBUeXBlZEFycmF5ID0gaXNBcnJheSA/IEZsb2F0MzJBcnJheSA6IG5ldyBGbG9hdDMyQXJyYXkoNCk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLklOVDogY2FzZSBnbC5CT09MOiBjYXNlIGdsLlNBTVBMRVJfMkQ6IGNhc2UgZ2wuU0FNUExFUl9DVUJFOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0xaTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuSU5UX1ZFQzI6IGNhc2UgZ2wuQk9PTF9WRUMyOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0yaXY7XG4gICAgICBUeXBlZEFycmF5ID0gaXNBcnJheSA/IFVpbnQxNkFycmF5IDogbmV3IFVpbnQxNkFycmF5KDIpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5JTlRfVkVDMzogY2FzZSBnbC5CT09MX1ZFQzM6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTNpdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBpc0FycmF5ID8gVWludDE2QXJyYXkgOiBuZXcgVWludDE2QXJyYXkoMyk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLklOVF9WRUM0OiBjYXNlIGdsLkJPT0xfVkVDNDpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtNGl2O1xuICAgICAgVHlwZWRBcnJheSA9IGlzQXJyYXkgPyBVaW50MTZBcnJheSA6IG5ldyBVaW50MTZBcnJheSg0KTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuRkxPQVRfTUFUMjpcbiAgICAgIG1hdHJpeCA9IHRydWU7XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybU1hdHJpeDJmdjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuRkxPQVRfTUFUMzpcbiAgICAgIG1hdHJpeCA9IHRydWU7XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybU1hdHJpeDNmdjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuRkxPQVRfTUFUNDpcbiAgICAgIG1hdHJpeCA9IHRydWU7XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybU1hdHJpeDRmdjtcbiAgICAgIGJyZWFrO1xuICAgIGRlZmF1bHQ6XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBnbEZ1bmN0aW9uID0gZ2xGdW5jdGlvbi5iaW5kKGdsKTtcblxuICAvLyBTZXQgYSB1bmlmb3JtIGFycmF5XG4gIGlmIChpc0FycmF5ICYmIFR5cGVkQXJyYXkpIHtcblxuICAgIHJldHVybiB2YWwgPT4ge1xuICAgICAgZ2xGdW5jdGlvbihsb2MsIG5ldyBUeXBlZEFycmF5KHZhbCkpO1xuICAgICAgZ2xDaGVja0Vycm9yMihnbCk7XG4gICAgfTtcbiAgfSBlbHNlIGlmIChtYXRyaXgpIHtcbiAgICAvLyBTZXQgYSBtYXRyaXggdW5pZm9ybVxuICAgIHJldHVybiB2YWwgPT4ge1xuICAgICAgZ2xGdW5jdGlvbihsb2MsIGZhbHNlLCB2YWwudG9GbG9hdDMyQXJyYXkoKSk7XG4gICAgICBnbENoZWNrRXJyb3IyKGdsKTtcbiAgICB9O1xuXG4gIH0gZWxzZSBpZiAoVHlwZWRBcnJheSkge1xuXG4gICAgLy8gU2V0IGEgdmVjdG9yL3R5cGVkIGFycmF5IHVuaWZvcm1cbiAgICByZXR1cm4gdmFsID0+IHtcbiAgICAgIFR5cGVkQXJyYXkuc2V0KHZhbC50b0Zsb2F0MzJBcnJheSA/IHZhbC50b0Zsb2F0MzJBcnJheSgpIDogdmFsKTtcbiAgICAgIGdsRnVuY3Rpb24obG9jLCBUeXBlZEFycmF5KTtcbiAgICAgIGdsQ2hlY2tFcnJvcjIoZ2wpO1xuICAgIH07XG5cbiAgfVxuICAvLyBTZXQgYSBwcmltaXRpdmUtdmFsdWVkIHVuaWZvcm1cbiAgcmV0dXJuIHZhbCA9PiB7XG4gICAgZ2xGdW5jdGlvbihsb2MsIHZhbCk7XG4gICAgZ2xDaGVja0Vycm9yMihnbCk7XG4gIH07XG5cbn1cblxuLy8gY3JlYXRlIHVuaWZvcm0gc2V0dGVyc1xuLy8gTWFwIG9mIHVuaWZvcm0gbmFtZXMgdG8gc2V0dGVyIGZ1bmN0aW9uc1xuZnVuY3Rpb24gZ2V0VW5pZm9ybVNldHRlcnMoZ2wsIGdsUHJvZ3JhbSkge1xuICBjb25zdCB1bmlmb3JtU2V0dGVycyA9IHt9O1xuICBjb25zdCBsZW5ndGggPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKGdsUHJvZ3JhbSwgZ2wuQUNUSVZFX1VOSUZPUk1TKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGluZm8gPSBnbC5nZXRBY3RpdmVVbmlmb3JtKGdsUHJvZ3JhbSwgaSk7XG4gICAgbGV0IG5hbWUgPSBpbmZvLm5hbWU7XG4gICAgLy8gaWYgYXJyYXkgbmFtZSB0aGVuIGNsZWFuIHRoZSBhcnJheSBicmFja2V0c1xuICAgIG5hbWUgPSBuYW1lW25hbWUubGVuZ3RoIC0gMV0gPT09ICddJyA/XG4gICAgICBuYW1lLnN1YnN0cigwLCBuYW1lLmxlbmd0aCAtIDMpIDogbmFtZTtcbiAgICB1bmlmb3JtU2V0dGVyc1tuYW1lXSA9XG4gICAgICBnZXRVbmlmb3JtU2V0dGVyKGdsLCBnbFByb2dyYW0sIGluZm8sIGluZm8ubmFtZSAhPT0gbmFtZSk7XG4gIH1cbiAgcmV0dXJuIHVuaWZvcm1TZXR0ZXJzO1xufVxuXG4vLyBkZXRlcm1pbmUgYXR0cmlidXRlIGxvY2F0aW9ucyAobWFwcyBhdHRyaWJ1dGUgbmFtZSB0byBpbmRleClcbmZ1bmN0aW9uIGdldEF0dHJpYnV0ZUxvY2F0aW9ucyhnbCwgZ2xQcm9ncmFtKSB7XG4gIGNvbnN0IGxlbmd0aCA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIoZ2xQcm9ncmFtLCBnbC5BQ1RJVkVfQVRUUklCVVRFUyk7XG4gIGNvbnN0IGF0dHJpYnV0ZUxvY2F0aW9ucyA9IHt9O1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgaW5mbyA9IGdsLmdldEFjdGl2ZUF0dHJpYihnbFByb2dyYW0sIGkpO1xuICAgIGNvbnN0IGluZGV4ID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24oZ2xQcm9ncmFtLCBpbmZvLm5hbWUpO1xuICAgIGF0dHJpYnV0ZUxvY2F0aW9uc1tpbmZvLm5hbWVdID0gaW5kZXg7XG4gIH1cbiAgcmV0dXJuIGF0dHJpYnV0ZUxvY2F0aW9ucztcbn1cbiJdfQ==