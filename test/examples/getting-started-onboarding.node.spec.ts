// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {existsSync, readFileSync, statSync} from 'node:fs';
import path from 'node:path';
import {describe, expect, test} from 'vitest';

const ONBOARDING_SOURCE_PATH = path.join(process.cwd(), 'docs/getting-started.mdx');
const INSTALLATION_SOURCE_PATH = path.join(process.cwd(), 'docs/developer-guide/installing.md');
const EXAMPLE_IMAGES_DIRECTORY = path.join(process.cwd(), 'website/static/images/examples');
const EXAMPLE_CONTENT_DIRECTORY = path.join(process.cwd(), 'website/content/examples');
const EXTRACTION_CHECKER_PATH = path.join(process.cwd(), 'website/scripts/check-llm-output.mjs');
const WEBSITE_STYLES_PATH = path.join(process.cwd(), 'website/src/custom.css');
const DEVELOPER_DOCS_TABS_SOURCE_PATH = path.join(
  process.cwd(),
  'website/src/components/docs/developer-docs-tabs.tsx'
);
const TUTORIAL_DOCS_TABS_SOURCE_PATH = path.join(
  process.cwd(),
  'website/src/components/docs/tutorial-docs-tabs.tsx'
);
const DOCUMENTATION_TABLE_OF_CONTENTS_PATH = path.join(
  process.cwd(),
  'docs/table-of-contents.json'
);

