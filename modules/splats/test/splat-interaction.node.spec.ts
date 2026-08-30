// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  acceptsSplatSemantic,
  makeGPUSplatData,
  resolveSplatPickInfo,
  SPLAT_COLOR_PICKING_FS_GLSL,
  SPLAT_PICKING_ATTRIBUTE_WGSL_SHADER,
  SPLAT_PICKING_FS_GLSL,
  SPLAT_PICKING_STORAGE_WGSL_SHADER,
  SplatPicker,
  SplatRenderer,
  type SplatPickingInfo,
  type SplatSource
} from '@luma.gl/splats';
import {NullDevice} from '@luma.gl/test-utils';

test('Gaussian semantic filters preserve class selections and stable streamed source identity', t => {
  const device = new NullDevice({});
  const labeled = makeGPUSplatData(
    device,
    makeInteractionSplatSource({semanticIds: [3, 7, 3], sourceBatchIndex: 8, rowIndexBase: 40})
  );
  const unlabeled = makeGPUSplatData(
    device,
    makeInteractionSplatSource({rowCount: 1, sourceBatchIndex: 9, rowIndexBase: 43})
  );

  t.ok(acceptsSplatSemantic(undefined, labeled, 1), 'retains every row without a filter');
  t.ok(acceptsSplatSemantic({include: [3]}, labeled, 0), 'includes selected semantic classes');
  t.notOk(acceptsSplatSemantic({include: [3]}, labeled, 1), 'rejects unselected semantic classes');
  t.notOk(
    acceptsSplatSemantic({include: new Set([3]), exclude: [3]}, labeled, 0),
    'exclusions take precedence over matching inclusions'
  );
  t.ok(
    acceptsSplatSemantic({exclude: new Set([7])}, labeled, 2),
    'accepts efficient Set-backed semantic selections'
  );
  t.notOk(
    acceptsSplatSemantic({include: [3]}, unlabeled, 0),
    'excludes unlabeled batches when selected classes are required'
  );
  t.ok(
    acceptsSplatSemantic({include: [3], includeUnlabeled: true}, unlabeled, 0),
    'optionally preserves unlabeled streamed batches'
  );
  t.notOk(
    acceptsSplatSemantic({includeUnlabeled: false}, unlabeled, 0),
    'can explicitly reject batches without semantic metadata'
  );

  const predicateCalls: Array<[number | undefined, number, number]> = [];
  t.ok(
    acceptsSplatSemantic(
      {
        predicate: (semanticId, rowIndex, sourceBatchIndex) => {
          predicateCalls.push([semanticId, rowIndex, sourceBatchIndex]);
          return rowIndex === 41;
        }
      },
      labeled,
      1
    ),
    'applies application-owned source-row predicates'
  );
  t.deepEqual(
    predicateCalls,
    [[7, 41, 8]],
    'passes semantic classes, stable global rows, and original source batch identity'
  );

  labeled.destroy();
  unlabeled.destroy();
  t.end();
});

test('SplatRenderer applies semantic filters across mixed labeled and unlabeled source batches', async t => {
  const device = new NullDevice({});
  const labeled = makeGPUSplatData(
    device,
    makeInteractionSplatSource({semanticIds: [2, 5, 2], sourceBatchIndex: 4, rowIndexBase: 30})
  );
  const unlabeled = makeGPUSplatData(
    device,
    makeInteractionSplatSource({rowCount: 1, sourceBatchIndex: 9, rowIndexBase: 60})
  );
  const sourceOpacityBuffer = labeled.opacities.data[0].buffer;
  const renderer = new SplatRenderer(device, {
    data: [labeled, unlabeled],
    viewportSize: [8, 8],
    semanticFilter: {include: [2]}
  });

  t.deepEqual(
    Array.from(renderer.getSortedIndices()),
    [30, 32],
    'retains selected stable source rows while excluding unlabeled source batches'
  );
  const maskedOpacity = await renderer.getBatchOpacityBuffer(0).readAsync();
  t.deepEqual(
    Array.from(
      new Float32Array(
        maskedOpacity.buffer,
        maskedOpacity.byteOffset,
        maskedOpacity.byteLength / Float32Array.BYTES_PER_ELEMENT
      )
    ),
    [1, 0, 1],
    'uses renderer-owned WebGL visibility masks without modifying source opacity buffers'
  );

  renderer.setProps({semanticFilter: {include: [5], includeUnlabeled: true}});
  t.deepEqual(
    Array.from(renderer.getSortedIndices()),
    [31, 60],
    'updates semantic selection while optionally retaining unlabeled source batches'
  );
  renderer.setProps({semanticFilter: undefined});
  t.equal(renderer.stats.visibleSplatCount, 4, 'restores every source row when the filter clears');
  t.equal(
    renderer.getBatchOpacityBuffer(0),
    sourceOpacityBuffer,
    'reuses the original source opacity allocation after clearing semantic filtering'
  );

  renderer.destroy();
  t.notOk(
    sourceOpacityBuffer.destroyed,
    'destroying semantic masks preserves caller-owned buffers'
  );
  labeled.destroy();
  unlabeled.destroy();
  t.end();
});

