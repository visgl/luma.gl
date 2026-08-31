// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
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

it('Splat hierarchy projects geometric error and conservatively culls bounding spheres', () => {
  const centeredNode = makeSplatHierarchyNode('center', [0, 0, 0], 1, 0.1);
  const peripheralNode = makeSplatHierarchyNode('peripheral', [0.8, 0, 0], 1, 0.1);
  const outsideNode = makeSplatHierarchyNode('outside', [1.3, 0, 0], 1, 0.1);
  const intersectingNode = makeSplatHierarchyNode('intersecting', [1.1, 0, 0], 1, 0.2);
  const nearView = makeSplatHierarchyView([0, 0, 2]);
  const farView = makeSplatHierarchyView([0, 0, 20]);
  const nearError = getSplatHierarchyScreenSpaceError(centeredNode, nearView);
  const farError = getSplatHierarchyScreenSpaceError(centeredNode, farView);

  expect(
    Boolean(nearError > farError),
    'increases projected geometric error for nearby source pages'
  ).toBe(true);
  expect(Boolean(nearError > 0), 'reports finite physical-pixel approximation error').toBe(true);
  expect(
    Boolean(isSplatHierarchyNodeVisible(centeredNode, IDENTITY_MATRIX)),
    'retains visible pages'
  ).toBe(true);
  expect(
    Boolean(isSplatHierarchyNodeVisible(outsideNode, IDENTITY_MATRIX)),
    'culls a page whose complete bounding sphere lies outside a clip plane'
  ).toBe(false);
  expect(
    Boolean(isSplatHierarchyNodeVisible(intersectingNode, IDENTITY_MATRIX)),
    'retains a bounding sphere intersecting the conservative clip volume'
  ).toBe(true);

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
  expect(centeredPriority, 'preserves full detail around the gaze position').toBe(100);
  expect(
    Boolean(peripheralPriority < centeredPriority),
    'relaxes refinement away from the gaze position'
  ).toBe(true);
  expect(
    getSplatHierarchyFoveatedPriority(peripheralNode, nearView, {strength: 0}, 100),
    'preserves geometric priority when foveation is disabled'
  ).toBe(100);
  void 0;
});

it('SplatHierarchyManager retains a parent until every replacing child is resident', async () => {
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
  expect(
    initialFrontier.map(entry => entry.node.id),
    'immediately renders the root'
  ).toEqual(['root']);
  expect(
    Boolean(initialFrontier[0].isFallback),
    'marks a resident parent as a temporary refinement fallback'
  ).toBe(true);
  expect(
    Boolean(residencyManager.getChunk('root')?.pinned),
    'protects the visible fallback against eviction'
  ).toBe(true);
  expect(manager.stats.pendingLoadCount, 'starts bounded independent child page requests').toBe(2);

  manager.update(makeSplatHierarchyView());
  expect(
    manager.stats.pendingLoadCount,
    'coalesces repeated camera updates into one load per page'
  ).toBe(2);

  await flushSplatHierarchyMicrotasks();
  pendingPages.get('first')?.(firstChildBatch);
  await flushSplatHierarchyMicrotasks();

  expect(
    Boolean(residencyManager.has('first')),
    'retains the completed first source page independently'
  ).toBe(true);
  expect(
    manager.frontier.map(entry => entry.node.id),
    'does not mix a replacing child with an overlapping resident fallback'
  ).toEqual(['root']);
  expect(
    Boolean(residencyManager.getChunk('first')?.pinned),
    'protects a completed replacement sibling while the parent still covers its missing peer'
  ).toBe(true);
  expect(manager.stats.pendingLoadCount, 'keeps the missing sibling request in flight').toBe(1);

  pendingPages.get('second')?.(secondChildBatch);
  await manager.waitForIdle();

  expect(
    manager.frontier.map(entry => entry.node.id),
    'atomically replaces the parent once both child source pages are resident'
  ).toEqual(['first', 'second']);
  expect(
    manager.frontierBatches.map(batch => batch.sourceInfo),
    'preserves exact source-batch and global-row identities for rendering and picking'
  ).toEqual([firstChildBatch.sourceInfo, secondChildBatch.sourceInfo]);
  expect(frontierEvents, 'notifies renderers only when visible coverage changes').toEqual([
    [0],
    [1, 2]
  ]);
  expect(
    Boolean(residencyManager.getChunk('root')?.pinned),
    'releases obsolete hierarchy-owned parent pins'
  ).toBe(false);
  expect(manager.stats.completedLoadCount, 'records each independently completed source page').toBe(
    2
  );
  expect(manager.getNode('second')?.parentId, 'preserves original source parent metadata').toBe(
    'root'
  );

  manager.destroy();
  expect(
    Boolean(residencyManager.destroyed),
    'never destroys a caller-owned shared residency window'
  ).toBe(false);
  residencyManager.destroy();
  parentBatch.destroy();
  firstChildBatch.destroy();
  secondChildBatch.destroy();
  void 0;
});

