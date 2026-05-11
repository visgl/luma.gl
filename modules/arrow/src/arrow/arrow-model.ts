// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device, type BufferLayout, type ShaderLayout} from '@luma.gl/core';
import {Model, type ModelProps} from '@luma.gl/engine';
import * as arrow from 'apache-arrow';
import {type ArrowVertexFormatOptions} from './arrow-shader-layout';
import {ArrowGPUTable, type ArrowGPUTableProps} from './plain-gpu-table';
import type {ArrowGPUVectorProps} from './arrow-gpu-vector';

/** Props for creating a Model whose attributes are derived from an Arrow table. */
export type ArrowModelProps = ModelProps &
  ArrowVertexFormatOptions & {
    /** Arrow table used as the construction source for GPU attribute buffers. */
    arrowTable: arrow.Table;
    /** Maps shader attribute names to Arrow column paths. Defaults to using attribute names. */
    arrowPaths?: Record<string, string>;
    /** Buffer props applied to each Arrow-derived GPU vector. */
    arrowBufferProps?: ArrowGPUVectorProps;
    /** Controls whether row count is assigned to instanceCount, vertexCount, or neither. */
    arrowCount?: 'instance' | 'vertex' | 'none';
  };

type ArrowModelState = {
  arrowGPUTable: ArrowGPUTable;
  modelProps: ModelProps;
  arrowState: ArrowModelArrowState;
};

type ArrowModelExplicitAttributes = NonNullable<ModelProps['attributes']>;

type ArrowModelArrowState = {
  shaderLayout: ShaderLayout;
  arrowPaths?: Record<string, string>;
  arrowBufferProps?: ArrowGPUVectorProps;
  arrowCount: 'instance' | 'vertex' | 'none';
  allowWebGLOnlyFormats?: boolean;
  explicitAttributes: ArrowModelExplicitAttributes;
  explicitBufferLayout: BufferLayout[];
  inferInstanceCount: boolean;
  inferVertexCount: boolean;
};

/** A luma.gl Model with GPU attributes backed by Arrow table columns. */
export class ArrowModel extends Model {
  /** GPU representation of the currently active Arrow table attributes. */
  arrowGPUTable: ArrowGPUTable;
  private arrowState: ArrowModelArrowState;
  private arrowModelDestroyed = false;

  constructor(device: Device, props: ArrowModelProps) {
    const {arrowGPUTable, modelProps, arrowState} = getArrowModelState(device, props);
    try {
      super(device, modelProps);
    } catch (error) {
      arrowGPUTable.destroy();
      throw error;
    }
    this.arrowGPUTable = arrowGPUTable;
    this.arrowState = arrowState;
  }

  /** Updates the model when a replacement Arrow table is supplied. */
  setProps(props: Partial<ArrowModelProps>): void {
    if (props.arrowTable) {
      this.setArrowTable(props.arrowTable);
    }
  }

  override destroy(): void {
    if (!this.arrowModelDestroyed) {
      super.destroy();
      this.arrowGPUTable.destroy();
      this.arrowModelDestroyed = true;
    }
  }

  private setArrowTable(arrowTable: arrow.Table): void {
    const nextArrowGPUTable = new ArrowGPUTable(this.device, arrowTable, {
      shaderLayout: this.arrowState.shaderLayout,
      arrowPaths: this.arrowState.arrowPaths,
      bufferProps: this.arrowState.arrowBufferProps,
      allowWebGLOnlyFormats: this.arrowState.allowWebGLOnlyFormats
    });

    try {
      assertNoDuplicateNames(
        Object.keys(this.arrowState.explicitAttributes),
        Object.keys(nextArrowGPUTable.attributes),
        'attribute'
      );
      assertNoDuplicateNames(
        getBufferLayoutNames(this.arrowState.explicitBufferLayout),
        getBufferLayoutNames(nextArrowGPUTable.bufferLayout),
        'buffer layout'
      );

      this.setBufferLayout([
        ...this.arrowState.explicitBufferLayout,
        ...nextArrowGPUTable.bufferLayout
      ]);
      this.setAttributes({
        ...this.arrowState.explicitAttributes,
        ...nextArrowGPUTable.attributes
      });

      if (this.arrowState.inferInstanceCount) {
        this.setInstanceCount(nextArrowGPUTable.numRows);
      }
      if (this.arrowState.inferVertexCount) {
        this.setVertexCount(nextArrowGPUTable.numRows);
      }
    } catch (error) {
      nextArrowGPUTable.destroy();
      throw error;
    }

    const previousArrowGPUTable = this.arrowGPUTable;
    this.arrowGPUTable = nextArrowGPUTable;
    previousArrowGPUTable.destroy();
  }
}

function getArrowModelState(device: Device, props: ArrowModelProps): ArrowModelState {
  const {
    arrowTable,
    arrowPaths,
    arrowBufferProps,
    arrowCount = 'instance',
    allowWebGLOnlyFormats,
    ...modelProps
  } = props;

  if (!modelProps.shaderLayout) {
    throw new Error('ArrowModel requires shaderLayout');
  }

  const explicitAttributes = modelProps.attributes || {};
  const explicitBufferLayout = modelProps.bufferLayout || [];
  const inferInstanceCount = arrowCount === 'instance' && modelProps.instanceCount === undefined;
  const inferVertexCount = arrowCount === 'vertex' && modelProps.vertexCount === undefined;

  const arrowGPUTable = new ArrowGPUTable(device, arrowTable, {
    shaderLayout: modelProps.shaderLayout,
    arrowPaths,
    bufferProps: arrowBufferProps,
    allowWebGLOnlyFormats
  } satisfies ArrowGPUTableProps);

  try {
    assertNoDuplicateNames(
      Object.keys(explicitAttributes),
      Object.keys(arrowGPUTable.attributes),
      'attribute'
    );
    assertNoDuplicateNames(
      getBufferLayoutNames(explicitBufferLayout),
      getBufferLayoutNames(arrowGPUTable.bufferLayout),
      'buffer layout'
    );
  } catch (error) {
    arrowGPUTable.destroy();
    throw error;
  }

  return {
    arrowGPUTable,
    arrowState: {
      shaderLayout: modelProps.shaderLayout,
      arrowPaths,
      arrowBufferProps,
      arrowCount,
      allowWebGLOnlyFormats,
      explicitAttributes,
      explicitBufferLayout,
      inferInstanceCount,
      inferVertexCount
    },
    modelProps: {
      ...modelProps,
      bufferLayout: [...explicitBufferLayout, ...arrowGPUTable.bufferLayout],
      attributes: {...explicitAttributes, ...arrowGPUTable.attributes},
      ...(inferInstanceCount ? {instanceCount: arrowGPUTable.numRows} : {}),
      ...(inferVertexCount ? {vertexCount: arrowGPUTable.numRows} : {})
    }
  };
}

function getBufferLayoutNames(bufferLayout: BufferLayout[]): string[] {
  return bufferLayout.map(layout => layout.name);
}

function assertNoDuplicateNames(
  explicitNames: string[],
  arrowNames: string[],
  nameType: string
): void {
  const explicitNameSet = new Set(explicitNames);
  for (const arrowName of arrowNames) {
    if (explicitNameSet.has(arrowName)) {
      throw new Error(`ArrowModel ${nameType} "${arrowName}" duplicates an explicit ${nameType}`);
    }
  }
}
