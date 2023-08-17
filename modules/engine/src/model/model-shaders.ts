import type {Device} from '@luma.gl/core';
import type {ShaderModule, HookFunction} from '@luma.gl/shadertools';
import {ShaderAssembler} from '@luma.gl/shadertools';

export type ModelShaderProps = {
  // Model also accepts a string shaders
  vs?: {glsl?: string; wgsl?: string} | string | null;
  fs?: {glsl?: string; wgsl?: string} | string | null;
  /** shadertool shader modules (added to shader code) */
  modules?: ShaderModule[];
  /** Shadertool module defines (configures shader code)*/
  defines?: Record<string, string | number | boolean>;
  inject?: Record<string, string>;
  hooks?: Record<string, HookFunction>;
  transpileToGLSL100?: boolean;

  shaderAssembler: ShaderAssembler;
};

type GetUniformsFunc = (props?: Record<string, any>) => Record<string, any>;

/**
 * TODO - should this functionality move into shadertools / assembleShaders ?
 * @param device
 * @param props
 * @returns
 */
export function buildShaders(
  device: Device,
  props: ModelShaderProps
): {
  vs: string; 
  fs: string | undefined; 
  getUniforms: GetUniformsFunc
} {
  if (!props.vs) {
    throw new Error('no vertex shader');
  }

  // Resolve WGSL vs GLSL
  const vs = getShaderSource(device, props.vs);
  let fs;
  if (props.fs) {
    fs = getShaderSource(device, props.fs);
  }

  const platformInfo = {
    type: device.info.type,
    gpu: device.info.gpu,
    features: device.features
  };

  return props.shaderAssembler.assembleShaders(platformInfo, {...props, fs, vs});
}

/** Create a shader from the different overloads */
function getShaderSource(device: Device, shader: string | {glsl?: string; wgsl?: string}): string {
  // TODO - detect WGSL/GLSL and throw an error if not supported
  if (typeof shader === 'string') {
    return shader;
  }

  switch (device.info.type) {
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
