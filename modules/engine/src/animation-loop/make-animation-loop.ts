// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {luma, Adapter} from '@luma.gl/core';
import {AnimationLoopTemplate} from './animation-loop-template';
import {AnimationLoop, AnimationLoopProps} from './animation-loop';
import type {AnimationProps} from './animation-props';

export type MakeAnimationLoopProps = Omit<
  AnimationLoopProps,
  'onCreateDevice' | 'onInitialize' | 'onRedraw' | 'onFinalize'
> & {
  /** List of adapters to use when creating the device */
  adapters?: Adapter[];
};

/** Instantiates and runs the render loop */
export function makeAnimationLoop(
  AnimationLoopTemplateCtor: typeof AnimationLoopTemplate,
  props?: MakeAnimationLoopProps
): AnimationLoop {
  let renderLoop: AnimationLoopTemplate | null = null;

  const device =
    props?.device ||
    luma.createDevice({id: 'animation-loop', adapters: props?.adapters, createCanvasContext: true});

  // Create an animation loop;
  const animationLoop = new AnimationLoop({
    ...props,

    device,

    async onInitialize(animationProps: AnimationProps): Promise<unknown> {
      // @ts-expect-error abstract to prevent instantiation
      renderLoop = new AnimationLoopTemplateCtor(animationProps);
      // Any async loading can be handled here
      return await renderLoop?.onInitialize(animationProps);
    },

    onRender: (animationProps: AnimationProps) => renderLoop?.onRender(animationProps),

    onFinalize: (animationProps: AnimationProps) => renderLoop?.onFinalize(animationProps)
  });

  // @ts-expect-error Hack: adds info for the website to find
  animationLoop.getInfo = () => {
    // @ts-ignore
    // eslint-disable-next-line no-invalid-this
    return this.AnimationLoopTemplateCtor.info;
  };

  // Start the loop automatically
  // animationLoop.start();

  return animationLoop;
}
