// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Buffer,
  type CommandEncoder,
  type Device,
  type RenderPass,
  Texture,
  type Binding
} from '@luma.gl/core';
import {Model} from '@luma.gl/engine';
import {volumeRaymarch} from '@luma.gl/shadertools';
import {Matrix4, type Matrix4Like, type NumberArray3} from '@math.gl/core';
import {
  getStructuredVolumeShaderSource,
  STRUCTURED_VOLUME_MAX_SAMPLE_COUNT,
  STRUCTURED_VOLUME_UNIFORM_BYTE_LENGTH,
  STRUCTURED_VOLUME_UNIFORM_FLOAT_COUNT,
  STRUCTURED_VOLUME_UNIFORM_OFFSETS
} from './structured-volume-renderer-shaders';

export type StructuredVolumeDimensions = readonly [number, number, number];
export type StructuredVolumeBounds = {
  minimum: Readonly<NumberArray3>;
  maximum: Readonly<NumberArray3>;
};
export type StructuredVolumeBufferBinding =
  | Buffer
  | {buffer: Buffer; offset?: number; size?: number};

export type StructuredVolumeScalarSource =
  | {type: 'buffer'; format: 'float32'; buffer: StructuredVolumeBufferBinding}
  | {type: 'texture'; format: 'float32'; texture: Texture};

export type StructuredVolumeVectorSource =
  | {type: 'buffer'; format: 'float32x4'; buffer: StructuredVolumeBufferBinding}
  | {type: 'texture'; format: 'float32x4'; texture: Texture};

export type StructuredVolumeSources = {
  scalar?: StructuredVolumeScalarSource;
  vector?: StructuredVolumeVectorSource;
};

export type StructuredVolumeScalarStyle = {
  transferFunction?: 'sequential' | 'signed';
  lowColor?: Readonly<NumberArray3>;
  neutralColor?: Readonly<NumberArray3>;
  highColor?: Readonly<NumberArray3>;
  valueScale?: number;
  densityScale?: number;
  opacity?: number;
};

export type StructuredVolumeVectorStyle = {
  colorMode?: 'direction' | 'constant';
  color?: Readonly<NumberArray3>;
  magnitudeScale?: number;
  densityScale?: number;
  opacity?: number;
};

export type StructuredVolumeGlyphStyle = {
  enabled?: boolean;
  gridDimensions?: StructuredVolumeDimensions;
  lengthRange?: readonly [number, number];
  shaftRadius?: number;
  headRadius?: number;
  feather?: number;
  opacity?: number;
  colorMode?: 'direction' | 'constant';
};

export type StructuredVolumeRendererProps = StructuredVolumeSources & {
  id?: string;
  dimensions: StructuredVolumeDimensions;
  bounds?: StructuredVolumeBounds;
};

export type StructuredVolumeRendererPrepareOptions = {
  inverseViewProjectionMatrix: Readonly<Matrix4Like>;
  cameraPosition: Readonly<NumberArray3>;
  viewport: readonly [number, number, number, number];
  modelMatrix?: Readonly<Matrix4Like>;
  mode: 'scalar' | 'vector' | 'hybrid';
  sampleCount?: number;
  jitter?: boolean;
  showBounds?: boolean;
  scalarStyle?: StructuredVolumeScalarStyle;
  vectorStyle?: StructuredVolumeVectorStyle;
  glyphs?: StructuredVolumeGlyphStyle;
};

export type StructuredVolumeSupport = {supported: boolean; reason?: string};

const DEFAULT_BOUNDS: StructuredVolumeBounds = {
  minimum: [-1, -1, -1],
  maximum: [1, 1, 1]
};
const DEFAULT_SCALAR_LOW_COLOR = [0.08, 0.38, 1] as const;
const DEFAULT_SCALAR_NEUTRAL_COLOR = [0.03, 0.055, 0.1] as const;
const DEFAULT_SCALAR_HIGH_COLOR = [1, 0.2, 0.08] as const;
const DEFAULT_VECTOR_COLOR = [0.55, 0.88, 1] as const;
const SCALAR_TEXTURE_FORMATS = new Set(['r16float', 'r32float']);
const VECTOR_TEXTURE_FORMATS = new Set(['rgba16float', 'rgba32float']);

/** WebGPU ray marcher for regularly sampled scalar and vector volumes. */
export class StructuredVolumeRenderer {
  readonly device: Device;
  readonly id: string;
  readonly dimensions: StructuredVolumeDimensions;
  readonly bounds: StructuredVolumeBounds;
  readonly model: Model;
  readonly uniformBuffer: Buffer;

