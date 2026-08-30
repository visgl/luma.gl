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
} from '@luma.gl/gpgpu/gpu-core';
import {createTransientView, getViewBinding, getViewElementOffset} from '@luma.gl/gpgpu/gpu-core';
import type {GPUVolumeBufferChannel} from './types';
import {
  assertVolumeStorageBindingFits,
  getVolumeDispatchSize,
  getVolumeFloatLiteral,
  getVolumeScalarLiteral,
  getVolumeShaderScalarType,
  validateVolumeChannel,
  validateVolumeDimensions,
  validateVolumeScalarView,
  validateVolumeValidityView,
  VOLUME_WORKGROUP_DIMENSION
} from './volume-utils';

/** Canonical uint32 foreground masks or calibrated float32 neighborhood extrema. */
export type GPUVolumeMorphologyMode = 'binary' | 'grayscale';

/** Dilation selects the maximum; erosion selects the minimum. */
export type GPUVolumeMorphologyOperation = 'dilate' | 'erode';

/** Bounded cuCIM-style three-dimensional footprint families. */
export type GPUVolumeStructuringElement = 'cube' | 'octahedron' | 'ball';

/** Explicit out-of-volume sampling behavior. */
export type GPUVolumeBorderMode = 'clamp' | 'reflect' | 'constant' | 'nodata';

/** Reject missing included neighbors, or skip them while preserving invalid centers. */
export type GPUVolumeMorphologyNoDataPolicy = 'propagate' | 'ignore';

/** Shared bounded-footprint, border, validity, and graph-ownership contract. */
export type GPUVolumeMorphologyBaseProps = {
  id?: string;
  width: number;
  height: number;
  depth: number;
  /** Symmetric source-voxel radius, bounded to zero through four. */
  radius: number;
  /** Cube is the default; octahedron and ball use Manhattan and Euclidean distance. */
  structuringElement?: GPUVolumeStructuringElement;
  /** Defaults to clamp; reflect does not repeat the nearest edge sample. */
  borderMode?: GPUVolumeBorderMode;
  /** Calibrated grayscale value, or a canonicalized nonzero binary flag. */
  borderValue?: number;
  /** Defaults to strict propagation. Invalid center voxels never become valid. */
  noDataPolicy?: GPUVolumeMorphologyNoDataPolicy;
  /** Separate caller-owned packed uint32 validity flags. */
  outputValidity: GraphDataView<'uint32'>;
};

/** Canonical binary morphology accepts uint32 threshold flags without recalibration. */
export type GPUVolumeBinaryMorphologyProps = GPUVolumeMorphologyBaseProps & {
  mode: 'binary';
  input: GPUVolumeBufferChannel<'uint32'>;
  output: GraphDataView<'uint32'>;
};

/** Grayscale morphology calibrates native scalar samples before selecting extrema. */
export type GPUVolumeGrayscaleMorphologyProps = GPUVolumeMorphologyBaseProps & {
  mode?: 'grayscale';
  input: GPUVolumeBufferChannel;
  output: GraphDataView<'float32'>;
};

/** One explicit min/max pass over a strictly discriminated binary or grayscale volume. */
export type GPUVolumeMorphologyProps =
  | (GPUVolumeBinaryMorphologyProps & {operation: GPUVolumeMorphologyOperation})
  | (GPUVolumeGrayscaleMorphologyProps & {operation: GPUVolumeMorphologyOperation});

export type GPUVolumeDilationProps =
  | GPUVolumeBinaryMorphologyProps
  | GPUVolumeGrayscaleMorphologyProps;
export type GPUVolumeErosionProps = GPUVolumeDilationProps;
export type GPUVolumeOpeningProps = GPUVolumeDilationProps;
export type GPUVolumeClosingProps = GPUVolumeDilationProps;

/**
 * Computes one explicitly bordered, nodata-aware morphological dilation or erosion.
 *
 * Workgroups cooperatively cache calibrated source values and validity. Binary sources are
 * canonicalized from uint32 flags and remain uint32; grayscale outputs are float32 extrema.
 */
