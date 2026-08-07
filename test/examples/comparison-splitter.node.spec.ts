// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {describe, expect, test} from 'vitest';

const EXAMPLES_DIRECTORY = path.join(process.cwd(), 'examples/experimental');
const ADVANCED_EFFECTS_DIRECTORY = path.join(EXAMPLES_DIRECTORY, 'advanced-effects');
const ANTIALIASING_DIRECTORY = path.join(EXAMPLES_DIRECTORY, 'antialiasing');
const WEBSITE_EXAMPLES_DIRECTORY = path.join(
  process.cwd(),
  'website/content/examples/experimental'
);

describe('reusable visual comparison examples', () => {
  test.each([
    ['Visualization City', ADVANCED_EFFECTS_DIRECTORY, 'advanced-effects-comparison-splitter'],
    ['Antialiasing Techniques', ANTIALIASING_DIRECTORY, 'antialiasing-comparison-splitter']
  ])('%s imports the shared splitter and uses direct manipulation', (_exampleName, directory, splitterId) => {
    const source = readFileSync(path.join(directory, 'app.ts'), 'utf8');

    expect(source).toMatch(
      /import\s*\{[^}]*\bComparisonSplitter\b[^}]*\}\s*from\s*['"]@luma\.gl\/experimental['"]/
    );
    expect(source).toMatch(/new\s+ComparisonSplitter\s*\(/);
    expect(source).toContain(`id: '${splitterId}'`);
    expect(source).toMatch(/onChange:\s*split\s*=>/);
    expect(source).not.toMatch(/name:\s*['"]split['"]/);
    expect(source).not.toMatch(/setSettingValue\s*\(\s*['"]split['"]/);
    expect(source).not.toMatch(/from\s*['"][^'"]*comparison-splitter['"]/);
  });

  test('keeps the live divider connected to both GPU comparison passes', () => {
    const citySource = readFileSync(path.join(ADVANCED_EFFECTS_DIRECTORY, 'app.ts'), 'utf8');
    const antialiasingSource = readFileSync(path.join(ANTIALIASING_DIRECTORY, 'app.ts'), 'utf8');

    expect(citySource).toContain('advancedEffectsDisplay: {split: this.settings.split, debugMode}');
    expect(citySource).toContain('texCoord.x < advancedEffectsDisplay.split');
    expect(antialiasingSource).toContain('comparison: {split: this.settings.split}');
    expect(antialiasingSource).toContain('inputs.uv.x < comparison.split');
    expect(antialiasingSource).toContain('uv.x < comparison.split');
  });

  test('preserves the dragged divider across settings-panel and preset changes', () => {
    const citySource = readFileSync(path.join(ADVANCED_EFFECTS_DIRECTORY, 'app.ts'), 'utf8');
    const antialiasingSource = readFileSync(path.join(ANTIALIASING_DIRECTORY, 'app.ts'), 'utf8');
    const citySettingsHandler = citySource.slice(citySource.indexOf('handleSettingsChange ='));

    expect(citySettingsHandler).toMatch(/const\s+split\s*=\s*this\.settings\.split/);
    expect(citySettingsHandler).toMatch(
      /\.\.\.\(nextSettings\s+as\s+AdvancedEffectsSettings\)\s*,\s*split\s*\}/
    );
    expect(citySettingsHandler).toMatch(
      /\.\.\.PRESETS\[preset\s+as\s+PresetName\]\s*,[\s\S]*?\bsplit\s*\}/
    );
    expect(antialiasingSource).toMatch(/split:\s*this\.settings\.split\s*\}/);
  });

  test('uses self-contained shared presentation instead of example-owned CSS', () => {
    const cityHtml = readFileSync(path.join(ADVANCED_EFFECTS_DIRECTORY, 'index.html'), 'utf8');
    const antialiasingSource = readFileSync(path.join(ANTIALIASING_DIRECTORY, 'app.ts'), 'utf8');

    expect(cityHtml).not.toContain('#advanced-effects-comparison-splitter');
    expect(antialiasingSource).not.toContain('COMPARISON_SPLITTER_STYLE');
    expect(antialiasingSource).not.toContain('comparisonSplitterStyle');
    expect(antialiasingSource).toContain("accentColor: '#ffdb33'");
    expect(existsSync(path.join(ADVANCED_EFFECTS_DIRECTORY, 'comparison-splitter.ts'))).toBe(false);
  });

  test('declares and resolves the shared package in the antialiasing example', () => {
    const packageJson = JSON.parse(
      readFileSync(path.join(ANTIALIASING_DIRECTORY, 'package.json'), 'utf8')
    ) as {dependencies: Record<string, string>};
    const viteConfig = readFileSync(path.join(ANTIALIASING_DIRECTORY, 'vite.config.ts'), 'utf8');

    expect(packageJson.dependencies['@luma.gl/experimental']).toBe(
      packageJson.dependencies['@luma.gl/engine']
    );
    expect(viteConfig).toMatch(/['"]@luma\.gl\/experimental['"]:\s*`/);
  });

  test.each([
    'advanced-effects.mdx',
    'antialiasing.mdx'
  ])('%s explains pointer and keyboard interaction', filename => {
    const documentation = readFileSync(path.join(WEBSITE_EXAMPLES_DIRECTORY, filename), 'utf8');

    expect(documentation).toMatch(/drag\s+the\s+(?:comparison\s+)?divider/i);
    expect(documentation).toMatch(/arrow\s+keys/i);
    expect(documentation).toMatch(/Home\s+and\s+End/);
  });
});
