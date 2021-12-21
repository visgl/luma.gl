import type {AnimationProps} from './webgpu-animation-loop';
import AnimationLoop from './webgpu-animation-loop';

/**
 * Minimal animation loop that initializes models in constructor
 * Simplifying type management
 */
export abstract class RenderLoop {
  constructor(animationProps?: AnimationProps) {}
  onRender(animationProps: AnimationProps) {}
  onFinalize(animationProps: AnimationProps) {}

  static getAnimationLoop(RenderLoopConstructor: typeof RenderLoop) {
    return new WrappedAnimationLoop(RenderLoopConstructor);
  }

  /** Instantiates and runs the render loop */
  static run(RenderLoopConstructor: typeof RenderLoop, options?: {start?: boolean}): WrappedAnimationLoop {
    const animationLoop = RenderLoop.getAnimationLoop(RenderLoopConstructor);
    if (options?.start !== false) {
      animationLoop.start();
    }
    return animationLoop;
  }
}

class WrappedAnimationLoop extends AnimationLoop {
  RenderLoopConstructor: typeof RenderLoop;
  renderLoop: RenderLoop;

  getInfo() {
    // @ts-ignore
    return this.RenderLoopConstructor.info;
  }

  constructor(RenderLoopConstructor: typeof RenderLoop) {
    super();
    this.RenderLoopConstructor = RenderLoopConstructor;
  }

  onInitialize(animationProps: AnimationProps) {
    // @ts-expect-error
    this.renderLoop = new this.RenderLoopConstructor(animationProps);
  }

  onRender(animationProps: AnimationProps) {
    this.renderLoop.onRender(animationProps);
  }

  onFinalize(animationProps: AnimationProps) {
    this.renderLoop?.onFinalize?.(animationProps);
  }
}

