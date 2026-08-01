import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type ShaderModuleDocsTab = {
  id: ShaderModuleDocsTabId;
  label: string;
  href: string;
};

/** Built-in shader module documentation tab identifiers. */
export type ShaderModuleDocsTabId =
  | 'fp32'
  | 'precision-guide'
  | 'fp64'
  | 'fp64-arithmetic'
  | 'fp64-example'
  | 'lighting'
  | 'dirlight'
  | 'lambert-material'
  | 'gouraud-material'
  | 'phong-material'
  | 'pbr-material';

/** Built-in shader module documentation tab group identifiers. */
export type ShaderModuleDocsTabGroupId = 'precision' | 'lighting';

const SHADER_MODULE_DOCS_TABS: Record<ShaderModuleDocsTabGroupId, ShaderModuleDocsTab[]> = {
  precision: [
    {
      id: 'precision-guide',
      label: 'Precision Guide',
      href: '/docs/api-guide/shaders/gpu-floating-point-precision'
    },
    {id: 'fp32', label: 'fp32', href: '/docs/api-reference/shadertools/shader-modules/fp32'},
    {id: 'fp64', label: 'fp64', href: '/docs/api-reference/shadertools/shader-modules/fp64'},
    {
      id: 'fp64-arithmetic',
      label: 'fp64arithmetic',
      href: '/docs/api-reference/shadertools/shader-modules/fp64-arithmetic'
    },
    {
      id: 'fp64-example',
      label: 'Mandelbrot & Benchmarks',
      href: '/examples/experimental/fp64'
    }
  ],
  lighting: [
    {id: 'lighting', label: 'lighting', href: '/docs/api-reference/shadertools/shader-modules/lighting'},
    {id: 'dirlight', label: 'dirlight', href: '/docs/api-reference/shadertools/shader-modules/dirlight'},
    {
      id: 'lambert-material',
      label: 'lambertMaterial',
      href: '/docs/api-reference/shadertools/shader-modules/lambert-material'
    },
    {
      id: 'gouraud-material',
      label: 'gouraudMaterial',
      href: '/docs/api-reference/shadertools/shader-modules/gouraud-material'
    },
    {
      id: 'phong-material',
      label: 'phongMaterial',
      href: '/docs/api-reference/shadertools/shader-modules/phong-material'
    },
    {
      id: 'pbr-material',
      label: 'pbrMaterial',
      href: '/docs/api-reference/shadertools/shader-modules/pbr-material'
    }
  ]
};

/** Renders page links with the same visual treatment as tabs for built-in shader modules. */
export function ShaderModuleDocsTabs({
  group,
  active
}: {
  group: ShaderModuleDocsTabGroupId;
  active: ShaderModuleDocsTabId;
}): ReactNode {
  const ariaLabel =
    group === 'precision'
      ? 'GPU floating-point precision documentation sections'
      : 'Built-in shader module documentation sections';

  return (
    <nav className="docs-page-tabs" aria-label={ariaLabel}>
      {SHADER_MODULE_DOCS_TABS[group].map(tab => (
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
