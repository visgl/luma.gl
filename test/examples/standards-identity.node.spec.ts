// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {readFileSync, statSync} from 'node:fs';
import path from 'node:path';
import {compile} from '@mdx-js/mdx';
import {describe, expect, test} from 'vitest';

const STANDARDS_ASSET_DIRECTORY = path.join(process.cwd(), 'website/static/img/standards');
const CAPABILITIES_SOURCE_PATH = path.join(process.cwd(), 'docs/capabilities.mdx');
const WEBSITE_STYLES_PATH = path.join(process.cwd(), 'website/src/custom.css');
const ASSET_ATTRIBUTION_PATH = path.join(STANDARDS_ASSET_DIRECTORY, 'README.md');

const OFFICIAL_STANDARDS_ASSETS = [
  {
    fileName: 'anari.svg',
    owner: 'KhronosGroup/ANARI-Docs',
    viewBox: '0 0 1500 500',
    brandColor: '#487A90'
  },
  {
    fileName: 'gltf.svg',
    owner: 'KhronosGroup/glTF-External-Reference',
    viewBox: '0 0 1000 500',
    brandColor: '#86C540'
  },
  {
    fileName: 'webgl.svg',
    owner: 'KhronosGroup/WebGL',
    viewBox: '0 0 1200 500',
    brandColor: '#900'
  },
  {
    fileName: 'webgpu.svg',
    owner: 'gpuweb/gpuweb',
    viewBox: '0 0 932 315',
    brandColor: '#005a9c'
  }
] as const;

