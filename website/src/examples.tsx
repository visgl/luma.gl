//

import React, {useEffect, useMemo, useRef, useState, useSyncExternalStore} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {
  DeviceTabs,
  ExampleHeader,
  ExamplePage,
  getCanvasContainer,
  InfoBox,
  LumaExample,
  ReactExample,
  type ExampleDisplayProps,
  useStore
} from './react-luma';
import type {Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';

import {makeHtmlCustomPanel} from '../../examples/example-panels';
import {makeArrowExamplePanelHostHtml} from '../../examples/arrow/arrow-example-panels';
import AnimationApp from '../../examples/api/animation/app';
import BlendingApp from '../../examples/api/blending/app';
import CubemapApp from '../../examples/api/cubemap/app';
import ArrowDggsPolygonsApp from '../../examples/arrow/arrow-dggs-polygons/app';
import ArrowColumnRendererApp from '../../examples/arrow/arrow-columns/app';
import ArrowMeshGeometryApp from '../../examples/arrow/arrow-mesh-geometry/app';
import ArrowGeoArrowApp from '../../examples/arrow/arrow-geoarrow/app';
import ArrowLinesApp from '../../examples/arrow/arrow-lines/app';
import ArrowFloat64PrecisionApp from '../../examples/arrow/arrow-float64-precision/app';
import ArrowPointRendererApp from '../../examples/arrow/arrow-points/app';
import ArrowFilteringApp from '../../examples/arrow/arrow-filtering/app';
import ArrowPolygonRendererApp from '../../examples/arrow/arrow-polygons/app';
import BloomApp from '../../examples/experimental/bloom/app';
import HTMLUIPrismApp from '../../examples/experimental/html-ui-prism/app';
import GPUFrustumCullingApp from '../../examples/experimental/gpu-frustum-culling/app';
import GPUSceneGraphApp from '../../examples/experimental/gpu-scene-graph/app';
import GPUTraceSceneApp from '../../examples/experimental/gpu-trace-scene/app';
import GPUTraceViewerApp from '../../examples/experimental/gpu-trace-viewer/app';
import GPUGraphExplorerApp from '../../examples/experimental/gpu-graph-explorer/app';
import LuCIMVolumeLabApp from '../../examples/experimental/lucim-volume-lab/app';
import {
  initializeGPUSortExample,
  type GPUSortExampleHandle
} from '../../examples/experimental/gpu-sort/src/app';
import {
  initializeGPUDataAnalysisExample,
  type GPUDataAnalysisExampleHandle
} from '../../examples/experimental/gpu-data-analysis/src/app';
import GPT2App from '../../examples/experimental/gpt-2/app';
import VideoTextureApp from '../../examples/api/video-texture/app';
import WebXRKaleidoscopeApp from '../../examples/experimental/webxr-kaleidoscope/app';
import {
  initializeGPGPUShowcase,
  type GPGPUShowcaseHandle
} from '../../examples/v10/gpgpu/src/app';
import ArrowParticlesApp from '../../examples/arrow/arrow-particles/app';
import MultiCanvasApp from '../../examples/api/multi-canvas/app';
import Texture3DApp from '../../examples/api/texture-3d/app';
import TextureSamplingApp from '../../examples/api/texture-sampling/app';
import TextureTesterApp from '../../examples/api/texture-tester/app';
import initializeExternalWebGLContext, {
  ExternalWebGLContextHandle
} from '../../examples/integrations/external-context/app';
import HelloReactApp from '../../examples/integrations/hello-react/app';
import {getErrorMessage, logError} from './react-luma/utils/error-utils';
import DOFApp from '../../examples/showcase/dof/app';
import AdvancedEffectsApp from '../../examples/experimental/advanced-effects/app';
import DeferredRenderingApp from '../../examples/experimental/deferred-rendering/app';
import FluidFoundryApp from '../../examples/experimental/fluid-foundry/app';
import SpectralCausticsApp from '../../examples/experimental/spectral-caustics/app';
import VolumetricFireForgeApp from '../../examples/experimental/volumetric-fire-forge/app';
import VirtualGeometryCanyonApp from '../../examples/experimental/virtual-geometry-canyon/app';
import ShadowMapApp from '../../examples/experimental/shadow-map/app';
import ABufferApp from '../../examples/experimental/a-buffer/app';

// import PerformanceApp from '../../examples/performance/stress-test/app';

// import DOFApp from '../../examples/showcase/dof/app';
// import GeospatialApp from '../../examples/showcase/geospatial/app';
import GLTFApp from '../../examples/showcase/gltf/app';
import GaussianSplatsApp from '../../examples/showcase/gaussian-splats/app';
import type {GaussianSplatSourceCatalogEntry} from '../../examples/showcase/gaussian-splats/local-loaders';
import ArrowTemporalStarfieldApp from '../../examples/arrow/arrow-temporal-starfield/app';
import ArrowTimeColumnsApp from '../../examples/arrow/arrow-time-columns/app';
import ArrowText2DApp from '../../examples/arrow/arrow-text-2d/app';
import InstancingApp from '../../examples/showcase/instancing/app';
import LightstormMegacityApp from '../../examples/showcase/lightstorm-megacity/app';
import VectorFieldLabApp from '../../examples/showcase/vector-field-lab/app';
import TempestOceanApp from '../../examples/showcase/tempest-ocean/app';
import RenderBundlesApp from '../../examples/api/render-bundles/app';
import TextSpaceCrawlApp from '../../examples/experimental/text-space-crawl/app';
import PersistenceApp from '../../examples/showcase/persistence/app';
import PostprocessingApp from '../../examples/showcase/postprocessing/app';
import AntialiasingApp from '../../examples/experimental/antialiasing/app';
import GlobeApp from '../../examples/showcase/globe/app';
import PacketSprayingApp from '../../examples/showcase/packet-spraying/app';
// import WanderingApp from '../../examples/showcase/wandering/app';

import HelloTriangleGeometryApp from '../../examples/tutorials/hello-triangle-geometry/app';
import HelloTriangleApp from '../../examples/tutorials/hello-triangle/app';
import HelloCubeApp from '../../examples/tutorials/hello-cube/app';
import TwoCubesApp from '../../examples/tutorials/hello-two-cubes/app';
import InstancedCubesApp from '../../examples/tutorials/hello-instanced-cubes/app';
import HelloInstancingApp from '../../examples/tutorials/hello-instancing/app';
import HelloGLTFApp from '../../examples/tutorials/hello-gltf/app';
import LightingApp from '../../examples/tutorials/lighting/app';
import ShaderHooksApp from '../../examples/tutorials/shader-hooks/app';
import ShaderPluginsApp from '../../examples/tutorials/shader-plugins/app';
import ShaderModulesApp from '../../examples/tutorials/shader-modules/app';
import TransformFeedbackApp from '../../examples/tutorials/transform-feedback/app';
import TransformApp from '../../examples/tutorials/transform/app';
import {createArrowPathLayerDeck} from '../../examples/deck/arrow-path-layer/app';
import {createArrowPolygonLayerDeck} from '../../examples/deck/arrow-polygon-layer/app';
import {createArrowTextLayerDeck} from '../../examples/deck/arrow-text-layer/app';
import {createGPUCulledTraceDeck} from '../../examples/deck/gpu-culled-trace/app';

const exampleConfig = {};

const loadBillionPointSpatialAtlasExample = () =>
  import('../../examples/showcase/billion-point-spatial-atlas/app');
const loadMillionRowCrossfilterExample = () =>
  import('../../examples/showcase/million-row-crossfilter/app');
const loadRasterLabExample = () => import('../../examples/showcase/raster-lab/app');
const loadGPUSpatialTaxiExample = () => import('../../examples/deck/luspatial-taxi/app');
const loadGPUGraphExplorerDeckExample = () => import('../../examples/deck/gpu-graph-explorer/app');
const loadFP64Example = () => import('../../examples/experimental/fp64/app');

type WebsiteExampleProps = React.PropsWithChildren<
  ExampleDisplayProps & {
    autoStart?: boolean;
    panel?: boolean;
    showHeader?: boolean;
    showStats?: boolean;
    templateInfoPlacement?: 'header' | 'page';
  }
>;

type DeferredExampleModuleState<Module> = {
  module: Module | null;
  errorMessage: string | null;
};

function useDeferredExampleModule<Module>(
  loadModule: () => Promise<Module>,
  enabled = true
): DeferredExampleModuleState<Module> {
  const [moduleState, setModuleState] = useState<DeferredExampleModuleState<Module>>({
    module: null,
    errorMessage: null
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let isCancelled = false;
    const loadingTimeout = window.setTimeout(() => {
      void loadModule()
        .then(module => {
          if (!isCancelled) {
            setModuleState({module, errorMessage: null});
          }
        })
        .catch(error => {
          if (!isCancelled) {
            setModuleState({module: null, errorMessage: getErrorMessage(error)});
          }
        });
    }, 0);

    return () => {
      isCancelled = true;
      window.clearTimeout(loadingTimeout);
    };
  }, [enabled, loadModule]);

  return moduleState;
}

function DeferredGPUExampleStatus({
  title,
  description,
  errorMessage,
  embedded,
  embeddedHeight,
  style
}: {
  title: string;
  description: string;
  errorMessage?: string | null;
} & WebsiteExampleProps): React.JSX.Element {
  return (
    <ExamplePage
      embedded={embedded}
      embeddedHeight={embeddedHeight}
      style={{
        background:
          'radial-gradient(ellipse at 22% 16%, rgba(56, 189, 248, 0.16), transparent 42%), #07101d',
        ...style
      }}
    >
      <div
        aria-live="polite"
        role={errorMessage ? 'alert' : 'status'}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          alignContent: 'center',
          justifyContent: 'center',
          gap: 12,
          padding: 32,
          color: '#f1f5f9',
          textAlign: 'center'
        }}
      >
        <span
          style={{
            color: '#7dd3fc',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase'
          }}
        >
          {errorMessage ? 'Unable to load GPU experience' : 'Preparing GPU experience'}
        </span>
        <strong style={{fontSize: 22, lineHeight: 1.2}}>{title}</strong>
        <span style={{maxWidth: 420, color: '#b6c5d7', fontSize: 14, lineHeight: 1.6}}>
          {errorMessage || description}
        </span>
      </div>
    </ExamplePage>
  );
}

