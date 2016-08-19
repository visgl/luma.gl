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

var INVALID_ARGUMENT = 'LumaGL.Scene invalid argument';

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
    _this.needsRedraw = false;
    Object.seal(_this);
    return _this;
  }

  _createClass(Scene, [{
    key: 'setNeedsRedraw',
    value: function setNeedsRedraw() {
      var redraw = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

      this.needsRedraw = redraw;
      return this;
    }
  }, {
    key: 'getNeedsRedraw',
    value: function getNeedsRedraw() {
      var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var _ref$clearRedrawFlags = _ref.clearRedrawFlags;
      var clearRedrawFlags = _ref$clearRedrawFlags === undefined ? false : _ref$clearRedrawFlags;

      var redraw = false;
      redraw = redraw || this.needsRedraw;
      this.needsRedraw = this.needsRedraw && !clearRedrawFlags;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.traverse()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var model = _step.value;

          redraw = redraw || model.getNeedsRedraw({ clearRedrawFlags: clearRedrawFlags });
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

      return redraw;
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
    value: function render() {
      var _ref2 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var camera = _ref2.camera;
      var _ref2$onBeforeRender = _ref2.onBeforeRender;
      var onBeforeRender = _ref2$onBeforeRender === undefined ? noop : _ref2$onBeforeRender;
      var _ref2$onAfterRender = _ref2.onAfterRender;
      var onAfterRender = _ref2$onAfterRender === undefined ? noop : _ref2$onAfterRender;
      var _ref2$context = _ref2.context;
      var context = _ref2$context === undefined ? {} : _ref2$context;

      var opts = _objectWithoutProperties(_ref2, ['camera', 'onBeforeRender', 'onAfterRender', 'context']);

      (0, _assert2.default)(camera instanceof _camera.Camera, 'Invalid Camera in Scene.render');

      var gl = this.gl;

      this.clear(gl);

      // Go through each model and render it.
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = this.traverse({ viewMatrix: camera.view })[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var model = _step2.value;

          if (model.display) {
            onBeforeRender(model, context);
            this.renderObject({ model: model, camera: camera, context: context });
            onAfterRender(model, context);
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

      return this;
    }
  }, {
    key: 'renderObject',
    value: function renderObject(_ref3) {
      var model = _ref3.model;
      var camera = _ref3.camera;
      var _ref3$context = _ref3.context;
      var context = _ref3$context === undefined ? {} : _ref3$context;

      (0, _assert2.default)(camera instanceof _camera.Camera, 'Invalid Camera in Scene.renderObject');

      // Setup lighting and scene effects like fog, etc.
      var program = model.program;

      this.setupLighting(program);
      this.setupEffects(program);

      // Draw
      model.onBeforeRender(camera, context);
      model.render({ camera: camera, viewMatrix: camera.view });
      model.onAfterRender(camera, context);
      return this;
    }

    // TODO - this is the new picking for deck.gl

  }, {
    key: 'pickModels',
    value: function pickModels(gl, _ref4) {
      var camera = _ref4.camera;
      var x = _ref4.x;
      var y = _ref4.y;

      var opts = _objectWithoutProperties(_ref4, ['camera', 'x', 'y']);

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
      pickingProgram.setUniforms({
        enablePicking: true,
        hasPickingColors: false
      });
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
          pickingProgram.setUniforms({pickColor: [r / 255, g / 255, b / 255]});
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
      pickingProgram.setUniforms({
        enablePicking: true,
        hasPickingColors: true
      });
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

      program.setUniforms({ enableLights: enable });

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
      program.setUniforms({ numberPoints: numberPoints });

      var pointLocations = [];
      var pointColors = [];
      var enableSpecular = [];
      var pointSpecularColors = [];
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = points[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var point = _step3.value;
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
        program.setUniforms({ hasFog: false });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2VuZWdyYXBoL3NjZW5lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFHQTs7QUFDQTs7OztBQUNBOztBQUNBOztBQUNBOztBQUNBOztJQUFZLE07O0FBQ1o7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUEsSUFBTSxtQkFBbUIsK0JBQXpCOztBQUVBLFNBQVMsSUFBVCxHQUFnQixDQUFFOztBQUVsQixJQUFNLHFCQUFxQjtBQUN6QixVQUFRO0FBQ04sWUFBUSxLQURGOztBQUdOLGFBQVMsRUFBQyxHQUFHLEdBQUosRUFBUyxHQUFHLEdBQVosRUFBaUIsR0FBRyxHQUFwQixFQUhIOztBQUtOLGlCQUFhO0FBQ1gsaUJBQVcsRUFBQyxHQUFHLENBQUosRUFBTyxHQUFHLENBQVYsRUFBYSxHQUFHLENBQWhCLEVBREE7QUFFWCxhQUFPLEVBQUMsR0FBRyxDQUFKLEVBQU8sR0FBRyxDQUFWLEVBQWEsR0FBRyxDQUFoQjtBQUZJOzs7QUFMUCxHQURpQjtBQWF6QixXQUFTO0FBQ1AsU0FBSzs7QUFERSxHQWJnQjtBQWlCekIsY0FBWSxJQWpCYTtBQWtCekIsY0FBWSxJQWxCYTtBQW1CekIsbUJBQWlCLEVBQUMsR0FBRyxDQUFKLEVBQU8sR0FBRyxDQUFWLEVBQWEsR0FBRyxDQUFoQixFQUFtQixHQUFHLENBQXRCLEVBbkJRO0FBb0J6QixtQkFBaUI7QUFwQlEsQ0FBM0I7Ozs7SUF3QnFCLEs7OztBQUVuQixpQkFBWSxFQUFaLEVBQWdCLElBQWhCLEVBQXNCO0FBQUE7O0FBQ3BCLDBCQUFPLEVBQVAsRUFBVyxnQkFBWDs7QUFFQSxXQUFPLGtCQUFNLGtCQUFOLEVBQTBCLElBQTFCLENBQVA7O0FBSG9CLHlGQUtkLElBTGM7O0FBT3BCLFVBQUssRUFBTCxHQUFVLEVBQVY7QUFDQSxVQUFLLE1BQUwsR0FBYyxJQUFkO0FBQ0EsVUFBSyxXQUFMLEdBQW1CLEtBQW5CO0FBQ0EsV0FBTyxJQUFQO0FBVm9CO0FBV3JCOzs7O3FDQUU2QjtB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RCxhQUFPLElBQVA7QUFDRDs7Ozs7O2lDQUdZLE8sRUFBUztBQUFBLFVBQ2IsR0FEYSxHQUNOLEtBQUssTUFBTCxDQUFZLE9BRE4sQ0FDYixHQURhOzs7QUFHcEIsVUFBSSxHQUFKLEVBQVM7QUFBQSx5QkFDb0MsR0FEcEMsQ0FDQSxLQURBO0FBQUEsWUFDQSxLQURBLDhCQUNRLEVBQUMsR0FBRyxHQUFKLEVBQVMsR0FBRyxHQUFaLEVBQWlCLEdBQUcsR0FBcEIsRUFEUjs7QUFFUCxnQkFBUSxXQUFSLENBQW9CO0FBQ2xCLG9CQUFVLElBRFE7QUFFbEIscUJBQVcsSUFBSSxJQUZHO0FBR2xCLG9CQUFVLElBQUksR0FISTtBQUlsQixzQkFBWSxDQUFDLE1BQU0sQ0FBUCxFQUFVLE1BQU0sQ0FBaEIsRUFBbUIsTUFBTSxDQUF6QjtBQUpNLFNBQXBCO0FBTUQsT0FSRCxNQVFPO0FBQ0wsZ0JBQVEsV0FBUixDQUFvQixFQUFDLFFBQVEsS0FBVCxFQUFwQjtBQUNEOztBQUVELGFBQU8sSUFBUDtBQUNEOzs7Ozs7a0JBNVVrQixLOzs7QUFnVnJCLE1BQU0sWUFBTixHQUFxQixPQUFPLFlBQTVCO0FBQ0EsTUFBTSxnQkFBTixHQUF5QixPQUFPLGdCQUFoQztBQUNBLE1BQU0sV0FBTixHQUFvQixPQUFPLFdBQTNCIiwiZmlsZSI6InNjZW5lLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gU2NlbmUgT2JqZWN0IG1hbmFnZW1lbnQgYW5kIHJlbmRlcmluZ1xuLyogZXNsaW50LWRpc2FibGUgbWF4LXN0YXRlbWVudHMsIG5vLXRyeS1jYXRjaCAqL1xuXG5pbXBvcnQge0NhbWVyYX0gZnJvbSAnLi4vY2FtZXJhJztcbmltcG9ydCBHcm91cCBmcm9tICcuL2dyb3VwJztcbmltcG9ydCB7cGlja01vZGVsc30gZnJvbSAnLi9waWNrJztcbmltcG9ydCB7TWF0NCwgVmVjM30gZnJvbSAnLi4vbWF0aCc7XG5pbXBvcnQge21lcmdlfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgKiBhcyBjb25maWcgZnJvbSAnLi4vY29uZmlnJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuY29uc3QgSU5WQUxJRF9BUkdVTUVOVCA9ICdMdW1hR0wuU2NlbmUgaW52YWxpZCBhcmd1bWVudCc7XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5jb25zdCBERUZBVUxUX1NDRU5FX09QVFMgPSB7XG4gIGxpZ2h0czoge1xuICAgIGVuYWJsZTogZmFsc2UsXG4gICAgLy8gYW1iaWVudCBsaWdodFxuICAgIGFtYmllbnQ6IHtyOiAwLjIsIGc6IDAuMiwgYjogMC4yfSxcbiAgICAvLyBkaXJlY3Rpb25hbCBsaWdodFxuICAgIGRpcmVjdGlvbmFsOiB7XG4gICAgICBkaXJlY3Rpb246IHt4OiAxLCB5OiAxLCB6OiAxfSxcbiAgICAgIGNvbG9yOiB7cjogMCwgZzogMCwgYjogMH1cbiAgICB9XG4gICAgLy8gcG9pbnQgbGlnaHRcbiAgICAvLyBwb2ludHM6IFtdXG4gIH0sXG4gIGVmZmVjdHM6IHtcbiAgICBmb2c6IGZhbHNlXG4gICAgLy8geyBuZWFyLCBmYXIsIGNvbG9yIH1cbiAgfSxcbiAgY2xlYXJDb2xvcjogdHJ1ZSxcbiAgY2xlYXJEZXB0aDogdHJ1ZSxcbiAgYmFja2dyb3VuZENvbG9yOiB7cjogMCwgZzogMCwgYjogMCwgYTogMX0sXG4gIGJhY2tncm91bmREZXB0aDogMVxufTtcblxuLy8gU2NlbmUgY2xhc3NcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNjZW5lIGV4dGVuZHMgR3JvdXAge1xuXG4gIGNvbnN0cnVjdG9yKGdsLCBvcHRzKSB7XG4gICAgYXNzZXJ0KGdsLCBJTlZBTElEX0FSR1VNRU5UKTtcblxuICAgIG9wdHMgPSBtZXJnZShERUZBVUxUX1NDRU5FX09QVFMsIG9wdHMpO1xuXG4gICAgc3VwZXIob3B0cyk7XG5cbiAgICB0aGlzLmdsID0gZ2w7XG4gICAgdGhpcy5jb25maWcgPSBvcHRzO1xuICAgIHRoaXMubmVlZHNSZWRyYXcgPSBmYWxzZTtcbiAgICBPYmplY3Quc2VhbCh0aGlzKTtcbiAgfVxuXG4gIHNldE5lZWRzUmVkcmF3KHJlZHJhdyA9IHRydWUpIHtcbiAgICB0aGlzLm5lZWRzUmVkcmF3ID0gcmVkcmF3O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZ2V0TmVlZHNSZWRyYXcoe2NsZWFyUmVkcmF3RmxhZ3MgPSBmYWxzZX0gPSB7fSkge1xuICAgIGxldCByZWRyYXcgPSBmYWxzZTtcbiAgICByZWRyYXcgPSByZWRyYXcgfHwgdGhpcy5uZWVkc1JlZHJhdztcbiAgICB0aGlzLm5lZWRzUmVkcmF3ID0gdGhpcy5uZWVkc1JlZHJhdyAmJiAhY2xlYXJSZWRyYXdGbGFncztcbiAgICBmb3IgKGNvbnN0IG1vZGVsIG9mIHRoaXMudHJhdmVyc2UoKSkge1xuICAgICAgcmVkcmF3ID0gcmVkcmF3IHx8IG1vZGVsLmdldE5lZWRzUmVkcmF3KHtjbGVhclJlZHJhd0ZsYWdzfSk7XG4gICAgfVxuICAgIHJldHVybiByZWRyYXc7XG4gIH1cblxuICBjbGVhcihnbCkge1xuICAgIGlmICh0aGlzLmNvbmZpZy5jbGVhckNvbG9yKSB7XG4gICAgICBjb25zdCBiZyA9IHRoaXMuY29uZmlnLmJhY2tncm91bmRDb2xvcjtcbiAgICAgIGdsLmNsZWFyQ29sb3IoYmcuciwgYmcuZywgYmcuYiwgYmcuYSk7XG4gICAgfVxuICAgIGlmICh0aGlzLmNvbmZpZy5jbGVhckRlcHRoKSB7XG4gICAgICBnbC5jbGVhckRlcHRoKHRoaXMuY29uZmlnLmJhY2tncm91bmREZXB0aCk7XG4gICAgfVxuICAgIGlmICh0aGlzLmNvbmZpZy5jbGVhckNvbG9yICYmIHRoaXMuY29uZmlnLmNsZWFyRGVwdGgpIHtcbiAgICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQgfCBnbC5ERVBUSF9CVUZGRVJfQklUKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuY29uZmlnLmNsZWFyQ29sb3IpIHtcbiAgICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5jb25maWcuY2xlYXJEZXB0aCkge1xuICAgICAgZ2wuY2xlYXIoZ2wuREVQVEhfQlVGRkVSX0JJVCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gUmVuZGVycyBhbGwgb2JqZWN0cyBpbiB0aGUgc2NlbmUuXG4gIHJlbmRlcih7XG4gICAgY2FtZXJhLFxuICAgIG9uQmVmb3JlUmVuZGVyID0gbm9vcCxcbiAgICBvbkFmdGVyUmVuZGVyID0gbm9vcCxcbiAgICBjb250ZXh0ID0ge30sXG4gICAgLi4ub3B0c1xuICB9ID0ge30pIHtcbiAgICBhc3NlcnQoY2FtZXJhIGluc3RhbmNlb2YgQ2FtZXJhLCAnSW52YWxpZCBDYW1lcmEgaW4gU2NlbmUucmVuZGVyJyk7XG5cbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICB0aGlzLmNsZWFyKGdsKTtcblxuICAgIC8vIEdvIHRocm91Z2ggZWFjaCBtb2RlbCBhbmQgcmVuZGVyIGl0LlxuICAgIGZvciAoY29uc3QgbW9kZWwgb2YgdGhpcy50cmF2ZXJzZSh7dmlld01hdHJpeDogY2FtZXJhLnZpZXd9KSkge1xuICAgICAgaWYgKG1vZGVsLmRpc3BsYXkpIHtcbiAgICAgICAgb25CZWZvcmVSZW5kZXIobW9kZWwsIGNvbnRleHQpO1xuICAgICAgICB0aGlzLnJlbmRlck9iamVjdCh7bW9kZWwsIGNhbWVyYSwgY29udGV4dH0pO1xuICAgICAgICBvbkFmdGVyUmVuZGVyKG1vZGVsLCBjb250ZXh0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByZW5kZXJPYmplY3Qoe21vZGVsLCBjYW1lcmEsIGNvbnRleHQgPSB7fX0pIHtcbiAgICBhc3NlcnQoY2FtZXJhIGluc3RhbmNlb2YgQ2FtZXJhLCAnSW52YWxpZCBDYW1lcmEgaW4gU2NlbmUucmVuZGVyT2JqZWN0Jyk7XG5cbiAgICAvLyBTZXR1cCBsaWdodGluZyBhbmQgc2NlbmUgZWZmZWN0cyBsaWtlIGZvZywgZXRjLlxuICAgIGNvbnN0IHtwcm9ncmFtfSA9IG1vZGVsO1xuICAgIHRoaXMuc2V0dXBMaWdodGluZyhwcm9ncmFtKTtcbiAgICB0aGlzLnNldHVwRWZmZWN0cyhwcm9ncmFtKTtcblxuICAgIC8vIERyYXdcbiAgICBtb2RlbC5vbkJlZm9yZVJlbmRlcihjYW1lcmEsIGNvbnRleHQpO1xuICAgIG1vZGVsLnJlbmRlcih7Y2FtZXJhLCB2aWV3TWF0cml4OiBjYW1lcmEudmlld30pO1xuICAgIG1vZGVsLm9uQWZ0ZXJSZW5kZXIoY2FtZXJhLCBjb250ZXh0KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIFRPRE8gLSB0aGlzIGlzIHRoZSBuZXcgcGlja2luZyBmb3IgZGVjay5nbFxuICBwaWNrTW9kZWxzKGdsLCB7Y2FtZXJhLCB4LCB5LCAuLi5vcHRzfSkge1xuICAgIGNvbnN0IHt2aWV3OiB2aWV3TWF0cml4fSA9IGNhbWVyYTtcbiAgICByZXR1cm4gcGlja01vZGVscyhnbCwge1xuICAgICAgZ3JvdXA6IHRoaXMsXG4gICAgICBjYW1lcmEsXG4gICAgICB2aWV3TWF0cml4LFxuICAgICAgeCwgeSxcbiAgICAgIC4uLm9wdHNcbiAgICB9KTtcbiAgfVxuXG4gIC8qXG4gIHBpY2soeCwgeSwgb3B0ID0ge30pIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuZ2w7XG5cbiAgICBpZiAodGhpcy5waWNraW5nRkJPID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMucGlja2luZ0ZCTyA9IG5ldyBGcmFtZWJ1ZmZlcihnbCwge1xuICAgICAgICB3aWR0aDogZ2wuY2FudmFzLndpZHRoLFxuICAgICAgICBoZWlnaHQ6IGdsLmNhbnZhcy5oZWlnaHRcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnBpY2tpbmdQcm9ncmFtID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMucGlja2luZ1Byb2dyYW0gPVxuICAgICAgICBvcHQucGlja2luZ1Byb2dyYW0gfHwgbWFrZVByb2dyYW1Gcm9tRGVmYXVsdFNoYWRlcnMoZ2wpO1xuICAgIH1cblxuICAgIGxldCBwaWNraW5nUHJvZ3JhbSA9IHRoaXMucGlja2luZ1Byb2dyYW07XG5cbiAgICBwaWNraW5nUHJvZ3JhbS51c2UoKTtcbiAgICBwaWNraW5nUHJvZ3JhbS5zZXRVbmlmb3Jtcyh7XG4gICAgICBlbmFibGVQaWNraW5nOiB0cnVlLFxuICAgICAgaGFzUGlja2luZ0NvbG9yczogZmFsc2VcbiAgICB9KTtcblxuICAgIHRoaXMucGlja2luZ0ZCTy5iaW5kKCk7XG5cbiAgICBsZXQgaGFzaCA9IHt9O1xuXG4gICAgZ2wuZW5hYmxlKGdsLlNDSVNTT1JfVEVTVCk7XG4gICAgZ2wuc2Npc3Nvcih4LCBnbC5jYW52YXMuaGVpZ2h0IC0geSwgMSwgMSk7XG5cbiAgICBjb25zdCBvbGRDbGVhckNvbG9yID0gdGhpcy5jbGVhckNvbG9yO1xuICAgIGNvbnN0IG9sZEJhY2tncm91bmRDb2xvciA9IHRoaXMuYmFja2dyb3VuZENvbG9yO1xuICAgIHRoaXMuY2xlYXJDb2xvciA9IHRydWU7XG4gICAgdGhpcy5iYWNrZ3JvdW5kQ29sb3IgPSB7cjogMCwgZzogMCwgYjogMCwgYTogMH07XG5cbiAgICB0aGlzLnJlbmRlcih7XG4gICAgICByZW5kZXJQcm9ncmFtOiBwaWNraW5nUHJvZ3JhbSxcbiAgICAgIG9uQmVmb3JlUmVuZGVyOiBmdW5jdGlvbihlbGVtLCBpKSB7XG4gICAgICAgIGkrKztcbiAgICAgICAgbGV0IHIgPSBpICUgMjU2O1xuICAgICAgICBsZXQgZyA9ICgoaSAvIDI1NikgPj4gMCkgJSAyNTY7XG4gICAgICAgIGxldCBiID0gKChpIC8gKDI1NiAqIDI1NikpID4+IDApICUgMjU2O1xuICAgICAgICBoYXNoW1tyLCBnLCBiXV0gPSBlbGVtO1xuICAgICAgICBwaWNraW5nUHJvZ3JhbS5zZXRVbmlmb3Jtcyh7cGlja0NvbG9yOiBbciAvIDI1NSwgZyAvIDI1NSwgYiAvIDI1NV19KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGdsLmRpc2FibGUoZ2wuU0NJU1NPUl9URVNUKTtcblxuICAgIGNvbnN0IHBpeGVsID0gbmV3IFVpbnQ4QXJyYXkoNCk7XG5cbiAgICBnbC5yZWFkUGl4ZWxzKFxuICAgICAgeCwgZ2wuY2FudmFzLmhlaWdodCAtIHksIDEsIDEsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIHBpeGVsXG4gICAgKTtcblxuICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgbnVsbCk7XG4gICAgdGhpcy5jbGVhckNvbG9yID0gb2xkQ2xlYXJDb2xvcjtcbiAgICB0aGlzLmJhY2tncm91bmRDb2xvciA9IG9sZEJhY2tncm91bmRDb2xvcjtcblxuICAgIGxldCByID0gcGl4ZWxbMF07XG4gICAgbGV0IGcgPSBwaXhlbFsxXTtcbiAgICBsZXQgYiA9IHBpeGVsWzJdO1xuXG4gICAgcmV0dXJuIGhhc2hbW3IsIGcsIGJdXTtcbiAgfVxuXG4gIHBpY2tDdXN0b20oeCwgeSwgb3B0ID0ge30pIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuZ2w7XG5cbiAgICBpZiAodGhpcy5waWNraW5nRkJPID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMucGlja2luZ0ZCTyA9IG5ldyBGcmFtZWJ1ZmZlcihnbCwge1xuICAgICAgICB3aWR0aDogZ2wuY2FudmFzLndpZHRoLFxuICAgICAgICBoZWlnaHQ6IGdsLmNhbnZhcy5oZWlnaHRcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnBpY2tpbmdQcm9ncmFtID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMucGlja2luZ1Byb2dyYW0gPVxuICAgICAgICBvcHQucGlja2luZ1Byb2dyYW0gfHwgbWFrZVByb2dyYW1Gcm9tRGVmYXVsdFNoYWRlcnMoZ2wpO1xuICAgIH1cblxuICAgIGxldCBwaWNraW5nUHJvZ3JhbSA9IHRoaXMucGlja2luZ1Byb2dyYW07XG5cbiAgICBwaWNraW5nUHJvZ3JhbS51c2UoKTtcbiAgICBwaWNraW5nUHJvZ3JhbS5zZXRVbmlmb3Jtcyh7XG4gICAgICBlbmFibGVQaWNraW5nOiB0cnVlLFxuICAgICAgaGFzUGlja2luZ0NvbG9yczogdHJ1ZVxuICAgIH0pO1xuXG4gICAgdGhpcy5waWNraW5nRkJPLmJpbmQoKTtcblxuICAgIGdsLmVuYWJsZShnbC5TQ0lTU09SX1RFU1QpO1xuICAgIGdsLnNjaXNzb3IoeCwgZ2wuY2FudmFzLmhlaWdodCAtIHksIDEsIDEpO1xuXG4gICAgY29uc3Qgb2xkQ2xlYXJDb2xvciA9IHRoaXMuY2xlYXJDb2xvcjtcbiAgICBjb25zdCBvbGRCYWNrZ3JvdW5kQ29sb3IgPSB0aGlzLmJhY2tncm91bmRDb2xvcjtcbiAgICB0aGlzLmNsZWFyQ29sb3IgPSB0cnVlO1xuICAgIHRoaXMuYmFja2dyb3VuZENvbG9yID0ge3I6IDI1NSwgZzogMCwgYjogMCwgYTogMjU1fTtcblxuICAgIHRoaXMucmVuZGVyKHtcbiAgICAgIHJlbmRlclByb2dyYW06IHBpY2tpbmdQcm9ncmFtXG4gICAgfSk7XG5cbiAgICBnbC5kaXNhYmxlKGdsLlNDSVNTT1JfVEVTVCk7XG5cbiAgICBjb25zdCBwaXhlbCA9IG5ldyBVaW50OEFycmF5KDQpO1xuXG4gICAgZ2wucmVhZFBpeGVscyhcbiAgICAgIHgsIGdsLmNhbnZhcy5oZWlnaHQgLSB5LCAxLCAxLCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCBwaXhlbFxuICAgICk7XG5cbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xuICAgIHRoaXMuY2xlYXJDb2xvciA9IG9sZENsZWFyQ29sb3I7XG4gICAgdGhpcy5iYWNrZ3JvdW5kQ29sb3IgPSBvbGRCYWNrZ3JvdW5kQ29sb3I7XG5cbiAgICBsZXQgciA9IHBpeGVsWzBdO1xuICAgIGxldCBnID0gcGl4ZWxbMV07XG4gICAgbGV0IGIgPSBwaXhlbFsyXTtcbiAgICBsZXQgYSA9IHBpeGVsWzNdO1xuXG4gICAgcmV0dXJuIFtyLCBnLCBiLCBhXTtcbiAgfVxuICAqL1xuXG4gIC8vIFNldHVwIHRoZSBsaWdodGluZyBzeXN0ZW06IGFtYmllbnQsIGRpcmVjdGlvbmFsLCBwb2ludCBsaWdodHMuXG4gIHNldHVwTGlnaHRpbmcocHJvZ3JhbSkge1xuICAgIC8vIFNldHVwIExpZ2h0aW5nXG4gICAgY29uc3Qge2VuYWJsZSwgYW1iaWVudCwgZGlyZWN0aW9uYWwsIHBvaW50c30gPSB0aGlzLmNvbmZpZy5saWdodHM7XG5cbiAgICAvLyBTZXQgbGlnaHQgdW5pZm9ybXMuIEFtYmllbnQgYW5kIGRpcmVjdGlvbmFsIGxpZ2h0cy5cbiAgICBwcm9ncmFtLnNldFVuaWZvcm1zKHtlbmFibGVMaWdodHM6IGVuYWJsZX0pO1xuXG4gICAgaWYgKCFlbmFibGUpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGlmIChhbWJpZW50KSB7XG4gICAgICB0aGlzLnNldHVwQW1iaWVudExpZ2h0aW5nKHByb2dyYW0sIGFtYmllbnQpO1xuICAgIH1cblxuICAgIGlmIChkaXJlY3Rpb25hbCkge1xuICAgICAgdGhpcy5zZXR1cERpcmVjdGlvbmFsTGlnaHRpbmcocHJvZ3JhbSwgZGlyZWN0aW9uYWwpO1xuICAgIH1cblxuICAgIC8vIFNldCBwb2ludCBsaWdodHNcbiAgICBpZiAocG9pbnRzKSB7XG4gICAgICB0aGlzLnNldHVwUG9pbnRMaWdodGluZyhwcm9ncmFtLCBwb2ludHMpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0dXBBbWJpZW50TGlnaHRpbmcocHJvZ3JhbSwgYW1iaWVudCkge1xuICAgIHByb2dyYW0uc2V0VW5pZm9ybXMoe1xuICAgICAgJ2FtYmllbnRDb2xvcic6IFthbWJpZW50LnIsIGFtYmllbnQuZywgYW1iaWVudC5iXVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXR1cERpcmVjdGlvbmFsTGlnaHRpbmcocHJvZ3JhbSwgZGlyZWN0aW9uYWwpIHtcbiAgICBjb25zdCB7Y29sb3IsIGRpcmVjdGlvbn0gPSBkaXJlY3Rpb25hbDtcblxuICAgIC8vIE5vcm1hbGl6ZSBsaWdodGluZyBkaXJlY3Rpb24gdmVjdG9yXG4gICAgY29uc3QgZGlyID0gbmV3IFZlYzMoZGlyZWN0aW9uLngsIGRpcmVjdGlvbi55LCBkaXJlY3Rpb24ueilcbiAgICAgIC4kdW5pdCgpXG4gICAgICAuJHNjYWxlKC0xKTtcblxuICAgIHByb2dyYW0uc2V0VW5pZm9ybXMoe1xuICAgICAgJ2RpcmVjdGlvbmFsQ29sb3InOiBbY29sb3IuciwgY29sb3IuZywgY29sb3IuYl0sXG4gICAgICAnbGlnaHRpbmdEaXJlY3Rpb24nOiBbZGlyLngsIGRpci55LCBkaXIuel1cbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0dXBQb2ludExpZ2h0aW5nKHByb2dyYW0sIHBvaW50cykge1xuICAgIHBvaW50cyA9IHBvaW50cyBpbnN0YW5jZW9mIEFycmF5ID8gcG9pbnRzIDogW3BvaW50c107XG4gICAgY29uc3QgbnVtYmVyUG9pbnRzID0gcG9pbnRzLmxlbmd0aDtcbiAgICBwcm9ncmFtLnNldFVuaWZvcm1zKHtudW1iZXJQb2ludHN9KTtcblxuICAgIGNvbnN0IHBvaW50TG9jYXRpb25zID0gW107XG4gICAgY29uc3QgcG9pbnRDb2xvcnMgPSBbXTtcbiAgICBjb25zdCBlbmFibGVTcGVjdWxhciA9IFtdO1xuICAgIGNvbnN0IHBvaW50U3BlY3VsYXJDb2xvcnMgPSBbXTtcbiAgICBmb3IgKGNvbnN0IHBvaW50IG9mIHBvaW50cykge1xuICAgICAgY29uc3Qge3Bvc2l0aW9uLCBjb2xvciwgZGlmZnVzZSwgc3BlY3VsYXJ9ID0gcG9pbnQ7XG4gICAgICBjb25zdCBwb2ludENvbG9yID0gY29sb3IgfHwgZGlmZnVzZTtcblxuICAgICAgcG9pbnRMb2NhdGlvbnMucHVzaChwb3NpdGlvbi54LCBwb3NpdGlvbi55LCBwb3NpdGlvbi56KTtcbiAgICAgIHBvaW50Q29sb3JzLnB1c2gocG9pbnRDb2xvci5yLCBwb2ludENvbG9yLmcsIHBvaW50Q29sb3IuYik7XG5cbiAgICAgIC8vIEFkZCBzcGVjdWxhciBjb2xvclxuICAgICAgZW5hYmxlU3BlY3VsYXIucHVzaChOdW1iZXIoQm9vbGVhbihzcGVjdWxhcikpKTtcbiAgICAgIGlmIChzcGVjdWxhcikge1xuICAgICAgICBwb2ludFNwZWN1bGFyQ29sb3JzLnB1c2goc3BlY3VsYXIuciwgc3BlY3VsYXIuZywgc3BlY3VsYXIuYik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwb2ludFNwZWN1bGFyQ29sb3JzLnB1c2goMCwgMCwgMCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvaW50TG9jYXRpb25zLmxlbmd0aCkge1xuICAgICAgcHJvZ3JhbS5zZXRVbmlmb3Jtcyh7XG4gICAgICAgICdwb2ludExvY2F0aW9uJzogcG9pbnRMb2NhdGlvbnMsXG4gICAgICAgICdwb2ludENvbG9yJzogcG9pbnRDb2xvcnNcbiAgICAgIH0pO1xuICAgICAgcHJvZ3JhbS5zZXRVbmlmb3Jtcyh7XG4gICAgICAgICdlbmFibGVTcGVjdWxhcic6IGVuYWJsZVNwZWN1bGFyLFxuICAgICAgICAncG9pbnRTcGVjdWxhckNvbG9yJzogcG9pbnRTcGVjdWxhckNvbG9yc1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBTZXR1cCBlZmZlY3RzIGxpa2UgZm9nLCBldGMuXG4gIHNldHVwRWZmZWN0cyhwcm9ncmFtKSB7XG4gICAgY29uc3Qge2ZvZ30gPSB0aGlzLmNvbmZpZy5lZmZlY3RzO1xuXG4gICAgaWYgKGZvZykge1xuICAgICAgY29uc3Qge2NvbG9yID0ge3I6IDAuNSwgZzogMC41LCBiOiAwLjV9fSA9IGZvZztcbiAgICAgIHByb2dyYW0uc2V0VW5pZm9ybXMoe1xuICAgICAgICAnaGFzRm9nJzogdHJ1ZSxcbiAgICAgICAgJ2ZvZ05lYXInOiBmb2cubmVhcixcbiAgICAgICAgJ2ZvZ0Zhcic6IGZvZy5mYXIsXG4gICAgICAgICdmb2dDb2xvcic6IFtjb2xvci5yLCBjb2xvci5nLCBjb2xvci5iXVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHByb2dyYW0uc2V0VW5pZm9ybXMoe2hhc0ZvZzogZmFsc2V9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG59XG5cblNjZW5lLk1BWF9URVhUVVJFUyA9IGNvbmZpZy5NQVhfVEVYVFVSRVM7XG5TY2VuZS5NQVhfUE9JTlRfTElHSFRTID0gY29uZmlnLk1BWF9QT0lOVF9MSUdIVFM7XG5TY2VuZS5QSUNLSU5HX1JFUyA9IGNvbmZpZy5QSUNLSU5HX1JFUztcbiJdfQ==