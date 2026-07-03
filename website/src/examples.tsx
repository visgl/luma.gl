//

import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  DeviceTabs,
  ExampleHeader,
  ExamplePage,
  InfoBox,
  LumaExample,
  ReactExample,
  useStore
} from './react-luma';

import {makeHtmlCustomPanel} from '../../examples/example-panels';
import AnimationApp from '../../examples/api/animation/app';
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
import GPUTraceViewerApp from '../../examples/experimental/gpu-trace-viewer/app';
import {
  initializeGPUSortExample,
  type GPUSortExampleHandle
} from '../../examples/experimental/gpu-sort/src/app';
import {
  initializeGPUDataAnalysisExample,
  type GPUDataAnalysisExampleHandle
} from '../../examples/experimental/gpu-data-analysis/src/app';
import FP64App from '../../examples/experimental/fp64/app';
import GPT2App from '../../examples/experimental/gpt-2/app';
import VideoTextureApp from '../../examples/experimental/video-texture/app';
import WebXRKaleidoscopeApp from '../../examples/experimental/webxr-kaleidoscope/app';
import {
  initializeGPGPUShowcase,
  type GPGPUShowcaseHandle
} from '../../examples/v10/gpgpu/src/app';
import ArrowParticlesApp from '../../examples/arrow/arrow-particles/app';
import MultiCanvasApp from '../../examples/api/multi-canvas/app';
import Texture3DApp from '../../examples/api/texture-3d/app';
import TextureTesterApp from '../../examples/api/texture-tester/app';
import initializeExternalWebGLContext, {
  ExternalWebGLContextHandle
} from '../../examples/integrations/external-context/app';
import HelloReactApp from '../../examples/integrations/hello-react/app';
import {getErrorMessage, logError} from './react-luma/utils/error-utils';
import DOFApp from '../../examples/showcase/dof/app';
import AdvancedEffectsApp from '../../examples/experimental/advanced-effects/app';
import ABufferApp from '../../examples/experimental/a-buffer/app';

// import PerformanceApp from '../../examples/performance/stress-test/app';

// import DOFApp from '../../examples/showcase/dof/app';
// import GeospatialApp from '../../examples/showcase/geospatial/app';
import GLTFApp from '../../examples/showcase/gltf/app';
import ArrowInstancingApp from '../../examples/arrow/arrow-instancing/app';
import ArrowTemporalStarfieldApp from '../../examples/arrow/arrow-temporal-starfield/app';
import ArrowTimeColumnsApp from '../../examples/arrow/arrow-time-columns/app';
import ArrowText2DApp from '../../examples/arrow/arrow-text-2d/app';
import ArrowTextSpaceCrawlApp from '../../examples/arrow/arrow-text-space-crawl/app';
import InstancingApp from '../../examples/showcase/instancing/app';
import RenderBundlesApp from '../../examples/api/render-bundles/app';
import Text3DApp from '../../examples/experimental/text-3d/app';
import PersistenceApp from '../../examples/showcase/persistence/app';
import PostprocessingApp from '../../examples/showcase/postprocessing/app';
import GlobeApp from '../../examples/showcase/globe/app';
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

const exampleConfig = {};

type DeckExampleHandle = {
  finalize: () => void;
};
type CreateDeckExample = (parent: HTMLDivElement) =>
  | DeckExampleHandle
  | Promise<DeckExampleHandle>;
type DeckArrowLayerPanelProps = {
  id: string;
  title: string;
  description: string;
  metrics: readonly {label: string; value: string}[];
};

function escapeDeckArrowPanelHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function makeDeckArrowLayerInfoPanel({
  id,
  title,
  description,
  metrics
}: DeckArrowLayerPanelProps) {
  const metricHtml = metrics
    .map(
      metric => `
        <div style="padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
          <div style="color: #64748b; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;">
            ${escapeDeckArrowPanelHtml(metric.label)}
          </div>
          <div style="margin-top: 3px; color: #0f172a; font-size: 13px; font-weight: 700;">
            ${escapeDeckArrowPanelHtml(metric.value)}
          </div>
        </div>`
    )
    .join('');

  return makeHtmlCustomPanel({
    id: `${id}-info`,
    title,
    html: `
      <p style="margin: 0 0 12px; color: #475569; font-size: 13px; line-height: 1.5;">
        ${escapeDeckArrowPanelHtml(description)}
      </p>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
        ${metricHtml}
      </div>`
  });
}

function DeckArrowLayerPanel({
  id,
  title,
  description,
  metrics
}: DeckArrowLayerPanelProps) {
  const panel = useMemo(
    () => makeDeckArrowLayerInfoPanel({id, title, description, metrics}),
    [description, id, metrics, title]
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
      <InfoBox
        id={id}
        title={title}
        sourcePath={`examples/deck/${id}/app.ts`}
        style={{pointerEvents: 'auto'}}
        panel={panel}
      />
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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let isFinalized = false;
    let deck: DeckExampleHandle | null = null;
    void Promise.resolve(createDeck(container)).then(createdDeck => {
      if (isFinalized) {
        createdDeck.finalize();
        return;
      }
      deck = createdDeck;
    });

    return () => {
      isFinalized = true;
      deck?.finalize();
    };
  }, [createDeck]);

  return (
    <>
      <div ref={containerRef} style={{position: 'absolute', inset: 0, overflow: 'hidden'}} />
      <DeckArrowLayerPanel {...panel} />
    </>
  );
}

export const DeckArrowPathLayerExample: React.FC = () => (
  <ReactExample
    component={DeckArrowLayerCanvas}
    componentProps={{
      createDeck: createArrowPathLayerDeck,
      panel: {
        id: 'arrow-path-layer',
        title: 'Arrow Path Layer',
        description:
          'Variable-length Arrow path columns become GPUVector-backed segment buffers without Deck attribute generation.',
        metrics: [
          {label: 'Rows', value: '240 paths'},
          {label: 'Model', value: 'Attribute'},
          {label: 'Attributes', value: 'GPUVector'}
        ]
      }
    }}
    showStats={false}
  />
);

export const DeckArrowPolygonLayerExample: React.FC = () => (
  <ReactExample
    component={DeckArrowLayerCanvas}
    componentProps={{
      createDeck: createArrowPolygonLayerDeck,
      panel: {
        id: 'arrow-polygon-layer',
        title: 'Arrow Polygon Layer',
        description:
          'Streamed Arrow polygon rows retain GPUVector-backed geometry and styling through tessellation and draw.',
        metrics: [
          {label: 'Rows', value: '10k stream'},
          {label: 'Geometry', value: 'Tessellated'},
          {label: 'Attributes', value: 'GPUVector'}
        ]
      }
    }}
    showStats={false}
  />
);

export const DeckArrowTextLayerExample: React.FC = () => (
  <ReactExample
    component={DeckArrowLayerCanvas}
    componentProps={{
      createDeck: createArrowTextLayerDeck,
      panel: {
        id: 'arrow-text-layer',
        title: 'Arrow Text Layer',
        description:
          'Arrow string and style columns stay columnar while the text renderer prepares GPUVector glyph inputs.',
        metrics: [
          {label: 'Rows', value: '800 labels'},
          {label: 'Model', value: 'Attribute'},
          {label: 'Attributes', value: 'GPUVector'}
        ]
      }
    }}
    showStats={false}
  />
);

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

export const GLTFExample: React.FC = props => (
  <LumaExample
    id="gltf"
    title="glTF"
    directory="showcase"
    template={GLTFApp}
    config={exampleConfig}
    {...props}
  />
);

export const InstancingExample: React.FC = props => (
  <LumaExample
    id="instancing"
    directory="showcase"
    template={InstancingApp}
    config={exampleConfig}
    {...props}
  />
);

export const ArrowInstancingExample: React.FC = props => (
  <LumaExample
    id="arrow-instancing"
    title="Instancing"
    directory="arrow"
    template={ArrowInstancingApp}
    config={exampleConfig}
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

export const ArrowTextSpaceCrawlExample: React.FC = props => (
  <LumaExample
    id="arrow-text-space-crawl"
    title="Arrow Space Crawl"
    directory="arrow"
    template={ArrowTextSpaceCrawlApp}
    config={exampleConfig}
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

export const ArrowGeoArrowExample: React.FC = props => (
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
export const GPUSortExample: React.FC = () => {
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
    <ExamplePage style={{background: '#f7f8fb', overflow: 'hidden'}}>
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
export const GPUDataAnalysisExample: React.FC = () => {
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
    <ExamplePage style={{background: '#f6f8fb', overflow: 'hidden'}}>
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

export const Text3DExample: React.FC = props => (
  <LumaExample
    id="text-3d"
    title="3D Space Crawl"
    directory="experimental"
    template={Text3DApp}
    config={exampleConfig}
    {...props}
  />
);

export const PersistenceExample: React.FC = props => (
  <LumaExample
    id="persistence"
    directory="showcase"
    template={PersistenceApp}
    config={exampleConfig}
    {...props}
  />
);

export const PostprocessingExample: React.FC = props => (
  <LumaExample
    id="postprocessing"
    directory="showcase"
    template={PostprocessingApp}
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
    {...props}
  />
);

export const DOFExample: React.FC = props => (
  <LumaExample
    id="dof"
    title="Depth of Field"
    directory="showcase"
    template={DOFApp}
    config={exampleConfig}
    {...props}
  />
);

export const AdvancedEffectsExample: React.FC = props => (
  <LumaExample
    id="advanced-effects"
    title="Advanced Effects: Visualization City"
    directory="experimental"
    template={AdvancedEffectsApp}
    config={exampleConfig}
    devices={['webgpu']}
    {...props}
  />
);

export const OITExample: React.FC = props => (
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

export const BloomExample: React.FC = props => (
  <LumaExample
    id="bloom"
    title="Bloom"
    directory="experimental"
    template={BloomApp}
    config={exampleConfig}
    {...props}
  />
);

export const VideoTextureExample: React.FC = props => {
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
      directory="experimental"
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

  const [xrStatus, setXRStatus] = useState<XRStatus>('idle');
  const [xrMode, setXRMode] = useState<XRMode | null>(null);
  const [xrError, setXRError] = useState<string | null>(null);
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
    border: '1px solid #0f766e',
    borderRadius: 999,
    background: xrStatus === 'live' && xrMode === sessionMode ? '#ccfbf1' : '#fff',
    color: '#0f172a',
    cursor: xrStatus === 'pending' ? 'default' : 'pointer',
    font: '600 14px system-ui, sans-serif',
    padding: '8px 12px'
  });

  return (
    <LumaExample
      id="webxr-kaleidoscope"
      title="WebXR Kaleidoscope"
      directory="experimental"
      devices={['webgl2']}
      template={WebXRKaleidoscopeApp}
      config={exampleConfig}
      headerControls={
        <div style={{display: 'flex', alignItems: 'center', gap: 10, marginTop: 12}}>
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
          {xrStatus === 'pending' ? (
            <span>Requesting {xrMode === 'immersive-ar' ? 'AR' : 'VR'} session</span>
          ) : null}
          {xrError ? <span>{xrError}</span> : null}
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

export const HTMLUIPrismExample: React.FC = props => (
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
    title="GPU Command Graph Trace Viewer"
    directory="experimental"
    devices={['webgpu']}
    template={GPUTraceViewerApp}
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

export const AnimationExample: React.FC = props => (
  <LumaExample
    id="animation"
    directory="api"
    template={AnimationApp}
    config={exampleConfig}
    showStats
    {...props}
  />
);

export const CubemapExample: React.FC = props => (
  <LumaExample
    id="cubemap"
    title="Texture Cube"
    directory="api"
    template={CubemapApp}
    config={exampleConfig}
    {...props}
  />
);

export const MultiCanvasExample: React.FC = () => {
  const deviceType = useStore(store => store.deviceType);
  const presentationDevice = useStore(store => store.presentationDevice);
  const presentationDeviceError = useStore(store => store.presentationDeviceError);

  if (presentationDeviceError) {
    return <div>{presentationDeviceError}</div>;
  }

  return deviceType && presentationDevice ? (
    <ReactExample
      component={MultiCanvasApp}
      componentProps={{deviceType: getExampleDeviceType(presentationDevice), presentationDevice}}
    />
  ) : (
    <ExamplePage>
      <div>Initializing device...</div>
    </ExamplePage>
  );
};

export const FP64Example: React.FC = () => {
  const deviceType = useStore(store => store.deviceType);
  const presentationDevice = useStore(store => store.presentationDevice);
  const presentationDeviceError = useStore(store => store.presentationDeviceError);

  if (presentationDeviceError) {
    return <div>{presentationDeviceError}</div>;
  }

  return deviceType && presentationDevice ? (
    <ReactExample component={FP64App} componentProps={{presentationDevice}} showStats={false} />
  ) : (
    <ExamplePage>
      <div>Initializing device...</div>
    </ExamplePage>
  );
};

export const Texture3DExample: React.FC = props => (
  <LumaExample
    id="texture-3d"
    directory="api-3d"
    sourceDirectory="api"
    template={Texture3DApp}
    config={exampleConfig}
    {...props}
  />
);

export const TextureTesterExample: React.FC = () => {
  const deviceType = useStore(store => store.deviceType);
  const presentationDevice = useStore(store => store.presentationDevice);
  const presentationDeviceError = useStore(store => store.presentationDeviceError);

  return (
    <ExamplePage
      style={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}
    >
      {presentationDeviceError ? (
        <div>{presentationDeviceError}</div>
      ) : deviceType && presentationDevice ? (
        <TextureTesterApp
          deviceType={getExampleDeviceType(presentationDevice)}
          presentationDevice={presentationDevice}
        />
      ) : (
        <div>Initializing device...</div>
      )}
    </ExamplePage>
  );
};

export const RenderBundlesExample: React.FC<{embedded?: boolean}> = ({embedded = false}) => (
  <LumaExample
    className={embedded ? 'render-bundles-embedded-example' : undefined}
    id="render-bundles"
    title="Render Bundles"
    directory="api"
    template={RenderBundlesApp}
    config={exampleConfig}
    devices={['webgpu']}
    showStats
    style={
      embedded
        ? {
            boxSizing: 'border-box',
            height: '560px',
            minHeight: '560px',
            margin: '1rem 0 2rem',
            border: '1px solid var(--ifm-color-emphasis-300)',
            borderRadius: '8px'
          }
        : undefined
    }
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
