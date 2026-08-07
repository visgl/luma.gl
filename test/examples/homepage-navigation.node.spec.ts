// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {describe, expect, test} from 'vitest';

type ExampleSidebarEntry =
  | string
  | {type: 'doc'; id: string; label?: string}
  | {type: 'category'; label: string; items: ExampleSidebarEntry[]};

const HOMEPAGE_SOURCE_PATH = path.join(process.cwd(), 'website/src/pages/index.jsx');
const HOMEPAGE_STYLES_PATH = path.join(process.cwd(), 'website/src/pages/index.module.css');
const WEBSITE_CONFIGURATION_PATH = path.join(process.cwd(), 'website/docusaurus.config.js');
const EXAMPLE_CARD_SOURCE_PATH = path.join(
  process.cwd(),
  'website/src/components/example-card.tsx'
);
const EXAMPLES_INDEX_SOURCE_PATH = path.join(
  process.cwd(),
  'website/src/components/examples-index.tsx'
);
const COMMUNITY_SHOWCASE_SOURCE_PATH = path.join(process.cwd(), 'website/src/pages/showcase.tsx');
const EXAMPLE_CONTENT_DIRECTORY = path.join(process.cwd(), 'website/content/examples');
const MINIMUM_PRIMARY_ACTION_CONTRAST = 7;

