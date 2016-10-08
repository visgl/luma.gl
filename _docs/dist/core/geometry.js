'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _utils = require('../utils');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ILLEGAL_ARG = 'Geometry: Illegal argument';

var Geometry = function () {
  function Geometry(_ref) {
    var _ref$id = _ref.id;
    var id = _ref$id === undefined ? (0, _utils.uid)('geometry') : _ref$id;
    var _ref$drawMode = _ref.drawMode;
    var drawMode = _ref$drawMode === undefined ? 'TRIANGLES' : _ref$drawMode;
    var _ref$vertexCount = _ref.vertexCount;
    var vertexCount = _ref$vertexCount === undefined ? undefined : _ref$vertexCount;
    var attributes = _ref.attributes;

    var attrs = _objectWithoutProperties(_ref, ['id', 'drawMode', 'vertexCount', 'attributes']);

    _classCallCheck(this, Geometry);

    (0, _assert2.default)(drawMode, ILLEGAL_ARG);

    this.id = id;
    this.drawMode = drawMode;
    this.vertexCount = vertexCount;
    this.attributes = {};
    this.needsRedraw = true;
    this.userData = {};
    Object.seal(this);

    if (attributes) {
      this.setAttributes(attributes);
    } else {
      this.setAttributes(attrs);
    }
  }

  _createClass(Geometry, [{
    key: 'setNeedsRedraw',
    value: function setNeedsRedraw() {
      var redraw = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

      this.needsRedraw = redraw;
      return this;
    }
  }, {
    key: 'getNeedsRedraw',
    value: function getNeedsRedraw() {
      var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var _ref2$clearRedrawFlag = _ref2.clearRedrawFlags;
      var clearRedrawFlags = _ref2$clearRedrawFlag === undefined ? false : _ref2$clearRedrawFlag;

      var redraw = false;
      redraw = redraw || this.needsRedraw;
      this.needsRedraw = this.needsRedraw && !clearRedrawFlags;
      return redraw;
    }
  }, {
    key: 'setVertexCount',
    value: function setVertexCount(vertexCount) {
      this.vertexCount = vertexCount;
    }
  }, {
    key: 'getVertexCount',
    value: function getVertexCount() {
      if (this.vertexCount !== undefined) {
        return this.vertexCount;
      } else if (this.attributes.indices) {
        return this.attributes.indices.value.length;
      } else if (this.attributes.vertices) {
        return this.attributes.vertices.value.length / 3;
      } else if (this.attributes.positions) {
        return this.attributes.positions.value.length / 3;
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
    key: 'getAttributes',
    value: function getAttributes() {
      return this.attributes;
    }

    // Attribute
    // value: typed array
    // type: indices, vertices, uvs
    // size: elements per vertex
    // target: WebGL buffer type (string or constant)

  }, {
    key: 'setAttributes',
    value: function setAttributes(attributes) {
      for (var attributeName in attributes) {
        var attribute = attributes[attributeName];

        // Wrap "unwrapped" arrays and try to autodetect their type
        attribute = ArrayBuffer.isView(attribute) ? { value: attribute } : attribute;

        (0, _assert2.default)(ArrayBuffer.isView(attribute.value), this._print(attributeName) + ': must be a typed array or an object' + 'with value as typed array');

        this._autoDetectAttribute(attributeName, attribute);

        this.attributes[attributeName] = _extends({}, attribute, {
          instanced: attribute.instanced || 0
        });
      }
      this.setNeedsRedraw();
      return this;
    }

    // Check for well known attribute names
    /* eslint-disable default-case, complexity */

  }, {
    key: '_autoDetectAttribute',
    value: function _autoDetectAttribute(attributeName, attribute) {
      var category = void 0;
      switch (attributeName) {
        case 'indices':
          category = category || 'indices';
          break;
        case 'texCoords':
        case 'texCoord1':
        case 'texCoord2':
        case 'texCoord3':
          category = 'uvs';
          break;
        case 'vertices':
        case 'positions':
        case 'normals':
        case 'pickingColors':
          category = 'vectors';
          break;
      }

      // Check for categorys
      switch (category) {
        case 'vectors':
          attribute.size = attribute.size || 3;
          break;
        case 'uvs':
          attribute.size = attribute.size || 2;
          break;
        case 'indices':
          attribute.size = attribute.size || 1;
          attribute.isIndexed = attribute.isIndexed || true;
          (0, _assert2.default)(attribute.value instanceof Uint16Array || attribute.value instanceof Uint32Array, 'attribute array for "indices" must be of integer type');
          break;
      }

      (0, _assert2.default)(attribute.size, 'attribute ' + attributeName + ' needs size');
    }
    /* eslint-enable default-case, complexity */

  }, {
    key: '_print',
    value: function _print(attributeName) {
      return 'Geometry ' + this.id + ' attribute ' + attributeName;
    }
  }]);

  return Geometry;
}();

exports.default = Geometry;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb3JlL2dlb21ldHJ5LmpzIl0sIm5hbWVzIjpbIklMTEVHQUxfQVJHIiwiR2VvbWV0cnkiLCJpZCIsImRyYXdNb2RlIiwidmVydGV4Q291bnQiLCJ1bmRlZmluZWQiLCJhdHRyaWJ1dGVzIiwiYXR0cnMiLCJuZWVkc1JlZHJhdyIsInVzZXJEYXRhIiwiT2JqZWN0Iiwic2VhbCIsInNldEF0dHJpYnV0ZXMiLCJyZWRyYXciLCJjbGVhclJlZHJhd0ZsYWdzIiwiaW5kaWNlcyIsInZhbHVlIiwibGVuZ3RoIiwidmVydGljZXMiLCJwb3NpdGlvbnMiLCJhdHRyaWJ1dGVOYW1lIiwiQm9vbGVhbiIsImF0dHJpYnV0ZSIsIkFycmF5QnVmZmVyIiwiaXNWaWV3IiwiX3ByaW50IiwiX2F1dG9EZXRlY3RBdHRyaWJ1dGUiLCJpbnN0YW5jZWQiLCJzZXROZWVkc1JlZHJhdyIsImNhdGVnb3J5Iiwic2l6ZSIsImlzSW5kZXhlZCIsIlVpbnQxNkFycmF5IiwiVWludDMyQXJyYXkiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7Ozs7Ozs7Ozs7QUFFQSxJQUFNQSxjQUFjLDRCQUFwQjs7SUFFcUJDLFE7QUFFbkIsMEJBTUc7QUFBQSx1QkFMREMsRUFLQztBQUFBLFFBTERBLEVBS0MsMkJBTEksZ0JBQUksVUFBSixDQUtKO0FBQUEsNkJBSkRDLFFBSUM7QUFBQSxRQUpEQSxRQUlDLGlDQUpVLFdBSVY7QUFBQSxnQ0FIREMsV0FHQztBQUFBLFFBSERBLFdBR0Msb0NBSGFDLFNBR2I7QUFBQSxRQUZEQyxVQUVDLFFBRkRBLFVBRUM7O0FBQUEsUUFERUMsS0FDRjs7QUFBQTs7QUFDRCwwQkFBT0osUUFBUCxFQUFpQkgsV0FBakI7O0FBRUEsU0FBS0UsRUFBTCxHQUFVQSxFQUFWO0FBQ0EsU0FBS0MsUUFBTCxHQUFnQkEsUUFBaEI7QUFDQSxTQUFLQyxXQUFMLEdBQW1CQSxXQUFuQjtBQUNBLFNBQUtFLFVBQUwsR0FBa0IsRUFBbEI7QUFDQSxT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LFVBQUlPLGlCQUFKO0FBQ0EsY0FBUVQsYUFBUjtBQUNBLGFBQUssU0FBTDtBQUNFUyxxQkFBV0EsWUFBWSxTQUF2QjtBQUNBO0FBQ0YsYUFBSyxXQUFMO0FBQ0EsYUFBSyxXQUFMO0FBQ0EsYUFBSyxXQUFMO0FBQ0EsYUFBSyxXQUFMO0FBQ0VBLHFCQUFXLEtBQVg7QUFDQTtBQUNGLGFBQUssVUFBTDtBQUNBLGFBQUssV0FBTDtBQUNBLGFBQUssU0FBTDtBQUNBLGFBQUssZUFBTDtBQUNFQSxxQkFBVyxTQUFYO0FBQ0E7QUFmRjs7QUFrQkE7QUFDQSxjQUFRQSxRQUFSO0FBQ0EsYUFBSyxTQUFMO0FBQ0VQLG9CQUFVUSxJQUFWLEdBQWlCUixVQUFVUSxJQUFWLElBQWtCLENBQW5DO0FBQ0E7QUFDRixhQUFLLEtBQUw7QUFDRVIsb0JBQVVRLElBQVYsR0FBaUJSLFVBQVVRLElBQVYsSUFBa0IsQ0FBbkM7QUFDQTtBQUNGLGFBQUssU0FBTDtBQUNFUixvQkFBVVEsSUFBVixHQUFpQlIsVUFBVVEsSUFBVixJQUFrQixDQUFuQztBQUNBUixvQkFBVVMsU0FBVixHQUFzQlQsVUFBVVMsU0FBVixJQUF1QixJQUE3QztBQUNBLGdDQUNFVCxVQUFVTixLQUFWLFlBQTJCZ0IsV0FBM0IsSUFDQVYsVUFBVU4sS0FBVixZQUEyQmlCLFdBRjdCLEVBR0UsdURBSEY7QUFLQTtBQWZGOztBQWtCQSw0QkFBT1gsVUFBVVEsSUFBakIsaUJBQW9DVixhQUFwQztBQUNEO0FBQ0Q7Ozs7MkJBRU9BLGEsRUFBZTtBQUNwQiwyQkFBbUIsS0FBS2xCLEVBQXhCLG1CQUF3Q2tCLGFBQXhDO0FBQ0Q7Ozs7OztrQkF2SmtCbkIsUSIsImZpbGUiOiJnZW9tZXRyeS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7dWlkfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbmNvbnN0IElMTEVHQUxfQVJHID0gJ0dlb21ldHJ5OiBJbGxlZ2FsIGFyZ3VtZW50JztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR2VvbWV0cnkge1xuXG4gIGNvbnN0cnVjdG9yKHtcbiAgICBpZCA9IHVpZCgnZ2VvbWV0cnknKSxcbiAgICBkcmF3TW9kZSA9ICdUUklBTkdMRVMnLFxuICAgIHZlcnRleENvdW50ID0gdW5kZWZpbmVkLFxuICAgIGF0dHJpYnV0ZXMsXG4gICAgLi4uYXR0cnNcbiAgfSkge1xuICAgIGFzc2VydChkcmF3TW9kZSwgSUxMRUdBTF9BUkcpO1xuXG4gICAgdGhpcy5pZCA9IGlkO1xuICAgIHRoaXMuZHJhd01vZGUgPSBkcmF3TW9kZTtcbiAgICB0aGlzLnZlcnRleENvdW50ID0gdmVydGV4Q291bnQ7XG4gICAgdGhpcy5hdHRyaWJ1dGVzID0ge307XG4gICAgdGhpcy5uZWVkc1JlZHJhdyA9IHRydWU7XG4gICAgdGhpcy51c2VyRGF0YSA9IHt9O1xuICAgIE9iamVjdC5zZWFsKHRoaXMpO1xuXG4gICAgaWYgKGF0dHJpYnV0ZXMpIHtcbiAgICAgIHRoaXMuc2V0QXR0cmlidXRlcyhhdHRyaWJ1dGVzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zZXRBdHRyaWJ1dGVzKGF0dHJzKTtcbiAgICB9XG4gIH1cblxuICBzZXROZWVkc1JlZHJhdyhyZWRyYXcgPSB0cnVlKSB7XG4gICAgdGhpcy5uZWVkc1JlZHJhdyA9IHJlZHJhdztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldE5lZWRzUmVkcmF3KHtjbGVhclJlZHJhd0ZsYWdzID0gZmFsc2V9ID0ge30pIHtcbiAgICBsZXQgcmVkcmF3ID0gZmFsc2U7XG4gICAgcmVkcmF3ID0gcmVkcmF3IHx8IHRoaXMubmVlZHNSZWRyYXc7XG4gICAgdGhpcy5uZWVkc1JlZHJhdyA9IHRoaXMubmVlZHNSZWRyYXcgJiYgIWNsZWFyUmVkcmF3RmxhZ3M7XG4gICAgcmV0dXJuIHJlZHJhdztcbiAgfVxuXG4gIHNldFZlcnRleENvdW50KHZlcnRleENvdW50KSB7XG4gICAgdGhpcy52ZXJ0ZXhDb3VudCA9IHZlcnRleENvdW50O1xuICB9XG5cbiAgZ2V0VmVydGV4Q291bnQoKSB7XG4gICAgaWYgKHRoaXMudmVydGV4Q291bnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHRoaXMudmVydGV4Q291bnQ7XG4gICAgfSBlbHNlIGlmICh0aGlzLmF0dHJpYnV0ZXMuaW5kaWNlcykge1xuICAgICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlcy5pbmRpY2VzLnZhbHVlLmxlbmd0aDtcbiAgICB9IGVsc2UgaWYgKHRoaXMuYXR0cmlidXRlcy52ZXJ0aWNlcykge1xuICAgICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlcy52ZXJ0aWNlcy52YWx1ZS5sZW5ndGggLyAzO1xuICAgIH0gZWxzZSBpZiAodGhpcy5hdHRyaWJ1dGVzLnBvc2l0aW9ucykge1xuICAgICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlcy5wb3NpdGlvbnMudmFsdWUubGVuZ3RoIC8gMztcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgaGFzQXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUpIHtcbiAgICByZXR1cm4gQm9vbGVhbih0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV0pO1xuICB9XG5cbiAgZ2V0QXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUpIHtcbiAgICBjb25zdCBhdHRyaWJ1dGUgPSB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV07XG4gICAgYXNzZXJ0KGF0dHJpYnV0ZSk7XG4gICAgcmV0dXJuIGF0dHJpYnV0ZS52YWx1ZTtcbiAgfVxuXG4gIGdldEFycmF5KGF0dHJpYnV0ZU5hbWUpIHtcbiAgICBjb25zdCBhdHRyaWJ1dGUgPSB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV07XG4gICAgYXNzZXJ0KGF0dHJpYnV0ZSk7XG4gICAgcmV0dXJuIGF0dHJpYnV0ZS52YWx1ZTtcbiAgfVxuXG4gIGdldEF0dHJpYnV0ZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlcztcbiAgfVxuXG4gIC8vIEF0dHJpYnV0ZVxuICAvLyB2YWx1ZTogdHlwZWQgYXJyYXlcbiAgLy8gdHlwZTogaW5kaWNlcywgdmVydGljZXMsIHV2c1xuICAvLyBzaXplOiBlbGVtZW50cyBwZXIgdmVydGV4XG4gIC8vIHRhcmdldDogV2ViR0wgYnVmZmVyIHR5cGUgKHN0cmluZyBvciBjb25zdGFudClcbiAgc2V0QXR0cmlidXRlcyhhdHRyaWJ1dGVzKSB7XG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGVOYW1lIGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgIGxldCBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdO1xuXG4gICAgICAvLyBXcmFwIFwidW53cmFwcGVkXCIgYXJyYXlzIGFuZCB0cnkgdG8gYXV0b2RldGVjdCB0aGVpciB0eXBlXG4gICAgICBhdHRyaWJ1dGUgPSBBcnJheUJ1ZmZlci5pc1ZpZXcoYXR0cmlidXRlKSA/XG4gICAgICAgIHt2YWx1ZTogYXR0cmlidXRlfSA6XG4gICAgICAgIGF0dHJpYnV0ZTtcblxuICAgICAgYXNzZXJ0KEFycmF5QnVmZmVyLmlzVmlldyhhdHRyaWJ1dGUudmFsdWUpLFxuICAgICAgICBgJHt0aGlzLl9wcmludChhdHRyaWJ1dGVOYW1lKX06IG11c3QgYmUgYSB0eXBlZCBhcnJheSBvciBhbiBvYmplY3RgICtcbiAgICAgICAgJ3dpdGggdmFsdWUgYXMgdHlwZWQgYXJyYXknKTtcblxuICAgICAgdGhpcy5fYXV0b0RldGVjdEF0dHJpYnV0ZShhdHRyaWJ1dGVOYW1lLCBhdHRyaWJ1dGUpO1xuXG4gICAgICB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV0gPSB7XG4gICAgICAgIC4uLmF0dHJpYnV0ZSxcbiAgICAgICAgaW5zdGFuY2VkOiBhdHRyaWJ1dGUuaW5zdGFuY2VkIHx8IDBcbiAgICAgIH07XG4gICAgfVxuICAgIHRoaXMuc2V0TmVlZHNSZWRyYXcoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIENoZWNrIGZvciB3ZWxsIGtub3duIGF0dHJpYnV0ZSBuYW1lc1xuICAvKiBlc2xpbnQtZGlzYWJsZSBkZWZhdWx0LWNhc2UsIGNvbXBsZXhpdHkgKi9cbiAgX2F1dG9EZXRlY3RBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZSwgYXR0cmlidXRlKSB7XG4gICAgbGV0IGNhdGVnb3J5O1xuICAgIHN3aXRjaCAoYXR0cmlidXRlTmFtZSkge1xuICAgIGNhc2UgJ2luZGljZXMnOlxuICAgICAgY2F0ZWdvcnkgPSBjYXRlZ29yeSB8fCAnaW5kaWNlcyc7XG4gICAgICBicmVhaztcbiAgICBjYXNlICd0ZXhDb29yZHMnOlxuICAgIGNhc2UgJ3RleENvb3JkMSc6XG4gICAgY2FzZSAndGV4Q29vcmQyJzpcbiAgICBjYXNlICd0ZXhDb29yZDMnOlxuICAgICAgY2F0ZWdvcnkgPSAndXZzJztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3ZlcnRpY2VzJzpcbiAgICBjYXNlICdwb3NpdGlvbnMnOlxuICAgIGNhc2UgJ25vcm1hbHMnOlxuICAgIGNhc2UgJ3BpY2tpbmdDb2xvcnMnOlxuICAgICAgY2F0ZWdvcnkgPSAndmVjdG9ycyc7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3IgY2F0ZWdvcnlzXG4gICAgc3dpdGNoIChjYXRlZ29yeSkge1xuICAgIGNhc2UgJ3ZlY3RvcnMnOlxuICAgICAgYXR0cmlidXRlLnNpemUgPSBhdHRyaWJ1dGUuc2l6ZSB8fCAzO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAndXZzJzpcbiAgICAgIGF0dHJpYnV0ZS5zaXplID0gYXR0cmlidXRlLnNpemUgfHwgMjtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ2luZGljZXMnOlxuICAgICAgYXR0cmlidXRlLnNpemUgPSBhdHRyaWJ1dGUuc2l6ZSB8fCAxO1xuICAgICAgYXR0cmlidXRlLmlzSW5kZXhlZCA9IGF0dHJpYnV0ZS5pc0luZGV4ZWQgfHwgdHJ1ZTtcbiAgICAgIGFzc2VydChcbiAgICAgICAgYXR0cmlidXRlLnZhbHVlIGluc3RhbmNlb2YgVWludDE2QXJyYXkgfHxcbiAgICAgICAgYXR0cmlidXRlLnZhbHVlIGluc3RhbmNlb2YgVWludDMyQXJyYXksXG4gICAgICAgICdhdHRyaWJ1dGUgYXJyYXkgZm9yIFwiaW5kaWNlc1wiIG11c3QgYmUgb2YgaW50ZWdlciB0eXBlJ1xuICAgICAgKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGFzc2VydChhdHRyaWJ1dGUuc2l6ZSwgYGF0dHJpYnV0ZSAke2F0dHJpYnV0ZU5hbWV9IG5lZWRzIHNpemVgKTtcbiAgfVxuICAvKiBlc2xpbnQtZW5hYmxlIGRlZmF1bHQtY2FzZSwgY29tcGxleGl0eSAqL1xuXG4gIF9wcmludChhdHRyaWJ1dGVOYW1lKSB7XG4gICAgcmV0dXJuIGBHZW9tZXRyeSAke3RoaXMuaWR9IGF0dHJpYnV0ZSAke2F0dHJpYnV0ZU5hbWV9YDtcbiAgfVxufVxuIl19