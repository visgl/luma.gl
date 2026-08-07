// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {afterEach, describe, expect, test, vi} from 'vitest';
import type {AnimationProps} from '@luma.gl/engine';
import {
  GPUPagedSplatRenderer,
  GPUSplatGraphRenderer,
  SplatRenderer,
  makeGPUSplatData,
  type GPUSplatData,
  type SplatHierarchyView
} from '@luma.gl/splats';
import {NullDevice} from '@luma.gl/test-utils';
import {
  default as GaussianSplatsAnimationLoopTemplate,
  getGaussianSplatExecutionMode,
  makeGaussianSplatInfoHtml
} from '../../examples/showcase/gaussian-splats/app';
import {
  GAUSSIAN_SPLAT_SOURCE_CATALOG,
  getLocalGaussianSplatLoadersConfiguration,
  loadLocalGaussianSplatArrowSources,
  openLocalGaussianSplatRADPageSource,
  type LocalGaussianSplatLoadProgress,
  type LocalGaussianSplatLoadersConfiguration
} from '../../examples/showcase/gaussian-splats/local-loaders';
import {GaussianSplatRADSceneController} from '../../examples/showcase/gaussian-splats/rad-scene';
import {getExampleThumbnailPath} from '../../website/src/example-thumbnails';

const WEBSITE_VIEWER_ROUTE = '/examples/showcase/gaussian-splat-viewer';
const SYNTHETIC_SHOWCASE_ROUTE = '/examples/showcase/gaussian-splats';
const DEPLOYED_LOADER_BUNDLE_URL = '/luma.gl/standalone-examples/gaussian-splats/loaders-gl.mjs';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('published Gaussian splat viewer', () => {
  test('defaults WebGPU to graph execution while preserving explicit CPU and WebGL fallbacks', () => {
    expect(getGaussianSplatExecutionMode('webgpu')).toBe('graph');
    expect(getGaussianSplatExecutionMode('webgpu', '?scene=truck')).toBe('graph');
    expect(getGaussianSplatExecutionMode('webgpu', '?renderer=graph')).toBe('graph');
    expect(getGaussianSplatExecutionMode('webgpu', '?renderer=cpu')).toBe('cpu');
    expect(getGaussianSplatExecutionMode('webgl')).toBe('cpu');
    expect(getGaussianSplatExecutionMode('webgl', '?renderer=graph')).toBe('cpu');
  });

  test('starts captured WebGPU scenes on the graph before the first streamed batch', () => {
    installViewerWindow();
    const device = makeViewerWebGPUDevice();
    const animation = new GaussianSplatsAnimationLoopTemplate({
      device,
      width: 640,
      height: 480
    } as AnimationProps);

    expect(animation.renderer).toBeInstanceOf(GPUSplatGraphRenderer);
    expect(animation.renderer).not.toBeInstanceOf(SplatRenderer);
    expect(animation.renderer.batches).toHaveLength(0);
    if (animation.renderer instanceof GPUSplatGraphRenderer) {
      expect(animation.renderer.compiledGraph).toBeUndefined();
    }

    animation.renderer.destroy();
    device.destroy();
  });

  test('retains the explicit CPU comparison for captured WebGPU scenes', () => {
    installViewerWindow('?renderer=cpu');
    const device = makeViewerWebGPUDevice();
    const animation = new GaussianSplatsAnimationLoopTemplate({
      device,
      width: 640,
      height: 480
    } as AnimationProps);

    expect(animation.renderer).toBeInstanceOf(SplatRenderer);
    expect(animation.renderer).not.toBeInstanceOf(GPUSplatGraphRenderer);

    animation.renderer.destroy();
    device.destroy();
  });

  test('selects segmented WebGPU RAD rendering while preserving CPU and WebGL fallback', () => {
    installViewerWindow('?scene=coit');
    const webgpuDevice = makeViewerWebGPUDevice();
    const adaptiveAnimation = new GaussianSplatsAnimationLoopTemplate({
      device: webgpuDevice,
      width: 640,
      height: 480
    } as AnimationProps);

    expect(adaptiveAnimation.renderer).toBeInstanceOf(GPUPagedSplatRenderer);
    expect(adaptiveAnimation.renderer).not.toBeInstanceOf(GPUSplatGraphRenderer);
    adaptiveAnimation.renderer.destroy();
    webgpuDevice.destroy();

    installViewerWindow('?scene=coit&renderer=cpu');
    const cpuComparisonDevice = makeViewerWebGPUDevice();
    const cpuAnimation = new GaussianSplatsAnimationLoopTemplate({
      device: cpuComparisonDevice,
      width: 640,
      height: 480
    } as AnimationProps);
    expect(cpuAnimation.renderer).toBeInstanceOf(SplatRenderer);
    cpuAnimation.renderer.destroy();
    cpuComparisonDevice.destroy();

    installViewerWindow('?scene=coit');
    const webglDevice = new NullDevice({});
    const webglAnimation = new GaussianSplatsAnimationLoopTemplate({
      device: webglDevice,
      width: 640,
      height: 480
    } as AnimationProps);
    expect(webglAnimation.renderer).toBeInstanceOf(SplatRenderer);
    webglAnimation.renderer.destroy();
    webglDevice.destroy();
  });

  test('exposes the execution selector and graph diagnostics in the shared viewer panel', () => {
    const viewerPanel = makeGaussianSplatInfoHtml();
    const viewerSource = readFileSync(
      path.join(process.cwd(), 'examples/showcase/gaussian-splats/app.ts'),
      'utf8'
    );
    const viewerDocumentation = readFileSync(
      path.join(process.cwd(), 'website/content/examples/showcase/gaussian-splat-viewer.mdx'),
      'utf8'
    );

    expect(viewerPanel).toContain('data-gaussian-splats-pipeline');
    expect(viewerPanel).toContain('data-gaussian-splats-execution');
    expect(viewerPanel).toContain('data-gaussian-splats-graph-inspector');
    expect(viewerSource).toContain('activeRenderer.encode(device.commandEncoder)');
    expect(viewerSource).toContain('this.localLoadersConfiguration?.maxResidentSplatCount');
    expect(viewerSource).toContain('this.localLoadersConfiguration?.expectedSplatCount');
    expect(viewerSource).not.toContain('this.activateGraphRenderer()');
    expect(viewerSource).not.toContain('CPU preview → GPU graph');
    expect(viewerDocumentation).toContain('GPU command');
    expect(viewerDocumentation).toContain('first');
    expect(viewerDocumentation).toContain('?renderer=cpu');
    expect(viewerDocumentation).toContain('WebGL2');
  });

  test('links the captured-scene viewer while preserving the synthetic showcase', () => {
    const tableOfContents = JSON.parse(
      readFileSync(
        path.join(process.cwd(), 'website/content/examples/table-of-contents.json'),
        'utf8'
      )
    ) as Array<{label?: string; items?: string[]}>;
    const showcaseEntries = tableOfContents.find(category => category.label === 'Showcase')?.items;
    const onboardingSource = readFileSync(
      path.join(process.cwd(), 'docs/getting-started.mdx'),
      'utf8'
    );
    const viewerDocumentation = readFileSync(
      path.join(process.cwd(), 'website/content/examples/showcase/gaussian-splat-viewer.mdx'),
      'utf8'
    );
    const syntheticDocumentation = readFileSync(
      path.join(process.cwd(), 'website/content/examples/showcase/gaussian-splats.mdx'),
      'utf8'
    );

    expect(showcaseEntries?.slice(0, 2)).toEqual([
      'showcase/gaussian-splat-viewer',
      'showcase/gaussian-splats'
    ]);
    expect(onboardingSource).toContain(`to="${WEBSITE_VIEWER_ROUTE}"`);
    expect(viewerDocumentation).toContain('<GaussianSplatViewerExample />');
    expect(viewerDocumentation).toContain('741,883-splat Train');
    expect(viewerDocumentation).toContain(SYNTHETIC_SHOWCASE_ROUTE);
    expect(syntheticDocumentation).toContain(WEBSITE_VIEWER_ROUTE);
    expect(getExampleThumbnailPath('showcase/gaussian-splat-viewer')).toBe(
      'showcase/gaussian-splats.jpg'
    );
  });

  test('resolves the isolated loader bundle through the deployed website base URL', () => {
    const websiteExamples = readFileSync(
      path.join(process.cwd(), 'website/src/examples.tsx'),
      'utf8'
    );
    const viewerStart = websiteExamples.indexOf('export const GaussianSplatViewerExample');
    const viewerSource = websiteExamples.slice(
      viewerStart,
      websiteExamples.indexOf('\n};', viewerStart)
    );
    const syntheticStart = websiteExamples.indexOf('export const GaussianSplatsExample');
    const syntheticSource = websiteExamples.slice(
      syntheticStart,
      websiteExamples.indexOf('\n};', syntheticStart)
    );

    expect(viewerStart).toBeGreaterThan(0);
    expect(viewerSource).toContain(
      "useBaseUrl('/standalone-examples/gaussian-splats/loaders-gl.mjs')"
    );
    expect(viewerSource).toContain('window.__lumaGaussianSplatsLoaderBundleUrl = loaderBundleUrl');
    expect(viewerSource).toContain('id="gaussian-splat-viewer"');
    expect(viewerSource).toContain('sourcePath="examples/showcase/gaussian-splats/app.ts"');
    expect(syntheticSource).toContain('delete window.__lumaGaussianSplatsLoaderBundleUrl');
    expect(syntheticSource).toContain('id="gaussian-splats"');
  });

  test('defaults to the complete Hugging Face Train capture with GitHub fallback', () => {
    installViewerWindow();

    const configuration = getLocalGaussianSplatLoadersConfiguration();

    expect(configuration).toMatchObject({
      loaderMode: 'bundled',
      loaderBundleUrl: DEPLOYED_LOADER_BUNDLE_URL,
      sceneId: 'train',
      sourceFormat: 'PLY',
      expectedSplatCount: 741_883,
      expectedBatchCount: 12,
      up: [0, -1, 0]
    });
    expect(configuration?.sourceUrl).toBe(
      'https://huggingface.co/datasets/Voxel51/gaussian_splatting/resolve/main/FO_dataset/train/point_cloud/iteration_7000/point_cloud.ply'
    );
    expect(configuration?.sourceUrls).toEqual([configuration?.sourceUrl]);
    expect(configuration?.fallbackSourceUrls).toEqual([
      'https://raw.githubusercontent.com/visgl/deck.gl-data/master/formats/ply/gaussian-splat/train-iteration-7000-part-00.ply',
      'https://raw.githubusercontent.com/visgl/deck.gl-data/master/formats/ply/gaussian-splat/train-iteration-7000-part-01.ply'
    ]);
  });

  test('retains catalog scenes, direct GitHub sources, and custom source URLs', () => {
    installViewerWindow('?scene=truck');
    expect(getLocalGaussianSplatLoadersConfiguration()).toMatchObject({
      loaderMode: 'bundled',
      sceneId: 'truck',
      expectedSplatCount: 1_692_538,
      up: [0, -1, -0.17]
    });

    installViewerWindow('?scene=train-github');
    expect(getLocalGaussianSplatLoadersConfiguration()?.sourceUrls).toHaveLength(2);

    installViewerWindow('?scene=coit');
    expect(getLocalGaussianSplatLoadersConfiguration()).toMatchObject({
      sceneId: 'coit',
      sourceFormat: 'RAD',
      expectedSplatCount: 50_937_127,
      expectedBatchCount: 16,
      maxResidentSplatCount: 1_000_000
    });

    installViewerWindow('?scene=coit&residentSplats=250000');
    expect(getLocalGaussianSplatLoadersConfiguration()).toMatchObject({
      expectedSplatCount: 50_937_127,
      expectedBatchCount: 4,
      maxResidentSplatCount: 250_000
    });

    installViewerWindow('?source=https%3A%2F%2Fexample.test%2Fcaptured.spz');
    expect(getLocalGaussianSplatLoadersConfiguration()).toMatchObject({
      loaderMode: 'bundled',
      sceneId: 'custom',
      sourceUrl: 'https://example.test/captured.spz',
      sourceFormat: 'SPZ'
    });

    installViewerWindow('?source=https%3A%2F%2Fexample.test%2Fcaptured.rad');
    expect(getLocalGaussianSplatLoadersConfiguration()).toMatchObject({
      loaderMode: 'bundled',
      sceneId: 'custom',
      sourceUrl: 'https://example.test/captured.rad',
      sourceFormat: 'RAD',
      maxResidentSplatCount: 1_000_000
    });

    expect(GAUSSIAN_SPLAT_SOURCE_CATALOG.map(scene => scene.id)).toEqual(
      expect.arrayContaining(['train', 'drjohnson', 'playroom', 'truck', 'coit', 'train-github'])
    );
  });

  test('progressively falls back to mocked GitHub sources when Hugging Face is unavailable', async () => {
    installViewerWindow();
    const configuration = getLocalGaussianSplatLoadersConfiguration();
    expect(configuration).toBeDefined();
    configuration!.loaderBundleUrl = pathToFileURL(
      path.join(process.cwd(), 'website/static/standalone-examples/gaussian-splats/loaders-gl.mjs')
    ).href;
    vi.stubGlobal('window', {
      location: {href: 'file:///gaussian-splat-viewer.html', origin: 'null'}
    });

    const requestedSources: string[] = [];
    const progressUpdates: LocalGaussianSplatLoadProgress[] = [];
    const gaussianSource = makeGaussianSplatPLYFixture();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request) => {
        const sourceUrl = String(input);
        requestedSources.push(sourceUrl);
        if (sourceUrl.includes('huggingface.co')) {
          return new Response('The source CDN is unavailable.', {status: 503});
        }
        return new Response(gaussianSource, {
          headers: {'content-length': String(new TextEncoder().encode(gaussianSource).byteLength)}
        });
      })
    );

    const receivedBatchLengths: number[] = [];
    for await (const source of loadLocalGaussianSplatArrowSources(configuration!, {
      onProgress: progress => progressUpdates.push(progress)
    })) {
      receivedBatchLengths.push(source.data.numRows);
    }

    expect(requestedSources).toEqual([
      configuration!.sourceUrl,
      ...configuration!.fallbackSourceUrls
    ]);
    expect(receivedBatchLengths).toEqual([1, 1]);
    expect(progressUpdates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({phase: 'fallback', fallbackActive: true}),
        expect.objectContaining({
          phase: 'complete',
          fallbackActive: true,
          loadedSplatCount: 2
        })
      ])
    );
  });

  test('range-fetches RAD pages lazily and preserves source-global chunk identities', async () => {
    installViewerWindow('?source=https%3A%2F%2Fexample.test%2Fscene.rad');
    const configuration = getLocalGaussianSplatLoadersConfiguration();
    expect(configuration).toBeDefined();
    configuration!.loaderBundleUrl = pathToFileURL(
      path.join(process.cwd(), 'website/static/standalone-examples/gaussian-splats/loaders-gl.mjs')
    ).href;
    vi.stubGlobal('window', {
      location: {href: 'file:///gaussian-splat-viewer.html', origin: 'null'}
    });

    const source = makeGaussianRADFixture();
    const requestedRanges: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: string | URL | Request, options?: RequestInit) => {
        const range = new Headers(options?.headers).get('Range');
        if (range) {
          requestedRanges.push(range);
        }
        const match = range?.match(/^bytes=(\d+)-(\d+)$/);
        const start = Number(match?.[1] ?? 0);
        const end = Math.min(Number(match?.[2] ?? source.byteLength - 1) + 1, source.byteLength);
        return new Response(source.slice(start, end), {
          status: range ? 206 : 200,
          headers: {'content-length': String(end - start)}
        });
      })
    );

    const progressUpdates: LocalGaussianSplatLoadProgress[] = [];
    const receivedPages: Array<{rows: number; base: unknown; chunkIndex: unknown}> = [];
    for await (const page of loadLocalGaussianSplatArrowSources(configuration!, {
      onProgress: progress => progressUpdates.push(progress)
    })) {
      if (!('data' in page)) {
        throw new Error('RAD source did not preserve its loader-owned wrapper');
      }
      receivedPages.push({
        rows: page.data.numRows,
        base: page.loaderData?.base,
        chunkIndex: page.loaderData?.chunkIndex
      });
      if (receivedPages.length === 1) {
        expect(requestedRanges).toHaveLength(2);
      }
    }

    expect(receivedPages).toEqual([
      {rows: 1, base: 0, chunkIndex: 0},
      {rows: 1, base: 10, chunkIndex: 1}
    ]);
    expect(requestedRanges).toHaveLength(3);
    expect(configuration).toMatchObject({expectedSplatCount: 2, expectedBatchCount: 2});
    expect(progressUpdates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({expectedSplatCount: 2, expectedBatchCount: 2}),
        expect.objectContaining({phase: 'complete', loadedSplatCount: 2})
      ])
    );
  });

  test('opens RAD metadata without fetching pages and follows nonsequential camera demand', async () => {
    const source = makeGaussianRADFixture();
    const {configuration, requestedRanges} = installGaussianRADPageSourceFixture(
      source,
      '&residentSplats=1'
    );
    const progressUpdates: LocalGaussianSplatLoadProgress[] = [];

    const pageSource = await openLocalGaussianSplatRADPageSource(configuration, {
      onProgress: progress => progressUpdates.push(progress)
    });

    expect(requestedRanges).toHaveLength(1);
    expect(pageSource.getMetadata()).toMatchObject({
      count: 2,
      chunkSize: 1,
      maxSh: 0,
      chunks: [
        {chunkIndex: 0, base: 0, count: 1},
        {chunkIndex: 1, base: 10, count: 1}
      ]
    });
    expect(pageSource.getChunkForRow(0)).toBe(0);
    expect(pageSource.getChunkForRow(10)).toBe(1);
    expect(pageSource.getChunkForRow(1)).toBeUndefined();

    pageSource.setPageDemand([{chunkIndex: 1, priority: 100}]);
    expect(requestedRanges).toHaveLength(1);
    const fartherPage = await pageSource.loadPage(1);
    expect(fartherPage).toMatchObject({loaderData: {base: 10, chunkIndex: 1}});

    pageSource.setPageDemand([{chunkIndex: 0, priority: 200}]);
    const nearerPage = await pageSource.loadPage(0);
    expect(nearerPage).toMatchObject({loaderData: {base: 0, chunkIndex: 0}});
    expect(requestedRanges).toHaveLength(3);
    expect(configuration).toMatchObject({expectedSplatCount: 2, expectedBatchCount: 2});
    expect(progressUpdates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({phase: 'loaded', loadedSplatCount: 1}),
        expect.objectContaining({phase: 'loaded', loadedSplatCount: 2})
      ])
    );

    const reloadedPage = await pageSource.loadPage(1);
    expect(reloadedPage).toMatchObject({loaderData: {base: 10, chunkIndex: 1}});
    expect(requestedRanges).toHaveLength(4);

    pageSource.destroy();
  });

  test('bounds concurrent RAD decodes, deduplicates demand, and prioritizes queued pages', async () => {
    const source = makeGaussianRADFixture(1, {chunkCount: 3});
    const {configuration, requestedRanges} = installGaussianRADPageSourceFixture(source);
    const startedChunks: number[] = [];
    const releaseDecoders = new Map<number, () => void>();
    let activeDecoderCount = 0;
    let maximumActiveDecoderCount = 0;
    const pageSource = await openLocalGaussianSplatRADPageSource(configuration, {
      maxConcurrentLoads: 1,
      decodePage: async context => {
        startedChunks.push(context.chunkIndex);
        activeDecoderCount++;
        maximumActiveDecoderCount = Math.max(maximumActiveDecoderCount, activeDecoderCount);
        await new Promise<void>(resolve => releaseDecoders.set(context.chunkIndex, resolve));
        try {
          return await context.decodeDefault();
        } finally {
          activeDecoderCount--;
        }
      }
    });

    pageSource.setPageDemand([
      {chunkIndex: 0, priority: 1},
      {chunkIndex: 1, priority: 2},
      {chunkIndex: 2, priority: 100}
    ]);
    const firstPage = pageSource.loadPage(0);
    const lowPriorityPage = pageSource.loadPage(1);
    const highPriorityPage = pageSource.loadPage(2);

    expect(pageSource.loadPage(2)).toBe(highPriorityPage);
    expect(startedChunks).toEqual([0]);
    expect(requestedRanges).toHaveLength(1);

    releaseDecoders.get(0)?.();
    await firstPage;
    await vi.waitFor(() => expect(startedChunks).toEqual([0, 2]));
    releaseDecoders.get(2)?.();
    await highPriorityPage;
    await vi.waitFor(() => expect(startedChunks).toEqual([0, 2, 1]));
    releaseDecoders.get(1)?.();
    await lowPriorityPage;

    expect(maximumActiveDecoderCount).toBe(1);
    expect(requestedRanges).toHaveLength(4);
    pageSource.destroy();
  });

  test('preserves RAD child arrays and resolves child starts as source-global rows', async () => {
    const source = makeGaussianRADFixture(1, {includeLoDTree: true});
    const {configuration} = installGaussianRADPageSourceFixture(source);
    const pageSource = await openLocalGaussianSplatRADPageSource(configuration);

    expect(pageSource.metadata.lodTree).toBe(true);
    const parentPage = await pageSource.loadPage(0);
    if (!('loaderData' in parentPage)) {
      throw new Error('RAD hierarchy metadata was detached from its source-owned page.');
    }
    expect(parentPage.loaderData?.childCounts).toBeInstanceOf(Uint16Array);
    expect(parentPage.loaderData?.childStarts).toBeInstanceOf(Uint32Array);
    expect(Array.from(parentPage.loaderData?.childCounts as Uint16Array)).toEqual([1]);
    expect(Array.from(parentPage.loaderData?.childStarts as Uint32Array)).toEqual([10]);
    expect(pageSource.getChunkForRow(10)).toBe(1);

    const childPage = await pageSource.loadPage(1);
    expect(childPage).toMatchObject({loaderData: {base: 10, chunkIndex: 1}});
    pageSource.destroy();
  });

  test('infers original page intervals from nominal chunk size when RAD ranges omit them', async () => {
    const source = makeGaussianRADFixture(1, {
      chunkBaseStride: 1,
      omitChunkRowRanges: true
    });
    const {configuration} = installGaussianRADPageSourceFixture(source);
    const pageSource = await openLocalGaussianSplatRADPageSource(configuration);

    expect(pageSource.metadata.chunks).toMatchObject([
      {chunkIndex: 0, base: 0, count: 1},
      {chunkIndex: 1, base: 1, count: 1}
    ]);
    expect(pageSource.getChunkForRow(1)).toBe(1);
    expect(await pageSource.loadPage(1)).toMatchObject({loaderData: {base: 1, chunkIndex: 1}});

    pageSource.destroy();
  });

  test('cancels stale camera demand and queued requests without aborting current demand', async () => {
    const source = makeGaussianRADFixture();
    const {configuration, requestedRanges, pendingPageResponses, requestedPageSignals} =
      installGaussianRADPageSourceFixture(source, '', {delayPages: true});
    const pageSource = await openLocalGaussianSplatRADPageSource(configuration, {
      maxConcurrentLoads: 1
    });

    pageSource.setPageDemand([
      {chunkIndex: 0, priority: 1},
      {chunkIndex: 1, priority: 2}
    ]);
    const stalePage = pageSource.loadPage(0);
    const staleResult = stalePage.catch(error => error);
    const currentPage = pageSource.loadPage(1);
    await vi.waitFor(() => expect(pendingPageResponses).toHaveLength(1));

    pageSource.setPageDemand([{chunkIndex: 1, priority: 100}]);
    const staleError = await staleResult;
    expect(staleError).toMatchObject({name: 'AbortError'});
    expect(requestedPageSignals[0]?.aborted).toBe(true);
    await vi.waitFor(() => expect(pendingPageResponses).toHaveLength(2));

    pendingPageResponses[1]?.();
    await expect(currentPage).resolves.toMatchObject({loaderData: {base: 10, chunkIndex: 1}});
    expect(requestedPageSignals[1]?.aborted).toBe(false);

    pageSource.setPageDemand([
      {chunkIndex: 0, priority: 1},
      {chunkIndex: 1, priority: 2}
    ]);
    const activePage = pageSource.loadPage(0).catch(error => error);
    const queuedPage = pageSource.loadPage(1).catch(error => error);
    await vi.waitFor(() => expect(pendingPageResponses).toHaveLength(3));
    pageSource.destroy();

    expect(await activePage).toMatchObject({name: 'AbortError'});
    expect(await queuedPage).toMatchObject({name: 'AbortError'});
    expect(requestedPageSignals[2]?.aborted).toBe(true);
    expect(requestedRanges).toHaveLength(4);
    expect(pageSource.cancelPage(1)).toBe(false);
    await expect(pageSource.loadPage(0)).rejects.toMatchObject({name: 'AbortError'});
  });

  test('combines request-local and scene cancellation while allowing immediate retry', async () => {
    const source = makeGaussianRADFixture();
    const {configuration, pendingPageResponses, requestedPageSignals} =
      installGaussianRADPageSourceFixture(source, '', {delayPages: true});
    const sceneAbortController = new AbortController();
    const pageSource = await openLocalGaussianSplatRADPageSource(configuration, {
      signal: sceneAbortController.signal,
      maxConcurrentLoads: 1
    });

    const requestAbortController = new AbortController();
    const canceledPage = pageSource
      .loadPage(0, {signal: requestAbortController.signal})
      .catch(error => error);
    await vi.waitFor(() => expect(pendingPageResponses).toHaveLength(1));
    requestAbortController.abort();
    expect(await canceledPage).toMatchObject({name: 'AbortError'});
    expect(requestedPageSignals[0]?.aborted).toBe(true);
    expect(sceneAbortController.signal.aborted).toBe(false);

    const retriedPage = pageSource.loadPage(0);
    await vi.waitFor(() => expect(pendingPageResponses).toHaveLength(2));
    pendingPageResponses[1]?.();
    await expect(retriedPage).resolves.toMatchObject({loaderData: {base: 0, chunkIndex: 0}});

    const finalPage = pageSource.loadPage(1).catch(error => error);
    await vi.waitFor(() => expect(pendingPageResponses).toHaveLength(3));
    sceneAbortController.abort();
    expect(await finalPage).toMatchObject({name: 'AbortError'});
    expect(requestedPageSignals[2]?.aborted).toBe(true);

    pageSource.destroy();
    await expect(pageSource.loadPage(0)).rejects.toMatchObject({name: 'AbortError'});
  });

  test('allows failed RAD decoders to retry without retaining rejected page promises', async () => {
    const source = makeGaussianRADFixture();
    const {configuration, requestedRanges} = installGaussianRADPageSourceFixture(source);
    let attemptCount = 0;
    const pageSource = await openLocalGaussianSplatRADPageSource(configuration, {
      decodePage: async context => {
        attemptCount++;
        if (attemptCount === 1) {
          throw new Error('The injected RAD decoder failed.');
        }
        return await context.decodeDefault();
      }
    });

    await expect(pageSource.loadPage(0)).rejects.toThrow('injected RAD decoder failed');
    expect(requestedRanges).toHaveLength(1);
    await expect(pageSource.loadPage(0)).resolves.toMatchObject({
      loaderData: {base: 0, chunkIndex: 0}
    });
    expect(attemptCount).toBe(2);
    expect(requestedRanges).toHaveLength(2);

    pageSource.destroy();
  });

  test('rejects oversized RAD pages before fetching without blocking smaller demanded pages', async () => {
    const source = makeGaussianRADFixture(2);
    const {configuration, requestedRanges} = installGaussianRADPageSourceFixture(
      source,
      '&residentSplats=1'
    );
    const pageSource = await openLocalGaussianSplatRADPageSource(configuration);

    await expect(pageSource.loadPage(0)).rejects.toThrow('exceeds residentSplats');
    expect(requestedRanges).toHaveLength(1);
    await expect(pageSource.loadPage(1)).resolves.toMatchObject({
      loaderData: {base: 10, chunkIndex: 1}
    });
    expect(requestedRanges).toHaveLength(2);

    pageSource.destroy();
  });

  test('refines mixed RAD source rows out of order while preserving fallback, budget, and ownership', async () => {
    const source = makeGaussianRADFixture(3, {
      chunkCount: 3,
      chunkSize: 10,
      includeLoDTree: true,
      hierarchyRows: [
        [
          {childCount: 2, childStart: 1},
          {childCount: 0, childStart: 0},
          {childCount: 1, childStart: 20}
        ],
        [{childCount: 0, childStart: 0}],
        [{childCount: 0, childStart: 0}]
      ]
    });
    const {configuration, requestedRanges, pendingPageResponses} =
      installGaussianRADPageSourceFixture(source, '&residentSplats=4', {delayPages: true});
    const pageSource = await openLocalGaussianSplatRADPageSource(configuration);
    const device = new NullDevice({});
    const loadedPages: GPUSplatData[] = [];
    const selectedFrontiers: number[][][] = [];
    const scene = new GaussianSplatRADSceneController({
      device,
      source: pageSource,
      maxResidentSplatCount: 4,
      maximumScreenSpaceError: 1,
      onPageLoad: page => loadedPages.push(page.data),
      onFrontierChange: frontier =>
        selectedFrontiers.push(
          frontier.map(entry =>
            Array.from(entry.activeRows, rowIndex => entry.data.rowIndexBase + rowIndex)
          )
        )
    });

    const evictablePage = makeGPUSplatData(device, {
      positions: new Float32Array([100, 0, 0]),
      scales: new Float32Array([1, 1, 1]),
      rotations: new Float32Array([1, 0, 0, 0]),
      colors: new Uint8Array([255, 255, 255, 255]),
      opacities: new Float32Array([1]),
      sourceBatchIndex: 9,
      rowIndexBase: 100
    });
    const admittedEvictablePage = scene.hierarchy.residencyManager.add(evictablePage, {
      id: 'unused-source-page',
      priority: Number.NEGATIVE_INFINITY,
      ownsData: true
    });
    expect(admittedEvictablePage).toBeDefined();
    expect(scene.hierarchy.residencyManager.stats.residentSplatCount).toBe(1);

    const sceneStart = scene.start(makeGaussianRADHierarchyView());
    await vi.waitFor(() => expect(pendingPageResponses).toHaveLength(1));
    pendingPageResponses[0]?.();
    await sceneStart;
    await vi.waitFor(() => expect(pendingPageResponses).toHaveLength(2));

    expect(scene.hierarchy.frontier).toHaveLength(1);
    expect(Array.from(scene.hierarchy.frontier[0].activeRows)).toEqual([1, 2]);
    expect(Array.from(scene.hierarchy.frontier[0].activeMask)).toEqual([0, 1, 1]);
    expect(scene.hierarchy.stats.fallbackRowCount).toBe(1);
    expect(pageSource.getChunkForRow(20)).toBe(2);
    expect(requestedRanges).toHaveLength(3);
    expect(evictablePage.destroyed).toBe(true);
    expect(scene.hierarchy.residencyManager.stats.residentSplatCount).toBe(3);

    pendingPageResponses[1]?.();
    await scene.waitForIdle();

    expect(evictablePage.destroyed).toBe(true);
    expect(loadedPages.map(page => page.sourceBatchIndex)).toEqual([0, 2]);
    expect(loadedPages.map(page => page.rowIndexBase)).toEqual([0, 20]);
    expect(scene.hierarchy.frontier.map(entry => entry.data)).toEqual(loadedPages);
    expect(scene.hierarchy.frontier.map(entry => Array.from(entry.activeRows))).toEqual([[1], [0]]);
    expect(selectedFrontiers).toContainEqual([[1, 2]]);
    expect(selectedFrontiers).toContainEqual([[1], [20]]);
    expect(scene.hierarchy.stats.fallbackRowCount).toBe(0);
    expect(scene.hierarchy.residencyManager.stats.residentSplatCount).toBe(4);
    expect(scene.hierarchy.residencyManager.stats.evictedChunkCount).toBe(1);
    expect(requestedRanges).toHaveLength(3);

    scene.destroy();
    expect(loadedPages.every(page => page.destroyed)).toBe(true);
    expect(scene.hierarchy.residencyManager.destroyed).toBe(true);
    device.destroy();
  });

  test('cancels obsolete RAD hierarchy requests and restores demand after camera return', async () => {
    const source = makeGaussianRADFixture(1, {
      chunkSize: 10,
      includeLoDTree: true
    });
    const {configuration, pendingPageResponses, requestedPageSignals} =
      installGaussianRADPageSourceFixture(source, '&residentSplats=2', {delayPages: true});
    const pageSource = await openLocalGaussianSplatRADPageSource(configuration);
    const device = new NullDevice({});
    const loadedPages: GPUSplatData[] = [];
    const scene = new GaussianSplatRADSceneController({
      device,
      source: pageSource,
      maxResidentSplatCount: 2,
      maximumScreenSpaceError: 1,
      onPageLoad: page => loadedPages.push(page.data)
    });
    const visibleView = makeGaussianRADHierarchyView();

    const sceneStart = scene.start(visibleView);
    await vi.waitFor(() => expect(pendingPageResponses).toHaveLength(1));
    pendingPageResponses[0]?.();
    await sceneStart;
    await vi.waitFor(() => expect(pendingPageResponses).toHaveLength(2));
    expect(scene.hierarchy.stats.fallbackRowCount).toBe(1);

    scene.update({
      ...visibleView,
      modelViewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -100, 0, 0, 1]
    });
    await scene.waitForIdle();
    expect(requestedPageSignals[1]?.aborted).toBe(true);
    expect(scene.hierarchy.frontier).toHaveLength(0);

    scene.update(visibleView);
    await vi.waitFor(() => expect(pendingPageResponses).toHaveLength(3));
    pendingPageResponses[2]?.();
    await scene.waitForIdle();

    expect(scene.hierarchy.frontier.map(entry => entry.data.rowIndexBase)).toEqual([10]);
    expect(scene.hierarchy.residencyManager.stats.residentSplatCount).toBe(2);
    expect(loadedPages.map(page => page.sourceBatchIndex)).toEqual([0, 1]);

    scene.destroy();
    expect(loadedPages.every(page => page.destroyed)).toBe(true);
    device.destroy();
  });

  test('restarts canceled RAD page demand when the camera returns before request cleanup', async () => {
    const source = makeGaussianRADFixture(1, {
      chunkSize: 10,
      includeLoDTree: true
    });
    const {configuration, pendingPageResponses, requestedPageSignals} =
      installGaussianRADPageSourceFixture(source, '&residentSplats=2', {delayPages: true});
    const pageSource = await openLocalGaussianSplatRADPageSource(configuration);
    const device = new NullDevice({});
    const scene = new GaussianSplatRADSceneController({
      device,
      source: pageSource,
      maxResidentSplatCount: 2,
      maximumScreenSpaceError: 1
    });
    const visibleView = makeGaussianRADHierarchyView();

    const sceneStart = scene.start(visibleView);
    await vi.waitFor(() => expect(pendingPageResponses).toHaveLength(1));
    pendingPageResponses[0]?.();
    await sceneStart;
    await vi.waitFor(() => expect(pendingPageResponses).toHaveLength(2));

    scene.update({
      ...visibleView,
      modelViewProjectionMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -100, 0, 0, 1]
    });
    scene.update(visibleView);
    expect(requestedPageSignals[1]?.aborted).toBe(true);
    expect(scene.hierarchy.stats.fallbackRowCount).toBe(1);

    await vi.waitFor(() => expect(pendingPageResponses).toHaveLength(3));
    pendingPageResponses[2]?.();
    await scene.waitForIdle();

    expect(scene.hierarchy.frontier.map(entry => entry.data.rowIndexBase)).toEqual([10]);
    expect(scene.hierarchy.stats.fallbackRowCount).toBe(0);
    expect(scene.hierarchy.residencyManager.stats.residentSplatCount).toBe(2);

    scene.destroy();
    device.destroy();
  });

  test('rejects protected RAD child pages before starting their source range request', async () => {
    const source = makeGaussianRADFixture(1, {
      chunkSize: 10,
      includeLoDTree: true
    });
    const {configuration, requestedRanges} = installGaussianRADPageSourceFixture(
      source,
      '&residentSplats=1'
    );
    const pageSource = await openLocalGaussianSplatRADPageSource(configuration);
    const device = new NullDevice({});
    const errors: unknown[] = [];
    const scene = new GaussianSplatRADSceneController({
      device,
      source: pageSource,
      maxResidentSplatCount: 1,
      maximumScreenSpaceError: 1,
      onError: error => errors.push(error)
    });

    await scene.start(makeGaussianRADHierarchyView());
    await scene.waitForIdle();

    expect(requestedRanges).toHaveLength(2);
    expect(scene.hierarchy.frontier.map(entry => entry.data.rowIndexBase)).toEqual([0]);
    expect(scene.hierarchy.stats.fallbackRowCount).toBe(1);
    expect(scene.hierarchy.residencyManager.stats.rejectedChunkCount).toBe(1);
    expect(scene.hierarchy.residencyManager.stats.residentSplatCount).toBe(1);
    expect(errors).toEqual([]);

    scene.destroy();
    device.destroy();
  });

  test('falls back to complete source pages when a RAD scene has no authored LoD hierarchy', async () => {
    const source = makeGaussianRADFixture();
    const {configuration, requestedRanges} = installGaussianRADPageSourceFixture(
      source,
      '&residentSplats=1'
    );
    vi.stubGlobal('window', {
      location: {
        search: '?source=https%3A%2F%2Fexample.test%2Fscene.rad&residentSplats=1',
        href: 'file:///gaussian-splat-viewer.html',
        origin: 'null'
      },
      __lumaGaussianSplatsLoaderBundleUrl: configuration.loaderBundleUrl
    });
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback): number => {
      queueMicrotask(() => callback(0));
      return 1;
    });
    const device = makeViewerWebGPUDevice();
    const animation = new GaussianSplatsAnimationLoopTemplate({
      device,
      width: 640,
      height: 480
    } as AnimationProps);

    expect(animation.renderer).toBeInstanceOf(GPUPagedSplatRenderer);
    await animation['loadLocalSplatData'](configuration);

    expect(requestedRanges).toHaveLength(3);
    expect(animation.batches).toHaveLength(1);
    expect(animation.batches[0].rowIndexBase).toBe(0);
    expect(animation.renderer).toBeInstanceOf(GPUPagedSplatRenderer);
    if (animation.renderer instanceof GPUPagedSplatRenderer) {
      expect(animation.renderer.pages).toHaveLength(1);
      expect(animation.renderer.pages[0].data).toBe(animation.batches[0]);
    }

    animation.onFinalize();
    expect(animation.batches[0].destroyed).toBe(true);
    device.destroy();
  });

  test('stops RAD page requests at the caller-selected resident source-row budget', async () => {
    installViewerWindow('?source=https%3A%2F%2Fexample.test%2Fscene.rad&residentSplats=1');
    const configuration = getLocalGaussianSplatLoadersConfiguration();
    expect(configuration?.maxResidentSplatCount).toBe(1);
    configuration!.loaderBundleUrl = pathToFileURL(
      path.join(process.cwd(), 'website/static/standalone-examples/gaussian-splats/loaders-gl.mjs')
    ).href;
    vi.stubGlobal('window', {
      location: {href: 'file:///gaussian-splat-viewer.html', origin: 'null'}
    });

    const source = makeGaussianRADFixture();
    const requestedRanges: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: string | URL | Request, options?: RequestInit) => {
        const range = new Headers(options?.headers).get('Range');
        if (range) requestedRanges.push(range);
        const match = range?.match(/^bytes=(\d+)-(\d+)$/);
        const start = Number(match?.[1] ?? 0);
        const end = Math.min(Number(match?.[2] ?? source.byteLength - 1) + 1, source.byteLength);
        return new Response(source.slice(start, end), {status: range ? 206 : 200});
      })
    );

    const receivedPages: GPUSplatData[] = [];
    const device = new NullDevice({});
    const arrow = await import('@luma.gl/arrow');
    for await (const page of arrow.makeGPUSplatDataFromArrowStream(
      device,
      loadLocalGaussianSplatArrowSources(configuration!)
    )) {
      receivedPages.push(page);
    }

    expect(receivedPages).toHaveLength(1);
    expect(receivedPages[0].rowIndexBase).toBe(0);
    expect(requestedRanges).toHaveLength(2);
    expect(configuration?.expectedSplatCount).toBe(2);
    receivedPages[0].destroy();
    device.destroy();
  });

  test('rejects invalid RAD resident source-row budgets', () => {
    installViewerWindow('?scene=coit&residentSplats=0');
    expect(() => getLocalGaussianSplatLoadersConfiguration()).toThrow('positive safe integer');
  });

  test('rejects a first RAD page larger than the resident source-row budget before fetching it', async () => {
    installViewerWindow('?source=https%3A%2F%2Fexample.test%2Fscene.rad&residentSplats=1');
    const configuration = getLocalGaussianSplatLoadersConfiguration();
    configuration!.loaderBundleUrl = pathToFileURL(
      path.join(process.cwd(), 'website/static/standalone-examples/gaussian-splats/loaders-gl.mjs')
    ).href;
    vi.stubGlobal('window', {
      location: {href: 'file:///gaussian-splat-viewer.html', origin: 'null'}
    });

    const source = makeGaussianRADFixture(2);
    const requestedRanges: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: string | URL | Request, options?: RequestInit) => {
        const range = new Headers(options?.headers).get('Range');
        if (range) requestedRanges.push(range);
        const match = range?.match(/^bytes=(\d+)-(\d+)$/);
        const start = Number(match?.[1] ?? 0);
        const end = Math.min(Number(match?.[2] ?? source.byteLength - 1) + 1, source.byteLength);
        return new Response(source.slice(start, end), {status: range ? 206 : 200});
      })
    );

    await expect(async () => {
      for await (const _page of loadLocalGaussianSplatArrowSources(configuration!)) {
        throw new Error('An oversized RAD page was unexpectedly yielded.');
      }
    }).rejects.toThrow('exceeds residentSplats');
    expect(requestedRanges).toHaveLength(1);
  });

  test('preserves explicit synthetic rendering and the local checkout override', () => {
    installViewerWindow('?loaders=synthetic');
    expect(getLocalGaussianSplatLoadersConfiguration()).toBeUndefined();

    installViewerWindow('?mode=synthetic');
    expect(getLocalGaussianSplatLoadersConfiguration()).toBeUndefined();

    installViewerWindow('?loaders=local&scene=fixture', {
      __lumaGaussianSplatsLocalLoadersRoot: '/checkouts/loaders.gl/'
    });
    expect(getLocalGaussianSplatLoadersConfiguration()).toMatchObject({
      loaderMode: 'local',
      loadersRoot: '/checkouts/loaders.gl',
      sceneId: 'fixture',
      expectedSplatCount: 1_000,
      sourceUrl: '/@fs/checkouts/loaders.gl/modules/ply/test/data/gaussian/train-1000.ply'
    });
  });

  test('keeps the parser fixture local and does not activate loading without a bundle', () => {
    installViewerWindow('?scene=fixture');
    expect(() => getLocalGaussianSplatLoadersConfiguration()).toThrow(
      'The lightweight parser fixture requires ?loaders=local.'
    );

    installViewerWindow('', {__lumaGaussianSplatsLoaderBundleUrl: undefined});
    expect(getLocalGaussianSplatLoadersConfiguration()).toBeUndefined();
  });
});

