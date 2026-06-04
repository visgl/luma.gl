//

import React, {useEffect, useRef, useState} from 'react';
import {ExampleHeader, ExamplePage, LumaExample, ReactExample, useStore} from './react-luma';

import AnimationApp from '../../examples/api/animation/app';
import CubemapApp from '../../examples/api/cubemap/app';
import ArrowDggsPolygonsApp from '../../examples/arrow/arrow-dggs-polygons/app';
import ArrowColumnRendererApp from '../../examples/arrow/arrow-columns/app';
import ArrowMeshGeometryApp from '../../examples/arrow/arrow-mesh-geometry/app';
import ArrowGeoArrowApp from '../../examples/arrow/arrow-geoarrow/app';
import ArrowLinesApp from '../../examples/arrow/arrow-lines/app';
import ArrowFloat64PrecisionApp from '../../examples/arrow/arrow-float64-precision/app';
import ArrowPointRendererApp from '../../examples/arrow/arrow-points/app';
import ArrowPolygonRendererApp from '../../examples/arrow/arrow-polygons/app';
import BloomApp from '../../examples/experimental/bloom/app';
import FP64App from '../../examples/experimental/fp64/app';
import GPT2App from '../../examples/experimental/gpt-2/app';
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

// import PerformanceApp from '../../examples/performance/stress-test/app';

// import DOFApp from '../../examples/showcase/dof/app';
// import GeospatialApp from '../../examples/showcase/geospatial/app';
import GLTFApp from '../../examples/showcase/gltf/app';
import ArrowInstancingApp from '../../examples/arrow/arrow-instancing/app';
import ArrowTemporalStarfieldApp from '../../examples/arrow/arrow-temporal-starfield/app';
import ArrowTimeColumnsApp from '../../examples/arrow/arrow-time-columns/app';
import ArrowText2DApp from '../../examples/arrow/arrow-text-2d/app';
import ArrowText3DApp from '../../examples/arrow/arrow-text-3d/app';
import InstancingApp from '../../examples/showcase/instancing/app';
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
import ShaderModulesApp from '../../examples/tutorials/shader-modules/app';
import TransformFeedbackApp from '../../examples/tutorials/transform-feedback/app';
import TransformApp from '../../examples/tutorials/transform/app';

const exampleConfig = {};
const TEXT_3D_COLOR_STORAGE_KEY = 'text-3d-crawl-color';

function getInitialText3DColor(): 'copper' | 'yellow' {
  if (typeof window === 'undefined') {
    return 'copper';
  }

  const searchParams = new URLSearchParams(window.location.search);
  const crawlColor = searchParams.get('crawlColor') ?? window.localStorage.getItem(TEXT_3D_COLOR_STORAGE_KEY);
  return crawlColor === 'yellow' ? 'yellow' : 'copper';
}

const Text3DControls: React.FC = () => {
  const [crawlColor, setCrawlColor] = useState<'copper' | 'yellow'>(getInitialText3DColor);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextColor = event.target.value === 'yellow' ? 'yellow' : 'copper';
    setCrawlColor(nextColor);

    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (nextColor === 'yellow') {
        searchParams.set('crawlColor', 'yellow');
      } else {
        searchParams.delete('crawlColor');
      }

      const search = searchParams.toString();
      const nextUrl = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`;
      window.history.replaceState({}, '', nextUrl);
      window.localStorage.setItem(TEXT_3D_COLOR_STORAGE_KEY, nextColor);
    }
  };

  return (
    <label style={{display: 'flex', alignItems: 'center', gap: 8, marginTop: 12}}>
      <span style={{fontSize: 14, fontWeight: 600}}>Crawl color</span>
      <select value={crawlColor} onChange={handleChange}>
        <option value="copper">Copper</option>
        <option value="yellow">Yellow</option>
      </select>
    </label>
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

export const ArrowText3DExample: React.FC = props => (
  <LumaExample
    id="arrow-text-3d"
    title="3D Text"
    directory="arrow"
    template={ArrowText3DApp}
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
    title="Float64 Precision"
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

  useEffect(() => {
    let handle: GPGPUShowcaseHandle | null = null;
    try {
      handle = initializeGPGPUShowcase();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      logError('Failed to initialize GPGPU example', error);
    }

    return () => {
      handle?.destroy();
    };
  }, []);

  return (
    <ExamplePage style={{background: '#f7f8fb', overflow: 'hidden'}}>
      <style>{GPGPU_EXAMPLE_STYLE}</style>
      <main id="app" className="gpgpu-showcase">
        <h1>@luma.gl/gpgpu table evaluator showcase</h1>
        <p className="subtitle">
          Arrow-backed source columns are extracted as typed-array views and wrapped in
          GPUTableEvaluator inputs.
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
    headerControls={<Text3DControls />}
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
    <ReactExample component={MultiCanvasApp} componentProps={{deviceType, presentationDevice}} />
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
        <TextureTesterApp deviceType={deviceType} presentationDevice={presentationDevice} />
      ) : (
        <div>Initializing device...</div>
      )}
    </ExamplePage>
  );
};

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
    {...props}
  />
);

export const HelloTriangleGeometryExample: React.FC = props => (
  <LumaExample
    id="hello-triangle-geometry"
    directory="tutorials"
    template={HelloTriangleGeometryApp}
    config={exampleConfig}
    showStats={false}
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
    devices={['webgl2']}
    {...props}
  />
);
