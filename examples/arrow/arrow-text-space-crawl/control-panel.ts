// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  type Panel,
  type SettingsChangeDescriptor,
  type SettingsSchema
} from '@deck.gl-community/panels';
import {
  ExampleSettingsPanelManager,
  getChangedSetting,
  makeHtmlCustomPanel
} from '../../example-panels';
import {
  getText3DCrawlColor,
  getText3DCrawlColorKind,
  setText3DCrawlColorKind,
  type Text3DCrawlColorKind
} from '../../text-3d-crawl-color';

export type ArrowText3DCrawlColorKind = Text3DCrawlColorKind;
export type ArrowText3DRenderingKind = 'extruded' | 'bitmap' | 'sdf' | 'msdf';
export type ArrowText3DBrowserFontKind = 'monospace' | 'sans-serif' | 'serif';

const TEXT_3D_RENDERING_QUERY_PARAMETER = 'textRendering';
const TEXT_3D_BROWSER_FONT_QUERY_PARAMETER = 'textFont';
type ArrowText3DWindow = Pick<Window, 'history' | 'location'>;

export class ArrowText3DControlPanel {
  private readonly onRefresh: () => void;
  private readonly onRenderingKindChange: (
    renderingKind: ArrowText3DRenderingKind
  ) => void | Promise<void>;
  private readonly onBrowserFontKindChange: (
    browserFontKind: ArrowText3DBrowserFontKind
  ) => void | Promise<void>;
  private readonly settingsPanel: ExampleSettingsPanelManager;
  private crawlColorKind = getText3DCrawlColorKind();
  private renderingKind: ArrowText3DRenderingKind;
  private browserFontKind: ArrowText3DBrowserFontKind;

  constructor({
    onRefresh,
    onRenderingKindChange,
    onBrowserFontKindChange,
    initialRenderingKind,
    initialBrowserFontKind
  }: {
    onRefresh: () => void;
    onRenderingKindChange: (renderingKind: ArrowText3DRenderingKind) => void | Promise<void>;
    onBrowserFontKindChange: (browserFontKind: ArrowText3DBrowserFontKind) => void | Promise<void>;
    initialRenderingKind: ArrowText3DRenderingKind;
    initialBrowserFontKind: ArrowText3DBrowserFontKind;
  }) {
    this.onRefresh = onRefresh;
    this.onRenderingKindChange = onRenderingKindChange;
    this.onBrowserFontKindChange = onBrowserFontKindChange;
    this.renderingKind = initialRenderingKind;
    this.browserFontKind = initialBrowserFontKind;
    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'arrow-text-3d-settings',
      schema: makeArrowText3DSettingsSchema(this.renderingKind),
      settings: {
        crawlColorKind: this.crawlColorKind,
        renderingKind: this.renderingKind,
        browserFontKind: this.browserFontKind
      },
      onSettingsChange: this.handleSettingsChange
    });
  }

  makeDescriptionPanel(): Panel {
    return makeHtmlCustomPanel({
      id: 'arrow-text-3d-description',
      title: 'Description',
      html: makeArrowText3DControlPanelHtml(this.renderingKind)
    });
  }

  makeSettingsPanel(): Panel {
    return this.settingsPanel.makePanel();
  }

  initialize(): void {}

  destroy(): void {
    this.settingsPanel.finalize();
  }

  syncControls(props: {
    crawlColorKind?: ArrowText3DCrawlColorKind;
    renderingKind?: ArrowText3DRenderingKind;
    browserFontKind?: ArrowText3DBrowserFontKind;
  }): void {
    const {
      crawlColorKind = this.crawlColorKind,
      renderingKind = this.renderingKind,
      browserFontKind = this.browserFontKind
    } = props;
    this.crawlColorKind = crawlColorKind;
    this.renderingKind = renderingKind;
    this.browserFontKind = browserFontKind;
    this.settingsPanel.setSchemaAndSettings(makeArrowText3DSettingsSchema(renderingKind), {
      crawlColorKind,
      renderingKind,
      browserFontKind
    });
    this.onRefresh();
  }

  private readonly handleSettingsChange = (
    settings: Record<string, unknown>,
    changedSettings?: SettingsChangeDescriptor[]
  ): void => {
    const renderingKind = getChangedSetting(changedSettings, 'renderingKind')?.nextValue;
    if (isArrowText3DRenderingKind(renderingKind)) {
      this.renderingKind = renderingKind;
      setArrowText3DRenderingKind(renderingKind);
      void this.onRenderingKindChange(renderingKind);
    }
    const browserFontKind = getChangedSetting(changedSettings, 'browserFontKind')?.nextValue;
    if (isArrowText3DBrowserFontKind(browserFontKind)) {
      this.browserFontKind = browserFontKind;
      setArrowText3DBrowserFontKind(browserFontKind);
      void this.onBrowserFontKindChange(browserFontKind);
    }
    const crawlColorKind = getChangedSetting(changedSettings, 'crawlColorKind')?.nextValue;
    if (!isText3DCrawlColorKind(crawlColorKind)) {
      return;
    }
    this.crawlColorKind = crawlColorKind;
    setText3DCrawlColorKind(crawlColorKind);
  };
}

