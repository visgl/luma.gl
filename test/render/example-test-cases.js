import {setPathPrefix} from '@luma.gl/core';

const RESOURCE_PATH = 'https://raw.githubusercontent.com/uber/luma.gl/master';

const examples = {
  'lesson-01': require('../../examples/lessons/01/app').default,
  'lesson-02': require('../../examples/lessons/02/app').default,
  'lesson-03': require('../../examples/lessons/03/app').default,
  'lesson-04': require('../../examples/lessons/04/app').default,
  'lesson-05': require('../../examples/lessons/05/app').default,
  // 'lesson-06': require('../../examples/lessons/06/app').default,
  // 'lesson-07': require('../../examples/lessons/07/app').default,
  // 'lesson-08': require('../../examples/lessons/08/app').default,
  // 'lesson-09': require('../../examples/lessons/09/app').default,
  // 'lesson-10': require('../../examples/lessons/10/app').default,
  'lesson-11': require('../../examples/lessons/11/app').default
  // 'lesson-12': require('../../examples/lessons/12/app').default,
  // 'lesson-13': require('../../examples/lessons/13/app').default,
  // 'lesson-14': require('../../examples/lessons/14/app').default,
  // 'lesson-15': require('../../examples/lessons/15/app').default,
  // 'lesson-16': require('../../examples/lessons/16/app').default
};

export default Object.keys(examples).map(name => {
  const animationLoop = examples[name];
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
