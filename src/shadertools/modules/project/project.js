export function getUniforms({
  modelMatrix,
  viewMatrix,
  projectionMatrix
}) {
  // const viewProjection = view.mulMat4(projection);
  // const viewProjectionInverse = viewProjection.invert();
  return {
    // cameraPosition: position,
    projectionMatrix,
    viewMatrix,
    modelMatrix
    // viewProjectionMatrix: viewProjection,
    // viewInverseMatrix: view.invert(),
    // viewProjectionInverseMatrix: viewProjectionInverse
  };
}

const vertexShader = `\
// Unprefixed uniforms
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

vec4 project_position(vec4 position) {
  return projectionMatrix * viewMatrix * modelMatrix * position;
}
`;

const fragmentShader = '';

export default {
  name: 'project',
  getUniforms,
  vertexShader,
  fragmentShader
};
