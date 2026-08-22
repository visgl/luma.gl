//

import React, {useEffect, useMemo, useRef, useState, useSyncExternalStore} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {
  DeviceTabs,
  ExampleHeader,
  ExamplePage,
  LumaExample,
  ReactExample,
  type ExampleDisplayProps,
  type LumaExampleProps,
  useStore
} from './react-luma';
import type {AnimationProps} from '@luma.gl/engine';
import type {GPUSortExampleHandle} from '../../examples/experimental/gpu-sort/src/app';
import type {GPUDataAnalysisExampleHandle} from '../../examples/experimental/gpu-data-analysis/src/app';
import type {GPGPUShowcaseHandle} from '../../examples/experimental/gpgpu/src/app';
import type {ExternalWebGLContextHandle} from '../../examples/integrations/external-context/app';
import type {GaussianSplatSourceCatalogEntry} from '../../examples/showcase/gaussian-splats/local-loaders';
import {getErrorMessage, logError} from './react-luma/utils/error-utils';

const exampleConfig = {};

const loadAnimationApp = () => import('../../examples/api/animation/app');
const loadBlendingApp = () => import('../../examples/api/blending/app');
const loadCubemapApp = () => import('../../examples/api/cubemap/app');
const loadBloomApp = () => import('../../examples/experimental/bloom/app');
const loadHTMLUIPrismApp = () => import('../../examples/experimental/html-ui-prism/app');
const loadGPUFrustumCullingApp = () => import('../../examples/experimental/gpu-frustum-culling/app');
const loadGPUSceneGraphApp = () => import('../../examples/experimental/gpu-scene-graph/app');
const loadGPUTraceSceneApp = () => import('../../examples/experimental/gpu-trace-scene/app');
const loadGPUTraceViewerApp = () => import('../../examples/experimental/gpu-trace-viewer/app');
const loadLuCIMVolumeLabApp = () => import('../../examples/experimental/lucim-volume-lab/app');
const loadGPT2App = () => import('../../examples/experimental/gpt-2/app');
const loadVideoTextureApp = () => import('../../examples/api/video-texture/app');
const loadWebXRKaleidoscopeApp = () => import('../../examples/experimental/webxr-kaleidoscope/app');
const loadMultiCanvasApp = () => import('../../examples/api/multi-canvas/app');
const loadTexture3DApp = () => import('../../examples/api/texture-3d/app');
const loadTextureSamplingApp = () => import('../../examples/api/texture-sampling/app');
const loadTextureTesterApp = () => import('../../examples/api/texture-tester/app');
const loadHelloReactApp = () => import('../../examples/integrations/hello-react/app');
const loadDOFApp = () => import('../../examples/showcase/dof/app');
const loadAdvancedEffectsApp = () => import('../../examples/experimental/advanced-effects/app');
const loadDeferredRenderingApp = () => import('../../examples/experimental/deferred-rendering/app');
const loadFluidFoundryApp = () => import('../../examples/experimental/fluid-foundry/app');
const loadSpectralCausticsApp = () => import('../../examples/experimental/spectral-caustics/app');
const loadVolumetricFireForgeApp = () => import('../../examples/experimental/volumetric-fire-forge/app');
const loadVirtualGeometryCanyonApp = () => import('../../examples/experimental/virtual-geometry-canyon/app');
const loadShadowMapApp = () => import('../../examples/experimental/shadow-map/app');
const loadABufferApp = () => import('../../examples/experimental/a-buffer/app');
const loadGLTFApp = () => import('../../examples/showcase/gltf/app');
const loadGaussianSplatsApp = () => import('../../examples/showcase/gaussian-splats/app');
const loadInstancingApp = () => import('../../examples/showcase/instancing/app');
const loadLightstormMegacityApp = () => import('../../examples/showcase/lightstorm-megacity/app');
const loadLLMNetworkApp = () => import('../../examples/showcase/llm-network/app');
const loadVectorFieldLabApp = () => import('../../examples/showcase/vector-field-lab/app');
const loadQuantumStateStudioApp = () => import('../../examples/showcase/quantum-state-studio/app');
const loadTempestOceanApp = () => import('../../examples/showcase/tempest-ocean/app');
const loadRenderBundlesApp = () => import('../../examples/api/render-bundles/app');
const loadTextSpaceCrawlApp = () => import('../../examples/experimental/text-space-crawl/app');
const loadPersistenceApp = () => import('../../examples/showcase/persistence/app');
const loadPostprocessingApp = () => import('../../examples/showcase/postprocessing/app');
const loadAntialiasingApp = () => import('../../examples/experimental/antialiasing/app');
const loadGlobeApp = () => import('../../examples/showcase/globe/app');
const loadPacketSprayingApp = () => import('../../examples/showcase/packet-spraying/app');
const loadHelloTriangleGeometryApp = () => import('../../examples/tutorials/hello-triangle-geometry/app');
const loadHelloTriangleApp = () => import('../../examples/tutorials/hello-triangle/app');
const loadHelloCubeApp = () => import('../../examples/tutorials/hello-cube/app');
const loadTwoCubesApp = () => import('../../examples/tutorials/hello-two-cubes/app');
const loadInstancedCubesApp = () => import('../../examples/tutorials/hello-instanced-cubes/app');
const loadHelloInstancingApp = () => import('../../examples/tutorials/hello-instancing/app');
const loadHelloGLTFApp = () => import('../../examples/tutorials/hello-gltf/app');
const loadLightingApp = () => import('../../examples/tutorials/lighting/app');
const loadShaderHooksApp = () => import('../../examples/tutorials/shader-hooks/app');
const loadShaderPluginsApp = () => import('../../examples/tutorials/shader-plugins/app');
const loadShaderModulesApp = () => import('../../examples/tutorials/shader-modules/app');
const loadTransformFeedbackApp = () => import('../../examples/tutorials/transform-feedback/app');
const loadTransformApp = () => import('../../examples/tutorials/transform/app');

