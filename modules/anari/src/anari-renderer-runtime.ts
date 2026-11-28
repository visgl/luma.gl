// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {
  RayTracingImageExportOptions,
  RayTracingImageTile
} from './engine/ray-tracing-image-export';
import type {ANARIFrame} from './anari-objects';
import type {
  ANARIFrameStatistics,
  ANARIPickResult,
  ANARIFrameChannels,
  ANARIFrameRadiance
} from './anari-types';

/** Backend contract used by ANARI renderer subtypes. */
export interface ANARIRendererRuntime {
  render(frame: ANARIFrame): ANARIFrameStatistics;
  /** Optional primary-ray picking for a previously submitted frame. */
  pick?(frame: ANARIFrame, x: number, y: number): Promise<ANARIPickResult | null>;
  /** Optional caller-owned primary-hit GPU snapshot of a submitted frame. */
  captureChannels?(frame: ANARIFrame): ANARIFrameChannels | null;
  /** Optional CPU snapshot of a submitted frame before presentation. */
  readRadiance?(frame: ANARIFrame): Promise<ANARIFrameRadiance | null>;
  /** Optional tiled still export for the current retained scene. */
  exportTiles?(
    frame: ANARIFrame,
    options: RayTracingImageExportOptions,
    format: 'rgba8' | 'rgba16float'
  ): AsyncGenerator<RayTracingImageTile>;
  destroyFrame(frame: ANARIFrame): void;
  destroy(): void;
}

/** Lazily creates the rendering backend for one or more registered renderer subtypes. */
export type ANARIRendererRuntimeFactory = (device: Device) => ANARIRendererRuntime;
