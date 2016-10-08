'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.TruncatedConeGeometry = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _geometry = require('../core/geometry');

var _geometry2 = _interopRequireDefault(_geometry);

var _model = require('../core/model');

var _model2 = _interopRequireDefault(_model);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var TruncatedConeGeometry = exports.TruncatedConeGeometry = function (_Geometry) {
  _inherits(TruncatedConeGeometry, _Geometry);

  // Primitives inspired by TDL http://code.google.com/p/webglsamples/,
  // copyright 2011 Google Inc. new BSD License
  // (http://www.opensource.org/licenses/bsd-license.php).
  /* eslint-disable max-statements, complexity */
  function TruncatedConeGeometry() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var _ref$bottomRadius = _ref.bottomRadius;
    var bottomRadius = _ref$bottomRadius === undefined ? 0 : _ref$bottomRadius;
    var _ref$topRadius = _ref.topRadius;
    var topRadius = _ref$topRadius === undefined ? 0 : _ref$topRadius;
    var _ref$height = _ref.height;
    var height = _ref$height === undefined ? 1 : _ref$height;
    var _ref$nradial = _ref.nradial;
    var nradial = _ref$nradial === undefined ? 10 : _ref$nradial;
    var _ref$nvertical = _ref.nvertical;
    var nvertical = _ref$nvertical === undefined ? 10 : _ref$nvertical;
    var _ref$topCap = _ref.topCap;
    var topCap = _ref$topCap === undefined ? false : _ref$topCap;
    var _ref$bottomCap = _ref.bottomCap;
    var bottomCap = _ref$bottomCap === undefined ? false : _ref$bottomCap;

    var opts = _objectWithoutProperties(_ref, ['bottomRadius', 'topRadius', 'height', 'nradial', 'nvertical', 'topCap', 'bottomCap']);

    _classCallCheck(this, TruncatedConeGeometry);

    var extra = (topCap ? 2 : 0) + (bottomCap ? 2 : 0);
    var numVertices = (nradial + 1) * (nvertical + 1 + extra);

    var slant = Math.atan2(bottomRadius - topRadius, height);
    var msin = Math.sin;
    var mcos = Math.cos;
    var mpi = Math.PI;
    var cosSlant = mcos(slant);
    var sinSlant = msin(slant);
    var start = topCap ? -2 : 0;
    var end = nvertical + (bottomCap ? 2 : 0);
    var vertsAroundEdge = nradial + 1;

    var positions = new Float32Array(numVertices * 3);
    var normals = new Float32Array(numVertices * 3);
    var texCoords = new Float32Array(numVertices * 2);
    var indices = new Uint16Array(nradial * (nvertical + extra) * 6);

    var i3 = 0;
    var i2 = 0;
    for (var i = start; i <= end; i++) {
      var v = i / nvertical;
      var y = height * v;
      var ringRadius = void 0;

      if (i < 0) {
        y = 0;
        v = 1;
        ringRadius = bottomRadius;
      } else if (i > nvertical) {
        y = height;
        v = 1;
        ringRadius = topRadius;
      } else {
        ringRadius = bottomRadius + (topRadius - bottomRadius) * (i / nvertical);
      }
      if (i === -2 || i === nvertical + 2) {
        ringRadius = 0;
        v = 0;
      }
      y -= height / 2;
      for (var j = 0; j < vertsAroundEdge; j++) {
        var sin = msin(j * mpi * 2 / nradial);
        var cos = mcos(j * mpi * 2 / nradial);

        positions[i3 + 0] = sin * ringRadius;
        positions[i3 + 1] = y;
        positions[i3 + 2] = cos * ringRadius;

        normals[i3 + 0] = i < 0 || i > nvertical ? 0 : sin * cosSlant;
        normals[i3 + 1] = i < 0 ? -1 : i > nvertical ? 1 : sinSlant;
        normals[i3 + 2] = i < 0 || i > nvertical ? 0 : cos * cosSlant;

        texCoords[i2 + 0] = j / nradial;
        texCoords[i2 + 1] = v;

        i2 += 2;
        i3 += 3;
      }
    }

    for (var _i = 0; _i < nvertical + extra; _i++) {
      for (var _j = 0; _j < nradial; _j++) {
        var index = (_i * nradial + _j) * 6;
        indices[index + 0] = vertsAroundEdge * (_i + 0) + 0 + _j;
        indices[index + 1] = vertsAroundEdge * (_i + 0) + 1 + _j;
        indices[index + 2] = vertsAroundEdge * (_i + 1) + 1 + _j;
        indices[index + 3] = vertsAroundEdge * (_i + 0) + 0 + _j;
        indices[index + 4] = vertsAroundEdge * (_i + 1) + 1 + _j;
        indices[index + 5] = vertsAroundEdge * (_i + 1) + 0 + _j;
      }
    }

    return _possibleConstructorReturn(this, (TruncatedConeGeometry.__proto__ || Object.getPrototypeOf(TruncatedConeGeometry)).call(this, _extends({}, opts, {
      attributes: {
        positions: positions,
        normals: normals,
        texCoords: texCoords,
        indices: indices
      }
    })));
  }

  return TruncatedConeGeometry;
}(_geometry2.default);

