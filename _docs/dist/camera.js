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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jYW1lcmEuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUdBOztBQUNBOzs7Ozs7OztJQUVhLE0sV0FBQSxNO0FBRVgsb0JBQXVCO0FBQUEsUUFBWCxJQUFXLHlEQUFKLEVBQUk7O0FBQUE7O0FBQ3JCLFdBQU8sa0JBQU07QUFDWCxXQUFLLEVBRE07QUFFWCxZQUFNLEdBRks7QUFHWCxXQUFLLEdBSE07QUFJWCxjQUFRLENBSkc7QUFLWCxnQkFBVSxlQUFTLENBQVQsRUFBWSxDQUFaLEVBQWUsQ0FBZixDQUxDO0FBTVgsY0FBUSxlQUFTLENBQVQsRUFBWSxDQUFaLEVBQWUsQ0FBQyxDQUFoQixDQU5HO0FBT1gsVUFBSSxlQUFTLENBQVQsRUFBWSxDQUFaLEVBQWUsQ0FBZjtBQVBPLEtBQU4sRUFRSixJQVJJLENBQVA7QUFTQSxTQUFLLEdBQUwsR0FBVyxLQUFLLEdBQWhCO0FBQ0EsU0FBSyxJQUFMLEdBQVksS0FBSyxJQUFqQjtBQUNBLFNBQUssR0FBTCxHQUFXLEtBQUssR0FBaEI7QUFDQSxTQUFLLE1BQUwsR0FBYyxLQUFLLE1BQW5CO0FBQ0EsU0FBSyxRQUFMLEdBQWdCLEtBQUssUUFBckI7QUFDQSxTQUFLLE1BQUwsR0FBYyxLQUFLLE1BQW5CO0FBQ0EsU0FBSyxFQUFMLEdBQVUsS0FBSyxFQUFmO0FBQ0EsU0FBSyxJQUFMLEdBQVksZ0JBQVo7QUFDQSxTQUFLLFFBQUwsR0FBZ0IsRUFBaEI7O0FBRUEsU0FBSyxVQUFMLEdBQWtCLGdCQUFsQjtBQUNBLFdBQU8sSUFBUCxDQUFZLElBQVo7O0FBRUEsU0FBSyxNQUFMO0FBQ0Q7Ozs7OEJBRVM7QUFDUixhQUFPLElBQVA7QUFDRDs7O2dDQUVXO0FBQ1YsYUFBTyxJQUFQO0FBQ0Q7OztrQ0FFYTtBQUNaLGFBQU8sS0FBSyxRQUFaO0FBQ0Q7OztzQ0FFaUI7QUFDaEIsVUFBTSxpQkFBaUIsS0FBSyxJQUFMLENBQVUsT0FBVixDQUFrQixLQUFLLFVBQXZCLENBQXZCO0FBQ0EsVUFBTSx3QkFBd0IsZUFBZSxNQUFmLEVBQTlCO0FBQ0EsV0FBSyxRQUFMLEdBQWdCO0FBQ2Qsd0JBQWdCLEtBQUssUUFEUDtBQUVkLDBCQUFrQixLQUFLLFVBRlQ7QUFHZCxvQkFBWSxLQUFLLElBSEg7QUFJZCw4QkFBc0IsY0FKUjtBQUtkLDJCQUFtQixLQUFLLElBQUwsQ0FBVSxNQUFWLEVBTEw7QUFNZCxxQ0FBNkI7QUFOZixPQUFoQjtBQVFEOzs7Ozs7SUFJVSxpQixXQUFBLGlCOzs7Ozs7Ozs7Ozs2QkFFRjtBQUNQLFdBQUssVUFBTCxHQUNFLGlCQUFXLFdBQVgsQ0FBdUIsS0FBSyxHQUE1QixFQUFpQyxLQUFLLE1BQXRDLEVBQThDLEtBQUssSUFBbkQsRUFBeUQsS0FBSyxHQUE5RCxDQURGO0FBRUEsV0FBSyxJQUFMLENBQVUsTUFBVixDQUFpQixLQUFLLFFBQXRCLEVBQWdDLEtBQUssTUFBckMsRUFBNkMsS0FBSyxFQUFsRDtBQUNBLFdBQUssZUFBTDtBQUNEOzs7O0VBUG9DLE07O0lBVzFCLFcsV0FBQSxXOzs7Ozs7OzZCQUVGO0FBQ1AsVUFBTSxPQUFPLEtBQUssSUFBTCxHQUFZLEtBQUssR0FBTCxDQUFTLEtBQUssR0FBTCxHQUFXLEtBQUssRUFBaEIsR0FBcUIsR0FBOUIsQ0FBekI7QUFDQSxVQUFNLE9BQU8sQ0FBQyxJQUFkO0FBQ0EsVUFBTSxPQUFPLE9BQU8sS0FBSyxNQUF6QjtBQUNBLFVBQU0sT0FBTyxPQUFPLEtBQUssTUFBekI7QUFDQSxXQUFLLFVBQUwsR0FDRSxpQkFBVyxLQUFYLENBQWlCLElBQWpCLEVBQXVCLElBQXZCLEVBQTZCLElBQTdCLEVBQW1DLElBQW5DLEVBQXlDLEtBQUssSUFBOUMsRUFBb0QsS0FBSyxHQUF6RCxDQURGO0FBRUEsV0FBSyxJQUFMLENBQVUsTUFBVixDQUFpQixLQUFLLFFBQXRCLEVBQWdDLEtBQUssTUFBckMsRUFBNkMsS0FBSyxFQUFsRDtBQUNBLFdBQUssZUFBTDtBQUNEIiwiZmlsZSI6ImNhbWVyYS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIGNhbWVyYS5qc1xuLy8gUHJvdmlkZXMgYSBDYW1lcmEgd2l0aCBNb2RlbFZpZXcgYW5kIFByb2plY3Rpb24gbWF0cmljZXNcblxuaW1wb3J0IHtWZWMzLCBNYXQ0fSBmcm9tICcuL21hdGgnO1xuaW1wb3J0IHttZXJnZX0gZnJvbSAnLi91dGlscyc7XG5cbmV4cG9ydCBjbGFzcyBDYW1lcmEge1xuXG4gIGNvbnN0cnVjdG9yKG9wdHMgPSB7fSkge1xuICAgIG9wdHMgPSBtZXJnZSh7XG4gICAgICBmb3Y6IDQ1LFxuICAgICAgbmVhcjogMC4xLFxuICAgICAgZmFyOiA1MDAsXG4gICAgICBhc3BlY3Q6IDEsXG4gICAgICBwb3NpdGlvbjogbmV3IFZlYzMoMCwgMCwgMCksXG4gICAgICB0YXJnZXQ6IG5ldyBWZWMzKDAsIDAsIC0xKSxcbiAgICAgIHVwOiBuZXcgVmVjMygwLCAxLCAwKVxuICAgIH0sIG9wdHMpO1xuICAgIHRoaXMuZm92ID0gb3B0cy5mb3Y7XG4gICAgdGhpcy5uZWFyID0gb3B0cy5uZWFyO1xuICAgIHRoaXMuZmFyID0gb3B0cy5mYXI7XG4gICAgdGhpcy5hc3BlY3QgPSBvcHRzLmFzcGVjdDtcbiAgICB0aGlzLnBvc2l0aW9uID0gb3B0cy5wb3NpdGlvbjtcbiAgICB0aGlzLnRhcmdldCA9IG9wdHMudGFyZ2V0O1xuICAgIHRoaXMudXAgPSBvcHRzLnVwO1xuICAgIHRoaXMudmlldyA9IG5ldyBNYXQ0KCk7XG4gICAgdGhpcy51bmlmb3JtcyA9IHt9O1xuXG4gICAgdGhpcy5wcm9qZWN0aW9uID0gbmV3IE1hdDQoKTtcbiAgICBPYmplY3Quc2VhbCh0aGlzKTtcblxuICAgIHRoaXMudXBkYXRlKCk7XG4gIH1cblxuICBwcm9qZWN0KCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgdW5wcm9qZWN0KCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgZ2V0VW5pZm9ybXMoKSB7XG4gICAgcmV0dXJuIHRoaXMudW5pZm9ybXM7XG4gIH1cblxuICBfdXBkYXRlVW5pZm9ybXMoKSB7XG4gICAgY29uc3Qgdmlld1Byb2plY3Rpb24gPSB0aGlzLnZpZXcubXVsTWF0NCh0aGlzLnByb2plY3Rpb24pO1xuICAgIGNvbnN0IHZpZXdQcm9qZWN0aW9uSW52ZXJzZSA9IHZpZXdQcm9qZWN0aW9uLmludmVydCgpO1xuICAgIHRoaXMudW5pZm9ybXMgPSB7XG4gICAgICBjYW1lcmFQb3NpdGlvbjogdGhpcy5wb3NpdGlvbixcbiAgICAgIHByb2plY3Rpb25NYXRyaXg6IHRoaXMucHJvamVjdGlvbixcbiAgICAgIHZpZXdNYXRyaXg6IHRoaXMudmlldyxcbiAgICAgIHZpZXdQcm9qZWN0aW9uTWF0cml4OiB2aWV3UHJvamVjdGlvbixcbiAgICAgIHZpZXdJbnZlcnNlTWF0cml4OiB0aGlzLnZpZXcuaW52ZXJ0KCksXG4gICAgICB2aWV3UHJvamVjdGlvbkludmVyc2VNYXRyaXg6IHZpZXdQcm9qZWN0aW9uSW52ZXJzZVxuICAgIH07XG4gIH1cblxufVxuXG5leHBvcnQgY2xhc3MgUGVyc3BlY3RpdmVDYW1lcmEgZXh0ZW5kcyBDYW1lcmEge1xuXG4gIHVwZGF0ZSgpIHtcbiAgICB0aGlzLnByb2plY3Rpb24gPVxuICAgICAgbmV3IE1hdDQoKS5wZXJzcGVjdGl2ZSh0aGlzLmZvdiwgdGhpcy5hc3BlY3QsIHRoaXMubmVhciwgdGhpcy5mYXIpO1xuICAgIHRoaXMudmlldy5sb29rQXQodGhpcy5wb3NpdGlvbiwgdGhpcy50YXJnZXQsIHRoaXMudXApO1xuICAgIHRoaXMuX3VwZGF0ZVVuaWZvcm1zKCk7XG4gIH1cblxufVxuXG5leHBvcnQgY2xhc3MgT3J0aG9DYW1lcmEge1xuXG4gIHVwZGF0ZSgpIHtcbiAgICBjb25zdCB5bWF4ID0gdGhpcy5uZWFyICogTWF0aC50YW4odGhpcy5mb3YgKiBNYXRoLlBJIC8gMzYwKTtcbiAgICBjb25zdCB5bWluID0gLXltYXg7XG4gICAgY29uc3QgeG1pbiA9IHltaW4gKiB0aGlzLmFzcGVjdDtcbiAgICBjb25zdCB4bWF4ID0geW1heCAqIHRoaXMuYXNwZWN0O1xuICAgIHRoaXMucHJvamVjdGlvbiA9XG4gICAgICBuZXcgTWF0NCgpLm9ydGhvKHhtaW4sIHhtYXgsIHltaW4sIHltYXgsIHRoaXMubmVhciwgdGhpcy5mYXIpO1xuICAgIHRoaXMudmlldy5sb29rQXQodGhpcy5wb3NpdGlvbiwgdGhpcy50YXJnZXQsIHRoaXMudXApO1xuICAgIHRoaXMuX3VwZGF0ZVVuaWZvcm1zKCk7XG4gIH1cblxufVxuIl19