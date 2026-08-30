// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  makeGPUSplatData,
  SplatRenderer,
  SplatResidencyManager,
  type GPUSplatData,
  type SplatResidencyEvictionReason,
  type SplatSource
} from '@luma.gl/splats';
import {NullDevice} from '@luma.gl/test-utils';

test('SplatResidencyManager preserves independent source batches and exact GPU allocations', t => {
  const device = new NullDevice({});
  const firstBatch = makeGPUSplatData(device, makeSplatResidencySource(2, 4, 11));
  const secondBatch = makeGPUSplatData(device, makeSplatResidencySource(3, 5, 13));
  const manager = new SplatResidencyManager({
    maxGpuBytes: firstBatch.byteLength + secondBatch.byteLength,
    maxResidentSplats: 5,
    maxResidentChunks: 2
  });
  const firstChunk = manager.add(firstBatch, {
    priority: 3,
    levelOfDetail: 2,
    bounds: {center: [1, 2, 3], radius: 4}
  });
  const secondChunk = manager.register(secondBatch, {id: 'tile/5/13', priority: 7});

  t.equal(firstChunk?.id, '4:11', 'derives stable default identity from source metadata');
  t.equal(secondChunk?.id, 'tile/5/13', 'retains explicit streamed tile identity');
  t.equal(firstChunk?.levelOfDetail, 2, 'retains caller-defined hierarchy level');
  t.deepEqual(
    firstChunk?.bounds,
    {center: [1, 2, 3], radius: 4},
    'retains explicit source tile bounds'
  );
  t.deepEqual(
    manager.getResidentBatches(),
    [firstBatch, secondBatch],
    'preserves independently prepared source batches in admission order'
  );
  t.equal(manager.residentChunks.length, 2, 'exposes explicit independent chunk metadata');
  t.equal(manager.stats.residentChunkCount, 2, 'counts intact source batches');
  t.equal(manager.stats.residentSplatCount, 5, 'counts logical source rows');
  t.equal(
    manager.stats.residentGpuByteLength,
    firstBatch.byteLength + secondBatch.byteLength,
    'accounts for every original source GPU allocation'
  );
  t.deepEqual(
    manager.residentBatches.map(batch => batch.sourceInfo),
    [firstBatch.sourceInfo, secondBatch.sourceInfo],
    'never combines source batch identities or global row offsets'
  );
  t.equal(manager.getChunk(firstBatch), firstChunk, 'resolves exact prepared source-batch objects');
  t.equal(manager.getChunk('tile/5/13'), secondChunk, 'resolves explicit tile identities');

  manager.destroy();
  t.notOk(firstBatch.destroyed, 'borrowing residency preserves the first caller-owned batch');
  t.notOk(secondBatch.destroyed, 'borrowing residency preserves the second caller-owned batch');
  firstBatch.destroy();
  secondBatch.destroy();
  t.end();
});

test('SplatResidencyManager evicts by priority and least-recently-used access', t => {
  const device = new NullDevice({});
  const firstBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 0, 0));
  const secondBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 1, 1));
  const thirdBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 2, 2));
  const fourthBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 3, 3));
  const manager = new SplatResidencyManager({maxResidentChunks: 2});

  manager.add(firstBatch, {id: 'low', priority: 1});
  manager.add(secondBatch, {id: 'high', priority: 5});
  manager.add(thirdBatch, {id: 'medium', priority: 3});

  t.notOk(manager.has('low'), 'evicts a less valuable resident before a more valuable one');
  t.ok(manager.has('high'), 'preserves higher-priority source batches');
  t.ok(manager.has('medium'), 'admits the more valuable replacement');
  t.equal(manager.stats.evictedChunkCount, 1, 'records the budget-triggered eviction');
  t.equal(
    manager.add(fourthBatch, {id: 'rejected', priority: 2}),
    undefined,
    'rejects a tile that would require evicting more valuable resident data'
  );
  t.deepEqual(
    manager.residentBatches,
    [secondBatch, thirdBatch],
    'leaves all resident batches untouched after a rejected admission'
  );
  t.equal(manager.stats.rejectedChunkCount, 1, 'records rejected source tiles');

  manager.setPriority('high', 3);
  manager.touch('high');
  manager.add(fourthBatch, {id: 'replacement', priority: 3});

  t.ok(manager.has('high'), 'retains the recently accessed equal-priority tile');
  t.notOk(manager.has('medium'), 'evicts the least-recently-used equal-priority tile');
  t.ok(manager.has(fourthBatch), 'retains exact replacement source identity');
  t.equal(manager.stats.evictedChunkCount, 2, 'records both bounded-residency evictions');

  manager.destroy();
  firstBatch.destroy();
  secondBatch.destroy();
  thirdBatch.destroy();
  fourthBatch.destroy();
  t.end();
});

