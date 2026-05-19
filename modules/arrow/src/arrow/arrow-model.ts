// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device, type RenderPass, type ShaderLayout} from '@luma.gl/core';
import type {ModelProps} from '@luma.gl/engine';
import {
  GPUTable,
  GPUTableModel,
  type GPUTableModelProps,
  type GPUVectorProps
} from '@luma.gl/tables';
import * as arrow from 'apache-arrow';
import {type ArrowVertexFormatOptions} from './arrow-shader-layout';
import {ArrowTableGeometry, type ArrowTableGeometryProps} from './arrow-geometry';
import type {ArrowMeshTable} from './arrow-mesh-types';
import {makeArrowGPUTable} from './arrow-gpu-table-adapters';

/** GPU table source accepted by ArrowModel. */
export type ArrowModelGPUTable = GPUTable;

/** Props for creating a Model whose attributes are derived from an Arrow table. */
export type ArrowModelProps = ModelProps &
  ArrowVertexFormatOptions & {
    /**
     * Mesh Arrow table used as the construction source for GPU geometry buffers.
     *
     * Mesh input is converted through {@link ArrowTableGeometry}. It is mutually
     * exclusive with `arrowTable`, `arrowGPUTable`, and `geometry`.
     */
    arrowMesh?: ArrowMeshTable | arrow.Table;
    /** Options applied when converting Mesh Arrow input into GPU geometry. */
    arrowMeshOptions?: Omit<ArrowTableGeometryProps, 'arrowMesh'>;
    /** Arrow table used as the construction source for GPU attribute buffers. */
    arrowTable?: arrow.Table;
    /** Existing non-streaming GPU table used as the source for model attributes. */
    arrowGPUTable?: GPUTable;
    /** Maps shader attribute names to Arrow column paths. Defaults to using attribute names. */
    arrowPaths?: Record<string, string>;
    /** Buffer props applied to each Arrow-derived GPU vector. */
    arrowBufferProps?: GPUVectorProps;
    /** Controls whether row count is assigned to instanceCount, vertexCount, or neither. */
    arrowCount?: 'instance' | 'vertex' | 'none';
  };

type ArrowModelState = {
  arrowGPUTable?: ArrowModelGPUTable;
  ownsArrowGPUTable: boolean;
  arrowGeometry?: ArrowTableGeometry;
  modelProps: GPUTableModelProps;
  arrowState: ArrowModelArrowState;
};

type ArrowModelArrowState = {
  shaderLayout: ShaderLayout;
  arrowPaths?: Record<string, string>;
  arrowMeshOptions?: Omit<ArrowTableGeometryProps, 'arrowMesh'>;
  arrowBufferProps?: GPUVectorProps;
  arrowCount: 'instance' | 'vertex' | 'none';
  allowWebGLOnlyFormats?: boolean;
};

/** A luma.gl Model with GPU attributes backed by Arrow table columns. */
export class ArrowModel extends GPUTableModel {
  /** GPU representation of the currently active Arrow table attributes. */
  arrowGPUTable?: ArrowModelGPUTable;
  /** GPU representation of the currently active Mesh Arrow geometry. */
  arrowGeometry?: ArrowTableGeometry;
  private arrowState: ArrowModelArrowState;
  private ownsArrowGPUTable: boolean;
  private arrowModelDestroyed = false;

  constructor(device: Device, props: ArrowModelProps) {
    const {arrowGPUTable, ownsArrowGPUTable, arrowGeometry, modelProps, arrowState} =
      getArrowModelState(device, props);
    try {
      super(device, modelProps);
    } catch (error) {
      if (ownsArrowGPUTable) {
        arrowGPUTable?.destroy();
      }
      arrowGeometry?.destroy();
      throw error;
    }
    this.arrowGPUTable = arrowGPUTable;
    this.arrowGeometry = arrowGeometry;
    this.ownsArrowGPUTable = ownsArrowGPUTable;
    this.arrowState = arrowState;
  }

  /** Updates the model when a replacement Arrow table is supplied. */
  override setProps(props: Partial<ArrowModelProps>): void {
    if (props.arrowMesh) {
      this.setArrowMesh(props.arrowMesh, props.arrowMeshOptions);
    }
    if (props.arrowTable) {
      this.setArrowTable(props.arrowTable);
    }
    if (props.arrowGPUTable) {
      this.setArrowGPUTable(props.arrowGPUTable, false);
    }
  }

  /**
   * Draws each preserved Arrow GPU record batch through the model's existing pipeline.
   *
   * Batch drawing reuses the current buffer layout and only swaps batch attribute buffers
   * plus inferred Arrow row counts between draw calls.
   */
  override drawBatches(renderPass: RenderPass): boolean {
    if (!(this.arrowGPUTable instanceof GPUTable)) {
      throw new Error('ArrowModel.drawBatches() requires a GPUTable');
    }
    return super.drawBatches(renderPass);
  }

  override destroy(): void {
    if (!this.arrowModelDestroyed) {
      super.destroy();
      if (this.ownsArrowGPUTable) {
        this.arrowGPUTable?.destroy();
      }
      this.arrowModelDestroyed = true;
    }
  }

