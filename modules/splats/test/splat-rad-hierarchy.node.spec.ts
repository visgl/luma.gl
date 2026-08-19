// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';
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

test('SplatRADHierarchyManager conservatively derives original decoded source-page bounds', t => {
  const device = new NullDevice({});
  const page = makeRADPage(device, {
    id: 'root',
    rowIndexBase: 20,
    positions: [-1, 0, 0, 1, 2, 0],
    scales: [0.1, 0.2, 0.1, 0.25, 0.1, 0.1]
  });
  const bounds = getSplatRADPageBounds(page);

  t.deepEqual(bounds.center, [0, 1, 0], 'centers the proxy sphere on original page extrema');
  t.ok(
    (bounds.radius ?? 0) >= Math.SQRT2 + 0.75,
    'covers the farthest decoded position and its complete three-sigma Gaussian support'
  );
  const authoredBounds = {center: [9, 8, 7] as const, radius: 5};
  t.equal(
    getSplatRADPageBounds({...page, bounds: authoredBounds}),
    authoredBounds,
    'retains authored source bounds without creating replacement metadata'
  );

  page.data.destroy();
  t.end();
});

test('SplatRADHierarchyManager requests the single global Spark root only once', t => {
  const device = new NullDevice({});
  const requests: SplatRADHierarchyRequest[] = [];
  const manager = new SplatRADHierarchyManager({
    pageSize: 16,
    onPageRequest: request => requests.push(request)
  });

  manager.update(makeRADView());
  manager.update(makeRADView());
  t.deepEqual(
    requests.map(request => [request.rowIndex, request.pageIndex]),
    [[0, 0]],
    'deduplicates repeated camera updates into one root source-page request'
  );
  t.deepEqual(manager.requestedRows, [0], 'exposes the original missing global source row');

  const root = makeRADPage(device, {id: 'root', rowIndexBase: 0, positions: [0, 0, 0]});
  t.ok(manager.registerPage(root), 'admits the independently decoded root source page');
  t.deepEqual(
    manager.frontier,
    [],
    'defers traversal until the caller batches page admissions into an explicit camera update'
  );
  manager.update(makeRADView());
  t.deepEqual(
    getFrontierSourceRows(manager.frontier),
    [[0]],
    'selects the one Spark root source row after registration'
  );
  t.equal(manager.getPage('root'), root, 'preserves exact caller-owned source metadata');
  t.equal(manager.getPageForRow(0), root, 'resolves the global source row without page packing');
  t.equal(manager.stats.requestedPageCount, 0, 'clears the resolved root source-page request');

  manager.destroy();
  t.notOk(root.data.destroyed, 'does not destroy caller-owned prepared source data');
  root.data.destroy();
  t.end();
});

test('SplatRADHierarchyManager refines mixed parent and childless rows independently', t => {
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
  t.deepEqual(
    getFrontierSourceRows(manager.frontier),
    [[0, 1]],
    'retains the coarse parent and unrelated childless row in their original source page'
  );
  t.deepEqual(
    Array.from(manager.frontier[0].activeMask),
    [1, 1],
    'marks original batch-local parent and leaf source rows without copying source buffers'
  );
  t.equal(
    manager.frontier[0].isFallback,
    true,
    'marks only the containing source page as fallback'
  );
  t.equal(
    manager.stats.fallbackRowCount,
    1,
    'counts the unresolved parent, not the unrelated leaf'
  );
  t.deepEqual(
    requests.map(request => [request.pageIndex, request.parentRowIndex]),
    [[2, 0]],
    'maps global child rows to one deduplicated, stable source-page request'
  );

  manager.registerPage(children);
  manager.update(makeRADView());
  t.deepEqual(
    getFrontierSourceRows(manager.frontier),
    [[1], [4, 5]],
    'removes only the refined parent while preserving its childless sibling and both child rows'
  );
  t.deepEqual(
    Array.from(manager.frontier[0].activeRows),
    [1],
    'keeps page-local source offsets rather than replacing or repacking the mixed parent page'
  );
  t.deepEqual(
    Array.from(manager.frontier[0].activeMask),
    [0, 1],
    'updates only the source-row visibility mask for the original parent page'
  );
  t.equal(manager.frontier[0].data, root.data, 'retains the original mixed parent-page GPU batch');
  t.equal(manager.frontier[1].data, children.data, 'retains the original child-page GPU batch');
  t.deepEqual(
    manager.frontier.map(entry => entry.data.sourceBatchIndex),
    [4, 9],
    'preserves independent source-batch identities for picking and semantic filtering'
  );
  t.deepEqual(
    events,
    [[[0, 1]], [[1], [4, 5]]],
    'notifies renderers only when atomic original-row coverage changes'
  );

  manager.destroy();
  root.data.destroy();
  children.data.destroy();
  t.end();
});

