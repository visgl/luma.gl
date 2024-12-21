// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device} from '@luma.gl/core';
import type {AnimationProps, ModelProps} from '@luma.gl/engine';
import {
  AnimationLoopTemplate,
  CubeGeometry,
  Timeline,
  Model,
  ShaderInputs,
  makeRandomGenerator,
  PickingManager,
  indexPicking as picking
} from '@luma.gl/engine';
import {dirlight, ShaderModule} from '@luma.gl/shadertools';
import {Matrix4, radians} from '@math.gl/core';

// INSTANCE CUBE

const random = makeRandomGenerator();

const WGSL_SHADER = /* wgsl */ `\

// APPLICATION

struct AppUniforms {
  modelMatrix: mat4x4<f32>,
  viewMatrix: mat4x4<f32>,
  projectionMatrix: mat4x4<f32>,
  time: f32,
};

@group(0) @binding(0) var<uniform> app : AppUniforms;

struct VertexInputs {
  // CUBE GEOMETRY
  @location(0) positions : vec4<f32>,
  @location(1) normals : vec3<f32>,
  // INSTANCED ATTRIBUTES
  @location(2) instanceOffsets : vec2<f32>,
  @location(3) instanceColors : vec4<f32>,
  @location(4) instanceIndexes : vec2<f32>,
}

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) normal : vec3<f32>,
  @location(1) color : vec4<f32>,
}

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs: FragmentInputs;

  // Vertex position (z coordinate undulates with time), and model rotates around center
  let delta = length(inputs.instanceOffsets);
  let offset = vec4<f32>(inputs.instanceOffsets, sin((app.time + delta) * 0.1) * 16.0, 0);
  outputs.Position = app.projectionMatrix * app.viewMatrix * (app.modelMatrix * inputs.positions + offset);

  outputs.normal = dirlight_setNormal((app.modelMatrix * vec4<f32>(inputs.normals, 0.0)).xyz);
  outputs.color = inputs.instanceColors;

  // vec4 pickColor = vec4(0., instanceIndexes, 1.0);
  // picking_setPickingColor(0);
  
  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  var fragColor = inputs.color;
  fragColor = dirlight_filterColor(fragColor, DirlightInputs(inputs.normal));
  return fragColor;
}
`;

// GLSL

const VS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

in vec3 positions;
in vec3 normals;

in vec2 instanceOffsets;
in vec3 instanceColors;
in int instanceIndexes;

uniform appUniforms {
  mat4 modelMatrix;
  mat4 viewMatrix;
  mat4 projectionMatrix;
  float time;
} app;

out vec3 color;

void main(void) {
  color = instanceColors;

  vec3 normal = vec3(app.modelMatrix * vec4(normals, 1.0));
  dirlight_setNormal(normal);
  picking_setObjectIndex(instanceIndexes);

  // Vertex position (z coordinate undulates with time), and model rotates around center
  float delta = length(instanceOffsets);
  vec4 offset = vec4(instanceOffsets, sin((app.time + delta) * 0.1) * 16.0, 0);
  gl_Position = app.projectionMatrix * app.viewMatrix * (app.modelMatrix * vec4(positions * 1., 1.0) + offset);
}
`;

const FS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

in vec3 color;
layout(location=0) out vec4 fragColor;
layout(location=1) out ivec4 pickingColor;

void main(void) {
  pickingColor = picking_getPickingColor();

  fragColor = vec4(color, 1.);
  fragColor = dirlight_filterColor(fragColor);
  fragColor = picking_filterColor(fragColor);
}
`;

const SIDE = 256;

// Make a cube with 65K instances and attributes to control offset and color of each instance
class InstancedCube extends Model {
  // uniformBuffer: Buffer;

