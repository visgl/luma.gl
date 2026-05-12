// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device, type BufferLayout, type CommandEncoder, type ShaderLayout} from '@luma.gl/core';
import {Model, type ModelProps} from '@luma.gl/engine';
import * as arrow from 'apache-arrow';
import {type ArrowVertexFormatOptions} from './arrow-shader-layout';
import {ArrowGPUTable, type ArrowGPUTableProps} from './plain-gpu-table';
import {StreamingArrowGPUTable} from './streaming-arrow-gpu-table';
import type {ArrowGPUVectorProps} from './arrow-gpu-vector';
import {ArrowGeometry, type ArrowGeometryProps} from './arrow-geometry';
import type {ArrowMeshTable} from './arrow-mesh-types';

/** GPU table source accepted by ArrowModel. */
export type ArrowModelGPUTable = ArrowGPUTable | StreamingArrowGPUTable;

/** Props for creating a Model whose attributes are derived from an Arrow table. */
export type ArrowModelProps = ModelProps &
  ArrowVertexFormatOptions & {
    /**
     * Mesh Arrow table used as the construction source for GPU geometry buffers.
     *
     * Mesh input is converted through {@link ArrowGeometry}. It is mutually
     * exclusive with `arrowTable`, `streamingArrowGPUTable`, and `geometry`.
     */
    arrowMesh?: ArrowMeshTable | arrow.Table;
    /** Options applied when converting Mesh Arrow input into GPU geometry. */
    arrowMeshOptions?: Omit<ArrowGeometryProps, 'arrowMesh'>;
    /** Arrow table used as the construction source for GPU attribute buffers. */
    arrowTable?: arrow.Table;
    /** Existing streaming GPU table used as the source for model attributes. */
    streamingArrowGPUTable?: StreamingArrowGPUTable;
    /** Maps shader attribute names to Arrow column paths. Defaults to using attribute names. */
    arrowPaths?: Record<string, string>;
    /** Buffer props applied to each Arrow-derived GPU vector. */
    arrowBufferProps?: ArrowGPUVectorProps;
    /** Controls whether row count is assigned to instanceCount, vertexCount, or neither. */
    arrowCount?: 'instance' | 'vertex' | 'none';
  };

type ArrowModelState = {
  arrowGPUTable?: ArrowModelGPUTable;
  ownsArrowGPUTable: boolean;
  arrowGeometry?: ArrowGeometry;
  modelProps: ModelProps;
  arrowState: ArrowModelArrowState;
};

type ArrowModelExplicitAttributes = NonNullable<ModelProps['attributes']>;

