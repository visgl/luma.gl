// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Buffer, BufferAttributeLayout, Device, SignedDataType, VertexFormat} from '@luma.gl/core';
import {DynamicBuffer} from '@luma.gl/engine';
import {GPUVector} from '@luma.gl/tables';
import * as arrow from 'apache-arrow';
import {GPUTableEvaluator} from '../operation/gpu-table';
import {add} from '../operations/add';
import {fround} from '../operations/fround';
import {interleave} from '../operations/interleave';
import {cleanEvaluate} from '../utils/clean-evaluate';

/** Materialized or lazy GPUVector compute input. */
export type GPUVectorInput<T extends arrow.DataType = arrow.DataType> =
  | GPUVector<T>
  | GPUVectorOperationNode<T>;

/** Common props for GPUVector compute operations. */
export type GPUVectorOperationProps = {
  /** Name assigned to the output vector. */
  name?: string;
};

/** Operation-specific props for interleaved outputs. */
export type GPUVectorInterleaveProps = GPUVectorOperationProps & {
  /** Optional explicit interleaved attribute layout. */
  attributes?: BufferAttributeLayout[];
};

/** Base class for lazy GPUVector compute operation nodes. */
export abstract class GPUVectorOperationNode<T extends arrow.DataType = arrow.DataType> {
  /** User-facing operation props. */
  readonly props: GPUVectorOperationProps;

  protected constructor(props: GPUVectorOperationProps = {}) {
    this.props = props;
  }

  /** Evaluates this operation in a compute graph context. */
  abstract evaluate(context: GPUVectorComputeContext): Promise<GPUVector<T>>;
}

/** Evaluation context passed to lazy GPUVector operations. */
export type GPUVectorComputeContext = {
  /** Device used for GPU work. */
  readonly device: Device;
  /** Evaluates a lazy input or returns a materialized vector. */
  evaluate<T extends arrow.DataType>(input: GPUVectorInput<T>): Promise<GPUVector<T>>;
};

/** Lazy pairwise GPUVector addition. */
export class GPUVectorAddOperation<
  T extends arrow.DataType = arrow.DataType
> extends GPUVectorOperationNode<T> {
  /** Operation parameters. */
  readonly parameters: {x: GPUVectorInput<T>; y: GPUVectorInput<T>};

  constructor(props: {
    parameters: {x: GPUVectorInput<T>; y: GPUVectorInput<T>};
    props?: GPUVectorOperationProps;
  }) {
    super(props.props);
    this.parameters = props.parameters;
  }

  async evaluate(context: GPUVectorComputeContext): Promise<GPUVector<T>> {
    const x = await context.evaluate(this.parameters.x);
    const y = await context.evaluate(this.parameters.y);
    validateSameLength('gpuVectorAdd', x, y);
    validateSameLogicalType('gpuVectorAdd', x, y);
    validatePackedNumericInput('gpuVectorAdd', x, {allowFloat64: false});
    validatePackedNumericInput('gpuVectorAdd', y, {allowFloat64: false});

    const outputEvaluator = add(createEvaluator(x), createEvaluator(y));
    await cleanEvaluate(context.device, outputEvaluator);

    return createGPUVectorFromEvaluator({
      name: this.props.name ?? 'sum',
      evaluator: outputEvaluator,
      dataType: x.type as T
    });
  }
}

/** Lazy row interleave over two or more GPUVectors. */
export class GPUVectorInterleaveOperation extends GPUVectorOperationNode<arrow.Binary> {
  /** Operation parameters. */
  readonly parameters: {inputs: GPUVectorInput[]};
  /** Interleave-specific props. */
  readonly interleaveProps: GPUVectorInterleaveProps;

  constructor(props: {parameters: {inputs: GPUVectorInput[]}; props?: GPUVectorInterleaveProps}) {
    super(props.props);
    this.parameters = props.parameters;
    this.interleaveProps = props.props ?? {};
  }

  async evaluate(context: GPUVectorComputeContext): Promise<GPUVector<arrow.Binary>> {
    const inputs = await Promise.all(this.parameters.inputs.map(input => context.evaluate(input)));
    validateInputCount('gpuVectorInterleave', inputs, 2);
    const [firstInput, ...remainingInputs] = inputs;
    validateSameLength('gpuVectorInterleave', firstInput, ...remainingInputs);

    for (const input of inputs) {
      validatePackedNumericInput('gpuVectorInterleave', input, {allowFloat64: false});
      validateInterleavableInput(input);
    }
    validateSameComputeType('gpuVectorInterleave', firstInput, ...remainingInputs);

    const outputEvaluator = interleave(...inputs.map(input => createEvaluator(input)));
    await cleanEvaluate(context.device, outputEvaluator);

    const name = this.props.name ?? 'interleaved';
    return new GPUVector({
      type: 'interleaved',
      name,
      buffer: outputEvaluator.buffer,
      dataType: new arrow.Binary(),
      length: outputEvaluator.length,
      byteStride: outputEvaluator.stride,
      attributes: this.interleaveProps.attributes ?? createInterleavedAttributes(inputs),
      ownsBuffer: true
    });
  }
}

