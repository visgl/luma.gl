// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {existsSync, readFileSync, readdirSync} from 'node:fs';
import path from 'node:path';
import {describe, expect, test} from 'vitest';
import {
  EXPERIMENTAL_DOCS_TAB_GROUPS,
  GPU_CORE_DOCS_TAB_GROUPS
} from '../../website/src/components/docs/experimental-docs-catalog';

const DOCUMENTATION_DIRECTORY = path.join(process.cwd(), 'docs');
const OPERATION_HEADING_ORDER = [
  'Overview',
  'When to use',
  'Usage',
  'Inputs and outputs',
  'Execution and ownership',
  'Capacity, validation, and failure behavior',
  'Performance',
  'Limitations',
  'Related APIs'
] as const;

describe('GPU module documentation contract', () => {
  test('keeps one representative live example near every module overview', () => {
    const overviewFiles = [
      'docs/api-reference/experimental/gpu-core/README.md',
      'docs/api-reference/experimental/gpu-graph.md',
      'docs/api-reference/experimental/gpu-raster/README.md',
      'docs/api-reference/experimental/gpu-project.md',
      'docs/api-reference/experimental/gpu-dataframe.md',
      'docs/api-reference/experimental/gpu-crossfilter.md',
      'docs/api-reference/experimental/gpu-trace.md'
    ];

    for (const filename of overviewFiles) {
      const source = readFileSync(path.join(process.cwd(), filename), 'utf8');
      const exampleOffset = source.search(/<[A-Z][A-Za-z0-9]*(?:Example|Benchmark|Tutorial)\b/);
      const operationsOffset = source.search(/^## (?:Operations|Public API)/m);
      expect(exampleOffset, `${filename} must embed a representative live example`).toBeGreaterThan(
        0
      );
      expect(
        exampleOffset,
        `${filename} must present the example before its operation index`
      ).toBeLessThan(operationsOffset < 0 ? source.length : operationsOffset);
      expect(source, `${filename} must explain its example with the shared card`).toContain(
        '<GPUExampleCard'
      );
    }
  });

  test('preserves established module overview routes', () => {
    const routes = [
      '/docs/api-reference/experimental/gpu-core',
      '/docs/api-reference/experimental/gpu-core/tutorial',
      '/docs/api-reference/experimental/gpu-core/recipes',
      '/docs/api-reference/experimental/gpu-core/concepts',
      '/docs/api-reference/experimental/gpu-graph',
      '/docs/api-reference/experimental/gpu-raster',
      '/docs/api-reference/experimental/gpu-project',
      '/docs/api-reference/experimental/gpu-dataframe',
      '/docs/api-reference/experimental/gpu-crossfilter',
      '/docs/api-reference/experimental/gpu-trace'
    ];

    for (const route of routes) {
      expect(resolveDocumentationHref(route), `${route} must remain resolvable`).not.toBeNull();
    }
  });

  test('keeps the basic GPU Core learning funnel connected', () => {
    const overview = readFileSync(
      path.join(process.cwd(), 'docs/api-reference/experimental/gpu-core/README.md'),
      'utf8'
    );
    const tutorial = readFileSync(
      path.join(process.cwd(), 'docs/api-reference/experimental/gpu-core/tutorial.md'),
      'utf8'
    );
    const recipes = readFileSync(
      path.join(process.cwd(), 'docs/api-reference/experimental/gpu-core/recipes.md'),
      'utf8'
    );
    const concepts = readFileSync(
      path.join(process.cwd(), 'docs/api-reference/experimental/gpu-core/concepts.md'),
      'utf8'
    );

    expect(overview).toContain('## Choose a learning path');
    expect(overview.match(/className="gpu-core-reading-path"/g)).toHaveLength(6);
    expect(tutorial).toContain('## Terminology in one minute');
    expect(recipes).toContain('## Choose a recipe');
    expect(recipes).toContain('## Package a reusable operation');
    expect(recipes).toContain("source: 'cpu'");
    expect(recipes).toContain('compiled.getExecutionPlan(budget');
    expect(recipes).toContain('class VisibleItems implements GPUCommandGraphContributor');
    expect(concepts).toMatch(/addToGraph\(\)[\s\S]*compile\(\)[\s\S]*Encoding/);
  });

  test('answers practical contract questions on every operation page', () => {
    const operationPages = readdirSync(
      path.join(process.cwd(), 'docs/api-reference/experimental/gpu-core')
    ).filter(
      filename =>
        filename.endsWith('.md') &&
        !['README.md', 'concepts.md', 'recipes.md', 'tutorial.md'].includes(filename)
    );

    const contractSource = readFileSync(
      path.join(process.cwd(), 'website/src/components/docs/gpu-operation-contract.tsx'),
      'utf8'
    );
    const catalogIdentifiers = [...contractSource.matchAll(/^  '([^']+)': \{$/gm)].map(
      match => match[1]
    );

    for (const filename of operationPages) {
      const source = readFileSync(
        path.join(process.cwd(), 'docs/api-reference/experimental/gpu-core', filename),
        'utf8'
      );
      const operationIdentifier = filename.replace(/\.md$/, '');
      expect(source, `${filename} must provide the shared operation contract`).toContain(
        `<GPUOperationContract operation="${operationIdentifier}" />`
      );
      expect(catalogIdentifiers, `${filename} must have catalog metadata`).toContain(
        operationIdentifier
      );
    }
    expect(contractSource.match(/^    cost: /gm)).toHaveLength(catalogIdentifiers.length);
    expect(contractSource.match(/^    mistake: /gm)).toHaveLength(catalogIdentifiers.length);

    const traceOperationPages = readdirSync(
      path.join(process.cwd(), 'docs/api-reference/experimental/gpu-trace')
    ).filter(filename => filename.endsWith('.md'));
    for (const filename of traceOperationPages) {
      const source = readFileSync(
        path.join(process.cwd(), 'docs/api-reference/experimental/gpu-trace', filename),
        'utf8'
      );
      const match = source.match(/<GPUOperationContract operation="([^"]+)" \/>/);
      expect(match, `${filename} must provide the shared operation contract`).not.toBeNull();
      expect(catalogIdentifiers, `${filename} must have catalog metadata`).toContain(match![1]);
    }
  });

  test('keeps tab identities unique and synchronized with documentation routes', () => {
    const tableOfContentsIdentifiers = new Set(
      collectTableOfContentsIdentifiers(
        JSON.parse(
          readFileSync(path.join(DOCUMENTATION_DIRECTORY, 'table-of-contents.json'), 'utf8')
        )
      )
    );

    for (const groups of [EXPERIMENTAL_DOCS_TAB_GROUPS, GPU_CORE_DOCS_TAB_GROUPS]) {
      const tabs = groups.flatMap(group => group.tabs);
      expect(new Set(tabs.map(tab => tab.id)).size).toBe(tabs.length);

      for (const tab of tabs) {
        const documentationPath = resolveDocumentationHref(tab.href);
        expect(
          documentationPath,
          `${tab.href} must resolve to a documentation file`
        ).not.toBeNull();
        expect(
          tableOfContentsIdentifiers.has(getTableOfContentsIdentifier(documentationPath!)),
          `${tab.href} must appear in docs/table-of-contents.json`
        ).toBe(true);
        expect(readFileSync(documentationPath!, 'utf8')).toContain(`active="${tab.id}"`);
      }
    }
  });

  test('keeps operation headings in the canonical order', () => {
    const primitiveDirectory = path.join(
      DOCUMENTATION_DIRECTORY,
      'api-reference/experimental/gpu-core'
    );

    for (const filename of readdirSync(primitiveDirectory).filter(name => name.endsWith('.md'))) {
      const source = readFileSync(path.join(primitiveDirectory, filename), 'utf8');
      expect(source, `${filename} must introduce the operation`).toContain('## Overview');

      let previousHeadingOffset = -1;
      for (const heading of OPERATION_HEADING_ORDER) {
        const headingOffset = source.indexOf(`## ${heading}`);
        if (headingOffset < 0) continue;
        expect(
          headingOffset,
          `${filename}: "${heading}" is out of the common operation-reference order`
        ).toBeGreaterThan(previousHeadingOffset);
        previousHeadingOffset = headingOffset;
      }
    }
  });

  test('uses stable site imports from public documentation', () => {
    const experimentalDirectory = path.join(DOCUMENTATION_DIRECTORY, 'api-reference/experimental');
    const documentationSources = readMarkdownFiles(experimentalDirectory);

    for (const [filename, source] of documentationSources) {
      expect(
        source,
        `${filename} must not reach into the website with a relative import`
      ).not.toMatch(/from ['"](?:\.\.\/)+website\//);
    }
  });

  test('keeps internal links valid and development-status language out of public docs', () => {
    const publicDocumentation = readMarkdownFiles(DOCUMENTATION_DIRECTORY);
    const experimentalDocumentation = readMarkdownFiles(
      path.join(DOCUMENTATION_DIRECTORY, 'api-reference/experimental')
    );

    for (const [filename, source] of publicDocumentation) {
      expect(source, `${filename} contains internal development-status wording`).not.toMatch(
        /\b(?:supremacy|tranche status|delivery tranches|implementation roadmap)\b/i
      );
    }

    for (const [filename, source] of experimentalDocumentation) {
      for (const match of source.matchAll(/\[[^\]]*\]\((\/docs\/[^)#?]+)(?:#[^)]+)?\)/g)) {
        const href = match[1];
        expect(
          resolveDocumentationHref(href),
          `${filename} links to missing route ${href}`
        ).not.toBeNull();
      }
    }
  });

  test('mentions every exported GPU module operation in its documentation family', () => {
    const contracts = [
      {
        source: 'modules/gpgpu/src/gpu-core/index.ts',
        documentation: 'docs/api-reference/experimental/gpu-core'
      },
      {
        source: 'modules/experimental/src/gpu-trace/index.ts',
        documentation: 'docs/api-reference/experimental'
      },
      {
        source: 'modules/experimental/src/gpu-dataframe/index.ts',
        documentation: 'docs/api-reference/experimental'
      },
      {
        source: 'modules/gpgpu/src/gpu-graph/index.ts',
        documentation: 'docs/api-reference/experimental'
      },
      {
        source: 'modules/experimental/src/gpu-raster/index.ts',
        documentation: 'docs/api-reference/experimental/gpu-raster'
      }
    ] as const;

    for (const contract of contracts) {
      const source = readFileSync(path.join(process.cwd(), contract.source), 'utf8');
      const documentation = [
        ...readMarkdownFiles(path.join(process.cwd(), contract.documentation)).values()
      ].join('\n');
      const operationNames = extractRuntimeOperationNames(source);

      for (const operationName of operationNames) {
        expect(
          documentation,
          `${operationName} from ${contract.source} must be discoverable in documentation`
        ).toContain(operationName);
      }
    }
  });
});

function collectTableOfContentsIdentifiers(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectTableOfContentsIdentifiers);
  if (!value || typeof value !== 'object') return [];
  const record = value as Record<string, unknown>;
  return [
    ...(typeof record.id === 'string' ? [record.id] : []),
    ...collectTableOfContentsIdentifiers(record.items)
  ];
}

function resolveDocumentationHref(href: string): string | null {
  const relativePath = href.replace(/^\/docs\//, '');
  const candidates = [
    path.join(DOCUMENTATION_DIRECTORY, `${relativePath}.md`),
    path.join(DOCUMENTATION_DIRECTORY, `${relativePath}.mdx`),
    path.join(DOCUMENTATION_DIRECTORY, relativePath, 'README.md'),
    path.join(DOCUMENTATION_DIRECTORY, relativePath, 'README.mdx')
  ];
  return candidates.find(candidate => existsSync(candidate)) ?? null;
}

function getTableOfContentsIdentifier(documentationPath: string): string {
  const relativePath = path.relative(DOCUMENTATION_DIRECTORY, documentationPath);
  return relativePath
    .replace(/\.(?:md|mdx)$/, '')
    .split(path.sep)
    .join('/');
}

function readMarkdownFiles(directory: string): Map<string, string> {
  const result = new Map<string, string>();
  for (const entry of readdirSync(directory, {withFileTypes: true})) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      for (const [filename, source] of readMarkdownFiles(entryPath)) result.set(filename, source);
    } else if (/\.mdx?$/.test(entry.name)) {
      result.set(entryPath, readFileSync(entryPath, 'utf8'));
    }
  }
  return result;
}

function extractRuntimeOperationNames(source: string): string[] {
  const operationNames = new Set<string>();
  for (const match of source.matchAll(/export\s*\{([\s\S]*?)\}\s*from/g)) {
    for (const rawName of match[1].split(',')) {
      const name = rawName.trim().split(/\s+as\s+/)[0];
      if (/^(?:GPU|Lu|Compiled|DrawCommandBuffer|Graph)[A-Z0-9]/.test(name)) {
        operationNames.add(name);
      }
    }
  }
  return [...operationNames].sort();
}
