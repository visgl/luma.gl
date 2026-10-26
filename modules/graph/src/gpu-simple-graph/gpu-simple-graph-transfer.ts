// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, Buffer, type Device, type SignedDataType} from '@luma.gl/core';
import type {TypedArray} from '@math.gl/core/types';
import {
  GPUDataEvaluator,
  GPUVectorEvaluator,
  Operation,
  type GPUEvaluationScope
} from '@luma.gl/gpgpu';
import type {GPUOperation, GPUOperationMetadata} from '@luma.gl/graph/gpu-core';
import type {GPUSimpleGraphEvaluator} from './gpu-simple-graph-operation';

/** CPU upload recipe. Data is borrowed until the first run; subsequent runs use cached results. */
export type GPUSimpleGraphUploadProps = {
  id: string;
  data: TypedArray | number[];
  type?: SignedDataType;
  size?: number;
  /** Source offset and stride in bytes, matching GPGPU array layout. */
  offset?: number;
  stride?: number;
  normalized?: boolean;
};

/** Declarative upload; compilation creates the internal evaluator without allocating GPU storage. */
export class GPUSimpleGraphUploadOperation implements GPUOperation {
  readonly id: string;
  readonly type = 'simple-graph-upload';
  constructor(readonly props: GPUSimpleGraphUploadProps) {
    this.id = props.id;
  }
  get metadata(): GPUOperationMetadata {
    return {outputs: [{name: this.id, kind: 'vector'}]};
  }
}

/** Copies a previously declared named value into independent, chunk-preserving storage. */
export class GPUSimpleGraphCopyOperation implements GPUOperation {
  readonly id: string;
  readonly type = 'simple-graph-copy';
  constructor(readonly props: {id: string; input: string}) {
    this.id = props.id;
  }
  get metadata(): GPUOperationMetadata {
    return {
      inputs: [{name: this.props.input, kind: 'vector'}],
      outputs: [{name: this.id, kind: 'vector'}]
    };
  }
}

/** Adapts existing evaluator execution and ownership to a GPU byte copy. @internal */
export function makeCopyEvaluator(
  input: GPUSimpleGraphEvaluator,
  owned: Set<GPUSimpleGraphEvaluator>
): GPUSimpleGraphEvaluator {
  const copyChunk = (chunk: GPUDataEvaluator): GPUDataEvaluator => {
    const result = new CopyEvaluatorOperation(chunk).output;
    owned.add(result);
    return result;
  };
  if (input instanceof GPUDataEvaluator) return copyChunk(input);
  const result = GPUVectorEvaluator.fromGPUDataEvaluators(input.gpuDataEvaluators.map(copyChunk), {
    format: input.format
  });
  owned.add(result);
  return result;
}

class CopyEvaluatorOperation extends Operation<{input: GPUDataEvaluator}> {
  readonly name = 'copy';
  readonly output: GPUDataEvaluator;
  constructor(input: GPUDataEvaluator) {
    super({input});
    this.output = new GPUDataEvaluator({
      source: this,
      type: input.type,
      size: input.size,
      length: input.length,
      normalized: input.normalized,
      isConstant: input.isConstant,
      format: input.format
    });
  }
  toString(): string {
    return 'copy';
  }
  override async execute(device: Device, target: Buffer, scope?: GPUEvaluationScope) {
    await this.inputs.input.evaluate(device, {scope});
    return this.copy(device, target, scope);
  }
  override executeSync(device: Device, target: Buffer) {
    this.inputs.input.evaluateSync(device);
    return this.copy(device, target);
  }
  private copy(device: Device, target: Buffer, scope?: GPUEvaluationScope) {
    const input = this.inputs.input;
    const output = this.output;
    const width = input.size * input.ValueType.BYTES_PER_ELEMENT;
    const contiguous = input.stride === width && output.stride === width;
    const size = contiguous ? width * input.length : width;
    // Copies preserve bytes, require distinct buffers, and never read back through the CPU.
    assert(input.buffer.device === device && target.device === device && input.buffer !== target);
    assert(output.offset >= 0 && Number.isInteger(output.offset));
    assert(output.stride >= width && Number.isInteger(output.stride));
    if (device.type === 'webgpu') {
      // WebGPU buffer copies require COPY usage and four-byte aligned offsets and sizes.
      assert(
        Boolean(input.buffer.usage & Buffer.COPY_SRC) && Boolean(target.usage & Buffer.COPY_DST)
      );
      assert(input.offset % 4 === 0 && output.offset % 4 === 0 && size % 4 === 0);
      assert(contiguous || (input.stride % 4 === 0 && output.stride % 4 === 0));
    }
    const encoder = scope?.commandEncoder ?? device.createCommandEncoder();
    try {
      for (let row = 0; row < input.length; row += contiguous ? input.length : 1) {
        encoder.copyBufferToBuffer({
          sourceBuffer: input.buffer,
          sourceOffset: input.offset + row * input.stride,
          destinationBuffer: target,
          destinationOffset: output.offset + row * output.stride,
          size
        });
      }
      if (!scope) device.submit(encoder.finish());
    } finally {
      if (!scope) encoder.destroy();
    }
    return {success: true};
  }
}
