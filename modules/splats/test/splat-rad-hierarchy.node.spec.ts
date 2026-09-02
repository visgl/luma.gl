// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, it} from 'vitest';
import {makeGPUSplatData, SplatResidencyManager, type GPUSplatData} from '@luma.gl/splats';
import {NullDevice} from '@luma.gl/test-utils';
import {GPUPagedSplatRenderer} from '../src/gpu-paged-splat-renderer';
import type {SplatHierarchyView} from '../src/splat-hierarchy';
import {
  getSplatRADPageBounds,
  SplatRADHierarchyManager,
  type SplatRADHierarchyFrontierEntry,
  type SplatRADHierarchyPage,
  type SplatRADHierarchyRequest
} from '../src/splat-rad-hierarchy';

const IDENTITY_MATRIX = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] as const;

it('SplatRADHierarchyManager conservatively derives original decoded source-page bounds', () => {
  const device = new NullDevice({});
  const page = makeRADPage(device, {
    id: 'root',
    rowIndexBase: 20,
    positions: [-1, 0, 0, 1, 2, 0],
    scales: [0.1, 0.2, 0.1, 0.25, 0.1, 0.1]
  });
  const bounds = getSplatRADPageBounds(page);

  expect(bounds.center, 'centers the proxy sphere on original page extrema').toEqual([0, 1, 0]);
  expect(
    Boolean((bounds.radius ?? 0) >= Math.SQRT2 + 0.75),
    'covers the farthest decoded position and its complete three-sigma Gaussian support'
  ).toBe(true);
  const authoredBounds = {center: [9, 8, 7] as const, radius: 5};
  expect(
    getSplatRADPageBounds({...page, bounds: authoredBounds}),
    'retains authored source bounds without creating replacement metadata'
  ).toBe(authoredBounds);

  page.data.destroy();
  void 0;
});

it('SplatRADHierarchyManager requests the single global Spark root only once', () => {
  const device = new NullDevice({});
  const requests: SplatRADHierarchyRequest[] = [];
  const manager = new SplatRADHierarchyManager({
    pageSize: 16,
    onPageRequest: request => requests.push(request)
  });

  manager.update(makeRADView());
  manager.update(makeRADView());
  expect(
    requests.map(request => [request.rowIndex, request.pageIndex]),
    'deduplicates repeated camera updates into one root source-page request'
  ).toEqual([[0, 0]]);
  expect(manager.requestedRows, 'exposes the original missing global source row').toEqual([0]);

  manager.clearRequestedPage(0);
  manager.update(makeRADView());
  expect(
    requests.map(request => [request.rowIndex, request.pageIndex]),
    'retries a transient root-page failure instead of retargeting an empty retained tree'
  ).toEqual([
    [0, 0],
    [0, 0]
  ]);
  expect(manager.requestedRows, 'restores the missing global root request').toEqual([0]);

  const root = makeRADPage(device, {id: 'root', rowIndexBase: 0, positions: [0, 0, 0]});
  expect(
    Boolean(manager.registerPage(root)),
    'admits the independently decoded root source page'
  ).toBe(true);
  expect(
    manager.frontier,
    'defers traversal until the caller batches page admissions into an explicit camera update'
  ).toEqual([]);
  manager.update(makeRADView());
  expect(
    getFrontierSourceRows(manager.frontier),
    'selects the one Spark root source row after registration'
  ).toEqual([[0]]);
  expect(manager.getPage('root'), 'preserves exact caller-owned source metadata').toBe(root);
  expect(manager.getPageForRow(0), 'resolves the global source row without page packing').toBe(
    root
  );
  expect(manager.stats.requestedPageCount, 'clears the resolved root source-page request').toBe(0);

  manager.destroy();
  expect(Boolean(root.data.destroyed), 'does not destroy caller-owned prepared source data').toBe(
    false
  );
  root.data.destroy();
  void 0;
});

it('SplatRADHierarchyManager preserves synchronous root retry invalidation', () => {
  let requestCount = 0;
  let manager!: SplatRADHierarchyManager;
  manager = new SplatRADHierarchyManager({
    onPageRequest: request => {
      requestCount++;
      if (requestCount === 1) {
        manager.clearRequestedPage(request.pageIndex);
      }
    }
  });

  manager.update(makeRADView());
  expect(manager.hasPendingTraversal, 'keeps callback-requested root refresh work pending').toBe(
    true
  );
  manager.update(makeRADView());
  expect(requestCount, 'reissues the synchronously cleared root request').toBe(2);
  expect(manager.requestedRows, 'retains the retried root demand').toEqual([0]);

  manager.destroy();
  void 0;
});

it('SplatRADHierarchyManager refines mixed parent and childless rows independently', () => {
  const device = new NullDevice({});
  const requests: SplatRADHierarchyRequest[] = [];
  const events: number[][][] = [];
  const root = makeRADPage(device, {
    id: 'root',
    sourceBatchIndex: 4,
    rowIndexBase: 0,
    positions: [0, 0, 0, 0.25, 0, 0],
    childCounts: [2, 0],
    childStarts: [4, 0]
  });
  const children = makeRADPage(device, {
    id: 'children',
    sourceBatchIndex: 9,
    rowIndexBase: 4,
    positions: [-0.15, 0, 0, 0.15, 0, 0]
  });
  const manager = new SplatRADHierarchyManager({
    pages: [root],
    rootRows: [0, 1],
    pageSize: 2,
    maximumScreenSpaceError: 1,
    onPageRequest: request => requests.push(request),
    onFrontierChange: frontier => events.push(getFrontierSourceRows(frontier))
  });

  manager.update(makeRADView());
  expect(
    getFrontierSourceRows(manager.frontier),
    'retains the coarse parent and unrelated childless row in their original source page'
  ).toEqual([[0, 1]]);
  expect(
    Array.from(manager.frontier[0].activeMask),
    'marks original batch-local parent and leaf source rows without copying source buffers'
  ).toEqual([1, 1]);
  expect(manager.frontier[0].isFallback, 'marks only the containing source page as fallback').toBe(
    true
  );
  expect(
    manager.stats.fallbackRowCount,
    'counts the unresolved parent, not the unrelated leaf'
  ).toBe(1);
  expect(
    requests.map(request => [request.pageIndex, request.parentRowIndex]),
    'maps global child rows to one deduplicated, stable source-page request'
  ).toEqual([[2, 0]]);

  manager.registerPage(children);
  manager.update(makeRADView());
  expect(
    getFrontierSourceRows(manager.frontier),
    'removes only the refined parent while preserving its childless sibling and both child rows'
  ).toEqual([[1], [4, 5]]);
  expect(
    Array.from(manager.frontier[0].activeRows),
    'keeps page-local source offsets rather than replacing or repacking the mixed parent page'
  ).toEqual([1]);
  expect(
    Array.from(manager.frontier[0].activeMask),
    'updates only the source-row visibility mask for the original parent page'
  ).toEqual([0, 1]);
  expect(manager.frontier[0].data, 'retains the original mixed parent-page GPU batch').toBe(
    root.data
  );
  expect(manager.frontier[1].data, 'retains the original child-page GPU batch').toBe(children.data);
  expect(
    manager.frontier.map(entry => entry.data.sourceBatchIndex),
    'preserves independent source-batch identities for picking and semantic filtering'
  ).toEqual([4, 9]);
  expect(events, 'notifies renderers only when atomic original-row coverage changes').toEqual([
    [[0, 1]],
    [[1], [4, 5]]
  ]);

  manager.destroy();
  root.data.destroy();
  children.data.destroy();
  void 0;
});

it('SplatRADHierarchyManager clears fallback diagnostics when missing children become resident', () => {
  const device = new NullDevice({});
  const parent = makeRADPage(device, {
    id: 'resolved-fallback-parent',
    rowIndexBase: 0,
    positions: [0, 0, 0],
    childCounts: [1],
    childStarts: [1]
  });
  const child = makeRADPage(device, {
    id: 'resolved-fallback-child',
    rowIndexBase: 1,
    positions: [0, 0, 0]
  });
  const manager = new SplatRADHierarchyManager({
    pages: [parent],
    pageSize: 1,
    maximumScreenSpaceError: 50,
    refinementHysteresis: 0
  });
  const view = (distance: number): SplatHierarchyView => ({
    ...makeRADView(),
    cameraPosition: [0, 0, distance],
    verticalFieldOfView: Math.PI / 2
  });

  manager.update(view(1));
  expect(manager.frontier[0].isFallback, 'marks the parent while its child page is missing').toBe(
    true
  );
  manager.registerPage(child);
  manager.update(view(100));
  expect(
    getFrontierSourceRows(manager.frontier),
    'keeps the coarse parent when the resident child is below the refinement threshold'
  ).toEqual([[0]]);
  expect(manager.frontier[0].isFallback, 'does not report resolved child data as missing').toBe(
    false
  );
  expect(manager.stats.fallbackRowCount, 'removes the stale fallback diagnostic count').toBe(0);

  manager.destroy();
  parent.data.destroy();
  child.data.destroy();
  device.destroy();
  void 0;
});

