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
      return this.vertexCount == undefined ? this.geometry.getVertexCount() : this.vertexCount;
    }

    //isIndexed() {
    //  return Boolean(this.geometry.indices);
    //}

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9tb2RlbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFJQTs7QUFDQTs7OztBQUNBOztBQUNBOztBQUNBOzs7O0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFHYSw4QkFDWCxTQURXLFFBQ1gsR0FBa0U7bUVBQUosa0JBQUk7OzRCQUFyRCxVQUFxRDtNQUFyRCwyQ0FBWSxtQkFBeUM7NkJBQXRDLFdBQXNDO01BQXRDLDZDQUFhLG9CQUF5Qjs2QkFBdEIsV0FBc0I7TUFBdEIsNkNBQWEsb0JBQVM7O3dCQUR2RCxVQUN1RDs7QUFDaEUsT0FBSyxTQUFMLEdBQWlCLFNBQWpCLENBRGdFO0FBRWhFLE9BQUssVUFBTCxHQUFrQixVQUFsQixDQUZnRTtBQUdoRSxPQUFLLFVBQUwsR0FBa0IsVUFBbEIsQ0FIZ0U7Q0FBbEU7Ozs7O0lBUW1COzs7Ozs7QUFJbkIsV0FKbUIsS0FJbkIsR0FnQlE7c0VBQUosa0JBQUk7O1FBZk4sd0JBZU07UUFkTiwwQkFjTTsrQkFiTixTQWFNO1FBYk4sMENBQVcsc0JBYUw7K0JBYlcsU0FhWDtRQWJXLDBDQUFXLG9CQWF0QjtnQ0FYTixVQVdNOzs7QUFYTixnREFBWSx3QkFXTjtvQ0FWTixjQVVNO1FBVk4sb0RBQWdCLHdCQVVWO2tDQVROLFlBU007UUFUTixnREFBYyw4QkFTUjtnQ0FSTixVQVFNO1FBUk4sNENBQVksNEJBUU47K0JBTk4sU0FNTTs7O0FBTk4sOENBQVcsdUJBTUw7MkJBTlksS0FNWjtRQU5ZLGtDQUFPLGtCQU1uQjsrQkFKTixTQUlNOzs7QUFKTiw4Q0FBVyxvQkFJTDtpQ0FITixXQUdNO1FBSE4sOENBQWEsc0JBR1A7NkJBRk4sT0FFTTtRQUZOLHNDQUFTLG9CQUVIO3FDQUZTLGVBRVQ7UUFGUyxzREFBaUIsNEJBRTFCO29DQUZnQyxjQUVoQztRQUZnQyxvREFBZ0IsMkJBRWhEOztRQURILDZPQUNHOzswQkFwQlcsT0FvQlg7OztBQUVOLDBCQUFPLE9BQVAsRUFGTTtBQUdOLDBCQUFPLFFBQVAsRUFITTs7Ozt1RUFwQlcsa0JBeUJYLE9BTEE7O0FBUU4sVUFBSyxPQUFMLEdBQWUsT0FBZixDQVJNO0FBU04sVUFBSyxRQUFMLEdBQWdCLFFBQWhCLENBVE07QUFVTixVQUFLLFFBQUwsR0FBZ0IsUUFBaEI7OztBQVZNLFNBYU4sQ0FBSyxTQUFMLEdBQWlCLFNBQWpCLENBYk07QUFjTixVQUFLLGFBQUwsR0FBcUIsYUFBckIsQ0FkTTtBQWVOLFVBQUssV0FBTCxHQUFtQixXQUFuQixDQWZNO0FBZ0JOLFVBQUssU0FBTCxHQUFpQixjQUFjLFNBQWQsR0FBMEIsUUFBUSxNQUFLLFFBQUwsQ0FBYyxPQUFkLENBQWxDLEdBQTJELFNBQTNEOzs7QUFoQlgsU0FtQk4sQ0FBSyxRQUFMLEdBQWdCLFFBQVEsUUFBUixDQUFoQixDQW5CTTtBQW9CTixVQUFLLElBQUwsR0FBWSxRQUFTO2FBQU07S0FBTjs7O0FBcEJmLFNBdUJOLENBQUssUUFBTCxHQUFnQixRQUFoQixDQXZCTTtBQXdCTixVQUFLLFVBQUwsR0FBa0IsVUFBbEI7OztBQXhCTSxTQTJCTixDQUFLLE1BQUwsR0FBYyxVQUFVLE1BQUssTUFBTCxDQTNCbEI7QUE0Qk4sVUFBSyxjQUFMLEdBQXNCLGtCQUFrQixNQUFLLGNBQUwsQ0E1QmxDO0FBNkJOLFVBQUssYUFBTCxHQUFxQixpQkFBaUIsTUFBSyxhQUFMLENBN0JoQzs7QUErQk4sVUFBSyxPQUFMLEdBQWUsRUFBZixDQS9CTTtBQWdDTixVQUFLLFFBQUwsR0FBZ0IsRUFBaEIsQ0FoQ007O0FBa0NOLFVBQUssUUFBTCxHQUFnQixrQkFBTSxRQUFOLENBQWhCOzs7QUFsQ00sU0FxQ04sQ0FBSyxPQUFMLEdBQWUsS0FBZixDQXJDTTs7QUF1Q04sV0FBTyxJQUFQLFFBdkNNOztHQWhCUjs7OztlQUptQjs7cUNBb0VGLGVBQWU7QUFDOUIsNEJBQU8sa0JBQWtCLFNBQWxCLENBQVAsQ0FEOEI7QUFFOUIsV0FBSyxhQUFMLEdBQXFCLGFBQXJCLENBRjhCO0FBRzlCLGFBQU8sSUFBUCxDQUg4Qjs7Ozt1Q0FNYjtBQUNqQixhQUFPLEtBQUssYUFBTCxDQURVOzs7O21DQUlKLGFBQWE7QUFDMUIsV0FBSyxXQUFMLEdBQW1CLFdBQW5CLENBRDBCOzs7O3FDQUlYO0FBQ2YsYUFBTyxLQUFLLFdBQUwsSUFBb0IsU0FBcEIsR0FBZ0MsS0FBSyxRQUFMLENBQWMsY0FBZCxFQUFoQyxHQUFpRSxLQUFLLFdBQUwsQ0FEekQ7Ozs7Ozs7OztpQ0FRSjtBQUNYLGFBQU8sS0FBSyxPQUFMLENBREk7Ozs7aUNBSUE7QUFDWCxhQUFPLEtBQUssUUFBTCxDQURJOzs7O2tDQUlnQjtVQUFqQixpRUFBVyxvQkFBTTs7QUFDM0IsV0FBSyxRQUFMLEdBQWdCLFFBQVEsUUFBUixDQUFoQixDQUQyQjtBQUUzQixhQUFPLElBQVAsQ0FGMkI7Ozs7b0NBS2I7QUFDZCxhQUFPLEtBQUssVUFBTCxDQURPOzs7O29DQUllO1VBQWpCLG1FQUFhLGtCQUFJOztBQUM3QixhQUFPLE1BQVAsQ0FBYyxLQUFLLFVBQUwsRUFBaUIsVUFBL0IsRUFENkI7QUFFN0IsYUFBTyxJQUFQLENBRjZCOzs7O2tDQUtqQjtBQUNaLGFBQU8sS0FBSyxRQUFMLENBREs7Ozs7a0NBSWE7VUFBZixpRUFBVyxrQkFBSTs7QUFDekIsV0FBSyxjQUFMLENBQW9CLFFBQXBCLEVBRHlCO0FBRXpCLGFBQU8sTUFBUCxDQUFjLEtBQUssUUFBTCxFQUFlLFFBQTdCLEVBRnlCO0FBR3pCLGFBQU8sSUFBUCxDQUh5Qjs7OztxQ0FNVjtVQUNSLFVBQXVCLEtBQXZCLFFBRFE7VUFDQyxhQUFjLEtBQWQsV0FERDs7QUFFZixjQUFRLEdBQVIsR0FGZTtBQUdmLFdBQUssYUFBTCxDQUFtQixVQUFuQixFQUhlO0FBSWYsYUFBTyxJQUFQLENBSmU7Ozs7MkJBT1YsV0FBMEI7VUFBckIsc0JBQXFCO1VBQWIsOEJBQWE7OztBQUUvQixXQUFLLFdBQUwsQ0FBaUIsT0FBTyxXQUFQLEVBQWpCLEVBRitCO0FBRy9CLFdBQUssV0FBTCxDQUFpQixLQUFLLHFCQUFMLENBQTJCLFVBQTNCLENBQWpCLEVBSCtCOztBQUsvQixVQUFJLFFBQVEsS0FBSyxrQkFBTCxDQUF3QixLQUFLLFFBQUwsQ0FBYyxVQUFkLEVBQTBCO0FBQzVELG9DQUEwQixLQUFLLFFBQUwsQ0FBYyxFQUFkO0FBQzFCLGlCQUFTLEtBQUssT0FBTDtPQUZDLENBQVIsQ0FMMkI7QUFTL0IsY0FBUSxLQUFLLGtCQUFMLENBQXdCLEtBQUssVUFBTCxFQUFpQjtBQUMvQyxvQkFEK0M7QUFFL0MsaUJBQVMsS0FBSyxPQUFMO09BRkgsQ0FBUixDQVQrQjtBQWEvQixvQkFBSSxLQUFKLENBQVUsQ0FBVixFQUFhLEtBQWIsRUFiK0I7O0FBZS9CLGNBQVEsS0FBSyxnQkFBTCxDQUFzQixLQUFLLFFBQUwsRUFBZTtBQUMzQyxrQ0FBd0IsS0FBSyxRQUFMLENBQWMsRUFBZDtPQURsQixDQUFSLENBZitCO0FBa0IvQixvQkFBSSxLQUFKLENBQVUsQ0FBVixFQUFhLEtBQWIsRUFsQitCOztBQW9CL0IsV0FBSyxlQUFMLEdBcEIrQjs7VUFzQnhCLFdBQXNDLEtBQXRDLFNBdEJ3QjtVQXNCZCxZQUE0QixLQUE1QixVQXRCYztVQXNCSCxnQkFBaUIsS0FBakIsY0F0Qkc7VUF1QnhCLFdBQVksU0FBWixTQXZCd0I7O0FBd0IvQix1QkFBSyxFQUFMLEVBQVM7QUFDUCwwQkFETztBQUVQLHFCQUFhLEtBQUssY0FBTCxFQUFiO0FBQ0EsaUJBQVMsS0FBSyxTQUFMO0FBQ1QsNEJBSk87QUFLUCxvQ0FMTztPQUFULEVBeEIrQjs7OztvQ0FpQ2pCO1VBQ1AsVUFBdUIsS0FBdkIsUUFETztVQUNFLGFBQWMsS0FBZCxXQURGOztBQUVkLGNBQVEsR0FBUixHQUZjO0FBR2QsV0FBSyxlQUFMLENBQXFCLFVBQXJCLEVBSGM7QUFJZCxhQUFPLElBQVAsQ0FKYzs7OztzQ0FPRTtVQUNULFVBQVcsS0FBWCxRQURTOztBQUVoQixjQUFRLFdBQVIsQ0FBb0IsS0FBSyxRQUFMLENBQXBCLENBRmdCO0FBR2hCLFdBQUssZ0JBQUwsQ0FBc0IsS0FBSyxVQUFMLENBQXRCLENBSGdCO0FBSWhCLFdBQUssZ0JBQUwsQ0FBc0IsS0FBSyxRQUFMLENBQWMsVUFBZCxDQUF0QixDQUpnQjtBQUtoQixXQUFLLFdBQUwsQ0FBaUIsT0FBakI7Ozs7Ozs7O0FBTGdCLGFBYVQsSUFBUCxDQWJnQjs7Ozt3Q0FnQkU7VUFDWCxVQUFXLEtBQVgsUUFEVzs7QUFFbEIsVUFBTSxLQUFLLFFBQVEsRUFBUjs7O0FBRk8sUUFLbEIsQ0FBRyxVQUFILENBQWMsR0FBRyxZQUFILEVBQWlCLElBQS9CLEVBTGtCO0FBTWxCLFNBQUcsVUFBSCxDQUFjLEdBQUcsb0JBQUgsRUFBeUIsSUFBdkMsRUFOa0I7O0FBUWxCLFVBQUksYUFBYSxRQUFRLFVBQVIsQ0FSQztBQVNsQixXQUFLLElBQUksSUFBSixJQUFZLFVBQWpCLEVBQTZCO0FBQzNCLFdBQUcsd0JBQUgsQ0FBNEIsV0FBVyxJQUFYLENBQTVCLEVBRDJCO09BQTdCO0FBR0EsYUFBTyxJQUFQLENBWmtCOzs7Ozs7Ozs7O3FDQW1CSCxZQUFZO0FBQzNCLDRCQUFPLFVBQVAsRUFEMkI7VUFFcEIsVUFBVyxLQUFYLFFBRm9COzs7Ozs7QUFHM0IsNkJBQTRCLE9BQU8sSUFBUCxDQUFZLFVBQVosMkJBQTVCLG9HQUFxRDtjQUExQyw0QkFBMEM7O0FBQ25ELGNBQU0sWUFBWSxXQUFXLGFBQVgsQ0FBWixDQUQ2QztBQUVuRCxjQUFNLGFBQWE7QUFDakIsdUJBQVcsYUFBWDtBQUNBLGtCQUFNLFVBQVUsS0FBVjtBQUNOLGtCQUFNLFVBQVUsSUFBVjtBQUNOLHVCQUFXLFVBQVUsU0FBVixHQUFzQixDQUF0QixHQUEwQixDQUExQjtBQUNYLHdCQUFZLFVBQVUsVUFBVixJQUF3QixRQUFRLEVBQVIsQ0FBVyxZQUFYO0FBQ3BDLHNCQUFVLFVBQVUsUUFBVixJQUFzQixRQUFRLEVBQVIsQ0FBVyxXQUFYO1dBTjVCLENBRjZDO0FBVW5ELGNBQUksQ0FBQyxLQUFLLE9BQUwsQ0FBYSxhQUFiLENBQUQsRUFBOEI7QUFDaEMsaUJBQUssT0FBTCxDQUFhLGFBQWIsSUFBOEIsa0JBQVcsUUFBUSxFQUFSLEVBQVksVUFBdkIsQ0FBOUIsQ0FEZ0M7V0FBbEMsTUFFTztBQUNMLGlCQUFLLE9BQUwsQ0FBYSxhQUFiLEVBQTRCLE1BQTVCLENBQW1DLFVBQW5DLEVBREs7V0FGUDtBQUtBLGtCQUFRLFNBQVIsQ0FBa0IsS0FBSyxPQUFMLENBQWEsYUFBYixDQUFsQixFQWZtRDtTQUFyRDs7Ozs7Ozs7Ozs7Ozs7T0FIMkI7O0FBb0IzQixhQUFPLElBQVAsQ0FwQjJCOzs7O29DQXVCYixZQUFZO0FBQzFCLDRCQUFPLFVBQVAsRUFEMEI7VUFFbkIsVUFBVyxLQUFYLFFBRm1COzs7Ozs7QUFHMUIsOEJBQTRCLE9BQU8sSUFBUCxDQUFZLFVBQVosNEJBQTVCLHdHQUFxRDtjQUExQyw2QkFBMEM7O0FBQ25ELGdDQUFPLEtBQUssT0FBTCxDQUFhLGFBQWIsQ0FBUCxFQURtRDtBQUVuRCxrQkFBUSxXQUFSLENBQW9CLEtBQUssT0FBTCxDQUFhLGFBQWIsQ0FBcEIsRUFGbUQ7U0FBckQ7Ozs7Ozs7Ozs7Ozs7O09BSDBCOztBQU8xQixhQUFPLElBQVAsQ0FQMEI7Ozs7a0NBVUQ7VUFBZiw4REFBUSxxQkFBTztVQUNsQixVQUFXLEtBQVgsUUFEa0I7O0FBRXpCLFdBQUssUUFBTCxHQUFnQixLQUFLLFFBQUwsR0FBZ0Isa0JBQU0sS0FBSyxRQUFMLENBQXRCLEdBQXVDLEVBQXZDLENBRlM7QUFHekIsVUFBSSxRQUFRLENBQVIsQ0FIcUI7QUFJekIsVUFBSSxVQUFVLENBQVYsQ0FKcUI7QUFLekIsVUFBTSw0QkFBTixDQUx5QjtBQU16QixXQUFLLElBQUksSUFBSSxDQUFKLEVBQU8sT0FBTyxLQUFLLFFBQUwsRUFBZSxJQUFJLEtBQUssTUFBTCxFQUFhLElBQUksS0FBSixFQUFXLEdBQWxFLEVBQXVFO0FBQ3JFLFlBQUksSUFBSSxDQUFKLEVBQU87Ozs7Ozs7OztBQVNULGtCQUFRLFVBQVIsQ0FBbUIsZ0JBQWdCLElBQUksQ0FBSixDQUFoQixFQUF3QixJQUEzQyxFQVRTO0FBVVQsa0JBQVEsVUFBUixDQUFtQixLQUFLLENBQUwsQ0FBbkIsRUFBNEIsS0FBNUIsRUFWUztBQVdULGtCQUFRLFVBQVIsQ0FBbUIsYUFBYSxRQUFRLENBQVIsQ0FBYixFQUF5QixDQUE1QyxFQVhTO0FBWVQ7O0FBWlMsU0FBWCxNQWNPO0FBQ0wsb0JBQVEsVUFBUixDQUFtQixvQkFBb0IsSUFBSSxDQUFKLENBQXBCLEVBQTRCLEtBQS9DLEVBREs7QUFFTCxvQkFBUSxVQUFSLENBQW1CLGdCQUFnQixJQUFJLENBQUosQ0FBaEIsRUFBd0IsS0FBM0MsRUFGSztBQUdMLG9CQUFRLFVBQVIsQ0FBbUIsWUFBYSxFQUFFLEtBQUYsRUFBVSxDQUExQyxFQUhLO0FBSUwsb0JBQVEsVUFBUixDQUFtQixnQkFBaUIsRUFBRSxPQUFGLEVBQVksQ0FBaEQsRUFKSztXQWRQO09BREY7QUFzQkEsYUFBTyxJQUFQLENBNUJ5Qjs7Ozs7OzttQ0FnQ1osWUFBWTtBQUN6QixXQUFLLElBQU0sR0FBTixJQUFhLFVBQWxCLEVBQThCO0FBQzVCLFlBQU0sUUFBUSxXQUFXLEdBQVgsQ0FBUixDQURzQjtBQUU1QixhQUFLLGtCQUFMLENBQXdCLEdBQXhCLEVBQTZCLEtBQTdCLEVBRjRCO09BQTlCOzs7O3VDQU1pQixTQUFTLE9BQU87QUFDakMsZUFBUyxRQUFULENBQWtCLENBQWxCLEVBQXFCO0FBQ25CLGVBQU8sQ0FBQyxNQUFNLENBQU4sQ0FBRCxJQUFhLE9BQU8sQ0FBUCxNQUFjLENBQWQsSUFBbUIsTUFBTSxTQUFOLENBRHBCO09BQXJCOztBQUlBLFVBQUksS0FBSyxJQUFMLENBTDZCO0FBTWpDLFVBQUksTUFBTSxPQUFOLENBQWMsS0FBZCxLQUF3QixpQkFBaUIsWUFBakIsRUFBK0I7Ozs7OztBQUN6RCxnQ0FBc0IsZ0NBQXRCLHdHQUE2QjtnQkFBbEIsdUJBQWtCOztBQUMzQixnQkFBSSxDQUFDLFNBQVMsT0FBVCxDQUFELEVBQW9CO0FBQ3RCLG1CQUFLLEtBQUwsQ0FEc0I7YUFBeEI7V0FERjs7Ozs7Ozs7Ozs7Ozs7U0FEeUQ7T0FBM0QsTUFNTyxJQUFJLENBQUMsU0FBUyxLQUFULENBQUQsRUFBa0I7QUFDM0IsYUFBSyxLQUFMLENBRDJCO09BQXRCO0FBR1AsVUFBSSxDQUFDLEVBQUQsRUFBSzs7OztBQUlQLGdCQUFRLEtBQVIsQ0FBaUIsS0FBSyxFQUFMLHFCQUF1QixPQUF4QyxFQUFtRCxLQUFuRDs7QUFKTyxjQU1ELElBQUksS0FBSixDQUFhLEtBQUssRUFBTCxxQkFBdUIsT0FBcEMsQ0FBTixDQU5PO09BQVQ7Ozs7Ozs7dUNBV2lCLFlBSVQ7d0VBQUosa0JBQUk7OytCQUhOLE9BR007VUFITixzQ0FBUyw0QkFHSDs4QkFGTixNQUVNO1VBRk4sb0NBQVEsbUJBRUY7VUFETix3QkFDTTs7QUFDUixjQUFRLDZCQUFXLFFBQVMsR0FBcEIsQ0FEQTtBQUVSLFdBQUssSUFBTSxhQUFOLElBQXVCLFVBQTVCLEVBQXdDO0FBQ3RDLFlBQU0sWUFBWSxXQUFXLGFBQVgsQ0FBWixDQURnQztBQUV0QyxnQkFBUSxTQUFTLEVBQVQsQ0FGOEI7QUFHdEMsY0FBTSxhQUFOLElBQXVCO0FBQ3JCLGdCQUFNLFVBQVUsS0FBVixDQUFnQixXQUFoQixDQUE0QixJQUE1QjtBQUNOLHFCQUFXLFVBQVUsU0FBVjtBQUNYLGlCQUFPLFVBQVUsS0FBVixDQUFnQixNQUFoQixHQUF5QixVQUFVLElBQVY7QUFDaEMsZ0JBQU0sVUFBVSxJQUFWO0FBQ04saUJBQU8sVUFBVSxLQUFWLENBQWdCLE1BQWhCLEdBQXlCLFVBQVUsS0FBVixDQUFnQixpQkFBaEI7QUFDaEMsb0JBQVUsV0FBVyxRQUFRLGtCQUFSLENBQTJCLGFBQTNCLENBQVg7U0FOWixDQUhzQztPQUF4QztBQVlBLGFBQU8sS0FBUCxDQWRROzs7Ozs7O3FDQWtCTyxVQUFvRDt3RUFBSixrQkFBSTs7K0JBQXpDLE9BQXlDO1VBQXpDLHNDQUFTLDBCQUFnQzs4QkFBcEIsTUFBb0I7VUFBcEIsb0NBQVEsbUJBQVk7O0FBQ25FLGNBQVEsNkJBQVcsUUFBUyxHQUFwQixDQUQyRDtBQUVuRSxXQUFLLElBQU0sV0FBTixJQUFxQixRQUExQixFQUFvQztBQUNsQyxZQUFNLFVBQVUsU0FBUyxXQUFULENBQVYsQ0FENEI7QUFFbEMsY0FBTSxXQUFOLElBQXFCO0FBQ25CLGdCQUFNLE9BQU47QUFDQSxpQkFBTyxRQUFRLFFBQVIsRUFBUDtTQUZGLENBRmtDO09BQXBDO0FBT0EsYUFBTyxLQUFQLENBVG1FOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7d0JBcFExRDtBQUNULGFBQU8sS0FBSyxFQUFMLEdBQVUsR0FBVixHQUFnQixLQUFLLGFBQUwsQ0FEZDs7OztTQWhFUSIsImZpbGUiOiJtb2RlbC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIEEgc2NlbmVncmFwaCBvYmplY3Qgbm9kZVxuLyogZXNsaW50LWRpc2FibGUgZ3VhcmQtZm9yLWluICovXG5cbi8vIERlZmluZSBzb21lIGxvY2Fsc1xuaW1wb3J0IHtNQVhfVEVYVFVSRVN9IGZyb20gJy4vY29uZmlnJztcbmltcG9ydCBPYmplY3QzRCBmcm9tICcuL3NjZW5lZ3JhcGgvb2JqZWN0LTNkJztcbmltcG9ydCB7QnVmZmVyLCBkcmF3fSBmcm9tICcuL3dlYmdsJztcbmltcG9ydCB7c3BsYXR9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IGxvZyBmcm9tICcuL2xvZyc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbi8vIFRPRE8gLSBleHBlcmltZW50YWwsIG5vdCB5ZXQgdXNlZFxuZXhwb3J0IGNsYXNzIE1hdGVyaWFsIHtcbiAgY29uc3RydWN0b3Ioe3NoaW5pbmVzcyA9IDAsIHJlZmxlY3Rpb24gPSAwLCByZWZyYWN0aW9uID0gMH0gPSB7fSkge1xuICAgIHRoaXMuc2hpbmluZXNzID0gc2hpbmluZXNzO1xuICAgIHRoaXMucmVmbGVjdGlvbiA9IHJlZmxlY3Rpb247XG4gICAgdGhpcy5yZWZyYWN0aW9uID0gcmVmcmFjdGlvbjtcbiAgfVxufVxuXG4vLyBNb2RlbCBhYnN0cmFjdCBPM0QgQ2xhc3NcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1vZGVsIGV4dGVuZHMgT2JqZWN0M0Qge1xuXG4gIC8qIGVzbGludC1kaXNhYmxlIG1heC1zdGF0ZW1lbnRzICAqL1xuICAvKiBlc2xpbnQtZGlzYWJsZSBjb21wbGV4aXR5ICAqL1xuICBjb25zdHJ1Y3Rvcih7XG4gICAgcHJvZ3JhbSxcbiAgICBnZW9tZXRyeSxcbiAgICBtYXRlcmlhbCA9IG51bGwsIHRleHR1cmVzID0gW10sXG4gICAgLy8gRW5hYmxlIGluc3RhbmNlZCByZW5kZXJpbmcgKHJlcXVpcmVzIHNoYWRlciBzdXBwb3J0IGFuZCBleHRyYSBhdHRyaWJ1dGVzKVxuICAgIGluc3RhbmNlZCA9IGZhbHNlLFxuICAgIGluc3RhbmNlQ291bnQgPSAwLFxuICAgIHZlcnRleENvdW50ID0gdW5kZWZpbmVkLFxuICAgIGlzSW5kZXhlZCA9IHVuZGVmaW5lZCxcbiAgICAvLyBQaWNraW5nXG4gICAgcGlja2FibGUgPSBmYWxzZSwgcGljayA9IG51bGwsXG4gICAgLy8gRXh0cmEgdW5pZm9ybXMgYW5kIGF0dHJpYnV0ZXMgKGJleW9uZCBnZW9tZXRyeSwgbWF0ZXJpYWwsIGNhbWVyYSlcbiAgICB1bmlmb3JtcyA9IHt9LFxuICAgIGF0dHJpYnV0ZXMgPSB7fSxcbiAgICByZW5kZXIgPSBudWxsLCBvbkJlZm9yZVJlbmRlciA9IG51bGwsIG9uQWZ0ZXJSZW5kZXIgPSBudWxsLFxuICAgIC4uLm9wdHNcbiAgfSA9IHt9KSB7XG4gICAgLy8gYXNzZXJ0KHByb2dyYW0gfHwgcHJvZ3JhbSBpbnN0YW5jZW9mIFByb2dyYW0pO1xuICAgIGFzc2VydChwcm9ncmFtKTtcbiAgICBhc3NlcnQoZ2VvbWV0cnkpO1xuXG4gICAgc3VwZXIob3B0cyk7XG5cbiAgICAvLyBzZXQgYSBjdXN0b20gcHJvZ3JhbSBwZXIgbzNkXG4gICAgdGhpcy5wcm9ncmFtID0gcHJvZ3JhbTtcbiAgICB0aGlzLmdlb21ldHJ5ID0gZ2VvbWV0cnk7XG4gICAgdGhpcy5tYXRlcmlhbCA9IG1hdGVyaWFsO1xuXG4gICAgLy8gaW5zdGFuY2VkIHJlbmRlcmluZ1xuICAgIHRoaXMuaW5zdGFuY2VkID0gaW5zdGFuY2VkO1xuICAgIHRoaXMuaW5zdGFuY2VDb3VudCA9IGluc3RhbmNlQ291bnQ7XG4gICAgdGhpcy52ZXJ0ZXhDb3VudCA9IHZlcnRleENvdW50O1xuICAgIHRoaXMuaXNJbmRleGVkID0gaXNJbmRleGVkID09PSB1bmRlZmluZWQgPyBCb29sZWFuKHRoaXMuZ2VvbWV0cnkuaW5kaWNlcykgOiBpc0luZGV4ZWQ7XG5cbiAgICAvLyBwaWNraW5nIG9wdGlvbnNcbiAgICB0aGlzLnBpY2thYmxlID0gQm9vbGVhbihwaWNrYWJsZSk7XG4gICAgdGhpcy5waWNrID0gcGljayB8fCAoKCkgPT4gZmFsc2UpO1xuXG4gICAgLy8gZXh0cmEgdW5pZm9ybXMgYW5kIGF0dHJpYnV0ZSBkZXNjcmlwdG9yc1xuICAgIHRoaXMudW5pZm9ybXMgPSB1bmlmb3JtcztcbiAgICB0aGlzLmF0dHJpYnV0ZXMgPSBhdHRyaWJ1dGVzO1xuXG4gICAgLy8gb3ZlcnJpZGUgdGhlIHJlbmRlciBtZXRob2QsIGJlZm9yZSBhbmQgYWZ0ZXIgcmVuZGVyIGNhbGxiYWNrc1xuICAgIHRoaXMucmVuZGVyID0gcmVuZGVyIHx8IHRoaXMucmVuZGVyO1xuICAgIHRoaXMub25CZWZvcmVSZW5kZXIgPSBvbkJlZm9yZVJlbmRlciB8fCB0aGlzLm9uQmVmb3JlUmVuZGVyO1xuICAgIHRoaXMub25BZnRlclJlbmRlciA9IG9uQWZ0ZXJSZW5kZXIgfHwgdGhpcy5vbkFmdGVyUmVuZGVyO1xuXG4gICAgdGhpcy5idWZmZXJzID0ge307XG4gICAgdGhpcy51c2VyRGF0YSA9IHt9O1xuXG4gICAgdGhpcy50ZXh0dXJlcyA9IHNwbGF0KHRleHR1cmVzKTtcblxuICAgIC8vIFRPRE8gLSByZW1vdmU/XG4gICAgdGhpcy5keW5hbWljID0gZmFsc2U7XG5cbiAgICBPYmplY3Quc2VhbCh0aGlzKTtcbiAgfVxuICAvKiBlc2xpbnQtZW5hYmxlIG1heC1zdGF0ZW1lbnRzICovXG4gIC8qIGVzbGludC1lbmFibGUgY29tcGxleGl0eSAqL1xuXG4gIGdldCBoYXNoKCkge1xuICAgIHJldHVybiB0aGlzLmlkICsgJyAnICsgdGhpcy4kcGlja2luZ0luZGV4O1xuICB9XG5cbiAgc2V0SW5zdGFuY2VDb3VudChpbnN0YW5jZUNvdW50KSB7XG4gICAgYXNzZXJ0KGluc3RhbmNlQ291bnQgIT09IHVuZGVmaW5lZCk7XG4gICAgdGhpcy5pbnN0YW5jZUNvdW50ID0gaW5zdGFuY2VDb3VudDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldEluc3RhbmNlQ291bnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW5zdGFuY2VDb3VudDtcbiAgfVxuXG4gIHNldFZlcnRleENvdW50KHZlcnRleENvdW50KSB7XG4gICAgdGhpcy52ZXJ0ZXhDb3VudCA9IHZlcnRleENvdW50O1xuICB9XG5cbiAgZ2V0VmVydGV4Q291bnQoKSB7XG4gICAgcmV0dXJuIHRoaXMudmVydGV4Q291bnQgPT0gdW5kZWZpbmVkID8gdGhpcy5nZW9tZXRyeS5nZXRWZXJ0ZXhDb3VudCgpIDogdGhpcy52ZXJ0ZXhDb3VudDtcbiAgfVxuXG4gIC8vaXNJbmRleGVkKCkge1xuICAvLyAgcmV0dXJuIEJvb2xlYW4odGhpcy5nZW9tZXRyeS5pbmRpY2VzKTtcbiAgLy99XG5cbiAgZ2V0UHJvZ3JhbSgpIHtcbiAgICByZXR1cm4gdGhpcy5wcm9ncmFtO1xuICB9XG5cbiAgaXNQaWNrYWJsZSgpIHtcbiAgICByZXR1cm4gdGhpcy5waWNrYWJsZTtcbiAgfVxuXG4gIHNldFBpY2thYmxlKHBpY2thYmxlID0gdHJ1ZSkge1xuICAgIHRoaXMucGlja2FibGUgPSBCb29sZWFuKHBpY2thYmxlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldEF0dHJpYnV0ZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlcztcbiAgfVxuXG4gIHNldEF0dHJpYnV0ZXMoYXR0cmlidXRlcyA9IHt9KSB7XG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLmF0dHJpYnV0ZXMsIGF0dHJpYnV0ZXMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZ2V0VW5pZm9ybXMoKSB7XG4gICAgcmV0dXJuIHRoaXMudW5pZm9ybXM7XG4gIH1cblxuICBzZXRVbmlmb3Jtcyh1bmlmb3JtcyA9IHt9KSB7XG4gICAgdGhpcy5fY2hlY2tVbmlmb3Jtcyh1bmlmb3Jtcyk7XG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLnVuaWZvcm1zLCB1bmlmb3Jtcyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBvbkJlZm9yZVJlbmRlcigpIHtcbiAgICBjb25zdCB7cHJvZ3JhbSwgYXR0cmlidXRlc30gPSB0aGlzO1xuICAgIHByb2dyYW0udXNlKCk7XG4gICAgdGhpcy5zZXRBdHRyaWJ1dGVzKGF0dHJpYnV0ZXMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcmVuZGVyKGdsLCB7Y2FtZXJhLCB2aWV3TWF0cml4fSkge1xuICAgIC8vIENhbWVyYSBleHBvc2VzIHVuaWZvcm1zIHRoYXQgY2FuIGJlIHVzZWQgZGlyZWN0bHkgaW4gc2hhZGVyc1xuICAgIHRoaXMuc2V0VW5pZm9ybXMoY2FtZXJhLmdldFVuaWZvcm1zKCkpO1xuICAgIHRoaXMuc2V0VW5pZm9ybXModGhpcy5nZXRDb29yZGluYXRlVW5pZm9ybXModmlld01hdHJpeCkpO1xuXG4gICAgbGV0IHRhYmxlID0gdGhpcy5nZXRBdHRyaWJ1dGVzVGFibGUodGhpcy5nZW9tZXRyeS5hdHRyaWJ1dGVzLCB7XG4gICAgICBoZWFkZXI6IGBBdHRyaWJ1dGVzIGZvciAke3RoaXMuZ2VvbWV0cnkuaWR9YCxcbiAgICAgIHByb2dyYW06IHRoaXMucHJvZ3JhbVxuICAgIH0pO1xuICAgIHRhYmxlID0gdGhpcy5nZXRBdHRyaWJ1dGVzVGFibGUodGhpcy5hdHRyaWJ1dGVzLCB7XG4gICAgICB0YWJsZSxcbiAgICAgIHByb2dyYW06IHRoaXMucHJvZ3JhbVxuICAgIH0pO1xuICAgIGxvZy50YWJsZSgzLCB0YWJsZSk7XG5cbiAgICB0YWJsZSA9IHRoaXMuZ2V0VW5pZm9ybXNUYWJsZSh0aGlzLnVuaWZvcm1zLCB7XG4gICAgICBoZWFkZXI6IGBVbmlmb3JtcyBmb3IgJHt0aGlzLmdlb21ldHJ5LmlkfWBcbiAgICB9KTtcbiAgICBsb2cudGFibGUoMywgdGFibGUpO1xuXG4gICAgdGhpcy5zZXRQcm9ncmFtU3RhdGUoKTtcblxuICAgIGNvbnN0IHtnZW9tZXRyeSwgaW5zdGFuY2VkLCBpbnN0YW5jZUNvdW50fSA9IHRoaXM7XG4gICAgY29uc3Qge2RyYXdNb2RlfSA9IGdlb21ldHJ5O1xuICAgIGRyYXcoZ2wsIHtcbiAgICAgIGRyYXdNb2RlLFxuICAgICAgdmVydGV4Q291bnQ6IHRoaXMuZ2V0VmVydGV4Q291bnQoKSxcbiAgICAgIGluZGV4ZWQ6IHRoaXMuaXNJbmRleGVkLFxuICAgICAgaW5zdGFuY2VkLFxuICAgICAgaW5zdGFuY2VDb3VudFxuICAgIH0pO1xuICB9XG5cbiAgb25BZnRlclJlbmRlcigpIHtcbiAgICBjb25zdCB7cHJvZ3JhbSwgYXR0cmlidXRlc30gPSB0aGlzO1xuICAgIHByb2dyYW0udXNlKCk7XG4gICAgdGhpcy51bnNldEF0dHJpYnV0ZXMoYXR0cmlidXRlcyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRQcm9ncmFtU3RhdGUoKSB7XG4gICAgY29uc3Qge3Byb2dyYW19ID0gdGhpcztcbiAgICBwcm9ncmFtLnNldFVuaWZvcm1zKHRoaXMudW5pZm9ybXMpO1xuICAgIHRoaXMuZW5hYmxlQXR0cmlidXRlcyh0aGlzLmF0dHJpYnV0ZXMpO1xuICAgIHRoaXMuZW5hYmxlQXR0cmlidXRlcyh0aGlzLmdlb21ldHJ5LmF0dHJpYnV0ZXMpO1xuICAgIHRoaXMuc2V0VGV4dHVyZXMocHJvZ3JhbSk7XG5cbiAgICAvLyB0aGlzLnNldFZlcnRpY2VzKHByb2dyYW0pO1xuICAgIC8vIHRoaXMuc2V0Q29sb3JzKHByb2dyYW0pO1xuICAgIC8vIHRoaXMuc2V0UGlja2luZ0NvbG9ycyhwcm9ncmFtKTtcbiAgICAvLyB0aGlzLnNldE5vcm1hbHMocHJvZ3JhbSk7XG4gICAgLy8gdGhpcy5zZXRUZXhDb29yZHMocHJvZ3JhbSk7XG4gICAgLy8gdGhpcy5zZXRJbmRpY2VzKHByb2dyYW0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdW5zZXRQcm9ncmFtU3RhdGUoKSB7XG4gICAgY29uc3Qge3Byb2dyYW19ID0gdGhpcztcbiAgICBjb25zdCBnbCA9IHByb2dyYW0uZ2w7XG5cbiAgICAvLyB1bmJpbmQgdGhlIGFycmF5IGFuZCBlbGVtZW50IGJ1ZmZlcnNcbiAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgbnVsbCk7XG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgbnVsbCk7XG5cbiAgICB2YXIgYXR0cmlidXRlcyA9IHByb2dyYW0uYXR0cmlidXRlcztcbiAgICBmb3IgKHZhciBuYW1lIGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgIGdsLmRpc2FibGVWZXJ0ZXhBdHRyaWJBcnJheShhdHRyaWJ1dGVzW25hbWVdKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBNYWtlcyBzdXJlIGJ1ZmZlcnMgYXJlIGNyZWF0ZWQgZm9yIGFsbCBhdHRyaWJ1dGVzXG4gIC8vIGFuZCB0aGF0IHRoZSBwcm9ncmFtIGlzIHVwZGF0ZWQgd2l0aCB0aG9zZSBidWZmZXJzXG4gIC8vIFRPRE8gLSBkbyB3ZSBuZWVkIHRoZSBzZXBhcmF0aW9uIGJldHdlZW4gXCJhdHRyaWJ1dGVzXCIgYW5kIFwiYnVmZmVyc1wiXG4gIC8vICBjb3VsZG4ndCBhcHBzIGp1c3QgY3JlYXRlIGJ1ZmZlcnMgZGlyZWN0bHk/XG4gIGVuYWJsZUF0dHJpYnV0ZXMoYXR0cmlidXRlcykge1xuICAgIGFzc2VydChhdHRyaWJ1dGVzKTtcbiAgICBjb25zdCB7cHJvZ3JhbX0gPSB0aGlzO1xuICAgIGZvciAoY29uc3QgYXR0cmlidXRlTmFtZSBvZiBPYmplY3Qua2V5cyhhdHRyaWJ1dGVzKSkge1xuICAgICAgY29uc3QgYXR0cmlidXRlID0gYXR0cmlidXRlc1thdHRyaWJ1dGVOYW1lXTtcbiAgICAgIGNvbnN0IGJ1ZmZlck9wdHMgPSB7XG4gICAgICAgIGF0dHJpYnV0ZTogYXR0cmlidXRlTmFtZSxcbiAgICAgICAgZGF0YTogYXR0cmlidXRlLnZhbHVlLFxuICAgICAgICBzaXplOiBhdHRyaWJ1dGUuc2l6ZSxcbiAgICAgICAgaW5zdGFuY2VkOiBhdHRyaWJ1dGUuaW5zdGFuY2VkID8gMSA6IDAsXG4gICAgICAgIGJ1ZmZlclR5cGU6IGF0dHJpYnV0ZS5idWZmZXJUeXBlIHx8IHByb2dyYW0uZ2wuQVJSQVlfQlVGRkVSLFxuICAgICAgICBkcmF3TW9kZTogYXR0cmlidXRlLmRyYXdNb2RlIHx8IHByb2dyYW0uZ2wuU1RBVElDX0RSQVdcbiAgICAgIH07XG4gICAgICBpZiAoIXRoaXMuYnVmZmVyc1thdHRyaWJ1dGVOYW1lXSkge1xuICAgICAgICB0aGlzLmJ1ZmZlcnNbYXR0cmlidXRlTmFtZV0gPSBuZXcgQnVmZmVyKHByb2dyYW0uZ2wsIGJ1ZmZlck9wdHMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5idWZmZXJzW2F0dHJpYnV0ZU5hbWVdLnVwZGF0ZShidWZmZXJPcHRzKTtcbiAgICAgIH1cbiAgICAgIHByb2dyYW0uc2V0QnVmZmVyKHRoaXMuYnVmZmVyc1thdHRyaWJ1dGVOYW1lXSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdW5zZXRBdHRyaWJ1dGVzKGF0dHJpYnV0ZXMpIHtcbiAgICBhc3NlcnQoYXR0cmlidXRlcyk7XG4gICAgY29uc3Qge3Byb2dyYW19ID0gdGhpcztcbiAgICBmb3IgKGNvbnN0IGF0dHJpYnV0ZU5hbWUgb2YgT2JqZWN0LmtleXMoYXR0cmlidXRlcykpIHtcbiAgICAgIGFzc2VydCh0aGlzLmJ1ZmZlcnNbYXR0cmlidXRlTmFtZV0pO1xuICAgICAgcHJvZ3JhbS51bnNldEJ1ZmZlcih0aGlzLmJ1ZmZlcnNbYXR0cmlidXRlTmFtZV0pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFRleHR1cmVzKGZvcmNlID0gZmFsc2UpIHtcbiAgICBjb25zdCB7cHJvZ3JhbX0gPSB0aGlzO1xuICAgIHRoaXMudGV4dHVyZXMgPSB0aGlzLnRleHR1cmVzID8gc3BsYXQodGhpcy50ZXh0dXJlcykgOiBbXTtcbiAgICBsZXQgdGV4MkQgPSAwO1xuICAgIGxldCB0ZXhDdWJlID0gMDtcbiAgICBjb25zdCBtdGV4cyA9IE1BWF9URVhUVVJFUztcbiAgICBmb3IgKGxldCBpID0gMCwgdGV4cyA9IHRoaXMudGV4dHVyZXMsIGwgPSB0ZXhzLmxlbmd0aDsgaSA8IG10ZXhzOyBpKyspIHtcbiAgICAgIGlmIChpIDwgbCkge1xuICAgICAgICAvLyByeWUgVE9ETzogdXBkYXRlIHRoaXMgd2hlbiBUZXh0dXJlQ3ViZSBpcyBpbXBsZW1lbnRlZC5cbiAgICAgICAgLy8gY29uc3QgaXNDdWJlID0gYXBwLnRleHR1cmVNZW1vW3RleHNbaV1dLmlzQ3ViZTtcbiAgICAgICAgLy8gaWYgKGlzQ3ViZSkge1xuICAgICAgICAvLyAgIHByb2dyYW0uc2V0VW5pZm9ybSgnaGFzVGV4dHVyZUN1YmUnICsgKGkgKyAxKSwgdHJ1ZSk7XG4gICAgICAgIC8vICAgcHJvZ3JhbS5zZXRUZXh0dXJlKHRleHNbaV0sIGdsWydURVhUVVJFJyArIGldKTtcbiAgICAgICAgLy8gICBwcm9ncmFtLnNldFVuaWZvcm0oJ3NhbXBsZXJDdWJlJyArICh0ZXhDdWJlICsgMSksIGkpO1xuICAgICAgICAvLyAgIHRleEN1YmUrKztcbiAgICAgICAgLy8gfSBlbHNlIHtcbiAgICAgICAgcHJvZ3JhbS5zZXRVbmlmb3JtKCdoYXNUZXh0dXJlJyArIChpICsgMSksIHRydWUpO1xuICAgICAgICBwcm9ncmFtLnNldFRleHR1cmUodGV4c1tpXSwgdGV4MkQpO1xuICAgICAgICBwcm9ncmFtLnNldFVuaWZvcm0oJ3NhbXBsZXInICsgKHRleDJEICsgMSksIGkpO1xuICAgICAgICB0ZXgyRCsrO1xuICAgICAgICAvLyB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwcm9ncmFtLnNldFVuaWZvcm0oJ2hhc1RleHR1cmVDdWJlJyArIChpICsgMSksIGZhbHNlKTtcbiAgICAgICAgcHJvZ3JhbS5zZXRVbmlmb3JtKCdoYXNUZXh0dXJlJyArIChpICsgMSksIGZhbHNlKTtcbiAgICAgICAgcHJvZ3JhbS5zZXRVbmlmb3JtKCdzYW1wbGVyJyArICgrK3RleDJEKSwgaSk7XG4gICAgICAgIHByb2dyYW0uc2V0VW5pZm9ybSgnc2FtcGxlckN1YmUnICsgKCsrdGV4Q3ViZSksIGkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIFRPRE8gLSBNb3ZlIGludG8gdW5pZm9ybXMgbWFuYWdlclxuICBfY2hlY2tVbmlmb3Jtcyh1bmlmb3JtTWFwKSB7XG4gICAgZm9yIChjb25zdCBrZXkgaW4gdW5pZm9ybU1hcCkge1xuICAgICAgY29uc3QgdmFsdWUgPSB1bmlmb3JtTWFwW2tleV07XG4gICAgICB0aGlzLl9jaGVja1VuaWZvcm1WYWx1ZShrZXksIHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICBfY2hlY2tVbmlmb3JtVmFsdWUodW5pZm9ybSwgdmFsdWUpIHtcbiAgICBmdW5jdGlvbiBpc051bWJlcih2KSB7XG4gICAgICByZXR1cm4gIWlzTmFOKHYpICYmIE51bWJlcih2KSA9PT0gdiAmJiB2ICE9PSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgbGV0IG9rID0gdHJ1ZTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkgfHwgdmFsdWUgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkpIHtcbiAgICAgIGZvciAoY29uc3QgZWxlbWVudCBvZiB2YWx1ZSkge1xuICAgICAgICBpZiAoIWlzTnVtYmVyKGVsZW1lbnQpKSB7XG4gICAgICAgICAgb2sgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoIWlzTnVtYmVyKHZhbHVlKSkge1xuICAgICAgb2sgPSBmYWxzZTtcbiAgICB9XG4gICAgaWYgKCFvaykge1xuICAgICAgLyogZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSAqL1xuICAgICAgLyogZ2xvYmFsIGNvbnNvbGUgKi9cbiAgICAgIC8vIFZhbHVlIGNvdWxkIGJlIHVucHJpbnRhYmxlIHNvIHdyaXRlIHRoZSBvYmplY3Qgb24gY29uc29sZVxuICAgICAgY29uc29sZS5lcnJvcihgJHt0aGlzLmlkfSBCYWQgdW5pZm9ybSAke3VuaWZvcm19YCwgdmFsdWUpO1xuICAgICAgLyogZXNsaW50LWVuYWJsZSBuby1jb25zb2xlICovXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7dGhpcy5pZH0gQmFkIHVuaWZvcm0gJHt1bmlmb3JtfWApO1xuICAgIH1cbiAgfVxuXG4gIC8vIFRvZG8gbW92ZSB0byBhdHRyaWJ1dGVzIG1hbmFnZXJcbiAgZ2V0QXR0cmlidXRlc1RhYmxlKGF0dHJpYnV0ZXMsIHtcbiAgICAgIGhlYWRlciA9ICdBdHRyaWJ1dGVzJyxcbiAgICAgIHRhYmxlID0gbnVsbCxcbiAgICAgIHByb2dyYW1cbiAgICB9ID0ge30pIHtcbiAgICB0YWJsZSA9IHRhYmxlIHx8IHtbaGVhZGVyXToge319O1xuICAgIGZvciAoY29uc3QgYXR0cmlidXRlTmFtZSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICBjb25zdCBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW2F0dHJpYnV0ZU5hbWVdO1xuICAgICAgdGFibGUgPSB0YWJsZSB8fCB7fTtcbiAgICAgIHRhYmxlW2F0dHJpYnV0ZU5hbWVdID0ge1xuICAgICAgICBOYW1lOiBhdHRyaWJ1dGUudmFsdWUuY29uc3RydWN0b3IubmFtZSxcbiAgICAgICAgSW5zdGFuY2VkOiBhdHRyaWJ1dGUuaW5zdGFuY2VkLFxuICAgICAgICBWZXJ0czogYXR0cmlidXRlLnZhbHVlLmxlbmd0aCAvIGF0dHJpYnV0ZS5zaXplLFxuICAgICAgICBTaXplOiBhdHRyaWJ1dGUuc2l6ZSxcbiAgICAgICAgQnl0ZXM6IGF0dHJpYnV0ZS52YWx1ZS5sZW5ndGggKiBhdHRyaWJ1dGUudmFsdWUuQllURVNfUEVSX0VMRU1FTlQsXG4gICAgICAgIGxvY2F0aW9uOiBwcm9ncmFtICYmIHByb2dyYW0uYXR0cmlidXRlTG9jYXRpb25zW2F0dHJpYnV0ZU5hbWVdXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gdGFibGU7XG4gIH1cblxuICAvLyBUT0RPIC0gTW92ZSB0byB1bmlmb3JtcyBtYW5hZ2VyXG4gIGdldFVuaWZvcm1zVGFibGUodW5pZm9ybXMsIHtoZWFkZXIgPSAnVW5pZm9ybXMnLCB0YWJsZSA9IG51bGx9ID0ge30pIHtcbiAgICB0YWJsZSA9IHRhYmxlIHx8IHtbaGVhZGVyXToge319O1xuICAgIGZvciAoY29uc3QgdW5pZm9ybU5hbWUgaW4gdW5pZm9ybXMpIHtcbiAgICAgIGNvbnN0IHVuaWZvcm0gPSB1bmlmb3Jtc1t1bmlmb3JtTmFtZV07XG4gICAgICB0YWJsZVt1bmlmb3JtTmFtZV0gPSB7XG4gICAgICAgIFR5cGU6IHVuaWZvcm0sXG4gICAgICAgIFZhbHVlOiB1bmlmb3JtLnRvU3RyaW5nKClcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB0YWJsZTtcbiAgfVxuXG4gIC8vIFRPRE8gLSByZW1vdmVcbiAgLypcbiAgc2V0VGV4Q29vcmRzKHByb2dyYW0pIHtcbiAgICBpZiAoIXRoaXMuJHRleENvb3Jkcykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGdsID0gcHJvZ3JhbS5nbDtcbiAgICBjb25zdCBtdWx0aSA9IHRoaXMuJHRleENvb3Jkcy5jb25zdHJ1Y3Rvci5uYW1lID09PSAnT2JqZWN0JztcbiAgICBsZXQgdGV4O1xuXG4gICAgaWYgKCF0aGlzLmJ1ZmZlcnMudGV4Q29vcmRzKSB7XG4gICAgICBpZiAobXVsdGkpIHtcbiAgICAgICAgdGhpcy5idWZmZXJzLnRleENvb3JkcyA9IHt9O1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgdHhzID0gdGhpcy50ZXh0dXJlcywgbCA9IHR4cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICB0ZXggPSB0eHNbaV07XG4gICAgICAgICAgdGhpcy5idWZmZXJzLnRleENvb3Jkc1sndGV4Q29vcmQnICsgKGkgKyAxKV0gPSBuZXcgQnVmZmVyKGdsLCB7XG4gICAgICAgICAgICBhdHRyaWJ1dGU6ICd0ZXhDb29yZCcgKyAoaSArIDEpLFxuICAgICAgICAgICAgZGF0YTogdGhpcy4kdGV4Q29vcmRzW3RleF0sXG4gICAgICAgICAgICBzaXplOiAyXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuYnVmZmVycy50ZXhDb29yZHMgPSBuZXcgQnVmZmVyKGdsLCB7XG4gICAgICAgICAgYXR0cmlidXRlOiAndGV4Q29vcmQxJyxcbiAgICAgICAgICBkYXRhOiB0aGlzLiR0ZXhDb29yZHMsXG4gICAgICAgICAgc2l6ZTogMlxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRoaXMuZHluYW1pYykge1xuICAgICAgaWYgKG11bHRpKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwLCB0eHMgPSB0aGlzLnRleHR1cmVzLCBsID0gdHhzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgIHRleCA9IHR4c1tpXTtcbiAgICAgICAgICB0aGlzLmJ1ZmZlcnMudGV4Q29vcmRzWyd0ZXhDb29yZCcgKyAoaSArIDEpXS51cGRhdGUoe1xuICAgICAgICAgICAgZGF0YTogdGhpcy4kdGV4Q29vcmRzW3RleF1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5idWZmZXJzLnRleENvb3Jkcy51cGRhdGUoe1xuICAgICAgICAgIGRhdGE6IHRoaXMuJHRleENvb3Jkc1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobXVsdGkpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwLCB0eHMgPSB0aGlzLnRleHR1cmVzLCBsID0gdHhzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICB0ZXggPSB0eHNbaV07XG4gICAgICAgIHByb2dyYW0uc2V0QnVmZmVyKHRoaXMuYnVmZmVycy50ZXhDb29yZHNbJ3RleENvb3JkJyArIChpICsgMSldKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcHJvZ3JhbS5zZXRCdWZmZXIodGhpcy5idWZmZXJzLnRleENvb3Jkcyk7XG4gICAgfVxuICB9XG5cbiAgc2V0VmVydGljZXMocHJvZ3JhbSkge1xuICAgIGlmICghdGhpcy4kdmVydGljZXMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCF0aGlzLmJ1ZmZlcnMucG9zaXRpb24pIHtcbiAgICAgIHRoaXMuYnVmZmVycy5wb3NpdGlvbiA9IG5ldyBCdWZmZXIocHJvZ3JhbS5nbCwge1xuICAgICAgICBhdHRyaWJ1dGU6ICdwb3NpdGlvbicsXG4gICAgICAgIGRhdGE6IHRoaXMuJHZlcnRpY2VzLFxuICAgICAgICBzaXplOiAzXG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuZHluYW1pYykge1xuICAgICAgdGhpcy5idWZmZXJzLnBvc2l0aW9uLnVwZGF0ZSh7XG4gICAgICAgIGRhdGE6IHRoaXMuJHZlcnRpY2VzXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBwcm9ncmFtLnNldEJ1ZmZlcih0aGlzLmJ1ZmZlcnMucG9zaXRpb24pO1xuICB9XG5cbiAgc2V0Tm9ybWFscyhwcm9ncmFtKSB7XG4gICAgaWYgKCF0aGlzLiRub3JtYWxzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmJ1ZmZlcnMubm9ybWFsKSB7XG4gICAgICB0aGlzLmJ1ZmZlcnMubm9ybWFsID0gbmV3IEJ1ZmZlcihwcm9ncmFtLmdsLCB7XG4gICAgICAgIGF0dHJpYnV0ZTogJ25vcm1hbCcsXG4gICAgICAgIGRhdGE6IHRoaXMuJG5vcm1hbHMsXG4gICAgICAgIHNpemU6IDNcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodGhpcy5keW5hbWljKSB7XG4gICAgICB0aGlzLmJ1ZmZlcnMubm9ybWFsLnVwZGF0ZSh7XG4gICAgICAgIGRhdGE6IHRoaXMuJG5vcm1hbHNcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHByb2dyYW0uc2V0QnVmZmVyKHRoaXMuYnVmZmVycy5ub3JtYWwpO1xuICB9XG5cbiAgc2V0SW5kaWNlcyhwcm9ncmFtKSB7XG4gICAgaWYgKCF0aGlzLiRpbmRpY2VzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgZ2wgPSBwcm9ncmFtLmdsO1xuXG4gICAgaWYgKCF0aGlzLmJ1ZmZlcnMuaW5kaWNlcykge1xuICAgICAgdGhpcy5idWZmZXJzLmluZGljZXMgPSBuZXcgQnVmZmVyKHByb2dyYW0uZ2wsIHtcbiAgICAgICAgYnVmZmVyVHlwZTogZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsXG4gICAgICAgIGRyYXdNb2RlOiBnbC5TVEFUSUNfRFJBVyxcbiAgICAgICAgZGF0YTogdGhpcy4kaW5kaWNlcyxcbiAgICAgICAgc2l6ZTogMVxuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmR5bmFtaWMpIHtcbiAgICAgIHRoaXMuYnVmZmVycy5pbmRpY2VzLnVwZGF0ZSh7XG4gICAgICAgIGRhdGE6IHRoaXMuJGluZGljZXNcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHByb2dyYW0uc2V0QnVmZmVyKHRoaXMuYnVmZmVycy5pbmRpY2VzKTtcbiAgfVxuXG4gIHNldFBpY2tpbmdDb2xvcnMocHJvZ3JhbSkge1xuICAgIGlmICghdGhpcy4kcGlja2luZ0NvbG9ycykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5idWZmZXJzLnBpY2tpbmdDb2xvcnMpIHtcbiAgICAgIHRoaXMuYnVmZmVycy5waWNraW5nQ29sb3JzID0gbmV3IEJ1ZmZlcihwcm9ncmFtLmdsLCB7XG4gICAgICAgIGF0dHJpYnV0ZTogJ3BpY2tpbmdDb2xvcicsXG4gICAgICAgIGRhdGE6IHRoaXMuJHBpY2tpbmdDb2xvcnMsXG4gICAgICAgIHNpemU6IDRcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodGhpcy5keW5hbWljKSB7XG4gICAgICB0aGlzLmJ1ZmZlcnMucGlja2luZ0NvbG9ycy51cGRhdGUoe1xuICAgICAgICBkYXRhOiB0aGlzLiRwaWNraW5nQ29sb3JzXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBwcm9ncmFtLnNldEJ1ZmZlcih0aGlzLmJ1ZmZlcnMucGlja2luZ0NvbG9ycyk7XG4gIH1cblxuICBzZXRDb2xvcnMocHJvZ3JhbSkge1xuICAgIGlmICghdGhpcy4kY29sb3JzKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmJ1ZmZlcnMuY29sb3JzKSB7XG4gICAgICB0aGlzLmJ1ZmZlcnMuY29sb3JzID0gbmV3IEJ1ZmZlcihwcm9ncmFtLmdsLCB7XG4gICAgICAgIGF0dHJpYnV0ZTogJ2NvbG9yJyxcbiAgICAgICAgZGF0YTogdGhpcy4kY29sb3JzLFxuICAgICAgICBzaXplOiA0XG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuZHluYW1pYykge1xuICAgICAgdGhpcy5idWZmZXJzLmNvbG9ycy51cGRhdGUoe1xuICAgICAgICBkYXRhOiB0aGlzLiRjb2xvcnNcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHByb2dyYW0uc2V0QnVmZmVyKHRoaXMuYnVmZmVycy5jb2xvcnMpO1xuICB9XG4gICovXG59XG4iXX0=