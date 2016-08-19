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

var _config = require('./config');

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


// TODO - experimental, not yet used
var Material = exports.Material = function Material() {
  var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

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
    var _ref2 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

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
    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Model).call(this, opts));

    _this.program = program || new _webgl.Program(gl, { vs: vs, fs: fs });
    (0, _assert2.default)(_this.program instanceof _webgl.Program, 'Model needs a program');

    if (opts.instanced) {
      console.warn('Warning: ' + 'Model constructor: parameter "instanced" renamed to "isInstanced". ' + 'This will become a hard error in a future version of luma.gl.');
      isInstanced = isInstanced || opts.instanced;
    }

    if (textures) {
      throw new Error('Model constructor: parameter "textures" deprecated. ' + 'Use uniforms to set textures');
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
      var redraw = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

      this.needsRedraw = redraw;
      return this;
    }
  }, {
    key: 'getNeedsRedraw',
    value: function getNeedsRedraw() {
      var _ref3 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

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
      var pickable = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

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
      var attributes = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

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
      var uniforms = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      (0, _webgl.checkUniformValues)(uniforms);
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
      var uniforms = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

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

      _utils.log.log(2, 'Rendering model ' + this.id + ' - setting state', this);

      this.setProgramState(otherUniforms);

      var drawParams = this.drawParams;
      if (drawParams.isInstanced && !this.isInstanced) {
        _utils.log.warn(0, 'Found instanced attributes on non-instanced model');
      }

      this.onBeforeRender();

      _utils.log.log(2, 'Rendering model ' + this.id + ' - calling draw', this);
      this._log(3);

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
    key: '_log',
    value: function _log() {
      var priority = arguments.length <= 0 || arguments[0] === undefined ? 3 : arguments[0];

      if (_utils.log.priority >= priority) {
        var table = this._getAttributesTable({
          header: 'Attributes ' + this.geometry.id,
          program: this.program,
          attributes: _extends({}, this.geometry.attributes, this.attributes)
        });
        _utils.log.table(priority, table);

        table = (0, _webgl.getUniformsTable)({
          header: 'Uniforms ' + this.geometry.id,
          program: this.program,
          uniforms: this.uniforms
        });
        _utils.log.table(priority, table);
      }
    }

    // Todo move to attributes manager

  }, {
    key: '_getAttributesTable',
    value: function _getAttributesTable() {
      var _ref4 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var attributes = _ref4.attributes;
      var _ref4$header = _ref4.header;
      var header = _ref4$header === undefined ? 'Attributes' : _ref4$header;
      var program = _ref4.program;

      (0, _assert2.default)(program);
      var attributeLocations = program._attributeLocations;
      var table = table || _defineProperty({}, header, {});

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

      if (attribute) {
        if (location === null) {
          location = attribute.isIndexed ? 'ELEMENT_ARRAY_BUFFER' : 'NOT USED';
        }

        if (attribute instanceof _webgl.Buffer) {
          var buffer = attribute;
          return {
            Location: location,
            Type: buffer.layout.type,
            Instanced: buffer.layout.instanced,
            Verts: round(buffer.data.length / buffer.layout.size),
            Size: buffer.layout.size,
            Bytes: buffer.data.length * buffer.data.BYTES_PER_ELEMENT
          };
        }

        return {
          Location: location,
          Type: attribute.value.constructor.name,
          Instanced: attribute.instanced,
          Verts: round(attribute.value.length / attribute.size),
          Size: attribute.size,
          Bytes: attribute.value.length * attribute.value.BYTES_PER_ELEMENT
        };
      }
      return {
        Location: location,
        Type: 'NOT PROVIDED',
        Instanced: 'N/A',
        Verts: 'N/A',
        Size: 'N/A',
        Bytes: 'N/A'
      };
    }

    // DEPRECATED / REMOVED

  }, {
    key: 'setTextures',
    value: function setTextures() {
      var textures = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb3JlL21vZGVsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBSUE7O0FBR0E7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUNBOzs7Ozs7Ozs7Ozs7OzswSkFYQTtBQUNBOztBQUVBOzs7QUFVQTtJQUNhLFEsV0FBQSxRLEdBQ1gsb0JBQWtFO0FBQUEsbUVBQUosRUFBSTs7QUFBQSw0QkFBckQsU0FBcUQ7QUFBQSxNQUFyRCxTQUFxRCxrQ0FBekMsQ0FBeUM7QUFBQSw2QkFBdEMsVUFBc0M7QUFBQSxNQUF0QyxVQUFzQyxtQ0FBekIsQ0FBeUI7QUFBQSw2QkFBdEIsVUFBc0I7QUFBQSxNQUF0QixVQUFzQixtQ0FBVCxDQUFTOztBQUFBOztBQUNoRSxPQUFLLFNBQUwsR0FBaUIsU0FBakI7QUFDQSxPQUFLLFVBQUwsR0FBa0IsVUFBbEI7QUFDQSxPQUFLLFVBQUwsR0FBa0IsVUFBbEI7QUFDRCxDOztBQUdIOzs7SUFDcUIsSzs7O0FBRW5CO0FBQ0E7QUFDQSxtQkFxQlE7QUFBQSxzRUFBSixFQUFJOztBQUFBLFFBcEJOLE9Bb0JNLFNBcEJOLE9Bb0JNO0FBQUEseUJBbkJOLEVBbUJNO0FBQUEsUUFuQk4sRUFtQk0sNEJBbkJELElBbUJDO0FBQUEseUJBbEJOLEVBa0JNO0FBQUEsUUFsQk4sRUFrQk0sNEJBbEJELElBa0JDO0FBQUEseUJBakJOLEVBaUJNO0FBQUEsUUFqQk4sRUFpQk0sNEJBakJELElBaUJDO0FBQUEsUUFoQk4sUUFnQk0sU0FoQk4sUUFnQk07QUFBQSwrQkFmTixRQWVNO0FBQUEsUUFmTixRQWVNLGtDQWZLLElBZUw7QUFBQSxRQWROLFFBY00sU0FkTixRQWNNO0FBQUEsa0NBWk4sV0FZTTtBQUFBLFFBWk4sV0FZTSxxQ0FaUSxLQVlSO0FBQUEsb0NBWE4sYUFXTTtBQUFBLFFBWE4sYUFXTSx1Q0FYVSxDQVdWO0FBQUEsa0NBVk4sV0FVTTtBQUFBLFFBVk4sV0FVTSxxQ0FWUSxTQVVSO0FBQUEs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LFVBQWYsUUFBZSx5REFBSixFQUFJOztBQUN6QixZQUFNLElBQUksS0FBSixDQUNKLHFFQURJLENBQU47QUFFRDs7O3dCQWhSVTtBQUNULGFBQU8sS0FBSyxFQUFMLEdBQVUsR0FBVixHQUFnQixLQUFLLGFBQTVCO0FBQ0Q7Ozs7OztrQkFwRmtCLEsiLCJmaWxlIjoibW9kZWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBBIHNjZW5lZ3JhcGggb2JqZWN0IG5vZGVcbi8qIGVzbGludC1kaXNhYmxlIGd1YXJkLWZvci1pbiAqL1xuXG4vLyBEZWZpbmUgc29tZSBsb2NhbHNcbmltcG9ydCB7XG4gIFdlYkdMLCBCdWZmZXIsIFByb2dyYW0sIGRyYXcsIGNoZWNrVW5pZm9ybVZhbHVlcywgZ2V0VW5pZm9ybXNUYWJsZVxufSBmcm9tICcuLi93ZWJnbCc7XG5pbXBvcnQgT2JqZWN0M0QgZnJvbSAnLi4vc2NlbmVncmFwaC9vYmplY3QtM2QnO1xuaW1wb3J0IHtsb2csIHNwbGF0fSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQge01BWF9URVhUVVJFU30gZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0IEdlb21ldHJ5IGZyb20gJy4vZ2VvbWV0cnknO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG4vLyBUT0RPIC0gZXhwZXJpbWVudGFsLCBub3QgeWV0IHVzZWRcbmV4cG9ydCBjbGFzcyBNYXRlcmlhbCB7XG4gIGNvbnN0cnVjdG9yKHtzaGluaW5lc3MgPSAwLCByZWZsZWN0aW9uID0gMCwgcmVmcmFjdGlvbiA9IDB9ID0ge30pIHtcbiAgICB0aGlzLnNoaW5pbmVzcyA9IHNoaW5pbmVzcztcbiAgICB0aGlzLnJlZmxlY3Rpb24gPSByZWZsZWN0aW9uO1xuICAgIHRoaXMucmVmcmFjdGlvbiA9IHJlZnJhY3Rpb247XG4gIH1cbn1cblxuLy8gTW9kZWwgYWJzdHJhY3QgTzNEIENsYXNzXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNb2RlbCBleHRlbmRzIE9iamVjdDNEIHtcblxuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cyAgKi9cbiAgLyogZXNsaW50LWRpc2FibGUgY29tcGxleGl0eSAgKi9cbiAgY29uc3RydWN0b3Ioe1xuICAgIHByb2dyYW0sXG4gICAgZ2wgPSBudWxsLFxuICAgIHZzID0gbnVsbCxcbiAgICBmcyA9IG51bGwsXG4gICAgZ2VvbWV0cnksXG4gICAgbWF0ZXJpYWwgPSBudWxsLFxuICAgIHRleHR1cmVzLFxuICAgIC8vIEVuYWJsZXMgaW5zdGFuY2VkIHJlbmRlcmluZyAobmVlZHMgc2hhZGVyIHN1cHBvcnQgYW5kIGV4dHJhIGF0dHJpYnV0ZXMpXG4gICAgaXNJbnN0YW5jZWQgPSBmYWxzZSxcbiAgICBpbnN0YW5jZUNvdW50ID0gMCxcbiAgICB2ZXJ0ZXhDb3VudCA9IHVuZGVmaW5lZCxcbiAgICAvLyBQaWNraW5nXG4gICAgcGlja2FibGUgPSBmYWxzZSwgcGljayA9IG51bGwsXG4gICAgLy8gRXh0cmEgdW5pZm9ybXMgYW5kIGF0dHJpYnV0ZXMgKGJleW9uZCBnZW9tZXRyeSwgbWF0ZXJpYWwsIGNhbWVyYSlcbiAgICB1bmlmb3JtcyA9IHt9LFxuICAgIGF0dHJpYnV0ZXMgPSB7fSxcbiAgICByZW5kZXIgPSBudWxsLFxuICAgIG9uQmVmb3JlUmVuZGVyID0gKCkgPT4ge30sXG4gICAgb25BZnRlclJlbmRlciA9ICgpID0+IHt9LFxuICAgIC4uLm9wdHNcbiAgfSA9IHt9KSB7XG4gICAgLy8gYXNzZXJ0KHByb2dyYW0gfHwgcHJvZ3JhbSBpbnN0YW5jZW9mIFByb2dyYW0pO1xuICAgIGFzc2VydChnZW9tZXRyeSBpbnN0YW5jZW9mIEdlb21ldHJ5LCAnTW9kZWwgbmVlZHMgYSBnZW9tZXRyeScpO1xuXG4gICAgc3VwZXIob3B0cyk7XG5cbiAgICAvLyBzZXQgYSBjdXN0b20gcHJvZ3JhbSBwZXIgbzNkXG4gICAgdGhpcy5wcm9ncmFtID0gcHJvZ3JhbSB8fCBuZXcgUHJvZ3JhbShnbCwge3ZzLCBmc30pO1xuICAgIGFzc2VydCh0aGlzLnByb2dyYW0gaW5zdGFuY2VvZiBQcm9ncmFtLCAnTW9kZWwgbmVlZHMgYSBwcm9ncmFtJyk7XG5cbiAgICBpZiAob3B0cy5pbnN0YW5jZWQpIHtcbiAgICAgIGNvbnNvbGUud2FybihgV2FybmluZzogYCArXG4gICAgICAgIGBNb2RlbCBjb25zdHJ1Y3RvcjogcGFyYW1ldGVyIFwiaW5zdGFuY2VkXCIgcmVuYW1lZCB0byBcImlzSW5zdGFuY2VkXCIuIGAgK1xuICAgICAgICBgVGhpcyB3aWxsIGJlY29tZSBhIGhhcmQgZXJyb3IgaW4gYSBmdXR1cmUgdmVyc2lvbiBvZiBsdW1hLmdsLmApO1xuICAgICAgaXNJbnN0YW5jZWQgPSBpc0luc3RhbmNlZCB8fCBvcHRzLmluc3RhbmNlZDtcbiAgICB9XG5cbiAgICBpZiAodGV4dHVyZXMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgTW9kZWwgY29uc3RydWN0b3I6IHBhcmFtZXRlciBcInRleHR1cmVzXCIgZGVwcmVjYXRlZC4gYCArXG4gICAgICAgIGBVc2UgdW5pZm9ybXMgdG8gc2V0IHRleHR1cmVzYCk7XG4gICAgfVxuXG4gICAgLy8gVE9ETyAtIHJlbW92ZT9cbiAgICB0aGlzLmJ1ZmZlcnMgPSB7fTtcbiAgICB0aGlzLnVzZXJEYXRhID0ge307XG4gICAgdGhpcy5kcmF3UGFyYW1zID0ge307XG4gICAgdGhpcy5keW5hbWljID0gZmFsc2U7XG4gICAgdGhpcy5uZWVkc1JlZHJhdyA9IHRydWU7XG5cbiAgICB0aGlzLm1hdGVyaWFsID0gbWF0ZXJpYWw7XG5cbiAgICAvLyBBdHRyaWJ1dGVzIGFuZCBidWZmZXJzXG4gICAgdGhpcy5zZXRHZW9tZXRyeShnZW9tZXRyeSk7XG4gICAgdGhpcy5hdHRyaWJ1dGVzID0ge307XG4gICAgdGhpcy5zZXRBdHRyaWJ1dGVzKGF0dHJpYnV0ZXMpO1xuXG4gICAgdGhpcy51bmlmb3JtcyA9IHt9O1xuICAgIHRoaXMuc2V0VW5pZm9ybXMoe1xuICAgICAgLi4udGhpcy5wcm9ncmFtLmRlZmF1bHRVbmlmb3JtcyxcbiAgICAgIC4uLnVuaWZvcm1zXG4gICAgfSk7XG5cbiAgICAvLyBpbnN0YW5jZWQgcmVuZGVyaW5nXG4gICAgdGhpcy5pc0luc3RhbmNlZCA9IGlzSW5zdGFuY2VkO1xuICAgIHRoaXMuaW5zdGFuY2VDb3VudCA9IGluc3RhbmNlQ291bnQ7XG4gICAgdGhpcy52ZXJ0ZXhDb3VudCA9IHZlcnRleENvdW50O1xuXG4gICAgLy8gcGlja2luZyBvcHRpb25zXG4gICAgdGhpcy5waWNrYWJsZSA9IEJvb2xlYW4ocGlja2FibGUpO1xuICAgIHRoaXMucGljayA9IHBpY2sgfHwgKCgpID0+IGZhbHNlKTtcblxuICAgIHRoaXMub25CZWZvcmVSZW5kZXIgPSBvbkJlZm9yZVJlbmRlcjtcbiAgICB0aGlzLm9uQWZ0ZXJSZW5kZXIgPSBvbkFmdGVyUmVuZGVyO1xuICB9XG4gIC8qIGVzbGludC1lbmFibGUgbWF4LXN0YXRlbWVudHMgKi9cbiAgLyogZXNsaW50LWVuYWJsZSBjb21wbGV4aXR5ICovXG5cbiAgZ2V0IGhhc2goKSB7XG4gICAgcmV0dXJuIHRoaXMuaWQgKyAnICcgKyB0aGlzLiRwaWNraW5nSW5kZXg7XG4gIH1cblxuICBzZXROZWVkc1JlZHJhdyhyZWRyYXcgPSB0cnVlKSB7XG4gICAgdGhpcy5uZWVkc1JlZHJhdyA9IHJlZHJhdztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldE5lZWRzUmVkcmF3KHtjbGVhclJlZHJhd0ZsYWdzID0gZmFsc2V9ID0ge30pIHtcbiAgICBsZXQgcmVkcmF3ID0gZmFsc2U7XG4gICAgcmVkcmF3ID0gcmVkcmF3IHx8IHRoaXMubmVlZHNSZWRyYXc7XG4gICAgdGhpcy5uZWVkc1JlZHJhdyA9IHRoaXMubmVlZHNSZWRyYXcgJiYgIWNsZWFyUmVkcmF3RmxhZ3M7XG4gICAgcmVkcmF3ID0gcmVkcmF3IHx8IHRoaXMuZ2VvbWV0cnkuZ2V0TmVlZHNSZWRyYXcoe2NsZWFyUmVkcmF3RmxhZ3N9KTtcbiAgICByZXR1cm4gcmVkcmF3O1xuICB9XG5cbiAgc2V0SW5zdGFuY2VDb3VudChpbnN0YW5jZUNvdW50KSB7XG4gICAgYXNzZXJ0KGluc3RhbmNlQ291bnQgIT09IHVuZGVmaW5lZCk7XG4gICAgdGhpcy5pbnN0YW5jZUNvdW50ID0gaW5zdGFuY2VDb3VudDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldEluc3RhbmNlQ291bnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW5zdGFuY2VDb3VudDtcbiAgfVxuXG4gIHNldFZlcnRleENvdW50KHZlcnRleENvdW50KSB7XG4gICAgdGhpcy52ZXJ0ZXhDb3VudCA9IHZlcnRleENvdW50O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZ2V0VmVydGV4Q291bnQoKSB7XG4gICAgcmV0dXJuIHRoaXMudmVydGV4Q291bnQgPT09IHVuZGVmaW5lZCA/XG4gICAgICB0aGlzLmdlb21ldHJ5LmdldFZlcnRleENvdW50KCkgOiB0aGlzLnZlcnRleENvdW50O1xuICB9XG5cbiAgaXNQaWNrYWJsZSgpIHtcbiAgICByZXR1cm4gdGhpcy5waWNrYWJsZTtcbiAgfVxuXG4gIHNldFBpY2thYmxlKHBpY2thYmxlID0gdHJ1ZSkge1xuICAgIHRoaXMucGlja2FibGUgPSBCb29sZWFuKHBpY2thYmxlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldFByb2dyYW0oKSB7XG4gICAgcmV0dXJuIHRoaXMucHJvZ3JhbTtcbiAgfVxuXG4gIGdldEdlb21ldHJ5KCkge1xuICAgIHJldHVybiB0aGlzLmdlb21ldHJ5O1xuICB9XG5cbiAgc2V0R2VvbWV0cnkoZ2VvbWV0cnkpIHtcbiAgICB0aGlzLmdlb21ldHJ5ID0gZ2VvbWV0cnk7XG4gICAgdGhpcy5fY3JlYXRlQnVmZmVyc0Zyb21BdHRyaWJ1dGVEZXNjcmlwdG9ycyh0aGlzLmdlb21ldHJ5LmdldEF0dHJpYnV0ZXMoKSk7XG4gICAgdGhpcy5zZXROZWVkc1JlZHJhdygpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZ2V0QXR0cmlidXRlcygpIHtcbiAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzO1xuICB9XG5cbiAgc2V0QXR0cmlidXRlcyhhdHRyaWJ1dGVzID0ge30pIHtcbiAgICBPYmplY3QuYXNzaWduKHRoaXMuYXR0cmlidXRlcywgYXR0cmlidXRlcyk7XG4gICAgdGhpcy5fY3JlYXRlQnVmZmVyc0Zyb21BdHRyaWJ1dGVEZXNjcmlwdG9ycyhhdHRyaWJ1dGVzKTtcbiAgICB0aGlzLnNldE5lZWRzUmVkcmF3KCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXRVbmlmb3JtcygpIHtcbiAgICByZXR1cm4gdGhpcy51bmlmb3JtcztcbiAgfVxuXG4gIHNldFVuaWZvcm1zKHVuaWZvcm1zID0ge30pIHtcbiAgICBjaGVja1VuaWZvcm1WYWx1ZXModW5pZm9ybXMpO1xuICAgIE9iamVjdC5hc3NpZ24odGhpcy51bmlmb3JtcywgdW5pZm9ybXMpO1xuICAgIHRoaXMuc2V0TmVlZHNSZWRyYXcoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qXG4gICAqIEBwYXJhbSB7Q2FtZXJhfSBvcHQuY2FtZXJhPVxuICAgKiBAcGFyYW0ge0NhbWVyYX0gb3B0LnZpZXdNYXRyaXg9XG4gICAqL1xuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cyAqL1xuICByZW5kZXIodW5pZm9ybXMgPSB7fSkge1xuICAgIC8vIFRPRE8gLSBzcGVjaWFsIHRyZWF0bWVudCBvZiB0aGVzZSBwYXJhbWV0ZXJzIHNob3VsZCBiZSByZW1vdmVkXG4gICAgY29uc3Qge2NhbWVyYSwgdmlld01hdHJpeCwgLi4ub3RoZXJVbmlmb3Jtc30gPSB1bmlmb3JtcztcbiAgICAvLyBDYW1lcmEgZXhwb3NlcyB1bmlmb3JtcyB0aGF0IGNhbiBiZSB1c2VkIGRpcmVjdGx5IGluIHNoYWRlcnNcbiAgICBpZiAoY2FtZXJhKSB7XG4gICAgICB0aGlzLnNldFVuaWZvcm1zKGNhbWVyYS5nZXRVbmlmb3JtcygpKTtcbiAgICB9XG4gICAgaWYgKHZpZXdNYXRyaXgpIHtcbiAgICAgIHRoaXMuc2V0VW5pZm9ybXModGhpcy5nZXRDb29yZGluYXRlVW5pZm9ybXModmlld01hdHJpeCkpO1xuICAgIH1cblxuICAgIGxvZy5sb2coMiwgYFJlbmRlcmluZyBtb2RlbCAke3RoaXMuaWR9IC0gc2V0dGluZyBzdGF0ZWAsIHRoaXMpO1xuXG4gICAgdGhpcy5zZXRQcm9ncmFtU3RhdGUob3RoZXJVbmlmb3Jtcyk7XG5cbiAgICBjb25zdCBkcmF3UGFyYW1zID0gdGhpcy5kcmF3UGFyYW1zO1xuICAgIGlmIChkcmF3UGFyYW1zLmlzSW5zdGFuY2VkICYmICF0aGlzLmlzSW5zdGFuY2VkKSB7XG4gICAgICBsb2cud2FybigwLCAnRm91bmQgaW5zdGFuY2VkIGF0dHJpYnV0ZXMgb24gbm9uLWluc3RhbmNlZCBtb2RlbCcpO1xuICAgIH1cblxuICAgIHRoaXMub25CZWZvcmVSZW5kZXIoKTtcblxuICAgIGxvZy5sb2coMiwgYFJlbmRlcmluZyBtb2RlbCAke3RoaXMuaWR9IC0gY2FsbGluZyBkcmF3YCwgdGhpcyk7XG4gICAgdGhpcy5fbG9nKDMpO1xuXG4gICAgY29uc3Qge2dsfSA9IHRoaXMucHJvZ3JhbTtcbiAgICBjb25zdCB7Z2VvbWV0cnksIGlzSW5zdGFuY2VkLCBpbnN0YW5jZUNvdW50fSA9IHRoaXM7XG4gICAgY29uc3Qge2lzSW5kZXhlZCwgaW5kZXhUeXBlfSA9IGRyYXdQYXJhbXM7XG4gICAgZHJhdyhnbCwge1xuICAgICAgZHJhd01vZGU6IGdlb21ldHJ5LmRyYXdNb2RlLFxuICAgICAgdmVydGV4Q291bnQ6IHRoaXMuZ2V0VmVydGV4Q291bnQoKSxcbiAgICAgIGlzSW5kZXhlZDogaXNJbmRleGVkLFxuICAgICAgaW5kZXhUeXBlOiBpbmRleFR5cGUsXG4gICAgICBpc0luc3RhbmNlZCxcbiAgICAgIGluc3RhbmNlQ291bnRcbiAgICB9KTtcblxuICAgIHRoaXMub25BZnRlclJlbmRlcigpO1xuXG4gICAgdGhpcy51bnNldFByb2dyYW1TdGF0ZSgpO1xuXG4gICAgdGhpcy5zZXROZWVkc1JlZHJhdyhmYWxzZSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFByb2dyYW1TdGF0ZSh1bmlmb3Jtcykge1xuICAgIGNvbnN0IHtwcm9ncmFtfSA9IHRoaXM7XG4gICAgcHJvZ3JhbS51c2UoKTtcbiAgICBwcm9ncmFtLnNldFVuaWZvcm1zKHsuLi50aGlzLnVuaWZvcm1zLCAuLi51bmlmb3Jtc30pO1xuICAgIHRoaXMuZHJhd1BhcmFtcyA9IHt9O1xuICAgIHByb2dyYW0uc2V0QnVmZmVycyh0aGlzLmJ1ZmZlcnMsIHtkcmF3UGFyYW1zOiB0aGlzLmRyYXdQYXJhbXN9KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHVuc2V0UHJvZ3JhbVN0YXRlKCkge1xuICAgIC8vIEVuc3VyZXMgYWxsIHZlcnRleCBhdHRyaWJ1dGVzIGFyZSBkaXNhYmxlZCBhbmQgRUxFTUVOVF9BUlJBWV9CVUZGRVJcbiAgICAvLyBpcyB1bmJvdW5kXG4gICAgdGhpcy5wcm9ncmFtLnVuc2V0QnVmZmVycygpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gTWFrZXMgc3VyZSBidWZmZXJzIGFyZSBjcmVhdGVkIGZvciBhbGwgYXR0cmlidXRlc1xuICAvLyBhbmQgdGhhdCB0aGUgcHJvZ3JhbSBpcyB1cGRhdGVkIHdpdGggdGhvc2UgYnVmZmVyc1xuICAvLyBUT0RPIC0gZG8gd2UgbmVlZCB0aGUgc2VwYXJhdGlvbiBiZXR3ZWVuIFwiYXR0cmlidXRlc1wiIGFuZCBcImJ1ZmZlcnNcIlxuICAvLyBjb3VsZG4ndCBhcHBzIGp1c3QgY3JlYXRlIGJ1ZmZlcnMgZGlyZWN0bHk/XG4gIF9jcmVhdGVCdWZmZXJzRnJvbUF0dHJpYnV0ZURlc2NyaXB0b3JzKGF0dHJpYnV0ZXMpIHtcbiAgICBjb25zdCB7cHJvZ3JhbToge2dsfX0gPSB0aGlzO1xuXG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGVOYW1lIGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IGF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV07XG5cbiAgICAgIGlmIChhdHRyaWJ1dGUgaW5zdGFuY2VvZiBCdWZmZXIpIHtcbiAgICAgICAgdGhpcy5idWZmZXJzW2F0dHJpYnV0ZU5hbWVdID0gYXR0cmlidXRlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gQXV0b2NyZWF0ZSBhIGJ1ZmZlclxuICAgICAgICB0aGlzLmJ1ZmZlcnNbYXR0cmlidXRlTmFtZV0gPVxuICAgICAgICAgIHRoaXMuYnVmZmVyc1thdHRyaWJ1dGVOYW1lXSB8fCBuZXcgQnVmZmVyKGdsKTtcblxuICAgICAgICBjb25zdCBidWZmZXIgPSB0aGlzLmJ1ZmZlcnNbYXR0cmlidXRlTmFtZV07XG4gICAgICAgIGJ1ZmZlci5zZXREYXRhKHtcbiAgICAgICAgICAuLi5hdHRyaWJ1dGUsXG4gICAgICAgICAgZGF0YTogYXR0cmlidXRlLnZhbHVlLFxuICAgICAgICAgIHRhcmdldDogYXR0cmlidXRlLmlzSW5kZXhlZCA/XG4gICAgICAgICAgICBXZWJHTC5FTEVNRU5UX0FSUkFZX0JVRkZFUiA6IFdlYkdMLkFSUkFZX0JVRkZFUlxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIF9sb2cocHJpb3JpdHkgPSAzKSB7XG4gICAgaWYgKGxvZy5wcmlvcml0eSA+PSBwcmlvcml0eSkge1xuICAgICAgbGV0IHRhYmxlID0gdGhpcy5fZ2V0QXR0cmlidXRlc1RhYmxlKHtcbiAgICAgICAgaGVhZGVyOiBgQXR0cmlidXRlcyAke3RoaXMuZ2VvbWV0cnkuaWR9YCxcbiAgICAgICAgcHJvZ3JhbTogdGhpcy5wcm9ncmFtLFxuICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgLi4udGhpcy5nZW9tZXRyeS5hdHRyaWJ1dGVzLFxuICAgICAgICAgIC4uLnRoaXMuYXR0cmlidXRlc1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGxvZy50YWJsZShwcmlvcml0eSwgdGFibGUpO1xuXG4gICAgICB0YWJsZSA9IGdldFVuaWZvcm1zVGFibGUoe1xuICAgICAgICBoZWFkZXI6IGBVbmlmb3JtcyAke3RoaXMuZ2VvbWV0cnkuaWR9YCxcbiAgICAgICAgcHJvZ3JhbTogdGhpcy5wcm9ncmFtLFxuICAgICAgICB1bmlmb3JtczogdGhpcy51bmlmb3Jtc1xuICAgICAgfSk7XG4gICAgICBsb2cudGFibGUocHJpb3JpdHksIHRhYmxlKTtcbiAgICB9XG4gIH1cblxuICAvLyBUb2RvIG1vdmUgdG8gYXR0cmlidXRlcyBtYW5hZ2VyXG4gIF9nZXRBdHRyaWJ1dGVzVGFibGUoe1xuICAgIGF0dHJpYnV0ZXMsXG4gICAgaGVhZGVyID0gJ0F0dHJpYnV0ZXMnLFxuICAgIHByb2dyYW1cbiAgfSA9IHt9KSB7XG4gICAgYXNzZXJ0KHByb2dyYW0pO1xuICAgIGNvbnN0IGF0dHJpYnV0ZUxvY2F0aW9ucyA9IHByb2dyYW0uX2F0dHJpYnV0ZUxvY2F0aW9ucztcbiAgICBjb25zdCB0YWJsZSA9IHRhYmxlIHx8IHtbaGVhZGVyXToge319O1xuXG4gICAgLy8gQWRkIHVzZWQgYXR0cmlidXRlc1xuICAgIGZvciAoY29uc3QgYXR0cmlidXRlTmFtZSBpbiBhdHRyaWJ1dGVMb2NhdGlvbnMpIHtcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IGF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV07XG4gICAgICBjb25zdCBsb2NhdGlvbiA9IGF0dHJpYnV0ZUxvY2F0aW9uc1thdHRyaWJ1dGVOYW1lXTtcbiAgICAgIHRhYmxlW2F0dHJpYnV0ZU5hbWVdID0gdGhpcy5fZ2V0QXR0cmlidXRlRW50cnkoYXR0cmlidXRlLCBsb2NhdGlvbik7XG4gICAgfVxuXG4gICAgLy8gQWRkIGFueSB1bnVzZWQgYXR0cmlidXRlc1xuICAgIGZvciAoY29uc3QgYXR0cmlidXRlTmFtZSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICBjb25zdCBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdO1xuICAgICAgaWYgKCF0YWJsZVthdHRyaWJ1dGVOYW1lXSkge1xuICAgICAgICB0YWJsZVthdHRyaWJ1dGVOYW1lXSA9IHRoaXMuX2dldEF0dHJpYnV0ZUVudHJ5KGF0dHJpYnV0ZSwgbnVsbCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRhYmxlO1xuICB9XG5cbiAgX2dldEF0dHJpYnV0ZUVudHJ5KGF0dHJpYnV0ZSwgbG9jYXRpb24pIHtcbiAgICBjb25zdCByb3VuZCA9IG51bSA9PiBNYXRoLnJvdW5kKG51bSAqIDEwKSAvIDEwO1xuXG4gICAgaWYgKGF0dHJpYnV0ZSkge1xuICAgICAgaWYgKGxvY2F0aW9uID09PSBudWxsKSB7XG4gICAgICAgIGxvY2F0aW9uID0gYXR0cmlidXRlLmlzSW5kZXhlZCA/ICdFTEVNRU5UX0FSUkFZX0JVRkZFUicgOiAnTk9UIFVTRUQnO1xuICAgICAgfVxuXG4gICAgICBpZiAoYXR0cmlidXRlIGluc3RhbmNlb2YgQnVmZmVyKSB7XG4gICAgICAgIGNvbnN0IGJ1ZmZlciA9IGF0dHJpYnV0ZTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBMb2NhdGlvbjogbG9jYXRpb24sXG4gICAgICAgICAgVHlwZTogYnVmZmVyLmxheW91dC50eXBlLFxuICAgICAgICAgIEluc3RhbmNlZDogYnVmZmVyLmxheW91dC5pbnN0YW5jZWQsXG4gICAgICAgICAgVmVydHM6IHJvdW5kKGJ1ZmZlci5kYXRhLmxlbmd0aCAvIGJ1ZmZlci5sYXlvdXQuc2l6ZSksXG4gICAgICAgICAgU2l6ZTogYnVmZmVyLmxheW91dC5zaXplLFxuICAgICAgICAgIEJ5dGVzOiBidWZmZXIuZGF0YS5sZW5ndGggKiBidWZmZXIuZGF0YS5CWVRFU19QRVJfRUxFTUVOVFxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBMb2NhdGlvbjogbG9jYXRpb24sXG4gICAgICAgIFR5cGU6IGF0dHJpYnV0ZS52YWx1ZS5jb25zdHJ1Y3Rvci5uYW1lLFxuICAgICAgICBJbnN0YW5jZWQ6IGF0dHJpYnV0ZS5pbnN0YW5jZWQsXG4gICAgICAgIFZlcnRzOiByb3VuZChhdHRyaWJ1dGUudmFsdWUubGVuZ3RoIC8gYXR0cmlidXRlLnNpemUpLFxuICAgICAgICBTaXplOiBhdHRyaWJ1dGUuc2l6ZSxcbiAgICAgICAgQnl0ZXM6IGF0dHJpYnV0ZS52YWx1ZS5sZW5ndGggKiBhdHRyaWJ1dGUudmFsdWUuQllURVNfUEVSX0VMRU1FTlRcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICBMb2NhdGlvbjogbG9jYXRpb24sXG4gICAgICBUeXBlOiAnTk9UIFBST1ZJREVEJyxcbiAgICAgIEluc3RhbmNlZDogJ04vQScsXG4gICAgICBWZXJ0czogJ04vQScsXG4gICAgICBTaXplOiAnTi9BJyxcbiAgICAgIEJ5dGVzOiAnTi9BJ1xuICAgIH07XG4gIH1cblxuICAvLyBERVBSRUNBVEVEIC8gUkVNT1ZFRFxuICBzZXRUZXh0dXJlcyh0ZXh0dXJlcyA9IFtdKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgJ21vZGVsLnNldFRleHR1cmVzIHJlcGxhY2VkOiBzZXRVbmlmb3Jtcyh7c2FtcGxlcjJEOiBuZXcgVGV4dHVyZTJEfSknKTtcbiAgfVxufVxuIl19