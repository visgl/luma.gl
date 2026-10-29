export type GeneratedPackageDocumentation = {
  kind: 'generated';
  routePrefix: string;
};

export type CuratedPackageDocumentation = {
  kind: 'curated';
  defaultRoute: string;
  routesBySourcePrefix?: Readonly<Record<string, string>>;
};

export type PublicPackageDocumentation = {
  packageName: `@luma.gl/${string}`;
  entryPoint: `modules/${string}/src/${string}`;
  documentation: GeneratedPackageDocumentation | CuratedPackageDocumentation;
};

/**
 * Documentation ownership for every published package barrel.
 *
 * Contract tests resolve each runtime export to its declaration file and then select the most
 * specific source-prefix route below. A package overview is the deliberate fallback for small
 * helpers that share one reference page.
 */
export const PUBLIC_PACKAGE_API_INVENTORY: readonly PublicPackageDocumentation[] = [
  {
    packageName: '@luma.gl/core',
    entryPoint: 'modules/core/src/index.ts',
    documentation: {kind: 'generated', routePrefix: '/docs/api-reference/generated/core'}
  },
  {
    packageName: '@luma.gl/engine',
    entryPoint: 'modules/engine/src/index.ts',
    documentation: {kind: 'generated', routePrefix: '/docs/api-reference/generated/engine'}
  },
  {
    packageName: '@luma.gl/shaders',
    entryPoint: 'modules/shaders/src/index.ts',
    documentation: {kind: 'generated', routePrefix: '/docs/api-reference/generated/shaders'}
  },
  {
    packageName: '@luma.gl/core/webgl-constants',
    entryPoint: 'modules/core/src/webgl-constants/index.ts',
    documentation: {kind: 'curated', defaultRoute: '/docs/api-reference/constants'}
  },
  {
    packageName: '@luma.gl/engine/effects',
    entryPoint: 'modules/engine/src/effects/index.ts',
    documentation: {
      kind: 'curated',
      defaultRoute: '/docs/api-reference/effects',
      routesBySourcePrefix: {
        'passes/postprocessing': '/docs/api-reference/shaders/shader-passes/image-processing',
        'passes/screen-space': '/docs/api-reference/effects'
      }
    }
  },
  {
    packageName: '@luma.gl/engine/gltf',
    entryPoint: 'modules/engine/src/gltf/index.ts',
    documentation: {
      kind: 'curated',
      defaultRoute: '/docs/api-reference/gltf',
      routesBySourcePrefix: {
        animation: '/docs/api-reference/gltf/gltf-animation',
        'parsers/parse-gltf-animations': '/docs/api-reference/gltf/gltf-animation',
        pbr: '/docs/api-reference/gltf/gltf-materials',
        'gltf-instanced': '/docs/api-reference/gltf/gltf-animated-crowd'
      }
    }
  },
  {
    packageName: '@luma.gl/gpgpu',
    entryPoint: 'modules/gpgpu/src/index.ts',
    documentation: {
      kind: 'curated',
      defaultRoute: '/docs/api-reference/gpgpu',
      routesBySourcePrefix: {
        'operation/gpu-data-evaluator': '/docs/api-reference/gpgpu/gpu-data-evaluator',
        operations: '/docs/api-reference/gpgpu/operations',
        'operation/operation': '/docs/api-reference/gpgpu/custom-operation',
        'utils/clean-evaluate': '/docs/api-reference/gpgpu/clean-evaluate'
      }
    }
  },
  {
    packageName: '@luma.gl/core/test-utils',
    entryPoint: 'modules/core/src/test-utils/index.ts',
    documentation: {
      kind: 'curated',
      defaultRoute: '/docs/api-reference/test-utils',
      routesBySourcePrefix: {
        'snapshot-test-runner': '/docs/api-reference/test-utils/snapshot-test-runner'
      }
    }
  },
  {
    packageName: '@luma.gl/core/webgl',
    entryPoint: 'modules/core/src/webgl/index.ts',
    documentation: {kind: 'curated', defaultRoute: '/docs/api-reference/webgl'}
  },
  {
    packageName: '@luma.gl/core/webgpu',
    entryPoint: 'modules/core/src/webgpu/index.ts',
    documentation: {kind: 'curated', defaultRoute: '/docs/api-reference/webgpu'}
  }
];
