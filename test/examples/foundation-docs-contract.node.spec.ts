// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {describe, expect, test} from 'vitest';
import {FOUNDATION_DOCS_CATALOG} from '../../website/src/components/docs/foundation-docs-catalog';
import {getFoundationJourney} from '../../website/src/components/docs/foundation-journey-model';
import {
  CORE_RESOURCE_LIFECYCLE,
  ENGINE_CORE_MAPPINGS,
  assembleTeachingShader,
  orderTeachingShaderModules
} from '../../website/src/components/docs/foundation-teaching-models';

const DOCUMENTATION_DIRECTORY = path.join(process.cwd(), 'docs');
const OVERVIEW_SECTION_ORDER = [
  'Overview',
  'When to use it',
  'Live example',
  'Core concepts',
  'Feature card',
  'Workflows',
  'API index',
  'Limits and compatibility',
  'Related modules'
] as const;

describe('foundation documentation contract', () => {
  test('keeps focused tab groups synchronized with routes and the table of contents', () => {
    const tableOfContents = readFileSync(
      path.join(DOCUMENTATION_DIRECTORY, 'table-of-contents.json'),
      'utf8'
    );
    for (const moduleGroups of Object.values(FOUNDATION_DOCS_CATALOG)) {
      for (const group of Object.values(moduleGroups)) {
        expect(group.tabs.length, `${group.label} should stay focused`).toBeGreaterThanOrEqual(3);
        expect(
          group.tabs.length,
          `${group.label} must not become a mega group`
        ).toBeLessThanOrEqual(7);
        expect(new Set(group.tabs.map(tab => tab.id)).size).toBe(group.tabs.length);
        for (const tab of group.tabs) {
          const filename = resolveDocumentationHref(tab.href);
          expect(filename, `${tab.href} must resolve`).not.toBeNull();
          expect(tableOfContents).toContain(getTableOfContentsIdentifier(filename!));
          expect(
            readFileSync(filename!, 'utf8'),
            `${tab.href} must render its local tab group`
          ).toContain(`active="${tab.id}"`);
        }
      }
    }
  });

  test('uses one canonical progression on the three module overviews', () => {
    for (const moduleName of ['core', 'engine', 'shadertools']) {
      const filename = path.join(DOCUMENTATION_DIRECTORY, 'api-reference', moduleName, 'README.md');
      const source = readFileSync(filename, 'utf8');
      let previousOffset = -1;
      for (const section of OVERVIEW_SECTION_ORDER) {
        const offset = source.indexOf(`## ${section}`);
        expect(offset, `${moduleName} is missing ${section}`).toBeGreaterThan(previousOffset);
        previousOffset = offset;
      }
      expect(source).toContain('<DocumentationExampleCard');
      expect(source).toContain('activationLabel=');
      expect(source.indexOf('<ClientOnlyLiveExample')).toBeLessThan(source.indexOf('## API index'));
      expect(source).toContain(`/docs/api-reference/generated/${moduleName}`);
    }
  });

  test('configures exhaustive generated API indexes for every foundational package', () => {
    const configuration = readFileSync(
      path.join(process.cwd(), 'website/docusaurus.config.js'),
      'utf8'
    );
    for (const moduleName of ['core', 'engine', 'shadertools']) {
      const source = readFileSync(
        path.join(process.cwd(), `modules/${moduleName}/src/index.ts`),
        'utf8'
      );
      const exportCount = [...source.matchAll(/\bexport\b/g)].length;
      expect(exportCount, `${moduleName} should have a meaningful public surface`).toBeGreaterThan(
        20
      );
      expect(configuration).toContain(`entryPoints: ['../modules/${moduleName}/src/index.ts']`);
      expect(configuration).toContain(`out: '../docs/api-reference/generated/${moduleName}'`);
    }
  });

  test('keeps deterministic teaching models for lifecycle, mappings, and assembly', () => {
    expect(CORE_RESOURCE_LIFECYCLE).toEqual([
      'declare usage',
      'create',
      'upload',
      'encode',
      'submit',
      'reuse',
      'destroy'
    ]);
    expect(ENGINE_CORE_MAPPINGS.map(mapping => mapping.engine)).toEqual([
      'Geometry',
      'ShaderInputs',
      'Model',
      'model.draw(pass)',
      'needsRedraw()'
    ]);
    expect(getFoundationJourney().map(layer => layer.id)).toEqual([
      'shadertools',
      'engine',
      'core',
      'gpu-core'
    ]);

    const modules = [
      {name: 'lighting', source: 'fn light() {}', dependencies: ['math']},
      {name: 'math', source: 'fn saturate() {}'},
      {name: 'material', source: 'fn shade() {}', dependencies: ['lighting']}
    ];
    expect(orderTeachingShaderModules(modules).map(module => module.name)).toEqual([
      'math',
      'lighting',
      'material'
    ]);
    expect(assembleTeachingShader(modules)).toMatch(
      /module: math[\s\S]*module: lighting[\s\S]*module: material/
    );
    expect(() =>
      orderTeachingShaderModules([{name: 'a', source: '', dependencies: ['a']}])
    ).toThrow(/Circular/);
  });

  test('keeps activation lazy and preserves unmount ownership', () => {
    const activationSource = readFileSync(
      path.join(process.cwd(), 'website/src/components/docs/client-only-live-example.tsx'),
      'utf8'
    );
    expect(activationSource).toContain('useState(false)');
    expect(activationSource).toContain('if (isActive)');
    expect(activationSource).toContain('onClick={() => setIsActive(true)}');
    expect(activationSource).not.toMatch(/onWheel|onPointerMove|preventDefault/);

    for (const example of ['hello-triangle-geometry', 'shader-modules']) {
      const source = readFileSync(
        path.join(process.cwd(), `examples/tutorials/${example}/app.ts`),
        'utf8'
      );
      expect(source).toContain('onFinalize()');
      expect(source).toContain('.destroy()');
    }
  });

  test('keeps foundational cookbooks task-oriented and copyable', () => {
    const cookbooks = [
      'api-guide/gpu/cookbook.md',
      'api-guide/engine/cookbook.md',
      'api-guide/shaders/cookbook.md'
    ];

    for (const relativeFilename of cookbooks) {
      const source = readFileSync(path.join(DOCUMENTATION_DIRECTORY, relativeFilename), 'utf8');
      expect(source, `${relativeFilename} needs a goal selector`).toMatch(/\| Goal \|/);
      expect(
        source.match(/^```ts$/gm)?.length ?? 0,
        `${relativeFilename} needs short runnable snippets`
      ).toBeGreaterThanOrEqual(6);
      expect(source, `${relativeFilename} needs onward navigation`).toContain('## Related pages');
    }
  });

  test('keeps Core and Engine guides conclusion-driven', () => {
    const guideContracts = {
      'api-guide/gpu/README.md': [
        'Outcome',
        'Mental model',
        'Complete workflow',
        'Choose the next page',
        'Decisions and tradeoffs',
        'Common mistakes',
        'Next steps'
      ],
      'api-guide/gpu/gpu-initialization.md': [
        'Outcome',
        'Mental model',
        'Create a WebGPU device',
        'Create the best available portable device',
        'Select a capability-dependent path',
        'Common mistakes',
        'Next steps'
      ],
      'api-guide/gpu/gpu-resources.md': [
        'Outcome',
        'Resource families',
        'Complete lifecycle',
        'Creation map',
        'Ownership questions to answer',
        'Common mistakes',
        'Next steps'
      ],
      'api-guide/gpu/gpu-memory.md': [
        'Outcome',
        'Mental model',
        'Allocate for the durable contract',
        'Upload without stalling the frame',
        'Keep intermediate results GPU-resident',
        'Read back deliberately',
        'Decisions and tradeoffs',
        'Common mistakes',
        'Next steps'
      ],
      'api-guide/engine/engine.md': [
        'Outcome',
        'Mental model',
        'Complete workflow',
        'A minimal rendering shape',
        'Choose the next page',
        'Decisions and tradeoffs',
        'Common mistakes',
        'Next steps'
      ],
      'api-guide/engine/redraw.md': [
        'Outcome',
        'Mental model',
        'Complete workflow',
        'What should invalidate the image?',
        'Decisions and tradeoffs',
        'Common mistakes',
        'Related pages'
      ],
      'api-guide/engine/interactivity.md': [
        'Outcome',
        'Mental model',
        'Camera interaction',
        'GPU picking workflow',
        'Immediate highlighting',
        'GPU versus CPU picking',
        'Decisions and tradeoffs',
        'Common mistakes',
        'Related pages'
      ],
      'api-guide/engine/transforms.md': [
        'Outcome',
        'Mental model',
        'WebGPU: `Computation`',
        'WebGL 2: `BufferTransform`',
        'Texture transforms and compatibility',
        'When the operation becomes a graph',
        'Decisions and tradeoffs',
        'Common mistakes',
        'Related pages'
      ]
    } as const;

    for (const [relativeFilename, headings] of Object.entries(guideContracts)) {
      const source = readFileSync(path.join(DOCUMENTATION_DIRECTORY, relativeFilename), 'utf8');
      expect(source, `${relativeFilename} needs search metadata`).toMatch(
        /^---[\s\S]*?^description:\s+\S.*$[\s\S]*?^---$/m
      );

      let previousOffset = -1;
      for (const heading of headings) {
        const offset = source.indexOf(`## ${heading}`);
        expect(offset, `${relativeFilename} is missing or misorders ${heading}`).toBeGreaterThan(
          previousOffset
        );
        previousOffset = offset;
      }
    }
  });
});

function resolveDocumentationHref(href: string): string | null {
  const relativePath = href.replace(/^\/docs\//, '');
  const candidates = [
    path.join(DOCUMENTATION_DIRECTORY, `${relativePath}.md`),
    path.join(DOCUMENTATION_DIRECTORY, `${relativePath}.mdx`),
    path.join(DOCUMENTATION_DIRECTORY, relativePath, `${path.basename(relativePath)}.md`),
    path.join(DOCUMENTATION_DIRECTORY, relativePath, `${path.basename(relativePath)}.mdx`),
    path.join(DOCUMENTATION_DIRECTORY, relativePath, 'README.md'),
    path.join(DOCUMENTATION_DIRECTORY, relativePath, 'README.mdx')
  ];
  return candidates.find(candidate => existsSync(candidate)) ?? null;
}

function getTableOfContentsIdentifier(filename: string): string {
  return path
    .relative(DOCUMENTATION_DIRECTORY, filename)
    .replace(/\.(md|mdx)$/, '')
    .split(path.sep)
    .join('/');
}
