import GL from '@luma.gl/constants';
import {AnimationLoop, Cube, Texture2D, setParameters} from 'luma.gl';
import {Matrix4} from 'math.gl';

const INFO_HTML = `
<p>
  <a href="http://learningwebgl.com/blog/?p=507" target="_blank">
    Introducing Textures
  </a>
<p>
The classic WebGL Lessons in luma.gl
`;

const VERTEX_SHADER = `\
attribute vec3 positions;
attribute vec2 texCoords;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

varying vec2 vTextureCoord;
void main(void) {
  gl_Position = uPMatrix * uMVMatrix * vec4(positions, 1.0);
  vTextureCoord = texCoords;
}
`;

const FRAGMENT_SHADER = `\
precision highp float;

varying vec2 vTextureCoord;

uniform sampler2D uSampler;

void main(void) {
  gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
}
`;

const animationLoop = new AnimationLoop({
  // .context(() => createGLContext({canvas: 'lesson05-canvas'}))
  onInitialize({gl}) {

    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      clearDepth: 1,
      depthTest: true,
      depthFunc: GL.LEQUAL,
      [GL.UNPACK_FLIP_Y_WEBGL]: true
    });

    return {
      cube: new Cube(gl, {
        vs: VERTEX_SHADER,
        fs: FRAGMENT_SHADER,
        uniforms: {
          uSampler: new Texture2D(gl, 'nehe.gif')
        }
      })
    };
  },
  onRender({gl, tick, aspect, cube}) {
    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    return cube.render({
      uPMatrix: new Matrix4().perspective({aspect}),
      uMVMatrix: new Matrix4()
        .lookAt({eye: [0, 0, 0]})
        .translate([0, 0, -5])
        .rotateXYZ([tick * 0.01, tick * 0.01, tick * 0.01])
    });
  }
});

animationLoop.getInfo = () => INFO_HTML;

export default animationLoop;

/* global window */
if (!window.website) {
  animationLoop.start();
}