describe('getting-started onboarding', () => {
  test('introduces real, immediately explorable GPU experiences before technical setup', () => {
    const onboardingSource = readFileSync(ONBOARDING_SOURCE_PATH, 'utf8');
    const installationLinkOffset = onboardingSource.indexOf('/docs/developer-guide/installing');

    expect(onboardingSource).toMatch(/<h1\b|^#\s+.+/m);
    expect(onboardingSource).toMatch(/WebGPU/);
    expect(onboardingSource).toMatch(/simulation|rendering|visual effects/i);
    expect(onboardingSource).toMatch(/no installation\.\s*no account\.\s*just your browser/i);
    expect(installationLinkOffset).toBeGreaterThan(0);
    expect(onboardingSource).not.toMatch(/\bNode(?:\.js)?\b/i);
    expect(onboardingSource).not.toMatch(/^#{2,}\s+Prerequisites\b/im);
    expect(onboardingSource).not.toMatch(
      /(?:^|\n)\s*(?:npm|yarn|pnpm)\s+(?:create|install|add|run|dev)\b/i
    );

    const onboardingPosters = Array.from(
      onboardingSource.matchAll(
        /<OnboardingPoster\b(?=[^>]*\bimage\s*=\s*["']([^"']+\.(?:jpe?g|png|webp))["'])[^>]*>/g
      ),
      match => ({image: match[1], offset: match.index ?? -1})
    );
    const linkedExampleRoutes = new Set(
      Array.from(
        onboardingSource.matchAll(
          /<(?:Link|a)\b(?=[^>]*\b(?:to|href)\s*=\s*["'](\/examples\/[^"']+)["'])[^>]*>/g
        ),
        match => match[1]
      )
    );

    expect(new Set(onboardingPosters.map(poster => poster.image)).size).toBeGreaterThanOrEqual(6);

    for (const poster of onboardingPosters) {
      const posterPath = path.join(EXAMPLE_IMAGES_DIRECTORY, poster.image);
      const exampleIdentifier = poster.image.replace(/\.(?:jpe?g|png|webp)$/i, '');
      const exampleRoute = `/examples/${exampleIdentifier}`;

      expect(poster.offset, `${poster.image} must appear before local setup`).toBeLessThan(
        installationLinkOffset
      );
      expect(existsSync(posterPath), `${poster.image} must be a real example screenshot`).toBe(
        true
      );
      expect(statSync(posterPath).size, `${poster.image} must not be empty`).toBeGreaterThan(0);
      expect(
        linkedExampleRoutes.has(exampleRoute),
        `${poster.image} must link to its interactive example`
      ).toBe(true);
      expect(
        existsSync(path.join(EXAMPLE_CONTENT_DIRECTORY, `${exampleIdentifier}.mdx`)),
        `${exampleRoute} must resolve to a live example page`
      ).toBe(true);
    }
  });

  test('preserves the complete runnable setup in the dedicated installation guide', () => {
    const installationSource = readFileSync(INSTALLATION_SOURCE_PATH, 'utf8');
    const developerTabsSource = readFileSync(DEVELOPER_DOCS_TABS_SOURCE_PATH, 'utf8');

    expect(installationSource).toMatch(/^# Installing$/m);
    expect(installationSource).toContain('<DeveloperDocsTabs active="installing" />');
    expect(developerTabsSource).toMatch(
      /id:\s*'installing',\s*label:\s*'Installing',\s*href:\s*'\/docs\/developer-guide\/installing'/
    );
    expect(installationSource).toMatch(/^## A Minimal Install$/m);
    expect(installationSource).toMatch(/^## A Typical Install$/m);
    expect(installationSource).toMatch(/\bNode\.js\b/);

    for (const requiredSetup of [
      'npm create vite@latest luma-demo -- --template vanilla-ts',
      'yarn create vite luma-demo --template vanilla-ts',
      'pnpm create vite luma-demo --template vanilla-ts',
      'npm install @luma.gl/engine @luma.gl/webgpu @luma.gl/webgl',
      'yarn add @luma.gl/engine @luma.gl/webgpu @luma.gl/webgl',
      'pnpm add @luma.gl/engine @luma.gl/webgpu @luma.gl/webgl',
      'npm run dev',
      'yarn dev',
      'pnpm dev',
      'class App extends AnimationLoopTemplate',
      'adapters: [webgpuAdapter, webgl2Adapter]',
      '## How Backend Selection Works',
      '## Troubleshooting',
      '### The Canvas Is Blank',
      '### WebGPU Is Unavailable',
      '### TypeScript Cannot Resolve a Package'
    ]) {
      expect(installationSource, `The installation guide must retain ${requiredSetup}`).toContain(
        requiredSetup
      );
    }

    expect(installationSource).not.toMatch(/<(?:Tabs|TabItem)\b/);
  });

  test('connects live discovery to accurate backend choices, learning paths, and optional setup', () => {
    const onboardingSource = readFileSync(ONBOARDING_SOURCE_PATH, 'utf8');
    const featureOffset = onboardingSource.indexOf('01 · Find your building blocks');
    const discoveryOffset = onboardingSource.indexOf('02 · See it in motion');
    const capabilityOffset = onboardingSource.indexOf('03 · Built for ambitious ideas');
    const learningPathOffset = onboardingSource.indexOf('04 · Find your starting point');
    const projectSetupOffset = onboardingSource.indexOf('/docs/developer-guide/installing');

    expect(featureOffset).toBeGreaterThan(0);
    expect(discoveryOffset).toBeGreaterThan(featureOffset);
    expect(capabilityOffset).toBeGreaterThan(discoveryOffset);
    expect(learningPathOffset).toBeGreaterThan(capabilityOffset);
    expect(projectSetupOffset).toBeGreaterThan(learningPathOffset);

    for (const feature of [
      {
        modifier: 'splats',
        packageName: '@luma.gl/splats',
        title: 'Gaussian Splats',
        image: 'showcase/gaussian-splats.jpg',
        route: '/examples/showcase/gaussian-splats'
      },
      {
        modifier: 'anari',
        packageName: '@luma.gl/anari',
        title: 'Declarative 3D Scenes',
        image: 'experimental/anari-playground.jpg',
        route: '/examples/experimental/anari-playground'
      },
      {
        modifier: 'graph',
        packageName: 'GPU Command Graph',
        title: 'GPU Graph',
        image: 'experimental/gpu-trace-viewer.jpg',
        route: '/examples/experimental/gpu-trace-viewer'
      }
    ]) {
      const cardOffset = onboardingSource.indexOf(`luma-onboarding__feature--${feature.modifier}`);
      const cardStart = onboardingSource.lastIndexOf('<Link', cardOffset);
      const cardEnd = onboardingSource.indexOf('</Link>', cardOffset);

      expect(cardOffset, `${feature.packageName} must have a feature card`).toBeGreaterThan(
        featureOffset
      );
      expect(
        cardOffset,
        `${feature.packageName} must appear before the example gallery`
      ).toBeLessThan(discoveryOffset);
      expect(cardStart, `${feature.packageName} must use an interactive link`).toBeGreaterThan(
        featureOffset
      );
      expect(cardEnd, `${feature.packageName} must retain a complete linked card`).toBeGreaterThan(
        cardOffset
      );

      const featureCard = onboardingSource.slice(cardStart, cardEnd);
      expect(featureCard).toContain(`to="${feature.route}"`);
      expect(featureCard).toContain(`image="${feature.image}"`);
      expect(featureCard).toContain(feature.packageName);
      expect(featureCard).toContain(feature.title);
    }

    expect(onboardingSource).toContain('Advanced scenes require WebGPU');
    expect(onboardingSource).toContain('Effects: Image Processing also runs on WebGL2');
    expect(onboardingSource).toContain('Share portable rendering across WebGPU and WebGL2');
    expect(onboardingSource).toContain('use WebGPU for compute shaders');

    for (const learningPath of [
      '/docs/tutorials/hello-triangle',
      '/docs/api-guide/engine',
      '/docs/api-guide/gpu/gpu-data-processing',
      '/docs/api-guide/shaders/shader-passes'
    ]) {
      expect(onboardingSource, `${learningPath} must remain an available learning path`).toContain(
        learningPath
      );
    }

    expect(onboardingSource).toContain('the developer guide takes you from local project setup');
    expect(onboardingSource).toContain('Build your first project');
  });

  test('keeps tutorial and developer navigation consistent with the onboarding journey', () => {
    const tutorialTabsSource = readFileSync(TUTORIAL_DOCS_TABS_SOURCE_PATH, 'utf8');
    const websiteStyles = readFileSync(WEBSITE_STYLES_PATH, 'utf8');
    const tableOfContents = JSON.parse(
      readFileSync(DOCUMENTATION_TABLE_OF_CONTENTS_PATH, 'utf8')
    ) as Array<string | {label?: string; items?: string[]}>;
    const developerGuide = tableOfContents.find(
      (item): item is {label: string; items: string[]} =>
        typeof item !== 'string' && item.label === 'Developer Guide' && Array.isArray(item.items)
    );

    expect(tutorialTabsSource).toMatch(
      /id:\s*'setup',\s*label:\s*'Overview',\s*href:\s*'\/docs\/tutorials'/
    );
    expect(tutorialTabsSource).not.toMatch(/label:\s*'Setup'/);
    expect(websiteStyles).toContain('.container:has(.luma-example-page):not(:has(> .row))');
    expect(developerGuide?.items.slice(0, 3)).toEqual([
      'developer-guide/README',
      'developer-guide/installing',
      'developer-guide/working-with-ai'
    ]);
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
    const documentationOverview = readFileSync(path.join(process.cwd(), 'docs/README.mdx'), 'utf8');
    const tutorialOverview = readFileSync(
      path.join(process.cwd(), 'docs/tutorials/README.mdx'),
      'utf8'
    );
    const helloTriangle = readFileSync(
      path.join(process.cwd(), 'docs/tutorials/hello-triangle.mdx'),
      'utf8'
    );

    expect(documentationOverview).toContain('Discover what you can build');
    expect(documentationOverview).toContain('No installation required');
    for (const documentationSource of [documentationOverview, tutorialOverview, helloTriangle]) {
      expect(documentationSource).toContain('/docs/getting-started');
      expect(documentationSource).toContain('/docs/developer-guide/installing');
    }
  });
});
