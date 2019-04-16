import {AnimationLoop, ClipSpace} from '@luma.gl/core';

const INFO_HTML = `
<p>
  Fragment shader based rendering.
<p>
A luma.gl <code>ClipSpace</code> rendering 3 lines of fragment shader code,
using a single uniform <code>uTime</code>.
`;

const CONCENTRICS_FRAGMENT_SHADER = `\
precision highp float;

uniform float uTime;

varying vec2 position;

void main(void) {
  float d = length(position * 64.0);
  d = 0.5 * sin(d * sin(uTime)) + 0.5 * sin(position.x * 64.0) * sin(position.y * 64.0);
  gl_FragColor = vec4(1.0-d,0,d, 1);
}
`;

export class AppAnimationLoop extends AnimationLoop {
  onInitialize({gl}) {
    return {
      clipSpace: new ClipSpace(gl, {
        fs: CONCENTRICS_FRAGMENT_SHADER,
        uniforms: {
          uTime: ({tick}) => tick * 0.01
        }
      })
    };
  }

  onRender(animationProps) {
    animationProps.clipSpace.draw({animationProps});
  }

  static getInfo() {
    return INFO_HTML;
  }
}

export const animationLoop = new AppAnimationLoop();