/** Lazy float64 split into high/low float32 components. */
export class GPUVectorFroundOperation<
  T extends arrow.DataType = arrow.DataType
> extends GPUVectorOperationNode<arrow.FixedSizeList<arrow.Float32>> {
  /** Operation parameters. */
  readonly parameters: {x: GPUVectorInput<T>};

  constructor(props: {parameters: {x: GPUVectorInput<T>}; props?: GPUVectorOperationProps}) {
    super(props.props);
    this.parameters = props.parameters;
  }

  async evaluate(
    context: GPUVectorComputeContext
  ): Promise<GPUVector<arrow.FixedSizeList<arrow.Float32>>> {
    const x = await context.evaluate(this.parameters.x);
    validatePackedNumericInput('gpuVectorFround', x, {allowFloat64: true});
    validateFloat64Input('gpuVectorFround', x);

    const outputEvaluator = fround(createEvaluator(x));
    await cleanEvaluate(context.device, outputEvaluator);

    return createGPUVectorFromEvaluator({
      name: this.props.name ?? `${x.name}-fround`,
      evaluator: outputEvaluator,
      dataType: new arrow.FixedSizeList(
        outputEvaluator.size,
        new arrow.Field('value', new arrow.Float32(), false)
      )
    });
  }
}

/** Creates a lazy pairwise GPUVector addition operation. */
export function gpuVectorAdd<T extends arrow.DataType>(
  x: GPUVectorInput<T>,
  y: GPUVectorInput<T>,
  props?: GPUVectorOperationProps
): GPUVectorAddOperation<T> {
  return new GPUVectorAddOperation({parameters: {x, y}, props});
}

/** Creates a lazy row interleave operation. */
export function gpuVectorInterleave(
  inputs: GPUVectorInput[],
  props?: GPUVectorInterleaveProps
): GPUVectorInterleaveOperation {
  return new GPUVectorInterleaveOperation({parameters: {inputs}, props});
}

/** Creates a lazy float64 split operation. */
export function gpuVectorFround<T extends arrow.DataType>(
  x: GPUVectorInput<T>,
  props?: GPUVectorOperationProps
): GPUVectorFroundOperation<T> {
  return new GPUVectorFroundOperation({parameters: {x}, props});
}

/** Evaluates a GPUVector compute graph and returns a GPU-resident output vector. */
export async function evaluateGPUVectorComputeGraph<T extends arrow.DataType>(
  input: GPUVectorInput<T>,
  device?: Device
): Promise<GPUVector<T>> {
  if (input instanceof GPUVector) {
    return input;
  }
  const context = new GPUVectorComputeGraph(device ?? getInputDevice(input));
  return context.evaluate(input);
}

/** Immediate convenience wrapper around GPUVector compute operation nodes. */
export class GPUVectorTransform {
  private readonly device: Device;

  constructor(device: Device) {
    this.device = device;
  }

  /** Adds two GPUVectors out-of-place. */
  add<T extends arrow.DataType>(
    x: GPUVectorInput<T>,
    y: GPUVectorInput<T>,
    props?: GPUVectorOperationProps
  ): Promise<GPUVector<T>> {
    return evaluateGPUVectorComputeGraph(gpuVectorAdd(x, y, props), this.device);
  }

  /** Interleaves two or more GPUVectors out-of-place. */
  interleave(
    inputs: GPUVectorInput[],
    props?: GPUVectorInterleaveProps
  ): Promise<GPUVector<arrow.Binary>> {
    return evaluateGPUVectorComputeGraph(gpuVectorInterleave(inputs, props), this.device);
  }

  /** Splits float64 rows into high/low float32 components out-of-place. */
  fround<T extends arrow.DataType>(
    x: GPUVectorInput<T>,
    props?: GPUVectorOperationProps
  ): Promise<GPUVector<arrow.FixedSizeList<arrow.Float32>>> {
    return evaluateGPUVectorComputeGraph(gpuVectorFround(x, props), this.device);
  }
}

class GPUVectorComputeGraph implements GPUVectorComputeContext {
  readonly device: Device;
  private readonly evaluatedNodes = new Map<GPUVectorOperationNode, Promise<GPUVector>>();