  private sources: StructuredVolumeSources;
  private viewport: [number, number, number, number] | null = null;

  constructor(device: Device, props: StructuredVolumeRendererProps) {
    const support = getStructuredVolumeSupport(device);
    if (!support.supported) throw new Error(support.reason);
    validateDimensions(props.dimensions);
    validateBounds(props.bounds ?? DEFAULT_BOUNDS);
    validateSources(device, props, props.dimensions);
    this.device = device;
    this.id = props.id ?? 'structured-volume-renderer';
    this.dimensions = Object.freeze([...props.dimensions]) as StructuredVolumeDimensions;
    this.bounds = Object.freeze({
      minimum: Object.freeze([...(props.bounds?.minimum ?? DEFAULT_BOUNDS.minimum)]),
      maximum: Object.freeze([...(props.bounds?.maximum ?? DEFAULT_BOUNDS.maximum)])
    }) as StructuredVolumeBounds;
    this.sources = {scalar: props.scalar, vector: props.vector};
    this.uniformBuffer = device.createBuffer({
      id: `${this.id}-uniforms`,
      byteLength: STRUCTURED_VOLUME_UNIFORM_BYTE_LENGTH,
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });
    this.model = new Model(device, {
      id: this.id,
      source: getStructuredVolumeShaderSource(this.sources),
      modules: [volumeRaymarch],
      vertexCount: 3,
      bindings: this.getBindings(),
      shaderLayout: {attributes: [], bindings: getBindingLayout(this.sources)},
      parameters: {
        blend: true,
        blendColorOperation: 'add',
        blendColorSrcFactor: 'one',
        blendColorDstFactor: 'one-minus-src-alpha',
        blendAlphaOperation: 'add',
        blendAlphaSrcFactor: 'one',
        blendAlphaDstFactor: 'one-minus-src-alpha',
        depthWriteEnabled: false
      }
    });
  }

  /** Rebinds sources without rebuilding when channel presence and backing types stay compatible. */
  setSources(sources: StructuredVolumeSources): void {
    validateCompatibleSources(this.sources, sources);
    validateSources(this.device, sources, this.dimensions);
    this.sources = {...sources};
    this.model.setBindings(this.getBindings());
  }

  /** Uploads per-view state and prepares the pipeline on the caller-owned command encoder. */
  prepare(commandEncoder: CommandEncoder, options: StructuredVolumeRendererPrepareOptions): void {
    if (commandEncoder.device !== this.device) {
      throw new Error('StructuredVolumeRenderer command encoder belongs to a different device.');
    }
    validatePrepareOptions(options, this.sources);
    const uniforms = makeStructuredVolumeUniformData(options, this.dimensions, this.bounds);
    this.device.writeBufferViaCommandEncoder(commandEncoder, this.uniformBuffer, uniforms);
    this.model.predraw(commandEncoder);
    this.viewport = [...options.viewport];
  }

  /** Records one fullscreen volume draw into the prepared viewport and scissor rectangle. */
  draw(renderPass: RenderPass): boolean {
    if (!this.viewport) throw new Error('StructuredVolumeRenderer.prepare() must be called first.');
    if (renderPass.device !== this.device) {
      throw new Error('StructuredVolumeRenderer render pass belongs to a different device.');
    }
    renderPass.setParameters({viewport: this.viewport, scissorRect: this.viewport});
    return this.model.draw(renderPass);
  }

  destroy(): void {
    this.model.destroy();
    this.uniformBuffer.destroy();
  }

  private getBindings(): Record<string, Binding> {
    const bindings: Record<string, Binding> = {structuredVolume: this.uniformBuffer};
    if (this.sources.scalar) {
      bindings['scalarVolume'] = getSourceBinding(this.sources.scalar);
    }
    if (this.sources.vector) {
      bindings['vectorVolume'] = getSourceBinding(this.sources.vector);
    }
    return bindings;
  }
}

export function getStructuredVolumeSupport(device: Device): StructuredVolumeSupport {
  return device.type === 'webgpu'
    ? {supported: true}
    : {supported: false, reason: 'StructuredVolumeRenderer requires WebGPU.'};
}

