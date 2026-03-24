// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable no-continue */

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {getTestDevices, getWebGPUTestDevice, getWebGLTestDevice} from '@luma.gl/test-utils';

import {TypedArray} from '@math.gl/types';
import {Buffer, Device} from '@luma.gl/core';
import {GL} from '@luma.gl/webgl/constants';

const DEVICE_TYPES = ['webgpu', 'webgl', 'null'] as const;

function getMemoryStats(device: Device): {
  gpuMemory: number;
  bufferMemory: number;
  referencedBufferMemory: number;
} {
  const stats = device.statsManager.getStats('GPU Time and Memory');
  return {
    gpuMemory: stats.get('GPU Memory').count,
    bufferMemory: stats.get('Buffer Memory').count,
    referencedBufferMemory: stats.get('Referenced Buffer Memory').count
  };
}

function getResourceStats(device: Device): {
  resourcesCreated: number;
  resourcesActive: number;
  buffersCreated: number;
  buffersActive: number;
} {
  const stats = device.statsManager.getStats('GPU Resource Counts');
  return {
    resourcesCreated: stats.get('Resources Created').count,
    resourcesActive: stats.get('Resources Active').count,
    buffersCreated: stats.get('Buffers Created').count,
    buffersActive: stats.get('Buffers Active').count
  };
}

function getStatNames(device: Device, statsName: string): string[] {
  return Object.keys(device.statsManager.getStats(statsName).stats);
}
function getLegacyResourceStats(device: Device) {
  return {
    resourcesCreated: device.statsManager.getStats('Resource Counts').get('Resources Created')
      .count,
    resourcesActive: device.statsManager.getStats('Resource Counts').get('Resources Active').count,
    buffersCreated: device.statsManager.getStats('Resource Counts').get('Buffers Created').count,
    buffersActive: device.statsManager.getStats('Resource Counts').get('Buffers Active').count
  };
}

test('Buffer#constructor/delete', async t => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    const buffer = device.createBuffer({usage: Buffer.VERTEX});
    // @ts-ignore handle
    t.ok(buffer.handle, `${device.type} Buffer construction successful`);

    buffer.destroy();
    // @ts-ignore handle
    t.ok(!buffer.handle, `${device.type} Buffer.destroy() successful`);

    buffer.destroy();
    // @ts-ignore handle
    t.ok(!buffer.handle, `${device.type} repeated Buffer.destroy() successful`);
  }
  t.end();
});

test('Buffer#constructor offset and size', async t => {
  const data = new Float32Array([1, 2, 3]);

  for (const device of await getTestDevices(DEVICE_TYPES)) {
    if (device.type === 'webgpu') {
      continue;
    }
    let buffer = device.createBuffer({data, byteOffset: 8});
    let expectedData = new Float32Array([0, 0, 1, 2, 3]);
    t.equal(
      buffer.byteLength,
      expectedData.byteLength,
      `${device.type} Buffer byteLength set properly`
    );

    let receivedData = await buffer.readAsync();
    t.deepEqual(
      new Float32Array(receivedData.buffer),
      expectedData,
      `${device.type} Buffer constructor offsets data`
    );
    buffer.destroy();

    buffer = device.createBuffer({data, byteLength: data.byteLength + 12});
    expectedData = new Float32Array([1, 2, 3, 0, 0, 0]);
    t.equal(
      buffer.byteLength,
      expectedData.byteLength,
      `${device.type} Buffer byteLength set properly`
    );

    receivedData = await buffer.readAsync();
    t.deepEqual(
      new Float32Array(receivedData.buffer),
      expectedData,
      `${device.type} Buffer constructor sets buffer data`
    );
    buffer.destroy();

    buffer = device.createBuffer({data, byteOffset: 8, byteLength: data.byteLength + 12});
    expectedData = new Float32Array([0, 0, 1, 2, 3, 0]);
    t.equal(
      buffer.byteLength,
      expectedData.byteLength,
      `${device.type} Buffer byteLength set properly`
    );

    receivedData = await buffer.readAsync();
    t.deepEqual(
      new Float32Array(receivedData.buffer),
      expectedData,
      `${device.type} Buffer constructor sets buffer byteLength and offsets data`
    );
    buffer.destroy();
  }
  t.end();
});