  constructor(device: Device, props?: Partial<ModelProps>) {
    const offsets = [];
    for (let i = 0; i < SIDE; i++) {
      const x = ((-SIDE + 1) * 3) / 2 + i * 3;
      for (let j = 0; j < SIDE; j++) {
        const y = ((-SIDE + 1) * 3) / 2 + j * 3;
        offsets.push(x, y);
      }
    }

    const offsets32 = new Float32Array(offsets);

    const colors = new Uint8Array(SIDE * SIDE * 4).map((n, i) => (random() * 0.75 + 0.25) * 255);
    for (let i = 0; i < colors.length; i += 4) {
      colors[i + 3] = 255;
    }

    const indexes = new Int32Array(SIDE * SIDE).fill(0).map((_, i) => i);

    const offsetsBuffer = device.createBuffer(offsets32);
    const colorsBuffer = device.createBuffer(colors);
    const indexesBuffer = device.createBuffer(indexes);

    // Model
    super(device, {
      ...props,
      source: WGSL_SHADER,
      vs: VS_GLSL,
      fs: FS_GLSL,
      // @ts-expect-error Remove once npm package updated with new types
      modules: device.info.type !== 'webgpu' ? [dirlight, picking] : [dirlight],
      instanceCount: SIDE * SIDE,
      geometry: new CubeGeometry({indices: true}),
      bufferLayout: [
        {name: 'instanceOffsets', format: 'float32x2'},
        {name: 'instanceColors', format: 'unorm8x4'},
        {name: 'instanceIndexes', format: 'sint32'}
      ],
      attributes: {
        // instanceSizes: device.createBuffer(new Float32Array([1])), // Constant attribute
        instanceOffsets: offsetsBuffer,
        instanceColors: colorsBuffer,
        instanceIndexes: indexesBuffer
      },
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal'
      }
    });
  }
}

type AppUniforms = {
  modelMatrix: Matrix4;
  viewMatrix: Matrix4;
  projectionMatrix: Matrix4;
  time: number;
};

const app: ShaderModule<AppUniforms> = {
  name: 'app',
  uniformTypes: {
    modelMatrix: 'mat4x4<f32>',
    viewMatrix: 'mat4x4<f32>',
    projectionMatrix: 'mat4x4<f32>',
    time: 'f32'
  }
};

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = `\
  <p>
  A luma.gl <code>Cube</code>, rendering 65,536 instances in a
  single GPU draw call using instanced vertex attributes.
  </P>
  `;

  static props = {createFramebuffer: true, debug: true};

  cube: InstancedCube;
  timeline: Timeline;
  timelineChannels: Record<string, number>;
  picker: PickingManager;

  shaderInputs = new ShaderInputs<{
    app: typeof app.props;
    dirlight: typeof dirlight.props;
    picking: typeof picking.props;
  }>({
    app,
    dirlight,
    picking
  });

  constructor({device, animationLoop}: AnimationProps) {
    super();

    this.timeline = new Timeline();
    animationLoop.attachTimeline(this.timeline);
    this.timeline.play();

    this.timelineChannels = {
      timeChannel: this.timeline.addChannel({rate: 0.01}),
      eyeXChannel: this.timeline.addChannel({rate: 0.0003}),
      eyeYChannel: this.timeline.addChannel({rate: 0.0004}),
      eyeZChannel: this.timeline.addChannel({rate: 0.0002})
    };

    this.cube = new InstancedCube(device, {
      // @ts-ignore
      shaderInputs: this.shaderInputs
    });

    this.picker = new PickingManager(device, {
      shaderInputs: this.shaderInputs
    });
  }

  onRender(animationProps: AnimationProps) {
    const {device, aspect, tick} = animationProps;
    const {_mousePosition} = animationProps;
    const {timeChannel, eyeXChannel, eyeYChannel, eyeZChannel} = this.timelineChannels;

    this.shaderInputs.setProps({
      app: {
        time: this.timeline.getTime(timeChannel),
        // Basic projection matrix
        projectionMatrix: new Matrix4().perspective({
          fovy: radians(60),
          aspect,
          near: 1,
          far: 2048.0
        }),
        // Move the eye around the plane
        viewMatrix: new Matrix4().lookAt({
          center: [0, 0, 0],
          eye: [
            (Math.cos(this.timeline.getTime(eyeXChannel)) * SIDE) / 2,
            (Math.sin(this.timeline.getTime(eyeYChannel)) * SIDE) / 2,
            ((Math.sin(this.timeline.getTime(eyeZChannel)) + 1) * SIDE) / 4 + 32
          ]
        }),
        // Rotate all the individual cubes
        modelMatrix: new Matrix4().rotateX(tick * 0.01).rotateY(tick * 0.013)
      }
    });

    this.pickInstance(_mousePosition);

    // Draw the cubes
    const renderPass = device.beginRenderPass({
      clearColor: [0, 0, 0, 1],
      clearDepth: 1
    });

    this.cube.draw(renderPass);
    renderPass.end();
  }

  onFinalize(animationProps: AnimationProps): void {
    this.cube.destroy();
  }

  pickInstance(mousePosition: number[] | null | undefined) {
    if (this.picker.device.type !== 'webgl') {
      return;
    }

    if (!mousePosition) {
      this.picker.clearPickState();
      return;
    }
    const pickingPass = this.picker.beginRenderPass();
    this.cube.draw(pickingPass);
    pickingPass.end();

    this.picker.getPickInfo(mousePosition as [number, number]);
  }
}
