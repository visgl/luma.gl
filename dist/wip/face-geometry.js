'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FaceGeometry = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _geometry = require('../geometry');

var _geometry2 = _interopRequireDefault(_geometry);

var _math = require('../math');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var FaceGeometry = exports.FaceGeometry = function (_Geometry) {
  _inherits(FaceGeometry, _Geometry);

  function FaceGeometry() {
    _classCallCheck(this, FaceGeometry);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(FaceGeometry).apply(this, arguments));
  }

  _createClass(FaceGeometry, [{
    key: 'computeCentroids',
    value: function computeCentroids() {
      var faces = this.faces;
      var vertices = this.vertices;
      var centroids = [];

      faces.forEach(function (face) {
        var centroid = [0, 0, 0];
        var acum = 0;

        face.forEach(function (idx) {
          var vertex = vertices[idx];
          centroid[0] += vertex[0];
          centroid[1] += vertex[1];
          centroid[2] += vertex[2];
          acum++;
        });

        centroid[0] /= acum;
        centroid[1] /= acum;
        centroid[2] /= acum;

        centroids.push(centroid);
      });

      this.centroids = centroids;
    }
  }, {
    key: 'computeNormals',
    value: function computeNormals() {
      var faces = this.faces;
      var vertices = this.vertices;
      var normals = [];

      faces.forEach(function (face) {
        var v1 = vertices[face[0]];
        var v2 = vertices[face[1]];
        var v3 = vertices[face[2]];
        var dir1 = {
          x: v3[0] - v2[0],
          y: v3[1] - v2[1],
          z: v3[1] - v2[2]
        };
        var dir2 = {
          x: v1[0] - v2[0],
          y: v1[1] - v2[1],
          z: v1[2] - v2[2]
        };

        _math.Vec3.$cross(dir2, dir1);

        if (_math.Vec3.norm(dir2) > 1e-6) {
          _math.Vec3.unit(dir2);
        }

        normals.push([dir2.x, dir2.y, dir2.z]);
      });

      this.normals = normals;
    }
  }]);

  return FaceGeometry;
}(_geometry2.default);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93aXAvZmFjZS1nZW9tZXRyeS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7OztBQUNBOzs7Ozs7Ozs7O0lBRWE7Ozs7Ozs7Ozs7O3VDQUVRO0FBQ2pCLFVBQU0sUUFBUSxLQUFLLEtBQUwsQ0FERztBQUVqQixVQUFNLFdBQVcsS0FBSyxRQUFMLENBRkE7QUFHakIsVUFBTSxZQUFZLEVBQVosQ0FIVzs7QUFLakIsWUFBTSxPQUFOLENBQWMsZ0JBQVE7QUFDcEIsWUFBTSxXQUFXLENBQUMsQ0FBRCxFQUFJLENBQUosRUFBTyxDQUFQLENBQVgsQ0FEYztBQUVwQixZQUFJLE9BQU8sQ0FBUCxDQUZnQjs7QUFJcEIsYUFBSyxPQUFMLENBQWEsZUFBTztBQUNsQixjQUFNLFNBQVMsU0FBUyxHQUFULENBQVQsQ0FEWTtBQUVsQixtQkFBUyxDQUFULEtBQWUsT0FBTyxDQUFQLENBQWYsQ0FGa0I7QUFHbEIsbUJBQVMsQ0FBVCxLQUFlLE9BQU8sQ0FBUCxDQUFmLENBSGtCO0FBSWxCLG1CQUFTLENBQVQsS0FBZSxPQUFPLENBQVAsQ0FBZixDQUprQjtBQUtsQixpQkFMa0I7U0FBUCxDQUFiLENBSm9COztBQVlwQixpQkFBUyxDQUFULEtBQWUsSUFBZixDQVpvQjtBQWFwQixpQkFBUyxDQUFULEtBQWUsSUFBZixDQWJvQjtBQWNwQixpQkFBUyxDQUFULEtBQWUsSUFBZixDQWRvQjs7QUFnQnBCLGtCQUFVLElBQVYsQ0FBZSxRQUFmLEVBaEJvQjtPQUFSLENBQWQsQ0FMaUI7O0FBd0JqQixXQUFLLFNBQUwsR0FBaUIsU0FBakIsQ0F4QmlCOzs7O3FDQTJCRjtBQUNmLFVBQU0sUUFBUSxLQUFLLEtBQUwsQ0FEQztBQUVmLFVBQU0sV0FBVyxLQUFLLFFBQUwsQ0FGRjtBQUdmLFVBQU0sVUFBVSxFQUFWLENBSFM7O0FBS2YsWUFBTSxPQUFOLENBQWMsZ0JBQVE7QUFDcEIsWUFBTSxLQUFLLFNBQVMsS0FBSyxDQUFMLENBQVQsQ0FBTCxDQURjO0FBRXBCLFlBQU0sS0FBSyxTQUFTLEtBQUssQ0FBTCxDQUFULENBQUwsQ0FGYztBQUdwQixZQUFNLEtBQUssU0FBUyxLQUFLLENBQUwsQ0FBVCxDQUFMLENBSGM7QUFJcEIsWUFBTSxPQUFPO0FBQ1gsYUFBRyxHQUFHLENBQUgsSUFBUSxHQUFHLENBQUgsQ0FBUjtBQUNILGFBQUcsR0FBRyxDQUFILElBQVEsR0FBRyxDQUFILENBQVI7QUFDSCxhQUFHLEdBQUcsQ0FBSCxJQUFRLEdBQUcsQ0FBSCxDQUFSO1NBSEMsQ0FKYztBQVNwQixZQUFNLE9BQU87QUFDWCxhQUFHLEdBQUcsQ0FBSCxJQUFRLEdBQUcsQ0FBSCxDQUFSO0FBQ0gsYUFBRyxHQUFHLENBQUgsSUFBUSxHQUFHLENBQUgsQ0FBUjtBQUNILGFBQUcsR0FBRyxDQUFILElBQVEsR0FBRyxDQUFILENBQVI7U0FIQyxDQVRjOztBQWVwQixtQkFBSyxNQUFMLENBQVksSUFBWixFQUFrQixJQUFsQixFQWZvQjs7QUFpQnBCLFlBQUksV0FBSyxJQUFMLENBQVUsSUFBVixJQUFrQixJQUFsQixFQUF3QjtBQUMxQixxQkFBSyxJQUFMLENBQVUsSUFBVixFQUQwQjtTQUE1Qjs7QUFJQSxnQkFBUSxJQUFSLENBQWEsQ0FBQyxLQUFLLENBQUwsRUFBUSxLQUFLLENBQUwsRUFBUSxLQUFLLENBQUwsQ0FBOUIsRUFyQm9CO09BQVIsQ0FBZCxDQUxlOztBQTZCZixXQUFLLE9BQUwsR0FBZSxPQUFmLENBN0JlOzs7O1NBN0JOIiwiZmlsZSI6ImZhY2UtZ2VvbWV0cnkuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgR2VvbWV0cnkgZnJvbSAnLi4vZ2VvbWV0cnknO1xuaW1wb3J0IHtWZWMzfSBmcm9tICcuLi9tYXRoJztcblxuZXhwb3J0IGNsYXNzIEZhY2VHZW9tZXRyeSBleHRlbmRzIEdlb21ldHJ5IHtcblxuICBjb21wdXRlQ2VudHJvaWRzKCkge1xuICAgIGNvbnN0IGZhY2VzID0gdGhpcy5mYWNlcztcbiAgICBjb25zdCB2ZXJ0aWNlcyA9IHRoaXMudmVydGljZXM7XG4gICAgY29uc3QgY2VudHJvaWRzID0gW107XG5cbiAgICBmYWNlcy5mb3JFYWNoKGZhY2UgPT4ge1xuICAgICAgY29uc3QgY2VudHJvaWQgPSBbMCwgMCwgMF07XG4gICAgICBsZXQgYWN1bSA9IDA7XG5cbiAgICAgIGZhY2UuZm9yRWFjaChpZHggPT4ge1xuICAgICAgICBjb25zdCB2ZXJ0ZXggPSB2ZXJ0aWNlc1tpZHhdO1xuICAgICAgICBjZW50cm9pZFswXSArPSB2ZXJ0ZXhbMF07XG4gICAgICAgIGNlbnRyb2lkWzFdICs9IHZlcnRleFsxXTtcbiAgICAgICAgY2VudHJvaWRbMl0gKz0gdmVydGV4WzJdO1xuICAgICAgICBhY3VtKys7XG4gICAgICB9KTtcblxuICAgICAgY2VudHJvaWRbMF0gLz0gYWN1bTtcbiAgICAgIGNlbnRyb2lkWzFdIC89IGFjdW07XG4gICAgICBjZW50cm9pZFsyXSAvPSBhY3VtO1xuXG4gICAgICBjZW50cm9pZHMucHVzaChjZW50cm9pZCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLmNlbnRyb2lkcyA9IGNlbnRyb2lkcztcbiAgfVxuXG4gIGNvbXB1dGVOb3JtYWxzKCkge1xuICAgIGNvbnN0IGZhY2VzID0gdGhpcy5mYWNlcztcbiAgICBjb25zdCB2ZXJ0aWNlcyA9IHRoaXMudmVydGljZXM7XG4gICAgY29uc3Qgbm9ybWFscyA9IFtdO1xuXG4gICAgZmFjZXMuZm9yRWFjaChmYWNlID0+IHtcbiAgICAgIGNvbnN0IHYxID0gdmVydGljZXNbZmFjZVswXV07XG4gICAgICBjb25zdCB2MiA9IHZlcnRpY2VzW2ZhY2VbMV1dO1xuICAgICAgY29uc3QgdjMgPSB2ZXJ0aWNlc1tmYWNlWzJdXTtcbiAgICAgIGNvbnN0IGRpcjEgPSB7XG4gICAgICAgIHg6IHYzWzBdIC0gdjJbMF0sXG4gICAgICAgIHk6IHYzWzFdIC0gdjJbMV0sXG4gICAgICAgIHo6IHYzWzFdIC0gdjJbMl1cbiAgICAgIH07XG4gICAgICBjb25zdCBkaXIyID0ge1xuICAgICAgICB4OiB2MVswXSAtIHYyWzBdLFxuICAgICAgICB5OiB2MVsxXSAtIHYyWzFdLFxuICAgICAgICB6OiB2MVsyXSAtIHYyWzJdXG4gICAgICB9O1xuXG4gICAgICBWZWMzLiRjcm9zcyhkaXIyLCBkaXIxKTtcblxuICAgICAgaWYgKFZlYzMubm9ybShkaXIyKSA+IDFlLTYpIHtcbiAgICAgICAgVmVjMy51bml0KGRpcjIpO1xuICAgICAgfVxuXG4gICAgICBub3JtYWxzLnB1c2goW2RpcjIueCwgZGlyMi55LCBkaXIyLnpdKTtcbiAgICB9KTtcblxuICAgIHRoaXMubm9ybWFscyA9IG5vcm1hbHM7XG4gIH1cbn1cbiJdfQ==