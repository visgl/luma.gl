// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {assert, Buffer} from '@luma.gl/core';
import type {GPUOperationLoweringContext} from './gpu-graph-lowering';
import {GPUUploadOperation, GPUCopyOperation} from './gpu-transfer-operation';

/** WebGPU transfers participate in command ordering and caller-owned encoding. @internal */
export function lowerGPUUpload<Parameters>(
  operation: GPUUploadOperation,
  context: GPUOperationLoweringContext<Parameters>
): void {
  const output = context.resolveVector(operation.output);
  const chunks = operation.getData();
  for (const [index, destination] of output.data.entries()) {
    if (!destination.length) continue;
    const data = chunks[index];
    context.graph.addCopyPass({
      id: `${operation.id}-${index}`,
      resources: [{buffer: destination, usage: 'copy-destination'}],
      compile: ({device}) => {
        const staging = device.createBuffer({data, usage: Buffer.COPY_SRC});
        return {
          encode: ({commandEncoder, getBuffer}) => {
            const packed = destination.byteStride === destination.rowByteLength;
            for (let row = 0; row < destination.length; row += packed ? destination.length : 1) {
              commandEncoder.copyBufferToBuffer({
                sourceBuffer: staging,
                sourceOffset: row * destination.rowByteLength,
                destinationBuffer: getBuffer(destination),
                destinationOffset: destination.byteOffset + row * destination.byteStride,
                size: packed ? data.byteLength : destination.rowByteLength
              });
            }
          },
          destroy: () => staging.destroy()
        };
      }
    });
  }
}

/** @internal */
export function lowerGPUCopy<Parameters>(
  operation: GPUCopyOperation,
  context: GPUOperationLoweringContext<Parameters>
): void {
  const input = context.resolveVector(operation.input);
  const output = context.resolveVector(operation.output);
  // Copy preserves each chunk and row; no repartitioning or format conversion.
  assert(input.format === output.format && input.data.length === output.data.length);
  for (const [index, source] of input.data.entries()) {
    const destination = output.data[index];
    assert(source.length === destination.length);
    if (!source.length) continue;
    context.graph.addCopyPass({
      id: `${operation.id}-${index}`,
      resources: [
        {buffer: source, usage: 'copy-source'},
        {buffer: destination, usage: 'copy-destination'}
      ],
      compile: () => ({
        encode: ({commandEncoder, getBuffer}) => {
          const packed =
            source.byteStride === source.rowByteLength &&
            destination.byteStride === destination.rowByteLength;
          for (let row = 0; row < source.length; row += packed ? source.length : 1) {
            commandEncoder.copyBufferToBuffer({
              sourceBuffer: getBuffer(source),
              sourceOffset: source.byteOffset + row * source.byteStride,
              destinationBuffer: getBuffer(destination),
              destinationOffset: destination.byteOffset + row * destination.byteStride,
              size: source.rowByteLength * (packed ? source.length : 1)
            });
          }
        }
      })
    });
  }
}
