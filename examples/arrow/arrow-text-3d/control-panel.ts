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

export class ArrowText3DControlPanel {
  private readonly onRefresh: () => void;
  private readonly settingsPanel: ExampleSettingsPanelManager;
  private crawlColorKind = getText3DCrawlColorKind();

  constructor({onRefresh}: {onRefresh: () => void}) {
    this.onRefresh = onRefresh;
    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'arrow-text-3d-settings',
      schema: makeArrowText3DSettingsSchema(),
      settings: {crawlColorKind: this.crawlColorKind},
      onSettingsChange: this.handleSettingsChange
    });
  }

  makeDescriptionPanel(): Panel {
    return makeHtmlCustomPanel({
      id: 'arrow-text-3d-description',
      title: 'Description',
      html: makeArrowText3DControlPanelHtml()
    });
  }

  makeSettingsPanel(): Panel {
    return this.settingsPanel.makePanel();
  }

  initialize(): void {}

  destroy(): void {
    this.settingsPanel.finalize();
  }

  syncControls(crawlColorKind: ArrowText3DCrawlColorKind): void {
    this.crawlColorKind = crawlColorKind;
    this.settingsPanel.setSettings({crawlColorKind});
    this.onRefresh();
  }

  private readonly handleSettingsChange = (
    settings: Record<string, unknown>,
    changedSettings?: SettingsChangeDescriptor[]
  ): void => {
    const crawlColorKind = getChangedSetting(changedSettings, 'crawlColorKind')?.nextValue;
    if (!isText3DCrawlColorKind(crawlColorKind)) {
      return;
    }
    this.crawlColorKind = crawlColorKind;
    setText3DCrawlColorKind(crawlColorKind);
  };
}

export function makeArrowText3DSettingsSchema(): SettingsSchema {
  return {
    title: 'Settings',
    sections: [
      {
        id: 'style',
        name: 'Style',
        initiallyCollapsed: false,
        settings: [
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

export function makeArrowText3DControlPanelHtml(): string {
  return `\
  <p>Stores crawl rows in Apache Arrow Utf8, expands visible glyphs into grouped Arrow instance batches, and reuses one shared extruded glyph atlas.</p>
  <p>Each used glyph draws once with a shared geometry range and its grouped Arrow instance offsets.</p>
  `;
}

export const getArrowText3DCrawlColor = getText3DCrawlColor;

function isText3DCrawlColorKind(value: unknown): value is ArrowText3DCrawlColorKind {
  return value === 'copper' || value === 'yellow';
}
