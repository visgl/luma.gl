// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GPUSplatArrowRecordBatchLike, GPUSplatArrowSource} from '@luma.gl/arrow';

declare global {
  interface Window {
    __lumaGaussianSplatsLocalLoadersRoot?: string;
    __lumaGaussianSplatsLoaderBundleUrl?: string;
  }
}

/** Optional initial viewpoint recorded by an authoritative Gaussian splat scene viewer. */
export type GaussianSplatCameraPreset = {
  position: readonly [number, number, number];
  target: readonly [number, number, number];
};

/** Complete public reference scenes shared with the loaders.gl Gaussian splat showcase. */
export type GaussianSplatSourceCatalogEntry = {
  id: 'train' | 'drjohnson' | 'playroom' | 'truck' | 'coit' | 'train-github' | 'fixture';
  label: string;
  sourceUrl: string;
  sourceUrls?: readonly string[];
  fallbackSourceUrls?: readonly string[];
  expectedSplatCount: number;
  upAxis: 'y' | 'z';
  up: readonly [number, number, number];
  camera?: GaussianSplatCameraPreset;
};

/** Isolated loaders.gl bundle or local checkout and optional selected Gaussian source. */
export type LocalGaussianSplatLoadersConfiguration = {
  loaderMode: 'local' | 'bundled';
  loadersRoot: string;
  loaderBundleUrl?: string;
  sourceUrl: string;
  sourceUrls: readonly string[];
  fallbackSourceUrls: readonly string[];
  sourceFormat: 'PLY' | 'SPLAT' | 'KSPLAT' | 'SPZ' | 'RAD';
  sceneId: GaussianSplatSourceCatalogEntry['id'] | 'custom';
  sourceLabel: string;
  expectedSplatCount?: number;
  expectedBatchCount?: number;
  /** Maximum independently decoded RAD rows retained in the interactive source window. */
  maxResidentSplatCount?: number;
  upAxis: 'y' | 'z';
  up: readonly [number, number, number];
  camera?: GaussianSplatCameraPreset;
};

/** Download, parsing, and fallback progress reported by the real-scene source iterator. */
export type LocalGaussianSplatLoadProgress = {
  phase: 'loading' | 'loaded' | 'fallback' | 'complete';
  loadedBytes: number;
  totalBytes?: number;
  sourceIndex: number;
  sourceCount: number;
  sourceLabel: string;
  fallbackActive: boolean;
  loadedSplatCount: number;
  expectedSplatCount?: number;
  expectedBatchCount?: number;
};

/** Optional cancellation and progress reporting for progressive source loading. */
export type LocalGaussianSplatLoadOptions = {
  signal?: AbortSignal;
  onProgress?: (progress: LocalGaussianSplatLoadProgress) => void;
};

type LocalGaussianSplatLoaderModules = {
  coreModule: Record<string, any>;
  loader: unknown;
  loaderName: string;
};

type LocalGaussianSplatLoadState = {
  loadedSplatCount: number;
  yieldedArrowSourceCount: number;
  fallbackActive: boolean;
};

type LocalGaussianSplatRADSource = {
  getMetadata(): Promise<{
    count: number;
    chunks: readonly {base?: number; count?: number; bytes?: number}[];
    allChunkBytes?: number;
  }>;
  getChunkTable(
    chunkIndex: number,
    options?: {
      signal?: AbortSignal;
      radChunk?: {includeLoDTree: boolean; includeSphericalHarmonics: boolean};
    }
  ): Promise<unknown>;
};

const DEFAULT_GAUSSIAN_PLY_PATH = 'modules/ply/test/data/gaussian/train-1000.ply';
const GAUSSIAN_SPLAT_ARROW_BATCH_SIZE = 65_536;
const DEFAULT_RAD_RESIDENT_SPLAT_COUNT = 1_000_000;
const DOWNLOAD_PROGRESS_INTERVAL_MILLISECONDS = 125;
const HUGGING_FACE_GAUSSIAN_SPLAT_BASE_URL =
  'https://huggingface.co/datasets/Voxel51/gaussian_splatting/resolve/main/FO_dataset';
const GITHUB_GAUSSIAN_SPLAT_BASE_URL =
  'https://raw.githubusercontent.com/visgl/deck.gl-data/master/formats/ply/gaussian-splat';
