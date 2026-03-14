// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import * as arrow from 'apache-arrow';
import { isNumericArrowType, isInstanceArrowType, 
// isVertexArrowType,
getSignedShaderType } from './arrow-types';
import { getArrowVectorByPath } from './arrow-paths';
/** Extracts info from columns that can be used as GPU data sources */
export function getArrowColumnInfo(arrowTable, path) {
    const vector = getArrowVectorByPath(arrowTable, path);
    if (isInstanceArrowType(vector.type)) {
        return getInstanceColumnInfo(vector);
    }
    // if (isVertexArrowType(vector.type)) {
    //   return getVertexColumnInfo(vector);
    // }
    return null;
}
/** Extracts info from columns that can be used with GPU instanced attributes */
export function getInstanceColumnInfo(vector) {
    let components = 1;
    let dataVector = vector;
    if (arrow.DataType.isFixedSizeList(vector.type)) {
        dataVector = vector.getChild(0);
        if (vector.type.listSize < 1 || vector.type.listSize > 4) {
            throw new Error('Attribute column fixed list size must be between 1 and 4');
        }
        components = vector.type.listSize;
    }
    if (!isNumericArrowType(dataVector.type)) {
        throw new Error('Attribute column must be numeric or fixed list of numeric');
    }
    const signedDataType = getSignedShaderType(dataVector.type, components);
    const columnInfo = {
        // data: dataVector.data,
        signedDataType,
        components,
        stepMode: 'instance',
        values: [],
        offsets: []
    };
    for (const data of dataVector.data) {
        columnInfo.values.push(data.values);
    }
    return columnInfo;
}
/** Extracts info from columns that can be used with GPU vertex attributes *
export function getVertexColumnInfo(vector: arrow.Vector<MeshArrowType>): MeshData[] {
  if (!arrow.DataType.isList(vector.type)) {
    throw new Error('mesh data must be an Arrow list');
  }

  for (const data of vector.data) {
    const offsets = data.valueOffsets;

  if (arrow.DataType.isFixedSizeList(vector.type)) {
    const dataVector = vector.getChild(0)!;
    const getArrowColumnInfo
    const dataVectorType = dataVector.type;
    if (isNumericArrowType(dataVectorType)) {
      return {
        data: dataVector.data,
        values: dataVector.data.values,
        size: vector.type.listSize,
        type: getAttributeShaderType(dataVectorType)
      };
    }
    const size = dataVector;
    return vector.getChild(0)!.data;
  }
  return vector.data;
}
*/
