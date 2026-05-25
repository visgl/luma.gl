// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  expandArrowVector,
  makeArrowGPUTable,
  makeArrowGPUVector,
  makeArrowFixedSizeListVector,
  makeArrowMatrix4x4Vector,
  makeGPUGeometryFromArrow,
  type ArrowTableGeometry,
  type ArrowMeshTable
} from '@luma.gl/arrow';
import {GPUTable, GPUTableModel, GPUVector} from '@luma.gl/tables';
import type {Device, ShaderLayout} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {
  CubeGeometry,
  PickingManager,
  ShaderInputs,
  indexColorPicking,
  indexPicking,
  supportsIndexPicking
} from '@luma.gl/engine';
import type {ShaderModule} from '@luma.gl/shadertools';
import {Matrix4, radians} from '@math.gl/core';
import * as arrow from 'apache-arrow';

const FACE_NAMES = ['Front', 'Back', 'Top', 'Bottom', 'Right', 'Left'] as const;
const CUBE_COLUMNS = 3;
const CUBE_ROWS = 2;
const CUBE_COUNT = CUBE_COLUMNS * CUBE_ROWS;
export const ARROW_MESH_GEOMETRY_CUBE_COUNT = CUBE_COUNT;
const MATRIX_COMPONENT_COUNT = 16;
const MATRIX_ARROW_PATHS = {
  matrixColumn0: 'matrix',
  matrixColumn1: 'matrix',
  matrixColumn2: 'matrix',
  matrixColumn3: 'matrix'
};

const WGSL_SHADER = /* wgsl */ `\
struct AppUniforms {
  viewMatrix : mat4x4<f32>,
  projectionMatrix : mat4x4<f32>,
};

@group(0) @binding(auto) var<uniform> app : AppUniforms;
@group(0) @binding(auto) var<storage, read> faceColors : array<vec4<f32>>;
@group(0) @binding(auto) var<storage, read> matrix : array<mat4x4<f32>>;

struct VertexInputs {
  @builtin(instance_index) instanceIndex : u32,
  @location(0) positions : vec3<f32>,
  @location(1) faceIndex : u32,
};

struct FragmentInputs {
  @builtin(position) Position : vec4<f32>,
  @location(0) color : vec4<f32>,
  @interpolate(flat)
  @location(1) objectIndex : i32,
};

struct PickingFragmentOutputs {
  @location(0) fragColor : vec4<f32>,
  @location(1) pickingColor : vec2<i32>,
};

@vertex
fn vertexMain(inputs : VertexInputs) -> FragmentInputs {
  let modelMatrix = matrix[inputs.instanceIndex];
  var outputs : FragmentInputs;
  outputs.Position =
    app.projectionMatrix *
    app.viewMatrix *
    modelMatrix *
    vec4<f32>(inputs.positions, 1.0);
  outputs.color = faceColors[inputs.faceIndex];
  outputs.objectIndex = i32(inputs.instanceIndex * ${FACE_NAMES.length}u + inputs.faceIndex);
  return outputs;
}

@fragment
fn fragmentMain(inputs : FragmentInputs) -> @location(0) vec4<f32> {
  return picking_filterHighlightColor(inputs.color, inputs.objectIndex);
}

@fragment
fn fragmentPicking(inputs : FragmentInputs) -> PickingFragmentOutputs {
  var outputs : PickingFragmentOutputs;
  outputs.fragColor = vec4<f32>(0.0, 0.0, 0.0, 0.0);
  outputs.pickingColor = picking_getPickingColor(inputs.objectIndex);
  return outputs;
}
`;

const VS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;

uniform appUniforms {
  mat4 viewMatrix;
  mat4 projectionMatrix;
} app;

in vec3 positions;
in vec4 colors;
in uint faceIndices;
in vec4 matrixColumn0;
in vec4 matrixColumn1;
in vec4 matrixColumn2;
in vec4 matrixColumn3;

out vec4 vColor;

void main(void) {
  mat4 modelMatrix = mat4(
    matrixColumn0,
    matrixColumn1,
    matrixColumn2,
    matrixColumn3
  );
  gl_Position =
    app.projectionMatrix *
    app.viewMatrix *
    modelMatrix *
    vec4(positions, 1.0);
  vColor = colors;
  picking_setObjectIndex(gl_InstanceID * ${FACE_NAMES.length} + int(faceIndices));
}
`;

const FS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;

in vec4 vColor;
out vec4 fragColor;

void main(void) {
  fragColor = picking_filterColor(vColor);
}
`;

const PICKING_FS_GLSL = /* glsl */ `\
#version 300 es
precision highp float;
precision highp int;

layout(location = 0) out vec4 fragColor;
layout(location = 1) out ivec4 pickingColor;

void main(void) {
  fragColor = vec4(0.0);
  pickingColor = picking_getPickingColor();
}
`;

