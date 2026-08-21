// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

const EXAMPLE_THUMBNAIL_ALIASES: Readonly<Record<string, string>> = {
  'experimental/gpgpu': 'experimental/gpu-data-analysis',
  'experimental/gpu-graph-explorer': 'showcase/packet-spraying',
  'experimental/gpu-trace-scene': 'experimental/gpu-trace-viewer',
  'experimental/gpu-scene-graph': 'experimental/gpu-frustum-culling'
};

export function getExampleThumbnailPath(exampleIdentifier: string): string {
  return `${EXAMPLE_THUMBNAIL_ALIASES[exampleIdentifier] ?? exampleIdentifier}.jpg`;
}
