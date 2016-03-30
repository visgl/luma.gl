'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Material = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _webgl = require('../webgl');

var _utils = require('../utils');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _object3d = require('./object-3d');

var _object3d2 = _interopRequireDefault(_object3d);

var _config = require('../config');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
    var _ref2$textures = _ref2.textures;
    var textures = _ref2$textures === undefined ? [] : _ref2$textures;
    var _ref2$instanced = _ref2.instanced;
    var
    // Enable instanced rendering (requires shader support and extra attributes)
    instanced = _ref2$instanced === undefined ? false : _ref2$instanced;
    var _ref2$instanceCount = _ref2.instanceCount;
    var instanceCount = _ref2$instanceCount === undefined ? 0 : _ref2$instanceCount;
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
    var onBeforeRender = _ref2$onBeforeRender === undefined ? null : _ref2$onBeforeRender;
    var _ref2$onAfterRender = _ref2.onAfterRender;
    var onAfterRender = _ref2$onAfterRender === undefined ? null : _ref2$onAfterRender;

    var opts = _objectWithoutProperties(_ref2, ['program', 'geometry', 'material', 'textures', 'instanced', 'instanceCount', 'pickable', 'pick', 'uniforms', 'attributes', 'render', 'onBeforeRender', 'onAfterRender']);

    _classCallCheck(this, Model);

    // assert(program || program instanceof Program);
    (0, _assert2.default)(program);
    (0, _assert2.default)(geometry);

    // set a custom program per o3d

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Model).call(this, opts));

    _this.program = program;
    _this.geometry = geometry;
    _this.material = material;

    // instanced rendering
    _this.instanced = instanced;
    _this.instanceCount = instanceCount;

    // picking options
    _this.pickable = Boolean(pickable);
    _this.pick = pick || function () {
      return false;
    };

    // extra uniforms and attribute descriptors
    _this.uniforms = uniforms;
    _this.attributes = attributes;

    // override the render method, before and after render callbacks
    _this.render = render || _this.render;
    _this.onBeforeRender = onBeforeRender || _this.onBeforeRender;
    _this.onAfterRender = onAfterRender || _this.onAfterRender;

    _this.buffers = {};
    _this.userData = {};

    _this.textures = (0, _utils.splat)(textures);

    // TODO - remove?
    _this.dynamic = false;

    Object.seal(_this);
    return _this;
  }
  /* eslint-enable max-statements */
  /* eslint-enable complexity */

  _createClass(Model, [{
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
    key: 'getVertexCount',
    value: function getVertexCount() {
      return this.geometry.getVertexCount();
    }
  }, {
    key: 'getProgram',
    value: function getProgram() {
      return this.program;
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
    key: 'getUniforms',
    value: function getUniforms() {
      return this.uniforms;
    }
  }, {
    key: 'setUniforms',
    value: function setUniforms() {
      var uniforms = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      Object.assign(this.uniforms, uniforms);
      return this;
    }
  }, {
    key: 'onBeforeRender',
    value: function onBeforeRender() {
      var program = this.program;
      var attributes = this.attributes;

      program.use();
      this.setAttributes(attributes);
      return this;
    }
  }, {
    key: 'render',
    value: function render(gl, _ref3) {
      var viewMatrix = _ref3.viewMatrix;
      var program = this.program;

      program.setUniforms(this.getCoordinateUniforms(viewMatrix));

      var geometry = this.geometry;
      var instanced = this.instanced;
      var instanceCount = this.instanceCount;
      var drawMode = geometry.drawMode;
      var attributes = geometry.attributes;
      var indices = attributes.indices;
      var vertices = attributes.vertices;

      var vertexCount = indices ? indices.length : vertices.length / 3;
      (0, _webgl.draw)(gl, {
        drawMode: drawMode,
        vertexCount: vertexCount,
        indexed: Boolean(indices),
        instanced: instanced,
        instanceCount: instanceCount
      });
    }
  }, {
    key: 'onAfterRender',
    value: function onAfterRender() {
      var program = this.program;
      var attributes = this.attributes;

      program.use();
      this.unsetAttributes(attributes);
      return this;
    }
  }, {
    key: 'setProgramState',
    value: function setProgramState() {
      var program = this.program;

      program.setUniforms(this.uniforms);
      this.setAttributes(this.attributes);
      this.setAttributes(this.geometry.attributes);
      this.setTextures(program);

      // this.setVertices(program);
      // this.setColors(program);
      // this.setPickingColors(program);
      // this.setNormals(program);
      // this.setTexCoords(program);
      // this.setIndices(program);
      return this;
    }
  }, {
    key: 'unsetProgramState',
    value: function unsetProgramState() {
      var program = this.program;

      var gl = program.gl;

      // unbind the array and element buffers
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

      var attributes = program.attributes;
      for (var name in attributes) {
        gl.disableVertexAttribArray(attributes[name]);
      }
      return this;
    }

    // Makes sure buffers are created for all attributes
    // and that the program is updated with those buffers
    // TODO - do we need the separation between "attributes" and "buffers"
    //  couldn't apps just create buffers directly?

  }, {
    key: 'setAttributes',
    value: function setAttributes(attributes) {
      (0, _assert2.default)(attributes);
      var program = this.program;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Object.keys(attributes)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var attributeName = _step.value;

          var attribute = attributes[attributeName];
          var bufferOpts = {
            attribute: attributeName,
            data: attribute.value,
            size: attribute.size,
            instanced: attribute.instanced ? 1 : 0,
            bufferType: attribute.bufferType || program.gl.ARRAY_BUFFER,
            drawMode: attribute.drawMode || program.gl.STATIC_DRAW
          };
          if (!this.buffers[attributeName]) {
            this.buffers[attributeName] = new _webgl.Buffer(program.gl, bufferOpts);
          } else {
            this.buffers[attributeName].update(bufferOpts);
          }
          program.setBuffer(this.buffers[attributeName]);
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

      return this;
    }
  }, {
    key: 'unsetAttributes',
    value: function unsetAttributes(attributes) {
      (0, _assert2.default)(attributes);
      var program = this.program;
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = Object.keys(attributes)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var attributeName = _step2.value;

          (0, _assert2.default)(this.buffers[attributeName]);
          program.unsetBuffer(this.buffers[attributeName]);
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      return this;
    }
  }, {
    key: 'setTextures',
    value: function setTextures() {
      var force = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];
      var program = this.program;

      this.textures = this.textures ? (0, _utils.splat)(this.textures) : [];
      var tex2D = 0;
      var texCube = 0;
      var mtexs = _config.MAX_TEXTURES;
      for (var i = 0, texs = this.textures, l = texs.length; i < mtexs; i++) {
        if (i < l) {
          // rye TODO: update this when TextureCube is implemented.
          // const isCube = app.textureMemo[texs[i]].isCube;
          // if (isCube) {
          //   program.setUniform('hasTextureCube' + (i + 1), true);
          //   program.setTexture(texs[i], gl['TEXTURE' + i]);
          //   program.setUniform('samplerCube' + (texCube + 1), i);
          //   texCube++;
          // } else {
          program.setUniform('hasTexture' + (i + 1), true);
          program.setTexture(texs[i], tex2D);
          program.setUniform('sampler' + (tex2D + 1), i);
          tex2D++;
          // }
        } else {
            program.setUniform('hasTextureCube' + (i + 1), false);
            program.setUniform('hasTexture' + (i + 1), false);
            program.setUniform('sampler' + ++tex2D, i);
            program.setUniform('samplerCube' + ++texCube, i);
          }
      }
      return this;
    }

    // TODO - remove
    /*
    setTexCoords(program) {
      if (!this.$texCoords) {
        return;
      }
       const gl = program.gl;
      const multi = this.$texCoords.constructor.name === 'Object';
      let tex;
       if (!this.buffers.texCoords) {
        if (multi) {
          this.buffers.texCoords = {};
          for (let i = 0, txs = this.textures, l = txs.length; i < l; i++) {
            tex = txs[i];
            this.buffers.texCoords['texCoord' + (i + 1)] = new Buffer(gl, {
              attribute: 'texCoord' + (i + 1),
              data: this.$texCoords[tex],
              size: 2
            });
          }
        } else {
          this.buffers.texCoords = new Buffer(gl, {
            attribute: 'texCoord1',
            data: this.$texCoords,
            size: 2
          });
        }
      } else if (this.dynamic) {
        if (multi) {
          for (let i = 0, txs = this.textures, l = txs.length; i < l; i++) {
            tex = txs[i];
            this.buffers.texCoords['texCoord' + (i + 1)].update({
              data: this.$texCoords[tex]
            });
          }
        } else {
          this.buffers.texCoords.update({
            data: this.$texCoords
          });
        }
      }
       if (multi) {
        for (let i = 0, txs = this.textures, l = txs.length; i < l; i++) {
          tex = txs[i];
          program.setBuffer(this.buffers.texCoords['texCoord' + (i + 1)]);
        }
      } else {
        program.setBuffer(this.buffers.texCoords);
      }
    }
     setVertices(program) {
      if (!this.$vertices) {
        return;
      }
      if (!this.buffers.position) {
        this.buffers.position = new Buffer(program.gl, {
          attribute: 'position',
          data: this.$vertices,
          size: 3
        });
      } else if (this.dynamic) {
        this.buffers.position.update({
          data: this.$vertices
        });
      }
       program.setBuffer(this.buffers.position);
    }
     setNormals(program) {
      if (!this.$normals) {
        return;
      }
       if (!this.buffers.normal) {
        this.buffers.normal = new Buffer(program.gl, {
          attribute: 'normal',
          data: this.$normals,
          size: 3
        });
      } else if (this.dynamic) {
        this.buffers.normal.update({
          data: this.$normals
        });
      }
       program.setBuffer(this.buffers.normal);
    }
     setIndices(program) {
      if (!this.$indices) {
        return;
      }
       const gl = program.gl;
       if (!this.buffers.indices) {
        this.buffers.indices = new Buffer(program.gl, {
          bufferType: gl.ELEMENT_ARRAY_BUFFER,
          drawMode: gl.STATIC_DRAW,
          data: this.$indices,
          size: 1
        });
      } else if (this.dynamic) {
        this.buffers.indices.update({
          data: this.$indices
        });
      }
       program.setBuffer(this.buffers.indices);
    }
     setPickingColors(program) {
      if (!this.$pickingColors) {
        return;
      }
       if (!this.buffers.pickingColors) {
        this.buffers.pickingColors = new Buffer(program.gl, {
          attribute: 'pickingColor',
          data: this.$pickingColors,
          size: 4
        });
      } else if (this.dynamic) {
        this.buffers.pickingColors.update({
          data: this.$pickingColors
        });
      }
       program.setBuffer(this.buffers.pickingColors);
    }
     setColors(program) {
      if (!this.$colors) {
        return;
      }
       if (!this.buffers.colors) {
        this.buffers.colors = new Buffer(program.gl, {
          attribute: 'color',
          data: this.$colors,
          size: 4
        });
      } else if (this.dynamic) {
        this.buffers.colors.update({
          data: this.$colors
        });
      }
       program.setBuffer(this.buffers.colors);
    }
    */

  }, {
    key: 'hash',
    get: function get() {
      return this.id + ' ' + this.$pickingIndex;
    }
  }]);

  return Model;
}(_object3d2.default);

