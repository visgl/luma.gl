import {expect, it} from 'vitest';
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
} from '@luma.gl/gpgpu/gpu-core';
import {GPUData, GPUVector} from '@luma.gl/gpgpu/gpu-data';
import {getNullTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';
import {
  getBoundedDispatchLayout,
  getBoundedInvocationIndexSource
} from '../../src/gpu-core/gpu-dispatch-utils';
import {getGPUReductionStrategy} from '../../src/gpu-core/gpu-reduction';
import {
  addGPUScanToGraphWithDispatchLimit,
  getGPUScanDispatchLayout,
  getGPUScanInvocationIndexSource,
  getGPUScanStrategy
} from '../../src/gpu-core/gpu-scan';

it('GPUCommandGraph compiles dependencies and reuses transient buffers', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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
    workload: {
      operation: 'TestFill',
      commandCount: 1,
      maximumWorkgroupCount: 2,
      maximumInvocationCount: 512,
      readByteLength: 16,
      writeByteLength: 64
    },
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
  const debugString =
    'CompiledGPUCommandGraph:"graph-scheduling-test":3 nodes:128B transient:active';
  expect(Object.prototype.toString.call(compiled), 'exposes a compact object-inspection tag').toBe(
    '[object CompiledGPUCommandGraph]'
  );
  expect(compiled.toString(), 'summarizes graph identity, size, and lifecycle').toBe(debugString);
  expect(compiled.toJSON(), 'serializes without recursive resource graphs').toBe(debugString);
  expect(JSON.stringify(compiled), 'keeps JSON logs compact').toBe(JSON.stringify(debugString));
  expect(compiled.stats.nodeOrder, 'stable order includes inferred dependency').toEqual([
    'write-first',
    'write-second',
    'read-second'
  ]);
  expect(compiled.stats.logicalTransientBufferCount, 'tracks two logical buffers').toBe(2);
  expect(compiled.stats.logicalBufferCount, 'reports all logical buffers').toBe(2);
  expect(compiled.stats.importedBufferCount, 'reports no imported buffers').toBe(0);
  expect(compiled.stats.physicalTransientBufferCount, 'reuses one physical allocation').toBe(1);
  expect(compiled.stats.logicalTransientBytes, 'reports logical bytes').toBe(192);
  expect(compiled.stats.logicalBufferBytes, 'reports total logical buffer bytes').toBe(192);
  expect(compiled.stats.physicalTransientBytes, 'reports physical bytes').toBe(128);
  expect(compiled.stats.logicalResourceBytes, 'reports total logical resource bytes').toBe(192);
  expect(compiled.stats.physicalTransientResourceBytes, 'reports total owned transient bytes').toBe(
    128
  );
  expect(compiled.preflight.commandCount, 'aggregates annotated commands').toBe(1);
  expect(compiled.preflight.annotatedNodeCount, 'reports workload-estimate coverage').toBe(1);
  expect(compiled.preflight.maximumWorkgroupCount, 'aggregates annotated workgroups').toBe(2);
  expect(compiled.preflight.maximumInvocationCount, 'aggregates annotated invocations').toBe(512);
  expect(compiled.preflight.readByteLength, 'aggregates annotated reads').toBe(16);
  expect(compiled.preflight.writeByteLength, 'aggregates annotated writes').toBe(64);
  expect(compiled.preflight.largestBufferByteLength, 'reports the largest buffer').toBe(128);
  expect(compiled.preflight.nodes[0].operation, 'preserves operation identity').toBe('TestFill');
  expect(compiled.preflight.fitsDeviceLimits, 'reports valid declared resources').toBe(true);
  const commandEncoder = device.createCommandEncoder({id: 'graph-scheduling-encoding'});
  const encoding = compiled.encode(commandEncoder, {parameters: undefined});
  expect(encoding.stats.computePassCount, 'coalesces consecutive graph compute nodes').toBe(1);
  expect(encoding.stats.coalescedComputeNodeCount, 'reports nodes sharing the physical pass').toBe(
    2
  );
  commandEncoder.destroy();
  compiled.destroy();
  expect(compiled.toString(), 'reports destroyed graph state compactly').toMatch(/:destroyed$/);
});

