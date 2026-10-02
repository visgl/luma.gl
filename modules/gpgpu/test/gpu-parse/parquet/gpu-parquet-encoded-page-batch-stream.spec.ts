import {expect, it} from 'vitest';
// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {GPUCommandGraph, type GraphDataView} from '@luma.gl/gpgpu/gpu-core';
import {
  GPUParquetEncodedPageBatchStream,
  getGPUParquetEncodedPageBatchLayoutKey,
  planGPUParquetEncodedPageBatch,
  type GPUParquetDecodedPage,
  type GPUParquetEncodedPageBatchStreamTicket,
  type LoadersGLParquetEncodedPageBatch
} from '@luma.gl/gpgpu/gpu-parse';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

it('GPUParquetEncodedPageBatchStream reuses slots with explicit backpressure', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;

  const firstValues = new Uint8Array(new Float32Array([1, 2]).buffer);
  const secondValues = new Uint8Array(new Float32Array([3, 4]).buffer);
  const firstPlan = planGPUParquetEncodedPageBatch(makeBatch(firstValues));
  const secondPlan = planGPUParquetEncodedPageBatch(makeBatch(secondValues));
  const incompatiblePlan = planGPUParquetEncodedPageBatch(
    makeBatch(new Uint8Array(new Float32Array([5, 6, 7]).buffer))
  );
  const outputBuffers: Buffer[] = [];
  const stream = new GPUParquetEncodedPageBatchStream<void, Buffer>(device, firstPlan, {
    id: 'gpu-parquet-stream-test',
    slotCount: 1,
    configureGraph: ({graph, batch, slotIndex}) => {
      const page = batch.pages[0] as GPUParquetDecodedPage;
      if (page.mode !== 'gpu' || page.values.layout !== 'packed-bytes') {
        throw new Error('Expected one fixed-width GPU page');
      }
      const outputBuffer = createReadbackBuffer(device, firstValues.byteLength);
      outputBuffers[slotIndex] = outputBuffer;
      addReadbackCopy(graph, page.values.values, outputBuffer, `stream-${slotIndex}`);
      return outputBuffer;
    },
    destroyOutput: output => output.destroy()
  });

  try {
    expect(getGPUParquetEncodedPageBatchLayoutKey(firstPlan)).toBe(
      getGPUParquetEncodedPageBatchLayoutKey(secondPlan)
    );
    expect(stream.isCompatible(secondPlan)).toBe(true);
    expect(stream.isCompatible(incompatiblePlan)).toBe(false);
    expect(stream.stats.slotCount).toBe(1);
    expect(stream.stats.graphNodeCounts).toHaveLength(1);
    expect(stream.stats.graphNodeCounts[0]).toBeGreaterThan(1);
    expect(stream.stats.transientByteLengths).toHaveLength(1);
    expect(stream.stats.pooledUploadAndTransientByteLength).toBe(
      stream.stats.uploadByteLengthPerSlot + stream.stats.transientByteLengths[0]
    );

    const firstTicket = stream.tryAcquire(firstPlan)!;
    expect(firstTicket).not.toBeNull();
    expect(stream.tryAcquire(secondPlan)).toBeNull();
    const waitingTicketPromise = stream.acquire(secondPlan);
    expect(stream.pendingAcquireCount).toBe(1);
    await executeTicket(device, firstTicket, firstValues);

    const secondTicket = await waitingTicketPromise;
    expect(stream.pendingAcquireCount).toBe(0);
    expect(secondTicket.output).toBe(firstTicket.output);
    await executeTicket(device, secondTicket, secondValues);
    expect(stream.availableSlotCount).toBe(1);
    expect(() => stream.tryAcquire(incompatiblePlan)).toThrow(/not compatible/);

    const cancelledTicket = stream.tryAcquire(firstPlan)!;
    const rejectedAcquire = stream.acquire(secondPlan);
    stream.destroy();
    await expect(rejectedAcquire).rejects.toThrow(/destroyed/);
    cancelledTicket.cancel();
  } finally {
    stream.destroy();
  }
  expect(outputBuffers[0].destroyed).toBe(true);
});