type AppUniforms = {
  viewMatrix: Matrix4;
  projectionMatrix: Matrix4;
};

const app: ShaderModule<AppUniforms> = {
  name: 'app',
  uniformTypes: {
    viewMatrix: 'mat4x4<f32>',
    projectionMatrix: 'mat4x4<f32>'
  }
};

const WEBGPU_MESH_SHADER_LAYOUT = {
  attributes: [
    {name: 'positions', location: 0, type: 'vec3<f32>'},
    {name: 'faceIndex', location: 1, type: 'u32'}
  ],
  bindings: [{name: 'matrix', type: 'read-only-storage', group: 0, location: 2}]
} satisfies ShaderLayout;

const WEBGL_MESH_SHADER_LAYOUT = {
  attributes: [
    {name: 'positions', location: 0, type: 'vec3<f32>'},
    {name: 'colors', location: 1, type: 'vec4<f32>'},
    {name: 'faceIndices', location: 2, type: 'u32'},
    {name: 'matrixColumn0', location: 3, type: 'vec4<f32>', stepMode: 'instance'},
    {name: 'matrixColumn1', location: 4, type: 'vec4<f32>', stepMode: 'instance'},
    {name: 'matrixColumn2', location: 5, type: 'vec4<f32>', stepMode: 'instance'},
    {name: 'matrixColumn3', location: 6, type: 'vec4<f32>', stepMode: 'instance'}
  ],
  bindings: []
} satisfies ShaderLayout;

type CubeTransform = {
  translation: [number, number, number];
  rotation: [number, number, number];
  rotationRate: [number, number, number];
  scale: [number, number, number];
  matrix: Matrix4;
};

export class ArrowMeshGeometryLayer {
  readonly device: Device;
  readonly geometry: ArrowTableGeometry;
  readonly model: GPUTableModel;
  readonly pickingModel: GPUTableModel | null;
  readonly matrixTable: GPUTable;
  readonly picker: PickingManager;
  readonly faceColors?: GPUVector<arrow.FixedSizeList<arrow.Float32>>;
  readonly faceNames: arrow.Vector<arrow.Utf8>;
  readonly matrixValues = new Float32Array(CUBE_COUNT * MATRIX_COMPONENT_COUNT);
  readonly cubeTransforms = makeCubeTransforms();
  readonly shaderInputs = new ShaderInputs<{
    app: typeof app.props;
    picking: typeof indexPicking.props;
  }>({app, picking: indexPicking});

