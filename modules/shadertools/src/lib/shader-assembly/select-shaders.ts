// loaders.gl, MIT license

import type {PlatformInfo} from './platform-info';
import type {AssembleShaderOptions} from './assemble-shaders';

/**
 * Shader selection 
 */
export type AssembleShaderProps = Omit<AssembleShaderOptions, 'vs' | 'fs'> & {
  // Model also accepts a string shaders
  vs?: {glsl?: string; wgsl?: string} | string | null;
  fs?: {glsl?: string; wgsl?: string} | string | null;  
};

/**
 * TODO - should this functionality move into shadertools / assembleShaders ?
 * @param device
 * @param props
 * @returns
 */
export function selectShaders(
  platformInfo: PlatformInfo,
  props: AssembleShaderProps
): AssembleShaderOptions {
  if (!props.vs) {
    throw new Error('no vertex shader');
  }

  // Resolve WGSL vs GLSL
  const vs = getShaderSource(platformInfo, props.vs);
  let fs;
  if (props.fs) {
    fs = getShaderSource(platformInfo, props.fs);
  }

  return {...props, vs, fs};
}

/** Create a shader from the different overloads */
function getShaderSource(platformInfo: PlatformInfo, shader: string | {glsl?: string; wgsl?: string}): string {
  // TODO - detect WGSL/GLSL and throw an error if not supported
  if (typeof shader === 'string') {
    return shader;
  }

  switch (platformInfo.type) {
    case 'webgpu':
      if (shader?.wgsl) {
        return shader.wgsl;
      }
      throw new Error('WebGPU does not support GLSL shaders');

    default:
      if (shader?.glsl) {
        return shader.glsl;
      }
      throw new Error('WebGL does not support WGSL shaders');
  }
}
