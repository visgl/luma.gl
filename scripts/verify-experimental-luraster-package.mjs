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

assert.doesNotThrow(() => readFileSync(declarationEntry, 'utf8'), 'LuRaster declarations exist');

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
  'GPURasterContrast',
  'GPURasterContourClassifier',
  'GPURasterContours',
  'GPURasterConvolution',
  'GPURasterGaussianBlur',
  'GPURasterGradient',
  'GPURasterGradientMagnitude',
  'GPURasterHistogram',
  'GPURasterLaplacian',
  'GPURasterNDVI',
  'GPURasterNeighborhood',
  'GPURasterOtsuThreshold',
  'GPURasterScharr',
  'GPURasterSobel',
  'GPURasterStatistics',
  'GPURasterThreshold',
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
  GPURasterContrast,
  GPURasterContourClassifier,
  GPURasterContours,
  GPURasterConvolution,
  GPURasterGaussianBlur,
  GPURasterGradient,
  GPURasterGradientMagnitude,
  GPURasterHistogram,
  GPURasterLaplacian,
  GPURasterNDVI,
  GPURasterNeighborhood,
  GPURasterOtsuThreshold,
  GPURasterScharr,
  GPURasterSobel,
  GPURasterStatistics,
  GPURasterThreshold,
  GPURasterTextureToBuffer,
  getRasterDeviceLimits,
  planRasterDispatchStripes,
  type GPURasterBand,
  type GPURasterBandMathOperation,
  type GPURasterBandMathProps,
  type GPURasterBorderMode,
  type GPURasterContrastDomain,
  type GPURasterContrastMode,
  type GPURasterContrastProps,
  type GPURasterContourClassifierProps,
  type GPURasterContourLevel,
  type GPURasterContoursProps,
  type GPURasterConvolutionProps,
  type GPURasterEdgeProps,
  type GPURasterGaussianBlurProps,
  type GPURasterGradientDirection,
  type GPURasterGradientMagnitudeProps,
  type GPURasterGradientOperator,
  type GPURasterGradientProps,
  type GPURasterHistogramDomain,
  type GPURasterHistogramProps,
  type GPURasterLaplacianConnectivity,
  type GPURasterLaplacianProps,
  type GPURasterMetadata,
  type GPURasterNDVIProps,
  type GPURasterNeighborhoodProps,
  type GPURasterNeighborhoodRadius,
  type GPURasterNoDataPolicy,
  type GPURasterOtsuDomain,
  type GPURasterOtsuThresholdProps,
  type GPURasterScharrProps,
  type GPURasterSobelProps,
  type GPURasterStatisticsProps,
  type GPURasterSmoothingProps,
  type GPURasterThresholdOperation,
  type GPURasterThresholdProps,
  type GPURasterThresholdValue,
  type RasterDeviceLimits,
  type RasterDispatchStripe
} from '@luma.gl/experimental/luraster';
import type {GPUCommandGraphContributor, GPUReductionMask} from '@luma.gl/experimental';

