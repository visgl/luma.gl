// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {luma, Adapter, Device} from '@luma.gl/core';
import {AnimationLoopTemplate} from './animation-loop-template';
import {AnimationLoop, AnimationLoopProps} from './animation-loop';
import type {AnimationProps} from './animation-props';

/** Props accepted while constructing an animation loop from a template. */
export type MakeAnimationLoopProps = Omit<
  AnimationLoopProps,
  'onCreateDevice' | 'onInitialize' | 'onRedraw' | 'onFinalize'
> & {
  /** List of adapters to use when creating the device */
  adapters?: Adapter[];
  /** Runs after the template has encoded its frame and before the animation loop submits it. */
  onAfterRender?: (
    animationProps: AnimationProps,
    animationLoopTemplate: AnimationLoopTemplate | null
  ) => unknown;
};

/** Animation loop created from a template, with access to the active template instance. */
export type TemplateAnimationLoop = AnimationLoop & {
  /** Returns the template after initialization, or null before initialization and after failure. */
  getAnimationLoopTemplate(): AnimationLoopTemplate | null;
};

/**
 * Instantiates an animation loop and initializes it with the template.
 * @note The application needs to call `start()` on the returned animation loop to start the rendering loop.
 */
export function makeAnimationLoop(
  AnimationLoopTemplateCtor: typeof AnimationLoopTemplate,
  props?: MakeAnimationLoopProps
): TemplateAnimationLoop {
  let renderLoop: AnimationLoopTemplate | null = null;

  const device =
    props?.device ||
    luma.createDevice({
      id: 'animation-loop',
      adapters: props?.adapters,
      createCanvasContext: true
    });

  // Create an animation loop;
  const animationLoop = new AnimationLoop({
    ...props,

    device,

    async onInitialize(animationProps: AnimationProps): Promise<unknown> {
      clearError(animationProps.animationLoop.device);
      try {
        // @ts-expect-error abstract to prevent instantiation
        renderLoop = new AnimationLoopTemplateCtor(animationProps);
        // Any async loading can be handled here
        return await renderLoop?.onInitialize(animationProps);
      } catch (error) {
        // biome-ignore lint/suspicious/noConsole: fallback logging before rendering the in-canvas error banner.
        console.error(error);
        renderLoop = null;
        setError(animationProps.animationLoop.device, error as Error);
        animationProps.animationLoop.stop();
        return null;
      }
    },

    onRender(animationProps: AnimationProps): unknown {
      const renderResult = renderLoop?.onRender(animationProps);
      const afterRenderResult = props?.onAfterRender?.(animationProps, renderLoop);
      return props?.onAfterRender
        ? renderResult !== false || afterRenderResult !== false
        : renderResult;
    },

    onFinalize(animationProps: AnimationProps): void {
      try {
        renderLoop?.onFinalize(animationProps);
      } finally {
        renderLoop = null;
      }
    }
  });

  const templateAnimationLoop = animationLoop as TemplateAnimationLoop;
  templateAnimationLoop.getAnimationLoopTemplate = () => renderLoop;

  // @ts-expect-error Hack: adds info for the website to find
  animationLoop.getInfo = () => {
    // @ts-ignore
    // eslint-disable-next-line no-invalid-this
    return this.AnimationLoopTemplateCtor.info;
  };

  return templateAnimationLoop;
}

function setError(device: Device | null, error: Error): void {
  if (!device) {
    return;
  }

  const canvas = device.getDefaultCanvasContext().canvas;
  if (canvas instanceof HTMLCanvasElement) {
    canvas.style.overflow = 'visible';
    let errorDiv = document.getElementById('animation-loop-error');
    errorDiv?.remove();
    errorDiv = document.createElement('h1');
    errorDiv.id = 'animation-loop-error';
    errorDiv.innerHTML = error.message;
    errorDiv.style.position = 'absolute';
    errorDiv.style.top = '10px'; // left: 50%; transform: translate(-50%, -50%);';
    errorDiv.style.left = '10px';
    errorDiv.style.color = 'black';
    errorDiv.style.backgroundColor = 'red';
    canvas.parentElement?.appendChild(errorDiv);
    // canvas.style.position = 'absolute';
  }
}

function clearError(device: Device | null): void {
  if (!device) {
    return;
  }

  const errorDiv = document.getElementById('animation-loop-error');
  if (errorDiv) {
    errorDiv.remove();
  }
}
