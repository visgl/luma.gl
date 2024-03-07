// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

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

// export function calculateVertexNormals(positions: Float32Array): Uint8Array {
//   let normals = new Uint8Array(positions.length / 3);

//   for (let i = 0; i < positions.length; i++) {
//     const vec1 = new Vector3(positions.subarray(i * 3, i + 0, i + 3));
//     const vec2 = new Vector3(positions.subarray(i + 3, i + 6));
//     const vec3 = new Vector3(positions.subarray(i + 6, i + 9));

//     const normal = new Vector3(vec1).cross(vec2).normalize();
//     normals.set(normal[0], i + 4);
//     normals.set(normal[1], i + 4 + 1);
//     normals.set(normal[2], i + 2);
//   }
//   const normal = new Vector3(vec1).cross(vec2).normalize();
// }
