/**
 * Bundle ceilings protect the current release from regressions. gzip goals track the intended
 * end-state from issue #2852 and can become ceilings as the implementation gets leaner.
 */
export const BUNDLE_SIZE_FIXTURES = [
  {
    name: 'core',
    label: '`@luma.gl/core`',
    entry: 'modules/core/src/index.ts',
    external: [],
    maximum: {minified: 100_000, gzip: 28_500, brotli: 25_000},
    targetGzip: 24_000
  },
  {
    name: 'webgl',
    label: '`@luma.gl/webgl` backend',
    entry: 'modules/webgl/src/index.ts',
    external: ['@luma.gl/core'],
    maximum: {minified: 140_000, gzip: 39_500, brotli: 34_000},
    targetGzip: 30_000
  },
  {
    name: 'webgpu',
    label: '`@luma.gl/webgpu` backend',
    entry: 'modules/webgpu/src/index.ts',
    external: ['@luma.gl/core'],
    maximum: {minified: 280_000, gzip: 58_000, brotli: 49_000},
    targetGzip: 22_000
  },
  {
    name: 'core-webgl',
    label: 'core + WebGL',
    sum: ['core', 'webgl'],
    maximum: {minified: 240_000, gzip: 68_000, brotli: 59_000},
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
