'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _types = require('./webgl/types');

var _utils = require('./utils');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ILLEGAL_ARG = 'Geometry: Illegal argument';

var Geometry = function () {
  function Geometry(_ref) {
    var _ref$drawMode = _ref.drawMode;
    var drawMode = _ref$drawMode === undefined ? 'TRIANGLES' : _ref$drawMode;
    var _ref$id = _ref.id;
    var id = _ref$id === undefined ? (0, _utils.uid)() : _ref$id;
    var attributes = _ref.attributes;

    var attrs = _objectWithoutProperties(_ref, ['drawMode', 'id', 'attributes']);

    _classCallCheck(this, Geometry);

    (0, _assert2.default)(_types.DRAW_MODES.includes(drawMode), ILLEGAL_ARG);

    this.id = id;
    this.drawMode = drawMode;
    this.attributes = {};
    this.userData = {};
    Object.seal(this);

    this.setAttributes(attributes);
    this.setAttributes(attrs);
  }

  _createClass(Geometry, [{
    key: 'getVertexCount',
    value: function getVertexCount() {
      if (this.attributes.indices) {
        return this.attributes.indices.value.length;
      } else if (this.attributes.vertices) {
        return this.attributes.vertices.value.length / 3;
      }
      return false;
    }
  }, {
    key: 'hasAttribute',
    value: function hasAttribute(attributeName) {
      return Boolean(this.attributes[attributeName]);
    }
  }, {
    key: 'getAttribute',
    value: function getAttribute(attributeName) {
      var attribute = this.attributes[attributeName];
      (0, _assert2.default)(attribute);
      return attribute.value;
    }
  }, {
    key: 'getArray',
    value: function getArray(attributeName) {
      var attribute = this.attributes[attributeName];
      (0, _assert2.default)(attribute);
      return attribute.value;
    }
  }, {
    key: 'setAttributes',
    value: function setAttributes(attributes) {
      for (var attributeName in attributes) {
        var attribute = attributes[attributeName];
        if ((0, _types.isTypedArray)(attribute)) {
          this.attributes[attributeName] = {
            value: attribute,
            size: attributeName === 'instanced' ? 1 : 3,
            instanced: 0
          };
        } else {
          (0, _assert2.default)(attribute.value);
          (0, _assert2.default)(attribute.size);
          this.attributes[attributeName] = attribute;
        }
      }
      return this;
    }
  }, {
    key: 'getAttributes',
    value: function getAttributes() {
      return this.attributes;
    }
  }, {
    key: 'vertices',
    get: function get() {
      return this.attributes.vertices;
    }
  }, {
    key: 'normals',
    get: function get() {
      return this.attributes.normals;
    }
  }, {
    key: 'colors',
    get: function get() {
      return this.attributes.colors;
    }
  }, {
    key: 'texCoords',
    get: function get() {
      return this.attributes.texCoords;
    }
  }, {
    key: 'indices',
    get: function get() {
      return this.attributes.indices;
    }

    // TODO - remove code below
    /*
    set vertices(val) {
      if (!val) {
        delete this.$vertices;
        delete this.$verticesLength;
        return;
      }
      const vlen = val.length;
      if (val.BYTES_PER_ELEMENT) {
        this.$vertices = val;
      } else if (this.$verticesLength === vlen) {
        this.$vertices.set(val);
      } else {
        this.$vertices = new Float32Array(val);
      }
      this.$verticesLength = vlen;
    }
     set normals(val) {
      if (!val) {
        delete this.$normals;
        delete this.$normalsLength;
        return;
      }
      const vlen = val.length;
      if (val.BYTES_PER_ELEMENT) {
        this.$normals = val;
      } else if (this.$normalsLength === vlen) {
        this.$normals.set(val);
      } else {
        this.$normals = new Float32Array(val);
      }
      this.$normalsLength = vlen;
    }
     set colors(val) {
      if (!val) {
        delete this.$colors;
        delete this.$colorsLength;
        return;
      }
      const vlen = val.length;
      if (val.BYTES_PER_ELEMENT) {
        this.$colors = val;
      } else if (this.$colorsLength === vlen) {
        this.$colors.set(val);
      } else {
        this.$colors = new Float32Array(val);
      }
      if (this.$vertices && this.$verticesLength / 3 * 4 !== vlen) {
        this.$colors = normalizeColors(
          Array.slice.call(this.$colors), this.$verticesLength / 3 * 4);
      }
      this.$colorsLength = this.$colors.length;
    }
     set pickingColors(val) {
      if (!val) {
        delete this.$pickingColors;
        delete this.$pickingColorsLength;
        return;
      }
      const vlen = val.length;
      if (val.BYTES_PER_ELEMENT) {
        this.$pickingColors = val;
      } else if (this.$pickingColorsLength === vlen) {
        this.$pickingColors.set(val);
      } else {
        this.$pickingColors = new Float32Array(val);
      }
      if (this.$vertices && this.$verticesLength / 3 * 4 !== vlen) {
        this.$pickingColors = normalizeColors(
          Array.slice.call(this.$pickingColors), this.$verticesLength / 3 * 4);
      }
      this.$pickingColorsLength = this.$pickingColors.length;
    }
     get pickingColors() {
      return this.$pickingColors;
    }
     get texCoords() {
      return this.$texCoords;
    }
     set texCoords(val) {
      if (!val) {
        delete this.$texCoords;
        delete this.$texCoordsLength;
        return;
      }
      if (val.constructor.name === 'Object') {
        var ans = {};
        for (var prop in val) {
          var texCoordArray = val[prop];
          ans[prop] = texCoordArray.BYTES_PER_ELEMENT ?
            texCoordArray : new Float32Array(texCoordArray);
        }
        this.$texCoords = ans;
      } else {
        var vlen = val.length;
        if (val.BYTES_PER_ELEMENT) {
          this.$texCoords = val;
        } else if (this.$texCoordsLength === vlen) {
          this.$texCoords.set(val);
        } else {
          this.$texCoords = new Float32Array(val);
        }
        this.$texCoordsLength = vlen;
      }
    }
     set indices(val) {
      if (!val) {
        delete this.$indices;
        delete this.$indicesLength;
        return;
      }
      var vlen = val.length;
      if (val.BYTES_PER_ELEMENT) {
        this.$indices = val;
      } else if (this.$indicesLength === vlen) {
        this.$indices.set(val);
      } else {
        this.$indices = new Uint16Array(val);
      }
      this.$indicesLength = vlen;
    }
    */

  }]);

  return Geometry;
}();

