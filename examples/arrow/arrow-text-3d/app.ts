// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import {parseFont} from '@luma.gl/text/text-3d';
import {Matrix4, type NumberArray4} from '@math.gl/core';
import {ArrowText3DRenderer} from './arrow-text-3d-renderer';
import {CRAWL_TEXT_ROWS} from './arrow-text-3d-data';
import {helvetiker} from '../../experimental/text-3d/helvetiker-font';

export const title = '3D Text';
export const description = 'Perspective space crawl built from Apache Arrow Utf8 glyph rows.';

const TEXT_3D_COLOR_STORAGE_KEY = 'text-3d-crawl-color';
const DEFAULT_CRAWL_COLOR: [number, number, number, number] = [1, 0.62, 0.32, 1];
const YELLOW_CRAWL_COLOR: [number, number, number, number] = [1, 0.9, 0.32, 1];
const font = parseFont(helvetiker);

/** Animates grouped Arrow glyph instances through the existing 3D crawl camera. */
export default class ArrowText3DAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = `
<p>Stores crawl rows in Apache Arrow Utf8, expands visible glyphs into grouped Arrow instance batches, and reuses one shared extruded glyph atlas.</p>
<p>Each used glyph draws once with a shared geometry range and its grouped Arrow instance offsets.</p>
`;

  modelMatrix = new Matrix4();
  normalMatrix = new Matrix4();
  viewMatrix = new Matrix4().lookAt({eye: [0, 40, 980], center: [0, -520, -520]});
  projectionMatrix = new Matrix4();
  layer: ArrowText3DRenderer;
  /** Horizontal translation that centers the generated text geometry. */
  geometryOffset: [number, number, number];
  textMinY = 0;
  textHeight = 0;
  textWidth = 0;
  leadInHeight = 420;
  leadOutHeight = 520;
  scrollSpeedWorldUnitsPerSecond = 120;
  baseDepthOffset = -320;
  baseScale: [number, number, number] = [1.08, 1.08, 1];

  constructor({device}: AnimationProps) {
    super();

    this.layer = new ArrowText3DRenderer(device, {
      textRows: CRAWL_TEXT_ROWS,
      font,
      size: 56,
      depth: 16,
      bevelEnabled: true,
      bevelThickness: 2.5,
      bevelSize: 3.5,
      bevelSegments: 2,
      curveSegments: 4
    });

    const {min, max} = this.layer.bounds;
    const centerX = (min[0] + max[0]) / 2;
    const centerZ = (min[2] + max[2]) / 2;
    this.geometryOffset = [-centerX, -max[1], -centerZ];
    this.textMinY = min[1];
    this.textWidth = max[0] - min[0];
    this.textHeight = max[1] - min[1];
  }

  onRender({device, tick, aspect}: AnimationProps): void {
    const elapsedSeconds = tick * 0.016;
    const totalTravel = this.leadInHeight + this.textHeight + this.leadOutHeight;
    const distanceTraveled = (elapsedSeconds * this.scrollSpeedWorldUnitsPerSecond) % totalTravel;
    const verticalOffset = -this.leadInHeight + distanceTraveled;
    const depthOffset = this.baseDepthOffset;

    this.modelMatrix
      .identity()
      .translate([0, 0, depthOffset])
      .rotateX(-1.24)
      .translate([0, verticalOffset, 0])
      .scale(this.baseScale)
      .translate(this.geometryOffset);

    this.normalMatrix.copy(this.modelMatrix).invert().transpose();
    this.projectionMatrix.perspective({fovy: Math.PI / 3.9, aspect, near: 24, far: 3200});

    this.layer.setProps({
      app: {
        modelMatrix: this.modelMatrix,
        viewMatrix: this.viewMatrix,
        projectionMatrix: this.projectionMatrix,
        normalMatrix: this.normalMatrix,
        time: tick * 0.016,
        crawlColor: getCrawlColor(),
        fade: [-260, -80, 960, 1360]
      }
    });
    this.layer.predraw(device.commandEncoder);

    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1], clearDepth: 1});
    this.layer.draw(renderPass);
    renderPass.end();
  }

  onFinalize(): void {
    this.layer.destroy();
  }
}

/** Returns the website control-selected crawl color. */
function getCrawlColor(): NumberArray4 {
  if (typeof window === 'undefined') {
    return DEFAULT_CRAWL_COLOR;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const crawlColor =
    searchParams.get('crawlColor') ?? window.localStorage.getItem(TEXT_3D_COLOR_STORAGE_KEY);
  return crawlColor === 'yellow' ? YELLOW_CRAWL_COLOR : DEFAULT_CRAWL_COLOR;
}
