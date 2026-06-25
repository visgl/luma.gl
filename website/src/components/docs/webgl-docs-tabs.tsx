import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type WebGLDocsTab = {id: WebGLDocsTabId; label: string; href: string};

/** WebGL documentation tab identifiers. */
export type WebGLDocsTabId = 'overview' | 'constants';

const WEBGL_DOCS_TABS: WebGLDocsTab[] = [
  {id: 'overview', label: 'Overview', href: '/docs/api-reference/webgl'},
  {id: 'constants', label: 'Constants', href: '/docs/api-reference/webgl/constants'}
];

/** Renders page links with the same visual treatment as tabs for WebGL documentation pages. */
export function WebGLDocsTabs({active}: {active: WebGLDocsTabId}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="WebGL documentation sections">
      {WEBGL_DOCS_TABS.map(tab => (
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