test('Buffer#write', async t => {
  const expectedData = new Float32Array([1, 2, 3]);
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    const buffer = device.createBuffer({
      usage: Buffer.VERTEX | Buffer.COPY_DST | Buffer.COPY_SRC,
      byteLength: 12
    });
    buffer.write(expectedData);
    const receivedData = await buffer.readAsync();
    t.deepEqual(
      new Float32Array(receivedData.buffer),
      expectedData,
      `${device.type} Buffer.write(ARRAY_BUFFER) stores correct bytes`
    );
    buffer.destroy();
  }
  t.end();
});

test('Buffer tracks GPU memory stats', async t => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    const beforeStats = getMemoryStats(device);
    const buffer = device.createBuffer({byteLength: 6, usage: Buffer.VERTEX});
    const expectedAllocation = device.type === 'webgpu' ? 8 : 6;
    const afterCreateStats = getMemoryStats(device);

    t.equal(
      afterCreateStats.gpuMemory - beforeStats.gpuMemory,
      expectedAllocation,
      `${device.type} Buffer updates total GPU Memory`
    );
    t.equal(
      afterCreateStats.bufferMemory - beforeStats.bufferMemory,
      expectedAllocation,
      `${device.type} Buffer updates Buffer Memory`
    );

    buffer.destroy();

    const afterDestroyStats = getMemoryStats(device);
    t.equal(
      afterDestroyStats.gpuMemory,
      beforeStats.gpuMemory,
      `${device.type} Buffer destroy restores total GPU Memory`
    );
    t.equal(
      afterDestroyStats.bufferMemory,
      beforeStats.bufferMemory,
      `${device.type} Buffer destroy restores Buffer Memory`
    );
  }

  t.end();
});

test('Handle-backed Buffer tracks referenced memory stats', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const beforeStats = getMemoryStats(device);
  const handle = device.handle.createBuffer({
    size: 12,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
  });

  const buffer = device.createBuffer({
    handle,
    byteLength: 12,
    usage: Buffer.VERTEX | Buffer.COPY_DST
  });
  const afterCreateStats = getMemoryStats(device);

  t.equal(
    afterCreateStats.gpuMemory - beforeStats.gpuMemory,
    12,
    'webgpu handle-backed Buffer updates total GPU Memory'
  );
  t.equal(
    afterCreateStats.bufferMemory - beforeStats.bufferMemory,
    0,
    'webgpu handle-backed Buffer does not update owned Buffer Memory'
  );
  t.equal(
    afterCreateStats.referencedBufferMemory - beforeStats.referencedBufferMemory,
    12,
    'webgpu handle-backed Buffer updates Referenced Buffer Memory'
  );

  buffer.destroy();

  const afterDestroyStats = getMemoryStats(device);
  t.equal(
    afterDestroyStats.gpuMemory,
    beforeStats.gpuMemory,
    'webgpu handle-backed Buffer destroy restores total GPU Memory'
  );
  t.equal(
    afterDestroyStats.referencedBufferMemory,
    beforeStats.referencedBufferMemory,
    'webgpu handle-backed Buffer destroy restores Referenced Buffer Memory'
  );

  handle.destroy();
  t.end();
});

