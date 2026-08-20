import React, {type ReactNode} from 'react';
import {DocsPageTabs, type DocumentationTabGroup} from './docs-page-tabs';

/** Tables documentation tab identifiers. */
export type TablesDocsTabId =
  | 'overview'
  | 'structure'
  | 'lifecycle'
  | 'table'
  | 'constant'
  | 'record-batch'
  | 'vector'
  | 'data'
  | 'data-view'
  | 'schema'
  | 'input-schema'
  | 'shader-bindings'
  | 'vector-format'
  | 'buffer-planner';

export const TABLES_DOCS_TAB_GROUPS: DocumentationTabGroup<TablesDocsTabId>[] = [
  {
    label: 'GPU table starting points',
    tabs: [
      {id: 'overview', label: 'Overview', href: '/docs/api-reference/tables'},
      {id: 'structure', label: 'Structure', href: '/docs/api-reference/tables/gpu-table-structure'},
      {id: 'lifecycle', label: 'Lifecycle', href: '/docs/api-reference/tables/gpu-table-lifecycle'}
    ]
  },
  {
    label: 'GPU table data objects',
    tabs: [
      {id: 'table', label: 'GPUTable', href: '/docs/api-reference/tables/gpu-table'},
      {id: 'constant', label: 'GPUConstant', href: '/docs/api-reference/tables/gpu-constant'},
      {id: 'record-batch', label: 'GPURecordBatch', href: '/docs/api-reference/tables/gpu-record-batch'},
      {id: 'vector', label: 'GPUVector', href: '/docs/api-reference/tables/gpu-vector'},
      {id: 'data', label: 'GPUData', href: '/docs/api-reference/tables/gpu-data'},
      {id: 'data-view', label: 'GPUDataView', href: '/docs/api-reference/tables/gpu-data-view'}
    ]
  },
  {
    label: 'GPU table schemas and bindings',
    tabs: [
      {id: 'schema', label: 'GPUSchema', href: '/docs/api-reference/tables/gpu-schema'},
      {id: 'input-schema', label: 'GPUInputSchema', href: '/docs/api-reference/tables/gpu-input-schema'},
      {id: 'shader-bindings', label: 'Shader bindings', href: '/docs/api-reference/tables/gpu-table-shader-bindings'},
      {id: 'vector-format', label: 'GPUVectorFormat', href: '/docs/api-reference/tables/gpu-vector-format'},
      {id: 'buffer-planner', label: 'Buffer planner', href: '/docs/api-reference/tables/gpu-table-buffer-planner'}
    ]
  }
];

/**
 * Renders page links with the same visual treatment as tabs for Tables documentation pages.
 */
export function TablesDocsTabs({active}: {active: TablesDocsTabId}): ReactNode {
  const group = TABLES_DOCS_TAB_GROUPS.find(candidate =>
    candidate.tabs.some(tab => tab.id === active)
  );
  return group ? <DocsPageTabs active={active} group={group} /> : null;
}
