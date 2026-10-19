// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type CompiledGPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';

export function makeSpatialFixture(device: Device) {
  const graph = new GPUCommandGraph(device);
  const buffers: Buffer[] = [];
  let compiled: CompiledGPUCommandGraph<void> | undefined;
  function view<Format extends 'float32x3' | 'uint32' | 'float32'>(
    format: Format,
    data: Float32Array | Uint32Array,
    offset = 0
  ) {
    const bytes = new Uint8Array(
      Math.max(offset + data.byteLength, offset + (format === 'float32x3' ? 12 : 4))
    );
    bytes.set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength), offset);
    const buffer = device.createBuffer({
      data: bytes,
      usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
    });
    buffers.push(buffer);
    const handle = graph.importBuffer(
      {id: `buffer-${buffers.length}`, byteLength: buffer.byteLength, usage: buffer.usage},
      buffer
    );
    return {
      buffer,
      view: graph.createDataView(handle, {
        format,
        length: data.length / (format === 'float32x3' ? 3 : 1),
        byteOffset: offset
      })
    };
  }
  async function run(repetitions = 1) {
    compiled ??= graph.compile();
    for (let iteration = 0; iteration < repetitions; iteration++) {
      const encoder = device.createCommandEncoder();
      compiled.encode(encoder, {parameters: undefined});
      device.submit(encoder.finish());
    }
  }
  return {
    graph,
    view,
    run,
    destroy: () => {
      compiled?.destroy();
      buffers.forEach(buffer => buffer.destroy());
    }
  };
}

export async function readFloats(buffer: Buffer, offset = 0) {
  const bytes = await buffer.readAsync();
  return Array.from(
    new Float32Array(bytes.buffer, bytes.byteOffset + offset, (bytes.byteLength - offset) / 4)
  );
}
export async function readIntegers(buffer: Buffer, offset = 0) {
  const bytes = await buffer.readAsync();
  return Array.from(
    new Uint32Array(bytes.buffer, bytes.byteOffset + offset, (bytes.byteLength - offset) / 4)
  );
}
