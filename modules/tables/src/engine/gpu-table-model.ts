// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  Buffer,
  Device,
  type BufferLayout,
  type CommandEncoder,
  type RenderPass
} from '@luma.gl/core';
import {DynamicBuffer, Model, type ModelProps} from '@luma.gl/engine';
import type {GPUInputSchema} from './gpu-input-schema';
import {GPUTableShaderBindings} from './gpu-table-shader-bindings';
import type {GPURecordBatch} from '../table/gpu-record-batch';
import {GPU_TABLE_INDEX_COLUMN_NAME} from '../table/gpu-schema';
import {GPUTable} from '../table/gpu-table';
import {getGPUDataBuffersForLayout} from '../table/gpu-vector-utils';

/** Controls which Model draw count mirrors the current GPU table row count. */
export type GPUTableModelCount = 'instance' | 'vertex' | 'none';

/** Props for rendering one GPU table through a luma.gl Model. */
export type GPUTableModelProps = ModelProps & {
  /** GPU table supplying model-ready attributes, bindings, and preserved batches. */
  table?: GPUTable;
  /** Controls whether table rows infer `instanceCount`, `vertexCount`, or neither. */
  tableCount?: GPUTableModelCount;
  /** Optional logical-column contract used to resolve constants and renamed shader inputs. */
  gpuInputSchema?: GPUInputSchema;
};

export type GPUTableModelDrawBatchesOptions = {
  /** Called immediately before drawing each preserved GPU record batch. */
  onBatch?: (batch: GPURecordBatch, batchIndex: number) => void;
};

type GPUTableModelState = {
  explicitAttributes: NonNullable<ModelProps['attributes']>;
  explicitBindings: NonNullable<ModelProps['bindings']>;
  tableBindingNames: string[];
  explicitBufferLayout: BufferLayout[];
  explicitIndexBuffer: Buffer | DynamicBuffer | null;
  explicitIndexCount: number | undefined;
  explicitFirstVertex: number;
  explicitFirstIndex: number;
  explicitVertexCount: number;
  inferInstanceCount: boolean;
  inferVertexCount: boolean;
  gpuInputSchema?: GPUInputSchema;
  shaderLayout?: ModelProps['shaderLayout'];
};

type GPUTableModelConstructorState = {
  table?: GPUTable;
  modelProps: ModelProps;
  state: GPUTableModelState;
  shaderBindings?: GPUTableShaderBindings;
};

type GPUTableDrawSource = GPUTable | GPURecordBatch;

type GPUTableIndexDrawState = {
  indexBuffer: Buffer | DynamicBuffer;
  indexCount: number;
  firstVertex: number;
  firstIndex: number;
};

/**
 * A luma.gl Model whose GPU attributes and bindings are sourced from a `GPUTable`.
 *
 * The table stays caller-owned. The model rebinds preserved table batches on
 * demand and mirrors table row counts into draw counts when requested.
 */
export class GPUTableModel extends Model {
  /** Currently bound table, when table-backed rendering is active. */
  table?: GPUTable;
  private readonly tableState: GPUTableModelState;
  private tableShaderBindings?: GPUTableShaderBindings;
  private drawingTableBatches = false;

  /** Bytes owned by table-to-shader binding preparation, excluding caller-owned table buffers. */
  get tableBindingByteLength(): number {
    return this.tableShaderBindings?.ownedByteLength ?? 0;
  }

  /** Creates a model whose table-backed attributes and bindings can be rebound by batch. */
  constructor(device: Device, props: GPUTableModelProps) {
    const {table, modelProps, state, shaderBindings} = getGPUTableModelConstructorState(
      device,
      props
    );
    super(device, modelProps);
    this.table = table;
    this.tableState = state;
    this.tableShaderBindings = shaderBindings;
    this.captureExplicitDrawState();
    if (table) {
      this.setTableDrawState(table);
    }
  }

  override destroy(): void {
    this.tableShaderBindings?.destroy();
    this.tableShaderBindings = undefined;
    super.destroy();
  }

  /** Replaces the bound GPU table when one is supplied. */
  setProps(props: Partial<GPUTableModelProps>): void {
    if (props.table) {
      this.setTable(props.table);
    }
  }

  /** Query redraw status after synchronizing inferred table draw state. */
  override needsRedraw(): false | string {
    this.syncTableDrawState();
    return super.needsRedraw();
  }