const loadBillionPointSpatialAtlasExample = () =>
  import('../../examples/showcase/billion-point-spatial-atlas/app');
const loadMillionRowCrossfilterExample = () =>
  import('../../examples/showcase/million-row-crossfilter/app');
const loadRasterLabExample = () => import('../../examples/showcase/raster-lab/app');
const loadFP64Example = () => import('../../examples/experimental/fp64/app');
const loadGPUSortExample = () => import('../../examples/experimental/gpu-sort/src/app');
const loadGPUDataAnalysisExample = () =>
  import('../../examples/experimental/gpu-data-analysis/src/app');
const loadGPGPUShowcaseExample = () => import('../../examples/experimental/gpgpu/src/app');
const loadExternalContextExample = () =>
  import('../../examples/integrations/external-context/app');

const subscribeToInactiveApplication = (_listener: () => void): (() => void) => () => {};

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

export const GLTFExample: React.FC<WebsiteExampleProps> = props => {
  const referenceDevice = getGLTFReferenceDeviceSelection();

  return (
    <LumaExample
      id="gltf"
      title="glTF Asset Studio"
      subtitle="Physical materials · animated characters · standards-native glTF"
      directory="showcase"
      loadTemplate={loadGLTFApp}
      config={exampleConfig}
      canvasContextProfile="high-dynamic-range"
      devices={referenceDevice ? [referenceDevice] : undefined}
      {...props}
    />
  );
};

function getGLTFReferenceDeviceSelection(): NonNullable<LumaExampleProps['devices']>[number] | null {
  if (
    typeof window === 'undefined' ||
    new URLSearchParams(window.location.search).get('gltf-reference') !== '1'
  ) {
    return null;
  }

  const deviceType = window.localStorage.getItem('luma-device-type');
  switch (deviceType) {
    case 'webgpu-core':
    case 'webgpu-max':
    case 'webgpu-compatibility':
      return deviceType;
    case 'webgl':
      return 'webgl2';
    default:
      return null;
  }
}

export const GaussianSplatViewerExample: React.FC<
  WebsiteExampleProps & {defaultScene?: GaussianSplatSourceCatalogEntry['id']}
