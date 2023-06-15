import {Device, getRandom,glsl} from '@luma.gl/api';
import {makeAnimationLoop, AnimationLoopTemplate, AnimationProps, CubeGeometry} from '@luma.gl/engine';
import {dirlight} from '@luma.gl/shadertools';
import {GL, clear, withParameters, Model, ModelProps} from '@luma.gl/webgl-legacy';
import {radians} from '@math.gl/core';
import {StatsWidget} from '@probe.gl/stats-widget';

const INFO_HTML = `
<p>
  <div id="info-stats"></div>
<p>
`;

const ALT_TEXT = 'THIS DEMO REQUIRES WEBGL 2, BUT YOUR BROWSER DOESN\'T SUPPORT IT';

const NUM_DRAWCALLS = 5000;
const CUBES_PER_DRAWCALL = 200;
const SCENE_DIM = 500;
const OPAQUE_DRAWCALLS = Math.floor(NUM_DRAWCALLS / 2);
const TRANSPARENT_DRAWCALLS = NUM_DRAWCALLS - OPAQUE_DRAWCALLS;
const NEAR = 200;
const FAR = 2000.0;

const random = getRandom();

const CUBE_VERTEX = glsl`\
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
  gl_Position = uProjection * uView * vec4(positions * 4.0 + offset, 1.0);
  project_setNormal(normals);
  vUV = texCoords;
}
`;
const CUBE_FRAGMENT = glsl`\
#version 300 es
precision highp float;
#define SHADER_NAME scene.fs

in vec2 vUV;
uniform sampler2D uTexture;
uniform float alpha;

out vec4 fragColor;
void main(void) {
  fragColor.rgb = texture(uTexture, vec2(vUV.x, 1.0 - vUV.y)).rgb;
  fragColor.a = alpha;
  fragColor = dirlight_filterColor(fragColor);
  fragColor.rgb *= fragColor.a;
}
`;

class InstancedCube extends Model {
  count: number;

  constructor(device: Device, props: ModelProps & {count: number, offsets: ArrayBufferView}) {
    const count = props.count;
    const offsetBuffer = device.createBuffer(props.offsets);

    super(
      device,
      {
        geometry: new CubeGeometry(),
        ...props,
        vs: CUBE_VERTEX,
        fs: CUBE_FRAGMENT,
        modules: [dirlight],
        isInstanced: true,
        instanceCount: count,
        uniforms: props.uniforms,
        attributes: {
          offset: {
            // @ts-expect-error
            buffer: offsetBuffer,
            size: 3,
            divisor: 1
          }
        }
      }
    );

    this.count = count;
  }
}

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;

  projectionMatrix;
  viewMatrix;
  opaqueCubes;
  transparentCubes;
  statsWidget: StatsWidget;

  rotationAngle = 0;

  constructor({device}: AnimationProps) {
    super();

    if (device.info.type !== 'webgl2') {
      throw new Error(ALT_TEXT);
    }

    // @ts-expect-error
    const {gl} = device;

    // const projectionMatrix = new Matrix4();
    // const viewMatrix = new Matrix4().lookAt({eye: [0, 0, 8]});

    const texture = device.createTexture({
      data: 'vis-logo.png',
      mipmaps: true,
      sampler: {
        magFilter: 'linear',
        minFilter: 'linear',
        mipmapFilter: 'nearest'
      }
    });

    const opaqueCubes = new Array(OPAQUE_DRAWCALLS);
    const transparentCubes = new Array(TRANSPARENT_DRAWCALLS);
    const offsets = new Float32Array(CUBES_PER_DRAWCALL * 3);

    for (let i = 0; i < OPAQUE_DRAWCALLS; ++i) {
      opaqueCubes[i] = createDrawcall(gl, offsets, texture, 1.0);
    }

    for (let i = 0; i < TRANSPARENT_DRAWCALLS; ++i) {
      transparentCubes[i] = createDrawcall(gl, offsets, texture, 0.5);
    }

    // @ts-expect-error Stats object type conflict... some weird dependency issue with probe.gl?
    this.statsWidget = new StatsWidget(this.stats, {
      container: document.getElementById('info-stats'),
      title: `Drawing ${CUBES_PER_DRAWCALL * OPAQUE_DRAWCALLS} opaque cubes and ${
        CUBES_PER_DRAWCALL * TRANSPARENT_DRAWCALLS
      } transparent cubes in ${NUM_DRAWCALLS} draw calls`,
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
  }

  override onFinalize() {
    this.opaqueCubes.forEach((c) => c.destroy());
    this.transparentCubes.forEach((c) => c.destroy());
  }

  override onRender({device, aspect, tick}: AnimationProps) {
    this.rotationAngle += 0.01;
    this.statsWidget.update();

    if (tick % 600 === 0) {
      // @ts-ignore TODO - fix probe.gl types
      this.stats.reset();
    }

    const camX = Math.cos(this.rotationAngle);
    const camZ = Math.sin(this.rotationAngle);
    const camRadius = 800;

    this.projectionMatrix.perspective({fovy: radians(60), aspect, near: NEAR, far: FAR});
    this.viewMatrix.lookAt({
      eye: [camX * camRadius, 400, camZ * camRadius],
      center: [0, 0, 0],
      up: [0, 1, 0]
    });

    clear(device, {color: [0, 0, 0, 1], depth: true});

    withParameters(
      // @ts-expect-error
      device.gl,
      {depthTest: true, depthMask: true, depthFunc: GL.LEQUAL, cull: true, blend: false},
      () => {
        for (let i = 0; i < OPAQUE_DRAWCALLS; ++i) {
          this.opaqueCubes[i].draw({
            uniforms: {
              uProjection: this.projectionMatrix,
              uView: this.viewMatrix
            }
          });
        }
      }
    );

    withParameters(
      // @ts-expect-error
      device.gl,
      {
        depthTest: true,
        depthMask: false,
        depthFunc: GL.LEQUAL,
        cull: true,
        blend: true,
        blendFunc: [GL.ONE, GL.ONE_MINUS_SRC_ALPHA]
      },
      () => {
        for (let i = 0; i < TRANSPARENT_DRAWCALLS; ++i) {
          this.transparentCubes[i].draw({
            uniforms: {
              uProjection: this.projectionMatrix,
              uView: this.viewMatrix
            }
          });
        }
      }
    );
  }
}

function createDrawcall(gl, offsets, texture, alpha) {
  for (let i = 0; i < CUBES_PER_DRAWCALL; ++i) {
    const x = (random() - 0.5) * SCENE_DIM;
    const y = (random() - 0.5) * SCENE_DIM;
    const z = (random() - 0.5) * SCENE_DIM;

    offsets.set([x, y, z], i * 3);
  }
  return new InstancedCube(gl, {
    count: CUBES_PER_DRAWCALL,
    offsets,
    uniforms: {
      uTexture: texture,
      alpha
    }
  });
}

// @ts-ignore
if (typeof window !== 'undefined' && !window.website) {
  document.body.style.overflow = 'hidden';
  document.body.style.margin = '0';
  makeAnimationLoop(AppAnimationLoopTemplate).start();
}