it('SplatHierarchyManager synchronizes replacing and empty frontiers with a GPU graph', async () => {
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
  expect(graphRenderer.batches, 'publishes the intact resident graph fallback').toEqual([
    rootBatch
  ]);
  expect(graphRenderer.compiledGraph, 'does not force graph compilation from traversal').toBe(
    undefined
  );

  await manager.waitForIdle();
  expect(
    graphRenderer.batches,
    'atomically replaces borrowed graph source slots once every child page is resident'
  ).toEqual([firstChildBatch, secondChildBatch]);
  expect(
    graphRenderer.batches.map(batch => batch.sourceInfo),
    'preserves graph picking source-batch and noncontiguous global-row identities'
  ).toEqual([firstChildBatch.sourceInfo, secondChildBatch.sourceInfo]);
  expect(
    graphRenderer.batches[0].positions.data[0].buffer,
    'shares the original source allocation with the graph instead of repacking it'
  ).toBe(firstChildBatch.positions.data[0].buffer);

  manager.update({
    ...makeSplatHierarchyView(),
    modelViewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 3, 0, 0, 1]
  });
  expect(graphRenderer.batches, 'detaches every graph source when the frontier is empty').toEqual(
    []
  );
  expect(manager.stats.frontierNodeCount, 'reports the fully culled hierarchy frontier').toBe(0);
  expect(
    Boolean(firstChildBatch.destroyed),
    'preserves a borrowed page outside the graph-visible frontier'
  ).toBe(false);
  expect(
    Boolean(secondChildBatch.destroyed),
    'preserves every independently owned inactive source page'
  ).toBe(false);

  manager.update(makeSplatHierarchyView());
  expect(
    graphRenderer.batches,
    'restores the original resident graph frontier when the camera returns'
  ).toEqual([firstChildBatch, secondChildBatch]);
  expect(
    graphFrontiers.map(batches => batches.map(batch => batch.sourceBatchIndex)),
    'publishes only complete parent, child, empty, and restored graph frontiers'
  ).toEqual([[26], [27, 28], [], [27, 28]]);

  graphRenderer.destroy();
  manager.destroy();
  rootBatch.destroy();
  firstChildBatch.destroy();
  secondChildBatch.destroy();
  void 0;
});

it('SplatHierarchyManager supports additive source-page refinement without repacking', () => {
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
  expect(
    manager.frontierBatches,
    'retains intact parent and independent additive child source batches'
  ).toEqual([parentBatch, firstChildBatch, secondChildBatch]);
  expect(
    manager.frontier.map(entry => entry.levelOfDetail),
    'retains independently traversed source hierarchy levels'
  ).toEqual([0, 1, 1]);
  expect(
    Boolean(manager.frontier[0].isFallback),
    'marks complete additive refinement as resident'
  ).toBe(false);
  expect(manager.residencyManager.stats.residentChunkCount, 'never merges source allocations').toBe(
    3
  );

  manager.destroy();
  expect(
    Boolean(manager.residencyManager.destroyed),
    'destroys only the hierarchy-created residency window'
  ).toBe(true);
  expect(Boolean(parentBatch.destroyed), 'preserves borrowed parent source buffers').toBe(false);
  expect(Boolean(firstChildBatch.destroyed), 'preserves borrowed child source buffers').toBe(false);
  parentBatch.destroy();
  firstChildBatch.destroy();
  secondChildBatch.destroy();
  void 0;
});

