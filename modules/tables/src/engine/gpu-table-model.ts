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
import type {GPURecordBatch} from '../table/gpu-record-batch';
import {GPU_TABLE_INDEX_COLUMN_NAME} from '../table/gpu-schema';
import {GPUTable} from '../table/gpu-table';

/** Controls which Model draw count mirrors the current GPU table row count. */
export type GPUTableModelCount = 'instance' | 'vertex' | 'none';

/** Props for rendering one GPU table through a luma.gl Model. */
export type GPUTableModelProps = ModelProps & {
  /** GPU table supplying model-ready attributes, bindings, and preserved batches. */
  table?: GPUTable;
  /** Controls whether table rows infer `instanceCount`, `vertexCount`, or neither. */
  tableCount?: GPUTableModelCount;
};

export type GPUTableModelDrawBatchesOptions = {
  /** Called immediately before drawing each preserved GPU record batch. */
  onBatch?: (batch: GPURecordBatch, batchIndex: number) => void;
};

type GPUTableModelState = {
  explicitAttributes: NonNullable<ModelProps['attributes']>;
  explicitBindings: NonNullable<ModelProps['bindings']>;
  explicitBufferLayout: BufferLayout[];
  explicitIndexBuffer: Buffer | DynamicBuffer | null;
  explicitVertexCount: number;
  inferInstanceCount: boolean;
  inferVertexCount: boolean;
};

type GPUTableModelConstructorState = {
  table?: GPUTable;
  modelProps: ModelProps;
  state: GPUTableModelState;
};

type GPUTableDrawSource = GPUTable | GPURecordBatch;

