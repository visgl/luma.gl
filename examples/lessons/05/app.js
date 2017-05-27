/* eslint-disable no-var, max-statements, indent, no-multi-spaces */
import {GL, AnimationLoop, loadTextures, Cube, Matrix4} from 'luma.gl';

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
#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;

uniform sampler2D uSampler;

void main(void) {
  gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
}
`;

const animationLoop = new AnimationLoop({
  // .context(() => createGLContext({canvas: 'lesson05-canvas'}))
  onInitialize({gl}) {
    addControls();

    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);
    gl.enable(GL.DEPTH_TEST);
    gl.depthFunc(GL.LEQUAL);
    gl.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);

    return loadTextures(gl, {
      urls: ['nehe.gif']
    })
    .then(textures => ({
      cube: new Cube({
        gl,
        vs: VERTEX_SHADER,
        fs: FRAGMENT_SHADER,
        uniforms: {uSampler: textures[0]}
      })
    }));
  },
  onRender({gl, tick, aspect, cube}) {
    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    cube.render({
      uPMatrix: Matrix4.perspective({aspect}),
      uMVMatrix: Matrix4
        .lookAt({eye: [0, 0, 0]})
        .translate([0, 0, -5])
        .rotateXYZ([tick * 0.01, tick * 0.01, tick * 0.01])
    });
  }
});

function addControls({controlPanel} = {}) {
  /* global document */
  controlPanel = controlPanel || document.querySelector('.control-panel');
  if (controlPanel) {
    controlPanel.innerHTML = `
  <p>
    <a href="http://learningwebgl.com/blog/?p=507" target="_blank">
      Introducing Textures
    </a>
  <p>
    The classic WebGL Lessons in luma.gl
    `;
  }
}

export default animationLoop;
