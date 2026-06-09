import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type ArrowDocsTab = {
  /** Stable tab identifier. */
  id: ArrowDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** Arrow documentation tab identifiers. */
export type ArrowDocsTabId =
  | 'overview'
  | 'arrow-representations'
  | 'conversion'
  | 'supported-types'
  | 'utilities'
  | 'deck-api';

const ARROW_DOCS_TABS: ArrowDocsTab[] = [
  {id: 'overview', label: 'Overview', href: '/docs/api-reference/arrow'},
  {id: 'arrow-representations', label: 'Arrow Representations', href: '/docs/api-reference/arrow/arrow-representations'},
  {id: 'conversion', label: 'Conversion', href: '/docs/api-reference/arrow/arrow-conversion'},
  {id: 'supported-types', label: 'Supported Types', href: '/docs/api-reference/arrow/supported-arrow-types'},
  {id: 'utilities', label: 'Utilities', href: '/docs/api-reference/arrow/arrow-utils'},
  {id: 'deck-api', label: 'deck.gl API', href: '/docs/api-reference/arrow/deck-target-api'}
];

/**
 * Renders page links with the same visual treatment as tabs for Arrow documentation pages.
 */
export function ArrowDocsTabs({active}: {active: ArrowDocsTabId}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="Arrow documentation sections">
      {ARROW_DOCS_TABS.map(tab => (
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
