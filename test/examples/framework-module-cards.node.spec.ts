// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {describe, expect, test} from 'vitest';

type FrameworkModuleDefinition = {
  capabilities: string[];
  description: string;
  documentationPath: string;
  id: string;
  packageName: string;
  title: string;
};

const FRAMEWORK_MODULE_SOURCE_PATH = path.join(
  process.cwd(),
  'website/src/components/framework-module-cards.tsx'
);
const FRAMEWORK_MODULE_STYLES_PATH = path.join(
  process.cwd(),
  'website/src/components/framework-module-cards.module.css'
);
const HOMEPAGE_SOURCE_PATH = path.join(process.cwd(), 'website/src/pages/index.jsx');
const ONBOARDING_SOURCE_PATH = path.join(process.cwd(), 'docs/getting-started.mdx');

const EXPECTED_FRAMEWORK_MODULES = [
  {
    id: 'portability',
    title: 'Core / WebGPU / WebGL',
    packageName: '@luma.gl/core + adapters',
    documentationPath: 'docs/api-reference/core',
    capabilities: ['WebGPU', 'WebGL2', 'GPU resources'],
    descriptions: [/low-level GPU portability layer/i, /WebGPU and WebGL2/i]
  },
  {
    id: 'engine',
    title: 'Engine',
    packageName: '@luma.gl/engine',
    documentationPath: 'docs/api-reference/engine',
    capabilities: ['Models', 'Animation', 'Geometry'],
    descriptions: [/classic luma\.gl API/i, /models, animation loops, geometry/i]
  },
  {
    id: 'shaders',
    title: 'Shader Tools',
    packageName: '@luma.gl/shadertools',
    documentationPath: 'docs/api-reference/shadertools',
    capabilities: ['WGSL', 'GLSL', 'Shader modules'],
    descriptions: [/portable shaders/i, /reusable module library/i]
  },
  {
    id: 'effects',
    title: 'Effects',
    packageName: '@luma.gl/effects',
    documentationPath: 'docs/api-reference/shadertools/shader-passes/image-processing',
    capabilities: ['Bloom', 'Tone mapping', 'Shader passes'],
    descriptions: [/reusable shader effects/i, /post-processing/i]
  },
  {
    id: 'anari',
    title: 'ANARI',
    packageName: '@luma.gl/scene',
    documentationPath: 'docs/api-reference/scene',
    capabilities: ['glTF', 'OpenUSD', 'Renderers'],
    descriptions: [/declarative 3D scenes/i, /glTF and OpenUSD/i, /switch renderers/i]
  },
  {
    id: 'splats',
    title: 'Splats',
    packageName: '@luma.gl/splats',
    documentationPath: 'docs/api-reference/splats',
    capabilities: ['Streaming', 'Gaussian splats', 'HDR'],
    descriptions: [/stream and render Gaussian splats/i, /high-dynamic-range color/i]
  },
  {
    id: 'gpgpu',
    title: 'GPGPU',
    packageName: '@luma.gl/gpgpu',
    documentationPath: 'docs/api-reference/gpgpu',
    capabilities: ['GPU workflows', 'Compute modules', 'Zero readback'],
    descriptions: [/compute modules and rendering/i, /GPU-native pipeline/i]
  }
] as const;

