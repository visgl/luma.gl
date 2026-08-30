// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {existsSync, readFileSync, readdirSync} from 'node:fs';
import path from 'node:path';
import {describe, expect, test} from 'vitest';

type SidebarEntry =
  | string
  | {type: 'doc'; id: string; label?: string}
  | {type: 'category'; label: string; items: SidebarEntry[]};

type EffectDocumentation = {
  exportName: string;
  exampleName: string;
  effectName?: string;
  backend: 'portable' | 'webgpu' | 'mixed';
};

const DOCS_DIRECTORY = path.join(process.cwd(), 'docs/api-reference/shadertools/shader-passes');
const SHADER_PASS_DOCUMENT_PREFIX = 'api-reference/shadertools/shader-passes/';

const EFFECT_DOCUMENTATION = {
  'brightness-contrast': {
    exportName: 'brightnessContrast',
    exampleName: 'PostprocessingExample',
    effectName: 'brightnessContrast',
    backend: 'portable'
  },
  'hue-saturation': {
    exportName: 'hueSaturation',
    exampleName: 'PostprocessingExample',
    effectName: 'hueSaturation',
    backend: 'portable'
  },
  sepia: {
    exportName: 'sepia',
    exampleName: 'PostprocessingExample',
    effectName: 'sepia',
    backend: 'portable'
  },
  vibrance: {
    exportName: 'vibrance',
    exampleName: 'PostprocessingExample',
    effectName: 'vibrance',
    backend: 'portable'
  },
  'tone-mapping': {
    exportName: 'toneMapping',
    exampleName: 'PostprocessingExample',
    effectName: 'toneMapping',
    backend: 'portable'
  },
  'hdr-auto-exposure': {
    exportName: 'createHDRAutoExposureCompositeShaderPass',
    exampleName: 'DeferredRenderingExample',
    backend: 'webgpu'
  },
  bloom: {exportName: 'bloom', exampleName: 'BloomExample', backend: 'mixed'},
  'gaussian-blur': {
    exportName: 'gaussianBlur',
    exampleName: 'PostprocessingExample',
    effectName: 'gaussianBlur',
    backend: 'portable'
  },
  'triangle-blur': {
    exportName: 'triangleBlur',
    exampleName: 'PostprocessingExample',
    effectName: 'triangleBlur',
    backend: 'portable'
  },
  'tilt-shift': {
    exportName: 'tiltShift',
    exampleName: 'PostprocessingExample',
    effectName: 'tiltShift',
    backend: 'portable'
  },
  'zoom-blur': {
    exportName: 'zoomBlur',
    exampleName: 'PostprocessingExample',
    effectName: 'zoomBlur',
    backend: 'portable'
  },
  'depth-of-field': {exportName: 'dof', exampleName: 'DOFExample', backend: 'portable'},
  'depth-aware-blur': {
    exportName: 'depthAwareBlur',
    exampleName: 'AdvancedEffectsExample',
    backend: 'webgpu'
  },
  persistence: {
    exportName: 'persistenceEffect',
    exampleName: 'PersistenceExample',
    backend: 'portable'
  },
  fxaa: {exportName: 'fxaa', exampleName: 'AntialiasingExample', backend: 'portable'},
  'temporal-antialiasing': {
    exportName: 'createTAACompositeShaderPass',
    exampleName: 'AdvancedEffectsExample',
    backend: 'webgpu'
  },
  'camera-reprojection-antialiasing': {
    exportName: 'createCameraReprojectionTAACompositeShaderPass',
    exampleName: 'ANARIPlaygroundExample',
    backend: 'webgpu'
  },
  'motion-blur': {
    exportName: 'createMotionBlurCompositeShaderPass',
    exampleName: 'AdvancedEffectsExample',
    backend: 'webgpu'
  },
  ssao: {
    exportName: 'createSSAOCompositeShaderPass',
    exampleName: 'AdvancedEffectsExample',
    backend: 'webgpu'
  },
  gtao: {
    exportName: 'createGTAOCompositeShaderPass',
    exampleName: 'DeferredRenderingExample',
    backend: 'webgpu'
  },
  'screen-space-global-illumination': {
    exportName: 'createSSGICompositeShaderPass',
    exampleName: 'DeferredRenderingExample',
    backend: 'webgpu'
  },
  'screen-space-reflections': {
    exportName: 'createSSRCompositeShaderPass',
    exampleName: 'DeferredRenderingExample',
    backend: 'webgpu'
  },
  outlines: {
    exportName: 'createOutlineCompositeShaderPass',
    exampleName: 'AdvancedEffectsExample',
    backend: 'webgpu'
  },
  'volumetric-fog': {
    exportName: 'createVolumetricFogCompositeShaderPass',
    exampleName: 'AdvancedEffectsExample',
    backend: 'webgpu'
  },
  'clustered-volumetric-lighting': {
    exportName: 'createClusteredVolumetricLightingCompositeShaderPass',
    exampleName: 'DeferredRenderingExample',
    backend: 'webgpu'
  },
  'color-halftone': {
    exportName: 'colorHalftone',
    exampleName: 'PostprocessingExample',
    effectName: 'colorHalftone',
    backend: 'portable'
  },
  'dot-screen': {
    exportName: 'dotScreen',
    exampleName: 'PostprocessingExample',
    effectName: 'dotScreen',
    backend: 'portable'
  },
  'edge-work': {
    exportName: 'edgeWork',
    exampleName: 'PostprocessingExample',
    effectName: 'edgeWork',
    backend: 'portable'
  },
  'hexagonal-pixelate': {
    exportName: 'hexagonalPixelate',
    exampleName: 'PostprocessingExample',
    effectName: 'hexagonalPixelate',
    backend: 'portable'
  },
  ink: {
    exportName: 'ink',
    exampleName: 'PostprocessingExample',
    effectName: 'ink',
    backend: 'portable'
  },
  noise: {
    exportName: 'noise',
    exampleName: 'PostprocessingExample',
    effectName: 'noise',
    backend: 'portable'
  },
  vignette: {
    exportName: 'vignette',
    exampleName: 'PostprocessingExample',
    effectName: 'vignette',
    backend: 'portable'
  },
  denoise: {
    exportName: 'denoise',
    exampleName: 'PostprocessingExample',
    effectName: 'denoise',
    backend: 'portable'
  },
  'bulge-pinch': {
    exportName: 'bulgePinch',
    exampleName: 'PostprocessingExample',
    effectName: 'bulgePinch',
    backend: 'portable'
  },
  magnify: {
    exportName: 'magnify',
    exampleName: 'PostprocessingExample',
    effectName: 'magnify',
    backend: 'portable'
  },
  swirl: {
    exportName: 'swirl',
    exampleName: 'PostprocessingExample',
    effectName: 'swirl',
    backend: 'portable'
  }
} as const satisfies Record<string, EffectDocumentation>;

