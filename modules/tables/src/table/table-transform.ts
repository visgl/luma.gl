// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Buffer, type BufferLayout, Device, type RenderPassProps} from '@luma.gl/core';
import {BufferTransform, DynamicBuffer, type BufferTransformProps} from '@luma.gl/engine';
import {GPUVector} from './gpu-vector';
import {GPURecordBatch} from './gpu-record-batch';
import {GPUTable} from './gpu-table';

type TableTransformBufferMap = NonNullable<Parameters<BufferTransform['run']>[0]>['outputBuffers'];
type TableTransformRunOptions = Parameters<BufferTransform['run']>[0];
type TableTransformInputVectors = Record<string, GPUVector> | GPUVector[];

/** Maps transform-feedback output varying names back to the input GPU vector they should update. */
export type TableTransformOutputCopyMap = Record<string, string>;

/** Options supplied for one {@link TableTransform.dispatchBatches} dispatch. */
export type TableTransformBatchOptions = RenderPassProps & {
  /** Output transform-feedback buffers for the current batch. */
  outputBuffers?:
    | TableTransformBufferMap
    | ((batch: GPURecordBatch, batchIndex: number) => TableTransformBufferMap);
};

/** Props for creating a WebGL transform backed by a GPU-resident table. */
export type TableTransformProps = BufferTransformProps & {
  /** Existing GPU table used as the source for transform input buffers. */
  table?: GPUTable;
  /** Existing GPU vectors converted into the transform input table. */
  inputVectors?: TableTransformInputVectors;
  /**
   * Allocates dense transform-feedback output vectors and copies them back into named input
   * vectors after each run.
   *
   * Output names are inferred as transform-feedback outputs when `outputs` is omitted.
   */
  copyOutputToInputVectors?: TableTransformOutputCopyMap;
  /** Controls whether GPU table row count is assigned to vertexCount. */
  tableCount?: 'vertex' | 'none';
};

type TableTransformState = {
  table: GPUTable;
  ownsTable: boolean;
  transformProps: BufferTransformProps;
  explicitAttributes: NonNullable<BufferTransformProps['attributes']>;
  explicitBufferLayout: BufferLayout[];
  inferVertexCount: boolean;
  copyOutputToInputVectors: TableTransformOutputCopyMap;
  outputVectors: Record<string, GPUVector>;
};

/**
 * A WebGL transform-feedback program whose input buffers come from a {@link GPUTable}.
 *
 * `TableTransform` keeps the regular {@link BufferTransform} execution model,
 * while adding table construction and batch-by-batch execution helpers.
 */
export class TableTransform extends BufferTransform {
  /** GPU table backing the transform input attributes. */
  readonly table: GPUTable;
  /** GPU vectors backing the transform input attributes. */
  readonly inputVectors: Record<string, GPUVector>;
  /** Dense transform-feedback output vectors allocated for automatic input writeback. */
  readonly outputVectors: Record<string, GPUVector>;
  private readonly ownsTable: boolean;
  private readonly explicitAttributes: NonNullable<BufferTransformProps['attributes']>;
  private readonly explicitBufferLayout: BufferLayout[];
  private readonly inferVertexCount: boolean;
  private readonly copyOutputToInputVectors: TableTransformOutputCopyMap;
  private tableTransformDestroyed = false;

  constructor(device: Device, props: TableTransformProps) {
    const {
      table,
      ownsTable,
      transformProps,
      explicitAttributes,
      explicitBufferLayout,
      inferVertexCount,
      copyOutputToInputVectors,
      outputVectors
    } = getTableTransformState(device, props);

    try {
      super(device, transformProps);
    } catch (error) {
      destroyGPUVectors(outputVectors);
      if (ownsTable) {
        table.destroy();
      }
      throw error;
    }

    this.table = table;
    this.inputVectors = table.gpuVectors;
    this.outputVectors = outputVectors;
    this.ownsTable = ownsTable;
    this.explicitAttributes = explicitAttributes;
    this.explicitBufferLayout = explicitBufferLayout;
    this.inferVertexCount = inferVertexCount;
    this.copyOutputToInputVectors = copyOutputToInputVectors;
  }

