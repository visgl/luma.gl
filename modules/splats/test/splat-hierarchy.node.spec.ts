// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
import {
  GPUSplatGraphRenderer,
  makeGPUSplatData,
  SplatResidencyManager,
  type GPUSplatData
} from '@luma.gl/splats';
import {NullDevice} from '@luma.gl/test-utils';
import {
  SplatHierarchyManager,
  getSplatHierarchyFoveatedPriority,
  getSplatHierarchyScreenSpaceError,
  isSplatHierarchyNodeVisible,
  type SplatHierarchyLoadContext,
  type SplatHierarchyNode,
  type SplatHierarchyView
} from '../src/splat-hierarchy';

const IDENTITY_MATRIX = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] as const;

test('Splat hierarchy projects geometric error and conservatively culls bounding spheres', t => {
  const centeredNode = makeSplatHierarchyNode('center', [0, 0, 0], 1, 0.1);
  const peripheralNode = makeSplatHierarchyNode('peripheral', [0.8, 0, 0], 1, 0.1);
  const outsideNode = makeSplatHierarchyNode('outside', [1.3, 0, 0], 1, 0.1);
  const intersectingNode = makeSplatHierarchyNode('intersecting', [1.1, 0, 0], 1, 0.2);
  const nearView = makeSplatHierarchyView([0, 0, 2]);
  const farView = makeSplatHierarchyView([0, 0, 20]);
  const nearError = getSplatHierarchyScreenSpaceError(centeredNode, nearView);
  const farError = getSplatHierarchyScreenSpaceError(centeredNode, farView);

  t.ok(nearError > farError, 'increases projected geometric error for nearby source pages');
  t.ok(nearError > 0, 'reports finite physical-pixel approximation error');
  t.ok(isSplatHierarchyNodeVisible(centeredNode, IDENTITY_MATRIX), 'retains visible pages');
  t.notOk(
    isSplatHierarchyNodeVisible(outsideNode, IDENTITY_MATRIX),
    'culls a page whose complete bounding sphere lies outside a clip plane'
  );
  t.ok(
    isSplatHierarchyNodeVisible(intersectingNode, IDENTITY_MATRIX),
    'retains a bounding sphere intersecting the conservative clip volume'
  );

  const foveation = {center: [0.5, 0.5] as const, radius: 0.05, strength: 8};
  const centeredPriority = getSplatHierarchyFoveatedPriority(
    centeredNode,
    nearView,
    foveation,
    100
  );
  const peripheralPriority = getSplatHierarchyFoveatedPriority(
    peripheralNode,
    nearView,
    foveation,
    100
  );
  t.equal(centeredPriority, 100, 'preserves full detail around the gaze position');
  t.ok(peripheralPriority < centeredPriority, 'relaxes refinement away from the gaze position');
  t.equal(
    getSplatHierarchyFoveatedPriority(peripheralNode, nearView, {strength: 0}, 100),
    100,
    'preserves geometric priority when foveation is disabled'
  );
  t.end();
});

test('SplatHierarchyManager retains a parent until every replacing child is resident', async t => {
  const device = new NullDevice({});
  const parentBatch = makeSplatHierarchyBatch(device, 0, 10);
  const firstChildBatch = makeSplatHierarchyBatch(device, 1, 24);
  const secondChildBatch = makeSplatHierarchyBatch(device, 2, 48);
  const residencyManager = new SplatResidencyManager({maxResidentChunks: 3});
  const pendingPages = new Map<string, (batch: GPUSplatData) => void>();
  const frontierEvents: number[][] = [];
  const root: SplatHierarchyNode = {
    ...makeSplatHierarchyNode('root', [0, 0, 0], 1, 0.2),
    data: parentBatch,
    children: [
      {...makeSplatHierarchyNode('first', [-0.25, 0, 0], 0), parentId: 'root'},
      {...makeSplatHierarchyNode('second', [0.25, 0, 0], 0), parentId: 'root'}
    ]
  };
  const manager = new SplatHierarchyManager({
    roots: [root],
    residencyManager,
    maximumScreenSpaceError: 2,
    maxConcurrentLoads: 2,
    loadPage: node =>
      new Promise(resolve => {
        pendingPages.set(node.id, resolve);
      }),
    onFrontierChange: batches => {
      frontierEvents.push(batches.map(batch => batch.sourceBatchIndex));
    }
  });

  const initialFrontier = manager.update(makeSplatHierarchyView());
  t.deepEqual(
    initialFrontier.map(entry => entry.node.id),
    ['root'],
    'immediately renders the root'
  );
  t.ok(initialFrontier[0].isFallback, 'marks a resident parent as a temporary refinement fallback');
  t.ok(residencyManager.getChunk('root')?.pinned, 'protects the visible fallback against eviction');
  t.equal(manager.stats.pendingLoadCount, 2, 'starts bounded independent child page requests');

  manager.update(makeSplatHierarchyView());
  t.equal(
    manager.stats.pendingLoadCount,
    2,
    'coalesces repeated camera updates into one load per page'
  );

  await flushSplatHierarchyMicrotasks();
  pendingPages.get('first')?.(firstChildBatch);
  await flushSplatHierarchyMicrotasks();

  t.ok(residencyManager.has('first'), 'retains the completed first source page independently');
  t.deepEqual(
    manager.frontier.map(entry => entry.node.id),
    ['root'],
    'does not mix a replacing child with an overlapping resident fallback'
  );
  t.ok(
    residencyManager.getChunk('first')?.pinned,
    'protects a completed replacement sibling while the parent still covers its missing peer'
  );
  t.equal(manager.stats.pendingLoadCount, 1, 'keeps the missing sibling request in flight');

  pendingPages.get('second')?.(secondChildBatch);
  await manager.waitForIdle();

  t.deepEqual(
    manager.frontier.map(entry => entry.node.id),
    ['first', 'second'],
    'atomically replaces the parent once both child source pages are resident'
  );
  t.deepEqual(
    manager.frontierBatches.map(batch => batch.sourceInfo),
    [firstChildBatch.sourceInfo, secondChildBatch.sourceInfo],
    'preserves exact source-batch and global-row identities for rendering and picking'
  );
  t.deepEqual(
    frontierEvents,
    [[0], [1, 2]],
    'notifies renderers only when visible coverage changes'
  );
  t.notOk(
    residencyManager.getChunk('root')?.pinned,
    'releases obsolete hierarchy-owned parent pins'
  );
  t.equal(manager.stats.completedLoadCount, 2, 'records each independently completed source page');
  t.equal(manager.getNode('second')?.parentId, 'root', 'preserves original source parent metadata');

  manager.destroy();
  t.notOk(residencyManager.destroyed, 'never destroys a caller-owned shared residency window');
  residencyManager.destroy();
  parentBatch.destroy();
  firstChildBatch.destroy();
  secondChildBatch.destroy();
  t.end();
});

