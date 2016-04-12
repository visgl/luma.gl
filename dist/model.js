'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Material = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _config = require('./config');

var _object3d = require('./scenegraph/object-3d');

var _object3d2 = _interopRequireDefault(_object3d);

var _webgl = require('./webgl');

var _utils = require('./utils');

var _log = require('./log');

var _log2 = _interopRequireDefault(_log);

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
    var _ref2$textures = _ref2.textures;
    var textures = _ref2$textures === undefined ? [] : _ref2$textures;
    var _ref2$instanced = _ref2.instanced;
    var
    // Enable instanced rendering (requires shader support and extra attributes)
    instanced = _ref2$instanced === undefined ? false : _ref2$instanced;
    var _ref2$instanceCount = _ref2.instanceCount;
    var instanceCount = _ref2$instanceCount === undefined ? 0 : _ref2$instanceCount;
    var _ref2$vertexCount = _ref2.vertexCount;
    var vertexCount = _ref2$vertexCount === undefined ? undefined : _ref2$vertexCount;
    var _ref2$isIndexed = _ref2.isIndexed;
    var isIndexed = _ref2$isIndexed === undefined ? undefined : _ref2$isIndexed;
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

    var opts = _objectWithoutProperties(_ref2, ['program', 'geometry', 'material', 'textures', 'instanced', 'instanceCount', 'vertexCount', 'isIndexed', 'pickable', 'pick', 'uniforms', 'attributes', 'render', 'onBeforeRender', 'onAfterRender']);

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
    _this.vertexCount = vertexCount;
    _this.isIndexed = isIndexed === undefined ? Boolean(_this.geometry.indices) : isIndexed;

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
    key: 'setVertexCount',
    value: function setVertexCount(vertexCount) {
      this.vertexCount = vertexCount;
    }
  }, {
    key: 'getVertexCount',
    value: function getVertexCount() {
      return this.vertexCount === undefined ? this.geometry.getVertexCount() : this.vertexCount;
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
        header: 'Attributes for ' + this.geometry.id,
        program: this.program
      });
      table = this.getAttributesTable(this.attributes, {
        table: table,
        program: this.program
      });
      _log2.default.table(3, table);

      table = this.getUniformsTable(this.uniforms, {
        header: 'Uniforms for ' + this.geometry.id
      });
      _log2.default.table(3, table);

      this.setProgramState();

      var geometry = this.geometry;
      var instanced = this.instanced;
      var instanceCount = this.instanceCount;
      var drawMode = geometry.drawMode;

      (0, _webgl.draw)(gl, {
        drawMode: drawMode,
        vertexCount: this.getVertexCount(),
        indexed: this.isIndexed,
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
      var program = _ref4.program;

      table = table || _defineProperty({}, header, {});
      for (var attributeName in attributes) {
        var attribute = attributes[attributeName];
        table = table || {};
        table[attributeName] = {
          Name: attribute.value.constructor.name,
          Instanced: attribute.instanced,
          Verts: attribute.value.length / attribute.size,
          Size: attribute.size,
          Bytes: attribute.value.length * attribute.value.BYTES_PER_ELEMENT,
          location: program && program.attributeLocations[attributeName]
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
//# sourceMappingURL=data:application/json;base64,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QixFQUFvQztBQUNsQyxZQUFNLFVBQVUsU0FBUyxXQUFULENBQVYsQ0FENEI7QUFFbEMsY0FBTSxXQUFOLElBQXFCO0FBQ25CLGdCQUFNLE9BQU47QUFDQSxpQkFBTyxRQUFRLFFBQVIsRUFBUDtTQUZGLENBRmtDO09BQXBDO0FBT0EsYUFBTyxLQUFQLENBVG1FOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7d0JBalExRDtBQUNULGFBQU8sS0FBSyxFQUFMLEdBQVUsR0FBVixHQUFnQixLQUFLLGFBQUwsQ0FEZDs7OztTQWpFUSIsImZpbGUiOiJtb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIEEgc2NlbmVncmFwaCBvYmplY3Qgbm9kZVxuLyogZXNsaW50LWRpc2FibGUgZ3VhcmQtZm9yLWluICovXG5cbi8vIERlZmluZSBzb21lIGxvY2Fsc1xuaW1wb3J0IHtNQVhfVEVYVFVSRVN9IGZyb20gJy4vY29uZmlnJztcbmltcG9ydCBPYmplY3QzRCBmcm9tICcuL3NjZW5lZ3JhcGgvb2JqZWN0LTNkJztcbmltcG9ydCB7QnVmZmVyLCBkcmF3fSBmcm9tICcuL3dlYmdsJztcbmltcG9ydCB7c3BsYXR9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IGxvZyBmcm9tICcuL2xvZyc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbi8vIFRPRE8gLSBleHBlcmltZW50YWwsIG5vdCB5ZXQgdXNlZFxuZXhwb3J0IGNsYXNzIE1hdGVyaWFsIHtcbiAgY29uc3RydWN0b3Ioe3NoaW5pbmVzcyA9IDAsIHJlZmxlY3Rpb24gPSAwLCByZWZyYWN0aW9uID0gMH0gPSB7fSkge1xuICAgIHRoaXMuc2hpbmluZXNzID0gc2hpbmluZXNzO1xuICAgIHRoaXMucmVmbGVjdGlvbiA9IHJlZmxlY3Rpb247XG4gICAgdGhpcy5yZWZyYWN0aW9uID0gcmVmcmFjdGlvbjtcbiAgfVxufVxuXG4vLyBNb2RlbCBhYnN0cmFjdCBPM0QgQ2xhc3NcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1vZGVsIGV4dGVuZHMgT2JqZWN0M0Qge1xuXG4gIC8qIGVzbGludC1kaXNhYmxlIG1heC1zdGF0ZW1lbnRzICAqL1xuICAvKiBlc2xpbnQtZGlzYWJsZSBjb21wbGV4aXR5ICAqL1xuICBjb25zdHJ1Y3Rvcih7XG4gICAgcHJvZ3JhbSxcbiAgICBnZW9tZXRyeSxcbiAgICBtYXRlcmlhbCA9IG51bGwsIHRleHR1cmVzID0gW10sXG4gICAgLy8gRW5hYmxlIGluc3RhbmNlZCByZW5kZXJpbmcgKHJlcXVpcmVzIHNoYWRlciBzdXBwb3J0IGFuZCBleHRyYSBhdHRyaWJ1dGVzKVxuICAgIGluc3RhbmNlZCA9IGZhbHNlLFxuICAgIGluc3RhbmNlQ291bnQgPSAwLFxuICAgIHZlcnRleENvdW50ID0gdW5kZWZpbmVkLFxuICAgIGlzSW5kZXhlZCA9IHVuZGVmaW5lZCxcbiAgICAvLyBQaWNraW5nXG4gICAgcGlja2FibGUgPSBmYWxzZSwgcGljayA9IG51bGwsXG4gICAgLy8gRXh0cmEgdW5pZm9ybXMgYW5kIGF0dHJpYnV0ZXMgKGJleW9uZCBnZW9tZXRyeSwgbWF0ZXJpYWwsIGNhbWVyYSlcbiAgICB1bmlmb3JtcyA9IHt9LFxuICAgIGF0dHJpYnV0ZXMgPSB7fSxcbiAgICByZW5kZXIgPSBudWxsLCBvbkJlZm9yZVJlbmRlciA9IG51bGwsIG9uQWZ0ZXJSZW5kZXIgPSBudWxsLFxuICAgIC4uLm9wdHNcbiAgfSA9IHt9KSB7XG4gICAgLy8gYXNzZXJ0KHByb2dyYW0gfHwgcHJvZ3JhbSBpbnN0YW5jZW9mIFByb2dyYW0pO1xuICAgIGFzc2VydChwcm9ncmFtKTtcbiAgICBhc3NlcnQoZ2VvbWV0cnkpO1xuXG4gICAgc3VwZXIob3B0cyk7XG5cbiAgICAvLyBzZXQgYSBjdXN0b20gcHJvZ3JhbSBwZXIgbzNkXG4gICAgdGhpcy5wcm9ncmFtID0gcHJvZ3JhbTtcbiAgICB0aGlzLmdlb21ldHJ5ID0gZ2VvbWV0cnk7XG4gICAgdGhpcy5tYXRlcmlhbCA9IG1hdGVyaWFsO1xuXG4gICAgLy8gaW5zdGFuY2VkIHJlbmRlcmluZ1xuICAgIHRoaXMuaW5zdGFuY2VkID0gaW5zdGFuY2VkO1xuICAgIHRoaXMuaW5zdGFuY2VDb3VudCA9IGluc3RhbmNlQ291bnQ7XG4gICAgdGhpcy52ZXJ0ZXhDb3VudCA9IHZlcnRleENvdW50O1xuICAgIHRoaXMuaXNJbmRleGVkID0gaXNJbmRleGVkID09PSB1bmRlZmluZWQgP1xuICAgICAgQm9vbGVhbih0aGlzLmdlb21ldHJ5LmluZGljZXMpIDogaXNJbmRleGVkO1xuXG4gICAgLy8gcGlja2luZyBvcHRpb25zXG4gICAgdGhpcy5waWNrYWJsZSA9IEJvb2xlYW4ocGlja2FibGUpO1xuICAgIHRoaXMucGljayA9IHBpY2sgfHwgKCgpID0+IGZhbHNlKTtcblxuICAgIC8vIGV4dHJhIHVuaWZvcm1zIGFuZCBhdHRyaWJ1dGUgZGVzY3JpcHRvcnNcbiAgICB0aGlzLnVuaWZvcm1zID0gdW5pZm9ybXM7XG4gICAgdGhpcy5hdHRyaWJ1dGVzID0gYXR0cmlidXRlcztcblxuICAgIC8vIG92ZXJyaWRlIHRoZSByZW5kZXIgbWV0aG9kLCBiZWZvcmUgYW5kIGFmdGVyIHJlbmRlciBjYWxsYmFja3NcbiAgICB0aGlzLnJlbmRlciA9IHJlbmRlciB8fCB0aGlzLnJlbmRlcjtcbiAgICB0aGlzLm9uQmVmb3JlUmVuZGVyID0gb25CZWZvcmVSZW5kZXIgfHwgdGhpcy5vbkJlZm9yZVJlbmRlcjtcbiAgICB0aGlzLm9uQWZ0ZXJSZW5kZXIgPSBvbkFmdGVyUmVuZGVyIHx8IHRoaXMub25BZnRlclJlbmRlcjtcblxuICAgIHRoaXMuYnVmZmVycyA9IHt9O1xuICAgIHRoaXMudXNlckRhdGEgPSB7fTtcblxuICAgIHRoaXMudGV4dHVyZXMgPSBzcGxhdCh0ZXh0dXJlcyk7XG5cbiAgICAvLyBUT0RPIC0gcmVtb3ZlP1xuICAgIHRoaXMuZHluYW1pYyA9IGZhbHNlO1xuXG4gICAgT2JqZWN0LnNlYWwodGhpcyk7XG4gIH1cbiAgLyogZXNsaW50LWVuYWJsZSBtYXgtc3RhdGVtZW50cyAqL1xuICAvKiBlc2xpbnQtZW5hYmxlIGNvbXBsZXhpdHkgKi9cblxuICBnZXQgaGFzaCgpIHtcbiAgICByZXR1cm4gdGhpcy5pZCArICcgJyArIHRoaXMuJHBpY2tpbmdJbmRleDtcbiAgfVxuXG4gIHNldEluc3RhbmNlQ291bnQoaW5zdGFuY2VDb3VudCkge1xuICAgIGFzc2VydChpbnN0YW5jZUNvdW50ICE9PSB1bmRlZmluZWQpO1xuICAgIHRoaXMuaW5zdGFuY2VDb3VudCA9IGluc3RhbmNlQ291bnQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXRJbnN0YW5jZUNvdW50KCkge1xuICAgIHJldHVybiB0aGlzLmluc3RhbmNlQ291bnQ7XG4gIH1cblxuICBzZXRWZXJ0ZXhDb3VudCh2ZXJ0ZXhDb3VudCkge1xuICAgIHRoaXMudmVydGV4Q291bnQgPSB2ZXJ0ZXhDb3VudDtcbiAgfVxuXG4gIGdldFZlcnRleENvdW50KCkge1xuICAgIHJldHVybiB0aGlzLnZlcnRleENvdW50ID09PSB1bmRlZmluZWQgP1xuICAgICAgdGhpcy5nZW9tZXRyeS5nZXRWZXJ0ZXhDb3VudCgpIDogdGhpcy52ZXJ0ZXhDb3VudDtcbiAgfVxuXG4gIGdldFByb2dyYW0oKSB7XG4gICAgcmV0dXJuIHRoaXMucHJvZ3JhbTtcbiAgfVxuXG4gIGlzUGlja2FibGUoKSB7XG4gICAgcmV0dXJuIHRoaXMucGlja2FibGU7XG4gIH1cblxuICBzZXRQaWNrYWJsZShwaWNrYWJsZSA9IHRydWUpIHtcbiAgICB0aGlzLnBpY2thYmxlID0gQm9vbGVhbihwaWNrYWJsZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXRBdHRyaWJ1dGVzKCkge1xuICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXM7XG4gIH1cblxuICBzZXRBdHRyaWJ1dGVzKGF0dHJpYnV0ZXMgPSB7fSkge1xuICAgIE9iamVjdC5hc3NpZ24odGhpcy5hdHRyaWJ1dGVzLCBhdHRyaWJ1dGVzKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldFVuaWZvcm1zKCkge1xuICAgIHJldHVybiB0aGlzLnVuaWZvcm1zO1xuICB9XG5cbiAgc2V0VW5pZm9ybXModW5pZm9ybXMgPSB7fSkge1xuICAgIHRoaXMuX2NoZWNrVW5pZm9ybXModW5pZm9ybXMpO1xuICAgIE9iamVjdC5hc3NpZ24odGhpcy51bmlmb3JtcywgdW5pZm9ybXMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgb25CZWZvcmVSZW5kZXIoKSB7XG4gICAgY29uc3Qge3Byb2dyYW0sIGF0dHJpYnV0ZXN9ID0gdGhpcztcbiAgICBwcm9ncmFtLnVzZSgpO1xuICAgIHRoaXMuc2V0QXR0cmlidXRlcyhhdHRyaWJ1dGVzKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHJlbmRlcihnbCwge2NhbWVyYSwgdmlld01hdHJpeH0pIHtcbiAgICAvLyBDYW1lcmEgZXhwb3NlcyB1bmlmb3JtcyB0aGF0IGNhbiBiZSB1c2VkIGRpcmVjdGx5IGluIHNoYWRlcnNcbiAgICB0aGlzLnNldFVuaWZvcm1zKGNhbWVyYS5nZXRVbmlmb3JtcygpKTtcbiAgICB0aGlzLnNldFVuaWZvcm1zKHRoaXMuZ2V0Q29vcmRpbmF0ZVVuaWZvcm1zKHZpZXdNYXRyaXgpKTtcblxuICAgIGxldCB0YWJsZSA9IHRoaXMuZ2V0QXR0cmlidXRlc1RhYmxlKHRoaXMuZ2VvbWV0cnkuYXR0cmlidXRlcywge1xuICAgICAgaGVhZGVyOiBgQXR0cmlidXRlcyBmb3IgJHt0aGlzLmdlb21ldHJ5LmlkfWAsXG4gICAgICBwcm9ncmFtOiB0aGlzLnByb2dyYW1cbiAgICB9KTtcbiAgICB0YWJsZSA9IHRoaXMuZ2V0QXR0cmlidXRlc1RhYmxlKHRoaXMuYXR0cmlidXRlcywge1xuICAgICAgdGFibGUsXG4gICAgICBwcm9ncmFtOiB0aGlzLnByb2dyYW1cbiAgICB9KTtcbiAgICBsb2cudGFibGUoMywgdGFibGUpO1xuXG4gICAgdGFibGUgPSB0aGlzLmdldFVuaWZvcm1zVGFibGUodGhpcy51bmlmb3Jtcywge1xuICAgICAgaGVhZGVyOiBgVW5pZm9ybXMgZm9yICR7dGhpcy5nZW9tZXRyeS5pZH1gXG4gICAgfSk7XG4gICAgbG9nLnRhYmxlKDMsIHRhYmxlKTtcblxuICAgIHRoaXMuc2V0UHJvZ3JhbVN0YXRlKCk7XG5cbiAgICBjb25zdCB7Z2VvbWV0cnksIGluc3RhbmNlZCwgaW5zdGFuY2VDb3VudH0gPSB0aGlzO1xuICAgIGNvbnN0IHtkcmF3TW9kZX0gPSBnZW9tZXRyeTtcbiAgICBkcmF3KGdsLCB7XG4gICAgICBkcmF3TW9kZSxcbiAgICAgIHZlcnRleENvdW50OiB0aGlzLmdldFZlcnRleENvdW50KCksXG4gICAgICBpbmRleGVkOiB0aGlzLmlzSW5kZXhlZCxcbiAgICAgIGluc3RhbmNlZCxcbiAgICAgIGluc3RhbmNlQ291bnRcbiAgICB9KTtcbiAgfVxuXG4gIG9uQWZ0ZXJSZW5kZXIoKSB7XG4gICAgY29uc3Qge3Byb2dyYW0sIGF0dHJpYnV0ZXN9ID0gdGhpcztcbiAgICBwcm9ncmFtLnVzZSgpO1xuICAgIHRoaXMudW5zZXRBdHRyaWJ1dGVzKGF0dHJpYnV0ZXMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0UHJvZ3JhbVN0YXRlKCkge1xuICAgIGNvbnN0IHtwcm9ncmFtfSA9IHRoaXM7XG4gICAgcHJvZ3JhbS5zZXRVbmlmb3Jtcyh0aGlzLnVuaWZvcm1zKTtcbiAgICB0aGlzLmVuYWJsZUF0dHJpYnV0ZXModGhpcy5hdHRyaWJ1dGVzKTtcbiAgICB0aGlzLmVuYWJsZUF0dHJpYnV0ZXModGhpcy5nZW9tZXRyeS5hdHRyaWJ1dGVzKTtcbiAgICB0aGlzLnNldFRleHR1cmVzKHByb2dyYW0pO1xuXG4gICAgLy8gdGhpcy5zZXRWZXJ0aWNlcyhwcm9ncmFtKTtcbiAgICAvLyB0aGlzLnNldENvbG9ycyhwcm9ncmFtKTtcbiAgICAvLyB0aGlzLnNldFBpY2tpbmdDb2xvcnMocHJvZ3JhbSk7XG4gICAgLy8gdGhpcy5zZXROb3JtYWxzKHByb2dyYW0pO1xuICAgIC8vIHRoaXMuc2V0VGV4Q29vcmRzKHByb2dyYW0pO1xuICAgIC8vIHRoaXMuc2V0SW5kaWNlcyhwcm9ncmFtKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHVuc2V0UHJvZ3JhbVN0YXRlKCkge1xuICAgIGNvbnN0IHtwcm9ncmFtfSA9IHRoaXM7XG4gICAgY29uc3QgZ2wgPSBwcm9ncmFtLmdsO1xuXG4gICAgLy8gdW5iaW5kIHRoZSBhcnJheSBhbmQgZWxlbWVudCBidWZmZXJzXG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIG51bGwpO1xuICAgIGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIG51bGwpO1xuXG4gICAgdmFyIGF0dHJpYnV0ZXMgPSBwcm9ncmFtLmF0dHJpYnV0ZXM7XG4gICAgZm9yICh2YXIgbmFtZSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICBnbC5kaXNhYmxlVmVydGV4QXR0cmliQXJyYXkoYXR0cmlidXRlc1tuYW1lXSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gTWFrZXMgc3VyZSBidWZmZXJzIGFyZSBjcmVhdGVkIGZvciBhbGwgYXR0cmlidXRlc1xuICAvLyBhbmQgdGhhdCB0aGUgcHJvZ3JhbSBpcyB1cGRhdGVkIHdpdGggdGhvc2UgYnVmZmVyc1xuICAvLyBUT0RPIC0gZG8gd2UgbmVlZCB0aGUgc2VwYXJhdGlvbiBiZXR3ZWVuIFwiYXR0cmlidXRlc1wiIGFuZCBcImJ1ZmZlcnNcIlxuICAvLyAgY291bGRuJ3QgYXBwcyBqdXN0IGNyZWF0ZSBidWZmZXJzIGRpcmVjdGx5P1xuICBlbmFibGVBdHRyaWJ1dGVzKGF0dHJpYnV0ZXMpIHtcbiAgICBhc3NlcnQoYXR0cmlidXRlcyk7XG4gICAgY29uc3Qge3Byb2dyYW19ID0gdGhpcztcbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZU5hbWUgb2YgT2JqZWN0LmtleXMoYXR0cmlidXRlcykpIHtcbiAgICAgIGNvbnN0IGF0dHJpYnV0ZSA9IGF0dHJpYnV0ZXNbYXR0cmlidXRlTmFtZV07XG4gICAgICBjb25zdCBidWZmZXJPcHRzID0ge1xuICAgICAgICBhdHRyaWJ1dGU6IGF0dHJpYnV0ZU5hbWUsXG4gICAgICAgIGRhdGE6IGF0dHJpYnV0ZS52YWx1ZSxcbiAgICAgICAgc2l6ZTogYXR0cmlidXRlLnNpemUsXG4gICAgICAgIGluc3RhbmNlZDogYXR0cmlidXRlLmluc3RhbmNlZCA/IDEgOiAwLFxuICAgICAgICBidWZmZXJUeXBlOiBhdHRyaWJ1dGUuYnVmZmVyVHlwZSB8fCBwcm9ncmFtLmdsLkFSUkFZX0JVRkZFUixcbiAgICAgICAgZHJhd01vZGU6IGF0dHJpYnV0ZS5kcmF3TW9kZSB8fCBwcm9ncmFtLmdsLlNUQVRJQ19EUkFXXG4gICAgICB9O1xuICAgICAgaWYgKCF0aGlzLmJ1ZmZlcnNbYXR0cmlidXRlTmFtZV0pIHtcbiAgICAgICAgdGhpcy5idWZmZXJzW2F0dHJpYnV0ZU5hbWVdID0gbmV3IEJ1ZmZlcihwcm9ncmFtLmdsLCBidWZmZXJPcHRzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuYnVmZmVyc1thdHRyaWJ1dGVOYW1lXS51cGRhdGUoYnVmZmVyT3B0cyk7XG4gICAgICB9XG4gICAgICBwcm9ncmFtLnNldEJ1ZmZlcih0aGlzLmJ1ZmZlcnNbYXR0cmlidXRlTmFtZV0pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHVuc2V0QXR0cmlidXRlcyhhdHRyaWJ1dGVzKSB7XG4gICAgYXNzZXJ0KGF0dHJpYnV0ZXMpO1xuICAgIGNvbnN0IHtwcm9ncmFtfSA9IHRoaXM7XG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGVOYW1lIG9mIE9iamVjdC5rZXlzKGF0dHJpYnV0ZXMpKSB7XG4gICAgICBhc3NlcnQodGhpcy5idWZmZXJzW2F0dHJpYnV0ZU5hbWVdKTtcbiAgICAgIHByb2dyYW0udW5zZXRCdWZmZXIodGhpcy5idWZmZXJzW2F0dHJpYnV0ZU5hbWVdKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRUZXh0dXJlcyhmb3JjZSA9IGZhbHNlKSB7XG4gICAgY29uc3Qge3Byb2dyYW19ID0gdGhpcztcbiAgICB0aGlzLnRleHR1cmVzID0gdGhpcy50ZXh0dXJlcyA/IHNwbGF0KHRoaXMudGV4dHVyZXMpIDogW107XG4gICAgbGV0IHRleDJEID0gMDtcbiAgICBsZXQgdGV4Q3ViZSA9IDA7XG4gICAgY29uc3QgbXRleHMgPSBNQVhfVEVYVFVSRVM7XG4gICAgZm9yIChsZXQgaSA9IDAsIHRleHMgPSB0aGlzLnRleHR1cmVzLCBsID0gdGV4cy5sZW5ndGg7IGkgPCBtdGV4czsgaSsrKSB7XG4gICAgICBpZiAoaSA8IGwpIHtcbiAgICAgICAgLy8gcnllIFRPRE86IHVwZGF0ZSB0aGlzIHdoZW4gVGV4dHVyZUN1YmUgaXMgaW1wbGVtZW50ZWQuXG4gICAgICAgIC8vIGNvbnN0IGlzQ3ViZSA9IGFwcC50ZXh0dXJlTWVtb1t0ZXhzW2ldXS5pc0N1YmU7XG4gICAgICAgIC8vIGlmIChpc0N1YmUpIHtcbiAgICAgICAgLy8gICBwcm9ncmFtLnNldFVuaWZvcm0oJ2hhc1RleHR1cmVDdWJlJyArIChpICsgMSksIHRydWUpO1xuICAgICAgICAvLyAgIHByb2dyYW0uc2V0VGV4dHVyZSh0ZXhzW2ldLCBnbFsnVEVYVFVSRScgKyBpXSk7XG4gICAgICAgIC8vICAgcHJvZ3JhbS5zZXRVbmlmb3JtKCdzYW1wbGVyQ3ViZScgKyAodGV4Q3ViZSArIDEpLCBpKTtcbiAgICAgICAgLy8gICB0ZXhDdWJlKys7XG4gICAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAgIHByb2dyYW0uc2V0VW5pZm9ybSgnaGFzVGV4dHVyZScgKyAoaSArIDEpLCB0cnVlKTtcbiAgICAgICAgcHJvZ3JhbS5zZXRUZXh0dXJlKHRleHNbaV0sIHRleDJEKTtcbiAgICAgICAgcHJvZ3JhbS5zZXRVbmlmb3JtKCdzYW1wbGVyJyArICh0ZXgyRCArIDEpLCBpKTtcbiAgICAgICAgdGV4MkQrKztcbiAgICAgICAgLy8gfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJvZ3JhbS5zZXRVbmlmb3JtKCdoYXNUZXh0dXJlQ3ViZScgKyAoaSArIDEpLCBmYWxzZSk7XG4gICAgICAgIHByb2dyYW0uc2V0VW5pZm9ybSgnaGFzVGV4dHVyZScgKyAoaSArIDEpLCBmYWxzZSk7XG4gICAgICAgIHByb2dyYW0uc2V0VW5pZm9ybSgnc2FtcGxlcicgKyAoKyt0ZXgyRCksIGkpO1xuICAgICAgICBwcm9ncmFtLnNldFVuaWZvcm0oJ3NhbXBsZXJDdWJlJyArICgrK3RleEN1YmUpLCBpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBUT0RPIC0gTW92ZSBpbnRvIHVuaWZvcm1zIG1hbmFnZXJcbiAgX2NoZWNrVW5pZm9ybXModW5pZm9ybU1hcCkge1xuICAgIGZvciAoY29uc3Qga2V5IGluIHVuaWZvcm1NYXApIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gdW5pZm9ybU1hcFtrZXldO1xuICAgICAgdGhpcy5fY2hlY2tVbmlmb3JtVmFsdWUoa2V5LCB2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgX2NoZWNrVW5pZm9ybVZhbHVlKHVuaWZvcm0sIHZhbHVlKSB7XG4gICAgZnVuY3Rpb24gaXNOdW1iZXIodikge1xuICAgICAgcmV0dXJuICFpc05hTih2KSAmJiBOdW1iZXIodikgPT09IHYgJiYgdiAhPT0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIGxldCBvayA9IHRydWU7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpIHx8IHZhbHVlIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5KSB7XG4gICAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgdmFsdWUpIHtcbiAgICAgICAgaWYgKCFpc051bWJlcihlbGVtZW50KSkge1xuICAgICAgICAgIG9rID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKCFpc051bWJlcih2YWx1ZSkpIHtcbiAgICAgIG9rID0gZmFsc2U7XG4gICAgfVxuICAgIGlmICghb2spIHtcbiAgICAgIC8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnNvbGUgKi9cbiAgICAgIC8qIGdsb2JhbCBjb25zb2xlICovXG4gICAgICAvLyBWYWx1ZSBjb3VsZCBiZSB1bnByaW50YWJsZSBzbyB3cml0ZSB0aGUgb2JqZWN0IG9uIGNvbnNvbGVcbiAgICAgIGNvbnNvbGUuZXJyb3IoYCR7dGhpcy5pZH0gQmFkIHVuaWZvcm0gJHt1bmlmb3JtfWAsIHZhbHVlKTtcbiAgICAgIC8qIGVzbGludC1lbmFibGUgbm8tY29uc29sZSAqL1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGAke3RoaXMuaWR9IEJhZCB1bmlmb3JtICR7dW5pZm9ybX1gKTtcbiAgICB9XG4gIH1cblxuICAvLyBUb2RvIG1vdmUgdG8gYXR0cmlidXRlcyBtYW5hZ2VyXG4gIGdldEF0dHJpYnV0ZXNUYWJsZShhdHRyaWJ1dGVzLCB7XG4gICAgICBoZWFkZXIgPSAnQXR0cmlidXRlcycsXG4gICAgICB0YWJsZSA9IG51bGwsXG4gICAgICBwcm9ncmFtXG4gICAgfSA9IHt9KSB7XG4gICAgdGFibGUgPSB0YWJsZSB8fCB7W2hlYWRlcl06IHt9fTtcbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZU5hbWUgaW4gYXR0cmlidXRlcykge1xuICAgICAgY29uc3QgYXR0cmlidXRlID0gYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXTtcbiAgICAgIHRhYmxlID0gdGFibGUgfHwge307XG4gICAgICB0YWJsZVthdHRyaWJ1dGVOYW1lXSA9IHtcbiAgICAgICAgTmFtZTogYXR0cmlidXRlLnZhbHVlLmNvbnN0cnVjdG9yLm5hbWUsXG4gICAgICAgIEluc3RhbmNlZDogYXR0cmlidXRlLmluc3RhbmNlZCxcbiAgICAgICAgVmVydHM6IGF0dHJpYnV0ZS52YWx1ZS5sZW5ndGggLyBhdHRyaWJ1dGUuc2l6ZSxcbiAgICAgICAgU2l6ZTogYXR0cmlidXRlLnNpemUsXG4gICAgICAgIEJ5dGVzOiBhdHRyaWJ1dGUudmFsdWUubGVuZ3RoICogYXR0cmlidXRlLnZhbHVlLkJZVEVTX1BFUl9FTEVNRU5ULFxuICAgICAgICBsb2NhdGlvbjogcHJvZ3JhbSAmJiBwcm9ncmFtLmF0dHJpYnV0ZUxvY2F0aW9uc1thdHRyaWJ1dGVOYW1lXVxuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHRhYmxlO1xuICB9XG5cbiAgLy8gVE9ETyAtIE1vdmUgdG8gdW5pZm9ybXMgbWFuYWdlclxuICBnZXRVbmlmb3Jtc1RhYmxlKHVuaWZvcm1zLCB7aGVhZGVyID0gJ1VuaWZvcm1zJywgdGFibGUgPSBudWxsfSA9IHt9KSB7XG4gICAgdGFibGUgPSB0YWJsZSB8fCB7W2hlYWRlcl06IHt9fTtcbiAgICBmb3IgKGNvbnN0IHVuaWZvcm1OYW1lIGluIHVuaWZvcm1zKSB7XG4gICAgICBjb25zdCB1bmlmb3JtID0gdW5pZm9ybXNbdW5pZm9ybU5hbWVdO1xuICAgICAgdGFibGVbdW5pZm9ybU5hbWVdID0ge1xuICAgICAgICBUeXBlOiB1bmlmb3JtLFxuICAgICAgICBWYWx1ZTogdW5pZm9ybS50b1N0cmluZygpXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gdGFibGU7XG4gIH1cblxuICAvLyBUT0RPIC0gcmVtb3ZlXG4gIC8qXG4gIHNldFRleENvb3Jkcyhwcm9ncmFtKSB7XG4gICAgaWYgKCF0aGlzLiR0ZXhDb29yZHMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBnbCA9IHByb2dyYW0uZ2w7XG4gICAgY29uc3QgbXVsdGkgPSB0aGlzLiR0ZXhDb29yZHMuY29uc3RydWN0b3IubmFtZSA9PT0gJ09iamVjdCc7XG4gICAgbGV0IHRleDtcblxuICAgIGlmICghdGhpcy5idWZmZXJzLnRleENvb3Jkcykge1xuICAgICAgaWYgKG11bHRpKSB7XG4gICAgICAgIHRoaXMuYnVmZmVycy50ZXhDb29yZHMgPSB7fTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIHR4cyA9IHRoaXMudGV4dHVyZXMsIGwgPSB0eHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgdGV4ID0gdHhzW2ldO1xuICAgICAgICAgIHRoaXMuYnVmZmVycy50ZXhDb29yZHNbJ3RleENvb3JkJyArIChpICsgMSldID0gbmV3IEJ1ZmZlcihnbCwge1xuICAgICAgICAgICAgYXR0cmlidXRlOiAndGV4Q29vcmQnICsgKGkgKyAxKSxcbiAgICAgICAgICAgIGRhdGE6IHRoaXMuJHRleENvb3Jkc1t0ZXhdLFxuICAgICAgICAgICAgc2l6ZTogMlxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmJ1ZmZlcnMudGV4Q29vcmRzID0gbmV3IEJ1ZmZlcihnbCwge1xuICAgICAgICAgIGF0dHJpYnV0ZTogJ3RleENvb3JkMScsXG4gICAgICAgICAgZGF0YTogdGhpcy4kdGV4Q29vcmRzLFxuICAgICAgICAgIHNpemU6IDJcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0aGlzLmR5bmFtaWMpIHtcbiAgICAgIGlmIChtdWx0aSkge1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgdHhzID0gdGhpcy50ZXh0dXJlcywgbCA9IHR4cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICB0ZXggPSB0eHNbaV07XG4gICAgICAgICAgdGhpcy5idWZmZXJzLnRleENvb3Jkc1sndGV4Q29vcmQnICsgKGkgKyAxKV0udXBkYXRlKHtcbiAgICAgICAgICAgIGRhdGE6IHRoaXMuJHRleENvb3Jkc1t0ZXhdXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuYnVmZmVycy50ZXhDb29yZHMudXBkYXRlKHtcbiAgICAgICAgICBkYXRhOiB0aGlzLiR0ZXhDb29yZHNcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG11bHRpKSB7XG4gICAgICBmb3IgKGxldCBpID0gMCwgdHhzID0gdGhpcy50ZXh0dXJlcywgbCA9IHR4cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgdGV4ID0gdHhzW2ldO1xuICAgICAgICBwcm9ncmFtLnNldEJ1ZmZlcih0aGlzLmJ1ZmZlcnMudGV4Q29vcmRzWyd0ZXhDb29yZCcgKyAoaSArIDEpXSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHByb2dyYW0uc2V0QnVmZmVyKHRoaXMuYnVmZmVycy50ZXhDb29yZHMpO1xuICAgIH1cbiAgfVxuXG4gIHNldFZlcnRpY2VzKHByb2dyYW0pIHtcbiAgICBpZiAoIXRoaXMuJHZlcnRpY2VzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghdGhpcy5idWZmZXJzLnBvc2l0aW9uKSB7XG4gICAgICB0aGlzLmJ1ZmZlcnMucG9zaXRpb24gPSBuZXcgQnVmZmVyKHByb2dyYW0uZ2wsIHtcbiAgICAgICAgYXR0cmlidXRlOiAncG9zaXRpb24nLFxuICAgICAgICBkYXRhOiB0aGlzLiR2ZXJ0aWNlcyxcbiAgICAgICAgc2l6ZTogM1xuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmR5bmFtaWMpIHtcbiAgICAgIHRoaXMuYnVmZmVycy5wb3NpdGlvbi51cGRhdGUoe1xuICAgICAgICBkYXRhOiB0aGlzLiR2ZXJ0aWNlc1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJvZ3JhbS5zZXRCdWZmZXIodGhpcy5idWZmZXJzLnBvc2l0aW9uKTtcbiAgfVxuXG4gIHNldE5vcm1hbHMocHJvZ3JhbSkge1xuICAgIGlmICghdGhpcy4kbm9ybWFscykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5idWZmZXJzLm5vcm1hbCkge1xuICAgICAgdGhpcy5idWZmZXJzLm5vcm1hbCA9IG5ldyBCdWZmZXIocHJvZ3JhbS5nbCwge1xuICAgICAgICBhdHRyaWJ1dGU6ICdub3JtYWwnLFxuICAgICAgICBkYXRhOiB0aGlzLiRub3JtYWxzLFxuICAgICAgICBzaXplOiAzXG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuZHluYW1pYykge1xuICAgICAgdGhpcy5idWZmZXJzLm5vcm1hbC51cGRhdGUoe1xuICAgICAgICBkYXRhOiB0aGlzLiRub3JtYWxzXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBwcm9ncmFtLnNldEJ1ZmZlcih0aGlzLmJ1ZmZlcnMubm9ybWFsKTtcbiAgfVxuXG4gIHNldEluZGljZXMocHJvZ3JhbSkge1xuICAgIGlmICghdGhpcy4kaW5kaWNlcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGdsID0gcHJvZ3JhbS5nbDtcblxuICAgIGlmICghdGhpcy5idWZmZXJzLmluZGljZXMpIHtcbiAgICAgIHRoaXMuYnVmZmVycy5pbmRpY2VzID0gbmV3IEJ1ZmZlcihwcm9ncmFtLmdsLCB7XG4gICAgICAgIGJ1ZmZlclR5cGU6IGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLFxuICAgICAgICBkcmF3TW9kZTogZ2wuU1RBVElDX0RSQVcsXG4gICAgICAgIGRhdGE6IHRoaXMuJGluZGljZXMsXG4gICAgICAgIHNpemU6IDFcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodGhpcy5keW5hbWljKSB7XG4gICAgICB0aGlzLmJ1ZmZlcnMuaW5kaWNlcy51cGRhdGUoe1xuICAgICAgICBkYXRhOiB0aGlzLiRpbmRpY2VzXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBwcm9ncmFtLnNldEJ1ZmZlcih0aGlzLmJ1ZmZlcnMuaW5kaWNlcyk7XG4gIH1cblxuICBzZXRQaWNraW5nQ29sb3JzKHByb2dyYW0pIHtcbiAgICBpZiAoIXRoaXMuJHBpY2tpbmdDb2xvcnMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuYnVmZmVycy5waWNraW5nQ29sb3JzKSB7XG4gICAgICB0aGlzLmJ1ZmZlcnMucGlja2luZ0NvbG9ycyA9IG5ldyBCdWZmZXIocHJvZ3JhbS5nbCwge1xuICAgICAgICBhdHRyaWJ1dGU6ICdwaWNraW5nQ29sb3InLFxuICAgICAgICBkYXRhOiB0aGlzLiRwaWNraW5nQ29sb3JzLFxuICAgICAgICBzaXplOiA0XG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuZHluYW1pYykge1xuICAgICAgdGhpcy5idWZmZXJzLnBpY2tpbmdDb2xvcnMudXBkYXRlKHtcbiAgICAgICAgZGF0YTogdGhpcy4kcGlja2luZ0NvbG9yc1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJvZ3JhbS5zZXRCdWZmZXIodGhpcy5idWZmZXJzLnBpY2tpbmdDb2xvcnMpO1xuICB9XG5cbiAgc2V0Q29sb3JzKHByb2dyYW0pIHtcbiAgICBpZiAoIXRoaXMuJGNvbG9ycykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5idWZmZXJzLmNvbG9ycykge1xuICAgICAgdGhpcy5idWZmZXJzLmNvbG9ycyA9IG5ldyBCdWZmZXIocHJvZ3JhbS5nbCwge1xuICAgICAgICBhdHRyaWJ1dGU6ICdjb2xvcicsXG4gICAgICAgIGRhdGE6IHRoaXMuJGNvbG9ycyxcbiAgICAgICAgc2l6ZTogNFxuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmR5bmFtaWMpIHtcbiAgICAgIHRoaXMuYnVmZmVycy5jb2xvcnMudXBkYXRlKHtcbiAgICAgICAgZGF0YTogdGhpcy4kY29sb3JzXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBwcm9ncmFtLnNldEJ1ZmZlcih0aGlzLmJ1ZmZlcnMuY29sb3JzKTtcbiAgfVxuICAqL1xufVxuIl19