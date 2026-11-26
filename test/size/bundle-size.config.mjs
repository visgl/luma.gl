/**
 * Bundle ceilings protect the current release from regressions. gzip goals track the intended
 * end-state from issue #2852 and can become ceilings as the implementation gets leaner.
 */
export const BUNDLE_SIZE_FIXTURES = [
  {
    name: 'wgsl-inspect',
    label: 'WGSL declaration inspector',
    entry: 'test/size/wgsl-inspect.ts',
    external: [],
    maximum: {minified: 10_000, gzip: 4_200, brotli: 3_800},
    targetGzip: 3_500
  },
  {
    name: 'glsl-inspect',
    label: 'GLSL declaration inspector',
    entry: 'test/size/glsl-inspect.ts',
    external: [],
    maximum: {minified: 7_000, gzip: 3_300, brotli: 3_000},
    targetGzip: 2_900
  },
  {
    name: 'shader-inspect',
    label: 'Both declaration inspectors',
    entry: 'test/size/shader-inspect.ts',
    external: [],
    maximum: {minified: 16_200, gzip: 6_300, brotli: 5_800},
    targetGzip: 5_500
  },
  {
    name: 'core-wgsl-scan',
    label: 'Core WGSL pipeline scanner',
    entry: 'test/size/core-wgsl-scan.ts',
    external: [],
    maximum: {minified: 8_600, gzip: 3_200, brotli: 2_900},
    targetGzip: 2_800
  },
  {
    name: 'slang-syntax',
    label: 'Existing Slang syntax parser',
    entry: 'test/size/slang-syntax.ts',
    external: [],
    maximum: {minified: 10_800, gzip: 3_700, brotli: 3_400},
    targetGzip: 3_700
  },
  {
    name: 'wgsl-syntax',
    label: 'Full WGSL syntax parser',
    entry: 'test/size/wgsl-syntax.ts',
    external: [],
    maximum: {minified: 11_200, gzip: 4_500, brotli: 4_200},
    targetGzip: 4_500
  },
  {
    name: 'wgsl-declaration-syntax',
    label: 'Small WGSL declaration parser',
    entry: 'test/size/wgsl-declaration-syntax.ts',
    external: [],
    maximum: {minified: 8_200, gzip: 3_600, brotli: 3_300},
    targetGzip: 3_600
  },
  {
    name: 'slang',
    label: '`@luma.gl/slang` compiler (optional)',
    entry: 'modules/slang/src/index.ts',
    external: [],
    // WGSL ordering and typed operation emission add ~0.5 KB gzip; frontends stay separate.
    maximum: {minified: 113_500, gzip: 32_400, brotli: 28_700},
    targetGzip: 25_000
  },
  {
    name: 'wgsl',
    label: '`@luma.gl/slang/wgsl` compiler (optional)',
    entry: 'modules/slang/src/wgsl.ts',
    external: [],
    maximum: {minified: 130_500, gzip: 37_600, brotli: 33_300},
    targetGzip: 25_000
  },
  {
    name: 'slang-luma',
    label: '`@luma.gl/slang/luma` helpers (optional)',
    entry: 'modules/slang/src/luma.ts',
    external: [],
    maximum: {minified: 5_000, gzip: 1_800, brotli: 1_600},
    targetGzip: 1_500
  },
  {
    name: 'core',
    label: '`@luma.gl/core`',
    entry: 'modules/core/src/index.ts',
    external: [],
    // Includes device-creation error reporting (#3147), probe.gl v5 logging, and deferred canvas resize arbitration.
    // Resource ownership adds 1,592 B minified / 445 B gzip / 347 B Brotli versus the PR base.
    maximum: {minified: 104_600, gzip: 29_350, brotli: 25_750},
    targetGzip: 24_000
  },
  {
    name: 'webgl',
    label: '`@luma.gl/core/webgl` backend',
    entry: 'modules/core/src/webgl/index.ts',
    external: ['@luma.gl/core'],
    // Unpack fast path trades ~0.6 KB minified for fewer upload allocations.
    // Scalar setters and deletion tracking together measure 141,425 B / 39,931 B gzip.
    maximum: {minified: 141_500, gzip: 39_975, brotli: 34_200},
    targetGzip: 30_000
  },
  {
    name: 'webgpu',
    label: '`@luma.gl/core/webgpu` backend',
    entry: 'modules/core/src/webgpu/index.ts',
    external: ['@luma.gl/core'],
    maximum: {minified: 280_000, gzip: 58_000, brotli: 49_000},
    targetGzip: 22_000
  },
  {
    name: 'core-webgl',
    label: 'core + WebGL',
    sum: ['core', 'webgl'],
    // Includes both allocation-saving changes; shared ceiling avoids merge-order regressions.
    maximum: {minified: 245_800, gzip: 69_250, brotli: 59_950},
    targetGzip: 54_000
  },
  {
    name: 'core-webgpu',
    label: 'core + WebGPU',
    sum: ['core', 'webgpu'],
    maximum: {minified: 380_000, gzip: 87_000, brotli: 75_000},
    targetGzip: 46_000
  },
  {
    name: 'luma-webgl',
    label: '`luma` + `webgl2Adapter`',
    entry: 'test/size/luma-webgl.ts',
    external: [],
    sourceAliases: true,
    maximum: {minified: 216_000, gzip: 61_500, brotli: 51_500},
    targetGzip: 50_000
  },
  {
    name: 'luma-webgpu',
    label: '`luma` + `webgpuAdapter`',
    entry: 'test/size/luma-webgpu.ts',
    external: [],
    sourceAliases: true,
    maximum: {minified: 360_000, gzip: 80_000, brotli: 67_000},
    targetGzip: 45_000
  }
];
