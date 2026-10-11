// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {ANARIFrame} from './anari-objects';
import type {ANARIFrameStatistics, ANARIPickResult, ANARIFrameChannels} from './anari-types';

/** Backend contract used by ANARI renderer subtypes. */
export interface ANARIRendererRuntime {
  render(frame: ANARIFrame): ANARIFrameStatistics;
  /** Optional primary-ray picking for a previously submitted frame. */
  pick?(frame: ANARIFrame, x: number, y: number): Promise<ANARIPickResult | null>;
  /** Optional caller-owned primary-hit GPU snapshot of a submitted frame. */
  captureChannels?(frame: ANARIFrame): ANARIFrameChannels | null;
  destroyFrame(frame: ANARIFrame): void;
  destroy(): void;
}

/** Lazily creates the rendering backend for one or more registered renderer subtypes. */
export type ANARIRendererRuntimeFactory = (device: Device) => ANARIRendererRuntime;
