// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {makeArrowFilteringTable, type ArrowFilteringTable} from './arrow-filtering-data';
import {ArrowFilteringControlPanel, type ArrowFilteringControlState} from './control-panel';
import {ArrowExamplePanelManager} from '../arrow-example-panels';

/** Owns filter source generation and controls. */
export class ArrowFilteringSource {
  readonly panels: ArrowExamplePanelManager;
  readonly controlPanel: ArrowFilteringControlPanel;
  readonly initialState: ArrowFilteringControlState = {enabled: true, min: 0.2, max: 0.8};

  constructor(
    private readonly onSourceChange: (table: ArrowFilteringTable) => void,
    private readonly onFilterPropsChange: (state: ArrowFilteringControlState) => void
  ) {
    this.controlPanel = new ArrowFilteringControlPanel(
      this.initialState,
      state => this.onFilterPropsChange(state),
      () => this.panels.refresh()
    );
    this.panels = new ArrowExamplePanelManager({
      descriptionPanel: () => this.controlPanel.makeDescriptionPanel(),
      settingsPanel: () => this.controlPanel.makeSettingsPanel()
    });
  }

  initialize(): void {
    this.panels.mount();
    const table = makeArrowFilteringTable();
    this.panels.setTableEntries([
      {id: 'arrow-filtering-source', label: 'Filterable points', kind: 'source', table}
    ]);
    this.onSourceChange(table);
    this.onFilterPropsChange(this.initialState);
  }

  finalize(): void {
    this.controlPanel.destroy();
    this.panels.finalize();
  }
}
