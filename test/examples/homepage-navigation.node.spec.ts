// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {describe, expect, test} from 'vitest';

type ExampleSidebarEntry =
  | string
  | {type: 'doc'; id: string; label?: string}
  | {type: 'category'; label: string; items: ExampleSidebarEntry[]};

const HOMEPAGE_SOURCE_PATH = path.join(process.cwd(), 'website/src/pages/index.jsx');
const HOMEPAGE_STYLES_PATH = path.join(process.cwd(), 'website/src/pages/index.module.css');
const EXAMPLE_CARD_SOURCE_PATH = path.join(
  process.cwd(),
  'website/src/components/example-card.tsx'
);
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
