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

/** GPUVector-native extruded column props. Input vectors are borrowed. */
export type GPUColumnLayerProps = Omit<LayerProps, 'data'> & {
  getPosition: GPUVector<'float32x2'>;
  getFillColor?: Color | GPUVector<'unorm8x4'>;
  getRadius?: number | GPUVector<'float32'>;
  getElevation?: number | GPUVector<'float32'>;
  radiusScale?: number;
  elevationScale?: number;
  diskResolution?: number;
  angle?: number;
};

type GPUColumnBatchProps = Omit<GPUColumnLayerProps, 'getPosition'> & {
  positions: GPUData<'float32x2'>;
  colors?: GPUData<'unorm8x4'>;
  radii?: GPUData<'float32'>;
  elevations?: GPUData<'float32'>;
  rowCount: number;
  batchIndex: number;
  rowIndexOffset: number;
};

type GPUColumnBatchState = {model: Model | null; styleBuffer: Buffer | null; defaults: Buffer[]};

const GPU_COLUMN_SHADER = /* wgsl */ `
struct ColumnStyle {
  color: vec4<f32>,
  radius: f32,
  elevation: f32,
  radiusScale: f32,
  elevationScale: f32,
  diskResolution: u32,
  useColors: u32,
  useRadii: u32,
  useElevations: u32,
  rowIndexOffset: u32,
  angle: f32,
  _padding0: u32,
  _padding1: u32,
};
@group(0) @binding(auto) var<uniform> columnStyle: ColumnStyle;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
  @location(1) shade: f32,
  @location(2) @interpolate(flat) pickingColor: vec3<f32>,
};

fn encodePickingColor(rowIndex: u32) -> vec3<f32> {
  let value = rowIndex + 1u;
  return vec3<f32>(f32(value % 256u), f32((value / 256u) % 256u), f32((value / 65536u) % 256u)) / 255.0;
}

fn sideAngleSelector(vertexIndex: u32) -> f32 {
  let selectors = array<f32, 6>(0.0, 1.0, 0.0, 0.0, 1.0, 1.0);
  return selectors[vertexIndex % 6u];
}

fn sideHeightSelector(vertexIndex: u32) -> f32 {
  let selectors = array<f32, 6>(0.0, 0.0, 1.0, 1.0, 0.0, 1.0);
  return selectors[vertexIndex % 6u];
}

@vertex fn vertexMain(
  @location(0) positions: vec2<f32>,
  @location(1) colors: vec4<f32>,
  @location(2) radii: f32,
  @location(3) elevations: f32,
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
  let sideVertexCount = columnStyle.diskResolution * 6u;
  var radialOffset = vec2<f32>(0.0);
  var heightProgress = 1.0;
  var shade = 1.0;
  if (vertexIndex < sideVertexCount) {
    let segmentIndex = vertexIndex / 6u;
    let segmentProgress = (f32(segmentIndex) + sideAngleSelector(vertexIndex)) / f32(columnStyle.diskResolution);
    let angle = segmentProgress * 6.28318530718 + radians(columnStyle.angle);
    radialOffset = vec2<f32>(cos(angle), sin(angle));
    heightProgress = sideHeightSelector(vertexIndex);
    shade = 0.55 + 0.35 * abs(radialOffset.y);
  } else {
    let topVertexIndex = vertexIndex - sideVertexCount;
    let segmentIndex = topVertexIndex / 3u;
    let triangleVertexIndex = topVertexIndex % 3u;
    if (triangleVertexIndex != 0u) {
      let edgeOffset = triangleVertexIndex - 1u;
      let angle = f32(segmentIndex + edgeOffset) / f32(columnStyle.diskResolution) * 6.28318530718 + radians(columnStyle.angle);
      radialOffset = vec2<f32>(cos(angle), sin(angle));
    }
  }
  let radius = select(columnStyle.radius, radii, columnStyle.useRadii != 0u) * columnStyle.radiusScale;
  let elevation = select(columnStyle.elevation, elevations, columnStyle.useElevations != 0u) * columnStyle.elevationScale;
  let worldPosition = vec3<f32>(positions, elevation * heightProgress);
  var clipPosition = project_position_to_clipspace(worldPosition, vec3<f32>(0.0), vec3<f32>(0.0));
  clipPosition = vec4<f32>(clipPosition.xy + project_pixel_size_to_clipspace(radialOffset * radius) * clipPosition.w, clipPosition.z, clipPosition.w);
  let pickingColor = encodePickingColor(instanceIndex + columnStyle.rowIndexOffset);
  geometry.worldPosition = worldPosition;
  geometry.pickingColor = pickingColor;
  var output: VertexOutput;
  output.position = clipPosition;
  output.color = select(columnStyle.color, colors, columnStyle.useColors != 0u);
  output.shade = shade;
  output.pickingColor = pickingColor;
  return output;
}

@fragment fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  if (picking.isActive > 0.5) { return vec4<f32>(input.pickingColor, 1.0); }
  return vec4<f32>(input.color.rgb * input.shade, input.color.a * layer.opacity);
}`;

