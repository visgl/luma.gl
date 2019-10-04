import GL from '@luma.gl/constants';
import {
  AnimationLoop,
  setParameters,
  clear,
  Texture2D,
  Buffer,
  Model,
  CubeGeometry
} from '@luma.gl/core';
import {Matrix4, radians} from 'math.gl';
/* eslint-disable spaced-comment, max-depth */
/* global document, window */

/*
  Based on: https://github.com/tsherif/picogl.js/blob/master/examples/dof.html
  Original algorithm: http://www.nutty.ca/?page_id=352&link=depth_of_field
*/

const INFO_HTML = `
<p>
  <b>Depth of Field</b>.
<p>
Several instanced luma.gl <code>Cubes</code> rendered with a Depth of Field
post-processing effect.

<div>
  Focal Length: <input type="range" id="focal-length" min="0.1" max="10.0" step="0.1">
</div>
<div>
  Focus Distance: <input type="range" id="focus-distance" min="0.1" max="10.0" step="0.1">
</div>
<div>
  F-Stop: <input type="range" id="f-stop" min="0.1" max="10.0" step="0.1">
</div>

`;

const NUM_LAYERS = 250;
const LAYER_DIM = 4;
const LAYER_AREA = LAYER_DIM * LAYER_DIM;
const NUM_DRAWS = NUM_LAYERS * LAYER_AREA;
const NUM_ROWS = 10;
const CUBES_PER_ROW = 10;
const NUM_CUBES = CUBES_PER_ROW * NUM_ROWS;
const NEAR = 100;
const FAR = 1000.0;

const stats = document.createElement('div');
stats.innerHTML = `Drawing ${NUM_CUBES * NUM_DRAWS} cubes in ${NUM_DRAWS} draw calls`;
stats.style.position = 'absolute';
stats.style.top = '10px';
stats.style.left = '10px';
stats.style.color = 'white';

const cpuStats = document.createElement('div');
const gpuStats = document.createElement('div');
stats.appendChild(cpuStats);
stats.appendChild(gpuStats);
document.body.appendChild(stats);

class InstancedCube extends Model {
  constructor(gl, props) {
    const count = props.count;
    const xforms = new Array(count);
    const matrices = new Float32Array(count * 16);
    const matrixBuffer = new Buffer(gl, matrices.byteLength);

    const vs = `\
#version 300 es
#define SHADER_NAME scene.vs

in vec3 positions;
in vec3 normals;
in vec2 texCoords;
in vec4 modelMatCol1;
in vec4 modelMatCol2;
in vec4 modelMatCol3;
in vec4 modelMatCol4;

uniform mat4 uView;
uniform mat4 uProjection;
out vec3 vNormal;
out vec2 vUV;

void main(void) {
  mat4 modelMat = mat4(
    modelMatCol1,
    modelMatCol2,
    modelMatCol3,
    modelMatCol4
  );
  gl_Position = uProjection * uView * modelMat * vec4(positions, 1.0);
  vNormal = vec3(modelMat * vec4(normals, 0.0));
  vUV = texCoords;
}
`;
    const fs = `\
#version 300 es
precision highp float;
#define SHADER_NAME scene.fs

in vec3 vNormal;
in vec2 vUV;
uniform sampler2D uTexture;

out vec4 fragColor;
void main(void) {
  float d = clamp(dot(normalize(vNormal), normalize(vec3(1.0, 1.0, 0.2))), 0.0, 1.0);
  fragColor.rgb = texture(uTexture, vUV).rgb * (d + 0.1);
  fragColor.a = 1.0;
}
`;

    super(
      gl,
      Object.assign({geometry: new CubeGeometry()}, props, {
        vs,
        fs,
        isInstanced: 1,
        instanceCount: count,
        uniforms: {
          uTexture: props.uniforms.uTexture
        },
        attributes: {
          // Attributes are limited to 4 components,
          // So we have to split the matrices across
          // 4 attributes. They're reconstructed in
          // the vertex shader.
          modelMatCol1: {
            buffer: matrixBuffer,
            size: 4,
            stride: 64,
            offset: 0,
            divisor: 1
          },
          modelMatCol2: {
            buffer: matrixBuffer,
            size: 4,
            stride: 64,
            offset: 16,
            divisor: 1
          },
          modelMatCol3: {
            buffer: matrixBuffer,
            size: 4,
            stride: 64,
            offset: 32,
            divisor: 1
          },
          modelMatCol4: {
            buffer: matrixBuffer,
            size: 4,
            stride: 64,
            offset: 48,
            divisor: 1
          }
        }
      })
    );

    this.count = count;
    this.xforms = xforms;
    this.matrices = matrices;
    this.matrixBuffer = matrixBuffer;
  }