export class GPUVolumeMorphology implements GPUCommandGraphContributor {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  readonly input: GPUVolumeBufferChannel;
  readonly output: GraphDataView<'float32'> | GraphDataView<'uint32'>;
  readonly outputValidity: GraphDataView<'uint32'>;
  readonly mode: GPUVolumeMorphologyMode;
  readonly operation: GPUVolumeMorphologyOperation;
  readonly radius: number;
  readonly requiredHalo: number;
  readonly structuringElement: GPUVolumeStructuringElement;
  readonly borderMode: GPUVolumeBorderMode;
  readonly borderValue: number;
  readonly noDataPolicy: GPUVolumeMorphologyNoDataPolicy;

  constructor(props: GPUVolumeMorphologyProps) {
    this.id = props.id ?? 'gpu-volume-morphology';
    this.width = props.width;
    this.height = props.height;
    this.depth = props.depth;
    this.input = props.input;
    this.output = props.output;
    this.outputValidity = props.outputValidity;
    this.mode = props.mode ?? 'grayscale';
    this.operation = props.operation;
    this.radius = props.radius;
    this.requiredHalo = props.radius;
    this.structuringElement = props.structuringElement ?? 'cube';
    this.borderMode = props.borderMode ?? 'clamp';
    this.borderValue = props.borderValue ?? 0;
    this.noDataPolicy = props.noDataPolicy ?? 'propagate';

    const voxelCount = validateVolumeDimensions(this, this.id);
    if (this.mode !== 'binary' && this.mode !== 'grayscale') {
      throw new Error(`${this.id} morphology mode must be binary or grayscale`);
    }
    if (this.operation !== 'dilate' && this.operation !== 'erode') {
      throw new Error(`${this.id} morphology operation must be dilate or erode`);
    }
    if (!Number.isSafeInteger(this.radius) || this.radius < 0 || this.radius > 4) {
      throw new Error(`${this.id} morphology radius must be an integer from zero through four`);
    }
    if (!['cube', 'octahedron', 'ball'].includes(this.structuringElement)) {
      throw new Error(`${this.id} structuring element must be cube, octahedron, or ball`);
    }
    if (!['clamp', 'reflect', 'constant', 'nodata'].includes(this.borderMode)) {
      throw new Error(`${this.id} border mode must be clamp, reflect, constant, or nodata`);
    }
    if (!Number.isFinite(this.borderValue)) {
      throw new Error(`${this.id} constant border value must be finite`);
    }
    getVolumeFloatLiteral(this.borderValue);
    if (this.noDataPolicy !== 'propagate' && this.noDataPolicy !== 'ignore') {
      throw new Error(`${this.id} nodata policy must be propagate or ignore`);
    }

    const owner = validateVolumeChannel(this.input, this, `${this.id} input`);
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
    validateVolumeScalarView(this.output, outputFormat, voxelCount, `${this.id} output`);
    validateVolumeValidityView(this.outputValidity, voxelCount, `${this.id} output validity`);
    if (this.output.buffer.graph !== owner || this.outputValidity.buffer.graph !== owner) {
      throw new Error(`${this.id} resources must belong to the same graph`);
    }
    const inputBuffers = [
      this.input.values.buffer,
      ...(this.input.validity ? [this.input.validity.buffer] : [])
    ];
    if (
      this.output.buffer === this.outputValidity.buffer ||
      inputBuffers.includes(this.output.buffer) ||
      inputBuffers.includes(this.outputValidity.buffer)
    ) {
      throw new Error(`${this.id} morphology inputs and outputs must use separate buffers`);
    }
    getVolumeFloatLiteral(this.input.scale ?? 1);
    getVolumeFloatLiteral(this.input.offset ?? 0);
  }

