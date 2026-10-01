---
title: Gaussian splat streaming and residency
description: Bounded residency, hierarchical paging, and foveated level of detail.
---

import {SplatsDocsTabs} from '@site/src/components/docs/splats-docs-tabs';

# Gaussian splat streaming and residency

<SplatsDocsTabs active="streaming" />

## Scalable residency

`SplatResidencyManager` limits GPU bytes, logical splat rows, or independently retained source
chunks. It preserves each original prepared batch and never repacks or concatenates GPU buffers.

```ts
const residency = new SplatResidencyManager({
  maxGpuBytes: 256 * 1024 * 1024,
  maxResidentSplats: 2_000_000,
  maxResidentChunks: 128,
  onResidencyChange: batches => renderer.setProps({data: batches})
});

residency.add(preparedTile, {id: tile.id, priority: tile.priority});
residency.pin(tile.id);
residency.touch(tile.id);
await residency.load(nextTile.id, () => loadPreparedTile(nextTile), {
  priority: nextTile.priority,
  estimatedGpuBytes: nextTile.gpuByteLength,
  estimatedSplatCount: nextTile.rowCount,
  ownsData: true
});
```

Higher-priority chunks displace lower-priority chunks; equally prioritized chunks use
least-recently-used eviction. Pinned chunks remain resident until explicitly removed. The manager
destroys a batch only when `ownsData` transfers ownership explicitly. Renderer residency callbacks
run before manager-owned evicted buffers are destroyed, allowing borrowing renderers to detach
their batches safely. Supply `estimatedGpuBytes` and `estimatedSplatCount` when loading so eligible
resident chunks are evicted before a new batch allocates GPU memory; without estimates, budgets
bound retained resident allocations but cannot prevent a temporary upload spike.

## Hierarchical paging and foveated level of detail

`SplatHierarchyManager` selects an active frontier from source-owned page metadata. Nodes carry
world-space bounds, geometric approximation error, independent source identities, optional content
URIs, and caller-supplied asynchronous page decoders:

```ts
import {SplatHierarchyManager} from '@luma.gl/splats';

const hierarchy = new SplatHierarchyManager({
  roots: sourceTileRoots,
  residencyBudget: {
    maxGpuBytes: 256 * 1024 * 1024,
    maxResidentSplats: 1_000_000,
    maxResidentChunks: 32
  },
  maximumScreenSpaceError: 8,
  maxConcurrentLoads: 4,
  loadPage: async (node, {signal}) => decodeSourcePage(node.contentUri, {signal}),
  onFrontierChange: batches => graphRenderer.setProps({data: batches})
});

hierarchy.update({
  cameraPosition,
  modelViewProjectionMatrix,
  viewportSize: [width, height],
  foveation: {center: [0.5, 0.5], radius: 0.2, strength: 2}
});

await hierarchy.waitForIdle();
console.log(hierarchy.frontier, hierarchy.stats, hierarchy.residencyManager.stats);
```

Traversal conservatively culls bounding spheres, computes projected screen-space error, and
prioritizes pages near the current gaze position. Replace-refined parents remain visible and
pinned until every visible child is resident; additive refinement retains parent detail. Requests
use bounded decoder concurrency, abort work that leaves the current view, and forward each page's
`estimatedGpuBytes` and `estimatedSplatCount` to pre-upload residency reservations. Source pages,
compressed payloads, worker scheduling, RAD parsing, and 3D Tiles transport remain application-
or loader-owned. Prepared pages remain caller-owned by default; set `node.ownsData: true` when
the hierarchy should destroy an asynchronously decoded page on eviction or shutdown. An externally
supplied residency manager is always borrowed and must be destroyed by its original owner.

### Spark RAD row hierarchies

Spark RAD hierarchy links belong to individual source rows, not whole source pages.
`SplatRADHierarchyManager` preserves this distinction using the original page-local `childCounts`
and source-global `childStarts` arrays:

