// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  CompositeLayer,
  Layer,
  picking,
  project32,
  type Color,
  type LayerContext,
  type LayerProps,
  type PickingInfo,
  type UpdateParameters
} from '@deck.gl/core';
import {Buffer, type RenderPass} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import type {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {
  getGPUDataBuffer,
  getGPUVectorLayerBatches,
  makeGPUDataBufferLayout,
  type GPUVectorLayerPickingInfo
} from './gpu-vector-layer-utils';

/** GPUVector-native point-cloud props. Input vectors are borrowed. */
export type GPUPointCloudLayerProps = Omit<LayerProps, 'data'> & {
  getPosition: GPUVector<'float32x3'>;
  getNormal?: GPUVector<'float32x3'>;
  getColor?: Color | GPUVector<'unorm8x4'>;
  pointSize?: number;
};

type GPUPointCloudBatchProps = Omit<GPUPointCloudLayerProps, 'getPosition' | 'getNormal'> & {
  positions: GPUData<'float32x3'>;
  normals?: GPUData<'float32x3'>;
  colors?: GPUData<'unorm8x4'>;
  rowCount: number;
  batchIndex: number;
  rowIndexOffset: number;
};

type GPUPointCloudBatchState = {
  model: Model | null;
  styleBuffer: Buffer | null;
  defaults: Buffer[];
};

const GPU_POINT_CLOUD_SHADER = /* wgsl */ `
struct PointCloudStyle {
  color: vec4<f32>,
  pointSize: f32,
  useColors: u32,
  useNormals: u32,
  rowIndexOffset: u32,
};
@group(0) @binding(auto) var<uniform> pointCloudStyle: PointCloudStyle;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) corner: vec2<f32>,
  @location(1) color: vec4<f32>,
  @location(2) lighting: f32,
  @location(3) @interpolate(flat) pickingColor: vec3<f32>,
};

fn encodePickingColor(rowIndex: u32) -> vec3<f32> {
  let value = rowIndex + 1u;
  return vec3<f32>(f32(value % 256u), f32((value / 256u) % 256u), f32((value / 65536u) % 256u)) / 255.0;
}

fn getCorner(vertexIndex: u32) -> vec2<f32> {
  let corners = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0)
  );
  return corners[vertexIndex];
}

@vertex fn vertexMain(
  @location(0) positions: vec3<f32>,
  @location(1) normals: vec3<f32>,
  @location(2) colors: vec4<f32>,
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
  let corner = getCorner(vertexIndex);
  let pickingColor = encodePickingColor(instanceIndex + pointCloudStyle.rowIndexOffset);
  var clipPosition = project_position_to_clipspace(positions, vec3<f32>(0.0), vec3<f32>(0.0));
  clipPosition = vec4<f32>(clipPosition.xy + project_pixel_size_to_clipspace(corner * pointCloudStyle.pointSize * 0.5) * clipPosition.w, clipPosition.z, clipPosition.w);
  geometry.worldPosition = positions;
  geometry.pickingColor = pickingColor;
  var output: VertexOutput;
  output.position = clipPosition;
  output.corner = corner;
  output.color = select(pointCloudStyle.color, colors, pointCloudStyle.useColors != 0u);
  output.lighting = select(1.0, 0.35 + 0.65 * abs(normalize(normals).z), pointCloudStyle.useNormals != 0u);
  output.pickingColor = pickingColor;
  return output;
}

@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  if (dot(input.corner, input.corner) > 1.0) { discard; }
  if (picking.isActive > 0.5) { return vec4<f32>(input.pickingColor, 1.0); }
  return vec4<f32>(input.color.rgb * input.lighting, input.color.a * layer.opacity);
}`;

class GPUPointCloudBatchLayer extends Layer<GPUPointCloudBatchProps> {
  static override layerName = 'GPUPointCloudBatchLayer';

  override getAttributeManager() {
    return null;
  }

  override initializeState({device}: LayerContext): void {
    if (device.type !== 'webgpu') throw new Error('GPUPointCloudLayer requires WebGPU');
    const styleBuffer = device.createBuffer({
      id: `${this.id}-style`,
      byteLength: 32,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    const defaultNormal = device.createBuffer({data: new Float32Array([0, 0, 1])});
    const defaultColor = device.createBuffer({data: new Uint8Array([0, 0, 0, 255])});
    const model = new Model(device, {
      ...this.getShaders({modules: [project32, picking], source: GPU_POINT_CLOUD_SHADER}),
      id: `${this.id}-model`,
      topology: 'triangle-list',
      isInstanced: true,
      vertexCount: 6,
      instanceCount: this.props.rowCount,
      attributes: {
        positions: getGPUDataBuffer(this.props.positions),
        normals: this.props.normals ? getGPUDataBuffer(this.props.normals) : defaultNormal,
        colors: this.props.colors ? getGPUDataBuffer(this.props.colors) : defaultColor
      },
      bufferLayout: [
        makeGPUDataBufferLayout(this.props.positions, 'positions'),
        this.props.normals
          ? makeGPUDataBufferLayout(this.props.normals, 'normals')
          : makeConstantLayout('normals', 'float32x3'),
        this.props.colors
          ? makeGPUDataBufferLayout(this.props.colors, 'colors')
          : makeConstantLayout('colors', 'unorm8x4')
      ],
      bindings: {pointCloudStyle: styleBuffer}
    });
    model.userData['boundInputs'] = [
      this.props.positions,
      this.props.normals,
      this.props.colors,
      this.props.rowCount
    ];
    this.setState({model, styleBuffer, defaults: [defaultNormal, defaultColor]});
  }

  override getModels(): Model[] {
    return (this.state as GPUPointCloudBatchState).model
      ? [(this.state as GPUPointCloudBatchState).model!]
      : [];
  }

  override updateState({props}: UpdateParameters<this>): void {
    const boundInputs = ((this.state as GPUPointCloudBatchState).model?.userData['boundInputs'] ??
      []) as unknown[];
    if (
      props.positions !== boundInputs[0] ||
      props.normals !== boundInputs[1] ||
      props.colors !== boundInputs[2] ||
      props.rowCount !== boundInputs[3]
    ) {
      this.destroyResources();
      this.initializeState(this.context);
    }
  }

  override draw({renderPass}: {renderPass: RenderPass}): void {
    const {model, styleBuffer} = this.state as GPUPointCloudBatchState;
    if (!model || !styleBuffer) return;
    const [red, green, blue, alpha = 255] = isColor(this.props.getColor)
      ? this.props.getColor
      : [0, 0, 0, 255];
    const bytes = new ArrayBuffer(32);
    const floats = new Float32Array(bytes);
    const uints = new Uint32Array(bytes);
    floats.set([red / 255, green / 255, blue / 255, alpha / 255, this.props.pointSize ?? 1]);
    uints.set(
      [this.props.colors ? 1 : 0, this.props.normals ? 1 : 0, this.props.rowIndexOffset],
      5
    );
    styleBuffer.write(new Uint8Array(bytes));
    model.draw(renderPass);
  }

  override getPickingInfo({info}: {info: PickingInfo}): PickingInfo {
    const result = info as GPUVectorLayerPickingInfo;
    result.gpuVector = {
      rowIndex: result.index,
      batchIndex: this.props.batchIndex,
      batchRowIndex: result.index - this.props.rowIndexOffset
    };
    return result;
  }

  override finalizeState(context: LayerContext): void {
    this.destroyResources();
    super.finalizeState(context);
  }

  private destroyResources(): void {
    const state = this.state as GPUPointCloudBatchState;
    state.model?.destroy();
    state.styleBuffer?.destroy();
    state.defaults.forEach(buffer => buffer.destroy());
    this.setState({model: null, styleBuffer: null, defaults: []});
  }
}

/** Chunk-preserving GPUVector point-cloud composite. */
export class GPUPointCloudLayer extends CompositeLayer<GPUPointCloudLayerProps> {
  static override layerName = 'GPUPointCloudLayer';

  override renderLayers(): GPUPointCloudBatchLayer[] {
    const {getPosition, getNormal, getColor, ...props} = this.props;
    return getGPUVectorLayerBatches(
      this.id,
      {
        positions: getPosition,
        normals: getNormal,
        colors: isGPUVector(getColor) ? getColor : undefined
      },
      {positions: ['float32x3'], normals: ['float32x3'], colors: ['unorm8x4']}
    ).map(
      batch =>
        new GPUPointCloudBatchLayer({
          ...props,
          id: `${this.props.id}-batch-${batch.batchIndex}`,
          getColor,
          positions: batch.data['positions'] as GPUData<'float32x3'>,
          normals: batch.data['normals'] as GPUData<'float32x3'> | undefined,
          colors: batch.data['colors'] as GPUData<'unorm8x4'> | undefined,
          rowCount: batch.rowCount,
          batchIndex: batch.batchIndex,
          rowIndexOffset: batch.rowIndexOffset
        })
    );
  }
}

function makeConstantLayout(name: string, format: 'float32x3' | 'unorm8x4') {
  return {
    name,
    byteStride: 0,
    stepMode: 'instance' as const,
    attributes: [{attribute: name, format}]
  };
}

function isGPUVector(value: unknown): value is GPUVector {
  return Boolean(value && typeof value === 'object' && 'data' in value && 'format' in value);
}

function isColor(value: unknown): value is Color {
  return Array.isArray(value) || ArrayBuffer.isView(value);
}