type DeckExampleHandle = {
  finalize: () => void;
};
type CreateDeckExample = (
  parent: HTMLDivElement,
  options: {device: Device}
) =>
  | DeckExampleHandle
  | Promise<DeckExampleHandle>;
type DeckArrowLayerPanelProps = {
  id: string;
  title: string;
  devices?: Array<'webgpu' | 'webgl2'>;
};

function makeDeckArrowLayerInfoPanel({id, title}: DeckArrowLayerPanelProps) {
  return makeHtmlCustomPanel({
    id: `${id}-info`,
    title,
    html: makeArrowExamplePanelHostHtml()
  });
}

function DeckArrowLayerPanel({id, title, devices = ['webgpu', 'webgl2']}: DeckArrowLayerPanelProps) {
  const panel = useMemo(
    () => makeDeckArrowLayerInfoPanel({id, title}),
    [id, title]
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        left: 0,
        zIndex: 20,
        padding: '12px 20px',
        pointerEvents: 'none'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12
        }}
      >
        <InfoBox
          id={id}
          title={title}
          sourcePath={`examples/deck/${id}/app.ts`}
          style={{pointerEvents: 'auto'}}
          panel={panel}
        />
        <DeviceTabs
          devices={devices}
          style={{flexShrink: 0, marginLeft: 'auto', pointerEvents: 'auto'}}
        />
      </div>
    </div>
  );
}

function DeckArrowLayerCanvas({
  createDeck,
  panel
}: {
  createDeck: CreateDeckExample;
  panel: DeckArrowLayerPanelProps;
}): React.ReactNode {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const device = useStore(state => state.device);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !device) {
      return;
    }

    const deviceCanvas = device.getDefaultCanvasContext().canvas;
    if (!(deviceCanvas instanceof HTMLCanvasElement)) {
      throw new Error('Website Deck examples require the shared device canvas to be an HTMLCanvasElement');
    }
    Object.assign(deviceCanvas.style, {
      display: 'block',
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%'
    });
    container.replaceChildren(deviceCanvas);

    let isFinalized = false;
    let deck: DeckExampleHandle | null = null;
    void Promise.resolve(createDeck(container, {device})).then(createdDeck => {
      if (isFinalized) {
        createdDeck.finalize();
        return;
      }
      deck = createdDeck;
    });

    return () => {
      isFinalized = true;
      deck?.finalize();
      container.replaceChildren();
      getCanvasContainer().appendChild(deviceCanvas);
    };
  }, [createDeck, device]);

  return (
    <>
      <div ref={containerRef} style={{position: 'absolute', inset: 0, overflow: 'hidden'}} />
      <DeckArrowLayerPanel {...panel} />
    </>
  );
}

type DeckArrowLayerExampleProps = {
  embedded?: boolean;
};

const DECK_ARROW_LAYER_EMBEDDED_STYLE: React.CSSProperties = {
  boxSizing: 'border-box',
  height: '640px',
  minHeight: '640px',
  margin: '1rem 0 2rem',
  border: '1px solid var(--ifm-color-emphasis-300)',
  borderRadius: '8px',
  overflow: 'hidden'
};

export const DeckArrowPathLayerExample: React.FC<DeckArrowLayerExampleProps> = ({
  embedded = false
}) => (
  <ReactExample
    component={DeckArrowLayerCanvas}
    componentProps={{
      createDeck: createArrowPathLayerDeck,
      panel: {
        id: 'arrow-path-layer',
        title: 'Arrow Path Layer'
      }
    }}
    showStats={false}
    style={embedded ? DECK_ARROW_LAYER_EMBEDDED_STYLE : undefined}
  />
);

export const DeckArrowPolygonLayerExample: React.FC<DeckArrowLayerExampleProps> = ({
  embedded = false
}) => (
  <ReactExample
    component={DeckArrowLayerCanvas}
    componentProps={{
      createDeck: createArrowPolygonLayerDeck,
      panel: {
        id: 'arrow-polygon-layer',
        title: 'Arrow Polygon Layer'
      }
    }}
    showStats={false}
    style={embedded ? DECK_ARROW_LAYER_EMBEDDED_STYLE : undefined}
  />
);

export const DeckArrowTextLayerExample: React.FC<DeckArrowLayerExampleProps> = ({
  embedded = false
}) => (
  <ReactExample
    component={DeckArrowLayerCanvas}
    componentProps={{
      createDeck: createArrowTextLayerDeck,
      panel: {
        id: 'arrow-text-layer',
        title: 'Arrow Text Layer'
      }
    }}
    showStats={false}
    style={embedded ? DECK_ARROW_LAYER_EMBEDDED_STYLE : undefined}
  />
);

export const DeckGPUCulledTraceExample: React.FC<DeckArrowLayerExampleProps> = ({
  embedded = false
}) => (
  <ReactExample
    component={DeckArrowLayerCanvas}
    componentProps={{
      createDeck: createGPUCulledTraceDeck,
      panel: {
        id: 'gpu-culled-trace',
        title: 'GPU-Culled Trace with Arrow Text',
        devices: ['webgpu']
      }
    }}
    showStats={false}
    style={embedded ? DECK_ARROW_LAYER_EMBEDDED_STYLE : undefined}
  />
);

export const DeckGPUSpatialTaxiExample: React.FC<DeckArrowLayerExampleProps> = ({
  embedded = false
}) => {
  const {module, errorMessage} = useDeferredExampleModule(loadGPUSpatialTaxiExample);

  if (!module) {
    return (
      <DeferredGPUExampleStatus
        title="GPU Project + luSpatial Taxi Explorer"
        description="Loading the projection, spatial-query, and interactive map tools."
        errorMessage={errorMessage}
        embedded={embedded}
        style={embedded ? DECK_ARROW_LAYER_EMBEDDED_STYLE : undefined}
      />
    );
  }

  return (
    <ReactExample
      component={DeckArrowLayerCanvas}
      componentProps={{
        createDeck: module.createGPUSpatialTaxiDeck,
        panel: {
          id: 'luspatial-taxi',
          title: 'GPU Project + luSpatial Taxi Explorer',
          devices: ['webgpu']
        }
      }}
      showStats={false}
      style={embedded ? DECK_ARROW_LAYER_EMBEDDED_STYLE : undefined}
    />
  );
};

