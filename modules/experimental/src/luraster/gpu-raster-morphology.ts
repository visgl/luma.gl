// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding, BindingDeclaration} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import type {
  GPUCommandGraph,
  GPUCommandGraphContributor,
  GraphDataView,
  GraphResourceUse
} from '../gpu-primitives/gpu-command-graph';
import {
  createTransientView,
  getViewBinding,
  getViewElementOffset
} from '../gpu-primitives/graph-data-view-utils';
import type {GPURasterBorderMode} from './gpu-raster-neighborhood';
import {
  assertRasterStorageBindingFits,
  getRasterDispatchSize,
  getRasterFloatLiteral,
  getRasterScalarLiteral,
  getRasterShaderScalarType,
  MAXIMUM_RASTER_PIXEL_COUNT,
  RASTER_WORKGROUP_DIMENSION,
  validateRasterBand,
  validateRasterScalarView,
  validateRasterValidityView
} from './raster-utils';
import type {GPURasterBufferBand} from './types';

/** Canonical uint32 foreground masks or calibrated float32 neighborhood extrema. */
export type GPURasterMorphologyMode = 'binary' | 'grayscale';

/** Dilation selects the maximum; erosion selects the minimum. */
export type GPURasterMorphologyOperation = 'dilate' | 'erode';

/** Chebyshev square (8-connected) or Manhattan diamond (4-connected). */
export type GPURasterStructuringElement = 'square' | 'cross';

/** Reject missing included neighbors, or skip them while preserving invalid centers. */
export type GPURasterMorphologyNoDataPolicy = 'propagate' | 'ignore';

/** Shared bounded-footprint, border, validity, and graph-ownership contract. */
export type GPURasterMorphologyBaseProps = {
  id?: string;
  width: number;
  height: number;
  /** Symmetric source-pixel radius, bounded to zero through eight. */
  radius: number;
  /** Square is the default; cross uses Manhattan distance at every radius. */
  structuringElement?: GPURasterStructuringElement;
  /** Defaults to clamp; reflect does not repeat the nearest edge sample. */
  borderMode?: GPURasterBorderMode;
  /** Calibrated grayscale value, or a canonicalized nonzero binary flag. */
  borderValue?: number;
  /** Defaults to strict propagation. Invalid center pixels never become valid. */
  noDataPolicy?: GPURasterMorphologyNoDataPolicy;
  /** Separate caller-owned packed uint32 validity flags. */
  outputValidity: GraphDataView<'uint32'>;
};

/** Canonical binary morphology accepts uint32 threshold flags without recalibration. */
export type GPURasterBinaryMorphologyProps = GPURasterMorphologyBaseProps & {
  mode: 'binary';
  input: GPURasterBufferBand<'uint32'>;
  output: GraphDataView<'uint32'>;
};

/** Grayscale morphology calibrates native scalar samples before selecting extrema. */
export type GPURasterGrayscaleMorphologyProps = GPURasterMorphologyBaseProps & {
  mode?: 'grayscale';
  input: GPURasterBufferBand;
  output: GraphDataView<'float32'>;
};

/** One explicit min/max pass over a strictly discriminated binary or grayscale raster. */
export type GPURasterMorphologyProps =
  | (GPURasterBinaryMorphologyProps & {operation: GPURasterMorphologyOperation})
  | (GPURasterGrayscaleMorphologyProps & {operation: GPURasterMorphologyOperation});

/** Binary or grayscale dilation without collapsing its source/output discriminant. */
export type GPURasterDilationProps =
  | GPURasterBinaryMorphologyProps
  | GPURasterGrayscaleMorphologyProps;

/** Binary or grayscale erosion without collapsing its source/output discriminant. */
export type GPURasterErosionProps =
  | GPURasterBinaryMorphologyProps
  | GPURasterGrayscaleMorphologyProps;

/** Binary or grayscale opening: erosion followed by dilation. */
export type GPURasterOpeningProps =
  | GPURasterBinaryMorphologyProps
  | GPURasterGrayscaleMorphologyProps;

