import {AnimationLoop} from '@luma.gl/core';
import {DemoApp, GLTF_BASE_URL} from '../../examples/gltf/app';

const examples = {
  damagedHelmet: {
    modelFile: `${GLTF_BASE_URL}DamagedHelmet/glTF-Binary/DamagedHelmet.glb`,
    initialZoom: 5
  },
  duck: {
    modelFile: `${GLTF_BASE_URL}Duck/glTF-Binary/Duck.glb`,
    initialZoom: 8
  },
  monster: {
    modelFile: `${GLTF_BASE_URL}Monster/glTF-Binary/Monster.glb`,
    initialZoom: 120
  }
};

export default Object.keys(examples).map(name => {
  const app = new DemoApp(examples[name]);
  const animationLoop = new AnimationLoop(app);

  return {
    name,
    onInitialize: params => {
      return animationLoop.onInitialize(params);
    },
    onRender: params => {
      const result = animationLoop.onRender(params);
      if (result !== false) {
        params.done();
      }
    },
    timeout: 5000,
    onFinalize: animationLoop.onFinalize.bind(animationLoop),
    goldenImage: `./test/render/golden-images/${name}.png`
  };
});
