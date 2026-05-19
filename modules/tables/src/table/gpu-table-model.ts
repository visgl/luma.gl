// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device, type BufferLayout, type CommandEncoder, type RenderPass} from '@luma.gl/core';
import {Model, type ModelProps} from '@luma.gl/engine';
import {GPUTable} from './gpu-table';

/** Controls which Model draw count mirrors the current GPU table row count. */
export type GPUTableModelCount = 'instance' | 'vertex' | 'none';

/** Props for rendering one GPU table through a luma.gl Model. */
export type GPUTableModelProps = ModelProps & {
  /** GPU table supplying model-ready attributes, bindings, and preserved batches. */
  table?: GPUTable;
  /** Controls whether table rows infer `instanceCount`, `vertexCount`, or neither. */
  tableCount?: GPUTableModelCount;
};

type GPUTableModelState = {
  explicitAttributes: NonNullable<ModelProps['attributes']>;
  explicitBindings: NonNullable<ModelProps['bindings']>;
  explicitBufferLayout: BufferLayout[];
  inferInstanceCount: boolean;
  inferVertexCount: boolean;
};

type GPUTableModelConstructorState = {
  table?: GPUTable;
  modelProps: ModelProps;
  state: GPUTableModelState;
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

  constructor(device: Device, props: GPUTableModelProps) {
    const {table, modelProps, state} = getGPUTableModelConstructorState(props);
    super(device, modelProps);
    this.table = table;
    this.tableState = state;
  }

  /** Replaces the bound GPU table when one is supplied. */
  setProps(props: Partial<GPUTableModelProps>): void {
    if (props.table) {
      this.setTable(props.table);
    }
  }

  /** Query redraw status after synchronizing inferred table row counts. */
  override needsRedraw(): false | string {
    this.syncTableCount();
    return super.needsRedraw();
  }

  /** Synchronizes inferred table row counts before opening a render pass. */
  override predraw(commandEncoder: CommandEncoder): void {
    this.syncTableCount();
    super.predraw(commandEncoder);
  }

  /**
   * Draws each preserved GPU record batch by rebinding batch-local buffers.
   *
   * The table-level attributes and bindings are restored before returning.
   */
  drawBatches(renderPass: RenderPass): boolean {
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
      for (const batch of table.batches) {
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
        this.setTableRowCount(batch.numRows);
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
      this.setTableRowCount(table.numRows);
    }

    return drawSuccess;
  }

  /** Rebinds the model to a replacement table while preserving explicit model state. */
  protected setTable(nextTable: GPUTable): void {
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
    this.setTableRowCount(nextTable.numRows);
    this.table = nextTable;
  }

  /** Disables table-backed count synchronization without disturbing current model buffers. */
  protected clearTable(): void {
    this.table = undefined;
  }

  private syncTableCount(): void {
    if (!this.table || this.drawingTableBatches) {
      return;
    }
    if (this.tableState.inferInstanceCount && this.instanceCount !== this.table.numRows) {
      this.setTableRowCount(this.table.numRows);
    }
    if (this.tableState.inferVertexCount && this.vertexCount !== this.table.numRows) {
      this.setTableRowCount(this.table.numRows);
    }
  }

  private setTableRowCount(rowCount: number): void {
    if (this.tableState.inferInstanceCount) {
      this.setInstanceCount(rowCount);
    }
    if (this.tableState.inferVertexCount) {
      this.setVertexCount(rowCount);
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

  return {
    table,
    state: {
      explicitAttributes,
      explicitBindings,
      explicitBufferLayout,
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