export function makeStructuredVolumeUniformData(
  options: StructuredVolumeRendererPrepareOptions,
  dimensions: StructuredVolumeDimensions,
  bounds: StructuredVolumeBounds = DEFAULT_BOUNDS
): Float32Array {
  validateDimensions(dimensions);
  validateBounds(bounds);
  validatePrepareValues(options);
  const scalar = options.scalarStyle ?? {};
  const vector = options.vectorStyle ?? {};
  const glyphs = options.glyphs ?? {};
  const worldToVolume = new Matrix4(options.modelMatrix ?? new Matrix4());
  if (Math.abs(worldToVolume.determinant()) < 1e-12) {
    throw new Error('Structured volume modelMatrix must be invertible.');
  }
  worldToVolume.invert();
  const values = new Float32Array(STRUCTURED_VOLUME_UNIFORM_FLOAT_COUNT);
  values.set(
    options.inverseViewProjectionMatrix,
    STRUCTURED_VOLUME_UNIFORM_OFFSETS.inverseViewProjectionMatrix
  );
  values.set(worldToVolume, STRUCTURED_VOLUME_UNIFORM_OFFSETS.worldToVolumeMatrix);
  values.set(
    [...options.cameraPosition, options.sampleCount ?? 72],
    STRUCTURED_VOLUME_UNIFORM_OFFSETS.cameraAndSamples
  );
  values.set(options.viewport, STRUCTURED_VOLUME_UNIFORM_OFFSETS.viewport);
  values.set(
    [...dimensions, getModeValue(options.mode)],
    STRUCTURED_VOLUME_UNIFORM_OFFSETS.dimensionsAndMode
  );
  values.set(
    [...bounds.minimum, options.showBounds === false ? 0 : 1],
    STRUCTURED_VOLUME_UNIFORM_OFFSETS.boundsMinimum
  );
  values.set(
    [...bounds.maximum, options.jitter === false ? 0 : 1],
    STRUCTURED_VOLUME_UNIFORM_OFFSETS.boundsMaximum
  );
  values.set(
    [
      scalar.valueScale ?? 1,
      scalar.densityScale ?? 1,
      scalar.opacity ?? 1,
      scalar.transferFunction === 'signed' ? 1 : 0
    ],
    STRUCTURED_VOLUME_UNIFORM_OFFSETS.scalarScales
  );
  setColor(
    values,
    STRUCTURED_VOLUME_UNIFORM_OFFSETS.scalarLowColor,
    scalar.lowColor ?? DEFAULT_SCALAR_LOW_COLOR
  );
  setColor(
    values,
    STRUCTURED_VOLUME_UNIFORM_OFFSETS.scalarNeutralColor,
    scalar.neutralColor ?? DEFAULT_SCALAR_NEUTRAL_COLOR
  );
  setColor(
    values,
    STRUCTURED_VOLUME_UNIFORM_OFFSETS.scalarHighColor,
    scalar.highColor ?? DEFAULT_SCALAR_HIGH_COLOR
  );
  values.set(
    [
      vector.magnitudeScale ?? 1,
      vector.densityScale ?? 0.25,
      vector.opacity ?? 1,
      vector.colorMode === 'constant' ? 1 : 0
    ],
    STRUCTURED_VOLUME_UNIFORM_OFFSETS.vectorScales
  );
  values.set(
    [...(glyphs.gridDimensions ?? [6, 6, 6]), glyphs.enabled ? 1 : 0],
    STRUCTURED_VOLUME_UNIFORM_OFFSETS.glyphGrid
  );
  values.set(
    [
      glyphs.lengthRange?.[0] ?? 0.115,
      glyphs.lengthRange?.[1] ?? 0.185,
      glyphs.shaftRadius ?? 0.012,
      glyphs.headRadius ?? 0.038
    ],
    STRUCTURED_VOLUME_UNIFORM_OFFSETS.glyphShape
  );
  values.set(
    [glyphs.opacity ?? 26, glyphs.feather ?? 0.018, glyphs.colorMode === 'constant' ? 1 : 0, 0],
    STRUCTURED_VOLUME_UNIFORM_OFFSETS.glyphStyle
  );
  setColor(
    values,
    STRUCTURED_VOLUME_UNIFORM_OFFSETS.vectorColor,
    vector.color ?? DEFAULT_VECTOR_COLOR
  );
  return values;
}

