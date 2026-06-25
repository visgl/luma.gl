// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import {ArrowExamplePanelManager, makeArrowExamplePanelHostHtml} from '../arrow-example-panels';
import {makeArrowFilteringTable} from './arrow-filtering-data';
import {ArrowFilteringRenderer} from './arrow-filtering-renderer';
import {ArrowFilteringControlPanel, type ArrowFilteringControlState} from './control-panel';

export const title = 'ShaderPlugin Filtering';
export const description =
  'A portable ShaderPlugin adds an Arrow scalar vertex input and filters point instances on WebGL2 and WebGPU.';

export default class ArrowFilteringAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowExamplePanelHostHtml();

  readonly renderer: ArrowFilteringRenderer;
  readonly controlPanel: ArrowFilteringControlPanel;
  readonly panels: ArrowExamplePanelManager;

  constructor({device}: AnimationProps) {
    super();
    const arrowTable = makeArrowFilteringTable();
    this.renderer = new ArrowFilteringRenderer(device, arrowTable);
    const initialState: ArrowFilteringControlState = {enabled: true, min: 0.2, max: 0.8};
    this.renderer.setFilterProps(initialState);
    this.controlPanel = new ArrowFilteringControlPanel(
      initialState,
      state => {
        this.renderer.setFilterProps(state);
      },
      () => this.panels.refresh()
    );
    this.panels = new ArrowExamplePanelManager({
      descriptionPanel: () => this.controlPanel.makeDescriptionPanel(),
      settingsPanel: () => this.controlPanel.makeSettingsPanel()
    });
    this.panels.setTableEntries([
      {id: 'arrow-filtering-source', label: 'Filterable points', kind: 'source', table: arrowTable}
    ]);
  }

  override async onInitialize(): Promise<void> {
    this.panels.mount();
  }

  override onRender({device, aspect}: AnimationProps): void {
    const renderPass = device.beginRenderPass({clearColor: [0.015, 0.02, 0.035, 1]});
    this.renderer.draw(renderPass, aspect);
    renderPass.end();
  }

  override onFinalize(): void {
    this.controlPanel.destroy();
    this.panels.finalize();
    this.renderer.destroy();
  }
}
