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

    var vertices = new Float32Array(numVertices * 3);
    var normals = new Float32Array(numVertices * 3);
    var texCoords = new Float32Array(numVertices * 2);
    var indices = new Uint16Array(nradial * (nvertical + extra) * 6);

    var i3 = 0;
    var i2 = 0;
    for (var i = start; i <= end; i++) {
      var v = i / nvertical;
      var y = height * v;
      var ringRadius = undefined;

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

        vertices[i3 + 0] = sin * ringRadius;
        vertices[i3 + 1] = y;
        vertices[i3 + 2] = cos * ringRadius;

        normals[i3 + 0] = i < 0 || i > nvertical ? 0 : sin * cosSlant;
        normals[i3 + 1] = i < 0 ? -1 : i > nvertical ? 1 : sinSlant;
        normals[i3 + 2] = i < 0 || i > nvertical ? 0 : cos * cosSlant;

        texCoords[i2 + 0] = j / nradial;
        texCoords[i2 + 1] = v;

        i2 += 2;
        i3 += 3;
      }
    }

    for (var i = 0; i < nvertical + extra; i++) {
      for (var j = 0; j < nradial; j++) {
        var index = (i * nradial + j) * 6;
        indices[index + 0] = vertsAroundEdge * (i + 0) + 0 + j;
        indices[index + 1] = vertsAroundEdge * (i + 0) + 1 + j;
        indices[index + 2] = vertsAroundEdge * (i + 1) + 1 + j;
        indices[index + 3] = vertsAroundEdge * (i + 0) + 0 + j;
        indices[index + 4] = vertsAroundEdge * (i + 1) + 1 + j;
        indices[index + 5] = vertsAroundEdge * (i + 1) + 0 + j;
      }
    }

    return _possibleConstructorReturn(this, Object.getPrototypeOf(TruncatedConeGeometry).call(this, _extends({}, opts, {
      attributes: {
        vertices: vertices,
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

    return _possibleConstructorReturn(this, Object.getPrototypeOf(TruncatedCone).call(this, _extends({ geometry: new TruncatedConeGeometry(opts) }, opts)));
  }

  return TruncatedCone;
}(_model2.default);

exports.default = TruncatedCone;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9vYmplY3RzL3RydW5jYXRlZC1jb25lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQUdhOzs7Ozs7OztBQU1YLFdBTlcscUJBTVgsR0FDb0U7cUVBQUosa0JBQUk7O2lDQUR2RCxhQUN1RDtRQUR2RCxpREFBZSxzQkFDd0M7OEJBRHJDLFVBQ3FDO1FBRHJDLDJDQUFZLG1CQUN5QjsyQkFEdEIsT0FDc0I7UUFEdEIscUNBQVMsZ0JBQ2E7NEJBRFYsUUFDVTtRQURWLHVDQUFVLGtCQUNBOzhCQUFsRSxVQUFrRTtRQUFsRSwyQ0FBWSxvQkFBc0Q7MkJBQWxELE9BQWtEO1FBQWxELHFDQUFTLG9CQUF5Qzs4QkFBbEMsVUFBa0M7UUFBbEMsMkNBQVksdUJBQXNCOztRQUFaLDhIQUFZOzswQkFQekQsdUJBT3lEOztBQUVsRSxRQUFNLFFBQVEsQ0FBQyxTQUFTLENBQVQsR0FBYSxDQUFiLENBQUQsSUFBb0IsWUFBWSxDQUFaLEdBQWdCLENBQWhCLENBQXBCLENBRm9EO0FBR2xFLFFBQU0sY0FBYyxDQUFDLFVBQVUsQ0FBVixDQUFELElBQWlCLFlBQVksQ0FBWixHQUFnQixLQUFoQixDQUFqQixDQUg4Qzs7QUFLbEUsUUFBTSxRQUFRLEtBQUssS0FBTCxDQUFXLGVBQWUsU0FBZixFQUEwQixNQUFyQyxDQUFSLENBTDREO0FBTWxFLFFBQU0sT0FBTyxLQUFLLEdBQUwsQ0FOcUQ7QUFPbEUsUUFBTSxPQUFPLEtBQUssR0FBTCxDQVBxRDtBQVFsRSxRQUFNLE1BQU0sS0FBSyxFQUFMLENBUnNEO0FBU2xFLFFBQU0sV0FBVyxLQUFLLEtBQUwsQ0FBWCxDQVQ0RDtBQVVsRSxRQUFNLFdBQVcsS0FBSyxLQUFMLENBQVgsQ0FWNEQ7QUFXbEUsUUFBTSxRQUFRLFNBQVMsQ0FBQyxDQUFELEdBQUssQ0FBZCxDQVhvRDtBQVlsRSxRQUFNLE1BQU0sYUFBYSxZQUFZLENBQVosR0FBZ0IsQ0FBaEIsQ0FBYixD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USxDQUFDLElBQUksT0FBSixHQUFjLENBQWQsQ0FBRCxHQUFvQixDQUFwQixDQURrQjtBQUVoQyxnQkFBUSxRQUFRLENBQVIsQ0FBUixHQUFxQixtQkFBbUIsSUFBSSxDQUFKLENBQW5CLEdBQTRCLENBQTVCLEdBQWdDLENBQWhDLENBRlc7QUFHaEMsZ0JBQVEsUUFBUSxDQUFSLENBQVIsR0FBcUIsbUJBQW1CLElBQUksQ0FBSixDQUFuQixHQUE0QixDQUE1QixHQUFnQyxDQUFoQyxDQUhXO0FBSWhDLGdCQUFRLFFBQVEsQ0FBUixDQUFSLEdBQXFCLG1CQUFtQixJQUFJLENBQUosQ0FBbkIsR0FBNEIsQ0FBNUIsR0FBZ0MsQ0FBaEMsQ0FKVztBQUtoQyxnQkFBUSxRQUFRLENBQVIsQ0FBUixHQUFxQixtQkFBbUIsSUFBSSxDQUFKLENBQW5CLEdBQTRCLENBQTVCLEdBQWdDLENBQWhDLENBTFc7QUFNaEMsZ0JBQVEsUUFBUSxDQUFSLENBQVIsR0FBcUIsbUJBQW1CLElBQUksQ0FBSixDQUFuQixHQUE0QixDQUE1QixHQUFnQyxDQUFoQyxDQU5XO0FBT2hDLGdCQUFRLFFBQVEsQ0FBUixDQUFSLEdBQXFCLG1CQUFtQixJQUFJLENBQUosQ0FBbkIsR0FBNEIsQ0FBNUIsR0FBZ0MsQ0FBaEMsQ0FQVztPQUFsQztLQURGOztrRUF2RVMsK0NBb0ZKO0FBQ0gsa0JBQVk7QUFDViwwQkFEVTtBQUVWLHdCQUZVO0FBR1YsNEJBSFU7QUFJVix3QkFKVTtPQUFaO1NBOUVnRTtHQURwRTs7U0FOVzs7O0lBZ0dROzs7QUFDbkIsV0FEbUIsYUFDbkIsQ0FBWSxJQUFaLEVBQWtCOzBCQURDLGVBQ0Q7O2tFQURDLHFDQUVWLFVBQVUsSUFBSSxxQkFBSixDQUEwQixJQUExQixDQUFWLElBQThDLFFBRHJDO0dBQWxCOztTQURtQiIsImZpbGUiOiJ0cnVuY2F0ZWQtY29uZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBHZW9tZXRyeSBmcm9tICcuLi9nZW9tZXRyeSc7XG5pbXBvcnQgTW9kZWwgZnJvbSAnLi4vbW9kZWwnO1xuXG5leHBvcnQgY2xhc3MgVHJ1bmNhdGVkQ29uZUdlb21ldHJ5IGV4dGVuZHMgR2VvbWV0cnkge1xuXG4gIC8vIFByaW1pdGl2ZXMgaW5zcGlyZWQgYnkgVERMIGh0dHA6Ly9jb2RlLmdvb2dsZS5jb20vcC93ZWJnbHNhbXBsZXMvLFxuICAvLyBjb3B5cmlnaHQgMjAxMSBHb29nbGUgSW5jLiBuZXcgQlNEIExpY2Vuc2VcbiAgLy8gKGh0dHA6Ly93d3cub3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvYnNkLWxpY2Vuc2UucGhwKS5cbiAgLyogZXNsaW50LWRpc2FibGUgbWF4LXN0YXRlbWVudHMsIGNvbXBsZXhpdHkgKi9cbiAgY29uc3RydWN0b3Ioe2JvdHRvbVJhZGl1cyA9IDAsIHRvcFJhZGl1cyA9IDAsIGhlaWdodCA9IDEsIG5yYWRpYWwgPSAxMCxcbiAgICBudmVydGljYWwgPSAxMCwgdG9wQ2FwID0gZmFsc2UsIGJvdHRvbUNhcCA9IGZhbHNlLCAuLi5vcHRzfSA9IHt9KSB7XG5cbiAgICBjb25zdCBleHRyYSA9ICh0b3BDYXAgPyAyIDogMCkgKyAoYm90dG9tQ2FwID8gMiA6IDApO1xuICAgIGNvbnN0IG51bVZlcnRpY2VzID0gKG5yYWRpYWwgKyAxKSAqIChudmVydGljYWwgKyAxICsgZXh0cmEpO1xuXG4gICAgY29uc3Qgc2xhbnQgPSBNYXRoLmF0YW4yKGJvdHRvbVJhZGl1cyAtIHRvcFJhZGl1cywgaGVpZ2h0KTtcbiAgICBjb25zdCBtc2luID0gTWF0aC5zaW47XG4gICAgY29uc3QgbWNvcyA9IE1hdGguY29zO1xuICAgIGNvbnN0IG1waSA9IE1hdGguUEk7XG4gICAgY29uc3QgY29zU2xhbnQgPSBtY29zKHNsYW50KTtcbiAgICBjb25zdCBzaW5TbGFudCA9IG1zaW4oc2xhbnQpO1xuICAgIGNvbnN0IHN0YXJ0ID0gdG9wQ2FwID8gLTIgOiAwO1xuICAgIGNvbnN0IGVuZCA9IG52ZXJ0aWNhbCArIChib3R0b21DYXAgPyAyIDogMCk7XG4gICAgY29uc3QgdmVydHNBcm91bmRFZGdlID0gbnJhZGlhbCArIDE7XG5cbiAgICBjb25zdCB2ZXJ0aWNlcyA9IG5ldyBGbG9hdDMyQXJyYXkobnVtVmVydGljZXMgKiAzKTtcbiAgICBjb25zdCBub3JtYWxzID0gbmV3IEZsb2F0MzJBcnJheShudW1WZXJ0aWNlcyAqIDMpO1xuICAgIGNvbnN0IHRleENvb3JkcyA9IG5ldyBGbG9hdDMyQXJyYXkobnVtVmVydGljZXMgKiAyKTtcbiAgICBjb25zdCBpbmRpY2VzID0gbmV3IFVpbnQxNkFycmF5KG5yYWRpYWwgKiAobnZlcnRpY2FsICsgZXh0cmEpICogNik7XG5cbiAgICBsZXQgaTMgPSAwO1xuICAgIGxldCBpMiA9IDA7XG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDw9IGVuZDsgaSsrKSB7XG4gICAgICBsZXQgdiA9IGkgLyBudmVydGljYWw7XG4gICAgICBsZXQgeSA9IGhlaWdodCAqIHY7XG4gICAgICBsZXQgcmluZ1JhZGl1cztcblxuICAgICAgaWYgKGkgPCAwKSB7XG4gICAgICAgIHkgPSAwO1xuICAgICAgICB2ID0gMTtcbiAgICAgICAgcmluZ1JhZGl1cyA9IGJvdHRvbVJhZGl1cztcbiAgICAgIH0gZWxzZSBpZiAoaSA+IG52ZXJ0aWNhbCkge1xuICAgICAgICB5ID0gaGVpZ2h0O1xuICAgICAgICB2ID0gMTtcbiAgICAgICAgcmluZ1JhZGl1cyA9IHRvcFJhZGl1cztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJpbmdSYWRpdXMgPSBib3R0b21SYWRpdXMgK1xuICAgICAgICAgICh0b3BSYWRpdXMgLSBib3R0b21SYWRpdXMpICogKGkgLyBudmVydGljYWwpO1xuICAgICAgfVxuICAgICAgaWYgKGkgPT09IC0yIHx8IGkgPT09IG52ZXJ0aWNhbCArIDIpIHtcbiAgICAgICAgcmluZ1JhZGl1cyA9IDA7XG4gICAgICAgIHYgPSAwO1xuICAgICAgfVxuICAgICAgeSAtPSBoZWlnaHQgLyAyO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB2ZXJ0c0Fyb3VuZEVkZ2U7IGorKykge1xuICAgICAgICBjb25zdCBzaW4gPSBtc2luKGogKiBtcGkgKiAyIC8gbnJhZGlhbCk7XG4gICAgICAgIGNvbnN0IGNvcyA9IG1jb3MoaiAqIG1waSAqIDIgLyBucmFkaWFsKTtcblxuICAgICAgICB2ZXJ0aWNlc1tpMyArIDBdID0gc2luICogcmluZ1JhZGl1cztcbiAgICAgICAgdmVydGljZXNbaTMgKyAxXSA9IHk7XG4gICAgICAgIHZlcnRpY2VzW2kzICsgMl0gPSBjb3MgKiByaW5nUmFkaXVzO1xuXG4gICAgICAgIG5vcm1hbHNbaTMgKyAwXSA9IChpIDwgMCB8fCBpID4gbnZlcnRpY2FsKSA/IDAgOiAoc2luICogY29zU2xhbnQpO1xuICAgICAgICBub3JtYWxzW2kzICsgMV0gPSAoaSA8IDApID8gLTEgOiAoaSA+IG52ZXJ0aWNhbCA/IDEgOiBzaW5TbGFudCk7XG4gICAgICAgIG5vcm1hbHNbaTMgKyAyXSA9IChpIDwgMCB8fCBpID4gbnZlcnRpY2FsKSA/IDAgOiAoY29zICogY29zU2xhbnQpO1xuXG4gICAgICAgIHRleENvb3Jkc1tpMiArIDBdID0gaiAvIG5yYWRpYWw7XG4gICAgICAgIHRleENvb3Jkc1tpMiArIDFdID0gdjtcblxuICAgICAgICBpMiArPSAyO1xuICAgICAgICBpMyArPSAzO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnZlcnRpY2FsICsgZXh0cmE7IGkrKykge1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBucmFkaWFsOyBqKyspIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSAoaSAqIG5yYWRpYWwgKyBqKSAqIDY7XG4gICAgICAgIGluZGljZXNbaW5kZXggKyAwXSA9IHZlcnRzQXJvdW5kRWRnZSAqIChpICsgMCkgKyAwICsgajtcbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDFdID0gdmVydHNBcm91bmRFZGdlICogKGkgKyAwKSArIDEgKyBqO1xuICAgICAgICBpbmRpY2VzW2luZGV4ICsgMl0gPSB2ZXJ0c0Fyb3VuZEVkZ2UgKiAoaSArIDEpICsgMSArIGo7XG4gICAgICAgIGluZGljZXNbaW5kZXggKyAzXSA9IHZlcnRzQXJvdW5kRWRnZSAqIChpICsgMCkgKyAwICsgajtcbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDRdID0gdmVydHNBcm91bmRFZGdlICogKGkgKyAxKSArIDEgKyBqO1xuICAgICAgICBpbmRpY2VzW2luZGV4ICsgNV0gPSB2ZXJ0c0Fyb3VuZEVkZ2UgKiAoaSArIDEpICsgMCArIGo7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc3VwZXIoe1xuICAgICAgLi4ub3B0cyxcbiAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgdmVydGljZXMsXG4gICAgICAgIG5vcm1hbHMsXG4gICAgICAgIHRleENvb3JkcyxcbiAgICAgICAgaW5kaWNlc1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVHJ1bmNhdGVkQ29uZSBleHRlbmRzIE1vZGVsIHtcbiAgY29uc3RydWN0b3Iob3B0cykge1xuICAgIHN1cGVyKHtnZW9tZXRyeTogbmV3IFRydW5jYXRlZENvbmVHZW9tZXRyeShvcHRzKSwgLi4ub3B0c30pO1xuICB9XG59XG4iXX0=