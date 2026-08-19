export type DocsTab<TabId extends string> = {id: TabId; label: string; href: string};

export type DocsTabGroup<TabId extends string> = {
  id: string;
  label: string;
  tabs: readonly DocsTab<TabId>[];
};

/** Documentation identifiers for the high-level experimental modules. */
export type ExperimentalDocsTabId =
  | 'overview'
  | 'scene-renderer'
  | 'deferred-scene-renderer'
  | 'pbr-environment'
  | 'gpu-project'
  | 'geospatial'
  | 'gpu-raster'
  | 'gpu-raster-concepts'
  | 'gpu-raster-operations'
  | 'gpu-graph'
  | 'gpu-graph-operations'
  | 'gpu-graph-topology'
  | 'gpu-graph-traversal'
  | 'gpu-graph-connectivity'
  | 'gpu-graph-metrics'
  | 'gpu-graph-layouts'
  | 'gpu-dataframe'
  | 'gpu-dataframe-operations'
  | 'gpu-dataframe-expressions'
  | 'gpu-dataframe-aggregation'
  | 'gpu-dataframe-sorting'
  | 'gpu-dataframe-indexes-joins'
  | 'gpu-sql'
  | 'gpu-crossfilter'
  | 'gpu-trace'
  | 'gpu-trace-algorithms'
  | 'trace-scene'
  | 'trace-interaction'
  | 'trace-picking'
  | 'trace-temporal-index'
  | 'trace-aggregation'
  | 'trace-critical-path'
  | 'trace-comparison'
  | 'trace-anomaly-scoring'
  | 'g-buffer'
  | 'deferred-lighting'
  | 'clustered-lighting'
  | 'mls-mpm-fluid-simulation'
  | 'spectral-ocean-simulation'
  | 'volumetric-fire-simulation'
  | 'shadow-map-renderer'
  | 'spectral-caustics-renderer'
  | 'glass-material'
  | 'reflective-material'
  | 'a-buffer-renderer'
  | 'wboit-renderer';

/** Documentation identifiers for GPU Core and its operation references. */
export type GPUCoreDocsTabId =
  | 'overview'
  | 'tutorial'
  | 'recipes'
  | 'concepts'
  | 'command-graph'
  | 'texture-history'
  | 'scan'
  | 'galloping-search'
  | 'compaction'
  | 'mask'
  | 'visibility-workflow'
  | 'virtual-geometry'
  | 'hierarchy-layout'
  | 'graph-traversal'
  | 'ancestor-projection'
  | 'sort'
  | 'segmented-sort'
  | 'transpose'
  | 'fft1d'
  | 'fft2d'
  | 'convolution'
  | 'reduction'
  | 'histogram'
  | 'grid-binning'
  | 'grid-aggregation'
  | 'grid-index'
  | 'grid-index-query'
  | 'point-spatial-filter'
  | 'bvh'
  | 'segmented-bvh'
  | 'bvh-query'
  | 'spatial-benchmark'
  | 'scene'
  | 'scene-adapters'
  | 'scene-draw-generation'
  | 'scene-resource-groups'
  | 'group-aggregation'
  | 'hash-index'
  | 'batch-hash-index'
  | 'hash-join'
  | 'batch-hash-join'
  | 'index-picking'
  | 'readback-ring'
  | 'draw-command-buffer';

