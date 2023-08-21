//
import {BindingLayout} from '../types/shader-layout';
import {Resource, ResourceProps} from './resource';
import type {Device} from '../device';
import type {Shader} from './shader';

export type ComputePipelineProps = ResourceProps & {
  handle?: unknown;
  cs: Shader;
  csEntryPoint?: string;
  csConstants?: Record<string, number>; // WGSL only
  layout?: BindingLayout[];
};


/**
 */
export abstract class ComputePipeline extends Resource<ComputePipelineProps> {
  static override defaultProps: Required<ComputePipelineProps> = {
    ...Resource.defaultProps,
    cs: undefined,
    csEntryPoint: undefined,
    csConstants: {},
    layout: []
  };  

  override get [Symbol.toStringTag](): string {
    return 'ComputePipeline';
  }

  hash: string = '';

  constructor(device: Device, props: ComputePipelineProps) {
    super(device, props, ComputePipeline.defaultProps);
  }
}