test('SplatResidencyManager protects pinned tiles across shrinking budgets', t => {
  const device = new NullDevice({});
  const pinnedBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 0, 0));
  const transientBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 1, 1));
  const replacementBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 2, 2));
  const manager = new SplatResidencyManager({maxResidentChunks: 2});

  manager.add(pinnedBatch, {id: 'pinned', priority: 0, pinned: true});
  manager.add(transientBatch, {id: 'transient', priority: 10});
  manager.setBudget({maxResidentChunks: 1});

  t.ok(manager.has('pinned'), 'retains a pinned tile despite its lower priority');
  t.notOk(manager.has('transient'), 'evicts unprotected data after a reduced chunk budget');
  t.equal(manager.stats.pinnedChunkCount, 1, 'reports protected source tiles');
  t.notOk(manager.evict('pinned'), 'does not explicitly evict protected data without force');
  t.equal(
    manager.add(replacementBatch, {id: 'replacement', priority: 100}),
    undefined,
    'never evicts pinned data for a more valuable incoming source tile'
  );

  manager.setBudget(0);
  t.ok(manager.stats.overBudget, 'reports pinned allocations exceeding a reduced byte budget');
  t.ok(manager.has('pinned'), 'never destroys or removes protected over-budget data');
  t.ok(manager.unpin('pinned'), 'allows callers to release explicit residency protection');
  t.notOk(manager.has('pinned'), 'immediately trims the newly unprotected over-budget tile');
  t.notOk(manager.stats.overBudget, 'restores all active allocation limits after eviction');

  manager.destroy();
  pinnedBatch.destroy();
  transientBatch.destroy();
  replacementBatch.destroy();
  t.end();
});

test('SplatResidencyManager never returns a source chunk evicted by metadata updates', async t => {
  const device = new NullDevice({});
  const registeredBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 0, 0));
  const loadedBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 1, 1));
  const registeredManager = new SplatResidencyManager({ownsData: true});
  const loadedManager = new SplatResidencyManager({ownsData: true});

  registeredManager.register(registeredBatch, {id: 'registered', pinned: true});
  registeredManager.setBudget(0);
  t.ok(registeredManager.stats.overBudget, 'preserves an over-budget pinned registered source');

  const registeredChunk = registeredManager.register(registeredBatch, {
    id: 'registered',
    pinned: false
  });
  t.equal(registeredChunk, undefined, 'does not return a registered chunk evicted by unpinning');
  t.ok(registeredBatch.destroyed, 'releases explicitly owned source data during unpinning');
  t.notOk(registeredManager.has('registered'), 'removes the stale source identity');
  t.notOk(registeredManager.stats.overBudget, 'restores the active byte budget');

  loadedManager.add(loadedBatch, {id: 'loaded', pinned: true});
  loadedManager.setBudget(0);
  let requestedLoad = false;
  const loadedChunk = await loadedManager.load(
    'loaded',
    () => {
      requestedLoad = true;
      return loadedBatch;
    },
    {pinned: false}
  );
  t.equal(loadedChunk, undefined, 'does not return a cached loaded chunk evicted by unpinning');
  t.notOk(requestedLoad, 'never reloads an already registered source identity');
  t.ok(loadedBatch.destroyed, 'releases the manager-owned previously loaded source');
  t.notOk(loadedManager.has('loaded'), 'never reports destroyed loaded data as resident');

  registeredManager.destroy();
  loadedManager.destroy();
  t.end();
});

