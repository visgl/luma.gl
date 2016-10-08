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
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

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
    this.projectionFP64 = new Float32Array(32);
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
        viewProjectionInverseMatrix: viewProjectionInverse,
        projectionFP64: this.projectionFP64
      };
    }
  }]);

  return Camera;
}();

var PerspectiveCamera = exports.PerspectiveCamera = function (_Camera) {
  _inherits(PerspectiveCamera, _Camera);

  function PerspectiveCamera() {
    _classCallCheck(this, PerspectiveCamera);

    return _possibleConstructorReturn(this, (PerspectiveCamera.__proto__ || Object.getPrototypeOf(PerspectiveCamera)).apply(this, arguments));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb3JlL2NhbWVyYS5qcyJdLCJuYW1lcyI6WyJDYW1lcmEiLCJvcHRzIiwiZm92IiwibmVhciIsImZhciIsImFzcGVjdCIsInBvc2l0aW9uIiwidGFyZ2V0IiwidXAiLCJ2aWV3IiwidW5pZm9ybXMiLCJwcm9qZWN0aW9uIiwicHJvamVjdGlvbkZQNjQiLCJGbG9hdDMyQXJyYXkiLCJPYmplY3QiLCJzZWFsIiwidXBkYXRlIiwidmlld1Byb2plY3Rpb24iLCJtdWxNYXQ0Iiwidmlld1Byb2plY3Rpb25JbnZlcnNlIiwiaW52ZXJ0IiwiY2FtZXJhUG9zaXRpb24iLCJwcm9qZWN0aW9uTWF0cml4Iiwidmlld01hdHJpeCIsInZpZXdQcm9qZWN0aW9uTWF0cml4Iiwidmlld0ludmVyc2VNYXRyaXgiLCJ2aWV3UHJvamVjdGlvbkludmVyc2VNYXRyaXgiLCJQZXJzcGVjdGl2ZUNhbWVyYSIsInBlcnNwZWN0aXZlIiwibG9va0F0IiwiX3VwZGF0ZVVuaWZvcm1zIiwiT3J0aG9DYW1lcmEiLCJ5bWF4IiwiTWF0aCIsInRhbiIsIlBJIiwieW1pbiIsInhtaW4iLCJ4bWF4Iiwib3J0aG8iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7cWpCQUFBO0FBQ0E7O0FBRUE7O0FBQ0E7Ozs7Ozs7O0lBRWFBLE0sV0FBQUEsTTtBQUVYLG9CQUF1QjtBQUFBLFFBQVhDLElBQVcsdUVBQUosRUFBSTs7QUFBQTs7QUFDckJBLFdBQU8sa0JBQU07QUFDWEMsV0FBSyxFQURNO0FBRVhDLFlBQU0sR0FGSztBQUdYQyxXQUFLLEdBSE07QUFJWEMsY0FBUSxDQUpHO0FBS1hDLGdCQUFVLGVBQVMsQ0FBVCxFQUFZLENBQVosRUFBZSxDQUFmLENBTEM7QUFNWEMsY0FBUSxlQUFTLENBQVQsRUFBWSxDQUFaLEVBQWUsQ0FBQyxDQUFoQixDQU5HO0FBT1hDLFVBQUksZUFBUyxDQUFULEVBQVksQ0FBWixFQUFlLENBQWY7QUFQTyxLQUFOLEVBUUpQLElBUkksQ0FBUDtBQVNBLFNBQUtDLEdBQUwsR0FBV0QsS0FBS0MsR0FBaEI7QUFDQSxTQUFLQyxJQUFMLEdBQVlGLEtBQUtFLElBQWpCO0FBQ0EsU0FBS0MsR0FBTCxHQUFXSCxLQUFLRyxHQUFoQjtBQUNBLFNBQUtDLE1BQUwsR0FBY0osS0FBS0ksTUFBbkI7QUFDQSxTQUFLQyxRQUFMLEdBQWdCTCxLQUFLSyxRQUFyQjtBQUNBLFNBQUtDLE1BQUwsR0FBY04sS0FBS00sTUFBbkI7QUFDQSxTQUFLQyxFQUFMLEdBQVVQLEtBQUtPLEVBQWY7QUFDQSxTQUFLQyxJQUFMLEdBQVksZ0JBQVo7QUFDQSxTQUFLQyxRQUFMLEdBQWdCLEVBQWhCOztBQUVBLFNBQUtDLFVBQUwsR0FBa0IsZ0JBQWxCO0FBQ0EsU0FBS0MsY0FBTCxHQUFzQixJQUFJQyxZQUFKLENBQWlCLEVBQWpCLENBQXRCO0FBQ0FDLFdBQU9DLElBQVAsQ0FBWSxJQUFaOztBQUVBLFNBQUtDLE1BQUw7QUFDRDs7Ozs4QkFFUztBQUNSLGFBQU8sSUFBUDtBQUNEOzs7Z0NBRVc7QUFDVixhQUFPLElBQVA7QUFDRDs7O2tDQUVhO0FBQ1osYUFBTyxLQUFLTixRQUFaO0FBQ0Q7OztzQ0FFaUI7QUFDaEIsVUFBTU8saUJBQWlCLEtBQUtSLElBQUwsQ0FBVVMsT0FBVixDQUFrQixLQUFLUCxVQUF2QixDQUF2QjtBQUNBLFVBQU1RLHdCQUF3QkYsZUFBZUcsTUFBZixFQUE5QjtBQUNBLFdBQUtWLFFBQUwsR0FBZ0I7QUFDZFcsd0JBQWdCLEtBQUtmLFFBRFA7QUFFZGdCLDBCQUFrQixLQUFLWCxVQUZUO0FBR2RZLG9CQUFZLEtBQUtkLElBSEg7QUFJZGUsOEJBQXNCUCxjQUpSO0FBS2RRLDJCQUFtQixLQUFLaEIsSUFBTCxDQUFVVyxNQUFWLEVBTEw7QUFNZE0scUNBQTZCUCxxQkFOZjtBQU9kUCx3QkFBZ0IsS0FBS0E7QUFQUCxPQUFoQjtBQVNEOzs7Ozs7SUFJVWUsaUIsV0FBQUEsaUI7Ozs7Ozs7Ozs7OzZCQUVGO0FBQ1AsV0FBS2hCLFVBQUwsR0FDRSxpQkFBV2lCLFdBQVgsQ0FBdUIsS0FBSzFCLEdBQTVCLEVBQWlDLEtBQUtHLE1BQXRDLEVBQThDLEtBQUtGLElBQW5ELEVBQXlELEtBQUtDLEdBQTlELENBREY7QUFFQSxXQUFLSyxJQUFMLENBQVVvQixNQUFWLENBQWlCLEtBQUt2QixRQUF0QixFQUFnQyxLQUFLQyxNQUFyQyxFQUE2QyxLQUFLQyxFQUFsRDtBQUNBLFdBQUtzQixlQUFMO0FBQ0Q7Ozs7RUFQb0M5QixNOztJQVcxQitCLFcsV0FBQUEsVzs7Ozs7Ozs2QkFFRjtBQUNQLFVBQU1DLE9BQU8sS0FBSzdCLElBQUwsR0FBWThCLEtBQUtDLEdBQUwsQ0FBUyxLQUFLaEMsR0FBTCxHQUFXK0IsS0FBS0UsRUFBaEIsR0FBcUIsR0FBOUIsQ0FBekI7QUFDQSxVQUFNQyxPQUFPLENBQUNKLElBQWQ7QUFDQSxVQUFNSyxPQUFPRCxPQUFPLEtBQUsvQixNQUF6QjtBQUNBLFVBQU1pQyxPQUFPTixPQUFPLEtBQUszQixNQUF6QjtBQUNBLFdBQUtNLFVBQUwsR0FDRSxpQkFBVzRCLEtBQVgsQ0FBaUJGLElBQWpCLEVBQXVCQyxJQUF2QixFQUE2QkYsSUFBN0IsRUFBbUNKLElBQW5DLEVBQXlDLEtBQUs3QixJQUE5QyxFQUFvRCxLQUFLQyxHQUF6RCxDQURGO0FBRUEsV0FBS0ssSUFBTCxDQUFVb0IsTUFBVixDQUFpQixLQUFLdkIsUUFBdEIsRUFBZ0MsS0FBS0MsTUFBckMsRUFBNkMsS0FBS0MsRUFBbEQ7QUFDQSxXQUFLc0IsZUFBTDtBQUNEIiwiZmlsZSI6ImNhbWVyYS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIGNhbWVyYS5qc1xuLy8gUHJvdmlkZXMgYSBDYW1lcmEgd2l0aCBNb2RlbFZpZXcgYW5kIFByb2plY3Rpb24gbWF0cmljZXNcblxuaW1wb3J0IHtWZWMzLCBNYXQ0fSBmcm9tICcuLi9tYXRoJztcbmltcG9ydCB7bWVyZ2V9IGZyb20gJy4uL3V0aWxzJztcblxuZXhwb3J0IGNsYXNzIENhbWVyYSB7XG5cbiAgY29uc3RydWN0b3Iob3B0cyA9IHt9KSB7XG4gICAgb3B0cyA9IG1lcmdlKHtcbiAgICAgIGZvdjogNDUsXG4gICAgICBuZWFyOiAwLjEsXG4gICAgICBmYXI6IDUwMCxcbiAgICAgIGFzcGVjdDogMSxcbiAgICAgIHBvc2l0aW9uOiBuZXcgVmVjMygwLCAwLCAwKSxcbiAgICAgIHRhcmdldDogbmV3IFZlYzMoMCwgMCwgLTEpLFxuICAgICAgdXA6IG5ldyBWZWMzKDAsIDEsIDApXG4gICAgfSwgb3B0cyk7XG4gICAgdGhpcy5mb3YgPSBvcHRzLmZvdjtcbiAgICB0aGlzLm5lYXIgPSBvcHRzLm5lYXI7XG4gICAgdGhpcy5mYXIgPSBvcHRzLmZhcjtcbiAgICB0aGlzLmFzcGVjdCA9IG9wdHMuYXNwZWN0O1xuICAgIHRoaXMucG9zaXRpb24gPSBvcHRzLnBvc2l0aW9uO1xuICAgIHRoaXMudGFyZ2V0ID0gb3B0cy50YXJnZXQ7XG4gICAgdGhpcy51cCA9IG9wdHMudXA7XG4gICAgdGhpcy52aWV3ID0gbmV3IE1hdDQoKTtcbiAgICB0aGlzLnVuaWZvcm1zID0ge307XG5cbiAgICB0aGlzLnByb2plY3Rpb24gPSBuZXcgTWF0NCgpO1xuICAgIHRoaXMucHJvamVjdGlvbkZQNjQgPSBuZXcgRmxvYXQzMkFycmF5KDMyKTtcbiAgICBPYmplY3Quc2VhbCh0aGlzKTtcblxuICAgIHRoaXMudXBkYXRlKCk7XG4gIH1cblxuICBwcm9qZWN0KCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgdW5wcm9qZWN0KCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgZ2V0VW5pZm9ybXMoKSB7XG4gICAgcmV0dXJuIHRoaXMudW5pZm9ybXM7XG4gIH1cblxuICBfdXBkYXRlVW5pZm9ybXMoKSB7XG4gICAgY29uc3Qgdmlld1Byb2plY3Rpb24gPSB0aGlzLnZpZXcubXVsTWF0NCh0aGlzLnByb2plY3Rpb24pO1xuICAgIGNvbnN0IHZpZXdQcm9qZWN0aW9uSW52ZXJzZSA9IHZpZXdQcm9qZWN0aW9uLmludmVydCgpO1xuICAgIHRoaXMudW5pZm9ybXMgPSB7XG4gICAgICBjYW1lcmFQb3NpdGlvbjogdGhpcy5wb3NpdGlvbixcbiAgICAgIHByb2plY3Rpb25NYXRyaXg6IHRoaXMucHJvamVjdGlvbixcbiAgICAgIHZpZXdNYXRyaXg6IHRoaXMudmlldyxcbiAgICAgIHZpZXdQcm9qZWN0aW9uTWF0cml4OiB2aWV3UHJvamVjdGlvbixcbiAgICAgIHZpZXdJbnZlcnNlTWF0cml4OiB0aGlzLnZpZXcuaW52ZXJ0KCksXG4gICAgICB2aWV3UHJvamVjdGlvbkludmVyc2VNYXRyaXg6IHZpZXdQcm9qZWN0aW9uSW52ZXJzZSxcbiAgICAgIHByb2plY3Rpb25GUDY0OiB0aGlzLnByb2plY3Rpb25GUDY0XG4gICAgfTtcbiAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBQZXJzcGVjdGl2ZUNhbWVyYSBleHRlbmRzIENhbWVyYSB7XG5cbiAgdXBkYXRlKCkge1xuICAgIHRoaXMucHJvamVjdGlvbiA9XG4gICAgICBuZXcgTWF0NCgpLnBlcnNwZWN0aXZlKHRoaXMuZm92LCB0aGlzLmFzcGVjdCwgdGhpcy5uZWFyLCB0aGlzLmZhcik7XG4gICAgdGhpcy52aWV3Lmxvb2tBdCh0aGlzLnBvc2l0aW9uLCB0aGlzLnRhcmdldCwgdGhpcy51cCk7XG4gICAgdGhpcy5fdXBkYXRlVW5pZm9ybXMoKTtcbiAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBPcnRob0NhbWVyYSB7XG5cbiAgdXBkYXRlKCkge1xuICAgIGNvbnN0IHltYXggPSB0aGlzLm5lYXIgKiBNYXRoLnRhbih0aGlzLmZvdiAqIE1hdGguUEkgLyAzNjApO1xuICAgIGNvbnN0IHltaW4gPSAteW1heDtcbiAgICBjb25zdCB4bWluID0geW1pbiAqIHRoaXMuYXNwZWN0O1xuICAgIGNvbnN0IHhtYXggPSB5bWF4ICogdGhpcy5hc3BlY3Q7XG4gICAgdGhpcy5wcm9qZWN0aW9uID1cbiAgICAgIG5ldyBNYXQ0KCkub3J0aG8oeG1pbiwgeG1heCwgeW1pbiwgeW1heCwgdGhpcy5uZWFyLCB0aGlzLmZhcik7XG4gICAgdGhpcy52aWV3Lmxvb2tBdCh0aGlzLnBvc2l0aW9uLCB0aGlzLnRhcmdldCwgdGhpcy51cCk7XG4gICAgdGhpcy5fdXBkYXRlVW5pZm9ybXMoKTtcbiAgfVxuXG59XG4iXX0=