function makeViewerWebGPUDevice(): NullDevice {
  const device = new NullDevice({});
  Object.defineProperties(device, {
    type: {value: 'webgpu'},
    info: {value: {...device.info, type: 'webgpu', shadingLanguage: 'wgsl'}}
  });
  return device;
}

function makeGaussianRADHierarchyView(): SplatHierarchyView {
  return {
    cameraPosition: [0, 0, 12],
    viewportSize: [800, 600]
  };
}

function installViewerWindow(
  search = '',
  overrides: {
    __lumaGaussianSplatsLoaderBundleUrl?: string;
    __lumaGaussianSplatsLocalLoadersRoot?: string;
  } = {}
): void {
  vi.stubGlobal('window', {
    location: {
      search,
      href: `https://luma.gl${WEBSITE_VIEWER_ROUTE}${search}`,
      origin: 'https://luma.gl'
    },
    __lumaGaussianSplatsLoaderBundleUrl: DEPLOYED_LOADER_BUNDLE_URL,
    ...overrides
  });
}

function installGaussianRADPageSourceFixture(
  source: ArrayBuffer,
  search = '',
  options: {delayPages?: boolean} = {}
): {
  configuration: LocalGaussianSplatLoadersConfiguration;
  requestedRanges: string[];
  pendingPageResponses: Array<() => void>;
  requestedPageSignals: Array<AbortSignal | undefined>;
} {
  installViewerWindow(`?source=https%3A%2F%2Fexample.test%2Fscene.rad${search}`);
  const configuration = getLocalGaussianSplatLoadersConfiguration();
  if (!configuration) {
    throw new Error('The isolated RAD loader configuration was not created.');
  }
  configuration.loaderBundleUrl = pathToFileURL(
    path.join(process.cwd(), 'website/static/standalone-examples/gaussian-splats/loaders-gl.mjs')
  ).href;
  vi.stubGlobal('window', {
    location: {href: 'file:///gaussian-splat-viewer.html', origin: 'null'}
  });

  const requestedRanges: string[] = [];
  const pendingPageResponses: Array<() => void> = [];
  const requestedPageSignals: Array<AbortSignal | undefined> = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_input: string | URL | Request, requestOptions?: RequestInit) => {
      const range = new Headers(requestOptions?.headers).get('Range');
      if (range) {
        requestedRanges.push(range);
      }
      const match = range?.match(/^bytes=(\d+)-(\d+)$/);
      const start = Number(match?.[1] ?? 0);
      const end = Math.min(Number(match?.[2] ?? source.byteLength - 1) + 1, source.byteLength);
      const makeResponse = (): Response =>
        new Response(source.slice(start, end), {
          status: range ? 206 : 200,
          headers: {'content-length': String(end - start)}
        });

      if (!options.delayPages || requestedRanges.length === 1) {
        return makeResponse();
      }

      const signal = requestOptions?.signal ?? undefined;
      requestedPageSignals.push(signal);
      return await new Promise<Response>((resolve, reject) => {
        if (signal?.aborted) {
          reject(signal.reason);
          return;
        }
        const handleAbort = (): void => reject(signal?.reason);
        signal?.addEventListener('abort', handleAbort, {once: true});
        pendingPageResponses.push(() => {
          signal?.removeEventListener('abort', handleAbort);
          resolve(makeResponse());
        });
      });
    })
  );

  return {configuration, requestedRanges, pendingPageResponses, requestedPageSignals};
}

