// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

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
const DATA_CAPABILITIES_HEADING = '## GPU-native data, compute, and visualization';
const RENDERING_CAPABILITIES_HEADING = '## Portable GPU foundation and rendering';
const DATA_OPPORTUNITIES_HEADING = '## Opportunities for data-intensive visualization and compute';

type CapabilityTable = {
  heading: string;
  headers: string[];
  rows: string[][];
  sourceOffset: number;
};

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

  test('documents individual capabilities in substantial, consistently structured feature matrices', () => {
    const capabilitiesSource = readCapabilitiesSource();
    const capabilityTables = readCapabilityTables(capabilitiesSource);
    const capabilityRows = capabilityTables.flatMap(table => table.rows);

    expect(capabilityTables.length).toBeGreaterThanOrEqual(8);
    expect(capabilityRows.length).toBeGreaterThanOrEqual(75);

    for (const table of capabilityTables) {
      expect(table.headers, `${table.heading} must identify each individual feature`).toContain(
        'feature'
      );
      expect(table.headers, `${table.heading} must disclose feature maturity`).toContain('status');
      expect(table.headers, `${table.heading} must disclose backend support`).toContain('backend');
      expect(table.headers, `${table.heading} must identify its owning package`).toContain(
        'package'
      );
      expect(table.headers, `${table.heading} must explain implementation details`).toContain(
        'details'
      );

      for (const row of table.rows) {
        expect(
          row.length,
          `${table.heading}: ${row[0]} must fill every feature-matrix column`
        ).toBe(table.headers.length);

        for (const [columnIndex, value] of row.entries()) {
          expect(
            value.trim(),
            `${table.heading}: ${row[0]} needs a ${table.headers[columnIndex]} value`
          ).not.toBe('');
        }

        expect(
          row[table.headers.indexOf('status')],
          `${table.heading}: ${row[0]} must use a documented support status`
        ).toMatch(/\b(?:available|evolving|experimental|opportunity|not available)\b/i);
      }
    }
  });

  test('explains support statuses before prioritizing GPU-native data, compute, and visualization', () => {
    const capabilitiesSource = readCapabilitiesSource();
    const dataCapabilitiesOffset = capabilitiesSource.indexOf(DATA_CAPABILITIES_HEADING);
    const renderingCapabilitiesOffset = capabilitiesSource.indexOf(RENDERING_CAPABILITIES_HEADING);
    const statusLegend = capabilitiesSource.match(
      /\bAvailable\b[\s\S]{0,800}\bEvolving\b[\s\S]{0,800}\bExperimental\b[\s\S]{0,800}\b(?:Opportunity|Not available)\b/i
    );

    expect(
      statusLegend,
      'Explain every feature-matrix status before readers encounter it'
    ).not.toBeNull();
    expect(dataCapabilitiesOffset).toBeGreaterThanOrEqual(0);
    expect(renderingCapabilitiesOffset).toBeGreaterThan(dataCapabilitiesOffset);
    expect(statusLegend!.index).toBeLessThan(dataCapabilitiesOffset);

    const dataTables = readCapabilityTables(capabilitiesSource).filter(
      table =>
        table.sourceOffset > dataCapabilitiesOffset &&
        table.sourceOffset < renderingCapabilitiesOffset
    );
    const dataRows = dataTables.flatMap(table => table.rows);
    const dataCapabilities = dataRows.map(row => row.join(' ')).join('\n');

    expect(dataTables.length).toBeGreaterThanOrEqual(2);
    expect(dataRows.length).toBeGreaterThanOrEqual(20);

    for (const capability of [
      /GPUData/,
      /GPUVector/,
      /GPURecordBatch|GPUTable/,
      /Apache\s+Arrow|\bArrow\b/i,
      /command[\s-]+graph/i,
      /stream|batch/i,
      /ownership|borrowed/i,
      /readback|read[\s-]+back/i,
      /scan|prefix/i,
      /sort/i,
      /histogram/i,
      /aggregate|aggregation/i,
      /spatial|geospatial/i,
      /projection/i
    ]) {
      expect(
        dataCapabilities,
        `The leading data/compute matrices must explain ${capability}`
      ).toMatch(capability);
    }
  });

  test('keeps backend requirements and private-package maturity visible on the affected feature rows', () => {
    const capabilityTables = readCapabilityTables(readCapabilitiesSource());
    const capabilityRows = capabilityTables.flatMap(table =>
      table.rows.map(row => ({
        feature: row[table.headers.indexOf('feature')],
        status: row[table.headers.indexOf('status')],
        backend: row[table.headers.indexOf('backend')],
        packageName: row[table.headers.indexOf('package')],
        details: row[table.headers.indexOf('details')]
      }))
    );
    const computeRows = capabilityRows.filter(row =>
      /compute\s+shader|compute\s+pass|command[\s-]+graph/i.test(`${row.feature} ${row.details}`)
    );

    expect(computeRows.length).toBeGreaterThan(0);
    expect(
      computeRows.some(row => /WebGPU/i.test(row.backend)),
      'Compute-specific rows must disclose their WebGPU backend requirement'
    ).toBe(true);

    for (const [featureName, expectedBackend] of [
      ['Table transform feedback', 'WebGL2'],
      ['Table compute dispatch', 'WebGPU'],
      ['GPU storage buffers', 'WebGPU'],
      ['Native external textures', 'WebGPU'],
      ['Video texture uploads', 'WebGPU + WebGL2']
    ]) {
      const featureRow = capabilityRows.find(row => row.feature === featureName);

      expect(
        featureRow,
        `${featureName} needs its own accurately scoped feature row`
      ).toBeDefined();
      expect(featureRow!.backend, `${featureName} must identify its actual backend`).toBe(
        expectedBackend
      );
    }

    for (const experimentalPackage of ['anari', 'arrow', 'experimental', 'splats', 'text']) {
      const experimentalRows = capabilityRows.filter(row =>
        row.packageName.includes(`@luma.gl/${experimentalPackage}`)
      );

      expect(
        experimentalRows.length,
        `@luma.gl/${experimentalPackage} must appear in the detailed feature matrices`
      ).toBeGreaterThan(0);
      expect(
        experimentalRows.some(row => /experimental/i.test(row.status)),
        `@luma.gl/${experimentalPackage} must identify its experimental/private maturity`
      ).toBe(true);
    }
  });

  test('keeps API-reference adapter descriptions and private module availability accurate', () => {
    const apiReferenceSource = readFileSync(
      path.join(DOCUMENTATION_DIRECTORY, 'api-reference/README.md'),
      'utf8'
    );
    const moduleRows = apiReferenceSource
      .split('\n')
      .filter(sourceLine => sourceLine.startsWith('|') && sourceLine.includes('@luma.gl/'))
      .map(parseTableRow);
    const overviewIntroduction = apiReferenceSource.split('| Module')[0];
    const startHereSection = apiReferenceSource.split(/^## Start Here\s*$/m)[1]?.split(/^\[/m)[0];

    expect(overviewIntroduction).toMatch(/published[\s\S]{0,150}private/i);
    expect(startHereSection, 'The API reference must include a Start Here section').toBeDefined();

    for (const [packageName, documentationPath] of [
      ['effects', '/docs/api-guide/shaders/shader-passes'],
      ['gpgpu', '/docs/api-reference/gpgpu']
    ]) {
      const moduleRow = moduleRows.find(row => row[0].includes(`@luma.gl/${packageName}`));

      expect(moduleRow, `The API-reference matrix must list @luma.gl/${packageName}`).toBeDefined();
      expect(moduleRow![1], `@luma.gl/${packageName} is a published module`).not.toMatch(
        /experimental|private/i
      );
      const startHereLink = startHereSection
        ?.split('\n')
        .find(sourceLine => sourceLine.includes(`@luma.gl/${packageName}`));

      expect(startHereLink, `Start Here must include @luma.gl/${packageName}`).toContain(
        `[${packageName}]`
      );
      expect(apiReferenceSource).toContain(`[${packageName}]: ${documentationPath}`);
    }

    for (const [packageName, expectedBackend, otherBackend] of [
      ['webgl', 'WebGL', 'WebGPU'],
      ['webgpu', 'WebGPU', 'WebGL']
    ]) {
      const moduleRow = moduleRows.find(row => row[0].includes(`@luma.gl/${packageName}`));

      expect(moduleRow, `The API reference must list the ${packageName} adapter`).toBeDefined();
      expect(moduleRow![2]).toContain(`${expectedBackend} API`);
      expect(moduleRow![2]).not.toContain(`${otherBackend} API`);
    }

    for (const packageName of ['anari', 'arrow', 'experimental', 'splats', 'text']) {
      const moduleRow = moduleRows.find(row => row[0].includes(`@luma.gl/${packageName}`));

      expect(moduleRow, `The API reference must list @luma.gl/${packageName}`).toBeDefined();
      expect(
        moduleRow![1],
        `@luma.gl/${packageName} must disclose its actual availability`
      ).toMatch(/experimental[\s/]+private/i);
    }
  });

  test('breaks graphics and visualization techniques into independently inspectable feature rows', () => {
    const renderingCapabilitiesOffset = readCapabilitiesSource().indexOf(
      RENDERING_CAPABILITIES_HEADING
    );
    const renderingRows = readCapabilityTables(readCapabilitiesSource())
      .filter(table => table.sourceOffset > renderingCapabilitiesOffset)
      .flatMap(table => table.rows)
      .map(row => row.join(' '))
      .join('\n');

    for (const feature of [
      /WebGPU/,
      /WebGL\s*2|WebGL2/,
      /instanc/i,
      /indirect\s+draw/i,
      /deferred/i,
      /clustered/i,
      /shadow/i,
      /ambient\s+occlusion|GTAO|SSAO/i,
      /screen[\s-]+space[\s\S]{0,30}reflection|\bSSR\b/i,
      /temporal[\s-]+anti[\s-]*alias|\bTAA\b/i,
      /\bHDR\b|high[\s-]+dynamic[\s-]+range/i,
      /order[\s-]+independent\s+transparency|\bOIT\b/i,
      /\bWGSL\b/,
      /\bGLSL\b/,
      /shader\s+module/i,
      /clearcoat/i,
      /transmission/i,
      /Gaussian\s+splat/i,
      /\bWebXR\b|immersive\s+(?:AR|VR)/i
    ]) {
      expect(renderingRows, `A feature-matrix row must cover ${feature}`).toMatch(feature);
    }
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
      /transmission[^\n]*captured\s+scene\s+color/i,
      /standalone\s+glTF\s+rendering\s+fallback[^\n]*approximate/i,
      /@luma\.gl\/arrow[\s\S]{0,80}private/i
    ]) {
      expect(capabilitiesSource, `The shared asset overview must explain ${capability}`).toMatch(
        capability
      );
    }

    expect(capabilitiesSource).toMatch(/Morph-target animation\s*\|\s*Available/i);
    expect(capabilitiesSource).toMatch(/Existing joint-driven skinning\s*\|\s*Available/i);
    expect(capabilitiesSource).toMatch(/Chromatic dispersion\s*\|\s*Available/i);

    expect(anariGuide).not.toMatch(/\bnot\s+skinning\s+or\s+animations\b/i);
    expect(anariGuide).toMatch(/both\s+UV\s+sets[\s\S]{0,80}KHR_texture_transform/i);
    expect(anariGuide).toMatch(
      /joint\s+attributes[\s\S]{0,180}application-provided[\s\S]{0,100}jointMatrices/i
    );
    expect(anariGuide).toMatch(
      /morph\s+targets[\s\S]{0,80}animated\s+morph\s+weights[\s\S]{0,80}automatically/i
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

  test('frames future opportunities around massive data, GPU computation, and visualization', () => {
    const capabilitiesSource = readCapabilitiesSource();
    const opportunitiesOffset = capabilitiesSource.indexOf(DATA_OPPORTUNITIES_HEADING);

    expect(opportunitiesOffset).toBeGreaterThan(
      capabilitiesSource.indexOf(RENDERING_CAPABILITIES_HEADING)
    );

    const opportunities = capabilitiesSource.slice(opportunitiesOffset);

    for (const opportunity of [
      /(?:massive|large|billion|out[\s-]+of[\s-]+core|bounded)[\s\S]{0,80}(?:data|dataset|residen)/i,
      /stream|progressive/i,
      /GPU[\s-]+(?:native|resident|compute)|command[\s-]+graph/i,
      /Arrow|columnar|table/i,
      /spatial|geospatial|projection/i,
      /scientific\s+volume|volumetric\s+data|volume\s+render/i,
      /visualization/i
    ]) {
      expect(
        opportunities,
        `The roadmap must prioritize data-intensive visualization: ${opportunity}`
      ).toMatch(opportunity);
    }
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

function readCapabilityTables(capabilitiesSource: string): CapabilityTable[] {
  const sourceLines = capabilitiesSource.split('\n');
  const capabilityTables: CapabilityTable[] = [];
  let sourceOffset = 0;
  let currentHeading = '';

  for (let lineIndex = 0; lineIndex < sourceLines.length; lineIndex++) {
    const sourceLine = sourceLines[lineIndex];
    const headingMatch = sourceLine.match(/^#{2,4}\s+(.+)$/);

    if (headingMatch) {
      currentHeading = headingMatch[1];
    }

    const nextLine = sourceLines[lineIndex + 1];
    if (!sourceLine.startsWith('|') || !nextLine || !isTableSeparator(nextLine)) {
      sourceOffset += sourceLine.length + 1;
      continue;
    }

    const headers = parseTableRow(sourceLine).map(header => header.trim().toLowerCase());
    if (!headers.includes('feature') || !headers.includes('status')) {
      sourceOffset += sourceLine.length + 1;
      continue;
    }

    const rows: string[][] = [];
    for (
      let rowLineIndex = lineIndex + 2;
      rowLineIndex < sourceLines.length && sourceLines[rowLineIndex].startsWith('|');
      rowLineIndex++
    ) {
      rows.push(parseTableRow(sourceLines[rowLineIndex]));
    }

    capabilityTables.push({heading: currentHeading, headers, rows, sourceOffset});
    sourceOffset += sourceLine.length + 1;
  }

  return capabilityTables;
}

function isTableSeparator(sourceLine: string): boolean {
  return /^\|(?:\s*:?-{3,}:?\s*\|)+\s*$/.test(sourceLine);
}

function parseTableRow(sourceLine: string): string[] {
  return sourceLine
    .trim()
    .slice(1, -1)
    .split('|')
    .map(value => value.trim());
}
