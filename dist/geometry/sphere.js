'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.SphereGeometry = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _geometry = require('../core/geometry');

var _geometry2 = _interopRequireDefault(_geometry);

var _model = require('../core/model');

var _model2 = _interopRequireDefault(_model);

var _utils = require('../utils');

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
    var _ref$id = _ref.id;
    var id = _ref$id === undefined ? (0, _utils.uid)('sphere-geometry') : _ref$id;

    var opts = _objectWithoutProperties(_ref, ['nlat', 'nlong', 'radius', 'id']);

    _classCallCheck(this, SphereGeometry);

    var startLat = 0;
    var endLat = Math.PI;
    var latRange = endLat - startLat;
    var startLong = 0;
    var endLong = 2 * Math.PI;
    var longRange = endLong - startLong;
    var numVertices = (nlat + 1) * (nlong + 1);

    if (typeof radius === 'number') {
      (function () {
        var value = radius;
        radius = function radius(n1, n2, n3, u, v) {
          return value;
        };
      })();
    }

    var positions = new Float32Array(numVertices * 3);
    var normals = new Float32Array(numVertices * 3);
    var texCoords = new Float32Array(numVertices * 2);
    var indices = new Uint16Array(nlat * nlong * 6);

    // Create positions, normals and texCoords
    for (var y = 0; y <= nlat; y++) {
      for (var x = 0; x <= nlong; x++) {

        var u = x / nlong;
        var v = y / nlat;

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

        positions[i3 + 0] = r * ux;
        positions[i3 + 1] = r * uy;
        positions[i3 + 2] = r * uz;

        normals[i3 + 0] = ux;
        normals[i3 + 1] = uy;
        normals[i3 + 2] = uz;

        texCoords[i2 + 0] = u;
        texCoords[i2 + 1] = v;
      }
    }

    // Create indices
    var numVertsAround = nlat + 1;
    for (var _x2 = 0; _x2 < nlat; _x2++) {
      for (var _y = 0; _y < nlong; _y++) {
        var _index = (_x2 * nlong + _y) * 6;

        indices[_index + 0] = _y * numVertsAround + _x2;
        indices[_index + 1] = _y * numVertsAround + _x2 + 1;
        indices[_index + 2] = (_y + 1) * numVertsAround + _x2;

        indices[_index + 3] = (_y + 1) * numVertsAround + _x2;
        indices[_index + 4] = _y * numVertsAround + _x2 + 1;
        indices[_index + 5] = (_y + 1) * numVertsAround + _x2 + 1;
      }
    }

    return _possibleConstructorReturn(this, Object.getPrototypeOf(SphereGeometry).call(this, _extends({}, opts, {
      id: id,
      attributes: {
        positions: positions,
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

  function Sphere() {
    var _ref2 = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var _ref2$id = _ref2.id;
    var id = _ref2$id === undefined ? (0, _utils.uid)('sphere') : _ref2$id;

    var opts = _objectWithoutProperties(_ref2, ['id']);

    _classCallCheck(this, Sphere);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Sphere).call(this, _extends({}, opts, {
      id: id,
      geometry: new SphereGeometry(opts)
    })));
  }

  return Sphere;
}(_model2.default);

exports.default = Sphere;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9nZW9tZXRyeS9zcGhlcmUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7Ozs7Ozs7SUFFYSxjLFdBQUEsYzs7O0FBRVg7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0QkFNUTtBQUFBLHFFQUFKLEVBQUk7O0FBQUEseUJBTE4sSUFLTTtBQUFBLFFBTE4sSUFLTSw2QkFMQyxFQUtEO0FBQUEsMEJBSk4sS0FJTTtBQUFBLFFBSk4sS0FJTSw4QkFKRSxFQUlGO0FBQUEsMkJBSE4sTUFHTTtBQUFBLFFBSE4sTUFHTSwrQkFIRyxDQUdIO0FBQUEsdUJBRk4sRUFFTTtBQUFBLFFBRk4sRUFFTSwyQkFGRCxnQkFBSSxpQkFBSixDQUVDOztBQUFBLFFBREgsSUFDRzs7QUFBQTs7QUFDTixRQUFNLFdBQVcsQ0FBakI7QUFDQSxRQUFNLFNBQVMsS0FBSyxFQUFwQjtBQUNBLFFBQU0sV0FBVyxTQUFTLFFBQTFCO0FBQ0EsUUFBTSxZQUFZLENBQWxCO0FBQ0EsUUFBTSxVQUFVLElBQUksS0FBSyxFQUF6QjtBQUNBLFFBQU0sWUFBWSxVQUFVLFNBQTVCO0FBQ0EsUUFBTSxjQUFjLENBQUMsT0FBTyxDQUFSLEtBQWMsUUFBUSxDQUF0QixDQUFwQjs7QUFFQSxRQUFJLE9BQU8sTUFBUCxLQUFrQixRQUF0QixFQUFnQztBQUFBO0FBQzlCLFlBQU0sUUFBUSxNQUFkO0FBQ0EsaUJBQVMsZ0JBQVMsRUFBVCxFQUFhLEVBQWIsRUFBaUIsRUFBakIsRUFBcUIsQ0FBckIsRUFBd0IsQ0FBeEIsRUFBMkI7QUFDbEMsaUJBQU8sS0FBUDtBQUNELFNBRkQ7QUFGOEI7QUFLL0I7O0FBRUQsUUFBTSxZQUFZLElBQUksWUFBSixDQUFpQixjQUFjLENBQS9CLENBQWxCO0FBQ0EsUUFBTSxVQUFVLElBQUksWUFBSixDQUFpQixjQUFjLENBQS9CLENBQWhCO0FBQ0EsUUFBTSxZQUFZLElBQUksWUFBSixDQUFpQixjQUFj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QUE5QixnQkFBSSxRQUFKLENBQThCOztBQUFBLFFBQVosSUFBWTs7QUFBQTs7QUFBQSxrR0FFekMsSUFGeUM7QUFHNUMsWUFINEM7QUFJNUMsZ0JBQVUsSUFBSSxjQUFKLENBQW1CLElBQW5CO0FBSmtDO0FBTS9DOzs7OztrQkFQa0IsTSIsImZpbGUiOiJzcGhlcmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgR2VvbWV0cnkgZnJvbSAnLi4vY29yZS9nZW9tZXRyeSc7XG5pbXBvcnQgTW9kZWwgZnJvbSAnLi4vY29yZS9tb2RlbCc7XG5pbXBvcnQge3VpZH0gZnJvbSAnLi4vdXRpbHMnO1xuXG5leHBvcnQgY2xhc3MgU3BoZXJlR2VvbWV0cnkgZXh0ZW5kcyBHZW9tZXRyeSB7XG5cbiAgLy8gUHJpbWl0aXZlcyBpbnNwaXJlZCBieSBUREwgaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL3dlYmdsc2FtcGxlcy8sXG4gIC8vIGNvcHlyaWdodCAyMDExIEdvb2dsZSBJbmMuIG5ldyBCU0QgTGljZW5zZVxuICAvLyAoaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9ic2QtbGljZW5zZS5waHApLlxuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cywgY29tcGxleGl0eSAqL1xuICBjb25zdHJ1Y3Rvcih7XG4gICAgbmxhdCA9IDEwLFxuICAgIG5sb25nID0gMTAsXG4gICAgcmFkaXVzID0gMSxcbiAgICBpZCA9IHVpZCgnc3BoZXJlLWdlb21ldHJ5JyksXG4gICAgLi4ub3B0c1xuICB9ID0ge30pIHtcbiAgICBjb25zdCBzdGFydExhdCA9IDA7XG4gICAgY29uc3QgZW5kTGF0ID0gTWF0aC5QSTtcbiAgICBjb25zdCBsYXRSYW5nZSA9IGVuZExhdCAtIHN0YXJ0TGF0O1xuICAgIGNvbnN0IHN0YXJ0TG9uZyA9IDA7XG4gICAgY29uc3QgZW5kTG9uZyA9IDIgKiBNYXRoLlBJO1xuICAgIGNvbnN0IGxvbmdSYW5nZSA9IGVuZExvbmcgLSBzdGFydExvbmc7XG4gICAgY29uc3QgbnVtVmVydGljZXMgPSAobmxhdCArIDEpICogKG5sb25nICsgMSk7XG5cbiAgICBpZiAodHlwZW9mIHJhZGl1cyA9PT0gJ251bWJlcicpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gcmFkaXVzO1xuICAgICAgcmFkaXVzID0gZnVuY3Rpb24objEsIG4yLCBuMywgdSwgdikge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnN0IHBvc2l0aW9ucyA9IG5ldyBGbG9hdDMyQXJyYXkobnVtVmVydGljZXMgKiAzKTtcbiAgICBjb25zdCBub3JtYWxzID0gbmV3IEZsb2F0MzJBcnJheShudW1WZXJ0aWNlcyAqIDMpO1xuICAgIGNvbnN0IHRleENvb3JkcyA9IG5ldyBGbG9hdDMyQXJyYXkobnVtVmVydGljZXMgKiAyKTtcbiAgICBjb25zdCBpbmRpY2VzID0gbmV3IFVpbnQxNkFycmF5KG5sYXQgKiBubG9uZyAqIDYpO1xuXG4gICAgLy8gQ3JlYXRlIHBvc2l0aW9ucywgbm9ybWFscyBhbmQgdGV4Q29vcmRzXG4gICAgZm9yIChsZXQgeSA9IDA7IHkgPD0gbmxhdDsgeSsrKSB7XG4gICAgICBmb3IgKGxldCB4ID0gMDsgeCA8PSBubG9uZzsgeCsrKSB7XG5cbiAgICAgICAgY29uc3QgdSA9IHggLyBubG9uZztcbiAgICAgICAgY29uc3QgdiA9IHkgLyBubGF0O1xuXG4gICAgICAgIGNvbnN0IGluZGV4ID0geCArIHkgKiAobmxvbmcgKyAxKTtcbiAgICAgICAgY29uc3QgaTIgPSBpbmRleCAqIDI7XG4gICAgICAgIGNvbnN0IGkzID0gaW5kZXggKiAzO1xuXG4gICAgICAgIGNvbnN0IHRoZXRhID0gbG9uZ1JhbmdlICogdTtcbiAgICAgICAgY29uc3QgcGhpID0gbGF0UmFuZ2UgKiB2O1xuICAgICAgICBjb25zdCBzaW5UaGV0YSA9IE1hdGguc2luKHRoZXRhKTtcbiAgICAgICAgY29uc3QgY29zVGhldGEgPSBNYXRoLmNvcyh0aGV0YSk7XG4gICAgICAgIGNvbnN0IHNpblBoaSA9IE1hdGguc2luKHBoaSk7XG4gICAgICAgIGNvbnN0IGNvc1BoaSA9IE1hdGguY29zKHBoaSk7XG4gICAgICAgIGNvbnN0IHV4ID0gY29zVGhldGEgKiBzaW5QaGk7XG4gICAgICAgIGNvbnN0IHV5ID0gY29zUGhpO1xuICAgICAgICBjb25zdCB1eiA9IHNpblRoZXRhICogc2luUGhpO1xuXG4gICAgICAgIGNvbnN0IHIgPSByYWRpdXModXgsIHV5LCB1eiwgdSwgdik7XG5cbiAgICAgICAgcG9zaXRpb25zW2kzICsgMF0gPSByICogdXg7XG4gICAgICAgIHBvc2l0aW9uc1tpMyArIDFdID0gciAqIHV5O1xuICAgICAgICBwb3NpdGlvbnNbaTMgKyAyXSA9IHIgKiB1ejtcblxuICAgICAgICBub3JtYWxzW2kzICsgMF0gPSB1eDtcbiAgICAgICAgbm9ybWFsc1tpMyArIDFdID0gdXk7XG4gICAgICAgIG5vcm1hbHNbaTMgKyAyXSA9IHV6O1xuXG4gICAgICAgIHRleENvb3Jkc1tpMiArIDBdID0gdTtcbiAgICAgICAgdGV4Q29vcmRzW2kyICsgMV0gPSB2O1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENyZWF0ZSBpbmRpY2VzXG4gICAgY29uc3QgbnVtVmVydHNBcm91bmQgPSBubGF0ICsgMTtcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IG5sYXQ7IHgrKykge1xuICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCBubG9uZzsgeSsrKSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gKHggKiBubG9uZyArIHkpICogNjtcblxuICAgICAgICBpbmRpY2VzW2luZGV4ICsgMF0gPSB5ICogbnVtVmVydHNBcm91bmQgKyB4O1xuICAgICAgICBpbmRpY2VzW2luZGV4ICsgMV0gPSB5ICogbnVtVmVydHNBcm91bmQgKyB4ICsgMTtcbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDJdID0gKHkgKyAxKSAqIG51bVZlcnRzQXJvdW5kICsgeDtcblxuICAgICAgICBpbmRpY2VzW2luZGV4ICsgM10gPSAoeSArIDEpICogbnVtVmVydHNBcm91bmQgKyB4O1xuICAgICAgICBpbmRpY2VzW2luZGV4ICsgNF0gPSB5ICogbnVtVmVydHNBcm91bmQgKyB4ICsgMTtcbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDVdID0gKHkgKyAxKSAqIG51bVZlcnRzQXJvdW5kICsgeCArIDE7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc3VwZXIoe1xuICAgICAgLi4ub3B0cyxcbiAgICAgIGlkLFxuICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICBwb3NpdGlvbnM6IHBvc2l0aW9ucyxcbiAgICAgICAgaW5kaWNlczogaW5kaWNlcyxcbiAgICAgICAgbm9ybWFsczogbm9ybWFscyxcbiAgICAgICAgdGV4Q29vcmRzOiB0ZXhDb29yZHNcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTcGhlcmUgZXh0ZW5kcyBNb2RlbCB7XG4gIGNvbnN0cnVjdG9yKHtpZCA9IHVpZCgnc3BoZXJlJyksIC4uLm9wdHN9ID0ge30pIHtcbiAgICBzdXBlcih7XG4gICAgICAuLi5vcHRzLFxuICAgICAgaWQsXG4gICAgICBnZW9tZXRyeTogbmV3IFNwaGVyZUdlb21ldHJ5KG9wdHMpXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==