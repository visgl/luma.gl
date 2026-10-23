// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Device,
  Buffer,
  BufferRange,
  TransformFeedback,
  RenderPassProps,
  assert
} from '@luma.gl/core';
import {getPassthroughFS} from '@luma.gl/shadertools';
import {GPUVectorModel} from '../model/gpu-vector-model';
import {DynamicBuffer} from '../dynamic-buffer/dynamic-buffer';
import {getGPUVectorModelBatches} from '../model/gpu-vector-model';
import type {GPUVectorModelProps, GPUVectorModelInputs} from '../model/gpu-vector-model';

const GL_INTERLEAVED_ATTRIBS = 0x8c8c;
const GL_SEPARATE_ATTRIBS = 0x8c8d;

/**
 * Properties for creating a {@link BufferTransform}
 * @note Only works under WebGL2.
 */
export type BufferTransformProps = Omit<GPUVectorModelProps, 'fs'> & {
  /** Borrowed contiguous vectors mapped to vertex-buffer layout names. */
  inputVectors?: GPUVectorModelInputs;
  /** Borrowed contiguous vectors mapped to transform-feedback varying names. */
  outputVectors?: GPUVectorModelInputs;
  /** Optional fragment shader - normally not used in transforms */
  fs?: GPUVectorModelProps['fs']; // override as optional
  /** bufferMode when binding varyings
   * https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/transformFeedbackVaryings
   */
  feedbackBufferMode?: 'interleaved' | 'separate';
  /** A list of named outputs corresponding to shader declarations (varyings in WebGL) */
  outputs?: string[];
  /** @deprecated Use `run({outputBuffers})` instead - Map of output buffers that the shaders will write results of computations to */
  feedbackBuffers?: Record<string, Buffer | BufferRange>;
};

/**
 * Manages a WebGL program (pipeline) for buffer→buffer transforms.
 * @note Only works under WebGL2.
 */
export class BufferTransform {
  readonly device: Device;
  readonly model: GPUVectorModel;
  readonly transformFeedback: TransformFeedback;

  static defaultProps: Required<BufferTransformProps> = {
    ...GPUVectorModel.defaultProps,
    inputVectors: undefined!,
    outputVectors: undefined!,
    feedbackBufferMode: 'separate',
    outputs: undefined!,
    feedbackBuffers: undefined!
  };

  static isSupported(device: Device): boolean {
    return device?.info?.type === 'webgl';
  }

  constructor(device: Device, props: BufferTransformProps = BufferTransform.defaultProps) {
    if (!BufferTransform.isSupported(device)) {
      throw new Error('BufferTransform not yet implemented on WebGPU');
    }

    this.device = device;
    const {inputVectors, outputVectors, ...modelProps} = props;

    this.model = new GPUVectorModel(this.device, {
      id: props.id || 'buffer-transform-model',
      fs: props.fs || getPassthroughFS(),
      topology: props.topology || 'point-list',
      varyings: props.outputs || props.varyings,
      ...modelProps,
      bufferMode:
        props.bufferMode ||
        (props.feedbackBufferMode === 'interleaved' ? GL_INTERLEAVED_ATTRIBS : GL_SEPARATE_ATTRIBS)
    });

    this.transformFeedback = this.device.createTransformFeedback({
      layout: this.model.pipeline.shaderLayout,
      // @ts-expect-error TODO
      buffers: props.feedbackBuffers
    });

    this.model.setTransformFeedback(this.transformFeedback);
    if (inputVectors) this.model.setGPUVectors(inputVectors, {count: 'vertex'});
    if (outputVectors) this.setOutputVectors(outputVectors);
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
  run(
    options?: RenderPassProps & {
      inputVectors?: GPUVectorModelInputs;
      outputVectors?: GPUVectorModelInputs;
      inputBuffers?: Record<string, Buffer>;
      outputBuffers?: Record<string, Buffer | BufferRange>;
    }
  ): void {
    const {inputVectors, outputVectors, inputBuffers, outputBuffers, ...renderPassProps} =
      options ?? {};
    if (inputBuffers) this.model.setAttributes(inputBuffers);
    if (inputVectors) this.model.setGPUVectors(inputVectors, {count: 'vertex'});
    if (outputBuffers) this.transformFeedback.setBuffers(outputBuffers);
    if (outputVectors) this.setOutputVectors(outputVectors);
    const renderPass = this.device.beginRenderPass({discard: true, ...renderPassProps});
    try {
      this.model.draw(renderPass);
    } finally {
      renderPass.end();
    }
  }

  /** Binds borrowed output ranges without taking ownership or repacking vector chunks. */
  setOutputVectors(vectors: GPUVectorModelInputs): void {
    // Vector output bindings describe separate, tightly packed transform-feedback streams.
    assert(this.model.pipeline.props.bufferMode !== GL_INTERLEAVED_ATTRIBS);
    const batches = getGPUVectorModelBatches(this.model.id, vectors);
    // A transform run binds one output range per varying; use table batches for chunked outputs.
    assert(batches.length <= 1);
    this.transformFeedback.setBuffers(
      Object.fromEntries(
        Object.entries(batches[0]?.data ?? {}).map(([name, data]) => {
          // Transform feedback writes each varying contiguously, without arbitrary per-row padding.
          assert(data.byteStride === data.rowByteLength);
          return [
            name,
            {
              buffer: data.buffer instanceof DynamicBuffer ? data.buffer.buffer : data.buffer,
              byteOffset: data.byteOffset,
              byteLength: data.length * data.byteStride
            }
          ];
        })
      )
    );
  }

  // DEPRECATED METHODS

  /** @deprecated App knows what buffers it is passing in - Returns the {@link Buffer} or {@link BufferRange} for given varying name. */
  getBuffer(varyingName: string): Buffer | BufferRange | null {
    return this.transformFeedback.getBuffer(varyingName);
  }

  /** @deprecated App knows what buffers it is passing in - Reads the {@link Buffer} or {@link BufferRange} for given varying name. */
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