it('SplatRADHierarchyManager pins partial child pages until all replacing rows exist', () => {
  const device = new NullDevice({});
  const residency = new SplatResidencyManager({maxResidentChunks: 3});
  const requests: SplatRADHierarchyRequest[] = [];
  const parent = makeRADPage(device, {
    id: 'parent',
    rowIndexBase: 0,
    positions: [0, 0, 0],
    childCounts: [2],
    childStarts: [2]
  });
  const firstChild = makeRADPage(device, {
    id: 'first-child',
    rowIndexBase: 2,
    positions: [-0.1, 0, 0]
  });
  const secondChild = makeRADPage(device, {
    id: 'second-child',
    rowIndexBase: 3,
    positions: [0.1, 0, 0]
  });
  const manager = new SplatRADHierarchyManager({
    pages: [parent],
    pageSize: 1,
    residencyManager: residency,
    maximumScreenSpaceError: 1,
    onPageRequest: request => requests.push(request)
  });

  manager.update(makeRADView());
  expect(
    requests.map(request => request.pageIndex),
    'requests both globally addressed child source pages'
  ).toEqual([2, 3]);
  expect(
    Boolean(residency.getChunk('parent')?.pinned),
    'pins the active coarse fallback source page'
  ).toBe(true);

  manager.registerPage(firstChild);
  manager.update(makeRADView());
  expect(
    getFrontierSourceRows(manager.frontier),
    'keeps the coarse source parent visible until the final child page is ready'
  ).toEqual([[0]]);
  expect(
    Boolean(residency.getChunk('first-child')?.pinned),
    'protects an already decoded child page from residency thrashing'
  ).toBe(true);
  expect(manager.requestedRows, 'keeps only the still-missing source child request').toEqual([3]);

  manager.registerPage(secondChild);
  manager.update(makeRADView());
  expect(
    getFrontierSourceRows(manager.frontier),
    'atomically replaces one parent with its original children across page boundaries'
  ).toEqual([[2], [3]]);
  expect(
    Boolean(residency.getChunk('parent')?.pinned),
    'releases the obsolete parent fallback pin'
  ).toBe(false);
  expect(
    Boolean(residency.getChunk('first-child')?.pinned),
    'pins the first active child source page'
  ).toBe(true);
  expect(
    Boolean(residency.getChunk('second-child')?.pinned),
    'pins the second active child source page'
  ).toBe(true);
  expect(manager.stats.fallbackRowCount, 'removes fallback coverage after atomic replacement').toBe(
    0
  );

  manager.destroy();
  expect(
    Boolean(residency.destroyed),
    'borrows the externally managed source residency window'
  ).toBe(false);
  residency.destroy();
  parent.data.destroy();
  firstChild.data.destroy();
  secondChild.data.destroy();
  void 0;
});

it('SplatRADHierarchyManager preserves partial child pins across bounded retarget slices', () => {
  const device = new NullDevice({});
  const residency = new SplatResidencyManager({maxResidentChunks: 2});
  const parent = makeRADPage(device, {
    id: 'retargeted-parent',
    rowIndexBase: 0,
    positions: [0, 0, 0],
    childCounts: [2],
    childStarts: [2]
  });
  const firstChild = makeRADPage(device, {
    id: 'retargeted-first-child',
    rowIndexBase: 2,
    positions: [-0.1, 0, 0]
  });
  const manager = new SplatRADHierarchyManager({
    pages: [parent, firstChild],
    pageSize: 1,
    residencyManager: residency,
    maximumScreenSpaceError: 1,
    maxTraversalRows: 1
  });

  manager.update(makeRADView());
  while (manager.hasPendingTraversal) {
    manager.continueTraversal(8);
  }
  expect(getFrontierSourceRows(manager.frontier), 'starts with coherent parent coverage').toEqual([
    [0]
  ]);
  expect(
    Boolean(residency.getChunk('retargeted-first-child')?.pinned),
    'protects the already resident partial child page'
  ).toBe(true);

  manager.update({...makeRADView(), cameraPosition: [0.01, 0, 2]});
  expect(manager.hasPendingTraversal, 'keeps the bounded retained-tree retarget in progress').toBe(
    true
  );
  expect(
    Boolean(residency.getChunk('retargeted-first-child')?.pinned),
    'does not release useful partial child residency before revisiting its branch'
  ).toBe(true);
  manager.update({...makeRADView(), cameraPosition: [0.02, 0, 2]});
  manager.continueTraversal(8);
  expect(
    manager.hasPendingTraversal,
    'keeps the mandatory latest-camera retarget pending after draining older work'
  ).toBe(true);
  expect(
    Boolean(residency.getChunk('retargeted-first-child')?.pinned),
    'does not release traversal-only pins between consecutive camera retargets'
  ).toBe(true);
  while (manager.hasPendingTraversal) {
    manager.continueTraversal(1);
  }
  expect(
    Boolean(residency.getChunk('retargeted-first-child')?.pinned),
    'keeps the confirmed partial child page protected after retarget completion'
  ).toBe(true);

  manager.destroy();
  residency.destroy();
  parent.data.destroy();
  firstChild.data.destroy();
  device.destroy();
  void 0;
});

it('SplatRADHierarchyManager sends exact sparse source-page frontiers to the GPU renderer', () => {
  const device = new NullDevice({});
  Object.defineProperties(device, {
    type: {value: 'webgpu'},
    info: {value: {...device.info, type: 'webgpu', shadingLanguage: 'wgsl'}}
  });
  const parent = makeRADPage(device, {
    id: 'parent',
    sourceBatchIndex: 4,
    rowIndexBase: 0,
    positions: [0, 0, 0, 0.25, 0, 0],
    childCounts: [1, 0],
    childStarts: [5, 0]
  });
  const child = makeRADPage(device, {
    id: 'child',
    sourceBatchIndex: 11,
    rowIndexBase: 5,
    positions: [-0.1, 0, 0]
  });
  const renderer = new GPUPagedSplatRenderer(device, {viewportSize: [256, 256]});
  const manager = new SplatRADHierarchyManager({
    pages: [parent],
    rootRows: [0, 1],
    maximumScreenSpaceError: 1,
    onFrontierChange: frontier => renderer.setFrontier(frontier)
  });

  manager.update(makeRADView());
  expect(
    renderer.pages.map(page => Array.from(page.activeRows ?? [])),
    'passes the parent fallback and childless sibling as original batch-local offsets'
  ).toEqual([[0, 1]]);
  expect(renderer.pages[0].data, 'borrows the untouched parent GPU source batch').toBe(parent.data);

  manager.registerPage(child);
  manager.update(makeRADView());
  expect(
    renderer.pages.map(page => Array.from(page.activeRows ?? [])),
    'updates only sparse local source-row indirection during atomic parent replacement'
  ).toEqual([[1], [0]]);
  expect(
    renderer.pages.map(page => [page.data.sourceBatchIndex, page.data.rowIndexBase]),
    'preserves stable original page and global source-row picking identities'
  ).toEqual([
    [4, 0],
    [11, 5]
  ]);
  expect(
    renderer.pages[0].data.positions.data[0].buffer,
    'keeps the original independently allocated source position buffer'
  ).toBe(parent.data.positions.data[0].buffer);
  expect(renderer.compiledGraph, 'keeps GPU graph compilation lazy during traversal').toBe(
    undefined
  );

  manager.update({
    ...makeRADView(),
    modelViewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -5, 0, 0, 1]
  });
  expect(renderer.pages.length, 'detaches every borrowed source when the frontier is empty').toBe(
    0
  );
  manager.update(makeRADView());
  expect(renderer.pages[0].data, 'restores the original mixed source page').toBe(parent.data);
  expect(renderer.pages[1].data, 'restores the original child source page').toBe(child.data);

  renderer.destroy();
  manager.destroy();
  expect(
    Boolean(parent.data.destroyed),
    'neither borrowing component destroys parent source data'
  ).toBe(false);
  expect(
    Boolean(child.data.destroyed),
    'neither borrowing component destroys child source data'
  ).toBe(false);
  parent.data.destroy();
  child.data.destroy();
  void 0;
});

it('SplatRADHierarchyManager respects active-row budgets and missing-page backpressure', () => {
  const device = new NullDevice({});
  const parent = makeRADPage(device, {
    id: 'parent',
    rowIndexBase: 0,
    positions: [0, 0, 0],
    childCounts: [2],
    childStarts: [2]
  });
  const children = makeRADPage(device, {
    id: 'children',
    rowIndexBase: 2,
    positions: [-0.2, 0, 0, 0.2, 0, 0]
  });
  const requests: number[] = [];
  const activeBudget = new SplatRADHierarchyManager({
    pages: [parent, children],
    maximumScreenSpaceError: 0,
    maximumActiveRows: 1,
    onPageRequest: request => requests.push(request.pageIndex)
  });

  activeBudget.update(makeRADView());
  expect(
    getFrontierSourceRows(activeBudget.frontier),
    'keeps one coarse parent when its child replacement would exceed the active-row budget'
  ).toEqual([[0]]);
  expect(
    Boolean(activeBudget.frontier[0].isFallback),
    'does not mislabel an intentional budgeted level'
  ).toBe(false);
  expect(activeBudget.stats.activeRowCount, 'never exceeds the configured visible-row budget').toBe(
    1
  );
  expect(requests, 'does not request unreachable detail outside the active-row budget').toEqual([]);

  activeBudget.destroy();
  parent.data.destroy();
  children.data.destroy();
  void 0;
});

