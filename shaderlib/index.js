// Default Shaders
const glslify = require('glslify');

// TODO - adopt glslify
const Shaders = {
  Vertex: {
    Default: glslify('./default-vertex.glsl')
  },
  Fragment: {
    Default: glslify('./default-fragment.glsl')
  }
};

Shaders.vs = Shaders.Vertex.Default;
Shaders.fs = Shaders.Fragment.Default;

export default Shaders;
