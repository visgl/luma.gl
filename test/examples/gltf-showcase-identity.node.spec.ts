// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

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
});
