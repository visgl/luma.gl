import React, {type ReactNode} from 'react';
import {DocsPageTabs} from './docs-page-tabs';

type GpuMemoryDocsTab = {
  /** Stable tab identifier. */
  id: GpuMemoryDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** GPU memory documentation tab identifiers. */
export type GpuMemoryDocsTabId =
  | 'gpu-memory'
  | 'gpu-buffers'
  | 'gpu-memory-layouts'
  | 'gpu-storage-buffers';

const GPU_MEMORY_DOCS_TABS: GpuMemoryDocsTab[] = [
  {id: 'gpu-memory', label: 'GPU Memory', href: '/docs/api-guide/gpu/gpu-memory'},
  {id: 'gpu-buffers', label: 'GPU Buffers', href: '/docs/api-guide/gpu/gpu-buffers'},
  {
    id: 'gpu-memory-layouts',
    label: 'Memory Layouts',
    href: '/docs/api-guide/gpu/gpu-memory-layouts'
  },
  {
    id: 'gpu-storage-buffers',
    label: 'Storage Buffers',
    href: '/docs/api-guide/gpu/gpu-storage-buffers'
  }
];

/**
 * Renders page links with the same visual treatment as tabs for GPU memory guide pages.
 */
export function GpuMemoryDocsTabs({active}: {active: GpuMemoryDocsTabId}): ReactNode {
  return <DocsPageTabs active={active} group={{label: 'GPU memory documentation', tabs: GPU_MEMORY_DOCS_TABS}} />;
}