test('resolveSplatPickInfo preserves stable source rows and rejects stale batch identities', t => {
  const device = new NullDevice({});
  const firstBatch = makeGPUSplatData(
    device,
    makeInteractionSplatSource({semanticIds: [6, 9], sourceBatchIndex: 12, rowIndexBase: 100})
  );
  const secondBatch = makeGPUSplatData(
    device,
    makeInteractionSplatSource({rowCount: 1, sourceBatchIndex: 24, rowIndexBase: 500})
  );

  t.deepEqual(
    resolveSplatPickInfo({batchIndex: 0, objectIndex: 101}, [firstBatch, secondBatch]),
    {batchIndex: 12, rowIndex: 101, batchRowIndex: 1, semanticId: 9},
    'maps GPU batch positions to original batch identities and stable semantic source rows'
  );
  t.deepEqual(
    resolveSplatPickInfo({batchIndex: 1, objectIndex: 500}, [firstBatch, secondBatch]),
    {batchIndex: 24, rowIndex: 500, batchRowIndex: 0, semanticId: null},
    'preserves unlabeled source-row picks without inventing semantic metadata'
  );
  for (const invalidPick of [
    {batchIndex: null, objectIndex: null},
    {batchIndex: 3, objectIndex: 100},
    {batchIndex: 0, objectIndex: 500},
    {batchIndex: 0, objectIndex: 99},
    {batchIndex: 0, objectIndex: Number.NaN}
  ]) {
    t.deepEqual(
      resolveSplatPickInfo(invalidPick, [firstBatch, secondBatch]),
      {batchIndex: null, rowIndex: null, batchRowIndex: null, semanticId: null},
      'rejects missing, stale, out-of-bounds, and noninteger picking payloads'
    );
  }

  firstBatch.destroy();
  t.equal(
    resolveSplatPickInfo({batchIndex: 0, objectIndex: 100}, [firstBatch]).rowIndex,
    null,
    'rejects source batches already evicted or destroyed by their owners'
  );
  secondBatch.destroy();
  t.end();
});

test('SplatPicker owns a dedicated GPU pipeline and preserves semantic source identity', async t => {
  const device = new NullDevice({});
  const encodedReadbacks: Uint8Array[] = [new Uint8Array([2, 0, 0, 1])];
  let readbackCount = 0;
  device.readPixelsToArrayWebGL = () => {
    readbackCount++;
    return encodedReadbacks[encodedReadbacks.length - 1];
  };

  const firstBatch = makeGPUSplatData(
    device,
    makeInteractionSplatSource({semanticIds: [4], sourceBatchIndex: 3, rowIndexBase: 10})
  );
  const secondBatch = makeGPUSplatData(
    device,
    makeInteractionSplatSource({semanticIds: [4, 8], sourceBatchIndex: 7, rowIndexBase: 20})
  );
  const renderer = new SplatRenderer(device, {
    data: [firstBatch, secondBatch],
    viewportSize: [1, 1],
    semanticFilter: {include: [8]}
  });
  const callbacks: SplatPickingInfo[] = [];
  const picker = new SplatPicker(renderer, {onPick: info => callbacks.push(info)});
  const sourceBuffer = secondBatch.positions.data[0].buffer;

  t.equal(picker.mode, 'color', 'falls back to portable RGBA picking without integer attachments');
  t.deepEqual(
    await picker.pick([0, 0]),
    {batchIndex: 7, rowIndex: 21, batchRowIndex: 1, semanticId: 8},
    'reconstructs globally stable source rows from compact batch-local GPU picking slots'
  );
  t.ok(picker.model, 'creates a dedicated GPU picking model independently of the display model');
  t.equal(callbacks.length, 1, 'emits exactly one changed-pick notification');

  await picker.pick([0, 0]);
  t.equal(readbackCount, 1, 'reuses the latest GPU result when the cursor does not move');
  await picker.pick([0, 0], {force: true});
  t.equal(readbackCount, 2, 'supports forced readback for animated or newly streamed splats');

  picker.clear();
  t.deepEqual(
    callbacks[1],
    {batchIndex: null, rowIndex: null, batchRowIndex: null, semanticId: null},
    'clears previously selected semantic source identity'
  );
  picker.destroy();
  picker.destroy();
  t.notOk(sourceBuffer.destroyed, 'destroying picking resources preserves borrowed source buffers');
  t.notOk(renderer.destroyed, 'destroying the picker never destroys its borrowing renderer');

  renderer.destroy();
  firstBatch.destroy();
  secondBatch.destroy();
  t.end();
});

