// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {AnimationLoopTemplate, type AnimationProps, Model} from '@luma.gl/engine';
import {WEBGLRenderPass} from '@luma.gl/webgl';

export const title = 'Multi Draw';
export const description = 'Compare one WEBGL_multi_draw call with many ordinary draw calls.';

const DRAW_COUNT = 64;
const FIRSTS = new Int32Array(DRAW_COUNT);
const COUNTS = new Int32Array(DRAW_COUNT).fill(3);

const VS = /* glsl */ `#version 300 es
#extension GL_ANGLE_multi_draw : require

out vec3 vColor;

const vec2 POSITIONS[3] = vec2[3](
  vec2(-0.07, -0.07),
  vec2(0.07, -0.07),
  vec2(0.0, 0.07)
);

void main(void) {
  int column = gl_DrawID % 8;
  int row = gl_DrawID / 8;
  vec2 offset = vec2(float(column) / 4.0 - 0.875, float(row) / 4.0 - 0.875);
  gl_Position = vec4(POSITIONS[gl_VertexID] + offset, 0.0, 1.0);
  vColor = vec3(float(column) / 7.0, float(row) / 7.0, 0.75);
}
`;

const FS = /* glsl */ `#version 300 es
precision highp float;

in vec3 vColor;
out vec4 fragColor;

void main(void) {
  fragColor = vec4(vColor, 1.0);
}
`;

/** Focused WebGL example showing `gl_DrawID` supplied by `WEBGL_multi_draw`. */
export default class AppAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = `
    <div style="font:13px sans-serif;padding:12px;color:#ddd;background:#20242b">
      <b>WEBGL_multi_draw</b><br/>
      <span id="multi-draw-status">Checking extension support…</span>
    </div>`;

  readonly device: Device;
  readonly model: Model | null;

  constructor({device}: AnimationProps) {
    super();
    this.device = device;
    const supported = device.type === 'webgl' && device.features.has('multi-draw-webgl');
    this.model = supported
      ? new Model(device, {
          id: 'multi-draw-grid',
          vs: VS,
          fs: FS,
          topology: 'triangle-list',
          vertexCount: 3
        })
      : null;

    const status = document.getElementById('multi-draw-status');
    if (status) {
      status.textContent = supported
        ? `Rendering ${DRAW_COUNT} triangles in one extension call; color comes from gl_DrawID.`
        : 'WEBGL_multi_draw is unavailable on this browser/GPU.';
    }
  }

  onFinalize(): void {
    this.model?.destroy();
  }

  onRender({device}: AnimationProps): void {
    const renderPass = device.beginRenderPass({clearColor: [0.03, 0.04, 0.06, 1]});
    if (this.model && renderPass instanceof WEBGLRenderPass) {
      renderPass.setPipeline(this.model.pipeline);
      renderPass.setBindings({});
      renderPass.setVertexArray(this.model.vertexArray);
      renderPass.multiDrawArrays({
        firstsList: FIRSTS,
        countsList: COUNTS,
        drawCount: DRAW_COUNT
      });
    }
    renderPass.end();
  }
}
