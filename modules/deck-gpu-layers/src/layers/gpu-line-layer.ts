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

/** GPUVector-native straight line props. All input vectors are borrowed. */
export type GPULineLayerProps = Omit<LayerProps, 'data'> & {
  getSourcePosition: GPUVector<'float32x2'>;
  getTargetPosition: GPUVector<'float32x2'>;
  getColor?: Color | GPUVector<'unorm8x4'>;
  getWidth?: number | GPUVector<'float32'>;
  widthScale?: number;
  widthMinPixels?: number;
  widthMaxPixels?: number;
};

type GPULineBatchProps = Omit<GPULineLayerProps, 'getSourcePosition' | 'getTargetPosition'> & {
  sourcePositions: GPUData<'float32x2'>;
  targetPositions: GPUData<'float32x2'>;
  colors?: GPUData<'unorm8x4'>;
  widths?: GPUData<'float32'>;
  rowCount: number;
  batchIndex: number;
  rowIndexOffset: number;
};
type GPULineBatchState = {model: Model | null; styleBuffer: Buffer | null; defaults: Buffer[]};

const GPU_LINE_SHADER = /* wgsl */ `
struct LineStyle {
  color: vec4<f32>,
  width: f32,
  widthScale: f32,
  widthMinPixels: f32,
  widthMaxPixels: f32,
  useColors: u32,
  useWidths: u32,
  rowIndexOffset: u32,
  _padding: u32,
};
@group(0) @binding(auto) var<uniform> lineStyle: LineStyle;
struct VertexOutput { @builtin(position) position: vec4<f32>, @location(0) color: vec4<f32>, @location(1) @interpolate(flat) pickingColor: vec3<f32> };
fn encodePickingColor(rowIndex: u32) -> vec3<f32> { let value = rowIndex + 1u; return vec3<f32>(f32(value % 256u), f32((value / 256u) % 256u), f32((value / 65536u) % 256u)) / 255.0; }
fn getCorner(vertexIndex: u32) -> vec2<f32> {
  let corners = array<vec2<f32>, 6>(
    vec2<f32>(0.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(0.0, 1.0),
    vec2<f32>(0.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0)
  );
  return corners[vertexIndex];
}
@vertex fn vertexMain(
  @location(0) sourcePositions: vec2<f32>,
  @location(1) targetPositions: vec2<f32>,
  @location(2) colors: vec4<f32>,
  @location(3) widths: f32,
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
  let corner = getCorner(vertexIndex);
  let sourceClip = project_position_to_clipspace(vec3<f32>(sourcePositions, 0.0), vec3<f32>(0.0), vec3<f32>(0.0));
  let targetClip = project_position_to_clipspace(vec3<f32>(targetPositions, 0.0), vec3<f32>(0.0), vec3<f32>(0.0));
  let delta = targetClip.xy / targetClip.w - sourceClip.xy / sourceClip.w;
  let direction = select(vec2<f32>(1.0, 0.0), normalize(delta), length(delta) > 0.000001);
  let normal = vec2<f32>(-direction.y, direction.x);
  let width = clamp(
    select(lineStyle.width, widths, lineStyle.useWidths != 0u) * lineStyle.widthScale,
    lineStyle.widthMinPixels,
    lineStyle.widthMaxPixels
  );
  var clipPosition = mix(sourceClip, targetClip, corner.x);
  clipPosition = vec4<f32>(clipPosition.xy + project_pixel_size_to_clipspace(normal * corner.y * width * 0.5) * clipPosition.w, clipPosition.z, clipPosition.w);
  let pickingColor = encodePickingColor(instanceIndex + lineStyle.rowIndexOffset);
  geometry.worldPosition = vec3<f32>(mix(sourcePositions, targetPositions, corner.x), 0.0); geometry.pickingColor = pickingColor;
  var output: VertexOutput;
  output.position = clipPosition;
  output.color = select(lineStyle.color, colors, lineStyle.useColors != 0u);
  output.pickingColor = pickingColor;
  return output;
}
@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> { if (picking.isActive > 0.5) { return vec4<f32>(input.pickingColor, 1.0); } return vec4<f32>(input.color.rgb, input.color.a * layer.opacity); }
`;

class GPULineBatchLayer extends Layer<GPULineBatchProps> {
  static override layerName = 'GPULineBatchLayer';
  override getAttributeManager() {
    return null;
  }

