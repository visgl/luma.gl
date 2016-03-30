'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
// Default Shaders
var glslify = require('glslify');

// TODO - adopt glslify
var Shaders = {
  Vertex: {
    Default: glslify('./default-vertex')
  },
  Fragment: {
    Default: glslify('./default-fragment')
  }
};

Shaders.vs = Shaders.Vertex.Default;
Shaders.fs = Shaders.Fragment.Default;

exports.default = Shaders;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zaGFkZXJzL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUNBLElBQUksVUFBVSxRQUFRLFNBQVIsQ0FBVjs7O0FBR0osSUFBTSxVQUFVO0FBQ2QsVUFBUTtBQUNOLGFBQVMsUUFBUSxrQkFBUixDQUFUO0dBREY7QUFHQSxZQUFVO0FBQ1IsYUFBUyxRQUFRLG9CQUFSLENBQVQ7R0FERjtDQUpJOztBQVNOLFFBQVEsRUFBUixHQUFhLFFBQVEsTUFBUixDQUFlLE9BQWY7QUFDYixRQUFRLEVBQVIsR0FBYSxRQUFRLFFBQVIsQ0FBaUIsT0FBakI7O2tCQUVFIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gRGVmYXVsdCBTaGFkZXJzXG52YXIgZ2xzbGlmeSA9IHJlcXVpcmUoJ2dsc2xpZnknKTtcblxuLy8gVE9ETyAtIGFkb3B0IGdsc2xpZnlcbmNvbnN0IFNoYWRlcnMgPSB7XG4gIFZlcnRleDoge1xuICAgIERlZmF1bHQ6IGdsc2xpZnkoJy4vZGVmYXVsdC12ZXJ0ZXgnKVxuICB9LFxuICBGcmFnbWVudDoge1xuICAgIERlZmF1bHQ6IGdsc2xpZnkoJy4vZGVmYXVsdC1mcmFnbWVudCcpXG4gIH1cbn07XG5cblNoYWRlcnMudnMgPSBTaGFkZXJzLlZlcnRleC5EZWZhdWx0O1xuU2hhZGVycy5mcyA9IFNoYWRlcnMuRnJhZ21lbnQuRGVmYXVsdDtcblxuZXhwb3J0IGRlZmF1bHQgU2hhZGVycztcblxuIl19