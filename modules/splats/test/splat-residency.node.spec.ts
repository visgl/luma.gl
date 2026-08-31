// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {
  makeGPUSplatData,
  SplatRenderer,
  SplatResidencyManager,
  type GPUSplatData,
  type SplatResidencyEvictionReason,
  type SplatSource
} from '@luma.gl/splats';
import {NullDevice} from '@luma.gl/test-utils';

it('SplatResidencyManager preserves independent source batches and exact GPU allocations', () => {
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

  expect(firstChunk?.id, 'derives stable default identity from source metadata').toBe('4:11');
  expect(secondChunk?.id, 'retains explicit streamed tile identity').toBe('tile/5/13');
  expect(firstChunk?.levelOfDetail, 'retains caller-defined hierarchy level').toBe(2);
  expect(firstChunk?.bounds, 'retains explicit source tile bounds').toEqual({
    center: [1, 2, 3],
    radius: 4
  });
  expect(
    manager.getResidentBatches(),
    'preserves independently prepared source batches in admission order'
  ).toEqual([firstBatch, secondBatch]);
  expect(manager.residentChunks.length, 'exposes explicit independent chunk metadata').toBe(2);
  expect(manager.stats.residentChunkCount, 'counts intact source batches').toBe(2);
  expect(manager.stats.residentSplatCount, 'counts logical source rows').toBe(5);
  expect(
    manager.stats.residentGpuByteLength,
    'accounts for every original source GPU allocation'
  ).toBe(firstBatch.byteLength + secondBatch.byteLength);
  expect(
    manager.residentBatches.map(batch => batch.sourceInfo),
    'never combines source batch identities or global row offsets'
  ).toEqual([firstBatch.sourceInfo, secondBatch.sourceInfo]);
  expect(manager.getChunk(firstBatch), 'resolves exact prepared source-batch objects').toBe(
    firstChunk
  );
  expect(manager.getChunk('tile/5/13'), 'resolves explicit tile identities').toBe(secondChunk);

  manager.destroy();
  expect(
    Boolean(firstBatch.destroyed),
    'borrowing residency preserves the first caller-owned batch'
  ).toBe(false);
  expect(
    Boolean(secondBatch.destroyed),
    'borrowing residency preserves the second caller-owned batch'
  ).toBe(false);
  firstBatch.destroy();
  secondBatch.destroy();
  void 0;
});

it('SplatResidencyManager evicts by priority and least-recently-used access', () => {
  const device = new NullDevice({});
  const firstBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 0, 0));
  const secondBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 1, 1));
  const thirdBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 2, 2));
  const fourthBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 3, 3));
  const manager = new SplatResidencyManager({maxResidentChunks: 2});

  manager.add(firstBatch, {id: 'low', priority: 1});
  manager.add(secondBatch, {id: 'high', priority: 5});
  manager.add(thirdBatch, {id: 'medium', priority: 3});

  expect(
    Boolean(manager.has('low')),
    'evicts a less valuable resident before a more valuable one'
  ).toBe(false);
  expect(Boolean(manager.has('high')), 'preserves higher-priority source batches').toBe(true);
  expect(Boolean(manager.has('medium')), 'admits the more valuable replacement').toBe(true);
  expect(manager.stats.evictedChunkCount, 'records the budget-triggered eviction').toBe(1);
  expect(
    manager.add(fourthBatch, {id: 'rejected', priority: 2}),
    'rejects a tile that would require evicting more valuable resident data'
  ).toBe(undefined);
  expect(
    manager.residentBatches,
    'leaves all resident batches untouched after a rejected admission'
  ).toEqual([secondBatch, thirdBatch]);
  expect(manager.stats.rejectedChunkCount, 'records rejected source tiles').toBe(1);

  manager.setPriority('high', 3);
  manager.touch('high');
  manager.add(fourthBatch, {id: 'replacement', priority: 3});

  expect(Boolean(manager.has('high')), 'retains the recently accessed equal-priority tile').toBe(
    true
  );
  expect(Boolean(manager.has('medium')), 'evicts the least-recently-used equal-priority tile').toBe(
    false
  );
  expect(Boolean(manager.has(fourthBatch)), 'retains exact replacement source identity').toBe(true);
  expect(manager.stats.evictedChunkCount, 'records both bounded-residency evictions').toBe(2);

  manager.destroy();
  firstBatch.destroy();
  secondBatch.destroy();
  thirdBatch.destroy();
  fourthBatch.destroy();
  void 0;
});