test('Buffer tracks resource counts in core stats', async t => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    const beforeStats = getResourceStats(device);
    const beforeLegacyStats = getLegacyResourceStats(device);
    const buffer = device.createBuffer({byteLength: 4, usage: Buffer.VERTEX});
    const afterCreateStats = getResourceStats(device);
    const afterCreateLegacyStats = getLegacyResourceStats(device);

    t.equal(
      afterCreateStats.resourcesCreated - beforeStats.resourcesCreated,
      1,
      `${device.type} Buffer increments total resources created`
    );
    t.equal(
      afterCreateStats.resourcesActive - beforeStats.resourcesActive,
      1,
      `${device.type} Buffer increments total resources active`
    );
    t.equal(
      afterCreateStats.buffersCreated - beforeStats.buffersCreated,
      1,
      `${device.type} Buffer increments Buffers Created`
    );
    t.equal(
      afterCreateStats.buffersActive - beforeStats.buffersActive,
      1,
      `${device.type} Buffer increments Buffers Active`
    );
    t.equal(
      afterCreateStats.resourcesCreated - beforeStats.resourcesCreated,
      afterCreateLegacyStats.resourcesCreated - beforeLegacyStats.resourcesCreated,
      `${device.type} Resource Created counter matches legacy bucket`
    );
    t.equal(
      afterCreateStats.resourcesActive - beforeStats.resourcesActive,
      afterCreateLegacyStats.resourcesActive - beforeLegacyStats.resourcesActive,
      `${device.type} Resource Active counter matches legacy bucket`
    );
    t.equal(
      afterCreateStats.buffersCreated - beforeStats.buffersCreated,
      afterCreateLegacyStats.buffersCreated - beforeLegacyStats.buffersCreated,
      `${device.type} Buffer Created counter matches legacy bucket`
    );
    t.equal(
      afterCreateStats.buffersActive - beforeStats.buffersActive,
      afterCreateLegacyStats.buffersActive - beforeLegacyStats.buffersActive,
      `${device.type} Buffer Active counter matches legacy bucket`
    );

    buffer.destroy();

    const afterDestroyStats = getResourceStats(device);
    const afterDestroyLegacyStats = getLegacyResourceStats(device);
    t.equal(
      afterDestroyStats.resourcesCreated,
      afterCreateStats.resourcesCreated,
      `${device.type} Buffer destroy does not change total resources created`
    );
    t.equal(
      afterDestroyStats.resourcesActive,
      beforeStats.resourcesActive,
      `${device.type} Buffer destroy restores total resources active`
    );
    t.equal(
      afterDestroyStats.buffersCreated,
      afterCreateStats.buffersCreated,
      `${device.type} Buffer destroy does not change Buffers Created`
    );
    t.equal(
      afterDestroyStats.resourcesCreated,
      afterDestroyLegacyStats.resourcesCreated,
      `${device.type} Legacy and new buckets match on Resources Created`
    );
    t.equal(
      afterDestroyStats.buffersActive,
      beforeStats.buffersActive,
      `${device.type} Buffer destroy restores Buffers Active`
    );
    t.equal(
      afterDestroyStats.resourcesActive,
      afterDestroyLegacyStats.resourcesActive,
      `${device.type} Legacy and new buckets match on Resources Active`
    );
    t.equal(
      afterDestroyStats.buffersCreated,
      afterDestroyLegacyStats.buffersCreated,
      `${device.type} Legacy and new buckets match on Buffers Created`
    );
    t.equal(
      afterDestroyStats.buffersActive,
      afterDestroyLegacyStats.buffersActive,
      `${device.type} Legacy and new buckets match on Buffers Active`
    );
  }

  t.end();
});

test('Core stats use canonical resource ordering', async t => {
  for (const device of await getTestDevices(['null'])) {
    const buffer = device.createBuffer({byteLength: 4, usage: Buffer.VERTEX});

    t.deepEqual(
      getStatNames(device, 'Resource Counts').slice(0, 14),
      [
        'Resources Created',
        'Resources Active',
        'Buffers Created',
        'Buffers Active',
        'Textures Created',
        'Textures Active',
        'Samplers Created',
        'Samplers Active',
        'TextureViews Created',
        'TextureViews Active',
        'Framebuffers Created',
        'Framebuffers Active',
        'QuerySets Created',
        'QuerySets Active'
      ],
      'core Resource Counts stats use canonical ordering'
    );

    t.deepEqual(
      getStatNames(device, 'GPU Time and Memory').slice(0, 12),
      [
        'Adapter',
        'GPU',
        'GPU Type',
        'GPU Backend',
        'Frame Rate',
        'CPU Time',
        'GPU Time',
        'GPU Memory',
        'Buffer Memory',
        'Texture Memory',
        'Referenced Buffer Memory',
        'Referenced Texture Memory'
      ],
      'GPU Time and Memory stats use canonical ordering'
    );

    buffer.destroy();
  }

  t.end();
});

