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
      (0, _assert2.default)(program, 'Scene failed to find valid program');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2VuZWdyYXBoL3NjZW5lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFHQTs7QUFDQTs7OztBQUNBOztBQUNBOztBQUNBOztBQUNBOztJQUFZOztBQUNaOzs7Ozs7Ozs7Ozs7Ozs7OztBQUVBLFNBQVMsSUFBVCxHQUFnQixFQUFoQjs7QUFFQSxJQUFNLHFCQUFxQjtBQUN6QixVQUFRO0FBQ04sWUFBUSxLQUFSOztBQUVBLGFBQVMsRUFBQyxHQUFHLEdBQUgsRUFBUSxHQUFHLEdBQUgsRUFBUSxHQUFHLEdBQUgsRUFBMUI7O0FBRUEsaUJBQWE7QUFDWCxpQkFBVyxFQUFDLEdBQUcsQ0FBSCxFQUFNLEdBQUcsQ0FBSCxFQUFNLEdBQUcsQ0FBSCxFQUF4QjtBQUNBLGFBQU8sRUFBQyxHQUFHLENBQUgsRUFBTSxHQUFHLENBQUgsRUFBTSxHQUFHLENBQUgsRUFBcEI7S0FGRjs7O0FBTE0sR0FBUjtBQVlBLFdBQVM7QUFDUCxTQUFLLEtBQUw7O0FBRE8sR0FBVDtBQUlBLGNBQVksSUFBWjtBQUNBLGNBQVksSUFBWjtBQUNBLG1CQUFpQixFQUFDLEdBQUcsQ0FBSCxFQUFNLEdBQUcsQ0FBSCxFQUFNLEdBQUcsQ0FBSCxFQUFNLEdBQUcsQ0FBSCxFQUFwQztBQUNBLG1CQUFpQixDQUFqQjtDQXBCSTs7QUF1Qk4sSUFBTSxtQkFBbUIsK0JBQW5COzs7O0lBR2U7OztBQUVuQixXQUZtQixLQUVuQixDQUFZLEVBQVosRUFBZ0IsSUFBaEIsRUFBc0I7MEJBRkgsT0FFRzs7QUFDcEIsMEJBQU8sRUFBUCxFQUFXLGdCQUFYLEVBRG9COztBQUdwQixXQUFPLGtCQUFNLGtCQUFOLEVBQTBCLElBQTFCLENBQVAsQ0FIb0I7O3VFQUZILGtCQU9YLE9BTGM7O0FBT3BCLFVBQUssRUFBTCxHQUFVLEVBQVYsQ0FQb0I7QUFRcEIsVUFBSyxNQUFMLEdBQWMsSUFBZCxDQVJvQjs7R0FBdEI7O2VBRm1COzsrQkFhUixLQUFLO0FBQ2QsVUFB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QixRQUFuQixFQUE2QixLQUE3QixFQURLO09BUlA7O0FBWUEsYUFBTyxJQUFQLENBZm9COzs7O1NBM1RIOzs7Ozs7QUErVXJCLE1BQU0sWUFBTixHQUFxQixPQUFPLFlBQVA7QUFDckIsTUFBTSxnQkFBTixHQUF5QixPQUFPLGdCQUFQO0FBQ3pCLE1BQU0sV0FBTixHQUFvQixPQUFPLFdBQVAiLCJmaWxlIjoic2NlbmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBTY2VuZSBPYmplY3QgbWFuYWdlbWVudCBhbmQgcmVuZGVyaW5nXG4vKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cywgbm8tdHJ5LWNhdGNoICovXG5cbmltcG9ydCB7Q2FtZXJhfSBmcm9tICcuLi9jYW1lcmEnO1xuaW1wb3J0IEdyb3VwIGZyb20gJy4vZ3JvdXAnO1xuaW1wb3J0IHtwaWNrTW9kZWxzfSBmcm9tICcuL3BpY2snO1xuaW1wb3J0IHtWZWMzfSBmcm9tICcuLi9tYXRoJztcbmltcG9ydCB7bWVyZ2V9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCAqIGFzIGNvbmZpZyBmcm9tICcuLi9jb25maWcnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxuY29uc3QgREVGQVVMVF9TQ0VORV9PUFRTID0ge1xuICBsaWdodHM6IHtcbiAgICBlbmFibGU6IGZhbHNlLFxuICAgIC8vIGFtYmllbnQgbGlnaHRcbiAgICBhbWJpZW50OiB7cjogMC4yLCBnOiAwLjIsIGI6IDAuMn0sXG4gICAgLy8gZGlyZWN0aW9uYWwgbGlnaHRcbiAgICBkaXJlY3Rpb25hbDoge1xuICAgICAgZGlyZWN0aW9uOiB7eDogMSwgeTogMSwgejogMX0sXG4gICAgICBjb2xvcjoge3I6IDAsIGc6IDAsIGI6IDB9XG4gICAgfVxuICAgIC8vIHBvaW50IGxpZ2h0XG4gICAgLy8gcG9pbnRzOiBbXVxuICB9LFxuICBlZmZlY3RzOiB7XG4gICAgZm9nOiBmYWxzZVxuICAgIC8vIHsgbmVhciwgZmFyLCBjb2xvciB9XG4gIH0sXG4gIGNsZWFyQ29sb3I6IHRydWUsXG4gIGNsZWFyRGVwdGg6IHRydWUsXG4gIGJhY2tncm91bmRDb2xvcjoge3I6IDAsIGc6IDAsIGI6IDAsIGE6IDF9LFxuICBiYWNrZ3JvdW5kRGVwdGg6IDFcbn07XG5cbmNvbnN0IElOVkFMSURfQVJHVU1FTlQgPSAnTHVtYUdMLlNjZW5lIGludmFsaWQgYXJndW1lbnQnO1xuXG4vLyBTY2VuZSBjbGFzc1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2NlbmUgZXh0ZW5kcyBHcm91cCB7XG5cbiAgY29uc3RydWN0b3IoZ2wsIG9wdHMpIHtcbiAgICBhc3NlcnQoZ2wsIElOVkFMSURfQVJHVU1FTlQpO1xuXG4gICAgb3B0cyA9IG1lcmdlKERFRkFVTFRfU0NFTkVfT1BUUywgb3B0cyk7XG5cbiAgICBzdXBlcihvcHRzKTtcblxuICAgIHRoaXMuZ2wgPSBnbDtcbiAgICB0aGlzLmNvbmZpZyA9IG9wdHM7XG4gIH1cblxuICBnZXRQcm9ncmFtKG9iaikge1xuICAgIGNvbnN0IHByb2dyYW0gPSBvYmogPyBvYmoucHJvZ3JhbSA6IHRoaXMucHJvZ3JhbTtcbiAgICBhc3NlcnQocHJvZ3JhbSwgJ1NjZW5lIGZhaWxlZCB0byBmaW5kIHZhbGlkIHByb2dyYW0nKTtcbiAgICBwcm9ncmFtLnVzZSgpO1xuICAgIHJldHVybiBwcm9ncmFtO1xuICB9XG5cbiAgZGVmaW5lQnVmZmVycyhvYmopIHtcbiAgICBjb25zdCBwcm9ncmFtID0gdGhpcy5nZXRQcm9ncmFtKG9iaik7XG4gICAgY29uc3QgcHJldkR5bmFtaWMgPSBvYmouZHluYW1pYztcbiAgICBvYmouZHluYW1pYyA9IHRydWU7XG4gICAgb2JqLnNldFByb2dyYW1TdGF0ZShwcm9ncmFtKTtcbiAgICBvYmouZHluYW1pYyA9IHByZXZEeW5hbWljO1xuICAgIG9iai51bnNldFByb2dyYW1TdGF0ZShwcm9ncmFtKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGNsZWFyKGdsKSB7XG4gICAgaWYgKHRoaXMuY29uZmlnLmNsZWFyQ29sb3IpIHtcbiAgICAgIGNvbnN0IGJnID0gdGhpcy5jb25maWcuYmFja2dyb3VuZENvbG9yO1xuICAgICAgZ2wuY2xlYXJDb2xvcihiZy5yLCBiZy5nLCBiZy5iLCBiZy5hKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuY29uZmlnLmNsZWFyRGVwdGgpIHtcbiAgICAgIGdsLmNsZWFyRGVwdGgodGhpcy5jb25maWcuYmFja2dyb3VuZERlcHRoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuY29uZmlnLmNsZWFyQ29sb3IgJiYgdGhpcy5jb25maWcuY2xlYXJEZXB0aCkge1xuICAgICAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVCB8IGdsLkRFUFRIX0JVRkZFUl9CSVQpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5jb25maWcuY2xlYXJDb2xvcikge1xuICAgICAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmNvbmZpZy5jbGVhckRlcHRoKSB7XG4gICAgICBnbC5jbGVhcihnbC5ERVBUSF9CVUZGRVJfQklUKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBSZW5kZXJzIGFsbCBvYmplY3RzIGluIHRoZSBzY2VuZS5cbiAgcmVuZGVyKGdsLCB7XG4gICAgY2FtZXJhLFxuICAgIG9uQmVmb3JlUmVuZGVyID0gbm9vcCxcbiAgICBvbkFmdGVyUmVuZGVyID0gbm9vcCxcbiAgICBjb250ZXh0ID0ge30sXG4gICAgLi4ub3B0c1xuICB9ID0ge30pIHtcbiAgICBhc3NlcnQoY2FtZXJhIGluc3RhbmNlb2YgQ2FtZXJhKTtcblxuICAgIHRoaXMuY2xlYXIoZ2wpO1xuXG4gICAgLy8gR28gdGhyb3VnaCBlYWNoIG1vZGVsIGFuZCByZW5kZXIgaXQuXG4gICAgZm9yIChjb25zdCBtb2RlbCBvZiB0aGlzLnRyYXZlcnNlKHt2aWV3TWF0cml4OiBjYW1lcmEudmlld30pKSB7XG4gICAgICBpZiAobW9kZWwuZGlzcGxheSkge1xuICAgICAgICBvbkJlZm9yZVJlbmRlcihtb2RlbCwgY29udGV4dCk7XG4gICAgICAgIHRoaXMucmVuZGVyT2JqZWN0KGdsLCB7bW9kZWwsIGNhbWVyYSwgY29udGV4dH0pO1xuICAgICAgICBvbkFmdGVyUmVuZGVyKG1vZGVsLCBjb250ZXh0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByZW5kZXJPYmplY3QoZ2wsIHttb2RlbCwgY2FtZXJhLCBjb250ZXh0ID0ge319KSB7XG4gICAgYXNzZXJ0KGNhbWVyYSBpbnN0YW5jZW9mIENhbWVyYSk7XG5cbiAgICBtb2RlbC5vbkJlZm9yZVJlbmRlcihjYW1lcmEsIGNvbnRleHQpO1xuXG4gICAgY29uc3QgcHJvZ3JhbSA9IHRoaXMuZ2V0UHJvZ3JhbShtb2RlbCk7XG5cbiAgICAvLyBTZXR1cCBsaWdodGluZyBhbmQgc2NlbmUgZWZmZWN0cyBsaWtlIGZvZywgZXRjLlxuICAgIHRoaXMuc2V0dXBMaWdodGluZyhwcm9ncmFtKTtcbiAgICB0aGlzLnNldHVwRWZmZWN0cyhwcm9ncmFtKTtcblxuICAgIC8vIERyYXdcbiAgICBtb2RlbC5yZW5kZXIoZ2wsIHtjYW1lcmEsIHZpZXdNYXRyaXg6IGNhbWVyYS52aWV3fSk7XG5cbiAgICBtb2RlbC5vbkFmdGVyUmVuZGVyKGNhbWVyYSwgY29udGV4dCk7XG4gICAgbW9kZWwudW5zZXRQcm9ncmFtU3RhdGUoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIFRPRE8gLSB0aGlzIGlzIHRoZSBuZXcgcGlja2luZyBmb3IgZGVjay5nbFxuICBwaWNrTW9kZWxzKGdsLCB7Y2FtZXJhLCB4LCB5LCAuLi5vcHRzfSkge1xuICAgIGNvbnN0IHt2aWV3OiB2aWV3TWF0cml4fSA9IGNhbWVyYTtcbiAgICByZXR1cm4gcGlja01vZGVscyhnbCwge1xuICAgICAgZ3JvdXA6IHRoaXMsXG4gICAgICBjYW1lcmEsXG4gICAgICB2aWV3TWF0cml4LFxuICAgICAgeCwgeSxcbiAgICAgIC4uLm9wdHNcbiAgICB9KTtcbiAgfVxuXG4gIC8qXG4gIHBpY2soeCwgeSwgb3B0ID0ge30pIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuZ2w7XG5cbiAgICBpZiAodGhpcy5waWNraW5nRkJPID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMucGlja2luZ0ZCTyA9IG5ldyBGcmFtZWJ1ZmZlcihnbCwge1xuICAgICAgICB3aWR0aDogZ2wuY2FudmFzLndpZHRoLFxuICAgICAgICBoZWlnaHQ6IGdsLmNhbnZhcy5oZWlnaHRcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnBpY2tpbmdQcm9ncmFtID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMucGlja2luZ1Byb2dyYW0gPVxuICAgICAgICBvcHQucGlja2luZ1Byb2dyYW0gfHwgbWFrZVByb2dyYW1Gcm9tRGVmYXVsdFNoYWRlcnMoZ2wpO1xuICAgIH1cblxuICAgIGxldCBwaWNraW5nUHJvZ3JhbSA9IHRoaXMucGlja2luZ1Byb2dyYW07XG5cbiAgICBwaWNraW5nUHJvZ3JhbS51c2UoKTtcbiAgICBwaWNraW5nUHJvZ3JhbS5zZXRVbmlmb3JtKCdlbmFibGVQaWNraW5nJywgdHJ1ZSk7XG4gICAgcGlja2luZ1Byb2dyYW0uc2V0VW5pZm9ybSgnaGFzUGlja2luZ0NvbG9ycycsIGZhbHNlKTtcblxuICAgIHRoaXMucGlja2luZ0ZCTy5iaW5kKCk7XG5cbiAgICBsZXQgaGFzaCA9IHt9O1xuXG4gICAgZ2wuZW5hYmxlKGdsLlNDSVNTT1JfVEVTVCk7XG4gICAgZ2wuc2Npc3Nvcih4LCBnbC5jYW52YXMuaGVpZ2h0IC0geSwgMSwgMSk7XG5cbiAgICBjb25zdCBvbGRDbGVhckNvbG9yID0gdGhpcy5jbGVhckNvbG9yO1xuICAgIGNvbnN0IG9sZEJhY2tncm91bmRDb2xvciA9IHRoaXMuYmFja2dyb3VuZENvbG9yO1xuICAgIHRoaXMuY2xlYXJDb2xvciA9IHRydWU7XG4gICAgdGhpcy5iYWNrZ3JvdW5kQ29sb3IgPSB7cjogMCwgZzogMCwgYjogMCwgYTogMH07XG5cbiAgICB0aGlzLnJlbmRlcih7XG4gICAgICByZW5kZXJQcm9ncmFtOiBwaWNraW5nUHJvZ3JhbSxcbiAgICAgIG9uQmVmb3JlUmVuZGVyOiBmdW5jdGlvbihlbGVtLCBpKSB7XG4gICAgICAgIGkrKztcbiAgICAgICAgbGV0IHIgPSBpICUgMjU2O1xuICAgICAgICBsZXQgZyA9ICgoaSAvIDI1NikgPj4gMCkgJSAyNTY7XG4gICAgICAgIGxldCBiID0gKChpIC8gKDI1NiAqIDI1NikpID4+IDApICUgMjU2O1xuICAgICAgICBoYXNoW1tyLCBnLCBiXV0gPSBlbGVtO1xuICAgICAgICBwaWNraW5nUHJvZ3JhbS5zZXRVbmlmb3JtKCdwaWNrQ29sb3InLCBbciAvIDI1NSwgZyAvIDI1NSwgYiAvIDI1NV0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgZ2wuZGlzYWJsZShnbC5TQ0lTU09SX1RFU1QpO1xuXG4gICAgY29uc3QgcGl4ZWwgPSBuZXcgVWludDhBcnJheSg0KTtcblxuICAgIGdsLnJlYWRQaXhlbHMoXG4gICAgICB4LCBnbC5jYW52YXMuaGVpZ2h0IC0geSwgMSwgMSwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgcGl4ZWxcbiAgICApO1xuXG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBudWxsKTtcbiAgICB0aGlzLmNsZWFyQ29sb3IgPSBvbGRDbGVhckNvbG9yO1xuICAgIHRoaXMuYmFja2dyb3VuZENvbG9yID0gb2xkQmFja2dyb3VuZENvbG9yO1xuXG4gICAgbGV0IHIgPSBwaXhlbFswXTtcbiAgICBsZXQgZyA9IHBpeGVsWzFdO1xuICAgIGxldCBiID0gcGl4ZWxbMl07XG5cbiAgICByZXR1cm4gaGFzaFtbciwgZywgYl1dO1xuICB9XG5cbiAgcGlja0N1c3RvbSh4LCB5LCBvcHQgPSB7fSkge1xuICAgIGNvbnN0IGdsID0gdGhpcy5nbDtcblxuICAgIGlmICh0aGlzLnBpY2tpbmdGQk8gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5waWNraW5nRkJPID0gbmV3IEZyYW1lYnVmZmVyKGdsLCB7XG4gICAgICAgIHdpZHRoOiBnbC5jYW52YXMud2lkdGgsXG4gICAgICAgIGhlaWdodDogZ2wuY2FudmFzLmhlaWdodFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMucGlja2luZ1Byb2dyYW0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5waWNraW5nUHJvZ3JhbSA9XG4gICAgICAgIG9wdC5waWNraW5nUHJvZ3JhbSB8fCBtYWtlUHJvZ3JhbUZyb21EZWZhdWx0U2hhZGVycyhnbCk7XG4gICAgfVxuXG4gICAgbGV0IHBpY2tpbmdQcm9ncmFtID0gdGhpcy5waWNraW5nUHJvZ3JhbTtcblxuICAgIHBpY2tpbmdQcm9ncmFtLnVzZSgpO1xuICAgIHBpY2tpbmdQcm9ncmFtLnNldFVuaWZvcm0oJ2VuYWJsZVBpY2tpbmcnLCB0cnVlKTtcbiAgICBwaWNraW5nUHJvZ3JhbS5zZXRVbmlmb3JtKCdoYXNQaWNraW5nQ29sb3JzJywgdHJ1ZSk7XG5cbiAgICB0aGlzLnBpY2tpbmdGQk8uYmluZCgpO1xuXG4gICAgZ2wuZW5hYmxlKGdsLlNDSVNTT1JfVEVTVCk7XG4gICAgZ2wuc2Npc3Nvcih4LCBnbC5jYW52YXMuaGVpZ2h0IC0geSwgMSwgMSk7XG5cbiAgICBjb25zdCBvbGRDbGVhckNvbG9yID0gdGhpcy5jbGVhckNvbG9yO1xuICAgIGNvbnN0IG9sZEJhY2tncm91bmRDb2xvciA9IHRoaXMuYmFja2dyb3VuZENvbG9yO1xuICAgIHRoaXMuY2xlYXJDb2xvciA9IHRydWU7XG4gICAgdGhpcy5iYWNrZ3JvdW5kQ29sb3IgPSB7cjogMjU1LCBnOiAwLCBiOiAwLCBhOiAyNTV9O1xuXG4gICAgdGhpcy5yZW5kZXIoe1xuICAgICAgcmVuZGVyUHJvZ3JhbTogcGlja2luZ1Byb2dyYW1cbiAgICB9KTtcblxuICAgIGdsLmRpc2FibGUoZ2wuU0NJU1NPUl9URVNUKTtcblxuICAgIGNvbnN0IHBpeGVsID0gbmV3IFVpbnQ4QXJyYXkoNCk7XG5cbiAgICBnbC5yZWFkUGl4ZWxzKFxuICAgICAgeCwgZ2wuY2FudmFzLmhlaWdodCAtIHksIDEsIDEsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIHBpeGVsXG4gICAgKTtcblxuICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgbnVsbCk7XG4gICAgdGhpcy5jbGVhckNvbG9yID0gb2xkQ2xlYXJDb2xvcjtcbiAgICB0aGlzLmJhY2tncm91bmRDb2xvciA9IG9sZEJhY2tncm91bmRDb2xvcjtcblxuICAgIGxldCByID0gcGl4ZWxbMF07XG4gICAgbGV0IGcgPSBwaXhlbFsxXTtcbiAgICBsZXQgYiA9IHBpeGVsWzJdO1xuICAgIGxldCBhID0gcGl4ZWxbM107XG5cbiAgICByZXR1cm4gW3IsIGcsIGIsIGFdO1xuICB9XG4gICovXG5cbiAgLy8gU2V0dXAgdGhlIGxpZ2h0aW5nIHN5c3RlbTogYW1iaWVudCwgZGlyZWN0aW9uYWwsIHBvaW50IGxpZ2h0cy5cbiAgc2V0dXBMaWdodGluZyhwcm9ncmFtKSB7XG4gICAgLy8gU2V0dXAgTGlnaHRpbmdcbiAgICBsZXQge2VuYWJsZSwgYW1iaWVudCwgZGlyZWN0aW9uYWwsIHBvaW50c30gPSB0aGlzLmNvbmZpZy5saWdodHM7XG5cbiAgICAvLyBTZXQgbGlnaHQgdW5pZm9ybXMuIEFtYmllbnQgYW5kIGRpcmVjdGlvbmFsIGxpZ2h0cy5cbiAgICBwcm9ncmFtLnNldFVuaWZvcm0oJ2VuYWJsZUxpZ2h0cycsIGVuYWJsZSk7XG5cbiAgICBpZiAoIWVuYWJsZSkge1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgaWYgKGFtYmllbnQpIHtcbiAgICAgIHRoaXMuc2V0dXBBbWJpZW50TGlnaHRpbmcocHJvZ3JhbSwgYW1iaWVudCk7XG4gICAgfVxuXG4gICAgaWYgKGRpcmVjdGlvbmFsKSB7XG4gICAgICB0aGlzLnNldHVwRGlyZWN0aW9uYWxMaWdodGluZyhwcm9ncmFtLCBkaXJlY3Rpb25hbCk7XG4gICAgfVxuXG4gICAgLy8gU2V0IHBvaW50IGxpZ2h0c1xuICAgIGlmIChwb2ludHMpIHtcbiAgICAgIHRoaXMuc2V0dXBQb2ludExpZ2h0aW5nKHByb2dyYW0sIHBvaW50cyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXR1cEFtYmllbnRMaWdodGluZyhwcm9ncmFtLCBhbWJpZW50KSB7XG4gICAgcHJvZ3JhbS5zZXRVbmlmb3Jtcyh7XG4gICAgICAnYW1iaWVudENvbG9yJzogW2FtYmllbnQuciwgYW1iaWVudC5nLCBhbWJpZW50LmJdXG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldHVwRGlyZWN0aW9uYWxMaWdodGluZyhwcm9ncmFtLCBkaXJlY3Rpb25hbCkge1xuICAgIGxldCB7Y29sb3IsIGRpcmVjdGlvbn0gPSBkaXJlY3Rpb25hbDtcblxuICAgIC8vIE5vcm1hbGl6ZSBsaWdodGluZyBkaXJlY3Rpb24gdmVjdG9yXG4gICAgY29uc3QgZGlyID0gbmV3IFZlYzMoZGlyZWN0aW9uLngsIGRpcmVjdGlvbi55LCBkaXJlY3Rpb24ueilcbiAgICAgIC4kdW5pdCgpXG4gICAgICAuJHNjYWxlKC0xKTtcblxuICAgIHByb2dyYW0uc2V0VW5pZm9ybXMoe1xuICAgICAgJ2RpcmVjdGlvbmFsQ29sb3InOiBbY29sb3IuciwgY29sb3IuZywgY29sb3IuYl0sXG4gICAgICAnbGlnaHRpbmdEaXJlY3Rpb24nOiBbZGlyLngsIGRpci55LCBkaXIuel1cbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0dXBQb2ludExpZ2h0aW5nKHByb2dyYW0sIHBvaW50cykge1xuICAgIHBvaW50cyA9IHBvaW50cyBpbnN0YW5jZW9mIEFycmF5ID8gcG9pbnRzIDogW3BvaW50c107XG4gICAgY29uc3QgbnVtYmVyUG9pbnRzID0gcG9pbnRzLmxlbmd0aDtcbiAgICBwcm9ncmFtLnNldFVuaWZvcm0oJ251bWJlclBvaW50cycsIG51bWJlclBvaW50cyk7XG5cbiAgICBjb25zdCBwb2ludExvY2F0aW9ucyA9IFtdO1xuICAgIGNvbnN0IHBvaW50Q29sb3JzID0gW107XG4gICAgY29uc3QgZW5hYmxlU3BlY3VsYXIgPSBbXTtcbiAgICBjb25zdCBwb2ludFNwZWN1bGFyQ29sb3JzID0gW107XG4gICAgZm9yIChjb25zdCBwb2ludCBvZiBwb2ludHMpIHtcbiAgICAgIGNvbnN0IHtwb3NpdGlvbiwgY29sb3IsIGRpZmZ1c2UsIHNwZWN1bGFyfSA9IHBvaW50O1xuICAgICAgY29uc3QgcG9pbnRDb2xvciA9IGNvbG9yIHx8IGRpZmZ1c2U7XG5cbiAgICAgIHBvaW50TG9jYXRpb25zLnB1c2gocG9zaXRpb24ueCwgcG9zaXRpb24ueSwgcG9zaXRpb24ueik7XG4gICAgICBwb2ludENvbG9ycy5wdXNoKHBvaW50Q29sb3IuciwgcG9pbnRDb2xvci5nLCBwb2ludENvbG9yLmIpO1xuXG4gICAgICAvLyBBZGQgc3BlY3VsYXIgY29sb3JcbiAgICAgIGVuYWJsZVNwZWN1bGFyLnB1c2goTnVtYmVyKEJvb2xlYW4oc3BlY3VsYXIpKSk7XG4gICAgICBpZiAoc3BlY3VsYXIpIHtcbiAgICAgICAgcG9pbnRTcGVjdWxhckNvbG9ycy5wdXNoKHNwZWN1bGFyLnIsIHNwZWN1bGFyLmcsIHNwZWN1bGFyLmIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcG9pbnRTcGVjdWxhckNvbG9ycy5wdXNoKDAsIDAsIDApO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb2ludExvY2F0aW9ucy5sZW5ndGgpIHtcbiAgICAgIHByb2dyYW0uc2V0VW5pZm9ybXMoe1xuICAgICAgICAncG9pbnRMb2NhdGlvbic6IHBvaW50TG9jYXRpb25zLFxuICAgICAgICAncG9pbnRDb2xvcic6IHBvaW50Q29sb3JzXG4gICAgICB9KTtcbiAgICAgIHByb2dyYW0uc2V0VW5pZm9ybXMoe1xuICAgICAgICAnZW5hYmxlU3BlY3VsYXInOiBlbmFibGVTcGVjdWxhcixcbiAgICAgICAgJ3BvaW50U3BlY3VsYXJDb2xvcic6IHBvaW50U3BlY3VsYXJDb2xvcnNcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gU2V0dXAgZWZmZWN0cyBsaWtlIGZvZywgZXRjLlxuICBzZXR1cEVmZmVjdHMocHJvZ3JhbSkge1xuICAgIGNvbnN0IHtmb2d9ID0gdGhpcy5jb25maWcuZWZmZWN0cztcblxuICAgIGlmIChmb2cpIHtcbiAgICAgIGNvbnN0IHtjb2xvciA9IHtyOiAwLjUsIGc6IDAuNSwgYjogMC41fX0gPSBmb2c7XG4gICAgICBwcm9ncmFtLnNldFVuaWZvcm1zKHtcbiAgICAgICAgJ2hhc0ZvZyc6IHRydWUsXG4gICAgICAgICdmb2dOZWFyJzogZm9nLm5lYXIsXG4gICAgICAgICdmb2dGYXInOiBmb2cuZmFyLFxuICAgICAgICAnZm9nQ29sb3InOiBbY29sb3IuciwgY29sb3IuZywgY29sb3IuYl1cbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBwcm9ncmFtLnNldFVuaWZvcm0oJ2hhc0ZvZycsIGZhbHNlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG59XG5cblNjZW5lLk1BWF9URVhUVVJFUyA9IGNvbmZpZy5NQVhfVEVYVFVSRVM7XG5TY2VuZS5NQVhfUE9JTlRfTElHSFRTID0gY29uZmlnLk1BWF9QT0lOVF9MSUdIVFM7XG5TY2VuZS5QSUNLSU5HX1JFUyA9IGNvbmZpZy5QSUNLSU5HX1JFUztcbiJdfQ==