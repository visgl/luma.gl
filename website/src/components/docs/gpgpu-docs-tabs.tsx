import React, {type ReactNode} from 'react';
import {DocsPageTabs, type DocumentationTabGroup} from './docs-page-tabs';

/** GPGPU documentation tab identifiers. */
export type GPGPUDocsTabId =
  | 'overview'
  | 'gpu-data-evaluator'
  | 'operations'
  | 'custom-operation'
  | 'clean-evaluate'
  | 'precision-guide'
  | 'fp64'
  | 'fp64-arithmetic';

export const GPGPU_DOCS_TAB_GROUPS: DocumentationTabGroup<GPGPUDocsTabId>[] = [
  {
    label: 'GPGPU evaluators and operations',
    tabs: [
      {id: 'overview', label: 'Overview', href: '/docs/api-reference/gpgpu'},
      {id: 'gpu-data-evaluator', label: 'GPU evaluators', href: '/docs/api-reference/gpgpu/gpu-data-evaluator'},
      {id: 'operations', label: 'Operations', href: '/docs/api-reference/gpgpu/operations'},
      {id: 'custom-operation', label: 'Custom operations', href: '/docs/api-reference/gpgpu/custom-operation'},
      {id: 'clean-evaluate', label: 'cleanEvaluate', href: '/docs/api-reference/gpgpu/clean-evaluate'}
    ]
  },
  {
    label: 'GPU floating-point precision',
    tabs: [
      {id: 'precision-guide', label: 'Precision guide', href: '/docs/api-guide/shaders/gpu-floating-point-precision'},
      {id: 'fp64', label: 'fp64', href: '/docs/api-reference/shadertools/shader-modules/fp64'},
      {id: 'fp64-arithmetic', label: 'fp64 arithmetic', href: '/docs/api-reference/shadertools/shader-modules/fp64-arithmetic'}
    ]
  }
];

/**
 * Renders page links with the same visual treatment as tabs for GPGPU documentation pages.
 */
export function GPGPUDocsTabs({active}: {active: GPGPUDocsTabId}): ReactNode {
  const group = GPGPU_DOCS_TAB_GROUPS.find(candidate =>
    candidate.tabs.some(tab => tab.id === active)
  );
  return group ? <DocsPageTabs active={active} group={group} /> : null;
}
