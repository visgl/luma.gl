import {Device} from '@luma.gl/core';
import {ScenegraphNode} from '@luma.gl/engine';
import {GLTFInstantiator} from './gltf-instantiator';
import {GLTFAnimator} from './gltf-animator';
import type {PBREnvironment} from '../pbr/pbr-environment';
import {GLTFMaterialParserProps} from './gltf-material-parser';

export type GLTFInstantiatorOptions = Omit<GLTFMaterialParserProps, 'attributes'> & {
  modelOptions?: Record<string, any>,
  pbrDebug?: boolean,
  imageBasedLightingEnvironment?: PBREnvironment,
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