/** Binary or grayscale closing: dilation followed by erosion. */
export type GPURasterClosingProps =
  | GPURasterBinaryMorphologyProps
  | GPURasterGrayscaleMorphologyProps;

/**
 * Computes one explicitly bordered, nodata-aware morphological dilation or erosion.
 *
 * Workgroups cooperatively cache calibrated source values and validity. Binary sources are
 * canonicalized from uint32 flags and remain uint32; grayscale outputs are float32 extrema.
 * Missing centers always remain invalid, independently of the neighborhood nodata policy.
 */
export class GPURasterMorphology implements GPUCommandGraphContributor {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly input: GPURasterBufferBand;
  readonly output: GraphDataView<'float32'> | GraphDataView<'uint32'>;
  readonly outputValidity: GraphDataView<'uint32'>;
  readonly mode: GPURasterMorphologyMode;
  readonly operation: GPURasterMorphologyOperation;
  readonly radius: number;
  readonly requiredHalo: number;
  readonly structuringElement: GPURasterStructuringElement;
  readonly borderMode: GPURasterBorderMode;
  readonly borderValue: number;
  readonly noDataPolicy: GPURasterMorphologyNoDataPolicy;

  constructor(props: GPURasterMorphologyProps) {
    this.id = props.id ?? 'gpu-raster-morphology';
    this.width = props.width;
    this.height = props.height;
    this.input = props.input;
    this.output = props.output;
    this.outputValidity = props.outputValidity;
    this.mode = props.mode ?? 'grayscale';
    this.operation = props.operation;
    this.radius = props.radius;
    this.requiredHalo = props.radius;
    this.structuringElement = props.structuringElement ?? 'square';
    this.borderMode = props.borderMode ?? 'clamp';
    this.borderValue = props.borderValue ?? 0;
    this.noDataPolicy = props.noDataPolicy ?? 'propagate';

    if (
      !Number.isSafeInteger(this.width) ||
      this.width <= 0 ||
      !Number.isSafeInteger(this.height) ||
      this.height <= 0
    ) {
      throw new Error(`${this.id} dimensions must be positive integers`);
    }
    const pixelCount = this.width * this.height;
    if (!Number.isSafeInteger(pixelCount) || pixelCount > MAXIMUM_RASTER_PIXEL_COUNT) {
      throw new Error(`${this.id} pixel count must fit in uint32`);
    }
    if (this.mode !== 'binary' && this.mode !== 'grayscale') {
      throw new Error(`${this.id} morphology mode must be binary or grayscale`);
    }
    if (this.operation !== 'dilate' && this.operation !== 'erode') {
      throw new Error(`${this.id} morphology operation must be dilate or erode`);
    }
    if (!Number.isSafeInteger(this.radius) || this.radius < 0 || this.radius > 8) {
      throw new Error(`${this.id} morphology radius must be an integer from zero through eight`);
    }
    if (this.structuringElement !== 'square' && this.structuringElement !== 'cross') {
      throw new Error(`${this.id} structuring element must be square or cross`);
    }
    if (!['clamp', 'reflect', 'constant', 'nodata'].includes(this.borderMode)) {
      throw new Error(`${this.id} border mode must be clamp, reflect, constant, or nodata`);
    }
    if (!Number.isFinite(this.borderValue)) {
      throw new Error(`${this.id} constant border value must be finite`);
    }
    getRasterFloatLiteral(this.borderValue);
    if (this.noDataPolicy !== 'propagate' && this.noDataPolicy !== 'ignore') {
      throw new Error(`${this.id} nodata policy must be propagate or ignore`);
    }
    if (this.input.storage.kind !== 'buffer') {
      throw new Error(`${this.id} requires a buffer-backed input band`);
    }

    const owner = validateRasterBand(this.input, this, `${this.id} input`);
    const outputFormat = this.mode === 'binary' ? 'uint32' : 'float32';
    if (this.mode === 'binary' && this.input.format !== 'uint32') {
      throw new Error(`${this.id} binary morphology requires uint32 input flags`);
    }
    if (
      this.mode === 'binary' &&
      ((this.input.scale !== undefined && this.input.scale !== 1) ||
        (this.input.offset !== undefined && this.input.offset !== 0))
    ) {
      throw new Error(`${this.id} binary morphology requires identity input calibration`);
    }
    validateRasterScalarView(this.output, outputFormat, pixelCount, `${this.id} output`);
    validateRasterValidityView(this.outputValidity, pixelCount, `${this.id} output validity`);
    if (this.output.buffer.graph !== owner || this.outputValidity.buffer.graph !== owner) {
      throw new Error(`${this.id} resources must belong to the same graph`);
    }
    const inputBuffers = [
      this.input.storage.values.buffer,
      ...(this.input.validity ? [this.input.validity.buffer] : [])
    ];
    if (
      this.output.buffer === this.outputValidity.buffer ||
      inputBuffers.includes(this.output.buffer) ||
      inputBuffers.includes(this.outputValidity.buffer)
    ) {
      throw new Error(`${this.id} morphology inputs and outputs must use separate buffers`);
    }
    getRasterFloatLiteral(this.input.scale ?? 1);
    getRasterFloatLiteral(this.input.offset ?? 0);
  }

