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
  getTextSpaceCrawlColorKind,
  setTextSpaceCrawlColorKind,
  type TextSpaceCrawlColorKind
} from '../../text-space-crawl-color';

export type TextSpaceCrawlRenderingKind = 'extruded' | 'bitmap' | 'sdf' | 'msdf';
export type TextSpaceCrawlBrowserFontKind = 'monospace' | 'sans-serif' | 'serif';

const TEXT_RENDERING_QUERY_PARAMETER = 'textRendering';
const TEXT_BROWSER_FONT_QUERY_PARAMETER = 'textFont';
type TextSpaceCrawlWindow = Pick<Window, 'history' | 'location'>;

export class TextSpaceCrawlControlPanel {
  private readonly onRefresh: () => void;
  private readonly onRenderingKindChange: (
    renderingKind: TextSpaceCrawlRenderingKind
  ) => void | Promise<void>;
  private readonly onBrowserFontKindChange: (
    browserFontKind: TextSpaceCrawlBrowserFontKind
  ) => void | Promise<void>;
  private readonly settingsPanel: ExampleSettingsPanelManager;
  private crawlColorKind = getTextSpaceCrawlColorKind();
  private renderingKind: TextSpaceCrawlRenderingKind;
  private browserFontKind: TextSpaceCrawlBrowserFontKind;

