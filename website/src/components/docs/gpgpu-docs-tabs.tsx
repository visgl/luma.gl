import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';

type GPGPUDocsTab = {
  /** Stable tab identifier. */
  id: GPGPUDocsTabId;
  /** User-facing tab label. */
  label: string;
  /** Documentation page URL. */
  href: string;
};

/** GPGPU documentation tab identifiers. */
export type GPGPUDocsTabId =
  | 'overview'
  | 'gpu-data-evaluator'
  | 'operations'
  | 'custom-operation'
  | 'clean-evaluate';

const GPGPU_DOCS_TABS: GPGPUDocsTab[] = [
  {id: 'overview', label: 'Overview', href: '/docs/api-reference/gpgpu'},
  {id: 'gpu-data-evaluator', label: 'GPU Evaluators', href: '/docs/api-reference/gpgpu/gpu-data-evaluator'},
  {id: 'operations', label: 'Operations', href: '/docs/api-reference/gpgpu/operations'},
  {
    id: 'custom-operation',
    label: 'Custom Operations',
    href: '/docs/api-reference/gpgpu/custom-operation'
  },
  {id: 'clean-evaluate', label: 'cleanEvaluate', href: '/docs/api-reference/gpgpu/clean-evaluate'}
];

/**
 * Renders page links with the same visual treatment as tabs for GPGPU documentation pages.
 */
export function GPGPUDocsTabs({active}: {active: GPGPUDocsTabId}): ReactNode {
  return (
    <nav className="docs-page-tabs" aria-label="GPGPU documentation sections">
      {GPGPU_DOCS_TABS.map(tab => (
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
