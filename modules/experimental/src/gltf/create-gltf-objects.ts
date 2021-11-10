import GLTFInstantiator from './gltf-instantiator';
import GLTFAnimator from './gltf-animator';

export default function createGLTFObjects(
  gl: WebGLRenderingContext,
  gltf: any,
  options?: any
): {
  scenes: any;
  animator: GLTFAnimator;
} {
  const instantiator = new GLTFInstantiator(gl, options);
  const scenes = instantiator.instantiate(gltf);
  const animator = instantiator.createAnimator();

  return {scenes, animator};
}
