import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type LegacyDocsTab = {
  /** Stable tab identifier. */
  id: LegacyDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** Legacy documentation tab identifiers. */
export type LegacyDocsTabId = 'porting-guide' | 'legacy-upgrade-guide' | 'legacy-whats-new';

const LEGACY_DOCS_TABS: LegacyDocsTab[] = [
  {id: 'porting-guide', label: 'Porting', href: '/docs/legacy/porting-guide'},
  {id: 'legacy-upgrade-guide', label: 'Upgrade', href: '/docs/legacy/legacy-upgrade-guide'},
  {id: 'legacy-whats-new', label: "What's New", href: '/docs/legacy/legacy-whats-new'}
];

/**
 * Renders page links with the same visual treatment as tabs for legacy documentation pages.
 */
export function LegacyDocsTabs({active}: {active: LegacyDocsTabId}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="Legacy documentation sections">
      {LEGACY_DOCS_TABS.map(tab => (
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
