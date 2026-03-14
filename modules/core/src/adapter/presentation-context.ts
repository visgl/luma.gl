// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {CanvasSurface} from './canvas-surface';

export type {CanvasContextProps as PresentationContextProps} from './canvas-surface';

/**
 * Tracks a destination canvas while rendering into the device's primary GPU-backed canvas.
 * Subclasses provide a copy-present step via `present()`.
 */
export abstract class PresentationContext extends CanvasSurface {
  abstract present(): void;
}