test('SplatRADHierarchyManager pins partial child pages until all replacing rows exist', t => {
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
  t.deepEqual(
    requests.map(request => request.pageIndex),
    [2, 3],
    'requests both globally addressed child source pages'
  );
  t.ok(residency.getChunk('parent')?.pinned, 'pins the active coarse fallback source page');

  manager.registerPage(firstChild);
  manager.update(makeRADView());
  t.deepEqual(
    getFrontierSourceRows(manager.frontier),
    [[0]],
    'keeps the coarse source parent visible until the final child page is ready'
  );
  t.ok(
    residency.getChunk('first-child')?.pinned,
    'protects an already decoded child page from residency thrashing'
  );
  t.deepEqual(manager.requestedRows, [3], 'keeps only the still-missing source child request');

  manager.registerPage(secondChild);
  manager.update(makeRADView());
  t.deepEqual(
    getFrontierSourceRows(manager.frontier),
    [[2], [3]],
    'atomically replaces one parent with its original children across page boundaries'
  );
  t.notOk(residency.getChunk('parent')?.pinned, 'releases the obsolete parent fallback pin');
  t.ok(residency.getChunk('first-child')?.pinned, 'pins the first active child source page');
  t.ok(residency.getChunk('second-child')?.pinned, 'pins the second active child source page');
  t.equal(manager.stats.fallbackRowCount, 0, 'removes fallback coverage after atomic replacement');

  manager.destroy();
  t.notOk(residency.destroyed, 'borrows the externally managed source residency window');
  residency.destroy();
  parent.data.destroy();
  firstChild.data.destroy();
  secondChild.data.destroy();
  t.end();
});

test('SplatRADHierarchyManager sends exact sparse source-page frontiers to the GPU renderer', t => {
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
  t.deepEqual(
    renderer.pages.map(page => Array.from(page.activeRows ?? [])),
    [[0, 1]],
    'passes the parent fallback and childless sibling as original batch-local offsets'
  );
  t.equal(renderer.pages[0].data, parent.data, 'borrows the untouched parent GPU source batch');

  manager.registerPage(child);
  manager.update(makeRADView());
  t.deepEqual(
    renderer.pages.map(page => Array.from(page.activeRows ?? [])),
    [[1], [0]],
    'updates only sparse local source-row indirection during atomic parent replacement'
  );
  t.deepEqual(
    renderer.pages.map(page => [page.data.sourceBatchIndex, page.data.rowIndexBase]),
    [
      [4, 0],
      [11, 5]
    ],
    'preserves stable original page and global source-row picking identities'
  );
  t.equal(
    renderer.pages[0].data.positions.data[0].buffer,
    parent.data.positions.data[0].buffer,
    'keeps the original independently allocated source position buffer'
  );
  t.equal(renderer.compiledGraph, undefined, 'keeps GPU graph compilation lazy during traversal');

  manager.update({
    ...makeRADView(),
    modelViewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -5, 0, 0, 1]
  });
  t.equal(renderer.pages.length, 0, 'detaches every borrowed source when the frontier is empty');
  manager.update(makeRADView());
  t.equal(renderer.pages[0].data, parent.data, 'restores the original mixed source page');
  t.equal(renderer.pages[1].data, child.data, 'restores the original child source page');

  renderer.destroy();
  manager.destroy();
  t.notOk(parent.data.destroyed, 'neither borrowing component destroys parent source data');
  t.notOk(child.data.destroyed, 'neither borrowing component destroys child source data');
  parent.data.destroy();
  child.data.destroy();
  t.end();
});