it('SplatHierarchyManager prioritizes foveated source pages and limits decoder workers', async () => {
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
  expect(loadOrder, 'schedules the gaze-centered page before peripheral content').toEqual([
    'focused'
  ]);
  expect(manager.stats.pendingLoadCount, 'limits simultaneously running decoder workers').toBe(1);
  expect(manager.stats.queuedLoadCount, 'applies explicit source-page request backpressure').toBe(
    1
  );
  expect(loadContexts[0].levelOfDetail, 'provides hierarchy depth to worker-style loaders').toBe(1);
  expect(
    Boolean(loadContexts[0].signal.aborted),
    'provides a live worker cancellation signal'
  ).toBe(false);
  expect(
    manager.getNode('peripheral')?.contentUri,
    'preserves format-independent source content locations'
  ).toBe('tiles/peripheral.spz');
  expect(
    manager.getNode('peripheral')?.metadata,
    'passes compression or feature metadata through without a source-format dependency'
  ).toEqual({compression: 'spz-v2'});

  pendingPages.get('focused')?.(focusedBatch);
  await flushSplatHierarchyMicrotasks();
  expect(loadOrder, 'starts the next source page only after a slot opens').toEqual([
    'focused',
    'peripheral'
  ]);
  expect(
    manager.stats.pendingLoadCount,
    'maintains the configured bounded decoder concurrency'
  ).toBe(1);
  expect(
    Boolean(loadContexts[0].priority > loadContexts[1].priority),
    'preserves foveated scheduling priorities'
  ).toBe(true);

  pendingPages.get('peripheral')?.(peripheralBatch);
  await manager.waitForIdle();
  expect(
    manager.frontierBatches,
    'keeps original child traversal order independent of worker completion order'
  ).toEqual([peripheralBatch, focusedBatch]);
  expect(manager.stats.pendingLoadCount, 'releases every completed decoder worker slot').toBe(0);
  expect(manager.stats.queuedLoadCount, 'drains every queued source page request').toBe(0);

  manager.destroy();
  rootBatch.destroy();
  focusedBatch.destroy();
  peripheralBatch.destroy();
  void 0;
});

it('SplatHierarchyManager cancels source workers after conservative view culling', async () => {
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
  expect(manager.stats.pendingLoadCount, 'starts one source decoder worker').toBe(1);

  manager.update({
    ...makeSplatHierarchyView(),
    modelViewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -2.9, 0, 0, 1]
  });
  await manager.waitForIdle();

  expect(
    Boolean(observedSignal?.aborted),
    'aborts a decoder worker whose source page leaves the view'
  ).toBe(true);
  expect(
    manager.stats.abortedLoadCount,
    'records view-driven worker cancellation exactly once'
  ).toBe(1);
  expect(manager.stats.culledNodeCount, 'excludes the invisible child source branch').toBe(1);
  expect(loadErrors, 'does not report expected cancellation as a source loader failure').toBe(0);
  expect(manager.frontierBatches, 'preserves intersecting resident parent coverage').toEqual([
    rootBatch
  ]);

  manager.destroy();
  rootBatch.destroy();
  void 0;
});

it('SplatHierarchyManager never starts worker decoding after immediate cancellation', async () => {
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

  expect(startedWorkers, 'checks cancellation before dispatching a queued decoder microtask').toBe(
    0
  );
  expect(reportedErrors, 'does not report expected pre-dispatch cancellation as a failure').toBe(0);
  expect(manager.stats.abortedLoadCount, 'records immediate cancellation once').toBe(1);
  expect(manager.stats.pendingLoadCount, 'releases the cancelled decoder slot').toBe(0);
  expect(manager.frontierBatches, 'preserves the visible resident source fallback').toEqual([
    rootBatch
  ]);

  manager.destroy();
  rootBatch.destroy();
  void 0;
});

