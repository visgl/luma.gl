import React, {type ReactNode} from 'react';
import {DocsPageTabs} from './docs-page-tabs';

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
  return <DocsPageTabs active={active} group={{label: 'Arrow documentation', tabs: ARROW_DOCS_TABS}} />;
}