test('SplatResidencyManager enforces byte, row, and chunk budgets transactionally', t => {
  const device = new NullDevice({});
  const firstBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 0, 0));
  const protectedBatch = makeGPUSplatData(device, makeSplatResidencySource(2, 1, 1));
  const oversizedBatch = makeGPUSplatData(device, makeSplatResidencySource(3, 2, 3));
  const evictionEvents: string[] = [];
  const manager = new SplatResidencyManager({
    maxGpuBytes: firstBatch.byteLength + protectedBatch.byteLength,
    maxResidentSplats: 3,
    maxResidentChunks: 2,
    onEvict: chunk => evictionEvents.push(chunk.id)
  });

  manager.add(firstBatch, {id: 'first', priority: 1});
  manager.add(protectedBatch, {id: 'protected', priority: 10});
  const rejectedChunk = manager.add(oversizedBatch, {id: 'oversized', priority: 5});

  t.equal(rejectedChunk, undefined, 'rejects an incoming source batch that cannot fit');
  t.deepEqual(evictionEvents, [], 'does not partially evict data before confirming admission');
  t.deepEqual(
    manager.residentBatches,
    [firstBatch, protectedBatch],
    'retains every resident batch after transactional rejection'
  );
  t.notOk(oversizedBatch.destroyed, 'does not claim ownership of synchronously rejected data');

  manager.setBudget({maxResidentSplats: 2});
  t.deepEqual(manager.residentBatches, [protectedBatch], 'enforces logical row budgets');
  manager.setBudget({maxResidentChunks: 0});
  t.deepEqual(manager.residentBatches, [], 'enforces independent source-chunk budgets');

  manager.destroy();
  firstBatch.destroy();
  protectedBatch.destroy();
  oversizedBatch.destroy();
  t.end();
});

test('SplatResidencyManager destroys only explicitly owned data after renderer callbacks', t => {
  const device = new NullDevice({});
  const firstBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 0, 0));
  const borrowedBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 1, 1));
  const finalBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 2, 2));
  const evictionEvents: Array<[string, SplatResidencyEvictionReason, boolean]> = [];
  const residencyEvents: number[][] = [];
  const manager = new SplatResidencyManager({
    maxResidentChunks: 1,
    ownsData: true,
    callbacks: {
      onEvict: (chunk, reason) => evictionEvents.push([chunk.id, reason, chunk.data.destroyed]),
      onResidencyChange: batches =>
        residencyEvents.push(batches.map(batch => batch.sourceBatchIndex))
    }
  });

  manager.add(firstBatch, {id: 'owned', priority: 1});
  manager.add(borrowedBatch, {id: 'borrowed', priority: 2, ownsData: false});

  t.ok(firstBatch.destroyed, 'destroys source buffers after manager-owned eviction');
  t.deepEqual(
    evictionEvents[0],
    ['owned', 'budget', false],
    'notifies renderer integrations before destroying manager-owned GPU buffers'
  );

  manager.add(finalBatch, {id: 'final', priority: 3});
  t.notOk(borrowedBatch.destroyed, 'preserves individually borrowed source buffers on eviction');
  t.deepEqual(
    residencyEvents,
    [[0], [], [1], [], [2]],
    'provides exact source-batch lists for borrowing renderer synchronization'
  );

  manager.destroy();
  manager.destroy();
  t.ok(finalBatch.destroyed, 'destroys the final manager-owned source batch exactly once');
  t.notOk(borrowedBatch.destroyed, 'never destroys an individually borrowed batch');
  t.deepEqual(
    evictionEvents[2],
    ['final', 'destroy', false],
    'keeps owned GPU buffers live until destruction callbacks have finished'
  );
  borrowedBatch.destroy();
  t.end();
});

