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
import {
  ArrowGPUVector,
  getArrowVectorByPath,
  type ArrowGPUSegmentedBufferSegment,
  type ArrowGPUVectorBufferProps
} from '@luma.gl/arrow';
import * as arrow from 'apache-arrow';
import {GPUTable} from '../operation/gpu-table';
import {runBufferTransform} from '../operations/webgl/common';
import {froundVertexShader} from '../operations/webgl/fround';
import {runComputation} from '../operations/webgpu/common';
import {froundShaderSource} from '../operations/webgpu/fround';

type ArrowGPUAttributeType = arrow.Int | arrow.Float | arrow.FixedSizeList<arrow.Int | arrow.Float>;
type ArrowGPUDeinterleaveOutput = ArrowGPUAttributeType;
type ArrowGPUDesegmentOutput = ArrowGPUAttributeType;
const SEGMENTED_BUFFER_ALIGNMENT = 256;

/** Arrow GPU vector or lazy graph node accepted as an operation input. */
export type ArrowGPUInput<T extends arrow.DataType = arrow.DataType> =
  | ArrowGPUVector<T>
  | ArrowGPUOperationNode<T>;

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

/** Arrow type produced by WGS84 to pseudo-Mercator projection. */
export type ArrowGPUProjectWGS84ToPseudoMercatorOutput<TType extends arrow.DataType> =
  TType extends arrow.DataType ? arrow.FixedSizeList<arrow.Float32> : never;

/** Future output placement hint for operations that may be able to reuse input buffers. */
export type ArrowGPUOutputPlacement = {
  /** Input whose GPU buffer may be reused when supported by the backend. */
  reuse?: ArrowGPUInput;
  /** Whether buffer reuse is optional or required. */
  policy?: 'prefer' | 'require';
};

/** Options shared by Arrow GPU graph operations. */
export type ArrowGPUOperationProps = {
  /** Name assigned to the generated output vector. */
  name?: string;
  /** Reserved output placement hint. Reuse is not implemented by the v1 graph. */
  output?: ArrowGPUOutputPlacement;
};

/** Options for Arrow CPU-to-GPU upload operations. */
export type ArrowGPUUploadProps = ArrowGPUOperationProps & {
  /** Buffer creation props forwarded when uploading Arrow vector memory to the GPU. */
  bufferProps?: ArrowGPUVectorBufferProps;
};

/** Options for Arrow GPU interleave operations. */
export type ArrowGPUInterleaveProps = ArrowGPUOperationProps & {
  /** Attribute names for the interleaved views. Defaults to input vector names. */
  attributes?: string[];
};

/** Options for Arrow GPU segment operations. */
export type ArrowGPUSegmentProps = ArrowGPUOperationProps & {
  /** Segment names for the segmented views. Defaults to input vector names. */
  segments?: string[];
};

/** Options for Arrow GPU deinterleave operations. */
export type ArrowGPUDeinterleaveProps = ArrowGPUOperationProps;

/** Options for Arrow GPU desegment operations. */
export type ArrowGPUDesegmentProps = ArrowGPUOperationProps;

/** Constructor props for Arrow GPU operation tree nodes. */
export type ArrowGPUOperationNodeProps<
  ParametersT,
  PropsT extends ArrowGPUOperationProps = ArrowGPUOperationProps
> = {
  /** Operation inputs. */
  parameters: ParametersT;
  /** Operation options. */
  props?: PropsT;
};

/** Lazy Arrow GPU operation tree node. */
export abstract class ArrowGPUOperationNode<
  T extends arrow.DataType = arrow.DataType,
  ParametersT = unknown,
  PropsT extends ArrowGPUOperationProps = ArrowGPUOperationProps
> {
  /** Unique operation identifier used for diagnostics. */
  abstract readonly name: string;
  /** Operation inputs. */
  readonly parameters: ParametersT;
  /** Operation options. */
  readonly props: PropsT;

  _result?: ArrowGPUVector<T>;

  constructor({parameters, props}: ArrowGPUOperationNodeProps<ParametersT, PropsT>) {
    this.parameters = parameters;
    this.props = props || ({} as PropsT);
  }
}

/** Inputs for {@link ArrowUploadOperation}. */
export type ArrowUploadParameters<TType extends arrow.DataType> =
  | {
      /** Arrow vector to upload during graph evaluation. */
      vector: arrow.Vector<TType>;
      /** Optional default output name when props.name is omitted. */
      name?: string;
    }
  | {
      /** Arrow table containing the column to upload during graph evaluation. */
      table: arrow.Table;
      /** Dot-separated Arrow table column path to upload. */
      path: string;
    };

