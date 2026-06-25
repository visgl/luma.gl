import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type TestUtilsDocsTab = {id: TestUtilsDocsTabId; label: string; href: string};

/** Test utilities documentation tab identifiers. */
export type TestUtilsDocsTabId = 'overview' | 'snapshot-test-runner';

const TEST_UTILS_DOCS_TABS: TestUtilsDocsTab[] = [
  {id: 'overview', label: 'Overview', href: '/docs/api-reference/test-utils'},
  {
    id: 'snapshot-test-runner',
    label: 'SnapshotTestRunner',
    href: '/docs/api-reference/test-utils/snapshot-test-runner'
  }
];

/** Renders page links with the same visual treatment as tabs for test utilities documentation pages. */
export function TestUtilsDocsTabs({active}: {active: TestUtilsDocsTabId}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="Test utilities documentation sections">
      {TEST_UTILS_DOCS_TABS.map(tab => (
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
