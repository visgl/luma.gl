import {UniformStore, VariableShaderType} from '@luma.gl/core';
import {
  AnimationLoopTemplate,
  AnimationProps,
  Model,
  CubeGeometry,
  Timeline,
  KeyFrames,
  makeRandomGenerator
} from '@luma.gl/engine';
import {dirlight} from '@luma.gl/shadertools';
import {Matrix4, radians} from '@math.gl/core';


// Ensure repeatable rendertests
const random = makeRandomGenerator();

// SHADERS

type AppUniforms = {
  uColor: number[];
  uModel: number[];
  uView: number[];
  uProjection: number[];
};

const app: {uniformTypes: Record<string, VariableShaderType>} = {
  uniformTypes: {
    uColor: 'vec3<f32>',
    uModel: 'mat4x4<f32>',
    uView: 'mat4x4<f32>',
    uProjection: 'mat4x4<f32>'
  }
};

const source = /* wgsl */ `\
struct Uniforms {
  uColor : vec3<f32>,
  uModel : mat4x4<f32>,
  uView : mat4x4<f32>,
  uProjection : mat4x4<f32>,
};

@binding(0) @group(0) var<uniform> app : Uniforms;

struct VertexInputs {
  // CUBE GEOMETRY
  @location(0) positions : vec4<f32>,
  @location(1) normals : vec3<f32>
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) color : vec3<f32>,
  @location(1) dirlightNormal: DirlightNormal,
}

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs : FragmentInputs;
  // gl_Position = app.uProjection * app.uView * app.uModel * vec4(positions, 1.0);
  outputs.Position = app.uProjection * app.uView * app.uModel * inputs.positions;
  outputs.color = app.uColor;

  let normal: vec3<f32> = (app.uModel * vec4<f32>(inputs.normals, 0.0)).xyz;
  outputs.dirlightNormal = dirlight_setNormal(normal);
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  var fragColor = vec4(inputs.color, 1.);
  fragColor = dirlight_filterColor(fragColor, DirlightInputs(inputs.dirlightNormal));
  return fragColor;
}
`;

const vs = /* glsl */ `\
#version 300 es

in vec3 positions;
in vec3 normals;

uniform appUniforms {
  vec3 uColor;
  mat4 uModel;
  mat4 uView;
  mat4 uProjection;
} app;

out vec3 color;

void main(void) {
  vec3 normal = vec3(app.uModel * vec4(normals, 0.0));

  // Set up data for modules
  color = app.uColor;
  dirlight_setNormal(normal);
  gl_Position = app.uProjection * app.uView * app.uModel * vec4(positions, 1.0);
}
`;