test('SplatHierarchyManager synchronizes replacing and empty frontiers with a GPU graph', async t => {
  const device = new NullDevice({});
  Object.defineProperties(device, {
    type: {value: 'webgpu'},
    info: {value: {...device.info, type: 'webgpu', shadingLanguage: 'wgsl'}}
  });
  const rootBatch = makeSplatHierarchyBatch(device, 26, 1300);
  const firstChildBatch = makeSplatHierarchyBatch(device, 27, 1600);
  const secondChildBatch = makeSplatHierarchyBatch(device, 28, 2400);
  const graphRenderer = new GPUSplatGraphRenderer(device, {
    expectedSplatCount: 2,
    expectedBatchCount: 2,
    viewportSize: [256, 256]
  });
  const graphFrontiers: Array<readonly GPUSplatData[]> = [];
  const manager = new SplatHierarchyManager({
    maximumScreenSpaceError: 1,
    roots: [
      {
        ...makeSplatHierarchyNode('root', [0, 0, 0], 1, 0.3),
        data: rootBatch,
        children: [
          makeSplatHierarchyNode('first', [-0.2, 0, 0], 0),
          makeSplatHierarchyNode('second', [0.2, 0, 0], 0)
        ]
      }
    ],
    loadPage: node => (node.id === 'first' ? firstChildBatch : secondChildBatch),
    onFrontierChange: batches => {
      graphFrontiers.push([...batches]);
      graphRenderer.setProps({data: batches});
    }
  });

  manager.update(makeSplatHierarchyView());
  t.deepEqual(graphRenderer.batches, [rootBatch], 'publishes the intact resident graph fallback');
  t.equal(
    graphRenderer.compiledGraph,
    undefined,
    'does not force graph compilation from traversal'
  );

  await manager.waitForIdle();
  t.deepEqual(
    graphRenderer.batches,
    [firstChildBatch, secondChildBatch],
    'atomically replaces borrowed graph source slots once every child page is resident'
  );
  t.deepEqual(
    graphRenderer.batches.map(batch => batch.sourceInfo),
    [firstChildBatch.sourceInfo, secondChildBatch.sourceInfo],
    'preserves graph picking source-batch and noncontiguous global-row identities'
  );
  t.equal(
    graphRenderer.batches[0].positions.data[0].buffer,
    firstChildBatch.positions.data[0].buffer,
    'shares the original source allocation with the graph instead of repacking it'
  );

  manager.update({
    ...makeSplatHierarchyView(),
    modelViewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 3, 0, 0, 1]
  });
  t.deepEqual(graphRenderer.batches, [], 'detaches every graph source when the frontier is empty');
  t.equal(manager.stats.frontierNodeCount, 0, 'reports the fully culled hierarchy frontier');
  t.notOk(
    firstChildBatch.destroyed,
    'preserves a borrowed page outside the graph-visible frontier'
  );
  t.notOk(secondChildBatch.destroyed, 'preserves every independently owned inactive source page');

  manager.update(makeSplatHierarchyView());
  t.deepEqual(
    graphRenderer.batches,
    [firstChildBatch, secondChildBatch],
    'restores the original resident graph frontier when the camera returns'
  );
  t.deepEqual(
    graphFrontiers.map(batches => batches.map(batch => batch.sourceBatchIndex)),
    [[26], [27, 28], [], [27, 28]],
    'publishes only complete parent, child, empty, and restored graph frontiers'
  );

  graphRenderer.destroy();
  manager.destroy();
  rootBatch.destroy();
  firstChildBatch.destroy();
  secondChildBatch.destroy();
  t.end();
});

