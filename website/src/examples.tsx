//

import React, {useEffect, useRef, useState} from 'react';
import {LumaExample} from './react-luma';

import AnimationApp from '../../examples/api/animation/app';
import CubemapApp from '../../examples/api/cubemap/app';
import Texture3DApp from '../../examples/api/texture-3d/app';
import initializeExternalWebGLContext, {
  ExternalWebGLContextHandle
} from '../../examples/api/external-webgl-context/app';

// import PerformanceApp from '../../examples/performance/stress-test/app';

// import DOFApp from '../../examples/showcase/dof/app';
// import GeospatialApp from '../../examples/showcase/geospatial/app';
// import GLTFApp from '../../examples/showcase/gltf/app';
import InstancingApp from '../../examples/showcase/instancing/app';
import PersistenceApp from '../../examples/showcase/persistence/app';
import PostprocessingApp from '../../examples/showcase/postprocessing/app';
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

// Showcase Examples

export const InstancingExample: React.FC = props => (
  <LumaExample
    id="instancing"
    directory="showcase"
    template={InstancingApp}
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

// API Examples

export const AnimationExample: React.FC = props => (
  <LumaExample
    id="animation"
    directory="api"
    template={AnimationApp}
    config={exampleConfig}
    {...props}
  />
);

export const CubemapExample: React.FC = props => (
  <LumaExample
    id="cubemap"
    directory="api"
    template={CubemapApp}
    config={exampleConfig}
    {...props}
  />
);

export const Texture3DExample: React.FC = props => (
  <LumaExample
    id="texture-3d"
    directory="api-3d"
    template={Texture3DApp}
    config={exampleConfig}
    {...props}
  />
);

export const ExternalWebGLContextExample: React.FC = () => {
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
        setError(caughtError.message);
      });

    return () => {
      exampleHandle?.destroy();
    };
  }, []);

  return (
    <div style={{position: 'relative', width: '100%', minHeight: '640px'}}>
      <div ref={containerRef} style={{position: 'absolute', inset: 0}} />
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          maxWidth: 320,
          padding: 12,
          background: 'rgba(255, 255, 255, 0.92)',
          borderRadius: 8,
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)'
        }}
      >
        <h3>External WebGL Context</h3>
        <p style={{marginTop: 0}}>
          This example attaches a <code>WebGLDevice</code> to the WebGL2 context created by Mapbox GL JS and
          renders a luma.gl overlay through the Mapbox render loop.
        </p>
        <p style={{marginBottom: 0}}>
          The map uses CARTO basemaps that do not require an access token. The overlay uses the map view-projection matrix so it
          stays anchored in world space.
        </p>
        {error && <p style={{color: '#b00020'}}>Error: {error}</p>}
      </div>
    </div>
  );
};

// Tutorial Examples

export const HelloTriangleExample: React.FC = props => (
  <LumaExample
    id="hello-triangle"
    directory="tutorials"
    template={HelloTriangleApp}
    config={exampleConfig}
    {...props}
  />
);

export const HelloTriangleGeometryExample: React.FC = props => (
  <LumaExample
    id="hello-triangle-geometry"
    directory="tutorials"
    template={HelloTriangleGeometryApp}
    config={exampleConfig}
    {...props}
  />
);

export const HelloCubeExample: React.FC = props => (
  <LumaExample
    id="hello-cube"
    directory="tutorials"
    template={HelloCubeApp}
    config={exampleConfig}
    {...props}
  />
);

export const InstancedCubesExample: React.FC = props => (
  <LumaExample
    id="instanced-cubes"
    directory="tutorials"
    template={InstancedCubesApp}
    config={exampleConfig}
    {...props}
  />
);

export const TwoCubesExample: React.FC = props => (
  <LumaExample
    id="two-cubes"
    directory="tutorials"
    template={TwoCubesApp}
    config={exampleConfig}
    {...props}
  />
);

export const LightingExample: React.FC = props => (
  <LumaExample
    id="lighting"
    directory="tutorials"
    template={LightingApp}
    config={exampleConfig}
    {...props}
  />
);

export const HelloGLTFExample: React.FC = props => (
  <LumaExample
    id="hello-gltf"
    directory="tutorials"
    template={HelloGLTFApp}
    config={exampleConfig}
    {...props}
  />
);

export const HelloInstancingExample: React.FC = props => (
  <LumaExample
    id="hello-instancing"
    directory="tutorials"
    template={HelloInstancingApp}
    config={exampleConfig}
    {...props}
  />
);

export const ShaderHooksExample: React.FC = props => (
  <LumaExample
    id="shader-hooks"
    directory="tutorials"
    template={ShaderHooksApp}
    config={exampleConfig}
    {...props}
  />
);

export const ShaderModulesExample: React.FC = props => (
  <LumaExample
    id="shader-modules"
    directory="tutorials"
    template={ShaderModulesApp}
    config={exampleConfig}
    {...props}
  />
);

export const TransformFeedbackExample: React.FC = props => (
  <LumaExample
    id="transform-feedback"
    directory="tutorials"
    template={TransformFeedbackApp}
    config={exampleConfig}
    {...props}
  />
);

export const TransformExample: React.FC = props => (
  <LumaExample
    id="transform"
    directory="tutorials"
    template={TransformApp}
    config={exampleConfig}
    {...props}
  />
);

