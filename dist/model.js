'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Material = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _config = require('./config');

var _webgl = require('./webgl');

var _object3d = require('./scenegraph/object-3d');

var _object3d2 = _interopRequireDefault(_object3d);

var _geometry = require('./geometry');

var _geometry2 = _interopRequireDefault(_geometry);

var _utils = require('./utils');

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
    var geometry = _ref2.geometry;
    var _ref2$material = _ref2.material;
    var material = _ref2$material === undefined ? null : _ref2$material;
    var textures = _ref2.textures;
    var _ref2$isInstanced = _ref2.isInstanced;
    var
    // Enables instanced rendering (needs shader support and extra attributes)
    isInstanced = _ref2$isInstanced === undefined ? false : _ref2$isInstanced;
    var _ref2$instanceCount = _ref2.instanceCount;
    var instanceCount = _ref2$instanceCount === undefined ? 0 : _ref2$instanceCount;
    var _ref2$vertexCount = _ref2.vertexCount;
    var vertexCount = _ref2$vertexCount === undefined ? undefined : _ref2$vertexCount;
    var _ref2$pickable = _ref2.pickable;
    var
    // Picking
    pickable = _ref2$pickable === undefined ? false : _ref2$pickable;
    var _ref2$pick = _ref2.pick;
    var pick = _ref2$pick === undefined ? null : _ref2$pick;
    var _ref2$uniforms = _ref2.uniforms;
    var
    // Extra uniforms and attributes (beyond geometry, material, camera)
    uniforms = _ref2$uniforms === undefined ? {} : _ref2$uniforms;
    var _ref2$attributes = _ref2.attributes;
    var attributes = _ref2$attributes === undefined ? {} : _ref2$attributes;
    var _ref2$render = _ref2.render;
    var render = _ref2$render === undefined ? null : _ref2$render;
    var _ref2$onBeforeRender = _ref2.onBeforeRender;
    var onBeforeRender = _ref2$onBeforeRender === undefined ? function () {} : _ref2$onBeforeRender;
    var _ref2$onAfterRender = _ref2.onAfterRender;
    var onAfterRender = _ref2$onAfterRender === undefined ? function () {} : _ref2$onAfterRender;

    var opts = _objectWithoutProperties(_ref2, ['program', 'geometry', 'material', 'textures', 'isInstanced', 'instanceCount', 'vertexCount', 'pickable', 'pick', 'uniforms', 'attributes', 'render', 'onBeforeRender', 'onAfterRender']);

    _classCallCheck(this, Model);

    // assert(program || program instanceof Program);
    (0, _assert2.default)(program instanceof _webgl.Program, 'Model needs a program');
    (0, _assert2.default)(geometry instanceof _geometry2.default, 'Model needs a geometry');

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Model).call(this, opts));

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

    // set a custom program per o3d
    // this.program = Program.makeFrom(gl, program);
    _this.program = program;
    _this.material = material;

    // Attributes and buffers
    _this.setGeometry(geometry);
    _this.attributes = {};
    _this.setAttributes(attributes);

    _this.uniforms = _extends({}, program.defaultUniforms, uniforms);

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

  }, {
    key: 'render',
    value: function render() {
      var _ref4 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var camera = _ref4.camera;
      var viewMatrix = _ref4.viewMatrix;

      // Camera exposes uniforms that can be used directly in shaders
      if (camera) {
        this.setUniforms(camera.getUniforms());
      }
      if (viewMatrix) {
        this.setUniforms(this.getCoordinateUniforms(viewMatrix));
      }

      _utils.log.log(2, 'Rendering model ' + this.id + ' - setting state', this);

      this.setProgramState();

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
    value: function setProgramState() {
      var program = this.program;

      program.use();
      // this.bindTextures();
      program.setUniforms(this.uniforms);
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
      var _ref5 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var attributes = _ref5.attributes;
      var _ref5$header = _ref5.header;
      var header = _ref5$header === undefined ? 'Attributes' : _ref5$header;
      var program = _ref5.program;

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

      throw new Error('setTextures replaced with setUniforms');
    }
  }, {
    key: 'bindTextures',
    value: function bindTextures() {
      var force = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

      console.warn('Model.bindTextures is deprecated');
      var textures = (0, _utils.splat)(this.textures);
      var tex2D = 0;

      // const texCube = 0;
      for (var i = 0; i < _config.MAX_TEXTURES; i++) {
        if (i < textures.length) {
          var _setUniforms;

          // rye TODO: update this when TextureCube is implemented.
          // const isCube = app.textureMemo[textures[i]].isCube;
          // if (isCube) {
          // program.setTexture(textures[i], gl['TEXTURE' + i]);
          // program.setUniforms({
          //   ['hasTextureCube' + (i + 1)]: true,
          //   [samplerCube' + (texCube + 1)]: i
          // })
          // texCube++;
          // } else {
          this.setUniforms((_setUniforms = {}, _defineProperty(_setUniforms, 'hasTexture' + (i + 1), true), _defineProperty(_setUniforms, 'sampler' + (tex2D + 1), textures[i]), _setUniforms));
          tex2D++;
        } else {
          var _setUniforms2;

          this.setUniforms((_setUniforms2 = {}, _defineProperty(_setUniforms2, 'hasTextureCube' + (i + 1), false), _defineProperty(_setUniforms2, 'hasTexture' + (i + 1), false), _setUniforms2));
        }
      }

      // [`sampler${++tex2D}`]: i,
      // [`samplerCube${++texCube}`]: i
      return this;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9tb2RlbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUlBOztBQUNBOztBQUtBOzs7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUdhLFEsV0FBQSxRLEdBQ1gsb0JBQWtFO0FBQUEsbUVBQUosRUFBSTs7QUFBQSw0QkFBckQsU0FBcUQ7QUFBQSxNQUFyRCxTQUFxRCxrQ0FBekMsQ0FBeUM7QUFBQSw2QkFBdEMsVUFBc0M7QUFBQSxNQUF0QyxVQUFzQyxtQ0FBekIsQ0FBeUI7QUFBQSw2QkFBdEIsVUFBc0I7QUFBQSxNQUF0QixVQUFzQixtQ0FBVCxDQUFTOztBQUFBOztBQUNoRSxPQUFLLFNBQUwsR0FBaUIsU0FBakI7QUFDQSxPQUFLLFVBQUwsR0FBa0IsVUFBbEI7QUFDQSxPQUFLLFVBQUwsR0FBa0IsVUFBbEI7QUFDRCxDOzs7OztJQUlrQixLOzs7Ozs7QUFJbkIsbUJBa0JRO0FBQUEsc0VBQUosRUFBSTs7QUFBQSxRQWpCTixPQWlCTSxTQWpCTixPQWlCTTtBQUFBLFFBaEJOLFFBZ0JNLFNBaEJOLFFBZ0JNO0FBQUEsK0JBZk4sUUFlTTtBQUFBLFFBZk4sUUFlTSxrQ0FmSyxJQWVMO0FBQUEsUUFkTixRQWNNLFNBZE4sUUFjTTtBQUFBLGtDQVpOLFdBWU07QUFBQTs7QUFaTixlQVlNLHFDQVpRLEtBWVI7QUFBQSxvQ0FYTixhQVdNO0FBQUEsUUFYTixhQVdNLHVDQVhVLENBV1Y7QUFBQSxrQ0FWTixXQVVNO0FBQUEsUUFWTixXQVVNLHFDQVZRLFNBVVI7QUFBQSwrQkFSTixRQVFNO0FBQUE7O0FBUk4sWUFRTSxrQ0FSSyxLQVFMO0FBQUEsMkJBUlksSUFRWjtBQUFBLFFBUlksSUFRWiw4QkFSbUIsSUFRbkI7QUFBQSwrQkFOTixRQU1NO0FBQUE7O0FBTk4sWUFNTSxrQ0FOSyxFQU1MO0FBQUEsaUNBTE4sVUFLTTtBQUFBLFFBTE4sVUFLTSxvQ0FMTyxFQUtQO0FBQUEsNkJBSk4sTUFJTTtBQUFBLFFBSk4sTUFJTSxnQ0FKRyxJQUlIO0FBQUEscUNBSE4sY0FHTTtBQUFBLFFBSE4sY0FHTSx3Q0FIVyxZQUFNLENBQUUsQ0FHbkI7QUFBQSxvQ0FGTixhQUVNO0FBQUEsUUFGTixhQUVNLHVDQUZVLFlBQU0sQ0FBRSxDQUVsQjs7QUFBQSxRQURILElBQ0c7O0FBQUE7OztBQUVOLDBCQUFPLGlDQUFQLEVBQW1DLHVCQUFuQztBQUNBLDBCQUFPLHNDQUFQLEVBQXFDLHdCQUFyQzs7QUFITSx5RkFLQSxJQUxBOztBQU9OLFFBQUksS0FBSyxTQUFULEVBQW9CO0FBQ2xCLGNBQVEsSUFBUixDQUFhLHFKQUFiO0FBR0Esb0JBQWMsZUFBZSxLQUFLLFNBQWxDO0FBQ0Q7O0FBRUQsUUFBSSxRQUFKLEVBQWM7QUFDWixZQUFNLElBQUksS0FBSixDQUFVLHVGQUFWLENBQU47QUFFRDs7O0FBR0QsVUFBSyxPQUFMLEdBQWUsRUFBZjtBQUNBLFVBQUssUUFBTCxHQUFnQixFQUFoQjtBQUNBLFVBQUssVUFBTCxHQUFrQixFQUFsQjtBQUNBLFVBQUssT0FBTCxHQUFlLEtBQWY7QUFDQSxVQUFLLFdBQUwsR0FBbUIsSUFBbkI7Ozs7QUFJQSxVQUFLLE9BQUwsR0FBZSxPQUFmO0FBQ0EsVUFBSyxRQUFMLEdBQWdCLFFBQWhCOzs7QUFHQSxVQUFLLFdBQUwsQ0FBaUIsUUFBakI7QUFDQSxVQUFLLFVBQUwsR0FBa0IsRUFBbEI7QUFDQSxVQUFLLGFBQUwsQ0FBbUIsVUFBbkI7O0FBRUEsVUFBSyxRQUFMLGdCQUNLLFFBQVEsZUFEYixFQUVLLFFBRkw7OztBQU1BLFVBQUssV0FBTCxHQUFtQixXQUFuQjtBQUNBLFVBQUssYUFBTCxHQUFxQixhQUFyQjtBQUNBLFVBQUssV0FBTCxHQUFtQixXQUFuQjs7O0FBR0EsVUFBSyxRQUFMLEdBQWdCLFFBQVEsUUFBUixDQUFoQjtBQUNBLFVBQUssSUFBTCxHQUFZLFFBQVM7QUFBQSxhQUFNLEtBQU47QUFBQSxLQUFyQjs7QUFFQSxVQUFLLGNBQUwsR0FBc0IsY0FBdEI7QUFDQSxVQUFLLGFBQUwsR0FBcUIsYUFBckI7QUFuRE07QUFvRFA7Ozs7OztxQ0FRNkI7QUFBQSxVQUFmLE1BQWUseURBQU4sSUFBTTs7QUFDNUIsV0FBSyxXQUFMLEdBQW1CLE1BQW5CO0FBQ0EsYUFBTyxJQUFQO0FBQ0Q7OztxQ0FFK0M7QUFBQSx3RUFBSixFQUFJOztBQUFBLHdDQUFoQyxnQkFBZ0M7QUFBQSxVQUFoQyxnQkFBZ0MseUNBQWIsS0FBYTs7QUFDOUMsVUFBSSxTQUFTLEtBQWI7QUFDQSxlQUFTLFVBQVUsS0FBSyxXQUF4QjtBQUNBLFdBQUssV0FBTCxHQUFtQixLQUFLLFdBQUwsSUFBb0IsQ0FBQyxnQkFBeEM7QUFDQSxlQUFTLFVBQVUsS0FBSyxRQUFMLENBQWMsY0FBZCxDQUE2QixFQUFDLGtDQUFELEVBQTdCLENBQW5CO0FBQ0EsYUFBTyxNQUFQO0FBQ0Q7OztxQ0FFZ0IsYSxFQUFlO0FBQzlCLDRCQUFPLGtCQUFrQixTQUF6QjtBQUNBLFdBQUssYUFBTCxHQUFxQixhQUFyQjtBQUNBLGFBQU8sSUFBUDtBQUNEOzs7dUNBRWtCO0FBQ2pCLGFBQU8sS0FBSyxhQUFaO0FBQ0Q7OzttQ0FFYyxXLEVBQWE7QUFDMUIsV0FBSyxXQUFMLEdBQW1CLFdBQW5CO0FBQ0EsYUFBTyxJQUFQO0FBQ0Q7OztxQ0FFZ0I7QUFDZixhQUFPLEtBQUssV0FBTCxLQUFxQixTQUFyQixHQUNMLEtBQUssUUFBTCxDQUFjLGNBQWQsRUFESyxHQUM0QixLQUFLLFdBRHhDO0FBRUQ7OztpQ0FFWTtBQUNYLGFBQU8sS0FBSyxRQUFaO0FBQ0Q7OztrQ0FFNEI7QUFBQSxVQUFqQixRQUFpQix5REFBTixJQUFNOztBQUMzQixXQUFLLFFBQUwsR0FBZ0IsUUFBUSxRQUFSLENBQWhCO0FBQ0EsYUFBTyxJQUFQO0FBQ0Q7OztpQ0FFWTtBQUNYLGFBQU8sS0FBSyxPQUFaO0FBQ0Q7OztrQ0FFYTtBQUNaLGFBQU8sS0FBSyxRQUFaO0FBQ0Q7OztnQ0FFVyxRLEVBQVU7QUFDcEIsV0FBSyxRQUFMLEdBQWdCLFFBQWhCO0FBQ0EsV0FBSyxzQ0FBTCxDQUE0QyxLQUFLLFFBQUwsQ0FBYyxhQUFkLEVBQTVDO0FBQ0EsV0FBSyxjQUFMO0FBQ0EsYUFBTyxJQUFQO0FBQ0Q7OztvQ0FFZTtBQUNkLGFBQU8sS0FBSyxVQUFaO0FBQ0Q7OztvQ0FFOEI7QUFBQSxVQUFqQixVQUFpQix5REFBSixFQUFJOztBQUM3QixhQUFPLE1BQVAsQ0FBYyxLQUFLLFVBQW5CLEVBQStCLFVBQS9CO0FBQ0EsV0FBSyxzQ0FBTCxDQUE0QyxVQUE1QztBQUNBLFdBQUssY0FBTDtBQUNBLGFBQU8sSUFBUDtBQUNEOzs7a0NBRWE7QUFDWixhQUFPLEtBQUssUUFBWjtBQUNEOzs7a0NBRTBCO0FBQUEsVUFBZixRQUFlLHlEQUFKLEVBQUk7O0FBQ3pCLHFDQUFtQixRQUFuQjtBQUNBLGFBQU8sTUFBUCxDQUFjLEtBQUssUUFBbkIsRUFBNkIsUUFBN0I7QUFDQSxXQUFLLGNBQUw7QUFDQSxhQUFPLElBQVA7QUFDRDs7Ozs7Ozs7OzZCQU1pQztBQUFBLHdFQUFKLEVBQUk7O0FBQUEsVUFBMUIsTUFBMEIsU0FBMUIsTUFBMEI7QUFBQSxVQUFsQixVQUFrQixTQUFsQixVQUFrQjs7O0FBRWhDLFVBQUksTUFBSixFQUFZO0FBQ1YsYUFBSyxXQUFMLENBQWlCLE9BQU8sV0FBUCxFQUFqQjtBQUNEO0FBQ0QsVUFBSSxVQUFKLEVBQWdCO0FBQ2QsYUFBSyxXQUFMLENBQWlCLEtBQUsscUJBQUwsQ0FBMkIsVUFBM0IsQ0FBakI7QUFDRDs7QUFFRCxpQkFBSSxHQUFKLENBQVEsQ0FBUix1QkFBOEIsS0FBSyxFQUFuQyx1QkFBeUQsSUFBekQ7O0FBRUEsV0FBSyxlQUFMOztBQUVBLFVBQU0sYUFBYSxLQUFLLFVBQXhCO0FBQ0EsVUFBSSxXQUFXLFdBQVgsSUFBMEIsQ0FBQyxLQUFLLFdBQXBDLEVBQWlEO0FBQy9DLG1CQUFJLElBQUosQ0FBUyxDQUFULEVBQVksbURBQVo7QUFDRDs7QUFFRCxXQUFLLGNBQUw7O0FBRUEsaUJBQUksR0FBSixDQUFRLENBQVIsdUJBQThCLEtBQUssRUFBbkMsc0JBQXdELElBQXhEO0FBQ0EsV0FBSyxJQUFMLENBQVUsQ0FBVjs7QUFyQmdDLFVBdUJ6QixFQXZCeUIsR0F1Qm5CLEtBQUssT0F2QmMsQ0F1QnpCLEVBdkJ5QjtBQUFBLFVBd0J6QixRQXhCeUIsR0F3QmUsSUF4QmYsQ0F3QnpCLFFBeEJ5QjtBQUFBLFVBd0JmLFdBeEJlLEdBd0JlLElBeEJmLENBd0JmLFdBeEJlO0FBQUEsVUF3QkYsYUF4QkUsR0F3QmUsSUF4QmYsQ0F3QkYsYUF4QkU7QUFBQSxVQXlCekIsU0F6QnlCLEdBeUJELFVBekJDLENBeUJ6QixTQXpCeUI7QUFBQSxVQXlCZCxTQXpCYyxHQXlCRCxVQXpCQyxDQXlCZCxTQXpCYzs7QUEwQmhDLHVCQUFLLEVBQUwsRUFBUztBQUNQLGtCQUFVLFNBQVMsUUFEWjtBQUVQLHFCQUFhLEtBQUssY0FBTCxFQUZOO0FBR1AsbUJBQVcsU0FISjtBQUlQLG1CQUFXLFNBSko7QUFLUCxnQ0FMTztBQU1QO0FBTk8sT0FBVDs7QUFTQSxXQUFLLGFBQUw7O0FBRUEsV0FBSyxpQkFBTDs7QUFFQSxXQUFLLGNBQUwsQ0FBb0IsS0FBcEI7O0FBRUEsYUFBTyxJQUFQO0FBQ0Q7OztzQ0FFaUI7QUFBQSxVQUNULE9BRFMsR0FDRSxJQURGLENBQ1QsT0FEUzs7QUFFaEIsY0FBUSxHQUFSOztBQUVBLGNBQVEsV0FBUixDQUFvQixLQUFLLFFBQXpCO0FBQ0EsV0FBSyxVQUFMLEdBQWtCLEVBQWxCO0FBQ0EsY0FBUSxVQUFSLENBQW1CLEtBQUssT0FBeEIsRUFBaUMsRUFBQyxZQUFZLEtBQUssVUFBbEIsRUFBakM7QUFDQSxhQUFPLElBQVA7QUFDRDs7O3dDQUVtQjs7O0FBR2xCLFdBQUssT0FBTCxDQUFhLFlBQWI7QUFDQSxhQUFPLElBQVA7QUFDRDs7Ozs7Ozs7OzJEQU1zQyxVLEVBQVk7QUFBQSxVQUNoQyxFQURnQyxHQUN6QixJQUR5QixDQUMxQyxPQUQwQyxDQUNoQyxFQURnQzs7O0FBR2pELFdBQUssSUFBTSxhQUFYLElBQTRCLFVBQTVCLEVBQXdDO0FBQ3RDLFlBQU0sWUFBWSxXQUFXLGFBQVgsQ0FBbEI7O0FBRUEsWUFBSSxrQ0FBSixFQUFpQztBQUMvQixlQUFLLE9BQUwsQ0FBYSxhQUFiLElBQThCLFNBQTlCO0FBQ0QsU0FGRCxNQUVPOztBQUVMLGVBQUssT0FBTCxDQUFhLGFBQWIsSUFDRSxLQUFLLE9BQUwsQ0FBYSxhQUFiLEtBQStCLGtCQUFXLEVBQVgsQ0FEakM7O0FBR0EsY0FBTSxTQUFTLEtBQUssT0FBTCxDQUFhLGFBQWIsQ0FBZjtBQUNBLGlCQUFPLE9BQVAsY0FDSyxTQURMO0FBRUUsa0JBQU0sVUFBVSxLQUZsQjtBQUdFLG9CQUFRLFVBQVUsU0FBVixHQUNOLGFBQU0sb0JBREEsR0FDdUIsYUFBTTtBQUp2QztBQU1EO0FBQ0Y7O0FBRUQsYUFBTyxJQUFQO0FBQ0Q7OzsyQkFFa0I7QUFBQSxVQUFkLFFBQWMseURBQUgsQ0FBRzs7QUFDakIsVUFBSSxXQUFJLFFBQUosSUFBZ0IsUUFBcEIsRUFBOEI7QUFDNUIsWUFBSSxRQUFRLEtBQUssbUJBQUwsQ0FBeUI7QUFDbkMsa0NBQXNCLEtBQUssUUFBTCxDQUFjLEVBREQ7QUFFbkMsbUJBQVMsS0FBSyxPQUZxQjtBQUduQyxtQ0FDSyxLQUFLLFFBQUwsQ0FBYyxVQURuQixFQUVLLEtBQUssVUFGVjtBQUhtQyxTQUF6QixDQUFaO0FBUUEsbUJBQUksS0FBSixDQUFVLFFBQVYsRUFBb0IsS0FBcEI7O0FBRUEsZ0JBQVEsNkJBQWlCO0FBQ3ZCLGdDQUFvQixLQUFLLFFBQUwsQ0FBYyxFQURYO0FBRXZCLG1CQUFTLEtBQUssT0FGUztBQUd2QixvQkFBVSxLQUFLO0FBSFEsU0FBakIsQ0FBUjtBQUtBLG1CQUFJLEtBQUosQ0FBVSxRQUFWLEVBQW9CLEtBQXBCO0FBQ0Q7QUFDRjs7Ozs7OzBDQU9PO0FBQUEsd0VBQUosRUFBSTs7QUFBQSxVQUhOLFVBR00sU0FITixVQUdNO0FBQUEsK0JBRk4sTUFFTTtBQUFBLFVBRk4sTUFFTSxnQ0FGRyxZQUVIO0FBQUEsVUFETixPQUNNLFNBRE4sT0FDTTs7QUFDTiw0QkFBTyxPQUFQO0FBQ0EsVUFBTSxxQkFBcUIsUUFBUSxtQkFBbkM7QUFDQSxVQUFNLFFBQVEsNkJBQVcsTUFBWCxFQUFvQixFQUFwQixDQUFkOzs7QUFHQSxXQUFLLElBQU0sYUFBWCxJQUE0QixrQkFBNUIsRUFBZ0Q7QUFDOUMsWUFBTSxZQUFZLFdBQVcsYUFBWCxDQUFsQjtBQUNBLFlBQU0sV0FBVyxtQkFBbUIsYUFBbkIsQ0FBakI7QUFDQSxjQUFNLGFBQU4sSUFBdUIsS0FBSyxrQkFBTCxDQUF3QixTQUF4QixFQUFtQyxRQUFuQyxDQUF2QjtBQUNEOzs7QUFHRCxXQUFLLElBQU0sY0FBWCxJQUE0QixVQUE1QixFQUF3QztBQUN0QyxZQUFNLGFBQVksV0FBVyxjQUFYLENBQWxCO0FBQ0EsWUFBSSxDQUFDLE1BQU0sY0FBTixDQUFMLEVBQTJCO0FBQ3pCLGdCQUFNLGNBQU4sSUFBdUIsS0FBSyxrQkFBTCxDQUF3QixVQUF4QixFQUFtQyxJQUFuQyxDQUF2QjtBQUNEO0FBQ0Y7O0FBRUQsYUFBTyxLQUFQO0FBQ0Q7Ozt1Q0FFa0IsUyxFQUFXLFEsRUFBVTtBQUN0QyxVQUFNLFFBQVEsU0FBUixLQUFRO0FBQUEsZUFBTyxLQUFLLEtBQUwsQ0FBVyxNQUFNLEVBQWpCLElBQXVCLEVBQTlCO0FBQUEsT0FBZDs7QUFFQSxVQUFJLFNBQUosRUFBZTtBQUNiLFlBQUksYUFBYSxJQUFqQixFQUF1QjtBQUNyQixxQkFBVyxVQUFVLFNBQVYsR0FBc0Isc0JBQXRCLEdBQStDLFVBQTFEO0FBQ0Q7O0FBRUQsWUFBSSxrQ0FBSixFQUFpQztBQUMvQixjQUFNLFNBQVMsU0FBZjtBQUNBLGlCQUFPO0FBQ0wsc0JBQVUsUUFETDtBQUVMLGtCQUFNLE9BQU8sTUFBUCxDQUFjLElBRmY7QUFHTCx1QkFBVyxPQUFPLE1BQVAsQ0FBYyxTQUhwQjtBQUlMLG1CQUFPLE1BQU0sT0FBTyxJQUFQLENBQVksTUFBWixHQUFxQixPQUFPLE1BQVAsQ0FBYyxJQUF6QyxDQUpGO0FBS0wsa0JBQU0sT0FBTyxNQUFQLENBQWMsSUFMZjtBQU1MLG1CQUFPLE9BQU8sSUFBUCxDQUFZLE1BQVosR0FBcUIsT0FBTyxJQUFQLENBQVk7QUFObkMsV0FBUDtBQVFEOztBQUVELGVBQU87QUFDTCxvQkFBVSxRQURMO0FBRUwsZ0JBQU0sVUFBVSxLQUFWLENBQWdCLFdBQWhCLENBQTRCLElBRjdCO0FBR0wscUJBQVcsVUFBVSxTQUhoQjtBQUlMLGlCQUFPLE1BQU0sVUFBVSxLQUFWLENBQWdCLE1BQWhCLEdBQXlCLFVBQVUsSUFBekMsQ0FKRjtBQUtMLGdCQUFNLFVBQVUsSUFMWDtBQU1MLGlCQUFPLFVBQVUsS0FBVixDQUFnQixNQUFoQixHQUF5QixVQUFVLEtBQVYsQ0FBZ0I7QUFOM0MsU0FBUDtBQVFEO0FBQ0QsYUFBTztBQUNMLGtCQUFVLFFBREw7QUFFTCxjQUFNLGNBRkQ7QUFHTCxtQkFBVyxLQUhOO0FBSUwsZUFBTyxLQUpGO0FBS0wsY0FBTSxLQUxEO0FBTUwsZUFBTztBQU5GLE9BQVA7QUFRRDs7Ozs7O2tDQUcwQjtBQUFBLFVBQWYsUUFBZSx5REFBSixFQUFJOztBQUN6QixZQUFNLElBQUksS0FBSixDQUFVLHVDQUFWLENBQU47QUFDRDs7O21DQUUyQjtBQUFBLFVBQWYsS0FBZSx5REFBUCxLQUFPOztBQUMxQixjQUFRLElBQVIsQ0FBYSxrQ0FBYjtBQUNBLFVBQU0sV0FBVyxrQkFBTSxLQUFLLFFBQVgsQ0FBakI7QUFDQSxVQUFJLFFBQVEsQ0FBWjs7O0FBR0EsV0FBSyxJQUFJLElBQUksQ0FBYixFQUFnQix3QkFBaEIsRUFBa0MsR0FBbEMsRUFBdUM7QUFDckMsWUFBSSxJQUFJLFNBQVMsTUFBakIsRUFBeUI7QUFBQTs7Ozs7Ozs7Ozs7O0FBV3ZCLGVBQUssV0FBTCxtRUFDZ0IsSUFBSSxDQURwQixHQUMwQixJQUQxQiw4Q0FFYSxRQUFRLENBRnJCLEdBRTJCLFNBQVMsQ0FBVCxDQUYzQjtBQUlBO0FBQ0QsU0FoQkQsTUFnQk87QUFBQTs7QUFDTCxlQUFLLFdBQUwseUVBQ29CLElBQUksQ0FEeEIsR0FDOEIsS0FEOUIsa0RBRWdCLElBQUksQ0FGcEIsR0FFMEIsS0FGMUI7QUFNRDtBQUNGOzs7O0FBQ0QsYUFBTyxJQUFQO0FBQ0Q7Ozt3QkFoVFU7QUFDVCxhQUFPLEtBQUssRUFBTCxHQUFVLEdBQVYsR0FBZ0IsS0FBSyxhQUE1QjtBQUNEOzs7Ozs7a0JBaEZrQixLIiwiZmlsZSI6Im1vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQSBzY2VuZWdyYXBoIG9iamVjdCBub2RlXG4vKiBlc2xpbnQtZGlzYWJsZSBndWFyZC1mb3ItaW4gKi9cblxuLy8gRGVmaW5lIHNvbWUgbG9jYWxzXG5pbXBvcnQge01BWF9URVhUVVJFU30gZnJvbSAnLi9jb25maWcnO1xuaW1wb3J0IHtcbiAgV2ViR0wsIEJ1ZmZlciwgUHJvZ3JhbSwgZHJhdyxcbiAgY2hlY2tVbmlmb3JtVmFsdWVzLCBnZXRVbmlmb3Jtc1RhYmxlXG59IGZyb20gJy4vd2ViZ2wnO1xuXG5pbXBvcnQgT2JqZWN0M0QgZnJvbSAnLi9zY2VuZWdyYXBoL29iamVjdC0zZCc7XG5pbXBvcnQgR2VvbWV0cnkgZnJvbSAnLi9nZW9tZXRyeSc7XG5pbXBvcnQge2xvZywgc3BsYXR9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG4vLyBUT0RPIC0gZXhwZXJpbWVudGFsLCBub3QgeWV0IHVzZWRcbmV4cG9ydCBjbGFzcyBNYXRlcmlhbCB7XG4gIGNvbnN0cnVjdG9yKHtzaGluaW5lc3MgPSAwLCByZWZsZWN0aW9uID0gMCwgcmVmcmFjdGlvbiA9IDB9ID0ge30pIHtcbiAgICB0aGlzLnNoaW5pbmVzcyA9IHNoaW5pbmVzcztcbiAgICB0aGlzLnJlZmxlY3Rpb24gPSByZWZsZWN0aW9uO1xuICAgIHRoaXMucmVmcmFjdGlvbiA9IHJlZnJhY3Rpb247XG4gIH1cbn1cblxuLy8gTW9kZWwgYWJzdHJhY3QgTzNEIENsYXNzXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNb2RlbCBleHRlbmRzIE9iamVjdDNEIHtcblxuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cyAgKi9cbiAgLyogZXNsaW50LWRpc2FibGUgY29tcGxleGl0eSAgKi9cbiAgY29uc3RydWN0b3Ioe1xuICAgIHByb2dyYW0sXG4gICAgZ2VvbWV0cnksXG4gICAgbWF0ZXJpYWwgPSBudWxsLFxuICAgIHRleHR1cmVzLFxuICAgIC8vIEVuYWJsZXMgaW5zdGFuY2VkIHJlbmRlcmluZyAobmVlZHMgc2hhZGVyIHN1cHBvcnQgYW5kIGV4dHJhIGF0dHJpYnV0ZXMpXG4gICAgaXNJbnN0YW5jZWQgPSBmYWxzZSxcbiAgICBpbnN0YW5jZUNvdW50ID0gMCxcbiAgICB2ZXJ0ZXhDb3VudCA9IHVuZGVmaW5lZCxcbiAgICAvLyBQaWNraW5nXG4gICAgcGlja2FibGUgPSBmYWxzZSwgcGljayA9IG51bGwsXG4gICAgLy8gRXh0cmEgdW5pZm9ybXMgYW5kIGF0dHJpYnV0ZXMgKGJleW9uZCBnZW9tZXRyeSwgbWF0ZXJpYWwsIGNhbWVyYSlcbiAgICB1bmlmb3JtcyA9IHt9LFxuICAgIGF0dHJpYnV0ZXMgPSB7fSxcbiAgICByZW5kZXIgPSBudWxsLFxuICAgIG9uQmVmb3JlUmVuZGVyID0gKCkgPT4ge30sXG4gICAgb25BZnRlclJlbmRlciA9ICgpID0+IHt9LFxuICAgIC4uLm9wdHNcbiAgfSA9IHt9KSB7XG4gICAgLy8gYXNzZXJ0KHByb2dyYW0gfHwgcHJvZ3JhbSBpbnN0YW5jZW9mIFByb2dyYW0pO1xuICAgIGFzc2VydChwcm9ncmFtIGluc3RhbmNlb2YgUHJvZ3JhbSwgJ01vZGVsIG5lZWRzIGEgcHJvZ3JhbScpO1xuICAgIGFzc2VydChnZW9tZXRyeSBpbnN0YW5jZW9mIEdlb21ldHJ5LCAnTW9kZWwgbmVlZHMgYSBnZW9tZXRyeScpO1xuXG4gICAgc3VwZXIob3B0cyk7XG5cbiAgICBpZiAob3B0cy5pbnN0YW5jZWQpIHtcbiAgICAgIGNvbnNvbGUud2FybihgV2FybmluZzogYCArXG4gICAgICAgIGBNb2RlbCBjb25zdHJ1Y3RvcjogcGFyYW1ldGVyIFwiaW5zdGFuY2VkXCIgcmVuYW1lZCB0byBcImlzSW5zdGFuY2VkXCIuIGAgK1xuICAgICAgICBgVGhpcyB3aWxsIGJlY29tZSBhIGhhcmQgZXJyb3IgaW4gYSBmdXR1cmUgdmVyc2lvbiBvZiBsdW1hLmdsLmApO1xuICAgICAgaXNJbnN0YW5jZWQgPSBpc0luc3RhbmNlZCB8fCBvcHRzLmluc3RhbmNlZDtcbiAgICB9XG5cbiAgICBpZiAodGV4dHVyZXMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgTW9kZWwgY29uc3RydWN0b3I6IHBhcmFtZXRlciBcInRleHR1cmVzXCIgZGVwcmVjYXRlZC4gYCArXG4gICAgICAgIGBVc2UgdW5pZm9ybXMgdG8gc2V0IHRleHR1cmVzYCk7XG4gICAgfVxuXG4gICAgLy8gVE9ETyAtIHJlbW92ZT9cbiAgICB0aGlzLmJ1ZmZlcnMgPSB7fTtcbiAgICB0aGlzLnVzZXJEYXRhID0ge307XG4gICAgdGhpcy5kcmF3UGFyYW1zID0ge307XG4gICAgdGhpcy5keW5hbWljID0gZmFsc2U7XG4gICAgdGhpcy5uZWVkc1JlZHJhdyA9IHRydWU7XG5cbiAgICAvLyBzZXQgYSBjdXN0b20gcHJvZ3JhbSBwZXIgbzNkXG4gICAgLy8gdGhpcy5wcm9ncmFtID0gUHJvZ3JhbS5tYWtlRnJvbShnbCwgcHJvZ3JhbSk7XG4gICAgdGhpcy5wcm9ncmFtID0gcHJvZ3JhbTtcbiAgICB0aGlzLm1hdGVyaWFsID0gbWF0ZXJpYWw7XG5cbiAgICAvLyBBdHRyaWJ1dGVzIGFuZCBidWZmZXJzXG4gICAgdGhpcy5zZXRHZW9tZXRyeShnZW9tZXRyeSk7XG4gICAgdGhpcy5hdHRyaWJ1dGVzID0ge307XG4gICAgdGhpcy5zZXRBdHRyaWJ1dGVzKGF0dHJpYnV0ZXMpO1xuXG4gICAgdGhpcy51bmlmb3JtcyA9IHtcbiAgICAgIC4uLnByb2dyYW0uZGVmYXVsdFVuaWZvcm1zLFxuICAgICAgLi4udW5pZm9ybXNcbiAgICB9O1xuXG4gICAgLy8gaW5zdGFuY2VkIHJlbmRlcmluZ1xuICAgIHRoaXMuaXNJbnN0YW5jZWQgPSBpc0luc3RhbmNlZDtcbiAgICB0aGlzLmluc3RhbmNlQ291bnQgPSBpbnN0YW5jZUNvdW50O1xuICAgIHRoaXMudmVydGV4Q291bnQgPSB2ZXJ0ZXhDb3VudDtcblxuICAgIC8vIHBpY2tpbmcgb3B0aW9uc1xuICAgIHRoaXMucGlja2FibGUgPSBCb29sZWFuKHBpY2thYmxlKTtcbiAgICB0aGlzLnBpY2sgPSBwaWNrIHx8ICgoKSA9PiBmYWxzZSk7XG5cbiAgICB0aGlzLm9uQmVmb3JlUmVuZGVyID0gb25CZWZvcmVSZW5kZXI7XG4gICAgdGhpcy5vbkFmdGVyUmVuZGVyID0gb25BZnRlclJlbmRlcjtcbiAgfVxuICAvKiBlc2xpbnQtZW5hYmxlIG1heC1zdGF0ZW1lbnRzICovXG4gIC8qIGVzbGludC1lbmFibGUgY29tcGxleGl0eSAqL1xuXG4gIGdldCBoYXNoKCkge1xuICAgIHJldHVybiB0aGlzLmlkICsgJyAnICsgdGhpcy4kcGlja2luZ0luZGV4O1xuICB9XG5cbiAgc2V0TmVlZHNSZWRyYXcocmVkcmF3ID0gdHJ1ZSkge1xuICAgIHRoaXMubmVlZHNSZWRyYXcgPSByZWRyYXc7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXROZWVkc1JlZHJhdyh7Y2xlYXJSZWRyYXdGbGFncyA9IGZhbHNlfSA9IHt9KSB7XG4gICAgbGV0IHJlZHJhdyA9IGZhbHNlO1xuICAgIHJlZHJhdyA9IHJlZHJhdyB8fCB0aGlzLm5lZWRzUmVkcmF3O1xuICAgIHRoaXMubmVlZHNSZWRyYXcgPSB0aGlzLm5lZWRzUmVkcmF3ICYmICFjbGVhclJlZHJhd0ZsYWdzO1xuICAgIHJlZHJhdyA9IHJlZHJhdyB8fCB0aGlzLmdlb21ldHJ5LmdldE5lZWRzUmVkcmF3KHtjbGVhclJlZHJhd0ZsYWdzfSk7XG4gICAgcmV0dXJuIHJlZHJhdztcbiAgfVxuXG4gIHNldEluc3RhbmNlQ291bnQoaW5zdGFuY2VDb3VudCkge1xuICAgIGFzc2VydChpbnN0YW5jZUNvdW50ICE9PSB1bmRlZmluZWQpO1xuICAgIHRoaXMuaW5zdGFuY2VDb3VudCA9IGluc3RhbmNlQ291bnQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXRJbnN0YW5jZUNvdW50KCkge1xuICAgIHJldHVybiB0aGlzLmluc3RhbmNlQ291bnQ7XG4gIH1cblxuICBzZXRWZXJ0ZXhDb3VudCh2ZXJ0ZXhDb3VudCkge1xuICAgIHRoaXMudmVydGV4Q291bnQgPSB2ZXJ0ZXhDb3VudDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldFZlcnRleENvdW50KCkge1xuICAgIHJldHVybiB0aGlzLnZlcnRleENvdW50ID09PSB1bmRlZmluZWQgP1xuICAgICAgdGhpcy5nZW9tZXRyeS5nZXRWZXJ0ZXhDb3VudCgpIDogdGhpcy52ZXJ0ZXhDb3VudDtcbiAgfVxuXG4gIGlzUGlja2FibGUoKSB7XG4gICAgcmV0dXJuIHRoaXMucGlja2FibGU7XG4gIH1cblxuICBzZXRQaWNrYWJsZShwaWNrYWJsZSA9IHRydWUpIHtcbiAgICB0aGlzLnBpY2thYmxlID0gQm9vbGVhbihwaWNrYWJsZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXRQcm9ncmFtKCkge1xuICAgIHJldHVybiB0aGlzLnByb2dyYW07XG4gIH1cblxuICBnZXRHZW9tZXRyeSgpIHtcbiAgICByZXR1cm4gdGhpcy5nZW9tZXRyeTtcbiAgfVxuXG4gIHNldEdlb21ldHJ5KGdlb21ldHJ5KSB7XG4gICAgdGhpcy5nZW9tZXRyeSA9IGdlb21ldHJ5O1xuICAgIHRoaXMuX2NyZWF0ZUJ1ZmZlcnNGcm9tQXR0cmlidXRlRGVzY3JpcHRvcnModGhpcy5nZW9tZXRyeS5nZXRBdHRyaWJ1dGVzKCkpO1xuICAgIHRoaXMuc2V0TmVlZHNSZWRyYXcoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldEF0dHJpYnV0ZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlcztcbiAgfVxuXG4gIHNldEF0dHJpYnV0ZXMoYXR0cmlidXRlcyA9IHt9KSB7XG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLmF0dHJpYnV0ZXMsIGF0dHJpYnV0ZXMpO1xuICAgIHRoaXMuX2NyZWF0ZUJ1ZmZlcnNGcm9tQXR0cmlidXRlRGVzY3JpcHRvcnMoYXR0cmlidXRlcyk7XG4gICAgdGhpcy5zZXROZWVkc1JlZHJhdygpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZ2V0VW5pZm9ybXMoKSB7XG4gICAgcmV0dXJuIHRoaXMudW5pZm9ybXM7XG4gIH1cblxuICBzZXRVbmlmb3Jtcyh1bmlmb3JtcyA9IHt9KSB7XG4gICAgY2hlY2tVbmlmb3JtVmFsdWVzKHVuaWZvcm1zKTtcbiAgICBPYmplY3QuYXNzaWduKHRoaXMudW5pZm9ybXMsIHVuaWZvcm1zKTtcbiAgICB0aGlzLnNldE5lZWRzUmVkcmF3KCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKlxuICAgKiBAcGFyYW0ge0NhbWVyYX0gb3B0LmNhbWVyYT1cbiAgICogQHBhcmFtIHtDYW1lcmF9IG9wdC52aWV3TWF0cml4PVxuICAgKi9cbiAgcmVuZGVyKHtjYW1lcmEsIHZpZXdNYXRyaXh9ID0ge30pIHtcbiAgICAvLyBDYW1lcmEgZXhwb3NlcyB1bmlmb3JtcyB0aGF0IGNhbiBiZSB1c2VkIGRpcmVjdGx5IGluIHNoYWRlcnNcbiAgICBpZiAoY2FtZXJhKSB7XG4gICAgICB0aGlzLnNldFVuaWZvcm1zKGNhbWVyYS5nZXRVbmlmb3JtcygpKTtcbiAgICB9XG4gICAgaWYgKHZpZXdNYXRyaXgpIHtcbiAgICAgIHRoaXMuc2V0VW5pZm9ybXModGhpcy5nZXRDb29yZGluYXRlVW5pZm9ybXModmlld01hdHJpeCkpO1xuICAgIH1cblxuICAgIGxvZy5sb2coMiwgYFJlbmRlcmluZyBtb2RlbCAke3RoaXMuaWR9IC0gc2V0dGluZyBzdGF0ZWAsIHRoaXMpO1xuXG4gICAgdGhpcy5zZXRQcm9ncmFtU3RhdGUoKTtcblxuICAgIGNvbnN0IGRyYXdQYXJhbXMgPSB0aGlzLmRyYXdQYXJhbXM7XG4gICAgaWYgKGRyYXdQYXJhbXMuaXNJbnN0YW5jZWQgJiYgIXRoaXMuaXNJbnN0YW5jZWQpIHtcbiAgICAgIGxvZy53YXJuKDAsICdGb3VuZCBpbnN0YW5jZWQgYXR0cmlidXRlcyBvbiBub24taW5zdGFuY2VkIG1vZGVsJyk7XG4gICAgfVxuXG4gICAgdGhpcy5vbkJlZm9yZVJlbmRlcigpO1xuXG4gICAgbG9nLmxvZygyLCBgUmVuZGVyaW5nIG1vZGVsICR7dGhpcy5pZH0gLSBjYWxsaW5nIGRyYXdgLCB0aGlzKTtcbiAgICB0aGlzLl9sb2coMyk7XG5cbiAgICBjb25zdCB7Z2x9ID0gdGhpcy5wcm9ncmFtO1xuICAgIGNvbnN0IHtnZW9tZXRyeSwgaXNJbnN0YW5jZWQsIGluc3RhbmNlQ291bnR9ID0gdGhpcztcbiAgICBjb25zdCB7aXNJbmRleGVkLCBpbmRleFR5cGV9ID0gZHJhd1BhcmFtcztcbiAgICBkcmF3KGdsLCB7XG4gICAgICBkcmF3TW9kZTogZ2VvbWV0cnkuZHJhd01vZGUsXG4gICAgICB2ZXJ0ZXhDb3VudDogdGhpcy5nZXRWZXJ0ZXhDb3VudCgpLFxuICAgICAgaXNJbmRleGVkOiBpc0luZGV4ZWQsXG4gICAgICBpbmRleFR5cGU6IGluZGV4VHlwZSxcbiAgICAgIGlzSW5zdGFuY2VkLFxuICAgICAgaW5zdGFuY2VDb3VudFxuICAgIH0pO1xuXG4gICAgdGhpcy5vbkFmdGVyUmVuZGVyKCk7XG5cbiAgICB0aGlzLnVuc2V0UHJvZ3JhbVN0YXRlKCk7XG5cbiAgICB0aGlzLnNldE5lZWRzUmVkcmF3KGZhbHNlKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0UHJvZ3JhbVN0YXRlKCkge1xuICAgIGNvbnN0IHtwcm9ncmFtfSA9IHRoaXM7XG4gICAgcHJvZ3JhbS51c2UoKTtcbiAgICAvLyB0aGlzLmJpbmRUZXh0dXJlcygpO1xuICAgIHByb2dyYW0uc2V0VW5pZm9ybXModGhpcy51bmlmb3Jtcyk7XG4gICAgdGhpcy5kcmF3UGFyYW1zID0ge307XG4gICAgcHJvZ3JhbS5zZXRCdWZmZXJzKHRoaXMuYnVmZmVycywge2RyYXdQYXJhbXM6IHRoaXMuZHJhd1BhcmFtc30pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdW5zZXRQcm9ncmFtU3RhdGUoKSB7XG4gICAgLy8gRW5zdXJlcyBhbGwgdmVydGV4IGF0dHJpYnV0ZXMgYXJlIGRpc2FibGVkIGFuZCBFTEVNRU5UX0FSUkFZX0JVRkZFUlxuICAgIC8vIGlzIHVuYm91bmRcbiAgICB0aGlzLnByb2dyYW0udW5zZXRCdWZmZXJzKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBNYWtlcyBzdXJlIGJ1ZmZlcnMgYXJlIGNyZWF0ZWQgZm9yIGFsbCBhdHRyaWJ1dGVzXG4gIC8vIGFuZCB0aGF0IHRoZSBwcm9ncmFtIGlzIHVwZGF0ZWQgd2l0aCB0aG9zZSBidWZmZXJzXG4gIC8vIFRPRE8gLSBkbyB3ZSBuZWVkIHRoZSBzZXBhcmF0aW9uIGJldHdlZW4gXCJhdHRyaWJ1dGVzXCIgYW5kIFwiYnVmZmVyc1wiXG4gIC8vIGNvdWxkbid0IGFwcHMganVzdCBjcmVhdGUgYnVmZmVycyBkaXJlY3RseT9cbiAgX2NyZWF0ZUJ1ZmZlcnNGcm9tQXR0cmlidXRlRGVzY3JpcHRvcnMoYXR0cmlidXRlcykge1xuICAgIGNvbnN0IHtwcm9ncmFtOiB7Z2x9fSA9IHRoaXM7XG5cbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZU5hbWUgaW4gYXR0cmlidXRlcykge1xuICAgICAgY29uc3QgYXR0cmlidXRlID0gYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXTtcblxuICAgICAgaWYgKGF0dHJpYnV0ZSBpbnN0YW5jZW9mIEJ1ZmZlcikge1xuICAgICAgICB0aGlzLmJ1ZmZlcnNbYXR0cmlidXRlTmFtZV0gPSBhdHRyaWJ1dGU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBBdXRvY3JlYXRlIGEgYnVmZmVyXG4gICAgICAgIHRoaXMuYnVmZmVyc1thdHRyaWJ1dGVOYW1lXSA9XG4gICAgICAgICAgdGhpcy5idWZmZXJzW2F0dHJpYnV0ZU5hbWVdIHx8IG5ldyBCdWZmZXIoZ2wpO1xuXG4gICAgICAgIGNvbnN0IGJ1ZmZlciA9IHRoaXMuYnVmZmVyc1thdHRyaWJ1dGVOYW1lXTtcbiAgICAgICAgYnVmZmVyLnNldERhdGEoe1xuICAgICAgICAgIC4uLmF0dHJpYnV0ZSxcbiAgICAgICAgICBkYXRhOiBhdHRyaWJ1dGUudmFsdWUsXG4gICAgICAgICAgdGFyZ2V0OiBhdHRyaWJ1dGUuaXNJbmRleGVkID9cbiAgICAgICAgICAgIFdlYkdMLkVMRU1FTlRfQVJSQVlfQlVGRkVSIDogV2ViR0wuQVJSQVlfQlVGRkVSXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgX2xvZyhwcmlvcml0eSA9IDMpIHtcbiAgICBpZiAobG9nLnByaW9yaXR5ID49IHByaW9yaXR5KSB7XG4gICAgICBsZXQgdGFibGUgPSB0aGlzLl9nZXRBdHRyaWJ1dGVzVGFibGUoe1xuICAgICAgICBoZWFkZXI6IGBBdHRyaWJ1dGVzICR7dGhpcy5nZW9tZXRyeS5pZH1gLFxuICAgICAgICBwcm9ncmFtOiB0aGlzLnByb2dyYW0sXG4gICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAuLi50aGlzLmdlb21ldHJ5LmF0dHJpYnV0ZXMsXG4gICAgICAgICAgLi4udGhpcy5hdHRyaWJ1dGVzXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgbG9nLnRhYmxlKHByaW9yaXR5LCB0YWJsZSk7XG5cbiAgICAgIHRhYmxlID0gZ2V0VW5pZm9ybXNUYWJsZSh7XG4gICAgICAgIGhlYWRlcjogYFVuaWZvcm1zICR7dGhpcy5nZW9tZXRyeS5pZH1gLFxuICAgICAgICBwcm9ncmFtOiB0aGlzLnByb2dyYW0sXG4gICAgICAgIHVuaWZvcm1zOiB0aGlzLnVuaWZvcm1zXG4gICAgICB9KTtcbiAgICAgIGxvZy50YWJsZShwcmlvcml0eSwgdGFibGUpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFRvZG8gbW92ZSB0byBhdHRyaWJ1dGVzIG1hbmFnZXJcbiAgX2dldEF0dHJpYnV0ZXNUYWJsZSh7XG4gICAgYXR0cmlidXRlcyxcbiAgICBoZWFkZXIgPSAnQXR0cmlidXRlcycsXG4gICAgcHJvZ3JhbVxuICB9ID0ge30pIHtcbiAgICBhc3NlcnQocHJvZ3JhbSk7XG4gICAgY29uc3QgYXR0cmlidXRlTG9jYXRpb25zID0gcHJvZ3JhbS5fYXR0cmlidXRlTG9jYXRpb25zO1xuICAgIGNvbnN0IHRhYmxlID0gdGFibGUgfHwge1toZWFkZXJdOiB7fX07XG5cbiAgICAvLyBBZGQgdXNlZCBhdHRyaWJ1dGVzXG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGVOYW1lIGluIGF0dHJpYnV0ZUxvY2F0aW9ucykge1xuICAgICAgY29uc3QgYXR0cmlidXRlID0gYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXTtcbiAgICAgIGNvbnN0IGxvY2F0aW9uID0gYXR0cmlidXRlTG9jYXRpb25zW2F0dHJpYnV0ZU5hbWVdO1xuICAgICAgdGFibGVbYXR0cmlidXRlTmFtZV0gPSB0aGlzLl9nZXRBdHRyaWJ1dGVFbnRyeShhdHRyaWJ1dGUsIGxvY2F0aW9uKTtcbiAgICB9XG5cbiAgICAvLyBBZGQgYW55IHVudXNlZCBhdHRyaWJ1dGVzXG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGVOYW1lIGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IGF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV07XG4gICAgICBpZiAoIXRhYmxlW2F0dHJpYnV0ZU5hbWVdKSB7XG4gICAgICAgIHRhYmxlW2F0dHJpYnV0ZU5hbWVdID0gdGhpcy5fZ2V0QXR0cmlidXRlRW50cnkoYXR0cmlidXRlLCBudWxsKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGFibGU7XG4gIH1cblxuICBfZ2V0QXR0cmlidXRlRW50cnkoYXR0cmlidXRlLCBsb2NhdGlvbikge1xuICAgIGNvbnN0IHJvdW5kID0gbnVtID0+IE1hdGgucm91bmQobnVtICogMTApIC8gMTA7XG5cbiAgICBpZiAoYXR0cmlidXRlKSB7XG4gICAgICBpZiAobG9jYXRpb24gPT09IG51bGwpIHtcbiAgICAgICAgbG9jYXRpb24gPSBhdHRyaWJ1dGUuaXNJbmRleGVkID8gJ0VMRU1FTlRfQVJSQVlfQlVGRkVSJyA6ICdOT1QgVVNFRCc7XG4gICAgICB9XG5cbiAgICAgIGlmIChhdHRyaWJ1dGUgaW5zdGFuY2VvZiBCdWZmZXIpIHtcbiAgICAgICAgY29uc3QgYnVmZmVyID0gYXR0cmlidXRlO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIExvY2F0aW9uOiBsb2NhdGlvbixcbiAgICAgICAgICBUeXBlOiBidWZmZXIubGF5b3V0LnR5cGUsXG4gICAgICAgICAgSW5zdGFuY2VkOiBidWZmZXIubGF5b3V0Lmluc3RhbmNlZCxcbiAgICAgICAgICBWZXJ0czogcm91bmQoYnVmZmVyLmRhdGEubGVuZ3RoIC8gYnVmZmVyLmxheW91dC5zaXplKSxcbiAgICAgICAgICBTaXplOiBidWZmZXIubGF5b3V0LnNpemUsXG4gICAgICAgICAgQnl0ZXM6IGJ1ZmZlci5kYXRhLmxlbmd0aCAqIGJ1ZmZlci5kYXRhLkJZVEVTX1BFUl9FTEVNRU5UXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIExvY2F0aW9uOiBsb2NhdGlvbixcbiAgICAgICAgVHlwZTogYXR0cmlidXRlLnZhbHVlLmNvbnN0cnVjdG9yLm5hbWUsXG4gICAgICAgIEluc3RhbmNlZDogYXR0cmlidXRlLmluc3RhbmNlZCxcbiAgICAgICAgVmVydHM6IHJvdW5kKGF0dHJpYnV0ZS52YWx1ZS5sZW5ndGggLyBhdHRyaWJ1dGUuc2l6ZSksXG4gICAgICAgIFNpemU6IGF0dHJpYnV0ZS5zaXplLFxuICAgICAgICBCeXRlczogYXR0cmlidXRlLnZhbHVlLmxlbmd0aCAqIGF0dHJpYnV0ZS52YWx1ZS5CWVRFU19QRVJfRUxFTUVOVFxuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIExvY2F0aW9uOiBsb2NhdGlvbixcbiAgICAgIFR5cGU6ICdOT1QgUFJPVklERUQnLFxuICAgICAgSW5zdGFuY2VkOiAnTi9BJyxcbiAgICAgIFZlcnRzOiAnTi9BJyxcbiAgICAgIFNpemU6ICdOL0EnLFxuICAgICAgQnl0ZXM6ICdOL0EnXG4gICAgfTtcbiAgfVxuXG4gIC8vIERFUFJFQ0FURUQgLyBSRU1PVkVEXG4gIHNldFRleHR1cmVzKHRleHR1cmVzID0gW10pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRleHR1cmVzIHJlcGxhY2VkIHdpdGggc2V0VW5pZm9ybXMnKTtcbiAgfVxuXG4gIGJpbmRUZXh0dXJlcyhmb3JjZSA9IGZhbHNlKSB7XG4gICAgY29uc29sZS53YXJuKCdNb2RlbC5iaW5kVGV4dHVyZXMgaXMgZGVwcmVjYXRlZCcpO1xuICAgIGNvbnN0IHRleHR1cmVzID0gc3BsYXQodGhpcy50ZXh0dXJlcyk7XG4gICAgbGV0IHRleDJEID0gMDtcblxuICAgIC8vIGNvbnN0IHRleEN1YmUgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTUFYX1RFWFRVUkVTOyBpKyspIHtcbiAgICAgIGlmIChpIDwgdGV4dHVyZXMubGVuZ3RoKSB7XG4gICAgICAgIC8vIHJ5ZSBUT0RPOiB1cGRhdGUgdGhpcyB3aGVuIFRleHR1cmVDdWJlIGlzIGltcGxlbWVudGVkLlxuICAgICAgICAvLyBjb25zdCBpc0N1YmUgPSBhcHAudGV4dHVyZU1lbW9bdGV4dHVyZXNbaV1dLmlzQ3ViZTtcbiAgICAgICAgLy8gaWYgKGlzQ3ViZSkge1xuICAgICAgICAvLyBwcm9ncmFtLnNldFRleHR1cmUodGV4dHVyZXNbaV0sIGdsWydURVhUVVJFJyArIGldKTtcbiAgICAgICAgLy8gcHJvZ3JhbS5zZXRVbmlmb3Jtcyh7XG4gICAgICAgIC8vICAgWydoYXNUZXh0dXJlQ3ViZScgKyAoaSArIDEpXTogdHJ1ZSxcbiAgICAgICAgLy8gICBbc2FtcGxlckN1YmUnICsgKHRleEN1YmUgKyAxKV06IGlcbiAgICAgICAgLy8gfSlcbiAgICAgICAgLy8gdGV4Q3ViZSsrO1xuICAgICAgICAvLyB9IGVsc2Uge1xuICAgICAgICB0aGlzLnNldFVuaWZvcm1zKHtcbiAgICAgICAgICBbYGhhc1RleHR1cmUke2kgKyAxfWBdOiB0cnVlLFxuICAgICAgICAgIFtgc2FtcGxlciR7dGV4MkQgKyAxfWBdOiB0ZXh0dXJlc1tpXVxuICAgICAgICB9KTtcbiAgICAgICAgdGV4MkQrKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc2V0VW5pZm9ybXMoe1xuICAgICAgICAgIFtgaGFzVGV4dHVyZUN1YmUke2kgKyAxfWBdOiBmYWxzZSxcbiAgICAgICAgICBbYGhhc1RleHR1cmUke2kgKyAxfWBdOiBmYWxzZVxuICAgICAgICAgIC8vIFtgc2FtcGxlciR7Kyt0ZXgyRH1gXTogaSxcbiAgICAgICAgICAvLyBbYHNhbXBsZXJDdWJlJHsrK3RleEN1YmV9YF06IGlcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG4iXX0=