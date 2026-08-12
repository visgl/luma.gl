// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device, Texture} from '@luma.gl/core';
import {DynamicBuffer, Model} from '@luma.gl/engine';
import {
  createTransientView,
  DispatchCommandBuffer,
  DrawCommandBuffer,
  GPUCommandGraph,
  type GPUCommandGraphContributor,
  GPUCompaction,
  GPUScan,
  GPUTextSelection,
  getViewBinding,
  getViewElementOffset
} from '@luma.gl/experimental';
import {GPUData, GPUVector} from '@luma.gl/tables';
import {getNullTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import test from 'test/utils/vitest-tape';
import {
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource
} from '../../src/gpu-primitives/gpu-dispatch-utils';
import {
  addGPUScanToGraphWithDispatchLimit,
  getGPUScanDispatchLayout,
  getGPUScanInvocationIndexSource,
  getGPUScanStrategy
} from '../../src/gpu-primitives/gpu-scan';

test('GPUCommandGraph compiles dependencies and reuses transient buffers', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'graph-scheduling-test'});
  const first = graph.createTransientBuffer({
    id: 'first',
    byteLength: 64,
    usage: Buffer.STORAGE
  });
  const second = graph.createTransientBuffer({
    id: 'second',
    byteLength: 128,
    usage: Buffer.STORAGE
  });
  graph.addComputePass({
    id: 'write-first',
    resources: [{buffer: first, usage: 'storage-write'}],
    compile: () => ({encode: () => {}})
  });
  graph.addComputePass({
    id: 'write-second',
    resources: [{buffer: second, usage: 'storage-write'}],
    compile: () => ({encode: () => {}})
  });
  graph.addComputePass({
    id: 'read-second',
    resources: [{buffer: second, usage: 'storage-read'}],
    compile: () => ({encode: () => {}})
  });

  const compiled = graph.compile();
  t.deepEqual(
    compiled.stats.nodeOrder,
    ['write-first', 'write-second', 'read-second'],
    'stable order includes inferred dependency'
  );
  t.equal(compiled.stats.logicalTransientBufferCount, 2, 'tracks two logical buffers');
  t.equal(compiled.stats.logicalBufferCount, 2, 'reports all logical buffers');
  t.equal(compiled.stats.importedBufferCount, 0, 'reports no imported buffers');
  t.equal(compiled.stats.physicalTransientBufferCount, 1, 'reuses one physical allocation');
  t.equal(compiled.stats.logicalTransientBytes, 192, 'reports logical bytes');
  t.equal(compiled.stats.logicalBufferBytes, 192, 'reports total logical buffer bytes');
  t.equal(compiled.stats.physicalTransientBytes, 128, 'reports physical bytes');
  t.equal(compiled.stats.logicalResourceBytes, 192, 'reports total logical resource bytes');
  t.equal(
    compiled.stats.physicalTransientResourceBytes,
    128,
    'reports total owned transient bytes'
  );
  const commandEncoder = device.createCommandEncoder({id: 'graph-scheduling-encoding'});
  const encoding = compiled.encode(commandEncoder, {parameters: undefined});
  t.equal(encoding.stats.computePassCount, 1, 'coalesces consecutive graph compute nodes');
  t.equal(encoding.stats.coalescedComputeNodeCount, 2, 'reports nodes sharing the physical pass');
  commandEncoder.destroy();
  compiled.destroy();
  t.end();
});

test('GPUCommandGraph reports adapter capabilities and explicit encoding timings', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const importedBuffer = device.createBuffer({
    id: 'graph-diagnostics-import',
    byteLength: 32,
    usage: Buffer.STORAGE
  });
  const graph = new GPUCommandGraph(device, {id: 'graph-diagnostics-test'});
  const imported = graph.importBuffer(
    {id: 'imported', byteLength: importedBuffer.byteLength, usage: Buffer.STORAGE},
    importedBuffer
  );
  graph.addComputePass({
    id: 'observe-import',
    resources: [{buffer: imported, usage: 'storage-read'}],
    compile: () => ({encode: () => {}})
  });
  graph.addCopyPass({
    id: 'cpu-only-copy',
    dependsOn: ['observe-import'],
    compile: () => ({encode: () => {}})
  });
  const compiled = graph.compile();

  t.equal(compiled.stats.importedBufferCount, 1, 'counts imported buffers');
  t.equal(compiled.stats.importedBufferBytes, 32, 'reports imported buffer capacity');
  t.equal(compiled.stats.logicalBufferBytes, 32, 'includes imports in logical memory');
  t.equal(
    compiled.capabilities.timestampQueries,
    device.features.has('timestamp-query'),
    'reports timestamp-query support'
  );
  t.equal(
    compiled.capabilities.subgroups,
    device.features.has('subgroups'),
    'reports subgroup device support'
  );
  t.equal(
    compiled.capabilities.subgroupId,
    device.wgslLanguageFeatures.has('subgroup_id'),
    'reports subgroup_id WGSL language support'
  );
  t.equal(
    compiled.capabilities.maxBufferByteLength,
    device.limits.maxBufferSize,
    'reports the device buffer limit'
  );

  const commandEncoder = device.createCommandEncoder({id: 'graph-diagnostics-encoding'});
  const encoding = compiled.encode(commandEncoder, {parameters: undefined});
  t.equal(encoding.stats.nodeCount, 2, 'reports every encoded node');
  t.equal(encoding.stats.computePassCount, 1, 'reports the number of physical compute passes');
  t.equal(encoding.stats.coalescedComputeNodeCount, 0, 'reports no merged standalone node');
  t.equal(encoding.stats.timestampedNodeCount, 0, 'does not invent GPU timestamps');
  t.notOk(encoding.canReadGPUTimings, 'plain encoders do not expose GPU timing readback');
  t.ok(encoding.stats.cpuEncodeTimeMilliseconds >= 0, 'reports total CPU encoding time');
  t.deepEqual(
    encoding.stats.nodes.map(node => [node.id, node.type, node.hasGPUTimestamps]),
    [
      ['observe-import', 'compute', false],
      ['cpu-only-copy', 'copy', false]
    ],
    'reports stable per-node encoding metadata'
  );
  commandEncoder.destroy();

  if (device.features.has('timestamp-query')) {
    const querySet = device.createQuerySet({
      id: 'graph-diagnostics-timestamps',
      type: 'timestamp',
      count: 2
    });
    const timestampEncoder = device.createCommandEncoder({
      id: 'graph-diagnostics-timestamp-encoding',
      timeProfilingQuerySet: querySet
    });
    const timestampEncoding = compiled.encode(timestampEncoder, {parameters: undefined});
    const commandBuffer = timestampEncoder.finish();
    device.submit(commandBuffer);
    const report = await timestampEncoding.readTimings();
    t.equal(
      timestampEncoding.stats.timestampedNodeCount,
      1,
      'timestamps render and compute passes'
    );
    t.ok(timestampEncoding.canReadGPUTimings, 'exposes explicit timing readback capability');
    t.ok(report.gpuTimeMilliseconds !== undefined, 'reads a total GPU duration after submission');
    t.ok(report.nodes[0].gpuTimeMilliseconds !== undefined, 'reads the compute node GPU duration');
    t.equal(report.nodes[1].gpuTimeMilliseconds, undefined, 'copy nodes remain CPU-timed');
    querySet.destroy();
  } else {
    t.comment('Timestamp queries are unavailable on this adapter');
  }

  compiled.destroy();
  importedBuffer.destroy();
  t.end();
});