describe('homepage navigation', () => {
  test('routes both getting-started actions to the canonical, base-aware documentation page', () => {
    const homepageSource = readFileSync(HOMEPAGE_SOURCE_PATH, 'utf8');

    expect(homepageSource).toMatch(
      /const\s+gettingStartedUrl\s*=\s*useBaseUrl\(\s*['"]\/docs\/getting-started['"]\s*\)/
    );
    expect(existsSync(path.join(process.cwd(), 'docs/getting-started.mdx'))).toBe(true);

    const gettingStartedActions = Array.from(
      homepageSource.matchAll(
        /<(?:a|Link)\b(?=[^>]*\bclassName=\{styles\.(primaryAction|closingAction)\})(?=[^>]*\b(?:href|to)=\{gettingStartedUrl\})[^>]*>/g
      ),
      match => match[1]
    );

    expect(gettingStartedActions).toEqual(['primaryAction', 'closingAction']);
  });

  test('introduces getting started as a zero-install guided discovery experience', () => {
    const homepageSource = readFileSync(HOMEPAGE_SOURCE_PATH, 'utf8');
    const websiteConfiguration = readFileSync(WEBSITE_CONFIGURATION_PATH, 'utf8');
    const homepageStyles = readFileSync(HOMEPAGE_STYLES_PATH, 'utf8');
    const projectNameRule = homepageStyles.match(/\.projectName\s*\{([^}]*)\}/);

    expect(websiteConfiguration).toContain('WebGPU and WebGL2 for visualization and compute');
    expect(websiteConfiguration).not.toContain('WebGPU and WebGL2 API for visualization');
    expect(homepageSource).toContain('and massive data visualizations');
    expect(homepageSource).toContain('Start with a guided tour. No installation required.');
    expect(homepageSource).toContain('Explore live examples');
    expect(homepageSource).toContain('Choose your starting point');
    expect(projectNameRule).not.toBeNull();
    expect(projectNameRule![1]).toContain('letter-spacing: -0.045em;');
    expect(projectNameRule![1]).toContain('line-height: 0.96;');
  });

  test('keeps the decorative GPU hero inert while preserving clickable foreground actions', () => {
    const homepageStyles = readFileSync(HOMEPAGE_STYLES_PATH, 'utf8');
    const heroExampleRule = homepageStyles.match(/\.heroExampleContainer\s*\{([^}]*)\}/);
    const bannerContainerRule = homepageStyles.match(/\.bannerContainer\s*\{([^}]*)\}/);
    const heroActionsRule = homepageStyles.match(/\.heroActions\s*\{([^}]*)\}/);

    expect(heroExampleRule).not.toBeNull();
    expect(bannerContainerRule).not.toBeNull();
    expect(heroActionsRule).not.toBeNull();
    expect(heroExampleRule![1]).toMatch(/\bpointer-events:\s*none\s*;/);
    expect(bannerContainerRule![1]).toMatch(/\bpointer-events:\s*none\s*;/);
    expect(heroActionsRule![1]).toMatch(/\bpointer-events:\s*auto\s*;/);
  });

  test('reveals the flagship examples with an accessible, first-fold discovery cue', () => {
    const homepageSource = readFileSync(HOMEPAGE_SOURCE_PATH, 'utf8');
    const homepageStyles = readFileSync(HOMEPAGE_STYLES_PATH, 'utf8');
    const discoveryCueRule = homepageStyles.match(/\.discoveryCue\s*\{([^}]*)\}/);
    const reducedMotionStyles = homepageStyles.split('@media (prefers-reduced-motion: reduce)')[1];

    expect(homepageSource).toMatch(
      /<a\b(?=[^>]*\bclassName=\{styles\.discoveryCue\})(?=[^>]*\bhref="#flagship-examples")(?=[^>]*\baria-label="Explore the live examples and GPU capabilities below")[^>]*>/
    );
    expect(homepageSource).toContain('Explore what’s below');
    expect(homepageSource).toContain('Build with luma.gl');
    expect(homepageSource).toContain('See what your GPU can do.');
    expect(homepageSource).toMatch(
      /<span\b(?=[^>]*\bclassName=\{styles\.discoveryCueArrow\})(?=[^>]*\baria-hidden="true")[^>]*>/
    );
    expect(homepageSource).toMatch(
      /<section\b(?=[^>]*\bclassName=\{styles\.flagshipSection\})(?=[^>]*\bid="flagship-examples")[^>]*>/
    );
    expect(discoveryCueRule).not.toBeNull();
    expect(discoveryCueRule![1]).toMatch(/\bmin-height:\s*44px\s*;/);
    expect(discoveryCueRule![1]).toMatch(/\bbottom:\s*max\([^;]*100svh[^;]*\)\s*;/);
    expect(homepageStyles).toMatch(/\.discoveryCue:focus-visible\s*\{/);
    expect(homepageStyles).toMatch(
      /\.flagshipSection\s*\{[^}]*\bscroll-margin-top:\s*calc\(var\(--ifm-navbar-height/
    );
    expect(reducedMotionStyles).toMatch(/\.discoveryCueArrow\s*\{\s*animation:\s*none\s*;/);
    expect(reducedMotionStyles).toMatch(/\.discoveryCue\s*\{\s*transition:\s*none\s*;/);
  });

  test('keeps the example gallery focused on straightforward search and filtering', () => {
    const examplesIndexSource = readFileSync(EXAMPLES_INDEX_SOURCE_PATH, 'utf8');
    const examplesLandingSource = readFileSync(
      path.join(EXAMPLE_CONTENT_DIRECTORY, 'index.mdx'),
      'utf8'
    );

    expect(examplesIndexSource).toContain('aria-label="Find examples"');
    expect(examplesIndexSource).toContain('>Find examples</p>');
    expect(examplesIndexSource).toContain('Search by name, topic, graphics API, or difficulty.');
    expect(examplesIndexSource).toContain('{catalog.length} examples');
    expect(examplesIndexSource).toContain("'Featured examples'");
    expect(examplesIndexSource).not.toContain('New here?');
    expect(examplesIndexSource).not.toContain('Draw your first triangle');
    expect(examplesIndexSource).not.toContain('experiences');
    expect(examplesLandingSource).toContain('>Examples</h1>');
    expect(examplesLandingSource).not.toContain('laboratory');
    expect(examplesLandingSource).not.toContain('luma-example-catalog-capabilities');
  });

  test('continues from the community showcase into first-party discovery and live examples', () => {
    const communityShowcaseSource = readFileSync(COMMUNITY_SHOWCASE_SOURCE_PATH, 'utf8');

    expect(communityShowcaseSource).toMatch(
      /const\s+gettingStartedUrl\s*=\s*useBaseUrl\(\s*['"]\/docs\/getting-started['"]\s*\)/
    );
    expect(communityShowcaseSource).toMatch(
      /const\s+examplesUrl\s*=\s*useBaseUrl\(\s*['"]\/examples['"]\s*\)/
    );
    expect(communityShowcaseSource).toContain('Find your starting point');
    expect(communityShowcaseSource).toContain('Explore live examples');
    expect(communityShowcaseSource).toMatch(/<a\b[^>]*\bhref=\{gettingStartedUrl\}[^>]*>/);
    expect(communityShowcaseSource).toMatch(/<a\b[^>]*\bhref=\{examplesUrl\}[^>]*>/);
  });

  test('links every featured example card to a real catalog entry and documentation route', () => {
    const homepageSource = readFileSync(HOMEPAGE_SOURCE_PATH, 'utf8');
    const exampleCardSource = readFileSync(EXAMPLE_CARD_SOURCE_PATH, 'utf8');
    const featuredExamples = homepageSource.match(
      /const\s+FEATURED_EXAMPLES\s*=\s*\[([\s\S]*?)\n\];/
    );

    expect(featuredExamples).not.toBeNull();

    const featuredExampleRoutes = Array.from(
      featuredExamples![1].matchAll(/\broute:\s*['"]([^'"]+)['"]/g),
      match => match[1]
    );
    const exampleIdentifiers = readLiveExampleIdentifiers();

    expect(featuredExampleRoutes.length).toBeGreaterThan(0);
    expect(homepageSource).toMatch(
      /<ExampleCard\b[\s\S]*?\bhref=\{\s*`\$\{examplesUrl\}\/\$\{example\.route\}`\s*\}/
    );
    expect(exampleCardSource).toMatch(/<(?:a|Link)\b(?=[^>]*\b(?:href|to)=\{href\})[^>]*>/);

    for (const featuredExampleRoute of featuredExampleRoutes) {
      expect(
        exampleIdentifiers.has(featuredExampleRoute),
        `${featuredExampleRoute} must remain in the authoritative example catalog`
      ).toBe(true);
      expect(
        existsSync(path.join(EXAMPLE_CONTENT_DIRECTORY, `${featuredExampleRoute}.mdx`)),
        `${featuredExampleRoute} must resolve to an existing example documentation page`
      ).toBe(true);
    }
  });

  test('features cinematic bloom in the showcase catalog and homepage gallery', () => {
    const homepageSource = readFileSync(HOMEPAGE_SOURCE_PATH, 'utf8');
    const tableOfContents = JSON.parse(
      readFileSync(path.join(EXAMPLE_CONTENT_DIRECTORY, 'table-of-contents.json'), 'utf8')
    ) as ExampleSidebarEntry[];
    const showcaseCategory = tableOfContents.find(
      entry => typeof entry !== 'string' && entry.type === 'category' && entry.label === 'Showcase'
    );

    expect(showcaseCategory).toBeDefined();
    if (
      showcaseCategory &&
      typeof showcaseCategory !== 'string' &&
      showcaseCategory.type === 'category'
    ) {
      expect(showcaseCategory.items).toContainEqual({
        type: 'doc',
        id: 'experimental/bloom',
        label: 'Effects: Bloom'
      });
    }

    expect(homepageSource).toMatch(
      /title:\s*['"]Cinematic Bloom['"][\s\S]*?route:\s*['"]experimental\/bloom['"]/
    );
    expect(
      existsSync(path.join(process.cwd(), 'website/static/images/examples/experimental/bloom.jpg'))
    ).toBe(true);
  });

  test('maintains WCAG AAA foreground contrast for normal and highlighted primary actions', () => {
    const homepageStyles = readFileSync(HOMEPAGE_STYLES_PATH, 'utf8');
    const normalActionRule = homepageStyles.match(/\.primaryAction\s*\{([^}]*)\}/);
    const highlightedActionRule = homepageStyles.match(
      /\.primaryAction:hover\s*,\s*\.primaryAction:focus-visible\s*\{([^}]*)\}/
    );

    expect(normalActionRule).not.toBeNull();
    expect(highlightedActionRule).not.toBeNull();

    const normalForeground = readHexColorDeclaration(normalActionRule![1], 'color');
    const normalBackground = readHexColorDeclaration(normalActionRule![1], 'background');
    const highlightedForeground = readHexColorDeclaration(highlightedActionRule![1], 'color');
    const highlightedBackground = readHexColorDeclaration(highlightedActionRule![1], 'background');

    expect(
      getContrastRatio(normalForeground, normalBackground),
      'The primary homepage action must meet WCAG AAA contrast while resting'
    ).toBeGreaterThanOrEqual(MINIMUM_PRIMARY_ACTION_CONTRAST);
    expect(
      getContrastRatio(highlightedForeground, highlightedBackground),
      'The primary homepage action must meet WCAG AAA contrast while hovered or focused'
    ).toBeGreaterThanOrEqual(MINIMUM_PRIMARY_ACTION_CONTRAST);
  });
});

function readLiveExampleIdentifiers(): Set<string> {
  const tableOfContents = JSON.parse(
    readFileSync(path.join(EXAMPLE_CONTENT_DIRECTORY, 'table-of-contents.json'), 'utf8')
  ) as ExampleSidebarEntry[];
  const exampleIdentifiers = new Set<string>();

  const visitEntries = (entries: ExampleSidebarEntry[]): void => {
    for (const entry of entries) {
      if (typeof entry === 'string') {
        exampleIdentifiers.add(entry);
      } else if (entry.type === 'category') {
        visitEntries(entry.items);
      } else if (entry.id !== 'index') {
        exampleIdentifiers.add(entry.id);
      }
    }
  };

  visitEntries(tableOfContents);
  return exampleIdentifiers;
}

function readHexColorDeclaration(styleRule: string, property: 'background' | 'color'): string {
  const declaration = styleRule.match(
    new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*(#[a-fA-F\\d]{6})\\s*(?:;|$)`)
  );

  expect(declaration, `The primary action must define an opaque ${property} color`).not.toBeNull();
  return declaration![1];
}

function getContrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = getRelativeLuminance(foreground);
  const backgroundLuminance = getRelativeLuminance(background);
  const lighterLuminance = Math.max(foregroundLuminance, backgroundLuminance);
  const darkerLuminance = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighterLuminance + 0.05) / (darkerLuminance + 0.05);
}

function getRelativeLuminance(color: string): number {
  const channels = [1, 3, 5].map(offset => {
    const channel = Number.parseInt(color.slice(offset, offset + 2), 16) / 255;

    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
