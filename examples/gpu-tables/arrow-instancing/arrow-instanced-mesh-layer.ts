// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {makeArrowFixedSizeListVector, makeArrowGPUTable} from '@luma.gl/arrow';
import {Device, type RenderPass, type ShaderLayout} from '@luma.gl/core';
import type {ModelProps} from '@luma.gl/engine';
import {
  CubeGeometry,
  Geometry,
  Model,
  ShaderInputs,
  makeRandomGenerator,
  PickingManager,
  supportsIndexPicking,
  picking,
  indexColorPicking,
  indexPicking
} from '@luma.gl/engine';
import {dirlight, ShaderModule} from '@luma.gl/shadertools';
import {GPUTable, GPUTableModel} from '@luma.gl/tables';
import {Matrix4} from '@math.gl/core';
import * as arrow from 'apache-arrow';

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
  @location(2) instancePositions : vec2<f32>,
  @location(3) instanceColors : vec4<f32>,
}

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) normal : vec3<f32>,
  @location(1) color : vec4<f32>,
  @interpolate(flat)
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
  let delta = length(inputs.instancePositions);
  let offset = vec4<f32>(inputs.instancePositions, sin((app.time + delta) * 0.1) * 16.0, 0);
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

in vec2 instancePositions;
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
  float delta = length(instancePositions);
  vec4 offset = vec4(instancePositions, sin((app.time + delta) * 0.1) * 16.0, 0);
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

export const DEFAULT_INSTANCES_PER_SIDE = 256;
const MAX_INSTANCES_PER_SIDE = 2048;
const DEFAULT_INSTANCE_SPACING = 3;
export const INSTANCES_PER_SIDE_OPTIONS = [DEFAULT_INSTANCES_PER_SIDE, MAX_INSTANCES_PER_SIDE];

type InstanceArrowTable = arrow.Table<{
  instancePositions: arrow.FixedSizeList<arrow.Float32>;
  instanceColors: arrow.FixedSizeList<arrow.Uint8>;
}>;

const CUBE_SHADER_LAYOUT = {
  attributes: [
    {name: 'positions', location: 0, type: 'vec4<f32>'},
    {name: 'normals', location: 1, type: 'vec3<f32>'},
    {name: 'instancePositions', location: 2, type: 'vec2<f32>', stepMode: 'instance'},
    {name: 'instanceColors', location: 3, type: 'vec4<f32>', stepMode: 'instance'}
  ],
  bindings: []
} satisfies ShaderLayout;

