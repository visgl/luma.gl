import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type CoreDocsTab = {
  /** Stable tab identifier. */
  id: CoreDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** Core documentation tab identifiers. */
export type CoreDocsTabId =
  | 'luma'
  | 'adapter'
  | 'device'
  | 'device-info'
  | 'device-limits'
  | 'device-features'
  | 'shader-types'
  | 'vertex-formats'
  | 'texture-formats'
  | 'command-encoding'
  | 'render-pass'
  | 'render-bundle-encoder'
  | 'compute-pass'
  | 'command-encoder'
  | 'shader'
  | 'render-pipeline'
  | 'compute-pipeline'
  | 'vertex-array'
  | 'transform-feedback'
  | 'texture'
  | 'texture-view'
  | 'sampler'
  | 'external-texture';

/** Core documentation tab group identifiers. */
export type CoreDocsTabGroupId =
  | 'device'
  | 'shader-types'
  | 'commands'
  | 'pipelines'
  | 'textures';

const CORE_DOCS_TABS: Record<CoreDocsTabGroupId, CoreDocsTab[]> = {
  device: [
    {id: 'luma', label: 'luma', href: '/docs/api-reference/core/luma'},
    {id: 'adapter', label: 'Adapter', href: '/docs/api-reference/core/adapter'},
    {id: 'device', label: 'Device', href: '/docs/api-reference/core/device'},
    {id: 'device-info', label: 'DeviceInfo', href: '/docs/api-reference/core/device-info'},
    {id: 'device-limits', label: 'DeviceLimits', href: '/docs/api-reference/core/device-limits'},
    {
      id: 'device-features',
      label: 'DeviceFeatures',
      href: '/docs/api-reference/core/device-features'
    }
  ],
  'shader-types': [
    {id: 'shader-types', label: 'Shader Types', href: '/docs/api-reference/core/shader-types'},
    {
      id: 'vertex-formats',
      label: 'Vertex Formats',
      href: '/docs/api-reference/core/vertex-formats'
    },
    {
      id: 'texture-formats',
      label: 'Texture Formats',
      href: '/docs/api-reference/core/texture-formats'
    }
  ],
  commands: [
    {
      id: 'command-encoding',
      label: 'Issuing Commands',
      href: '/docs/api-guide/gpu/gpu-commands'
    },
    {
      id: 'command-encoder',
      label: 'CommandEncoder',
      href: '/docs/api-reference/core/resources/command-encoder'
    },
    {
      id: 'render-pass',
      label: 'RenderPass',
      href: '/docs/api-reference/core/resources/render-pass'
    },
    {
      id: 'render-bundle-encoder',
      label: 'RenderBundleEncoder',
      href: '/docs/api-reference/core/resources/render-bundle-encoder'
    },
    {
      id: 'compute-pass',
      label: 'ComputePass',
      href: '/docs/api-reference/core/resources/compute-pass'
    }
  ],
  pipelines: [
    {id: 'shader', label: 'Shader', href: '/docs/api-reference/core/resources/shader'},
    {
      id: 'render-pipeline',
      label: 'RenderPipeline',
      href: '/docs/api-reference/core/resources/render-pipeline'
    },
    {
      id: 'compute-pipeline',
      label: 'ComputePipeline',
      href: '/docs/api-reference/core/resources/compute-pipeline'
    },
    {
      id: 'vertex-array',
      label: 'VertexArray',
      href: '/docs/api-reference/core/resources/vertex-array'
    },
    {
      id: 'transform-feedback',
      label: 'TransformFeedback',
      href: '/docs/api-reference/core/resources/transform-feedback'
    }
  ],
  textures: [
    {id: 'texture', label: 'Texture', href: '/docs/api-reference/core/resources/texture'},
    {
      id: 'texture-view',
      label: 'TextureView',
      href: '/docs/api-reference/core/resources/texture-view'
    },
    {id: 'sampler', label: 'Sampler', href: '/docs/api-reference/core/resources/sampler'},
    {
      id: 'external-texture',
      label: 'ExternalTexture',
      href: '/docs/api-reference/core/resources/external-texture'
    }
  ]
};

/**
 * Renders page links with the same visual treatment as tabs for related core documentation pages.
 */
export function CoreDocsTabs({
  group,
  active
}: {
  group: CoreDocsTabGroupId;
  active: CoreDocsTabId;
}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="Core documentation sections">
      {CORE_DOCS_TABS[group].map(tab => (
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