> = ({defaultScene, ...props}) => {
  const loaderBundleUrl = useBaseUrl('/standalone-examples/gaussian-splats/loaders-gl.mjs');
  const loadAnimationTemplate = useMemo(
    () => async () => {
      const {default: GaussianSplatsApp} = await loadGaussianSplatsApp();
      const makeAnimationTemplate = () => {
        if (!defaultScene) {
          return GaussianSplatsApp;
        }

        return class GaussianSplatSceneAnimationTemplate extends GaussianSplatsApp {
          constructor(animationProps: AnimationProps) {
            super({...animationProps, defaultScene});
          }
        };
      };
      return {default: makeAnimationTemplate()};
    },
    [defaultScene]
  );

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
      loadTemplate={loadAnimationTemplate}
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
    loadTemplate={loadInstancingApp}
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
    loadTemplate={loadLightstormMegacityApp}
    config={exampleConfig}
    canvasContextProfile="high-dynamic-range"
    {...props}
  />
);

export const VectorFieldLabExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="vector-field-lab"
    title="Vector Field Lab"
    subtitle="Orbit linked 3D gradient, divergence, curl, and Laplacian volumes"
    directory="showcase"
    devices={['webgpu']}
    loadTemplate={loadVectorFieldLabApp}
    config={exampleConfig}
    {...props}
  />
);

export const LLMNetworkExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="llm-network"
    title="Inside a Transformer"
    subtitle="Follow tokens through attention, hidden layers, and next-token prediction"
    directory="showcase"
    devices={['webgpu']}
    loadTemplate={loadLLMNetworkApp}
    config={exampleConfig}
    {...props}
  />
);

export const QuantumStateStudioExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="quantum-state-studio"
    title="Quantum State Studio"
    subtitle="GPU-resident state vectors · linked probability, phase, Bloch, and correlation views"
    directory="showcase"
    devices={['webgpu']}
    loadTemplate={loadQuantumStateStudioApp}
    config={exampleConfig}
    canvasContextProfile="high-dynamic-range"
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
    loadTemplate={loadTempestOceanApp}
    config={exampleConfig}
    canvasContextProfile="high-dynamic-range"
    {...props}
  />
);

export const GPGPUExample: React.FC<WebsiteExampleProps> = ({embeddedHeight, ...props}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    let handle: GPGPUShowcaseHandle | null = null;
    void loadGPGPUShowcaseExample()
      .then(({initializeGPGPUShowcase}) => {
        if (!isCancelled) {
          handle = initializeGPGPUShowcase();
        }
      })
      .catch(error => {
        if (!isCancelled) {
          setErrorMessage(getErrorMessage(error));
          logError('Failed to initialize GPGPU table evaluation example', error);
        }
      });

    return () => {
      isCancelled = true;
      handle?.destroy();
    };
  }, []);

  return (
    <ExamplePage
      {...props}
      embeddedHeight={embeddedHeight ?? (props.embedded ? 720 : undefined)}
      style={{background: '#f7f8fb', overflow: 'hidden', ...props.style}}
    >
      <main id="app" />
      {errorMessage ? (
        <p role="alert" style={{padding: 22}}>
          {errorMessage}
        </p>
      ) : null}
    </ExamplePage>
  );
};

