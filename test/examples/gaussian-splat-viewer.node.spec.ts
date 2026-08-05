// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {afterEach, describe, expect, test, vi} from 'vitest';
import {
  getGaussianSplatExecutionMode,
  makeGaussianSplatInfoHtml
} from '../../examples/showcase/gaussian-splats/app';
import {
  GAUSSIAN_SPLAT_SOURCE_CATALOG,
  getLocalGaussianSplatLoadersConfiguration,
  loadLocalGaussianSplatArrowSources,
  type LocalGaussianSplatLoadProgress
} from '../../examples/showcase/gaussian-splats/local-loaders';
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
    expect(viewerSource).toContain('this.activateGraphRenderer()');
    expect(viewerDocumentation).toContain('GPU command');
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

    installViewerWindow('?source=https%3A%2F%2Fexample.test%2Fcaptured.spz');
    expect(getLocalGaussianSplatLoadersConfiguration()).toMatchObject({
      loaderMode: 'bundled',
      sceneId: 'custom',
      sourceUrl: 'https://example.test/captured.spz',
      sourceFormat: 'SPZ'
    });

    expect(GAUSSIAN_SPLAT_SOURCE_CATALOG.map(scene => scene.id)).toEqual(
      expect.arrayContaining(['train', 'drjohnson', 'playroom', 'truck', 'train-github'])
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
