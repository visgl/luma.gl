'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _config = require('../core/config');

var config = _interopRequireWildcard(_config);

var _camera = require('../core/camera');

var _math = require('../math');

var _utils = require('../utils');

var _group = require('./group');

var _group2 = _interopRequireDefault(_group);

var _pick = require('./pick');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

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

      // assert(camera instanceof Camera, 'Invalid Camera in Scene.render');

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2VuZWdyYXBoL3NjZW5lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBR0E7O0lBQVksTTs7QUFDWjs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUNBOztBQUNBOzs7Ozs7Ozs7Ozs7OzsrZUFUQTtBQUNBOztBQVVBLElBQU0sbUJBQW1CLCtCQUF6Qjs7QUFFQSxTQUFTLElBQVQsR0FBZ0IsQ0FBRTs7QUFFbEIsSUFBTSxxQkFBcUI7QUFDekIsVUFBUTtBQUNOLFlBQVEsS0FERjtBQUVOO0FBQ0EsYUFBUyxFQUFDLEdBQUcsR0FBSixFQUFTLEdBQUcsR0FBWixFQUFpQixHQUFHLEdBQXBCLEVBSEg7QUFJTjtBQUNBLGlCQUFhO0FBQ1gsaUJBQVcsRUFBQyxHQUFHLENBQUosRUFBTyxHQUFHLENBQVYsRUFBYSxHQUFHLENBQWhCLEVBREE7QUFFWCxhQUFPLEVBQUMsR0FBRyxDQUFKLEVBQU8sR0FBRyxDQUFWLEVBQWEsR0FBRyxDQUFoQjtBQUZJO0FBSWI7QUFDQTtBQVZNLEdBRGlCO0FBYXpCLFdBQVM7QUFDUCxTQUFLO0FBQ0w7QUFGTyxHQWJnQjtBQWlCekIsY0FBWSxJQWpCYTtBQWtCekIsY0FBWSxJQWxCYTtBQW1CekIsbUJBQWlCLEVBQUMsR0FBRyxDQUFKLEVBQU8sR0FBRyxDQUFWLEVBQWEsR0FBRyxDQUFoQixFQUFtQixHQUFHLENBQXRCLEVBbkJRO0FBb0J6QixtQkFBaUI7QUFwQlEsQ0FBM0I7O0FBdUJBOztJQUNxQixLOzs7QUFFbkIsaUJBQVksRUFBWixFQUFnQixJQUFoQixFQUFzQjtBQUFBOztBQUNwQiwwQkFBTyxFQUFQLEVBQVcsZ0JBQVg7O0FBRUEsV0FBTyxrQkFBTSxrQkFBTixFQUEwQixJQUExQixDQUFQOztBQUhvQix5RkFLZCxJQUxjOztBQU9wQixVQUFLLEVBQUwsR0FBVSxFQUFWO0FBQ0EsVUFBSyxNQUFMLEdBQWMsSUFBZDtBQUNBLFVBQUssV0FBTCxHQUFtQixLQUFuQjtBQUNB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UixDQUFvQjtBQUNsQiw0QkFBa0IsY0FEQTtBQUVsQixnQ0FBc0I7QUFGSixTQUFwQjtBQUlEOztBQUVELGFBQU8sSUFBUDtBQUNEOztBQUVEOzs7O2lDQUNhLE8sRUFBUztBQUFBLFVBQ2IsR0FEYSxHQUNOLEtBQUssTUFBTCxDQUFZLE9BRE4sQ0FDYixHQURhOzs7QUFHcEIsVUFBSSxHQUFKLEVBQVM7QUFBQSx5QkFDb0MsR0FEcEMsQ0FDQSxLQURBO0FBQUEsWUFDQSxLQURBLDhCQUNRLEVBQUMsR0FBRyxHQUFKLEVBQVMsR0FBRyxHQUFaLEVBQWlCLEdBQUcsR0FBcEIsRUFEUjs7QUFFUCxnQkFBUSxXQUFSLENBQW9CO0FBQ2xCLG9CQUFVLElBRFE7QUFFbEIscUJBQVcsSUFBSSxJQUZHO0FBR2xCLG9CQUFVLElBQUksR0FISTtBQUlsQixzQkFBWSxDQUFDLE1BQU0sQ0FBUCxFQUFVLE1BQU0sQ0FBaEIsRUFBbUIsTUFBTSxDQUF6QjtBQUpNLFNBQXBCO0FBTUQsT0FSRCxNQVFPO0FBQ0wsZ0JBQVEsV0FBUixDQUFvQixFQUFDLFFBQVEsS0FBVCxFQUFwQjtBQUNEOztBQUVELGFBQU8sSUFBUDtBQUNEOzs7Ozs7a0JBNVVrQixLOzs7QUFnVnJCLE1BQU0sWUFBTixHQUFxQixPQUFPLFlBQTVCO0FBQ0EsTUFBTSxnQkFBTixHQUF5QixPQUFPLGdCQUFoQztBQUNBLE1BQU0sV0FBTixHQUFvQixPQUFPLFdBQTNCIiwiZmlsZSI6InNjZW5lLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gU2NlbmUgT2JqZWN0IG1hbmFnZW1lbnQgYW5kIHJlbmRlcmluZ1xuLyogZXNsaW50LWRpc2FibGUgbWF4LXN0YXRlbWVudHMsIG5vLXRyeS1jYXRjaCAqL1xuXG5pbXBvcnQgKiBhcyBjb25maWcgZnJvbSAnLi4vY29yZS9jb25maWcnO1xuaW1wb3J0IHtDYW1lcmF9IGZyb20gJy4uL2NvcmUvY2FtZXJhJztcbmltcG9ydCB7TWF0NCwgVmVjM30gZnJvbSAnLi4vbWF0aCc7XG5pbXBvcnQge21lcmdlfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgR3JvdXAgZnJvbSAnLi9ncm91cCc7XG5pbXBvcnQge3BpY2tNb2RlbHN9IGZyb20gJy4vcGljayc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5cbmNvbnN0IElOVkFMSURfQVJHVU1FTlQgPSAnTHVtYUdMLlNjZW5lIGludmFsaWQgYXJndW1lbnQnO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxuY29uc3QgREVGQVVMVF9TQ0VORV9PUFRTID0ge1xuICBsaWdodHM6IHtcbiAgICBlbmFibGU6IGZhbHNlLFxuICAgIC8vIGFtYmllbnQgbGlnaHRcbiAgICBhbWJpZW50OiB7cjogMC4yLCBnOiAwLjIsIGI6IDAuMn0sXG4gICAgLy8gZGlyZWN0aW9uYWwgbGlnaHRcbiAgICBkaXJlY3Rpb25hbDoge1xuICAgICAgZGlyZWN0aW9uOiB7eDogMSwgeTogMSwgejogMX0sXG4gICAgICBjb2xvcjoge3I6IDAsIGc6IDAsIGI6IDB9XG4gICAgfVxuICAgIC8vIHBvaW50IGxpZ2h0XG4gICAgLy8gcG9pbnRzOiBbXVxuICB9LFxuICBlZmZlY3RzOiB7XG4gICAgZm9nOiBmYWxzZVxuICAgIC8vIHsgbmVhciwgZmFyLCBjb2xvciB9XG4gIH0sXG4gIGNsZWFyQ29sb3I6IHRydWUsXG4gIGNsZWFyRGVwdGg6IHRydWUsXG4gIGJhY2tncm91bmRDb2xvcjoge3I6IDAsIGc6IDAsIGI6IDAsIGE6IDF9LFxuICBiYWNrZ3JvdW5kRGVwdGg6IDFcbn07XG5cbi8vIFNjZW5lIGNsYXNzXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTY2VuZSBleHRlbmRzIEdyb3VwIHtcblxuICBjb25zdHJ1Y3RvcihnbCwgb3B0cykge1xuICAgIGFzc2VydChnbCwgSU5WQUxJRF9BUkdVTUVOVCk7XG5cbiAgICBvcHRzID0gbWVyZ2UoREVGQVVMVF9TQ0VORV9PUFRTLCBvcHRzKTtcblxuICAgIHN1cGVyKG9wdHMpO1xuXG4gICAgdGhpcy5nbCA9IGdsO1xuICAgIHRoaXMuY29uZmlnID0gb3B0cztcbiAgICB0aGlzLm5lZWRzUmVkcmF3ID0gZmFsc2U7XG4gICAgT2JqZWN0LnNlYWwodGhpcyk7XG4gIH1cblxuICBzZXROZWVkc1JlZHJhdyhyZWRyYXcgPSB0cnVlKSB7XG4gICAgdGhpcy5uZWVkc1JlZHJhdyA9IHJlZHJhdztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldE5lZWRzUmVkcmF3KHtjbGVhclJlZHJhd0ZsYWdzID0gZmFsc2V9ID0ge30pIHtcbiAgICBsZXQgcmVkcmF3ID0gZmFsc2U7XG4gICAgcmVkcmF3ID0gcmVkcmF3IHx8IHRoaXMubmVlZHNSZWRyYXc7XG4gICAgdGhpcy5uZWVkc1JlZHJhdyA9IHRoaXMubmVlZHNSZWRyYXcgJiYgIWNsZWFyUmVkcmF3RmxhZ3M7XG4gICAgZm9yIChjb25zdCBtb2RlbCBvZiB0aGlzLnRyYXZlcnNlKCkpIHtcbiAgICAgIHJlZHJhdyA9IHJlZHJhdyB8fCBtb2RlbC5nZXROZWVkc1JlZHJhdyh7Y2xlYXJSZWRyYXdGbGFnc30pO1xuICAgIH1cbiAgICByZXR1cm4gcmVkcmF3O1xuICB9XG5cbiAgY2xlYXIoZ2wpIHtcbiAgICBpZiAodGhpcy5jb25maWcuY2xlYXJDb2xvcikge1xuICAgICAgY29uc3QgYmcgPSB0aGlzLmNvbmZpZy5iYWNrZ3JvdW5kQ29sb3I7XG4gICAgICBnbC5jbGVhckNvbG9yKGJnLnIsIGJnLmcsIGJnLmIsIGJnLmEpO1xuICAgIH1cbiAgICBpZiAodGhpcy5jb25maWcuY2xlYXJEZXB0aCkge1xuICAgICAgZ2wuY2xlYXJEZXB0aCh0aGlzLmNvbmZpZy5iYWNrZ3JvdW5kRGVwdGgpO1xuICAgIH1cbiAgICBpZiAodGhpcy5jb25maWcuY2xlYXJDb2xvciAmJiB0aGlzLmNvbmZpZy5jbGVhckRlcHRoKSB7XG4gICAgICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUIHwgZ2wuREVQVEhfQlVGRkVSX0JJVCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmNvbmZpZy5jbGVhckNvbG9yKSB7XG4gICAgICBnbC5jbGVhcihnbC5DT0xPUl9CVUZGRVJfQklUKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuY29uZmlnLmNsZWFyRGVwdGgpIHtcbiAgICAgIGdsLmNsZWFyKGdsLkRFUFRIX0JVRkZFUl9CSVQpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIFJlbmRlcnMgYWxsIG9iamVjdHMgaW4gdGhlIHNjZW5lLlxuICByZW5kZXIoe1xuICAgIGNhbWVyYSxcbiAgICBvbkJlZm9yZVJlbmRlciA9IG5vb3AsXG4gICAgb25BZnRlclJlbmRlciA9IG5vb3AsXG4gICAgY29udGV4dCA9IHt9LFxuICAgIC4uLm9wdHNcbiAgfSA9IHt9KSB7XG4gICAgLy8gYXNzZXJ0KGNhbWVyYSBpbnN0YW5jZW9mIENhbWVyYSwgJ0ludmFsaWQgQ2FtZXJhIGluIFNjZW5lLnJlbmRlcicpO1xuXG4gICAgY29uc3Qge2dsfSA9IHRoaXM7XG4gICAgdGhpcy5jbGVhcihnbCk7XG5cbiAgICAvLyBHbyB0aHJvdWdoIGVhY2ggbW9kZWwgYW5kIHJlbmRlciBpdC5cbiAgICBmb3IgKGNvbnN0IG1vZGVsIG9mIHRoaXMudHJhdmVyc2Uoe3ZpZXdNYXRyaXg6IGNhbWVyYS52aWV3fSkpIHtcbiAgICAgIGlmIChtb2RlbC5kaXNwbGF5KSB7XG4gICAgICAgIG9uQmVmb3JlUmVuZGVyKG1vZGVsLCBjb250ZXh0KTtcbiAgICAgICAgdGhpcy5yZW5kZXJPYmplY3Qoe21vZGVsLCBjYW1lcmEsIGNvbnRleHR9KTtcbiAgICAgICAgb25BZnRlclJlbmRlcihtb2RlbCwgY29udGV4dCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcmVuZGVyT2JqZWN0KHttb2RlbCwgY2FtZXJhLCBjb250ZXh0ID0ge319KSB7XG4gICAgYXNzZXJ0KGNhbWVyYSBpbnN0YW5jZW9mIENhbWVyYSwgJ0ludmFsaWQgQ2FtZXJhIGluIFNjZW5lLnJlbmRlck9iamVjdCcpO1xuXG4gICAgLy8gU2V0dXAgbGlnaHRpbmcgYW5kIHNjZW5lIGVmZmVjdHMgbGlrZSBmb2csIGV0Yy5cbiAgICBjb25zdCB7cHJvZ3JhbX0gPSBtb2RlbDtcbiAgICB0aGlzLnNldHVwTGlnaHRpbmcocHJvZ3JhbSk7XG4gICAgdGhpcy5zZXR1cEVmZmVjdHMocHJvZ3JhbSk7XG5cbiAgICAvLyBEcmF3XG4gICAgbW9kZWwub25CZWZvcmVSZW5kZXIoY2FtZXJhLCBjb250ZXh0KTtcbiAgICBtb2RlbC5yZW5kZXIoe2NhbWVyYSwgdmlld01hdHJpeDogY2FtZXJhLnZpZXd9KTtcbiAgICBtb2RlbC5vbkFmdGVyUmVuZGVyKGNhbWVyYSwgY29udGV4dCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBUT0RPIC0gdGhpcyBpcyB0aGUgbmV3IHBpY2tpbmcgZm9yIGRlY2suZ2xcbiAgcGlja01vZGVscyhnbCwge2NhbWVyYSwgeCwgeSwgLi4ub3B0c30pIHtcbiAgICBjb25zdCB7dmlldzogdmlld01hdHJpeH0gPSBjYW1lcmE7XG4gICAgcmV0dXJuIHBpY2tNb2RlbHMoZ2wsIHtcbiAgICAgIGdyb3VwOiB0aGlzLFxuICAgICAgY2FtZXJhLFxuICAgICAgdmlld01hdHJpeCxcbiAgICAgIHgsIHksXG4gICAgICAuLi5vcHRzXG4gICAgfSk7XG4gIH1cblxuICAvKlxuICBwaWNrKHgsIHksIG9wdCA9IHt9KSB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLmdsO1xuXG4gICAgaWYgKHRoaXMucGlja2luZ0ZCTyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnBpY2tpbmdGQk8gPSBuZXcgRnJhbWVidWZmZXIoZ2wsIHtcbiAgICAgICAgd2lkdGg6IGdsLmNhbnZhcy53aWR0aCxcbiAgICAgICAgaGVpZ2h0OiBnbC5jYW52YXMuaGVpZ2h0XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5waWNraW5nUHJvZ3JhbSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnBpY2tpbmdQcm9ncmFtID1cbiAgICAgICAgb3B0LnBpY2tpbmdQcm9ncmFtIHx8IG1ha2VQcm9ncmFtRnJvbURlZmF1bHRTaGFkZXJzKGdsKTtcbiAgICB9XG5cbiAgICBsZXQgcGlja2luZ1Byb2dyYW0gPSB0aGlzLnBpY2tpbmdQcm9ncmFtO1xuXG4gICAgcGlja2luZ1Byb2dyYW0udXNlKCk7XG4gICAgcGlja2luZ1Byb2dyYW0uc2V0VW5pZm9ybXMoe1xuICAgICAgZW5hYmxlUGlja2luZzogdHJ1ZSxcbiAgICAgIGhhc1BpY2tpbmdDb2xvcnM6IGZhbHNlXG4gICAgfSk7XG5cbiAgICB0aGlzLnBpY2tpbmdGQk8uYmluZCgpO1xuXG4gICAgbGV0IGhhc2ggPSB7fTtcblxuICAgIGdsLmVuYWJsZShnbC5TQ0lTU09SX1RFU1QpO1xuICAgIGdsLnNjaXNzb3IoeCwgZ2wuY2FudmFzLmhlaWdodCAtIHksIDEsIDEpO1xuXG4gICAgY29uc3Qgb2xkQ2xlYXJDb2xvciA9IHRoaXMuY2xlYXJDb2xvcjtcbiAgICBjb25zdCBvbGRCYWNrZ3JvdW5kQ29sb3IgPSB0aGlzLmJhY2tncm91bmRDb2xvcjtcbiAgICB0aGlzLmNsZWFyQ29sb3IgPSB0cnVlO1xuICAgIHRoaXMuYmFja2dyb3VuZENvbG9yID0ge3I6IDAsIGc6IDAsIGI6IDAsIGE6IDB9O1xuXG4gICAgdGhpcy5yZW5kZXIoe1xuICAgICAgcmVuZGVyUHJvZ3JhbTogcGlja2luZ1Byb2dyYW0sXG4gICAgICBvbkJlZm9yZVJlbmRlcjogZnVuY3Rpb24oZWxlbSwgaSkge1xuICAgICAgICBpKys7XG4gICAgICAgIGxldCByID0gaSAlIDI1NjtcbiAgICAgICAgbGV0IGcgPSAoKGkgLyAyNTYpID4+IDApICUgMjU2O1xuICAgICAgICBsZXQgYiA9ICgoaSAvICgyNTYgKiAyNTYpKSA+PiAwKSAlIDI1NjtcbiAgICAgICAgaGFzaFtbciwgZywgYl1dID0gZWxlbTtcbiAgICAgICAgcGlja2luZ1Byb2dyYW0uc2V0VW5pZm9ybXMoe3BpY2tDb2xvcjogW3IgLyAyNTUsIGcgLyAyNTUsIGIgLyAyNTVdfSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBnbC5kaXNhYmxlKGdsLlNDSVNTT1JfVEVTVCk7XG5cbiAgICBjb25zdCBwaXhlbCA9IG5ldyBVaW50OEFycmF5KDQpO1xuXG4gICAgZ2wucmVhZFBpeGVscyhcbiAgICAgIHgsIGdsLmNhbnZhcy5oZWlnaHQgLSB5LCAxLCAxLCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCBwaXhlbFxuICAgICk7XG5cbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xuICAgIHRoaXMuY2xlYXJDb2xvciA9IG9sZENsZWFyQ29sb3I7XG4gICAgdGhpcy5iYWNrZ3JvdW5kQ29sb3IgPSBvbGRCYWNrZ3JvdW5kQ29sb3I7XG5cbiAgICBsZXQgciA9IHBpeGVsWzBdO1xuICAgIGxldCBnID0gcGl4ZWxbMV07XG4gICAgbGV0IGIgPSBwaXhlbFsyXTtcblxuICAgIHJldHVybiBoYXNoW1tyLCBnLCBiXV07XG4gIH1cblxuICBwaWNrQ3VzdG9tKHgsIHksIG9wdCA9IHt9KSB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLmdsO1xuXG4gICAgaWYgKHRoaXMucGlja2luZ0ZCTyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnBpY2tpbmdGQk8gPSBuZXcgRnJhbWVidWZmZXIoZ2wsIHtcbiAgICAgICAgd2lkdGg6IGdsLmNhbnZhcy53aWR0aCxcbiAgICAgICAgaGVpZ2h0OiBnbC5jYW52YXMuaGVpZ2h0XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5waWNraW5nUHJvZ3JhbSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnBpY2tpbmdQcm9ncmFtID1cbiAgICAgICAgb3B0LnBpY2tpbmdQcm9ncmFtIHx8IG1ha2VQcm9ncmFtRnJvbURlZmF1bHRTaGFkZXJzKGdsKTtcbiAgICB9XG5cbiAgICBsZXQgcGlja2luZ1Byb2dyYW0gPSB0aGlzLnBpY2tpbmdQcm9ncmFtO1xuXG4gICAgcGlja2luZ1Byb2dyYW0udXNlKCk7XG4gICAgcGlja2luZ1Byb2dyYW0uc2V0VW5pZm9ybXMoe1xuICAgICAgZW5hYmxlUGlja2luZzogdHJ1ZSxcbiAgICAgIGhhc1BpY2tpbmdDb2xvcnM6IHRydWVcbiAgICB9KTtcblxuICAgIHRoaXMucGlja2luZ0ZCTy5iaW5kKCk7XG5cbiAgICBnbC5lbmFibGUoZ2wuU0NJU1NPUl9URVNUKTtcbiAgICBnbC5zY2lzc29yKHgsIGdsLmNhbnZhcy5oZWlnaHQgLSB5LCAxLCAxKTtcblxuICAgIGNvbnN0IG9sZENsZWFyQ29sb3IgPSB0aGlzLmNsZWFyQ29sb3I7XG4gICAgY29uc3Qgb2xkQmFja2dyb3VuZENvbG9yID0gdGhpcy5iYWNrZ3JvdW5kQ29sb3I7XG4gICAgdGhpcy5jbGVhckNvbG9yID0gdHJ1ZTtcbiAgICB0aGlzLmJhY2tncm91bmRDb2xvciA9IHtyOiAyNTUsIGc6IDAsIGI6IDAsIGE6IDI1NX07XG5cbiAgICB0aGlzLnJlbmRlcih7XG4gICAgICByZW5kZXJQcm9ncmFtOiBwaWNraW5nUHJvZ3JhbVxuICAgIH0pO1xuXG4gICAgZ2wuZGlzYWJsZShnbC5TQ0lTU09SX1RFU1QpO1xuXG4gICAgY29uc3QgcGl4ZWwgPSBuZXcgVWludDhBcnJheSg0KTtcblxuICAgIGdsLnJlYWRQaXhlbHMoXG4gICAgICB4LCBnbC5jYW52YXMuaGVpZ2h0IC0geSwgMSwgMSwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgcGl4ZWxcbiAgICApO1xuXG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBudWxsKTtcbiAgICB0aGlzLmNsZWFyQ29sb3IgPSBvbGRDbGVhckNvbG9yO1xuICAgIHRoaXMuYmFja2dyb3VuZENvbG9yID0gb2xkQmFja2dyb3VuZENvbG9yO1xuXG4gICAgbGV0IHIgPSBwaXhlbFswXTtcbiAgICBsZXQgZyA9IHBpeGVsWzFdO1xuICAgIGxldCBiID0gcGl4ZWxbMl07XG4gICAgbGV0IGEgPSBwaXhlbFszXTtcblxuICAgIHJldHVybiBbciwgZywgYiwgYV07XG4gIH1cbiAgKi9cblxuICAvLyBTZXR1cCB0aGUgbGlnaHRpbmcgc3lzdGVtOiBhbWJpZW50LCBkaXJlY3Rpb25hbCwgcG9pbnQgbGlnaHRzLlxuICBzZXR1cExpZ2h0aW5nKHByb2dyYW0pIHtcbiAgICAvLyBTZXR1cCBMaWdodGluZ1xuICAgIGNvbnN0IHtlbmFibGUsIGFtYmllbnQsIGRpcmVjdGlvbmFsLCBwb2ludHN9ID0gdGhpcy5jb25maWcubGlnaHRzO1xuXG4gICAgLy8gU2V0IGxpZ2h0IHVuaWZvcm1zLiBBbWJpZW50IGFuZCBkaXJlY3Rpb25hbCBsaWdodHMuXG4gICAgcHJvZ3JhbS5zZXRVbmlmb3Jtcyh7ZW5hYmxlTGlnaHRzOiBlbmFibGV9KTtcblxuICAgIGlmICghZW5hYmxlKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBpZiAoYW1iaWVudCkge1xuICAgICAgdGhpcy5zZXR1cEFtYmllbnRMaWdodGluZyhwcm9ncmFtLCBhbWJpZW50KTtcbiAgICB9XG5cbiAgICBpZiAoZGlyZWN0aW9uYWwpIHtcbiAgICAgIHRoaXMuc2V0dXBEaXJlY3Rpb25hbExpZ2h0aW5nKHByb2dyYW0sIGRpcmVjdGlvbmFsKTtcbiAgICB9XG5cbiAgICAvLyBTZXQgcG9pbnQgbGlnaHRzXG4gICAgaWYgKHBvaW50cykge1xuICAgICAgdGhpcy5zZXR1cFBvaW50TGlnaHRpbmcocHJvZ3JhbSwgcG9pbnRzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldHVwQW1iaWVudExpZ2h0aW5nKHByb2dyYW0sIGFtYmllbnQpIHtcbiAgICBwcm9ncmFtLnNldFVuaWZvcm1zKHtcbiAgICAgICdhbWJpZW50Q29sb3InOiBbYW1iaWVudC5yLCBhbWJpZW50LmcsIGFtYmllbnQuYl1cbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0dXBEaXJlY3Rpb25hbExpZ2h0aW5nKHByb2dyYW0sIGRpcmVjdGlvbmFsKSB7XG4gICAgY29uc3Qge2NvbG9yLCBkaXJlY3Rpb259ID0gZGlyZWN0aW9uYWw7XG5cbiAgICAvLyBOb3JtYWxpemUgbGlnaHRpbmcgZGlyZWN0aW9uIHZlY3RvclxuICAgIGNvbnN0IGRpciA9IG5ldyBWZWMzKGRpcmVjdGlvbi54LCBkaXJlY3Rpb24ueSwgZGlyZWN0aW9uLnopXG4gICAgICAuJHVuaXQoKVxuICAgICAgLiRzY2FsZSgtMSk7XG5cbiAgICBwcm9ncmFtLnNldFVuaWZvcm1zKHtcbiAgICAgICdkaXJlY3Rpb25hbENvbG9yJzogW2NvbG9yLnIsIGNvbG9yLmcsIGNvbG9yLmJdLFxuICAgICAgJ2xpZ2h0aW5nRGlyZWN0aW9uJzogW2Rpci54LCBkaXIueSwgZGlyLnpdXG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldHVwUG9pbnRMaWdodGluZyhwcm9ncmFtLCBwb2ludHMpIHtcbiAgICBwb2ludHMgPSBwb2ludHMgaW5zdGFuY2VvZiBBcnJheSA/IHBvaW50cyA6IFtwb2ludHNdO1xuICAgIGNvbnN0IG51bWJlclBvaW50cyA9IHBvaW50cy5sZW5ndGg7XG4gICAgcHJvZ3JhbS5zZXRVbmlmb3Jtcyh7bnVtYmVyUG9pbnRzfSk7XG5cbiAgICBjb25zdCBwb2ludExvY2F0aW9ucyA9IFtdO1xuICAgIGNvbnN0IHBvaW50Q29sb3JzID0gW107XG4gICAgY29uc3QgZW5hYmxlU3BlY3VsYXIgPSBbXTtcbiAgICBjb25zdCBwb2ludFNwZWN1bGFyQ29sb3JzID0gW107XG4gICAgZm9yIChjb25zdCBwb2ludCBvZiBwb2ludHMpIHtcbiAgICAgIGNvbnN0IHtwb3NpdGlvbiwgY29sb3IsIGRpZmZ1c2UsIHNwZWN1bGFyfSA9IHBvaW50O1xuICAgICAgY29uc3QgcG9pbnRDb2xvciA9IGNvbG9yIHx8IGRpZmZ1c2U7XG5cbiAgICAgIHBvaW50TG9jYXRpb25zLnB1c2gocG9zaXRpb24ueCwgcG9zaXRpb24ueSwgcG9zaXRpb24ueik7XG4gICAgICBwb2ludENvbG9ycy5wdXNoKHBvaW50Q29sb3IuciwgcG9pbnRDb2xvci5nLCBwb2ludENvbG9yLmIpO1xuXG4gICAgICAvLyBBZGQgc3BlY3VsYXIgY29sb3JcbiAgICAgIGVuYWJsZVNwZWN1bGFyLnB1c2goTnVtYmVyKEJvb2xlYW4oc3BlY3VsYXIpKSk7XG4gICAgICBpZiAoc3BlY3VsYXIpIHtcbiAgICAgICAgcG9pbnRTcGVjdWxhckNvbG9ycy5wdXNoKHNwZWN1bGFyLnIsIHNwZWN1bGFyLmcsIHNwZWN1bGFyLmIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcG9pbnRTcGVjdWxhckNvbG9ycy5wdXNoKDAsIDAsIDApO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb2ludExvY2F0aW9ucy5sZW5ndGgpIHtcbiAgICAgIHByb2dyYW0uc2V0VW5pZm9ybXMoe1xuICAgICAgICAncG9pbnRMb2NhdGlvbic6IHBvaW50TG9jYXRpb25zLFxuICAgICAgICAncG9pbnRDb2xvcic6IHBvaW50Q29sb3JzXG4gICAgICB9KTtcbiAgICAgIHByb2dyYW0uc2V0VW5pZm9ybXMoe1xuICAgICAgICAnZW5hYmxlU3BlY3VsYXInOiBlbmFibGVTcGVjdWxhcixcbiAgICAgICAgJ3BvaW50U3BlY3VsYXJDb2xvcic6IHBvaW50U3BlY3VsYXJDb2xvcnNcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gU2V0dXAgZWZmZWN0cyBsaWtlIGZvZywgZXRjLlxuICBzZXR1cEVmZmVjdHMocHJvZ3JhbSkge1xuICAgIGNvbnN0IHtmb2d9ID0gdGhpcy5jb25maWcuZWZmZWN0cztcblxuICAgIGlmIChmb2cpIHtcbiAgICAgIGNvbnN0IHtjb2xvciA9IHtyOiAwLjUsIGc6IDAuNSwgYjogMC41fX0gPSBmb2c7XG4gICAgICBwcm9ncmFtLnNldFVuaWZvcm1zKHtcbiAgICAgICAgJ2hhc0ZvZyc6IHRydWUsXG4gICAgICAgICdmb2dOZWFyJzogZm9nLm5lYXIsXG4gICAgICAgICdmb2dGYXInOiBmb2cuZmFyLFxuICAgICAgICAnZm9nQ29sb3InOiBbY29sb3IuciwgY29sb3IuZywgY29sb3IuYl1cbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBwcm9ncmFtLnNldFVuaWZvcm1zKHtoYXNGb2c6IGZhbHNlfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxufVxuXG5TY2VuZS5NQVhfVEVYVFVSRVMgPSBjb25maWcuTUFYX1RFWFRVUkVTO1xuU2NlbmUuTUFYX1BPSU5UX0xJR0hUUyA9IGNvbmZpZy5NQVhfUE9JTlRfTElHSFRTO1xuU2NlbmUuUElDS0lOR19SRVMgPSBjb25maWcuUElDS0lOR19SRVM7XG4iXX0=