  /** Synchronizes inferred table draw state before opening a render pass. */
  override predraw(commandEncoder: CommandEncoder): void {
    this.syncTableDrawState();
    super.predraw(commandEncoder);
  }

  /**
   * Draws each preserved GPU record batch by rebinding batch-local buffers.
   *
   * The table-level attributes and bindings are restored before returning.
   */
  drawBatches(renderPass: RenderPass, options: GPUTableModelDrawBatchesOptions = {}): boolean {
    const table = this.table;
    if (!(table instanceof GPUTable)) {
      throw new Error('GPUTableModel.drawBatches() requires a GPUTable');
    }

    const tableBufferLayout = this.tableShaderBindings?.bufferLayout ?? table.bufferLayout;
    assertMatchingBufferLayouts(
      tableBufferLayout,
      this.tableState.explicitBufferLayout,
      this.bufferLayout,
      'GPUTableModel.drawBatches() model buffer layout does not match its GPU table'
    );

    let drawSuccess = true;
    this.drawingTableBatches = true;
    try {
      for (const [batchIndex, batch] of table.batches.entries()) {
        const preparedBatch = this.tableShaderBindings?.batches[batchIndex];
        if (this.tableShaderBindings && !preparedBatch) {
          throw new Error('GPUTableModel.drawBatches() is missing prepared batch bindings');
        }
        this.setAttributes({
          ...this.tableState.explicitAttributes,
          ...(preparedBatch?.attributes ?? getGPUTableDrawAttributes(batch))
        });
        this.setBindings({
          ...this.tableState.explicitBindings,
          ...(preparedBatch?.bindings ??
            getGPUTableDrawBindings(batch, this.tableState.tableBindingNames))
        });
        if (this.tableShaderBindings) {
          this.setConstantAttributes(this.tableShaderBindings.constantAttributes);
        }
        this.setTableDrawState(batch);
        options.onBatch?.(batch, batchIndex);
        drawSuccess = super.draw(renderPass) && drawSuccess;
      }
    } finally {
      this.drawingTableBatches = false;
      this.setAttributes({
        ...this.tableState.explicitAttributes,
        ...(this.tableShaderBindings?.batches[0]?.attributes ?? getGPUTableDrawAttributes(table))
      });
      this.setBindings({
        ...this.tableState.explicitBindings,
        ...(this.tableShaderBindings?.batches[0]?.bindings ??
          getGPUTableDrawBindings(table, this.tableState.tableBindingNames))
      });
      this.setTableDrawState(table);
    }

    return drawSuccess;
  }

  /** Rebinds the model to a replacement table while preserving explicit model state. */
  protected setTable(nextTable: GPUTable): void {
    if (this.tableState.gpuInputSchema) {
      if (!this.tableState.shaderLayout) {
        throw new Error('GPUTableModel gpuInputSchema requires shaderLayout');
      }
      if (this.tableShaderBindings) {
        this.tableShaderBindings.updateBindings(nextTable);
      } else {
        this.tableShaderBindings = new GPUTableShaderBindings(this.device, {
          table: nextTable,
          gpuInputSchema: this.tableState.gpuInputSchema,
          shaderLayout: this.tableState.shaderLayout
        });
        if (this.tableShaderBindings.shaderModule) {
          this.tableShaderBindings.destroy();
          this.tableShaderBindings = undefined;
          throw new Error(
            'GPUTableModel storage gpuInputSchema requires a table during model construction'
          );
        }
      }
    }
    const tableBufferLayout = this.tableShaderBindings?.bufferLayout ?? nextTable.bufferLayout;
    const tableAttributes =
      this.tableShaderBindings?.batches[0]?.attributes ?? getGPUTableDrawAttributes(nextTable);
    const tableBindings =
      this.tableShaderBindings?.batches[0]?.bindings ??
      getGPUTableDrawBindings(nextTable, this.tableState.tableBindingNames);
    assertNoExplicitIndexBuffer(nextTable, this.tableState.explicitIndexBuffer);
    validateGPUTableIndexBatches(nextTable);
    assertNoDuplicateNames(
      Object.keys(this.tableState.explicitAttributes),
      getBufferLayoutNames(tableBufferLayout),
      'attribute'
    );
    assertNoDuplicateNames(
      getBufferLayoutNames(this.tableState.explicitBufferLayout),
      getBufferLayoutNames(tableBufferLayout),
      'buffer layout'
    );
    assertNoDuplicateNames(
      Object.keys(this.tableState.explicitBindings),
      Object.keys(tableBindings),
      'binding'
    );
    this.setBufferLayout([...this.tableState.explicitBufferLayout, ...tableBufferLayout]);
    this.setAttributes({
      ...this.tableState.explicitAttributes,
      ...tableAttributes
    });
    this.setBindings({
      ...this.tableState.explicitBindings,
      ...tableBindings
    });
    if (this.tableShaderBindings) {
      this.setConstantAttributes(this.tableShaderBindings.constantAttributes);
    }
    this.setTableDrawState(nextTable);
    this.table = nextTable;
  }

