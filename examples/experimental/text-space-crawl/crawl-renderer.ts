// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CommandEncoder, RenderPass} from '@luma.gl/core';
import type {Text3DBounds} from '@luma.gl/text/text-3d';
import type {Matrix4, NumberArray4, NumberArray16} from '@math.gl/core';

/** Frame uniforms shared by the atlas and extruded crawl renderers. */
export type TextSpaceCrawlUniforms = {
  modelMatrix: Readonly<Matrix4 | NumberArray16>;
  viewMatrix: Readonly<Matrix4 | NumberArray16>;
  projectionMatrix: Readonly<Matrix4 | NumberArray16>;
  normalMatrix: Readonly<Matrix4 | NumberArray16>;
  time: number;
  crawlColor: Readonly<NumberArray4>;
  fade: Readonly<NumberArray4>;
  glyphWorldScale: number;
};

/** Common lifecycle used by every text rendering mode in the crawl. */
export interface TextSpaceCrawlRenderer {
  readonly bounds: Text3DBounds;
  readonly glyphWorldScale: number;
  setProps(props: {app: TextSpaceCrawlUniforms}): void;
  predraw(commandEncoder: CommandEncoder): void;
  draw(renderPass: RenderPass): void;
  destroy(): void;
}

export const IDENTITY_MATRIX: NumberArray16 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