  /** Runs the transform once and optionally copies transform outputs back into input vectors. */
  override run(options: TableTransformRunOptions = {}): void {
    if (!this.hasAutomaticOutputWriteback()) {
      super.run(options);
      return;
    }
    assertNoExplicitOutputBuffers(
      options?.outputBuffers,
      'TableTransform.run() cannot combine outputBuffers with copyOutputToInputVectors'
    );
    super.run({...options, outputBuffers: this.getAutomaticOutputBuffers()});
    this.copyOutputsToInputVectors();
  }

  /** Runs the transform once per preserved GPU record batch. */
  dispatchBatches(options: TableTransformBatchOptions = {}): void {
    if (this.hasAutomaticOutputWriteback() && options.outputBuffers) {
      throw new Error(
        'TableTransform.dispatchBatches() cannot combine outputBuffers with copyOutputToInputVectors'
      );
    }
    assertMatchingBufferLayouts(
      this.table.bufferLayout,
      this.explicitBufferLayout,
      this.model.bufferLayout,
      'TableTransform.dispatchBatches() model buffer layout does not match its GPU table'
    );

    try {
      this.table.batches.forEach((batch, batchIndex) => {
        assertMatchingBufferLayouts(
          this.table.bufferLayout,
          [],
          batch.bufferLayout,
          'TableTransform.dispatchBatches() requires every GPU batch to use the table buffer layout'
        );
        this.model.setAttributes({
          ...this.explicitAttributes,
          ...batch.attributes
        });
        if (this.inferVertexCount) {
          this.model.setVertexCount(batch.numRows);
        }

        const outputBuffers =
          typeof options.outputBuffers === 'function'
            ? options.outputBuffers(batch, batchIndex)
            : options.outputBuffers;
        const {outputBuffers: _ignoredOutputBuffers, ...renderPassProps} = options;
        if (this.hasAutomaticOutputWriteback()) {
          super.run({...renderPassProps, outputBuffers: this.getAutomaticOutputBuffers()});
        } else {
          super.run({...renderPassProps, outputBuffers});
        }
      });
      if (this.hasAutomaticOutputWriteback()) {
        this.copyOutputsToInputVectors();
      }
    } finally {
      this.model.setAttributes({
        ...this.explicitAttributes,
        ...this.table.attributes
      });
      if (this.inferVertexCount) {
        this.model.setVertexCount(this.table.numRows);
      }
    }
  }

  override destroy(): void {
    if (this.tableTransformDestroyed) {
      return;
    }
    super.destroy();
    destroyGPUVectors(this.outputVectors);
    if (this.ownsTable) {
      this.table.destroy();
    }
    this.tableTransformDestroyed = true;
  }

  private hasAutomaticOutputWriteback(): boolean {
    return Object.keys(this.copyOutputToInputVectors).length > 0;
  }

  private getAutomaticOutputBuffers(): TableTransformBufferMap {
    return Object.fromEntries(
      Object.entries(this.outputVectors).map(([outputName, vector]) => [
        outputName,
        getConcreteBuffer(vector.buffer)
      ])
    );
  }

  private copyOutputsToInputVectors(): void {
    const commandEncoder = this.device.createCommandEncoder();
    let copyCount = 0;

    for (const [outputName, inputName] of Object.entries(this.copyOutputToInputVectors)) {
      const outputVector = this.outputVectors[outputName];
      const inputVector = this.inputVectors[inputName];
      if (!outputVector || !inputVector) {
        throw new Error(`TableTransform writeback mapping "${outputName}" is incomplete`);
      }
      const size = inputVector.length * inputVector.byteStride;
      if (size === 0) {
        continue;
      }
      commandEncoder.copyBufferToBuffer({
        sourceBuffer: getConcreteBuffer(outputVector.buffer),
        destinationBuffer: getConcreteBuffer(inputVector.buffer),
        size
      });
      copyCount++;
    }

    if (copyCount > 0) {
      this.device.submit(commandEncoder.finish());
      return;
    }
    commandEncoder.destroy();
  }
}