  /** Adds one bounded 4x4x4 compute dispatch with workgroup-shared values and validity. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const dispatch = validateMorphologyGraphResources(graph, this);
    const resources: GraphResourceUse[] = [
      {buffer: this.input.values, usage: 'storage-read'},
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
              sourceValues: getViewBinding(this.input.values, getBuffer),
              outputValues: getViewBinding(this.output, getBuffer),
              outputValidity: getViewBinding(this.outputValidity, getBuffer)
            };
            if (this.input.validity) {
              resolvedBindings['sourceValidity'] = getViewBinding(this.input.validity, getBuffer);
            }
            computation.setBindings(resolvedBindings);
            computation.dispatch(computePass, dispatch[0], dispatch[1], dispatch[2]);
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }

  private getShaderSource(): string {
    const tileWidth = VOLUME_WORKGROUP_DIMENSION + this.radius * 2;
    const tileVoxelCount = tileWidth * tileWidth * tileWidth;
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
        `rawSample != ${getVolumeScalarLiteral(this.input.noDataValue, this.input.format)}`
      );
    }
    const sourceExpression =
      this.mode === 'binary'
        ? 'select(0.0, 1.0, rawSample != 0u)'
        : `f32(rawSample) * ${getVolumeFloatLiteral(this.input.scale ?? 1)} + ${getVolumeFloatLiteral(this.input.offset ?? 0)}`;
    const borderSample =
      this.mode === 'binary' ? (this.borderValue === 0 ? 0 : 1) : this.borderValue;
    const outOfBoundsHandling = getMorphologyBorderHandling(this.borderMode, borderSample);
    const footprintCondition = getFootprintCondition(this.structuringElement);
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
        ? 'let invalidValue = bitcast<f32>(0x7fc00000u | (voxelIndex & 0u));'
        : '';

    return /* wgsl */ `
const WIDTH: u32 = ${this.width}u;
const HEIGHT: u32 = ${this.height}u;
const DEPTH: u32 = ${this.depth}u;
const RADIUS: i32 = ${this.radius}i;
const TILE_WIDTH: u32 = ${tileWidth}u;
const TILE_VOXEL_COUNT: u32 = ${tileVoxelCount}u;
const SOURCE_OFFSET: u32 = ${getViewElementOffset(this.input.values)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(this.output)}u;
const OUTPUT_VALIDITY_OFFSET: u32 = ${getViewElementOffset(this.outputValidity)}u;
@group(0) @binding(0) var<storage, read> sourceValues: array<${getVolumeShaderScalarType(this.input.format)}>;
@group(0) @binding(1) var<storage, read_write> outputValues: array<${outputType}>;
@group(0) @binding(2) var<storage, read_write> outputValidity: array<u32>;
${validityDeclaration}
var<workgroup> neighborhoodValues: array<f32, ${tileVoxelCount}>;
var<workgroup> neighborhoodValidity: array<u32, ${tileVoxelCount}>;

fn isFiniteValue(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

fn reflectCoordinate(value: i32, length: i32) -> i32 {
  if (length <= 1i) { return 0i; }
  let period = (length - 1i) * 2i;
  let reflected = ((value % period) + period) % period;
  return select(reflected, period - reflected, reflected >= length);
}

@compute @workgroup_size(${VOLUME_WORKGROUP_DIMENSION}, ${VOLUME_WORKGROUP_DIMENSION}, ${VOLUME_WORKGROUP_DIMENSION})
fn main(
  @builtin(global_invocation_id) globalId: vec3<u32>,
  @builtin(local_invocation_id) localId: vec3<u32>,
  @builtin(workgroup_id) workgroupId: vec3<u32>
) {
  let localIndex = (localId.z * ${VOLUME_WORKGROUP_DIMENSION}u + localId.y) * ${VOLUME_WORKGROUP_DIMENSION}u + localId.x;
  let workgroupOrigin = vec3<i32>(workgroupId * ${VOLUME_WORKGROUP_DIMENSION}u);
  for (
    var tileIndex = localIndex;
    tileIndex < TILE_VOXEL_COUNT;
    tileIndex += ${VOLUME_WORKGROUP_DIMENSION ** 3}u
  ) {
    let tileX = tileIndex % TILE_WIDTH;
    let tileYZ = tileIndex / TILE_WIDTH;
    let tileY = tileYZ % TILE_WIDTH;
    let tileZ = tileYZ / TILE_WIDTH;
    var sourceX = workgroupOrigin.x + i32(tileX) - RADIUS;
    var sourceY = workgroupOrigin.y + i32(tileY) - RADIUS;
    var sourceZ = workgroupOrigin.z + i32(tileZ) - RADIUS;
    var sample = ${getVolumeFloatLiteral(borderSample)};
    var validSample = false;
    var sampleSource = true;
    if (
      sourceX < 0i || sourceX >= i32(WIDTH) ||
      sourceY < 0i || sourceY >= i32(HEIGHT) ||
      sourceZ < 0i || sourceZ >= i32(DEPTH)
    ) {
      ${outOfBoundsHandling}
    }
    if (sampleSource) {
      let sourceIndex = (u32(sourceZ) * HEIGHT + u32(sourceY)) * WIDTH + u32(sourceX);
      let rawSample = sourceValues[SOURCE_OFFSET + sourceIndex];
      sample = ${sourceExpression};
      validSample = ${validityConditions.join(' && ')};
    }
    neighborhoodValues[tileIndex] = sample;
    neighborhoodValidity[tileIndex] = select(0u, 1u, validSample);
  }
  workgroupBarrier();

  if (globalId.x >= WIDTH || globalId.y >= HEIGHT || globalId.z >= DEPTH) { return; }
  let voxelIndex = (globalId.z * HEIGHT + globalId.y) * WIDTH + globalId.x;
  let centerIndex =
    ((localId.z + u32(RADIUS)) * TILE_WIDTH + localId.y + u32(RADIUS)) * TILE_WIDTH +
    localId.x + u32(RADIUS);
  var neighborhoodIsValid = neighborhoodValidity[centerIndex] != 0u;
  var extreme = ${initialExtreme};
  var participatingSamples = 0u;
  for (var kernelZ = 0u; kernelZ < ${this.radius * 2 + 1}u; kernelZ++) {
    for (var kernelY = 0u; kernelY < ${this.radius * 2 + 1}u; kernelY++) {
      for (var kernelX = 0u; kernelX < ${this.radius * 2 + 1}u; kernelX++) {
        let delta = vec3<i32>(i32(kernelX), i32(kernelY), i32(kernelZ)) - vec3<i32>(RADIUS);
        if (${footprintCondition}) {
          let tileIndex =
            ((localId.z + kernelZ) * TILE_WIDTH + localId.y + kernelY) * TILE_WIDTH +
            localId.x + kernelX;
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
  }
  neighborhoodIsValid = neighborhoodIsValid && participatingSamples != 0u && isFiniteValue(extreme);
  ${invalidValueDeclaration}
  outputValues[OUTPUT_OFFSET + voxelIndex] = ${outputExpression};
  outputValidity[OUTPUT_VALIDITY_OFFSET + voxelIndex] = select(0u, 1u, neighborhoodIsValid);
}`;
  }
}