export const EXPERIMENTAL_DOCS_TAB_GROUPS: readonly DocsTabGroup<ExperimentalDocsTabId>[] = [
  {
    id: 'experimental-overview',
    label: 'Experimental overview',
    tabs: [{id: 'overview', label: 'Overview', href: '/docs/api-reference/experimental'}]
  },
  {
    id: 'scene-rendering',
    label: 'Scene rendering',
    tabs: [
      {id: 'scene-renderer', label: 'Scene Renderer', href: '/docs/api-reference/experimental/scene-renderer'},
      {id: 'deferred-scene-renderer', label: 'Deferred Scenes', href: '/docs/api-reference/experimental/deferred-scene-renderer'},
      {id: 'pbr-environment', label: 'PBR Environments', href: '/docs/api-reference/experimental/pbr-environment'}
    ]
  },
  {
    id: 'gpu-project',
    label: 'GPU Project',
    tabs: [
      {id: 'gpu-project', label: 'Projection', href: '/docs/api-reference/experimental/gpu-project'},
      {id: 'geospatial', label: 'Geospatial Kernels', href: '/docs/api-reference/experimental/geospatial'}
    ]
  },
  {
    id: 'gpu-raster',
    label: 'GPU Raster',
    tabs: [
      {id: 'gpu-raster', label: 'Overview', href: '/docs/api-reference/experimental/gpu-raster'},
      {id: 'gpu-raster-concepts', label: 'Concepts', href: '/docs/api-reference/experimental/gpu-raster/concepts'},
      {id: 'gpu-raster-operations', label: 'Operations', href: '/docs/api-reference/experimental/gpu-raster/operations'}
    ]
  },
  {
    id: 'gpu-graph',
    label: 'GPU Graph',
    tabs: [
      {id: 'gpu-graph', label: 'Overview', href: '/docs/api-reference/experimental/gpu-graph'},
      {id: 'gpu-graph-operations', label: 'Operations', href: '/docs/api-reference/experimental/gpu-graph-operations'},
      {id: 'gpu-graph-topology', label: 'Topology', href: '/docs/api-reference/experimental/gpu-graph-topology'},
      {id: 'gpu-graph-traversal', label: 'Traversal', href: '/docs/api-reference/experimental/gpu-graph-traversal'},
      {id: 'gpu-graph-connectivity', label: 'Connectivity', href: '/docs/api-reference/experimental/gpu-graph-connectivity'},
      {id: 'gpu-graph-metrics', label: 'Metrics', href: '/docs/api-reference/experimental/gpu-graph-metrics'},
      {id: 'gpu-graph-layouts', label: 'Layouts', href: '/docs/api-reference/experimental/gpu-graph-layouts'}
    ]
  },
  {
    id: 'gpu-dataframe',
    label: 'GPU Dataframe',
    tabs: [
      {id: 'gpu-dataframe', label: 'Overview', href: '/docs/api-reference/experimental/gpu-dataframe'},
      {id: 'gpu-dataframe-operations', label: 'Operations', href: '/docs/api-reference/experimental/gpu-dataframe-operations'},
      {id: 'gpu-dataframe-expressions', label: 'Expressions', href: '/docs/api-reference/experimental/gpu-dataframe-expressions'},
      {id: 'gpu-dataframe-aggregation', label: 'Aggregation', href: '/docs/api-reference/experimental/gpu-dataframe-aggregation'},
      {id: 'gpu-dataframe-sorting', label: 'Sorting', href: '/docs/api-reference/experimental/gpu-dataframe-sorting'},
      {id: 'gpu-dataframe-indexes-joins', label: 'Indexes & Joins', href: '/docs/api-reference/experimental/gpu-dataframe-indexes-joins'},
      {id: 'gpu-sql', label: 'SQL', href: '/docs/api-reference/experimental/gpu-sql'}
    ]
  },
  {
    id: 'gpu-crossfilter',
    label: 'GPU Crossfilter',
    tabs: [{id: 'gpu-crossfilter', label: 'Overview', href: '/docs/api-reference/experimental/gpu-crossfilter'}]
  },
  {
    id: 'gpu-trace-scene',
    label: 'GPU Trace scene and interaction',
    tabs: [
      {id: 'gpu-trace', label: 'Overview', href: '/docs/api-reference/experimental/gpu-trace'},
      {id: 'gpu-trace-algorithms', label: 'Algorithms', href: '/docs/api-reference/experimental/gpu-trace-algorithms'},
      {id: 'trace-scene', label: 'Scene', href: '/docs/api-reference/experimental/gpu-trace/scene'},
      {id: 'trace-interaction', label: 'Interaction', href: '/docs/api-reference/experimental/gpu-trace/interaction'},
      {id: 'trace-picking', label: 'Picking', href: '/docs/api-reference/experimental/gpu-trace/picking'}
    ]
  },
  {
    id: 'gpu-trace-analysis',
    label: 'GPU Trace analysis',
    tabs: [
      {id: 'trace-temporal-index', label: 'Time Index', href: '/docs/api-reference/experimental/gpu-trace/temporal-index'},
      {id: 'trace-aggregation', label: 'Aggregation', href: '/docs/api-reference/experimental/gpu-trace/aggregation'},
      {id: 'trace-critical-path', label: 'Critical Path', href: '/docs/api-reference/experimental/gpu-trace/critical-path'},
      {id: 'trace-comparison', label: 'Comparison', href: '/docs/api-reference/experimental/gpu-trace/comparison'},
      {id: 'trace-anomaly-scoring', label: 'Anomalies', href: '/docs/api-reference/experimental/gpu-trace/anomaly-scoring'}
    ]
  },
  {
    id: 'lighting-and-shadows',
    label: 'Lighting and shadows',
    tabs: [
      {id: 'g-buffer', label: 'GBuffer', href: '/docs/api-reference/experimental/g-buffer'},
      {id: 'deferred-lighting', label: 'Deferred Lighting', href: '/docs/api-reference/experimental/deferred-lighting'},
      {id: 'clustered-lighting', label: 'Clustered Lighting', href: '/docs/api-reference/experimental/clustered-lighting'},
      {id: 'shadow-map-renderer', label: 'Shadow Maps', href: '/docs/api-reference/experimental/shadow-map-renderer'}
    ]
  },
  {
    id: 'materials-and-transparency',
    label: 'Materials and transparency',
    tabs: [
      {id: 'spectral-caustics-renderer', label: 'Spectral Caustics', href: '/docs/api-reference/experimental/spectral-caustics-renderer'},
      {id: 'glass-material', label: 'Glass', href: '/docs/api-reference/experimental/glass-material'},
      {id: 'reflective-material', label: 'Reflective', href: '/docs/api-reference/experimental/reflective-material'},
      {id: 'a-buffer-renderer', label: 'A-Buffer', href: '/docs/api-reference/experimental/a-buffer-renderer'},
      {id: 'wboit-renderer', label: 'WBOIT', href: '/docs/api-reference/experimental/wboit-renderer'}
    ]
  },
  {
    id: 'simulation',
    label: 'Simulation',
    tabs: [
      {id: 'mls-mpm-fluid-simulation', label: 'MLS-MPM Fluid', href: '/docs/api-reference/experimental/mls-mpm-fluid-simulation'},
      {id: 'spectral-ocean-simulation', label: 'Spectral Ocean', href: '/docs/api-reference/experimental/spectral-ocean-simulation'},
      {id: 'volumetric-fire-simulation', label: 'Volumetric Fire', href: '/docs/api-reference/experimental/volumetric-fire-simulation'}
    ]
  }
];