test('SplatResidencyManager updates pinned and replacement source chunk metadata', t => {
  const device = new NullDevice({});
  const firstBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 0, 0));
  const replacementBatch = makeGPUSplatData(device, makeSplatResidencySource(2, 1, 1));
  const manager = new SplatResidencyManager({maxResidentChunks: 1});
  const firstChunk = manager.add(firstBatch, {id: 'tile', priority: 1, levelOfDetail: 3});
  const updatedChunk = manager.register(firstBatch, {
    id: 'tile',
    priority: 5,
    pinned: true,
    levelOfDetail: 1,
    bounds: {center: [5, 6, 7]}
  });

  t.equal(updatedChunk, firstChunk, 'updates explicit metadata without duplicating source batches');
  t.equal(updatedChunk?.priority, 5, 'retains updated source tile priority');
  t.ok(updatedChunk?.pinned, 'retains updated eviction protection');
  t.equal(updatedChunk?.levelOfDetail, 1, 'retains updated hierarchy level');
  t.deepEqual(updatedChunk?.bounds, {center: [5, 6, 7]}, 'retains updated tile bounds');
  t.equal(manager.stats.residentChunkCount, 1, 'never duplicates source allocations');
  t.ok(manager.remove('tile'), 'allows callers to explicitly remove pinned source tiles');
  t.notOk(firstBatch.destroyed, 'preserves explicitly removed caller-owned source batches');

  manager.add(firstBatch, {id: 'replaceable', priority: 10});
  const replacementChunk = manager.add(replacementBatch, {id: 'replaceable', priority: 1});
  t.equal(replacementChunk?.data, replacementBatch, 'replaces one explicit tile identity');
  t.equal(manager.stats.residentChunkCount, 1, 'preserves the intact chunk budget on replacement');
  t.equal(manager.stats.residentSplatCount, 2, 'accounts for replacement source row counts');

  manager.destroy();
  firstBatch.destroy();
  replacementBatch.destroy();
  t.end();
});

test('SplatResidencyManager coalesces asynchronous tile loads and respects late ownership', async t => {
  const device = new NullDevice({});
  const firstBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 0, 0));
  const rejectedBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 1, 1));
  const lateBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 2, 2));
  const manager = new SplatResidencyManager({maxResidentChunks: 1, ownsData: true});
  let loadCount = 0;
  const firstRequest = manager.load('tile', () => {
    loadCount++;
    return firstBatch;
  });
  const secondRequest = manager.load('tile', () => {
    loadCount++;
    return rejectedBatch;
  });

  t.equal(firstRequest, secondRequest, 'coalesces concurrent requests for the same source tile');
  t.equal(manager.stats.pendingChunkCount, 1, 'reports the pending source-batch load');
  const loadedChunk = await firstRequest;
  t.equal(loadCount, 1, 'invokes the source-batch loader exactly once');
  t.equal(loadedChunk?.data, firstBatch, 'retains the exact independently loaded source batch');
  t.equal(manager.stats.pendingChunkCount, 0, 'releases completed streaming requests');

  const rejectedChunk = await manager.load('rejected', () => rejectedBatch, {priority: -1});
  t.equal(rejectedChunk, undefined, 'rejects a lower-priority asynchronously loaded tile');
  t.ok(rejectedBatch.destroyed, 'releases manager-owned rejected asynchronous GPU allocations');

  let finishLoad: (data: GPUSplatData) => void = () => {};
  const pendingBatch = new Promise<GPUSplatData>(resolve => {
    finishLoad = resolve;
  });
  const lateRequest = manager.load('late', () => pendingBatch, {priority: 10});
  manager.destroy();
  finishLoad(lateBatch);
  t.equal(await lateRequest, undefined, 'does not admit source data after manager destruction');
  t.ok(lateBatch.destroyed, 'releases manager-owned source batches finishing after destruction');
  t.ok(firstBatch.destroyed, 'releases the original manager-owned resident source batch');
  t.end();
});

