// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {luma, Adapter, Device, type CreateDeviceProps} from '@luma.gl/core';
import {AnimationLoopTemplate} from './animation-loop-template';
import {AnimationLoop, AnimationLoopProps} from './animation-loop';
import type {AnimationProps} from './animation-props';
import type {CanvasErrorDisplayTarget} from './canvas-error-display';

let automaticCanvasCounter = 0;

/** Props accepted while constructing an animation loop from a template. */
type MakeAnimationLoopBaseProps = Omit<
  AnimationLoopProps,
  'device' | 'onInitialize' | 'onRender' | 'onFinalize'
> & {
  /** Runs after the template has encoded its frame and before the animation loop submits it. */
  onAfterRender?: (
    animationProps: AnimationProps,
    animationLoopTemplate: AnimationLoopTemplate | null
  ) => unknown;
};

type AutomaticAnimationLoopDeviceProps = {
  device?: undefined;
  /** List of adapters to use when creating the device. */
  adapters?: Adapter[];
  /** Device options used when makeAnimationLoop creates the device. */
  deviceProps?: Omit<CreateDeviceProps, 'adapters'>;
};

type SuppliedAnimationLoopDeviceProps = {
  device: Device | Promise<Device>;
  adapters?: never;
  deviceProps?: never;
};

export type MakeAnimationLoopProps = MakeAnimationLoopBaseProps &
  (AutomaticAnimationLoopDeviceProps | SuppliedAnimationLoopDeviceProps);

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
  props: MakeAnimationLoopProps = {}
): TemplateAnimationLoop {
  let renderLoop: AnimationLoopTemplate | null = null;

  const preparedDeviceProps = props.device ? null : prepareAutomaticDeviceProps(props.deviceProps);
  const usesOffscreenCanvas =
    preparedDeviceProps &&
    preparedDeviceProps.createCanvasContext !== true &&
    typeof OffscreenCanvas !== 'undefined' &&
    preparedDeviceProps.createCanvasContext?.canvas instanceof OffscreenCanvas;
  const errorDisplay =
    props.errorDisplay === false || (usesOffscreenCanvas && !props.errorDisplay?.target)
      ? false
      : {
          ...props.errorDisplay,
          target:
            props.errorDisplay?.target ||
            (preparedDeviceProps ? getDeviceErrorTarget(preparedDeviceProps) : undefined)
        };

  const device = props.device || createAutomaticDevice(preparedDeviceProps!, props.adapters);

  const onAfterRender = props.onAfterRender;

  // Create an animation loop;
  const animationLoop = new AnimationLoop({
    ...props,

    device,
    errorDisplay,

    async onInitialize(animationProps: AnimationProps): Promise<unknown> {
      try {
        // @ts-expect-error abstract to prevent instantiation
        renderLoop = new AnimationLoopTemplateCtor(animationProps);
        // Any async loading can be handled here
        return await renderLoop?.onInitialize(animationProps);
      } catch (error) {
        renderLoop = null;
        throw error;
      }
    },

    onRender(animationProps: AnimationProps): unknown {
      const renderResult = renderLoop?.onRender(animationProps);
      const afterRenderResult = onAfterRender?.(animationProps, renderLoop);
      return onAfterRender ? renderResult !== false || afterRenderResult !== false : renderResult;
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

async function createAutomaticDevice(
  deviceProps: Omit<CreateDeviceProps, 'adapters'>,
  adapters?: Adapter[]
): Promise<Device> {
  await insertAutomaticCanvas(deviceProps);
  return await luma.createDevice({id: 'animation-loop', ...deviceProps, adapters});
}

function prepareAutomaticDeviceProps(
  deviceProps: Omit<CreateDeviceProps, 'adapters'> = {}
): Omit<CreateDeviceProps, 'adapters'> {
  const requestedCanvasProps =
    deviceProps.createCanvasContext === true || !deviceProps.createCanvasContext
      ? {}
      : deviceProps.createCanvasContext;

  if (
    typeof document === 'undefined' ||
    (typeof OffscreenCanvas !== 'undefined' &&
      requestedCanvasProps.canvas instanceof OffscreenCanvas) ||
    requestedCanvasProps.canvas
  ) {
    return {...deviceProps, createCanvasContext: requestedCanvasProps};
  }

  const canvas = document.createElement('canvas');
  const width = requestedCanvasProps.width ?? 800;
  const height = requestedCanvasProps.height ?? 600;
  canvas.id = requestedCanvasProps.id || `luma-animation-loop-canvas-${automaticCanvasCounter++}`;
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = Number.isFinite(width) ? `${width}px` : '100%';
  canvas.style.height = Number.isFinite(height) ? `${height}px` : '100%';
  if (requestedCanvasProps.visible === false) {
    canvas.style.visibility = 'hidden';
  }

  const container = resolveContainer(requestedCanvasProps.container);
  container?.insertBefore(canvas, container.firstChild);
  return {
    ...deviceProps,
    _canvasContextOwned: true,
    createCanvasContext: {...requestedCanvasProps, canvas}
  };
}

function getDeviceErrorTarget(
  deviceProps: Omit<CreateDeviceProps, 'adapters'>
): CanvasErrorDisplayTarget | undefined {
  const canvasProps =
    deviceProps.createCanvasContext === true ? {} : deviceProps.createCanvasContext;
  const canvas = canvasProps?.canvas;
  if (
    typeof canvas === 'string' ||
    (typeof HTMLCanvasElement !== 'undefined' && canvas instanceof HTMLCanvasElement)
  ) {
    return typeof canvas === 'string' || !canvas.id ? canvas : canvas.id;
  }
  return resolveContainer(canvasProps?.container) || undefined;
}

async function insertAutomaticCanvas(
  deviceProps: Omit<CreateDeviceProps, 'adapters'>
): Promise<void> {
  const canvasProps = deviceProps.createCanvasContext;
  if (
    !deviceProps._canvasContextOwned ||
    typeof document === 'undefined' ||
    canvasProps === true ||
    !(canvasProps?.canvas instanceof HTMLCanvasElement) ||
    canvasProps.canvas.isConnected
  ) {
    return;
  }
  const canvas = canvasProps.canvas;

  let container = resolveContainer(canvasProps?.container);
  if (!container && document.readyState !== 'complete') {
    await new Promise<void>(resolve => {
      const target = document.readyState === 'loading' ? document : window;
      target.addEventListener(
        document.readyState === 'loading' ? 'DOMContentLoaded' : 'load',
        () => resolve(),
        {
          once: true
        }
      );
    });
    container = resolveContainer(canvasProps?.container);
  }
  container ||= document.body || document.documentElement;
  container.insertBefore(canvas, container.firstChild);
}

function resolveContainer(container?: HTMLElement | string | null): HTMLElement | null {
  if (typeof document === 'undefined') {
    return null;
  }
  if (typeof container === 'string') {
    return document.getElementById(container);
  }
  return container || document.body;
}
