'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BufferLayout = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _webglTypes = require('./webgl-types');

var _webglChecks = require('./webgl-checks');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ERR_WEBGL2 = 'WebGL2 required';

// Encapsulates a WebGLBuffer object

var BufferLayout =
/**
 * @classdesc
 * Store characteristics of a data layout
 * This data can be used when updating vertex attributes with
 * the associated buffer, freeing the application from keeping
 * track of this metadata.
 *
 * @class
 * @param {GLuint} size - number of values per element (1-4)
 * @param {GLuint} type - type of values (e.g. gl.FLOAT)
 * @param {GLbool} normalized=false - normalize integers to [-1,1] or [0,1]
 * @param {GLuint} integer=false - WebGL2 only, int-to-float conversion
 * @param {GLuint} stride=0 - supports strided arrays
 * @param {GLuint} offset=0 - supports strided arrays
 */
exports.BufferLayout = function BufferLayout() {
  var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  var
  // Characteristics of stored data
  type = _ref.type;
  var _ref$size = _ref.size;
  var size = _ref$size === undefined ? 1 : _ref$size;
  var _ref$offset = _ref.offset;
  var offset = _ref$offset === undefined ? 0 : _ref$offset;
  var _ref$stride = _ref.stride;
  var stride = _ref$stride === undefined ? 0 : _ref$stride;
  var _ref$normalized = _ref.normalized;
  var normalized = _ref$normalized === undefined ? false : _ref$normalized;
  var _ref$integer = _ref.integer;
  var integer = _ref$integer === undefined ? false : _ref$integer;
  var _ref$instanced = _ref.instanced;
  var instanced = _ref$instanced === undefined ? 0 : _ref$instanced;

  _classCallCheck(this, BufferLayout);

  this.type = type;
  this.size = size;
  this.offset = offset;
  this.stride = stride;
  this.normalized = normalized;
  this.integer = integer;
  this.instanced = instanced;
};

