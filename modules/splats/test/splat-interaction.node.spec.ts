// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
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

it('Gaussian semantic filters preserve class selections and stable streamed source identity', () => {
  const device = new NullDevice({});
  const labeled = makeGPUSplatData(
    device,
    makeInteractionSplatSource({semanticIds: [3, 7, 3], sourceBatchIndex: 8, rowIndexBase: 40})
  );
  const unlabeled = makeGPUSplatData(
    device,
    makeInteractionSplatSource({rowCount: 1, sourceBatchIndex: 9, rowIndexBase: 43})
  );

  expect(
    Boolean(acceptsSplatSemantic(undefined, labeled, 1)),
    'retains every row without a filter'
  ).toBe(true);
  expect(
    Boolean(acceptsSplatSemantic({include: [3]}, labeled, 0)),
    'includes selected semantic classes'
  ).toBe(true);
  expect(
    Boolean(acceptsSplatSemantic({include: [3]}, labeled, 1)),
    'rejects unselected semantic classes'
  ).toBe(false);
  expect(
    Boolean(acceptsSplatSemantic({include: new Set([3]), exclude: [3]}, labeled, 0)),
    'exclusions take precedence over matching inclusions'
  ).toBe(false);
  expect(
    Boolean(acceptsSplatSemantic({exclude: new Set([7])}, labeled, 2)),
    'accepts efficient Set-backed semantic selections'
  ).toBe(true);
  expect(
    Boolean(acceptsSplatSemantic({include: [3]}, unlabeled, 0)),
    'excludes unlabeled batches when selected classes are required'
  ).toBe(false);
  expect(
    Boolean(acceptsSplatSemantic({include: [3], includeUnlabeled: true}, unlabeled, 0)),
    'optionally preserves unlabeled streamed batches'
  ).toBe(true);
  expect(
    Boolean(acceptsSplatSemantic({includeUnlabeled: false}, unlabeled, 0)),
    'can explicitly reject batches without semantic metadata'
  ).toBe(false);

  const predicateCalls: Array<[number | undefined, number, number]> = [];
  expect(
    Boolean(
      acceptsSplatSemantic(
        {
          predicate: (semanticId, rowIndex, sourceBatchIndex) => {
            predicateCalls.push([semanticId, rowIndex, sourceBatchIndex]);
            return rowIndex === 41;
          }
        },
        labeled,
        1
      )
    ),
    'applies application-owned source-row predicates'
  ).toBe(true);
  expect(
    predicateCalls,
    'passes semantic classes, stable global rows, and original source batch identity'
  ).toEqual([[7, 41, 8]]);

  labeled.destroy();
  unlabeled.destroy();
  void 0;
});

it('SplatRenderer applies semantic filters across mixed labeled and unlabeled source batches', async () => {
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

  expect(
    Array.from(renderer.getSortedIndices()),
    'retains selected stable source rows while excluding unlabeled source batches'
  ).toEqual([30, 32]);
  const maskedOpacity = await renderer.getBatchOpacityBuffer(0).readAsync();
  expect(
    Array.from(
      new Float32Array(
        maskedOpacity.buffer,
        maskedOpacity.byteOffset,
        maskedOpacity.byteLength / Float32Array.BYTES_PER_ELEMENT
      )
    ),
    'uses renderer-owned WebGL visibility masks without modifying source opacity buffers'
  ).toEqual([1, 0, 1]);

  renderer.setProps({semanticFilter: {include: [5], includeUnlabeled: true}});
  expect(
    Array.from(renderer.getSortedIndices()),
    'updates semantic selection while optionally retaining unlabeled source batches'
  ).toEqual([31, 60]);
  renderer.setProps({semanticFilter: undefined});
  expect(renderer.stats.visibleSplatCount, 'restores every source row when the filter clears').toBe(
    4
  );
  expect(
    renderer.getBatchOpacityBuffer(0),
    'reuses the original source opacity allocation after clearing semantic filtering'
  ).toBe(sourceOpacityBuffer);

  renderer.destroy();
  expect(
    Boolean(sourceOpacityBuffer.destroyed),
    'destroying semantic masks preserves caller-owned buffers'
  ).toBe(false);
  labeled.destroy();
  unlabeled.destroy();
  void 0;
});

