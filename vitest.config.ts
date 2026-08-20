import {getVitestConfig} from '@vis.gl/dev-tools';
import {BrowserTestSequencer} from './test/utils/browser-test-sequencer';

const excludePatterns = [
  '**/*.disabled.*',
  'modules/**/wip/**',
  'modules/arrow/test/arrow/arrow-column-info.spec.ts',
  'modules/arrow/test/arrow/get-arrow-data.spec.ts',
  'modules/core/test/shadertypes/shader-types.spec.ts',
  'modules/engine/test/shader-inputs-types.spec.ts',
  'modules/engine/test/geometry/gpu-geometry.spec.ts',
  'modules/shadertools/test/lib/uniform-types.spec.ts',
  'modules/shadertools/test/modules/lighting/dirlight.spec.ts',
  'modules/webgl/test/adapter/helpers/get-shader-layout.spec.ts',
  'test/browser.ts',
  'test/index.ts',
  'test/modules.ts',
  'test/perf/**',
  'test/render/**'
];
// These specs exercise pure data transforms, layouts, shader assembly, and validation. Running
// them in Node preserves the assertions while avoiding one isolated browser page per file.
const nodeOnlyTestPatterns = [
  'test/devtools/**/*.spec.{ts,js}',
  'modules/effects/test/passes/image-adjust-filters/**/*.spec.{ts,js}',
  'modules/effects/test/passes/image-blur-filters/{gaussianblur,zoomblur,tiltshift,triangleblur}.spec.{ts,js}',
  'modules/effects/test/passes/image-warp-filters/**/*.spec.{ts,js}',
  'modules/effects/test/passes/image-fun-filters/**/*.spec.{ts,js}',
  'modules/effects/test/passes/screen-space/dof.spec.{ts,js}',
  'modules/core/test/shadertypes/**/*.spec.{ts,js}',
  'modules/core/test/adapter-utils/{buffer-layout-utils,format-compiler-log,get-attribute-from-layout}.spec.{ts,js}',
  'modules/core/test/adapter/helpers/parse-shader-compiler-log.spec.{ts,js}',
  'modules/core/test/portable/**/*.spec.{ts,js}',
  'modules/core/test/utils/**/*.spec.{ts,js}',
  'modules/engine/test/animation/**/*.spec.{ts,js}',
  'modules/engine/test/application-utils/**/*.spec.{ts,js}',
  'modules/engine/test/debug/**/*.spec.{ts,js}',
  'modules/engine/test/geometry/{geometries,geometry,geometry-utils}.spec.{ts,js}',
  'modules/engine/test/lib/picking-manager.spec.{ts,js}',
  'modules/engine/test/scenegraph/scenegraph-node.spec.{ts,js}',
  'modules/engine/test/utils/**/*.spec.{ts,js}',
  'modules/engine/test/shader-inputs.spec.{ts,js}',
  'modules/text/test/text-2d/{text-layout,arrow-text,text-utils,build-msdf-font-atlas,font-atlas-builders}.spec.{ts,js}',
  'modules/text/test/text-3d/**/*.spec.{ts,js}',
  'modules/tables/test/table/{gpu-table-model,generated-buffer-batches,table-buffer-planner}.spec.{ts,js}',
  'modules/webgpu/test/adapter/helpers/get-vertex-buffer-layout.spec.{ts,js}',
  'modules/webgpu/test/adapter/resources/webgpu-render-pass.spec.{ts,js}',
  'modules/webgpu/test/wgsl/**/*.spec.{ts,js}',
  'modules/webgl/test/adapter/helpers/{parse-shader-compiler-log,webgl-texture-table,webgl-topology-utils}.spec.{ts,js}',
  'modules/webgl/test/adapter/device-helpers/webgl-device-info.spec.{ts,js}',
  'modules/webgl/test/adapter/webgl-adapter.spec.{ts,js}',
  'modules/webgl/test/context/state-tracker/deep-array-equal.spec.{ts,js}',
  'modules/webgl/test/utils/**/*.spec.{ts,js}',
  'modules/arrow/test/arrow/{arrow-column-info,arrow-shader-layout,arrow-input-schema,arrow-splats,arrow-matrix-gpu-vector,arrow-geometry,arrow-model,arrow-paths,arrow-polygon-renderer,arrow-polygon,plain-gpu-table,analyze-arrow-table,arrow-variable-length-attribute-gpu-vector,get-arrow-data,arrow-fixed-size-list}.spec.{ts,js}',
  'modules/geoarrow/test/geoarrow/geoarrow-interleaving.spec.{ts,js}',
  'modules/gltf/test/gltf/{lights,gltf-extension-support,gltf-animator}.spec.{ts,js}',
  'modules/gltf/test/parsers/{parse-gltf-animations,parse-pbr-material,parse-pbr-compressed-texture}.spec.{ts,js}',
  'modules/gltf/test/webgl-to-webgpu/**/*.spec.{ts,js}',
  'modules/gpgpu/test/gpu-vector/gpu-data-evaluator-types.spec.{ts,js}',
  'modules/gpgpu/test/operations/arithmetic-operation.spec.{ts,js}',
  'modules/gpgpu/test/utils/{expression,webgpu-dispatch}.spec.{ts,js}',
  'modules/splats/test/{splat-rad-hierarchy,splat-browser-coverage}.spec.{ts,js}',
  'modules/test-utils/test/null-device/**/*.spec.{ts,js}',
  'modules/experimental/test/geospatial/geospatial-types.spec.{ts,js}',
  'modules/experimental/test/textures/packed-pixels.spec.{ts,js}',
  'modules/experimental/test/webxr/webxr-animation-frame-provider.spec.{ts,js}',
  'modules/shadertools/test/lib/preprocessor/**/*.spec.{ts,js}',
  'modules/shadertools/test/lib/generator/**/*.spec.{ts,js}',
  'modules/shadertools/test/lib/glsl-utils/**/*.spec.{ts,js}',
  'modules/shadertools/test/lib/shader-assembly/assemble-wgsl-auto-bindings.spec.{ts,js}',
  'modules/shadertools/test/lib/shader-module/{shader-module-dependencies,shader-module}.spec.{ts,js}',
  'modules/shadertools/test/lib/{uniform-types,shader-plugin,shader-assembler}.spec.{ts,js}',
  'modules/shadertools/test/modules/lighting/{lambert-material,lights,gouraud-material,water-material,phong-material,dirlight,pbr-scene}.spec.{ts,js}',
  'modules/shadertools/test/modules/math/{fp16-utils,fp64-utils}.spec.{ts,js}',
  'modules/shadertools/test/modules/utils/random.spec.{ts,js}',
  'modules/shadertools/test/modules/modules.spec.{ts,js}'
];
const nodeIncludePatterns = [
  'modules/**/*.node.spec.{ts,js}',
  'test/**/*.node.spec.{ts,js}',
  ...nodeOnlyTestPatterns
];
// These plain specs are imported by an existing .node.spec wrapper or register the same shared
// suite as one. Exclude the plain entry point so the shared module graph registers each suite once.
const nodeWrapperSourcePatterns = [
  'modules/arrow/test/arrow/{arrow-polygon,arrow-polygon-renderer,arrow-splats}.spec.{ts,js}',
  'modules/core/test/adapter/helpers/parse-shader-compiler-log.spec.{ts,js}',
  'modules/core/test/adapter-utils/format-compiler-log.spec.{ts,js}',
  'modules/core/test/shadertypes/data-type-utils.spec.{ts,js}',
  'modules/core/test/shadertypes/textures/texture-layout.spec.{ts,js}',
  'modules/engine/test/animation/{animation-mixer,key-frames,morph-targets,timeline}.spec.{ts,js}',
  'modules/engine/test/geometry/geometries.spec.{ts,js}',
  'modules/engine/test/utils/{deep-equal,split-uniforms-and-bindings}.spec.{ts,js}',
  'modules/gltf/test/gltf/gltf-animator.spec.{ts,js}',
  'modules/gltf/test/parsers/parse-gltf-animations.spec.{ts,js}',
  'modules/gltf/test/webgl-to-webgpu/convert-webgl-sampler.spec.{ts,js}',
  'modules/shadertools/test/lib/generator/{captialize,generate-shader}.spec.{ts,js}',
  'modules/shadertools/test/lib/glsl-utils/shader-utils.spec.{ts,js}',
  'modules/shadertools/test/lib/preprocessor/preprocessor.spec.{ts,js}',
  'modules/shadertools/test/modules/lighting/{gouraud-material,lambert-material,lights,phong-material}.spec.{ts,js}',
  'modules/splats/test/{splat-browser-coverage,splat-rad-hierarchy}.spec.{ts,js}',
  'modules/tables/test/table/gpu-table-model.spec.{ts,js}',
  'modules/webgl/test/adapter/helpers/{parse-shader-compiler-log,webgl-topology-utils}.spec.{ts,js}'
];
const nodeCoverageIncludePatterns = [
  ...nodeOnlyTestPatterns,
  ...nodeWrapperSourcePatterns.map(pattern => pattern.replace('.spec.', '.node.spec.'))
];
// These native Node suites exercise production branches that no browser-backed spec reaches. Keep
// this list focused: Istanbul remapping for the complete Node graph takes several minutes.
const nodeCoverageNativePatterns = [
  'test/dev-modules/**/*.node.spec.{ts,js}',
  'modules/gltf/test/gltf/gltf-animated-crowd.node.spec.{ts,js}',
  'modules/anari/test/{gltf-import,scene-export,scene-interchange}.node.spec.{ts,js}',
  'modules/geoarrow/test/geoarrow/{geoarrow-dense-union,arrow-polygon-tessellation}.node.spec.{ts,js}',
  'modules/splats/test/{splat-renderer,gpu-paged-splat-renderer,splat-residency,splat-hierarchy}.node.spec.{ts,js}',
  'modules/experimental/test/gpu-core/gpu-command-graph-{history,passes,planning}.node.spec.{ts,js}',
  'modules/experimental/test/gpu-raster/{gpu-raster-tile-source,gpu-raster-tile-cache,gpu-raster-cross-tile-components}.node.spec.{ts,js}',
  'modules/experimental/test/gpu-sql/lu-sql.node.spec.{ts,js}'
];
const nodeCoveragePatterns = [
  ...nodeCoverageIncludePatterns,
  ...nodeCoverageNativePatterns
];
// Benchmarks answer performance questions but do not add stable correctness coverage. Keep them
// out of every pull request's instrumented browser run and expose them through an opt-in project.
const browserBenchmarkTestPatterns = [
  'modules/experimental/test/gpu-core/gpu-spatial-query-benchmark.spec.ts',
  'modules/experimental/test/gpu-core/gpu-workgroup-reduction-benchmark.spec.ts',
  'modules/experimental/test/gpu-core/gpu-workgroup-scan-benchmark.spec.ts',
  'modules/experimental/test/gpu-graph/gpu-graph-benchmark.spec.ts',
  'modules/experimental/test/gpu-project/projection-benchmark.spec.ts'
];
const runBrowserBenchmarks = process.env.LUMA_TEST_BROWSER_BENCHMARKS === 'true';
const runNodeCoverage = process.env.LUMA_TEST_NODE_COVERAGE === 'true';
const browserExcludePatterns = [
  'modules/**/*.node.spec.{ts,js}',
  'test/**/*.node.spec.{ts,js}',
  ...browserBenchmarkTestPatterns,
  ...nodeOnlyTestPatterns,
  ...excludePatterns
];
const launchArguments = [
  '--enable-unsafe-webgpu',
  '--ignore-gpu-blocklist',
  ...(process.env.CI ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : [])
];

