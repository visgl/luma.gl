import {setPathPrefix} from '@luma.gl/webgl';

const RESOURCE_PATH = 'https://raw.githubusercontent.com/uber/luma.gl/master';

const examples = {
  helloTriangle: require('../../examples/getting-started/hello-triangle/app').default,
  helloInstancingHigh: require('../../examples/getting-started/hello-instancing-high/app').default,
  helloInstancingMid: require('../../examples/getting-started/hello-instancing-mid/app').default,
  shaderModules: require('../../examples/getting-started/shader-modules/app').default,
  shaderHooks: require('../../examples/getting-started/shader-hooks/app').default,
  shaderModulesLow: require('../../examples/getting-started/shader-modules-low/app').default,
  transformFeedback: require('../../examples/getting-started/transform-feedback/app').default,
  instancing: require('../../examples/showcase/instancing/app').default,
  persistence: require('../../examples/showcase/persistence/app').default,
  wandering: require('../../examples/showcase/wandering/app').default,
  animation: require('../../examples/api/animation/app').default,
  programManagement: require('../../examples/api/program-management/app').default,
  texture3d: require('../../examples/api/texture-3d/app').default
};

export default Object.keys(examples).map((name) => {
  const AppAnimationLoop = examples[name];
  const animationLoop = new AppAnimationLoop();
  return {
    name,
    onInitialize: (params) => {
      setPathPrefix(`${RESOURCE_PATH}/examples/lessons/${name.slice(-2)}/`);
      return animationLoop.onInitialize(params);
    },
    onRender: (params) => {
      // remove animation in the example
      params.tick = 0;
      const result = animationLoop.onRender(params);
      if (result !== false) {
        params.done();
      }
    },
    onFinalize: animationLoop.onFinalize.bind(animationLoop),
    goldenImage: `./test/render/golden-images/${name}.png`
  };
});