test('SplatHierarchyManager supports additive source-page refinement without repacking', t => {
  const device = new NullDevice({});
  const parentBatch = makeSplatHierarchyBatch(device, 3, 100);
  const firstChildBatch = makeSplatHierarchyBatch(device, 4, 101);
  const secondChildBatch = makeSplatHierarchyBatch(device, 5, 102);
  const manager = new SplatHierarchyManager({
    maximumScreenSpaceError: 1,
    roots: [
      {
        ...makeSplatHierarchyNode('root', [0, 0, 0], 1),
        data: parentBatch,
        refinement: 'add',
        children: [
          {...makeSplatHierarchyNode('first', [-0.2, 0, 0], 0), data: firstChildBatch},
          {...makeSplatHierarchyNode('second', [0.2, 0, 0], 0), data: secondChildBatch}
        ]
      }
    ]
  });

  manager.update(makeSplatHierarchyView());
  t.deepEqual(
    manager.frontierBatches,
    [parentBatch, firstChildBatch, secondChildBatch],
    'retains intact parent and independent additive child source batches'
  );
  t.deepEqual(
    manager.frontier.map(entry => entry.levelOfDetail),
    [0, 1, 1],
    'retains independently traversed source hierarchy levels'
  );
  t.notOk(manager.frontier[0].isFallback, 'marks complete additive refinement as resident');
  t.equal(manager.residencyManager.stats.residentChunkCount, 3, 'never merges source allocations');

  manager.destroy();
  t.ok(manager.residencyManager.destroyed, 'destroys only the hierarchy-created residency window');
  t.notOk(parentBatch.destroyed, 'preserves borrowed parent source buffers');
  t.notOk(firstChildBatch.destroyed, 'preserves borrowed child source buffers');
  parentBatch.destroy();
  firstChildBatch.destroy();
  secondChildBatch.destroy();
  t.end();
});

test('SplatHierarchyManager prioritizes foveated source pages and limits decoder workers', async t => {
  const device = new NullDevice({});
  const rootBatch = makeSplatHierarchyBatch(device, 6, 200);
  const focusedBatch = makeSplatHierarchyBatch(device, 7, 201);
  const peripheralBatch = makeSplatHierarchyBatch(device, 8, 202);
  const pendingPages = new Map<string, (batch: GPUSplatData) => void>();
  const loadOrder: string[] = [];
  const loadContexts: SplatHierarchyLoadContext[] = [];
  const manager = new SplatHierarchyManager({
    maxConcurrentLoads: 1,
    maximumScreenSpaceError: 1,
    foveation: {center: [0.5, 0.5], radius: 0.05, strength: 10},
    roots: [
      {
        ...makeSplatHierarchyNode('root', [0, 0, 0], 2, 0.9),
        data: rootBatch,
        children: [
          {
            ...makeSplatHierarchyNode('peripheral', [0.8, 0, 0], 1),
            contentUri: 'tiles/peripheral.spz',
            metadata: {compression: 'spz-v2'}
          },
          {
            ...makeSplatHierarchyNode('focused', [0, 0, 0], 1),
            contentUri: 'tiles/focused.spz'
          }
        ]
      }
    ],
    loadPage: (node, context) => {
      loadOrder.push(node.id);
      loadContexts.push(context);
      return new Promise(resolve => pendingPages.set(node.id, resolve));
    }
  });

  manager.update(makeSplatHierarchyView());
  await flushSplatHierarchyMicrotasks();
  t.deepEqual(loadOrder, ['focused'], 'schedules the gaze-centered page before peripheral content');
  t.equal(manager.stats.pendingLoadCount, 1, 'limits simultaneously running decoder workers');
  t.equal(manager.stats.queuedLoadCount, 1, 'applies explicit source-page request backpressure');
  t.equal(loadContexts[0].levelOfDetail, 1, 'provides hierarchy depth to worker-style loaders');
  t.notOk(loadContexts[0].signal.aborted, 'provides a live worker cancellation signal');
  t.equal(
    manager.getNode('peripheral')?.contentUri,
    'tiles/peripheral.spz',
    'preserves format-independent source content locations'
  );
  t.deepEqual(
    manager.getNode('peripheral')?.metadata,
    {compression: 'spz-v2'},
    'passes compression or feature metadata through without a source-format dependency'
  );

  pendingPages.get('focused')?.(focusedBatch);
  await flushSplatHierarchyMicrotasks();
  t.deepEqual(
    loadOrder,
    ['focused', 'peripheral'],
    'starts the next source page only after a slot opens'
  );
  t.equal(
    manager.stats.pendingLoadCount,
    1,
    'maintains the configured bounded decoder concurrency'
  );
  t.ok(
    loadContexts[0].priority > loadContexts[1].priority,
    'preserves foveated scheduling priorities'
  );

  pendingPages.get('peripheral')?.(peripheralBatch);
  await manager.waitForIdle();
  t.deepEqual(
    manager.frontierBatches,
    [peripheralBatch, focusedBatch],
    'keeps original child traversal order independent of worker completion order'
  );
  t.equal(manager.stats.pendingLoadCount, 0, 'releases every completed decoder worker slot');
  t.equal(manager.stats.queuedLoadCount, 0, 'drains every queued source page request');

  manager.destroy();
  rootBatch.destroy();
  focusedBatch.destroy();
  peripheralBatch.destroy();
  t.end();
});

