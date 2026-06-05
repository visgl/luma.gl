// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, Device} from '@luma.gl/core';
import type {AnimationProps, ModelProps} from '@luma.gl/engine';
import {
  AnimationLoopTemplate,
  CubeGeometry,
  Geometry,
  Timeline,
  Model,
  ShaderInputs,
  makeRandomGenerator,
  PickingManager,
  supportsIndexPicking,
  picking,
  colorPicking,
  indexPicking
} from '@luma.gl/engine';
import {dirlight, ShaderModule} from '@luma.gl/shadertools';
import {Matrix4, radians} from '@math.gl/core';
import {
  ColumnPanel,
  type Panel,
  type SettingsChangeDescriptor,
  type SettingsSchema
} from '@deck.gl-community/panels';
import {
  ExamplePanelManager,
  ExampleSettingsPanelManager,
  getChangedSetting,
  makeExamplePanelHostHtml,
  makeHtmlCustomPanel
} from '../../example-panels';

// INSTANCE CUBE

const random = makeRandomGenerator();

const WGSL_SHADER = /* wgsl */ `\

// APPLICATION

struct AppUniforms {
  modelMatrix: mat4x4<f32>,
  viewMatrix: mat4x4<f32>,
  projectionMatrix: mat4x4<f32>,
  geometryScale: f32,
  time: f32,
};

@group(0) @binding(auto) var<uniform> app : AppUniforms;

struct VertexInputs {
  @builtin(instance_index) instanceIndex : u32,
  // CUBE GEOMETRY
  @location(0) positions : vec4<f32>,
  @location(1) normals : vec3<f32>,
  // INSTANCED ATTRIBUTES
  @location(2) instanceOffsets : vec2<f32>,
  @location(3) instanceColors : vec4<f32>,
}

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) normal : vec3<f32>,
  @location(1) color : vec4<f32>,
  @interpolate(flat, either)
  @location(2) objectIndex : i32,
}

struct PickingFragmentOutputs {
  @location(0) fragColor : vec4<f32>,
  @location(1) pickingColor : vec2<i32>,
}

@vertex
fn vertexMain(inputs: VertexInputs) -> FragmentInputs {
  var outputs: FragmentInputs;

  // Vertex position (z coordinate undulates with time), and model rotates around center
  let delta = length(inputs.instanceOffsets);
  let offset = vec4<f32>(inputs.instanceOffsets, sin((app.time + delta) * 0.1) * 16.0, 0);
  let scaledPosition = vec4<f32>(inputs.positions.xyz * app.geometryScale, inputs.positions.w);
  outputs.Position = app.projectionMatrix * app.viewMatrix * (app.modelMatrix * scaledPosition + offset);

  outputs.normal = dirlight_setNormal((app.modelMatrix * vec4<f32>(inputs.normals, 0.0)).xyz);
  outputs.color = inputs.instanceColors;
  outputs.objectIndex = i32(inputs.instanceIndex);

  return outputs;
}

@fragment
fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4<f32> {
  var fragColor = inputs.color;
  fragColor = dirlight_filterColor(fragColor, DirlightInputs(inputs.normal));
  fragColor = picking_filterHighlightColor(fragColor, inputs.objectIndex);
  return fragColor;
}

@fragment
fn fragmentPicking(inputs: FragmentInputs) -> PickingFragmentOutputs {
  var outputs: PickingFragmentOutputs;
  outputs.fragColor = vec4<f32>(0.0, 0.0, 0.0, 0.0);
  outputs.pickingColor = picking_getPickingColor(inputs.objectIndex);
  return outputs;
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

uniform appUniforms {
  mat4 modelMatrix;
  mat4 viewMatrix;
  mat4 projectionMatrix;
  float geometryScale;
  float time;
} app;

out vec3 color;

void main(void) {
  color = instanceColors;

  vec3 normal = vec3(app.modelMatrix * vec4(normals, 1.0));
  dirlight_setNormal(normal);
  picking_setObjectIndex(0);

  // Vertex position (z coordinate undulates with time), and model rotates around center
  float delta = length(instanceOffsets);
  vec4 offset = vec4(instanceOffsets, sin((app.time + delta) * 0.1) * 16.0, 0);
  vec4 scaledPosition = vec4(positions * app.geometryScale, 1.0);
  gl_Position = app.projectionMatrix * app.viewMatrix * (app.modelMatrix * scaledPosition + offset);
}
`;