  constructor(device: Device) {
    this.device = device;
  }

  async evaluate<T extends arrow.DataType>(input: GPUVectorInput<T>): Promise<GPUVector<T>> {
    if (input instanceof GPUVector) {
      return input;
    }

    let evaluatedNode = this.evaluatedNodes.get(input);
    if (!evaluatedNode) {
      evaluatedNode = input.evaluate(this);
      this.evaluatedNodes.set(input, evaluatedNode);
    }
    return evaluatedNode as Promise<GPUVector<T>>;
  }
}

function createEvaluator(vector: GPUVector): GPUTableEvaluator {
  validatePackedNumericInput('GPUVector compute', vector, {allowFloat64: true});
  const {type, size} = getEvaluatorTypeAndSize(vector);

  return new GPUTableEvaluator({
    id: vector.name,
    type,
    size,
    offset: vector.byteOffset,
    stride: vector.byteStride,
    length: vector.length,
    buffer: getConcreteBuffer(vector)
  });
}

function createGPUVectorFromEvaluator<T extends arrow.DataType>(props: {
  name: string;
  evaluator: GPUTableEvaluator;
  dataType: T;
}): GPUVector<T> {
  return new GPUVector({
    type: 'buffer',
    name: props.name,
    buffer: props.evaluator.buffer,
    dataType: props.dataType,
    length: props.evaluator.length,
    stride: props.evaluator.size,
    byteStride: props.evaluator.stride,
    rowByteLength: props.evaluator.ValueType.BYTES_PER_ELEMENT * props.evaluator.size,
    ownsBuffer: true
  });
}

function getEvaluatorTypeAndSize(vector: GPUVector): {type: SignedDataType; size: number} {
  const scalarType = getScalarDataType(vector.type);
  if (arrow.DataType.isFloat(scalarType) && scalarType.precision === arrow.Precision.DOUBLE) {
    return {type: 'uint32', size: vector.stride * 2};
  }
  return {type: getSignedDataType(scalarType), size: vector.stride};
}

function getInputDevice(input: GPUVectorInput): Device {
  const device = findInputDevice(input);
  if (!device) {
    throw new Error('evaluateGPUVectorComputeGraph requires a device or a GPUVector input');
  }
  return device;
}

function findInputDevice(input: GPUVectorInput): Device | null {
  if (input instanceof GPUVector) {
    return getConcreteBuffer(input).device;
  }
  if (input instanceof GPUVectorAddOperation) {
    return findInputDevice(input.parameters.x) ?? findInputDevice(input.parameters.y);
  }
  if (input instanceof GPUVectorInterleaveOperation) {
    for (const childInput of input.parameters.inputs) {
      const device = findInputDevice(childInput);
      if (device) {
        return device;
      }
    }
  }
  if (input instanceof GPUVectorFroundOperation) {
    return findInputDevice(input.parameters.x);
  }
  return null;
}

function getConcreteBuffer(vector: GPUVector): Buffer {
  try {
    const buffer = vector.buffer;
    return buffer instanceof DynamicBuffer ? buffer.buffer : buffer;
  } catch (error) {
    throw new Error(
      `GPUVector compute requires a single-buffer vector "${vector.name}": ${(error as Error).message}`
    );
  }
}

function validateInputCount(operationName: string, inputs: unknown[], minimumCount: number): void {
  if (inputs.length < minimumCount) {
    throw new Error(`${operationName} requires at least ${minimumCount} inputs`);
  }
}

function validateSameLength(operationName: string, first: GPUVector, ...rest: GPUVector[]): void {
  for (const vector of rest) {
    if (vector.length !== first.length) {
      throw new Error(
        `${operationName} requires matching vector lengths, got ${first.length} and ${vector.length}`
      );
    }
  }
}

function validateSameLogicalType(operationName: string, first: GPUVector, second: GPUVector): void {
  if (!arrow.util.compareTypes(first.type, second.type)) {
    throw new Error(`${operationName} requires matching GPUVector logical types`);
  }
  if (first.stride !== second.stride || first.rowByteLength !== second.rowByteLength) {
    throw new Error(`${operationName} requires matching GPUVector row layouts`);
  }
}

function validateSameComputeType(operationName: string, first: GPUVector, ...rest: GPUVector[]): void {
  const firstType = getSignedDataType(getScalarDataType(first.type));
  for (const vector of rest) {
    const type = getSignedDataType(getScalarDataType(vector.type));
    if (type !== firstType) {
      throw new Error(`${operationName} requires matching GPUVector scalar compute types`);
    }
  }
}