/** One canonical binary OR or calibrated grayscale maximum over its structuring element. */
export class GPUVolumeDilation extends GPUVolumeMorphology {
  constructor(props: GPUVolumeDilationProps) {
    const id = props.id ?? 'gpu-volume-dilation';
    super(addMorphologyOperation(props, 'dilate', id));
  }
}

/** One canonical binary AND or calibrated grayscale minimum over its structuring element. */
export class GPUVolumeErosion extends GPUVolumeMorphology {
  constructor(props: GPUVolumeErosionProps) {
    const id = props.id ?? 'gpu-volume-erosion';
    super(addMorphologyOperation(props, 'erode', id));
  }
}

/** Ordered morphology pair with typed graph-owned sample and validity scratch. */
abstract class GPUVolumeComposedMorphology implements GPUCommandGraphContributor {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  readonly input: GPUVolumeBufferChannel;
  readonly output: GraphDataView<'float32'> | GraphDataView<'uint32'>;
  readonly outputValidity: GraphDataView<'uint32'>;
  readonly mode: GPUVolumeMorphologyMode;
  readonly radius: number;
  readonly requiredHalo: number;
  readonly structuringElement: GPUVolumeStructuringElement;
  readonly borderMode: GPUVolumeBorderMode;
  readonly borderValue: number;
  readonly noDataPolicy: GPUVolumeMorphologyNoDataPolicy;

