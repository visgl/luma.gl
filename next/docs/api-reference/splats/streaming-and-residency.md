# Gaussian splat streaming and residency

[Overview](https://luma.gl/next/docs/api-reference/splats.md)[Renderers](https://luma.gl/next/docs/api-reference/splats/renderers.md)[Data & shading](https://luma.gl/next/docs/api-reference/splats/data-and-shading.md)[Streaming](https://luma.gl/next/docs/api-reference/splats/streaming-and-residency.md)[Picking & scenes](https://luma.gl/next/docs/api-reference/splats/picking-and-scenes.md)[Formats & loaders](https://luma.gl/next/docs/api-reference/splats/formats-and-loaders.md)

## Scalable residency[​](#scalable-residency "Direct link to Scalable residency")

`SplatResidencyManager` limits GPU bytes, logical splat rows, or independently retained source chunks. It preserves each original prepared batch and never repacks or concatenates GPU buffers.

```
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

Higher-priority chunks displace lower-priority chunks; equally prioritized chunks use least-recently-used eviction. Pinned chunks remain resident until explicitly removed. The manager destroys a batch only when `ownsData` transfers ownership explicitly. Renderer residency callbacks run before manager-owned evicted buffers are destroyed, allowing borrowing renderers to detach their batches safely. Supply `estimatedGpuBytes` and `estimatedSplatCount` when loading so eligible resident chunks are evicted before a new batch allocates GPU memory; without estimates, budgets bound retained resident allocations but cannot prevent a temporary upload spike.

## Hierarchical paging and foveated level of detail[​](#hierarchical-paging-and-foveated-level-of-detail "Direct link to Hierarchical paging and foveated level of detail")

`SplatHierarchyManager` selects an active frontier from source-owned page metadata. Nodes carry world-space bounds, geometric approximation error, independent source identities, optional content URIs, and caller-supplied asynchronous page decoders:

```
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

Traversal conservatively culls bounding spheres, computes projected screen-space error, and prioritizes pages near the current gaze position. Replace-refined parents remain visible and pinned until every visible child is resident; additive refinement retains parent detail. Requests use bounded decoder concurrency, abort work that leaves the current view, and forward each page's `estimatedGpuBytes` and `estimatedSplatCount` to pre-upload residency reservations. Source pages, compressed payloads, worker scheduling, RAD parsing, and 3D Tiles transport remain application- or loader-owned. Prepared pages remain caller-owned by default; set `node.ownsData: true` when the hierarchy should destroy an asynchronously decoded page on eviction or shutdown. An externally supplied residency manager is always borrowed and must be destroyed by its original owner.

### Spark RAD row hierarchies[​](#spark-rad-row-hierarchies "Direct link to Spark RAD row hierarchies")

Spark RAD hierarchy links belong to individual source rows, not whole source pages. `SplatRADHierarchyManager` preserves this distinction using the original page-local `childCounts` and source-global `childStarts` arrays:

```
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

Traversal starts at Spark's single authored root row and refines the highest-priority visible nodes first. Authored Gaussian footprint, coarse-node opacity, camera-space angular foveation, and configurable refinement hysteresis contribute to each node's priority. Every unrefined or childless leaf is retained, and an individual parent is replaced only after all of its selected child rows become resident. Mixed parent-and-leaf source pages therefore remain correct. Each frontier entry exposes the intact original `data`, batch-local `activeRows`, `activeMask`, bounds, priority, and fallback state. Camera frustum changes cancel obsolete page requests, and protected parents remain visible when the residency budget cannot admit every required child.

Call `hierarchy.setTraversalBudget(maximumRows)` to switch between a small interactive traversal window and a more detailed settled view without reallocating resident source pages. Browser traversal remains synchronous JavaScript; the showcase debounces its detailed pass so active camera movement does not repeatedly walk the entire authored scene.

Top-level RAD metadata contains source page ranges, but not spatial page bounds. Bounds are derived conservatively after a page is decoded; missing-page requests use authored global child row links. Transport, parsing, asynchronous worker bridges, and GPU upload remain application- or loader-owned. Supply residency estimates before initiating page fetch and preparation when a hard window must prevent both unnecessary requests and transient GPU overcommit.

## Related pages[​](#related-pages "Direct link to Related pages")

* [Gaussian splats overview](https://luma.gl/next/docs/api-reference/splats.md)
* [Gaussian splat showcase](https://luma.gl/next/examples/showcase/gaussian-splats)
* [GPU Core](https://luma.gl/next/docs/api-reference/experimental/gpu-core.md)