it('SplatHierarchyManager reserves estimated source capacity before starting decoder work', async () => {
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

  expect(requestedLoads, 'rejects over-budget worker requests before invoking the decoder').toBe(0);
  expect(manager.stats.rejectedLoadCount, 'records transactional source-page rejection').toBe(1);
  expect(manager.frontierBatches, 'retains the protected fallback under pressure').toEqual([
    rootBatch
  ]);
  expect(
    Boolean(residencyManager.getChunk('root')?.pinned),
    'never evicts the visible parent to start a page'
  ).toBe(true);

  residencyManager.setBudget({maxResidentChunks: 2});
  manager.update(makeSplatHierarchyView());
  await manager.waitForIdle();

  expect(
    requestedLoads,
    'retries rejected source pages after a later camera or budget update'
  ).toBe(1);
  expect(manager.frontierBatches, 'replaces fallback after bounded page admission').toEqual([
    childBatch
  ]);
  expect(manager.stats.completedLoadCount, 'records the successfully prepared source page').toBe(1);

  manager.destroy();
  residencyManager.destroy();
  rootBatch.destroy();
  childBatch.destroy();
  void 0;
});

it('SplatHierarchyManager reserves unknown page slots and avoids reloading prepared sources', async () => {
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

  expect(decoderRequests, 'reserves an intact page slot even when source sizes are unknown').toBe(
    0
  );
  expect(manager.stats.rejectedLoadCount, 'rejects only the genuinely unloaded source page').toBe(
    1
  );
  expect(
    Boolean(residencyManager.has('prepared')),
    'does not upload a prepared source page beyond the active residency budget'
  ).toBe(false);
  expect(manager.frontierBatches, 'retains protected resident fallback coverage').toEqual([
    rootBatch
  ]);

  residencyManager.setBudget({maxResidentChunks: 3});
  manager.update(makeSplatHierarchyView());
  await manager.waitForIdle();

  expect(decoderRequests, 'never invokes the source loader for an already prepared page').toBe(1);
  expect(
    manager.frontierBatches,
    'preserves caller-prepared and asynchronously loaded source batches independently'
  ).toEqual([preparedChildBatch, unloadedChildBatch]);

  manager.destroy();
  residencyManager.destroy();
  rootBatch.destroy();
  preparedChildBatch.destroy();
  unloadedChildBatch.destroy();
  void 0;
});

it('SplatHierarchyManager never thrashes replacement siblings that cannot all fit', async () => {
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

  expect(decoderRequests, 'never decodes a sibling beyond atomic replacement capacity').toEqual([
    'first'
  ]);
  expect(manager.stats.completedLoadCount, 'prepares the first replacement sibling once').toBe(1);
  expect(manager.stats.rejectedLoadCount, 'rejects the blocked second sibling once').toBe(1);
  expect(manager.stats.pendingLoadCount, 'settles bounded workers without a retry loop').toBe(0);
  expect(
    manager.stats.queuedLoadCount,
    'does not leave an unfulfillable source request queued'
  ).toBe(0);
  expect(manager.frontierBatches, 'retains complete resident fallback coverage').toEqual([
    rootBatch
  ]);
  expect(
    Boolean(residencyManager.getChunk('root')?.pinned),
    'protects the rendered source parent'
  ).toBe(true);
  expect(
    Boolean(residencyManager.getChunk('first')?.pinned),
    'protects the already decoded replacement sibling'
  ).toBe(true);
  expect(
    residencyManager.stats.evictedChunkCount,
    'never evicts and reloads replacing siblings'
  ).toBe(0);

  manager.update(makeSplatHierarchyView());
  await manager.waitForIdle();
  expect(
    decoderRequests,
    'remains stable across repeated views while replacement capacity is unavailable'
  ).toEqual(['first']);

  residencyManager.setBudget({maxResidentChunks: 3});
  manager.update(makeSplatHierarchyView());
  await manager.waitForIdle();

  expect(decoderRequests, 'loads only the missing sibling after capacity grows').toEqual([
    'first',
    'second'
  ]);
  expect(
    manager.frontierBatches,
    'atomically activates intact children after all replacing pages are resident'
  ).toEqual([firstChildBatch, secondChildBatch]);
  expect(
    Boolean(residencyManager.getChunk('root')?.pinned),
    'releases the replaced fallback source page'
  ).toBe(false);

  manager.destroy();
  residencyManager.destroy();
  rootBatch.destroy();
  firstChildBatch.destroy();
  secondChildBatch.destroy();
  void 0;
});

