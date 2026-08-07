// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

import typescript from 'typescript';

const require = createRequire(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageRoot = path.join(repositoryRoot, 'modules/experimental');
const packageJson = JSON.parse(readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
const lurasterExport = packageJson.exports?.['./luraster'];

assert.equal(packageJson.name, '@luma.gl/experimental');
assert.equal(packageJson.private, true, 'the existing experimental package remains private');
assert.equal(packageJson.sideEffects, false, 'the optional subpath remains side-effect free');
assert.deepEqual(lurasterExport, {
  import: './dist/luraster/index.js',
  require: './dist/luraster/index.cjs',
  types: './dist/luraster/index.d.ts'
});

const ecmaScriptModuleEntry = path.resolve(packageRoot, lurasterExport.import);
const commonJsEntry = path.resolve(packageRoot, lurasterExport.require);
const declarationEntry = path.resolve(packageRoot, lurasterExport.types);
const ecmaScriptRootEntry = path.resolve(packageRoot, packageJson.exports['.'].import);
const commonJsRootEntry = path.resolve(packageRoot, packageJson.exports['.'].require);
const tileSourceImplementation = readFileSync(
  path.join(packageRoot, 'src/luraster/gpu-raster-tile-source.ts'),
  'utf8'
);
const tileCacheImplementation = readFileSync(
  path.join(packageRoot, 'src/luraster/gpu-raster-tile-cache.ts'),
  'utf8'
);
const tileHaloImplementation = readFileSync(
  path.join(packageRoot, 'src/luraster/gpu-raster-tile-halo.ts'),
  'utf8'
);

assert.doesNotThrow(() => readFileSync(declarationEntry, 'utf8'), 'LuRaster declarations exist');
assert.doesNotMatch(
  tileSourceImplementation,
  /(?:from\s*|import\s*\()\s*['"](?:@loaders\.gl|geotiff|apache-arrow|@deck\.gl)/,
  'application-owned tile sources do not import external decoder or adapter libraries'
);
assert.doesNotMatch(
  tileSourceImplementation,
  /\bfetch\s*\(/,
  'application-owned tile sources do not choose an HTTP transport'
);
assert.doesNotMatch(
  tileSourceImplementation,
  /\b(?:createBuffer|createTexture|submit|mapAsync)\s*\(/,
  'application-owned tile sources do not allocate, submit, or map GPU resources'
);
assert.doesNotMatch(
  tileCacheImplementation,
  /(?:from\s*|import\s*\()\s*['"](?:@loaders\.gl|geotiff|apache-arrow|@deck\.gl)/,
  'bounded tile residency does not import external decoder or adapter libraries'
);
assert.doesNotMatch(
  tileCacheImplementation,
  /\bfetch\s*\(/,
  'bounded tile residency does not choose an HTTP transport'
);
assert.doesNotMatch(
  tileCacheImplementation,
  /\b(?:createCommandEncoder|createFence|submit|mapAsync|readAsync)\s*\(/,
  'bounded tile residency leaves command submission, completion fences, and readback explicit'
);
assert.doesNotMatch(
  tileHaloImplementation,
  /(?:from\s*|import\s*\()\s*['"](?:@loaders\.gl|geotiff|apache-arrow|@deck\.gl)/,
  'tile halo assembly does not import external decoder or adapter libraries'
);
assert.doesNotMatch(
  tileHaloImplementation,
  /\bfetch\s*\(/,
  'tile halo assembly does not choose an HTTP transport'
);
assert.doesNotMatch(
  tileHaloImplementation,
  /\b(?:createCommandEncoder|createFence|submit|mapAsync|readAsync)\s*\(/,
  'tile halo assembly leaves command submission, completion fences, and readback explicit'
);

const ecmaScriptRasterModule = await import(pathToFileURL(ecmaScriptModuleEntry).href);
const commonJsRasterModule = require(commonJsEntry);
const ecmaScriptRootModule = await import(pathToFileURL(ecmaScriptRootEntry).href);
const commonJsRootModule = require(commonJsRootEntry);
const ecmaScriptExportNames = Object.keys(ecmaScriptRasterModule).sort();
const commonJsExportNames = Object.keys(commonJsRasterModule)
  .filter((exportName) => exportName !== '__esModule')
  .sort();
const requiredRuntimeExportNames = [
  'GPURaster',
  'GPURasterBandMath',
  'GPURasterBoxBlur',
  'GPURasterBufferToTexture',
  'GPURasterClosing',
  'GPURasterContrast',
  'GPURasterContourClassifier',
  'GPURasterContours',
  'GPURasterConvolution',
  'GPURasterDilation',
  'GPURasterErosion',
  'GPURasterGaussianBlur',
  'GPURasterGradient',
  'GPURasterGradientMagnitude',
  'GPURasterHistogram',
  'GPURasterLaplacian',
  'GPURasterMorphology',
  'GPURasterNDVI',
  'GPURasterNeighborhood',
  'GPURasterOpening',
  'GPURasterOtsuThreshold',
  'GPURasterScharr',
  'GPURasterSobel',
  'GPURasterStatistics',
  'GPURasterThreshold',
  'GPURasterTileCache',
  'GPURasterTileCoreExtract',
  'GPURasterTileGraphLease',
  'GPURasterTileHaloAssembler',
  'GPURasterTileHaloFill',
  'GPURasterTileHaloLease',
  'GPURasterTileLease',
  'GPURasterTileReader',
  'GPURasterTextureToBuffer',
  'getRasterDeviceLimits',
  'planRasterDispatchStripes'
];

assert.deepEqual(
  commonJsExportNames,
  ecmaScriptExportNames,
  'ESM and CommonJS expose the same optional LuRaster runtime symbols'
);
for (const exportName of requiredRuntimeExportNames) {
  assert.equal(typeof ecmaScriptRasterModule[exportName], 'function');
  assert.equal(typeof commonJsRasterModule[exportName], 'function');
}
assert.equal(
  typeof ecmaScriptRasterModule.GPURasterTileReader.prototype.normalizeTileRequest,
  'function',
  'ESM tile readers expose validated canonical request normalization'
);
assert.equal(
  typeof commonJsRasterModule.GPURasterTileReader.prototype.normalizeTileRequest,
  'function',
  'CommonJS tile readers expose validated canonical request normalization'
);
for (const rasterModule of [ecmaScriptRasterModule, commonJsRasterModule]) {
  assert.equal(
    typeof rasterModule.GPURasterTileHaloAssembler.prototype.plan,
    'function',
    'tile halo assemblers expose synchronous cumulative receptive-field planning'
  );
  assert.equal(
    typeof rasterModule.GPURasterTileHaloAssembler.prototype.acquire,
    'function',
    'tile halo assemblers expose cancellable neighbor acquisition'
  );
  assert.equal(
    typeof rasterModule.GPURasterTileHaloLease.prototype.releaseAfter,
    'function',
    'tile halo leases retain every neighbor until an application-owned fence resolves'
  );
  assert.equal(
    typeof rasterModule.GPURasterTileHaloFill.prototype.addToGraph,
    'function',
    'tile halo fill declares explicit GPU command-graph work'
  );
  assert.equal(
    typeof rasterModule.GPURasterTileCoreExtract.prototype.addToGraph,
    'function',
    'tile core extraction declares explicit GPU command-graph work'
  );
}
for (const exportName of ecmaScriptExportNames) {
  assert.equal(
    exportName in ecmaScriptRootModule,
    false,
    `ESM experimental root excludes ${exportName}`
  );
  assert.equal(
    exportName in commonJsRootModule,
    false,
    `CommonJS experimental root excludes ${exportName}`
  );
}

const temporaryDirectory = mkdtempSync(path.join(tmpdir(), 'luma-luraster-package-'));
try {
  const temporaryPackageScope = path.join(temporaryDirectory, 'node_modules', '@luma.gl');
  mkdirSync(temporaryPackageScope, {recursive: true});
  symlinkSync(packageRoot, path.join(temporaryPackageScope, 'experimental'));
  const typeTestPath = path.join(temporaryDirectory, 'index.mts');
  writeFileSync(
    typeTestPath,
    `import {
  GPURaster,
  GPURasterBandMath,
  GPURasterBoxBlur,
  GPURasterBufferToTexture,
  GPURasterClosing,
  GPURasterContrast,
  GPURasterContourClassifier,
  GPURasterContours,
  GPURasterConvolution,
  GPURasterDilation,
  GPURasterErosion,
  GPURasterGaussianBlur,
  GPURasterGradient,
  GPURasterGradientMagnitude,
  GPURasterHistogram,
  GPURasterLaplacian,
  GPURasterMorphology,
  GPURasterNDVI,
  GPURasterNeighborhood,
  GPURasterOpening,
  GPURasterOtsuThreshold,
  GPURasterScharr,
  GPURasterSobel,
  GPURasterStatistics,
  GPURasterThreshold,
  GPURasterTileCache,
  GPURasterTileCoreExtract,
  GPURasterTileGraphLease,
  GPURasterTileHaloAssembler,
  GPURasterTileHaloFill,
  GPURasterTileHaloLease,
  GPURasterTileLease,
  GPURasterTileReader,
  GPURasterTextureToBuffer,
  getRasterDeviceLimits,
  planRasterDispatchStripes,
  type GPURasterBand,
  type GPURasterBandMathOperation,
  type GPURasterBandMathProps,
  type GPURasterBinaryMorphologyProps,
  type GPURasterBorderMode,
  type GPURasterClosingProps,
  type GPURasterContrastDomain,
  type GPURasterContrastMode,
  type GPURasterContrastProps,
  type GPURasterContourClassifierProps,
  type GPURasterContourLevel,
  type GPURasterContoursProps,
  type GPURasterConvolutionProps,
  type GPURasterDecodedBand,
  type GPURasterDecodedTile,
  type GPURasterDilationProps,
  type GPURasterEdgeProps,
  type GPURasterErosionProps,
  type GPURasterGaussianBlurProps,
  type GPURasterGrayscaleMorphologyProps,
  type GPURasterGradientDirection,
  type GPURasterGradientMagnitudeProps,
  type GPURasterGradientOperator,
  type GPURasterGradientProps,
  type GPURasterHaloStage,
  type GPURasterHistogramDomain,
  type GPURasterHistogramProps,
  type GPURasterLaplacianConnectivity,
  type GPURasterLaplacianProps,
  type GPURasterMetadata,
  type GPURasterMorphologyBaseProps,
  type GPURasterMorphologyMode,
  type GPURasterMorphologyNoDataPolicy,
  type GPURasterMorphologyOperation,
  type GPURasterMorphologyProps,
  type GPURasterNDVIProps,
  type GPURasterNeighborhoodProps,
  type GPURasterNeighborhoodRadius,
  type GPURasterNoDataPolicy,
  type GPURasterOpeningProps,
  type GPURasterOtsuDomain,
  type GPURasterOtsuThresholdProps,
  type GPURasterPixelBounds,
  type GPURasterResidentBand,
  type GPURasterResidentTile,
  type GPURasterScharrProps,
  type GPURasterSobelProps,
  type GPURasterStatisticsProps,
  type GPURasterSmoothingProps,
  type GPURasterStructuringElement,
  type GPURasterThresholdOperation,
  type GPURasterThresholdProps,
  type GPURasterThresholdValue,
  type GPURasterTileBandMetadata,
  type GPURasterTileCacheBudgets,
  type GPURasterTileCacheProps,
  type GPURasterTileCacheStats,
  type GPURasterTileCoordinateSpace,
  type GPURasterTileCoreExtractProps,
  type GPURasterTileGraphEntry,
  type GPURasterTileGraphRequest,
  type GPURasterTileHaloFillProps,
  type GPURasterTileHaloPlan,
  type GPURasterTileHaloRequest,
  type GPURasterTileHaloSource,
  type GPURasterTileLevel,
  type GPURasterTileReleaseFence,
  type GPURasterTileRequest,
  type GPURasterTileSource,
  type GPURasterTileSourceMetadata,
  type RasterDeviceLimits,
  type RasterDispatchStripe
} from '@luma.gl/experimental/luraster';
import type {
  CompiledGPUCommandGraph,
  GPUCommandGraphContributor,
  GPUReductionMask,
  GraphDataView
} from '@luma.gl/experimental';

declare const contributor: GPUCommandGraphContributor;
declare const rasterBand: GPURasterBand;
declare const bandMathOperation: GPURasterBandMathOperation;
declare const bandMathOptions: GPURasterBandMathProps;
declare const binaryMorphologyOptions: GPURasterBinaryMorphologyProps;
declare const borderMode: GPURasterBorderMode;
declare const closingOptions: GPURasterClosingProps;
declare const contrastDomain: GPURasterContrastDomain;
declare const contrastMode: GPURasterContrastMode;
declare const contrastOptions: GPURasterContrastProps;
declare const contourClassifierOptions: GPURasterContourClassifierProps;
declare const contourLevel: GPURasterContourLevel;
declare const contourOptions: GPURasterContoursProps;
declare const convolutionOptions: GPURasterConvolutionProps;
declare const decodedFloatBand: GPURasterDecodedBand<'float32'>;
declare const decodedSignedBand: GPURasterDecodedBand<'sint32'>;
declare const decodedTile: GPURasterDecodedTile;
declare const decodedUnsignedBand: GPURasterDecodedBand<'uint32'>;
declare const dilationOptions: GPURasterDilationProps;
declare const edgeOptions: GPURasterEdgeProps;
declare const erosionOptions: GPURasterErosionProps;
declare const gaussianOptions: GPURasterGaussianBlurProps;
declare const grayscaleMorphologyOptions: GPURasterGrayscaleMorphologyProps;
declare const gradientDirection: GPURasterGradientDirection;
declare const gradientMagnitudeOptions: GPURasterGradientMagnitudeProps;
declare const gradientOperator: GPURasterGradientOperator;
declare const gradientOptions: GPURasterGradientProps;
declare const haloStage: GPURasterHaloStage;
declare const histogramDomain: GPURasterHistogramDomain<'float32'>;
declare const histogramOptions: GPURasterHistogramProps<'float32'>;
declare const laplacianConnectivity: GPURasterLaplacianConnectivity;
declare const laplacianOptions: GPURasterLaplacianProps;
declare const rasterMetadata: GPURasterMetadata;
declare const morphologyBaseOptions: GPURasterMorphologyBaseProps;
declare const morphologyMode: GPURasterMorphologyMode;
declare const morphologyNoDataPolicy: GPURasterMorphologyNoDataPolicy;
declare const morphologyOperation: GPURasterMorphologyOperation;
declare const morphologyOptions: GPURasterMorphologyProps;
declare const ndviOptions: GPURasterNDVIProps;
declare const neighborhoodOptions: GPURasterNeighborhoodProps;
declare const neighborhoodRadius: GPURasterNeighborhoodRadius;
declare const noDataPolicy: GPURasterNoDataPolicy;
declare const openingOptions: GPURasterOpeningProps;
declare const otsuDomain: GPURasterOtsuDomain;
declare const otsuOptions: GPURasterOtsuThresholdProps;
declare const pixelBounds: GPURasterPixelBounds;
declare const residentBand: GPURasterResidentBand;
declare const residentTile: GPURasterResidentTile;
declare const scharrOptions: GPURasterScharrProps;
declare const sobelOptions: GPURasterSobelProps;
declare const statisticsOptions: GPURasterStatisticsProps;
declare const smoothingOptions: GPURasterSmoothingProps;
declare const structuringElement: GPURasterStructuringElement;
declare const thresholdOperation: GPURasterThresholdOperation;
declare const thresholdOptions: GPURasterThresholdProps;
declare const thresholdValue: GPURasterThresholdValue;
declare const tileBandMetadata: GPURasterTileBandMetadata<'uint32'>;
declare const tileCacheBudgets: GPURasterTileCacheBudgets;
declare const tileCacheOptions: GPURasterTileCacheProps;
declare const tileCacheStats: GPURasterTileCacheStats;
declare const tileCoordinateSpace: GPURasterTileCoordinateSpace;
declare const tileCoreExtractOptions: GPURasterTileCoreExtractProps<'uint32'>;
declare const tileGraphEntry: GPURasterTileGraphEntry<{readonly name: string}>;
declare const tileGraphRequest: GPURasterTileGraphRequest<{readonly name: string}>;
declare const tileHaloFillOptions: GPURasterTileHaloFillProps<'float32'>;
declare const tileHaloPlan: GPURasterTileHaloPlan;
declare const tileHaloRequest: GPURasterTileHaloRequest;
declare const tileHaloSource: GPURasterTileHaloSource<'float32'>;
declare const tileLevel: GPURasterTileLevel;
declare const tileReleaseFence: GPURasterTileReleaseFence;
declare const tileRequest: GPURasterTileRequest;
declare const tileSource: GPURasterTileSource;
declare const tileSourceMetadata: GPURasterTileSourceMetadata;
declare const rasterDeviceLimits: RasterDeviceLimits;
declare const rasterDispatchStripe: RasterDispatchStripe;
declare const reductionMask: GPUReductionMask;
declare const bandMath: GPURasterBandMath;
declare const boxBlur: GPURasterBoxBlur;
declare const closing: GPURasterClosing;
declare const contrast: GPURasterContrast;
declare const contourClassifier: GPURasterContourClassifier;
declare const contours: GPURasterContours;
declare const convolution: GPURasterConvolution;
declare const dilation: GPURasterDilation;
declare const erosion: GPURasterErosion;
declare const gaussianBlur: GPURasterGaussianBlur;
declare const gradient: GPURasterGradient;
declare const gradientMagnitude: GPURasterGradientMagnitude;
declare const laplacian: GPURasterLaplacian;
declare const morphology: GPURasterMorphology;
declare const ndvi: GPURasterNDVI;
declare const neighborhood: GPURasterNeighborhood;
declare const opening: GPURasterOpening;
declare const otsu: GPURasterOtsuThreshold;
declare const scharr: GPURasterScharr;
declare const sobel: GPURasterSobel;
declare const statistics: GPURasterStatistics;
declare const histogram: GPURasterHistogram<'float32'>;
declare const threshold: GPURasterThreshold;
declare const tileCache: GPURasterTileCache;
declare const tileCoreExtract: GPURasterTileCoreExtract<'uint32'>;
declare const tileGraphLease: GPURasterTileGraphLease<{readonly name: string}>;
declare const tileHaloAssembler: GPURasterTileHaloAssembler;
declare const tileHaloFill: GPURasterTileHaloFill<'float32'>;
declare const tileHaloLease: GPURasterTileHaloLease;
declare const tileLease: GPURasterTileLease;
declare const tileReader: GPURasterTileReader;
declare const textureToBuffer: GPURasterTextureToBuffer;
const bandMathContributor: GPUCommandGraphContributor = bandMath;
const boxBlurContributor: GPUCommandGraphContributor = boxBlur;
const closingContributor: GPUCommandGraphContributor = closing;
const contrastContributor: GPUCommandGraphContributor = contrast;
const contourClassifierContributor: GPUCommandGraphContributor = contourClassifier;
const contoursContributor: GPUCommandGraphContributor = contours;
const convolutionContributor: GPUCommandGraphContributor = convolution;
const dilationContributor: GPUCommandGraphContributor = dilation;
const erosionContributor: GPUCommandGraphContributor = erosion;
const gaussianBlurContributor: GPUCommandGraphContributor = gaussianBlur;
const gradientContributor: GPUCommandGraphContributor = gradient;
const gradientMagnitudeContributor: GPUCommandGraphContributor = gradientMagnitude;
const laplacianContributor: GPUCommandGraphContributor = laplacian;
const morphologyContributor: GPUCommandGraphContributor = morphology;
const ndviContributor: GPUCommandGraphContributor = ndvi;
const neighborhoodContributor: GPUCommandGraphContributor = neighborhood;
const openingContributor: GPUCommandGraphContributor = opening;
const otsuContributor: GPUCommandGraphContributor = otsu;
const scharrContributor: GPUCommandGraphContributor = scharr;
const sobelContributor: GPUCommandGraphContributor = sobel;
const statisticsContributor: GPUCommandGraphContributor = statistics;
const histogramContributor: GPUCommandGraphContributor = histogram;
const thresholdContributor: GPUCommandGraphContributor = threshold;
const tileCoreExtractContributor: GPUCommandGraphContributor = tileCoreExtract;
const tileHaloFillContributor: GPUCommandGraphContributor = tileHaloFill;
const rasterContributor: GPUCommandGraphContributor = textureToBuffer;
const configuredGradient: GPUCommandGraphContributor = new GPURasterGradient(gradientOptions);
const configuredGradientMagnitude: GPUCommandGraphContributor = new GPURasterGradientMagnitude(
  gradientMagnitudeOptions
);
const configuredLaplacian: GPUCommandGraphContributor = new GPURasterLaplacian(laplacianOptions);
const configuredMorphology: GPUCommandGraphContributor = new GPURasterMorphology(morphologyOptions);
const configuredBinaryDilation: GPUCommandGraphContributor = new GPURasterDilation(
  binaryMorphologyOptions
);
const configuredGrayscaleErosion: GPUCommandGraphContributor = new GPURasterErosion(
  grayscaleMorphologyOptions
);
const configuredDilation: GPUCommandGraphContributor = new GPURasterDilation(dilationOptions);
const configuredErosion: GPUCommandGraphContributor = new GPURasterErosion(erosionOptions);
const configuredOpening: GPUCommandGraphContributor = new GPURasterOpening(openingOptions);
const configuredClosing: GPUCommandGraphContributor = new GPURasterClosing(closingOptions);
const configuredScharr: GPUCommandGraphContributor = new GPURasterScharr(scharrOptions);
const configuredSobel: GPUCommandGraphContributor = new GPURasterSobel(sobelOptions);
const configuredTileCache = new GPURasterTileCache(tileCacheOptions);
const configuredTileCoreExtract: GPUCommandGraphContributor = new GPURasterTileCoreExtract(
  tileCoreExtractOptions
);
const configuredTileHaloAssembler = new GPURasterTileHaloAssembler(configuredTileCache);
const configuredTileHaloFill: GPUCommandGraphContributor = new GPURasterTileHaloFill(
  tileHaloFillOptions
);
const configuredTileReader = new GPURasterTileReader(tileSource);
const normalizedTileRequest: GPURasterTileRequest = configuredTileReader.normalizeTileRequest(
  tileRequest
);
const residentTilePromise: Promise<GPURasterTileLease> = configuredTileCache.acquire(tileRequest);
const cancelledResidentTilePromise: Promise<GPURasterTileLease> = configuredTileCache.acquire(
  tileRequest,
  new AbortController().signal
);
const plannedTileHalo: GPURasterTileHaloPlan = configuredTileHaloAssembler.plan(tileHaloRequest);
const acquiredTileHalo: Promise<GPURasterTileHaloLease> = configuredTileHaloAssembler.acquire(
  tileHaloRequest
);
const cancelledTileHalo: Promise<GPURasterTileHaloLease> = configuredTileHaloAssembler.acquire(
  tileHaloRequest,
  new AbortController().signal
);
const graphLeasePromise: Promise<GPURasterTileGraphLease<{readonly name: string}>> =
  configuredTileCache.acquireGraph(tileLease, tileGraphRequest);
const leasedResidentTile: GPURasterResidentTile = tileLease.tile;
const leasedDecodedTile: GPURasterDecodedTile = tileLease.decoded;
const leasedResidentBands: readonly GPURasterResidentBand[] = tileLease.bands;
const leasedCompiledGraph: CompiledGPUCommandGraph = tileGraphLease.graph;
const leasedGraphName: string = tileGraphLease.value.name;
const explicitPromiseFence: GPURasterTileReleaseFence = Promise.resolve();
const explicitSignaledFence: GPURasterTileReleaseFence = {signaled: Promise.resolve()};
const releasedResidentTile: Promise<void> = tileLease.releaseAfter(tileReleaseFence);
const releasedGraph: Promise<void> = tileGraphLease.releaseAfter(explicitPromiseFence);
const releasedTileHalo: Promise<void> = tileHaloLease.releaseAfter(explicitSignaledFence);
const publishedTileCacheBudgets: GPURasterTileCacheBudgets = configuredTileCache.budgets;
const publishedTileCacheStats: GPURasterTileCacheStats = configuredTileCache.stats;
configuredTileCache.setBudgets({maxTiles: 2, maxGpuBytes: 4194304});
tileLease.release();
tileGraphLease.release();
tileHaloLease.release();
const decodedTilePromise: Promise<GPURasterDecodedTile> = configuredTileReader.readTile(tileRequest);
const cancelledTilePromise: Promise<GPURasterDecodedTile> = configuredTileReader.readTile(
  tileRequest,
  new AbortController().signal
);
const syntheticFloatBand: GPURasterDecodedBand<'float32'> = {
  id: 'red',
  format: 'float32',
  values: new Float32Array(4),
  validity: new Uint32Array(4)
};
const syntheticUnsignedBand: GPURasterDecodedBand<'uint32'> = {
  id: 'classification',
  format: 'uint32',
  values: new Uint32Array(4)
};
const syntheticSignedBand: GPURasterDecodedBand<'sint32'> = {
  id: 'elevation',
  format: 'sint32',
  values: new Int32Array(4)
};
const applicationOwnedTileSource: GPURasterTileSource = {
  metadata: tileSourceMetadata,
  async readTile(request, signal) {
    signal.throwIfAborted();
    void request;
    return decodedTile;
  }
};
const supportedGradientOperators: readonly GPURasterGradientOperator[] = ['sobel', 'scharr'];
const supportedGradientDirections: readonly GPURasterGradientDirection[] = ['x', 'y'];
const supportedLaplacianConnectivities: readonly GPURasterLaplacianConnectivity[] = [4, 8];
const supportedMorphologyModes: readonly GPURasterMorphologyMode[] = ['binary', 'grayscale'];
const supportedMorphologyOperations: readonly GPURasterMorphologyOperation[] = [
  'dilate',
  'erode'
];
const supportedStructuringElements: readonly GPURasterStructuringElement[] = ['square', 'cross'];
const supportedMorphologyNoDataPolicies: readonly GPURasterMorphologyNoDataPolicy[] = [
  'propagate',
  'ignore'
];
const binaryMorphologyOutput: GraphDataView<'uint32'> = binaryMorphologyOptions.output;
const grayscaleMorphologyOutput: GraphDataView<'float32'> = grayscaleMorphologyOptions.output;
const binaryMorphologyInputFormat: 'uint32' = binaryMorphologyOptions.input.format;
const supportedTileCoordinateSpaces: readonly GPURasterTileCoordinateSpace[] = [
  'level',
  'level-zero'
];
const decodedFloatValues: Float32Array = decodedFloatBand.values;
const decodedSignedValues: Int32Array = decodedSignedBand.values;
const decodedUnsignedValues: Uint32Array = decodedUnsignedBand.values;
const decodedValidity: Uint32Array | undefined = decodedFloatBand.validity;
const exactTileDownsample: readonly [number, number] = tileLevel.downsample;
const decodedTileBounds: GPURasterPixelBounds = decodedTile.pixelBounds;
const decodedLevelZeroBounds: GPURasterPixelBounds = decodedTile.levelZeroBounds;
const requestedHaloStages: readonly GPURasterHaloStage[] = tileHaloRequest.stages;
const anisotropicHaloStage: GPURasterHaloStage = {
  requiredHalo: 3,
  horizontalRadius: 3,
  verticalRadius: 0
};
const declaredStageHalo: number = haloStage.requiredHalo;
const declaredHorizontalStageHalo: number | undefined = haloStage.horizontalRadius;
const declaredVerticalStageHalo: number | undefined = haloStage.verticalRadius;
const plannedHaloLevel: number = tileHaloPlan.level;
const plannedHaloColumn: number = tileHaloPlan.column;
const plannedHaloRow: number = tileHaloPlan.row;
const plannedCumulativeHalo: number = tileHaloPlan.requiredHalo;
const plannedHorizontalHalo: number = tileHaloPlan.horizontalHalo;
const plannedVerticalHalo: number = tileHaloPlan.verticalHalo;
const plannedLevelZeroHalo: readonly [number, number] = tileHaloPlan.levelZeroHalo;
const plannedCoreBounds: GPURasterPixelBounds = tileHaloPlan.corePixelBounds;
const plannedAvailableBounds: GPURasterPixelBounds = tileHaloPlan.availablePixelBounds;
const plannedHaloWidth: number = tileHaloPlan.width;
const plannedHaloHeight: number = tileHaloPlan.height;
const plannedCoreWidth: number = tileHaloPlan.coreWidth;
const plannedCoreHeight: number = tileHaloPlan.coreHeight;
const plannedNeighborRequests: readonly GPURasterTileRequest[] = tileHaloPlan.requests;
const leasedHaloPlan: GPURasterTileHaloPlan = tileHaloLease.plan;
const leasedHaloCore: GPURasterTileLease = tileHaloLease.core;
const leasedHaloSources: readonly GPURasterTileLease[] = tileHaloLease.tiles;
const leasedNeighborCount: number = tileHaloLease.tiles.length;
const selectedHaloSourceBounds: GPURasterPixelBounds = tileHaloSource.pixelBounds;
const selectedHaloSourceFormat: 'float32' = tileHaloSource.input.format;
const floatingHaloOutput: GraphDataView<'float32'> = tileHaloFillOptions.output;
const floatingHaloValidity: GraphDataView<'uint32'> = tileHaloFillOptions.outputValidity;
const unsignedCoreOutput: GraphDataView<'uint32'> = tileCoreExtractOptions.output;
const unsignedCoreValidity: GraphDataView<'uint32'> = tileCoreExtractOptions.outputValidity;
const boundedTileCapacity: number = tileCacheBudgets.maxTiles;
const boundedGraphCapacity: number = tileCacheBudgets.maxGraphs;
const boundedCpuBytes: number = tileCacheBudgets.maxCpuBytes;
const boundedGpuBytes: number = tileCacheBudgets.maxGpuBytes;
const observedCacheHits: number = tileCacheStats.tileHits;
const observedCacheEvictions: number = tileCacheStats.tileEvictions;
const observedGraphHits: number = tileCacheStats.graphHits;
const observedGraphCompilations: number = tileCacheStats.graphCompilations;
const observedPinnedTiles: number = tileCacheStats.pinnedTiles;
const observedPinnedGraphs: number = tileCacheStats.pinnedGraphs;
const observedCpuBytes: number = tileCacheStats.cpuBytes;
const observedGpuBytes: number = tileCacheStats.gpuBytes;
const residentBandBytes: number = residentBand.buffer.byteLength;
const residentTileCpuBytes: number = residentTile.cpuByteLength;
const residentTileGpuBytes: number = residentTile.gpuByteLength;
const declaredGraphBudget: number = tileGraphRequest.estimatedByteLength;
const declaredGraphHalo: number | undefined = tileGraphRequest.halo;
const separatelyOwnedGraphBytes: number = tileGraphEntry.byteLength;
const physicalGraphTransientBytes: number =
  tileGraphEntry.graph.stats.physicalTransientResourceBytes;
// @ts-expect-error Only the independently implemented Sobel and Scharr kernels are public.
const unsupportedGradientOperator: GPURasterGradientOperator = 'prewitt';
// @ts-expect-error Two-dimensional rasters expose only horizontal and vertical derivatives.
const unsupportedGradientDirection: GPURasterGradientDirection = 'z';
// @ts-expect-error Laplacian neighborhoods support four or eight adjacent raster pixels.
const unsupportedLaplacianConnectivity: GPURasterLaplacianConnectivity = 6;
// @ts-expect-error Morphology exposes binary and grayscale scalar contracts only.
const unsupportedMorphologyMode: GPURasterMorphologyMode = 'rgb';
// @ts-expect-error Opening and closing are explicit composed contributors.
const unsupportedMorphologyOperation: GPURasterMorphologyOperation = 'opening';
// @ts-expect-error Only square and Manhattan-cross footprints are implemented.
const unsupportedStructuringElement: GPURasterStructuringElement = 'disk';
// @ts-expect-error Max/min morphology never renormalizes missing neighbors.
const unsupportedMorphologyNoDataPolicy: GPURasterMorphologyNoDataPolicy = 'ignore-renormalize';
// @ts-expect-error Binary morphology publishes canonical uint32 values, not float32.
const invalidBinaryMorphologyOutput: GraphDataView<'float32'> = binaryMorphologyOptions.output;
// @ts-expect-error Grayscale morphology publishes calibrated float32 values, not uint32.
const invalidGrayscaleMorphologyOutput: GraphDataView<'uint32'> = grayscaleMorphologyOptions.output;
// @ts-expect-error Source windows are expressed in level-local or level-zero pixels only.
const unsupportedTileCoordinateSpace: GPURasterTileCoordinateSpace = 'projected-world';
// @ts-expect-error Floating decoded bands preserve Float32Array storage.
const invalidFloatDecodedValues: Uint32Array = decodedFloatBand.values;
// @ts-expect-error Unsigned decoded bands preserve Uint32Array storage exactly.
const invalidUnsignedDecodedValues: Float32Array = decodedUnsignedBand.values;
// @ts-expect-error Signed decoded bands preserve Int32Array storage exactly.
const invalidSignedDecodedValues: Uint32Array = decodedSignedBand.values;
// @ts-expect-error Compiled graph admission requires an explicit conservative GPU byte estimate.
const missingGraphAllocationEstimate: GPURasterTileGraphRequest<{readonly name: string}> = {
  pipelineKey: 'unsafe-missing-estimate',
  create: () => tileGraphEntry
};
// @ts-expect-error Graph ownership requires a destruction callback for owner-managed resources.
const missingGraphOwnerCleanup: GPURasterTileGraphEntry<{readonly name: string}> = {
  graph: tileGraphEntry.graph,
  value: {name: 'unmanaged-output'},
  byteLength: 1024
};
// @ts-expect-error Fence release accepts completion promises, never an arbitrary numeric delay.
const invalidTileReleaseFence: GPURasterTileReleaseFence = 100;
// @ts-expect-error Cumulative halo requests require an explicitly ordered stage sequence.
const missingHaloStages: GPURasterTileHaloRequest = tileRequest;
// @ts-expect-error Native floating-point halo sources cannot publish uint32 sample values.
const invalidFloatingHaloOutput: GraphDataView<'uint32'> = tileHaloFillOptions.output;
// @ts-expect-error Unsigned core extraction preserves uint32 samples without float conversion.
const invalidUnsignedCoreOutput: GraphDataView<'float32'> = tileCoreExtractOptions.output;

void GPURaster;
void GPURasterBandMath;
void GPURasterBoxBlur;
void GPURasterBufferToTexture;
void GPURasterClosing;
void GPURasterContrast;
void GPURasterContourClassifier;
void GPURasterContours;
void GPURasterConvolution;
void GPURasterDilation;
void GPURasterErosion;
void GPURasterGaussianBlur;
void GPURasterGradient;
void GPURasterGradientMagnitude;
void GPURasterHistogram;
void GPURasterLaplacian;
void GPURasterMorphology;
void GPURasterNDVI;
void GPURasterNeighborhood;
void GPURasterOpening;
void GPURasterOtsuThreshold;
void GPURasterScharr;
void GPURasterSobel;
void GPURasterStatistics;
void GPURasterThreshold;
void GPURasterTileCache;
void GPURasterTileCoreExtract;
void GPURasterTileGraphLease;
void GPURasterTileHaloAssembler;
void GPURasterTileHaloFill;
void GPURasterTileHaloLease;
void GPURasterTileLease;
void GPURasterTileReader;
void GPURasterTextureToBuffer;
void getRasterDeviceLimits;
void planRasterDispatchStripes;
void contributor;
void rasterBand;
void bandMathOperation;
void bandMathOptions;
void binaryMorphologyOptions;
void borderMode;
void closingOptions;
void contrastDomain;
void contrastMode;
void contrastOptions;
void contourClassifierOptions;
void contourLevel;
void contourOptions;
void convolutionOptions;
void decodedFloatBand;
void decodedSignedBand;
void decodedTile;
void decodedUnsignedBand;
void dilationOptions;
void edgeOptions;
void erosionOptions;
void gaussianOptions;
void grayscaleMorphologyOptions;
void gradientDirection;
void gradientMagnitudeOptions;
void gradientOperator;
void gradientOptions;
void haloStage;
void histogramDomain;
void histogramOptions;
void laplacianConnectivity;
void laplacianOptions;
void rasterMetadata;
void morphologyBaseOptions;
void morphologyMode;
void morphologyNoDataPolicy;
void morphologyOperation;
void morphologyOptions;
void ndviOptions;
void neighborhoodOptions;
void neighborhoodRadius;
void noDataPolicy;
void openingOptions;
void otsuDomain;
void otsuOptions;
void pixelBounds;
void residentBand;
void residentTile;
void scharrOptions;
void sobelOptions;
void statisticsOptions;
void smoothingOptions;
void structuringElement;
void thresholdOperation;
void thresholdOptions;
void thresholdValue;
void tileBandMetadata;
void tileCacheBudgets;
void tileCacheOptions;
void tileCacheStats;
void tileCoordinateSpace;
void tileCoreExtractOptions;
void tileGraphEntry;
void tileGraphRequest;
void tileHaloFillOptions;
void tileHaloPlan;
void tileHaloRequest;
void tileHaloSource;
void tileLevel;
void tileReleaseFence;
void tileRequest;
void tileSource;
void tileSourceMetadata;
void rasterDeviceLimits;
void rasterDispatchStripe;
void reductionMask;
void bandMathContributor;
void boxBlurContributor;
void closingContributor;
void contrastContributor;
void contourClassifierContributor;
void contoursContributor;
void convolutionContributor;
void dilationContributor;
void erosionContributor;
void gaussianBlurContributor;
void gradientContributor;
void gradientMagnitudeContributor;
void laplacianContributor;
void morphologyContributor;
void ndviContributor;
void neighborhoodContributor;
void openingContributor;
void otsuContributor;
void scharrContributor;
void sobelContributor;
void statisticsContributor;
void histogramContributor;
void thresholdContributor;
void tileCoreExtractContributor;
void tileHaloFillContributor;
void rasterContributor;
void configuredGradient;
void configuredGradientMagnitude;
void configuredLaplacian;
void configuredMorphology;
void configuredBinaryDilation;
void configuredGrayscaleErosion;
void configuredDilation;
void configuredErosion;
void configuredOpening;
void configuredClosing;
void configuredScharr;
void configuredSobel;
void configuredTileCache;
void configuredTileCoreExtract;
void configuredTileHaloAssembler;
void configuredTileHaloFill;
void configuredTileReader;
void normalizedTileRequest;
void residentTilePromise;
void cancelledResidentTilePromise;
void plannedTileHalo;
void acquiredTileHalo;
void cancelledTileHalo;
void graphLeasePromise;
void leasedResidentTile;
void leasedDecodedTile;
void leasedResidentBands;
void leasedCompiledGraph;
void leasedGraphName;
void explicitPromiseFence;
void explicitSignaledFence;
void releasedResidentTile;
void releasedGraph;
void releasedTileHalo;
void publishedTileCacheBudgets;
void publishedTileCacheStats;
void decodedTilePromise;
void cancelledTilePromise;
void syntheticFloatBand;
void syntheticUnsignedBand;
void syntheticSignedBand;
void applicationOwnedTileSource;
void supportedGradientOperators;
void supportedGradientDirections;
void supportedLaplacianConnectivities;
void supportedMorphologyModes;
void supportedMorphologyOperations;
void supportedStructuringElements;
void supportedMorphologyNoDataPolicies;
void binaryMorphologyOutput;
void grayscaleMorphologyOutput;
void binaryMorphologyInputFormat;
void supportedTileCoordinateSpaces;
void decodedFloatValues;
void decodedSignedValues;
void decodedUnsignedValues;
void decodedValidity;
void exactTileDownsample;
void decodedTileBounds;
void decodedLevelZeroBounds;
void requestedHaloStages;
void anisotropicHaloStage;
void declaredStageHalo;
void declaredHorizontalStageHalo;
void declaredVerticalStageHalo;
void plannedHaloLevel;
void plannedHaloColumn;
void plannedHaloRow;
void plannedCumulativeHalo;
void plannedHorizontalHalo;
void plannedVerticalHalo;
void plannedLevelZeroHalo;
void plannedCoreBounds;
void plannedAvailableBounds;
void plannedHaloWidth;
void plannedHaloHeight;
void plannedCoreWidth;
void plannedCoreHeight;
void plannedNeighborRequests;
void leasedHaloPlan;
void leasedHaloCore;
void leasedHaloSources;
void leasedNeighborCount;
void selectedHaloSourceBounds;
void selectedHaloSourceFormat;
void floatingHaloOutput;
void floatingHaloValidity;
void unsignedCoreOutput;
void unsignedCoreValidity;
void boundedTileCapacity;
void boundedGraphCapacity;
void boundedCpuBytes;
void boundedGpuBytes;
void observedCacheHits;
void observedCacheEvictions;
void observedGraphHits;
void observedGraphCompilations;
void observedPinnedTiles;
void observedPinnedGraphs;
void observedCpuBytes;
void observedGpuBytes;
void residentBandBytes;
void residentTileCpuBytes;
void residentTileGpuBytes;
void declaredGraphHalo;
void separatelyOwnedGraphBytes;
void physicalGraphTransientBytes;
void declaredGraphBudget;
void unsupportedGradientOperator;
void unsupportedGradientDirection;
void unsupportedLaplacianConnectivity;
void unsupportedMorphologyMode;
void unsupportedMorphologyOperation;
void unsupportedStructuringElement;
void unsupportedMorphologyNoDataPolicy;
void invalidBinaryMorphologyOutput;
void invalidGrayscaleMorphologyOutput;
void unsupportedTileCoordinateSpace;
void invalidFloatDecodedValues;
void invalidUnsignedDecodedValues;
void invalidSignedDecodedValues;
void missingGraphAllocationEstimate;
void missingGraphOwnerCleanup;
void invalidTileReleaseFence;
void missingHaloStages;
void invalidFloatingHaloOutput;
void invalidUnsignedCoreOutput;
void tileCache;
void tileCoreExtract;
void tileGraphLease;
void tileHaloAssembler;
void tileHaloFill;
void tileHaloLease;
void tileLease;
void tileReader;

// @ts-expect-error Raster algorithms stay isolated from the experimental root.
import {GPURaster as RootGPURaster} from '@luma.gl/experimental';
void RootGPURaster;
// @ts-expect-error Pointwise contributors stay isolated from the experimental root.
import {GPURasterNDVI as RootGPURasterNDVI} from '@luma.gl/experimental';
void RootGPURasterNDVI;
// @ts-expect-error Contour contributors stay isolated from the experimental root.
import {GPURasterContours as RootGPURasterContours} from '@luma.gl/experimental';
void RootGPURasterContours;
// @ts-expect-error Neighborhood contributors stay isolated from the experimental root.
import {GPURasterGaussianBlur as RootGPURasterGaussianBlur} from '@luma.gl/experimental';
void RootGPURasterGaussianBlur;
// @ts-expect-error Analytical gradient contributors stay isolated from the experimental root.
import {GPURasterGradient as RootGPURasterGradient} from '@luma.gl/experimental';
void RootGPURasterGradient;
// @ts-expect-error Gradient-magnitude contributors stay isolated from the experimental root.
import {GPURasterGradientMagnitude as RootGPURasterGradientMagnitude} from '@luma.gl/experimental';
void RootGPURasterGradientMagnitude;
// @ts-expect-error Morphology contributors remain isolated from the experimental root.
import {GPURasterMorphology as RootGPURasterMorphology} from '@luma.gl/experimental';
void RootGPURasterMorphology;
// @ts-expect-error Composed morphology remains isolated from the experimental root.
import {GPURasterClosing as RootGPURasterClosing} from '@luma.gl/experimental';
void RootGPURasterClosing;
// @ts-expect-error External raster tile sources remain isolated from the experimental root.
import {GPURasterTileReader as RootGPURasterTileReader} from '@luma.gl/experimental';
void RootGPURasterTileReader;
// @ts-expect-error Budgeted tile residency stays isolated from the experimental root.
import {GPURasterTileCache as RootGPURasterTileCache} from '@luma.gl/experimental';
void RootGPURasterTileCache;
// @ts-expect-error Fence-safe graph leases stay isolated from the experimental root.
import {GPURasterTileGraphLease as RootGPURasterTileGraphLease} from '@luma.gl/experimental';
void RootGPURasterTileGraphLease;
// @ts-expect-error Fence-safe resident tile leases stay isolated from the experimental root.
import {GPURasterTileLease as RootGPURasterTileLease} from '@luma.gl/experimental';
void RootGPURasterTileLease;
// @ts-expect-error Cumulative halo planners stay isolated from the experimental root.
import {GPURasterTileHaloAssembler as RootGPURasterTileHaloAssembler} from '@luma.gl/experimental';
void RootGPURasterTileHaloAssembler;
// @ts-expect-error Graph-native halo assembly stays isolated from the experimental root.
import {GPURasterTileHaloFill as RootGPURasterTileHaloFill} from '@luma.gl/experimental';
void RootGPURasterTileHaloFill;
// @ts-expect-error Core-only extraction stays isolated from the experimental root.
import {GPURasterTileCoreExtract as RootGPURasterTileCoreExtract} from '@luma.gl/experimental';
void RootGPURasterTileCoreExtract;
`
  );
  assert.equal(
    createRequire(typeTestPath).resolve('@luma.gl/experimental/luraster'),
    commonJsEntry,
    "the temporary consumer resolves this worktree's experimental package"
  );

  const program = typescript.createProgram([typeTestPath], {
    module: typescript.ModuleKind.NodeNext,
    moduleResolution: typescript.ModuleResolutionKind.NodeNext,
    noEmit: true,
    skipLibCheck: true,
    strict: true,
    target: typescript.ScriptTarget.ES2022,
    types: []
  });
  const diagnostics = typescript.getPreEmitDiagnostics(program);
  assert.equal(
    diagnostics.length,
    0,
    typescript.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (fileName) => fileName,
      getCurrentDirectory: () => temporaryDirectory,
      getNewLine: () => '\n'
    })
  );
} finally {
  rmSync(temporaryDirectory, {force: true, recursive: true});
}

console.log('Verified @luma.gl/experimental/luraster ESM, CJS, and declaration imports.');
