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

    var _this = _possibleConstructorReturn(this, (Scene.__proto__ || Object.getPrototypeOf(Scene)).call(this, opts));

    _this.gl = gl;
    _this.config = opts;
    _this.needsRedraw = false;
    Object.seal(_this);
    return _this;
  }

  _createClass(Scene, [{
    key: 'setNeedsRedraw',
    value: function setNeedsRedraw() {
      var redraw = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

      this.needsRedraw = redraw;
      return this;
    }
  }, {
    key: 'getNeedsRedraw',
    value: function getNeedsRedraw() {
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

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
      var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

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
        ambientColor: [ambient.r, ambient.g, ambient.b]
      });

      return this;
    }
  }, {
    key: 'setupDirectionalLighting',
    value: function setupDirectionalLighting(program, directional) {
      var color = directional.color;
      var direction = directional.direction;

      // Normalize lighting direction vector

      var dir = new _math.Vector3(direction.x, direction.y, direction.z).normalize().scale([-1, -1, -1]);

      program.setUniforms({
        directionalColor: [color.r, color.g, color.b],
        lightingDirection: [dir.x, dir.y, dir.z]
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
          pointLocation: pointLocations,
          pointColor: pointColors
        });
        program.setUniforms({
          enableSpecular: enableSpecular,
          pointSpecularColor: pointSpecularColors
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
          hasFog: true,
          fogNear: fog.near,
          fogFar: fog.far,
          fogColor: [color.r, color.g, color.b]
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2VuZWdyYXBoL3NjZW5lLmpzIl0sIm5hbWVzIjpbImNvbmZpZyIsIklOVkFMSURfQVJHVU1FTlQiLCJub29wIiwiREVGQVVMVF9TQ0VORV9PUFRTIiwibGlnaHRzIiwiZW5hYmxlIiwiYW1iaWVudCIsInIiLCJnIiwiYiIsImRpcmVjdGlvbmFsIiwiZGlyZWN0aW9uIiwieCIsInkiLCJ6IiwiY29sb3IiLCJlZmZlY3RzIiwiZm9nIiwiY2xlYXJDb2xvciIsImNsZWFyRGVwdGgiLCJiYWNrZ3JvdW5kQ29sb3IiLCJhIiwiYmFja2dyb3VuZERlcHRoIiwiU2NlbmUiLCJnbCIsIm9wdHMiLCJuZWVkc1JlZHJhdyIsIk9iamVjdCIsInNlYWwiLCJyZWRyYXciLCJjbGVhclJlZHJhd0ZsYWdzIiwidHJhdmVyc2UiLCJtb2RlbCIsImdldE5lZWRzUmVkcmF3IiwiYmciLCJjbGVhciIsIkNPTE9SX0JVRkZFUl9CSVQiLCJERVBUSF9CVUZGRVJfQklUIiwiY2FtZXJhIiwib25CZWZvcmVSZW5kZXIiLCJvbkFmdGVyUmVuZGVyIiwiY29udGV4dCIsInZpZXdNYXRyaXgiLCJ2aWV3IiwiZGlzcGxheSIsInJlbmRlck9iamVjdCIsInByb2dyYW0iLCJzZXR1cExpZ2h0aW5nIiwic2V0dXBFZmZlY3RzIiwicmVuZGVyIiwiZ3JvdXAiLCJwb2ludHMiLCJzZXRVbmlmb3JtcyIsImVuYWJsZUxpZ2h0cyIsInNldHVwQW1iaWVudExpZ2h0aW5nIiwic2V0dXBEaXJlY3Rpb25hbExpZ2h0aW5nIiwic2V0dXBQb2ludExpZ2h0aW5nIiwiYW1iaWVudENvbG9yIiwiZGlyIiwibm9ybWFsaXplIiwic2NhbGUiLCJkaXJlY3Rpb25hbENvbG9yIiwibGlnaHRpbmdEaXJlY3Rpb24iLCJBcnJheSIsIm51bWJlclBvaW50cyIsImxlbmd0aCIsInBvaW50TG9jYXRpb25zIiwicG9pbnRDb2xvcnMiLCJlbmFibGVTcGVjdWxhciIsInBvaW50U3BlY3VsYXJDb2xvcnMiLCJwb2ludCIsInBvc2l0aW9uIiwiZGlmZnVzZSIsInNwZWN1bGFyIiwicG9pbnRDb2xvciIsInB1c2giLCJOdW1iZXIiLCJCb29sZWFuIiwicG9pbnRMb2NhdGlvbiIsInBvaW50U3BlY3VsYXJDb2xvciIsImhhc0ZvZyIsImZvZ05lYXIiLCJuZWFyIiwiZm9nRmFyIiwiZmFyIiwiZm9nQ29sb3IiLCJNQVhfVEVYVFVSRVMiLCJNQVhfUE9JTlRfTElHSFRTIiwiUElDS0lOR19SRVMiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBR0E7O0lBQVlBLE07O0FBQ1o7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7Ozs7Ozs7Ozs7Ozs7K2VBVEE7QUFDQTs7QUFVQSxJQUFNQyxtQkFBbUIsK0JBQXpCOztBQUVBLFNBQVNDLElBQVQsR0FBZ0IsQ0FBRTs7QUFFbEIsSUFBTUMscUJBQXFCO0FBQ3pCQyxVQUFRO0FBQ05DLFlBQVEsS0FERjtBQUVOO0FBQ0FDLGFBQVMsRUFBQ0MsR0FBRyxHQUFKLEVBQVNDLEdBQUcsR0FBWixFQUFpQkMsR0FBRyxHQUFwQixFQUhIO0FBSU47QUFDQUMsaUJBQWE7QUFDWEMsaUJBQVcsRUFBQ0MsR0FBRyxDQUFKLEVBQU9DLEdBQUcsQ0FBVixFQUFhQyxHQUFHLENBQWhCLEVBREE7QUFFWEMsYUFBTyxFQUFDUixHQUFHLENBQUosRUFBT0MsR0FBRyxDQUFWLEVBQWFDLEdBQUcsQ0FBaEI7QUFGSTtBQUliO0FBQ0E7QUFWTSxHQURpQjtBQWF6Qk8sV0FBUztBQUNQQyxTQUFLO0FBQ0w7QUFGTyxHQWJnQjtBQWlCekJDLGNBQVksSUFqQmE7QUFrQnpCQyxjQUFZLElBbEJhO0FBbUJ6QkMsbUJBQWlCLEVBQUNiLEdBQUcsQ0FBSixFQUFPQyxHQUFHLENBQVYsRUFBYUMsR0FBRyxDQUFoQixFQUFtQlksR0FBRyxDQUF0QixFQW5CUTtBQW9CekJDLG1CQUFpQjtBQXBCUSxDQUEzQjs7QUF1QkE7O0lBQ3FCQyxLOzs7QUFFbkIsaUJBQVlDLEVBQVosRUFBZ0JDLElBQWhC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cEIsRUFEUjs7QUFFUHFDLGdCQUFRTSxXQUFSLENBQW9CO0FBQ2xCNEIsa0JBQVEsSUFEVTtBQUVsQkMsbUJBQVNoRSxJQUFJaUUsSUFGSztBQUdsQkMsa0JBQVFsRSxJQUFJbUUsR0FITTtBQUlsQkMsb0JBQVUsQ0FBQ3RFLE1BQU1SLENBQVAsRUFBVVEsTUFBTVAsQ0FBaEIsRUFBbUJPLE1BQU1OLENBQXpCO0FBSlEsU0FBcEI7QUFNRCxPQVJELE1BUU87QUFDTHFDLGdCQUFRTSxXQUFSLENBQW9CLEVBQUM0QixRQUFRLEtBQVQsRUFBcEI7QUFDRDs7QUFFRCxhQUFPLElBQVA7QUFDRDs7Ozs7O2tCQTVVa0J6RCxLOzs7QUFnVnJCQSxNQUFNK0QsWUFBTixHQUFxQnRGLE9BQU9zRixZQUE1QjtBQUNBL0QsTUFBTWdFLGdCQUFOLEdBQXlCdkYsT0FBT3VGLGdCQUFoQztBQUNBaEUsTUFBTWlFLFdBQU4sR0FBb0J4RixPQUFPd0YsV0FBM0IiLCJmaWxlIjoic2NlbmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBTY2VuZSBPYmplY3QgbWFuYWdlbWVudCBhbmQgcmVuZGVyaW5nXG4vKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cywgbm8tdHJ5LWNhdGNoICovXG5cbmltcG9ydCAqIGFzIGNvbmZpZyBmcm9tICcuLi9jb3JlL2NvbmZpZyc7XG5pbXBvcnQge0NhbWVyYX0gZnJvbSAnLi4vY29yZS9jYW1lcmEnO1xuaW1wb3J0IHtWZWN0b3IzfSBmcm9tICcuLi9tYXRoJztcbmltcG9ydCB7bWVyZ2V9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCBHcm91cCBmcm9tICcuL2dyb3VwJztcbmltcG9ydCB7cGlja01vZGVsc30gZnJvbSAnLi9waWNrJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcblxuY29uc3QgSU5WQUxJRF9BUkdVTUVOVCA9ICdMdW1hR0wuU2NlbmUgaW52YWxpZCBhcmd1bWVudCc7XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5jb25zdCBERUZBVUxUX1NDRU5FX09QVFMgPSB7XG4gIGxpZ2h0czoge1xuICAgIGVuYWJsZTogZmFsc2UsXG4gICAgLy8gYW1iaWVudCBsaWdodFxuICAgIGFtYmllbnQ6IHtyOiAwLjIsIGc6IDAuMiwgYjogMC4yfSxcbiAgICAvLyBkaXJlY3Rpb25hbCBsaWdodFxuICAgIGRpcmVjdGlvbmFsOiB7XG4gICAgICBkaXJlY3Rpb246IHt4OiAxLCB5OiAxLCB6OiAxfSxcbiAgICAgIGNvbG9yOiB7cjogMCwgZzogMCwgYjogMH1cbiAgICB9XG4gICAgLy8gcG9pbnQgbGlnaHRcbiAgICAvLyBwb2ludHM6IFtdXG4gIH0sXG4gIGVmZmVjdHM6IHtcbiAgICBmb2c6IGZhbHNlXG4gICAgLy8geyBuZWFyLCBmYXIsIGNvbG9yIH1cbiAgfSxcbiAgY2xlYXJDb2xvcjogdHJ1ZSxcbiAgY2xlYXJEZXB0aDogdHJ1ZSxcbiAgYmFja2dyb3VuZENvbG9yOiB7cjogMCwgZzogMCwgYjogMCwgYTogMX0sXG4gIGJhY2tncm91bmREZXB0aDogMVxufTtcblxuLy8gU2NlbmUgY2xhc3NcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNjZW5lIGV4dGVuZHMgR3JvdXAge1xuXG4gIGNvbnN0cnVjdG9yKGdsLCBvcHRzKSB7XG4gICAgYXNzZXJ0KGdsLCBJTlZBTElEX0FSR1VNRU5UKTtcblxuICAgIG9wdHMgPSBtZXJnZShERUZBVUxUX1NDRU5FX09QVFMsIG9wdHMpO1xuXG4gICAgc3VwZXIob3B0cyk7XG5cbiAgICB0aGlzLmdsID0gZ2w7XG4gICAgdGhpcy5jb25maWcgPSBvcHRzO1xuICAgIHRoaXMubmVlZHNSZWRyYXcgPSBmYWxzZTtcbiAgICBPYmplY3Quc2VhbCh0aGlzKTtcbiAgfVxuXG4gIHNldE5lZWRzUmVkcmF3KHJlZHJhdyA9IHRydWUpIHtcbiAgICB0aGlzLm5lZWRzUmVkcmF3ID0gcmVkcmF3O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZ2V0TmVlZHNSZWRyYXcoe2NsZWFyUmVkcmF3RmxhZ3MgPSBmYWxzZX0gPSB7fSkge1xuICAgIGxldCByZWRyYXcgPSBmYWxzZTtcbiAgICByZWRyYXcgPSByZWRyYXcgfHwgdGhpcy5uZWVkc1JlZHJhdztcbiAgICB0aGlzLm5lZWRzUmVkcmF3ID0gdGhpcy5uZWVkc1JlZHJhdyAmJiAhY2xlYXJSZWRyYXdGbGFncztcbiAgICBmb3IgKGNvbnN0IG1vZGVsIG9mIHRoaXMudHJhdmVyc2UoKSkge1xuICAgICAgcmVkcmF3ID0gcmVkcmF3IHx8IG1vZGVsLmdldE5lZWRzUmVkcmF3KHtjbGVhclJlZHJhd0ZsYWdzfSk7XG4gICAgfVxuICAgIHJldHVybiByZWRyYXc7XG4gIH1cblxuICBjbGVhcihnbCkge1xuICAgIGlmICh0aGlzLmNvbmZpZy5jbGVhckNvbG9yKSB7XG4gICAgICBjb25zdCBiZyA9IHRoaXMuY29uZmlnLmJhY2tncm91bmRDb2xvcjtcbiAgICAgIGdsLmNsZWFyQ29sb3IoYmcuciwgYmcuZywgYmcuYiwgYmcuYSk7XG4gICAgfVxuICAgIGlmICh0aGlzLmNvbmZpZy5jbGVhckRlcHRoKSB7XG4gICAgICBnbC5jbGVhckRlcHRoKHRoaXMuY29uZmlnLmJhY2tncm91bmREZXB0aCk7XG4gICAgfVxuICAgIGlmICh0aGlzLmNvbmZpZy5jbGVhckNvbG9yICYmIHRoaXMuY29uZmlnLmNsZWFyRGVwdGgpIHtcbiAgICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQgfCBnbC5ERVBUSF9CVUZGRVJfQklUKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuY29uZmlnLmNsZWFyQ29sb3IpIHtcbiAgICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5jb25maWcuY2xlYXJEZXB0aCkge1xuICAgICAgZ2wuY2xlYXIoZ2wuREVQVEhfQlVGRkVSX0JJVCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gUmVuZGVycyBhbGwgb2JqZWN0cyBpbiB0aGUgc2NlbmUuXG4gIHJlbmRlcih7XG4gICAgY2FtZXJhLFxuICAgIG9uQmVmb3JlUmVuZGVyID0gbm9vcCxcbiAgICBvbkFmdGVyUmVuZGVyID0gbm9vcCxcbiAgICBjb250ZXh0ID0ge30sXG4gICAgLi4ub3B0c1xuICB9ID0ge30pIHtcbiAgICAvLyBhc3NlcnQoY2FtZXJhIGluc3RhbmNlb2YgQ2FtZXJhLCAnSW52YWxpZCBDYW1lcmEgaW4gU2NlbmUucmVuZGVyJyk7XG5cbiAgICBjb25zdCB7Z2x9ID0gdGhpcztcbiAgICB0aGlzLmNsZWFyKGdsKTtcblxuICAgIC8vIEdvIHRocm91Z2ggZWFjaCBtb2RlbCBhbmQgcmVuZGVyIGl0LlxuICAgIGZvciAoY29uc3QgbW9kZWwgb2YgdGhpcy50cmF2ZXJzZSh7dmlld01hdHJpeDogY2FtZXJhLnZpZXd9KSkge1xuICAgICAgaWYgKG1vZGVsLmRpc3BsYXkpIHtcbiAgICAgICAgb25CZWZvcmVSZW5kZXIobW9kZWwsIGNvbnRleHQpO1xuICAgICAgICB0aGlzLnJlbmRlck9iamVjdCh7bW9kZWwsIGNhbWVyYSwgY29udGV4dH0pO1xuICAgICAgICBvbkFmdGVyUmVuZGVyKG1vZGVsLCBjb250ZXh0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICByZW5kZXJPYmplY3Qoe21vZGVsLCBjYW1lcmEsIGNvbnRleHQgPSB7fX0pIHtcbiAgICBhc3NlcnQoY2FtZXJhIGluc3RhbmNlb2YgQ2FtZXJhLCAnSW52YWxpZCBDYW1lcmEgaW4gU2NlbmUucmVuZGVyT2JqZWN0Jyk7XG5cbiAgICAvLyBTZXR1cCBsaWdodGluZyBhbmQgc2NlbmUgZWZmZWN0cyBsaWtlIGZvZywgZXRjLlxuICAgIGNvbnN0IHtwcm9ncmFtfSA9IG1vZGVsO1xuICAgIHRoaXMuc2V0dXBMaWdodGluZyhwcm9ncmFtKTtcbiAgICB0aGlzLnNldHVwRWZmZWN0cyhwcm9ncmFtKTtcblxuICAgIC8vIERyYXdcbiAgICBtb2RlbC5vbkJlZm9yZVJlbmRlcihjYW1lcmEsIGNvbnRleHQpO1xuICAgIG1vZGVsLnJlbmRlcih7Y2FtZXJhLCB2aWV3TWF0cml4OiBjYW1lcmEudmlld30pO1xuICAgIG1vZGVsLm9uQWZ0ZXJSZW5kZXIoY2FtZXJhLCBjb250ZXh0KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIFRPRE8gLSB0aGlzIGlzIHRoZSBuZXcgcGlja2luZyBmb3IgZGVjay5nbFxuICBwaWNrTW9kZWxzKGdsLCB7Y2FtZXJhLCB4LCB5LCAuLi5vcHRzfSkge1xuICAgIGNvbnN0IHt2aWV3OiB2aWV3TWF0cml4fSA9IGNhbWVyYTtcbiAgICByZXR1cm4gcGlja01vZGVscyhnbCwge1xuICAgICAgZ3JvdXA6IHRoaXMsXG4gICAgICBjYW1lcmEsXG4gICAgICB2aWV3TWF0cml4LFxuICAgICAgeCwgeSxcbiAgICAgIC4uLm9wdHNcbiAgICB9KTtcbiAgfVxuXG4gIC8qXG4gIHBpY2soeCwgeSwgb3B0ID0ge30pIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuZ2w7XG5cbiAgICBpZiAodGhpcy5waWNraW5nRkJPID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMucGlja2luZ0ZCTyA9IG5ldyBGcmFtZWJ1ZmZlcihnbCwge1xuICAgICAgICB3aWR0aDogZ2wuY2FudmFzLndpZHRoLFxuICAgICAgICBoZWlnaHQ6IGdsLmNhbnZhcy5oZWlnaHRcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnBpY2tpbmdQcm9ncmFtID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMucGlja2luZ1Byb2dyYW0gPVxuICAgICAgICBvcHQucGlja2luZ1Byb2dyYW0gfHwgbWFrZVByb2dyYW1Gcm9tRGVmYXVsdFNoYWRlcnMoZ2wpO1xuICAgIH1cblxuICAgIGxldCBwaWNraW5nUHJvZ3JhbSA9IHRoaXMucGlja2luZ1Byb2dyYW07XG5cbiAgICBwaWNraW5nUHJvZ3JhbS51c2UoKTtcbiAgICBwaWNraW5nUHJvZ3JhbS5zZXRVbmlmb3Jtcyh7XG4gICAgICBlbmFibGVQaWNraW5nOiB0cnVlLFxuICAgICAgaGFzUGlja2luZ0NvbG9yczogZmFsc2VcbiAgICB9KTtcblxuICAgIHRoaXMucGlja2luZ0ZCTy5iaW5kKCk7XG5cbiAgICBsZXQgaGFzaCA9IHt9O1xuXG4gICAgZ2wuZW5hYmxlKGdsLlNDSVNTT1JfVEVTVCk7XG4gICAgZ2wuc2Npc3Nvcih4LCBnbC5jYW52YXMuaGVpZ2h0IC0geSwgMSwgMSk7XG5cbiAgICBjb25zdCBvbGRDbGVhckNvbG9yID0gdGhpcy5jbGVhckNvbG9yO1xuICAgIGNvbnN0IG9sZEJhY2tncm91bmRDb2xvciA9IHRoaXMuYmFja2dyb3VuZENvbG9yO1xuICAgIHRoaXMuY2xlYXJDb2xvciA9IHRydWU7XG4gICAgdGhpcy5iYWNrZ3JvdW5kQ29sb3IgPSB7cjogMCwgZzogMCwgYjogMCwgYTogMH07XG5cbiAgICB0aGlzLnJlbmRlcih7XG4gICAgICByZW5kZXJQcm9ncmFtOiBwaWNraW5nUHJvZ3JhbSxcbiAgICAgIG9uQmVmb3JlUmVuZGVyOiBmdW5jdGlvbihlbGVtLCBpKSB7XG4gICAgICAgIGkrKztcbiAgICAgICAgbGV0IHIgPSBpICUgMjU2O1xuICAgICAgICBsZXQgZyA9ICgoaSAvIDI1NikgPj4gMCkgJSAyNTY7XG4gICAgICAgIGxldCBiID0gKChpIC8gKDI1NiAqIDI1NikpID4+IDApICUgMjU2O1xuICAgICAgICBoYXNoW1tyLCBnLCBiXV0gPSBlbGVtO1xuICAgICAgICBwaWNraW5nUHJvZ3JhbS5zZXRVbmlmb3Jtcyh7cGlja0NvbG9yOiBbciAvIDI1NSwgZyAvIDI1NSwgYiAvIDI1NV19KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGdsLmRpc2FibGUoZ2wuU0NJU1NPUl9URVNUKTtcblxuICAgIGNvbnN0IHBpeGVsID0gbmV3IFVpbnQ4QXJyYXkoNCk7XG5cbiAgICBnbC5yZWFkUGl4ZWxzKFxuICAgICAgeCwgZ2wuY2FudmFzLmhlaWdodCAtIHksIDEsIDEsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIHBpeGVsXG4gICAgKTtcblxuICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgbnVsbCk7XG4gICAgdGhpcy5jbGVhckNvbG9yID0gb2xkQ2xlYXJDb2xvcjtcbiAgICB0aGlzLmJhY2tncm91bmRDb2xvciA9IG9sZEJhY2tncm91bmRDb2xvcjtcblxuICAgIGxldCByID0gcGl4ZWxbMF07XG4gICAgbGV0IGcgPSBwaXhlbFsxXTtcbiAgICBsZXQgYiA9IHBpeGVsWzJdO1xuXG4gICAgcmV0dXJuIGhhc2hbW3IsIGcsIGJdXTtcbiAgfVxuXG4gIHBpY2tDdXN0b20oeCwgeSwgb3B0ID0ge30pIHtcbiAgICBjb25zdCBnbCA9IHRoaXMuZ2w7XG5cbiAgICBpZiAodGhpcy5waWNraW5nRkJPID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMucGlja2luZ0ZCTyA9IG5ldyBGcmFtZWJ1ZmZlcihnbCwge1xuICAgICAgICB3aWR0aDogZ2wuY2FudmFzLndpZHRoLFxuICAgICAgICBoZWlnaHQ6IGdsLmNhbnZhcy5oZWlnaHRcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnBpY2tpbmdQcm9ncmFtID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMucGlja2luZ1Byb2dyYW0gPVxuICAgICAgICBvcHQucGlja2luZ1Byb2dyYW0gfHwgbWFrZVByb2dyYW1Gcm9tRGVmYXVsdFNoYWRlcnMoZ2wpO1xuICAgIH1cblxuICAgIGxldCBwaWNraW5nUHJvZ3JhbSA9IHRoaXMucGlja2luZ1Byb2dyYW07XG5cbiAgICBwaWNraW5nUHJvZ3JhbS51c2UoKTtcbiAgICBwaWNraW5nUHJvZ3JhbS5zZXRVbmlmb3Jtcyh7XG4gICAgICBlbmFibGVQaWNraW5nOiB0cnVlLFxuICAgICAgaGFzUGlja2luZ0NvbG9yczogdHJ1ZVxuICAgIH0pO1xuXG4gICAgdGhpcy5waWNraW5nRkJPLmJpbmQoKTtcblxuICAgIGdsLmVuYWJsZShnbC5TQ0lTU09SX1RFU1QpO1xuICAgIGdsLnNjaXNzb3IoeCwgZ2wuY2FudmFzLmhlaWdodCAtIHksIDEsIDEpO1xuXG4gICAgY29uc3Qgb2xkQ2xlYXJDb2xvciA9IHRoaXMuY2xlYXJDb2xvcjtcbiAgICBjb25zdCBvbGRCYWNrZ3JvdW5kQ29sb3IgPSB0aGlzLmJhY2tncm91bmRDb2xvcjtcbiAgICB0aGlzLmNsZWFyQ29sb3IgPSB0cnVlO1xuICAgIHRoaXMuYmFja2dyb3VuZENvbG9yID0ge3I6IDI1NSwgZzogMCwgYjogMCwgYTogMjU1fTtcblxuICAgIHRoaXMucmVuZGVyKHtcbiAgICAgIHJlbmRlclByb2dyYW06IHBpY2tpbmdQcm9ncmFtXG4gICAgfSk7XG5cbiAgICBnbC5kaXNhYmxlKGdsLlNDSVNTT1JfVEVTVCk7XG5cbiAgICBjb25zdCBwaXhlbCA9IG5ldyBVaW50OEFycmF5KDQpO1xuXG4gICAgZ2wucmVhZFBpeGVscyhcbiAgICAgIHgsIGdsLmNhbnZhcy5oZWlnaHQgLSB5LCAxLCAxLCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCBwaXhlbFxuICAgICk7XG5cbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xuICAgIHRoaXMuY2xlYXJDb2xvciA9IG9sZENsZWFyQ29sb3I7XG4gICAgdGhpcy5iYWNrZ3JvdW5kQ29sb3IgPSBvbGRCYWNrZ3JvdW5kQ29sb3I7XG5cbiAgICBsZXQgciA9IHBpeGVsWzBdO1xuICAgIGxldCBnID0gcGl4ZWxbMV07XG4gICAgbGV0IGIgPSBwaXhlbFsyXTtcbiAgICBsZXQgYSA9IHBpeGVsWzNdO1xuXG4gICAgcmV0dXJuIFtyLCBnLCBiLCBhXTtcbiAgfVxuICAqL1xuXG4gIC8vIFNldHVwIHRoZSBsaWdodGluZyBzeXN0ZW06IGFtYmllbnQsIGRpcmVjdGlvbmFsLCBwb2ludCBsaWdodHMuXG4gIHNldHVwTGlnaHRpbmcocHJvZ3JhbSkge1xuICAgIC8vIFNldHVwIExpZ2h0aW5nXG4gICAgY29uc3Qge2VuYWJsZSwgYW1iaWVudCwgZGlyZWN0aW9uYWwsIHBvaW50c30gPSB0aGlzLmNvbmZpZy5saWdodHM7XG5cbiAgICAvLyBTZXQgbGlnaHQgdW5pZm9ybXMuIEFtYmllbnQgYW5kIGRpcmVjdGlvbmFsIGxpZ2h0cy5cbiAgICBwcm9ncmFtLnNldFVuaWZvcm1zKHtlbmFibGVMaWdodHM6IGVuYWJsZX0pO1xuXG4gICAgaWYgKCFlbmFibGUpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGlmIChhbWJpZW50KSB7XG4gICAgICB0aGlzLnNldHVwQW1iaWVudExpZ2h0aW5nKHByb2dyYW0sIGFtYmllbnQpO1xuICAgIH1cblxuICAgIGlmIChkaXJlY3Rpb25hbCkge1xuICAgICAgdGhpcy5zZXR1cERpcmVjdGlvbmFsTGlnaHRpbmcocHJvZ3JhbSwgZGlyZWN0aW9uYWwpO1xuICAgIH1cblxuICAgIC8vIFNldCBwb2ludCBsaWdodHNcbiAgICBpZiAocG9pbnRzKSB7XG4gICAgICB0aGlzLnNldHVwUG9pbnRMaWdodGluZyhwcm9ncmFtLCBwb2ludHMpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0dXBBbWJpZW50TGlnaHRpbmcocHJvZ3JhbSwgYW1iaWVudCkge1xuICAgIHByb2dyYW0uc2V0VW5pZm9ybXMoe1xuICAgICAgYW1iaWVudENvbG9yOiBbYW1iaWVudC5yLCBhbWJpZW50LmcsIGFtYmllbnQuYl1cbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0dXBEaXJlY3Rpb25hbExpZ2h0aW5nKHByb2dyYW0sIGRpcmVjdGlvbmFsKSB7XG4gICAgY29uc3Qge2NvbG9yLCBkaXJlY3Rpb259ID0gZGlyZWN0aW9uYWw7XG5cbiAgICAvLyBOb3JtYWxpemUgbGlnaHRpbmcgZGlyZWN0aW9uIHZlY3RvclxuICAgIGNvbnN0IGRpciA9IG5ldyBWZWN0b3IzKGRpcmVjdGlvbi54LCBkaXJlY3Rpb24ueSwgZGlyZWN0aW9uLnopXG4gICAgICAubm9ybWFsaXplKClcbiAgICAgIC5zY2FsZShbLTEsIC0xLCAtMV0pO1xuXG4gICAgcHJvZ3JhbS5zZXRVbmlmb3Jtcyh7XG4gICAgICBkaXJlY3Rpb25hbENvbG9yOiBbY29sb3IuciwgY29sb3IuZywgY29sb3IuYl0sXG4gICAgICBsaWdodGluZ0RpcmVjdGlvbjogW2Rpci54LCBkaXIueSwgZGlyLnpdXG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldHVwUG9pbnRMaWdodGluZyhwcm9ncmFtLCBwb2ludHMpIHtcbiAgICBwb2ludHMgPSBwb2ludHMgaW5zdGFuY2VvZiBBcnJheSA/IHBvaW50cyA6IFtwb2ludHNdO1xuICAgIGNvbnN0IG51bWJlclBvaW50cyA9IHBvaW50cy5sZW5ndGg7XG4gICAgcHJvZ3JhbS5zZXRVbmlmb3Jtcyh7bnVtYmVyUG9pbnRzfSk7XG5cbiAgICBjb25zdCBwb2ludExvY2F0aW9ucyA9IFtdO1xuICAgIGNvbnN0IHBvaW50Q29sb3JzID0gW107XG4gICAgY29uc3QgZW5hYmxlU3BlY3VsYXIgPSBbXTtcbiAgICBjb25zdCBwb2ludFNwZWN1bGFyQ29sb3JzID0gW107XG4gICAgZm9yIChjb25zdCBwb2ludCBvZiBwb2ludHMpIHtcbiAgICAgIGNvbnN0IHtwb3NpdGlvbiwgY29sb3IsIGRpZmZ1c2UsIHNwZWN1bGFyfSA9IHBvaW50O1xuICAgICAgY29uc3QgcG9pbnRDb2xvciA9IGNvbG9yIHx8IGRpZmZ1c2U7XG5cbiAgICAgIHBvaW50TG9jYXRpb25zLnB1c2gocG9zaXRpb24ueCwgcG9zaXRpb24ueSwgcG9zaXRpb24ueik7XG4gICAgICBwb2ludENvbG9ycy5wdXNoKHBvaW50Q29sb3IuciwgcG9pbnRDb2xvci5nLCBwb2ludENvbG9yLmIpO1xuXG4gICAgICAvLyBBZGQgc3BlY3VsYXIgY29sb3JcbiAgICAgIGVuYWJsZVNwZWN1bGFyLnB1c2goTnVtYmVyKEJvb2xlYW4oc3BlY3VsYXIpKSk7XG4gICAgICBpZiAoc3BlY3VsYXIpIHtcbiAgICAgICAgcG9pbnRTcGVjdWxhckNvbG9ycy5wdXNoKHNwZWN1bGFyLnIsIHNwZWN1bGFyLmcsIHNwZWN1bGFyLmIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcG9pbnRTcGVjdWxhckNvbG9ycy5wdXNoKDAsIDAsIDApO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb2ludExvY2F0aW9ucy5sZW5ndGgpIHtcbiAgICAgIHByb2dyYW0uc2V0VW5pZm9ybXMoe1xuICAgICAgICBwb2ludExvY2F0aW9uOiBwb2ludExvY2F0aW9ucyxcbiAgICAgICAgcG9pbnRDb2xvcjogcG9pbnRDb2xvcnNcbiAgICAgIH0pO1xuICAgICAgcHJvZ3JhbS5zZXRVbmlmb3Jtcyh7XG4gICAgICAgIGVuYWJsZVNwZWN1bGFyLFxuICAgICAgICBwb2ludFNwZWN1bGFyQ29sb3I6IHBvaW50U3BlY3VsYXJDb2xvcnNcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gU2V0dXAgZWZmZWN0cyBsaWtlIGZvZywgZXRjLlxuICBzZXR1cEVmZmVjdHMocHJvZ3JhbSkge1xuICAgIGNvbnN0IHtmb2d9ID0gdGhpcy5jb25maWcuZWZmZWN0cztcblxuICAgIGlmIChmb2cpIHtcbiAgICAgIGNvbnN0IHtjb2xvciA9IHtyOiAwLjUsIGc6IDAuNSwgYjogMC41fX0gPSBmb2c7XG4gICAgICBwcm9ncmFtLnNldFVuaWZvcm1zKHtcbiAgICAgICAgaGFzRm9nOiB0cnVlLFxuICAgICAgICBmb2dOZWFyOiBmb2cubmVhcixcbiAgICAgICAgZm9nRmFyOiBmb2cuZmFyLFxuICAgICAgICBmb2dDb2xvcjogW2NvbG9yLnIsIGNvbG9yLmcsIGNvbG9yLmJdXG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJvZ3JhbS5zZXRVbmlmb3Jtcyh7aGFzRm9nOiBmYWxzZX0pO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbn1cblxuU2NlbmUuTUFYX1RFWFRVUkVTID0gY29uZmlnLk1BWF9URVhUVVJFUztcblNjZW5lLk1BWF9QT0lOVF9MSUdIVFMgPSBjb25maWcuTUFYX1BPSU5UX0xJR0hUUztcblNjZW5lLlBJQ0tJTkdfUkVTID0gY29uZmlnLlBJQ0tJTkdfUkVTO1xuIl19