var Buffer = function () {
  _createClass(Buffer, null, [{
    key: 'makeFrom',


    /**
     * Returns a Buffer wrapped WebGLBuffer from a variety of inputs.
     * Allows other functions to transparently accept raw WebGLBuffers etc
     * and manipulate them using the methods in the `Buffer` class.
     * Checks for ".handle" (allows use of stack.gl's gl-buffer)
     *
     * @param {WebGLRenderingContext} gl - if a new buffer needs to be initialized
     * @param {*} object - candidate that will be coerced to a buffer
     * @returns {Buffer} - Buffer object that wraps the buffer parameter
     */
    value: function makeFrom(gl) {
      var object = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      return object instanceof Buffer ? object :
      // Use .handle (e.g from stack.gl's gl-buffer), else use buffer directly
      new Buffer(gl).setData({ handle: object.handle || object });
    }

    /*
     * @classdesc
     * Can be used to store vertex data, pixel data retrieved from images
     * or the framebuffer, and a variety of other things.
     *
     * Mainly used for uploading VertexAttributes to GPU
     * Setting data on a buffers (arrays) uploads it to the GPU.
     *
     * Holds an attribute name as a convenience...
     * setData - Initializes size of buffer and sets
     *
     * @param {WebGLRenderingContext} gl - gl context
     * @param {string} opt.id - id for debugging
     */

  }]);

  function Buffer() {
    var gl = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var _ref2 = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var id = _ref2.id;
    var handle = _ref2.handle;

    _classCallCheck(this, Buffer);

    (0, _webglChecks.assertWebGLRenderingContext)(gl);

    handle = handle || gl.createBuffer();
    if (!(handle instanceof _webglTypes.WebGLBuffer)) {
      throw new Error('Failed to create WebGLBuffer');
    }

    this.gl = gl;
    this.handle = handle;
    this.id = id;
    this.bytes = undefined;
    this.data = null;
    this.target = _webglTypes.GL.ARRAY_BUFFER;
    this.layout = null;

    this.userData = {};
    Object.seal(this);
  }

  _createClass(Buffer, [{
    key: 'delete',
    value: function _delete() {
      var gl = this.gl;

      if (this.handle) {
        gl.deleteBuffer(this.handle);
        this.handle = null;
      }
      return this;
    }

    /**
     * Creates and initializes the buffer object's data store.
     *
     * @param {ArrayBufferView} opt.data - contents
     * @param {GLsizeiptr} opt.bytes - the size of the buffer object's data store.
     * @param {GLenum} opt.usage=gl.STATIC_DRAW - Allocation hint for GPU driver
     *
     * Characteristics of stored data, hints for vertex attribute
     *
     * @param {GLenum} opt.dataType=gl.FLOAT - type of data stored in buffer
     * @param {GLuint} opt.size=1 - number of values per vertex
     * @returns {Buffer} Returns itself for chaining.
     */

  }, {
    key: 'setData',
    value: function setData() {
      var _ref3 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var data = _ref3.data;
      var bytes = _ref3.bytes;
      var _ref3$target = _ref3.target;
      var target = _ref3$target === undefined ? _webglTypes.GL.ARRAY_BUFFER : _ref3$target;
      var _ref3$usage = _ref3.usage;
      var usage = _ref3$usage === undefined ? _webglTypes.GL.STATIC_DRAW : _ref3$usage;
      var
      // Characteristics of stored data
      layout = _ref3.layout;
      var type = _ref3.type;
      var _ref3$size = _ref3.size;
      var size = _ref3$size === undefined ? 1 : _ref3$size;
      var _ref3$offset = _ref3.offset;
      var offset = _ref3$offset === undefined ? 0 : _ref3$offset;
      var _ref3$stride = _ref3.stride;
      var stride = _ref3$stride === undefined ? 0 : _ref3$stride;
      var _ref3$normalized = _ref3.normalized;
      var normalized = _ref3$normalized === undefined ? false : _ref3$normalized;
      var _ref3$integer = _ref3.integer;
      var integer = _ref3$integer === undefined ? false : _ref3$integer;
      var _ref3$instanced = _ref3.instanced;
      var instanced = _ref3$instanced === undefined ? 0 : _ref3$instanced;
      var gl = this.gl;

      (0, _assert2.default)(data || bytes >= 0, 'Buffer.setData needs data or bytes');
      type = type || (0, _webglChecks.glTypeFromArray)(data);

      if (data) {
        (0, _webglChecks.assertArrayTypeMatch)(data, type, 'in Buffer.setData');
      }

      this.bytes = bytes;
      this.data = data;
      this.target = target;
      this.layout = layout || new BufferLayout({
        type: type,
        size: size,
        offset: offset,
        stride: stride,
        normalized: normalized,
        integer: integer,
        instanced: instanced
      });

      // Note: When we are just creating and/or filling the buffer with data,
      // the target we use doesn't technically matter, so use ARRAY_BUFFER
      // https://www.opengl.org/wiki/Buffer_Object
      this.bind({ target: target });
      gl.bufferData(target, data || bytes, usage);
      this.unbind({ target: target });

      return this;
    }

    /**
     * Updates a subset of a buffer object's data store.
     * @param {ArrayBufferView} opt.data - contents
     * @returns {Buffer} Returns itself for chaining.
     */

  }, {
    key: 'subData',
    value: function subData() {
      var _ref4 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var data = _ref4.data;
      var _ref4$offset = _ref4.offset;
      var offset = _ref4$offset === undefined ? 0 : _ref4$offset;
      var gl = this.gl;

      (0, _assert2.default)(data, 'Buffer.updateData needs data');

      // Note: When we are just creating and/or filling the buffer with data,
      // the target we use doesn't technically matter, so use ARRAY_BUFFER
      // https://www.opengl.org/wiki/Buffer_Object
      this.bind({ target: _webglTypes.GL.ARRAY_BUFFER });
      gl.bufferSubData(_webglTypes.GL.ARRAY_BUFFER, offset, data);
      this.unbind({ target: _webglTypes.GL.ARRAY_BUFFER });

      return this;
    }

    /**
     * Binds a buffer to a given binding point (target).
     *
     * @param {Glenum} target - target for the bind operation.
     *  Possible values: gl.TRANSFORM_FEEDBACK_BUFFER and gl.UNIFORM_BUFFER
     * @param {GLuint} index - the index of the target.
     * @returns {Buffer} - Returns itself for chaining.
     */

  }, {
    key: 'bind',
    value: function bind() {
      var _ref5 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var _ref5$target = _ref5.target;
      var target = _ref5$target === undefined ? this.target : _ref5$target;

      this.gl.bindBuffer(target, this.handle);
      return this;
    }
  }, {
    key: 'unbind',
    value: function unbind() {
      var _ref6 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var _ref6$target = _ref6.target;
      var target = _ref6$target === undefined ? this.target : _ref6$target;

      // this.gl.bindBuffer(target, null);
      return this;
    }

    /**
     * Note: WEBGL2
     * Binds a buffer to a given binding point (target) at a given index.
     *
     * @param {Glenum} target - target for the bind operation.
     *  Possible values: gl.TRANSFORM_FEEDBACK_BUFFER and gl.UNIFORM_BUFFER
     * @param {GLuint} index - the index of the target.
     * @returns {Buffer} - Returns itself for chaining.
     */

  }, {
    key: 'bindBase',
    value: function bindBase() {
      var _ref7 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var _ref7$target = _ref7.target;
      var target = _ref7$target === undefined ? this.target : _ref7$target;
      var index = _ref7.index;

      (0, _assert2.default)(this.gl instanceof _webglTypes.WebGL2RenderingContext, ERR_WEBGL2);
      this.gl.bindBufferBase(target, index, this.handle);
      return this;
    }
  }, {
    key: 'unbindBase',
    value: function unbindBase() {
      var _ref8 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var _ref8$target = _ref8.target;
      var target = _ref8$target === undefined ? this.target : _ref8$target;
      var index = _ref8.index;

      (0, _assert2.default)(this.gl instanceof _webglTypes.WebGL2RenderingContext, ERR_WEBGL2);
      this.gl.bindBufferBase(target, index, null);
      return this;
    }

    /**
     * Note: WEBGL2
     * binds a range of a given WebGLBuffer to a given binding point (target)
     * at a given index.
     *
     * @param {Glenum} target - target for the bind operation.
     *  Possible values: gl.TRANSFORM_FEEDBACK_BUFFER and gl.UNIFORM_BUFFER
     * @param {GLuint} index - the index of the target.
     * @returns {Buffer} - Returns itself for chaining.
     */

  }, {
    key: 'bindRange',
    value: function bindRange() {
      var _ref9 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var _ref9$target = _ref9.target;
      var target = _ref9$target === undefined ? this.target : _ref9$target;
      var index = _ref9.index;
      var _ref9$offset = _ref9.offset;
      var offset = _ref9$offset === undefined ? 0 : _ref9$offset;
      var size = _ref9.size;

      (0, _assert2.default)(this.gl instanceof _webglTypes.WebGL2RenderingContext, ERR_WEBGL2);
      this.gl.bindBufferRange(target, index, this.handle, offset, size);
      return this;
    }
  }, {
    key: 'unbindRange',
    value: function unbindRange() {
      var _ref10 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var _ref10$target = _ref10.target;
      var target = _ref10$target === undefined ? this.target : _ref10$target;
      var index = _ref10.index;

      (0, _assert2.default)(this.gl instanceof _webglTypes.WebGL2RenderingContext, ERR_WEBGL2);
      this.gl.bindBufferBase(target, index, null);
      return this;
    }
  }]);

  return Buffer;
}();

