// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
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

it('graph-native Gaussian picking preserves projected, uniform, and integer identity layouts', () => {
  const reflection = new WgslReflect(GPU_SPLAT_GRAPH_PICKING_SHADER);
  const projectedRecord = reflection.structs.find(struct => struct.name === 'ProjectedSplat');
  expect(
    projectedRecord?.size,
    'borrows the exact renderer-owned 48-byte projected Gaussian record'
  ).toBe(GPU_SPLAT_PROJECTED_RECORD_BYTE_LENGTH);
  expect(
    projectedRecord?.members.map(member => ({name: member.name, offset: member.offset})),
    'preserves projected clip centers, anisotropic axes, and Float32 alpha'
  ).toEqual([
    {name: 'clipCenter', offset: 0},
    {name: 'axis0', offset: 16},
    {name: 'axis1', offset: 24},
    {name: 'color', offset: 32}
  ]);
  expect(
    reflection.uniforms[0]?.size,
    'borrows the graph renderer uniform allocation without rewriting or uploading it'
  ).toBe(GPU_SPLAT_GRAPH_UNIFORM_BYTE_LENGTH);
  expect(
    reflection.storage.map(resource => ({name: resource.name, location: resource.binding})),
    'consumes only already projected records and globally sorted visible row identifiers'
  ).toEqual([
    {name: 'projectedRecords', location: 1},
    {name: 'sortedIds', location: 2}
  ]);
  expect(
    reflection.entry.vertex.map(entry => entry.name),
    'provides one instanced projected Gaussian vertex entry point'
  ).toEqual(['vertexMain']);
  expect(
    reflection.entry.fragment.map(entry => entry.name),
    'provides one exact integer picking fragment entry point'
  ).toEqual(['fragmentMain']);
  expect(
    GPU_SPLAT_GRAPH_PICKING_SHADER,
    'preserves packed projected source identity without interpolation or 24-bit encoding'
  ).toMatch(/@location\(2\)\s*@interpolate\(flat\)\s*projectedRowIndex:\s*u32/);
  expect(
    GPU_SPLAT_GRAPH_PICKING_SHADER,
    'excludes transparent and cutoff-clipped Gaussian fragments from picking'
  ).toMatch(/alpha\s*<=\s*0\.0\s*\|\|\s*alpha\s*<\s*graphUniforms\.alphaCutoff/);
  expect(
    GPU_SPLAT_GRAPH_PICKING_SHADER,
    'publishes the packed projected row through an exact signed integer attachment'
  ).toMatch(/pickingIndices\s*=\s*vec2<i32>\(i32\(input\.projectedRowIndex\),\s*0\)/);
  void 0;
});

it('resolveGPUSplatGraphPickInfo restores original streamed batches and large global rows', () => {
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

  expect(
    resolveGPUSplatGraphPickInfo({batchIndex: 0, objectIndex: 1}, [firstBatch, secondBatch]),
    'restores a labeled global source row exceeding RGBA picking precision'
  ).toEqual({batchIndex: 802, rowIndex: 16_777_225, batchRowIndex: 1, semanticId: 7});
  expect(
    resolveGPUSplatGraphPickInfo({batchIndex: 0, objectIndex: 2}, [firstBatch, secondBatch]),
    'restores arbitrary source batches and high signed-32-bit global source identities'
  ).toEqual({batchIndex: 65_535, rowIndex: 2_000_000_000, batchRowIndex: 0, semanticId: null});

  for (const invalidPick of [
    null,
    {batchIndex: null, objectIndex: null},
    {batchIndex: 1, objectIndex: 0},
    {batchIndex: 0, objectIndex: -1},
    {batchIndex: 0, objectIndex: 3},
    {batchIndex: 0, objectIndex: Number.NaN},
    {batchIndex: 0, objectIndex: 1.5}
  ]) {
    expect(
      resolveGPUSplatGraphPickInfo(invalidPick, [firstBatch, secondBatch]),
      'rejects missing, stale, negative, fractional, and out-of-bounds graph identities'
    ).toEqual({batchIndex: null, rowIndex: null, batchRowIndex: null, semanticId: null});
  }

  firstBatch.destroy();
  expect(
    resolveGPUSplatGraphPickInfo({batchIndex: 0, objectIndex: 1}, [firstBatch, secondBatch])
      .rowIndex,
    'rejects a projected row whose original source allocation was evicted or destroyed'
  ).toBe(null);
  secondBatch.destroy();
  void 0;
});

