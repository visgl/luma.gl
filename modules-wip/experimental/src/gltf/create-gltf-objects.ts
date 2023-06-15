import {Device} from '@luma.gl/api';
import {ScenegraphNode} from '../scenegraph/scenegraph-node';
import {GLTFInstantiator} from './gltf-instantiator';
import {GLTFAnimator} from './gltf-animator';
import {GLTFEnvironment} from './gltf-environment';
import {GLTFMaterialParserProps} from './gltf-material-parser';

export type GLTFInstantiatorOptions = Omit<GLTFMaterialParserProps, 'attributes'> & {
  modelOptions?: Record<string, any>,
  pbrDebug?: boolean,
  imageBasedLightingEnvironment?: GLTFEnvironment,
  lights?: boolean,
  useTangents?: boolean
}

export function createScenegraphsFromGLTF(
  device: Device,
  gltf: any,
  options?: GLTFInstantiatorOptions
): {
  scenes: ScenegraphNode[];
  animator: GLTFAnimator;
} {
  const instantiator = new GLTFInstantiator(device, options);
  const scenes = instantiator.instantiate(gltf);
  const animator = instantiator.createAnimator();
  return {scenes, animator};
}
