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
    key: 'destroy',
    value: function destroy() {
      // TODO
    }
  }, {
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
  }, {
    key: 'draw',
    value: function draw() {
      var _ref4 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var _ref4$uniforms = _ref4.uniforms;
      var uniforms = _ref4$uniforms === undefined ? {} : _ref4$uniforms;
      var _ref4$attributes = _ref4.attributes;
      var attributes = _ref4$attributes === undefined ? {} : _ref4$attributes;
      var _ref4$settings = _ref4.settings;
      var settings = _ref4$settings === undefined ? {} : _ref4$settings;

      return this.render(uniforms);
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
      var _ref5 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var attributes = _ref5.attributes;
      var _ref5$header = _ref5.header;
      var header = _ref5$header === undefined ? 'Attributes' : _ref5$header;
      var instanced = _ref5.instanced;
      var program = _ref5.program;

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb3JlL21vZGVsLmpzIl0sIm5hbWVzIjpbIk1TR19JTlNUQU5DRURfUEFSQU1fREVQUkVDQVRFRCIsIk1TR19URVhUVVJFU19QQVJBTV9SRU1PVkVEIiwiTWF0ZXJpYWwiLCJzaGluaW5lc3MiLCJyZWZsZWN0aW9uIiwicmVmcmFjdGlvbiIsIk1vZGVsIiwicHJvZ3JhbSIsImdsIiwidnMiLCJmcyIsImdlb21ldHJ5IiwibWF0ZXJpYWwiLCJ0ZXh0dXJlcyIsImlzSW5zdGFuY2VkIiwiaW5zdGFuY2VDb3VudCIsInZlcnRleENvdW50IiwidW5kZWZpbmVkIiwicGlja2FibGUiLCJwaWNrIiwidW5pZm9ybXMiLCJhdHRyaWJ1dGVzIiwicmVuZGVyIiwib25CZWZvcmVSZW5kZXIiLCJvbkFmdGVyUmVuZGVyIiwib3B0cyIsImluc3RhbmNlZCIsImNvbnNvbGUiLCJ3YXJuIiwiRXJyb3IiLCJidWZmZXJzIiwidXNlckRhdGEiLCJkcmF3UGFyYW1zIiwiZHluYW1pYyIsIm5lZWRzUmVkcmF3Iiwic2V0R2VvbWV0cnkiLCJzZXRBdHRyaWJ1dGVzIiwic2V0VW5pZm9ybXMiLCJkZWZhdWx0VW5pZm9ybXMiLCJCb29sZWFuIiwicmVkcmF3IiwiY2xlYXJSZWRyYXdGbGFncyIsImdldE5lZWRzUmVkcmF3IiwiZ2V0VmVydGV4Q291bnQiLCJfY3JlYXRlQnVmZmVyc0Zyb21BdHRyaWJ1dGVEZXNjcmlwdG9ycyIsImdldEF0dHJpYnV0ZXMiLCJzZXROZWVkc1JlZHJhdyIsIk9iamVjdCIsImFzc2lnbiIsImlkIiwic2V0dGluZ3MiLCJjYW1lcmEiLCJ2aWV3TWF0cml4Iiwib3RoZXJVbmlmb3JtcyIsImdldFVuaWZvcm1zIiwiZ2V0Q29vcmRpbmF0ZVVuaWZvcm1zIiwibG9nIiwic2V0UHJvZ3JhbVN0YXRlIiwiX2xvZ0F0dHJpYnV0ZXNBbmRVbmlmb3JtcyIsImlzSW5kZXhlZCIsImluZGV4VHlwZSIsImRyYXdNb2RlIiwidW5zZXRQcm9ncmFtU3RhdGUiLCJ1c2UiLCJzZXRCdWZmZXJzIiwidW5zZXRCdWZmZXJzIiwiYXR0cmlidXRlTmFtZSIsImF0dHJpYnV0ZSIsImJ1ZmZlciIsInNldERhdGEiLCJkYXRhIiwidmFsdWUiLCJ0YXJnZXQiLCJFTEVNRU5UX0FSUkFZX0JVRkZFUiIsIkFSUkFZX0JVRkZFUiIsInByaW9yaXR5IiwiYXR0cmlidXRlVGFibGUiLCJfZ2V0QXR0cmlidXRlc1RhYmxlIiwiaGVhZGVyIiwidGFibGUiLCJ1bnVzZWRUYWJsZSIsInVudXNlZENvdW50IiwiYXR0cmlidXRlTG9jYXRpb25zIiwiX2F0dHJpYnV0ZUxvY2F0aW9ucyIsImxvY2F0aW9uIiwiX2dldEF0dHJpYnV0ZUVudHJ5Iiwicm91bmQiLCJNYXRoIiwibnVtIiwidHlwZSIsInNpemUiLCJ2ZXJ0cyIsImJ5dGVzIiwibGF5b3V0IiwibGVuZ3RoIiwiQllURVNfUEVSX0VMRU1FTlQiLCJjb25zdHJ1Y3RvciIsIm5hbWUiLCJTdHJpbmciLCJyZXBsYWNlIiwiaXNJbnRlZ2VyIiwiaW5kZXhPZiIsIkxvY2F0aW9uIiwiVmFsdWUiLCIkcGlja2luZ0luZGV4Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUlBOztBQUdBOzs7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7Ozs7Ozs7Ozs7Ozs7MEpBVkE7QUFDQTs7QUFFQTs7O0FBU0EsSUFBTUEsNktBQU47O0FBSUEsSUFBTUMsNkJBQ0osbUVBREY7O0FBR0E7O0lBQ2FDLFEsV0FBQUEsUSxHQUNYLG9CQUFrRTtBQUFBLGlGQUFKLEVBQUk7O0FBQUEsNEJBQXJEQyxTQUFxRDtBQUFBLE1BQXJEQSxTQUFxRCxrQ0FBekMsQ0FBeUM7QUFBQSw2QkFBdENDLFVBQXNDO0FBQUEsTUFBdENBLFVBQXNDLG1DQUF6QixDQUF5QjtBQUFBLDZCQUF0QkMsVUFBc0I7QUFBQSxNQUF0QkEsVUFBc0IsbUNBQVQsQ0FBUzs7QUFBQTs7QUFDaEUsT0FBS0YsU0FBTCxHQUFpQkEsU0FBakI7QUFDQSxPQUFLQyxVQUFMLEdBQWtCQSxVQUFsQjtB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QUFPVSxvQkFBUCxFQUFuQjtBQUhGLE9BQVA7QUFLRDs7QUFFRDs7OztrQ0FDMkI7QUFBQSxVQUFmdkYsUUFBZSx1RUFBSixFQUFJOztBQUN6QixZQUFNLElBQUlnQixLQUFKLENBQ0oscUVBREksQ0FBTjtBQUVEOzs7d0JBNVJVO0FBQ1QsYUFBVSxLQUFLb0IsRUFBZixTQUFxQixLQUFLdUQsYUFBMUI7QUFDRDs7Ozs7O2tCQXZGa0JsRyxLIiwiZmlsZSI6Im1vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQSBzY2VuZWdyYXBoIG9iamVjdCBub2RlXG4vKiBlc2xpbnQtZGlzYWJsZSBndWFyZC1mb3ItaW4gKi9cblxuLy8gRGVmaW5lIHNvbWUgbG9jYWxzXG5pbXBvcnQge1xuICBXZWJHTCwgQnVmZmVyLCBQcm9ncmFtLCBkcmF3LCBjaGVja1VuaWZvcm1WYWx1ZXMsIGdldFVuaWZvcm1zVGFibGVcbn0gZnJvbSAnLi4vd2ViZ2wnO1xuaW1wb3J0IE9iamVjdDNEIGZyb20gJy4uL3NjZW5lZ3JhcGgvb2JqZWN0LTNkJztcbmltcG9ydCB7bG9nLCBmb3JtYXRWYWx1ZX0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IEdlb21ldHJ5IGZyb20gJy4vZ2VvbWV0cnknO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG5jb25zdCBNU0dfSU5TVEFOQ0VEX1BBUkFNX0RFUFJFQ0FURUQgPSBgXFxcbldhcm5pbmc6IE1vZGVsIGNvbnN0cnVjdG9yOiBwYXJhbWV0ZXIgXCJpbnN0YW5jZWRcIiByZW5hbWVkIHRvIFwiaXNJbnN0YW5jZWRcIi5cblRoaXMgd2lsbCBiZWNvbWUgYSBoYXJkIGVycm9yIGluIGEgZnV0dXJlIHZlcnNpb24gb2YgbHVtYS5nbC5gO1xuXG5jb25zdCBNU0dfVEVYVFVSRVNfUEFSQU1fUkVNT1ZFRCA9XG4gICdNb2RlbDogcGFyYW1ldGVyIFwidGV4dHVyZXNcIiByZW1vdmVkLiBVc2UgdW5pZm9ybXMgdG8gc2V0IHRleHR1cmVzJztcblxuLy8gVE9ETyAtIGV4cGVyaW1lbnRhbCwgbm90IHlldCB1c2VkXG5leHBvcnQgY2xhc3MgTWF0ZXJpYWwge1xuICBjb25zdHJ1Y3Rvcih7c2hpbmluZXNzID0gMCwgcmVmbGVjdGlvbiA9IDAsIHJlZnJhY3Rpb24gPSAwfSA9IHt9KSB7XG4gICAgdGhpcy5zaGluaW5lc3MgPSBzaGluaW5lc3M7XG4gICAgdGhpcy5yZWZsZWN0aW9uID0gcmVmbGVjdGlvbjtcbiAgICB0aGlzLnJlZnJhY3Rpb24gPSByZWZyYWN0aW9uO1xuICB9XG59XG5cbi8vIE1vZGVsIGFic3RyYWN0IE8zRCBDbGFzc1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTW9kZWwgZXh0ZW5kcyBPYmplY3QzRCB7XG5cbiAgLyogZXNsaW50LWRpc2FibGUgbWF4LXN0YXRlbWVudHMgICovXG4gIC8qIGVzbGludC1kaXNhYmxlIGNvbXBsZXhpdHkgICovXG4gIGNvbnN0cnVjdG9yKHtcbiAgICBwcm9ncmFtLFxuICAgIGdsID0gbnVsbCxcbiAgICB2cyA9IG51bGwsXG4gICAgZnMgPSBudWxsLFxuICAgIGdlb21ldHJ5LFxuICAgIG1hdGVyaWFsID0gbnVsbCxcbiAgICB0ZXh0dXJlcyxcbiAgICAvLyBFbmFibGVzIGluc3RhbmNlZCByZW5kZXJpbmcgKG5lZWRzIHNoYWRlciBzdXBwb3J0IGFuZCBleHRyYSBhdHRyaWJ1dGVzKVxuICAgIGlzSW5zdGFuY2VkID0gZmFsc2UsXG4gICAgaW5zdGFuY2VDb3VudCA9IDAsXG4gICAgdmVydGV4Q291bnQgPSB1bmRlZmluZWQsXG4gICAgLy8gUGlja2luZ1xuICAgIHBpY2thYmxlID0gZmFsc2UsIHBpY2sgPSBudWxsLFxuICAgIC8vIEV4dHJhIHVuaWZvcm1zIGFuZCBhdHRyaWJ1dGVzIChiZXlvbmQgZ2VvbWV0cnksIG1hdGVyaWFsLCBjYW1lcmEpXG4gICAgdW5pZm9ybXMgPSB7fSxcbiAgICBhdHRyaWJ1dGVzID0ge30sXG4gICAgcmVuZGVyID0gbnVsbCxcbiAgICBvbkJlZm9yZVJlbmRlciA9ICgpID0+IHt9LFxuICAgIG9uQWZ0ZXJSZW5kZXIgPSAoKSA9PiB7fSxcbiAgICAuLi5vcHRzXG4gIH0gPSB7fSkge1xuICAgIC8vIGFzc2VydChwcm9ncmFtIHx8IHByb2dyYW0gaW5zdGFuY2VvZiBQcm9ncmFtKTtcbiAgICBhc3NlcnQoZ2VvbWV0cnkgaW5zdGFuY2VvZiBHZW9tZXRyeSwgJ01vZGVsIG5lZWRzIGEgZ2VvbWV0cnknKTtcblxuICAgIHN1cGVyKG9wdHMpO1xuXG4gICAgLy8gc2V0IGEgY3VzdG9tIHByb2dyYW0gcGVyIG8zZFxuICAgIHRoaXMucHJvZ3JhbSA9IHByb2dyYW0gfHwgbmV3IFByb2dyYW0oZ2wsIHt2cywgZnN9KTtcbiAgICBhc3NlcnQodGhpcy5wcm9ncmFtIGluc3RhbmNlb2YgUHJvZ3JhbSwgJ01vZGVsIG5lZWRzIGEgcHJvZ3JhbScpO1xuXG4gICAgaWYgKG9wdHMuaW5zdGFuY2VkKSB7XG4gICAgICAvKiBnbG9iYWwgY29uc29sZSAqL1xuICAgICAgLyogZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSAqL1xuICAgICAgY29uc29sZS53YXJuKE1TR19JTlNUQU5DRURfUEFSQU1fREVQUkVDQVRFRCk7XG4gICAgICBpc0luc3RhbmNlZCA9IGlzSW5zdGFuY2VkIHx8IG9wdHMuaW5zdGFuY2VkO1xuICAgIH1cblxuICAgIGlmICh0ZXh0dXJlcykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKE1TR19URVhUVVJFU19QQVJBTV9SRU1PVkVEKTtcbiAgICB9XG5cbiAgICAvLyBUT0RPIC0gcmVtb3ZlP1xuICAgIHRoaXMuYnVmZmVycyA9IHt9O1xuICAgIHRoaXMudXNlckRhdGEgPSB7fTtcbiAgICB0aGlzLmRyYXdQYXJhbXMgPSB7fTtcbiAgICB0aGlzLmR5bmFtaWMgPSBmYWxzZTtcbiAgICB0aGlzLm5lZWRzUmVkcmF3ID0gdHJ1ZTtcblxuICAgIHRoaXMubWF0ZXJpYWwgPSBtYXRlcmlhbDtcblxuICAgIC8vIEF0dHJpYnV0ZXMgYW5kIGJ1ZmZlcnNcbiAgICB0aGlzLnNldEdlb21ldHJ5KGdlb21ldHJ5KTtcbiAgICB0aGlzLmF0dHJpYnV0ZXMgPSB7fTtcbiAgICB0aGlzLnNldEF0dHJpYnV0ZXMoYXR0cmlidXRlcyk7XG5cbiAgICB0aGlzLnVuaWZvcm1zID0ge307XG4gICAgdGhpcy5zZXRVbmlmb3Jtcyh7XG4gICAgICAuLi50aGlzLnByb2dyYW0uZGVmYXVsdFVuaWZvcm1zLFxuICAgICAgLi4udW5pZm9ybXNcbiAgICB9KTtcblxuICAgIC8vIGluc3RhbmNlZCByZW5kZXJpbmdcbiAgICB0aGlzLmlzSW5zdGFuY2VkID0gaXNJbnN0YW5jZWQ7XG4gICAgdGhpcy5pbnN0YW5jZUNvdW50ID0gaW5zdGFuY2VDb3VudDtcbiAgICB0aGlzLnZlcnRleENvdW50ID0gdmVydGV4Q291bnQ7XG5cbiAgICAvLyBwaWNraW5nIG9wdGlvbnNcbiAgICB0aGlzLnBpY2thYmxlID0gQm9vbGVhbihwaWNrYWJsZSk7XG4gICAgdGhpcy5waWNrID0gcGljayB8fCAoKCkgPT4gZmFsc2UpO1xuXG4gICAgdGhpcy5vbkJlZm9yZVJlbmRlciA9IG9uQmVmb3JlUmVuZGVyO1xuICAgIHRoaXMub25BZnRlclJlbmRlciA9IG9uQWZ0ZXJSZW5kZXI7XG4gIH1cbiAgLyogZXNsaW50LWVuYWJsZSBtYXgtc3RhdGVtZW50cyAqL1xuICAvKiBlc2xpbnQtZW5hYmxlIGNvbXBsZXhpdHkgKi9cblxuICBkZXN0cm95KCkge1xuICAgIC8vIFRPRE9cbiAgfVxuXG4gIGdldCBoYXNoKCkge1xuICAgIHJldHVybiBgJHt0aGlzLmlkfSAke3RoaXMuJHBpY2tpbmdJbmRleH1gO1xuICB9XG5cbiAgc2V0TmVlZHNSZWRyYXcocmVkcmF3ID0gdHJ1ZSkge1xuICAgIHRoaXMubmVlZHNSZWRyYXcgPSByZWRyYXc7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXROZWVkc1JlZHJhdyh7Y2xlYXJSZWRyYXdGbGFncyA9IGZhbHNlfSA9IHt9KSB7XG4gICAgbGV0IHJlZHJhdyA9IGZhbHNlO1xuICAgIHJlZHJhdyA9IHJlZHJhdyB8fCB0aGlzLm5lZWRzUmVkcmF3O1xuICAgIHRoaXMubmVlZHNSZWRyYXcgPSB0aGlzLm5lZWRzUmVkcmF3ICYmICFjbGVhclJlZHJhd0ZsYWdzO1xuICAgIHJlZHJhdyA9IHJlZHJhdyB8fCB0aGlzLmdlb21ldHJ5LmdldE5lZWRzUmVkcmF3KHtjbGVhclJlZHJhd0ZsYWdzfSk7XG4gICAgcmV0dXJuIHJlZHJhdztcbiAgfVxuXG4gIHNldEluc3RhbmNlQ291bnQoaW5zdGFuY2VDb3VudCkge1xuICAgIGFzc2VydChpbnN0YW5jZUNvdW50ICE9PSB1bmRlZmluZWQpO1xuICAgIHRoaXMuaW5zdGFuY2VDb3VudCA9IGluc3RhbmNlQ291bnQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXRJbnN0YW5jZUNvdW50KCkge1xuICAgIHJldHVybiB0aGlzLmluc3RhbmNlQ291bnQ7XG4gIH1cblxuICBzZXRWZXJ0ZXhDb3VudCh2ZXJ0ZXhDb3VudCkge1xuICAgIHRoaXMudmVydGV4Q291bnQgPSB2ZXJ0ZXhDb3VudDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldFZlcnRleENvdW50KCkge1xuICAgIHJldHVybiB0aGlzLnZlcnRleENvdW50ID09PSB1bmRlZmluZWQgP1xuICAgICAgdGhpcy5nZW9tZXRyeS5nZXRWZXJ0ZXhDb3VudCgpIDogdGhpcy52ZXJ0ZXhDb3VudDtcbiAgfVxuXG4gIGlzUGlja2FibGUoKSB7XG4gICAgcmV0dXJuIHRoaXMucGlja2FibGU7XG4gIH1cblxuICBzZXRQaWNrYWJsZShwaWNrYWJsZSA9IHRydWUpIHtcbiAgICB0aGlzLnBpY2thYmxlID0gQm9vbGVhbihwaWNrYWJsZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXRQcm9ncmFtKCkge1xuICAgIHJldHVybiB0aGlzLnByb2dyYW07XG4gIH1cblxuICBnZXRHZW9tZXRyeSgpIHtcbiAgICByZXR1cm4gdGhpcy5nZW9tZXRyeTtcbiAgfVxuXG4gIHNldEdlb21ldHJ5KGdlb21ldHJ5KSB7XG4gICAgdGhpcy5nZW9tZXRyeSA9IGdlb21ldHJ5O1xuICAgIHRoaXMuX2NyZWF0ZUJ1ZmZlcnNGcm9tQXR0cmlidXRlRGVzY3JpcHRvcnModGhpcy5nZW9tZXRyeS5nZXRBdHRyaWJ1dGVzKCkpO1xuICAgIHRoaXMuc2V0TmVlZHNSZWRyYXcoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldEF0dHJpYnV0ZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlcztcbiAgfVxuXG4gIHNldEF0dHJpYnV0ZXMoYXR0cmlidXRlcyA9IHt9KSB7XG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLmF0dHJpYnV0ZXMsIGF0dHJpYnV0ZXMpO1xuICAgIHRoaXMuX2NyZWF0ZUJ1ZmZlcnNGcm9tQXR0cmlidXRlRGVzY3JpcHRvcnMoYXR0cmlidXRlcyk7XG4gICAgdGhpcy5zZXROZWVkc1JlZHJhdygpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZ2V0VW5pZm9ybXMoKSB7XG4gICAgcmV0dXJuIHRoaXMudW5pZm9ybXM7XG4gIH1cblxuICBzZXRVbmlmb3Jtcyh1bmlmb3JtcyA9IHt9KSB7XG4gICAgY2hlY2tVbmlmb3JtVmFsdWVzKHVuaWZvcm1zLCB0aGlzLmlkKTtcbiAgICBPYmplY3QuYXNzaWduKHRoaXMudW5pZm9ybXMsIHVuaWZvcm1zKTtcbiAgICB0aGlzLnNldE5lZWRzUmVkcmF3KCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBkcmF3KHt1bmlmb3JtcyA9IHt9LCBhdHRyaWJ1dGVzID0ge30sIHNldHRpbmdzID0ge319ID0ge30pIHtcbiAgICByZXR1cm4gdGhpcy5yZW5kZXIodW5pZm9ybXMpO1xuICB9XG5cbiAgLypcbiAgICogQHBhcmFtIHtDYW1lcmF9IG9wdC5jYW1lcmE9XG4gICAqIEBwYXJhbSB7Q2FtZXJhfSBvcHQudmlld01hdHJpeD1cbiAgICovXG4gIC8qIGVzbGludC1kaXNhYmxlIG1heC1zdGF0ZW1lbnRzICovXG4gIHJlbmRlcih1bmlmb3JtcyA9IHt9KSB7XG4gICAgLy8gVE9ETyAtIHNwZWNpYWwgdHJlYXRtZW50IG9mIHRoZXNlIHBhcmFtZXRlcnMgc2hvdWxkIGJlIHJlbW92ZWRcbiAgICBjb25zdCB7Y2FtZXJhLCB2aWV3TWF0cml4LCAuLi5vdGhlclVuaWZvcm1zfSA9IHVuaWZvcm1zO1xuICAgIC8vIENhbWVyYSBleHBvc2VzIHVuaWZvcm1zIHRoYXQgY2FuIGJlIHVzZWQgZGlyZWN0bHkgaW4gc2hhZGVyc1xuICAgIGlmIChjYW1lcmEpIHtcbiAgICAgIHRoaXMuc2V0VW5pZm9ybXMoY2FtZXJhLmdldFVuaWZvcm1zKCkpO1xuICAgIH1cbiAgICBpZiAodmlld01hdHJpeCkge1xuICAgICAgdGhpcy5zZXRVbmlmb3Jtcyh0aGlzLmdldENvb3JkaW5hdGVVbmlmb3Jtcyh2aWV3TWF0cml4KSk7XG4gICAgfVxuXG4gICAgbG9nLmxvZygyLCBgPj4+IFJFTkRFUklORyBNT0RFTCAke3RoaXMuaWR9YCwgdGhpcyk7XG5cbiAgICB0aGlzLnNldFByb2dyYW1TdGF0ZShvdGhlclVuaWZvcm1zKTtcblxuICAgIGNvbnN0IGRyYXdQYXJhbXMgPSB0aGlzLmRyYXdQYXJhbXM7XG4gICAgaWYgKGRyYXdQYXJhbXMuaXNJbnN0YW5jZWQgJiYgIXRoaXMuaXNJbnN0YW5jZWQpIHtcbiAgICAgIGxvZy53YXJuKDAsICdGb3VuZCBpbnN0YW5jZWQgYXR0cmlidXRlcyBvbiBub24taW5zdGFuY2VkIG1vZGVsJyk7XG4gICAgfVxuXG4gICAgdGhpcy5vbkJlZm9yZVJlbmRlcigpO1xuXG4gICAgdGhpcy5fbG9nQXR0cmlidXRlc0FuZFVuaWZvcm1zKDMsIHVuaWZvcm1zKTtcblxuICAgIGNvbnN0IHtnbH0gPSB0aGlzLnByb2dyYW07XG4gICAgY29uc3Qge2dlb21ldHJ5LCBpc0luc3RhbmNlZCwgaW5zdGFuY2VDb3VudH0gPSB0aGlzO1xuICAgIGNvbnN0IHtpc0luZGV4ZWQsIGluZGV4VHlwZX0gPSBkcmF3UGFyYW1zO1xuICAgIGRyYXcoZ2wsIHtcbiAgICAgIGRyYXdNb2RlOiBnZW9tZXRyeS5kcmF3TW9kZSxcbiAgICAgIHZlcnRleENvdW50OiB0aGlzLmdldFZlcnRleENvdW50KCksXG4gICAgICBpc0luZGV4ZWQsXG4gICAgICBpbmRleFR5cGUsXG4gICAgICBpc0luc3RhbmNlZCxcbiAgICAgIGluc3RhbmNlQ291bnRcbiAgICB9KTtcblxuICAgIHRoaXMub25BZnRlclJlbmRlcigpO1xuXG4gICAgdGhpcy51bnNldFByb2dyYW1TdGF0ZSgpO1xuXG4gICAgdGhpcy5zZXROZWVkc1JlZHJhdyhmYWxzZSk7XG5cbiAgICBsb2cubG9nKDIsIGA8PDwgUkVOREVSSU5HIE1PREVMICR7dGhpcy5pZH0gLSBjb21wbGV0ZWApO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRQcm9ncmFtU3RhdGUodW5pZm9ybXMpIHtcbiAgICBjb25zdCB7cHJvZ3JhbX0gPSB0aGlzO1xuICAgIHByb2dyYW0udXNlKCk7XG4gICAgcHJvZ3JhbS5zZXRVbmlmb3Jtcyh7Li4udGhpcy51bmlmb3JtcywgLi4udW5pZm9ybXN9KTtcbiAgICB0aGlzLmRyYXdQYXJhbXMgPSB7fTtcbiAgICBwcm9ncmFtLnNldEJ1ZmZlcnModGhpcy5idWZmZXJzLCB7ZHJhd1BhcmFtczogdGhpcy5kcmF3UGFyYW1zfSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB1bnNldFByb2dyYW1TdGF0ZSgpIHtcbiAgICAvLyBFbnN1cmVzIGFsbCB2ZXJ0ZXggYXR0cmlidXRlcyBhcmUgZGlzYWJsZWQgYW5kIEVMRU1FTlRfQVJSQVlfQlVGRkVSXG4gICAgLy8gaXMgdW5ib3VuZFxuICAgIHRoaXMucHJvZ3JhbS51bnNldEJ1ZmZlcnMoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIE1ha2VzIHN1cmUgYnVmZmVycyBhcmUgY3JlYXRlZCBmb3IgYWxsIGF0dHJpYnV0ZXNcbiAgLy8gYW5kIHRoYXQgdGhlIHByb2dyYW0gaXMgdXBkYXRlZCB3aXRoIHRob3NlIGJ1ZmZlcnNcbiAgLy8gVE9ETyAtIGRvIHdlIG5lZWQgdGhlIHNlcGFyYXRpb24gYmV0d2VlbiBcImF0dHJpYnV0ZXNcIiBhbmQgXCJidWZmZXJzXCJcbiAgLy8gY291bGRuJ3QgYXBwcyBqdXN0IGNyZWF0ZSBidWZmZXJzIGRpcmVjdGx5P1xuICBfY3JlYXRlQnVmZmVyc0Zyb21BdHRyaWJ1dGVEZXNjcmlwdG9ycyhhdHRyaWJ1dGVzKSB7XG4gICAgY29uc3Qge3Byb2dyYW06IHtnbH19ID0gdGhpcztcblxuICAgIGZvciAoY29uc3QgYXR0cmlidXRlTmFtZSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICBjb25zdCBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdO1xuXG4gICAgICBpZiAoYXR0cmlidXRlIGluc3RhbmNlb2YgQnVmZmVyKSB7XG4gICAgICAgIHRoaXMuYnVmZmVyc1thdHRyaWJ1dGVOYW1lXSA9IGF0dHJpYnV0ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEF1dG9jcmVhdGUgYSBidWZmZXJcbiAgICAgICAgdGhpcy5idWZmZXJzW2F0dHJpYnV0ZU5hbWVdID1cbiAgICAgICAgICB0aGlzLmJ1ZmZlcnNbYXR0cmlidXRlTmFtZV0gfHwgbmV3IEJ1ZmZlcihnbCk7XG5cbiAgICAgICAgY29uc3QgYnVmZmVyID0gdGhpcy5idWZmZXJzW2F0dHJpYnV0ZU5hbWVdO1xuICAgICAgICBidWZmZXIuc2V0RGF0YSh7XG4gICAgICAgICAgLi4uYXR0cmlidXRlLFxuICAgICAgICAgIGRhdGE6IGF0dHJpYnV0ZS52YWx1ZSxcbiAgICAgICAgICB0YXJnZXQ6IGF0dHJpYnV0ZS5pc0luZGV4ZWQgP1xuICAgICAgICAgICAgV2ViR0wuRUxFTUVOVF9BUlJBWV9CVUZGRVIgOiBXZWJHTC5BUlJBWV9CVUZGRVJcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBfbG9nQXR0cmlidXRlc0FuZFVuaWZvcm1zKHByaW9yaXR5ID0gMywgdW5pZm9ybXMgPSB7fSkge1xuICAgIGlmIChsb2cucHJpb3JpdHkgPj0gcHJpb3JpdHkpIHtcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZVRhYmxlID0gdGhpcy5fZ2V0QXR0cmlidXRlc1RhYmxlKHtcbiAgICAgICAgaGVhZGVyOiBgQXR0cmlidXRlcyAke3RoaXMuaWR9YCxcbiAgICAgICAgcHJvZ3JhbTogdGhpcy5wcm9ncmFtLFxuICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgLi4udGhpcy5nZW9tZXRyeS5hdHRyaWJ1dGVzLFxuICAgICAgICAgIC4uLnRoaXMuYXR0cmlidXRlc1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGxvZy50YWJsZShwcmlvcml0eSwgYXR0cmlidXRlVGFibGUpO1xuXG4gICAgICBjb25zdCB7dGFibGUsIHVudXNlZFRhYmxlLCB1bnVzZWRDb3VudH0gPSBnZXRVbmlmb3Jtc1RhYmxlKHtcbiAgICAgICAgaGVhZGVyOiBgVW5pZm9ybXMgJHt0aGlzLmlkfWAsXG4gICAgICAgIHByb2dyYW06IHRoaXMucHJvZ3JhbSxcbiAgICAgICAgdW5pZm9ybXM6IHsuLi50aGlzLnVuaWZvcm1zLCAuLi51bmlmb3Jtc31cbiAgICAgIH0pO1xuICAgICAgbG9nLnRhYmxlKHByaW9yaXR5LCB0YWJsZSk7XG4gICAgICBsb2cubG9nKHByaW9yaXR5LCBgJHt1bnVzZWRDb3VudCB8fCAnTm8nfSB1bnVzZWQgdW5pZm9ybXMgYCwgdW51c2VkVGFibGUpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFRvZG8gbW92ZSB0byBhdHRyaWJ1dGVzIG1hbmFnZXJcbiAgX2dldEF0dHJpYnV0ZXNUYWJsZSh7XG4gICAgYXR0cmlidXRlcyxcbiAgICBoZWFkZXIgPSAnQXR0cmlidXRlcycsXG4gICAgaW5zdGFuY2VkLFxuICAgIHByb2dyYW1cbiAgfSA9IHt9KSB7XG4gICAgYXNzZXJ0KHByb2dyYW0pO1xuICAgIGNvbnN0IGF0dHJpYnV0ZUxvY2F0aW9ucyA9IHByb2dyYW0uX2F0dHJpYnV0ZUxvY2F0aW9ucztcbiAgICBjb25zdCB0YWJsZSA9IHtbaGVhZGVyXToge319O1xuXG4gICAgLy8gQWRkIHVzZWQgYXR0cmlidXRlc1xuICAgIGZvciAoY29uc3QgYXR0cmlidXRlTmFtZSBpbiBhdHRyaWJ1dGVMb2NhdGlvbnMpIHtcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IGF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV07XG4gICAgICBjb25zdCBsb2NhdGlvbiA9IGF0dHJpYnV0ZUxvY2F0aW9uc1thdHRyaWJ1dGVOYW1lXTtcbiAgICAgIHRhYmxlW2F0dHJpYnV0ZU5hbWVdID0gdGhpcy5fZ2V0QXR0cmlidXRlRW50cnkoYXR0cmlidXRlLCBsb2NhdGlvbik7XG4gICAgfVxuXG4gICAgLy8gQWRkIGFueSB1bnVzZWQgYXR0cmlidXRlc1xuICAgIGZvciAoY29uc3QgYXR0cmlidXRlTmFtZSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICBjb25zdCBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdO1xuICAgICAgaWYgKCF0YWJsZVthdHRyaWJ1dGVOYW1lXSkge1xuICAgICAgICB0YWJsZVthdHRyaWJ1dGVOYW1lXSA9IHRoaXMuX2dldEF0dHJpYnV0ZUVudHJ5KGF0dHJpYnV0ZSwgbnVsbCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRhYmxlO1xuICB9XG5cbiAgX2dldEF0dHJpYnV0ZUVudHJ5KGF0dHJpYnV0ZSwgbG9jYXRpb24pIHtcbiAgICBjb25zdCByb3VuZCA9IG51bSA9PiBNYXRoLnJvdW5kKG51bSAqIDEwKSAvIDEwO1xuXG4gICAgbGV0IHR5cGUgPSAnTk9UIFBST1ZJREVEJztcbiAgICBsZXQgaW5zdGFuY2VkID0gMDtcbiAgICBsZXQgc2l6ZSA9ICdOL0EnO1xuICAgIGxldCB2ZXJ0cyA9ICdOL0EnO1xuICAgIGxldCBieXRlcyA9ICdOL0EnO1xuICAgIGxldCB2YWx1ZSA9ICdOL0EnO1xuXG4gICAgaWYgKGF0dHJpYnV0ZSAmJiBsb2NhdGlvbiA9PT0gbnVsbCkge1xuICAgICAgbG9jYXRpb24gPSBhdHRyaWJ1dGUuaXNJbmRleGVkID8gJ0VMRU1FTlRfQVJSQVlfQlVGRkVSJyA6ICdOT1QgVVNFRCc7XG4gICAgfVxuXG4gICAgaWYgKGF0dHJpYnV0ZSBpbnN0YW5jZW9mIEJ1ZmZlcikge1xuICAgICAgY29uc3QgYnVmZmVyID0gYXR0cmlidXRlO1xuICAgICAgdHlwZSA9IGJ1ZmZlci5sYXlvdXQudHlwZTtcbiAgICAgIGluc3RhbmNlZCA9IGJ1ZmZlci5sYXlvdXQuaW5zdGFuY2VkO1xuICAgICAgc2l6ZSA9IGJ1ZmZlci5sYXlvdXQuc2l6ZTtcbiAgICAgIHZlcnRzID0gcm91bmQoYnVmZmVyLmRhdGEubGVuZ3RoIC8gYnVmZmVyLmxheW91dC5zaXplKTtcbiAgICAgIGJ5dGVzID0gYnVmZmVyLmRhdGEubGVuZ3RoICogYnVmZmVyLmRhdGEuQllURVNfUEVSX0VMRU1FTlQ7XG4gICAgfSBlbHNlIGlmIChhdHRyaWJ1dGUpIHtcbiAgICAgIHR5cGUgPSBhdHRyaWJ1dGUudmFsdWUuY29uc3RydWN0b3IubmFtZTtcbiAgICAgIGluc3RhbmNlZCA9IGF0dHJpYnV0ZS5pbnN0YW5jZWQ7XG4gICAgICBzaXplID0gYXR0cmlidXRlLnNpemU7XG4gICAgICB2ZXJ0cyA9IHJvdW5kKGF0dHJpYnV0ZS52YWx1ZS5sZW5ndGggLyBhdHRyaWJ1dGUuc2l6ZSk7XG4gICAgICBieXRlcyA9IGF0dHJpYnV0ZS52YWx1ZS5sZW5ndGggKiBhdHRyaWJ1dGUudmFsdWUuQllURVNfUEVSX0VMRU1FTlQ7XG4gICAgICB2YWx1ZSA9IGF0dHJpYnV0ZS52YWx1ZTtcbiAgICB9XG5cbiAgICAvLyBHZW5lcmF0ZSBhIHR5cGUgbmFtZSBieSBkcm9wcGluZyBBcnJheSBmcm9tIEZsb2F0MzJBcnJheSBldGMuXG4gICAgdHlwZSA9IFN0cmluZyh0eXBlKS5yZXBsYWNlKCdBcnJheScsICcnKTtcbiAgICAvLyBMb29rIGZvciAnbnQnIHRvIGRldGVjdCBpbnRlZ2VyIHR5cGVzLCBlLmcuIEludDMyQXJyYXksIFVpbnQzMkFycmF5XG4gICAgY29uc3QgaXNJbnRlZ2VyID0gdHlwZS5pbmRleE9mKCdudCcpICE9PSAtMTtcblxuICAgIGxvY2F0aW9uID0gYCR7bG9jYXRpb259JHtpbnN0YW5jZWQgPyAnIFtpbnN0YW5jZWRdJyA6ICcnfWA7XG5cbiAgICByZXR1cm4ge1xuICAgICAgTG9jYXRpb246IGxvY2F0aW9uLFxuICAgICAgJ1R5cGUgU2l6ZSB4IFZlcnRzID0gQnl0ZXMnOiBgJHt0eXBlfSAke3NpemV9IHggJHt2ZXJ0c30gPSAke2J5dGVzfWAsXG4gICAgICBWYWx1ZTogZm9ybWF0VmFsdWUodmFsdWUsIHtzaXplLCBpc0ludGVnZXJ9KVxuICAgIH07XG4gIH1cblxuICAvLyBERVBSRUNBVEVEIC8gUkVNT1ZFRFxuICBzZXRUZXh0dXJlcyh0ZXh0dXJlcyA9IFtdKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgJ21vZGVsLnNldFRleHR1cmVzIHJlcGxhY2VkOiBzZXRVbmlmb3Jtcyh7c2FtcGxlcjJEOiBuZXcgVGV4dHVyZTJEfSknKTtcbiAgfVxufVxuIl19