//

import React, {useEffect, useRef, useState} from 'react';
import {ExampleHeader, ExamplePage, LumaExample, ReactExample, useStore} from './react-luma';

import AnimationApp from '../../examples/api/animation/app';
import CubemapApp from '../../examples/api/cubemap/app';
import BloomApp from '../../examples/experimental/bloom/app';
import FP64App from '../../examples/experimental/fp64/app';
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
import InstancingApp from '../../examples/showcase/instancing/app';
import Text3DApp from '../../examples/showcase/text-3d/app';
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

export const Text3DExample: React.FC = props => (
  <LumaExample
    id="text-3d"
    title="3D Space Crawl"
    directory="showcase"
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
    showHeader={false}
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
    {...props}
  />
);