const TRAIN_GITHUB_SOURCE_URLS = [
  `${GITHUB_GAUSSIAN_SPLAT_BASE_URL}/train-iteration-7000-part-00.ply`,
  `${GITHUB_GAUSSIAN_SPLAT_BASE_URL}/train-iteration-7000-part-01.ply`
] as const;
const GRAPHDECO_CAMERA_UP = [0, -1, 0] as const;

/** Selectable complete scenes, plus explicit GitHub fallback and lightweight parser fixture. */
export const GAUSSIAN_SPLAT_SOURCE_CATALOG: readonly GaussianSplatSourceCatalogEntry[] = [
  {
    id: 'train',
    label: 'HF Voxel51 Train 7K',
    sourceUrl: `${HUGGING_FACE_GAUSSIAN_SPLAT_BASE_URL}/train/point_cloud/iteration_7000/point_cloud.ply`,
    fallbackSourceUrls: TRAIN_GITHUB_SOURCE_URLS,
    expectedSplatCount: 741_883,
    upAxis: 'y',
    up: GRAPHDECO_CAMERA_UP
  },
  {
    id: 'drjohnson',
    label: 'HF Voxel51 Dr Johnson 7K',
    sourceUrl: `${HUGGING_FACE_GAUSSIAN_SPLAT_BASE_URL}/drjohnson/point_cloud/iteration_7000/point_cloud.ply`,
    expectedSplatCount: 1_913_633,
    upAxis: 'y',
    up: GRAPHDECO_CAMERA_UP
  },
  {
    id: 'playroom',
    label: 'HF Voxel51 Playroom 7K',
    sourceUrl: `${HUGGING_FACE_GAUSSIAN_SPLAT_BASE_URL}/playroom/point_cloud/iteration_7000/point_cloud.ply`,
    expectedSplatCount: 1_495_461,
    upAxis: 'y',
    up: GRAPHDECO_CAMERA_UP
  },
  {
    id: 'truck',
    label: 'HF Voxel51 Truck 7K',
    sourceUrl: `${HUGGING_FACE_GAUSSIAN_SPLAT_BASE_URL}/truck/point_cloud/iteration_7000/point_cloud.ply`,
    expectedSplatCount: 1_692_538,
    upAxis: 'y',
    up: [0, -1, -0.17],
    camera: {
      position: [-5, -1, -1],
      target: [-1.72477, 0.05395, -0.00147]
    }
  },
  {
    id: 'coit',
    label: 'Spark Coit Tower RAD (50.9M)',
    sourceUrl:
      'https://storage.googleapis.com/forge-dev-public/asundqui/rad/260217/coit-40m-sh1-lod.rad',
    expectedSplatCount: 50_937_127,
    upAxis: 'z',
    up: [0, 0, 1]
  },
  {
    id: 'train-github',
    label: 'GitHub Train 7K (2 parts)',
    sourceUrl: TRAIN_GITHUB_SOURCE_URLS[0],
    sourceUrls: TRAIN_GITHUB_SOURCE_URLS,
    expectedSplatCount: 741_883,
    upAxis: 'y',
    up: GRAPHDECO_CAMERA_UP
  },
  {
    id: 'fixture',
    label: 'Local Train parser fixture (1,000)',
    sourceUrl: DEFAULT_GAUSSIAN_PLY_PATH,
    expectedSplatCount: 1_000,
    upAxis: 'y',
    up: GRAPHDECO_CAMERA_UP
  }
];

