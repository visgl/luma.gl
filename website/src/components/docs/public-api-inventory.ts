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
  entryPoint: `modules/${string}/src/index.ts`;
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
    packageName: '@luma.gl/shadertools',
    entryPoint: 'modules/shadertools/src/index.ts',
    documentation: {kind: 'generated', routePrefix: '/docs/api-reference/generated/shadertools'}
  },
  {
    packageName: '@luma.gl/constants',
    entryPoint: 'modules/constants/src/index.ts',
    documentation: {kind: 'curated', defaultRoute: '/docs/api-reference/constants'}
  },
  {
    packageName: '@luma.gl/effects',
    entryPoint: 'modules/effects/src/index.ts',
    documentation: {
      kind: 'curated',
      defaultRoute: '/docs/api-reference/effects',
      routesBySourcePrefix: {
        'passes/postprocessing': '/docs/api-reference/shadertools/shader-passes/image-processing',
        'passes/screen-space': '/docs/api-reference/effects'
      }
    }
  },
  {
    packageName: '@luma.gl/gltf',
    entryPoint: 'modules/gltf/src/index.ts',
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
    packageName: '@luma.gl/tables',
    entryPoint: 'modules/tables/src/index.ts',
    documentation: {
      kind: 'curated',
      defaultRoute: '/docs/api-reference/tables',
      routesBySourcePrefix: {
        'gpu-table': '/docs/api-reference/tables/gpu-table',
        'gpu-record-batch': '/docs/api-reference/tables/gpu-record-batch',
        'gpu-vector': '/docs/api-reference/tables/gpu-vector',
        'gpu-data-view': '/docs/api-reference/tables/gpu-data-view',
        'gpu-data': '/docs/api-reference/tables/gpu-data',
        'gpu-schema': '/docs/api-reference/tables/gpu-schema',
        'gpu-input-schema': '/docs/api-reference/tables/gpu-input-schema',
        'gpu-vector-format': '/docs/api-reference/tables/gpu-vector-format'
      }
    }
  },
  {
    packageName: '@luma.gl/test-utils',
    entryPoint: 'modules/test-utils/src/index.ts',
    documentation: {
      kind: 'curated',
      defaultRoute: '/docs/api-reference/test-utils',
      routesBySourcePrefix: {
        'snapshot-test-runner': '/docs/api-reference/test-utils/snapshot-test-runner'
      }
    }
  },
  {
    packageName: '@luma.gl/webgl',
    entryPoint: 'modules/webgl/src/index.ts',
    documentation: {kind: 'curated', defaultRoute: '/docs/api-reference/webgl'}
  },
  {
    packageName: '@luma.gl/webgpu',
    entryPoint: 'modules/webgpu/src/index.ts',
    documentation: {kind: 'curated', defaultRoute: '/docs/api-reference/webgpu'}
  }
];