  constructor(device: Device) {
    this.device = device;
    this.shaderInputs.setProps({picking: {indexMode: 'attribute', batchIndex: 0}});

    const faceMetadata = makeFaceMetadataTable();
    const faceColors = faceMetadata.getChild('COLOR_0') as arrow.Vector<
      arrow.FixedSizeList<arrow.Float32>
    >;
    const arrowMesh = makeArrowMeshTable(device.type, faceColors);
    this.faceNames = faceMetadata.getChild('name') as arrow.Vector<arrow.Utf8>;
    this.faceColors =
      device.type === 'webgpu'
        ? makeArrowGPUVector(device, faceColors, {name: 'faceColors'})
        : undefined;

    this.updateInstanceMatrices(0);
    this.geometry = makeGPUGeometryFromArrow(device, {arrowMesh});
    this.matrixTable = makeArrowGPUTable(device, makeInstanceArrowTable(this.matrixValues), {
      shaderLayout: device.type === 'webgpu' ? WEBGPU_MESH_SHADER_LAYOUT : WEBGL_MESH_SHADER_LAYOUT,
      arrowPaths: MATRIX_ARROW_PATHS
    });
    this.model = new GPUTableModel(device, {
      id: 'arrow-mesh-geometry',
      geometry: this.geometry,
      table: this.matrixTable,
      tableCount: 'instance',
      source: WGSL_SHADER,
      vs: VS_GLSL,
      fs: FS_GLSL,
      shaderLayout: device.type === 'webgpu' ? WEBGPU_MESH_SHADER_LAYOUT : WEBGL_MESH_SHADER_LAYOUT,
      shaderInputs: this.shaderInputs,
      modules: [supportsIndexPicking(device) ? indexPicking : indexColorPicking] as ShaderModule[],
      ...(this.faceColors ? {bindings: {faceColors: this.faceColors.buffer}} : {}),
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal'
      }
    });
    this.pickingModel = supportsIndexPicking(device) ? this.createPickingModel() : null;
    this.picker = new PickingManager(device, {
      shaderInputs: this.shaderInputs,
      mode: 'auto',
      getTooltip: ({batchIndex, objectIndex}) => {
        if (batchIndex === null || objectIndex === null) {
          return null;
        }
        const cubeIndex = Math.floor(objectIndex / FACE_NAMES.length);
        const faceIndex = objectIndex % FACE_NAMES.length;
        const faceName = this.faceNames.get(faceIndex);
        return typeof faceName === 'string' ? `Cube ${cubeIndex + 1}, ${faceName} face` : null;
      }
    });
  }

  draw({aspect, device, tick, _mousePosition}: AnimationProps): void {
    this.updateInstanceMatrices(tick);
    this.shaderInputs.setProps({
      app: {
        viewMatrix: new Matrix4().lookAt({eye: [6.4, 4.8, 7.4], center: [0, 0, 0]}),
        projectionMatrix: new Matrix4().perspective({
          fovy: radians(60),
          aspect,
          near: 0.1,
          far: 30
        })
      }
    });
    this.shaderInputs.setProps({picking: {isActive: false, batchIndex: 0}});

    const renderPass = device.beginRenderPass({
      clearColor: [0.03, 0.04, 0.08, 1],
      clearDepth: 1
    });
    this.model.draw(renderPass);
    renderPass.end();
    this.pickFace(_mousePosition);
  }

  destroy(): void {
    this.picker.destroy();
    this.pickingModel?.destroy();
    this.model.destroy();
    this.matrixTable.destroy();
    this.faceColors?.destroy();
  }

  updateInstanceMatrices(tick: number): void {
    for (const [cubeIndex, cubeTransform] of this.cubeTransforms.entries()) {
      cubeTransform.rotation[0] += cubeTransform.rotationRate[0];
      cubeTransform.rotation[1] += cubeTransform.rotationRate[1];
      cubeTransform.rotation[2] += cubeTransform.rotationRate[2];
      cubeTransform.matrix
        .identity()
        .translate([
          cubeTransform.translation[0],
          cubeTransform.translation[1],
          cubeTransform.translation[2] + Math.sin(tick * 0.01 + cubeIndex) * 0.3
        ])
        .rotateXYZ(cubeTransform.rotation)
        .scale(cubeTransform.scale);

      const matrixOffset = cubeIndex * MATRIX_COMPONENT_COUNT;
      for (let matrixComponent = 0; matrixComponent < MATRIX_COMPONENT_COUNT; matrixComponent++) {
        this.matrixValues[matrixOffset + matrixComponent] = cubeTransform.matrix[matrixComponent];
      }
    }

    this.matrixTable?.gpuVectors.matrix?.buffer.write(this.matrixValues);
  }

  pickFace(mousePosition: number[] | null | undefined): void {
    if (!this.picker.shouldPick(mousePosition as [number, number] | null)) {
      return;
    }

    const pickingPass = this.picker.beginRenderPass();
    this.shaderInputs.setProps({picking: {batchIndex: 0}});
    (this.pickingModel ?? this.model).draw(pickingPass);
    pickingPass.end();
    this.shaderInputs.setProps({picking: {isActive: false}});
    void this.picker.updatePickInfo(mousePosition as [number, number]);
  }

  createPickingModel(): GPUTableModel {
    if (!this.model.table) {
      throw new Error('Matrices picking requires prepared instance Arrow data');
    }
    return new GPUTableModel(this.device, {
      id: `${this.model.id || 'arrow-mesh-geometry'}-picking`,
      geometry: this.geometry,
      table: this.model.table,
      tableCount: 'instance',
      source: WGSL_SHADER,
      vs: VS_GLSL,
      fs: PICKING_FS_GLSL,
      fragmentEntryPoint: 'fragmentPicking',
      modules: [indexPicking] as ShaderModule[],
      shaderLayout:
        this.device.type === 'webgpu' ? WEBGPU_MESH_SHADER_LAYOUT : WEBGL_MESH_SHADER_LAYOUT,
      ...(this.faceColors ? {bindings: {faceColors: this.faceColors.buffer}} : {}),
      shaderInputs: this.shaderInputs,
      colorAttachmentFormats: ['rgba8unorm', 'rg32sint'],
      depthStencilAttachmentFormat: 'depth24plus',
      parameters: {
        depthWriteEnabled: true,
        depthCompare: 'less-equal'
      }
    });
  }
}