test('GPUCommandGraph rejects explicit dependency cycles', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const graph = new GPUCommandGraph(device, {id: 'cycle-test'});
  graph.addCopyPass({
    id: 'left',
    dependsOn: ['right'],
    compile: () => ({encode: () => {}})
  });
  graph.addCopyPass({
    id: 'right',
    dependsOn: ['left'],
    compile: () => ({encode: () => {}})
  });
  t.throws(() => graph.compile(), /dependency cycle/, 'cycle is rejected');
  t.end();
});

test('GPUCommandGraph preserves fixed-width GPUVector chunks and borrowed ownership', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const sharedBuffer = device.createBuffer({byteLength: 16, usage: Buffer.STORAGE});
  const trailingBuffer = device.createBuffer({byteLength: 8, usage: Buffer.STORAGE});
  const firstChunk = new GPUData({
    buffer: sharedBuffer,
    format: 'uint32',
    length: 2,
    byteOffset: 0,
    ownsBuffer: true
  });
  const secondChunk = new GPUData({
    buffer: sharedBuffer,
    format: 'uint32',
    length: 2,
    byteOffset: 8
  });
  const thirdChunk = new GPUData({
    buffer: trailingBuffer,
    format: 'uint32',
    length: 2,
    ownsBuffer: true
  });
  const vector = new GPUVector({
    type: 'data',
    name: 'values',
    format: 'uint32',
    data: [firstChunk, secondChunk, thirdChunk],
    ownsData: true
  });
  const graph = new GPUCommandGraph(device, {id: 'gpu-vector-import-test'});
  const firstView = graph.importGPUData('first-data', firstChunk);
  const vectorView = graph.importGPUVector('values', vector);

  t.equal(firstView.format, 'uint32', 'GPUData format is preserved');
  t.equal(firstView.length, 2, 'GPUData length is preserved');
  t.equal(firstView.byteOffset, 0, 'GPUData byte offset is preserved');
  t.equal(firstView.byteStride, 4, 'GPUData byte stride is preserved');
  t.equal(vectorView.name, 'values', 'GPUVector name is preserved');
  t.equal(vectorView.length, 6, 'GPUVector row count is preserved');
  t.equal(vectorView.data.length, 3, 'GPUVector chunk count is preserved');
  t.equal(vectorView.data[0].buffer, firstView.buffer, 'reuses an already imported table buffer');
  t.equal(vectorView.data[0].buffer, vectorView.data[1].buffer, 'shared chunks share one handle');
  t.notEqual(
    vectorView.data[1].buffer,
    vectorView.data[2].buffer,
    'distinct buffers stay distinct'
  );
  t.equal(vectorView.data[1].byteOffset, 8, 'per-chunk byte offsets are preserved');

  graph.addCopyPass({
    id: 'read-first-chunk',
    dependsOn: ['gate'],
    resources: [{buffer: vectorView.data[0], usage: 'storage-read'}],
    compile: () => ({encode: () => {}})
  });
  graph.addCopyPass({
    id: 'write-second-chunk',
    resources: [{buffer: vectorView.data[1], usage: 'storage-write'}],
    compile: () => ({encode: () => {}})
  });
  graph.addCopyPass({id: 'gate', compile: () => ({encode: () => {}})});
  const compiled = graph.compile();
  t.deepEqual(
    compiled.stats.nodeOrder,
    ['gate', 'read-first-chunk', 'write-second-chunk'],
    'hazards are inferred through the shared physical buffer handle'
  );

  compiled.destroy();
  t.notOk(sharedBuffer.destroyed, 'compiled graph does not destroy borrowed shared storage');
  t.notOk(trailingBuffer.destroyed, 'compiled graph does not destroy borrowed trailing storage');
  vector.destroy();
  t.ok(sharedBuffer.destroyed, 'GPUVector retains shared-buffer ownership');
  t.ok(trailingBuffer.destroyed, 'GPUVector retains trailing-buffer ownership');
  t.end();
});

test('GPUCommandGraph rejects interleaved and variable-length GPUVector imports', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const interleaved = new GPUVector({
    type: 'interleaved',
    name: 'interleaved',
    buffer: device.createBuffer({byteLength: 16, usage: Buffer.STORAGE}),
    length: 2,
    byteStride: 8,
    attributes: [{attribute: 'value', format: 'uint32', byteOffset: 0}],
    ownsBuffer: true
  });
  const listData = new GPUData({
    buffer: device.createBuffer({byteLength: 8, usage: Buffer.STORAGE}),
    format: 'value-list<uint32>',
    length: 1,
    valueLength: 2,
    valueOffsets: new Int32Array([0, 2]),
    ownsBuffer: true
  });
  const variableLength = new GPUVector({
    type: 'data',
    name: 'variable-length',
    format: 'value-list<uint32>',
    data: [listData],
    ownsData: true
  });
  const graph = new GPUCommandGraph(device);

  t.throws(
    () => graph.importGPUVector('interleaved', interleaved),
    /does not accept interleaved/,
    'interleaved vectors require an explicit attribute adapter'
  );
  t.throws(
    () => graph.importGPUVector('variable-length', variableLength),
    /fixed-width GPUVector format/,
    'variable-length vectors require an explicit topology adapter'
  );

  interleaved.destroy();
  variableLength.destroy();
  t.end();
});

test('GPUCommandGraph exposes safe extension-library helpers', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const graph = new GPUCommandGraph(device);
  let contributorOutputUsage = 0;
  const contributor: GPUCommandGraphContributor = {
    addToGraph: targetGraph => {
      const output = createTransientView(
        targetGraph,
        'contributor-output',
        'uint32',
        3,
        Buffer.STORAGE | Buffer.INDIRECT
      );
      contributorOutputUsage = output.buffer.usage;
    }
  };
  contributor.addToGraph(graph);
  t.equal(
    contributorOutputUsage,
    Buffer.STORAGE | Buffer.INDIRECT,
    'contributors can request additional transient usage flags'
  );

  t.throws(
    () => createTransientView(graph, 'invalid-length', 'uint32', -1),
    /non-negative safe integer/,
    'negative transient lengths are rejected before graph allocation'
  );
  t.doesNotThrow(
    () => createTransientView(graph, 'invalid-length', 'uint32', 0),
    'a rejected transient does not reserve its graph resource id'
  );
  t.throws(
    () => createTransientView(graph, 'missing-storage', 'uint32', 1, Buffer.INDIRECT),
    /must include Buffer.STORAGE/,
    'typed transient views retain storage binding usage'
  );
  for (const [format, id] of [
    ['vertex-list<float32x3>', 'vertex-list-transient'],
    ['value-list<uint32>', 'value-list-transient']
  ] as const) {
    t.throws(
      () => Reflect.apply(createTransientView, undefined, [graph, id, format, 2]),
      /requires a fixed-width GPUVector format/,
      `${format} requires an explicit variable-length adapter`
    );
    t.doesNotThrow(
      () => createTransientView(graph, id, 'float32x3', 2),
      `${format} is rejected before reserving its graph resource id`
    );
  }

  const bindingBuffer = device.createBuffer({byteLength: 512, usage: Buffer.STORAGE});
  const bindingHandle = graph.importBuffer(
    {id: 'binding-buffer', byteLength: 512, usage: Buffer.STORAGE},
    bindingBuffer
  );
  const bindingView = graph.createDataView(bindingHandle, {
    format: 'uint32',
    length: 1,
    byteOffset: 260
  });
  const binding = getViewBinding(bindingView, () => bindingBuffer);
  t.equal(binding.offset, 256, 'storage binding starts at an aligned byte offset');
  t.equal(binding.size, 8, 'storage binding includes the view prefix and row');
  t.equal(getViewElementOffset(bindingView), 1, 'shader element offset addresses the view row');

  const misalignedView = graph.createDataView(bindingHandle, {
    format: 'uint32',
    length: 1,
    byteOffset: 261
  });
  t.throws(
    () => getViewElementOffset(misalignedView),
    /must be uint32-aligned/,
    'fractional shader element offsets are rejected'
  );
  const emptyEndView = graph.createDataView(bindingHandle, {
    format: 'uint32',
    length: 0,
    byteOffset: bindingHandle.byteLength
  });
  t.throws(
    () => getViewBinding(emptyEndView, () => bindingBuffer),
    /exceeds its logical buffer/,
    'empty views still require one bindable row inside the logical buffer'
  );

  bindingBuffer.destroy();
  t.end();
});

