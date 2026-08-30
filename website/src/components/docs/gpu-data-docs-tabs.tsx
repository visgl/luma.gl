import React, {type ReactNode} from 'react';
import {DocsPageTabs, type DocumentationTabGroup} from './docs-page-tabs';

/** Experimental GPGPU data documentation tab identifiers. */
export type GPUDataDocsTabId =
  | 'constant'
  | 'vector'
  | 'data'
  | 'data-view'
  | 'vector-format';

export const GPU_DATA_DOCS_TAB_GROUPS: DocumentationTabGroup<GPUDataDocsTabId>[] = [
  {
    label: 'GPGPU data',
    tabs: [
      {
        id: 'constant',
        label: 'GPUConstant',
        href: '/docs/api-reference/gpgpu/gpu-constant'
      },
      {
        id: 'vector',
        label: 'GPUVector',
        href: '/docs/api-reference/gpgpu/gpu-vector'
      },
      {id: 'data', label: 'GPUData', href: '/docs/api-reference/gpgpu/gpu-data'},
      {
        id: 'data-view',
        label: 'GPUDataView',
        href: '/docs/api-reference/gpgpu/gpu-data-view'
      },
      {
        id: 'vector-format',
        label: 'GPUVectorFormat',
        href: '/docs/api-reference/gpgpu/gpu-vector-format'
      }
    ]
  }
];

/** Renders links among the experimental GPGPU data reference pages. */
export function GPUDataDocsTabs({active}: {active: GPUDataDocsTabId}): ReactNode {
  const group = GPU_DATA_DOCS_TAB_GROUPS.find(candidate =>
    candidate.tabs.some(tab => tab.id === active)
  );
  return group ? <DocsPageTabs active={active} group={group} /> : null;
}