it('GPUCommandGraph reports adapter capabilities and explicit encoding timings', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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

  expect(compiled.stats.importedBufferCount, 'counts imported buffers').toBe(1);
  expect(compiled.stats.importedBufferBytes, 'reports imported buffer capacity').toBe(32);
  expect(compiled.stats.logicalBufferBytes, 'includes imports in logical memory').toBe(32);
  expect(compiled.capabilities.timestampQueries, 'reports timestamp-query support').toBe(
    device.features.has('timestamp-query')
  );
  expect(compiled.capabilities.subgroups, 'reports subgroup device support').toBe(
    device.features.has('subgroups')
  );
  expect(compiled.capabilities.subgroupId, 'reports subgroup_id WGSL language support').toBe(
    device.wgslLanguageFeatures.has('subgroup_id')
  );
  expect(compiled.capabilities.maxBufferByteLength, 'reports the device buffer limit').toBe(
    device.limits.maxBufferSize
  );

  const commandEncoder = device.createCommandEncoder({id: 'graph-diagnostics-encoding'});
  const encoding = compiled.encode(commandEncoder, {parameters: undefined});
  expect(encoding.stats.nodeCount, 'reports every encoded node').toBe(2);
  expect(encoding.stats.computePassCount, 'reports the number of physical compute passes').toBe(1);
  expect(encoding.stats.coalescedComputeNodeCount, 'reports no merged standalone node').toBe(0);
  expect(encoding.stats.timestampedNodeCount, 'does not invent GPU timestamps').toBe(0);
  expect(
    Boolean(encoding.canReadGPUTimings),
    'plain encoders do not expose GPU timing readback'
  ).toBe(false);
  expect(
    Boolean(encoding.stats.cpuEncodeTimeMilliseconds >= 0),
    'reports total CPU encoding time'
  ).toBe(true);
  expect(
    encoding.stats.nodes.map(node => [node.id, node.type, node.hasGPUTimestamps]),
    'reports stable per-node encoding metadata'
  ).toEqual([
    ['observe-import', 'compute', false],
    ['cpu-only-copy', 'copy', false]
  ]);
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
    expect(
      timestampEncoding.stats.timestampedNodeCount,
      'timestamps render and compute passes'
    ).toBe(1);
    expect(
      Boolean(timestampEncoding.canReadGPUTimings),
      'exposes explicit timing readback capability'
    ).toBe(true);
    expect(
      Boolean(report.gpuTimeMilliseconds !== undefined),
      'reads a total GPU duration after submission'
    ).toBe(true);
    expect(
      Boolean(report.nodes[0].gpuTimeMilliseconds !== undefined),
      'reads the compute node GPU duration'
    ).toBe(true);
    expect(report.nodes[1].gpuTimeMilliseconds, 'copy nodes remain CPU-timed').toBe(undefined);
    querySet.destroy();
  } else {
  }

  compiled.destroy();
  importedBuffer.destroy();
});

