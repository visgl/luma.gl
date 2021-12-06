import {Stats} from '@probe.gl/stats';
import type {AnimationProps} from './animation-loop';
import AnimationLoop from './animation-loop';
import {Timeline} from '../animation/timeline'

/**
 * Minimal animation loop that initializes models in constructor
 * Simplifying type management
 */
export abstract class RenderLoop {
  _animationLoop: AnimationLoop;

  // Forward animation loop methods
  get timeline() {
    return this._animationLoop.timeline;
  }
  attachTimeline(timeline: Timeline) {
    this._animationLoop.attachTimeline(timeline);
  }
  get stats(): Stats {
    return this._animationLoop.stats;
  }

  // renderloop methods

  constructor(animationProps?: {_animationLoop: AnimationLoop}) {
    this._animationLoop = animationProps?._animationLoop;
  }
  onRender(animationProps: AnimationProps) {}
  onFinalize(animationProps: AnimationProps) {}


  /** Instantiates and runs the render loop */
  static run(RenderLoopConstructor: typeof RenderLoop, options?: {start?: boolean}): WrappedAnimationLoop {
    const animationLoop = RenderLoop.getAnimationLoop(RenderLoopConstructor);
    if (options?.start !== false) {
      animationLoop.start();
    }
    return animationLoop;
  }

  static getAnimationLoop(RenderLoopConstructor: typeof RenderLoop) {
    return new WrappedAnimationLoop(RenderLoopConstructor);
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