  private readonly props: GPUVolumeDilationProps;
  private readonly firstOperation: GPUVolumeMorphologyOperation;
  private readonly secondOperation: GPUVolumeMorphologyOperation;

  protected constructor(
    props: GPUVolumeDilationProps,
    firstOperation: GPUVolumeMorphologyOperation,
    secondOperation: GPUVolumeMorphologyOperation,
    defaultId: string
  ) {
    const id = props.id ?? defaultId;
    const primitive = new GPUVolumeMorphology(addMorphologyOperation(props, firstOperation, id));
    this.props = createMorphologyPropsSnapshot(props, primitive);
    this.id = primitive.id;
    this.width = primitive.width;
    this.height = primitive.height;
    this.depth = primitive.depth;
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
      new GPUVolumeMorphology(
        addMorphologyOperation(this.props, this.firstOperation, this.id)
      ).addToGraph(graph);
      return;
    }

    validateMorphologyGraphResources(graph, this);
    if (graph.device.limits.maxStorageBuffersPerShaderStage < 4) {
      throw new Error(`${this.id} morphology pair exceeds the device storage binding count`);
    }
    const voxelCount = this.width * this.height * this.depth;
    const intermediateValidity = createTransientView(
      graph,
      `${this.id}-intermediate-validity`,
      'uint32',
      voxelCount
    );
    assertVolumeStorageBindingFits(
      graph.device,
      intermediateValidity,
      `${this.id} intermediate validity`
    );

