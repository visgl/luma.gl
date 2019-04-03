export default class Display {
  startDisplay() {}

  getViews(options) {
    const [width, height] = options;
    return [
      {
        params: {
          viewport: [0, 0, width, height],
          scissor: [0, 0, width, height]
        },
        viewName: 'single view',
        vrProjectionMatrix: null,
        vrViewMatrix: null
      }
    ];
  }

  submitFrame() {
    return true;
  }

  // return true if animation frame has been requested
  requestAnimationFrame() {
    return false;
  }
}
