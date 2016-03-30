'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PlaneGeometry = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _geometry = require('../geometry');

var _geometry2 = _interopRequireDefault(_geometry);

var _scenegraph = require('../scenegraph');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var PlaneGeometry = exports.PlaneGeometry = function (_Geometry) {
  _inherits(PlaneGeometry, _Geometry);

  // Primitives inspired by TDL http://code.google.com/p/webglsamples/,
  // copyright 2011 Google Inc. new BSD License
  // (http://www.opensource.org/licenses/bsd-license.php).
  /* eslint-disable max-statements, complexity */
  /* eslint-disable complexity, max-statements */

  function PlaneGeometry() {
    var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var _ref$type = _ref.type;
    var type = _ref$type === undefined ? 'x,y' : _ref$type;
    var _ref$offset = _ref.offset;
    var offset = _ref$offset === undefined ? 0 : _ref$offset;
    var _ref$flipCull = _ref.flipCull;
    var flipCull = _ref$flipCull === undefined ? false : _ref$flipCull;
    var _ref$unpack = _ref.unpack;
    var unpack = _ref$unpack === undefined ? false : _ref$unpack;

    var opts = _objectWithoutProperties(_ref, ['type', 'offset', 'flipCull', 'unpack']);

    _classCallCheck(this, PlaneGeometry);

    var coords = type.split(',');
    // width, height
    var c1len = opts[coords[0] + 'len'];
    var c2len = opts[coords[1] + 'len'];
    // subdivisionsWidth, subdivisionsDepth
    var subdivisions1 = opts['n' + coords[0]] || 1;
    var subdivisions2 = opts['n' + coords[1]] || 1;
    var numVertices = (subdivisions1 + 1) * (subdivisions2 + 1);

    var vertices = new Float32Array(numVertices * 3);
    var normals = new Float32Array(numVertices * 3);
    var texCoords = new Float32Array(numVertices * 2);

    if (flipCull) {
      c1len = -c1len;
    }

    var i2 = 0;
    var i3 = 0;
    for (var z = 0; z <= subdivisions2; z++) {
      for (var x = 0; x <= subdivisions1; x++) {
        var u = x / subdivisions1;
        var v = z / subdivisions2;
        texCoords[i2 + 0] = flipCull ? 1 - u : u;
        texCoords[i2 + 1] = v;

        switch (type) {
          case 'x,y':
            vertices[i3 + 0] = c1len * u - c1len * 0.5;
            vertices[i3 + 1] = c2len * v - c2len * 0.5;
            vertices[i3 + 2] = offset;

            normals[i3 + 0] = 0;
            normals[i3 + 1] = 0;
            normals[i3 + 2] = flipCull ? 1 : -1;
            break;

          case 'x,z':
            vertices[i3 + 0] = c1len * u - c1len * 0.5;
            vertices[i3 + 1] = offset;
            vertices[i3 + 2] = c2len * v - c2len * 0.5;

            normals[i3 + 0] = 0;
            normals[i3 + 1] = flipCull ? 1 : -1;
            normals[i3 + 2] = 0;
            break;

          case 'y,z':
            vertices[i3 + 0] = offset;
            vertices[i3 + 1] = c1len * u - c1len * 0.5;
            vertices[i3 + 2] = c2len * v - c2len * 0.5;

            normals[i3 + 0] = flipCull ? 1 : -1;
            normals[i3 + 1] = 0;
            normals[i3 + 2] = 0;
            break;

          default:
            break;
        }

        i2 += 2;
        i3 += 3;
      }
    }

    var numVertsAcross = subdivisions1 + 1;
    var indices = new Uint16Array(subdivisions1 * subdivisions2 * 6);

    for (var z = 0; z < subdivisions2; z++) {
      for (var x = 0; x < subdivisions1; x++) {
        var index = (z * subdivisions1 + x) * 6;
        // Make triangle 1 of quad.
        indices[index + 0] = (z + 0) * numVertsAcross + x;
        indices[index + 1] = (z + 1) * numVertsAcross + x;
        indices[index + 2] = (z + 0) * numVertsAcross + x + 1;

        // Make triangle 2 of quad.
        indices[index + 3] = (z + 1) * numVertsAcross + x;
        indices[index + 4] = (z + 1) * numVertsAcross + x + 1;
        indices[index + 5] = (z + 0) * numVertsAcross + x + 1;
      }
    }

    // Optionally, unpack indexed geometry
    if (unpack) {
      var vertices2 = new Float32Array(indices.length * 3);
      var normals2 = new Float32Array(indices.length * 3);
      var texCoords2 = new Float32Array(indices.length * 2);

      for (var x = 0; x < indices.length; ++x) {
        var index = indices[x];
        vertices2[x * 3 + 0] = vertices[index * 3 + 0];
        vertices2[x * 3 + 1] = vertices[index * 3 + 1];
        vertices2[x * 3 + 2] = vertices[index * 3 + 2];
        normals2[x * 3 + 0] = normals[index * 3 + 0];
        normals2[x * 3 + 1] = normals[index * 3 + 1];
        normals2[x * 3 + 2] = normals[index * 3 + 2];
        texCoords2[x * 2 + 0] = texCoords[index * 2 + 0];
        texCoords2[x * 2 + 1] = texCoords[index * 2 + 1];
      }

      vertices = vertices2;
      normals = normals2;
      texCoords = texCoords2;
      indices = undefined;
    }

    return _possibleConstructorReturn(this, Object.getPrototypeOf(PlaneGeometry).call(this, _extends({}, opts, {
      attributes: _extends({
        vertices: vertices,
        normals: normals,
        texCoords: texCoords
      }, indices ? { indices: indices } : {})
    })));
  }

  return PlaneGeometry;
}(_geometry2.default);

