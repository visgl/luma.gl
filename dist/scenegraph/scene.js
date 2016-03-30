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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2VuZWdyYXBoL3NjZW5lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBU1k7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHWixTQUFTLElBQVQsR0FBZ0IsRUFBaEI7O0FBRUEsSUFBTSxxQkFBcUI7QUFDekIsVUFBUTtBQUNOLFlBQVEsS0FBUjs7QUFFQSxhQUFTLEVBQUMsR0FBRyxHQUFILEVBQVEsR0FBRyxHQUFILEVBQVEsR0FBRyxHQUFILEVBQTFCOztBQUVBLGlCQUFhO0FBQ1gsaUJBQVcsRUFBQyxHQUFHLENBQUgsRUFBTSxHQUFHLENBQUgsRUFBTSxHQUFHLENBQUgsRUFBeEI7QUFDQSxhQUFPLEVBQUMsR0FBRyxDQUFILEVBQU0sR0FBRyxDQUFILEVBQU0sR0FBRyxDQUFILEVBQXBCO0tBRkY7OztBQUxNLEdBQVI7QUFZQSxXQUFTO0FBQ1AsU0FBSyxLQUFMOztBQURPLEdBQVQ7QUFJQSxjQUFZLElBQVo7QUFDQSxjQUFZLElBQVo7QUFDQSxtQkFBaUIsRUFBQyxHQUFHLENBQUgsRUFBTSxHQUFHLENBQUgsRUFBTSxHQUFHLENBQUgsRUFBTSxHQUFHLENBQUgsRUFBcEM7QUFDQSxtQkFBaUIsQ0FBakI7Q0FwQkk7O0FBdUJOLElBQU0sbUJBQW1CLCtCQUFuQjs7OztJQUdlOzs7QUFFbkIsV0FGbUIsS0FFbkIsQ0FBWSxFQUFaLEVBQWdCLElBQWhCLEVBQXNCOzBCQUZILE9BRUc7O0FBQ3BCLDBCQUFPLEVBQVAsRUFBVyxnQkFBWCxFQURvQjs7QUFHcEIsV0FBTyxrQkFBTSxrQkFBTixFQUEwQixJQUExQixDQUFQLENBSG9COzt1RUFGSCxrQkFPWCxPQUxjOztBQU9wQixVQUFLLEVBQUwsR0FBVSxFQUFWLENBUG9CO0FBUXBCLFVBQUssTUFBTCxHQUFjLElBQWQsQ0FSb0I7O0dBQXRCOztlQUZtQjs7K0JBYVIsS0FBSztBQUNkLFVBQU0sVUFBVSxNQUFNLElBQUksT0FBSixHQUFj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QixFQURLO09BUlA7O0FBWUEsYUFBTyxJQUFQLENBZm9COzs7O1NBN1RIOzs7Ozs7QUFpVnJCLE1BQU0sWUFBTixHQUFxQixPQUFPLFlBQVA7QUFDckIsTUFBTSxnQkFBTixHQUF5QixPQUFPLGdCQUFQO0FBQ3pCLE1BQU0sV0FBTixHQUFvQixPQUFPLFdBQVAiLCJmaWxlIjoic2NlbmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBTY2VuZSBPYmplY3QgbWFuYWdlbWVudCBhbmQgcmVuZGVyaW5nXG4vKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cywgbm8tdHJ5LWNhdGNoICovXG5cbmltcG9ydCB7Q2FtZXJhfSBmcm9tICcuLi9jYW1lcmEnO1xuaW1wb3J0IEdyb3VwIGZyb20gJy4vZ3JvdXAnO1xuaW1wb3J0IHtwaWNrTW9kZWxzfSBmcm9tICcuL3BpY2snO1xuaW1wb3J0IHtQcm9ncmFtfSBmcm9tICcuLi93ZWJnbCc7XG5pbXBvcnQge1ZlYzN9IGZyb20gJy4uL21hdGgnO1xuaW1wb3J0IHttZXJnZX0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0ICogYXMgY29uZmlnIGZyb20gJy4uL2NvbmZpZyc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5jb25zdCBERUZBVUxUX1NDRU5FX09QVFMgPSB7XG4gIGxpZ2h0czoge1xuICAgIGVuYWJsZTogZmFsc2UsXG4gICAgLy8gYW1iaWVudCBsaWdodFxuICAgIGFtYmllbnQ6IHtyOiAwLjIsIGc6IDAuMiwgYjogMC4yfSxcbiAgICAvLyBkaXJlY3Rpb25hbCBsaWdodFxuICAgIGRpcmVjdGlvbmFsOiB7XG4gICAgICBkaXJlY3Rpb246IHt4OiAxLCB5OiAxLCB6OiAxfSxcbiAgICAgIGNvbG9yOiB7cjogMCwgZzogMCwgYjogMH1cbiAgICB9XG4gICAgLy8gcG9pbnQgbGlnaHRcbiAgICAvLyBwb2ludHM6IFtdXG4gIH0sXG4gIGVmZmVjdHM6IHtcbiAgICBmb2c6IGZhbHNlXG4gICAgLy8geyBuZWFyLCBmYXIsIGNvbG9yIH1cbiAgfSxcbiAgY2xlYXJDb2xvcjogdHJ1ZSxcbiAgY2xlYXJEZXB0aDogdHJ1ZSxcbiAgYmFja2dyb3VuZENvbG9yOiB7cjogMCwgZzogMCwgYjogMCwgYTogMX0sXG4gIGJhY2tncm91bmREZXB0aDogMVxufTtcblxuY29uc3QgSU5WQUxJRF9BUkdVTUVOVCA9ICdMdW1hR0wuU2NlbmUgaW52YWxpZCBhcmd1bWVudCc7XG5cbi8vIFNjZW5lIGNsYXNzXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTY2VuZSBleHRlbmRzIEdyb3VwIHtcblxuICBjb25zdHJ1Y3RvcihnbCwgb3B0cykge1xuICAgIGFzc2VydChnbCwgSU5WQUxJRF9BUkdVTUVOVCk7XG5cbiAgICBvcHRzID0gbWVyZ2UoREVGQVVMVF9TQ0VORV9PUFRTLCBvcHRzKTtcblxuICAgIHN1cGVyKG9wdHMpO1xuXG4gICAgdGhpcy5nbCA9IGdsO1xuICAgIHRoaXMuY29uZmlnID0gb3B0cztcbiAgfVxuXG4gIGdldFByb2dyYW0ob2JqKSB7XG4gICAgY29uc3QgcHJvZ3JhbSA9IG9iaiA/IG9iai5wcm9ncmFtIDogdGhpcy5wcm9ncmFtO1xuICAgIGFzc2VydChwcm9ncmFtIGluc3RhbmNlb2YgUHJvZ3JhbSwgJ1NjZW5lIGZhaWxlZCB0byBmaW5kIHZhbGlkIHByb2dyYW0nKTtcbiAgICBwcm9ncmFtLnVzZSgpO1xuICAgIHJldHVybiBwcm9ncmFtO1xuICB9XG5cbiAgZGVmaW5lQnVmZmVycyhvYmopIHtcbiAgICBjb25zdCBwcm9ncmFtID0gdGhpcy5nZXRQcm9ncmFtKG9iaik7XG4gICAgY29uc3QgcHJldkR5bmFtaWMgPSBvYmouZHluYW1pYztcbiAgICBvYmouZHluYW1pYyA9IHRydWU7XG4gICAgb2JqLnNldFByb2dyYW1TdGF0ZShwcm9ncmFtKTtcbiAgICBvYmouZHluYW1pYyA9IHByZXZEeW5hbWljO1xuICAgIG9iai51bnNldFByb2dyYW1TdGF0ZShwcm9ncmFtKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGNsZWFyKGdsKSB7XG4gICAgaWYgKHRoaXMuY29uZmlnLmNsZWFyQ29sb3IpIHtcbiAgICAgIGNvbnN0IGJnID0gdGhpcy5jb25maWcuYmFja2dyb3VuZENvbG9yO1xuICAgICAgZ2wuY2xlYXJDb2xvcihiZy5yLCBiZy5nLCBiZy5iLCBiZy5hKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuY29uZmlnLmNsZWFyRGVwdGgpIHtcbiAgICAgIGdsLmNsZWFyRGVwdGgodGhpcy5jb25maWcuYmFja2dyb3VuZERlcHRoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuY29uZmlnLmNsZWFyQ29sb3IgJiYgdGhpcy5jb25maWcuY2xlYXJEZXB0aCkge1xuICAgICAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVCB8IGdsLkRFUFRIX0JVRkZFUl9CSVQpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5jb25maWcuY2xlYXJDb2xvcikge1xuICAgICAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmNvbmZpZy5jbGVhckRlcHRoKSB7XG4gICAgICBnbC5jbGVhcihnbC5ERVBUSF9CVUZGRVJfQklUKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBSZW5kZXJzIGFsbCBvYmplY3RzIGluIHRoZSBzY2VuZS5cbiAgcmVuZGVyKGdsLCB7XG4gICAgY2FtZXJhLFxuICAgIG9uQmVmb3JlUmVuZGVyID0gbm9vcCxcbiAgICBvbkFmdGVyUmVuZGVyID0gbm9vcCxcbiAgICBjb250ZXh0ID0ge30sXG4gICAgLi4ub3B0c1xuICB9ID0ge30pIHtcbiAgICBhc3NlcnQoY2FtZXJhIGluc3RhbmNlb2YgQ2FtZXJhKTtcblxuICAgIHRoaXMuY2xlYXIoZ2wpO1xuXG4gICAgLy8gR28gdGhyb3VnaCBlYWNoIG1vZGVsIGFuZCByZW5kZXIgaXQuXG4gICAgZm9yIChjb25zdCBtb2RlbCBvZiB0aGlzLnRyYXZlcnNlKHt2aWV3TWF0cml4OiBjYW1lcmEudmlld30pKSB7XG4gICAgICBpZiAobW9kZWwuZGlzcGxheSkge1xuICAgICAgICBvbkJlZm9yZVJlbmRlcihtb2RlbCwgY29udGV4dCk7XG4gICAgICAgIHRoaXMucmVuZGVyT2JqZWN0KGdsLCBtb2RlbCk7XG4gICAgICAgIG9uQWZ0ZXJSZW5kZXIobW9kZWwsIGNvbnRleHQpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHJlbmRlck9iamVjdChnbCwgbW9kZWwsIGNhbWVyYSwgY29udGV4dCA9IHt9KSB7XG4gICAgbW9kZWwuc2V0UHJvZ3JhbVN0YXRlKCk7XG4gICAgbW9kZWwub25CZWZvcmVSZW5kZXIoY2FtZXJhLCBjb250ZXh0KTtcblxuICAgIGNvbnN0IHByb2dyYW0gPSB0aGlzLmdldFByb2dyYW0obW9kZWwpO1xuXG4gICAgLy8gU2V0dXAgbGlnaHRpbmcgYW5kIHNjZW5lIGVmZmVjdHMgbGlrZSBmb2csIGV0Yy5cbiAgICB0aGlzLnNldHVwTGlnaHRpbmcocHJvZ3JhbSk7XG4gICAgdGhpcy5zZXR1cEVmZmVjdHMocHJvZ3JhbSk7XG5cbiAgICAvLyBDYW1lcmEgZXhwb3NlcyB1bmlmb3JtcyB0aGF0IGNhbiBiZSB1c2VkIGRpcmVjdGx5IGluIHNoYWRlcnNcbiAgICBpZiAoY2FtZXJhKSB7XG4gICAgICBwcm9ncmFtLnNldFVuaWZvcm1zKGNhbWVyYS5nZXRVbmlmb3JtcygpKTtcbiAgICB9XG5cbiAgICAvLyBOb3cgc2V0IHZpZXcgYW5kIG5vcm1hbCBtYXRyaWNlc1xuICAgIC8vIGNvbnN0IGNvb3JkaW5hdGVVbmlmb3JtcyA9IG1vZGVsLmdldENvb3JkaW5hdGVVbmlmb3JtcyhjYW1lcmEudmlldyk7XG4gICAgLy8gcHJvZ3JhbS5zZXRVbmlmb3Jtcyhjb29yZGluYXRlVW5pZm9ybXMpO1xuXG4gICAgLy8gRHJhd1xuICAgIG1vZGVsLnJlbmRlcihnbCwge3ZpZXdNYXRyaXg6IGNhbWVyYS52aWV3fSk7XG5cbiAgICBtb2RlbC5vbkFmdGVyUmVuZGVyKGNhbWVyYSwgY29udGV4dCk7XG4gICAgbW9kZWwudW5zZXRQcm9ncmFtU3RhdGUoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIFRPRE8gLSB0aGlzIGlzIHRoZSBuZXcgcGlja2luZyBmb3IgZGVjay5nbFxuICBwaWNrTW9kZWxzKGdsLCB7Y2FtZXJhLCB4LCB5LCAuLi5vcHRzfSkge1xuICAgIGNvbnN0IHt2aWV3OiB2aWV3TWF0cml4fSA9IGNhbWVyYTtcbiAgICByZXR1cm4gcGlja01vZGVscyhnbCwge2dyb3VwOiB0aGlzLCB2aWV3TWF0cml4LCB4LCB5LCAuLi5vcHRzfSk7XG4gIH1cblxuICAvKlxuICBwaWNrKHgsIHksIG9wdCA9IHt9KSB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLmdsO1xuXG4gICAgaWYgKHRoaXMucGlja2luZ0ZCTyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnBpY2tpbmdGQk8gPSBuZXcgRnJhbWVidWZmZXIoZ2wsIHtcbiAgICAgICAgd2lkdGg6IGdsLmNhbnZhcy53aWR0aCxcbiAgICAgICAgaGVpZ2h0OiBnbC5jYW52YXMuaGVpZ2h0XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5waWNraW5nUHJvZ3JhbSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnBpY2tpbmdQcm9ncmFtID1cbiAgICAgICAgb3B0LnBpY2tpbmdQcm9ncmFtIHx8IG1ha2VQcm9ncmFtRnJvbURlZmF1bHRTaGFkZXJzKGdsKTtcbiAgICB9XG5cbiAgICBsZXQgcGlja2luZ1Byb2dyYW0gPSB0aGlzLnBpY2tpbmdQcm9ncmFtO1xuXG4gICAgcGlja2luZ1Byb2dyYW0udXNlKCk7XG4gICAgcGlja2luZ1Byb2dyYW0uc2V0VW5pZm9ybSgnZW5hYmxlUGlja2luZycsIHRydWUpO1xuICAgIHBpY2tpbmdQcm9ncmFtLnNldFVuaWZvcm0oJ2hhc1BpY2tpbmdDb2xvcnMnLCBmYWxzZSk7XG5cbiAgICB0aGlzLnBpY2tpbmdGQk8uYmluZCgpO1xuXG4gICAgbGV0IGhhc2ggPSB7fTtcblxuICAgIGdsLmVuYWJsZShnbC5TQ0lTU09SX1RFU1QpO1xuICAgIGdsLnNjaXNzb3IoeCwgZ2wuY2FudmFzLmhlaWdodCAtIHksIDEsIDEpO1xuXG4gICAgY29uc3Qgb2xkQ2xlYXJDb2xvciA9IHRoaXMuY2xlYXJDb2xvcjtcbiAgICBjb25zdCBvbGRCYWNrZ3JvdW5kQ29sb3IgPSB0aGlzLmJhY2tncm91bmRDb2xvcjtcbiAgICB0aGlzLmNsZWFyQ29sb3IgPSB0cnVlO1xuICAgIHRoaXMuYmFja2dyb3VuZENvbG9yID0ge3I6IDAsIGc6IDAsIGI6IDAsIGE6IDB9O1xuXG4gICAgdGhpcy5yZW5kZXIoe1xuICAgICAgcmVuZGVyUHJvZ3JhbTogcGlja2luZ1Byb2dyYW0sXG4gICAgICBvbkJlZm9yZVJlbmRlcjogZnVuY3Rpb24oZWxlbSwgaSkge1xuICAgICAgICBpKys7XG4gICAgICAgIGxldCByID0gaSAlIDI1NjtcbiAgICAgICAgbGV0IGcgPSAoKGkgLyAyNTYpID4+IDApICUgMjU2O1xuICAgICAgICBsZXQgYiA9ICgoaSAvICgyNTYgKiAyNTYpKSA+PiAwKSAlIDI1NjtcbiAgICAgICAgaGFzaFtbciwgZywgYl1dID0gZWxlbTtcbiAgICAgICAgcGlja2luZ1Byb2dyYW0uc2V0VW5pZm9ybSgncGlja0NvbG9yJywgW3IgLyAyNTUsIGcgLyAyNTUsIGIgLyAyNTVdKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGdsLmRpc2FibGUoZ2wuU0NJU1NPUl9URVNUKTtcblxuICAgIGNvbnN0IHBpeGVsID0gbmV3IFVpbnQ4QXJyYXkoNCk7XG5cbiAgICBnbC5yZWFkUGl4ZWxzKFxuICAgICAgeCwgZ2wuY2FudmFzLmhlaWdodCAtIHksIDEsIDEsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIHBpeGVsXG4gICAgKTtcblxuICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgbnVsbCk7XG4gICAgdGhpcy5jbGVhckNvbG9yID0gb2xkQ2xlYXJDb2xvcjtcbiAgICB0aGlzLmJhY2tncm91bmRDb2xvciA9IG9sZEJhY2tncm91bmRDb2xvcjtcblxuICAgIGxldCByID0gcGl4ZWxbMF07XG4gICAgbGV0IGcgPSBwaXhlbFsxXTtcbiAgICBsZXQgYiA9IHBpeGVsWzJdO1xuXG4gICAgcmV0dXJuIGhhc2hbW3IsIGcsIGJdXTtcbiAgfVxuXG4gIHBpY2tDdXN0b20oeCwgeSwgb3B0ID0ge30pIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuZ2w7XG5cbiAgICBpZiAodGhpcy5waWNraW5nRkJPID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMucGlja2luZ0ZCTyA9IG5ldyBGcmFtZWJ1ZmZlcihnbCwge1xuICAgICAgICB3aWR0aDogZ2wuY2FudmFzLndpZHRoLFxuICAgICAgICBoZWlnaHQ6IGdsLmNhbnZhcy5oZWlnaHRcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnBpY2tpbmdQcm9ncmFtID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMucGlja2luZ1Byb2dyYW0gPVxuICAgICAgICBvcHQucGlja2luZ1Byb2dyYW0gfHwgbWFrZVByb2dyYW1Gcm9tRGVmYXVsdFNoYWRlcnMoZ2wpO1xuICAgIH1cblxuICAgIGxldCBwaWNraW5nUHJvZ3JhbSA9IHRoaXMucGlja2luZ1Byb2dyYW07XG5cbiAgICBwaWNraW5nUHJvZ3JhbS51c2UoKTtcbiAgICBwaWNraW5nUHJvZ3JhbS5zZXRVbmlmb3JtKCdlbmFibGVQaWNraW5nJywgdHJ1ZSk7XG4gICAgcGlja2luZ1Byb2dyYW0uc2V0VW5pZm9ybSgnaGFzUGlja2luZ0NvbG9ycycsIHRydWUpO1xuXG4gICAgdGhpcy5waWNraW5nRkJPLmJpbmQoKTtcblxuICAgIGdsLmVuYWJsZShnbC5TQ0lTU09SX1RFU1QpO1xuICAgIGdsLnNjaXNzb3IoeCwgZ2wuY2FudmFzLmhlaWdodCAtIHksIDEsIDEpO1xuXG4gICAgY29uc3Qgb2xkQ2xlYXJDb2xvciA9IHRoaXMuY2xlYXJDb2xvcjtcbiAgICBjb25zdCBvbGRCYWNrZ3JvdW5kQ29sb3IgPSB0aGlzLmJhY2tncm91bmRDb2xvcjtcbiAgICB0aGlzLmNsZWFyQ29sb3IgPSB0cnVlO1xuICAgIHRoaXMuYmFja2dyb3VuZENvbG9yID0ge3I6IDI1NSwgZzogMCwgYjogMCwgYTogMjU1fTtcblxuICAgIHRoaXMucmVuZGVyKHtcbiAgICAgIHJlbmRlclByb2dyYW06IHBpY2tpbmdQcm9ncmFtXG4gICAgfSk7XG5cbiAgICBnbC5kaXNhYmxlKGdsLlNDSVNTT1JfVEVTVCk7XG5cbiAgICBjb25zdCBwaXhlbCA9IG5ldyBVaW50OEFycmF5KDQpO1xuXG4gICAgZ2wucmVhZFBpeGVscyhcbiAgICAgIHgsIGdsLmNhbnZhcy5oZWlnaHQgLSB5LCAxLCAxLCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCBwaXhlbFxuICAgICk7XG5cbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xuICAgIHRoaXMuY2xlYXJDb2xvciA9IG9sZENsZWFyQ29sb3I7XG4gICAgdGhpcy5iYWNrZ3JvdW5kQ29sb3IgPSBvbGRCYWNrZ3JvdW5kQ29sb3I7XG5cbiAgICBsZXQgciA9IHBpeGVsWzBdO1xuICAgIGxldCBnID0gcGl4ZWxbMV07XG4gICAgbGV0IGIgPSBwaXhlbFsyXTtcbiAgICBsZXQgYSA9IHBpeGVsWzNdO1xuXG4gICAgcmV0dXJuIFtyLCBnLCBiLCBhXTtcbiAgfVxuICAqL1xuXG4gIC8vIFNldHVwIHRoZSBsaWdodGluZyBzeXN0ZW06IGFtYmllbnQsIGRpcmVjdGlvbmFsLCBwb2ludCBsaWdodHMuXG4gIHNldHVwTGlnaHRpbmcocHJvZ3JhbSkge1xuICAgIC8vIFNldHVwIExpZ2h0aW5nXG4gICAgbGV0IHtlbmFibGUsIGFtYmllbnQsIGRpcmVjdGlvbmFsLCBwb2ludHN9ID0gdGhpcy5jb25maWcubGlnaHRzO1xuXG4gICAgLy8gU2V0IGxpZ2h0IHVuaWZvcm1zLiBBbWJpZW50IGFuZCBkaXJlY3Rpb25hbCBsaWdodHMuXG4gICAgcHJvZ3JhbS5zZXRVbmlmb3JtKCdlbmFibGVMaWdodHMnLCBlbmFibGUpO1xuXG4gICAgaWYgKCFlbmFibGUpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGlmIChhbWJpZW50KSB7XG4gICAgICB0aGlzLnNldHVwQW1iaWVudExpZ2h0aW5nKHByb2dyYW0sIGFtYmllbnQpO1xuICAgIH1cblxuICAgIGlmIChkaXJlY3Rpb25hbCkge1xuICAgICAgdGhpcy5zZXR1cERpcmVjdGlvbmFsTGlnaHRpbmcocHJvZ3JhbSwgZGlyZWN0aW9uYWwpO1xuICAgIH1cblxuICAgIC8vIFNldCBwb2ludCBsaWdodHNcbiAgICBpZiAocG9pbnRzKSB7XG4gICAgICB0aGlzLnNldHVwUG9pbnRMaWdodGluZyhwcm9ncmFtLCBwb2ludHMpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0dXBBbWJpZW50TGlnaHRpbmcocHJvZ3JhbSwgYW1iaWVudCkge1xuICAgIHByb2dyYW0uc2V0VW5pZm9ybXMoe1xuICAgICAgJ2FtYmllbnRDb2xvcic6IFthbWJpZW50LnIsIGFtYmllbnQuZywgYW1iaWVudC5iXVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXR1cERpcmVjdGlvbmFsTGlnaHRpbmcocHJvZ3JhbSwgZGlyZWN0aW9uYWwpIHtcbiAgICBsZXQge2NvbG9yLCBkaXJlY3Rpb259ID0gZGlyZWN0aW9uYWw7XG5cbiAgICAvLyBOb3JtYWxpemUgbGlnaHRpbmcgZGlyZWN0aW9uIHZlY3RvclxuICAgIGNvbnN0IGRpciA9IG5ldyBWZWMzKGRpcmVjdGlvbi54LCBkaXJlY3Rpb24ueSwgZGlyZWN0aW9uLnopXG4gICAgICAuJHVuaXQoKVxuICAgICAgLiRzY2FsZSgtMSk7XG5cbiAgICBwcm9ncmFtLnNldFVuaWZvcm1zKHtcbiAgICAgICdkaXJlY3Rpb25hbENvbG9yJzogW2NvbG9yLnIsIGNvbG9yLmcsIGNvbG9yLmJdLFxuICAgICAgJ2xpZ2h0aW5nRGlyZWN0aW9uJzogW2Rpci54LCBkaXIueSwgZGlyLnpdXG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldHVwUG9pbnRMaWdodGluZyhwcm9ncmFtLCBwb2ludHMpIHtcbiAgICBwb2ludHMgPSBwb2ludHMgaW5zdGFuY2VvZiBBcnJheSA/IHBvaW50cyA6IFtwb2ludHNdO1xuICAgIGNvbnN0IG51bWJlclBvaW50cyA9IHBvaW50cy5sZW5ndGg7XG4gICAgcHJvZ3JhbS5zZXRVbmlmb3JtKCdudW1iZXJQb2ludHMnLCBudW1iZXJQb2ludHMpO1xuXG4gICAgY29uc3QgcG9pbnRMb2NhdGlvbnMgPSBbXTtcbiAgICBjb25zdCBwb2ludENvbG9ycyA9IFtdO1xuICAgIGNvbnN0IGVuYWJsZVNwZWN1bGFyID0gW107XG4gICAgY29uc3QgcG9pbnRTcGVjdWxhckNvbG9ycyA9IFtdO1xuICAgIGZvciAoY29uc3QgcG9pbnQgb2YgcG9pbnRzKSB7XG4gICAgICBjb25zdCB7cG9zaXRpb24sIGNvbG9yLCBkaWZmdXNlLCBzcGVjdWxhcn0gPSBwb2ludDtcbiAgICAgIGNvbnN0IHBvaW50Q29sb3IgPSBjb2xvciB8fCBkaWZmdXNlO1xuXG4gICAgICBwb2ludExvY2F0aW9ucy5wdXNoKHBvc2l0aW9uLngsIHBvc2l0aW9uLnksIHBvc2l0aW9uLnopO1xuICAgICAgcG9pbnRDb2xvcnMucHVzaChwb2ludENvbG9yLnIsIHBvaW50Q29sb3IuZywgcG9pbnRDb2xvci5iKTtcblxuICAgICAgLy8gQWRkIHNwZWN1bGFyIGNvbG9yXG4gICAgICBlbmFibGVTcGVjdWxhci5wdXNoKE51bWJlcihCb29sZWFuKHNwZWN1bGFyKSkpO1xuICAgICAgaWYgKHNwZWN1bGFyKSB7XG4gICAgICAgIHBvaW50U3BlY3VsYXJDb2xvcnMucHVzaChzcGVjdWxhci5yLCBzcGVjdWxhci5nLCBzcGVjdWxhci5iKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBvaW50U3BlY3VsYXJDb2xvcnMucHVzaCgwLCAwLCAwKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9pbnRMb2NhdGlvbnMubGVuZ3RoKSB7XG4gICAgICBwcm9ncmFtLnNldFVuaWZvcm1zKHtcbiAgICAgICAgJ3BvaW50TG9jYXRpb24nOiBwb2ludExvY2F0aW9ucyxcbiAgICAgICAgJ3BvaW50Q29sb3InOiBwb2ludENvbG9yc1xuICAgICAgfSk7XG4gICAgICBwcm9ncmFtLnNldFVuaWZvcm1zKHtcbiAgICAgICAgJ2VuYWJsZVNwZWN1bGFyJzogZW5hYmxlU3BlY3VsYXIsXG4gICAgICAgICdwb2ludFNwZWN1bGFyQ29sb3InOiBwb2ludFNwZWN1bGFyQ29sb3JzXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIFNldHVwIGVmZmVjdHMgbGlrZSBmb2csIGV0Yy5cbiAgc2V0dXBFZmZlY3RzKHByb2dyYW0pIHtcbiAgICBjb25zdCB7Zm9nfSA9IHRoaXMuY29uZmlnLmVmZmVjdHM7XG5cbiAgICBpZiAoZm9nKSB7XG4gICAgICBjb25zdCB7Y29sb3IgPSB7cjogMC41LCBnOiAwLjUsIGI6IDAuNX19ID0gZm9nO1xuICAgICAgcHJvZ3JhbS5zZXRVbmlmb3Jtcyh7XG4gICAgICAgICdoYXNGb2cnOiB0cnVlLFxuICAgICAgICAnZm9nTmVhcic6IGZvZy5uZWFyLFxuICAgICAgICAnZm9nRmFyJzogZm9nLmZhcixcbiAgICAgICAgJ2ZvZ0NvbG9yJzogW2NvbG9yLnIsIGNvbG9yLmcsIGNvbG9yLmJdXG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJvZ3JhbS5zZXRVbmlmb3JtKCdoYXNGb2cnLCBmYWxzZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxufVxuXG5TY2VuZS5NQVhfVEVYVFVSRVMgPSBjb25maWcuTUFYX1RFWFRVUkVTO1xuU2NlbmUuTUFYX1BPSU5UX0xJR0hUUyA9IGNvbmZpZy5NQVhfUE9JTlRfTElHSFRTO1xuU2NlbmUuUElDS0lOR19SRVMgPSBjb25maWcuUElDS0lOR19SRVM7XG4iXX0=