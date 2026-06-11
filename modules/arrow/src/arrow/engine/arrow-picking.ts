// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device, RenderPass} from '@luma.gl/core';
import {
  indexPicking,
  getIndexPickingModule,
  PickingManager,
  supportsIndexPicking,
  type PickInfo,
  type PickingManagerProps,
  type PickingShouldPickOptions,
  type ShaderInputs
} from '@luma.gl/engine';
import type {GPURecordBatchSourceInfo, GPUTable, GPUVector} from '@luma.gl/tables';
import {BufferType, Data, Uint32, Vector} from 'apache-arrow';
import {makeGPUVectorFromArrow} from '../gpu/arrow-gpu-table-adapters';

/** Arrow row identity resolved from a picking pass. */
export type ArrowPickingInfo = {
  /** Zero-based source batch index, or `null` when nothing is picked. */
  batchIndex: number | null;
  /** Zero-based source row index, or `null` when nothing is picked. */
  rowIndex: number | null;
  /** Zero-based row index inside the picked source batch, or `null` when unavailable. */
  batchRowIndex: number | null;
};

/** Options for creating a source-row index vector. */
export type ArrowRowIndexVectorOptions = {
  /** Number of source rows to encode. */
  rowCount: number;
  /** Source row index assigned to local row zero. Defaults to `0`. */
  rowIndexOffset?: number;
};

/** Options for creating a source-row index GPU vector. */
export type ArrowRowIndexGPUVectorOptions = ArrowRowIndexVectorOptions & {
  /** GPU vector/table column name. Defaults to `rowIndices`. */
  name?: string;
  /** Optional GPU buffer id. */
  id?: string;
};

/** Source metadata used to resolve picked Arrow rows. */
export type ArrowPickingSource =
  | {
      table?: Pick<GPUTable, 'batches'> | null;
      sourceInfos?: readonly (GPURecordBatchSourceInfo | null | undefined)[];
    }
  | Pick<GPUTable, 'batches'>
  | readonly (GPURecordBatchSourceInfo | null | undefined)[];

const NULL_PICK_INFO: PickInfo = {batchIndex: null, objectIndex: null};

/** Returns true when the device can render integer picking attachments. */
export function supportsArrowIndexPicking(device: Device): boolean {
  return supportsIndexPicking(device);
}

/** Returns the object-index picking shader module supported by this device. */
export function getArrowPickingModule(device: Device): typeof indexPicking {
  return getIndexPickingModule(device);
}

/** Returns picking modules for example model construction. */
export function getArrowPickingModules(device: Device): [typeof indexPicking] {
  return [getArrowPickingModule(device)];
}

/** Creates a PickingManager using Arrow examples' default auto backend selection. */
export function createArrowPickingManager(
  device: Device,
  props: PickingManagerProps
): PickingManager {
  return new PickingManager(device, {mode: 'auto', ...props});
}

/** Clears PickingManager state and optionally emits the standard null pick callback. */
export function clearArrowPickingState(
  picker: PickingManager,
  onObjectPicked?: (info: PickInfo) => void
): void {
  const hadPickedObject =
    picker.pickInfo.batchIndex !== null || picker.pickInfo.objectIndex !== null;
  picker.clearPickState();
  picker.pickInfo = NULL_PICK_INFO;
  if (hadPickedObject) {
    onObjectPicked?.(NULL_PICK_INFO);
  }
}

/** Runs a picking render pass and schedules the PickingManager readback/update. */
export function runArrowPickingPass({
  picker,
  mousePosition,
  pickingOptions,
  shaderInputs,
  draw
}: {
  picker: PickingManager;
  mousePosition: number[] | null | undefined;
  pickingOptions?: PickingShouldPickOptions;
  shaderInputs?: ShaderInputs<any>;
  draw: (pickingPass: RenderPass) => boolean | void;
}): boolean {
  if (!picker.shouldPick(mousePosition as [number, number] | null, pickingOptions)) {
    return false;
  }

  const pickingPass = picker.beginRenderPass();
  let shouldUpdatePickInfo = false;
  try {
    shouldUpdatePickInfo = draw(pickingPass) !== false;
  } finally {
    pickingPass.end();
    shaderInputs?.setProps({picking: {isActive: false}});
  }

  if (shouldUpdatePickInfo) {
    void picker.updatePickInfo(mousePosition as [number, number]);
  }
  return shouldUpdatePickInfo;
}