it('GPUCommandGraph spreads workload-annotated nodes across bounded execution steps', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const encodedNodeIds: string[] = [];
  const graph = new GPUCommandGraph(device, {id: 'graph-bounded-execution-test'});
  for (const [id, maximumInvocationCount] of [
    ['initialize', 0],
    ['partition-0', 300],
    ['partition-1', 400],
    ['oversized-partition', 900],
    ['finalize', 0]
  ] as const) {
    graph.addComputePass({
      id,
      workload: {
        operation: 'TestPartition',
        commandCount: maximumInvocationCount > 0 ? 1 : 0,
        maximumInvocationCount,
        readByteLength: maximumInvocationCount * 4,
        writeByteLength: maximumInvocationCount * 2
      },
      compile: () => ({encode: () => encodedNodeIds.push(id)})
    });
  }
  const compiled = graph.compile();
  const executionBudget = {
    maximumInvocationCount: 700,
    maximumCommandCount: 2,
    maximumReadByteLength: 2800,
    maximumWriteByteLength: 1400
  };
  const plan = compiled.getExecutionPlan(executionBudget);
  expect(plan.stepCount, 'plans three bounded queue submissions').toBe(3);
  expect(plan.maximumInvocationCount, 'reports complete invocation bounds').toBe(1600);
  expect(plan.readByteLength, 'reports complete read bounds').toBe(6400);
  expect(plan.steps[0].commandCount, 'packs commands up to the multidimensional budget').toBe(2);
  expect(plan.steps[0].readByteLength, 'packs reads up to the byte budget').toBe(2800);
  expect(
    Boolean(plan.steps[1].exceedsBudget),
    'identifies an indivisible oversized partition'
  ).toBe(true);
  expect(plan.oversizedStepCount, 'summarizes oversized steps before encoding').toBe(1);
  const execution = compiled.createExecution(executionBudget);
  expect(execution.plan, 'execution exposes an equivalent immutable plan').toEqual(plan);

  const firstEncoder = device.createCommandEncoder({id: 'bounded-execution-step-0'});
  const firstStep = execution.encodeNext(firstEncoder, {parameters: undefined});
  expect(encodedNodeIds, 'first step packs dependency-ordered nodes up to the budget').toEqual([
    'initialize',
    'partition-0',
    'partition-1'
  ]);
  expect(firstStep.maximumInvocationCount, 'reports the first step invocation bound').toBe(700);
  expect(firstStep.stepIndex, 'reports the encoded plan step').toBe(0);
  expect(firstStep.progress, 'reports planned-submission progress').toBe(1 / 3);
  expect(firstStep.publishedProgress, 'keeps incomplete results private by default').toBe(0);
  expect(Boolean(firstStep.completed), 'execution remains resumable').toBe(false);
  firstEncoder.destroy();

  const secondEncoder = device.createCommandEncoder({id: 'bounded-execution-step-1'});
  const secondStep = execution.encodeNext(secondEncoder, {parameters: undefined});
  expect(encodedNodeIds, 'one oversized node still makes forward progress').toEqual([
    'initialize',
    'partition-0',
    'partition-1',
    'oversized-partition'
  ]);
  expect(secondStep.maximumInvocationCount, 'reports an indivisible oversized node').toBe(900);
  expect(Boolean(secondStep.exceedsBudget), 'propagates the oversized-step diagnostic').toBe(true);
  expect(secondStep.publishedProgress, 'does not expose an unsafe intermediate state').toBe(0);
  expect(Boolean(secondStep.completed), 'trailing finalization remains pending').toBe(false);
  secondEncoder.destroy();

  const thirdEncoder = device.createCommandEncoder({id: 'bounded-execution-step-2'});
  const thirdStep = execution.encodeNext(thirdEncoder, {parameters: undefined});
  expect(encodedNodeIds.at(-1), 'finalization is encoded last').toEqual('finalize');
  expect(Boolean(thirdStep.completed), 'final step completes the execution').toBe(true);
  expect(thirdStep.progress, 'completed execution reports full progress').toBe(1);
  expect(thirdStep.publishedProgress, 'publishes the atomically completed graph').toBe(1);
  thirdEncoder.destroy();

  compiled.destroy();
});

it('GPUCommandGraph rejects explicit dependency cycles', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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
  expect(() => graph.compile(), 'cycle is rejected').toThrow(/dependency cycle/);
});

it('GPUCommandGraph preserves fixed-width GPUVector chunks and borrowed ownership', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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

  expect(firstView.format, 'GPUData format is preserved').toBe('uint32');
  expect(firstView.length, 'GPUData length is preserved').toBe(2);
  expect(firstView.byteOffset, 'GPUData byte offset is preserved').toBe(0);
  expect(firstView.byteStride, 'GPUData byte stride is preserved').toBe(4);
  expect(vectorView.name, 'GPUVector name is preserved').toBe('values');
  expect(vectorView.length, 'GPUVector row count is preserved').toBe(6);
  expect(vectorView.data.length, 'GPUVector chunk count is preserved').toBe(3);
  expect(vectorView.data[0].buffer, 'reuses an already imported table buffer').toBe(
    firstView.buffer
  );
  expect(vectorView.data[0].buffer, 'shared chunks share one handle').toBe(
    vectorView.data[1].buffer
  );
  expect(vectorView.data[1].buffer, 'distinct buffers stay distinct').not.toBe(
    vectorView.data[2].buffer
  );
  expect(vectorView.data[1].byteOffset, 'per-chunk byte offsets are preserved').toBe(8);

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
  expect(
    compiled.stats.nodeOrder,
    'hazards are inferred through the shared physical buffer handle'
  ).toEqual(['gate', 'read-first-chunk', 'write-second-chunk']);

  compiled.destroy();
  expect(
    Boolean(sharedBuffer.destroyed),
    'compiled graph does not destroy borrowed shared storage'
  ).toBe(false);
  expect(
    Boolean(trailingBuffer.destroyed),
    'compiled graph does not destroy borrowed trailing storage'
  ).toBe(false);
  vector.destroy();
  expect(Boolean(sharedBuffer.destroyed), 'GPUVector retains shared-buffer ownership').toBe(true);
  expect(Boolean(trailingBuffer.destroyed), 'GPUVector retains trailing-buffer ownership').toBe(
    true
  );
});

