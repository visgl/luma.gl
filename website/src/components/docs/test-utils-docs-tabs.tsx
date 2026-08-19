import React, {type ReactNode} from 'react';
import {DocsPageTabs} from './docs-page-tabs';

type TestUtilsDocsTab = {id: TestUtilsDocsTabId; label: string; href: string};

/** Test utilities documentation tab identifiers. */
export type TestUtilsDocsTabId = 'overview' | 'snapshot-test-runner' | 'testing-guide';

const TEST_UTILS_DOCS_TABS: TestUtilsDocsTab[] = [
  {id: 'overview', label: 'Overview', href: '/docs/api-reference/test-utils'},
  {
    id: 'snapshot-test-runner',
    label: 'SnapshotTestRunner',
    href: '/docs/api-reference/test-utils/snapshot-test-runner'
  },
  {id: 'testing-guide', label: 'Testing guide', href: '/docs/developer-guide/testing'}
];

/** Renders page links with the same visual treatment as tabs for test utilities documentation pages. */
export function TestUtilsDocsTabs({active}: {active: TestUtilsDocsTabId}): ReactNode {
  return <DocsPageTabs active={active} group={{label: 'Test utilities documentation', tabs: TEST_UTILS_DOCS_TABS}} />;
}