it('SplatRADHierarchyManager budgets only visible rows while retaining authored traversal limits', () => {
  const device = new NullDevice({});
  const parent = makeRADPage(device, {
    id: 'parent',
    rowIndexBase: 0,
    positions: [0, 0, 0],
    childCounts: [5],
    childStarts: [1]
  });
  const children = makeRADPage(device, {
    id: 'children',
    rowIndexBase: 1,
    positions: [0, 0, 0, 4, 0, 0, -4, 0, 0, 0, 4, 0, 0, -4, 0],
    childCounts: [2, 0, 0, 0, 0],
    childStarts: [6, 0, 0, 0, 0]
  });
  const grandchildren = makeRADPage(device, {
    id: 'grandchildren',
    rowIndexBase: 6,
    positions: [-0.1, 0, 0, 0.1, 0, 0]
  });
  const manager = new SplatRADHierarchyManager({
    pages: [parent, children, grandchildren],
    maximumScreenSpaceError: 0,
    maximumActiveRows: 2,
    maxTraversalRows: 8,
    refinementHysteresis: 0
  });

  manager.update(makeRADView());

  expect(
    getFrontierSourceRows(manager.frontier),
    'refines the sole visible child through its next level instead of reserving culled siblings'
  ).toEqual([[6, 7]]);
  expect(manager.stats.activeRowCount, 'accounts for only original visible frontier rows').toBe(2);
  expect(manager.stats.culledRowCount, 'still evaluates each authored invisible source child').toBe(
    4
  );
  expect(
    manager.stats.visibleRowCount + manager.stats.culledRowCount,
    'continues charging every authored child against the synchronous traversal budget'
  ).toBe(8);
  expect(manager.stats.fallbackRowCount, 'removes every fully replaced resident parent').toBe(0);
  expect(manager.stats.requestedPageCount, 'retains complete resident child-page readiness').toBe(
    0
  );
  expect(manager.frontier[0].data, 'borrows the original finest source page').toBe(
    grandchildren.data
  );

  manager.destroy();
  parent.data.destroy();
  children.data.destroy();
  grandchildren.data.destroy();
  void 0;
});

it('SplatRADHierarchyManager retains fallback when protected page budgets deny child admission', () => {
  const device = new NullDevice({});
  const residency = new SplatResidencyManager({maxResidentChunks: 2});
  const requests: number[] = [];
  const parent = makeRADPage(device, {
    id: 'parent',
    rowIndexBase: 0,
    positions: [0, 0, 0],
    childCounts: [2],
    childStarts: [2]
  });
  const firstChild = makeRADPage(device, {
    id: 'first-child',
    rowIndexBase: 2,
    positions: [-0.1, 0, 0]
  });
  const secondChild = makeRADPage(device, {
    id: 'second-child',
    rowIndexBase: 3,
    positions: [0.1, 0, 0]
  });
  const manager = new SplatRADHierarchyManager({
    pages: [parent],
    pageSize: 1,
    residencyManager: residency,
    maximumScreenSpaceError: 1,
    onPageRequest: request => requests.push(request.pageIndex)
  });

  manager.update(makeRADView());
  expect(
    Boolean(manager.registerPage(firstChild)),
    'admits one child inside the independent page budget'
  ).toBe(true);
  manager.update(makeRADView());
  expect(
    Boolean(manager.registerPage(secondChild)),
    'rejects the final child when the protected parent and first sibling exhaust residency'
  ).toBe(false);
  expect(
    getFrontierSourceRows(manager.frontier),
    'retains exact parent fallback when atomic child replacement cannot fit'
  ).toEqual([[0]]);
  expect(residency.stats.residentChunkCount, 'never exceeds the independent source-page cap').toBe(
    2
  );
  expect(
    Boolean(residency.getChunk('parent')?.pinned),
    'does not evict the original visible parent'
  ).toBe(true);
  expect(
    Boolean(residency.getChunk('first-child')?.pinned),
    'does not thrash the completed child sibling'
  ).toBe(true);
  expect(
    Boolean(secondChild.data.destroyed),
    'leaves a rejected caller-owned source page untouched'
  ).toBe(false);

  manager.update(makeRADView());
  expect(requests, 'does not repeatedly request the unadmittable child source page').toEqual([
    2, 3
  ]);
  expect(manager.requestedRows, 'keeps one stable pending request for future capacity').toEqual([
    3
  ]);

  manager.destroy();
  residency.destroy();
  parent.data.destroy();
  firstChild.data.destroy();
  secondChild.data.destroy();
  void 0;
});

it('SplatRADHierarchyManager culls rows and concentrates detail around camera foveation', () => {
  const device = new NullDevice({});
  const parents = makeRADPage(device, {
    id: 'parents',
    rowIndexBase: 0,
    positions: [0, 0, 0, 0.8, 0, 0],
    childCounts: [1, 1],
    childStarts: [2, 3]
  });
  const children = makeRADPage(device, {
    id: 'children',
    rowIndexBase: 2,
    positions: [0.1, 0, 0, 0.8, 0, 0]
  });
  const manager = new SplatRADHierarchyManager({
    pages: [parents, children],
    rootRows: [0, 1],
    maximumScreenSpaceError: 20,
    foveation: {center: [0.5, 0.5], radius: 0.05, strength: 10}
  });

  manager.update(makeRADView());
  expect(
    getFrontierSourceRows(manager.frontier),
    'refines the centered parent while preserving a coarse peripheral source row'
  ).toEqual([[1], [2]]);
  expect(
    Boolean(
      (manager.frontier.find(entry => entry.id === 'children')?.priority ?? 0) >
        (manager.frontier.find(entry => entry.id === 'parents')?.priority ?? 0)
    ),
    'prioritizes original source rows near the camera gaze'
  ).toBe(true);

  manager.update({
    ...makeRADView(),
    modelViewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -4, 0, 0, 1]
  });
  expect(
    manager.frontier.length,
    'removes source rows outside the conservative camera frustum'
  ).toBe(0);
  expect(
    Boolean(manager.stats.culledRowCount > 0),
    'reports conservatively rejected original source rows'
  ).toBe(true);
  expect(
    manager.residencyManager.stats.pinnedChunkCount,
    'releases hierarchy-owned page pins when the camera no longer needs them'
  ).toBe(0);

  manager.destroy();
  parents.data.destroy();
  children.data.destroy();
  void 0;
});

it('SplatRADHierarchyManager cancels stale page demand and restores evicted parent coverage', () => {
  const device = new NullDevice({});
  const requested: number[] = [];
  const cancelled: number[] = [];
  const parent = makeRADPage(device, {
    id: 'parent',
    rowIndexBase: 0,
    positions: [0, 0, 0],
    childCounts: [1],
    childStarts: [4]
  });
  const child = makeRADPage(device, {
    id: 'child',
    rowIndexBase: 4,
    positions: [0, 0, 0]
  });
  const manager = new SplatRADHierarchyManager({
    pages: [parent],
    pageSize: 2,
    maximumScreenSpaceError: 1,
    onPageRequest: request => requested.push(request.pageIndex),
    onPageCancel: request => cancelled.push(request.pageIndex)
  });

  manager.update(makeRADView());
  expect(requested, 'requests the source page containing a missing global child').toEqual([2]);
  manager.update({
    ...makeRADView(),
    cameraPosition: [0, 0, 100],
    verticalFieldOfView: Math.PI / 2
  });
  expect(
    cancelled,
    'cancels detail demand once its visible parent no longer needs refinement'
  ).toEqual([2]);
  expect(manager.stats.requestedPageCount, 'drops the no-longer-relevant source page demand').toBe(
    0
  );

  manager.update(makeRADView());
  manager.registerPage(child);
  manager.update(makeRADView());
  expect(getFrontierSourceRows(manager.frontier), 'selects the restored child page').toEqual([[4]]);
  manager.removePage('child');
  expect(
    getFrontierSourceRows(manager.frontier),
    'restores the original parent row when its refined source child is removed'
  ).toEqual([[0]]);
  expect(
    Boolean(manager.frontier[0].isFallback),
    'marks the restored parent as replacement fallback'
  ).toBe(true);
  expect(requested, 'requests the page again only after explicit view/eviction changes').toEqual([
    2, 2, 2
  ]);

  manager.destroy();
  parent.data.destroy();
  child.data.destroy();
  void 0;
});

