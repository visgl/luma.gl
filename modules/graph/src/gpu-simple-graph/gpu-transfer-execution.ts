// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import type {GPUVector} from '@luma.gl/graph/gpu-data';
import {GPUCopyOperation, GPUUploadOperation} from '../gpu-core/gpu-transfer-operation';
import type {GPUEvaluationScope} from './operation/gpu-evaluation-scope';

/** SimpleGraph transfer execution; evaluator APIs and caching are unchanged. @internal */
export function executeGPUTransfer(
  device: Device,
  operation: GPUUploadOperation | GPUCopyOperation,
  values: ReadonlyMap<string, GPUVector | number>,
  scope?: GPUEvaluationScope
): void {
  const output = values.get(operation.output) as GPUVector;
  if (operation instanceof GPUUploadOperation) {
    const chunks = operation.getData();
    for (const [index, chunk] of output.data.entries()) {
      if (!chunk.length) continue;
      if (chunk.byteStride === chunk.rowByteLength)
        chunk.buffer.write(chunks[index], chunk.byteOffset);
      else
        for (let row = 0; row < chunk.length; row++) {
          chunk.buffer.write(
            chunks[index].subarray(row * chunk.rowByteLength, (row + 1) * chunk.rowByteLength),
            chunk.byteOffset + row * chunk.byteStride
          );
        }
    }
    return;
  }
  const input = values.get(operation.input) as GPUVector;
  const encoder = scope?.commandEncoder ?? device.createCommandEncoder();
  try {
    for (const [index, source] of input.data.entries()) {
      const destination = output.data[index];
      const packed =
        source.byteStride === source.rowByteLength &&
        destination.byteStride === destination.rowByteLength;
      for (let row = 0; row < source.length; row += packed ? source.length : 1) {
        encoder.copyBufferToBuffer({
          sourceBuffer: source.buffer instanceof Buffer ? source.buffer : source.buffer.buffer,
          sourceOffset: source.byteOffset + row * source.byteStride,
          destinationBuffer:
            destination.buffer instanceof Buffer ? destination.buffer : destination.buffer.buffer,
          destinationOffset: destination.byteOffset + row * destination.byteStride,
          size: source.rowByteLength * (packed ? source.length : 1)
        });
      }
    }
    if (!scope) device.submit(encoder.finish());
  } finally {
    if (!scope) encoder.destroy();
  }
}
