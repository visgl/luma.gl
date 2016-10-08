'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.getUniformDescriptors = getUniformDescriptors;

var _webglTypes = require('./webgl-types');

var _webglChecks = require('./webgl-checks');

var _context = require('./context');

var _vertexAttributes = require('./vertex-attributes');

var VertexAttributes = _interopRequireWildcard(_vertexAttributes);

var _buffer2 = require('./buffer');

var _buffer3 = _interopRequireDefault(_buffer2);

var _texture = require('./texture');

var _uniforms = require('./uniforms');

var _shader = require('./shader');

var _shaderlib = require('../../shaderlib');

var _shaderlib2 = _interopRequireDefault(_shaderlib);

var _utils = require('../utils');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ERR_WEBGL2 = 'WebGL2 required';

var Program = function () {
  _createClass(Program, null, [{
    key: 'makeFrom',


    /**
     * Returns a Program wrapped WebGLProgram from a variety of inputs.
     * Allows other functions to transparently accept raw WebGLPrograms etc
     * and manipulate them using the methods in the `Program` class.
     * Checks for ".handle"
     *
     * @param {WebGLRenderingContext} gl - if a new buffer needs to be initialized
     * @param {*} object - candidate that will be coerced to a buffer
     * @returns {Program} - Program object that wraps the buffer parameter
     */
    value: function makeFrom(gl) {
      var object = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      return object instanceof Program ? object :
      // Use .handle if available, else use 'program' directly
      new Program(gl).setData({ handle: object.handle || object });
    }

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
    /* eslint-disable max-statements */

  }]);

  function Program(gl) {
    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var id = _ref.id;
    var _ref$vs = _ref.vs;
    var vs = _ref$vs === undefined ? _shaderlib2.default.DEFAULT.vs : _ref$vs;
    var _ref$fs = _ref.fs;
    var fs = _ref$fs === undefined ? _shaderlib2.default.DEFAULT.fs : _ref$fs;
    var defaultUniforms = _ref.defaultUniforms;
    var handle = _ref.handle;

    _classCallCheck(this, Program);

    (0, _webglChecks.assertWebGLRenderingContext)(gl);

    // Assign default uniforms if any of the default shaders is being used
    if (vs === _shaderlib2.default.DEFAULT.vs || fs === _shaderlib2.default.DEFAULT.fs && defaultUniforms === undefined) {
      defaultUniforms = _shaderlib2.default.DEFAULT.defaultUniforms;
    }

    // Create shaders
    this.vs = new _shader.VertexShader(gl, vs);
    this.fs = new _shader.FragmentShader(gl, fs);

    // If program is not named, name it after shader names
    var programName = this.vs.getName() || this.fs.getName();
    programName = programName ? programName + '-program' : 'program';
    this.id = id || (0, _utils.uid)(programName);

    this.gl = gl;
    this.defaultUniforms = defaultUniforms;
    this.handle = handle;
    if (!this.handle) {
      this.handle = gl.createProgram();
      this._compileAndLink(vs, fs);
    }
    if (!this.handle) {
      throw new Error('Failed to create program');
    }

    // determine attribute locations (i.e. indices)
    this._attributeLocations = this._getAttributeLocations();
    this._attributeCount = this.getAttributeCount();
    this._warn = [];
    this._filledLocations = {};

    // prepare uniform setters
    this._uniformSetters = this._getUniformSetters();
    this._uniformCount = this.getUniformCount();
    this._textureIndexCounter = 0;

    this.userData = {};
    Object.seal(this);
  }
  /* eslint-enable max-statements */

  _createClass(Program, [{
    key: 'delete',
    value: function _delete() {
      var gl = this.gl;

      if (this.handle) {
        gl.deleteProgram(this.handle);
        (0, _context.glCheckError)(gl);
      }
      this.handle = null;
      return this;
    }
  }, {
    key: '_compileAndLink',
    value: function _compileAndLink(vs, fs) {
      var gl = this.gl;

      gl.attachShader(this.handle, this.vs.handle);
      gl.attachShader(this.handle, this.fs.handle);
      gl.linkProgram(this.handle);
      gl.validateProgram(this.handle);
      var linked = gl.getProgramParameter(this.handle, gl.LINK_STATUS);
      if (!linked) {
        throw new Error('Error linking ' + gl.getProgramInfoLog(this.handle));
      }
    }
  }, {
    key: 'use',
    value: function use() {
      var gl = this.gl;

      gl.useProgram(this.handle);
      return this;
    }

    // DEPRECATED METHODS

  }, {
    key: 'clearBuffers',
    value: function clearBuffers() {
      this._filledLocations = {};
      return this;
    }
  }, {
    key: '_print',
    value: function _print(bufferName) {
      return 'Program ' + this.id + ': Attribute ' + bufferName;
    }

    /**
     * Attach a map of Buffers values to a program
     * Only attributes with names actually present in the linked program
     * will be updated. Other supplied buffers will be ignored.
     *
     * @param {Object} buffers - An object map with attribute names being keys
     *  and values are expected to be instances of Buffer.
     * @returns {Program} Returns itself for chaining.
     */
    /* eslint-disable max-statements */

  }, {
    key: 'setBuffers',
    value: function setBuffers(buffers) {
      var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      var _ref2$clear = _ref2.clear;
      var clear = _ref2$clear === undefined ? true : _ref2$clear;
      var _ref2$check = _ref2.check;
      var check = _ref2$check === undefined ? true : _ref2$check;
      var _ref2$drawParams = _ref2.drawParams;
      var drawParams = _ref2$drawParams === undefined ? {} : _ref2$drawParams;
      var gl = this.gl;

      if (Array.isArray(buffers)) {
        throw new Error('Program.setBuffers expects map of buffers');
      }

      if (clear) {
        this.clearBuffers();
      }

      // indexing is autodetected - buffer with target gl.ELEMENT_ARRAY_BUFFER
      // index type is saved for drawElement calls
      drawParams.isInstanced = false;
      drawParams.isIndexed = false;
      drawParams.indexType = null;

      var _sortBuffersByLocatio = this._sortBuffersByLocation(buffers);

      var locations = _sortBuffersByLocatio.locations;
      var elements = _sortBuffersByLocatio.elements;

      // Process locations in order

      for (var location = 0; location < locations.length; ++location) {
        var bufferName = locations[location];
        var buffer = buffers[bufferName];
        // DISABLE MISSING ATTRIBUTE
        if (!buffer) {
          VertexAttributes.disable(gl, location);
        } else {
          var divisor = buffer.layout.instanced ? 1 : 0;
          VertexAttributes.enable(gl, location);
          VertexAttributes.setBuffer({ gl: gl, location: location, buffer: buffer });
          VertexAttributes.setDivisor(gl, location, divisor);
          drawParams.isInstanced = buffer.layout.instanced > 0;
          this._filledLocations[bufferName] = true;
        }
      }

      // SET ELEMENTS ARRAY BUFFER
      if (elements) {
        var _buffer = buffers[elements];
        _buffer.bind();
        drawParams.isIndexed = true;
        drawParams.indexType = _buffer.layout.type;
      }

      if (check) {
        this.checkBuffers();
      }

      return this;
    }
    /* eslint-enable max-statements */

  }, {
    key: '_sortBuffersByLocation',
    value: function _sortBuffersByLocation(buffers) {
      var elements = null;
      var locations = new Array(this._attributeCount);

      for (var bufferName in buffers) {
        var buffer = _buffer3.default.makeFrom(this.gl, buffers[bufferName]);
        var location = this._attributeLocations[bufferName];
        if (location === undefined) {
          if (buffer.target === _webglTypes.GL.ELEMENT_ARRAY_BUFFER && elements) {
            throw new Error(this._print(bufferName) + ' duplicate gl.ELEMENT_ARRAY_BUFFER');
          } else if (buffer.target === _webglTypes.GL.ELEMENT_ARRAY_BUFFER) {
            elements = bufferName;
          } else if (!this._warn[bufferName]) {
            _utils.log.warn(2, this._print(bufferName) + ' not used');
            this._warn[bufferName] = true;
          }
        } else {
          if (buffer.target === _webglTypes.GL.ELEMENT_ARRAY_BUFFER) {
            throw new Error(this._print(bufferName) + ':' + location + ' ' + 'has both location and type gl.ELEMENT_ARRAY_BUFFER');
          }
          locations[location] = bufferName;
        }
      }

      return { locations: locations, elements: elements };
    }
  }, {
    key: 'checkBuffers',
    value: function checkBuffers() {
      for (var attributeName in this._attributeLocations) {
        if (!this._filledLocations[attributeName] && !this._warn[attributeName]) {
          var location = this._attributeLocations[attributeName];
          // throw new Error(`Program ${this.id}: ` +
          //   `Attribute ${location}:${attributeName} not supplied`);
          _utils.log.warn(0, 'Program ' + this.id + ': ' + ('Attribute ' + location + ':' + attributeName + ' not supplied'));
          this._warn[attributeName] = true;
        }
      }
      return this;
    }

    /*
     * @returns {Program} Returns itself for chaining.
     */

  }, {
    key: 'unsetBuffers',
    value: function unsetBuffers() {
      var gl = this.gl;

      var length = this._attributeCount;
      for (var i = 1; i < length; ++i) {
        // VertexAttributes.setDivisor(gl, i, 0);
        VertexAttributes.disable(gl, i);
      }
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
      return this;
    }

    /**
     * Apply a set of uniform values to a program
     * Only uniforms with names actually present in the linked program
     * will be updated.
     * other uniforms will be ignored
     *
     * @param {Object} uniformMap - An object with names being keys
     * @returns {Program} - returns itself for chaining.
     */
    /* eslint-disable max-depth */

  }, {
    key: 'setUniforms',
    value: function setUniforms(uniforms) {
      for (var uniformName in uniforms) {
        var uniform = uniforms[uniformName];
        var uniformSetter = this._uniformSetters[uniformName];
        if (uniformSetter) {
          if (uniform instanceof _texture.Texture) {
            if (uniformSetter.textureIndex === undefined) {
              uniformSetter.textureIndex = this._textureIndexCounter++;
            }
            // Bind texture to index, and set the uniform sampler to the index
            var texture = uniform;
            var textureIndex = uniformSetter.textureIndex;
            // console.debug('setting texture', textureIndex, texture);

            texture.bind(textureIndex);
            uniformSetter(textureIndex);
          } else {
            // Just set the value
            uniformSetter(uniform);
          }
        }
      }
      return this;
    }
    /* eslint-enable max-depth */

  }, {
    key: 'getAttachedShadersCount',
    value: function getAttachedShadersCount() {
      return this.getProgramParameter(this.gl.ATTACHED_SHADERS);
    }

    // ATTRIBUTES API
    // Note: Locations are numeric indices

  }, {
    key: 'getAttributeCount',
    value: function getAttributeCount() {
      return this.getProgramParameter(this.gl.ACTIVE_ATTRIBUTES);
    }

    /**
     * Returns an object with info about attribute at index "location"/
     * @param {int} location - index of an attribute
     * @returns {WebGLActiveInfo} - info about an active attribute
     *   fields: {name, size, type}
     */

  }, {
    key: 'getAttributeInfo',
    value: function getAttributeInfo(location) {
      return this.gl.getActiveAttrib(this.handle, location);
    }
  }, {
    key: 'getAttributeName',
    value: function getAttributeName(location) {
      return this.getAttributeInfo(location).name;
    }

    /**
     * Returns location (index) of a name
     * @param {String} attributeName - name of an attribute
     *   (matches name in a linked shader)
     * @returns {String[]} - array of actual attribute names from shader linking
     */

  }, {
    key: 'getAttributeLocation',
    value: function getAttributeLocation(attributeName) {
      return this.gl.getAttribLocation(this.handle, attributeName);
    }

    // UNIFORMS API
    // Note: locations are opaque structures

  }, {
    key: 'getUniformCount',
    value: function getUniformCount() {
      return this.getProgramParameter(_webglTypes.GL.ACTIVE_UNIFORMS);
    }

    /*
     * @returns {WebGLActiveInfo} - object with {name, size, type}
     */

  }, {
    key: 'getUniformInfo',
    value: function getUniformInfo(index) {
      return this.gl.getActiveUniform(this.handle, index);
    }

    /*
     * @returns {WebGLUniformLocation} - opaque object representing location
     * of uniform, used by setter methods
     */

  }, {
    key: 'getUniformLocation',
    value: function getUniformLocation(name) {
      return this.gl.getUniformLocation(this.handle, name);
    }
  }, {
    key: 'getUniformValue',
    value: function getUniformValue(location) {
      return this.gl.getUniform(this.handle, location);
    }

    // PROGRAM API

  }, {
    key: 'isFlaggedForDeletion',
    value: function isFlaggedForDeletion() {
      return this.getProgramParameter(this.gl.DELETE_STATUS);
    }
  }, {
    key: 'getLastLinkStatus',
    value: function getLastLinkStatus() {
      return this.getProgramParameter(this.gl.LINK_STATUS);
    }
  }, {
    key: 'getLastValidationStatus',
    value: function getLastValidationStatus() {
      return this.getProgramParameter(this.gl.VALIDATE_STATUS);
    }

    // WEBGL2 INTERFACE

    // This may be gl.SEPARATE_ATTRIBS or gl.INTERLEAVED_ATTRIBS.

  }, {
    key: 'getTransformFeedbackBufferMode',
    value: function getTransformFeedbackBufferMode() {
      var gl = this.gl;

      (0, _assert2.default)(gl instanceof _webglTypes.WebGL2RenderingContext, ERR_WEBGL2);
      return this.getProgramParameter(this.gl.TRANSFORM_FEEDBACK_BUFFER_MODE);
    }
  }, {
    key: 'getTransformFeedbackVaryingsCount',
    value: function getTransformFeedbackVaryingsCount() {
      var gl = this.gl;

      (0, _assert2.default)(gl instanceof _webglTypes.WebGL2RenderingContext, ERR_WEBGL2);
      return this.getProgramParameter(this.gl.TRANSFORM_FEEDBACK_VARYINGS);
    }
  }, {
    key: 'getActiveUniformBlocksCount',
    value: function getActiveUniformBlocksCount() {
      var gl = this.gl;

      (0, _assert2.default)(gl instanceof _webglTypes.WebGL2RenderingContext, ERR_WEBGL2);
      return this.getProgramParameter(this.gl.ACTIVE_UNIFORM_BLOCKS);
    }

    // Retrieves the assigned color number binding for the user-defined varying
    // out variable name for program. program must have previously been linked.
    // [WebGLHandlesContextLoss]

  }, {
    key: 'getFragDataLocation',
    value: function getFragDataLocation(varyingName) {
      var gl = this.gl;

      (0, _assert2.default)(gl instanceof _webglTypes.WebGL2RenderingContext, ERR_WEBGL2);
      var location = gl.getFragDataLocation(this.handle, varyingName);
      (0, _context.glCheckError)(gl);
      return location;
    }

    // Return the value for the passed pname given the passed program.
    // The type returned is the natural type for the requested pname,
    // as given in the following table:
    // pname returned type
    // DELETE_STATUS GLboolean
    // LINK_STATUS GLboolean
    // VALIDATE_STATUS GLboolean
    // ATTACHED_SHADERS  GLint
    // ACTIVE_ATTRIBUTES GLint
    // ACTIVE_UNIFORMS GLint
    // TRANSFORM_FEEDBACK_BUFFER_MODE  GLenum
    // TRANSFORM_FEEDBACK_VARYINGS GLint
    // ACTIVE_UNIFORM_BLOCKS GLint

  }, {
    key: 'getProgramParameter',
    value: function getProgramParameter(pname) {
      var gl = this.gl;

      var parameter = gl.getProgramParameter(this.handle, pname);
      (0, _context.glCheckError)(gl);
      return parameter;
    }

    // PRIVATE METHODS

    // Check that all active attributes are enabled

  }, {
    key: '_areAllAttributesEnabled',
    value: function _areAllAttributesEnabled() {
      var gl = this.gl;

      var length = this._attributeCount;
      for (var i = 0; i < length; ++i) {
        if (!VertexAttributes.isEnabled(gl, i)) {
          return false;
        }
      }
      return true;
    }

    // determine attribute locations (maps attribute name to index)

  }, {
    key: '_getAttributeLocations',
    value: function _getAttributeLocations() {
      var attributeLocations = {};
      var length = this.getAttributeCount();
      for (var location = 0; location < length; location++) {
        var name = this.getAttributeName(location);
        attributeLocations[name] = this.getAttributeLocation(name);
      }
      return attributeLocations;
    }

    // create uniform setters
    // Map of uniform names to setter functions

  }, {
    key: '_getUniformSetters',
    value: function _getUniformSetters() {
      var gl = this.gl;

      var uniformSetters = {};
      var length = this.getUniformCount();
      for (var i = 0; i < length; i++) {
        var info = this.getUniformInfo(i);
        var parsedName = (0, _uniforms.parseUniformName)(info.name);
        var location = this.getUniformLocation(parsedName.name);
        uniformSetters[parsedName.name] = (0, _uniforms.getUniformSetter)(gl, location, info, parsedName.isArray);
      }
      return uniformSetters;
    }

    // REMOVED

    /*
     * Binds array of textures, at indices corresponding to positions in array
     */

  }, {
    key: 'setTextures',
    value: function setTextures(textures) {
      throw new Error('setTextures replaced with setAttributes');
      // assert(Array.isArray(textures), 'setTextures requires array textures');
      // for (let i = 0; i < textures.length; ++i) {
      //   textures[i].bind(i);
      // }
      // return this;
    }
  }, {
    key: 'unsetTextures',
    value: function unsetTextures(textures) {
      throw new Error('unsetTextures replaced with setAttributes');
      // assert(Array.isArray(textures), 'unsetTextures requires array textures');
      // for (let i = 0; i < textures.length; ++i) {
      //   textures[i].unbind(i);
      // }
      // return this;
    }

    /*
     * Set a texture at a given index
     */

  }, {
    key: 'setTexture',
    value: function setTexture(texture, index) {
      throw new Error('setTexture replaced with setAttributes');
      // texture.bind(index);
      // return this;
    }
  }]);

  return Program;
}();

