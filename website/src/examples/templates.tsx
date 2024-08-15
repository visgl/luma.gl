// 

import React from 'react';
import {LumaExample} from '../react-luma';

import AnimationApp from '../../../examples/api/animation/app';
import CubemapApp from '../../../examples/api/cubemap/app';
import Texture3DApp from '../../../examples/api/texture-3d/app';

// import PerformanceApp from '../../../examples/performance/stress-test/app';

// import DOFApp from '../../../examples/showcase/dof/app';
// import GeospatialApp from '../../../examples/showcase/geospatial/app';
// import GLTFApp from '../../../examples/showcase/gltf/app';
import InstancingApp from '../../../examples/showcase/instancing/app';
import PersistenceApp from '../../../examples/showcase/persistence/app';
// import WanderingApp from '../../../examples/showcase/wandering/app';

import HelloTriangleGeometryApp from '../../../examples/tutorials/hello-triangle-geometry/app';
import HelloTriangleApp from '../../../examples/tutorials/hello-triangle/app';
import HelloCubeApp from '../../../examples/tutorials/hello-cube/app';
import TwoCubesApp from '../../../examples/tutorials/hello-two-cubes/app';
import InstancedCubesApp from '../../../examples/tutorials/hello-instanced-cubes/app';
import HelloInstancingApp from '../../../examples/tutorials/hello-instancing/app';
import HelloGLTFApp from '../../../examples/tutorials/hello-gltf/app';
import LightingApp from '../../../examples/tutorials/lighting/app';
import ShaderHooksApp from '../../../examples/tutorials/shader-hooks/app';
import ShaderModulesApp from '../../../examples/tutorials/shader-modules/app';
import TransformFeedbackApp from '../../../examples/tutorials/transform-feedback/app';
import TransformApp from '../../../examples/tutorials/transform/app';

const exampleConfig = {};

// API Examples

export const AnimationExample: React.FC = () => (
  <LumaExample id="animation" directory="api" template={AnimationApp} config={exampleConfig} />
);

export const CubemapExample: React.FC = () => (
  <LumaExample id="cubemap" directory="api" template={CubemapApp} config={exampleConfig} />
);

export const Texture3DExample: React.FC = () => (
  <LumaExample id="texture-3d" directory="api-3d" template={Texture3DApp} config={exampleConfig} />
);

// Performance Examples

// export default class Example extends React.Component {
//   render() {
//     const { pageContext } = this.props;
//     const exampleConfig = (pageContext && pageContext.exampleConfig) || {};
//     return (
//       <LumaExample AnimationLoop={PerformanceApp} exampleConfig={exampleConfig} />
//     );
//   }
// }

// Showcase Examples

// export const DOFExample: React.FC = () => (
//   <LumaExample
//     id="gltf"
//     directory="showcase"
//     template={DOFApp}
//     config={exampleConfig}
//   />
// );

// export const GeospatialExample: React.FC = () => (
//   <LumaExample
//     id="gltf"
//     directory="showcase"
//     template={GeospatialApp}
//     config={exampleConfig}
//   />
// );

// export const GLTFExample: React.FC = () => (
//   <LumaExample
//     id="gltf"
//     directory="showcase"
//     template={GLTFApp}
//     config={exampleConfig}
//   />
// );

export const InstancingExample: React.FC = () => (
  <LumaExample
    id="instancing"
    directory="showcase"
    template={InstancingApp}
    config={exampleConfig}
  />
);

export const PersistenceExample: React.FC = () => (
  <LumaExample
    id="persistence"
    directory="showcase"
    template={PersistenceApp}
    config={exampleConfig}
  />
);

// export const WanderingExample: React.FC = () => (
//   <LumaExample
//     id="wandering"
//     directory="showcase/wandering"
//     template={WanderingApp}
//     config={exampleConfig}
//   />
// );

// Tutorial Examples