```ts
import {GPUPagedSplatRenderer, SplatRADHierarchyManager} from '@luma.gl/splats';

const renderer = new GPUPagedSplatRenderer(device, {viewportSize: [width, height]});
const hierarchy = new SplatRADHierarchyManager({
  pageSize: 65_536,
  maximumActiveRows: 1_000_000,
  residencyBudget: {maxResidentSplats: 1_000_000},
  lodSplatScale: 1.5,
  lodRenderScale: 1.5,
  lodOpacity: true,
  coneFov0: 70,
  onFrontierChange: frontier => renderer.setFrontier(frontier),
  onPageRequest: request => scheduleSourcePage(request.rowIndex, request.priority),
  onPageCancel: request => cancelSourcePage(request.rowIndex)
});

hierarchy.registerPage({
  id: 'rad:0',
  data: preparedRootPage,
  childCounts: rootLoaderData.childCounts,
  childStarts: rootLoaderData.childStarts,
  ownsData: true
});

hierarchy.update({
  cameraPosition,
  modelViewProjectionMatrix,
  viewportSize: [width, height],
  foveation: {center: [0.5, 0.5], radius: 0.2, strength: 2}
});
```

Traversal starts at Spark's single authored root row and refines the highest-priority branches.
Authored Gaussian footprint, coarse-node opacity, camera-space angular foveation, and configurable
refinement hysteresis contribute to each node's priority. Camera changes retarget the retained
coherent tree instead of restarting from its roots, so resolved visible detail remains selected
while bounded traversal reprioritizes newly visible branches. Offscreen ancestors are still
traversed when their descendants can contribute to the view. Every unrefined or childless leaf is
retained, and an individual parent is replaced only after all of its selected child rows become
resident. Mixed parent-and-leaf source pages therefore remain correct. Each frontier entry exposes
the intact original `data`, batch-local `activeRows`, `activeMask`, bounds, priority, and fallback
state. Relevant page demand remains active across partial retargets; requests are canceled once
traversal proves they cannot contribute. Protected parents remain visible when the residency budget
cannot admit every required child.

`hierarchy.update(view)` performs synchronous traversal. Use `maxTraversalRows` to bound the
number of evaluated rows and `continueTraversal(maximumRows)` for subsequent slices of the same
retained tree. Publishing a frontier still visits its selected rows; a row budget is not a
wall-clock frame-time guarantee. Changing the configured budget with `setTraversalBudget` resets
traversal, so it is not a per-frame scheduling control.

For progressive worker-driven camera updates, use `hierarchy.refineView(view, maximumRows)`.
It starts from the displayed coherent selection and publishes completed sibling replacements
after each slice, including while a changed view is still refining. It does not merge independent
cuts or draw parents over their descendants. Retargeting walks the retained cut once to update
priorities; `maximumRows` bounds subsequent refinement, not that retargeting pass. Keep this work
off the render thread and coalesce camera inputs to the latest view.

Retargeting may collapse a branch only after its selected descendants are all outside the current
frustum. A parent's Gaussian support is not a conservative bound on its descendants, so checking
the parent alone is not sufficient. Under row pressure, visible complete sibling groups can yield
capacity only to a visible, small-screen-error parent. Page budgets remain hard limits: if retained
visible detail occupies the available pages, new refinement may wait rather than discard that
coverage. `selectView` remains available for callers that want an independent, whole-cut rebalance.

### CPU-only selection and worker ownership

`SplatRADHierarchyManager<TData>` defaults to `GPUSplatData` for existing GPU callers. A worker can
instead provide `TData extends SplatRADHierarchyData`: decoded `source.positions`, `source.scales`,
`source.opacities`, a `revision`, and the allocation/identity/lifecycle fields from
`SplatResidencyData`. No rendering device, color columns, spherical harmonics, or GPU buffers are
required. `SplatResidencyManager<TData>` and its callbacks preserve that exact data type; its byte
budget accounts for the supplied `byteLength` even when the allocation is CPU-only.

The hierarchy does not create workers or serialize pages. The application must acknowledge GPU
admission before allowing CPU metadata to participate in selection, preserve original page/row
identities, and retain the previous rendered pages until a complete coherent replacement is ready.
Transfer copies of `activeRows`, not the hierarchy's own retained arrays. Send the renderer its
latest camera independently of worker progress, and coalesce camera requests rather than queuing
every input event. Eviction of a page unused by the retained traversal does not reset visible detail;
loss of an actual traversal input still requires rebuilding its selection.

Top-level RAD metadata contains source page ranges, but not spatial page bounds. Bounds are
derived conservatively after a page is decoded; missing-page requests use authored global child
row links. Transport, parsing, asynchronous worker bridges, and GPU upload remain application- or
loader-owned. Supply residency estimates before initiating page fetch and preparation when a hard
window must prevent both unnecessary requests and transient GPU overcommit.

## Related pages

- [Gaussian splats overview](/docs/api-reference/splats)
- [Gaussian splat showcase](/examples/showcase/gaussian-splats)
- [GPU Core](/docs/api-reference/experimental/gpu-core)
