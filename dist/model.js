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
          Instanced: attribute.instanced,
          Verts: attribute.value.length / attribute.size,
          Size: attribute.size,
          Bytes: attribute.value.length * attribute.value.BYTES_PER_ELEMENT
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
//# sourceMappingURL=data:application/json;base64,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QUFVLEdBQVYsR0FBZ0IsS0FBSyxhQUFMLENBRGQ7Ozs7U0EzRFEiLCJmaWxlIjoibW9kZWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBBIHNjZW5lZ3JhcGggb2JqZWN0IG5vZGVcbi8qIGVzbGludC1kaXNhYmxlIGd1YXJkLWZvci1pbiAqL1xuXG4vLyBEZWZpbmUgc29tZSBsb2NhbHNcbmltcG9ydCB7TUFYX1RFWFRVUkVTfSBmcm9tICcuL2NvbmZpZyc7XG5pbXBvcnQgT2JqZWN0M0QgZnJvbSAnLi9zY2VuZWdyYXBoL29iamVjdC0zZCc7XG5pbXBvcnQge0J1ZmZlciwgZHJhd30gZnJvbSAnLi93ZWJnbCc7XG5pbXBvcnQge3NwbGF0fSBmcm9tICcuL3V0aWxzJztcbmltcG9ydCBsb2cgZnJvbSAnLi9sb2cnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG4vLyBUT0RPIC0gZXhwZXJpbWVudGFsLCBub3QgeWV0IHVzZWRcbmV4cG9ydCBjbGFzcyBNYXRlcmlhbCB7XG4gIGNvbnN0cnVjdG9yKHtzaGluaW5lc3MgPSAwLCByZWZsZWN0aW9uID0gMCwgcmVmcmFjdGlvbiA9IDB9ID0ge30pIHtcbiAgICB0aGlzLnNoaW5pbmVzcyA9IHNoaW5pbmVzcztcbiAgICB0aGlzLnJlZmxlY3Rpb24gPSByZWZsZWN0aW9uO1xuICAgIHRoaXMucmVmcmFjdGlvbiA9IHJlZnJhY3Rpb247XG4gIH1cbn1cblxuLy8gTW9kZWwgYWJzdHJhY3QgTzNEIENsYXNzXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNb2RlbCBleHRlbmRzIE9iamVjdDNEIHtcblxuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cyAgKi9cbiAgLyogZXNsaW50LWRpc2FibGUgY29tcGxleGl0eSAgKi9cbiAgY29uc3RydWN0b3Ioe1xuICAgIHByb2dyYW0sXG4gICAgZ2VvbWV0cnksXG4gICAgbWF0ZXJpYWwgPSBudWxsLCB0ZXh0dXJlcyA9IFtdLFxuICAgIC8vIEVuYWJsZSBpbnN0YW5jZWQgcmVuZGVyaW5nIChyZXF1aXJlcyBzaGFkZXIgc3VwcG9ydCBhbmQgZXh0cmEgYXR0cmlidXRlcylcbiAgICBpbnN0YW5jZWQgPSBmYWxzZSwgaW5zdGFuY2VDb3VudCA9IDAsXG4gICAgLy8gUGlja2luZ1xuICAgIHBpY2thYmxlID0gZmFsc2UsIHBpY2sgPSBudWxsLFxuICAgIC8vIEV4dHJhIHVuaWZvcm1zIGFuZCBhdHRyaWJ1dGVzIChiZXlvbmQgZ2VvbWV0cnksIG1hdGVyaWFsLCBjYW1lcmEpXG4gICAgdW5pZm9ybXMgPSB7fSxcbiAgICBhdHRyaWJ1dGVzID0ge30sXG4gICAgcmVuZGVyID0gbnVsbCwgb25CZWZvcmVSZW5kZXIgPSBudWxsLCBvbkFmdGVyUmVuZGVyID0gbnVsbCxcbiAgICAuLi5vcHRzXG4gIH0gPSB7fSkge1xuICAgIC8vIGFzc2VydChwcm9ncmFtIHx8IHByb2dyYW0gaW5zdGFuY2VvZiBQcm9ncmFtKTtcbiAgICBhc3NlcnQocHJvZ3JhbSk7XG4gICAgYXNzZXJ0KGdlb21ldHJ5KTtcblxuICAgIHN1cGVyKG9wdHMpO1xuXG4gICAgLy8gc2V0IGEgY3VzdG9tIHByb2dyYW0gcGVyIG8zZFxuICAgIHRoaXMucHJvZ3JhbSA9IHByb2dyYW07XG4gICAgdGhpcy5nZW9tZXRyeSA9IGdlb21ldHJ5O1xuICAgIHRoaXMubWF0ZXJpYWwgPSBtYXRlcmlhbDtcblxuICAgIC8vIGluc3RhbmNlZCByZW5kZXJpbmdcbiAgICB0aGlzLmluc3RhbmNlZCA9IGluc3RhbmNlZDtcbiAgICB0aGlzLmluc3RhbmNlQ291bnQgPSBpbnN0YW5jZUNvdW50O1xuXG4gICAgLy8gcGlja2luZyBvcHRpb25zXG4gICAgdGhpcy5waWNrYWJsZSA9IEJvb2xlYW4ocGlja2FibGUpO1xuICAgIHRoaXMucGljayA9IHBpY2sgfHwgKCgpID0+IGZhbHNlKTtcblxuICAgIC8vIGV4dHJhIHVuaWZvcm1zIGFuZCBhdHRyaWJ1dGUgZGVzY3JpcHRvcnNcbiAgICB0aGlzLnVuaWZvcm1zID0gdW5pZm9ybXM7XG4gICAgdGhpcy5hdHRyaWJ1dGVzID0gYXR0cmlidXRlcztcblxuICAgIC8vIG92ZXJyaWRlIHRoZSByZW5kZXIgbWV0aG9kLCBiZWZvcmUgYW5kIGFmdGVyIHJlbmRlciBjYWxsYmFja3NcbiAgICB0aGlzLnJlbmRlciA9IHJlbmRlciB8fCB0aGlzLnJlbmRlcjtcbiAgICB0aGlzLm9uQmVmb3JlUmVuZGVyID0gb25CZWZvcmVSZW5kZXIgfHwgdGhpcy5vbkJlZm9yZVJlbmRlcjtcbiAgICB0aGlzLm9uQWZ0ZXJSZW5kZXIgPSBvbkFmdGVyUmVuZGVyIHx8IHRoaXMub25BZnRlclJlbmRlcjtcblxuICAgIHRoaXMuYnVmZmVycyA9IHt9O1xuICAgIHRoaXMudXNlckRhdGEgPSB7fTtcblxuICAgIHRoaXMudGV4dHVyZXMgPSBzcGxhdCh0ZXh0dXJlcyk7XG5cbiAgICAvLyBUT0RPIC0gcmVtb3ZlP1xuICAgIHRoaXMuZHluYW1pYyA9IGZhbHNlO1xuXG4gICAgT2JqZWN0LnNlYWwodGhpcyk7XG4gIH1cbiAgLyogZXNsaW50LWVuYWJsZSBtYXgtc3RhdGVtZW50cyAqL1xuICAvKiBlc2xpbnQtZW5hYmxlIGNvbXBsZXhpdHkgKi9cblxuICBnZXQgaGFzaCgpIHtcbiAgICByZXR1cm4gdGhpcy5pZCArICcgJyArIHRoaXMuJHBpY2tpbmdJbmRleDtcbiAgfVxuXG4gIHNldEluc3RhbmNlQ291bnQoaW5zdGFuY2VDb3VudCkge1xuICAgIGFzc2VydChpbnN0YW5jZUNvdW50ICE9PSB1bmRlZmluZWQpO1xuICAgIHRoaXMuaW5zdGFuY2VDb3VudCA9IGluc3RhbmNlQ291bnQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXRJbnN0YW5jZUNvdW50KCkge1xuICAgIHJldHVybiB0aGlzLmluc3RhbmNlQ291bnQ7XG4gIH1cblxuICBnZXRWZXJ0ZXhDb3VudCgpIHtcbiAgICByZXR1cm4gdGhpcy5nZW9tZXRyeS5nZXRWZXJ0ZXhDb3VudCgpO1xuICB9XG5cbiAgaXNJbmRleGVkKCkge1xuICAgIHJldHVybiBCb29sZWFuKHRoaXMuZ2VvbWV0cnkuaW5kaWNlcyk7XG4gIH1cblxuICBnZXRQcm9ncmFtKCkge1xuICAgIHJldHVybiB0aGlzLnByb2dyYW07XG4gIH1cblxuICBpc1BpY2thYmxlKCkge1xuICAgIHJldHVybiB0aGlzLnBpY2thYmxlO1xuICB9XG5cbiAgc2V0UGlja2FibGUocGlja2FibGUgPSB0cnVlKSB7XG4gICAgdGhpcy5waWNrYWJsZSA9IEJvb2xlYW4ocGlja2FibGUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZ2V0QXR0cmlidXRlcygpIHtcbiAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzO1xuICB9XG5cbiAgc2V0QXR0cmlidXRlcyhhdHRyaWJ1dGVzID0ge30pIHtcbiAgICBPYmplY3QuYXNzaWduKHRoaXMuYXR0cmlidXRlcywgYXR0cmlidXRlcyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXRVbmlmb3JtcygpIHtcbiAgICByZXR1cm4gdGhpcy51bmlmb3JtcztcbiAgfVxuXG4gIHNldFVuaWZvcm1zKHVuaWZvcm1zID0ge30pIHtcbiAgICB0aGlzLl9jaGVja1VuaWZvcm1zKHVuaWZvcm1zKTtcbiAgICBPYmplY3QuYXNzaWduKHRoaXMudW5pZm9ybXMsIHVuaWZvcm1zKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIG9uQmVmb3JlUmVuZGVyKCkge1xuICAgIGNvbnN0IHtwcm9ncmFtLCBhdHRyaWJ1dGVzfSA9IHRoaXM7XG4gICAgcHJvZ3JhbS51c2UoKTtcbiAgICB0aGlzLnNldEF0dHJpYnV0ZXMoYXR0cmlidXRlcyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByZW5kZXIoZ2wsIHtjYW1lcmEsIHZpZXdNYXRyaXh9KSB7XG4gICAgLy8gQ2FtZXJhIGV4cG9zZXMgdW5pZm9ybXMgdGhhdCBjYW4gYmUgdXNlZCBkaXJlY3RseSBpbiBzaGFkZXJzXG4gICAgdGhpcy5zZXRVbmlmb3JtcyhjYW1lcmEuZ2V0VW5pZm9ybXMoKSk7XG4gICAgdGhpcy5zZXRVbmlmb3Jtcyh0aGlzLmdldENvb3JkaW5hdGVVbmlmb3Jtcyh2aWV3TWF0cml4KSk7XG5cbiAgICBsZXQgdGFibGUgPSB0aGlzLmdldEF0dHJpYnV0ZXNUYWJsZSh0aGlzLmdlb21ldHJ5LmF0dHJpYnV0ZXMsIHtcbiAgICAgIGhlYWRlcjogYEF0dHJpYnV0ZXMgZm9yICR7dGhpcy5nZW9tZXRyeS5pZH1gXG4gICAgfSk7XG4gICAgdGFibGUgPSB0aGlzLmdldEF0dHJpYnV0ZXNUYWJsZSh0aGlzLmF0dHJpYnV0ZXMsIHt0YWJsZX0pO1xuICAgIGxvZy50YWJsZSgzLCB0YWJsZSk7XG5cbiAgICB0YWJsZSA9IHRoaXMuZ2V0VW5pZm9ybXNUYWJsZSh0aGlzLnVuaWZvcm1zLCB7XG4gICAgICBoZWFkZXI6IGBVbmlmb3JtcyBmb3IgJHt0aGlzLmdlb21ldHJ5LmlkfWBcbiAgICB9KTtcbiAgICBsb2cudGFibGUoMywgdGFibGUpO1xuXG4gICAgdGhpcy5zZXRQcm9ncmFtU3RhdGUoKTtcblxuICAgIGNvbnN0IHtnZW9tZXRyeSwgaW5zdGFuY2VkLCBpbnN0YW5jZUNvdW50fSA9IHRoaXM7XG4gICAgY29uc3Qge2RyYXdNb2RlfSA9IGdlb21ldHJ5O1xuICAgIGRyYXcoZ2wsIHtcbiAgICAgIGRyYXdNb2RlLFxuICAgICAgdmVydGV4Q291bnQ6IHRoaXMuZ2V0VmVydGV4Q291bnQoKSxcbiAgICAgIGluZGV4ZWQ6IHRoaXMuaXNJbmRleGVkKCksXG4gICAgICBpbnN0YW5jZWQsXG4gICAgICBpbnN0YW5jZUNvdW50XG4gICAgfSk7XG4gIH1cblxuICBvbkFmdGVyUmVuZGVyKCkge1xuICAgIGNvbnN0IHtwcm9ncmFtLCBhdHRyaWJ1dGVzfSA9IHRoaXM7XG4gICAgcHJvZ3JhbS51c2UoKTtcbiAgICB0aGlzLnVuc2V0QXR0cmlidXRlcyhhdHRyaWJ1dGVzKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFByb2dyYW1TdGF0ZSgpIHtcbiAgICBjb25zdCB7cHJvZ3JhbX0gPSB0aGlzO1xuICAgIHByb2dyYW0uc2V0VW5pZm9ybXModGhpcy51bmlmb3Jtcyk7XG4gICAgdGhpcy5lbmFibGVBdHRyaWJ1dGVzKHRoaXMuYXR0cmlidXRlcyk7XG4gICAgdGhpcy5lbmFibGVBdHRyaWJ1dGVzKHRoaXMuZ2VvbWV0cnkuYXR0cmlidXRlcyk7XG4gICAgdGhpcy5zZXRUZXh0dXJlcyhwcm9ncmFtKTtcblxuICAgIC8vIHRoaXMuc2V0VmVydGljZXMocHJvZ3JhbSk7XG4gICAgLy8gdGhpcy5zZXRDb2xvcnMocHJvZ3JhbSk7XG4gICAgLy8gdGhpcy5zZXRQaWNraW5nQ29sb3JzKHByb2dyYW0pO1xuICAgIC8vIHRoaXMuc2V0Tm9ybWFscyhwcm9ncmFtKTtcbiAgICAvLyB0aGlzLnNldFRleENvb3Jkcyhwcm9ncmFtKTtcbiAgICAvLyB0aGlzLnNldEluZGljZXMocHJvZ3JhbSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB1bnNldFByb2dyYW1TdGF0ZSgpIHtcbiAgICBjb25zdCB7cHJvZ3JhbX0gPSB0aGlzO1xuICAgIGNvbnN0IGdsID0gcHJvZ3JhbS5nbDtcblxuICAgIC8vIHVuYmluZCB0aGUgYXJyYXkgYW5kIGVsZW1lbnQgYnVmZmVyc1xuICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBudWxsKTtcbiAgICBnbC5iaW5kQnVmZmVyKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBudWxsKTtcblxuICAgIHZhciBhdHRyaWJ1dGVzID0gcHJvZ3JhbS5hdHRyaWJ1dGVzO1xuICAgIGZvciAodmFyIG5hbWUgaW4gYXR0cmlidXRlcykge1xuICAgICAgZ2wuZGlzYWJsZVZlcnRleEF0dHJpYkFycmF5KGF0dHJpYnV0ZXNbbmFtZV0pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIE1ha2VzIHN1cmUgYnVmZmVycyBhcmUgY3JlYXRlZCBmb3IgYWxsIGF0dHJpYnV0ZXNcbiAgLy8gYW5kIHRoYXQgdGhlIHByb2dyYW0gaXMgdXBkYXRlZCB3aXRoIHRob3NlIGJ1ZmZlcnNcbiAgLy8gVE9ETyAtIGRvIHdlIG5lZWQgdGhlIHNlcGFyYXRpb24gYmV0d2VlbiBcImF0dHJpYnV0ZXNcIiBhbmQgXCJidWZmZXJzXCJcbiAgLy8gIGNvdWxkbid0IGFwcHMganVzdCBjcmVhdGUgYnVmZmVycyBkaXJlY3RseT9cbiAgZW5hYmxlQXR0cmlidXRlcyhhdHRyaWJ1dGVzKSB7XG4gICAgYXNzZXJ0KGF0dHJpYnV0ZXMpO1xuICAgIGNvbnN0IHtwcm9ncmFtfSA9IHRoaXM7XG4gICAgZm9yIChjb25zdCBhdHRyaWJ1dGVOYW1lIG9mIE9iamVjdC5rZXlzKGF0dHJpYnV0ZXMpKSB7XG4gICAgICBjb25zdCBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdO1xuICAgICAgY29uc3QgYnVmZmVyT3B0cyA9IHtcbiAgICAgICAgYXR0cmlidXRlOiBhdHRyaWJ1dGVOYW1lLFxuICAgICAgICBkYXRhOiBhdHRyaWJ1dGUudmFsdWUsXG4gICAgICAgIHNpemU6IGF0dHJpYnV0ZS5zaXplLFxuICAgICAgICBpbnN0YW5jZWQ6IGF0dHJpYnV0ZS5pbnN0YW5jZWQgPyAxIDogMCxcbiAgICAgICAgYnVmZmVyVHlwZTogYXR0cmlidXRlLmJ1ZmZlclR5cGUgfHwgcHJvZ3JhbS5nbC5BUlJBWV9CVUZGRVIsXG4gICAgICAgIGRyYXdNb2RlOiBhdHRyaWJ1dGUuZHJhd01vZGUgfHwgcHJvZ3JhbS5nbC5TVEFUSUNfRFJBV1xuICAgICAgfTtcbiAgICAgIGlmICghdGhpcy5idWZmZXJzW2F0dHJpYnV0ZU5hbWVdKSB7XG4gICAgICAgIHRoaXMuYnVmZmVyc1thdHRyaWJ1dGVOYW1lXSA9IG5ldyBCdWZmZXIocHJvZ3JhbS5nbCwgYnVmZmVyT3B0cyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmJ1ZmZlcnNbYXR0cmlidXRlTmFtZV0udXBkYXRlKGJ1ZmZlck9wdHMpO1xuICAgICAgfVxuICAgICAgcHJvZ3JhbS5zZXRCdWZmZXIodGhpcy5idWZmZXJzW2F0dHJpYnV0ZU5hbWVdKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB1bnNldEF0dHJpYnV0ZXMoYXR0cmlidXRlcykge1xuICAgIGFzc2VydChhdHRyaWJ1dGVzKTtcbiAgICBjb25zdCB7cHJvZ3JhbX0gPSB0aGlzO1xuICAgIGZvciAoY29uc3QgYXR0cmlidXRlTmFtZSBvZiBPYmplY3Qua2V5cyhhdHRyaWJ1dGVzKSkge1xuICAgICAgYXNzZXJ0KHRoaXMuYnVmZmVyc1thdHRyaWJ1dGVOYW1lXSk7XG4gICAgICBwcm9ncmFtLnVuc2V0QnVmZmVyKHRoaXMuYnVmZmVyc1thdHRyaWJ1dGVOYW1lXSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0VGV4dHVyZXMoZm9yY2UgPSBmYWxzZSkge1xuICAgIGNvbnN0IHtwcm9ncmFtfSA9IHRoaXM7XG4gICAgdGhpcy50ZXh0dXJlcyA9IHRoaXMudGV4dHVyZXMgPyBzcGxhdCh0aGlzLnRleHR1cmVzKSA6IFtdO1xuICAgIGxldCB0ZXgyRCA9IDA7XG4gICAgbGV0IHRleEN1YmUgPSAwO1xuICAgIGNvbnN0IG10ZXhzID0gTUFYX1RFWFRVUkVTO1xuICAgIGZvciAobGV0IGkgPSAwLCB0ZXhzID0gdGhpcy50ZXh0dXJlcywgbCA9IHRleHMubGVuZ3RoOyBpIDwgbXRleHM7IGkrKykge1xuICAgICAgaWYgKGkgPCBsKSB7XG4gICAgICAgIC8vIHJ5ZSBUT0RPOiB1cGRhdGUgdGhpcyB3aGVuIFRleHR1cmVDdWJlIGlzIGltcGxlbWVudGVkLlxuICAgICAgICAvLyBjb25zdCBpc0N1YmUgPSBhcHAudGV4dHVyZU1lbW9bdGV4c1tpXV0uaXNDdWJlO1xuICAgICAgICAvLyBpZiAoaXNDdWJlKSB7XG4gICAgICAgIC8vICAgcHJvZ3JhbS5zZXRVbmlmb3JtKCdoYXNUZXh0dXJlQ3ViZScgKyAoaSArIDEpLCB0cnVlKTtcbiAgICAgICAgLy8gICBwcm9ncmFtLnNldFRleHR1cmUodGV4c1tpXSwgZ2xbJ1RFWFRVUkUnICsgaV0pO1xuICAgICAgICAvLyAgIHByb2dyYW0uc2V0VW5pZm9ybSgnc2FtcGxlckN1YmUnICsgKHRleEN1YmUgKyAxKSwgaSk7XG4gICAgICAgIC8vICAgdGV4Q3ViZSsrO1xuICAgICAgICAvLyB9IGVsc2Uge1xuICAgICAgICBwcm9ncmFtLnNldFVuaWZvcm0oJ2hhc1RleHR1cmUnICsgKGkgKyAxKSwgdHJ1ZSk7XG4gICAgICAgIHByb2dyYW0uc2V0VGV4dHVyZSh0ZXhzW2ldLCB0ZXgyRCk7XG4gICAgICAgIHByb2dyYW0uc2V0VW5pZm9ybSgnc2FtcGxlcicgKyAodGV4MkQgKyAxKSwgaSk7XG4gICAgICAgIHRleDJEKys7XG4gICAgICAgIC8vIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHByb2dyYW0uc2V0VW5pZm9ybSgnaGFzVGV4dHVyZUN1YmUnICsgKGkgKyAxKSwgZmFsc2UpO1xuICAgICAgICBwcm9ncmFtLnNldFVuaWZvcm0oJ2hhc1RleHR1cmUnICsgKGkgKyAxKSwgZmFsc2UpO1xuICAgICAgICBwcm9ncmFtLnNldFVuaWZvcm0oJ3NhbXBsZXInICsgKCsrdGV4MkQpLCBpKTtcbiAgICAgICAgcHJvZ3JhbS5zZXRVbmlmb3JtKCdzYW1wbGVyQ3ViZScgKyAoKyt0ZXhDdWJlKSwgaSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gVE9ETyAtIE1vdmUgaW50byB1bmlmb3JtcyBtYW5hZ2VyXG4gIF9jaGVja1VuaWZvcm1zKHVuaWZvcm1NYXApIHtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiB1bmlmb3JtTWFwKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IHVuaWZvcm1NYXBba2V5XTtcbiAgICAgIHRoaXMuX2NoZWNrVW5pZm9ybVZhbHVlKGtleSwgdmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIF9jaGVja1VuaWZvcm1WYWx1ZSh1bmlmb3JtLCB2YWx1ZSkge1xuICAgIGZ1bmN0aW9uIGlzTnVtYmVyKHYpIHtcbiAgICAgIHJldHVybiAhaXNOYU4odikgJiYgTnVtYmVyKHYpID09PSB2ICYmIHYgIT09IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBsZXQgb2sgPSB0cnVlO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSB8fCB2YWx1ZSBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSkge1xuICAgICAgZm9yIChjb25zdCBlbGVtZW50IG9mIHZhbHVlKSB7XG4gICAgICAgIGlmICghaXNOdW1iZXIoZWxlbWVudCkpIHtcbiAgICAgICAgICBvayA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICghaXNOdW1iZXIodmFsdWUpKSB7XG4gICAgICBvayA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAoIW9rKSB7XG4gICAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby1jb25zb2xlICovXG4gICAgICAvKiBnbG9iYWwgY29uc29sZSAqL1xuICAgICAgLy8gVmFsdWUgY291bGQgYmUgdW5wcmludGFibGUgc28gd3JpdGUgdGhlIG9iamVjdCBvbiBjb25zb2xlXG4gICAgICBjb25zb2xlLmVycm9yKGAke3RoaXMuaWR9IEJhZCB1bmlmb3JtICR7dW5pZm9ybX1gLCB2YWx1ZSk7XG4gICAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLWNvbnNvbGUgKi9cbiAgICAgIHRocm93IG5ldyBFcnJvcihgJHt0aGlzLmlkfSBCYWQgdW5pZm9ybSAke3VuaWZvcm19YCk7XG4gICAgfVxuICB9XG5cbiAgLy8gVG9kbyBtb3ZlIHRvIGF0dHJpYnV0ZXMgbWFuYWdlclxuICBnZXRBdHRyaWJ1dGVzVGFibGUoYXR0cmlidXRlcywge2hlYWRlciA9ICdBdHRyaWJ1dGVzJywgdGFibGUgPSBudWxsfSA9IHt9KSB7XG4gICAgdGFibGUgPSB0YWJsZSB8fCB7W2hlYWRlcl06IHt9fTtcbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZU5hbWUgaW4gYXR0cmlidXRlcykge1xuICAgICAgY29uc3QgYXR0cmlidXRlID0gYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXTtcbiAgICAgIHRhYmxlID0gdGFibGUgfHwge307XG4gICAgICB0YWJsZVthdHRyaWJ1dGVOYW1lXSA9IHtcbiAgICAgICAgTmFtZTogYXR0cmlidXRlLnZhbHVlLmNvbnN0cnVjdG9yLm5hbWUsXG4gICAgICAgIEluc3RhbmNlZDogYXR0cmlidXRlLmluc3RhbmNlZCxcbiAgICAgICAgVmVydHM6IGF0dHJpYnV0ZS52YWx1ZS5sZW5ndGggLyBhdHRyaWJ1dGUuc2l6ZSxcbiAgICAgICAgU2l6ZTogYXR0cmlidXRlLnNpemUsXG4gICAgICAgIEJ5dGVzOiBhdHRyaWJ1dGUudmFsdWUubGVuZ3RoICogYXR0cmlidXRlLnZhbHVlLkJZVEVTX1BFUl9FTEVNRU5UXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gdGFibGU7XG4gIH1cblxuICAvLyBUT0RPIC0gTW92ZSB0byB1bmlmb3JtcyBtYW5hZ2VyXG4gIGdldFVuaWZvcm1zVGFibGUodW5pZm9ybXMsIHtoZWFkZXIgPSAnVW5pZm9ybXMnLCB0YWJsZSA9IG51bGx9ID0ge30pIHtcbiAgICB0YWJsZSA9IHRhYmxlIHx8IHtbaGVhZGVyXToge319O1xuICAgIGZvciAoY29uc3QgdW5pZm9ybU5hbWUgaW4gdW5pZm9ybXMpIHtcbiAgICAgIGNvbnN0IHVuaWZvcm0gPSB1bmlmb3Jtc1t1bmlmb3JtTmFtZV07XG4gICAgICB0YWJsZVt1bmlmb3JtTmFtZV0gPSB7XG4gICAgICAgIFR5cGU6IHVuaWZvcm0sXG4gICAgICAgIFZhbHVlOiB1bmlmb3JtLnRvU3RyaW5nKClcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB0YWJsZTtcbiAgfVxuXG4gIC8vIFRPRE8gLSByZW1vdmVcbiAgLypcbiAgc2V0VGV4Q29vcmRzKHByb2dyYW0pIHtcbiAgICBpZiAoIXRoaXMuJHRleENvb3Jkcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGdsID0gcHJvZ3JhbS5nbDtcbiAgICBjb25zdCBtdWx0aSA9IHRoaXMuJHRleENvb3Jkcy5jb25zdHJ1Y3Rvci5uYW1lID09PSAnT2JqZWN0JztcbiAgICBsZXQgdGV4O1xuXG4gICAgaWYgKCF0aGlzLmJ1ZmZlcnMudGV4Q29vcmRzKSB7XG4gICAgICBpZiAobXVsdGkpIHtcbiAgICAgICAgdGhpcy5idWZmZXJzLnRleENvb3JkcyA9IHt9O1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgdHhzID0gdGhpcy50ZXh0dXJlcywgbCA9IHR4cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICB0ZXggPSB0eHNbaV07XG4gICAgICAgICAgdGhpcy5idWZmZXJzLnRleENvb3Jkc1sndGV4Q29vcmQnICsgKGkgKyAxKV0gPSBuZXcgQnVmZmVyKGdsLCB7XG4gICAgICAgICAgICBhdHRyaWJ1dGU6ICd0ZXhDb29yZCcgKyAoaSArIDEpLFxuICAgICAgICAgICAgZGF0YTogdGhpcy4kdGV4Q29vcmRzW3RleF0sXG4gICAgICAgICAgICBzaXplOiAyXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuYnVmZmVycy50ZXhDb29yZHMgPSBuZXcgQnVmZmVyKGdsLCB7XG4gICAgICAgICAgYXR0cmlidXRlOiAndGV4Q29vcmQxJyxcbiAgICAgICAgICBkYXRhOiB0aGlzLiR0ZXhDb29yZHMsXG4gICAgICAgICAgc2l6ZTogMlxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRoaXMuZHluYW1pYykge1xuICAgICAgaWYgKG11bHRpKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwLCB0eHMgPSB0aGlzLnRleHR1cmVzLCBsID0gdHhzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgIHRleCA9IHR4c1tpXTtcbiAgICAgICAgICB0aGlzLmJ1ZmZlcnMudGV4Q29vcmRzWyd0ZXhDb29yZCcgKyAoaSArIDEpXS51cGRhdGUoe1xuICAgICAgICAgICAgZGF0YTogdGhpcy4kdGV4Q29vcmRzW3RleF1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5idWZmZXJzLnRleENvb3Jkcy51cGRhdGUoe1xuICAgICAgICAgIGRhdGE6IHRoaXMuJHRleENvb3Jkc1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobXVsdGkpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwLCB0eHMgPSB0aGlzLnRleHR1cmVzLCBsID0gdHhzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICB0ZXggPSB0eHNbaV07XG4gICAgICAgIHByb2dyYW0uc2V0QnVmZmVyKHRoaXMuYnVmZmVycy50ZXhDb29yZHNbJ3RleENvb3JkJyArIChpICsgMSldKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcHJvZ3JhbS5zZXRCdWZmZXIodGhpcy5idWZmZXJzLnRleENvb3Jkcyk7XG4gICAgfVxuICB9XG5cbiAgc2V0VmVydGljZXMocHJvZ3JhbSkge1xuICAgIGlmICghdGhpcy4kdmVydGljZXMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCF0aGlzLmJ1ZmZlcnMucG9zaXRpb24pIHtcbiAgICAgIHRoaXMuYnVmZmVycy5wb3NpdGlvbiA9IG5ldyBCdWZmZXIocHJvZ3JhbS5nbCwge1xuICAgICAgICBhdHRyaWJ1dGU6ICdwb3NpdGlvbicsXG4gICAgICAgIGRhdGE6IHRoaXMuJHZlcnRpY2VzLFxuICAgICAgICBzaXplOiAzXG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuZHluYW1pYykge1xuICAgICAgdGhpcy5idWZmZXJzLnBvc2l0aW9uLnVwZGF0ZSh7XG4gICAgICAgIGRhdGE6IHRoaXMuJHZlcnRpY2VzXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBwcm9ncmFtLnNldEJ1ZmZlcih0aGlzLmJ1ZmZlcnMucG9zaXRpb24pO1xuICB9XG5cbiAgc2V0Tm9ybWFscyhwcm9ncmFtKSB7XG4gICAgaWYgKCF0aGlzLiRub3JtYWxzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmJ1ZmZlcnMubm9ybWFsKSB7XG4gICAgICB0aGlzLmJ1ZmZlcnMubm9ybWFsID0gbmV3IEJ1ZmZlcihwcm9ncmFtLmdsLCB7XG4gICAgICAgIGF0dHJpYnV0ZTogJ25vcm1hbCcsXG4gICAgICAgIGRhdGE6IHRoaXMuJG5vcm1hbHMsXG4gICAgICAgIHNpemU6IDNcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodGhpcy5keW5hbWljKSB7XG4gICAgICB0aGlzLmJ1ZmZlcnMubm9ybWFsLnVwZGF0ZSh7XG4gICAgICAgIGRhdGE6IHRoaXMuJG5vcm1hbHNcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHByb2dyYW0uc2V0QnVmZmVyKHRoaXMuYnVmZmVycy5ub3JtYWwpO1xuICB9XG5cbiAgc2V0SW5kaWNlcyhwcm9ncmFtKSB7XG4gICAgaWYgKCF0aGlzLiRpbmRpY2VzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZ2wgPSBwcm9ncmFtLmdsO1xuXG4gICAgaWYgKCF0aGlzLmJ1ZmZlcnMuaW5kaWNlcykge1xuICAgICAgdGhpcy5idWZmZXJzLmluZGljZXMgPSBuZXcgQnVmZmVyKHByb2dyYW0uZ2wsIHtcbiAgICAgICAgYnVmZmVyVHlwZTogZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsXG4gICAgICAgIGRyYXdNb2RlOiBnbC5TVEFUSUNfRFJBVyxcbiAgICAgICAgZGF0YTogdGhpcy4kaW5kaWNlcyxcbiAgICAgICAgc2l6ZTogMVxuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmR5bmFtaWMpIHtcbiAgICAgIHRoaXMuYnVmZmVycy5pbmRpY2VzLnVwZGF0ZSh7XG4gICAgICAgIGRhdGE6IHRoaXMuJGluZGljZXNcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHByb2dyYW0uc2V0QnVmZmVyKHRoaXMuYnVmZmVycy5pbmRpY2VzKTtcbiAgfVxuXG4gIHNldFBpY2tpbmdDb2xvcnMocHJvZ3JhbSkge1xuICAgIGlmICghdGhpcy4kcGlja2luZ0NvbG9ycykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5idWZmZXJzLnBpY2tpbmdDb2xvcnMpIHtcbiAgICAgIHRoaXMuYnVmZmVycy5waWNraW5nQ29sb3JzID0gbmV3IEJ1ZmZlcihwcm9ncmFtLmdsLCB7XG4gICAgICAgIGF0dHJpYnV0ZTogJ3BpY2tpbmdDb2xvcicsXG4gICAgICAgIGRhdGE6IHRoaXMuJHBpY2tpbmdDb2xvcnMsXG4gICAgICAgIHNpemU6IDRcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodGhpcy5keW5hbWljKSB7XG4gICAgICB0aGlzLmJ1ZmZlcnMucGlja2luZ0NvbG9ycy51cGRhdGUoe1xuICAgICAgICBkYXRhOiB0aGlzLiRwaWNraW5nQ29sb3JzXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBwcm9ncmFtLnNldEJ1ZmZlcih0aGlzLmJ1ZmZlcnMucGlja2luZ0NvbG9ycyk7XG4gIH1cblxuICBzZXRDb2xvcnMocHJvZ3JhbSkge1xuICAgIGlmICghdGhpcy4kY29sb3JzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmJ1ZmZlcnMuY29sb3JzKSB7XG4gICAgICB0aGlzLmJ1ZmZlcnMuY29sb3JzID0gbmV3IEJ1ZmZlcihwcm9ncmFtLmdsLCB7XG4gICAgICAgIGF0dHJpYnV0ZTogJ2NvbG9yJyxcbiAgICAgICAgZGF0YTogdGhpcy4kY29sb3JzLFxuICAgICAgICBzaXplOiA0XG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuZHluYW1pYykge1xuICAgICAgdGhpcy5idWZmZXJzLmNvbG9ycy51cGRhdGUoe1xuICAgICAgICBkYXRhOiB0aGlzLiRjb2xvcnNcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHByb2dyYW0uc2V0QnVmZmVyKHRoaXMuYnVmZmVycy5jb2xvcnMpO1xuICB9XG4gICovXG59XG4iXX0=