/** Loads the optional deck.gl graph integration only when its WebGPU example is opened. */
export const DeckGPUGraphExplorerExample: React.FC<DeckArrowLayerExampleProps> = ({
  embedded = false
}) => {
  const {module, errorMessage} = useDeferredExampleModule(loadGPUGraphExplorerDeckExample);

  if (!module) {
    return (
      <DeferredGPUExampleStatus
        title="GPU Graph + deck.gl Network Explorer"
        description="Loading GPU graph analytics, progressive layout, and direct deck.gl layers."
        errorMessage={errorMessage}
        embedded={embedded}
        style={embedded ? DECK_ARROW_LAYER_EMBEDDED_STYLE : undefined}
      />
    );
  }

  return (
    <ReactExample
      component={DeckArrowLayerCanvas}
      componentProps={{
        createDeck: module.createGPUGraphExplorerDeck,
        panel: {
          id: 'gpu-graph-explorer',
          title: 'GPU Graph + deck.gl Network Explorer',
          devices: ['webgpu']
        }
      }}
      showStats={false}
      style={embedded ? DECK_ARROW_LAYER_EMBEDDED_STYLE : undefined}
    />
  );
};

type DeckArrowLayerExampleId = 'path' | 'polygon' | 'text';

const DECK_ARROW_LAYER_DOC_EXAMPLES: Array<{
  id: DeckArrowLayerExampleId;
  label: string;
  Example: React.FC<DeckArrowLayerExampleProps>;
}> = [
  {id: 'path', label: 'Paths', Example: DeckArrowPathLayerExample},
  {id: 'polygon', label: 'Polygons', Example: DeckArrowPolygonLayerExample},
  {id: 'text', label: 'Text', Example: DeckArrowTextLayerExample}
];

/** Embeds one live Arrow renderer example at a time in the luma.gl Arrow documentation. */
export const ArrowRenderingDocsExample: React.FC = () => {
  const [activeExampleId, setActiveExampleId] = useState<DeckArrowLayerExampleId>('path');
  const activeExample = DECK_ARROW_LAYER_DOC_EXAMPLES.find(
    example => example.id === activeExampleId
  )!;
  const ActiveExample = activeExample.Example;

  return (
    <section aria-label="Arrow rendering examples">
      <div className="docs-page-tabs" role="tablist" aria-label="Arrow renderers">
        {DECK_ARROW_LAYER_DOC_EXAMPLES.map(example => (
          <button
            key={example.id}
            className={
              example.id === activeExampleId
                ? 'docs-page-tabs__tab docs-page-tabs__tab--active'
                : 'docs-page-tabs__tab'
            }
            type="button"
            role="tab"
            aria-selected={example.id === activeExampleId}
            onClick={() => setActiveExampleId(example.id)}
          >
            {example.label}
          </button>
        ))}
      </div>
      <ActiveExample embedded />
    </section>
  );
};

const GPGPU_EXAMPLE_STYLE = `
  .gpgpu-showcase {
    box-sizing: border-box;
    min-height: 100%;
    padding: 22px;
    background: #f7f8fb;
    color: #16202f;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .gpgpu-showcase * {
    box-sizing: border-box;
  }

  .gpgpu-showcase h1 {
    margin: 0;
    font-size: 24px;
    line-height: 1.2;
    font-weight: 720;
  }

  .gpgpu-showcase .subtitle {
    max-width: 860px;
    margin: 8px 0 18px;
    color: #5b6678;
    font-size: 14px;
    line-height: 1.45;
  }

  .gpgpu-showcase .metadata-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(140px, 1fr));
    gap: 10px;
    margin-bottom: 16px;
  }

  .gpgpu-showcase .metric {
    border: 1px solid #d9dee8;
    border-radius: 8px;
    background: #fff;
    padding: 10px 12px;
  }

  .gpgpu-showcase .metric span,
  .gpgpu-showcase .header-cell small,
  .gpgpu-showcase .expression-note,
  .gpgpu-showcase .status {
    color: #697386;
    font-size: 12px;
  }

  .gpgpu-showcase .metric strong {
    display: block;
    margin-top: 3px;
    font-size: 16px;
    font-variant-numeric: tabular-nums;
  }

  .gpgpu-showcase .expression-panel {
    display: grid;
    gap: 8px;
    margin-bottom: 16px;
  }

  .gpgpu-showcase .expression-panel label {
    font-size: 13px;
    font-weight: 680;
  }

  .gpgpu-showcase .expression-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
  }

  .gpgpu-showcase .expression-row input,
  .gpgpu-showcase .expression-row button {
    border: 1px solid #cfd6e2;
    border-radius: 8px;
    background: #fff;
    color: inherit;
    font: 14px/1.4 ui-monospace, "SFMono-Regular", Consolas, monospace;
    padding: 9px 10px;
  }

  .gpgpu-showcase .expression-row button {
    min-width: 76px;
    background: #eef2f7;
    color: #7b8494;
  }

  .gpgpu-showcase .table-panel {
    min-width: 0;
    border: 1px solid #d9dee8;
    border-radius: 8px;
    overflow: hidden;
    background: #fff;
  }

  .gpgpu-showcase .table-row-grid {
    display: grid;
    grid-template-columns: var(
      --table-grid-template,
      112px minmax(300px, 1.2fr) minmax(120px, 0.45fr) minmax(320px, 1.25fr)
    );
  }

  .gpgpu-showcase .table-header-clip {
    border-bottom: 1px solid #d9dee8;
    background: #f2f5f9;
    overflow: hidden;
  }

  .gpgpu-showcase .table-header {
    min-width: 880px;
    will-change: transform;
  }

  .gpgpu-showcase .header-cell,
  .gpgpu-showcase .table-cell {
    min-width: 0;
    border-right: 1px solid #e4e8f0;
    padding: 8px 10px;
  }

  .gpgpu-showcase .header-cell:last-child,
  .gpgpu-showcase .table-cell:last-child {
    border-right: 0;
  }

  .gpgpu-showcase .header-cell span {
    display: block;
    font-size: 13px;
    font-weight: 720;
  }

  .gpgpu-showcase .header-cell small {
    display: block;
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .gpgpu-showcase .table-scroll {
    height: calc(100vh - 380px);
    min-height: 360px;
    overflow: auto;
    position: relative;
    contain: strict;
  }

  .gpgpu-showcase .row-layer {
    position: relative;
    min-width: 880px;
  }

  .gpgpu-showcase .data-row {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 34px;
  }

  .gpgpu-showcase .data-row .table-cell {
    height: 34px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    border-bottom: 1px solid #edf0f5;
    font: 12px/33px ui-monospace, "SFMono-Regular", Consolas, monospace;
    font-variant-numeric: tabular-nums;
  }

  .gpgpu-showcase .row-index {
    color: #596579;
    background: #fbfcfe;
  }

  .gpgpu-showcase .status {
    border-top: 1px solid #d9dee8;
    padding: 8px 10px;
    min-height: 30px;
  }

  @media (max-width: 760px) {
    .gpgpu-showcase {
      padding: 14px;
    }

    .gpgpu-showcase .metadata-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .gpgpu-showcase .table-row-grid {
      grid-template-columns: var(--table-grid-template, 96px 260px 120px 280px);
    }
  }
`;

// Showcase Examples

export const ANARIPlaygroundExample: React.FC = () => {
  const source = useBaseUrl('/standalone-examples/scene/playground.html');

  return (
    <ExamplePage style={{background: '#070913', minHeight: '720px'}}>
      <iframe
        title="ANARI Scene Lab"
        src={source}
        allow="clipboard-write"
        style={{border: 0, height: '100%', inset: 0, position: 'absolute', width: '100%'}}
      />
    </ExamplePage>
  );
};

export const GLTFExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="gltf"
    title="glTF Asset Studio"
    subtitle="Physical materials · animated characters · standards-native glTF"
    directory="showcase"
    template={GLTFApp}
    config={exampleConfig}
    canvasContextProfile="high-dynamic-range"
    {...props}
  />
);

