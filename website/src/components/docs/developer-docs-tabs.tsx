import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type DeveloperDocsTab = {
  id: DeveloperDocsTabId;
  label: string;
  href: string;
};

/** Developer documentation tab identifiers. */
export type DeveloperDocsTabId =
  | 'overview'
  | 'contributing'
  | 'editing'
  | 'testing'
  | 'debugging'
  | 'profiling'
  | 'bundling';

const DEVELOPER_DOCS_TABS: DeveloperDocsTab[] = [
  {id: 'overview', label: 'Overview', href: '/docs/developer-guide'},
  {id: 'contributing', label: 'Contributing', href: '/docs/developer-guide/contributing'},
  {id: 'editing', label: 'Editing', href: '/docs/developer-guide/editing'},
  {id: 'testing', label: 'Testing', href: '/docs/developer-guide/testing'},
  {id: 'debugging', label: 'Debugging', href: '/docs/developer-guide/debugging'},
  {id: 'profiling', label: 'Profiling', href: '/docs/developer-guide/profiling'},
  {id: 'bundling', label: 'Bundling', href: '/docs/developer-guide/bundling'}
];

/** Renders page links with the same visual treatment as tabs for developer documentation pages. */
export function DeveloperDocsTabs({active}: {active: DeveloperDocsTabId}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="Developer documentation sections">
      {DEVELOPER_DOCS_TABS.map(tab => (
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
