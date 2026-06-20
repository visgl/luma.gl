// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Panel, SettingsChangeDescriptor, SettingsSchema} from '@deck.gl-community/panels';
import {
  ExampleSettingsPanelManager,
  getChangedSetting,
  makeHtmlCustomPanel
} from '../../example-panels';

export type ArrowFilteringControlState = {
  enabled: boolean;
  min: number;
  max: number;
};

export class ArrowFilteringControlPanel {
  private state: ArrowFilteringControlState;
  private readonly settingsPanel: ExampleSettingsPanelManager;
  private readonly onChange: (state: ArrowFilteringControlState) => void;
  private readonly onRefresh: () => void;

  constructor(
    initialState: ArrowFilteringControlState,
    onChange: (state: ArrowFilteringControlState) => void,
    onRefresh: () => void
  ) {
    this.state = initialState;
    this.onChange = onChange;
    this.onRefresh = onRefresh;
    this.settingsPanel = new ExampleSettingsPanelManager({
      id: 'arrow-filtering-settings',
      schema: makeArrowFilteringSettingsSchema(),
      settings: initialState,
      onSettingsChange: this.handleSettingsChange
    });
  }

  makeDescriptionPanel(): Panel {
    return makeHtmlCustomPanel({
      id: 'arrow-filtering-description',
      title: 'Description',
      html: `<p>Arrow point attributes are uploaded once. Range edits update only the <code>filter</code> shader module uniforms used by <code>filterShaderPlugin</code>.</p>`
    });
  }

  makeSettingsPanel(): Panel {
    return this.settingsPanel.makePanel();
  }

  destroy(): void {
    this.settingsPanel.finalize();
  }

  private readonly handleSettingsChange = (
    settings: Record<string, unknown>,
    changedSettings?: SettingsChangeDescriptor[]
  ): void => {
    const nextState = {...(settings as ArrowFilteringControlState)};
    const minimumChanged =
      Boolean(getChangedSetting(changedSettings, 'min')) || nextState.min !== this.state.min;
    const maximumChanged =
      Boolean(getChangedSetting(changedSettings, 'max')) || nextState.max !== this.state.max;
    if (nextState.min > nextState.max && minimumChanged && !maximumChanged) {
      nextState.min = Math.min(nextState.min, this.state.max);
      nextState.max = this.state.max;
    } else if (nextState.min > nextState.max && maximumChanged) {
      nextState.min = this.state.min;
      nextState.max = Math.max(nextState.max, this.state.min);
    }
    this.state = {...nextState};
    this.settingsPanel.setSettings(this.state);
    this.onRefresh();
    this.onChange(this.state);
  };
}

function makeArrowFilteringSettingsSchema(): SettingsSchema {
  return {
    title: 'Filter',
    sections: [
      {
        id: 'range',
        name: 'Scalar range',
        initiallyCollapsed: false,
        settings: [
          {name: 'enabled', label: 'Enabled', type: 'boolean', persist: 'none'},
          {
            name: 'min',
            label: 'Minimum',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1,
            step: 0.01
          },
          {
            name: 'max',
            label: 'Maximum',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 1,
            step: 0.01
          }
        ]
      }
    ]
  };
}
