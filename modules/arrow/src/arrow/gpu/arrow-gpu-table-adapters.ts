// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Device, type BufferLayout, type ShaderLayout} from '@luma.gl/core';
import {GPUData, type GPUVectorBufferProps, type GPUVectorFormat} from '@luma.gl/gpgpu/gpu-data';
import {
  GPURecordBatch,
  GPUTable,
  type GPURecordBatchSourceInfo,
  type GPUField
} from '@luma.gl/graph/gpu-tables';
import {
  Data,
  DataType,
  Field,
  FixedSizeList,
  RecordBatch,
  Table,
  Uint32,
  Vector,
  makeData
} from 'apache-arrow';
import {getArrowFieldByPath, getArrowVectorByPath} from '../arrow-utils/arrow-paths';
import {getArrowBufferLayout, type ArrowVertexFormatOptions} from '../engine/arrow-shader-layout';
import {getArrowFixedSizeListRowValidity} from './arrow-gpu-data';
import {
  isInstanceArrowType,
  isVariableLengthAttributeArrowType,
  type NumericArrowType
} from '../arrow-utils/arrow-types';
import {getArrowMatrixVectorInfo} from '../vectors/arrow-matrix-vector';
import {
  ArrowGPUDataProps,
  getSignedArrowDataType,
  makeGPUDataFromArrowData,
  isArrowUtf8DictionaryType,
  isStorageFixedSizeListArrowType,
  getGPUVectorFormatForArrowType,
  isCanonicalFloat32ArrowMatrixInfo
} from './arrow-gpu-vector-adapters';

/** Caller-selected row-validity storage sibling for one fixed-size-list Arrow column. */
export type ArrowGPUValidityColumn =
  | string
  | {
      /** Name of the uint32 GPU table column that receives nonzero-valid row flags. */
      name: string;
      /** Meaningful leading child coordinates; nullable trailing padding is ignored. */
      dimensions?: number;
    };

/** Props for uploading one Arrow record batch into a generic GPU record batch. */
export type GPURecordBatchFromArrowRecordBatchProps = ArrowVertexFormatOptions & {
  /** Shader layout that selects which Arrow columns should be uploaded. */
  shaderLayout: ShaderLayout;
  /** Maps shader attribute names to Arrow column paths. */
  arrowPaths?: Record<string, string>;
  /** Buffer props applied to Arrow-backed GPU vectors. */
  bufferProps?: GPUVectorBufferProps;
  /** Storage-selected columns that should use fixed-size-list format even for short rows. */
  fixedSizeListColumns?: readonly string[];
  /** Optional source-row identity retained for picking and diagnostics. */
  sourceInfo?: GPURecordBatchSourceInfo;
  /** Explicitly materialized uint32 row-validity siblings keyed by selected column name. */
  validityColumns?: Record<string, ArrowGPUValidityColumn>;
};

/** Props for uploading one Arrow table into a generic GPU table. */
export type GPUTableFromArrowTableProps = ArrowVertexFormatOptions & {
  /** Shader layout that selects which Arrow columns should be uploaded. */
  shaderLayout: ShaderLayout;
  /** Maps shader attribute names to Arrow column paths. */
  arrowPaths?: Record<string, string>;
  /** Buffer props applied to Arrow-backed GPU vectors. */
  bufferProps?: GPUVectorBufferProps;
  /** Storage-selected columns that should use fixed-size-list format even for short rows. */
  fixedSizeListColumns?: readonly string[];
  /** Explicitly materialized uint32 row-validity siblings keyed by selected column name. */
  validityColumns?: Record<string, ArrowGPUValidityColumn>;
};