/*
function normalizeColors(arr, len) {
  if (arr && arr.length < len) {
    const a0 = arr[0];
    const a1 = arr[1];
    const a2 = arr[2];
    const a3 = arr[3];
    const ans = [a0, a1, a2, a3];
    let times = len / arr.length;
    let index;

    while (--times) {
      index = times * 4;
      ans[index + 0] = a0;
      ans[index + 1] = a1;
      ans[index + 2] = a2;
      ans[index + 3] = a3;
    }

    return new Float32Array(ans);
  }
  return arr;
}
*/


exports.default = Geometry;
//# sourceMappingURL=data:application/json;base64,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Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7U0E5RUsiLCJmaWxlIjoiZ2VvbWV0cnkuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0RSQVdfTU9ERVMsIGlzVHlwZWRBcnJheX0gZnJvbSAnLi93ZWJnbC90eXBlcyc7XG5pbXBvcnQge3VpZH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbmNvbnN0IElMTEVHQUxfQVJHID0gJ0dlb21ldHJ5OiBJbGxlZ2FsIGFyZ3VtZW50JztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR2VvbWV0cnkge1xuXG4gIGNvbnN0cnVjdG9yKHtkcmF3TW9kZSA9ICdUUklBTkdMRVMnLCBpZCA9IHVpZCgpLCBhdHRyaWJ1dGVzLCAuLi5hdHRyc30pIHtcbiAgICBhc3NlcnQoRFJBV19NT0RFUy5pbmNsdWRlcyhkcmF3TW9kZSksIElMTEVHQUxfQVJHKTtcblxuICAgIHRoaXMuaWQgPSBpZDtcbiAgICB0aGlzLmRyYXdNb2RlID0gZHJhd01vZGU7XG4gICAgdGhpcy5hdHRyaWJ1dGVzID0ge307XG4gICAgdGhpcy51c2VyRGF0YSA9IHt9O1xuICAgIE9iamVjdC5zZWFsKHRoaXMpO1xuXG4gICAgdGhpcy5zZXRBdHRyaWJ1dGVzKGF0dHJpYnV0ZXMpO1xuICAgIHRoaXMuc2V0QXR0cmlidXRlcyhhdHRycyk7XG4gIH1cblxuICBnZXRWZXJ0ZXhDb3VudCgpIHtcbiAgICBpZiAodGhpcy5hdHRyaWJ1dGVzLmluZGljZXMpIHtcbiAgICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXMuaW5kaWNlcy52YWx1ZS5sZW5ndGg7XG4gICAgfSBlbHNlIGlmICh0aGlzLmF0dHJpYnV0ZXMudmVydGljZXMpIHtcbiAgICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXMudmVydGljZXMudmFsdWUubGVuZ3RoIC8gMztcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaGFzQXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUpIHtcbiAgICByZXR1cm4gQm9vbGVhbih0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV0pO1xuICB9XG5cbiAgZ2V0QXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUpIHtcbiAgICBjb25zdCBhdHRyaWJ1dGUgPSB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV07XG4gICAgYXNzZXJ0KGF0dHJpYnV0ZSk7XG4gICAgcmV0dXJuIGF0dHJpYnV0ZS52YWx1ZTtcbiAgfVxuXG4gIGdldEFycmF5KGF0dHJpYnV0ZU5hbWUpIHtcbiAgICBjb25zdCBhdHRyaWJ1dGUgPSB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV07XG4gICAgYXNzZXJ0KGF0dHJpYnV0ZSk7XG4gICAgcmV0dXJuIGF0dHJpYnV0ZS52YWx1ZTtcbiAgfVxuXG4gIHNldEF0dHJpYnV0ZXMoYXR0cmlidXRlcykge1xuICAgIGZvciAoY29uc3QgYXR0cmlidXRlTmFtZSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICBjb25zdCBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdO1xuICAgICAgaWYgKGlzVHlwZWRBcnJheShhdHRyaWJ1dGUpKSB7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXSA9IHtcbiAgICAgICAgICB2YWx1ZTogYXR0cmlidXRlLFxuICAgICAgICAgIHNpemU6IGF0dHJpYnV0ZU5hbWUgPT09ICdpbnN0YW5jZWQnID8gMSA6IDMsXG4gICAgICAgICAgaW5zdGFuY2VkOiAwXG4gICAgICAgIH07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhc3NlcnQoYXR0cmlidXRlLnZhbHVlKTtcbiAgICAgICAgYXNzZXJ0KGF0dHJpYnV0ZS5zaXplKTtcbiAgICAgICAgdGhpcy5hdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdID0gYXR0cmlidXRlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldEF0dHJpYnV0ZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlcztcbiAgfVxuXG4gIGdldCB2ZXJ0aWNlcygpIHtcbiAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzLnZlcnRpY2VzO1xuICB9XG5cbiAgZ2V0IG5vcm1hbHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlcy5ub3JtYWxzO1xuICB9XG5cbiAgZ2V0IGNvbG9ycygpIHtcbiAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzLmNvbG9ycztcbiAgfVxuXG4gIGdldCB0ZXhDb29yZHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlcy50ZXhDb29yZHM7XG4gIH1cblxuICBnZXQgaW5kaWNlcygpIHtcbiAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzLmluZGljZXM7XG4gIH1cblxuICAvLyBUT0RPIC0gcmVtb3ZlIGNvZGUgYmVsb3dcbiAgLypcbiAgc2V0IHZlcnRpY2VzKHZhbCkge1xuICAgIGlmICghdmFsKSB7XG4gICAgICBkZWxldGUgdGhpcy4kdmVydGljZXM7XG4gICAgICBkZWxldGUgdGhpcy4kdmVydGljZXNMZW5ndGg7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHZsZW4gPSB2YWwubGVuZ3RoO1xuICAgIGlmICh2YWwuQllURVNfUEVSX0VMRU1FTlQpIHtcbiAgICAgIHRoaXMuJHZlcnRpY2VzID0gdmFsO1xuICAgIH0gZWxzZSBpZiAodGhpcy4kdmVydGljZXNMZW5ndGggPT09IHZsZW4pIHtcbiAgICAgIHRoaXMuJHZlcnRpY2VzLnNldCh2YWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiR2ZXJ0aWNlcyA9IG5ldyBGbG9hdDMyQXJyYXkodmFsKTtcbiAgICB9XG4gICAgdGhpcy4kdmVydGljZXNMZW5ndGggPSB2bGVuO1xuICB9XG5cbiAgc2V0IG5vcm1hbHModmFsKSB7XG4gICAgaWYgKCF2YWwpIHtcbiAgICAgIGRlbGV0ZSB0aGlzLiRub3JtYWxzO1xuICAgICAgZGVsZXRlIHRoaXMuJG5vcm1hbHNMZW5ndGg7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHZsZW4gPSB2YWwubGVuZ3RoO1xuICAgIGlmICh2YWwuQllURVNfUEVSX0VMRU1FTlQpIHtcbiAgICAgIHRoaXMuJG5vcm1hbHMgPSB2YWw7XG4gICAgfSBlbHNlIGlmICh0aGlzLiRub3JtYWxzTGVuZ3RoID09PSB2bGVuKSB7XG4gICAgICB0aGlzLiRub3JtYWxzLnNldCh2YWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiRub3JtYWxzID0gbmV3IEZsb2F0MzJBcnJheSh2YWwpO1xuICAgIH1cbiAgICB0aGlzLiRub3JtYWxzTGVuZ3RoID0gdmxlbjtcbiAgfVxuXG4gIHNldCBjb2xvcnModmFsKSB7XG4gICAgaWYgKCF2YWwpIHtcbiAgICAgIGRlbGV0ZSB0aGlzLiRjb2xvcnM7XG4gICAgICBkZWxldGUgdGhpcy4kY29sb3JzTGVuZ3RoO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCB2bGVuID0gdmFsLmxlbmd0aDtcbiAgICBpZiAodmFsLkJZVEVTX1BFUl9FTEVNRU5UKSB7XG4gICAgICB0aGlzLiRjb2xvcnMgPSB2YWw7XG4gICAgfSBlbHNlIGlmICh0aGlzLiRjb2xvcnNMZW5ndGggPT09IHZsZW4pIHtcbiAgICAgIHRoaXMuJGNvbG9ycy5zZXQodmFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4kY29sb3JzID0gbmV3IEZsb2F0MzJBcnJheSh2YWwpO1xuICAgIH1cbiAgICBpZiAodGhpcy4kdmVydGljZXMgJiYgdGhpcy4kdmVydGljZXNMZW5ndGggLyAzICogNCAhPT0gdmxlbikge1xuICAgICAgdGhpcy4kY29sb3JzID0gbm9ybWFsaXplQ29sb3JzKFxuICAgICAgICBBcnJheS5zbGljZS5jYWxsKHRoaXMuJGNvbG9ycyksIHRoaXMuJHZlcnRpY2VzTGVuZ3RoIC8gMyAqIDQpO1xuICAgIH1cbiAgICB0aGlzLiRjb2xvcnNMZW5ndGggPSB0aGlzLiRjb2xvcnMubGVuZ3RoO1xuICB9XG5cbiAgc2V0IHBpY2tpbmdDb2xvcnModmFsKSB7XG4gICAgaWYgKCF2YWwpIHtcbiAgICAgIGRlbGV0ZSB0aGlzLiRwaWNraW5nQ29sb3JzO1xuICAgICAgZGVsZXRlIHRoaXMuJHBpY2tpbmdDb2xvcnNMZW5ndGg7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHZsZW4gPSB2YWwubGVuZ3RoO1xuICAgIGlmICh2YWwuQllURVNfUEVSX0VMRU1FTlQpIHtcbiAgICAgIHRoaXMuJHBpY2tpbmdDb2xvcnMgPSB2YWw7XG4gICAgfSBlbHNlIGlmICh0aGlzLiRwaWNraW5nQ29sb3JzTGVuZ3RoID09PSB2bGVuKSB7XG4gICAgICB0aGlzLiRwaWNraW5nQ29sb3JzLnNldCh2YWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiRwaWNraW5nQ29sb3JzID0gbmV3IEZsb2F0MzJBcnJheSh2YWwpO1xuICAgIH1cbiAgICBpZiAodGhpcy4kdmVydGljZXMgJiYgdGhpcy4kdmVydGljZXNMZW5ndGggLyAzICogNCAhPT0gdmxlbikge1xuICAgICAgdGhpcy4kcGlja2luZ0NvbG9ycyA9IG5vcm1hbGl6ZUNvbG9ycyhcbiAgICAgICAgQXJyYXkuc2xpY2UuY2FsbCh0aGlzLiRwaWNraW5nQ29sb3JzKSwgdGhpcy4kdmVydGljZXNMZW5ndGggLyAzICogNCk7XG4gICAgfVxuICAgIHRoaXMuJHBpY2tpbmdDb2xvcnNMZW5ndGggPSB0aGlzLiRwaWNraW5nQ29sb3JzLmxlbmd0aDtcbiAgfVxuXG4gIGdldCBwaWNraW5nQ29sb3JzKCkge1xuICAgIHJldHVybiB0aGlzLiRwaWNraW5nQ29sb3JzO1xuICB9XG5cbiAgZ2V0IHRleENvb3JkcygpIHtcbiAgICByZXR1cm4gdGhpcy4kdGV4Q29vcmRzO1xuICB9XG5cbiAgc2V0IHRleENvb3Jkcyh2YWwpIHtcbiAgICBpZiAoIXZhbCkge1xuICAgICAgZGVsZXRlIHRoaXMuJHRleENvb3JkcztcbiAgICAgIGRlbGV0ZSB0aGlzLiR0ZXhDb29yZHNMZW5ndGg7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh2YWwuY29uc3RydWN0b3IubmFtZSA9PT0gJ09iamVjdCcpIHtcbiAgICAgIHZhciBhbnMgPSB7fTtcbiAgICAgIGZvciAodmFyIHByb3AgaW4gdmFsKSB7XG4gICAgICAgIHZhciB0ZXhDb29yZEFycmF5ID0gdmFsW3Byb3BdO1xuICAgICAgICBhbnNbcHJvcF0gPSB0ZXhDb29yZEFycmF5LkJZVEVTX1BFUl9FTEVNRU5UID9cbiAgICAgICAgICB0ZXhDb29yZEFycmF5IDogbmV3IEZsb2F0MzJBcnJheSh0ZXhDb29yZEFycmF5KTtcbiAgICAgIH1cbiAgICAgIHRoaXMuJHRleENvb3JkcyA9IGFucztcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHZsZW4gPSB2YWwubGVuZ3RoO1xuICAgICAgaWYgKHZhbC5CWVRFU19QRVJfRUxFTUVOVCkge1xuICAgICAgICB0aGlzLiR0ZXhDb29yZHMgPSB2YWw7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuJHRleENvb3Jkc0xlbmd0aCA9PT0gdmxlbikge1xuICAgICAgICB0aGlzLiR0ZXhDb29yZHMuc2V0KHZhbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLiR0ZXhDb29yZHMgPSBuZXcgRmxvYXQzMkFycmF5KHZhbCk7XG4gICAgICB9XG4gICAgICB0aGlzLiR0ZXhDb29yZHNMZW5ndGggPSB2bGVuO1xuICAgIH1cbiAgfVxuXG4gIHNldCBpbmRpY2VzKHZhbCkge1xuICAgIGlmICghdmFsKSB7XG4gICAgICBkZWxldGUgdGhpcy4kaW5kaWNlcztcbiAgICAgIGRlbGV0ZSB0aGlzLiRpbmRpY2VzTGVuZ3RoO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdmxlbiA9IHZhbC5sZW5ndGg7XG4gICAgaWYgKHZhbC5CWVRFU19QRVJfRUxFTUVOVCkge1xuICAgICAgdGhpcy4kaW5kaWNlcyA9IHZhbDtcbiAgICB9IGVsc2UgaWYgKHRoaXMuJGluZGljZXNMZW5ndGggPT09IHZsZW4pIHtcbiAgICAgIHRoaXMuJGluZGljZXMuc2V0KHZhbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuJGluZGljZXMgPSBuZXcgVWludDE2QXJyYXkodmFsKTtcbiAgICB9XG4gICAgdGhpcy4kaW5kaWNlc0xlbmd0aCA9IHZsZW47XG4gIH1cbiAgKi9cblxufVxuXG4vKlxuZnVuY3Rpb24gbm9ybWFsaXplQ29sb3JzKGFyciwgbGVuKSB7XG4gIGlmIChhcnIgJiYgYXJyLmxlbmd0aCA8IGxlbikge1xuICAgIGNvbnN0IGEwID0gYXJyWzBdO1xuICAgIGNvbnN0IGExID0gYXJyWzFdO1xuICAgIGNvbnN0IGEyID0gYXJyWzJdO1xuICAgIGNvbnN0IGEzID0gYXJyWzNdO1xuICAgIGNvbnN0IGFucyA9IFthMCwgYTEsIGEyLCBhM107XG4gICAgbGV0IHRpbWVzID0gbGVuIC8gYXJyLmxlbmd0aDtcbiAgICBsZXQgaW5kZXg7XG5cbiAgICB3aGlsZSAoLS10aW1lcykge1xuICAgICAgaW5kZXggPSB0aW1lcyAqIDQ7XG4gICAgICBhbnNbaW5kZXggKyAwXSA9IGEwO1xuICAgICAgYW5zW2luZGV4ICsgMV0gPSBhMTtcbiAgICAgIGFuc1tpbmRleCArIDJdID0gYTI7XG4gICAgICBhbnNbaW5kZXggKyAzXSA9IGEzO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgRmxvYXQzMkFycmF5KGFucyk7XG4gIH1cbiAgcmV0dXJuIGFycjtcbn1cbiovXG4iXX0=