/** Lazy Arrow CPU-to-GPU upload operation. */
export class ArrowUploadOperation<TType extends arrow.DataType> extends ArrowGPUOperationNode<
  TType,
  ArrowUploadParameters<TType>,
  ArrowGPUUploadProps
> {
  readonly name = 'upload';
}

/** Inputs for {@link ArrowAddOperation}. */
export type ArrowAddParameters<XType extends arrow.DataType, YType extends arrow.DataType> = {
  /** Left operand. */
  x: ArrowGPUInput<XType>;
  /** Right operand. */
  y: ArrowGPUInput<YType>;
};

/** Lazy Arrow GPU pairwise addition operation. */
export class ArrowAddOperation<
  XType extends arrow.DataType,
  YType extends arrow.DataType
> extends ArrowGPUOperationNode<ArrowGPUAddOutput<XType, YType>, ArrowAddParameters<XType, YType>> {
  readonly name = 'add';
}

/** Inputs for {@link ArrowFroundOperation}. */
export type ArrowFroundParameters<TType extends arrow.DataType> = {
  /** Float64 input vector. */
  x: ArrowGPUInput<TType>;
};

/** Lazy Arrow GPU float64 split operation. */
export class ArrowFroundOperation<TType extends arrow.DataType> extends ArrowGPUOperationNode<
  ArrowGPUFroundOutput<TType>,
  ArrowFroundParameters<TType>
> {
  readonly name = 'fround';
}

/** Inputs for {@link ArrowInterleaveOperation}. */
export type ArrowInterleaveParameters = {
  /** Vectors or operation nodes to interleave. */
  inputs: ArrowGPUInput[];
};

/** Lazy Arrow GPU interleave operation. */
export class ArrowInterleaveOperation extends ArrowGPUOperationNode<
  arrow.Binary,
  ArrowInterleaveParameters,
  ArrowGPUInterleaveProps
> {
  readonly name = 'interleave';
}

/** Inputs for {@link ArrowSegmentOperation}. */
export type ArrowSegmentParameters = {
  /** Vectors or operation nodes to segment into one shared allocation. */
  inputs: ArrowGPUInput[];
};

/** Lazy Arrow GPU segment operation. */
export class ArrowSegmentOperation extends ArrowGPUOperationNode<
  arrow.Binary,
  ArrowSegmentParameters,
  ArrowGPUSegmentProps
> {
  readonly name = 'segment';
}

/** Inputs for {@link ArrowDeinterleaveOperation}. */
export type ArrowDeinterleaveParameters<TType extends arrow.DataType> = {
  /** Interleaved binary input vector. */
  source: ArrowGPUInput<TType>;
  /** Attribute name to extract from `source.bufferLayout.attributes`. */
  attribute: string;
};

/** Lazy Arrow GPU deinterleave operation. */
export class ArrowDeinterleaveOperation<TType extends arrow.DataType> extends ArrowGPUOperationNode<
  ArrowGPUDeinterleaveOutput,
  ArrowDeinterleaveParameters<TType>,
  ArrowGPUDeinterleaveProps
> {
  readonly name = 'deinterleave';
}

/** Inputs for {@link ArrowDesegmentOperation}. */
export type ArrowDesegmentParameters<TType extends arrow.DataType> = {
  /** Segmented binary input vector. */
  source: ArrowGPUInput<TType>;
  /** Segment name to extract from `source.segmentedBufferLayout.segments`. */
  segment: string;
};

/** Lazy Arrow GPU desegment operation. */
export class ArrowDesegmentOperation<TType extends arrow.DataType> extends ArrowGPUOperationNode<
  ArrowGPUDesegmentOutput,
  ArrowDesegmentParameters<TType>,
  ArrowGPUDesegmentProps
> {
  readonly name = 'desegment';
}

/** Inputs for {@link ArrowProjectWGS84ToPseudoMercatorOperation}. */
export type ArrowProjectWGS84ToPseudoMercatorParameters<TType extends arrow.DataType> = {
  /** Double-single WGS84 longitude/latitude input from {@link arrowFround}. */
  x: ArrowGPUInput<TType>;
};

/**
 * Lazy Arrow GPU WGS84 longitude/latitude to EPSG:3857 pseudo-Mercator projection.
 *
 * Input and output rows use double-single `Float32[4]` layout:
 * `[xHigh, yHigh, xLow, yLow]`.
 */
export class ArrowProjectWGS84ToPseudoMercatorOperation<
  TType extends arrow.DataType
> extends ArrowGPUOperationNode<
  ArrowGPUProjectWGS84ToPseudoMercatorOutput<TType>,
  ArrowProjectWGS84ToPseudoMercatorParameters<TType>
> {
  readonly name = 'projectWGS84ToPseudoMercator';
}