function getBindingLayout(sources: StructuredVolumeSources) {
  const bindings: Array<{
    name: string;
    type: 'read-only-storage' | 'texture' | 'uniform';
    group: number;
    location: number;
    viewDimension?: '3d';
  }> = [];
  if (sources.scalar) {
    bindings.push({
      name: 'scalarVolume',
      type: sources.scalar.type === 'buffer' ? 'read-only-storage' : 'texture',
      group: 0,
      location: 0,
      ...(sources.scalar.type === 'texture' ? {viewDimension: '3d' as const} : {})
    });
  }
  if (sources.vector) {
    bindings.push({
      name: 'vectorVolume',
      type: sources.vector.type === 'buffer' ? 'read-only-storage' : 'texture',
      group: 0,
      location: 1,
      ...(sources.vector.type === 'texture' ? {viewDimension: '3d' as const} : {})
    });
  }
  bindings.push({name: 'structuredVolume', type: 'uniform', group: 0, location: 2});
  return bindings;
}

function getSourceBinding(
  source: StructuredVolumeScalarSource | StructuredVolumeVectorSource
): Binding {
  return source.type === 'buffer' ? source.buffer : source.texture;
}

function validateSources(
  device: Device,
  sources: StructuredVolumeSources,
  dimensions: StructuredVolumeDimensions
): void {
  if (!sources.scalar && !sources.vector) {
    throw new Error('StructuredVolumeRenderer requires a scalar or vector source.');
  }
  if (sources.scalar) validateSource(device, sources.scalar, dimensions, 4, SCALAR_TEXTURE_FORMATS);
  if (sources.vector)
    validateSource(device, sources.vector, dimensions, 16, VECTOR_TEXTURE_FORMATS);
}

function validateSource(
  device: Device,
  source: StructuredVolumeScalarSource | StructuredVolumeVectorSource,
  dimensions: StructuredVolumeDimensions,
  bytesPerElement: number,
  textureFormats: Set<string>
): void {
  const elementCount = dimensions[0] * dimensions[1] * dimensions[2];
  if (source.type === 'buffer') {
    const binding = source.buffer instanceof Buffer ? {buffer: source.buffer} : source.buffer;
    if (binding.buffer.device !== device)
      throw new Error('Structured volume buffer belongs to a different device.');
    if (!(binding.buffer.usage & Buffer.STORAGE)) {
      throw new Error('Structured volume buffers require storage usage.');
    }
    const offset = binding.offset ?? 0;
    const size = binding.size ?? binding.buffer.byteLength - offset;
    if (!Number.isInteger(offset) || offset < 0 || offset % bytesPerElement !== 0) {
      throw new Error('Structured volume buffer offset is not aligned to its element format.');
    }
    if (size < elementCount * bytesPerElement) {
      throw new Error('Structured volume buffer binding is smaller than its dimensions require.');
    }
    if (offset + size > binding.buffer.byteLength) {
      throw new Error('Structured volume buffer binding exceeds its buffer.');
    }
    return;
  }
  if (source.texture.device !== device)
    throw new Error('Structured volume texture belongs to a different device.');
  if (source.texture.dimension !== '3d')
    throw new Error('Structured volume textures must be three-dimensional.');
  if (!((source.texture.props.usage ?? 0) & Texture.SAMPLE)) {
    throw new Error('Structured volume textures require sampled-texture usage.');
  }
  if (
    source.texture.width !== dimensions[0] ||
    source.texture.height !== dimensions[1] ||
    source.texture.depth !== dimensions[2]
  ) {
    throw new Error('Structured volume texture dimensions must match the renderer dimensions.');
  }
  if (!textureFormats.has(source.texture.format)) {
    throw new Error(`Structured volume texture format ${source.texture.format} is not compatible.`);
  }
}

function validateCompatibleSources(
  current: StructuredVolumeSources,
  next: StructuredVolumeSources
): void {
  for (const channel of ['scalar', 'vector'] as const) {
    if (
      current[channel]?.type !== next[channel]?.type ||
      current[channel]?.format !== next[channel]?.format
    ) {
      throw new Error(
        'Structured volume source channel presence, format, and backing type are immutable.'
      );
    }
  }
}

function validateDimensions(dimensions: StructuredVolumeDimensions): void {
  if (
    dimensions.length !== 3 ||
    !dimensions.every(value => Number.isInteger(value) && value >= 2) ||
    !Number.isSafeInteger(dimensions[0] * dimensions[1] * dimensions[2])
  ) {
    throw new Error('Structured volume dimensions must contain three integers of at least two.');
  }
}