describe('standards identity and accessible module branding', () => {
  test('ships intact, attributed Khronos and W3C vector marks', () => {
    const attributionSource = readFileSync(ASSET_ATTRIBUTION_PATH, 'utf8');

    for (const asset of OFFICIAL_STANDARDS_ASSETS) {
      const assetPath = path.join(STANDARDS_ASSET_DIRECTORY, asset.fileName);
      const source = readFileSync(assetPath, 'utf8');

      expect(
        statSync(assetPath).size,
        `${asset.fileName} must be a real vector mark`
      ).toBeGreaterThan(1000);
      expect(source).toMatch(/<svg\b/i);
      expect(source).toContain(`viewBox="${asset.viewBox}"`);
      expect(source).toContain(asset.brandColor);
      expect(attributionSource).toContain(asset.fileName);
      expect(attributionSource).toContain(asset.owner);
    }

    expect(attributionSource).toContain('Khronos trademark and logo usage');
    expect(attributionSource).toContain('WebGPU logo by the World Wide Web Consortium');
    expect(attributionSource).toContain('Creative Commons Attribution 4.0 International');
    expect(attributionSource).toMatch(/do not imply\s+endorsement, certification, conformance/i);
  });

  test('preserves the original transparent Pixar OpenUSD image and qualified support claim', () => {
    const image = readFileSync(path.join(STANDARDS_ASSET_DIRECTORY, 'openusd.png'));
    const attributionSource = readFileSync(ASSET_ATTRIBUTION_PATH, 'utf8');

    expect(Array.from(image.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(image.readUInt32BE(16)).toBe(702);
    expect(image.readUInt32BE(20)).toBe(332);
    expect(image[25]).toBe(6);
    expect(attributionSource).toContain('PixarAnimationStudios/OpenUSD');
    expect(attributionSource).toContain('experimental OpenUSD import');
    expect(attributionSource).toContain('does not imply endorsement');
  });

  test('identifies both portable graphics backends on the core module card', () => {
    const coreCard = readModuleCard('/docs/api-reference/core');

    expect(readCardLogos(coreCard)).toEqual(['WebGPU', 'WebGL']);
    expect(coreCard).toContain('/img/standards/webgpu.svg');
    expect(coreCard).toContain('/img/standards/webgl.svg');
    expect(coreCard).toContain('aria-label="Supported graphics backends"');
  });

  test('presents ANARI as the primary scene mark with smaller glTF and OpenUSD format marks', () => {
    const sceneCard = readModuleCard('/docs/api-reference/anari');

    expect(readCardLogos(sceneCard)).toEqual(['ANARI', 'glTF', 'OpenUSD']);
    expect(readLogoClasses(sceneCard, 'ANARI')).toContain('docs-api-card__logo--primary');
    expect(readLogoClasses(sceneCard, 'glTF')).toContain('docs-api-card__logo--secondary');
    expect(readLogoClasses(sceneCard, 'OpenUSD')).toContain('docs-api-card__logo--secondary');
    expect(readLogoClasses(sceneCard, 'OpenUSD')).toContain('docs-api-card__logo--on-dark');
    expect(sceneCard).toContain('<strong>ANARI / Scene API</strong>');
    expect(sceneCard).toContain('experimental OpenUSD import');
    expect(sceneCard).toContain('not an ANARI-conformant implementation');
  });

  test('presents glTF as the primary format mark with smaller portable backend marks', () => {
    const assetCard = readModuleCard('/docs/api-reference/gltf');

    expect(readCardLogos(assetCard)).toEqual(['glTF', 'WebGPU', 'WebGL']);
    expect(readLogoClasses(assetCard, 'glTF')).toContain('docs-api-card__logo--primary');
    expect(readLogoClasses(assetCard, 'WebGPU')).toContain('docs-api-card__logo--secondary');
    expect(readLogoClasses(assetCard, 'WebGL')).toContain('docs-api-card__logo--secondary');
  });

  test('provides visible W3C attribution outside linked cards without nesting interactive links', () => {
    const capabilitiesSource = readFileSync(CAPABILITIES_SOURCE_PATH, 'utf8');
    const attribution = capabilitiesSource.match(
      /<div className="docs-api-card__attribution">([\s\S]*?)<\/div>/
    )?.[1];

    expect(attribution).toBeDefined();
    expect(attribution).toContain('WebGPU logo by');
    expect(attribution).toContain('href="https://www.w3.org/"');
    expect(attribution).toContain('href="https://creativecommons.org/licenses/by/4.0/"');
    expect(attribution).toContain('do not imply endorsement, certification, or conformance');

    for (const route of [
      '/docs/api-reference/core',
      '/docs/api-reference/anari',
      '/docs/api-reference/gltf'
    ]) {
      expect(readModuleCard(route)).not.toMatch(/<a\b/);
    }
  });

  test('preserves original mark colors, aspect ratios, visible light backgrounds, and dark themes', () => {
    const styles = readFileSync(WEBSITE_STYLES_PATH, 'utf8');
    const logoStyle = styles.match(/\.markdown \.docs-api-card__logo\s*\{([^}]+)\}/)?.[1];

    expect(logoStyle).toContain('object-fit: contain');
    expect(logoStyle).toContain('width: auto');
    expect(styles).toContain('.docs-api-card__logo--primary');
    expect(styles).toContain('.docs-api-card__logo--secondary');
    expect(styles).toContain('.docs-api-card__logo--on-light');
    expect(styles).toContain('.docs-api-card__logo--on-dark');
    expect(styles).toContain('html[data-theme="dark"] .markdown .docs-api-card__attribution');
    expect(logoStyle).not.toMatch(/filter\s*:|invert\(/);
    expect(readFileSync(path.join(STANDARDS_ASSET_DIRECTORY, 'webgpu.svg'), 'utf8')).toContain(
      '@media (prefers-color-scheme: dark)'
    );
  });

  test('compiles the branded capabilities page as valid MDX', async () => {
    const capabilitiesSource = readFileSync(CAPABILITIES_SOURCE_PATH, 'utf8');
    const compiledPage = await compile(capabilitiesSource, {development: true});

    expect(String(compiledPage)).toContain('docs-api-card__logos');
    expect(String(compiledPage)).toContain('ANARI / Scene API');
  });
});

function readModuleCard(route: string): string {
  const capabilitiesSource = readFileSync(CAPABILITIES_SOURCE_PATH, 'utf8');
  const cards = Array.from(
    capabilitiesSource.matchAll(/<a className="docs-api-card" href="([^"]+)">([\s\S]*?)<\/a>/g)
  );
  const matchingCard = cards.find(card => card[1] === route);

  expect(matchingCard, `${route} must retain an accessible linked module card`).toBeDefined();
  return matchingCard![2];
}

function readCardLogos(card: string): string[] {
  return Array.from(card.matchAll(/<img\b[\s\S]*?alt="([^"]+)"[\s\S]*?\/>/g), match => match[1]);
}

function readLogoClasses(card: string, alternativeText: string): string {
  const logos = Array.from(
    card.matchAll(/<img\b[\s\S]*?className="([^"]+)"[\s\S]*?alt="([^"]+)"[\s\S]*?\/>/g)
  );
  const matchingLogo = logos.find(logo => logo[2] === alternativeText);

  expect(matchingLogo, `${alternativeText} must include an accessible standard logo`).toBeDefined();
  return matchingLogo![1];
}