test('Buffer#readAsync', async t => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    let data: TypedArray = new Float32Array([1, 2, 3, 4]);

    let buffer = device.createBuffer({data, usage: Buffer.COPY_SRC | Buffer.COPY_DST});

    // Full read
    let receivedData = await buffer.readAsync();
    let f32Data = new Float32Array(receivedData.buffer);
    let expectedData = new Float32Array([1, 2, 3, 4]);
    t.deepEqual(
      f32Data,
      expectedData,
      `${device.type} Buffer.readAsync: default parameters successful`
    );

    // Read with byteOffset (skip 1 float = 4 bytes)
    receivedData = await buffer.readAsync(8);
    f32Data = new Float32Array(receivedData.buffer);
    expectedData = new Float32Array([3, 4]);
    t.deepEqual(
      f32Data,
      expectedData,
      `${device.type} Buffer.readAsync: with byteOffset successful`
    );

    // Read with byteOffset and byteLength (read 2 floats = 8 bytes starting from offset 4)
    receivedData = await buffer.readAsync(8, 8);
    f32Data = new Float32Array(receivedData.buffer);
    expectedData = new Float32Array([3, 4]);
    t.deepEqual(
      f32Data,
      expectedData,
      `${device.type} Buffer.readAsync: with byteOffset + byteLength successful`
    );

    // Read 1 float starting at third float (offset 8)
    receivedData = await buffer.readAsync(8, 4);
    f32Data = new Float32Array(receivedData.buffer);
    expectedData = new Float32Array([3]);
    t.deepEqual(f32Data, expectedData, `${device.type} Buffer.readAsync: partial range successful`);

    // Uint8Array test
    data = new Uint8Array([128, 255, 1, 0]);
    buffer = device.createBuffer({data, usage: Buffer.COPY_SRC | Buffer.COPY_DST});
    receivedData = await buffer.readAsync();
    t.deepEqual(
      receivedData,
      data,
      `${device.type} Buffer.readAsync: Uint8Array input works correctly`
    );
  }

  t.end();
});

test('Buffer#mapAndWriteAsync (full and partial)', async t => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    const isWebGPU = device.type === 'webgpu';
    const mapped = isWebGPU ? 'mapped' : 'copied';

    // Full write test
    const buffer = device.createBuffer({byteLength: 16, usage: Buffer.COPY_DST | Buffer.COPY_SRC});

    await buffer.mapAndWriteAsync((arrayBuffer, lifetime) => {
      t.ok(
        arrayBuffer instanceof ArrayBuffer,
        `${device.type} mapAndWriteAsync calls with ArrayBuffer`
      );
      t.equal(
        arrayBuffer.byteLength,
        16,
        `${device.type} mapAndWriteAsync calls with correct byteLength`
      );
      t.equal(lifetime, mapped, `${device.type} mapAndWriteAsync calls with correct lifetime`);
      new Float32Array(arrayBuffer).set([1, 2, 3, 4]);
    });

    const result = await buffer.readAsync(0, 16);
    t.deepEqual(
      new Float32Array(result.buffer),
      new Float32Array([1, 2, 3, 4]),
      `${device.type} full mapAndWriteAsync writes correct data`
    );

    // Partial write test (8 bytes = two floats)
    await buffer.mapAndWriteAsync(
      (arrayBuffer, lifetime) => {
        t.equal(arrayBuffer.byteLength, 8, `${device.type} partial buffer is correct size`);
        new Float32Array(arrayBuffer).set([9, 10]);
      },
      8,
      8
    );

    const partial = await buffer.readAsync();
    t.deepEqual(
      new Float32Array(partial.buffer),
      new Float32Array([1, 2, 9, 10]),
      `${device.type} partial mapAndWriteAsync writes correct slice`
    );

    buffer.destroy();
  }

  t.end();
});

