// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {Buffer, type Device} from '@luma.gl/core';
import {
  GPUFFT2D,
  GPUCommandGraph,
  GraphVectorView,
  type GraphDataView
} from '@luma.gl/gpgpu/gpu-core';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

it.each([
  {width: 4, height: 8, batchCount: 1, chunked: false},
  {width: 4, height: 4, batchCount: 3, chunked: false},
  {width: 4, height: 8, batchCount: 2, chunked: true},
  {width: 4, height: 4, batchCount: 3, chunked: true}
])('GPUFFT2D graph roundtrip $width x $height, batches $batchCount, chunked $chunked', async ({
  width,
  height,
  batchCount,
  chunked
}) => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const graph = new GPUCommandGraph(device);
  const inputValues = new Float32Array(width * height * batchCount * 2);
  const expected: number[] = [];
  for (let batch = 0; batch < batchCount; batch++) {
    const values = makeComplexInput(width, height).map(value => value * (batch + 1));
    inputValues.set(values, batch * width * height * 2);
    expected.push(...makeCPUDFT2D(values, width, height, 'forward'));
  }
  const buffers: Buffer[] = [];
  const viewBuffers = new Map<GraphDataView<'float32x2'>, Buffer>();
  const createView = (id: string, values: Float32Array, split: number) => {
    const length = values.length / 2;
    const boundaries = chunked ? [0, split, length] : [0, length];
    const chunks: GraphDataView<'float32x2'>[] = [];
    for (let index = 1; index < boundaries.length; index++) {
      const first = boundaries[index - 1];
      const last = boundaries[index];
      // Protect sentinels around each borrowed span and exercise nonzero binding offsets.
      const data = new Float32Array((last - first) * 2 + 68).fill(987);
      data.set(values.subarray(first * 2, last * 2), 66);
      const buffer = device.createBuffer({
        data,
        usage: Buffer.STORAGE | Buffer.COPY_SRC | Buffer.COPY_DST
      });
      buffers.push(buffer);
      const chunk = graph.createDataView(
        graph.importBuffer(
          {id: `${id}-${index}`, byteLength: buffer.byteLength, usage: buffer.usage},
          buffer
        ),
        {format: 'float32x2', byteOffset: 264, length: last - first}
      );
      chunks.push(chunk);
      viewBuffers.set(chunk, buffer);
    }
    return chunked
      ? new GraphVectorView({
          id,
          name: id,
          format: 'float32x2',
          length,
          valueLength: length,
          stride: 2,
          byteStride: 8,
          rowByteLength: 8,
          data: chunks
        })
      : chunks[0];
  };
  const input = createView('input', inputValues, 5);
  const forward = createView('forward', new Float32Array(inputValues.length), 19);
  const inverse = createView('inverse', new Float32Array(inputValues.length), 11);
  graph.add([
    new GPUFFT2D({id: 'forward', input, output: forward, width, height, batchCount}),
    new GPUFFT2D({
      id: 'inverse',
      input: forward,
      output: inverse,
      width,
      height,
      batchCount,
      direction: 'inverse'
    })
  ]);
  const compiled = graph.compile();
  const readView = async (view: typeof input) => {
    const values: number[] = [];
    for (const chunk of view instanceof GraphVectorView ? view.data : [view]) {
      const buffer = viewBuffers.get(chunk)!;
      const bytes = await buffer.readAsync(chunk.byteOffset, chunk.length * 8);
      values.push(...new Float32Array(bytes.buffer, bytes.byteOffset, chunk.length * 2));
    }
    return values;
  };
  try {
    const encoder = device.createCommandEncoder();
    compiled.encode(encoder, {parameters: undefined});
    compiled.encode(encoder, {parameters: undefined});
    device.submit(encoder.finish());
    assertClose(await readView(forward), expected, 0.002, 'forward DFT');
    assertClose(await readView(inverse), Array.from(inputValues), 0.002, 'inverse roundtrip');
    assertClose(await readView(input), Array.from(inputValues), 0, 'borrowed input');
    for (const buffer of buffers) {
      const values = await readFloat32(buffer, buffer.byteLength / 4);
      expect(values.slice(0, 66).every(value => value === 987)).toBe(true);
      expect(values.slice(-2)).toEqual([987, 987]);
    }
  } finally {
    compiled.destroy();
    expect(buffers.every(buffer => !buffer.destroyed)).toBe(true);
    for (const buffer of buffers) buffer.destroy();
  }
});