  updateMatrixBuffer() {
    this.matrixBuffer.setData(this.matrices);
  }
}

export default class AppAnimationLoop extends AnimationLoop {
  static getInfo() {
    return INFO_HTML;
  }

  constructor(props = {}) {
    super(props);
    // Default value is true, so GL context is always created to verify wheter it is WebGL2 or not.
    this.isDemoSupported = true;
  }

  onInitialize({gl, _animationLoop}) {
    setParameters(gl, {
      depthTest: true,
      depthFunc: GL.LEQUAL
    });

    const projMat = new Matrix4();
    const viewMat = new Matrix4().lookAt({eye: [0, 0, 8]});

    const texture = new Texture2D(gl, {
      data: 'webgl-logo.png',
      mipmaps: true,
      parameters: {
        [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
        [gl.TEXTURE_MIN_FILTER]: gl.LINEAR_MIPMAP_NEAREST
      }
    });

    /////////////////////////////////////////////////////
    // Create instanced model and initialize transform matrices.
    /////////////////////////////////////////////////////

    const instancedCubes = new Array(4);

    const OFFSET_SCALE = 10;

    let ci = 0;
    for (let y = 0; y < NUM_LAYERS; ++y) {
      for (let k = 0; k < LAYER_AREA; ++k) {
        instancedCubes[ci] = new InstancedCube(gl, {
          count: NUM_CUBES,
          uniforms: {
            uTexture: texture
          }
        });

        const adjust = (LAYER_DIM - 1) * 0.5;

        const xOffset = ((k % LAYER_DIM) - adjust) * OFFSET_SCALE;
        const zOffset = (Math.floor(k / LAYER_DIM) - adjust) * OFFSET_SCALE;

        let cubeI = 0;
        for (let j = 0; j < NUM_ROWS; ++j) {
          const rowOffset = j - Math.floor(NUM_ROWS / 2);
          for (let i = 0; i < CUBES_PER_ROW; ++i) {
            const scale = [1, 1, 1];
            const rotate = [-Math.random() * Math.PI, 0, Math.random() * Math.PI];
            const translate = [(i - CUBES_PER_ROW / 2 + xOffset) * 4, y, (rowOffset + zOffset) * 4];
            instancedCubes[ci].xforms[cubeI] = {
              scale,
              translate,
              rotate,
              matrix: new Matrix4()
                .translate(translate)
                .rotateXYZ(rotate)
                .scale(scale)
            };

            instancedCubes[ci].matrices.set(instancedCubes[ci].xforms[cubeI].matrix, cubeI * 16);
            ++cubeI;
          }
        }

        instancedCubes[ci].updateMatrixBuffer();
        ci++;
      }
    }

    return {
      projMat,
      viewMat,
      instancedCubes,
      angle: 0
    };
  }

  onRender(props) {
    if (!this.isDemoSupported) {
      return;
    }

    props.angle += 0.01;

    const {gl, aspect, projMat, viewMat, instancedCubes, angle} = props;

    cpuStats.innerHTML = `CPU Time: ${this.stats
      .get('CPU Time')
      .getAverageTime()
      .toFixed(2)}ms`;
    gpuStats.innerHTML = `GPU Time: ${this.stats
      .get('GPU Time')
      .getAverageTime()
      .toFixed(2)}ms`;

    const upX = Math.cos(angle);
    const upZ = Math.sin(angle);

    projMat.perspective({fov: radians(60), aspect, near: NEAR, far: FAR});
    viewMat.lookAt({eye: [0, 450, 0], center: [0, 0, 0], up: [upX, 0, upZ]});
    clear(gl, {color: [0, 0, 0, 1]});

    ////////////////////////////////////////
    // Update model matrix data and then
    // update the attribute buffer.
    ////////////////////////////////////////

    for (let k = 0; k < NUM_DRAWS; ++k) {
      instancedCubes[k].draw({
        uniforms: {
          uProjection: projMat,
          uView: viewMat
        }
      });
    }
  }
}

/* global window */
if (typeof window !== 'undefined' && !window.website) {
  document.body.style.margin = '0';
  const animationLoop = new AppAnimationLoop();
  animationLoop.start({width: window.innerWidth, height: window.innerHeight});
}