/** Keeps standalone synthetic by default while enabling real scenes in the published viewer. */
export function getLocalGaussianSplatLoadersConfiguration():
  | LocalGaussianSplatLoadersConfiguration
  | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const parameters = new URLSearchParams(window.location.search);
  const requestedLoaderMode = parameters.get('loaders');
  if (requestedLoaderMode === 'synthetic' || parameters.get('mode') === 'synthetic') {
    return undefined;
  }

  const loadersRoot = window.__lumaGaussianSplatsLocalLoadersRoot?.replace(/\/+$/, '') || '';
  const loaderBundleUrl = window.__lumaGaussianSplatsLoaderBundleUrl;
  const loaderMode: LocalGaussianSplatLoadersConfiguration['loaderMode'] =
    requestedLoaderMode === 'local' ? 'local' : 'bundled';
  if (loaderMode === 'local') {
    if (!loadersRoot) {
      throw new Error('Start the showcase with VITE_LOADERS_GL_ROOT=/path/to/loaders.gl.');
    }
  } else if (!loaderBundleUrl) {
    return undefined;
  }

  const customSourceUrl = parameters.get('source');
  if (customSourceUrl) {
    const sourceFormat = getGaussianSplatSourceFormat(customSourceUrl);
    return {
      loaderMode,
      loadersRoot,
      loaderBundleUrl,
      sourceUrl: customSourceUrl,
      sourceUrls: [customSourceUrl],
      fallbackSourceUrls: [],
      sourceFormat,
      sceneId: 'custom',
      sourceLabel: getGaussianSplatSourceLabel(customSourceUrl),
      ...(sourceFormat === 'RAD'
        ? {maxResidentSplatCount: getGaussianSplatResidentSplatCount(parameters)}
        : {}),
      upAxis: 'z',
      up: [0, 0, 1]
    };
  }

  const sceneId = parameters.get('scene') || 'train';
  const scene = GAUSSIAN_SPLAT_SOURCE_CATALOG.find(candidate => candidate.id === sceneId);
  if (!scene) {
    throw new Error(`Unknown Gaussian splat scene: ${sceneId}.`);
  }
  if (scene.id === 'fixture' && loaderMode !== 'local') {
    throw new Error('The lightweight parser fixture requires ?loaders=local.');
  }

  const sourceUrl =
    scene.id === 'fixture'
      ? makeLocalLoadersFileUrl(loadersRoot, scene.sourceUrl)
      : scene.sourceUrl;
  const sourceUrls = scene.sourceUrls || [sourceUrl];
  const sourceFormat = getGaussianSplatSourceFormat(sourceUrl);
  const maxResidentSplatCount =
    sourceFormat === 'RAD' ? getGaussianSplatResidentSplatCount(parameters) : undefined;

  return {
    loaderMode,
    loadersRoot,
    loaderBundleUrl,
    sourceUrl,
    sourceUrls,
    fallbackSourceUrls: scene.fallbackSourceUrls || [],
    sourceFormat,
    sceneId: scene.id,
    sourceLabel: scene.label,
    expectedSplatCount: scene.expectedSplatCount,
    expectedBatchCount: getExpectedGaussianSplatBatchCount(scene, maxResidentSplatCount),
    ...(maxResidentSplatCount === undefined ? {} : {maxResidentSplatCount}),
    upAxis: scene.upAxis,
    up: scene.up,
    camera: scene.camera
  };
}

/** Progressively loads Arrow batches through an isolated loaders.gl 5 bundle or checkout. */
export async function* loadLocalGaussianSplatArrowSources(
  configuration: LocalGaussianSplatLoadersConfiguration,
  options: LocalGaussianSplatLoadOptions = {}
): AsyncIterable<GPUSplatArrowSource> {
  const loaderModules = await loadLocalGaussianSplatLoaderModules(configuration);
  const state: LocalGaussianSplatLoadState = {
    loadedSplatCount: 0,
    yieldedArrowSourceCount: 0,
    fallbackActive: false
  };

  try {
    yield* loadGaussianSplatSourceUrls(
      configuration,
      configuration.sourceUrls,
      configuration.sourceLabel,
      loaderModules,
      state,
      options
    );
  } catch (error) {
    if (
      options.signal?.aborted ||
      state.yieldedArrowSourceCount > 0 ||
      configuration.fallbackSourceUrls.length === 0
    ) {
      throw error;
    }

    state.fallbackActive = true;
    const fallbackSourceLabel = 'GitHub Train 7K fallback';
    options.onProgress?.({
      phase: 'fallback',
      loadedBytes: 0,
      sourceIndex: 0,
      sourceCount: configuration.fallbackSourceUrls.length,
      sourceLabel: fallbackSourceLabel,
      fallbackActive: true,
      loadedSplatCount: 0,
      expectedSplatCount: configuration.expectedSplatCount,
      expectedBatchCount: configuration.expectedBatchCount
    });
    yield* loadGaussianSplatSourceUrls(
      configuration,
      configuration.fallbackSourceUrls,
      fallbackSourceLabel,
      loaderModules,
      state,
      options
    );
  }

  const sourceUrls = state.fallbackActive
    ? configuration.fallbackSourceUrls
    : configuration.sourceUrls;
  options.onProgress?.({
    phase: 'complete',
    loadedBytes: 0,
    sourceIndex: Math.max(sourceUrls.length - 1, 0),
    sourceCount: sourceUrls.length,
    sourceLabel: state.fallbackActive ? 'GitHub Train 7K fallback' : configuration.sourceLabel,
    fallbackActive: state.fallbackActive,
    loadedSplatCount: state.loadedSplatCount,
    expectedSplatCount: configuration.expectedSplatCount,
    expectedBatchCount: configuration.expectedBatchCount
  });
}