/** Uploads one Arrow record batch into a generic GPU record batch. */
export function makeGPURecordBatchFromArrowRecordBatch(
  device: Device,
  recordBatch: RecordBatch,
  options: GPURecordBatchFromArrowRecordBatchProps
): GPURecordBatch {
  const table = new Table([recordBatch]);
  const bufferLayout = getArrowBufferLayout(options.shaderLayout, {
    arrowTable: table,
    arrowPaths: options.arrowPaths,
    allowWebGLOnlyFormats: options.allowWebGLOnlyFormats
  });
  const fields: GPUField[] = [];
  const gpuData: Record<string, GPUData> = {};
  const selectedNames = new Set<string>();

  for (const layout of bufferLayout) {
    if (options.fixedSizeListColumns?.includes(layout.name)) {
      throw new Error('Arrow fixed-size-list GPU columns require a storage shader binding');
    }
    const arrowPath = options.arrowPaths?.[layout.name] || layout.name;
    const vector = getArrowVectorByPath(table, arrowPath);
    const sourceField = getArrowFieldByPath(table, arrowPath);
    gpuData[layout.name] = makeGPUDataFromArrowRecordBatchVector(device, vector as Vector, {
      ...options.bufferProps,
      format: layout.format
    });
    fields.push({
      name: layout.name,
      format: gpuData[layout.name].format,
      nullable: sourceField.nullable,
      metadata: new Map(sourceField.metadata)
    });
    selectedNames.add(layout.name);
  }

  for (const storageBinding of getArrowStorageBindings(options.shaderLayout)) {
    if (selectedNames.has(storageBinding.name)) {
      throw new Error(
        `GPURecordBatch shader input "${storageBinding.name}" cannot be both an attribute and a storage binding`
      );
    }
    const arrowPath = options.arrowPaths?.[storageBinding.name] || storageBinding.name;
    const vector = tryGetArrowVectorByPath(table, arrowPath);
    const sourceField = tryGetArrowFieldByPath(table, arrowPath);
    if (!vector || !sourceField) {
      continue;
    }
    gpuData[storageBinding.name] = makeGPUDataFromArrowRecordBatchVector(device, vector as Vector, {
      ...options.bufferProps,
      ...(options.fixedSizeListColumns?.includes(storageBinding.name)
        ? {format: getFixedSizeListGPUVectorFormatForArrowType(vector.type)}
        : {})
    });
    fields.push({
      name: storageBinding.name,
      format: gpuData[storageBinding.name].format,
      nullable: sourceField.nullable,
      metadata: new Map(sourceField.metadata)
    });
    selectedNames.add(storageBinding.name);
  }

  for (const columnName of options.fixedSizeListColumns ?? []) {
    if (!selectedNames.has(columnName)) {
      throw new Error('Arrow fixed-size-list GPU columns require a selected storage binding');
    }
  }

  for (const [sourceName, validityColumn] of Object.entries(options.validityColumns ?? {})) {
    const validityName = typeof validityColumn === 'string' ? validityColumn : validityColumn.name;
    if (!selectedNames.has(sourceName) || selectedNames.has(validityName)) {
      throw new Error('Arrow GPU validity columns require a selected source and unique output');
    }
    const arrowPath = options.arrowPaths?.[sourceName] || sourceName;
    const vector = getArrowVectorByPath(table, arrowPath);
    if (!DataType.isFixedSizeList(vector.type)) {
      throw new Error('Arrow GPU validity columns require FixedSizeList source data');
    }
    const dimensions =
      typeof validityColumn === 'string'
        ? vector.type.listSize
        : (validityColumn.dimensions ?? vector.type.listSize);
    const [data, ...remainingData] = vector.data;
    if (!data || remainingData.length > 0) {
      throw new Error('Arrow RecordBatch columns require exactly one Arrow Data chunk');
    }
    const validity =
      getArrowFixedSizeListRowValidity(data as Data<FixedSizeList<NumericArrowType>>, dimensions) ??
      new Uint32Array(data.length).fill(1);
    const validityData = makeData({type: new Uint32(), length: validity.length, data: validity});
    gpuData[validityName] = makeGPUDataFromArrowData(device, validityData, {
      ...options.bufferProps,
      format: 'uint32'
    });
    fields.push({name: validityName, format: 'uint32', nullable: false, metadata: new Map()});
    selectedNames.add(validityName);
  }

  return new GPURecordBatch({
    gpuData,
    bufferLayout,
    fields,
    numRows: recordBatch.numRows,
    metadata: new Map(recordBatch.schema.metadata),
    sourceInfo: options.sourceInfo,
    nullCount: recordBatch.nullCount
  });
}

function makeGPUDataFromArrowRecordBatchVector(
  device: Device,
  vector: Vector,
  props: ArrowGPUDataProps = {}
): GPUData {
  const arrowType = vector.type;
  const matrixInfo = getArrowMatrixVectorInfo(vector);
  const isCanonicalFloat32Matrix = matrixInfo && isCanonicalFloat32ArrowMatrixInfo(matrixInfo);
  const requiresChunkedUpload =
    DataType.isUtf8(arrowType) ||
    isArrowUtf8DictionaryType(arrowType) ||
    isVariableLengthAttributeArrowType(arrowType);
  if (matrixInfo && !isCanonicalFloat32Matrix) {
    throw new Error(
      'GPUVector matrix columns require canonical Float32 column-major wgsl-storage values; use convertArrowMatrixToGPUVector() first'
    );
  }
  if (
    !isInstanceArrowType(arrowType) &&
    !isStorageFixedSizeListArrowType(arrowType) &&
    !isCanonicalFloat32Matrix &&
    !requiresChunkedUpload
  ) {
    throw new Error(`GPUVector does not support Arrow type ${arrowType}`);
  }

  const [data, ...remainingData] = vector.data;
  if (!data || remainingData.length > 0) {
    throw new Error('Arrow RecordBatch columns require exactly one Arrow Data chunk');
  }
  return makeGPUDataFromArrowData(device, data, {
    ...props,
    format: props.format ?? (matrixInfo ? 'float32x4' : getGPUVectorFormatForArrowType(arrowType))
  });
}