it('GPUCommandGraph rejects interleaved and variable-length GPUVector imports', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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

  expect(
    () => graph.importGPUVector('interleaved', interleaved),
    'interleaved vectors require an explicit attribute adapter'
  ).toThrow(/does not accept interleaved/);
  expect(
    () => graph.importGPUVector('variable-length', variableLength),
    'variable-length vectors require an explicit topology adapter'
  ).toThrow(/fixed-width GPUVector format/);

  interleaved.destroy();
  variableLength.destroy();
});

it('GPUCommandGraph exposes safe extension-library helpers', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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
  expect(contributorOutputUsage, 'contributors can request additional transient usage flags').toBe(
    Buffer.STORAGE | Buffer.INDIRECT
  );

  expect(
    () => createTransientView(graph, 'invalid-length', 'uint32', -1),
    'negative transient lengths are rejected before graph allocation'
  ).toThrow(/non-negative safe integer/);
  expect(
    () => createTransientView(graph, 'invalid-length', 'uint32', 0),
    'a rejected transient does not reserve its graph resource id'
  ).not.toThrow();
  expect(
    () => createTransientView(graph, 'missing-storage', 'uint32', 1, Buffer.INDIRECT),
    'typed transient views retain storage binding usage'
  ).toThrow(/must include Buffer.STORAGE/);
  for (const [format, id] of [
    ['vertex-list<float32x3>', 'vertex-list-transient'],
    ['value-list<uint32>', 'value-list-transient']
  ] as const) {
    expect(
      () => Reflect.apply(createTransientView, undefined, [graph, id, format, 2]),
      `${format} requires an explicit variable-length adapter`
    ).toThrow(/requires a fixed-width GPUVector format/);
    expect(
      () => createTransientView(graph, id, 'float32x3', 2),
      `${format} is rejected before reserving its graph resource id`
    ).not.toThrow();
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
  expect(binding.offset, 'storage binding starts at an aligned byte offset').toBe(256);
  expect(binding.size, 'storage binding includes the view prefix and row').toBe(8);
  expect(getViewElementOffset(bindingView), 'shader element offset addresses the view row').toBe(1);

  const misalignedView = graph.createDataView(bindingHandle, {
    format: 'uint32',
    length: 1,
    byteOffset: 261
  });
  expect(
    () => getViewElementOffset(misalignedView),
    'fractional shader element offsets are rejected'
  ).toThrow(/must be uint32-aligned/);
  const emptyEndView = graph.createDataView(bindingHandle, {
    format: 'uint32',
    length: 0,
    byteOffset: bindingHandle.byteLength
  });
  expect(
    () => getViewBinding(emptyEndView, () => bindingBuffer),
    'empty views still require one bindable row inside the logical buffer'
  ).toThrow(/exceeds its logical buffer/);

  bindingBuffer.destroy();
});

