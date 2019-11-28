import GLTFInstantiator from './gltf-instantiator';

export default function createGLTFObjects(gl, gltf, options) {
  const instantiator = new GLTFInstantiator(gl, options);
  const scenes = instantiator.instantiate(gltf);
  const animator = instantiator.createAnimator();

  return {scenes, animator};
}
