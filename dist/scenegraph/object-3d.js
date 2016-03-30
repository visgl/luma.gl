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
    key: 'update',
    value: function update() {
      var pos = this.position;
      var rot = this.rotation;
      var scale = this.scale;

      this.matrix.id();
      this.matrix.$translate(pos.x, pos.y, pos.z);
      this.matrix.$rotateXYZ(rot.x, rot.y, rot.z);
      this.matrix.$scale(scale.x, scale.y, scale.z);
    }
  }, {
    key: 'getCoordinateUniforms',
    value: function getCoordinateUniforms(viewMatrix) {
      (0, _assert2.default)(viewMatrix instanceof _math.Mat4);
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

      for (var i = 0, ch = this.children, l = ch.length; i < l; ++i) {
        ch[i].transform();
      }
    }
  }]);

  return Object3D;
}();

exports.default = Object3D;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2VuZWdyYXBoL29iamVjdC0zZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUlxQjtBQUNuQixXQURtQixRQUNuQixPQUFrQztRQUFyQixhQUFxQjs0QkFBakIsUUFBaUI7UUFBakIsdUNBQVUsb0JBQU87OzBCQURmLFVBQ2U7OztBQUVoQyxTQUFLLFFBQUwsR0FBZ0IsZ0JBQWhCLENBRmdDO0FBR2hDLFNBQUssUUFBTCxHQUFnQixnQkFBaEIsQ0FIZ0M7QUFJaEMsU0FBSyxLQUFMLEdBQWEsZUFBUyxDQUFULEVBQVksQ0FBWixFQUFlLENBQWYsQ0FBYixDQUpnQztBQUtoQyxTQUFLLE1BQUwsR0FBYyxnQkFBZDs7O0FBTGdDLFFBUWhDLENBQUssRUFBTCxHQUFVLE1BQU0saUJBQU4sQ0FSc0I7QUFTaEMsU0FBSyxPQUFMLEdBQWUsSUFBZixDQVRnQztBQVVoQyxTQUFLLFFBQUwsR0FBZ0IsRUFBaEIsQ0FWZ0M7R0FBbEM7O2VBRG1COzs2QkFjVjtBQUNQLFVBQU0sTUFBTSxLQUFLLFFBQUwsQ0FETDtBQUVQLFVBQU0sTUFBTSxLQUFLLFFBQUwsQ0FGTDtBQUdQLFVBQU0sUUFBUSxLQUFLLEtBQUwsQ0FIUDs7QUFLUCxXQUFLLE1BQUwsQ0FBWSxFQUFaLEdBTE87QUFNUCxXQUFLLE1BQUwsQ0FBWSxVQUFaLENBQXVCLElBQUksQ0FBSixFQUFPLElBQUksQ0FBSixFQUFPLElBQUksQ0FBSixDQUFyQyxDQU5PO0FBT1AsV0FBSyxNQUFMLENBQVksVUFBWixDQUF1QixJQUFJLENBQUosRUFBTyxJQUFJLENBQUosRUFBTyxJQUFJLENBQUosQ0FBckMsQ0FQTztBQVFQLFdBQUssTUFBTCxDQUFZLE1BQVosQ0FBbUIsTUFBTSxDQUFOLEVBQVMsTUFBTSxDQUFOLEVBQVMsTUFBTSxDQUFOLENBQXJDLENBUk87Ozs7MENBV2EsWUFBWTtBQUNoQyw0QkFBTyxnQ0FBUCxFQURnQztVQUV6QixTQUFVLEtBQVYsT0FGeUI7O0FBR2hDLFVBQU0sY0FBYyxXQUFXLE9BQVgsQ0FBbUIsTUFBbkIsQ0FBZCxDQUgwQjtBQUloQyxVQUFNLGVBQWUsWUFBWSxNQUFaLEVBQWYsQ0FKMEI7QUFLaEMsVUFBTSx3QkFBd0IsYUFBYSxTQUFiLEVBQXhCLENBTDBCOztBQU9oQyxhQUFPO0FBQ0wsc0JBQWMsTUFBZDtBQUNBLHFCQUFhLFdBQWI7QUFDQSw0QkFBb0IsWUFBcEI7QUFDQSxxQ0FBNkIscUJBQTdCO09BSkYsQ0FQZ0M7Ozs7Ozs7Z0NBZ0J0Qjs7QUFFVixVQUFJLENBQUMsS0FBSyxNQUFMLEVBQWE7QUFDaEIsYUFBSyxXQUFMLENBQWlCLE9BQWpCLENBQXlCLEtBQUssUUFBTCxDQUF6QixDQURnQjtBQUVoQixhQUFLLFdBQUwsQ0FBaUIsT0FBakIsQ0FBeUIsS0FBSyxRQUFMLENBQXpCLENBRmdCO0FBR2hCLGFBQUssUUFBTCxDQUFjLE9BQWQsQ0FBc0IsS0FBSyxLQUFMLENBQXRCLENBSGdCO09BQWxCLE1BSU87QUFDTCxZQUFJLFNBQVMsS0FBSyxNQUFMLENBRFI7QUFFTCxhQUFLLFdBQUwsQ0FBaUIsT0FBakIsQ0FBeUIsS0FBSyxRQUFMLENBQWMsR0FBZCxDQUFrQixPQUFPLFdBQVAsQ0FBM0MsRUFGSztBQUdMLGFBQUssV0FBTCxDQUFpQixPQUFqQixDQUF5QixLQUFLLFFBQUwsQ0FBYyxHQUFkLENBQWtCLE9BQU8sV0FBUCxDQUEzQyxFQUhLO0FBSUwsYUFBSyxRQUFMLENBQWMsT0FBZCxDQUFzQixLQUFLLEtBQUwsQ0FBVyxHQUFYLENBQWUsT0FBTyxRQUFQLENBQXJDLEVBSks7T0FKUDs7QUFXQSxXQUFLLElBQUksSUFBSSxDQUFKLEVBQU8sS0FBSyxLQUFLLFFBQUwsRUFBZSxJQUFJLEdBQUcsTUFBSCxFQUFXLElBQUksQ0FBSixFQUFPLEVBQUUsQ0FBRixFQUFLO0FBQzdELFdBQUcsQ0FBSCxFQUFNLFNBQU4sR0FENkQ7T0FBL0Q7Ozs7U0F0RGlCIiwiZmlsZSI6Im9iamVjdC0zZC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7VmVjMywgTWF0NH0gZnJvbSAnLi4vbWF0aCc7XG5pbXBvcnQgYXNzZXJ0IGZyb20gJ2Fzc2VydCc7XG5pbXBvcnQge3VpZH0gZnJvbSAnLi4vdXRpbHMnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBPYmplY3QzRCB7XG4gIGNvbnN0cnVjdG9yKHtpZCwgZGlzcGxheSA9IHRydWV9KSB7XG4gICAgLy8gbW9kZWwgcG9zaXRpb24sIHJvdGF0aW9uLCBzY2FsZSBhbmQgYWxsIGluIGFsbCBtYXRyaXhcbiAgICB0aGlzLnBvc2l0aW9uID0gbmV3IFZlYzMoKTtcbiAgICB0aGlzLnJvdGF0aW9uID0gbmV3IFZlYzMoKTtcbiAgICB0aGlzLnNjYWxlID0gbmV3IFZlYzMoMSwgMSwgMSk7XG4gICAgdGhpcy5tYXRyaXggPSBuZXcgTWF0NCgpO1xuXG4gICAgLy8gd2hldGhlciB0byBkaXNwbGF5IHRoZSBvYmplY3QgYXQgYWxsXG4gICAgdGhpcy5pZCA9IGlkIHx8IHVpZCgpO1xuICAgIHRoaXMuZGlzcGxheSA9IHRydWU7XG4gICAgdGhpcy51c2VyRGF0YSA9IHt9O1xuICB9XG5cbiAgdXBkYXRlKCkge1xuICAgIGNvbnN0IHBvcyA9IHRoaXMucG9zaXRpb247XG4gICAgY29uc3Qgcm90ID0gdGhpcy5yb3RhdGlvbjtcbiAgICBjb25zdCBzY2FsZSA9IHRoaXMuc2NhbGU7XG5cbiAgICB0aGlzLm1hdHJpeC5pZCgpO1xuICAgIHRoaXMubWF0cml4LiR0cmFuc2xhdGUocG9zLngsIHBvcy55LCBwb3Mueik7XG4gICAgdGhpcy5tYXRyaXguJHJvdGF0ZVhZWihyb3QueCwgcm90LnksIHJvdC56KTtcbiAgICB0aGlzLm1hdHJpeC4kc2NhbGUoc2NhbGUueCwgc2NhbGUueSwgc2NhbGUueik7XG4gIH1cblxuICBnZXRDb29yZGluYXRlVW5pZm9ybXModmlld01hdHJpeCkge1xuICAgIGFzc2VydCh2aWV3TWF0cml4IGluc3RhbmNlb2YgTWF0NCk7XG4gICAgY29uc3Qge21hdHJpeH0gPSB0aGlzO1xuICAgIGNvbnN0IHdvcmxkTWF0cml4ID0gdmlld01hdHJpeC5tdWxNYXQ0KG1hdHJpeCk7XG4gICAgY29uc3Qgd29ybGRJbnZlcnNlID0gd29ybGRNYXRyaXguaW52ZXJ0KCk7XG4gICAgY29uc3Qgd29ybGRJbnZlcnNlVHJhbnNwb3NlID0gd29ybGRJbnZlcnNlLnRyYW5zcG9zZSgpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIG9iamVjdE1hdHJpeDogbWF0cml4LFxuICAgICAgd29ybGRNYXRyaXg6IHdvcmxkTWF0cml4LFxuICAgICAgd29ybGRJbnZlcnNlTWF0cml4OiB3b3JsZEludmVyc2UsXG4gICAgICB3b3JsZEludmVyc2VUcmFuc3Bvc2VNYXRyaXg6IHdvcmxkSW52ZXJzZVRyYW5zcG9zZVxuICAgIH07XG4gIH1cblxuICAvLyBUT0RPIC0gY29waWVkIGNvZGUsIG5vdCB5ZXQgdmV0dGVkXG4gIHRyYW5zZm9ybSgpIHtcblxuICAgIGlmICghdGhpcy5wYXJlbnQpIHtcbiAgICAgIHRoaXMuZW5kUG9zaXRpb24uc2V0VmVjMyh0aGlzLnBvc2l0aW9uKTtcbiAgICAgIHRoaXMuZW5kUm90YXRpb24uc2V0VmVjMyh0aGlzLnJvdGF0aW9uKTtcbiAgICAgIHRoaXMuZW5kU2NhbGUuc2V0VmVjMyh0aGlzLnNjYWxlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHBhcmVudCA9IHRoaXMucGFyZW50O1xuICAgICAgdGhpcy5lbmRQb3NpdGlvbi5zZXRWZWMzKHRoaXMucG9zaXRpb24uYWRkKHBhcmVudC5lbmRQb3NpdGlvbikpO1xuICAgICAgdGhpcy5lbmRSb3RhdGlvbi5zZXRWZWMzKHRoaXMucm90YXRpb24uYWRkKHBhcmVudC5lbmRSb3RhdGlvbikpO1xuICAgICAgdGhpcy5lbmRTY2FsZS5zZXRWZWMzKHRoaXMuc2NhbGUuYWRkKHBhcmVudC5lbmRTY2FsZSkpO1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAwLCBjaCA9IHRoaXMuY2hpbGRyZW4sIGwgPSBjaC5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICAgIGNoW2ldLnRyYW5zZm9ybSgpO1xuICAgIH1cbiAgfVxufVxuIl19