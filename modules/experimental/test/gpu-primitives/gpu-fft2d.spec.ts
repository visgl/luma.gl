// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer, type Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUFFT2D} from '@luma.gl/experimental';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';

test('GPUFFT2D matches a CPU DFT and composes forward/inverse passes in one encoder', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const width = 4;
  const height = 8;
  const inputValues = makeComplexInput(width, height);
  const expectedForward = makeCPUDFT2D(inputValues, width, height, 'forward');
  const transform = new GPUFFT2D(device, {id: 'gpu-fft2d-numerical-test', width, height});
  const inputBuffer = device.createBuffer({
    id: 'gpu-fft2d-input',
    data: inputValues,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const forwardBuffer = makeOutputBuffer(device, 'gpu-fft2d-forward', inputValues.byteLength);
  const inverseBuffer = makeOutputBuffer(device, 'gpu-fft2d-inverse', inputValues.byteLength);

  try {
    const commandEncoder = device.createCommandEncoder({id: 'gpu-fft2d-roundtrip'});
    t.equal(
      transform.encode(commandEncoder, {
        inputBuffer,
        outputBuffer: forwardBuffer,
        direction: 'forward'
      }),
      forwardBuffer,
      'forward encode returns the caller-owned output'
    );
    transform.encode(commandEncoder, {
      inputBuffer: forwardBuffer,
      outputBuffer: inverseBuffer,
      direction: 'inverse'
    });
    device.submit(commandEncoder.finish());

    const forwardValues = await readFloat32(forwardBuffer, inputValues.length);
    const inverseValues = await readFloat32(inverseBuffer, inputValues.length);
    assertClose(t, forwardValues, expectedForward, 0.0005, 'forward transform');
    assertClose(t, inverseValues, Array.from(inputValues), 0.0005, 'inverse round trip');
    t.equal(transform.stats.passCount, 7, 'rectangular transform reports every dispatch');
    t.equal(
      transform.stats.scratchBufferByteLength,
      inputValues.byteLength,
      'one complex field of scratch is owned'
    );
  } finally {
    transform.destroy();
    transform.destroy();
    inputBuffer.destroy();
    forwardBuffer.destroy();
    inverseBuffer.destroy();
  }
  t.end();
});

test('GPUFFT2D rejects aliased and incompatible caller buffers', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const transform = new GPUFFT2D(device, {width: 2, height: 2});
  const validBuffer = device.createBuffer({
    byteLength: transform.stats.complexBufferByteLength,
    usage: Buffer.STORAGE
  });
  const shortBuffer = device.createBuffer({byteLength: 8, usage: Buffer.STORAGE});
  const copyOnlyBuffer = device.createBuffer({
    byteLength: transform.stats.complexBufferByteLength,
    usage: Buffer.COPY_DST
  });

  try {
    t.throws(
      () =>
        transform.encode(device.commandEncoder, {
          inputBuffer: validBuffer,
          outputBuffer: validBuffer
        }),
      /must be separate/,
      'in-place aliasing is rejected'
    );
    t.throws(
      () =>
        transform.encode(device.commandEncoder, {
          inputBuffer: shortBuffer,
          outputBuffer: validBuffer
        }),
      /at least 32 bytes/,
      'short complex fields are rejected'
    );
    t.throws(
      () =>
        transform.encode(device.commandEncoder, {
          inputBuffer: copyOnlyBuffer,
          outputBuffer: validBuffer
        }),
      /Buffer.STORAGE/,
      'buffers without storage usage are rejected'
    );
    transform.destroy();
    t.throws(
      () =>
        transform.encode(device.commandEncoder, {
          inputBuffer: validBuffer,
          outputBuffer: shortBuffer
        }),
      /destroyed/,
      'destroyed transforms reject new work'
    );
  } finally {
    transform.destroy();
    validBuffer.destroy();
    shortBuffer.destroy();
    copyOnlyBuffer.destroy();
  }
  t.end();
});

test('GPUFFT2D construction unwinds partial GPU allocations', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const id = 'gpu-fft2d-allocation-failure';
  const activeBufferCount = getResourceCount(device, 'Buffers');
  const allocatedBuffers: Buffer[] = [];
  const originalCreateBuffer = device.createBuffer;
  const originalComputationDestroy = Computation.prototype.destroy;
  let computationDestroyCount = 0;

  device.createBuffer = ((props: Parameters<Device['createBuffer']>[0]) => {
    const bufferId = (props as {id?: string}).id;
    if (bufferId === `${id}-inverse-1-parameters`) {
      throw new Error('injected GPUFFT2D allocation failure');
    }
    const buffer = originalCreateBuffer.call(device, props);
    if (bufferId?.startsWith(id)) {
      allocatedBuffers.push(buffer);
    }
    return buffer;
  }) as Device['createBuffer'];
  Computation.prototype.destroy = function (): void {
    computationDestroyCount++;
    originalComputationDestroy.call(this);
  };

  try {
    t.throws(
      () => new GPUFFT2D(device, {id, width: 4, height: 4}),
      /injected GPUFFT2D allocation failure/,
      'the original allocation error is preserved'
    );
  } finally {
    device.createBuffer = originalCreateBuffer;
    Computation.prototype.destroy = originalComputationDestroy;
  }

  t.equal(allocatedBuffers.length, 4, 'scratch and completed parameter allocations were observed');
  t.ok(
    allocatedBuffers.every(buffer => buffer.destroyed),
    'every buffer allocated before the failure is destroyed'
  );
  t.equal(computationDestroyCount, 1, 'the partially initialized computation is destroyed');
  t.equal(
    getResourceCount(device, 'Buffers'),
    activeBufferCount,
    'active buffer accounting returns to its baseline'
  );
  t.end();
});

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

function assertClose(
  t: {ok(value: unknown, message?: string): void},
  actual: number[],
  expected: number[],
  tolerance: number,
  label: string
): void {
  let maximumError = 0;
  for (let valueIndex = 0; valueIndex < expected.length; valueIndex++) {
    maximumError = Math.max(maximumError, Math.abs(actual[valueIndex] - expected[valueIndex]));
  }
  t.ok(maximumError <= tolerance, `${label} maximum error ${maximumError} is within ${tolerance}`);
}