function getTableTransformState(device: Device, props: TableTransformProps): TableTransformState {
  const {
    table: explicitTable,
    inputVectors,
    copyOutputToInputVectors = {},
    tableCount = 'vertex',
    ...transformProps
  } = props;

  validateTableTransformSources({table: explicitTable, inputVectors});
  if (!transformProps.shaderLayout) {
    throw new Error('TableTransform requires shaderLayout');
  }

  const {table, ownsTable} = getInitialTable({
    table: explicitTable,
    inputVectors
  });

  const explicitAttributes = transformProps.attributes || {};
  const explicitBufferLayout = transformProps.bufferLayout || [];
  const inferVertexCount = tableCount === 'vertex' && transformProps.vertexCount === undefined;
  let outputVectors: Record<string, GPUVector> = {};
  let transformOutputs: string[] | undefined;

  try {
    assertNoDuplicateNames(
      Object.keys(explicitAttributes),
      Object.keys(table.attributes),
      'attribute'
    );
    assertNoDuplicateNames(
      getBufferLayoutNames(explicitBufferLayout),
      getBufferLayoutNames(table.bufferLayout),
      'buffer layout'
    );
    outputVectors = createAutomaticOutputVectors(device, table, copyOutputToInputVectors);
    transformOutputs = getTableTransformOutputs(transformProps, copyOutputToInputVectors);
  } catch (error) {
    destroyGPUVectors(outputVectors);
    if (ownsTable) {
      table.destroy();
    }
    throw error;
  }

  return {
    table,
    ownsTable,
    explicitAttributes,
    explicitBufferLayout,
    inferVertexCount,
    copyOutputToInputVectors,
    outputVectors,
    transformProps: {
      ...transformProps,
      ...(transformOutputs ? {outputs: transformOutputs} : {}),
      attributes: {...explicitAttributes, ...table.attributes},
      bufferLayout: [...explicitBufferLayout, ...table.bufferLayout],
      ...(inferVertexCount ? {vertexCount: table.numRows} : {})
    }
  };
}

function getInitialTable(props: {table?: GPUTable; inputVectors?: TableTransformInputVectors}): {
  table: GPUTable;
  ownsTable: boolean;
} {
  if (props.table) {
    return {table: props.table, ownsTable: false};
  }
  if (props.inputVectors) {
    return {table: new GPUTable({vectors: props.inputVectors}), ownsTable: true};
  }
  throw new Error('TableTransform requires table or inputVectors');
}

function validateTableTransformSources(props: {
  table?: GPUTable;
  inputVectors?: TableTransformInputVectors;
}): void {
  const sourceCount = Number(Boolean(props.table)) + Number(Boolean(props.inputVectors));
  if (sourceCount > 1) {
    throw new Error('TableTransform requires only one of table or inputVectors');
  }
  if (sourceCount === 0) {
    throw new Error('TableTransform requires table or inputVectors');
  }
}

function createAutomaticOutputVectors(
  device: Device,
  table: GPUTable,
  copyOutputToInputVectors: TableTransformOutputCopyMap
): Record<string, GPUVector> {
  const outputEntries = Object.entries(copyOutputToInputVectors);
  if (outputEntries.length === 0) {
    return {};
  }
  if (table.batches.length !== 1) {
    throw new Error(
      'TableTransform copyOutputToInputVectors currently requires one directly bindable GPU batch'
    );
  }

  const copiedInputNames = new Set<string>();
  const outputVectors: Record<string, GPUVector> = {};

  try {
    for (const [outputName, inputName] of outputEntries) {
      if (copiedInputNames.has(inputName)) {
        throw new Error(
          `TableTransform copyOutputToInputVectors maps more than one output to "${inputName}"`
        );
      }
      copiedInputNames.add(inputName);

      const inputVector = table.gpuVectors[inputName];
      if (!inputVector) {
        throw new Error(
          `TableTransform copyOutputToInputVectors references missing input vector "${inputName}"`
        );
      }
      validateAutomaticWritebackVector(inputName, inputVector);

      const byteLength = inputVector.length * inputVector.byteStride;
      const outputBuffer = device.createBuffer({
        usage: Buffer.VERTEX | Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST,
        byteLength: Math.max(1, byteLength)
      });
      outputVectors[outputName] = new GPUVector({
        type: 'buffer',
        name: outputName,
        buffer: outputBuffer,
        dataType: inputVector.type,
        length: inputVector.length,
        stride: inputVector.stride,
        byteStride: inputVector.byteStride,
        rowByteLength: inputVector.rowByteLength,
        ownsBuffer: true
      });
    }
  } catch (error) {
    destroyGPUVectors(outputVectors);
    throw error;
  }

  return outputVectors;
}

