/* global document, window */
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

const NUM_DRAWCALLS = 5000;
const CUBES_PER_DRAWCALL = 200;
const SCENE_DIM = 500;
const NEAR = 200;
const FAR = 2000.0;

const CUBE_VERTEX = `\
#version 300 es
#define SHADER_NAME scene.vs

in vec3 positions;
in vec3 normals;
in vec2 texCoords;
in vec3 offset;

uniform mat4 uView;
uniform mat4 uProjection;
out vec2 vUV;

void main(void) {
  gl_Position = uProjection * uView * vec4(positions + offset, 1.0);
  project_setNormal(normals);
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

class InstancedCube extends Model {
  constructor(gl, props) {
    const count = props.count;
    const offsetBuffer = new Buffer(gl, props.offsets);

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
          offset: {
            buffer: offsetBuffer,
            size: 3,
            divisor: 1
          }
        }
      })
    );

    this.count = count;
  }
}

export default class AppAnimationLoop extends AnimationLoop {
  static getInfo() {
    return INFO_HTML;
  }

  constructor(props = {}) {
    super(props);
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

    const instancedCubes = new Array(NUM_DRAWCALLS);
    const offsets = new Float32Array(CUBES_PER_DRAWCALL * 3);

    for (let i = 0; i < NUM_DRAWCALLS; ++i) {
      for (let j = 0; j < CUBES_PER_DRAWCALL; ++j) {
        const x = (Math.random() - 0.5) * SCENE_DIM;
        const y = (Math.random() - 0.5) * SCENE_DIM;
        const z = (Math.random() - 0.5) * SCENE_DIM;

        offsets.set([x, y, z], j * 3);
      }
      instancedCubes[i] = new InstancedCube(gl, {
        count: CUBES_PER_DRAWCALL,
        offsets,
        uniforms: {
          uTexture: texture
        }
      });
    }

    const statsWidget = new StatsWidget(this.stats, {
      title: `Drawing ${CUBES_PER_DRAWCALL * NUM_DRAWCALLS} cubes in ${NUM_DRAWCALLS} draw calls`,
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
      statsWidget,
      angle: 0
    };
  }

  onRender(props) {
    props.angle += 0.01;

    const {gl, aspect, projectionMatrix, viewMatrix, instancedCubes, angle, statsWidget} = props;

    statsWidget.update();

    const camX = Math.cos(angle);
    const camZ = Math.sin(angle);
    const camRadius = 800;

    projectionMatrix.perspective({fov: radians(60), aspect, near: NEAR, far: FAR});
    viewMatrix.lookAt({
      eye: [camX * camRadius, 400, camZ * camRadius],
      center: [0, 0, 0],
      up: [0, 1, 0]
    });

    withParameters(gl, {depthTest: true, depthFunc: GL.LEQUAL, cull: true}, () => {
      clear(gl, {color: [0, 0, 0, 1], depth: true});
      for (let k = 0; k < NUM_DRAWCALLS; ++k) {
        instancedCubes[k].draw({
          uniforms: {
            uProjection: projectionMatrix,
            uView: viewMatrix
          }
        });
      }
    });
  }
}

if (typeof window !== 'undefined' && !window.website) {
  document.body.style.overflow = 'hidden';
  document.body.style.margin = '0';
  const animationLoop = new AppAnimationLoop();
  animationLoop.start({width: window.innerWidth, height: window.innerHeight});
}
