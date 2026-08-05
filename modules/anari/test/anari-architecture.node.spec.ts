import {readdirSync, readFileSync} from 'node:fs';
import test from 'test/utils/vitest-tape';

test('ANARI remains a declarative facade over shared rendering implementations', testContext => {
  const sourceDirectory = new URL('../src/', import.meta.url);
  const sourceFiles = readdirSync(sourceDirectory).filter(fileName => fileName.endsWith('.ts'));
  const packageManifest = JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8')
  ) as {peerDependencies: Record<string, string>; exports: Record<string, unknown>};

  for (const fileName of sourceFiles) {
    const source = readFileSync(new URL(fileName, sourceDirectory), 'utf8');
    testContext.notOk(
      /\/\*\s*(?:wgsl|glsl)\s*\*\//i.test(source),
      `${fileName} does not author ANARI-owned shader source`
    );
    testContext.notOk(
      /\bnew\s+(?:Model|MaterialFactory)\b/.test(source),
      `${fileName} delegates model and material implementations to the engine`
    );
    testContext.notOk(
      /\b(?:anariMaterialModule|ANARI_MATERIAL_WGSL|ANARI_DEFERRED_WGSL_SHADER)\b/.test(source),
      `${fileName} does not recreate an ANARI-only material or renderer shader`
    );
  }

  const adapterSource = readFileSync(new URL('anari-scene-adapter.ts', sourceDirectory), 'utf8');
  const runtimeSource = readFileSync(
    new URL('anari-rendering-runtime.ts', sourceDirectory),
    'utf8'
  );
  const publicSource = readFileSync(new URL('index.ts', sourceDirectory), 'utf8');
  testContext.ok(
    adapterSource.includes('pbrMaterial') && adapterSource.includes("'@luma.gl/shadertools'"),
    'material translation uses the canonical shadertools PBR implementation'
  );
  testContext.ok(
    runtimeSource.includes('SceneRenderer') && runtimeSource.includes("'@luma.gl/engine'"),
    'forward rendering belongs to the shared engine renderer'
  );
  testContext.ok(
    runtimeSource.includes('DeferredSceneRenderer') &&
      runtimeSource.includes("'@luma.gl/experimental'"),
    'deferred rendering belongs to the shared experimental renderer'
  );
  testContext.ok(
    '@luma.gl/engine' in packageManifest.peerDependencies &&
      '@luma.gl/experimental' in packageManifest.peerDependencies &&
      '@luma.gl/shadertools' in packageManifest.peerDependencies,
    'shared implementation owners are explicit peer dependencies'
  );
  testContext.ok('./schemas' in packageManifest.exports, 'JSON schemas retain an isolated export');
  testContext.notOk(publicSource.includes('./schemas'), 'core imports do not eagerly load schemas');
  testContext.end();
});