test('SplatPicker packs hundreds of resident WebGL batches without truncating global source rows', async t => {
  const device = new NullDevice({});
  let encodedReadback = new Uint8Array([2, 0, 0, 1]);
  device.readPixelsToArrayWebGL = () => encodedReadback;

  const batches = Array.from({length: 260}, (_, batchIndex) =>
    makeGPUSplatData(
      device,
      makeInteractionSplatSource({
        rowCount: 1,
        sourceBatchIndex: 1_000 + batchIndex,
        rowIndexBase:
          batchIndex === 0 ? 10 : batchIndex === 1 ? 16_777_225 : 30_000_000 + batchIndex
      })
    )
  );
  const renderer = new SplatRenderer(device, {data: batches, viewportSize: [1, 1]});
  const picker = new SplatPicker(renderer);

  t.deepEqual(
    await picker.pick([0, 0]),
    {batchIndex: 1_001, rowIndex: 16_777_225, batchRowIndex: 0, semanticId: null},
    'distinguishes globally separated source rows with identical 24-bit modulo residues'
  );

  encodedReadback = new Uint8Array([4, 1, 0, 1]);
  t.deepEqual(
    await picker.pick([0, 0], {force: true}),
    {batchIndex: 1_259, rowIndex: 30_000_259, batchRowIndex: 0, semanticId: null},
    'packs batch ordinals above the RGBA alpha limit into shared batch-local picking slots'
  );

  picker.destroy();
  renderer.destroy();
  for (const batch of batches) {
    batch.destroy();
  }
  t.end();
});

test('Gaussian GPU picking shaders preserve source identity and Gaussian alpha visibility', t => {
  for (const shader of [SPLAT_PICKING_STORAGE_WGSL_SHADER, SPLAT_PICKING_ATTRIBUTE_WGSL_SHADER]) {
    t.ok(shader.includes('@location(1) pickingColor : vec2<i32>'), 'writes integer GPU pick IDs');
    t.ok(
      shader.includes('picking_getPickingColor(input.sourceRowIndex)'),
      'uses global source rows'
    );
    t.ok(shader.includes('alpha < splat.alphaCutoff'), 'rejects transparent Gaussian fragments');
  }
  t.ok(SPLAT_PICKING_FS_GLSL.includes('out ivec4 pickingColor'), 'supports integer WebGL targets');
  t.ok(
    SPLAT_COLOR_PICKING_FS_GLSL.includes('picking_getPickingColor()'),
    'supports portable RGBA WebGL picking targets'
  );
  t.end();
});

function makeInteractionSplatSource({
  rowCount,
  semanticIds,
  sourceBatchIndex = 0,
  rowIndexBase = 0
}: {
  rowCount?: number;
  semanticIds?: readonly number[];
  sourceBatchIndex?: number;
  rowIndexBase?: number;
}): SplatSource {
  const sourceRowCount = semanticIds?.length ?? rowCount ?? 1;
  const positions = new Float32Array(sourceRowCount * 3);
  const scales = new Float32Array(sourceRowCount * 3);
  const rotations = new Float32Array(sourceRowCount * 4);
  const colors = new Uint8Array(sourceRowCount * 4);
  const opacities = new Float32Array(sourceRowCount);

  for (let rowIndex = 0; rowIndex < sourceRowCount; rowIndex++) {
    positions[rowIndex * 3 + 2] = 0.5;
    scales.set([0.5, 0.5, 0.1], rowIndex * 3);
    rotations[rowIndex * 4] = 1;
    colors.set([255, 128, 64, 255], rowIndex * 4);
    opacities[rowIndex] = 1;
  }

  return {
    positions,
    scales,
    rotations,
    colors,
    opacities,
    ...(semanticIds ? {semanticIds: Uint32Array.from(semanticIds)} : {}),
    sourceBatchIndex,
    rowIndexBase
  };
}
