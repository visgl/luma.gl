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

import HelloCubeApp from '../../../examples/tutorials/hello-cube/app';
import HelloInstancingApp from '../../../examples/tutorials/hello-instancing/app';
import HelloTriangleApp from '../../../examples/tutorials/hello-triangle-geometry/app';
import HelloGLTFApp from '../../../examples/tutorials/hello-gltf/app';
import LightingApp from '../../../examples/tutorials/lighting/app';
import ShaderHooksApp from '../../../examples/tutorials/shader-hooks/app';
import ShaderModulesApp from '../../../examples/tutorials/shader-modules/app';
import TransformFeedbackApp from '../../../examples/tutorials/transform-feedback/app';
// import TransformApp from '../../../examples/tutorials/transform/app';

// import AnimationLoop from '../../../examples/webgl/external-webgl-context/app';

import HelloTriangleWebGPUApp from '../../../examples/tutorials/hello-triangle/app';
import InstancedCubesWebGPUApp from '../../../examples/tutorials/hello-instanced-cubes/app';
import TexturedCubeWebGPUApp from '../../../examples/webgpu/textured-cube/app';
import TwoCubesWebGPUApp from '../../../examples/tutorials/hello-two-cubes/app';

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
    directory="showcase/persistence"
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
  <h2><i>Note: Transform examples temporarily disabled</i></h2>
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

export const HelloTriangleWebGPUExample: React.FC = () => (
  <LumaExample
    id="hello-triangle-webgpu"
    directory="webgpu"
    template={HelloTriangleWebGPUApp}
    config={exampleConfig}
  />
);

export const InstancedCubesWebGPUExample: React.FC = () => (
  <LumaExample
    id="instanced-cubes-webgpu"
    directory="webgpu"
    template={InstancedCubesWebGPUApp}
    config={exampleConfig}
  />
);

export const TexturedCubeWebGPUExample: React.FC = () => (
  <LumaExample
    id="textured-cube-webgpu"
    directory="webgpu"
    template={TexturedCubeWebGPUApp}
    config={exampleConfig}
  />
);

export const TwoCubesWebGPUExample: React.FC = () => (
  <LumaExample
    id="two-cubes-webgpu"
    directory="webgpu"
    template={TwoCubesWebGPUApp}
    config={exampleConfig}
  />
);