test('GPUCommandGraph validates resources and overlapping lifetimes', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const nullDevice = await getNullTestDevice();
  const wrongDeviceBuffer = nullDevice.createBuffer({byteLength: 16, usage: Buffer.STORAGE});
  const wrongDeviceGraph = new GPUCommandGraph(device);
  t.throws(
    () =>
      wrongDeviceGraph.importBuffer(
        {id: 'wrong-device', byteLength: 16, usage: Buffer.STORAGE},
        wrongDeviceBuffer
      ),
    /another device/,
    'wrong-device imports are rejected'
  );

  const validationGraph = new GPUCommandGraph(device);
  const copyOnly = validationGraph.createTransientBuffer({
    id: 'copy-only',
    byteLength: 16,
    usage: Buffer.COPY_DST
  });
  t.throws(
    () =>
      validationGraph.addComputePass({
        id: 'invalid-use',
        resources: [{buffer: copyOnly, usage: 'storage-read'}],
        compile: () => ({encode: () => {}})
      }),
    /does not declare usage/,
    'node uses must be compatible with descriptors'
  );
  const unaligned = validationGraph.createDataView(copyOnly, {
    format: 'uint32',
    length: 1,
    byteOffset: 2
  });
  t.throws(
    () => new GPUScan({input: unaligned, output: unaligned}),
    /uint32-aligned/,
    'uint32 algorithms reject misaligned views'
  );
  t.throws(
    () =>
      validationGraph.createDataView(copyOnly, {
        format: 'uint32',
        length: 4,
        byteOffset: 4
      }),
    /exceeds buffer/,
    'views cannot exceed logical capacity'
  );
  t.throws(
    () =>
      validationGraph.createDataView(copyOnly, {
        format: 'uint32',
        length: 1,
        byteOffset: Number.MAX_SAFE_INTEGER
      }),
    /safe integer precision/,
    'view byte ranges cannot overflow safe integer precision'
  );
  t.throws(
    () =>
      validationGraph.createTransientBuffer({
        id: 'oversized-buffer',
        byteLength: device.limits.maxBufferSize + 1,
        usage: Buffer.STORAGE
      }),
    /device buffer limit/,
    'logical buffers cannot exceed the adapter allocation limit'
  );
  t.throws(
    () =>
      validationGraph.createTransientTexture({
        id: 'oversized-texture',
        format: device.preferredColorFormat,
        width: device.limits.maxTextureDimension2D + 1,
        height: 1,
        usage: Texture.RENDER
      }),
    /device dimension limits/,
    'logical textures cannot exceed adapter dimension limits'
  );

  const overlapGraph = new GPUCommandGraph(device);
  const first = overlapGraph.createTransientBuffer({
    id: 'overlap-first',
    byteLength: 32,
    usage: Buffer.STORAGE
  });
  const second = overlapGraph.createTransientBuffer({
    id: 'overlap-second',
    byteLength: 32,
    usage: Buffer.STORAGE
  });
  overlapGraph.addComputePass({
    id: 'first-write',
    resources: [{buffer: first, usage: 'storage-write'}],
    compile: () => ({encode: () => {}})
  });
  overlapGraph.addComputePass({
    id: 'second-write',
    resources: [{buffer: second, usage: 'storage-write'}],
    compile: () => ({encode: () => {}})
  });
  overlapGraph.addComputePass({
    id: 'read-both',
    resources: [
      {buffer: first, usage: 'storage-read'},
      {buffer: second, usage: 'storage-read'}
    ],
    compile: () => ({encode: () => {}})
  });
  const overlapping = overlapGraph.compile();
  t.equal(
    overlapping.stats.physicalTransientBufferCount,
    2,
    'overlapping transient lifetimes use separate allocations'
  );
  overlapping.destroy();
  wrongDeviceBuffer.destroy();
  t.end();
});

test('CompiledGPUCommandGraph rejects encoding after device loss', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'device-loss-test'});
  graph.addCopyPass({id: 'copy', compile: () => ({encode: () => {}})});
  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'lost-device-encoding'});
  const existingDescriptor = Object.getOwnPropertyDescriptor(device, 'isLost');
  Object.defineProperty(device, 'isLost', {configurable: true, value: true});
  try {
    t.throws(
      () => compiled.encode(commandEncoder, {parameters: undefined}),
      /after device loss/,
      'device loss fails before resource resolution or command recording'
    );
  } finally {
    if (existingDescriptor) {
      Object.defineProperty(device, 'isLost', existingDescriptor);
    } else {
      Reflect.deleteProperty(device, 'isLost');
    }
  }
  commandEncoder.destroy();
  compiled.destroy();
  t.end();
});