declare const contributor: GPUCommandGraphContributor;
declare const rasterBand: GPURasterBand;
declare const bandMathOperation: GPURasterBandMathOperation;
declare const bandMathOptions: GPURasterBandMathProps;
declare const borderMode: GPURasterBorderMode;
declare const contrastDomain: GPURasterContrastDomain;
declare const contrastMode: GPURasterContrastMode;
declare const contrastOptions: GPURasterContrastProps;
declare const contourClassifierOptions: GPURasterContourClassifierProps;
declare const contourLevel: GPURasterContourLevel;
declare const contourOptions: GPURasterContoursProps;
declare const convolutionOptions: GPURasterConvolutionProps;
declare const edgeOptions: GPURasterEdgeProps;
declare const gaussianOptions: GPURasterGaussianBlurProps;
declare const gradientDirection: GPURasterGradientDirection;
declare const gradientMagnitudeOptions: GPURasterGradientMagnitudeProps;
declare const gradientOperator: GPURasterGradientOperator;
declare const gradientOptions: GPURasterGradientProps;
declare const histogramDomain: GPURasterHistogramDomain<'float32'>;
declare const histogramOptions: GPURasterHistogramProps<'float32'>;
declare const laplacianConnectivity: GPURasterLaplacianConnectivity;
declare const laplacianOptions: GPURasterLaplacianProps;
declare const rasterMetadata: GPURasterMetadata;
declare const ndviOptions: GPURasterNDVIProps;
declare const neighborhoodOptions: GPURasterNeighborhoodProps;
declare const neighborhoodRadius: GPURasterNeighborhoodRadius;
declare const noDataPolicy: GPURasterNoDataPolicy;
declare const otsuDomain: GPURasterOtsuDomain;
declare const otsuOptions: GPURasterOtsuThresholdProps;
declare const scharrOptions: GPURasterScharrProps;
declare const sobelOptions: GPURasterSobelProps;
declare const statisticsOptions: GPURasterStatisticsProps;
declare const smoothingOptions: GPURasterSmoothingProps;
declare const thresholdOperation: GPURasterThresholdOperation;
declare const thresholdOptions: GPURasterThresholdProps;
declare const thresholdValue: GPURasterThresholdValue;
declare const rasterDeviceLimits: RasterDeviceLimits;
declare const rasterDispatchStripe: RasterDispatchStripe;
declare const reductionMask: GPUReductionMask;
declare const bandMath: GPURasterBandMath;
declare const boxBlur: GPURasterBoxBlur;
declare const contrast: GPURasterContrast;
declare const contourClassifier: GPURasterContourClassifier;
declare const contours: GPURasterContours;
declare const convolution: GPURasterConvolution;
declare const gaussianBlur: GPURasterGaussianBlur;
declare const gradient: GPURasterGradient;
declare const gradientMagnitude: GPURasterGradientMagnitude;
declare const laplacian: GPURasterLaplacian;
declare const ndvi: GPURasterNDVI;
declare const neighborhood: GPURasterNeighborhood;
declare const otsu: GPURasterOtsuThreshold;
declare const scharr: GPURasterScharr;
declare const sobel: GPURasterSobel;
declare const statistics: GPURasterStatistics;
declare const histogram: GPURasterHistogram<'float32'>;
declare const threshold: GPURasterThreshold;
declare const textureToBuffer: GPURasterTextureToBuffer;
const bandMathContributor: GPUCommandGraphContributor = bandMath;
const boxBlurContributor: GPUCommandGraphContributor = boxBlur;
const contrastContributor: GPUCommandGraphContributor = contrast;
const contourClassifierContributor: GPUCommandGraphContributor = contourClassifier;
const contoursContributor: GPUCommandGraphContributor = contours;
const convolutionContributor: GPUCommandGraphContributor = convolution;
const gaussianBlurContributor: GPUCommandGraphContributor = gaussianBlur;
const gradientContributor: GPUCommandGraphContributor = gradient;
const gradientMagnitudeContributor: GPUCommandGraphContributor = gradientMagnitude;
const laplacianContributor: GPUCommandGraphContributor = laplacian;
const ndviContributor: GPUCommandGraphContributor = ndvi;
const neighborhoodContributor: GPUCommandGraphContributor = neighborhood;
const otsuContributor: GPUCommandGraphContributor = otsu;
const scharrContributor: GPUCommandGraphContributor = scharr;
const sobelContributor: GPUCommandGraphContributor = sobel;
const statisticsContributor: GPUCommandGraphContributor = statistics;
const histogramContributor: GPUCommandGraphContributor = histogram;
const thresholdContributor: GPUCommandGraphContributor = threshold;
const rasterContributor: GPUCommandGraphContributor = textureToBuffer;
const configuredGradient: GPUCommandGraphContributor = new GPURasterGradient(gradientOptions);
const configuredGradientMagnitude: GPUCommandGraphContributor = new GPURasterGradientMagnitude(
  gradientMagnitudeOptions
);
const configuredLaplacian: GPUCommandGraphContributor = new GPURasterLaplacian(laplacianOptions);
const configuredScharr: GPUCommandGraphContributor = new GPURasterScharr(scharrOptions);
const configuredSobel: GPUCommandGraphContributor = new GPURasterSobel(sobelOptions);
const supportedGradientOperators: readonly GPURasterGradientOperator[] = ['sobel', 'scharr'];
const supportedGradientDirections: readonly GPURasterGradientDirection[] = ['x', 'y'];
const supportedLaplacianConnectivities: readonly GPURasterLaplacianConnectivity[] = [4, 8];
// @ts-expect-error Only the independently implemented Sobel and Scharr kernels are public.
const unsupportedGradientOperator: GPURasterGradientOperator = 'prewitt';
// @ts-expect-error Two-dimensional rasters expose only horizontal and vertical derivatives.
const unsupportedGradientDirection: GPURasterGradientDirection = 'z';
// @ts-expect-error Laplacian neighborhoods support four or eight adjacent raster pixels.
const unsupportedLaplacianConnectivity: GPURasterLaplacianConnectivity = 6;

