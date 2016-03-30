'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _camera = require('../camera');

var _group = require('./group');

var _group2 = _interopRequireDefault(_group);

var _pick = require('./pick');

var _webgl = require('../webgl');

var _math = require('../math');

var _utils = require('../utils');

var _config = require('../config');

var config = _interopRequireWildcard(_config);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } // Scene Object management and rendering
/* eslint-disable max-statements, no-try-catch */

function noop() {}

var DEFAULT_SCENE_OPTS = {
  lights: {
    enable: false,
    // ambient light
    ambient: { r: 0.2, g: 0.2, b: 0.2 },
    // directional light
    directional: {
      direction: { x: 1, y: 1, z: 1 },
      color: { r: 0, g: 0, b: 0 }
    }
    // point light
    // points: []
  },
  effects: {
    fog: false
    // { near, far, color }
  },
  clearColor: true,
  clearDepth: true,
  backgroundColor: { r: 0, g: 0, b: 0, a: 1 },
  backgroundDepth: 1
};

var INVALID_ARGUMENT = 'LumaGL.Scene invalid argument';

// Scene class

var Scene = function (_Group) {
  _inherits(Scene, _Group);

  function Scene(gl, opts) {
    _classCallCheck(this, Scene);

    (0, _assert2.default)(gl, INVALID_ARGUMENT);

    opts = (0, _utils.merge)(DEFAULT_SCENE_OPTS, opts);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Scene).call(this, opts));

    _this.gl = gl;
    _this.config = opts;
    return _this;
  }

  _createClass(Scene, [{
    key: 'getProgram',
    value: function getProgram(obj) {
      var program = obj ? obj.program : this.program;
      (0, _assert2.default)(program instanceof _webgl.Program, 'Scene failed to find valid program');
      program.use();
      return program;
    }
  }, {
    key: 'defineBuffers',
    value: function defineBuffers(obj) {
      var program = this.getProgram(obj);
      var prevDynamic = obj.dynamic;
      obj.dynamic = true;
      obj.setProgramState(program);
      obj.dynamic = prevDynamic;
      obj.unsetProgramState(program);
      return this;
    }
  }, {
    key: 'clear',
    value: function clear(gl) {
      if (this.config.clearColor) {
        var bg = this.config.backgroundColor;
        gl.clearColor(bg.r, bg.g, bg.b, bg.a);
      }
      if (this.config.clearDepth) {
        gl.clearDepth(this.config.backgroundDepth);
      }
      if (this.config.clearColor && this.config.clearDepth) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      } else if (this.config.clearColor) {
        gl.clear(gl.COLOR_BUFFER_BIT);
      } else if (this.config.clearDepth) {
        gl.clear(gl.DEPTH_BUFFER_BIT);
      }
      return this;
    }

    // Renders all objects in the scene.

  }, {
    key: 'render',
    value: function render(gl) {
      var _ref = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var camera = _ref.camera;
      var _ref$onBeforeRender = _ref.onBeforeRender;
      var onBeforeRender = _ref$onBeforeRender === undefined ? noop : _ref$onBeforeRender;
      var _ref$onAfterRender = _ref.onAfterRender;
      var onAfterRender = _ref$onAfterRender === undefined ? noop : _ref$onAfterRender;
      var _ref$context = _ref.context;
      var context = _ref$context === undefined ? {} : _ref$context;

      var opts = _objectWithoutProperties(_ref, ['camera', 'onBeforeRender', 'onAfterRender', 'context']);

      (0, _assert2.default)(camera instanceof _camera.Camera);

      this.clear(gl);

      // Go through each model and render it.
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.traverse({ viewMatrix: camera.view })[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var model = _step.value;

          if (model.display) {
            onBeforeRender(model, context);
            this.renderObject(gl, model);
            onAfterRender(model, context);
          }
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
    key: 'renderObject',
    value: function renderObject(gl, model, camera) {
      var context = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

      model.setProgramState();
      model.onBeforeRender(camera, context);

      var program = this.getProgram(model);

      // Setup lighting and scene effects like fog, etc.
      this.setupLighting(program);
      this.setupEffects(program);

      // Camera exposes uniforms that can be used directly in shaders
      if (camera) {
        program.setUniforms(camera.getUniforms());
      }

      // Now set view and normal matrices
      // const coordinateUniforms = model.getCoordinateUniforms(camera.view);
      // program.setUniforms(coordinateUniforms);

      // Draw
      model.render(gl, { viewMatrix: camera.view });

      model.onAfterRender(camera, context);
      model.unsetProgramState();
      return this;
    }

    // TODO - this is the new picking for deck.gl

  }, {
    key: 'pickModels',
    value: function pickModels(gl, _ref2) {
      var camera = _ref2.camera;
      var x = _ref2.x;
      var y = _ref2.y;

      var opts = _objectWithoutProperties(_ref2, ['camera', 'x', 'y']);

      var viewMatrix = camera.view;

      return (0, _pick.pickModels)(gl, _extends({ group: this, viewMatrix: viewMatrix, x: x, y: y }, opts));
    }

    /*
    pick(x, y, opt = {}) {
      const gl = this.gl;
       if (this.pickingFBO === undefined) {
        this.pickingFBO = new Framebuffer(gl, {
          width: gl.canvas.width,
          height: gl.canvas.height
        });
      }
       if (this.pickingProgram === undefined) {
        this.pickingProgram =
          opt.pickingProgram || makeProgramFromDefaultShaders(gl);
      }
       let pickingProgram = this.pickingProgram;
       pickingProgram.use();
      pickingProgram.setUniform('enablePicking', true);
      pickingProgram.setUniform('hasPickingColors', false);
       this.pickingFBO.bind();
       let hash = {};
       gl.enable(gl.SCISSOR_TEST);
      gl.scissor(x, gl.canvas.height - y, 1, 1);
       const oldClearColor = this.clearColor;
      const oldBackgroundColor = this.backgroundColor;
      this.clearColor = true;
      this.backgroundColor = {r: 0, g: 0, b: 0, a: 0};
       this.render({
        renderProgram: pickingProgram,
        onBeforeRender: function(elem, i) {
          i++;
          let r = i % 256;
          let g = ((i / 256) >> 0) % 256;
          let b = ((i / (256 * 256)) >> 0) % 256;
          hash[[r, g, b]] = elem;
          pickingProgram.setUniform('pickColor', [r / 255, g / 255, b / 255]);
        }
      });
       gl.disable(gl.SCISSOR_TEST);
       const pixel = new Uint8Array(4);
       gl.readPixels(
        x, gl.canvas.height - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel
      );
       gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      this.clearColor = oldClearColor;
      this.backgroundColor = oldBackgroundColor;
       let r = pixel[0];
      let g = pixel[1];
      let b = pixel[2];
       return hash[[r, g, b]];
    }
     pickCustom(x, y, opt = {}) {
      const gl = this.gl;
       if (this.pickingFBO === undefined) {
        this.pickingFBO = new Framebuffer(gl, {
          width: gl.canvas.width,
          height: gl.canvas.height
        });
      }
       if (this.pickingProgram === undefined) {
        this.pickingProgram =
          opt.pickingProgram || makeProgramFromDefaultShaders(gl);
      }
       let pickingProgram = this.pickingProgram;
       pickingProgram.use();
      pickingProgram.setUniform('enablePicking', true);
      pickingProgram.setUniform('hasPickingColors', true);
       this.pickingFBO.bind();
       gl.enable(gl.SCISSOR_TEST);
      gl.scissor(x, gl.canvas.height - y, 1, 1);
       const oldClearColor = this.clearColor;
      const oldBackgroundColor = this.backgroundColor;
      this.clearColor = true;
      this.backgroundColor = {r: 255, g: 0, b: 0, a: 255};
       this.render({
        renderProgram: pickingProgram
      });
       gl.disable(gl.SCISSOR_TEST);
       const pixel = new Uint8Array(4);
       gl.readPixels(
        x, gl.canvas.height - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel
      );
       gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      this.clearColor = oldClearColor;
      this.backgroundColor = oldBackgroundColor;
       let r = pixel[0];
      let g = pixel[1];
      let b = pixel[2];
      let a = pixel[3];
       return [r, g, b, a];
    }
    */

    // Setup the lighting system: ambient, directional, point lights.

  }, {
    key: 'setupLighting',
    value: function setupLighting(program) {
      // Setup Lighting
      var _config$lights = this.config.lights;
      var enable = _config$lights.enable;
      var ambient = _config$lights.ambient;
      var directional = _config$lights.directional;
      var points = _config$lights.points;

      // Set light uniforms. Ambient and directional lights.

      program.setUniform('enableLights', enable);

      if (!enable) {
        return;
      }

      if (ambient) {
        this.setupAmbientLighting(program, ambient);
      }

      if (directional) {
        this.setupDirectionalLighting(program, directional);
      }

      // Set point lights
      if (points) {
        this.setupPointLighting(program, points);
      }

      return this;
    }
  }, {
    key: 'setupAmbientLighting',
    value: function setupAmbientLighting(program, ambient) {
      program.setUniforms({
        'ambientColor': [ambient.r, ambient.g, ambient.b]
      });

      return this;
    }
  }, {
    key: 'setupDirectionalLighting',
    value: function setupDirectionalLighting(program, directional) {
      var color = directional.color;
      var direction = directional.direction;

      // Normalize lighting direction vector

      var dir = new _math.Vec3(direction.x, direction.y, direction.z).$unit().$scale(-1);

      program.setUniforms({
        'directionalColor': [color.r, color.g, color.b],
        'lightingDirection': [dir.x, dir.y, dir.z]
      });

      return this;
    }
  }, {
    key: 'setupPointLighting',
    value: function setupPointLighting(program, points) {
      points = points instanceof Array ? points : [points];
      var numberPoints = points.length;
      program.setUniform('numberPoints', numberPoints);

      var pointLocations = [];
      var pointColors = [];
      var enableSpecular = [];
      var pointSpecularColors = [];
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = points[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var point = _step2.value;
          var position = point.position;
          var color = point.color;
          var diffuse = point.diffuse;
          var specular = point.specular;

          var pointColor = color || diffuse;

          pointLocations.push(position.x, position.y, position.z);
          pointColors.push(pointColor.r, pointColor.g, pointColor.b);

          // Add specular color
          enableSpecular.push(Number(Boolean(specular)));
          if (specular) {
            pointSpecularColors.push(specular.r, specular.g, specular.b);
          } else {
            pointSpecularColors.push(0, 0, 0);
          }
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

      if (pointLocations.length) {
        program.setUniforms({
          'pointLocation': pointLocations,
          'pointColor': pointColors
        });
        program.setUniforms({
          'enableSpecular': enableSpecular,
          'pointSpecularColor': pointSpecularColors
        });
      }

      return this;
    }

    // Setup effects like fog, etc.

  }, {
    key: 'setupEffects',
    value: function setupEffects(program) {
      var fog = this.config.effects.fog;


      if (fog) {
        var _fog$color = fog.color;
        var color = _fog$color === undefined ? { r: 0.5, g: 0.5, b: 0.5 } : _fog$color;

        program.setUniforms({
          'hasFog': true,
          'fogNear': fog.near,
          'fogFar': fog.far,
          'fogColor': [color.r, color.g, color.b]
        });
      } else {
        program.setUniform('hasFog', false);
      }

      return this;
    }
  }]);

  return Scene;
}(_group2.default);

exports.default = Scene;


Scene.MAX_TEXTURES = config.MAX_TEXTURES;
Scene.MAX_POINT_LIGHTS = config.MAX_POINT_LIGHTS;
Scene.PICKING_RES = config.PICKING_RES;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2VuZWdyYXBoL3NjZW5lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBU1k7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHWixTQUFTLElBQVQsR0FBZ0IsRUFBaEI7O0FBRUEsSUFBTSxxQkFBcUI7QUFDekIsVUFBUTtBQUNOLFlBQVEsS0FBUjs7QUFFQSxhQUFTLEVBQUMsR0FBRyxHQUFILEVBQVEsR0FBRyxHQUFILEVBQVEsR0FBRyxHQUFILEVBQTFCOztBQUVBLGlCQUFhO0FBQ1gsaUJBQVcsRUFBQyxHQUFHLENBQUgsRUFBTSxHQUFHLENBQUgsRUFBTSxHQUFHLENBQUgsRUFBeEI7QUFDQSxhQUFPLEVBQUMsR0FBRyxDQUFILEVBQU0sR0FBRyxDQUFILEVBQU0sR0FBRyxDQUFILEVBQXBCO0tBRkY7OztBQUxNLEdBQVI7QUFZQSxXQUFTO0FBQ1AsU0FBSyxLQUFMOztBQURPLEdBQVQ7QUFJQSxjQUFZLElBQVo7QUFDQSxjQUFZLElBQVo7QUFDQSxtQkFBaUIsRUFBQyxHQUFHLENBQUgsRUFBTSxHQUFHLENBQUgsRUFBTSxHQUFHLENBQUgsRUFBTSxHQUFHLENBQUgsRUFBcEM7QUFDQSxtQkFBaUIsQ0FBakI7Q0FwQkk7O0FBdUJOLElBQU0sbUJBQW1CLCtCQUFuQjs7OztJQUdlOzs7QUFFbkIsV0FGbUIsS0FFbkIsQ0FBWSxFQUFaLEVBQWdCLElBQWhCLEVBQXNCOzBCQUZILE9BRUc7O0FBQ3BCLDBCQUFPLEVBQVAsRUFBVyxnQkFBWCxFQURvQjs7QUFHcEIsV0FBTyxrQkFBTSxrQkFBTixFQUEwQixJQUExQixDQUFQLENBSG9COzt1RUFGSCxrQkFPWCxPQUxjOztBQU9wQixVQUFLLEVBQUwsR0FBVSxFQUFWLENBUG9CO0FBUXBCLFVBQUssTUFBTCxHQUFjLElBQWQsQ0FSb0I7O0dBQXRCOztlQUZtQjs7K0JBYVIsS0FBSztBQUNkLFVBQU0sVUFBVSxNQUFNLElBQUksT0FBSixHQUFj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UDs7QUFZQSxhQUFPLElBQVAsQ0Fmb0I7Ozs7U0E3VEg7Ozs7OztBQWlWckIsTUFBTSxZQUFOLEdBQXFCLE9BQU8sWUFBUDtBQUNyQixNQUFNLGdCQUFOLEdBQXlCLE9BQU8sZ0JBQVA7QUFDekIsTUFBTSxXQUFOLEdBQW9CLE9BQU8sV0FBUCIsImZpbGUiOiJzY2VuZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFNjZW5lIE9iamVjdCBtYW5hZ2VtZW50IGFuZCByZW5kZXJpbmdcbi8qIGVzbGludC1kaXNhYmxlIG1heC1zdGF0ZW1lbnRzLCBuby10cnktY2F0Y2ggKi9cblxuaW1wb3J0IHtDYW1lcmF9IGZyb20gJy4uL2NhbWVyYSc7XG5pbXBvcnQgR3JvdXAgZnJvbSAnLi9ncm91cCc7XG5pbXBvcnQge3BpY2tNb2RlbHN9IGZyb20gJy4vcGljayc7XG5pbXBvcnQge1Byb2dyYW19IGZyb20gJy4uL3dlYmdsJztcbmltcG9ydCB7VmVjM30gZnJvbSAnLi4vbWF0aCc7XG5pbXBvcnQge21lcmdlfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgKiBhcyBjb25maWcgZnJvbSAnLi4vY29uZmlnJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbmNvbnN0IERFRkFVTFRfU0NFTkVfT1BUUyA9IHtcbiAgbGlnaHRzOiB7XG4gICAgZW5hYmxlOiBmYWxzZSxcbiAgICAvLyBhbWJpZW50IGxpZ2h0XG4gICAgYW1iaWVudDoge3I6IDAuMiwgZzogMC4yLCBiOiAwLjJ9LFxuICAgIC8vIGRpcmVjdGlvbmFsIGxpZ2h0XG4gICAgZGlyZWN0aW9uYWw6IHtcbiAgICAgIGRpcmVjdGlvbjoge3g6IDEsIHk6IDEsIHo6IDF9LFxuICAgICAgY29sb3I6IHtyOiAwLCBnOiAwLCBiOiAwfVxuICAgIH1cbiAgICAvLyBwb2ludCBsaWdodFxuICAgIC8vIHBvaW50czogW11cbiAgfSxcbiAgZWZmZWN0czoge1xuICAgIGZvZzogZmFsc2VcbiAgICAvLyB7IG5lYXIsIGZhciwgY29sb3IgfVxuICB9LFxuICBjbGVhckNvbG9yOiB0cnVlLFxuICBjbGVhckRlcHRoOiB0cnVlLFxuICBiYWNrZ3JvdW5kQ29sb3I6IHtyOiAwLCBnOiAwLCBiOiAwLCBhOiAxfSxcbiAgYmFja2dyb3VuZERlcHRoOiAxXG59O1xuXG5jb25zdCBJTlZBTElEX0FSR1VNRU5UID0gJ0x1bWFHTC5TY2VuZSBpbnZhbGlkIGFyZ3VtZW50JztcblxuLy8gU2NlbmUgY2xhc3NcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNjZW5lIGV4dGVuZHMgR3JvdXAge1xuXG4gIGNvbnN0cnVjdG9yKGdsLCBvcHRzKSB7XG4gICAgYXNzZXJ0KGdsLCBJTlZBTElEX0FSR1VNRU5UKTtcblxuICAgIG9wdHMgPSBtZXJnZShERUZBVUxUX1NDRU5FX09QVFMsIG9wdHMpO1xuXG4gICAgc3VwZXIob3B0cyk7XG5cbiAgICB0aGlzLmdsID0gZ2w7XG4gICAgdGhpcy5jb25maWcgPSBvcHRzO1xuICB9XG5cbiAgZ2V0UHJvZ3JhbShvYmopIHtcbiAgICBjb25zdCBwcm9ncmFtID0gb2JqID8gb2JqLnByb2dyYW0gOiB0aGlzLnByb2dyYW07XG4gICAgYXNzZXJ0KHByb2dyYW0gaW5zdGFuY2VvZiBQcm9ncmFtLCAnU2NlbmUgZmFpbGVkIHRvIGZpbmQgdmFsaWQgcHJvZ3JhbScpO1xuICAgIHByb2dyYW0udXNlKCk7XG4gICAgcmV0dXJuIHByb2dyYW07XG4gIH1cblxuICBkZWZpbmVCdWZmZXJzKG9iaikge1xuICAgIGNvbnN0IHByb2dyYW0gPSB0aGlzLmdldFByb2dyYW0ob2JqKTtcbiAgICBjb25zdCBwcmV2RHluYW1pYyA9IG9iai5keW5hbWljO1xuICAgIG9iai5keW5hbWljID0gdHJ1ZTtcbiAgICBvYmouc2V0UHJvZ3JhbVN0YXRlKHByb2dyYW0pO1xuICAgIG9iai5keW5hbWljID0gcHJldkR5bmFtaWM7XG4gICAgb2JqLnVuc2V0UHJvZ3JhbVN0YXRlKHByb2dyYW0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgY2xlYXIoZ2wpIHtcbiAgICBpZiAodGhpcy5jb25maWcuY2xlYXJDb2xvcikge1xuICAgICAgY29uc3QgYmcgPSB0aGlzLmNvbmZpZy5iYWNrZ3JvdW5kQ29sb3I7XG4gICAgICBnbC5jbGVhckNvbG9yKGJnLnIsIGJnLmcsIGJnLmIsIGJnLmEpO1xuICAgIH1cbiAgICBpZiAodGhpcy5jb25maWcuY2xlYXJEZXB0aCkge1xuICAgICAgZ2wuY2xlYXJEZXB0aCh0aGlzLmNvbmZpZy5iYWNrZ3JvdW5kRGVwdGgpO1xuICAgIH1cbiAgICBpZiAodGhpcy5jb25maWcuY2xlYXJDb2xvciAmJiB0aGlzLmNvbmZpZy5jbGVhckRlcHRoKSB7XG4gICAgICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUIHwgZ2wuREVQVEhfQlVGRkVSX0JJVCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmNvbmZpZy5jbGVhckNvbG9yKSB7XG4gICAgICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuY29uZmlnLmNsZWFyRGVwdGgpIHtcbiAgICAgIGdsLmNsZWFyKGdsLkRFUFRIX0JVRkZFUl9CSVQpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIFJlbmRlcnMgYWxsIG9iamVjdHMgaW4gdGhlIHNjZW5lLlxuICByZW5kZXIoZ2wsIHtcbiAgICBjYW1lcmEsXG4gICAgb25CZWZvcmVSZW5kZXIgPSBub29wLFxuICAgIG9uQWZ0ZXJSZW5kZXIgPSBub29wLFxuICAgIGNvbnRleHQgPSB7fSxcbiAgICAuLi5vcHRzXG4gIH0gPSB7fSkge1xuICAgIGFzc2VydChjYW1lcmEgaW5zdGFuY2VvZiBDYW1lcmEpO1xuXG4gICAgdGhpcy5jbGVhcihnbCk7XG5cbiAgICAvLyBHbyB0aHJvdWdoIGVhY2ggbW9kZWwgYW5kIHJlbmRlciBpdC5cbiAgICBmb3IgKGNvbnN0IG1vZGVsIG9mIHRoaXMudHJhdmVyc2Uoe3ZpZXdNYXRyaXg6IGNhbWVyYS52aWV3fSkpIHtcbiAgICAgIGlmIChtb2RlbC5kaXNwbGF5KSB7XG4gICAgICAgIG9uQmVmb3JlUmVuZGVyKG1vZGVsLCBjb250ZXh0KTtcbiAgICAgICAgdGhpcy5yZW5kZXJPYmplY3QoZ2wsIG1vZGVsKTtcbiAgICAgICAgb25BZnRlclJlbmRlcihtb2RlbCwgY29udGV4dCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcmVuZGVyT2JqZWN0KGdsLCBtb2RlbCwgY2FtZXJhLCBjb250ZXh0ID0ge30pIHtcbiAgICBtb2RlbC5zZXRQcm9ncmFtU3RhdGUoKTtcbiAgICBtb2RlbC5vbkJlZm9yZVJlbmRlcihjYW1lcmEsIGNvbnRleHQpO1xuXG4gICAgY29uc3QgcHJvZ3JhbSA9IHRoaXMuZ2V0UHJvZ3JhbShtb2RlbCk7XG5cbiAgICAvLyBTZXR1cCBsaWdodGluZyBhbmQgc2NlbmUgZWZmZWN0cyBsaWtlIGZvZywgZXRjLlxuICAgIHRoaXMuc2V0dXBMaWdodGluZyhwcm9ncmFtKTtcbiAgICB0aGlzLnNldHVwRWZmZWN0cyhwcm9ncmFtKTtcblxuICAgIC8vIENhbWVyYSBleHBvc2VzIHVuaWZvcm1zIHRoYXQgY2FuIGJlIHVzZWQgZGlyZWN0bHkgaW4gc2hhZGVyc1xuICAgIGlmIChjYW1lcmEpIHtcbiAgICAgIHByb2dyYW0uc2V0VW5pZm9ybXMoY2FtZXJhLmdldFVuaWZvcm1zKCkpO1xuICAgIH1cblxuICAgIC8vIE5vdyBzZXQgdmlldyBhbmQgbm9ybWFsIG1hdHJpY2VzXG4gICAgLy8gY29uc3QgY29vcmRpbmF0ZVVuaWZvcm1zID0gbW9kZWwuZ2V0Q29vcmRpbmF0ZVVuaWZvcm1zKGNhbWVyYS52aWV3KTtcbiAgICAvLyBwcm9ncmFtLnNldFVuaWZvcm1zKGNvb3JkaW5hdGVVbmlmb3Jtcyk7XG5cbiAgICAvLyBEcmF3XG4gICAgbW9kZWwucmVuZGVyKGdsLCB7dmlld01hdHJpeDogY2FtZXJhLnZpZXd9KTtcblxuICAgIG1vZGVsLm9uQWZ0ZXJSZW5kZXIoY2FtZXJhLCBjb250ZXh0KTtcbiAgICBtb2RlbC51bnNldFByb2dyYW1TdGF0ZSgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gVE9ETyAtIHRoaXMgaXMgdGhlIG5ldyBwaWNraW5nIGZvciBkZWNrLmdsXG4gIHBpY2tNb2RlbHMoZ2wsIHtjYW1lcmEsIHgsIHksIC4uLm9wdHN9KSB7XG4gICAgY29uc3Qge3ZpZXc6IHZpZXdNYXRyaXh9ID0gY2FtZXJhO1xuICAgIHJldHVybiBwaWNrTW9kZWxzKGdsLCB7Z3JvdXA6IHRoaXMsIHZpZXdNYXRyaXgsIHgsIHksIC4uLm9wdHN9KTtcbiAgfVxuXG4gIC8qXG4gIHBpY2soeCwgeSwgb3B0ID0ge30pIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuZ2w7XG5cbiAgICBpZiAodGhpcy5waWNraW5nRkJPID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMucGlja2luZ0ZCTyA9IG5ldyBGcmFtZWJ1ZmZlcihnbCwge1xuICAgICAgICB3aWR0aDogZ2wuY2FudmFzLndpZHRoLFxuICAgICAgICBoZWlnaHQ6IGdsLmNhbnZhcy5oZWlnaHRcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnBpY2tpbmdQcm9ncmFtID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMucGlja2luZ1Byb2dyYW0gPVxuICAgICAgICBvcHQucGlja2luZ1Byb2dyYW0gfHwgbWFrZVByb2dyYW1Gcm9tRGVmYXVsdFNoYWRlcnMoZ2wpO1xuICAgIH1cblxuICAgIGxldCBwaWNraW5nUHJvZ3JhbSA9IHRoaXMucGlja2luZ1Byb2dyYW07XG5cbiAgICBwaWNraW5nUHJvZ3JhbS51c2UoKTtcbiAgICBwaWNraW5nUHJvZ3JhbS5zZXRVbmlmb3JtKCdlbmFibGVQaWNraW5nJywgdHJ1ZSk7XG4gICAgcGlja2luZ1Byb2dyYW0uc2V0VW5pZm9ybSgnaGFzUGlja2luZ0NvbG9ycycsIGZhbHNlKTtcblxuICAgIHRoaXMucGlja2luZ0ZCTy5iaW5kKCk7XG5cbiAgICBsZXQgaGFzaCA9IHt9O1xuXG4gICAgZ2wuZW5hYmxlKGdsLlNDSVNTT1JfVEVTVCk7XG4gICAgZ2wuc2Npc3Nvcih4LCBnbC5jYW52YXMuaGVpZ2h0IC0geSwgMSwgMSk7XG5cbiAgICBjb25zdCBvbGRDbGVhckNvbG9yID0gdGhpcy5jbGVhckNvbG9yO1xuICAgIGNvbnN0IG9sZEJhY2tncm91bmRDb2xvciA9IHRoaXMuYmFja2dyb3VuZENvbG9yO1xuICAgIHRoaXMuY2xlYXJDb2xvciA9IHRydWU7XG4gICAgdGhpcy5iYWNrZ3JvdW5kQ29sb3IgPSB7cjogMCwgZzogMCwgYjogMCwgYTogMH07XG5cbiAgICB0aGlzLnJlbmRlcih7XG4gICAgICByZW5kZXJQcm9ncmFtOiBwaWNraW5nUHJvZ3JhbSxcbiAgICAgIG9uQmVmb3JlUmVuZGVyOiBmdW5jdGlvbihlbGVtLCBpKSB7XG4gICAgICAgIGkrKztcbiAgICAgICAgbGV0IHIgPSBpICUgMjU2O1xuICAgICAgICBsZXQgZyA9ICgoaSAvIDI1NikgPj4gMCkgJSAyNTY7XG4gICAgICAgIGxldCBiID0gKChpIC8gKDI1NiAqIDI1NikpID4+IDApICUgMjU2O1xuICAgICAgICBoYXNoW1tyLCBnLCBiXV0gPSBlbGVtO1xuICAgICAgICBwaWNraW5nUHJvZ3JhbS5zZXRVbmlmb3JtKCdwaWNrQ29sb3InLCBbciAvIDI1NSwgZyAvIDI1NSwgYiAvIDI1NV0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgZ2wuZGlzYWJsZShnbC5TQ0lTU09SX1RFU1QpO1xuXG4gICAgY29uc3QgcGl4ZWwgPSBuZXcgVWludDhBcnJheSg0KTtcblxuICAgIGdsLnJlYWRQaXhlbHMoXG4gICAgICB4LCBnbC5jYW52YXMuaGVpZ2h0IC0geSwgMSwgMSwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgcGl4ZWxcbiAgICApO1xuXG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBudWxsKTtcbiAgICB0aGlzLmNsZWFyQ29sb3IgPSBvbGRDbGVhckNvbG9yO1xuICAgIHRoaXMuYmFja2dyb3VuZENvbG9yID0gb2xkQmFja2dyb3VuZENvbG9yO1xuXG4gICAgbGV0IHIgPSBwaXhlbFswXTtcbiAgICBsZXQgZyA9IHBpeGVsWzFdO1xuICAgIGxldCBiID0gcGl4ZWxbMl07XG5cbiAgICByZXR1cm4gaGFzaFtbciwgZywgYl1dO1xuICB9XG5cbiAgcGlja0N1c3RvbSh4LCB5LCBvcHQgPSB7fSkge1xuICAgIGNvbnN0IGdsID0gdGhpcy5nbDtcblxuICAgIGlmICh0aGlzLnBpY2tpbmdGQk8gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5waWNraW5nRkJPID0gbmV3IEZyYW1lYnVmZmVyKGdsLCB7XG4gICAgICAgIHdpZHRoOiBnbC5jYW52YXMud2lkdGgsXG4gICAgICAgIGhlaWdodDogZ2wuY2FudmFzLmhlaWdodFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMucGlja2luZ1Byb2dyYW0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5waWNraW5nUHJvZ3JhbSA9XG4gICAgICAgIG9wdC5waWNraW5nUHJvZ3JhbSB8fCBtYWtlUHJvZ3JhbUZyb21EZWZhdWx0U2hhZGVycyhnbCk7XG4gICAgfVxuXG4gICAgbGV0IHBpY2tpbmdQcm9ncmFtID0gdGhpcy5waWNraW5nUHJvZ3JhbTtcblxuICAgIHBpY2tpbmdQcm9ncmFtLnVzZSgpO1xuICAgIHBpY2tpbmdQcm9ncmFtLnNldFVuaWZvcm0oJ2VuYWJsZVBpY2tpbmcnLCB0cnVlKTtcbiAgICBwaWNraW5nUHJvZ3JhbS5zZXRVbmlmb3JtKCdoYXNQaWNraW5nQ29sb3JzJywgdHJ1ZSk7XG5cbiAgICB0aGlzLnBpY2tpbmdGQk8uYmluZCgpO1xuXG4gICAgZ2wuZW5hYmxlKGdsLlNDSVNTT1JfVEVTVCk7XG4gICAgZ2wuc2Npc3Nvcih4LCBnbC5jYW52YXMuaGVpZ2h0IC0geSwgMSwgMSk7XG5cbiAgICBjb25zdCBvbGRDbGVhckNvbG9yID0gdGhpcy5jbGVhckNvbG9yO1xuICAgIGNvbnN0IG9sZEJhY2tncm91bmRDb2xvciA9IHRoaXMuYmFja2dyb3VuZENvbG9yO1xuICAgIHRoaXMuY2xlYXJDb2xvciA9IHRydWU7XG4gICAgdGhpcy5iYWNrZ3JvdW5kQ29sb3IgPSB7cjogMjU1LCBnOiAwLCBiOiAwLCBhOiAyNTV9O1xuXG4gICAgdGhpcy5yZW5kZXIoe1xuICAgICAgcmVuZGVyUHJvZ3JhbTogcGlja2luZ1Byb2dyYW1cbiAgICB9KTtcblxuICAgIGdsLmRpc2FibGUoZ2wuU0NJU1NPUl9URVNUKTtcblxuICAgIGNvbnN0IHBpeGVsID0gbmV3IFVpbnQ4QXJyYXkoNCk7XG5cbiAgICBnbC5yZWFkUGl4ZWxzKFxuICAgICAgeCwgZ2wuY2FudmFzLmhlaWdodCAtIHksIDEsIDEsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIHBpeGVsXG4gICAgKTtcblxuICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgbnVsbCk7XG4gICAgdGhpcy5jbGVhckNvbG9yID0gb2xkQ2xlYXJDb2xvcjtcbiAgICB0aGlzLmJhY2tncm91bmRDb2xvciA9IG9sZEJhY2tncm91bmRDb2xvcjtcblxuICAgIGxldCByID0gcGl4ZWxbMF07XG4gICAgbGV0IGcgPSBwaXhlbFsxXTtcbiAgICBsZXQgYiA9IHBpeGVsWzJdO1xuICAgIGxldCBhID0gcGl4ZWxbM107XG5cbiAgICByZXR1cm4gW3IsIGcsIGIsIGFdO1xuICB9XG4gICovXG5cbiAgLy8gU2V0dXAgdGhlIGxpZ2h0aW5nIHN5c3RlbTogYW1iaWVudCwgZGlyZWN0aW9uYWwsIHBvaW50IGxpZ2h0cy5cbiAgc2V0dXBMaWdodGluZyhwcm9ncmFtKSB7XG4gICAgLy8gU2V0dXAgTGlnaHRpbmdcbiAgICBsZXQge2VuYWJsZSwgYW1iaWVudCwgZGlyZWN0aW9uYWwsIHBvaW50c30gPSB0aGlzLmNvbmZpZy5saWdodHM7XG5cbiAgICAvLyBTZXQgbGlnaHQgdW5pZm9ybXMuIEFtYmllbnQgYW5kIGRpcmVjdGlvbmFsIGxpZ2h0cy5cbiAgICBwcm9ncmFtLnNldFVuaWZvcm0oJ2VuYWJsZUxpZ2h0cycsIGVuYWJsZSk7XG5cbiAgICBpZiAoIWVuYWJsZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChhbWJpZW50KSB7XG4gICAgICB0aGlzLnNldHVwQW1iaWVudExpZ2h0aW5nKHByb2dyYW0sIGFtYmllbnQpO1xuICAgIH1cblxuICAgIGlmIChkaXJlY3Rpb25hbCkge1xuICAgICAgdGhpcy5zZXR1cERpcmVjdGlvbmFsTGlnaHRpbmcocHJvZ3JhbSwgZGlyZWN0aW9uYWwpO1xuICAgIH1cblxuICAgIC8vIFNldCBwb2ludCBsaWdodHNcbiAgICBpZiAocG9pbnRzKSB7XG4gICAgICB0aGlzLnNldHVwUG9pbnRMaWdodGluZyhwcm9ncmFtLCBwb2ludHMpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0dXBBbWJpZW50TGlnaHRpbmcocHJvZ3JhbSwgYW1iaWVudCkge1xuICAgIHByb2dyYW0uc2V0VW5pZm9ybXMoe1xuICAgICAgJ2FtYmllbnRDb2xvcic6IFthbWJpZW50LnIsIGFtYmllbnQuZywgYW1iaWVudC5iXVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXR1cERpcmVjdGlvbmFsTGlnaHRpbmcocHJvZ3JhbSwgZGlyZWN0aW9uYWwpIHtcbiAgICBsZXQge2NvbG9yLCBkaXJlY3Rpb259ID0gZGlyZWN0aW9uYWw7XG5cbiAgICAvLyBOb3JtYWxpemUgbGlnaHRpbmcgZGlyZWN0aW9uIHZlY3RvclxuICAgIGNvbnN0IGRpciA9IG5ldyBWZWMzKGRpcmVjdGlvbi54LCBkaXJlY3Rpb24ueSwgZGlyZWN0aW9uLnopXG4gICAgICAuJHVuaXQoKVxuICAgICAgLiRzY2FsZSgtMSk7XG5cbiAgICBwcm9ncmFtLnNldFVuaWZvcm1zKHtcbiAgICAgICdkaXJlY3Rpb25hbENvbG9yJzogW2NvbG9yLnIsIGNvbG9yLmcsIGNvbG9yLmJdLFxuICAgICAgJ2xpZ2h0aW5nRGlyZWN0aW9uJzogW2Rpci54LCBkaXIueSwgZGlyLnpdXG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldHVwUG9pbnRMaWdodGluZyhwcm9ncmFtLCBwb2ludHMpIHtcbiAgICBwb2ludHMgPSBwb2ludHMgaW5zdGFuY2VvZiBBcnJheSA/IHBvaW50cyA6IFtwb2ludHNdO1xuICAgIGNvbnN0IG51bWJlclBvaW50cyA9IHBvaW50cy5sZW5ndGg7XG4gICAgcHJvZ3JhbS5zZXRVbmlmb3JtKCdudW1iZXJQb2ludHMnLCBudW1iZXJQb2ludHMpO1xuXG4gICAgY29uc3QgcG9pbnRMb2NhdGlvbnMgPSBbXTtcbiAgICBjb25zdCBwb2ludENvbG9ycyA9IFtdO1xuICAgIGNvbnN0IGVuYWJsZVNwZWN1bGFyID0gW107XG4gICAgY29uc3QgcG9pbnRTcGVjdWxhckNvbG9ycyA9IFtdO1xuICAgIGZvciAoY29uc3QgcG9pbnQgb2YgcG9pbnRzKSB7XG4gICAgICBjb25zdCB7cG9zaXRpb24sIGNvbG9yLCBkaWZmdXNlLCBzcGVjdWxhcn0gPSBwb2ludDtcbiAgICAgIGNvbnN0IHBvaW50Q29sb3IgPSBjb2xvciB8fCBkaWZmdXNlO1xuXG4gICAgICBwb2ludExvY2F0aW9ucy5wdXNoKHBvc2l0aW9uLngsIHBvc2l0aW9uLnksIHBvc2l0aW9uLnopO1xuICAgICAgcG9pbnRDb2xvcnMucHVzaChwb2ludENvbG9yLnIsIHBvaW50Q29sb3IuZywgcG9pbnRDb2xvci5iKTtcblxuICAgICAgLy8gQWRkIHNwZWN1bGFyIGNvbG9yXG4gICAgICBlbmFibGVTcGVjdWxhci5wdXNoKE51bWJlcihCb29sZWFuKHNwZWN1bGFyKSkpO1xuICAgICAgaWYgKHNwZWN1bGFyKSB7XG4gICAgICAgIHBvaW50U3BlY3VsYXJDb2xvcnMucHVzaChzcGVjdWxhci5yLCBzcGVjdWxhci5nLCBzcGVjdWxhci5iKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBvaW50U3BlY3VsYXJDb2xvcnMucHVzaCgwLCAwLCAwKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9pbnRMb2NhdGlvbnMubGVuZ3RoKSB7XG4gICAgICBwcm9ncmFtLnNldFVuaWZvcm1zKHtcbiAgICAgICAgJ3BvaW50TG9jYXRpb24nOiBwb2ludExvY2F0aW9ucyxcbiAgICAgICAgJ3BvaW50Q29sb3InOiBwb2ludENvbG9yc1xuICAgICAgfSk7XG4gICAgICBwcm9ncmFtLnNldFVuaWZvcm1zKHtcbiAgICAgICAgJ2VuYWJsZVNwZWN1bGFyJzogZW5hYmxlU3BlY3VsYXIsXG4gICAgICAgICdwb2ludFNwZWN1bGFyQ29sb3InOiBwb2ludFNwZWN1bGFyQ29sb3JzXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIFNldHVwIGVmZmVjdHMgbGlrZSBmb2csIGV0Yy5cbiAgc2V0dXBFZmZlY3RzKHByb2dyYW0pIHtcbiAgICBjb25zdCB7Zm9nfSA9IHRoaXMuY29uZmlnLmVmZmVjdHM7XG5cbiAgICBpZiAoZm9nKSB7XG4gICAgICBjb25zdCB7Y29sb3IgPSB7cjogMC41LCBnOiAwLjUsIGI6IDAuNX19ID0gZm9nO1xuICAgICAgcHJvZ3JhbS5zZXRVbmlmb3Jtcyh7XG4gICAgICAgICdoYXNGb2cnOiB0cnVlLFxuICAgICAgICAnZm9nTmVhcic6IGZvZy5uZWFyLFxuICAgICAgICAnZm9nRmFyJzogZm9nLmZhcixcbiAgICAgICAgJ2ZvZ0NvbG9yJzogW2NvbG9yLnIsIGNvbG9yLmcsIGNvbG9yLmJdXG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJvZ3JhbS5zZXRVbmlmb3JtKCdoYXNGb2cnLCBmYWxzZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxufVxuXG5TY2VuZS5NQVhfVEVYVFVSRVMgPSBjb25maWcuTUFYX1RFWFRVUkVTO1xuU2NlbmUuTUFYX1BPSU5UX0xJR0hUUyA9IGNvbmZpZy5NQVhfUE9JTlRfTElHSFRTO1xuU2NlbmUuUElDS0lOR19SRVMgPSBjb25maWcuUElDS0lOR19SRVM7XG4iXX0=