  /** Adds one bounded 8×8 compute dispatch with workgroup-shared values and validity. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const dispatchSize = validateMorphologyGraphResources(graph, this);
    const resources: GraphResourceUse[] = [
      {buffer: this.input.storage.values, usage: 'storage-read'},
      {buffer: this.output, usage: 'storage-write'},
      {buffer: this.outputValidity, usage: 'storage-write'}
    ];
    if (this.input.validity) resources.push({buffer: this.input.validity, usage: 'storage-read'});

    graph.addComputePass({
      id: this.id,
      resources,
      compile: ({device}) => {
        const bindings: BindingDeclaration[] = [
          {name: 'sourceValues', type: 'read-only-storage', group: 0, location: 0},
          {name: 'outputValues', type: 'storage', group: 0, location: 1},
          {name: 'outputValidity', type: 'storage', group: 0, location: 2}
        ];
        if (this.input.validity) {
          bindings.push({name: 'sourceValidity', type: 'read-only-storage', group: 0, location: 3});
        }
        const computation = new Computation(device, {
          id: this.id,
          source: this.getShaderSource(),
          shaderLayout: {bindings}
        });
        return {
          encode: ({computePass, getBuffer}) => {
            const resolvedBindings: Record<string, Binding> = {
              sourceValues: getViewBinding(this.input.storage.values, getBuffer),
              outputValues: getViewBinding(this.output, getBuffer),
              outputValidity: getViewBinding(this.outputValidity, getBuffer)
            };
            if (this.input.validity) {
              resolvedBindings['sourceValidity'] = getViewBinding(this.input.validity, getBuffer);
            }
            computation.setBindings(resolvedBindings);
            computation.dispatch(computePass, dispatchSize[0], dispatchSize[1]);
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }

  private getShaderSource(): string {
    const tileWidth = RASTER_WORKGROUP_DIMENSION + this.radius * 2;
    const tilePixelCount = tileWidth * tileWidth;
    const outputType = this.mode === 'binary' ? 'u32' : 'f32';
    const validityDeclaration = this.input.validity
      ? `@group(0) @binding(3) var<storage, read> sourceValidity: array<u32>;\nconst SOURCE_VALIDITY_OFFSET: u32 = ${getViewElementOffset(this.input.validity)}u;`
      : '';
    const validityConditions = ['isFiniteValue(sample)'];
    if (this.input.format === 'float32') validityConditions.push('isFiniteValue(rawSample)');
    if (this.input.validity) {
      validityConditions.push('sourceValidity[SOURCE_VALIDITY_OFFSET + sourceIndex] != 0u');
    }
    if (this.input.noDataValue !== undefined && !Number.isNaN(this.input.noDataValue)) {
      validityConditions.push(
        `rawSample != ${getRasterScalarLiteral(this.input.noDataValue, this.input.format)}`
      );
    }
    const sourceExpression =
      this.mode === 'binary'
        ? 'select(0.0, 1.0, rawSample != 0u)'
        : `f32(rawSample) * ${getRasterFloatLiteral(this.input.scale ?? 1)} + ${getRasterFloatLiteral(this.input.offset ?? 0)}`;
    const borderSample =
      this.mode === 'binary' ? (this.borderValue === 0 ? 0 : 1) : this.borderValue;
    const outOfBoundsHandling = getMorphologyBorderHandling(this.borderMode, borderSample);
    const footprintCondition =
      this.structuringElement === 'cross'
        ? 'abs(i32(kernelColumn) - RADIUS) + abs(i32(kernelRow) - RADIUS) <= RADIUS'
        : 'true';
    const initialExtreme = this.operation === 'dilate' ? '-3.402823466e+38' : '3.402823466e+38';
    const extremeExpression =
      this.operation === 'dilate' ? 'max(extreme, sample)' : 'min(extreme, sample)';
    const invalidNeighborHandling =
      this.noDataPolicy === 'propagate' ? 'neighborhoodIsValid = false;' : '';
    const outputExpression =
      this.mode === 'binary'
        ? 'select(0u, select(0u, 1u, extreme != 0.0), neighborhoodIsValid)'
        : 'select(invalidValue, extreme, neighborhoodIsValid)';
    const invalidValueDeclaration =
      this.mode === 'grayscale'
        ? 'let invalidValue = bitcast<f32>(0x7fc00000u | (pixelIndex & 0u));'
        : '';

    return /* wgsl */ `
const WIDTH: u32 = ${this.width}u;
const HEIGHT: u32 = ${this.height}u;
const RADIUS: i32 = ${this.radius}i;
const TILE_WIDTH: u32 = ${tileWidth}u;
const TILE_PIXEL_COUNT: u32 = ${tilePixelCount}u;
const SOURCE_OFFSET: u32 = ${getViewElementOffset(this.input.storage.values)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(this.output)}u;
const OUTPUT_VALIDITY_OFFSET: u32 = ${getViewElementOffset(this.outputValidity)}u;
@group(0) @binding(0) var<storage, read> sourceValues: array<${getRasterShaderScalarType(this.input.format)}>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<${outputType}>;
@group(0) @binding(2) var<storage, read_write> outputValidity: array<u32>;
${validityDeclaration}
var<workgroup> neighborhoodValues: array<f32, ${tilePixelCount}>;
var<workgroup> neighborhoodValidity: array<u32, ${tilePixelCount}>;

fn isFiniteValue(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

fn reflectCoordinate(value: i32, length: i32) -> i32 {
  if (length <= 1i) { return 0i; }
  let period = (length - 1i) * 2i;
  let reflected = ((value % period) + period) % period;
  return select(reflected, period - reflected, reflected >= length);
}

@compute @workgroup_size(${RASTER_WORKGROUP_DIMENSION}, ${RASTER_WORKGROUP_DIMENSION})
fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let localIndex = localId.y * ${RASTER_WORKGROUP_DIMENSION}u + localId.x;
  let workgroupOrigin = vec2<i32>(
    i32(workgroupId.x * ${RASTER_WORKGROUP_DIMENSION}u),
    i32(workgroupId.y * ${RASTER_WORKGROUP_DIMENSION}u)
  );
  for (
    var tileIndex = localIndex;
    tileIndex < TILE_PIXEL_COUNT;
    tileIndex += ${RASTER_WORKGROUP_DIMENSION * RASTER_WORKGROUP_DIMENSION}u
  ) {
    var sourceColumn = workgroupOrigin.x + i32(tileIndex % TILE_WIDTH) - RADIUS;
    var sourceRow = workgroupOrigin.y + i32(tileIndex / TILE_WIDTH) - RADIUS;
    var sample = ${getRasterFloatLiteral(borderSample)};
    var validSample = false;
    var sampleSource = true;
    if (
      sourceColumn < 0i || sourceColumn >= i32(WIDTH) ||
      sourceRow < 0i || sourceRow >= i32(HEIGHT)
    ) {
      ${outOfBoundsHandling}
    }
    if (sampleSource) {
      let sourceIndex = u32(sourceRow) * WIDTH + u32(sourceColumn);
      let rawSample = sourceValues[SOURCE_OFFSET + sourceIndex];
      sample = ${sourceExpression};
      validSample = ${validityConditions.join(' && ')};
    }
    neighborhoodValues[tileIndex] = sample;
    neighborhoodValidity[tileIndex] = select(0u, 1u, validSample);
  }
  workgroupBarrier();

  if (globalId.x >= WIDTH || globalId.y >= HEIGHT) { return; }
  let pixelIndex = globalId.y * WIDTH + globalId.x;
  let centerIndex = (localId.y + u32(RADIUS)) * TILE_WIDTH + localId.x + u32(RADIUS);
  var neighborhoodIsValid = neighborhoodValidity[centerIndex] != 0u;
  var extreme = ${initialExtreme};
  var participatingSamples = 0u;
  for (var kernelRow = 0u; kernelRow < ${this.radius * 2 + 1}u; kernelRow++) {
    for (var kernelColumn = 0u; kernelColumn < ${this.radius * 2 + 1}u; kernelColumn++) {
      if (${footprintCondition}) {
        let tileIndex = (localId.y + kernelRow) * TILE_WIDTH + localId.x + kernelColumn;
        if (neighborhoodValidity[tileIndex] != 0u) {
          let sample = neighborhoodValues[tileIndex];
          extreme = ${extremeExpression};
          participatingSamples += 1u;
        } else {
          ${invalidNeighborHandling}
        }
      }
    }
  }
  neighborhoodIsValid = neighborhoodIsValid && participatingSamples != 0u && isFiniteValue(extreme);
  ${invalidValueDeclaration}
  outputValues[OUTPUT_OFFSET + pixelIndex] = ${outputExpression};
  outputValidity[OUTPUT_VALIDITY_OFFSET + pixelIndex] = select(0u, 1u, neighborhoodIsValid);
}`;
  }
}

