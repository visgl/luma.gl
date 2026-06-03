// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Data, DataType, Field, RecordBatch, Schema, Table, Vector, makeVector} from 'apache-arrow';

/** Returns all leaf column paths in an Arrow object, using dot notation for nested structs. */
export function getArrowPaths(arrowObject: Data | Table | RecordBatch | Vector): string[] {
  const data = getArrowDataArray(arrowObject)[0];
  return getArrowPathsRecursive(data, []);
}

/** Returns all leaf field paths in an Arrow schema, using dot notation for nested structs. */
export function getArrowSchemaPaths(schema: Schema): string[] {
  return getArrowSchemaPathsRecursive(schema.fields, []);
}

/** Recursively returns all leaf paths below an Arrow data node. */
export function getArrowPathsRecursive(arrowData: Data, currentPath: string[]): string[] {
  if (!DataType.isStruct(arrowData.type)) {
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

/** Returns the schema leaf field at a dot-separated path, or `null` when it cannot resolve. */
export function findArrowFieldByPath(
  schemaOrTable: Schema | Table,
  columnPath: string
): Field | null {
  const schema = schemaOrTable instanceof Table ? schemaOrTable.schema : schemaOrTable;
  const path = decomposePath(columnPath);
  let fields = schema.fields;
  let resolvedField: Field | null = null;

  for (let pathIndex = 0; pathIndex < path.length; pathIndex++) {
    const key = path[pathIndex];
    const isLeafField = pathIndex === path.length - 1;
    resolvedField = fields.find(field => field.name === key) ?? null;
    if (!resolvedField) {
      return null;
    }
    if (!isLeafField) {
      if (!DataType.isStruct(resolvedField.type)) {
        return null;
      }
      fields = resolvedField.type.children;
    }
  }

  return resolvedField && !DataType.isStruct(resolvedField.type) ? resolvedField : null;
}

/** Returns the Arrow data node at a dot-separated column path. */
export function getArrowDataByPath(
  arrowObject: Data | Table | RecordBatch | Vector,
  columnPath: string
): Data {
  const data = getArrowDataArray(arrowObject)[0];

  const path = decomposePath(columnPath);
  let nestedData = data;
  for (const key of path) {
    if (!DataType.isStruct(nestedData.type)) {
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
  if (DataType.isStruct(nestedData.type)) {
    throw new Error(`Arrow table nested column '${path.join('.')}' is a struct`);
  }

  return nestedData;
}

/** Returns the Arrow vector at a dot-separated table column path. */
export function getArrowVectorByPath(arrowTable: Table, columnPath: string): Vector {
  // Make a temporary vector from the top level struct data.
  const vector = makeVector(arrowTable.data);

  const path = decomposePath(columnPath);
  let nestedVector = vector;
  for (const key of path) {
    if (!DataType.isStruct(nestedVector.type)) {
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
  if (DataType.isStruct(nestedVector.type)) {
    throw new Error(`Arrow table nested column '${path.join('.')}' is a struct`);
  }

  return nestedVector;
}

/** Returns the Arrow schema field at a dot-separated table column path. */
export function getArrowFieldByPath(arrowTable: Table, columnPath: string): Field {
  const path = decomposePath(columnPath);
  let fields = arrowTable.schema.fields;
  let resolvedField: Field | null = null;

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
      if (!DataType.isStruct(resolvedField.type)) {
        throw new Error(
          `Arrow table nested column is a not a struct: '${key} in '${path.join('.')}'`
        );
      }
      fields = resolvedField.type.children;
    }
  }

  if (!resolvedField || DataType.isStruct(resolvedField.type)) {
    throw new Error(`Arrow table nested column '${path.join('.')}' is a struct`);
  }

  return resolvedField;
}

/** Returns the data chunks contained by an Arrow object. */
export function getArrowDataArray(arrowObject: Data | Table | RecordBatch | Vector): Data[] {
  if (arrowObject instanceof Table) {
    return arrowObject.data;
  } else if (arrowObject instanceof RecordBatch) {
    return [arrowObject.data];
  } else if (arrowObject instanceof Vector) {
    // @ts-expect-error for some reason read-only in this context
    return arrowObject.data;
  }
  return [arrowObject];
}

// HELPER FUNCTIONS

function decomposePath(path: string): string[] {
  return path.split('.');
}

function getArrowSchemaPathsRecursive(fields: Field[], currentPath: string[]): string[] {
  const paths: string[] = [];
  for (const field of fields) {
    const fieldPath = [...currentPath, field.name];
    if (DataType.isStruct(field.type)) {
      paths.push(...getArrowSchemaPathsRecursive(field.type.children, fieldPath));
    } else {
      paths.push(fieldPath.join('.'));
    }
  }
  return paths;
}