export function makeArrowText3DSettingsSchema(
  renderingKind: ArrowText3DRenderingKind
): SettingsSchema {
  return {
    title: 'Settings',
    sections: [
      {
        id: 'style',
        name: 'Style',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'renderingKind',
            label: 'Rendering',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'MSDF atlas', value: 'msdf'},
              {label: 'SDF atlas', value: 'sdf'},
              {label: 'Bitmap atlas', value: 'bitmap'},
              {label: 'Extruded typeface', value: 'extruded'}
            ]
          },
          ...(usesBrowserFont(renderingKind)
            ? [
                {
                  name: 'browserFontKind',
                  label: 'Browser font',
                  type: 'select' as const,
                  persist: 'none' as const,
                  options: [
                    {label: 'Monospace', value: 'monospace'},
                    {label: 'Sans serif', value: 'sans-serif'},
                    {label: 'Serif', value: 'serif'}
                  ]
                }
              ]
            : []),
          {
            name: 'crawlColorKind',
            label: 'Crawl color',
            type: 'select',
            persist: 'none',
            options: [
              {label: 'Copper', value: 'copper'},
              {label: 'Yellow', value: 'yellow'}
            ]
          }
        ]
      }
    ]
  };
}

export function makeArrowText3DControlPanelHtml(renderingKind: ArrowText3DRenderingKind): string {
  const renderingDescription =
    renderingKind === 'extruded'
      ? 'Extruded typeface geometry reuses one shared mesh range per visible glyph.'
      : `${getAtlasRenderingLabel(renderingKind)} uses the shared Arrow text ` +
        '`fontAtlas` prop and renders one perspective atlas quad per visible glyph.';
  const browserFontDescription = usesBrowserFont(renderingKind)
    ? ' The selected browser font regenerates this atlas.'
    : '';
  return `\
  <p>Stores crawl rows in Apache Arrow Utf8 and switches the same crawl between extruded typeface geometry, generated bitmap atlas text, generated SDF atlas text, and prebuilt MSDF atlas text.</p>
  <p>${renderingDescription}${browserFontDescription}</p>
  `;
}

export const getArrowText3DCrawlColor = getText3DCrawlColor;

export function getArrowText3DRenderingKind(
  currentWindow = getCurrentWindow()
): ArrowText3DRenderingKind {
  const renderingKind = currentWindow
    ? new URLSearchParams(currentWindow.location.search).get(TEXT_3D_RENDERING_QUERY_PARAMETER)
    : null;
  return isArrowText3DRenderingKind(renderingKind) ? renderingKind : 'msdf';
}

export function setArrowText3DRenderingKind(
  renderingKind: ArrowText3DRenderingKind,
  currentWindow = getCurrentWindow()
): void {
  if (!currentWindow) {
    return;
  }

  const searchParams = new URLSearchParams(currentWindow.location.search);
  if (renderingKind === 'msdf') {
    searchParams.delete(TEXT_3D_RENDERING_QUERY_PARAMETER);
  } else {
    searchParams.set(TEXT_3D_RENDERING_QUERY_PARAMETER, renderingKind);
  }

  const search = searchParams.toString();
  const nextUrl = `${currentWindow.location.pathname}${search ? `?${search}` : ''}${currentWindow.location.hash}`;
  currentWindow.history.replaceState({}, '', nextUrl);
}

export function getArrowText3DBrowserFontKind(
  currentWindow = getCurrentWindow()
): ArrowText3DBrowserFontKind {
  const browserFontKind = currentWindow
    ? new URLSearchParams(currentWindow.location.search).get(TEXT_3D_BROWSER_FONT_QUERY_PARAMETER)
    : null;
  return isArrowText3DBrowserFontKind(browserFontKind) ? browserFontKind : 'monospace';
}

export function setArrowText3DBrowserFontKind(
  browserFontKind: ArrowText3DBrowserFontKind,
  currentWindow = getCurrentWindow()
): void {
  if (!currentWindow) {
    return;
  }

  const searchParams = new URLSearchParams(currentWindow.location.search);
  if (browserFontKind === 'monospace') {
    searchParams.delete(TEXT_3D_BROWSER_FONT_QUERY_PARAMETER);
  } else {
    searchParams.set(TEXT_3D_BROWSER_FONT_QUERY_PARAMETER, browserFontKind);
  }

  const search = searchParams.toString();
  const nextUrl = `${currentWindow.location.pathname}${search ? `?${search}` : ''}${currentWindow.location.hash}`;
  currentWindow.history.replaceState({}, '', nextUrl);
}

export function getArrowText3DBrowserFontFamily(
  browserFontKind: ArrowText3DBrowserFontKind
): string {
  return browserFontKind === 'sans-serif'
    ? 'Avenir Next, Helvetica Neue, Arial, sans-serif'
    : browserFontKind === 'serif'
      ? 'Georgia, Times New Roman, serif'
      : 'Monaco, Menlo, monospace';
}

function getAtlasRenderingLabel(renderingKind: Exclude<ArrowText3DRenderingKind, 'extruded'>) {
  return renderingKind === 'msdf'
    ? 'Prebuilt MSDF atlas text'
    : renderingKind === 'sdf'
      ? 'Generated SDF atlas text'
      : 'Generated bitmap atlas text';
}

function isArrowText3DRenderingKind(value: unknown): value is ArrowText3DRenderingKind {
  return value === 'extruded' || value === 'bitmap' || value === 'sdf' || value === 'msdf';
}

function isArrowText3DBrowserFontKind(value: unknown): value is ArrowText3DBrowserFontKind {
  return value === 'monospace' || value === 'sans-serif' || value === 'serif';
}

function usesBrowserFont(renderingKind: ArrowText3DRenderingKind): boolean {
  return renderingKind === 'bitmap' || renderingKind === 'sdf';
}

function isText3DCrawlColorKind(value: unknown): value is ArrowText3DCrawlColorKind {
  return value === 'copper' || value === 'yellow';
}

function getCurrentWindow(): ArrowText3DWindow | null {
  return typeof window === 'undefined' ? null : window;
}
