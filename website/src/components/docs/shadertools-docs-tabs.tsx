import React, {type ReactNode} from 'react';
import {
  FOUNDATION_DOCS_CATALOG,
  type ShadertoolsDocsTabGroupId,
  type ShadertoolsDocsTabId
} from './foundation-docs-catalog';
import {DocsPageTabs} from './docs-page-tabs';

export type {ShadertoolsDocsTabGroupId, ShadertoolsDocsTabId} from './foundation-docs-catalog';

/** Focused navigation among the immediate peers of a Shadertools documentation page. */
export function ShadertoolsDocsTabs({
  active,
  group = 'authoring'
}: {
  active: ShadertoolsDocsTabId;
  group?: ShadertoolsDocsTabGroupId;
}): ReactNode {
  return <DocsPageTabs active={active} group={FOUNDATION_DOCS_CATALOG.shadertools[group]} />;
}