  /** Disables table-backed draw state and restores any explicit index buffer. */
  protected clearTable(): void {
    this.table = undefined;
    this.restoreExplicitIndexDrawState();
  }

  private syncTableDrawState(): void {
    if (!this.table || this.drawingTableBatches) {
      return;
    }
    this.setTableDrawState(this.table);
  }

  private captureExplicitDrawState(): void {
    if (!this.tableState.explicitIndexBuffer && this.indexBuffer) {
      this.tableState.explicitIndexBuffer = this.indexBuffer;
    }
    if (this.tableState.explicitIndexCount === undefined && this.indexCount !== undefined) {
      this.tableState.explicitIndexCount = this.indexCount;
    }
    if (this.tableState.explicitVertexCount === 0 && this.vertexCount > 0) {
      this.tableState.explicitVertexCount = this.vertexCount;
    }
  }

  private setTableDrawState(source: GPUTableDrawSource): void {
    this.setTableRowCount(source.numRows);
    const indexDrawState = getGPUTableIndexDrawState(source);
    if (indexDrawState) {
      this.setTableIndexDrawState(indexDrawState);
      return;
    }
    this.restoreExplicitIndexDrawState();
  }

  private setTableRowCount(rowCount: number): void {
    if (this.tableState.inferInstanceCount && this.instanceCount !== rowCount) {
      this.setInstanceCount(rowCount);
    }
    if (this.tableState.inferVertexCount && this.vertexCount !== rowCount) {
      this.setVertexCount(rowCount);
    }
  }

  private setTableIndexDrawState({
    indexBuffer,
    indexCount,
    firstVertex,
    firstIndex
  }: GPUTableIndexDrawState): void {
    if (this.indexBuffer !== getConcreteIndexBuffer(indexBuffer)) {
      this.setIndexBuffer(indexBuffer);
    }
    if (this.indexCount !== indexCount) {
      this.setIndexCount(indexCount);
    }
    if (this.firstVertex !== firstVertex || this.firstIndex !== firstIndex) {
      this.setDrawOffsets({firstVertex, firstIndex});
    }
    if (this.vertexCount !== indexCount) {
      this.setVertexCount(indexCount);
    }
  }

  private restoreExplicitIndexDrawState(): void {
    if (this.indexBuffer !== getConcreteIndexBuffer(this.tableState.explicitIndexBuffer)) {
      this.setIndexBuffer(this.tableState.explicitIndexBuffer);
    }
    if (this.indexCount !== this.tableState.explicitIndexCount) {
      this.setIndexCount(this.tableState.explicitIndexCount);
    }
    if (
      this.firstVertex !== this.tableState.explicitFirstVertex ||
      this.firstIndex !== this.tableState.explicitFirstIndex
    ) {
      this.setDrawOffsets({
        firstVertex: this.tableState.explicitFirstVertex,
        firstIndex: this.tableState.explicitFirstIndex
      });
    }
    if (
      !this.tableState.inferVertexCount &&
      this.vertexCount !== this.tableState.explicitVertexCount
    ) {
      this.setVertexCount(this.tableState.explicitVertexCount);
    }
  }
}