test('SplatRADHierarchyManager respects active-row budgets and missing-page backpressure', t => {
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
  t.deepEqual(
    getFrontierSourceRows(activeBudget.frontier),
    [[0]],
    'keeps one coarse parent when its child replacement would exceed the active-row budget'
  );
  t.notOk(activeBudget.frontier[0].isFallback, 'does not mislabel an intentional budgeted level');
  t.equal(activeBudget.stats.activeRowCount, 1, 'never exceeds the configured visible-row budget');
  t.deepEqual(requests, [], 'does not request unreachable detail outside the active-row budget');

  activeBudget.destroy();
  parent.data.destroy();
  children.data.destroy();
  t.end();
});

test('SplatRADHierarchyManager budgets only visible rows while retaining authored traversal limits', t => {
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

  t.deepEqual(
    getFrontierSourceRows(manager.frontier),
    [[6, 7]],
    'refines the sole visible child through its next level instead of reserving culled siblings'
  );
  t.equal(manager.stats.activeRowCount, 2, 'accounts for only original visible frontier rows');
  t.equal(manager.stats.culledRowCount, 4, 'still evaluates each authored invisible source child');
  t.equal(
    manager.stats.visibleRowCount + manager.stats.culledRowCount,
    8,
    'continues charging every authored child against the synchronous traversal budget'
  );
  t.equal(manager.stats.fallbackRowCount, 0, 'removes every fully replaced resident parent');
  t.equal(manager.stats.requestedPageCount, 0, 'retains complete resident child-page readiness');
  t.equal(manager.frontier[0].data, grandchildren.data, 'borrows the original finest source page');

  manager.destroy();
  parent.data.destroy();
  children.data.destroy();
  grandchildren.data.destroy();
  t.end();
});

test('SplatRADHierarchyManager retains fallback when protected page budgets deny child admission', t => {
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
  t.ok(manager.registerPage(firstChild), 'admits one child inside the independent page budget');
  manager.update(makeRADView());
  t.notOk(
    manager.registerPage(secondChild),
    'rejects the final child when the protected parent and first sibling exhaust residency'
  );
  t.deepEqual(
    getFrontierSourceRows(manager.frontier),
    [[0]],
    'retains exact parent fallback when atomic child replacement cannot fit'
  );
  t.equal(residency.stats.residentChunkCount, 2, 'never exceeds the independent source-page cap');
  t.ok(residency.getChunk('parent')?.pinned, 'does not evict the original visible parent');
  t.ok(residency.getChunk('first-child')?.pinned, 'does not thrash the completed child sibling');
  t.notOk(secondChild.data.destroyed, 'leaves a rejected caller-owned source page untouched');

  manager.update(makeRADView());
  t.deepEqual(requests, [2, 3], 'does not repeatedly request the unadmittable child source page');
  t.deepEqual(manager.requestedRows, [3], 'keeps one stable pending request for future capacity');

  manager.destroy();
  residency.destroy();
  parent.data.destroy();
  firstChild.data.destroy();
  secondChild.data.destroy();
  t.end();
});

test('SplatRADHierarchyManager culls rows and concentrates detail around camera foveation', t => {
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
  t.deepEqual(
    getFrontierSourceRows(manager.frontier),
    [[1], [2]],
    'refines the centered parent while preserving a coarse peripheral source row'
  );
  t.ok(
    (manager.frontier.find(entry => entry.id === 'children')?.priority ?? 0) >
      (manager.frontier.find(entry => entry.id === 'parents')?.priority ?? 0),
    'prioritizes original source rows near the camera gaze'
  );

  manager.update({
    ...makeRADView(),
    modelViewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -4, 0, 0, 1]
  });
  t.equal(
    manager.frontier.length,
    0,
    'removes source rows outside the conservative camera frustum'
  );
  t.ok(manager.stats.culledRowCount > 0, 'reports conservatively rejected original source rows');
  t.equal(
    manager.residencyManager.stats.pinnedChunkCount,
    0,
    'releases hierarchy-owned page pins when the camera no longer needs them'
  );

  manager.destroy();
  parents.data.destroy();
  children.data.destroy();
  t.end();
});

