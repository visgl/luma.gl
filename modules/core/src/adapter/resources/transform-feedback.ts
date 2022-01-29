// luma.gl, MIT license
import type {Device} from '../device';
import type {ShaderLayout} from '../types/shader-layout';
import type {Buffer} from './buffer';
import {Resource, ResourceProps, DEFAULT_RESOURCE_PROPS} from './resource';

/** Configures a set of output buffers for pipeline (WebGL only) */
export type TransformFeedbackProps = ResourceProps & {
  layout: ShaderLayout;
  buffers: Record<string, Buffer | BufferRange>;
};

/** For bindRange */
export type BufferRange = {
  buffer: Buffer; 
  byteOffset?: number;
  byteSize?: number
};

const DEFAULT_TRANSFORM_FEEDBACK_PROPS: Required<TransformFeedbackProps> = {
  ...DEFAULT_RESOURCE_PROPS,
  layout: undefined!,
  buffers: {}
};

/** Holds a set of output buffers for pipeline (WebGL only) */
export abstract class TransformFeedback extends Resource<TransformFeedbackProps> {
  get [Symbol.toStringTag](): string {
    return 'TransformFeedback';
  }

  constructor(device: Device, props?: TransformFeedbackProps) {
    super(device, props, DEFAULT_TRANSFORM_FEEDBACK_PROPS);
  }
}
