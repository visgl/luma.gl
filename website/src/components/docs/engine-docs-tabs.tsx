import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type EngineDocsTab = {
  /** Stable tab identifier. */
  id: EngineDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** Engine documentation tab identifiers. */
export type EngineDocsTabId =
  | 'geometry'
  | 'gpu-geometry'
  | 'built-in-geometries'
  | 'scenegraphs'
  | 'scenegraph-node'
  | 'group-node'
  | 'model-node'
  | 'gpu-computations'
  | 'computation'
  | 'buffer-transform'
  | 'texture-transform'
  | 'swap'
  | 'animation-loop'
  | 'animation-loop-template'
  | 'key-frames'
  | 'timeline';

/** Engine documentation tab group identifiers. */
export type EngineDocsTabGroupId = 'geometry' | 'scenegraph' | 'compute' | 'animation';

const ENGINE_DOCS_TABS: Record<EngineDocsTabGroupId, EngineDocsTab[]> = {
  geometry: [
    {id: 'geometry', label: 'Geometry', href: '/docs/api-reference/engine/geometry'},
    {
      id: 'gpu-geometry',
      label: 'GPUGeometry',
      href: '/docs/api-reference/engine/geometry/gpu-geometry'
    },
    {
      id: 'built-in-geometries',
      label: 'Built-ins',
      href: '/docs/api-reference/engine/geometry/geometries'
    }
  ],
  scenegraph: [
    {id: 'scenegraphs', label: 'Scenegraphs', href: '/docs/api-guide/engine/scenegraph'},
    {
      id: 'scenegraph-node',
      label: 'ScenegraphNode',
      href: '/docs/api-reference/engine/scenegraph/scenegraph-node'
    },
    {
      id: 'group-node',
      label: 'GroupNode',
      href: '/docs/api-reference/engine/scenegraph/group-node'
    },
    {
      id: 'model-node',
      label: 'ModelNode',
      href: '/docs/api-reference/engine/scenegraph/model-node'
    }
  ],
  compute: [
    {id: 'gpu-computations', label: 'GPU Computations', href: '/docs/api-guide/engine/transforms'},
    {
      id: 'computation',
      label: 'Computation',
      href: '/docs/api-reference/engine/compute/computation'
    },
    {
      id: 'buffer-transform',
      label: 'BufferTransform',
      href: '/docs/api-reference/engine/compute/buffer-transform'
    },
    {
      id: 'texture-transform',
      label: 'TextureTransform',
      href: '/docs/api-reference/engine/compute/texture-transform'
    },
    {id: 'swap', label: 'Swap', href: '/docs/api-reference/engine/compute/swap'}
  ],
  animation: [
    {
      id: 'animation-loop',
      label: 'AnimationLoop',
      href: '/docs/api-reference/engine/animation-loop'
    },
    {
      id: 'animation-loop-template',
      label: 'Template',
      href: '/docs/api-reference/engine/animation-loop-template'
    },
    {
      id: 'key-frames',
      label: 'KeyFrames',
      href: '/docs/api-reference/engine/animation/key-frames'
    },
    {id: 'timeline', label: 'Timeline', href: '/docs/api-reference/engine/animation/timeline'}
  ]
};

/**
 * Renders page links with the same visual treatment as tabs for related engine documentation pages.
 */
export function EngineDocsTabs({
  group,
  active
}: {
  group: EngineDocsTabGroupId;
  active: EngineDocsTabId;
}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="Engine documentation sections">
      {ENGINE_DOCS_TABS[group].map(tab => (
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
