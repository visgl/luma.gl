import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

export type GPUPrimitivesDocsTabId =
  | 'overview'
  | 'command-graph'
  | 'scan'
  | 'compaction'
  | 'mask'
  | 'visibility-workflow'
  | 'hierarchy-layout'
  | 'graph-traversal'
  | 'ancestor-projection'
  | 'sort'
  | 'fft2d'
  | 'reduction'
  | 'histogram'
  | 'grid-binning'
  | 'grid-aggregation'
  | 'grid-index'
  | 'grid-index-query'
  | 'point-spatial-filter'
  | 'bvh'
  | 'group-aggregation'
  | 'index-picking'
  | 'readback-ring'
  | 'draw-command-buffer';

const TABS: {id: GPUPrimitivesDocsTabId; label: string; href: string}[] = [
  {
    id: 'overview',
    label: 'Guide',
    href: '/docs/api-reference/experimental/gpu-primitives'
  },
  {
    id: 'command-graph',
    label: 'Command Graph',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-command-graph'
  },
  {
    id: 'scan',
    label: 'Scan',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-scan'
  },
  {
    id: 'compaction',
    label: 'Compaction',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-compaction'
  },
  {
    id: 'mask',
    label: 'Masks',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-mask'
  },
  {
    id: 'visibility-workflow',
    label: 'Visibility',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-visibility-workflow'
  },
  {
    id: 'hierarchy-layout',
    label: 'Hierarchy',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-hierarchy-layout'
  },
  {
    id: 'graph-traversal',
    label: 'Traversal',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-graph-traversal'
  },
  {
    id: 'ancestor-projection',
    label: 'Ancestors',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-ancestor-projection'
  },
  {
    id: 'sort',
    label: 'Sort',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-sort'
  },
  {
    id: 'fft2d',
    label: 'FFT 2D',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-fft2d'
  },
  {
    id: 'reduction',
    label: 'Reduction',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-reduction'
  },
  {
    id: 'histogram',
    label: 'Histogram',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-histogram'
  },
  {
    id: 'grid-binning',
    label: 'Grid Binning',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-grid-binning'
  },
  {
    id: 'grid-aggregation',
    label: 'Grid Aggregation',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-grid-aggregation'
  },
  {
    id: 'grid-index',
    label: 'Grid Index',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-grid-index'
  },
  {
    id: 'grid-index-query',
    label: 'Grid Query',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-grid-index-query'
  },
  {
    id: 'point-spatial-filter',
    label: 'Point Filter',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-point-spatial-filter'
  },
  {
    id: 'bvh',
    label: 'BVH',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-bvh'
  },
  {
    id: 'bvh-query',
    label: 'BVH Query',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-bvh-query'
  },
  {
    id: 'spatial-benchmark',
    label: 'Spatial Benchmark',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-spatial-query-benchmark'
  },
  {
    id: 'group-aggregation',
    label: 'Group Aggregation',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-group-aggregation'
  },
  {
    id: 'index-picking',
    label: 'Picking',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-index-picking-target'
  },
  {
    id: 'readback-ring',
    label: 'Readback Ring',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-readback-ring'
  },
  {
    id: 'draw-command-buffer',
    label: 'Indirect Draw',
    href: '/docs/api-reference/experimental/gpu-primitives/draw-command-buffer'
  }
];

export function GPUPrimitivesDocsTabs({active}: {active: GPUPrimitivesDocsTabId}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="GPU primitives documentation sections">
      {TABS.map(tab => (
        <Link
          key={tab.id}
          className={
            tab.id === active
              ? 'docs-page-tabs__tab docs-page-tabs__tab--active'
              : 'docs-page-tabs__tab'
          }
          to={tab.href}
          aria-current={tab.id === active ? 'page' : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
