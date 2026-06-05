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
export type ShaderLevelDocsTabId = 'overview' | 'shader-modules' | 'shader-hooks' | 'shader-types';

const SHADER_LEVEL_DOCS_TABS: ShaderLevelDocsTab[] = [
  {id: 'overview', label: 'Overview', href: '/docs/api-guide/shaders'},
  {id: 'shader-modules', label: 'Shader Modules', href: '/docs/api-guide/shaders/shader-modules'},
  {id: 'shader-hooks', label: 'Shader Hooks', href: '/docs/api-guide/shaders/shader-hooks'},
  {id: 'shader-types', label: 'Shader Types', href: '/docs/api-guide/shaders/shader-types'}
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