test('SplatResidencyManager reserves source allocations before asynchronous preparation', async t => {
  const device = new NullDevice({});
  const residentBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 0, 0));
  const estimatedGpuBytes = residentBatch.byteLength;
  const residencyEvents: string[] = [];
  let loadedBatch: GPUSplatData | undefined;
  let loaderInvocationCount = 0;
  const manager = new SplatResidencyManager({
    maxGpuBytes: estimatedGpuBytes,
    maxResidentSplats: 1,
    maxResidentChunks: 1,
    ownsData: true,
    onEvict: chunk => {
      residencyEvents.push(`evict:${chunk.id}:${chunk.data.destroyed}`);
    },
    onResidencyChange: batches => {
      residencyEvents.push(`resident:${batches.length}`);
    }
  });
  manager.add(residentBatch, {id: 'resident', priority: 1});

  const pendingChunk = manager.load(
    'incoming',
    () => {
      loaderInvocationCount++;
      residencyEvents.push(`load:${residentBatch.destroyed}`);
      loadedBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 1, 1));
      return loadedBatch;
    },
    {priority: 1, estimatedGpuBytes, estimatedSplatCount: 1}
  );

  t.ok(residentBatch.destroyed, 'destroys owned source buffers before the loader can allocate');
  t.equal(loaderInvocationCount, 0, 'reserves capacity before invoking asynchronous preparation');
  t.deepEqual(manager.residentBatches, [], 'detaches evicted source batches before loading');
  t.equal(manager.stats.pendingChunkCount, 1, 'retains the coalesced pending load');

  const incomingChunk = await pendingChunk;
  t.equal(incomingChunk?.data, loadedBatch, 'admits the exact independently prepared source batch');
  t.deepEqual(
    residencyEvents,
    ['resident:1', 'evict:resident:false', 'resident:0', 'load:true', 'resident:1'],
    'notifies renderers, releases owned GPU buffers, then invokes source preparation'
  );
  t.equal(manager.stats.residentGpuByteLength, estimatedGpuBytes, 'retains the exact byte budget');

  manager.destroy();
  t.ok(loadedBatch?.destroyed, 'preserves explicit ownership of the newly prepared source');
  t.end();
});

test('SplatResidencyManager rejects protected reservations without preparing or partially evicting', async t => {
  const device = new NullDevice({});
  const pinnedBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 0, 0));
  const lowerPriorityBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 1, 1));
  const higherPriorityBatch = makeGPUSplatData(device, makeSplatResidencySource(2, 2, 2));
  const evictionEvents: string[] = [];
  let pinnedLoaderInvocationCount = 0;
  let protectedLoaderInvocationCount = 0;
  const pinnedManager = new SplatResidencyManager({
    maxGpuBytes: pinnedBatch.byteLength,
    maxResidentSplats: 1,
    maxResidentChunks: 1,
    ownsData: true,
    onEvict: chunk => evictionEvents.push(chunk.id)
  });
  const protectedManager = new SplatResidencyManager({
    maxGpuBytes: lowerPriorityBatch.byteLength + higherPriorityBatch.byteLength,
    maxResidentSplats: 3,
    maxResidentChunks: 2,
    ownsData: true,
    onEvict: chunk => evictionEvents.push(chunk.id)
  });
  pinnedManager.add(pinnedBatch, {id: 'pinned', priority: 0, pinned: true});
  protectedManager.add(lowerPriorityBatch, {id: 'lower', priority: 1});
  protectedManager.add(higherPriorityBatch, {id: 'higher', priority: 10});

  const rejectedPinnedChunk = await pinnedManager.load(
    'pinned-replacement',
    () => {
      pinnedLoaderInvocationCount++;
      return makeGPUSplatData(device, makeSplatResidencySource(1, 3, 4));
    },
    {priority: 100, estimatedGpuBytes: pinnedBatch.byteLength, estimatedSplatCount: 1}
  );
  const rejectedProtectedChunk = await protectedManager.load(
    'protected-replacement',
    () => {
      protectedLoaderInvocationCount++;
      return makeGPUSplatData(device, makeSplatResidencySource(3, 4, 5));
    },
    {
      priority: 5,
      estimatedGpuBytes: lowerPriorityBatch.byteLength + higherPriorityBatch.byteLength,
      estimatedSplatCount: 3
    }
  );

  t.equal(rejectedPinnedChunk, undefined, 'rejects loads requiring a pinned source allocation');
  t.equal(pinnedLoaderInvocationCount, 0, 'never allocates a source protected by pinned residency');
  t.equal(rejectedProtectedChunk, undefined, 'rejects loads requiring higher-priority allocations');
  t.equal(
    protectedLoaderInvocationCount,
    0,
    'never prepares data that cannot displace more valuable source tiles'
  );
  t.deepEqual(evictionEvents, [], 'does not partially evict admissible tiles when admission fails');
  t.deepEqual(pinnedManager.residentBatches, [pinnedBatch], 'retains the protected pinned source');
  t.deepEqual(
    protectedManager.residentBatches,
    [lowerPriorityBatch, higherPriorityBatch],
    'retains every original batch after transactional reservation rejection'
  );
  t.equal(pinnedManager.stats.rejectedChunkCount, 1, 'counts rejected pinned reservations');
  t.equal(protectedManager.stats.rejectedChunkCount, 1, 'counts rejected protected reservations');
  t.equal(pinnedManager.stats.pendingChunkCount, 0, 'never registers rejected pinned loads');
  t.equal(protectedManager.stats.pendingChunkCount, 0, 'never registers rejected protected loads');

  pinnedManager.destroy();
  protectedManager.destroy();
  t.end();
});

