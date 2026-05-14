// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {BufferLayout, ShaderLayout} from '@luma.gl/core';
import * as arrow from 'apache-arrow';
import {findArrowFieldByPath, getArrowDataByPath, getArrowSchemaPaths} from './arrow-paths';
import {getArrowVertexFormat} from './arrow-shader-layout';
import {
  getSignedShaderType,
  isInstanceArrowType,
  isNumericArrowType,
  type ArrowColumnInfo,
  type AttributeArrowType,
  type NumericArrowType
} from './arrow-types';
import {validateArrowGPUDataDirectUpload} from './arrow-gpu-data';

/** One shader-selected Arrow column that can append directly into GPU storage. */
export type AppendableGPUColumn = {
  attributeName: string;
  arrowPath: string;
  field: arrow.Field;
  bufferLayout: BufferLayout;
};

/** Validated Arrow data selected for one appendable GPU column. */
export type AppendableGPUColumnData = {
  column: AppendableGPUColumn;
  data: arrow.Data<AttributeArrowType>;
};

/** Resolves shader-selected Arrow columns for appendable GPU storage. */
export function getAppendableGPUColumns(props: {
  schema: arrow.Schema;
  shaderLayout: ShaderLayout;
  arrowPaths?: Record<string, string>;
  allowWebGLOnlyFormats?: boolean;
}): AppendableGPUColumn[] {
  const schemaPaths = new Set(getArrowSchemaPaths(props.schema));
  const columns: AppendableGPUColumn[] = [];

  for (const attribute of props.shaderLayout.attributes) {
    const hasExplicitPath = Boolean(
      props.arrowPaths && Object.prototype.hasOwnProperty.call(props.arrowPaths, attribute.name)
    );
    const arrowPath = props.arrowPaths?.[attribute.name] || attribute.name;
    if (!hasExplicitPath && !schemaPaths.has(arrowPath)) {
      continue;
    }

    const field = findArrowFieldByPath(props.schema, arrowPath);
    if (!field) {
      throw new Error(`Arrow table schema does not contain column "${arrowPath}"`);
    }
    if (!isInstanceArrowType(field.type)) {
      throw new Error(`Arrow column "${arrowPath}" is not compatible with shader attributes`);
    }

    const format = getArrowVertexFormat(getArrowColumnInfoFromType(field.type), attribute.type, {
      allowWebGLOnlyFormats: props.allowWebGLOnlyFormats
    });
    columns.push({
      attributeName: attribute.name,
      arrowPath,
      field,
      bufferLayout: {
        name: attribute.name,
        format,
        ...(attribute.stepMode ? {stepMode: attribute.stepMode} : {})
      }
    });
  }

  return columns;
}

/** Validates append compatibility and extracts one direct-upload Arrow data chunk per selected column. */
export function getAppendableGPUColumnData(
  recordBatch: arrow.RecordBatch,
  columns: AppendableGPUColumn[],
  ownerName: string
): AppendableGPUColumnData[] {
  for (const column of columns) {
    const sourceField = findArrowFieldByPath(recordBatch.schema, column.arrowPath);
    if (!sourceField || !arrow.util.compareTypes(sourceField.type, column.field.type)) {
      throw new Error(`${ownerName} column "${column.arrowPath}" does not match the source schema`);
    }
  }

  return columns.map(column => {
    const data = getArrowDataByPath(
      recordBatch,
      column.arrowPath
    ) as arrow.Data<AttributeArrowType>;
    if (data.length !== recordBatch.numRows) {
      throw new Error(`${ownerName} column "${column.arrowPath}" row count mismatch`);
    }
    validateArrowGPUDataDirectUpload(column.attributeName, data);
    return {column, data};
  });
}

/** Derives Arrow column characteristics needed to map one selected column to a vertex format. */
export function getArrowColumnInfoFromType(type: AttributeArrowType): ArrowColumnInfo {
  let numericType = type as NumericArrowType;
  let components: 1 | 2 | 3 | 4 = 1;
  if (arrow.DataType.isFixedSizeList(type)) {
    numericType = type.children[0].type as NumericArrowType;
    if (type.listSize < 1 || type.listSize > 4) {
      throw new Error('Attribute column fixed list size must be between 1 and 4');
    }
    components = type.listSize as 1 | 2 | 3 | 4;
  }
  if (!isNumericArrowType(numericType)) {
    throw new Error('Attribute column must be numeric or fixed list of numeric');
  }
  return {
    signedDataType: getSignedShaderType(numericType, components),
    components,
    stepMode: 'instance',
    values: [],
    offsets: []
  };
}
