// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  Buffer,
  type BufferAttributeLayout,
  type Device,
  type SignedDataType,
  type VertexFormat
} from '@luma.gl/core';
import {ArrowGPUVector} from '@luma.gl/arrow';
import * as arrow from 'apache-arrow';
import {GPUTable} from '../operation/gpu-table';
import {runBufferTransform} from '../operations/webgl/common';
import {froundVertexShader} from '../operations/webgl/fround';
import {runComputation} from '../operations/webgpu/common';
import {froundShaderSource} from '../operations/webgpu/fround';

type ArrowGPUOperation = 'input' | 'add' | 'interleave' | 'fround';
type ArrowGPUAttributeType = arrow.Int | arrow.Float | arrow.FixedSizeList<arrow.Int | arrow.Float>;

/** Arrow GPU vector or lazy graph node accepted as an operation input. */
export type ArrowGPUInput<T extends arrow.DataType = arrow.DataType> =
  | ArrowGPUVector<T>
  | ArrowGPUNode<T>;

type ArrowGPUScalarType<T extends arrow.DataType> =
  T extends arrow.FixedSizeList<infer ChildType extends arrow.DataType> ? ChildType : T;

type ArrowGPUAddScalarOutput<
  XType extends arrow.DataType,
  YType extends arrow.DataType
> = XType extends arrow.Float
  ? arrow.Float32
  : YType extends arrow.Float
    ? arrow.Float32
    : XType extends arrow.Int
      ? arrow.Int
      : YType extends arrow.Int
        ? arrow.Int
        : arrow.DataType;

/** Arrow type produced by an add operation. */
export type ArrowGPUAddOutput<XType extends arrow.DataType, YType extends arrow.DataType> =
  XType extends arrow.FixedSizeList<arrow.DataType>
    ? arrow.FixedSizeList<
        ArrowGPUAddScalarOutput<ArrowGPUScalarType<XType>, ArrowGPUScalarType<YType>>
      >
    : YType extends arrow.FixedSizeList<arrow.DataType>
      ? arrow.FixedSizeList<
          ArrowGPUAddScalarOutput<ArrowGPUScalarType<XType>, ArrowGPUScalarType<YType>>
        >
      : ArrowGPUAddScalarOutput<XType, YType>;

/** Arrow type produced by fround. The Arrow type system does not encode FixedSizeList length. */
export type ArrowGPUFroundOutput<TType extends arrow.DataType> = TType extends arrow.DataType
  ? arrow.FixedSizeList<arrow.Float32>
  : never;

/** Options shared by Arrow GPU graph operations. */
export type ArrowGPUOperationProps = {
  /** Name assigned to the generated output vector. */
  name?: string;
};

/** Options for Arrow GPU interleave operations. */
export type ArrowGPUInterleaveProps = ArrowGPUOperationProps & {
  /** Attribute names for the interleaved views. Defaults to input vector names. */
  attributes?: string[];
};

/** Lazy Arrow GPU compute graph node. */
export class ArrowGPUNode<T extends arrow.DataType = arrow.DataType> {
  readonly operation: ArrowGPUOperation;
  readonly inputs: ArrowGPUInput<any>[];
  readonly props: ArrowGPUOperationProps | ArrowGPUInterleaveProps;
  readonly vector?: ArrowGPUVector<T>;

  _result?: ArrowGPUVector<T>;

  constructor(
    operation: ArrowGPUOperation,
    inputs: ArrowGPUInput<any>[],
    props: ArrowGPUOperationProps | ArrowGPUInterleaveProps = {},
    vector?: ArrowGPUVector<T>
  ) {
    this.operation = operation;
    this.inputs = inputs;
    this.props = props;
    this.vector = vector;
  }
}

/**
 * Lazy compute graph for operations over {@link ArrowGPUVector}s.
 *
 * The graph does not own input vectors. Evaluated result vectors own their generated GPU buffers.
 */
export class ArrowGPUComputeGraph {
  readonly device: Device;
  private _inputTables = new WeakMap<ArrowGPUVector, GPUTable>();