it('GPUSplatGraphPicker stays lazy, requires integer picking, and preserves borrowed ownership', async () => {
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

  expect(picker.mode, 'selects exact integer WebGPU picking').toBe('index');
  expect(picker.model, 'does not allocate a picking model before the first pick').toBe(undefined);
  expect(picker.manager.framebuffer, 'does not allocate picking attachments eagerly').toBe(null);
  expect(renderer.compiledGraph, 'never forces graph projection at construction').toBe(undefined);
  expect(
    () => new GPUSplatGraphPicker(renderer, {mode: 'color'}),
    'rejects lossy color picking for graph-native source identities'
  ).toThrow(/integer WebGPU picking/);
  expect(
    await picker.pick(null),
    'clears an absent pointer without compiling or submitting GPU work'
  ).toEqual({batchIndex: null, rowIndex: null, batchRowIndex: null, semanticId: null});

  picker.destroy();
  picker.destroy();
  expect(Boolean(picker.destroyed), 'releases owned picking resources idempotently').toBe(true);
  expect(Boolean(renderer.destroyed), 'never destroys the borrowing graph renderer').toBe(false);
  expect(
    Boolean(sourceBuffer.destroyed),
    'never destroys original caller-owned source buffers'
  ).toBe(false);
  expect(await picker.pick([0, 0]), 'does not submit after picker destruction').toBe(null);

  renderer.destroy();
  expect(
    () => new GPUSplatGraphPicker(renderer),
    'rejects previously destroyed graph renderers'
  ).toThrow(/live Gaussian splat graph renderer/);
  batch.destroy();
  void 0;
});

it('GPUSplatGraphPicker reuses graph buffers and one GPU-visible indirect command', async () => {
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
      expect(commandIndex, 'reuses the existing graph GPU-visible indirect command').toBe(0);
      indirectDrawCount++;
    }
  });

  const notifications: SplatPickingInfo[] = [];
  const picker = new GPUSplatGraphPicker(renderer, {onPick: info => notifications.push(info)});
  picker.manager.updatePickInfo = async () => {
    readbackCount++;
    return {batchIndex: 0, objectIndex: pickedProjectedRowIndex};
  };

  expect(
    await picker.pick([0, 0]),
    'resolves the GPU-picked packed projected row into its large original source identity'
  ).toEqual({batchIndex: 60_000, rowIndex: 25_000_400, batchRowIndex: 0, semanticId: 8});
  const initialPickingModel = picker.model;
  expect(
    Boolean(initialPickingModel),
    'creates one dedicated projected-record GPU picking model'
  ).toBe(true);
  expect(indirectDrawCount, 'issues one indirect draw across both original source batches').toBe(1);
  expect(encodingCount, 'refreshes only graph-owned projected source state').toBe(1);
  expect(readbackCount, 'reads exactly one asynchronous integer picking result').toBe(1);
  expect(notifications.length, 'notifies stable source selection once').toBe(1);

  await picker.pick([0, 0]);
  expect(indirectDrawCount, 'does not redraw unchanged pointer positions').toBe(1);
  expect(readbackCount, 'does not repeat GPU readback for unchanged positions').toBe(1);

  pickedProjectedRowIndex = 1;
  expect(
    await picker.pick([0, 0], {force: true}),
    'refreshes stable source identity after streamed, animated, or filtered graph updates'
  ).toEqual({batchIndex: 50, rowIndex: 101, batchRowIndex: 1, semanticId: 4});
  expect(picker.model, 'reuses the existing projected-record picking model').toBe(
    initialPickingModel
  );
  expect(indirectDrawCount, 'issues exactly one indirect draw for each forced graph pick').toBe(2);
  expect(notifications.length, 'publishes each changed semantic selection once').toBe(2);

  picker.clear();
  expect(notifications[2], 'publishes one cleared original source selection').toEqual({
    batchIndex: null,
    rowIndex: null,
    batchRowIndex: null,
    semanticId: null
  });
  picker.destroy();
  expect(
    Boolean(projectedRecordBuffer.destroyed),
    'does not destroy the borrowed projected-record buffer'
  ).toBe(false);
  expect(
    Boolean(sortedIndexBuffer.destroyed),
    'does not destroy the borrowed globally sorted index buffer'
  ).toBe(false);
  expect(
    Boolean(uniformBuffer.destroyed),
    'does not destroy the borrowed graph uniform allocation'
  ).toBe(false);
  expect(Boolean(firstBatch.destroyed), 'does not destroy the first original source batch').toBe(
    false
  );
  expect(Boolean(secondBatch.destroyed), 'does not destroy the second original source batch').toBe(
    false
  );

  renderer.destroy();
  projectedRecordBuffer.destroy();
  sortedIndexBuffer.destroy();
  uniformBuffer.destroy();
  firstBatch.destroy();
  secondBatch.destroy();
  void 0;
});

