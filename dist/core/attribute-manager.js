'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* eslint-disable guard-for-in */


var _utils = require('../utils');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// auto: -
// instanced: - implies auto
//
var AttributeManager = function () {

  /**
   * @classdesc
   * Manages a list of attributes and an instance count
   * Auto allocates and updates "instanced" attributes as necessary
   *
   * - keeps track of valid state for each attribute
   * - auto reallocates attributes when needed
   * - auto updates attributes with registered updater functions
   * - allows overriding with application supplied buffers
   */
  function AttributeManager(_ref) {
    var _ref$id = _ref.id;
    var id = _ref$id === undefined ? '' : _ref$id;

    _classCallCheck(this, AttributeManager);

    this.id = id;
    this.attributes = {};
    this.allocedInstances = -1;
    this.needsRedraw = true;
    this.userData = {};
    // For debugging sanity, prevent uninitialized members
    Object.seal(this);
  }

  // Returns attributes in a format suitable for use with Luma.gl Model/Program


  _createClass(AttributeManager, [{
    key: 'getAttributes',
    value: function getAttributes() {
      return this.attributes;
    }
  }, {
    key: 'getChangedAttributes',
    value: function getChangedAttributes(_ref2) {
      var _ref2$clearChangedFla = _ref2.clearChangedFlags;
      var clearChangedFlags = _ref2$clearChangedFla === undefined ? false : _ref2$clearChangedFla;
      var attributes = this.attributes;

      var changedAttributes = {};
      for (var attributeName in attributes) {
        var attribute = attributes[attributeName];
        if (attribute.changed) {
          attribute.changed = attribute.changed && !clearChangedFlags;
          changedAttributes[attributeName] = attribute;
        }
      }
      return changedAttributes;
    }

    // Returns the redraw flag

  }, {
    key: 'getNeedsRedraw',
    value: function getNeedsRedraw() {
      var _ref3 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var _ref3$clearRedrawFlag = _ref3.clearRedrawFlags;
      var clearRedrawFlags = _ref3$clearRedrawFlag === undefined ? false : _ref3$clearRedrawFlag;

      var redraw = this.needsRedraw;
      redraw = redraw || this.needsRedraw;
      this.needsRedraw = this.needsRedraw && !clearRedrawFlags;
      return redraw;
    }
  }, {
    key: 'setNeedsRedraw',
    value: function setNeedsRedraw() {
      var redraw = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

      this.needsRedraw = true;
      return this;
    }

    // Adds a static attribute (that is not auto updated)

  }, {
    key: 'add',
    value: function add(attributes, updaters) {
      var newAttributes = this._add(attributes, updaters, {});
      Object.assign(this.attributes, newAttributes);
    }

    // Adds a dynamic attribute, that is autoupdated

  }, {
    key: 'addDynamic',
    value: function addDynamic(attributes, updaters) {
      var newAttributes = this._add(attributes, updaters, {
        autoUpdate: true
      });
      Object.assign(this.attributes, newAttributes);
    }

    // Adds an instanced attribute that is autoupdated

  }, {
    key: 'addInstanced',
    value: function addInstanced(attributes, updaters) {
      var newAttributes = this._add(attributes, updaters, {
        instanced: 1,
        autoUpdate: true
      });
      Object.assign(this.attributes, newAttributes);
    }

    // Marks an attribute for update

  }, {
    key: 'invalidate',
    value: function invalidate(attributeName) {
      var attributes = this.attributes;

      var attribute = attributes[attributeName];
      (0, _assert2.default)(attribute);
      attribute.needsUpdate = true;
      // For performance tuning
      _utils.log.log(1, 'invalidated attribute ' + attributeName + ' for ' + this.id);
    }
  }, {
    key: 'invalidateAll',
    value: function invalidateAll() {
      var attributes = this.attributes;

      for (var attributeName in attributes) {
        this.invalidate(attributeName);
      }
    }

    // Ensure all attribute buffers are updated from props or data

  }, {
    key: 'update',
    value: function update() {
      var _ref4 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var numInstances = _ref4.numInstances;
      var _ref4$buffers = _ref4.buffers;
      var buffers = _ref4$buffers === undefined ? {} : _ref4$buffers;
      var context = _ref4.context;
      var data = _ref4.data;
      var getValue = _ref4.getValue;

      var opts = _objectWithoutProperties(_ref4, ['numInstances', 'buffers', 'context', 'data', 'getValue']);

      this._checkBuffers(buffers, opts);
      this._setBuffers(buffers);
      this._allocateBuffers({ numInstances: numInstances });
      this._updateBuffers({ numInstances: numInstances, context: context, data: data, getValue: getValue });
    }

    // Set the buffers for the supplied attributes
    // Update attribute buffers from any attributes in props
    // Detach any previously set buffers, marking all
    // Attributes for auto allocation

  }, {
    key: '_setBuffers',
    value: function _setBuffers(bufferMap, opt) {
      var attributes = this.attributes;

      // Copy the refs of any supplied buffers in the props

      for (var attributeName in attributes) {
        var attribute = attributes[attributeName];
        var buffer = bufferMap[attributeName];
        if (buffer) {
          attribute.isExternalBuffer = true;
          attribute.needsUpdate = false;
          if (attribute.value !== buffer) {
            attribute.value = buffer;
            attribute.changed = true;
            this.needsRedraw = true;
          }
        } else {
          attribute.isExternalBuffer = false;
        }
      }
    }

    // Auto allocates buffers for attributes
    // Note: To reduce allocations, only grows buffers
    // Note: Only allocates buffers not set by setBuffer

  }, {
    key: '_allocateBuffers',
    value: function _allocateBuffers(_ref5) {
      var numInstances = _ref5.numInstances;
      var allocedInstances = this.allocedInstances;
      var attributes = this.attributes;

      (0, _assert2.default)(numInstances !== undefined);

      if (numInstances > allocedInstances) {
        // Allocate at least one element to ensure a valid buffer
        var allocCount = Math.max(numInstances, 1);
        for (var attributeName in attributes) {
          var attribute = attributes[attributeName];
          var size = attribute.size;
          var isExternalBuffer = attribute.isExternalBuffer;
          var autoUpdate = attribute.autoUpdate;

          if (!isExternalBuffer && autoUpdate) {
            var ArrayType = attribute.type || Float32Array;
            attribute.value = new ArrayType(size * allocCount);
            attribute.needsUpdate = true;
            _utils.log.log(2, 'allocated ' + allocCount + ' ' + attributeName + ' for ' + this.id);
          }
        }
        this.allocedInstances = allocCount;
      }
    }
  }, {
    key: '_updateBuffers',
    value: function _updateBuffers(_ref6) {
      var numInstances = _ref6.numInstances;
      var data = _ref6.data;
      var getValue = _ref6.getValue;
      var context = _ref6.context;
      var attributes = this.attributes;

      // If app supplied all attributes, no need to iterate over data

      for (var attributeName in attributes) {
        var attribute = attributes[attributeName];
        var update = attribute.update;

        if (attribute.needsUpdate && attribute.autoUpdate) {
          if (update) {
            _utils.log.log(2, 'autoupdating ' + numInstances + ' ' + attributeName + ' for ' + this.id);
            update.call(context, attribute, numInstances);
          } else {
            _utils.log.log(2, 'autocalculating ' + numInstances + ' ' + attributeName + ' for ' + this.id);
            this._updateAttributeFromData(attribute, data, getValue);
          }
          attribute.needsUpdate = false;
          attribute.changed = true;
          this.needsRedraw = true;
        }
      }
    }
  }, {
    key: '_updateAttributeFromData',
    value: function _updateAttributeFromData(attribute) {
      var data = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];
      var getValue = arguments.length <= 2 || arguments[2] === undefined ? function (x) {
        return x;
      } : arguments[2];


      var i = 0;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var object = _step.value;

          var values = getValue(object);
          // If this attribute's buffer wasn't copied from props, initialize it
          if (!attribute.isExternalBuffer) {
            var value = attribute.value;
            var size = attribute.size;

            value[i * size + 0] = values[attribute[0]];
            if (size >= 2) {
              value[i * size + 1] = values[attribute[0]];
            }
            if (size >= 3) {
              value[i * size + 2] = values[attribute[0]];
            }
            if (size >= 4) {
              value[i * size + 3] = values[attribute[0]];
            }
          }
          i++;
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }

    // Checks that any attribute buffers in props are valid
    // Note: This is just to help app catch mistakes

  }, {
    key: '_checkBuffers',
    value: function _checkBuffers() {
      var bufferMap = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
      var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
      var attributes = this.attributes;
      var numInstances = this.numInstances;


      for (var attributeName in bufferMap) {
        var attribute = attributes[attributeName];
        var buffer = bufferMap[attributeName];
        if (!attribute && !opts.ignoreUnknownAttributes) {
          throw new Error('Unknown attribute prop ' + attributeName);
        }
        if (attribute) {
          if (!(buffer instanceof Float32Array)) {
            throw new Error('Attribute properties must be of type Float32Array');
          }
          if (attribute.auto && buffer.length <= numInstances * attribute.size) {
            throw new Error('Attribute prop array must match length and size');
          }
        }
      }
    }

    // Used to register an attribute

  }, {
    key: '_add',
    value: function _add(attributes, updaters) {
      var _extraProps = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      var newAttributes = {};

      for (var attributeName in attributes) {
        var attribute = attributes[attributeName];
        var updater = updaters && updaters[attributeName];

        // Check all fields and generate helpful error messages
        this._validate(attributeName, attribute, updater);

        // Initialize the attribute descriptor, with WebGL and metadata fields
        var attributeData = _extends({
          // Ensure that fields are present before Object.seal()
          target: undefined,
          isIndexed: false,

          // Reserved for application
          userData: {}

        }, attribute, updater, {

          // State
          isExternalBuffer: false,
          needsUpdate: true,
          changed: true,

          // WebGL fields
          size: attribute.size,
          value: attribute.value || null

        }, _extraProps);
        // Sanity - no app fields on our attributes. Use userData instead.
        Object.seal(attributeData);

        // Add to both attributes list (for registration with model)
        this.attributes[attributeName] = attributeData;
      }

      return newAttributes;
    }
  }, {
    key: '_validate',
    value: function _validate(attributeName, attribute, updater) {
      (0, _assert2.default)(typeof attribute.size === 'number', 'Attribute definition for ' + attributeName + ' missing size');

      // Check that value extraction keys are set
      (0, _assert2.default)(typeof attribute[0] === 'string', 'Attribute definition for ' + attributeName + ' missing key 0');
      if (attribute.size >= 2) {
        (0, _assert2.default)(typeof attribute[1] === 'string', 'Attribute definition for ' + attributeName + ' missing key 1');
      }
      if (attribute.size >= 3) {
        (0, _assert2.default)(typeof attribute[2] === 'string', 'Attribute definition for ' + attributeName + ' missing key 2');
      }
      if (attribute.size >= 4) {
        (0, _assert2.default)(typeof attribute[3] === 'string', 'Attribute definition for ' + attributeName + ' missing key 3');
      }

      // Check the updater
      (0, _assert2.default)(!updater || typeof updater.update === 'function', 'Attribute updater for ' + attributeName + ' missing update method');
    }
  }]);

  return AttributeManager;
}();