test('SplatHierarchyManager cancels source workers after conservative view culling', async t => {
  const device = new NullDevice({});
  const rootBatch = makeSplatHierarchyBatch(device, 9, 300);
  let observedSignal: AbortSignal | undefined;
  let loadErrors = 0;
  const manager = new SplatHierarchyManager({
    maximumScreenSpaceError: 1,
    roots: [
      {
        ...makeSplatHierarchyNode('root', [0, 0, 0], 1, 2),
        data: rootBatch,
        children: [makeSplatHierarchyNode('cancelled', [0.8, 0, 0], 0, 0.05)]
      }
    ],
    loadPage: (_node, context) => {
      observedSignal = context.signal;
      return new Promise((_resolve, reject) => {
        context.signal.addEventListener('abort', () => reject(new Error('worker aborted')), {
          once: true
        });
      });
    },
    onLoadError: () => {
      loadErrors++;
    }
  });

  manager.update(makeSplatHierarchyView());
  await flushSplatHierarchyMicrotasks();
  t.equal(manager.stats.pendingLoadCount, 1, 'starts one source decoder worker');

  manager.update({
    ...makeSplatHierarchyView(),
    modelViewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -2.9, 0, 0, 1]
  });
  await manager.waitForIdle();

  t.ok(observedSignal?.aborted, 'aborts a decoder worker whose source page leaves the view');
  t.equal(
    manager.stats.abortedLoadCount,
    1,
    'records view-driven worker cancellation exactly once'
  );
  t.equal(manager.stats.culledNodeCount, 1, 'excludes the invisible child source branch');
  t.equal(loadErrors, 0, 'does not report expected cancellation as a source loader failure');
  t.deepEqual(
    manager.frontierBatches,
    [rootBatch],
    'preserves intersecting resident parent coverage'
  );

  manager.destroy();
  rootBatch.destroy();
  t.end();
});

test('SplatHierarchyManager never starts worker decoding after immediate cancellation', async t => {
  const device = new NullDevice({});
  const rootBatch = makeSplatHierarchyBatch(device, 25, 1200);
  let startedWorkers = 0;
  let reportedErrors = 0;
  const manager = new SplatHierarchyManager({
    maximumScreenSpaceError: 1,
    roots: [
      {
        ...makeSplatHierarchyNode('root', [0, 0, 0], 1, 2),
        data: rootBatch,
        children: [makeSplatHierarchyNode('cancelled', [0.8, 0, 0], 0, 0.05)]
      }
    ],
    loadPage: () => {
      startedWorkers++;
      throw new Error('cancelled worker started');
    },
    onLoadError: () => {
      reportedErrors++;
    }
  });

  manager.update(makeSplatHierarchyView());
  manager.update({
    ...makeSplatHierarchyView(),
    modelViewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -2.9, 0, 0, 1]
  });
  await manager.waitForIdle();

  t.equal(startedWorkers, 0, 'checks cancellation before dispatching a queued decoder microtask');
  t.equal(reportedErrors, 0, 'does not report expected pre-dispatch cancellation as a failure');
  t.equal(manager.stats.abortedLoadCount, 1, 'records immediate cancellation once');
  t.equal(manager.stats.pendingLoadCount, 0, 'releases the cancelled decoder slot');
  t.deepEqual(
    manager.frontierBatches,
    [rootBatch],
    'preserves the visible resident source fallback'
  );

  manager.destroy();
  rootBatch.destroy();
  t.end();
});

test('SplatHierarchyManager reserves estimated source capacity before starting decoder work', async t => {
  const device = new NullDevice({});
  const rootBatch = makeSplatHierarchyBatch(device, 10, 400);
  const childBatch = makeSplatHierarchyBatch(device, 11, 401);
  const residencyManager = new SplatResidencyManager({maxResidentChunks: 1});
  let requestedLoads = 0;
  const manager = new SplatHierarchyManager({
    residencyManager,
    maximumScreenSpaceError: 1,
    roots: [
      {
        ...makeSplatHierarchyNode('root', [0, 0, 0], 1),
        data: rootBatch,
        children: [
          {
            ...makeSplatHierarchyNode('child', [0, 0, 0], 0),
            estimatedGpuBytes: childBatch.byteLength,
            estimatedSplatCount: childBatch.length
          }
        ]
      }
    ],
    loadPage: () => {
      requestedLoads++;
      return childBatch;
    }
  });

  manager.update(makeSplatHierarchyView());
  await manager.waitForIdle();

  t.equal(requestedLoads, 0, 'rejects over-budget worker requests before invoking the decoder');
  t.equal(manager.stats.rejectedLoadCount, 1, 'records transactional source-page rejection');
  t.deepEqual(
    manager.frontierBatches,
    [rootBatch],
    'retains the protected fallback under pressure'
  );
  t.ok(
    residencyManager.getChunk('root')?.pinned,
    'never evicts the visible parent to start a page'
  );

  residencyManager.setBudget({maxResidentChunks: 2});
  manager.update(makeSplatHierarchyView());
  await manager.waitForIdle();

  t.equal(requestedLoads, 1, 'retries rejected source pages after a later camera or budget update');
  t.deepEqual(
    manager.frontierBatches,
    [childBatch],
    'replaces fallback after bounded page admission'
  );
  t.equal(manager.stats.completedLoadCount, 1, 'records the successfully prepared source page');

  manager.destroy();
  residencyManager.destroy();
  rootBatch.destroy();
  childBatch.destroy();
  t.end();
});

