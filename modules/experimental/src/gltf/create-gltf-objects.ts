import {Device} from '@luma.gl/api';
import GLTFInstantiator from './gltf-instantiator';
import GLTFAnimator from './gltf-animator';

export default function createGLTFObjects(
  device: Device,
  gltf: any,
  options?: any
): {
  scenes: any;
  animator: GLTFAnimator;
} {
  const instantiator = new GLTFInstantiator(device, options);
  const scenes = instantiator.instantiate(gltf);
  const animator = instantiator.createAnimator();
  return {scenes, animator};
}
