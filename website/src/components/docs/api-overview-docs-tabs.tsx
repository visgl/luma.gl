import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type ApiOverviewDocsTab = {
  /** Stable tab identifier. */
  id: ApiOverviewDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** API overview documentation tab identifiers. */
export type ApiOverviewDocsTabId = 'overview' | 'api-design' | 'learning-resources' | 'webgpu-vs-webgl';

const API_OVERVIEW_DOCS_TABS: ApiOverviewDocsTab[] = [
  {id: 'overview', label: 'Overview', href: '/docs/api-guide'},
  {
    id: 'api-design',
    label: 'API Design Philosophy',
    href: '/docs/api-guide/background/api-design'
  },
  {
    id: 'learning-resources',
    label: 'Learning Resources',
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
  return (
    <nav className="docs-page-tabs" aria-label="API overview documentation sections">
      {API_OVERVIEW_DOCS_TABS.map(tab => (
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
