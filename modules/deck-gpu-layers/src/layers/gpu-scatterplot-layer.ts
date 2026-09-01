// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  CompositeLayer,
  Layer,
  picking,
  project32,
  type Color,
  type GetPickingInfoParams,
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

/** GPUVector-native scatterplot props. All input vectors are borrowed. */
export type GPUScatterplotLayerProps = Omit<LayerProps, 'data'> & {
  getPosition: GPUVector<'float32x2'>;
  getRadius?: number | GPUVector<'float32'>;
  getFillColor?: Color | GPUVector<'unorm8x4'>;
  radiusScale?: number;
  radiusMinPixels?: number;
  radiusMaxPixels?: number;
};

type GPUScatterplotBatchLayerProps = Omit<GPUScatterplotLayerProps, 'getPosition'> & {
  positions: GPUData<'float32x2'>;
  radii?: GPUData<'float32'>;
  fillColors?: GPUData<'unorm8x4'>;
  rowCount: number;
  batchIndex: number;
  rowIndexOffset: number;
};

type GPUScatterplotBatchState = {model: Model | null; styleBuffer: Buffer | null};

const GPU_SCATTERPLOT_SHADER = /* wgsl */ `
struct ScatterStyle {
  color: vec4<f32>,
  radius: f32,
  radiusScale: f32,
  radiusMinPixels: f32,
  radiusMaxPixels: f32,
  useRadii: u32,
  useColors: u32,
  rowIndexOffset: u32,
  _padding: u32,
};
@group(0) @binding(auto) var<uniform> scatterStyle: ScatterStyle;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) corner: vec2<f32>,
  @location(1) color: vec4<f32>,
  @location(2) @interpolate(flat) pickingColor: vec3<f32>,
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
  @location(0) positions: vec2<f32>,
  @location(1) radii: f32,
  @location(2) fillColors: vec4<f32>,
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
  let corner = getCorner(vertexIndex);
  let radius = clamp(select(scatterStyle.radius, radii, scatterStyle.useRadii != 0u) * scatterStyle.radiusScale, scatterStyle.radiusMinPixels, scatterStyle.radiusMaxPixels);
  let pickingColor = encodePickingColor(instanceIndex + scatterStyle.rowIndexOffset);
  geometry.worldPosition = vec3<f32>(positions, 0.0);
  geometry.pickingColor = pickingColor;
  var clipPosition = project_position_to_clipspace(vec3<f32>(positions, 0.0), vec3<f32>(0.0), vec3<f32>(0.0));
  clipPosition = vec4<f32>(clipPosition.xy + project_pixel_size_to_clipspace(corner * radius) * clipPosition.w, clipPosition.z, clipPosition.w);
  var output: VertexOutput;
  output.position = clipPosition;
  output.corner = corner;
  output.color = select(scatterStyle.color, fillColors, scatterStyle.useColors != 0u);
  output.pickingColor = pickingColor;
  return output;
}

@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  let radiusSquared = dot(input.corner, input.corner);
  if (radiusSquared > 1.0) { discard; }
  if (picking.isActive > 0.5) { return vec4<f32>(input.pickingColor, 1.0); }
  let coverage = 1.0 - smoothstep(0.81, 1.0, radiusSquared);
  return vec4<f32>(input.color.rgb, input.color.a * layer.opacity * coverage);
}`;

class GPUScatterplotBatchLayer extends Layer<GPUScatterplotBatchLayerProps> {
  static override layerName = 'GPUScatterplotBatchLayer';

  override getAttributeManager() {
    return null;
  }

