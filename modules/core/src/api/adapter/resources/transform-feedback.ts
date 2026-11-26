// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '../device';
import {PrimitiveTopology} from '../types/parameters';
import {ShaderLayout} from '../types/shader-layout';
import type {Buffer} from './buffer';
import {DeviceResource, DeviceResourceProps} from './device-resource';

/** For bindRange */
export type BufferRange = {
  buffer: Buffer;
  byteOffset?: number;
  byteLength?: number;
};

/** Configures a set of output buffers for pipeline (WebGL only) */
export type TransformFeedbackProps = DeviceResourceProps & {
  /** Layout of shader (for varyings) */
  layout: ShaderLayout;
  /** Buffer bindings (for varyings) */
  buffers: Record<string, Buffer | BufferRange>;
};

/** Holds a set of output buffers for pipeline (WebGL only) */
export abstract class TransformFeedback extends DeviceResource<TransformFeedbackProps> {
  static override defaultProps: Required<TransformFeedbackProps> = {
    ...DeviceResource.defaultProps,
    layout: undefined!,
    buffers: {}
  };

  get [Symbol.toStringTag](): string {
    return 'TransformFeedback';
  }

  constructor(device: Device, props: TransformFeedbackProps) {
    super(device, props, TransformFeedback.defaultProps);
  }

  abstract begin(topology?: PrimitiveTopology): void;
  abstract end(): void;

  abstract setBuffers(buffers: Record<string, Buffer | BufferRange>): void;
  abstract setBuffer(locationOrName: string | number, bufferOrRange: Buffer | BufferRange): void;
  abstract getBuffer(locationOrName: string | number): Buffer | BufferRange | null;
}
