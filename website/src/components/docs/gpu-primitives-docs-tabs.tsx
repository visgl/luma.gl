import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

export type GPUPrimitivesDocsTabId =
  | 'overview'
  | 'command-graph'
  | 'scan'
  | 'compaction'
  | 'sort'
  | 'reduction'
  | 'histogram'
  | 'grid-binning'
  | 'index-picking'
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
    id: 'sort',
    label: 'Sort',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-sort'
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
    id: 'index-picking',
    label: 'Picking',
    href: '/docs/api-reference/experimental/gpu-primitives/gpu-index-picking-target'
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
