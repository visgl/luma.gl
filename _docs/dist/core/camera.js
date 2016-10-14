'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.OrthoCamera = exports.PerspectiveCamera = exports.Camera = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // camera.js
// Provides a Camera with ModelView and Projection matrices

var _deprecated = require('../deprecated');

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
      position: new _deprecated.Vec3(0, 0, 0),
      target: new _deprecated.Vec3(0, 0, -1),
      up: new _deprecated.Vec3(0, 1, 0)
    }, opts);
    this.fov = opts.fov;
    this.near = opts.near;
    this.far = opts.far;
    this.aspect = opts.aspect;
    this.position = opts.position;
    this.target = opts.target;
    this.up = opts.up;
    this.view = new _deprecated.Mat4();
    this.uniforms = {};

    this.projection = new _deprecated.Mat4();
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

    return _possibleConstructorReturn(this, (PerspectiveCamera.__proto__ || Object.getPrototypeOf(PerspectiveCamera)).apply(this, arguments));
  }

  _createClass(PerspectiveCamera, [{
    key: 'update',
    value: function update() {
      this.projection = new _deprecated.Mat4().perspective(this.fov, this.aspect, this.near, this.far);
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
      this.projection = new _deprecated.Mat4().ortho(xmin, xmax, ymin, ymax, this.near, this.far);
      this.view.lookAt(this.position, this.target, this.up);
      this._updateUniforms();
    }
  }]);

  return OrthoCamera;
}();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb3JlL2NhbWVyYS5qcyJdLCJuYW1lcyI6WyJDYW1lcmEiLCJvcHRzIiwiZm92IiwibmVhciIsImZhciIsImFzcGVjdCIsInBvc2l0aW9uIiwidGFyZ2V0IiwidXAiLCJ2aWV3IiwidW5pZm9ybXMiLCJwcm9qZWN0aW9uIiwiT2JqZWN0Iiwic2VhbCIsInVwZGF0ZSIsInZpZXdQcm9qZWN0aW9uIiwibXVsTWF0NCIsInZpZXdQcm9qZWN0aW9uSW52ZXJzZSIsImludmVydCIsImNhbWVyYVBvc2l0aW9uIiwicHJvamVjdGlvbk1hdHJpeCIsInZpZXdNYXRyaXgiLCJ2aWV3UHJvamVjdGlvbk1hdHJpeCIsInZpZXdJbnZlcnNlTWF0cml4Iiwidmlld1Byb2plY3Rpb25JbnZlcnNlTWF0cml4IiwiUGVyc3BlY3RpdmVDYW1lcmEiLCJwZXJzcGVjdGl2ZSIsImxvb2tBdCIsIl91cGRhdGVVbmlmb3JtcyIsIk9ydGhvQ2FtZXJhIiwieW1heCIsIk1hdGgiLCJ0YW4iLCJQSSIsInltaW4iLCJ4bWluIiwieG1heCIsIm9ydGhvIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O3FqQkFBQTtBQUNBOztBQUVBOztBQUNBOzs7Ozs7OztJQUVhQSxNLFdBQUFBLE07QUFFWCxvQkFBdUI7QUFBQSxRQUFYQyxJQUFXLHVFQUFKLEVBQUk7O0FBQUE7O0FBQ3JCQSxXQUFPLGtCQUFNO0FBQ1hDLFdBQUssRUFETTtBQUVYQyxZQUFNLEdBRks7QUFHWEMsV0FBSyxHQUhNO0FBSVhDLGNBQVEsQ0FKRztBQUtYQyxnQkFBVSxxQkFBUyxDQUFULEVBQVksQ0FBWixFQUFlLENBQWYsQ0FMQztBQU1YQyxjQUFRLHFCQUFTLENBQVQsRUFBWSxDQUFaLEVBQWUsQ0FBQyxDQUFoQixDQU5HO0FBT1hDLFVBQUkscUJBQVMsQ0FBVCxFQUFZLENBQVosRUFBZSxDQUFmO0FBUE8sS0FBTixFQVFKUCxJQVJJLENBQVA7QUFTQSxTQUFLQyxHQUFMLEdBQVdELEtBQUtDLEdBQWhCO0FBQ0EsU0FBS0MsSUFBTCxHQUFZRixLQUFLRSxJQUFqQjtBQUNBLFNBQUtDLEdBQUwsR0FBV0gsS0FBS0csR0FBaEI7QUFDQSxTQUFLQyxNQUFMLEdBQWNKLEtBQUtJLE1BQW5CO0FBQ0EsU0FBS0MsUUFBTCxHQUFnQkwsS0FBS0ssUUFBckI7QUFDQSxTQUFLQyxNQUFMLEdBQWNOLEtBQUtNLE1BQW5CO0FBQ0EsU0FBS0MsRUFBTCxHQUFVUCxLQUFLTyxFQUFmO0FBQ0EsU0FBS0MsSUFBTCxHQUFZLHNCQUFaO0FBQ0EsU0FBS0MsUUFBTCxHQUFnQixFQUFoQjs7QUFFQSxTQUFLQyxVQUFMLEdBQWtCLHNCQUFsQjtBQUNBQyxXQUFPQyxJQUFQLENBQVksSUFBWjs7QUFFQSxTQUFLQyxNQUFMO0FBQ0Q7Ozs7OEJBRVM7QUFDUixhQUFPLElBQVA7QUFDRDs7O2dDQUVXO0FBQ1YsYUFBTyxJQUFQO0FBQ0Q7OztrQ0FFYTtBQUNaLGFBQU8sS0FBS0osUUFBWjtBQUNEOzs7c0NBRWlCO0FBQ2hCLFVBQU1LLGlCQUFpQixLQUFLTixJQUFMLENBQVVPLE9BQVYsQ0FBa0IsS0FBS0wsVUFBdkIsQ0FBdkI7QUFDQSxVQUFNTSx3QkFBd0JGLGVBQWVHLE1BQWYsRUFBOUI7QUFDQSxXQUFLUixRQUFMLEdBQWdCO0FBQ2RTLHdCQUFnQixLQUFLYixRQURQO0FBRWRjLDBCQUFrQixLQUFLVCxVQUZUO0FBR2RVLG9CQUFZLEtBQUtaLElBSEg7QUFJZGEsOEJBQXNCUCxjQUpSO0FBS2RRLDJCQUFtQixLQUFLZCxJQUFMLENBQVVTLE1BQVYsRUFMTDtBQU1kTSxxQ0FBNkJQO0FBTmYsT0FBaEI7QUFRRDs7Ozs7O0lBSVVRLGlCLFdBQUFBLGlCOzs7Ozs7Ozs7Ozs2QkFFRjtBQUNQLFdBQUtkLFVBQUwsR0FDRSx1QkFBV2UsV0FBWCxDQUF1QixLQUFLeEIsR0FBNUIsRUFBaUMsS0FBS0csTUFBdEMsRUFBOEMsS0FBS0YsSUFBbkQsRUFBeUQsS0FBS0MsR0FBOUQsQ0FERjtBQUVBLFdBQUtLLElBQUwsQ0FBVWtCLE1BQVYsQ0FBaUIsS0FBS3JCLFFBQXRCLEVBQWdDLEtBQUtDLE1BQXJDLEVBQTZDLEtBQUtDLEVBQWxEO0FBQ0EsV0FBS29CLGVBQUw7QUFDRDs7OztFQVBvQzVCLE07O0lBVzFCNkIsVyxXQUFBQSxXOzs7Ozs7OzZCQUVGO0FBQ1AsVUFBTUMsT0FBTyxLQUFLM0IsSUFBTCxHQUFZNEIsS0FBS0MsR0FBTCxDQUFTLEtBQUs5QixHQUFMLEdBQVc2QixLQUFLRSxFQUFoQixHQUFxQixHQUE5QixDQUF6QjtBQUNBLFVBQU1DLE9BQU8sQ0FBQ0osSUFBZDtBQUNBLFVBQU1LLE9BQU9ELE9BQU8sS0FBSzdCLE1BQXpCO0FBQ0EsVUFBTStCLE9BQU9OLE9BQU8sS0FBS3pCLE1BQXpCO0FBQ0EsV0FBS00sVUFBTCxHQUNFLHVCQUFXMEIsS0FBWCxDQUFpQkYsSUFBakIsRUFBdUJDLElBQXZCLEVBQTZCRixJQUE3QixFQUFtQ0osSUFBbkMsRUFBeUMsS0FBSzNCLElBQTlDLEVBQW9ELEtBQUtDLEdBQXpELENBREY7QUFFQSxXQUFLSyxJQUFMLENBQVVrQixNQUFWLENBQWlCLEtBQUtyQixRQUF0QixFQUFnQyxLQUFLQyxNQUFyQyxFQUE2QyxLQUFLQyxFQUFsRDtBQUNBLFdBQUtvQixlQUFMO0FBQ0QiLCJmaWxlIjoiY2FtZXJhLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gY2FtZXJhLmpzXG4vLyBQcm92aWRlcyBhIENhbWVyYSB3aXRoIE1vZGVsVmlldyBhbmQgUHJvamVjdGlvbiBtYXRyaWNlc1xuXG5pbXBvcnQge1ZlYzMsIE1hdDR9IGZyb20gJy4uL2RlcHJlY2F0ZWQnO1xuaW1wb3J0IHttZXJnZX0gZnJvbSAnLi4vdXRpbHMnO1xuXG5leHBvcnQgY2xhc3MgQ2FtZXJhIHtcblxuICBjb25zdHJ1Y3RvcihvcHRzID0ge30pIHtcbiAgICBvcHRzID0gbWVyZ2Uoe1xuICAgICAgZm92OiA0NSxcbiAgICAgIG5lYXI6IDAuMSxcbiAgICAgIGZhcjogNTAwLFxuICAgICAgYXNwZWN0OiAxLFxuICAgICAgcG9zaXRpb246IG5ldyBWZWMzKDAsIDAsIDApLFxuICAgICAgdGFyZ2V0OiBuZXcgVmVjMygwLCAwLCAtMSksXG4gICAgICB1cDogbmV3IFZlYzMoMCwgMSwgMClcbiAgICB9LCBvcHRzKTtcbiAgICB0aGlzLmZvdiA9IG9wdHMuZm92O1xuICAgIHRoaXMubmVhciA9IG9wdHMubmVhcjtcbiAgICB0aGlzLmZhciA9IG9wdHMuZmFyO1xuICAgIHRoaXMuYXNwZWN0ID0gb3B0cy5hc3BlY3Q7XG4gICAgdGhpcy5wb3NpdGlvbiA9IG9wdHMucG9zaXRpb247XG4gICAgdGhpcy50YXJnZXQgPSBvcHRzLnRhcmdldDtcbiAgICB0aGlzLnVwID0gb3B0cy51cDtcbiAgICB0aGlzLnZpZXcgPSBuZXcgTWF0NCgpO1xuICAgIHRoaXMudW5pZm9ybXMgPSB7fTtcblxuICAgIHRoaXMucHJvamVjdGlvbiA9IG5ldyBNYXQ0KCk7XG4gICAgT2JqZWN0LnNlYWwodGhpcyk7XG5cbiAgICB0aGlzLnVwZGF0ZSgpO1xuICB9XG5cbiAgcHJvamVjdCgpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHVucHJvamVjdCgpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGdldFVuaWZvcm1zKCkge1xuICAgIHJldHVybiB0aGlzLnVuaWZvcm1zO1xuICB9XG5cbiAgX3VwZGF0ZVVuaWZvcm1zKCkge1xuICAgIGNvbnN0IHZpZXdQcm9qZWN0aW9uID0gdGhpcy52aWV3Lm11bE1hdDQodGhpcy5wcm9qZWN0aW9uKTtcbiAgICBjb25zdCB2aWV3UHJvamVjdGlvbkludmVyc2UgPSB2aWV3UHJvamVjdGlvbi5pbnZlcnQoKTtcbiAgICB0aGlzLnVuaWZvcm1zID0ge1xuICAgICAgY2FtZXJhUG9zaXRpb246IHRoaXMucG9zaXRpb24sXG4gICAgICBwcm9qZWN0aW9uTWF0cml4OiB0aGlzLnByb2plY3Rpb24sXG4gICAgICB2aWV3TWF0cml4OiB0aGlzLnZpZXcsXG4gICAgICB2aWV3UHJvamVjdGlvbk1hdHJpeDogdmlld1Byb2plY3Rpb24sXG4gICAgICB2aWV3SW52ZXJzZU1hdHJpeDogdGhpcy52aWV3LmludmVydCgpLFxuICAgICAgdmlld1Byb2plY3Rpb25JbnZlcnNlTWF0cml4OiB2aWV3UHJvamVjdGlvbkludmVyc2VcbiAgICB9O1xuICB9XG5cbn1cblxuZXhwb3J0IGNsYXNzIFBlcnNwZWN0aXZlQ2FtZXJhIGV4dGVuZHMgQ2FtZXJhIHtcblxuICB1cGRhdGUoKSB7XG4gICAgdGhpcy5wcm9qZWN0aW9uID1cbiAgICAgIG5ldyBNYXQ0KCkucGVyc3BlY3RpdmUodGhpcy5mb3YsIHRoaXMuYXNwZWN0LCB0aGlzLm5lYXIsIHRoaXMuZmFyKTtcbiAgICB0aGlzLnZpZXcubG9va0F0KHRoaXMucG9zaXRpb24sIHRoaXMudGFyZ2V0LCB0aGlzLnVwKTtcbiAgICB0aGlzLl91cGRhdGVVbmlmb3JtcygpO1xuICB9XG5cbn1cblxuZXhwb3J0IGNsYXNzIE9ydGhvQ2FtZXJhIHtcblxuICB1cGRhdGUoKSB7XG4gICAgY29uc3QgeW1heCA9IHRoaXMubmVhciAqIE1hdGgudGFuKHRoaXMuZm92ICogTWF0aC5QSSAvIDM2MCk7XG4gICAgY29uc3QgeW1pbiA9IC15bWF4O1xuICAgIGNvbnN0IHhtaW4gPSB5bWluICogdGhpcy5hc3BlY3Q7XG4gICAgY29uc3QgeG1heCA9IHltYXggKiB0aGlzLmFzcGVjdDtcbiAgICB0aGlzLnByb2plY3Rpb24gPVxuICAgICAgbmV3IE1hdDQoKS5vcnRobyh4bWluLCB4bWF4LCB5bWluLCB5bWF4LCB0aGlzLm5lYXIsIHRoaXMuZmFyKTtcbiAgICB0aGlzLnZpZXcubG9va0F0KHRoaXMucG9zaXRpb24sIHRoaXMudGFyZ2V0LCB0aGlzLnVwKTtcbiAgICB0aGlzLl91cGRhdGVVbmlmb3JtcygpO1xuICB9XG5cbn1cbiJdfQ==