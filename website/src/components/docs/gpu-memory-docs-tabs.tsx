import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

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
  | 'buffer-schemas'
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
    id: 'buffer-schemas',
    label: 'Buffer Schemas',
    href: '/docs/api-guide/gpu/buffer-schemas'
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
  return (
    <nav className="docs-page-tabs" aria-label="GPU memory documentation sections">
      {GPU_MEMORY_DOCS_TABS.map(tab => (
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
