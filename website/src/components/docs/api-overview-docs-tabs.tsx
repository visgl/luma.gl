import React, {type ReactNode} from 'react';
import {DocsPageTabs} from './docs-page-tabs';

type ApiOverviewDocsTab = {
  /** Stable tab identifier. */
  id: ApiOverviewDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** API overview documentation tab identifiers. */
export type ApiOverviewDocsTabId =
  | 'overview'
  | 'layers'
  | 'api-design'
  | 'learning-resources'
  | 'webgpu-vs-webgl';

const API_OVERVIEW_DOCS_TABS: ApiOverviewDocsTab[] = [
  {id: 'overview', label: 'Choose a layer', href: '/docs/api-guide'},
  {id: 'layers', label: 'How layers fit', href: '/docs/api-guide/luma-layers'},
  {
    id: 'api-design',
    label: 'Design philosophy',
    href: '/docs/api-guide/background/api-design'
  },
  {
    id: 'learning-resources',
    label: 'Learning resources',
    href: '/docs/api-guide/background/learning-resources'
  },
  {
    id: 'webgpu-vs-webgl',
    label: 'WebGPU vs WebGL',
    href: '/docs/api-guide/background/webgpu-vs-webgl'
  }
];

/**
 * Renders page links with the same visual treatment as tabs for API overview documentation pages.
 */
export function ApiOverviewDocsTabs({active}: {active: ApiOverviewDocsTabId}): ReactNode {
  return <DocsPageTabs active={active} group={{label: 'API overview', tabs: API_OVERVIEW_DOCS_TABS}} />;
}
