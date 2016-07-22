'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9wcm9ncmFtLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O1FBc2VnQixxQixHQUFBLHFCOztBQXRlaEI7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0lBQVksZ0I7O0FBQ1o7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUNBOztBQUNBOzs7Ozs7Ozs7O0FBRUEsSUFBTSxhQUFhLGlCQUFuQjs7SUFFcUIsTzs7Ozs7Ozs7Ozs7Ozs7OzZCQVlILEUsRUFBaUI7QUFBQSxVQUFiLE1BQWEseURBQUosRUFBSTs7QUFDL0IsYUFBTyxrQkFBa0IsT0FBbEIsR0FBNEIsTUFBNUI7O0FBRUwsVUFBSSxPQUFKLENBQVksRUFBWixFQUFnQixPQUFoQixDQUF3QixFQUFDLFFBQVEsT0FBTyxNQUFQLElBQWlCLE1BQTFCLEVBQXhCLENBRkY7QUFHRDs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFjRCxtQkFBWSxFQUFaLEVBTVE7QUFBQSxxRUFBSixFQUFJOztBQUFBLFFBTE4sRUFLTSxRQUxOLEVBS007QUFBQSx1QkFKTixFQUlNO0FBQUEsUUFKTixFQUlNLDJCQUpELG9CQUFRLE9BQVIsQ0FBZ0IsRUFJZjtBQUFBLHVCQUhOLEVBR007QUFBQSxRQUhOLEVBR00sMkJBSEQsb0JBQVEsT0FBUixDQUFnQixFQUdmO0FBQUEsb0NBRk4sZUFFTTtBQUFBLFFBRk4sZUFFTSx3Q0FGWSxvQkFBUSxPQUFSLENBQWdCLGVBRTVCO0FBQUEsUUFETixNQUNNLFFBRE4sTUFDTTs7QUFBQTs7QUFDTixrREFBNEIsRUFBNUI7O0FBRUEsUUFBSSxVQUFVLE1BQVYsR0FBbUIsQ0FBdkIsRUFBMEI7QUFDeEIsWUFBTSxJQUFJLEtBQUosQ0FBVSx3REFBVixDQUFOO0FBQ0Q7O0FBRUQsU0FBSyxFQUFMLEdBQVUseUJBQWlCLEVBQWpCLEVBQXFCLEVBQXJCLENBQVY7QUFDQSxTQUFLLEVBQUwsR0FBVSwyQkFBbUIsRUFBbkIsRUFBdUIsRUFBdkIsQ0FBVjs7O0FB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LEVBQXFDLFdBQVcsT0FBaEQsQ0FERjtBQUVEO0FBQ0QsYUFBTyxjQUFQO0FBQ0Q7Ozs7Ozs7Ozs7Z0NBT1csUSxFQUFVO0FBQ3BCLFlBQU0sSUFBSSxLQUFKLENBQVUseUNBQVYsQ0FBTjs7Ozs7O0FBTUQ7OztrQ0FFYSxRLEVBQVU7QUFDdEIsWUFBTSxJQUFJLEtBQUosQ0FBVSwyQ0FBVixDQUFOOzs7Ozs7QUFNRDs7Ozs7Ozs7K0JBS1UsTyxFQUFTLEssRUFBTztBQUN6QixZQUFNLElBQUksS0FBSixDQUFVLHdDQUFWLENBQU47OztBQUdEOzs7Ozs7Ozs7O2tCQW5ka0IsTztBQXdkZCxTQUFTLHFCQUFULENBQStCLEVBQS9CLEVBQW1DLE9BQW5DLEVBQTRDO0FBQ2pELE1BQU0sb0JBQW9CLEVBQTFCO0FBQ0EsTUFBTSxTQUFTLFFBQVEsZUFBUixFQUFmO0FBQ0EsT0FBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLE1BQXBCLEVBQTRCLEdBQTVCLEVBQWlDO0FBQy9CLFFBQU0sT0FBTyxRQUFRLGNBQVIsQ0FBdUIsQ0FBdkIsQ0FBYjtBQUNBLFFBQU0sV0FBVyxRQUFRLGtCQUFSLENBQTJCLEtBQUssSUFBaEMsQ0FBakI7QUFDQSxRQUFNLGFBQWEsZ0NBQWlCLEVBQWpCLEVBQXFCLFFBQXJCLEVBQStCLElBQS9CLENBQW5CO0FBQ0Esc0JBQWtCLFdBQVcsSUFBN0IsSUFBcUMsVUFBckM7QUFDRDtBQUNELFNBQU8saUJBQVA7QUFDRCIsImZpbGUiOiJwcm9ncmFtLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtHTCwgV2ViR0wyUmVuZGVyaW5nQ29udGV4dH0gZnJvbSAnLi93ZWJnbC10eXBlcyc7XG5pbXBvcnQge2Fzc2VydFdlYkdMUmVuZGVyaW5nQ29udGV4dH0gZnJvbSAnLi93ZWJnbC1jaGVja3MnO1xuaW1wb3J0IHtnbENoZWNrRXJyb3J9IGZyb20gJy4vY29udGV4dCc7XG5pbXBvcnQgKiBhcyBWZXJ0ZXhBdHRyaWJ1dGVzIGZyb20gJy4vdmVydGV4LWF0dHJpYnV0ZXMnO1xuaW1wb3J0IEJ1ZmZlciBmcm9tICcuL2J1ZmZlcic7XG5pbXBvcnQge1RleHR1cmV9IGZyb20gJy4vdGV4dHVyZSc7XG5pbXBvcnQge3BhcnNlVW5pZm9ybU5hbWUsIGdldFVuaWZvcm1TZXR0ZXJ9IGZyb20gJy4vdW5pZm9ybXMnO1xuaW1wb3J0IHtWZXJ0ZXhTaGFkZXIsIEZyYWdtZW50U2hhZGVyfSBmcm9tICcuL3NoYWRlcic7XG5pbXBvcnQgU0hBREVSUyBmcm9tICcuLi8uLi9zaGFkZXJsaWInO1xuaW1wb3J0IHtsb2csIHVpZH0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG5jb25zdCBFUlJfV0VCR0wyID0gJ1dlYkdMMiByZXF1aXJlZCc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFByb2dyYW0ge1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgUHJvZ3JhbSB3cmFwcGVkIFdlYkdMUHJvZ3JhbSBmcm9tIGEgdmFyaWV0eSBvZiBpbnB1dHMuXG4gICAqIEFsbG93cyBvdGhlciBmdW5jdGlvbnMgdG8gdHJhbnNwYXJlbnRseSBhY2NlcHQgcmF3IFdlYkdMUHJvZ3JhbXMgZXRjXG4gICAqIGFuZCBtYW5pcHVsYXRlIHRoZW0gdXNpbmcgdGhlIG1ldGhvZHMgaW4gdGhlIGBQcm9ncmFtYCBjbGFzcy5cbiAgICogQ2hlY2tzIGZvciBcIi5oYW5kbGVcIlxuICAgKlxuICAgKiBAcGFyYW0ge1dlYkdMUmVuZGVyaW5nQ29udGV4dH0gZ2wgLSBpZiBhIG5ldyBidWZmZXIgbmVlZHMgdG8gYmUgaW5pdGlhbGl6ZWRcbiAgICogQHBhcmFtIHsqfSBvYmplY3QgLSBjYW5kaWRhdGUgdGhhdCB3aWxsIGJlIGNvZXJjZWQgdG8gYSBidWZmZXJcbiAgICogQHJldHVybnMge1Byb2dyYW19IC0gUHJvZ3JhbSBvYmplY3QgdGhhdCB3cmFwcyB0aGUgYnVmZmVyIHBhcmFtZXRlclxuICAgKi9cbiAgc3RhdGljIG1ha2VGcm9tKGdsLCBvYmplY3QgPSB7fSkge1xuICAgIHJldHVybiBvYmplY3QgaW5zdGFuY2VvZiBQcm9ncmFtID8gb2JqZWN0IDpcbiAgICAgIC8vIFVzZSAuaGFuZGxlIGlmIGF2YWlsYWJsZSwgZWxzZSB1c2UgJ3Byb2dyYW0nIGRpcmVjdGx5XG4gICAgICBuZXcgUHJvZ3JhbShnbCkuc2V0RGF0YSh7aGFuZGxlOiBvYmplY3QuaGFuZGxlIHx8IG9iamVjdH0pO1xuICB9XG5cbiAgLypcbiAgICogQGNsYXNzZGVzY1xuICAgKiBIYW5kbGVzIGNyZWF0aW9uIG9mIHByb2dyYW1zLCBtYXBwaW5nIG9mIGF0dHJpYnV0ZXMgYW5kIHVuaWZvcm1zXG4gICAqXG4gICAqIEBjbGFzc1xuICAgKiBAcGFyYW0ge1dlYkdMUmVuZGVyaW5nQ29udGV4dH0gZ2wgLSBnbCBjb250ZXh0XG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIC0gb3B0aW9uc1xuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0cy52cyAtIFZlcnRleCBzaGFkZXIgc291cmNlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBvcHRzLmZzIC0gRnJhZ21lbnQgc2hhZGVyIHNvdXJjZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0cy5pZD0gLSBJZFxuICAgKi9cbiAgLyogZXNsaW50LWRpc2FibGUgbWF4LXN0YXRlbWVudHMgKi9cbiAgY29uc3RydWN0b3IoZ2wsIHtcbiAgICBpZCxcbiAgICB2cyA9IFNIQURFUlMuREVGQVVMVC52cyxcbiAgICBmcyA9IFNIQURFUlMuREVGQVVMVC5mcyxcbiAgICBkZWZhdWx0VW5pZm9ybXMgPSBTSEFERVJTLkRFRkFVTFQuZGVmYXVsdFVuaWZvcm1zLFxuICAgIGhhbmRsZVxuICB9ID0ge30pIHtcbiAgICBhc3NlcnRXZWJHTFJlbmRlcmluZ0NvbnRleHQoZ2wpO1xuXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAyKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1dyb25nIG51bWJlciBvZiBhcmd1bWVudHMgdG8gUHJvZ3JhbShnbCwge3ZzLCBmcywgaWR9KScpO1xuICAgIH1cblxuICAgIHRoaXMudnMgPSBuZXcgVmVydGV4U2hhZGVyKGdsLCB2cyk7XG4gICAgdGhpcy5mcyA9IG5ldyBGcmFnbWVudFNoYWRlcihnbCwgZnMpO1xuXG4gICAgLy8gSWYgcHJvZ3JhbSBpcyBub3QgbmFtZWQsIG5hbWUgaXQgYWZ0ZXIgc2hhZGVyIG5hbWVzXG4gICAgbGV0IHByb2dyYW1OYW1lID0gdGhpcy52cy5nZXROYW1lKCkgfHwgdGhpcy5mcy5nZXROYW1lKCk7XG4gICAgcHJvZ3JhbU5hbWUgPSBwcm9ncmFtTmFtZSA/IGAke3Byb2dyYW1OYW1lfS1wcm9ncmFtYCA6IGBwcm9ncmFtYDtcbiAgICB0aGlzLmlkID0gaWQgfHwgdWlkKHByb2dyYW1OYW1lKTtcblxuICAgIHRoaXMuZ2wgPSBnbDtcbiAgICB0aGlzLmRlZmF1bHRVbmlmb3JtcyA9IGRlZmF1bHRVbmlmb3JtcztcbiAgICB0aGlzLmhhbmRsZSA9IGhhbmRsZTtcbiAgICBpZiAoIXRoaXMuaGFuZGxlKSB7XG4gICAgICB0aGlzLmhhbmRsZSA9IGdsLmNyZWF0ZVByb2dyYW0oKTtcbiAgICAgIHRoaXMuX2NvbXBpbGVBbmRMaW5rKHZzLCBmcyk7XG4gICAgfVxuICAgIGlmICghdGhpcy5oYW5kbGUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIGNyZWF0ZSBwcm9ncmFtJyk7XG4gICAgfVxuXG4gICAgLy8gZGV0ZXJtaW5lIGF0dHJpYnV0ZSBsb2NhdGlvbnMgKGkuZS4gaW5kaWNlcylcbiAgICB0aGlzLl9hdHRyaWJ1dGVMb2NhdGlvbnMgPSB0aGlzLl9nZXRBdHRyaWJ1dGVMb2NhdGlvbnMoKTtcbiAgICB0aGlzLl9hdHRyaWJ1dGVDb3VudCA9IHRoaXMuZ2V0QXR0cmlidXRlQ291bnQoKTtcbiAgICB0aGlzLl93YXJuID0gW107XG4gICAgdGhpcy5fZmlsbGVkTG9jYXRpb25zID0ge307XG5cbiAgICAvLyBwcmVwYXJlIHVuaWZvcm0gc2V0dGVyc1xuICAgIHRoaXMuX3VuaWZvcm1TZXR0ZXJzID0gdGhpcy5fZ2V0VW5pZm9ybVNldHRlcnMoKTtcbiAgICB0aGlzLl91bmlmb3JtQ291bnQgPSB0aGlzLmdldFVuaWZvcm1Db3VudCgpO1xuICAgIHRoaXMuX3RleHR1cmVJbmRleENvdW50ZXIgPSAwO1xuXG4gICAgdGhpcy51c2VyRGF0YSA9IHt9O1xuICAgIE9iamVjdC5zZWFsKHRoaXMpO1xuICB9XG4gIC8qIGVzbGludC1lbmFibGUgbWF4LXN0YXRlbWVudHMgKi9cblxuICBkZWxldGUoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgaWYgKHRoaXMuaGFuZGxlKSB7XG4gICAgICBnbC5kZWxldGVQcm9ncmFtKHRoaXMuaGFuZGxlKTtcbiAgICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgfVxuICAgIHRoaXMuaGFuZGxlID0gbnVsbDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIF9jb21waWxlQW5kTGluayh2cywgZnMpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5hdHRhY2hTaGFkZXIodGhpcy5oYW5kbGUsIHRoaXMudnMuaGFuZGxlKTtcbiAgICBnbC5hdHRhY2hTaGFkZXIodGhpcy5oYW5kbGUsIHRoaXMuZnMuaGFuZGxlKTtcbiAgICBnbC5saW5rUHJvZ3JhbSh0aGlzLmhhbmRsZSk7XG4gICAgZ2wudmFsaWRhdGVQcm9ncmFtKHRoaXMuaGFuZGxlKTtcbiAgICBjb25zdCBsaW5rZWQgPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHRoaXMuaGFuZGxlLCBnbC5MSU5LX1NUQVRVUyk7XG4gICAgaWYgKCFsaW5rZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRXJyb3IgbGlua2luZyAke2dsLmdldFByb2dyYW1JbmZvTG9nKHRoaXMuaGFuZGxlKX1gKTtcbiAgICB9XG4gIH1cblxuICB1c2UoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wudXNlUHJvZ3JhbSh0aGlzLmhhbmRsZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBERVBSRUNBVEVEIE1FVEhPRFNcbiAgY2xlYXJCdWZmZXJzKCkge1xuICAgIHRoaXMuX2ZpbGxlZExvY2F0aW9ucyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgX3ByaW50KGJ1ZmZlck5hbWUpIHtcbiAgICByZXR1cm4gYFByb2dyYW0gJHt0aGlzLmlkfTogQXR0cmlidXRlICR7YnVmZmVyTmFtZX1gO1xuICB9XG5cbiAgLyoqXG4gICAqIEF0dGFjaCBhIG1hcCBvZiBCdWZmZXJzIHZhbHVlcyB0byBhIHByb2dyYW1cbiAgICogT25seSBhdHRyaWJ1dGVzIHdpdGggbmFtZXMgYWN0dWFsbHkgcHJlc2VudCBpbiB0aGUgbGlua2VkIHByb2dyYW1cbiAgICogd2lsbCBiZSB1cGRhdGVkLiBPdGhlciBzdXBwbGllZCBidWZmZXJzIHdpbGwgYmUgaWdub3JlZC5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IGJ1ZmZlcnMgLSBBbiBvYmplY3QgbWFwIHdpdGggYXR0cmlidXRlIG5hbWVzIGJlaW5nIGtleXNcbiAgICogIGFuZCB2YWx1ZXMgYXJlIGV4cGVjdGVkIHRvIGJlIGluc3RhbmNlcyBvZiBCdWZmZXIuXG4gICAqIEByZXR1cm5zIHtQcm9ncmFtfSBSZXR1cm5zIGl0c2VsZiBmb3IgY2hhaW5pbmcuXG4gICAqL1xuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cyAqL1xuICBzZXRCdWZmZXJzKGJ1ZmZlcnMsIHtjbGVhciA9IHRydWUsIGNoZWNrID0gdHJ1ZSwgZHJhd1BhcmFtcyA9IHt9fSA9IHt9KSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoYnVmZmVycykpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignUHJvZ3JhbS5zZXRCdWZmZXJzIGV4cGVjdHMgbWFwIG9mIGJ1ZmZlcnMnKTtcbiAgICB9XG5cbiAgICBpZiAoY2xlYXIpIHtcbiAgICAgIHRoaXMuY2xlYXJCdWZmZXJzKCk7XG4gICAgfVxuXG4gICAgLy8gaW5kZXhpbmcgaXMgYXV0b2RldGVjdGVkIC0gYnVmZmVyIHdpdGggdGFyZ2V0IGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSXG4gICAgLy8gaW5kZXggdHlwZSBpcyBzYXZlZCBmb3IgZHJhd0VsZW1lbnQgY2FsbHNcbiAgICBkcmF3UGFyYW1zLmlzSW5zdGFuY2VkID0gZmFsc2U7XG4gICAgZHJhd1BhcmFtcy5pc0luZGV4ZWQgPSBmYWxzZTtcbiAgICBkcmF3UGFyYW1zLmluZGV4VHlwZSA9IG51bGw7XG5cbiAgICBjb25zdCB7bG9jYXRpb25zLCBlbGVtZW50c30gPSB0aGlzLl9zb3J0QnVmZmVyc0J5TG9jYXRpb24oYnVmZmVycyk7XG5cbiAgICAvLyBQcm9jZXNzIGxvY2F0aW9ucyBpbiBvcmRlclxuICAgIGZvciAobGV0IGxvY2F0aW9uID0gMDsgbG9jYXRpb24gPCBsb2NhdGlvbnMubGVuZ3RoOyArK2xvY2F0aW9uKSB7XG4gICAgICBjb25zdCBidWZmZXJOYW1lID0gbG9jYXRpb25zW2xvY2F0aW9uXTtcbiAgICAgIGNvbnN0IGJ1ZmZlciA9IGJ1ZmZlcnNbYnVmZmVyTmFtZV07XG4gICAgICAvLyBESVNBQkxFIE1JU1NJTkcgQVRUUklCVVRFXG4gICAgICBpZiAoIWJ1ZmZlcikge1xuICAgICAgICBWZXJ0ZXhBdHRyaWJ1dGVzLmRpc2FibGUoZ2wsIGxvY2F0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGRpdmlzb3IgPSBidWZmZXIubGF5b3V0Lmluc3RhbmNlZCA/IDEgOiAwO1xuICAgICAgICBWZXJ0ZXhBdHRyaWJ1dGVzLmVuYWJsZShnbCwgbG9jYXRpb24pO1xuICAgICAgICBWZXJ0ZXhBdHRyaWJ1dGVzLnNldEJ1ZmZlcih7Z2wsIGxvY2F0aW9uLCBidWZmZXJ9KTtcbiAgICAgICAgVmVydGV4QXR0cmlidXRlcy5zZXREaXZpc29yKGdsLCBsb2NhdGlvbiwgZGl2aXNvcik7XG4gICAgICAgIGRyYXdQYXJhbXMuaXNJbnN0YW5jZWQgPSBidWZmZXIubGF5b3V0Lmluc3RhbmNlZCA+IDA7XG4gICAgICAgIHRoaXMuX2ZpbGxlZExvY2F0aW9uc1tidWZmZXJOYW1lXSA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gU0VUIEVMRU1FTlRTIEFSUkFZIEJVRkZFUlxuICAgIGlmIChlbGVtZW50cykge1xuICAgICAgY29uc3QgYnVmZmVyID0gYnVmZmVyc1tlbGVtZW50c107XG4gICAgICBidWZmZXIuYmluZCgpO1xuICAgICAgZHJhd1BhcmFtcy5pc0luZGV4ZWQgPSB0cnVlO1xuICAgICAgZHJhd1BhcmFtcy5pbmRleFR5cGUgPSBidWZmZXIubGF5b3V0LnR5cGU7XG4gICAgfVxuXG4gICAgaWYgKGNoZWNrKSB7XG4gICAgICB0aGlzLmNoZWNrQnVmZmVycygpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIC8qIGVzbGludC1lbmFibGUgbWF4LXN0YXRlbWVudHMgKi9cblxuICBfc29ydEJ1ZmZlcnNCeUxvY2F0aW9uKGJ1ZmZlcnMpIHtcbiAgICBsZXQgZWxlbWVudHMgPSBudWxsO1xuICAgIGNvbnN0IGxvY2F0aW9ucyA9IG5ldyBBcnJheSh0aGlzLl9hdHRyaWJ1dGVDb3VudCk7XG5cbiAgICBmb3IgKGNvbnN0IGJ1ZmZlck5hbWUgaW4gYnVmZmVycykge1xuICAgICAgY29uc3QgYnVmZmVyID0gQnVmZmVyLm1ha2VGcm9tKHRoaXMuZ2wsIGJ1ZmZlcnNbYnVmZmVyTmFtZV0pO1xuICAgICAgY29uc3QgbG9jYXRpb24gPSB0aGlzLl9hdHRyaWJ1dGVMb2NhdGlvbnNbYnVmZmVyTmFtZV07XG4gICAgICBpZiAobG9jYXRpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAoYnVmZmVyLnRhcmdldCA9PT0gR0wuRUxFTUVOVF9BUlJBWV9CVUZGRVIgJiYgZWxlbWVudHMpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICBgJHt0aGlzLl9wcmludChidWZmZXJOYW1lKX0gZHVwbGljYXRlIGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSYCk7XG4gICAgICAgIH0gZWxzZSBpZiAoYnVmZmVyLnRhcmdldCA9PT0gR0wuRUxFTUVOVF9BUlJBWV9CVUZGRVIpIHtcbiAgICAgICAgICBlbGVtZW50cyA9IGJ1ZmZlck5hbWU7XG4gICAgICAgIH0gZWxzZSBpZiAoIXRoaXMuX3dhcm5bYnVmZmVyTmFtZV0pIHtcbiAgICAgICAgICBsb2cud2FybigyLCBgJHt0aGlzLl9wcmludChidWZmZXJOYW1lKX0gbm90IHVzZWRgKTtcbiAgICAgICAgICB0aGlzLl93YXJuW2J1ZmZlck5hbWVdID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGJ1ZmZlci50YXJnZXQgPT09IEdMLkVMRU1FTlRfQVJSQVlfQlVGRkVSKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAke3RoaXMuX3ByaW50KGJ1ZmZlck5hbWUpfToke2xvY2F0aW9ufSBgICtcbiAgICAgICAgICAgIGBoYXMgYm90aCBsb2NhdGlvbiBhbmQgdHlwZSBnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUmApO1xuICAgICAgICB9XG4gICAgICAgIGxvY2F0aW9uc1tsb2NhdGlvbl0gPSBidWZmZXJOYW1lO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7bG9jYXRpb25zLCBlbGVtZW50c307XG4gIH1cblxuICBjaGVja0J1ZmZlcnMoKSB7XG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGVOYW1lIGluIHRoaXMuX2F0dHJpYnV0ZUxvY2F0aW9ucykge1xuICAgICAgaWYgKCF0aGlzLl9maWxsZWRMb2NhdGlvbnNbYXR0cmlidXRlTmFtZV0gJiYgIXRoaXMuX3dhcm5bYXR0cmlidXRlTmFtZV0pIHtcbiAgICAgICAgY29uc3QgbG9jYXRpb24gPSB0aGlzLl9hdHRyaWJ1dGVMb2NhdGlvbnNbYXR0cmlidXRlTmFtZV07XG4gICAgICAgIC8vIHRocm93IG5ldyBFcnJvcihgUHJvZ3JhbSAke3RoaXMuaWR9OiBgICtcbiAgICAgICAgLy8gICBgQXR0cmlidXRlICR7bG9jYXRpb259OiR7YXR0cmlidXRlTmFtZX0gbm90IHN1cHBsaWVkYCk7XG4gICAgICAgIGxvZy53YXJuKDAsIGBQcm9ncmFtICR7dGhpcy5pZH06IGAgK1xuICAgICAgICAgIGBBdHRyaWJ1dGUgJHtsb2NhdGlvbn06JHthdHRyaWJ1dGVOYW1lfSBub3Qgc3VwcGxpZWRgKTtcbiAgICAgICAgdGhpcy5fd2FyblthdHRyaWJ1dGVOYW1lXSA9IHRydWU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLypcbiAgICogQHJldHVybnMge1Byb2dyYW19IFJldHVybnMgaXRzZWxmIGZvciBjaGFpbmluZy5cbiAgICovXG4gIHVuc2V0QnVmZmVycygpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBjb25zdCBsZW5ndGggPSB0aGlzLl9hdHRyaWJ1dGVDb3VudDtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgICAvLyBWZXJ0ZXhBdHRyaWJ1dGVzLnNldERpdmlzb3IoZ2wsIGksIDApO1xuICAgICAgVmVydGV4QXR0cmlidXRlcy5kaXNhYmxlKGdsLCBpKTtcbiAgICB9XG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgbnVsbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQXBwbHkgYSBzZXQgb2YgdW5pZm9ybSB2YWx1ZXMgdG8gYSBwcm9ncmFtXG4gICAqIE9ubHkgdW5pZm9ybXMgd2l0aCBuYW1lcyBhY3R1YWxseSBwcmVzZW50IGluIHRoZSBsaW5rZWQgcHJvZ3JhbVxuICAgKiB3aWxsIGJlIHVwZGF0ZWQuXG4gICAqIG90aGVyIHVuaWZvcm1zIHdpbGwgYmUgaWdub3JlZFxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gdW5pZm9ybU1hcCAtIEFuIG9iamVjdCB3aXRoIG5hbWVzIGJlaW5nIGtleXNcbiAgICogQHJldHVybnMge1Byb2dyYW19IC0gcmV0dXJucyBpdHNlbGYgZm9yIGNoYWluaW5nLlxuICAgKi9cbiAgLyogZXNsaW50LWRpc2FibGUgbWF4LWRlcHRoICovXG4gIHNldFVuaWZvcm1zKHVuaWZvcm1zKSB7XG4gICAgZm9yIChjb25zdCB1bmlmb3JtTmFtZSBpbiB1bmlmb3Jtcykge1xuICAgICAgY29uc3QgdW5pZm9ybSA9IHVuaWZvcm1zW3VuaWZvcm1OYW1lXTtcbiAgICAgIGNvbnN0IHVuaWZvcm1TZXR0ZXIgPSB0aGlzLl91bmlmb3JtU2V0dGVyc1t1bmlmb3JtTmFtZV07XG4gICAgICBpZiAodW5pZm9ybVNldHRlcikge1xuICAgICAgICBpZiAodW5pZm9ybSBpbnN0YW5jZW9mIFRleHR1cmUpIHtcbiAgICAgICAgICBpZiAodW5pZm9ybVNldHRlci50ZXh0dXJlSW5kZXggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdW5pZm9ybVNldHRlci50ZXh0dXJlSW5kZXggPSB0aGlzLl90ZXh0dXJlSW5kZXhDb3VudGVyKys7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIEJpbmQgdGV4dHVyZSB0byBpbmRleCwgYW5kIHNldCB0aGUgdW5pZm9ybSBzYW1wbGVyIHRvIHRoZSBpbmRleFxuICAgICAgICAgIGNvbnN0IHRleHR1cmUgPSB1bmlmb3JtO1xuICAgICAgICAgIGNvbnN0IHt0ZXh0dXJlSW5kZXh9ID0gdW5pZm9ybVNldHRlcjtcbiAgICAgICAgICAvLyBjb25zb2xlLmRlYnVnKCdzZXR0aW5nIHRleHR1cmUnLCB0ZXh0dXJlSW5kZXgsIHRleHR1cmUpO1xuICAgICAgICAgIHRleHR1cmUuYmluZCh0ZXh0dXJlSW5kZXgpO1xuICAgICAgICAgIHVuaWZvcm1TZXR0ZXIodGV4dHVyZUluZGV4KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBKdXN0IHNldCB0aGUgdmFsdWVcbiAgICAgICAgICB1bmlmb3JtU2V0dGVyKHVuaWZvcm0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIC8qIGVzbGludC1lbmFibGUgbWF4LWRlcHRoICovXG5cbiAgZ2V0QXR0YWNoZWRTaGFkZXJzQ291bnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UHJvZ3JhbVBhcmFtZXRlcih0aGlzLmdsLkFUVEFDSEVEX1NIQURFUlMpO1xuICB9XG5cbiAgLy8gQVRUUklCVVRFUyBBUElcbiAgLy8gTm90ZTogTG9jYXRpb25zIGFyZSBudW1lcmljIGluZGljZXNcblxuICBnZXRBdHRyaWJ1dGVDb3VudCgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRQcm9ncmFtUGFyYW1ldGVyKHRoaXMuZ2wuQUNUSVZFX0FUVFJJQlVURVMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gb2JqZWN0IHdpdGggaW5mbyBhYm91dCBhdHRyaWJ1dGUgYXQgaW5kZXggXCJsb2NhdGlvblwiL1xuICAgKiBAcGFyYW0ge2ludH0gbG9jYXRpb24gLSBpbmRleCBvZiBhbiBhdHRyaWJ1dGVcbiAgICogQHJldHVybnMge1dlYkdMQWN0aXZlSW5mb30gLSBpbmZvIGFib3V0IGFuIGFjdGl2ZSBhdHRyaWJ1dGVcbiAgICogICBmaWVsZHM6IHtuYW1lLCBzaXplLCB0eXBlfVxuICAgKi9cbiAgZ2V0QXR0cmlidXRlSW5mbyhsb2NhdGlvbikge1xuICAgIHJldHVybiB0aGlzLmdsLmdldEFjdGl2ZUF0dHJpYih0aGlzLmhhbmRsZSwgbG9jYXRpb24pO1xuICB9XG5cbiAgZ2V0QXR0cmlidXRlTmFtZShsb2NhdGlvbikge1xuICAgIHJldHVybiB0aGlzLmdldEF0dHJpYnV0ZUluZm8obG9jYXRpb24pLm5hbWU7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBsb2NhdGlvbiAoaW5kZXgpIG9mIGEgbmFtZVxuICAgKiBAcGFyYW0ge1N0cmluZ30gYXR0cmlidXRlTmFtZSAtIG5hbWUgb2YgYW4gYXR0cmlidXRlXG4gICAqICAgKG1hdGNoZXMgbmFtZSBpbiBhIGxpbmtlZCBzaGFkZXIpXG4gICAqIEByZXR1cm5zIHtTdHJpbmdbXX0gLSBhcnJheSBvZiBhY3R1YWwgYXR0cmlidXRlIG5hbWVzIGZyb20gc2hhZGVyIGxpbmtpbmdcbiAgICovXG4gIGdldEF0dHJpYnV0ZUxvY2F0aW9uKGF0dHJpYnV0ZU5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5nbC5nZXRBdHRyaWJMb2NhdGlvbih0aGlzLmhhbmRsZSwgYXR0cmlidXRlTmFtZSk7XG4gIH1cblxuICAvLyBVTklGT1JNUyBBUElcbiAgLy8gTm90ZTogbG9jYXRpb25zIGFyZSBvcGFxdWUgc3RydWN0dXJlc1xuXG4gIGdldFVuaWZvcm1Db3VudCgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRQcm9ncmFtUGFyYW1ldGVyKEdMLkFDVElWRV9VTklGT1JNUyk7XG4gIH1cblxuICAvKlxuICAgKiBAcmV0dXJucyB7V2ViR0xBY3RpdmVJbmZvfSAtIG9iamVjdCB3aXRoIHtuYW1lLCBzaXplLCB0eXBlfVxuICAgKi9cbiAgZ2V0VW5pZm9ybUluZm8oaW5kZXgpIHtcbiAgICByZXR1cm4gdGhpcy5nbC5nZXRBY3RpdmVVbmlmb3JtKHRoaXMuaGFuZGxlLCBpbmRleCk7XG4gIH1cblxuICAvKlxuICAgKiBAcmV0dXJucyB7V2ViR0xVbmlmb3JtTG9jYXRpb259IC0gb3BhcXVlIG9iamVjdCByZXByZXNlbnRpbmcgbG9jYXRpb25cbiAgICogb2YgdW5pZm9ybSwgdXNlZCBieSBzZXR0ZXIgbWV0aG9kc1xuICAgKi9cbiAgZ2V0VW5pZm9ybUxvY2F0aW9uKG5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5nbC5nZXRVbmlmb3JtTG9jYXRpb24odGhpcy5oYW5kbGUsIG5hbWUpO1xuICB9XG5cbiAgZ2V0VW5pZm9ybVZhbHVlKGxvY2F0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2wuZ2V0VW5pZm9ybSh0aGlzLmhhbmRsZSwgbG9jYXRpb24pO1xuICB9XG5cbiAgLy8gUFJPR1JBTSBBUElcblxuICBpc0ZsYWdnZWRGb3JEZWxldGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRQcm9ncmFtUGFyYW1ldGVyKHRoaXMuZ2wuREVMRVRFX1NUQVRVUyk7XG4gIH1cblxuICBnZXRMYXN0TGlua1N0YXR1cygpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRQcm9ncmFtUGFyYW1ldGVyKHRoaXMuZ2wuTElOS19TVEFUVVMpO1xuICB9XG5cbiAgZ2V0TGFzdFZhbGlkYXRpb25TdGF0dXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UHJvZ3JhbVBhcmFtZXRlcih0aGlzLmdsLlZBTElEQVRFX1NUQVRVUyk7XG4gIH1cblxuICAvLyBXRUJHTDIgSU5URVJGQUNFXG5cbiAgLy8gVGhpcyBtYXkgYmUgZ2wuU0VQQVJBVEVfQVRUUklCUyBvciBnbC5JTlRFUkxFQVZFRF9BVFRSSUJTLlxuICBnZXRUcmFuc2Zvcm1GZWVkYmFja0J1ZmZlck1vZGUoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgYXNzZXJ0KGdsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCwgRVJSX1dFQkdMMik7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UHJvZ3JhbVBhcmFtZXRlcih0aGlzLmdsLlRSQU5TRk9STV9GRUVEQkFDS19CVUZGRVJfTU9ERSk7XG4gIH1cblxuICBnZXRUcmFuc2Zvcm1GZWVkYmFja1ZhcnlpbmdzQ291bnQoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgYXNzZXJ0KGdsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCwgRVJSX1dFQkdMMik7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UHJvZ3JhbVBhcmFtZXRlcih0aGlzLmdsLlRSQU5TRk9STV9GRUVEQkFDS19WQVJZSU5HUyk7XG4gIH1cblxuICBnZXRBY3RpdmVVbmlmb3JtQmxvY2tzQ291bnQoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgYXNzZXJ0KGdsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCwgRVJSX1dFQkdMMik7XG4gICAgcmV0dXJuIHRoaXMuZ2V0UHJvZ3JhbVBhcmFtZXRlcih0aGlzLmdsLkFDVElWRV9VTklGT1JNX0JMT0NLUyk7XG4gIH1cblxuICAvLyBSZXRyaWV2ZXMgdGhlIGFzc2lnbmVkIGNvbG9yIG51bWJlciBiaW5kaW5nIGZvciB0aGUgdXNlci1kZWZpbmVkIHZhcnlpbmdcbiAgLy8gb3V0IHZhcmlhYmxlIG5hbWUgZm9yIHByb2dyYW0uIHByb2dyYW0gbXVzdCBoYXZlIHByZXZpb3VzbHkgYmVlbiBsaW5rZWQuXG4gIC8vIFtXZWJHTEhhbmRsZXNDb250ZXh0TG9zc11cbiAgZ2V0RnJhZ0RhdGFMb2NhdGlvbih2YXJ5aW5nTmFtZSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGFzc2VydChnbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQsIEVSUl9XRUJHTDIpO1xuICAgIGNvbnN0IGxvY2F0aW9uID0gZ2wuZ2V0RnJhZ0RhdGFMb2NhdGlvbih0aGlzLmhhbmRsZSwgdmFyeWluZ05hbWUpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIGxvY2F0aW9uO1xuICB9XG5cbiAgLy8gUmV0dXJuIHRoZSB2YWx1ZSBmb3IgdGhlIHBhc3NlZCBwbmFtZSBnaXZlbiB0aGUgcGFzc2VkIHByb2dyYW0uXG4gIC8vIFRoZSB0eXBlIHJldHVybmVkIGlzIHRoZSBuYXR1cmFsIHR5cGUgZm9yIHRoZSByZXF1ZXN0ZWQgcG5hbWUsXG4gIC8vIGFzIGdpdmVuIGluIHRoZSBmb2xsb3dpbmcgdGFibGU6XG4gIC8vIHBuYW1lIHJldHVybmVkIHR5cGVcbiAgLy8gREVMRVRFX1NUQVRVUyBHTGJvb2xlYW5cbiAgLy8gTElOS19TVEFUVVMgR0xib29sZWFuXG4gIC8vIFZBTElEQVRFX1NUQVRVUyBHTGJvb2xlYW5cbiAgLy8gQVRUQUNIRURfU0hBREVSUyAgR0xpbnRcbiAgLy8gQUNUSVZFX0FUVFJJQlVURVMgR0xpbnRcbiAgLy8gQUNUSVZFX1VOSUZPUk1TIEdMaW50XG4gIC8vIFRSQU5TRk9STV9GRUVEQkFDS19CVUZGRVJfTU9ERSAgR0xlbnVtXG4gIC8vIFRSQU5TRk9STV9GRUVEQkFDS19WQVJZSU5HUyBHTGludFxuICAvLyBBQ1RJVkVfVU5JRk9STV9CTE9DS1MgR0xpbnRcbiAgZ2V0UHJvZ3JhbVBhcmFtZXRlcihwbmFtZSkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGNvbnN0IHBhcmFtZXRlciA9IGdsLmdldFByb2dyYW1QYXJhbWV0ZXIodGhpcy5oYW5kbGUsIHBuYW1lKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiBwYXJhbWV0ZXI7XG4gIH1cblxuICAvLyBQUklWQVRFIE1FVEhPRFNcblxuICAvLyBDaGVjayB0aGF0IGFsbCBhY3RpdmUgYXR0cmlidXRlcyBhcmUgZW5hYmxlZFxuICBfYXJlQWxsQXR0cmlidXRlc0VuYWJsZWQoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgY29uc3QgbGVuZ3RoID0gdGhpcy5fYXR0cmlidXRlQ291bnQ7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgICAgaWYgKCFWZXJ0ZXhBdHRyaWJ1dGVzLmlzRW5hYmxlZChnbCwgaSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIGRldGVybWluZSBhdHRyaWJ1dGUgbG9jYXRpb25zIChtYXBzIGF0dHJpYnV0ZSBuYW1lIHRvIGluZGV4KVxuICBfZ2V0QXR0cmlidXRlTG9jYXRpb25zKCkge1xuICAgIGNvbnN0IGF0dHJpYnV0ZUxvY2F0aW9ucyA9IHt9O1xuICAgIGNvbnN0IGxlbmd0aCA9IHRoaXMuZ2V0QXR0cmlidXRlQ291bnQoKTtcbiAgICBmb3IgKGxldCBsb2NhdGlvbiA9IDA7IGxvY2F0aW9uIDwgbGVuZ3RoOyBsb2NhdGlvbisrKSB7XG4gICAgICBjb25zdCBuYW1lID0gdGhpcy5nZXRBdHRyaWJ1dGVOYW1lKGxvY2F0aW9uKTtcbiAgICAgIGF0dHJpYnV0ZUxvY2F0aW9uc1tuYW1lXSA9IGxvY2F0aW9uO1xuICAgIH1cbiAgICByZXR1cm4gYXR0cmlidXRlTG9jYXRpb25zO1xuICB9XG5cbiAgLy8gY3JlYXRlIHVuaWZvcm0gc2V0dGVyc1xuICAvLyBNYXAgb2YgdW5pZm9ybSBuYW1lcyB0byBzZXR0ZXIgZnVuY3Rpb25zXG4gIF9nZXRVbmlmb3JtU2V0dGVycygpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBjb25zdCB1bmlmb3JtU2V0dGVycyA9IHt9O1xuICAgIGNvbnN0IGxlbmd0aCA9IHRoaXMuZ2V0VW5pZm9ybUNvdW50KCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgaW5mbyA9IHRoaXMuZ2V0VW5pZm9ybUluZm8oaSk7XG4gICAgICBjb25zdCBwYXJzZWROYW1lID0gcGFyc2VVbmlmb3JtTmFtZShpbmZvLm5hbWUpO1xuICAgICAgY29uc3QgbG9jYXRpb24gPSB0aGlzLmdldFVuaWZvcm1Mb2NhdGlvbihwYXJzZWROYW1lLm5hbWUpO1xuICAgICAgdW5pZm9ybVNldHRlcnNbcGFyc2VkTmFtZS5uYW1lXSA9XG4gICAgICAgIGdldFVuaWZvcm1TZXR0ZXIoZ2wsIGxvY2F0aW9uLCBpbmZvLCBwYXJzZWROYW1lLmlzQXJyYXkpO1xuICAgIH1cbiAgICByZXR1cm4gdW5pZm9ybVNldHRlcnM7XG4gIH1cblxuICAvLyBSRU1PVkVEXG5cbiAgLypcbiAgICogQmluZHMgYXJyYXkgb2YgdGV4dHVyZXMsIGF0IGluZGljZXMgY29ycmVzcG9uZGluZyB0byBwb3NpdGlvbnMgaW4gYXJyYXlcbiAgICovXG4gIHNldFRleHR1cmVzKHRleHR1cmVzKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUZXh0dXJlcyByZXBsYWNlZCB3aXRoIHNldEF0dHJpYnV0ZXMnKTtcbiAgICAvLyBhc3NlcnQoQXJyYXkuaXNBcnJheSh0ZXh0dXJlcyksICdzZXRUZXh0dXJlcyByZXF1aXJlcyBhcnJheSB0ZXh0dXJlcycpO1xuICAgIC8vIGZvciAobGV0IGkgPSAwOyBpIDwgdGV4dHVyZXMubGVuZ3RoOyArK2kpIHtcbiAgICAvLyAgIHRleHR1cmVzW2ldLmJpbmQoaSk7XG4gICAgLy8gfVxuICAgIC8vIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdW5zZXRUZXh0dXJlcyh0ZXh0dXJlcykge1xuICAgIHRocm93IG5ldyBFcnJvcigndW5zZXRUZXh0dXJlcyByZXBsYWNlZCB3aXRoIHNldEF0dHJpYnV0ZXMnKTtcbiAgICAvLyBhc3NlcnQoQXJyYXkuaXNBcnJheSh0ZXh0dXJlcyksICd1bnNldFRleHR1cmVzIHJlcXVpcmVzIGFycmF5IHRleHR1cmVzJyk7XG4gICAgLy8gZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXh0dXJlcy5sZW5ndGg7ICsraSkge1xuICAgIC8vICAgdGV4dHVyZXNbaV0udW5iaW5kKGkpO1xuICAgIC8vIH1cbiAgICAvLyByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qXG4gICAqIFNldCBhIHRleHR1cmUgYXQgYSBnaXZlbiBpbmRleFxuICAgKi9cbiAgc2V0VGV4dHVyZSh0ZXh0dXJlLCBpbmRleCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGV4dHVyZSByZXBsYWNlZCB3aXRoIHNldEF0dHJpYnV0ZXMnKTtcbiAgICAvLyB0ZXh0dXJlLmJpbmQoaW5kZXgpO1xuICAgIC8vIHJldHVybiB0aGlzO1xuICB9XG59XG5cbi8vIGNyZWF0ZSB1bmlmb3JtIHNldHRlcnNcbi8vIE1hcCBvZiB1bmlmb3JtIG5hbWVzIHRvIHNldHRlciBmdW5jdGlvbnNcbmV4cG9ydCBmdW5jdGlvbiBnZXRVbmlmb3JtRGVzY3JpcHRvcnMoZ2wsIHByb2dyYW0pIHtcbiAgY29uc3QgdW5pZm9ybURlY3JpcHRvcnMgPSB7fTtcbiAgY29uc3QgbGVuZ3RoID0gcHJvZ3JhbS5nZXRVbmlmb3JtQ291bnQoKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGluZm8gPSBwcm9ncmFtLmdldFVuaWZvcm1JbmZvKGkpO1xuICAgIGNvbnN0IGxvY2F0aW9uID0gcHJvZ3JhbS5nZXRVbmlmb3JtTG9jYXRpb24oaW5mby5uYW1lKTtcbiAgICBjb25zdCBkZXNjcmlwdG9yID0gZ2V0VW5pZm9ybVNldHRlcihnbCwgbG9jYXRpb24sIGluZm8pO1xuICAgIHVuaWZvcm1EZWNyaXB0b3JzW2Rlc2NyaXB0b3IubmFtZV0gPSBkZXNjcmlwdG9yO1xuICB9XG4gIHJldHVybiB1bmlmb3JtRGVjcmlwdG9ycztcbn1cblxuIl19