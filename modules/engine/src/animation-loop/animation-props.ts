// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Device} from '@luma.gl/core';
import {Timeline} from '../animation/timeline';
import type {AnimationLoop} from './animation-loop';

/** Properties passed to every render frame  */
export type AnimationProps = {
  device: Device;
  animationLoop: AnimationLoop;

  /** @todo Should be canvasContext */
  canvas: HTMLCanvasElement | OffscreenCanvas;
  useDevicePixels: number | boolean;
  width: number;
  height: number;
  aspect: number;

  // Animation props
  time: number;
  startTime: number;
  engineTime: number;
  tick: number;
  tock: number;

  // Initial values
  needsRedraw?: string | false;

  timeline: Timeline | null;

  // Experimental
  _mousePosition?: [number, number] | null; // [offsetX, offsetY],
};