type ArrowModelArrowState = {
  shaderLayout: ShaderLayout;
  arrowPaths?: Record<string, string>;
  arrowMeshOptions?: Omit<ArrowGeometryProps, 'arrowMesh'>;
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
  arrowGPUTable?: ArrowModelGPUTable;
  /** GPU representation of the currently active Mesh Arrow geometry. */
  arrowGeometry?: ArrowGeometry;
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
  setProps(props: Partial<ArrowModelProps>): void {
    if (props.arrowMesh) {
      this.setArrowMesh(props.arrowMesh, props.arrowMeshOptions);
    }
    if (props.arrowTable) {
      this.setArrowTable(props.arrowTable);
    }
    if (props.streamingArrowGPUTable) {
      this.setArrowGPUTable(props.streamingArrowGPUTable, false);
    }
  }

  /** Query redraw status. Clears the status. */
  override needsRedraw(): false | string {
    this.syncArrowGPUTableCount();
    return super.needsRedraw();
  }

  /** Updates uniforms, dynamic buffers, and inferred Arrow counts before opening a render pass. */
  override predraw(commandEncoder: CommandEncoder): void {
    this.syncArrowGPUTableCount();
    super.predraw(commandEncoder);
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
    arrowMeshOptions?: Omit<ArrowGeometryProps, 'arrowMesh'>
  ): void {
    const arrowGeometry = new ArrowGeometry(this.device, {
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
  }

  private setArrowTable(arrowTable: arrow.Table): void {
    const nextArrowGPUTable = new ArrowGPUTable(this.device, arrowTable, {
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

  private syncArrowGPUTableCount(): void {
    if (!this.arrowGPUTable) {
      return;
    }
    if (this.arrowState.inferInstanceCount && this.instanceCount !== this.arrowGPUTable.numRows) {
      this.setInstanceCount(this.arrowGPUTable.numRows);
    }
    if (this.arrowState.inferVertexCount && this.vertexCount !== this.arrowGPUTable.numRows) {
      this.setVertexCount(this.arrowGPUTable.numRows);
    }
  }
}

function getArrowModelState(device: Device, props: ArrowModelProps): ArrowModelState {
  const {
    arrowMesh,
    arrowMeshOptions,
    arrowTable,
    streamingArrowGPUTable,
    arrowPaths,
    arrowBufferProps,
    arrowCount = 'instance',
    allowWebGLOnlyFormats,
    ...modelProps
  } = props;

  validateArrowModelSources({arrowMesh, arrowTable, streamingArrowGPUTable});

  if (!modelProps.shaderLayout) {
    throw new Error('ArrowModel requires shaderLayout');
  }
  if (arrowMesh && modelProps.geometry) {
    throw new Error('ArrowModel requires only one of arrowMesh or geometry');
  }

  const explicitAttributes = modelProps.attributes || {};
  const explicitBufferLayout = modelProps.bufferLayout || [];
  const inferInstanceCount =
    !arrowMesh && arrowCount === 'instance' && modelProps.instanceCount === undefined;
  const inferVertexCount =
    !arrowMesh && arrowCount === 'vertex' && modelProps.vertexCount === undefined;

  if (arrowMesh) {
    const arrowGeometry = new ArrowGeometry(device, {arrowMesh, ...arrowMeshOptions});
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
        allowWebGLOnlyFormats,
        explicitAttributes,
        explicitBufferLayout,
        inferInstanceCount,
        inferVertexCount
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
    streamingArrowGPUTable,
    shaderLayout: modelProps.shaderLayout,
    arrowPaths,
    arrowBufferProps,
    allowWebGLOnlyFormats
  });

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
    ownsArrowGPUTable,
    arrowGeometry: undefined,
    arrowState: {
      shaderLayout: modelProps.shaderLayout,
      arrowPaths,
      arrowMeshOptions,
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

function getInitialArrowGPUTable(props: {
  device: Device;
  arrowTable?: arrow.Table;
  streamingArrowGPUTable?: StreamingArrowGPUTable;
  shaderLayout: ShaderLayout;
  arrowPaths?: Record<string, string>;
  arrowBufferProps?: ArrowGPUVectorProps;
  allowWebGLOnlyFormats?: boolean;
}): {arrowGPUTable: ArrowModelGPUTable; ownsArrowGPUTable: boolean} {
  if (props.streamingArrowGPUTable) {
    return {arrowGPUTable: props.streamingArrowGPUTable, ownsArrowGPUTable: false};
  }

  return {
    arrowGPUTable: new ArrowGPUTable(props.device, props.arrowTable!, {
      shaderLayout: props.shaderLayout,
      arrowPaths: props.arrowPaths,
      bufferProps: props.arrowBufferProps,
      allowWebGLOnlyFormats: props.allowWebGLOnlyFormats
    } satisfies ArrowGPUTableProps),
    ownsArrowGPUTable: true
  };
}

function validateArrowModelSources(props: {
  arrowMesh?: ArrowMeshTable | arrow.Table;
  arrowTable?: arrow.Table;
  streamingArrowGPUTable?: StreamingArrowGPUTable;
}): void {
  const sourceCount =
    Number(Boolean(props.arrowMesh)) +
    Number(Boolean(props.arrowTable)) +
    Number(Boolean(props.streamingArrowGPUTable));
  if (sourceCount > 1) {
    throw new Error(
      'ArrowModel requires only one of arrowMesh, arrowTable, or streamingArrowGPUTable'
    );
  }
  if (sourceCount === 0) {
    throw new Error('ArrowModel requires arrowMesh, arrowTable or streamingArrowGPUTable');
  }
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