/** Creates a Uint32 Arrow vector containing global source row indices. */
export function makeArrowRowIndexVector({
  rowCount,
  rowIndexOffset = 0
}: ArrowRowIndexVectorOptions): Vector<Uint32> {
  const values = new Uint32Array(rowCount);
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    values[rowIndex] = rowIndexOffset + rowIndex;
  }
  const data = new Data(new Uint32(), 0, values.length, 0, {
    [BufferType.DATA]: values
  }) as unknown as Data<Uint32>;
  return new Vector([data]);
}

/** Creates a GPU vector containing global source row indices. */
export function makeArrowRowIndexGPUVector(
  device: Device,
  {rowCount, rowIndexOffset = 0, name = 'rowIndices', id}: ArrowRowIndexGPUVectorOptions
): GPUVector<'uint32'> {
  return makeGPUVectorFromArrow(device, makeArrowRowIndexVector({rowCount, rowIndexOffset}), {
    name,
    id,
    format: 'uint32'
  });
}

/** Creates source-row metadata for a prepared Arrow GPU batch. */
export function makeArrowRecordBatchSourceInfo({
  sourceBatchIndex = 0,
  sourceRowIndexOffset = 0,
  sourceRowCount
}: {
  sourceBatchIndex?: number;
  sourceRowIndexOffset?: number;
  sourceRowCount: number;
}): GPURecordBatchSourceInfo {
  return {sourceBatchIndex, sourceRowIndexOffset, sourceRowCount};
}

/** Resolves a generic PickingManager result into Arrow source row identity. */
export function resolveArrowPickInfo(
  pickInfo: PickInfo,
  source?: ArrowPickingSource | null
): ArrowPickingInfo {
  if (pickInfo.batchIndex === null || pickInfo.objectIndex === null) {
    return {batchIndex: null, rowIndex: null, batchRowIndex: null};
  }

  const sourceInfo = getArrowPickingSourceInfo(source, pickInfo.batchIndex);
  return {
    batchIndex: sourceInfo?.sourceBatchIndex ?? pickInfo.batchIndex,
    rowIndex: pickInfo.objectIndex,
    batchRowIndex: getArrowBatchRowIndex(pickInfo.objectIndex, sourceInfo)
  };
}

/** Returns the source metadata for a picked render batch, when available. */
export function getArrowPickingSourceInfo(
  source: ArrowPickingSource | null | undefined,
  batchIndex: number
): GPURecordBatchSourceInfo | undefined {
  if (!source) {
    return undefined;
  }
  if (Array.isArray(source)) {
    return source[batchIndex] ?? undefined;
  }
  if ('batches' in source) {
    return source.batches[batchIndex]?.sourceInfo;
  }
  const sourceObject = source as {
    table?: Pick<GPUTable, 'batches'> | null;
    sourceInfos?: readonly (GPURecordBatchSourceInfo | null | undefined)[];
  };
  return (
    sourceObject.sourceInfos?.[batchIndex] ?? sourceObject.table?.batches[batchIndex]?.sourceInfo
  );
}

function getArrowBatchRowIndex(
  rowIndex: number,
  sourceInfo: GPURecordBatchSourceInfo | undefined
): number | null {
  if (!sourceInfo) {
    return null;
  }
  const batchRowIndex = rowIndex - sourceInfo.sourceRowIndexOffset;
  return batchRowIndex >= 0 && batchRowIndex < sourceInfo.sourceRowCount ? batchRowIndex : null;
}