// create uniform setters
// Map of uniform names to setter functions


exports.default = Program;
function getUniformDescriptors(gl, program) {
  var uniformDecriptors = {};
  var length = program.getUniformCount();
  for (var i = 0; i < length; i++) {
    var info = program.getUniformInfo(i);
    var location = program.getUniformLocation(info.name);
    var descriptor = (0, _uniforms.getUniformSetter)(gl, location, info);
    uniformDecriptors[descriptor.name] = descriptor;
  }
  return uniformDecriptors;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9wcm9ncmFtLmpzIl0sIm5hbWVzIjpbImdldFVuaWZvcm1EZXNjcmlwdG9ycyIsIlZlcnRleEF0dHJpYnV0ZXMiLCJFUlJfV0VCR0wyIiwiUHJvZ3JhbSIsImdsIiwib2JqZWN0Iiwic2V0RGF0YSIsImhhbmRsZSIsImlkIiwidnMiLCJERUZBVUxUIiwiZnMiLCJkZWZhdWx0VW5pZm9ybXMiLCJ1bmRlZmluZWQiLCJwcm9ncmFtTmFtZSIsImdldE5hbWUiLCJjcmVhdGVQcm9ncmFtIiwiX2NvbXBpbGVBbmRMaW5rIiwiRXJyb3IiLCJfYXR0cmlidXRlTG9jYXRpb25zIiwiX2dldEF0dHJpYnV0ZUxvY2F0aW9ucyIsIl9hdHRyaWJ1dGVDb3VudCIsImdldEF0dHJpYnV0ZUNvdW50IiwiX3dhcm4iLCJfZmlsbGVkTG9jYXRpb25zIiwiX3VuaWZvcm1TZXR0ZXJzIiwiX2dldFVuaWZvcm1TZXR0ZXJzIiwiX3VuaWZvcm1Db3VudCIsImdldFVuaWZvcm1Db3VudCIsIl90ZXh0dXJlSW5kZXhDb3VudGVyIiwidXNlckRhdGEiLCJPYmplY3QiLCJzZWFsIiwiZGVsZXRlUHJvZ3JhbSIsImF0dGFjaFNoYWRlciIsImxpbmtQcm9ncmFtIiwidmFsaWRhdGVQcm9ncmFtIiwibGlua2VkIiwiZ2V0UHJvZ3JhbVBhcmFtZXRlciIsIkxJTktfU1RBVFVTIiwiZ2V0UHJvZ3JhbUluZm9Mb2ciLCJ1c2VQcm9ncmFtIiwiYnVmZmVyTmFtZSIsImJ1ZmZlcnMiLCJjbGVhciIsImNoZWNrIiwiZHJhd1BhcmFtcyIsIkFycmF5IiwiaXNBcnJheSIsImNsZWFyQnVmZmVycyIsImlzSW5zdGFuY2VkIiwiaXNJbmRleGVkIiwiaW5kZXhUeXBlIiwiX3NvcnRCdWZmZXJzQnlMb2NhdGlvbiIsImxvY2F0aW9ucyIsImVsZW1lbnRzIiwibG9jYXRpb24iLCJsZW5ndGgiLCJidWZmZXIiLCJkaXNhYmxlIiwiZGl2aXNvciIsImxheW91dCIsImluc3RhbmNlZCIsImVuYWJsZSIsInNldEJ1ZmZlciIsInNldERpdmlzb3IiLCJiaW5kIiwidHlwZSIsImNoZWNrQnVmZmVycyIsIm1ha2VGcm9tIiwidGFyZ2V0IiwiRUxFTUVOVF9BUlJBWV9CVUZGRVIiLCJfcHJpbnQiLCJ3YXJuIiwiYXR0cmlidXRlTmFtZSIsImkiLCJiaW5kQnVmZmVyIiwidW5pZm9ybXMiLCJ1bmlmb3JtTmFtZSIsInVuaWZvcm0iLCJ1bmlmb3JtU2V0dGVyIiwidGV4dHVyZUluZGV4IiwidGV4dHVyZSIsIkFUVEFDSEVEX1NIQURFUlMiLCJBQ1RJVkVfQVRUUklCVVRFUyIsImdldEFjdGl2ZUF0dHJpYiIsImdldEF0dHJpYnV0ZUluZm8iLCJuYW1lIiwiZ2V0QXR0cmliTG9jYXRpb24iLCJBQ1RJVkVfVU5JRk9STVMiLCJpbmRleCIsImdldEFjdGl2ZVVuaWZvcm0iLCJnZXRVbmlmb3JtTG9jYXRpb24iLCJnZXRVbmlmb3JtIiwiREVMRVRFX1NUQVRVUyIsIlZBTElEQVRFX1NUQVRVUyIsIlRSQU5TRk9STV9GRUVEQkFDS19CVUZGRVJfTU9ERSIsIlRSQU5TRk9STV9GRUVEQkFDS19WQVJZSU5HUyIsIkFDVElWRV9VTklGT1JNX0JMT0NLUyIsInZhcnlpbmdOYW1lIiwiZ2V0RnJhZ0RhdGFMb2NhdGlvbiIsInBuYW1lIiwicGFyYW1ldGVyIiwiaXNFbmFibGVkIiwiYXR0cmlidXRlTG9jYXRpb25zIiwiZ2V0QXR0cmlidXRlTmFtZSIsImdldEF0dHJpYnV0ZUxvY2F0aW9uIiwidW5pZm9ybVNldHRlcnMiLCJpbmZvIiwiZ2V0VW5pZm9ybUluZm8iLCJwYXJzZWROYW1lIiwidGV4dHVyZXMiLCJwcm9ncmFtIiwidW5pZm9ybURlY3JpcHRvcnMiLCJkZXNjcmlwdG9yIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7UUEwZWdCQSxxQixHQUFBQSxxQjs7QUExZWhCOztBQUNBOztBQUNBOztBQUNBOztJQUFZQyxnQjs7QUFDWjs7OztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7O0FBQ0E7O0FBQ0E7Ozs7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LElBQUk3RixLQUFKLENBQVUseUNBQVYsQ0FBTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDRDs7O2tDQUVhNkYsUSxFQUFVO0FBQ3RCLFlBQU0sSUFBSTdGLEtBQUosQ0FBVSwyQ0FBVixDQUFOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNEOztBQUVEOzs7Ozs7K0JBR1dnRSxPLEVBQVNRLEssRUFBTztBQUN6QixZQUFNLElBQUl4RSxLQUFKLENBQVUsd0NBQVYsQ0FBTjtBQUNBO0FBQ0E7QUFDRDs7Ozs7O0FBR0g7QUFDQTs7O2tCQTNkcUJmLE87QUE0ZGQsU0FBU0gscUJBQVQsQ0FBK0JJLEVBQS9CLEVBQW1DNEcsT0FBbkMsRUFBNEM7QUFDakQsTUFBTUMsb0JBQW9CLEVBQTFCO0FBQ0EsTUFBTXhELFNBQVN1RCxRQUFRcEYsZUFBUixFQUFmO0FBQ0EsT0FBSyxJQUFJK0MsSUFBSSxDQUFiLEVBQWdCQSxJQUFJbEIsTUFBcEIsRUFBNEJrQixHQUE1QixFQUFpQztBQUMvQixRQUFNaUMsT0FBT0ksUUFBUUgsY0FBUixDQUF1QmxDLENBQXZCLENBQWI7QUFDQSxRQUFNbkIsV0FBV3dELFFBQVFwQixrQkFBUixDQUEyQmdCLEtBQUtyQixJQUFoQyxDQUFqQjtBQUNBLFFBQU0yQixhQUFhLGdDQUFpQjlHLEVBQWpCLEVBQXFCb0QsUUFBckIsRUFBK0JvRCxJQUEvQixDQUFuQjtBQUNBSyxzQkFBa0JDLFdBQVczQixJQUE3QixJQUFxQzJCLFVBQXJDO0FBQ0Q7QUFDRCxTQUFPRCxpQkFBUDtBQUNEIiwiZmlsZSI6InByb2dyYW0uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0dMLCBXZWJHTDJSZW5kZXJpbmdDb250ZXh0fSBmcm9tICcuL3dlYmdsLXR5cGVzJztcbmltcG9ydCB7YXNzZXJ0V2ViR0xSZW5kZXJpbmdDb250ZXh0fSBmcm9tICcuL3dlYmdsLWNoZWNrcyc7XG5pbXBvcnQge2dsQ2hlY2tFcnJvcn0gZnJvbSAnLi9jb250ZXh0JztcbmltcG9ydCAqIGFzIFZlcnRleEF0dHJpYnV0ZXMgZnJvbSAnLi92ZXJ0ZXgtYXR0cmlidXRlcyc7XG5pbXBvcnQgQnVmZmVyIGZyb20gJy4vYnVmZmVyJztcbmltcG9ydCB7VGV4dHVyZX0gZnJvbSAnLi90ZXh0dXJlJztcbmltcG9ydCB7cGFyc2VVbmlmb3JtTmFtZSwgZ2V0VW5pZm9ybVNldHRlcn0gZnJvbSAnLi91bmlmb3Jtcyc7XG5pbXBvcnQge1ZlcnRleFNoYWRlciwgRnJhZ21lbnRTaGFkZXJ9IGZyb20gJy4vc2hhZGVyJztcbmltcG9ydCBTSEFERVJTIGZyb20gJy4uLy4uL3NoYWRlcmxpYic7XG5pbXBvcnQge2xvZywgdWlkfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbmNvbnN0IEVSUl9XRUJHTDIgPSAnV2ViR0wyIHJlcXVpcmVkJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUHJvZ3JhbSB7XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBQcm9ncmFtIHdyYXBwZWQgV2ViR0xQcm9ncmFtIGZyb20gYSB2YXJpZXR5IG9mIGlucHV0cy5cbiAgICogQWxsb3dzIG90aGVyIGZ1bmN0aW9ucyB0byB0cmFuc3BhcmVudGx5IGFjY2VwdCByYXcgV2ViR0xQcm9ncmFtcyBldGNcbiAgICogYW5kIG1hbmlwdWxhdGUgdGhlbSB1c2luZyB0aGUgbWV0aG9kcyBpbiB0aGUgYFByb2dyYW1gIGNsYXNzLlxuICAgKiBDaGVja3MgZm9yIFwiLmhhbmRsZVwiXG4gICAqXG4gICAqIEBwYXJhbSB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fSBnbCAtIGlmIGEgbmV3IGJ1ZmZlciBuZWVkcyB0byBiZSBpbml0aWFsaXplZFxuICAgKiBAcGFyYW0geyp9IG9iamVjdCAtIGNhbmRpZGF0ZSB0aGF0IHdpbGwgYmUgY29lcmNlZCB0byBhIGJ1ZmZlclxuICAgKiBAcmV0dXJucyB7UHJvZ3JhbX0gLSBQcm9ncmFtIG9iamVjdCB0aGF0IHdyYXBzIHRoZSBidWZmZXIgcGFyYW1ldGVyXG4gICAqL1xuICBzdGF0aWMgbWFrZUZyb20oZ2wsIG9iamVjdCA9IHt9KSB7XG4gICAgcmV0dXJuIG9iamVjdCBpbnN0YW5jZW9mIFByb2dyYW0gPyBvYmplY3QgOlxuICAgICAgLy8gVXNlIC5oYW5kbGUgaWYgYXZhaWxhYmxlLCBlbHNlIHVzZSAncHJvZ3JhbScgZGlyZWN0bHlcbiAgICAgIG5ldyBQcm9ncmFtKGdsKS5zZXREYXRhKHtoYW5kbGU6IG9iamVjdC5oYW5kbGUgfHwgb2JqZWN0fSk7XG4gIH1cblxuICAvKlxuICAgKiBAY2xhc3NkZXNjXG4gICAqIEhhbmRsZXMgY3JlYXRpb24gb2YgcHJvZ3JhbXMsIG1hcHBpbmcgb2YgYXR0cmlidXRlcyBhbmQgdW5pZm9ybXNcbiAgICpcbiAgICogQGNsYXNzXG4gICAqIEBwYXJhbSB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fSBnbCAtIGdsIGNvbnRleHRcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdHMgLSBvcHRpb25zXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBvcHRzLnZzIC0gVmVydGV4IHNoYWRlciBzb3VyY2VcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMuZnMgLSBGcmFnbWVudCBzaGFkZXIgc291cmNlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBvcHRzLmlkPSAtIElkXG4gICAqL1xuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cyAqL1xuICBjb25zdHJ1Y3RvcihnbCwge1xuICAgIGlkLFxuICAgIHZzID0gU0hBREVSUy5ERUZBVUxULnZzLFxuICAgIGZzID0gU0hBREVSUy5ERUZBVUxULmZzLFxuICAgIGRlZmF1bHRVbmlmb3JtcyxcbiAgICBoYW5kbGVcbiAgfSA9IHt9KSB7XG4gICAgYXNzZXJ0V2ViR0xSZW5kZXJpbmdDb250ZXh0KGdsKTtcblxuICAgIC8vIEFzc2lnbiBkZWZhdWx0IHVuaWZvcm1zIGlmIGFueSBvZiB0aGUgZGVmYXVsdCBzaGFkZXJzIGlzIGJlaW5nIHVzZWRcbiAgICBpZiAodnMgPT09IFNIQURFUlMuREVGQVVMVC52cyB8fCBmcyA9PT0gU0hBREVSUy5ERUZBVUxULmZzICYmXG4gICAgICBkZWZhdWx0VW5pZm9ybXMgPT09IHVuZGVmaW5lZFxuICAgICkge1xuICAgICAgZGVmYXVsdFVuaWZvcm1zID0gU0hBREVSUy5ERUZBVUxULmRlZmF1bHRVbmlmb3JtcztcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgc2hhZGVyc1xuICAgIHRoaXMudnMgPSBuZXcgVmVydGV4U2hhZGVyKGdsLCB2cyk7XG4gICAgdGhpcy5mcyA9IG5ldyBGcmFnbWVudFNoYWRlcihnbCwgZnMpO1xuXG4gICAgLy8gSWYgcHJvZ3JhbSBpcyBub3QgbmFtZWQsIG5hbWUgaXQgYWZ0ZXIgc2hhZGVyIG5hbWVzXG4gICAgbGV0IHByb2dyYW1OYW1lID0gdGhpcy52cy5nZXROYW1lKCkgfHwgdGhpcy5mcy5nZXROYW1lKCk7XG4gICAgcHJvZ3JhbU5hbWUgPSBwcm9ncmFtTmFtZSA/IGAke3Byb2dyYW1OYW1lfS1wcm9ncmFtYCA6ICdwcm9ncmFtJztcbiAgICB0aGlzLmlkID0gaWQgfHwgdWlkKHByb2dyYW1OYW1lKTtcblxuICAgIHRoaXMuZ2wgPSBnbDtcbiAgICB0aGlzLmRlZmF1bHRVbmlmb3JtcyA9IGRlZmF1bHRVbmlmb3JtcztcbiAgICB0aGlzLmhhbmRsZSA9IGhhbmRsZTtcbiAgICBpZiAoIXRoaXMuaGFuZGxlKSB7XG4gICAgICB0aGlzLmhhbmRsZSA9IGdsLmNyZWF0ZVByb2dyYW0oKTtcbiAgICAgIHRoaXMuX2NvbXBpbGVBbmRMaW5rKHZzLCBmcyk7XG4gICAgfVxuICAgIGlmICghdGhpcy5oYW5kbGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIGNyZWF0ZSBwcm9ncmFtJyk7XG4gICAgfVxuXG4gICAgLy8gZGV0ZXJtaW5lIGF0dHJpYnV0ZSBsb2NhdGlvbnMgKGkuZS4gaW5kaWNlcylcbiAgICB0aGlzLl9hdHRyaWJ1dGVMb2NhdGlvbnMgPSB0aGlzLl9nZXRBdHRyaWJ1dGVMb2NhdGlvbnMoKTtcbiAgICB0aGlzLl9hdHRyaWJ1dGVDb3VudCA9IHRoaXMuZ2V0QXR0cmlidXRlQ291bnQoKTtcbiAgICB0aGlzLl93YXJuID0gW107XG4gICAgdGhpcy5fZmlsbGVkTG9jYXRpb25zID0ge307XG5cbiAgICAvLyBwcmVwYXJlIHVuaWZvcm0gc2V0dGVyc1xuICAgIHRoaXMuX3VuaWZvcm1TZXR0ZXJzID0gdGhpcy5fZ2V0VW5pZm9ybVNldHRlcnMoKTtcbiAgICB0aGlzLl91bmlmb3JtQ291bnQgPSB0aGlzLmdldFVuaWZvcm1Db3VudCgpO1xuICAgIHRoaXMuX3RleHR1cmVJbmRleENvdW50ZXIgPSAwO1xuXG4gICAgdGhpcy51c2VyRGF0YSA9IHt9O1xuICAgIE9iamVjdC5zZWFsKHRoaXMpO1xuICB9XG4gIC8qIGVzbGludC1lbmFibGUgbWF4LXN0YXRlbWVudHMgKi9cblxuICBkZWxldGUoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgaWYgKHRoaXMuaGFuZGxlKSB7XG4gICAgICBnbC5kZWxldGVQcm9ncmFtKHRoaXMuaGFuZGxlKTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfVxuICAgIHRoaXMuaGFuZGxlID0gbnVsbDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIF9jb21waWxlQW5kTGluayh2cywgZnMpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5hdHRhY2hTaGFkZXIodGhpcy5oYW5kbGUsIHRoaXMudnMuaGFuZGxlKTtcbiAgICBnbC5hdHRhY2hTaGFkZXIodGhpcy5oYW5kbGUsIHRoaXMuZnMuaGFuZGxlKTtcbiAgICBnbC5saW5rUHJvZ3JhbSh0aGlzLmhhbmRsZSk7XG4gICAgZ2wudmFsaWRhdGVQcm9ncmFtKHRoaXMuaGFuZGxlKTtcbiAgICBjb25zdCBsaW5rZWQgPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHRoaXMuaGFuZGxlLCBnbC5MSU5LX1NUQVRVUyk7XG4gICAgaWYgKCFsaW5rZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRXJyb3IgbGlua2luZyAke2dsLmdldFByb2dyYW1JbmZvTG9nKHRoaXMuaGFuZGxlKX1gKTtcbiAgICB9XG4gIH1cblxuICB1c2UoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wudXNlUHJvZ3JhbSh0aGlzLmhhbmRsZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBERVBSRUNBVEVEIE1FVEhPRFNcbiAgY2xlYXJCdWZmZXJzKCkge1xuICAgIHRoaXMuX2ZpbGxlZExvY2F0aW9ucyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgX3ByaW50KGJ1ZmZlck5hbWUpIHtcbiAgICByZXR1cm4gYFByb2dyYW0gJHt0aGlzLmlkfTogQXR0cmlidXRlICR7YnVmZmVyTmFtZX1gO1xuICB9XG5cbiAgLyoqXG4gICAqIEF0dGFjaCBhIG1hcCBvZiBCdWZmZXJzIHZhbHVlcyB0byBhIHByb2dyYW1cbiAgICogT25seSBhdHRyaWJ1dGVzIHdpdGggbmFtZXMgYWN0dWFsbHkgcHJlc2VudCBpbiB0aGUgbGlua2VkIHByb2dyYW1cbiAgICogd2lsbCBiZSB1cGRhdGVkLiBPdGhlciBzdXBwbGllZCBidWZmZXJzIHdpbGwgYmUgaWdub3JlZC5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IGJ1ZmZlcnMgLSBBbiBvYmplY3QgbWFwIHdpdGggYXR0cmlidXRlIG5hbWVzIGJlaW5nIGtleXNcbiAgICogIGFuZCB2YWx1ZXMgYXJlIGV4cGVjdGVkIHRvIGJlIGluc3RhbmNlcyBvZiBCdWZmZXIuXG4gICAqIEByZXR1cm5zIHtQcm9ncmFtfSBSZXR1cm5zIGl0c2VsZiBmb3IgY2hhaW5pbmcuXG4gICAqL1xuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cyAqL1xuICBzZXRCdWZmZXJzKGJ1ZmZlcnMsIHtjbGVhciA9IHRydWUsIGNoZWNrID0gdHJ1ZSwgZHJhd1BhcmFtcyA9IHt9fSA9IHt9KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoYnVmZmVycykpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUHJvZ3JhbS5zZXRCdWZmZXJzIGV4cGVjdHMgbWFwIG9mIGJ1ZmZlcnMnKTtcbiAgICB9XG5cbiAgICBpZiAoY2xlYXIpIHtcbiAgICAgIHRoaXMuY2xlYXJCdWZmZXJzKCk7XG4gICAgfVxuXG4gICAgLy8gaW5kZXhpbmcgaXMgYXV0b2RldGVjdGVkIC0gYnVmZmVyIHdpdGggdGFyZ2V0IGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSXG4gICAgLy8gaW5kZXggdHlwZSBpcyBzYXZlZCBmb3IgZHJhd0VsZW1lbnQgY2FsbHNcbiAgICBkcmF3UGFyYW1zLmlzSW5zdGFuY2VkID0gZmFsc2U7XG4gICAgZHJhd1BhcmFtcy5pc0luZGV4ZWQgPSBmYWxzZTtcbiAgICBkcmF3UGFyYW1zLmluZGV4VHlwZSA9IG51bGw7XG5cbiAgICBjb25zdCB7bG9jYXRpb25zLCBlbGVtZW50c30gPSB0aGlzLl9zb3J0QnVmZmVyc0J5TG9jYXRpb24oYnVmZmVycyk7XG5cbiAgICAvLyBQcm9jZXNzIGxvY2F0aW9ucyBpbiBvcmRlclxuICAgIGZvciAobGV0IGxvY2F0aW9uID0gMDsgbG9jYXRpb24gPCBsb2NhdGlvbnMubGVuZ3RoOyArK2xvY2F0aW9uKSB7XG4gICAgICBjb25zdCBidWZmZXJOYW1lID0gbG9jYXRpb25zW2xvY2F0aW9uXTtcbiAgICAgIGNvbnN0IGJ1ZmZlciA9IGJ1ZmZlcnNbYnVmZmVyTmFtZV07XG4gICAgICAvLyBESVNBQkxFIE1JU1NJTkcgQVRUUklCVVRFXG4gICAgICBpZiAoIWJ1ZmZlcikge1xuICAgICAgICBWZXJ0ZXhBdHRyaWJ1dGVzLmRpc2FibGUoZ2wsIGxvY2F0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGRpdmlzb3IgPSBidWZmZXIubGF5b3V0Lmluc3RhbmNlZCA/IDEgOiAwO1xuICAgICAgICBWZXJ0ZXhBdHRyaWJ1dGVzLmVuYWJsZShnbCwgbG9jYXRpb24pO1xuICAgICAgICBWZXJ0ZXhBdHRyaWJ1dGVzLnNldEJ1ZmZlcih7Z2wsIGxvY2F0aW9uLCBidWZmZXJ9KTtcbiAgICAgICAgVmVydGV4QXR0cmlidXRlcy5zZXREaXZpc29yKGdsLCBsb2NhdGlvbiwgZGl2aXNvcik7XG4gICAgICAgIGRyYXdQYXJhbXMuaXNJbnN0YW5jZWQgPSBidWZmZXIubGF5b3V0Lmluc3RhbmNlZCA+IDA7XG4gICAgICAgIHRoaXMuX2ZpbGxlZExvY2F0aW9uc1tidWZmZXJOYW1lXSA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gU0VUIEVMRU1FTlRTIEFSUkFZIEJVRkZFUlxuICAgIGlmIChlbGVtZW50cykge1xuICAgICAgY29uc3QgYnVmZmVyID0gYnVmZmVyc1tlbGVtZW50c107XG4gICAgICBidWZmZXIuYmluZCgpO1xuICAgICAgZHJhd1BhcmFtcy5pc0luZGV4ZWQgPSB0cnVlO1xuICAgICAgZHJhd1BhcmFtcy5pbmRleFR5cGUgPSBidWZmZXIubGF5b3V0LnR5cGU7XG4gICAgfVxuXG4gICAgaWYgKGNoZWNrKSB7XG4gICAgICB0aGlzLmNoZWNrQnVmZmVycygpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIC8qIGVzbGludC1lbmFibGUgbWF4LXN0YXRlbWVudHMgKi9cblxuICBfc29ydEJ1ZmZlcnNCeUxvY2F0aW9uKGJ1ZmZlcnMpIHtcbiAgICBsZXQgZWxlbWVudHMgPSBudWxsO1xuICAgIGNvbnN0IGxvY2F0aW9ucyA9IG5ldyBBcnJheSh0aGlzLl9hdHRyaWJ1dGVDb3VudCk7XG5cbiAgICBmb3IgKGNvbnN0IGJ1ZmZlck5hbWUgaW4gYnVmZmVycykge1xuICAgICAgY29uc3QgYnVmZmVyID0gQnVmZmVyLm1ha2VGcm9tKHRoaXMuZ2wsIGJ1ZmZlcnNbYnVmZmVyTmFtZV0pO1xuICAgICAgY29uc3QgbG9jYXRpb24gPSB0aGlzLl9hdHRyaWJ1dGVMb2NhdGlvbnNbYnVmZmVyTmFtZV07XG4gICAgICBpZiAobG9jYXRpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAoYnVmZmVyLnRhcmdldCA9PT0gR0wuRUxFTUVOVF9BUlJBWV9CVUZGRVIgJiYgZWxlbWVudHMpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICBgJHt0aGlzLl9wcmludChidWZmZXJOYW1lKX0gZHVwbGljYXRlIGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSYCk7XG4gICAgICAgIH0gZWxzZSBpZiAoYnVmZmVyLnRhcmdldCA9PT0gR0wuRUxFTUVOVF9BUlJBWV9CVUZGRVIpIHtcbiAgICAgICAgICBlbGVtZW50cyA9IGJ1ZmZlck5hbWU7XG4gICAgICAgIH0gZWxzZSBpZiAoIXRoaXMuX3dhcm5bYnVmZmVyTmFtZV0pIHtcbiAgICAgICAgICBsb2cud2FybigyLCBgJHt0aGlzLl9wcmludChidWZmZXJOYW1lKX0gbm90IHVzZWRgKTtcbiAgICAgICAgICB0aGlzLl93YXJuW2J1ZmZlck5hbWVdID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGJ1ZmZlci50YXJnZXQgPT09IEdMLkVMRU1FTlRfQVJSQVlfQlVGRkVSKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAke3RoaXMuX3ByaW50KGJ1ZmZlck5hbWUpfToke2xvY2F0aW9ufSBgICtcbiAgICAgICAgICAgICdoYXMgYm90aCBsb2NhdGlvbiBhbmQgdHlwZSBnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUicpO1xuICAgICAgICB9XG4gICAgICAgIGxvY2F0aW9uc1tsb2NhdGlvbl0gPSBidWZmZXJOYW1lO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7bG9jYXRpb25zLCBlbGVtZW50c307XG4gIH1cblxuICBjaGVja0J1ZmZlcnMoKSB7XG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGVOYW1lIGluIHRoaXMuX2F0dHJpYnV0ZUxvY2F0aW9ucykge1xuICAgICAgaWYgKCF0aGlzLl9maWxsZWRMb2NhdGlvbnNbYXR0cmlidXRlTmFtZV0gJiYgIXRoaXMuX3dhcm5bYXR0cmlidXRlTmFtZV0pIHtcbiAgICAgICAgY29uc3QgbG9jYXRpb24gPSB0aGlzLl9hdHRyaWJ1dGVMb2NhdGlvbnNbYXR0cmlidXRlTmFtZV07XG4gICAgICAgIC8vIHRocm93IG5ldyBFcnJvcihgUHJvZ3JhbSAke3RoaXMuaWR9OiBgICtcbiAgICAgICAgLy8gICBgQXR0cmlidXRlICR7bG9jYXRpb259OiR7YXR0cmlidXRlTmFtZX0gbm90IHN1cHBsaWVkYCk7XG4gICAgICAgIGxvZy53YXJuKDAsIGBQcm9ncmFtICR7dGhpcy5pZH06IGAgK1xuICAgICAgICAgIGBBdHRyaWJ1dGUgJHtsb2NhdGlvbn06JHthdHRyaWJ1dGVOYW1lfSBub3Qgc3VwcGxpZWRgKTtcbiAgICAgICAgdGhpcy5fd2FyblthdHRyaWJ1dGVOYW1lXSA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLypcbiAgICogQHJldHVybnMge1Byb2dyYW19IFJldHVybnMgaXRzZWxmIGZvciBjaGFpbmluZy5cbiAgICovXG4gIHVuc2V0QnVmZmVycygpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBjb25zdCBsZW5ndGggPSB0aGlzLl9hdHRyaWJ1dGVDb3VudDtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgICAvLyBWZXJ0ZXhBdHRyaWJ1dGVzLnNldERpdmlzb3IoZ2wsIGksIDApO1xuICAgICAgVmVydGV4QXR0cmlidXRlcy5kaXNhYmxlKGdsLCBpKTtcbiAgICB9XG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgbnVsbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQXBwbHkgYSBzZXQgb2YgdW5pZm9ybSB2YWx1ZXMgdG8gYSBwcm9ncmFtXG4gICAqIE9ubHkgdW5pZm9ybXMgd2l0aCBuYW1lcyBhY3R1YWxseSBwcmVzZW50IGluIHRoZSBsaW5rZWQgcHJvZ3JhbVxuICAgKiB3aWxsIGJlIHVwZGF0ZWQuXG4gICAqIG90aGVyIHVuaWZvcm1zIHdpbGwgYmUgaWdub3JlZFxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gdW5pZm9ybU1hcCAtIEFuIG9iamVjdCB3aXRoIG5hbWVzIGJlaW5nIGtleXNcbiAgICogQHJldHVybnMge1Byb2dyYW19IC0gcmV0dXJucyBpdHNlbGYgZm9yIGNoYWluaW5nLlxuICAgKi9cbiAgLyogZXNsaW50LWRpc2FibGUgbWF4LWRlcHRoICovXG4gIHNldFVuaWZvcm1zKHVuaWZvcm1zKSB7XG4gICAgZm9yIChjb25zdCB1bmlmb3JtTmFtZSBpbiB1bmlmb3Jtcykge1xuICAgICAgY29uc3QgdW5pZm9ybSA9IHVuaWZvcm1zW3VuaWZvcm1OYW1lXTtcbiAgICAgIGNvbnN0IHVuaWZvcm1TZXR0ZXIgPSB0aGlzLl91bmlmb3JtU2V0dGVyc1t1bmlmb3JtTmFtZV07XG4gICAgICBpZiAodW5pZm9ybVNldHRlcikge1xuICAgICAgICBpZiAodW5pZm9ybSBpbnN0YW5jZW9mIFRleHR1cmUpIHtcbiAgICAgICAgICBpZiAodW5pZm9ybVNldHRlci50ZXh0dXJlSW5kZXggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdW5pZm9ybVNldHRlci50ZXh0dXJlSW5kZXggPSB0aGlzLl90ZXh0dXJlSW5kZXhDb3VudGVyKys7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIEJpbmQgdGV4dHVyZSB0byBpbmRleCwgYW5kIHNldCB0aGUgdW5pZm9ybSBzYW1wbGVyIHRvIHRoZSBpbmRleFxuICAgICAgICAgIGNvbnN0IHRleHR1cmUgPSB1bmlmb3JtO1xuICAgICAgICAgIGNvbnN0IHt0ZXh0dXJlSW5kZXh9ID0gdW5pZm9ybVNldHRlcjtcbiAgICAgICAgICAvLyBjb25zb2xlLmRlYnVnKCdzZXR0aW5nIHRleHR1cmUnLCB0ZXh0dXJlSW5kZXgsIHRleHR1cmUpO1xuICAgICAgICAgIHRleHR1cmUuYmluZCh0ZXh0dXJlSW5kZXgpO1xuICAgICAgICAgIHVuaWZvcm1TZXR0ZXIodGV4dHVyZUluZGV4KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBKdXN0IHNldCB0aGUgdmFsdWVcbiAgICAgICAgICB1bmlmb3JtU2V0dGVyKHVuaWZvcm0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIC8qIGVzbGludC1lbmFibGUgbWF4LWRlcHRoICovXG5cbiAgZ2V0QXR0YWNoZWRTaGFkZXJzQ291bnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UHJvZ3JhbVBhcmFtZXRlcih0aGlzLmdsLkFUVEFDSEVEX1NIQURFUlMpO1xuICB9XG5cbiAgLy8gQVRUUklCVVRFUyBBUElcbiAgLy8gTm90ZTogTG9jYXRpb25zIGFyZSBudW1lcmljIGluZGljZXNcblxuICBnZXRBdHRyaWJ1dGVDb3VudCgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRQcm9ncmFtUGFyYW1ldGVyKHRoaXMuZ2wuQUNUSVZFX0FUVFJJQlVURVMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gb2JqZWN0IHdpdGggaW5mbyBhYm91dCBhdHRyaWJ1dGUgYXQgaW5kZXggXCJsb2NhdGlvblwiL1xuICAgKiBAcGFyYW0ge2ludH0gbG9jYXRpb24gLSBpbmRleCBvZiBhbiBhdHRyaWJ1dGVcbiAgICogQHJldHVybnMge1dlYkdMQWN0aXZlSW5mb30gLSBpbmZvIGFib3V0IGFuIGFjdGl2ZSBhdHRyaWJ1dGVcbiAgICogICBmaWVsZHM6IHtuYW1lLCBzaXplLCB0eXBlfVxuICAgKi9cbiAgZ2V0QXR0cmlidXRlSW5mbyhsb2NhdGlvbikge1xuICAgIHJldHVybiB0aGlzLmdsLmdldEFjdGl2ZUF0dHJpYih0aGlzLmhhbmRsZSwgbG9jYXRpb24pO1xuICB9XG5cbiAgZ2V0QXR0cmlidXRlTmFtZShsb2NhdGlvbikge1xuICAgIHJldHVybiB0aGlzLmdldEF0dHJpYnV0ZUluZm8obG9jYXRpb24pLm5hbWU7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBsb2NhdGlvbiAoaW5kZXgpIG9mIGEgbmFtZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gYXR0cmlidXRlTmFtZSAtIG5hbWUgb2YgYW4gYXR0cmlidXRlXG4gICAqICAgKG1hdGNoZXMgbmFtZSBpbiBhIGxpbmtlZCBzaGFkZXIpXG4gICAqIEByZXR1cm5zIHtTdHJpbmdbXX0gLSBhcnJheSBvZiBhY3R1YWwgYXR0cmlidXRlIG5hbWVzIGZyb20gc2hhZGVyIGxpbmtpbmdcbiAgICovXG4gIGdldEF0dHJpYnV0ZUxvY2F0aW9uKGF0dHJpYnV0ZU5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5nbC5nZXRBdHRyaWJMb2NhdGlvbih0aGlzLmhhbmRsZSwgYXR0cmlidXRlTmFtZSk7XG4gIH1cblxuICAvLyBVTklGT1JNUyBBUElcbiAgLy8gTm90ZTogbG9jYXRpb25zIGFyZSBvcGFxdWUgc3RydWN0dXJlc1xuXG4gIGdldFVuaWZvcm1Db3VudCgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRQcm9ncmFtUGFyYW1ldGVyKEdMLkFDVElWRV9VTklGT1JNUyk7XG4gIH1cblxuICAvKlxuICAgKiBAcmV0dXJucyB7V2ViR0xBY3RpdmVJbmZvfSAtIG9iamVjdCB3aXRoIHtuYW1lLCBzaXplLCB0eXBlfVxuICAgKi9cbiAgZ2V0VW5pZm9ybUluZm8oaW5kZXgpIHtcbiAgICByZXR1cm4gdGhpcy5nbC5nZXRBY3RpdmVVbmlmb3JtKHRoaXMuaGFuZGxlLCBpbmRleCk7XG4gIH1cblxuICAvKlxuICAgKiBAcmV0dXJucyB7V2ViR0xVbmlmb3JtTG9jYXRpb259IC0gb3BhcXVlIG9iamVjdCByZXByZXNlbnRpbmcgbG9jYXRpb25cbiAgICogb2YgdW5pZm9ybSwgdXNlZCBieSBzZXR0ZXIgbWV0aG9kc1xuICAgKi9cbiAgZ2V0VW5pZm9ybUxvY2F0aW9uKG5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5nbC5nZXRVbmlmb3JtTG9jYXRpb24odGhpcy5oYW5kbGUsIG5hbWUpO1xuICB9XG5cbiAgZ2V0VW5pZm9ybVZhbHVlKGxvY2F0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2wuZ2V0VW5pZm9ybSh0aGlzLmhhbmRsZSwgbG9jYXRpb24pO1xuICB9XG5cbiAgLy8gUFJPR1JBTSBBUElcblxuICBpc0ZsYWdnZWRGb3JEZWxldGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRQcm9ncmFtUGFyYW1ldGVyKHRoaXMuZ2wuREVMRVRFX1NUQVRVUyk7XG4gIH1cblxuICBnZXRMYXN0TGlua1N0YXR1cygpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRQcm9ncmFtUGFyYW1ldGVyKHRoaXMuZ2wuTElOS19TVEFUVVMpO1xuICB9XG5cbiAgZ2V0TGFzdFZhbGlkYXRpb25TdGF0dXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UHJvZ3JhbVBhcmFtZXRlcih0aGlzLmdsLlZBTElEQVRFX1NUQVRVUyk7XG4gIH1cblxuICAvLyBXRUJHTDIgSU5URVJGQUNFXG5cbiAgLy8gVGhpcyBtYXkgYmUgZ2wuU0VQQVJBVEVfQVRUUklCUyBvciBnbC5JTlRFUkxFQVZFRF9BVFRSSUJTLlxuICBnZXRUcmFuc2Zvcm1GZWVkYmFja0J1ZmZlck1vZGUoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgYXNzZXJ0KGdsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCwgRVJSX1dFQkdMMik7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UHJvZ3JhbVBhcmFtZXRlcih0aGlzLmdsLlRSQU5TRk9STV9GRUVEQkFDS19CVUZGRVJfTU9ERSk7XG4gIH1cblxuICBnZXRUcmFuc2Zvcm1GZWVkYmFja1ZhcnlpbmdzQ291bnQoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgYXNzZXJ0KGdsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCwgRVJSX1dFQkdMMik7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UHJvZ3JhbVBhcmFtZXRlcih0aGlzLmdsLlRSQU5TRk9STV9GRUVEQkFDS19WQVJZSU5HUyk7XG4gIH1cblxuICBnZXRBY3RpdmVVbmlmb3JtQmxvY2tzQ291bnQoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgYXNzZXJ0KGdsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCwgRVJSX1dFQkdMMik7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UHJvZ3JhbVBhcmFtZXRlcih0aGlzLmdsLkFDVElWRV9VTklGT1JNX0JMT0NLUyk7XG4gIH1cblxuICAvLyBSZXRyaWV2ZXMgdGhlIGFzc2lnbmVkIGNvbG9yIG51bWJlciBiaW5kaW5nIGZvciB0aGUgdXNlci1kZWZpbmVkIHZhcnlpbmdcbiAgLy8gb3V0IHZhcmlhYmxlIG5hbWUgZm9yIHByb2dyYW0uIHByb2dyYW0gbXVzdCBoYXZlIHByZXZpb3VzbHkgYmVlbiBsaW5rZWQuXG4gIC8vIFtXZWJHTEhhbmRsZXNDb250ZXh0TG9zc11cbiAgZ2V0RnJhZ0RhdGFMb2NhdGlvbih2YXJ5aW5nTmFtZSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGFzc2VydChnbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQsIEVSUl9XRUJHTDIpO1xuICAgIGNvbnN0IGxvY2F0aW9uID0gZ2wuZ2V0RnJhZ0RhdGFMb2NhdGlvbih0aGlzLmhhbmRsZSwgdmFyeWluZ05hbWUpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIGxvY2F0aW9uO1xuICB9XG5cbiAgLy8gUmV0dXJuIHRoZSB2YWx1ZSBmb3IgdGhlIHBhc3NlZCBwbmFtZSBnaXZlbiB0aGUgcGFzc2VkIHByb2dyYW0uXG4gIC8vIFRoZSB0eXBlIHJldHVybmVkIGlzIHRoZSBuYXR1cmFsIHR5cGUgZm9yIHRoZSByZXF1ZXN0ZWQgcG5hbWUsXG4gIC8vIGFzIGdpdmVuIGluIHRoZSBmb2xsb3dpbmcgdGFibGU6XG4gIC8vIHBuYW1lIHJldHVybmVkIHR5cGVcbiAgLy8gREVMRVRFX1NUQVRVUyBHTGJvb2xlYW5cbiAgLy8gTElOS19TVEFUVVMgR0xib29sZWFuXG4gIC8vIFZBTElEQVRFX1NUQVRVUyBHTGJvb2xlYW5cbiAgLy8gQVRUQUNIRURfU0hBREVSUyAgR0xpbnRcbiAgLy8gQUNUSVZFX0FUVFJJQlVURVMgR0xpbnRcbiAgLy8gQUNUSVZFX1VOSUZPUk1TIEdMaW50XG4gIC8vIFRSQU5TRk9STV9GRUVEQkFDS19CVUZGRVJfTU9ERSAgR0xlbnVtXG4gIC8vIFRSQU5TRk9STV9GRUVEQkFDS19WQVJZSU5HUyBHTGludFxuICAvLyBBQ1RJVkVfVU5JRk9STV9CTE9DS1MgR0xpbnRcbiAgZ2V0UHJvZ3JhbVBhcmFtZXRlcihwbmFtZSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGNvbnN0IHBhcmFtZXRlciA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIodGhpcy5oYW5kbGUsIHBuYW1lKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiBwYXJhbWV0ZXI7XG4gIH1cblxuICAvLyBQUklWQVRFIE1FVEhPRFNcblxuICAvLyBDaGVjayB0aGF0IGFsbCBhY3RpdmUgYXR0cmlidXRlcyBhcmUgZW5hYmxlZFxuICBfYXJlQWxsQXR0cmlidXRlc0VuYWJsZWQoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgY29uc3QgbGVuZ3RoID0gdGhpcy5fYXR0cmlidXRlQ291bnQ7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgICAgaWYgKCFWZXJ0ZXhBdHRyaWJ1dGVzLmlzRW5hYmxlZChnbCwgaSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIGRldGVybWluZSBhdHRyaWJ1dGUgbG9jYXRpb25zIChtYXBzIGF0dHJpYnV0ZSBuYW1lIHRvIGluZGV4KVxuICBfZ2V0QXR0cmlidXRlTG9jYXRpb25zKCkge1xuICAgIGNvbnN0IGF0dHJpYnV0ZUxvY2F0aW9ucyA9IHt9O1xuICAgIGNvbnN0IGxlbmd0aCA9IHRoaXMuZ2V0QXR0cmlidXRlQ291bnQoKTtcbiAgICBmb3IgKGxldCBsb2NhdGlvbiA9IDA7IGxvY2F0aW9uIDwgbGVuZ3RoOyBsb2NhdGlvbisrKSB7XG4gICAgICBjb25zdCBuYW1lID0gdGhpcy5nZXRBdHRyaWJ1dGVOYW1lKGxvY2F0aW9uKTtcbiAgICAgIGF0dHJpYnV0ZUxvY2F0aW9uc1tuYW1lXSA9IHRoaXMuZ2V0QXR0cmlidXRlTG9jYXRpb24obmFtZSk7XG4gICAgfVxuICAgIHJldHVybiBhdHRyaWJ1dGVMb2NhdGlvbnM7XG4gIH1cblxuICAvLyBjcmVhdGUgdW5pZm9ybSBzZXR0ZXJzXG4gIC8vIE1hcCBvZiB1bmlmb3JtIG5hbWVzIHRvIHNldHRlciBmdW5jdGlvbnNcbiAgX2dldFVuaWZvcm1TZXR0ZXJzKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGNvbnN0IHVuaWZvcm1TZXR0ZXJzID0ge307XG4gICAgY29uc3QgbGVuZ3RoID0gdGhpcy5nZXRVbmlmb3JtQ291bnQoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBpbmZvID0gdGhpcy5nZXRVbmlmb3JtSW5mbyhpKTtcbiAgICAgIGNvbnN0IHBhcnNlZE5hbWUgPSBwYXJzZVVuaWZvcm1OYW1lKGluZm8ubmFtZSk7XG4gICAgICBjb25zdCBsb2NhdGlvbiA9IHRoaXMuZ2V0VW5pZm9ybUxvY2F0aW9uKHBhcnNlZE5hbWUubmFtZSk7XG4gICAgICB1bmlmb3JtU2V0dGVyc1twYXJzZWROYW1lLm5hbWVdID1cbiAgICAgICAgZ2V0VW5pZm9ybVNldHRlcihnbCwgbG9jYXRpb24sIGluZm8sIHBhcnNlZE5hbWUuaXNBcnJheSk7XG4gICAgfVxuICAgIHJldHVybiB1bmlmb3JtU2V0dGVycztcbiAgfVxuXG4gIC8vIFJFTU9WRURcblxuICAvKlxuICAgKiBCaW5kcyBhcnJheSBvZiB0ZXh0dXJlcywgYXQgaW5kaWNlcyBjb3JyZXNwb25kaW5nIHRvIHBvc2l0aW9ucyBpbiBhcnJheVxuICAgKi9cbiAgc2V0VGV4dHVyZXModGV4dHVyZXMpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRleHR1cmVzIHJlcGxhY2VkIHdpdGggc2V0QXR0cmlidXRlcycpO1xuICAgIC8vIGFzc2VydChBcnJheS5pc0FycmF5KHRleHR1cmVzKSwgJ3NldFRleHR1cmVzIHJlcXVpcmVzIGFycmF5IHRleHR1cmVzJyk7XG4gICAgLy8gZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXh0dXJlcy5sZW5ndGg7ICsraSkge1xuICAgIC8vICAgdGV4dHVyZXNbaV0uYmluZChpKTtcbiAgICAvLyB9XG4gICAgLy8gcmV0dXJuIHRoaXM7XG4gIH1cblxuICB1bnNldFRleHR1cmVzKHRleHR1cmVzKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCd1bnNldFRleHR1cmVzIHJlcGxhY2VkIHdpdGggc2V0QXR0cmlidXRlcycpO1xuICAgIC8vIGFzc2VydChBcnJheS5pc0FycmF5KHRleHR1cmVzKSwgJ3Vuc2V0VGV4dHVyZXMgcmVxdWlyZXMgYXJyYXkgdGV4dHVyZXMnKTtcbiAgICAvLyBmb3IgKGxldCBpID0gMDsgaSA8IHRleHR1cmVzLmxlbmd0aDsgKytpKSB7XG4gICAgLy8gICB0ZXh0dXJlc1tpXS51bmJpbmQoaSk7XG4gICAgLy8gfVxuICAgIC8vIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLypcbiAgICogU2V0IGEgdGV4dHVyZSBhdCBhIGdpdmVuIGluZGV4XG4gICAqL1xuICBzZXRUZXh0dXJlKHRleHR1cmUsIGluZGV4KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUZXh0dXJlIHJlcGxhY2VkIHdpdGggc2V0QXR0cmlidXRlcycpO1xuICAgIC8vIHRleHR1cmUuYmluZChpbmRleCk7XG4gICAgLy8gcmV0dXJuIHRoaXM7XG4gIH1cbn1cblxuLy8gY3JlYXRlIHVuaWZvcm0gc2V0dGVyc1xuLy8gTWFwIG9mIHVuaWZvcm0gbmFtZXMgdG8gc2V0dGVyIGZ1bmN0aW9uc1xuZXhwb3J0IGZ1bmN0aW9uIGdldFVuaWZvcm1EZXNjcmlwdG9ycyhnbCwgcHJvZ3JhbSkge1xuICBjb25zdCB1bmlmb3JtRGVjcmlwdG9ycyA9IHt9O1xuICBjb25zdCBsZW5ndGggPSBwcm9ncmFtLmdldFVuaWZvcm1Db3VudCgpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgaW5mbyA9IHByb2dyYW0uZ2V0VW5pZm9ybUluZm8oaSk7XG4gICAgY29uc3QgbG9jYXRpb24gPSBwcm9ncmFtLmdldFVuaWZvcm1Mb2NhdGlvbihpbmZvLm5hbWUpO1xuICAgIGNvbnN0IGRlc2NyaXB0b3IgPSBnZXRVbmlmb3JtU2V0dGVyKGdsLCBsb2NhdGlvbiwgaW5mbyk7XG4gICAgdW5pZm9ybURlY3JpcHRvcnNbZGVzY3JpcHRvci5uYW1lXSA9IGRlc2NyaXB0b3I7XG4gIH1cbiAgcmV0dXJuIHVuaWZvcm1EZWNyaXB0b3JzO1xufVxuXG4iXX0=