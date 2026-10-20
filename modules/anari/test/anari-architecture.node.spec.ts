import {readdirSync, readFileSync} from 'node:fs';
import {expect, it} from 'vitest';

const EXPERIMENTAL_RENDERING_SYMBOLS = new Set([
  'SceneAlphaMode',
  'SceneCamera',
  'SceneEnvironment',
  'SceneMaterial',
  'SceneRenderOptions',
  'SceneRenderStatistics',
  'SceneRenderer',
  'SceneSurface',
  'DeferredSceneRenderer',
  'RayTracingScenePrimitive',
  'RayTracingSceneRenderOptions',
  'RayTracingSceneRenderer',
  'createPBRMaterial',
  'createPBRMaterialFactory',
  'createPBRModel',
  'getPBRGeometryDefines',
  'getPBRMaterialMapUniforms',
  'getPBRTextureDefines',
  'supportsDeferredScene'
]);

it('ANARI remains a declarative facade over shared rendering implementations', () => {
  const sourceDirectory = new URL('../src/', import.meta.url);
  const sourceFiles = readdirSync(sourceDirectory).filter(fileName => fileName.endsWith('.ts'));
  const packageManifest = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  ) as {peerDependencies: Record<string, string>; exports: Record<string, unknown>};

  for (const fileName of sourceFiles) {
    const source = readFileSync(new URL(fileName, sourceDirectory), 'utf8');
    expect(
      Boolean(/\/\*\s*(?:wgsl|glsl)\s*\*\//i.test(source)),
      `${fileName} does not author ANARI-owned shader source`
    ).toBe(false);
    expect(
      Boolean(/\bnew\s+(?:Model|MaterialFactory)\b/.test(source)),
      `${fileName} delegates model and material implementations to shared rendering packages`
    ).toBe(false);
    expect(
      Boolean(
        /\b(?:anariMaterialModule|ANARI_MATERIAL_WGSL|ANARI_DEFERRED_WGSL_SHADER)\b/.test(source)
      ),
      `${fileName} does not recreate an ANARI-only material or renderer shader`
    ).toBe(false);
    expect(
      getNamedImports(source, '@luma.gl/engine').filter(symbol =>
        EXPERIMENTAL_RENDERING_SYMBOLS.has(symbol)
      ),
      `${fileName} does not import experimental scene rendering APIs from the stable engine`
    ).toEqual([]);
  }

  const adapterSource = readFileSync(new URL('anari-scene-adapter.ts', sourceDirectory), 'utf8');
  const runtimeSource = readFileSync(
    new URL('anari-rendering-runtime.ts', sourceDirectory),
    'utf8'
  );
  const rayTracingRuntimeSource = readFileSync(
    new URL('anari-ray-tracing-runtime.ts', sourceDirectory),
    'utf8'
  );
  const publicSource = readFileSync(new URL('index.ts', sourceDirectory), 'utf8');
  expect(
    Boolean(
      adapterSource.includes('pbrMaterial') && adapterSource.includes("'@luma.gl/shadertools'")
    ),
    'material translation uses the canonical shadertools PBR implementation'
  ).toBe(true);
  expect(
    Boolean(getNamedImports(runtimeSource, '@luma.gl/experimental').includes('SceneRenderer')),
    'forward rendering belongs to the shared experimental renderer'
  ).toBe(true);
  expect(
    Boolean(
      getNamedImports(runtimeSource, '@luma.gl/experimental').includes('DeferredSceneRenderer')
    ),
    'deferred rendering belongs to the shared experimental renderer'
  ).toBe(true);
  expect(
    Boolean(
      getNamedImports(rayTracingRuntimeSource, '@luma.gl/experimental').includes(
        'RayTracingSceneRenderer'
      )
    ),
    'ray tracing belongs to the shared experimental renderer'
  ).toBe(true);
  expect(
    Boolean(
      getNamedImports(rayTracingRuntimeSource, '@luma.gl/experimental').includes(
        'RayTracingScenePrimitive'
      )
    ),
    'analytic ray tracing primitives belong to the shared experimental scene contract'
  ).toBe(true);
  expect(
    getNamedImports(adapterSource, '@luma.gl/experimental').sort(),
    'scene descriptor contracts are owned by the same experimental rendering package'
  ).toEqual(['SceneCamera', 'SceneMaterial', 'SceneRenderOptions', 'SceneSurface']);

  const enginePublicSource = readFileSync(
    new URL('../../engine/src/index.ts', sourceDirectory),
    'utf8'
  );
  expect(
    Boolean(
      /\b(?:SceneRenderer|DeferredSceneRenderer|RayTracingSceneRenderer|createPBRModel|createPBRMaterial|createPBRMaterialFactory)\b/.test(
        enginePublicSource
      )
    ),
    'the stable engine does not publicly own experimental scene or PBR rendering APIs'
  ).toBe(false);

  const gltfSourceDirectory = new URL('../../gltf/src/', sourceDirectory);
  expect(
    collectTypeScriptSources(gltfSourceDirectory).filter(source =>
      /['"]@luma\.gl\/experimental(?:\/[^'"]*)?['"]/.test(readFileSync(source, 'utf8'))
    ),
    'the standalone glTF package does not depend on experimental rendering'
  ).toEqual([]);
  expect(
    Boolean(
      '@luma.gl/engine' in packageManifest.peerDependencies &&
        '@luma.gl/experimental' in packageManifest.peerDependencies &&
        '@luma.gl/shadertools' in packageManifest.peerDependencies
    ),
    'shared implementation owners are explicit peer dependencies'
  ).toBe(true);
  expect(
    Boolean('./schemas' in packageManifest.exports),
    'JSON schemas retain an isolated export'
  ).toBe(true);
  expect(
    ['./forward', './deferred', './raytrace', './raymarch'].filter(
      exportPath => exportPath in packageManifest.exports
    ),
    'shared renderers have stable scene facade entry points'
  ).toEqual(['./forward', './deferred', './raytrace', './raymarch']);
  expect(
    Boolean(publicSource.includes('./schemas')),
    'core imports do not eagerly load schemas'
  ).toBe(false);
  void 0;
});

function getNamedImports(source: string, moduleName: string): string[] {
  const imports = source.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+['"]([^'"]+)['"]/g);
  return Array.from(imports)
    .filter(importDeclaration => importDeclaration[2] === moduleName)
    .flatMap(importDeclaration => importDeclaration[1].split(','))
    .map(
      symbol =>
        symbol
          .trim()
          .replace(/^type\s+/, '')
          .split(/\s+as\s+/)[0]
    )
    .filter(Boolean);
}

function collectTypeScriptSources(directory: URL): URL[] {
  return readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
    const path = new URL(entry.isDirectory() ? `${entry.name}/` : entry.name, directory);
    return entry.isDirectory()
      ? collectTypeScriptSources(path)
      : entry.name.endsWith('.ts')
        ? [path]
        : [];
  });
}
