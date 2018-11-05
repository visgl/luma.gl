import GL from 'luma.gl/constants';
import {AnimationLoop, Framebuffer, Cube, setParameters, clear, CubeGeometry, Model, Program} from 'luma.gl';
import {Matrix4, radians} from 'math.gl';

const INFO_HTML = `
<p>
  Simple <b>shadow mapping</b>.
<p>
A luma.gl <code>Cube</code>, rendering into a shadowmap framebuffer
and then rendering onto the screen.
`;

const SCENE_FRAGMENT = `\
precision highp float;
varying vec3 normal;

void main(void) {
  float d = clamp(dot(normalize(normal), vec3(0,1,0)), 0.25, 1.0);
  gl_FragColor = vec4(d, d, d, 1);
}
`;

const SCENE_VERTEX = `\
#define SHADER_NAME scene.vs

attribute vec3 positions;
attribute vec3 normals;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
varying vec3 normal;

void main(void) {
  gl_Position = uProjection * uView * uModel * vec4(positions, 1.0);
  normal = vec3(uModel * vec4(normals, 0.0));
}
`;

const NUM_ROWS = 5;
const BOXES_PER_ROW = 20;
const NUM_BOXES = BOXES_PER_ROW * NUM_ROWS;

export const animationLoopOptions = {
  onInitialize: ({gl}) => {

    let cubeGeo = new CubeGeometry();

    setParameters(gl, {
      depthTest: true,
      depthFunc: GL.LEQUAL
    });

    const projMat = new Matrix4();
    const viewMat = new Matrix4().lookAt({eye: [0, 0, 8]});

    const sceneProgram = new Program(gl, {
      vs: SCENE_VERTEX,
      fs: SCENE_FRAGMENT
    });

    let boxes = new Array(NUM_BOXES);
    let boxI = 0;
    for (let j = 0; j < NUM_ROWS; ++j) {
        let rowOffset = (j - Math.floor(NUM_ROWS / 2));
        for (let i = 0; i < BOXES_PER_ROW; ++i) {
            boxes[boxI] = new Model(gl, { 
              geometry: cubeGeo, 
              program: sceneProgram,
            });
            boxes[boxI].setScale([0.4, 0.4, 0.4]);
            // boxes[boxI].setRotation([-boxI / Math.PI, 0, boxI / Math.PI]);
            boxes[boxI].setPosition([-i + 2 - rowOffset, 0, -i + 2 + rowOffset]);
            boxes[boxI].updateMatrix();
            ++boxI;
        }
    }

    return {
      boxes
    };
  },

  onRender: ({gl, tick, width, height, aspect, boxes}) => {

    clear(gl, {color: [0, 0, 0, 1], depth: true});

    const camView = new Matrix4().lookAt({eye: [3, 1.5, 3], center: [0, 0, 0], up: [0, 1, 0]});
    const camProj = new Matrix4().perspective({fov: radians(75), aspect, near: 0.1, far: 100});

    for (let i = 0; i < NUM_BOXES; ++i) {
      let box = boxes[i];
      box.draw({
        uniforms: {
          uView: camView,
          uProjection: camProj,
          uModel: box.matrix
        }
      });
    }
  }
};

const animationLoop = new AnimationLoop(animationLoopOptions);

animationLoop.getInfo = () => INFO_HTML;

export default animationLoop;

/* global window */
if (typeof window !== 'undefined' && !window.website) {
  animationLoop.start();
}
