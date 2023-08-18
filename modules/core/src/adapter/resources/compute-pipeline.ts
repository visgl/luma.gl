//
import {BindingLayout} from '../types/shader-layout';
import {Resource, ResourceProps, DEFAULT_RESOURCE_PROPS} from './resource';
import type {Device} from '../device';
import type {Shader} from './shader';

export type ComputePipelineProps = ResourceProps & {
  handle?: unknown;
  cs: Shader;
  csEntryPoint?: string;
  csConstants?: Record<string, number>; // WGSL only
  layout?: BindingLayout[];
};

// @ts-expect-error
const DEFAULT_COMPUTE_PIPELINE_PROPS: Required<ComputePipelineProps> = {
  ...DEFAULT_RESOURCE_PROPS,
  // cs: undefined,
  // csEntryPoint: undefined,
  csConstants: {},
  layout: []
};

/**
 */
export abstract class ComputePipeline extends Resource<ComputePipelineProps> {
  override get [Symbol.toStringTag](): string {
    return 'ComputePipeline';
  }

  hash: string = '';

  constructor(device: Device, props: ComputePipelineProps) {
    super(device, props, DEFAULT_COMPUTE_PIPELINE_PROPS);
  }
}
