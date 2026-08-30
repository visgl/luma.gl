// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {Buffer, type RenderPass} from '@luma.gl/core';
import type {PickInfo} from '@luma.gl/engine';
import {
  GPUSplatGraphRenderer,
  makeGPUSplatData,
  type SplatPickingInfo,
  type SplatSource
} from '@luma.gl/splats';
import {NullDevice} from '@luma.gl/test-utils';
import {WgslReflect} from 'wgsl_reflect';
import {
  GPUSplatGraphMixedRenderer,
  GPUSplatGraphPicker,
  GPU_SPLAT_GRAPH_PICKING_SHADER,
  resolveGPUSplatGraphPickInfo
} from '../src/gpu-splat-graph-interaction';
import {
  GPU_SPLAT_GRAPH_UNIFORM_BYTE_LENGTH,
  GPU_SPLAT_PROJECTED_RECORD_BYTE_LENGTH
} from '../src/gpu-splat-graph-shaders';

test('graph-native Gaussian picking preserves projected, uniform, and integer identity layouts', t => {
  const reflection = new WgslReflect(GPU_SPLAT_GRAPH_PICKING_SHADER);
  const projectedRecord = reflection.structs.find(struct => struct.name === 'ProjectedSplat');
  t.equal(
    projectedRecord?.size,
    GPU_SPLAT_PROJECTED_RECORD_BYTE_LENGTH,
    'borrows the exact renderer-owned 48-byte projected Gaussian record'
  );
  t.deepEqual(
    projectedRecord?.members.map(member => ({name: member.name, offset: member.offset})),
    [
      {name: 'clipCenter', offset: 0},
      {name: 'axis0', offset: 16},
      {name: 'axis1', offset: 24},
      {name: 'color', offset: 32}
    ],
    'preserves projected clip centers, anisotropic axes, and Float32 alpha'
  );
  t.equal(
    reflection.uniforms[0]?.size,
    GPU_SPLAT_GRAPH_UNIFORM_BYTE_LENGTH,
    'borrows the graph renderer uniform allocation without rewriting or uploading it'
  );
  t.deepEqual(
    reflection.storage.map(resource => ({name: resource.name, location: resource.binding})),
    [
      {name: 'projectedRecords', location: 1},
      {name: 'sortedIds', location: 2}
    ],
    'consumes only already projected records and globally sorted visible row identifiers'
  );
  t.deepEqual(
    reflection.entry.vertex.map(entry => entry.name),
    ['vertexMain'],
    'provides one instanced projected Gaussian vertex entry point'
  );
  t.deepEqual(
    reflection.entry.fragment.map(entry => entry.name),
    ['fragmentMain'],
    'provides one exact integer picking fragment entry point'
  );
  t.match(
    GPU_SPLAT_GRAPH_PICKING_SHADER,
    /@location\(2\)\s*@interpolate\(flat\)\s*projectedRowIndex:\s*u32/,
    'preserves packed projected source identity without interpolation or 24-bit encoding'
  );
  t.match(
    GPU_SPLAT_GRAPH_PICKING_SHADER,
    /alpha\s*<=\s*0\.0\s*\|\|\s*alpha\s*<\s*graphUniforms\.alphaCutoff/,
    'excludes transparent and cutoff-clipped Gaussian fragments from picking'
  );
  t.match(
    GPU_SPLAT_GRAPH_PICKING_SHADER,
    /pickingIndices\s*=\s*vec2<i32>\(i32\(input\.projectedRowIndex\),\s*0\)/,
    'publishes the packed projected row through an exact signed integer attachment'
  );
  t.end();
});