it('SplatResidencyManager protects pinned tiles across shrinking budgets', () => {
  const device = new NullDevice({});
  const pinnedBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 0, 0));
  const transientBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 1, 1));
  const replacementBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 2, 2));
  const manager = new SplatResidencyManager({maxResidentChunks: 2});

  manager.add(pinnedBatch, {id: 'pinned', priority: 0, pinned: true});
  manager.add(transientBatch, {id: 'transient', priority: 10});
  manager.setBudget({maxResidentChunks: 1});

  expect(Boolean(manager.has('pinned')), 'retains a pinned tile despite its lower priority').toBe(
    true
  );
  expect(
    Boolean(manager.has('transient')),
    'evicts unprotected data after a reduced chunk budget'
  ).toBe(false);
  expect(manager.stats.pinnedChunkCount, 'reports protected source tiles').toBe(1);
  expect(
    Boolean(manager.evict('pinned')),
    'does not explicitly evict protected data without force'
  ).toBe(false);
  expect(
    manager.add(replacementBatch, {id: 'replacement', priority: 100}),
    'never evicts pinned data for a more valuable incoming source tile'
  ).toBe(undefined);

  manager.setBudget(0);
  expect(
    Boolean(manager.stats.overBudget),
    'reports pinned allocations exceeding a reduced byte budget'
  ).toBe(true);
  expect(
    Boolean(manager.has('pinned')),
    'never destroys or removes protected over-budget data'
  ).toBe(true);
  expect(
    Boolean(manager.unpin('pinned')),
    'allows callers to release explicit residency protection'
  ).toBe(true);
  expect(
    Boolean(manager.has('pinned')),
    'immediately trims the newly unprotected over-budget tile'
  ).toBe(false);
  expect(
    Boolean(manager.stats.overBudget),
    'restores all active allocation limits after eviction'
  ).toBe(false);

  manager.destroy();
  pinnedBatch.destroy();
  transientBatch.destroy();
  replacementBatch.destroy();
  void 0;
});

it('SplatResidencyManager never returns a source chunk evicted by metadata updates', async () => {
  const device = new NullDevice({});
  const registeredBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 0, 0));
  const loadedBatch = makeGPUSplatData(device, makeSplatResidencySource(1, 1, 1));
  const registeredManager = new SplatResidencyManager({ownsData: true});
  const loadedManager = new SplatResidencyManager({ownsData: true});

  registeredManager.register(registeredBatch, {id: 'registered', pinned: true});
  registeredManager.setBudget(0);
  expect(
    Boolean(registeredManager.stats.overBudget),
    'preserves an over-budget pinned registered source'
  ).toBe(true);

  const registeredChunk = registeredManager.register(registeredBatch, {
    id: 'registered',
    pinned: false
  });
  expect(registeredChunk, 'does not return a registered chunk evicted by unpinning').toBe(
    undefined
  );
  expect(
    Boolean(registeredBatch.destroyed),
    'releases explicitly owned source data during unpinning'
  ).toBe(true);
  expect(Boolean(registeredManager.has('registered')), 'removes the stale source identity').toBe(
    false
  );
  expect(Boolean(registeredManager.stats.overBudget), 'restores the active byte budget').toBe(
    false
  );

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
  expect(loadedChunk, 'does not return a cached loaded chunk evicted by unpinning').toBe(undefined);
  expect(Boolean(requestedLoad), 'never reloads an already registered source identity').toBe(false);
  expect(
    Boolean(loadedBatch.destroyed),
    'releases the manager-owned previously loaded source'
  ).toBe(true);
  expect(
    Boolean(loadedManager.has('loaded')),
    'never reports destroyed loaded data as resident'
  ).toBe(false);

  registeredManager.destroy();
  loadedManager.destroy();
  void 0;
});

