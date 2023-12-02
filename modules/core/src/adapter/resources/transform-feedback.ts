// luma.gl, MIT license
import type {Device} from '../device';
import type {ShaderLayout} from '../types/shader-layout';
import type {Buffer} from './buffer';
import {Resource, ResourceProps} from './resource';

/** For bindRange */
export type BufferRange = {
  buffer: Buffer;
  byteOffset?: number;
  byteSize?: number;
};


/** Configures a set of output buffers for pipeline (WebGL only) */
export type TransformFeedbackProps = ResourceProps & {
  /** Layout of shader (vor varyings) */
  layout: ShaderLayout;
  /** Buffer bindings (for varyings) */
  buffers: Record<string, Buffer | BufferRange>;
};

/** Holds a set of output buffers for pipeline (WebGL only) */
export abstract class TransformFeedback extends Resource<TransformFeedbackProps> {
  static override defaultProps: Required<TransformFeedbackProps> = {
    ...Resource.defaultProps,
    layout: undefined!,
    buffers: {}
  };

  get [Symbol.toStringTag](): string {
    return 'TransformFeedback';
  }

  constructor(device: Device, props?: TransformFeedbackProps) {
    super(device, props, TransformFeedback.defaultProps);
  }
}
