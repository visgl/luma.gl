// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import type {AnimationProps} from '@luma.gl/engine';
import {AnimationLoopTemplate} from '@luma.gl/engine';
import {
  createStreamingParticleRecordBatchIterator,
  makeArrowParticleRecordBatches,
  makeArrowParticleTable,
  STREAMING_PARTICLE_BATCH_COUNT
} from './arrow-particle-data';
import {ArrowParticleLayer} from './arrow-particle-layer';
import {
  GPUVectorStorageParticlesControlPanel,
  makeGPUVectorStorageParticlesControlPanelHtml,
  type ParticleInputKind
} from './control-panel';

export const title = 'Particles: FixedSizeList<Float32, 2>';
export const description =
  'Arrow table columns uploaded to GPUVectors and updated through storage compute or transform feedback.';

export default class GPUVectorStorageParticlesAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = makeGPUVectorStorageParticlesControlPanelHtml();

  readonly device: Device;
  readonly layer: ArrowParticleLayer;
  readonly controlPanel: GPUVectorStorageParticlesControlPanel;
  activeInputKind: ParticleInputKind = 'eager';
  isFinalized = false;

  constructor({device}: AnimationProps) {
    super();
    this.device = device as Device;
    this.layer = new ArrowParticleLayer(this.device, {
      data: makeArrowParticleTable()
    });
    this.controlPanel = new GPUVectorStorageParticlesControlPanel({
      initialState: {inputKind: this.activeInputKind},
      handlers: {
        onInputKindChange: this.handleInputKindSelection
      }
    });
  }

  override async onInitialize(): Promise<void> {
    this.controlPanel.initialize();
    this.controlPanel.setStreamingBatchStatus(null, STREAMING_PARTICLE_BATCH_COUNT);
  }

  override onRender({device, time}: AnimationProps): void {
    const didReset = this.layer.update(time);
    if (didReset && this.activeInputKind === 'streaming' && !this.isFinalized) {
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
    this.layer.destroy();
  }

  private readonly handleInputKindSelection = (inputKind: ParticleInputKind): void => {
    if (inputKind === this.activeInputKind) {
      return;
    }

    this.activeInputKind = inputKind;
    this.controlPanel.syncControls({inputKind});
    if (inputKind === 'streaming') {
      this.startStreamingParticles();
      return;
    }
    this.showEagerParticles();
  };

  private showEagerParticles(): void {
    this.layer.cancelRecordBatchStream();
    this.layer.setProps({data: makeArrowParticleTable()});
    this.controlPanel.setStreamingBatchStatus(null, STREAMING_PARTICLE_BATCH_COUNT);
  }

  private startStreamingParticles(): void {
    this.controlPanel.setStreamingBatchStatus(0, STREAMING_PARTICLE_BATCH_COUNT);
    const streamingSession = this.layer.beginRecordBatchStream();
    const recordBatches = makeArrowParticleRecordBatches();

    void this.layer.streamRecordBatches({
      streamingSession,
      recordBatchIterator: createStreamingParticleRecordBatchIterator(recordBatches),
      onBatch: ({loadedBatchCount}) => {
        if (this.activeInputKind === 'streaming' && !this.isFinalized) {
          this.controlPanel.setStreamingBatchStatus(
            loadedBatchCount,
            STREAMING_PARTICLE_BATCH_COUNT
          );
        }
      }
    });
  }
}
