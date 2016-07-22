'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* eslint-disable guard-for-in */


var _utils = require('./utils');

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9hdHRyaWJ1dGUtbWFuYWdlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUNBOztBQUNBOzs7Ozs7Ozs7Ozs7OztJQUtxQixnQjs7Ozs7Ozs7Ozs7OztBQVluQixrQ0FBdUI7QUFBQSx1QkFBVixFQUFVO0FBQUEsUUFBVixFQUFVLDJCQUFMLEVBQUs7O0FBQUE7O0FBQ3JCLFNBQUssRUFBTCxHQUFVLEVBQVY7QUFDQSxTQUFLLFVBQUwsR0FBa0IsRUFBbEI7QUFDQSxTQUFLLGdCQUFMLEdBQXdCLENBQUMsQ0FBekI7QUFDQSxTQUFLLFdBQUwsR0FBbUIsSUFBbkI7QUFDQSxTQUFLLFFBQUwsR0FBZ0IsRUFBaEI7O0FBRUEsV0FBTyxJQUFQLENBQVksSUFBWjtBQUNEOzs7Ozs7O29DQUdlO0FBQ2QsYUFBTyxLQUFLLFVBQVo7QUFDRDs7O2dEQUVpRDtBQUFBLHdDQUE1QixpQkFBNEI7QUFBQSxVQUE1QixpQkFBNEIseUNBQVIsS0FBUTtBQUFBLFVBQ3pDLFVBRHlDLEdBQzNCLElBRDJCLENBQ3pDLFVBRHlDOztBQUVoRCxVQUFNLG9CQUFvQixFQUExQjtBQUNBLFdBQUssSUFBTSxhQUFYLElBQTRCLFVBQTVCLEVBQXdDO0FBQ3RDLFlBQU0sWUFBWSxXQUFXLGFBQVgsQ0FBbEI7QUFDQSxZQUFJLFVBQVUsT0FBZCxFQUF1QjtBQUNyQixvQkFBVSxPQUFWLEdBQW9CLFVBQVUsT0FBVixJQUFxQixDQUFDLGlCQUExQztBQUNBLDRCQUFrQixhQUFsQixJQUFtQyxTQUFuQztBQUNEO0FBQ0Y7QUFDRCxhQUFPLGlCQUFQO0FBQ0Q7Ozs7OztxQ0FHK0M7QUFBQSx3RUFBSixFQUFJOztBQUFBLHdDQUFoQyxnQkFBZ0M7QUFBQSxVQUFoQyxnQkFBZ0MseUNBQWIsS0FBYTs7QUFDOUMsVUFBSSxTQUFTLEtBQUssV0FBbEI7QUFDQSxlQUFTLFVBQVUsS0FBSyxXQUF4QjtBQUNBLFdBQUssV0FBTCxHQUFtQixLQUFLLFdBQUwsSUFB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QUFPLE9BQU8sVUFBVSxDQUFWLENBQVAsS0FBd0IsUUFBL0IsZ0NBQzhCLGFBRDlCO0FBRUQ7OztBQUdELDRCQUFPLENBQUMsT0FBRCxJQUFZLE9BQU8sUUFBUSxNQUFmLEtBQTBCLFVBQTdDLDZCQUMyQixhQUQzQjtBQUVEOzs7Ozs7a0JBalNrQixnQiIsImZpbGUiOiJhdHRyaWJ1dGUtbWFuYWdlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIGd1YXJkLWZvci1pbiAqL1xuaW1wb3J0IHtsb2d9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG4vLyBhdXRvOiAtXG4vLyBpbnN0YW5jZWQ6IC0gaW1wbGllcyBhdXRvXG4vL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXR0cmlidXRlTWFuYWdlciB7XG5cbiAgLyoqXG4gICAqIEBjbGFzc2Rlc2NcbiAgICogTWFuYWdlcyBhIGxpc3Qgb2YgYXR0cmlidXRlcyBhbmQgYW4gaW5zdGFuY2UgY291bnRcbiAgICogQXV0byBhbGxvY2F0ZXMgYW5kIHVwZGF0ZXMgXCJpbnN0YW5jZWRcIiBhdHRyaWJ1dGVzIGFzIG5lY2Vzc2FyeVxuICAgKlxuICAgKiAtIGtlZXBzIHRyYWNrIG9mIHZhbGlkIHN0YXRlIGZvciBlYWNoIGF0dHJpYnV0ZVxuICAgKiAtIGF1dG8gcmVhbGxvY2F0ZXMgYXR0cmlidXRlcyB3aGVuIG5lZWRlZFxuICAgKiAtIGF1dG8gdXBkYXRlcyBhdHRyaWJ1dGVzIHdpdGggcmVnaXN0ZXJlZCB1cGRhdGVyIGZ1bmN0aW9uc1xuICAgKiAtIGFsbG93cyBvdmVycmlkaW5nIHdpdGggYXBwbGljYXRpb24gc3VwcGxpZWQgYnVmZmVyc1xuICAgKi9cbiAgY29uc3RydWN0b3Ioe2lkID0gJyd9KSB7XG4gICAgdGhpcy5pZCA9IGlkO1xuICAgIHRoaXMuYXR0cmlidXRlcyA9IHt9O1xuICAgIHRoaXMuYWxsb2NlZEluc3RhbmNlcyA9IC0xO1xuICAgIHRoaXMubmVlZHNSZWRyYXcgPSB0cnVlO1xuICAgIHRoaXMudXNlckRhdGEgPSB7fTtcbiAgICAvLyBGb3IgZGVidWdnaW5nIHNhbml0eSwgcHJldmVudCB1bmluaXRpYWxpemVkIG1lbWJlcnNcbiAgICBPYmplY3Quc2VhbCh0aGlzKTtcbiAgfVxuXG4gIC8vIFJldHVybnMgYXR0cmlidXRlcyBpbiBhIGZvcm1hdCBzdWl0YWJsZSBmb3IgdXNlIHdpdGggTHVtYS5nbCBNb2RlbC9Qcm9ncmFtXG4gIGdldEF0dHJpYnV0ZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlcztcbiAgfVxuXG4gIGdldENoYW5nZWRBdHRyaWJ1dGVzKHtjbGVhckNoYW5nZWRGbGFncyA9IGZhbHNlfSkge1xuICAgIGNvbnN0IHthdHRyaWJ1dGVzfSA9IHRoaXM7XG4gICAgY29uc3QgY2hhbmdlZEF0dHJpYnV0ZXMgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZU5hbWUgaW4gYXR0cmlidXRlcykge1xuICAgICAgY29uc3QgYXR0cmlidXRlID0gYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXTtcbiAgICAgIGlmIChhdHRyaWJ1dGUuY2hhbmdlZCkge1xuICAgICAgICBhdHRyaWJ1dGUuY2hhbmdlZCA9IGF0dHJpYnV0ZS5jaGFuZ2VkICYmICFjbGVhckNoYW5nZWRGbGFncztcbiAgICAgICAgY2hhbmdlZEF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV0gPSBhdHRyaWJ1dGU7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjaGFuZ2VkQXR0cmlidXRlcztcbiAgfVxuXG4gIC8vIFJldHVybnMgdGhlIHJlZHJhdyBmbGFnXG4gIGdldE5lZWRzUmVkcmF3KHtjbGVhclJlZHJhd0ZsYWdzID0gZmFsc2V9ID0ge30pIHtcbiAgICBsZXQgcmVkcmF3ID0gdGhpcy5uZWVkc1JlZHJhdztcbiAgICByZWRyYXcgPSByZWRyYXcgfHwgdGhpcy5uZWVkc1JlZHJhdztcbiAgICB0aGlzLm5lZWRzUmVkcmF3ID0gdGhpcy5uZWVkc1JlZHJhdyAmJiAhY2xlYXJSZWRyYXdGbGFncztcbiAgICByZXR1cm4gcmVkcmF3O1xuICB9XG5cbiAgc2V0TmVlZHNSZWRyYXcocmVkcmF3ID0gdHJ1ZSkge1xuICAgIHRoaXMubmVlZHNSZWRyYXcgPSB0cnVlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gQWRkcyBhIHN0YXRpYyBhdHRyaWJ1dGUgKHRoYXQgaXMgbm90IGF1dG8gdXBkYXRlZClcbiAgYWRkKGF0dHJpYnV0ZXMsIHVwZGF0ZXJzKSB7XG4gICAgY29uc3QgbmV3QXR0cmlidXRlcyA9IHRoaXMuX2FkZChhdHRyaWJ1dGVzLCB1cGRhdGVycywge30pO1xuICAgIE9iamVjdC5hc3NpZ24odGhpcy5hdHRyaWJ1dGVzLCBuZXdBdHRyaWJ1dGVzKTtcbiAgfVxuXG4gIC8vIEFkZHMgYSBkeW5hbWljIGF0dHJpYnV0ZSwgdGhhdCBpcyBhdXRvdXBkYXRlZFxuICBhZGREeW5hbWljKGF0dHJpYnV0ZXMsIHVwZGF0ZXJzKSB7XG4gICAgY29uc3QgbmV3QXR0cmlidXRlcyA9IHRoaXMuX2FkZChhdHRyaWJ1dGVzLCB1cGRhdGVycywge1xuICAgICAgYXV0b1VwZGF0ZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5hc3NpZ24odGhpcy5hdHRyaWJ1dGVzLCBuZXdBdHRyaWJ1dGVzKTtcbiAgfVxuXG4gIC8vIEFkZHMgYW4gaW5zdGFuY2VkIGF0dHJpYnV0ZSB0aGF0IGlzIGF1dG91cGRhdGVkXG4gIGFkZEluc3RhbmNlZChhdHRyaWJ1dGVzLCB1cGRhdGVycykge1xuICAgIGNvbnN0IG5ld0F0dHJpYnV0ZXMgPSB0aGlzLl9hZGQoYXR0cmlidXRlcywgdXBkYXRlcnMsIHtcbiAgICAgIGluc3RhbmNlZDogMSxcbiAgICAgIGF1dG9VcGRhdGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuYXNzaWduKHRoaXMuYXR0cmlidXRlcywgbmV3QXR0cmlidXRlcyk7XG4gIH1cblxuICAvLyBNYXJrcyBhbiBhdHRyaWJ1dGUgZm9yIHVwZGF0ZVxuICBpbnZhbGlkYXRlKGF0dHJpYnV0ZU5hbWUpIHtcbiAgICBjb25zdCB7YXR0cmlidXRlc30gPSB0aGlzO1xuICAgIGNvbnN0IGF0dHJpYnV0ZSA9IGF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV07XG4gICAgYXNzZXJ0KGF0dHJpYnV0ZSk7XG4gICAgYXR0cmlidXRlLm5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICAvLyBGb3IgcGVyZm9ybWFuY2UgdHVuaW5nXG4gICAgbG9nLmxvZygxLCBgaW52YWxpZGF0ZWQgYXR0cmlidXRlICR7YXR0cmlidXRlTmFtZX0gZm9yICR7dGhpcy5pZH1gKTtcbiAgfVxuXG4gIGludmFsaWRhdGVBbGwoKSB7XG4gICAgY29uc3Qge2F0dHJpYnV0ZXN9ID0gdGhpcztcbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZU5hbWUgaW4gYXR0cmlidXRlcykge1xuICAgICAgdGhpcy5pbnZhbGlkYXRlKGF0dHJpYnV0ZU5hbWUpO1xuICAgIH1cbiAgfVxuXG4gIC8vIEVuc3VyZSBhbGwgYXR0cmlidXRlIGJ1ZmZlcnMgYXJlIHVwZGF0ZWQgZnJvbSBwcm9wcyBvciBkYXRhXG4gIHVwZGF0ZSh7bnVtSW5zdGFuY2VzLCBidWZmZXJzID0ge30sIGNvbnRleHQsIGRhdGEsIGdldFZhbHVlLCAuLi5vcHRzfSA9IHt9KSB7XG4gICAgdGhpcy5fY2hlY2tCdWZmZXJzKGJ1ZmZlcnMsIG9wdHMpO1xuICAgIHRoaXMuX3NldEJ1ZmZlcnMoYnVmZmVycyk7XG4gICAgdGhpcy5fYWxsb2NhdGVCdWZmZXJzKHtudW1JbnN0YW5jZXN9KTtcbiAgICB0aGlzLl91cGRhdGVCdWZmZXJzKHtudW1JbnN0YW5jZXMsIGNvbnRleHQsIGRhdGEsIGdldFZhbHVlfSk7XG4gIH1cblxuICAvLyBTZXQgdGhlIGJ1ZmZlcnMgZm9yIHRoZSBzdXBwbGllZCBhdHRyaWJ1dGVzXG4gIC8vIFVwZGF0ZSBhdHRyaWJ1dGUgYnVmZmVycyBmcm9tIGFueSBhdHRyaWJ1dGVzIGluIHByb3BzXG4gIC8vIERldGFjaCBhbnkgcHJldmlvdXNseSBzZXQgYnVmZmVycywgbWFya2luZyBhbGxcbiAgLy8gQXR0cmlidXRlcyBmb3IgYXV0byBhbGxvY2F0aW9uXG4gIF9zZXRCdWZmZXJzKGJ1ZmZlck1hcCwgb3B0KSB7XG4gICAgY29uc3Qge2F0dHJpYnV0ZXN9ID0gdGhpcztcblxuICAgIC8vIENvcHkgdGhlIHJlZnMgb2YgYW55IHN1cHBsaWVkIGJ1ZmZlcnMgaW4gdGhlIHByb3BzXG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGVOYW1lIGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IGF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV07XG4gICAgICBjb25zdCBidWZmZXIgPSBidWZmZXJNYXBbYXR0cmlidXRlTmFtZV07XG4gICAgICBpZiAoYnVmZmVyKSB7XG4gICAgICAgIGF0dHJpYnV0ZS5pc0V4dGVybmFsQnVmZmVyID0gdHJ1ZTtcbiAgICAgICAgYXR0cmlidXRlLm5lZWRzVXBkYXRlID0gZmFsc2U7XG4gICAgICAgIGlmIChhdHRyaWJ1dGUudmFsdWUgIT09IGJ1ZmZlcikge1xuICAgICAgICAgIGF0dHJpYnV0ZS52YWx1ZSA9IGJ1ZmZlcjtcbiAgICAgICAgICBhdHRyaWJ1dGUuY2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgdGhpcy5uZWVkc1JlZHJhdyA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGF0dHJpYnV0ZS5pc0V4dGVybmFsQnVmZmVyID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gQXV0byBhbGxvY2F0ZXMgYnVmZmVycyBmb3IgYXR0cmlidXRlc1xuICAvLyBOb3RlOiBUbyByZWR1Y2UgYWxsb2NhdGlvbnMsIG9ubHkgZ3Jvd3MgYnVmZmVyc1xuICAvLyBOb3RlOiBPbmx5IGFsbG9jYXRlcyBidWZmZXJzIG5vdCBzZXQgYnkgc2V0QnVmZmVyXG4gIF9hbGxvY2F0ZUJ1ZmZlcnMoe251bUluc3RhbmNlc30pIHtcbiAgICBjb25zdCB7YWxsb2NlZEluc3RhbmNlcywgYXR0cmlidXRlc30gPSB0aGlzO1xuICAgIGFzc2VydChudW1JbnN0YW5jZXMgIT09IHVuZGVmaW5lZCk7XG5cbiAgICBpZiAobnVtSW5zdGFuY2VzID4gYWxsb2NlZEluc3RhbmNlcykge1xuICAgICAgLy8gQWxsb2NhdGUgYXQgbGVhc3Qgb25lIGVsZW1lbnQgdG8gZW5zdXJlIGEgdmFsaWQgYnVmZmVyXG4gICAgICBjb25zdCBhbGxvY0NvdW50ID0gTWF0aC5tYXgobnVtSW5zdGFuY2VzLCAxKTtcbiAgICAgIGZvciAoY29uc3QgYXR0cmlidXRlTmFtZSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IGF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV07XG4gICAgICAgIGNvbnN0IHtzaXplLCBpc0V4dGVybmFsQnVmZmVyLCBhdXRvVXBkYXRlfSA9IGF0dHJpYnV0ZTtcbiAgICAgICAgaWYgKCFpc0V4dGVybmFsQnVmZmVyICYmIGF1dG9VcGRhdGUpIHtcbiAgICAgICAgICBjb25zdCBBcnJheVR5cGUgPSBhdHRyaWJ1dGUudHlwZSB8fCBGbG9hdDMyQXJyYXk7XG4gICAgICAgICAgYXR0cmlidXRlLnZhbHVlID0gbmV3IEFycmF5VHlwZShzaXplICogYWxsb2NDb3VudCk7XG4gICAgICAgICAgYXR0cmlidXRlLm5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICAgICAgICBsb2cubG9nKDIsIGBhbGxvY2F0ZWQgJHthbGxvY0NvdW50fSAke2F0dHJpYnV0ZU5hbWV9IGZvciAke3RoaXMuaWR9YCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuYWxsb2NlZEluc3RhbmNlcyA9IGFsbG9jQ291bnQ7XG4gICAgfVxuICB9XG5cbiAgX3VwZGF0ZUJ1ZmZlcnMoe251bUluc3RhbmNlcywgZGF0YSwgZ2V0VmFsdWUsIGNvbnRleHR9KSB7XG4gICAgY29uc3Qge2F0dHJpYnV0ZXN9ID0gdGhpcztcblxuICAgIC8vIElmIGFwcCBzdXBwbGllZCBhbGwgYXR0cmlidXRlcywgbm8gbmVlZCB0byBpdGVyYXRlIG92ZXIgZGF0YVxuXG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGVOYW1lIGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IGF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV07XG4gICAgICBjb25zdCB7dXBkYXRlfSA9IGF0dHJpYnV0ZTtcbiAgICAgIGlmIChhdHRyaWJ1dGUubmVlZHNVcGRhdGUgJiYgYXR0cmlidXRlLmF1dG9VcGRhdGUpIHtcbiAgICAgICAgaWYgKHVwZGF0ZSkge1xuICAgICAgICAgIGxvZy5sb2coMixcbiAgICAgICAgICAgIGBhdXRvdXBkYXRpbmcgJHtudW1JbnN0YW5jZXN9ICR7YXR0cmlidXRlTmFtZX0gZm9yICR7dGhpcy5pZH1gKTtcbiAgICAgICAgICB1cGRhdGUuY2FsbChjb250ZXh0LCBhdHRyaWJ1dGUsIG51bUluc3RhbmNlcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbG9nLmxvZygyLFxuICAgICAgICAgICAgYGF1dG9jYWxjdWxhdGluZyAke251bUluc3RhbmNlc30gJHthdHRyaWJ1dGVOYW1lfSBmb3IgJHt0aGlzLmlkfWApO1xuICAgICAgICAgIHRoaXMuX3VwZGF0ZUF0dHJpYnV0ZUZyb21EYXRhKGF0dHJpYnV0ZSwgZGF0YSwgZ2V0VmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGF0dHJpYnV0ZS5uZWVkc1VwZGF0ZSA9IGZhbHNlO1xuICAgICAgICBhdHRyaWJ1dGUuY2hhbmdlZCA9IHRydWU7XG4gICAgICAgIHRoaXMubmVlZHNSZWRyYXcgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIF91cGRhdGVBdHRyaWJ1dGVGcm9tRGF0YShhdHRyaWJ1dGUsIGRhdGEgPSBbXSwgZ2V0VmFsdWUgPSB4ID0+IHgpIHtcblxuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IG9iamVjdCBvZiBkYXRhKSB7XG4gICAgICBjb25zdCB2YWx1ZXMgPSBnZXRWYWx1ZShvYmplY3QpO1xuICAgICAgLy8gSWYgdGhpcyBhdHRyaWJ1dGUncyBidWZmZXIgd2Fzbid0IGNvcGllZCBmcm9tIHByb3BzLCBpbml0aWFsaXplIGl0XG4gICAgICBpZiAoIWF0dHJpYnV0ZS5pc0V4dGVybmFsQnVmZmVyKSB7XG4gICAgICAgIGNvbnN0IHt2YWx1ZSwgc2l6ZX0gPSBhdHRyaWJ1dGU7XG4gICAgICAgIHZhbHVlW2kgKiBzaXplICsgMF0gPSB2YWx1ZXNbYXR0cmlidXRlWzBdXTtcbiAgICAgICAgaWYgKHNpemUgPj0gMikge1xuICAgICAgICAgIHZhbHVlW2kgKiBzaXplICsgMV0gPSB2YWx1ZXNbYXR0cmlidXRlWzBdXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2l6ZSA+PSAzKSB7XG4gICAgICAgICAgdmFsdWVbaSAqIHNpemUgKyAyXSA9IHZhbHVlc1thdHRyaWJ1dGVbMF1dO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzaXplID49IDQpIHtcbiAgICAgICAgICB2YWx1ZVtpICogc2l6ZSArIDNdID0gdmFsdWVzW2F0dHJpYnV0ZVswXV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGkrKztcbiAgICB9XG4gIH1cblxuICAvLyBDaGVja3MgdGhhdCBhbnkgYXR0cmlidXRlIGJ1ZmZlcnMgaW4gcHJvcHMgYXJlIHZhbGlkXG4gIC8vIE5vdGU6IFRoaXMgaXMganVzdCB0byBoZWxwIGFwcCBjYXRjaCBtaXN0YWtlc1xuICBfY2hlY2tCdWZmZXJzKGJ1ZmZlck1hcCA9IHt9LCBvcHRzID0ge30pIHtcbiAgICBjb25zdCB7YXR0cmlidXRlcywgbnVtSW5zdGFuY2VzfSA9IHRoaXM7XG5cbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZU5hbWUgaW4gYnVmZmVyTWFwKSB7XG4gICAgICBjb25zdCBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdO1xuICAgICAgY29uc3QgYnVmZmVyID0gYnVmZmVyTWFwW2F0dHJpYnV0ZU5hbWVdO1xuICAgICAgaWYgKCFhdHRyaWJ1dGUgJiYgIW9wdHMuaWdub3JlVW5rbm93bkF0dHJpYnV0ZXMpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmtub3duIGF0dHJpYnV0ZSBwcm9wICR7YXR0cmlidXRlTmFtZX1gKTtcbiAgICAgIH1cbiAgICAgIGlmIChhdHRyaWJ1dGUpIHtcbiAgICAgICAgaWYgKCEoYnVmZmVyIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5KSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQXR0cmlidXRlIHByb3BlcnRpZXMgbXVzdCBiZSBvZiB0eXBlIEZsb2F0MzJBcnJheScpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhdHRyaWJ1dGUuYXV0byAmJiBidWZmZXIubGVuZ3RoIDw9IG51bUluc3RhbmNlcyAqIGF0dHJpYnV0ZS5zaXplKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBdHRyaWJ1dGUgcHJvcCBhcnJheSBtdXN0IG1hdGNoIGxlbmd0aCBhbmQgc2l6ZScpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gVXNlZCB0byByZWdpc3RlciBhbiBhdHRyaWJ1dGVcbiAgX2FkZChhdHRyaWJ1dGVzLCB1cGRhdGVycywgX2V4dHJhUHJvcHMgPSB7fSkge1xuXG4gICAgY29uc3QgbmV3QXR0cmlidXRlcyA9IHt9O1xuXG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGVOYW1lIGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IGF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV07XG4gICAgICBjb25zdCB1cGRhdGVyID0gdXBkYXRlcnMgJiYgdXBkYXRlcnNbYXR0cmlidXRlTmFtZV07XG5cbiAgICAgIC8vIENoZWNrIGFsbCBmaWVsZHMgYW5kIGdlbmVyYXRlIGhlbHBmdWwgZXJyb3IgbWVzc2FnZXNcbiAgICAgIHRoaXMuX3ZhbGlkYXRlKGF0dHJpYnV0ZU5hbWUsIGF0dHJpYnV0ZSwgdXBkYXRlcik7XG5cbiAgICAgIC8vIEluaXRpYWxpemUgdGhlIGF0dHJpYnV0ZSBkZXNjcmlwdG9yLCB3aXRoIFdlYkdMIGFuZCBtZXRhZGF0YSBmaWVsZHNcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZURhdGEgPSB7XG4gICAgICAgIC8vIEVuc3VyZSB0aGF0IGZpZWxkcyBhcmUgcHJlc2VudCBiZWZvcmUgT2JqZWN0LnNlYWwoKVxuICAgICAgICB0YXJnZXQ6IHVuZGVmaW5lZCxcbiAgICAgICAgaXNJbmRleGVkOiBmYWxzZSxcblxuICAgICAgICAvLyBSZXNlcnZlZCBmb3IgYXBwbGljYXRpb25cbiAgICAgICAgdXNlckRhdGE6IHt9LFxuXG4gICAgICAgIC8vIE1ldGFkYXRhXG4gICAgICAgIC4uLmF0dHJpYnV0ZSxcbiAgICAgICAgLi4udXBkYXRlcixcblxuICAgICAgICAvLyBTdGF0ZVxuICAgICAgICBpc0V4dGVybmFsQnVmZmVyOiBmYWxzZSxcbiAgICAgICAgbmVlZHNVcGRhdGU6IHRydWUsXG4gICAgICAgIGNoYW5nZWQ6IHRydWUsXG5cbiAgICAgICAgLy8gV2ViR0wgZmllbGRzXG4gICAgICAgIHNpemU6IGF0dHJpYnV0ZS5zaXplLFxuICAgICAgICB2YWx1ZTogYXR0cmlidXRlLnZhbHVlIHx8IG51bGwsXG5cbiAgICAgICAgLi4uX2V4dHJhUHJvcHNcbiAgICAgIH07XG4gICAgICAvLyBTYW5pdHkgLSBubyBhcHAgZmllbGRzIG9uIG91ciBhdHRyaWJ1dGVzLiBVc2UgdXNlckRhdGEgaW5zdGVhZC5cbiAgICAgIE9iamVjdC5zZWFsKGF0dHJpYnV0ZURhdGEpO1xuXG4gICAgICAvLyBBZGQgdG8gYm90aCBhdHRyaWJ1dGVzIGxpc3QgKGZvciByZWdpc3RyYXRpb24gd2l0aCBtb2RlbClcbiAgICAgIHRoaXMuYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXSA9IGF0dHJpYnV0ZURhdGE7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ld0F0dHJpYnV0ZXM7XG4gIH1cblxuICBfdmFsaWRhdGUoYXR0cmlidXRlTmFtZSwgYXR0cmlidXRlLCB1cGRhdGVyKSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBhdHRyaWJ1dGUuc2l6ZSA9PT0gJ251bWJlcicsXG4gICAgICBgQXR0cmlidXRlIGRlZmluaXRpb24gZm9yICR7YXR0cmlidXRlTmFtZX0gbWlzc2luZyBzaXplYCk7XG5cbiAgICAvLyBDaGVjayB0aGF0IHZhbHVlIGV4dHJhY3Rpb24ga2V5cyBhcmUgc2V0XG4gICAgYXNzZXJ0KHR5cGVvZiBhdHRyaWJ1dGVbMF0gPT09ICdzdHJpbmcnLFxuICAgICAgYEF0dHJpYnV0ZSBkZWZpbml0aW9uIGZvciAke2F0dHJpYnV0ZU5hbWV9IG1pc3Npbmcga2V5IDBgKTtcbiAgICBpZiAoYXR0cmlidXRlLnNpemUgPj0gMikge1xuICAgICAgYXNzZXJ0KHR5cGVvZiBhdHRyaWJ1dGVbMV0gPT09ICdzdHJpbmcnLFxuICAgICAgICBgQXR0cmlidXRlIGRlZmluaXRpb24gZm9yICR7YXR0cmlidXRlTmFtZX0gbWlzc2luZyBrZXkgMWApO1xuICAgIH1cbiAgICBpZiAoYXR0cmlidXRlLnNpemUgPj0gMykge1xuICAgICAgYXNzZXJ0KHR5cGVvZiBhdHRyaWJ1dGVbMl0gPT09ICdzdHJpbmcnLFxuICAgICAgICBgQXR0cmlidXRlIGRlZmluaXRpb24gZm9yICR7YXR0cmlidXRlTmFtZX0gbWlzc2luZyBrZXkgMmApO1xuICAgIH1cbiAgICBpZiAoYXR0cmlidXRlLnNpemUgPj0gNCkge1xuICAgICAgYXNzZXJ0KHR5cGVvZiBhdHRyaWJ1dGVbM10gPT09ICdzdHJpbmcnLFxuICAgICAgICBgQXR0cmlidXRlIGRlZmluaXRpb24gZm9yICR7YXR0cmlidXRlTmFtZX0gbWlzc2luZyBrZXkgM2ApO1xuICAgIH1cblxuICAgIC8vIENoZWNrIHRoZSB1cGRhdGVyXG4gICAgYXNzZXJ0KCF1cGRhdGVyIHx8IHR5cGVvZiB1cGRhdGVyLnVwZGF0ZSA9PT0gJ2Z1bmN0aW9uJyxcbiAgICAgIGBBdHRyaWJ1dGUgdXBkYXRlciBmb3IgJHthdHRyaWJ1dGVOYW1lfSBtaXNzaW5nIHVwZGF0ZSBtZXRob2RgKTtcbiAgfVxuXG59XG4iXX0=