test('Buffer#mapAndReadAsync (full and partial)', async t => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    const isWebGPU = device.type === 'webgpu';
    const initialData = new Float32Array([10, 20, 30, 40]);
    const buffer = device.createBuffer({
      data: initialData,
      usage: Buffer.COPY_DST | Buffer.COPY_SRC
    });

    // Test full map
    const fullResult = await buffer.mapAndReadAsync((arrayBuffer, lifetime) => {
      t.ok(
        arrayBuffer instanceof ArrayBuffer,
        `${device.type} full mapAndReadAsync returns ArrayBuffer`
      );
      t.equal(
        lifetime,
        isWebGPU ? 'mapped' : 'copied',
        `${device.type} full mapAndReadAsync returns correct lifetime`
      );
      return new Float32Array(arrayBuffer.slice());
    });
    t.deepEqual(fullResult, initialData, `${device.type} full mapAndReadAsync correct`);

    // Test partial map (byteOffset: 8 bytes, byteLength: 8 bytes = [20, 30])
    const expected = new Float32Array([30, 40]);
    const result = await buffer.mapAndReadAsync(
      arrayBuffer => new Float32Array(arrayBuffer.slice()),
      8,
      8
    );
    t.deepEqual(result, expected, `${device.type} partial mapAndReadAsync correct`);

    buffer.destroy();
  }

  t.end();
});

test('Buffer#mapAndReadAsync (WebGPU alignment cases)', async t => {
  const webgpuDevice = await getWebGPUTestDevice();

  if (!webgpuDevice) {
    t.comment('WebGPU test device unavailable');
    t.end();
    return;
  }

  const initialData = new Uint8Array(32);
  for (let index = 0; index < initialData.length; index++) {
    initialData[index] = index;
  }

  const buffer = webgpuDevice.createBuffer({
    data: initialData,
    usage: Buffer.COPY_DST | Buffer.COPY_SRC
  });

  const alignmentCases: Array<{
    byteOffset: number;
    byteLength: number;
    expectedLifetime: 'mapped' | 'copied';
  }> = [
    {byteOffset: 0, byteLength: 8, expectedLifetime: 'mapped'},
    {byteOffset: 0, byteLength: 3, expectedLifetime: 'copied'},
    {byteOffset: 2, byteLength: 4, expectedLifetime: 'copied'},
    {byteOffset: 1, byteLength: 7, expectedLifetime: 'copied'},
    {byteOffset: 8, byteLength: 4, expectedLifetime: 'mapped'},
    {byteOffset: 14, byteLength: 2, expectedLifetime: 'copied'},
    {byteOffset: 24, byteLength: 1, expectedLifetime: 'copied'}
  ];

  for (const alignmentCase of alignmentCases) {
    const expected = initialData.slice(
      alignmentCase.byteOffset,
      alignmentCase.byteOffset + alignmentCase.byteLength
    );
    const result = await buffer.mapAndReadAsync(
      (arrayBuffer, lifetime) => {
        t.equal(
          arrayBuffer.byteLength,
          alignmentCase.byteLength,
          'callback receives requested byte range'
        );
        t.equal(
          lifetime,
          alignmentCase.expectedLifetime,
          `lifetime is ${alignmentCase.expectedLifetime} for offset ${alignmentCase.byteOffset}, length ${alignmentCase.byteLength}`
        );
        return new Uint8Array(arrayBuffer.slice());
      },
      alignmentCase.byteOffset,
      alignmentCase.byteLength
    );

    t.deepEqual(
      result,
      expected,
      `WebGPU buffer mapAndReadAsync returns exact slice (${alignmentCase.byteOffset}, ${alignmentCase.byteLength})`
    );
  }

  buffer.destroy();
  t.end();
});

