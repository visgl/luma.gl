import React, {type ReactNode} from 'react';
import {FOUNDATION_DOCS_CATALOG} from './foundation-docs-catalog';
import {DocsPageTabs} from './docs-page-tabs';

export type GpuGuideDocsTabId =
  | 'core-guide' | 'initialization' | 'resources' | 'data-processing'
  | 'rendering' | 'antialiasing' | 'parameters' | 'bindings' | 'attributes'
  | 'uniforms' | 'textures' | 'video-textures' | 'tabular-data';
export type GpuGuideDocsTabGroupId = 'lifecycle' | 'rendering' | 'shader-data';

const GPU_GUIDE_GROUPS = {
  lifecycle: 'guide-lifecycle',
  rendering: 'guide-rendering',
  'shader-data': 'guide-shader-data'
} as const;

export function GpuGuideDocsTabs({group, active}: {group: GpuGuideDocsTabGroupId; active: GpuGuideDocsTabId}): ReactNode {
  const tabGroup = FOUNDATION_DOCS_CATALOG.core[GPU_GUIDE_GROUPS[group]];
  return <DocsPageTabs active={active} group={tabGroup} />;
}