  override initializeState({device}: LayerContext): void {
    if (device.type !== 'webgpu') throw new Error('GPULineLayer requires WebGPU');
    const styleBuffer = device.createBuffer({
      id: `${this.id}-style`,
      byteLength: 48,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    const defaultColor = device.createBuffer({
      id: `${this.id}-default-color`,
      data: new Uint8Array([0, 0, 0, 255])
    });
    const defaultWidth = device.createBuffer({
      id: `${this.id}-default-width`,
      data: new Float32Array([1])
    });
    const model = new Model(device, {
      ...this.getShaders({modules: [project32, picking], source: GPU_LINE_SHADER}),
      id: `${this.id}-model`,
      topology: 'triangle-list',
      isInstanced: true,
      vertexCount: 6,
      instanceCount: this.props.rowCount,
      attributes: {
        sourcePositions: getGPUDataBuffer(this.props.sourcePositions),
        targetPositions: getGPUDataBuffer(this.props.targetPositions),
        colors: this.props.colors ? getGPUDataBuffer(this.props.colors) : defaultColor,
        widths: this.props.widths ? getGPUDataBuffer(this.props.widths) : defaultWidth
      },
      bufferLayout: [
        makeGPUDataBufferLayout(this.props.sourcePositions, 'sourcePositions'),
        makeGPUDataBufferLayout(this.props.targetPositions, 'targetPositions'),
        this.props.colors
          ? makeGPUDataBufferLayout(this.props.colors, 'colors')
          : {
              name: 'colors',
              byteStride: 0,
              stepMode: 'instance',
              attributes: [{attribute: 'colors', format: 'unorm8x4'}]
            },
        this.props.widths
          ? makeGPUDataBufferLayout(this.props.widths, 'widths')
          : {
              name: 'widths',
              byteStride: 0,
              stepMode: 'instance',
              attributes: [{attribute: 'widths', format: 'float32'}]
            }
      ],
      bindings: {lineStyle: styleBuffer}
    });
    model.userData['boundInputs'] = [
      this.props.sourcePositions,
      this.props.targetPositions,
      this.props.colors,
      this.props.widths,
      this.props.rowCount
    ];
    this.setState({
      model,
      styleBuffer,
      defaults: [defaultColor, defaultWidth]
    } satisfies GPULineBatchState);
  }

  override getModels(): Model[] {
    const model = (this.state as GPULineBatchState).model;
    return model ? [model] : [];
  }
  override updateState({props}: UpdateParameters<this>): void {
    const boundInputs = ((this.state as GPULineBatchState).model?.userData['boundInputs'] ??
      []) as unknown[];
    if (
      props.sourcePositions !== boundInputs[0] ||
      props.targetPositions !== boundInputs[1] ||
      props.colors !== boundInputs[2] ||
      props.widths !== boundInputs[3] ||
      props.rowCount !== boundInputs[4]
    ) {
      this.destroyResources();
      this.initializeState(this.context);
    }
  }
  override draw({renderPass}: {renderPass: RenderPass}): void {
    const {model, styleBuffer} = this.state as GPULineBatchState;
    if (!model || !styleBuffer) return;
    const [red, green, blue, alpha = 255] = isColor(this.props.getColor)
      ? this.props.getColor
      : [0, 0, 0, 255];
    const bytes = new ArrayBuffer(48);
    const floats = new Float32Array(bytes);
    const uints = new Uint32Array(bytes);
    floats.set([
      red / 255,
      green / 255,
      blue / 255,
      alpha / 255,
      typeof this.props.getWidth === 'number' ? this.props.getWidth : 1,
      this.props.widthScale ?? 1,
      this.props.widthMinPixels ?? 0,
      this.props.widthMaxPixels ?? 1e9
    ]);
    uints.set(
      [this.props.colors ? 1 : 0, this.props.widths ? 1 : 0, this.props.rowIndexOffset, 0],
      8
    );
    styleBuffer.write(new Uint8Array(bytes));
    model.draw(renderPass);
  }
  override getPickingInfo({info}: {info: PickingInfo}): PickingInfo {
    const pickingInfo = info as GPUVectorLayerPickingInfo;
    pickingInfo.gpuVector = {
      rowIndex: pickingInfo.index,
      batchIndex: this.props.batchIndex,
      batchRowIndex: pickingInfo.index - this.props.rowIndexOffset
    };
    return pickingInfo;
  }
  override finalizeState(context: LayerContext): void {
    this.destroyResources();
    super.finalizeState(context);
  }
  private destroyResources(): void {
    const state = this.state as GPULineBatchState;
    state.model?.destroy();
    state.styleBuffer?.destroy();
    state.defaults.forEach(buffer => buffer.destroy());
    this.setState({model: null, styleBuffer: null, defaults: []});
  }
}

/** Chunk-preserving GPUVector straight-line composite. */
export class GPULineLayer extends CompositeLayer<GPULineLayerProps> {
  static override layerName = 'GPULineLayer';
  override renderLayers(): GPULineBatchLayer[] {
    const {getSourcePosition, getTargetPosition, getColor, getWidth, ...props} = this.props;
    return getGPUVectorLayerBatches(
      this.id,
      {
        sourcePositions: getSourcePosition,
        targetPositions: getTargetPosition,
        colors: isGPUVector(getColor) ? getColor : undefined,
        widths: isGPUVector(getWidth) ? getWidth : undefined
      },
      {
        sourcePositions: ['float32x2'],
        targetPositions: ['float32x2'],
        colors: ['unorm8x4'],
        widths: ['float32']
      }
    ).map(
      batch =>
        new GPULineBatchLayer({
          ...props,
          id: `${this.props.id}-batch-${batch.batchIndex}`,
          getColor,
          getWidth,
          sourcePositions: batch.data['sourcePositions'] as GPUData<'float32x2'>,
          targetPositions: batch.data['targetPositions'] as GPUData<'float32x2'>,
          colors: batch.data['colors'] as GPUData<'unorm8x4'> | undefined,
          widths: batch.data['widths'] as GPUData<'float32'> | undefined,
          rowCount: batch.rowCount,
          batchIndex: batch.batchIndex,
          rowIndexOffset: batch.rowIndexOffset
        })
    );
  }
}

function isGPUVector(value: unknown): value is GPUVector {
  return Boolean(value && typeof value === 'object' && 'data' in value && 'format' in value);
}
function isColor(value: unknown): value is Color {
  return Array.isArray(value) || ArrayBuffer.isView(value);
}
