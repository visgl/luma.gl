import {RenderLoop} from '@luma.gl/engine';
import {setPathPrefix} from '@luma.gl/webgl';

const RESOURCE_PATH = 'https://raw.githubusercontent.com/uber/luma.gl/master';

const examples = {
  // getting started
  helloTriangle: require('../../examples/getting-started/hello-triangle/app').default,
  helloInstancing: require('../../examples/getting-started/hello-instancing/app').default,
  shaderModules: require('../../examples/getting-started/shader-modules/app').default,
  shaderHooks: require('../../examples/getting-started/shader-hooks/app').default,
  transformFeedback: require('../../examples/getting-started/transform-feedback/app').default,

  // API
  animation: require('../../examples/api/animation/app').default,
  // texture3d: require('../../examples/api/texture-3d/app').default
  programManagement: require('../../examples/api/program-management/app').default,

  // showcases
  // instancing: require('../../examples/showcase/instancing/app').default,
  persistence: require('../../examples/showcase/persistence/app').default,
  wandering: require('../../examples/showcase/wandering/app').default

  // webgl
  // helloInstancingWebGLMid: require('../../examples/webgl/hello-instancing-webgl-mid/app').default
  // shaderModulesWebGL: require('../../examples/webgl/shader-modules-webgl/app').default,
};

export default Object.keys(examples).map((name) => {
  const AppRenderLoop = examples[name];
  const animationLoop = RenderLoop.getAnimationLoop(AppRenderLoop);
  return {
    name,
    onInitialize: (params) => {
      setPathPrefix(`${RESOURCE_PATH}/examples/lessons/${name.slice(-2)}/`);
      return animationLoop.onInitialize && animationLoop.onInitialize(params);
    },
    onRender: (params) => {
      // remove animation in the example
      params.tick = 0;
      const result = animationLoop.onRender && animationLoop.onRender(params);
      if (result !== false) {
        params.done();
      }
    },
    onFinalize: animationLoop.onFinalize.bind(animationLoop),
    goldenImage: `./test/render/golden-images/${name}.png`
  };
});
