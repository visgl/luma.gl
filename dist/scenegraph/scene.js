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
            this.renderObject(gl, { model: model, camera: camera, context: context });
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
    value: function renderObject(gl, _ref2) {
      var model = _ref2.model;
      var camera = _ref2.camera;
      var _ref2$context = _ref2.context;
      var context = _ref2$context === undefined ? {} : _ref2$context;

      (0, _assert2.default)(camera instanceof _camera.Camera);

      model.onBeforeRender(camera, context);

      var program = this.getProgram(model);

      // Setup lighting and scene effects like fog, etc.
      this.setupLighting(program);
      this.setupEffects(program);

      // Draw
      model.render(gl, { camera: camera, viewMatrix: camera.view });

      model.onAfterRender(camera, context);
      model.unsetProgramState();
      return this;
    }

    // TODO - this is the new picking for deck.gl

  }, {
    key: 'pickModels',
    value: function pickModels(gl, _ref3) {
      var camera = _ref3.camera;
      var x = _ref3.x;
      var y = _ref3.y;

      var opts = _objectWithoutProperties(_ref3, ['camera', 'x', 'y']);

      var viewMatrix = camera.view;

      return (0, _pick.pickModels)(gl, _extends({
        group: this,
        camera: camera,
        viewMatrix: viewMatrix,
        x: x, y: y
      }, opts));
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
        return this;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2VuZWdyYXBoL3NjZW5lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBU1k7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHWixTQUFTLElBQVQsR0FBZ0IsRUFBaEI7O0FBRUEsSUFBTSxxQkFBcUI7QUFDekIsVUFBUTtBQUNOLFlBQVEsS0FBUjs7QUFFQSxhQUFTLEVBQUMsR0FBRyxHQUFILEVBQVEsR0FBRyxHQUFILEVBQVEsR0FBRyxHQUFILEVBQTFCOztBQUVBLGlCQUFhO0FBQ1gsaUJBQVcsRUFBQyxHQUFHLENBQUgsRUFBTSxHQUFHLENBQUgsRUFBTSxHQUFHLENBQUgsRUFBeEI7QUFDQSxhQUFPLEVBQUMsR0FBRyxDQUFILEVBQU0sR0FBRyxDQUFILEVBQU0sR0FBRyxDQUFILEVBQXBCO0tBRkY7OztBQUxNLEdBQVI7QUFZQSxXQUFTO0FBQ1AsU0FBSyxLQUFMOztBQURPLEdBQVQ7QUFJQSxjQUFZLElBQVo7QUFDQSxjQUFZLElBQVo7QUFDQSxtQkFBaUIsRUFBQyxHQUFHLENBQUgsRUFBTSxHQUFHLENBQUgsRUFBTSxHQUFHLENBQUgsRUFBTSxHQUFHLENBQUgsRUFBcEM7QUFDQSxtQkFBaUIsQ0FBakI7Q0FwQkk7O0FBdUJOLElBQU0sbUJBQW1CLCtCQUFuQjs7OztJQUdlOzs7QUFFbkIsV0FGbUIsS0FFbkIsQ0FBWSxFQUFaLEVBQWdCLElBQWhCLEVBQXNCOzBCQUZILE9BRUc7O0FBQ3BCLDBCQUFPLEVBQVAsRUFBVyxnQkFBWCxFQURvQjs7QUFHcEIsV0FBTyxrQkFBTSxrQkFBTixFQUEwQixJQUExQixDQUFQLENBSG9COzt1RUFGSCxrQkFPWCxPQUxjOztBQU9wQixVQUFLLEVBQUwsR0FBVSxFQUFWLENBUG9CO0FBUXBCLFVBQUssTUFBTCxHQUFjLElBQWQsQ0FSb0I7O0dBQXRCOztlQUZtQjs7K0JBYVIsS0FBSztBQUNkLFVBQU0sVUFBVSxNQUFNLElBQUksT0FBSixHQUFj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T0FSUDs7QUFZQSxhQUFPLElBQVAsQ0Fmb0I7Ozs7U0EzVEg7Ozs7OztBQStVckIsTUFBTSxZQUFOLEdBQXFCLE9BQU8sWUFBUDtBQUNyQixNQUFNLGdCQUFOLEdBQXlCLE9BQU8sZ0JBQVA7QUFDekIsTUFBTSxXQUFOLEdBQW9CLE9BQU8sV0FBUCIsImZpbGUiOiJzY2VuZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFNjZW5lIE9iamVjdCBtYW5hZ2VtZW50IGFuZCByZW5kZXJpbmdcbi8qIGVzbGludC1kaXNhYmxlIG1heC1zdGF0ZW1lbnRzLCBuby10cnktY2F0Y2ggKi9cblxuaW1wb3J0IHtDYW1lcmF9IGZyb20gJy4uL2NhbWVyYSc7XG5pbXBvcnQgR3JvdXAgZnJvbSAnLi9ncm91cCc7XG5pbXBvcnQge3BpY2tNb2RlbHN9IGZyb20gJy4vcGljayc7XG5pbXBvcnQge1Byb2dyYW19IGZyb20gJy4uL3dlYmdsJztcbmltcG9ydCB7VmVjM30gZnJvbSAnLi4vbWF0aCc7XG5pbXBvcnQge21lcmdlfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgKiBhcyBjb25maWcgZnJvbSAnLi4vY29uZmlnJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbmNvbnN0IERFRkFVTFRfU0NFTkVfT1BUUyA9IHtcbiAgbGlnaHRzOiB7XG4gICAgZW5hYmxlOiBmYWxzZSxcbiAgICAvLyBhbWJpZW50IGxpZ2h0XG4gICAgYW1iaWVudDoge3I6IDAuMiwgZzogMC4yLCBiOiAwLjJ9LFxuICAgIC8vIGRpcmVjdGlvbmFsIGxpZ2h0XG4gICAgZGlyZWN0aW9uYWw6IHtcbiAgICAgIGRpcmVjdGlvbjoge3g6IDEsIHk6IDEsIHo6IDF9LFxuICAgICAgY29sb3I6IHtyOiAwLCBnOiAwLCBiOiAwfVxuICAgIH1cbiAgICAvLyBwb2ludCBsaWdodFxuICAgIC8vIHBvaW50czogW11cbiAgfSxcbiAgZWZmZWN0czoge1xuICAgIGZvZzogZmFsc2VcbiAgICAvLyB7IG5lYXIsIGZhciwgY29sb3IgfVxuICB9LFxuICBjbGVhckNvbG9yOiB0cnVlLFxuICBjbGVhckRlcHRoOiB0cnVlLFxuICBiYWNrZ3JvdW5kQ29sb3I6IHtyOiAwLCBnOiAwLCBiOiAwLCBhOiAxfSxcbiAgYmFja2dyb3VuZERlcHRoOiAxXG59O1xuXG5jb25zdCBJTlZBTElEX0FSR1VNRU5UID0gJ0x1bWFHTC5TY2VuZSBpbnZhbGlkIGFyZ3VtZW50JztcblxuLy8gU2NlbmUgY2xhc3NcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNjZW5lIGV4dGVuZHMgR3JvdXAge1xuXG4gIGNvbnN0cnVjdG9yKGdsLCBvcHRzKSB7XG4gICAgYXNzZXJ0KGdsLCBJTlZBTElEX0FSR1VNRU5UKTtcblxuICAgIG9wdHMgPSBtZXJnZShERUZBVUxUX1NDRU5FX09QVFMsIG9wdHMpO1xuXG4gICAgc3VwZXIob3B0cyk7XG5cbiAgICB0aGlzLmdsID0gZ2w7XG4gICAgdGhpcy5jb25maWcgPSBvcHRzO1xuICB9XG5cbiAgZ2V0UHJvZ3JhbShvYmopIHtcbiAgICBjb25zdCBwcm9ncmFtID0gb2JqID8gb2JqLnByb2dyYW0gOiB0aGlzLnByb2dyYW07XG4gICAgYXNzZXJ0KHByb2dyYW0gaW5zdGFuY2VvZiBQcm9ncmFtLCAnU2NlbmUgZmFpbGVkIHRvIGZpbmQgdmFsaWQgcHJvZ3JhbScpO1xuICAgIHByb2dyYW0udXNlKCk7XG4gICAgcmV0dXJuIHByb2dyYW07XG4gIH1cblxuICBkZWZpbmVCdWZmZXJzKG9iaikge1xuICAgIGNvbnN0IHByb2dyYW0gPSB0aGlzLmdldFByb2dyYW0ob2JqKTtcbiAgICBjb25zdCBwcmV2RHluYW1pYyA9IG9iai5keW5hbWljO1xuICAgIG9iai5keW5hbWljID0gdHJ1ZTtcbiAgICBvYmouc2V0UHJvZ3JhbVN0YXRlKHByb2dyYW0pO1xuICAgIG9iai5keW5hbWljID0gcHJldkR5bmFtaWM7XG4gICAgb2JqLnVuc2V0UHJvZ3JhbVN0YXRlKHByb2dyYW0pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgY2xlYXIoZ2wpIHtcbiAgICBpZiAodGhpcy5jb25maWcuY2xlYXJDb2xvcikge1xuICAgICAgY29uc3QgYmcgPSB0aGlzLmNvbmZpZy5iYWNrZ3JvdW5kQ29sb3I7XG4gICAgICBnbC5jbGVhckNvbG9yKGJnLnIsIGJnLmcsIGJnLmIsIGJnLmEpO1xuICAgIH1cbiAgICBpZiAodGhpcy5jb25maWcuY2xlYXJEZXB0aCkge1xuICAgICAgZ2wuY2xlYXJEZXB0aCh0aGlzLmNvbmZpZy5iYWNrZ3JvdW5kRGVwdGgpO1xuICAgIH1cbiAgICBpZiAodGhpcy5jb25maWcuY2xlYXJDb2xvciAmJiB0aGlzLmNvbmZpZy5jbGVhckRlcHRoKSB7XG4gICAgICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUIHwgZ2wuREVQVEhfQlVGRkVSX0JJVCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmNvbmZpZy5jbGVhckNvbG9yKSB7XG4gICAgICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuY29uZmlnLmNsZWFyRGVwdGgpIHtcbiAgICAgIGdsLmNsZWFyKGdsLkRFUFRIX0JVRkZFUl9CSVQpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIFJlbmRlcnMgYWxsIG9iamVjdHMgaW4gdGhlIHNjZW5lLlxuICByZW5kZXIoZ2wsIHtcbiAgICBjYW1lcmEsXG4gICAgb25CZWZvcmVSZW5kZXIgPSBub29wLFxuICAgIG9uQWZ0ZXJSZW5kZXIgPSBub29wLFxuICAgIGNvbnRleHQgPSB7fSxcbiAgICAuLi5vcHRzXG4gIH0gPSB7fSkge1xuICAgIGFzc2VydChjYW1lcmEgaW5zdGFuY2VvZiBDYW1lcmEpO1xuXG4gICAgdGhpcy5jbGVhcihnbCk7XG5cbiAgICAvLyBHbyB0aHJvdWdoIGVhY2ggbW9kZWwgYW5kIHJlbmRlciBpdC5cbiAgICBmb3IgKGNvbnN0IG1vZGVsIG9mIHRoaXMudHJhdmVyc2Uoe3ZpZXdNYXRyaXg6IGNhbWVyYS52aWV3fSkpIHtcbiAgICAgIGlmIChtb2RlbC5kaXNwbGF5KSB7XG4gICAgICAgIG9uQmVmb3JlUmVuZGVyKG1vZGVsLCBjb250ZXh0KTtcbiAgICAgICAgdGhpcy5yZW5kZXJPYmplY3QoZ2wsIHttb2RlbCwgY2FtZXJhLCBjb250ZXh0fSk7XG4gICAgICAgIG9uQWZ0ZXJSZW5kZXIobW9kZWwsIGNvbnRleHQpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHJlbmRlck9iamVjdChnbCwge21vZGVsLCBjYW1lcmEsIGNvbnRleHQgPSB7fX0pIHtcbiAgICBhc3NlcnQoY2FtZXJhIGluc3RhbmNlb2YgQ2FtZXJhKTtcblxuICAgIG1vZGVsLm9uQmVmb3JlUmVuZGVyKGNhbWVyYSwgY29udGV4dCk7XG5cbiAgICBjb25zdCBwcm9ncmFtID0gdGhpcy5nZXRQcm9ncmFtKG1vZGVsKTtcblxuICAgIC8vIFNldHVwIGxpZ2h0aW5nIGFuZCBzY2VuZSBlZmZlY3RzIGxpa2UgZm9nLCBldGMuXG4gICAgdGhpcy5zZXR1cExpZ2h0aW5nKHByb2dyYW0pO1xuICAgIHRoaXMuc2V0dXBFZmZlY3RzKHByb2dyYW0pO1xuXG4gICAgLy8gRHJhd1xuICAgIG1vZGVsLnJlbmRlcihnbCwge2NhbWVyYSwgdmlld01hdHJpeDogY2FtZXJhLnZpZXd9KTtcblxuICAgIG1vZGVsLm9uQWZ0ZXJSZW5kZXIoY2FtZXJhLCBjb250ZXh0KTtcbiAgICBtb2RlbC51bnNldFByb2dyYW1TdGF0ZSgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gVE9ETyAtIHRoaXMgaXMgdGhlIG5ldyBwaWNraW5nIGZvciBkZWNrLmdsXG4gIHBpY2tNb2RlbHMoZ2wsIHtjYW1lcmEsIHgsIHksIC4uLm9wdHN9KSB7XG4gICAgY29uc3Qge3ZpZXc6IHZpZXdNYXRyaXh9ID0gY2FtZXJhO1xuICAgIHJldHVybiBwaWNrTW9kZWxzKGdsLCB7XG4gICAgICBncm91cDogdGhpcyxcbiAgICAgIGNhbWVyYSxcbiAgICAgIHZpZXdNYXRyaXgsXG4gICAgICB4LCB5LFxuICAgICAgLi4ub3B0c1xuICAgIH0pO1xuICB9XG5cbiAgLypcbiAgcGljayh4LCB5LCBvcHQgPSB7fSkge1xuICAgIGNvbnN0IGdsID0gdGhpcy5nbDtcblxuICAgIGlmICh0aGlzLnBpY2tpbmdGQk8gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5waWNraW5nRkJPID0gbmV3IEZyYW1lYnVmZmVyKGdsLCB7XG4gICAgICAgIHdpZHRoOiBnbC5jYW52YXMud2lkdGgsXG4gICAgICAgIGhlaWdodDogZ2wuY2FudmFzLmhlaWdodFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMucGlja2luZ1Byb2dyYW0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5waWNraW5nUHJvZ3JhbSA9XG4gICAgICAgIG9wdC5waWNraW5nUHJvZ3JhbSB8fCBtYWtlUHJvZ3JhbUZyb21EZWZhdWx0U2hhZGVycyhnbCk7XG4gICAgfVxuXG4gICAgbGV0IHBpY2tpbmdQcm9ncmFtID0gdGhpcy5waWNraW5nUHJvZ3JhbTtcblxuICAgIHBpY2tpbmdQcm9ncmFtLnVzZSgpO1xuICAgIHBpY2tpbmdQcm9ncmFtLnNldFVuaWZvcm0oJ2VuYWJsZVBpY2tpbmcnLCB0cnVlKTtcbiAgICBwaWNraW5nUHJvZ3JhbS5zZXRVbmlmb3JtKCdoYXNQaWNraW5nQ29sb3JzJywgZmFsc2UpO1xuXG4gICAgdGhpcy5waWNraW5nRkJPLmJpbmQoKTtcblxuICAgIGxldCBoYXNoID0ge307XG5cbiAgICBnbC5lbmFibGUoZ2wuU0NJU1NPUl9URVNUKTtcbiAgICBnbC5zY2lzc29yKHgsIGdsLmNhbnZhcy5oZWlnaHQgLSB5LCAxLCAxKTtcblxuICAgIGNvbnN0IG9sZENsZWFyQ29sb3IgPSB0aGlzLmNsZWFyQ29sb3I7XG4gICAgY29uc3Qgb2xkQmFja2dyb3VuZENvbG9yID0gdGhpcy5iYWNrZ3JvdW5kQ29sb3I7XG4gICAgdGhpcy5jbGVhckNvbG9yID0gdHJ1ZTtcbiAgICB0aGlzLmJhY2tncm91bmRDb2xvciA9IHtyOiAwLCBnOiAwLCBiOiAwLCBhOiAwfTtcblxuICAgIHRoaXMucmVuZGVyKHtcbiAgICAgIHJlbmRlclByb2dyYW06IHBpY2tpbmdQcm9ncmFtLFxuICAgICAgb25CZWZvcmVSZW5kZXI6IGZ1bmN0aW9uKGVsZW0sIGkpIHtcbiAgICAgICAgaSsrO1xuICAgICAgICBsZXQgciA9IGkgJSAyNTY7XG4gICAgICAgIGxldCBnID0gKChpIC8gMjU2KSA+PiAwKSAlIDI1NjtcbiAgICAgICAgbGV0IGIgPSAoKGkgLyAoMjU2ICogMjU2KSkgPj4gMCkgJSAyNTY7XG4gICAgICAgIGhhc2hbW3IsIGcsIGJdXSA9IGVsZW07XG4gICAgICAgIHBpY2tpbmdQcm9ncmFtLnNldFVuaWZvcm0oJ3BpY2tDb2xvcicsIFtyIC8gMjU1LCBnIC8gMjU1LCBiIC8gMjU1XSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBnbC5kaXNhYmxlKGdsLlNDSVNTT1JfVEVTVCk7XG5cbiAgICBjb25zdCBwaXhlbCA9IG5ldyBVaW50OEFycmF5KDQpO1xuXG4gICAgZ2wucmVhZFBpeGVscyhcbiAgICAgIHgsIGdsLmNhbnZhcy5oZWlnaHQgLSB5LCAxLCAxLCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCBwaXhlbFxuICAgICk7XG5cbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xuICAgIHRoaXMuY2xlYXJDb2xvciA9IG9sZENsZWFyQ29sb3I7XG4gICAgdGhpcy5iYWNrZ3JvdW5kQ29sb3IgPSBvbGRCYWNrZ3JvdW5kQ29sb3I7XG5cbiAgICBsZXQgciA9IHBpeGVsWzBdO1xuICAgIGxldCBnID0gcGl4ZWxbMV07XG4gICAgbGV0IGIgPSBwaXhlbFsyXTtcblxuICAgIHJldHVybiBoYXNoW1tyLCBnLCBiXV07XG4gIH1cblxuICBwaWNrQ3VzdG9tKHgsIHksIG9wdCA9IHt9KSB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLmdsO1xuXG4gICAgaWYgKHRoaXMucGlja2luZ0ZCTyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnBpY2tpbmdGQk8gPSBuZXcgRnJhbWVidWZmZXIoZ2wsIHtcbiAgICAgICAgd2lkdGg6IGdsLmNhbnZhcy53aWR0aCxcbiAgICAgICAgaGVpZ2h0OiBnbC5jYW52YXMuaGVpZ2h0XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5waWNraW5nUHJvZ3JhbSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnBpY2tpbmdQcm9ncmFtID1cbiAgICAgICAgb3B0LnBpY2tpbmdQcm9ncmFtIHx8IG1ha2VQcm9ncmFtRnJvbURlZmF1bHRTaGFkZXJzKGdsKTtcbiAgICB9XG5cbiAgICBsZXQgcGlja2luZ1Byb2dyYW0gPSB0aGlzLnBpY2tpbmdQcm9ncmFtO1xuXG4gICAgcGlja2luZ1Byb2dyYW0udXNlKCk7XG4gICAgcGlja2luZ1Byb2dyYW0uc2V0VW5pZm9ybSgnZW5hYmxlUGlja2luZycsIHRydWUpO1xuICAgIHBpY2tpbmdQcm9ncmFtLnNldFVuaWZvcm0oJ2hhc1BpY2tpbmdDb2xvcnMnLCB0cnVlKTtcblxuICAgIHRoaXMucGlja2luZ0ZCTy5iaW5kKCk7XG5cbiAgICBnbC5lbmFibGUoZ2wuU0NJU1NPUl9URVNUKTtcbiAgICBnbC5zY2lzc29yKHgsIGdsLmNhbnZhcy5oZWlnaHQgLSB5LCAxLCAxKTtcblxuICAgIGNvbnN0IG9sZENsZWFyQ29sb3IgPSB0aGlzLmNsZWFyQ29sb3I7XG4gICAgY29uc3Qgb2xkQmFja2dyb3VuZENvbG9yID0gdGhpcy5iYWNrZ3JvdW5kQ29sb3I7XG4gICAgdGhpcy5jbGVhckNvbG9yID0gdHJ1ZTtcbiAgICB0aGlzLmJhY2tncm91bmRDb2xvciA9IHtyOiAyNTUsIGc6IDAsIGI6IDAsIGE6IDI1NX07XG5cbiAgICB0aGlzLnJlbmRlcih7XG4gICAgICByZW5kZXJQcm9ncmFtOiBwaWNraW5nUHJvZ3JhbVxuICAgIH0pO1xuXG4gICAgZ2wuZGlzYWJsZShnbC5TQ0lTU09SX1RFU1QpO1xuXG4gICAgY29uc3QgcGl4ZWwgPSBuZXcgVWludDhBcnJheSg0KTtcblxuICAgIGdsLnJlYWRQaXhlbHMoXG4gICAgICB4LCBnbC5jYW52YXMuaGVpZ2h0IC0geSwgMSwgMSwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgcGl4ZWxcbiAgICApO1xuXG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBudWxsKTtcbiAgICB0aGlzLmNsZWFyQ29sb3IgPSBvbGRDbGVhckNvbG9yO1xuICAgIHRoaXMuYmFja2dyb3VuZENvbG9yID0gb2xkQmFja2dyb3VuZENvbG9yO1xuXG4gICAgbGV0IHIgPSBwaXhlbFswXTtcbiAgICBsZXQgZyA9IHBpeGVsWzFdO1xuICAgIGxldCBiID0gcGl4ZWxbMl07XG4gICAgbGV0IGEgPSBwaXhlbFszXTtcblxuICAgIHJldHVybiBbciwgZywgYiwgYV07XG4gIH1cbiAgKi9cblxuICAvLyBTZXR1cCB0aGUgbGlnaHRpbmcgc3lzdGVtOiBhbWJpZW50LCBkaXJlY3Rpb25hbCwgcG9pbnQgbGlnaHRzLlxuICBzZXR1cExpZ2h0aW5nKHByb2dyYW0pIHtcbiAgICAvLyBTZXR1cCBMaWdodGluZ1xuICAgIGxldCB7ZW5hYmxlLCBhbWJpZW50LCBkaXJlY3Rpb25hbCwgcG9pbnRzfSA9IHRoaXMuY29uZmlnLmxpZ2h0cztcblxuICAgIC8vIFNldCBsaWdodCB1bmlmb3Jtcy4gQW1iaWVudCBhbmQgZGlyZWN0aW9uYWwgbGlnaHRzLlxuICAgIHByb2dyYW0uc2V0VW5pZm9ybSgnZW5hYmxlTGlnaHRzJywgZW5hYmxlKTtcblxuICAgIGlmICghZW5hYmxlKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBpZiAoYW1iaWVudCkge1xuICAgICAgdGhpcy5zZXR1cEFtYmllbnRMaWdodGluZyhwcm9ncmFtLCBhbWJpZW50KTtcbiAgICB9XG5cbiAgICBpZiAoZGlyZWN0aW9uYWwpIHtcbiAgICAgIHRoaXMuc2V0dXBEaXJlY3Rpb25hbExpZ2h0aW5nKHByb2dyYW0sIGRpcmVjdGlvbmFsKTtcbiAgICB9XG5cbiAgICAvLyBTZXQgcG9pbnQgbGlnaHRzXG4gICAgaWYgKHBvaW50cykge1xuICAgICAgdGhpcy5zZXR1cFBvaW50TGlnaHRpbmcocHJvZ3JhbSwgcG9pbnRzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldHVwQW1iaWVudExpZ2h0aW5nKHByb2dyYW0sIGFtYmllbnQpIHtcbiAgICBwcm9ncmFtLnNldFVuaWZvcm1zKHtcbiAgICAgICdhbWJpZW50Q29sb3InOiBbYW1iaWVudC5yLCBhbWJpZW50LmcsIGFtYmllbnQuYl1cbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0dXBEaXJlY3Rpb25hbExpZ2h0aW5nKHByb2dyYW0sIGRpcmVjdGlvbmFsKSB7XG4gICAgbGV0IHtjb2xvciwgZGlyZWN0aW9ufSA9IGRpcmVjdGlvbmFsO1xuXG4gICAgLy8gTm9ybWFsaXplIGxpZ2h0aW5nIGRpcmVjdGlvbiB2ZWN0b3JcbiAgICBjb25zdCBkaXIgPSBuZXcgVmVjMyhkaXJlY3Rpb24ueCwgZGlyZWN0aW9uLnksIGRpcmVjdGlvbi56KVxuICAgICAgLiR1bml0KClcbiAgICAgIC4kc2NhbGUoLTEpO1xuXG4gICAgcHJvZ3JhbS5zZXRVbmlmb3Jtcyh7XG4gICAgICAnZGlyZWN0aW9uYWxDb2xvcic6IFtjb2xvci5yLCBjb2xvci5nLCBjb2xvci5iXSxcbiAgICAgICdsaWdodGluZ0RpcmVjdGlvbic6IFtkaXIueCwgZGlyLnksIGRpci56XVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXR1cFBvaW50TGlnaHRpbmcocHJvZ3JhbSwgcG9pbnRzKSB7XG4gICAgcG9pbnRzID0gcG9pbnRzIGluc3RhbmNlb2YgQXJyYXkgPyBwb2ludHMgOiBbcG9pbnRzXTtcbiAgICBjb25zdCBudW1iZXJQb2ludHMgPSBwb2ludHMubGVuZ3RoO1xuICAgIHByb2dyYW0uc2V0VW5pZm9ybSgnbnVtYmVyUG9pbnRzJywgbnVtYmVyUG9pbnRzKTtcblxuICAgIGNvbnN0IHBvaW50TG9jYXRpb25zID0gW107XG4gICAgY29uc3QgcG9pbnRDb2xvcnMgPSBbXTtcbiAgICBjb25zdCBlbmFibGVTcGVjdWxhciA9IFtdO1xuICAgIGNvbnN0IHBvaW50U3BlY3VsYXJDb2xvcnMgPSBbXTtcbiAgICBmb3IgKGNvbnN0IHBvaW50IG9mIHBvaW50cykge1xuICAgICAgY29uc3Qge3Bvc2l0aW9uLCBjb2xvciwgZGlmZnVzZSwgc3BlY3VsYXJ9ID0gcG9pbnQ7XG4gICAgICBjb25zdCBwb2ludENvbG9yID0gY29sb3IgfHwgZGlmZnVzZTtcblxuICAgICAgcG9pbnRMb2NhdGlvbnMucHVzaChwb3NpdGlvbi54LCBwb3NpdGlvbi55LCBwb3NpdGlvbi56KTtcbiAgICAgIHBvaW50Q29sb3JzLnB1c2gocG9pbnRDb2xvci5yLCBwb2ludENvbG9yLmcsIHBvaW50Q29sb3IuYik7XG5cbiAgICAgIC8vIEFkZCBzcGVjdWxhciBjb2xvclxuICAgICAgZW5hYmxlU3BlY3VsYXIucHVzaChOdW1iZXIoQm9vbGVhbihzcGVjdWxhcikpKTtcbiAgICAgIGlmIChzcGVjdWxhcikge1xuICAgICAgICBwb2ludFNwZWN1bGFyQ29sb3JzLnB1c2goc3BlY3VsYXIuciwgc3BlY3VsYXIuZywgc3BlY3VsYXIuYik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwb2ludFNwZWN1bGFyQ29sb3JzLnB1c2goMCwgMCwgMCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvaW50TG9jYXRpb25zLmxlbmd0aCkge1xuICAgICAgcHJvZ3JhbS5zZXRVbmlmb3Jtcyh7XG4gICAgICAgICdwb2ludExvY2F0aW9uJzogcG9pbnRMb2NhdGlvbnMsXG4gICAgICAgICdwb2ludENvbG9yJzogcG9pbnRDb2xvcnNcbiAgICAgIH0pO1xuICAgICAgcHJvZ3JhbS5zZXRVbmlmb3Jtcyh7XG4gICAgICAgICdlbmFibGVTcGVjdWxhcic6IGVuYWJsZVNwZWN1bGFyLFxuICAgICAgICAncG9pbnRTcGVjdWxhckNvbG9yJzogcG9pbnRTcGVjdWxhckNvbG9yc1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBTZXR1cCBlZmZlY3RzIGxpa2UgZm9nLCBldGMuXG4gIHNldHVwRWZmZWN0cyhwcm9ncmFtKSB7XG4gICAgY29uc3Qge2ZvZ30gPSB0aGlzLmNvbmZpZy5lZmZlY3RzO1xuXG4gICAgaWYgKGZvZykge1xuICAgICAgY29uc3Qge2NvbG9yID0ge3I6IDAuNSwgZzogMC41LCBiOiAwLjV9fSA9IGZvZztcbiAgICAgIHByb2dyYW0uc2V0VW5pZm9ybXMoe1xuICAgICAgICAnaGFzRm9nJzogdHJ1ZSxcbiAgICAgICAgJ2ZvZ05lYXInOiBmb2cubmVhcixcbiAgICAgICAgJ2ZvZ0Zhcic6IGZvZy5mYXIsXG4gICAgICAgICdmb2dDb2xvcic6IFtjb2xvci5yLCBjb2xvci5nLCBjb2xvci5iXVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHByb2dyYW0uc2V0VW5pZm9ybSgnaGFzRm9nJywgZmFsc2UpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbn1cblxuU2NlbmUuTUFYX1RFWFRVUkVTID0gY29uZmlnLk1BWF9URVhUVVJFUztcblNjZW5lLk1BWF9QT0lOVF9MSUdIVFMgPSBjb25maWcuTUFYX1BPSU5UX0xJR0hUUztcblNjZW5lLlBJQ0tJTkdfUkVTID0gY29uZmlnLlBJQ0tJTkdfUkVTO1xuIl19