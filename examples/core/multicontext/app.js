import {AnimationLoop, createGLContext, ClipSpaceQuad} from 'luma.gl';

// CONTEXT 0 - CONCENTRICS

const CONTEXT_0_FRAGMENT_SHADER = `\
#ifdef GL_ES
precision highp float;
#endif

uniform float uTime;

varying vec2 position;

void main(void) {
  float d = length(position * 64.0);
  d = 0.5 * sin(d * sin(uTime)) + 0.5 * sin(position.x * 64.0) * sin(position.y * 64.0);
  gl_FragColor = vec4(1.0-d,0,d, 1);
}
`;

const animationFrame2 = new AnimationLoop()
.context(() => createGLContext({canvas: 'canvas-0'}))
.init(({gl}) => ({
  clipSpaceQuad: new ClipSpaceQuad({gl, fs: CONTEXT_0_FRAGMENT_SHADER})
}))
.setupFrame(({gl, canvas}) => {
  canvas.width = canvas.clientWidth;
  canvas.style.height = `${canvas.width}px`;
  canvas.height = canvas.width;
  gl.viewport(0, 0, canvas.width, canvas.height);
})
.frame(({tick, clipSpaceQuad}) => {
  clipSpaceQuad.render({uTime: tick * 0.01});
});

// CONTEXT 1 - RANDOM NOISE

const CONTEXT_1_FRAGMENT_SHADER = `\
#ifdef GL_ES
precision highp float;
#endif

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

const animationFrame1 = new AnimationLoop()
.context(() => createGLContext({canvas: 'canvas-1'}))
.init(({gl}) => ({
  clipSpaceQuad: new ClipSpaceQuad({gl, fs: CONTEXT_1_FRAGMENT_SHADER})
}))
.setupFrame(({gl, canvas}) => {
  canvas.width = canvas.clientWidth;
  canvas.style.height = `${canvas.width}px`;
  canvas.height = canvas.width;
  gl.viewport(0, 0, canvas.width, canvas.height);
})
.frame(({tick, clipSpaceQuad}) => {
  clipSpaceQuad.render({uTime: tick * 0.01});
});

export default animationFrame1;

/* global window */
if (typeof window !== 'undefined') {
  window.startApp = function startApp() {
    animationFrame1.start();
    animationFrame2.start();
  };
}