it('SplatRADHierarchyManager reuses caller-reserved residency and preserves external pins', async () => {
  const device = new NullDevice({});
  const residency = new SplatResidencyManager({maxResidentChunks: 1});
  const root = makeRADPage(device, {id: 'root', rowIndexBase: 0, positions: [0, 0, 0]});
  const chunk = await residency.load('root', () => root.data, {
    estimatedGpuBytes: root.data.byteLength,
    estimatedSplatCount: root.data.length
  });
  expect(Boolean(chunk), 'reserves and admits the source page before hierarchy registration').toBe(
    true
  );
  residency.pin('root');
  const manager = new SplatRADHierarchyManager({residencyManager: residency});

  expect(
    Boolean(manager.registerPage(root)),
    'reuses the existing caller-reserved source residency chunk'
  ).toBe(true);
  manager.update(makeRADView());
  expect(residency.stats.residentChunkCount, 'never duplicates source residency allocations').toBe(
    1
  );
  expect(manager.frontier[0].data, 'passes the original prepared batch to rendering').toBe(
    root.data
  );

  manager.destroy();
  expect(
    Boolean(residency.getChunk('root')?.pinned),
    'does not release a pin owned by the source caller'
  ).toBe(true);
  expect(
    Boolean(residency.destroyed),
    'does not destroy the caller-owned source residency manager'
  ).toBe(false);
  residency.unpin('root');
  residency.destroy();
  root.data.destroy();
  void 0;
});

it('SplatRADHierarchyManager traverses a large mixed-page global row tree', () => {
  const device = new NullDevice({});
  const pageSize = 64;
  const totalRowCount = 2_047;
  const pages: SplatRADHierarchyPage[] = [];
  for (let rowIndexBase = 0; rowIndexBase < totalRowCount; rowIndexBase += pageSize) {
    const rowCount = Math.min(pageSize, totalRowCount - rowIndexBase);
    const positions: number[] = [];
    const childCounts: number[] = [];
    const childStarts: number[] = [];
    for (let rowOffset = 0; rowOffset < rowCount; rowOffset++) {
      const globalRowIndex = rowIndexBase + rowOffset;
      positions.push((globalRowIndex % 32) / 64 - 0.25, 0, 0);
      childCounts.push(globalRowIndex < 1_023 ? 2 : 0);
      childStarts.push(globalRowIndex < 1_023 ? globalRowIndex * 2 + 1 : 0);
    }
    pages.push(
      makeRADPage(device, {
        id: `page-${rowIndexBase / pageSize}`,
        sourceBatchIndex: rowIndexBase / pageSize,
        rowIndexBase,
        positions,
        childCounts,
        childStarts
      })
    );
  }

  const manager = new SplatRADHierarchyManager({
    pages,
    pageSize,
    maximumScreenSpaceError: 0,
    maximumActiveRows: 1_024
  });
  manager.update(makeRADView());

  expect(manager.stats.activeRowCount, 'selects exactly the binary tree leaf frontier').toBe(1_024);
  expect(manager.stats.fallbackRowCount, 'never overlays resident ancestors over leaf rows').toBe(
    0
  );
  expect(manager.stats.requestedPageCount, 'resolves every child through its original page').toBe(
    0
  );
  expect(
    getFrontierSourceRows(manager.frontier).flat(),
    'retains every global leaf source identity across all independently resident source pages'
  ).toEqual(Array.from({length: 1_024}, (_, rowOffset) => rowOffset + 1_023));
  for (const entry of manager.frontier) {
    expect(entry.data, 'borrows the exact original source page').toBe(
      manager.getPage(entry.id)?.data
    );
    expect(
      Boolean(entry.activeRows.every(rowIndex => rowIndex < entry.data.length)),
      'keeps all selected source offsets batch-local'
    ).toBe(true);
  }

  manager.destroy();
  for (const page of pages) {
    page.data.destroy();
  }
  void 0;
});

it('SplatRADHierarchyManager spends a hard row budget on the highest-priority source branch', () => {
  const device = new NullDevice({});
  const parents = makeRADPage(device, {
    id: 'parents',
    rowIndexBase: 0,
    positions: [-0.2, 0, 0, 0.2, 0, 0],
    scales: [0.025, 0.025, 0.025, 0.2, 0.2, 0.2],
    childCounts: [2, 2],
    childStarts: [2, 4]
  });
  const children = makeRADPage(device, {
    id: 'children',
    rowIndexBase: 2,
    positions: [-0.25, 0, 0, -0.15, 0, 0, 0.15, 0, 0, 0.25, 0, 0]
  });
  const manager = new SplatRADHierarchyManager({
    pages: [parents, children],
    rootRows: [0, 1],
    maximumActiveRows: 3,
    maximumScreenSpaceError: 1,
    refinementHysteresis: 0
  });

  manager.update(makeRADView());
  expect(
    getFrontierSourceRows(manager.frontier),
    'refines the later high-value parent instead of exhausting the budget on source order'
  ).toEqual([[0], [4, 5]]);
  expect(manager.stats.activeRowCount, 'honors the hard original-source-row budget').toBe(3);
  expect(manager.frontier[0].data, 'keeps the original coarse source page').toBe(parents.data);
  expect(manager.frontier[1].data, 'borrows the intact finer source page').toBe(children.data);

  manager.destroy();
  parents.data.destroy();
  children.data.destroy();
  void 0;
});

it('SplatRADHierarchyManager reproduces Spark authored anisotropic and high-opacity row sizes', () => {
  const device = new NullDevice({});
  const page = makeRADPage(device, {
    id: 'authored',
    rowIndexBase: 0,
    positions: [0, 0, 0],
    scales: [0.03, 0.09, 0.18],
    opacities: [1.5]
  });
  const ordinaryManager = new SplatRADHierarchyManager({pages: [page]});
  const sparkManager = new SplatRADHierarchyManager({pages: [page], lodOpacity: true});

  ordinaryManager.update(makeRADView());
  sparkManager.update(makeRADView());
  expect(
    Boolean(Math.abs(ordinaryManager.frontier[0].geometricError - 0.2) < 1e-6),
    'derives authored node diameter from twice the average original anisotropic source scale'
  ).toBe(true);
  expect(
    Boolean(Math.abs(sparkManager.frontier[0].geometricError - 0.48) < 1e-6),
    'applies Spark nonlinear opacity expansion without decoding the source alpha a second time'
  ).toBe(true);
  expect(page.data.source.opacities[0], 'never modifies the original decoded source alpha').toBe(
    1.5
  );
  expect(
    Boolean(sparkManager.frontier[0].priority > ordinaryManager.frontier[0].priority),
    'increases the request importance of a genuinely expanded coarse LoD parent'
  ).toBe(true);

  ordinaryManager.destroy();
  sparkManager.destroy();
  page.data.destroy();
  void 0;
});

it('SplatRADHierarchyManager applies documented angular detail zones', () => {
  const device = new NullDevice({});
  const parents = makeRADPage(device, {
    id: 'parents',
    rowIndexBase: 0,
    positions: [0, 0, -0.25, 0.4330127, 0, -0.25, 0, 0, 0.25],
    childCounts: [1, 1, 1],
    childStarts: [3, 4, 5]
  });
  const children = makeRADPage(device, {
    id: 'children',
    rowIndexBase: 3,
    positions: [0, 0, -0.25, 0.4330127, 0, -0.25, 0, 0, 0.25]
  });
  const view: SplatHierarchyView = {
    cameraPosition: [0, 0, 0],
    viewportSize: [1_000, 1_000],
    verticalFieldOfView: Math.PI / 2,
    modelViewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, -1, 0, 0, 0, 1]
  };
  const manager = new SplatRADHierarchyManager({
    pages: [parents, children],
    rootRows: [0, 1, 2],
    maximumScreenSpaceError: 150,
    refinementHysteresis: 0
  });

  manager.update(view);
  expect(
    getFrontierSourceRows(manager.frontier),
    'keeps full detail ahead while retaining coarser peripheral and behind-camera source parents'
  ).toEqual([[1, 2], [3]]);

  const unfoveatedManager = new SplatRADHierarchyManager({
    pages: [parents, children],
    rootRows: [0, 1, 2],
    maximumScreenSpaceError: 150,
    coneFov0: 180,
    coneFov: 180,
    refinementHysteresis: 0
  });
  unfoveatedManager.update(view);
  expect(
    getFrontierSourceRows(unfoveatedManager.frontier),
    'extends full detail to the peripheral source row while preserving behind-camera foveation'
  ).toEqual([[2], [3, 4]]);

  manager.destroy();
  unfoveatedManager.destroy();
  parents.data.destroy();
  children.data.destroy();
  void 0;
});