it('SplatResidencyManager enforces byte, row, and chunk budgets transactionally', () => {
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

  expect(rejectedChunk, 'rejects an incoming source batch that cannot fit').toBe(undefined);
  expect(evictionEvents, 'does not partially evict data before confirming admission').toEqual([]);
  expect(
    manager.residentBatches,
    'retains every resident batch after transactional rejection'
  ).toEqual([firstBatch, protectedBatch]);
  expect(
    Boolean(oversizedBatch.destroyed),
    'does not claim ownership of synchronously rejected data'
  ).toBe(false);

  manager.setBudget({maxResidentSplats: 2});
  expect(manager.residentBatches, 'enforces logical row budgets').toEqual([protectedBatch]);
  manager.setBudget({maxResidentChunks: 0});
  expect(manager.residentBatches, 'enforces independent source-chunk budgets').toEqual([]);

  manager.destroy();
  firstBatch.destroy();
  protectedBatch.destroy();
  oversizedBatch.destroy();
  void 0;
});

it('SplatResidencyManager destroys only explicitly owned data after renderer callbacks', () => {
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

  expect(
    Boolean(firstBatch.destroyed),
    'destroys source buffers after manager-owned eviction'
  ).toBe(true);
  expect(
    evictionEvents[0],
    'notifies renderer integrations before destroying manager-owned GPU buffers'
  ).toEqual(['owned', 'budget', false]);

  manager.add(finalBatch, {id: 'final', priority: 3});
  expect(
    Boolean(borrowedBatch.destroyed),
    'preserves individually borrowed source buffers on eviction'
  ).toBe(false);
  expect(
    residencyEvents,
    'provides exact source-batch lists for borrowing renderer synchronization'
  ).toEqual([[0], [], [1], [], [2]]);

  manager.destroy();
  manager.destroy();
  expect(
    Boolean(finalBatch.destroyed),
    'destroys the final manager-owned source batch exactly once'
  ).toBe(true);
  expect(Boolean(borrowedBatch.destroyed), 'never destroys an individually borrowed batch').toBe(
    false
  );
  expect(
    evictionEvents[2],
    'keeps owned GPU buffers live until destruction callbacks have finished'
  ).toEqual(['final', 'destroy', false]);
  borrowedBatch.destroy();
  void 0;
});

it('SplatResidencyManager updates pinned and replacement source chunk metadata', () => {
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

  expect(updatedChunk, 'updates explicit metadata without duplicating source batches').toBe(
    firstChunk
  );
  expect(updatedChunk?.priority, 'retains updated source tile priority').toBe(5);
  expect(Boolean(updatedChunk?.pinned), 'retains updated eviction protection').toBe(true);
  expect(updatedChunk?.levelOfDetail, 'retains updated hierarchy level').toBe(1);
  expect(updatedChunk?.bounds, 'retains updated tile bounds').toEqual({center: [5, 6, 7]});
  expect(manager.stats.residentChunkCount, 'never duplicates source allocations').toBe(1);
  expect(
    Boolean(manager.remove('tile')),
    'allows callers to explicitly remove pinned source tiles'
  ).toBe(true);
  expect(
    Boolean(firstBatch.destroyed),
    'preserves explicitly removed caller-owned source batches'
  ).toBe(false);

  manager.add(firstBatch, {id: 'replaceable', priority: 10});
  const replacementChunk = manager.add(replacementBatch, {id: 'replaceable', priority: 1});
  expect(replacementChunk?.data, 'replaces one explicit tile identity').toBe(replacementBatch);
  expect(manager.stats.residentChunkCount, 'preserves the intact chunk budget on replacement').toBe(
    1
  );
  expect(manager.stats.residentSplatCount, 'accounts for replacement source row counts').toBe(2);

  manager.destroy();
  firstBatch.destroy();
  replacementBatch.destroy();
  void 0;
});

