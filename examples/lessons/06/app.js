/* global window */
import {
  GL, AnimationLoop, Cube, Matrix4, Texture2D, addEvents, loadImage, setParameters
} from 'luma.gl';

const INFO_HTML = `
<p>
  <a href="http://learningwebgl.com/blog/?p=571" target="_blank">
    Keyboard input and texture filters
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
#ifdef GL_ES
precision highp float;
#endif

varying vec2 vTextureCoord;

uniform sampler2D uSampler;

void main(void) {
  gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));
}
`;

let xRot = 0;
let xSpeed = 0.01;
let yRot = 0;
let ySpeed = 0.013;
let z = -5.0;
let filter = 0;
const filters = ['nearest', 'linear', 'mipmap'];

const animationLoop = new AnimationLoop({
  // .context(() => createGLContext({canvas: 'lesson05-canvas'}))
  onInitialize: ({canvas, gl}) => {
    addKeyboardHandler(canvas);

    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      clearDepth: 1,
      depthTest: true,
      depthFunc: GL.LEQUAL,
      [GL.UNPACK_FLIP_Y_WEBGL]: true
    });

    const cube = new Cube(gl, {vs: VERTEX_SHADER, fs: FRAGMENT_SHADER});

    // load image
    return loadImage('crate.gif')
    .then(image => {

      const textures = {
        nearest: new Texture2D(gl, {
          data: image,
          pixelStore: {
            [GL.UNPACK_FLIP_Y_WEBGL]: true
          }
        }),
        linear: new Texture2D(gl, {
          data: image,
          parameters: {
            [GL.TEXTURE_MIN_FILTER]: GL.LINEAR,
            [GL.TEXTURE_MAG_FILTER]: GL.LINEAR
          },
          pixelStore: {
            [GL.UNPACK_FLIP_Y_WEBGL]: true
          }
        }),
        mipmap: new Texture2D(gl, {
          data: image,
          mipmap: true,
          parameters: {
            [GL.TEXTURE_MIN_FILTER]: GL.LINEAR_MIPMAP_LINEAR,
            [GL.TEXTURE_MAG_FILTER]: GL.LINEAR
          },
          pixelStore: {
            [GL.UNPACK_FLIP_Y_WEBGL]: true
          }
        })
      };

      return {cube, textures};
    });
  },
  onRender: ({gl, tick, aspect, cube, textures}) => {

    xRot += xSpeed;
    yRot += ySpeed;

    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    // cube.render({
    //   uSampler: textures[filters[filter]],
    //   uPMatrix: new Matrix4().perspective({aspect}),
    //   uMVMatrix: new Matrix4()
    //     .lookAt({eye: [0, 0, 0]})
    //     .translate([0, 0, -5])
    // });

    // draw Cube

    // update element matrix to rotate cube on its center
    cube
      .setRotation([xRot, yRot, 0])
      .updateMatrix();

    const uMVMatrix = new Matrix4()
      .lookAt({eye: [0, 0, 0]})
      .translate([0, 0, z])
      .rotateXYZ([tick * 0.01, tick * 0.01, tick * 0.01])
      .multiplyRight(cube.matrix);

    cube.render({
      uMVMatrix,
      uPMatrix: new Matrix4().perspective({aspect}),
      uSampler: textures[filters[filter]]
    });
  }
});

animationLoop.getInfo = () => INFO_HTML;

function addKeyboardHandler(canvas) {

  addEvents(canvas, {
    onKeyDown(e) {
      switch (e.key) {
      case 'f':
        filter = (filter + 1) % 3;
        break;
      case 'up':
        xSpeed -= 0.02;
        break;
      case 'down':
        xSpeed += 0.02;
        break;
      case 'left':
        ySpeed -= 0.02;
        break;
      case 'right':
        ySpeed += 0.02;
        break;
      // andle page up/down
      default:
        if (e.code === 33) {
          z -= 0.05;
        } else if (e.code === 34) {
          z += 0.05;
        }
      }
    }
  });
}

export default animationLoop;

/* global window */
if (!window.website) {
  animationLoop.start();
}