  constructor(device: Device) {
    this.device = device;
  }

  /** Adds two Arrow GPU vectors and returns a lazy graph node. */
  add<XType extends arrow.DataType, YType extends arrow.DataType>(
    x: ArrowGPUInput<XType>,
    y: ArrowGPUInput<YType>,
    props: ArrowGPUOperationProps = {}
  ): ArrowGPUNode<ArrowGPUAddOutput<XType, YType>> {
    return new ArrowGPUNode('add', [x, y], props);
  }

  /** Splits float64 values into high and low float32 components. */
  fround<TType extends arrow.DataType>(
    x: ArrowGPUInput<TType>,
    props: ArrowGPUOperationProps = {}
  ): ArrowGPUNode<ArrowGPUFroundOutput<TType>> {
    return new ArrowGPUNode('fround', [x], props);
  }

  /** Interleaves Arrow GPU vectors and returns a lazy graph node. */
  interleave(
    inputs: ArrowGPUInput[],
    props: ArrowGPUInterleaveProps = {}
  ): ArrowGPUNode<arrow.Binary> {
    return new ArrowGPUNode('interleave', inputs, props);
  }

  /** Evaluates a graph node and returns a GPU-resident Arrow vector. */
  evaluate<TType extends arrow.DataType>(node: ArrowGPUInput<TType>): ArrowGPUVector<TType> {
    if (node instanceof ArrowGPUVector) {
      return node;
    }
    if (node.operation === 'input') {
      return node.vector!;
    }
    if (node._result) {
      return node._result;
    }

    const inputs = node.inputs.map(input => this.evaluate(input)) as ArrowGPUVector<any>[];
    switch (node.operation) {
      case 'add':
        node._result = this.evaluateAdd(
          inputs[0],
          inputs[1],
          node.props
        ) as unknown as ArrowGPUVector<TType>;
        break;
      case 'fround':
        node._result = this.evaluateFround(
          inputs[0],
          node.props
        ) as unknown as ArrowGPUVector<TType>;
        break;
      case 'interleave':
        node._result = this.evaluateInterleave(
          inputs,
          node.props as ArrowGPUInterleaveProps
        ) as unknown as ArrowGPUVector<TType>;
        break;
    }
    return node._result;
  }

  private evaluateAdd(
    x: ArrowGPUVector<any>,
    y: ArrowGPUVector<any>,
    props: ArrowGPUOperationProps
  ): ArrowGPUVector {
    validateNumericVector(x, 'x');
    validateNumericVector(y, 'y');
    validateMatchingLength(x, y);

    const xTable = this.getInputTable(x);
    const yTable = this.getInputTable(y);
    const outputType = joinSignedDataTypes([xTable.type, yTable.type]);
    const outputSize = Math.max(xTable.size, yTable.size);
    const outputLength = xTable.length;
    const outputTable = createTableDescriptor(outputType, outputSize, outputLength);
    const outputBuffer = createOutputBuffer(this.device, outputTable.byteLength);

    runArrowOperation(this.device, 'add', {x: xTable, y: yTable}, outputTable, outputBuffer);

    return new ArrowGPUVector<any>({
      type: 'buffer',
      name: props.name || `${x.name}_${y.name}_add`,
      buffer: outputBuffer,
      arrowType: getArrowType(outputType, outputSize),
      length: outputLength,
      byteStride: outputTable.stride,
      ownsBuffer: true
    } as any);
  }