it('SplatResidencyManager coalesces asynchronous tile loads and respects late ownership', async () => {
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

  expect(firstRequest, 'coalesces concurrent requests for the same source tile').toBe(
    secondRequest
  );
  expect(manager.stats.pendingChunkCount, 'reports the pending source-batch load').toBe(1);
  const loadedChunk = await firstRequest;
  expect(loadCount, 'invokes the source-batch loader exactly once').toBe(1);
  expect(loadedChunk?.data, 'retains the exact independently loaded source batch').toBe(firstBatch);
  expect(manager.stats.pendingChunkCount, 'releases completed streaming requests').toBe(0);

  const rejectedChunk = await manager.load('rejected', () => rejectedBatch, {priority: -1});
  expect(rejectedChunk, 'rejects a lower-priority asynchronously loaded tile').toBe(undefined);
  expect(
    Boolean(rejectedBatch.destroyed),
    'releases manager-owned rejected asynchronous GPU allocations'
  ).toBe(true);

  let finishLoad: (data: GPUSplatData) => void = () => {};
  const pendingBatch = new Promise<GPUSplatData>(resolve => {
    finishLoad = resolve;
  });
  const lateRequest = manager.load('late', () => pendingBatch, {priority: 10});
  manager.destroy();
  finishLoad(lateBatch);
  expect(await lateRequest, 'does not admit source data after manager destruction').toBe(undefined);
  expect(
    Boolean(lateBatch.destroyed),
    'releases manager-owned source batches finishing after destruction'
  ).toBe(true);
  expect(
    Boolean(firstBatch.destroyed),
    'releases the original manager-owned resident source batch'
  ).toBe(true);
  void 0;
});

it('SplatResidencyManager reserves source allocations before asynchronous preparation', async () => {
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

  expect(
    Boolean(residentBatch.destroyed),
    'destroys owned source buffers before the loader can allocate'
  ).toBe(true);
  expect(loaderInvocationCount, 'reserves capacity before invoking asynchronous preparation').toBe(
    0
  );
  expect(manager.residentBatches, 'detaches evicted source batches before loading').toEqual([]);
  expect(manager.stats.pendingChunkCount, 'retains the coalesced pending load').toBe(1);

  const incomingChunk = await pendingChunk;
  expect(incomingChunk?.data, 'admits the exact independently prepared source batch').toBe(
    loadedBatch
  );
  expect(
    residencyEvents,
    'notifies renderers, releases owned GPU buffers, then invokes source preparation'
  ).toEqual(['resident:1', 'evict:resident:false', 'resident:0', 'load:true', 'resident:1']);
  expect(manager.stats.residentGpuByteLength, 'retains the exact byte budget').toBe(
    estimatedGpuBytes
  );

  manager.destroy();
  expect(
    Boolean(loadedBatch?.destroyed),
    'preserves explicit ownership of the newly prepared source'
  ).toBe(true);
  void 0;
});

it('SplatResidencyManager rejects protected reservations without preparing or partially evicting', async () => {
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

  expect(rejectedPinnedChunk, 'rejects loads requiring a pinned source allocation').toBe(undefined);
  expect(
    pinnedLoaderInvocationCount,
    'never allocates a source protected by pinned residency'
  ).toBe(0);
  expect(rejectedProtectedChunk, 'rejects loads requiring higher-priority allocations').toBe(
    undefined
  );
  expect(
    protectedLoaderInvocationCount,
    'never prepares data that cannot displace more valuable source tiles'
  ).toBe(0);
  expect(evictionEvents, 'does not partially evict admissible tiles when admission fails').toEqual(
    []
  );
  expect(pinnedManager.residentBatches, 'retains the protected pinned source').toEqual([
    pinnedBatch
  ]);
  expect(
    protectedManager.residentBatches,
    'retains every original batch after transactional reservation rejection'
  ).toEqual([lowerPriorityBatch, higherPriorityBatch]);
  expect(pinnedManager.stats.rejectedChunkCount, 'counts rejected pinned reservations').toBe(1);
  expect(protectedManager.stats.rejectedChunkCount, 'counts rejected protected reservations').toBe(
    1
  );
  expect(pinnedManager.stats.pendingChunkCount, 'never registers rejected pinned loads').toBe(0);
  expect(protectedManager.stats.pendingChunkCount, 'never registers rejected protected loads').toBe(
    0
  );

  pinnedManager.destroy();
  protectedManager.destroy();
  void 0;
});

