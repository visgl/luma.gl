import React, {type ReactNode} from 'react';
import {
  GPU_CORE_DOCS_TAB_GROUPS,
  type GPUCoreDocsTabId
} from './experimental-docs-catalog';
import {DocsPageTabs} from './docs-page-tabs';

export type {GPUCoreDocsTabId} from './experimental-docs-catalog';

/** Renders the operation-family links containing the active GPU Core documentation page. */
export function GPUCoreDocsTabs({active}: {active: GPUCoreDocsTabId}): ReactNode {
  const activeGroup = GPU_CORE_DOCS_TAB_GROUPS.find(group =>
    group.tabs.some(tab => tab.id === active)
  );
  if (!activeGroup) {
    return null;
  }

  return (
    <DocsPageTabs
      active={active}
      group={{label: `${activeGroup.label} · GPU Core`, tabs: activeGroup.tabs}}
    />
  );
}
