import type {DeviceProps} from '@luma.gl/api';
import type {AnimationProps} from '../lib/animation-props';
import {AnimationLoop} from './animation-loop';

/**
 * Minimal animation loop that initializes models in constructor
 * Simplifying type management
 * v9 API
 */
export abstract class RenderLoop {

  animationLoop?: AnimationLoop;

  constructor(animationProps?: AnimationProps) {}

  destroy(): void {
    this.animationLoop?.destroy();
  }

  async onInitialize(animationProps: AnimationProps): Promise<unknown> { return null; }
  abstract onRender(animationProps: AnimationProps): unknown;
  abstract onFinalize(animationProps: AnimationProps): void;

  /** Instantiates and runs the render loop */
  static run(RenderLoopConstructor: typeof RenderLoop, deviceProps?: DeviceProps): AnimationLoop {
    let renderLoop: RenderLoop | null = null;

    // Create an animation loop;
    const animationLoop = new AnimationLoop({
      deviceProps,

      async onInitialize(animationProps: AnimationProps): Promise<unknown> {
         // @ts-expect-error abstract to prevent instantiation
        renderLoop = new RenderLoopConstructor(animationProps);
        renderLoop!.animationLoop = animationLoop;
        // Any async loading can be handled here
        return await renderLoop?.onInitialize(animationProps);
      },
  
      onRender(animationProps: AnimationProps) {
        renderLoop?.onRender(animationProps);
      },
  
      onFinalize(animationProps: AnimationProps) {
        renderLoop?.onFinalize(animationProps);
      }
    });

    // @ts-expect-error Hack: adds info for the website to find
    animationLoop.getInfo = () => {
      // @ts-ignore
      return this.RenderLoopConstructor.info;
    }

    // Start the loop automatically
    // animationLoop.start();

    return animationLoop;
  }
}
