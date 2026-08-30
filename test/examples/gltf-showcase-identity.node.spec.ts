// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import path from 'node:path';
import {describe, expect, test} from 'vitest';

describe('glTF module and showcase identity', () => {
  test('features the standards-first glTF showcase as a real homepage example card', () => {
    const homepage = readFileSync(path.join(process.cwd(), 'website/src/pages/index.jsx'), 'utf8');
    const featuredExamples = homepage.match(/const\s+FEATURED_EXAMPLES\s*=\s*\[([\s\S]*?)\n\];/);
    const showcase = readFileSync(
      path.join(process.cwd(), 'website/content/examples/showcase/gltf.mdx'),
      'utf8'
    );

    expect(featuredExamples).not.toBeNull();
    expect(featuredExamples![1]).toMatch(/title:\s*'glTF Asset Studio'/);
    expect(featuredExamples![1]).toMatch(/route:\s*'showcase\/gltf'/);
    expect(featuredExamples![1]).toMatch(/image:\s*'showcase\/gltf\.jpg'/);
    expect(featuredExamples![1]).toMatch(/standards-first glTF/i);
    expect(featuredExamples![1]).toMatch(/backends:\s*\['webgpu',\s*'webgl2'\]/);
    expect(showcase).toMatch(/title:\s*glTF Asset Studio/);
    expect(showcase).toMatch(/animated skeletons[\s\S]*morph targets/i);
  });

  test('describes glTF as an animated physical-asset and interchange module', () => {
    const packageMetadata = JSON.parse(
      readFileSync(path.join(process.cwd(), 'modules/gltf/package.json'), 'utf8')
    );
    const moduleDocumentation = readFileSync(
      path.join(process.cwd(), 'docs/api-reference/gltf/README.md'),
      'utf8'
    );
    const interchangeDocumentation = readFileSync(
      path.join(process.cwd(), 'docs/api-reference/gltf/gltf-interchange.md'),
      'utf8'
    );
    const tabs = readFileSync(
      path.join(process.cwd(), 'website/src/components/docs/gltf-docs-tabs.tsx'),
      'utf8'
    );

    expect(packageMetadata.description).toMatch(/physical materials[\s\S]*animation/i);
    expect(packageMetadata.keywords).toEqual(
      expect.arrayContaining(['gltf', 'glb', 'webgpu', 'pbr', 'animation'])
    );
    expect(moduleDocumentation).toMatch(/standards-first asset runtime/i);
    expect(interchangeDocumentation).toContain('KHR_animation_pointer');
    expect(interchangeDocumentation).toContain('EXT_mesh_gpu_instancing');
    expect(tabs).toContain('/docs/api-reference/gltf/gltf-interchange');
  });

  test('documents existing loader-owned capabilities without claiming unsupported extensions', () => {
    const overview = readFileSync(
      path.join(process.cwd(), 'docs/api-reference/gltf/README.md'),
      'utf8'
    );
    const extensionSupport = readFileSync(
      path.join(process.cwd(), 'docs/api-reference/gltf/gltf-extensions.mdx'),
      'utf8'
    );
    const packageOverview = readFileSync(
      path.join(process.cwd(), 'modules/gltf/README.md'),
      'utf8'
    );
    const capabilities = readFileSync(
      path.join(process.cwd(), 'docs/capabilities/rendering-visualization.mdx'),
      'utf8'
    );

    expect(overview).toMatch(/^## What loaders\.gl already provides$/m);
    for (const capability of [
      'GLTFLoader',
      'postProcessGLTF()',
      'GLBWriter',
      'KHR_draco_mesh_compression',
      'EXT_meshopt_compression',
      'KHR_meshopt_compression',
      'KHR_texture_basisu',
      'EXT_texture_webp',
      'EXT_mesh_features',
      'EXT_structural_metadata'
    ]) {
      expect(overview).toContain(capability);
    }

    expect(overview).toMatch(/EXT_meshopt_compression[\s\S]*KHR_meshopt_compression/);
    expect(extensionSupport).toMatch(/<SupportRow name="KHR_meshopt_compression" support="✅ \*️⃣">/);
    expect(extensionSupport).toMatch(/<SupportRow name="EXT_texture_avif" support="❌">/);
    expect(extensionSupport).toMatch(/<SupportRow name="EXT_mesh_features" support="\*️⃣">/);
    expect(extensionSupport).toMatch(/<SupportRow name="EXT_structural_metadata" support="\*️⃣">/);
    expect(capabilities).toMatch(
      /Meshopt compression[^\n]*@loaders\.gl\/gltf[^\n]*EXT_meshopt_compression[^\n]*KHR_meshopt_compression/
    );

    for (const documentation of [overview, extensionSupport, packageOverview]) {
      expect(documentation).not.toMatch(/(?:all|across)\s+17\s+(?:supported|canonical|map)/i);
    }
    expect(packageOverview).toMatch(/all\s+21\s+supported/i);
  });
});
