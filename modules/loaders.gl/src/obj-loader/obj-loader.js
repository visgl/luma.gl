import OBJ from 'webgl-obj-loader';

function testOBJFile(text) {
  // There could be comment line first
  return text[0] === 'v';
}

function parseOBJMesh(text) {
  const mesh = new OBJ.Mesh(text);
  const indices = new Uint16Array(mesh.indices);
  const positions = new Float32Array(mesh.vertices);
  const normals = new Float32Array(mesh.vertexNormals);
  const texCoords = new Float32Array(mesh.textures);

  return {
    header: {},
    attributes: {
      indices,
      positions,
      normals,
      texCoords
    }
  };
}

export default {
  name: 'OBJ',
  extension: 'obj',
  testText: testOBJFile,
  parseText: parseOBJMesh
};