it('GPUParquetEncodedPageBatchStream requires explicit discard after an encode error', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;

  const values = new Uint8Array(new Float32Array([1, 2]).buffer);
  const plan = planGPUParquetEncodedPageBatch(makeBatch(values));
  const stream = new GPUParquetEncodedPageBatchStream(device, plan, {
    slotCount: 1,
    configureGraph: ({graph}) => {
      graph.addCopyPass({
        id: 'throw-after-earlier-decode-nodes',
        resources: [],
        compile: () => ({
          encode: () => {
            throw new Error('intentional encode failure');
          }
        })
      });
    }
  });

  try {
    const ticket = stream.tryAcquire(plan)!;
    const commandEncoder = device.createCommandEncoder({id: 'failed-stream-encoder'});
    expect(() => ticket.encode(commandEncoder, {parameters: undefined})).toThrow(
      /intentional encode failure/
    );
    expect(() => ticket.cancel()).toThrow(/unused/);
    expect(stream.availableSlotCount).toBe(0);
    ticket.discard();
    expect(stream.availableSlotCount).toBe(1);
  } finally {
    stream.destroy();
  }
});

async function executeTicket(
  device: Device,
  ticket: GPUParquetEncodedPageBatchStreamTicket<void, Buffer>,
  expectedValues: Uint8Array
): Promise<void> {
  const commandEncoder = device.createCommandEncoder({id: 'gpu-parquet-stream-encoder'});
  ticket.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
  const readPromise = ticket.output.readAsync();
  await ticket.releaseWhen(readPromise);
  const data = await readPromise;
  expect(
    Array.from(new Uint8Array(data.buffer, data.byteOffset, expectedValues.byteLength))
  ).toEqual(Array.from(expectedValues));
}

function makeBatch(decodedValues: Uint8Array): LoadersGLParquetEncodedPageBatch {
  const valueCount = decodedValues.byteLength / Float32Array.BYTES_PER_ELEMENT;
  const encodedValues = encodeByteStreamSplit(decodedValues, valueCount, 4);
  return {
    shape: 'parquet-encoded-pages',
    rowGroup: {rowCount: valueCount},
    projectedColumns: ['value'],
    filterColumns: [],
    columns: [
      {
        path: ['value'],
        physicalType: 'FLOAT',
        maxRepetitionLevel: 0,
        maxDefinitionLevel: 0,
        compression: 'UNCOMPRESSED',
        valueCount,
        pages: [
          {
            type: 'data-v2',
            pageOrdinal: 0,
            encoding: 'BYTE_STREAM_SPLIT',
            repetitionLevelEncoding: 'RLE',
            definitionLevelEncoding: 'RLE',
            compression: 'UNCOMPRESSED',
            compressionState: 'decompressed',
            valueCount,
            nonNullValueCount: valueCount,
            data: encodedValues,
            values: {byteOffset: 0, byteLength: encodedValues.byteLength},
            compressedByteLength: encodedValues.byteLength,
            uncompressedByteLength: encodedValues.byteLength
          }
        ]
      }
    ]
  };
}

function encodeByteStreamSplit(
  decoded: Uint8Array,
  valueCount: number,
  byteWidth: number
): Uint8Array {
  const encoded = new Uint8Array(decoded.length);
  for (let valueIndex = 0; valueIndex < valueCount; valueIndex++) {
    for (let byteIndex = 0; byteIndex < byteWidth; byteIndex++) {
      encoded[byteIndex * valueCount + valueIndex] = decoded[valueIndex * byteWidth + byteIndex];
    }
  }
  return encoded;
}

function createReadbackBuffer(device: Device, byteLength: number): Buffer {
  return device.createBuffer({byteLength, usage: Buffer.COPY_DST | Buffer.COPY_SRC});
}

function addReadbackCopy(
  graph: GPUCommandGraph,
  source: GraphDataView<'uint32'>,
  destination: Buffer,
  id: string
): void {
  const destinationHandle = graph.importBuffer(
    {id: `${id}-readback`, byteLength: destination.byteLength, usage: destination.usage},
    destination
  );
  graph.addCopyPass({
    id: `${id}-copy`,
    resources: [
      {buffer: source, usage: 'copy-source'},
      {buffer: destinationHandle, usage: 'copy-destination'}
    ],
    compile: () => ({
      encode: ({commandEncoder, getBuffer}) =>
        commandEncoder.copyBufferToBuffer({
          sourceBuffer: getBuffer(source),
          sourceOffset: source.byteOffset,
          destinationBuffer: getBuffer(destinationHandle),
          destinationOffset: 0,
          size: destination.byteLength
        })
    })
  });
}
