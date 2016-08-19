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
      var redraw = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

      this.needsRedraw = redraw;
      return this;
    }
  }, {
    key: 'getNeedsRedraw',
    value: function getNeedsRedraw() {
      var _ref2 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb3JlL2dlb21ldHJ5LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7O0FBQ0E7Ozs7Ozs7Ozs7QUFFQSxJQUFNLGNBQWMsNEJBQXBCOztJQUVxQixRO0FBRW5CLDBCQU1HO0FBQUEsdUJBTEQsRUFLQztBQUFBLFFBTEQsRUFLQywyQkFMSSxnQkFBSSxVQUFKLENBS0o7QUFBQSw2QkFKRCxRQUlDO0FBQUEsUUFKRCxRQUlDLGlDQUpVLFdBSVY7QUFBQSxnQ0FIRCxXQUdDO0FBQUEsUUFIRCxXQUdDLG9DQUhhLFNBR2I7QUFBQSxRQUZELFVBRUMsUUFGRCxVQUVDOztBQUFBLFFBREUsS0FDRjs7QUFBQTs7QUFDRCwwQkFBTyxRQUFQLEVBQWlCLFdBQWpCOztBQUVBLFNBQUssRUFBTCxHQUFVLEVBQVY7QUFDQSxTQUFLLFFBQUwsR0FBZ0IsUUFBaEI7QUFDQSxTQUFLLFdBQUwsR0FBbUIsV0FBbkI7QUFDQSxTQUFLLFVBQUwsR0FBa0IsRUFBbEI7QUFDQSxTQUFLLFdBQUwsR0FBbUIsSUFBbkI7QUFDQSxTQUFLLFFBQUwsR0FBZ0IsRUFBaEI7QUFDQSxXQUFPLElBQVAsQ0FBWSxJQUFaOztBQUVBLFFBQUksVUFBSixFQUFnQjtBQUNkLFdBQUssYUFBTCxDQUFtQixVQUFuQjtBQUNELEtBRkQsTUFFTztBQUNMLFdBQUssYUFBTCxDQUFtQixLQUFuQjtBQUNEO0FBQ0Y7Ozs7cUNBRTZCO0FBQUEsVUFBZixNQUFlLHlEQUFOLElBQU07O0FBQzVCLFdBQUssV0FBTCxHQUFtQixNQUFuQjtBQUNBLGFBQU8sSUFBUDtBQUNEOzs7cUNBRStDO0FBQUEsd0VBQUosRUFBSTs7QUFBQSx3Q0FBaEMsZ0JBQWdDO0FBQUEsVUFBaEMsZ0JBQWdDLHlDQUFiLEtBQWE7O0FBQzlDLFVBQUksU0FBUyxLQUFiO0FBQ0EsZUFBUyxVQUFVLEtBQUssV0FBeEI7QUFDQSxXQUFLLFdBQUwsR0FBbUIsS0FBSyxXQUFMLElBQW9CLENBQUMs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VSxLQUFWLFlBQTJCLFdBRjdCLEVBR0UsdURBSEY7QUFLQTtBQWZGOztBQWtCQSw0QkFBTyxVQUFVLElBQWpCLGlCQUFvQyxhQUFwQztBQUNEO0FBQ0Q7Ozs7MkJBRU8sYSxFQUFlO0FBQ3BCLDJCQUFtQixLQUFLLEVBQXhCLG1CQUF3QyxhQUF4QztBQUNEOzs7Ozs7a0JBdkprQixRIiwiZmlsZSI6Imdlb21ldHJ5LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHt1aWR9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuY29uc3QgSUxMRUdBTF9BUkcgPSAnR2VvbWV0cnk6IElsbGVnYWwgYXJndW1lbnQnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHZW9tZXRyeSB7XG5cbiAgY29uc3RydWN0b3Ioe1xuICAgIGlkID0gdWlkKCdnZW9tZXRyeScpLFxuICAgIGRyYXdNb2RlID0gJ1RSSUFOR0xFUycsXG4gICAgdmVydGV4Q291bnQgPSB1bmRlZmluZWQsXG4gICAgYXR0cmlidXRlcyxcbiAgICAuLi5hdHRyc1xuICB9KSB7XG4gICAgYXNzZXJ0KGRyYXdNb2RlLCBJTExFR0FMX0FSRyk7XG5cbiAgICB0aGlzLmlkID0gaWQ7XG4gICAgdGhpcy5kcmF3TW9kZSA9IGRyYXdNb2RlO1xuICAgIHRoaXMudmVydGV4Q291bnQgPSB2ZXJ0ZXhDb3VudDtcbiAgICB0aGlzLmF0dHJpYnV0ZXMgPSB7fTtcbiAgICB0aGlzLm5lZWRzUmVkcmF3ID0gdHJ1ZTtcbiAgICB0aGlzLnVzZXJEYXRhID0ge307XG4gICAgT2JqZWN0LnNlYWwodGhpcyk7XG5cbiAgICBpZiAoYXR0cmlidXRlcykge1xuICAgICAgdGhpcy5zZXRBdHRyaWJ1dGVzKGF0dHJpYnV0ZXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNldEF0dHJpYnV0ZXMoYXR0cnMpO1xuICAgIH1cbiAgfVxuXG4gIHNldE5lZWRzUmVkcmF3KHJlZHJhdyA9IHRydWUpIHtcbiAgICB0aGlzLm5lZWRzUmVkcmF3ID0gcmVkcmF3O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZ2V0TmVlZHNSZWRyYXcoe2NsZWFyUmVkcmF3RmxhZ3MgPSBmYWxzZX0gPSB7fSkge1xuICAgIGxldCByZWRyYXcgPSBmYWxzZTtcbiAgICByZWRyYXcgPSByZWRyYXcgfHwgdGhpcy5uZWVkc1JlZHJhdztcbiAgICB0aGlzLm5lZWRzUmVkcmF3ID0gdGhpcy5uZWVkc1JlZHJhdyAmJiAhY2xlYXJSZWRyYXdGbGFncztcbiAgICByZXR1cm4gcmVkcmF3O1xuICB9XG5cbiAgc2V0VmVydGV4Q291bnQodmVydGV4Q291bnQpIHtcbiAgICB0aGlzLnZlcnRleENvdW50ID0gdmVydGV4Q291bnQ7XG4gIH1cblxuICBnZXRWZXJ0ZXhDb3VudCgpIHtcbiAgICBpZiAodGhpcy52ZXJ0ZXhDb3VudCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdGhpcy52ZXJ0ZXhDb3VudDtcbiAgICB9IGVsc2UgaWYgKHRoaXMuYXR0cmlidXRlcy5pbmRpY2VzKSB7XG4gICAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzLmluZGljZXMudmFsdWUubGVuZ3RoO1xuICAgIH0gZWxzZSBpZiAodGhpcy5hdHRyaWJ1dGVzLnZlcnRpY2VzKSB7XG4gICAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzLnZlcnRpY2VzLnZhbHVlLmxlbmd0aCAvIDM7XG4gICAgfSBlbHNlIGlmICh0aGlzLmF0dHJpYnV0ZXMucG9zaXRpb25zKSB7XG4gICAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzLnBvc2l0aW9ucy52YWx1ZS5sZW5ndGggLyAzO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBoYXNBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZSkge1xuICAgIHJldHVybiBCb29sZWFuKHRoaXMuYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXSk7XG4gIH1cblxuICBnZXRBdHRyaWJ1dGUoYXR0cmlidXRlTmFtZSkge1xuICAgIGNvbnN0IGF0dHJpYnV0ZSA9IHRoaXMuYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXTtcbiAgICBhc3NlcnQoYXR0cmlidXRlKTtcbiAgICByZXR1cm4gYXR0cmlidXRlLnZhbHVlO1xuICB9XG5cbiAgZ2V0QXJyYXkoYXR0cmlidXRlTmFtZSkge1xuICAgIGNvbnN0IGF0dHJpYnV0ZSA9IHRoaXMuYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXTtcbiAgICBhc3NlcnQoYXR0cmlidXRlKTtcbiAgICByZXR1cm4gYXR0cmlidXRlLnZhbHVlO1xuICB9XG5cbiAgZ2V0QXR0cmlidXRlcygpIHtcbiAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzO1xuICB9XG5cbiAgLy8gQXR0cmlidXRlXG4gIC8vIHZhbHVlOiB0eXBlZCBhcnJheVxuICAvLyB0eXBlOiBpbmRpY2VzLCB2ZXJ0aWNlcywgdXZzXG4gIC8vIHNpemU6IGVsZW1lbnRzIHBlciB2ZXJ0ZXhcbiAgLy8gdGFyZ2V0OiBXZWJHTCBidWZmZXIgdHlwZSAoc3RyaW5nIG9yIGNvbnN0YW50KVxuICBzZXRBdHRyaWJ1dGVzKGF0dHJpYnV0ZXMpIHtcbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZU5hbWUgaW4gYXR0cmlidXRlcykge1xuICAgICAgbGV0IGF0dHJpYnV0ZSA9IGF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV07XG5cbiAgICAgIC8vIFdyYXAgXCJ1bndyYXBwZWRcIiBhcnJheXMgYW5kIHRyeSB0byBhdXRvZGV0ZWN0IHRoZWlyIHR5cGVcbiAgICAgIGF0dHJpYnV0ZSA9IEFycmF5QnVmZmVyLmlzVmlldyhhdHRyaWJ1dGUpID9cbiAgICAgICAge3ZhbHVlOiBhdHRyaWJ1dGV9IDpcbiAgICAgICAgYXR0cmlidXRlO1xuXG4gICAgICBhc3NlcnQoQXJyYXlCdWZmZXIuaXNWaWV3KGF0dHJpYnV0ZS52YWx1ZSksXG4gICAgICAgIGAke3RoaXMuX3ByaW50KGF0dHJpYnV0ZU5hbWUpfTogbXVzdCBiZSBhIHR5cGVkIGFycmF5IG9yIGFuIG9iamVjdGAgK1xuICAgICAgICBgd2l0aCB2YWx1ZSBhcyB0eXBlZCBhcnJheWApO1xuXG4gICAgICB0aGlzLl9hdXRvRGV0ZWN0QXR0cmlidXRlKGF0dHJpYnV0ZU5hbWUsIGF0dHJpYnV0ZSk7XG5cbiAgICAgIHRoaXMuYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXSA9IHtcbiAgICAgICAgLi4uYXR0cmlidXRlLFxuICAgICAgICBpbnN0YW5jZWQ6IGF0dHJpYnV0ZS5pbnN0YW5jZWQgfHwgMFxuICAgICAgfTtcbiAgICB9XG4gICAgdGhpcy5zZXROZWVkc1JlZHJhdygpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gQ2hlY2sgZm9yIHdlbGwga25vd24gYXR0cmlidXRlIG5hbWVzXG4gIC8qIGVzbGludC1kaXNhYmxlIGRlZmF1bHQtY2FzZSwgY29tcGxleGl0eSAqL1xuICBfYXV0b0RldGVjdEF0dHJpYnV0ZShhdHRyaWJ1dGVOYW1lLCBhdHRyaWJ1dGUpIHtcbiAgICBsZXQgY2F0ZWdvcnk7XG4gICAgc3dpdGNoIChhdHRyaWJ1dGVOYW1lKSB7XG4gICAgY2FzZSAnaW5kaWNlcyc6XG4gICAgICBjYXRlZ29yeSA9IGNhdGVnb3J5IHx8ICdpbmRpY2VzJztcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3RleENvb3Jkcyc6XG4gICAgY2FzZSAndGV4Q29vcmQxJzpcbiAgICBjYXNlICd0ZXhDb29yZDInOlxuICAgIGNhc2UgJ3RleENvb3JkMyc6XG4gICAgICBjYXRlZ29yeSA9ICd1dnMnO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAndmVydGljZXMnOlxuICAgIGNhc2UgJ3Bvc2l0aW9ucyc6XG4gICAgY2FzZSAnbm9ybWFscyc6XG4gICAgY2FzZSAncGlja2luZ0NvbG9ycyc6XG4gICAgICBjYXRlZ29yeSA9ICd2ZWN0b3JzJztcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGZvciBjYXRlZ29yeXNcbiAgICBzd2l0Y2ggKGNhdGVnb3J5KSB7XG4gICAgY2FzZSAndmVjdG9ycyc6XG4gICAgICBhdHRyaWJ1dGUuc2l6ZSA9IGF0dHJpYnV0ZS5zaXplIHx8IDM7XG4gICAgICBicmVhaztcbiAgICBjYXNlICd1dnMnOlxuICAgICAgYXR0cmlidXRlLnNpemUgPSBhdHRyaWJ1dGUuc2l6ZSB8fCAyO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnaW5kaWNlcyc6XG4gICAgICBhdHRyaWJ1dGUuc2l6ZSA9IGF0dHJpYnV0ZS5zaXplIHx8IDE7XG4gICAgICBhdHRyaWJ1dGUuaXNJbmRleGVkID0gYXR0cmlidXRlLmlzSW5kZXhlZCB8fCB0cnVlO1xuICAgICAgYXNzZXJ0KFxuICAgICAgICBhdHRyaWJ1dGUudmFsdWUgaW5zdGFuY2VvZiBVaW50MTZBcnJheSB8fFxuICAgICAgICBhdHRyaWJ1dGUudmFsdWUgaW5zdGFuY2VvZiBVaW50MzJBcnJheSxcbiAgICAgICAgJ2F0dHJpYnV0ZSBhcnJheSBmb3IgXCJpbmRpY2VzXCIgbXVzdCBiZSBvZiBpbnRlZ2VyIHR5cGUnXG4gICAgICApO1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgYXNzZXJ0KGF0dHJpYnV0ZS5zaXplLCBgYXR0cmlidXRlICR7YXR0cmlidXRlTmFtZX0gbmVlZHMgc2l6ZWApO1xuICB9XG4gIC8qIGVzbGludC1lbmFibGUgZGVmYXVsdC1jYXNlLCBjb21wbGV4aXR5ICovXG5cbiAgX3ByaW50KGF0dHJpYnV0ZU5hbWUpIHtcbiAgICByZXR1cm4gYEdlb21ldHJ5ICR7dGhpcy5pZH0gYXR0cmlidXRlICR7YXR0cmlidXRlTmFtZX1gO1xuICB9XG59XG4iXX0=