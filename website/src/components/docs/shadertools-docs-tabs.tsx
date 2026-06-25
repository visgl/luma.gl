import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type ShadertoolsDocsTab = {
  /** Stable tab identifier. */
  id: ShadertoolsDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** Shadertools documentation tab identifiers. */
export type ShadertoolsDocsTabId =
  | 'overview'
  | 'shader-module'
  | 'shader-plugin'
  | 'shader-pass'
  | 'shader-assembler'
  | 'shader-info'
  | 'wgsl-support'
  | 'shader-conventions';

const SHADERTOOLS_DOCS_TABS: ShadertoolsDocsTab[] = [
  {id: 'overview', label: 'Overview', href: '/docs/api-reference/shadertools'},
  {
    id: 'shader-module',
    label: 'ShaderModule',
    href: '/docs/api-reference/shadertools/shader-module'
  },
  {
    id: 'shader-plugin',
    label: 'ShaderPlugin',
    href: '/docs/api-reference/shadertools/shader-plugin'
  },
  {
    id: 'shader-pass',
    label: 'ShaderPass',
    href: '/docs/api-reference/shadertools/shader-pass'
  },
  {
    id: 'shader-assembler',
    label: 'ShaderAssembler',
    href: '/docs/api-reference/shadertools/shader-assembler'
  },
  {
    id: 'shader-info',
    label: 'Shader Parsing',
    href: '/docs/api-reference/shadertools/shader-info'
  },
  {
    id: 'wgsl-support',
    label: 'WGSL',
    href: '/docs/api-reference/shadertools/wgsl-support'
  },
  {
    id: 'shader-conventions',
    label: 'Conventions',
    href: '/docs/api-reference/shadertools/shader-conventions'
  }
];

/**
 * Renders page links with the same visual treatment as tabs for Shadertools documentation pages.
 */
export function ShadertoolsDocsTabs({active}: {active: ShadertoolsDocsTabId}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="Shadertools documentation sections">
      {SHADERTOOLS_DOCS_TABS.map(tab => (
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
