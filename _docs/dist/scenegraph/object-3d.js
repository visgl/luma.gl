'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _math = require('../math');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Object3D = function () {
  function Object3D(_ref) {
    var id = _ref.id;
    var _ref$display = _ref.display;
    var display = _ref$display === undefined ? true : _ref$display;

    _classCallCheck(this, Object3D);

    // model position, rotation, scale and all in all matrix
    this.position = new _math.Vec3();
    this.rotation = new _math.Vec3();
    this.scale = new _math.Vec3(1, 1, 1);
    this.matrix = new _math.Mat4();

    // whether to display the object at all
    this.id = id || (0, _utils.uid)();
    this.display = true;
    this.userData = {};
  }

  _createClass(Object3D, [{
    key: 'setPosition',
    value: function setPosition(position) {
      (0, _assert2.default)(position instanceof _math.Vec3, 'setPosition requires vector argument');
      this.position = position;
      return this;
    }
  }, {
    key: 'setRotation',
    value: function setRotation(rotation) {
      (0, _assert2.default)(rotation instanceof _math.Vec3, 'setRotation requires vector argument');
      this.rotation = rotation;
      return this;
    }
  }, {
    key: 'setScale',
    value: function setScale(scale) {
      (0, _assert2.default)(scale instanceof _math.Vec3, 'setScale requires vector argument');
      this.scale = scale;
      return this;
    }
  }, {
    key: 'setMatrixComponents',
    value: function setMatrixComponents(_ref2) {
      var position = _ref2.position;
      var rotation = _ref2.rotation;
      var scale = _ref2.scale;
      var _ref2$update = _ref2.update;
      var update = _ref2$update === undefined ? true : _ref2$update;

      if (position) {
        this.setPosition(position);
      }
      if (rotation) {
        this.setRotation(rotation);
      }
      if (scale) {
        this.setScale(scale);
      }
      if (update) {
        this.updateMatrix();
      }
      return this;
    }
  }, {
    key: 'updateMatrix',
    value: function updateMatrix() {
      var pos = this.position;
      var rot = this.rotation;
      var scale = this.scale;

      this.matrix.id();
      this.matrix.$translate(pos.x, pos.y, pos.z);
      this.matrix.$rotateXYZ(rot.x, rot.y, rot.z);
      this.matrix.$scale(scale.x, scale.y, scale.z);
      return this;
    }
  }, {
    key: 'update',
    value: function update() {
      var _ref3 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      var position = _ref3.position;
      var rotation = _ref3.rotation;
      var scale = _ref3.scale;

      if (position) {
        this.setPosition(position);
      }
      if (rotation) {
        this.setRotation(rotation);
      }
      if (scale) {
        this.setScale(scale);
      }
      this.updateMatrix();
      return this;
    }
  }, {
    key: 'getCoordinateUniforms',
    value: function getCoordinateUniforms(viewMatrix) {
      // TODO - solve multiple class problem
      // assert(viewMatrix instanceof Mat4);
      (0, _assert2.default)(viewMatrix);
      var matrix = this.matrix;

      var worldMatrix = viewMatrix.mulMat4(matrix);
      var worldInverse = worldMatrix.invert();
      var worldInverseTranspose = worldInverse.transpose();

      return {
        objectMatrix: matrix,
        worldMatrix: worldMatrix,
        worldInverseMatrix: worldInverse,
        worldInverseTransposeMatrix: worldInverseTranspose
      };
    }

    // TODO - copied code, not yet vetted

  }, {
    key: 'transform',
    value: function transform() {

      if (!this.parent) {
        this.endPosition.setVec3(this.position);
        this.endRotation.setVec3(this.rotation);
        this.endScale.setVec3(this.scale);
      } else {
        var parent = this.parent;
        this.endPosition.setVec3(this.position.add(parent.endPosition));
        this.endRotation.setVec3(this.rotation.add(parent.endRotation));
        this.endScale.setVec3(this.scale.add(parent.endScale));
      }

      var ch = this.children;
      for (var i = 0; i < ch.length; ++i) {
        ch[i].transform();
      }

      return this;
    }
  }]);

  return Object3D;
}();

