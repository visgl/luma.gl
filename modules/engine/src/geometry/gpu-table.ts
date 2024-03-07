// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/*
export function getAttributeLayoutsFromGeometry(geometry: Geometry) {
  const layouts: Record<string, {}> = {};
  let indices = geometry.indices;

  for (const [name, attribute] of Object.entries(geometry.attributes)) {
    const remappedName = mapAttributeName(name);

    if (attribute.constant) {
      throw new Error('constant attributes not supported');
    } else {
      const typedArray = attribute.value;
      // Create accessor by copying the attribute and removing `value``
      const accessor = {...attribute};
      delete accessor.value;
      buffers[remappedName] = [device.createBuffer(typedArray), accessor];

      inferAttributeAccessor(name, accessor);
    }
  }
}

export class Table {
  length: number;
  // columns: Record<string, TypedArray> = {};
}

export class GPUTable {
  length: number;
  columns: Record<string, Buffer> = {};
}

export function convertTableToGPUTable(table: Table) {
  // for (const ) {}
}

export function renameTableColumns(table: Table, map: (name: string) => string) {
  const newColumns = table.columns.reduce()
  table.clone();
}
*/