/** One canonical binary OR or calibrated grayscale maximum over its structuring element. */
export class GPURasterDilation extends GPURasterMorphology {
  constructor(props: GPURasterDilationProps) {
    const id = props.id ?? 'gpu-raster-dilation';
    super(addMorphologyOperation(props, 'dilate', id));
  }
}

/** One canonical binary AND or calibrated grayscale minimum over its structuring element. */
export class GPURasterErosion extends GPURasterMorphology {
  constructor(props: GPURasterErosionProps) {
    const id = props.id ?? 'gpu-raster-erosion';
    super(addMorphologyOperation(props, 'erode', id));
  }
}

/** Ordered morphology pair with typed graph-owned sample and validity scratch. */
abstract class GPURasterComposedMorphology implements GPUCommandGraphContributor {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly input: GPURasterBufferBand;
  readonly output: GraphDataView<'float32'> | GraphDataView<'uint32'>;
  readonly outputValidity: GraphDataView<'uint32'>;
  readonly mode: GPURasterMorphologyMode;
  readonly radius: number;
  readonly requiredHalo: number;
  readonly structuringElement: GPURasterStructuringElement;
  readonly borderMode: GPURasterBorderMode;
  readonly borderValue: number;
  readonly noDataPolicy: GPURasterMorphologyNoDataPolicy;

