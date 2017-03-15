export function getUniforms({
  world,
  view,
  projection
}) {
  const viewProjection = view.mulMat4(projection);
  const viewProjectionInverse = viewProjection.invert();
  return {
    // cameraPosition: position,
    projectionMatrix: projection,
    viewMatrix: view,
    worldMatrix: world,
    viewProjectionMatrix: viewProjection,
    viewInverseMatrix: view.invert(),
    viewProjectionInverseMatrix: viewProjectionInverse
  };
}
