// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {_resolveLoadFileUrl, AnimationLoopTemplate} from '@luma.gl/engine';
import {
  buildBitmapFontAtlas,
  buildSdfFontAtlas,
  loadMsdfFontAtlas,
  type FontAtlas
} from '@luma.gl/text';
import {parseFont, type Text3DBounds} from '@luma.gl/text/text-3d';
import {Matrix4} from '@math.gl/core';
import {ArrowAtlasText3DRenderer} from './arrow-atlas-text-3d-renderer';
import {ArrowText3DRenderer} from './arrow-text-3d-renderer';
import {CRAWL_TEXT_ROWS} from './arrow-text-3d-data';
import {
  ArrowText3DControlPanel,
  getArrowText3DBrowserFontFamily,
  getArrowText3DBrowserFontKind,
  getArrowText3DCrawlColor,
  getArrowText3DRenderingKind,
  setArrowText3DBrowserFontKind,
  setArrowText3DRenderingKind,
  type ArrowText3DBrowserFontKind,
  type ArrowText3DRenderingKind
} from './control-panel';
import {helvetiker} from '../../experimental/text-3d/helvetiker-font';
import {ArrowExamplePanelManager, makeArrowExamplePanelHostHtml} from '../arrow-example-panels';

export const title = 'Arrow Space Crawl';
export const description =
  'Perspective space crawl comparing extruded, bitmap, SDF, and MSDF text rendering.';

const font = parseFont(helvetiker);
const CRAWL_CHARACTER_SET = [...new Set(CRAWL_TEXT_ROWS.join(''))].join('');
const DEFAULT_RENDERING_KIND = getArrowText3DRenderingKind();
const DEFAULT_BROWSER_FONT_KIND = getArrowText3DBrowserFontKind();
const GENERATED_FONT_SETTINGS = {
  characterSet: CRAWL_CHARACTER_SET,
  fontWeight: '600',
  fontSize: 64,
  buffer: 6
} as const;
type TextCrawlRenderer = ArrowText3DRenderer | ArrowAtlasText3DRenderer;

/** Animates comparable Arrow text renderers through the existing 3D crawl camera. */
export class ArrowText3DDataSourceController extends AnimationLoopTemplate {
  static info = makeArrowExamplePanelHostHtml();

  readonly panels = new ArrowExamplePanelManager({
    descriptionPanel: () => this.controlPanel.makeDescriptionPanel(),
    settingsPanel: () => this.controlPanel.makeSettingsPanel()
  });
  readonly controlPanel = new ArrowText3DControlPanel({
    onRefresh: () => this.panels.refresh(),
    onRenderingKindChange: renderingKind => this.setRenderingKind(renderingKind),
    onBrowserFontKindChange: browserFontKind => this.setBrowserFontKind(browserFontKind),
    initialRenderingKind: DEFAULT_RENDERING_KIND,
    initialBrowserFontKind: DEFAULT_BROWSER_FONT_KIND
  });
  readonly device: Device;
  modelMatrix = new Matrix4();
  normalMatrix = new Matrix4();
  viewMatrix = new Matrix4().lookAt({eye: [0, 40, 980], center: [0, -520, -520]});
  projectionMatrix = new Matrix4();
  layer: TextCrawlRenderer | null = null;
  renderingKind = DEFAULT_RENDERING_KIND;
  browserFontKind = DEFAULT_BROWSER_FONT_KIND;
  /** Horizontal translation that centers the generated text geometry. */
  geometryOffset: [number, number, number] = [0, 0, 0];
  textMinY = 0;
  textHeight = 0;
  textWidth = 0;
  leadInHeight = 420;
  leadOutHeight = 520;
  scrollSpeedWorldUnitsPerSecond = 120;
  baseDepthOffset = -320;
  baseScale: [number, number, number] = [1.08, 1.08, 1];
  private rendererLoadVersion = 0;
  private msdfFontAtlasPromise: Promise<FontAtlas> | null = null;
  private isFinalized = false;

  constructor({device}: AnimationProps) {
    super();
    this.device = device;
  }

  override async onInitialize(): Promise<void> {
    await this.setRenderingKind(this.renderingKind);
    if (this.isFinalized || !this.layer) {
      return;
    }
    this.panels.mount();
    this.controlPanel.initialize();
    this.syncTableEntries();
  }

