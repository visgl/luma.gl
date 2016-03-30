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
    }
  }, {
    key: 'setupAmbientLighting',
    value: function setupAmbientLighting(program, ambient) {
      program.setUniforms({
        'ambientColor': [ambient.r, ambient.g, ambient.b]
      });
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
    }
  }]);

  return Scene;
}(_group2.default);

exports.default = Scene;


Scene.MAX_TEXTURES = config.MAX_TEXTURES;
Scene.MAX_POINT_LIGHTS = config.MAX_POINT_LIGHTS;
Scene.PICKING_RES = config.PICKING_RES;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2VuZWdyYXBoL3NjZW5lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBU1k7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHWixTQUFTLElBQVQsR0FBZ0IsRUFBaEI7O0FBRUEsSUFBTSxxQkFBcUI7QUFDekIsVUFBUTtBQUNOLFlBQVEsS0FBUjs7QUFFQSxhQUFTLEVBQUMsR0FBRyxHQUFILEVBQVEsR0FBRyxHQUFILEVBQVEsR0FBRyxHQUFILEVBQTFCOztBQUVBLGlCQUFhO0FBQ1gsaUJBQVcsRUFBQyxHQUFHLENBQUgsRUFBTSxHQUFHLENBQUgsRUFBTSxHQUFHLENBQUgsRUFBeEI7QUFDQSxhQUFPLEVBQUMsR0FBRyxDQUFILEVBQU0sR0FBRyxDQUFILEVBQU0sR0FBRyxDQUFILEVBQXBCO0tBRkY7OztBQUxNLEdBQVI7QUFZQSxXQUFTO0FBQ1AsU0FBSyxLQUFMOztBQURPLEdBQVQ7QUFJQSxjQUFZLElBQVo7QUFDQSxjQUFZLElBQVo7QUFDQSxtQkFBaUIsRUFBQyxHQUFHLENBQUgsRUFBTSxHQUFHLENBQUgsRUFBTSxHQUFHLENBQUgsRUFBTSxHQUFHLENBQUgsRUFBcEM7QUFDQSxtQkFBaUIsQ0FBakI7Q0FwQkk7O0FBdUJOLElBQU0sbUJBQW1CLCtCQUFuQjs7OztJQUdlOzs7QUFFbkIsV0FGbUIsS0FFbkIsQ0FBWSxFQUFaLEVBQWdCLElBQWhCLEVBQXNCOzBCQUZILE9BRUc7O0FBQ3BCLDBCQUFPLEVBQVAsRUFBVyxnQkFBWCxFQURvQjs7QUFHcEIsV0FBTyxrQkFBTSxrQkFBTixFQUEwQixJQUExQixDQUFQLENBSG9COzt1RUFGSCxrQkFPWCxPQUxjOztBQU9wQixVQUFLLEVBQUwsR0FBVSxFQUFWLENBUG9CO0FBUXBCLFVBQUssTUFBTCxHQUFjLElBQWQsQ0FSb0I7O0dBQXRCOztlQUZtQjs7K0JBYVIsS0FBSztBQUNkLFVBQU0sVUFBVSxNQUFNLElBQUksT0FBSixHQUFjLEtBQUssT0FBTCxDQUR0QjtBQUVkLDRCQUFPLGlDQUFQLEVBQW1DLG9DQUFuQyxFQUZjO0FBR2QsY0FBUSxHQUFSLEdBSGM7QUFJZCxhQUFPLE9BQVAsQ0FKYzs7OztrQ0FPRixLQUFLO0FBQ2pCLFVBQU0sVUFBVSxLQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBVixDQURXO0FBRWpCLFVBQU0sY0FBYyxJQUFJLE9BQUosQ0FGSDtBQUdqQixVQUFJLE9BQUosR0FBYyxJQUFkLENBSGlCO0FBSWpCLFVBQUksZUFBSixDQUFvQixPQUFwQixFQUppQjtBQUtqQixVQUFJLE9BQUosR0FBYyxXQUFkLENBTGlCO0FBTWpCLFVBQUksaUJBQUosQ0FBc0IsT0FBdEIsRUFOaUI7Ozs7MEJBU2IsSUFBSTtBQUNSLFVBQUksS0FBSyxNQUFMLENBQVksVUFBWixFQUF3QjtBQUMxQixZQUFNLEtBQUssS0FBSyxNQUFMLENBQVksZUFBWixDQURlO0FBRTFCLFdBQUcsVUFBSCxDQUFjLEdBQUcsQ0FBSCxFQUFNLEdBQUcsQ0FBSCxFQUFNLEdBQUcsQ0FBSCxFQUFNLEdBQUcsQ0FBSCxDQUFoQyxDQUYwQjtPQUE1QjtBQUlBLFVBQUksS0FBSyxNQUFMLENBQVksVUFBWixFQUF3QjtBQUMxQixXQUFHLFVBQUgsQ0FBYyxLQUFLLE1BQUwsQ0FBWSxlQUFaLENBQWQsQ0FEMEI7T0FBNUI7QUFHQSxVQUFJLEtBQUssTUFBTCxDQUFZLFVBQVosSUFBMEIsS0FBSyxNQUFMLENBQVksVUFBWixFQUF3QjtBQUNwRCxXQUFHLEtBQUgsQ0FBUyxHQUFHLGdCQUFILEdBQXNCLEdBQUcsZ0JBQUgsQ0FBL0IsQ0FEb0Q7T0FBdEQsTUFFTyxJQUFJLEtBQUssTUFBTCxDQUFZLFVBQVosRUFBd0I7QUFDakMsV0FBRyxLQUFILENBQVMsR0FBRyxnQkFBSCxDQUFULENBRGlDO09BQTVCLE1BRUEsSUFBSSxLQUFLLE1BQUwsQ0FBWSxVQUFaLEVBQXdCO0FBQ2pDLFdBQUcsS0FBSCxDQUFTLEdBQUcsZ0JBQUgsQ0FBVCxDQURpQztPQUE1Qjs7Ozs7OzsyQkFNRixJQU1DO3VFQUFKLGtCQUFJOztVQUxOLHFCQUtNO3FDQUpOLGVBSU07VUFKTixxREFBaUIsMkJBSVg7b0NBSE4sY0FHTTtVQUhOLG1EQUFnQiwwQkFHVjs4QkFGTixRQUVNO1VBRk4sdUNBQVUsa0JBRUo7O1VBREgsZ0dBQ0c7O0FBQ04sNEJBQU8sZ0NBQVAsRUFETTs7QUFHTixXQUFLLEtBQUwsQ0FBVyxFQUFYOzs7QUFITTs7Ozs7QUFNTiw2QkFBb0IsS0FBSyxRQUFMLENBQWMsRUFBQyxZQUFZLE9BQU8sSUFBUCxFQUEzQiwyQkFBcEIsb0dBQThEO2NBQW5ELG9CQUFtRDs7QUFDNUQsY0FBSSxNQUFNLE9BQU4sRUFBZTtBQUNqQiwyQkFBZSxLQUFmLEVBQXNCLE9BQXRCLEVBRGlCO0FBRWpCLGlCQUFLLFlBQUwsQ0FBa0IsRUFBbEIsRUFBc0IsS0FBdEIsRUFGaUI7QUFHakIsMEJBQWMsS0FBZCxFQUFxQixPQUFyQixFQUhpQjtXQUFuQjtTQURGOzs7Ozs7Ozs7Ozs7OztPQU5NOzs7O2lDQWVLLElBQUksT0FBTyxRQUFzQjtVQUFkLGdFQUFVLGtCQUFJOztBQUM1QyxZQUFNLGVBQU4sR0FENEM7QUFFNUMsWUFBTSxjQUFOLENBQXFCLE1BQXJCLEVBQTZCLE9BQTdCLEVBRjRDOztBQUk1QyxVQUFNLFVBQVUsS0FBSyxVQUFMLENBQWdCLEtBQWhCLENBQVY7OztBQUpzQyxVQU81QyxDQUFLLGFBQUwsQ0FBbUIsT0FBbkIsRUFQNEM7QUFRNUMsV0FBSyxZQUFMLENBQWtCLE9BQWxCOzs7QUFSNEMsVUFXeEMsTUFBSixFQUFZO0FBQ1YsZ0JBQVEsV0FBUixDQUFvQixPQUFPLFdBQVAsRUFBcEIsRUFEVTtPQUFaOzs7Ozs7O0FBWDRDLFdBb0I1QyxDQUFNLE1BQU4sQ0FBYSxFQUFiLEVBQWlCLEVBQUMsWUFBWSxPQUFPLElBQVAsRUFBOUIsRUFwQjRDOztBQXNCNUMsWUFBTSxhQUFOLENBQW9CLE1BQXBCLEVBQTRCLE9BQTVCLEVBdEI0QztBQXVCNUMsWUFBTSxpQkFBTixHQXZCNEM7Ozs7Ozs7K0JBMkJuQyxXQUE2QjtVQUF4QixzQkFBd0I7VUFBaEIsWUFBZ0I7VUFBYixZQUFhOztVQUFQLDZEQUFPOztVQUN6QixhQUFjLE9BQXBCLEtBRCtCOztBQUV0QyxhQUFPLHNCQUFXLEVBQVgsYUFBZ0IsT0FBTyxJQUFQLEVBQWEsd0JBQVksTUFBRyxRQUFNLEtBQWxELENBQVAsQ0FGc0M7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O2tDQStIMUIsU0FBUzs7MkJBRXdCLEtBQUssTUFBTCxDQUFZLE1BQVosQ0FGeEI7VUFFaEIsK0JBRmdCO1VBRVIsaUNBRlE7VUFFQyx5Q0FGRDtVQUVjOzs7QUFGZDtBQUtyQixjQUFRLFVBQVIsQ0FBbUIsY0FBbkIsRUFBbUMsTUFBbkMsRUFMcUI7O0FBT3JCLFVBQUksQ0FBQyxNQUFELEVBQVM7QUFDWCxlQURXO09BQWI7O0FBSUEsVUFBSSxPQUFKLEVBQWE7QUFDWCxhQUFLLG9CQUFMLENBQTBCLE9BQTFCLEVBQW1DLE9BQW5DLEVBRFc7T0FBYjs7QUFJQSxVQUFJLFdBQUosRUFBaUI7QUFDZixhQUFLLHdCQUFMLENBQThCLE9BQTlCLEVBQXVDLFdBQXZDLEVBRGU7T0FBakI7OztBQWZxQixVQW9CakIsTUFBSixFQUFZO0FBQ1YsYUFBSyxrQkFBTCxDQUF3QixPQUF4QixFQUFpQyxNQUFqQyxFQURVO09BQVo7Ozs7eUNBS21CLFNBQVMsU0FBUztBQUNyQyxjQUFRLFdBQVIsQ0FBb0I7QUFDbEIsd0JBQWdCLENBQUMsUUFBUSxDQUFSLEVBQVcsUUFBUSxDQUFSLEVBQVcsUUFBUSxDQUFSLENBQXZDO09BREYsRUFEcUM7Ozs7NkNBTWQsU0FBUyxhQUFhO1VBQ3hDLFFBQW9CLFlBQXBCLE1BRHdDO1VBQ2pDLFlBQWEsWUFBYjs7O0FBRGlDO0FBSTdDLFVBQU0sTUFBTSxlQUFTLFVBQVUsQ0FBVixFQUFhLFVBQVUsQ0FBVixFQUFhLFVBQVUsQ0FBVixDQUFuQyxDQUNULEtBRFMsR0FFVCxNQUZTLENBRUYsQ0FBQyxDQUFELENBRkosQ0FKdUM7O0FBUTdDLGNBQVEsV0FBUixDQUFvQjtBQUNsQiw0QkFBb0IsQ0FBQyxNQUFNLENBQU4sRUFBUyxNQUFNLENBQU4sRUFBUyxNQUFNLENBQU4sQ0FBdkM7QUFDQSw2QkFBcUIsQ0FBQyxJQUFJLENBQUosRUFBTyxJQUFJLENBQUosRUFBTyxJQUFJLENBQUosQ0FBcEM7T0FGRixFQVI2Qzs7Ozt1Q0FjNUIsU0FBUyxRQUFRO0FBQ2xDLGVBQVMsa0JBQWtCLEtBQWxCLEdBQTBCLE1BQTFCLEdBQW1DLENBQUMsTUFBRCxDQUFuQyxDQUR5QjtBQUVsQyxVQUFNLGVBQWUsT0FBTyxNQUFQLENBRmE7QUFHbEMsY0FBUSxVQUFSLENBQW1CLGNBQW5CLEVBQW1DLFlBQW5DLEVBSGtDOztBQUtsQyxVQUFNLGlCQUFpQixFQUFqQixDQUw0QjtBQU1sQyxVQUFNLGNBQWMsRUFBZCxDQU40QjtBQU9sQyxVQUFNLGlCQUFpQixFQUFqQixDQVA0QjtBQVFsQyxVQUFNLHNCQUFzQixFQUF0QixDQVI0Qjs7Ozs7O0FBU2xDLDhCQUFvQixpQ0FBcEIsd0dBQTRCO2NBQWpCLHFCQUFpQjtjQUNuQixXQUFzQyxNQUF0QyxTQURtQjtjQUNULFFBQTRCLE1BQTVCLE1BRFM7Y0FDRixVQUFxQixNQUFyQixRQURFO2NBQ08sV0FBWSxNQUFaLFNBRFA7O0FBRTFCLGNBQU0sYUFBYSxTQUFTLE9BQVQsQ0FGTzs7QUFJMUIseUJBQWUsSUFBZixDQUFvQixTQUFTLENBQVQsRUFBWSxTQUFTLENBQVQsRUFBWSxTQUFTLENBQVQsQ0FBNUMsQ0FKMEI7QUFLMUIsc0JBQVksSUFBWixDQUFpQixXQUFXLENBQVgsRUFBYyxXQUFXLENBQVgsRUFBYyxXQUFXLENBQVgsQ0FBN0M7OztBQUwwQix3QkFRMUIsQ0FBZSxJQUFmLENBQW9CLE9BQU8sUUFBUSxRQUFSLENBQVAsQ0FBcEIsRUFSMEI7QUFTMUIsY0FBSSxRQUFKLEVBQWM7QUFDWixnQ0FBb0IsSUFBcEIsQ0FBeUIsU0FBUyxDQUFULEVBQVksU0FBUyxDQUFULEVBQVksU0FBUyxDQUFULENBQWpELENBRFk7V0FBZCxNQUVPO0FBQ0wsZ0NBQW9CLElBQXBCLENBQXlCLENBQXpCLEVBQTRCLENBQTVCLEVBQStCLENBQS9CLEVBREs7V0FGUDtTQVRGOzs7Ozs7Ozs7Ozs7OztPQVRrQzs7QUF5QmxDLFVBQUksZUFBZSxNQUFmLEVBQXVCO0FBQ3pCLGdCQUFRLFdBQVIsQ0FBb0I7QUFDbEIsMkJBQWlCLGNBQWpCO0FBQ0Esd0JBQWMsV0FBZDtTQUZGLEVBRHlCO0FBS3pCLGdCQUFRLFdBQVIsQ0FBb0I7QUFDbEIsNEJBQWtCLGNBQWxCO0FBQ0EsZ0NBQXNCLG1CQUF0QjtTQUZGLEVBTHlCO09BQTNCOzs7Ozs7O2lDQWFXLFNBQVM7VUFDYixNQUFPLEtBQUssTUFBTCxDQUFZLE9BQVosQ0FBUCxJQURhOzs7QUFHcEIsVUFBSSxHQUFKLEVBQVM7eUJBQ29DLElBQXBDLE1BREE7WUFDQSxtQ0FBUSxFQUFDLEdBQUcsR0FBSCxFQUFRLEdBQUcsR0FBSCxFQUFRLEdBQUcsR0FBSCxnQkFEekI7O0FBRVAsZ0JBQVEsV0FBUixDQUFvQjtBQUNsQixvQkFBVSxJQUFWO0FBQ0EscUJBQVcsSUFBSSxJQUFKO0FBQ1gsb0JBQVUsSUFBSSxHQUFKO0FBQ1Ysc0JBQVksQ0FBQyxNQUFNLENBQU4sRUFBUyxNQUFNLENBQU4sRUFBUyxNQUFNLENBQU4sQ0FBL0I7U0FKRixFQUZPO09BQVQsTUFRTztBQUNMLGdCQUFRLFVBQVIsQ0FBbUIsUUFBbkIsRUFBNkIsS0FBN0IsRUFESztPQVJQOzs7O1NBcFRpQjs7Ozs7O0FBbVVyQixNQUFNLFlBQU4sR0FBcUIsT0FBTyxZQUFQO0FBQ3JCLE1BQU0sZ0JBQU4sR0FBeUIsT0FBTyxnQkFBUDtBQUN6QixNQUFNLFdBQU4sR0FBb0IsT0FBTyxXQUFQIiwiZmlsZSI6InNjZW5lLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gU2NlbmUgT2JqZWN0IG1hbmFnZW1lbnQgYW5kIHJlbmRlcmluZ1xuLyogZXNsaW50LWRpc2FibGUgbWF4LXN0YXRlbWVudHMsIG5vLXRyeS1jYXRjaCAqL1xuXG5pbXBvcnQge0NhbWVyYX0gZnJvbSAnLi4vY2FtZXJhJztcbmltcG9ydCBHcm91cCBmcm9tICcuL2dyb3VwJztcbmltcG9ydCB7cGlja01vZGVsc30gZnJvbSAnLi9waWNrJztcbmltcG9ydCB7UHJvZ3JhbX0gZnJvbSAnLi4vd2ViZ2wnO1xuaW1wb3J0IHtWZWMzfSBmcm9tICcuLi9tYXRoJztcbmltcG9ydCB7bWVyZ2V9IGZyb20gJy4uL3V0aWxzJztcbmltcG9ydCAqIGFzIGNvbmZpZyBmcm9tICcuLi9jb25maWcnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxuY29uc3QgREVGQVVMVF9TQ0VORV9PUFRTID0ge1xuICBsaWdodHM6IHtcbiAgICBlbmFibGU6IGZhbHNlLFxuICAgIC8vIGFtYmllbnQgbGlnaHRcbiAgICBhbWJpZW50OiB7cjogMC4yLCBnOiAwLjIsIGI6IDAuMn0sXG4gICAgLy8gZGlyZWN0aW9uYWwgbGlnaHRcbiAgICBkaXJlY3Rpb25hbDoge1xuICAgICAgZGlyZWN0aW9uOiB7eDogMSwgeTogMSwgejogMX0sXG4gICAgICBjb2xvcjoge3I6IDAsIGc6IDAsIGI6IDB9XG4gICAgfVxuICAgIC8vIHBvaW50IGxpZ2h0XG4gICAgLy8gcG9pbnRzOiBbXVxuICB9LFxuICBlZmZlY3RzOiB7XG4gICAgZm9nOiBmYWxzZVxuICAgIC8vIHsgbmVhciwgZmFyLCBjb2xvciB9XG4gIH0sXG4gIGNsZWFyQ29sb3I6IHRydWUsXG4gIGNsZWFyRGVwdGg6IHRydWUsXG4gIGJhY2tncm91bmRDb2xvcjoge3I6IDAsIGc6IDAsIGI6IDAsIGE6IDF9LFxuICBiYWNrZ3JvdW5kRGVwdGg6IDFcbn07XG5cbmNvbnN0IElOVkFMSURfQVJHVU1FTlQgPSAnTHVtYUdMLlNjZW5lIGludmFsaWQgYXJndW1lbnQnO1xuXG4vLyBTY2VuZSBjbGFzc1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2NlbmUgZXh0ZW5kcyBHcm91cCB7XG5cbiAgY29uc3RydWN0b3IoZ2wsIG9wdHMpIHtcbiAgICBhc3NlcnQoZ2wsIElOVkFMSURfQVJHVU1FTlQpO1xuXG4gICAgb3B0cyA9IG1lcmdlKERFRkFVTFRfU0NFTkVfT1BUUywgb3B0cyk7XG5cbiAgICBzdXBlcihvcHRzKTtcblxuICAgIHRoaXMuZ2wgPSBnbDtcbiAgICB0aGlzLmNvbmZpZyA9IG9wdHM7XG4gIH1cblxuICBnZXRQcm9ncmFtKG9iaikge1xuICAgIGNvbnN0IHByb2dyYW0gPSBvYmogPyBvYmoucHJvZ3JhbSA6IHRoaXMucHJvZ3JhbTtcbiAgICBhc3NlcnQocHJvZ3JhbSBpbnN0YW5jZW9mIFByb2dyYW0sICdTY2VuZSBmYWlsZWQgdG8gZmluZCB2YWxpZCBwcm9ncmFtJyk7XG4gICAgcHJvZ3JhbS51c2UoKTtcbiAgICByZXR1cm4gcHJvZ3JhbTtcbiAgfVxuXG4gIGRlZmluZUJ1ZmZlcnMob2JqKSB7XG4gICAgY29uc3QgcHJvZ3JhbSA9IHRoaXMuZ2V0UHJvZ3JhbShvYmopO1xuICAgIGNvbnN0IHByZXZEeW5hbWljID0gb2JqLmR5bmFtaWM7XG4gICAgb2JqLmR5bmFtaWMgPSB0cnVlO1xuICAgIG9iai5zZXRQcm9ncmFtU3RhdGUocHJvZ3JhbSk7XG4gICAgb2JqLmR5bmFtaWMgPSBwcmV2RHluYW1pYztcbiAgICBvYmoudW5zZXRQcm9ncmFtU3RhdGUocHJvZ3JhbSk7XG4gIH1cblxuICBjbGVhcihnbCkge1xuICAgIGlmICh0aGlzLmNvbmZpZy5jbGVhckNvbG9yKSB7XG4gICAgICBjb25zdCBiZyA9IHRoaXMuY29uZmlnLmJhY2tncm91bmRDb2xvcjtcbiAgICAgIGdsLmNsZWFyQ29sb3IoYmcuciwgYmcuZywgYmcuYiwgYmcuYSk7XG4gICAgfVxuICAgIGlmICh0aGlzLmNvbmZpZy5jbGVhckRlcHRoKSB7XG4gICAgICBnbC5jbGVhckRlcHRoKHRoaXMuY29uZmlnLmJhY2tncm91bmREZXB0aCk7XG4gICAgfVxuICAgIGlmICh0aGlzLmNvbmZpZy5jbGVhckNvbG9yICYmIHRoaXMuY29uZmlnLmNsZWFyRGVwdGgpIHtcbiAgICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQgfCBnbC5ERVBUSF9CVUZGRVJfQklUKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuY29uZmlnLmNsZWFyQ29sb3IpIHtcbiAgICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5jb25maWcuY2xlYXJEZXB0aCkge1xuICAgICAgZ2wuY2xlYXIoZ2wuREVQVEhfQlVGRkVSX0JJVCk7XG4gICAgfVxuICB9XG5cbiAgLy8gUmVuZGVycyBhbGwgb2JqZWN0cyBpbiB0aGUgc2NlbmUuXG4gIHJlbmRlcihnbCwge1xuICAgIGNhbWVyYSxcbiAgICBvbkJlZm9yZVJlbmRlciA9IG5vb3AsXG4gICAgb25BZnRlclJlbmRlciA9IG5vb3AsXG4gICAgY29udGV4dCA9IHt9LFxuICAgIC4uLm9wdHNcbiAgfSA9IHt9KSB7XG4gICAgYXNzZXJ0KGNhbWVyYSBpbnN0YW5jZW9mIENhbWVyYSk7XG5cbiAgICB0aGlzLmNsZWFyKGdsKTtcblxuICAgIC8vIEdvIHRocm91Z2ggZWFjaCBtb2RlbCBhbmQgcmVuZGVyIGl0LlxuICAgIGZvciAoY29uc3QgbW9kZWwgb2YgdGhpcy50cmF2ZXJzZSh7dmlld01hdHJpeDogY2FtZXJhLnZpZXd9KSkge1xuICAgICAgaWYgKG1vZGVsLmRpc3BsYXkpIHtcbiAgICAgICAgb25CZWZvcmVSZW5kZXIobW9kZWwsIGNvbnRleHQpO1xuICAgICAgICB0aGlzLnJlbmRlck9iamVjdChnbCwgbW9kZWwpO1xuICAgICAgICBvbkFmdGVyUmVuZGVyKG1vZGVsLCBjb250ZXh0KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZW5kZXJPYmplY3QoZ2wsIG1vZGVsLCBjYW1lcmEsIGNvbnRleHQgPSB7fSkge1xuICAgIG1vZGVsLnNldFByb2dyYW1TdGF0ZSgpO1xuICAgIG1vZGVsLm9uQmVmb3JlUmVuZGVyKGNhbWVyYSwgY29udGV4dCk7XG5cbiAgICBjb25zdCBwcm9ncmFtID0gdGhpcy5nZXRQcm9ncmFtKG1vZGVsKTtcblxuICAgIC8vIFNldHVwIGxpZ2h0aW5nIGFuZCBzY2VuZSBlZmZlY3RzIGxpa2UgZm9nLCBldGMuXG4gICAgdGhpcy5zZXR1cExpZ2h0aW5nKHByb2dyYW0pO1xuICAgIHRoaXMuc2V0dXBFZmZlY3RzKHByb2dyYW0pO1xuXG4gICAgLy8gQ2FtZXJhIGV4cG9zZXMgdW5pZm9ybXMgdGhhdCBjYW4gYmUgdXNlZCBkaXJlY3RseSBpbiBzaGFkZXJzXG4gICAgaWYgKGNhbWVyYSkge1xuICAgICAgcHJvZ3JhbS5zZXRVbmlmb3JtcyhjYW1lcmEuZ2V0VW5pZm9ybXMoKSk7XG4gICAgfVxuXG4gICAgLy8gTm93IHNldCB2aWV3IGFuZCBub3JtYWwgbWF0cmljZXNcbiAgICAvLyBjb25zdCBjb29yZGluYXRlVW5pZm9ybXMgPSBtb2RlbC5nZXRDb29yZGluYXRlVW5pZm9ybXMoY2FtZXJhLnZpZXcpO1xuICAgIC8vIHByb2dyYW0uc2V0VW5pZm9ybXMoY29vcmRpbmF0ZVVuaWZvcm1zKTtcblxuICAgIC8vIERyYXdcbiAgICBtb2RlbC5yZW5kZXIoZ2wsIHt2aWV3TWF0cml4OiBjYW1lcmEudmlld30pO1xuXG4gICAgbW9kZWwub25BZnRlclJlbmRlcihjYW1lcmEsIGNvbnRleHQpO1xuICAgIG1vZGVsLnVuc2V0UHJvZ3JhbVN0YXRlKCk7XG4gIH1cblxuICAvLyBUT0RPIC0gdGhpcyBpcyB0aGUgbmV3IHBpY2tpbmcgZm9yIGRlY2suZ2xcbiAgcGlja01vZGVscyhnbCwge2NhbWVyYSwgeCwgeSwgLi4ub3B0c30pIHtcbiAgICBjb25zdCB7dmlldzogdmlld01hdHJpeH0gPSBjYW1lcmE7XG4gICAgcmV0dXJuIHBpY2tNb2RlbHMoZ2wsIHtncm91cDogdGhpcywgdmlld01hdHJpeCwgeCwgeSwgLi4ub3B0c30pO1xuICB9XG5cbiAgLypcbiAgcGljayh4LCB5LCBvcHQgPSB7fSkge1xuICAgIGNvbnN0IGdsID0gdGhpcy5nbDtcblxuICAgIGlmICh0aGlzLnBpY2tpbmdGQk8gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5waWNraW5nRkJPID0gbmV3IEZyYW1lYnVmZmVyKGdsLCB7XG4gICAgICAgIHdpZHRoOiBnbC5jYW52YXMud2lkdGgsXG4gICAgICAgIGhlaWdodDogZ2wuY2FudmFzLmhlaWdodFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMucGlja2luZ1Byb2dyYW0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5waWNraW5nUHJvZ3JhbSA9XG4gICAgICAgIG9wdC5waWNraW5nUHJvZ3JhbSB8fCBtYWtlUHJvZ3JhbUZyb21EZWZhdWx0U2hhZGVycyhnbCk7XG4gICAgfVxuXG4gICAgbGV0IHBpY2tpbmdQcm9ncmFtID0gdGhpcy5waWNraW5nUHJvZ3JhbTtcblxuICAgIHBpY2tpbmdQcm9ncmFtLnVzZSgpO1xuICAgIHBpY2tpbmdQcm9ncmFtLnNldFVuaWZvcm0oJ2VuYWJsZVBpY2tpbmcnLCB0cnVlKTtcbiAgICBwaWNraW5nUHJvZ3JhbS5zZXRVbmlmb3JtKCdoYXNQaWNraW5nQ29sb3JzJywgZmFsc2UpO1xuXG4gICAgdGhpcy5waWNraW5nRkJPLmJpbmQoKTtcblxuICAgIGxldCBoYXNoID0ge307XG5cbiAgICBnbC5lbmFibGUoZ2wuU0NJU1NPUl9URVNUKTtcbiAgICBnbC5zY2lzc29yKHgsIGdsLmNhbnZhcy5oZWlnaHQgLSB5LCAxLCAxKTtcblxuICAgIGNvbnN0IG9sZENsZWFyQ29sb3IgPSB0aGlzLmNsZWFyQ29sb3I7XG4gICAgY29uc3Qgb2xkQmFja2dyb3VuZENvbG9yID0gdGhpcy5iYWNrZ3JvdW5kQ29sb3I7XG4gICAgdGhpcy5jbGVhckNvbG9yID0gdHJ1ZTtcbiAgICB0aGlzLmJhY2tncm91bmRDb2xvciA9IHtyOiAwLCBnOiAwLCBiOiAwLCBhOiAwfTtcblxuICAgIHRoaXMucmVuZGVyKHtcbiAgICAgIHJlbmRlclByb2dyYW06IHBpY2tpbmdQcm9ncmFtLFxuICAgICAgb25CZWZvcmVSZW5kZXI6IGZ1bmN0aW9uKGVsZW0sIGkpIHtcbiAgICAgICAgaSsrO1xuICAgICAgICBsZXQgciA9IGkgJSAyNTY7XG4gICAgICAgIGxldCBnID0gKChpIC8gMjU2KSA+PiAwKSAlIDI1NjtcbiAgICAgICAgbGV0IGIgPSAoKGkgLyAoMjU2ICogMjU2KSkgPj4gMCkgJSAyNTY7XG4gICAgICAgIGhhc2hbW3IsIGcsIGJdXSA9IGVsZW07XG4gICAgICAgIHBpY2tpbmdQcm9ncmFtLnNldFVuaWZvcm0oJ3BpY2tDb2xvcicsIFtyIC8gMjU1LCBnIC8gMjU1LCBiIC8gMjU1XSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBnbC5kaXNhYmxlKGdsLlNDSVNTT1JfVEVTVCk7XG5cbiAgICBjb25zdCBwaXhlbCA9IG5ldyBVaW50OEFycmF5KDQpO1xuXG4gICAgZ2wucmVhZFBpeGVscyhcbiAgICAgIHgsIGdsLmNhbnZhcy5oZWlnaHQgLSB5LCAxLCAxLCBnbC5SR0JBLCBnbC5VTlNJR05FRF9CWVRFLCBwaXhlbFxuICAgICk7XG5cbiAgICBnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIG51bGwpO1xuICAgIHRoaXMuY2xlYXJDb2xvciA9IG9sZENsZWFyQ29sb3I7XG4gICAgdGhpcy5iYWNrZ3JvdW5kQ29sb3IgPSBvbGRCYWNrZ3JvdW5kQ29sb3I7XG5cbiAgICBsZXQgciA9IHBpeGVsWzBdO1xuICAgIGxldCBnID0gcGl4ZWxbMV07XG4gICAgbGV0IGIgPSBwaXhlbFsyXTtcblxuICAgIHJldHVybiBoYXNoW1tyLCBnLCBiXV07XG4gIH1cblxuICBwaWNrQ3VzdG9tKHgsIHksIG9wdCA9IHt9KSB7XG4gICAgY29uc3QgZ2wgPSB0aGlzLmdsO1xuXG4gICAgaWYgKHRoaXMucGlja2luZ0ZCTyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnBpY2tpbmdGQk8gPSBuZXcgRnJhbWVidWZmZXIoZ2wsIHtcbiAgICAgICAgd2lkdGg6IGdsLmNhbnZhcy53aWR0aCxcbiAgICAgICAgaGVpZ2h0OiBnbC5jYW52YXMuaGVpZ2h0XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5waWNraW5nUHJvZ3JhbSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnBpY2tpbmdQcm9ncmFtID1cbiAgICAgICAgb3B0LnBpY2tpbmdQcm9ncmFtIHx8IG1ha2VQcm9ncmFtRnJvbURlZmF1bHRTaGFkZXJzKGdsKTtcbiAgICB9XG5cbiAgICBsZXQgcGlja2luZ1Byb2dyYW0gPSB0aGlzLnBpY2tpbmdQcm9ncmFtO1xuXG4gICAgcGlja2luZ1Byb2dyYW0udXNlKCk7XG4gICAgcGlja2luZ1Byb2dyYW0uc2V0VW5pZm9ybSgnZW5hYmxlUGlja2luZycsIHRydWUpO1xuICAgIHBpY2tpbmdQcm9ncmFtLnNldFVuaWZvcm0oJ2hhc1BpY2tpbmdDb2xvcnMnLCB0cnVlKTtcblxuICAgIHRoaXMucGlja2luZ0ZCTy5iaW5kKCk7XG5cbiAgICBnbC5lbmFibGUoZ2wuU0NJU1NPUl9URVNUKTtcbiAgICBnbC5zY2lzc29yKHgsIGdsLmNhbnZhcy5oZWlnaHQgLSB5LCAxLCAxKTtcblxuICAgIGNvbnN0IG9sZENsZWFyQ29sb3IgPSB0aGlzLmNsZWFyQ29sb3I7XG4gICAgY29uc3Qgb2xkQmFja2dyb3VuZENvbG9yID0gdGhpcy5iYWNrZ3JvdW5kQ29sb3I7XG4gICAgdGhpcy5jbGVhckNvbG9yID0gdHJ1ZTtcbiAgICB0aGlzLmJhY2tncm91bmRDb2xvciA9IHtyOiAyNTUsIGc6IDAsIGI6IDAsIGE6IDI1NX07XG5cbiAgICB0aGlzLnJlbmRlcih7XG4gICAgICByZW5kZXJQcm9ncmFtOiBwaWNraW5nUHJvZ3JhbVxuICAgIH0pO1xuXG4gICAgZ2wuZGlzYWJsZShnbC5TQ0lTU09SX1RFU1QpO1xuXG4gICAgY29uc3QgcGl4ZWwgPSBuZXcgVWludDhBcnJheSg0KTtcblxuICAgIGdsLnJlYWRQaXhlbHMoXG4gICAgICB4LCBnbC5jYW52YXMuaGVpZ2h0IC0geSwgMSwgMSwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgcGl4ZWxcbiAgICApO1xuXG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBudWxsKTtcbiAgICB0aGlzLmNsZWFyQ29sb3IgPSBvbGRDbGVhckNvbG9yO1xuICAgIHRoaXMuYmFja2dyb3VuZENvbG9yID0gb2xkQmFja2dyb3VuZENvbG9yO1xuXG4gICAgbGV0IHIgPSBwaXhlbFswXTtcbiAgICBsZXQgZyA9IHBpeGVsWzFdO1xuICAgIGxldCBiID0gcGl4ZWxbMl07XG4gICAgbGV0IGEgPSBwaXhlbFszXTtcblxuICAgIHJldHVybiBbciwgZywgYiwgYV07XG4gIH1cbiAgKi9cblxuICAvLyBTZXR1cCB0aGUgbGlnaHRpbmcgc3lzdGVtOiBhbWJpZW50LCBkaXJlY3Rpb25hbCwgcG9pbnQgbGlnaHRzLlxuICBzZXR1cExpZ2h0aW5nKHByb2dyYW0pIHtcbiAgICAvLyBTZXR1cCBMaWdodGluZ1xuICAgIGxldCB7ZW5hYmxlLCBhbWJpZW50LCBkaXJlY3Rpb25hbCwgcG9pbnRzfSA9IHRoaXMuY29uZmlnLmxpZ2h0cztcblxuICAgIC8vIFNldCBsaWdodCB1bmlmb3Jtcy4gQW1iaWVudCBhbmQgZGlyZWN0aW9uYWwgbGlnaHRzLlxuICAgIHByb2dyYW0uc2V0VW5pZm9ybSgnZW5hYmxlTGlnaHRzJywgZW5hYmxlKTtcblxuICAgIGlmICghZW5hYmxlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGFtYmllbnQpIHtcbiAgICAgIHRoaXMuc2V0dXBBbWJpZW50TGlnaHRpbmcocHJvZ3JhbSwgYW1iaWVudCk7XG4gICAgfVxuXG4gICAgaWYgKGRpcmVjdGlvbmFsKSB7XG4gICAgICB0aGlzLnNldHVwRGlyZWN0aW9uYWxMaWdodGluZyhwcm9ncmFtLCBkaXJlY3Rpb25hbCk7XG4gICAgfVxuXG4gICAgLy8gU2V0IHBvaW50IGxpZ2h0c1xuICAgIGlmIChwb2ludHMpIHtcbiAgICAgIHRoaXMuc2V0dXBQb2ludExpZ2h0aW5nKHByb2dyYW0sIHBvaW50cyk7XG4gICAgfVxuICB9XG5cbiAgc2V0dXBBbWJpZW50TGlnaHRpbmcocHJvZ3JhbSwgYW1iaWVudCkge1xuICAgIHByb2dyYW0uc2V0VW5pZm9ybXMoe1xuICAgICAgJ2FtYmllbnRDb2xvcic6IFthbWJpZW50LnIsIGFtYmllbnQuZywgYW1iaWVudC5iXVxuICAgIH0pO1xuICB9XG5cbiAgc2V0dXBEaXJlY3Rpb25hbExpZ2h0aW5nKHByb2dyYW0sIGRpcmVjdGlvbmFsKSB7XG4gICAgbGV0IHtjb2xvciwgZGlyZWN0aW9ufSA9IGRpcmVjdGlvbmFsO1xuXG4gICAgLy8gTm9ybWFsaXplIGxpZ2h0aW5nIGRpcmVjdGlvbiB2ZWN0b3JcbiAgICBjb25zdCBkaXIgPSBuZXcgVmVjMyhkaXJlY3Rpb24ueCwgZGlyZWN0aW9uLnksIGRpcmVjdGlvbi56KVxuICAgICAgLiR1bml0KClcbiAgICAgIC4kc2NhbGUoLTEpO1xuXG4gICAgcHJvZ3JhbS5zZXRVbmlmb3Jtcyh7XG4gICAgICAnZGlyZWN0aW9uYWxDb2xvcic6IFtjb2xvci5yLCBjb2xvci5nLCBjb2xvci5iXSxcbiAgICAgICdsaWdodGluZ0RpcmVjdGlvbic6IFtkaXIueCwgZGlyLnksIGRpci56XVxuICAgIH0pO1xuICB9XG5cbiAgc2V0dXBQb2ludExpZ2h0aW5nKHByb2dyYW0sIHBvaW50cykge1xuICAgIHBvaW50cyA9IHBvaW50cyBpbnN0YW5jZW9mIEFycmF5ID8gcG9pbnRzIDogW3BvaW50c107XG4gICAgY29uc3QgbnVtYmVyUG9pbnRzID0gcG9pbnRzLmxlbmd0aDtcbiAgICBwcm9ncmFtLnNldFVuaWZvcm0oJ251bWJlclBvaW50cycsIG51bWJlclBvaW50cyk7XG5cbiAgICBjb25zdCBwb2ludExvY2F0aW9ucyA9IFtdO1xuICAgIGNvbnN0IHBvaW50Q29sb3JzID0gW107XG4gICAgY29uc3QgZW5hYmxlU3BlY3VsYXIgPSBbXTtcbiAgICBjb25zdCBwb2ludFNwZWN1bGFyQ29sb3JzID0gW107XG4gICAgZm9yIChjb25zdCBwb2ludCBvZiBwb2ludHMpIHtcbiAgICAgIGNvbnN0IHtwb3NpdGlvbiwgY29sb3IsIGRpZmZ1c2UsIHNwZWN1bGFyfSA9IHBvaW50O1xuICAgICAgY29uc3QgcG9pbnRDb2xvciA9IGNvbG9yIHx8IGRpZmZ1c2U7XG5cbiAgICAgIHBvaW50TG9jYXRpb25zLnB1c2gocG9zaXRpb24ueCwgcG9zaXRpb24ueSwgcG9zaXRpb24ueik7XG4gICAgICBwb2ludENvbG9ycy5wdXNoKHBvaW50Q29sb3IuciwgcG9pbnRDb2xvci5nLCBwb2ludENvbG9yLmIpO1xuXG4gICAgICAvLyBBZGQgc3BlY3VsYXIgY29sb3JcbiAgICAgIGVuYWJsZVNwZWN1bGFyLnB1c2goTnVtYmVyKEJvb2xlYW4oc3BlY3VsYXIpKSk7XG4gICAgICBpZiAoc3BlY3VsYXIpIHtcbiAgICAgICAgcG9pbnRTcGVjdWxhckNvbG9ycy5wdXNoKHNwZWN1bGFyLnIsIHNwZWN1bGFyLmcsIHNwZWN1bGFyLmIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcG9pbnRTcGVjdWxhckNvbG9ycy5wdXNoKDAsIDAsIDApO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb2ludExvY2F0aW9ucy5sZW5ndGgpIHtcbiAgICAgIHByb2dyYW0uc2V0VW5pZm9ybXMoe1xuICAgICAgICAncG9pbnRMb2NhdGlvbic6IHBvaW50TG9jYXRpb25zLFxuICAgICAgICAncG9pbnRDb2xvcic6IHBvaW50Q29sb3JzXG4gICAgICB9KTtcbiAgICAgIHByb2dyYW0uc2V0VW5pZm9ybXMoe1xuICAgICAgICAnZW5hYmxlU3BlY3VsYXInOiBlbmFibGVTcGVjdWxhcixcbiAgICAgICAgJ3BvaW50U3BlY3VsYXJDb2xvcic6IHBvaW50U3BlY3VsYXJDb2xvcnNcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8vIFNldHVwIGVmZmVjdHMgbGlrZSBmb2csIGV0Yy5cbiAgc2V0dXBFZmZlY3RzKHByb2dyYW0pIHtcbiAgICBjb25zdCB7Zm9nfSA9IHRoaXMuY29uZmlnLmVmZmVjdHM7XG5cbiAgICBpZiAoZm9nKSB7XG4gICAgICBjb25zdCB7Y29sb3IgPSB7cjogMC41LCBnOiAwLjUsIGI6IDAuNX19ID0gZm9nO1xuICAgICAgcHJvZ3JhbS5zZXRVbmlmb3Jtcyh7XG4gICAgICAgICdoYXNGb2cnOiB0cnVlLFxuICAgICAgICAnZm9nTmVhcic6IGZvZy5uZWFyLFxuICAgICAgICAnZm9nRmFyJzogZm9nLmZhcixcbiAgICAgICAgJ2ZvZ0NvbG9yJzogW2NvbG9yLnIsIGNvbG9yLmcsIGNvbG9yLmJdXG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJvZ3JhbS5zZXRVbmlmb3JtKCdoYXNGb2cnLCBmYWxzZSk7XG4gICAgfVxuICB9XG5cbn1cblxuU2NlbmUuTUFYX1RFWFRVUkVTID0gY29uZmlnLk1BWF9URVhUVVJFUztcblNjZW5lLk1BWF9QT0lOVF9MSUdIVFMgPSBjb25maWcuTUFYX1BPSU5UX0xJR0hUUztcblNjZW5lLlBJQ0tJTkdfUkVTID0gY29uZmlnLlBJQ0tJTkdfUkVTO1xuIl19