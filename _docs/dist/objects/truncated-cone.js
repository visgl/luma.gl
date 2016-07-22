'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TruncatedConeGeometry = undefined;

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

var TruncatedConeGeometry = exports.TruncatedConeGeometry = function (_Geometry) {
  _inherits(TruncatedConeGeometry, _Geometry);

  // Primitives inspired by TDL http://code.google.com/p/webglsamples/,
  // copyright 2011 Google Inc. new BSD License
  // (http://www.opensource.org/licenses/bsd-license.php).
  /* eslint-disable max-statements, complexity */

  function TruncatedConeGeometry() {
    var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

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

    return _possibleConstructorReturn(this, Object.getPrototypeOf(TruncatedConeGeometry).call(this, _extends({}, opts, {
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

    return _possibleConstructorReturn(this, Object.getPrototypeOf(TruncatedCone).call(this, _extends({}, opts, {
      geometry: new TruncatedConeGeometry(opts)
    })));
  }

  return TruncatedCone;
}(_model2.default);

exports.default = TruncatedCone;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9vYmplY3RzL3RydW5jYXRlZC1jb25lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7Ozs7Ozs7Ozs7O0lBRWEscUIsV0FBQSxxQjs7Ozs7Ozs7QUFNWCxtQ0FTUTtBQUFBLHFFQUFKLEVBQUk7O0FBQUEsaUNBUk4sWUFRTTtBQUFBLFFBUk4sWUFRTSxxQ0FSUyxDQVFUO0FBQUEsOEJBUE4sU0FPTTtBQUFBLFFBUE4sU0FPTSxrQ0FQTSxDQU9OO0FBQUEsMkJBTk4sTUFNTTtBQUFBLFFBTk4sTUFNTSwrQkFORyxDQU1IO0FBQUEsNEJBTE4sT0FLTTtBQUFBLFFBTE4sT0FLTSxnQ0FMSSxFQUtKO0FBQUEsOEJBSk4sU0FJTTtBQUFBLFFBSk4sU0FJTSxrQ0FKTSxFQUlOO0FBQUEsMkJBSE4sTUFHTTtBQUFBLFFBSE4sTUFHTSwrQkFIRyxLQUdIO0FBQUEsOEJBRk4sU0FFTTtBQUFBLFFBRk4sU0FFTSxrQ0FGTSxLQUVOOztBQUFBLFFBREgsSUFDRzs7QUFBQTs7QUFDTixRQUFNLFFBQVEsQ0FBQyxTQUFTLENBQVQsR0FBYSxDQUFkLEtBQW9CLFlBQVksQ0FBWixHQUFnQixDQUFwQyxDQUFkO0FBQ0EsUUFBTSxjQUFjLENBQUMsVUFBVSxDQUFYLEtBQWlCLFlBQVksQ0FBWixHQUFnQixLQUFqQyxDQUFwQjs7QUFFQSxRQUFNLFFBQVEsS0FBSyxLQUFMLENBQVcsZUFBZSxTQUExQixFQUFxQyxNQUFyQyxDQUFkO0FBQ0EsUUFBTSxPQUFPLEtBQUssR0FBbEI7QUFDQSxRQUFNLE9BQU8sS0FBSyxHQUFsQjtBQUNBLFFBQU0sTUFBTSxLQUFLLEVBQWpCO0FBQ0EsUUFBTSxXQUFXLEtBQUssS0FBTCxDQUFqQjtBQUNBLFFBQU0sV0FBVyxLQUFLLEtBQUwsQ0FBakI7QUFDQSxRQUFNLFFBQVEsU0FBUyxDQUFDLENBQVYsR0FBYyxDQUE1QjtBQUNBLFFBQU0sTUFBTSxhQUFhLFlBQVksQ0FBWixHQUFn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Q0EsZ0JBQVEsUUFBUSxDQUFoQixJQUFxQixtQkFBbUIsS0FBSSxDQUF2QixJQUE0QixDQUE1QixHQUFnQyxFQUFyRDtBQUNBLGdCQUFRLFFBQVEsQ0FBaEIsSUFBcUIsbUJBQW1CLEtBQUksQ0FBdkIsSUFBNEIsQ0FBNUIsR0FBZ0MsRUFBckQ7QUFDQSxnQkFBUSxRQUFRLENBQWhCLElBQXFCLG1CQUFtQixLQUFJLENBQXZCLElBQTRCLENBQTVCLEdBQWdDLEVBQXJEO0FBQ0Q7QUFDRjs7QUF6RUssaUhBNEVELElBNUVDO0FBNkVKLGtCQUFZO0FBQ1YsNEJBRFU7QUFFVix3QkFGVTtBQUdWLDRCQUhVO0FBSVY7QUFKVTtBQTdFUjtBQW9GUDs7Ozs7SUFJa0IsYTs7O0FBQ25CLHlCQUFZLElBQVosRUFBa0I7QUFBQTs7QUFBQSx5R0FFWCxJQUZXO0FBR2QsZ0JBQVUsSUFBSSxxQkFBSixDQUEwQixJQUExQjtBQUhJO0FBS2pCOzs7OztrQkFOa0IsYSIsImZpbGUiOiJ0cnVuY2F0ZWQtY29uZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBHZW9tZXRyeSBmcm9tICcuLi9nZW9tZXRyeSc7XG5pbXBvcnQgTW9kZWwgZnJvbSAnLi4vbW9kZWwnO1xuXG5leHBvcnQgY2xhc3MgVHJ1bmNhdGVkQ29uZUdlb21ldHJ5IGV4dGVuZHMgR2VvbWV0cnkge1xuXG4gIC8vIFByaW1pdGl2ZXMgaW5zcGlyZWQgYnkgVERMIGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC93ZWJnbHNhbXBsZXMvLFxuICAvLyBjb3B5cmlnaHQgMjAxMSBHb29nbGUgSW5jLiBuZXcgQlNEIExpY2Vuc2VcbiAgLy8gKGh0dHA6Ly93d3cub3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvYnNkLWxpY2Vuc2UucGhwKS5cbiAgLyogZXNsaW50LWRpc2FibGUgbWF4LXN0YXRlbWVudHMsIGNvbXBsZXhpdHkgKi9cbiAgY29uc3RydWN0b3Ioe1xuICAgIGJvdHRvbVJhZGl1cyA9IDAsXG4gICAgdG9wUmFkaXVzID0gMCxcbiAgICBoZWlnaHQgPSAxLFxuICAgIG5yYWRpYWwgPSAxMCxcbiAgICBudmVydGljYWwgPSAxMCxcbiAgICB0b3BDYXAgPSBmYWxzZSxcbiAgICBib3R0b21DYXAgPSBmYWxzZSxcbiAgICAuLi5vcHRzXG4gIH0gPSB7fSkge1xuICAgIGNvbnN0IGV4dHJhID0gKHRvcENhcCA/IDIgOiAwKSArIChib3R0b21DYXAgPyAyIDogMCk7XG4gICAgY29uc3QgbnVtVmVydGljZXMgPSAobnJhZGlhbCArIDEpICogKG52ZXJ0aWNhbCArIDEgKyBleHRyYSk7XG5cbiAgICBjb25zdCBzbGFudCA9IE1hdGguYXRhbjIoYm90dG9tUmFkaXVzIC0gdG9wUmFkaXVzLCBoZWlnaHQpO1xuICAgIGNvbnN0IG1zaW4gPSBNYXRoLnNpbjtcbiAgICBjb25zdCBtY29zID0gTWF0aC5jb3M7XG4gICAgY29uc3QgbXBpID0gTWF0aC5QSTtcbiAgICBjb25zdCBjb3NTbGFudCA9IG1jb3Moc2xhbnQpO1xuICAgIGNvbnN0IHNpblNsYW50ID0gbXNpbihzbGFudCk7XG4gICAgY29uc3Qgc3RhcnQgPSB0b3BDYXAgPyAtMiA6IDA7XG4gICAgY29uc3QgZW5kID0gbnZlcnRpY2FsICsgKGJvdHRvbUNhcCA/IDIgOiAwKTtcbiAgICBjb25zdCB2ZXJ0c0Fyb3VuZEVkZ2UgPSBucmFkaWFsICsgMTtcblxuICAgIGNvbnN0IHBvc2l0aW9ucyA9IG5ldyBGbG9hdDMyQXJyYXkobnVtVmVydGljZXMgKiAzKTtcbiAgICBjb25zdCBub3JtYWxzID0gbmV3IEZsb2F0MzJBcnJheShudW1WZXJ0aWNlcyAqIDMpO1xuICAgIGNvbnN0IHRleENvb3JkcyA9IG5ldyBGbG9hdDMyQXJyYXkobnVtVmVydGljZXMgKiAyKTtcbiAgICBjb25zdCBpbmRpY2VzID0gbmV3IFVpbnQxNkFycmF5KG5yYWRpYWwgKiAobnZlcnRpY2FsICsgZXh0cmEpICogNik7XG5cbiAgICBsZXQgaTMgPSAwO1xuICAgIGxldCBpMiA9IDA7XG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDw9IGVuZDsgaSsrKSB7XG4gICAgICBsZXQgdiA9IGkgLyBudmVydGljYWw7XG4gICAgICBsZXQgeSA9IGhlaWdodCAqIHY7XG4gICAgICBsZXQgcmluZ1JhZGl1cztcblxuICAgICAgaWYgKGkgPCAwKSB7XG4gICAgICAgIHkgPSAwO1xuICAgICAgICB2ID0gMTtcbiAgICAgICAgcmluZ1JhZGl1cyA9IGJvdHRvbVJhZGl1cztcbiAgICAgIH0gZWxzZSBpZiAoaSA+IG52ZXJ0aWNhbCkge1xuICAgICAgICB5ID0gaGVpZ2h0O1xuICAgICAgICB2ID0gMTtcbiAgICAgICAgcmluZ1JhZGl1cyA9IHRvcFJhZGl1cztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJpbmdSYWRpdXMgPSBib3R0b21SYWRpdXMgK1xuICAgICAgICAgICh0b3BSYWRpdXMgLSBib3R0b21SYWRpdXMpICogKGkgLyBudmVydGljYWwpO1xuICAgICAgfVxuICAgICAgaWYgKGkgPT09IC0yIHx8IGkgPT09IG52ZXJ0aWNhbCArIDIpIHtcbiAgICAgICAgcmluZ1JhZGl1cyA9IDA7XG4gICAgICAgIHYgPSAwO1xuICAgICAgfVxuICAgICAgeSAtPSBoZWlnaHQgLyAyO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB2ZXJ0c0Fyb3VuZEVkZ2U7IGorKykge1xuICAgICAgICBjb25zdCBzaW4gPSBtc2luKGogKiBtcGkgKiAyIC8gbnJhZGlhbCk7XG4gICAgICAgIGNvbnN0IGNvcyA9IG1jb3MoaiAqIG1waSAqIDIgLyBucmFkaWFsKTtcblxuICAgICAgICBwb3NpdGlvbnNbaTMgKyAwXSA9IHNpbiAqIHJpbmdSYWRpdXM7XG4gICAgICAgIHBvc2l0aW9uc1tpMyArIDFdID0geTtcbiAgICAgICAgcG9zaXRpb25zW2kzICsgMl0gPSBjb3MgKiByaW5nUmFkaXVzO1xuXG4gICAgICAgIG5vcm1hbHNbaTMgKyAwXSA9IChpIDwgMCB8fCBpID4gbnZlcnRpY2FsKSA/IDAgOiAoc2luICogY29zU2xhbnQpO1xuICAgICAgICBub3JtYWxzW2kzICsgMV0gPSAoaSA8IDApID8gLTEgOiAoaSA+IG52ZXJ0aWNhbCA/IDEgOiBzaW5TbGFudCk7XG4gICAgICAgIG5vcm1hbHNbaTMgKyAyXSA9IChpIDwgMCB8fCBpID4gbnZlcnRpY2FsKSA/IDAgOiAoY29zICogY29zU2xhbnQpO1xuXG4gICAgICAgIHRleENvb3Jkc1tpMiArIDBdID0gaiAvIG5yYWRpYWw7XG4gICAgICAgIHRleENvb3Jkc1tpMiArIDFdID0gdjtcblxuICAgICAgICBpMiArPSAyO1xuICAgICAgICBpMyArPSAzO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnZlcnRpY2FsICsgZXh0cmE7IGkrKykge1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBucmFkaWFsOyBqKyspIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSAoaSAqIG5yYWRpYWwgKyBqKSAqIDY7XG4gICAgICAgIGluZGljZXNbaW5kZXggKyAwXSA9IHZlcnRzQXJvdW5kRWRnZSAqIChpICsgMCkgKyAwICsgajtcbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDFdID0gdmVydHNBcm91bmRFZGdlICogKGkgKyAwKSArIDEgKyBqO1xuICAgICAgICBpbmRpY2VzW2luZGV4ICsgMl0gPSB2ZXJ0c0Fyb3VuZEVkZ2UgKiAoaSArIDEpICsgMSArIGo7XG4gICAgICAgIGluZGljZXNbaW5kZXggKyAzXSA9IHZlcnRzQXJvdW5kRWRnZSAqIChpICsgMCkgKyAwICsgajtcbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDRdID0gdmVydHNBcm91bmRFZGdlICogKGkgKyAxKSArIDEgKyBqO1xuICAgICAgICBpbmRpY2VzW2luZGV4ICsgNV0gPSB2ZXJ0c0Fyb3VuZEVkZ2UgKiAoaSArIDEpICsgMCArIGo7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc3VwZXIoe1xuICAgICAgLi4ub3B0cyxcbiAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgcG9zaXRpb25zLFxuICAgICAgICBub3JtYWxzLFxuICAgICAgICB0ZXhDb29yZHMsXG4gICAgICAgIGluZGljZXNcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRydW5jYXRlZENvbmUgZXh0ZW5kcyBNb2RlbCB7XG4gIGNvbnN0cnVjdG9yKG9wdHMpIHtcbiAgICBzdXBlcih7XG4gICAgICAuLi5vcHRzLFxuICAgICAgZ2VvbWV0cnk6IG5ldyBUcnVuY2F0ZWRDb25lR2VvbWV0cnkob3B0cylcbiAgICB9KTtcbiAgfVxufVxuIl19