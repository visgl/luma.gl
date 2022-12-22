import {getRandom, glsl} from '@luma.gl/api';
import {dirlight as dirlightBase} from '@luma.gl/shadertools';
import {makeAnimationLoop, AnimationLoopTemplate, AnimationProps, CubeGeometry} from '@luma.gl/engine';
import {ClassicModel as Model, ProgramManager} from '@luma.gl/webgl-legacy';
import {clear} from '@luma.gl/webgl-legacy';
import {Matrix4, radians} from '@math.gl/core';

const random = getRandom();

const INFO_HTML = `
Using a ProgramManager to cache and share programs between models.
`;

const vs = glsl`\
attribute vec3 positions;
attribute vec3 normals;

uniform vec3 uColor;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;

varying vec3 color;

void main(void) {
  vec3 normal = vec3(uModel * vec4(normals, 0.0));

  // Set up data for modules
  color = uColor;
  LUMAGL_normal(normal);
  gl_Position = uProjection * uView * uModel * vec4(positions, 1.0);
}
`;

const fs = glsl`\
precision highp float;

varying vec3 color;

void main(void) {
  gl_FragColor = vec4(color, 1.);
  LUMAGL_fragmentColor(gl_FragColor);
}
`;

// Create a new version of module with injections
const dirlight = Object.assign(
  {
    inject: {
      'vs:LUMAGL_normal': 'project_setNormal(normal);',
      'fs:LUMAGL_fragmentColor': 'color = dirlight_filterColor(color);'
    }
  },
  dirlightBase
);

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = INFO_HTML;

  programManager: ProgramManager;
  cubes: {translation: number[], rotation: number[], model: Model}[];

  constructor({device, aspect}: AnimationProps) {
    super();

    this.programManager = new ProgramManager(device);
    this.programManager.addShaderHook('vs:LUMAGL_normal(inout vec3 normal)');
    this.programManager.addShaderHook('fs:LUMAGL_fragmentColor(inout vec4 color)');

    const translations = [
      [2, -2, 0],
      [2, 2, 0],
      [-2, 2, 0],
      [-2, -2, 0]
    ];

    const rotations = [
      [random(), random(), random()],
      [random(), random(), random()],
      [random(), random(), random()],
      [random(), random(), random()]
    ];

    const colors = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
      [1, 1, 0]
    ];

    this.cubes = new Array(4);

    for (let i = 0; i < 4; ++i) {
      this.cubes[i] = {
        translation: translations[i],
        rotation: rotations[i],
        model: new Model(device, {
          programManager: this.programManager,
          vs,
          fs,
          modules: i % 2 === 0 ? [] : [dirlight],
          geometry: new CubeGeometry(),
          uniforms: {
            uProjection: new Matrix4().perspective({fov: radians(60), aspect, near: 1, far: 20.0}),
            uView: new Matrix4().lookAt({
              center: [0, 0, 0],
              eye: [0, 0, -8]
            }),
            uColor: colors[i]
          },
          parameters: {
            depthWriteEnabled: true,
            depthCompare: 'less-equal'
          }
        })
      };
    }
  }

  override onFinalize() {
    for (let i = 0; i < 4; ++i) {
      this.cubes[i].model.destroy();
    }
  }

  override onRender({device, tick}: AnimationProps) {
    if (tick % 240 === 0) {
      if (tick % 480 === 0) {
        this.programManager.removeDefaultModule(dirlight);
      } else {
        this.programManager.addDefaultModule(dirlight);
      }
    }

    if (tick % 120 === 0) {
      const even = tick % 240 === 0;
      for (let i = 0; i < 4; ++i) {
        this.cubes[i].model.setProgram({
          vs,
          fs,
          modules: i % 2 === Number(even) ? [] : [dirlight]
        });
      }
    }

    const modelMatrix = new Matrix4();

    // Draw the cubes
    clear(device, {color: [0, 0, 0, 1], depth: true});

    for (let i = 0; i < 4; ++i) {
      const cube = this.cubes[i];

      cube.rotation[0] += 0.01;
      cube.rotation[1] += 0.01;
      cube.rotation[2] += 0.01;

      modelMatrix.identity().translate(cube.translation).rotateXYZ(cube.rotation);

      cube.model
        .setUniforms({
          uModel: modelMatrix
        })
        .draw();
    }
  }
}

// @ts-ignore
if (typeof window !== 'undefined' && !window.website) {
  makeAnimationLoop(AppAnimationLoopTemplate).start();
}
