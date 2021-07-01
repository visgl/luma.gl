const examples = [
  {
    name: 'instancing',
    animationLoop: require('../../examples/core/instancing/app').default,
    targetFPS: 40
  }
];

export default examples.map(({name, animationLoop, targetFPS}) => {
  return {
    name,
    onInitialize: animationLoop.onInitialize.bind(animationLoop),
    onRender: (params) => {
      // disable picking in the example
      params._mousePosition = 0;
      animationLoop.onRender(params);
    },
    onFinalize: animationLoop.onFinalize.bind(animationLoop),
    targetFPS
  };
});
