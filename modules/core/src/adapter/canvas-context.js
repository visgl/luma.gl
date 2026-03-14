// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { CanvasSurface } from './canvas-surface';
/**
 * Manages a renderable backend canvas. Supports both HTML or offscreen canvas
 * and returns backend framebuffers sourced from the canvas itself.
 */
export class CanvasContext extends CanvasSurface {
    static defaultProps = CanvasSurface.defaultProps;
}
