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

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } } // A scenegraph object node
/* eslint-disable guard-for-in, no-console */
/* global console */

// Define some locals


var lumaLog = {
  priority: 3,
  table: function table(priority, _table) {
    if (priority <= lumaLog.priority && _table) {
      console.table(_table);
    }
  }
};

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
    key: 'isIndexed',
    value: function isIndexed() {
      return Boolean(this.geometry.indices);
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
    key: 'getAttributes',
    value: function getAttributes() {
      return this.attributes;
    }
  }, {
    key: 'setAttributes',
    value: function setAttributes() {
      var attributes = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      Object.assign(this.attributes, attributes);
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

      this._checkUniforms(uniforms);
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
      var camera = _ref3.camera;
      var viewMatrix = _ref3.viewMatrix;

      // Camera exposes uniforms that can be used directly in shaders
      this.setUniforms(camera.getUniforms());
      this.setUniforms(this.getCoordinateUniforms(viewMatrix));

      var table = this.getAttributesTable(this.geometry.attributes, {
        header: 'Attributes for ' + this.geometry.id
      });
      table = this.getAttributesTable(this.attributes, { table: table });
      lumaLog.table(3, table);

      table = this.getUniformsTable(this.uniforms, {
        header: 'Uniforms for ' + this.geometry.id
      });
      lumaLog.table(3, table);

      this.setProgramState();

      var geometry = this.geometry;
      var instanced = this.instanced;
      var instanceCount = this.instanceCount;
      var drawMode = geometry.drawMode;

      (0, _webgl.draw)(gl, {
        drawMode: drawMode,
        vertexCount: this.getVertexCount(),
        indexed: this.isIndexed(),
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
      this.enableAttributes(this.attributes);
      this.enableAttributes(this.geometry.attributes);
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
    key: 'enableAttributes',
    value: function enableAttributes(attributes) {
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

    // TODO - Move into uniforms manager

  }, {
    key: '_checkUniforms',
    value: function _checkUniforms(uniformMap) {
      for (var key in uniformMap) {
        var value = uniformMap[key];
        this._checkUniformValue(key, value);
      }
    }
  }, {
    key: '_checkUniformValue',
    value: function _checkUniformValue(uniform, value) {
      function isNumber(v) {
        return !isNaN(v) && Number(v) === v && v !== undefined;
      }

      var ok = true;
      if (Array.isArray(value) || value instanceof Float32Array) {
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = value[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var element = _step3.value;

            if (!isNumber(element)) {
              ok = false;
            }
          }
        } catch (err) {
          _didIteratorError3 = true;
          _iteratorError3 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
              _iterator3.return();
            }
          } finally {
            if (_didIteratorError3) {
              throw _iteratorError3;
            }
          }
        }
      } else if (!isNumber(value)) {
        ok = false;
      }
      if (!ok) {
        /* eslint-disable no-console */
        /* global console */
        // Value could be unprintable so write the object on console
        console.error(this.id + ' Bad uniform ' + uniform, value);
        /* eslint-enable no-console */
        throw new Error(this.id + ' Bad uniform ' + uniform);
      }
    }

    // Todo move to attributes manager

  }, {
    key: 'getAttributesTable',
    value: function getAttributesTable(attributes) {
      var _ref4 = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var _ref4$header = _ref4.header;
      var header = _ref4$header === undefined ? 'Attributes' : _ref4$header;
      var _ref4$table = _ref4.table;
      var table = _ref4$table === undefined ? null : _ref4$table;

      table = table || _defineProperty({}, header, {});
      for (var attributeName in attributes) {
        var attribute = attributes[attributeName];
        table = table || {};
        table[attributeName] = {
          Name: attribute.value.constructor.name,
          Length: attribute.value.length,
          Size: attribute.size,
          Instanced: attribute.instanced
        };
      }
      return table;
    }

    // TODO - Move to uniforms manager

  }, {
    key: 'getUniformsTable',
    value: function getUniformsTable(uniforms) {
      var _ref6 = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var _ref6$header = _ref6.header;
      var header = _ref6$header === undefined ? 'Uniforms' : _ref6$header;
      var _ref6$table = _ref6.table;
      var table = _ref6$table === undefined ? null : _ref6$table;

      table = table || _defineProperty({}, header, {});
      for (var uniformName in uniforms) {
        var uniform = uniforms[uniformName];
        table[uniformName] = {
          Type: uniform,
          Value: uniform.toString()
        };
      }
      return table;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2VuZWdyYXBoL21vZGVsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFXQSxJQUFNLFVBQVU7QUFDZCxZQUFVLENBQVY7QUFDQSx3QkFBTSxVQUFVLFFBQU87QUFDckIsUUFBSSxZQUFZLFFBQVEsUUFBUixJQUFvQixNQUFoQyxFQUF1QztBQUN6QyxjQUFRLEtBQVIsQ0FBYyxNQUFkLEVBRHlDO0tBQTNDO0dBSFk7Q0FBVjs7OztJQVVPLDhCQUNYLFNBRFcsUUFDWCxHQUFrRTttRUFBSixrQkFBSTs7NEJBQXJELFVBQXFEO01BQXJELDJDQUFZLG1CQUF5Qzs2QkFBdEMsV0FBc0M7TUFBdEMsNkNBQWEsb0JBQXlCOzZCQUF0QixXQUFzQjtNQUF0Qiw2Q0FBYSxvQkFBUzs7d0JBRHZELFVBQ3VEOztBQUNoRSxPQUFLLFNBQUwsR0FBaUIsU0FBakIsQ0FEZ0U7QUFFaEUsT0FBSyxVQUFMLEdBQWtCLFVBQWxCLENBRmdFO0FBR2hFLE9BQUssVUFBTCxHQUFrQixVQUFsQixDQUhnRTtDQUFsRTs7Ozs7SUFRbUI7Ozs7OztBQUluQixXQUptQixLQUluQixHQWFRO3NFQUFKLGtCQUFJOztRQVpOLHdCQVlNO1FBWE4sMEJBV007K0JBVk4sU0FVTTtRQVZOLDBDQUFXLHNCQVVMOytCQVZXLFNBVVg7UUFWVywwQ0FBVyxvQkFVdEI7Z0NBUk4sVUFRTTs7O0FBUk4sZ0RBQVksd0JBUU47b0NBUmEsY0FRYjtRQVJhLG9EQUFnQix3QkFRN0I7K0JBTk4sU0FNTTs7O0FBTk4sOENBQVcsdUJBTUw7MkJBTlksS0FNWjtRQU5ZLGtDQUFPLGtCQU1uQjsrQkFKTixTQUlNOzs7QUFKTiw4Q0FBVyxvQkFJTDtpQ0FITixXQUdNO1FBSE4sOENBQWEsc0JBR1A7NkJBRk4sT0FFTTtRQUZOLHNDQUFTLG9CQUVIO3FDQUZTLGVBRVQ7UUFGUyxzREFBaUIsNEJBRTFCO29DQUZnQyxjQUVo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Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7d0JBdFAxRDtBQUNULGFBQU8sS0FBSyxFQUFMLEdBQVUsR0FBVixHQUFnQixLQUFLLGFBQUwsQ0FEZDs7OztTQTNEUSIsImZpbGUiOiJtb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIEEgc2NlbmVncmFwaCBvYmplY3Qgbm9kZVxuLyogZXNsaW50LWRpc2FibGUgZ3VhcmQtZm9yLWluLCBuby1jb25zb2xlICovXG4vKiBnbG9iYWwgY29uc29sZSAqL1xuXG4vLyBEZWZpbmUgc29tZSBsb2NhbHNcbmltcG9ydCB7QnVmZmVyLCBkcmF3fSBmcm9tICcuLi93ZWJnbCc7XG5pbXBvcnQge3NwbGF0fSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5pbXBvcnQgT2JqZWN0M0QgZnJvbSAnLi9vYmplY3QtM2QnO1xuaW1wb3J0IHtNQVhfVEVYVFVSRVN9IGZyb20gJy4uL2NvbmZpZyc7XG5cbmNvbnN0IGx1bWFMb2cgPSB7XG4gIHByaW9yaXR5OiAzLFxuICB0YWJsZShwcmlvcml0eSwgdGFibGUpIHtcbiAgICBpZiAocHJpb3JpdHkgPD0gbHVtYUxvZy5wcmlvcml0eSAmJiB0YWJsZSkge1xuICAgICAgY29uc29sZS50YWJsZSh0YWJsZSk7XG4gICAgfVxuICB9XG59O1xuXG4vLyBUT0RPIC0gZXhwZXJpbWVudGFsLCBub3QgeWV0IHVzZWRcbmV4cG9ydCBjbGFzcyBNYXRlcmlhbCB7XG4gIGNvbnN0cnVjdG9yKHtzaGluaW5lc3MgPSAwLCByZWZsZWN0aW9uID0gMCwgcmVmcmFjdGlvbiA9IDB9ID0ge30pIHtcbiAgICB0aGlzLnNoaW5pbmVzcyA9IHNoaW5pbmVzcztcbiAgICB0aGlzLnJlZmxlY3Rpb24gPSByZWZsZWN0aW9uO1xuICAgIHRoaXMucmVmcmFjdGlvbiA9IHJlZnJhY3Rpb247XG4gIH1cbn1cblxuLy8gTW9kZWwgYWJzdHJhY3QgTzNEIENsYXNzXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNb2RlbCBleHRlbmRzIE9iamVjdDNEIHtcblxuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cyAgKi9cbiAgLyogZXNsaW50LWRpc2FibGUgY29tcGxleGl0eSAgKi9cbiAgY29uc3RydWN0b3Ioe1xuICAgIHByb2dyYW0sXG4gICAgZ2VvbWV0cnksXG4gICAgbWF0ZXJpYWwgPSBudWxsLCB0ZXh0dXJlcyA9IFtdLFxuICAgIC8vIEVuYWJsZSBpbnN0YW5jZWQgcmVuZGVyaW5nIChyZXF1aXJlcyBzaGFkZXIgc3VwcG9ydCBhbmQgZXh0cmEgYXR0cmlidXRlcylcbiAgICBpbnN0YW5jZWQgPSBmYWxzZSwgaW5zdGFuY2VDb3VudCA9IDAsXG4gICAgLy8gUGlja2luZ1xuICAgIHBpY2thYmxlID0gZmFsc2UsIHBpY2sgPSBudWxsLFxuICAgIC8vIEV4dHJhIHVuaWZvcm1zIGFuZCBhdHRyaWJ1dGVzIChiZXlvbmQgZ2VvbWV0cnksIG1hdGVyaWFsLCBjYW1lcmEpXG4gICAgdW5pZm9ybXMgPSB7fSxcbiAgICBhdHRyaWJ1dGVzID0ge30sXG4gICAgcmVuZGVyID0gbnVsbCwgb25CZWZvcmVSZW5kZXIgPSBudWxsLCBvbkFmdGVyUmVuZGVyID0gbnVsbCxcbiAgICAuLi5vcHRzXG4gIH0gPSB7fSkge1xuICAgIC8vIGFzc2VydChwcm9ncmFtIHx8IHByb2dyYW0gaW5zdGFuY2VvZiBQcm9ncmFtKTtcbiAgICBhc3NlcnQocHJvZ3JhbSk7XG4gICAgYXNzZXJ0KGdlb21ldHJ5KTtcblxuICAgIHN1cGVyKG9wdHMpO1xuXG4gICAgLy8gc2V0IGEgY3VzdG9tIHByb2dyYW0gcGVyIG8zZFxuICAgIHRoaXMucHJvZ3JhbSA9IHByb2dyYW07XG4gICAgdGhpcy5nZW9tZXRyeSA9IGdlb21ldHJ5O1xuICAgIHRoaXMubWF0ZXJpYWwgPSBtYXRlcmlhbDtcblxuICAgIC8vIGluc3RhbmNlZCByZW5kZXJpbmdcbiAgICB0aGlzLmluc3RhbmNlZCA9IGluc3RhbmNlZDtcbiAgICB0aGlzLmluc3RhbmNlQ291bnQgPSBpbnN0YW5jZUNvdW50O1xuXG4gICAgLy8gcGlja2luZyBvcHRpb25zXG4gICAgdGhpcy5waWNrYWJsZSA9IEJvb2xlYW4ocGlja2FibGUpO1xuICAgIHRoaXMucGljayA9IHBpY2sgfHwgKCgpID0+IGZhbHNlKTtcblxuICAgIC8vIGV4dHJhIHVuaWZvcm1zIGFuZCBhdHRyaWJ1dGUgZGVzY3JpcHRvcnNcbiAgICB0aGlzLnVuaWZvcm1zID0gdW5pZm9ybXM7XG4gICAgdGhpcy5hdHRyaWJ1dGVzID0gYXR0cmlidXRlcztcblxuICAgIC8vIG92ZXJyaWRlIHRoZSByZW5kZXIgbWV0aG9kLCBiZWZvcmUgYW5kIGFmdGVyIHJlbmRlciBjYWxsYmFja3NcbiAgICB0aGlzLnJlbmRlciA9IHJlbmRlciB8fCB0aGlzLnJlbmRlcjtcbiAgICB0aGlzLm9uQmVmb3JlUmVuZGVyID0gb25CZWZvcmVSZW5kZXIgfHwgdGhpcy5vbkJlZm9yZVJlbmRlcjtcbiAgICB0aGlzLm9uQWZ0ZXJSZW5kZXIgPSBvbkFmdGVyUmVuZGVyIHx8IHRoaXMub25BZnRlclJlbmRlcjtcblxuICAgIHRoaXMuYnVmZmVycyA9IHt9O1xuICAgIHRoaXMudXNlckRhdGEgPSB7fTtcblxuICAgIHRoaXMudGV4dHVyZXMgPSBzcGxhdCh0ZXh0dXJlcyk7XG5cbiAgICAvLyBUT0RPIC0gcmVtb3ZlP1xuICAgIHRoaXMuZHluYW1pYyA9IGZhbHNlO1xuXG4gICAgT2JqZWN0LnNlYWwodGhpcyk7XG4gIH1cbiAgLyogZXNsaW50LWVuYWJsZSBtYXgtc3RhdGVtZW50cyAqL1xuICAvKiBlc2xpbnQtZW5hYmxlIGNvbXBsZXhpdHkgKi9cblxuICBnZXQgaGFzaCgpIHtcbiAgICByZXR1cm4gdGhpcy5pZCArICcgJyArIHRoaXMuJHBpY2tpbmdJbmRleDtcbiAgfVxuXG4gIHNldEluc3RhbmNlQ291bnQoaW5zdGFuY2VDb3VudCkge1xuICAgIGFzc2VydChpbnN0YW5jZUNvdW50ICE9PSB1bmRlZmluZWQpO1xuICAgIHRoaXMuaW5zdGFuY2VDb3VudCA9IGluc3RhbmNlQ291bnQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXRJbnN0YW5jZUNvdW50KCkge1xuICAgIHJldHVybiB0aGlzLmluc3RhbmNlQ291bnQ7XG4gIH1cblxuICBnZXRWZXJ0ZXhDb3VudCgpIHtcbiAgICByZXR1cm4gdGhpcy5nZW9tZXRyeS5nZXRWZXJ0ZXhDb3VudCgpO1xuICB9XG5cbiAgaXNJbmRleGVkKCkge1xuICAgIHJldHVybiBCb29sZWFuKHRoaXMuZ2VvbWV0cnkuaW5kaWNlcyk7XG4gIH1cblxuICBnZXRQcm9ncmFtKCkge1xuICAgIHJldHVybiB0aGlzLnByb2dyYW07XG4gIH1cblxuICBpc1BpY2thYmxlKCkge1xuICAgIHJldHVybiB0aGlzLnBpY2thYmxlO1xuICB9XG5cbiAgc2V0UGlja2FibGUocGlja2FibGUgPSB0cnVlKSB7XG4gICAgdGhpcy5waWNrYWJsZSA9IEJvb2xlYW4ocGlja2FibGUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZ2V0QXR0cmlidXRlcygpIHtcbiAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzO1xuICB9XG5cbiAgc2V0QXR0cmlidXRlcyhhdHRyaWJ1dGVzID0ge30pIHtcbiAgICBPYmplY3QuYXNzaWduKHRoaXMuYXR0cmlidXRlcywgYXR0cmlidXRlcyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXRVbmlmb3JtcygpIHtcbiAgICByZXR1cm4gdGhpcy51bmlmb3JtcztcbiAgfVxuXG4gIHNldFVuaWZvcm1zKHVuaWZvcm1zID0ge30pIHtcbiAgICB0aGlzLl9jaGVja1VuaWZvcm1zKHVuaWZvcm1zKTtcbiAgICBPYmplY3QuYXNzaWduKHRoaXMudW5pZm9ybXMsIHVuaWZvcm1zKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIG9uQmVmb3JlUmVuZGVyKCkge1xuICAgIGNvbnN0IHtwcm9ncmFtLCBhdHRyaWJ1dGVzfSA9IHRoaXM7XG4gICAgcHJvZ3JhbS51c2UoKTtcbiAgICB0aGlzLnNldEF0dHJpYnV0ZXMoYXR0cmlidXRlcyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByZW5kZXIoZ2wsIHtjYW1lcmEsIHZpZXdNYXRyaXh9KSB7XG4gICAgLy8gQ2FtZXJhIGV4cG9zZXMgdW5pZm9ybXMgdGhhdCBjYW4gYmUgdXNlZCBkaXJlY3RseSBpbiBzaGFkZXJzXG4gICAgdGhpcy5zZXRVbmlmb3JtcyhjYW1lcmEuZ2V0VW5pZm9ybXMoKSk7XG4gICAgdGhpcy5zZXRVbmlmb3Jtcyh0aGlzLmdldENvb3JkaW5hdGVVbmlmb3Jtcyh2aWV3TWF0cml4KSk7XG5cbiAgICBsZXQgdGFibGUgPSB0aGlzLmdldEF0dHJpYnV0ZXNUYWJsZSh0aGlzLmdlb21ldHJ5LmF0dHJpYnV0ZXMsIHtcbiAgICAgIGhlYWRlcjogYEF0dHJpYnV0ZXMgZm9yICR7dGhpcy5nZW9tZXRyeS5pZH1gXG4gICAgfSk7XG4gICAgdGFibGUgPSB0aGlzLmdldEF0dHJpYnV0ZXNUYWJsZSh0aGlzLmF0dHJpYnV0ZXMsIHt0YWJsZX0pO1xuICAgIGx1bWFMb2cudGFibGUoMywgdGFibGUpO1xuXG4gICAgdGFibGUgPSB0aGlzLmdldFVuaWZvcm1zVGFibGUodGhpcy51bmlmb3Jtcywge1xuICAgICAgaGVhZGVyOiBgVW5pZm9ybXMgZm9yICR7dGhpcy5nZW9tZXRyeS5pZH1gXG4gICAgfSk7XG4gICAgbHVtYUxvZy50YWJsZSgzLCB0YWJsZSk7XG5cbiAgICB0aGlzLnNldFByb2dyYW1TdGF0ZSgpO1xuXG4gICAgY29uc3Qge2dlb21ldHJ5LCBpbnN0YW5jZWQsIGluc3RhbmNlQ291bnR9ID0gdGhpcztcbiAgICBjb25zdCB7ZHJhd01vZGV9ID0gZ2VvbWV0cnk7XG4gICAgZHJhdyhnbCwge1xuICAgICAgZHJhd01vZGUsXG4gICAgICB2ZXJ0ZXhDb3VudDogdGhpcy5nZXRWZXJ0ZXhDb3VudCgpLFxuICAgICAgaW5kZXhlZDogdGhpcy5pc0luZGV4ZWQoKSxcbiAgICAgIGluc3RhbmNlZCxcbiAgICAgIGluc3RhbmNlQ291bnRcbiAgICB9KTtcbiAgfVxuXG4gIG9uQWZ0ZXJSZW5kZXIoKSB7XG4gICAgY29uc3Qge3Byb2dyYW0sIGF0dHJpYnV0ZXN9ID0gdGhpcztcbiAgICBwcm9ncmFtLnVzZSgpO1xuICAgIHRoaXMudW5zZXRBdHRyaWJ1dGVzKGF0dHJpYnV0ZXMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0UHJvZ3JhbVN0YXRlKCkge1xuICAgIGNvbnN0IHtwcm9ncmFtfSA9IHRoaXM7XG4gICAgcHJvZ3JhbS5zZXRVbmlmb3Jtcyh0aGlzLnVuaWZvcm1zKTtcbiAgICB0aGlzLmVuYWJsZUF0dHJpYnV0ZXModGhpcy5hdHRyaWJ1dGVzKTtcbiAgICB0aGlzLmVuYWJsZUF0dHJpYnV0ZXModGhpcy5nZW9tZXRyeS5hdHRyaWJ1dGVzKTtcbiAgICB0aGlzLnNldFRleHR1cmVzKHByb2dyYW0pO1xuXG4gICAgLy8gdGhpcy5zZXRWZXJ0aWNlcyhwcm9ncmFtKTtcbiAgICAvLyB0aGlzLnNldENvbG9ycyhwcm9ncmFtKTtcbiAgICAvLyB0aGlzLnNldFBpY2tpbmdDb2xvcnMocHJvZ3JhbSk7XG4gICAgLy8gdGhpcy5zZXROb3JtYWxzKHByb2dyYW0pO1xuICAgIC8vIHRoaXMuc2V0VGV4Q29vcmRzKHByb2dyYW0pO1xuICAgIC8vIHRoaXMuc2V0SW5kaWNlcyhwcm9ncmFtKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHVuc2V0UHJvZ3JhbVN0YXRlKCkge1xuICAgIGNvbnN0IHtwcm9ncmFtfSA9IHRoaXM7XG4gICAgY29uc3QgZ2wgPSBwcm9ncmFtLmdsO1xuXG4gICAgLy8gdW5iaW5kIHRoZSBhcnJheSBhbmQgZWxlbWVudCBidWZmZXJzXG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIG51bGwpO1xuICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIG51bGwpO1xuXG4gICAgdmFyIGF0dHJpYnV0ZXMgPSBwcm9ncmFtLmF0dHJpYnV0ZXM7XG4gICAgZm9yICh2YXIgbmFtZSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICBnbC5kaXNhYmxlVmVydGV4QXR0cmliQXJyYXkoYXR0cmlidXRlc1tuYW1lXSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gTWFrZXMgc3VyZSBidWZmZXJzIGFyZSBjcmVhdGVkIGZvciBhbGwgYXR0cmlidXRlc1xuICAvLyBhbmQgdGhhdCB0aGUgcHJvZ3JhbSBpcyB1cGRhdGVkIHdpdGggdGhvc2UgYnVmZmVyc1xuICAvLyBUT0RPIC0gZG8gd2UgbmVlZCB0aGUgc2VwYXJhdGlvbiBiZXR3ZWVuIFwiYXR0cmlidXRlc1wiIGFuZCBcImJ1ZmZlcnNcIlxuICAvLyAgY291bGRuJ3QgYXBwcyBqdXN0IGNyZWF0ZSBidWZmZXJzIGRpcmVjdGx5P1xuICBlbmFibGVBdHRyaWJ1dGVzKGF0dHJpYnV0ZXMpIHtcbiAgICBhc3NlcnQoYXR0cmlidXRlcyk7XG4gICAgY29uc3Qge3Byb2dyYW19ID0gdGhpcztcbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZU5hbWUgb2YgT2JqZWN0LmtleXMoYXR0cmlidXRlcykpIHtcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IGF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV07XG4gICAgICBjb25zdCBidWZmZXJPcHRzID0ge1xuICAgICAgICBhdHRyaWJ1dGU6IGF0dHJpYnV0ZU5hbWUsXG4gICAgICAgIGRhdGE6IGF0dHJpYnV0ZS52YWx1ZSxcbiAgICAgICAgc2l6ZTogYXR0cmlidXRlLnNpemUsXG4gICAgICAgIGluc3RhbmNlZDogYXR0cmlidXRlLmluc3RhbmNlZCA/IDEgOiAwLFxuICAgICAgICBidWZmZXJUeXBlOiBhdHRyaWJ1dGUuYnVmZmVyVHlwZSB8fCBwcm9ncmFtLmdsLkFSUkFZX0JVRkZFUixcbiAgICAgICAgZHJhd01vZGU6IGF0dHJpYnV0ZS5kcmF3TW9kZSB8fCBwcm9ncmFtLmdsLlNUQVRJQ19EUkFXXG4gICAgICB9O1xuICAgICAgaWYgKCF0aGlzLmJ1ZmZlcnNbYXR0cmlidXRlTmFtZV0pIHtcbiAgICAgICAgdGhpcy5idWZmZXJzW2F0dHJpYnV0ZU5hbWVdID0gbmV3IEJ1ZmZlcihwcm9ncmFtLmdsLCBidWZmZXJPcHRzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuYnVmZmVyc1thdHRyaWJ1dGVOYW1lXS51cGRhdGUoYnVmZmVyT3B0cyk7XG4gICAgICB9XG4gICAgICBwcm9ncmFtLnNldEJ1ZmZlcih0aGlzLmJ1ZmZlcnNbYXR0cmlidXRlTmFtZV0pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHVuc2V0QXR0cmlidXRlcyhhdHRyaWJ1dGVzKSB7XG4gICAgYXNzZXJ0KGF0dHJpYnV0ZXMpO1xuICAgIGNvbnN0IHtwcm9ncmFtfSA9IHRoaXM7XG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGVOYW1lIG9mIE9iamVjdC5rZXlzKGF0dHJpYnV0ZXMpKSB7XG4gICAgICBhc3NlcnQodGhpcy5idWZmZXJzW2F0dHJpYnV0ZU5hbWVdKTtcbiAgICAgIHByb2dyYW0udW5zZXRCdWZmZXIodGhpcy5idWZmZXJzW2F0dHJpYnV0ZU5hbWVdKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRUZXh0dXJlcyhmb3JjZSA9IGZhbHNlKSB7XG4gICAgY29uc3Qge3Byb2dyYW19ID0gdGhpcztcbiAgICB0aGlzLnRleHR1cmVzID0gdGhpcy50ZXh0dXJlcyA/IHNwbGF0KHRoaXMudGV4dHVyZXMpIDogW107XG4gICAgbGV0IHRleDJEID0gMDtcbiAgICBsZXQgdGV4Q3ViZSA9IDA7XG4gICAgY29uc3QgbXRleHMgPSBNQVhfVEVYVFVSRVM7XG4gICAgZm9yIChsZXQgaSA9IDAsIHRleHMgPSB0aGlzLnRleHR1cmVzLCBsID0gdGV4cy5sZW5ndGg7IGkgPCBtdGV4czsgaSsrKSB7XG4gICAgICBpZiAoaSA8IGwpIHtcbiAgICAgICAgLy8gcnllIFRPRE86IHVwZGF0ZSB0aGlzIHdoZW4gVGV4dHVyZUN1YmUgaXMgaW1wbGVtZW50ZWQuXG4gICAgICAgIC8vIGNvbnN0IGlzQ3ViZSA9IGFwcC50ZXh0dXJlTWVtb1t0ZXhzW2ldXS5pc0N1YmU7XG4gICAgICAgIC8vIGlmIChpc0N1YmUpIHtcbiAgICAgICAgLy8gICBwcm9ncmFtLnNldFVuaWZvcm0oJ2hhc1RleHR1cmVDdWJlJyArIChpICsgMSksIHRydWUpO1xuICAgICAgICAvLyAgIHByb2dyYW0uc2V0VGV4dHVyZSh0ZXhzW2ldLCBnbFsnVEVYVFVSRScgKyBpXSk7XG4gICAgICAgIC8vICAgcHJvZ3JhbS5zZXRVbmlmb3JtKCdzYW1wbGVyQ3ViZScgKyAodGV4Q3ViZSArIDEpLCBpKTtcbiAgICAgICAgLy8gICB0ZXhDdWJlKys7XG4gICAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAgIHByb2dyYW0uc2V0VW5pZm9ybSgnaGFzVGV4dHVyZScgKyAoaSArIDEpLCB0cnVlKTtcbiAgICAgICAgcHJvZ3JhbS5zZXRUZXh0dXJlKHRleHNbaV0sIHRleDJEKTtcbiAgICAgICAgcHJvZ3JhbS5zZXRVbmlmb3JtKCdzYW1wbGVyJyArICh0ZXgyRCArIDEpLCBpKTtcbiAgICAgICAgdGV4MkQrKztcbiAgICAgICAgLy8gfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJvZ3JhbS5zZXRVbmlmb3JtKCdoYXNUZXh0dXJlQ3ViZScgKyAoaSArIDEpLCBmYWxzZSk7XG4gICAgICAgIHByb2dyYW0uc2V0VW5pZm9ybSgnaGFzVGV4dHVyZScgKyAoaSArIDEpLCBmYWxzZSk7XG4gICAgICAgIHByb2dyYW0uc2V0VW5pZm9ybSgnc2FtcGxlcicgKyAoKyt0ZXgyRCksIGkpO1xuICAgICAgICBwcm9ncmFtLnNldFVuaWZvcm0oJ3NhbXBsZXJDdWJlJyArICgrK3RleEN1YmUpLCBpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBUT0RPIC0gTW92ZSBpbnRvIHVuaWZvcm1zIG1hbmFnZXJcbiAgX2NoZWNrVW5pZm9ybXModW5pZm9ybU1hcCkge1xuICAgIGZvciAoY29uc3Qga2V5IGluIHVuaWZvcm1NYXApIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gdW5pZm9ybU1hcFtrZXldO1xuICAgICAgdGhpcy5fY2hlY2tVbmlmb3JtVmFsdWUoa2V5LCB2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgX2NoZWNrVW5pZm9ybVZhbHVlKHVuaWZvcm0sIHZhbHVlKSB7XG4gICAgZnVuY3Rpb24gaXNOdW1iZXIodikge1xuICAgICAgcmV0dXJuICFpc05hTih2KSAmJiBOdW1iZXIodikgPT09IHYgJiYgdiAhPT0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGxldCBvayA9IHRydWU7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpIHx8IHZhbHVlIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5KSB7XG4gICAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgdmFsdWUpIHtcbiAgICAgICAgaWYgKCFpc051bWJlcihlbGVtZW50KSkge1xuICAgICAgICAgIG9rID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKCFpc051bWJlcih2YWx1ZSkpIHtcbiAgICAgIG9rID0gZmFsc2U7XG4gICAgfVxuICAgIGlmICghb2spIHtcbiAgICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnNvbGUgKi9cbiAgICAgIC8qIGdsb2JhbCBjb25zb2xlICovXG4gICAgICAvLyBWYWx1ZSBjb3VsZCBiZSB1bnByaW50YWJsZSBzbyB3cml0ZSB0aGUgb2JqZWN0IG9uIGNvbnNvbGVcbiAgICAgIGNvbnNvbGUuZXJyb3IoYCR7dGhpcy5pZH0gQmFkIHVuaWZvcm0gJHt1bmlmb3JtfWAsIHZhbHVlKTtcbiAgICAgIC8qIGVzbGludC1lbmFibGUgbm8tY29uc29sZSAqL1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke3RoaXMuaWR9IEJhZCB1bmlmb3JtICR7dW5pZm9ybX1gKTtcbiAgICB9XG4gIH1cblxuICAvLyBUb2RvIG1vdmUgdG8gYXR0cmlidXRlcyBtYW5hZ2VyXG4gIGdldEF0dHJpYnV0ZXNUYWJsZShhdHRyaWJ1dGVzLCB7aGVhZGVyID0gJ0F0dHJpYnV0ZXMnLCB0YWJsZSA9IG51bGx9ID0ge30pIHtcbiAgICB0YWJsZSA9IHRhYmxlIHx8IHtbaGVhZGVyXToge319O1xuICAgIGZvciAoY29uc3QgYXR0cmlidXRlTmFtZSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICBjb25zdCBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdO1xuICAgICAgdGFibGUgPSB0YWJsZSB8fCB7fTtcbiAgICAgIHRhYmxlW2F0dHJpYnV0ZU5hbWVdID0ge1xuICAgICAgICBOYW1lOiBhdHRyaWJ1dGUudmFsdWUuY29uc3RydWN0b3IubmFtZSxcbiAgICAgICAgTGVuZ3RoOiBhdHRyaWJ1dGUudmFsdWUubGVuZ3RoLFxuICAgICAgICBTaXplOiBhdHRyaWJ1dGUuc2l6ZSxcbiAgICAgICAgSW5zdGFuY2VkOiBhdHRyaWJ1dGUuaW5zdGFuY2VkXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gdGFibGU7XG4gIH1cblxuICAvLyBUT0RPIC0gTW92ZSB0byB1bmlmb3JtcyBtYW5hZ2VyXG4gIGdldFVuaWZvcm1zVGFibGUodW5pZm9ybXMsIHtoZWFkZXIgPSAnVW5pZm9ybXMnLCB0YWJsZSA9IG51bGx9ID0ge30pIHtcbiAgICB0YWJsZSA9IHRhYmxlIHx8IHtbaGVhZGVyXToge319O1xuICAgIGZvciAoY29uc3QgdW5pZm9ybU5hbWUgaW4gdW5pZm9ybXMpIHtcbiAgICAgIGNvbnN0IHVuaWZvcm0gPSB1bmlmb3Jtc1t1bmlmb3JtTmFtZV07XG4gICAgICB0YWJsZVt1bmlmb3JtTmFtZV0gPSB7XG4gICAgICAgIFR5cGU6IHVuaWZvcm0sXG4gICAgICAgIFZhbHVlOiB1bmlmb3JtLnRvU3RyaW5nKClcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB0YWJsZTtcbiAgfVxuXG4gIC8vIFRPRE8gLSByZW1vdmVcbiAgLypcbiAgc2V0VGV4Q29vcmRzKHByb2dyYW0pIHtcbiAgICBpZiAoIXRoaXMuJHRleENvb3Jkcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGdsID0gcHJvZ3JhbS5nbDtcbiAgICBjb25zdCBtdWx0aSA9IHRoaXMuJHRleENvb3Jkcy5jb25zdHJ1Y3Rvci5uYW1lID09PSAnT2JqZWN0JztcbiAgICBsZXQgdGV4O1xuXG4gICAgaWYgKCF0aGlzLmJ1ZmZlcnMudGV4Q29vcmRzKSB7XG4gICAgICBpZiAobXVsdGkpIHtcbiAgICAgICAgdGhpcy5idWZmZXJzLnRleENvb3JkcyA9IHt9O1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgdHhzID0gdGhpcy50ZXh0dXJlcywgbCA9IHR4cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICB0ZXggPSB0eHNbaV07XG4gICAgICAgICAgdGhpcy5idWZmZXJzLnRleENvb3Jkc1sndGV4Q29vcmQnICsgKGkgKyAxKV0gPSBuZXcgQnVmZmVyKGdsLCB7XG4gICAgICAgICAgICBhdHRyaWJ1dGU6ICd0ZXhDb29yZCcgKyAoaSArIDEpLFxuICAgICAgICAgICAgZGF0YTogdGhpcy4kdGV4Q29vcmRzW3RleF0sXG4gICAgICAgICAgICBzaXplOiAyXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuYnVmZmVycy50ZXhDb29yZHMgPSBuZXcgQnVmZmVyKGdsLCB7XG4gICAgICAgICAgYXR0cmlidXRlOiAndGV4Q29vcmQxJyxcbiAgICAgICAgICBkYXRhOiB0aGlzLiR0ZXhDb29yZHMsXG4gICAgICAgICAgc2l6ZTogMlxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRoaXMuZHluYW1pYykge1xuICAgICAgaWYgKG11bHRpKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwLCB0eHMgPSB0aGlzLnRleHR1cmVzLCBsID0gdHhzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgIHRleCA9IHR4c1tpXTtcbiAgICAgICAgICB0aGlzLmJ1ZmZlcnMudGV4Q29vcmRzWyd0ZXhDb29yZCcgKyAoaSArIDEpXS51cGRhdGUoe1xuICAgICAgICAgICAgZGF0YTogdGhpcy4kdGV4Q29vcmRzW3RleF1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5idWZmZXJzLnRleENvb3Jkcy51cGRhdGUoe1xuICAgICAgICAgIGRhdGE6IHRoaXMuJHRleENvb3Jkc1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobXVsdGkpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwLCB0eHMgPSB0aGlzLnRleHR1cmVzLCBsID0gdHhzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICB0ZXggPSB0eHNbaV07XG4gICAgICAgIHByb2dyYW0uc2V0QnVmZmVyKHRoaXMuYnVmZmVycy50ZXhDb29yZHNbJ3RleENvb3JkJyArIChpICsgMSldKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcHJvZ3JhbS5zZXRCdWZmZXIodGhpcy5idWZmZXJzLnRleENvb3Jkcyk7XG4gICAgfVxuICB9XG5cbiAgc2V0VmVydGljZXMocHJvZ3JhbSkge1xuICAgIGlmICghdGhpcy4kdmVydGljZXMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCF0aGlzLmJ1ZmZlcnMucG9zaXRpb24pIHtcbiAgICAgIHRoaXMuYnVmZmVycy5wb3NpdGlvbiA9IG5ldyBCdWZmZXIocHJvZ3JhbS5nbCwge1xuICAgICAgICBhdHRyaWJ1dGU6ICdwb3NpdGlvbicsXG4gICAgICAgIGRhdGE6IHRoaXMuJHZlcnRpY2VzLFxuICAgICAgICBzaXplOiAzXG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuZHluYW1pYykge1xuICAgICAgdGhpcy5idWZmZXJzLnBvc2l0aW9uLnVwZGF0ZSh7XG4gICAgICAgIGRhdGE6IHRoaXMuJHZlcnRpY2VzXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBwcm9ncmFtLnNldEJ1ZmZlcih0aGlzLmJ1ZmZlcnMucG9zaXRpb24pO1xuICB9XG5cbiAgc2V0Tm9ybWFscyhwcm9ncmFtKSB7XG4gICAgaWYgKCF0aGlzLiRub3JtYWxzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmJ1ZmZlcnMubm9ybWFsKSB7XG4gICAgICB0aGlzLmJ1ZmZlcnMubm9ybWFsID0gbmV3IEJ1ZmZlcihwcm9ncmFtLmdsLCB7XG4gICAgICAgIGF0dHJpYnV0ZTogJ25vcm1hbCcsXG4gICAgICAgIGRhdGE6IHRoaXMuJG5vcm1hbHMsXG4gICAgICAgIHNpemU6IDNcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodGhpcy5keW5hbWljKSB7XG4gICAgICB0aGlzLmJ1ZmZlcnMubm9ybWFsLnVwZGF0ZSh7XG4gICAgICAgIGRhdGE6IHRoaXMuJG5vcm1hbHNcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHByb2dyYW0uc2V0QnVmZmVyKHRoaXMuYnVmZmVycy5ub3JtYWwpO1xuICB9XG5cbiAgc2V0SW5kaWNlcyhwcm9ncmFtKSB7XG4gICAgaWYgKCF0aGlzLiRpbmRpY2VzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZ2wgPSBwcm9ncmFtLmdsO1xuXG4gICAgaWYgKCF0aGlzLmJ1ZmZlcnMuaW5kaWNlcykge1xuICAgICAgdGhpcy5idWZmZXJzLmluZGljZXMgPSBuZXcgQnVmZmVyKHByb2dyYW0uZ2wsIHtcbiAgICAgICAgYnVmZmVyVHlwZTogZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsXG4gICAgICAgIGRyYXdNb2RlOiBnbC5TVEFUSUNfRFJBVyxcbiAgICAgICAgZGF0YTogdGhpcy4kaW5kaWNlcyxcbiAgICAgICAgc2l6ZTogMVxuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmR5bmFtaWMpIHtcbiAgICAgIHRoaXMuYnVmZmVycy5pbmRpY2VzLnVwZGF0ZSh7XG4gICAgICAgIGRhdGE6IHRoaXMuJGluZGljZXNcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHByb2dyYW0uc2V0QnVmZmVyKHRoaXMuYnVmZmVycy5pbmRpY2VzKTtcbiAgfVxuXG4gIHNldFBpY2tpbmdDb2xvcnMocHJvZ3JhbSkge1xuICAgIGlmICghdGhpcy4kcGlja2luZ0NvbG9ycykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5idWZmZXJzLnBpY2tpbmdDb2xvcnMpIHtcbiAgICAgIHRoaXMuYnVmZmVycy5waWNraW5nQ29sb3JzID0gbmV3IEJ1ZmZlcihwcm9ncmFtLmdsLCB7XG4gICAgICAgIGF0dHJpYnV0ZTogJ3BpY2tpbmdDb2xvcicsXG4gICAgICAgIGRhdGE6IHRoaXMuJHBpY2tpbmdDb2xvcnMsXG4gICAgICAgIHNpemU6IDRcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodGhpcy5keW5hbWljKSB7XG4gICAgICB0aGlzLmJ1ZmZlcnMucGlja2luZ0NvbG9ycy51cGRhdGUoe1xuICAgICAgICBkYXRhOiB0aGlzLiRwaWNraW5nQ29sb3JzXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBwcm9ncmFtLnNldEJ1ZmZlcih0aGlzLmJ1ZmZlcnMucGlja2luZ0NvbG9ycyk7XG4gIH1cblxuICBzZXRDb2xvcnMocHJvZ3JhbSkge1xuICAgIGlmICghdGhpcy4kY29sb3JzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmJ1ZmZlcnMuY29sb3JzKSB7XG4gICAgICB0aGlzLmJ1ZmZlcnMuY29sb3JzID0gbmV3IEJ1ZmZlcihwcm9ncmFtLmdsLCB7XG4gICAgICAgIGF0dHJpYnV0ZTogJ2NvbG9yJyxcbiAgICAgICAgZGF0YTogdGhpcy4kY29sb3JzLFxuICAgICAgICBzaXplOiA0XG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuZHluYW1pYykge1xuICAgICAgdGhpcy5idWZmZXJzLmNvbG9ycy51cGRhdGUoe1xuICAgICAgICBkYXRhOiB0aGlzLiRjb2xvcnNcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHByb2dyYW0uc2V0QnVmZmVyKHRoaXMuYnVmZmVycy5jb2xvcnMpO1xuICB9XG4gICovXG59XG4iXX0=