  private evaluateFround(
    x: ArrowGPUVector<any>,
    props: ArrowGPUOperationProps
  ): ArrowGPUVector<arrow.FixedSizeList<arrow.Float32>> {
    const size = getFloat64VectorSize(x);
    if (x.byteOffset !== 0) {
      throw new Error('ArrowGPUComputeGraph.fround does not support non-zero byteOffset');
    }

    const inputTable = createTableDescriptor(
      'uint32',
      size * 2,
      x.length,
      x.byteOffset,
      x.byteStride
    );
    (inputTable as any)._buffer = x.buffer;
    const outputTable = createTableDescriptor('float32', inputTable.size, inputTable.length);
    const outputBuffer = createOutputBuffer(this.device, outputTable.byteLength);

    runArrowOperation(this.device, 'fround', {x: inputTable}, outputTable, outputBuffer);

    return new ArrowGPUVector<arrow.FixedSizeList<arrow.Float32>>({
      type: 'buffer',
      name: props.name || `${x.name}_fround`,
      buffer: outputBuffer,
      arrowType: getArrowType('float32', outputTable.size) as arrow.FixedSizeList<arrow.Float32>,
      length: outputTable.length,
      byteStride: outputTable.stride,
      ownsBuffer: true
    } as any);
  }

  private evaluateInterleave(
    inputs: ArrowGPUVector<any>[],
    props: ArrowGPUInterleaveProps
  ): ArrowGPUVector {
    if (inputs.length === 0) {
      throw new Error('ArrowGPUComputeGraph.interleave requires at least one input');
    }
    for (const [index, input] of inputs.entries()) {
      validateNumericVector(input, `input ${index}`);
      validateMatchingLength(inputs[0], input);
    }

    const inputTables = inputs.map(input => this.getInputTable(input));
    const outputType = inputTables[0].type;
    for (const table of inputTables) {
      if (table.type !== outputType) {
        throw new Error('ArrowGPUComputeGraph.interleave requires all inputs to use the same type');
      }
    }

    let outputTable = inputTables[0];
    for (let index = 1; index < inputTables.length; index++) {
      outputTable = createInterleaveDescriptor(outputTable, inputTables[index]);
    }
    const outputBuffer = createOutputBuffer(this.device, outputTable.byteLength);
    runInterleaveChain(this.device, inputTables, outputTable, outputBuffer);

    return new ArrowGPUVector({
      type: 'interleaved',
      name: props.name || inputs.map(input => input.name).join('_'),
      buffer: outputBuffer,
      length: outputTable.length,
      byteStride: outputTable.stride,
      attributes: getInterleavedAttributes(inputs, props.attributes),
      ownsBuffer: true
    });
  }

  private getInputTable(vector: ArrowGPUVector<any>): GPUTable {
    let table = this._inputTables.get(vector);
    if (!table) {
      const {type, size} = getVectorTableProps(vector);
      table = createTableDescriptor(
        type,
        size,
        vector.length,
        vector.byteOffset,
        vector.byteStride
      );
      (table as any)._buffer = vector.buffer;
      this._inputTables.set(vector, table);
    }
    return table;
  }
}

function runInterleaveChain(
  device: Device,
  inputs: GPUTable[],
  output: GPUTable,
  outputBuffer: Buffer
): void {
  if (inputs.length === 1) {
    throw new Error('ArrowGPUComputeGraph.interleave requires at least two inputs');
  }

  if (inputs.length === 2) {
    runArrowOperation(device, 'interleave', {x: inputs[0], y: inputs[1]}, output, outputBuffer);
    return;
  }

  let intermediate = inputs[0];
  let intermediateBuffer: Buffer | null = null;
  for (let index = 1; index < inputs.length; index++) {
    const nextOutput = createInterleaveDescriptor(intermediate, inputs[index]);
    const isLast = index === inputs.length - 1;
    const target = isLast ? outputBuffer : createOutputBuffer(device, nextOutput.byteLength);
    runArrowOperation(
      device,
      'interleave',
      {x: intermediate, y: inputs[index]},
      nextOutput,
      target
    );
    if (intermediateBuffer) {
      intermediateBuffer.destroy();
    }
    intermediate = nextOutput;
    (intermediate as any)._buffer = target;
    intermediateBuffer = isLast ? null : target;
  }
}