export const GaussianSplatsExample: React.FC<WebsiteExampleProps> = props => {
  if (typeof window !== 'undefined') {
    delete window.__lumaGaussianSplatsLoaderBundleUrl;
  }

  return (
    <LumaExample
      id="gaussian-splats"
      title="Gaussian Splats"
      subtitle="Progressive HDR Gaussian splat rendering"
      directory="showcase"
      devices={['webgpu', 'webgl2']}
      template={GaussianSplatsApp}
      config={exampleConfig}
      canvasContextProfile="high-dynamic-range"
      showStats
      {...props}
    />
  );
};

export const GaussianSplatViewerExample: React.FC<
  WebsiteExampleProps & {defaultScene?: GaussianSplatSourceCatalogEntry['id']}
> = ({defaultScene, ...props}) => {
  const loaderBundleUrl = useBaseUrl('/standalone-examples/gaussian-splats/loaders-gl.mjs');
  const animationTemplate = useMemo(() => {
    if (!defaultScene) {
      return GaussianSplatsApp;
    }

    return class GaussianSplatSceneAnimationTemplate extends GaussianSplatsApp {
      constructor(animationProps: AnimationProps) {
        super({...animationProps, defaultScene});
      }
    };
  }, [defaultScene]);

  if (typeof window !== 'undefined') {
    window.__lumaGaussianSplatsLoaderBundleUrl = loaderBundleUrl;
  }

  return (
    <LumaExample
      id="gaussian-splat-viewer"
      title="Gaussian Splat Viewer"
      subtitle="Captured scenes and camera-driven, worker-decoded RAD landscapes"
      directory="showcase"
      sourcePath="examples/showcase/gaussian-splats/app.ts"
      devices={['webgpu', 'webgl2']}
      template={animationTemplate}
      config={exampleConfig}
      canvasContextProfile="high-dynamic-range"
      showStats
      {...props}
    />
  );
};

export const InstancingExample: React.FC = props => (
  <LumaExample
    id="instancing"
    directory="showcase"
    template={InstancingApp}
    config={exampleConfig}
    canvasContextProfile="high-dynamic-range"
    {...props}
  />
);

export const LightstormMegacityExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="lightstorm-megacity"
    title="Lightstorm Megacity"
    subtitle="GPU-driven city at data scale"
    directory="showcase"
    devices={['webgpu']}
    template={LightstormMegacityApp}
    config={exampleConfig}
    canvasContextProfile="high-dynamic-range"
    {...props}
  />
);

export const VectorFieldLabExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="vector-field-lab"
    title="Vector Field Lab"
    subtitle="Linked gradient, divergence, curl, and Laplacian views"
    directory="showcase"
    devices={['webgpu']}
    template={VectorFieldLabApp}
    config={exampleConfig}
    {...props}
  />
);

export const BillionPointSpatialAtlasExample: React.FC<WebsiteExampleProps> = props => {
  const {module, errorMessage} = useDeferredExampleModule(loadBillionPointSpatialAtlasExample);

  if (!module) {
    return (
      <DeferredGPUExampleStatus
        {...props}
        title="Billion-Point Spatial Atlas"
        description="Loading the GPU-native spatial index and interactive atlas."
        errorMessage={errorMessage}
      />
    );
  }

  return (
    <LumaExample
      id="billion-point-spatial-atlas"
      title="Billion-Point Spatial Atlas"
      subtitle="Indexed geospatial queries and indirect rendering at data scale"
      directory="showcase"
      devices={['webgpu']}
      template={module.default}
      config={exampleConfig}
      canvasContextProfile="high-dynamic-range"
      {...props}
    />
  );
};

export const MillionRowCrossfilterExample: React.FC<WebsiteExampleProps> = props => {
  const {module, errorMessage} = useDeferredExampleModule(loadMillionRowCrossfilterExample);

  if (!module) {
    return (
      <DeferredGPUExampleStatus
        {...props}
        title="GPUCrossfilter: Million-Row Crossfilter Explorer"
        description="Loading the million-row linked dashboard and GPU filtering pipeline."
        errorMessage={errorMessage}
      />
    );
  }

  return (
    <LumaExample
      id="million-row-crossfilter"
      title="Million-Row Crossfilter Explorer"
      subtitle="One million points · one GPU-resident linked dashboard"
      directory="showcase"
      devices={['webgpu']}
      template={module.default}
      config={exampleConfig}
      {...props}
    />
  );
};

export const RasterLabExample: React.FC<WebsiteExampleProps> = props => {
  const {module, errorMessage} = useDeferredExampleModule(loadRasterLabExample);

  if (!module) {
    return (
      <DeferredGPUExampleStatus
        {...props}
        title="GPURaster: Satellite Raster Lab"
        description="Loading synthetic satellite bands and the GPU-native raster-analysis graph."
        errorMessage={errorMessage}
      />
    );
  }

  return (
    <LumaExample
      id="raster-lab"
      title="Satellite Raster Lab"
      subtitle="GPU-resident reflectance · masked NDVI · valid-pixel histograms"
      directory="showcase"
      devices={['webgpu']}
      template={module.default}
      config={exampleConfig}
      {...props}
    />
  );
};

export const TempestOceanExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="tempest-ocean"
    title="Tempest Ocean: Spectral Stormfront"
    subtitle="GPUFFT2D displacement · HDR whitecaps"
    directory="showcase"
    devices={['webgpu']}
    template={TempestOceanApp}
    config={exampleConfig}
    canvasContextProfile="high-dynamic-range"
    {...props}
  />
);

export const ArrowText2DExample: React.FC = props => (
  <LumaExample
    id="arrow-text-2d"
    title="Text"
    directory="arrow"
    template={ArrowText2DApp}
    config={exampleConfig}
    showStats
    {...props}
  />
);

export const ArrowTimeColumnsExample: React.FC = props => (
  <LumaExample
    id="arrow-time-columns"
    title="Time"
    directory="arrow"
    template={ArrowTimeColumnsApp}
    config={exampleConfig}
    showStats
    {...props}
  />
);

export const ArrowTemporalStarfieldExample: React.FC = props => (
  <LumaExample
    id="arrow-temporal-starfield"
    title="Durations"
    directory="arrow"
    template={ArrowTemporalStarfieldApp}
    config={exampleConfig}
    showStats
    {...props}
  />
);

export const ArrowLinesExample: React.FC = props => (
  <LumaExample
    id="arrow-lines"
    title="Lines"
    directory="arrow"
    template={ArrowLinesApp}
    config={exampleConfig}
    showStats
    {...props}
  />
);

export const ArrowFloat64PrecisionExample: React.FC = props => (
  <LumaExample
    id="arrow-float64-precision"
    title="Float64 Origin Rebasing"
    directory="arrow"
    template={ArrowFloat64PrecisionApp}
    config={exampleConfig}
    showStats
    {...props}
  />
);

export const ArrowGeoArrowExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="arrow-geoarrow"
    title="GeoArrow"
    directory="arrow"
    template={ArrowGeoArrowApp}
    config={exampleConfig}
    showStats
    {...props}
  />
);

export const ArrowPointRendererExample: React.FC = props => (
  <LumaExample
    id="arrow-points"
    title="Points"
    directory="arrow"
    template={ArrowPointRendererApp}
    config={exampleConfig}
    showStats
    {...props}
  />
);

export const ArrowFilteringExample: React.FC = props => (
  <LumaExample
    id="arrow-filtering"
    title="ShaderPlugin Filtering"
    directory="arrow"
    template={ArrowFilteringApp}
    config={exampleConfig}
    showStats
    {...props}
  />
);

export const ArrowColumnRendererExample: React.FC = props => (
  <LumaExample
    id="arrow-columns"
    title="DGGS + time"
    directory="arrow"
    template={ArrowColumnRendererApp}
    config={exampleConfig}
    devices={['webgpu']}
    showStats
    {...props}
  />
);

export const ArrowPolygonRendererExample: React.FC = props => (
  <LumaExample
    id="arrow-polygons"
    title="Polygons"
    directory="arrow"
    template={ArrowPolygonRendererApp}
    config={exampleConfig}
    showStats
    {...props}
  />
);

export const ArrowDggsPolygonsExample: React.FC = props => (
  <LumaExample
    id="arrow-dggs-polygons"
    title="Global Grids"
    directory="arrow"
    template={ArrowDggsPolygonsApp}
    config={exampleConfig}
    devices={['webgpu']}
    showStats
    {...props}
  />
);

export const GPGPUExample: React.FC = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deviceType = useStore(store => store.deviceType);
  const device = useStore(store => store.device);

  useEffect(() => {
    if (!deviceType?.startsWith('webgpu-') || !device) {
      return;
    }

    let handle: GPGPUShowcaseHandle | null = null;
    try {
      setErrorMessage(null);
      handle = initializeGPGPUShowcase({device});
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      logError('Failed to initialize GPGPU example', error);
    }

    return () => {
      handle?.destroy();
    };
  }, [deviceType, device]);

  return (
    <ExamplePage style={{background: '#f7f8fb', overflow: 'hidden'}}>
      <style>{GPGPU_EXAMPLE_STYLE}</style>
      <main id="app" className="gpgpu-showcase">
        <DeviceTabs devices={['webgpu']} style={{marginBottom: 16}} />
        <h1>@luma.gl/gpgpu evaluator showcase</h1>
        <p className="subtitle">
          Arrow-backed source columns are extracted as typed-array views and wrapped in
          GPUDataEvaluator inputs.
        </p>

        <div className="metadata-grid">
          <div className="metric">
            <span>Rows</span>
            <strong id="metadata-rows">-</strong>
          </div>
          <div className="metric">
            <span>Columns</span>
            <strong id="metadata-columns">-</strong>
          </div>
          <div className="metric">
            <span>Metric Values</span>
            <strong id="metadata-metric-values">-</strong>
          </div>
          <div className="metric">
            <span>Arrow Batches</span>
            <strong id="metadata-arrow-batches">-</strong>
          </div>
        </div>

        <form id="expression-form" className="expression-panel">
          <label htmlFor="expression-input">Expression</label>
          <div className="expression-row">
            <input
              id="expression-input"
              type="text"
              defaultValue="fround(coordinates)"
              spellCheck={false}
            />
            <button id="expression-run" type="submit" disabled>
              Run
            </button>
          </div>
          <div id="expression-message" className="expression-note">
            Run an expression to append its evaluated output as the last table column.
          </div>
          {errorMessage ? (
            <div className="expression-note" role="alert">
              {errorMessage}
            </div>
          ) : null}
        </form>

        <section className="table-panel">
          <div className="table-header-clip">
            <div id="table-header" className="table-header table-row-grid" />
          </div>
          <div id="table-scroll" className="table-scroll">
            <div id="table-row-layer" className="row-layer" />
          </div>
          <div id="table-status" className="status">
            Generating Arrow table...
          </div>
        </section>
      </main>
    </ExamplePage>
  );
};

/** Docusaurus wrapper for the graph-native paired GPU sort example. */
export const GPUSortExample: React.FC<WebsiteExampleProps> = ({embeddedHeight, ...props}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let handle: GPUSortExampleHandle | null = null;
    try {
      handle = initializeGPUSortExample();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      logError('Failed to initialize GPU sort example', error);
    }

    return () => {
      handle?.destroy();
    };
  }, []);

  return (
    <ExamplePage
      {...props}
      embeddedHeight={embeddedHeight ?? (props.embedded ? 720 : undefined)}
      style={{background: '#f7f8fb', overflow: 'auto', ...props.style}}
    >
      <main id="gpu-sort-app" />
      {errorMessage ? (
        <p role="alert" style={{padding: 22}}>
          {errorMessage}
        </p>
      ) : null}
    </ExamplePage>
  );
};

/** Docusaurus wrapper for the graph-native data-analysis example. */
export const GPUDataAnalysisExample: React.FC<WebsiteExampleProps> = ({
  embeddedHeight,
  ...props
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let handle: GPUDataAnalysisExampleHandle | null = null;
    try {
      handle = initializeGPUDataAnalysisExample();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      logError('Failed to initialize GPU data-analysis example', error);
    }
    return () => handle?.destroy();
  }, []);

  return (
    <ExamplePage
      {...props}
      embeddedHeight={embeddedHeight ?? (props.embedded ? 720 : undefined)}
      style={{background: '#f6f8fb', overflow: 'auto', ...props.style}}
    >
      <main id="gpu-data-analysis-app" />
      {errorMessage ? (
        <p role="alert" style={{padding: 22}}>
          {errorMessage}
        </p>
      ) : null}
    </ExamplePage>
  );
};

export const GPT2Example: React.FC = props => (
  <LumaExample
    id="gpt-2"
    title="GPT-2 Transformer"
    directory="experimental"
    devices={['webgpu']}
    showHeader={false}
    showStats={false}
    templateInfoPlacement="page"
    template={GPT2App}
    config={exampleConfig}
    {...props}
  />
);

export const TextSpaceCrawlExample: React.FC = props => (
  <LumaExample
    id="text-space-crawl"
    title="Text Space Crawl"
    directory="experimental"
    template={TextSpaceCrawlApp}
    config={exampleConfig}
    {...props}
  />
);

export const PersistenceExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="persistence"
    directory="showcase"
    template={PersistenceApp}
    config={exampleConfig}
    {...props}
  />
);

export const PostprocessingExample: React.FC<WebsiteExampleProps & {effect?: string}> = ({
  effect,
  ...props
}) => {
  const template = useMemo(() => {
    if (!effect) {
      return PostprocessingApp;
    }

    return class FocusedPostprocessingApp extends PostprocessingApp {
      static override initialEffectName = effect;
    };
  }, [effect]);

  return (
    <LumaExample
      id="postprocessing"
      title="Effects: Image Processing"
      directory="showcase"
      template={template}
      config={exampleConfig}
      {...props}
    />
  );
};

export const AntialiasingExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="antialiasing"
    title="Antialiasing Techniques"
    directory="experimental"
    template={AntialiasingApp}
    config={exampleConfig}
    {...props}
  />
);

export const GlobeExample: React.FC = props => (
  <LumaExample
    id="globe"
    title="Globe"
    directory="showcase"
    template={GlobeApp}
    config={exampleConfig}
    canvasContextProfile="high-dynamic-range"
    {...props}
  />
);

export const PacketSprayingExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="packet-spraying"
    title="Effects: Glass"
    subtitle="Network Packet Spraying"
    directory="showcase"
    template={PacketSprayingApp}
    config={exampleConfig}
    canvasContextProfile="high-dynamic-range"
    {...props}
  />
);

export const DOFExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="dof"
    title="Depth of Field"
    directory="showcase"
    template={DOFApp}
    config={exampleConfig}
    {...props}
  />
);

export const AdvancedEffectsExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="advanced-effects"
    title="Advanced Effects: Visualization City"
    directory="experimental"
    template={AdvancedEffectsApp}
    config={exampleConfig}
    devices={['webgpu-max']}
    requiredDeviceLimits={{maxColorAttachmentBytesPerSample: 44}}
    {...props}
  />
);

export const DeferredRenderingExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="deferred-rendering"
    title="Deferred Rendering: Illumination Lab"
    directory="experimental"
    template={DeferredRenderingApp}
    config={exampleConfig}
    devices={['webgpu-max', 'webgpu-core']}
    requiredDeviceLimits={{
      maxColorAttachments: 5,
      maxColorAttachmentBytesPerSample: 32
    }}
    canvasContextProfile="high-dynamic-range"
    {...props}
  />
);

export const FluidFoundryExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="fluid-foundry"
    title="Fluid Foundry: Liquid Metal Press"
    subtitle="GPU-resident MLS-MPM fluid"
    directory="experimental"
    template={FluidFoundryApp}
    config={exampleConfig}
    devices={['webgpu']}
    canvasContextProfile="high-dynamic-range"
    {...props}
  />
);

export const SpectralCausticsExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="spectral-caustics"
    title="Spectral Caustics: Prism Cathedral"
    directory="experimental"
    template={SpectralCausticsApp}
    config={exampleConfig}
    devices={['webgpu']}
    canvasContextProfile="high-dynamic-range"
    {...props}
  />
);

export const VolumetricFireForgeExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="volumetric-fire-forge"
    title="Volumetric Fire Forge"
    subtitle="Reactive HDR fire on the GPU"
    directory="experimental"
    template={VolumetricFireForgeApp}
    config={exampleConfig}
    devices={['webgpu']}
    canvasContextProfile="high-dynamic-range"
    {...props}
  />
);

export const LuCIMVolumeLabExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="lucim-volume-lab"
    title="LuCIM Volume Lab"
    subtitle="GPU-resident tri-planar volume segmentation"
    directory="experimental"
    template={LuCIMVolumeLabApp}
    config={exampleConfig}
    devices={['webgpu']}
    {...props}
  />
);

export const VirtualGeometryCanyonExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="virtual-geometry-canyon"
    title="Virtual Geometry Canyon"
    subtitle="GPU-driven hierarchical terrain LOD"
    directory="experimental"
    template={VirtualGeometryCanyonApp}
    config={exampleConfig}
    devices={['webgpu']}
    {...props}
  />
);

export const ShadowMapExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="shadow-map"
    title="Effects: Shadow Map Quality"
    directory="experimental"
    template={ShadowMapApp}
    config={exampleConfig}
    devices={['webgpu']}
    {...props}
  />
);

export const OITExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="a-buffer"
    title="Order-independent Transparency"
    directory="experimental"
    template={ABufferApp}
    config={exampleConfig}
    devices={['webgpu', 'webgl2']}
    {...props}
  />
);

export const BloomExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="bloom"
    title="Bloom"
    directory="experimental"
    template={BloomApp}
    config={exampleConfig}
    canvasContextProfile="high-dynamic-range"
    {...props}
  />
);

export const VideoTextureExample: React.FC<WebsiteExampleProps> = props => {
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'pending' | 'live' | 'error'>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraBlocked, setIsCameraBlocked] = useState(false);
  const handleUseCamera = async () => {
    const app = VideoTextureApp.current;
    if (!app) {
      setCameraStatus('error');
      setCameraError('Example is still starting');
      return;
    }

    setCameraStatus('pending');
    setCameraError(null);
    setIsCameraBlocked(false);
    try {
      await app.useCamera();
      setCameraStatus('live');
    } catch (error) {
      setCameraStatus('error');
      setCameraError(getCameraErrorMessage(error));
      setIsCameraBlocked(isCameraPermissionBlocked(error));
    }
  };

  return (
    <LumaExample
      id="video-texture"
      title="Video Texture"
      directory="api"
      template={VideoTextureApp}
      config={exampleConfig}
      headerControls={
        <div style={{display: 'flex', alignItems: 'center', gap: 10, marginTop: 12}}>
          <button
            type="button"
            onClick={() => void handleUseCamera()}
            disabled={cameraStatus === 'pending' || cameraStatus === 'live' || isCameraBlocked}
            style={{
              border: '1px solid #0f766e',
              borderRadius: 999,
              background: cameraStatus === 'live' ? '#ccfbf1' : '#fff',
              color: '#0f172a',
              cursor:
                cameraStatus === 'pending' || cameraStatus === 'live' || isCameraBlocked
                  ? 'default'
                  : 'pointer',
              font: '600 14px system-ui, sans-serif',
              padding: '8px 12px'
            }}
          >
            {cameraStatus === 'pending'
              ? 'Starting camera'
              : cameraStatus === 'live'
                ? 'Camera live'
                : isCameraBlocked
                  ? 'Camera blocked'
                : cameraStatus === 'error'
                  ? 'Retry camera'
                  : 'Use camera'}
          </button>
          {cameraStatus === 'pending' ? <span>Waiting for first frame</span> : null}
          {cameraError ? <span>{cameraError}</span> : null}
        </div>
      }
      {...props}
    />
  );
};

export const WebXRKaleidoscopeExample: React.FC = props => {
  type XRStatus = 'idle' | 'pending' | 'live' | 'error';
  type XRMode = 'immersive-ar' | 'immersive-vr';

  const selectedDevice = useStore(store => store.device);
  const activeApplication = useSyncExternalStore(
    WebXRKaleidoscopeApp.subscribeToCurrent,
    () => WebXRKaleidoscopeApp.current,
    () => null
  );
  const [xrStatus, setXRStatus] = useState<XRStatus>('idle');
  const [xrMode, setXRMode] = useState<XRMode | null>(null);
  const [xrError, setXRError] = useState<string | null>(null);
  const effectiveDevice = activeApplication?.device;
  const usesWebGPU =
    selectedDevice?.type === 'webgpu' || (!selectedDevice && effectiveDevice?.type === 'webgpu');
  const hasWebGPUBinding = typeof window !== 'undefined' && 'XRGPUBinding' in window;
  const hasNativeWebGPUXR =
    usesWebGPU &&
    selectedDevice?.type === effectiveDevice?.type &&
    effectiveDevice?.props.xrCompatible === true &&
    hasWebGPUBinding;
  const backendDescription = usesWebGPU
    ? hasNativeWebGPUXR
      ? 'WebGPU · native stereo projection layers when supported'
      : 'WebGPU desktop preview · choose WebGL2 for immersive fallback'
    : 'WebGL2 · immersive stereo and optional AR camera access';

  const handleXRSession = async (sessionMode: XRMode) => {
    const app = WebXRKaleidoscopeApp.current;
    if (!app) {
      setXRStatus('error');
      setXRError('Example is still starting');
      return;
    }

    setXRStatus('pending');
    setXRMode(sessionMode);
    setXRError(null);
    try {
      if (xrStatus === 'live' && xrMode === sessionMode) {
        await app.exitXR();
        setXRStatus('idle');
        setXRMode(null);
      } else {
        if (xrStatus === 'live') {
          await app.exitXR();
        }
        await app.enterXR(sessionMode);
        setXRStatus('live');
        setXRMode(sessionMode);
      }
    } catch (error) {
      setXRStatus('error');
      setXRMode(null);
      setXRError(getErrorMessage(error));
    }
  };
  const getXRButtonText = (sessionMode: XRMode) => {
    const label = sessionMode === 'immersive-vr' ? 'VR' : 'AR';
    if (xrStatus === 'pending' && xrMode === sessionMode) {
      return `Starting ${label}`;
    }
    if (xrStatus === 'live' && xrMode === sessionMode) {
      return `Exit ${label}`;
    }
    if (xrStatus === 'error' && xrMode === sessionMode) {
      return `Retry ${label}`;
    }
    return `Enter ${label}`;
  };
  const getXRButtonStyle = (sessionMode: XRMode): React.CSSProperties => ({
    border: '1px solid rgba(103, 232, 249, 0.4)',
    borderRadius: 999,
    background:
      xrStatus === 'live' && xrMode === sessionMode
        ? 'rgba(34, 211, 238, 0.24)'
        : 'rgba(15, 23, 42, 0.84)',
    color: '#ecfeff',
    cursor: xrStatus === 'pending' ? 'default' : 'pointer',
    font: '600 13px system-ui, sans-serif',
    letterSpacing: '0.01em',
    padding: '9px 15px'
  });

  return (
    <LumaExample
      id="webxr-kaleidoscope"
      title="WebXR: Immersive Prism Portal"
      subtitle="Native GPU stereo with a portable WebGL2 fallback"
      directory="experimental"
      devices={['webgpu', 'webgl2']}
      xrCompatible
      template={WebXRKaleidoscopeApp}
      config={exampleConfig}
      headerControls={
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(8, 15, 32, 0.96), rgba(15, 23, 42, 0.9))',
            border: '1px solid rgba(103, 232, 249, 0.18)',
            borderRadius: 16,
            color: '#cbd5e1',
            display: 'grid',
            gap: 11,
            marginTop: 14,
            maxWidth: 560,
            padding: '13px 15px'
          }}
        >
          <div
            style={{
              color: '#a5f3fc',
              font: '600 11px system-ui, sans-serif',
              letterSpacing: '0.1em',
              textTransform: 'uppercase'
            }}
          >
            {backendDescription}
          </div>
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 9
            }}
          >
            <button
              type="button"
              onClick={() => void handleXRSession('immersive-vr')}
              disabled={xrStatus === 'pending'}
              style={getXRButtonStyle('immersive-vr')}
            >
              {getXRButtonText('immersive-vr')}
            </button>
            <button
              type="button"
              onClick={() => void handleXRSession('immersive-ar')}
              disabled={xrStatus === 'pending'}
              style={getXRButtonStyle('immersive-ar')}
            >
              {getXRButtonText('immersive-ar')}
            </button>
            <span aria-live="polite" style={{fontSize: 12, lineHeight: 1.5}}>
              {xrStatus === 'pending'
                ? `Requesting ${xrMode === 'immersive-ar' ? 'AR' : 'VR'} session`
                : xrStatus === 'live'
                  ? `${xrMode === 'immersive-ar' ? 'AR' : 'VR'} session active`
                  : 'Drag to explore · headset optional'}
            </span>
          </div>
          {xrError ? (
            <span role="alert" style={{color: '#fda4af', fontSize: 12, lineHeight: 1.5}}>
              {xrError}
            </span>
          ) : null}
        </div>
      }
      {...props}
    />
  );
};

