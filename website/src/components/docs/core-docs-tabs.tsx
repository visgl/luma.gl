import React, {type ReactNode} from 'react';
import {
  FOUNDATION_DOCS_CATALOG,
  type CoreDocsTabGroupId,
  type CoreDocsTabId
} from './foundation-docs-catalog';
import {DocsPageTabs} from './docs-page-tabs';

export type {CoreDocsTabGroupId, CoreDocsTabId} from './foundation-docs-catalog';

/** Focused navigation among the immediate peers of a Core documentation page. */
export function CoreDocsTabs({
  group,
  active
}: {
  group: CoreDocsTabGroupId;
  active: CoreDocsTabId;
}): ReactNode {
  return <DocsPageTabs active={active} group={FOUNDATION_DOCS_CATALOG.core[group]} />;
}
