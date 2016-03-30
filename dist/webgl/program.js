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

    (0, _assert2.default)(gl, 'Program needs WebGLRenderingContext');

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
      (0, _context.glCheckError)(gl);
    };
  } else if (matrix) {
    // Set a matrix uniform
    return function (val) {
      glFunction(loc, false, val.toFloat32Array());
      (0, _context.glCheckError)(gl);
    };
  } else if (TypedArray) {

    // Set a vector/typed array uniform
    return function (val) {
      TypedArray.set(val.toFloat32Array ? val.toFloat32Array() : val);
      glFunction(loc, TypedArray);
      (0, _context.glCheckError)(gl);
    };
  }
  // Set a primitive-valued uniform
  return function (val) {
    glFunction(loc, val);
    (0, _context.glCheckError)(gl);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9wcm9ncmFtLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBWXFCOzs7Ozs7Ozs7Ozs7OztBQWFuQixXQWJtQixPQWFuQixDQUFZLEVBQVosRUFBZ0IsSUFBaEIsRUFBc0IsRUFBdEIsRUFBMEIsRUFBMUIsRUFBOEI7MEJBYlgsU0FhVzs7QUFDNUIsMEJBQU8sRUFBUCxFQUFXLHFDQUFYLEVBRDRCOztBQUc1QixRQUFJLGNBQUosQ0FINEI7QUFJNUIsUUFBSSxPQUFPLElBQVAsS0FBZ0IsUUFBaEIsRUFBMEI7QUFDNUIsY0FBUSxJQUFSLENBQWEsZ0RBQWIsRUFENEI7QUFFNUIsV0FBSyxJQUFMLENBRjRCO0tBQTlCLE1BR087QUFDTCxXQUFLLEtBQUssRUFBTCxDQURBO0FBRUwsV0FBSyxLQUFLLEVBQUwsQ0FGQTtBQUdMLFdBQUssS0FBSyxFQUFMLENBSEE7S0FIUDs7QUFTQSxTQUFLLE1BQU0sa0JBQVEsTUFBUixDQUFlLE9BQWYsQ0FiaUI7QUFjNUIsU0FBSyxNQUFNLGtCQUFRLFFBQVIsQ0FBaUIsT0FBakIsQ0FkaUI7O0FBZ0I1QixRQUFNLFVBQVUsR0FBRyxhQUFILEVBQVYsQ0FoQnNCO0FBaUI1QixRQUFJLENBQUMsT0FBRCxFQUFVO0FBQ1osWUFBTSxJQUFJLEtBQUosQ0FBVSwwQkFBVixDQUFOLENBRFk7S0FBZDs7QUFJQSxPQUFHLFlBQUgsQ0FBZ0IsT0FBaEIsRUFBeUIseUJBQWlCLEVBQWpCLEVBQXFCLEVBQXJCLEVBQXlCLE1BQXpCLENBQXpCLENBckI0QjtBQXNCNUIsT0FBRyxZQUFILENBQWdCLE9BQWhCLEVBQXlCLDJCQUFtQixFQUFuQixFQUF1QixFQUF2QixFQUEyQixNQUEzQixDQUF6QixDQXRCNEI7QUF1QjVCLE9BQUcsV0FBSCxDQUFlLE9BQWYsRUF2QjRCO0FBd0I1QixRQUFNLFNBQVMsR0FBRyxtQkFBSCxDQUF1QixPQUF2QixFQUFn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QUFRLEdBQUcsaUJBQUgsQ0FBcUIsU0FBckIsRUFBZ0MsS0FBSyxJQUFMLENBQXhDLENBRnlCO0FBRy9CLHVCQUFtQixLQUFLLElBQUwsQ0FBbkIsR0FBZ0MsS0FBaEMsQ0FIK0I7R0FBakM7QUFLQSxTQUFPLGtCQUFQLENBUjRDO0NBQTlDIiwiZmlsZSI6InByb2dyYW0uanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDcmVhdGVzIHByb2dyYW1zIG91dCBvZiBzaGFkZXJzIGFuZCBwcm92aWRlcyBjb252ZW5pZW50IG1ldGhvZHMgZm9yIGxvYWRpbmdcbi8vIGJ1ZmZlcnMgYXR0cmlidXRlcyBhbmQgdW5pZm9ybXNcblxuLyogZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSwgY29tcGxleGl0eSAqL1xuXG4vKiBnbG9iYWwgY29uc29sZSAqL1xuaW1wb3J0IHtnbENoZWNrRXJyb3J9IGZyb20gJy4vY29udGV4dCc7XG5pbXBvcnQge3VpZH0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IHtWZXJ0ZXhTaGFkZXIsIEZyYWdtZW50U2hhZGVyfSBmcm9tICcuL3NoYWRlcic7XG5pbXBvcnQgU2hhZGVycyBmcm9tICcuLi9zaGFkZXJzJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUHJvZ3JhbSB7XG5cbiAgLypcbiAgICogQGNsYXNzZGVzY1xuICAgKiBIYW5kbGVzIGNyZWF0aW9uIG9mIHByb2dyYW1zLCBtYXBwaW5nIG9mIGF0dHJpYnV0ZXMgYW5kIHVuaWZvcm1zXG4gICAqXG4gICAqIEBjbGFzc1xuICAgKiBAcGFyYW0ge1dlYkdMUmVuZGVyaW5nQ29udGV4dH0gZ2wgLSBnbCBjb250ZXh0XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIC0gb3B0aW9uc1xuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0cy52cyAtIFZlcnRleCBzaGFkZXIgc291cmNlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBvcHRzLmZzIC0gRnJhZ21lbnQgc2hhZGVyIHNvdXJjZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0cy5pZD0gLSBJZFxuICAgKi9cbiAgY29uc3RydWN0b3IoZ2wsIG9wdHMsIGZzLCBpZCkge1xuICAgIGFzc2VydChnbCwgJ1Byb2dyYW0gbmVlZHMgV2ViR0xSZW5kZXJpbmdDb250ZXh0Jyk7XG5cbiAgICBsZXQgdnM7XG4gICAgaWYgKHR5cGVvZiBvcHRzID09PSAnc3RyaW5nJykge1xuICAgICAgY29uc29sZS53YXJuKCdERVBSRUNBVEVEOiBOZXcgdXNlOiBQcm9ncmFtKGdsLCB7dnMsIGZzLCBpZH0pJyk7XG4gICAgICB2cyA9IG9wdHM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZzID0gb3B0cy52cztcbiAgICAgIGZzID0gb3B0cy5mcztcbiAgICAgIGlkID0gb3B0cy5pZDtcbiAgICB9XG5cbiAgICB2cyA9IHZzIHx8IFNoYWRlcnMuVmVydGV4LkRlZmF1bHQ7XG4gICAgZnMgPSBmcyB8fCBTaGFkZXJzLkZyYWdtZW50LkRlZmF1bHQ7XG5cbiAgICBjb25zdCBwcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSgpO1xuICAgIGlmICghcHJvZ3JhbSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdGYWlsZWQgdG8gY3JlYXRlIHByb2dyYW0nKTtcbiAgICB9XG5cbiAgICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgbmV3IFZlcnRleFNoYWRlcihnbCwgdnMpLmhhbmRsZSk7XG4gICAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIG5ldyBGcmFnbWVudFNoYWRlcihnbCwgZnMpLmhhbmRsZSk7XG4gICAgZ2wubGlua1Byb2dyYW0ocHJvZ3JhbSk7XG4gICAgY29uc3QgbGlua2VkID0gZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihwcm9ncmFtLCBnbC5MSU5LX1NUQVRVUyk7XG4gICAgaWYgKCFsaW5rZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRXJyb3IgbGlua2luZyAke2dsLmdldFByb2dyYW1JbmZvTG9nKHByb2dyYW0pfWApO1xuICAgIH1cblxuICAgIHRoaXMuZ2wgPSBnbDtcbiAgICB0aGlzLmlkID0gaWQgfHwgdWlkKCk7XG4gICAgdGhpcy5wcm9ncmFtID0gcHJvZ3JhbTtcbiAgICAvLyBkZXRlcm1pbmUgYXR0cmlidXRlIGxvY2F0aW9ucyAoaS5lLiBpbmRpY2VzKVxuICAgIHRoaXMuYXR0cmlidXRlTG9jYXRpb25zID0gZ2V0QXR0cmlidXRlTG9jYXRpb25zKGdsLCBwcm9ncmFtKTtcbiAgICAvLyBwcmVwYXJlIHVuaWZvcm0gc2V0dGVyc1xuICAgIHRoaXMudW5pZm9ybVNldHRlcnMgPSBnZXRVbmlmb3JtU2V0dGVycyhnbCwgcHJvZ3JhbSk7XG4gICAgLy8gbm8gYXR0cmlidXRlcyBlbmFibGVkIHlldFxuICAgIHRoaXMuYXR0cmlidXRlRW5hYmxlZCA9IHt9O1xuICB9XG5cbiAgdXNlKCkge1xuICAgIHRoaXMuZ2wudXNlUHJvZ3JhbSh0aGlzLnByb2dyYW0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0VGV4dHVyZSh0ZXh0dXJlLCBpbmRleCkge1xuICAgIHRleHR1cmUuYmluZChpbmRleCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRVbmlmb3JtKG5hbWUsIHZhbHVlKSB7XG4gICAgaWYgKG5hbWUgaW4gdGhpcy51bmlmb3JtU2V0dGVycykge1xuICAgICAgdGhpcy51bmlmb3JtU2V0dGVyc1tuYW1lXSh2YWx1ZSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0VW5pZm9ybXModW5pZm9ybU1hcCkge1xuICAgIGZvciAoY29uc3QgbmFtZSBvZiBPYmplY3Qua2V5cyh1bmlmb3JtTWFwKSkge1xuICAgICAgaWYgKG5hbWUgaW4gdGhpcy51bmlmb3JtU2V0dGVycykge1xuICAgICAgICB0aGlzLnVuaWZvcm1TZXR0ZXJzW25hbWVdKHVuaWZvcm1NYXBbbmFtZV0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldEJ1ZmZlcihidWZmZXIpIHtcbiAgICBjb25zdCBsb2NhdGlvbiA9IHRoaXMuYXR0cmlidXRlTG9jYXRpb25zW2J1ZmZlci5hdHRyaWJ1dGVdO1xuICAgIGJ1ZmZlci5hdHRhY2hUb0xvY2F0aW9uKGxvY2F0aW9uKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldEJ1ZmZlcnMoYnVmZmVycykge1xuICAgIGFzc2VydChBcnJheS5pc0FycmF5KGJ1ZmZlcnMpLCAnUHJvZ3JhbS5zZXRCdWZmZXJzIGV4cGVjdHMgYXJyYXknKTtcbiAgICBidWZmZXJzID0gYnVmZmVycy5sZW5ndGggPT09IDEgJiYgQXJyYXkuaXNBcnJheShidWZmZXJzWzBdKSA/XG4gICAgICBidWZmZXJzWzBdIDogYnVmZmVycztcbiAgICBmb3IgKGNvbnN0IGJ1ZmZlciBvZiBidWZmZXJzKSB7XG4gICAgICB0aGlzLnNldEJ1ZmZlcihidWZmZXIpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHVuc2V0QnVmZmVyKGJ1ZmZlcikge1xuICAgIGNvbnN0IGxvY2F0aW9uID0gdGhpcy5hdHRyaWJ1dGVMb2NhdGlvbnNbYnVmZmVyLmF0dHJpYnV0ZV07XG4gICAgYnVmZmVyLmRldGFjaEZyb21Mb2NhdGlvbihsb2NhdGlvbik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB1bnNldEJ1ZmZlcnMoYnVmZmVycykge1xuICAgIGFzc2VydChBcnJheS5pc0FycmF5KGJ1ZmZlcnMpLCAnUHJvZ3JhbS5zZXRCdWZmZXJzIGV4cGVjdHMgYXJyYXknKTtcbiAgICBidWZmZXJzID0gYnVmZmVycy5sZW5ndGggPT09IDEgJiYgQXJyYXkuaXNBcnJheShidWZmZXJzWzBdKSA/XG4gICAgICBidWZmZXJzWzBdIDogYnVmZmVycztcbiAgICBmb3IgKGNvbnN0IGJ1ZmZlciBvZiBidWZmZXJzKSB7XG4gICAgICB0aGlzLnVuc2V0QnVmZmVyKGJ1ZmZlcik7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbn1cblxuLy8gVE9ETyAtIHVzZSB0YWJsZXMgdG8gcmVkdWNlIGNvbXBsZXhpdHkgb2YgbWV0aG9kIGJlbG93XG4vLyBjb25zdCBnbFVuaWZvcm1TZXR0ZXIgPSB7XG4vLyAgIEZMT0FUOiB7ZnVuY3Rpb246ICd1bmlmb3JtMWZ2JywgdHlwZTogRmxvYXQzMkFycmF5fSxcbi8vICAgRkxPQVRfVkVDMzoge2Z1bmN0aW9uOiAndW5pZm9ybTNmdicsIHR5cGU6IEZsb2F0MzJBcnJheX0sXG4vLyAgIEZMT0FUX01BVDQ6IHtmdW5jdGlvbjogJ3VuaWZvcm1NYXRyaXg0ZnYnLCB0eXBlOiBGbG9hdDMyQXJyYXl9LFxuLy8gICBJTlQ6IHtmdW5jdGlvbjogJ3VuaWZvcm0xaXYnLCB0eXBlOiBVaW50MTZBcnJheX0sXG4vLyAgIEJPT0w6IHtmdW5jdGlvbjogJ3VuaWZvcm0xaXYnLCB0eXBlOiBVaW50MTZBcnJheX0sXG4vLyAgIFNBTVBMRVJfMkQ6IHtmdW5jdGlvbjogJ3VuaWZvcm0xaXYnLCB0eXBlOiBVaW50MTZBcnJheX0sXG4vLyAgIFNBTVBMRVJfQ1VCRToge2Z1bmN0aW9uOiAndW5pZm9ybTFpdicsIHR5cGU6IFVpbnQxNkFycmF5fVxuLy8gfTtcblxuLy8gUmV0dXJucyBhIE1hZ2ljIFVuaWZvcm0gU2V0dGVyXG5mdW5jdGlvbiBnZXRVbmlmb3JtU2V0dGVyKGdsLCBnbFByb2dyYW0sIGluZm8sIGlzQXJyYXkpIHtcbiAgY29uc3Qge25hbWUsIHR5cGV9ID0gaW5mbztcbiAgY29uc3QgbG9jID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKGdsUHJvZ3JhbSwgbmFtZSk7XG5cbiAgbGV0IG1hdHJpeCA9IGZhbHNlO1xuICBsZXQgdmVjdG9yID0gdHJ1ZTtcbiAgbGV0IGdsRnVuY3Rpb247XG4gIGxldCBUeXBlZEFycmF5O1xuXG4gIGlmIChpbmZvLnNpemUgPiAxICYmIGlzQXJyYXkpIHtcbiAgICBzd2l0Y2ggKHR5cGUpIHtcblxuICAgIGNhc2UgZ2wuRkxPQVQ6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTFmdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBGbG9hdDMyQXJyYXk7XG4gICAgICB2ZWN0b3IgPSBmYWxzZTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBnbC5GTE9BVF9WRUMzOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0zZnY7XG4gICAgICBUeXBlZEFycmF5ID0gRmxvYXQzMkFycmF5O1xuICAgICAgdmVjdG9yID0gdHJ1ZTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBnbC5GTE9BVF9NQVQ0OlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm1NYXRyaXg0ZnY7XG4gICAgICBUeXBlZEFycmF5ID0gRmxvYXQzMkFycmF5O1xuICAgICAgdmVjdG9yID0gdHJ1ZTtcbiAgICAgIGJyZWFrO1xuXG4gICAgY2FzZSBnbC5JTlQ6XG4gICAgY2FzZSBnbC5CT09MOlxuICAgIGNhc2UgZ2wuU0FNUExFUl8yRDpcbiAgICBjYXNlIGdsLlNBTVBMRVJfQ1VCRTpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtMWl2O1xuICAgICAgVHlwZWRBcnJheSA9IFVpbnQxNkFycmF5O1xuICAgICAgdmVjdG9yID0gZmFsc2U7XG4gICAgICBicmVhaztcblxuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuaWZvcm06IFVua25vd24gR0xTTCB0eXBlICcgKyB0eXBlKTtcblxuICAgIH1cbiAgfVxuXG4gIGlmICh2ZWN0b3IpIHtcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICBjYXNlIGdsLkZMT0FUOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0xZjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuRkxPQVRfVkVDMjpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtMmZ2O1xuICAgICAgVHlwZWRBcnJheSA9IGlzQXJyYXkgPyBGbG9hdDMyQXJyYXkgOiBuZXcgRmxvYXQzMkFycmF5KDIpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5GTE9BVF9WRUMzOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0zZnY7XG4gICAgICBUeXBlZEFycmF5ID0gaXNBcnJheSA/IEZsb2F0MzJBcnJheSA6IG5ldyBGbG9hdDMyQXJyYXkoMyk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLkZMT0FUX1ZFQzQ6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTRmdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBpc0FycmF5ID8gRmxvYXQzMkFycmF5IDogbmV3IEZsb2F0MzJBcnJheSg0KTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuSU5UOiBjYXNlIGdsLkJPT0w6IGNhc2UgZ2wuU0FNUExFUl8yRDogY2FzZSBnbC5TQU1QTEVSX0NVQkU6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTFpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5JTlRfVkVDMjogY2FzZSBnbC5CT09MX1ZFQzI6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTJpdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBpc0FycmF5ID8gVWludDE2QXJyYXkgOiBuZXcgVWludDE2QXJyYXkoMik7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLklOVF9WRUMzOiBjYXNlIGdsLkJPT0xfVkVDMzpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtM2l2O1xuICAgICAgVHlwZWRBcnJheSA9IGlzQXJyYXkgPyBVaW50MTZBcnJheSA6IG5ldyBVaW50MTZBcnJheSgzKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuSU5UX1ZFQzQ6IGNhc2UgZ2wuQk9PTF9WRUM0OlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm00aXY7XG4gICAgICBUeXBlZEFycmF5ID0gaXNBcnJheSA/IFVpbnQxNkFycmF5IDogbmV3IFVpbnQxNkFycmF5KDQpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5GTE9BVF9NQVQyOlxuICAgICAgbWF0cml4ID0gdHJ1ZTtcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtTWF0cml4MmZ2O1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5GTE9BVF9NQVQzOlxuICAgICAgbWF0cml4ID0gdHJ1ZTtcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtTWF0cml4M2Z2O1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5GTE9BVF9NQVQ0OlxuICAgICAgbWF0cml4ID0gdHJ1ZTtcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtTWF0cml4NGZ2O1xuICAgICAgYnJlYWs7XG4gICAgZGVmYXVsdDpcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGdsRnVuY3Rpb24gPSBnbEZ1bmN0aW9uLmJpbmQoZ2wpO1xuXG4gIC8vIFNldCBhIHVuaWZvcm0gYXJyYXlcbiAgaWYgKGlzQXJyYXkgJiYgVHlwZWRBcnJheSkge1xuXG4gICAgcmV0dXJuIHZhbCA9PiB7XG4gICAgICBnbEZ1bmN0aW9uKGxvYywgbmV3IFR5cGVkQXJyYXkodmFsKSk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH07XG4gIH0gZWxzZSBpZiAobWF0cml4KSB7XG4gICAgLy8gU2V0IGEgbWF0cml4IHVuaWZvcm1cbiAgICByZXR1cm4gdmFsID0+IHtcbiAgICAgIGdsRnVuY3Rpb24obG9jLCBmYWxzZSwgdmFsLnRvRmxvYXQzMkFycmF5KCkpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9O1xuXG4gIH0gZWxzZSBpZiAoVHlwZWRBcnJheSkge1xuXG4gICAgLy8gU2V0IGEgdmVjdG9yL3R5cGVkIGFycmF5IHVuaWZvcm1cbiAgICByZXR1cm4gdmFsID0+IHtcbiAgICAgIFR5cGVkQXJyYXkuc2V0KHZhbC50b0Zsb2F0MzJBcnJheSA/IHZhbC50b0Zsb2F0MzJBcnJheSgpIDogdmFsKTtcbiAgICAgIGdsRnVuY3Rpb24obG9jLCBUeXBlZEFycmF5KTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfTtcblxuICB9XG4gIC8vIFNldCBhIHByaW1pdGl2ZS12YWx1ZWQgdW5pZm9ybVxuICByZXR1cm4gdmFsID0+IHtcbiAgICBnbEZ1bmN0aW9uKGxvYywgdmFsKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICB9O1xuXG59XG5cbi8vIGNyZWF0ZSB1bmlmb3JtIHNldHRlcnNcbi8vIE1hcCBvZiB1bmlmb3JtIG5hbWVzIHRvIHNldHRlciBmdW5jdGlvbnNcbmZ1bmN0aW9uIGdldFVuaWZvcm1TZXR0ZXJzKGdsLCBnbFByb2dyYW0pIHtcbiAgY29uc3QgdW5pZm9ybVNldHRlcnMgPSB7fTtcbiAgY29uc3QgbGVuZ3RoID0gZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihnbFByb2dyYW0sIGdsLkFDVElWRV9VTklGT1JNUyk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBpbmZvID0gZ2wuZ2V0QWN0aXZlVW5pZm9ybShnbFByb2dyYW0sIGkpO1xuICAgIGxldCBuYW1lID0gaW5mby5uYW1lO1xuICAgIC8vIGlmIGFycmF5IG5hbWUgdGhlbiBjbGVhbiB0aGUgYXJyYXkgYnJhY2tldHNcbiAgICBuYW1lID0gbmFtZVtuYW1lLmxlbmd0aCAtIDFdID09PSAnXScgP1xuICAgICAgbmFtZS5zdWJzdHIoMCwgbmFtZS5sZW5ndGggLSAzKSA6IG5hbWU7XG4gICAgdW5pZm9ybVNldHRlcnNbbmFtZV0gPVxuICAgICAgZ2V0VW5pZm9ybVNldHRlcihnbCwgZ2xQcm9ncmFtLCBpbmZvLCBpbmZvLm5hbWUgIT09IG5hbWUpO1xuICB9XG4gIHJldHVybiB1bmlmb3JtU2V0dGVycztcbn1cblxuLy8gZGV0ZXJtaW5lIGF0dHJpYnV0ZSBsb2NhdGlvbnMgKG1hcHMgYXR0cmlidXRlIG5hbWUgdG8gaW5kZXgpXG5mdW5jdGlvbiBnZXRBdHRyaWJ1dGVMb2NhdGlvbnMoZ2wsIGdsUHJvZ3JhbSkge1xuICBjb25zdCBsZW5ndGggPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKGdsUHJvZ3JhbSwgZ2wuQUNUSVZFX0FUVFJJQlVURVMpO1xuICBjb25zdCBhdHRyaWJ1dGVMb2NhdGlvbnMgPSB7fTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGluZm8gPSBnbC5nZXRBY3RpdmVBdHRyaWIoZ2xQcm9ncmFtLCBpKTtcbiAgICBjb25zdCBpbmRleCA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKGdsUHJvZ3JhbSwgaW5mby5uYW1lKTtcbiAgICBhdHRyaWJ1dGVMb2NhdGlvbnNbaW5mby5uYW1lXSA9IGluZGV4O1xuICB9XG4gIHJldHVybiBhdHRyaWJ1dGVMb2NhdGlvbnM7XG59XG4iXX0=