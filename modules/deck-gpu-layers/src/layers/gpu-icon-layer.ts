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
import {Buffer, type RenderPass, type Texture} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import type {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {
  getGPUDataBuffer,
  getGPUVectorLayerBatches,
  makeGPUDataBufferLayout,
  type GPUVectorLayerPickingInfo
} from './gpu-vector-layer-utils';

/** GPUVector-native icon props with adapter-prepared atlas metadata. */
export type GPUIconLayerProps = Omit<LayerProps, 'data'> & {
  iconAtlas: Texture;
  getPosition: GPUVector<'float32x2'>;
  iconOffsets: GPUVector<'float32x2'>;
  iconFrames: GPUVector<'float32x4'>;
  iconColorModes: GPUVector<'float32'>;
  getColor?: Color | GPUVector<'unorm8x4'>;
  getSize?: number | GPUVector<'float32'>;
  getAngle?: number | GPUVector<'float32'>;
  getPixelOffset?: GPUVector<'float32x2'>;
  sizeScale?: number;
  alphaCutoff?: number;
};

type GPUIconBatchProps = Omit<
  GPUIconLayerProps,
  'getPosition' | 'iconOffsets' | 'iconFrames' | 'iconColorModes'
> & {
  positions: GPUData<'float32x2'>;
  offsets: GPUData<'float32x2'>;
  frames: GPUData<'float32x4'>;
  colorModes: GPUData<'float32'>;
  colors?: GPUData<'unorm8x4'>;
  sizes?: GPUData<'float32'>;
  angles?: GPUData<'float32'>;
  pixelOffsets?: GPUData<'float32x2'>;
  rowCount: number;
  batchIndex: number;
  rowIndexOffset: number;
};
type GPUIconBatchState = {model: Model | null; styleBuffer: Buffer | null; defaults: Buffer[]};

const GPU_ICON_SHADER = /* wgsl */ `
struct IconStyle { textureSize: vec2<f32>, color: vec4<f32>, size: f32, sizeScale: f32, alphaCutoff: f32, angle: f32, useColors: u32, useSizes: u32, useAngles: u32, rowIndexOffset: u32 };
@group(0) @binding(auto) var<uniform> iconStyle: IconStyle;
@group(0) @binding(auto) var iconTexture: texture_2d<f32>;
@group(0) @binding(auto) var iconTextureSampler: sampler;
struct VertexOutput { @builtin(position) position: vec4<f32>, @location(0) uv: vec2<f32>, @location(1) color: vec4<f32>, @location(2) colorMode: f32, @location(3) @interpolate(flat) pickingColor: vec3<f32> };
fn encodePickingColor(rowIndex: u32) -> vec3<f32> { let value = rowIndex + 1u; return vec3<f32>(f32(value % 256u), f32((value / 256u) % 256u), f32((value / 65536u) % 256u)) / 255.0; }
fn getCorner(vertexIndex: u32) -> vec2<f32> { let corners = array<vec2<f32>, 6>(vec2<f32>(-1.0,-1.0),vec2<f32>(1.0,-1.0),vec2<f32>(-1.0,1.0),vec2<f32>(-1.0,1.0),vec2<f32>(1.0,-1.0),vec2<f32>(1.0,1.0)); return corners[vertexIndex]; }
@vertex fn vertexMain(@location(0) positions: vec2<f32>, @location(1) offsets: vec2<f32>, @location(2) frames: vec4<f32>, @location(3) colorModes: f32, @location(4) colors: vec4<f32>, @location(5) sizes: f32, @location(6) angles: f32, @location(7) pixelOffsets: vec2<f32>, @builtin(vertex_index) vertexIndex: u32, @builtin(instance_index) instanceIndex: u32) -> VertexOutput {
  let corner = getCorner(vertexIndex); let size = select(iconStyle.size, sizes, iconStyle.useSizes != 0u) * iconStyle.sizeScale;
  let angle = select(iconStyle.angle, angles, iconStyle.useAngles != 0u); let radians = angle * 0.01745329252; let rotation = mat2x2<f32>(cos(radians), sin(radians), -sin(radians), cos(radians));
  let pixel = rotation * ((corner * frames.zw * 0.5 + offsets) * size) + pixelOffsets;
  let pickingColor = encodePickingColor(instanceIndex + iconStyle.rowIndexOffset); geometry.worldPosition = vec3<f32>(positions, 0.0); geometry.pickingColor = pickingColor;
  var clip = project_position_to_clipspace(vec3<f32>(positions,0.0),vec3<f32>(0.0),vec3<f32>(0.0)); clip = vec4<f32>(clip.xy + project_pixel_size_to_clipspace(pixel) * clip.w, clip.z, clip.w);
  var output: VertexOutput; output.position = clip; output.uv = (frames.xy + (corner * 0.5 + 0.5) * frames.zw) / iconStyle.textureSize; output.color = select(iconStyle.color, colors, iconStyle.useColors != 0u); output.colorMode = colorModes; output.pickingColor = pickingColor; return output;
}
@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> { let sample = textureSample(iconTexture, iconTextureSampler, input.uv); if (sample.a < iconStyle.alphaCutoff) { discard; } if (picking.isActive > 0.5) { return vec4<f32>(input.pickingColor,1.0); } let rgb = select(sample.rgb, input.color.rgb, input.colorMode > 0.5); return vec4<f32>(rgb, sample.a * input.color.a * layer.opacity); }
`;

class GPUIconBatchLayer extends Layer<GPUIconBatchProps> {
  static override layerName = 'GPUIconBatchLayer';
  override getAttributeManager() {
    return null;
  }
  override initializeState({device}: LayerContext): void {
    if (device.type !== 'webgpu') throw new Error('GPUIconLayer requires WebGPU');
    const styleBuffer = device.createBuffer({
      id: `${this.id}-style`,
      byteLength: 64,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    const defaults = [
      device.createBuffer({data: new Uint8Array([0, 0, 0, 255])}),
      device.createBuffer({data: new Float32Array([1])}),
      device.createBuffer({data: new Float32Array([0])}),
      device.createBuffer({data: new Float32Array([0, 0])})
    ];
    const optional = [
      this.props.colors,
      this.props.sizes,
      this.props.angles,
      this.props.pixelOffsets
    ] as const;
    const names = ['colors', 'sizes', 'angles', 'pixelOffsets'];
    const formats = ['unorm8x4', 'float32', 'float32', 'float32x2'] as const;
    const attributes: Record<string, Buffer> = {
      positions: getGPUDataBuffer(this.props.positions),
      offsets: getGPUDataBuffer(this.props.offsets),
      frames: getGPUDataBuffer(this.props.frames),
      colorModes: getGPUDataBuffer(this.props.colorModes)
    };
    const layouts = [
      makeGPUDataBufferLayout(this.props.positions, 'positions'),
      makeGPUDataBufferLayout(this.props.offsets, 'offsets'),
      makeGPUDataBufferLayout(this.props.frames, 'frames'),
      makeGPUDataBufferLayout(this.props.colorModes, 'colorModes')
    ];
    optional.forEach((data, index) => {
      attributes[names[index]!] = data ? getGPUDataBuffer(data) : defaults[index]!;
      layouts.push(
        data
          ? makeGPUDataBufferLayout(data, names[index]!)
          : {
              name: names[index]!,
              byteStride: 0,
              stepMode: 'instance',
              attributes: [{attribute: names[index]!, format: formats[index]!, byteOffset: 0}]
            }
      );
    });
    const model = new Model(device, {
      ...this.getShaders({modules: [project32, picking], source: GPU_ICON_SHADER}),
      id: `${this.id}-model`,
      topology: 'triangle-list',
      isInstanced: true,
      vertexCount: 6,
      instanceCount: this.props.rowCount,
      attributes,
      bufferLayout: layouts,
      bindings: {
        iconStyle: styleBuffer,
        iconTexture: this.props.iconAtlas,
        iconTextureSampler: this.props.iconAtlas.sampler
      }
    });
    model.userData['boundInputs'] = [
      this.props.positions,
      this.props.offsets,
      this.props.frames,
      this.props.colorModes,
      this.props.colors,
      this.props.sizes,
      this.props.angles,
      this.props.pixelOffsets,
      this.props.iconAtlas,
      this.props.rowCount
    ];
    this.setState({model, styleBuffer, defaults} satisfies GPUIconBatchState);
  }
  override getModels(): Model[] {
    const model = (this.state as GPUIconBatchState).model;
    return model ? [model] : [];
  }
  override updateState({props}: UpdateParameters<this>): void {
    const boundInputs = ((this.state as GPUIconBatchState).model?.userData['boundInputs'] ??
      []) as unknown[];
    if (
      props.positions !== boundInputs[0] ||
      props.offsets !== boundInputs[1] ||
      props.frames !== boundInputs[2] ||
      props.colorModes !== boundInputs[3] ||
      props.colors !== boundInputs[4] ||
      props.sizes !== boundInputs[5] ||
      props.angles !== boundInputs[6] ||
      props.pixelOffsets !== boundInputs[7] ||
      props.iconAtlas !== boundInputs[8] ||
      props.rowCount !== boundInputs[9]
    ) {
      this.destroyResources();
      this.initializeState(this.context);
    }
  }
  override draw({renderPass}: {renderPass: RenderPass}): void {
    const {model, styleBuffer} = this.state as GPUIconBatchState;
    if (!model || !styleBuffer) return;
    const [r, g, b, a = 255] = isColor(this.props.getColor) ? this.props.getColor : [0, 0, 0, 255];
    const bytes = new ArrayBuffer(64);
    const floats = new Float32Array(bytes);
    const uints = new Uint32Array(bytes);
    floats.set([this.props.iconAtlas.width, this.props.iconAtlas.height]);
    floats.set([r / 255, g / 255, b / 255, a / 255], 4);
    floats.set(
      [
        typeof this.props.getSize === 'number' ? this.props.getSize : 1,
        this.props.sizeScale ?? 1,
        this.props.alphaCutoff ?? 0.05,
        typeof this.props.getAngle === 'number' ? this.props.getAngle : 0
      ],
      8
    );
    uints.set(
      [
        this.props.colors ? 1 : 0,
        this.props.sizes ? 1 : 0,
        this.props.angles ? 1 : 0,
        this.props.rowIndexOffset
      ],
      12
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
    const state = this.state as GPUIconBatchState;
    state.model?.destroy();
    state.styleBuffer?.destroy();
    state.defaults.forEach(buffer => buffer.destroy());
    this.setState({model: null, styleBuffer: null, defaults: []});
  }
}

/** Chunk-preserving GPUVector icon composite. */
export class GPUIconLayer extends CompositeLayer<GPUIconLayerProps> {
  static override layerName = 'GPUIconLayer';
  override renderLayers(): GPUIconBatchLayer[] {
    const {
      getPosition,
      iconOffsets,
      iconFrames,
      iconColorModes,
      getColor,
      getSize,
      getAngle,
      getPixelOffset,
      ...props
    } = this.props;
    return getGPUVectorLayerBatches(
      this.id,
      {
        positions: getPosition,
        offsets: iconOffsets,
        frames: iconFrames,
        colorModes: iconColorModes,
        colors: isGPUVector(getColor) ? getColor : undefined,
        sizes: isGPUVector(getSize) ? getSize : undefined,
        angles: isGPUVector(getAngle) ? getAngle : undefined,
        pixelOffsets: getPixelOffset
      },
      {
        positions: ['float32x2'],
        offsets: ['float32x2'],
        frames: ['float32x4'],
        colorModes: ['float32'],
        colors: ['unorm8x4'],
        sizes: ['float32'],
        angles: ['float32'],
        pixelOffsets: ['float32x2']
      }
    ).map(
      batch =>
        new GPUIconBatchLayer({
          ...props,
          id: `${this.props.id}-batch-${batch.batchIndex}`,
          getColor,
          getSize,
          getAngle,
          positions: batch.data['positions'] as GPUData<'float32x2'>,
          offsets: batch.data['offsets'] as GPUData<'float32x2'>,
          frames: batch.data['frames'] as GPUData<'float32x4'>,
          colorModes: batch.data['colorModes'] as GPUData<'float32'>,
          colors: batch.data['colors'] as GPUData<'unorm8x4'> | undefined,
          sizes: batch.data['sizes'] as GPUData<'float32'> | undefined,
          angles: batch.data['angles'] as GPUData<'float32'> | undefined,
          pixelOffsets: batch.data['pixelOffsets'] as GPUData<'float32x2'> | undefined,
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