  constructor({
    onRefresh,
    onRenderingKindChange,
    onBrowserFontKindChange,
    initialRenderingKind,
    initialBrowserFontKind
  }: {
    onRefresh: () => void;
    onRenderingKindChange: (renderingKind: TextSpaceCrawlRenderingKind) => void | Promise<void>;
    onBrowserFontKindChange: (
      browserFontKind: TextSpaceCrawlBrowserFontKind
    ) => void | Promise<void>;
    initialRenderingKind: TextSpaceCrawlRenderingKind;
    initialBrowserFontKind: TextSpaceCrawlBrowserFontKind;
  }) {
    this.onRefresh = onRefresh;
    this.onRenderingKindChange = onRenderingKindChange;
    this.onBrowserFontKindChange = onBrowserFontKindChange;
    this.renderingKind = initialRenderingKind;
    this.browserFontKind = initialBrowserFontKind;
    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'text-space-crawl-settings',
      schema: makeTextSpaceCrawlSettingsSchema(this.renderingKind),
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
      id: 'text-space-crawl-description',
      title: 'Description',
      html: makeTextSpaceCrawlControlPanelHtml(this.renderingKind)
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
    crawlColorKind?: TextSpaceCrawlColorKind;
    renderingKind?: TextSpaceCrawlRenderingKind;
    browserFontKind?: TextSpaceCrawlBrowserFontKind;
  }): void {
    const {
      crawlColorKind = this.crawlColorKind,
      renderingKind = this.renderingKind,
      browserFontKind = this.browserFontKind
    } = props;
    this.crawlColorKind = crawlColorKind;
    this.renderingKind = renderingKind;
    this.browserFontKind = browserFontKind;
    this.settingsPanel.setSchemaAndSettings(makeTextSpaceCrawlSettingsSchema(renderingKind), {
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
    if (isTextSpaceCrawlRenderingKind(renderingKind)) {
      this.renderingKind = renderingKind;
      setTextSpaceCrawlRenderingKind(renderingKind);
      void this.onRenderingKindChange(renderingKind);
    }
    const browserFontKind = getChangedSetting(changedSettings, 'browserFontKind')?.nextValue;
    if (isTextSpaceCrawlBrowserFontKind(browserFontKind)) {
      this.browserFontKind = browserFontKind;
      setTextSpaceCrawlBrowserFontKind(browserFontKind);
      void this.onBrowserFontKindChange(browserFontKind);
    }
    const crawlColorKind = getChangedSetting(changedSettings, 'crawlColorKind')?.nextValue;
    if (!isTextSpaceCrawlColorKind(crawlColorKind)) {
      return;
    }
    this.crawlColorKind = crawlColorKind;
    setTextSpaceCrawlColorKind(crawlColorKind);
  };
}

export function makeTextSpaceCrawlSettingsSchema(
  renderingKind: TextSpaceCrawlRenderingKind
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

export function makeTextSpaceCrawlControlPanelHtml(
  renderingKind: TextSpaceCrawlRenderingKind
): string {
  const renderingDescription =
    renderingKind === 'extruded'
      ? 'Extruded typeface text uses conventional beveled geometry.'
      : `${getAtlasRenderingLabel(renderingKind)} renders one perspective atlas quad per visible glyph.`;
  const browserFontDescription = usesBrowserFont(renderingKind)
    ? ' The selected browser font regenerates this atlas.'
    : '';
  return `\
  <p>Compares extruded typeface geometry, generated bitmap atlas text, generated SDF atlas text, and prebuilt MSDF atlas text.</p>
  <p>${renderingDescription}${browserFontDescription}</p>
  `;
}

export function getTextSpaceCrawlRenderingKind(
  currentWindow = getCurrentWindow()
): TextSpaceCrawlRenderingKind {
  const renderingKind = currentWindow
    ? new URLSearchParams(currentWindow.location.search).get(TEXT_RENDERING_QUERY_PARAMETER)
    : null;
  return isTextSpaceCrawlRenderingKind(renderingKind) ? renderingKind : 'msdf';
}

export function setTextSpaceCrawlRenderingKind(
  renderingKind: TextSpaceCrawlRenderingKind,
  currentWindow = getCurrentWindow()
): void {
  if (!currentWindow) {
    return;
  }

  const searchParams = new URLSearchParams(currentWindow.location.search);
  if (renderingKind === 'msdf') {
    searchParams.delete(TEXT_RENDERING_QUERY_PARAMETER);
  } else {
    searchParams.set(TEXT_RENDERING_QUERY_PARAMETER, renderingKind);
  }

  const search = searchParams.toString();
  const nextUrl = `${currentWindow.location.pathname}${search ? `?${search}` : ''}${currentWindow.location.hash}`;
  currentWindow.history.replaceState({}, '', nextUrl);
}

export function getTextSpaceCrawlBrowserFontKind(
  currentWindow = getCurrentWindow()
): TextSpaceCrawlBrowserFontKind {
  const browserFontKind = currentWindow
    ? new URLSearchParams(currentWindow.location.search).get(TEXT_BROWSER_FONT_QUERY_PARAMETER)
    : null;
  return isTextSpaceCrawlBrowserFontKind(browserFontKind) ? browserFontKind : 'monospace';
}

export function setTextSpaceCrawlBrowserFontKind(
  browserFontKind: TextSpaceCrawlBrowserFontKind,
  currentWindow = getCurrentWindow()
): void {
  if (!currentWindow) {
    return;
  }

  const searchParams = new URLSearchParams(currentWindow.location.search);
  if (browserFontKind === 'monospace') {
    searchParams.delete(TEXT_BROWSER_FONT_QUERY_PARAMETER);
  } else {
    searchParams.set(TEXT_BROWSER_FONT_QUERY_PARAMETER, browserFontKind);
  }

  const search = searchParams.toString();
  const nextUrl = `${currentWindow.location.pathname}${search ? `?${search}` : ''}${currentWindow.location.hash}`;
  currentWindow.history.replaceState({}, '', nextUrl);
}

export function getTextSpaceCrawlBrowserFontFamily(
  browserFontKind: TextSpaceCrawlBrowserFontKind
): string {
  return browserFontKind === 'sans-serif'
    ? 'Avenir Next, Helvetica Neue, Arial, sans-serif'
    : browserFontKind === 'serif'
      ? 'Georgia, Times New Roman, serif'
      : 'Monaco, Menlo, monospace';
}

function getAtlasRenderingLabel(renderingKind: Exclude<TextSpaceCrawlRenderingKind, 'extruded'>) {
  return renderingKind === 'msdf'
    ? 'Prebuilt MSDF atlas text'
    : renderingKind === 'sdf'
      ? 'Generated SDF atlas text'
      : 'Generated bitmap atlas text';
}

function isTextSpaceCrawlRenderingKind(value: unknown): value is TextSpaceCrawlRenderingKind {
  return value === 'extruded' || value === 'bitmap' || value === 'sdf' || value === 'msdf';
}

function isTextSpaceCrawlBrowserFontKind(value: unknown): value is TextSpaceCrawlBrowserFontKind {
  return value === 'monospace' || value === 'sans-serif' || value === 'serif';
}

function usesBrowserFont(renderingKind: TextSpaceCrawlRenderingKind): boolean {
  return renderingKind === 'bitmap' || renderingKind === 'sdf';
}

function isTextSpaceCrawlColorKind(value: unknown): value is TextSpaceCrawlColorKind {
  return value === 'copper' || value === 'yellow';
}

function getCurrentWindow(): TextSpaceCrawlWindow | null {
  return typeof window === 'undefined' ? null : window;
}