function getGPUTableModelConstructorState(
  device: Device,
  props: GPUTableModelProps
): GPUTableModelConstructorState {
  const {table, tableCount = 'instance', gpuInputSchema, ...modelProps} = props;
  const explicitAttributes = modelProps.attributes || {};
  const explicitBindings = modelProps.bindings || {};
  const tableBindingNames = (modelProps.shaderLayout?.bindings || [])
    .filter(binding => binding.type === 'storage' || binding.type === 'read-only-storage')
    .map(binding => binding.name);
  const explicitBufferLayout = modelProps.bufferLayout || [];
  const explicitIndexBuffer = modelProps.indexBuffer ?? null;
  const explicitIndexCount = modelProps.indexCount;
  const explicitFirstVertex = modelProps.firstVertex ?? 0;
  const explicitFirstIndex = modelProps.firstIndex ?? 0;
  const explicitVertexCount = modelProps.vertexCount ?? 0;
  const inferInstanceCount =
    Boolean(table) && tableCount === 'instance' && modelProps.instanceCount === undefined;
  const inferVertexCount =
    Boolean(table) && tableCount === 'vertex' && modelProps.vertexCount === undefined;

  if (!table) {
    return {
      table,
      modelProps,
      state: {
        explicitAttributes,
        explicitBindings,
        tableBindingNames,
        explicitBufferLayout,
        explicitIndexBuffer,
        explicitIndexCount,
        explicitFirstVertex,
        explicitFirstIndex,
        explicitVertexCount,
        inferInstanceCount,
        inferVertexCount,
        gpuInputSchema,
        shaderLayout: modelProps.shaderLayout
      }
    };
  }

  assertNoExplicitIndexBuffer(table, explicitIndexBuffer);
  validateGPUTableIndexBatches(table);

  let shaderBindings: GPUTableShaderBindings | undefined;
  if (gpuInputSchema) {
    if (!modelProps.shaderLayout) {
      throw new Error('GPUTableModel gpuInputSchema requires shaderLayout');
    }
    shaderBindings = new GPUTableShaderBindings(device, {
      table,
      gpuInputSchema,
      shaderLayout: modelProps.shaderLayout
    });
  } else if (Object.keys(table.gpuConstants).length > 0) {
    throw new Error('GPUTableModel constant columns require gpuInputSchema');
  }

  const tableBufferLayout = shaderBindings?.bufferLayout ?? table.bufferLayout;
  const tableAttributes =
    shaderBindings?.batches[0]?.attributes ?? getGPUTableDrawAttributes(table);
  const tableBindings =
    shaderBindings?.batches[0]?.bindings ?? getGPUTableDrawBindings(table, tableBindingNames);

  assertNoDuplicateNames(
    Object.keys(explicitAttributes),
    getBufferLayoutNames(tableBufferLayout),
    'attribute'
  );
  assertNoDuplicateNames(
    getBufferLayoutNames(explicitBufferLayout),
    getBufferLayoutNames(tableBufferLayout),
    'buffer layout'
  );
  assertNoDuplicateNames(Object.keys(explicitBindings), Object.keys(tableBindings), 'binding');

  return {
    table,
    shaderBindings,
    state: {
      explicitAttributes,
      explicitBindings,
      tableBindingNames,
      explicitBufferLayout,
      explicitIndexBuffer,
      explicitIndexCount,
      explicitFirstVertex,
      explicitFirstIndex,
      explicitVertexCount,
      inferInstanceCount,
      inferVertexCount,
      gpuInputSchema,
      shaderLayout: modelProps.shaderLayout
    },
    modelProps: {
      ...modelProps,
      modules: shaderBindings?.shaderModule
        ? [...(modelProps.modules ?? []), shaderBindings.shaderModule]
        : modelProps.modules,
      bufferLayout: [...explicitBufferLayout, ...tableBufferLayout],
      attributes: {...explicitAttributes, ...tableAttributes},
      constantAttributes: {
        ...(modelProps.constantAttributes || {}),
        ...(shaderBindings?.constantAttributes || {})
      },
      bindings: {
        ...explicitBindings,
        ...tableBindings
      },
      ...(inferInstanceCount ? {instanceCount: table.numRows} : {}),
      ...(inferVertexCount ? {vertexCount: table.numRows} : {})
    }
  };
}

function getGPUTableDrawBindings(
  source: GPUTableDrawSource,
  bindingNames: string[]
): Record<string, Buffer | DynamicBuffer> {
  const batch = source instanceof GPUTable ? source.batches[0] : source;
  if (!batch) {
    return {};
  }
  const bindings: Record<string, Buffer | DynamicBuffer> = {};
  for (const bindingName of bindingNames) {
    const data = batch.gpuData[bindingName];
    if (data) {
      bindings[bindingName] = data.buffer;
    }
  }
  return bindings;
}

