import type {BackendModule} from '@luma.gl/gpgpu';
import {
  ALBERS_USGS_5070,
  albers as albersOperation,
  executeCPUAlbers,
  executeWebGLAlbers,
  executeWebGPUAlbers,
  rawAlbers
} from './albers';
import {
  degreesToQuantized,
  executeCPUDegreesToQuantized,
  executeWebGLDegreesToQuantized,
  executeWebGPUDegreesToQuantized
} from './degrees-to-quantized';
import {
  equirectangular as equirectangularOperation,
  executeCPUEquirectangular,
  executeWebGLEquirectangular,
  executeWebGPUEquirectangular,
  rawEquirectangular
} from './equirectangular';
import {
  executeCPUNaturalEarth,
  executeWebGLNaturalEarth,
  executeWebGPUNaturalEarth,
  naturalEarth as naturalEarthOperation,
  rawNaturalEarth
} from './natural-earth';
import {
  executeCPUSplitUint32,
  executeWebGLSplitUint32,
  executeWebGPUSplitUint32,
  splitUint32
} from './split-uint32';
import {
  executeCPUStereographic,
  executeWebGLStereographic,
  executeWebGPUStereographic,
  rawStereographic,
  stereographic as stereographicOperation
} from './stereographic';
import {
  executeCPUWebMercator,
  executeWebGLWebMercator,
  executeWebGPUWebMercator,
  rawWebMercator,
  webMercator as webMercatorOperation
} from './web-mercator';

export * from './projection-parameters';
export * from './projection-shader-utils';
export * from './projection-utils';
export type {AlbersProjectionParameters} from './albers';
export type {StereographicProjectionParameters} from './stereographic';
export {ALBERS_USGS_5070, degreesToQuantized, splitUint32};

export const albers = Object.assign(albersOperation, {raw: rawAlbers});
export const equirectangular = Object.assign(equirectangularOperation, {
  raw: rawEquirectangular
});
export const naturalEarth = Object.assign(naturalEarthOperation, {raw: rawNaturalEarth});
export const stereographic = Object.assign(stereographicOperation, {raw: rawStereographic});
export const webMercator = Object.assign(webMercatorOperation, {raw: rawWebMercator});

export const projectionCPUBackend = {
  albers: executeCPUAlbers,
  degreesToQuantized: executeCPUDegreesToQuantized,
  equirectangular: executeCPUEquirectangular,
  naturalEarth: executeCPUNaturalEarth,
  splitUint32: executeCPUSplitUint32,
  stereographic: executeCPUStereographic,
  webMercator: executeCPUWebMercator
} satisfies BackendModule;

export const projectionWebGLBackend = {
  albers: executeWebGLAlbers,
  degreesToQuantized: executeWebGLDegreesToQuantized,
  equirectangular: executeWebGLEquirectangular,
  naturalEarth: executeWebGLNaturalEarth,
  splitUint32: executeWebGLSplitUint32,
  stereographic: executeWebGLStereographic,
  webMercator: executeWebGLWebMercator
} satisfies BackendModule;

export const projectionWebGPUBackend = {
  albers: executeWebGPUAlbers,
  degreesToQuantized: executeWebGPUDegreesToQuantized,
  equirectangular: executeWebGPUEquirectangular,
  naturalEarth: executeWebGPUNaturalEarth,
  splitUint32: executeWebGPUSplitUint32,
  stereographic: executeWebGPUStereographic,
  webMercator: executeWebGPUWebMercator
} satisfies BackendModule;