/** Docusaurus wrapper for the graph-native paired GPU sort example. */
export const GPUSortExample: React.FC<WebsiteExampleProps> = ({embeddedHeight, ...props}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    let handle: GPUSortExampleHandle | null = null;
    void loadGPUSortExample()
      .then(({initializeGPUSortExample}) => {
        if (!isCancelled) {
          handle = initializeGPUSortExample();
        }
      })
      .catch(error => {
        if (!isCancelled) {
          setErrorMessage(getErrorMessage(error));
          logError('Failed to initialize GPU sort example', error);
        }
      });

    return () => {
      isCancelled = true;
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
    let isCancelled = false;
    let handle: GPUDataAnalysisExampleHandle | null = null;
    void loadGPUDataAnalysisExample()
      .then(({initializeGPUDataAnalysisExample}) => {
        if (!isCancelled) {
          handle = initializeGPUDataAnalysisExample();
        }
      })
      .catch(error => {
        if (!isCancelled) {
          setErrorMessage(getErrorMessage(error));
          logError('Failed to initialize GPU data-analysis example', error);
        }
      });
    return () => {
      isCancelled = true;
      handle?.destroy();
    };
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
    loadTemplate={loadGPT2App}
    config={exampleConfig}
    {...props}
  />
);

export const TextSpaceCrawlExample: React.FC = props => (
  <LumaExample
    id="text-space-crawl"
    title="Text Space Crawl"
    directory="experimental"
    loadTemplate={loadTextSpaceCrawlApp}
    config={exampleConfig}
    {...props}
  />
);

export const PersistenceExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="persistence"
    directory="showcase"
    loadTemplate={loadPersistenceApp}
    config={exampleConfig}
    {...props}
  />
);

export const PostprocessingExample: React.FC<WebsiteExampleProps & {effect?: string}> = ({
  effect,
  ...props
}) => {
  const loadTemplate = useMemo(
    () => async () => {
      const {default: PostprocessingApp} = await loadPostprocessingApp();
      if (!effect) {
        return {default: PostprocessingApp};
      }

      return {
        default: class FocusedPostprocessingApp extends PostprocessingApp {
          static override initialEffectName = effect;
        }
      };
    },
    [effect]
  );

  return (
    <LumaExample
      id="postprocessing"
      title="Effects: Image Processing"
      directory="showcase"
      loadTemplate={loadTemplate}
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
    loadTemplate={loadAntialiasingApp}
    config={exampleConfig}
    {...props}
  />
);

export const GlobeExample: React.FC = props => (
  <LumaExample
    id="globe"
    title="Globe"
    directory="showcase"
    loadTemplate={loadGlobeApp}
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
    loadTemplate={loadPacketSprayingApp}
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
    loadTemplate={loadDOFApp}
    config={exampleConfig}
    {...props}
  />
);

export const AdvancedEffectsExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="advanced-effects"
    title="Advanced Effects: Visualization City"
    directory="experimental"
    loadTemplate={loadAdvancedEffectsApp}
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
    loadTemplate={loadDeferredRenderingApp}
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
    loadTemplate={loadFluidFoundryApp}
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
    loadTemplate={loadSpectralCausticsApp}
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
    loadTemplate={loadVolumetricFireForgeApp}
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
    loadTemplate={loadLuCIMVolumeLabApp}
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
    loadTemplate={loadVirtualGeometryCanyonApp}
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
    loadTemplate={loadShadowMapApp}
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
    loadTemplate={loadABufferApp}
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
    loadTemplate={loadBloomApp}
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
    const app = (await loadVideoTextureApp()).default.current;
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
      loadTemplate={loadVideoTextureApp}
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

  const {module: webXRModule} = useDeferredExampleModule(loadWebXRKaleidoscopeApp);
  const webXRApplication = webXRModule?.default;
  const selectedDevice = useStore(store => store.device);
  const activeApplication = useSyncExternalStore(
    webXRApplication?.subscribeToCurrent || subscribeToInactiveApplication,
    () => webXRApplication?.current || null,
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
    const app = webXRApplication?.current;
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
      loadTemplate={loadWebXRKaleidoscopeApp}
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
    loadTemplate={loadHTMLUIPrismApp}
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
    loadTemplate={loadGPUTraceViewerApp}
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
    loadTemplate={loadGPUTraceSceneApp}
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
    loadTemplate={loadGPUSceneGraphApp}
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
    loadTemplate={loadGPUFrustumCullingApp}
    config={exampleConfig}
    {...props}
  />
);

// API Examples

export const AnimationExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="animation"
    directory="api"
    loadTemplate={loadAnimationApp}
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
    loadTemplate={loadBlendingApp}
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
    loadTemplate={loadCubemapApp}
    config={exampleConfig}
    {...props}
  />
);

