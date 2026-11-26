import React, {type ReactNode} from 'react';
import {
  FOUNDATION_DOCS_CATALOG,
  type ShadersDocsTabGroupId,
  type ShadersDocsTabId
} from './foundation-docs-catalog';
import {DocsPageTabs} from './docs-page-tabs';

export type {ShadersDocsTabGroupId, ShadersDocsTabId} from './foundation-docs-catalog';

/** Focused navigation among the immediate peers of a Shaders documentation page. */
export function ShadersDocsTabs({
  active,
  group = 'authoring'
}: {
  active: ShadersDocsTabId;
  group?: ShadersDocsTabGroupId;
}): ReactNode {
  return <DocsPageTabs active={active} group={FOUNDATION_DOCS_CATALOG.shaders[group]} />;
}