it('SplatHierarchyManager retries failed source workers only on a new explicit update', async () => {
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
  expect(attemptedLoads, 'does not automatically loop on a failed source worker request').toBe(1);
  expect(failures, 'reports source errors alongside their original hierarchy metadata').toEqual([
    'child:source decoder unavailable'
  ]);
  expect(manager.frontierBatches, 'retains resident coverage after decoder failure').toEqual([
    rootBatch
  ]);

  manager.update(makeSplatHierarchyView());
  await manager.waitForIdle();
  expect(attemptedLoads, 'allows a later explicit update to retry the source decoder').toBe(2);
  expect(manager.frontierBatches, 'publishes the independently recovered source').toEqual([
    childBatch
  ]);

  manager.destroy();
  rootBatch.destroy();
  childBatch.destroy();
  void 0;
});

it('SplatHierarchyManager retains caller-owned pins and discards stale worker results', async () => {
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

  expect(Boolean(manager.destroyed), 'marks hierarchy traversal as destroyed').toBe(true);
  expect(
    Boolean(residencyManager.getChunk('root')?.pinned),
    'never releases an existing caller-owned source pin'
  ).toBe(true);
  expect(manager.stats.abortedLoadCount, 'cancels an outstanding worker on destruction').toBe(1);

  finishStalePage?.(staleBatch);
  await manager.waitForIdle();

  expect(
    Boolean(residencyManager.has('stale')),
    'discards a page completed after hierarchy destruction'
  ).toBe(false);
  expect(
    Boolean(staleBatch.destroyed),
    'destroys only stale source buffers with explicitly transferred ownership'
  ).toBe(true);
  expect(Boolean(rootBatch.destroyed), 'preserves borrowed externally pinned source buffers').toBe(
    false
  );
  expect(
    Boolean(residencyManager.destroyed),
    'preserves the caller-owned shared residency manager'
  ).toBe(false);

  residencyManager.destroy();
  rootBatch.destroy();
  void 0;
});

it('SplatHierarchyManager prunes large source hierarchies before loading invisible branches', () => {
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

  expect(
    manager.stats.nodeCount,
    'indexes every caller-owned source node without preparing GPU data'
  ).toBe(2 ** (hierarchyDepth + 1) - 1);
  expect(
    manager.stats.visibleNodeCount,
    'visits only the root-to-leaf source branch intersecting the camera view'
  ).toBe(hierarchyDepth + 1);
  expect(
    manager.stats.culledNodeCount,
    'rejects invisible sibling subtrees before touching their descendants'
  ).toBe(hierarchyDepth);
  expect(manager.frontierBatches, 'returns the single intact visible source page').toEqual([
    visibleBatch
  ]);
  expect(
    manager.stats.pendingLoadCount,
    'does not schedule decoder work for invisible branches'
  ).toBe(0);
  expect(
    manager.residencyManager.stats.residentChunkCount,
    'uploads only the visible source page'
  ).toBe(1);

  manager.destroy();
  visibleBatch.destroy();
  void 0;
});

it('SplatHierarchyManager replaces same-identity roots without losing externally owned pins', () => {
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

  expect(manager.frontierBatches, 'renders the replacement source batch').toEqual([
    replacementBatch
  ]);
  expect(manager.frontier[0].node, 'publishes replacement source metadata').toBe(replacementNode);
  expect(
    manager.frontier[0].chunk.data.sourceInfo,
    'preserves the replacement source-batch and global-row identity'
  ).toBe(replacementBatch.sourceInfo);
  expect(
    residencyManager.getChunk(originalNode.id)?.bounds,
    'updates the retained spatial metadata for the replacement source node'
  ).toEqual(replacementNode.bounds);
  expect(
    residencyManager.getChunk(originalNode.id)?.ownsData,
    'honors explicitly transferred ownership for the replacement source batch'
  ).toBe(true);
  expect(
    Boolean(residencyManager.getChunk(originalNode.id)?.pinned),
    'preserves the caller-owned source pin'
  ).toBe(true);
  expect(residencyManager.stats.residentChunkCount, 'reuses the existing bounded chunk slot').toBe(
    1
  );
  expect(
    evictionEvents,
    'reports exact replacement ownership before updating the rendered frontier'
  ).toEqual([{data: originalBatch, reason: 'replace'}]);
  expect(frontierEvents, 'notifies renderers when stable IDs gain new data').toEqual([[17], [18]]);
  expect(
    Boolean(originalBatch.destroyed),
    'never destroys the original caller-owned source batch'
  ).toBe(false);

  manager.destroy();
  expect(
    Boolean(residencyManager.getChunk(originalNode.id)?.pinned),
    'never releases externally owned pins after a same-identity replacement'
  ).toBe(true);
  residencyManager.destroy();
  expect(
    Boolean(replacementBatch.destroyed),
    'destroys the explicitly manager-owned replacement batch'
  ).toBe(true);
  originalBatch.destroy();
  void 0;
});