it('GPUSplatGraphPicker serializes deferred readback across independently replaced frontiers', async () => {
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
  expect(readbackCount, 'starts one asynchronous readback for the original source frontier').toBe(
    1
  );
  renderer.setProps({data: replacementBatch});
  expect(
    Boolean(firstBatch.destroyed),
    'frontier replacement preserves the original borrowed batch'
  ).toBe(false);
  const secondRequest = picker.pick([1, 0]);
  await Promise.resolve();
  expect(readbackCount, 'does not overlap GPU readbacks across different source frontiers').toBe(1);
  expect(graphEncodingCount, 'defers new graph projection until previous readback resolves').toBe(
    1
  );
  expect(indirectDrawCount, 'does not overwrite the first source snapshot with a new draw').toBe(1);

  finishFirstReadback({batchIndex: 0, objectIndex: 0});
  expect(
    await firstRequest,
    'resolves the delayed GPU identity against its original prepared source snapshot'
  ).toEqual({batchIndex: 8, rowIndex: 100, batchRowIndex: 0, semanticId: 4});
  expect(
    await secondRequest,
    'resolves the following queued GPU identity against the replacement frontier'
  ).toEqual({batchIndex: 70_000, rowIndex: 1_900_000_000, batchRowIndex: 0, semanticId: 9});
  expect(readbackCount, 'runs exactly one serialized readback for each pointer request').toBe(2);
  expect(
    graphEncodingCount,
    'encodes the replacement graph only after its predecessor settles'
  ).toBe(2);
  expect(indirectDrawCount, 'issues one graph-native indirect draw per serialized request').toBe(2);
  expect(
    notifications,
    'publishes correctly scoped source and semantic callbacks in request order'
  ).toEqual([
    {batchIndex: 8, rowIndex: 100, batchRowIndex: 0, semanticId: 4},
    {batchIndex: 70_000, rowIndex: 1_900_000_000, batchRowIndex: 0, semanticId: 9}
  ]);

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
  expect(readbackCount, 'starts another deferred source readback before pointer leave').toBe(3);
  expect(
    await picker.pick(null),
    'clears a pointer immediately without waiting for stale GPU readback'
  ).toEqual({batchIndex: null, rowIndex: null, batchRowIndex: null, semanticId: null});
  expect(notifications.length, 'publishes the cleared selection exactly once').toBe(3);
  finishStaleReadback({batchIndex: 0, objectIndex: 0});
  expect(
    await pendingStaleRequest,
    'never restores a cleared selection from an older completed GPU frame'
  ).toEqual({batchIndex: null, rowIndex: null, batchRowIndex: null, semanticId: null});
  expect(
    notifications.length,
    'suppresses stale source and semantic callbacks after clearing'
  ).toBe(3);
  expect(
    picker.manager.pickInfo,
    'clears stale engine-level integer picking and highlight identity'
  ).toEqual({batchIndex: null, objectIndex: null});

  picker.manager.updatePickInfo = async () => {
    const result = {batchIndex: 0, objectIndex: 0};
    picker.manager.props.onObjectPicked(result);
    return result;
  };
  expect(
    await picker.pick([1, 0], {force: true}),
    'accepts new pointer requests after invalidating an older in-flight picking generation'
  ).toEqual({batchIndex: 70_000, rowIndex: 1_900_000_000, batchRowIndex: 0, semanticId: 9});
  expect(notifications.length, 'resumes current-generation source notifications normally').toBe(4);

  picker.destroy();
  renderer.destroy();
  projectedRecordBuffer.destroy();
  sortedIndexBuffer.destroy();
  uniformBuffer.destroy();
  firstBatch.destroy();
  replacementBatch.destroy();
  void 0;
});