test('SplatResidencyManager prevents concurrent pending reservations from exceeding budgets', async t => {
  const device = new NullDevice({});
  const firstBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 0, 0));
  const secondBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 1, 1));
  const unreservedBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 2, 2));
  const estimatedGpuBytes = firstBatch.byteLength;
  const manager = new SplatResidencyManager({
    maxGpuBytes: estimatedGpuBytes * 2,
    maxResidentSplats: 2,
    maxResidentChunks: 2,
    ownsData: true
  });
  let finishFirstLoad: (data: GPUSplatData) => void = () => {};
  let finishSecondLoad: (data: GPUSplatData) => void = () => {};
  let rejectedLoaderInvocationCount = 0;
  const firstData = new Promise<GPUSplatData>(resolve => {
    finishFirstLoad = resolve;
  });
  const secondData = new Promise<GPUSplatData>(resolve => {
    finishSecondLoad = resolve;
  });
  const reservationOptions = {estimatedGpuBytes, estimatedSplatCount: 1};
  const firstRequest = manager.load('first', () => firstData, reservationOptions);
  const duplicateFirstRequest = manager.load('first', () => secondBatch, reservationOptions);
  const secondRequest = manager.load('second', () => secondData, reservationOptions);
  const rejectedRequest = manager.load(
    'rejected',
    () => {
      rejectedLoaderInvocationCount++;
      return makeGPUSplatData(device, makeSplatResidencySource(1, 3, 3));
    },
    {priority: 100, ...reservationOptions}
  );

  t.equal(firstRequest, duplicateFirstRequest, 'coalesces reservations for the same source tile');
  t.equal(
    await rejectedRequest,
    undefined,
    'protects every previously reserved pending allocation'
  );
  t.equal(rejectedLoaderInvocationCount, 0, 'never invokes an overcommitted concurrent loader');
  t.equal(manager.stats.pendingChunkCount, 2, 'retains both independently reserved pending loads');
  t.equal(
    manager.add(unreservedBatch, {id: 'unreserved', priority: 100}),
    undefined,
    'prevents synchronous admission from consuming reserved source capacity'
  );
  t.notOk(unreservedBatch.destroyed, 'preserves ownership of synchronously rejected source data');

  finishSecondLoad(secondBatch);
  const secondChunk = await secondRequest;
  t.equal(secondChunk?.data, secondBatch, 'admits a later reservation finishing first');
  t.equal(manager.stats.pendingChunkCount, 1, 'retains the first pending reservation');

  finishFirstLoad(firstBatch);
  const firstChunk = await firstRequest;
  t.equal(firstChunk?.data, firstBatch, 'admits the remaining independently reserved source');
  t.deepEqual(
    manager.residentBatches,
    [secondBatch, firstBatch],
    'retains independent source batches in actual admission order'
  );
  t.equal(manager.stats.residentGpuByteLength, estimatedGpuBytes * 2, 'preserves the byte budget');
  t.equal(manager.stats.residentSplatCount, 2, 'preserves the logical row budget');
  t.equal(manager.stats.pendingChunkCount, 0, 'releases every completed pending reservation');

  manager.destroy();
  unreservedBatch.destroy();
  t.end();
});