class GPUColumnBatchLayer extends Layer<GPUColumnBatchProps> {
  static override layerName = 'GPUColumnBatchLayer';

  override getAttributeManager() {
    return null;
  }

  override initializeState({device}: LayerContext): void {
    if (device.type !== 'webgpu') throw new Error('GPUColumnLayer requires WebGPU');
    const styleBuffer = device.createBuffer({
      id: `${this.id}-style`,
      byteLength: 64,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    const defaults = [
      device.createBuffer({data: new Uint8Array([0, 0, 0, 255])}),
      device.createBuffer({data: new Float32Array([1])}),
      device.createBuffer({data: new Float32Array([1])})
    ];
    const diskResolution = normalizeDiskResolution(this.props.diskResolution);
    const model = new Model(device, {
      ...this.getShaders({modules: [project32, picking], source: GPU_COLUMN_SHADER}),
      id: `${this.id}-model`,
      topology: 'triangle-list',
      isInstanced: true,
      vertexCount: diskResolution * 9,
      instanceCount: this.props.rowCount,
      attributes: {
        positions: getGPUDataBuffer(this.props.positions),
        colors: this.props.colors ? getGPUDataBuffer(this.props.colors) : defaults[0]!,
        radii: this.props.radii ? getGPUDataBuffer(this.props.radii) : defaults[1]!,
        elevations: this.props.elevations ? getGPUDataBuffer(this.props.elevations) : defaults[2]!
      },
      bufferLayout: [
        makeGPUDataBufferLayout(this.props.positions, 'positions'),
        this.props.colors
          ? makeGPUDataBufferLayout(this.props.colors, 'colors')
          : makeConstantLayout('colors', 'unorm8x4'),
        this.props.radii
          ? makeGPUDataBufferLayout(this.props.radii, 'radii')
          : makeConstantLayout('radii', 'float32'),
        this.props.elevations
          ? makeGPUDataBufferLayout(this.props.elevations, 'elevations')
          : makeConstantLayout('elevations', 'float32')
      ],
      bindings: {columnStyle: styleBuffer}
    });
    model.userData['boundInputs'] = [
      this.props.positions,
      this.props.colors,
      this.props.radii,
      this.props.elevations,
      this.props.diskResolution,
      this.props.rowCount
    ];
    this.setState({model, styleBuffer, defaults} satisfies GPUColumnBatchState);
  }

  override getModels(): Model[] {
    const model = (this.state as GPUColumnBatchState).model;
    return model ? [model] : [];
  }

  override updateState({props}: UpdateParameters<this>): void {
    const boundInputs = ((this.state as GPUColumnBatchState).model?.userData['boundInputs'] ??
      []) as unknown[];
    if (
      props.positions !== boundInputs[0] ||
      props.colors !== boundInputs[1] ||
      props.radii !== boundInputs[2] ||
      props.elevations !== boundInputs[3] ||
      props.diskResolution !== boundInputs[4] ||
      props.rowCount !== boundInputs[5]
    ) {
      this.destroyResources();
      this.initializeState(this.context);
    }
  }

  override draw({renderPass}: {renderPass: RenderPass}): void {
    const {model, styleBuffer} = this.state as GPUColumnBatchState;
    if (!model || !styleBuffer) return;
    const defaultColor: Color = [0, 0, 0, 255];
    const color = isColor(this.props.getFillColor) ? this.props.getFillColor : defaultColor;
    const bytes = new ArrayBuffer(64);
    const floats = new Float32Array(bytes);
    const uints = new Uint32Array(bytes);
    floats.set(normalizeColor(color));
    floats.set(
      [
        typeof this.props.getRadius === 'number' ? this.props.getRadius : 1,
        typeof this.props.getElevation === 'number' ? this.props.getElevation : 1,
        this.props.radiusScale ?? 1,
        this.props.elevationScale ?? 1
      ],
      4
    );
    uints.set(
      [
        normalizeDiskResolution(this.props.diskResolution),
        this.props.colors ? 1 : 0,
        this.props.radii ? 1 : 0,
        this.props.elevations ? 1 : 0,
        this.props.rowIndexOffset
      ],
      8
    );
    floats[13] = this.props.angle ?? 0;
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
    const state = this.state as GPUColumnBatchState;
    state.model?.destroy();
    state.styleBuffer?.destroy();
    state.defaults.forEach(buffer => buffer.destroy());
    this.setState({model: null, styleBuffer: null, defaults: []});
  }
}

/** Chunk-preserving GPUVector extruded-column composite. */
export class GPUColumnLayer extends CompositeLayer<GPUColumnLayerProps> {
  static override layerName = 'GPUColumnLayer';

  override renderLayers(): GPUColumnBatchLayer[] {
    const {getPosition, getFillColor, getRadius, getElevation, ...props} = this.props;
    return getGPUVectorLayerBatches(
      this.id,
      {
        positions: getPosition,
        colors: isGPUVector(getFillColor) ? getFillColor : undefined,
        radii: isGPUVector(getRadius) ? getRadius : undefined,
        elevations: isGPUVector(getElevation) ? getElevation : undefined
      },
      {
        positions: ['float32x2'],
        colors: ['unorm8x4'],
        radii: ['float32'],
        elevations: ['float32']
      }
    ).map(
      batch =>
        new GPUColumnBatchLayer({
          ...props,
          id: `${this.props.id}-batch-${batch.batchIndex}`,
          getFillColor,
          getRadius,
          getElevation,
          positions: batch.data['positions'] as GPUData<'float32x2'>,
          colors: batch.data['colors'] as GPUData<'unorm8x4'> | undefined,
          radii: batch.data['radii'] as GPUData<'float32'> | undefined,
          elevations: batch.data['elevations'] as GPUData<'float32'> | undefined,
          rowCount: batch.rowCount,
          batchIndex: batch.batchIndex,
          rowIndexOffset: batch.rowIndexOffset
        })
    );
  }
}

function normalizeDiskResolution(value: number | undefined): number {
  return Math.max(3, Math.floor(value ?? 12));
}

function makeConstantLayout(name: string, format: 'unorm8x4' | 'float32') {
  return {
    name,
    byteStride: 0,
    stepMode: 'instance' as const,
    attributes: [{attribute: name, format}]
  };
}

function normalizeColor(color: Color): [number, number, number, number] {
  return [color[0] / 255, color[1] / 255, color[2] / 255, (color[3] ?? 255) / 255];
}

function isGPUVector(value: unknown): value is GPUVector {
  return Boolean(value && typeof value === 'object' && 'data' in value && 'format' in value);
}

function isColor(value: unknown): value is Color {
  return Array.isArray(value) || ArrayBuffer.isView(value);
}
