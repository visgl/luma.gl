import GLTFAnimator from './gltf-animator';

export default function createGLTFObjects(
  gl: WebGLRenderingContext,
  gltf: any,
  options?: any
): {
  scenes: any;
  animator: GLTFAnimator;
};