/** Uploads one Arrow table into a generic GPU table while preserving record-batch boundaries. */
export function makeGPUTableFromArrowTable(
  device: Device,
  table: Table,
  options: GPUTableFromArrowTableProps
): GPUTable {
  let sourceRowIndexOffset = 0;
  const batches = table.batches.map((recordBatch, sourceBatchIndex) => {
    const batch = makeGPURecordBatchFromArrowRecordBatch(device, recordBatch, {
      ...options,
      sourceInfo: {
        sourceBatchIndex,
        sourceRowIndexOffset,
        sourceRowCount: recordBatch.numRows
      }
    });
    sourceRowIndexOffset += recordBatch.numRows;
    return batch;
  });
  const firstBatch = batches[0];
  const bufferLayout =
    firstBatch?.bufferLayout ??
    (options.shaderLayout.attributes.length === 0 && table.batches.length === 0
      ? []
      : getArrowBufferLayout(options.shaderLayout, {
          arrowTable: table,
          arrowPaths: options.arrowPaths,
          allowWebGLOnlyFormats: options.allowWebGLOnlyFormats
        }));
  const schema = firstBatch?.schema ?? {
    fields: getArrowEmptyTableGPUFields(table, options, bufferLayout),
    metadata: new Map(table.schema.metadata)
  };

  return batches.length > 0
    ? new GPUTable({batches})
    : new GPUTable({
        schema,
        bufferLayout
      });
}

function getArrowEmptyTableGPUFields(
  table: Table,
  options: GPUTableFromArrowTableProps,
  bufferLayout: BufferLayout[]
): GPUField[] {
  const fields: GPUField[] = bufferLayout.map(layout => {
    const arrowPath = options.arrowPaths?.[layout.name] || layout.name;
    const sourceField = getArrowFieldByPath(table, arrowPath);
    return {
      name: layout.name,
      format: layout.format as GPUVectorFormat,
      nullable: sourceField.nullable,
      metadata: new Map(sourceField.metadata)
    };
  });
  const selectedNames = new Set(fields.map(field => field.name));

  for (const storageBinding of getArrowStorageBindings(options.shaderLayout)) {
    if (selectedNames.has(storageBinding.name)) {
      throw new Error(
        `GPURecordBatch shader input "${storageBinding.name}" cannot be both an attribute and a storage binding`
      );
    }
    const arrowPath = options.arrowPaths?.[storageBinding.name] || storageBinding.name;
    const sourceField = tryGetArrowFieldByPath(table, arrowPath);
    if (!sourceField) {
      continue;
    }
    fields.push({
      name: storageBinding.name,
      format: options.fixedSizeListColumns?.includes(storageBinding.name)
        ? getFixedSizeListGPUVectorFormatForArrowType(sourceField.type)
        : getGPUVectorFormatForArrowType(sourceField.type),
      nullable: sourceField.nullable,
      metadata: new Map(sourceField.metadata)
    });
    selectedNames.add(storageBinding.name);
  }

  for (const columnName of options.fixedSizeListColumns ?? []) {
    if (!selectedNames.has(columnName) || bufferLayout.some(layout => layout.name === columnName)) {
      throw new Error('Arrow fixed-size-list GPU columns require a selected storage binding');
    }
  }

  for (const [sourceName, validityColumn] of Object.entries(options.validityColumns ?? {})) {
    const validityName = typeof validityColumn === 'string' ? validityColumn : validityColumn.name;
    if (!selectedNames.has(sourceName) || selectedNames.has(validityName)) {
      throw new Error('Arrow GPU validity columns require a selected source and unique output');
    }
    const arrowPath = options.arrowPaths?.[sourceName] || sourceName;
    const sourceField = getArrowFieldByPath(table, arrowPath);
    if (!DataType.isFixedSizeList(sourceField.type)) {
      throw new Error('Arrow GPU validity columns require FixedSizeList source data');
    }
    const dimensions =
      typeof validityColumn === 'string'
        ? sourceField.type.listSize
        : (validityColumn.dimensions ?? sourceField.type.listSize);
    if (
      !Number.isSafeInteger(dimensions) ||
      dimensions < 1 ||
      dimensions > sourceField.type.listSize
    ) {
      throw new Error('Arrow FixedSizeList validity dimensions must fit within the list width');
    }
    fields.push({name: validityName, format: 'uint32', nullable: false, metadata: new Map()});
    selectedNames.add(validityName);
  }

  return fields;
}

function getArrowStorageBindings(shaderLayout: ShaderLayout): Array<{name: string}> {
  return shaderLayout.bindings.filter(
    binding =>
      (binding.type === 'storage' || binding.type === 'read-only-storage') && !('format' in binding)
  );
}

function tryGetArrowVectorByPath(table: Table, path: string): Vector | null {
  try {
    return getArrowVectorByPath(table, path);
  } catch {
    return null;
  }
}

function tryGetArrowFieldByPath(table: Table, path: string): Field | null {
  try {
    return getArrowFieldByPath(table, path);
  } catch {
    return null;
  }
}

function getFixedSizeListGPUVectorFormatForArrowType(type: DataType): GPUVectorFormat {
  if (
    !DataType.isFixedSizeList(type) ||
    !Number.isSafeInteger(type.listSize) ||
    type.listSize < 1
  ) {
    throw new Error('Arrow fixed-size-list GPU columns require valid FixedSizeList source data');
  }
  const signedDataType = getSignedArrowDataType(type.children[0].type);
  return `fixed-size-list<${signedDataType},${type.listSize}>`;
}