/** Builds a lazy Arrow CPU-to-GPU upload operation. */
export function arrowUpload<TType extends arrow.DataType>(
  vector: arrow.Vector<TType>,
  props?: ArrowGPUUploadProps
): ArrowUploadOperation<TType>;
export function arrowUpload<TType extends arrow.DataType>(
  table: arrow.Table,
  path: string,
  props?: ArrowGPUUploadProps
): ArrowUploadOperation<TType>;
export function arrowUpload<TType extends arrow.DataType>(
  source: arrow.Vector<TType> | arrow.Table,
  pathOrProps?: string | ArrowGPUUploadProps,
  props?: ArrowGPUUploadProps
): ArrowUploadOperation<TType> {
  if (typeof pathOrProps === 'string') {
    return new ArrowUploadOperation({
      parameters: {table: source as arrow.Table, path: pathOrProps},
      props
    });
  }
  return new ArrowUploadOperation({
    parameters: {vector: source as arrow.Vector<TType>, name: pathOrProps?.name},
    props: pathOrProps
  });
}

/** Builds a lazy Arrow GPU pairwise addition operation. */
export function arrowAdd<XType extends arrow.DataType, YType extends arrow.DataType>(
  x: ArrowGPUInput<XType>,
  y: ArrowGPUInput<YType>,
  props?: ArrowGPUOperationProps
): ArrowAddOperation<XType, YType> {
  return new ArrowAddOperation({parameters: {x, y}, props});
}

/** Builds a lazy Arrow GPU float64 split operation. */
export function arrowFround<TType extends arrow.DataType>(
  x: ArrowGPUInput<TType>,
  props?: ArrowGPUOperationProps
): ArrowFroundOperation<TType> {
  return new ArrowFroundOperation({parameters: {x}, props});
}

/** Builds a lazy Arrow GPU interleave operation. */
export function arrowInterleave(
  inputs: ArrowGPUInput[],
  props?: ArrowGPUInterleaveProps
): ArrowInterleaveOperation {
  return new ArrowInterleaveOperation({parameters: {inputs}, props});
}

/** Builds a lazy Arrow GPU segment operation. */
export function arrowSegment(
  inputs: ArrowGPUInput[],
  props?: ArrowGPUSegmentProps
): ArrowSegmentOperation {
  return new ArrowSegmentOperation({parameters: {inputs}, props});
}

/** Builds a lazy Arrow GPU deinterleave operation. */
export function arrowDeinterleave<TType extends arrow.DataType>(
  source: ArrowGPUInput<TType>,
  attribute: string,
  props?: ArrowGPUDeinterleaveProps
): ArrowDeinterleaveOperation<TType> {
  return new ArrowDeinterleaveOperation({parameters: {source, attribute}, props});
}

/** Builds a lazy Arrow GPU desegment operation. */
export function arrowDesegment<TType extends arrow.DataType>(
  source: ArrowGPUInput<TType>,
  segment: string,
  props?: ArrowGPUDesegmentProps
): ArrowDesegmentOperation<TType> {
  return new ArrowDesegmentOperation({parameters: {source, segment}, props});
}

/** Builds a lazy Arrow GPU WGS84 longitude/latitude to EPSG:3857 projection operation. */
export function arrowProjectWGS84ToPseudoMercator<TType extends arrow.DataType>(
  x: ArrowGPUInput<TType>,
  props?: ArrowGPUOperationProps
): ArrowProjectWGS84ToPseudoMercatorOperation<TType> {
  return new ArrowProjectWGS84ToPseudoMercatorOperation({parameters: {x}, props});
}

/**
 * Evaluates an Arrow GPU operation tree.
 *
 * If no device is supplied, the device is inferred from the input {@link ArrowGPUVector}s.
 */
export function evaluateGPUComputeGraph<TType extends arrow.DataType>(
  input: ArrowGPUInput<TType>,
  device?: Device
): ArrowGPUVector<TType> {
  if (input instanceof ArrowGPUVector) {
    return input;
  }

  const resolvedDevice = device || getOperationTreeDevice(input);
  validateOperationTreeDevice(input, resolvedDevice);
  return new ArrowGPUComputeGraph(resolvedDevice).evaluate(input);
}

/**
 * Lazy compute graph for operations over {@link ArrowGPUVector}s.
 *
 * The graph does not own input vectors. Evaluated result vectors own their generated GPU buffers.
 */
class ArrowGPUComputeGraph {
  readonly device: Device;
  private _inputTables = new WeakMap<ArrowGPUVector, GPUTable>();

  constructor(device: Device) {
    this.device = device;
  }