test('CompiledGPUCommandGraph resolves DynamicBuffer replacements and preserves imports', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const dynamicBuffer = new DynamicBuffer(device, {
    id: 'dynamic-import',
    byteLength: 16,
    usage: Buffer.STORAGE
  });
  const graph = new GPUCommandGraph(device);
  const imported = graph.importBuffer(
    {id: 'dynamic', byteLength: 16, usage: Buffer.STORAGE},
    dynamicBuffer
  );
  const resolvedBuffers: Buffer[] = [];
  graph.addComputePass({
    id: 'observe-buffer',
    resources: [{buffer: imported, usage: 'storage-read'}],
    compile: () => ({encode: ({getBuffer}) => void resolvedBuffers.push(getBuffer(imported))})
  });
  const compiled = graph.compile();
  const firstBackingBuffer = dynamicBuffer.buffer;
  compiled.encode(device.createCommandEncoder({id: 'dynamic-first'}), {parameters: undefined});
  dynamicBuffer.resize({byteLength: 32});
  const secondBackingBuffer = dynamicBuffer.buffer;
  compiled.encode(device.createCommandEncoder({id: 'dynamic-second'}), {parameters: undefined});
  t.equal(resolvedBuffers[0], firstBackingBuffer, 'first encoding resolves initial backing buffer');
  t.equal(
    resolvedBuffers[1],
    secondBackingBuffer,
    'second encoding resolves replacement backing buffer'
  );
  compiled.destroy();
  t.notOk(secondBackingBuffer.destroyed, 'destroying graph leaves imported buffer alive');
  dynamicBuffer.destroy();

  const missingGraph = new GPUCommandGraph(device);
  missingGraph.importBuffer({id: 'required', byteLength: 16, usage: Buffer.STORAGE});
  const missingCompiled = missingGraph.compile();
  t.throws(
    () =>
      missingCompiled.encode(device.createCommandEncoder({id: 'missing-import'}), {
        parameters: undefined
      }),
    /is required/,
    'encoding rejects a missing import'
  );
  const undersized = device.createBuffer({byteLength: 4, usage: Buffer.STORAGE});
  t.throws(
    () =>
      missingCompiled.encode(device.createCommandEncoder({id: 'undersized-import'}), {
        parameters: undefined,
        buffers: {required: undersized}
      }),
    /smaller than compiled capacity/,
    'encoding rejects an undersized override'
  );
  missingCompiled.destroy();
  undersized.destroy();
  t.end();
});

test('GPUScan plans bounded multidimensional direct dispatches', t => {
  const maximum = 65_535;
  const oneDimensionalRowCapacity = maximum * 256;

  t.deepEqual(getGPUScanDispatchLayout(0, maximum), {x: 1, y: 1, z: 1});
  t.deepEqual(getGPUScanDispatchLayout(oneDimensionalRowCapacity, maximum), {
    x: maximum,
    y: 1,
    z: 1
  });
  t.deepEqual(getGPUScanDispatchLayout(oneDimensionalRowCapacity + 1, maximum), {
    x: maximum,
    y: 2,
    z: 1
  });
  t.deepEqual(
    getGPUScanDispatchLayout(4 * 256 + 1, 2),
    {x: 2, y: 2, z: 2},
    'a small synthetic limit exercises the third dispatch dimension'
  );
  t.throws(() => getGPUScanDispatchLayout(8 * 256 + 1, 2), /exceeding the 3D dispatch limit/);
  t.throws(
    () => getBoundedDispatchLayout('GPUScan', 1024, 3, maximum),
    /power of two greater than one/,
    'the shared uint32 guard rejects workgroup sizes that can wrap padded lanes'
  );
  t.throws(
    () => getBoundedInvocationIndexSource({x: 1, y: 1, z: 1}, 1),
    /power of two greater than one/,
    'the source helper never emits an unrepresentable 2^32 guard literal'
  );

  const source = getGPUScanInvocationIndexSource({x: 3, y: 2, z: 2});
  t.match(source, /workgroupId\.z \* 2u \+ workgroupId\.y/);
  t.match(source, /\* 3u \+ workgroupId\.x/);
  t.match(
    source,
    /workgroupIndex >= 16777216u/,
    'padded workgroups cannot wrap the uint32 invocation index'
  );
  t.ok(
    source.indexOf('workgroupIndex >= 16777216u') <
      source.indexOf('workgroupIndex * 256u + localInvocationIndex'),
    'the uint32 guard executes before invocation-index multiplication'
  );
  t.end();
});

test('GPUScan selects subgroups only when device and WGSL capabilities are both available', t => {
  const makeDevice = (subgroups: boolean, subgroupId: boolean) =>
    ({
      features: {has: (feature: string) => feature === 'subgroups' && subgroups},
      wgslLanguageFeatures: new Set(subgroupId ? ['subgroup_id'] : [])
    }) as Device;

  t.equal(getGPUScanStrategy(makeDevice(true, true)), 'subgroups', 'selects the fast path');
  t.equal(
    getGPUScanStrategy(makeDevice(true, false)),
    'portable',
    'requires the subgroup_id language extension'
  );
  t.equal(
    getGPUScanStrategy(makeDevice(false, true)),
    'portable',
    'requires the subgroup device feature'
  );
  t.equal(
    getGPUScanStrategy(makeDevice(true, true), true),
    'portable',
    'keeps segmented scans on the portable path'
  );
  t.end();
});

test('GPUScan executes multidimensional block and offset dispatches', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const length = 4 * 256 + 1;
  const values = Uint32Array.from({length}, (_, index) => (index % 11) + 1);
  const segmentFlags = new Uint32Array(length);
  for (const index of [0, 700]) {
    segmentFlags[index] = 1;
  }
  const result = await runScan(device, values, {
    mode: 'exclusive',
    segmentFlags,
    maxComputeWorkgroupsPerDimension: 2
  });

  t.deepEqual(
    result,
    getExpectedScan(values, 'exclusive', segmentFlags),
    'five block scans and their offset pass execute through a padded 2x2x2 layout'
  );
  t.end();
});

test('GPUScan preserves vector segments and carries through multidimensional passes', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const valueChunks = [
    Uint32Array.from([10]),
    Uint32Array.from({length: 4 * 256 + 1}, () => 1),
    Uint32Array.from([7])
  ];
  const segmentFlagChunks = valueChunks.map(chunk => new Uint32Array(chunk.length));
  segmentFlagChunks[1][700] = 1;
  const result = await runVectorScan(device, valueChunks, {
    mode: 'exclusive',
    segmentFlagChunks,
    maxComputeWorkgroupsPerDimension: 2
  });

  t.deepEqual(result.chunks[0], [0], 'the first chunk starts the vector-wide prefix');
  t.equal(result.chunks[1][0], 10, 'the preceding chunk carry reaches the 3D-dispatched chunk');
  t.equal(result.chunks[1][699], 709, 'the carry survives x-to-y workgroup boundaries');
  t.equal(result.chunks[1][700], 0, 'the interior segment start resets the carried prefix');
  t.equal(result.chunks[1][1024], 324, 'the reset segment survives the padded z workgroup');
  t.deepEqual(result.chunks[2], [325], 'the final chunk receives the last segment total');
  t.end();
});