/** Loads an entire source atomically for callers using the original showcase helper. */
export async function loadLocalGaussianSplatArrowSource(
  configuration: LocalGaussianSplatLoadersConfiguration
): Promise<GPUSplatArrowSource> {
  const {coreModule, loader, loaderName} = await loadLocalGaussianSplatLoaderModules(configuration);
  const arrowSource: unknown = await coreModule.load(configuration.sourceUrl, loader, {
    worker: false,
    ply: {shape: 'arrow-table', pointCloud: true},
    splats: {shape: 'arrow-table'}
  });
  if (!isGaussianSplatArrowSource(arrowSource)) {
    throw new Error(`${loaderName} did not return a Gaussian Apache Arrow table.`);
  }
  return arrowSource;
}

async function* loadGaussianSplatSourceUrls(
  configuration: LocalGaussianSplatLoadersConfiguration,
  sourceUrls: readonly string[],
  sourceLabel: string,
  loaderModules: LocalGaussianSplatLoaderModules,
  state: LocalGaussianSplatLoadState,
  options: LocalGaussianSplatLoadOptions
): AsyncIterable<GPUSplatArrowSource> {
  for (let sourceIndex = 0; sourceIndex < sourceUrls.length; sourceIndex++) {
    const sourceUrl = sourceUrls[sourceIndex]!;
    let loadedBytes = 0;
    let totalBytes: number | undefined;
    let previousProgressTime = 0;

    const reportProgress = (
      phase: LocalGaussianSplatLoadProgress['phase'],
      forceUpdate = false
    ): void => {
      const currentTime = Date.now();
      if (
        !forceUpdate &&
        currentTime - previousProgressTime < DOWNLOAD_PROGRESS_INTERVAL_MILLISECONDS
      ) {
        return;
      }
      previousProgressTime = currentTime;
      options.onProgress?.({
        phase,
        loadedBytes,
        totalBytes,
        sourceIndex,
        sourceCount: sourceUrls.length,
        sourceLabel,
        fallbackActive: state.fallbackActive,
        loadedSplatCount: state.loadedSplatCount,
        expectedSplatCount: configuration.expectedSplatCount,
        expectedBatchCount: configuration.expectedBatchCount
      });
    };

    reportProgress('loading', true);
    const fetchSource = async (url: string, requestOptions?: RequestInit): Promise<Response> => {
      const response = await fetch(url, {...requestOptions, signal: options.signal});
      if (!response.ok) {
        throw new Error(`Unable to load Gaussian splat source (${response.status}).`);
      }

      const contentLength = Number(response.headers.get('content-length'));
      if (configuration.sourceFormat !== 'RAD') {
        totalBytes =
          Number.isFinite(contentLength) && contentLength > 0 ? contentLength : undefined;
      }
      reportProgress('loading', true);

      if (!response.body) {
        return response;
      }

      const reader = response.body.getReader();
      const progressStream = new ReadableStream<Uint8Array>({
        async pull(controller) {
          const {done, value} = await reader.read();
          if (done) {
            controller.close();
            reportProgress('loading', true);
            return;
          }
          loadedBytes += value.byteLength;
          reportProgress('loading');
          controller.enqueue(value);
        },
        async cancel(reason) {
          await reader.cancel(reason);
        }
      });

      return new Response(progressStream, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    };

    const loaderOptions = {
      worker: false,
      fetch: fetchSource,
      core: {batchSize: GAUSSIAN_SPLAT_ARROW_BATCH_SIZE},
      ply: {shape: 'arrow-table', pointCloud: true},
      splats: {shape: 'arrow-table'}
    };

    if (configuration.sourceFormat === 'RAD') {
      const source: unknown = await loaderModules.coreModule.load(
        sourceUrl,
        loaderModules.loader,
        loaderOptions
      );
      if (!isGaussianSplatRADSource(source)) {
        throw new Error('RADSourceLoader did not return a paged Gaussian source.');
      }

      const metadata = await source.getMetadata();
      configuration.expectedSplatCount = metadata.count;
      configuration.expectedBatchCount = metadata.chunks.length;
      const chunkByteLength = metadata.chunks.reduce(
        (totalByteLength, chunk) => totalByteLength + (chunk.bytes ?? 0),
        0
      );
      totalBytes = metadata.allChunkBytes || chunkByteLength || undefined;
      reportProgress('loading', true);

      for (let chunkIndex = 0; chunkIndex < metadata.chunks.length; chunkIndex++) {
        options.signal?.throwIfAborted();
        const nextChunkSplatCount = metadata.chunks[chunkIndex]?.count;
        if (
          configuration.maxResidentSplatCount !== undefined &&
          nextChunkSplatCount !== undefined &&
          nextChunkSplatCount > configuration.maxResidentSplatCount &&
          state.loadedSplatCount === 0
        ) {
          throw new RangeError('The first RAD page exceeds residentSplats; increase the budget.');
        }
        if (
          configuration.maxResidentSplatCount !== undefined &&
          state.loadedSplatCount > 0 &&
          (state.loadedSplatCount >= configuration.maxResidentSplatCount ||
            (nextChunkSplatCount !== undefined &&
              state.loadedSplatCount + nextChunkSplatCount > configuration.maxResidentSplatCount))
        ) {
          break;
        }
        const arrowSource = await source.getChunkTable(chunkIndex, {
          ...(options.signal ? {signal: options.signal} : {}),
          radChunk: {includeLoDTree: true, includeSphericalHarmonics: true}
        });
        if (!isGaussianSplatArrowSource(arrowSource)) {
          throw new Error('RADSourceLoader did not return a Gaussian Arrow page.');
        }
        if (
          configuration.maxResidentSplatCount !== undefined &&
          state.loadedSplatCount + arrowSource.data.numRows > configuration.maxResidentSplatCount
        ) {
          if (state.loadedSplatCount === 0) {
            throw new RangeError('The first RAD page exceeds residentSplats; increase the budget.');
          }
          break;
        }
        const sourceLoaderData =
          'loaderData' in arrowSource &&
          typeof arrowSource.loaderData === 'object' &&
          arrowSource.loaderData !== null
            ? arrowSource.loaderData
            : {};
        state.loadedSplatCount += arrowSource.data.numRows;
        state.yieldedArrowSourceCount++;
        reportProgress('loading', true);
        const pagedArrowSource = {
          data: arrowSource.data,
          ...(arrowSource.shape ? {shape: arrowSource.shape} : {}),
          loaderData: {
            ...sourceLoaderData,
            ...(metadata.chunks[chunkIndex]?.base !== undefined
              ? {base: metadata.chunks[chunkIndex].base}
              : {}),
            chunkIndex
          }
        };
        yield pagedArrowSource;
      }
    } else if (configuration.sourceFormat === 'PLY') {
      const arrowSources: AsyncIterable<unknown> = await loaderModules.coreModule.loadInBatches(
        sourceUrl,
        loaderModules.loader,
        loaderOptions
      );
      for await (const arrowSource of arrowSources) {
        if (!isGaussianSplatArrowSource(arrowSource)) {
          throw new Error(`${loaderModules.loaderName} did not return a Gaussian Arrow batch.`);
        }
        state.loadedSplatCount += arrowSource.data.numRows;
        state.yieldedArrowSourceCount++;
        reportProgress('loading', true);
        yield arrowSource;
      }
    } else {
      const arrowSource: unknown = await loaderModules.coreModule.load(
        sourceUrl,
        loaderModules.loader,
        loaderOptions
      );
      if (!isGaussianSplatArrowSource(arrowSource)) {
        throw new Error(
          `${loaderModules.loaderName} did not return a Gaussian Apache Arrow table.`
        );
      }
      state.loadedSplatCount += arrowSource.data.numRows;
      state.yieldedArrowSourceCount++;
      reportProgress('loading', true);
      yield arrowSource;
    }

    reportProgress('loaded', true);
  }
}

async function loadLocalGaussianSplatLoaderModules(
  configuration: LocalGaussianSplatLoadersConfiguration
): Promise<LocalGaussianSplatLoaderModules> {
  const loaderName =
    configuration.sourceFormat === 'RAD'
      ? 'RADSourceLoader'
      : `${configuration.sourceFormat}Loader`;
  if (configuration.loaderMode === 'bundled') {
    if (!configuration.loaderBundleUrl) {
      throw new Error('The Gaussian splat loader bundle is unavailable.');
    }
    const loaderBundleUrl = new URL(configuration.loaderBundleUrl, window.location.href);
    if (loaderBundleUrl.origin !== window.location.origin) {
      throw new Error('The Gaussian splat loader bundle must use the current website origin.');
    }
    const loaderBundleModule: Record<string, any> = await import(
      /* webpackIgnore: true */ /* @vite-ignore */ loaderBundleUrl.href
    );
    const loader: unknown = loaderBundleModule[loaderName];
    if (!loader) {
      throw new Error(`The Gaussian splat loader bundle does not export ${loaderName}.`);
    }
    return {coreModule: loaderBundleModule, loader, loaderName};
  }

  const coreModuleUrl = makeLocalLoadersFileUrl(
    configuration.loadersRoot,
    'modules/core/src/index.ts'
  );
  const formatModuleUrl = makeLocalLoadersFileUrl(
    configuration.loadersRoot,
    `modules/${configuration.sourceFormat === 'PLY' ? 'ply' : 'splats'}/src/index.ts`
  );
  const [coreModule, formatModule] = await Promise.all([
    import(/* webpackIgnore: true */ /* @vite-ignore */ coreModuleUrl),
    import(/* webpackIgnore: true */ /* @vite-ignore */ formatModuleUrl)
  ]);
  const loader: unknown = formatModule[loaderName];
  if (!loader) {
    throw new Error(`The local loaders.gl checkout does not export ${loaderName}.`);
  }
  return {coreModule, loader, loaderName};
}

function getExpectedGaussianSplatBatchCount(
  scene: GaussianSplatSourceCatalogEntry,
  maxResidentSplatCount?: number
): number {
  if (scene.id === 'train-github') {
    return (
      Math.ceil(370_941 / GAUSSIAN_SPLAT_ARROW_BATCH_SIZE) +
      Math.ceil(370_942 / GAUSSIAN_SPLAT_ARROW_BATCH_SIZE)
    );
  }
  return Math.ceil(
    Math.min(scene.expectedSplatCount, maxResidentSplatCount ?? Number.POSITIVE_INFINITY) /
      GAUSSIAN_SPLAT_ARROW_BATCH_SIZE
  );
}

function getGaussianSplatResidentSplatCount(parameters: URLSearchParams): number {
  const requestedCount = parameters.get('residentSplats');
  if (requestedCount === null) {
    return DEFAULT_RAD_RESIDENT_SPLAT_COUNT;
  }
  const residentSplatCount = Number(requestedCount);
  if (!Number.isSafeInteger(residentSplatCount) || residentSplatCount <= 0) {
    throw new Error('Gaussian splat residentSplats must be a positive safe integer.');
  }
  return residentSplatCount;
}

function getGaussianSplatSourceFormat(
  sourceUrl: string
): LocalGaussianSplatLoadersConfiguration['sourceFormat'] {
  const sourcePath = new URL(sourceUrl, window.location.href).pathname.toLowerCase();
  if (sourcePath.endsWith('.ply')) {
    return 'PLY';
  }
  if (sourcePath.endsWith('.ksplat')) {
    return 'KSPLAT';
  }
  if (sourcePath.endsWith('.splat')) {
    return 'SPLAT';
  }
  if (sourcePath.endsWith('.spz')) {
    return 'SPZ';
  }
  if (sourcePath.endsWith('.rad')) {
    return 'RAD';
  }
  throw new Error('Choose a .ply, .splat, .ksplat, .spz, or .rad Gaussian splat source.');
}

function getGaussianSplatSourceLabel(sourceUrl: string): string {
  const sourcePath = new URL(sourceUrl, window.location.href).pathname;
  return decodeURIComponent(sourcePath.split('/').pop() || 'Custom Gaussian splat source');
}

function makeLocalLoadersFileUrl(loadersRoot: string, relativePath: string): string {
  return `/@fs${loadersRoot}/${relativePath}`;
}

function isGaussianSplatArrowSource(
  value: unknown
): value is {readonly data: GPUSplatArrowRecordBatchLike; readonly shape?: string} {
  if (typeof value !== 'object' || value === null || !('data' in value)) {
    return false;
  }
  const arrowTable = value.data;
  return (
    typeof arrowTable === 'object' &&
    arrowTable !== null &&
    'numRows' in arrowTable &&
    typeof arrowTable.numRows === 'number' &&
    'getChild' in arrowTable &&
    typeof arrowTable.getChild === 'function' &&
    'schema' in arrowTable
  );
}

function isGaussianSplatRADSource(value: unknown): value is LocalGaussianSplatRADSource {
  return (
    typeof value === 'object' &&
    value !== null &&
    'getMetadata' in value &&
    typeof value.getMetadata === 'function' &&
    'getChunkTable' in value &&
    typeof value.getChunkTable === 'function'
  );
}
