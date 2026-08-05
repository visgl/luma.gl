// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {describe, expect, test} from 'vitest';

const DOCUMENTATION_DIRECTORY = path.join(process.cwd(), 'docs');
const CAPABILITIES_SOURCE_PATH = path.join(DOCUMENTATION_DIRECTORY, 'capabilities.mdx');
const EXAMPLE_CONTENT_DIRECTORY = path.join(process.cwd(), 'website/content/examples');
const FRAMEWORK_PACKAGE_NAMES = [
  '@luma.gl/core',
  '@luma.gl/webgpu',
  '@luma.gl/webgl',
  '@luma.gl/engine',
  '@luma.gl/shadertools',
  '@luma.gl/effects',
  '@luma.gl/anari',
  '@luma.gl/gltf',
  '@luma.gl/splats',
  '@luma.gl/gpgpu',
  '@luma.gl/tables',
  '@luma.gl/arrow',
  '@luma.gl/experimental'
] as const;

describe('framework capabilities documentation', () => {
  test('introduces an official, noncomparative capabilities page', () => {
    expect(existsSync(CAPABILITIES_SOURCE_PATH)).toBe(true);

    const capabilitiesSource = readCapabilitiesSource();

    expect(capabilitiesSource).toMatch(/^---\s*\n[\s\S]*?^---\s*$/m);
    expect(capabilitiesSource).toMatch(/^title:\s*(?:Framework\s+)?Capabilities\s*$/im);
    expect(capabilitiesSource).toMatch(/^description:\s*.+$/m);
    expect(capabilitiesSource).toMatch(/^#\s+.+$/m);
    expect(capabilitiesSource).not.toMatch(/\b(?:three\.js|threejs|babylon(?:\.js)?)\b/i);
  });

  test('presents every major framework layer and its actual package boundary', () => {
    const capabilitiesSource = readCapabilitiesSource();

    for (const packageName of FRAMEWORK_PACKAGE_NAMES) {
      expect(capabilitiesSource, `${packageName} must remain discoverable`).toContain(packageName);
    }

    expect(capabilitiesSource).toMatch(/WebGPU/);
    expect(capabilitiesSource).toMatch(/WebGL\s*2|WebGL2/);
    expect(capabilitiesSource).toMatch(/compute\s+shader/i);
    expect(capabilitiesSource).toMatch(/shader\s+module/i);
    expect(capabilitiesSource).toMatch(/\bANARI\b/i);
    expect(capabilitiesSource).toMatch(/Gaussian\s+splat/i);
    expect(capabilitiesSource).toMatch(/Apache\s+Arrow/i);
    expect(capabilitiesSource).toMatch(/command[\s-]+graph/i);
    expect(capabilitiesSource).toMatch(/\bglTF\b/);
  });

  test('accurately scopes shared glTF, material, animation, and ANARI capabilities', () => {
    const capabilitiesSource = readCapabilitiesSource();
    const anariGuide = readFileSync(
      path.join(DOCUMENTATION_DIRECTORY, 'api-guide/engine/anari-rendering.md'),
      'utf8'
    );
    const ownershipDescription = capabilitiesSource.match(/ownership\s+boundaries[\s\S]*?\n\n/i);

    expect(ownershipDescription).not.toBeNull();
    for (const packageName of ['gltf', 'shadertools', 'engine', 'experimental', 'anari']) {
      expect(ownershipDescription![0]).toContain(`@luma.gl/${packageName}`);
    }

    for (const capability of [
      /joint[\s-]+(?:driven[\s-]+)?skinning/i,
      /cross[\s-]*fade/i,
      /interpolation/i,
      /KHR_animation_pointer/,
      /\bDraco\b/i,
      /\bMeshopt\b/i,
      /\bBasis(?:\s+Universal)?\b/i,
      /clearcoat/i,
      /sheen/i,
      /iridescen(?:ce|t)/i,
      /anisotrop(?:y|ic)/i,
      /transmission[\s\S]{0,100}approximat(?:ion|ions|e)/i,
      /@luma\.gl\/arrow[\s\S]{0,80}private/i
    ]) {
      expect(capabilitiesSource, `The shared asset overview must explain ${capability}`).toMatch(
        capability
      );
    }

    expect(anariGuide).not.toMatch(/\bnot\s+skinning\s+or\s+animations\b/i);
    expect(anariGuide).toMatch(/transform[\s\S]{0,80}texture[\s-]+coordinate\s+animation/i);
    expect(anariGuide).toMatch(
      /skeletal\s+animation[\s\S]{0,100}morph\s+targets[\s\S]{0,100}not\s+yet\s+supported/i
    );
  });

  test('describes rendering, simulation, visualization, compute, and immersive capabilities', () => {
    const capabilitiesSource = readCapabilitiesSource();

    for (const capability of [
      /physically\s+based|\bPBR\b/i,
      /\bHDR\b|high[\s-]+dynamic[\s-]+range/i,
      /deferred|clustered/i,
      /shadow/i,
      /reflection/i,
      /post[\s-]*processing|visual\s+effects/i,
      /ocean/i,
      /caustic/i,
      /fluid|liquid/i,
      /fire/i,
      /(?:GPU|graphics)[\s-]+(?:table|data)/i,
      /sort|filter|histogram/i,
      /\bWebXR\b/i,
      /\bVR\b/i,
      /\bAR\b/i
    ]) {
      expect(
        capabilitiesSource,
        `${capability} must have an accurate capability description`
      ).toMatch(capability);
    }
  });

  test('links capability claims to real interactive examples', () => {
    const capabilitiesSource = readCapabilitiesSource();
    const exampleIdentifiers = new Set(
      Array.from(
        capabilitiesSource.matchAll(/\/examples\/((?:showcase|experimental|deck|v10)\/[\w-]+)/g),
        match => match[1]
      )
    );

    expect(exampleIdentifiers.size).toBeGreaterThanOrEqual(6);

    for (const exampleIdentifier of exampleIdentifiers) {
      expect(
        existsSync(path.join(EXAMPLE_CONTENT_DIRECTORY, `${exampleIdentifier}.mdx`)),
        `${exampleIdentifier} must resolve to a real live example`
      ).toBe(true);
    }
  });

  test('distinguishes shipped capabilities, experimental packages, and actual simulation dimensionality', () => {
    const capabilitiesSource = readCapabilitiesSource();

    expect(capabilitiesSource).toMatch(/\bexperimental\b/i);
    expect(capabilitiesSource).toMatch(/not\s+(?:yet\s+)?published|private\s+package/i);
    expect(capabilitiesSource).toMatch(
      /(?:two[\s-]+dimensional|2D)[\s\S]{0,120}(?:MLS[\s-]*MPM|fluid|liquid)|(?:MLS[\s-]*MPM|fluid|liquid)[\s\S]{0,120}(?:two[\s-]+dimensional|2D)/i
    );
    expect(capabilitiesSource).toMatch(
      /(?:three[\s-]+dimensional|3D)[\s\S]{0,120}fire|fire[\s\S]{0,120}(?:three[\s-]+dimensional|3D)/i
    );
    expect(capabilitiesSource).toMatch(
      /WebGPU[\s\S]{0,120}(?:only|requir(?:e|ed|es))|requir(?:e|ed|es)\s+(?:compatible\s+)?WebGPU/i
    );
  });

  test('acknowledges meaningful gaps without presenting future work as existing functionality', () => {
    const capabilitiesSource = readCapabilitiesSource();

    expect(capabilitiesSource).toMatch(/scientific\s+volume/i);
    expect(capabilitiesSource).toMatch(
      /(?:three[\s-]+dimensional|3D)[\s\S]{0,50}(?:liquid|fluid)|(?:liquid|fluid)[\s\S]{0,50}(?:three[\s-]+dimensional|3D)/i
    );
    expect(capabilitiesSource).toMatch(/cloth|soft[\s-]+body/i);
    expect(capabilitiesSource).toMatch(/path[\s-]+trac(?:e|ing)|ray[\s-]+trac(?:e|ing)/i);
  });

  test('connects the capabilities page to introductory documentation and the primary sidebar', () => {
    const documentationTableOfContents = JSON.parse(
      readFileSync(path.join(DOCUMENTATION_DIRECTORY, 'table-of-contents.json'), 'utf8')
    ) as Array<string | {label?: string}>;
    const gettingStartedIndex = documentationTableOfContents.indexOf('getting-started');
    const documentationOverview = readFileSync(
      path.join(DOCUMENTATION_DIRECTORY, 'README.mdx'),
      'utf8'
    );
    const gettingStartedSource = readFileSync(
      path.join(DOCUMENTATION_DIRECTORY, 'getting-started.mdx'),
      'utf8'
    );

    expect(gettingStartedIndex).toBeGreaterThanOrEqual(0);
    expect(documentationTableOfContents[gettingStartedIndex + 1]).toBe('capabilities');
    expect(documentationOverview).toContain('/docs/capabilities');
    expect(gettingStartedSource).toContain('/docs/capabilities');
  });

  test('keeps the framework overview discoverable in generated AI-readable documentation', () => {
    const websiteConfiguration = readFileSync(
      path.join(process.cwd(), 'website/docusaurus.config.js'),
      'utf8'
    );
    const extractionChecker = readFileSync(
      path.join(process.cwd(), 'website/scripts/check-llm-output.mjs'),
      'utf8'
    );
    const includeOrder = websiteConfiguration.match(/includeOrder:\s*\[([\s\S]*?)\]/);
    const requiredIndexLinks = extractionChecker.match(
      /const\s+requiredIndexLinks\s*=\s*\[([\s\S]*?)\]/
    );

    expect(includeOrder).not.toBeNull();
    expect(requiredIndexLinks).not.toBeNull();

    const includedRoutes = Array.from(
      includeOrder![1].matchAll(/['"]([^'"]+)['"]/g),
      match => match[1]
    );
    const gettingStartedIndex = includedRoutes.indexOf('/docs/getting-started');

    expect(gettingStartedIndex).toBeGreaterThanOrEqual(0);
    expect(includedRoutes[gettingStartedIndex + 1]).toBe('/docs/capabilities');
    expect(requiredIndexLinks![1]).toMatch(/['"]docs\/capabilities\.md['"]/);
    expect(extractionChecker).toMatch(/requireFile\(\s*['"]docs\/capabilities\.md['"]\s*\)/);
  });
});

function readCapabilitiesSource(): string {
  return readFileSync(CAPABILITIES_SOURCE_PATH, 'utf8');
}