function makeGaussianSplatPLYFixture(): string {
  return [
    'ply',
    'format ascii 1.0',
    'element vertex 1',
    'property float x',
    'property float y',
    'property float z',
    'property float f_dc_0',
    'property float f_dc_1',
    'property float f_dc_2',
    'property float opacity',
    'property float scale_0',
    'property float scale_1',
    'property float scale_2',
    'property float rot_0',
    'property float rot_1',
    'property float rot_2',
    'property float rot_3',
    'end_header',
    '0 0 0 1 0.5 0.25 1 -2 -2 -2 1 0 0 0',
    ''
  ].join('\n');
}

function makeGaussianRADFixture(
  firstChunkRowCount = 1,
  options: {
    chunkCount?: number;
    chunkBaseStride?: number;
    chunkSize?: number;
    hierarchyRows?: readonly (readonly {childCount: number; childStart: number}[])[];
    includeLoDTree?: boolean;
    omitChunkRowRanges?: boolean;
  } = {}
): ArrayBuffer {
  const chunkCount = options.chunkCount ?? 2;
  const chunkBaseStride = options.chunkBaseStride ?? 10;
  const chunks = Array.from({length: chunkCount}, (_, chunkIndex) =>
    makeGaussianRADChunkFixture(
      chunkIndex * chunkBaseStride,
      chunkIndex + 1,
      chunkIndex === 0 ? firstChunkRowCount : 1,
      options.includeLoDTree
        ? {
            childCount: chunkIndex + 1 < chunkCount ? 1 : 0,
            childStart: chunkIndex + 1 < chunkCount ? (chunkIndex + 1) * chunkBaseStride : 0,
            ...(options.hierarchyRows?.[chunkIndex]
              ? {rows: options.hierarchyRows[chunkIndex]}
              : {})
          }
        : undefined
    )
  );
  const metadata = {
    version: 1,
    type: 'gsplat',
    count: firstChunkRowCount + chunkCount - 1,
    maxSh: 0,
    chunkSize: options.chunkSize ?? 1,
    ...(options.includeLoDTree ? {lodTree: true} : {}),
    allChunkBytes: chunks.reduce((byteLength, chunk) => byteLength + chunk.byteLength, 0),
    chunks: chunks.map((chunk, index) => ({
      offset: chunks
        .slice(0, index)
        .reduce((byteLength, previous) => byteLength + previous.byteLength, 0),
      bytes: chunk.byteLength,
      ...(options.omitChunkRowRanges
        ? {}
        : {base: index * chunkBaseStride, count: index === 0 ? firstChunkRowCount : 1})
    }))
  };
  const metadataBytes = new TextEncoder().encode(JSON.stringify(metadata));
  const chunkByteOffset = 8 + alignGaussianRADBytes(metadataBytes.byteLength);
  const data = new ArrayBuffer(chunkByteOffset + metadata.allChunkBytes);
  const view = new DataView(data);
  const bytes = new Uint8Array(data);
  view.setUint32(0, 0x30444152, true);
  view.setUint32(4, metadataBytes.byteLength, true);
  bytes.set(metadataBytes, 8);
  let byteOffset = chunkByteOffset;
  for (const chunk of chunks) {
    bytes.set(new Uint8Array(chunk), byteOffset);
    byteOffset += chunk.byteLength;
  }
  return data;
}