function validateBounds(bounds: StructuredVolumeBounds): void {
  if (
    bounds.minimum.length !== 3 ||
    bounds.maximum.length !== 3 ||
    ![...bounds.minimum, ...bounds.maximum].every(Number.isFinite) ||
    !bounds.minimum.every((value, index) => value < bounds.maximum[index])
  ) {
    throw new Error(
      'Structured volume bounds must contain finite increasing minimum/maximum values.'
    );
  }
}

function validatePrepareOptions(
  options: StructuredVolumeRendererPrepareOptions,
  sources: StructuredVolumeSources
): void {
  if ((options.mode === 'scalar' || options.mode === 'hybrid') && !sources.scalar) {
    throw new Error('Structured volume scalar mode requires a scalar source.');
  }
  if ((options.mode === 'vector' || options.mode === 'hybrid') && !sources.vector) {
    throw new Error('Structured volume vector mode requires a vector source.');
  }
  if (options.glyphs?.enabled && !sources.vector) {
    throw new Error('Structured volume glyphs require a vector source.');
  }
  validatePrepareValues(options);
}

function validatePrepareValues(options: StructuredVolumeRendererPrepareOptions): void {
  const sampleCount = options.sampleCount ?? 72;
  if (
    !Number.isInteger(sampleCount) ||
    sampleCount < 1 ||
    sampleCount > STRUCTURED_VOLUME_MAX_SAMPLE_COUNT
  ) {
    throw new Error(
      `Structured volume sampleCount must be between 1 and ${STRUCTURED_VOLUME_MAX_SAMPLE_COUNT}.`
    );
  }
  if (
    options.viewport.length !== 4 ||
    !options.viewport.every(Number.isFinite) ||
    options.viewport[2] <= 0 ||
    options.viewport[3] <= 0
  ) {
    throw new Error('Structured volume viewport must have positive finite dimensions.');
  }
  const matrixValues = [
    ...options.inverseViewProjectionMatrix,
    ...(options.modelMatrix ?? new Matrix4())
  ];
  if (
    matrixValues.length !== 32 ||
    !matrixValues.every(Number.isFinite) ||
    options.cameraPosition.length !== 3 ||
    !options.cameraPosition.every(Number.isFinite)
  ) {
    throw new Error('Structured volume camera and model transforms must contain finite values.');
  }
  const styles = [
    options.scalarStyle?.valueScale ?? 1,
    options.scalarStyle?.densityScale ?? 1,
    options.scalarStyle?.opacity ?? 1,
    options.vectorStyle?.magnitudeScale ?? 1,
    options.vectorStyle?.densityScale ?? 0.25,
    options.vectorStyle?.opacity ?? 1
  ];
  if (!styles.every(value => Number.isFinite(value) && value >= 0)) {
    throw new Error('Structured volume style scales and opacity must be finite and non-negative.');
  }
  for (const color of [
    options.scalarStyle?.lowColor,
    options.scalarStyle?.neutralColor,
    options.scalarStyle?.highColor,
    options.vectorStyle?.color
  ]) {
    if (
      color &&
      (color.length !== 3 || !color.every(value => Number.isFinite(value) && value >= 0))
    ) {
      throw new Error('Structured volume colors must contain three finite non-negative values.');
    }
  }
  const glyphs = options.glyphs;
  if (!glyphs) return;
  const grid = glyphs.gridDimensions ?? [6, 6, 6];
  if (!grid.every(value => Number.isInteger(value) && value >= 2)) {
    throw new Error('Structured volume glyph grid dimensions must be integers of at least two.');
  }
  const minimumLength = glyphs.lengthRange?.[0] ?? 0.115;
  const maximumLength = glyphs.lengthRange?.[1] ?? 0.185;
  const positiveValues = [
    minimumLength,
    maximumLength,
    glyphs.shaftRadius ?? 0.012,
    glyphs.headRadius ?? 0.038,
    glyphs.feather ?? 0.018,
    glyphs.opacity ?? 26
  ];
  if (
    !positiveValues.every(value => Number.isFinite(value) && value > 0) ||
    minimumLength > maximumLength
  ) {
    throw new Error('Structured volume glyph shape values must be positive and ordered.');
  }
}

function getModeValue(mode: StructuredVolumeRendererPrepareOptions['mode']): number {
  return mode === 'scalar' ? 0 : mode === 'vector' ? 1 : 2;
}

function setColor(values: Float32Array, offset: number, color: Readonly<NumberArray3>): void {
  values.set([color[0], color[1], color[2], 0], offset);
}
