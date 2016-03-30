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


// Model repository
// map attribute names to property names
// TODO(nico): textures are treated separately.
/*
const attributeMap = {
  'position': 'vertices',
  'normal': 'normals',
  'pickingColor': 'pickingColors',
  'colors': 'color'
};
*/

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
    var material = _ref2.material;
    var _ref2$shininess = _ref2.shininess;
    var shininess = _ref2$shininess === undefined ? 0 : _ref2$shininess;
    var _ref2$reflection = _ref2.reflection;
    var reflection = _ref2$reflection === undefined ? 0 : _ref2$reflection;
    var _ref2$refraction = _ref2.refraction;
    var refraction = _ref2$refraction === undefined ? 0 : _ref2$refraction;
    var _ref2$instanced = _ref2.instanced;
    var
    // Enable instanced rendering (requires shader support and extra attributes)
    instanced = _ref2$instanced === undefined ? false : _ref2$instanced;
    var _ref2$instanceCount = _ref2.instanceCount;
    var instanceCount = _ref2$instanceCount === undefined ? 0 : _ref2$instanceCount;
    var pickable = _ref2.pickable;
    var pick = _ref2.pick;
    var _ref2$uniforms = _ref2.uniforms;
    var
    // Extra uniforms and attributes (beyond geometry, material, camera)
    uniforms = _ref2$uniforms === undefined ? {} : _ref2$uniforms;
    var _ref2$attributes = _ref2.attributes;
    var attributes = _ref2$attributes === undefined ? {} : _ref2$attributes;
    var pickingColors = _ref2.pickingColors;
    var texCoords = _ref2.texCoords;
    var textures = _ref2.textures;
    var render = _ref2.render;
    var onBeforeRender = _ref2.onBeforeRender;
    var onAfterRender = _ref2.onAfterRender;

    var opts = _objectWithoutProperties(_ref2, ['program', 'geometry', 'material', 'shininess', 'reflection', 'refraction', 'instanced', 'instanceCount', 'pickable', 'pick', 'uniforms', 'attributes', 'pickingColors', 'texCoords', 'textures', 'render', 'onBeforeRender', 'onAfterRender']);

    _classCallCheck(this, Model);

    (0, _assert2.default)(!program || program instanceof _webgl.Program);

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

    // this.textures = textures && splat(textures);
    // this.colors = opt.colors;
    // this.indices = opt.indices;
    // this.pickingColors = pickingColors || null;
    // this.texCoords = opt.texCoords;

    // extra uniforms and attribute descriptors
    _this.uniforms = uniforms;
    _this.attributes = attributes;

    // override the render method, before and after render callbacks
    _this.render = render || _this.render;
    _this.onBeforeRender = onBeforeRender || _this.onBeforeRender;
    _this.onAfterRender = onAfterRender || _this.onAfterRender;

    _this.buffers = {};
    _this.userData = {};

    _this.textures = [];
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
    }

    // A little hacky

  }, {
    key: 'getBuffers',
    value: function getBuffers() {
      return this.buffers;
    }
  }, {
    key: 'setBuffers',
    value: function setBuffers(buffers) {
      this.buffers = buffers;
    }
  }, {
    key: 'onBeforeRender',
    value: function onBeforeRender() {
      var program = this.program;
      var attributes = this.attributes;

      program.use();
      this.setAttributes(attributes);
    }
  }, {
    key: 'render',
    value: function render(gl) {
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
    }
  }, {
    key: 'setProgramState',
    value: function setProgramState() {
      var program = this.program;

      this.setUniforms(program);
      this.setAttributes(this.attributes);
      this.setAttributes(this.geometry.attributes);
      this.setTextures(program);

      // this.setVertices(program);
      // this.setColors(program);
      // this.setPickingColors(program);
      // this.setNormals(program);
      // this.setTexCoords(program);
      // this.setIndices(program);
    }
  }, {
    key: 'unsetProgramState',
    value: function unsetProgramState() {
      var program = this.program;

      var gl = program.gl;
      var attributes = program.attributes;

      // unbind the array and element buffers
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

      for (var name in attributes) {
        gl.disableVertexAttribArray(attributes[name]);
      }
    }
  }, {
    key: 'setUniforms',
    value: function setUniforms() {
      var program = this.program;

      program.setUniforms(this.uniforms);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2VuZWdyYXBoL21vZGVsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQXVCYSw4QkFDWCxTQURXLFFBQ1gsR0FBa0U7bUVBQUosa0JBQUk7OzRCQUFyRCxVQUFxRDtNQUFyRCwyQ0FBWSxtQkFBeUM7NkJBQXRDLFdBQXNDO01BQXRDLDZDQUFhLG9CQUF5Qjs2QkFBdEIsV0FBc0I7TUFBdEIsNkNBQWEsb0JBQVM7O3dCQUR2RCxVQUN1RDs7QUFDaEUsT0FBSyxTQUFMLEdBQWlCLFNBQWpCLENBRGdFO0FBRWhFLE9BQUssVUFBTCxHQUFrQixVQUFsQixDQUZnRTtBQUdoRSxPQUFLLFVBQUwsR0FBa0IsVUFBbEIsQ0FIZ0U7Q0FBbEU7Ozs7O0lBUW1COzs7Ozs7QUFJbkIsV0FKbUIsS0FJbkIsR0FZaUI7c0VBQUosa0JBQUk7O1FBWGYsd0JBV2U7UUFWZiwwQkFVZTtRQVRmLDBCQVNlO2dDQVRMLFVBU0s7UUFUTCw0Q0FBWSxvQkFTUDtpQ0FUVSxXQVNWO1FBVFUsOENBQWEscUJBU3ZCO2lDQVQwQixXQVMxQjtRQVQwQiw4Q0FBYSxxQkFTdkM7Z0NBUGYsVUFPZTs7O0FBUGYsZ0RBQVksd0JBT0c7b0NBUEksY0FPSjtRQVBJLG9EQUFnQix3QkFPcEI7UUFOZiwwQkFNZTtRQU5MLGtCQU1LOytCQUpmLFNBSWU7OztBQUpmLDhDQUFXLG9CQUlJO2lDQUhmLFdBR2U7UUFIZiw4Q0FBYSxzQkFHRTtRQUhFLG9DQUdGO1FBSGlCLDRCQUdqQjtRQUZmLDBCQUVlO1FBRGYsc0JBQ2U7UUFEUCxzQ0FDTztRQURTLG9DQUNUOztRQUFaLHdSQUFZOzswQkFoQkUsT0FnQkY7O0FBRWYsMEJBQU8sQ0FBQyxPQUFELElBQVksaUNBQVosQ0FBUCxDQUZlOzs7O3VFQWhCRSxrQkFvQlgsT0FKUzs7QUFPZixVQUFLLE9BQUwsR0FBZSxPQUFmLENBUGU7QUFRZixV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QixnQkFBZ0IsSUFBSSxDQUFKLENBQWhCLEVBQXdCLEtBQTNDLEVBRks7QUFHTCxvQkFBUSxVQUFSLENBQW1CLFlBQWEsRUFBRSxLQUFGLEVBQVUsQ0FBMUMsRUFISztBQUlMLG9CQUFRLFVBQVIsQ0FBbUIsZ0JBQWlCLEVBQUUsT0FBRixFQUFZLENBQWhELEVBSks7V0FkUDtPQURGOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7d0JBdklTO0FBQ1QsYUFBTyxLQUFLLEVBQUwsR0FBVSxHQUFWLEdBQWdCLEtBQUssYUFBTCxDQURkOzs7O1NBOURRIiwiZmlsZSI6Im1vZGVsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQSBzY2VuZWdyYXBoIG9iamVjdCBub2RlXG4vKiBlc2xpbnQtZGlzYWJsZSBndWFyZC1mb3ItaW4gKi9cblxuLy8gRGVmaW5lIHNvbWUgbG9jYWxzXG5pbXBvcnQge1Byb2dyYW0sIEJ1ZmZlciwgZHJhd30gZnJvbSAnLi4vd2ViZ2wnO1xuaW1wb3J0IHtzcGxhdH0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuaW1wb3J0IE9iamVjdDNEIGZyb20gJy4vb2JqZWN0LTNkJztcbmltcG9ydCB7TUFYX1RFWFRVUkVTfSBmcm9tICcuLi9jb25maWcnO1xuXG4vLyBNb2RlbCByZXBvc2l0b3J5XG4vLyBtYXAgYXR0cmlidXRlIG5hbWVzIHRvIHByb3BlcnR5IG5hbWVzXG4vLyBUT0RPKG5pY28pOiB0ZXh0dXJlcyBhcmUgdHJlYXRlZCBzZXBhcmF0ZWx5LlxuLypcbmNvbnN0IGF0dHJpYnV0ZU1hcCA9IHtcbiAgJ3Bvc2l0aW9uJzogJ3ZlcnRpY2VzJyxcbiAgJ25vcm1hbCc6ICdub3JtYWxzJyxcbiAgJ3BpY2tpbmdDb2xvcic6ICdwaWNraW5nQ29sb3JzJyxcbiAgJ2NvbG9ycyc6ICdjb2xvcidcbn07XG4qL1xuXG4vLyBUT0RPIC0gZXhwZXJpbWVudGFsLCBub3QgeWV0IHVzZWRcbmV4cG9ydCBjbGFzcyBNYXRlcmlhbCB7XG4gIGNvbnN0cnVjdG9yKHtzaGluaW5lc3MgPSAwLCByZWZsZWN0aW9uID0gMCwgcmVmcmFjdGlvbiA9IDB9ID0ge30pIHtcbiAgICB0aGlzLnNoaW5pbmVzcyA9IHNoaW5pbmVzcztcbiAgICB0aGlzLnJlZmxlY3Rpb24gPSByZWZsZWN0aW9uO1xuICAgIHRoaXMucmVmcmFjdGlvbiA9IHJlZnJhY3Rpb247XG4gIH1cbn1cblxuLy8gTW9kZWwgYWJzdHJhY3QgTzNEIENsYXNzXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNb2RlbCBleHRlbmRzIE9iamVjdDNEIHtcblxuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cyAgKi9cbiAgLyogZXNsaW50LWRpc2FibGUgY29tcGxleGl0eSAgKi9cbiAgY29uc3RydWN0b3Ioe1xuICAgIHByb2dyYW0sXG4gICAgZ2VvbWV0cnksXG4gICAgbWF0ZXJpYWwsIHNoaW5pbmVzcyA9IDAsIHJlZmxlY3Rpb24gPSAwLCByZWZyYWN0aW9uID0gMCxcbiAgICAvLyBFbmFibGUgaW5zdGFuY2VkIHJlbmRlcmluZyAocmVxdWlyZXMgc2hhZGVyIHN1cHBvcnQgYW5kIGV4dHJhIGF0dHJpYnV0ZXMpXG4gICAgaW5zdGFuY2VkID0gZmFsc2UsIGluc3RhbmNlQ291bnQgPSAwLFxuICAgIHBpY2thYmxlLCBwaWNrLFxuICAgIC8vIEV4dHJhIHVuaWZvcm1zIGFuZCBhdHRyaWJ1dGVzIChiZXlvbmQgZ2VvbWV0cnksIG1hdGVyaWFsLCBjYW1lcmEpXG4gICAgdW5pZm9ybXMgPSB7fSxcbiAgICBhdHRyaWJ1dGVzID0ge30sIHBpY2tpbmdDb2xvcnMsIHRleENvb3JkcyxcbiAgICB0ZXh0dXJlcyxcbiAgICByZW5kZXIsIG9uQmVmb3JlUmVuZGVyLCBvbkFmdGVyUmVuZGVyLFxuICAgIC4uLm9wdHN9ID0ge30pIHtcblxuICAgIGFzc2VydCghcHJvZ3JhbSB8fCBwcm9ncmFtIGluc3RhbmNlb2YgUHJvZ3JhbSk7XG5cbiAgICBzdXBlcihvcHRzKTtcblxuICAgIC8vIHNldCBhIGN1c3RvbSBwcm9ncmFtIHBlciBvM2RcbiAgICB0aGlzLnByb2dyYW0gPSBwcm9ncmFtO1xuICAgIHRoaXMuZ2VvbWV0cnkgPSBnZW9tZXRyeTtcbiAgICB0aGlzLm1hdGVyaWFsID0gbWF0ZXJpYWw7XG5cbiAgICAvLyBpbnN0YW5jZWQgcmVuZGVyaW5nXG4gICAgdGhpcy5pbnN0YW5jZWQgPSBpbnN0YW5jZWQ7XG4gICAgdGhpcy5pbnN0YW5jZUNvdW50ID0gaW5zdGFuY2VDb3VudDtcblxuICAgIC8vIHBpY2tpbmcgb3B0aW9uc1xuICAgIHRoaXMucGlja2FibGUgPSBCb29sZWFuKHBpY2thYmxlKTtcbiAgICB0aGlzLnBpY2sgPSBwaWNrIHx8ICgoKSA9PiBmYWxzZSk7XG5cbiAgICAvLyB0aGlzLnRleHR1cmVzID0gdGV4dHVyZXMgJiYgc3BsYXQodGV4dHVyZXMpO1xuICAgIC8vIHRoaXMuY29sb3JzID0gb3B0LmNvbG9ycztcbiAgICAvLyB0aGlzLmluZGljZXMgPSBvcHQuaW5kaWNlcztcbiAgICAvLyB0aGlzLnBpY2tpbmdDb2xvcnMgPSBwaWNraW5nQ29sb3JzIHx8IG51bGw7XG4gICAgLy8gdGhpcy50ZXhDb29yZHMgPSBvcHQudGV4Q29vcmRzO1xuXG4gICAgLy8gZXh0cmEgdW5pZm9ybXMgYW5kIGF0dHJpYnV0ZSBkZXNjcmlwdG9yc1xuICAgIHRoaXMudW5pZm9ybXMgPSB1bmlmb3JtcztcbiAgICB0aGlzLmF0dHJpYnV0ZXMgPSBhdHRyaWJ1dGVzO1xuXG4gICAgLy8gb3ZlcnJpZGUgdGhlIHJlbmRlciBtZXRob2QsIGJlZm9yZSBhbmQgYWZ0ZXIgcmVuZGVyIGNhbGxiYWNrc1xuICAgIHRoaXMucmVuZGVyID0gcmVuZGVyIHx8IHRoaXMucmVuZGVyO1xuICAgIHRoaXMub25CZWZvcmVSZW5kZXIgPSBvbkJlZm9yZVJlbmRlciB8fCB0aGlzLm9uQmVmb3JlUmVuZGVyO1xuICAgIHRoaXMub25BZnRlclJlbmRlciA9IG9uQWZ0ZXJSZW5kZXIgfHwgdGhpcy5vbkFmdGVyUmVuZGVyO1xuXG4gICAgdGhpcy5idWZmZXJzID0ge307XG4gICAgdGhpcy51c2VyRGF0YSA9IHt9O1xuXG4gICAgdGhpcy50ZXh0dXJlcyA9IFtdO1xuICAgIC8vIFRPRE8gLSByZW1vdmU/XG4gICAgdGhpcy5keW5hbWljID0gZmFsc2U7XG5cbiAgICBPYmplY3Quc2VhbCh0aGlzKTtcbiAgfVxuICAvKiBlc2xpbnQtZW5hYmxlIG1heC1zdGF0ZW1lbnRzICovXG4gIC8qIGVzbGludC1lbmFibGUgY29tcGxleGl0eSAqL1xuXG4gIGdldCBoYXNoKCkge1xuICAgIHJldHVybiB0aGlzLmlkICsgJyAnICsgdGhpcy4kcGlja2luZ0luZGV4O1xuICB9XG5cbiAgc2V0SW5zdGFuY2VDb3VudChpbnN0YW5jZUNvdW50KSB7XG4gICAgYXNzZXJ0KGluc3RhbmNlQ291bnQgIT09IHVuZGVmaW5lZCk7XG4gICAgdGhpcy5pbnN0YW5jZUNvdW50ID0gaW5zdGFuY2VDb3VudDtcbiAgfVxuXG4gIGdldFByb2dyYW0oKSB7XG4gICAgcmV0dXJuIHRoaXMucHJvZ3JhbTtcbiAgfVxuXG4gIGlzUGlja2FibGUoKSB7XG4gICAgcmV0dXJuIHRoaXMucGlja2FibGU7XG4gIH1cblxuICBzZXRQaWNrYWJsZShwaWNrYWJsZSA9IHRydWUpIHtcbiAgICB0aGlzLnBpY2thYmxlID0gQm9vbGVhbihwaWNrYWJsZSk7XG4gIH1cblxuICAvLyBBIGxpdHRsZSBoYWNreVxuICBnZXRCdWZmZXJzKCkge1xuICAgIHJldHVybiB0aGlzLmJ1ZmZlcnM7XG4gIH1cblxuICBzZXRCdWZmZXJzKGJ1ZmZlcnMpIHtcbiAgICB0aGlzLmJ1ZmZlcnMgPSBidWZmZXJzO1xuICB9XG5cbiAgb25CZWZvcmVSZW5kZXIoKSB7XG4gICAgY29uc3Qge3Byb2dyYW0sIGF0dHJpYnV0ZXN9ID0gdGhpcztcbiAgICBwcm9ncmFtLnVzZSgpO1xuICAgIHRoaXMuc2V0QXR0cmlidXRlcyhhdHRyaWJ1dGVzKTtcbiAgfVxuXG4gIHJlbmRlcihnbCkge1xuICAgIGNvbnN0IHtnZW9tZXRyeSwgaW5zdGFuY2VkLCBpbnN0YW5jZUNvdW50fSA9IHRoaXM7XG4gICAgY29uc3Qge2RyYXdNb2RlLCBhdHRyaWJ1dGVzfSA9IGdlb21ldHJ5O1xuICAgIGNvbnN0IHtpbmRpY2VzLCB2ZXJ0aWNlc30gPSBhdHRyaWJ1dGVzO1xuICAgIGNvbnN0IHZlcnRleENvdW50ID0gaW5kaWNlcyA/IGluZGljZXMubGVuZ3RoIDogdmVydGljZXMubGVuZ3RoIC8gMztcbiAgICBkcmF3KGdsLCB7XG4gICAgICBkcmF3TW9kZSxcbiAgICAgIHZlcnRleENvdW50LFxuICAgICAgaW5kZXhlZDogQm9vbGVhbihpbmRpY2VzKSxcbiAgICAgIGluc3RhbmNlZCxcbiAgICAgIGluc3RhbmNlQ291bnRcbiAgICB9KTtcbiAgfVxuXG4gIG9uQWZ0ZXJSZW5kZXIoKSB7XG4gICAgY29uc3Qge3Byb2dyYW0sIGF0dHJpYnV0ZXN9ID0gdGhpcztcbiAgICBwcm9ncmFtLnVzZSgpO1xuICAgIHRoaXMudW5zZXRBdHRyaWJ1dGVzKGF0dHJpYnV0ZXMpO1xuICB9XG5cbiAgc2V0UHJvZ3JhbVN0YXRlKCkge1xuICAgIGNvbnN0IHtwcm9ncmFtfSA9IHRoaXM7XG4gICAgdGhpcy5zZXRVbmlmb3Jtcyhwcm9ncmFtKTtcbiAgICB0aGlzLnNldEF0dHJpYnV0ZXModGhpcy5hdHRyaWJ1dGVzKTtcbiAgICB0aGlzLnNldEF0dHJpYnV0ZXModGhpcy5nZW9tZXRyeS5hdHRyaWJ1dGVzKTtcbiAgICB0aGlzLnNldFRleHR1cmVzKHByb2dyYW0pO1xuXG4gICAgLy8gdGhpcy5zZXRWZXJ0aWNlcyhwcm9ncmFtKTtcbiAgICAvLyB0aGlzLnNldENvbG9ycyhwcm9ncmFtKTtcbiAgICAvLyB0aGlzLnNldFBpY2tpbmdDb2xvcnMocHJvZ3JhbSk7XG4gICAgLy8gdGhpcy5zZXROb3JtYWxzKHByb2dyYW0pO1xuICAgIC8vIHRoaXMuc2V0VGV4Q29vcmRzKHByb2dyYW0pO1xuICAgIC8vIHRoaXMuc2V0SW5kaWNlcyhwcm9ncmFtKTtcbiAgfVxuXG4gIHVuc2V0UHJvZ3JhbVN0YXRlKCkge1xuICAgIGNvbnN0IHtwcm9ncmFtfSA9IHRoaXM7XG4gICAgY29uc3QgZ2wgPSBwcm9ncmFtLmdsO1xuICAgIHZhciBhdHRyaWJ1dGVzID0gcHJvZ3JhbS5hdHRyaWJ1dGVzO1xuXG4gICAgLy8gdW5iaW5kIHRoZSBhcnJheSBhbmQgZWxlbWVudCBidWZmZXJzXG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIG51bGwpO1xuICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIG51bGwpO1xuXG4gICAgZm9yICh2YXIgbmFtZSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICBnbC5kaXNhYmxlVmVydGV4QXR0cmliQXJyYXkoYXR0cmlidXRlc1tuYW1lXSk7XG4gICAgfVxuXG4gIH1cblxuICBzZXRVbmlmb3JtcygpIHtcbiAgICBjb25zdCB7cHJvZ3JhbX0gPSB0aGlzO1xuICAgIHByb2dyYW0uc2V0VW5pZm9ybXModGhpcy51bmlmb3Jtcyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBNYWtlcyBzdXJlIGJ1ZmZlcnMgYXJlIGNyZWF0ZWQgZm9yIGFsbCBhdHRyaWJ1dGVzXG4gIC8vIGFuZCB0aGF0IHRoZSBwcm9ncmFtIGlzIHVwZGF0ZWQgd2l0aCB0aG9zZSBidWZmZXJzXG4gIC8vIFRPRE8gLSBkbyB3ZSBuZWVkIHRoZSBzZXBhcmF0aW9uIGJldHdlZW4gXCJhdHRyaWJ1dGVzXCIgYW5kIFwiYnVmZmVyc1wiXG4gIC8vICBjb3VsZG4ndCBhcHBzIGp1c3QgY3JlYXRlIGJ1ZmZlcnMgZGlyZWN0bHk/XG4gIHNldEF0dHJpYnV0ZXMoYXR0cmlidXRlcykge1xuICAgIGFzc2VydChhdHRyaWJ1dGVzKTtcbiAgICBjb25zdCB7cHJvZ3JhbX0gPSB0aGlzO1xuICAgIGZvciAoY29uc3QgYXR0cmlidXRlTmFtZSBvZiBPYmplY3Qua2V5cyhhdHRyaWJ1dGVzKSkge1xuICAgICAgY29uc3QgYXR0cmlidXRlID0gYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXTtcbiAgICAgIGNvbnN0IGJ1ZmZlck9wdHMgPSB7XG4gICAgICAgIGF0dHJpYnV0ZTogYXR0cmlidXRlTmFtZSxcbiAgICAgICAgZGF0YTogYXR0cmlidXRlLnZhbHVlLFxuICAgICAgICBzaXplOiBhdHRyaWJ1dGUuc2l6ZSxcbiAgICAgICAgaW5zdGFuY2VkOiBhdHRyaWJ1dGUuaW5zdGFuY2VkID8gMSA6IDAsXG4gICAgICAgIGJ1ZmZlclR5cGU6IGF0dHJpYnV0ZS5idWZmZXJUeXBlIHx8IHByb2dyYW0uZ2wuQVJSQVlfQlVGRkVSLFxuICAgICAgICBkcmF3TW9kZTogYXR0cmlidXRlLmRyYXdNb2RlIHx8IHByb2dyYW0uZ2wuU1RBVElDX0RSQVdcbiAgICAgIH07XG4gICAgICBpZiAoIXRoaXMuYnVmZmVyc1thdHRyaWJ1dGVOYW1lXSkge1xuICAgICAgICB0aGlzLmJ1ZmZlcnNbYXR0cmlidXRlTmFtZV0gPSBuZXcgQnVmZmVyKHByb2dyYW0uZ2wsIGJ1ZmZlck9wdHMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5idWZmZXJzW2F0dHJpYnV0ZU5hbWVdLnVwZGF0ZShidWZmZXJPcHRzKTtcbiAgICAgIH1cbiAgICAgIHByb2dyYW0uc2V0QnVmZmVyKHRoaXMuYnVmZmVyc1thdHRyaWJ1dGVOYW1lXSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdW5zZXRBdHRyaWJ1dGVzKGF0dHJpYnV0ZXMpIHtcbiAgICBhc3NlcnQoYXR0cmlidXRlcyk7XG4gICAgY29uc3Qge3Byb2dyYW19ID0gdGhpcztcbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZU5hbWUgb2YgT2JqZWN0LmtleXMoYXR0cmlidXRlcykpIHtcbiAgICAgIGFzc2VydCh0aGlzLmJ1ZmZlcnNbYXR0cmlidXRlTmFtZV0pO1xuICAgICAgcHJvZ3JhbS51bnNldEJ1ZmZlcih0aGlzLmJ1ZmZlcnNbYXR0cmlidXRlTmFtZV0pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFRleHR1cmVzKGZvcmNlID0gZmFsc2UpIHtcbiAgICBjb25zdCB7cHJvZ3JhbX0gPSB0aGlzO1xuICAgIHRoaXMudGV4dHVyZXMgPSB0aGlzLnRleHR1cmVzID8gc3BsYXQodGhpcy50ZXh0dXJlcykgOiBbXTtcbiAgICBsZXQgdGV4MkQgPSAwO1xuICAgIGxldCB0ZXhDdWJlID0gMDtcbiAgICBjb25zdCBtdGV4cyA9IE1BWF9URVhUVVJFUztcbiAgICBmb3IgKGxldCBpID0gMCwgdGV4cyA9IHRoaXMudGV4dHVyZXMsIGwgPSB0ZXhzLmxlbmd0aDsgaSA8IG10ZXhzOyBpKyspIHtcbiAgICAgIGlmIChpIDwgbCkge1xuICAgICAgICAvLyByeWUgVE9ETzogdXBkYXRlIHRoaXMgd2hlbiBUZXh0dXJlQ3ViZSBpcyBpbXBsZW1lbnRlZC5cbiAgICAgICAgLy8gY29uc3QgaXNDdWJlID0gYXBwLnRleHR1cmVNZW1vW3RleHNbaV1dLmlzQ3ViZTtcbiAgICAgICAgLy8gaWYgKGlzQ3ViZSkge1xuICAgICAgICAvLyAgIHByb2dyYW0uc2V0VW5pZm9ybSgnaGFzVGV4dHVyZUN1YmUnICsgKGkgKyAxKSwgdHJ1ZSk7XG4gICAgICAgIC8vICAgcHJvZ3JhbS5zZXRUZXh0dXJlKHRleHNbaV0sIGdsWydURVhUVVJFJyArIGldKTtcbiAgICAgICAgLy8gICBwcm9ncmFtLnNldFVuaWZvcm0oJ3NhbXBsZXJDdWJlJyArICh0ZXhDdWJlICsgMSksIGkpO1xuICAgICAgICAvLyAgIHRleEN1YmUrKztcbiAgICAgICAgLy8gfSBlbHNlIHtcbiAgICAgICAgcHJvZ3JhbS5zZXRVbmlmb3JtKCdoYXNUZXh0dXJlJyArIChpICsgMSksIHRydWUpO1xuICAgICAgICBwcm9ncmFtLnNldFRleHR1cmUodGV4c1tpXSwgdGV4MkQpO1xuICAgICAgICBwcm9ncmFtLnNldFVuaWZvcm0oJ3NhbXBsZXInICsgKHRleDJEICsgMSksIGkpO1xuICAgICAgICB0ZXgyRCsrO1xuICAgICAgICAvLyB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwcm9ncmFtLnNldFVuaWZvcm0oJ2hhc1RleHR1cmVDdWJlJyArIChpICsgMSksIGZhbHNlKTtcbiAgICAgICAgcHJvZ3JhbS5zZXRVbmlmb3JtKCdoYXNUZXh0dXJlJyArIChpICsgMSksIGZhbHNlKTtcbiAgICAgICAgcHJvZ3JhbS5zZXRVbmlmb3JtKCdzYW1wbGVyJyArICgrK3RleDJEKSwgaSk7XG4gICAgICAgIHByb2dyYW0uc2V0VW5pZm9ybSgnc2FtcGxlckN1YmUnICsgKCsrdGV4Q3ViZSksIGkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIFRPRE8gLSByZW1vdmVcbiAgLypcbiAgc2V0VGV4Q29vcmRzKHByb2dyYW0pIHtcbiAgICBpZiAoIXRoaXMuJHRleENvb3Jkcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGdsID0gcHJvZ3JhbS5nbDtcbiAgICBjb25zdCBtdWx0aSA9IHRoaXMuJHRleENvb3Jkcy5jb25zdHJ1Y3Rvci5uYW1lID09PSAnT2JqZWN0JztcbiAgICBsZXQgdGV4O1xuXG4gICAgaWYgKCF0aGlzLmJ1ZmZlcnMudGV4Q29vcmRzKSB7XG4gICAgICBpZiAobXVsdGkpIHtcbiAgICAgICAgdGhpcy5idWZmZXJzLnRleENvb3JkcyA9IHt9O1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgdHhzID0gdGhpcy50ZXh0dXJlcywgbCA9IHR4cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICB0ZXggPSB0eHNbaV07XG4gICAgICAgICAgdGhpcy5idWZmZXJzLnRleENvb3Jkc1sndGV4Q29vcmQnICsgKGkgKyAxKV0gPSBuZXcgQnVmZmVyKGdsLCB7XG4gICAgICAgICAgICBhdHRyaWJ1dGU6ICd0ZXhDb29yZCcgKyAoaSArIDEpLFxuICAgICAgICAgICAgZGF0YTogdGhpcy4kdGV4Q29vcmRzW3RleF0sXG4gICAgICAgICAgICBzaXplOiAyXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuYnVmZmVycy50ZXhDb29yZHMgPSBuZXcgQnVmZmVyKGdsLCB7XG4gICAgICAgICAgYXR0cmlidXRlOiAndGV4Q29vcmQxJyxcbiAgICAgICAgICBkYXRhOiB0aGlzLiR0ZXhDb29yZHMsXG4gICAgICAgICAgc2l6ZTogMlxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRoaXMuZHluYW1pYykge1xuICAgICAgaWYgKG11bHRpKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwLCB0eHMgPSB0aGlzLnRleHR1cmVzLCBsID0gdHhzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgIHRleCA9IHR4c1tpXTtcbiAgICAgICAgICB0aGlzLmJ1ZmZlcnMudGV4Q29vcmRzWyd0ZXhDb29yZCcgKyAoaSArIDEpXS51cGRhdGUoe1xuICAgICAgICAgICAgZGF0YTogdGhpcy4kdGV4Q29vcmRzW3RleF1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5idWZmZXJzLnRleENvb3Jkcy51cGRhdGUoe1xuICAgICAgICAgIGRhdGE6IHRoaXMuJHRleENvb3Jkc1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobXVsdGkpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwLCB0eHMgPSB0aGlzLnRleHR1cmVzLCBsID0gdHhzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICB0ZXggPSB0eHNbaV07XG4gICAgICAgIHByb2dyYW0uc2V0QnVmZmVyKHRoaXMuYnVmZmVycy50ZXhDb29yZHNbJ3RleENvb3JkJyArIChpICsgMSldKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcHJvZ3JhbS5zZXRCdWZmZXIodGhpcy5idWZmZXJzLnRleENvb3Jkcyk7XG4gICAgfVxuICB9XG5cbiAgc2V0VmVydGljZXMocHJvZ3JhbSkge1xuICAgIGlmICghdGhpcy4kdmVydGljZXMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCF0aGlzLmJ1ZmZlcnMucG9zaXRpb24pIHtcbiAgICAgIHRoaXMuYnVmZmVycy5wb3NpdGlvbiA9IG5ldyBCdWZmZXIocHJvZ3JhbS5nbCwge1xuICAgICAgICBhdHRyaWJ1dGU6ICdwb3NpdGlvbicsXG4gICAgICAgIGRhdGE6IHRoaXMuJHZlcnRpY2VzLFxuICAgICAgICBzaXplOiAzXG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuZHluYW1pYykge1xuICAgICAgdGhpcy5idWZmZXJzLnBvc2l0aW9uLnVwZGF0ZSh7XG4gICAgICAgIGRhdGE6IHRoaXMuJHZlcnRpY2VzXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBwcm9ncmFtLnNldEJ1ZmZlcih0aGlzLmJ1ZmZlcnMucG9zaXRpb24pO1xuICB9XG5cbiAgc2V0Tm9ybWFscyhwcm9ncmFtKSB7XG4gICAgaWYgKCF0aGlzLiRub3JtYWxzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmJ1ZmZlcnMubm9ybWFsKSB7XG4gICAgICB0aGlzLmJ1ZmZlcnMubm9ybWFsID0gbmV3IEJ1ZmZlcihwcm9ncmFtLmdsLCB7XG4gICAgICAgIGF0dHJpYnV0ZTogJ25vcm1hbCcsXG4gICAgICAgIGRhdGE6IHRoaXMuJG5vcm1hbHMsXG4gICAgICAgIHNpemU6IDNcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodGhpcy5keW5hbWljKSB7XG4gICAgICB0aGlzLmJ1ZmZlcnMubm9ybWFsLnVwZGF0ZSh7XG4gICAgICAgIGRhdGE6IHRoaXMuJG5vcm1hbHNcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHByb2dyYW0uc2V0QnVmZmVyKHRoaXMuYnVmZmVycy5ub3JtYWwpO1xuICB9XG5cbiAgc2V0SW5kaWNlcyhwcm9ncmFtKSB7XG4gICAgaWYgKCF0aGlzLiRpbmRpY2VzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZ2wgPSBwcm9ncmFtLmdsO1xuXG4gICAgaWYgKCF0aGlzLmJ1ZmZlcnMuaW5kaWNlcykge1xuICAgICAgdGhpcy5idWZmZXJzLmluZGljZXMgPSBuZXcgQnVmZmVyKHByb2dyYW0uZ2wsIHtcbiAgICAgICAgYnVmZmVyVHlwZTogZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsXG4gICAgICAgIGRyYXdNb2RlOiBnbC5TVEFUSUNfRFJBVyxcbiAgICAgICAgZGF0YTogdGhpcy4kaW5kaWNlcyxcbiAgICAgICAgc2l6ZTogMVxuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmR5bmFtaWMpIHtcbiAgICAgIHRoaXMuYnVmZmVycy5pbmRpY2VzLnVwZGF0ZSh7XG4gICAgICAgIGRhdGE6IHRoaXMuJGluZGljZXNcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHByb2dyYW0uc2V0QnVmZmVyKHRoaXMuYnVmZmVycy5pbmRpY2VzKTtcbiAgfVxuXG4gIHNldFBpY2tpbmdDb2xvcnMocHJvZ3JhbSkge1xuICAgIGlmICghdGhpcy4kcGlja2luZ0NvbG9ycykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5idWZmZXJzLnBpY2tpbmdDb2xvcnMpIHtcbiAgICAgIHRoaXMuYnVmZmVycy5waWNraW5nQ29sb3JzID0gbmV3IEJ1ZmZlcihwcm9ncmFtLmdsLCB7XG4gICAgICAgIGF0dHJpYnV0ZTogJ3BpY2tpbmdDb2xvcicsXG4gICAgICAgIGRhdGE6IHRoaXMuJHBpY2tpbmdDb2xvcnMsXG4gICAgICAgIHNpemU6IDRcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodGhpcy5keW5hbWljKSB7XG4gICAgICB0aGlzLmJ1ZmZlcnMucGlja2luZ0NvbG9ycy51cGRhdGUoe1xuICAgICAgICBkYXRhOiB0aGlzLiRwaWNraW5nQ29sb3JzXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBwcm9ncmFtLnNldEJ1ZmZlcih0aGlzLmJ1ZmZlcnMucGlja2luZ0NvbG9ycyk7XG4gIH1cblxuICBzZXRDb2xvcnMocHJvZ3JhbSkge1xuICAgIGlmICghdGhpcy4kY29sb3JzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmJ1ZmZlcnMuY29sb3JzKSB7XG4gICAgICB0aGlzLmJ1ZmZlcnMuY29sb3JzID0gbmV3IEJ1ZmZlcihwcm9ncmFtLmdsLCB7XG4gICAgICAgIGF0dHJpYnV0ZTogJ2NvbG9yJyxcbiAgICAgICAgZGF0YTogdGhpcy4kY29sb3JzLFxuICAgICAgICBzaXplOiA0XG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuZHluYW1pYykge1xuICAgICAgdGhpcy5idWZmZXJzLmNvbG9ycy51cGRhdGUoe1xuICAgICAgICBkYXRhOiB0aGlzLiRjb2xvcnNcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHByb2dyYW0uc2V0QnVmZmVyKHRoaXMuYnVmZmVycy5jb2xvcnMpO1xuICB9XG4gICovXG59XG4iXX0=