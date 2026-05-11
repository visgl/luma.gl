// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';

/** Returns all leaf column paths in an Arrow object, using dot notation for nested structs. */
export function getArrowPaths(
  arrowObject: arrow.Data | arrow.Table | arrow.RecordBatch | arrow.Vector
): string[] {
  const data = getArrowDataArray(arrowObject)[0];
  return getArrowPathsRecursive(data, []);
}

/** Recursively returns all leaf paths below an Arrow data node. */
export function getArrowPathsRecursive(arrowData: arrow.Data, currentPath: string[]): string[] {
  if (!arrow.DataType.isStruct(arrowData.type)) {
    return [currentPath.join('.')];
  }

  const fields = arrowData.type.children;
  const nestedPaths: any[] = [];
  for (let fieldIndex = 0; fieldIndex < fields.length; fieldIndex++) {
    const field = fields[fieldIndex];
    const fieldData = arrowData.children[fieldIndex];
    const fieldPath = [...currentPath, field.name];
    const paths = getArrowPathsRecursive(fieldData, fieldPath);
    nestedPaths.push(...paths);
  }

  return nestedPaths;
}

/** Returns the Arrow data node at a dot-separated column path. */
export function getArrowDataByPath(
  arrowObject: arrow.Data | arrow.Table | arrow.RecordBatch | arrow.Vector,
  columnPath: string
): arrow.Data {
  const data = getArrowDataArray(arrowObject)[0];

  const path = decomposePath(columnPath);
  let nestedData = data;
  for (const key of path) {
    if (!arrow.DataType.isStruct(nestedData.type)) {
      throw new Error(
        `Arrow table nested column is a not a struct: '${key} in '${path.join('.')}'`
      );
    }
    const fields = nestedData.type.children;
    const indexByField = fields.findIndex(field => field.name === key);
    if (indexByField === -1) {
      throw new Error(
        `Arrow table schema does not contain nested column '${key} in '${path.join('.')}'`
      );
    }

    nestedData = nestedData.children[indexByField];
  }

  // Check that we resolved all the intermediate structs
  if (arrow.DataType.isStruct(nestedData.type)) {
    throw new Error(`Arrow table nested column '${path.join('.')}' is a struct`);
  }

  return nestedData;
}

/** Returns the Arrow vector at a dot-separated table column path. */
export function getArrowVectorByPath(arrowTable: arrow.Table, columnPath: string): arrow.Vector {
  // Make a temporary vector from the top level struct data.
  const vector = arrow.makeVector(arrowTable.data);

  const path = decomposePath(columnPath);
  let nestedVector = vector;
  for (const key of path) {
    if (!arrow.DataType.isStruct(nestedVector.type)) {
      throw new Error(
        `Arrow table nested column is a not a struct: '${key} in '${path.join('.')}'`
      );
    }
    const fields = nestedVector.type.children;
    const indexByField = fields.findIndex(field => field.name === key);
    if (indexByField === -1) {
      throw new Error(
        `Arrow table schema does not contain nested column '${key} in '${path.join('.')}'`
      );
    }

    nestedVector = nestedVector.getChildAt(indexByField)!;
  }

  // Check that we resolved all the intermediate structs
  if (arrow.DataType.isStruct(nestedVector.type)) {
    throw new Error(`Arrow table nested column '${path.join('.')}' is a struct`);
  }

  return nestedVector;
}

/** Returns the Arrow schema field at a dot-separated table column path. */
export function getArrowFieldByPath(arrowTable: arrow.Table, columnPath: string): arrow.Field {
  const path = decomposePath(columnPath);
  let fields = arrowTable.schema.fields;
  let resolvedField: arrow.Field | null = null;

  for (let pathIndex = 0; pathIndex < path.length; pathIndex++) {
    const key = path[pathIndex];
    const isLeafField = pathIndex === path.length - 1;
    const indexByField = fields.findIndex(field => field.name === key);
    if (indexByField === -1) {
      throw new Error(
        `Arrow table schema does not contain nested column '${key} in '${path.join('.')}'`
      );
    }

    resolvedField = fields[indexByField];
    if (!isLeafField) {
      if (!arrow.DataType.isStruct(resolvedField.type)) {
        throw new Error(
          `Arrow table nested column is a not a struct: '${key} in '${path.join('.')}'`
        );
      }
      fields = resolvedField.type.children;
    }
  }

  if (!resolvedField || arrow.DataType.isStruct(resolvedField.type)) {
    throw new Error(`Arrow table nested column '${path.join('.')}' is a struct`);
  }

  return resolvedField;
}

/** Returns the data chunks contained by an Arrow object. */
export function getArrowDataArray(
  arrowObject: arrow.Data | arrow.Table | arrow.RecordBatch | arrow.Vector
): arrow.Data[] {
  if (arrowObject instanceof arrow.Table) {
    return arrowObject.data;
  } else if (arrowObject instanceof arrow.RecordBatch) {
    return [arrowObject.data];
  } else if (arrowObject instanceof arrow.Vector) {
    // @ts-expect-error for some reason read-only in this context
    return arrowObject.data;
  }
  return [arrowObject];
}

// HELPER FUNCTIONS

function decomposePath(path: string): string[] {
  return path.split('.');
}
