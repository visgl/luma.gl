/* global document, window */
/* eslint-disable max-depth */
import GL from '@luma.gl/constants';
import {
  AnimationLoop,
  withParameters,
  clear,
  Texture2D,
  Buffer,
  Model,
  CubeGeometry,
  dirlight
} from '@luma.gl/core';
import {Matrix4, radians} from 'math.gl';
import {StatsWidget} from '@probe.gl/stats-widget';

const INFO_HTML = `
<p>
  <b>Stress Test</b>.
<p>
`;

const NUM_LAYERS = 250;
const LAYER_DIM = 4;
const LAYER_AREA = LAYER_DIM * LAYER_DIM;
const NUM_DRAWS = NUM_LAYERS * LAYER_AREA;
const NUM_ROWS = 30;
const CUBES_PER_ROW = 30;
const NUM_CUBES = CUBES_PER_ROW * NUM_ROWS;
const NEAR = 500;
const FAR = 3000.0;

const CUBE_VERTEX = `\
#version 300 es
#define SHADER_NAME scene.vs

in vec3 positions;
in vec3 normals;
in vec2 texCoords;
in vec4 pickColor;
in vec4 modelMatCol1;
in vec4 modelMatCol2;
in vec4 modelMatCol3;
in vec4 modelMatCol4;

uniform mat4 uView;
uniform mat4 uProjection;
out vec2 vUV;

void main(void) {
  mat4 modelMat = mat4(
    modelMatCol1,
    modelMatCol2,
    modelMatCol3,
    modelMatCol4
  );
  gl_Position = uProjection * uView * modelMat * vec4(positions, 1.0);
  project_setNormal(vec3(modelMat * vec4(normals, 0.0)));
  vUV = texCoords;
}
`;
const CUBE_FRAGMENT = `\
#version 300 es
precision highp float;
#define SHADER_NAME scene.fs

in vec2 vUV;
uniform sampler2D uTexture;

out vec4 fragColor;
void main(void) {
  fragColor.rgb = texture(uTexture, vUV).rgb;
  fragColor.a = 1.0;
  fragColor = dirlight_filterColor(fragColor);
}
`;

const QUAD_VERTS = [1, 1, -1, 1, 1, -1, -1, -1]; // eslint-disable-line

const BLIT_VERTEX = `\
#version 300 es
#define SHADER_NAME quad.vs

layout(location=0) in vec4 position;

out vec2 vUV;

void main() {
    gl_Position = position;
    vUV = position.xy * 0.5 + 0.5;
}
`;

const BLIT_FRAGMENT = `\
#version 300 es
#define SHADER_NAME quad.fs

uniform sampler2D color;

in vec2 vUV;

out vec4 fragColor;

void main() {
    fragColor = texture(color, vUV);
}
`;

class InstancedCube extends Model {
  constructor(gl, props) {
    const count = props.count;
    const xforms = new Array(count);
    const matrices = new Float32Array(count * 16);
    const matrixBuffer = new Buffer(gl, matrices.byteLength);

    super(
      gl,
      Object.assign({geometry: new CubeGeometry()}, props, {
        vs: CUBE_VERTEX,
        fs: CUBE_FRAGMENT,
        modules: [dirlight],
        isInstanced: 1,
        instanceCount: count,
        uniforms: {
          uTexture: props.uniforms.uTexture
        },
        attributes: {
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

  constructor() {
    super({createFramebuffer: true});
    this.isDemoSupported = true;
  }

  onInitialize({gl, framebuffer}) {
    const projectionMatrix = new Matrix4();
    const viewMatrix = new Matrix4().lookAt({eye: [0, 0, 8]});

    const texture = new Texture2D(gl, {
      data: 'webgl-logo.png',
      mipmaps: true,
      parameters: {
        [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
        [gl.TEXTURE_MIN_FILTER]: gl.LINEAR_MIPMAP_NEAREST
      }
    });

    const instancedCubes = new Array(4);

    const OFFSET_SCALE = 10;

    let ci = 0;
    for (let y = 0; y < NUM_LAYERS; ++y) {
      const yOffset = -NUM_LAYERS * 0.5;
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
            const translate = [
              (i - CUBES_PER_ROW / 2 + xOffset) * 4,
              (y + yOffset) * 4,
              (rowOffset + zOffset) * 4
            ];
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

    const blitModel = new Model(gl, {
      vs: BLIT_VERTEX,
      fs: BLIT_FRAGMENT,
      drawMode: gl.TRIANGLE_STRIP,
      vertexCount: 4,
      attributes: {
        position: [new Buffer(gl, new Float32Array(QUAD_VERTS)), {size: 2}]
      },
      uniforms: {
        color: framebuffer.color
      }
    });

    const statsWidget = new StatsWidget(this.stats, {
      title: `Drawing ${NUM_CUBES * NUM_DRAWS} cubes in ${NUM_DRAWS} draw calls`,
      css: {
        position: 'absolute',
        top: '10px',
        left: '10px',
        fontSize: '14px'
      },
      formatters: {
        'CPU Time': 'averageTime',
        'GPU Time': 'averageTime',
        'Frame Rate': 'fps'
      }
    });

    return {
      projectionMatrix,
      viewMatrix,
      instancedCubes,
      blitModel,
      statsWidget,
      angle: 0
    };
  }

  onRender(props) {
    props.angle += 0.01;

    const {
      gl,
      aspect,
      projectionMatrix,
      viewMatrix,
      instancedCubes,
      angle,
      framebuffer,
      blitModel,
      statsWidget
    } = props;

    statsWidget.update();

    const camZ = Math.cos(angle);
    const camY = Math.sin(angle);
    const camRadius = 1100;

    projectionMatrix.perspective({fov: radians(60), aspect, near: NEAR, far: FAR});
    viewMatrix.lookAt({
      eye: [0, camY * camRadius, camZ * camRadius],
      center: [0, 0, 0],
      up: [0, Math.sign(camZ), 0]
    });

    withParameters(gl, {depthTest: true, depthFunc: GL.LEQUAL, cull: true, framebuffer}, () => {
      clear(gl, {color: [0, 0, 0, 1], depth: true});
      for (let k = 0; k < NUM_DRAWS; ++k) {
        instancedCubes[k].draw({
          uniforms: {
            uProjection: projectionMatrix,
            uView: viewMatrix
          }
        });
      }
    });

    withParameters(gl, {depthTest: false, cull: false}, () => {
      blitModel.draw();
    });
  }
}

if (typeof window !== 'undefined' && !window.website) {
  document.body.style.overflow = 'hidden';
  document.body.style.margin = '0';
  const animationLoop = new AppAnimationLoop();
  animationLoop.start({width: window.innerWidth, height: window.innerHeight});
}
