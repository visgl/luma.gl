// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import {parseFont} from '@luma.gl/text/text-3d';
import {Matrix4} from '@math.gl/core';
import {ArrowText3DRenderer} from './arrow-text-3d-renderer';
import {CRAWL_TEXT_ROWS} from './arrow-text-3d-data';
import {ArrowText3DControlPanel, getArrowText3DCrawlColor} from './control-panel';
import {helvetiker} from '../../experimental/text-3d/helvetiker-font';
import {ArrowExamplePanelManager, makeArrowExamplePanelHostHtml} from '../arrow-example-panels';

export const title = '3D Text';
export const description = 'Perspective space crawl built from Apache Arrow Utf8 glyph rows.';

const font = parseFont(helvetiker);

/** Animates grouped Arrow glyph instances through the existing 3D crawl camera. */
export default class ArrowText3DAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowExamplePanelHostHtml();

  readonly panels = new ArrowExamplePanelManager({
    descriptionPanel: () => this.controlPanel.makeDescriptionPanel(),
    settingsPanel: () => this.controlPanel.makeSettingsPanel()
  });
  readonly controlPanel = new ArrowText3DControlPanel({onRefresh: () => this.panels.refresh()});
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
    this.panels.mount();
    this.controlPanel.initialize();
    this.panels.setTableEntries([
      {
        id: 'text-3d-source',
        label: 'Crawl rows',
        kind: 'source',
        table: this.layer.textTable
      },
      {
        id: 'text-3d-glyphs',
        label: 'Grouped glyph instances',
        kind: 'derived',
        table: this.layer.glyphInstanceArrowTable
      }
    ]);
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
        crawlColor: getArrowText3DCrawlColor(),
        fade: [-260, -80, 960, 1360]
      }
    });
    this.layer.predraw(device.commandEncoder);

    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1], clearDepth: 1});
    this.layer.draw(renderPass);
    renderPass.end();
  }

  onFinalize(): void {
    this.controlPanel.destroy();
    this.panels.finalize();
    this.layer.destroy();
  }
}
