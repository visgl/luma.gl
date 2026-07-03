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
import {
  ExamplePanelManager,
  makeExamplePanelHostHtml,
  makeExampleTabbedPanel
} from '../../example-panels';
import {getTextSpaceCrawlColor} from '../../text-space-crawl-color';
import {AtlasTextRenderer} from './atlas-text-renderer';
import type {TextSpaceCrawlRenderer} from './crawl-renderer';
import {CRAWL_TEXT_ROWS} from './crawl-text';
import {
  TextSpaceCrawlControlPanel,
  getTextSpaceCrawlBrowserFontFamily,
  getTextSpaceCrawlBrowserFontKind,
  getTextSpaceCrawlRenderingKind,
  setTextSpaceCrawlBrowserFontKind,
  setTextSpaceCrawlRenderingKind,
  type TextSpaceCrawlBrowserFontKind,
  type TextSpaceCrawlRenderingKind
} from './control-panel';
import {ExtrudedTextRenderer} from './extruded-text-renderer';
import {helvetiker} from './helvetiker-font';

export const title = 'Text Space Crawl';
export const description =
  'Perspective space crawl comparing extruded, bitmap, SDF, and MSDF text rendering.';

const font = parseFont(helvetiker);
const CRAWL_CHARACTER_SET = [...new Set(CRAWL_TEXT_ROWS.join(''))].join('');
const DEFAULT_RENDERING_KIND = getTextSpaceCrawlRenderingKind();
const DEFAULT_BROWSER_FONT_KIND = getTextSpaceCrawlBrowserFontKind();
const GENERATED_FONT_SETTINGS = {
  characterSet: CRAWL_CHARACTER_SET,
  fontWeight: '600',
  fontSize: 64,
  buffer: 6
} as const;

/** Compares four text rendering techniques with one shared crawl animation. */
export default class TextSpaceCrawl extends AnimationLoopTemplate {
  static info = makeExamplePanelHostHtml();