export const MultiCanvasExample: React.FC<WebsiteExampleProps> = props => {
  const {module: multiCanvasModule, errorMessage} = useDeferredExampleModule(loadMultiCanvasApp);
  const MultiCanvasApp = multiCanvasModule?.default;
  const deviceType = useStore(store => store.deviceType);
  const presentationDevice = useStore(store => store.presentationDevice);
  const presentationDeviceError = useStore(store => store.presentationDeviceError);
  const exampleDisplayProps: ExampleDisplayProps = {
    className: props.className,
    embedded: props.embedded,
    embeddedHeight: props.embeddedHeight,
    style: props.style
  };

  if (presentationDeviceError || errorMessage) {
    return (
      <ExamplePage {...exampleDisplayProps}>
        <div>{presentationDeviceError || errorMessage}</div>
      </ExamplePage>
    );
  }

  return deviceType && presentationDevice && MultiCanvasApp ? (
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
    loadTemplate={loadTexture3DApp}
    config={exampleConfig}
    {...props}
  />
);

export const TextureSamplingExample: React.FC<WebsiteExampleProps> = props => (
  <LumaExample
    id="texture-sampling"
    title="Texture Sampling"
    directory="api"
    loadTemplate={loadTextureSamplingApp}
    config={exampleConfig}
    devices={['webgpu', 'webgl2']}
    {...props}
  />
);

export const TextureTesterExample: React.FC<WebsiteExampleProps> = ({
  embeddedHeight,
  ...props
}) => {
  const {module: textureTesterModule, errorMessage} = useDeferredExampleModule(loadTextureTesterApp);
  const TextureTesterApp = textureTesterModule?.default;
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
      {presentationDeviceError || errorMessage ? (
        <div>{presentationDeviceError || errorMessage}</div>
      ) : deviceType && presentationDevice && TextureTesterApp ? (
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
    loadTemplate={loadRenderBundlesApp}
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

    let isCancelled = false;
    let exampleHandle: ExternalWebGLContextHandle | null = null;

    loadExternalContextExample()
      .then(({default: initializeExternalWebGLContext}) =>
        initializeExternalWebGLContext({container})
      )
      .then(instance => {
        if (isCancelled) {
          instance.destroy();
          return;
        }
        exampleHandle = instance;
      })
      .catch(caughtError => {
        if (!isCancelled) {
          logError('External WebGL context example failed', caughtError);
          setError(getErrorMessage(caughtError));
        }
      });

    return () => {
      isCancelled = true;
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
  const {module: reactExampleModule, errorMessage} = useDeferredExampleModule(loadHelloReactApp);
  const HelloReactApp = reactExampleModule?.default;
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
        {errorMessage ? (
          <div role="alert">{errorMessage}</div>
        ) : HelloReactApp ? (
          <React.StrictMode>
            <HelloReactApp
              showControls={false}
              showCube={showCube}
              mountCount={mountCount}
              onToggleCube={toggleCube}
            />
          </React.StrictMode>
        ) : (
          <div>Loading React example...</div>
        )}
      </div>
    </ExamplePage>
  );
};

// Tutorial Examples

export const HelloTriangleExample: React.FC = props => (
  <LumaExample
    id="hello-triangle"
    directory="tutorials"
    loadTemplate={loadHelloTriangleApp}
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
    loadTemplate={loadHelloTriangleGeometryApp}
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
    loadTemplate={loadHelloCubeApp}
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
    loadTemplate={loadInstancedCubesApp}
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
    loadTemplate={loadTwoCubesApp}
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
    loadTemplate={loadLightingApp}
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
    loadTemplate={loadHelloGLTFApp}
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
    loadTemplate={loadHelloInstancingApp}
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
    loadTemplate={loadShaderHooksApp}
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
    loadTemplate={loadShaderPluginsApp}
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
    loadTemplate={loadShaderModulesApp}
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
    loadTemplate={loadTransformFeedbackApp}
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
    loadTemplate={loadTransformApp}
    config={exampleConfig}
    showStats={false}
    stackBlitz
    devices={['webgl2']}
    {...props}
  />
);
