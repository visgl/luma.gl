// TODO - generalize to arbitrary attributes
export function unpackIndexedGeometry(geometry) {
  const {indices, attributes} = geometry;
  if (!indices) {
    return geometry;
  }

  const {POSITION, NORMAL, TEXCOORD_0} = attributes;

  const unpackedPositions = new Float32Array(indices.length * 3);
  const unpackedNormals = new Float32Array(indices.length * 3);
  const unpackedTexCoords = new Float32Array(indices.length * 2);

  for (let x = 0; x < indices.length; ++x) {
    const index = indices[x];
    unpackedPositions[x * 3 + 0] = POSITION[index * 3 + 0];
    unpackedPositions[x * 3 + 1] = POSITION[index * 3 + 1];
    unpackedPositions[x * 3 + 2] = POSITION[index * 3 + 2];
    unpackedNormals[x * 3 + 0] = NORMAL[index * 3 + 0];
    unpackedNormals[x * 3 + 1] = NORMAL[index * 3 + 1];
    unpackedNormals[x * 3 + 2] = NORMAL[index * 3 + 2];
    unpackedTexCoords[x * 2 + 0] = TEXCOORD_0[index * 2 + 0];
    unpackedTexCoords[x * 2 + 1] = TEXCOORD_0[index * 2 + 1];
  }

  return {
    attributes: {
      POSITION: unpackedPositions,
      NORMAL: unpackedNormals,
      TEXCOORD_0: unpackedTexCoords
    }
  };
}
