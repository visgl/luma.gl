import type {DeviceProps} from '@luma.gl/api';
import type {AnimationProps} from '../lib/animation-props';
import {AnimationLoop} from './animation-loop';

/**
 * Minimal animation loop that initializes models in constructor
 * Simplifying type management
 * v9 API
 */
export abstract class RenderLoop {
  constructor(animationProps?: AnimationProps) {}

  /** Instantiates and runs the render loop */
  static run(RenderLoopConstructor: typeof RenderLoop, deviceProps?: DeviceProps): AnimationLoop {
    // Create an animation loop;
    const animationLoop = new SyncInitAnimationLoop(RenderLoopConstructor, deviceProps);

    // Start the loop automatically
    // animationLoop.start();

    return animationLoop;
  }
}

/** Instantiates the RenderLoop once the device is created */
class SyncInitAnimationLoop extends AnimationLoop {
  RenderLoopConstructor: typeof RenderLoop;
  renderLoop: RenderLoop;

  getInfo() {
    // @ts-ignore
    return this.RenderLoopConstructor.info;
  }

  constructor(RenderLoopConstructor: typeof RenderLoop, deviceProps?: DeviceProps) {
    super({deviceProps});
    this.RenderLoopConstructor = RenderLoopConstructor;
  }

  onInitialize(animationProps: AnimationProps) {
    // @ts-expect-error
    this.renderLoop = new this.RenderLoopConstructor(animationProps);
  }

  onRender(animationProps: AnimationProps) {
    // @ts-expect-error API still TBD
    this.renderLoop?.onRender?.(animationProps);
    // @ts-expect-error API still TBD
    this.renderLoop?.frame?.(animationProps);
  }

  onFinalize(animationProps: AnimationProps) {
    // @ts-expect-error API still TBD
    this.renderLoop?.onFinalize?.(animationProps);
    // @ts-expect-error API still TBD
    this.renderLoop?.destroy?.(animationProps);
  }
}