const fs = /* glsl */ `\
#version 300 es

precision highp float;

in vec3 color;
out vec4 fragColor;

void main(void) {
  fragColor = vec4(color, 1.);
  fragColor = dirlight_filterColor(fragColor);
}
`;

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = `\
Key frame animation based on multiple hierarchical timelines.
<button id="play">Play</button>
<button id="pause">Pause</button><BR>
Time: <input type="range" id="time" min="0" max="30000" step="1"><BR>
`;

  readonly translations = [
    [2, -2, 0],
    [2, 2, 0],
    [-2, 2, 0],
    [-2, -2, 0]
  ];

  readonly rotations = [
    [random(), random(), random()],
    [random(), random(), random()],
    [random(), random(), random()],
    [random(), random(), random()]
  ];

  readonly colors = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
    [1, 1, 0]
  ];

  readonly keyFrameData: [number, number][] = [
    [0, 0],
    [1000, 2 * Math.PI],
    [2000, Math.PI],
    [3000, 2 * Math.PI],
    [4000, 0]
  ];

  timeline: Timeline;
  timeSlider;

  cubes: {
    translation: number[];
    rotation: number[];
    keyFrames: KeyFrames<number>;
    model: Model;
    uniformStore: UniformStore<{app: AppUniforms}>;
  }[];

  globalUniformStore = new UniformStore<{dirlight: typeof dirlight.uniforms}>({
    dirlight
  });

  constructor({device, aspect, animationLoop}: AnimationProps) {
    super();

    const playButton = document.getElementById('play');
    const pauseButton = document.getElementById('pause');
    this.timeSlider = document.getElementById('time');

    if (playButton && pauseButton) {
      playButton.addEventListener('click', () => this.timeline.play());
      pauseButton.addEventListener('click', () => this.timeline.pause());
      this.timeSlider.addEventListener('input', event =>
        this.timeline.setTime(parseFloat(event.target.value))
      );
    }

    this.timeline = new Timeline();
    animationLoop.attachTimeline(this.timeline);
    this.timeline.play();

    const channels = [
      this.timeline.addChannel({delay: 2000, rate: 0.5, duration: 8000, repeat: 2}),
      this.timeline.addChannel({delay: 10000, rate: 0.2, duration: 20000, repeat: 1}),
      this.timeline.addChannel({
        delay: 7000,
        rate: 1,
        duration: 4000,
        repeat: 8
      }),
      this.timeline.addChannel({
        delay: 0,
        rate: 0.8,
        duration: 5000,
        repeat: Number.POSITIVE_INFINITY
      })
    ];

    this.cubes = new Array(4);

    const keyFrames = [
      new KeyFrames(this.keyFrameData),
      new KeyFrames(this.keyFrameData),
      new KeyFrames(this.keyFrameData),
      new KeyFrames(this.keyFrameData)
    ];

    for (let i = 0; i < 4; ++i) {
      this.timeline.attachAnimation(keyFrames[i], channels[i]);

      const cubeUniformStore = new UniformStore<{app: AppUniforms}>({app});

      cubeUniformStore.setUniforms({
        app: {
          uProjection: new Matrix4().perspective({fovy: radians(60), aspect, near: 1, far: 20.0}),
          uView: new Matrix4().lookAt({
            center: [0, 0, 0],
            eye: [0, 0, -8]
          }),
          uColor: this.colors[i]
        }
      });

      this.cubes[i] = {
        uniformStore: cubeUniformStore,
        translation: this.translations[i],
        rotation: this.rotations[i],
        keyFrames: keyFrames[i],
        model: new Model(device, {
          id: `cube-${i}`,
          source,
          vs,
          fs,
          instanceCount: 1,
          modules: [dirlight],
          geometry: new CubeGeometry(),
          parameters: {
            depthWriteEnabled: true,
            depthCompare: 'less-equal'
          },
          bindings: {
            app: cubeUniformStore.getManagedUniformBuffer(device, 'app'),
            dirlight: this.globalUniformStore.getManagedUniformBuffer(device, 'dirlight')
          }
        })
      };
    }
  }

  onFinalize() {
    for (const cube of this.cubes) {
      cube.model.destroy();
    }
  }

  onRender({device}) {
    if (this.timeSlider) {
      this.timeSlider.value = this.timeline.getTime();
    }

    const modelMatrix = new Matrix4();

    for (const cube of this.cubes) {
      const startRotation = cube.keyFrames.getStartData();
      const endRotation = cube.keyFrames.getEndData();
      const rotation = startRotation + cube.keyFrames.factor * (endRotation - startRotation);
      const rotationX = cube.rotation[0] + rotation;
      const rotationY = cube.rotation[1] + rotation;
      const rotationZ = cube.rotation[2];
      modelMatrix
        .identity()
        .translate(cube.translation)
        .rotateXYZ([rotationX, rotationY, rotationZ]);

      cube.uniformStore.setUniforms({
        app: {
          uModel: modelMatrix
        }
      });

      cube.uniformStore.updateUniformBuffers();
    }

    // Draw the cubes
    const renderPass = device.beginRenderPass({
      clearColor: [0, 0, 0, 1],
      clearDepth: true
    });
    for (const cube of this.cubes) {
      cube.model.draw(renderPass);
    }
    renderPass.end();
  }
}