function makeInstanceArrowTable(instancesPerSide: number): InstanceArrowTable {
  const instanceCount = instancesPerSide * instancesPerSide;
  const instanceSpacing =
    DEFAULT_INSTANCE_SPACING * (DEFAULT_INSTANCES_PER_SIDE / instancesPerSide);

  const offsets = new Float32Array(instanceCount * 2);
  const halfSpan = ((-instancesPerSide + 1) * instanceSpacing) / 2;
  let offsetIndex = 0;
  // Center a square grid around the origin and store each instance as an [x, y] offset.
  for (let rowIndex = 0; rowIndex < instancesPerSide; rowIndex++) {
    const xOffset = halfSpan + rowIndex * instanceSpacing;
    for (let columnIndex = 0; columnIndex < instancesPerSide; columnIndex++) {
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

  return new arrow.Table({
    instancePositions: makeArrowFixedSizeListVector(new arrow.Float32(), 2, offsets),
    instanceColors: makeArrowFixedSizeListVector(new arrow.Uint8(), 4, colors)
  });
}

// Make a cube with 65K instances and attributes to control offset and color of each instance
class InstancedCube extends GPUTableModel {
  private instanceTable: GPUTable;

  constructor(device: Device, instancesPerSide: number, props?: Partial<ModelProps>) {
    const instanceArrowTable = makeInstanceArrowTable(instancesPerSide);
    const instanceTable = makeArrowGPUTable(device, instanceArrowTable, {
      shaderLayout: CUBE_SHADER_LAYOUT
    });

    // Model
    super(device, {
      ...props,
      table: instanceTable,
      tableCount: 'instance',
      shaderLayout: CUBE_SHADER_LAYOUT,
      source: WGSL_SHADER,
      vs: VS_GLSL,
      fs: FS_GLSL,
      // @ts-expect-error Remove once npm package updated with new types
      modules: [dirlight, supportsIndexPicking(device) ? indexPicking : indexColorPicking],
      geometry: new CubeGeometry({indices: true}),
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal'
      }
    });
    this.instanceTable = instanceTable;
  }

  setInstanceTable(instanceArrowTable: InstanceArrowTable): void {
    const nextInstanceTable = makeArrowGPUTable(this.device, instanceArrowTable, {
      shaderLayout: CUBE_SHADER_LAYOUT
    });
    const previousInstanceTable = this.instanceTable;
    this.setProps({table: nextInstanceTable});
    this.instanceTable = nextInstanceTable;
    previousInstanceTable.destroy();
  }

  createPickingModel(props?: Partial<ModelProps>): Model {
    const instanceBufferLayout = this.bufferLayout.filter(layout =>
      layout.name.startsWith('instance')
    );
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
      attributes: this.table!.attributes,
      colorAttachmentFormats: ['rgba8unorm', 'rg32sint'],
      depthStencilAttachmentFormat: 'depth24plus',
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal'
      }
    });
  }

  override destroy(): void {
    super.destroy();
    this.instanceTable.destroy();
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

export type ArrowInstancedMeshLayerProps = {
  instancesPerSide?: number;
};

export type ArrowInstancedMeshLayerUniforms = {
  modelMatrix: Matrix4;
  viewMatrix: Matrix4;
  projectionMatrix: Matrix4;
  geometryScale: number;
  time: number;
};

export class ArrowInstancedMeshLayer {
  readonly device: Device;
  readonly picker: PickingManager;
  cube: InstancedCube;
  pickingCube: Model | null = null;
  instancesPerSide: number;

  readonly shaderInputs = new ShaderInputs<{
    app: typeof app.props;
    dirlight: typeof dirlight.props;
    picking: typeof picking.props;
  }>({
    app,
    dirlight,
    picking
  });

  constructor(device: Device, props: ArrowInstancedMeshLayerProps = {}) {
    this.device = device;
    this.instancesPerSide = props.instancesPerSide ?? DEFAULT_INSTANCES_PER_SIDE;
    this.cube = this.createCube();
    this.pickingCube = this.createPickingCube();
    this.picker = new PickingManager(device, {
      shaderInputs: this.shaderInputs,
      mode: 'auto'
    });
  }

  setProps(props: ArrowInstancedMeshLayerProps): void {
    if (props.instancesPerSide === undefined || props.instancesPerSide === this.instancesPerSide) {
      return;
    }
    this.instancesPerSide = props.instancesPerSide;
    this.cube.setInstanceTable(makeInstanceArrowTable(props.instancesPerSide));
    if (this.pickingCube) {
      this.pickingCube.setAttributes(this.cube.table!.attributes);
      this.pickingCube.setInstanceCount(this.cube.instanceCount);
    }
  }

  draw(renderPass: RenderPass, uniforms: ArrowInstancedMeshLayerUniforms): void {
    this.shaderInputs.setProps({
      app: uniforms
    });
    this.shaderInputs.setProps({picking: {isActive: false}});
    this.cube.draw(renderPass);
  }

  destroy(): void {
    this.picker.destroy();
    this.pickingCube?.destroy();
    this.cube.destroy();
  }

  pick(mousePosition: number[] | null | undefined): void {
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
    return new InstancedCube(this.device, this.instancesPerSide, {
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

  setNeedsRedraw(_reason: string): void {}

  needsRedraw(): false {
    return false;
  }
}