test('Buffer#mapAndReadAsync (WebGPU invalid range)', async t => {
  const webgpuDevice = await getWebGPUTestDevice();

  if (!webgpuDevice) {
    t.comment('WebGPU test device unavailable');
    t.end();
    return;
  }

  const buffer = webgpuDevice.createBuffer({
    data: new Uint8Array([1, 2, 3, 4]),
    usage: Buffer.COPY_DST | Buffer.COPY_SRC
  });

  let threw = false;
  try {
    await buffer.mapAndReadAsync(() => new Uint8Array(0), 2, 8);
  } catch (error) {
    threw = true;
    t.match(String(error), /exceeds buffer size/, 'out-of-range map request throws');
  }

  t.ok(threw, 'invalid range throws');
  buffer.destroy();
  t.end();
});

test('WebGPUBuffer#paddedByteLength', async t => {
  const webgpuDevice = await getWebGPUTestDevice();

  if (!webgpuDevice) {
    t.comment('WebGPU test device unavailable');
    t.end();
    return;
  }

  const buffer = webgpuDevice.createBuffer({
    byteLength: 13,
    usage: Buffer.COPY_DST | Buffer.COPY_SRC
  });

  t.equal(
    (buffer as unknown as {paddedByteLength: number}).paddedByteLength,
    16,
    'WebGPUBuffer paddedByteLength is 4-byte aligned'
  );
  t.equal(buffer.byteLength, 13, 'webgpu buffer byteLength remains user requested');

  buffer.destroy();
  t.end();
});

test('Buffer#debugData', async t => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    // TODO - debugData not updated on WebGPU
    if (device.type !== 'webgl') {
      continue;
    }
    const buffer = device.createBuffer({usage: Buffer.VERTEX, byteLength: 24});
    t.equal(
      buffer.debugData.byteLength,
      24,
      `${device.type} Buffer.debugData is not null before write`
    );

    const expectedData = new Float32Array([0, 0, 1, 2, 3]);
    buffer.write(expectedData);
    const f32Data = new Float32Array(buffer.debugData);
    t.deepEqual(f32Data, expectedData, `${device.type} Buffer.debugData is null after write`);

    // TODO - not a very useful test, should test that debugData is updated after read
    await buffer.readAsync();
    t.equal(buffer.debugData.byteLength, 24, `${device.type} Buffer.debugData is valid after read`);

    buffer.destroy();
  }

  t.end();
});

// WEBGL specific tests

test('WEBGLBuffer#construction', async t => {
  const webglDevice = await getWebGLTestDevice();

  let buffer;

  buffer = webglDevice.createBuffer({usage: Buffer.VERTEX, data: new Float32Array([1, 2, 3])});
  t.ok(
    buffer.glTarget === GL.ARRAY_BUFFER,
    `${webglDevice.info.type} Buffer(ARRAY_BUFFER) successful`
  );
  buffer.destroy();

  // TODO - buffer could check for integer ELEMENT_ARRAY_BUFFER types
  buffer = webglDevice.createBuffer({usage: Buffer.INDEX, data: new Uint32Array([1, 2, 3])});
  t.ok(
    buffer.glTarget === GL.ELEMENT_ARRAY_BUFFER,
    `${webglDevice.info.type} Buffer(ELEMENT_ARRAY_BUFFER) successful`
  );

  buffer.destroy();

  t.end();
});

test('Buffer#uint8 index buffer conversion', async t => {
  for (const device of await getTestDevices(DEVICE_TYPES)) {
    const uint8Indices = new Uint8Array([0, 1, 2, 3, 255]);
    const buffer = device.createBuffer({
      usage: Buffer.INDEX | Buffer.COPY_SRC | Buffer.COPY_DST,
      data: uint8Indices
    });

    t.equal(buffer.indexType, 'uint16', `${device.type} uint8 indices converted to uint16`);

    // Verify the data was correctly converted
    const readData = await buffer.readAsync();
    const uint16View = new Uint16Array(readData.buffer);
    t.deepEqual(
      Array.from(uint16View),
      [0, 1, 2, 3, 255],
      `${device.type} uint8 data correctly converted to uint16`
    );
    buffer.destroy();
  }
  t.end();
});