exports.default = Model;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2VuZWdyYXBoL21vZGVsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQVdhLDhCQUNYLFNBRFcsUUFDWCxHQUFrRTttRUFBSixrQkFBSTs7NEJBQXJELFVBQXFEO01BQXJELDJDQUFZLG1CQUF5Qzs2QkFBdEMsV0FBc0M7TUFBdEMsNkNBQWEsb0JBQXlCOzZCQUF0QixXQUFzQjtNQUF0Qiw2Q0FBYSxvQkFBUzs7d0JBRHZELFVBQ3VEOztBQUNoRSxPQUFLLFNBQUwsR0FBaUIsU0FBakIsQ0FEZ0U7QUFFaEUsT0FBSyxVQUFMLEdBQWtCLFVBQWxCLENBRmdFO0FBR2hFLE9BQUssVUFBTCxHQUFrQixVQUFsQixDQUhnRTtDQUFsRTs7Ozs7SUFRbUI7Ozs7OztBQUluQixXQUptQixLQUluQixHQWFRO3NFQUFKLGtCQUFJOztRQVpOLHdCQVlNO1FBWE4sMEJBV007K0JBVk4sU0FVTTtRQVZOLDBDQUFXLHNCQVVMOytCQVZXLFNBVVg7UUFWVywwQ0FBVyxvQkFVdEI7Z0NBUk4sVUFRTTs7O0FBUk4sZ0RBQVksd0JBUU47b0NBUmEsY0FRYjtRQVJhLG9EQUFnQix3QkFRN0I7K0JBTk4sU0FNTTs7O0FBTk4sOENBQVcsdUJBTUw7MkJBTlksS0FNWjtRQU5ZLGtDQUFPLGtCQU1uQjsrQkFKTixTQUlNOzs7QUFKTiw4Q0FBVyxvQkFJTDtpQ0FITixXQUdNO1FBSE4sOENBQWEsc0JBR1A7NkJBRk4sT0FFTTtRQUZOLHNDQUFTLG9CQUVIO3FDQUZTLGVBRVQ7UUFGUyxzREFBaUIsNEJBRTFCO29DQUZnQyxjQUVoQztRQUZnQyxvREFBZ0IsMkJBRWhEOztRQURILGlOQUNHOzswQkFqQlcsT0FpQlg7OztBQUVOLDBCQUFPLE9BQVAsRUFGTTtBQUdOLDBCQUFPLFFBQVAsRUFITTs7Ozt1RUFqQlcsa0JBc0JYLE9BTEE7O0FBUU4sVUFBSyxPQUFMLEdBQWUsT0FBZixDQVJNO0FB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Ozs7O0FBU1Qsa0JBQVEsVUFBUixDQUFtQixnQkFBZ0IsSUFBSSxDQUFKLENBQWhCLEVBQXdCLElBQTNDLEVBVFM7QUFVVCxrQkFBUSxVQUFSLENBQW1CLEtBQUssQ0FBTCxDQUFuQixFQUE0QixLQUE1QixFQVZTO0FBV1Qsa0JBQVEsVUFBUixDQUFtQixhQUFhLFFBQVEsQ0FBUixDQUFiLEVBQXlCLENBQTVDLEVBWFM7QUFZVDs7QUFaUyxTQUFYLE1BY087QUFDTCxvQkFBUSxVQUFSLENBQW1CLG9CQUFvQixJQUFJLENBQUosQ0FBcEIsRUFBNEIsS0FBL0MsRUFESztBQUVMLG9CQUFRLFVBQVIsQ0FBbUIsZ0JBQWdCLElBQUksQ0FBSixDQUFoQixFQUF3QixLQUEzQyxFQUZLO0FBR0wsb0JBQVEsVUFBUixDQUFtQixZQUFhLEVBQUUsS0FBRixFQUFVLENBQTFDLEVBSEs7QUFJTCxvQkFBUSxVQUFSLENBQW1CLGdCQUFpQixFQUFFLE9BQUYsRUFBWSxDQUFoRCxFQUpLO1dBZFA7T0FERjtBQXNCQSxhQUFPLElBQVAsQ0E1QnlCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7d0JBM0loQjtBQUNULGFBQU8sS0FBSyxFQUFMLEdBQVUsR0FBVixHQUFnQixLQUFLLGFBQUwsQ0FEZDs7OztTQTNEUSIsImZpbGUiOiJtb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIEEgc2NlbmVncmFwaCBvYmplY3Qgbm9kZVxuLyogZXNsaW50LWRpc2FibGUgZ3VhcmQtZm9yLWluICovXG5cbi8vIERlZmluZSBzb21lIGxvY2Fsc1xuaW1wb3J0IHtCdWZmZXIsIGRyYXd9IGZyb20gJy4uL3dlYmdsJztcbmltcG9ydCB7c3BsYXR9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcbmltcG9ydCBPYmplY3QzRCBmcm9tICcuL29iamVjdC0zZCc7XG5pbXBvcnQge01BWF9URVhUVVJFU30gZnJvbSAnLi4vY29uZmlnJztcblxuLy8gVE9ETyAtIGV4cGVyaW1lbnRhbCwgbm90IHlldCB1c2VkXG5leHBvcnQgY2xhc3MgTWF0ZXJpYWwge1xuICBjb25zdHJ1Y3Rvcih7c2hpbmluZXNzID0gMCwgcmVmbGVjdGlvbiA9IDAsIHJlZnJhY3Rpb24gPSAwfSA9IHt9KSB7XG4gICAgdGhpcy5zaGluaW5lc3MgPSBzaGluaW5lc3M7XG4gICAgdGhpcy5yZWZsZWN0aW9uID0gcmVmbGVjdGlvbjtcbiAgICB0aGlzLnJlZnJhY3Rpb24gPSByZWZyYWN0aW9uO1xuICB9XG59XG5cbi8vIE1vZGVsIGFic3RyYWN0IE8zRCBDbGFzc1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTW9kZWwgZXh0ZW5kcyBPYmplY3QzRCB7XG5cbiAgLyogZXNsaW50LWRpc2FibGUgbWF4LXN0YXRlbWVudHMgICovXG4gIC8qIGVzbGludC1kaXNhYmxlIGNvbXBsZXhpdHkgICovXG4gIGNvbnN0cnVjdG9yKHtcbiAgICBwcm9ncmFtLFxuICAgIGdlb21ldHJ5LFxuICAgIG1hdGVyaWFsID0gbnVsbCwgdGV4dHVyZXMgPSBbXSxcbiAgICAvLyBFbmFibGUgaW5zdGFuY2VkIHJlbmRlcmluZyAocmVxdWlyZXMgc2hhZGVyIHN1cHBvcnQgYW5kIGV4dHJhIGF0dHJpYnV0ZXMpXG4gICAgaW5zdGFuY2VkID0gZmFsc2UsIGluc3RhbmNlQ291bnQgPSAwLFxuICAgIC8vIFBpY2tpbmdcbiAgICBwaWNrYWJsZSA9IGZhbHNlLCBwaWNrID0gbnVsbCxcbiAgICAvLyBFeHRyYSB1bmlmb3JtcyBhbmQgYXR0cmlidXRlcyAoYmV5b25kIGdlb21ldHJ5LCBtYXRlcmlhbCwgY2FtZXJhKVxuICAgIHVuaWZvcm1zID0ge30sXG4gICAgYXR0cmlidXRlcyA9IHt9LFxuICAgIHJlbmRlciA9IG51bGwsIG9uQmVmb3JlUmVuZGVyID0gbnVsbCwgb25BZnRlclJlbmRlciA9IG51bGwsXG4gICAgLi4ub3B0c1xuICB9ID0ge30pIHtcbiAgICAvLyBhc3NlcnQocHJvZ3JhbSB8fCBwcm9ncmFtIGluc3RhbmNlb2YgUHJvZ3JhbSk7XG4gICAgYXNzZXJ0KHByb2dyYW0pO1xuICAgIGFzc2VydChnZW9tZXRyeSk7XG5cbiAgICBzdXBlcihvcHRzKTtcblxuICAgIC8vIHNldCBhIGN1c3RvbSBwcm9ncmFtIHBlciBvM2RcbiAgICB0aGlzLnByb2dyYW0gPSBwcm9ncmFtO1xuICAgIHRoaXMuZ2VvbWV0cnkgPSBnZW9tZXRyeTtcbiAgICB0aGlzLm1hdGVyaWFsID0gbWF0ZXJpYWw7XG5cbiAgICAvLyBpbnN0YW5jZWQgcmVuZGVyaW5nXG4gICAgdGhpcy5pbnN0YW5jZWQgPSBpbnN0YW5jZWQ7XG4gICAgdGhpcy5pbnN0YW5jZUNvdW50ID0gaW5zdGFuY2VDb3VudDtcblxuICAgIC8vIHBpY2tpbmcgb3B0aW9uc1xuICAgIHRoaXMucGlja2FibGUgPSBCb29sZWFuKHBpY2thYmxlKTtcbiAgICB0aGlzLnBpY2sgPSBwaWNrIHx8ICgoKSA9PiBmYWxzZSk7XG5cbiAgICAvLyBleHRyYSB1bmlmb3JtcyBhbmQgYXR0cmlidXRlIGRlc2NyaXB0b3JzXG4gICAgdGhpcy51bmlmb3JtcyA9IHVuaWZvcm1zO1xuICAgIHRoaXMuYXR0cmlidXRlcyA9IGF0dHJpYnV0ZXM7XG5cbiAgICAvLyBvdmVycmlkZSB0aGUgcmVuZGVyIG1ldGhvZCwgYmVmb3JlIGFuZCBhZnRlciByZW5kZXIgY2FsbGJhY2tzXG4gICAgdGhpcy5yZW5kZXIgPSByZW5kZXIgfHwgdGhpcy5yZW5kZXI7XG4gICAgdGhpcy5vbkJlZm9yZVJlbmRlciA9IG9uQmVmb3JlUmVuZGVyIHx8IHRoaXMub25CZWZvcmVSZW5kZXI7XG4gICAgdGhpcy5vbkFmdGVyUmVuZGVyID0gb25BZnRlclJlbmRlciB8fCB0aGlzLm9uQWZ0ZXJSZW5kZXI7XG5cbiAgICB0aGlzLmJ1ZmZlcnMgPSB7fTtcbiAgICB0aGlzLnVzZXJEYXRhID0ge307XG5cbiAgICB0aGlzLnRleHR1cmVzID0gc3BsYXQodGV4dHVyZXMpO1xuXG4gICAgLy8gVE9ETyAtIHJlbW92ZT9cbiAgICB0aGlzLmR5bmFtaWMgPSBmYWxzZTtcblxuICAgIE9iamVjdC5zZWFsKHRoaXMpO1xuICB9XG4gIC8qIGVzbGludC1lbmFibGUgbWF4LXN0YXRlbWVudHMgKi9cbiAgLyogZXNsaW50LWVuYWJsZSBjb21wbGV4aXR5ICovXG5cbiAgZ2V0IGhhc2goKSB7XG4gICAgcmV0dXJuIHRoaXMuaWQgKyAnICcgKyB0aGlzLiRwaWNraW5nSW5kZXg7XG4gIH1cblxuICBzZXRJbnN0YW5jZUNvdW50KGluc3RhbmNlQ291bnQpIHtcbiAgICBhc3NlcnQoaW5zdGFuY2VDb3VudCAhPT0gdW5kZWZpbmVkKTtcbiAgICB0aGlzLmluc3RhbmNlQ291bnQgPSBpbnN0YW5jZUNvdW50O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZ2V0SW5zdGFuY2VDb3VudCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnN0YW5jZUNvdW50O1xuICB9XG5cbiAgZ2V0VmVydGV4Q291bnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2VvbWV0cnkuZ2V0VmVydGV4Q291bnQoKTtcbiAgfVxuXG4gIGdldFByb2dyYW0oKSB7XG4gICAgcmV0dXJuIHRoaXMucHJvZ3JhbTtcbiAgfVxuXG4gIGlzUGlja2FibGUoKSB7XG4gICAgcmV0dXJuIHRoaXMucGlja2FibGU7XG4gIH1cblxuICBzZXRQaWNrYWJsZShwaWNrYWJsZSA9IHRydWUpIHtcbiAgICB0aGlzLnBpY2thYmxlID0gQm9vbGVhbihwaWNrYWJsZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXRVbmlmb3JtcygpIHtcbiAgICByZXR1cm4gdGhpcy51bmlmb3JtcztcbiAgfVxuXG4gIHNldFVuaWZvcm1zKHVuaWZvcm1zID0ge30pIHtcbiAgICBPYmplY3QuYXNzaWduKHRoaXMudW5pZm9ybXMsIHVuaWZvcm1zKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIG9uQmVmb3JlUmVuZGVyKCkge1xuICAgIGNvbnN0IHtwcm9ncmFtLCBhdHRyaWJ1dGVzfSA9IHRoaXM7XG4gICAgcHJvZ3JhbS51c2UoKTtcbiAgICB0aGlzLnNldEF0dHJpYnV0ZXMoYXR0cmlidXRlcyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByZW5kZXIoZ2wsIHt2aWV3TWF0cml4fSkge1xuICAgIGNvbnN0IHtwcm9ncmFtfSA9IHRoaXM7XG4gICAgcHJvZ3JhbS5zZXRVbmlmb3Jtcyh0aGlzLmdldENvb3JkaW5hdGVVbmlmb3Jtcyh2aWV3TWF0cml4KSk7XG5cbiAgICBjb25zdCB7Z2VvbWV0cnksIGluc3RhbmNlZCwgaW5zdGFuY2VDb3VudH0gPSB0aGlzO1xuICAgIGNvbnN0IHtkcmF3TW9kZSwgYXR0cmlidXRlc30gPSBnZW9tZXRyeTtcbiAgICBjb25zdCB7aW5kaWNlcywgdmVydGljZXN9ID0gYXR0cmlidXRlcztcbiAgICBjb25zdCB2ZXJ0ZXhDb3VudCA9IGluZGljZXMgPyBpbmRpY2VzLmxlbmd0aCA6IHZlcnRpY2VzLmxlbmd0aCAvIDM7XG4gICAgZHJhdyhnbCwge1xuICAgICAgZHJhd01vZGUsXG4gICAgICB2ZXJ0ZXhDb3VudCxcbiAgICAgIGluZGV4ZWQ6IEJvb2xlYW4oaW5kaWNlcyksXG4gICAgICBpbnN0YW5jZWQsXG4gICAgICBpbnN0YW5jZUNvdW50XG4gICAgfSk7XG4gIH1cblxuICBvbkFmdGVyUmVuZGVyKCkge1xuICAgIGNvbnN0IHtwcm9ncmFtLCBhdHRyaWJ1dGVzfSA9IHRoaXM7XG4gICAgcHJvZ3JhbS51c2UoKTtcbiAgICB0aGlzLnVuc2V0QXR0cmlidXRlcyhhdHRyaWJ1dGVzKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFByb2dyYW1TdGF0ZSgpIHtcbiAgICBjb25zdCB7cHJvZ3JhbX0gPSB0aGlzO1xuICAgIHByb2dyYW0uc2V0VW5pZm9ybXModGhpcy51bmlmb3Jtcyk7XG4gICAgdGhpcy5zZXRBdHRyaWJ1dGVzKHRoaXMuYXR0cmlidXRlcyk7XG4gICAgdGhpcy5zZXRBdHRyaWJ1dGVzKHRoaXMuZ2VvbWV0cnkuYXR0cmlidXRlcyk7XG4gICAgdGhpcy5zZXRUZXh0dXJlcyhwcm9ncmFtKTtcblxuICAgIC8vIHRoaXMuc2V0VmVydGljZXMocHJvZ3JhbSk7XG4gICAgLy8gdGhpcy5zZXRDb2xvcnMocHJvZ3JhbSk7XG4gICAgLy8gdGhpcy5zZXRQaWNraW5nQ29sb3JzKHByb2dyYW0pO1xuICAgIC8vIHRoaXMuc2V0Tm9ybWFscyhwcm9ncmFtKTtcbiAgICAvLyB0aGlzLnNldFRleENvb3Jkcyhwcm9ncmFtKTtcbiAgICAvLyB0aGlzLnNldEluZGljZXMocHJvZ3JhbSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB1bnNldFByb2dyYW1TdGF0ZSgpIHtcbiAgICBjb25zdCB7cHJvZ3JhbX0gPSB0aGlzO1xuICAgIGNvbnN0IGdsID0gcHJvZ3JhbS5nbDtcblxuICAgIC8vIHVuYmluZCB0aGUgYXJyYXkgYW5kIGVsZW1lbnQgYnVmZmVyc1xuICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBudWxsKTtcbiAgICBnbC5iaW5kQnVmZmVyKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBudWxsKTtcblxuICAgIHZhciBhdHRyaWJ1dGVzID0gcHJvZ3JhbS5hdHRyaWJ1dGVzO1xuICAgIGZvciAodmFyIG5hbWUgaW4gYXR0cmlidXRlcykge1xuICAgICAgZ2wuZGlzYWJsZVZlcnRleEF0dHJpYkFycmF5KGF0dHJpYnV0ZXNbbmFtZV0pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIE1ha2VzIHN1cmUgYnVmZmVycyBhcmUgY3JlYXRlZCBmb3IgYWxsIGF0dHJpYnV0ZXNcbiAgLy8gYW5kIHRoYXQgdGhlIHByb2dyYW0gaXMgdXBkYXRlZCB3aXRoIHRob3NlIGJ1ZmZlcnNcbiAgLy8gVE9ETyAtIGRvIHdlIG5lZWQgdGhlIHNlcGFyYXRpb24gYmV0d2VlbiBcImF0dHJpYnV0ZXNcIiBhbmQgXCJidWZmZXJzXCJcbiAgLy8gIGNvdWxkbid0IGFwcHMganVzdCBjcmVhdGUgYnVmZmVycyBkaXJlY3RseT9cbiAgc2V0QXR0cmlidXRlcyhhdHRyaWJ1dGVzKSB7XG4gICAgYXNzZXJ0KGF0dHJpYnV0ZXMpO1xuICAgIGNvbnN0IHtwcm9ncmFtfSA9IHRoaXM7XG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGVOYW1lIG9mIE9iamVjdC5rZXlzKGF0dHJpYnV0ZXMpKSB7XG4gICAgICBjb25zdCBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdO1xuICAgICAgY29uc3QgYnVmZmVyT3B0cyA9IHtcbiAgICAgICAgYXR0cmlidXRlOiBhdHRyaWJ1dGVOYW1lLFxuICAgICAgICBkYXRhOiBhdHRyaWJ1dGUudmFsdWUsXG4gICAgICAgIHNpemU6IGF0dHJpYnV0ZS5zaXplLFxuICAgICAgICBpbnN0YW5jZWQ6IGF0dHJpYnV0ZS5pbnN0YW5jZWQgPyAxIDogMCxcbiAgICAgICAgYnVmZmVyVHlwZTogYXR0cmlidXRlLmJ1ZmZlclR5cGUgfHwgcHJvZ3JhbS5nbC5BUlJBWV9CVUZGRVIsXG4gICAgICAgIGRyYXdNb2RlOiBhdHRyaWJ1dGUuZHJhd01vZGUgfHwgcHJvZ3JhbS5nbC5TVEFUSUNfRFJBV1xuICAgICAgfTtcbiAgICAgIGlmICghdGhpcy5idWZmZXJzW2F0dHJpYnV0ZU5hbWVdKSB7XG4gICAgICAgIHRoaXMuYnVmZmVyc1thdHRyaWJ1dGVOYW1lXSA9IG5ldyBCdWZmZXIocHJvZ3JhbS5nbCwgYnVmZmVyT3B0cyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmJ1ZmZlcnNbYXR0cmlidXRlTmFtZV0udXBkYXRlKGJ1ZmZlck9wdHMpO1xuICAgICAgfVxuICAgICAgcHJvZ3JhbS5zZXRCdWZmZXIodGhpcy5idWZmZXJzW2F0dHJpYnV0ZU5hbWVdKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB1bnNldEF0dHJpYnV0ZXMoYXR0cmlidXRlcykge1xuICAgIGFzc2VydChhdHRyaWJ1dGVzKTtcbiAgICBjb25zdCB7cHJvZ3JhbX0gPSB0aGlzO1xuICAgIGZvciAoY29uc3QgYXR0cmlidXRlTmFtZSBvZiBPYmplY3Qua2V5cyhhdHRyaWJ1dGVzKSkge1xuICAgICAgYXNzZXJ0KHRoaXMuYnVmZmVyc1thdHRyaWJ1dGVOYW1lXSk7XG4gICAgICBwcm9ncmFtLnVuc2V0QnVmZmVyKHRoaXMuYnVmZmVyc1thdHRyaWJ1dGVOYW1lXSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0VGV4dHVyZXMoZm9yY2UgPSBmYWxzZSkge1xuICAgIGNvbnN0IHtwcm9ncmFtfSA9IHRoaXM7XG4gICAgdGhpcy50ZXh0dXJlcyA9IHRoaXMudGV4dHVyZXMgPyBzcGxhdCh0aGlzLnRleHR1cmVzKSA6IFtdO1xuICAgIGxldCB0ZXgyRCA9IDA7XG4gICAgbGV0IHRleEN1YmUgPSAwO1xuICAgIGNvbnN0IG10ZXhzID0gTUFYX1RFWFRVUkVTO1xuICAgIGZvciAobGV0IGkgPSAwLCB0ZXhzID0gdGhpcy50ZXh0dXJlcywgbCA9IHRleHMubGVuZ3RoOyBpIDwgbXRleHM7IGkrKykge1xuICAgICAgaWYgKGkgPCBsKSB7XG4gICAgICAgIC8vIHJ5ZSBUT0RPOiB1cGRhdGUgdGhpcyB3aGVuIFRleHR1cmVDdWJlIGlzIGltcGxlbWVudGVkLlxuICAgICAgICAvLyBjb25zdCBpc0N1YmUgPSBhcHAudGV4dHVyZU1lbW9bdGV4c1tpXV0uaXNDdWJlO1xuICAgICAgICAvLyBpZiAoaXNDdWJlKSB7XG4gICAgICAgIC8vICAgcHJvZ3JhbS5zZXRVbmlmb3JtKCdoYXNUZXh0dXJlQ3ViZScgKyAoaSArIDEpLCB0cnVlKTtcbiAgICAgICAgLy8gICBwcm9ncmFtLnNldFRleHR1cmUodGV4c1tpXSwgZ2xbJ1RFWFRVUkUnICsgaV0pO1xuICAgICAgICAvLyAgIHByb2dyYW0uc2V0VW5pZm9ybSgnc2FtcGxlckN1YmUnICsgKHRleEN1YmUgKyAxKSwgaSk7XG4gICAgICAgIC8vICAgdGV4Q3ViZSsrO1xuICAgICAgICAvLyB9IGVsc2Uge1xuICAgICAgICBwcm9ncmFtLnNldFVuaWZvcm0oJ2hhc1RleHR1cmUnICsgKGkgKyAxKSwgdHJ1ZSk7XG4gICAgICAgIHByb2dyYW0uc2V0VGV4dHVyZSh0ZXhzW2ldLCB0ZXgyRCk7XG4gICAgICAgIHByb2dyYW0uc2V0VW5pZm9ybSgnc2FtcGxlcicgKyAodGV4MkQgKyAxKSwgaSk7XG4gICAgICAgIHRleDJEKys7XG4gICAgICAgIC8vIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHByb2dyYW0uc2V0VW5pZm9ybSgnaGFzVGV4dHVyZUN1YmUnICsgKGkgKyAxKSwgZmFsc2UpO1xuICAgICAgICBwcm9ncmFtLnNldFVuaWZvcm0oJ2hhc1RleHR1cmUnICsgKGkgKyAxKSwgZmFsc2UpO1xuICAgICAgICBwcm9ncmFtLnNldFVuaWZvcm0oJ3NhbXBsZXInICsgKCsrdGV4MkQpLCBpKTtcbiAgICAgICAgcHJvZ3JhbS5zZXRVbmlmb3JtKCdzYW1wbGVyQ3ViZScgKyAoKyt0ZXhDdWJlKSwgaSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gVE9ETyAtIHJlbW92ZVxuICAvKlxuICBzZXRUZXhDb29yZHMocHJvZ3JhbSkge1xuICAgIGlmICghdGhpcy4kdGV4Q29vcmRzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZ2wgPSBwcm9ncmFtLmdsO1xuICAgIGNvbnN0IG11bHRpID0gdGhpcy4kdGV4Q29vcmRzLmNvbnN0cnVjdG9yLm5hbWUgPT09ICdPYmplY3QnO1xuICAgIGxldCB0ZXg7XG5cbiAgICBpZiAoIXRoaXMuYnVmZmVycy50ZXhDb29yZHMpIHtcbiAgICAgIGlmIChtdWx0aSkge1xuICAgICAgICB0aGlzLmJ1ZmZlcnMudGV4Q29vcmRzID0ge307XG4gICAgICAgIGZvciAobGV0IGkgPSAwLCB0eHMgPSB0aGlzLnRleHR1cmVzLCBsID0gdHhzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgIHRleCA9IHR4c1tpXTtcbiAgICAgICAgICB0aGlzLmJ1ZmZlcnMudGV4Q29vcmRzWyd0ZXhDb29yZCcgKyAoaSArIDEpXSA9IG5ldyBCdWZmZXIoZ2wsIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZTogJ3RleENvb3JkJyArIChpICsgMSksXG4gICAgICAgICAgICBkYXRhOiB0aGlzLiR0ZXhDb29yZHNbdGV4XSxcbiAgICAgICAgICAgIHNpemU6IDJcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5idWZmZXJzLnRleENvb3JkcyA9IG5ldyBCdWZmZXIoZ2wsIHtcbiAgICAgICAgICBhdHRyaWJ1dGU6ICd0ZXhDb29yZDEnLFxuICAgICAgICAgIGRhdGE6IHRoaXMuJHRleENvb3JkcyxcbiAgICAgICAgICBzaXplOiAyXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodGhpcy5keW5hbWljKSB7XG4gICAgICBpZiAobXVsdGkpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIHR4cyA9IHRoaXMudGV4dHVyZXMsIGwgPSB0eHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgdGV4ID0gdHhzW2ldO1xuICAgICAgICAgIHRoaXMuYnVmZmVycy50ZXhDb29yZHNbJ3RleENvb3JkJyArIChpICsgMSldLnVwZGF0ZSh7XG4gICAgICAgICAgICBkYXRhOiB0aGlzLiR0ZXhDb29yZHNbdGV4XVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmJ1ZmZlcnMudGV4Q29vcmRzLnVwZGF0ZSh7XG4gICAgICAgICAgZGF0YTogdGhpcy4kdGV4Q29vcmRzXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChtdWx0aSkge1xuICAgICAgZm9yIChsZXQgaSA9IDAsIHR4cyA9IHRoaXMudGV4dHVyZXMsIGwgPSB0eHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHRleCA9IHR4c1tpXTtcbiAgICAgICAgcHJvZ3JhbS5zZXRCdWZmZXIodGhpcy5idWZmZXJzLnRleENvb3Jkc1sndGV4Q29vcmQnICsgKGkgKyAxKV0pO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBwcm9ncmFtLnNldEJ1ZmZlcih0aGlzLmJ1ZmZlcnMudGV4Q29vcmRzKTtcbiAgICB9XG4gIH1cblxuICBzZXRWZXJ0aWNlcyhwcm9ncmFtKSB7XG4gICAgaWYgKCF0aGlzLiR2ZXJ0aWNlcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuYnVmZmVycy5wb3NpdGlvbikge1xuICAgICAgdGhpcy5idWZmZXJzLnBvc2l0aW9uID0gbmV3IEJ1ZmZlcihwcm9ncmFtLmdsLCB7XG4gICAgICAgIGF0dHJpYnV0ZTogJ3Bvc2l0aW9uJyxcbiAgICAgICAgZGF0YTogdGhpcy4kdmVydGljZXMsXG4gICAgICAgIHNpemU6IDNcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodGhpcy5keW5hbWljKSB7XG4gICAgICB0aGlzLmJ1ZmZlcnMucG9zaXRpb24udXBkYXRlKHtcbiAgICAgICAgZGF0YTogdGhpcy4kdmVydGljZXNcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHByb2dyYW0uc2V0QnVmZmVyKHRoaXMuYnVmZmVycy5wb3NpdGlvbik7XG4gIH1cblxuICBzZXROb3JtYWxzKHByb2dyYW0pIHtcbiAgICBpZiAoIXRoaXMuJG5vcm1hbHMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuYnVmZmVycy5ub3JtYWwpIHtcbiAgICAgIHRoaXMuYnVmZmVycy5ub3JtYWwgPSBuZXcgQnVmZmVyKHByb2dyYW0uZ2wsIHtcbiAgICAgICAgYXR0cmlidXRlOiAnbm9ybWFsJyxcbiAgICAgICAgZGF0YTogdGhpcy4kbm9ybWFscyxcbiAgICAgICAgc2l6ZTogM1xuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmR5bmFtaWMpIHtcbiAgICAgIHRoaXMuYnVmZmVycy5ub3JtYWwudXBkYXRlKHtcbiAgICAgICAgZGF0YTogdGhpcy4kbm9ybWFsc1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJvZ3JhbS5zZXRCdWZmZXIodGhpcy5idWZmZXJzLm5vcm1hbCk7XG4gIH1cblxuICBzZXRJbmRpY2VzKHByb2dyYW0pIHtcbiAgICBpZiAoIXRoaXMuJGluZGljZXMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBnbCA9IHByb2dyYW0uZ2w7XG5cbiAgICBpZiAoIXRoaXMuYnVmZmVycy5pbmRpY2VzKSB7XG4gICAgICB0aGlzLmJ1ZmZlcnMuaW5kaWNlcyA9IG5ldyBCdWZmZXIocHJvZ3JhbS5nbCwge1xuICAgICAgICBidWZmZXJUeXBlOiBnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUixcbiAgICAgICAgZHJhd01vZGU6IGdsLlNUQVRJQ19EUkFXLFxuICAgICAgICBkYXRhOiB0aGlzLiRpbmRpY2VzLFxuICAgICAgICBzaXplOiAxXG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuZHluYW1pYykge1xuICAgICAgdGhpcy5idWZmZXJzLmluZGljZXMudXBkYXRlKHtcbiAgICAgICAgZGF0YTogdGhpcy4kaW5kaWNlc1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJvZ3JhbS5zZXRCdWZmZXIodGhpcy5idWZmZXJzLmluZGljZXMpO1xuICB9XG5cbiAgc2V0UGlja2luZ0NvbG9ycyhwcm9ncmFtKSB7XG4gICAgaWYgKCF0aGlzLiRwaWNraW5nQ29sb3JzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmJ1ZmZlcnMucGlja2luZ0NvbG9ycykge1xuICAgICAgdGhpcy5idWZmZXJzLnBpY2tpbmdDb2xvcnMgPSBuZXcgQnVmZmVyKHByb2dyYW0uZ2wsIHtcbiAgICAgICAgYXR0cmlidXRlOiAncGlja2luZ0NvbG9yJyxcbiAgICAgICAgZGF0YTogdGhpcy4kcGlja2luZ0NvbG9ycyxcbiAgICAgICAgc2l6ZTogNFxuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmR5bmFtaWMpIHtcbiAgICAgIHRoaXMuYnVmZmVycy5waWNraW5nQ29sb3JzLnVwZGF0ZSh7XG4gICAgICAgIGRhdGE6IHRoaXMuJHBpY2tpbmdDb2xvcnNcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHByb2dyYW0uc2V0QnVmZmVyKHRoaXMuYnVmZmVycy5waWNraW5nQ29sb3JzKTtcbiAgfVxuXG4gIHNldENvbG9ycyhwcm9ncmFtKSB7XG4gICAgaWYgKCF0aGlzLiRjb2xvcnMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuYnVmZmVycy5jb2xvcnMpIHtcbiAgICAgIHRoaXMuYnVmZmVycy5jb2xvcnMgPSBuZXcgQnVmZmVyKHByb2dyYW0uZ2wsIHtcbiAgICAgICAgYXR0cmlidXRlOiAnY29sb3InLFxuICAgICAgICBkYXRhOiB0aGlzLiRjb2xvcnMsXG4gICAgICAgIHNpemU6IDRcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodGhpcy5keW5hbWljKSB7XG4gICAgICB0aGlzLmJ1ZmZlcnMuY29sb3JzLnVwZGF0ZSh7XG4gICAgICAgIGRhdGE6IHRoaXMuJGNvbG9yc1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJvZ3JhbS5zZXRCdWZmZXIodGhpcy5idWZmZXJzLmNvbG9ycyk7XG4gIH1cbiAgKi9cbn1cbiJdfQ==