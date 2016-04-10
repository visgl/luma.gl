'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.OrthoCamera = exports.PerspectiveCamera = exports.Camera = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // camera.js
// Provides a Camera with ModelView and Projection matrices

var _math = require('./math');

var _utils = require('./utils');

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Camera = exports.Camera = function () {
  function Camera(opts) {
    _classCallCheck(this, Camera);

    opts = (0, _utils.merge)({
      fov: 45,
      near: 0.1,
      far: 500,
      aspect: 1,
      position: new _math.Vec3(0, 0, 0),
      target: new _math.Vec3(0, 0, -1),
      up: new _math.Vec3(0, 1, 0)
    }, opts);
    this.fov = opts.fov;
    this.near = opts.near;
    this.far = opts.far;
    this.aspect = opts.aspect;
    this.position = opts.position;
    this.target = opts.target;
    this.up = opts.up;
    this.view = new _math.Mat4();
    this.uniforms = {};

    this.projection = new _math.Mat4();
    Object.seal(this);

    this.update();
  }

  _createClass(Camera, [{
    key: 'getUniforms',
    value: function getUniforms() {
      return this.uniforms;
    }
  }, {
    key: '_updateUniforms',
    value: function _updateUniforms() {
      var viewProjection = this.view.mulMat4(this.projection);
      var viewProjectionInverse = viewProjection.invert();
      this.uniforms = {
        cameraPosition: this.position,
        projectionMatrix: this.projection,
        viewMatrix: this.view,
        viewProjectionMatrix: viewProjection,
        viewInverseMatrix: this.view.invert(),
        viewProjectionInverseMatrix: viewProjectionInverse
      };
    }
  }]);

  return Camera;
}();

var PerspectiveCamera = exports.PerspectiveCamera = function (_Camera) {
  _inherits(PerspectiveCamera, _Camera);

  function PerspectiveCamera() {
    _classCallCheck(this, PerspectiveCamera);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(PerspectiveCamera).apply(this, arguments));
  }

  _createClass(PerspectiveCamera, [{
    key: 'update',
    value: function update() {
      this.projection = new _math.Mat4().perspective(this.fov, this.aspect, this.near, this.far);
      this.view.lookAt(this.position, this.target, this.up);
      this._updateUniforms();
    }
  }]);

  return PerspectiveCamera;
}(Camera);

