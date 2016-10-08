'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.Material = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _webgl = require('../webgl');

var _object3d = require('../scenegraph/object-3d');

var _object3d2 = _interopRequireDefault(_object3d);

var _utils = require('../utils');

var _geometry = require('./geometry');

var _geometry2 = _interopRequireDefault(_geometry);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } } // A scenegraph object node
/* eslint-disable guard-for-in */

// Define some locals


var MSG_INSTANCED_PARAM_DEPRECATED = 'Warning: Model constructor: parameter "instanced" renamed to "isInstanced".\nThis will become a hard error in a future version of luma.gl.';

var MSG_TEXTURES_PARAM_REMOVED = 'Model: parameter "textures" removed. Use uniforms to set textures';

// TODO - experimental, not yet used

var Material = exports.Material = function Material() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var _ref$shininess = _ref.shininess;
  var shininess = _ref$shininess === undefined ? 0 : _ref$shininess;
  var _ref$reflection = _ref.reflection;
  var reflection = _ref$reflection === undefined ? 0 : _ref$reflection;
  var _ref$refraction = _ref.refraction;
  var refraction = _ref$refraction === undefined ? 0 : _ref$refraction;

  _classCallCheck(this, Material);

  this.shininess = shininess;
  this.reflection = reflection;
  this.refraction = refraction;
};

// Model abstract O3D Class


