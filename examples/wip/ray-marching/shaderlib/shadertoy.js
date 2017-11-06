// A module that injects fragment shader uniforms provided by shadertoy
// allowing www.shadertoy.com shaders to run directly in luma.gl
//
// Designed so that many uniforms can be automatically picked up from the
// AnimationLoop class context.
//
// TODO - shadertoy offers many more uniforms

const fs = `\
uniform vec2 iMouse;
uniform vec2 iResolution;
uniform float iTime;
`;

const DEFAULT_MODULE_OPTIONS = {
  time: 11110,
  mouse: [NaN, NaN],
  width: 500,
  height: 500
};

function getUniforms(opts = DEFAULT_MODULE_OPTIONS) {
  const uniforms = {};
  if (opts.time !== undefined) {
  	uniforms.iTime = opts.time;
  } else if (opts.tick) {
  	uniforms.iTime = opts.tick / 6;
  }
  if (opts.mouse !== undefined) {
  	uniforms.iMouse = opts.mouse;
  }
  if (opts.resolution !== undefined) {
  	uniforms.iResolution = opts.resolution;
  } else if (opts.width !== undefined && opts.height !== undefined) {
  	uniforms.iResolution = [opts.width, opts.height];
  	uniforms.iMouse = [opts.width / 4, opts.height / 4];
  }
  return uniforms;
}

export default {
  name: 'shadertoy',
  vs: null,
  fs,
  getUniforms
};