it('SplatRADHierarchyManager retains resolved source rows across the camera threshold', () => {
  const device = new NullDevice({});
  const parent = makeRADPage(device, {
    id: 'parent',
    rowIndexBase: 0,
    positions: [0, 0, 0],
    childCounts: [1],
    childStarts: [1]
  });
  const child = makeRADPage(device, {id: 'child', rowIndexBase: 1, positions: [0, 0, 0]});
  const events: number[][][] = [];
  const manager = new SplatRADHierarchyManager({
    pages: [parent, child],
    maximumScreenSpaceError: 50,
    refinementHysteresis: 0.2,
    onFrontierChange: frontier => events.push(getFrontierSourceRows(frontier))
  });
  const view = (distance: number): SplatHierarchyView => ({
    ...makeRADView(),
    cameraPosition: [0, 0, distance],
    verticalFieldOfView: Math.PI / 2
  });

  manager.update(view(2.1));
  expect(getFrontierSourceRows(manager.frontier), 'starts with coarse parent coverage').toEqual([
    [0]
  ]);
  manager.update(view(1.6));
  expect(getFrontierSourceRows(manager.frontier), 'refines beyond the upper deadband').toEqual([
    [1]
  ]);
  const refinedFrontier = manager.frontier;
  manager.update(view(2.1));
  expect(manager.frontier, 'keeps the exact original refined page frontier').toBe(refinedFrontier);
  manager.update(view(2.2));
  expect(
    getFrontierSourceRows(manager.frontier),
    'does not churn source pages when the camera hovers inside the deadband'
  ).toEqual([[1]]);
  manager.update(view(2.6));
  expect(
    getFrontierSourceRows(manager.frontier),
    'keeps resident detail instead of de-resolving a visible branch below active capacity'
  ).toEqual([[1]]);
  manager.update(view(1.6));
  expect(
    getFrontierSourceRows(manager.frontier),
    'keeps the same retained child topology when the camera returns'
  ).toEqual([[1]]);
  expect(events, 'does not signal unnecessary renderer rebuilds').toEqual([[[0]], [[1]]]);

  manager.destroy();
  parent.data.destroy();
  child.data.destroy();
  void 0;
});

it('SplatRADHierarchyManager bounds synchronous camera traversal without losing parent coverage', () => {
  const device = new NullDevice({});
  const positions: number[] = [];
  const childCounts: number[] = [];
  const childStarts: number[] = [];
  for (let rowIndex = 0; rowIndex < 511; rowIndex++) {
    positions.push((rowIndex % 16) / 64 - 0.125, 0, 0);
    childCounts.push(rowIndex < 255 ? 2 : 0);
    childStarts.push(rowIndex < 255 ? rowIndex * 2 + 1 : 0);
  }
  const page = makeRADPage(device, {
    id: 'bounded-tree',
    rowIndexBase: 0,
    positions,
    childCounts,
    childStarts
  });
  const manager = new SplatRADHierarchyManager({
    pages: [page],
    maximumScreenSpaceError: 0,
    maximumActiveRows: 256,
    maxTraversalRows: 31
  });

  manager.update(makeRADView());
  expect(
    Boolean(manager.stats.visibleRowCount + manager.stats.culledRowCount <= 31),
    'caps evaluated source rows before synchronous traversal can monopolize a camera frame'
  ).toBe(true);
  expect(
    manager.stats.activeRowCount,
    'retains the coherent partially refined source frontier'
  ).toBe(16);
  expect(
    manager.stats.requestedPageCount,
    'does not demand children beyond the traversal cap'
  ).toBe(0);
  expect(manager.frontier[0].data, 'borrows the original bounded source allocation').toBe(
    page.data
  );
  const originalPositionBuffer = page.data.positions.data[0].buffer;
  manager.setTraversalBudget(63);
  expect(manager.stats.activeRowCount, 'expands detail after a settled camera budget update').toBe(
    32
  );
  expect(
    Boolean(manager.stats.visibleRowCount + manager.stats.culledRowCount <= 63),
    'invalidates the unchanged-view fast path when the source traversal budget grows'
  ).toBe(true);
  expect(
    page.data.positions.data[0].buffer,
    'never reallocates or replaces the caller-owned source page while changing detail'
  ).toBe(originalPositionBuffer);

  manager.setTraversalBudget(15);
  expect(manager.stats.activeRowCount, 'restores a responsive coarse frontier during motion').toBe(
    8
  );
  const movingFrontier = manager.frontier;
  manager.setTraversalBudget(15);
  expect(manager.frontier, 'skips unchanged traversal-budget updates').toBe(movingFrontier);
  manager.setTraversalBudget();
  expect(manager.stats.activeRowCount, 'allows an explicit unlimited settled traversal').toBe(256);
  expect(
    () => manager.setTraversalBudget(0),
    'rejects invalid dynamic traversal budgets before replacing the active frontier'
  ).toThrow(/traversal capacity/);
  expect(
    () => new SplatRADHierarchyManager({maxTraversalRows: 0}),
    'rejects an empty synchronous source-row traversal budget'
  ).toThrow(/traversal capacity/);

  manager.destroy();
  page.data.destroy();
  void 0;
});

it('SplatRADHierarchyManager resumes deterministic best-first traversal in bounded slices', () => {
  const device = new NullDevice({});
  const totalRowCount = 4_095;
  const positions: number[] = [];
  const childCounts: number[] = [];
  const childStarts: number[] = [];
  for (let rowIndex = 0; rowIndex < totalRowCount; rowIndex++) {
    positions.push((rowIndex % 64) / 256 - 0.125, 0, 0);
    childCounts.push(rowIndex < 2_047 ? 2 : 0);
    childStarts.push(rowIndex < 2_047 ? rowIndex * 2 + 1 : 0);
  }
  const page = makeRADPage(device, {
    id: 'incremental-tree',
    rowIndexBase: 0,
    positions,
    childCounts,
    childStarts
  });
  const manager = new SplatRADHierarchyManager({
    pages: [page],
    maximumScreenSpaceError: 0,
    maximumActiveRows: 2_048,
    maxTraversalRows: 127
  });

  manager.update(makeRADView());
  expect(
    Boolean(manager.hasPendingTraversal),
    'keeps the remaining best-first queue after one bounded slice'
  ).toBe(true);
  expect(
    Boolean(manager.stats.activeRowCount < 2_048),
    'does not hide a full-tree rebuild in the first slice'
  ).toBe(true);
  const originalPositionBuffer = page.data.positions.data[0].buffer;
  let previousEvaluatedRowCount = manager.stats.visibleRowCount + manager.stats.culledRowCount;
  let previousActiveRowCount = manager.stats.activeRowCount;
  let sliceCount = 1;
  while (manager.hasPendingTraversal && sliceCount < 64) {
    manager.continueTraversal(127);
    const evaluatedRowCount = manager.stats.visibleRowCount + manager.stats.culledRowCount;
    expect(
      Boolean(evaluatedRowCount - previousEvaluatedRowCount <= 127),
      'bounds each resumed source-row evaluation slice'
    ).toBe(true);
    expect(
      Boolean(manager.stats.activeRowCount >= previousActiveRowCount),
      'publishes a coherent frontier that only gains settled detail'
    ).toBe(true);
    previousEvaluatedRowCount = evaluatedRowCount;
    previousActiveRowCount = manager.stats.activeRowCount;
    sliceCount++;
  }

  expect(
    Boolean(manager.hasPendingTraversal),
    'drains the retained queue without another camera update'
  ).toBe(false);
  expect(
    Boolean(sliceCount > 1),
    'requires multiple bounded continuation slices for the large source tree'
  ).toBe(true);
  expect(manager.stats.activeRowCount, 'reaches the full leaf frontier beyond one slice').toBe(
    2_048
  );
  expect(
    getFrontierSourceRows(manager.frontier).flat(),
    'matches deterministic source-order leaves after incremental best-first refinement'
  ).toEqual(Array.from({length: 2_048}, (_, rowOffset) => rowOffset + 2_047));
  expect(
    page.data.positions.data[0].buffer,
    'never repacks or replaces the caller-owned source page while continuing'
  ).toBe(originalPositionBuffer);
  expect(
    () => manager.continueTraversal(0),
    'rejects an empty continuation slice before changing the settled frontier'
  ).toThrow(/traversal capacity/);

  manager.destroy();
  page.data.destroy();
  void 0;
});

it('SplatRADHierarchyManager retargets a resolved frontier without collapsing camera detail', () => {
  const device = new NullDevice({});
  const totalRowCount = 511;
  const positions: number[] = [];
  const childCounts: number[] = [];
  const childStarts: number[] = [];
  for (let rowIndex = 0; rowIndex < totalRowCount; rowIndex++) {
    positions.push((rowIndex % 16) / 256 - 0.03125, 0, 0);
    childCounts.push(rowIndex < 255 ? 2 : 0);
    childStarts.push(rowIndex < 255 ? rowIndex * 2 + 1 : 0);
  }
  const page = makeRADPage(device, {
    id: 'retargeted-tree',
    rowIndexBase: 0,
    positions,
    childCounts,
    childStarts
  });
  const manager = new SplatRADHierarchyManager({
    pages: [page],
    maximumScreenSpaceError: 0,
    maximumActiveRows: 256,
    maxTraversalRows: 31
  });

  manager.update(makeRADView());
  while (manager.hasPendingTraversal) {
    manager.continueTraversal(31);
  }
  expect(manager.stats.activeRowCount, 'resolves the complete visible leaf frontier').toBe(256);
  const resolvedRows = getFrontierSourceRows(manager.frontier);

  manager.update({...makeRADView(), cameraPosition: [0.01, 0, 2]});
  expect(
    manager.stats.activeRowCount,
    'does not restart a small root traversal when only the camera changes'
  ).toBe(256);
  expect(
    getFrontierSourceRows(manager.frontier),
    'keeps the coherent resolved leaf partition while retargeting its priorities'
  ).toEqual(resolvedRows);

  manager.destroy();
  page.data.destroy();
  device.destroy();
  void 0;
});