test('GPUScan computes exclusive uint32 prefixes', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  for (const length of [0, 1, 2, 63, 64, 65, 4096, 4097, 17003]) {
    const inputValues = new Uint32Array(length);
    let randomState = 0xdecafbad;
    for (let index = 0; index < length; index++) {
      randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
      inputValues[index] =
        length === 63
          ? 0
          : length === 64
            ? 1
            : length === 65
              ? index
              : length === 4096
                ? randomState % 7
                : index % 5;
    }
    const inputBuffer = device.createBuffer({
      id: `scan-input-${length}`,
      data: length > 0 ? inputValues : new Uint32Array(1),
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    const outputBuffer = device.createBuffer({
      id: `scan-output-${length}`,
      byteLength: Math.max(length, 1) * Uint32Array.BYTES_PER_ELEMENT,
      usage: Buffer.STORAGE | Buffer.COPY_SRC
    });
    const graph = new GPUCommandGraph(device, {id: `scan-${length}`});
    const inputHandle = graph.importBuffer(
      {id: 'input', byteLength: inputBuffer.byteLength, usage: inputBuffer.usage},
      inputBuffer
    );
    const outputHandle = graph.importBuffer(
      {id: 'output', byteLength: outputBuffer.byteLength, usage: outputBuffer.usage},
      outputBuffer
    );
    const input = graph.createDataView(inputHandle, {format: 'uint32', length});
    const output = graph.createDataView(outputHandle, {format: 'uint32', length});
    new GPUScan({input, output}).addToGraph(graph);
    const compiled = graph.compile();
    const commandEncoder = device.createCommandEncoder({id: `scan-${length}-encoder`});
    compiled.encode(commandEncoder, {parameters: undefined});
    device.submit(commandEncoder.finish());
    const resultBytes = await outputBuffer.readAsync();
    const result = new Uint32Array(resultBytes.buffer, resultBytes.byteOffset, length);
    let expected = 0;
    let matches = true;
    for (let index = 0; index < length; index++) {
      matches &&= result[index] === expected;
      expected += inputValues[index];
    }
    t.ok(matches, `exclusive scan matches for ${length} values`);
    compiled.destroy();
    inputBuffer.destroy();
    outputBuffer.destroy();
  }
  t.end();
});

test('GPUScan propagates carries across GPUVector chunks without changing topology', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const chunks = [
    Uint32Array.from({length: 300}, () => 1),
    new Uint32Array(0),
    Uint32Array.from([7, 8])
  ];
  const result = await runVectorScan(device, chunks);
  t.equal(result.chunks.length, 3, 'output preserves all source chunks');
  t.equal(result.chunks[0].length, 300, 'first chunk length is preserved');
  t.deepEqual(result.chunks[1], [], 'empty middle chunk is preserved');
  t.equal(result.chunks[0][299], 299, 'hierarchical local scan completes within the first chunk');
  t.deepEqual(result.chunks[2], [300, 307], 'later chunks receive the sum of all preceding chunks');
  t.notOk(
    result.nodeOrder.some(id => id.includes('clear-chunk-totals') || id.endsWith('-total')),
    'final local scan levels write compact chunk totals without separate passes'
  );
  t.end();
});

test('GPUScan computes inclusive and segmented uint32 prefixes across block boundaries', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const length = 65_537;
  const values = Uint32Array.from({length}, (_, index) =>
    index === 0 ? 0xffffffff : (index % 7) + 1
  );
  const segmentFlags = new Uint32Array(length);
  for (const index of [0, 17, 255, 256, 257, 1025, 65_535, 65_536]) {
    segmentFlags[index] = index % 2 === 0 ? 7 : 1;
  }

  for (const mode of ['exclusive', 'inclusive'] as const) {
    const result = await runScan(device, values, {mode, segmentFlags});
    t.deepEqual(
      result,
      getExpectedScan(values, mode, segmentFlags),
      `${mode} segmented scan matches the CPU oracle`
    );
  }

  const inclusive = await runScan(device, values, {mode: 'inclusive'});
  t.deepEqual(
    inclusive,
    getExpectedScan(values, 'inclusive'),
    'inclusive unsegmented scan matches the CPU oracle and wraps modulo 2^32'
  );
  t.deepEqual(
    await runScan(device, new Uint32Array(0), {
      mode: 'inclusive',
      segmentFlags: new Uint32Array(0)
    }),
    [],
    'empty segmented scans add no work'
  );
  t.end();
});

test('GPUScan preserves segments and carries across GPUVector chunk boundaries', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const valueChunks = [
    Uint32Array.from([2, 3]),
    new Uint32Array(0),
    Uint32Array.from([5, 7, 11]),
    Uint32Array.from([13])
  ];
  const segmentFlagChunks = [
    Uint32Array.from([1, 0]),
    new Uint32Array(0),
    Uint32Array.from([0, 1, 0]),
    Uint32Array.from([0])
  ];

  const exclusive = await runVectorScan(device, valueChunks, {
    segmentFlagChunks,
    mode: 'exclusive'
  });
  t.deepEqual(
    exclusive.chunks,
    [[0, 2], [], [5, 0, 7], [18]],
    'exclusive segments continue across chunks and reset at flagged rows'
  );

  const inclusive = await runVectorScan(device, valueChunks, {
    segmentFlagChunks,
    mode: 'inclusive'
  });
  t.deepEqual(
    inclusive.chunks,
    [[2, 5], [], [10, 7, 18], [31]],
    'inclusive segments preserve the same chunk topology'
  );

  const longChunkValues = [Uint32Array.from([10]), Uint32Array.from({length: 512}, () => 1)];
  const longChunkSegmentFlags = [new Uint32Array(1), new Uint32Array(512)];
  longChunkSegmentFlags[1][100] = 1;
  const longChunkResult = await runVectorScan(device, longChunkValues, {
    segmentFlagChunks: longChunkSegmentFlags,
    mode: 'exclusive'
  });
  t.equal(longChunkResult.chunks[1][99], 109, 'carry reaches rows before the segment start');
  t.equal(longChunkResult.chunks[1][100], 0, 'the segment start discards the preceding carry');
  t.equal(
    longChunkResult.chunks[1][256],
    156,
    'the discarded carry stays removed in later workgroups'
  );
  t.end();
});