it('SplatResidencyManager prevents concurrent pending reservations from exceeding budgets', async () => {
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

  expect(firstRequest, 'coalesces reservations for the same source tile').toBe(
    duplicateFirstRequest
  );
  expect(await rejectedRequest, 'protects every previously reserved pending allocation').toBe(
    undefined
  );
  expect(rejectedLoaderInvocationCount, 'never invokes an overcommitted concurrent loader').toBe(0);
  expect(manager.stats.pendingChunkCount, 'retains both independently reserved pending loads').toBe(
    2
  );
  expect(
    manager.add(unreservedBatch, {id: 'unreserved', priority: 100}),
    'prevents synchronous admission from consuming reserved source capacity'
  ).toBe(undefined);
  expect(
    Boolean(unreservedBatch.destroyed),
    'preserves ownership of synchronously rejected source data'
  ).toBe(false);

  finishSecondLoad(secondBatch);
  const secondChunk = await secondRequest;
  expect(secondChunk?.data, 'admits a later reservation finishing first').toBe(secondBatch);
  expect(manager.stats.pendingChunkCount, 'retains the first pending reservation').toBe(1);

  finishFirstLoad(firstBatch);
  const firstChunk = await firstRequest;
  expect(firstChunk?.data, 'admits the remaining independently reserved source').toBe(firstBatch);
  expect(
    manager.residentBatches,
    'retains independent source batches in actual admission order'
  ).toEqual([secondBatch, firstBatch]);
  expect(manager.stats.residentGpuByteLength, 'preserves the byte budget').toBe(
    estimatedGpuBytes * 2
  );
  expect(manager.stats.residentSplatCount, 'preserves the logical row budget').toBe(2);
  expect(manager.stats.pendingChunkCount, 'releases every completed pending reservation').toBe(0);

  manager.destroy();
  unreservedBatch.destroy();
  void 0;
});

it('SplatResidencyManager releases failed asynchronous allocation reservations', async () => {
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

  expect(rejectedLoad, 'preserves the original asynchronous loader failure').toBe(expectedError);
  expect(manager.stats.pendingChunkCount, 'releases the rejected pending source identity').toBe(0);
  const admittedChunk = await manager.load('incoming', () => incomingBatch, reservationOptions);
  expect(admittedChunk?.data, 'reuses GPU and source-row reservation capacity').toBe(incomingBatch);
  expect(manager.stats.residentChunkCount, 'reuses the independent source-chunk reservation').toBe(
    1
  );

  manager.destroy();
  expect(
    Boolean(incomingBatch.destroyed),
    'preserves manager ownership after reservation recovery'
  ).toBe(true);
  void 0;
});

it('SplatResidencyManager synchronizes borrowing renderers before owned batch eviction', () => {
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
  expect(renderer.batches, 'adds the independently resident source batch').toEqual([firstBatch]);
  manager.add(secondBatch, {priority: 1});
  expect(
    Boolean(firstBatch.destroyed),
    'destroys manager-owned data after renderer detachment'
  ).toBe(true);
  expect(renderer.batches, 'retains only the current source residency window').toEqual([
    secondBatch
  ]);
  expect(renderer.stats.splatCount, 'keeps renderer diagnostics within residency limits').toBe(1);

  manager.destroy();
  expect(renderer.batches, 'detaches every source batch before final destruction').toEqual([]);
  expect(Boolean(secondBatch.destroyed), 'releases the final manager-owned source allocation').toBe(
    true
  );
  renderer.destroy();
  void 0;
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