function getGPUTableDrawAttributes(
  source: GPUTableDrawSource
): Record<string, Buffer | DynamicBuffer> {
  const attributeSource = source instanceof GPUTable ? source.batches[0] : source;
  if (!attributeSource) {
    return {};
  }
  return getGPUDataBuffersForLayout(attributeSource.bufferLayout, attributeSource.gpuData);
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
        `GPUTableModel ${nameType} "${tableName}" duplicates an explicit ${nameType}`
      );
    }
  }
}

function assertNoExplicitIndexBuffer(
  table: Pick<GPUTable, 'gpuVectors'>,
  explicitIndexBuffer: Buffer | DynamicBuffer | null
): void {
  if (explicitIndexBuffer && table.gpuVectors[GPU_TABLE_INDEX_COLUMN_NAME]) {
    throw new Error('GPUTableModel indices column duplicates an explicit indexBuffer');
  }
}

function validateGPUTableIndexBatches(table: GPUTable): void {
  const tableHasIndices = Boolean(table.gpuVectors[GPU_TABLE_INDEX_COLUMN_NAME]);
  for (const batch of table.batches) {
    const batchHasIndices = Boolean(batch.gpuData[GPU_TABLE_INDEX_COLUMN_NAME]);
    if (batchHasIndices !== tableHasIndices) {
      throw new Error('GPUTableModel indexed tables require every batch to include indices');
    }
    getGPUTableIndexDrawState(batch);
  }
}

function getGPUTableIndexDrawState(source: GPUTableDrawSource): GPUTableIndexDrawState | null {
  const indexData =
    source instanceof GPUTable
      ? source.gpuVectors[GPU_TABLE_INDEX_COLUMN_NAME]?.data[0]
      : source.gpuData[GPU_TABLE_INDEX_COLUMN_NAME];
  if (!indexData) {
    return null;
  }
  if (source instanceof GPUTable && source.batches.length > 1) {
    return null;
  }
  if (indexData.format !== 'vertex-list<uint32>') {
    throw new Error('GPUTableModel indices column requires vertex-list<uint32> format');
  }

  if (
    source instanceof GPUTable &&
    source.gpuVectors[GPU_TABLE_INDEX_COLUMN_NAME].data.length !== 1
  ) {
    throw new Error('GPUTableModel indices column requires exactly one GPUData chunk');
  }
  const indexBuffer = indexData.buffer;
  const concreteIndexBuffer = getConcreteIndexBuffer(indexBuffer);
  if (!concreteIndexBuffer || !(concreteIndexBuffer.usage & Buffer.INDEX)) {
    throw new Error('GPUTableModel indices column requires Buffer.INDEX usage');
  }
  const indexByteStride = concreteIndexBuffer.indexType === 'uint32' ? 4 : 2;
  if (indexData.byteOffset % indexByteStride !== 0) {
    throw new Error('GPUTableModel indices column byteOffset must align with its index type');
  }
  return {
    indexBuffer,
    indexCount: indexData.valueLength,
    firstVertex: indexData.byteOffset,
    firstIndex: indexData.byteOffset / indexByteStride
  };
}

function getConcreteIndexBuffer(indexBuffer: Buffer | DynamicBuffer | null): Buffer | null {
  return indexBuffer instanceof DynamicBuffer ? indexBuffer.buffer : indexBuffer;
}

function assertMatchingBufferLayouts(
  tableBufferLayout: BufferLayout[],
  explicitBufferLayout: BufferLayout[],
  candidateBufferLayout: BufferLayout[],
  errorMessage: string
): void {
  const expectedBufferLayout = [...explicitBufferLayout, ...tableBufferLayout];
  if (!deepEqualBufferLayouts(expectedBufferLayout, candidateBufferLayout)) {
    throw new Error(errorMessage);
  }
}

function deepEqualBufferLayouts(
  expectedBufferLayout: BufferLayout[],
  candidateBufferLayout: BufferLayout[]
): boolean {
  return JSON.stringify(expectedBufferLayout) === JSON.stringify(candidateBufferLayout);
}