test('SplatHierarchyManager reserves unknown page slots and avoids reloading prepared sources', async t => {
  const device = new NullDevice({});
  const rootBatch = makeSplatHierarchyBatch(device, 19, 1000);
  const preparedChildBatch = makeSplatHierarchyBatch(device, 20, 1001);
  const unloadedChildBatch = makeSplatHierarchyBatch(device, 21, 1002);
  const residencyManager = new SplatResidencyManager({maxResidentChunks: 1});
  let decoderRequests = 0;
  const manager = new SplatHierarchyManager({
    residencyManager,
    maximumScreenSpaceError: 1,
    roots: [
      {
        ...makeSplatHierarchyNode('root', [0, 0, 0], 1),
        data: rootBatch,
        children: [
          {...makeSplatHierarchyNode('prepared', [-0.2, 0, 0], 0), data: preparedChildBatch},
          makeSplatHierarchyNode('unloaded', [0.2, 0, 0], 0)
        ]
      }
    ],
    loadPage: () => {
      decoderRequests++;
      return unloadedChildBatch;
    }
  });

  manager.update(makeSplatHierarchyView());
  await manager.waitForIdle();

  t.equal(decoderRequests, 0, 'reserves an intact page slot even when source sizes are unknown');
  t.equal(manager.stats.rejectedLoadCount, 1, 'rejects only the genuinely unloaded source page');
  t.notOk(
    residencyManager.has('prepared'),
    'does not upload a prepared source page beyond the active residency budget'
  );
  t.deepEqual(manager.frontierBatches, [rootBatch], 'retains protected resident fallback coverage');

  residencyManager.setBudget({maxResidentChunks: 3});
  manager.update(makeSplatHierarchyView());
  await manager.waitForIdle();

  t.equal(decoderRequests, 1, 'never invokes the source loader for an already prepared page');
  t.deepEqual(
    manager.frontierBatches,
    [preparedChildBatch, unloadedChildBatch],
    'preserves caller-prepared and asynchronously loaded source batches independently'
  );

  manager.destroy();
  residencyManager.destroy();
  rootBatch.destroy();
  preparedChildBatch.destroy();
  unloadedChildBatch.destroy();
  t.end();
});

test('SplatHierarchyManager never thrashes replacement siblings that cannot all fit', async t => {
  const device = new NullDevice({});
  const rootBatch = makeSplatHierarchyBatch(device, 22, 1100);
  const firstChildBatch = makeSplatHierarchyBatch(device, 23, 1101);
  const secondChildBatch = makeSplatHierarchyBatch(device, 24, 1102);
  const residencyManager = new SplatResidencyManager({maxResidentChunks: 2});
  const decoderRequests: string[] = [];
  const manager = new SplatHierarchyManager({
    residencyManager,
    maximumScreenSpaceError: 1,
    maxConcurrentLoads: 1,
    roots: [
      {
        ...makeSplatHierarchyNode('root', [0, 0, 0], 1),
        data: rootBatch,
        children: [
          makeSplatHierarchyNode('first', [-0.2, 0, 0], 0),
          makeSplatHierarchyNode('second', [0.2, 0, 0], 0)
        ]
      }
    ],
    loadPage: node => {
      decoderRequests.push(node.id);
      return node.id === 'first' ? firstChildBatch : secondChildBatch;
    }
  });

  manager.update(makeSplatHierarchyView());
  await manager.waitForIdle();

  t.deepEqual(
    decoderRequests,
    ['first'],
    'never decodes a sibling beyond atomic replacement capacity'
  );
  t.equal(manager.stats.completedLoadCount, 1, 'prepares the first replacement sibling once');
  t.equal(manager.stats.rejectedLoadCount, 1, 'rejects the blocked second sibling once');
  t.equal(manager.stats.pendingLoadCount, 0, 'settles bounded workers without a retry loop');
  t.equal(
    manager.stats.queuedLoadCount,
    0,
    'does not leave an unfulfillable source request queued'
  );
  t.deepEqual(manager.frontierBatches, [rootBatch], 'retains complete resident fallback coverage');
  t.ok(residencyManager.getChunk('root')?.pinned, 'protects the rendered source parent');
  t.ok(
    residencyManager.getChunk('first')?.pinned,
    'protects the already decoded replacement sibling'
  );
  t.equal(
    residencyManager.stats.evictedChunkCount,
    0,
    'never evicts and reloads replacing siblings'
  );

  manager.update(makeSplatHierarchyView());
  await manager.waitForIdle();
  t.deepEqual(
    decoderRequests,
    ['first'],
    'remains stable across repeated views while replacement capacity is unavailable'
  );

  residencyManager.setBudget({maxResidentChunks: 3});
  manager.update(makeSplatHierarchyView());
  await manager.waitForIdle();

  t.deepEqual(
    decoderRequests,
    ['first', 'second'],
    'loads only the missing sibling after capacity grows'
  );
  t.deepEqual(
    manager.frontierBatches,
    [firstChildBatch, secondChildBatch],
    'atomically activates intact children after all replacing pages are resident'
  );
  t.notOk(residencyManager.getChunk('root')?.pinned, 'releases the replaced fallback source page');

  manager.destroy();
  residencyManager.destroy();
  rootBatch.destroy();
  firstChildBatch.destroy();
  secondChildBatch.destroy();
  t.end();
});

