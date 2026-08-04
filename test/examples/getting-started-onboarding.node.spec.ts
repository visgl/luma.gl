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

    expect(installationSource).toMatch(/^# Installing$/m);
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

  test('validates runnable LLM setup against Installing while keeping onboarding readable', () => {
    const extractionCheckerSource = readFileSync(EXTRACTION_CHECKER_PATH, 'utf8');

    expect(extractionCheckerSource).toContain(
      "const installingPath = requireFile('docs/developer-guide/installing.md')"
    );
    expect(extractionCheckerSource).toContain(
      "const installing = readFileSync(installingPath, 'utf8')"
    );
    expect(extractionCheckerSource).toContain('if (!installing.includes(expectedText))');
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
