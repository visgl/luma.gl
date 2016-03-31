'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

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
  }, {
    key: 'setPosition',
    value: function setPosition(position) {
      (0, _assert2.default)(position instanceof _math.Vec3);
      this.position = position;
      this.update();
      return this;
    }
  }, {
    key: 'setRotation',
    value: function setRotation(rotation) {
      (0, _assert2.default)(rotation instanceof _math.Vec3);
      this.rotation = rotation;
      this.update();
      return this;
    }
  }, {
    key: 'setScale',
    value: function setScale(scale) {
      (0, _assert2.default)(scale instanceof _math.Vec3);
      this.scale = scale;
      this.update();
      return this;
    }
  }, {
    key: 'update',
    value: function update() {
      var pos = this.position;
      var rot = this.rotation;
      var scale = this.scale;

      this.matrix.id();
      this.matrix.$translate(pos.x, pos.y, pos.z);
      this.matrix.$rotateXYZ(rot.x, rot.y, rot.z);
      this.matrix.$scale(scale.x, scale.y, scale.z);
      return this;
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

      for (var i = 0, ch = this.children, l = ch.length; i < l; ++i) {
        ch[i].transform();
      }

      return this;
    }
  }]);

  return Object3D;
}();

exports.default = Object3D;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2VuZWdyYXBoL29iamVjdC0zZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUlxQjtBQUNuQixXQURtQixRQUNuQixPQUFrQztRQUFyQixhQUFxQjs0QkFBakIsUUFBaUI7UUFBakIsdUNBQVUsb0JBQU87OzBCQURmLFVBQ2U7OztBQUVoQyxTQUFLLFFBQUwsR0FBZ0IsZ0JBQWhCLENBRmdDO0FBR2hDLFNBQUssUUFBTCxHQUFnQixnQkFBaEIsQ0FIZ0M7QUFJaEMsU0FBSyxLQUFMLEdBQWEsZUFBUyxDQUFULEVBQVksQ0FBWixFQUFlLENBQWYsQ0FBYixDQUpnQztBQUtoQyxTQUFLLE1BQUwsR0FBYyxnQkFBZDs7O0FBTGdDLFFBUWhDLENBQUssRUFBTCxHQUFVLE1BQU0saUJBQU4sQ0FSc0I7QUFTaEMsU0FBSyxPQUFMLEdBQWUsSUFBZixDQVRnQztBQVVoQyxTQUFLLFFBQUwsR0FBZ0IsRUFBaEIsQ0FWZ0M7R0FBbEM7O2VBRG1COzswQ0FjRyxZQUFZOzs7QUFHaEMsNEJBQU8sVUFBUCxFQUhnQztVQUl6QixTQUFVLEtBQVYsT0FKeUI7O0FBS2hDLFVBQU0sY0FBYyxXQUFXLE9BQVgsQ0FBbUIsTUFBbkIsQ0FBZCxDQUwwQjtBQU1oQyxVQUFNLGVBQWUsWUFBWSxNQUFaLEVBQWYsQ0FOMEI7QUFPaEMsVUFBTSx3QkFBd0IsYUFBYSxTQUFiLEVBQXhCLENBUDBCOztBQVNoQyxhQUFPO0FBQ0wsc0JBQWMsTUFBZDtBQUNBLHFCQUFhLFdBQWI7QUFDQSw0QkFBb0IsWUFBcEI7QUFDQSxxQ0FBNkIscUJBQTdCO09BSkYsQ0FUZ0M7Ozs7Z0NBaUJ0QixVQUFVO0FBQ3BCLDRCQUFPLDhCQUFQLEVBRG9CO0FBRXBCLFdBQUssUUFBTCxHQUFnQixRQUFoQixDQUZvQjtBQUdwQixXQUFLLE1BQUwsR0FIb0I7QUFJcEIsYUFBTyxJQUFQLENBSm9COzs7O2dDQU9WLFVBQVU7QUFDcEIsNEJBQU8sOEJBQVAsRUFEb0I7QUFFcEIsV0FBSyxRQUFMLEdBQWdCLFFBQWhCLENBRm9CO0FBR3BCLFdBQUssTUFBTCxHQUhvQjtBQUlwQixhQUFPLElBQVAsQ0FKb0I7Ozs7NkJBT2IsT0FBTztBQUNkLDRCQUFPLDJCQUFQLEVBRGM7QUFFZCxXQUFLLEtBQUwsR0FBYSxLQUFiLENBRmM7QUFHZCxXQUFLLE1BQUwsR0FIYztBQUlkLGFBQU8sSUFBUCxDQUpjOzs7OzZCQU9QO0FBQ1AsVUFBTSxNQUFNLEtBQUssUUFBTCxDQURMO0FBRVAsVUFBTSxNQUFNLEtBQUssUUFBTCxDQUZMO0FBR1AsVUFBTSxRQUFRLEtBQUssS0FBTCxDQUhQOztBQUtQLFdBQUssTUFBTCxDQUFZLEVBQVosR0FMTztBQU1QLFdBQUssTUFBTCxDQUFZLFVBQVosQ0FBdUIsSUFBSSxDQUFKLEVBQU8sSUFBSSxDQUFKLEVBQU8sSUFBSSxDQUFKLENBQXJDLENBTk87QUFPUCxXQUFLLE1BQUwsQ0FBWSxVQUFaLENBQXVCLElBQUksQ0FBSixFQUFPLElBQUksQ0FBSixFQUFPLElBQUksQ0FBSixDQUFyQyxDQVBPO0FBUVAsV0FBSyxNQUFMLENBQVksTUFBWixDQUFtQixNQUFNLENBQU4sRUFBUyxNQUFNLENBQU4sRUFBUyxNQUFNLENBQU4sQ0FBckMsQ0FSTztBQVNQLGFBQU8sSUFBUCxDQVRPOzs7Ozs7O2dDQWFHOztBQUVWLFVBQUksQ0FBQyxLQUFLLE1BQUwsRUFBYTtBQUNoQixhQUFLLFdBQUwsQ0FBaUIsT0FBakIsQ0FBeUIsS0FBSyxRQUFMLENBQXpCLENBRGdCO0FBRWhCLGFBQUssV0FBTCxDQUFpQixPQUFqQixDQUF5QixLQUFLLFFBQUwsQ0FBekIsQ0FGZ0I7QUFHaEIsYUFBSyxRQUFMLENBQWMsT0FBZCxDQUFzQixLQUFLLEtBQUwsQ0FBdEIsQ0FIZ0I7T0FBbEIsTUFJTztBQUNMLFlBQUksU0FBUyxLQUFLLE1BQUwsQ0FEUjtBQUVMLGFBQUssV0FBTCxDQUFpQixPQUFqQixDQUF5QixLQUFLLFFBQUwsQ0FBYyxHQUFkLENBQWtCLE9BQU8sV0FBUCxDQUEzQyxFQUZLO0FBR0wsYUFBSyxXQUFMLENBQWlCLE9BQWpCLENBQXlCLEtBQUssUUFBTCxDQUFjLEdBQWQsQ0FBa0IsT0FBTyxXQUFQLENBQTNDLEVBSEs7QUFJTCxhQUFLLFFBQUwsQ0FBYyxPQUFkLENBQXNCLEtBQUssS0FBTCxDQUFXLEdBQVgsQ0FBZSxPQUFPLFFBQVAsQ0FBckMsRUFKSztPQUpQOztBQVdBLFdBQUssSUFBSSxJQUFJLENBQUosRUFBTyxLQUFLLEtBQUssUUFBTCxFQUFlLElBQUksR0FBRyxNQUFILEVBQVcsSUFBSSxDQUFKLEVBQU8sRUFBRSxDQUFGLEVBQUs7QUFDN0QsV0FBRyxDQUFILEVBQU0sU0FBTixHQUQ2RDtPQUEvRDs7QUFJQSxhQUFPLElBQVAsQ0FqQlU7Ozs7U0FqRU8iLCJmaWxlIjoib2JqZWN0LTNkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtWZWMzLCBNYXQ0fSBmcm9tICcuLi9tYXRoJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcbmltcG9ydCB7dWlkfSBmcm9tICcuLi91dGlscyc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE9iamVjdDNEIHtcbiAgY29uc3RydWN0b3Ioe2lkLCBkaXNwbGF5ID0gdHJ1ZX0pIHtcbiAgICAvLyBtb2RlbCBwb3NpdGlvbiwgcm90YXRpb24sIHNjYWxlIGFuZCBhbGwgaW4gYWxsIG1hdHJpeFxuICAgIHRoaXMucG9zaXRpb24gPSBuZXcgVmVjMygpO1xuICAgIHRoaXMucm90YXRpb24gPSBuZXcgVmVjMygpO1xuICAgIHRoaXMuc2NhbGUgPSBuZXcgVmVjMygxLCAxLCAxKTtcbiAgICB0aGlzLm1hdHJpeCA9IG5ldyBNYXQ0KCk7XG5cbiAgICAvLyB3aGV0aGVyIHRvIGRpc3BsYXkgdGhlIG9iamVjdCBhdCBhbGxcbiAgICB0aGlzLmlkID0gaWQgfHwgdWlkKCk7XG4gICAgdGhpcy5kaXNwbGF5ID0gdHJ1ZTtcbiAgICB0aGlzLnVzZXJEYXRhID0ge307XG4gIH1cblxuICBnZXRDb29yZGluYXRlVW5pZm9ybXModmlld01hdHJpeCkge1xuICAgIC8vIFRPRE8gLSBzb2x2ZSBtdWx0aXBsZSBjbGFzcyBwcm9ibGVtXG4gICAgLy8gYXNzZXJ0KHZpZXdNYXRyaXggaW5zdGFuY2VvZiBNYXQ0KTtcbiAgICBhc3NlcnQodmlld01hdHJpeCk7XG4gICAgY29uc3Qge21hdHJpeH0gPSB0aGlzO1xuICAgIGNvbnN0IHdvcmxkTWF0cml4ID0gdmlld01hdHJpeC5tdWxNYXQ0KG1hdHJpeCk7XG4gICAgY29uc3Qgd29ybGRJbnZlcnNlID0gd29ybGRNYXRyaXguaW52ZXJ0KCk7XG4gICAgY29uc3Qgd29ybGRJbnZlcnNlVHJhbnNwb3NlID0gd29ybGRJbnZlcnNlLnRyYW5zcG9zZSgpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIG9iamVjdE1hdHJpeDogbWF0cml4LFxuICAgICAgd29ybGRNYXRyaXg6IHdvcmxkTWF0cml4LFxuICAgICAgd29ybGRJbnZlcnNlTWF0cml4OiB3b3JsZEludmVyc2UsXG4gICAgICB3b3JsZEludmVyc2VUcmFuc3Bvc2VNYXRyaXg6IHdvcmxkSW52ZXJzZVRyYW5zcG9zZVxuICAgIH07XG4gIH1cblxuICBzZXRQb3NpdGlvbihwb3NpdGlvbikge1xuICAgIGFzc2VydChwb3NpdGlvbiBpbnN0YW5jZW9mIFZlYzMpO1xuICAgIHRoaXMucG9zaXRpb24gPSBwb3NpdGlvbjtcbiAgICB0aGlzLnVwZGF0ZSgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0Um90YXRpb24ocm90YXRpb24pIHtcbiAgICBhc3NlcnQocm90YXRpb24gaW5zdGFuY2VvZiBWZWMzKTtcbiAgICB0aGlzLnJvdGF0aW9uID0gcm90YXRpb247XG4gICAgdGhpcy51cGRhdGUoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFNjYWxlKHNjYWxlKSB7XG4gICAgYXNzZXJ0KHNjYWxlIGluc3RhbmNlb2YgVmVjMyk7XG4gICAgdGhpcy5zY2FsZSA9IHNjYWxlO1xuICAgIHRoaXMudXBkYXRlKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB1cGRhdGUoKSB7XG4gICAgY29uc3QgcG9zID0gdGhpcy5wb3NpdGlvbjtcbiAgICBjb25zdCByb3QgPSB0aGlzLnJvdGF0aW9uO1xuICAgIGNvbnN0IHNjYWxlID0gdGhpcy5zY2FsZTtcblxuICAgIHRoaXMubWF0cml4LmlkKCk7XG4gICAgdGhpcy5tYXRyaXguJHRyYW5zbGF0ZShwb3MueCwgcG9zLnksIHBvcy56KTtcbiAgICB0aGlzLm1hdHJpeC4kcm90YXRlWFlaKHJvdC54LCByb3QueSwgcm90LnopO1xuICAgIHRoaXMubWF0cml4LiRzY2FsZShzY2FsZS54LCBzY2FsZS55LCBzY2FsZS56KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIFRPRE8gLSBjb3BpZWQgY29kZSwgbm90IHlldCB2ZXR0ZWRcbiAgdHJhbnNmb3JtKCkge1xuXG4gICAgaWYgKCF0aGlzLnBhcmVudCkge1xuICAgICAgdGhpcy5lbmRQb3NpdGlvbi5zZXRWZWMzKHRoaXMucG9zaXRpb24pO1xuICAgICAgdGhpcy5lbmRSb3RhdGlvbi5zZXRWZWMzKHRoaXMucm90YXRpb24pO1xuICAgICAgdGhpcy5lbmRTY2FsZS5zZXRWZWMzKHRoaXMuc2NhbGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgcGFyZW50ID0gdGhpcy5wYXJlbnQ7XG4gICAgICB0aGlzLmVuZFBvc2l0aW9uLnNldFZlYzModGhpcy5wb3NpdGlvbi5hZGQocGFyZW50LmVuZFBvc2l0aW9uKSk7XG4gICAgICB0aGlzLmVuZFJvdGF0aW9uLnNldFZlYzModGhpcy5yb3RhdGlvbi5hZGQocGFyZW50LmVuZFJvdGF0aW9uKSk7XG4gICAgICB0aGlzLmVuZFNjYWxlLnNldFZlYzModGhpcy5zY2FsZS5hZGQocGFyZW50LmVuZFNjYWxlKSk7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDAsIGNoID0gdGhpcy5jaGlsZHJlbiwgbCA9IGNoLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgICAgY2hbaV0udHJhbnNmb3JtKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cbiJdfQ==