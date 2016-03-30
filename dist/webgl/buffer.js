'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // Encapsulates a WebGLBuffer object

var _context = require('./context');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Buffer = function () {
  _createClass(Buffer, null, [{
    key: 'getDefaultOpts',
    value: function getDefaultOpts(gl) {
      return {
        bufferType: gl.ARRAY_BUFFER,
        size: 1,
        dataType: gl.FLOAT,
        stride: 0,
        offset: 0,
        drawMode: gl.STATIC_DRAW,
        instanced: 0
      };
    }

    /*
     * @classdesc
     * Set up a gl buffer once and repeatedly bind and unbind it.
     * Holds an attribute name as a convenience...
     *
     * @param{} opts.data - native array
     * @param{string} opts.attribute - name of attribute for matching
     * @param{} opts.bufferType - buffer type (called "target" in GL docs)
     */

  }]);

  function Buffer(gl, opts) {
    _classCallCheck(this, Buffer);

    (0, _assert2.default)(gl, 'Buffer needs WebGLRenderingContext');
    this.gl = gl;
    this.handle = gl.createBuffer();
    (0, _context.glCheckError)(gl);
    opts = Object.assign({}, Buffer.getDefaultOpts(gl), opts);
    this.update(opts);
  }

  _createClass(Buffer, [{
    key: 'delete',
    value: function _delete() {
      var gl = this.gl;

      gl.deleteBuffer(this.handle);
      this.handle = null;
      (0, _context.glCheckError)(gl);
      return this;
    }

    // todo - remove

  }, {
    key: 'destroy',
    value: function destroy() {
      this.delete();
    }

    /* Updates data in the buffer */

  }, {
    key: 'update',
    value: function update() {
      var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      this.attribute = opts.attribute || this.attribute;
      this.bufferType = opts.bufferType || this.bufferType;
      this.size = opts.size || this.size;
      this.dataType = opts.dataType || this.dataType;
      this.stride = opts.stride || this.stride;
      this.offset = opts.offset || this.offset;
      this.drawMode = opts.drawMode || this.drawMode;
      this.instanced = opts.instanced || this.instanced;

      this.data = opts.data || this.data;
      if (this.data !== undefined) {
        this.bufferData(this.data);
      }
      return this;
    }

    /* Updates data in the buffer */

  }, {
    key: 'bufferData',
    value: function bufferData(data) {
      (0, _assert2.default)(data, 'Buffer.bufferData needs data');
      this.data = data;
      this.gl.bindBuffer(this.bufferType, this.handle);
      this.gl.bufferData(this.bufferType, this.data, this.drawMode);
      this.gl.bindBuffer(this.bufferType, null);
      return this;
    }
  }, {
    key: 'attachToLocation',
    value: function attachToLocation(location) {
      var gl = this.gl;
      // Bind the buffer so that we can operate on it

      gl.bindBuffer(this.bufferType, this.handle);
      if (location === undefined) {
        return this;
      }
      // Enable the attribute
      gl.enableVertexAttribArray(location);
      // Specify buffer format
      gl.vertexAttribPointer(location, this.size, this.dataType, false, this.stride, this.offset);
      if (this.instanced) {
        var extension = (0, _context.getExtension)(gl, 'ANGLE_instanced_arrays');
        // This makes it an instanced attribute
        extension.vertexAttribDivisorANGLE(location, 1);
      }
      return this;
    }
  }, {
    key: 'detachFromLocation',
    value: function detachFromLocation(location) {
      var gl = this.gl;

      if (this.instanced) {
        var extension = (0, _context.getExtension)(gl, 'ANGLE_instanced_arrays');
        // Clear instanced flag
        extension.vertexAttribDivisorANGLE(location, 0);
      }
      // Disable the attribute
      gl.disableVertexAttribArray(location);
      // Unbind the buffer per webgl recommendations
      gl.bindBuffer(this.bufferType, null);
      return this;
    }
  }, {
    key: 'bind',
    value: function bind() {
      var gl = this.gl;

      gl.bindBuffer(this.bufferType, this.handle);
      return this;
    }
  }, {
    key: 'unbind',
    value: function unbind() {
      var gl = this.gl;

      gl.bindBuffer(this.bufferType, null);
      return this;
    }
  }]);

  return Buffer;
}();

