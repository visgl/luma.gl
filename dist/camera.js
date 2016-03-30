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
//# sourceMappingURL=data:application/json;base64,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TztBQVFQLFdBQUssZUFBTCxHQVJPOzs7O1NBRkUiLCJmaWxlIjoiY2FtZXJhLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gY2FtZXJhLmpzXG4vLyBQcm92aWRlcyBhIENhbWVyYSB3aXRoIE1vZGVsVmlldyBhbmQgUHJvamVjdGlvbiBtYXRyaWNlc1xuXG5pbXBvcnQge1ZlYzMsIE1hdDR9IGZyb20gJy4vbWF0aCc7XG5pbXBvcnQge21lcmdlfSBmcm9tICcuL3V0aWxzJztcblxuZXhwb3J0IGNsYXNzIENhbWVyYSB7XG5cbiAgY29uc3RydWN0b3Iob3B0cykge1xuICAgIG9wdHMgPSBtZXJnZSh7XG4gICAgICBmb3Y6IDQ1LFxuICAgICAgbmVhcjogMC4xLFxuICAgICAgZmFyOiA1MDAsXG4gICAgICBhc3BlY3Q6IDEsXG4gICAgICBwb3NpdGlvbjogbmV3IFZlYzMoMCwgMCwgMCksXG4gICAgICB0YXJnZXQ6IG5ldyBWZWMzKDAsIDAsIC0xKSxcbiAgICAgIHVwOiBuZXcgVmVjMygwLCAxLCAwKVxuICAgIH0sIG9wdHMpO1xuICAgIHRoaXMuZm92ID0gb3B0cy5mb3Y7XG4gICAgdGhpcy5uZWFyID0gb3B0cy5uZWFyO1xuICAgIHRoaXMuZmFyID0gb3B0cy5mYXI7XG4gICAgdGhpcy5hc3BlY3QgPSBvcHRzLmFzcGVjdDtcbiAgICB0aGlzLnBvc2l0aW9uID0gb3B0cy5wb3NpdGlvbjtcbiAgICB0aGlzLnRhcmdldCA9IG9wdHMudGFyZ2V0O1xuICAgIHRoaXMudXAgPSBvcHRzLnVwO1xuICAgIHRoaXMudmlldyA9IG5ldyBNYXQ0KCk7XG4gICAgdGhpcy51bmlmb3JtcyA9IHt9O1xuXG4gICAgdGhpcy5wcm9qZWN0aW9uID0gbmV3IE1hdDQoKTtcbiAgICBPYmplY3Quc2VhbCh0aGlzKTtcblxuICAgIHRoaXMudXBkYXRlKCk7XG4gIH1cblxuICBnZXRVbmlmb3JtcygpIHtcbiAgICByZXR1cm4gdGhpcy51bmlmb3JtcztcbiAgfVxuXG4gIF91cGRhdGVVbmlmb3JtcygpIHtcbiAgICBjb25zdCB2aWV3UHJvamVjdGlvbiA9IHRoaXMudmlldy5tdWxNYXQ0KHRoaXMucHJvamVjdGlvbik7XG4gICAgY29uc3Qgdmlld1Byb2plY3Rpb25JbnZlcnNlID0gdmlld1Byb2plY3Rpb24uaW52ZXJ0KCk7XG4gICAgdGhpcy51bmlmb3JtcyA9IHtcbiAgICAgIGNhbWVyYVBvc2l0aW9uOiB0aGlzLnBvc2l0aW9uLFxuICAgICAgcHJvamVjdGlvbk1hdHJpeDogdGhpcy5wcm9qZWN0aW9uLFxuICAgICAgdmlld01hdHJpeDogdGhpcy52aWV3LFxuICAgICAgdmlld1Byb2plY3Rpb25NYXRyaXg6IHZpZXdQcm9qZWN0aW9uLFxuICAgICAgdmlld0ludmVyc2VNYXRyaXg6IHRoaXMudmlldy5pbnZlcnQoKSxcbiAgICAgIHZpZXdQcm9qZWN0aW9uSW52ZXJzZU1hdHJpeDogdmlld1Byb2plY3Rpb25JbnZlcnNlXG4gICAgfTtcbiAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBQZXJzcGVjdGl2ZUNhbWVyYSBleHRlbmRzIENhbWVyYSB7XG5cbiAgdXBkYXRlKCkge1xuICAgIHRoaXMucHJvamVjdGlvbiA9XG4gICAgICBuZXcgTWF0NCgpLnBlcnNwZWN0aXZlKHRoaXMuZm92LCB0aGlzLmFzcGVjdCwgdGhpcy5uZWFyLCB0aGlzLmZhcik7XG4gICAgdGhpcy52aWV3Lmxvb2tBdCh0aGlzLnBvc2l0aW9uLCB0aGlzLnRhcmdldCwgdGhpcy51cCk7XG4gICAgdGhpcy5fdXBkYXRlVW5pZm9ybXMoKTtcbiAgfVxuXG59XG5cbmV4cG9ydCBjbGFzcyBPcnRob0NhbWVyYSB7XG5cbiAgdXBkYXRlKCkge1xuICAgIGNvbnN0IHltYXggPSB0aGlzLm5lYXIgKiBNYXRoLnRhbih0aGlzLmZvdiAqIE1hdGguUEkgLyAzNjApO1xuICAgIGNvbnN0IHltaW4gPSAteW1heDtcbiAgICBjb25zdCB4bWluID0geW1pbiAqIHRoaXMuYXNwZWN0O1xuICAgIGNvbnN0IHhtYXggPSB5bWF4ICogdGhpcy5hc3BlY3Q7XG4gICAgdGhpcy5wcm9qZWN0aW9uID1cbiAgICAgIG5ldyBNYXQ0KCkub3J0aG8oeG1pbiwgeG1heCwgeW1pbiwgeW1heCwgdGhpcy5uZWFyLCB0aGlzLmZhcik7XG4gICAgdGhpcy52aWV3Lmxvb2tBdCh0aGlzLnBvc2l0aW9uLCB0aGlzLnRhcmdldCwgdGhpcy51cCk7XG4gICAgdGhpcy5fdXBkYXRlVW5pZm9ybXMoKTtcbiAgfVxuXG59XG4iXX0=