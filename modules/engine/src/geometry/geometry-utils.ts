// import type {Geometry} from './geometry';

export function unpackIndexedGeometry(geometry: any) {
  const {indices, attributes} = geometry;
  if (!indices) {
    return geometry;
  }

  const vertexCount = indices.value.length;
  const unpackedAttributes: Record<string, any> = {};

  for (const attributeName in attributes) {
    const attribute = attributes[attributeName];
    const {constant, value, size} = attribute;
    if (constant || !size) {
      continue; // eslint-disable-line
    }
    const unpackedValue = new value.constructor(vertexCount * size);
    for (let x = 0; x < vertexCount; ++x) {
      const index = indices.value[x];
      for (let i = 0; i < size; i++) {
        unpackedValue[x * size + i] = value[index * size + i];
      }
    }
    unpackedAttributes[attributeName] = {size, value: unpackedValue};
  }

  return {
    attributes: Object.assign({}, attributes, unpackedAttributes)
  };
}