test('SplatRADHierarchyManager cancels stale page demand and restores evicted parent coverage', t => {
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
  t.deepEqual(requested, [2], 'requests the source page containing a missing global child');
  manager.update({
    ...makeRADView(),
    modelViewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -5, 0, 0, 1]
  });
  t.deepEqual(cancelled, [2], 'cancels the loader-owned page after the camera leaves its parent');
  t.equal(manager.stats.requestedPageCount, 0, 'drops the no-longer-relevant source page demand');

  manager.update(makeRADView());
  manager.registerPage(child);
  manager.update(makeRADView());
  t.deepEqual(getFrontierSourceRows(manager.frontier), [[4]], 'selects the restored child page');
  manager.removePage('child');
  t.deepEqual(
    getFrontierSourceRows(manager.frontier),
    [[0]],
    'restores the original parent row when its refined source child is removed'
  );
  t.ok(manager.frontier[0].isFallback, 'marks the restored parent as replacement fallback');
  t.deepEqual(
    requested,
    [2, 2, 2],
    'requests the page again only after explicit view/eviction changes'
  );

  manager.destroy();
  parent.data.destroy();
  child.data.destroy();
  t.end();
});

test('SplatRADHierarchyManager reuses caller-reserved residency and preserves external pins', async t => {
  const device = new NullDevice({});
  const residency = new SplatResidencyManager({maxResidentChunks: 1});
  const root = makeRADPage(device, {id: 'root', rowIndexBase: 0, positions: [0, 0, 0]});
  const chunk = await residency.load('root', () => root.data, {
    estimatedGpuBytes: root.data.byteLength,
    estimatedSplatCount: root.data.length
  });
  t.ok(chunk, 'reserves and admits the source page before hierarchy registration');
  residency.pin('root');
  const manager = new SplatRADHierarchyManager({residencyManager: residency});

  t.ok(manager.registerPage(root), 'reuses the existing caller-reserved source residency chunk');
  manager.update(makeRADView());
  t.equal(residency.stats.residentChunkCount, 1, 'never duplicates source residency allocations');
  t.equal(manager.frontier[0].data, root.data, 'passes the original prepared batch to rendering');

  manager.destroy();
  t.ok(residency.getChunk('root')?.pinned, 'does not release a pin owned by the source caller');
  t.notOk(residency.destroyed, 'does not destroy the caller-owned source residency manager');
  residency.unpin('root');
  residency.destroy();
  root.data.destroy();
  t.end();
});

test('SplatRADHierarchyManager traverses a large mixed-page global row tree', t => {
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

  t.equal(manager.stats.activeRowCount, 1_024, 'selects exactly the binary tree leaf frontier');
  t.equal(manager.stats.fallbackRowCount, 0, 'never overlays resident ancestors over leaf rows');
  t.equal(manager.stats.requestedPageCount, 0, 'resolves every child through its original page');
  t.deepEqual(
    getFrontierSourceRows(manager.frontier).flat(),
    Array.from({length: 1_024}, (_, rowOffset) => rowOffset + 1_023),
    'retains every global leaf source identity across all independently resident source pages'
  );
  for (const entry of manager.frontier) {
    t.equal(entry.data, manager.getPage(entry.id)?.data, 'borrows the exact original source page');
    t.ok(
      entry.activeRows.every(rowIndex => rowIndex < entry.data.length),
      'keeps all selected source offsets batch-local'
    );
  }

  manager.destroy();
  for (const page of pages) {
    page.data.destroy();
  }
  t.end();
});

test('SplatRADHierarchyManager spends a hard row budget on the highest-priority source branch', t => {
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
  t.deepEqual(
    getFrontierSourceRows(manager.frontier),
    [[0], [4, 5]],
    'refines the later high-value parent instead of exhausting the budget on source order'
  );
  t.equal(manager.stats.activeRowCount, 3, 'honors the hard original-source-row budget');
  t.equal(manager.frontier[0].data, parents.data, 'keeps the original coarse source page');
  t.equal(manager.frontier[1].data, children.data, 'borrows the intact finer source page');

  manager.destroy();
  parents.data.destroy();
  children.data.destroy();
  t.end();
});

test('SplatRADHierarchyManager reproduces Spark authored anisotropic and high-opacity row sizes', t => {
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
  t.ok(
    Math.abs(ordinaryManager.frontier[0].geometricError - 0.2) < 1e-6,
    'derives authored node diameter from twice the average original anisotropic source scale'
  );
  t.ok(
    Math.abs(sparkManager.frontier[0].geometricError - 0.48) < 1e-6,
    'applies Spark nonlinear opacity expansion without decoding the source alpha a second time'
  );
  t.equal(page.data.source.opacities[0], 1.5, 'never modifies the original decoded source alpha');
  t.ok(
    sparkManager.frontier[0].priority > ordinaryManager.frontier[0].priority,
    'increases the request importance of a genuinely expanded coarse LoD parent'
  );

  ordinaryManager.destroy();
  sparkManager.destroy();
  page.data.destroy();
  t.end();
});

