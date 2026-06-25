// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import {ArrowFilteringRenderer} from './arrow-filtering-renderer';
import {ArrowFilteringSource} from './arrow-filtering-source';
import {makeArrowExamplePanelHostHtml} from '../arrow-example-panels';

export const title = 'ShaderPlugin Filtering';
export const description =
  'A portable ShaderPlugin adds an Arrow scalar vertex input and filters point instances on WebGL2 and WebGPU.';

export default class ArrowFilteringAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowExamplePanelHostHtml();
  renderer: ArrowFilteringRenderer | null = null;
  readonly source: ArrowFilteringSource;

  constructor({device}: AnimationProps) {
    super();
    this.source = new ArrowFilteringSource(
      table => {
        this.renderer?.destroy();
        this.renderer = new ArrowFilteringRenderer(device, table);
      },
      state => this.renderer?.setFilterProps(state)
    );
  }

  override async onInitialize(): Promise<void> {
    this.source.initialize();
  }

  override onRender({device, aspect}: AnimationProps): void {
    const renderPass = device.beginRenderPass({clearColor: [0.015, 0.02, 0.035, 1]});
    this.renderer?.draw(renderPass, aspect);
    renderPass.end();
  }

  override onFinalize(): void {
    this.source.finalize();
    this.renderer?.destroy();
  }
}