  readonly controlPanel = new TextSpaceCrawlControlPanel({
    onRefresh: () => this.refreshPanels(),
    onRenderingKindChange: renderingKind => this.setRenderingKind(renderingKind),
    onBrowserFontKindChange: browserFontKind => this.setBrowserFontKind(browserFontKind),
    initialRenderingKind: DEFAULT_RENDERING_KIND,
    initialBrowserFontKind: DEFAULT_BROWSER_FONT_KIND
  });
  readonly panels = new ExamplePanelManager({panel: this.makePanel()});
  readonly device: Device;
  readonly modelMatrix = new Matrix4();
  readonly normalMatrix = new Matrix4();
  readonly viewMatrix = new Matrix4().lookAt({eye: [0, 40, 980], center: [0, -520, -520]});
  readonly projectionMatrix = new Matrix4();
  renderer: TextSpaceCrawlRenderer | null = null;
  renderingKind = DEFAULT_RENDERING_KIND;
  browserFontKind = DEFAULT_BROWSER_FONT_KIND;
  geometryOffset: [number, number, number] = [0, 0, 0];
  textHeight = 0;
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
    if (this.isFinalized || !this.renderer) {
      return;
    }
    this.panels.mount();
    this.controlPanel.initialize();
  }

  override onRender({device, tick, aspect}: AnimationProps): void {
    if (!this.renderer) {
      return;
    }
    const elapsedSeconds = tick * 0.016;
    const totalTravel = this.leadInHeight + this.textHeight + this.leadOutHeight;
    const distanceTraveled = (elapsedSeconds * this.scrollSpeedWorldUnitsPerSecond) % totalTravel;
    const verticalOffset = -this.leadInHeight + distanceTraveled;

    this.modelMatrix
      .identity()
      .translate([0, 0, this.baseDepthOffset])
      .rotateX(-1.24)
      .translate([0, verticalOffset, 0])
      .scale(this.baseScale)
      .translate(this.geometryOffset);

    this.normalMatrix.copy(this.modelMatrix).invert().transpose();
    this.projectionMatrix.perspective({fovy: Math.PI / 3.9, aspect, near: 24, far: 3200});
    this.renderer.setProps({
      app: {
        modelMatrix: this.modelMatrix,
        viewMatrix: this.viewMatrix,
        projectionMatrix: this.projectionMatrix,
        normalMatrix: this.normalMatrix,
        time: elapsedSeconds,
        crawlColor: getTextSpaceCrawlColor(),
        fade: [-260, -80, 960, 1360],
        glyphWorldScale: this.renderer.glyphWorldScale
      }
    });
    this.renderer.predraw(device.commandEncoder);

    const renderPass = device.beginRenderPass({clearColor: [0, 0, 0, 1], clearDepth: 1});
    this.renderer.draw(renderPass);
    renderPass.end();
  }

  override onFinalize(): void {
    this.isFinalized = true;
    this.rendererLoadVersion++;
    this.controlPanel.destroy();
    this.panels.finalize();
    this.renderer?.destroy();
  }

  private async setRenderingKind(
    renderingKind: TextSpaceCrawlRenderingKind,
    options: {force?: boolean} = {}
  ): Promise<void> {
    setTextSpaceCrawlRenderingKind(renderingKind);
    if (!options.force && renderingKind === this.renderingKind && this.renderer) {
      this.controlPanel.syncControls({renderingKind, browserFontKind: this.browserFontKind});
      return;
    }
    const rendererLoadVersion = ++this.rendererLoadVersion;
    const nextRenderer = await this.createRenderer(renderingKind);
    if (this.isFinalized || rendererLoadVersion !== this.rendererLoadVersion) {
      nextRenderer.destroy();
      return;
    }

    const previousRenderer = this.renderer;
    this.renderer = nextRenderer;
    this.renderingKind = renderingKind;
    this.setTextBounds(nextRenderer.bounds);
    this.controlPanel.syncControls({renderingKind, browserFontKind: this.browserFontKind});
    previousRenderer?.destroy();
  }

  private async setBrowserFontKind(browserFontKind: TextSpaceCrawlBrowserFontKind): Promise<void> {
    setTextSpaceCrawlBrowserFontKind(browserFontKind);
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
    renderingKind: TextSpaceCrawlRenderingKind
  ): Promise<TextSpaceCrawlRenderer> {
    if (renderingKind === 'extruded') {
      return new ExtrudedTextRenderer(this.device, {
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
    return await AtlasTextRenderer.create(this.device, {
      textRows: CRAWL_TEXT_ROWS,
      fontAtlas: await this.getFontAtlas(renderingKind)
    });
  }

  private async getFontAtlas(
    renderingKind: Exclude<TextSpaceCrawlRenderingKind, 'extruded'>
  ): Promise<FontAtlas> {
    if (renderingKind === 'msdf') {
      this.msdfFontAtlasPromise ||= loadMsdfFontAtlas(getMsdfFontUrl());
      return await this.msdfFontAtlasPromise;
    }
    const fontAtlasSettings = {
      ...GENERATED_FONT_SETTINGS,
      fontFamily: getTextSpaceCrawlBrowserFontFamily(this.browserFontKind)
    };
    return renderingKind === 'sdf'
      ? buildSdfFontAtlas({...fontAtlasSettings, radius: 12})
      : buildBitmapFontAtlas(fontAtlasSettings);
  }

  private setTextBounds({min, max}: Text3DBounds): void {
    this.geometryOffset = [-(min[0] + max[0]) / 2, -max[1], -(min[2] + max[2]) / 2];
    this.textHeight = max[1] - min[1];
  }

  private makePanel() {
    return makeExampleTabbedPanel({
      id: 'text-space-crawl-tabs',
      title: 'Text Space Crawl',
      panels: [this.controlPanel.makeDescriptionPanel(), this.controlPanel.makeSettingsPanel()]
    });
  }

  private refreshPanels(): void {
    this.panels.setPanel(this.makePanel());
  }
}

function getMsdfFontUrl(): string {
  return _resolveLoadFileUrl('fonts/oswald-msdf.json');
}