var OrthoCamera = exports.OrthoCamera = function () {
  function OrthoCamera() {
    _classCallCheck(this, OrthoCamera);
  }

  _createClass(OrthoCamera, [{
    key: 'update',
    value: function update() {
      var ymax = this.near * Math.tan(this.fov * Math.PI / 360);
      var ymin = -ymax;
      var xmin = ymin * this.aspect;
      var xmax = ymax * this.aspect;
      this.projection = new _math.Mat4().ortho(xmin, xmax, ymin, ymax, this.near, this.far);
      this.view.lookAt(this.position, this.target, this.up);
      this._updateUniforms();
    }
  }]);

  return OrthoCamera;
}();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jYW1lcmEuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUdBOztBQUNBOzs7Ozs7OztJQUVhO0FBRVgsV0FGVyxNQUVYLENBQVksSUFBWixFQUFrQjswQkFGUCxRQUVPOztBQUNoQixXQUFPLGtCQUFNO0FBQ1gsV0FBSyxFQUFMO0FBQ0EsWUFBTSxHQUFOO0FBQ0EsV0FBSyxHQUFMO0FBQ0EsY0FBUSxDQUFSO0FBQ0EsZ0JBQVUsZUFBUyxDQUFULEVBQVksQ0FBWixFQUFlLENBQWYsQ0FBVjtBQUNBLGNBQVEsZUFBUyxDQUFULEVBQVksQ0FBWixFQUFlLENBQUMsQ0FBRCxDQUF2QjtBQUNBLFVBQUksZUFBUyxDQUFULEVBQVksQ0FBWixFQUFlLENBQWYsQ0FBSjtLQVBLLEVBUUosSUFSSSxDQUFQLENBRGdCO0FBVWhCLFNBQUssR0FBTCxHQUFXLEtBQUssR0FBTCxDQVZLO0FBV2hCLFNBQUssSUFBTCxHQUFZLEtBQUssSUFBTCxDQVhJO0FBWWhCLFNBQUssR0FBTCxHQUFXLEtBQUssR0FBTCxDQVpLO0FBYWhCLFNBQUssTUFBTCxHQUFjLEtBQUssTUFBTCxDQWJFO0FBY2hCLFNBQUssUUFBTCxHQUFnQixLQUFLLFFBQUwsQ0FkQTtBQWVoQixTQUFLLE1BQUwsR0FBYyxLQUFLLE1BQUwsQ0FmRTtBQWdCaEIsU0FBSyxFQUFMLEdBQVUsS0FBSyxFQUFMLENBaEJNO0FBaUJoQixTQUFLLElBQUwsR0FBWSxnQkFBWixDQWpCZ0I7QUFrQmhCLFNBQUssUUFBTCxHQUFnQixFQUFoQixDQWxCZ0I7O0FBb0JoQixTQUFLLFVBQUwsR0FBa0IsZ0JBQWxCLENBcEJnQjtBQXFCaEIsV0FBTyxJQUFQLENBQVksSUFBWixFQXJCZ0I7O0FBdUJoQixTQUFLLE1BQUwsR0F2QmdCO0dBQWxCOztlQUZXOztrQ0E0Qkc7QUFDWixhQUFPLEtBQUssUUFBTCxDQURLOzs7O3NDQUlJO0FBQ2hCLFVBQU0saUJBQWlCLEtBQUssSUFBTCxDQUFVLE9BQVYsQ0FBa0IsS0FBSyxVQUFMLENBQW5DLENBRFU7QUFFaEIsVUFBTSx3QkFBd0IsZUFBZSxNQUFmLEVBQXhCLENBRlU7QUFHaEIsV0FBSyxRQUFMLEdBQWdCO0FBQ2Qsd0JBQWdCLEtBQUssUUFBTDtBQUNoQiwwQkFBa0IsS0FBSyxVQUFMO0FBQ2xCLG9CQUFZLEtBQUssSUFBTDtBQUNaLDhCQUFzQixjQUF0QjtBQUNBLDJCQUFtQixLQUFLLElBQUwsQ0FBVSxNQUFWLEVBQW5CO0FBQ0EscUNBQTZCLHFCQUE3QjtPQU5GLENBSGdCOzs7O1NBaENQOzs7SUErQ0E7Ozs7Ozs7Ozs7OzZCQUVGO0FBQ1AsV0FBSyxVQUFMLEdBQ0UsaUJBQVcsV0FBWCxDQUF1QixLQUFLLEdBQUwsRUFBVSxLQUFLLE1BQUwsRUFBYSxLQUFLLElBQUwsRUFBVyxLQUFLLEdBQUwsQ0FEM0QsQ0FETztBQUdQLFdBQUssSUFBTCxDQUFVLE1BQVYsQ0FBaUIsS0FBSyxRQUFMLEVBQWUsS0FBSyxNQUFMLEVBQWEsS0FBSyxFQUFMLENBQTdDLENBSE87QUFJUCxXQUFLLGVBQUwsR0FKTzs7OztTQUZFO0VBQTBCOztJQVcxQjs7Ozs7Ozs2QkFFRjtBQUNQLFVBQU0sT0FBTyxLQUFLLElBQUwsR0FBWSxLQUFLLEdBQUwsQ0FBUyxLQUFLLEdBQUwsR0FBVyxLQUFLLEVBQUwsR0FBVSxHQUFyQixDQUFyQixDQUROO0FBRVAsVUFBTSxPQUFPLENBQUMsSUFBRCxDQUZOO0FBR1AsVUFBTSxPQUFPLE9BQU8sS0FBSyxNQUFMLENBSGI7QUFJUCxVQUFNLE9BQU8sT0FBTyxLQUFLLE1BQUwsQ0FKYjtBQUtQLFdBQUssVUFBTCxHQUNFLGlCQUFXLEtBQVgsQ0FBaUIsSUFBakIsRUFBdUIsSUFBdkIsRUFBNkIsSUFBN0IsRUFBbUMsSUFBbkMsRUFBeUMsS0FBSyxJQUFMLEVBQVcsS0FBSyxHQUFMLENBRHRELENBTE87QUFPUCxXQUFLLElBQUwsQ0FBVSxNQUFWLENBQWlCLEtBQUssUUFBTCxFQUFlLEtBQUssTUFBTCxFQUFhLEtBQUssRUFBTCxDQUE3QyxDQVBPO0FBUVAsV0FBSyxlQUFMLEdBUk87Ozs7U0FGRSIsImZpbGUiOiJjYW1lcmEuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBjYW1lcmEuanNcbi8vIFByb3ZpZGVzIGEgQ2FtZXJhIHdpdGggTW9kZWxWaWV3IGFuZCBQcm9qZWN0aW9uIG1hdHJpY2VzXG5cbmltcG9ydCB7VmVjMywgTWF0NH0gZnJvbSAnLi9tYXRoJztcbmltcG9ydCB7bWVyZ2V9IGZyb20gJy4vdXRpbHMnO1xuXG5leHBvcnQgY2xhc3MgQ2FtZXJhIHtcblxuICBjb25zdHJ1Y3RvcihvcHRzKSB7XG4gICAgb3B0cyA9IG1lcmdlKHtcbiAgICAgIGZvdjogNDUsXG4gICAgICBuZWFyOiAwLjEsXG4gICAgICBmYXI6IDUwMCxcbiAgICAgIGFzcGVjdDogMSxcbiAgICAgIHBvc2l0aW9uOiBuZXcgVmVjMygwLCAwLCAwKSxcbiAgICAgIHRhcmdldDogbmV3IFZlYzMoMCwgMCwgLTEpLFxuICAgICAgdXA6IG5ldyBWZWMzKDAsIDEsIDApXG4gICAgfSwgb3B0cyk7XG4gICAgdGhpcy5mb3YgPSBvcHRzLmZvdjtcbiAgICB0aGlzLm5lYXIgPSBvcHRzLm5lYXI7XG4gICAgdGhpcy5mYXIgPSBvcHRzLmZhcjtcbiAgICB0aGlzLmFzcGVjdCA9IG9wdHMuYXNwZWN0O1xuICAgIHRoaXMucG9zaXRpb24gPSBvcHRzLnBvc2l0aW9uO1xuICAgIHRoaXMudGFyZ2V0ID0gb3B0cy50YXJnZXQ7XG4gICAgdGhpcy51cCA9IG9wdHMudXA7XG4gICAgdGhpcy52aWV3ID0gbmV3IE1hdDQoKTtcbiAgICB0aGlzLnVuaWZvcm1zID0ge307XG5cbiAgICB0aGlzLnByb2plY3Rpb24gPSBuZXcgTWF0NCgpO1xuICAgIE9iamVjdC5zZWFsKHRoaXMpO1xuXG4gICAgdGhpcy51cGRhdGUoKTtcbiAgfVxuXG4gIGdldFVuaWZvcm1zKCkge1xuICAgIHJldHVybiB0aGlzLnVuaWZvcm1zO1xuICB9XG5cbiAgX3VwZGF0ZVVuaWZvcm1zKCkge1xuICAgIGNvbnN0IHZpZXdQcm9qZWN0aW9uID0gdGhpcy52aWV3Lm11bE1hdDQodGhpcy5wcm9qZWN0aW9uKTtcbiAgICBjb25zdCB2aWV3UHJvamVjdGlvbkludmVyc2UgPSB2aWV3UHJvamVjdGlvbi5pbnZlcnQoKTtcbiAgICB0aGlzLnVuaWZvcm1zID0ge1xuICAgICAgY2FtZXJhUG9zaXRpb246IHRoaXMucG9zaXRpb24sXG4gICAgICBwcm9qZWN0aW9uTWF0cml4OiB0aGlzLnByb2plY3Rpb24sXG4gICAgICB2aWV3TWF0cml4OiB0aGlzLnZpZXcsXG4gICAgICB2aWV3UHJvamVjdGlvbk1hdHJpeDogdmlld1Byb2plY3Rpb24sXG4gICAgICB2aWV3SW52ZXJzZU1hdHJpeDogdGhpcy52aWV3LmludmVydCgpLFxuICAgICAgdmlld1Byb2plY3Rpb25JbnZlcnNlTWF0cml4OiB2aWV3UHJvamVjdGlvbkludmVyc2VcbiAgICB9O1xuICB9XG5cbn1cblxuZXhwb3J0IGNsYXNzIFBlcnNwZWN0aXZlQ2FtZXJhIGV4dGVuZHMgQ2FtZXJhIHtcblxuICB1cGRhdGUoKSB7XG4gICAgdGhpcy5wcm9qZWN0aW9uID1cbiAgICAgIG5ldyBNYXQ0KCkucGVyc3BlY3RpdmUodGhpcy5mb3YsIHRoaXMuYXNwZWN0LCB0aGlzLm5lYXIsIHRoaXMuZmFyKTtcbiAgICB0aGlzLnZpZXcubG9va0F0KHRoaXMucG9zaXRpb24sIHRoaXMudGFyZ2V0LCB0aGlzLnVwKTtcbiAgICB0aGlzLl91cGRhdGVVbmlmb3JtcygpO1xuICB9XG5cbn1cblxuZXhwb3J0IGNsYXNzIE9ydGhvQ2FtZXJhIHtcblxuICB1cGRhdGUoKSB7XG4gICAgY29uc3QgeW1heCA9IHRoaXMubmVhciAqIE1hdGgudGFuKHRoaXMuZm92ICogTWF0aC5QSSAvIDM2MCk7XG4gICAgY29uc3QgeW1pbiA9IC15bWF4O1xuICAgIGNvbnN0IHhtaW4gPSB5bWluICogdGhpcy5hc3BlY3Q7XG4gICAgY29uc3QgeG1heCA9IHltYXggKiB0aGlzLmFzcGVjdDtcbiAgICB0aGlzLnByb2plY3Rpb24gPVxuICAgICAgbmV3IE1hdDQoKS5vcnRobyh4bWluLCB4bWF4LCB5bWluLCB5bWF4LCB0aGlzLm5lYXIsIHRoaXMuZmFyKTtcbiAgICB0aGlzLnZpZXcubG9va0F0KHRoaXMucG9zaXRpb24sIHRoaXMudGFyZ2V0LCB0aGlzLnVwKTtcbiAgICB0aGlzLl91cGRhdGVVbmlmb3JtcygpO1xuICB9XG5cbn1cbiJdfQ==