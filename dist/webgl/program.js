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

    var vs = void 0;
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
  var glFunction = void 0;
  var TypedArray = void 0;

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9wcm9ncmFtLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBTUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7SUFFcUI7Ozs7Ozs7Ozs7Ozs7O0FBYW5CLFdBYm1CLE9BYW5CLENBQVksRUFBWixFQUFnQixJQUFoQixFQUFzQixFQUF0QixFQUEwQixFQUExQixFQUE4QjswQkFiWCxTQWFXOztBQUM1QiwwQkFBTyxFQUFQLEVBQVcscUNBQVgsRUFENEI7O0FBRzVCLFFBQUksV0FBSixDQUg0QjtBQUk1QixRQUFJLE9BQU8sSUFBUCxLQUFnQixRQUFoQixFQUEwQjtBQUM1QixjQUFRLElBQVIsQ0FBYSxnREFBYixFQUQ0QjtBQUU1QixXQUFLLElBQUwsQ0FGNEI7S0FBOUIsTUFHTztBQUNMLFdBQUssS0FBSyxFQUFMLENBREE7QUFFTCxXQUFLLEtBQUssRUFBTCxDQUZBO0FBR0wsV0FBSyxLQUFLLEVBQUwsQ0FIQTtLQUhQOztBQVNBLFNBQUssTUFBTSxrQkFBUSxNQUFSLENBQWUsT0FBZixDQWJpQjtBQWM1QixTQUFLLE1BQU0sa0JBQVEsUUFBUixDQUFpQixPQUFqQixDQWRpQjs7QUFnQjVCLFFBQU0sVUFBVSxHQUFHLGFBQUgsRUFBVixDQWhCc0I7QUFpQjVCLFFBQUksQ0FBQyxPQUFELEVBQVU7QUFDWixZQUFNLElBQUksS0FBSixDQUFVLDBCQUFWLENBQU4sQ0FEWTtLQUFkOztBQUlBLE9BQUcsWUFBSCxDQUFnQixPQUFoQixFQUF5Qix5QkFBaUIsRUFBakIsRUFBcUIsRUFBckIsRUFBeUIsTUFBekIsQ0FBekIsQ0FyQjRCO0FBc0I1QixPQUFHLFlBQUgsQ0FBZ0IsT0FBaEIsRUFBeUIsMkJBQW1CLEVBQW5CLEVBQXVCLEVBQXZCLEVBQTJCLE1BQTNCLENBQXpCLENBdEI0QjtBQXVCNUIsT0FBRyxXQUFILENBQWUsT0FBZixFQXZCNEI7QUF3QjVCLFFBQU0sU0FBUyxHQUFHLG1C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UCxDQUR5QjtBQUUvQixRQUFNLFFBQVEsR0FBRyxpQkFBSCxDQUFxQixTQUFyQixFQUFnQyxLQUFLLElBQUwsQ0FBeEMsQ0FGeUI7QUFHL0IsdUJBQW1CLEtBQUssSUFBTCxDQUFuQixHQUFnQyxLQUFoQyxDQUgrQjtHQUFqQztBQUtBLFNBQU8sa0JBQVAsQ0FSNEM7Q0FBOUMiLCJmaWxlIjoicHJvZ3JhbS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIENyZWF0ZXMgcHJvZ3JhbXMgb3V0IG9mIHNoYWRlcnMgYW5kIHByb3ZpZGVzIGNvbnZlbmllbnQgbWV0aG9kcyBmb3IgbG9hZGluZ1xuLy8gYnVmZmVycyBhdHRyaWJ1dGVzIGFuZCB1bmlmb3Jtc1xuXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1jb25zb2xlLCBjb21wbGV4aXR5ICovXG5cbi8qIGdsb2JhbCBjb25zb2xlICovXG5pbXBvcnQge2dsQ2hlY2tFcnJvcn0gZnJvbSAnLi9jb250ZXh0JztcbmltcG9ydCB7dWlkfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQge1ZlcnRleFNoYWRlciwgRnJhZ21lbnRTaGFkZXJ9IGZyb20gJy4vc2hhZGVyJztcbmltcG9ydCBTaGFkZXJzIGZyb20gJy4uL3NoYWRlcnMnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQcm9ncmFtIHtcblxuICAvKlxuICAgKiBAY2xhc3NkZXNjXG4gICAqIEhhbmRsZXMgY3JlYXRpb24gb2YgcHJvZ3JhbXMsIG1hcHBpbmcgb2YgYXR0cmlidXRlcyBhbmQgdW5pZm9ybXNcbiAgICpcbiAgICogQGNsYXNzXG4gICAqIEBwYXJhbSB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fSBnbCAtIGdsIGNvbnRleHRcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMgLSBvcHRpb25zXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBvcHRzLnZzIC0gVmVydGV4IHNoYWRlciBzb3VyY2VcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMuZnMgLSBGcmFnbWVudCBzaGFkZXIgc291cmNlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBvcHRzLmlkPSAtIElkXG4gICAqL1xuICBjb25zdHJ1Y3RvcihnbCwgb3B0cywgZnMsIGlkKSB7XG4gICAgYXNzZXJ0KGdsLCAnUHJvZ3JhbSBuZWVkcyBXZWJHTFJlbmRlcmluZ0NvbnRleHQnKTtcblxuICAgIGxldCB2cztcbiAgICBpZiAodHlwZW9mIG9wdHMgPT09ICdzdHJpbmcnKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ0RFUFJFQ0FURUQ6IE5ldyB1c2U6IFByb2dyYW0oZ2wsIHt2cywgZnMsIGlkfSknKTtcbiAgICAgIHZzID0gb3B0cztcbiAgICB9IGVsc2Uge1xuICAgICAgdnMgPSBvcHRzLnZzO1xuICAgICAgZnMgPSBvcHRzLmZzO1xuICAgICAgaWQgPSBvcHRzLmlkO1xuICAgIH1cblxuICAgIHZzID0gdnMgfHwgU2hhZGVycy5WZXJ0ZXguRGVmYXVsdDtcbiAgICBmcyA9IGZzIHx8IFNoYWRlcnMuRnJhZ21lbnQuRGVmYXVsdDtcblxuICAgIGNvbnN0IHByb2dyYW0gPSBnbC5jcmVhdGVQcm9ncmFtKCk7XG4gICAgaWYgKCFwcm9ncmFtKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBjcmVhdGUgcHJvZ3JhbScpO1xuICAgIH1cblxuICAgIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBuZXcgVmVydGV4U2hhZGVyKGdsLCB2cykuaGFuZGxlKTtcbiAgICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgbmV3IEZyYWdtZW50U2hhZGVyKGdsLCBmcykuaGFuZGxlKTtcbiAgICBnbC5saW5rUHJvZ3JhbShwcm9ncmFtKTtcbiAgICBjb25zdCBsaW5rZWQgPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHByb2dyYW0sIGdsLkxJTktfU1RBVFVTKTtcbiAgICBpZiAoIWxpbmtlZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvciBsaW5raW5nICR7Z2wuZ2V0UHJvZ3JhbUluZm9Mb2cocHJvZ3JhbSl9YCk7XG4gICAgfVxuXG4gICAgdGhpcy5nbCA9IGdsO1xuICAgIHRoaXMuaWQgPSBpZCB8fCB1aWQoKTtcbiAgICB0aGlzLnByb2dyYW0gPSBwcm9ncmFtO1xuICAgIC8vIGRldGVybWluZSBhdHRyaWJ1dGUgbG9jYXRpb25zIChpLmUuIGluZGljZXMpXG4gICAgdGhpcy5hdHRyaWJ1dGVMb2NhdGlvbnMgPSBnZXRBdHRyaWJ1dGVMb2NhdGlvbnMoZ2wsIHByb2dyYW0pO1xuICAgIC8vIHByZXBhcmUgdW5pZm9ybSBzZXR0ZXJzXG4gICAgdGhpcy51bmlmb3JtU2V0dGVycyA9IGdldFVuaWZvcm1TZXR0ZXJzKGdsLCBwcm9ncmFtKTtcbiAgICAvLyBubyBhdHRyaWJ1dGVzIGVuYWJsZWQgeWV0XG4gICAgdGhpcy5hdHRyaWJ1dGVFbmFibGVkID0ge307XG4gIH1cblxuICB1c2UoKSB7XG4gICAgdGhpcy5nbC51c2VQcm9ncmFtKHRoaXMucHJvZ3JhbSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRUZXh0dXJlKHRleHR1cmUsIGluZGV4KSB7XG4gICAgdGV4dHVyZS5iaW5kKGluZGV4KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFVuaWZvcm0obmFtZSwgdmFsdWUpIHtcbiAgICBpZiAobmFtZSBpbiB0aGlzLnVuaWZvcm1TZXR0ZXJzKSB7XG4gICAgICB0aGlzLnVuaWZvcm1TZXR0ZXJzW25hbWVdKHZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRVbmlmb3Jtcyh1bmlmb3JtTWFwKSB7XG4gICAgZm9yIChjb25zdCBuYW1lIG9mIE9iamVjdC5rZXlzKHVuaWZvcm1NYXApKSB7XG4gICAgICBpZiAobmFtZSBpbiB0aGlzLnVuaWZvcm1TZXR0ZXJzKSB7XG4gICAgICAgIHRoaXMudW5pZm9ybVNldHRlcnNbbmFtZV0odW5pZm9ybU1hcFtuYW1lXSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0QnVmZmVyKGJ1ZmZlcikge1xuICAgIGNvbnN0IGxvY2F0aW9uID0gdGhpcy5hdHRyaWJ1dGVMb2NhdGlvbnNbYnVmZmVyLmF0dHJpYnV0ZV07XG4gICAgYnVmZmVyLmF0dGFjaFRvTG9jYXRpb24obG9jYXRpb24pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0QnVmZmVycyhidWZmZXJzKSB7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkoYnVmZmVycyksICdQcm9ncmFtLnNldEJ1ZmZlcnMgZXhwZWN0cyBhcnJheScpO1xuICAgIGJ1ZmZlcnMgPSBidWZmZXJzLmxlbmd0aCA9PT0gMSAmJiBBcnJheS5pc0FycmF5KGJ1ZmZlcnNbMF0pID9cbiAgICAgIGJ1ZmZlcnNbMF0gOiBidWZmZXJzO1xuICAgIGZvciAoY29uc3QgYnVmZmVyIG9mIGJ1ZmZlcnMpIHtcbiAgICAgIHRoaXMuc2V0QnVmZmVyKGJ1ZmZlcik7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdW5zZXRCdWZmZXIoYnVmZmVyKSB7XG4gICAgY29uc3QgbG9jYXRpb24gPSB0aGlzLmF0dHJpYnV0ZUxvY2F0aW9uc1tidWZmZXIuYXR0cmlidXRlXTtcbiAgICBidWZmZXIuZGV0YWNoRnJvbUxvY2F0aW9uKGxvY2F0aW9uKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHVuc2V0QnVmZmVycyhidWZmZXJzKSB7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkoYnVmZmVycyksICdQcm9ncmFtLnNldEJ1ZmZlcnMgZXhwZWN0cyBhcnJheScpO1xuICAgIGJ1ZmZlcnMgPSBidWZmZXJzLmxlbmd0aCA9PT0gMSAmJiBBcnJheS5pc0FycmF5KGJ1ZmZlcnNbMF0pID9cbiAgICAgIGJ1ZmZlcnNbMF0gOiBidWZmZXJzO1xuICAgIGZvciAoY29uc3QgYnVmZmVyIG9mIGJ1ZmZlcnMpIHtcbiAgICAgIHRoaXMudW5zZXRCdWZmZXIoYnVmZmVyKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxufVxuXG4vLyBUT0RPIC0gdXNlIHRhYmxlcyB0byByZWR1Y2UgY29tcGxleGl0eSBvZiBtZXRob2QgYmVsb3dcbi8vIGNvbnN0IGdsVW5pZm9ybVNldHRlciA9IHtcbi8vICAgRkxPQVQ6IHtmdW5jdGlvbjogJ3VuaWZvcm0xZnYnLCB0eXBlOiBGbG9hdDMyQXJyYXl9LFxuLy8gICBGTE9BVF9WRUMzOiB7ZnVuY3Rpb246ICd1bmlmb3JtM2Z2JywgdHlwZTogRmxvYXQzMkFycmF5fSxcbi8vICAgRkxPQVRfTUFUNDoge2Z1bmN0aW9uOiAndW5pZm9ybU1hdHJpeDRmdicsIHR5cGU6IEZsb2F0MzJBcnJheX0sXG4vLyAgIElOVDoge2Z1bmN0aW9uOiAndW5pZm9ybTFpdicsIHR5cGU6IFVpbnQxNkFycmF5fSxcbi8vICAgQk9PTDoge2Z1bmN0aW9uOiAndW5pZm9ybTFpdicsIHR5cGU6IFVpbnQxNkFycmF5fSxcbi8vICAgU0FNUExFUl8yRDoge2Z1bmN0aW9uOiAndW5pZm9ybTFpdicsIHR5cGU6IFVpbnQxNkFycmF5fSxcbi8vICAgU0FNUExFUl9DVUJFOiB7ZnVuY3Rpb246ICd1bmlmb3JtMWl2JywgdHlwZTogVWludDE2QXJyYXl9XG4vLyB9O1xuXG4vLyBSZXR1cm5zIGEgTWFnaWMgVW5pZm9ybSBTZXR0ZXJcbmZ1bmN0aW9uIGdldFVuaWZvcm1TZXR0ZXIoZ2wsIGdsUHJvZ3JhbSwgaW5mbywgaXNBcnJheSkge1xuICBjb25zdCB7bmFtZSwgdHlwZX0gPSBpbmZvO1xuICBjb25zdCBsb2MgPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24oZ2xQcm9ncmFtLCBuYW1lKTtcblxuICBsZXQgbWF0cml4ID0gZmFsc2U7XG4gIGxldCB2ZWN0b3IgPSB0cnVlO1xuICBsZXQgZ2xGdW5jdGlvbjtcbiAgbGV0IFR5cGVkQXJyYXk7XG5cbiAgaWYgKGluZm8uc2l6ZSA+IDEgJiYgaXNBcnJheSkge1xuICAgIHN3aXRjaCAodHlwZSkge1xuXG4gICAgY2FzZSBnbC5GTE9BVDpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtMWZ2O1xuICAgICAgVHlwZWRBcnJheSA9IEZsb2F0MzJBcnJheTtcbiAgICAgIHZlY3RvciA9IGZhbHNlO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlIGdsLkZMT0FUX1ZFQzM6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTNmdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBGbG9hdDMyQXJyYXk7XG4gICAgICB2ZWN0b3IgPSB0cnVlO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlIGdsLkZMT0FUX01BVDQ6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybU1hdHJpeDRmdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBGbG9hdDMyQXJyYXk7XG4gICAgICB2ZWN0b3IgPSB0cnVlO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlIGdsLklOVDpcbiAgICBjYXNlIGdsLkJPT0w6XG4gICAgY2FzZSBnbC5TQU1QTEVSXzJEOlxuICAgIGNhc2UgZ2wuU0FNUExFUl9DVUJFOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0xaXY7XG4gICAgICBUeXBlZEFycmF5ID0gVWludDE2QXJyYXk7XG4gICAgICB2ZWN0b3IgPSBmYWxzZTtcbiAgICAgIGJyZWFrO1xuXG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5pZm9ybTogVW5rbm93biBHTFNMIHR5cGUgJyArIHR5cGUpO1xuXG4gICAgfVxuICB9XG5cbiAgaWYgKHZlY3Rvcikge1xuICAgIHN3aXRjaCAodHlwZSkge1xuICAgIGNhc2UgZ2wuRkxPQVQ6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTFmO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5GTE9BVF9WRUMyOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0yZnY7XG4gICAgICBUeXBlZEFycmF5ID0gaXNBcnJheSA/IEZsb2F0MzJBcnJheSA6IG5ldyBGbG9hdDMyQXJyYXkoMik7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLkZMT0FUX1ZFQzM6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTNmdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBpc0FycmF5ID8gRmxvYXQzMkFycmF5IDogbmV3IEZsb2F0MzJBcnJheSgzKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuRkxPQVRfVkVDNDpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtNGZ2O1xuICAgICAgVHlwZWRBcnJheSA9IGlzQXJyYXkgPyBGbG9hdDMyQXJyYXkgOiBuZXcgRmxvYXQzMkFycmF5KDQpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5JTlQ6IGNhc2UgZ2wuQk9PTDogY2FzZSBnbC5TQU1QTEVSXzJEOiBjYXNlIGdsLlNBTVBMRVJfQ1VCRTpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtMWk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLklOVF9WRUMyOiBjYXNlIGdsLkJPT0xfVkVDMjpcbiAgICAgIGdsRnVuY3Rpb24gPSBnbC51bmlmb3JtMml2O1xuICAgICAgVHlwZWRBcnJheSA9IGlzQXJyYXkgPyBVaW50MTZBcnJheSA6IG5ldyBVaW50MTZBcnJheSgyKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgZ2wuSU5UX1ZFQzM6IGNhc2UgZ2wuQk9PTF9WRUMzOlxuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm0zaXY7XG4gICAgICBUeXBlZEFycmF5ID0gaXNBcnJheSA/IFVpbnQxNkFycmF5IDogbmV3IFVpbnQxNkFycmF5KDMpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSBnbC5JTlRfVkVDNDogY2FzZSBnbC5CT09MX1ZFQzQ6XG4gICAgICBnbEZ1bmN0aW9uID0gZ2wudW5pZm9ybTRpdjtcbiAgICAgIFR5cGVkQXJyYXkgPSBpc0FycmF5ID8gVWludDE2QXJyYXkgOiBuZXcgVWludDE2QXJyYXkoNCk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLkZMT0FUX01BVDI6XG4gICAgICBtYXRyaXggPSB0cnVlO1xuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm1NYXRyaXgyZnY7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLkZMT0FUX01BVDM6XG4gICAgICBtYXRyaXggPSB0cnVlO1xuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm1NYXRyaXgzZnY7XG4gICAgICBicmVhaztcbiAgICBjYXNlIGdsLkZMT0FUX01BVDQ6XG4gICAgICBtYXRyaXggPSB0cnVlO1xuICAgICAgZ2xGdW5jdGlvbiA9IGdsLnVuaWZvcm1NYXRyaXg0ZnY7XG4gICAgICBicmVhaztcbiAgICBkZWZhdWx0OlxuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgZ2xGdW5jdGlvbiA9IGdsRnVuY3Rpb24uYmluZChnbCk7XG5cbiAgLy8gU2V0IGEgdW5pZm9ybSBhcnJheVxuICBpZiAoaXNBcnJheSAmJiBUeXBlZEFycmF5KSB7XG5cbiAgICByZXR1cm4gdmFsID0+IHtcbiAgICAgIGdsRnVuY3Rpb24obG9jLCBuZXcgVHlwZWRBcnJheSh2YWwpKTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfTtcbiAgfSBlbHNlIGlmIChtYXRyaXgpIHtcbiAgICAvLyBTZXQgYSBtYXRyaXggdW5pZm9ybVxuICAgIHJldHVybiB2YWwgPT4ge1xuICAgICAgZ2xGdW5jdGlvbihsb2MsIGZhbHNlLCB2YWwudG9GbG9hdDMyQXJyYXkoKSk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH07XG5cbiAgfSBlbHNlIGlmIChUeXBlZEFycmF5KSB7XG5cbiAgICAvLyBTZXQgYSB2ZWN0b3IvdHlwZWQgYXJyYXkgdW5pZm9ybVxuICAgIHJldHVybiB2YWwgPT4ge1xuICAgICAgVHlwZWRBcnJheS5zZXQodmFsLnRvRmxvYXQzMkFycmF5ID8gdmFsLnRvRmxvYXQzMkFycmF5KCkgOiB2YWwpO1xuICAgICAgZ2xGdW5jdGlvbihsb2MsIFR5cGVkQXJyYXkpO1xuICAgICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICB9O1xuXG4gIH1cbiAgLy8gU2V0IGEgcHJpbWl0aXZlLXZhbHVlZCB1bmlmb3JtXG4gIHJldHVybiB2YWwgPT4ge1xuICAgIGdsRnVuY3Rpb24obG9jLCB2YWwpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gIH07XG5cbn1cblxuLy8gY3JlYXRlIHVuaWZvcm0gc2V0dGVyc1xuLy8gTWFwIG9mIHVuaWZvcm0gbmFtZXMgdG8gc2V0dGVyIGZ1bmN0aW9uc1xuZnVuY3Rpb24gZ2V0VW5pZm9ybVNldHRlcnMoZ2wsIGdsUHJvZ3JhbSkge1xuICBjb25zdCB1bmlmb3JtU2V0dGVycyA9IHt9O1xuICBjb25zdCBsZW5ndGggPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKGdsUHJvZ3JhbSwgZ2wuQUNUSVZFX1VOSUZPUk1TKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGluZm8gPSBnbC5nZXRBY3RpdmVVbmlmb3JtKGdsUHJvZ3JhbSwgaSk7XG4gICAgbGV0IG5hbWUgPSBpbmZvLm5hbWU7XG4gICAgLy8gaWYgYXJyYXkgbmFtZSB0aGVuIGNsZWFuIHRoZSBhcnJheSBicmFja2V0c1xuICAgIG5hbWUgPSBuYW1lW25hbWUubGVuZ3RoIC0gMV0gPT09ICddJyA/XG4gICAgICBuYW1lLnN1YnN0cigwLCBuYW1lLmxlbmd0aCAtIDMpIDogbmFtZTtcbiAgICB1bmlmb3JtU2V0dGVyc1tuYW1lXSA9XG4gICAgICBnZXRVbmlmb3JtU2V0dGVyKGdsLCBnbFByb2dyYW0sIGluZm8sIGluZm8ubmFtZSAhPT0gbmFtZSk7XG4gIH1cbiAgcmV0dXJuIHVuaWZvcm1TZXR0ZXJzO1xufVxuXG4vLyBkZXRlcm1pbmUgYXR0cmlidXRlIGxvY2F0aW9ucyAobWFwcyBhdHRyaWJ1dGUgbmFtZSB0byBpbmRleClcbmZ1bmN0aW9uIGdldEF0dHJpYnV0ZUxvY2F0aW9ucyhnbCwgZ2xQcm9ncmFtKSB7XG4gIGNvbnN0IGxlbmd0aCA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIoZ2xQcm9ncmFtLCBnbC5BQ1RJVkVfQVRUUklCVVRFUyk7XG4gIGNvbnN0IGF0dHJpYnV0ZUxvY2F0aW9ucyA9IHt9O1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgaW5mbyA9IGdsLmdldEFjdGl2ZUF0dHJpYihnbFByb2dyYW0sIGkpO1xuICAgIGNvbnN0IGluZGV4ID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24oZ2xQcm9ncmFtLCBpbmZvLm5hbWUpO1xuICAgIGF0dHJpYnV0ZUxvY2F0aW9uc1tpbmZvLm5hbWVdID0gaW5kZXg7XG4gIH1cbiAgcmV0dXJuIGF0dHJpYnV0ZUxvY2F0aW9ucztcbn1cbiJdfQ==