  private readonly props: GPURasterDilationProps;
  private readonly firstOperation: GPURasterMorphologyOperation;
  private readonly secondOperation: GPURasterMorphologyOperation;

  protected constructor(
    props: GPURasterDilationProps,
    firstOperation: GPURasterMorphologyOperation,
    secondOperation: GPURasterMorphologyOperation,
    defaultId: string
  ) {
    const id = props.id ?? defaultId;
    const primitive = new GPURasterMorphology(addMorphologyOperation(props, firstOperation, id));
    this.props = createMorphologyPropsSnapshot(props, primitive);
    this.id = primitive.id;
    this.width = primitive.width;
    this.height = primitive.height;
    this.input = this.props.input;
    this.output = primitive.output;
    this.outputValidity = primitive.outputValidity;
    this.mode = primitive.mode;
    this.radius = primitive.radius;
    this.requiredHalo = primitive.radius * 2;
    this.structuringElement = primitive.structuringElement;
    this.borderMode = primitive.borderMode;
    this.borderValue = primitive.borderValue;
    this.noDataPolicy = primitive.noDataPolicy;
    this.firstOperation = firstOperation;
    this.secondOperation = secondOperation;
  }

  /** Adds one radius-zero identity or two ordered passes with graph-owned typed scratch. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    if (this.radius === 0) {
      new GPURasterMorphology(
        addMorphologyOperation(this.props, this.firstOperation, this.id)
      ).addToGraph(graph);
      return;
    }

    validateMorphologyGraphResources(graph, this);
    if (graph.device.limits.maxStorageBuffersPerShaderStage < 4) {
      throw new Error(`${this.id} morphology pair exceeds the device storage binding count`);
    }
    const pixelCount = this.width * this.height;
    const intermediateValidity = createTransientView(
      graph,
      `${this.id}-intermediate-validity`,
      'uint32',
      pixelCount
    );
    assertRasterStorageBindingFits(
      graph.device,
      intermediateValidity,
      `${this.id} intermediate validity`
    );

    if (this.props.mode === 'binary') {
      const intermediateValues = createTransientView(
        graph,
        `${this.id}-intermediate-values`,
        'uint32',
        pixelCount
      );
      assertRasterStorageBindingFits(graph.device, intermediateValues, `${this.id} intermediate`);
      new GPURasterMorphology({
        ...this.props,
        id: `${this.id}-${this.firstOperation}`,
        output: intermediateValues,
        outputValidity: intermediateValidity,
        operation: this.firstOperation
      }).addToGraph(graph);
      new GPURasterMorphology({
        ...this.props,
        id: `${this.id}-${this.secondOperation}`,
        input: {
          id: `${this.id}-intermediate`,
          format: 'uint32',
          storage: {kind: 'buffer', values: intermediateValues},
          validity: intermediateValidity
        },
        operation: this.secondOperation
      }).addToGraph(graph);
      return;
    }

    const intermediateValues = createTransientView(
      graph,
      `${this.id}-intermediate-values`,
      'float32',
      pixelCount
    );
    assertRasterStorageBindingFits(graph.device, intermediateValues, `${this.id} intermediate`);
    new GPURasterMorphology({
      ...this.props,
      id: `${this.id}-${this.firstOperation}`,
      output: intermediateValues,
      outputValidity: intermediateValidity,
      operation: this.firstOperation
    }).addToGraph(graph);
    new GPURasterMorphology({
      ...this.props,
      id: `${this.id}-${this.secondOperation}`,
      input: {
        id: `${this.id}-intermediate`,
        format: 'float32',
        storage: {kind: 'buffer', values: intermediateValues},
        validity: intermediateValidity
      },
      operation: this.secondOperation
    }).addToGraph(graph);
  }
}

/** Erosion followed by dilation; removes small bright/binary foreground islands. */
export class GPURasterOpening extends GPURasterComposedMorphology {
  constructor(props: GPURasterOpeningProps) {
    super(props, 'erode', 'dilate', 'gpu-raster-opening');
  }
}

/** Dilation followed by erosion; fills small dark/binary background holes. */
export class GPURasterClosing extends GPURasterComposedMorphology {
  constructor(props: GPURasterClosingProps) {
    super(props, 'dilate', 'erode', 'gpu-raster-closing');
  }
}

function addMorphologyOperation(
  props: GPURasterDilationProps,
  operation: GPURasterMorphologyOperation,
  id: string
): GPURasterMorphologyProps {
  return props.mode === 'binary' ? {...props, id, operation} : {...props, id, operation};
}

function createMorphologyPropsSnapshot(
  props: GPURasterDilationProps,
  primitive: GPURasterMorphology
): GPURasterDilationProps {
  const normalizedProps = {
    id: primitive.id,
    width: primitive.width,
    height: primitive.height,
    radius: primitive.radius,
    structuringElement: primitive.structuringElement,
    borderMode: primitive.borderMode,
    borderValue: primitive.borderValue,
    noDataPolicy: primitive.noDataPolicy,
    outputValidity: primitive.outputValidity
  };

  if (props.mode === 'binary') {
    return {
      ...normalizedProps,
      mode: 'binary',
      input: createMorphologyInputSnapshot(props.input),
      output: props.output
    };
  }

  return {
    ...normalizedProps,
    mode: 'grayscale',
    input: createMorphologyInputSnapshot(props.input),
    output: props.output
  };
}

function createMorphologyInputSnapshot(
  input: GPURasterBufferBand<'uint32'>
): GPURasterBufferBand<'uint32'>;
function createMorphologyInputSnapshot(input: GPURasterBufferBand): GPURasterBufferBand;
function createMorphologyInputSnapshot(input: GPURasterBufferBand): GPURasterBufferBand {
  switch (input.format) {
    case 'float32':
      return {...input, storage: {...input.storage}};
    case 'uint32':
      return {...input, storage: {...input.storage}};
    case 'sint32':
      return {...input, storage: {...input.storage}};
  }
}

function validateMorphologyGraphResources<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  morphology: Pick<
    GPURasterMorphology,
    'id' | 'width' | 'height' | 'radius' | 'input' | 'output' | 'outputValidity'
  >
): readonly [number, number] {
  const views = [
    morphology.input.storage.values,
    morphology.output,
    morphology.outputValidity,
    ...(morphology.input.validity ? [morphology.input.validity] : [])
  ];
  for (const view of views) {
    if (view.buffer.graph !== graph) {
      throw new Error(`${morphology.id} resources must belong to the target graph`);
    }
    assertRasterStorageBindingFits(graph.device, view, `${morphology.id} ${view.buffer.id}`);
  }
  const dispatchSize = getRasterDispatchSize(
    graph.device,
    morphology.width,
    morphology.height,
    morphology.id
  );
  const tileWidth = RASTER_WORKGROUP_DIMENSION + morphology.radius * 2;
  const localStorageByteLength = tileWidth * tileWidth * Float32Array.BYTES_PER_ELEMENT * 2;
  if (localStorageByteLength > graph.device.limits.maxComputeWorkgroupStorageSize) {
    throw new Error(`${morphology.id} morphology exceeds the device workgroup storage limit`);
  }
  if (views.length > graph.device.limits.maxStorageBuffersPerShaderStage) {
    throw new Error(`${morphology.id} morphology exceeds the device storage binding count`);
  }
  return dispatchSize;
}

function getMorphologyBorderHandling(borderMode: GPURasterBorderMode, borderValue: number): string {
  switch (borderMode) {
    case 'clamp':
      return `sourceColumn = clamp(sourceColumn, 0i, i32(WIDTH) - 1i);\n      sourceRow = clamp(sourceRow, 0i, i32(HEIGHT) - 1i);`;
    case 'reflect':
      return `sourceColumn = reflectCoordinate(sourceColumn, i32(WIDTH));\n      sourceRow = reflectCoordinate(sourceRow, i32(HEIGHT));`;
    case 'constant':
      return `sample = ${getRasterFloatLiteral(borderValue)};\n      validSample = true;\n      sampleSource = false;`;
    case 'nodata':
      return 'sampleSource = false;';
  }
}