  override initializeState({device}: LayerContext): void {
    if (device.type !== 'webgpu') throw new Error('GPUScatterplotLayer requires WebGPU');
    const styleBuffer = device.createBuffer({
      id: `${this.id}-style`,
      byteLength: 48,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    const defaultRadius = device.createBuffer({
      id: `${this.id}-default-radius`,
      data: new Float32Array([1])
    });
    const defaultColor = device.createBuffer({
      id: `${this.id}-default-color`,
      data: new Uint8Array([0, 0, 0, 255])
    });
    const model = new Model(device, {
      ...this.getShaders({modules: [project32, picking], source: GPU_SCATTERPLOT_SHADER}),
      id: `${this.id}-model`,
      topology: 'triangle-list',
      isInstanced: true,
      vertexCount: 6,
      instanceCount: this.props.rowCount,
      attributes: {
        positions: getGPUDataBuffer(this.props.positions),
        radii: this.props.radii ? getGPUDataBuffer(this.props.radii) : defaultRadius,
        fillColors: this.props.fillColors ? getGPUDataBuffer(this.props.fillColors) : defaultColor
      },
      bufferLayout: [
        makeGPUDataBufferLayout(this.props.positions, 'positions'),
        this.props.radii
          ? makeGPUDataBufferLayout(this.props.radii, 'radii')
          : {
              name: 'radii',
              byteStride: 0,
              stepMode: 'instance',
              attributes: [{attribute: 'radii', format: 'float32'}]
            },
        this.props.fillColors
          ? makeGPUDataBufferLayout(this.props.fillColors, 'fillColors')
          : {
              name: 'fillColors',
              byteStride: 0,
              stepMode: 'instance',
              attributes: [{attribute: 'fillColors', format: 'unorm8x4'}]
            }
      ],
      bindings: {scatterStyle: styleBuffer}
    });
    model.userData['ownedDefaultBuffers'] = [defaultRadius, defaultColor];
    model.userData['boundInputs'] = [
      this.props.positions,
      this.props.radii,
      this.props.fillColors,
      this.props.rowCount
    ];
    this.setState({model, styleBuffer} satisfies GPUScatterplotBatchState);
  }

  override getModels(): Model[] {
    const model = (this.state as GPUScatterplotBatchState).model;
    return model ? [model] : [];
  }

  override updateState({props}: UpdateParameters<this>): void {
    const boundInputs = ((this.state as GPUScatterplotBatchState).model?.userData['boundInputs'] ??
      []) as unknown[];
    if (
      props.positions !== boundInputs[0] ||
      props.radii !== boundInputs[1] ||
      props.fillColors !== boundInputs[2] ||
      props.rowCount !== boundInputs[3]
    ) {
      this.destroyResources();
      this.initializeState(this.context);
    }
  }

  override draw({renderPass}: {renderPass: RenderPass}): void {
    const {model, styleBuffer} = this.state as GPUScatterplotBatchState;
    if (!model || !styleBuffer) return;
    const [red, green, blue, alpha = 255] = isColor(this.props.getFillColor)
      ? this.props.getFillColor
      : [0, 0, 0, 255];
    const bytes = new ArrayBuffer(48);
    const floats = new Float32Array(bytes);
    const uints = new Uint32Array(bytes);
    floats.set([
      red / 255,
      green / 255,
      blue / 255,
      alpha / 255,
      typeof this.props.getRadius === 'number' ? this.props.getRadius : 1,
      this.props.radiusScale ?? 1,
      this.props.radiusMinPixels ?? 0,
      this.props.radiusMaxPixels ?? 1e9
    ]);
    uints.set(
      [this.props.radii ? 1 : 0, this.props.fillColors ? 1 : 0, this.props.rowIndexOffset, 0],
      8
    );
    styleBuffer.write(new Uint8Array(bytes));
    model.draw(renderPass);
  }

  override getPickingInfo(params: GetPickingInfoParams): PickingInfo {
    const info = params.info as GPUVectorLayerPickingInfo;
    const batchRowIndex = info.index - this.props.rowIndexOffset;
    info.gpuVector = {rowIndex: info.index, batchIndex: this.props.batchIndex, batchRowIndex};
    return info;
  }

  override finalizeState(context: LayerContext): void {
    this.destroyResources();
    super.finalizeState(context);
  }

  private destroyResources(): void {
    const state = this.state as GPUScatterplotBatchState;
    const owned = state.model?.userData['ownedDefaultBuffers'] as Buffer[] | undefined;
    state.model?.destroy();
    owned?.forEach(buffer => buffer.destroy());
    state.styleBuffer?.destroy();
    this.setState({model: null, styleBuffer: null});
  }
}

/** Chunk-preserving GPUVector scatterplot composite. */
export class GPUScatterplotLayer extends CompositeLayer<GPUScatterplotLayerProps> {
  static override layerName = 'GPUScatterplotLayer';

  override renderLayers(): GPUScatterplotBatchLayer[] {
    const {getPosition, getRadius, getFillColor, ...props} = this.props;
    return getGPUVectorLayerBatches(
      this.id,
      {
        positions: getPosition,
        radii: isGPUVector(getRadius) ? getRadius : undefined,
        fillColors: isGPUVector(getFillColor) ? getFillColor : undefined
      },
      {positions: ['float32x2'], radii: ['float32'], fillColors: ['unorm8x4']}
    ).map(
      batch =>
        new GPUScatterplotBatchLayer({
          ...props,
          id: `${this.props.id}-batch-${batch.batchIndex}`,
          getRadius,
          getFillColor,
          positions: batch.data['positions'] as GPUData<'float32x2'>,
          radii: batch.data['radii'] as GPUData<'float32'> | undefined,
          fillColors: batch.data['fillColors'] as GPUData<'unorm8x4'> | undefined,
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