const vitestConfig = getVitestConfig({
  excludePatterns,
  launchOptions: {
    channel: 'chromium',
    args: launchArguments
  },
  overrides: {
    // Keep deck.gl in Vite's source graph so it shares this repository's luma.gl runtime.
    ssr: {noExternal: ['@deck.gl/core']},
    optimizeDeps: {exclude: ['@deck.gl/core']}
  },
  projects: {
    node: {
      test: {
        color: 'blue',
        browser: {enabled: false},
        // Node tests restore the globals they replace, so workers can safely reuse their module
        // graph. This avoids rebuilding the full monorepo graph in a child process for every file.
        pool: 'threads',
        isolate: false,
        // Istanbul transforms use substantial memory. Bound the focused coverage pass so it is
        // stable on GitHub's two-core runners without changing the fast default Node command.
        ...(runNodeCoverage ? {maxWorkers: 2} : {}),
        include: runNodeCoverage ? nodeCoveragePatterns : nodeIncludePatterns,
        exclude: [...excludePatterns, ...nodeWrapperSourcePatterns]
      }
    },
    browser: {
      test: {
        color: 'green',
        environment: 'node',
        // GPU devices and presentation resources are intentionally isolated between test files.
        isolate: true,
        fileParallelism: !process.env.CI,
        setupFiles: ['./test/utils/browser-process-shim.mjs'],
        include: runBrowserBenchmarks
          ? browserBenchmarkTestPatterns
          : ['modules/**/*.spec.{ts,js}', 'test/**/*.spec.{ts,js}'],
        exclude: runBrowserBenchmarks ? excludePatterns : browserExcludePatterns
      }
    },
    headless: {
      test: {
        color: 'cyan',
        environment: 'node',
        // GPU devices and presentation resources are intentionally isolated between test files.
        isolate: true,
        fileParallelism: !process.env.CI,
        setupFiles: ['./test/utils/browser-process-shim.mjs'],
        include: runBrowserBenchmarks
          ? browserBenchmarkTestPatterns
          : ['modules/**/*.spec.{ts,js}', 'test/**/*.spec.{ts,js}'],
        exclude: runBrowserBenchmarks ? excludePatterns : browserExcludePatterns
      }
    }
  },
  coverage: {
    provider: 'istanbul',
    // Browser coverage owns the all-files denominator. The focused Node pass only reports files
    // loaded by its selected specs; remapping every source adds minutes of duplicate work.
    ...(runNodeCoverage ? {} : {include: ['modules/**/src/**/*.{js,ts,tsx}']}),
    exclude: [
      '**/*.d.ts',
      '**/*.map',
      '**/*.{bundle,min}.{js,ts}',
      '**/{build,coverage,dist,node_modules,vendor,vendored}/**',
      'dev-modules/**',
      'examples/**',
      'scripts/**',
      'website/**',
      'test/**',
      'modules/**/test/**'
    ],
    excludeAfterRemap: true
  }
});

// Vitest selects its sharding sequencer from the root test config before it groups files by
// project. Project-level sequence settings only affect ordering after files have been sharded.
vitestConfig.test = {
  ...vitestConfig.test,
  sequence: {...vitestConfig.test?.sequence, sequencer: BrowserTestSequencer}
};

export default vitestConfig;
