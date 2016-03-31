'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SphereGeometry = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _geometry = require('../geometry');

var _geometry2 = _interopRequireDefault(_geometry);

var _model = require('../model');

var _model2 = _interopRequireDefault(_model);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var SphereGeometry = exports.SphereGeometry = function (_Geometry) {
  _inherits(SphereGeometry, _Geometry);

  // Primitives inspired by TDL http://code.google.com/p/webglsamples/,
  // copyright 2011 Google Inc. new BSD License
  // (http://www.opensource.org/licenses/bsd-license.php).
  /* eslint-disable max-statements, complexity */

  function SphereGeometry() {
    var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var _ref$nlat = _ref.nlat;
    var nlat = _ref$nlat === undefined ? 10 : _ref$nlat;
    var _ref$nlong = _ref.nlong;
    var nlong = _ref$nlong === undefined ? 10 : _ref$nlong;
    var _ref$radius = _ref.radius;
    var radius = _ref$radius === undefined ? 1 : _ref$radius;

    var opts = _objectWithoutProperties(_ref, ['nlat', 'nlong', 'radius']);

    _classCallCheck(this, SphereGeometry);

    var startLat = 0;
    var endLat = Math.PI;
    var latRange = endLat - startLat;
    var startLong = 0;
    var endLong = 2 * Math.PI;
    var longRange = endLong - startLong;
    var numVertices = (nlat + 1) * (nlong + 1);

    if (typeof radius === 'number') {
      var value = radius;
      radius = function radius(n1, n2, n3, u, v) {
        return value;
      };
    }

    var vertices = new Float32Array(numVertices * 3);
    var normals = new Float32Array(numVertices * 3);
    var texCoords = new Float32Array(numVertices * 2);
    var indices = new Uint16Array(nlat * nlong * 6);

    // Create vertices, normals and texCoords
    for (var y = 0; y <= nlat; y++) {
      for (var x = 0; x <= nlong; x++) {

        var index = x + y * (nlong + 1);
        var i2 = index * 2;
        var i3 = index * 3;

        var theta = longRange * u;
        var phi = latRange * v;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);
        var sinPhi = Math.sin(phi);
        var cosPhi = Math.cos(phi);
        var ux = cosTheta * sinPhi;
        var uy = cosPhi;
        var uz = sinTheta * sinPhi;

        var r = radius(ux, uy, uz, u, v);

        var u = x / nlong;
        var v = y / nlat;

        vertices[i3 + 0] = r * ux;
        vertices[i3 + 1] = r * uy;
        vertices[i3 + 2] = r * uz;

        normals[i3 + 0] = ux;
        normals[i3 + 1] = uy;
        normals[i3 + 2] = uz;

        texCoords[i2 + 0] = u;
        texCoords[i2 + 1] = v;
      }
    }

    // Create indices
    var numVertsAround = nlat + 1;
    for (var x = 0; x < nlat; x++) {
      for (var y = 0; y < nlong; y++) {
        var index = (x * nlong + y) * 6;

        indices[index + 0] = y * numVertsAround + x;
        indices[index + 1] = y * numVertsAround + x + 1;
        indices[index + 2] = (y + 1) * numVertsAround + x;

        indices[index + 3] = (y + 1) * numVertsAround + x;
        indices[index + 4] = y * numVertsAround + x + 1;
        indices[index + 5] = (y + 1) * numVertsAround + x + 1;
      }
    }

    return _possibleConstructorReturn(this, Object.getPrototypeOf(SphereGeometry).call(this, _extends({}, opts, {
      attributes: {
        vertices: vertices,
        indices: indices,
        normals: normals,
        texCoords: texCoords
      }
    })));
  }

  return SphereGeometry;
}(_geometry2.default);

var Sphere = function (_Model) {
  _inherits(Sphere, _Model);

  function Sphere(opts) {
    _classCallCheck(this, Sphere);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Sphere).call(this, _extends({ geometry: new SphereGeometry(opts) }, opts)));
  }

  return Sphere;
}(_model2.default);