exports.default = AttributeManager;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb3JlL2F0dHJpYnV0ZS1tYW5hZ2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztxakJBQUE7OztBQUNBOztBQUNBOzs7Ozs7Ozs7O0FBRUE7QUFDQTtBQUNBO0lBQ3FCLGdCOztBQUVuQjs7Ozs7Ozs7OztBQVVBLGtDQUF1QjtBQUFBLHVCQUFWLEVBQVU7QUFBQSxRQUFWLEVBQVUsMkJBQUwsRUFBSzs7QUFBQTs7QUFDckIsU0FBSyxFQUFMLEdBQVUsRUFBVjtBQUNBLFNBQUssVUFBTCxHQUFrQixFQUFsQjtBQUNBLFNBQUssZ0JBQUwsR0FBd0IsQ0FBQyxDQUF6QjtBQUNBLFNBQUssV0FBTCxHQUFtQixJQUFuQjtBQUNBLFNBQUssUUFBTCxHQUFnQixFQUFoQjtBQUNBO0FBQ0EsV0FBTyxJQUFQLENBQVksSUFBWjtBQUNEOztBQUVEOzs7OztvQ0FDZ0I7QUFDZCxhQUFPLEtBQUssVUFBWjtBQUNEOzs7Z0RBRWlEO0FBQUEsd0NBQTVCLGlCQUE0QjtBQUFBLFVBQTVCLGlCQUE0Qix5Q0FBUixLQUFRO0FBQUEsVUFDekMsVUFEeUMsR0FDM0IsSUFEMkIsQ0FDekMsVUFEeUM7O0FBRWhELFVBQU0sb0JBQW9CLEVBQTFCO0FBQ0EsV0FBSyxJQUFNLGFBQVgsSUFBNEIsVUFBNUIsRUFBd0M7QUFDdEMsWUFBTSxZQUFZLFdBQVcsYUFBWCxDQUFsQjtBQUNBLFlBQUksVUFBVSxPQUFkLEVBQXVCO0FBQ3JCLG9CQUFVLE9BQVYsR0FBb0IsVUFBVSxPQUFWLElBQXFCLENBQUMsaUJBQTFDO0FBQ0EsNEJBQWtCLGFBQWxCLElBQW1DLFNBQW5DO0FBQ0Q7QUFDRjtBQUNELGFBQU8saUJBQVA7QUFDRDs7QUFFRDs7OztxQ0FDZ0Q7QUFBQSx3RUFBSixFQUFJOztBQUFBLHdDQUFoQyxnQkFBZ0M7QUFBQSxVQUFoQyxnQkFBZ0MseUNBQWIsS0FBYTs7QUFDOUMsVUFBSSxTQUFTLEtBQUssV0FBbEI7QUFDQSxlQUFTLFVBQVUsS0FB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LGFBRDlCO0FBRUQ7QUFDRCxVQUFJLFVBQVUsSUFBVixJQUFrQixDQUF0QixFQUF5QjtBQUN2Qiw4QkFBTyxPQUFPLFVBQVUsQ0FBVixDQUFQLEtBQXdCLFFBQS9CLGdDQUM4QixhQUQ5QjtBQUVEO0FBQ0QsVUFBSSxVQUFVLElBQVYsSUFBa0IsQ0FBdEIsRUFBeUI7QUFDdkIsOEJBQU8sT0FBTyxVQUFVLENBQVYsQ0FBUCxLQUF3QixRQUEvQixnQ0FDOEIsYUFEOUI7QUFFRDs7QUFFRDtBQUNBLDRCQUFPLENBQUMsT0FBRCxJQUFZLE9BQU8sUUFBUSxNQUFmLEtBQTBCLFVBQTdDLDZCQUMyQixhQUQzQjtBQUVEOzs7Ozs7a0JBalNrQixnQiIsImZpbGUiOiJhdHRyaWJ1dGUtbWFuYWdlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIGd1YXJkLWZvci1pbiAqL1xuaW1wb3J0IHtsb2d9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuLy8gYXV0bzogLVxuLy8gaW5zdGFuY2VkOiAtIGltcGxpZXMgYXV0b1xuLy9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEF0dHJpYnV0ZU1hbmFnZXIge1xuXG4gIC8qKlxuICAgKiBAY2xhc3NkZXNjXG4gICAqIE1hbmFnZXMgYSBsaXN0IG9mIGF0dHJpYnV0ZXMgYW5kIGFuIGluc3RhbmNlIGNvdW50XG4gICAqIEF1dG8gYWxsb2NhdGVzIGFuZCB1cGRhdGVzIFwiaW5zdGFuY2VkXCIgYXR0cmlidXRlcyBhcyBuZWNlc3NhcnlcbiAgICpcbiAgICogLSBrZWVwcyB0cmFjayBvZiB2YWxpZCBzdGF0ZSBmb3IgZWFjaCBhdHRyaWJ1dGVcbiAgICogLSBhdXRvIHJlYWxsb2NhdGVzIGF0dHJpYnV0ZXMgd2hlbiBuZWVkZWRcbiAgICogLSBhdXRvIHVwZGF0ZXMgYXR0cmlidXRlcyB3aXRoIHJlZ2lzdGVyZWQgdXBkYXRlciBmdW5jdGlvbnNcbiAgICogLSBhbGxvd3Mgb3ZlcnJpZGluZyB3aXRoIGFwcGxpY2F0aW9uIHN1cHBsaWVkIGJ1ZmZlcnNcbiAgICovXG4gIGNvbnN0cnVjdG9yKHtpZCA9ICcnfSkge1xuICAgIHRoaXMuaWQgPSBpZDtcbiAgICB0aGlzLmF0dHJpYnV0ZXMgPSB7fTtcbiAgICB0aGlzLmFsbG9jZWRJbnN0YW5jZXMgPSAtMTtcbiAgICB0aGlzLm5lZWRzUmVkcmF3ID0gdHJ1ZTtcbiAgICB0aGlzLnVzZXJEYXRhID0ge307XG4gICAgLy8gRm9yIGRlYnVnZ2luZyBzYW5pdHksIHByZXZlbnQgdW5pbml0aWFsaXplZCBtZW1iZXJzXG4gICAgT2JqZWN0LnNlYWwodGhpcyk7XG4gIH1cblxuICAvLyBSZXR1cm5zIGF0dHJpYnV0ZXMgaW4gYSBmb3JtYXQgc3VpdGFibGUgZm9yIHVzZSB3aXRoIEx1bWEuZ2wgTW9kZWwvUHJvZ3JhbVxuICBnZXRBdHRyaWJ1dGVzKCkge1xuICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXM7XG4gIH1cblxuICBnZXRDaGFuZ2VkQXR0cmlidXRlcyh7Y2xlYXJDaGFuZ2VkRmxhZ3MgPSBmYWxzZX0pIHtcbiAgICBjb25zdCB7YXR0cmlidXRlc30gPSB0aGlzO1xuICAgIGNvbnN0IGNoYW5nZWRBdHRyaWJ1dGVzID0ge307XG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGVOYW1lIGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IGF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV07XG4gICAgICBpZiAoYXR0cmlidXRlLmNoYW5nZWQpIHtcbiAgICAgICAgYXR0cmlidXRlLmNoYW5nZWQgPSBhdHRyaWJ1dGUuY2hhbmdlZCAmJiAhY2xlYXJDaGFuZ2VkRmxhZ3M7XG4gICAgICAgIGNoYW5nZWRBdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdID0gYXR0cmlidXRlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY2hhbmdlZEF0dHJpYnV0ZXM7XG4gIH1cblxuICAvLyBSZXR1cm5zIHRoZSByZWRyYXcgZmxhZ1xuICBnZXROZWVkc1JlZHJhdyh7Y2xlYXJSZWRyYXdGbGFncyA9IGZhbHNlfSA9IHt9KSB7XG4gICAgbGV0IHJlZHJhdyA9IHRoaXMubmVlZHNSZWRyYXc7XG4gICAgcmVkcmF3ID0gcmVkcmF3IHx8IHRoaXMubmVlZHNSZWRyYXc7XG4gICAgdGhpcy5uZWVkc1JlZHJhdyA9IHRoaXMubmVlZHNSZWRyYXcgJiYgIWNsZWFyUmVkcmF3RmxhZ3M7XG4gICAgcmV0dXJuIHJlZHJhdztcbiAgfVxuXG4gIHNldE5lZWRzUmVkcmF3KHJlZHJhdyA9IHRydWUpIHtcbiAgICB0aGlzLm5lZWRzUmVkcmF3ID0gdHJ1ZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIEFkZHMgYSBzdGF0aWMgYXR0cmlidXRlICh0aGF0IGlzIG5vdCBhdXRvIHVwZGF0ZWQpXG4gIGFkZChhdHRyaWJ1dGVzLCB1cGRhdGVycykge1xuICAgIGNvbnN0IG5ld0F0dHJpYnV0ZXMgPSB0aGlzLl9hZGQoYXR0cmlidXRlcywgdXBkYXRlcnMsIHt9KTtcbiAgICBPYmplY3QuYXNzaWduKHRoaXMuYXR0cmlidXRlcywgbmV3QXR0cmlidXRlcyk7XG4gIH1cblxuICAvLyBBZGRzIGEgZHluYW1pYyBhdHRyaWJ1dGUsIHRoYXQgaXMgYXV0b3VwZGF0ZWRcbiAgYWRkRHluYW1pYyhhdHRyaWJ1dGVzLCB1cGRhdGVycykge1xuICAgIGNvbnN0IG5ld0F0dHJpYnV0ZXMgPSB0aGlzLl9hZGQoYXR0cmlidXRlcywgdXBkYXRlcnMsIHtcbiAgICAgIGF1dG9VcGRhdGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuYXNzaWduKHRoaXMuYXR0cmlidXRlcywgbmV3QXR0cmlidXRlcyk7XG4gIH1cblxuICAvLyBBZGRzIGFuIGluc3RhbmNlZCBhdHRyaWJ1dGUgdGhhdCBpcyBhdXRvdXBkYXRlZFxuICBhZGRJbnN0YW5jZWQoYXR0cmlidXRlcywgdXBkYXRlcnMpIHtcbiAgICBjb25zdCBuZXdBdHRyaWJ1dGVzID0gdGhpcy5fYWRkKGF0dHJpYnV0ZXMsIHVwZGF0ZXJzLCB7XG4gICAgICBpbnN0YW5jZWQ6IDEsXG4gICAgICBhdXRvVXBkYXRlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLmF0dHJpYnV0ZXMsIG5ld0F0dHJpYnV0ZXMpO1xuICB9XG5cbiAgLy8gTWFya3MgYW4gYXR0cmlidXRlIGZvciB1cGRhdGVcbiAgaW52YWxpZGF0ZShhdHRyaWJ1dGVOYW1lKSB7XG4gICAgY29uc3Qge2F0dHJpYnV0ZXN9ID0gdGhpcztcbiAgICBjb25zdCBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdO1xuICAgIGFzc2VydChhdHRyaWJ1dGUpO1xuICAgIGF0dHJpYnV0ZS5uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgLy8gRm9yIHBlcmZvcm1hbmNlIHR1bmluZ1xuICAgIGxvZy5sb2coMSwgYGludmFsaWRhdGVkIGF0dHJpYnV0ZSAke2F0dHJpYnV0ZU5hbWV9IGZvciAke3RoaXMuaWR9YCk7XG4gIH1cblxuICBpbnZhbGlkYXRlQWxsKCkge1xuICAgIGNvbnN0IHthdHRyaWJ1dGVzfSA9IHRoaXM7XG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGVOYW1lIGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgIHRoaXMuaW52YWxpZGF0ZShhdHRyaWJ1dGVOYW1lKTtcbiAgICB9XG4gIH1cblxuICAvLyBFbnN1cmUgYWxsIGF0dHJpYnV0ZSBidWZmZXJzIGFyZSB1cGRhdGVkIGZyb20gcHJvcHMgb3IgZGF0YVxuICB1cGRhdGUoe251bUluc3RhbmNlcywgYnVmZmVycyA9IHt9LCBjb250ZXh0LCBkYXRhLCBnZXRWYWx1ZSwgLi4ub3B0c30gPSB7fSkge1xuICAgIHRoaXMuX2NoZWNrQnVmZmVycyhidWZmZXJzLCBvcHRzKTtcbiAgICB0aGlzLl9zZXRCdWZmZXJzKGJ1ZmZlcnMpO1xuICAgIHRoaXMuX2FsbG9jYXRlQnVmZmVycyh7bnVtSW5zdGFuY2VzfSk7XG4gICAgdGhpcy5fdXBkYXRlQnVmZmVycyh7bnVtSW5zdGFuY2VzLCBjb250ZXh0LCBkYXRhLCBnZXRWYWx1ZX0pO1xuICB9XG5cbiAgLy8gU2V0IHRoZSBidWZmZXJzIGZvciB0aGUgc3VwcGxpZWQgYXR0cmlidXRlc1xuICAvLyBVcGRhdGUgYXR0cmlidXRlIGJ1ZmZlcnMgZnJvbSBhbnkgYXR0cmlidXRlcyBpbiBwcm9wc1xuICAvLyBEZXRhY2ggYW55IHByZXZpb3VzbHkgc2V0IGJ1ZmZlcnMsIG1hcmtpbmcgYWxsXG4gIC8vIEF0dHJpYnV0ZXMgZm9yIGF1dG8gYWxsb2NhdGlvblxuICBfc2V0QnVmZmVycyhidWZmZXJNYXAsIG9wdCkge1xuICAgIGNvbnN0IHthdHRyaWJ1dGVzfSA9IHRoaXM7XG5cbiAgICAvLyBDb3B5IHRoZSByZWZzIG9mIGFueSBzdXBwbGllZCBidWZmZXJzIGluIHRoZSBwcm9wc1xuICAgIGZvciAoY29uc3QgYXR0cmlidXRlTmFtZSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICBjb25zdCBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdO1xuICAgICAgY29uc3QgYnVmZmVyID0gYnVmZmVyTWFwW2F0dHJpYnV0ZU5hbWVdO1xuICAgICAgaWYgKGJ1ZmZlcikge1xuICAgICAgICBhdHRyaWJ1dGUuaXNFeHRlcm5hbEJ1ZmZlciA9IHRydWU7XG4gICAgICAgIGF0dHJpYnV0ZS5uZWVkc1VwZGF0ZSA9IGZhbHNlO1xuICAgICAgICBpZiAoYXR0cmlidXRlLnZhbHVlICE9PSBidWZmZXIpIHtcbiAgICAgICAgICBhdHRyaWJ1dGUudmFsdWUgPSBidWZmZXI7XG4gICAgICAgICAgYXR0cmlidXRlLmNoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgIHRoaXMubmVlZHNSZWRyYXcgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhdHRyaWJ1dGUuaXNFeHRlcm5hbEJ1ZmZlciA9IGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIEF1dG8gYWxsb2NhdGVzIGJ1ZmZlcnMgZm9yIGF0dHJpYnV0ZXNcbiAgLy8gTm90ZTogVG8gcmVkdWNlIGFsbG9jYXRpb25zLCBvbmx5IGdyb3dzIGJ1ZmZlcnNcbiAgLy8gTm90ZTogT25seSBhbGxvY2F0ZXMgYnVmZmVycyBub3Qgc2V0IGJ5IHNldEJ1ZmZlclxuICBfYWxsb2NhdGVCdWZmZXJzKHtudW1JbnN0YW5jZXN9KSB7XG4gICAgY29uc3Qge2FsbG9jZWRJbnN0YW5jZXMsIGF0dHJpYnV0ZXN9ID0gdGhpcztcbiAgICBhc3NlcnQobnVtSW5zdGFuY2VzICE9PSB1bmRlZmluZWQpO1xuXG4gICAgaWYgKG51bUluc3RhbmNlcyA+IGFsbG9jZWRJbnN0YW5jZXMpIHtcbiAgICAgIC8vIEFsbG9jYXRlIGF0IGxlYXN0IG9uZSBlbGVtZW50IHRvIGVuc3VyZSBhIHZhbGlkIGJ1ZmZlclxuICAgICAgY29uc3QgYWxsb2NDb3VudCA9IE1hdGgubWF4KG51bUluc3RhbmNlcywgMSk7XG4gICAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZU5hbWUgaW4gYXR0cmlidXRlcykge1xuICAgICAgICBjb25zdCBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdO1xuICAgICAgICBjb25zdCB7c2l6ZSwgaXNFeHRlcm5hbEJ1ZmZlciwgYXV0b1VwZGF0ZX0gPSBhdHRyaWJ1dGU7XG4gICAgICAgIGlmICghaXNFeHRlcm5hbEJ1ZmZlciAmJiBhdXRvVXBkYXRlKSB7XG4gICAgICAgICAgY29uc3QgQXJyYXlUeXBlID0gYXR0cmlidXRlLnR5cGUgfHwgRmxvYXQzMkFycmF5O1xuICAgICAgICAgIGF0dHJpYnV0ZS52YWx1ZSA9IG5ldyBBcnJheVR5cGUoc2l6ZSAqIGFsbG9jQ291bnQpO1xuICAgICAgICAgIGF0dHJpYnV0ZS5uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgICAgICAgbG9nLmxvZygyLCBgYWxsb2NhdGVkICR7YWxsb2NDb3VudH0gJHthdHRyaWJ1dGVOYW1lfSBmb3IgJHt0aGlzLmlkfWApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLmFsbG9jZWRJbnN0YW5jZXMgPSBhbGxvY0NvdW50O1xuICAgIH1cbiAgfVxuXG4gIF91cGRhdGVCdWZmZXJzKHtudW1JbnN0YW5jZXMsIGRhdGEsIGdldFZhbHVlLCBjb250ZXh0fSkge1xuICAgIGNvbnN0IHthdHRyaWJ1dGVzfSA9IHRoaXM7XG5cbiAgICAvLyBJZiBhcHAgc3VwcGxpZWQgYWxsIGF0dHJpYnV0ZXMsIG5vIG5lZWQgdG8gaXRlcmF0ZSBvdmVyIGRhdGFcblxuICAgIGZvciAoY29uc3QgYXR0cmlidXRlTmFtZSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICBjb25zdCBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdO1xuICAgICAgY29uc3Qge3VwZGF0ZX0gPSBhdHRyaWJ1dGU7XG4gICAgICBpZiAoYXR0cmlidXRlLm5lZWRzVXBkYXRlICYmIGF0dHJpYnV0ZS5hdXRvVXBkYXRlKSB7XG4gICAgICAgIGlmICh1cGRhdGUpIHtcbiAgICAgICAgICBsb2cubG9nKDIsXG4gICAgICAgICAgICBgYXV0b3VwZGF0aW5nICR7bnVtSW5zdGFuY2VzfSAke2F0dHJpYnV0ZU5hbWV9IGZvciAke3RoaXMuaWR9YCk7XG4gICAgICAgICAgdXBkYXRlLmNhbGwoY29udGV4dCwgYXR0cmlidXRlLCBudW1JbnN0YW5jZXMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxvZy5sb2coMixcbiAgICAgICAgICAgIGBhdXRvY2FsY3VsYXRpbmcgJHtudW1JbnN0YW5jZXN9ICR7YXR0cmlidXRlTmFtZX0gZm9yICR7dGhpcy5pZH1gKTtcbiAgICAgICAgICB0aGlzLl91cGRhdGVBdHRyaWJ1dGVGcm9tRGF0YShhdHRyaWJ1dGUsIGRhdGEsIGdldFZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBhdHRyaWJ1dGUubmVlZHNVcGRhdGUgPSBmYWxzZTtcbiAgICAgICAgYXR0cmlidXRlLmNoYW5nZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLm5lZWRzUmVkcmF3ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBfdXBkYXRlQXR0cmlidXRlRnJvbURhdGEoYXR0cmlidXRlLCBkYXRhID0gW10sIGdldFZhbHVlID0geCA9PiB4KSB7XG5cbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yIChjb25zdCBvYmplY3Qgb2YgZGF0YSkge1xuICAgICAgY29uc3QgdmFsdWVzID0gZ2V0VmFsdWUob2JqZWN0KTtcbiAgICAgIC8vIElmIHRoaXMgYXR0cmlidXRlJ3MgYnVmZmVyIHdhc24ndCBjb3BpZWQgZnJvbSBwcm9wcywgaW5pdGlhbGl6ZSBpdFxuICAgICAgaWYgKCFhdHRyaWJ1dGUuaXNFeHRlcm5hbEJ1ZmZlcikge1xuICAgICAgICBjb25zdCB7dmFsdWUsIHNpemV9ID0gYXR0cmlidXRlO1xuICAgICAgICB2YWx1ZVtpICogc2l6ZSArIDBdID0gdmFsdWVzW2F0dHJpYnV0ZVswXV07XG4gICAgICAgIGlmIChzaXplID49IDIpIHtcbiAgICAgICAgICB2YWx1ZVtpICogc2l6ZSArIDFdID0gdmFsdWVzW2F0dHJpYnV0ZVswXV07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNpemUgPj0gMykge1xuICAgICAgICAgIHZhbHVlW2kgKiBzaXplICsgMl0gPSB2YWx1ZXNbYXR0cmlidXRlWzBdXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2l6ZSA+PSA0KSB7XG4gICAgICAgICAgdmFsdWVbaSAqIHNpemUgKyAzXSA9IHZhbHVlc1thdHRyaWJ1dGVbMF1dO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpKys7XG4gICAgfVxuICB9XG5cbiAgLy8gQ2hlY2tzIHRoYXQgYW55IGF0dHJpYnV0ZSBidWZmZXJzIGluIHByb3BzIGFyZSB2YWxpZFxuICAvLyBOb3RlOiBUaGlzIGlzIGp1c3QgdG8gaGVscCBhcHAgY2F0Y2ggbWlzdGFrZXNcbiAgX2NoZWNrQnVmZmVycyhidWZmZXJNYXAgPSB7fSwgb3B0cyA9IHt9KSB7XG4gICAgY29uc3Qge2F0dHJpYnV0ZXMsIG51bUluc3RhbmNlc30gPSB0aGlzO1xuXG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGVOYW1lIGluIGJ1ZmZlck1hcCkge1xuICAgICAgY29uc3QgYXR0cmlidXRlID0gYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXTtcbiAgICAgIGNvbnN0IGJ1ZmZlciA9IGJ1ZmZlck1hcFthdHRyaWJ1dGVOYW1lXTtcbiAgICAgIGlmICghYXR0cmlidXRlICYmICFvcHRzLmlnbm9yZVVua25vd25BdHRyaWJ1dGVzKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5rbm93biBhdHRyaWJ1dGUgcHJvcCAke2F0dHJpYnV0ZU5hbWV9YCk7XG4gICAgICB9XG4gICAgICBpZiAoYXR0cmlidXRlKSB7XG4gICAgICAgIGlmICghKGJ1ZmZlciBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0F0dHJpYnV0ZSBwcm9wZXJ0aWVzIG11c3QgYmUgb2YgdHlwZSBGbG9hdDMyQXJyYXknKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYXR0cmlidXRlLmF1dG8gJiYgYnVmZmVyLmxlbmd0aCA8PSBudW1JbnN0YW5jZXMgKiBhdHRyaWJ1dGUuc2l6ZSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQXR0cmlidXRlIHByb3AgYXJyYXkgbXVzdCBtYXRjaCBsZW5ndGggYW5kIHNpemUnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIFVzZWQgdG8gcmVnaXN0ZXIgYW4gYXR0cmlidXRlXG4gIF9hZGQoYXR0cmlidXRlcywgdXBkYXRlcnMsIF9leHRyYVByb3BzID0ge30pIHtcblxuICAgIGNvbnN0IG5ld0F0dHJpYnV0ZXMgPSB7fTtcblxuICAgIGZvciAoY29uc3QgYXR0cmlidXRlTmFtZSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICBjb25zdCBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdO1xuICAgICAgY29uc3QgdXBkYXRlciA9IHVwZGF0ZXJzICYmIHVwZGF0ZXJzW2F0dHJpYnV0ZU5hbWVdO1xuXG4gICAgICAvLyBDaGVjayBhbGwgZmllbGRzIGFuZCBnZW5lcmF0ZSBoZWxwZnVsIGVycm9yIG1lc3NhZ2VzXG4gICAgICB0aGlzLl92YWxpZGF0ZShhdHRyaWJ1dGVOYW1lLCBhdHRyaWJ1dGUsIHVwZGF0ZXIpO1xuXG4gICAgICAvLyBJbml0aWFsaXplIHRoZSBhdHRyaWJ1dGUgZGVzY3JpcHRvciwgd2l0aCBXZWJHTCBhbmQgbWV0YWRhdGEgZmllbGRzXG4gICAgICBjb25zdCBhdHRyaWJ1dGVEYXRhID0ge1xuICAgICAgICAvLyBFbnN1cmUgdGhhdCBmaWVsZHMgYXJlIHByZXNlbnQgYmVmb3JlIE9iamVjdC5zZWFsKClcbiAgICAgICAgdGFyZ2V0OiB1bmRlZmluZWQsXG4gICAgICAgIGlzSW5kZXhlZDogZmFsc2UsXG5cbiAgICAgICAgLy8gUmVzZXJ2ZWQgZm9yIGFwcGxpY2F0aW9uXG4gICAgICAgIHVzZXJEYXRhOiB7fSxcblxuICAgICAgICAvLyBNZXRhZGF0YVxuICAgICAgICAuLi5hdHRyaWJ1dGUsXG4gICAgICAgIC4uLnVwZGF0ZXIsXG5cbiAgICAgICAgLy8gU3RhdGVcbiAgICAgICAgaXNFeHRlcm5hbEJ1ZmZlcjogZmFsc2UsXG4gICAgICAgIG5lZWRzVXBkYXRlOiB0cnVlLFxuICAgICAgICBjaGFuZ2VkOiB0cnVlLFxuXG4gICAgICAgIC8vIFdlYkdMIGZpZWxkc1xuICAgICAgICBzaXplOiBhdHRyaWJ1dGUuc2l6ZSxcbiAgICAgICAgdmFsdWU6IGF0dHJpYnV0ZS52YWx1ZSB8fCBudWxsLFxuXG4gICAgICAgIC4uLl9leHRyYVByb3BzXG4gICAgICB9O1xuICAgICAgLy8gU2FuaXR5IC0gbm8gYXBwIGZpZWxkcyBvbiBvdXIgYXR0cmlidXRlcy4gVXNlIHVzZXJEYXRhIGluc3RlYWQuXG4gICAgICBPYmplY3Quc2VhbChhdHRyaWJ1dGVEYXRhKTtcblxuICAgICAgLy8gQWRkIHRvIGJvdGggYXR0cmlidXRlcyBsaXN0IChmb3IgcmVnaXN0cmF0aW9uIHdpdGggbW9kZWwpXG4gICAgICB0aGlzLmF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV0gPSBhdHRyaWJ1dGVEYXRhO1xuICAgIH1cblxuICAgIHJldHVybiBuZXdBdHRyaWJ1dGVzO1xuICB9XG5cbiAgX3ZhbGlkYXRlKGF0dHJpYnV0ZU5hbWUsIGF0dHJpYnV0ZSwgdXBkYXRlcikge1xuICAgIGFzc2VydCh0eXBlb2YgYXR0cmlidXRlLnNpemUgPT09ICdudW1iZXInLFxuICAgICAgYEF0dHJpYnV0ZSBkZWZpbml0aW9uIGZvciAke2F0dHJpYnV0ZU5hbWV9IG1pc3Npbmcgc2l6ZWApO1xuXG4gICAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBleHRyYWN0aW9uIGtleXMgYXJlIHNldFxuICAgIGFzc2VydCh0eXBlb2YgYXR0cmlidXRlWzBdID09PSAnc3RyaW5nJyxcbiAgICAgIGBBdHRyaWJ1dGUgZGVmaW5pdGlvbiBmb3IgJHthdHRyaWJ1dGVOYW1lfSBtaXNzaW5nIGtleSAwYCk7XG4gICAgaWYgKGF0dHJpYnV0ZS5zaXplID49IDIpIHtcbiAgICAgIGFzc2VydCh0eXBlb2YgYXR0cmlidXRlWzFdID09PSAnc3RyaW5nJyxcbiAgICAgICAgYEF0dHJpYnV0ZSBkZWZpbml0aW9uIGZvciAke2F0dHJpYnV0ZU5hbWV9IG1pc3Npbmcga2V5IDFgKTtcbiAgICB9XG4gICAgaWYgKGF0dHJpYnV0ZS5zaXplID49IDMpIHtcbiAgICAgIGFzc2VydCh0eXBlb2YgYXR0cmlidXRlWzJdID09PSAnc3RyaW5nJyxcbiAgICAgICAgYEF0dHJpYnV0ZSBkZWZpbml0aW9uIGZvciAke2F0dHJpYnV0ZU5hbWV9IG1pc3Npbmcga2V5IDJgKTtcbiAgICB9XG4gICAgaWYgKGF0dHJpYnV0ZS5zaXplID49IDQpIHtcbiAgICAgIGFzc2VydCh0eXBlb2YgYXR0cmlidXRlWzNdID09PSAnc3RyaW5nJyxcbiAgICAgICAgYEF0dHJpYnV0ZSBkZWZpbml0aW9uIGZvciAke2F0dHJpYnV0ZU5hbWV9IG1pc3Npbmcga2V5IDNgKTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayB0aGUgdXBkYXRlclxuICAgIGFzc2VydCghdXBkYXRlciB8fCB0eXBlb2YgdXBkYXRlci51cGRhdGUgPT09ICdmdW5jdGlvbicsXG4gICAgICBgQXR0cmlidXRlIHVwZGF0ZXIgZm9yICR7YXR0cmlidXRlTmFtZX0gbWlzc2luZyB1cGRhdGUgbWV0aG9kYCk7XG4gIH1cblxufVxuIl19