var Model = function (_Object3D) {
  _inherits(Model, _Object3D);

  /* eslint-disable max-statements  */
  /* eslint-disable complexity  */
  function Model() {
    var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var program = _ref2.program;
    var _ref2$gl = _ref2.gl;
    var gl = _ref2$gl === undefined ? null : _ref2$gl;
    var _ref2$vs = _ref2.vs;
    var vs = _ref2$vs === undefined ? null : _ref2$vs;
    var _ref2$fs = _ref2.fs;
    var fs = _ref2$fs === undefined ? null : _ref2$fs;
    var geometry = _ref2.geometry;
    var _ref2$material = _ref2.material;
    var material = _ref2$material === undefined ? null : _ref2$material;
    var textures = _ref2.textures;
    var _ref2$isInstanced = _ref2.isInstanced;
    var isInstanced = _ref2$isInstanced === undefined ? false : _ref2$isInstanced;
    var _ref2$instanceCount = _ref2.instanceCount;
    var instanceCount = _ref2$instanceCount === undefined ? 0 : _ref2$instanceCount;
    var _ref2$vertexCount = _ref2.vertexCount;
    var vertexCount = _ref2$vertexCount === undefined ? undefined : _ref2$vertexCount;
    var _ref2$pickable = _ref2.pickable;
    var pickable = _ref2$pickable === undefined ? false : _ref2$pickable;
    var _ref2$pick = _ref2.pick;
    var pick = _ref2$pick === undefined ? null : _ref2$pick;
    var _ref2$uniforms = _ref2.uniforms;
    var uniforms = _ref2$uniforms === undefined ? {} : _ref2$uniforms;
    var _ref2$attributes = _ref2.attributes;
    var attributes = _ref2$attributes === undefined ? {} : _ref2$attributes;
    var _ref2$render = _ref2.render;
    var render = _ref2$render === undefined ? null : _ref2$render;
    var _ref2$onBeforeRender = _ref2.onBeforeRender;
    var onBeforeRender = _ref2$onBeforeRender === undefined ? function () {} : _ref2$onBeforeRender;
    var _ref2$onAfterRender = _ref2.onAfterRender;
    var onAfterRender = _ref2$onAfterRender === undefined ? function () {} : _ref2$onAfterRender;

    var opts = _objectWithoutProperties(_ref2, ['program', 'gl', 'vs', 'fs', 'geometry', 'material', 'textures', 'isInstanced', 'instanceCount', 'vertexCount', 'pickable', 'pick', 'uniforms', 'attributes', 'render', 'onBeforeRender', 'onAfterRender']);

    _classCallCheck(this, Model);

    // assert(program || program instanceof Program);
    (0, _assert2.default)(geometry instanceof _geometry2.default, 'Model needs a geometry');

    // set a custom program per o3d
    var _this = _possibleConstructorReturn(this, (Model.__proto__ || Object.getPrototypeOf(Model)).call(this, opts));

    _this.program = program || new _webgl.Program(gl, { vs: vs, fs: fs });
    (0, _assert2.default)(_this.program instanceof _webgl.Program, 'Model needs a program');

    if (opts.instanced) {
      /* global console */
      /* eslint-disable no-console */
      console.warn(MSG_INSTANCED_PARAM_DEPRECATED);
      isInstanced = isInstanced || opts.instanced;
    }

    if (textures) {
      throw new Error(MSG_TEXTURES_PARAM_REMOVED);
    }

    // TODO - remove?
    _this.buffers = {};
    _this.userData = {};
    _this.drawParams = {};
    _this.dynamic = false;
    _this.needsRedraw = true;

    _this.material = material;

    // Attributes and buffers
    _this.setGeometry(geometry);
    _this.attributes = {};
    _this.setAttributes(attributes);

    _this.uniforms = {};
    _this.setUniforms(_extends({}, _this.program.defaultUniforms, uniforms));

    // instanced rendering
    _this.isInstanced = isInstanced;
    _this.instanceCount = instanceCount;
    _this.vertexCount = vertexCount;

    // picking options
    _this.pickable = Boolean(pickable);
    _this.pick = pick || function () {
      return false;
    };

    _this.onBeforeRender = onBeforeRender;
    _this.onAfterRender = onAfterRender;
    return _this;
  }
  /* eslint-enable max-statements */
  /* eslint-enable complexity */

  _createClass(Model, [{
    key: 'setNeedsRedraw',
    value: function setNeedsRedraw() {
      var redraw = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

      this.needsRedraw = redraw;
      return this;
    }
  }, {
    key: 'getNeedsRedraw',
    value: function getNeedsRedraw() {
      var _ref3 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var _ref3$clearRedrawFlag = _ref3.clearRedrawFlags;
      var clearRedrawFlags = _ref3$clearRedrawFlag === undefined ? false : _ref3$clearRedrawFlag;

      var redraw = false;
      redraw = redraw || this.needsRedraw;
      this.needsRedraw = this.needsRedraw && !clearRedrawFlags;
      redraw = redraw || this.geometry.getNeedsRedraw({ clearRedrawFlags: clearRedrawFlags });
      return redraw;
    }
  }, {
    key: 'setInstanceCount',
    value: function setInstanceCount(instanceCount) {
      (0, _assert2.default)(instanceCount !== undefined);
      this.instanceCount = instanceCount;
      return this;
    }
  }, {
    key: 'getInstanceCount',
    value: function getInstanceCount() {
      return this.instanceCount;
    }
  }, {
    key: 'setVertexCount',
    value: function setVertexCount(vertexCount) {
      this.vertexCount = vertexCount;
      return this;
    }
  }, {
    key: 'getVertexCount',
    value: function getVertexCount() {
      return this.vertexCount === undefined ? this.geometry.getVertexCount() : this.vertexCount;
    }
  }, {
    key: 'isPickable',
    value: function isPickable() {
      return this.pickable;
    }
  }, {
    key: 'setPickable',
    value: function setPickable() {
      var pickable = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

      this.pickable = Boolean(pickable);
      return this;
    }
  }, {
    key: 'getProgram',
    value: function getProgram() {
      return this.program;
    }
  }, {
    key: 'getGeometry',
    value: function getGeometry() {
      return this.geometry;
    }
  }, {
    key: 'setGeometry',
    value: function setGeometry(geometry) {
      this.geometry = geometry;
      this._createBuffersFromAttributeDescriptors(this.geometry.getAttributes());
      this.setNeedsRedraw();
      return this;
    }
  }, {
    key: 'getAttributes',
    value: function getAttributes() {
      return this.attributes;
    }
  }, {
    key: 'setAttributes',
    value: function setAttributes() {
      var attributes = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      Object.assign(this.attributes, attributes);
      this._createBuffersFromAttributeDescriptors(attributes);
      this.setNeedsRedraw();
      return this;
    }
  }, {
    key: 'getUniforms',
    value: function getUniforms() {
      return this.uniforms;
    }
  }, {
    key: 'setUniforms',
    value: function setUniforms() {
      var uniforms = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      (0, _webgl.checkUniformValues)(uniforms, this.id);
      Object.assign(this.uniforms, uniforms);
      this.setNeedsRedraw();
      return this;
    }

    /*
     * @param {Camera} opt.camera=
     * @param {Camera} opt.viewMatrix=
     */
    /* eslint-disable max-statements */

  }, {
    key: 'render',
    value: function render() {
      var uniforms = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      // TODO - special treatment of these parameters should be removed
      var camera = uniforms.camera;
      var viewMatrix = uniforms.viewMatrix;

      var otherUniforms = _objectWithoutProperties(uniforms, ['camera', 'viewMatrix']);
      // Camera exposes uniforms that can be used directly in shaders


      if (camera) {
        this.setUniforms(camera.getUniforms());
      }
      if (viewMatrix) {
        this.setUniforms(this.getCoordinateUniforms(viewMatrix));
      }

      _utils.log.log(2, '>>> RENDERING MODEL ' + this.id, this);

      this.setProgramState(otherUniforms);

      var drawParams = this.drawParams;
      if (drawParams.isInstanced && !this.isInstanced) {
        _utils.log.warn(0, 'Found instanced attributes on non-instanced model');
      }

      this.onBeforeRender();

      this._logAttributesAndUniforms(3, uniforms);

      var gl = this.program.gl;
      var geometry = this.geometry;
      var isInstanced = this.isInstanced;
      var instanceCount = this.instanceCount;
      var isIndexed = drawParams.isIndexed;
      var indexType = drawParams.indexType;

      (0, _webgl.draw)(gl, {
        drawMode: geometry.drawMode,
        vertexCount: this.getVertexCount(),
        isIndexed: isIndexed,
        indexType: indexType,
        isInstanced: isInstanced,
        instanceCount: instanceCount
      });

      this.onAfterRender();

      this.unsetProgramState();

      this.setNeedsRedraw(false);

      _utils.log.log(2, '<<< RENDERING MODEL ' + this.id + ' - complete');

      return this;
    }
  }, {
    key: 'setProgramState',
    value: function setProgramState(uniforms) {
      var program = this.program;

      program.use();
      program.setUniforms(_extends({}, this.uniforms, uniforms));
      this.drawParams = {};
      program.setBuffers(this.buffers, { drawParams: this.drawParams });
      return this;
    }
  }, {
    key: 'unsetProgramState',
    value: function unsetProgramState() {
      // Ensures all vertex attributes are disabled and ELEMENT_ARRAY_BUFFER
      // is unbound
      this.program.unsetBuffers();
      return this;
    }

    // Makes sure buffers are created for all attributes
    // and that the program is updated with those buffers
    // TODO - do we need the separation between "attributes" and "buffers"
    // couldn't apps just create buffers directly?

  }, {
    key: '_createBuffersFromAttributeDescriptors',
    value: function _createBuffersFromAttributeDescriptors(attributes) {
      var gl = this.program.gl;


      for (var attributeName in attributes) {
        var attribute = attributes[attributeName];

        if (attribute instanceof _webgl.Buffer) {
          this.buffers[attributeName] = attribute;
        } else {
          // Autocreate a buffer
          this.buffers[attributeName] = this.buffers[attributeName] || new _webgl.Buffer(gl);

          var buffer = this.buffers[attributeName];
          buffer.setData(_extends({}, attribute, {
            data: attribute.value,
            target: attribute.isIndexed ? _webgl.WebGL.ELEMENT_ARRAY_BUFFER : _webgl.WebGL.ARRAY_BUFFER
          }));
        }
      }

      return this;
    }
  }, {
    key: '_logAttributesAndUniforms',
    value: function _logAttributesAndUniforms() {
      var priority = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 3;
      var uniforms = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (_utils.log.priority >= priority) {
        var attributeTable = this._getAttributesTable({
          header: 'Attributes ' + this.id,
          program: this.program,
          attributes: _extends({}, this.geometry.attributes, this.attributes)
        });
        _utils.log.table(priority, attributeTable);

        var _getUniformsTable = (0, _webgl.getUniformsTable)({
          header: 'Uniforms ' + this.id,
          program: this.program,
          uniforms: _extends({}, this.uniforms, uniforms)
        });

        var table = _getUniformsTable.table;
        var unusedTable = _getUniformsTable.unusedTable;
        var unusedCount = _getUniformsTable.unusedCount;

        _utils.log.table(priority, table);
        _utils.log.log(priority, (unusedCount || 'No') + ' unused uniforms ', unusedTable);
      }
    }

    // Todo move to attributes manager

  }, {
    key: '_getAttributesTable',
    value: function _getAttributesTable() {
      var _ref4 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var attributes = _ref4.attributes;
      var _ref4$header = _ref4.header;
      var header = _ref4$header === undefined ? 'Attributes' : _ref4$header;
      var instanced = _ref4.instanced;
      var program = _ref4.program;

      (0, _assert2.default)(program);
      var attributeLocations = program._attributeLocations;
      var table = _defineProperty({}, header, {});

      // Add used attributes
      for (var attributeName in attributeLocations) {
        var attribute = attributes[attributeName];
        var location = attributeLocations[attributeName];
        table[attributeName] = this._getAttributeEntry(attribute, location);
      }

      // Add any unused attributes
      for (var _attributeName in attributes) {
        var _attribute = attributes[_attributeName];
        if (!table[_attributeName]) {
          table[_attributeName] = this._getAttributeEntry(_attribute, null);
        }
      }

      return table;
    }
  }, {
    key: '_getAttributeEntry',
    value: function _getAttributeEntry(attribute, location) {
      var round = function round(num) {
        return Math.round(num * 10) / 10;
      };

      var type = 'NOT PROVIDED';
      var instanced = 0;
      var size = 'N/A';
      var verts = 'N/A';
      var bytes = 'N/A';
      var value = 'N/A';

      if (attribute && location === null) {
        location = attribute.isIndexed ? 'ELEMENT_ARRAY_BUFFER' : 'NOT USED';
      }

      if (attribute instanceof _webgl.Buffer) {
        var buffer = attribute;
        type = buffer.layout.type;
        instanced = buffer.layout.instanced;
        size = buffer.layout.size;
        verts = round(buffer.data.length / buffer.layout.size);
        bytes = buffer.data.length * buffer.data.BYTES_PER_ELEMENT;
      } else if (attribute) {
        type = attribute.value.constructor.name;
        instanced = attribute.instanced;
        size = attribute.size;
        verts = round(attribute.value.length / attribute.size);
        bytes = attribute.value.length * attribute.value.BYTES_PER_ELEMENT;
        value = attribute.value;
      }

      // Generate a type name by dropping Array from Float32Array etc.
      type = String(type).replace('Array', '');
      // Look for 'nt' to detect integer types, e.g. Int32Array, Uint32Array
      var isInteger = type.indexOf('nt') !== -1;

      location = '' + location + (instanced ? ' [instanced]' : '');

      return {
        Location: location,
        'Type Size x Verts = Bytes': type + ' ' + size + ' x ' + verts + ' = ' + bytes,
        Value: (0, _utils.formatValue)(value, { size: size, isInteger: isInteger })
      };
    }

    // DEPRECATED / REMOVED

  }, {
    key: 'setTextures',
    value: function setTextures() {
      var textures = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

      throw new Error('model.setTextures replaced: setUniforms({sampler2D: new Texture2D})');
    }
  }, {
    key: 'hash',
    get: function get() {
      return this.id + ' ' + this.$pickingIndex;
    }
  }]);

  return Model;
}(_object3d2.default);