exports.default = Buffer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9idWZmZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBS3FCOzs7bUNBRUcsSUFBSTtBQUN4QixhQUFPO0FBQ0wsb0JBQVksR0FBRyxZQUFIO0FBQ1osY0FBTSxDQUFOO0FBQ0Esa0JBQVUsR0FBRyxLQUFIO0FBQ1YsZ0JBQVEsQ0FBUjtBQUNBLGdCQUFRLENBQVI7QUFDQSxrQkFBVSxHQUFHLFdBQUg7QUFDVixtQkFBVyxDQUFYO09BUEYsQ0FEd0I7Ozs7Ozs7Ozs7Ozs7OztBQXFCMUIsV0F2Qm1CLE1BdUJuQixDQUFZLEVBQVosRUFBZ0IsSUFBaEIsRUFBc0I7MEJBdkJILFFBdUJHOztBQUNwQiwwQkFBTyxFQUFQLEVBQVcsb0NBQVgsRUFEb0I7QUFFcEIsU0FBSyxFQUFMLEdBQVUsRUFBVixDQUZvQjtBQUdwQixTQUFLLE1BQUwsR0FBYyxHQUFHLFlBQUgsRUFBZCxDQUhvQjtBQUlwQiwrQkFBYSxFQUFiLEVBSm9CO0FBS3BCLFdBQU8sT0FBTyxNQUFQLENBQWMsRUFBZCxFQUFrQixPQUFPLGNBQVAsQ0FBc0IsRUFBdEIsQ0FBbEIsRUFBNkMsSUFBN0MsQ0FBUCxDQUxvQjtBQU1wQixTQUFLLE1BQUwsQ0FBWSxJQUFaLEVBTm9CO0dBQXRCOztlQXZCbUI7OzhCQWdDVjtVQUNBLEtBQU0sS0FBTixHQURBOztBQUVQLFNBQUcsWUFBSCxDQUFnQixLQUFLLE1BQUwsQ0FBaEIsQ0FGTztBQUdQLFdBQUssTUFBTCxHQUFjLElBQWQsQ0FITztBQUlQLGlDQUFhLEVBQWIsRUFKTztBQUtQLGFBQU8sSUFBUCxDQUxPOzs7Ozs7OzhCQVNDO0FBQ1IsV0FBSyxNQUFMLEdBRFE7Ozs7Ozs7NkJBS1E7VUFBWCw2REFBTyxrQkFBSTs7QUFDaEIsV0FBSyxTQUFMLEdBQWlCLEtBQUssU0FBTCxJQUFrQixLQUFLLFNBQUwsQ0FEbkI7QUFFaEIsV0FBSyxVQUFMLEdBQWtCLEtBQUssVUFBTCxJQUFtQixL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Y2Fwc3VsYXRlcyBhIFdlYkdMQnVmZmVyIG9iamVjdFxuXG5pbXBvcnQge2dldEV4dGVuc2lvbiwgZ2xDaGVja0Vycm9yfSBmcm9tICcuL2NvbnRleHQnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCdWZmZXIge1xuXG4gIHN0YXRpYyBnZXREZWZhdWx0T3B0cyhnbCkge1xuICAgIHJldHVybiB7XG4gICAgICBidWZmZXJUeXBlOiBnbC5BUlJBWV9CVUZGRVIsXG4gICAgICBzaXplOiAxLFxuICAgICAgZGF0YVR5cGU6IGdsLkZMT0FULFxuICAgICAgc3RyaWRlOiAwLFxuICAgICAgb2Zmc2V0OiAwLFxuICAgICAgZHJhd01vZGU6IGdsLlNUQVRJQ19EUkFXLFxuICAgICAgaW5zdGFuY2VkOiAwXG4gICAgfTtcbiAgfVxuXG4gIC8qXG4gICAqIEBjbGFzc2Rlc2NcbiAgICogU2V0IHVwIGEgZ2wgYnVmZmVyIG9uY2UgYW5kIHJlcGVhdGVkbHkgYmluZCBhbmQgdW5iaW5kIGl0LlxuICAgKiBIb2xkcyBhbiBhdHRyaWJ1dGUgbmFtZSBhcyBhIGNvbnZlbmllbmNlLi4uXG4gICAqXG4gICAqIEBwYXJhbXt9IG9wdHMuZGF0YSAtIG5hdGl2ZSBhcnJheVxuICAgKiBAcGFyYW17c3RyaW5nfSBvcHRzLmF0dHJpYnV0ZSAtIG5hbWUgb2YgYXR0cmlidXRlIGZvciBtYXRjaGluZ1xuICAgKiBAcGFyYW17fSBvcHRzLmJ1ZmZlclR5cGUgLSBidWZmZXIgdHlwZSAoY2FsbGVkIFwidGFyZ2V0XCIgaW4gR0wgZG9jcylcbiAgICovXG4gIGNvbnN0cnVjdG9yKGdsLCBvcHRzKSB7XG4gICAgYXNzZXJ0KGdsLCAnQnVmZmVyIG5lZWRzIFdlYkdMUmVuZGVyaW5nQ29udGV4dCcpO1xuICAgIHRoaXMuZ2wgPSBnbDtcbiAgICB0aGlzLmhhbmRsZSA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgb3B0cyA9IE9iamVjdC5hc3NpZ24oe30sIEJ1ZmZlci5nZXREZWZhdWx0T3B0cyhnbCksIG9wdHMpO1xuICAgIHRoaXMudXBkYXRlKG9wdHMpO1xuICB9XG5cbiAgZGVsZXRlKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmRlbGV0ZUJ1ZmZlcih0aGlzLmhhbmRsZSk7XG4gICAgdGhpcy5oYW5kbGUgPSBudWxsO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyB0b2RvIC0gcmVtb3ZlXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy5kZWxldGUoKTtcbiAgfVxuXG4gIC8qIFVwZGF0ZXMgZGF0YSBpbiB0aGUgYnVmZmVyICovXG4gIHVwZGF0ZShvcHRzID0ge30pIHtcbiAgICB0aGlzLmF0dHJpYnV0ZSA9IG9wdHMuYXR0cmlidXRlIHx8IHRoaXMuYXR0cmlidXRlO1xuICAgIHRoaXMuYnVmZmVyVHlwZSA9IG9wdHMuYnVmZmVyVHlwZSB8fCB0aGlzLmJ1ZmZlclR5cGU7XG4gICAgdGhpcy5zaXplID0gb3B0cy5zaXplIHx8IHRoaXMuc2l6ZTtcbiAgICB0aGlzLmRhdGFUeXBlID0gb3B0cy5kYXRhVHlwZSB8fCB0aGlzLmRhdGFUeXBlO1xuICAgIHRoaXMuc3RyaWRlID0gb3B0cy5zdHJpZGUgfHwgdGhpcy5zdHJpZGU7XG4gICAgdGhpcy5vZmZzZXQgPSBvcHRzLm9mZnNldCB8fCB0aGlzLm9mZnNldDtcbiAgICB0aGlzLmRyYXdNb2RlID0gb3B0cy5kcmF3TW9kZSB8fCB0aGlzLmRyYXdNb2RlO1xuICAgIHRoaXMuaW5zdGFuY2VkID0gb3B0cy5pbnN0YW5jZWQgfHwgdGhpcy5pbnN0YW5jZWQ7XG5cbiAgICB0aGlzLmRhdGEgPSBvcHRzLmRhdGEgfHwgdGhpcy5kYXRhO1xuICAgIGlmICh0aGlzLmRhdGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5idWZmZXJEYXRhKHRoaXMuZGF0YSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyogVXBkYXRlcyBkYXRhIGluIHRoZSBidWZmZXIgKi9cbiAgYnVmZmVyRGF0YShkYXRhKSB7XG4gICAgYXNzZXJ0KGRhdGEsICdCdWZmZXIuYnVmZmVyRGF0YSBuZWVkcyBkYXRhJyk7XG4gICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICB0aGlzLmdsLmJpbmRCdWZmZXIodGhpcy5idWZmZXJUeXBlLCB0aGlzLmhhbmRsZSk7XG4gICAgdGhpcy5nbC5idWZmZXJEYXRhKHRoaXMuYnVmZmVyVHlwZSwgdGhpcy5kYXRhLCB0aGlzLmRyYXdNb2RlKTtcbiAgICB0aGlzLmdsLmJpbmRCdWZmZXIodGhpcy5idWZmZXJUeXBlLCBudWxsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGF0dGFjaFRvTG9jYXRpb24obG9jYXRpb24pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICAvLyBCaW5kIHRoZSBidWZmZXIgc28gdGhhdCB3ZSBjYW4gb3BlcmF0ZSBvbiBpdFxuICAgIGdsLmJpbmRCdWZmZXIodGhpcy5idWZmZXJUeXBlLCB0aGlzLmhhbmRsZSk7XG4gICAgaWYgKGxvY2F0aW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvLyBFbmFibGUgdGhlIGF0dHJpYnV0ZVxuICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KGxvY2F0aW9uKTtcbiAgICAvLyBTcGVjaWZ5IGJ1ZmZlciBmb3JtYXRcbiAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKFxuICAgICAgbG9jYXRpb24sXG4gICAgICB0aGlzLnNpemUsIHRoaXMuZGF0YVR5cGUsIGZhbHNlLCB0aGlzLnN0cmlkZSwgdGhpcy5vZmZzZXRcbiAgICApO1xuICAgIGlmICh0aGlzLmluc3RhbmNlZCkge1xuICAgICAgY29uc3QgZXh0ZW5zaW9uID0gZ2V0RXh0ZW5zaW9uKGdsLCAnQU5HTEVfaW5zdGFuY2VkX2FycmF5cycpO1xuICAgICAgLy8gVGhpcyBtYWtlcyBpdCBhbiBpbnN0YW5jZWQgYXR0cmlidXRlXG4gICAgICBleHRlbnNpb24udmVydGV4QXR0cmliRGl2aXNvckFOR0xFKGxvY2F0aW9uLCAxKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBkZXRhY2hGcm9tTG9jYXRpb24obG9jYXRpb24pIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBpZiAodGhpcy5pbnN0YW5jZWQpIHtcbiAgICAgIGNvbnN0IGV4dGVuc2lvbiA9IGdldEV4dGVuc2lvbihnbCwgJ0FOR0xFX2luc3RhbmNlZF9hcnJheXMnKTtcbiAgICAgIC8vIENsZWFyIGluc3RhbmNlZCBmbGFnXG4gICAgICBleHRlbnNpb24udmVydGV4QXR0cmliRGl2aXNvckFOR0xFKGxvY2F0aW9uLCAwKTtcbiAgICB9XG4gICAgLy8gRGlzYWJsZSB0aGUgYXR0cmlidXRlXG4gICAgZ2wuZGlzYWJsZVZlcnRleEF0dHJpYkFycmF5KGxvY2F0aW9uKTtcbiAgICAvLyBVbmJpbmQgdGhlIGJ1ZmZlciBwZXIgd2ViZ2wgcmVjb21tZW5kYXRpb25zXG4gICAgZ2wuYmluZEJ1ZmZlcih0aGlzLmJ1ZmZlclR5cGUsIG51bGwpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgYmluZCgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5iaW5kQnVmZmVyKHRoaXMuYnVmZmVyVHlwZSwgdGhpcy5oYW5kbGUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdW5iaW5kKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmJpbmRCdWZmZXIodGhpcy5idWZmZXJUeXBlLCBudWxsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG59XG4iXX0=