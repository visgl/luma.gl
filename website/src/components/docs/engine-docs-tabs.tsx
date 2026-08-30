import React, {type ReactNode} from 'react';
import {
  FOUNDATION_DOCS_CATALOG,
  type EngineDocsTabGroupId,
  type EngineDocsTabId
} from './foundation-docs-catalog';
import {DocsPageTabs} from './docs-page-tabs';

export type {EngineDocsTabGroupId, EngineDocsTabId} from './foundation-docs-catalog';

/** Focused navigation among the immediate peers of an Engine documentation page. */
export function EngineDocsTabs({
  group,
  active
}: {
  group: EngineDocsTabGroupId;
  active: EngineDocsTabId;
}): ReactNode {
  return <DocsPageTabs active={active} group={FOUNDATION_DOCS_CATALOG.engine[group]} />;
}