it('resolveSplatPickInfo preserves stable source rows and rejects stale batch identities', () => {
  const device = new NullDevice({});
  const firstBatch = makeGPUSplatData(
    device,
    makeInteractionSplatSource({semanticIds: [6, 9], sourceBatchIndex: 12, rowIndexBase: 100})
  );
  const secondBatch = makeGPUSplatData(
    device,
    makeInteractionSplatSource({rowCount: 1, sourceBatchIndex: 24, rowIndexBase: 500})
  );

  expect(
    resolveSplatPickInfo({batchIndex: 0, objectIndex: 101}, [firstBatch, secondBatch]),
    'maps GPU batch positions to original batch identities and stable semantic source rows'
  ).toEqual({batchIndex: 12, rowIndex: 101, batchRowIndex: 1, semanticId: 9});
  expect(
    resolveSplatPickInfo({batchIndex: 1, objectIndex: 500}, [firstBatch, secondBatch]),
    'preserves unlabeled source-row picks without inventing semantic metadata'
  ).toEqual({batchIndex: 24, rowIndex: 500, batchRowIndex: 0, semanticId: null});
  for (const invalidPick of [
    {batchIndex: null, objectIndex: null},
    {batchIndex: 3, objectIndex: 100},
    {batchIndex: 0, objectIndex: 500},
    {batchIndex: 0, objectIndex: 99},
    {batchIndex: 0, objectIndex: Number.NaN}
  ]) {
    expect(
      resolveSplatPickInfo(invalidPick, [firstBatch, secondBatch]),
      'rejects missing, stale, out-of-bounds, and noninteger picking payloads'
    ).toEqual({batchIndex: null, rowIndex: null, batchRowIndex: null, semanticId: null});
  }

  firstBatch.destroy();
  expect(
    resolveSplatPickInfo({batchIndex: 0, objectIndex: 100}, [firstBatch]).rowIndex,
    'rejects source batches already evicted or destroyed by their owners'
  ).toBe(null);
  secondBatch.destroy();
  void 0;
});

it('SplatPicker owns a dedicated GPU pipeline and preserves semantic source identity', async () => {
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

  expect(picker.mode, 'falls back to portable RGBA picking without integer attachments').toBe(
    'color'
  );
  expect(
    await picker.pick([0, 0]),
    'reconstructs globally stable source rows from compact batch-local GPU picking slots'
  ).toEqual({batchIndex: 7, rowIndex: 21, batchRowIndex: 1, semanticId: 8});
  expect(
    Boolean(picker.model),
    'creates a dedicated GPU picking model independently of the display model'
  ).toBe(true);
  expect(callbacks.length, 'emits exactly one changed-pick notification').toBe(1);

  await picker.pick([0, 0]);
  expect(readbackCount, 'reuses the latest GPU result when the cursor does not move').toBe(1);
  await picker.pick([0, 0], {force: true});
  expect(readbackCount, 'supports forced readback for animated or newly streamed splats').toBe(2);

  picker.clear();
  expect(callbacks[1], 'clears previously selected semantic source identity').toEqual({
    batchIndex: null,
    rowIndex: null,
    batchRowIndex: null,
    semanticId: null
  });
  picker.destroy();
  picker.destroy();
  expect(
    Boolean(sourceBuffer.destroyed),
    'destroying picking resources preserves borrowed source buffers'
  ).toBe(false);
  expect(
    Boolean(renderer.destroyed),
    'destroying the picker never destroys its borrowing renderer'
  ).toBe(false);

  renderer.destroy();
  firstBatch.destroy();
  secondBatch.destroy();
  void 0;
});

it('SplatPicker packs hundreds of resident WebGL batches without truncating global source rows', async () => {
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

  expect(
    await picker.pick([0, 0]),
    'distinguishes globally separated source rows with identical 24-bit modulo residues'
  ).toEqual({batchIndex: 1_001, rowIndex: 16_777_225, batchRowIndex: 0, semanticId: null});

  encodedReadback = new Uint8Array([4, 1, 0, 1]);
  expect(
    await picker.pick([0, 0], {force: true}),
    'packs batch ordinals above the RGBA alpha limit into shared batch-local picking slots'
  ).toEqual({batchIndex: 1_259, rowIndex: 30_000_259, batchRowIndex: 0, semanticId: null});

  picker.destroy();
  renderer.destroy();
  for (const batch of batches) {
    batch.destroy();
  }
  void 0;
});

it('Gaussian GPU picking shaders preserve source identity and Gaussian alpha visibility', () => {
  for (const shader of [SPLAT_PICKING_STORAGE_WGSL_SHADER, SPLAT_PICKING_ATTRIBUTE_WGSL_SHADER]) {
    expect(
      Boolean(shader.includes('@location(1) pickingColor : vec2<i32>')),
      'writes integer GPU pick IDs'
    ).toBe(true);
    expect(
      Boolean(shader.includes('picking_getPickingColor(input.sourceRowIndex)')),
      'uses global source rows'
    ).toBe(true);
    expect(
      Boolean(shader.includes('alpha < splat.alphaCutoff')),
      'rejects transparent Gaussian fragments'
    ).toBe(true);
  }
  expect(
    Boolean(SPLAT_PICKING_FS_GLSL.includes('out ivec4 pickingColor')),
    'supports integer WebGL targets'
  ).toBe(true);
  expect(
    Boolean(SPLAT_COLOR_PICKING_FS_GLSL.includes('picking_getPickingColor()')),
    'supports portable RGBA WebGL picking targets'
  ).toBe(true);
  void 0;
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
