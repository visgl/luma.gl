// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {existsSync, readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

import React from 'react';
import {renderToString} from 'react-dom/server';
import typescript from 'typescript';
import {beforeEach, describe, expect, test, vi} from 'vitest';

const deferredExampleSource = readFileSync(
  new URL('../../website/src/components/docs/deferred-luxfilter-example.tsx', import.meta.url),
  'utf8'
);
const transpiledDeferredExample = typescript.transpileModule(deferredExampleSource, {
  compilerOptions: {
    esModuleInterop: true,
    jsx: typescript.JsxEmit.ReactJSX,
    module: typescript.ModuleKind.CommonJS,
    target: typescript.ScriptTarget.ES2022
  }
});

const loadWebsiteExamples = vi.fn();
const nativeRequire = createRequire(import.meta.url);

function requireDeferredExampleDependency(moduleName: string): unknown {
  if (moduleName === '@docusaurus/useBaseUrl') {
    return {
      __esModule: true,
      default: (websitePath: string) => `/documentation-preview${websitePath}`
    };
  }

  if (moduleName === '../../examples') {
    loadWebsiteExamples();
    return {MillionRowCrossfilterExample: () => React.createElement('canvas')};
  }

  return nativeRequire(moduleName);
}

const deferredExampleModule: {
  exports: Record<string, React.ComponentType<{embeddedHeight?: number}>>;
} = {exports: {}};
const loadDeferredExample = new Function(
  'require',
  'module',
  'exports',
  transpiledDeferredExample.outputText
);

loadDeferredExample(
  requireDeferredExampleDependency,
  deferredExampleModule,
  deferredExampleModule.exports
);

const DeferredLuxFilterExample = deferredExampleModule.exports.DeferredLuxFilterExample;

beforeEach(() => {
  loadWebsiteExamples.mockClear();
});

describe('LuxFilter live crossfilter documentation', () => {
  test('publishes an explicitly launched explorer in the canonical experimental documentation', () => {
    const documentationContent = readFileSync(
      new URL('../../docs/api-reference/experimental/luxfilter.md', import.meta.url),
      'utf8'
    );
    const sidebarContent = readFileSync(
      new URL('../../docs/table-of-contents.json', import.meta.url),
      'utf8'
    );
    const experimentalNavigation = readFileSync(
      new URL('../../website/src/components/docs/experimental-docs-tabs.tsx', import.meta.url),
      'utf8'
    );

    expect(documentationContent).toContain(
      "import {DeferredLuxFilterExample} from '@site/src/components/docs/deferred-luxfilter-example';"
    );
    expect(documentationContent).toContain('<DeferredLuxFilterExample embeddedHeight={900} />');
    expect(documentationContent).not.toMatch(/from ['"]@site\/src\/examples['"]/);
    expect(sidebarContent.match(/"api-reference\/experimental\/luxfilter"/g)).toHaveLength(2);
    expect(experimentalNavigation).toContain("href: '/docs/api-reference/experimental/luxfilter'");
  });

  test('credits NVIDIA RAPIDS and compares documented cuXfilter and LuxFilter capabilities', () => {
    const documentationContent = readFileSync(
      new URL('../../docs/api-reference/experimental/luxfilter.md', import.meta.url),
      'utf8'
    );
    const packageDocumentation = readFileSync(
      new URL('../../modules/experimental/src/luxfilter/README.md', import.meta.url),
      'utf8'
    );

    expect(documentationContent).toContain('## Attribution and feature comparison');
    expect(documentationContent).toContain(
      '| Capability | NVIDIA RAPIDS cuXfilter | luma.gl LuxFilter |'
    );
    expect(documentationContent).toContain('https://docs.rapids.ai/api/cuxfilter/stable/');
    expect(documentationContent).toContain('https://docs.rapids.ai/notices/rsn0060/');
    expect(documentationContent).toContain('Final RAPIDS release 26.06');
    expect(documentationContent).toContain('One WebGPU device');
    expect(packageDocumentation).toContain('## Attribution');
    expect(packageDocumentation).toContain('NVIDIA RAPIDS cuXfilter');
    expect(packageDocumentation).toContain('/docs/api-reference/experimental/luxfilter');
  });

  test('server-renders the real showcase preview without importing or starting the GPU explorer', () => {
    const markup = renderToString(React.createElement(DeferredLuxFilterExample));

    expect(markup).toContain('Interactive million-row crossfilter explorer');
    expect(markup).toContain('Explore one million linked GPU-resident rows.');
    expect(markup).toContain('Launch interactive explorer');
    expect(markup).toContain(
      '/documentation-preview/images/examples/showcase/million-row-crossfilter.jpg'
    );
    expect(loadWebsiteExamples).not.toHaveBeenCalled();
    expect(
      existsSync(
        new URL(
          '../../website/static/images/examples/showcase/million-row-crossfilter.jpg',
          import.meta.url
        )
      )
    ).toBe(true);
  });

  test('loads the existing linked dashboard only after an accessible explicit launch', () => {
    expect(deferredExampleSource).toContain('React.lazy(async () => {');
    expect(deferredExampleSource).toContain("await import('../../examples')");
    expect(deferredExampleSource).toContain(
      'const [isRequested, setIsRequested] = useState(false)'
    );
    expect(deferredExampleSource).toContain('if (isRequested)');
    expect(deferredExampleSource).toContain('onClick={() => setIsRequested(true)}');
    expect(deferredExampleSource).toContain('aria-live="polite" role="status"');
    expect(deferredExampleSource).toContain('<LazyMillionRowCrossfilterExample');
    expect(deferredExampleSource).toContain('embeddedHeight={embeddedHeight}');
    expect(deferredExampleSource).toContain('showHeader={false}');
    expect(deferredExampleSource).toContain('showStats={false}');
    expect(deferredExampleSource).not.toMatch(/^import\s+.*\s+from ['"]\.\.\/\.\.\/examples['"]/m);
  });
});