it('GPUCommandGraph validates resources and overlapping lifetimes', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const nullDevice = await getNullTestDevice();
  const wrongDeviceBuffer = nullDevice.createBuffer({byteLength: 16, usage: Buffer.STORAGE});
  const wrongDeviceGraph = new GPUCommandGraph(device);
  expect(
    () =>
      wrongDeviceGraph.importBuffer(
        {id: 'wrong-device', byteLength: 16, usage: Buffer.STORAGE},
        wrongDeviceBuffer
      ),
    'wrong-device imports are rejected'
  ).toThrow(/another device/);

  const validationGraph = new GPUCommandGraph(device);
  const copyOnly = validationGraph.createTransientBuffer({
    id: 'copy-only',
    byteLength: 16,
    usage: Buffer.COPY_DST
  });
  expect(
    () =>
      validationGraph.addComputePass({
        id: 'invalid-use',
        resources: [{buffer: copyOnly, usage: 'storage-read'}],
        compile: () => ({encode: () => {}})
      }),
    'node uses must be compatible with descriptors'
  ).toThrow(/does not declare usage/);
  const unaligned = validationGraph.createDataView(copyOnly, {
    format: 'uint32',
    length: 1,
    byteOffset: 2
  });
  expect(
    () => new GPUScan({input: unaligned, output: unaligned}),
    'uint32 algorithms reject misaligned views'
  ).toThrow(/uint32-aligned/);
  expect(
    () =>
      validationGraph.createDataView(copyOnly, {
        format: 'uint32',
        length: 4,
        byteOffset: 4
      }),
    'views cannot exceed logical capacity'
  ).toThrow(/exceeds buffer/);
  expect(
    () =>
      validationGraph.createDataView(copyOnly, {
        format: 'uint32',
        length: 1,
        byteOffset: Number.MAX_SAFE_INTEGER
      }),
    'view byte ranges cannot overflow safe integer precision'
  ).toThrow(/safe integer precision/);
  expect(
    () =>
      validationGraph.createTransientBuffer({
        id: 'oversized-buffer',
        byteLength: device.limits.maxBufferSize + 1,
        usage: Buffer.STORAGE
      }),
    'logical buffers cannot exceed the adapter allocation limit'
  ).toThrow(/device buffer limit/);
  const aliasingBuffer = validationGraph.createTransientBuffer({
    id: 'aliasing-storage',
    byteLength: 512,
    usage: Buffer.STORAGE
  });
  const firstStorageView = validationGraph.createDataView(aliasingBuffer, {
    format: 'uint32',
    length: 16
  });
  const adjacentStorageView = validationGraph.createDataView(aliasingBuffer, {
    format: 'uint32',
    length: 16,
    byteOffset: 64
  });
  expect(
    () =>
      validationGraph.addComputePass({
        id: 'writable-storage-alias',
        resources: [
          {buffer: firstStorageView, usage: 'storage-write'},
          {buffer: adjacentStorageView, usage: 'storage-write'}
        ],
        compile: () => ({encode: () => {}})
      }),
    'aligned WebGPU binding ranges are validated before shader compilation'
  ).toThrow(/overlapping writable storage bindings.*aliasing-storage.*0–64 bytes.*0–128 bytes/);
  const alignedStorageView = validationGraph.createDataView(aliasingBuffer, {
    format: 'uint32',
    length: 16,
    byteOffset: 256
  });
  validationGraph.addComputePass({
    id: 'nonaliasing-storage-views',
    resources: [
      {buffer: firstStorageView, usage: 'storage-write'},
      {buffer: alignedStorageView, usage: 'storage-write'}
    ],
    compile: () => ({encode: () => {}})
  });
  expect(
    () =>
      validationGraph.createTransientTexture({
        id: 'oversized-texture',
        format: device.preferredColorFormat,
        width: device.limits.maxTextureDimension2D + 1,
        height: 1,
        usage: Texture.RENDER
      }),
    'logical textures cannot exceed adapter dimension limits'
  ).toThrow(/device dimension limits/);

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
  expect(
    overlapping.stats.physicalTransientBufferCount,
    'overlapping transient lifetimes use separate allocations'
  ).toBe(2);
  overlapping.destroy();
  wrongDeviceBuffer.destroy();
});

it('CompiledGPUCommandGraph rejects encoding after device loss', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const graph = new GPUCommandGraph(device, {id: 'device-loss-test'});
  graph.addCopyPass({id: 'copy', compile: () => ({encode: () => {}})});
  const compiled = graph.compile();
  const commandEncoder = device.createCommandEncoder({id: 'lost-device-encoding'});
  const existingDescriptor = Object.getOwnPropertyDescriptor(device, 'isLost');
  Object.defineProperty(device, 'isLost', {configurable: true, value: true});
  try {
    expect(
      () => compiled.encode(commandEncoder, {parameters: undefined}),
      'device loss fails before resource resolution or command recording'
    ).toThrow(/after device loss/);
  } finally {
    if (existingDescriptor) {
      Object.defineProperty(device, 'isLost', existingDescriptor);
    } else {
      Reflect.deleteProperty(device, 'isLost');
    }
  }
  commandEncoder.destroy();
  compiled.destroy();
});

