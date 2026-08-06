// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

const EXAMPLE_THUMBNAIL_ALIASES: Readonly<Record<string, string>> = {
  'v10/gpgpu': 'gpu-tables/gpu-vector-storage-particles',
  'experimental/gpu-trace-scene': 'experimental/gpu-trace-viewer',
  'experimental/gpu-scene-graph': 'experimental/gpu-frustum-culling',
  'showcase/gaussian-splat-viewer': 'showcase/gaussian-splats'
};

export function getExampleThumbnailPath(exampleIdentifier: string): string {
  return `${EXAMPLE_THUMBNAIL_ALIASES[exampleIdentifier] ?? exampleIdentifier}.jpg`;
}