describe('framework module cards', () => {
  test('introduces all seven framework modules with accurate capabilities and real documentation', () => {
    const frameworkModuleSource = readFileSync(FRAMEWORK_MODULE_SOURCE_PATH, 'utf8');
    const actualFrameworkModules = readFrameworkModules(frameworkModuleSource);

    expect(actualFrameworkModules.map(frameworkModule => frameworkModule.id)).toEqual(
      EXPECTED_FRAMEWORK_MODULES.map(frameworkModule => frameworkModule.id)
    );

    for (const [moduleIndex, expectedFrameworkModule] of EXPECTED_FRAMEWORK_MODULES.entries()) {
      const actualFrameworkModule = actualFrameworkModules[moduleIndex];

      expect(actualFrameworkModule).toMatchObject({
        id: expectedFrameworkModule.id,
        title: expectedFrameworkModule.title,
        packageName: expectedFrameworkModule.packageName,
        documentationPath: expectedFrameworkModule.documentationPath,
        capabilities: expectedFrameworkModule.capabilities
      });

      for (const expectedDescription of expectedFrameworkModule.descriptions) {
        expect(
          actualFrameworkModule.description,
          `${expectedFrameworkModule.title} must clearly explain its distinct capability`
        ).toMatch(expectedDescription);
      }

      expect(
        resolveDocumentationSource(actualFrameworkModule.documentationPath),
        `${expectedFrameworkModule.title} must link to existing canonical documentation`
      ).toBeDefined();
    }
  });

  test('renders accessible, base-aware documentation links with structured card content', () => {
    const frameworkModuleSource = readFileSync(FRAMEWORK_MODULE_SOURCE_PATH, 'utf8');

    expect(frameworkModuleSource).toMatch(/const\s+baseUrl\s*=\s*useBaseUrl\(\s*['"]\/['"]\s*\)/);
    expect(frameworkModuleSource).toMatch(
      /<div\b(?=[^>]*\bclassName=\{styles\.grid\})(?=[^>]*\brole="list")(?=[^>]*\baria-label="luma\.gl framework modules")[^>]*>/
    );
    expect(frameworkModuleSource).toMatch(
      /<a\b(?=[^>]*\bclassName=\{styles\.card\})(?=[^>]*\bdata-framework-module=\{frameworkModule\.id\})(?=[^>]*\brole="listitem")[^>]*>/
    );
    expect(frameworkModuleSource).toContain(
      'href={`${baseUrl}${frameworkModule.documentationPath}`}'
    );
    expect(frameworkModuleSource).toMatch(
      /<h3\b[^>]*\bclassName=\{styles\.title\}[^>]*>\{frameworkModule\.title\}<\/h3>/
    );
    expect(frameworkModuleSource).toMatch(
      /<ul\b(?=[^>]*\bclassName=\{styles\.capabilities\})(?=[^>]*\baria-label=\{`\$\{frameworkModule\.title\} capabilities`\})[^>]*>/
    );
    expect(frameworkModuleSource).toMatch(
      /<div\b(?=[^>]*\bclassName=\{styles\.artwork\})(?=[^>]*\baria-hidden="true")[^>]*>/
    );
  });

  test('keeps the quarter-screen cards responsive, distinctive, and accessible', () => {
    const frameworkModuleStyles = readFileSync(FRAMEWORK_MODULE_STYLES_PATH, 'utf8');
    const desktopGridRule = frameworkModuleStyles.match(/\.grid\s*\{([^}]*)\}/);
    const desktopCardRule = frameworkModuleStyles.match(/\.card\s*\{([^}]*)\}/);
    const mobileStyles = frameworkModuleStyles
      .split('@media (max-width: 820px)')[1]
      ?.split('@media (max-width: 440px)')[0];
    const reducedMotionStyles = frameworkModuleStyles.split(
      '@media (prefers-reduced-motion: reduce)'
    )[1];

    expect(desktopGridRule).not.toBeNull();
    expect(desktopGridRule![1]).toMatch(/\bdisplay:\s*grid\s*;/);
    expect(desktopGridRule![1]).toMatch(
      /\bgrid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)\s*;/
    );

    expect(desktopCardRule).not.toBeNull();
    expect(desktopCardRule![1]).toMatch(/\bmin-height:\s*clamp\(340px,\s*38vw,\s*420px\)\s*;/);
    expect(frameworkModuleStyles).toMatch(
      /\.card:last-child:nth-child\(odd\)\s*\{[^}]*\bgrid-column:\s*1\s*\/\s*-1\s*;/
    );
    expect(mobileStyles).toBeDefined();
    expect(mobileStyles).toMatch(/\.grid\s*\{[^}]*\bgrid-template-columns:\s*1fr\s*;/);
    expect(mobileStyles).toMatch(/\.card\s*\{[^}]*\bmin-height:\s*350px\s*;/);
    expect(frameworkModuleStyles).toMatch(
      /\.card:focus-visible\s*\{[^}]*\boutline:\s*3px\s+solid\s+rgb\(var\(--module-accent\)\)/
    );
    expect(reducedMotionStyles).toBeDefined();
    expect(reducedMotionStyles).toMatch(/\btransition:\s*none\s*;/);
    expect(reducedMotionStyles).toMatch(/\btransform:\s*none\s*;/);

    for (const frameworkModule of EXPECTED_FRAMEWORK_MODULES) {
      expect(
        frameworkModuleStyles,
        `${frameworkModule.title} must have its own distinctive visual treatment`
      ).toContain(`.card[data-framework-module="${frameworkModule.id}"] .artworkForm`);
    }
  });

  test('reuses the same complete framework overview on the homepage and guided introduction', () => {
    const homepageSource = readFileSync(HOMEPAGE_SOURCE_PATH, 'utf8');
    const onboardingSource = readFileSync(ONBOARDING_SOURCE_PATH, 'utf8');

    expect(homepageSource).toContain(
      "import {FrameworkModuleCards} from '../components/framework-module-cards';"
    );
    expect(homepageSource).toContain('id="framework-modules"');
    expect(homepageSource).toContain('<FrameworkModuleCards />');

    expect(onboardingSource).toContain(
      "import {FrameworkModuleCards} from '@site/src/components/framework-module-cards';"
    );
    expect(onboardingSource).toContain('<FrameworkModuleCards />');
    expect(onboardingSource.indexOf('<FrameworkModuleCards />')).toBeGreaterThan(
      onboardingSource.indexOf('03 · Built for ambitious ideas')
    );
    expect(onboardingSource.indexOf('<FrameworkModuleCards />')).toBeLessThan(
      onboardingSource.indexOf('04 · Find your starting point')
    );
  });
});

