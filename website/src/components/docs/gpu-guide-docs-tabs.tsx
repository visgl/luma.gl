import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type GpuGuideDocsTab = {
  id: GpuGuideDocsTabId;
  label: string;
  href: string;
};

/** GPU guide documentation tab identifiers. */
export type GpuGuideDocsTabId =
  | 'overview'
  | 'initialization'
  | 'resources'
  | 'rendering'
  | 'parameters'
  | 'bindings'
  | 'attributes'
  | 'uniforms'
  | 'textures'
  | 'video-textures'
  | 'tabular-data';

/** GPU guide documentation tab group identifiers. */
export type GpuGuideDocsTabGroupId = 'execution' | 'shader-data';

const GPU_GUIDE_DOCS_TABS: Record<GpuGuideDocsTabGroupId, GpuGuideDocsTab[]> = {
  execution: [
    {id: 'overview', label: 'Overview', href: '/docs/api-guide/gpu'},
    {id: 'initialization', label: 'Initialization', href: '/docs/api-guide/gpu/gpu-initialization'},
    {id: 'resources', label: 'Resources', href: '/docs/api-guide/gpu/gpu-resources'},
    {id: 'rendering', label: 'Rendering', href: '/docs/api-guide/gpu/gpu-rendering'},
    {id: 'parameters', label: 'Parameters', href: '/docs/api-guide/gpu/gpu-parameters'}
  ],
  'shader-data': [
    {id: 'bindings', label: 'Bindings', href: '/docs/api-guide/gpu/gpu-bindings'},
    {id: 'attributes', label: 'Attributes', href: '/docs/api-guide/gpu/gpu-attributes'},
    {id: 'uniforms', label: 'Uniforms', href: '/docs/api-guide/gpu/gpu-uniforms'},
    {id: 'textures', label: 'Textures', href: '/docs/api-guide/gpu/gpu-textures'},
    {id: 'video-textures', label: 'Video Textures', href: '/docs/api-guide/gpu/video-textures'},
    {id: 'tabular-data', label: 'Tabular Data', href: '/docs/api-guide/gpu/tabular-data-in-wgsl'}
  ]
};

/** Renders page links with the same visual treatment as tabs for related GPU guide pages. */
export function GpuGuideDocsTabs({
  group,
  active
}: {
  group: GpuGuideDocsTabGroupId;
  active: GpuGuideDocsTabId;
}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="GPU guide documentation sections">
      {GPU_GUIDE_DOCS_TABS[group].map(tab => (
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