exports.default = Buffer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9idWZmZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBRUE7O0FBRUE7Ozs7Ozs7O0FBRUEsSUFBTSxhQUFhLGlCQUFuQjs7OztJQUlhLFk7Ozs7Ozs7Ozs7Ozs7Ozs7UUFBQSxZLEdBZ0JYLHdCQVNRO0FBQUEsbUVBQUosRUFBSTs7QUFBQTs7QUFQTixNQU9NLFFBUE4sSUFPTTtBQUFBLHVCQU5OLElBTU07QUFBQSxNQU5OLElBTU0sNkJBTkMsQ0FNRDtBQUFBLHlCQUxOLE1BS007QUFBQSxNQUxOLE1BS00sK0JBTEcsQ0FLSDtBQUFBLHlCQUpOLE1BSU07QUFBQSxNQUpOLE1BSU0sK0JBSkcsQ0FJSDtBQUFBLDZCQUhOLFVBR007QUFBQSxNQUhOLFVBR00sbUNBSE8sS0FHUDtBQUFBLDBCQUZOLE9BRU07QUFBQSxNQUZOLE9BRU0sZ0NBRkksS0FFSjtBQUFBLDRCQUROLFNBQ007QUFBQSxNQUROLFNBQ00sa0NBRE0sQ0FDTjs7QUFBQTs7QUFDTixPQUFLLElBQUwsR0FBWSxJQUFaO0FBQ0EsT0FBSyxJQUFMLEdBQVksSUFBWjtBQUNBLE9BQUssTUFBTCxHQUFjLE1BQWQ7QUFDQSxPQUFLLE1BQUwsR0FBYyxNQUFkO0FBQ0EsT0FBSyxVQUFMLEdBQWtCLFVBQWxCO0FBQ0EsT0FBSyxPQUFMLEdBQWUsT0FBZjtBQUNBLE9BQUssU0FBTCxHQUFpQixTQUFqQjtBQUNELEM7O0lBR2tCLE07Ozs7Ozs7Ozs7Ozs7Ozs2QkFZSCxFLEVBQWlCO0FBQUEsVUFBYixNQUFhLHlEQUFKLEVBQUk7O0FBQy9CLGFBQU8sa0JBQWtCLE1BQWxCLEdBQTJCLE1BQTNCOztBQUVMLFVBQUksTUFBSixDQUFXLEVBQVgsRUFBZSxPQUFmLENBQXVCLEVBQUMsUUFBUSxPQUFPLE1BQVAsSUFBaUIsTUFBMUIsRUFBdkIsQ0FGRjtBQUdEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBZ0JELG9CQUdRO0FBQUEsUUFISSxFQUdKLHlE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Ozs7Ozs7Ozs7Ozs7Ozs7Z0NBWStEO0FBQUEsd0VBQUosRUFBSTs7QUFBQSwrQkFBckQsTUFBcUQ7QUFBQSxVQUFyRCxNQUFxRCxnQ0FBNUMsS0FBSyxNQUF1QztBQUFBLFVBQS9CLEtBQStCLFNBQS9CLEtBQStCO0FBQUEsK0JBQXhCLE1BQXdCO0FBQUEsVUFBeEIsTUFBd0IsZ0NBQWYsQ0FBZTtBQUFBLFVBQVosSUFBWSxTQUFaLElBQVk7O0FBQzlELDRCQUFPLEtBQUssRUFBTCw4Q0FBUCxFQUFrRCxVQUFsRDtBQUNBLFdBQUssRUFBTCxDQUFRLGVBQVIsQ0FBd0IsTUFBeEIsRUFBZ0MsS0FBaEMsRUFBdUMsS0FBSyxNQUE1QyxFQUFvRCxNQUFwRCxFQUE0RCxJQUE1RDtBQUNBLGFBQU8sSUFBUDtBQUNEOzs7a0NBRStDO0FBQUEseUVBQUosRUFBSTs7QUFBQSxpQ0FBbkMsTUFBbUM7QUFBQSxVQUFuQyxNQUFtQyxpQ0FBMUIsS0FBSyxNQUFxQjtBQUFBLFVBQWIsS0FBYSxVQUFiLEtBQWE7O0FBQzlDLDRCQUFPLEtBQUssRUFBTCw4Q0FBUCxFQUFrRCxVQUFsRDtBQUNBLFdBQUssRUFBTCxDQUFRLGNBQVIsQ0FBdUIsTUFBdkIsRUFBK0IsS0FBL0IsRUFBc0MsSUFBdEM7QUFDQSxhQUFPLElBQVA7QUFDRDs7Ozs7O2tCQTVNa0IsTSIsImZpbGUiOiJidWZmZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0dMLCBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LCBXZWJHTEJ1ZmZlcn1cbiAgZnJvbSAnLi93ZWJnbC10eXBlcyc7XG5pbXBvcnQge2Fzc2VydFdlYkdMUmVuZGVyaW5nQ29udGV4dCwgZ2xUeXBlRnJvbUFycmF5LCBhc3NlcnRBcnJheVR5cGVNYXRjaH1cbiAgZnJvbSAnLi93ZWJnbC1jaGVja3MnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG5jb25zdCBFUlJfV0VCR0wyID0gJ1dlYkdMMiByZXF1aXJlZCc7XG5cbi8vIEVuY2Fwc3VsYXRlcyBhIFdlYkdMQnVmZmVyIG9iamVjdFxuXG5leHBvcnQgY2xhc3MgQnVmZmVyTGF5b3V0IHtcbiAgLyoqXG4gICAqIEBjbGFzc2Rlc2NcbiAgICogU3RvcmUgY2hhcmFjdGVyaXN0aWNzIG9mIGEgZGF0YSBsYXlvdXRcbiAgICogVGhpcyBkYXRhIGNhbiBiZSB1c2VkIHdoZW4gdXBkYXRpbmcgdmVydGV4IGF0dHJpYnV0ZXMgd2l0aFxuICAgKiB0aGUgYXNzb2NpYXRlZCBidWZmZXIsIGZyZWVpbmcgdGhlIGFwcGxpY2F0aW9uIGZyb20ga2VlcGluZ1xuICAgKiB0cmFjayBvZiB0aGlzIG1ldGFkYXRhLlxuICAgKlxuICAgKiBAY2xhc3NcbiAgICogQHBhcmFtIHtHTHVpbnR9IHNpemUgLSBudW1iZXIgb2YgdmFsdWVzIHBlciBlbGVtZW50ICgxLTQpXG4gICAqIEBwYXJhbSB7R0x1aW50fSB0eXBlIC0gdHlwZSBvZiB2YWx1ZXMgKGUuZy4gZ2wuRkxPQVQpXG4gICAqIEBwYXJhbSB7R0xib29sfSBub3JtYWxpemVkPWZhbHNlIC0gbm9ybWFsaXplIGludGVnZXJzIHRvIFstMSwxXSBvciBbMCwxXVxuICAgKiBAcGFyYW0ge0dMdWludH0gaW50ZWdlcj1mYWxzZSAtIFdlYkdMMiBvbmx5LCBpbnQtdG8tZmxvYXQgY29udmVyc2lvblxuICAgKiBAcGFyYW0ge0dMdWludH0gc3RyaWRlPTAgLSBzdXBwb3J0cyBzdHJpZGVkIGFycmF5c1xuICAgKiBAcGFyYW0ge0dMdWludH0gb2Zmc2V0PTAgLSBzdXBwb3J0cyBzdHJpZGVkIGFycmF5c1xuICAgKi9cbiAgY29uc3RydWN0b3Ioe1xuICAgIC8vIENoYXJhY3RlcmlzdGljcyBvZiBzdG9yZWQgZGF0YVxuICAgIHR5cGUsXG4gICAgc2l6ZSA9IDEsXG4gICAgb2Zmc2V0ID0gMCxcbiAgICBzdHJpZGUgPSAwLFxuICAgIG5vcm1hbGl6ZWQgPSBmYWxzZSxcbiAgICBpbnRlZ2VyID0gZmFsc2UsXG4gICAgaW5zdGFuY2VkID0gMFxuICB9ID0ge30pIHtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMuc2l6ZSA9IHNpemU7XG4gICAgdGhpcy5vZmZzZXQgPSBvZmZzZXQ7XG4gICAgdGhpcy5zdHJpZGUgPSBzdHJpZGU7XG4gICAgdGhpcy5ub3JtYWxpemVkID0gbm9ybWFsaXplZDtcbiAgICB0aGlzLmludGVnZXIgPSBpbnRlZ2VyO1xuICAgIHRoaXMuaW5zdGFuY2VkID0gaW5zdGFuY2VkO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJ1ZmZlciB7XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBCdWZmZXIgd3JhcHBlZCBXZWJHTEJ1ZmZlciBmcm9tIGEgdmFyaWV0eSBvZiBpbnB1dHMuXG4gICAqIEFsbG93cyBvdGhlciBmdW5jdGlvbnMgdG8gdHJhbnNwYXJlbnRseSBhY2NlcHQgcmF3IFdlYkdMQnVmZmVycyBldGNcbiAgICogYW5kIG1hbmlwdWxhdGUgdGhlbSB1c2luZyB0aGUgbWV0aG9kcyBpbiB0aGUgYEJ1ZmZlcmAgY2xhc3MuXG4gICAqIENoZWNrcyBmb3IgXCIuaGFuZGxlXCIgKGFsbG93cyB1c2Ugb2Ygc3RhY2suZ2wncyBnbC1idWZmZXIpXG4gICAqXG4gICAqIEBwYXJhbSB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fSBnbCAtIGlmIGEgbmV3IGJ1ZmZlciBuZWVkcyB0byBiZSBpbml0aWFsaXplZFxuICAgKiBAcGFyYW0geyp9IG9iamVjdCAtIGNhbmRpZGF0ZSB0aGF0IHdpbGwgYmUgY29lcmNlZCB0byBhIGJ1ZmZlclxuICAgKiBAcmV0dXJucyB7QnVmZmVyfSAtIEJ1ZmZlciBvYmplY3QgdGhhdCB3cmFwcyB0aGUgYnVmZmVyIHBhcmFtZXRlclxuICAgKi9cbiAgc3RhdGljIG1ha2VGcm9tKGdsLCBvYmplY3QgPSB7fSkge1xuICAgIHJldHVybiBvYmplY3QgaW5zdGFuY2VvZiBCdWZmZXIgPyBvYmplY3QgOlxuICAgICAgLy8gVXNlIC5oYW5kbGUgKGUuZyBmcm9tIHN0YWNrLmdsJ3MgZ2wtYnVmZmVyKSwgZWxzZSB1c2UgYnVmZmVyIGRpcmVjdGx5XG4gICAgICBuZXcgQnVmZmVyKGdsKS5zZXREYXRhKHtoYW5kbGU6IG9iamVjdC5oYW5kbGUgfHwgb2JqZWN0fSk7XG4gIH1cblxuICAvKlxuICAgKiBAY2xhc3NkZXNjXG4gICAqIENhbiBiZSB1c2VkIHRvIHN0b3JlIHZlcnRleCBkYXRhLCBwaXhlbCBkYXRhIHJldHJpZXZlZCBmcm9tIGltYWdlc1xuICAgKiBvciB0aGUgZnJhbWVidWZmZXIsIGFuZCBhIHZhcmlldHkgb2Ygb3RoZXIgdGhpbmdzLlxuICAgKlxuICAgKiBNYWlubHkgdXNlZCBmb3IgdXBsb2FkaW5nIFZlcnRleEF0dHJpYnV0ZXMgdG8gR1BVXG4gICAqIFNldHRpbmcgZGF0YSBvbiBhIGJ1ZmZlcnMgKGFycmF5cykgdXBsb2FkcyBpdCB0byB0aGUgR1BVLlxuICAgKlxuICAgKiBIb2xkcyBhbiBhdHRyaWJ1dGUgbmFtZSBhcyBhIGNvbnZlbmllbmNlLi4uXG4gICAqIHNldERhdGEgLSBJbml0aWFsaXplcyBzaXplIG9mIGJ1ZmZlciBhbmQgc2V0c1xuICAgKlxuICAgKiBAcGFyYW0ge1dlYkdMUmVuZGVyaW5nQ29udGV4dH0gZ2wgLSBnbCBjb250ZXh0XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvcHQuaWQgLSBpZCBmb3IgZGVidWdnaW5nXG4gICAqL1xuICBjb25zdHJ1Y3RvcihnbCA9IHt9LCB7XG4gICAgaWQsXG4gICAgaGFuZGxlXG4gIH0gPSB7fSkge1xuICAgIGFzc2VydFdlYkdMUmVuZGVyaW5nQ29udGV4dChnbCk7XG5cbiAgICBoYW5kbGUgPSBoYW5kbGUgfHwgZ2wuY3JlYXRlQnVmZmVyKCk7XG4gICAgaWYgKCEoaGFuZGxlIGluc3RhbmNlb2YgV2ViR0xCdWZmZXIpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBjcmVhdGUgV2ViR0xCdWZmZXInKTtcbiAgICB9XG5cbiAgICB0aGlzLmdsID0gZ2w7XG4gICAgdGhpcy5oYW5kbGUgPSBoYW5kbGU7XG4gICAgdGhpcy5pZCA9IGlkO1xuICAgIHRoaXMuYnl0ZXMgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5kYXRhID0gbnVsbDtcbiAgICB0aGlzLnRhcmdldCA9IEdMLkFSUkFZX0JVRkZFUjtcbiAgICB0aGlzLmxheW91dCA9IG51bGw7XG5cbiAgICB0aGlzLnVzZXJEYXRhID0ge307XG4gICAgT2JqZWN0LnNlYWwodGhpcyk7XG4gIH1cblxuICBkZWxldGUoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgaWYgKHRoaXMuaGFuZGxlKSB7XG4gICAgICBnbC5kZWxldGVCdWZmZXIodGhpcy5oYW5kbGUpO1xuICAgICAgdGhpcy5oYW5kbGUgPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuZCBpbml0aWFsaXplcyB0aGUgYnVmZmVyIG9iamVjdCdzIGRhdGEgc3RvcmUuXG4gICAqXG4gICAqIEBwYXJhbSB7QXJyYXlCdWZmZXJWaWV3fSBvcHQuZGF0YSAtIGNvbnRlbnRzXG4gICAqIEBwYXJhbSB7R0xzaXplaXB0cn0gb3B0LmJ5dGVzIC0gdGhlIHNpemUgb2YgdGhlIGJ1ZmZlciBvYmplY3QncyBkYXRhIHN0b3JlLlxuICAgKiBAcGFyYW0ge0dMZW51bX0gb3B0LnVzYWdlPWdsLlNUQVRJQ19EUkFXIC0gQWxsb2NhdGlvbiBoaW50IGZvciBHUFUgZHJpdmVyXG4gICAqXG4gICAqIENoYXJhY3RlcmlzdGljcyBvZiBzdG9yZWQgZGF0YSwgaGludHMgZm9yIHZlcnRleCBhdHRyaWJ1dGVcbiAgICpcbiAgICogQHBhcmFtIHtHTGVudW19IG9wdC5kYXRhVHlwZT1nbC5GTE9BVCAtIHR5cGUgb2YgZGF0YSBzdG9yZWQgaW4gYnVmZmVyXG4gICAqIEBwYXJhbSB7R0x1aW50fSBvcHQuc2l6ZT0xIC0gbnVtYmVyIG9mIHZhbHVlcyBwZXIgdmVydGV4XG4gICAqIEByZXR1cm5zIHtCdWZmZXJ9IFJldHVybnMgaXRzZWxmIGZvciBjaGFpbmluZy5cbiAgICovXG4gIHNldERhdGEoe1xuICAgIGRhdGEsXG4gICAgYnl0ZXMsXG4gICAgdGFyZ2V0ID0gR0wuQVJSQVlfQlVGRkVSLFxuICAgIHVzYWdlID0gR0wuU1RBVElDX0RSQVcsXG4gICAgLy8gQ2hhcmFjdGVyaXN0aWNzIG9mIHN0b3JlZCBkYXRhXG4gICAgbGF5b3V0LFxuICAgIHR5cGUsXG4gICAgc2l6ZSA9IDEsXG4gICAgb2Zmc2V0ID0gMCxcbiAgICBzdHJpZGUgPSAwLFxuICAgIG5vcm1hbGl6ZWQgPSBmYWxzZSxcbiAgICBpbnRlZ2VyID0gZmFsc2UsXG4gICAgaW5zdGFuY2VkID0gMFxuICB9ID0ge30pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBhc3NlcnQoZGF0YSB8fCBieXRlcyA+PSAwLCAnQnVmZmVyLnNldERhdGEgbmVlZHMgZGF0YSBvciBieXRlcycpO1xuICAgIHR5cGUgPSB0eXBlIHx8IGdsVHlwZUZyb21BcnJheShkYXRhKTtcblxuICAgIGlmIChkYXRhKSB7XG4gICAgICBhc3NlcnRBcnJheVR5cGVNYXRjaChkYXRhLCB0eXBlLCAnaW4gQnVmZmVyLnNldERhdGEnKTtcbiAgICB9XG5cbiAgICB0aGlzLmJ5dGVzID0gYnl0ZXM7XG4gICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICB0aGlzLnRhcmdldCA9IHRhcmdldDtcbiAgICB0aGlzLmxheW91dCA9IGxheW91dCB8fCBuZXcgQnVmZmVyTGF5b3V0KHtcbiAgICAgIHR5cGUsXG4gICAgICBzaXplLFxuICAgICAgb2Zmc2V0LFxuICAgICAgc3RyaWRlLFxuICAgICAgbm9ybWFsaXplZCxcbiAgICAgIGludGVnZXIsXG4gICAgICBpbnN0YW5jZWRcbiAgICB9KTtcblxuICAgIC8vIE5vdGU6IFdoZW4gd2UgYXJlIGp1c3QgY3JlYXRpbmcgYW5kL29yIGZpbGxpbmcgdGhlIGJ1ZmZlciB3aXRoIGRhdGEsXG4gICAgLy8gdGhlIHRhcmdldCB3ZSB1c2UgZG9lc24ndCB0ZWNobmljYWxseSBtYXR0ZXIsIHNvIHVzZSBBUlJBWV9CVUZGRVJcbiAgICAvLyBodHRwczovL3d3dy5vcGVuZ2wub3JnL3dpa2kvQnVmZmVyX09iamVjdFxuICAgIHRoaXMuYmluZCh7dGFyZ2V0fSk7XG4gICAgZ2wuYnVmZmVyRGF0YSh0YXJnZXQsIGRhdGEgfHwgYnl0ZXMsIHVzYWdlKTtcbiAgICB0aGlzLnVuYmluZCh7dGFyZ2V0fSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIGEgc3Vic2V0IG9mIGEgYnVmZmVyIG9iamVjdCdzIGRhdGEgc3RvcmUuXG4gICAqIEBwYXJhbSB7QXJyYXlCdWZmZXJWaWV3fSBvcHQuZGF0YSAtIGNvbnRlbnRzXG4gICAqIEByZXR1cm5zIHtCdWZmZXJ9IFJldHVybnMgaXRzZWxmIGZvciBjaGFpbmluZy5cbiAgICovXG4gIHN1YkRhdGEoe1xuICAgIGRhdGEsXG4gICAgb2Zmc2V0ID0gMFxuICB9ID0ge30pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBhc3NlcnQoZGF0YSwgJ0J1ZmZlci51cGRhdGVEYXRhIG5lZWRzIGRhdGEnKTtcblxuICAgIC8vIE5vdGU6IFdoZW4gd2UgYXJlIGp1c3QgY3JlYXRpbmcgYW5kL29yIGZpbGxpbmcgdGhlIGJ1ZmZlciB3aXRoIGRhdGEsXG4gICAgLy8gdGhlIHRhcmdldCB3ZSB1c2UgZG9lc24ndCB0ZWNobmljYWxseSBtYXR0ZXIsIHNvIHVzZSBBUlJBWV9CVUZGRVJcbiAgICAvLyBodHRwczovL3d3dy5vcGVuZ2wub3JnL3dpa2kvQnVmZmVyX09iamVjdFxuICAgIHRoaXMuYmluZCh7dGFyZ2V0OiBHTC5BUlJBWV9CVUZGRVJ9KTtcbiAgICBnbC5idWZmZXJTdWJEYXRhKEdMLkFSUkFZX0JVRkZFUiwgb2Zmc2V0LCBkYXRhKTtcbiAgICB0aGlzLnVuYmluZCh7dGFyZ2V0OiBHTC5BUlJBWV9CVUZGRVJ9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEJpbmRzIGEgYnVmZmVyIHRvIGEgZ2l2ZW4gYmluZGluZyBwb2ludCAodGFyZ2V0KS5cbiAgICpcbiAgICogQHBhcmFtIHtHbGVudW19IHRhcmdldCAtIHRhcmdldCBmb3IgdGhlIGJpbmQgb3BlcmF0aW9uLlxuICAgKiAgUG9zc2libGUgdmFsdWVzOiBnbC5UUkFOU0ZPUk1fRkVFREJBQ0tfQlVGRkVSIGFuZCBnbC5VTklGT1JNX0JVRkZFUlxuICAgKiBAcGFyYW0ge0dMdWludH0gaW5kZXggLSB0aGUgaW5kZXggb2YgdGhlIHRhcmdldC5cbiAgICogQHJldHVybnMge0J1ZmZlcn0gLSBSZXR1cm5zIGl0c2VsZiBmb3IgY2hhaW5pbmcuXG4gICAqL1xuICBiaW5kKHt0YXJnZXQgPSB0aGlzLnRhcmdldH0gPSB7fSkge1xuICAgIHRoaXMuZ2wuYmluZEJ1ZmZlcih0YXJnZXQsIHRoaXMuaGFuZGxlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHVuYmluZCh7dGFyZ2V0ID0gdGhpcy50YXJnZXR9ID0ge30pIHtcbiAgICAvLyB0aGlzLmdsLmJpbmRCdWZmZXIodGFyZ2V0LCBudWxsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBOb3RlOiBXRUJHTDJcbiAgICogQmluZHMgYSBidWZmZXIgdG8gYSBnaXZlbiBiaW5kaW5nIHBvaW50ICh0YXJnZXQpIGF0IGEgZ2l2ZW4gaW5kZXguXG4gICAqXG4gICAqIEBwYXJhbSB7R2xlbnVtfSB0YXJnZXQgLSB0YXJnZXQgZm9yIHRoZSBiaW5kIG9wZXJhdGlvbi5cbiAgICogIFBvc3NpYmxlIHZhbHVlczogZ2wuVFJBTlNGT1JNX0ZFRURCQUNLX0JVRkZFUiBhbmQgZ2wuVU5JRk9STV9CVUZGRVJcbiAgICogQHBhcmFtIHtHTHVpbnR9IGluZGV4IC0gdGhlIGluZGV4IG9mIHRoZSB0YXJnZXQuXG4gICAqIEByZXR1cm5zIHtCdWZmZXJ9IC0gUmV0dXJucyBpdHNlbGYgZm9yIGNoYWluaW5nLlxuICAgKi9cbiAgYmluZEJhc2Uoe3RhcmdldCA9IHRoaXMudGFyZ2V0LCBpbmRleH0gPSB7fSkge1xuICAgIGFzc2VydCh0aGlzLmdsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCwgRVJSX1dFQkdMMik7XG4gICAgdGhpcy5nbC5iaW5kQnVmZmVyQmFzZSh0YXJnZXQsIGluZGV4LCB0aGlzLmhhbmRsZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB1bmJpbmRCYXNlKHt0YXJnZXQgPSB0aGlzLnRhcmdldCwgaW5kZXh9ID0ge30pIHtcbiAgICBhc3NlcnQodGhpcy5nbCBpbnN0YW5jZW9mIFdlYkdMMlJlbmRlcmluZ0NvbnRleHQsIEVSUl9XRUJHTDIpO1xuICAgIHRoaXMuZ2wuYmluZEJ1ZmZlckJhc2UodGFyZ2V0LCBpbmRleCwgbnVsbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogTm90ZTogV0VCR0wyXG4gICAqIGJpbmRzIGEgcmFuZ2Ugb2YgYSBnaXZlbiBXZWJHTEJ1ZmZlciB0byBhIGdpdmVuIGJpbmRpbmcgcG9pbnQgKHRhcmdldClcbiAgICogYXQgYSBnaXZlbiBpbmRleC5cbiAgICpcbiAgICogQHBhcmFtIHtHbGVudW19IHRhcmdldCAtIHRhcmdldCBmb3IgdGhlIGJpbmQgb3BlcmF0aW9uLlxuICAgKiAgUG9zc2libGUgdmFsdWVzOiBnbC5UUkFOU0ZPUk1fRkVFREJBQ0tfQlVGRkVSIGFuZCBnbC5VTklGT1JNX0JVRkZFUlxuICAgKiBAcGFyYW0ge0dMdWludH0gaW5kZXggLSB0aGUgaW5kZXggb2YgdGhlIHRhcmdldC5cbiAgICogQHJldHVybnMge0J1ZmZlcn0gLSBSZXR1cm5zIGl0c2VsZiBmb3IgY2hhaW5pbmcuXG4gICAqL1xuICBiaW5kUmFuZ2Uoe3RhcmdldCA9IHRoaXMudGFyZ2V0LCBpbmRleCwgb2Zmc2V0ID0gMCwgc2l6ZX0gPSB7fSkge1xuICAgIGFzc2VydCh0aGlzLmdsIGluc3RhbmNlb2YgV2ViR0wyUmVuZGVyaW5nQ29udGV4dCwgRVJSX1dFQkdMMik7XG4gICAgdGhpcy5nbC5iaW5kQnVmZmVyUmFuZ2UodGFyZ2V0LCBpbmRleCwgdGhpcy5oYW5kbGUsIG9mZnNldCwgc2l6ZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB1bmJpbmRSYW5nZSh7dGFyZ2V0ID0gdGhpcy50YXJnZXQsIGluZGV4fSA9IHt9KSB7XG4gICAgYXNzZXJ0KHRoaXMuZ2wgaW5zdGFuY2VvZiBXZWJHTDJSZW5kZXJpbmdDb250ZXh0LCBFUlJfV0VCR0wyKTtcbiAgICB0aGlzLmdsLmJpbmRCdWZmZXJCYXNlKHRhcmdldCwgaW5kZXgsIG51bGwpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbn1cbiJdfQ==