describe('shader-pass reference documentation', () => {
  test('lists one dedicated MDX page for every documented effect in the categorized sidebar', () => {
    const tableOfContents = JSON.parse(
      readFileSync(path.join(process.cwd(), 'docs/table-of-contents.json'), 'utf8')
    ) as SidebarEntry[];
    const shaderPassCatalog = findCategory(tableOfContents, 'Shader Pass Catalog');

    expect(shaderPassCatalog).toBeDefined();
    if (!shaderPassCatalog) {
      return;
    }

    const categoryNames = shaderPassCatalog.items
      .filter(item => typeof item !== 'string' && item.type === 'category')
      .map(category => category.label);

    expect(categoryNames).toEqual([
      'Color and Tone',
      'Blur, Bloom and Focus',
      'Temporal and Antialiasing',
      'Lighting and Visibility',
      'Stylization',
      'Detail and finishing',
      'Warp and Lens'
    ]);

    const sidebarDocumentIds = collectDocumentIds(shaderPassCatalog.items).sort();
    const expectedDocumentIds = [
      `${SHADER_PASS_DOCUMENT_PREFIX}image-processing`,
      ...Object.keys(EFFECT_DOCUMENTATION).map(
        effectName => `${SHADER_PASS_DOCUMENT_PREFIX}${effectName}`
      )
    ].sort();

    expect(sidebarDocumentIds).toEqual(expectedDocumentIds);
    expect(new Set(sidebarDocumentIds).size).toBe(sidebarDocumentIds.length);

    for (const documentId of sidebarDocumentIds) {
      expect(existsSync(path.join(process.cwd(), 'docs', `${documentId}.mdx`)), documentId).toBe(
        true
      );
    }

    const actualDocumentationFiles = readdirSync(DOCS_DIRECTORY)
      .filter(fileName => fileName.endsWith('.mdx'))
      .sort();

    expect(actualDocumentationFiles).toEqual(
      [
        'image-processing.mdx',
        ...Object.keys(EFFECT_DOCUMENTATION).map(name => `${name}.mdx`)
      ].sort()
    );
  });

  test('gives every public effect a complete reference, a real export, and a matching live example', () => {
    const effectsExportsSource = readFileSync(
      path.join(process.cwd(), 'modules/effects/src/index.ts'),
      'utf8'
    );
    const websiteExamplesSource = readFileSync(
      path.join(process.cwd(), 'website/src/examples.tsx'),
      'utf8'
    );
    const postprocessingCatalogSource = readFileSync(
      path.join(process.cwd(), 'examples/showcase/postprocessing/effect-catalog.ts'),
      'utf8'
    );

    for (const [pageName, documentation] of Object.entries(EFFECT_DOCUMENTATION)) {
      const pageSource = readFileSync(path.join(DOCS_DIRECTORY, `${pageName}.mdx`), 'utf8');

      expect(pageSource, pageName).toMatch(/^# .+$/m);
      expect(pageSource, pageName).toContain('## At a Glance');
      expect(pageSource, pageName).toContain('## Usage');
      expect(pageSource, pageName).toContain('## Parameters');
      expect(pageSource, pageName).toContain('## Related Effects');
      expect(pageSource, pageName).toContain(documentation.exportName);
      expect(pageSource, pageName).toContain(`import {${documentation.exampleName}}`);
      expect(pageSource, pageName).toContain(`<${documentation.exampleName}`);
      expect(effectsExportsSource, pageName).toContain(documentation.exportName);
      expect(websiteExamplesSource, pageName).toContain(
        `export const ${documentation.exampleName}`
      );

      if ('effectName' in documentation) {
        expect(pageSource, pageName).toContain(`effect="${documentation.effectName}"`);
        expect(postprocessingCatalogSource, pageName).toContain(`  ${documentation.effectName},`);
      }

      if (documentation.backend === 'portable') {
        expect(pageSource, pageName).toContain('WebGPU and WebGL2');
      }
      if (documentation.backend === 'webgpu') {
        expect(pageSource, pageName).toContain('| Backend | WebGPU |');
      }
    }
  });

  test('preserves the existing catalog route as an interactive, linked overview', () => {
    const overviewSource = readFileSync(path.join(DOCS_DIRECTORY, 'image-processing.mdx'), 'utf8');

    expect(overviewSource).toContain('<PostprocessingExample embedded showStats={false} />');
    expect(overviewSource).toContain('## Choosing an Effect');
    expect(overviewSource).toContain('## Inputs and Compatibility');
    expect(overviewSource).not.toContain('### brightnessContrast');

    for (const pageName of Object.keys(EFFECT_DOCUMENTATION)) {
      expect(overviewSource, pageName).toContain(`](./${pageName})`);
    }
  });

  test('documents factual pass budgets, corrected property names, and optical reference sources', () => {
    const bloomSource = readFileSync(path.join(DOCS_DIRECTORY, 'bloom.mdx'), 'utf8');
    const vignetteSource = readFileSync(path.join(DOCS_DIRECTORY, 'vignette.mdx'), 'utf8');
    const magnifySource = readFileSync(path.join(DOCS_DIRECTORY, 'magnify.mdx'), 'utf8');
    const clusteredVolumeSource = readFileSync(
      path.join(DOCS_DIRECTORY, 'clustered-volumetric-lighting.mdx'),
      'utf8'
    );

    expect(bloomSource).toContain('| `ultra` | `5` | 20 render passes |');
    expect(bloomSource).toContain('| Default guard band | `1024 x 512` | `48 MiB` | `45` |');
    expect(bloomSource).toContain('https://gpuopen.com/manuals/fidelityfx_sdk/techniques/');
    expect(bloomSource).toContain('https://google.github.io/filament/main/filament.html');
    expect(vignetteSource).toContain('| `radius` | `0.5` |');
    expect(magnifySource).toContain('| `radiusPixels` | `200` |');
    expect(clusteredVolumeSource).toContain('| Render passes | Six:');
  });
});

function findCategory(
  entries: SidebarEntry[],
  categoryName: string
): Extract<SidebarEntry, {type: 'category'}> | undefined {
  for (const entry of entries) {
    if (typeof entry === 'string' || entry.type !== 'category') {
      continue;
    }
    if (entry.label === categoryName) {
      return entry;
    }

    const nestedCategory = findCategory(entry.items, categoryName);
    if (nestedCategory) {
      return nestedCategory;
    }
  }

  return undefined;
}

function collectDocumentIds(entries: SidebarEntry[]): string[] {
  return entries.flatMap(entry => {
    if (typeof entry === 'string') {
      return [entry];
    }
    return entry.type === 'category' ? collectDocumentIds(entry.items) : [entry.id];
  });
}