test('SplatHierarchyManager retries failed source workers only on a new explicit update', async t => {
  const device = new NullDevice({});
  const rootBatch = makeSplatHierarchyBatch(device, 12, 500);
  const childBatch = makeSplatHierarchyBatch(device, 13, 501);
  let attemptedLoads = 0;
  const failures: string[] = [];
  const manager = new SplatHierarchyManager({
    maximumScreenSpaceError: 1,
    roots: [
      {
        ...makeSplatHierarchyNode('root', [0, 0, 0], 1),
        data: rootBatch,
        children: [makeSplatHierarchyNode('child', [0, 0, 0], 0)]
      }
    ],
    loadPage: async () => {
      attemptedLoads++;
      if (attemptedLoads === 1) {
        throw new Error('source decoder unavailable');
      }
      return childBatch;
    },
    onLoadError: (error, node) => {
      failures.push(`${node.id}:${error instanceof Error ? error.message : String(error)}`);
    }
  });

  manager.update(makeSplatHierarchyView());
  await manager.waitForIdle();
  t.equal(attemptedLoads, 1, 'does not automatically loop on a failed source worker request');
  t.deepEqual(
    failures,
    ['child:source decoder unavailable'],
    'reports source errors alongside their original hierarchy metadata'
  );
  t.deepEqual(
    manager.frontierBatches,
    [rootBatch],
    'retains resident coverage after decoder failure'
  );

  manager.update(makeSplatHierarchyView());
  await manager.waitForIdle();
  t.equal(attemptedLoads, 2, 'allows a later explicit update to retry the source decoder');
  t.deepEqual(
    manager.frontierBatches,
    [childBatch],
    'publishes the independently recovered source'
  );

  manager.destroy();
  rootBatch.destroy();
  childBatch.destroy();
  t.end();
});

test('SplatHierarchyManager retains caller-owned pins and discards stale worker results', async t => {
  const device = new NullDevice({});
  const rootBatch = makeSplatHierarchyBatch(device, 14, 600);
  const staleBatch = makeSplatHierarchyBatch(device, 15, 601);
  const residencyManager = new SplatResidencyManager();
  residencyManager.add(rootBatch, {id: 'root', pinned: true, ownsData: false});
  let finishStalePage: ((batch: GPUSplatData) => void) | undefined;
  const manager = new SplatHierarchyManager({
    residencyManager,
    maximumScreenSpaceError: 1,
    roots: [
      {
        ...makeSplatHierarchyNode('root', [0, 0, 0], 1),
        data: rootBatch,
        children: [
          {...makeSplatHierarchyNode('stale', [0, 0, 0], 0), ownsData: true, parentId: 'root'}
        ]
      }
    ],
    loadPage: () =>
      new Promise(resolve => {
        finishStalePage = resolve;
      })
  });

  manager.update(makeSplatHierarchyView());
  await flushSplatHierarchyMicrotasks();
  manager.destroy();

  t.ok(manager.destroyed, 'marks hierarchy traversal as destroyed');
  t.ok(
    residencyManager.getChunk('root')?.pinned,
    'never releases an existing caller-owned source pin'
  );
  t.equal(manager.stats.abortedLoadCount, 1, 'cancels an outstanding worker on destruction');

  finishStalePage?.(staleBatch);
  await manager.waitForIdle();

  t.notOk(residencyManager.has('stale'), 'discards a page completed after hierarchy destruction');
  t.ok(
    staleBatch.destroyed,
    'destroys only stale source buffers with explicitly transferred ownership'
  );
  t.notOk(rootBatch.destroyed, 'preserves borrowed externally pinned source buffers');
  t.notOk(residencyManager.destroyed, 'preserves the caller-owned shared residency manager');

  residencyManager.destroy();
  rootBatch.destroy();
  t.end();
});