function makeGaussianRADChunkFixture(
  base: number,
  coordinate: number,
  rowCount = 1,
  hierarchy?: {
    childCount: number;
    childStart: number;
    rows?: readonly {childCount: number; childStart: number}[];
  }
): ArrayBuffer {
  const position = Float32Array.from(
    {length: rowCount * 3},
    (_, componentIndex) => coordinate + componentIndex
  );
  const childCounts = new Uint16Array(rowCount);
  const childStarts = new Uint32Array(rowCount);
  if (hierarchy) {
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      const rowHierarchy = hierarchy.rows?.[rowIndex];
      childCounts[rowIndex] =
        rowHierarchy?.childCount ?? (rowIndex === 0 ? hierarchy.childCount : 0);
      childStarts[rowIndex] =
        rowHierarchy?.childStart ?? (rowIndex === 0 ? hierarchy.childStart : 0);
    }
  }
  const childCountByteOffset = alignGaussianRADBytes(position.byteLength);
  const childStartByteOffset = childCountByteOffset + alignGaussianRADBytes(childCounts.byteLength);
  const payloadByteLength = hierarchy
    ? childStartByteOffset + alignGaussianRADBytes(childStarts.byteLength)
    : alignGaussianRADBytes(position.byteLength);
  const metadataBytes = new TextEncoder().encode(
    JSON.stringify({
      version: 1,
      base,
      count: rowCount,
      payloadBytes: payloadByteLength,
      maxSh: 0,
      lodTree: Boolean(hierarchy),
      properties: [
        {offset: 0, bytes: position.byteLength, property: 'center', encoding: 'f32'},
        ...(hierarchy
          ? [
              {
                offset: childCountByteOffset,
                bytes: childCounts.byteLength,
                property: 'child_count',
                encoding: 'u16'
              },
              {
                offset: childStartByteOffset,
                bytes: childStarts.byteLength,
                property: 'child_start',
                encoding: 'u32'
              }
            ]
          : [])
      ]
    })
  );
  const payloadByteLengthOffset = 8 + alignGaussianRADBytes(metadataBytes.byteLength);
  const payloadByteOffset = payloadByteLengthOffset + 8;
  const data = new ArrayBuffer(payloadByteOffset + payloadByteLength);
  const view = new DataView(data);
  const bytes = new Uint8Array(data);
  view.setUint32(0, 0x43444152, true);
  view.setUint32(4, metadataBytes.byteLength, true);
  bytes.set(metadataBytes, 8);
  view.setBigUint64(payloadByteLengthOffset, BigInt(payloadByteLength), true);
  bytes.set(new Uint8Array(position.buffer), payloadByteOffset);
  if (hierarchy) {
    bytes.set(new Uint8Array(childCounts.buffer), payloadByteOffset + childCountByteOffset);
    bytes.set(new Uint8Array(childStarts.buffer), payloadByteOffset + childStartByteOffset);
  }
  return data;
}

function alignGaussianRADBytes(byteLength: number): number {
  return (byteLength + 7) & ~7;
}