    if (this.props.mode === 'binary') {
      const intermediateValues = createTransientView(
        graph,
        `${this.id}-intermediate-values`,
        'uint32',
        voxelCount
      );
      assertVolumeStorageBindingFits(graph.device, intermediateValues, `${this.id} intermediate`);
      new GPUVolumeMorphology({
        ...this.props,
        id: `${this.id}-${this.firstOperation}`,
        output: intermediateValues,
        outputValidity: intermediateValidity,
        operation: this.firstOperation
      }).addToGraph(graph);
      new GPUVolumeMorphology({
        ...this.props,
        id: `${this.id}-${this.secondOperation}`,
        input: {
          id: `${this.id}-intermediate`,
          format: 'uint32',
          values: intermediateValues,
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
      voxelCount
    );
    assertVolumeStorageBindingFits(graph.device, intermediateValues, `${this.id} intermediate`);
    new GPUVolumeMorphology({
      ...this.props,
      id: `${this.id}-${this.firstOperation}`,
      output: intermediateValues,
      outputValidity: intermediateValidity,
      operation: this.firstOperation
    }).addToGraph(graph);
    new GPUVolumeMorphology({
      ...this.props,
      id: `${this.id}-${this.secondOperation}`,
      input: {
        id: `${this.id}-intermediate`,
        format: 'float32',
        values: intermediateValues,
        validity: intermediateValidity
      },
      operation: this.secondOperation
    }).addToGraph(graph);
  }
}

/** Erosion followed by dilation; removes small bright/binary foreground islands. */
export class GPUVolumeOpening extends GPUVolumeComposedMorphology {
  constructor(props: GPUVolumeOpeningProps) {
    super(props, 'erode', 'dilate', 'gpu-volume-opening');
  }
}

/** Dilation followed by erosion; fills small dark/binary background holes. */
export class GPUVolumeClosing extends GPUVolumeComposedMorphology {
  constructor(props: GPUVolumeClosingProps) {
    super(props, 'dilate', 'erode', 'gpu-volume-closing');
  }
}

function addMorphologyOperation(
  props: GPUVolumeDilationProps,
  operation: GPUVolumeMorphologyOperation,
  id: string
): GPUVolumeMorphologyProps {
  return props.mode === 'binary' ? {...props, id, operation} : {...props, id, operation};
}

function createMorphologyPropsSnapshot(
  props: GPUVolumeDilationProps,
  primitive: GPUVolumeMorphology
): GPUVolumeDilationProps {
  const normalizedProps = {
    id: primitive.id,
    width: primitive.width,
    height: primitive.height,
    depth: primitive.depth,
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
  input: GPUVolumeBufferChannel<'uint32'>
): GPUVolumeBufferChannel<'uint32'>;
function createMorphologyInputSnapshot(input: GPUVolumeBufferChannel): GPUVolumeBufferChannel;
function createMorphologyInputSnapshot(input: GPUVolumeBufferChannel): GPUVolumeBufferChannel {
  return {...input};
}

function validateMorphologyGraphResources<Parameters>(
  graph: GPUCommandGraph<Parameters>,
  morphology: Pick<
    GPUVolumeMorphology,
    'id' | 'width' | 'height' | 'depth' | 'radius' | 'input' | 'output' | 'outputValidity'
  >
): readonly [number, number, number] {
  if (graph.device.type !== 'webgpu') {
    throw new Error(`${morphology.id} volume morphology requires a WebGPU device`);
  }
  const views = [
    morphology.input.values,
    morphology.output,
    morphology.outputValidity,
    ...(morphology.input.validity ? [morphology.input.validity] : [])
  ];
  for (const view of views) {
    if (view.buffer.graph !== graph) {
      throw new Error(`${morphology.id} resources must belong to the target graph`);
    }
    assertVolumeStorageBindingFits(graph.device, view, `${morphology.id} ${view.buffer.id}`);
  }
  const dispatch = getVolumeDispatchSize(
    graph.device,
    morphology.width,
    morphology.height,
    morphology.depth,
    morphology.id
  );
  const tileWidth = VOLUME_WORKGROUP_DIMENSION + morphology.radius * 2;
  const localStorageByteLength = tileWidth ** 3 * Float32Array.BYTES_PER_ELEMENT * 2;
  if (localStorageByteLength > graph.device.limits.maxComputeWorkgroupStorageSize) {
    throw new Error(`${morphology.id} morphology exceeds the device workgroup storage limit`);
  }
  if (views.length > graph.device.limits.maxStorageBuffersPerShaderStage) {
    throw new Error(`${morphology.id} morphology exceeds the device storage binding count`);
  }
  return dispatch;
}

function getFootprintCondition(structuringElement: GPUVolumeStructuringElement): string {
  switch (structuringElement) {
    case 'cube':
      return 'true';
    case 'octahedron':
      return 'abs(delta.x) + abs(delta.y) + abs(delta.z) <= RADIUS';
    case 'ball':
      return 'delta.x * delta.x + delta.y * delta.y + delta.z * delta.z <= RADIUS * RADIUS';
  }
}

function getMorphologyBorderHandling(borderMode: GPUVolumeBorderMode, borderValue: number): string {
  switch (borderMode) {
    case 'clamp':
      return `sourceX = clamp(sourceX, 0i, i32(WIDTH) - 1i);
      sourceY = clamp(sourceY, 0i, i32(HEIGHT) - 1i);
      sourceZ = clamp(sourceZ, 0i, i32(DEPTH) - 1i);`;
    case 'reflect':
      return `sourceX = reflectCoordinate(sourceX, i32(WIDTH));
      sourceY = reflectCoordinate(sourceY, i32(HEIGHT));
      sourceZ = reflectCoordinate(sourceZ, i32(DEPTH));`;
    case 'constant':
      return `sample = ${getVolumeFloatLiteral(borderValue)};
      validSample = true;
      sampleSource = false;`;
    case 'nodata':
      return 'sampleSource = false;';
  }
}