test('SplatRADHierarchyManager applies Spark angular center, peripheral, and behind foveation', t => {
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
  t.deepEqual(
    getFrontierSourceRows(manager.frontier),
    [[1, 2], [3]],
    'keeps full detail ahead while retaining coarser peripheral and behind-camera source parents'
  );

  const unfoveatedManager = new SplatRADHierarchyManager({
    pages: [parents, children],
    rootRows: [0, 1, 2],
    maximumScreenSpaceError: 150,
    coneFov0: 180,
    coneFov: 180,
    refinementHysteresis: 0
  });
  unfoveatedManager.update(view);
  t.deepEqual(
    getFrontierSourceRows(unfoveatedManager.frontier),
    [[2], [3, 4]],
    'extends full detail to the peripheral source row while preserving behind-camera foveation'
  );

  manager.destroy();
  unfoveatedManager.destroy();
  parents.data.destroy();
  children.data.destroy();
  t.end();
});

test('SplatRADHierarchyManager stabilizes source-row replacement around the camera threshold', t => {
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
  t.deepEqual(getFrontierSourceRows(manager.frontier), [[0]], 'starts with coarse parent coverage');
  manager.update(view(1.6));
  t.deepEqual(getFrontierSourceRows(manager.frontier), [[1]], 'refines beyond the upper deadband');
  const refinedFrontier = manager.frontier;
  manager.update(view(2.1));
  t.equal(manager.frontier, refinedFrontier, 'keeps the exact original refined page frontier');
  manager.update(view(2.2));
  t.deepEqual(
    getFrontierSourceRows(manager.frontier),
    [[1]],
    'does not churn source pages when the camera hovers inside the deadband'
  );
  manager.update(view(2.6));
  t.deepEqual(getFrontierSourceRows(manager.frontier), [[0]], 'restores coarse coverage below it');
  t.deepEqual(events, [[[0]], [[1]], [[0]]], 'does not signal unnecessary renderer rebuilds');

  manager.destroy();
  parent.data.destroy();
  child.data.destroy();
  t.end();
});

test('SplatRADHierarchyManager bounds synchronous camera traversal without losing parent coverage', t => {
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
  t.ok(
    manager.stats.visibleRowCount + manager.stats.culledRowCount <= 31,
    'caps evaluated source rows before synchronous traversal can monopolize a camera frame'
  );
  t.equal(
    manager.stats.activeRowCount,
    16,
    'retains the coherent partially refined source frontier'
  );
  t.equal(manager.stats.requestedPageCount, 0, 'does not demand children beyond the traversal cap');
  t.equal(manager.frontier[0].data, page.data, 'borrows the original bounded source allocation');
  const originalPositionBuffer = page.data.positions.data[0].buffer;
  manager.setTraversalBudget(63);
  t.equal(manager.stats.activeRowCount, 32, 'expands detail after a settled camera budget update');
  t.ok(
    manager.stats.visibleRowCount + manager.stats.culledRowCount <= 63,
    'invalidates the unchanged-view fast path when the source traversal budget grows'
  );
  t.equal(
    page.data.positions.data[0].buffer,
    originalPositionBuffer,
    'never reallocates or replaces the caller-owned source page while changing detail'
  );

  manager.setTraversalBudget(15);
  t.equal(manager.stats.activeRowCount, 8, 'restores a responsive coarse frontier during motion');
  const movingFrontier = manager.frontier;
  manager.setTraversalBudget(15);
  t.equal(manager.frontier, movingFrontier, 'skips unchanged traversal-budget updates');
  manager.setTraversalBudget();
  t.equal(manager.stats.activeRowCount, 256, 'allows an explicit unlimited settled traversal');
  t.throws(
    () => manager.setTraversalBudget(0),
    /traversal capacity/,
    'rejects invalid dynamic traversal budgets before replacing the active frontier'
  );
  t.throws(
    () => new SplatRADHierarchyManager({maxTraversalRows: 0}),
    /traversal capacity/,
    'rejects an empty synchronous source-row traversal budget'
  );

  manager.destroy();
  page.data.destroy();
  t.end();
});