it('SplatRADHierarchyManager retargets deep retained branches without recursive tree scans', () => {
  const device = new NullDevice({});
  const rowCount = 20_000;
  const childCounts = new Array(rowCount).fill(0);
  const childStarts = new Array(rowCount).fill(0);
  childCounts[0] = 2;
  childStarts[0] = 1;
  childCounts[1] = 1;
  childStarts[1] = 3;
  for (let rowIndex = 3; rowIndex < rowCount - 1; rowIndex++) {
    childCounts[rowIndex] = 1;
    childStarts[rowIndex] = rowIndex + 1;
  }
  const page = makeRADPage(device, {
    id: 'deep-retained-branch',
    rowIndexBase: 0,
    positions: new Array(rowCount * 3).fill(0),
    childCounts,
    childStarts
  });
  const manager = new SplatRADHierarchyManager({
    pages: [page],
    maximumScreenSpaceError: 0,
    maximumActiveRows: 2
  });

  manager.update(makeRADView());
  expect(manager.stats.activeRowCount, 'resolves both deep-tree leaves').toBe(2);
  expect(
    () => manager.update({...makeRADView(), cameraPosition: [0.01, 0, 2]}),
    'retargets without overflowing the JavaScript call stack'
  ).not.toThrow();
  expect(manager.stats.activeRowCount, 'retains both visible leaves after retargeting').toBe(2);

  manager.destroy();
  page.data.destroy();
  device.destroy();
  void 0;
});

it('SplatRADHierarchyManager preserves overlap while retargeting newly visible branches', () => {
  const device = new NullDevice({});
  const page = makeRADPage(device, {
    id: 'retargeted-frustum',
    rowIndexBase: 0,
    positions: [0, 0, 0, -0.4, 0, 0, 1.2, 0, 0, 2, 0, 0, 3, 0, 0],
    scales: [0.5, 0.5, 0.5, ...Array.from({length: 12}, () => 0.05)],
    childCounts: [4, 0, 0, 0, 0],
    childStarts: [1, 0, 0, 0, 0]
  });
  const manager = new SplatRADHierarchyManager({
    pages: [page],
    maximumScreenSpaceError: 0,
    maximumActiveRows: 4,
    maxTraversalRows: 3
  });

  manager.update(makeRADView());
  while (manager.hasPendingTraversal) {
    manager.continueTraversal(3);
  }
  expect(
    getFrontierSourceRows(manager.frontier),
    'starts with only the child visible in the original frustum'
  ).toEqual([[1]]);

  manager.update({
    ...makeRADView(),
    modelViewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -0.4, 0, 0, 1]
  });
  expect(
    getFrontierSourceRows(manager.frontier).flat(),
    'does not replace already visible overlap with the coarse root during retargeting'
  ).toContain(1);
  expect(
    getFrontierSourceRows(manager.frontier).flat(),
    'does not publish the coarse ancestor beside its retained child'
  ).not.toContain(0);
  while (manager.hasPendingTraversal) {
    manager.continueTraversal(3);
  }
  expect(
    getFrontierSourceRows(manager.frontier),
    'adds the newly visible sibling without discarding retained overlap'
  ).toEqual([[1, 2]]);

  manager.destroy();
  page.data.destroy();
  device.destroy();
  void 0;
});

it('SplatRADHierarchyManager traverses visible descendants with an offscreen RAD parent', () => {
  const device = new NullDevice({});
  const page = makeRADPage(device, {
    id: 'retargeted-nonbounding-parent',
    rowIndexBase: 0,
    positions: [0, 0, 0, 0.9, 0, 0],
    scales: Array.from({length: 6}, () => 0.01),
    childCounts: [1, 0],
    childStarts: [1, 0]
  });
  const manager = new SplatRADHierarchyManager({
    pages: [page],
    maximumScreenSpaceError: 0,
    maxTraversalRows: 2
  });

  const shiftedView: SplatHierarchyView = {
    ...makeRADView(),
    modelViewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -1.4, 0, 0, 1]
  };
  manager.update(shiftedView);
  expect(
    getFrontierSourceRows(manager.frontier),
    'finds the visible child on the initial traversal because a parent splat is not a subtree bound'
  ).toEqual([[1]]);

  manager.update(makeRADView());
  expect(
    getFrontierSourceRows(manager.frontier),
    'keeps the visible child while retargeting the retained hierarchy'
  ).toEqual([[1]]);

  manager.destroy();
  page.data.destroy();
  device.destroy();
  void 0;
});

it('SplatRADHierarchyManager requests unknown descendants behind an offscreen RAD parent', () => {
  const device = new NullDevice({});
  const requested: number[] = [];
  const parent = makeRADPage(device, {
    id: 'offscreen-missing-parent',
    rowIndexBase: 0,
    positions: [0, 0, 0],
    childCounts: [1],
    childStarts: [1]
  });
  const manager = new SplatRADHierarchyManager({
    pages: [parent],
    pageSize: 1,
    maximumScreenSpaceError: 0,
    onPageRequest: request => requested.push(request.rowIndex)
  });
  const shiftedView: SplatHierarchyView = {
    ...makeRADView(),
    modelViewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -1.4, 0, 0, 1]
  };

  manager.update(shiftedView);
  expect(requested, 'does not treat an offscreen splat as a bound for its unknown subtree').toEqual(
    [1]
  );

  const child = makeRADPage(device, {
    id: 'offscreen-missing-child',
    rowIndexBase: 1,
    positions: [0.9, 0, 0]
  });
  expect(manager.registerPage(child), 'admits the requested descendant page').toBe(true);
  while (manager.hasPendingTraversal) {
    manager.continueTraversal(8);
  }
  expect(
    getFrontierSourceRows(manager.frontier),
    'discovers the visible streamed child after its offscreen parent requested it'
  ).toEqual([[1]]);

  manager.destroy();
  parent.data.destroy();
  child.data.destroy();
  device.destroy();
  void 0;
});

it('SplatRADHierarchyManager keeps visible capacity when an offscreen parent cannot cover it', () => {
  const device = new NullDevice({});
  const page = makeRADPage(device, {
    id: 'offscreen-capacity-parent',
    rowIndexBase: 0,
    positions: [0, 0, 0, 0.8, 0, 0, 1, 0, 0],
    scales: Array.from({length: 9}, () => 0.01),
    childCounts: [2, 0, 0],
    childStarts: [1, 0, 0]
  });
  const manager = new SplatRADHierarchyManager({
    pages: [page],
    maximumScreenSpaceError: 0,
    maximumActiveRows: 1
  });

  manager.update({
    ...makeRADView(),
    modelViewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -1.4, 0, 0, 1]
  });
  expect(manager.stats.activeRowCount, 'uses the one-row renderer capacity').toBe(1);
  expect(
    getFrontierSourceRows(manager.frontier).flat(),
    'keeps one visible child instead of publishing its invisible parent'
  ).toEqual([1]);

  manager.destroy();
  page.data.destroy();
  device.destroy();
  void 0;
});

