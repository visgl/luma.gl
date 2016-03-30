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

      (0, _assert2.default)(opts.data, 'Buffer needs data argument');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9idWZmZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBS3FCOzs7bUNBRUcsSUFBSTtBQUN4QixhQUFPO0FBQ0wsb0JBQVksR0FBRyxZQUFIO0FBQ1osY0FBTSxDQUFOO0FBQ0Esa0JBQVUsR0FBRyxLQUFIO0FBQ1YsZ0JBQVEsQ0FBUjtBQUNBLGdCQUFRLENBQVI7QUFDQSxrQkFBVSxHQUFHLFdBQUg7QUFDVixtQkFBVyxDQUFYO09BUEYsQ0FEd0I7Ozs7Ozs7Ozs7Ozs7OztBQXFCMUIsV0F2Qm1CLE1BdUJuQixDQUFZLEVBQVosRUFBZ0IsSUFBaEIsRUFBc0I7MEJBdkJILFFBdUJHOztBQUNwQiwwQkFBTyxFQUFQLEVBQVcsb0NBQVgsRUFEb0I7QUFFcEIsU0FBSyxFQUFMLEdBQVUsRUFBVixDQUZvQjtBQUdwQixTQUFLLE1BQUwsR0FBYyxHQUFHLFlBQUgsRUFBZCxDQUhvQjtBQUlwQiwrQkFBYSxFQUFiLEVBSm9CO0FBS3BCLFdBQU8sT0FBTyxNQUFQLENBQWMsRUFBZCxFQUFrQixPQUFPLGNBQVAsQ0FBc0IsRUFBdEIsQ0FBbEIsRUFBNkMsSUFBN0MsQ0FBUCxDQUxvQjtBQU1wQixTQUFLLE1BQUwsQ0FBWSxJQUFaLEVBTm9CO0dBQXRCOztlQXZCbUI7OzhCQWdDVjtVQUNBLEtBQU0sS0FBTixHQURBOztBQUVQLFNBQUcsWUFBSCxDQUFnQixLQUFLLE1BQUwsQ0FBaEIsQ0FGTztBQUdQLFdBQUssTUFBTCxHQUFjLElBQWQsQ0FITztBQUlQLGlDQUFhLEVBQWIsRUFKTztBQUtQLGFBQU8sSUFBUCxDQUxPOzs7Ozs7OzhCQVNDO0FBQ1IsV0FBSyxNQUFMLEdBRFE7Ozs7Ozs7NkJBS1E7VUFBWCw2REFBTyxrQkFBSTs7QUFDaEIsNEJBQU8sS0FBSyxJQUFMLEVBQVcsNEJBQWxCLEVBRGdCO0FBRWhCLFdBQUssU0FBTCxHQUFpQixLQUFLLFNBQUwsSUFBa0IsS0FBSyxTQUFMLENBRm5C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bGUiOiJidWZmZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBFbmNhcHN1bGF0ZXMgYSBXZWJHTEJ1ZmZlciBvYmplY3RcblxuaW1wb3J0IHtnZXRFeHRlbnNpb24sIGdsQ2hlY2tFcnJvcn0gZnJvbSAnLi9jb250ZXh0JztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQnVmZmVyIHtcblxuICBzdGF0aWMgZ2V0RGVmYXVsdE9wdHMoZ2wpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnVmZmVyVHlwZTogZ2wuQVJSQVlfQlVGRkVSLFxuICAgICAgc2l6ZTogMSxcbiAgICAgIGRhdGFUeXBlOiBnbC5GTE9BVCxcbiAgICAgIHN0cmlkZTogMCxcbiAgICAgIG9mZnNldDogMCxcbiAgICAgIGRyYXdNb2RlOiBnbC5TVEFUSUNfRFJBVyxcbiAgICAgIGluc3RhbmNlZDogMFxuICAgIH07XG4gIH1cblxuICAvKlxuICAgKiBAY2xhc3NkZXNjXG4gICAqIFNldCB1cCBhIGdsIGJ1ZmZlciBvbmNlIGFuZCByZXBlYXRlZGx5IGJpbmQgYW5kIHVuYmluZCBpdC5cbiAgICogSG9sZHMgYW4gYXR0cmlidXRlIG5hbWUgYXMgYSBjb252ZW5pZW5jZS4uLlxuICAgKlxuICAgKiBAcGFyYW17fSBvcHRzLmRhdGEgLSBuYXRpdmUgYXJyYXlcbiAgICogQHBhcmFte3N0cmluZ30gb3B0cy5hdHRyaWJ1dGUgLSBuYW1lIG9mIGF0dHJpYnV0ZSBmb3IgbWF0Y2hpbmdcbiAgICogQHBhcmFte30gb3B0cy5idWZmZXJUeXBlIC0gYnVmZmVyIHR5cGUgKGNhbGxlZCBcInRhcmdldFwiIGluIEdMIGRvY3MpXG4gICAqL1xuICBjb25zdHJ1Y3RvcihnbCwgb3B0cykge1xuICAgIGFzc2VydChnbCwgJ0J1ZmZlciBuZWVkcyBXZWJHTFJlbmRlcmluZ0NvbnRleHQnKTtcbiAgICB0aGlzLmdsID0gZ2w7XG4gICAgdGhpcy5oYW5kbGUgPSBnbC5jcmVhdGVCdWZmZXIoKTtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIG9wdHMgPSBPYmplY3QuYXNzaWduKHt9LCBCdWZmZXIuZ2V0RGVmYXVsdE9wdHMoZ2wpLCBvcHRzKTtcbiAgICB0aGlzLnVwZGF0ZShvcHRzKTtcbiAgfVxuXG4gIGRlbGV0ZSgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5kZWxldGVCdWZmZXIodGhpcy5oYW5kbGUpO1xuICAgIHRoaXMuaGFuZGxlID0gbnVsbDtcbiAgICBnbENoZWNrRXJyb3IoZ2wpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gdG9kbyAtIHJlbW92ZVxuICBkZXN0cm95KCkge1xuICAgIHRoaXMuZGVsZXRlKCk7XG4gIH1cblxuICAvKiBVcGRhdGVzIGRhdGEgaW4gdGhlIGJ1ZmZlciAqL1xuICB1cGRhdGUob3B0cyA9IHt9KSB7XG4gICAgYXNzZXJ0KG9wdHMuZGF0YSwgJ0J1ZmZlciBuZWVkcyBkYXRhIGFyZ3VtZW50Jyk7XG4gICAgdGhpcy5hdHRyaWJ1dGUgPSBvcHRzLmF0dHJpYnV0ZSB8fCB0aGlzLmF0dHJpYnV0ZTtcbiAgICB0aGlzLmJ1ZmZlclR5cGUgPSBvcHRzLmJ1ZmZlclR5cGUgfHwgdGhpcy5idWZmZXJUeXBlO1xuICAgIHRoaXMuc2l6ZSA9IG9wdHMuc2l6ZSB8fCB0aGlzLnNpemU7XG4gICAgdGhpcy5kYXRhVHlwZSA9IG9wdHMuZGF0YVR5cGUgfHwgdGhpcy5kYXRhVHlwZTtcbiAgICB0aGlzLnN0cmlkZSA9IG9wdHMuc3RyaWRlIHx8IHRoaXMuc3RyaWRlO1xuICAgIHRoaXMub2Zmc2V0ID0gb3B0cy5vZmZzZXQgfHwgdGhpcy5vZmZzZXQ7XG4gICAgdGhpcy5kcmF3TW9kZSA9IG9wdHMuZHJhd01vZGUgfHwgdGhpcy5kcmF3TW9kZTtcbiAgICB0aGlzLmluc3RhbmNlZCA9IG9wdHMuaW5zdGFuY2VkIHx8IHRoaXMuaW5zdGFuY2VkO1xuXG4gICAgdGhpcy5kYXRhID0gb3B0cy5kYXRhIHx8IHRoaXMuZGF0YTtcbiAgICBpZiAodGhpcy5kYXRhICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuYnVmZmVyRGF0YSh0aGlzLmRhdGEpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qIFVwZGF0ZXMgZGF0YSBpbiB0aGUgYnVmZmVyICovXG4gIGJ1ZmZlckRhdGEoZGF0YSkge1xuICAgIGFzc2VydChkYXRhLCAnQnVmZmVyLmJ1ZmZlckRhdGEgbmVlZHMgZGF0YScpO1xuICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gICAgdGhpcy5nbC5iaW5kQnVmZmVyKHRoaXMuYnVmZmVyVHlwZSwgdGhpcy5oYW5kbGUpO1xuICAgIHRoaXMuZ2wuYnVmZmVyRGF0YSh0aGlzLmJ1ZmZlclR5cGUsIHRoaXMuZGF0YSwgdGhpcy5kcmF3TW9kZSk7XG4gICAgdGhpcy5nbC5iaW5kQnVmZmVyKHRoaXMuYnVmZmVyVHlwZSwgbnVsbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBhdHRhY2hUb0xvY2F0aW9uKGxvY2F0aW9uKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgLy8gQmluZCB0aGUgYnVmZmVyIHNvIHRoYXQgd2UgY2FuIG9wZXJhdGUgb24gaXRcbiAgICBnbC5iaW5kQnVmZmVyKHRoaXMuYnVmZmVyVHlwZSwgdGhpcy5oYW5kbGUpO1xuICAgIGlmIChsb2NhdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLy8gRW5hYmxlIHRoZSBhdHRyaWJ1dGVcbiAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShsb2NhdGlvbik7XG4gICAgLy8gU3BlY2lmeSBidWZmZXIgZm9ybWF0XG4gICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihcbiAgICAgIGxvY2F0aW9uLFxuICAgICAgdGhpcy5zaXplLCB0aGlzLmRhdGFUeXBlLCBmYWxzZSwgdGhpcy5zdHJpZGUsIHRoaXMub2Zmc2V0XG4gICAgKTtcbiAgICBpZiAodGhpcy5pbnN0YW5jZWQpIHtcbiAgICAgIGNvbnN0IGV4dGVuc2lvbiA9IGdldEV4dGVuc2lvbihnbCwgJ0FOR0xFX2luc3RhbmNlZF9hcnJheXMnKTtcbiAgICAgIC8vIFRoaXMgbWFrZXMgaXQgYW4gaW5zdGFuY2VkIGF0dHJpYnV0ZVxuICAgICAgZXh0ZW5zaW9uLnZlcnRleEF0dHJpYkRpdmlzb3JBTkdMRShsb2NhdGlvbiwgMSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZGV0YWNoRnJvbUxvY2F0aW9uKGxvY2F0aW9uKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgaWYgKHRoaXMuaW5zdGFuY2VkKSB7XG4gICAgICBjb25zdCBleHRlbnNpb24gPSBnZXRFeHRlbnNpb24oZ2wsICdBTkdMRV9pbnN0YW5jZWRfYXJyYXlzJyk7XG4gICAgICAvLyBDbGVhciBpbnN0YW5jZWQgZmxhZ1xuICAgICAgZXh0ZW5zaW9uLnZlcnRleEF0dHJpYkRpdmlzb3JBTkdMRShsb2NhdGlvbiwgMCk7XG4gICAgfVxuICAgIC8vIERpc2FibGUgdGhlIGF0dHJpYnV0ZVxuICAgIGdsLmRpc2FibGVWZXJ0ZXhBdHRyaWJBcnJheShsb2NhdGlvbik7XG4gICAgLy8gVW5iaW5kIHRoZSBidWZmZXIgcGVyIHdlYmdsIHJlY29tbWVuZGF0aW9uc1xuICAgIGdsLmJpbmRCdWZmZXIodGhpcy5idWZmZXJUeXBlLCBudWxsKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGJpbmQoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuYmluZEJ1ZmZlcih0aGlzLmJ1ZmZlclR5cGUsIHRoaXMuaGFuZGxlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHVuYmluZCgpIHtcbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICBnbC5iaW5kQnVmZmVyKHRoaXMuYnVmZmVyVHlwZSwgbnVsbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxufVxuIl19