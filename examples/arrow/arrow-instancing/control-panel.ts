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

export type ArrowInstancingControlPanelState = {
  instancesPerSide: number;
};

export type ArrowInstancingControlPanelHandlers = {
  onInstanceCountChange: (instancesPerSide: number) => void;
};

export type ArrowInstancingControlPanelOptions = {
  instanceCountOptions: readonly number[];
  initialState: ArrowInstancingControlPanelState;
  handlers: ArrowInstancingControlPanelHandlers;
  onRefresh: () => void;
};

export class ArrowInstancingControlPanel {
  private readonly instanceCountOptions: readonly number[];
  private readonly handlers: ArrowInstancingControlPanelHandlers;
  private readonly onRefresh: () => void;
  private readonly settingsPanel: ExampleSettingsPanelManager;
  private state: ArrowInstancingControlPanelState;

  constructor({
    instanceCountOptions,
    initialState,
    handlers,
    onRefresh
  }: ArrowInstancingControlPanelOptions) {
    this.instanceCountOptions = instanceCountOptions;
    this.state = initialState;
    this.handlers = handlers;
    this.onRefresh = onRefresh;
    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'arrow-instancing-settings',
      schema: makeArrowInstancingSettingsSchema(instanceCountOptions),
      settings: initialState,
      onSettingsChange: this.handleSettingsChange
    });
  }

  makeDescriptionPanel(): Panel {
    return makeHtmlCustomPanel({
      id: 'arrow-instancing-description',
      title: 'Description',
      html: makeArrowInstancingControlPanelHtml()
    });
  }

  makeSettingsPanel(): Panel {
    return this.settingsPanel.makePanel();
  }

  initialize(): void {}

  destroy(): void {
    this.settingsPanel.finalize();
  }

  syncControls(state: Partial<ArrowInstancingControlPanelState>): void {
    this.state = {...this.state, ...state};
    this.settingsPanel.setSettings(this.state);
    this.onRefresh();
  }

  private readonly handleSettingsChange = (
    settings: Record<string, unknown>,
    changedSettings?: SettingsChangeDescriptor[]
  ): void => {
    this.state = settings as ArrowInstancingControlPanelState;
    const instancesPerSideChange = getChangedSetting(changedSettings, 'instancesPerSide');
    const instancesPerSide = instancesPerSideChange?.nextValue;
    if (
      typeof instancesPerSide === 'number' &&
      this.instanceCountOptions.includes(instancesPerSide)
    ) {
      this.handlers.onInstanceCountChange(instancesPerSide);
    }
  };
}

export function makeArrowInstancingSettingsSchema(
  instanceCountOptions: readonly number[]
): SettingsSchema {
  return {
    title: 'Settings',
    sections: [
      {
        id: 'grid',
        name: 'Grid',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'instancesPerSide',
            label: 'Grid Size',
            type: 'select',
            persist: 'none',
            options: instanceCountOptions.map(instancesPerSide => ({
              label: `${instancesPerSide} x ${instancesPerSide} (${(instancesPerSide * instancesPerSide).toLocaleString()} cubes)`,
              value: instancesPerSide
            }))
          }
        ]
      }
    ]
  };
}

export function makeArrowInstancingControlPanelHtml(): string {
  return `\
  <p>
  A luma.gl <code>Cube</code>, rendering up to 4,194,304 instances from Arrow
  <code>FixedSizeList</code> columns in a single GPU draw call.
  The shader declares <code>vec2&lt;f32&gt;</code> positions and
  <code>vec4&lt;f32&gt;</code> colors, while Arrow column types derive
  <code>float32x2</code> and <code>unorm8x4</code> buffer layouts.
  </p>
  `;
}