export const HelloCubeExample: React.FC = () => (
  <LumaExample
    id="hello-cube"
    directory="tutorials"
    template={HelloCubeApp}
    config={exampleConfig}
  />
);

export const HelloInstancingExample: React.FC = () => (
  <LumaExample
    id="hello-instancing"
    directory="tutorials"
    template={HelloInstancingApp}
    config={exampleConfig}
  />
);

export const HelloTriangleExample: React.FC = () => (
  <LumaExample
    id="hello-triangle"
    directory="tutorials"
    template={HelloTriangleApp}
    config={exampleConfig}
  />
);

export const InstancedTransformExample: React.FC = () => (
  <h2><i>Note: Transform examples temporarily disabled</i></h2>
);

export const LightingExample: React.FC = () => (
  <LumaExample id="lighting" directory="tutorials" template={LightingApp} config={exampleConfig} />
);

export const HelloGLTFExample: React.FC = () => (
  <LumaExample
    id="hello-gltf"
    directory="tutorials"
    template={HelloGLTFApp}
    config={exampleConfig}
  />
);

export const ShaderHooksExample: React.FC = () => (
  <LumaExample
    id="shader-hooks"
    directory="tutorials"
    template={ShaderHooksApp}
    config={exampleConfig}
  />
);

export const ShaderModulesExample: React.FC = () => (
  <LumaExample
    id="shader-modules"
    directory="tutorials"
    template={ShaderModulesApp}
    config={exampleConfig}
  />
);

export const TransformFeedbackExample: React.FC = () => (
  <LumaExample
    id="transform-feedback"
    directory="tutorials"
    template={TransformFeedbackApp}
    config={exampleConfig}
  />
);

export const TransformExample: React.FC = () => (
  <LumaExample
    id="transform"
    directory="tutorials"
    template={TransformApp}
    config={exampleConfig}
  />
);

// WebGL Examples

// export default class ExternalWebGLContextExample extends React.Component {
//   render() {
//     const { pageContext } = this.props;
//     const exampleConfig = (pageContext && pageContext.exampleConfig) || {};
//     return (
//       <LumaExample AnimationLoop={AnimationLoop} exampleConfig={exampleConfig} />
//     );
//   }
// }

// import AnimationLoop from '../../../examples/webgl/hello-instancing-webgl/app';

// export default class Example extends React.Component {
//   render() {
//     const { pageContext } = this.props;
//     const exampleConfig = (pageContext && pageContext.exampleConfig) || {};
//     return (
//       <LumaExample AnimationLoop={AnimationLoop} exampleConfig={exampleConfig} />
//     );
//   }
// }

// import AnimationLoop from '../../../examples/webgl/shader-modules-webgl/app';

// export default class Example extends React.Component {
//   render() {
//     const { pageContext } = this.props;
//     const exampleConfig = (pageContext && pageContext.exampleConfig) || {};
//     return (
//       <LumaExample AnimationLoop={AnimationLoop} exampleConfig={exampleConfig} />
//     );
//   }
// }

// WebGPU Examples

export const HelloTriangleGeometryExample: React.FC = () => (
  <LumaExample
    id="hello-triangle-geometry"
    directory="tutorials"
    template={HelloTriangleGeometryApp}
    config={exampleConfig}
  />
);

export const InstancedCubesExample: React.FC = () => (
  <LumaExample
    id="instanced-cubes"
    directory="tutorials"
    template={InstancedCubesApp}
    config={exampleConfig}
  />
);

export const TwoCubesExample: React.FC = () => (
  <LumaExample
    id="two-cubes"
    directory="tutorials"
    template={TwoCubesApp}
    config={exampleConfig}
  />
);

// export const TexturedCubeExample: React.FC = () => (
//   <LumaExample
//     id="textured-cube-webgpu"
//     directory="webgpu"
//     template={TexturedCubeApp}
//     config={exampleConfig}
//   />
// );

