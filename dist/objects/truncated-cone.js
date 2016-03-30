'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TruncatedConeGeometry = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _geometry = require('../geometry');

var _geometry2 = _interopRequireDefault(_geometry);

var _scenegraph = require('../scenegraph');

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
}(_scenegraph.Model);

exports.default = TruncatedCone;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9vYmplY3RzL3RydW5jYXRlZC1jb25lLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFHYTs7Ozs7Ozs7QUFNWCxXQU5XLHFCQU1YLEdBQ29FO3FFQUFKLGtCQUFJOztpQ0FEdkQsYUFDdUQ7UUFEdkQsaURBQWUsc0JBQ3dDOzhCQURyQyxVQUNxQztRQURyQywyQ0FBWSxtQkFDeUI7MkJBRHRCLE9BQ3NCO1FBRHRCLHFDQUFTLGdCQUNhOzRCQURWLFFBQ1U7UUFEVix1Q0FBVSxrQkFDQTs4QkFBbEUsVUFBa0U7UUFBbEUsMkNBQVksb0JBQXNEOzJCQUFsRCxPQUFrRDtRQUFsRCxxQ0FBUyxvQkFBeUM7OEJBQWxDLFVBQWtDO1FBQWxDLDJDQUFZLHVCQUFzQjs7UUFBWiw4SEFBWTs7MEJBUHpELHVCQU95RDs7QUFFbEUsUUFBTSxRQUFRLENBQUMsU0FBUyxDQUFULEdBQWEsQ0FBYixDQUFELElBQW9CLFlBQVksQ0FBWixHQUFnQixDQUFoQixDQUFwQixDQUZvRDtBQUdsRSxRQUFNLGNBQWMsQ0FBQyxVQUFVLENBQVYsQ0FBRCxJQUFpQixZQUFZLENBQVosR0FBZ0IsS0FBaEIsQ0FBakIsQ0FIOEM7O0FBS2xFLFFBQU0sUUFBUSxLQUFLLEtBQUwsQ0FBVyxlQUFlLFNBQWYsRUFBMEIsTUFBckMsQ0FBUixDQUw0RDtBQU1sRSxRQUFNLE9BQU8sS0FBSyxHQUFMLENBTnFEO0FBT2xFLFFBQU0sT0FBTyxLQUFLLEdBQUwsQ0FQcUQ7QUFRbEUsUUFBTSxNQUFNLEtBQUssRUFBTCxDQVJzRDtBQVNsRSxRQUFNLFdBQVcsS0FBSyxLQUFMLENBQVgsQ0FUNEQ7QUFVbEUsUUFBTSxXQUFXLEtBQUssS0FBTCxDQUFYLENBVjREO0FBV2xFLFFBQU0sUUFBUSxTQUFTLENBQUMsQ0FBRCxHQUFLLENBQWQsQ0FYb0Q7QUFZbEUsUUFBTSxNQUFNLGFBQWEsWUFBWSxDQUFaLEdBQWdCLENBQWhCLENBQWIsQ0Fac0Q7QUFhbEUsUUFBTSxrQkFBa0IsVUFBVSxDQUFWLENBYjBDOztBQWVsRSxRQUFNLFdBQVcsSUFBSSxZQUFKLENBQWlCLGNBQWMsQ0FBZCxDQUE1QixDQWY0RDtBQWdCbEUsUUFBTSxVQUFVLElBQUksWUFBSixDQUFpQixjQUFjLENBQWQsQ0FBM0IsQ0FoQjREO0FBaUJsRSxRQUFNLFlBQVksSUFBSSxZQUFKLENBQWlCLGNBQWMsQ0FBZCxDQUE3QixDQWpCNEQ7QUFrQmxFLFFBQU0sVUFBVSxJQUFJLFdBQUosQ0FBZ0IsV0FBVyxZQUFZLEtBQVosQ0FBWCxHQUFnQyxDQUFoQyxDQUExQixDQWxCNEQ7O0FBb0JsRSxRQUFJLEtBQUssQ0FBTCxDQXBCOEQ7QUFxQmxFLFFBQUksS0FBSyxDQUFMLENBckI4RDtBQXNCbEUsU0FBSyxJQUFJLElBQUksS0FBSixFQUFXLEtBQUssR0FBTCxFQUFVLEdBQTlCLEVBQW1DO0FBQ2pDLFVBQUksSUFBSSxJQUFJLFNBQUosQ0FEeUI7QUFFakMsVUFBSSxJQUFJLFNBQVMsQ0FBVCxDQUZ5QjtBQUdqQyxVQUFJLHNCQUFKLENBSGlDOztBQUtqQyxVQUFJLElBQUksQ0FBSixFQUFPO0FBQ1QsWUFBSSxDQUFKLENBRFM7QUFFVCxZQUFJLENBQUosQ0FGUztBQUdULHFCQUFhLFlBQWIsQ0FIUztPQUFYLE1BSU8sSUFBSSxJQUFJLFNBQUosRUFBZTtBQUN4QixZQUFJLE1BQUosQ0FEd0I7QUFFeEIsWUFBSSxDQUFKLENBRndCO0FBR3hCLHFCQUFhLFNBQWIsQ0FId0I7T0FBbkIsTUFJQTtBQUNMLHFCQUFhLGVBQ1gsQ0FBQyxZQUFZLFlBQVosQ0FBRCxJQUE4QixJQUFJLFNBQUosQ0FBOUIsQ0FGRztPQUpBO0FBUVAsVUFBSSxNQUFNLENBQUMsQ0FBRCxJQUFNLE1BQU0sWUFBWSxDQUFaLEVBQWU7QUFDbkMscUJBQWEsQ0FBYixDQURtQztBQUVuQyxZQUFJLENBQUosQ0FGbUM7T0FBckM7QUFJQSxXQUFLLFNBQVMsQ0FBVCxDQXJCNEI7QUFzQmpDLFdBQUssSUFBSSxJQUFJLENBQUosRUFBTyxJQUFJLGVBQUosRUFBcUIsR0FBckMsRUFBMEM7QUFDeEMsWUFBTSxNQUFNLEtBQUssSUFBSSxHQUFKLEdBQVUsQ0FBVixHQUFjLE9BQWQsQ0FBWCxDQURrQztBQUV4QyxZQUFNLE1BQU0sS0FBSyxJQUFJLEdBQUosR0FBVSxDQUFWLEdBQWMsT0FBZCxDQUFYLENBRmtDOztBQUl4QyxpQkFBUyxLQUFLLENBQUwsQ0FBVCxHQUFtQixNQUFNLFVBQU4sQ0FKcUI7QUFLeEMsaUJBQVMsS0FBSyxDQUFMLENBQVQsR0FBbUIsQ0FBbkIsQ0FMd0M7QUFNeEMsaUJBQVMsS0FBSyxDQUFMLENBQVQsR0FBbUIsTUFBTSxVQUFOLENBTnFCOztBQVF4QyxnQkFBUSxLQUFLLENBQUwsQ0FBUixHQUFrQixDQUFDLEdBQUksQ0FBSixJQUFTLElBQUksU0FBSixHQUFpQixDQUEzQixHQUFnQyxNQUFNLFFBQU4sQ0FSVjtBQVN4QyxnQkFBUSxLQUFLLENBQUwsQ0FBUixHQUFrQixDQUFDLEdBQUksQ0FBSixHQUFTLENBQUMsQ0FBRCxHQUFNLElBQUksU0FBSixHQUFnQixDQUFoQixHQUFvQixRQUFwQixDQVRNO0FBVXhDLGdCQUFRLEtBQUssQ0FBTCxDQUFSLEdBQWtCLENBQUMsR0FBSSxDQUFKLElBQVMsSUFBSSxTQUFKLEdBQWlCLENBQTNCLEdBQWdDLE1BQU0sUUFBTixDQVZWOztBQVl4QyxrQkFBVSxLQUFLLENBQUwsQ0FBVixHQUFvQixJQUFJLE9BQUosQ0Fab0I7QUFheEMsa0JBQVUsS0FBSyxDQUFMLENBQVYsR0FBb0IsQ0FBcEIsQ0Fid0M7O0FBZXhDLGNBQU0sQ0FBTixDQWZ3QztBQWdCeEMsY0FBTSxDQUFOLENBaEJ3QztPQUExQztLQXRCRjs7QUEwQ0EsU0FBSyxJQUFJLElBQUksQ0FBSixFQUFPLElBQUksWUFBWSxLQUFaLEVBQW1CLEdBQXZDLEVBQTRDO0FBQzFDLFdBQUssSUFBSSxJQUFJLENBQUosRUFBTyxJQUFJLE9BQUosRUFBYSxHQUE3QixFQUFrQztBQUNoQyxZQUFNLFFBQVEsQ0FBQyxJQUFJLE9BQUosR0FBYyxDQUFkLENBQUQsR0FBb0IsQ0FBcEIsQ0FEa0I7QUFFaEMsZ0JBQVEsUUFBUSxDQUFSLENBQVIsR0FBcUIsbUJBQW1CLElBQUksQ0FBSixDQUFuQixHQUE0QixDQUE1QixHQUFnQyxDQUFoQyxDQUZXO0FBR2hDLGdCQUFRLFFBQVEsQ0FBUixDQUFSLEdBQXFCLG1CQUFtQixJQUFJLENBQUosQ0FBbkIsR0FBNEIsQ0FBNUIsR0FBZ0MsQ0FBaEMsQ0FIVztBQUloQyxnQkFBUSxRQUFRLENBQVIsQ0FBUixHQUFxQixtQkFBbUIsSUFBSSxDQUFKLENBQW5CLEdBQTRCLENBQTVCLEdBQWdDLENBQWhDLENBSlc7QUFLaEMsZ0JBQVEsUUFBUSxDQUFSLENBQVIsR0FBcUIsbUJBQW1CLElBQUksQ0FBSixDQUFuQixHQUE0QixDQUE1QixHQUFnQyxDQUFoQyxDQUxXO0FBTWhDLGdCQUFRLFFBQVEsQ0FBUixDQUFSLEdBQXFCLG1CQUFtQixJQUFJLENBQUosQ0FBbkIsR0FBNEIsQ0FBNUIsR0FBZ0MsQ0FBaEMsQ0FOVztBQU9oQyxnQkFBUSxRQUFRLENBQVIsQ0FBUixHQUFxQixtQkFBbUIsSUFBSSxDQUFKLENBQW5CLEdBQTRCLENBQTVCLEdBQWdDLENBQWhDLENBUFc7T0FBbEM7S0FERjs7a0VBdkVTLCtDQW9GSjtBQUNILGtCQUFZO0FBQ1YsMEJBRFU7QUFFVix3QkFGVTtBQUdWLDRCQUhVO0FBSVYsd0JBSlU7T0FBWjtTQTlFZ0U7R0FEcEU7O1NBTlc7OztJQWdHUTs7O0FBQ25CLFdBRG1CLGFBQ25CLENBQVksSUFBWixFQUFrQjswQkFEQyxlQUNEOztrRUFEQyxxQ0FFVixVQUFVLElBQUkscUJBQUosQ0FBMEIsSUFBMUIsQ0FBVixJQUE4QyxRQURyQztHQUFsQjs7U0FEbUIiLCJmaWxlIjoidHJ1bmNhdGVkLWNvbmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgR2VvbWV0cnkgZnJvbSAnLi4vZ2VvbWV0cnknO1xuaW1wb3J0IHtNb2RlbH0gZnJvbSAnLi4vc2NlbmVncmFwaCc7XG5cbmV4cG9ydCBjbGFzcyBUcnVuY2F0ZWRDb25lR2VvbWV0cnkgZXh0ZW5kcyBHZW9tZXRyeSB7XG5cbiAgLy8gUHJpbWl0aXZlcyBpbnNwaXJlZCBieSBUREwgaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL3dlYmdsc2FtcGxlcy8sXG4gIC8vIGNvcHlyaWdodCAyMDExIEdvb2dsZSBJbmMuIG5ldyBCU0QgTGljZW5zZVxuICAvLyAoaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9ic2QtbGljZW5zZS5waHApLlxuICAvKiBlc2xpbnQtZGlzYWJsZSBtYXgtc3RhdGVtZW50cywgY29tcGxleGl0eSAqL1xuICBjb25zdHJ1Y3Rvcih7Ym90dG9tUmFkaXVzID0gMCwgdG9wUmFkaXVzID0gMCwgaGVpZ2h0ID0gMSwgbnJhZGlhbCA9IDEwLFxuICAgIG52ZXJ0aWNhbCA9IDEwLCB0b3BDYXAgPSBmYWxzZSwgYm90dG9tQ2FwID0gZmFsc2UsIC4uLm9wdHN9ID0ge30pIHtcblxuICAgIGNvbnN0IGV4dHJhID0gKHRvcENhcCA/IDIgOiAwKSArIChib3R0b21DYXAgPyAyIDogMCk7XG4gICAgY29uc3QgbnVtVmVydGljZXMgPSAobnJhZGlhbCArIDEpICogKG52ZXJ0aWNhbCArIDEgKyBleHRyYSk7XG5cbiAgICBjb25zdCBzbGFudCA9IE1hdGguYXRhbjIoYm90dG9tUmFkaXVzIC0gdG9wUmFkaXVzLCBoZWlnaHQpO1xuICAgIGNvbnN0IG1zaW4gPSBNYXRoLnNpbjtcbiAgICBjb25zdCBtY29zID0gTWF0aC5jb3M7XG4gICAgY29uc3QgbXBpID0gTWF0aC5QSTtcbiAgICBjb25zdCBjb3NTbGFudCA9IG1jb3Moc2xhbnQpO1xuICAgIGNvbnN0IHNpblNsYW50ID0gbXNpbihzbGFudCk7XG4gICAgY29uc3Qgc3RhcnQgPSB0b3BDYXAgPyAtMiA6IDA7XG4gICAgY29uc3QgZW5kID0gbnZlcnRpY2FsICsgKGJvdHRvbUNhcCA/IDIgOiAwKTtcbiAgICBjb25zdCB2ZXJ0c0Fyb3VuZEVkZ2UgPSBucmFkaWFsICsgMTtcblxuICAgIGNvbnN0IHZlcnRpY2VzID0gbmV3IEZsb2F0MzJBcnJheShudW1WZXJ0aWNlcyAqIDMpO1xuICAgIGNvbnN0IG5vcm1hbHMgPSBuZXcgRmxvYXQzMkFycmF5KG51bVZlcnRpY2VzICogMyk7XG4gICAgY29uc3QgdGV4Q29vcmRzID0gbmV3IEZsb2F0MzJBcnJheShudW1WZXJ0aWNlcyAqIDIpO1xuICAgIGNvbnN0IGluZGljZXMgPSBuZXcgVWludDE2QXJyYXkobnJhZGlhbCAqIChudmVydGljYWwgKyBleHRyYSkgKiA2KTtcblxuICAgIGxldCBpMyA9IDA7XG4gICAgbGV0IGkyID0gMDtcbiAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPD0gZW5kOyBpKyspIHtcbiAgICAgIGxldCB2ID0gaSAvIG52ZXJ0aWNhbDtcbiAgICAgIGxldCB5ID0gaGVpZ2h0ICogdjtcbiAgICAgIGxldCByaW5nUmFkaXVzO1xuXG4gICAgICBpZiAoaSA8IDApIHtcbiAgICAgICAgeSA9IDA7XG4gICAgICAgIHYgPSAxO1xuICAgICAgICByaW5nUmFkaXVzID0gYm90dG9tUmFkaXVzO1xuICAgICAgfSBlbHNlIGlmIChpID4gbnZlcnRpY2FsKSB7XG4gICAgICAgIHkgPSBoZWlnaHQ7XG4gICAgICAgIHYgPSAxO1xuICAgICAgICByaW5nUmFkaXVzID0gdG9wUmFkaXVzO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmluZ1JhZGl1cyA9IGJvdHRvbVJhZGl1cyArXG4gICAgICAgICAgKHRvcFJhZGl1cyAtIGJvdHRvbVJhZGl1cykgKiAoaSAvIG52ZXJ0aWNhbCk7XG4gICAgICB9XG4gICAgICBpZiAoaSA9PT0gLTIgfHwgaSA9PT0gbnZlcnRpY2FsICsgMikge1xuICAgICAgICByaW5nUmFkaXVzID0gMDtcbiAgICAgICAgdiA9IDA7XG4gICAgICB9XG4gICAgICB5IC09IGhlaWdodCAvIDI7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHZlcnRzQXJvdW5kRWRnZTsgaisrKSB7XG4gICAgICAgIGNvbnN0IHNpbiA9IG1zaW4oaiAqIG1waSAqIDIgLyBucmFkaWFsKTtcbiAgICAgICAgY29uc3QgY29zID0gbWNvcyhqICogbXBpICogMiAvIG5yYWRpYWwpO1xuXG4gICAgICAgIHZlcnRpY2VzW2kzICsgMF0gPSBzaW4gKiByaW5nUmFkaXVzO1xuICAgICAgICB2ZXJ0aWNlc1tpMyArIDFdID0geTtcbiAgICAgICAgdmVydGljZXNbaTMgKyAyXSA9IGNvcyAqIHJpbmdSYWRpdXM7XG5cbiAgICAgICAgbm9ybWFsc1tpMyArIDBdID0gKGkgPCAwIHx8IGkgPiBudmVydGljYWwpID8gMCA6IChzaW4gKiBjb3NTbGFudCk7XG4gICAgICAgIG5vcm1hbHNbaTMgKyAxXSA9IChpIDwgMCkgPyAtMSA6IChpID4gbnZlcnRpY2FsID8gMSA6IHNpblNsYW50KTtcbiAgICAgICAgbm9ybWFsc1tpMyArIDJdID0gKGkgPCAwIHx8IGkgPiBudmVydGljYWwpID8gMCA6IChjb3MgKiBjb3NTbGFudCk7XG5cbiAgICAgICAgdGV4Q29vcmRzW2kyICsgMF0gPSBqIC8gbnJhZGlhbDtcbiAgICAgICAgdGV4Q29vcmRzW2kyICsgMV0gPSB2O1xuXG4gICAgICAgIGkyICs9IDI7XG4gICAgICAgIGkzICs9IDM7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudmVydGljYWwgKyBleHRyYTsgaSsrKSB7XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IG5yYWRpYWw7IGorKykge1xuICAgICAgICBjb25zdCBpbmRleCA9IChpICogbnJhZGlhbCArIGopICogNjtcbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDBdID0gdmVydHNBcm91bmRFZGdlICogKGkgKyAwKSArIDAgKyBqO1xuICAgICAgICBpbmRpY2VzW2luZGV4ICsgMV0gPSB2ZXJ0c0Fyb3VuZEVkZ2UgKiAoaSArIDApICsgMSArIGo7XG4gICAgICAgIGluZGljZXNbaW5kZXggKyAyXSA9IHZlcnRzQXJvdW5kRWRnZSAqIChpICsgMSkgKyAxICsgajtcbiAgICAgICAgaW5kaWNlc1tpbmRleCArIDNdID0gdmVydHNBcm91bmRFZGdlICogKGkgKyAwKSArIDAgKyBqO1xuICAgICAgICBpbmRpY2VzW2luZGV4ICsgNF0gPSB2ZXJ0c0Fyb3VuZEVkZ2UgKiAoaSArIDEpICsgMSArIGo7XG4gICAgICAgIGluZGljZXNbaW5kZXggKyA1XSA9IHZlcnRzQXJvdW5kRWRnZSAqIChpICsgMSkgKyAwICsgajtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBzdXBlcih7XG4gICAgICAuLi5vcHRzLFxuICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICB2ZXJ0aWNlcyxcbiAgICAgICAgbm9ybWFscyxcbiAgICAgICAgdGV4Q29vcmRzLFxuICAgICAgICBpbmRpY2VzXG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUcnVuY2F0ZWRDb25lIGV4dGVuZHMgTW9kZWwge1xuICBjb25zdHJ1Y3RvcihvcHRzKSB7XG4gICAgc3VwZXIoe2dlb21ldHJ5OiBuZXcgVHJ1bmNhdGVkQ29uZUdlb21ldHJ5KG9wdHMpLCAuLi5vcHRzfSk7XG4gIH1cbn1cbiJdfQ==