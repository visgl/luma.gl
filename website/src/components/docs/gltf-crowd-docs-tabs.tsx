import React, {type ReactNode} from 'react';
import {DocsPageTabs} from './docs-page-tabs';
import {GLTF_CROWD_DOCS_TABS, type GltfCrowdDocsTabId} from './specialized-docs-catalog';

export function GltfCrowdDocsTabs({active}: {active: GltfCrowdDocsTabId}): ReactNode {
  return <DocsPageTabs active={active} group={{label: 'GPU-animated crowd documentation', tabs: GLTF_CROWD_DOCS_TABS}} />;
}