  /** Evaluates a graph node and returns a GPU-resident Arrow vector. */
  evaluate<TType extends arrow.DataType>(node: ArrowGPUInput<TType>): ArrowGPUVector<TType> {
    if (node instanceof ArrowGPUVector) {
      return node;
    }
    if (node._result) {
      return node._result;
    }

    validateOutputPlacement(node.props);
    node._result = this.evaluateOperationNode(node) as unknown as ArrowGPUVector<TType>;
    return node._result;
  }

  private evaluateOperationNode<TType extends arrow.DataType>(
    node: ArrowGPUOperationNode<TType>
  ): ArrowGPUVector<TType> {
    if (node instanceof ArrowUploadOperation) {
      return this.evaluateUpload(node.parameters, node.props) as unknown as ArrowGPUVector<TType>;
    }
    if (node instanceof ArrowAddOperation) {
      const x = this.evaluate(node.parameters.x);
      const y = this.evaluate(node.parameters.y);
      return this.evaluateAdd(x, y, node.props) as unknown as ArrowGPUVector<TType>;
    }
    if (node instanceof ArrowFroundOperation) {
      const x = this.evaluate(node.parameters.x);
      return this.evaluateFround(x, node.props) as unknown as ArrowGPUVector<TType>;
    }
    if (node instanceof ArrowInterleaveOperation) {
      const inputs = node.parameters.inputs.map(input => this.evaluate(input));
      return this.evaluateInterleave(inputs, node.props) as unknown as ArrowGPUVector<TType>;
    }
    if (node instanceof ArrowSegmentOperation) {
      const inputs = node.parameters.inputs.map(input => this.evaluate(input));
      return this.evaluateSegment(inputs, node.props) as unknown as ArrowGPUVector<TType>;
    }
    if (node instanceof ArrowDeinterleaveOperation) {
      const source = this.evaluate(node.parameters.source);
      return this.evaluateDeinterleave(
        source,
        node.parameters.attribute,
        node.props
      ) as unknown as ArrowGPUVector<TType>;
    }
    if (node instanceof ArrowDesegmentOperation) {
      const source = this.evaluate(node.parameters.source);
      return this.evaluateDesegment(
        source,
        node.parameters.segment,
        node.props
      ) as unknown as ArrowGPUVector<TType>;
    }
    if (node instanceof ArrowProjectWGS84ToPseudoMercatorOperation) {
      const x = this.evaluate(node.parameters.x);
      return this.evaluateProjectWGS84ToPseudoMercator(
        x,
        node.props
      ) as unknown as ArrowGPUVector<TType>;
    }
    throw new Error(`Unsupported Arrow GPU operation node ${node.name}`);
  }

  /** @internal */
  evaluateUpload<TType extends arrow.DataType>(
    parameters: ArrowUploadParameters<TType>,
    props: ArrowGPUUploadProps
  ): ArrowGPUVector<TType> {
    const vector =
      'table' in parameters
        ? getArrowVectorByPath(parameters.table, parameters.path)
        : parameters.vector;
    const name =
      props.name || ('path' in parameters ? parameters.path : parameters.name) || 'vector';

    return new ArrowGPUVector({
      type: 'arrow',
      name,
      device: this.device,
      vector: vector as any,
      bufferProps: props.bufferProps
    } as any);
  }

