import {AnimationLoop, ClipSpaceQuad} from 'luma.gl';

const CONCENTRICS_FRAGMENT_SHADER = `\
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

const animationLoop = new AnimationLoop({
  onInitialize: ({gl}) => {
    return {clipSpaceQuad: new ClipSpaceQuad(gl, {fs: CONCENTRICS_FRAGMENT_SHADER})};
  },
  onRender: ({gl, canvas, tick, clipSpaceQuad}) => {
    clipSpaceQuad.render({uTime: tick * 0.01});
  }
});

animationLoop.getInfo = () => {
  return `
    <p>
    Fragment shader based rendering.
    <p>
    A luma.gl <code>ClipSpaceQuad</code> rendering 3 lines of fragment shader code,
    using a single uniform <code>uTime</code>.
  `;
};

export default animationLoop;