function validatePackedNumericInput(
  operationName: string,
  vector: GPUVector,
  options: {allowFloat64: boolean}
): void {
  if (vector.bufferLayout) {
    throw new Error(`${operationName} does not accept interleaved input vector "${vector.name}"`);
  }

  getConcreteBuffer(vector);
  const scalarType = getScalarDataType(vector.type);
  if (!arrow.DataType.isFloat(scalarType) && !arrow.DataType.isInt(scalarType)) {
    throw new Error(`${operationName} requires numeric GPUVector input`);
  }

  if (arrow.DataType.isInt(scalarType) && scalarType.bitWidth === 64) {
    throw new Error(`${operationName} does not support 64-bit integer GPUVector input`);
  }
  if (arrow.DataType.isFloat(scalarType)) {
    if (scalarType.precision === arrow.Precision.HALF) {
      throw new Error(`${operationName} does not support float16 GPUVector input`);
    }
    if (scalarType.precision === arrow.Precision.DOUBLE && !options.allowFloat64) {
      throw new Error(`${operationName} does not support float64 input; use gpuVectorFround first`);
    }
  }

  const expectedRowByteLength = getScalarByteLength(scalarType) * vector.stride;
  if (vector.rowByteLength !== expectedRowByteLength) {
    throw new Error(
      `${operationName} requires rowByteLength ${expectedRowByteLength} for vector "${vector.name}"`
    );
  }
  if (vector.byteStride !== vector.rowByteLength) {
    throw new Error(`${operationName} requires packed input vector "${vector.name}"`);
  }
}

function validateFloat64Input(operationName: string, vector: GPUVector): void {
  const scalarType = getScalarDataType(vector.type);
  if (!arrow.DataType.isFloat(scalarType) || scalarType.precision !== arrow.Precision.DOUBLE) {
    throw new Error(`${operationName} requires float64 GPUVector input`);
  }
}

function validateInterleavableInput(vector: GPUVector): void {
  if (vector.stride < 1 || vector.stride > 4) {
    throw new Error(
      `gpuVectorInterleave cannot synthesize an attribute layout for vector "${vector.name}" with stride ${vector.stride}`
    );
  }
}

function createInterleavedAttributes(inputs: GPUVector[]): BufferAttributeLayout[] {
  const attributes: BufferAttributeLayout[] = [];
  let byteOffset = 0;

  for (const input of inputs) {
    attributes.push({
      attribute: input.name,
      format: getGPUVectorVertexFormat(input),
      byteOffset
    });
    byteOffset += input.rowByteLength;
  }
  return attributes;
}

function getGPUVectorVertexFormat(vector: GPUVector): VertexFormat {
  const scalarType = getScalarDataType(vector.type);
  const componentType = getSignedDataType(scalarType);
  const components = vector.stride;

  if (
    (componentType === 'uint8' ||
      componentType === 'sint8' ||
      componentType === 'uint16' ||
      componentType === 'sint16') &&
    components === 3
  ) {
    return `${componentType}x3-webgl` as VertexFormat;
  }
  return `${componentType}${components === 1 ? '' : `x${components}`}` as VertexFormat;
}

function getScalarDataType(type: arrow.DataType): arrow.DataType {
  return arrow.DataType.isFixedSizeList(type) ? type.children[0].type : type;
}

function getSignedDataType(type: arrow.DataType): SignedDataType {
  if (arrow.DataType.isInt(type)) {
    switch (type.bitWidth) {
      case 8:
        return type.isSigned ? 'sint8' : 'uint8';
      case 16:
        return type.isSigned ? 'sint16' : 'uint16';
      case 32:
        return type.isSigned ? 'sint32' : 'uint32';
      default:
        throw new Error('GPUVector compute does not support 64-bit integer input');
    }
  }

  if (arrow.DataType.isFloat(type)) {
    switch (type.precision) {
      case arrow.Precision.SINGLE:
        return 'float32';
      case arrow.Precision.DOUBLE:
        return 'float32';
      default:
        throw new Error('GPUVector compute does not support float16 input');
    }
  }

  throw new Error(`GPUVector compute does not support logical type ${type}`);
}

function getScalarByteLength(type: arrow.DataType): number {
  if (arrow.DataType.isInt(type)) {
    return type.bitWidth / 8;
  }
  if (arrow.DataType.isFloat(type)) {
    switch (type.precision) {
      case arrow.Precision.HALF:
        return 2;
      case arrow.Precision.SINGLE:
        return 4;
      case arrow.Precision.DOUBLE:
        return 8;
    }
  }
  throw new Error(`GPUVector compute does not support logical type ${type}`);
}
