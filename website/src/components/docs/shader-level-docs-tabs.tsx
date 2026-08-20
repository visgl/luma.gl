import React, {type ReactNode} from 'react';
import {FOUNDATION_DOCS_CATALOG} from './foundation-docs-catalog';
import {DocsPageTabs} from './docs-page-tabs';

export type ShaderLevelDocsTabId = 'shader-assembly' | 'writing-portable-shaders' | 'writing-customizable-shaders' | 'gpu-floating-point-precision' | 'shader-passes' | 'rendering-techniques' | 'transparency' | 'glass-effects';
export type ShaderLevelDocsTabGroupId = 'authoring' | 'techniques';

const SHADER_GUIDE_GROUPS = {
  authoring: 'guide-authoring',
  techniques: 'guide-techniques'
} as const;

export function ShaderLevelDocsTabs({active, group = 'authoring'}: {active: ShaderLevelDocsTabId; group?: ShaderLevelDocsTabGroupId}): ReactNode {
  const tabGroup = FOUNDATION_DOCS_CATALOG.shadertools[SHADER_GUIDE_GROUPS[group]];
  return <DocsPageTabs active={active} group={tabGroup} />;
}