test('GPUCompaction preserves selected order and writes indirect instance count', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const values = new Uint32Array([11, 22, 33, 44, 55, 66, 77]);
  const flags = new Uint32Array([0, 1, 1, 0, 1, 0, 1]);
  const valuesBuffer = device.createBuffer({
    data: values,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const flagsBuffer = device.createBuffer({
    data: flags,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const outputBuffer = device.createBuffer({
    byteLength: values.byteLength,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const drawCommands = new DrawCommandBuffer(device, {
    type: 'draw',
    commands: [{vertexCount: 6, instanceCount: 0}]
  });
  const graph = new GPUCommandGraph(device, {id: 'compaction-test'});
  const valuesHandle = graph.importBuffer(
    {id: 'values', byteLength: valuesBuffer.byteLength, usage: valuesBuffer.usage},
    valuesBuffer
  );
  const flagsHandle = graph.importBuffer(
    {id: 'flags', byteLength: flagsBuffer.byteLength, usage: flagsBuffer.usage},
    flagsBuffer
  );
  const outputHandle = graph.importBuffer(
    {id: 'output', byteLength: outputBuffer.byteLength, usage: outputBuffer.usage},
    outputBuffer
  );
  const valuesView = graph.createDataView(valuesHandle, {
    format: 'uint32',
    length: values.length
  });
  const flagsView = graph.createDataView(flagsHandle, {
    format: 'uint32',
    length: flags.length
  });
  const outputView = graph.createDataView(outputHandle, {
    format: 'uint32',
    length: values.length
  });
  const countView = graph.importGPUData('draw-count', drawCommands.getInstanceCountData(0));
  new GPUCompaction({
    input: valuesView,
    flags: flagsView,
    output: outputView,
    count: countView
  }).addToGraph(graph);
  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'compaction-test-encoder'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());

  const outputBytes = await outputBuffer.readAsync();
  const output = new Uint32Array(outputBytes.buffer, outputBytes.byteOffset, values.length);
  t.deepEqual(Array.from(output.slice(0, 4)), [22, 33, 55, 77], 'selected values stay ordered');
  const countBytes = await drawCommands.buffer.readAsync(
    drawCommands.getInstanceCountByteOffset(0),
    Uint32Array.BYTES_PER_ELEMENT
  );
  const count = new Uint32Array(countBytes.buffer, countBytes.byteOffset, 1)[0];
  t.equal(count, 4, 'compaction writes indirect instance count');

  compiled.destroy();
  valuesBuffer.destroy();
  flagsBuffer.destroy();
  outputBuffer.destroy();
  drawCommands.destroy();
  t.end();
});

test('GPUTextSelection gathers selected row-indexed glyph records and indirect count', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const records = new Uint32Array([10, 100, 2, 11, 101, 0, 12, 102, 1, 13, 103, 2, 14, 104, 0]);
  const rowFlags = new Uint32Array([1, 0, 1]);
  const recordBuffer = device.createBuffer({
    data: records,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const rowFlagBuffer = device.createBuffer({
    data: rowFlags,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const selectedIdBuffer = device.createBuffer({
    byteLength: 5 * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const selectedRecordBuffer = device.createBuffer({
    byteLength: records.byteLength,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const drawCommands = new DrawCommandBuffer(device, {
    type: 'draw',
    commands: [{vertexCount: 6, instanceCount: 0}]
  });
  const graph = new GPUCommandGraph(device, {id: 'text-selection-test'});
  const recordsHandle = graph.importBuffer(
    {id: 'records', byteLength: recordBuffer.byteLength, usage: recordBuffer.usage},
    recordBuffer
  );
  const rowFlagsHandle = graph.importBuffer(
    {id: 'row-flags', byteLength: rowFlagBuffer.byteLength, usage: rowFlagBuffer.usage},
    rowFlagBuffer
  );
  const selectedIdsHandle = graph.importBuffer(
    {
      id: 'selected-ids',
      byteLength: selectedIdBuffer.byteLength,
      usage: selectedIdBuffer.usage
    },
    selectedIdBuffer
  );
  const selectedRecordsHandle = graph.importBuffer(
    {
      id: 'selected-records',
      byteLength: selectedRecordBuffer.byteLength,
      usage: selectedRecordBuffer.usage
    },
    selectedRecordBuffer
  );
  new GPUTextSelection({
    glyphRows: graph.createDataView(recordsHandle, {
      format: 'uint32',
      length: 5,
      byteOffset: 2 * Uint32Array.BYTES_PER_ELEMENT,
      byteStride: 3 * Uint32Array.BYTES_PER_ELEMENT
    }),
    rowFlags: graph.createDataView(rowFlagsHandle, {format: 'uint32', length: 3}),
    output: graph.createDataView(selectedIdsHandle, {format: 'uint32', length: 5}),
    count: graph.importGPUData('selected-count', drawCommands.getInstanceCountData(0)),
    sourceRecords: graph.createDataView(recordsHandle, {
      format: 'uint32',
      length: records.length
    }),
    outputRecords: graph.createDataView(selectedRecordsHandle, {
      format: 'uint32',
      length: records.length
    }),
    recordWordLength: 3
  }).addToGraph(graph);
  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'text-selection-test-encoder'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());

  const selectedIdBytes = await selectedIdBuffer.readAsync();
  t.deepEqual(
    Array.from(new Uint32Array(selectedIdBytes.buffer, selectedIdBytes.byteOffset, 4)),
    [0, 1, 3, 4],
    'selection preserves original glyph order'
  );
  const selectedRecordBytes = await selectedRecordBuffer.readAsync();
  t.deepEqual(
    Array.from(new Uint32Array(selectedRecordBytes.buffer, selectedRecordBytes.byteOffset, 12)),
    [10, 100, 2, 11, 101, 0, 13, 103, 2, 14, 104, 0],
    'selected compact records retain original row ids'
  );
  const countBytes = await drawCommands.buffer.readAsync(
    drawCommands.getInstanceCountByteOffset(0),
    Uint32Array.BYTES_PER_ELEMENT
  );
  t.equal(
    new Uint32Array(countBytes.buffer, countBytes.byteOffset, 1)[0],
    4,
    'selection writes exact indirect glyph count'
  );

  compiled.destroy();
  recordBuffer.destroy();
  rowFlagBuffer.destroy();
  selectedIdBuffer.destroy();
  selectedRecordBuffer.destroy();
  drawCommands.destroy();
  t.end();
});

test('GPUCompaction handles empty, none, all, alternating, and random masks', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const randomValues = Uint32Array.from({length: 71}, (_, index) => index * 17 + 3);
  let randomState = 0x12345678;
  const randomFlags = Uint32Array.from({length: randomValues.length}, () => {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    return randomState & 1;
  });
  const scenarios = [
    {name: 'empty', values: new Uint32Array(0), flags: new Uint32Array(0)},
    {name: 'none', values: Uint32Array.from([1, 2, 3, 4]), flags: Uint32Array.from([0, 0, 0, 0])},
    {name: 'all', values: Uint32Array.from([1, 2, 3, 4]), flags: Uint32Array.from([1, 1, 1, 1])},
    {
      name: 'alternating',
      values: Uint32Array.from([10, 20, 30, 40, 50]),
      flags: Uint32Array.from([1, 0, 1, 0, 1])
    },
    {name: 'random', values: randomValues, flags: randomFlags}
  ];

  for (const scenario of scenarios) {
    const result = await runCompaction(device, scenario.values, scenario.flags, scenario.name);
    const expected = Array.from(scenario.values).filter((_, index) => scenario.flags[index] !== 0);
    t.equal(result.count, expected.length, `${scenario.name} mask writes exact count`);
    t.deepEqual(result.values, expected, `${scenario.name} mask preserves stable order`);
  }
  t.end();
});

test('GPUCompaction preserves GPUVector topology while selecting across chunks', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }

  const result = await runVectorCompaction(
    device,
    [
      Uint32Array.from([10, 11, 12]),
      new Uint32Array(0),
      new Uint32Array(0),
      Uint32Array.from([20, 21, 22])
    ],
    [
      Uint32Array.from([1, 0, 1]),
      new Uint32Array(0),
      new Uint32Array(0),
      Uint32Array.from([1, 1, 0])
    ]
  );
  t.equal(result.count, 4, 'count spans the complete logical vector');
  t.deepEqual(
    result.chunks.map(chunk => chunk.length),
    [3, 0, 0, 3],
    'output chunk boundaries remain intact'
  );
  t.deepEqual(result.chunks[0], [10, 12, 20], 'selection crosses into the first output chunk');
  t.equal(result.chunks[3][0], 21, 'selection continues in the next non-empty output chunk');
  t.notOk(
    result.nodeOrder.some(id => id.endsWith('-write-count')),
    'the final scatter writes the vector-wide count without a separate pass'
  );
  t.equal(
    result.logicalTransientBufferCount,
    5,
    'zero-length offset chunks share one transient backing view'
  );
  t.end();
});

test('DrawCommandBuffer replays an indirect draw through a render bundle', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const colorTexture = device.createTexture({
    width: 4,
    height: 4,
    format: 'rgba8unorm',
    usage: Texture.RENDER_ATTACHMENT | Texture.COPY_SRC
  });
  const framebuffer = device.createFramebuffer({
    width: 4,
    height: 4,
    colorAttachments: [colorTexture],
    depthStencilAttachment: 'depth24plus'
  });
  const model = new Model(device, {
    id: 'indirect-bundle-model',
    source: `
@vertex fn vertexMain(@builtin(vertex_index) index: u32) -> @builtin(position) vec4<f32> {
  let positions = array<vec2<f32>, 3>(vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
  return vec4(positions[index], 0.0, 1.0);
}
@fragment fn fragmentMain() -> @location(0) vec4<f32> { return vec4(1.0, 0.0, 0.0, 1.0); }`,
    vertexCount: 3,
    colorAttachmentFormats: ['rgba8unorm'],
    depthStencilAttachmentFormat: 'depth24plus'
  });
  const drawCommands = new DrawCommandBuffer(device, {
    type: 'draw',
    commands: [{vertexCount: 3, instanceCount: 1}]
  });
  const encoder = device.createRenderBundleEncoder({
    id: 'indirect-bundle-test',
    colorAttachmentFormats: ['rgba8unorm'],
    depthStencilAttachmentFormat: 'depth24plus'
  });
  encoder.setPipeline(model.pipeline);
  drawCommands.draw(encoder, 0);
  const bundle = encoder.finish();
  const commandEncoder = device.createCommandEncoder({id: 'indirect-bundle-test'});
  const renderPass = commandEncoder.beginRenderPass({
    framebuffer,
    clearColor: [0, 0, 0, 1],
    clearDepth: 1
  });
  renderPass.executeBundles([bundle]);
  renderPass.end();
  device.submit(commandEncoder.finish());
  const pixels = await readPixels(framebuffer.colorAttachments[0].texture, 4, 4);
  t.ok(pixels[0] > 200, 'render bundle replays GPU indirect vertex count');
  bundle.destroy();
  drawCommands.destroy();
  model.destroy();
  framebuffer.destroy();
  colorTexture.destroy();
  t.end();
});

test('DispatchCommandBuffer stores typed GPU-writable dispatch records', async t => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    t.comment('WebGPU is not available');
    t.end();
    return;
  }
  const dispatchCommands = new DispatchCommandBuffer(device, {
    capacity: 3,
    commands: [{x: 2}, {x: 3, y: 4, z: 5}]
  });
  const bytes = await dispatchCommands.buffer.readAsync();
  const values = new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
  t.deepEqual(
    Array.from(values),
    [2, 1, 1, 3, 4, 5, 0, 0, 0],
    'records preserve WebGPU x/y/z layout and zero-fill capacity'
  );
  const secondCommand = dispatchCommands.getCommandData(1);
  t.equal(secondCommand.length, 3, 'borrowed command data contains three uint32 rows');
  t.equal(
    secondCommand.byteOffset,
    DispatchCommandBuffer.recordByteLength,
    'borrowed command data points at the selected record'
  );
  t.throws(
    () => dispatchCommands.getCommandByteOffset(3),
    /out of range/,
    'command index is bounded by capacity'
  );
  dispatchCommands.destroy();
  t.end();
});

async function readPixels(texture: Texture, width: number, height: number): Promise<Uint8Array> {
  const layout = texture.computeMemoryLayout({width, height});
  const buffer = texture.device.createBuffer({
    byteLength: layout.byteLength,
    usage: Buffer.COPY_DST | Buffer.MAP_READ
  });
  try {
    texture.readBuffer({width, height}, buffer);
    const paddedPixels = await buffer.readAsync(0, layout.byteLength);
    const pixels = new Uint8Array(width * height * 4);
    for (let row = 0; row < height; row++) {
      pixels.set(
        new Uint8Array(
          paddedPixels.buffer,
          paddedPixels.byteOffset + row * layout.bytesPerRow,
          width * 4
        ),
        row * width * 4
      );
    }
    return pixels;
  } finally {
    buffer.destroy();
  }
}

async function runVectorScan(
  device: Device,
  chunks: Uint32Array[],
  options: {
    mode?: 'exclusive' | 'inclusive';
    segmentFlagChunks?: Uint32Array[];
    maxComputeWorkgroupsPerDimension?: number;
  } = {}
): Promise<{chunks: number[][]; nodeOrder: string[]}> {
  const inputFixture = createUint32VectorFixture(device, 'input', chunks);
  const outputFixture = createUint32VectorFixture(device, 'output', chunks, 0);
  const segmentFlagsFixture = options.segmentFlagChunks
    ? createUint32VectorFixture(device, 'segment-flags', options.segmentFlagChunks)
    : null;
  const graph = new GPUCommandGraph(device, {id: 'vector-scan'});
  const input = graph.importGPUVector('input', inputFixture.vector);
  const output = graph.importGPUVector('output', outputFixture.vector);
  const segmentFlags = segmentFlagsFixture
    ? graph.importGPUVector('segment-flags', segmentFlagsFixture.vector)
    : undefined;
  const scan = new GPUScan({input, output, mode: options.mode, segmentFlags});
  if (options.maxComputeWorkgroupsPerDimension === undefined) {
    scan.addToGraph(graph);
  } else {
    addGPUScanToGraphWithDispatchLimit(scan, graph, options.maxComputeWorkgroupsPerDimension);
  }
  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'vector-scan-encoder'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
  const result = {
    chunks: await readUint32VectorFixture(outputFixture),
    nodeOrder: compiled.stats.nodeOrder
  };
  compiled.destroy();
  destroyUint32VectorFixture(inputFixture);
  destroyUint32VectorFixture(outputFixture);
  if (segmentFlagsFixture) destroyUint32VectorFixture(segmentFlagsFixture);
  return result;
}

async function runScan(
  device: Device,
  values: Uint32Array,
  options: {
    mode?: 'exclusive' | 'inclusive';
    segmentFlags?: Uint32Array;
    maxComputeWorkgroupsPerDimension?: number;
  } = {}
): Promise<number[]> {
  const inputBuffer = device.createBuffer({
    data: values.length > 0 ? values : new Uint32Array(1),
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const outputBuffer = device.createBuffer({
    byteLength: Math.max(values.length, 1) * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const segmentFlagsBuffer = options.segmentFlags
    ? device.createBuffer({
        data: options.segmentFlags.length > 0 ? options.segmentFlags : new Uint32Array(1),
        usage: Buffer.STORAGE | Buffer.COPY_DST
      })
    : null;
  const graph = new GPUCommandGraph(device, {id: 'scan-variant'});
  const inputHandle = graph.importBuffer(
    {id: 'input', byteLength: inputBuffer.byteLength, usage: inputBuffer.usage},
    inputBuffer
  );
  const outputHandle = graph.importBuffer(
    {id: 'output', byteLength: outputBuffer.byteLength, usage: outputBuffer.usage},
    outputBuffer
  );
  const input = graph.createDataView(inputHandle, {format: 'uint32', length: values.length});
  const output = graph.createDataView(outputHandle, {format: 'uint32', length: values.length});
  const segmentFlagsHandle = segmentFlagsBuffer
    ? graph.importBuffer(
        {
          id: 'segment-flags',
          byteLength: segmentFlagsBuffer.byteLength,
          usage: segmentFlagsBuffer.usage
        },
        segmentFlagsBuffer
      )
    : null;
  const segmentFlags = segmentFlagsHandle
    ? graph.createDataView(segmentFlagsHandle, {format: 'uint32', length: values.length})
    : undefined;
  const scan = new GPUScan({input, output, mode: options.mode, segmentFlags});
  if (options.maxComputeWorkgroupsPerDimension === undefined) {
    scan.addToGraph(graph);
  } else {
    addGPUScanToGraphWithDispatchLimit(scan, graph, options.maxComputeWorkgroupsPerDimension);
  }
  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'scan-variant-encoder'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
  const outputBytes = await outputBuffer.readAsync();
  const result = Array.from(
    new Uint32Array(outputBytes.buffer, outputBytes.byteOffset, values.length)
  );
  compiled.destroy();
  inputBuffer.destroy();
  outputBuffer.destroy();
  segmentFlagsBuffer?.destroy();
  return result;
}

function getExpectedScan(
  values: Uint32Array,
  mode: 'exclusive' | 'inclusive',
  segmentFlags?: Uint32Array
): number[] {
  let prefix = 0;
  return Array.from(values, (value, index) => {
    if (index === 0 || segmentFlags?.[index]) prefix = 0;
    const exclusive = prefix;
    prefix = (prefix + value) >>> 0;
    return mode === 'inclusive' ? prefix : exclusive;
  });
}

async function runVectorCompaction(
  device: Device,
  valueChunks: Uint32Array[],
  flagChunks: Uint32Array[]
): Promise<{
  chunks: number[][];
  count: number;
  nodeOrder: string[];
  logicalTransientBufferCount: number;
}> {
  const valuesFixture = createUint32VectorFixture(device, 'values', valueChunks);
  const flagsFixture = createUint32VectorFixture(device, 'flags', flagChunks);
  const outputFixture = createUint32VectorFixture(device, 'output', valueChunks, 0xffffffff);
  const countBuffer = device.createBuffer({
    byteLength: Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const graph = new GPUCommandGraph(device, {id: 'vector-compaction'});
  const values = graph.importGPUVector('values', valuesFixture.vector);
  const flags = graph.importGPUVector('flags', flagsFixture.vector);
  const output = graph.importGPUVector('output', outputFixture.vector);
  const countHandle = graph.importBuffer(
    {id: 'count', byteLength: countBuffer.byteLength, usage: countBuffer.usage},
    countBuffer
  );
  const count = graph.createDataView(countHandle, {format: 'uint32', length: 1});
  new GPUCompaction({input: values, flags, output, count}).addToGraph(graph);
  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'vector-compaction-encoder'});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
  const [chunks, countBytes] = await Promise.all([
    readUint32VectorFixture(outputFixture),
    countBuffer.readAsync()
  ]);
  const result = {
    chunks,
    count: new Uint32Array(countBytes.buffer, countBytes.byteOffset, 1)[0],
    nodeOrder: compiled.stats.nodeOrder,
    logicalTransientBufferCount: compiled.stats.logicalTransientBufferCount
  };
  compiled.destroy();
  destroyUint32VectorFixture(valuesFixture);
  destroyUint32VectorFixture(flagsFixture);
  destroyUint32VectorFixture(outputFixture);
  countBuffer.destroy();
  return result;
}

type Uint32VectorFixture = {
  vector: GPUVector<'uint32'>;
  buffers: Buffer[];
  lengths: number[];
};

function createUint32VectorFixture(
  device: Device,
  name: string,
  chunks: Uint32Array[],
  fill?: number
): Uint32VectorFixture {
  const lengths = chunks.map(chunk => chunk.length);
  const buffers = chunks.map(chunk =>
    device.createBuffer({
      data:
        fill === undefined
          ? chunk.length > 0
            ? chunk
            : new Uint32Array(1)
          : Uint32Array.from({length: Math.max(chunk.length, 1)}, () => fill),
      usage: Buffer.STORAGE | Buffer.COPY_DST | (fill === undefined ? 0 : Buffer.COPY_SRC)
    })
  );
  const vector = new GPUVector({
    type: 'data',
    name,
    format: 'uint32',
    data: buffers.map(
      (buffer, chunkIndex) =>
        new GPUData({
          buffer,
          format: 'uint32',
          length: lengths[chunkIndex],
          ownsBuffer: false
        })
    ),
    ownsData: false
  });
  return {vector, buffers, lengths};
}

async function readUint32VectorFixture(fixture: Uint32VectorFixture): Promise<number[][]> {
  return Promise.all(
    fixture.buffers.map(async (buffer, chunkIndex) => {
      const bytes = await buffer.readAsync();
      return Array.from(
        new Uint32Array(bytes.buffer, bytes.byteOffset, fixture.lengths[chunkIndex])
      );
    })
  );
}

function destroyUint32VectorFixture(fixture: Uint32VectorFixture): void {
  fixture.vector.destroy();
  for (const buffer of fixture.buffers) buffer.destroy();
}

async function runCompaction(
  device: Device,
  values: Uint32Array,
  flags: Uint32Array,
  id: string
): Promise<{values: number[]; count: number}> {
  const valuesBuffer = device.createBuffer({
    data: values.length > 0 ? values : new Uint32Array(1),
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const flagsBuffer = device.createBuffer({
    data: flags.length > 0 ? flags : new Uint32Array(1),
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const outputBuffer = device.createBuffer({
    byteLength: Math.max(values.length, 1) * Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const countBuffer = device.createBuffer({
    byteLength: Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_SRC
  });
  const graph = new GPUCommandGraph(device, {id: `compaction-${id}`});
  const valuesHandle = graph.importBuffer(
    {id: 'values', byteLength: valuesBuffer.byteLength, usage: valuesBuffer.usage},
    valuesBuffer
  );
  const flagsHandle = graph.importBuffer(
    {id: 'flags', byteLength: flagsBuffer.byteLength, usage: flagsBuffer.usage},
    flagsBuffer
  );
  const outputHandle = graph.importBuffer(
    {id: 'output', byteLength: outputBuffer.byteLength, usage: outputBuffer.usage},
    outputBuffer
  );
  const countHandle = graph.importBuffer(
    {id: 'count', byteLength: countBuffer.byteLength, usage: countBuffer.usage},
    countBuffer
  );
  new GPUCompaction({
    input: graph.createDataView(valuesHandle, {format: 'uint32', length: values.length}),
    flags: graph.createDataView(flagsHandle, {format: 'uint32', length: flags.length}),
    output: graph.createDataView(outputHandle, {format: 'uint32', length: values.length}),
    count: graph.createDataView(countHandle, {format: 'uint32', length: 1})
  }).addToGraph(graph);
  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: `compaction-${id}-encoder`});
  compiled.encode(commandEncoder, {parameters: undefined});
  device.submit(commandEncoder.finish());
  const [outputBytes, countBytes] = await Promise.all([
    outputBuffer.readAsync(),
    countBuffer.readAsync()
  ]);
  const count = new Uint32Array(countBytes.buffer, countBytes.byteOffset, 1)[0];
  const output = new Uint32Array(outputBytes.buffer, outputBytes.byteOffset, values.length);
  const result = {values: Array.from(output.slice(0, count)), count};
  compiled.destroy();
  valuesBuffer.destroy();
  flagsBuffer.destroy();
  outputBuffer.destroy();
  countBuffer.destroy();
  return result;
}