it('GPUSplatGraphMixedRenderer composites shared-depth meshes around one graph indirect draw', () => {
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
      expect(commandIndex, 'uses the graph-populated GPU visible-row indirect command').toBe(0);
      drawOrder.push('splats');
    }
  });

  const mixedRenderer = new GPUSplatGraphMixedRenderer(renderer, {
    colorAttachmentFormat: 'rgba8unorm',
    depthStencilAttachmentFormat: 'depth24plus',
    depthCompare: 'greater-equal',
    depthWriteEnabled: true
  });
  expect(mixedRenderer.model, 'does not allocate a display model before preparation').toBe(
    undefined
  );
  expect(
    Boolean(mixedRenderer.predraw(device.commandEncoder)),
    'updates projected graph resources before opening the caller-owned shared pass'
  ).toBe(true);
  expect(graphEncodingCount, 'prepares graph projection exactly once').toBe(1);
  const initialModel = mixedRenderer.model;
  expect(Boolean(initialModel), 'creates one reusable graph-projected Gaussian display model').toBe(
    true
  );
  expect(
    initialModel?.parameters.depthCompare,
    'supports application-owned reversed-depth scene policies'
  ).toBe('greater-equal');
  expect(
    initialModel?.parameters.depthWriteEnabled,
    'supports explicitly requested Gaussian depth writes'
  ).toBe(true);

  const renderPass = device.beginRenderPass({clearDepth: 0});
  expect(
    Boolean(
      mixedRenderer.draw(renderPass, {
        opaqueMeshes: [
          {
            draw(sharedPass) {
              expect(sharedPass, 'shares the caller-owned opaque mesh depth attachment').toBe(
                renderPass
              );
              drawOrder.push('opaque');
              return true;
            }
          }
        ],
        transparentMeshes: [
          {
            draw(sharedPass) {
              expect(sharedPass, 'shares the same transparent overlay render pass').toBe(
                renderPass
              );
              drawOrder.push('transparent');
            }
          }
        ]
      })
    ),
    'composites opaque meshes, graph-projected splats, and transparent overlays'
  ).toBe(true);
  renderPass.end();
  expect(drawOrder, 'preserves mixed-scene depth ordering').toEqual([
    'opaque',
    'splats',
    'transparent'
  ]);

  expect(
    Boolean(mixedRenderer.predraw(device.commandEncoder)),
    'prepares a later graph composition frame'
  ).toBe(true);
  expect(mixedRenderer.model, 'reuses the same projected-record display model').toBe(initialModel);
  mixedRenderer.destroy();
  mixedRenderer.destroy();
  expect(
    Boolean(mixedRenderer.destroyed),
    'releases owned composition resources idempotently'
  ).toBe(true);
  expect(Boolean(renderer.destroyed), 'preserves the borrowed source graph renderer').toBe(false);
  expect(
    Boolean(projectedRecordBuffer.destroyed),
    'preserves borrowed projected Gaussian records'
  ).toBe(false);
  expect(
    Boolean(sortedIndexBuffer.destroyed),
    'preserves borrowed globally sorted graph indices'
  ).toBe(false);
  expect(Boolean(uniformBuffer.destroyed), 'preserves borrowed camera and styling uniforms').toBe(
    false
  );
  expect(
    Boolean(batch.destroyed),
    'preserves the independently owned original Gaussian source batch'
  ).toBe(false);

  renderer.destroy();
  projectedRecordBuffer.destroy();
  sortedIndexBuffer.destroy();
  uniformBuffer.destroy();
  batch.destroy();
  expect(
    () => new GPUSplatGraphMixedRenderer(renderer),
    'rejects graph renderers whose borrowed resources have already been destroyed'
  ).toThrow(/live Gaussian splat graph renderer/);
  void 0;
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