test('SplatHierarchyManager prunes large source hierarchies before loading invisible branches', t => {
  const device = new NullDevice({});
  const visibleBatch = makeSplatHierarchyBatch(device, 16, 700);
  const hierarchyDepth = 11;

  function makeLargeHierarchy(
    depth: number,
    branchIdentity: string,
    visible: boolean
  ): SplatHierarchyNode {
    const node: SplatHierarchyNode = {
      ...makeSplatHierarchyNode(
        branchIdentity,
        visible ? [0, 0, 0] : [4, 0, 0],
        depth > 0 ? 1 : 0,
        depth === hierarchyDepth ? 4 : 0.05
      ),
      ...(depth === 0 && visible ? {data: visibleBatch} : {})
    };
    if (depth === 0) {
      return node;
    }
    node.children = [
      makeLargeHierarchy(depth - 1, `${branchIdentity}/visible`, visible),
      makeLargeHierarchy(depth - 1, `${branchIdentity}/hidden`, false)
    ];
    return node;
  }

  const root = makeLargeHierarchy(hierarchyDepth, 'root', true);
  const manager = new SplatHierarchyManager({
    roots: [root],
    maximumScreenSpaceError: 1
  });

  manager.update(makeSplatHierarchyView());

  t.equal(
    manager.stats.nodeCount,
    2 ** (hierarchyDepth + 1) - 1,
    'indexes every caller-owned source node without preparing GPU data'
  );
  t.equal(
    manager.stats.visibleNodeCount,
    hierarchyDepth + 1,
    'visits only the root-to-leaf source branch intersecting the camera view'
  );
  t.equal(
    manager.stats.culledNodeCount,
    hierarchyDepth,
    'rejects invisible sibling subtrees before touching their descendants'
  );
  t.deepEqual(
    manager.frontierBatches,
    [visibleBatch],
    'returns the single intact visible source page'
  );
  t.equal(
    manager.stats.pendingLoadCount,
    0,
    'does not schedule decoder work for invisible branches'
  );
  t.equal(
    manager.residencyManager.stats.residentChunkCount,
    1,
    'uploads only the visible source page'
  );

  manager.destroy();
  visibleBatch.destroy();
  t.end();
});

test('SplatHierarchyManager replaces same-identity roots without losing externally owned pins', t => {
  const device = new NullDevice({});
  const originalBatch = makeSplatHierarchyBatch(device, 17, 800);
  const replacementBatch = makeSplatHierarchyBatch(device, 18, 900);
  const originalNode = {
    ...makeSplatHierarchyNode('shared-root', [0, 0, 0], 0),
    data: originalBatch,
    ownsData: false
  };
  const replacementNode = {
    ...makeSplatHierarchyNode('shared-root', [0.4, 0, 0], 0, 0.2),
    data: replacementBatch,
    ownsData: true
  };
  const evictionEvents: Array<{data: GPUSplatData; reason: string}> = [];
  const frontierEvents: number[][] = [];
  const residencyManager = new SplatResidencyManager({
    maxResidentChunks: 1,
    onEvict: (chunk, reason) => evictionEvents.push({data: chunk.data, reason})
  });
  residencyManager.add(originalBatch, {
    id: originalNode.id,
    pinned: true,
    ownsData: false,
    bounds: originalNode.bounds
  });
  const manager = new SplatHierarchyManager({
    roots: [originalNode],
    residencyManager,
    onFrontierChange: batches => {
      frontierEvents.push(batches.map(batch => batch.sourceBatchIndex));
    }
  });

  manager.update(makeSplatHierarchyView());
  manager.setRoots([replacementNode]);

  t.deepEqual(manager.frontierBatches, [replacementBatch], 'renders the replacement source batch');
  t.equal(manager.frontier[0].node, replacementNode, 'publishes replacement source metadata');
  t.equal(
    manager.frontier[0].chunk.data.sourceInfo,
    replacementBatch.sourceInfo,
    'preserves the replacement source-batch and global-row identity'
  );
  t.deepEqual(
    residencyManager.getChunk(originalNode.id)?.bounds,
    replacementNode.bounds,
    'updates the retained spatial metadata for the replacement source node'
  );
  t.equal(
    residencyManager.getChunk(originalNode.id)?.ownsData,
    true,
    'honors explicitly transferred ownership for the replacement source batch'
  );
  t.ok(residencyManager.getChunk(originalNode.id)?.pinned, 'preserves the caller-owned source pin');
  t.equal(residencyManager.stats.residentChunkCount, 1, 'reuses the existing bounded chunk slot');
  t.deepEqual(
    evictionEvents,
    [{data: originalBatch, reason: 'replace'}],
    'reports exact replacement ownership before updating the rendered frontier'
  );
  t.deepEqual(frontierEvents, [[17], [18]], 'notifies renderers when stable IDs gain new data');
  t.notOk(originalBatch.destroyed, 'never destroys the original caller-owned source batch');

  manager.destroy();
  t.ok(
    residencyManager.getChunk(originalNode.id)?.pinned,
    'never releases externally owned pins after a same-identity replacement'
  );
  residencyManager.destroy();
  t.ok(replacementBatch.destroyed, 'destroys the explicitly manager-owned replacement batch');
  originalBatch.destroy();
  t.end();
});