exports.default = Sphere;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9vYmplY3RzL3NwaGVyZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFHYTs7Ozs7Ozs7QUFNWCxXQU5XLGNBTVgsR0FBK0Q7cUVBQUosa0JBQUk7O3lCQUFsRCxLQUFrRDtRQUFsRCxpQ0FBTyxlQUEyQzswQkFBdkMsTUFBdUM7UUFBdkMsbUNBQVEsZ0JBQStCOzJCQUEzQixPQUEyQjtRQUEzQixxQ0FBUyxnQkFBa0I7O1FBQVosbUVBQVk7OzBCQU5wRCxnQkFNb0Q7O0FBQzdELFFBQU0sV0FBVyxDQUFYLENBRHVEO0FBRTdELFFBQU0sU0FBUyxLQUFLLEVBQUwsQ0FGOEM7QUFHN0QsUUFBTSxXQUFXLFNBQVMsUUFBVCxDQUg0QztBQUk3RCxRQUFNLFlBQVksQ0FBWixDQUp1RDtBQUs3RCxRQUFNLFVBQVUsSUFBSSxLQUFLLEVBQUwsQ0FMeUM7QUFNN0QsUUFBTSxZQUFZLFVBQVUsU0FBVixDQU4yQztBQU83RCxRQUFNLGNBQWMsQ0FBQyxPQUFPLENBQVAsQ0FBRCxJQUFjLFFBQVEsQ0FBUixDQUFkLENBUHlDOztBQVM3RCxRQUFJLE9BQU8sTUFBUCxLQUFrQixRQUFsQixFQUE0QjtBQUM5QixVQUFJLFFBQVEsTUFBUixDQUQwQjtBQUU5QixlQUFTLGdCQUFTLEVBQVQsRUFBYSxFQUFiLEVBQWlCLEVBQWpCLEVBQXFCLENBQXJCLEVBQXdCLENBQXhCLEVBQTJCO0FBQ2xDLGVBQU8sS0FBUCxDQURrQztPQUEzQixDQUZxQjtLQUFoQzs7QUFPQSxRQUFNLFdBQVcsSUFBSSxZQUFKLENBQWlCLGNBQWMsQ0FBZCxDQUE1QixDQWhCdUQ7QUFpQjdELFFBQU0sVUFBVSxJQUFJLFlBQUosQ0FBaUIsY0FBYyxDQUFkLENBQTNCLENBakJ1RDtBQWtCN0QsUUFBTSxZQUFZLElBQUksWUFBSixDQUFpQixjQUFjLENBQWQsQ0FBN0IsQ0FsQnVEO0FBbUI3RCxRQUFNLFVBQVUsSUFBSSxXQUFKLENB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QVUsY0FBVixHQUEyQixDQUEzQixHQUErQixDQUEvQixDQVRTO09BQWhDO0tBREY7O2tFQWpFUyx3Q0FnRko7QUFDSCxrQkFBWTtBQUNWLGtCQUFVLFFBQVY7QUFDQSxpQkFBUyxPQUFUO0FBQ0EsaUJBQVMsT0FBVDtBQUNBLG1CQUFXLFNBQVg7T0FKRjtTQTNFMkQ7R0FBL0Q7O1NBTlc7OztJQTJGUTs7O0FBQ25CLFdBRG1CLE1BQ25CLENBQVksSUFBWixFQUFrQjswQkFEQyxRQUNEOztrRUFEQyw4QkFFVixVQUFVLElBQUksY0FBSixDQUFtQixJQUFuQixDQUFWLElBQXVDLFFBRDlCO0dBQWxCOztTQURtQiIsImZpbGUiOiJzcGhlcmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgR2VvbWV0cnkgZnJvbSAnLi4vZ2VvbWV0cnknO1xuaW1wb3J0IE1vZGVsIGZyb20gJy4uL21vZGVsJztcblxuZXhwb3J0IGNsYXNzIFNwaGVyZUdlb21ldHJ5IGV4dGVuZHMgR2VvbWV0cnkge1xuXG4gIC8vIFByaW1pdGl2ZXMgaW5zcGlyZWQgYnkgVERMIGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC93ZWJnbHNhbXBsZXMvLFxuICAvLyBjb3B5cmlnaHQgMjAxMSBHb29nbGUgSW5jLiBuZXcgQlNEIExpY2Vuc2VcbiAgLy8gKGh0dHA6Ly93d3cub3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvYnNkLWxpY2Vuc2UucGhwKS5cbiAgLyogZXNsaW50LWRpc2FibGUgbWF4LXN0YXRlbWVudHMsIGNvbXBsZXhpdHkgKi9cbiAgY29uc3RydWN0b3Ioe25sYXQgPSAxMCwgbmxvbmcgPSAxMCwgcmFkaXVzID0gMSwgLi4ub3B0c30gPSB7fSkge1xuICAgIGNvbnN0IHN0YXJ0TGF0ID0gMDtcbiAgICBjb25zdCBlbmRMYXQgPSBNYXRoLlBJO1xuICAgIGNvbnN0IGxhdFJhbmdlID0gZW5kTGF0IC0gc3RhcnRMYXQ7XG4gICAgY29uc3Qgc3RhcnRMb25nID0gMDtcbiAgICBjb25zdCBlbmRMb25nID0gMiAqIE1hdGguUEk7XG4gICAgY29uc3QgbG9uZ1JhbmdlID0gZW5kTG9uZyAtIHN0YXJ0TG9uZztcbiAgICBjb25zdCBudW1WZXJ0aWNlcyA9IChubGF0ICsgMSkgKiAobmxvbmcgKyAxKTtcblxuICAgIGlmICh0eXBlb2YgcmFkaXVzID09PSAnbnVtYmVyJykge1xuICAgICAgdmFyIHZhbHVlID0gcmFkaXVzO1xuICAgICAgcmFkaXVzID0gZnVuY3Rpb24objEsIG4yLCBuMywgdSwgdikge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnN0IHZlcnRpY2VzID0gbmV3IEZsb2F0MzJBcnJheShudW1WZXJ0aWNlcyAqIDMpO1xuICAgIGNvbnN0IG5vcm1hbHMgPSBuZXcgRmxvYXQzMkFycmF5KG51bVZlcnRpY2VzICogMyk7XG4gICAgY29uc3QgdGV4Q29vcmRzID0gbmV3IEZsb2F0MzJBcnJheShudW1WZXJ0aWNlcyAqIDIpO1xuICAgIGNvbnN0IGluZGljZXMgPSBuZXcgVWludDE2QXJyYXkobmxhdCAqIG5sb25nICogNik7XG5cbiAgICAvLyBDcmVhdGUgdmVydGljZXMsIG5vcm1hbHMgYW5kIHRleENvb3Jkc1xuICAgIGZvciAobGV0IHkgPSAwOyB5IDw9IG5sYXQ7IHkrKykge1xuICAgICAgZm9yIChsZXQgeCA9IDA7IHggPD0gbmxvbmc7IHgrKykge1xuXG4gICAgICAgIGNvbnN0IGluZGV4ID0geCArIHkgKiAobmxvbmcgKyAxKTtcbiAgICAgICAgY29uc3QgaTIgPSBpbmRleCAqIDI7XG4gICAgICAgIGNvbnN0IGkzID0gaW5kZXggKiAzO1xuXG4gICAgICAgIGNvbnN0IHRoZXRhID0gbG9uZ1JhbmdlICogdTtcbiAgICAgICAgY29uc3QgcGhpID0gbGF0UmFuZ2UgKiB2O1xuICAgICAgICBjb25zdCBzaW5UaGV0YSA9IE1hdGguc2luKHRoZXRhKTtcbiAgICAgICAgY29uc3QgY29zVGhldGEgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgICAgIGNvbnN0IHNpblBoaSA9IE1hdGguc2luKHBoaSk7XG4gICAgICAgIGNvbnN0IGNvc1BoaSA9IE1hdGguY29zKHBoaSk7XG4gICAgICAgIGNvbnN0IHV4ID0gY29zVGhldGEgKiBzaW5QaGk7XG4gICAgICAgIGNvbnN0IHV5ID0gY29zUGhpO1xuICAgICAgICBjb25zdCB1eiA9IHNpblRoZXRhICogc2luUGhpO1xuXG4gICAgICAgIGNvbnN0IHIgPSByYWRpdXModXgsIHV5LCB1eiwgdSwgdik7XG5cbiAgICAgICAgY29uc3QgdSA9IHggLyBubG9uZztcbiAgICAgICAgY29uc3QgdiA9IHkgLyBubGF0O1xuXG4gICAgICAgIHZlcnRpY2VzW2kzICsgMF0gPSByICogdXg7XG4gICAgICAgIHZlcnRpY2VzW2kzICsgMV0gPSByICogdXk7XG4gICAgICAgIHZlcnRpY2VzW2kzICsgMl0gPSByICogdXo7XG5cbiAgICAgICAgbm9ybWFsc1tpMyArIDBdID0gdXg7XG4gICAgICAgIG5vcm1hbHNbaTMgKyAxXSA9IHV5O1xuICAgICAgICBub3JtYWxzW2kzICsgMl0gPSB1ejtcblxuICAgICAgICB0ZXhDb29yZHNbaTIgKyAwXSA9IHU7XG4gICAgICAgIHRleENvb3Jkc1tpMiArIDFdID0gdjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgaW5kaWNlc1xuICAgIGNvbnN0IG51bVZlcnRzQXJvdW5kID0gbmxhdCArIDE7XG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBubGF0OyB4KyspIHtcbiAgICAgIGZvciAobGV0IHkgPSAwOyB5IDwgbmxvbmc7IHkrKykge1xuICAgICAgICBjb25zdCBpbmRleCA9ICh4ICogbmxvbmcgKyB5KSAqIDY7XG5cbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDBdID0geSAqIG51bVZlcnRzQXJvdW5kICsgeDtcbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDFdID0geSAqIG51bVZlcnRzQXJvdW5kICsgeCArIDE7XG4gICAgICAgIGluZGljZXNbaW5kZXggKyAyXSA9ICh5ICsgMSkgKiBudW1WZXJ0c0Fyb3VuZCArIHg7XG5cbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDNdID0gKHkgKyAxKSAqIG51bVZlcnRzQXJvdW5kICsgeDtcbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDRdID0geSAqIG51bVZlcnRzQXJvdW5kICsgeCArIDE7XG4gICAgICAgIGluZGljZXNbaW5kZXggKyA1XSA9ICh5ICsgMSkgKiBudW1WZXJ0c0Fyb3VuZCArIHggKyAxO1xuICAgICAgfVxuICAgIH1cblxuICAgIHN1cGVyKHtcbiAgICAgIC4uLm9wdHMsXG4gICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgIHZlcnRpY2VzOiB2ZXJ0aWNlcyxcbiAgICAgICAgaW5kaWNlczogaW5kaWNlcyxcbiAgICAgICAgbm9ybWFsczogbm9ybWFscyxcbiAgICAgICAgdGV4Q29vcmRzOiB0ZXhDb29yZHNcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTcGhlcmUgZXh0ZW5kcyBNb2RlbCB7XG4gIGNvbnN0cnVjdG9yKG9wdHMpIHtcbiAgICBzdXBlcih7Z2VvbWV0cnk6IG5ldyBTcGhlcmVHZW9tZXRyeShvcHRzKSwgLi4ub3B0c30pO1xuICB9XG59XG4iXX0=