test('resolveGPUSplatGraphPickInfo restores original streamed batches and large global rows', t => {
  const device = new NullDevice({});
  const firstBatch = makeGPUSplatData(
    device,
    makeGraphInteractionSource({
      depths: [0.8, 0.6],
      semanticIds: [4, 7],
      sourceBatchIndex: 802,
      rowIndexBase: 16_777_224
    })
  );
  const secondBatch = makeGPUSplatData(
    device,
    makeGraphInteractionSource({
      depths: [0.3],
      sourceBatchIndex: 65_535,
      rowIndexBase: 2_000_000_000
    })
  );

  t.deepEqual(
    resolveGPUSplatGraphPickInfo({batchIndex: 0, objectIndex: 1}, [firstBatch, secondBatch]),
    {batchIndex: 802, rowIndex: 16_777_225, batchRowIndex: 1, semanticId: 7},
    'restores a labeled global source row exceeding RGBA picking precision'
  );
  t.deepEqual(
    resolveGPUSplatGraphPickInfo({batchIndex: 0, objectIndex: 2}, [firstBatch, secondBatch]),
    {batchIndex: 65_535, rowIndex: 2_000_000_000, batchRowIndex: 0, semanticId: null},
    'restores arbitrary source batches and high signed-32-bit global source identities'
  );

  for (const invalidPick of [
    null,
    {batchIndex: null, objectIndex: null},
    {batchIndex: 1, objectIndex: 0},
    {batchIndex: 0, objectIndex: -1},
    {batchIndex: 0, objectIndex: 3},
    {batchIndex: 0, objectIndex: Number.NaN},
    {batchIndex: 0, objectIndex: 1.5}
  ]) {
    t.deepEqual(
      resolveGPUSplatGraphPickInfo(invalidPick, [firstBatch, secondBatch]),
      {batchIndex: null, rowIndex: null, batchRowIndex: null, semanticId: null},
      'rejects missing, stale, negative, fractional, and out-of-bounds graph identities'
    );
  }

  firstBatch.destroy();
  t.equal(
    resolveGPUSplatGraphPickInfo({batchIndex: 0, objectIndex: 1}, [firstBatch, secondBatch])
      .rowIndex,
    null,
    'rejects a projected row whose original source allocation was evicted or destroyed'
  );
  secondBatch.destroy();
  t.end();
});

test('GPUSplatGraphPicker stays lazy, requires integer picking, and preserves borrowed ownership', async t => {
  const device = makeGraphInteractionWebGPUNullDevice();
  const batch = makeGPUSplatData(
    device,
    makeGraphInteractionSource({
      depths: [0.5],
      semanticIds: [9],
      sourceBatchIndex: 4,
      rowIndexBase: 40
    })
  );
  const renderer = new GPUSplatGraphRenderer(device, {data: batch, viewportSize: [1, 1]});
  const sourceBuffer = batch.positions.data[0].buffer;
  const picker = new GPUSplatGraphPicker(renderer);

  t.equal(picker.mode, 'index', 'selects exact integer WebGPU picking');
  t.equal(picker.model, undefined, 'does not allocate a picking model before the first pick');
  t.equal(picker.manager.framebuffer, null, 'does not allocate picking attachments eagerly');
  t.equal(renderer.compiledGraph, undefined, 'never forces graph projection at construction');
  t.throws(
    () => new GPUSplatGraphPicker(renderer, {mode: 'color'}),
    /integer WebGPU picking/,
    'rejects lossy color picking for graph-native source identities'
  );
  t.deepEqual(
    await picker.pick(null),
    {batchIndex: null, rowIndex: null, batchRowIndex: null, semanticId: null},
    'clears an absent pointer without compiling or submitting GPU work'
  );

  picker.destroy();
  picker.destroy();
  t.ok(picker.destroyed, 'releases owned picking resources idempotently');
  t.notOk(renderer.destroyed, 'never destroys the borrowing graph renderer');
  t.notOk(sourceBuffer.destroyed, 'never destroys original caller-owned source buffers');
  t.equal(await picker.pick([0, 0]), null, 'does not submit after picker destruction');

  renderer.destroy();
  t.throws(
    () => new GPUSplatGraphPicker(renderer),
    /live Gaussian splat graph renderer/,
    'rejects previously destroyed graph renderers'
  );
  batch.destroy();
  t.end();
});

