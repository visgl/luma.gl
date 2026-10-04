// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import path from 'node:path';
import {describe, expect, test} from 'vitest';

const INTRODUCTION_SOURCE_PATH = path.join(process.cwd(), 'docs/README.mdx');
const ONBOARDING_SOURCE_PATH = path.join(process.cwd(), 'docs/getting-started.mdx');

const EXTRACTION_CHECKER_PATH = path.join(process.cwd(), 'website/scripts/check-llm-output.mjs');
const WEBSITE_STYLES_PATH = path.join(process.cwd(), 'website/src/custom.css');

const TUTORIAL_DOCS_TABS_SOURCE_PATH = path.join(
  process.cwd(),
  'website/src/components/docs/tutorial-docs-tabs.tsx'
);
const DOCUMENTATION_TABLE_OF_CONTENTS_PATH = path.join(
  process.cwd(),
  'docs/table-of-contents.json'
);

describe('getting-started onboarding', () => {
  test('introduces luma and its key information', () => {
    const documentationOverview = readFileSync(INTRODUCTION_SOURCE_PATH, 'utf-8');

    expect(documentationOverview).toContain('Why luma.gl');
    expect(documentationOverview).toContain('A WebGPU-style API');
    expect(documentationOverview).toContain('Key APIs');
    expect(documentationOverview).toContain('/docs/getting-started');
  });

  test('getting started onboards a user with installation instructions and project setup', () => {
    const onboardingSource = readFileSync(ONBOARDING_SOURCE_PATH, 'utf-8');

    for (const requiredSetup of [
      'Project Setup',
      'Installation',
      'npm install @luma.gl/core @luma.gl/engine @luma.gl/webgl @luma.gl/webgpu',
      'Step 1. Render a frame',
      'Step 2. Write the shaders',
      'Step 3. Render the triangle',
      'Step 4. Putting it all together'
    ]) {
      expect(onboardingSource).toContain(requiredSetup);
    }
  });

  test('keeps tutorial and developer navigation consistent with the onboarding journey', () => {
    const tutorialTabsSource = readFileSync(TUTORIAL_DOCS_TABS_SOURCE_PATH, 'utf8');
    const websiteStyles = readFileSync(WEBSITE_STYLES_PATH, 'utf8');
    const tableOfContents = JSON.parse(
      readFileSync(DOCUMENTATION_TABLE_OF_CONTENTS_PATH, 'utf8')
    ) as Array<
      | string
      | {
          label?: string;
          items?: Array<string | {label?: string; items?: string[]}>;
        }
    >;
    const developerGuide = tableOfContents.find(
      (
        item
      ): item is {
        label: string;
        items: Array<string | {label?: string; items?: string[]}>;
      } => typeof item !== 'string' && item.label === 'Developer Guide' && Array.isArray(item.items)
    );

    expect(tutorialTabsSource).toMatch(
      /id:\s*'setup',\s*label:\s*'Overview',\s*href:\s*'\/docs\/tutorials'/
    );
    expect(tutorialTabsSource).not.toMatch(/label:\s*'Setup'/);
    expect(websiteStyles).toContain('.container:has(.luma-example-page):not(:has(> .row))');
    expect(developerGuide?.items).toEqual([
      'developer-guide/README',
      {
        type: 'category',
        label: 'Setup and contribution',
        items: [
          'developer-guide/installing',
          'developer-guide/editing',
          'developer-guide/multiple-canvases',
          'developer-guide/contributing',
          'developer-guide/documentation'
        ]
      },
      {
        type: 'category',
        label: 'Quality and delivery',
        items: [
          'developer-guide/testing',
          'developer-guide/debugging',
          'developer-guide/profiling',
          'developer-guide/bundling',
          'developer-guide/releasing',
          'developer-guide/working-with-ai'
        ]
      },
      {
        type: 'category',
        label: 'Test tooling',
        items: [
          'developer/dev-tools/llm-friendly-test-setup',
          'developer/dev-tools/playwright',
          'developer/dev-tools/browser-debug'
        ]
      }
    ]);
  });

  test('makes the complete capability overview discoverable from the getting started page', () => {
    const onboardingSource = readFileSync(ONBOARDING_SOURCE_PATH, 'utf8');
    const documentationOverview = readFileSync(path.join(process.cwd(), 'docs/README.mdx'), 'utf8');
    const tableOfContents = JSON.parse(
      readFileSync(DOCUMENTATION_TABLE_OF_CONTENTS_PATH, 'utf8')
    ) as Array<string | {label?: string; items?: string[]}>;

    expect(tableOfContents.slice(0, 3)).toEqual([
      'README',
      'getting-started',
      {
        type: 'category',
        label: 'Capabilities',
        items: [
          'capabilities',
          'capabilities/gpu-data-compute',
          'capabilities/rendering-visualization'
        ]
      }
    ]);

    expect(onboardingSource).toMatch(
      /<a\b(?=[^>]*\bclassName="docs-api-card")(?=[^>]*\bhref="\/docs\/fundamentals")[^>]*>/
    );
    expect(onboardingSource).toMatch(
      /<a\b(?=[^>]*\bclassName="docs-api-card")(?=[^>]*\bhref="\/docs\/capabilities")[^>]*>/
    );
    expect(onboardingSource).toMatch(
      /<a\b(?=[^>]*\bclassName="docs-api-card")(?=[^>]*\bhref="\/docs\/tutorials")[^>]*>/
    );
    expect(onboardingSource).toMatch(
      /<a\b(?=[^>]*\bclassName="docs-api-card")(?=[^>]*\bhref="\/docs\/capabilities")[^>]*>/
    );
    expect(onboardingSource).toMatch(
      /<a\b(?=[^>]*\bclassName="docs-api-card")(?=[^>]*\bhref="\/examples")[^>]*>/
    );
    expect(onboardingSource).toMatch(
      /<a\b(?=[^>]*\bclassName="docs-api-card")(?=[^>]*\bhref="\/docs\/api-guide")[^>]*>/
    );
    expect(onboardingSource).toMatch(
      /<a\b(?=[^>]*\bclassName="docs-api-card")(?=[^>]*\bhref="\/docs\/api-reference")[^>]*>/
    );
    expect(documentationOverview).not.toMatch(/\b(?:Three\.js|Babylon\.js)\b/i);
  });

  test('validates runnable LLM setup against Installing while keeping onboarding readable', () => {
    const extractionCheckerSource = readFileSync(EXTRACTION_CHECKER_PATH, 'utf8');

    expect(extractionCheckerSource).toContain(
      "const installingPath = requireFile('docs/developer-guide/installing.md')"
    );
    expect(extractionCheckerSource).toContain(
      "const installing = readFileSync(installingPath, 'utf8')"
    );
    expect(extractionCheckerSource).toContain('if (!installing.includes(expectedText))');
    expect(extractionCheckerSource).toContain("if (installing.includes('<DeveloperDocsTabs'))");
    expect(extractionCheckerSource).not.toContain('if (!gettingStarted.includes(expectedText))');
    expect(extractionCheckerSource).toContain('gettingStarted.trim().length');
    expect(extractionCheckerSource).toContain('unprocessed MDX components');
  });

  test('keeps discovery and local installation as separate documentation journeys', () => {
    const tutorialOverview = readFileSync(
      path.join(process.cwd(), 'docs/tutorials/README.mdx'),
      'utf8'
    );
    const helloTriangle = readFileSync(
      path.join(process.cwd(), 'docs/tutorials/hello-triangle.mdx'),
      'utf8'
    );

    for (const documentationSource of [tutorialOverview, helloTriangle]) {
      expect(documentationSource).toContain('/docs/getting-started');
      expect(documentationSource).toContain('/docs/developer-guide/installing');
    }
  });
});
