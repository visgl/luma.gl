import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type TablesDocsTab = {
  /** Stable tab identifier. */
  id: TablesDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** Tables documentation tab identifiers. */
export type TablesDocsTabId =
  | 'overview'
  | 'structure'
  | 'lifecycle'
  | 'table'
  | 'record-batch'
  | 'vector'
  | 'data'
  | 'schema'
  | 'input-schema'
  | 'vector-format'
  | 'buffer-planner';

const TABLES_DOCS_TABS: TablesDocsTab[] = [
  {id: 'overview', label: 'Overview', href: '/docs/api-reference/tables'},
  {id: 'structure', label: 'Structure', href: '/docs/api-reference/tables/gpu-table-structure'},
  {id: 'lifecycle', label: 'Lifecycle', href: '/docs/api-reference/tables/gpu-table-lifecycle'},
  {id: 'table', label: 'GPUTable', href: '/docs/api-reference/tables/gpu-table'},
  {id: 'record-batch', label: 'GPURecordBatch', href: '/docs/api-reference/tables/gpu-record-batch'},
  {id: 'vector', label: 'GPUVector', href: '/docs/api-reference/tables/gpu-vector'},
  {id: 'data', label: 'GPUData', href: '/docs/api-reference/tables/gpu-data'},
  {id: 'schema', label: 'GPUSchema', href: '/docs/api-reference/tables/gpu-schema'},
  {
    id: 'input-schema',
    label: 'GPUInputSchema',
    href: '/docs/api-reference/tables/gpu-input-schema'
  },
  {id: 'vector-format', label: 'GPUVectorFormat', href: '/docs/api-reference/tables/gpu-vector-format'},
  {id: 'buffer-planner', label: 'Buffer Planner', href: '/docs/api-reference/tables/gpu-table-buffer-planner'}
];

/**
 * Renders page links with the same visual treatment as tabs for Tables documentation pages.
 */
export function TablesDocsTabs({active}: {active: TablesDocsTabId}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="Tables documentation sections">
      {TABLES_DOCS_TABS.map(tab => (
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
