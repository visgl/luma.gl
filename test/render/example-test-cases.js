import {setPathPrefix} from '@luma.gl/webgl';

const RESOURCE_PATH = 'https://raw.githubusercontent.com/uber/luma.gl/master';

const examples = {
  helloTriangle: require('../../examples/getting-started/hello-triangle/app').default,
  helloInstancingHigh: require('../../examples/getting-started/hello-instancing-high/app').default,
  helloInstancingMid: require('../../examples/getting-started/hello-instancing-mid/app').default,
  instancing: require('../../examples/showcase/instancing/app').default,
  persistence: require('../../examples/showcase/persistence/app').default,
  transform: require('../../examples/showcase/transform/app').default,
  animation: require('../../examples/api/animation/app').default,
  programManagement: require('../../examples/api/program-management/app').default,
  texture3d: require('../../examples/api/texture-3d/app').default,
  transformFeedback: require('../../examples/api/transform-feedback/app').default
};

export default Object.keys(examples).map(name => {
  const AppAnimationLoop = examples[name];
  const animationLoop = new AppAnimationLoop();
  return {
    name,
    onInitialize: params => {
      setPathPrefix(`${RESOURCE_PATH}/examples/lessons/${name.slice(-2)}/`);
      return animationLoop.onInitialize(params);
    },
    onRender: params => {
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