void GPURaster;
void GPURasterBandMath;
void GPURasterBoxBlur;
void GPURasterBufferToTexture;
void GPURasterContrast;
void GPURasterContourClassifier;
void GPURasterContours;
void GPURasterConvolution;
void GPURasterGaussianBlur;
void GPURasterGradient;
void GPURasterGradientMagnitude;
void GPURasterHistogram;
void GPURasterLaplacian;
void GPURasterNDVI;
void GPURasterNeighborhood;
void GPURasterOtsuThreshold;
void GPURasterScharr;
void GPURasterSobel;
void GPURasterStatistics;
void GPURasterThreshold;
void GPURasterTextureToBuffer;
void getRasterDeviceLimits;
void planRasterDispatchStripes;
void contributor;
void rasterBand;
void bandMathOperation;
void bandMathOptions;
void borderMode;
void contrastDomain;
void contrastMode;
void contrastOptions;
void contourClassifierOptions;
void contourLevel;
void contourOptions;
void convolutionOptions;
void edgeOptions;
void gaussianOptions;
void gradientDirection;
void gradientMagnitudeOptions;
void gradientOperator;
void gradientOptions;
void histogramDomain;
void histogramOptions;
void laplacianConnectivity;
void laplacianOptions;
void rasterMetadata;
void ndviOptions;
void neighborhoodOptions;
void neighborhoodRadius;
void noDataPolicy;
void otsuDomain;
void otsuOptions;
void scharrOptions;
void sobelOptions;
void statisticsOptions;
void smoothingOptions;
void thresholdOperation;
void thresholdOptions;
void thresholdValue;
void rasterDeviceLimits;
void rasterDispatchStripe;
void reductionMask;
void bandMathContributor;
void boxBlurContributor;
void contrastContributor;
void contourClassifierContributor;
void contoursContributor;
void convolutionContributor;
void gaussianBlurContributor;
void gradientContributor;
void gradientMagnitudeContributor;
void laplacianContributor;
void ndviContributor;
void neighborhoodContributor;
void otsuContributor;
void scharrContributor;
void sobelContributor;
void statisticsContributor;
void histogramContributor;
void thresholdContributor;
void rasterContributor;
void configuredGradient;
void configuredGradientMagnitude;
void configuredLaplacian;
void configuredScharr;
void configuredSobel;
void supportedGradientOperators;
void supportedGradientDirections;
void supportedLaplacianConnectivities;
void unsupportedGradientOperator;
void unsupportedGradientDirection;
void unsupportedLaplacianConnectivity;

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
