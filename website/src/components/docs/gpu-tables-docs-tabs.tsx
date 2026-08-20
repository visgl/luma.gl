import React, {type ReactNode} from 'react';
import {DocsPageTabs, type DocumentationTabGroup} from './docs-page-tabs';

/** Experimental GPU tables documentation tab identifiers. */
export type GPUTablesDocsTabId =
  | 'overview'
  | 'structure'
  | 'lifecycle'
  | 'table'
  | 'record-batch'
  | 'schema'
  | 'input-schema'
  | 'shader-bindings'
  | 'buffer-planner';

export const GPU_TABLES_DOCS_TAB_GROUPS: DocumentationTabGroup<GPUTablesDocsTabId>[] = [
  {
    label: 'Experimental GPU tables',
    tabs: [
      {id: 'overview', label: 'Overview', href: '/docs/api-reference/experimental/gpu-tables'},
      {
        id: 'structure',
        label: 'Structure',
        href: '/docs/api-reference/experimental/gpu-tables/gpu-table-structure'
      },
      {
        id: 'lifecycle',
        label: 'Lifecycle',
        href: '/docs/api-reference/experimental/gpu-tables/gpu-table-lifecycle'
      }
    ]
  },
  {
    label: 'GPU table data objects',
    tabs: [
      {
        id: 'table',
        label: 'GPUTable',
        href: '/docs/api-reference/experimental/gpu-tables/gpu-table'
      },
      {
        id: 'record-batch',
        label: 'GPURecordBatch',
        href: '/docs/api-reference/experimental/gpu-tables/gpu-record-batch'
      }
    ]
  },
  {
    label: 'GPU table schemas and bindings',
    tabs: [
      {
        id: 'schema',
        label: 'GPUSchema',
        href: '/docs/api-reference/experimental/gpu-tables/gpu-schema'
      },
      {
        id: 'input-schema',
        label: 'GPUInputSchema',
        href: '/docs/api-reference/experimental/gpu-tables/gpu-input-schema'
      },
      {
        id: 'shader-bindings',
        label: 'Shader bindings',
        href: '/docs/api-reference/experimental/gpu-tables/gpu-table-shader-bindings'
      },
      {
        id: 'buffer-planner',
        label: 'Buffer planner',
        href: '/docs/api-reference/experimental/gpu-tables/gpu-table-buffer-planner'
      }
    ]
  }
];

/** Renders links among the experimental GPU table reference pages. */
export function GPUTablesDocsTabs({active}: {active: GPUTablesDocsTabId}): ReactNode {
  const group = GPU_TABLES_DOCS_TAB_GROUPS.find(candidate =>
    candidate.tabs.some(tab => tab.id === active)
  );
  return group ? <DocsPageTabs active={active} group={group} /> : null;
}