const GPU_CORE_DOCS_TABS: Record<GPUCoreDocsTabId, DocsTab<GPUCoreDocsTabId>> = {
  overview: {id: 'overview', label: 'Overview', href: '/docs/api-reference/experimental/gpu-core'},
  tutorial: {id: 'tutorial', label: 'Tutorial', href: '/docs/api-reference/experimental/gpu-core/tutorial'},
  recipes: {id: 'recipes', label: 'Cookbook', href: '/docs/api-reference/experimental/gpu-core/recipes'},
  concepts: {id: 'concepts', label: 'Concepts', href: '/docs/api-reference/experimental/gpu-core/concepts'},
  'command-graph': {id: 'command-graph', label: 'Command Graph', href: '/docs/api-reference/experimental/gpu-core/gpu-command-graph'},
  'texture-history': {id: 'texture-history', label: 'Texture History', href: '/docs/api-reference/experimental/gpu-core/gpu-texture-history'},
  scan: {id: 'scan', label: 'Scan', href: '/docs/api-reference/experimental/gpu-core/gpu-scan'},
  'galloping-search': {id: 'galloping-search', label: 'Galloping Search', href: '/docs/api-reference/experimental/gpu-core/gpu-galloping-search'},
  compaction: {id: 'compaction', label: 'Compaction', href: '/docs/api-reference/experimental/gpu-core/gpu-compaction'},
  mask: {id: 'mask', label: 'Masks', href: '/docs/api-reference/experimental/gpu-core/gpu-mask'},
  'visibility-workflow': {id: 'visibility-workflow', label: 'Visibility', href: '/docs/api-reference/experimental/gpu-core/gpu-visibility-workflow'},
  'virtual-geometry': {id: 'virtual-geometry', label: 'Virtual Geometry', href: '/docs/api-reference/experimental/gpu-core/gpu-virtual-geometry-selection'},
  'hierarchy-layout': {id: 'hierarchy-layout', label: 'Hierarchy', href: '/docs/api-reference/experimental/gpu-core/gpu-hierarchy-layout'},
  'graph-traversal': {id: 'graph-traversal', label: 'Traversal', href: '/docs/api-reference/experimental/gpu-core/gpu-graph-traversal'},
  'ancestor-projection': {id: 'ancestor-projection', label: 'Ancestors', href: '/docs/api-reference/experimental/gpu-core/gpu-ancestor-projection'},
  sort: {id: 'sort', label: 'Sort', href: '/docs/api-reference/experimental/gpu-core/gpu-sort'},
  'segmented-sort': {id: 'segmented-sort', label: 'Segmented Sort', href: '/docs/api-reference/experimental/gpu-core/gpu-segmented-sort'},
  transpose: {id: 'transpose', label: 'Transpose', href: '/docs/api-reference/experimental/gpu-core/gpu-transpose'},
  fft1d: {id: 'fft1d', label: 'FFT 1D', href: '/docs/api-reference/experimental/gpu-core/gpu-fft1d'},
  fft2d: {id: 'fft2d', label: 'FFT 2D', href: '/docs/api-reference/experimental/gpu-core/gpu-fft2d'},
  convolution: {id: 'convolution', label: 'Convolution', href: '/docs/api-reference/experimental/gpu-core/gpu-convolution'},
  reduction: {id: 'reduction', label: 'Reduction', href: '/docs/api-reference/experimental/gpu-core/gpu-reduction'},
  histogram: {id: 'histogram', label: 'Histogram', href: '/docs/api-reference/experimental/gpu-core/gpu-histogram'},
  'group-aggregation': {id: 'group-aggregation', label: 'Group Aggregation', href: '/docs/api-reference/experimental/gpu-core/gpu-group-aggregation'},
  'grid-binning': {id: 'grid-binning', label: 'Grid Binning', href: '/docs/api-reference/experimental/gpu-core/gpu-grid-binning'},
  'grid-aggregation': {id: 'grid-aggregation', label: 'Grid Aggregation', href: '/docs/api-reference/experimental/gpu-core/gpu-grid-aggregation'},
  'grid-index': {id: 'grid-index', label: 'Grid Index', href: '/docs/api-reference/experimental/gpu-core/gpu-grid-index'},
  'grid-index-query': {id: 'grid-index-query', label: 'Grid Query', href: '/docs/api-reference/experimental/gpu-core/gpu-grid-index-query'},
  'point-spatial-filter': {id: 'point-spatial-filter', label: 'Point Filter', href: '/docs/api-reference/experimental/gpu-core/gpu-point-spatial-filter'},
  bvh: {id: 'bvh', label: 'BVH', href: '/docs/api-reference/experimental/gpu-core/gpu-bvh'},
  'segmented-bvh': {id: 'segmented-bvh', label: 'Segmented BVH', href: '/docs/api-reference/experimental/gpu-core/gpu-segmented-bvh'},
  'bvh-query': {id: 'bvh-query', label: 'BVH Query', href: '/docs/api-reference/experimental/gpu-core/gpu-bvh-query'},
  'spatial-benchmark': {id: 'spatial-benchmark', label: 'Spatial Benchmark', href: '/docs/api-reference/experimental/gpu-core/gpu-spatial-query-benchmark'},
  scene: {id: 'scene', label: 'Scene', href: '/docs/api-reference/experimental/gpu-core/gpu-scene'},
  'scene-adapters': {id: 'scene-adapters', label: 'Scene Adapters', href: '/docs/api-reference/experimental/gpu-core/gpu-scene-adapters'},
  'scene-draw-generation': {id: 'scene-draw-generation', label: 'Scene Draws', href: '/docs/api-reference/experimental/gpu-core/gpu-scene-draw-generation'},
  'scene-resource-groups': {id: 'scene-resource-groups', label: 'Scene Groups', href: '/docs/api-reference/experimental/gpu-core/gpu-scene-resource-groups'},
  'index-picking': {id: 'index-picking', label: 'Picking', href: '/docs/api-reference/experimental/gpu-core/gpu-index-picking-target'},
  'hash-index': {id: 'hash-index', label: 'Hash Index', href: '/docs/api-reference/experimental/gpu-core/gpu-hash-index'},
  'batch-hash-index': {id: 'batch-hash-index', label: 'Batch Hash Index', href: '/docs/api-reference/experimental/gpu-core/gpu-batch-hash-index'},
  'hash-join': {id: 'hash-join', label: 'Hash Join', href: '/docs/api-reference/experimental/gpu-core/gpu-hash-join'},
  'batch-hash-join': {id: 'batch-hash-join', label: 'Batch Join', href: '/docs/api-reference/experimental/gpu-core/gpu-batch-hash-join'},
  'readback-ring': {id: 'readback-ring', label: 'Readback Ring', href: '/docs/api-reference/experimental/gpu-core/gpu-readback-ring'},
  'draw-command-buffer': {id: 'draw-command-buffer', label: 'Indirect Draw', href: '/docs/api-reference/experimental/gpu-core/draw-command-buffer'}
};