  private setArrowMesh(
    arrowMesh: ArrowMeshTable | arrow.Table,
    arrowMeshOptions?: Omit<ArrowTableGeometryProps, 'arrowMesh'>
  ): void {
    const arrowGeometry = new ArrowTableGeometry(this.device, {
      arrowMesh,
      ...this.arrowState.arrowMeshOptions,
      ...arrowMeshOptions
    });

    try {
      this.setGeometry(arrowGeometry);
    } catch (error) {
      arrowGeometry.destroy();
      throw error;
    }

    if (this.ownsArrowGPUTable) {
      this.arrowGPUTable?.destroy();
    }
    this.arrowGPUTable = undefined;
    this.arrowGeometry = arrowGeometry;
    this.ownsArrowGPUTable = false;
    this.clearTable();
  }

  private setArrowTable(arrowTable: arrow.Table): void {
    const nextArrowGPUTable = makeArrowGPUTable(this.device, arrowTable, {
      shaderLayout: this.arrowState.shaderLayout,
      arrowPaths: this.arrowState.arrowPaths,
      bufferProps: this.arrowState.arrowBufferProps,
      allowWebGLOnlyFormats: this.arrowState.allowWebGLOnlyFormats
    });

    this.setArrowGPUTable(nextArrowGPUTable, true);
  }

  private setArrowGPUTable(
    nextArrowGPUTable: ArrowModelGPUTable,
    ownsNextArrowGPUTable: boolean
  ): void {
    try {
      this.setTable(nextArrowGPUTable);
    } catch (error) {
      if (ownsNextArrowGPUTable) {
        nextArrowGPUTable.destroy();
      }
      throw error;
    }

    const previousArrowGPUTable = this.arrowGPUTable;
    const ownsPreviousArrowGPUTable = this.ownsArrowGPUTable;
    this.arrowGPUTable = nextArrowGPUTable;
    this.ownsArrowGPUTable = ownsNextArrowGPUTable;
    if (ownsPreviousArrowGPUTable) {
      previousArrowGPUTable?.destroy();
    }
  }
}

function getArrowModelState(device: Device, props: ArrowModelProps): ArrowModelState {
  const {
    arrowMesh,
    arrowMeshOptions,
    arrowTable,
    arrowGPUTable: explicitArrowGPUTable,
    arrowPaths,
    arrowBufferProps,
    arrowCount = 'instance',
    allowWebGLOnlyFormats,
    ...modelProps
  } = props;

  validateArrowModelSources({
    arrowMesh,
    arrowTable,
    arrowGPUTable: explicitArrowGPUTable
  });

  if (!modelProps.shaderLayout) {
    throw new Error('ArrowModel requires shaderLayout');
  }
  if (arrowMesh && modelProps.geometry) {
    throw new Error('ArrowModel requires only one of arrowMesh or geometry');
  }

  if (arrowMesh) {
    const arrowGeometry = new ArrowTableGeometry(device, {arrowMesh, ...arrowMeshOptions});
    return {
      arrowGPUTable: undefined,
      ownsArrowGPUTable: false,
      arrowGeometry,
      arrowState: {
        shaderLayout: modelProps.shaderLayout,
        arrowPaths,
        arrowMeshOptions,
        arrowBufferProps,
        arrowCount,
        allowWebGLOnlyFormats
      },
      modelProps: {
        ...modelProps,
        geometry: arrowGeometry
      }
    };
  }

  const {arrowGPUTable, ownsArrowGPUTable} = getInitialArrowGPUTable({
    device,
    arrowTable,
    arrowGPUTable: explicitArrowGPUTable,
    shaderLayout: modelProps.shaderLayout,
    arrowPaths,
    arrowBufferProps,
    allowWebGLOnlyFormats
  });

  return {
    arrowGPUTable,
    ownsArrowGPUTable,
    arrowGeometry: undefined,
    arrowState: {
      shaderLayout: modelProps.shaderLayout,
      arrowPaths,
      arrowMeshOptions,
      arrowBufferProps,
      arrowCount,
      allowWebGLOnlyFormats
    },
    modelProps: {
      ...modelProps,
      table: arrowGPUTable,
      tableCount: arrowCount
    }
  };
}

function getInitialArrowGPUTable(props: {
  device: Device;
  arrowTable?: arrow.Table;
  arrowGPUTable?: GPUTable;
  shaderLayout: ShaderLayout;
  arrowPaths?: Record<string, string>;
  arrowBufferProps?: GPUVectorProps;
  allowWebGLOnlyFormats?: boolean;
}): {arrowGPUTable: ArrowModelGPUTable; ownsArrowGPUTable: boolean} {
  if (props.arrowGPUTable) {
    return {arrowGPUTable: props.arrowGPUTable, ownsArrowGPUTable: false};
  }

  return {
    arrowGPUTable: makeArrowGPUTable(props.device, props.arrowTable!, {
      shaderLayout: props.shaderLayout,
      arrowPaths: props.arrowPaths,
      bufferProps: props.arrowBufferProps,
      allowWebGLOnlyFormats: props.allowWebGLOnlyFormats
    }),
    ownsArrowGPUTable: true
  };
}

function validateArrowModelSources(props: {
  arrowMesh?: ArrowMeshTable | arrow.Table;
  arrowTable?: arrow.Table;
  arrowGPUTable?: GPUTable;
}): void {
  const sourceCount =
    Number(Boolean(props.arrowMesh)) +
    Number(Boolean(props.arrowTable)) +
    Number(Boolean(props.arrowGPUTable));
  if (sourceCount > 1) {
    throw new Error('ArrowModel requires only one of arrowMesh, arrowTable, or arrowGPUTable');
  }
  if (sourceCount === 0) {
    throw new Error('ArrowModel requires arrowMesh, arrowTable, or arrowGPUTable');
  }
}
