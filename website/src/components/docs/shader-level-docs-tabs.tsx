import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type ShaderLevelDocsTab = {
  /** Stable tab identifier. */
  id: ShaderLevelDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** Shader-Level Programming documentation tab identifiers. */
export type ShaderLevelDocsTabId =
  | 'overview'
  | 'shader-assembly'
  | 'writing-portable-shaders'
  | 'writing-customizable-shaders'
  | 'shader-passes'
  | 'rendering-techniques';

const SHADER_LEVEL_DOCS_TABS: ShaderLevelDocsTab[] = [
  {id: 'overview', label: 'Overview', href: '/docs/api-guide/shaders'},
  {
    id: 'shader-assembly',
    label: 'Shader Assembly',
    href: '/docs/api-guide/shaders/shader-assembly'
  },
  {
    id: 'writing-customizable-shaders',
    label: 'Customizable Shaders',
    href: '/docs/api-guide/shaders/writing-customizable-shaders'
  },
  {
    id: 'writing-portable-shaders',
    label: 'Portable Shaders',
    href: '/docs/api-guide/shaders/writing-portable-shaders'
  },
  {id: 'shader-passes', label: 'Shader Passes', href: '/docs/api-guide/shaders/shader-passes'},
  {
    id: 'rendering-techniques',
    label: 'Rendering Techniques',
    href: '/docs/api-guide/shaders/rendering-techniques'
  }
];

/**
 * Renders page links with the same visual treatment as tabs for Shader-Level Programming pages.
 */
export function ShaderLevelDocsTabs({active}: {active: ShaderLevelDocsTabId}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="Shader-Level Programming documentation sections">
      {SHADER_LEVEL_DOCS_TABS.map(tab => (
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