test('SplatRADHierarchyManager resumes deterministic best-first traversal in bounded slices', t => {
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
  t.ok(manager.hasPendingTraversal, 'keeps the remaining best-first queue after one bounded slice');
  t.ok(
    manager.stats.activeRowCount < 2_048,
    'does not hide a full-tree rebuild in the first slice'
  );
  const originalPositionBuffer = page.data.positions.data[0].buffer;
  let previousEvaluatedRowCount = manager.stats.visibleRowCount + manager.stats.culledRowCount;
  let previousActiveRowCount = manager.stats.activeRowCount;
  let sliceCount = 1;
  while (manager.hasPendingTraversal && sliceCount < 64) {
    manager.continueTraversal(127);
    const evaluatedRowCount = manager.stats.visibleRowCount + manager.stats.culledRowCount;
    t.ok(
      evaluatedRowCount - previousEvaluatedRowCount <= 127,
      'bounds each resumed source-row evaluation slice'
    );
    t.ok(
      manager.stats.activeRowCount >= previousActiveRowCount,
      'publishes a coherent frontier that only gains settled detail'
    );
    previousEvaluatedRowCount = evaluatedRowCount;
    previousActiveRowCount = manager.stats.activeRowCount;
    sliceCount++;
  }

  t.notOk(manager.hasPendingTraversal, 'drains the retained queue without another camera update');
  t.ok(sliceCount > 1, 'requires multiple bounded continuation slices for the large source tree');
  t.equal(manager.stats.activeRowCount, 2_048, 'reaches the full leaf frontier beyond one slice');
  t.deepEqual(
    getFrontierSourceRows(manager.frontier).flat(),
    Array.from({length: 2_048}, (_, rowOffset) => rowOffset + 2_047),
    'matches deterministic source-order leaves after incremental best-first refinement'
  );
  t.equal(
    page.data.positions.data[0].buffer,
    originalPositionBuffer,
    'never repacks or replaces the caller-owned source page while continuing'
  );
  t.throws(
    () => manager.continueTraversal(0),
    /traversal capacity/,
    'rejects an empty continuation slice before changing the settled frontier'
  );

  manager.destroy();
  page.data.destroy();
  t.end();
});

test('SplatRADHierarchyManager skips unchanged camera traversal but detects dynamic source rows', t => {
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
  t.equal(
    manager.frontier,
    originalFrontier,
    'reuses exact source-row frontiers for identical views'
  );

  parent.data.updateRows(0, {scales: new Float32Array([0.2, 0.2, 0.2])});
  manager.update(view);
  t.deepEqual(
    getFrontierSourceRows(manager.frontier),
    [[1]],
    'refreshes the authored source-row frontier after an in-place source GPU revision'
  );

  manager.destroy();
  parent.data.destroy();
  child.data.destroy();
  t.end();
});

test('SplatRADHierarchyManager rejects inconsistent child metadata and overlapping row ranges', t => {
  const device = new NullDevice({});
  const root = makeRADPage(device, {id: 'root', rowIndexBase: 0, positions: [0, 0, 0]});
  const overlap = makeRADPage(device, {id: 'overlap', rowIndexBase: 0, positions: [0, 0, 0]});
  const manager = new SplatRADHierarchyManager({pages: [root]});

  t.throws(
    () => manager.registerPage(overlap),
    /must not overlap/,
    'rejects source pages with ambiguous global source-row identities'
  );
  t.throws(
    () =>
      manager.registerPage({
        ...overlap,
        id: 'invalid-tree',
        childCounts: new Uint16Array([1])
      }),
    /hierarchy arrays/,
    'rejects incomplete source child metadata before modifying residency'
  );
  t.throws(
    () => manager.setRootRows([-1]),
    /hierarchy roots/,
    'rejects global roots outside the stable GPU source-row domain'
  );
  t.throws(
    () => new SplatRADHierarchyManager({pageSize: 0}),
    /page size/,
    'rejects invalid original source-page sizes'
  );
  t.throws(
    () => new SplatRADHierarchyManager({maximumActiveRows: 0}),
    /active-row capacity/,
    'rejects empty source-row visibility budgets'
  );

  manager.destroy();
  t.throws(
    () => manager.update(makeRADView()),
    /destroyed/,
    'rejects camera updates after destroy'
  );
  root.data.destroy();
  overlap.data.destroy();
  t.end();
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
