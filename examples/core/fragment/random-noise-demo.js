// RANDOM NOISE

import {AnimationLoop, createGLContext, ClipSpace} from '@luma.gl/core';

const RANDOM_NOISE_FRAGMENT_SHADER = `\
precision highp float;

highp float random(vec2 co) {
    highp float a = 12.9898;
    highp float b = 78.233;
    highp float c = 43758.5453;
    highp float dt= dot(co.xy ,vec2(a,b));
    highp float sn= mod(dt,3.14);
    return fract(sin(sn) * c);
}

uniform float uTime;

varying vec2 position;

void main(void) {
  float r = random(position + sin(uTime * 0.01));
  gl_FragColor = vec4(r,r,r, 1);
}
`;

export default new AnimationLoop({
  onContext: () => createGLContext({canvas: 'canvas-1'}),
  onInitialize: ({gl}) => ({
    clipSpaceQuad: new ClipSpace({gl, fs: RANDOM_NOISE_FRAGMENT_SHADER})
  }),
  onRender: ({gl, canvas, tick, clipSpaceQuad}) => {
    canvas.width = canvas.clientWidth;
    canvas.style.height = `${canvas.width}px`;
    canvas.height = canvas.width;
    gl.viewport(0, 0, canvas.width, canvas.height);

    clipSpaceQuad.setUniforms({uTime: tick * 0.01}).draw();
  }
});
