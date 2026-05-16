// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {type BufferLayout, Device, type RenderPassProps, type ShaderLayout} from '@luma.gl/core';
import {BufferTransform, type BufferTransformProps} from '@luma.gl/engine';
import * as arrow from 'apache-arrow';
import type {ArrowVertexFormatOptions} from './arrow-shader-layout';
import type {GPUVectorProps} from './arrow-gpu-vector';
import {GPURecordBatch} from './arrow-gpu-record-batch';
import {GPUTable, type GPUTableProps} from './plain-gpu-table';

type TableTransformBufferMap = NonNullable<Parameters<BufferTransform['run']>[0]>['outputBuffers'];

/** Options supplied for one {@link TableTransform.runBatches} dispatch. */
export type TableTransformBatchOptions = RenderPassProps & {
  /** Output transform-feedback buffers for the current batch. */
  outputBuffers?:
    | TableTransformBufferMap
    | ((batch: GPURecordBatch, batchIndex: number) => TableTransformBufferMap);
};

/** Props for creating a WebGL transform backed by a GPU-resident Arrow table. */
export type TableTransformProps = BufferTransformProps &
  ArrowVertexFormatOptions & {
    /** Existing GPU table used as the source for transform input buffers. */
    table?: GPUTable;
    /** Arrow table convenience input converted into a {@link GPUTable}. */
    arrowTable?: arrow.Table;
    /** Maps shader attribute names to Arrow column paths. Defaults to using attribute names. */
    arrowPaths?: Record<string, string>;
    /** Buffer props applied when `arrowTable` is materialized into GPU vectors. */
    arrowBufferProps?: GPUVectorProps;
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
  private readonly ownsTable: boolean;
  private readonly explicitAttributes: NonNullable<BufferTransformProps['attributes']>;
  private readonly explicitBufferLayout: BufferLayout[];
  private readonly inferVertexCount: boolean;
  private tableTransformDestroyed = false;

  constructor(device: Device, props: TableTransformProps) {
    const {
      table,
      ownsTable,
      transformProps,
      explicitAttributes,
      explicitBufferLayout,
      inferVertexCount
    } = getTableTransformState(device, props);

    try {
      super(device, transformProps);
    } catch (error) {
      if (ownsTable) {
        table.destroy();
      }
      throw error;
    }

    this.table = table;
    this.ownsTable = ownsTable;
    this.explicitAttributes = explicitAttributes;
    this.explicitBufferLayout = explicitBufferLayout;
    this.inferVertexCount = inferVertexCount;
  }

  /** Runs the transform once per preserved GPU record batch. */
  runBatches(options: TableTransformBatchOptions = {}): void {
    assertMatchingBufferLayouts(
      this.table.bufferLayout,
      this.explicitBufferLayout,
      this.model.bufferLayout,
      'TableTransform.runBatches() model buffer layout does not match its GPU table'
    );

    try {
      this.table.batches.forEach((batch, batchIndex) => {
        assertMatchingBufferLayouts(
          this.table.bufferLayout,
          [],
          batch.bufferLayout,
          'TableTransform.runBatches() requires every GPU batch to use the table buffer layout'
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
        super.run({...renderPassProps, outputBuffers});
      });
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
    if (this.ownsTable) {
      this.table.destroy();
    }
    this.tableTransformDestroyed = true;
  }
}

function getTableTransformState(device: Device, props: TableTransformProps): TableTransformState {
  const {
    table: explicitTable,
    arrowTable,
    arrowPaths,
    arrowBufferProps,
    tableCount = 'vertex',
    allowWebGLOnlyFormats,
    ...transformProps
  } = props;

  validateTableTransformSources({table: explicitTable, arrowTable});
  if (!transformProps.shaderLayout) {
    throw new Error('TableTransform requires shaderLayout');
  }

  const {table, ownsTable} = getInitialTable({
    device,
    table: explicitTable,
    arrowTable,
    shaderLayout: transformProps.shaderLayout,
    arrowPaths,
    arrowBufferProps,
    allowWebGLOnlyFormats
  });

  const explicitAttributes = transformProps.attributes || {};
  const explicitBufferLayout = transformProps.bufferLayout || [];
  const inferVertexCount = tableCount === 'vertex' && transformProps.vertexCount === undefined;

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
  } catch (error) {
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
    transformProps: {
      ...transformProps,
      attributes: {...explicitAttributes, ...table.attributes},
      bufferLayout: [...explicitBufferLayout, ...table.bufferLayout],
      ...(inferVertexCount ? {vertexCount: table.numRows} : {})
    }
  };
}

function getInitialTable(props: {
  device: Device;
  table?: GPUTable;
  arrowTable?: arrow.Table;
  shaderLayout: ShaderLayout;
  arrowPaths?: Record<string, string>;
  arrowBufferProps?: GPUVectorProps;
  allowWebGLOnlyFormats?: boolean;
}): {table: GPUTable; ownsTable: boolean} {
  if (props.table) {
    return {table: props.table, ownsTable: false};
  }

  return {
    table: new GPUTable(props.device, props.arrowTable!, {
      shaderLayout: props.shaderLayout,
      arrowPaths: props.arrowPaths,
      bufferProps: props.arrowBufferProps,
      allowWebGLOnlyFormats: props.allowWebGLOnlyFormats
    } satisfies GPUTableProps),
    ownsTable: true
  };
}

function validateTableTransformSources(props: {table?: GPUTable; arrowTable?: arrow.Table}): void {
  const sourceCount = Number(Boolean(props.table)) + Number(Boolean(props.arrowTable));
  if (sourceCount > 1) {
    throw new Error('TableTransform requires only one of table or arrowTable');
  }
  if (sourceCount === 0) {
    throw new Error('TableTransform requires table or arrowTable');
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
