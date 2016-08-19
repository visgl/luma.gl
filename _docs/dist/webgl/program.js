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
      var object = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

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
    var _ref = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var id = _ref.id;
    var _ref$vs = _ref.vs;
    var vs = _ref$vs === undefined ? _shaderlib2.default.DEFAULT.vs : _ref$vs;
    var _ref$fs = _ref.fs;
    var fs = _ref$fs === undefined ? _shaderlib2.default.DEFAULT.fs : _ref$fs;
    var _ref$defaultUniforms = _ref.defaultUniforms;
    var defaultUniforms = _ref$defaultUniforms === undefined ? _shaderlib2.default.DEFAULT.defaultUniforms : _ref$defaultUniforms;
    var handle = _ref.handle;

    _classCallCheck(this, Program);

    (0, _webglChecks.assertWebGLRenderingContext)(gl);

    if (arguments.length > 2) {
      throw new Error('Wrong number of arguments to Program(gl, {vs, fs, id})');
    }

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
      var _ref2 = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

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
        attributeLocations[name] = location;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9wcm9ncmFtLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztRQXNlZ0IscUIsR0FBQSxxQjs7QUF0ZWhCOztBQUNBOztBQUNBOztBQUNBOztJQUFZLGdCOztBQUNaOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7Ozs7Ozs7OztBQUVBLElBQU0sYUFBYSxpQkFBbkI7O0lBRXFCLE87Ozs7O0FBRW5COzs7Ozs7Ozs7OzZCQVVnQixFLEVBQWlCO0FBQUEsVUFBYixNQUFhLHlEQUFKLEVBQUk7O0FBQy9CLGFBQU8sa0JBQWtCLE9BQWxCLEdBQTRCLE1BQTVCO0FBQ0w7QUFDQSxVQUFJLE9BQUosQ0FBWSxFQUFaLEVBQWdCLE9BQWhCLENBQXdCLEVBQUMsUUFBUSxPQUFPLE1BQVAsSUFBaUIsTUFBMUIsRUFBeEIsQ0FGRjtBQUdEOztBQUVEOzs7Ozs7Ozs7OztBQVdBOzs7O0FBQ0EsbUJBQVksRUFBWixFQU1RO0FBQUEscUVBQUosRUFBSTs7QUFBQSxRQUxOLEVBS00sUUFMTixFQUtNO0FBQUEsdUJBSk4sRUFJTTtBQUFBLFFBSk4sRUFJTSwyQkFKRCxvQkFBUSxPQUFSLENBQWdCLEVBSWY7QUFBQSx1QkFITixFQUdNO0FBQUEsUUFITixFQUdNLDJCQUhELG9CQUFRLE9BQVIsQ0FBZ0IsRUFHZjtBQUFBLG9DQUZOLGVBRU07QUFBQSxRQUZOLGVBRU0sd0NBRlksb0JBQVEsT0FBUixDQUFnQixlQUU1QjtBQUFBLFFBRE4sTUFDTSxRQUROLE1BQ007O0FBQUE7O0FBQ04sa0RBQTRCLEVBQTVCOztBQUVBLFFBQUksVUFBVSxNQUFWLEdBQW1CLENBQXZCLEVBQTBCO0FBQ3hCLFlBQU0sSUFBSSxLQUFKLENBQVUsd0RBQVYsQ0FBTjtBQUNEOztBQUVELFNBQUssRUFBTCxHQUFVLHlCQUFpQixFQUFqQixFQUFxQixFQUFyQixDQUFWO0FBQ0EsU0FBSyxFQUFMLEdBQVUsMkJBQW1CLEVBQW5CLEVB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QUFXLElBQTdCLElBQXFDLFVBQXJDO0FBQ0Q7QUFDRCxTQUFPLGlCQUFQO0FBQ0QiLCJmaWxlIjoicHJvZ3JhbS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7R0wsIFdlYkdMMlJlbmRlcmluZ0NvbnRleHR9IGZyb20gJy4vd2ViZ2wtdHlwZXMnO1xuaW1wb3J0IHthc3NlcnRXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGZyb20gJy4vd2ViZ2wtY2hlY2tzJztcbmltcG9ydCB7Z2xDaGVja0Vycm9yfSBmcm9tICcuL2NvbnRleHQnO1xuaW1wb3J0ICogYXMgVmVydGV4QXR0cmlidXRlcyBmcm9tICcuL3ZlcnRleC1hdHRyaWJ1dGVzJztcbmltcG9ydCBCdWZmZXIgZnJvbSAnLi9idWZmZXInO1xuaW1wb3J0IHtUZXh0dXJlfSBmcm9tICcuL3RleHR1cmUnO1xuaW1wb3J0IHtwYXJzZVVuaWZvcm1OYW1lLCBnZXRVbmlmb3JtU2V0dGVyfSBmcm9tICcuL3VuaWZvcm1zJztcbmltcG9ydCB7VmVydGV4U2hhZGVyLCBGcmFnbWVudFNoYWRlcn0gZnJvbSAnLi9zaGFkZXInO1xuaW1wb3J0IFNIQURFUlMgZnJvbSAnLi4vLi4vc2hhZGVybGliJztcbmltcG9ydCB7bG9nLCB1aWR9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuY29uc3QgRVJSX1dFQkdMMiA9ICdXZWJHTDIgcmVxdWlyZWQnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQcm9ncmFtIHtcblxuICAvKipcbiAgICogUmV0dXJucyBhIFByb2dyYW0gd3JhcHBlZCBXZWJHTFByb2dyYW0gZnJvbSBhIHZhcmlldHkgb2YgaW5wdXRzLlxuICAgKiBBbGxvd3Mgb3RoZXIgZnVuY3Rpb25zIHRvIHRyYW5zcGFyZW50bHkgYWNjZXB0IHJhdyBXZWJHTFByb2dyYW1zIGV0Y1xuICAgKiBhbmQgbWFuaXB1bGF0ZSB0aGVtIHVzaW5nIHRoZSBtZXRob2RzIGluIHRoZSBgUHJvZ3JhbWAgY2xhc3MuXG4gICAqIENoZWNrcyBmb3IgXCIuaGFuZGxlXCJcbiAgICpcbiAgICogQHBhcmFtIHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGdsIC0gaWYgYSBuZXcgYnVmZmVyIG5lZWRzIHRvIGJlIGluaXRpYWxpemVkXG4gICAqIEBwYXJhbSB7Kn0gb2JqZWN0IC0gY2FuZGlkYXRlIHRoYXQgd2lsbCBiZSBjb2VyY2VkIHRvIGEgYnVmZmVyXG4gICAqIEByZXR1cm5zIHtQcm9ncmFtfSAtIFByb2dyYW0gb2JqZWN0IHRoYXQgd3JhcHMgdGhlIGJ1ZmZlciBwYXJhbWV0ZXJcbiAgICovXG4gIHN0YXRpYyBtYWtlRnJvbShnbCwgb2JqZWN0ID0ge30pIHtcbiAgICByZXR1cm4gb2JqZWN0IGluc3RhbmNlb2YgUHJvZ3JhbSA/IG9iamVjdCA6XG4gICAgICAvLyBVc2UgLmhhbmRsZSBpZiBhdmFpbGFibGUsIGVsc2UgdXNlICdwcm9ncmFtJyBkaXJlY3RseVxuICAgICAgbmV3IFByb2dyYW0oZ2wpLnNldERhdGEoe2hhbmRsZTogb2JqZWN0LmhhbmRsZSB8fCBvYmplY3R9KTtcbiAgfVxuXG4gIC8qXG4gICAqIEBjbGFzc2Rlc2NcbiAgICogSGFuZGxlcyBjcmVhdGlvbiBvZiBwcm9ncmFtcywgbWFwcGluZyBvZiBhdHRyaWJ1dGVzIGFuZCB1bmlmb3Jtc1xuICAgKlxuICAgKiBAY2xhc3NcbiAgICogQHBhcmFtIHtXZWJHTFJlbmRlcmluZ0NvbnRleHR9IGdsIC0gZ2wgY29udGV4dFxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIG9wdGlvbnNcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMudnMgLSBWZXJ0ZXggc2hhZGVyIHNvdXJjZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0cy5mcyAtIEZyYWdtZW50IHNoYWRlciBzb3VyY2VcbiAgICogQHBhcmFtIHtTdHJpbmd9IG9wdHMuaWQ9IC0gSWRcbiAgICovXG4gIC8qIGVzbGludC1kaXNhYmxlIG1heC1zdGF0ZW1lbnRzICovXG4gIGNvbnN0cnVjdG9yKGdsLCB7XG4gICAgaWQsXG4gICAgdnMgPSBTSEFERVJTLkRFRkFVTFQudnMsXG4gICAgZnMgPSBTSEFERVJTLkRFRkFVTFQuZnMsXG4gICAgZGVmYXVsdFVuaWZvcm1zID0gU0hBREVSUy5ERUZBVUxULmRlZmF1bHRVbmlmb3JtcyxcbiAgICBoYW5kbGVcbiAgfSA9IHt9KSB7XG4gICAgYXNzZXJ0V2ViR0xSZW5kZXJpbmdDb250ZXh0KGdsKTtcblxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdXcm9uZyBudW1iZXIgb2YgYXJndW1lbnRzIHRvIFByb2dyYW0oZ2wsIHt2cywgZnMsIGlkfSknKTtcbiAgICB9XG5cbiAgICB0aGlzLnZzID0gbmV3IFZlcnRleFNoYWRlcihnbCwgdnMpO1xuICAgIHRoaXMuZnMgPSBuZXcgRnJhZ21lbnRTaGFkZXIoZ2wsIGZzKTtcblxuICAgIC8vIElmIHByb2dyYW0gaXMgbm90IG5hbWVkLCBuYW1lIGl0IGFmdGVyIHNoYWRlciBuYW1lc1xuICAgIGxldCBwcm9ncmFtTmFtZSA9IHRoaXMudnMuZ2V0TmFtZSgpIHx8IHRoaXMuZnMuZ2V0TmFtZSgpO1xuICAgIHByb2dyYW1OYW1lID0gcHJvZ3JhbU5hbWUgPyBgJHtwcm9ncmFtTmFtZX0tcHJvZ3JhbWAgOiBgcHJvZ3JhbWA7XG4gICAgdGhpcy5pZCA9IGlkIHx8IHVpZChwcm9ncmFtTmFtZSk7XG5cbiAgICB0aGlzLmdsID0gZ2w7XG4gICAgdGhpcy5kZWZhdWx0VW5pZm9ybXMgPSBkZWZhdWx0VW5pZm9ybXM7XG4gICAgdGhpcy5oYW5kbGUgPSBoYW5kbGU7XG4gICAgaWYgKCF0aGlzLmhhbmRsZSkge1xuICAgICAgdGhpcy5oYW5kbGUgPSBnbC5jcmVhdGVQcm9ncmFtKCk7XG4gICAgICB0aGlzLl9jb21waWxlQW5kTGluayh2cywgZnMpO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuaGFuZGxlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBjcmVhdGUgcHJvZ3JhbScpO1xuICAgIH1cblxuICAgIC8vIGRldGVybWluZSBhdHRyaWJ1dGUgbG9jYXRpb25zIChpLmUuIGluZGljZXMpXG4gICAgdGhpcy5fYXR0cmlidXRlTG9jYXRpb25zID0gdGhpcy5fZ2V0QXR0cmlidXRlTG9jYXRpb25zKCk7XG4gICAgdGhpcy5fYXR0cmlidXRlQ291bnQgPSB0aGlzLmdldEF0dHJpYnV0ZUNvdW50KCk7XG4gICAgdGhpcy5fd2FybiA9IFtdO1xuICAgIHRoaXMuX2ZpbGxlZExvY2F0aW9ucyA9IHt9O1xuXG4gICAgLy8gcHJlcGFyZSB1bmlmb3JtIHNldHRlcnNcbiAgICB0aGlzLl91bmlmb3JtU2V0dGVycyA9IHRoaXMuX2dldFVuaWZvcm1TZXR0ZXJzKCk7XG4gICAgdGhpcy5fdW5pZm9ybUNvdW50ID0gdGhpcy5nZXRVbmlmb3JtQ291bnQoKTtcbiAgICB0aGlzLl90ZXh0dXJlSW5kZXhDb3VudGVyID0gMDtcblxuICAgIHRoaXMudXNlckRhdGEgPSB7fTtcbiAgICBPYmplY3Quc2VhbCh0aGlzKTtcbiAgfVxuICAvKiBlc2xpbnQtZW5hYmxlIG1heC1zdGF0ZW1lbnRzICovXG5cbiAgZGVsZXRlKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGlmICh0aGlzLmhhbmRsZSkge1xuICAgICAgZ2wuZGVsZXRlUHJvZ3JhbSh0aGlzLmhhbmRsZSk7XG4gICAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIH1cbiAgICB0aGlzLmhhbmRsZSA9IG51bGw7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBfY29tcGlsZUFuZExpbmsodnMsIGZzKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuYXR0YWNoU2hhZGVyKHRoaXMuaGFuZGxlLCB0aGlzLnZzLmhhbmRsZSk7XG4gICAgZ2wuYXR0YWNoU2hhZGVyKHRoaXMuaGFuZGxlLCB0aGlzLmZzLmhhbmRsZSk7XG4gICAgZ2wubGlua1Byb2dyYW0odGhpcy5oYW5kbGUpO1xuICAgIGdsLnZhbGlkYXRlUHJvZ3JhbSh0aGlzLmhhbmRsZSk7XG4gICAgY29uc3QgbGlua2VkID0gZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcih0aGlzLmhhbmRsZSwgZ2wuTElOS19TVEFUVVMpO1xuICAgIGlmICghbGlua2VkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yIGxpbmtpbmcgJHtnbC5nZXRQcm9ncmFtSW5mb0xvZyh0aGlzLmhhbmRsZSl9YCk7XG4gICAgfVxuICB9XG5cbiAgdXNlKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLnVzZVByb2dyYW0odGhpcy5oYW5kbGUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gREVQUkVDQVRFRCBNRVRIT0RTXG4gIGNsZWFyQnVmZmVycygpIHtcbiAgICB0aGlzLl9maWxsZWRMb2NhdGlvbnMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIF9wcmludChidWZmZXJOYW1lKSB7XG4gICAgcmV0dXJuIGBQcm9ncmFtICR7dGhpcy5pZH06IEF0dHJpYnV0ZSAke2J1ZmZlck5hbWV9YDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBdHRhY2ggYSBtYXAgb2YgQnVmZmVycyB2YWx1ZXMgdG8gYSBwcm9ncmFtXG4gICAqIE9ubHkgYXR0cmlidXRlcyB3aXRoIG5hbWVzIGFjdHVhbGx5IHByZXNlbnQgaW4gdGhlIGxpbmtlZCBwcm9ncmFtXG4gICAqIHdpbGwgYmUgdXBkYXRlZC4gT3RoZXIgc3VwcGxpZWQgYnVmZmVycyB3aWxsIGJlIGlnbm9yZWQuXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBidWZmZXJzIC0gQW4gb2JqZWN0IG1hcCB3aXRoIGF0dHJpYnV0ZSBuYW1lcyBiZWluZyBrZXlzXG4gICAqICBhbmQgdmFsdWVzIGFyZSBleHBlY3RlZCB0byBiZSBpbnN0YW5jZXMgb2YgQnVmZmVyLlxuICAgKiBAcmV0dXJucyB7UHJvZ3JhbX0gUmV0dXJucyBpdHNlbGYgZm9yIGNoYWluaW5nLlxuICAgKi9cbiAgLyogZXNsaW50LWRpc2FibGUgbWF4LXN0YXRlbWVudHMgKi9cbiAgc2V0QnVmZmVycyhidWZmZXJzLCB7Y2xlYXIgPSB0cnVlLCBjaGVjayA9IHRydWUsIGRyYXdQYXJhbXMgPSB7fX0gPSB7fSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGlmIChBcnJheS5pc0FycmF5KGJ1ZmZlcnMpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Byb2dyYW0uc2V0QnVmZmVycyBleHBlY3RzIG1hcCBvZiBidWZmZXJzJyk7XG4gICAgfVxuXG4gICAgaWYgKGNsZWFyKSB7XG4gICAgICB0aGlzLmNsZWFyQnVmZmVycygpO1xuICAgIH1cblxuICAgIC8vIGluZGV4aW5nIGlzIGF1dG9kZXRlY3RlZCAtIGJ1ZmZlciB3aXRoIHRhcmdldCBnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUlxuICAgIC8vIGluZGV4IHR5cGUgaXMgc2F2ZWQgZm9yIGRyYXdFbGVtZW50IGNhbGxzXG4gICAgZHJhd1BhcmFtcy5pc0luc3RhbmNlZCA9IGZhbHNlO1xuICAgIGRyYXdQYXJhbXMuaXNJbmRleGVkID0gZmFsc2U7XG4gICAgZHJhd1BhcmFtcy5pbmRleFR5cGUgPSBudWxsO1xuXG4gICAgY29uc3Qge2xvY2F0aW9ucywgZWxlbWVudHN9ID0gdGhpcy5fc29ydEJ1ZmZlcnNCeUxvY2F0aW9uKGJ1ZmZlcnMpO1xuXG4gICAgLy8gUHJvY2VzcyBsb2NhdGlvbnMgaW4gb3JkZXJcbiAgICBmb3IgKGxldCBsb2NhdGlvbiA9IDA7IGxvY2F0aW9uIDwgbG9jYXRpb25zLmxlbmd0aDsgKytsb2NhdGlvbikge1xuICAgICAgY29uc3QgYnVmZmVyTmFtZSA9IGxvY2F0aW9uc1tsb2NhdGlvbl07XG4gICAgICBjb25zdCBidWZmZXIgPSBidWZmZXJzW2J1ZmZlck5hbWVdO1xuICAgICAgLy8gRElTQUJMRSBNSVNTSU5HIEFUVFJJQlVURVxuICAgICAgaWYgKCFidWZmZXIpIHtcbiAgICAgICAgVmVydGV4QXR0cmlidXRlcy5kaXNhYmxlKGdsLCBsb2NhdGlvbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBkaXZpc29yID0gYnVmZmVyLmxheW91dC5pbnN0YW5jZWQgPyAxIDogMDtcbiAgICAgICAgVmVydGV4QXR0cmlidXRlcy5lbmFibGUoZ2wsIGxvY2F0aW9uKTtcbiAgICAgICAgVmVydGV4QXR0cmlidXRlcy5zZXRCdWZmZXIoe2dsLCBsb2NhdGlvbiwgYnVmZmVyfSk7XG4gICAgICAgIFZlcnRleEF0dHJpYnV0ZXMuc2V0RGl2aXNvcihnbCwgbG9jYXRpb24sIGRpdmlzb3IpO1xuICAgICAgICBkcmF3UGFyYW1zLmlzSW5zdGFuY2VkID0gYnVmZmVyLmxheW91dC5pbnN0YW5jZWQgPiAwO1xuICAgICAgICB0aGlzLl9maWxsZWRMb2NhdGlvbnNbYnVmZmVyTmFtZV0gPSB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFNFVCBFTEVNRU5UUyBBUlJBWSBCVUZGRVJcbiAgICBpZiAoZWxlbWVudHMpIHtcbiAgICAgIGNvbnN0IGJ1ZmZlciA9IGJ1ZmZlcnNbZWxlbWVudHNdO1xuICAgICAgYnVmZmVyLmJpbmQoKTtcbiAgICAgIGRyYXdQYXJhbXMuaXNJbmRleGVkID0gdHJ1ZTtcbiAgICAgIGRyYXdQYXJhbXMuaW5kZXhUeXBlID0gYnVmZmVyLmxheW91dC50eXBlO1xuICAgIH1cblxuICAgIGlmIChjaGVjaykge1xuICAgICAgdGhpcy5jaGVja0J1ZmZlcnMoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICAvKiBlc2xpbnQtZW5hYmxlIG1heC1zdGF0ZW1lbnRzICovXG5cbiAgX3NvcnRCdWZmZXJzQnlMb2NhdGlvbihidWZmZXJzKSB7XG4gICAgbGV0IGVsZW1lbnRzID0gbnVsbDtcbiAgICBjb25zdCBsb2NhdGlvbnMgPSBuZXcgQXJyYXkodGhpcy5fYXR0cmlidXRlQ291bnQpO1xuXG4gICAgZm9yIChjb25zdCBidWZmZXJOYW1lIGluIGJ1ZmZlcnMpIHtcbiAgICAgIGNvbnN0IGJ1ZmZlciA9IEJ1ZmZlci5tYWtlRnJvbSh0aGlzLmdsLCBidWZmZXJzW2J1ZmZlck5hbWVdKTtcbiAgICAgIGNvbnN0IGxvY2F0aW9uID0gdGhpcy5fYXR0cmlidXRlTG9jYXRpb25zW2J1ZmZlck5hbWVdO1xuICAgICAgaWYgKGxvY2F0aW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKGJ1ZmZlci50YXJnZXQgPT09IEdMLkVMRU1FTlRfQVJSQVlfQlVGRkVSICYmIGVsZW1lbnRzKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgYCR7dGhpcy5fcHJpbnQoYnVmZmVyTmFtZSl9IGR1cGxpY2F0ZSBnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUmApO1xuICAgICAgICB9IGVsc2UgaWYgKGJ1ZmZlci50YXJnZXQgPT09IEdMLkVMRU1FTlRfQVJSQVlfQlVGRkVSKSB7XG4gICAgICAgICAgZWxlbWVudHMgPSBidWZmZXJOYW1lO1xuICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLl93YXJuW2J1ZmZlck5hbWVdKSB7XG4gICAgICAgICAgbG9nLndhcm4oMiwgYCR7dGhpcy5fcHJpbnQoYnVmZmVyTmFtZSl9IG5vdCB1c2VkYCk7XG4gICAgICAgICAgdGhpcy5fd2FybltidWZmZXJOYW1lXSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChidWZmZXIudGFyZ2V0ID09PSBHTC5FTEVNRU5UX0FSUkFZX0JVRkZFUikge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLl9wcmludChidWZmZXJOYW1lKX06JHtsb2NhdGlvbn0gYCArXG4gICAgICAgICAgICBgaGFzIGJvdGggbG9jYXRpb24gYW5kIHR5cGUgZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVJgKTtcbiAgICAgICAgfVxuICAgICAgICBsb2NhdGlvbnNbbG9jYXRpb25dID0gYnVmZmVyTmFtZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge2xvY2F0aW9ucywgZWxlbWVudHN9O1xuICB9XG5cbiAgY2hlY2tCdWZmZXJzKCkge1xuICAgIGZvciAoY29uc3QgYXR0cmlidXRlTmFtZSBpbiB0aGlzLl9hdHRyaWJ1dGVMb2NhdGlvbnMpIHtcbiAgICAgIGlmICghdGhpcy5fZmlsbGVkTG9jYXRpb25zW2F0dHJpYnV0ZU5hbWVdICYmICF0aGlzLl93YXJuW2F0dHJpYnV0ZU5hbWVdKSB7XG4gICAgICAgIGNvbnN0IGxvY2F0aW9uID0gdGhpcy5fYXR0cmlidXRlTG9jYXRpb25zW2F0dHJpYnV0ZU5hbWVdO1xuICAgICAgICAvLyB0aHJvdyBuZXcgRXJyb3IoYFByb2dyYW0gJHt0aGlzLmlkfTogYCArXG4gICAgICAgIC8vICAgYEF0dHJpYnV0ZSAke2xvY2F0aW9ufToke2F0dHJpYnV0ZU5hbWV9IG5vdCBzdXBwbGllZGApO1xuICAgICAgICBsb2cud2FybigwLCBgUHJvZ3JhbSAke3RoaXMuaWR9OiBgICtcbiAgICAgICAgICBgQXR0cmlidXRlICR7bG9jYXRpb259OiR7YXR0cmlidXRlTmFtZX0gbm90IHN1cHBsaWVkYCk7XG4gICAgICAgIHRoaXMuX3dhcm5bYXR0cmlidXRlTmFtZV0gPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qXG4gICAqIEByZXR1cm5zIHtQcm9ncmFtfSBSZXR1cm5zIGl0c2VsZiBmb3IgY2hhaW5pbmcuXG4gICAqL1xuICB1bnNldEJ1ZmZlcnMoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgY29uc3QgbGVuZ3RoID0gdGhpcy5fYXR0cmlidXRlQ291bnQ7XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgICAgLy8gVmVydGV4QXR0cmlidXRlcy5zZXREaXZpc29yKGdsLCBpLCAwKTtcbiAgICAgIFZlcnRleEF0dHJpYnV0ZXMuZGlzYWJsZShnbCwgaSk7XG4gICAgfVxuICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIG51bGwpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcGx5IGEgc2V0IG9mIHVuaWZvcm0gdmFsdWVzIHRvIGEgcHJvZ3JhbVxuICAgKiBPbmx5IHVuaWZvcm1zIHdpdGggbmFtZXMgYWN0dWFsbHkgcHJlc2VudCBpbiB0aGUgbGlua2VkIHByb2dyYW1cbiAgICogd2lsbCBiZSB1cGRhdGVkLlxuICAgKiBvdGhlciB1bmlmb3JtcyB3aWxsIGJlIGlnbm9yZWRcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IHVuaWZvcm1NYXAgLSBBbiBvYmplY3Qgd2l0aCBuYW1lcyBiZWluZyBrZXlzXG4gICAqIEByZXR1cm5zIHtQcm9ncmFtfSAtIHJldHVybnMgaXRzZWxmIGZvciBjaGFpbmluZy5cbiAgICovXG4gIC8qIGVzbGludC1kaXNhYmxlIG1heC1kZXB0aCAqL1xuICBzZXRVbmlmb3Jtcyh1bmlmb3Jtcykge1xuICAgIGZvciAoY29uc3QgdW5pZm9ybU5hbWUgaW4gdW5pZm9ybXMpIHtcbiAgICAgIGNvbnN0IHVuaWZvcm0gPSB1bmlmb3Jtc1t1bmlmb3JtTmFtZV07XG4gICAgICBjb25zdCB1bmlmb3JtU2V0dGVyID0gdGhpcy5fdW5pZm9ybVNldHRlcnNbdW5pZm9ybU5hbWVdO1xuICAgICAgaWYgKHVuaWZvcm1TZXR0ZXIpIHtcbiAgICAgICAgaWYgKHVuaWZvcm0gaW5zdGFuY2VvZiBUZXh0dXJlKSB7XG4gICAgICAgICAgaWYgKHVuaWZvcm1TZXR0ZXIudGV4dHVyZUluZGV4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHVuaWZvcm1TZXR0ZXIudGV4dHVyZUluZGV4ID0gdGhpcy5fdGV4dHVyZUluZGV4Q291bnRlcisrO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBCaW5kIHRleHR1cmUgdG8gaW5kZXgsIGFuZCBzZXQgdGhlIHVuaWZvcm0gc2FtcGxlciB0byB0aGUgaW5kZXhcbiAgICAgICAgICBjb25zdCB0ZXh0dXJlID0gdW5pZm9ybTtcbiAgICAgICAgICBjb25zdCB7dGV4dHVyZUluZGV4fSA9IHVuaWZvcm1TZXR0ZXI7XG4gICAgICAgICAgLy8gY29uc29sZS5kZWJ1Zygnc2V0dGluZyB0ZXh0dXJlJywgdGV4dHVyZUluZGV4LCB0ZXh0dXJlKTtcbiAgICAgICAgICB0ZXh0dXJlLmJpbmQodGV4dHVyZUluZGV4KTtcbiAgICAgICAgICB1bmlmb3JtU2V0dGVyKHRleHR1cmVJbmRleCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gSnVzdCBzZXQgdGhlIHZhbHVlXG4gICAgICAgICAgdW5pZm9ybVNldHRlcih1bmlmb3JtKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICAvKiBlc2xpbnQtZW5hYmxlIG1heC1kZXB0aCAqL1xuXG4gIGdldEF0dGFjaGVkU2hhZGVyc0NvdW50KCkge1xuICAgIHJldHVybiB0aGlzLmdldFByb2dyYW1QYXJhbWV0ZXIodGhpcy5nbC5BVFRBQ0hFRF9TSEFERVJTKTtcbiAgfVxuXG4gIC8vIEFUVFJJQlVURVMgQVBJXG4gIC8vIE5vdGU6IExvY2F0aW9ucyBhcmUgbnVtZXJpYyBpbmRpY2VzXG5cbiAgZ2V0QXR0cmlidXRlQ291bnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UHJvZ3JhbVBhcmFtZXRlcih0aGlzLmdsLkFDVElWRV9BVFRSSUJVVEVTKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIGluZm8gYWJvdXQgYXR0cmlidXRlIGF0IGluZGV4IFwibG9jYXRpb25cIi9cbiAgICogQHBhcmFtIHtpbnR9IGxvY2F0aW9uIC0gaW5kZXggb2YgYW4gYXR0cmlidXRlXG4gICAqIEByZXR1cm5zIHtXZWJHTEFjdGl2ZUluZm99IC0gaW5mbyBhYm91dCBhbiBhY3RpdmUgYXR0cmlidXRlXG4gICAqICAgZmllbGRzOiB7bmFtZSwgc2l6ZSwgdHlwZX1cbiAgICovXG4gIGdldEF0dHJpYnV0ZUluZm8obG9jYXRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5nbC5nZXRBY3RpdmVBdHRyaWIodGhpcy5oYW5kbGUsIGxvY2F0aW9uKTtcbiAgfVxuXG4gIGdldEF0dHJpYnV0ZU5hbWUobG9jYXRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5nZXRBdHRyaWJ1dGVJbmZvKGxvY2F0aW9uKS5uYW1lO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgbG9jYXRpb24gKGluZGV4KSBvZiBhIG5hbWVcbiAgICogQHBhcmFtIHtTdHJpbmd9IGF0dHJpYnV0ZU5hbWUgLSBuYW1lIG9mIGFuIGF0dHJpYnV0ZVxuICAgKiAgIChtYXRjaGVzIG5hbWUgaW4gYSBsaW5rZWQgc2hhZGVyKVxuICAgKiBAcmV0dXJucyB7U3RyaW5nW119IC0gYXJyYXkgb2YgYWN0dWFsIGF0dHJpYnV0ZSBuYW1lcyBmcm9tIHNoYWRlciBsaW5raW5nXG4gICAqL1xuICBnZXRBdHRyaWJ1dGVMb2NhdGlvbihhdHRyaWJ1dGVOYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2wuZ2V0QXR0cmliTG9jYXRpb24odGhpcy5oYW5kbGUsIGF0dHJpYnV0ZU5hbWUpO1xuICB9XG5cbiAgLy8gVU5JRk9STVMgQVBJXG4gIC8vIE5vdGU6IGxvY2F0aW9ucyBhcmUgb3BhcXVlIHN0cnVjdHVyZXNcblxuICBnZXRVbmlmb3JtQ291bnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UHJvZ3JhbVBhcmFtZXRlcihHTC5BQ1RJVkVfVU5JRk9STVMpO1xuICB9XG5cbiAgLypcbiAgICogQHJldHVybnMge1dlYkdMQWN0aXZlSW5mb30gLSBvYmplY3Qgd2l0aCB7bmFtZSwgc2l6ZSwgdHlwZX1cbiAgICovXG4gIGdldFVuaWZvcm1JbmZvKGluZGV4KSB7XG4gICAgcmV0dXJuIHRoaXMuZ2wuZ2V0QWN0aXZlVW5pZm9ybSh0aGlzLmhhbmRsZSwgaW5kZXgpO1xuICB9XG5cbiAgLypcbiAgICogQHJldHVybnMge1dlYkdMVW5pZm9ybUxvY2F0aW9ufSAtIG9wYXF1ZSBvYmplY3QgcmVwcmVzZW50aW5nIGxvY2F0aW9uXG4gICAqIG9mIHVuaWZvcm0sIHVzZWQgYnkgc2V0dGVyIG1ldGhvZHNcbiAgICovXG4gIGdldFVuaWZvcm1Mb2NhdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHRoaXMuaGFuZGxlLCBuYW1lKTtcbiAgfVxuXG4gIGdldFVuaWZvcm1WYWx1ZShsb2NhdGlvbikge1xuICAgIHJldHVybiB0aGlzLmdsLmdldFVuaWZvcm0odGhpcy5oYW5kbGUsIGxvY2F0aW9uKTtcbiAgfVxuXG4gIC8vIFBST0dSQU0gQVBJXG5cbiAgaXNGbGFnZ2VkRm9yRGVsZXRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UHJvZ3JhbVBhcmFtZXRlcih0aGlzLmdsLkRFTEVURV9TVEFUVVMpO1xuICB9XG5cbiAgZ2V0TGFzdExpbmtTdGF0dXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UHJvZ3JhbVBhcmFtZXRlcih0aGlzLmdsLkxJTktfU1RBVFVTKTtcbiAgfVxuXG4gIGdldExhc3RWYWxpZGF0aW9uU3RhdHVzKCkge1xuICAgIHJldHVybiB0aGlzLmdldFByb2dyYW1QYXJhbWV0ZXIodGhpcy5nbC5WQUxJREFURV9TVEFUVVMpO1xuICB9XG5cbiAgLy8gV0VCR0wyIElOVEVSRkFDRVxuXG4gIC8vIFRoaXMgbWF5IGJlIGdsLlNFUEFSQVRFX0FUVFJJQlMgb3IgZ2wuSU5URVJMRUFWRURfQVRUUklCUy5cbiAgZ2V0VHJhbnNmb3JtRmVlZGJhY2tCdWZmZXJNb2RlKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGFzc2VydChnbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQsIEVSUl9XRUJHTDIpO1xuICAgIHJldHVybiB0aGlzLmdldFByb2dyYW1QYXJhbWV0ZXIodGhpcy5nbC5UUkFOU0ZPUk1fRkVFREJBQ0tfQlVGRkVSX01PREUpO1xuICB9XG5cbiAgZ2V0VHJhbnNmb3JtRmVlZGJhY2tWYXJ5aW5nc0NvdW50KCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGFzc2VydChnbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQsIEVSUl9XRUJHTDIpO1xuICAgIHJldHVybiB0aGlzLmdldFByb2dyYW1QYXJhbWV0ZXIodGhpcy5nbC5UUkFOU0ZPUk1fRkVFREJBQ0tfVkFSWUlOR1MpO1xuICB9XG5cbiAgZ2V0QWN0aXZlVW5pZm9ybUJsb2Nrc0NvdW50KCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGFzc2VydChnbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQsIEVSUl9XRUJHTDIpO1xuICAgIHJldHVybiB0aGlzLmdldFByb2dyYW1QYXJhbWV0ZXIodGhpcy5nbC5BQ1RJVkVfVU5JRk9STV9CTE9DS1MpO1xuICB9XG5cbiAgLy8gUmV0cmlldmVzIHRoZSBhc3NpZ25lZCBjb2xvciBudW1iZXIgYmluZGluZyBmb3IgdGhlIHVzZXItZGVmaW5lZCB2YXJ5aW5nXG4gIC8vIG91dCB2YXJpYWJsZSBuYW1lIGZvciBwcm9ncmFtLiBwcm9ncmFtIG11c3QgaGF2ZSBwcmV2aW91c2x5IGJlZW4gbGlua2VkLlxuICAvLyBbV2ViR0xIYW5kbGVzQ29udGV4dExvc3NdXG4gIGdldEZyYWdEYXRhTG9jYXRpb24odmFyeWluZ05hbWUpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBhc3NlcnQoZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LCBFUlJfV0VCR0wyKTtcbiAgICBjb25zdCBsb2NhdGlvbiA9IGdsLmdldEZyYWdEYXRhTG9jYXRpb24odGhpcy5oYW5kbGUsIHZhcnlpbmdOYW1lKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiBsb2NhdGlvbjtcbiAgfVxuXG4gIC8vIFJldHVybiB0aGUgdmFsdWUgZm9yIHRoZSBwYXNzZWQgcG5hbWUgZ2l2ZW4gdGhlIHBhc3NlZCBwcm9ncmFtLlxuICAvLyBUaGUgdHlwZSByZXR1cm5lZCBpcyB0aGUgbmF0dXJhbCB0eXBlIGZvciB0aGUgcmVxdWVzdGVkIHBuYW1lLFxuICAvLyBhcyBnaXZlbiBpbiB0aGUgZm9sbG93aW5nIHRhYmxlOlxuICAvLyBwbmFtZSByZXR1cm5lZCB0eXBlXG4gIC8vIERFTEVURV9TVEFUVVMgR0xib29sZWFuXG4gIC8vIExJTktfU1RBVFVTIEdMYm9vbGVhblxuICAvLyBWQUxJREFURV9TVEFUVVMgR0xib29sZWFuXG4gIC8vIEFUVEFDSEVEX1NIQURFUlMgIEdMaW50XG4gIC8vIEFDVElWRV9BVFRSSUJVVEVTIEdMaW50XG4gIC8vIEFDVElWRV9VTklGT1JNUyBHTGludFxuICAvLyBUUkFOU0ZPUk1fRkVFREJBQ0tfQlVGRkVSX01PREUgIEdMZW51bVxuICAvLyBUUkFOU0ZPUk1fRkVFREJBQ0tfVkFSWUlOR1MgR0xpbnRcbiAgLy8gQUNUSVZFX1VOSUZPUk1fQkxPQ0tTIEdMaW50XG4gIGdldFByb2dyYW1QYXJhbWV0ZXIocG5hbWUpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBjb25zdCBwYXJhbWV0ZXIgPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHRoaXMuaGFuZGxlLCBwbmFtZSk7XG4gICAgZ2xDaGVja0Vycm9yKGdsKTtcbiAgICByZXR1cm4gcGFyYW1ldGVyO1xuICB9XG5cbiAgLy8gUFJJVkFURSBNRVRIT0RTXG5cbiAgLy8gQ2hlY2sgdGhhdCBhbGwgYWN0aXZlIGF0dHJpYnV0ZXMgYXJlIGVuYWJsZWRcbiAgX2FyZUFsbEF0dHJpYnV0ZXNFbmFibGVkKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGNvbnN0IGxlbmd0aCA9IHRoaXMuX2F0dHJpYnV0ZUNvdW50O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICAgIGlmICghVmVydGV4QXR0cmlidXRlcy5pc0VuYWJsZWQoZ2wsIGkpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyBkZXRlcm1pbmUgYXR0cmlidXRlIGxvY2F0aW9ucyAobWFwcyBhdHRyaWJ1dGUgbmFtZSB0byBpbmRleClcbiAgX2dldEF0dHJpYnV0ZUxvY2F0aW9ucygpIHtcbiAgICBjb25zdCBhdHRyaWJ1dGVMb2NhdGlvbnMgPSB7fTtcbiAgICBjb25zdCBsZW5ndGggPSB0aGlzLmdldEF0dHJpYnV0ZUNvdW50KCk7XG4gICAgZm9yIChsZXQgbG9jYXRpb24gPSAwOyBsb2NhdGlvbiA8IGxlbmd0aDsgbG9jYXRpb24rKykge1xuICAgICAgY29uc3QgbmFtZSA9IHRoaXMuZ2V0QXR0cmlidXRlTmFtZShsb2NhdGlvbik7XG4gICAgICBhdHRyaWJ1dGVMb2NhdGlvbnNbbmFtZV0gPSBsb2NhdGlvbjtcbiAgICB9XG4gICAgcmV0dXJuIGF0dHJpYnV0ZUxvY2F0aW9ucztcbiAgfVxuXG4gIC8vIGNyZWF0ZSB1bmlmb3JtIHNldHRlcnNcbiAgLy8gTWFwIG9mIHVuaWZvcm0gbmFtZXMgdG8gc2V0dGVyIGZ1bmN0aW9uc1xuICBfZ2V0VW5pZm9ybVNldHRlcnMoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgY29uc3QgdW5pZm9ybVNldHRlcnMgPSB7fTtcbiAgICBjb25zdCBsZW5ndGggPSB0aGlzLmdldFVuaWZvcm1Db3VudCgpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGluZm8gPSB0aGlzLmdldFVuaWZvcm1JbmZvKGkpO1xuICAgICAgY29uc3QgcGFyc2VkTmFtZSA9IHBhcnNlVW5pZm9ybU5hbWUoaW5mby5uYW1lKTtcbiAgICAgIGNvbnN0IGxvY2F0aW9uID0gdGhpcy5nZXRVbmlmb3JtTG9jYXRpb24ocGFyc2VkTmFtZS5uYW1lKTtcbiAgICAgIHVuaWZvcm1TZXR0ZXJzW3BhcnNlZE5hbWUubmFtZV0gPVxuICAgICAgICBnZXRVbmlmb3JtU2V0dGVyKGdsLCBsb2NhdGlvbiwgaW5mbywgcGFyc2VkTmFtZS5pc0FycmF5KTtcbiAgICB9XG4gICAgcmV0dXJuIHVuaWZvcm1TZXR0ZXJzO1xuICB9XG5cbiAgLy8gUkVNT1ZFRFxuXG4gIC8qXG4gICAqIEJpbmRzIGFycmF5IG9mIHRleHR1cmVzLCBhdCBpbmRpY2VzIGNvcnJlc3BvbmRpbmcgdG8gcG9zaXRpb25zIGluIGFycmF5XG4gICAqL1xuICBzZXRUZXh0dXJlcyh0ZXh0dXJlcykge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGV4dHVyZXMgcmVwbGFjZWQgd2l0aCBzZXRBdHRyaWJ1dGVzJyk7XG4gICAgLy8gYXNzZXJ0KEFycmF5LmlzQXJyYXkodGV4dHVyZXMpLCAnc2V0VGV4dHVyZXMgcmVxdWlyZXMgYXJyYXkgdGV4dHVyZXMnKTtcbiAgICAvLyBmb3IgKGxldCBpID0gMDsgaSA8IHRleHR1cmVzLmxlbmd0aDsgKytpKSB7XG4gICAgLy8gICB0ZXh0dXJlc1tpXS5iaW5kKGkpO1xuICAgIC8vIH1cbiAgICAvLyByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHVuc2V0VGV4dHVyZXModGV4dHVyZXMpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Vuc2V0VGV4dHVyZXMgcmVwbGFjZWQgd2l0aCBzZXRBdHRyaWJ1dGVzJyk7XG4gICAgLy8gYXNzZXJ0KEFycmF5LmlzQXJyYXkodGV4dHVyZXMpLCAndW5zZXRUZXh0dXJlcyByZXF1aXJlcyBhcnJheSB0ZXh0dXJlcycpO1xuICAgIC8vIGZvciAobGV0IGkgPSAwOyBpIDwgdGV4dHVyZXMubGVuZ3RoOyArK2kpIHtcbiAgICAvLyAgIHRleHR1cmVzW2ldLnVuYmluZChpKTtcbiAgICAvLyB9XG4gICAgLy8gcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKlxuICAgKiBTZXQgYSB0ZXh0dXJlIGF0IGEgZ2l2ZW4gaW5kZXhcbiAgICovXG4gIHNldFRleHR1cmUodGV4dHVyZSwgaW5kZXgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRleHR1cmUgcmVwbGFjZWQgd2l0aCBzZXRBdHRyaWJ1dGVzJyk7XG4gICAgLy8gdGV4dHVyZS5iaW5kKGluZGV4KTtcbiAgICAvLyByZXR1cm4gdGhpcztcbiAgfVxufVxuXG4vLyBjcmVhdGUgdW5pZm9ybSBzZXR0ZXJzXG4vLyBNYXAgb2YgdW5pZm9ybSBuYW1lcyB0byBzZXR0ZXIgZnVuY3Rpb25zXG5leHBvcnQgZnVuY3Rpb24gZ2V0VW5pZm9ybURlc2NyaXB0b3JzKGdsLCBwcm9ncmFtKSB7XG4gIGNvbnN0IHVuaWZvcm1EZWNyaXB0b3JzID0ge307XG4gIGNvbnN0IGxlbmd0aCA9IHByb2dyYW0uZ2V0VW5pZm9ybUNvdW50KCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBpbmZvID0gcHJvZ3JhbS5nZXRVbmlmb3JtSW5mbyhpKTtcbiAgICBjb25zdCBsb2NhdGlvbiA9IHByb2dyYW0uZ2V0VW5pZm9ybUxvY2F0aW9uKGluZm8ubmFtZSk7XG4gICAgY29uc3QgZGVzY3JpcHRvciA9IGdldFVuaWZvcm1TZXR0ZXIoZ2wsIGxvY2F0aW9uLCBpbmZvKTtcbiAgICB1bmlmb3JtRGVjcmlwdG9yc1tkZXNjcmlwdG9yLm5hbWVdID0gZGVzY3JpcHRvcjtcbiAgfVxuICByZXR1cm4gdW5pZm9ybURlY3JpcHRvcnM7XG59XG5cbiJdfQ==