function isCameraPermissionBlocked(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'NotAllowedError';
}

function getCameraErrorMessage(error: unknown): string {
  return isCameraPermissionBlocked(error)
    ? 'Allow camera access in browser or system settings'
    : getErrorMessage(error);
}

export const HTMLUIPrismExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="html-ui-prism"
    title="HTML-in-Canvas Prism"
    directory="experimental"
    template={HTMLUIPrismApp}
    config={exampleConfig}
    {...props}
  />
);

export const GPUTraceViewerExample: React.FC = props => (
  <LumaExample
    id="gpu-trace-viewer"
    title="GPU Hierarchical Trace Viewer"
    directory="experimental"
    devices={['webgpu-max']}
    template={GPUTraceViewerApp}
    config={exampleConfig}
    {...props}
  />
);

export const GPUGraphExplorerExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="gpu-graph-explorer"
    title="GPU Graph Interactive Graph Explorer"
    subtitle="GPU-native topology, analytics, selection, and progressive force layout"
    directory="experimental"
    devices={['webgpu']}
    template={GPUGraphExplorerApp}
    config={exampleConfig}
    {...props}
  />
);

export const GPUTraceSceneExample: React.FC = props => (
  <LumaExample
    id="gpu-trace-scene"
    title="GPU Scene Trace Explorer"
    directory="experimental"
    devices={['webgpu-max']}
    template={GPUTraceSceneApp}
    config={exampleConfig}
    {...props}
  />
);

export const GPUSceneGraphExample: React.FC = props => (
  <LumaExample
    id="gpu-scene-graph"
    title="GPU Scene Graph Explorer"
    directory="experimental"
    devices={['webgpu-max']}
    template={GPUSceneGraphApp}
    config={exampleConfig}
    {...props}
  />
);

export const GPUFrustumCullingExample: React.FC = props => (
  <LumaExample
    id="gpu-frustum-culling"
    title="GPU Frustum Culling"
    directory="experimental"
    devices={['webgpu']}
    template={GPUFrustumCullingApp}
    config={exampleConfig}
    {...props}
  />
);

export const ArrowMeshGeometryExample: React.FC = props => (
  <LumaExample
    id="arrow-mesh-geometry"
    title="Matrices"
    directory="arrow"
    template={ArrowMeshGeometryApp}
    config={exampleConfig}
    {...props}
  />
);

export const ArrowParticlesExample: React.FC = props => (
  <LumaExample
    id="arrow-particles"
    title="Particles"
    directory="arrow"
    template={ArrowParticlesApp}
    config={exampleConfig}
    {...props}
  />
);

// API Examples

export const AnimationExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="animation"
    directory="api"
    template={AnimationApp}
    config={exampleConfig}
    showStats
    {...props}
  />
);

export const BlendingExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="blending"
    title="Blending"
    directory="api"
    template={BlendingApp}
    config={exampleConfig}
    devices={['webgpu', 'webgl2']}
    {...props}
  />
);

export const CubemapExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="cubemap"
    title="Texture Cube"
    directory="api"
    template={CubemapApp}
    config={exampleConfig}
    {...props}
  />
);

export const MultiCanvasExample: React.FC<WebsiteExampleProps> = props => {
  const deviceType = useStore(store => store.deviceType);
  const presentationDevice = useStore(store => store.presentationDevice);
  const presentationDeviceError = useStore(store => store.presentationDeviceError);
  const exampleDisplayProps: ExampleDisplayProps = {
    className: props.className,
    embedded: props.embedded,
    embeddedHeight: props.embeddedHeight,
    style: props.style
  };

  if (presentationDeviceError) {
    return (
      <ExamplePage {...exampleDisplayProps}>
        <div>{presentationDeviceError}</div>
      </ExamplePage>
    );
  }

  return deviceType && presentationDevice ? (
    <ReactExample
      component={MultiCanvasApp}
      componentProps={{deviceType: getExampleDeviceType(presentationDevice), presentationDevice}}
      showStats={props.showStats}
      {...exampleDisplayProps}
    />
  ) : (
    <ExamplePage {...exampleDisplayProps}>
      <div>Initializing device...</div>
    </ExamplePage>
  );
};

export const FP64Example: React.FC<WebsiteExampleProps> = ({
  autoStart = false,
  embeddedHeight,
  ...props
}) => {
  const [isBenchmarkRequested, setIsBenchmarkRequested] = useState(!props.embedded || autoStart);
  const {module, errorMessage} = useDeferredExampleModule(loadFP64Example, isBenchmarkRequested);
  const deviceType = useStore(store => store.deviceType);
  const presentationDevice = useStore(store => store.presentationDevice);
  const presentationDeviceError = useStore(store => store.presentationDeviceError);
  const previewImageUrl = useBaseUrl('/images/examples/experimental/fp64.jpg');

  if (!isBenchmarkRequested) {
    return (
      <ExamplePage
        embedded
        embeddedHeight={300}
        style={{
          border: '1px solid rgba(148, 163, 184, 0.24)',
          borderRadius: 12,
          background: `linear-gradient(90deg, rgba(4, 10, 20, 0.97), rgba(4, 10, 20, 0.68)), url("${previewImageUrl}") center / cover`,
          margin: '1.5rem 0'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            alignContent: 'center',
            justifyItems: 'start',
            gap: 12,
            padding: 28,
            color: '#f8fafc'
          }}
        >
          <span
            style={{
              color: '#a5b4fc',
              fontSize: 11,
              fontWeight: 750,
              letterSpacing: '0.12em',
              textTransform: 'uppercase'
            }}
          >
            Optional interactive GPU benchmark
          </span>
          <strong style={{fontSize: 22, lineHeight: 1.2}}>
            Explore floating-point precision.
          </strong>
          <span style={{maxWidth: 460, color: '#cbd5e1', fontSize: 14, lineHeight: 1.6}}>
            Compare Mandelbrot rendering and compute precision when you are ready to use your GPU.
          </span>
          <button
            onClick={() => setIsBenchmarkRequested(true)}
            style={{
              border: 0,
              borderRadius: 999,
              background: '#e2e8f0',
              color: '#0f172a',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              padding: '10px 16px'
            }}
            type="button"
          >
            Launch precision benchmark →
          </button>
        </div>
      </ExamplePage>
    );
  }

  if (presentationDeviceError) {
    return <div>{presentationDeviceError}</div>;
  }

  if (errorMessage || !module) {
    return (
      <DeferredGPUExampleStatus
        {...props}
        title="64-bit GPU Precision"
        description="Loading the interactive Mandelbrot and floating-point compute benchmark."
        errorMessage={errorMessage}
        embeddedHeight={embeddedHeight ?? (props.embedded ? 720 : undefined)}
      />
    );
  }

  return deviceType && presentationDevice ? (
    <ReactExample
      {...props}
      component={module.default}
      componentProps={{presentationDevice}}
      embeddedHeight={embeddedHeight ?? (props.embedded ? 720 : undefined)}
      showStats={false}
      style={{overflow: 'auto', ...props.style}}
    />
  ) : (
    <ExamplePage
      {...props}
      embeddedHeight={embeddedHeight ?? (props.embedded ? 720 : undefined)}
    >
      <div>Initializing device...</div>
    </ExamplePage>
  );
};