test('SplatHierarchyManager transfers hierarchy-owned pins and honors prior source ownership', t => {
  const device = new NullDevice({});
  const originalBatch = makeSplatHierarchyBatch(device, 19, 950);
  const replacementBatch = makeSplatHierarchyBatch(device, 20, 1_000);
  const residencyManager = new SplatResidencyManager({maxResidentChunks: 1});
  const manager = new SplatHierarchyManager({
    roots: [
      {
        ...makeSplatHierarchyNode('owned-root', [0, 0, 0], 0),
        data: originalBatch,
        ownsData: true
      }
    ],
    residencyManager
  });

  manager.update(makeSplatHierarchyView());
  t.ok(residencyManager.getChunk('owned-root')?.pinned, 'protects the original visible root');
  manager.setRoots([
    {
      ...makeSplatHierarchyNode('owned-root', [0.2, 0, 0], 0),
      data: replacementBatch,
      ownsData: false
    }
  ]);

  t.ok(originalBatch.destroyed, 'destroys the replaced source batch when its ownership was held');
  t.deepEqual(manager.frontierBatches, [replacementBatch], 'publishes the intact borrowed source');
  t.ok(residencyManager.getChunk('owned-root')?.pinned, 'transfers hierarchy-owned pin protection');
  t.equal(
    residencyManager.stats.pinnedChunkCount,
    1,
    'keeps pin accounting balanced across transactional replacement'
  );

  manager.destroy();
  t.notOk(
    residencyManager.getChunk('owned-root')?.pinned,
    'releases transferred pins owned only by this hierarchy'
  );
  residencyManager.destroy();
  t.notOk(replacementBatch.destroyed, 'preserves the explicitly borrowed replacement source');
  replacementBatch.destroy();
  t.end();
});

test('SplatHierarchyManager replaces source roots and rejects duplicate source identities', t => {
  const device = new NullDevice({});
  const firstBatch = makeSplatHierarchyBatch(device, 17, 800);
  const secondBatch = makeSplatHierarchyBatch(device, 18, 900);
  const firstRoot = {...makeSplatHierarchyNode('first', [0, 0, 0], 0), data: firstBatch};
  const secondRoot = {...makeSplatHierarchyNode('second', [0, 0, 0], 0), data: secondBatch};
  const manager = new SplatHierarchyManager({roots: [firstRoot]});

  manager.update(makeSplatHierarchyView());
  t.deepEqual(manager.frontierBatches, [firstBatch], 'publishes the initial intact source root');
  const initialChunk = manager.residencyManager.getChunk('first');
  manager.setRoots([firstRoot, secondRoot]);
  t.deepEqual(
    manager.frontierBatches,
    [firstBatch, secondBatch],
    'appends streamed independent roots without dropping existing visible source pages'
  );
  t.equal(
    manager.residencyManager.getChunk('first'),
    initialChunk,
    'retains existing source allocations and residency metadata while appending streamed roots'
  );
  t.deepEqual(
    manager.frontierBatches.map(batch => batch.sourceInfo),
    [firstBatch.sourceInfo, secondBatch.sourceInfo],
    'preserves original streamed source-batch and global-row identities'
  );
  manager.setRoots([secondRoot]);
  t.deepEqual(
    manager.frontierBatches,
    [secondBatch],
    'updates the active frontier for replacement roots'
  );
  t.equal(
    manager.getNode('first'),
    undefined,
    'removes superseded caller-owned hierarchy metadata'
  );
  t.equal(manager.getNode('second'), secondRoot, 'indexes the replacement source root directly');
  t.throws(
    () => new SplatHierarchyManager({roots: [firstRoot, {...firstRoot}]}),
    /unique/,
    'rejects ambiguous source-page identities before traversing the hierarchy'
  );

  manager.destroy();
  t.throws(
    () => manager.update(makeSplatHierarchyView()),
    /destroyed/,
    'does not traverse a destroyed hierarchy'
  );
  firstBatch.destroy();
  secondBatch.destroy();
  t.end();
});

function makeSplatHierarchyNode(
  id: string,
  center: readonly [number, number, number],
  geometricError: number,
  radius = 0.05
): SplatHierarchyNode {
  return {id, bounds: {center, radius}, geometricError};
}

function makeSplatHierarchyView(
  cameraPosition: readonly [number, number, number] = [0, 0, 4]
): SplatHierarchyView {
  return {
    cameraPosition,
    viewportSize: [256, 256],
    verticalFieldOfView: Math.PI / 2,
    modelViewProjectionMatrix: IDENTITY_MATRIX
  };
}

function makeSplatHierarchyBatch(
  device: NullDevice,
  sourceBatchIndex: number,
  rowIndexBase: number
): GPUSplatData {
  return makeGPUSplatData(device, {
    positions: new Float32Array([0, 0, 0]),
    scales: new Float32Array([0.1, 0.1, 0.1]),
    rotations: new Float32Array([1, 0, 0, 0]),
    colors: new Uint8Array([255, 128, 64, 255]),
    opacities: new Float32Array([1]),
    sourceBatchIndex,
    rowIndexBase
  });
}

async function flushSplatHierarchyMicrotasks(): Promise<void> {
  for (let flushIndex = 0; flushIndex < 12; flushIndex++) {
    await Promise.resolve();
  }
}
