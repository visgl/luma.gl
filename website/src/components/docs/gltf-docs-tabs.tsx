import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type GltfDocsTab = {id: GltfDocsTabId; label: string; href: string};

/** glTF documentation tab identifiers. */
export type GltfDocsTabId = 'overview' | 'extensions';

const GLTF_DOCS_TABS: GltfDocsTab[] = [
  {id: 'overview', label: 'Overview', href: '/docs/api-reference/gltf'},
  {id: 'extensions', label: 'Extensions', href: '/docs/api-reference/gltf/gltf-extensions'}
];

/** Renders page links with the same visual treatment as tabs for glTF documentation pages. */
export function GltfDocsTabs({active}: {active: GltfDocsTabId}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="glTF documentation sections">
      {GLTF_DOCS_TABS.map(tab => (
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