it('SplatRADHierarchyManager refines and reprioritizes capacity-limited offscreen branches', () => {
  const device = new NullDevice({});
  const page = makeRADPage(device, {
    id: 'offscreen-capacity-refinement',
    rowIndexBase: 0,
    positions: [3, 0, 0, -0.5, 0, 0, 0.5, 0, 0, -0.45, 0, 0, 1.5, 0, 0],
    scales: Array.from({length: 15}, () => 0.01),
    childCounts: [2, 1, 1, 0, 0],
    childStarts: [1, 3, 4, 0, 0]
  });
  const manager = new SplatRADHierarchyManager({
    pages: [page],
    maximumScreenSpaceError: 0,
    maximumActiveRows: 1,
    maxTraversalRows: 1
  });

  manager.update({...makeRADView(), foveation: {strength: 10, radius: 0}});
  while (manager.hasPendingTraversal) {
    manager.continueTraversal(1);
  }
  expect(
    getFrontierSourceRows(manager.frontier).flat(),
    'continues refining the selected capacity-limited branch to its visible leaf'
  ).toEqual([3]);

  manager.update({
    ...makeRADView(),
    foveation: {strength: 10, radius: 0},
    modelViewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -1, 0, 0, 1]
  });
  const newlyVisibleRightRows: number[][] = [];
  while (manager.hasPendingTraversal) {
    newlyVisibleRightRows.push(getFrontierSourceRows(manager.continueTraversal(1)).flat());
  }
  expect(
    getFrontierSourceRows(manager.frontier).flat(),
    'moves limited capacity to the newly centered sibling and refines its retained subtree'
  ).toEqual([4]);
  expect(
    newlyVisibleRightRows.every(rows => rows.length > 0),
    'keeps coarse or retained coverage while descendant visibility catches up'
  ).toBe(true);

  manager.update({...makeRADView(), foveation: {strength: 10, radius: 0}});
  const restoredLeftRows: number[][] = [];
  while (manager.hasPendingTraversal) {
    restoredLeftRows.push(getFrontierSourceRows(manager.continueTraversal(1)).flat());
  }
  expect(
    getFrontierSourceRows(manager.frontier).flat(),
    'reactivates the previously resolved leaf after descendant visibility catches up'
  ).toEqual([3]);
  expect(
    restoredLeftRows.every(rows => rows.length > 0),
    'never drops the capacity-limited scene while switching back'
  ).toBe(true);
  manager.update({
    ...makeRADView(),
    foveation: {strength: 10, radius: 0},
    modelViewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -1, 0, 0, 1]
  });
  const restoredRightRows: number[][] = [];
  while (manager.hasPendingTraversal) {
    restoredRightRows.push(getFrontierSourceRows(manager.continueTraversal(1)).flat());
  }
  expect(
    getFrontierSourceRows(manager.frontier).flat(),
    'settles either capacity branch at its visible leaf'
  ).toEqual([4]);
  expect(
    restoredRightRows.every(rows => rows.length > 0),
    'keeps coverage while repeatedly changing descendant visibility'
  ).toBe(true);
  expect(manager.stats.activeRowCount, 'never exceeds the one-row renderer capacity').toBe(1);

  manager.destroy();
  page.data.destroy();
  device.destroy();
  void 0;
});

it('SplatRADHierarchyManager preserves coverage while offscreen sibling grandchildren swap', () => {
  const device = new NullDevice({});
  const page = makeRADPage(device, {
    id: 'offscreen-sibling-grandchildren',
    rowIndexBase: 0,
    positions: [3, 0, 0, -3, 0, 0, 3, 0, 0, 1.5, 0, 0, -0.45, 0, 0],
    scales: Array.from({length: 15}, () => 0.01),
    childCounts: [2, 1, 1, 0, 0],
    childStarts: [1, 4, 3, 0, 0]
  });
  const manager = new SplatRADHierarchyManager({
    pages: [page],
    maximumScreenSpaceError: 0,
    maximumActiveRows: 1,
    maxTraversalRows: 1
  });

  manager.update(makeRADView());
  while (manager.hasPendingTraversal) {
    manager.continueTraversal(1);
  }
  expect(
    getFrontierSourceRows(manager.frontier).flat(),
    'starts with the left visible leaf'
  ).toEqual([4]);

  manager.update({
    ...makeRADView(),
    modelViewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -1, 0, 0, 1]
  });
  const switchedRows: number[][] = [];
  const switchedActiveRowCounts: number[] = [];
  while (manager.hasPendingTraversal) {
    switchedRows.push(getFrontierSourceRows(manager.continueTraversal(1)).flat());
    switchedActiveRowCounts.push(manager.stats.activeRowCount);
  }
  expect(
    switchedRows.every(rows => rows.length > 0),
    'retargets the dormant sibling before releasing the currently visible leaf'
  ).toBe(true);
  expect(
    switchedActiveRowCounts.every(activeRowCount => activeRowCount <= 1),
    'enforces active capacity in the same slice that child visibility changes'
  ).toBe(true);
  expect(
    getFrontierSourceRows(manager.frontier).flat(),
    'settles on the newly visible grandchild behind the other offscreen branch'
  ).toEqual([3]);
  expect(manager.stats.activeRowCount, 'keeps the global active-row capacity exact').toBe(1);

  manager.destroy();
  page.data.destroy();
  device.destroy();
  void 0;
});

it('SplatRADHierarchyManager releases offscreen internal traversal pins after settling', () => {
  const device = new NullDevice({});
  const root = makeRADPage(device, {
    id: 'offscreen-pin-root',
    rowIndexBase: 0,
    positions: [0, 0, 0],
    childCounts: [1],
    childStarts: [1]
  });
  const internal = makeRADPage(device, {
    id: 'offscreen-pin-internal',
    rowIndexBase: 1,
    positions: [0.2, 0, 0],
    childCounts: [1],
    childStarts: [2]
  });
  const leaf = makeRADPage(device, {
    id: 'offscreen-pin-leaf',
    rowIndexBase: 2,
    positions: [0.4, 0, 0]
  });
  const manager = new SplatRADHierarchyManager({
    pages: [root, internal, leaf],
    pageSize: 1,
    maximumScreenSpaceError: 0,
    maxTraversalRows: 1
  });

  manager.update({
    ...makeRADView(),
    modelViewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -5, 0, 0, 1]
  });
  while (manager.hasPendingTraversal) {
    manager.continueTraversal(1);
  }
  expect(manager.frontier, 'settles with no visible hierarchy rows').toEqual([]);
  expect(
    manager.residencyManager.stats.pinnedChunkCount,
    'releases pages protected only while traversing an offscreen internal branch'
  ).toBe(0);

  manager.destroy();
  root.data.destroy();
  internal.data.destroy();
  leaf.data.destroy();
  device.destroy();
  void 0;
});

it('SplatRADHierarchyManager preserves relevant page demand across a bounded camera retarget', () => {
  const device = new NullDevice({});
  const requested: number[] = [];
  const cancelled: number[] = [];
  const page = makeRADPage(device, {
    id: 'retargeted-request',
    rowIndexBase: 0,
    positions: [0, 0, 0, -0.1, 0, 0, 0.1, 0, 0],
    childCounts: [2, 1, 0],
    childStarts: [1, 3, 0]
  });
  const manager = new SplatRADHierarchyManager({
    pages: [page],
    pageSize: 1,
    maximumScreenSpaceError: 1,
    maxTraversalRows: 1,
    onPageRequest: request => requested.push(request.pageIndex),
    onPageCancel: request => cancelled.push(request.pageIndex)
  });

  manager.update(makeRADView());
  while (manager.hasPendingTraversal) {
    manager.continueTraversal(8);
  }
  expect(requested, 'starts one missing descendant page request').toEqual([3]);

  manager.update({...makeRADView(), cameraPosition: [0.01, 0, 2]});
  expect(
    manager.requestedRows,
    'keeps prior page demand while the bounded retarget has not revisited its branch'
  ).toEqual([3]);
  expect(cancelled, 'does not abort useful transport work between retarget slices').toEqual([]);
  while (manager.hasPendingTraversal) {
    manager.continueTraversal(1);
  }
  expect(
    manager.requestedRows,
    'retains demand after confirming the branch is still visible'
  ).toEqual([3]);

  manager.update({
    ...makeRADView(),
    cameraPosition: [0, 0, 100],
    verticalFieldOfView: Math.PI / 2
  });
  while (manager.hasPendingTraversal) {
    manager.continueTraversal(1);
  }
  expect(cancelled, 'cancels detail demand once the coarse visible branch is sufficient').toEqual([
    3
  ]);

  manager.destroy();
  page.data.destroy();
  device.destroy();
  void 0;
});

it('SplatRADHierarchyManager interleaves new page discovery before retained retarget drains', () => {
  const device = new NullDevice({});
  const requested: number[] = [];
  const page = makeRADPage(device, {
    id: 'retargeted-refinement-fairness',
    rowIndexBase: 0,
    positions: Array.from({length: 21}, () => 0),
    childCounts: [2, 1, 4, 0, 0, 0, 0],
    childStarts: [1, 100, 3, 0, 0, 0, 0]
  });
  const manager = new SplatRADHierarchyManager({
    pages: [page],
    pageSize: 1,
    maximumScreenSpaceError: 0,
    maxTraversalRows: 5,
    onPageRequest: request => requested.push(request.pageIndex)
  });

  manager.update(makeRADView());
  while (manager.hasPendingTraversal) {
    manager.continueTraversal(64);
  }
  expect(requested, 'discovers the missing high-priority descendant initially').toEqual([100]);

  manager.clearRequestedPage(100);
  requested.length = 0;
  manager.update({...makeRADView(), cameraPosition: [0.01, 0, 2]});

  expect(
    requested,
    'reserves work for current-view page discovery while retained retarget work remains'
  ).toEqual([100]);
  expect(
    manager.hasPendingTraversal,
    'continues the lower-priority retained retarget after discovering current-view demand'
  ).toBe(true);

  manager.destroy();
  page.data.destroy();
  device.destroy();
  void 0;
});