it('SplatHierarchyManager transfers hierarchy-owned pins and honors prior source ownership', () => {
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
  expect(
    Boolean(residencyManager.getChunk('owned-root')?.pinned),
    'protects the original visible root'
  ).toBe(true);
  manager.setRoots([
    {
      ...makeSplatHierarchyNode('owned-root', [0.2, 0, 0], 0),
      data: replacementBatch,
      ownsData: false
    }
  ]);

  expect(
    Boolean(originalBatch.destroyed),
    'destroys the replaced source batch when its ownership was held'
  ).toBe(true);
  expect(manager.frontierBatches, 'publishes the intact borrowed source').toEqual([
    replacementBatch
  ]);
  expect(
    Boolean(residencyManager.getChunk('owned-root')?.pinned),
    'transfers hierarchy-owned pin protection'
  ).toBe(true);
  expect(
    residencyManager.stats.pinnedChunkCount,
    'keeps pin accounting balanced across transactional replacement'
  ).toBe(1);

  manager.destroy();
  expect(
    Boolean(residencyManager.getChunk('owned-root')?.pinned),
    'releases transferred pins owned only by this hierarchy'
  ).toBe(false);
  residencyManager.destroy();
  expect(
    Boolean(replacementBatch.destroyed),
    'preserves the explicitly borrowed replacement source'
  ).toBe(false);
  replacementBatch.destroy();
  void 0;
});

it('SplatHierarchyManager replaces source roots and rejects duplicate source identities', () => {
  const device = new NullDevice({});
  const firstBatch = makeSplatHierarchyBatch(device, 17, 800);
  const secondBatch = makeSplatHierarchyBatch(device, 18, 900);
  const firstRoot = {...makeSplatHierarchyNode('first', [0, 0, 0], 0), data: firstBatch};
  const secondRoot = {...makeSplatHierarchyNode('second', [0, 0, 0], 0), data: secondBatch};
  const manager = new SplatHierarchyManager({roots: [firstRoot]});

  manager.update(makeSplatHierarchyView());
  expect(manager.frontierBatches, 'publishes the initial intact source root').toEqual([firstBatch]);
  const initialChunk = manager.residencyManager.getChunk('first');
  manager.setRoots([firstRoot, secondRoot]);
  expect(
    manager.frontierBatches,
    'appends streamed independent roots without dropping existing visible source pages'
  ).toEqual([firstBatch, secondBatch]);
  expect(
    manager.residencyManager.getChunk('first'),
    'retains existing source allocations and residency metadata while appending streamed roots'
  ).toBe(initialChunk);
  expect(
    manager.frontierBatches.map(batch => batch.sourceInfo),
    'preserves original streamed source-batch and global-row identities'
  ).toEqual([firstBatch.sourceInfo, secondBatch.sourceInfo]);
  manager.setRoots([secondRoot]);
  expect(manager.frontierBatches, 'updates the active frontier for replacement roots').toEqual([
    secondBatch
  ]);
  expect(manager.getNode('first'), 'removes superseded caller-owned hierarchy metadata').toBe(
    undefined
  );
  expect(manager.getNode('second'), 'indexes the replacement source root directly').toBe(
    secondRoot
  );
  expect(
    () => new SplatHierarchyManager({roots: [firstRoot, {...firstRoot}]}),
    'rejects ambiguous source-page identities before traversing the hierarchy'
  ).toThrow(/unique/);

  manager.destroy();
  expect(
    () => manager.update(makeSplatHierarchyView()),
    'does not traverse a destroyed hierarchy'
  ).toThrow(/destroyed/);
  firstBatch.destroy();
  secondBatch.destroy();
  void 0;
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
