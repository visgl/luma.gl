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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy93aXAvZmFjZS1nZW9tZXRyeS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUdhOzs7Ozs7Ozs7Ozt1Q0FFUTtBQUNqQixVQUFNLFFBQVEsS0FBSyxLQUFMLENBREc7QUFFakIsVUFBTSxXQUFXLEtBQUssUUFBTCxDQUZBO0FBR2pCLFVBQU0sWUFBWSxFQUFaLENBSFc7O0FBS2pCLFlBQU0sT0FBTixDQUFjLGdCQUFRO0FBQ3BCLFlBQU0sV0FBVyxDQUFDLENBQUQsRUFBSSxDQUFKLEVBQU8sQ0FBUCxDQUFYLENBRGM7QUFFcEIsWUFBSSxPQUFPLENBQVAsQ0FGZ0I7O0FBSXBCLGFBQUssT0FBTCxDQUFhLGVBQU87QUFDbEIsY0FBTSxTQUFTLFNBQVMsR0FBVCxDQUFULENBRFk7QUFFbEIsbUJBQVMsQ0FBVCxLQUFlLE9BQU8sQ0FBUCxDQUFmLENBRmtCO0FBR2xCLG1CQUFTLENBQVQsS0FBZSxPQUFPLENBQVAsQ0FBZixDQUhrQjtBQUlsQixtQkFBUyxDQUFULEtBQWUsT0FBTyxDQUFQLENBQWYsQ0FKa0I7QUFLbEIsaUJBTGtCO1NBQVAsQ0FBYixDQUpvQjs7QUFZcEIsaUJBQVMsQ0FBVCxLQUFlLElBQWYsQ0Fab0I7QUFhcEIsaUJBQVMsQ0FBVCxLQUFlLElBQWYsQ0Fib0I7QUFjcEIsaUJBQVMsQ0FBVCxLQUFlLElBQWYsQ0Fkb0I7O0FBZ0JwQixrQkFBVSxJQUFWLENBQWUsUUFBZixFQWhCb0I7T0FBUixDQUFkLENBTGlCOztBQXdCakIsV0FBSyxTQUFMLEdBQWlCLFNBQWpCLENBeEJpQjs7OztxQ0EyQkY7QUFDZixVQUFNLFFBQVEsS0FBSyxLQUFMLENBREM7QUFFZixVQUFNLFdBQVcsS0FBSyxRQUFMLENBRkY7QUFHZixVQUFNLFVBQVUsRUFBVixDQUhTOztBQUtmLFlBQU0sT0FBTixDQUFjLGdCQUFRO0FBQ3BCLFlBQU0sS0FBSyxTQUFTLEtBQUssQ0FBTCxDQUFULENBQUwsQ0FEYztBQUVwQixZQUFNLEtBQUssU0FBUyxLQUFLLENBQUwsQ0FBVCxDQUFMLENBRmM7QUFHcEIsWUFBTSxLQUFLLFNBQVMsS0FBSyxDQUFMLENBQVQsQ0FBTCxDQUhjO0FBSXBCLFlBQU0sT0FBTztBQUNYLGFBQUcsR0FBRyxDQUFILElBQVEsR0FBRyxDQUFILENBQVI7QUFDSCxhQUFHLEdBQUcsQ0FBSCxJQUFRLEdBQUcsQ0FBSCxDQUFSO0FBQ0gsYUFBRyxHQUFHLENBQUgsSUFBUSxHQUFHLENBQUgsQ0FBUjtTQUhDLENBSmM7QUFTcEIsWUFBTSxPQUFPO0FBQ1gsYUFBRyxHQUFHLENBQUgsSUFBUSxHQUFHLENBQUgsQ0FBUjtBQUNILGFBQUcsR0FBRyxDQUFILElBQVEsR0FBRyxDQUFILENBQVI7QUFDSCxhQUFHLEdBQUcsQ0FBSCxJQUFRLEdBQUcsQ0FBSCxDQUFSO1NBSEMsQ0FUYzs7QUFlcEIsbUJBQUssTUFBTCxDQUFZLElBQVosRUFBa0IsSUFBbEIsRUFmb0I7O0FBaUJwQixZQUFJLFdBQUssSUFBTCxDQUFVLElBQVYsSUFBa0IsSUFBbEIsRUFBd0I7QUFDMUIscUJBQUssSUFBTCxDQUFVLElBQVYsRUFEMEI7U0FBNUI7O0FBSUEsZ0JBQVEsSUFBUixDQUFhLENBQUMsS0FBSyxDQUFMLEVBQVEsS0FBSyxDQUFMLEVBQVEsS0FBSyxDQUFMLENBQTlCLEVBckJvQjtPQUFSLENBQWQsQ0FMZTs7QUE2QmYsV0FBSyxPQUFMLEdBQWUsT0FBZixDQTdCZTs7OztTQTdCTiIsImZpbGUiOiJmYWNlLWdlb21ldHJ5LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEdlb21ldHJ5IGZyb20gJy4uL2dlb21ldHJ5JztcbmltcG9ydCB7VmVjM30gZnJvbSAnLi4vbWF0aCc7XG5cbmV4cG9ydCBjbGFzcyBGYWNlR2VvbWV0cnkgZXh0ZW5kcyBHZW9tZXRyeSB7XG5cbiAgY29tcHV0ZUNlbnRyb2lkcygpIHtcbiAgICBjb25zdCBmYWNlcyA9IHRoaXMuZmFjZXM7XG4gICAgY29uc3QgdmVydGljZXMgPSB0aGlzLnZlcnRpY2VzO1xuICAgIGNvbnN0IGNlbnRyb2lkcyA9IFtdO1xuXG4gICAgZmFjZXMuZm9yRWFjaChmYWNlID0+IHtcbiAgICAgIGNvbnN0IGNlbnRyb2lkID0gWzAsIDAsIDBdO1xuICAgICAgbGV0IGFjdW0gPSAwO1xuXG4gICAgICBmYWNlLmZvckVhY2goaWR4ID0+IHtcbiAgICAgICAgY29uc3QgdmVydGV4ID0gdmVydGljZXNbaWR4XTtcbiAgICAgICAgY2VudHJvaWRbMF0gKz0gdmVydGV4WzBdO1xuICAgICAgICBjZW50cm9pZFsxXSArPSB2ZXJ0ZXhbMV07XG4gICAgICAgIGNlbnRyb2lkWzJdICs9IHZlcnRleFsyXTtcbiAgICAgICAgYWN1bSsrO1xuICAgICAgfSk7XG5cbiAgICAgIGNlbnRyb2lkWzBdIC89IGFjdW07XG4gICAgICBjZW50cm9pZFsxXSAvPSBhY3VtO1xuICAgICAgY2VudHJvaWRbMl0gLz0gYWN1bTtcblxuICAgICAgY2VudHJvaWRzLnB1c2goY2VudHJvaWQpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5jZW50cm9pZHMgPSBjZW50cm9pZHM7XG4gIH1cblxuICBjb21wdXRlTm9ybWFscygpIHtcbiAgICBjb25zdCBmYWNlcyA9IHRoaXMuZmFjZXM7XG4gICAgY29uc3QgdmVydGljZXMgPSB0aGlzLnZlcnRpY2VzO1xuICAgIGNvbnN0IG5vcm1hbHMgPSBbXTtcblxuICAgIGZhY2VzLmZvckVhY2goZmFjZSA9PiB7XG4gICAgICBjb25zdCB2MSA9IHZlcnRpY2VzW2ZhY2VbMF1dO1xuICAgICAgY29uc3QgdjIgPSB2ZXJ0aWNlc1tmYWNlWzFdXTtcbiAgICAgIGNvbnN0IHYzID0gdmVydGljZXNbZmFjZVsyXV07XG4gICAgICBjb25zdCBkaXIxID0ge1xuICAgICAgICB4OiB2M1swXSAtIHYyWzBdLFxuICAgICAgICB5OiB2M1sxXSAtIHYyWzFdLFxuICAgICAgICB6OiB2M1sxXSAtIHYyWzJdXG4gICAgICB9O1xuICAgICAgY29uc3QgZGlyMiA9IHtcbiAgICAgICAgeDogdjFbMF0gLSB2MlswXSxcbiAgICAgICAgeTogdjFbMV0gLSB2MlsxXSxcbiAgICAgICAgejogdjFbMl0gLSB2MlsyXVxuICAgICAgfTtcblxuICAgICAgVmVjMy4kY3Jvc3MoZGlyMiwgZGlyMSk7XG5cbiAgICAgIGlmIChWZWMzLm5vcm0oZGlyMikgPiAxZS02KSB7XG4gICAgICAgIFZlYzMudW5pdChkaXIyKTtcbiAgICAgIH1cblxuICAgICAgbm9ybWFscy5wdXNoKFtkaXIyLngsIGRpcjIueSwgZGlyMi56XSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLm5vcm1hbHMgPSBub3JtYWxzO1xuICB9XG59XG4iXX0=