test('SplatResidencyManager releases failed asynchronous allocation reservations', async t => {
  const device = new NullDevice({});
  const incomingBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 0, 0));
  const manager = new SplatResidencyManager({
    maxGpuBytes: incomingBatch.byteLength,
    maxResidentSplats: 1,
    maxResidentChunks: 1,
    ownsData: true
  });
  const reservationOptions = {
    estimatedGpuBytes: incomingBatch.byteLength,
    estimatedSplatCount: 1
  };
  const expectedError = new Error('Source preparation failed');
  const rejectedLoad = await manager
    .load('rejected', () => Promise.reject(expectedError), reservationOptions)
    .then(
      () => undefined,
      error => error
    );

  t.equal(rejectedLoad, expectedError, 'preserves the original asynchronous loader failure');
  t.equal(manager.stats.pendingChunkCount, 0, 'releases the rejected pending source identity');
  const admittedChunk = await manager.load('incoming', () => incomingBatch, reservationOptions);
  t.equal(admittedChunk?.data, incomingBatch, 'reuses GPU and source-row reservation capacity');
  t.equal(manager.stats.residentChunkCount, 1, 'reuses the independent source-chunk reservation');

  manager.destroy();
  t.ok(incomingBatch.destroyed, 'preserves manager ownership after reservation recovery');
  t.end();
});

test('SplatResidencyManager synchronizes borrowing renderers before owned batch eviction', t => {
  const device = new NullDevice({});
  const firstBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 0, 0));
  const secondBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 1, 1));
  const renderer = new SplatRenderer(device, {viewportSize: [100, 100]});
  const manager = new SplatResidencyManager({
    maxResidentChunks: 1,
    ownsData: true,
    onResidencyChange: batches => renderer.setProps({data: batches})
  });

  manager.add(firstBatch, {priority: 0});
  t.deepEqual(renderer.batches, [firstBatch], 'adds the independently resident source batch');
  manager.add(secondBatch, {priority: 1});
  t.ok(firstBatch.destroyed, 'destroys manager-owned data after renderer detachment');
  t.deepEqual(renderer.batches, [secondBatch], 'retains only the current source residency window');
  t.equal(renderer.stats.splatCount, 1, 'keeps renderer diagnostics within residency limits');

  manager.destroy();
  t.deepEqual(renderer.batches, [], 'detaches every source batch before final destruction');
  t.ok(secondBatch.destroyed, 'releases the final manager-owned source allocation');
  renderer.destroy();
  t.end();
});

function makeSplatResidencySource(
  splatCount: number,
  sourceBatchIndex: number,
  rowIndexBase: number
): SplatSource {
  const positions = new Float32Array(splatCount * 3);
  const scales = new Float32Array(splatCount * 3);
  const rotations = new Float32Array(splatCount * 4);
  const colors = new Uint8Array(splatCount * 4);
  const opacities = new Float32Array(splatCount);

  for (let splatIndex = 0; splatIndex < splatCount; splatIndex++) {
    positions[splatIndex * 3 + 2] = splatIndex * 0.1;
    scales.set([0.1, 0.08, 0.06], splatIndex * 3);
    rotations[splatIndex * 4] = 1;
    colors.set([255, 128, 32, 255], splatIndex * 4);
    opacities[splatIndex] = 1;
  }

  return {positions, scales, rotations, colors, opacities, sourceBatchIndex, rowIndexBase};
}