function readFrameworkModules(frameworkModuleSource: string): FrameworkModuleDefinition[] {
  const frameworkModulesDeclaration = frameworkModuleSource.match(
    /const\s+FRAMEWORK_MODULES\s*:[^=]+?=\s*\[([\s\S]*?)\n\];/
  );

  expect(frameworkModulesDeclaration).not.toBeNull();

  return Array.from(
    frameworkModulesDeclaration![1].matchAll(/^ {2}\{[ \t]*\r?\n([\s\S]*?)^ {2}\},?[ \t]*$/gm),
    frameworkModuleMatch => {
      const frameworkModuleDefinition = frameworkModuleMatch[1];
      const capabilitiesDeclaration = frameworkModuleDefinition.match(
        /\bcapabilities:\s*\[([^\]]*)\]/
      );

      expect(capabilitiesDeclaration).not.toBeNull();

      return {
        capabilities: Array.from(
          capabilitiesDeclaration![1].matchAll(/'([^']+)'/g),
          capabilityMatch => capabilityMatch[1]
        ),
        description: readFrameworkModuleField(frameworkModuleDefinition, 'description'),
        documentationPath: readFrameworkModuleField(frameworkModuleDefinition, 'documentationPath'),
        id: readFrameworkModuleField(frameworkModuleDefinition, 'id'),
        packageName: readFrameworkModuleField(frameworkModuleDefinition, 'packageName'),
        title: readFrameworkModuleField(frameworkModuleDefinition, 'title')
      };
    }
  );
}

function readFrameworkModuleField(frameworkModuleDefinition: string, fieldName: string): string {
  const fieldDeclaration = frameworkModuleDefinition.match(
    new RegExp(`\\b${fieldName}:\\s*'([^']+)'`)
  );

  expect(fieldDeclaration, `The framework module must declare ${fieldName}`).not.toBeNull();
  return fieldDeclaration![1];
}

function resolveDocumentationSource(documentationPath: string): string | undefined {
  const documentationSourcePath = path.join(process.cwd(), documentationPath);

  return [
    `${documentationSourcePath}.md`,
    `${documentationSourcePath}.mdx`,
    path.join(documentationSourcePath, 'README.md'),
    path.join(documentationSourcePath, 'README.mdx'),
    path.join(documentationSourcePath, 'index.md'),
    path.join(documentationSourcePath, 'index.mdx')
  ].find(candidatePath => existsSync(candidatePath));
}
