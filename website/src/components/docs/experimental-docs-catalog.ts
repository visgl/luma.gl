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
