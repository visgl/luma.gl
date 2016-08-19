'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.OrthoCamera = exports.PerspectiveCamera = exports.Camera = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // camera.js
// Provides a Camera with ModelView and Projection matrices

var _math = require('../math');

var _utils = require('../utils');

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Camera = exports.Camera = function () {
  function Camera() {
    var opts = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

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
    key: 'project',
    value: function project() {
      return null;
    }
  }, {
    key: 'unproject',
    value: function unproject() {
      return null;
    }
  }, {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb3JlL2NhbWVyYS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7O3FqQkFBQTtBQUNBOztBQUVBOztBQUNBOzs7Ozs7OztJQUVhLE0sV0FBQSxNO0FBRVgsb0JBQXVCO0FBQUEsUUFBWCxJQUFXLHlEQUFKLEVBQUk7O0FBQUE7O0FBQ3JCLFdBQU8sa0JBQU07QUFDWCxXQUFLLEVBRE07QUFFWCxZQUFNLEdBRks7QUFHWCxXQUFLLEdBSE07QUFJWCxjQUFRLENBSkc7QUFLWCxnQkFBVSxlQUFTLENBQVQsRUFBWSxDQUFaLEVBQWUsQ0FBZixDQUxDO0FBTVgsY0FBUSxlQUFTLENBQVQsRUFBWSxDQUFaLEVBQWUsQ0FBQyxDQUFoQixDQU5HO0FBT1gsVUFBSSxlQUFTLENBQVQsRUFBWSxDQUFaLEVBQWUsQ0FBZjtBQVBPLEtBQU4sRUFRSixJQVJJLENBQVA7QUFTQSxTQUFLLEdBQUwsR0FBVyxLQUFLLEdBQWhCO0FBQ0EsU0FBSyxJQUFMLEdBQVksS0FBSyxJQUFqQjtBQUNBLFNBQUssR0FBTCxHQUFXLEtBQUssR0FBaEI7QUFDQSxTQUFLLE1BQUwsR0FBYyxLQUFLLE1BQW5CO0FBQ0EsU0FBSyxRQUFMLEdBQWdCLEtBQUssUUFBckI7QUFDQSxTQUFLLE1BQUwsR0FBYyxLQUFLLE1BQW5CO0FBQ0EsU0FBSyxFQUFMLEdBQVUsS0FBSyxFQUFmO0FBQ0EsU0FBSyxJQUFMLEdBQVksZ0JBQVo7QUFDQSxTQUFLLFFBQUwsR0FBZ0IsRUFBaEI7O0FBRUEsU0FBSyxVQUFMLEdBQWtCLGdCQUFsQjtBQUNBLFdBQU8sSUFBUCxDQUFZLElBQVo7O0FBRUEsU0FBSyxNQUFMO0FBQ0Q7Ozs7OEJBRVM7QUFDUixhQUFPLElBQVA7QUFDRDs7O2dDQUVXO0FBQ1YsYUFBTyxJQUFQO0FBQ0Q7OztrQ0FFYTtBQUNaLGFBQU8sS0FBSyxRQUFaO0FBQ0Q7OztzQ0FFaUI7QUFDaEIsVUFBTSxpQkFBaUIsS0FBSyxJQUFMLENBQVUsT0FBVixDQUFrQixLQUFLLFVBQXZCLENBQXZCO0FBQ0EsVUFBTSx3QkFBd0IsZUFBZSxNQUFmLEVBQTlCO0FBQ0EsV0FBSyxRQUFMLEdBQWdCO0FBQ2Qsd0JBQWdCLEtBQUssUUFEUDtBQUVkLDBCQUFrQixLQUFLLFVBRlQ7QUFHZCxvQkFBWSxLQUFLLElBSEg7QUFJZCw4QkFBc0IsY0FKUjtBQUtkLDJCQUFtQixLQUFLLElBQUwsQ0FBVSxNQUFWLEVBTEw7QUFNZCxxQ0FBNkI7QUFOZixPQUFoQjtBQVFEOzs7Ozs7SUFJVSxpQixXQUFBLGlCOzs7Ozs7Ozs7Ozs2QkFFRjtBQUNQLFdBQUssVUFBTCxHQUNFLGlCQUFXLFdBQVgsQ0FBdUIsS0FBSyxHQUE1QixFQUFpQyxLQUFLLE1BQXRDLEVBQThDLEtBQUssSUFBbkQsRUFBeUQsS0FBSyxHQUE5RCxDQURGO0FBRUEsV0FBSyxJQUFMLENBQVUsTUFBVixDQUFpQixLQUFLLFFBQXRCLEVBQWdDLEtBQUssTUFBckMsRUFBNkMsS0FBSyxFQUFsRDtBQUNBLFdBQUssZUFBTDtBQUNEOzs7O0VBUG9DLE07O0lBVzFCLFcsV0FBQSxXOzs7Ozs7OzZCQUVGO0FBQ1AsVUFBTSxPQUFPLEtBQUssSUFBTCxHQUFZLEtBQUssR0FBTCxDQUFTLEtBQUssR0FBTCxHQUFXLEtBQUssRUFBaEIsR0FBcUIsR0FBOUIsQ0FBekI7QUFDQSxVQUFNLE9BQU8sQ0FBQyxJQUFkO0FBQ0EsVUFBTSxPQUFPLE9BQU8sS0FBSyxNQUF6QjtBQUNBLFVBQU0sT0FBTyxPQUFPLEtBQUssTUFBekI7QUFDQSxXQUFLLFVBQUwsR0FDRSxpQkFBVyxLQUFYLENBQWlCLElBQWpCLEVBQXVCLElBQXZCLEVBQTZCLElBQTdCLEVBQW1DLElBQW5DLEVBQXlDLEtBQUssSUFBOUMsRUFBb0QsS0FBSyxHQUF6RCxDQURGO0FBRUEsV0FBSyxJQUFMLENBQVUsTUFBVixDQUFpQixLQUFLLFFBQXRCLEVBQWdDLEtBQUssTUFBckMsRUFBNkMsS0FBSyxFQUFsRDtBQUNBLFdBQUssZUFBTDtBQUNEIiwiZmlsZSI6ImNhbWVyYS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIGNhbWVyYS5qc1xuLy8gUHJvdmlkZXMgYSBDYW1lcmEgd2l0aCBNb2RlbFZpZXcgYW5kIFByb2plY3Rpb24gbWF0cmljZXNcblxuaW1wb3J0IHtWZWMzLCBNYXQ0fSBmcm9tICcuLi9tYXRoJztcbmltcG9ydCB7bWVyZ2V9IGZyb20gJy4uL3V0aWxzJztcblxuZXhwb3J0IGNsYXNzIENhbWVyYSB7XG5cbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgb3B0cyA9IG1lcmdlKHtcbiAgICAgIGZvdjogNDUsXG4gICAgICBuZWFyOiAwLjEsXG4gICAgICBmYXI6IDUwMCxcbiAgICAgIGFzcGVjdDogMSxcbiAgICAgIHBvc2l0aW9uOiBuZXcgVmVjMygwLCAwLCAwKSxcbiAgICAgIHRhcmdldDogbmV3IFZlYzMoMCwgMCwgLTEpLFxuICAgICAgdXA6IG5ldyBWZWMzKDAsIDEsIDApXG4gICAgfSwgb3B0cyk7XG4gICAgdGhpcy5mb3YgPSBvcHRzLmZvdjtcbiAgICB0aGlzLm5lYXIgPSBvcHRzLm5lYXI7XG4gICAgdGhpcy5mYXIgPSBvcHRzLmZhcjtcbiAgICB0aGlzLmFzcGVjdCA9IG9wdHMuYXNwZWN0O1xuICAgIHRoaXMucG9zaXRpb24gPSBvcHRzLnBvc2l0aW9uO1xuICAgIHRoaXMudGFyZ2V0ID0gb3B0cy50YXJnZXQ7XG4gICAgdGhpcy51cCA9IG9wdHMudXA7XG4gICAgdGhpcy52aWV3ID0gbmV3IE1hdDQoKTtcbiAgICB0aGlzLnVuaWZvcm1zID0ge307XG5cbiAgICB0aGlzLnByb2plY3Rpb24gPSBuZXcgTWF0NCgpO1xuICAgIE9iamVjdC5zZWFsKHRoaXMpO1xuXG4gICAgdGhpcy51cGRhdGUoKTtcbiAgfVxuXG4gIHByb2plY3QoKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICB1bnByb2plY3QoKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBnZXRVbmlmb3JtcygpIHtcbiAgICByZXR1cm4gdGhpcy51bmlmb3JtcztcbiAgfVxuXG4gIF91cGRhdGVVbmlmb3JtcygpIHtcbiAgICBjb25zdCB2aWV3UHJvamVjdGlvbiA9IHRoaXMudmlldy5tdWxNYXQ0KHRoaXMucHJvamVjdGlvbik7XG4gICAgY29uc3Qgdmlld1Byb2plY3Rpb25JbnZlcnNlID0gdmlld1Byb2plY3Rpb24uaW52ZXJ0KCk7XG4gICAgdGhpcy51bmlmb3JtcyA9IHtcbiAgICAgIGNhbWVyYVBvc2l0aW9uOiB0aGlzLnBvc2l0aW9uLFxuICAgICAgcHJvamVjdGlvbk1hdHJpeDogdGhpcy5wcm9qZWN0aW9uLFxuICAgICAgdmlld01hdHJpeDogdGhpcy52aWV3LFxuICAgICAgdmlld1Byb2plY3Rpb25NYXRyaXg6IHZpZXdQcm9qZWN0aW9uLFxuICAgICAgdmlld0ludmVyc2VNYXRyaXg6IHRoaXMudmlldy5pbnZlcnQoKSxcbiAgICAgIHZpZXdQcm9qZWN0aW9uSW52ZXJzZU1hdHJpeDogdmlld1Byb2plY3Rpb25JbnZlcnNlXG4gICAgfTtcbiAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBQZXJzcGVjdGl2ZUNhbWVyYSBleHRlbmRzIENhbWVyYSB7XG5cbiAgdXBkYXRlKCkge1xuICAgIHRoaXMucHJvamVjdGlvbiA9XG4gICAgICBuZXcgTWF0NCgpLnBlcnNwZWN0aXZlKHRoaXMuZm92LCB0aGlzLmFzcGVjdCwgdGhpcy5uZWFyLCB0aGlzLmZhcik7XG4gICAgdGhpcy52aWV3Lmxvb2tBdCh0aGlzLnBvc2l0aW9uLCB0aGlzLnRhcmdldCwgdGhpcy51cCk7XG4gICAgdGhpcy5fdXBkYXRlVW5pZm9ybXMoKTtcbiAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBPcnRob0NhbWVyYSB7XG5cbiAgdXBkYXRlKCkge1xuICAgIGNvbnN0IHltYXggPSB0aGlzLm5lYXIgKiBNYXRoLnRhbih0aGlzLmZvdiAqIE1hdGguUEkgLyAzNjApO1xuICAgIGNvbnN0IHltaW4gPSAteW1heDtcbiAgICBjb25zdCB4bWluID0geW1pbiAqIHRoaXMuYXNwZWN0O1xuICAgIGNvbnN0IHhtYXggPSB5bWF4ICogdGhpcy5hc3BlY3Q7XG4gICAgdGhpcy5wcm9qZWN0aW9uID1cbiAgICAgIG5ldyBNYXQ0KCkub3J0aG8oeG1pbiwgeG1heCwgeW1pbiwgeW1heCwgdGhpcy5uZWFyLCB0aGlzLmZhcik7XG4gICAgdGhpcy52aWV3Lmxvb2tBdCh0aGlzLnBvc2l0aW9uLCB0aGlzLnRhcmdldCwgdGhpcy51cCk7XG4gICAgdGhpcy5fdXBkYXRlVW5pZm9ybXMoKTtcbiAgfVxuXG59XG4iXX0=