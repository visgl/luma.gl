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

    console.error(opts);
    assplode;
    (0, _assert2.default)(gl, 'Buffer needs WebGLRenderingContext');
    this.gl = gl;
    this.handle = gl.createBuffer();
    (0, _context.glCheckError)(gl);
    console.log(opts);
    opts = Object.assign({}, Buffer.getDefaultOpts(gl), opts);
    console.log(opts);
    assplode;
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
      console.log(this.data);
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
      gl.vertexAttribPointer(location,
      // this.size, this.dataType, false, this.stride, this.offset
      this.size, this.dataType, false, 0, 0);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93ZWJnbC9idWZmZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFFQTs7QUFDQTs7Ozs7Ozs7SUFFcUI7OzttQ0FFRyxJQUFJO0FBQ3hCLGFBQU87QUFDTCxvQkFBWSxHQUFHLFlBQUg7QUFDWixjQUFNLENBQU47QUFDQSxrQkFBVSxHQUFHLEtBQUg7QUFDVixnQkFBUSxDQUFSO0FBQ0EsZ0JBQVEsQ0FBUjtBQUNBLGtCQUFVLEdBQUcsV0FBSDtBQUNWLG1CQUFXLENBQVg7T0FQRixDQUR3Qjs7Ozs7Ozs7Ozs7Ozs7O0FBcUIxQixXQXZCbUIsTUF1Qm5CLENBQVksRUFBWixFQUFnQixJQUFoQixFQUFzQjswQkF2QkgsUUF1Qkc7O0FBQ3BCLFlBQVEsS0FBUixDQUFjLElBQWQsRUFEb0I7QUFFcEIsYUFGb0I7QUFHcEIsMEJBQU8sRUFBUCxFQUFXLG9DQUFYLEVBSG9CO0FBSXBCLFNBQUssRUFBTCxHQUFVLEVBQVYsQ0FKb0I7QUFLcEIsU0FBSyxNQUFMLEdBQWMsR0FBRyxZQUFILEVBQWQsQ0FMb0I7QUFNcEIsK0JBQWEsRUFBYixFQU5vQjtBQU9wQixZQUFRLEdBQVIsQ0FBWSxJQUFaLEVBUG9CO0FBUXBCLFdBQU8sT0FBTyxNQUFQLENBQWMsRUFBZCxFQUFrQixPQUFPLGNBQVAsQ0FBc0IsRUFBdEIsQ0FBbEIsRUFBNkMsSUFBN0MsQ0FBUCxDQVJvQjtBQVNwQixZQUFRLEdBQVIsQ0FBWSxJQUFaLEVBVG9CO0FBVXBCLGFBVm9CO0FBV3BCLFNBQUssTUFBTCxDQUFZLElBQVosRUFYb0I7R0FBdEI7O2VBdkJtQjs7OEJBcUNWO1VBQ0EsS0FBTSxLQUFOLEdBREE7O0FBRVAsU0FBRyxZQUFILENBQWdCLEtBQUssTUFBTCxDQUFoQixDQUZPO0FBR1AsV0FBSyxNQUFMLEdBQWMsSUFBZCxDQUhPO0FBSVAsaUNBQWEsRUFBYixFQUpPO0FBS1AsYUFBTyxJQUFQLENBTE87Ozs7Ozs7OEJBU0M7QUFDUixXQUFLLE1BQUws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QUFpQixLQUFLLE1BQUwsQ0FBL0IsQ0FGSztBQUdMLGFBQU8sSUFBUCxDQUhLOzs7OzZCQU1FO1VBQ0EsS0FBTSxLQUFOLEdBREE7O0FBRVAsU0FBRyxVQUFILENBQWMsS0FBSyxVQUFMLEVBQWlCLElBQS9CLEVBRk87QUFHUCxhQUFPLElBQVAsQ0FITzs7OztTQTNIVSIsImZpbGUiOiJidWZmZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBFbmNhcHN1bGF0ZXMgYSBXZWJHTEJ1ZmZlciBvYmplY3RcblxuaW1wb3J0IHtnZXRFeHRlbnNpb24sIGdsQ2hlY2tFcnJvcn0gZnJvbSAnLi9jb250ZXh0JztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQnVmZmVyIHtcblxuICBzdGF0aWMgZ2V0RGVmYXVsdE9wdHMoZ2wpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYnVmZmVyVHlwZTogZ2wuQVJSQVlfQlVGRkVSLFxuICAgICAgc2l6ZTogMSxcbiAgICAgIGRhdGFUeXBlOiBnbC5GTE9BVCxcbiAgICAgIHN0cmlkZTogMCxcbiAgICAgIG9mZnNldDogMCxcbiAgICAgIGRyYXdNb2RlOiBnbC5TVEFUSUNfRFJBVyxcbiAgICAgIGluc3RhbmNlZDogMFxuICAgIH07XG4gIH1cblxuICAvKlxuICAgKiBAY2xhc3NkZXNjXG4gICAqIFNldCB1cCBhIGdsIGJ1ZmZlciBvbmNlIGFuZCByZXBlYXRlZGx5IGJpbmQgYW5kIHVuYmluZCBpdC5cbiAgICogSG9sZHMgYW4gYXR0cmlidXRlIG5hbWUgYXMgYSBjb252ZW5pZW5jZS4uLlxuICAgKlxuICAgKiBAcGFyYW17fSBvcHRzLmRhdGEgLSBuYXRpdmUgYXJyYXlcbiAgICogQHBhcmFte3N0cmluZ30gb3B0cy5hdHRyaWJ1dGUgLSBuYW1lIG9mIGF0dHJpYnV0ZSBmb3IgbWF0Y2hpbmdcbiAgICogQHBhcmFte30gb3B0cy5idWZmZXJUeXBlIC0gYnVmZmVyIHR5cGUgKGNhbGxlZCBcInRhcmdldFwiIGluIEdMIGRvY3MpXG4gICAqL1xuICBjb25zdHJ1Y3RvcihnbCwgb3B0cykge1xuICAgIGNvbnNvbGUuZXJyb3Iob3B0cyk7XG4gICAgYXNzcGxvZGU7XG4gICAgYXNzZXJ0KGdsLCAnQnVmZmVyIG5lZWRzIFdlYkdMUmVuZGVyaW5nQ29udGV4dCcpO1xuICAgIHRoaXMuZ2wgPSBnbDtcbiAgICB0aGlzLmhhbmRsZSA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgY29uc29sZS5sb2cob3B0cyk7XG4gICAgb3B0cyA9IE9iamVjdC5hc3NpZ24oe30sIEJ1ZmZlci5nZXREZWZhdWx0T3B0cyhnbCksIG9wdHMpO1xuICAgIGNvbnNvbGUubG9nKG9wdHMpO1xuICAgIGFzc3Bsb2RlO1xuICAgIHRoaXMudXBkYXRlKG9wdHMpO1xuICB9XG5cbiAgZGVsZXRlKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmRlbGV0ZUJ1ZmZlcih0aGlzLmhhbmRsZSk7XG4gICAgdGhpcy5oYW5kbGUgPSBudWxsO1xuICAgIGdsQ2hlY2tFcnJvcihnbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyB0b2RvIC0gcmVtb3ZlXG4gIGRlc3Ryb3koKSB7XG4gICAgdGhpcy5kZWxldGUoKTtcbiAgfVxuXG4gIC8qIFVwZGF0ZXMgZGF0YSBpbiB0aGUgYnVmZmVyICovXG4gIHVwZGF0ZShvcHRzID0ge30pIHtcbiAgICBhc3NlcnQob3B0cy5kYXRhLCAnQnVmZmVyIG5lZWRzIGRhdGEgYXJndW1lbnQnKTtcbiAgICB0aGlzLmF0dHJpYnV0ZSA9IG9wdHMuYXR0cmlidXRlIHx8IHRoaXMuYXR0cmlidXRlO1xuICAgIHRoaXMuYnVmZmVyVHlwZSA9IG9wdHMuYnVmZmVyVHlwZSB8fCB0aGlzLmJ1ZmZlclR5cGU7XG4gICAgdGhpcy5zaXplID0gb3B0cy5zaXplIHx8IHRoaXMuc2l6ZTtcbiAgICB0aGlzLmRhdGFUeXBlID0gb3B0cy5kYXRhVHlwZSB8fCB0aGlzLmRhdGFUeXBlO1xuICAgIHRoaXMuc3RyaWRlID0gb3B0cy5zdHJpZGUgfHwgdGhpcy5zdHJpZGU7XG4gICAgdGhpcy5vZmZzZXQgPSBvcHRzLm9mZnNldCB8fCB0aGlzLm9mZnNldDtcbiAgICB0aGlzLmRyYXdNb2RlID0gb3B0cy5kcmF3TW9kZSB8fCB0aGlzLmRyYXdNb2RlO1xuICAgIHRoaXMuaW5zdGFuY2VkID0gb3B0cy5pbnN0YW5jZWQgfHwgdGhpcy5pbnN0YW5jZWQ7XG5cbiAgICB0aGlzLmRhdGEgPSBvcHRzLmRhdGEgfHwgdGhpcy5kYXRhO1xuICAgIGlmICh0aGlzLmRhdGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5idWZmZXJEYXRhKHRoaXMuZGF0YSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyogVXBkYXRlcyBkYXRhIGluIHRoZSBidWZmZXIgKi9cbiAgYnVmZmVyRGF0YShkYXRhKSB7XG4gICAgYXNzZXJ0KGRhdGEsICdCdWZmZXIuYnVmZmVyRGF0YSBuZWVkcyBkYXRhJyk7XG4gICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICB0aGlzLmdsLmJpbmRCdWZmZXIodGhpcy5idWZmZXJUeXBlLCB0aGlzLmhhbmRsZSk7XG4gICAgY29uc29sZS5sb2codGhpcy5kYXRhKTtcbiAgICB0aGlzLmdsLmJ1ZmZlckRhdGEodGhpcy5idWZmZXJUeXBlLCB0aGlzLmRhdGEsIHRoaXMuZHJhd01vZGUpO1xuICAgIHRoaXMuZ2wuYmluZEJ1ZmZlcih0aGlzLmJ1ZmZlclR5cGUsIG51bGwpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgYXR0YWNoVG9Mb2NhdGlvbihsb2NhdGlvbikge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIC8vIEJpbmQgdGhlIGJ1ZmZlciBzbyB0aGF0IHdlIGNhbiBvcGVyYXRlIG9uIGl0XG4gICAgZ2wuYmluZEJ1ZmZlcih0aGlzLmJ1ZmZlclR5cGUsIHRoaXMuaGFuZGxlKTtcbiAgICBpZiAobG9jYXRpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8vIEVuYWJsZSB0aGUgYXR0cmlidXRlXG4gICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkobG9jYXRpb24pO1xuICAgIC8vIFNwZWNpZnkgYnVmZmVyIGZvcm1hdFxuICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoXG4gICAgICBsb2NhdGlvbixcbiAgICAgIC8vIHRoaXMuc2l6ZSwgdGhpcy5kYXRhVHlwZSwgZmFsc2UsIHRoaXMuc3RyaWRlLCB0aGlzLm9mZnNldFxuICAgICAgdGhpcy5zaXplLCB0aGlzLmRhdGFUeXBlLCBmYWxzZSwgMCwgMFxuICAgICk7XG4gICAgaWYgKHRoaXMuaW5zdGFuY2VkKSB7XG4gICAgICBjb25zdCBleHRlbnNpb24gPSBnZXRFeHRlbnNpb24oZ2wsICdBTkdMRV9pbnN0YW5jZWRfYXJyYXlzJyk7XG4gICAgICAvLyBUaGlzIG1ha2VzIGl0IGFuIGluc3RhbmNlZCBhdHRyaWJ1dGVcbiAgICAgIGV4dGVuc2lvbi52ZXJ0ZXhBdHRyaWJEaXZpc29yQU5HTEUobG9jYXRpb24sIDEpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGRldGFjaEZyb21Mb2NhdGlvbihsb2NhdGlvbikge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGlmICh0aGlzLmluc3RhbmNlZCkge1xuICAgICAgY29uc3QgZXh0ZW5zaW9uID0gZ2V0RXh0ZW5zaW9uKGdsLCAnQU5HTEVfaW5zdGFuY2VkX2FycmF5cycpO1xuICAgICAgLy8gQ2xlYXIgaW5zdGFuY2VkIGZsYWdcbiAgICAgIGV4dGVuc2lvbi52ZXJ0ZXhBdHRyaWJEaXZpc29yQU5HTEUobG9jYXRpb24sIDApO1xuICAgIH1cbiAgICAvLyBEaXNhYmxlIHRoZSBhdHRyaWJ1dGVcbiAgICBnbC5kaXNhYmxlVmVydGV4QXR0cmliQXJyYXkobG9jYXRpb24pO1xuICAgIC8vIFVuYmluZCB0aGUgYnVmZmVyIHBlciB3ZWJnbCByZWNvbW1lbmRhdGlvbnNcbiAgICBnbC5iaW5kQnVmZmVyKHRoaXMuYnVmZmVyVHlwZSwgbnVsbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBiaW5kKCkge1xuICAgIGNvbnN0IHtnbH0gPSB0aGlzO1xuICAgIGdsLmJpbmRCdWZmZXIodGhpcy5idWZmZXJUeXBlLCB0aGlzLmhhbmRsZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB1bmJpbmQoKSB7XG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgZ2wuYmluZEJ1ZmZlcih0aGlzLmJ1ZmZlclR5cGUsIG51bGwpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbn1cbiJdfQ==