exports.default = Object3D;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2VuZWdyYXBoL29iamVjdC0zZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7OztBQUNBOzs7Ozs7SUFFcUIsUTtBQUVuQiwwQkFBa0M7QUFBQSxRQUFyQixFQUFxQixRQUFyQixFQUFxQjtBQUFBLDRCQUFqQixPQUFpQjtBQUFBLFFBQWpCLE9BQWlCLGdDQUFQLElBQU87O0FBQUE7O0FBQ2hDO0FBQ0EsU0FBSyxRQUFMLEdBQWdCLGdCQUFoQjtBQUNBLFNBQUssUUFBTCxHQUFnQixnQkFBaEI7QUFDQSxTQUFLLEtBQUwsR0FBYSxlQUFTLENBQVQsRUFBWSxDQUFaLEVBQWUsQ0FBZixDQUFiO0FBQ0EsU0FBSyxNQUFMLEdBQWMsZ0JBQWQ7O0FBRUE7QUFDQSxTQUFLLEVBQUwsR0FBVSxNQUFNLGlCQUFoQjtBQUNBLFNBQUssT0FBTCxHQUFlLElBQWY7QUFDQSxTQUFLLFFBQUwsR0FBZ0IsRUFBaEI7QUFDRDs7OztnQ0FFVyxRLEVBQVU7QUFDcEIsNEJBQU8sOEJBQVAsRUFBaUMsc0NBQWpDO0FBQ0EsV0FBSyxRQUFMLEdBQWdCLFFBQWhCO0FBQ0EsYUFBTyxJQUFQO0FBQ0Q7OztnQ0FFVyxRLEVBQVU7QUFDcEIsNEJBQU8sOEJBQVAsRUFBaUMsc0NBQWpDO0FBQ0EsV0FBSyxRQUFMLEdBQWdCLFFBQWhCO0FBQ0EsYUFBTyxJQUFQO0FBQ0Q7Ozs2QkFFUSxLLEVBQU87QUFDZCw0QkFBTywyQkFBUCxFQUE4QixtQ0FBOUI7QUFDQSxXQUFLLEtBQUwsR0FBYSxLQUFiO0FBQ0EsYUFBTyxJQUFQO0FBQ0Q7OzsrQ0FFK0Q7QUFBQSxVQUEzQyxRQUEyQyxTQUEzQyxRQUEyQztBQUFBLFVBQWpDLFFBQWlDLFNBQWpDLFFBQWlDO0FBQUEsVUFBdkIsS0FBdUIsU0FBdkIsS0FBdUI7QUFBQSwrQkFBaEIsTUFBZ0I7QUFBQSxVQUFoQixNQUFnQixnQ0FBUCxJQUFPOztBQUM5RCxVQUFJLFFBQUosRUFBYztB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LCBNYXQ0fSBmcm9tICcuLi9tYXRoJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcbmltcG9ydCB7dWlkfSBmcm9tICcuLi91dGlscyc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE9iamVjdDNEIHtcblxuICBjb25zdHJ1Y3Rvcih7aWQsIGRpc3BsYXkgPSB0cnVlfSkge1xuICAgIC8vIG1vZGVsIHBvc2l0aW9uLCByb3RhdGlvbiwgc2NhbGUgYW5kIGFsbCBpbiBhbGwgbWF0cml4XG4gICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBWZWMzKCk7XG4gICAgdGhpcy5yb3RhdGlvbiA9IG5ldyBWZWMzKCk7XG4gICAgdGhpcy5zY2FsZSA9IG5ldyBWZWMzKDEsIDEsIDEpO1xuICAgIHRoaXMubWF0cml4ID0gbmV3IE1hdDQoKTtcblxuICAgIC8vIHdoZXRoZXIgdG8gZGlzcGxheSB0aGUgb2JqZWN0IGF0IGFsbFxuICAgIHRoaXMuaWQgPSBpZCB8fCB1aWQoKTtcbiAgICB0aGlzLmRpc3BsYXkgPSB0cnVlO1xuICAgIHRoaXMudXNlckRhdGEgPSB7fTtcbiAgfVxuXG4gIHNldFBvc2l0aW9uKHBvc2l0aW9uKSB7XG4gICAgYXNzZXJ0KHBvc2l0aW9uIGluc3RhbmNlb2YgVmVjMywgJ3NldFBvc2l0aW9uIHJlcXVpcmVzIHZlY3RvciBhcmd1bWVudCcpO1xuICAgIHRoaXMucG9zaXRpb24gPSBwb3NpdGlvbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFJvdGF0aW9uKHJvdGF0aW9uKSB7XG4gICAgYXNzZXJ0KHJvdGF0aW9uIGluc3RhbmNlb2YgVmVjMywgJ3NldFJvdGF0aW9uIHJlcXVpcmVzIHZlY3RvciBhcmd1bWVudCcpO1xuICAgIHRoaXMucm90YXRpb24gPSByb3RhdGlvbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFNjYWxlKHNjYWxlKSB7XG4gICAgYXNzZXJ0KHNjYWxlIGluc3RhbmNlb2YgVmVjMywgJ3NldFNjYWxlIHJlcXVpcmVzIHZlY3RvciBhcmd1bWVudCcpO1xuICAgIHRoaXMuc2NhbGUgPSBzY2FsZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldE1hdHJpeENvbXBvbmVudHMoe3Bvc2l0aW9uLCByb3RhdGlvbiwgc2NhbGUsIHVwZGF0ZSA9IHRydWV9KSB7XG4gICAgaWYgKHBvc2l0aW9uKSB7XG4gICAgICB0aGlzLnNldFBvc2l0aW9uKHBvc2l0aW9uKTtcbiAgICB9XG4gICAgaWYgKHJvdGF0aW9uKSB7XG4gICAgICB0aGlzLnNldFJvdGF0aW9uKHJvdGF0aW9uKTtcbiAgICB9XG4gICAgaWYgKHNjYWxlKSB7XG4gICAgICB0aGlzLnNldFNjYWxlKHNjYWxlKTtcbiAgICB9XG4gICAgaWYgKHVwZGF0ZSkge1xuICAgICAgdGhpcy51cGRhdGVNYXRyaXgoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB1cGRhdGVNYXRyaXgoKSB7XG4gICAgY29uc3QgcG9zID0gdGhpcy5wb3NpdGlvbjtcbiAgICBjb25zdCByb3QgPSB0aGlzLnJvdGF0aW9uO1xuICAgIGNvbnN0IHNjYWxlID0gdGhpcy5zY2FsZTtcblxuICAgIHRoaXMubWF0cml4LmlkKCk7XG4gICAgdGhpcy5tYXRyaXguJHRyYW5zbGF0ZShwb3MueCwgcG9zLnksIHBvcy56KTtcbiAgICB0aGlzLm1hdHJpeC4kcm90YXRlWFlaKHJvdC54LCByb3QueSwgcm90LnopO1xuICAgIHRoaXMubWF0cml4LiRzY2FsZShzY2FsZS54LCBzY2FsZS55LCBzY2FsZS56KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHVwZGF0ZSh7cG9zaXRpb24sIHJvdGF0aW9uLCBzY2FsZX0gPSB7fSkge1xuICAgIGlmIChwb3NpdGlvbikge1xuICAgICAgdGhpcy5zZXRQb3NpdGlvbihwb3NpdGlvbik7XG4gICAgfVxuICAgIGlmIChyb3RhdGlvbikge1xuICAgICAgdGhpcy5zZXRSb3RhdGlvbihyb3RhdGlvbik7XG4gICAgfVxuICAgIGlmIChzY2FsZSkge1xuICAgICAgdGhpcy5zZXRTY2FsZShzY2FsZSk7XG4gICAgfVxuICAgIHRoaXMudXBkYXRlTWF0cml4KCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXRDb29yZGluYXRlVW5pZm9ybXModmlld01hdHJpeCkge1xuICAgIC8vIFRPRE8gLSBzb2x2ZSBtdWx0aXBsZSBjbGFzcyBwcm9ibGVtXG4gICAgLy8gYXNzZXJ0KHZpZXdNYXRyaXggaW5zdGFuY2VvZiBNYXQ0KTtcbiAgICBhc3NlcnQodmlld01hdHJpeCk7XG4gICAgY29uc3Qge21hdHJpeH0gPSB0aGlzO1xuICAgIGNvbnN0IHdvcmxkTWF0cml4ID0gdmlld01hdHJpeC5tdWxNYXQ0KG1hdHJpeCk7XG4gICAgY29uc3Qgd29ybGRJbnZlcnNlID0gd29ybGRNYXRyaXguaW52ZXJ0KCk7XG4gICAgY29uc3Qgd29ybGRJbnZlcnNlVHJhbnNwb3NlID0gd29ybGRJbnZlcnNlLnRyYW5zcG9zZSgpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIG9iamVjdE1hdHJpeDogbWF0cml4LFxuICAgICAgd29ybGRNYXRyaXg6IHdvcmxkTWF0cml4LFxuICAgICAgd29ybGRJbnZlcnNlTWF0cml4OiB3b3JsZEludmVyc2UsXG4gICAgICB3b3JsZEludmVyc2VUcmFuc3Bvc2VNYXRyaXg6IHdvcmxkSW52ZXJzZVRyYW5zcG9zZVxuICAgIH07XG4gIH1cblxuICAvLyBUT0RPIC0gY29waWVkIGNvZGUsIG5vdCB5ZXQgdmV0dGVkXG4gIHRyYW5zZm9ybSgpIHtcblxuICAgIGlmICghdGhpcy5wYXJlbnQpIHtcbiAgICAgIHRoaXMuZW5kUG9zaXRpb24uc2V0VmVjMyh0aGlzLnBvc2l0aW9uKTtcbiAgICAgIHRoaXMuZW5kUm90YXRpb24uc2V0VmVjMyh0aGlzLnJvdGF0aW9uKTtcbiAgICAgIHRoaXMuZW5kU2NhbGUuc2V0VmVjMyh0aGlzLnNjYWxlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcGFyZW50ID0gdGhpcy5wYXJlbnQ7XG4gICAgICB0aGlzLmVuZFBvc2l0aW9uLnNldFZlYzModGhpcy5wb3NpdGlvbi5hZGQocGFyZW50LmVuZFBvc2l0aW9uKSk7XG4gICAgICB0aGlzLmVuZFJvdGF0aW9uLnNldFZlYzModGhpcy5yb3RhdGlvbi5hZGQocGFyZW50LmVuZFJvdGF0aW9uKSk7XG4gICAgICB0aGlzLmVuZFNjYWxlLnNldFZlYzModGhpcy5zY2FsZS5hZGQocGFyZW50LmVuZFNjYWxlKSk7XG4gICAgfVxuXG4gICAgY29uc3QgY2ggPSB0aGlzLmNoaWxkcmVuO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2gubGVuZ3RoOyArK2kpIHtcbiAgICAgIGNoW2ldLnRyYW5zZm9ybSgpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG4iXX0=