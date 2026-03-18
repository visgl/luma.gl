// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {CanvasContextProps, MutableCanvasContextProps} from './canvas-surface';
import {CanvasSurface} from './canvas-surface';

/**
 * Manages a renderable backend canvas. Supports both HTML or offscreen canvas
 * and returns backend framebuffers sourced from the canvas itself.
 */
export abstract class CanvasContext extends CanvasSurface {
  static override defaultProps = CanvasSurface.defaultProps;

  abstract override readonly handle: unknown;
}
