import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type ExperimentalDocsTab = {id: ExperimentalDocsTabId; label: string; href: string};

/** Experimental documentation tab identifiers. */
export type ExperimentalDocsTabId =
  | 'overview'
  | 'g-buffer'
  | 'deferred-lighting'
  | 'shadow-map-renderer'
  | 'a-buffer-renderer'
  | 'wboit-renderer';

const EXPERIMENTAL_DOCS_TABS: ExperimentalDocsTab[] = [
  {id: 'overview', label: 'Overview', href: '/docs/api-reference/experimental'},
  {id: 'g-buffer', label: 'GBuffer', href: '/docs/api-reference/experimental/g-buffer'},
  {
    id: 'deferred-lighting',
    label: 'Deferred Lighting',
    href: '/docs/api-reference/experimental/deferred-lighting'
  },
  {
    id: 'shadow-map-renderer',
    label: 'ShadowMapRenderer',
    href: '/docs/api-reference/experimental/shadow-map-renderer'
  },
  {
    id: 'a-buffer-renderer',
    label: 'ABufferRenderer',
    href: '/docs/api-reference/experimental/a-buffer-renderer'
  },
  {
    id: 'wboit-renderer',
    label: 'WBOITRenderer',
    href: '/docs/api-reference/experimental/wboit-renderer'
  }
];

/** Renders page links with the same visual treatment as tabs for experimental documentation pages. */
export function ExperimentalDocsTabs({active}: {active: ExperimentalDocsTabId}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="Experimental documentation sections">
      {EXPERIMENTAL_DOCS_TABS.map(tab => (
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
