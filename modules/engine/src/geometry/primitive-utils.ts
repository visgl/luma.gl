/*
import type {GeometryTable} from './geometry-table';

export function unpackIndexedGeometry(geometry: GeometryTable): GeometryTable {
  const {indices, attributes} = geometry;
  if (!indices) {
    return geometry;
  }

  const vertexCount = indices.length;
  const unpackedAttributes = {};

  for (const [name, values] of Object.entries(attributes)) {
    const size = {POSITION: 3, NORMAL: 3, TEX_COORD0: 2}[name];
    const unpackedValues = new values.constructor(length * size);
    for (let x = 0; x < vertexCount; ++x) {
      const index = indices[x];
      for (let i = 0; i < size; i++) {
        unpackedValues[x * size + i] = values[index * size + i];
      }
    }
    unpackedAttributes[name] = unpackedValues;
  }

  return {
    length,
    attributes: unpackedAttributes
  };
}
*/