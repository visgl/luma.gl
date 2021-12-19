// luma.gl, MIT license
import type Device from './device';
import Resource, {ResourceProps, DEFAULT_RESOURCE_PROPS} from './resource';
import type {default as Shader} from './shader';
import {RenderPipelineParameters} from './parameters';
import type {BindingLayout} from './types';

export type RenderPipelineProps = ResourceProps & {
  vertexShader: Shader;
  vertexShaderEntryPoint?: string; // WGSL only
  vertexShaderConstants?: Record<string, number>; // WGSL only

  fragmentShader?: Shader;
  fragmentShaderEntryPoint?: string; // WGSL only
  fragmentShaderConstants?: Record<string, number>; // WGSL only

  primitiveTopology?: 'point-list' | 'line-list' | 'line-strip' | 'triangle-list' | 'triangle-strip';
  parameters?: RenderPipelineParameters;
  layout?: BindingLayout[];
};

// @ts-expect-error
const DEFAULT_RENDER_PIPELINE_PROPS: Required<RenderPipelineProps> = {
  ...DEFAULT_RESOURCE_PROPS,
};

/**
 */
export default abstract class RenderPipeline extends Resource<RenderPipelineProps> {
  get [Symbol.toStringTag](): string { return 'RenderPipeline'; }

  constructor(device: Device, props: RenderPipelineProps) {
    super(device, props, DEFAULT_RENDER_PIPELINE_PROPS);
  }
}