function runArrowOperation(
  device: Device,
  operation: 'add' | 'interleave' | 'fround',
  inputs: {x: GPUTable; y?: GPUTable},
  output: GPUTable,
  outputBuffer: Buffer
): void {
  switch (device.type) {
    case 'webgl':
      if (operation === 'fround') {
        runBufferTransform({
          module: {name: 'fround', vs: froundVertexShader},
          inputs: inputs as {x: GPUTable},
          output,
          operationType: 'uint32',
          outputBuffer
        });
        return;
      }
      runBufferTransform({
        elementWise: operation === 'add',
        module:
          operation === 'add'
            ? {name: 'add', vs: 'TYPE add(TYPE x, TYPE y) { return x + y; }'}
            : {
                name: 'interleave',
                vs: `void interleave(in TYPE x[X_LEN], in TYPE y[Y_LEN], out TYPE result[RESULT_LEN]) {
  for (int i = 0; i < X_LEN; i++) {
    result[i] = x[i];
  }
  for (int i = 0; i < Y_LEN; i++) {
    result[i + X_LEN] = y[i];
  }
}`
              },
        inputs,
        output,
        outputBuffer
      });
      return;

    case 'webgpu':
      if (operation === 'fround') {
        runComputation({
          module: {name: 'fround', source: froundShaderSource},
          inputs: inputs as {x: GPUTable},
          output,
          operationType: 'uint32',
          outputBuffer
        });
        return;
      }
      runComputation({
        elementWise: operation === 'add',
        module:
          operation === 'add'
            ? {
                name: 'add',
                source: 'fn add(x: {TYPE}, y: {TYPE}) -> {TYPE} { return x + y; }'
              }
            : {
                name: 'interleave',
                source: `fn interleave(x: array<{TYPE}, {X_LEN}>, y: array<{TYPE}, {Y_LEN}>) -> array<{TYPE}, {RESULT_LEN}> {
  var out: array<{TYPE}, {RESULT_LEN}>;
  var i: u32;
  for (i = 0u; i < {X_LEN}u; i = i + 1u) {
    out[i] = x[i];
  }
  for (i = 0u; i < {Y_LEN}u; i = i + 1u) {
    out[i + {X_LEN}u] = y[i];
  }
  return out;
}`
              },
        inputs,
        output,
        outputBuffer
      });
      return;

    default:
      throw new Error(`Arrow GPU operations are not supported on ${device.type} devices`);
  }
}

function createTableDescriptor(
  type: SignedDataType,
  size: number,
  length: number,
  offset: number = 0,
  stride?: number
): GPUTable {
  const table = new GPUTable({type, size, length, offset, stride, value: new Float32Array(0)});
  (table as any)._value = undefined;
  return table;
}

function createInterleaveDescriptor(x: GPUTable, y: GPUTable): GPUTable {
  return createTableDescriptor(x.type, x.size + y.size, Math.max(x.length, y.length));
}

function createOutputBuffer(device: Device, byteLength: number): Buffer {
  return device.createBuffer({
    usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_DST | Buffer.COPY_SRC,
    byteLength
  });
}

function getVectorTableProps(vector: ArrowGPUVector<any>): {type: SignedDataType; size: number} {
  const arrowType = vector.type;
  if (arrow.DataType.isBinary(arrowType)) {
    throw new Error(`ArrowGPUVector "${vector.name}" is interleaved binary storage`);
  }
  return getArrowTypeTableProps(arrowType);
}

function getFloat64VectorSize(vector: ArrowGPUVector<any>): number {
  const type = vector.type;
  if (arrow.DataType.isFixedSizeList(type)) {
    const childType = type.children[0].type;
    if (arrow.DataType.isFloat(childType) && childType.precision === arrow.Precision.DOUBLE) {
      return type.listSize;
    }
  }
  if (arrow.DataType.isFloat(type) && type.precision === arrow.Precision.DOUBLE) {
    return 1;
  }
  throw new Error('ArrowGPUComputeGraph.fround requires a Float64 Arrow vector');
}

