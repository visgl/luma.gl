// luma.gl, MIT license
// Copyright (c) vis.gl contributors

import {Device, Buffer, BufferRange, Framebuffer, TransformFeedback, assert, RenderPassParameters} from '@luma.gl/core';
import {getPassthroughFS} from '@luma.gl/shadertools';
import {Model} from '../model/model';
import type { ModelProps } from '..';

/**
 * Properties for creating a {@link BufferTransform}
 * @deprecated
 */
export type BufferTransformProps = Omit<ModelProps, 'fs'> & {
  fs?: ModelProps['fs']; // override as optional
  feedbackBuffers?: Record<string, Buffer | BufferRange>;
};

/**
 * Options for running a {@link BufferTransform}
 * @deprecated
 */
export type BufferTransformRunOptions = {
  framebuffer?: Framebuffer;
  /** @deprecated Use uniform buffers for portability. */
  uniforms?: Record<string, any>;
  parameters?: RenderPassParameters;
  discard?: boolean;
};

/**
 * Creates a pipeline for buffer→buffer transforms.
 * @deprecated
 */
export class BufferTransform {
  readonly device: Device;
  readonly model: Model;
  readonly transformFeedback: TransformFeedback;

  /** @deprecated Use device feature test. */
  static isSupported(device: Device): boolean {
    return device.features.has('transform-feedback-webgl2');
  }

  constructor(device: Device, props: BufferTransformProps = Model.defaultProps) {
    assert(device.features.has('transform-feedback-webgl2'), 'Device must support transform feedback');

    this.device = device;

    this.model = new Model(this.device, {
      id: props.id || 'buffer-transform-model',
      fs: props.fs || getPassthroughFS({version: 300}),
      topology: props.topology || 'point-list',
      ...props,
    });

    this.transformFeedback = this.device.createTransformFeedback({
      layout: this.model.pipeline.shaderLayout,
      buffers: props.feedbackBuffers,
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

  /** Run one transform loop. */
  run(options?: BufferTransformRunOptions): void {
    const {framebuffer, parameters, discard, uniforms} = options || {};
    const renderPass = this.device.beginRenderPass({framebuffer, parameters, discard});
    if (uniforms) this.model.setUniforms(uniforms);
    this.model.draw(renderPass);
    renderPass.end();
  }

  /** swap resources if a map is provided */
  swap(): void {
    throw new Error('Not implemented');
  }

  /** Returns the {@link Buffer} or {@link BufferRange} for given varying name. */
  getBuffer(varyingName: string): Buffer | BufferRange | null {
    return this.transformFeedback.getBuffer(varyingName);
  }

  readAsync(varyingName: string): Promise<Uint8Array> {
    const result = this.getBuffer(varyingName);
    if (result instanceof Buffer) {
      return result.readAsync();
    }
    const {buffer, byteOffset = 0, byteLength = buffer.byteLength} = result;
    return buffer.readAsync(byteOffset, byteLength);
  }
}