var Plane = function (_Model) {
  _inherits(Plane, _Model);

  function Plane(opts) {
    _classCallCheck(this, Plane);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Plane).call(this, _extends({ geometry: new PlaneGeometry(opts) }, opts)));
  }

  return Plane;
}(_scenegraph.Model);

exports.default = Plane;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9vYmplY3RzL3BsYW5lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFHYTs7Ozs7Ozs7O0FBT1gsV0FQVyxhQU9YLEdBRVE7cUVBQUosa0JBQUk7O3lCQUROLEtBQ007UUFETixpQ0FBTyxrQkFDRDsyQkFEUSxPQUNSO1FBRFEscUNBQVMsZ0JBQ2pCOzZCQURvQixTQUNwQjtRQURvQix5Q0FBVyxzQkFDL0I7MkJBRHNDLE9BQ3RDO1FBRHNDLHFDQUFTLG9CQUMvQzs7UUFEeUQsZ0ZBQ3pEOzswQkFURyxlQVNIOztBQUNOLFFBQU0sU0FBUyxLQUFLLEtBQUwsQ0FBVyxHQUFYLENBQVQ7O0FBREEsUUFHRixRQUFRLEtBQUssT0FBTyxDQUFQLElBQVksS0FBWixDQUFiLENBSEU7QUFJTixRQUFNLFFBQVEsS0FBSyxPQUFPLENBQVAsSUFBWSxLQUFaLENBQWI7O0FBSkEsUUFNQSxnQkFBZ0IsS0FBSyxNQUFNLE9BQU8sQ0FBUCxDQUFOLENBQUwsSUFBeUIsQ0FBekIsQ0FOaEI7QUFPTixRQUFNLGdCQUFnQixLQUFLLE1BQU0sT0FBTyxDQUFQLENBQU4sQ0FBTCxJQUF5QixDQUF6QixDQVBoQjtBQVFOLFFBQU0sY0FBYyxDQUFDLGdCQUFnQixDQUFoQixDQUFELElBQXVCLGdCQUFnQixDQUFoQixDQUF2QixDQVJkOztBQVVOLFFBQUksV0FBVyxJQUFJLFlBQUosQ0FBaUIsY0FBYyxDQUFkLENBQTVCLENBVkU7QUFXTixRQUFJLFVBQVUsSUFBSSxZQUFKLENBQWlCLGNBQWMsQ0FBZCxDQUEzQixDQVhFO0FBWU4sUUFBSSxZQUFZLElBQUksWUFBSixDQUFpQixjQUFjLENBQWQsQ0FBN0IsQ0FaRTs7QUFjTixRQUFJLFFBQUosRUFBYztBQUNaLGNBQVEsQ0FBQyxLQUFELENBREk7S0FBZDs7QUFJQSxRQUFJLEtBQUssQ0FBTCxDQWxCRTtBQW1CTixRQUFJLEtBQUssQ0FBTCxDQW5CRTtBQW9CTixTQUFLLElBQUksSUFBSSxDQUFKLEVBQU8sS0FBSyxhQUFMLEVBQW9CLEdBQXBDLEVBQXlDO0FBQ3ZDLFdBQUssSUFBSSxJQUFJLENBQUosRUFBTyxLQUFLLGFBQUwsRUFBb0IsR0FBcEMsRUFBeUM7QUFDdkMsWUFBTSxJQUFJLElBQUksYUFBSixDQUQ2QjtBQUV2QyxZQUFNLElBQUksSUFBSSxhQUFKLENBRjZCO0FBR3ZDLGtCQUFVLEtBQUssQ0FBTCxDQUFWLEdBQW9CLFdBQVcsSUFBSSxDQUFKLEdBQVEsQ0FBbkIsQ0FIbUI7QUFJdkMsa0JBQVUsS0FBSyxDQUFMLENBQVYsR0FBb0IsQ0FBcEIsQ0FKdUM7O0FBTXZDLGdCQUFRLElBQVI7QUFDQSxlQUFLLEtBQUw7QUFDRSxxQkFBUyxLQUFLLENBQUwsQ0FBVCxHQUFtQixRQUFRLENBQVIsR0FBWSxRQUFRLEdBQVIsQ0FEakM7QUFFRSxxQkFBUyxLQUFLLENBQUwsQ0FBVCxHQUFtQixRQUFRLENBQVIsR0FBWSxRQUFRLEdBQVIsQ0FGakM7QUFHRSxxQkFBUyxLQUFLLENBQUwsQ0FBVCxHQUFtQixNQUFuQixDQUhGOztBQUtFLG9CQUFRLEtBQUssQ0FBTCxDQUFSLEdBQWtCLENBQWxCLENBTEY7QUFNRSxvQkFBUSxLQUFLLENBQUwsQ0FBUixHQUFrQixDQUFsQixDQU5GO0FBT0Usb0JBQVEsS0FBSyxDQUFMLENBQVIsR0FBa0IsV0FBVyxDQUFYLEdBQWUsQ0FBQyxDQUFELENBUG5DO0FBUUUsa0JBUkY7O0FBREEsZUFXSyxLQUFMO0FBQ0UscUJBQVMsS0FBSyxDQUFMLENBQVQsR0FBbUIsUUFBUSxDQUFSLEdBQVksUUFBUSxHQUFSLENBRGpDO0FBRUUscUJBQVMsS0FBSyxDQUFMLENBQVQsR0FBbUIsTUFBbkIsQ0FGRjtBQUdFLHFCQUFTLEtBQUssQ0FBTCxDQUFULEdBQW1CLFFBQVEsQ0FBUixHQUFZLFFBQVEsR0FBUixDQUhqQzs7QUFLRSxvQkFBUSxLQUFLLENBQUwsQ0FBUixHQUFrQixDQUFsQixDQUxGO0FBTUUsb0JBQVEsS0FBSyxDQUFMLENBQVIsR0FBa0IsV0FBVyxDQUFYLEdBQWUsQ0FBQyxDQUFELENBTm5DO0FBT0Usb0JBQVEsS0FBSyxDQUFMLENBQVIsR0FBa0IsQ0FBbEIsQ0FQRjtBQVFFLGtCQVJGOztBQVhBLGVBcUJLLEtBQUw7QUFDRSxxQkFBUyxLQUFLLENBQUwsQ0FBVCxHQUFtQixNQUFuQixDQURGO0FBRUUscUJBQVMsS0FBSyxDQUFMLENBQVQsR0FBbUIsUUFBUSxDQUFSLEdBQVksUUFBUSxHQUFSLENBRmpDO0FBR0UscUJBQVMsS0FBSyxDQUFMLENBQVQsR0FBbUIsUUFBUSxDQUFSLEdBQVksUUFBUSxHQUFSLENBSGpDOztBQUtFLG9CQUFRLEtBQUssQ0FBTCxDQUFSLEdBQWtCLFdBQVcsQ0FBWCxHQUFlLENBQUMsQ0FBRCxDQUxuQztBQU1FLG9CQUFRLEtBQUssQ0FBTCxDQUFSLEdBQWtCLENBQWxCLENBTkY7QUFPRSxvQkFBUSxLQUFLLENBQUwsQ0FBUixHQUFrQixDQUFsQixDQVBGO0FBUUUsa0JBUkY7O0FBckJBO0FBZ0NFLGtCQURGO0FBL0JBLFNBTnVDOztBQXlDdkMsY0FBTSxDQUFOLENBekN1QztBQTBDdkMsY0FBTSxDQUFOLENBMUN1QztPQUF6QztLQURGOztBQStDQSxRQUFNLGlCQUFpQixnQkFBZ0IsQ0FBaEIsQ0FuRWpCO0FBb0VOLFFBQUksVUFBVSxJQUFJLFdBQUosQ0FBZ0IsZ0JBQWdCLGFBQWhCLEdBQWdDLENBQWhDLENBQTFCLENBcEVFOztBQXNFTixTQUFLLElBQUksSUFBSSxDQUFKLEVBQU8sSUFBSSxhQUFKLEVBQW1CLEdBQW5DLEVBQXdDO0FBQ3RDLFdBQUssSUFBSSxJQUFJLENBQUosRUFBTyxJQUFJLGFBQUosRUFBbUIsR0FBbkMsRUFBd0M7QUFDdEMsWUFBTSxRQUFRLENBQUMsSUFBSSxhQUFKLEdBQW9CLENBQXBCLENBQUQsR0FBMEIsQ0FBMUI7O0FBRHdCLGVBR3RDLENBQVEsUUFBUSxDQUFSLENBQVIsR0FBcUIsQ0FBQyxJQUFJLENBQUosQ0FBRCxHQUFVLGNBQVYsR0FBMkIsQ0FBM0IsQ0FIaUI7QUFJdEMsZ0JBQVEsUUFBUSxDQUFSLENBQVIsR0FBcUIsQ0FBQyxJQUFJLENBQUosQ0FBRCxHQUFVLGNBQVYsR0FBMkIsQ0FBM0IsQ0FKaUI7QUFLdEMsZ0JBQVEsUUFBUSxDQUFSLENBQVIsR0FBcUIsQ0FBQyxJQUFJLENBQUosQ0FBRCxHQUFVLGNBQVYsR0FBMkIsQ0FBM0IsR0FBK0IsQ0FBL0I7OztBQUxpQixlQVF0QyxDQUFRLFFBQVEsQ0FBUixDQUFSLEdBQXFCLENBQUMsSUFBSSxDQUFKLENBQUQsR0FBVSxjQUFWLEdBQTJCLENBQTNCLENBUmlCO0FBU3RDLGdCQUFRLFFBQVEsQ0FBUixDQUFSLEdBQXFCLENBQUMsSUFBSSxDQUFKLENBQUQsR0FBVSxjQUFWLEdBQTJCLENBQTNCLEdBQStCLENBQS9CLENBVGlCO0FBVXRDLGdCQUFRLFFBQVEsQ0FBUixDQUFSLEdBQXFCLENBQUMsSUFBSSxDQUFKLENBQUQsR0FBVSxjQUFWLEdBQTJCLENBQTNCLEdBQStCLENBQS9CLENBVmlCO09BQXhDO0tBREY7OztBQXRFTSxRQXNGRixNQUFKLEVBQVk7QUFDVixVQUFNLFlBQVksSUFBSSxZQUFKLENBQWlCLFFBQVEsTUFBUixHQUFpQixDQUFqQixDQUE3QixDQURJO0FBRVYsVUFBTSxXQUFXLElBQUksWUFBSixDQUFpQixRQUFRLE1BQVIsR0FBaUIsQ0FBakIsQ0FBNUIsQ0FGSTtBQUdWLFVBQU0sYUFBYSxJQUFJLFlBQUosQ0FBaUIsUUFBUSxNQUFSLEdBQWlCLENBQWpCLENBQTlCLENBSEk7O0FBS1YsV0FBSyxJQUFJLElBQUksQ0FBSixFQUFPLElBQUksUUFBUSxNQUFSLEVBQWdCLEVBQUUsQ0FBRixFQUFLO0FBQ3ZDLFlBQU0sUUFBUSxRQUFRLENBQVIsQ0FBUixDQURpQztBQUV2QyxrQkFBVSxJQUFJLENBQUosR0FBUSxDQUFSLENBQVYsR0FBdUIsU0FBUyxRQUFRLENBQVIsR0FBWSxDQUFaLENBQWhDLENBRnVDO0FBR3ZDLGtCQUFVLElBQUksQ0FBSixHQUFRLENBQVIsQ0FBVixHQUF1QixTQUFTLFFBQVEsQ0FBUixHQUFZLENBQVosQ0FBaEMsQ0FIdUM7QUFJdkMsa0JBQVUsSUFBSSxDQUFKLEdBQVEsQ0FBUixDQUFWLEdBQXVCLFNBQVMsUUFBUSxDQUFSLEdBQVksQ0FBWixDQUFoQyxDQUp1QztBQUt2QyxpQkFBUyxJQUFJLENBQUosR0FBUSxDQUFSLENBQVQsR0FBc0IsUUFBUSxRQUFRLENBQVIsR0FBWSxDQUFaLENBQTlCLENBTHVDO0FBTXZDLGlCQUFTLElBQUksQ0FBSixHQUFRLENBQVIsQ0FBVCxHQUFzQixRQUFRLFFBQVEsQ0FBUixHQUFZLENBQVosQ0FBOUIsQ0FOdUM7QUFPdkMsaUJBQVMsSUFBSSxDQUFKLEdBQVEsQ0FBUixDQUFULEdBQXNCLFFBQVEsUUFBUSxDQUFSLEdBQVksQ0FBWixDQUE5QixDQVB1QztBQVF2QyxtQkFBVyxJQUFJLENBQUosR0FBUSxDQUFSLENBQVgsR0FBd0IsVUFBVSxRQUFRLENBQVIsR0FBWSxDQUFaLENBQWxDLENBUnVDO0FBU3ZDLG1CQUFXLElBQUksQ0FBSixHQUFRLENBQVIsQ0FBWCxHQUF3QixVQUFVLFFBQVEsQ0FBUixHQUFZLENBQVosQ0FBbEMsQ0FUdUM7T0FBekM7O0FBWUEsaUJBQVcsU0FBWCxDQWpCVTtBQWtCVixnQkFBVSxRQUFWLENBbEJVO0FBbUJWLGtCQUFZLFVBQVosQ0FuQlU7QUFvQlYsZ0JBQVUsU0FBVixDQXBCVTtLQUFaOztrRUEvRlMsdUNBdUhKO0FBQ0g7QUFDRTtBQUNBO0FBQ0E7U0FDSSxVQUFVLEVBQUMsZ0JBQUQsRUFBVixHQUFzQixFQUF0QixDQUpOO1NBL0dJO0dBRlI7O1NBUFc7OztJQWtJUTs7O0FBQ25CLFdBRG1CLEtBQ25CLENBQVksSUFBWixFQUFrQjswQkFEQyxPQUNEOztrRUFEQyw2QkFFVixVQUFVLElBQUksYUFBSixDQUFrQixJQUFsQixDQUFWLElBQXNDLFFBRDdCO0dBQWxCOztTQURtQiIsImZpbGUiOiJwbGFuZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBHZW9tZXRyeSBmcm9tICcuLi9nZW9tZXRyeSc7XG5pbXBvcnQge01vZGVsfSBmcm9tICcuLi9zY2VuZWdyYXBoJztcblxuZXhwb3J0IGNsYXNzIFBsYW5lR2VvbWV0cnkgZXh0ZW5kcyBHZW9tZXRyeSB7XG5cbiAgLy8gUHJpbWl0aXZlcyBpbnNwaXJlZCBieSBUREwgaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL3dlYmdsc2FtcGxlcy8sXG4gIC8vIGNvcHlyaWdodCAyMDExIEdvb2dsZSBJbmMuIG5ldyBCU0QgTGljZW5zZVxuICAvLyAoaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9ic2QtbGljZW5zZS5waHApLlxuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cywgY29tcGxleGl0eSAqL1xuICAvKiBlc2xpbnQtZGlzYWJsZSBjb21wbGV4aXR5LCBtYXgtc3RhdGVtZW50cyAqL1xuICBjb25zdHJ1Y3Rvcih7XG4gICAgdHlwZSA9ICd4LHknLCBvZmZzZXQgPSAwLCBmbGlwQ3VsbCA9IGZhbHNlLCB1bnBhY2sgPSBmYWxzZSwgLi4ub3B0c1xuICB9ID0ge30pIHtcbiAgICBjb25zdCBjb29yZHMgPSB0eXBlLnNwbGl0KCcsJyk7XG4gICAgLy8gd2lkdGgsIGhlaWdodFxuICAgIGxldCBjMWxlbiA9IG9wdHNbY29vcmRzWzBdICsgJ2xlbiddO1xuICAgIGNvbnN0IGMybGVuID0gb3B0c1tjb29yZHNbMV0gKyAnbGVuJ107XG4gICAgLy8gc3ViZGl2aXNpb25zV2lkdGgsIHN1YmRpdmlzaW9uc0RlcHRoXG4gICAgY29uc3Qgc3ViZGl2aXNpb25zMSA9IG9wdHNbJ24nICsgY29vcmRzWzBdXSB8fCAxO1xuICAgIGNvbnN0IHN1YmRpdmlzaW9uczIgPSBvcHRzWyduJyArIGNvb3Jkc1sxXV0gfHwgMTtcbiAgICBjb25zdCBudW1WZXJ0aWNlcyA9IChzdWJkaXZpc2lvbnMxICsgMSkgKiAoc3ViZGl2aXNpb25zMiArIDEpO1xuXG4gICAgbGV0IHZlcnRpY2VzID0gbmV3IEZsb2F0MzJBcnJheShudW1WZXJ0aWNlcyAqIDMpO1xuICAgIGxldCBub3JtYWxzID0gbmV3IEZsb2F0MzJBcnJheShudW1WZXJ0aWNlcyAqIDMpO1xuICAgIGxldCB0ZXhDb29yZHMgPSBuZXcgRmxvYXQzMkFycmF5KG51bVZlcnRpY2VzICogMik7XG5cbiAgICBpZiAoZmxpcEN1bGwpIHtcbiAgICAgIGMxbGVuID0gLWMxbGVuO1xuICAgIH1cblxuICAgIGxldCBpMiA9IDA7XG4gICAgbGV0IGkzID0gMDtcbiAgICBmb3IgKGxldCB6ID0gMDsgeiA8PSBzdWJkaXZpc2lvbnMyOyB6KyspIHtcbiAgICAgIGZvciAobGV0IHggPSAwOyB4IDw9IHN1YmRpdmlzaW9uczE7IHgrKykge1xuICAgICAgICBjb25zdCB1ID0geCAvIHN1YmRpdmlzaW9uczE7XG4gICAgICAgIGNvbnN0IHYgPSB6IC8gc3ViZGl2aXNpb25zMjtcbiAgICAgICAgdGV4Q29vcmRzW2kyICsgMF0gPSBmbGlwQ3VsbCA/IDEgLSB1IDogdTtcbiAgICAgICAgdGV4Q29vcmRzW2kyICsgMV0gPSB2O1xuXG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICBjYXNlICd4LHknOlxuICAgICAgICAgIHZlcnRpY2VzW2kzICsgMF0gPSBjMWxlbiAqIHUgLSBjMWxlbiAqIDAuNTtcbiAgICAgICAgICB2ZXJ0aWNlc1tpMyArIDFdID0gYzJsZW4gKiB2IC0gYzJsZW4gKiAwLjU7XG4gICAgICAgICAgdmVydGljZXNbaTMgKyAyXSA9IG9mZnNldDtcblxuICAgICAgICAgIG5vcm1hbHNbaTMgKyAwXSA9IDA7XG4gICAgICAgICAgbm9ybWFsc1tpMyArIDFdID0gMDtcbiAgICAgICAgICBub3JtYWxzW2kzICsgMl0gPSBmbGlwQ3VsbCA/IDEgOiAtMTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICd4LHonOlxuICAgICAgICAgIHZlcnRpY2VzW2kzICsgMF0gPSBjMWxlbiAqIHUgLSBjMWxlbiAqIDAuNTtcbiAgICAgICAgICB2ZXJ0aWNlc1tpMyArIDFdID0gb2Zmc2V0O1xuICAgICAgICAgIHZlcnRpY2VzW2kzICsgMl0gPSBjMmxlbiAqIHYgLSBjMmxlbiAqIDAuNTtcblxuICAgICAgICAgIG5vcm1hbHNbaTMgKyAwXSA9IDA7XG4gICAgICAgICAgbm9ybWFsc1tpMyArIDFdID0gZmxpcEN1bGwgPyAxIDogLTE7XG4gICAgICAgICAgbm9ybWFsc1tpMyArIDJdID0gMDtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICd5LHonOlxuICAgICAgICAgIHZlcnRpY2VzW2kzICsgMF0gPSBvZmZzZXQ7XG4gICAgICAgICAgdmVydGljZXNbaTMgKyAxXSA9IGMxbGVuICogdSAtIGMxbGVuICogMC41O1xuICAgICAgICAgIHZlcnRpY2VzW2kzICsgMl0gPSBjMmxlbiAqIHYgLSBjMmxlbiAqIDAuNTtcblxuICAgICAgICAgIG5vcm1hbHNbaTMgKyAwXSA9IGZsaXBDdWxsID8gMSA6IC0xO1xuICAgICAgICAgIG5vcm1hbHNbaTMgKyAxXSA9IDA7XG4gICAgICAgICAgbm9ybWFsc1tpMyArIDJdID0gMDtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgaTIgKz0gMjtcbiAgICAgICAgaTMgKz0gMztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBudW1WZXJ0c0Fjcm9zcyA9IHN1YmRpdmlzaW9uczEgKyAxO1xuICAgIGxldCBpbmRpY2VzID0gbmV3IFVpbnQxNkFycmF5KHN1YmRpdmlzaW9uczEgKiBzdWJkaXZpc2lvbnMyICogNik7XG5cbiAgICBmb3IgKGxldCB6ID0gMDsgeiA8IHN1YmRpdmlzaW9uczI7IHorKykge1xuICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBzdWJkaXZpc2lvbnMxOyB4KyspIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSAoeiAqIHN1YmRpdmlzaW9uczEgKyB4KSAqIDY7XG4gICAgICAgIC8vIE1ha2UgdHJpYW5nbGUgMSBvZiBxdWFkLlxuICAgICAgICBpbmRpY2VzW2luZGV4ICsgMF0gPSAoeiArIDApICogbnVtVmVydHNBY3Jvc3MgKyB4O1xuICAgICAgICBpbmRpY2VzW2luZGV4ICsgMV0gPSAoeiArIDEpICogbnVtVmVydHNBY3Jvc3MgKyB4O1xuICAgICAgICBpbmRpY2VzW2luZGV4ICsgMl0gPSAoeiArIDApICogbnVtVmVydHNBY3Jvc3MgKyB4ICsgMTtcblxuICAgICAgICAvLyBNYWtlIHRyaWFuZ2xlIDIgb2YgcXVhZC5cbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDNdID0gKHogKyAxKSAqIG51bVZlcnRzQWNyb3NzICsgeDtcbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDRdID0gKHogKyAxKSAqIG51bVZlcnRzQWNyb3NzICsgeCArIDE7XG4gICAgICAgIGluZGljZXNbaW5kZXggKyA1XSA9ICh6ICsgMCkgKiBudW1WZXJ0c0Fjcm9zcyArIHggKyAxO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIE9wdGlvbmFsbHksIHVucGFjayBpbmRleGVkIGdlb21ldHJ5XG4gICAgaWYgKHVucGFjaykge1xuICAgICAgY29uc3QgdmVydGljZXMyID0gbmV3IEZsb2F0MzJBcnJheShpbmRpY2VzLmxlbmd0aCAqIDMpO1xuICAgICAgY29uc3Qgbm9ybWFsczIgPSBuZXcgRmxvYXQzMkFycmF5KGluZGljZXMubGVuZ3RoICogMyk7XG4gICAgICBjb25zdCB0ZXhDb29yZHMyID0gbmV3IEZsb2F0MzJBcnJheShpbmRpY2VzLmxlbmd0aCAqIDIpO1xuXG4gICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGluZGljZXMubGVuZ3RoOyArK3gpIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSBpbmRpY2VzW3hdO1xuICAgICAgICB2ZXJ0aWNlczJbeCAqIDMgKyAwXSA9IHZlcnRpY2VzW2luZGV4ICogMyArIDBdO1xuICAgICAgICB2ZXJ0aWNlczJbeCAqIDMgKyAxXSA9IHZlcnRpY2VzW2luZGV4ICogMyArIDFdO1xuICAgICAgICB2ZXJ0aWNlczJbeCAqIDMgKyAyXSA9IHZlcnRpY2VzW2luZGV4ICogMyArIDJdO1xuICAgICAgICBub3JtYWxzMlt4ICogMyArIDBdID0gbm9ybWFsc1tpbmRleCAqIDMgKyAwXTtcbiAgICAgICAgbm9ybWFsczJbeCAqIDMgKyAxXSA9IG5vcm1hbHNbaW5kZXggKiAzICsgMV07XG4gICAgICAgIG5vcm1hbHMyW3ggKiAzICsgMl0gPSBub3JtYWxzW2luZGV4ICogMyArIDJdO1xuICAgICAgICB0ZXhDb29yZHMyW3ggKiAyICsgMF0gPSB0ZXhDb29yZHNbaW5kZXggKiAyICsgMF07XG4gICAgICAgIHRleENvb3JkczJbeCAqIDIgKyAxXSA9IHRleENvb3Jkc1tpbmRleCAqIDIgKyAxXTtcbiAgICAgIH1cblxuICAgICAgdmVydGljZXMgPSB2ZXJ0aWNlczI7XG4gICAgICBub3JtYWxzID0gbm9ybWFsczI7XG4gICAgICB0ZXhDb29yZHMgPSB0ZXhDb29yZHMyO1xuICAgICAgaW5kaWNlcyA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBzdXBlcih7XG4gICAgICAuLi5vcHRzLFxuICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICB2ZXJ0aWNlcyxcbiAgICAgICAgbm9ybWFscyxcbiAgICAgICAgdGV4Q29vcmRzLFxuICAgICAgICAuLi4oaW5kaWNlcyA/IHtpbmRpY2VzfSA6IHt9KVxuICAgICAgfVxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFBsYW5lIGV4dGVuZHMgTW9kZWwge1xuICBjb25zdHJ1Y3RvcihvcHRzKSB7XG4gICAgc3VwZXIoe2dlb21ldHJ5OiBuZXcgUGxhbmVHZW9tZXRyeShvcHRzKSwgLi4ub3B0c30pO1xuICB9XG59XG4iXX0=