  onRender({device, tick, aspect}: AnimationProps): void {
    if (!this.layer) {
      return;
    }
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
        fade: [-260, -80, 960, 1360],
        glyphWorldScale: this.layer.glyphWorldScale ?? 1
      }
    });
    this.layer.predraw(device.commandEncoder);

    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1], clearDepth: 1});
    this.layer.draw(renderPass);
    renderPass.end();
  }

  onFinalize(): void {
    this.isFinalized = true;
    this.rendererLoadVersion++;
    this.controlPanel.destroy();
    this.panels.finalize();
    this.layer?.destroy();
  }

  private async setRenderingKind(
    renderingKind: ArrowText3DRenderingKind,
    options: {force?: boolean} = {}
  ): Promise<void> {
    setArrowText3DRenderingKind(renderingKind);
    if (!options.force && renderingKind === this.renderingKind && this.layer) {
      this.controlPanel.syncControls({renderingKind, browserFontKind: this.browserFontKind});
      return;
    }
    const rendererLoadVersion = ++this.rendererLoadVersion;
    const nextLayer = await this.createRenderer(renderingKind);
    if (this.isFinalized || rendererLoadVersion !== this.rendererLoadVersion) {
      nextLayer.destroy();
      return;
    }

    const previousLayer = this.layer;
    this.layer = nextLayer;
    this.renderingKind = renderingKind;
    this.setTextBounds(nextLayer.bounds);
    this.controlPanel.syncControls({renderingKind, browserFontKind: this.browserFontKind});
    this.syncTableEntries();
    previousLayer?.destroy();
  }

  private async setBrowserFontKind(browserFontKind: ArrowText3DBrowserFontKind): Promise<void> {
    setArrowText3DBrowserFontKind(browserFontKind);
    if (browserFontKind === this.browserFontKind) {
      this.controlPanel.syncControls({browserFontKind});
      return;
    }

    this.browserFontKind = browserFontKind;
    if (this.renderingKind === 'bitmap' || this.renderingKind === 'sdf') {
      await this.setRenderingKind(this.renderingKind, {force: true});
      return;
    }
    this.controlPanel.syncControls({browserFontKind});
  }

  private async createRenderer(
    renderingKind: ArrowText3DRenderingKind
  ): Promise<TextCrawlRenderer> {
    if (renderingKind === 'extruded') {
      return new ArrowText3DRenderer(this.device, {
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
    }
    return await ArrowAtlasText3DRenderer.create(this.device, {
      textRows: CRAWL_TEXT_ROWS,
      fontAtlas: await this.getFontAtlas(renderingKind)
    });
  }

  private async getFontAtlas(
    renderingKind: Exclude<ArrowText3DRenderingKind, 'extruded'>
  ): Promise<FontAtlas> {
    if (renderingKind === 'msdf') {
      this.msdfFontAtlasPromise ||= loadMsdfFontAtlas(getMsdfFontUrl());
      return await this.msdfFontAtlasPromise;
    }
    const fontAtlasSettings = {
      ...GENERATED_FONT_SETTINGS,
      fontFamily: getArrowText3DBrowserFontFamily(this.browserFontKind)
    };
    return renderingKind === 'sdf'
      ? buildSdfFontAtlas({...fontAtlasSettings, radius: 12})
      : buildBitmapFontAtlas(fontAtlasSettings);
  }

  private setTextBounds({min, max}: Text3DBounds): void {
    const centerX = (min[0] + max[0]) / 2;
    const centerZ = (min[2] + max[2]) / 2;
    this.geometryOffset = [-centerX, -max[1], -centerZ];
    this.textMinY = min[1];
    this.textWidth = max[0] - min[0];
    this.textHeight = max[1] - min[1];
  }

  private syncTableEntries(): void {
    const layer = this.layer;
    if (!layer) {
      return;
    }
    this.panels.setTableEntries([
      {
        id: 'text-3d-source',
        label: 'Crawl rows',
        kind: 'source',
        table: layer.textTable
      },
      ...(layer instanceof ArrowText3DRenderer
        ? [
            {
              id: 'text-3d-glyphs',
              label: 'Grouped glyph instances',
              kind: 'derived' as const,
              table: layer.glyphInstanceArrowTable
            }
          ]
        : [])
    ]);
  }
}

function getMsdfFontUrl(): string {
  return _resolveLoadFileUrl('fonts/oswald-msdf.json');
}
