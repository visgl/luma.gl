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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2VuZWdyYXBoL29iamVjdC0zZC5qcyJdLCJuYW1lcyI6WyJPYmplY3QzRCIsImlkIiwiZGlzcGxheSIsInBvc2l0aW9uIiwicm90YXRpb24iLCJzY2FsZSIsIm1hdHJpeCIsInVzZXJEYXRhIiwidXBkYXRlIiwic2V0UG9zaXRpb24iLCJzZXRSb3RhdGlvbiIsInNldFNjYWxlIiwidXBkYXRlTWF0cml4IiwicG9zIiwicm90IiwiJHRyYW5zbGF0ZSIsIngiLCJ5IiwieiIsIiRyb3RhdGVYWVoiLCIkc2NhbGUiLCJ2aWV3TWF0cml4Iiwid29ybGRNYXRyaXgiLCJtdWxNYXQ0Iiwid29ybGRJbnZlcnNlIiwiaW52ZXJ0Iiwid29ybGRJbnZlcnNlVHJhbnNwb3NlIiwidHJhbnNwb3NlIiwib2JqZWN0TWF0cml4Iiwid29ybGRJbnZlcnNlTWF0cml4Iiwid29ybGRJbnZlcnNlVHJhbnNwb3NlTWF0cml4IiwicGFyZW50IiwiZW5kUG9zaXRpb24iLCJzZXRWZWMzIiwiZW5kUm90YXRpb24iLCJlbmRTY2FsZSIsImFkZCIsImNoIiwiY2hpbGRyZW4iLCJpIiwibGVuZ3RoIiwidHJhbnNmb3JtIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7OztBQUNBOzs7Ozs7SUFFcUJBLFE7QUFFbkIsMEJBQWtDO0FBQUEsUUFBckJDLEVBQXFCLFFBQXJCQSxFQUFxQjtBQUFBLDRCQUFqQkMsT0FBaUI7QUFBQSxRQUFqQkEsT0FBaUIsZ0NBQVAsSUFBTzs7QUFBQTs7QUFDaEM7QUFDQSxTQUFLQyxRQUFMLEdBQWdCLGdCQUFoQjtBQUNBLFNBQUtDLFFBQUwsR0FBZ0IsZ0JBQWhCO0FBQ0EsU0FBS0MsS0FBTCxHQUFhLGVBQVMsQ0FBVCxFQUFZLENBQVosRUFBZSxDQUFmLENBQWI7QUFDQSxTQUFLQyxNQUFMLEdBQWMsZ0JBQWQ7O0FBRUE7QUFDQSxTQUFLTCxFQUFMLEdBQVVBLE1BQU0saUJBQWhCO0FBQ0EsU0FBS0MsT0FBTCxHQUFlLElB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QixRQUE5QjtBQUNBLGFBQUsrQixXQUFMLENBQWlCRCxPQUFqQixDQUF5QixLQUFLN0IsUUFBOUI7QUFDQSxhQUFLK0IsUUFBTCxDQUFjRixPQUFkLENBQXNCLEtBQUs1QixLQUEzQjtBQUNELE9BSkQsTUFJTztBQUNMLFlBQU0wQixTQUFTLEtBQUtBLE1BQXBCO0FBQ0EsYUFBS0MsV0FBTCxDQUFpQkMsT0FBakIsQ0FBeUIsS0FBSzlCLFFBQUwsQ0FBY2lDLEdBQWQsQ0FBa0JMLE9BQU9DLFdBQXpCLENBQXpCO0FBQ0EsYUFBS0UsV0FBTCxDQUFpQkQsT0FBakIsQ0FBeUIsS0FBSzdCLFFBQUwsQ0FBY2dDLEdBQWQsQ0FBa0JMLE9BQU9HLFdBQXpCLENBQXpCO0FBQ0EsYUFBS0MsUUFBTCxDQUFjRixPQUFkLENBQXNCLEtBQUs1QixLQUFMLENBQVcrQixHQUFYLENBQWVMLE9BQU9JLFFBQXRCLENBQXRCO0FBQ0Q7O0FBRUQsVUFBTUUsS0FBSyxLQUFLQyxRQUFoQjtBQUNBLFdBQUssSUFBSUMsSUFBSSxDQUFiLEVBQWdCQSxJQUFJRixHQUFHRyxNQUF2QixFQUErQixFQUFFRCxDQUFqQyxFQUFvQztBQUNsQ0YsV0FBR0UsQ0FBSCxFQUFNRSxTQUFOO0FBQ0Q7O0FBRUQsYUFBTyxJQUFQO0FBQ0Q7Ozs7OztrQkFoSGtCekMsUSIsImZpbGUiOiJvYmplY3QtM2QuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1ZlYzMsIE1hdDR9IGZyb20gJy4uL21hdGgnO1xuaW1wb3J0IGFzc2VydCBmcm9tICdhc3NlcnQnO1xuaW1wb3J0IHt1aWR9IGZyb20gJy4uL3V0aWxzJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgT2JqZWN0M0Qge1xuXG4gIGNvbnN0cnVjdG9yKHtpZCwgZGlzcGxheSA9IHRydWV9KSB7XG4gICAgLy8gbW9kZWwgcG9zaXRpb24sIHJvdGF0aW9uLCBzY2FsZSBhbmQgYWxsIGluIGFsbCBtYXRyaXhcbiAgICB0aGlzLnBvc2l0aW9uID0gbmV3IFZlYzMoKTtcbiAgICB0aGlzLnJvdGF0aW9uID0gbmV3IFZlYzMoKTtcbiAgICB0aGlzLnNjYWxlID0gbmV3IFZlYzMoMSwgMSwgMSk7XG4gICAgdGhpcy5tYXRyaXggPSBuZXcgTWF0NCgpO1xuXG4gICAgLy8gd2hldGhlciB0byBkaXNwbGF5IHRoZSBvYmplY3QgYXQgYWxsXG4gICAgdGhpcy5pZCA9IGlkIHx8IHVpZCgpO1xuICAgIHRoaXMuZGlzcGxheSA9IHRydWU7XG4gICAgdGhpcy51c2VyRGF0YSA9IHt9O1xuICB9XG5cbiAgc2V0UG9zaXRpb24ocG9zaXRpb24pIHtcbiAgICBhc3NlcnQocG9zaXRpb24gaW5zdGFuY2VvZiBWZWMzLCAnc2V0UG9zaXRpb24gcmVxdWlyZXMgdmVjdG9yIGFyZ3VtZW50Jyk7XG4gICAgdGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0Um90YXRpb24ocm90YXRpb24pIHtcbiAgICBhc3NlcnQocm90YXRpb24gaW5zdGFuY2VvZiBWZWMzLCAnc2V0Um90YXRpb24gcmVxdWlyZXMgdmVjdG9yIGFyZ3VtZW50Jyk7XG4gICAgdGhpcy5yb3RhdGlvbiA9IHJvdGF0aW9uO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0U2NhbGUoc2NhbGUpIHtcbiAgICBhc3NlcnQoc2NhbGUgaW5zdGFuY2VvZiBWZWMzLCAnc2V0U2NhbGUgcmVxdWlyZXMgdmVjdG9yIGFyZ3VtZW50Jyk7XG4gICAgdGhpcy5zY2FsZSA9IHNjYWxlO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0TWF0cml4Q29tcG9uZW50cyh7cG9zaXRpb24sIHJvdGF0aW9uLCBzY2FsZSwgdXBkYXRlID0gdHJ1ZX0pIHtcbiAgICBpZiAocG9zaXRpb24pIHtcbiAgICAgIHRoaXMuc2V0UG9zaXRpb24ocG9zaXRpb24pO1xuICAgIH1cbiAgICBpZiAocm90YXRpb24pIHtcbiAgICAgIHRoaXMuc2V0Um90YXRpb24ocm90YXRpb24pO1xuICAgIH1cbiAgICBpZiAoc2NhbGUpIHtcbiAgICAgIHRoaXMuc2V0U2NhbGUoc2NhbGUpO1xuICAgIH1cbiAgICBpZiAodXBkYXRlKSB7XG4gICAgICB0aGlzLnVwZGF0ZU1hdHJpeCgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHVwZGF0ZU1hdHJpeCgpIHtcbiAgICBjb25zdCBwb3MgPSB0aGlzLnBvc2l0aW9uO1xuICAgIGNvbnN0IHJvdCA9IHRoaXMucm90YXRpb247XG4gICAgY29uc3Qgc2NhbGUgPSB0aGlzLnNjYWxlO1xuXG4gICAgdGhpcy5tYXRyaXguaWQoKTtcbiAgICB0aGlzLm1hdHJpeC4kdHJhbnNsYXRlKHBvcy54LCBwb3MueSwgcG9zLnopO1xuICAgIHRoaXMubWF0cml4LiRyb3RhdGVYWVoocm90LngsIHJvdC55LCByb3Queik7XG4gICAgdGhpcy5tYXRyaXguJHNjYWxlKHNjYWxlLngsIHNjYWxlLnksIHNjYWxlLnopO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgdXBkYXRlKHtwb3NpdGlvbiwgcm90YXRpb24sIHNjYWxlfSA9IHt9KSB7XG4gICAgaWYgKHBvc2l0aW9uKSB7XG4gICAgICB0aGlzLnNldFBvc2l0aW9uKHBvc2l0aW9uKTtcbiAgICB9XG4gICAgaWYgKHJvdGF0aW9uKSB7XG4gICAgICB0aGlzLnNldFJvdGF0aW9uKHJvdGF0aW9uKTtcbiAgICB9XG4gICAgaWYgKHNjYWxlKSB7XG4gICAgICB0aGlzLnNldFNjYWxlKHNjYWxlKTtcbiAgICB9XG4gICAgdGhpcy51cGRhdGVNYXRyaXgoKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldENvb3JkaW5hdGVVbmlmb3Jtcyh2aWV3TWF0cml4KSB7XG4gICAgLy8gVE9ETyAtIHNvbHZlIG11bHRpcGxlIGNsYXNzIHByb2JsZW1cbiAgICAvLyBhc3NlcnQodmlld01hdHJpeCBpbnN0YW5jZW9mIE1hdDQpO1xuICAgIGFzc2VydCh2aWV3TWF0cml4KTtcbiAgICBjb25zdCB7bWF0cml4fSA9IHRoaXM7XG4gICAgY29uc3Qgd29ybGRNYXRyaXggPSB2aWV3TWF0cml4Lm11bE1hdDQobWF0cml4KTtcbiAgICBjb25zdCB3b3JsZEludmVyc2UgPSB3b3JsZE1hdHJpeC5pbnZlcnQoKTtcbiAgICBjb25zdCB3b3JsZEludmVyc2VUcmFuc3Bvc2UgPSB3b3JsZEludmVyc2UudHJhbnNwb3NlKCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgb2JqZWN0TWF0cml4OiBtYXRyaXgsXG4gICAgICB3b3JsZE1hdHJpeCxcbiAgICAgIHdvcmxkSW52ZXJzZU1hdHJpeDogd29ybGRJbnZlcnNlLFxuICAgICAgd29ybGRJbnZlcnNlVHJhbnNwb3NlTWF0cml4OiB3b3JsZEludmVyc2VUcmFuc3Bvc2VcbiAgICB9O1xuICB9XG5cbiAgLy8gVE9ETyAtIGNvcGllZCBjb2RlLCBub3QgeWV0IHZldHRlZFxuICB0cmFuc2Zvcm0oKSB7XG5cbiAgICBpZiAoIXRoaXMucGFyZW50KSB7XG4gICAgICB0aGlzLmVuZFBvc2l0aW9uLnNldFZlYzModGhpcy5wb3NpdGlvbik7XG4gICAgICB0aGlzLmVuZFJvdGF0aW9uLnNldFZlYzModGhpcy5yb3RhdGlvbik7XG4gICAgICB0aGlzLmVuZFNjYWxlLnNldFZlYzModGhpcy5zY2FsZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHBhcmVudCA9IHRoaXMucGFyZW50O1xuICAgICAgdGhpcy5lbmRQb3NpdGlvbi5zZXRWZWMzKHRoaXMucG9zaXRpb24uYWRkKHBhcmVudC5lbmRQb3NpdGlvbikpO1xuICAgICAgdGhpcy5lbmRSb3RhdGlvbi5zZXRWZWMzKHRoaXMucm90YXRpb24uYWRkKHBhcmVudC5lbmRSb3RhdGlvbikpO1xuICAgICAgdGhpcy5lbmRTY2FsZS5zZXRWZWMzKHRoaXMuc2NhbGUuYWRkKHBhcmVudC5lbmRTY2FsZSkpO1xuICAgIH1cblxuICAgIGNvbnN0IGNoID0gdGhpcy5jaGlsZHJlbjtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNoLmxlbmd0aDsgKytpKSB7XG4gICAgICBjaFtpXS50cmFuc2Zvcm0oKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxufVxuIl19