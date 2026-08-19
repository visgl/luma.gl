import React, {type ReactNode} from 'react';
import {DocsPageTabs} from './docs-page-tabs';

type WebGLDocsTab = {id: WebGLDocsTabId; label: string; href: string};

/** WebGL documentation tab identifiers. */
export type WebGLDocsTabId = 'overview' | 'constants' | 'webgpu';

const WEBGL_DOCS_TABS: WebGLDocsTab[] = [
  {id: 'overview', label: 'Overview', href: '/docs/api-reference/webgl'},
  {id: 'constants', label: 'Constants', href: '/docs/api-reference/webgl/constants'},
  {id: 'webgpu', label: 'WebGPU adapter', href: '/docs/api-reference/webgpu'}
];

/** Renders page links with the same visual treatment as tabs for WebGL documentation pages. */
export function WebGLDocsTabs({active}: {active: WebGLDocsTabId}): ReactNode {
  return <DocsPageTabs active={active} group={{label: 'GPU backend adapters', tabs: WEBGL_DOCS_TABS}} />;
}
