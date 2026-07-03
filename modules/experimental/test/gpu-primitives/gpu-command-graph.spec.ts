// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from '@luma.gl/devtools-extensions/tape-test-utils';
import {Buffer, type Device, Texture} from '@luma.gl/core';
import {DynamicBuffer, Model} from '@luma.gl/engine';
import {DrawCommandBuffer, GPUCommandGraph, GPUCompaction, GPUScan} from '@luma.gl/experimental';
import {GPUData, GPUVector} from '@luma.gl/tables';
import {getNullTestDevice, getWebGPUTestDevice} from '@luma.gl/test-utils';

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
  t.equal(compiled.stats.physicalTransientBufferCount, 1, 'reuses one physical allocation');
  t.equal(compiled.stats.logicalTransientBytes, 192, 'reports logical bytes');
  t.equal(compiled.stats.physicalTransientBytes, 128, 'reports physical bytes');
  compiled.destroy();
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
  chunks: Uint32Array[]
): Promise<{chunks: number[][]; nodeOrder: string[]}> {
  const inputFixture = createUint32VectorFixture(device, 'input', chunks);
  const outputFixture = createUint32VectorFixture(device, 'output', chunks, 0);
  const graph = new GPUCommandGraph(device, {id: 'vector-scan'});
  const input = graph.importGPUVector('input', inputFixture.vector);
  const output = graph.importGPUVector('output', outputFixture.vector);
  new GPUScan({input, output}).addToGraph(graph);
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
  return result;
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