it('CompiledGPUCommandGraph resolves DynamicBuffer replacements and preserves imports', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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
  expect(resolvedBuffers[0], 'first encoding resolves initial backing buffer').toBe(
    firstBackingBuffer
  );
  expect(resolvedBuffers[1], 'second encoding resolves replacement backing buffer').toBe(
    secondBackingBuffer
  );
  compiled.destroy();
  expect(
    Boolean(secondBackingBuffer.destroyed),
    'destroying graph leaves imported buffer alive'
  ).toBe(false);
  dynamicBuffer.destroy();

  const missingGraph = new GPUCommandGraph(device);
  missingGraph.importBuffer({id: 'required', byteLength: 16, usage: Buffer.STORAGE});
  const missingCompiled = missingGraph.compile();
  expect(
    () =>
      missingCompiled.encode(device.createCommandEncoder({id: 'missing-import'}), {
        parameters: undefined
      }),
    'encoding rejects a missing import'
  ).toThrow(/is required/);
  const undersized = device.createBuffer({byteLength: 4, usage: Buffer.STORAGE});
  expect(
    () =>
      missingCompiled.encode(device.createCommandEncoder({id: 'undersized-import'}), {
        parameters: undefined,
        buffers: {required: undersized}
      }),
    'encoding rejects an undersized override'
  ).toThrow(/smaller than compiled capacity/);
  missingCompiled.destroy();
  undersized.destroy();
});

it('GPUScan plans bounded multidimensional direct dispatches', () => {
  const maximum = 65_535;
  const oneDimensionalRowCapacity = maximum * 256;

  expect(getGPUScanDispatchLayout(0, maximum)).toEqual({x: 1, y: 1, z: 1});
  expect(getGPUScanDispatchLayout(oneDimensionalRowCapacity, maximum)).toEqual({
    x: maximum,
    y: 1,
    z: 1
  });
  expect(getGPUScanDispatchLayout(oneDimensionalRowCapacity + 1, maximum)).toEqual({
    x: maximum,
    y: 2,
    z: 1
  });
  expect(
    getGPUScanDispatchLayout(4 * 256 + 1, 2),
    'a small synthetic limit exercises the third dispatch dimension'
  ).toEqual({x: 2, y: 2, z: 2});
  expect(() => getGPUScanDispatchLayout(8 * 256 + 1, 2)).toThrow(/exceeding the 3D dispatch limit/);
  expect(
    () => getBoundedDispatchLayout('GPUScan', 1024, 3, maximum),
    'the shared uint32 guard rejects workgroup sizes that can wrap padded lanes'
  ).toThrow(/power of two greater than one/);
  expect(
    () => getBoundedInvocationIndexSource({x: 1, y: 1, z: 1}, 1),
    'the source helper never emits an unrepresentable 2^32 guard literal'
  ).toThrow(/power of two greater than one/);

  const source = getGPUScanInvocationIndexSource({x: 3, y: 2, z: 2});
  expect(source).toMatch(/workgroupId\.z \* 2u \+ workgroupId\.y/);
  expect(source).toMatch(/\* 3u \+ workgroupId\.x/);
  expect(source, 'padded workgroups cannot wrap the uint32 invocation index').toMatch(
    /workgroupIndex >= 16777216u/
  );
  expect(
    Boolean(
      source.indexOf('workgroupIndex >= 16777216u') <
        source.indexOf('workgroupIndex * 256u + localInvocationIndex')
    ),
    'the uint32 guard executes before invocation-index multiplication'
  ).toBe(true);
});

it('GPUScan selects subgroups only when device and WGSL capabilities are both available', () => {
  const makeDevice = (subgroups: boolean, subgroupId: boolean) =>
    ({
      features: {has: (feature: string) => feature === 'subgroups' && subgroups},
      wgslLanguageFeatures: new Set(subgroupId ? ['subgroup_id'] : [])
    }) as Device;

  expect(getGPUScanStrategy(makeDevice(true, true)), 'selects the fast path').toBe('subgroups');
  expect(
    getGPUScanStrategy(makeDevice(true, false)),
    'requires the subgroup_id language extension'
  ).toBe('portable');
  expect(getGPUScanStrategy(makeDevice(false, true)), 'requires the subgroup device feature').toBe(
    'portable'
  );
  expect(
    getGPUScanStrategy(makeDevice(true, true), true),
    'keeps segmented scans on the portable path'
  ).toBe('portable');
});

it('GPUReduction selects subgroups only when device and WGSL capabilities are available', () => {
  const makeDevice = (subgroups: boolean, subgroupId: boolean) =>
    ({
      features: {has: (feature: string) => feature === 'subgroups' && subgroups},
      wgslLanguageFeatures: new Set(subgroupId ? ['subgroup_id'] : [])
    }) as Device;

  expect(getGPUReductionStrategy(makeDevice(true, true)), 'selects subgroups').toBe('subgroups');
  expect(getGPUReductionStrategy(makeDevice(true, false)), 'requires subgroup_id').toBe('portable');
  expect(getGPUReductionStrategy(makeDevice(false, true)), 'requires device feature').toBe(
    'portable'
  );
});

