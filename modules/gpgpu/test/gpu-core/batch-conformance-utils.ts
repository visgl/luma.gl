// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUData, getGPUVectorFormatInfo} from '@luma.gl/gpgpu/gpu-data';
import {
  GPUCommandGraph,
  type GraphBufferHandle,
  type GraphDataView,
  type GraphVectorView
} from '@luma.gl/gpgpu/gpu-core';

/** Shared partition fixtures. Empty chunks retain their positions in the imported vector. */
export const BATCH_PARTITIONS = [
  {name: 'atomic', input: [6], paired: [6], atomic: true},
  {name: 'one chunk', input: [6], paired: [6]},
  {name: 'uneven', input: [2, 4], paired: [2, 4]},
  {name: 'empty chunks', input: [0, 2, 0, 4, 0], paired: [0, 2, 0, 4, 0]},
  {name: 'different boundaries', input: [2, 0, 4], paired: [0, 1, 3, 2]},
  {name: 'atomic input with vector peer', input: [6], paired: [1, 0, 5], atomic: true}
] as const;

type Format = 'uint32' | 'sint32' | 'float32' | 'float32x2' | 'float32x4';

/** Owns only test buffers, leaving production vector ownership and layout untouched. */
export class BatchConformanceFixture {
  readonly graph: GPUCommandGraph;
  readonly buffers: Buffer[] = [];
  readonly storage = new Map<GraphBufferHandle, Buffer>();
  constructor(readonly device: Device) {
    this.graph = new GPUCommandGraph(device);
  }

  column<T extends Format>(
    id: string,
    format: T,
    values: readonly number[],
    lengths: readonly number[],
    options: {atomic?: boolean; stride?: number} = {}
  ) {
    const components = getGPUVectorFormatInfo(format).byteLength / 4;
    const length = values.length / components;
    if (lengths.reduce((total, chunkLength) => total + chunkLength, 0) !== length) {
      throw new Error('Test partition must cover all rows');
    }
    const stride = options.stride ?? components;
    let offset = 0;
    const buffers: Buffer[] = [];
    const data = lengths.map(length => {
      const ArrayType =
        format === 'uint32' ? Uint32Array : format === 'sint32' ? Int32Array : Float32Array;
      // Prefix and padding sentinels expose accidental packed indexing of strided views.
      const storage = new ArrayType(Math.max(components, length * stride) + components).fill(999);
      for (let row = 0; row < length; row++) {
        for (let component = 0; component < components; component++) {
          storage[components + row * stride + component] =
            values[offset + row * components + component];
        }
      }
      offset += length * components;
      const buffer = this.device.createBuffer({
        data: storage,
        usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
      });
      this.buffers.push(buffer);
      buffers.push(buffer);
      return new GPUData({
        buffer,
        format,
        length,
        byteOffset: components * 4,
        byteStride: stride * 4
      });
    });
    const vector = this.graph.importGPUVector(id, {format, length, data});
    vector.data.forEach((chunk, index) => this.storage.set(chunk.buffer, buffers[index]));
    return options.atomic ? vector.data[0] : vector;
  }

  output<T extends Format>(id: string, format: T, length: number): GraphDataView<T> {
    return this.column(
      id,
      format,
      Array((length * getGPUVectorFormatInfo(format).byteLength) / 4).fill(77),
      [length],
      {
        atomic: true
      }
    ) as GraphDataView<T>;
  }

  capture<T extends Format>(id: string, source: GraphDataView<T>): GraphDataView<T> {
    const destination = this.output(id, source.format, source.length);
    this.graph.addCopyPass({
      id,
      resources: [
        {buffer: source, usage: 'copy-source'},
        {buffer: destination, usage: 'copy-destination'}
      ],
      compile: () => ({
        encode: ({commandEncoder, getBuffer}) => {
          commandEncoder.copyBufferToBuffer({
            sourceBuffer: getBuffer(source),
            sourceOffset: source.byteOffset,
            destinationBuffer: getBuffer(destination),
            destinationOffset: destination.byteOffset,
            size: source.length * source.rowByteLength
          });
        }
      })
    });
    return destination;
  }

  async read<T extends Format>(view: GraphDataView<T> | GraphVectorView<T>): Promise<number[]> {
    const data = 'data' in view ? view.data : [view];
    const values: number[] = [];
    for (const chunk of data) {
      if (!chunk.length) continue;
      const bytes = await this.storage.get(chunk.buffer)!.readAsync();
      const storage =
        chunk.format === 'uint32'
          ? new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4)
          : chunk.format === 'sint32'
            ? new Int32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4)
            : new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
      for (let row = 0; row < chunk.length; row++) {
        for (let component = 0; component < chunk.rowByteLength / 4; component++) {
          values.push(storage[chunk.byteOffset / 4 + (row * chunk.byteStride) / 4 + component]);
        }
      }
    }
    return values;
  }

  destroy(): void {
    for (const buffer of this.buffers) buffer.destroy();
  }
}