it('GPUFFT2D graph compilation unwinds partially allocated parameters and scratch', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const inputBuffer = makeOutputBuffer(device, 'input', 128);
  const outputBuffer = makeOutputBuffer(device, 'output', 128);
  const graph = new GPUCommandGraph(device);
  const input = importView(graph, 'input', inputBuffer, 16);
  const output = importView(graph, 'output', outputBuffer, 16);
  graph.add(new GPUFFT2D({id: 'fft-failure', input, output, width: 4, height: 4}));
  const baseline = getResourceCount(device, 'Buffers');
  const original = device.createBuffer;
  const allocations: Buffer[] = [];
  device.createBuffer = function (props) {
    if (props.id === 'fft-failure-2-parameters') throw new Error('injected allocation failure');
    const buffer = original.call(this, props);
    allocations.push(buffer);
    return buffer;
  };
  try {
    expect(() => graph.compile()).toThrow(/injected allocation failure/);
    expect(allocations.length).toBeGreaterThanOrEqual(2);
    expect(allocations.every(buffer => buffer.destroyed)).toBe(true);
    expect(getResourceCount(device, 'Buffers')).toBe(baseline);
  } finally {
    device.createBuffer = original;
    inputBuffer.destroy();
    outputBuffer.destroy();
  }
});

it('GPUFFT2D rejects aliased, short, misaligned and foreign graph views', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const buffer = makeOutputBuffer(device, 'input', 128);
  const outputBuffer = makeOutputBuffer(device, 'output', 128);
  try {
    const graph = new GPUCommandGraph(device);
    const input = importView(graph, 'input', buffer, 16);
    const output = importView(graph, 'output', outputBuffer, 16);
    expect(() => graph.add(new GPUFFT2D({input, output: input, width: 4, height: 4}))).toThrow(
      /separate/
    );
    expect(() => new GPUFFT2D({input, output, width: 8, height: 4})).toThrow(/contain/);
    const misaligned = graph.createDataView(input.buffer, {
      format: 'float32x2',
      byteOffset: 4,
      length: 4
    });
    expect(() => new GPUFFT2D({input: misaligned, output, width: 2, height: 2})).toThrow(/aligned/);
    expect(() =>
      new GPUCommandGraph(device).add(new GPUFFT2D({input, output, width: 4, height: 4}))
    ).toThrow(/target graph/);
  } finally {
    buffer.destroy();
    outputBuffer.destroy();
  }
});

it('GPUFFT2D compiled graph preserves separate bindings in one command buffer', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) return;
  const firstValues = makeComplexInput(4, 4);
  const secondValues = firstValues.map(value => value * 3);
  const firstInput = device.createBuffer({data: firstValues, usage: Buffer.STORAGE});
  const secondInput = device.createBuffer({data: secondValues, usage: Buffer.STORAGE});
  const firstOutput = makeOutputBuffer(device, 'first-output', firstValues.byteLength);
  const secondOutput = makeOutputBuffer(device, 'second-output', firstValues.byteLength);
  const graph = new GPUCommandGraph(device);
  graph.add(
    new GPUFFT2D({
      width: 4,
      height: 4,
      input: importView(graph, 'input', firstInput, 16),
      output: importView(graph, 'output', firstOutput, 16)
    })
  );
  const compiled = await graph.compileAsync();
  try {
    const encoder = device.createCommandEncoder();
    compiled.encode(encoder, {parameters: undefined});
    compiled.encode(encoder, {
      parameters: undefined,
      buffers: {input: secondInput, output: secondOutput}
    });
    device.submit(encoder.finish());
    assertClose(
      await readFloat32(firstOutput, 32),
      makeCPUDFT2D(firstValues, 4, 4, 'forward'),
      0.002,
      'first binding'
    );
    assertClose(
      await readFloat32(secondOutput, 32),
      makeCPUDFT2D(secondValues, 4, 4, 'forward'),
      0.002,
      'second binding'
    );
  } finally {
    compiled.destroy();
    for (const buffer of [firstInput, secondInput, firstOutput, secondOutput]) buffer.destroy();
  }
});

