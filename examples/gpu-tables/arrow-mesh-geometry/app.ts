// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  ArrowModel,
  GPUVector,
  expandArrowVector,
  makeArrowFixedSizeListVector,
  type ArrowMeshTable
} from '@luma.gl/arrow';
import type {Device, ShaderLayout} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {
  AnimationLoopTemplate,
  CubeGeometry,
  Model,
  PickingManager,
  ShaderInputs,
  indexColorPicking,
  indexPicking,
  supportsIndexPicking
} from '@luma.gl/engine';
import type {ShaderModule} from '@luma.gl/shadertools';
import {Matrix4, radians} from '@math.gl/core';
import * as arrow from 'apache-arrow';

export const title = 'Arrow Mesh Geometry';
export const description =
  'CubeGeometry face ids routed through Mesh Arrow data and rendered by ArrowModel.';

const FACE_NAMES = ['Front', 'Back', 'Top', 'Bottom', 'Right', 'Left'] as const;

const WGSL_SHADER = /* wgsl */ `\
struct AppUniforms {
  modelMatrix : mat4x4<f32>,
  viewMatrix : mat4x4<f32>,
  projectionMatrix : mat4x4<f32>,
};

@group(0) @binding(auto) var<uniform> app : AppUniforms;
@group(0) @binding(auto) var<storage, read> faceColors : array<vec4<f32>>;

struct VertexInputs {
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
  var outputs : FragmentInputs;
  outputs.Position =
    app.projectionMatrix *
    app.viewMatrix *
    app.modelMatrix *
    vec4<f32>(inputs.positions, 1.0);
  outputs.color = faceColors[inputs.faceIndex];
  outputs.objectIndex = i32(inputs.faceIndex);
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
  mat4 modelMatrix;
  mat4 viewMatrix;
  mat4 projectionMatrix;
} app;

in vec3 positions;
in vec4 colors;
in uint faceIndices;

out vec4 vColor;

void main(void) {
  gl_Position =
    app.projectionMatrix *
    app.viewMatrix *
    app.modelMatrix *
    vec4(positions, 1.0);
  vColor = colors;
  picking_setObjectIndex(int(faceIndices));
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
  modelMatrix: Matrix4;
  viewMatrix: Matrix4;
  projectionMatrix: Matrix4;
};

const app: ShaderModule<AppUniforms> = {
  name: 'app',
  uniformTypes: {
    modelMatrix: 'mat4x4<f32>',
    viewMatrix: 'mat4x4<f32>',
    projectionMatrix: 'mat4x4<f32>'
  }
};

const WEBGPU_MESH_SHADER_LAYOUT = {
  attributes: [
    {name: 'positions', location: 0, type: 'vec3<f32>'},
    {name: 'faceIndex', location: 1, type: 'u32'}
  ],
  bindings: []
} satisfies ShaderLayout;

const WEBGL_MESH_SHADER_LAYOUT = {
  attributes: [
    {name: 'positions', location: 0, type: 'vec3<f32>'},
    {name: 'colors', location: 1, type: 'vec4<f32>'},
    {name: 'faceIndices', location: 2, type: 'u32'}
  ],
  bindings: []
} satisfies ShaderLayout;

export default class ArrowMeshGeometryAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = `
<p>Builds indexed Mesh Arrow data from <code>CubeGeometry</code> face ids and renders it through <code>ArrowModel</code>.</p>
`;

  readonly device: Device;
  readonly model: ArrowModel;
  readonly pickingModel: Model | null;
  readonly picker: PickingManager;
  readonly faceColors?: GPUVector<arrow.FixedSizeList<arrow.Float32>>;
  readonly faceNames: arrow.Vector<arrow.Utf8>;
  readonly shaderInputs = new ShaderInputs<{
    app: typeof app.props;
    picking: typeof indexPicking.props;
  }>({app, picking: indexPicking});

  constructor({device}: AnimationProps) {
    super();
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
        ? new GPUVector({
            device,
            name: 'faceColors',
            vector: faceColors
          })
        : undefined;

    this.model = new ArrowModel(device, {
      id: 'arrow-mesh-geometry',
      arrowMesh,
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
        const faceName = this.faceNames.get(objectIndex);
        return typeof faceName === 'string' ? `${faceName} face` : null;
      }
    });
  }

  onRender({aspect, device, tick, _mousePosition}: AnimationProps): void {
    this.shaderInputs.setProps({
      app: {
        modelMatrix: new Matrix4().rotateX(tick * 0.01).rotateY(tick * 0.013),
        viewMatrix: new Matrix4().lookAt({eye: [2.8, 2.1, 4.2], center: [0, 0, 0]}),
        projectionMatrix: new Matrix4().perspective({
          fovy: radians(60),
          aspect,
          near: 0.1,
          far: 20
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

  onFinalize(): void {
    this.picker.destroy();
    this.pickingModel?.destroy();
    this.model.destroy();
    this.faceColors?.destroy();
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

  createPickingModel(): Model {
    const arrowGeometry = this.model.arrowGeometry;
    if (!arrowGeometry) {
      throw new Error('Arrow Mesh Geometry picking requires mesh GPU geometry');
    }

    return new Model(this.device, {
      id: `${this.model.id || 'arrow-mesh-geometry'}-picking`,
      source: WGSL_SHADER,
      vs: VS_GLSL,
      fs: PICKING_FS_GLSL,
      fragmentEntryPoint: 'fragmentPicking',
      modules: [indexPicking] as ShaderModule[],
      shaderLayout:
        this.device.type === 'webgpu' ? WEBGPU_MESH_SHADER_LAYOUT : WEBGL_MESH_SHADER_LAYOUT,
      bufferLayout: arrowGeometry.bufferLayout,
      attributes: arrowGeometry.attributes,
      bindings: {...this.model.bindings},
      vertexCount: arrowGeometry.vertexCount,
      indexBuffer: arrowGeometry.indices || null,
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
    throw new Error('Arrow Mesh Geometry requires CubeGeometry positions');
  }
  if (!(cubeFaceIndices instanceof Uint32Array)) {
    throw new Error('Arrow Mesh Geometry requires CubeGeometry faceIndex values');
  }
  if (!(cubeIndices instanceof Uint16Array) && !(cubeIndices instanceof Uint32Array)) {
    throw new Error('Arrow Mesh Geometry requires CubeGeometry indices');
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
