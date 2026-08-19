import React, {type ReactNode} from 'react';
import {DocsPageTabs} from './docs-page-tabs';
import {SPLATS_DOCS_TABS, type SplatsDocsTabId} from './specialized-docs-catalog';

export function SplatsDocsTabs({active}: {active: SplatsDocsTabId}): ReactNode {
  return <DocsPageTabs active={active} group={{label: 'Gaussian splat documentation', tabs: SPLATS_DOCS_TABS}} />;
}