function getArrowTypeTableProps(type: arrow.DataType): {type: SignedDataType; size: number} {
  if (arrow.DataType.isFixedSizeList(type)) {
    const childProps = getArrowTypeTableProps(type.children[0].type);
    return {type: childProps.type, size: childProps.size * type.listSize};
  }
  if (arrow.DataType.isInt(type)) {
    if (type.bitWidth === 64) {
      throw new Error('64-bit integer Arrow vectors are not supported by ArrowGPUComputeGraph');
    }
    return {type: `${type.isSigned ? 'sint' : 'uint'}${type.bitWidth}` as SignedDataType, size: 1};
  }
  if (arrow.DataType.isFloat(type)) {
    switch (type.precision) {
      case arrow.Precision.HALF:
        return {type: 'float16', size: 1};
      case arrow.Precision.SINGLE:
        return {type: 'float32', size: 1};
      default:
        throw new Error('float64 Arrow vectors are not supported by ArrowGPUComputeGraph');
    }
  }
  throw new Error(`Arrow type ${type} is not supported by ArrowGPUComputeGraph`);
}

function getArrowType(type: SignedDataType, size: number): ArrowGPUAttributeType {
  const scalarType = getArrowScalarType(type);
  return size === 1
    ? scalarType
    : new arrow.FixedSizeList(size, new arrow.Field('value', scalarType));
}

function getArrowScalarType(type: SignedDataType): arrow.Int | arrow.Float {
  switch (type) {
    case 'float16':
      return new arrow.Float16();
    case 'float32':
      return new arrow.Float32();
    case 'uint8':
      return new arrow.Uint8();
    case 'sint8':
      return new arrow.Int8();
    case 'uint16':
      return new arrow.Uint16();
    case 'sint16':
      return new arrow.Int16();
    case 'uint32':
      return new arrow.Uint32();
    case 'sint32':
      return new arrow.Int32();
    default:
      throw new Error(`Unsupported Arrow GPU output type ${type}`);
  }
}

function validateNumericVector(vector: ArrowGPUVector<any>, name: string): void {
  getVectorTableProps(vector);
  if (vector.byteOffset !== 0) {
    throw new Error(`ArrowGPUComputeGraph does not support non-zero byteOffset for ${name}`);
  }
}

function validateMatchingLength(x: ArrowGPUVector<any>, y: ArrowGPUVector<any>): void {
  if (x.length !== y.length) {
    throw new Error(`ArrowGPUVector length mismatch: ${x.length} vs ${y.length}`);
  }
}

function getInterleavedAttributes(
  inputs: ArrowGPUVector<any>[],
  names: string[] | undefined
): BufferAttributeLayout[] {
  let byteOffset = 0;
  return inputs.map((input, index) => {
    const attribute = names?.[index] || input.name || `attribute${index}`;
    const format = getVectorVertexFormat(input);
    const layout = {attribute, format, byteOffset};
    byteOffset += input.byteStride;
    return layout;
  });
}

function getVectorVertexFormat(vector: ArrowGPUVector<any>): VertexFormat {
  const {type, size} = getVectorTableProps(vector);
  const suffix = size === 1 ? '' : `x${size}`;
  if (
    (type === 'uint8' || type === 'sint8' || type === 'uint16' || type === 'sint16') &&
    size === 3
  ) {
    return `${type}x3-webgl` as VertexFormat;
  }
  if (type === 'float16' && size === 3) {
    throw new Error('float16x3 interleaved attributes are not supported');
  }
  return `${type}${suffix}` as VertexFormat;
}

function joinSignedDataTypes(types: SignedDataType[]): SignedDataType {
  let unsignedBits = 0;
  let signedBits = 0;
  for (const type of types) {
    if (type[0] === 'f') {
      return 'float32';
    }
    const bits = type.endsWith('8') ? 8 : type.endsWith('6') ? 16 : 32;
    if (type[0] === 'u') {
      unsignedBits = Math.max(unsignedBits, bits);
    } else {
      signedBits = Math.max(signedBits, bits);
    }
  }
  if (unsignedBits && !signedBits) {
    return `uint${unsignedBits}` as SignedDataType;
  }
  if (signedBits && unsignedBits < 32) {
    return `sint${Math.max(signedBits, unsignedBits * 2)}` as SignedDataType;
  }
  return 'float32';
}
