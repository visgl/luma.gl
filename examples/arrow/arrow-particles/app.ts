// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import {
  createStreamingParticleRecordBatchIterator,
  makeArrowParticleRecordBatches,
  STREAMING_PARTICLE_BATCH_COUNT
} from './arrow-particle-data';
import {ArrowParticleRenderer} from './arrow-particle-renderer';
import {ArrowExamplePanelManager, makeArrowExamplePanelHostHtml} from '../arrow-example-panels';
import {ArrowParticlesControlPanel, makeArrowParticlesControlPanelHtml} from './control-panel';

export const title = 'Particles: FixedSizeList<Float32, 2>';
export const description =
  'Arrow table columns uploaded to GPUVectors and updated through storage compute or transform feedback.';

export default class ArrowParticlesAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeArrowExamplePanelHostHtml();

  readonly device: Device;
  readonly layer: ArrowParticleRenderer;
  readonly controlPanel: ArrowParticlesControlPanel;
  readonly panels = new ArrowExamplePanelManager({
    descriptionHtml: makeArrowParticlesControlPanelHtml()
  });
  isFinalized = false;

  constructor({device}: AnimationProps) {
    super();
    this.device = device as Device;
    this.layer = new ArrowParticleRenderer(this.device);
    this.controlPanel = new ArrowParticlesControlPanel();
  }

  override async onInitialize(): Promise<void> {
    this.panels.mount();
    this.controlPanel.initialize();
    this.startStreamingParticles();
  }

  override onRender({device, time}: AnimationProps): void {
    const didReset = this.layer.update(time);
    if (didReset && !this.isFinalized) {
      this.startStreamingParticles();
    }

    const renderPass = device.beginRenderPass({
      clearColor: [0.01, 0.02, 0.05, 1]
    });
    this.layer.draw(renderPass);
    renderPass.end();
  }

  override onFinalize(): void {
    this.isFinalized = true;
    this.controlPanel.destroy();
    this.panels.finalize();
    this.layer.destroy();
  }

  private startStreamingParticles(): void {
    this.controlPanel.setStreamingBatchStatus(0, STREAMING_PARTICLE_BATCH_COUNT);
    const recordBatches = makeArrowParticleRecordBatches();
    const particleTableStream = this.panels.beginLoadedTableStream({
      id: 'particles-source',
      label: 'Loaded particle source',
      kind: 'source',
      recordBatches
    });

    this.layer.setProps({
      data: createStreamingParticleRecordBatchIterator(recordBatches),
      onDataBatch: ({loadedBatchCount}) => {
        if (!this.isFinalized) {
          particleTableStream.setLoadedBatchCount(loadedBatchCount);
          this.controlPanel.setStreamingBatchStatus(
            loadedBatchCount,
            STREAMING_PARTICLE_BATCH_COUNT
          );
        }
      }
    });
  }
}