it('GPUScan executes multidimensional block and offset dispatches', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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

  expect(
    result,
    'five block scans and their offset pass execute through a padded 2x2x2 layout'
  ).toEqual(getExpectedScan(values, 'exclusive', segmentFlags));
});

it('GPUScan preserves vector segments and carries through multidimensional passes', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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

  expect(result.chunks[0], 'the first chunk starts the vector-wide prefix').toEqual([0]);
  expect(result.chunks[1][0], 'the preceding chunk carry reaches the 3D-dispatched chunk').toBe(10);
  expect(result.chunks[1][699], 'the carry survives x-to-y workgroup boundaries').toBe(709);
  expect(result.chunks[1][700], 'the interior segment start resets the carried prefix').toBe(0);
  expect(result.chunks[1][1024], 'the reset segment survives the padded z workgroup').toBe(324);
  expect(result.chunks[2], 'the final chunk receives the last segment total').toEqual([325]);
});

it('GPUScan computes exclusive uint32 prefixes', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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
    expect(Boolean(matches), `exclusive scan matches for ${length} values`).toBe(true);
    compiled.destroy();
    inputBuffer.destroy();
    outputBuffer.destroy();
  }
});

it('GPUScan propagates carries across GPUVector chunks without changing topology', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }

  const chunks = [
    Uint32Array.from({length: 300}, () => 1),
    new Uint32Array(0),
    Uint32Array.from([7, 8])
  ];
  const result = await runVectorScan(device, chunks);
  expect(result.chunks.length, 'output preserves all source chunks').toBe(3);
  expect(result.chunks[0].length, 'first chunk length is preserved').toBe(300);
  expect(result.chunks[1], 'empty middle chunk is preserved').toEqual([]);
  expect(result.chunks[0][299], 'hierarchical local scan completes within the first chunk').toBe(
    299
  );
  expect(result.chunks[2], 'later chunks receive the sum of all preceding chunks').toEqual([
    300, 307
  ]);
  expect(
    Boolean(
      result.nodeOrder.some(id => id.includes('clear-chunk-totals') || id.endsWith('-total'))
    ),
    'final local scan levels write compact chunk totals without separate passes'
  ).toBe(false);
});

it('GPUScan computes inclusive and segmented uint32 prefixes across block boundaries', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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
    expect(result, `${mode} segmented scan matches the CPU oracle`).toEqual(
      getExpectedScan(values, mode, segmentFlags)
    );
  }

  const inclusive = await runScan(device, values, {mode: 'inclusive'});
  expect(
    inclusive,
    'inclusive unsegmented scan matches the CPU oracle and wraps modulo 2^32'
  ).toEqual(getExpectedScan(values, 'inclusive'));
  expect(
    await runScan(device, new Uint32Array(0), {
      mode: 'inclusive',
      segmentFlags: new Uint32Array(0)
    }),
    'empty segmented scans add no work'
  ).toEqual([]);
});

it('GPUScan preserves segments and carries across GPUVector chunk boundaries', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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
  expect(
    exclusive.chunks,
    'exclusive segments continue across chunks and reset at flagged rows'
  ).toEqual([[0, 2], [], [5, 0, 7], [18]]);

  const inclusive = await runVectorScan(device, valueChunks, {
    segmentFlagChunks,
    mode: 'inclusive'
  });
  expect(inclusive.chunks, 'inclusive segments preserve the same chunk topology').toEqual([
    [2, 5],
    [],
    [10, 7, 18],
    [31]
  ]);

  const longChunkValues = [Uint32Array.from([10]), Uint32Array.from({length: 512}, () => 1)];
  const longChunkSegmentFlags = [new Uint32Array(1), new Uint32Array(512)];
  longChunkSegmentFlags[1][100] = 1;
  const longChunkResult = await runVectorScan(device, longChunkValues, {
    segmentFlagChunks: longChunkSegmentFlags,
    mode: 'exclusive'
  });
  expect(longChunkResult.chunks[1][99], 'carry reaches rows before the segment start').toBe(109);
  expect(longChunkResult.chunks[1][100], 'the segment start discards the preceding carry').toBe(0);
  expect(
    longChunkResult.chunks[1][256],
    'the discarded carry stays removed in later workgroups'
  ).toBe(156);
});

