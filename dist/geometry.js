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
      // throw new Error('Cannot deduce geometry vertex count');
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
//# sourceMappingURL=data:application/json;base64,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Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7U0EvRUsiLCJmaWxlIjoiZ2VvbWV0cnkuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0RSQVdfTU9ERVMsIGlzVHlwZWRBcnJheX0gZnJvbSAnLi93ZWJnbC90eXBlcyc7XG5pbXBvcnQge3VpZH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbmNvbnN0IElMTEVHQUxfQVJHID0gJ0dlb21ldHJ5OiBJbGxlZ2FsIGFyZ3VtZW50JztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR2VvbWV0cnkge1xuXG4gIGNvbnN0cnVjdG9yKHtkcmF3TW9kZSA9ICdUUklBTkdMRVMnLCBpZCA9IHVpZCgpLCBhdHRyaWJ1dGVzLCAuLi5hdHRyc30pIHtcbiAgICBhc3NlcnQoRFJBV19NT0RFUy5pbmNsdWRlcyhkcmF3TW9kZSksIElMTEVHQUxfQVJHKTtcblxuICAgIHRoaXMuaWQgPSBpZDtcbiAgICB0aGlzLmRyYXdNb2RlID0gZHJhd01vZGU7XG4gICAgdGhpcy5hdHRyaWJ1dGVzID0ge307XG4gICAgdGhpcy51c2VyRGF0YSA9IHt9O1xuICAgIE9iamVjdC5zZWFsKHRoaXMpO1xuXG4gICAgdGhpcy5zZXRBdHRyaWJ1dGVzKGF0dHJpYnV0ZXMpO1xuICAgIHRoaXMuc2V0QXR0cmlidXRlcyhhdHRycyk7XG4gIH1cblxuICBnZXRWZXJ0ZXhDb3VudCgpIHtcbiAgICBpZiAodGhpcy5hdHRyaWJ1dGVzLmluZGljZXMpIHtcbiAgICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXMuaW5kaWNlcy52YWx1ZS5sZW5ndGg7XG4gICAgfSBlbHNlIGlmICh0aGlzLmF0dHJpYnV0ZXMudmVydGljZXMpIHtcbiAgICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXMudmVydGljZXMudmFsdWUubGVuZ3RoIC8gMztcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICAgIC8vIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGRlZHVjZSBnZW9tZXRyeSB2ZXJ0ZXggY291bnQnKTtcbiAgfVxuXG4gIGhhc0F0dHJpYnV0ZShhdHRyaWJ1dGVOYW1lKSB7XG4gICAgcmV0dXJuIEJvb2xlYW4odGhpcy5hdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdKTtcbiAgfVxuXG4gIGdldEF0dHJpYnV0ZShhdHRyaWJ1dGVOYW1lKSB7XG4gICAgY29uc3QgYXR0cmlidXRlID0gdGhpcy5hdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdO1xuICAgIGFzc2VydChhdHRyaWJ1dGUpO1xuICAgIHJldHVybiBhdHRyaWJ1dGUudmFsdWU7XG4gIH1cblxuICBnZXRBcnJheShhdHRyaWJ1dGVOYW1lKSB7XG4gICAgY29uc3QgYXR0cmlidXRlID0gdGhpcy5hdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdO1xuICAgIGFzc2VydChhdHRyaWJ1dGUpO1xuICAgIHJldHVybiBhdHRyaWJ1dGUudmFsdWU7XG4gIH1cblxuICBzZXRBdHRyaWJ1dGVzKGF0dHJpYnV0ZXMpIHtcbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZU5hbWUgaW4gYXR0cmlidXRlcykge1xuICAgICAgY29uc3QgYXR0cmlidXRlID0gYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXTtcbiAgICAgIGlmIChpc1R5cGVkQXJyYXkoYXR0cmlidXRlKSkge1xuICAgICAgICB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV0gPSB7XG4gICAgICAgICAgdmFsdWU6IGF0dHJpYnV0ZSxcbiAgICAgICAgICBzaXplOiBhdHRyaWJ1dGVOYW1lID09PSAnaW5zdGFuY2VkJyA/IDEgOiAzLFxuICAgICAgICAgIGluc3RhbmNlZDogMFxuICAgICAgICB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYXNzZXJ0KGF0dHJpYnV0ZS52YWx1ZSk7XG4gICAgICAgIGFzc2VydChhdHRyaWJ1dGUuc2l6ZSk7XG4gICAgICAgIHRoaXMuYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXSA9IGF0dHJpYnV0ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXRBdHRyaWJ1dGVzKCkge1xuICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXM7XG4gIH1cblxuICBnZXQgdmVydGljZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlcy52ZXJ0aWNlcztcbiAgfVxuXG4gIGdldCBub3JtYWxzKCkge1xuICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXMubm9ybWFscztcbiAgfVxuXG4gIGdldCBjb2xvcnMoKSB7XG4gICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlcy5jb2xvcnM7XG4gIH1cblxuICBnZXQgdGV4Q29vcmRzKCkge1xuICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXMudGV4Q29vcmRzO1xuICB9XG5cbiAgZ2V0IGluZGljZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlcy5pbmRpY2VzO1xuICB9XG5cbiAgLy8gVE9ETyAtIHJlbW92ZSBjb2RlIGJlbG93XG4gIC8qXG4gIHNldCB2ZXJ0aWNlcyh2YWwpIHtcbiAgICBpZiAoIXZhbCkge1xuICAgICAgZGVsZXRlIHRoaXMuJHZlcnRpY2VzO1xuICAgICAgZGVsZXRlIHRoaXMuJHZlcnRpY2VzTGVuZ3RoO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCB2bGVuID0gdmFsLmxlbmd0aDtcbiAgICBpZiAodmFsLkJZVEVTX1BFUl9FTEVNRU5UKSB7XG4gICAgICB0aGlzLiR2ZXJ0aWNlcyA9IHZhbDtcbiAgICB9IGVsc2UgaWYgKHRoaXMuJHZlcnRpY2VzTGVuZ3RoID09PSB2bGVuKSB7XG4gICAgICB0aGlzLiR2ZXJ0aWNlcy5zZXQodmFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4kdmVydGljZXMgPSBuZXcgRmxvYXQzMkFycmF5KHZhbCk7XG4gICAgfVxuICAgIHRoaXMuJHZlcnRpY2VzTGVuZ3RoID0gdmxlbjtcbiAgfVxuXG4gIHNldCBub3JtYWxzKHZhbCkge1xuICAgIGlmICghdmFsKSB7XG4gICAgICBkZWxldGUgdGhpcy4kbm9ybWFscztcbiAgICAgIGRlbGV0ZSB0aGlzLiRub3JtYWxzTGVuZ3RoO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCB2bGVuID0gdmFsLmxlbmd0aDtcbiAgICBpZiAodmFsLkJZVEVTX1BFUl9FTEVNRU5UKSB7XG4gICAgICB0aGlzLiRub3JtYWxzID0gdmFsO1xuICAgIH0gZWxzZSBpZiAodGhpcy4kbm9ybWFsc0xlbmd0aCA9PT0gdmxlbikge1xuICAgICAgdGhpcy4kbm9ybWFscy5zZXQodmFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4kbm9ybWFscyA9IG5ldyBGbG9hdDMyQXJyYXkodmFsKTtcbiAgICB9XG4gICAgdGhpcy4kbm9ybWFsc0xlbmd0aCA9IHZsZW47XG4gIH1cblxuICBzZXQgY29sb3JzKHZhbCkge1xuICAgIGlmICghdmFsKSB7XG4gICAgICBkZWxldGUgdGhpcy4kY29sb3JzO1xuICAgICAgZGVsZXRlIHRoaXMuJGNvbG9yc0xlbmd0aDtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgdmxlbiA9IHZhbC5sZW5ndGg7XG4gICAgaWYgKHZhbC5CWVRFU19QRVJfRUxFTUVOVCkge1xuICAgICAgdGhpcy4kY29sb3JzID0gdmFsO1xuICAgIH0gZWxzZSBpZiAodGhpcy4kY29sb3JzTGVuZ3RoID09PSB2bGVuKSB7XG4gICAgICB0aGlzLiRjb2xvcnMuc2V0KHZhbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuJGNvbG9ycyA9IG5ldyBGbG9hdDMyQXJyYXkodmFsKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuJHZlcnRpY2VzICYmIHRoaXMuJHZlcnRpY2VzTGVuZ3RoIC8gMyAqIDQgIT09IHZsZW4pIHtcbiAgICAgIHRoaXMuJGNvbG9ycyA9IG5vcm1hbGl6ZUNvbG9ycyhcbiAgICAgICAgQXJyYXkuc2xpY2UuY2FsbCh0aGlzLiRjb2xvcnMpLCB0aGlzLiR2ZXJ0aWNlc0xlbmd0aCAvIDMgKiA0KTtcbiAgICB9XG4gICAgdGhpcy4kY29sb3JzTGVuZ3RoID0gdGhpcy4kY29sb3JzLmxlbmd0aDtcbiAgfVxuXG4gIHNldCBwaWNraW5nQ29sb3JzKHZhbCkge1xuICAgIGlmICghdmFsKSB7XG4gICAgICBkZWxldGUgdGhpcy4kcGlja2luZ0NvbG9ycztcbiAgICAgIGRlbGV0ZSB0aGlzLiRwaWNraW5nQ29sb3JzTGVuZ3RoO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCB2bGVuID0gdmFsLmxlbmd0aDtcbiAgICBpZiAodmFsLkJZVEVTX1BFUl9FTEVNRU5UKSB7XG4gICAgICB0aGlzLiRwaWNraW5nQ29sb3JzID0gdmFsO1xuICAgIH0gZWxzZSBpZiAodGhpcy4kcGlja2luZ0NvbG9yc0xlbmd0aCA9PT0gdmxlbikge1xuICAgICAgdGhpcy4kcGlja2luZ0NvbG9ycy5zZXQodmFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4kcGlja2luZ0NvbG9ycyA9IG5ldyBGbG9hdDMyQXJyYXkodmFsKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuJHZlcnRpY2VzICYmIHRoaXMuJHZlcnRpY2VzTGVuZ3RoIC8gMyAqIDQgIT09IHZsZW4pIHtcbiAgICAgIHRoaXMuJHBpY2tpbmdDb2xvcnMgPSBub3JtYWxpemVDb2xvcnMoXG4gICAgICAgIEFycmF5LnNsaWNlLmNhbGwodGhpcy4kcGlja2luZ0NvbG9ycyksIHRoaXMuJHZlcnRpY2VzTGVuZ3RoIC8gMyAqIDQpO1xuICAgIH1cbiAgICB0aGlzLiRwaWNraW5nQ29sb3JzTGVuZ3RoID0gdGhpcy4kcGlja2luZ0NvbG9ycy5sZW5ndGg7XG4gIH1cblxuICBnZXQgcGlja2luZ0NvbG9ycygpIHtcbiAgICByZXR1cm4gdGhpcy4kcGlja2luZ0NvbG9ycztcbiAgfVxuXG4gIGdldCB0ZXhDb29yZHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuJHRleENvb3JkcztcbiAgfVxuXG4gIHNldCB0ZXhDb29yZHModmFsKSB7XG4gICAgaWYgKCF2YWwpIHtcbiAgICAgIGRlbGV0ZSB0aGlzLiR0ZXhDb29yZHM7XG4gICAgICBkZWxldGUgdGhpcy4kdGV4Q29vcmRzTGVuZ3RoO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodmFsLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdPYmplY3QnKSB7XG4gICAgICB2YXIgYW5zID0ge307XG4gICAgICBmb3IgKHZhciBwcm9wIGluIHZhbCkge1xuICAgICAgICB2YXIgdGV4Q29vcmRBcnJheSA9IHZhbFtwcm9wXTtcbiAgICAgICAgYW5zW3Byb3BdID0gdGV4Q29vcmRBcnJheS5CWVRFU19QRVJfRUxFTUVOVCA/XG4gICAgICAgICAgdGV4Q29vcmRBcnJheSA6IG5ldyBGbG9hdDMyQXJyYXkodGV4Q29vcmRBcnJheSk7XG4gICAgICB9XG4gICAgICB0aGlzLiR0ZXhDb29yZHMgPSBhbnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciB2bGVuID0gdmFsLmxlbmd0aDtcbiAgICAgIGlmICh2YWwuQllURVNfUEVSX0VMRU1FTlQpIHtcbiAgICAgICAgdGhpcy4kdGV4Q29vcmRzID0gdmFsO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLiR0ZXhDb29yZHNMZW5ndGggPT09IHZsZW4pIHtcbiAgICAgICAgdGhpcy4kdGV4Q29vcmRzLnNldCh2YWwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy4kdGV4Q29vcmRzID0gbmV3IEZsb2F0MzJBcnJheSh2YWwpO1xuICAgICAgfVxuICAgICAgdGhpcy4kdGV4Q29vcmRzTGVuZ3RoID0gdmxlbjtcbiAgICB9XG4gIH1cblxuICBzZXQgaW5kaWNlcyh2YWwpIHtcbiAgICBpZiAoIXZhbCkge1xuICAgICAgZGVsZXRlIHRoaXMuJGluZGljZXM7XG4gICAgICBkZWxldGUgdGhpcy4kaW5kaWNlc0xlbmd0aDtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHZsZW4gPSB2YWwubGVuZ3RoO1xuICAgIGlmICh2YWwuQllURVNfUEVSX0VMRU1FTlQpIHtcbiAgICAgIHRoaXMuJGluZGljZXMgPSB2YWw7XG4gICAgfSBlbHNlIGlmICh0aGlzLiRpbmRpY2VzTGVuZ3RoID09PSB2bGVuKSB7XG4gICAgICB0aGlzLiRpbmRpY2VzLnNldCh2YWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiRpbmRpY2VzID0gbmV3IFVpbnQxNkFycmF5KHZhbCk7XG4gICAgfVxuICAgIHRoaXMuJGluZGljZXNMZW5ndGggPSB2bGVuO1xuICB9XG4gICovXG5cbn1cblxuLypcbmZ1bmN0aW9uIG5vcm1hbGl6ZUNvbG9ycyhhcnIsIGxlbikge1xuICBpZiAoYXJyICYmIGFyci5sZW5ndGggPCBsZW4pIHtcbiAgICBjb25zdCBhMCA9IGFyclswXTtcbiAgICBjb25zdCBhMSA9IGFyclsxXTtcbiAgICBjb25zdCBhMiA9IGFyclsyXTtcbiAgICBjb25zdCBhMyA9IGFyclszXTtcbiAgICBjb25zdCBhbnMgPSBbYTAsIGExLCBhMiwgYTNdO1xuICAgIGxldCB0aW1lcyA9IGxlbiAvIGFyci5sZW5ndGg7XG4gICAgbGV0IGluZGV4O1xuXG4gICAgd2hpbGUgKC0tdGltZXMpIHtcbiAgICAgIGluZGV4ID0gdGltZXMgKiA0O1xuICAgICAgYW5zW2luZGV4ICsgMF0gPSBhMDtcbiAgICAgIGFuc1tpbmRleCArIDFdID0gYTE7XG4gICAgICBhbnNbaW5kZXggKyAyXSA9IGEyO1xuICAgICAgYW5zW2luZGV4ICsgM10gPSBhMztcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IEZsb2F0MzJBcnJheShhbnMpO1xuICB9XG4gIHJldHVybiBhcnI7XG59XG4qL1xuIl19