var TruncatedCone = function (_Model) {
  _inherits(TruncatedCone, _Model);

  function TruncatedCone(opts) {
    _classCallCheck(this, TruncatedCone);

    return _possibleConstructorReturn(this, (TruncatedCone.__proto__ || Object.getPrototypeOf(TruncatedCone)).call(this, _extends({}, opts, {
      geometry: new TruncatedConeGeometry(opts)
    })));
  }

  return TruncatedCone;
}(_model2.default);

exports.default = TruncatedCone;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9nZW9tZXRyeS90cnVuY2F0ZWQtY29uZS5qcyJdLCJuYW1lcyI6WyJUcnVuY2F0ZWRDb25lR2VvbWV0cnkiLCJib3R0b21SYWRpdXMiLCJ0b3BSYWRpdXMiLCJoZWlnaHQiLCJucmFkaWFsIiwibnZlcnRpY2FsIiwidG9wQ2FwIiwiYm90dG9tQ2FwIiwib3B0cyIsImV4dHJhIiwibnVtVmVydGljZXMiLCJzbGFudCIsIk1hdGgiLCJhdGFuMiIsIm1zaW4iLCJzaW4iLCJtY29zIiwiY29zIiwibXBpIiwiUEkiLCJjb3NTbGFudCIsInNpblNsYW50Iiwic3RhcnQiLCJlbmQiLCJ2ZXJ0c0Fyb3VuZEVkZ2UiLCJwb3NpdGlvbnMiLCJGbG9hdDMyQXJyYXkiLCJub3JtYWxzIiwidGV4Q29vcmRzIiwiaW5kaWNlcyIsIlVpbnQxNkFycmF5IiwiaTMiLCJpMiIsImkiLCJ2IiwieSIsInJpbmdSYWRpdXMiLCJqIiwiaW5kZXgiLCJhdHRyaWJ1dGVzIiwiVHJ1bmNhdGVkQ29uZSIsImdlb21ldHJ5Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7OztBQUNBOzs7Ozs7Ozs7Ozs7OztJQUVhQSxxQixXQUFBQSxxQjs7O0FBRVg7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQ0FTUTtBQUFBLG1GQUFKLEVBQUk7O0FBQUEsaUNBUk5DLFlBUU07QUFBQSxRQVJOQSxZQVFNLHFDQVJTLENBUVQ7QUFBQSw4QkFQTkMsU0FPTTtBQUFBLFFBUE5BLFNBT00sa0NBUE0sQ0FPTjtBQUFBLDJCQU5OQyxNQU1NO0FBQUEsUUFOTkEsTUFNTSwrQkFORyxDQU1IO0FBQUEsNEJBTE5DLE9BS007QUFBQSxRQUxOQSxPQUtNLGdDQUxJLEVBS0o7QUFBQSw4QkFKTkMsU0FJTTtBQUFBLFFBSk5BLFNBSU0sa0NBSk0sRUFJTjtBQUFBLDJCQUhOQyxNQUdNO0FBQUEsUUFITkEsTUFHTSwrQkFIRyxLQUdIO0FBQUEsOEJBRk5DLFNBRU07QUFBQSxRQUZOQSxTQUVNLGtDQUZNLEtB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RUssc0pBNEVEN0IsSUE1RUM7QUE2RUorQixrQkFBWTtBQUNWZCw0QkFEVTtBQUVWRSx3QkFGVTtBQUdWQyw0QkFIVTtBQUlWQztBQUpVO0FBN0VSO0FBb0ZQOzs7OztJQUlrQlcsYTs7O0FBQ25CLHlCQUFZaEMsSUFBWixFQUFrQjtBQUFBOztBQUFBLHNJQUVYQSxJQUZXO0FBR2RpQyxnQkFBVSxJQUFJekMscUJBQUosQ0FBMEJRLElBQTFCO0FBSEk7QUFLakI7Ozs7O2tCQU5rQmdDLGEiLCJmaWxlIjoidHJ1bmNhdGVkLWNvbmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgR2VvbWV0cnkgZnJvbSAnLi4vY29yZS9nZW9tZXRyeSc7XG5pbXBvcnQgTW9kZWwgZnJvbSAnLi4vY29yZS9tb2RlbCc7XG5cbmV4cG9ydCBjbGFzcyBUcnVuY2F0ZWRDb25lR2VvbWV0cnkgZXh0ZW5kcyBHZW9tZXRyeSB7XG5cbiAgLy8gUHJpbWl0aXZlcyBpbnNwaXJlZCBieSBUREwgaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL3dlYmdsc2FtcGxlcy8sXG4gIC8vIGNvcHlyaWdodCAyMDExIEdvb2dsZSBJbmMuIG5ldyBCU0QgTGljZW5zZVxuICAvLyAoaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9ic2QtbGljZW5zZS5waHApLlxuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cywgY29tcGxleGl0eSAqL1xuICBjb25zdHJ1Y3Rvcih7XG4gICAgYm90dG9tUmFkaXVzID0gMCxcbiAgICB0b3BSYWRpdXMgPSAwLFxuICAgIGhlaWdodCA9IDEsXG4gICAgbnJhZGlhbCA9IDEwLFxuICAgIG52ZXJ0aWNhbCA9IDEwLFxuICAgIHRvcENhcCA9IGZhbHNlLFxuICAgIGJvdHRvbUNhcCA9IGZhbHNlLFxuICAgIC4uLm9wdHNcbiAgfSA9IHt9KSB7XG4gICAgY29uc3QgZXh0cmEgPSAodG9wQ2FwID8gMiA6IDApICsgKGJvdHRvbUNhcCA/IDIgOiAwKTtcbiAgICBjb25zdCBudW1WZXJ0aWNlcyA9IChucmFkaWFsICsgMSkgKiAobnZlcnRpY2FsICsgMSArIGV4dHJhKTtcblxuICAgIGNvbnN0IHNsYW50ID0gTWF0aC5hdGFuMihib3R0b21SYWRpdXMgLSB0b3BSYWRpdXMsIGhlaWdodCk7XG4gICAgY29uc3QgbXNpbiA9IE1hdGguc2luO1xuICAgIGNvbnN0IG1jb3MgPSBNYXRoLmNvcztcbiAgICBjb25zdCBtcGkgPSBNYXRoLlBJO1xuICAgIGNvbnN0IGNvc1NsYW50ID0gbWNvcyhzbGFudCk7XG4gICAgY29uc3Qgc2luU2xhbnQgPSBtc2luKHNsYW50KTtcbiAgICBjb25zdCBzdGFydCA9IHRvcENhcCA/IC0yIDogMDtcbiAgICBjb25zdCBlbmQgPSBudmVydGljYWwgKyAoYm90dG9tQ2FwID8gMiA6IDApO1xuICAgIGNvbnN0IHZlcnRzQXJvdW5kRWRnZSA9IG5yYWRpYWwgKyAxO1xuXG4gICAgY29uc3QgcG9zaXRpb25zID0gbmV3IEZsb2F0MzJBcnJheShudW1WZXJ0aWNlcyAqIDMpO1xuICAgIGNvbnN0IG5vcm1hbHMgPSBuZXcgRmxvYXQzMkFycmF5KG51bVZlcnRpY2VzICogMyk7XG4gICAgY29uc3QgdGV4Q29vcmRzID0gbmV3IEZsb2F0MzJBcnJheShudW1WZXJ0aWNlcyAqIDIpO1xuICAgIGNvbnN0IGluZGljZXMgPSBuZXcgVWludDE2QXJyYXkobnJhZGlhbCAqIChudmVydGljYWwgKyBleHRyYSkgKiA2KTtcblxuICAgIGxldCBpMyA9IDA7XG4gICAgbGV0IGkyID0gMDtcbiAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPD0gZW5kOyBpKyspIHtcbiAgICAgIGxldCB2ID0gaSAvIG52ZXJ0aWNhbDtcbiAgICAgIGxldCB5ID0gaGVpZ2h0ICogdjtcbiAgICAgIGxldCByaW5nUmFkaXVzO1xuXG4gICAgICBpZiAoaSA8IDApIHtcbiAgICAgICAgeSA9IDA7XG4gICAgICAgIHYgPSAxO1xuICAgICAgICByaW5nUmFkaXVzID0gYm90dG9tUmFkaXVzO1xuICAgICAgfSBlbHNlIGlmIChpID4gbnZlcnRpY2FsKSB7XG4gICAgICAgIHkgPSBoZWlnaHQ7XG4gICAgICAgIHYgPSAxO1xuICAgICAgICByaW5nUmFkaXVzID0gdG9wUmFkaXVzO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmluZ1JhZGl1cyA9IGJvdHRvbVJhZGl1cyArXG4gICAgICAgICAgKHRvcFJhZGl1cyAtIGJvdHRvbVJhZGl1cykgKiAoaSAvIG52ZXJ0aWNhbCk7XG4gICAgICB9XG4gICAgICBpZiAoaSA9PT0gLTIgfHwgaSA9PT0gbnZlcnRpY2FsICsgMikge1xuICAgICAgICByaW5nUmFkaXVzID0gMDtcbiAgICAgICAgdiA9IDA7XG4gICAgICB9XG4gICAgICB5IC09IGhlaWdodCAvIDI7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHZlcnRzQXJvdW5kRWRnZTsgaisrKSB7XG4gICAgICAgIGNvbnN0IHNpbiA9IG1zaW4oaiAqIG1waSAqIDIgLyBucmFkaWFsKTtcbiAgICAgICAgY29uc3QgY29zID0gbWNvcyhqICogbXBpICogMiAvIG5yYWRpYWwpO1xuXG4gICAgICAgIHBvc2l0aW9uc1tpMyArIDBdID0gc2luICogcmluZ1JhZGl1cztcbiAgICAgICAgcG9zaXRpb25zW2kzICsgMV0gPSB5O1xuICAgICAgICBwb3NpdGlvbnNbaTMgKyAyXSA9IGNvcyAqIHJpbmdSYWRpdXM7XG5cbiAgICAgICAgbm9ybWFsc1tpMyArIDBdID0gKGkgPCAwIHx8IGkgPiBudmVydGljYWwpID8gMCA6IChzaW4gKiBjb3NTbGFudCk7XG4gICAgICAgIG5vcm1hbHNbaTMgKyAxXSA9IChpIDwgMCkgPyAtMSA6IChpID4gbnZlcnRpY2FsID8gMSA6IHNpblNsYW50KTtcbiAgICAgICAgbm9ybWFsc1tpMyArIDJdID0gKGkgPCAwIHx8IGkgPiBudmVydGljYWwpID8gMCA6IChjb3MgKiBjb3NTbGFudCk7XG5cbiAgICAgICAgdGV4Q29vcmRzW2kyICsgMF0gPSBqIC8gbnJhZGlhbDtcbiAgICAgICAgdGV4Q29vcmRzW2kyICsgMV0gPSB2O1xuXG4gICAgICAgIGkyICs9IDI7XG4gICAgICAgIGkzICs9IDM7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudmVydGljYWwgKyBleHRyYTsgaSsrKSB7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IG5yYWRpYWw7IGorKykge1xuICAgICAgICBjb25zdCBpbmRleCA9IChpICogbnJhZGlhbCArIGopICogNjtcbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDBdID0gdmVydHNBcm91bmRFZGdlICogKGkgKyAwKSArIDAgKyBqO1xuICAgICAgICBpbmRpY2VzW2luZGV4ICsgMV0gPSB2ZXJ0c0Fyb3VuZEVkZ2UgKiAoaSArIDApICsgMSArIGo7XG4gICAgICAgIGluZGljZXNbaW5kZXggKyAyXSA9IHZlcnRzQXJvdW5kRWRnZSAqIChpICsgMSkgKyAxICsgajtcbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDNdID0gdmVydHNBcm91bmRFZGdlICogKGkgKyAwKSArIDAgKyBqO1xuICAgICAgICBpbmRpY2VzW2luZGV4ICsgNF0gPSB2ZXJ0c0Fyb3VuZEVkZ2UgKiAoaSArIDEpICsgMSArIGo7XG4gICAgICAgIGluZGljZXNbaW5kZXggKyA1XSA9IHZlcnRzQXJvdW5kRWRnZSAqIChpICsgMSkgKyAwICsgajtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBzdXBlcih7XG4gICAgICAuLi5vcHRzLFxuICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICBwb3NpdGlvbnMsXG4gICAgICAgIG5vcm1hbHMsXG4gICAgICAgIHRleENvb3JkcyxcbiAgICAgICAgaW5kaWNlc1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVHJ1bmNhdGVkQ29uZSBleHRlbmRzIE1vZGVsIHtcbiAgY29uc3RydWN0b3Iob3B0cykge1xuICAgIHN1cGVyKHtcbiAgICAgIC4uLm9wdHMsXG4gICAgICBnZW9tZXRyeTogbmV3IFRydW5jYXRlZENvbmVHZW9tZXRyeShvcHRzKVxuICAgIH0pO1xuICB9XG59XG4iXX0=