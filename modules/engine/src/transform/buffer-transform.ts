// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device, Buffer, BufferRange, TransformFeedback, RenderPassProps} from '@luma.gl/core';
import {getPassthroughFS} from '@luma.gl/shadertools';
import {Model} from '../model/model';
import type {ModelProps} from '../model/model';

/**
 * Properties for creating a {@link BufferTransform}
 * @note Only works under WebGL2.
 */
export type BufferTransformProps = Omit<ModelProps, 'fs'> & {
  fs?: ModelProps['fs']; // override as optional
  /** Map of output buffers that the shaders will write results of computations to */
  feedbackBuffers?: Record<string, Buffer | BufferRange>;
};

/**
 * Manages a WebGL program (pipeline) for buffer→buffer transforms.
 * @note Only works under WebGL2.
 */
export class BufferTransform {
  readonly device: Device;
  readonly model: Model;
  readonly transformFeedback: TransformFeedback;

  static isSupported(device: Device): boolean {
    return device?.info?.type === 'webgl';
  }

  constructor(device: Device, props: BufferTransformProps = Model.defaultProps) {
    if (!BufferTransform.isSupported(device)) {
      throw new Error('BufferTransform not yet implemented on WebGPU');
    }

    this.device = device;

    this.model = new Model(this.device, {
      id: props.id || 'buffer-transform-model',
      fs: props.fs || getPassthroughFS(),
      topology: props.topology || 'point-list',
      ...props
    });

    this.transformFeedback = this.device.createTransformFeedback({
      layout: this.model.pipeline.shaderLayout,
      // @ts-expect-error TODO
      buffers: props.feedbackBuffers
    });

    this.model.setTransformFeedback(this.transformFeedback);

    Object.seal(this);
  }

  /** Destroy owned resources. */
  destroy(): void {
    if (this.model) {
      this.model.destroy();
    }
  }

  /** @deprecated Use {@link destroy}. */
  delete(): void {
    this.destroy();
  }

  /** Run one transform loop. */
  run(options?: RenderPassProps): void {
    const renderPass = this.device.beginRenderPass(options);
    this.model.draw(renderPass);
    renderPass.end();
  }

  /** Returns the {@link Buffer} or {@link BufferRange} for given varying name. */
  getBuffer(varyingName: string): Buffer | BufferRange | null {
    return this.transformFeedback.getBuffer(varyingName);
  }

  readAsync(varyingName: string): Promise<Uint8Array> {
    const result = this.getBuffer(varyingName);
    if (!result) {
      throw new Error('BufferTransform#getBuffer');
    }
    if (result instanceof Buffer) {
      return result.readAsync();
    }
    const {buffer, byteOffset = 0, byteLength = buffer.byteLength} = result;
    return buffer.readAsync(byteOffset, byteLength);
  }
}
