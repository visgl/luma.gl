import React, {type ReactNode} from 'react';
import {
  EXPERIMENTAL_DOCS_TAB_GROUPS,
  type ExperimentalDocsTabId
} from './experimental-docs-catalog';
import {DocsPageTabs} from './docs-page-tabs';

export type {ExperimentalDocsTabId} from './experimental-docs-catalog';

/** Renders only the page links in the active experimental documentation subcategory. */
export function ExperimentalDocsTabs({active}: {active: ExperimentalDocsTabId}): ReactNode {
  const activeGroup = EXPERIMENTAL_DOCS_TAB_GROUPS.find(group =>
    group.tabs.some(tab => tab.id === active)
  );
  if (!activeGroup || activeGroup.tabs.length < 3) {
    return null;
  }
  return (
    <DocsPageTabs
      active={active}
      group={{label: `${activeGroup.label} documentation sections`, tabs: activeGroup.tabs}}
    />
  );
}