function importView(graph: GPUCommandGraph, id: string, buffer: Buffer, length: number) {
  return graph.createDataView(
    graph.importBuffer({id, byteLength: buffer.byteLength, usage: buffer.usage}, buffer),
    {format: 'float32x2', length}
  );
}

function makeOutputBuffer(device: Device, id: string, byteLength: number): Buffer {
  return device.createBuffer({
    id,
    byteLength,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
}

function getResourceCount(device: Device, resourceType: string): number {
  return device.statsManager.getStats('Resource Counts').get(`${resourceType} Active`).count;
}

async function readFloat32(buffer: Buffer, length: number): Promise<number[]> {
  const bytes = await buffer.readAsync(0, length * Float32Array.BYTES_PER_ELEMENT);
  return Array.from(new Float32Array(bytes.buffer, bytes.byteOffset, length));
}

function makeComplexInput(width: number, height: number): Float32Array {
  const values = new Float32Array(width * height * 2);
  for (let yCoordinate = 0; yCoordinate < height; yCoordinate++) {
    for (let xCoordinate = 0; xCoordinate < width; xCoordinate++) {
      const complexIndex = yCoordinate * width + xCoordinate;
      values[complexIndex * 2] =
        Math.sin((xCoordinate + 1) * 0.7) + Math.cos((yCoordinate + 1) * 0.31);
      values[complexIndex * 2 + 1] = Math.cos((xCoordinate + yCoordinate + 1) * 0.19) * 0.25;
    }
  }
  return values;
}

function makeCPUDFT2D(
  input: Float32Array,
  width: number,
  height: number,
  direction: 'forward' | 'inverse'
): number[] {
  const output = new Array<number>(input.length).fill(0);
  const directionSign = direction === 'forward' ? -1 : 1;
  const normalizationScale = direction === 'inverse' ? 1 / (width * height) : 1;
  for (let outputY = 0; outputY < height; outputY++) {
    for (let outputX = 0; outputX < width; outputX++) {
      let real = 0;
      let imaginary = 0;
      for (let inputY = 0; inputY < height; inputY++) {
        for (let inputX = 0; inputX < width; inputX++) {
          const inputIndex = (inputY * width + inputX) * 2;
          const angle =
            directionSign *
            2 *
            Math.PI *
            ((outputX * inputX) / width + (outputY * inputY) / height);
          const cosine = Math.cos(angle);
          const sine = Math.sin(angle);
          real += input[inputIndex] * cosine - input[inputIndex + 1] * sine;
          imaginary += input[inputIndex] * sine + input[inputIndex + 1] * cosine;
        }
      }
      const outputIndex = (outputY * width + outputX) * 2;
      output[outputIndex] = real * normalizationScale;
      output[outputIndex + 1] = imaginary * normalizationScale;
    }
  }
  return output;
}

function assertClose(actual: number[], expected: number[], tolerance: number, label: string): void {
  let maximumError = 0;
  for (let valueIndex = 0; valueIndex < expected.length; valueIndex++) {
    maximumError = Math.max(maximumError, Math.abs(actual[valueIndex] - expected[valueIndex]));
  }
  expect(
    Boolean(maximumError <= tolerance),
    `${label} maximum error ${maximumError} is within ${tolerance}`
  ).toBe(true);
}