it('GPUCompaction preserves selected order and writes indirect instance count', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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
  expect(Array.from(output.slice(0, 4)), 'selected values stay ordered').toEqual([22, 33, 55, 77]);
  const countBytes = await drawCommands.buffer.readAsync(
    drawCommands.getInstanceCountByteOffset(0),
    Uint32Array.BYTES_PER_ELEMENT
  );
  const count = new Uint32Array(countBytes.buffer, countBytes.byteOffset, 1)[0];
  expect(count, 'compaction writes indirect instance count').toBe(4);

  compiled.destroy();
  valuesBuffer.destroy();
  flagsBuffer.destroy();
  outputBuffer.destroy();
  drawCommands.destroy();
});

it('GPUTextSelection gathers selected row-indexed glyph records and indirect count', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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
  expect(
    Array.from(new Uint32Array(selectedIdBytes.buffer, selectedIdBytes.byteOffset, 4)),
    'selection preserves original glyph order'
  ).toEqual([0, 1, 3, 4]);
  const selectedRecordBytes = await selectedRecordBuffer.readAsync();
  expect(
    Array.from(new Uint32Array(selectedRecordBytes.buffer, selectedRecordBytes.byteOffset, 12)),
    'selected compact records retain original row ids'
  ).toEqual([10, 100, 2, 11, 101, 0, 13, 103, 2, 14, 104, 0]);
  const countBytes = await drawCommands.buffer.readAsync(
    drawCommands.getInstanceCountByteOffset(0),
    Uint32Array.BYTES_PER_ELEMENT
  );
  expect(
    new Uint32Array(countBytes.buffer, countBytes.byteOffset, 1)[0],
    'selection writes exact indirect glyph count'
  ).toBe(4);

  compiled.destroy();
  recordBuffer.destroy();
  rowFlagBuffer.destroy();
  selectedIdBuffer.destroy();
  selectedRecordBuffer.destroy();
  drawCommands.destroy();
});

it('GPUCompaction handles empty, none, all, alternating, and random masks', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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
    expect(result.count, `${scenario.name} mask writes exact count`).toBe(expected.length);
    expect(result.values, `${scenario.name} mask preserves stable order`).toEqual(expected);
  }
});

it('GPUCompaction preserves GPUVector topology while selecting across chunks', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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
  expect(result.count, 'count spans the complete logical vector').toBe(4);
  expect(
    result.chunks.map(chunk => chunk.length),
    'output chunk boundaries remain intact'
  ).toEqual([3, 0, 0, 3]);
  expect(result.chunks[0], 'selection crosses into the first output chunk').toEqual([10, 12, 20]);
  expect(result.chunks[3][0], 'selection continues in the next non-empty output chunk').toBe(21);
  expect(
    Boolean(result.nodeOrder.some(id => id.endsWith('-write-count'))),
    'the final scatter writes the vector-wide count without a separate pass'
  ).toBe(false);
  expect(
    result.logicalTransientBufferCount,
    'zero-length offset chunks share one transient backing view'
  ).toBe(5);
});

it('DrawCommandBuffer replays an indirect draw through a render bundle', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
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
  expect(Boolean(pixels[0] > 200), 'render bundle replays GPU indirect vertex count').toBe(true);
  bundle.destroy();
  drawCommands.destroy();
  model.destroy();
  framebuffer.destroy();
  colorTexture.destroy();
});

it('DispatchCommandBuffer stores typed GPU-writable dispatch records', async () => {
  const device = await getWebGPUTestDevice();
  if (!device) {
    return;
  }
  const dispatchCommands = new DispatchCommandBuffer(device, {
    capacity: 3,
    commands: [{x: 2}, {x: 3, y: 4, z: 5}]
  });
  const bytes = await dispatchCommands.buffer.readAsync();
  const values = new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
  expect(Array.from(values), 'records preserve WebGPU x/y/z layout and zero-fill capacity').toEqual(
    [2, 1, 1, 3, 4, 5, 0, 0, 0]
  );
  const secondCommand = dispatchCommands.getCommandData(1);
  expect(secondCommand.length, 'borrowed command data contains three uint32 rows').toBe(3);
  expect(secondCommand.byteOffset, 'borrowed command data points at the selected record').toBe(
    DispatchCommandBuffer.recordByteLength
  );
  expect(
    () => dispatchCommands.getCommandByteOffset(3),
    'command index is bounded by capacity'
  ).toThrow(/out of range/);
  dispatchCommands.destroy();
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