  /** @internal */
  evaluateAdd(
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

  /** @internal */
  evaluateFround(
    x: ArrowGPUVector<any>,
    props: ArrowGPUOperationProps
  ): ArrowGPUVector<arrow.FixedSizeList<arrow.Float32>> {
    const size = getFloat64VectorSize(x);
    if (x.byteOffset !== 0) {
      throw new Error('Arrow GPU fround does not support non-zero byteOffset');
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

  /** @internal */
  evaluateInterleave(
    inputs: ArrowGPUVector<any>[],
    props: ArrowGPUInterleaveProps
  ): ArrowGPUVector {
    if (inputs.length === 0) {
      throw new Error('Arrow GPU interleave requires at least one input');
    }
    for (const [index, input] of inputs.entries()) {
      validateNumericVector(input, `input ${index}`);
      validateMatchingLength(inputs[0], input);
    }

    const inputTables = inputs.map(input => this.getInputTable(input));
    const outputType = inputTables[0].type;
    for (const table of inputTables) {
      if (table.type !== outputType) {
        throw new Error('Arrow GPU interleave requires all inputs to use the same type');
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

  /** @internal */
  evaluateDeinterleave(
    source: ArrowGPUVector<any>,
    attributeName: string,
    props: ArrowGPUDeinterleaveProps
  ): ArrowGPUVector<ArrowGPUDeinterleaveOutput> {
    const {attribute, formatInfo} = getInterleavedAttributeInfo(source, attributeName);
    const inputTable = createTableDescriptor(
      formatInfo.type,
      formatInfo.components,
      source.length,
      source.byteOffset + attribute.byteOffset,
      source.byteStride
    );
    (inputTable as any)._buffer = source.buffer;
    const outputTable = createTableDescriptor(
      formatInfo.type,
      formatInfo.components,
      source.length
    );
    const outputBuffer = createOutputBuffer(this.device, outputTable.byteLength);

    runArrowOperation(this.device, 'deinterleave', {x: inputTable}, outputTable, outputBuffer);

    return new ArrowGPUVector<any>({
      type: 'buffer',
      name: props.name || attributeName,
      buffer: outputBuffer,
      arrowType: formatInfo.arrowType,
      length: source.length,
      byteStride: outputTable.stride,
      ownsBuffer: true
    } as any);
  }

  /** @internal */
  evaluateSegment(inputs: ArrowGPUVector<any>[], props: ArrowGPUSegmentProps): ArrowGPUVector {
    if (inputs.length === 0) {
      throw new Error('Arrow GPU segment requires at least one input');
    }
    for (const [index, input] of inputs.entries()) {
      validatePackedNumericVector(input, `input ${index}`);
      validateMatchingLength(inputs[0], input);
    }

    const segments = getSegmentedBufferSegments(inputs, props.segments);
    const byteLength = alignTo(
      segments[segments.length - 1].byteOffset + segments[segments.length - 1].byteLength,
      SEGMENTED_BUFFER_ALIGNMENT
    );
    const outputBuffer = createOutputBuffer(this.device, byteLength);

    for (const [index, segment] of segments.entries()) {
      this.device.commandEncoder.copyBufferToBuffer({
        sourceBuffer: inputs[index].buffer,
        sourceOffset: inputs[index].byteOffset,
        destinationBuffer: outputBuffer,
        destinationOffset: segment.byteOffset,
        size: segment.byteLength
      });
    }
    this.device.submit();

    return new ArrowGPUVector({
      type: 'segmented',
      name: props.name || inputs.map(input => input.name).join('_'),
      buffer: outputBuffer,
      length: inputs[0].length,
      segments,
      alignment: SEGMENTED_BUFFER_ALIGNMENT,
      byteLength,
      ownsBuffer: true
    });
  }

  /** @internal */
  evaluateDesegment(
    source: ArrowGPUVector<any>,
    segmentName: string,
    props: ArrowGPUDesegmentProps
  ): ArrowGPUVector<ArrowGPUDesegmentOutput> {
    const segment = getSegmentedBufferSegment(source, segmentName);
    const outputBuffer = createOutputBuffer(this.device, segment.byteLength);

    this.device.commandEncoder.copyBufferToBuffer({
      sourceBuffer: source.buffer,
      sourceOffset: segment.byteOffset,
      destinationBuffer: outputBuffer,
      size: segment.byteLength
    });
    this.device.submit();

    return new ArrowGPUVector<any>({
      type: 'buffer',
      name: props.name || segment.name,
      buffer: outputBuffer,
      arrowType: segment.arrowType,
      length: segment.length,
      byteStride: segment.byteStride,
      ownsBuffer: true
    } as any);
  }

  /** @internal */
  evaluateProjectWGS84ToPseudoMercator(
    x: ArrowGPUVector<any>,
    props: ArrowGPUOperationProps
  ): ArrowGPUVector<arrow.FixedSizeList<arrow.Float32>> {
    validateFloat32FixedSizeList(x, 4, 'x');
    validateNumericVector(x, 'x');

    const inputTable = this.getInputTable(x);
    const outputTable = createTableDescriptor('float32', 4, x.length);
    const outputBuffer = createOutputBuffer(this.device, outputTable.byteLength);

    runArrowOperation(
      this.device,
      'projectWGS84ToPseudoMercator',
      {x: inputTable},
      outputTable,
      outputBuffer
    );

    return new ArrowGPUVector<arrow.FixedSizeList<arrow.Float32>>({
      type: 'buffer',
      name: props.name || `${x.name}_epsg3857`,
      buffer: outputBuffer,
      arrowType: getArrowType('float32', 4) as arrow.FixedSizeList<arrow.Float32>,
      length: outputTable.length,
      byteStride: outputTable.stride,
      ownsBuffer: true
    } as any);
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

function validateOutputPlacement(props: ArrowGPUOperationProps | ArrowGPUInterleaveProps): void {
  if (props.output?.policy === 'require') {
    throw new Error('Arrow GPU output buffer reuse is not implemented');
  }
}

function getOperationTreeDevice(input: ArrowGPUOperationNode): Device {
  const device = findOperationTreeDevice(input);
  if (!device) {
    throw new Error('evaluateGPUComputeGraph could not infer a device from the operation tree');
  }
  return device;
}

function findOperationTreeDevice(value: unknown): Device | null {
  if (value instanceof ArrowGPUVector) {
    return value.buffer.device as Device;
  }
  if (value instanceof ArrowUploadOperation) {
    return null;
  }
  if (value instanceof ArrowGPUOperationNode) {
    return findOperationTreeDevice(value.parameters);
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const device = findOperationTreeDevice(item);
      if (device) {
        return device;
      }
    }
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) {
      const device = findOperationTreeDevice(item);
      if (device) {
        return device;
      }
    }
  }
  return null;
}

function validateOperationTreeDevice(value: unknown, device: Device): void {
  if (value instanceof ArrowGPUVector) {
    if (value.buffer.device !== device) {
      throw new Error('evaluateGPUComputeGraph requires all input vectors to use the same device');
    }
    return;
  }
  if (value instanceof ArrowUploadOperation) {
    return;
  }
  if (value instanceof ArrowGPUOperationNode) {
    validateOperationTreeDevice(value.parameters, device);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      validateOperationTreeDevice(item, device);
    }
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) {
      validateOperationTreeDevice(item, device);
    }
  }
}

function runInterleaveChain(
  device: Device,
  inputs: GPUTable[],
  output: GPUTable,
  outputBuffer: Buffer
): void {
  if (inputs.length === 1) {
    throw new Error('Arrow GPU interleave requires at least two inputs');
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

const projectWGS84ToPseudoMercatorVertexShader = /* glsl */ `\
const float WEB_MERCATOR_RADIUS = 6378137.0;
const float DEGREES_TO_RADIANS = 0.017453292519943295;
const float MAX_WEB_MERCATOR_LATITUDE = 85.05112878;
const float QUARTER_PI = 0.7853981633974483;

float projectMercatorY(float latitudeDegrees) {
  float latitude = clamp(latitudeDegrees, -MAX_WEB_MERCATOR_LATITUDE, MAX_WEB_MERCATOR_LATITUDE);
  float latitudeRadians = latitude * DEGREES_TO_RADIANS;
  return WEB_MERCATOR_RADIUS * log(tan(QUARTER_PI + latitudeRadians * 0.5));
}

void projectWGS84ToPseudoMercator(in TYPE x[X_LEN], out TYPE result[RESULT_LEN]) {
  float longitudeHigh = x[0];
  float latitudeHigh = clamp(x[1], -MAX_WEB_MERCATOR_LATITUDE, MAX_WEB_MERCATOR_LATITUDE);
  float longitudeLow = x[2];
  float latitudeLow = abs(x[1]) < MAX_WEB_MERCATOR_LATITUDE ? x[3] : 0.0;

  float longitudeScale = WEB_MERCATOR_RADIUS * DEGREES_TO_RADIANS;
  float latitudeScale = longitudeScale / cos(latitudeHigh * DEGREES_TO_RADIANS);

  result[0] = longitudeHigh * longitudeScale;
  result[1] = projectMercatorY(latitudeHigh);
  result[2] = longitudeLow * longitudeScale;
  result[3] = latitudeLow * latitudeScale;
}
`;

const projectWGS84ToPseudoMercatorShaderSource = /* wgsl */ `\
const WEB_MERCATOR_RADIUS: f32 = 6378137.0;
const DEGREES_TO_RADIANS: f32 = 0.017453292519943295;
const MAX_WEB_MERCATOR_LATITUDE: f32 = 85.05112878;
const QUARTER_PI: f32 = 0.7853981633974483;

fn projectMercatorY(latitudeDegrees: f32) -> f32 {
  let latitude = clamp(latitudeDegrees, -MAX_WEB_MERCATOR_LATITUDE, MAX_WEB_MERCATOR_LATITUDE);
  let latitudeRadians = latitude * DEGREES_TO_RADIANS;
  return WEB_MERCATOR_RADIUS * log(tan(QUARTER_PI + latitudeRadians * 0.5));
}

fn projectWGS84ToPseudoMercator(x: array<f32, {X_LEN}>) -> array<f32, {RESULT_LEN}> {
  let longitudeHigh = x[0];
  let latitudeHigh = clamp(x[1], -MAX_WEB_MERCATOR_LATITUDE, MAX_WEB_MERCATOR_LATITUDE);
  let longitudeLow = x[2];
  let latitudeLow = select(0.0, x[3], abs(x[1]) < MAX_WEB_MERCATOR_LATITUDE);

  let longitudeScale = WEB_MERCATOR_RADIUS * DEGREES_TO_RADIANS;
  let latitudeScale = longitudeScale / cos(latitudeHigh * DEGREES_TO_RADIANS);

  var result: array<f32, {RESULT_LEN}>;
  result[0] = longitudeHigh * longitudeScale;
  result[1] = projectMercatorY(latitudeHigh);
  result[2] = longitudeLow * longitudeScale;
  result[3] = latitudeLow * latitudeScale;
  return result;
}
`;

const deinterleaveVertexShader = /* glsl */ `\
void deinterleave(in TYPE x[X_LEN], out TYPE result[RESULT_LEN]) {
  for (int i = 0; i < RESULT_LEN; i++) {
    result[i] = x[i];
  }
}
`;

const deinterleaveShaderSource = /* wgsl */ `\
fn deinterleave(x: array<{TYPE}, {X_LEN}>) -> array<{TYPE}, {RESULT_LEN}> {
  var result: array<{TYPE}, {RESULT_LEN}>;
  for (var i = 0u; i < {RESULT_LEN}u; i = i + 1u) {
    result[i] = x[i];
  }
  return result;
}
`;

function runArrowOperation(
  device: Device,
  operation: 'add' | 'interleave' | 'deinterleave' | 'fround' | 'projectWGS84ToPseudoMercator',
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
      if (operation === 'projectWGS84ToPseudoMercator') {
        runBufferTransform({
          module: {
            name: 'projectWGS84ToPseudoMercator',
            vs: projectWGS84ToPseudoMercatorVertexShader
          },
          inputs: inputs as {x: GPUTable},
          output,
          outputBuffer
        });
        return;
      }
      if (operation === 'deinterleave') {
        runBufferTransform({
          module: {name: 'deinterleave', vs: deinterleaveVertexShader},
          inputs: inputs as {x: GPUTable},
          output,
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
      if (operation === 'projectWGS84ToPseudoMercator') {
        runComputation({
          module: {
            name: 'projectWGS84ToPseudoMercator',
            source: projectWGS84ToPseudoMercatorShaderSource
          },
          inputs: inputs as {x: GPUTable},
          output,
          outputBuffer
        });
        return;
      }
      if (operation === 'deinterleave') {
        runComputation({
          module: {name: 'deinterleave', source: deinterleaveShaderSource},
          inputs: inputs as {x: GPUTable},
          output,
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
  throw new Error('Arrow GPU fround requires a Float64 Arrow vector');
}

function getSegmentedBufferSegments(
  inputs: ArrowGPUVector<any>[],
  names: string[] | undefined
): ArrowGPUSegmentedBufferSegment[] {
  if (names && names.length !== inputs.length) {
    throw new Error('Arrow GPU segment requires one segment name per input');
  }

  let byteOffset = 0;
  const usedNames = new Set<string>();
  return inputs.map((input, index) => {
    byteOffset = alignTo(byteOffset, SEGMENTED_BUFFER_ALIGNMENT);
    const name = names?.[index] || input.name || `segment${index}`;
    if (usedNames.has(name)) {
      throw new Error(`Arrow GPU segment name "${name}" is duplicated`);
    }
    usedNames.add(name);

    const byteLength = input.length * input.byteStride;
    const segment: ArrowGPUSegmentedBufferSegment = {
      name,
      arrowType: input.type,
      length: input.length,
      byteOffset,
      byteLength,
      byteStride: input.byteStride
    };
    byteOffset += byteLength;
    return segment;
  });
}

function getSegmentedBufferSegment(
  source: ArrowGPUVector<any>,
  segmentName: string
): ArrowGPUSegmentedBufferSegment {
  if (!arrow.DataType.isBinary(source.type)) {
    throw new Error('Arrow GPU desegment requires a segmented ArrowGPUVector<Binary>');
  }
  if (!source.segmentedBufferLayout) {
    throw new Error('Arrow GPU desegment requires source.segmentedBufferLayout');
  }

  const segment = source.segmentedBufferLayout.segments.find(layout => layout.name === segmentName);
  if (!segment) {
    throw new Error(`Arrow GPU desegment could not find segment "${segmentName}"`);
  }
  if (segment.byteOffset % 4 !== 0 || segment.byteLength % 4 !== 0) {
    throw new Error('Arrow GPU desegment requires 4-byte aligned segment copies');
  }
  return segment;
}

function getInterleavedAttributeInfo(
  source: ArrowGPUVector<any>,
  attributeName: string
): {
  attribute: BufferAttributeLayout;
  formatInfo: {
    arrowType: ArrowGPUDeinterleaveOutput;
    type: SignedDataType;
    components: number;
    scalarByteLength: number;
  };
} {
  if (!arrow.DataType.isBinary(source.type)) {
    throw new Error('Arrow GPU deinterleave requires an interleaved ArrowGPUVector<Binary>');
  }
  if (!source.bufferLayout?.attributes) {
    throw new Error('Arrow GPU deinterleave requires source.bufferLayout.attributes');
  }

  const attribute = source.bufferLayout.attributes.find(
    layout => layout.attribute === attributeName
  );
  if (!attribute) {
    throw new Error(`Arrow GPU deinterleave could not find attribute "${attributeName}"`);
  }

  const formatInfo = getVertexFormatInfo(attribute.format);
  const sourceByteOffset = source.byteOffset + attribute.byteOffset;
  if (
    sourceByteOffset % formatInfo.scalarByteLength !== 0 ||
    source.byteStride % formatInfo.scalarByteLength !== 0
  ) {
    throw new Error('Arrow GPU deinterleave requires aligned attributes');
  }
  return {attribute, formatInfo};
}

function getVertexFormatInfo(format: VertexFormat): {
  arrowType: ArrowGPUDeinterleaveOutput;
  type: SignedDataType;
  components: number;
  byteLength: number;
  scalarByteLength: number;
} {
  const components = getVertexFormatComponents(format);
  const type = getVertexFormatSignedDataType(format);
  const arrowType = getArrowType(type, components);
  const scalarByteLength = getSignedDataTypeByteLength(type);
  return {
    arrowType,
    type,
    components,
    byteLength: scalarByteLength * components,
    scalarByteLength
  };
}

function getVertexFormatComponents(format: VertexFormat): number {
  const match = format.match(/x([234])/);
  return match ? Number(match[1]) : 1;
}

function getVertexFormatSignedDataType(format: VertexFormat): SignedDataType {
  const scalarFormat = format.replace(/x[234](-webgl)?$/, '');
  switch (scalarFormat) {
    case 'float32':
      return 'float32';
    case 'uint32':
      return 'uint32';
    case 'sint32':
      return 'sint32';
    default:
      throw new Error(
        `Arrow GPU deinterleave currently supports only 32-bit attribute formats, got ${format}`
      );
  }
}

function getSignedDataTypeByteLength(type: SignedDataType): number {
  switch (type) {
    case 'uint8':
    case 'sint8':
      return 1;
    case 'uint16':
    case 'sint16':
    case 'float16':
      return 2;
    case 'uint32':
    case 'sint32':
    case 'float32':
      return 4;
    default:
      throw new Error(`Unsupported Arrow GPU storage type ${type}`);
  }
}

function getArrowTypeTableProps(type: arrow.DataType): {type: SignedDataType; size: number} {
  if (arrow.DataType.isFixedSizeList(type)) {
    const childProps = getArrowTypeTableProps(type.children[0].type);
    return {type: childProps.type, size: childProps.size * type.listSize};
  }
  if (arrow.DataType.isInt(type)) {
    if (type.bitWidth === 64) {
      throw new Error('64-bit integer Arrow vectors are not supported by Arrow GPU operations');
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
        throw new Error('float64 Arrow vectors are not supported by Arrow GPU operations');
    }
  }
  throw new Error(`Arrow type ${type} is not supported by Arrow GPU operations`);
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
    throw new Error(`Arrow GPU operations do not support non-zero byteOffset for ${name}`);
  }
}

function validatePackedNumericVector(vector: ArrowGPUVector<any>, name: string): void {
  const {type, size} = getVectorTableProps(vector);
  validateNumericVector(vector, name);
  const expectedByteStride = getSignedDataTypeByteLength(type) * size;
  if (vector.byteStride !== expectedByteStride) {
    throw new Error(`Arrow GPU segment requires packed inputs, got strided ${name}`);
  }
  const byteLength = vector.length * vector.byteStride;
  if (byteLength % 4 !== 0) {
    throw new Error(`Arrow GPU segment requires ${name} byteLength to be 4-byte aligned`);
  }
}

function validateFloat32FixedSizeList(
  vector: ArrowGPUVector<any>,
  size: number,
  name: string
): void {
  const type = vector.type;
  if (!arrow.DataType.isFixedSizeList(type) || type.listSize !== size) {
    throw new Error(`Arrow GPU ${name} must be a FixedSizeList<Float32, ${size}> vector`);
  }
  const childType = type.children[0].type;
  if (!arrow.DataType.isFloat(childType) || childType.precision !== arrow.Precision.SINGLE) {
    throw new Error(`Arrow GPU ${name} must be a FixedSizeList<Float32, ${size}> vector`);
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

function alignTo(value: number, alignment: number): number {
  return Math.ceil(value / alignment) * alignment;
}