function makeArrowMeshTable(
  deviceType: AnimationProps['device']['type'],
  faceColors: arrow.Vector<arrow.FixedSizeList<arrow.Float32>>
): ArrowMeshTable {
  const cubeGeometry = new CubeGeometry({indices: true});
  const cubePositions = cubeGeometry.attributes.positions?.value;
  const cubeFaceIndices = cubeGeometry.attributes.faceIndex?.value;
  const cubeIndices = cubeGeometry.indices?.value;

  if (!(cubePositions instanceof Float32Array)) {
    throw new Error('Matrices requires CubeGeometry positions');
  }
  if (!(cubeFaceIndices instanceof Uint32Array)) {
    throw new Error('Matrices requires CubeGeometry faceIndex values');
  }
  if (!(cubeIndices instanceof Uint16Array) && !(cubeIndices instanceof Uint32Array)) {
    throw new Error('Matrices requires CubeGeometry indices');
  }

  const positions = makeArrowFixedSizeListVector(new arrow.Float32(), 3, cubePositions);
  const table =
    deviceType === 'webgpu'
      ? makeWebGPUMeshTable(positions, cubeFaceIndices)
      : makeWebGLMeshTable(
          positions,
          expandArrowVector(faceColors, cubeFaceIndices),
          cubeFaceIndices
        );

  return {
    shape: 'arrow-table',
    topology: 'triangle-list',
    indices: {
      value: cubeIndices,
      size: 1
    },
    data: table
  };
}

function makeWebGPUMeshTable(
  positions: arrow.Vector<arrow.FixedSizeList<arrow.Float32>>,
  faceIndices: Uint32Array
): arrow.Table {
  const schema = new arrow.Schema([
    new arrow.Field(
      'POSITION',
      new arrow.FixedSizeList(3, new arrow.Field('value', new arrow.Float32(), false)),
      false
    ),
    new arrow.Field('faceIndex', new arrow.Uint32(), false)
  ]);

  return new arrow.Table(schema, {
    POSITION: positions,
    faceIndex: arrow.makeVector(faceIndices)
  });
}

function makeWebGLMeshTable(
  positions: arrow.Vector<arrow.FixedSizeList<arrow.Float32>>,
  colors: arrow.Vector<arrow.FixedSizeList<arrow.Float32>>,
  faceIndices: Uint32Array
): arrow.Table {
  const schema = new arrow.Schema([
    new arrow.Field(
      'POSITION',
      new arrow.FixedSizeList(3, new arrow.Field('value', new arrow.Float32(), false)),
      false
    ),
    new arrow.Field(
      'COLOR_0',
      new arrow.FixedSizeList(4, new arrow.Field('value', new arrow.Float32(), false)),
      false
    ),
    new arrow.Field('faceIndices', new arrow.Uint32(), false)
  ]);

  return new arrow.Table(schema, {
    POSITION: positions,
    COLOR_0: colors,
    faceIndices: arrow.makeVector(faceIndices)
  });
}

function makeInstanceArrowTable(matrixValues: Float32Array): arrow.Table {
  return new arrow.Table({
    matrix: makeArrowMatrix4x4Vector(matrixValues, {
      order: 'column-major',
      layout: 'wgsl-storage'
    })
  });
}

function makeCubeTransforms(): CubeTransform[] {
  const cubeTransforms: CubeTransform[] = [];

  for (let rowIndex = 0; rowIndex < CUBE_ROWS; rowIndex++) {
    for (let columnIndex = 0; columnIndex < CUBE_COLUMNS; columnIndex++) {
      const cubeIndex = rowIndex * CUBE_COLUMNS + columnIndex;
      const scale = 0.72 + (cubeIndex % 3) * 0.08;
      cubeTransforms.push({
        translation: [
          (columnIndex - (CUBE_COLUMNS - 1) / 2) * 2.1,
          (rowIndex - (CUBE_ROWS - 1) / 2) * 2.1,
          (cubeIndex % 2 === 0 ? -1 : 1) * 0.45
        ],
        rotation: [cubeIndex * 0.17, cubeIndex * 0.31, cubeIndex * 0.11],
        rotationRate: [0.004 + cubeIndex * 0.0003, 0.006 + cubeIndex * 0.0004, 0.002],
        scale: [scale, scale, scale],
        matrix: new Matrix4()
      });
    }
  }

  return cubeTransforms;
}

function makeFaceMetadataTable(): arrow.Table {
  const schema = new arrow.Schema([
    new arrow.Field('name', new arrow.Utf8(), false),
    new arrow.Field(
      'COLOR_0',
      new arrow.FixedSizeList(4, new arrow.Field('value', new arrow.Float32(), false)),
      false
    )
  ]);

  return new arrow.Table(schema, {
    name: arrow.vectorFromArray(FACE_NAMES, new arrow.Utf8()),
    COLOR_0: makeArrowFixedSizeListVector(
      new arrow.Float32(),
      4,
      new Float32Array([
        1.0, 0.32, 0.32, 1.0, 1.0, 0.67, 0.3, 1.0, 0.98, 0.9, 0.36, 1.0, 0.46, 0.84, 0.42, 1.0,
        0.28, 0.77, 1.0, 1.0, 0.58, 0.47, 1.0, 1.0
      ])
    )
  });
}
