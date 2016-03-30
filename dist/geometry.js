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
    key: 'setAttributes',
    value: function setAttributes(attributes) {
      for (var attributeName in attributes) {
        var attribute = attributes[attributeName];
        (0, _assert2.default)((0, _types.isTypedArray)(attribute), ILLEGAL_ARG);
      }
      Object.assign(this.attributes, attributes);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9nZW9tZXRyeS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBSUEsSUFBTSxjQUFjLDRCQUFkOztJQUVlO0FBRW5CLFdBRm1CLFFBRW5CLE9BQXdFOzZCQUEzRCxTQUEyRDtRQUEzRCx5Q0FBVyw0QkFBZ0Q7dUJBQW5DLEdBQW1DO1FBQW5DLDZCQUFLLDRCQUE4QjtRQUF2Qiw2QkFBdUI7O1FBQVIseUVBQVE7OzBCQUZyRCxVQUVxRDs7QUFDdEUsMEJBQU8sa0JBQVcsUUFBWCxDQUFvQixRQUFwQixDQUFQLEVBQXNDLFdBQXRDLEVBRHNFOztBQUd0RSxTQUFLLEVBQUwsR0FBVSxFQUFWLENBSHNFO0FBSXRFLFNBQUssUUFBTCxHQUFnQixRQUFoQixDQUpzRTtBQUt0RSxTQUFLLFVBQUwsR0FBa0IsRUFBbEIsQ0FMc0U7QUFNdEUsU0FBSyxRQUFMLEdBQWdCLEVBQWhCLENBTnNFO0FBT3RFLFdBQU8sSUFBUCxDQUFZLElBQVosRUFQc0U7O0FBU3RFLFNBQUssYUFBTCxDQUFtQixVQUFuQixFQVRzRTtBQVV0RSxTQUFLLGFBQUwsQ0FBbUIsS0FBbkIsRUFWc0U7R0FBeEU7O2VBRm1COztrQ0FlTCxZQUFZO0FBQ3hCLFdBQUssSUFBTSxhQUFOLElBQXVCLFVBQTVCLEVBQXdDO0FBQ3RDLFlBQU0sWUFBWSxXQUFXLGFBQVgsQ0FBWixDQURnQztBQUV0Qyw4QkFBTyx5QkFBYSxTQUFiLENBQVAsRUFBZ0MsV0FBaEMsRUFGc0M7T0FBeEM7QUFJQSxhQUFPLE1BQVAsQ0FBYyxLQUFLLFVBQUwsRUFBaUIsVUFBL0IsRUFMd0I7Ozs7d0JBUVg7QUFDYixhQUFPLEtBQUssVUFBTCxDQUFnQixRQUFoQixDQURNOzs7O3dCQUlEO0FBQ1osYUFBTyxLQUFLLFVBQUwsQ0FBZ0IsT0FBaEIsQ0FESzs7Ozt3QkFJRDtBQUNYLGFBQU8sS0FBSyxVQUFMLENBQWdCLE1BQWhCLENBREk7Ozs7d0JBSUc7QUFDZCxhQUFPLEtBQUssVUFBTCxDQUFnQixTQUFoQixDQURPOzs7O3dCQUlGO0FBQ1osYUFBTyxLQUFLLFVBQUwsQ0FBZ0IsT0FBaEIsQ0FESzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1NBdkNLIiwiZmlsZSI6Imdlb21ldHJ5LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtEUkFXX01PREVTLCBpc1R5cGVkQXJyYXl9IGZyb20gJy4vd2ViZ2wvdHlwZXMnO1xuaW1wb3J0IHt1aWR9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG5jb25zdCBJTExFR0FMX0FSRyA9ICdHZW9tZXRyeTogSWxsZWdhbCBhcmd1bWVudCc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEdlb21ldHJ5IHtcblxuICBjb25zdHJ1Y3Rvcih7ZHJhd01vZGUgPSAnVFJJQU5HTEVTJywgaWQgPSB1aWQoKSwgYXR0cmlidXRlcywgLi4uYXR0cnN9KSB7XG4gICAgYXNzZXJ0KERSQVdfTU9ERVMuaW5jbHVkZXMoZHJhd01vZGUpLCBJTExFR0FMX0FSRyk7XG5cbiAgICB0aGlzLmlkID0gaWQ7XG4gICAgdGhpcy5kcmF3TW9kZSA9IGRyYXdNb2RlO1xuICAgIHRoaXMuYXR0cmlidXRlcyA9IHt9O1xuICAgIHRoaXMudXNlckRhdGEgPSB7fTtcbiAgICBPYmplY3Quc2VhbCh0aGlzKTtcblxuICAgIHRoaXMuc2V0QXR0cmlidXRlcyhhdHRyaWJ1dGVzKTtcbiAgICB0aGlzLnNldEF0dHJpYnV0ZXMoYXR0cnMpO1xuICB9XG5cbiAgc2V0QXR0cmlidXRlcyhhdHRyaWJ1dGVzKSB7XG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGVOYW1lIGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IGF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV07XG4gICAgICBhc3NlcnQoaXNUeXBlZEFycmF5KGF0dHJpYnV0ZSksIElMTEVHQUxfQVJHKTtcbiAgICB9XG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLmF0dHJpYnV0ZXMsIGF0dHJpYnV0ZXMpO1xuICB9XG5cbiAgZ2V0IHZlcnRpY2VzKCkge1xuICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXMudmVydGljZXM7XG4gIH1cblxuICBnZXQgbm9ybWFscygpIHtcbiAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzLm5vcm1hbHM7XG4gIH1cblxuICBnZXQgY29sb3JzKCkge1xuICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXMuY29sb3JzO1xuICB9XG5cbiAgZ2V0IHRleENvb3JkcygpIHtcbiAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzLnRleENvb3JkcztcbiAgfVxuXG4gIGdldCBpbmRpY2VzKCkge1xuICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXMuaW5kaWNlcztcbiAgfVxuXG4gIC8vIFRPRE8gLSByZW1vdmUgY29kZSBiZWxvd1xuICAvKlxuICBzZXQgdmVydGljZXModmFsKSB7XG4gICAgaWYgKCF2YWwpIHtcbiAgICAgIGRlbGV0ZSB0aGlzLiR2ZXJ0aWNlcztcbiAgICAgIGRlbGV0ZSB0aGlzLiR2ZXJ0aWNlc0xlbmd0aDtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgdmxlbiA9IHZhbC5sZW5ndGg7XG4gICAgaWYgKHZhbC5CWVRFU19QRVJfRUxFTUVOVCkge1xuICAgICAgdGhpcy4kdmVydGljZXMgPSB2YWw7XG4gICAgfSBlbHNlIGlmICh0aGlzLiR2ZXJ0aWNlc0xlbmd0aCA9PT0gdmxlbikge1xuICAgICAgdGhpcy4kdmVydGljZXMuc2V0KHZhbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuJHZlcnRpY2VzID0gbmV3IEZsb2F0MzJBcnJheSh2YWwpO1xuICAgIH1cbiAgICB0aGlzLiR2ZXJ0aWNlc0xlbmd0aCA9IHZsZW47XG4gIH1cblxuICBzZXQgbm9ybWFscyh2YWwpIHtcbiAgICBpZiAoIXZhbCkge1xuICAgICAgZGVsZXRlIHRoaXMuJG5vcm1hbHM7XG4gICAgICBkZWxldGUgdGhpcy4kbm9ybWFsc0xlbmd0aDtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgdmxlbiA9IHZhbC5sZW5ndGg7XG4gICAgaWYgKHZhbC5CWVRFU19QRVJfRUxFTUVOVCkge1xuICAgICAgdGhpcy4kbm9ybWFscyA9IHZhbDtcbiAgICB9IGVsc2UgaWYgKHRoaXMuJG5vcm1hbHNMZW5ndGggPT09IHZsZW4pIHtcbiAgICAgIHRoaXMuJG5vcm1hbHMuc2V0KHZhbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuJG5vcm1hbHMgPSBuZXcgRmxvYXQzMkFycmF5KHZhbCk7XG4gICAgfVxuICAgIHRoaXMuJG5vcm1hbHNMZW5ndGggPSB2bGVuO1xuICB9XG5cbiAgc2V0IGNvbG9ycyh2YWwpIHtcbiAgICBpZiAoIXZhbCkge1xuICAgICAgZGVsZXRlIHRoaXMuJGNvbG9ycztcbiAgICAgIGRlbGV0ZSB0aGlzLiRjb2xvcnNMZW5ndGg7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHZsZW4gPSB2YWwubGVuZ3RoO1xuICAgIGlmICh2YWwuQllURVNfUEVSX0VMRU1FTlQpIHtcbiAgICAgIHRoaXMuJGNvbG9ycyA9IHZhbDtcbiAgICB9IGVsc2UgaWYgKHRoaXMuJGNvbG9yc0xlbmd0aCA9PT0gdmxlbikge1xuICAgICAgdGhpcy4kY29sb3JzLnNldCh2YWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLiRjb2xvcnMgPSBuZXcgRmxvYXQzMkFycmF5KHZhbCk7XG4gICAgfVxuICAgIGlmICh0aGlzLiR2ZXJ0aWNlcyAmJiB0aGlzLiR2ZXJ0aWNlc0xlbmd0aCAvIDMgKiA0ICE9PSB2bGVuKSB7XG4gICAgICB0aGlzLiRjb2xvcnMgPSBub3JtYWxpemVDb2xvcnMoXG4gICAgICAgIEFycmF5LnNsaWNlLmNhbGwodGhpcy4kY29sb3JzKSwgdGhpcy4kdmVydGljZXNMZW5ndGggLyAzICogNCk7XG4gICAgfVxuICAgIHRoaXMuJGNvbG9yc0xlbmd0aCA9IHRoaXMuJGNvbG9ycy5sZW5ndGg7XG4gIH1cblxuICBzZXQgcGlja2luZ0NvbG9ycyh2YWwpIHtcbiAgICBpZiAoIXZhbCkge1xuICAgICAgZGVsZXRlIHRoaXMuJHBpY2tpbmdDb2xvcnM7XG4gICAgICBkZWxldGUgdGhpcy4kcGlja2luZ0NvbG9yc0xlbmd0aDtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgdmxlbiA9IHZhbC5sZW5ndGg7XG4gICAgaWYgKHZhbC5CWVRFU19QRVJfRUxFTUVOVCkge1xuICAgICAgdGhpcy4kcGlja2luZ0NvbG9ycyA9IHZhbDtcbiAgICB9IGVsc2UgaWYgKHRoaXMuJHBpY2tpbmdDb2xvcnNMZW5ndGggPT09IHZsZW4pIHtcbiAgICAgIHRoaXMuJHBpY2tpbmdDb2xvcnMuc2V0KHZhbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuJHBpY2tpbmdDb2xvcnMgPSBuZXcgRmxvYXQzMkFycmF5KHZhbCk7XG4gICAgfVxuICAgIGlmICh0aGlzLiR2ZXJ0aWNlcyAmJiB0aGlzLiR2ZXJ0aWNlc0xlbmd0aCAvIDMgKiA0ICE9PSB2bGVuKSB7XG4gICAgICB0aGlzLiRwaWNraW5nQ29sb3JzID0gbm9ybWFsaXplQ29sb3JzKFxuICAgICAgICBBcnJheS5zbGljZS5jYWxsKHRoaXMuJHBpY2tpbmdDb2xvcnMpLCB0aGlzLiR2ZXJ0aWNlc0xlbmd0aCAvIDMgKiA0KTtcbiAgICB9XG4gICAgdGhpcy4kcGlja2luZ0NvbG9yc0xlbmd0aCA9IHRoaXMuJHBpY2tpbmdDb2xvcnMubGVuZ3RoO1xuICB9XG5cbiAgZ2V0IHBpY2tpbmdDb2xvcnMoKSB7XG4gICAgcmV0dXJuIHRoaXMuJHBpY2tpbmdDb2xvcnM7XG4gIH1cblxuICBnZXQgdGV4Q29vcmRzKCkge1xuICAgIHJldHVybiB0aGlzLiR0ZXhDb29yZHM7XG4gIH1cblxuICBzZXQgdGV4Q29vcmRzKHZhbCkge1xuICAgIGlmICghdmFsKSB7XG4gICAgICBkZWxldGUgdGhpcy4kdGV4Q29vcmRzO1xuICAgICAgZGVsZXRlIHRoaXMuJHRleENvb3Jkc0xlbmd0aDtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHZhbC5jb25zdHJ1Y3Rvci5uYW1lID09PSAnT2JqZWN0Jykge1xuICAgICAgdmFyIGFucyA9IHt9O1xuICAgICAgZm9yICh2YXIgcHJvcCBpbiB2YWwpIHtcbiAgICAgICAgdmFyIHRleENvb3JkQXJyYXkgPSB2YWxbcHJvcF07XG4gICAgICAgIGFuc1twcm9wXSA9IHRleENvb3JkQXJyYXkuQllURVNfUEVSX0VMRU1FTlQgP1xuICAgICAgICAgIHRleENvb3JkQXJyYXkgOiBuZXcgRmxvYXQzMkFycmF5KHRleENvb3JkQXJyYXkpO1xuICAgICAgfVxuICAgICAgdGhpcy4kdGV4Q29vcmRzID0gYW5zO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgdmxlbiA9IHZhbC5sZW5ndGg7XG4gICAgICBpZiAodmFsLkJZVEVTX1BFUl9FTEVNRU5UKSB7XG4gICAgICAgIHRoaXMuJHRleENvb3JkcyA9IHZhbDtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy4kdGV4Q29vcmRzTGVuZ3RoID09PSB2bGVuKSB7XG4gICAgICAgIHRoaXMuJHRleENvb3Jkcy5zZXQodmFsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuJHRleENvb3JkcyA9IG5ldyBGbG9hdDMyQXJyYXkodmFsKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuJHRleENvb3Jkc0xlbmd0aCA9IHZsZW47XG4gICAgfVxuICB9XG5cbiAgc2V0IGluZGljZXModmFsKSB7XG4gICAgaWYgKCF2YWwpIHtcbiAgICAgIGRlbGV0ZSB0aGlzLiRpbmRpY2VzO1xuICAgICAgZGVsZXRlIHRoaXMuJGluZGljZXNMZW5ndGg7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB2bGVuID0gdmFsLmxlbmd0aDtcbiAgICBpZiAodmFsLkJZVEVTX1BFUl9FTEVNRU5UKSB7XG4gICAgICB0aGlzLiRpbmRpY2VzID0gdmFsO1xuICAgIH0gZWxzZSBpZiAodGhpcy4kaW5kaWNlc0xlbmd0aCA9PT0gdmxlbikge1xuICAgICAgdGhpcy4kaW5kaWNlcy5zZXQodmFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy4kaW5kaWNlcyA9IG5ldyBVaW50MTZBcnJheSh2YWwpO1xuICAgIH1cbiAgICB0aGlzLiRpbmRpY2VzTGVuZ3RoID0gdmxlbjtcbiAgfVxuICAqL1xuXG59XG5cbi8qXG5mdW5jdGlvbiBub3JtYWxpemVDb2xvcnMoYXJyLCBsZW4pIHtcbiAgaWYgKGFyciAmJiBhcnIubGVuZ3RoIDwgbGVuKSB7XG4gICAgY29uc3QgYTAgPSBhcnJbMF07XG4gICAgY29uc3QgYTEgPSBhcnJbMV07XG4gICAgY29uc3QgYTIgPSBhcnJbMl07XG4gICAgY29uc3QgYTMgPSBhcnJbM107XG4gICAgY29uc3QgYW5zID0gW2EwLCBhMSwgYTIsIGEzXTtcbiAgICBsZXQgdGltZXMgPSBsZW4gLyBhcnIubGVuZ3RoO1xuICAgIGxldCBpbmRleDtcblxuICAgIHdoaWxlICgtLXRpbWVzKSB7XG4gICAgICBpbmRleCA9IHRpbWVzICogNDtcbiAgICAgIGFuc1tpbmRleCArIDBdID0gYTA7XG4gICAgICBhbnNbaW5kZXggKyAxXSA9IGExO1xuICAgICAgYW5zW2luZGV4ICsgMl0gPSBhMjtcbiAgICAgIGFuc1tpbmRleCArIDNdID0gYTM7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBGbG9hdDMyQXJyYXkoYW5zKTtcbiAgfVxuICByZXR1cm4gYXJyO1xufVxuKi9cbiJdfQ==