type GPUTableIndexDrawState = {
  indexBuffer: Buffer | DynamicBuffer;
  indexCount: number;
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
  private drawingTableBatches = false;

  /** Creates a model whose table-backed attributes and bindings can be rebound by batch. */
  constructor(device: Device, props: GPUTableModelProps) {
    const {table, modelProps, state} = getGPUTableModelConstructorState(props);
    super(device, modelProps);
    this.table = table;
    this.tableState = state;
    if (table) {
      this.setTableDrawState(table);
    }
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

    assertMatchingBufferLayouts(
      table.bufferLayout,
      this.tableState.explicitBufferLayout,
      this.bufferLayout,
      'GPUTableModel.drawBatches() model buffer layout does not match its GPU table'
    );

    let drawSuccess = true;
    this.drawingTableBatches = true;
    try {
      for (const [batchIndex, batch] of table.batches.entries()) {
        assertMatchingBufferLayouts(
          table.bufferLayout,
          [],
          batch.bufferLayout,
          'GPUTableModel.drawBatches() requires every batch to use the table buffer layout'
        );
        this.setAttributes({
          ...this.tableState.explicitAttributes,
          ...batch.attributes
        });
        this.setBindings({
          ...this.tableState.explicitBindings,
          ...batch.bindings
        });
        this.setTableDrawState(batch);
        options.onBatch?.(batch, batchIndex);
        drawSuccess = super.draw(renderPass) && drawSuccess;
      }
    } finally {
      this.drawingTableBatches = false;
      this.setAttributes({
        ...this.tableState.explicitAttributes,
        ...table.attributes
      });
      this.setBindings({
        ...this.tableState.explicitBindings,
        ...table.bindings
      });
      this.setTableDrawState(table);
    }

    return drawSuccess;
  }

  /** Rebinds the model to a replacement table while preserving explicit model state. */
  protected setTable(nextTable: GPUTable): void {
    assertNoExplicitIndexBuffer(nextTable, this.tableState.explicitIndexBuffer);
    validateGPUTableIndexBatches(nextTable);
    assertNoDuplicateNames(
      Object.keys(this.tableState.explicitAttributes),
      Object.keys(nextTable.attributes),
      'attribute'
    );
    assertNoDuplicateNames(
      getBufferLayoutNames(this.tableState.explicitBufferLayout),
      getBufferLayoutNames(nextTable.bufferLayout),
      'buffer layout'
    );
    assertNoDuplicateNames(
      Object.keys(this.tableState.explicitBindings),
      Object.keys(nextTable.bindings),
      'binding'
    );

    this.setBufferLayout([...this.tableState.explicitBufferLayout, ...nextTable.bufferLayout]);
    this.setAttributes({
      ...this.tableState.explicitAttributes,
      ...nextTable.attributes
    });
    this.setBindings({
      ...this.tableState.explicitBindings,
      ...nextTable.bindings
    });
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

  private setTableIndexDrawState({indexBuffer, indexCount}: GPUTableIndexDrawState): void {
    if (this.indexBuffer !== getConcreteIndexBuffer(indexBuffer)) {
      this.setIndexBuffer(indexBuffer);
    }
    if (this.vertexCount !== indexCount) {
      this.setVertexCount(indexCount);
    }
  }

  private restoreExplicitIndexDrawState(): void {
    if (this.indexBuffer !== getConcreteIndexBuffer(this.tableState.explicitIndexBuffer)) {
      this.setIndexBuffer(this.tableState.explicitIndexBuffer);
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
  props: GPUTableModelProps
): GPUTableModelConstructorState {
  const {table, tableCount = 'instance', ...modelProps} = props;
  const explicitAttributes = modelProps.attributes || {};
  const explicitBindings = modelProps.bindings || {};
  const explicitBufferLayout = modelProps.bufferLayout || [];
  const explicitIndexBuffer = modelProps.indexBuffer ?? null;
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
        explicitBufferLayout,
        explicitIndexBuffer,
        explicitVertexCount,
        inferInstanceCount,
        inferVertexCount
      }
    };
  }

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
  assertNoDuplicateNames(Object.keys(explicitBindings), Object.keys(table.bindings), 'binding');
  assertNoExplicitIndexBuffer(table, explicitIndexBuffer);
  validateGPUTableIndexBatches(table);

  return {
    table,
    state: {
      explicitAttributes,
      explicitBindings,
      explicitBufferLayout,
      explicitIndexBuffer,
      explicitVertexCount,
      inferInstanceCount,
      inferVertexCount
    },
    modelProps: {
      ...modelProps,
      bufferLayout: [...explicitBufferLayout, ...table.bufferLayout],
      attributes: {...explicitAttributes, ...table.attributes},
      bindings: {...explicitBindings, ...table.bindings},
      ...(inferInstanceCount ? {instanceCount: table.numRows} : {}),
      ...(inferVertexCount ? {vertexCount: table.numRows} : {})
    }
  };
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
    const batchHasIndices = Boolean(batch.gpuVectors[GPU_TABLE_INDEX_COLUMN_NAME]);
    if (batchHasIndices !== tableHasIndices) {
      throw new Error('GPUTableModel indexed tables require every batch to include indices');
    }
    getGPUTableIndexDrawState(batch);
  }
}

function getGPUTableIndexDrawState(source: GPUTableDrawSource): GPUTableIndexDrawState | null {
  const indexVector = source.gpuVectors[GPU_TABLE_INDEX_COLUMN_NAME];
  if (!indexVector) {
    return null;
  }
  if (source instanceof GPUTable && source.batches.length > 1) {
    return null;
  }
  if (indexVector.format !== 'vertex-list<uint32>') {
    throw new Error('GPUTableModel indices column requires vertex-list<uint32> format');
  }

  const [indexData, ...remainingIndexData] = indexVector.data;
  if (!indexData || remainingIndexData.length > 0) {
    throw new Error('GPUTableModel indices column requires exactly one GPUData chunk');
  }
  const indexBuffer = indexData.buffer;
  const concreteIndexBuffer = getConcreteIndexBuffer(indexBuffer);
  if (!concreteIndexBuffer || !(concreteIndexBuffer.usage & Buffer.INDEX)) {
    throw new Error('GPUTableModel indices column requires Buffer.INDEX usage');
  }
  return {
    indexBuffer,
    indexCount: indexVector.valueLength
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
