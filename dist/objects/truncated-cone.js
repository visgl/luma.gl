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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9vYmplY3RzL3RydW5jYXRlZC1jb25lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7Ozs7Ozs7Ozs7O0lBRWE7Ozs7Ozs7O0FBTVgsV0FOVyxxQkFNWCxHQUNvRTtxRUFBSixrQkFBSTs7aUNBRHZELGFBQ3VEO1FBRHZELGlEQUFlLHNCQUN3Qzs4QkFEckMsVUFDcUM7UUFEckMsMkNBQVksbUJBQ3lCOzJCQUR0QixPQUNzQjtRQUR0QixxQ0FBUyxnQkFDYTs0QkFEVixRQUNVO1FBRFYsdUNBQVUsa0JBQ0E7OEJBQWxFLFVBQWtFO1FBQWxFLDJDQUFZLG9CQUFzRDsyQkFBbEQsT0FBa0Q7UUFBbEQscUNBQVMsb0JBQXlDOzhCQUFsQyxVQUFrQztRQUFsQywyQ0FBWSx1QkFBc0I7O1FBQVosOEhBQVk7OzBCQVB6RCx1QkFPeUQ7O0FBRWxFLFFBQU0sUUFBUSxDQUFDLFNBQVMsQ0FBVCxHQUFhLENBQWIsQ0FBRCxJQUFvQixZQUFZLENBQVosR0FBZ0IsQ0FBaEIsQ0FBcEIsQ0FGb0Q7QUFHbEUsUUFBTSxjQUFjLENBQUMsVUFBVSxDQUFWLENBQUQsSUFBaUIsWUFBWSxDQUFaLEdBQWdCLEtBQWhCLENBQWpCLENBSDhDOztBQUtsRSxRQUFNLFFBQVEsS0FBSyxLQUFMLENBQVcsZUFBZSxTQUFmLEVBQTBCLE1BQXJDLENBQVIsQ0FMNEQ7QUFNbEUsUUFBTSxPQUFPLEtBQUssR0FBTCxDQU5xRDtBQU9sRSxRQUFNLE9BQU8sS0FBSyxHQUFMLENBUHFEO0FBUWxFLFFBQU0sTUFBTSxLQUFLLEVBQUwsQ0FSc0Q7QUFTbEUsUUFBTSxXQUFXLEtBQUssS0FBTCxDQUFYLENBVDREO0FBVWxFLFFBQU0sV0FBVyxLQUFLLEtBQUwsQ0FBWCxDQVY0RDtBQVdsRSxRQUFNLFFBQVEsU0FBUyxDQUFDLENBQUQsR0FBSyxDQUFkLENBWG9EO0FBWWxFLFFBQU0sTUFBTSxhQUFhLFlBQVksQ0FBWixHQUFnQixDQUFo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WUFBTSxRQUFRLENBQUMsS0FBSSxPQUFKLEdBQWMsRUFBZCxDQUFELEdBQW9CLENBQXBCLENBRGtCO0FBRWhDLGdCQUFRLFFBQVEsQ0FBUixDQUFSLEdBQXFCLG1CQUFtQixLQUFJLENBQUosQ0FBbkIsR0FBNEIsQ0FBNUIsR0FBZ0MsRUFBaEMsQ0FGVztBQUdoQyxnQkFBUSxRQUFRLENBQVIsQ0FBUixHQUFxQixtQkFBbUIsS0FBSSxDQUFKLENBQW5CLEdBQTRCLENBQTVCLEdBQWdDLEVBQWhDLENBSFc7QUFJaEMsZ0JBQVEsUUFBUSxDQUFSLENBQVIsR0FBcUIsbUJBQW1CLEtBQUksQ0FBSixDQUFuQixHQUE0QixDQUE1QixHQUFnQyxFQUFoQyxDQUpXO0FBS2hDLGdCQUFRLFFBQVEsQ0FBUixDQUFSLEdBQXFCLG1CQUFtQixLQUFJLENBQUosQ0FBbkIsR0FBNEIsQ0FBNUIsR0FBZ0MsRUFBaEMsQ0FMVztBQU1oQyxnQkFBUSxRQUFRLENBQVIsQ0FBUixHQUFxQixtQkFBbUIsS0FBSSxDQUFKLENBQW5CLEdBQTRCLENBQTVCLEdBQWdDLEVBQWhDLENBTlc7QUFPaEMsZ0JBQVEsUUFBUSxDQUFSLENBQVIsR0FBcUIsbUJBQW1CLEtBQUksQ0FBSixDQUFuQixHQUE0QixDQUE1QixHQUFnQyxFQUFoQyxDQVBXO09BQWxDO0tBREY7O2tFQXZFUywrQ0FvRko7QUFDSCxrQkFBWTtBQUNWLDBCQURVO0FBRVYsd0JBRlU7QUFHViw0QkFIVTtBQUlWLHdCQUpVO09BQVo7U0E5RWdFO0dBRHBFOztTQU5XOzs7SUFnR1E7OztBQUNuQixXQURtQixhQUNuQixDQUFZLElBQVosRUFBa0I7MEJBREMsZUFDRDs7a0VBREMscUNBRVYsVUFBVSxJQUFJLHFCQUFKLENBQTBCLElBQTFCLENBQVYsSUFBOEMsUUFEckM7R0FBbEI7O1NBRG1CIiwiZmlsZSI6InRydW5jYXRlZC1jb25lLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEdlb21ldHJ5IGZyb20gJy4uL2dlb21ldHJ5JztcbmltcG9ydCBNb2RlbCBmcm9tICcuLi9tb2RlbCc7XG5cbmV4cG9ydCBjbGFzcyBUcnVuY2F0ZWRDb25lR2VvbWV0cnkgZXh0ZW5kcyBHZW9tZXRyeSB7XG5cbiAgLy8gUHJpbWl0aXZlcyBpbnNwaXJlZCBieSBUREwgaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL3dlYmdsc2FtcGxlcy8sXG4gIC8vIGNvcHlyaWdodCAyMDExIEdvb2dsZSBJbmMuIG5ldyBCU0QgTGljZW5zZVxuICAvLyAoaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9ic2QtbGljZW5zZS5waHApLlxuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cywgY29tcGxleGl0eSAqL1xuICBjb25zdHJ1Y3Rvcih7Ym90dG9tUmFkaXVzID0gMCwgdG9wUmFkaXVzID0gMCwgaGVpZ2h0ID0gMSwgbnJhZGlhbCA9IDEwLFxuICAgIG52ZXJ0aWNhbCA9IDEwLCB0b3BDYXAgPSBmYWxzZSwgYm90dG9tQ2FwID0gZmFsc2UsIC4uLm9wdHN9ID0ge30pIHtcblxuICAgIGNvbnN0IGV4dHJhID0gKHRvcENhcCA/IDIgOiAwKSArIChib3R0b21DYXAgPyAyIDogMCk7XG4gICAgY29uc3QgbnVtVmVydGljZXMgPSAobnJhZGlhbCArIDEpICogKG52ZXJ0aWNhbCArIDEgKyBleHRyYSk7XG5cbiAgICBjb25zdCBzbGFudCA9IE1hdGguYXRhbjIoYm90dG9tUmFkaXVzIC0gdG9wUmFkaXVzLCBoZWlnaHQpO1xuICAgIGNvbnN0IG1zaW4gPSBNYXRoLnNpbjtcbiAgICBjb25zdCBtY29zID0gTWF0aC5jb3M7XG4gICAgY29uc3QgbXBpID0gTWF0aC5QSTtcbiAgICBjb25zdCBjb3NTbGFudCA9IG1jb3Moc2xhbnQpO1xuICAgIGNvbnN0IHNpblNsYW50ID0gbXNpbihzbGFudCk7XG4gICAgY29uc3Qgc3RhcnQgPSB0b3BDYXAgPyAtMiA6IDA7XG4gICAgY29uc3QgZW5kID0gbnZlcnRpY2FsICsgKGJvdHRvbUNhcCA/IDIgOiAwKTtcbiAgICBjb25zdCB2ZXJ0c0Fyb3VuZEVkZ2UgPSBucmFkaWFsICsgMTtcblxuICAgIGNvbnN0IHZlcnRpY2VzID0gbmV3IEZsb2F0MzJBcnJheShudW1WZXJ0aWNlcyAqIDMpO1xuICAgIGNvbnN0IG5vcm1hbHMgPSBuZXcgRmxvYXQzMkFycmF5KG51bVZlcnRpY2VzICogMyk7XG4gICAgY29uc3QgdGV4Q29vcmRzID0gbmV3IEZsb2F0MzJBcnJheShudW1WZXJ0aWNlcyAqIDIpO1xuICAgIGNvbnN0IGluZGljZXMgPSBuZXcgVWludDE2QXJyYXkobnJhZGlhbCAqIChudmVydGljYWwgKyBleHRyYSkgKiA2KTtcblxuICAgIGxldCBpMyA9IDA7XG4gICAgbGV0IGkyID0gMDtcbiAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPD0gZW5kOyBpKyspIHtcbiAgICAgIGxldCB2ID0gaSAvIG52ZXJ0aWNhbDtcbiAgICAgIGxldCB5ID0gaGVpZ2h0ICogdjtcbiAgICAgIGxldCByaW5nUmFkaXVzO1xuXG4gICAgICBpZiAoaSA8IDApIHtcbiAgICAgICAgeSA9IDA7XG4gICAgICAgIHYgPSAxO1xuICAgICAgICByaW5nUmFkaXVzID0gYm90dG9tUmFkaXVzO1xuICAgICAgfSBlbHNlIGlmIChpID4gbnZlcnRpY2FsKSB7XG4gICAgICAgIHkgPSBoZWlnaHQ7XG4gICAgICAgIHYgPSAxO1xuICAgICAgICByaW5nUmFkaXVzID0gdG9wUmFkaXVzO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmluZ1JhZGl1cyA9IGJvdHRvbVJhZGl1cyArXG4gICAgICAgICAgKHRvcFJhZGl1cyAtIGJvdHRvbVJhZGl1cykgKiAoaSAvIG52ZXJ0aWNhbCk7XG4gICAgICB9XG4gICAgICBpZiAoaSA9PT0gLTIgfHwgaSA9PT0gbnZlcnRpY2FsICsgMikge1xuICAgICAgICByaW5nUmFkaXVzID0gMDtcbiAgICAgICAgdiA9IDA7XG4gICAgICB9XG4gICAgICB5IC09IGhlaWdodCAvIDI7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHZlcnRzQXJvdW5kRWRnZTsgaisrKSB7XG4gICAgICAgIGNvbnN0IHNpbiA9IG1zaW4oaiAqIG1waSAqIDIgLyBucmFkaWFsKTtcbiAgICAgICAgY29uc3QgY29zID0gbWNvcyhqICogbXBpICogMiAvIG5yYWRpYWwpO1xuXG4gICAgICAgIHZlcnRpY2VzW2kzICsgMF0gPSBzaW4gKiByaW5nUmFkaXVzO1xuICAgICAgICB2ZXJ0aWNlc1tpMyArIDFdID0geTtcbiAgICAgICAgdmVydGljZXNbaTMgKyAyXSA9IGNvcyAqIHJpbmdSYWRpdXM7XG5cbiAgICAgICAgbm9ybWFsc1tpMyArIDBdID0gKGkgPCAwIHx8IGkgPiBudmVydGljYWwpID8gMCA6IChzaW4gKiBjb3NTbGFudCk7XG4gICAgICAgIG5vcm1hbHNbaTMgKyAxXSA9IChpIDwgMCkgPyAtMSA6IChpID4gbnZlcnRpY2FsID8gMSA6IHNpblNsYW50KTtcbiAgICAgICAgbm9ybWFsc1tpMyArIDJdID0gKGkgPCAwIHx8IGkgPiBudmVydGljYWwpID8gMCA6IChjb3MgKiBjb3NTbGFudCk7XG5cbiAgICAgICAgdGV4Q29vcmRzW2kyICsgMF0gPSBqIC8gbnJhZGlhbDtcbiAgICAgICAgdGV4Q29vcmRzW2kyICsgMV0gPSB2O1xuXG4gICAgICAgIGkyICs9IDI7XG4gICAgICAgIGkzICs9IDM7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudmVydGljYWwgKyBleHRyYTsgaSsrKSB7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IG5yYWRpYWw7IGorKykge1xuICAgICAgICBjb25zdCBpbmRleCA9IChpICogbnJhZGlhbCArIGopICogNjtcbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDBdID0gdmVydHNBcm91bmRFZGdlICogKGkgKyAwKSArIDAgKyBqO1xuICAgICAgICBpbmRpY2VzW2luZGV4ICsgMV0gPSB2ZXJ0c0Fyb3VuZEVkZ2UgKiAoaSArIDApICsgMSArIGo7XG4gICAgICAgIGluZGljZXNbaW5kZXggKyAyXSA9IHZlcnRzQXJvdW5kRWRnZSAqIChpICsgMSkgKyAxICsgajtcbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDNdID0gdmVydHNBcm91bmRFZGdlICogKGkgKyAwKSArIDAgKyBqO1xuICAgICAgICBpbmRpY2VzW2luZGV4ICsgNF0gPSB2ZXJ0c0Fyb3VuZEVkZ2UgKiAoaSArIDEpICsgMSArIGo7XG4gICAgICAgIGluZGljZXNbaW5kZXggKyA1XSA9IHZlcnRzQXJvdW5kRWRnZSAqIChpICsgMSkgKyAwICsgajtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBzdXBlcih7XG4gICAgICAuLi5vcHRzLFxuICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICB2ZXJ0aWNlcyxcbiAgICAgICAgbm9ybWFscyxcbiAgICAgICAgdGV4Q29vcmRzLFxuICAgICAgICBpbmRpY2VzXG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUcnVuY2F0ZWRDb25lIGV4dGVuZHMgTW9kZWwge1xuICBjb25zdHJ1Y3RvcihvcHRzKSB7XG4gICAgc3VwZXIoe2dlb21ldHJ5OiBuZXcgVHJ1bmNhdGVkQ29uZUdlb21ldHJ5KG9wdHMpLCAuLi5vcHRzfSk7XG4gIH1cbn1cbiJdfQ==