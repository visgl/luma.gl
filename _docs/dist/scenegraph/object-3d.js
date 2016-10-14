'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _deprecated = require('../deprecated');

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
    this.position = new _deprecated.Vec3();
    this.rotation = new _deprecated.Vec3();
    this.scale = new _deprecated.Vec3(1, 1, 1);
    this.matrix = new _deprecated.Mat4();

    // whether to display the object at all
    this.id = id || (0, _utils.uid)();
    this.display = true;
    this.userData = {};
  }

  _createClass(Object3D, [{
    key: 'setPosition',
    value: function setPosition(position) {
      (0, _assert2.default)(position instanceof _deprecated.Vec3, 'setPosition requires vector argument');
      this.position = position;
      return this;
    }
  }, {
    key: 'setRotation',
    value: function setRotation(rotation) {
      (0, _assert2.default)(rotation instanceof _deprecated.Vec3, 'setRotation requires vector argument');
      this.rotation = rotation;
      return this;
    }
  }, {
    key: 'setScale',
    value: function setScale(scale) {
      (0, _assert2.default)(scale instanceof _deprecated.Vec3, 'setScale requires vector argument');
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
      var _ref3 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2VuZWdyYXBoL29iamVjdC0zZC5qcyJdLCJuYW1lcyI6WyJPYmplY3QzRCIsImlkIiwiZGlzcGxheSIsInBvc2l0aW9uIiwicm90YXRpb24iLCJzY2FsZSIsIm1hdHJpeCIsInVzZXJEYXRhIiwidXBkYXRlIiwic2V0UG9zaXRpb24iLCJzZXRSb3RhdGlvbiIsInNldFNjYWxlIiwidXBkYXRlTWF0cml4IiwicG9zIiwicm90IiwiJHRyYW5zbGF0ZSIsIngiLCJ5IiwieiIsIiRyb3RhdGVYWVoiLCIkc2NhbGUiLCJ2aWV3TWF0cml4Iiwid29ybGRNYXRyaXgiLCJtdWxNYXQ0Iiwid29ybGRJbnZlcnNlIiwiaW52ZXJ0Iiwid29ybGRJbnZlcnNlVHJhbnNwb3NlIiwidHJhbnNwb3NlIiwib2JqZWN0TWF0cml4Iiwid29ybGRJbnZlcnNlTWF0cml4Iiwid29ybGRJbnZlcnNlVHJhbnNwb3NlTWF0cml4IiwicGFyZW50IiwiZW5kUG9zaXRpb24iLCJzZXRWZWMzIiwiZW5kUm90YXRpb24iLCJlbmRTY2FsZSIsImFkZCIsImNoIiwiY2hpbGRyZW4iLCJpIiwibGVuZ3RoIiwidHJhbnNmb3JtIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7OztBQUNBOzs7Ozs7SUFFcUJBLFE7QUFFbkIsMEJBQWtDO0FBQUEsUUFBckJDLEVBQXFCLFFBQXJCQSxFQUFxQjtBQUFBLDRCQUFqQkMsT0FBaUI7QUFBQSxRQUFqQkEsT0FBaUIsZ0NBQVAsSUFBTzs7QUFBQTs7QUFDaEM7QUFDQSxTQUFLQyxRQUFMLEdBQWdCLHNCQUFoQjtBQUNBLFNBQUtDLFFBQUwsR0FBZ0Isc0JBQWhCO0FBQ0EsU0FBS0MsS0FBTCxHQUFhLHFCQUFTLENBQVQsRUFBWSxDQUFaLEVBQWUsQ0FBZixDQUFiO0FBQ0EsU0FBS0MsTUFBTCxHQUFjLHNCQUFkOztBQUVBO0FBQ0EsU0FBS0wsRUFBTCxHQUFVQSxNQUFNLGlCQUFoQjtBQUNBLFNBQUtDLE9BQUwsR0FBZSxJ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OUIsUUFBOUI7QUFDQSxhQUFLK0IsV0FBTCxDQUFpQkQsT0FBakIsQ0FBeUIsS0FBSzdCLFFBQTlCO0FBQ0EsYUFBSytCLFFBQUwsQ0FBY0YsT0FBZCxDQUFzQixLQUFLNUIsS0FBM0I7QUFDRCxPQUpELE1BSU87QUFDTCxZQUFNMEIsU0FBUyxLQUFLQSxNQUFwQjtBQUNBLGFBQUtDLFdBQUwsQ0FBaUJDLE9BQWpCLENBQXlCLEtBQUs5QixRQUFMLENBQWNpQyxHQUFkLENBQWtCTCxPQUFPQyxXQUF6QixDQUF6QjtBQUNBLGFBQUtFLFdBQUwsQ0FBaUJELE9BQWpCLENBQXlCLEtBQUs3QixRQUFMLENBQWNnQyxHQUFkLENBQWtCTCxPQUFPRyxXQUF6QixDQUF6QjtBQUNBLGFBQUtDLFFBQUwsQ0FBY0YsT0FBZCxDQUFzQixLQUFLNUIsS0FBTCxDQUFXK0IsR0FBWCxDQUFlTCxPQUFPSSxRQUF0QixDQUF0QjtBQUNEOztBQUVELFVBQU1FLEtBQUssS0FBS0MsUUFBaEI7QUFDQSxXQUFLLElBQUlDLElBQUksQ0FBYixFQUFnQkEsSUFBSUYsR0FBR0csTUFBdkIsRUFBK0IsRUFBRUQsQ0FBakMsRUFBb0M7QUFDbENGLFdBQUdFLENBQUgsRUFBTUUsU0FBTjtBQUNEOztBQUVELGFBQU8sSUFBUDtBQUNEOzs7Ozs7a0JBaEhrQnpDLFEiLCJmaWxlIjoib2JqZWN0LTNkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtWZWMzLCBNYXQ0fSBmcm9tICcuLi9kZXByZWNhdGVkJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcbmltcG9ydCB7dWlkfSBmcm9tICcuLi91dGlscyc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE9iamVjdDNEIHtcblxuICBjb25zdHJ1Y3Rvcih7aWQsIGRpc3BsYXkgPSB0cnVlfSkge1xuICAgIC8vIG1vZGVsIHBvc2l0aW9uLCByb3RhdGlvbiwgc2NhbGUgYW5kIGFsbCBpbiBhbGwgbWF0cml4XG4gICAgdGhpcy5wb3NpdGlvbiA9IG5ldyBWZWMzKCk7XG4gICAgdGhpcy5yb3RhdGlvbiA9IG5ldyBWZWMzKCk7XG4gICAgdGhpcy5zY2FsZSA9IG5ldyBWZWMzKDEsIDEsIDEpO1xuICAgIHRoaXMubWF0cml4ID0gbmV3IE1hdDQoKTtcblxuICAgIC8vIHdoZXRoZXIgdG8gZGlzcGxheSB0aGUgb2JqZWN0IGF0IGFsbFxuICAgIHRoaXMuaWQgPSBpZCB8fCB1aWQoKTtcbiAgICB0aGlzLmRpc3BsYXkgPSB0cnVlO1xuICAgIHRoaXMudXNlckRhdGEgPSB7fTtcbiAgfVxuXG4gIHNldFBvc2l0aW9uKHBvc2l0aW9uKSB7XG4gICAgYXNzZXJ0KHBvc2l0aW9uIGluc3RhbmNlb2YgVmVjMywgJ3NldFBvc2l0aW9uIHJlcXVpcmVzIHZlY3RvciBhcmd1bWVudCcpO1xuICAgIHRoaXMucG9zaXRpb24gPSBwb3NpdGlvbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFJvdGF0aW9uKHJvdGF0aW9uKSB7XG4gICAgYXNzZXJ0KHJvdGF0aW9uIGluc3RhbmNlb2YgVmVjMywgJ3NldFJvdGF0aW9uIHJlcXVpcmVzIHZlY3RvciBhcmd1bWVudCcpO1xuICAgIHRoaXMucm90YXRpb24gPSByb3RhdGlvbjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFNjYWxlKHNjYWxlKSB7XG4gICAgYXNzZXJ0KHNjYWxlIGluc3RhbmNlb2YgVmVjMywgJ3NldFNjYWxlIHJlcXVpcmVzIHZlY3RvciBhcmd1bWVudCcpO1xuICAgIHRoaXMuc2NhbGUgPSBzY2FsZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldE1hdHJpeENvbXBvbmVudHMoe3Bvc2l0aW9uLCByb3RhdGlvbiwgc2NhbGUsIHVwZGF0ZSA9IHRydWV9KSB7XG4gICAgaWYgKHBvc2l0aW9uKSB7XG4gICAgICB0aGlzLnNldFBvc2l0aW9uKHBvc2l0aW9uKTtcbiAgICB9XG4gICAgaWYgKHJvdGF0aW9uKSB7XG4gICAgICB0aGlzLnNldFJvdGF0aW9uKHJvdGF0aW9uKTtcbiAgICB9XG4gICAgaWYgKHNjYWxlKSB7XG4gICAgICB0aGlzLnNldFNjYWxlKHNjYWxlKTtcbiAgICB9XG4gICAgaWYgKHVwZGF0ZSkge1xuICAgICAgdGhpcy51cGRhdGVNYXRyaXgoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB1cGRhdGVNYXRyaXgoKSB7XG4gICAgY29uc3QgcG9zID0gdGhpcy5wb3NpdGlvbjtcbiAgICBjb25zdCByb3QgPSB0aGlzLnJvdGF0aW9uO1xuICAgIGNvbnN0IHNjYWxlID0gdGhpcy5zY2FsZTtcblxuICAgIHRoaXMubWF0cml4LmlkKCk7XG4gICAgdGhpcy5tYXRyaXguJHRyYW5zbGF0ZShwb3MueCwgcG9zLnksIHBvcy56KTtcbiAgICB0aGlzLm1hdHJpeC4kcm90YXRlWFlaKHJvdC54LCByb3QueSwgcm90LnopO1xuICAgIHRoaXMubWF0cml4LiRzY2FsZShzY2FsZS54LCBzY2FsZS55LCBzY2FsZS56KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHVwZGF0ZSh7cG9zaXRpb24sIHJvdGF0aW9uLCBzY2FsZX0gPSB7fSkge1xuICAgIGlmIChwb3NpdGlvbikge1xuICAgICAgdGhpcy5zZXRQb3NpdGlvbihwb3NpdGlvbik7XG4gICAgfVxuICAgIGlmIChyb3RhdGlvbikge1xuICAgICAgdGhpcy5zZXRSb3RhdGlvbihyb3RhdGlvbik7XG4gICAgfVxuICAgIGlmIChzY2FsZSkge1xuICAgICAgdGhpcy5zZXRTY2FsZShzY2FsZSk7XG4gICAgfVxuICAgIHRoaXMudXBkYXRlTWF0cml4KCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXRDb29yZGluYXRlVW5pZm9ybXModmlld01hdHJpeCkge1xuICAgIC8vIFRPRE8gLSBzb2x2ZSBtdWx0aXBsZSBjbGFzcyBwcm9ibGVtXG4gICAgLy8gYXNzZXJ0KHZpZXdNYXRyaXggaW5zdGFuY2VvZiBNYXQ0KTtcbiAgICBhc3NlcnQodmlld01hdHJpeCk7XG4gICAgY29uc3Qge21hdHJpeH0gPSB0aGlzO1xuICAgIGNvbnN0IHdvcmxkTWF0cml4ID0gdmlld01hdHJpeC5tdWxNYXQ0KG1hdHJpeCk7XG4gICAgY29uc3Qgd29ybGRJbnZlcnNlID0gd29ybGRNYXRyaXguaW52ZXJ0KCk7XG4gICAgY29uc3Qgd29ybGRJbnZlcnNlVHJhbnNwb3NlID0gd29ybGRJbnZlcnNlLnRyYW5zcG9zZSgpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIG9iamVjdE1hdHJpeDogbWF0cml4LFxuICAgICAgd29ybGRNYXRyaXgsXG4gICAgICB3b3JsZEludmVyc2VNYXRyaXg6IHdvcmxkSW52ZXJzZSxcbiAgICAgIHdvcmxkSW52ZXJzZVRyYW5zcG9zZU1hdHJpeDogd29ybGRJbnZlcnNlVHJhbnNwb3NlXG4gICAgfTtcbiAgfVxuXG4gIC8vIFRPRE8gLSBjb3BpZWQgY29kZSwgbm90IHlldCB2ZXR0ZWRcbiAgdHJhbnNmb3JtKCkge1xuXG4gICAgaWYgKCF0aGlzLnBhcmVudCkge1xuICAgICAgdGhpcy5lbmRQb3NpdGlvbi5zZXRWZWMzKHRoaXMucG9zaXRpb24pO1xuICAgICAgdGhpcy5lbmRSb3RhdGlvbi5zZXRWZWMzKHRoaXMucm90YXRpb24pO1xuICAgICAgdGhpcy5lbmRTY2FsZS5zZXRWZWMzKHRoaXMuc2NhbGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBwYXJlbnQgPSB0aGlzLnBhcmVudDtcbiAgICAgIHRoaXMuZW5kUG9zaXRpb24uc2V0VmVjMyh0aGlzLnBvc2l0aW9uLmFkZChwYXJlbnQuZW5kUG9zaXRpb24pKTtcbiAgICAgIHRoaXMuZW5kUm90YXRpb24uc2V0VmVjMyh0aGlzLnJvdGF0aW9uLmFkZChwYXJlbnQuZW5kUm90YXRpb24pKTtcbiAgICAgIHRoaXMuZW5kU2NhbGUuc2V0VmVjMyh0aGlzLnNjYWxlLmFkZChwYXJlbnQuZW5kU2NhbGUpKTtcbiAgICB9XG5cbiAgICBjb25zdCBjaCA9IHRoaXMuY2hpbGRyZW47XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaC5sZW5ndGg7ICsraSkge1xuICAgICAgY2hbaV0udHJhbnNmb3JtKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cbiJdfQ==