it('SplatRADHierarchyManager progresses across consecutive one-row camera retargets', () => {
  const device = new NullDevice({});
  const requested: number[] = [];
  const page = makeRADPage(device, {
    id: 'one-row-retarget-fairness',
    rowIndexBase: 0,
    positions: Array.from({length: 21}, () => 0),
    childCounts: [2, 1, 4, 0, 0, 0, 0],
    childStarts: [1, 100, 3, 0, 0, 0, 0]
  });
  const manager = new SplatRADHierarchyManager({
    pages: [page],
    pageSize: 1,
    maximumScreenSpaceError: 0,
    maxTraversalRows: 1,
    onPageRequest: request => requested.push(request.pageIndex)
  });

  manager.update(makeRADView());
  while (manager.hasPendingTraversal) {
    manager.continueTraversal(64);
  }
  expect(requested, 'discovers initial missing descendant demand').toEqual([100]);

  manager.clearRequestedPage(100);
  requested.length = 0;
  for (let cameraUpdateIndex = 1; cameraUpdateIndex <= 10; cameraUpdateIndex++) {
    manager.update({
      ...makeRADView(),
      cameraPosition: [cameraUpdateIndex / 1_000, 0, 2]
    });
  }
  expect(
    requested,
    'does not restart at the root and starve page discovery on every changed camera update'
  ).toEqual([100]);
  expect(
    manager.hasPendingTraversal,
    'leaves retained retarget work to continue after the refinement slice'
  ).toBe(true);

  manager.destroy();
  page.data.destroy();
  device.destroy();
  void 0;
});

it('SplatRADHierarchyManager coarsens newly visible dormant siblings within active capacity', () => {
  const device = new NullDevice({});
  const page = makeRADPage(device, {
    id: 'retargeted-capacity',
    rowIndexBase: 0,
    positions: [0, 0, 0, 0, 0, 0, 4, 0, 0, -4, 0, 0],
    childCounts: [3, 0, 0, 0],
    childStarts: [1, 0, 0, 0]
  });
  const manager = new SplatRADHierarchyManager({
    pages: [page],
    maximumScreenSpaceError: 0,
    maximumActiveRows: 2,
    maxTraversalRows: 16
  });

  manager.update(makeRADView());
  expect(
    getFrontierSourceRows(manager.frontier),
    'starts with only the centered visible child'
  ).toEqual([[1]]);

  manager.update({
    ...makeRADView(),
    modelViewProjectionMatrix: [0.2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
  });
  expect(
    getFrontierSourceRows(manager.frontier),
    'uses the coherent parent rather than exceeding capacity with newly visible siblings'
  ).toEqual([[0]]);
  expect(manager.stats.activeRowCount, 'keeps the renderer-visible frontier within capacity').toBe(
    1
  );

  manager.update(makeRADView());
  expect(
    getFrontierSourceRows(manager.frontier),
    'reactivates the retained centered child without rebuilding discarded topology'
  ).toEqual([[1]]);

  manager.destroy();
  page.data.destroy();
  device.destroy();
  void 0;
});

it('SplatRADHierarchyManager resumes a child list wider than one traversal slice', () => {
  const device = new NullDevice({});
  const childCount = 128;
  const page = makeRADPage(device, {
    id: 'high-fanout-tree',
    rowIndexBase: 0,
    positions: Array.from({length: childCount + 1}, (_, rowIndex) => [
      (rowIndex % 16) / 64 - 0.125,
      0,
      0
    ]).flat(),
    childCounts: [childCount, ...Array.from({length: childCount}, () => 0)],
    childStarts: [1, ...Array.from({length: childCount}, () => 0)]
  });
  const manager = new SplatRADHierarchyManager({
    pages: [page],
    maximumScreenSpaceError: 0,
    maximumActiveRows: childCount,
    maxTraversalRows: 127
  });

  manager.update(makeRADView());
  expect(
    Boolean(manager.hasPendingTraversal),
    'retains partial progress through the wide child list'
  ).toBe(true);
  expect(getFrontierSourceRows(manager.frontier), 'keeps parent coverage mid-slice').toEqual([[0]]);

  manager.continueTraversal(127);
  expect(
    Boolean(manager.hasPendingTraversal),
    'finishes the wide child list on the next slice'
  ).toBe(false);
  expect(
    getFrontierSourceRows(manager.frontier).flat(),
    'publishes every child after the resumable refinement completes'
  ).toEqual(Array.from({length: childCount}, (_, childOffset) => childOffset + 1));

  manager.destroy();
  page.data.destroy();
  device.destroy();
  void 0;
});

it('SplatRADHierarchyManager skips unchanged camera traversal but detects dynamic source rows', () => {
  const device = new NullDevice({});
  const parent = makeRADPage(device, {
    id: 'parent',
    rowIndexBase: 0,
    positions: [0, 0, 0],
    scales: [0.01, 0.01, 0.01],
    childCounts: [1],
    childStarts: [1]
  });
  const child = makeRADPage(device, {id: 'child', rowIndexBase: 1, positions: [0, 0, 0]});
  const manager = new SplatRADHierarchyManager({
    pages: [parent, child],
    maximumScreenSpaceError: 20,
    refinementHysteresis: 0
  });

  const view = makeRADView();
  manager.update(view);
  const originalFrontier = manager.frontier;
  manager.update({
    ...view,
    cameraPosition: [...view.cameraPosition],
    viewportSize: [...view.viewportSize],
    modelViewProjectionMatrix: [...view.modelViewProjectionMatrix!]
  });
  expect(manager.frontier, 'reuses exact source-row frontiers for identical views').toBe(
    originalFrontier
  );

  parent.data.updateRows(0, {scales: new Float32Array([0.2, 0.2, 0.2])});
  manager.update(view);
  expect(
    getFrontierSourceRows(manager.frontier),
    'refreshes the authored source-row frontier after an in-place source GPU revision'
  ).toEqual([[1]]);

  manager.destroy();
  parent.data.destroy();
  child.data.destroy();
  void 0;
});

it('SplatRADHierarchyManager rejects inconsistent child metadata and overlapping row ranges', () => {
  const device = new NullDevice({});
  const root = makeRADPage(device, {id: 'root', rowIndexBase: 0, positions: [0, 0, 0]});
  const overlap = makeRADPage(device, {id: 'overlap', rowIndexBase: 0, positions: [0, 0, 0]});
  const manager = new SplatRADHierarchyManager({pages: [root]});

  expect(
    () => manager.registerPage(overlap),
    'rejects source pages with ambiguous global source-row identities'
  ).toThrow(/must not overlap/);
  expect(
    () =>
      manager.registerPage({
        ...overlap,
        id: 'invalid-tree',
        childCounts: new Uint16Array([1])
      }),
    'rejects incomplete source child metadata before modifying residency'
  ).toThrow(/hierarchy arrays/);
  expect(
    () => manager.setRootRows([-1]),
    'rejects global roots outside the stable GPU source-row domain'
  ).toThrow(/hierarchy roots/);
  expect(
    () => new SplatRADHierarchyManager({pageSize: 0}),
    'rejects invalid original source-page sizes'
  ).toThrow(/page size/);
  expect(
    () => new SplatRADHierarchyManager({maximumActiveRows: 0}),
    'rejects empty source-row visibility budgets'
  ).toThrow(/active-row capacity/);

  manager.destroy();
  expect(() => manager.update(makeRADView()), 'rejects camera updates after destroy').toThrow(
    /destroyed/
  );
  root.data.destroy();
  overlap.data.destroy();
  void 0;
});

function makeRADPage(
  device: NullDevice,
  options: {
    id: string;
    rowIndexBase: number;
    sourceBatchIndex?: number;
    positions: number[];
    scales?: number[];
    opacities?: number[];
    childCounts?: number[];
    childStarts?: number[];
  }
): SplatRADHierarchyPage {
  const rowCount = options.positions.length / 3;
  const scales = options.scales ?? Array.from({length: rowCount * 3}, () => 0.1);
  const rotations = new Float32Array(rowCount * 4);
  const colors = new Uint8Array(rowCount * 4);
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    rotations[rowIndex * 4] = 1;
    colors.set([255, 255, 255, 255], rowIndex * 4);
  }
  const data: GPUSplatData = makeGPUSplatData(device, {
    positions: Float32Array.from(options.positions),
    scales: Float32Array.from(scales),
    rotations,
    colors,
    opacities: options.opacities
      ? Float32Array.from(options.opacities)
      : new Float32Array(rowCount).fill(1),
    sourceBatchIndex: options.sourceBatchIndex ?? options.rowIndexBase,
    rowIndexBase: options.rowIndexBase
  });
  return {
    id: options.id,
    data,
    ...(options.childCounts ? {childCounts: Uint16Array.from(options.childCounts)} : {}),
    ...(options.childStarts ? {childStarts: Uint32Array.from(options.childStarts)} : {})
  };
}

function makeRADView(): SplatHierarchyView {
  return {
    cameraPosition: [0, 0, 2],
    viewportSize: [1_000, 1_000],
    modelViewProjectionMatrix: IDENTITY_MATRIX
  };
}

function getFrontierSourceRows(frontier: readonly SplatRADHierarchyFrontierEntry[]): number[][] {
  return frontier.map(entry =>
    Array.from(entry.activeRows, rowOffset => entry.data.rowIndexBase + rowOffset)
  );
}
