import React, {type ReactNode} from 'react';
import {DocsPageTabs, type DocumentationTabGroup} from './docs-page-tabs';

/** Developer documentation tab identifiers. */
export type DeveloperDocsTabId =
  | 'overview'
  | 'installing'
  | 'documentation'
  | 'ai'
  | 'contributing'
  | 'editing'
  | 'testing'
  | 'debugging'
  | 'profiling'
  | 'bundling';

export const DEVELOPER_DOCS_TAB_GROUPS: DocumentationTabGroup<DeveloperDocsTabId>[] = [
  {
    label: 'Developer setup and contribution',
    tabs: [
      {id: 'overview', label: 'Overview', href: '/docs/developer-guide'},
      {id: 'installing', label: 'Installing', href: '/docs/developer-guide/installing'},
      {id: 'editing', label: 'Editing', href: '/docs/developer-guide/editing'},
      {id: 'contributing', label: 'Contributing', href: '/docs/developer-guide/contributing'},
      {id: 'documentation', label: 'Documentation', href: '/docs/developer-guide/documentation'}
    ]
  },
  {
    label: 'Developer quality and delivery',
    tabs: [
      {id: 'testing', label: 'Testing', href: '/docs/developer-guide/testing'},
      {id: 'debugging', label: 'Debugging', href: '/docs/developer-guide/debugging'},
      {id: 'profiling', label: 'Profiling', href: '/docs/developer-guide/profiling'},
      {id: 'bundling', label: 'Bundling', href: '/docs/developer-guide/bundling'},
      {id: 'ai', label: 'AI agents', href: '/docs/developer-guide/working-with-ai'}
    ]
  }
];

/** Renders page links with the same visual treatment as tabs for developer documentation pages. */
export function DeveloperDocsTabs({active}: {active: DeveloperDocsTabId}): ReactNode {
  const group = DEVELOPER_DOCS_TAB_GROUPS.find(candidate =>
    candidate.tabs.some(tab => tab.id === active)
  );
  return group ? <DocsPageTabs active={active} group={group} /> : null;
}
