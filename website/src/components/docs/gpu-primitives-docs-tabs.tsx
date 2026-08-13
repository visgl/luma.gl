import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

export type GPUPrimitivesDocsTabId =
  | 'overview'
  | 'command-graph'
  | 'texture-history'
  | 'scan'
  | 'compaction'
  | 'mask'
  | 'visibility-workflow'
  | 'virtual-geometry'
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
  | 'bvh-query'
  | 'spatial-benchmark'
  | 'scene'
  | 'scene-adapters'
  | 'scene-draw-generation'
  | 'scene-resource-groups'
  | 'trace-scene'
  | 'trace-interaction'
  | 'trace-picking'
  | 'group-aggregation'
  | 'hash-index'
  | 'batch-hash-index'
  | 'hash-join'
  | 'batch-hash-join'
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
    id: 'texture-history',
    label: 'Texture History',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-texture-history'
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
    id: 'virtual-geometry',
    label: 'Virtual Geometry',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-virtual-geometry-selection'
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
    id: 'scene',
    label: 'Scene',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-scene'
  },
  {
    id: 'scene-adapters',
    label: 'Scene Adapters',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-scene-adapters'
  },
  {
    id: 'scene-draw-generation',
    label: 'Scene Draws',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-scene-draw-generation'
  },
  {
    id: 'scene-resource-groups',
    label: 'Scene Groups',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-scene-resource-groups'
  },
  {
    id: 'trace-scene',
    label: 'Trace Scene',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-trace-scene'
  },
  {
    id: 'trace-interaction',
    label: 'Trace Interaction',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-trace-interaction'
  },
  {
    id: 'trace-picking',
    label: 'Trace Picking',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-trace-picking'
  },
  {
    id: 'group-aggregation',
    label: 'Group Aggregation',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-group-aggregation'
  },
  {
    id: 'hash-index',
    label: 'Hash Index',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-hash-index'
  },
  {
    id: 'batch-hash-index',
    label: 'Batch Hash Index',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-index'
  },
  {
    id: 'hash-join',
    label: 'Hash Join',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-hash-join'
  },
  {
    id: 'batch-hash-join',
    label: 'Batch Join',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-batch-hash-join'
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

type GPUPrimitivesDocsTabGroup = {
  id: string;
  label: string;
  tabIds: GPUPrimitivesDocsTabId[];
};

const TAB_GROUPS: GPUPrimitivesDocsTabGroup[] = [
  {
    id: 'foundation',
    label: 'Foundation',
    tabIds: ['overview', 'command-graph', 'texture-history', 'readback-ring']
  },
  {
    id: 'transforms',
    label: 'Operations',
    tabIds: ['scan', 'compaction', 'mask', 'sort', 'fft2d', 'reduction', 'histogram']
  },
  {
    id: 'tables',
    label: 'Tables & joins',
    tabIds: ['group-aggregation', 'hash-index', 'batch-hash-index', 'hash-join', 'batch-hash-join']
  },
  {
    id: 'graphs',
    label: 'Graphs',
    tabIds: [
      'visibility-workflow',
      'virtual-geometry',
      'hierarchy-layout',
      'graph-traversal',
      'ancestor-projection'
    ]
  },
  {
    id: 'spatial',
    label: 'Spatial',
    tabIds: [
      'grid-binning',
      'grid-aggregation',
      'grid-index',
      'grid-index-query',
      'point-spatial-filter',
      'bvh',
      'bvh-query',
      'spatial-benchmark'
    ]
  },
  {
    id: 'rendering',
    label: 'Rendering',
    tabIds: [
      'scene',
      'scene-adapters',
      'scene-draw-generation',
      'scene-resource-groups',
      'trace-scene',
      'trace-interaction',
      'trace-picking',
      'index-picking',
      'draw-command-buffer'
    ]
  }
];

export function GPUPrimitivesDocsTabs({active}: {active: GPUPrimitivesDocsTabId}): ReactNode {
  const activeGroup = TAB_GROUPS.find(group => group.tabIds.includes(active))!;
  const activeGroupTabs = activeGroup.tabIds.map(tabId => TABS.find(tab => tab.id === tabId)!);

  return (
    <div className="gpu-primitives-docs-navigation">
      <nav
        className="docs-page-tabs gpu-primitives-docs-navigation__groups"
        aria-label="GPU primitive categories"
      >
        {TAB_GROUPS.map(group => {
          const firstTab = TABS.find(tab => tab.id === group.tabIds[0])!;
          return (
            <Link
              key={group.id}
              className={
                group.id === activeGroup.id
                  ? 'docs-page-tabs__tab docs-page-tabs__tab--active'
                  : 'docs-page-tabs__tab'
              }
              to={firstTab.href}
              aria-current={group.id === activeGroup.id ? 'location' : undefined}
            >
              {group.label}
            </Link>
          );
        })}
      </nav>
      <nav
        className="docs-page-tabs gpu-primitives-docs-navigation__operations"
        aria-label={`${activeGroup.label} GPU primitives`}
      >
        {activeGroupTabs.map(tab => (
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
    </div>
  );
}
