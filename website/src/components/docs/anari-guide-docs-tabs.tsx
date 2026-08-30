import React, {type ReactNode} from 'react';
import {DocsPageTabs} from './docs-page-tabs';
import {ANARI_GUIDE_TABS, type AnariGuideTabId} from './specialized-docs-catalog';

export function AnariGuideDocsTabs({active}: {active: AnariGuideTabId}): ReactNode {
  return <DocsPageTabs active={active} group={{label: 'ANARI guide', tabs: ANARI_GUIDE_TABS}} />;
}
