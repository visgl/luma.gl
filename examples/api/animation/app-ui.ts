// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {ColumnPanel, type Panel, type SettingsSchema} from '@deck.gl-community/panels';
import type {Timeline} from '@luma.gl/engine';
import {ExampleSettingsPanelManager, makeHtmlCustomPanel} from '../../example-panels';

export function makeAnimationPanel(
  settingsPanel: ExampleSettingsPanelManager,
  timeline: Timeline
): Panel {
  return new ColumnPanel({
    id: 'animation-controls',
    title: 'Controls',
    panels: [
      makeHtmlCustomPanel({
        id: 'animation-actions',
        title: '',
        html: `\
          <p>Key frame animation based on multiple hierarchical timelines.</p>
          <div style="display: flex; gap: 8px;">
            <button id="play" type="button">Play</button>
            <button id="pause" type="button">Pause</button>
          </div>
          `,
        onRender: rootElement => {
          const playButton = rootElement.querySelector<HTMLButtonElement>('#play');
          const pauseButton = rootElement.querySelector<HTMLButtonElement>('#pause');
          const handlePlay = () => timeline.play();
          const handlePause = () => timeline.pause();
          playButton?.addEventListener('click', handlePlay);
          pauseButton?.addEventListener('click', handlePause);
          return () => {
            playButton?.removeEventListener('click', handlePlay);
            pauseButton?.removeEventListener('click', handlePause);
          };
        }
      }),
      settingsPanel.makePanel()
    ]
  });
}

export function makeAnimationSettingsSchema(): SettingsSchema {
  return {
    title: 'Settings',
    sections: [
      {
        id: 'timeline',
        name: 'Timeline',
        initiallyCollapsed: false,
        settings: [
          {
            name: 'time',
            label: 'Time',
            type: 'number',
            persist: 'none',
            min: 0,
            max: 30000,
            step: 1
          }
        ]
      }
    ]
  };
}
