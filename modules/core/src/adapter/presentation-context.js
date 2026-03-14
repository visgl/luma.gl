// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import { CanvasSurface } from './canvas-surface';
/**
 * Tracks a destination canvas for presentation.
 * Backend implementations either borrow the default GPU-backed canvas (WebGL)
 * or render directly into the destination canvas (WebGPU).
 */
export class PresentationContext extends CanvasSurface {
}