export const Texture3DExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="texture-3d"
    directory="api-3d"
    sourceDirectory="api"
    template={Texture3DApp}
    config={exampleConfig}
    {...props}
  />
);

export const TextureSamplingExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="texture-sampling"
    title="Texture Sampling"
    directory="api"
    template={TextureSamplingApp}
    config={exampleConfig}
    devices={['webgpu', 'webgl2']}
    {...props}
  />
);

export const TextureTesterExample: React.FC<WebsiteExampleProps> = ({
  embeddedHeight,
  ...props
}) => {
  const deviceType = useStore(store => store.deviceType);
  const presentationDevice = useStore(store => store.presentationDevice);
  const presentationDeviceError = useStore(store => store.presentationDeviceError);

  return (
    <ExamplePage
      {...props}
      className={
        props.className ||
        (props.embedded ? 'docs-embedded-example docs-embedded-example--content' : undefined)
      }
      embeddedHeight={embeddedHeight ?? (props.embedded ? 'auto' : undefined)}
      style={{
        width: '100%',
        height: props.embedded ? 'auto' : '100%',
        overflowX: 'hidden',
        overflowY: props.embedded ? 'visible' : 'auto',
        ...props.style
      }}
    >
      {props.embedded ? (
        <div className="texture-tester-embedded-header">
          <div>
            <strong>Compressed texture support on this device</strong>
            <div>Hover a preview for upload, format, and memory details.</div>
          </div>
          <DeviceTabs
            devices={['webgpu', 'webgl2']}
            style={{maxWidth: '100%', overflowX: 'auto'}}
          />
        </div>
      ) : null}
      {presentationDeviceError ? (
        <div>{presentationDeviceError}</div>
      ) : deviceType && presentationDevice ? (
        <TextureTesterApp
          compact={props.embedded}
          deviceType={getExampleDeviceType(presentationDevice)}
          presentationDevice={presentationDevice}
        />
      ) : (
        <div>Initializing device...</div>
      )}
    </ExamplePage>
  );
};

export const RenderBundlesExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="render-bundles"
    title="Render Bundles"
    directory="api"
    template={RenderBundlesApp}
    config={exampleConfig}
    devices={['webgpu']}
    showStats
    {...props}
  />
);

// Integration Examples

export const ExternalContextExample: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let exampleHandle: ExternalWebGLContextHandle | null = null;

    initializeExternalWebGLContext({container})
      .then(instance => {
        exampleHandle = instance;
      })
      .catch(caughtError => {
        logError('External WebGL context example failed', caughtError);
        setError(getErrorMessage(caughtError));
      });

    return () => {
      exampleHandle?.destroy();
    };
  }, []);

  return (
    <ExamplePage style={{minHeight: '640px'}}>
      <div
        className="integration-example-page"
        style={{position: 'relative', width: '100%', minHeight: '640px'}}
      >
        <div ref={containerRef} style={{position: 'absolute', inset: 0}} />
      </div>
      {error ? <p style={{color: '#b00020', marginTop: 12}}>{error}</p> : null}
    </ExamplePage>
  );
};

export const ReactStrictModeExample: React.FC = () => {
  const [showCube, setShowCube] = useState(true);
  const [mountCount, setMountCount] = useState(0);

  const toggleCube = () => {
    setShowCube(previousValue => {
      if (!previousValue) {
        setMountCount(previousCount => previousCount + 1);
      }
      return !previousValue;
    });
  };

  return (
    <ExamplePage style={{minHeight: '640px'}}>
      <ExampleHeader
        title="React Strict Mode"
        sourcePath="examples/integrations/hello-react"
        devices={['webgl2']}
      >
        <div style={{display: 'grid', gap: 12}}>
          <div>
            Verify luma.gl device and animation-loop cleanup under React <code>StrictMode</code>{' '}
            remounting.
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap'}}>
            <button
              type="button"
              onClick={toggleCube}
              style={{
                padding: '8px 14px',
                fontSize: 14,
                backgroundColor: showCube ? '#dc3545' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              {showCube ? 'Unmount Cube' : 'Mount Cube'}
            </button>
            <span>
              Mount count: <strong>{mountCount}</strong>
            </span>
          </div>
        </div>
      </ExampleHeader>
      <div className="integration-example-page" style={{width: '100%', minHeight: '640px'}}>
        <React.StrictMode>
          <HelloReactApp
            showControls={false}
            showCube={showCube}
            mountCount={mountCount}
            onToggleCube={toggleCube}
          />
        </React.StrictMode>
      </div>
    </ExamplePage>
  );
};

// Tutorial Examples

export const HelloTriangleExample: React.FC = props => (
  <LumaExample
    id="hello-triangle"
    directory="tutorials"
    template={HelloTriangleApp}
    config={exampleConfig}
    showStats={false}
    stackBlitz
    {...props}
  />
);

function getExampleDeviceType(device: {type: string}): 'webgl' | 'webgpu' {
  return device.type === 'webgpu' ? 'webgpu' : 'webgl';
}

export const HelloTriangleGeometryExample: React.FC = props => (
  <LumaExample
    id="hello-triangle-geometry"
    directory="tutorials"
    template={HelloTriangleGeometryApp}
    config={exampleConfig}
    showStats={false}
    stackBlitz
    {...props}
  />
);

export const HelloCubeExample: React.FC = props => (
  <LumaExample
    id="hello-cube"
    directory="tutorials"
    template={HelloCubeApp}
    config={exampleConfig}
    showStats={false}
    stackBlitz
    {...props}
  />
);

export const InstancedCubesExample: React.FC = props => (
  <LumaExample
    id="instanced-cubes"
    directory="tutorials"
    template={InstancedCubesApp}
    config={exampleConfig}
    showStats={false}
    stackBlitz
    {...props}
  />
);

export const TwoCubesExample: React.FC = props => (
  <LumaExample
    id="two-cubes"
    directory="tutorials"
    template={TwoCubesApp}
    config={exampleConfig}
    showStats={false}
    stackBlitz
    {...props}
  />
);

export const LightingExample: React.FC = props => (
  <LumaExample
    id="lighting"
    directory="tutorials"
    template={LightingApp}
    config={exampleConfig}
    showStats={false}
    stackBlitz
    {...props}
  />
);

export const HelloGLTFExample: React.FC = props => (
  <LumaExample
    id="hello-gltf"
    directory="tutorials"
    template={HelloGLTFApp}
    config={exampleConfig}
    showStats={false}
    stackBlitz
    {...props}
  />
);

export const HelloInstancingExample: React.FC = props => (
  <LumaExample
    id="hello-instancing"
    directory="tutorials"
    template={HelloInstancingApp}
    config={exampleConfig}
    showStats={false}
    stackBlitz
    {...props}
  />
);

export const ShaderHooksExample: React.FC = props => (
  <LumaExample
    id="shader-hooks"
    directory="tutorials"
    template={ShaderHooksApp}
    config={exampleConfig}
    showStats={false}
    stackBlitz
    {...props}
  />
);

export const ShaderPluginsExample: React.FC = props => (
  <LumaExample
    id="shader-plugins"
    directory="tutorials"
    template={ShaderPluginsApp}
    config={exampleConfig}
    showStats={false}
    stackBlitz
    {...props}
  />
);

export const ShaderModulesExample: React.FC = props => (
  <LumaExample
    id="shader-modules"
    directory="tutorials"
    template={ShaderModulesApp}
    config={exampleConfig}
    showStats={false}
    stackBlitz
    {...props}
  />
);

export const TransformFeedbackExample: React.FC = props => (
  <LumaExample
    id="transform-feedback"
    directory="tutorials"
    template={TransformFeedbackApp}
    config={exampleConfig}
    showStats={false}
    stackBlitz
    devices={['webgl2']}
    {...props}
  />
);

export const TransformExample: React.FC = props => (
  <LumaExample
    id="transform"
    directory="tutorials"
    template={TransformApp}
    config={exampleConfig}
    showStats={false}
    stackBlitz
    devices={['webgl2']}
    {...props}
  />
);