const FS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

in vec3 color;
out vec4 fragColor;

void main(void) {
  fragColor = vec4(color, 1.);
  fragColor = dirlight_filterColor(fragColor);
  fragColor = picking_filterColor(fragColor);
}
`;

const DEFAULT_INSTANCE_SIDE = 256;
const MAX_INSTANCE_SIDE = 2048;
const DEFAULT_INSTANCE_SPACING = 3;
const INSTANCE_SIDE_STORAGE_KEY = 'showcase-instancing-instance-side';
const INSTANCE_SIDE_OPTIONS = [DEFAULT_INSTANCE_SIDE, MAX_INSTANCE_SIDE];
const INSTANCE_SIDE_OPTION_SET = new Set(INSTANCE_SIDE_OPTIONS);

function getInstanceScale(instanceSide: number): number {
  return DEFAULT_INSTANCE_SIDE / instanceSide;
}

function getInstanceSpacing(instanceSide: number): number {
  return DEFAULT_INSTANCE_SPACING * getInstanceScale(instanceSide);
}

function formatInstanceCount(instanceSide: number): string {
  return (instanceSide * instanceSide).toLocaleString();
}

function loadStoredInstanceSide(): number {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_INSTANCE_SIDE;
  }

  const storedValue = Number(window.localStorage.getItem(INSTANCE_SIDE_STORAGE_KEY));
  return INSTANCE_SIDE_OPTION_SET.has(storedValue) ? storedValue : DEFAULT_INSTANCE_SIDE;
}

function storeInstanceSide(instanceSide: number): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  window.localStorage.setItem(INSTANCE_SIDE_STORAGE_KEY, String(instanceSide));
}

// Make a cube with 65K instances and attributes to control offset and color of each instance
class InstancedCube extends Model {
  // uniformBuffer: Buffer;
  instanceOffsetsBuffer: Buffer;
  instanceColorsBuffer: Buffer;

  constructor(device: Device, instanceSide: number, props?: Partial<ModelProps>) {
    const instanceCount = instanceSide * instanceSide;
    const instanceSpacing = getInstanceSpacing(instanceSide);

    const offsets = new Float32Array(instanceCount * 2);
    const halfSpan = ((-instanceSide + 1) * instanceSpacing) / 2;
    let offsetIndex = 0;
    for (let rowIndex = 0; rowIndex < instanceSide; rowIndex++) {
      const xOffset = halfSpan + rowIndex * instanceSpacing;
      for (let columnIndex = 0; columnIndex < instanceSide; columnIndex++) {
        offsets[offsetIndex++] = xOffset;
        offsets[offsetIndex++] = halfSpan + columnIndex * instanceSpacing;
      }
    }

    const colors = new Uint8Array(instanceCount * 4);
    for (let colorIndex = 0; colorIndex < colors.length; colorIndex += 4) {
      colors[colorIndex] = (random() * 0.75 + 0.25) * 255;
      colors[colorIndex + 1] = (random() * 0.75 + 0.25) * 255;
      colors[colorIndex + 2] = (random() * 0.75 + 0.25) * 255;
      colors[colorIndex + 3] = 255;
    }

    const offsetsBuffer = device.createBuffer(offsets);
    const colorsBuffer = device.createBuffer(colors);

    // Model
    super(device, {
      ...props,
      source: WGSL_SHADER,
      vs: VS_GLSL,
      fs: FS_GLSL,
      // @ts-expect-error Remove once npm package updated with new types
      modules: [dirlight, device.type === 'webgpu' ? indexPicking : colorPicking],
      instanceCount,
      geometry: new CubeGeometry({indices: true}),
      bufferLayout: [
        {name: 'instanceOffsets', format: 'float32x2'},
        {name: 'instanceColors', format: 'unorm8x4'}
      ],
      attributes: {
        // instanceSizes: device.createBuffer(new Float32Array([1])), // Constant attribute
        instanceOffsets: offsetsBuffer,
        instanceColors: colorsBuffer
      },
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal'
      }
    });

    this.instanceOffsetsBuffer = offsetsBuffer;
    this.instanceColorsBuffer = colorsBuffer;
  }

  createPickingModel(props?: Partial<ModelProps>): Model {
    const instanceBufferLayout = this.bufferLayout.filter(layout =>
      layout.name.startsWith('instance')
    );
    const instanceAttributes = {
      instanceOffsets: this.instanceOffsetsBuffer,
      instanceColors: this.instanceColorsBuffer
    };
    const cubeGeometry = new CubeGeometry({indices: true});
    const pickingGeometry = new Geometry({
      topology: 'triangle-list',
      indices: cubeGeometry.indices!,
      attributes: {
        positions: cubeGeometry.attributes.positions!,
        normals: cubeGeometry.attributes.normals!
      }
    });

    return new Model(this.device, {
      ...props,
      id: `${this.id}-picking`,
      source: WGSL_SHADER,
      vs: VS_GLSL,
      fs: FS_GLSL,
      fragmentEntryPoint: 'fragmentPicking',
      // @ts-expect-error Remove once npm package updated with new types
      modules: [dirlight, indexPicking],
      bufferLayout: instanceBufferLayout,
      instanceCount: this.instanceCount,
      geometry: pickingGeometry,
      attributes: instanceAttributes,
      colorAttachmentFormats: ['rgba8unorm', 'rg32sint'],
      depthStencilAttachmentFormat: 'depth24plus',
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
  geometryScale: number;
  time: number;
};

const app: ShaderModule<AppUniforms> = {
  name: 'app',
  uniformTypes: {
    modelMatrix: 'mat4x4<f32>',
    viewMatrix: 'mat4x4<f32>',
    projectionMatrix: 'mat4x4<f32>',
    geometryScale: 'f32',
    time: 'f32'
  }
};

export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();

  static props = {createFramebuffer: true, debug: true};

  device: Device;
  cube: InstancedCube;
  pickingCube: Model | null = null;
  instanceSide = loadStoredInstanceSide();
  readonly settingsPanel: ExampleSettingsPanelManager;
  readonly panels: ExamplePanelManager;
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

    this.device = device;
    this.timeline = new Timeline();
    animationLoop.attachTimeline(this.timeline);
    this.timeline.play();

    this.timelineChannels = {
      timeChannel: this.timeline.addChannel({rate: 0.01}),
      eyeXChannel: this.timeline.addChannel({rate: 0.0003}),
      eyeYChannel: this.timeline.addChannel({rate: 0.0004}),
      eyeZChannel: this.timeline.addChannel({rate: 0.0002})
    };

    this.cube = this.createCube();
    this.pickingCube = this.createPickingCube();

    this.picker = new PickingManager(device, {
      shaderInputs: this.shaderInputs,
      mode: 'auto'
    });
    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'showcase-instancing-settings',
      schema: makeInstancingSettingsSchema(),
      settings: {instanceSide: this.instanceSide},
      onSettingsChange: this.handleSettingsChange
    });
    this.panels = new ExamplePanelManager({panel: this.makePanel()});
    this.panels.mount();
  }

  onRender(animationProps: AnimationProps) {
    const {device, aspect, tick} = animationProps;
    const {timeChannel, eyeXChannel, eyeYChannel, eyeZChannel} = this.timelineChannels;

    this.shaderInputs.setProps({
      app: {
        geometryScale: getInstanceScale(this.instanceSide),
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
            (Math.cos(this.timeline.getTime(eyeXChannel)) * DEFAULT_INSTANCE_SIDE) / 2,
            (Math.sin(this.timeline.getTime(eyeYChannel)) * DEFAULT_INSTANCE_SIDE) / 2,
            ((Math.sin(this.timeline.getTime(eyeZChannel)) + 1) * DEFAULT_INSTANCE_SIDE) / 4 + 32
          ]
        }),
        // Rotate all the individual cubes
        modelMatrix: new Matrix4().rotateX(tick * 0.01).rotateY(tick * 0.013)
      }
    });
    this.shaderInputs.setProps({picking: {isActive: false}});

    const renderPass = device.beginRenderPass({
      clearColor: [0, 0, 0, 1],
      clearDepth: 1
    });

    this.cube.draw(renderPass);
    renderPass.end();

    this.pickInstance(animationProps._mousePosition);
  }

  onFinalize(animationProps: AnimationProps): void {
    this.settingsPanel.finalize();
    this.panels.finalize();
    this.picker.destroy();
    this.pickingCube?.destroy();
    this.cube.destroy();
  }

  pickInstance(mousePosition: number[] | null | undefined) {
    if (!this.picker.shouldPick(mousePosition as [number, number] | null)) {
      return;
    }

    const pickingCube = this.pickingCube || this.cube;
    const pickingPass = this.picker.beginRenderPass();
    pickingCube.draw(pickingPass);
    pickingPass.end();

    this.shaderInputs.setProps({picking: {isActive: false}});
    this.picker.updatePickInfo(mousePosition as [number, number]);
  }

  createCube(): InstancedCube {
    return new InstancedCube(this.device, this.instanceSide, {
      // @ts-ignore
      shaderInputs: this.shaderInputs
    });
  }

  createPickingCube(): Model | null {
    if (!supportsIndexPicking(this.device)) {
      return null;
    }

    return this.cube.createPickingModel({
      // @ts-ignore
      shaderInputs: this.shaderInputs
    });
  }

  private makePanel(): Panel {
    return new ColumnPanel({
      id: 'showcase-instancing-controls',
      title: 'Controls',
      panels: [
        makeHtmlCustomPanel({
          id: 'showcase-instancing-description',
          title: '',
          html: `\
          <p>A luma.gl <code>Cube</code>, rendering up to 4,194,304 instances in a single GPU draw call using instanced vertex attributes.</p>
          `
        }),
        this.settingsPanel.makePanel()
      ]
    });
  }

  private readonly handleSettingsChange = (
    _settings: Record<string, unknown>,
    changedSettings?: SettingsChangeDescriptor[]
  ): void => {
    const instanceSide = getChangedSetting(changedSettings, 'instanceSide')?.nextValue;
    if (typeof instanceSide === 'number') {
      this.handleInstanceSideChange(instanceSide);
    }
  };

  private handleInstanceSideChange(instanceSide: number): void {
    if (!INSTANCE_SIDE_OPTION_SET.has(instanceSide) || instanceSide === this.instanceSide) {
      return;
    }

    this.instanceSide = instanceSide;
    storeInstanceSide(instanceSide);
    this.pickingCube?.destroy();
    this.cube.destroy();
    this.cube = this.createCube();
    this.pickingCube = this.createPickingCube();
  }
}

function makeInstancingSettingsSchema(): SettingsSchema {
  return {
    title: 'Settings',
    sections: [
      {
        id: 'grid',
        name: 'Grid',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'instanceSide',
            label: 'Grid Size',
            type: 'select',
            persist: 'none',
            options: INSTANCE_SIDE_OPTIONS.map(instanceSide => ({
              label: `${instanceSide} x ${instanceSide} (${formatInstanceCount(instanceSide)} cubes)`,
              value: instanceSide
            }))
          }
        ]
      }
    ]
  };
}