function validateAutomaticWritebackVector(name: string, vector: GPUVector): void {
  if (vector.bufferLayout) {
    throw new Error(
      `TableTransform copyOutputToInputVectors does not support interleaved input vector "${name}"`
    );
  }
  if (vector.byteOffset !== 0) {
    throw new Error(
      `TableTransform copyOutputToInputVectors requires zero byteOffset for input vector "${name}"`
    );
  }
  if (vector.byteStride !== vector.rowByteLength) {
    throw new Error(
      `TableTransform copyOutputToInputVectors requires tightly packed input vector "${name}"`
    );
  }
  getConcreteBuffer(vector.buffer);
}

function getTableTransformOutputs(
  transformProps: BufferTransformProps,
  copyOutputToInputVectors: TableTransformOutputCopyMap
): string[] | undefined {
  const inferredOutputs = Object.keys(copyOutputToInputVectors);
  if (inferredOutputs.length === 0) {
    return transformProps.outputs;
  }

  const declaredOutputs = transformProps.outputs || transformProps.varyings;
  if (!declaredOutputs) {
    return inferredOutputs;
  }
  assertSameOutputNames(declaredOutputs, inferredOutputs);
  return transformProps.outputs;
}

function assertSameOutputNames(declaredOutputs: string[], inferredOutputs: string[]): void {
  if (
    declaredOutputs.length !== inferredOutputs.length ||
    declaredOutputs.some(outputName => !inferredOutputs.includes(outputName))
  ) {
    throw new Error(
      'TableTransform outputs must match copyOutputToInputVectors output names when both are supplied'
    );
  }
}

function assertNoExplicitOutputBuffers(
  outputBuffers: TableTransformBufferMap | undefined,
  errorMessage: string
): void {
  if (outputBuffers) {
    throw new Error(errorMessage);
  }
}

function getConcreteBuffer(buffer: Buffer | DynamicBuffer): Buffer {
  return buffer instanceof DynamicBuffer ? buffer.buffer : buffer;
}

function destroyGPUVectors(vectors: Record<string, GPUVector>): void {
  for (const vector of Object.values(vectors)) {
    vector.destroy();
  }
}

function getBufferLayoutNames(bufferLayout: BufferLayout[]): string[] {
  return bufferLayout.map(layout => layout.name);
}

function assertNoDuplicateNames(
  explicitNames: string[],
  tableNames: string[],
  nameType: string
): void {
  const explicitNameSet = new Set(explicitNames);
  for (const tableName of tableNames) {
    if (explicitNameSet.has(tableName)) {
      throw new Error(
        `TableTransform ${nameType} "${tableName}" duplicates an explicit ${nameType}`
      );
    }
  }
}

function assertMatchingBufferLayouts(
  tableBufferLayout: BufferLayout[],
  explicitBufferLayout: BufferLayout[],
  candidateBufferLayout: BufferLayout[],
  errorMessage: string
): void {
  const expectedBufferLayout = [...explicitBufferLayout, ...tableBufferLayout];
  if (JSON.stringify(expectedBufferLayout) !== JSON.stringify(candidateBufferLayout)) {
    throw new Error(errorMessage);
  }
}