exports.default = Model;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb3JlL21vZGVsLmpzIl0sIm5hbWVzIjpbIk1TR19JTlNUQU5DRURfUEFSQU1fREVQUkVDQVRFRCIsIk1TR19URVhUVVJFU19QQVJBTV9SRU1PVkVEIiwiTWF0ZXJpYWwiLCJzaGluaW5lc3MiLCJyZWZsZWN0aW9uIiwicmVmcmFjdGlvbiIsIk1vZGVsIiwicHJvZ3JhbSIsImdsIiwidnMiLCJmcyIsImdlb21ldHJ5IiwibWF0ZXJpYWwiLCJ0ZXh0dXJlcyIsImlzSW5zdGFuY2VkIiwiaW5zdGFuY2VDb3VudCIsInZlcnRleENvdW50IiwidW5kZWZpbmVkIiwicGlja2FibGUiLCJwaWNrIiwidW5pZm9ybXMiLCJhdHRyaWJ1dGVzIiwicmVuZGVyIiwib25CZWZvcmVSZW5kZXIiLCJvbkFmdGVyUmVuZGVyIiwib3B0cyIsImluc3RhbmNlZCIsImNvbnNvbGUiLCJ3YXJuIiwiRXJyb3IiLCJidWZmZXJzIiwidXNlckRhdGEiLCJkcmF3UGFyYW1zIiwiZHluYW1pYyIsIm5lZWRzUmVkcmF3Iiwic2V0R2VvbWV0cnkiLCJzZXRBdHRyaWJ1dGVzIiwic2V0VW5pZm9ybXMiLCJkZWZhdWx0VW5pZm9ybXMiLCJCb29sZWFuIiwicmVkcmF3IiwiY2xlYXJSZWRyYXdGbGFncyIsImdldE5lZWRzUmVkcmF3IiwiZ2V0VmVydGV4Q291bnQiLCJfY3JlYXRlQnVmZmVyc0Zyb21BdHRyaWJ1dGVEZXNjcmlwdG9ycyIsImdldEF0dHJpYnV0ZXMiLCJzZXROZWVkc1JlZHJhdyIsIk9iamVjdCIsImFzc2lnbiIsImlkIiwiY2FtZXJhIiwidmlld01hdHJpeCIsIm90aGVyVW5pZm9ybXMiLCJnZXRVbmlmb3JtcyIsImdldENvb3JkaW5hdGVVbmlmb3JtcyIsImxvZyIsInNldFByb2dyYW1TdGF0ZSIsIl9sb2dBdHRyaWJ1dGVzQW5kVW5pZm9ybXMiLCJpc0luZGV4ZWQiLCJpbmRleFR5cGUiLCJkcmF3TW9kZSIsInVuc2V0UHJvZ3JhbVN0YXRlIiwidXNlIiwic2V0QnVmZmVycyIsInVuc2V0QnVmZmVycyIsImF0dHJpYnV0ZU5hbWUiLCJhdHRyaWJ1dGUiLCJidWZmZXIiLCJzZXREYXRhIiwiZGF0YSIsInZhbHVlIiwidGFyZ2V0IiwiRUxFTUVOVF9BUlJBWV9CVUZGRVIiLCJBUlJBWV9CVUZGRVIiLCJwcmlvcml0eSIsImF0dHJpYnV0ZVRhYmxlIiwiX2dldEF0dHJpYnV0ZXNUYWJsZSIsImhlYWRlciIsInRhYmxlIiwidW51c2VkVGFibGUiLCJ1bnVzZWRDb3VudCIsImF0dHJpYnV0ZUxvY2F0aW9ucyIsIl9hdHRyaWJ1dGVMb2NhdGlvbnMiLCJsb2NhdGlvbiIsIl9nZXRBdHRyaWJ1dGVFbnRyeSIsInJvdW5kIiwiTWF0aCIsIm51bSIsInR5cGUiLCJzaXplIiwidmVydHMiLCJieXRlcyIsImxheW91dCIsImxlbmd0aCIsIkJZVEVTX1BFUl9FTEVNRU5UIiwiY29uc3RydWN0b3IiLCJuYW1lIiwiU3RyaW5nIiwicmVwbGFjZSIsImlzSW50ZWdlciIsImluZGV4T2YiLCJMb2NhdGlvbiIsIlZhbHVlIiwiJHBpY2tpbmdJbmRleCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFJQTs7QUFHQTs7OztBQUNBOztBQUNBOzs7O0FBQ0E7Ozs7Ozs7Ozs7Ozs7OzBKQVZBO0FBQ0E7O0FBRUE7OztBQVNBLElBQU1BLDZLQUFOOztBQUlBLElBQU1DLDZCQUNKLG1FQURGOztBQUdBOztJQUNhQyxRLFdBQUFBLFEsR0FDWCxvQkFBa0U7QUFBQSxpRkFBSixFQUFJOztBQUFBLDRCQUFyREMsU0FBcUQ7QUFBQSxNQUFyREEsU0FBcUQsa0NBQXpDLENBQXlDO0FBQUEsNkJBQXRDQyxVQUFzQztBQUFBLE1BQXRDQSxVQUFzQyxtQ0FBekIsQ0FBeUI7QUFBQSw2QkFBdEJDLFVBQXNCO0FBQUEsTUFBdEJBLFVBQXNCLG1DQUFULENBQVM7O0FBQUE7O0FBQ2hFLE9BQUtGLFNBQUwsR0FBaUJBLFNBQWpCO0FBQ0EsT0FBS0MsVUFBTCxHQUFrQkEsVUFBbEI7QUFDQSxPQUFLQyxV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Y3Qgbm9kZVxuLyogZXNsaW50LWRpc2FibGUgZ3VhcmQtZm9yLWluICovXG5cbi8vIERlZmluZSBzb21lIGxvY2Fsc1xuaW1wb3J0IHtcbiAgV2ViR0wsIEJ1ZmZlciwgUHJvZ3JhbSwgZHJhdywgY2hlY2tVbmlmb3JtVmFsdWVzLCBnZXRVbmlmb3Jtc1RhYmxlXG59IGZyb20gJy4uL3dlYmdsJztcbmltcG9ydCBPYmplY3QzRCBmcm9tICcuLi9zY2VuZWdyYXBoL29iamVjdC0zZCc7XG5pbXBvcnQge2xvZywgZm9ybWF0VmFsdWV9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCBHZW9tZXRyeSBmcm9tICcuL2dlb21ldHJ5JztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuY29uc3QgTVNHX0lOU1RBTkNFRF9QQVJBTV9ERVBSRUNBVEVEID0gYFxcXG5XYXJuaW5nOiBNb2RlbCBjb25zdHJ1Y3RvcjogcGFyYW1ldGVyIFwiaW5zdGFuY2VkXCIgcmVuYW1lZCB0byBcImlzSW5zdGFuY2VkXCIuXG5UaGlzIHdpbGwgYmVjb21lIGEgaGFyZCBlcnJvciBpbiBhIGZ1dHVyZSB2ZXJzaW9uIG9mIGx1bWEuZ2wuYDtcblxuY29uc3QgTVNHX1RFWFRVUkVTX1BBUkFNX1JFTU9WRUQgPVxuICAnTW9kZWw6IHBhcmFtZXRlciBcInRleHR1cmVzXCIgcmVtb3ZlZC4gVXNlIHVuaWZvcm1zIHRvIHNldCB0ZXh0dXJlcyc7XG5cbi8vIFRPRE8gLSBleHBlcmltZW50YWwsIG5vdCB5ZXQgdXNlZFxuZXhwb3J0IGNsYXNzIE1hdGVyaWFsIHtcbiAgY29uc3RydWN0b3Ioe3NoaW5pbmVzcyA9IDAsIHJlZmxlY3Rpb24gPSAwLCByZWZyYWN0aW9uID0gMH0gPSB7fSkge1xuICAgIHRoaXMuc2hpbmluZXNzID0gc2hpbmluZXNzO1xuICAgIHRoaXMucmVmbGVjdGlvbiA9IHJlZmxlY3Rpb247XG4gICAgdGhpcy5yZWZyYWN0aW9uID0gcmVmcmFjdGlvbjtcbiAgfVxufVxuXG4vLyBNb2RlbCBhYnN0cmFjdCBPM0QgQ2xhc3NcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1vZGVsIGV4dGVuZHMgT2JqZWN0M0Qge1xuXG4gIC8qIGVzbGludC1kaXNhYmxlIG1heC1zdGF0ZW1lbnRzICAqL1xuICAvKiBlc2xpbnQtZGlzYWJsZSBjb21wbGV4aXR5ICAqL1xuICBjb25zdHJ1Y3Rvcih7XG4gICAgcHJvZ3JhbSxcbiAgICBnbCA9IG51bGwsXG4gICAgdnMgPSBudWxsLFxuICAgIGZzID0gbnVsbCxcbiAgICBnZW9tZXRyeSxcbiAgICBtYXRlcmlhbCA9IG51bGwsXG4gICAgdGV4dHVyZXMsXG4gICAgLy8gRW5hYmxlcyBpbnN0YW5jZWQgcmVuZGVyaW5nIChuZWVkcyBzaGFkZXIgc3VwcG9ydCBhbmQgZXh0cmEgYXR0cmlidXRlcylcbiAgICBpc0luc3RhbmNlZCA9IGZhbHNlLFxuICAgIGluc3RhbmNlQ291bnQgPSAwLFxuICAgIHZlcnRleENvdW50ID0gdW5kZWZpbmVkLFxuICAgIC8vIFBpY2tpbmdcbiAgICBwaWNrYWJsZSA9IGZhbHNlLCBwaWNrID0gbnVsbCxcbiAgICAvLyBFeHRyYSB1bmlmb3JtcyBhbmQgYXR0cmlidXRlcyAoYmV5b25kIGdlb21ldHJ5LCBtYXRlcmlhbCwgY2FtZXJhKVxuICAgIHVuaWZvcm1zID0ge30sXG4gICAgYXR0cmlidXRlcyA9IHt9LFxuICAgIHJlbmRlciA9IG51bGwsXG4gICAgb25CZWZvcmVSZW5kZXIgPSAoKSA9PiB7fSxcbiAgICBvbkFmdGVyUmVuZGVyID0gKCkgPT4ge30sXG4gICAgLi4ub3B0c1xuICB9ID0ge30pIHtcbiAgICAvLyBhc3NlcnQocHJvZ3JhbSB8fCBwcm9ncmFtIGluc3RhbmNlb2YgUHJvZ3JhbSk7XG4gICAgYXNzZXJ0KGdlb21ldHJ5IGluc3RhbmNlb2YgR2VvbWV0cnksICdNb2RlbCBuZWVkcyBhIGdlb21ldHJ5Jyk7XG5cbiAgICBzdXBlcihvcHRzKTtcblxuICAgIC8vIHNldCBhIGN1c3RvbSBwcm9ncmFtIHBlciBvM2RcbiAgICB0aGlzLnByb2dyYW0gPSBwcm9ncmFtIHx8IG5ldyBQcm9ncmFtKGdsLCB7dnMsIGZzfSk7XG4gICAgYXNzZXJ0KHRoaXMucHJvZ3JhbSBpbnN0YW5jZW9mIFByb2dyYW0sICdNb2RlbCBuZWVkcyBhIHByb2dyYW0nKTtcblxuICAgIGlmIChvcHRzLmluc3RhbmNlZCkge1xuICAgICAgLyogZ2xvYmFsIGNvbnNvbGUgKi9cbiAgICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnNvbGUgKi9cbiAgICAgIGNvbnNvbGUud2FybihNU0dfSU5TVEFOQ0VEX1BBUkFNX0RFUFJFQ0FURUQpO1xuICAgICAgaXNJbnN0YW5jZWQgPSBpc0luc3RhbmNlZCB8fCBvcHRzLmluc3RhbmNlZDtcbiAgICB9XG5cbiAgICBpZiAodGV4dHVyZXMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihNU0dfVEVYVFVSRVNfUEFSQU1fUkVNT1ZFRCk7XG4gICAgfVxuXG4gICAgLy8gVE9ETyAtIHJlbW92ZT9cbiAgICB0aGlzLmJ1ZmZlcnMgPSB7fTtcbiAgICB0aGlzLnVzZXJEYXRhID0ge307XG4gICAgdGhpcy5kcmF3UGFyYW1zID0ge307XG4gICAgdGhpcy5keW5hbWljID0gZmFsc2U7XG4gICAgdGhpcy5uZWVkc1JlZHJhdyA9IHRydWU7XG5cbiAgICB0aGlzLm1hdGVyaWFsID0gbWF0ZXJpYWw7XG5cbiAgICAvLyBBdHRyaWJ1dGVzIGFuZCBidWZmZXJzXG4gICAgdGhpcy5zZXRHZW9tZXRyeShnZW9tZXRyeSk7XG4gICAgdGhpcy5hdHRyaWJ1dGVzID0ge307XG4gICAgdGhpcy5zZXRBdHRyaWJ1dGVzKGF0dHJpYnV0ZXMpO1xuXG4gICAgdGhpcy51bmlmb3JtcyA9IHt9O1xuICAgIHRoaXMuc2V0VW5pZm9ybXMoe1xuICAgICAgLi4udGhpcy5wcm9ncmFtLmRlZmF1bHRVbmlmb3JtcyxcbiAgICAgIC4uLnVuaWZvcm1zXG4gICAgfSk7XG5cbiAgICAvLyBpbnN0YW5jZWQgcmVuZGVyaW5nXG4gICAgdGhpcy5pc0luc3RhbmNlZCA9IGlzSW5zdGFuY2VkO1xuICAgIHRoaXMuaW5zdGFuY2VDb3VudCA9IGluc3RhbmNlQ291bnQ7XG4gICAgdGhpcy52ZXJ0ZXhDb3VudCA9IHZlcnRleENvdW50O1xuXG4gICAgLy8gcGlja2luZyBvcHRpb25zXG4gICAgdGhpcy5waWNrYWJsZSA9IEJvb2xlYW4ocGlja2FibGUpO1xuICAgIHRoaXMucGljayA9IHBpY2sgfHwgKCgpID0+IGZhbHNlKTtcblxuICAgIHRoaXMub25CZWZvcmVSZW5kZXIgPSBvbkJlZm9yZVJlbmRlcjtcbiAgICB0aGlzLm9uQWZ0ZXJSZW5kZXIgPSBvbkFmdGVyUmVuZGVyO1xuICB9XG4gIC8qIGVzbGludC1lbmFibGUgbWF4LXN0YXRlbWVudHMgKi9cbiAgLyogZXNsaW50LWVuYWJsZSBjb21wbGV4aXR5ICovXG5cbiAgZ2V0IGhhc2goKSB7XG4gICAgcmV0dXJuIGAke3RoaXMuaWR9ICR7dGhpcy4kcGlja2luZ0luZGV4fWA7XG4gIH1cblxuICBzZXROZWVkc1JlZHJhdyhyZWRyYXcgPSB0cnVlKSB7XG4gICAgdGhpcy5uZWVkc1JlZHJhdyA9IHJlZHJhdztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldE5lZWRzUmVkcmF3KHtjbGVhclJlZHJhd0ZsYWdzID0gZmFsc2V9ID0ge30pIHtcbiAgICBsZXQgcmVkcmF3ID0gZmFsc2U7XG4gICAgcmVkcmF3ID0gcmVkcmF3IHx8IHRoaXMubmVlZHNSZWRyYXc7XG4gICAgdGhpcy5uZWVkc1JlZHJhdyA9IHRoaXMubmVlZHNSZWRyYXcgJiYgIWNsZWFyUmVkcmF3RmxhZ3M7XG4gICAgcmVkcmF3ID0gcmVkcmF3IHx8IHRoaXMuZ2VvbWV0cnkuZ2V0TmVlZHNSZWRyYXcoe2NsZWFyUmVkcmF3RmxhZ3N9KTtcbiAgICByZXR1cm4gcmVkcmF3O1xuICB9XG5cbiAgc2V0SW5zdGFuY2VDb3VudChpbnN0YW5jZUNvdW50KSB7XG4gICAgYXNzZXJ0KGluc3RhbmNlQ291bnQgIT09IHVuZGVmaW5lZCk7XG4gICAgdGhpcy5pbnN0YW5jZUNvdW50ID0gaW5zdGFuY2VDb3VudDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldEluc3RhbmNlQ291bnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW5zdGFuY2VDb3VudDtcbiAgfVxuXG4gIHNldFZlcnRleENvdW50KHZlcnRleENvdW50KSB7XG4gICAgdGhpcy52ZXJ0ZXhDb3VudCA9IHZlcnRleENvdW50O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZ2V0VmVydGV4Q291bnQoKSB7XG4gICAgcmV0dXJuIHRoaXMudmVydGV4Q291bnQgPT09IHVuZGVmaW5lZCA/XG4gICAgICB0aGlzLmdlb21ldHJ5LmdldFZlcnRleENvdW50KCkgOiB0aGlzLnZlcnRleENvdW50O1xuICB9XG5cbiAgaXNQaWNrYWJsZSgpIHtcbiAgICByZXR1cm4gdGhpcy5waWNrYWJsZTtcbiAgfVxuXG4gIHNldFBpY2thYmxlKHBpY2thYmxlID0gdHJ1ZSkge1xuICAgIHRoaXMucGlja2FibGUgPSBCb29sZWFuKHBpY2thYmxlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldFByb2dyYW0oKSB7XG4gICAgcmV0dXJuIHRoaXMucHJvZ3JhbTtcbiAgfVxuXG4gIGdldEdlb21ldHJ5KCkge1xuICAgIHJldHVybiB0aGlzLmdlb21ldHJ5O1xuICB9XG5cbiAgc2V0R2VvbWV0cnkoZ2VvbWV0cnkpIHtcbiAgICB0aGlzLmdlb21ldHJ5ID0gZ2VvbWV0cnk7XG4gICAgdGhpcy5fY3JlYXRlQnVmZmVyc0Zyb21BdHRyaWJ1dGVEZXNjcmlwdG9ycyh0aGlzLmdlb21ldHJ5LmdldEF0dHJpYnV0ZXMoKSk7XG4gICAgdGhpcy5zZXROZWVkc1JlZHJhdygpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZ2V0QXR0cmlidXRlcygpIHtcbiAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzO1xuICB9XG5cbiAgc2V0QXR0cmlidXRlcyhhdHRyaWJ1dGVzID0ge30pIHtcbiAgICBPYmplY3QuYXNzaWduKHRoaXMuYXR0cmlidXRlcywgYXR0cmlidXRlcyk7XG4gICAgdGhpcy5fY3JlYXRlQnVmZmVyc0Zyb21BdHRyaWJ1dGVEZXNjcmlwdG9ycyhhdHRyaWJ1dGVzKTtcbiAgICB0aGlzLnNldE5lZWRzUmVkcmF3KCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXRVbmlmb3JtcygpIHtcbiAgICByZXR1cm4gdGhpcy51bmlmb3JtcztcbiAgfVxuXG4gIHNldFVuaWZvcm1zKHVuaWZvcm1zID0ge30pIHtcbiAgICBjaGVja1VuaWZvcm1WYWx1ZXModW5pZm9ybXMsIHRoaXMuaWQpO1xuICAgIE9iamVjdC5hc3NpZ24odGhpcy51bmlmb3JtcywgdW5pZm9ybXMpO1xuICAgIHRoaXMuc2V0TmVlZHNSZWRyYXcoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qXG4gICAqIEBwYXJhbSB7Q2FtZXJhfSBvcHQuY2FtZXJhPVxuICAgKiBAcGFyYW0ge0NhbWVyYX0gb3B0LnZpZXdNYXRyaXg9XG4gICAqL1xuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cyAqL1xuICByZW5kZXIodW5pZm9ybXMgPSB7fSkge1xuICAgIC8vIFRPRE8gLSBzcGVjaWFsIHRyZWF0bWVudCBvZiB0aGVzZSBwYXJhbWV0ZXJzIHNob3VsZCBiZSByZW1vdmVkXG4gICAgY29uc3Qge2NhbWVyYSwgdmlld01hdHJpeCwgLi4ub3RoZXJVbmlmb3Jtc30gPSB1bmlmb3JtcztcbiAgICAvLyBDYW1lcmEgZXhwb3NlcyB1bmlmb3JtcyB0aGF0IGNhbiBiZSB1c2VkIGRpcmVjdGx5IGluIHNoYWRlcnNcbiAgICBpZiAoY2FtZXJhKSB7XG4gICAgICB0aGlzLnNldFVuaWZvcm1zKGNhbWVyYS5nZXRVbmlmb3JtcygpKTtcbiAgICB9XG4gICAgaWYgKHZpZXdNYXRyaXgpIHtcbiAgICAgIHRoaXMuc2V0VW5pZm9ybXModGhpcy5nZXRDb29yZGluYXRlVW5pZm9ybXModmlld01hdHJpeCkpO1xuICAgIH1cblxuICAgIGxvZy5sb2coMiwgYD4+PiBSRU5ERVJJTkcgTU9ERUwgJHt0aGlzLmlkfWAsIHRoaXMpO1xuXG4gICAgdGhpcy5zZXRQcm9ncmFtU3RhdGUob3RoZXJVbmlmb3Jtcyk7XG5cbiAgICBjb25zdCBkcmF3UGFyYW1zID0gdGhpcy5kcmF3UGFyYW1zO1xuICAgIGlmIChkcmF3UGFyYW1zLmlzSW5zdGFuY2VkICYmICF0aGlzLmlzSW5zdGFuY2VkKSB7XG4gICAgICBsb2cud2FybigwLCAnRm91bmQgaW5zdGFuY2VkIGF0dHJpYnV0ZXMgb24gbm9uLWluc3RhbmNlZCBtb2RlbCcpO1xuICAgIH1cblxuICAgIHRoaXMub25CZWZvcmVSZW5kZXIoKTtcblxuICAgIHRoaXMuX2xvZ0F0dHJpYnV0ZXNBbmRVbmlmb3JtcygzLCB1bmlmb3Jtcyk7XG5cbiAgICBjb25zdCB7Z2x9ID0gdGhpcy5wcm9ncmFtO1xuICAgIGNvbnN0IHtnZW9tZXRyeSwgaXNJbnN0YW5jZWQsIGluc3RhbmNlQ291bnR9ID0gdGhpcztcbiAgICBjb25zdCB7aXNJbmRleGVkLCBpbmRleFR5cGV9ID0gZHJhd1BhcmFtcztcbiAgICBkcmF3KGdsLCB7XG4gICAgICBkcmF3TW9kZTogZ2VvbWV0cnkuZHJhd01vZGUsXG4gICAgICB2ZXJ0ZXhDb3VudDogdGhpcy5nZXRWZXJ0ZXhDb3VudCgpLFxuICAgICAgaXNJbmRleGVkLFxuICAgICAgaW5kZXhUeXBlLFxuICAgICAgaXNJbnN0YW5jZWQsXG4gICAgICBpbnN0YW5jZUNvdW50XG4gICAgfSk7XG5cbiAgICB0aGlzLm9uQWZ0ZXJSZW5kZXIoKTtcblxuICAgIHRoaXMudW5zZXRQcm9ncmFtU3RhdGUoKTtcblxuICAgIHRoaXMuc2V0TmVlZHNSZWRyYXcoZmFsc2UpO1xuXG4gICAgbG9nLmxvZygyLCBgPDw8IFJFTkRFUklORyBNT0RFTCAke3RoaXMuaWR9IC0gY29tcGxldGVgKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0UHJvZ3JhbVN0YXRlKHVuaWZvcm1zKSB7XG4gICAgY29uc3Qge3Byb2dyYW19ID0gdGhpcztcbiAgICBwcm9ncmFtLnVzZSgpO1xuICAgIHByb2dyYW0uc2V0VW5pZm9ybXMoey4uLnRoaXMudW5pZm9ybXMsIC4uLnVuaWZvcm1zfSk7XG4gICAgdGhpcy5kcmF3UGFyYW1zID0ge307XG4gICAgcHJvZ3JhbS5zZXRCdWZmZXJzKHRoaXMuYnVmZmVycywge2RyYXdQYXJhbXM6IHRoaXMuZHJhd1BhcmFtc30pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdW5zZXRQcm9ncmFtU3RhdGUoKSB7XG4gICAgLy8gRW5zdXJlcyBhbGwgdmVydGV4IGF0dHJpYnV0ZXMgYXJlIGRpc2FibGVkIGFuZCBFTEVNRU5UX0FSUkFZX0JVRkZFUlxuICAgIC8vIGlzIHVuYm91bmRcbiAgICB0aGlzLnByb2dyYW0udW5zZXRCdWZmZXJzKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBNYWtlcyBzdXJlIGJ1ZmZlcnMgYXJlIGNyZWF0ZWQgZm9yIGFsbCBhdHRyaWJ1dGVzXG4gIC8vIGFuZCB0aGF0IHRoZSBwcm9ncmFtIGlzIHVwZGF0ZWQgd2l0aCB0aG9zZSBidWZmZXJzXG4gIC8vIFRPRE8gLSBkbyB3ZSBuZWVkIHRoZSBzZXBhcmF0aW9uIGJldHdlZW4gXCJhdHRyaWJ1dGVzXCIgYW5kIFwiYnVmZmVyc1wiXG4gIC8vIGNvdWxkbid0IGFwcHMganVzdCBjcmVhdGUgYnVmZmVycyBkaXJlY3RseT9cbiAgX2NyZWF0ZUJ1ZmZlcnNGcm9tQXR0cmlidXRlRGVzY3JpcHRvcnMoYXR0cmlidXRlcykge1xuICAgIGNvbnN0IHtwcm9ncmFtOiB7Z2x9fSA9IHRoaXM7XG5cbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZU5hbWUgaW4gYXR0cmlidXRlcykge1xuICAgICAgY29uc3QgYXR0cmlidXRlID0gYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXTtcblxuICAgICAgaWYgKGF0dHJpYnV0ZSBpbnN0YW5jZW9mIEJ1ZmZlcikge1xuICAgICAgICB0aGlzLmJ1ZmZlcnNbYXR0cmlidXRlTmFtZV0gPSBhdHRyaWJ1dGU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBBdXRvY3JlYXRlIGEgYnVmZmVyXG4gICAgICAgIHRoaXMuYnVmZmVyc1thdHRyaWJ1dGVOYW1lXSA9XG4gICAgICAgICAgdGhpcy5idWZmZXJzW2F0dHJpYnV0ZU5hbWVdIHx8IG5ldyBCdWZmZXIoZ2wpO1xuXG4gICAgICAgIGNvbnN0IGJ1ZmZlciA9IHRoaXMuYnVmZmVyc1thdHRyaWJ1dGVOYW1lXTtcbiAgICAgICAgYnVmZmVyLnNldERhdGEoe1xuICAgICAgICAgIC4uLmF0dHJpYnV0ZSxcbiAgICAgICAgICBkYXRhOiBhdHRyaWJ1dGUudmFsdWUsXG4gICAgICAgICAgdGFyZ2V0OiBhdHRyaWJ1dGUuaXNJbmRleGVkID9cbiAgICAgICAgICAgIFdlYkdMLkVMRU1FTlRfQVJSQVlfQlVGRkVSIDogV2ViR0wuQVJSQVlfQlVGRkVSXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgX2xvZ0F0dHJpYnV0ZXNBbmRVbmlmb3Jtcyhwcmlvcml0eSA9IDMsIHVuaWZvcm1zID0ge30pIHtcbiAgICBpZiAobG9nLnByaW9yaXR5ID49IHByaW9yaXR5KSB7XG4gICAgICBjb25zdCBhdHRyaWJ1dGVUYWJsZSA9IHRoaXMuX2dldEF0dHJpYnV0ZXNUYWJsZSh7XG4gICAgICAgIGhlYWRlcjogYEF0dHJpYnV0ZXMgJHt0aGlzLmlkfWAsXG4gICAgICAgIHByb2dyYW06IHRoaXMucHJvZ3JhbSxcbiAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgIC4uLnRoaXMuZ2VvbWV0cnkuYXR0cmlidXRlcyxcbiAgICAgICAgICAuLi50aGlzLmF0dHJpYnV0ZXNcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBsb2cudGFibGUocHJpb3JpdHksIGF0dHJpYnV0ZVRhYmxlKTtcblxuICAgICAgY29uc3Qge3RhYmxlLCB1bnVzZWRUYWJsZSwgdW51c2VkQ291bnR9ID0gZ2V0VW5pZm9ybXNUYWJsZSh7XG4gICAgICAgIGhlYWRlcjogYFVuaWZvcm1zICR7dGhpcy5pZH1gLFxuICAgICAgICBwcm9ncmFtOiB0aGlzLnByb2dyYW0sXG4gICAgICAgIHVuaWZvcm1zOiB7Li4udGhpcy51bmlmb3JtcywgLi4udW5pZm9ybXN9XG4gICAgICB9KTtcbiAgICAgIGxvZy50YWJsZShwcmlvcml0eSwgdGFibGUpO1xuICAgICAgbG9nLmxvZyhwcmlvcml0eSwgYCR7dW51c2VkQ291bnQgfHwgJ05vJ30gdW51c2VkIHVuaWZvcm1zIGAsIHVudXNlZFRhYmxlKTtcbiAgICB9XG4gIH1cblxuICAvLyBUb2RvIG1vdmUgdG8gYXR0cmlidXRlcyBtYW5hZ2VyXG4gIF9nZXRBdHRyaWJ1dGVzVGFibGUoe1xuICAgIGF0dHJpYnV0ZXMsXG4gICAgaGVhZGVyID0gJ0F0dHJpYnV0ZXMnLFxuICAgIGluc3RhbmNlZCxcbiAgICBwcm9ncmFtXG4gIH0gPSB7fSkge1xuICAgIGFzc2VydChwcm9ncmFtKTtcbiAgICBjb25zdCBhdHRyaWJ1dGVMb2NhdGlvbnMgPSBwcm9ncmFtLl9hdHRyaWJ1dGVMb2NhdGlvbnM7XG4gICAgY29uc3QgdGFibGUgPSB7W2hlYWRlcl06IHt9fTtcblxuICAgIC8vIEFkZCB1c2VkIGF0dHJpYnV0ZXNcbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZU5hbWUgaW4gYXR0cmlidXRlTG9jYXRpb25zKSB7XG4gICAgICBjb25zdCBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdO1xuICAgICAgY29uc3QgbG9jYXRpb24gPSBhdHRyaWJ1dGVMb2NhdGlvbnNbYXR0cmlidXRlTmFtZV07XG4gICAgICB0YWJsZVthdHRyaWJ1dGVOYW1lXSA9IHRoaXMuX2dldEF0dHJpYnV0ZUVudHJ5KGF0dHJpYnV0ZSwgbG9jYXRpb24pO1xuICAgIH1cblxuICAgIC8vIEFkZCBhbnkgdW51c2VkIGF0dHJpYnV0ZXNcbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZU5hbWUgaW4gYXR0cmlidXRlcykge1xuICAgICAgY29uc3QgYXR0cmlidXRlID0gYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXTtcbiAgICAgIGlmICghdGFibGVbYXR0cmlidXRlTmFtZV0pIHtcbiAgICAgICAgdGFibGVbYXR0cmlidXRlTmFtZV0gPSB0aGlzLl9nZXRBdHRyaWJ1dGVFbnRyeShhdHRyaWJ1dGUsIG51bGwpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0YWJsZTtcbiAgfVxuXG4gIF9nZXRBdHRyaWJ1dGVFbnRyeShhdHRyaWJ1dGUsIGxvY2F0aW9uKSB7XG4gICAgY29uc3Qgcm91bmQgPSBudW0gPT4gTWF0aC5yb3VuZChudW0gKiAxMCkgLyAxMDtcblxuICAgIGxldCB0eXBlID0gJ05PVCBQUk9WSURFRCc7XG4gICAgbGV0IGluc3RhbmNlZCA9IDA7XG4gICAgbGV0IHNpemUgPSAnTi9BJztcbiAgICBsZXQgdmVydHMgPSAnTi9BJztcbiAgICBsZXQgYnl0ZXMgPSAnTi9BJztcbiAgICBsZXQgdmFsdWUgPSAnTi9BJztcblxuICAgIGlmIChhdHRyaWJ1dGUgJiYgbG9jYXRpb24gPT09IG51bGwpIHtcbiAgICAgIGxvY2F0aW9uID0gYXR0cmlidXRlLmlzSW5kZXhlZCA/ICdFTEVNRU5UX0FSUkFZX0JVRkZFUicgOiAnTk9UIFVTRUQnO1xuICAgIH1cblxuICAgIGlmIChhdHRyaWJ1dGUgaW5zdGFuY2VvZiBCdWZmZXIpIHtcbiAgICAgIGNvbnN0IGJ1ZmZlciA9IGF0dHJpYnV0ZTtcbiAgICAgIHR5cGUgPSBidWZmZXIubGF5b3V0LnR5cGU7XG4gICAgICBpbnN0YW5jZWQgPSBidWZmZXIubGF5b3V0Lmluc3RhbmNlZDtcbiAgICAgIHNpemUgPSBidWZmZXIubGF5b3V0LnNpemU7XG4gICAgICB2ZXJ0cyA9IHJvdW5kKGJ1ZmZlci5kYXRhLmxlbmd0aCAvIGJ1ZmZlci5sYXlvdXQuc2l6ZSk7XG4gICAgICBieXRlcyA9IGJ1ZmZlci5kYXRhLmxlbmd0aCAqIGJ1ZmZlci5kYXRhLkJZVEVTX1BFUl9FTEVNRU5UO1xuICAgIH0gZWxzZSBpZiAoYXR0cmlidXRlKSB7XG4gICAgICB0eXBlID0gYXR0cmlidXRlLnZhbHVlLmNvbnN0cnVjdG9yLm5hbWU7XG4gICAgICBpbnN0YW5jZWQgPSBhdHRyaWJ1dGUuaW5zdGFuY2VkO1xuICAgICAgc2l6ZSA9IGF0dHJpYnV0ZS5zaXplO1xuICAgICAgdmVydHMgPSByb3VuZChhdHRyaWJ1dGUudmFsdWUubGVuZ3RoIC8gYXR0cmlidXRlLnNpemUpO1xuICAgICAgYnl0ZXMgPSBhdHRyaWJ1dGUudmFsdWUubGVuZ3RoICogYXR0cmlidXRlLnZhbHVlLkJZVEVTX1BFUl9FTEVNRU5UO1xuICAgICAgdmFsdWUgPSBhdHRyaWJ1dGUudmFsdWU7XG4gICAgfVxuXG4gICAgLy8gR2VuZXJhdGUgYSB0eXBlIG5hbWUgYnkgZHJvcHBpbmcgQXJyYXkgZnJvbSBGbG9hdDMyQXJyYXkgZXRjLlxuICAgIHR5cGUgPSBTdHJpbmcodHlwZSkucmVwbGFjZSgnQXJyYXknLCAnJyk7XG4gICAgLy8gTG9vayBmb3IgJ250JyB0byBkZXRlY3QgaW50ZWdlciB0eXBlcywgZS5nLiBJbnQzMkFycmF5LCBVaW50MzJBcnJheVxuICAgIGNvbnN0IGlzSW50ZWdlciA9IHR5cGUuaW5kZXhPZignbnQnKSAhPT0gLTE7XG5cbiAgICBsb2NhdGlvbiA9IGAke2xvY2F0aW9ufSR7aW5zdGFuY2VkID8gJyBbaW5zdGFuY2VkXScgOiAnJ31gO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIExvY2F0aW9uOiBsb2NhdGlvbixcbiAgICAgICdUeXBlIFNpemUgeCBWZXJ0cyA9IEJ5dGVzJzogYCR7dHlwZX0gJHtzaXplfSB4ICR7dmVydHN9ID0gJHtieXRlc31gLFxuICAgICAgVmFsdWU6IGZvcm1hdFZhbHVlKHZhbHVlLCB7c2l6ZSwgaXNJbnRlZ2VyfSlcbiAgICB9O1xuICB9XG5cbiAgLy8gREVQUkVDQVRFRCAvIFJFTU9WRURcbiAgc2V0VGV4dHVyZXModGV4dHVyZXMgPSBbXSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICdtb2RlbC5zZXRUZXh0dXJlcyByZXBsYWNlZDogc2V0VW5pZm9ybXMoe3NhbXBsZXIyRDogbmV3IFRleHR1cmUyRH0pJyk7XG4gIH1cbn1cbiJdfQ==