function getGPUCoreTabs(
  tabIds: readonly GPUCoreDocsTabId[]
): readonly DocsTab<GPUCoreDocsTabId>[] {
  return tabIds.map(tabId => GPU_CORE_DOCS_TABS[tabId]);
}

export const GPU_CORE_DOCS_TAB_GROUPS: readonly DocsTabGroup<GPUCoreDocsTabId>[] = [
  {id: 'learning', label: 'Learn GPU Core', tabs: getGPUCoreTabs(['overview', 'tutorial', 'recipes', 'concepts'])},
  {id: 'graph-execution', label: 'Graph execution', tabs: getGPUCoreTabs(['command-graph', 'texture-history', 'readback-ring', 'draw-command-buffer'])},
  {id: 'selection-and-compaction', label: 'Selection and compaction', tabs: getGPUCoreTabs(['scan', 'galloping-search', 'compaction', 'mask', 'visibility-workflow', 'virtual-geometry'])},
  {id: 'hierarchies-and-traversal', label: 'Hierarchies and traversal', tabs: getGPUCoreTabs(['hierarchy-layout', 'graph-traversal', 'ancestor-projection'])},
  {id: 'sorting-and-transforms', label: 'Sorting and transforms', tabs: getGPUCoreTabs(['sort', 'segmented-sort', 'transpose', 'fft1d', 'fft2d', 'convolution'])},
  {id: 'aggregation', label: 'Aggregation', tabs: getGPUCoreTabs(['reduction', 'histogram', 'group-aggregation'])},
  {id: 'spatial-grids', label: 'Spatial grids', tabs: getGPUCoreTabs(['grid-binning', 'grid-aggregation', 'grid-index', 'grid-index-query', 'point-spatial-filter'])},
  {id: 'spatial-hierarchies', label: 'Spatial hierarchies', tabs: getGPUCoreTabs(['bvh', 'segmented-bvh', 'bvh-query', 'spatial-benchmark'])},
  {id: 'gpu-scenes', label: 'GPU scenes', tabs: getGPUCoreTabs(['scene', 'scene-adapters', 'scene-draw-generation', 'scene-resource-groups', 'index-picking'])},
  {id: 'hash-indexes-and-joins', label: 'Hash indexes and joins', tabs: getGPUCoreTabs(['hash-index', 'batch-hash-index', 'hash-join', 'batch-hash-join'])}
];
