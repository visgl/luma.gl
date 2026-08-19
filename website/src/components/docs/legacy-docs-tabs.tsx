import React, {type ReactNode} from 'react';
import {DocsPageTabs} from './docs-page-tabs';

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
  return <DocsPageTabs active={active} group={{label: 'Legacy documentation', tabs: LEGACY_DOCS_TABS}} />;
}
