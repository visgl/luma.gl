// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device, type RenderPass} from '@luma.gl/core';
import {ClipSpace} from '@luma.gl/engine';
import {ClusteredLightGrid} from '@luma.gl/engine/lighting';
import {clusteredLightGrid} from '@luma.gl/shaders';
import {Matrix4} from '@math.gl/core';

/** GPU-only occupancy preview: each horizontal band displays a logarithmic depth slice. */
export class ClusterGridPreview {
  private readonly grid: ClusteredLightGrid;
  private readonly pointLights: Buffer;
  private readonly model: ClipSpace;

  constructor(device: Device) {
    this.grid = new ClusteredLightGrid(device, {
      clusterDimensions: [16, 9, 8],
      maxLightCount: 32,
      maxLightsPerCluster: 8
    });
    this.pointLights = device.createBuffer({
      byteLength: 32 * 32,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    this.model = new ClipSpace(device, {
      modules: [clusteredLightGrid],
      bindings: {clusterLightCounts: this.grid.clusterLightCounts},
      parameters: {depthWriteEnabled: false, depthCompare: 'always'},
      source: `
@group(0) @binding(auto) var<storage, read> clusterLightCounts: array<u32>;
@fragment fn fragmentMain(inputs: FragmentInputs) -> @location(0) vec4f {
  let coordinates = vec2f(inputs.uv.x, 1.0 - inputs.uv.y);
  let slice = min(floor(coordinates.y * 8.0), 7.0);
  let localCoordinates = vec2f(coordinates.x, fract(coordinates.y * 8.0));
  let depth = 0.1 * pow(400.0, (slice + 0.5) / 8.0);
  let index = clusteredLightGrid_getIndex(localCoordinates, depth, vec3u(16, 9, 8), 0.1, 40.0);
  let count = f32(clusterLightCounts[index]);
  return vec4f(min(count / 8.0, 1.0), min(count / 16.0, 1.0), select(0.08, 0.5, count > 8.0), 1.0);
}`
    });
  }

  encode(device: Device, viewMatrix: Matrix4, projectionMatrix: Matrix4, time: number): void {
    const records = new Float32Array(32 * 8);
    for (let index = 0; index < 32; index++) {
      const angle = index * 0.7 + time * 0.0002;
      const position = viewMatrix.transformAsPoint([
        Math.cos(angle) * 4,
        1 + (index % 4),
        Math.sin(angle) * 4
      ]);
      records.set([position[0], position[1], position[2], 1.5], index * 8);
    }
    this.pointLights.write(records);
    this.grid.encode(device.commandEncoder, {
      pointLights: this.pointLights,
      pointLightCount: 32,
      projectionMatrix,
      nearPlane: 0.1,
      farPlane: 40
    });
  }

  draw(pass: RenderPass): void {
    this.model.draw(pass);
  }

  destroy(): void {
    this.model.destroy();
    this.grid.destroy();
    this.pointLights.destroy();
  }
}