test('GPUSplatGraphPicker reuses graph buffers and one GPU-visible indirect command', async t => {
  const device = makeGraphInteractionWebGPUNullDevice();
  const firstBatch = makeGPUSplatData(
    device,
    makeGraphInteractionSource({
      depths: [0.8, 0.6],
      semanticIds: [3, 4],
      sourceBatchIndex: 50,
      rowIndexBase: 100
    })
  );
  const secondBatch = makeGPUSplatData(
    device,
    makeGraphInteractionSource({
      depths: [0.2],
      semanticIds: [8],
      sourceBatchIndex: 60_000,
      rowIndexBase: 25_000_400
    })
  );
  const renderer = new GPUSplatGraphRenderer(device, {
    data: [firstBatch, secondBatch],
    viewportSize: [1, 1]
  });
  const projectedRecordBuffer = device.createBuffer({
    byteLength: GPU_SPLAT_PROJECTED_RECORD_BYTE_LENGTH * 3,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const sortedIndexBuffer = device.createBuffer({
    byteLength: Uint32Array.BYTES_PER_ELEMENT * 3,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const uniformBuffer = device.createBuffer({
    byteLength: GPU_SPLAT_GRAPH_UNIFORM_BYTE_LENGTH,
    usage: Buffer.UNIFORM | Buffer.COPY_DST
  });
  let encodingCount = 0;
  let indirectDrawCount = 0;
  let readbackCount = 0;
  let pickedProjectedRowIndex = 2;
  Object.defineProperties(renderer, {
    projectedRecordBuffer: {value: projectedRecordBuffer},
    sortedIndexBuffer: {value: sortedIndexBuffer},
    uniformBuffer: {value: uniformBuffer},
    capacity: {value: {splatCount: 3, batchCount: 2}},
    encode: {
      value: () => {
        encodingCount++;
        return undefined;
      }
    }
  });
  Object.defineProperty(renderer.drawCommands, 'draw', {
    value: (_renderPass: RenderPass, commandIndex: number) => {
      t.equal(commandIndex, 0, 'reuses the existing graph GPU-visible indirect command');
      indirectDrawCount++;
    }
  });

  const notifications: SplatPickingInfo[] = [];
  const picker = new GPUSplatGraphPicker(renderer, {onPick: info => notifications.push(info)});
  picker.manager.updatePickInfo = async () => {
    readbackCount++;
    return {batchIndex: 0, objectIndex: pickedProjectedRowIndex};
  };

  t.deepEqual(
    await picker.pick([0, 0]),
    {batchIndex: 60_000, rowIndex: 25_000_400, batchRowIndex: 0, semanticId: 8},
    'resolves the GPU-picked packed projected row into its large original source identity'
  );
  const initialPickingModel = picker.model;
  t.ok(initialPickingModel, 'creates one dedicated projected-record GPU picking model');
  t.equal(indirectDrawCount, 1, 'issues one indirect draw across both original source batches');
  t.equal(encodingCount, 1, 'refreshes only graph-owned projected source state');
  t.equal(readbackCount, 1, 'reads exactly one asynchronous integer picking result');
  t.equal(notifications.length, 1, 'notifies stable source selection once');

  await picker.pick([0, 0]);
  t.equal(indirectDrawCount, 1, 'does not redraw unchanged pointer positions');
  t.equal(readbackCount, 1, 'does not repeat GPU readback for unchanged positions');

  pickedProjectedRowIndex = 1;
  t.deepEqual(
    await picker.pick([0, 0], {force: true}),
    {batchIndex: 50, rowIndex: 101, batchRowIndex: 1, semanticId: 4},
    'refreshes stable source identity after streamed, animated, or filtered graph updates'
  );
  t.equal(picker.model, initialPickingModel, 'reuses the existing projected-record picking model');
  t.equal(indirectDrawCount, 2, 'issues exactly one indirect draw for each forced graph pick');
  t.equal(notifications.length, 2, 'publishes each changed semantic selection once');

  picker.clear();
  t.deepEqual(
    notifications[2],
    {batchIndex: null, rowIndex: null, batchRowIndex: null, semanticId: null},
    'publishes one cleared original source selection'
  );
  picker.destroy();
  t.notOk(projectedRecordBuffer.destroyed, 'does not destroy the borrowed projected-record buffer');
  t.notOk(
    sortedIndexBuffer.destroyed,
    'does not destroy the borrowed globally sorted index buffer'
  );
  t.notOk(uniformBuffer.destroyed, 'does not destroy the borrowed graph uniform allocation');
  t.notOk(firstBatch.destroyed, 'does not destroy the first original source batch');
  t.notOk(secondBatch.destroyed, 'does not destroy the second original source batch');

  renderer.destroy();
  projectedRecordBuffer.destroy();
  sortedIndexBuffer.destroy();
  uniformBuffer.destroy();
  firstBatch.destroy();
  secondBatch.destroy();
  t.end();
});

test('GPUSplatGraphPicker serializes deferred readback across independently replaced frontiers', async t => {
  const device = makeGraphInteractionWebGPUNullDevice();
  const firstBatch = makeGPUSplatData(
    device,
    makeGraphInteractionSource({
      depths: [0.5],
      semanticIds: [4],
      sourceBatchIndex: 8,
      rowIndexBase: 100
    })
  );
  const replacementBatch = makeGPUSplatData(
    device,
    makeGraphInteractionSource({
      depths: [0.2],
      semanticIds: [9],
      sourceBatchIndex: 70_000,
      rowIndexBase: 1_900_000_000
    })
  );
  const renderer = new GPUSplatGraphRenderer(device, {data: firstBatch, viewportSize: [2, 1]});
  const projectedRecordBuffer = device.createBuffer({
    byteLength: GPU_SPLAT_PROJECTED_RECORD_BYTE_LENGTH,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const sortedIndexBuffer = device.createBuffer({
    byteLength: Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const uniformBuffer = device.createBuffer({
    byteLength: GPU_SPLAT_GRAPH_UNIFORM_BYTE_LENGTH,
    usage: Buffer.UNIFORM | Buffer.COPY_DST
  });
  let graphEncodingCount = 0;
  let indirectDrawCount = 0;
  Object.defineProperties(renderer, {
    projectedRecordBuffer: {value: projectedRecordBuffer},
    sortedIndexBuffer: {value: sortedIndexBuffer},
    uniformBuffer: {value: uniformBuffer},
    capacity: {value: {splatCount: 1, batchCount: 1}},
    encode: {
      value: () => {
        graphEncodingCount++;
        return undefined;
      }
    }
  });
  Object.defineProperty(renderer.drawCommands, 'draw', {
    value: () => {
      indirectDrawCount++;
    }
  });

  const notifications: SplatPickingInfo[] = [];
  const picker = new GPUSplatGraphPicker(renderer, {onPick: info => notifications.push(info)});
  let finishFirstReadback: (pickInfo: PickInfo) => void = () => {};
  const firstReadback = new Promise<PickInfo>(resolve => {
    finishFirstReadback = resolve;
  });
  let readbackCount = 0;
  picker.manager.updatePickInfo = async () => {
    readbackCount++;
    const result = readbackCount === 1 ? await firstReadback : {batchIndex: 0, objectIndex: 0};
    picker.manager.props.onObjectPicked(result);
    return result;
  };

  const firstRequest = picker.pick([0, 0]);
  await Promise.resolve();
  t.equal(readbackCount, 1, 'starts one asynchronous readback for the original source frontier');
  renderer.setProps({data: replacementBatch});
  t.notOk(firstBatch.destroyed, 'frontier replacement preserves the original borrowed batch');
  const secondRequest = picker.pick([1, 0]);
  await Promise.resolve();
  t.equal(readbackCount, 1, 'does not overlap GPU readbacks across different source frontiers');
  t.equal(graphEncodingCount, 1, 'defers new graph projection until previous readback resolves');
  t.equal(indirectDrawCount, 1, 'does not overwrite the first source snapshot with a new draw');

  finishFirstReadback({batchIndex: 0, objectIndex: 0});
  t.deepEqual(
    await firstRequest,
    {batchIndex: 8, rowIndex: 100, batchRowIndex: 0, semanticId: 4},
    'resolves the delayed GPU identity against its original prepared source snapshot'
  );
  t.deepEqual(
    await secondRequest,
    {batchIndex: 70_000, rowIndex: 1_900_000_000, batchRowIndex: 0, semanticId: 9},
    'resolves the following queued GPU identity against the replacement frontier'
  );
  t.equal(readbackCount, 2, 'runs exactly one serialized readback for each pointer request');
  t.equal(
    graphEncodingCount,
    2,
    'encodes the replacement graph only after its predecessor settles'
  );
  t.equal(indirectDrawCount, 2, 'issues one graph-native indirect draw per serialized request');
  t.deepEqual(
    notifications,
    [
      {batchIndex: 8, rowIndex: 100, batchRowIndex: 0, semanticId: 4},
      {batchIndex: 70_000, rowIndex: 1_900_000_000, batchRowIndex: 0, semanticId: 9}
    ],
    'publishes correctly scoped source and semantic callbacks in request order'
  );

  let finishStaleReadback: (pickInfo: PickInfo) => void = () => {};
  const staleReadback = new Promise<PickInfo>(resolve => {
    finishStaleReadback = resolve;
  });
  picker.manager.updatePickInfo = async () => {
    readbackCount++;
    const result = await staleReadback;
    picker.manager.pickInfo = result;
    picker.manager.props.onObjectPicked(result);
    return result;
  };
  const pendingStaleRequest = picker.pick([0, 0], {force: true});
  await Promise.resolve();
  t.equal(readbackCount, 3, 'starts another deferred source readback before pointer leave');
  t.deepEqual(
    await picker.pick(null),
    {batchIndex: null, rowIndex: null, batchRowIndex: null, semanticId: null},
    'clears a pointer immediately without waiting for stale GPU readback'
  );
  t.equal(notifications.length, 3, 'publishes the cleared selection exactly once');
  finishStaleReadback({batchIndex: 0, objectIndex: 0});
  t.deepEqual(
    await pendingStaleRequest,
    {batchIndex: null, rowIndex: null, batchRowIndex: null, semanticId: null},
    'never restores a cleared selection from an older completed GPU frame'
  );
  t.equal(notifications.length, 3, 'suppresses stale source and semantic callbacks after clearing');
  t.deepEqual(
    picker.manager.pickInfo,
    {batchIndex: null, objectIndex: null},
    'clears stale engine-level integer picking and highlight identity'
  );

  picker.manager.updatePickInfo = async () => {
    const result = {batchIndex: 0, objectIndex: 0};
    picker.manager.props.onObjectPicked(result);
    return result;
  };
  t.deepEqual(
    await picker.pick([1, 0], {force: true}),
    {batchIndex: 70_000, rowIndex: 1_900_000_000, batchRowIndex: 0, semanticId: 9},
    'accepts new pointer requests after invalidating an older in-flight picking generation'
  );
  t.equal(notifications.length, 4, 'resumes current-generation source notifications normally');

  picker.destroy();
  renderer.destroy();
  projectedRecordBuffer.destroy();
  sortedIndexBuffer.destroy();
  uniformBuffer.destroy();
  firstBatch.destroy();
  replacementBatch.destroy();
  t.end();
});

test('GPUSplatGraphMixedRenderer composites shared-depth meshes around one graph indirect draw', t => {
  const device = makeGraphInteractionWebGPUNullDevice();
  const batch = makeGPUSplatData(
    device,
    makeGraphInteractionSource({
      depths: [0.5],
      semanticIds: [7],
      sourceBatchIndex: 8,
      rowIndexBase: 90
    })
  );
  const renderer = new GPUSplatGraphRenderer(device, {data: batch, viewportSize: [8, 8]});
  const projectedRecordBuffer = device.createBuffer({
    byteLength: GPU_SPLAT_PROJECTED_RECORD_BYTE_LENGTH,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const sortedIndexBuffer = device.createBuffer({
    byteLength: Uint32Array.BYTES_PER_ELEMENT,
    usage: Buffer.STORAGE | Buffer.COPY_DST
  });
  const uniformBuffer = device.createBuffer({
    byteLength: GPU_SPLAT_GRAPH_UNIFORM_BYTE_LENGTH,
    usage: Buffer.UNIFORM | Buffer.COPY_DST
  });
  const drawOrder: string[] = [];
  let graphEncodingCount = 0;
  Object.defineProperties(renderer, {
    projectedRecordBuffer: {value: projectedRecordBuffer},
    sortedIndexBuffer: {value: sortedIndexBuffer},
    uniformBuffer: {value: uniformBuffer},
    capacity: {value: {splatCount: 1, batchCount: 1}},
    encode: {
      value: () => {
        graphEncodingCount++;
        return undefined;
      }
    }
  });
  Object.defineProperty(renderer.drawCommands, 'draw', {
    value: (_renderPass: RenderPass, commandIndex: number) => {
      t.equal(commandIndex, 0, 'uses the graph-populated GPU visible-row indirect command');
      drawOrder.push('splats');
    }
  });

  const mixedRenderer = new GPUSplatGraphMixedRenderer(renderer, {
    colorAttachmentFormat: 'rgba8unorm',
    depthStencilAttachmentFormat: 'depth24plus',
    depthCompare: 'greater-equal',
    depthWriteEnabled: true
  });
  t.equal(mixedRenderer.model, undefined, 'does not allocate a display model before preparation');
  t.ok(
    mixedRenderer.predraw(device.commandEncoder),
    'updates projected graph resources before opening the caller-owned shared pass'
  );
  t.equal(graphEncodingCount, 1, 'prepares graph projection exactly once');
  const initialModel = mixedRenderer.model;
  t.ok(initialModel, 'creates one reusable graph-projected Gaussian display model');
  t.equal(
    initialModel?.parameters.depthCompare,
    'greater-equal',
    'supports application-owned reversed-depth scene policies'
  );
  t.equal(
    initialModel?.parameters.depthWriteEnabled,
    true,
    'supports explicitly requested Gaussian depth writes'
  );

  const renderPass = device.beginRenderPass({clearDepth: 0});
  t.ok(
    mixedRenderer.draw(renderPass, {
      opaqueMeshes: [
        {
          draw(sharedPass) {
            t.equal(sharedPass, renderPass, 'shares the caller-owned opaque mesh depth attachment');
            drawOrder.push('opaque');
            return true;
          }
        }
      ],
      transparentMeshes: [
        {
          draw(sharedPass) {
            t.equal(sharedPass, renderPass, 'shares the same transparent overlay render pass');
            drawOrder.push('transparent');
          }
        }
      ]
    }),
    'composites opaque meshes, graph-projected splats, and transparent overlays'
  );
  renderPass.end();
  t.deepEqual(
    drawOrder,
    ['opaque', 'splats', 'transparent'],
    'preserves mixed-scene depth ordering'
  );

  t.ok(mixedRenderer.predraw(device.commandEncoder), 'prepares a later graph composition frame');
  t.equal(mixedRenderer.model, initialModel, 'reuses the same projected-record display model');
  mixedRenderer.destroy();
  mixedRenderer.destroy();
  t.ok(mixedRenderer.destroyed, 'releases owned composition resources idempotently');
  t.notOk(renderer.destroyed, 'preserves the borrowed source graph renderer');
  t.notOk(projectedRecordBuffer.destroyed, 'preserves borrowed projected Gaussian records');
  t.notOk(sortedIndexBuffer.destroyed, 'preserves borrowed globally sorted graph indices');
  t.notOk(uniformBuffer.destroyed, 'preserves borrowed camera and styling uniforms');
  t.notOk(batch.destroyed, 'preserves the independently owned original Gaussian source batch');

  renderer.destroy();
  projectedRecordBuffer.destroy();
  sortedIndexBuffer.destroy();
  uniformBuffer.destroy();
  batch.destroy();
  t.throws(
    () => new GPUSplatGraphMixedRenderer(renderer),
    /live Gaussian splat graph renderer/,
    'rejects graph renderers whose borrowed resources have already been destroyed'
  );
  t.end();
});

function makeGraphInteractionWebGPUNullDevice(): NullDevice {
  const device = new NullDevice({});
  Object.defineProperties(device, {
    type: {value: 'webgpu'},
    info: {value: {...device.info, type: 'webgpu', shadingLanguage: 'wgsl'}}
  });
  return device;
}

function makeGraphInteractionSource({
  depths,
  semanticIds,
  sourceBatchIndex,
  rowIndexBase
}: {
  depths: readonly number[];
  semanticIds?: readonly number[];
  sourceBatchIndex: number;
  rowIndexBase: number;
}): SplatSource {
  const positions = new Float32Array(depths.length * 3);
  const scales = new Float32Array(depths.length * 3);
  const rotations = new Float32Array(depths.length * 4);
  const colors = new Uint8Array(depths.length * 4);
  const opacities = new Float32Array(depths.length);
  for (const [rowIndex, depth] of depths.entries()) {
    positions[rowIndex * 3 + 2] = depth;
    scales.set([1, 1, 0.1], rowIndex * 3);
    rotations[rowIndex * 4] = 1;
    colors.set([255, 128, 32, 255], rowIndex * 4);
    opacities[rowIndex] = 1;
  }
  return {
    positions,
    scales,
    rotations,
    colors,
    opacities,
    ...(semanticIds ? {semanticIds: new Uint32Array(semanticIds)} : {}),
    sourceBatchIndex,
    rowIndexBase
  };
}
