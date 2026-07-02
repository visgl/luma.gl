// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  createStreamingParticleRecordBatchIterator,
  makeArrowParticleRecordBatches,
  STREAMING_PARTICLE_BATCH_COUNT
} from './arrow-particle-data';
import type {ArrowParticleRendererProps} from './arrow-particle-renderer';
import {ArrowParticlesControlPanel, makeArrowParticlesControlPanelHtml} from './control-panel';
import {ArrowExamplePanelManager} from '../arrow-example-panels';

/** Owns the particle stream and its table-inspection UI. */
export class ArrowParticleDataSource {
  readonly controlPanel = new ArrowParticlesControlPanel();
  readonly panels = new ArrowExamplePanelManager({
    descriptionHtml: makeArrowParticlesControlPanelHtml()
  });
  private isFinalized = false;

  constructor(private readonly onDataSourceChange: (props: ArrowParticleRendererProps) => void) {}

  initialize(): void {
    this.panels.mount();
    this.controlPanel.initialize();
    this.restart();
  }

  restart(): void {
    if (this.isFinalized) return;
    this.controlPanel.setStreamingBatchStatus(0, STREAMING_PARTICLE_BATCH_COUNT);
    const recordBatches = makeArrowParticleRecordBatches();
    const tableStream = this.panels.beginLoadedTableStream({
      id: 'particles-source',
      label: 'Loaded particle source',
      kind: 'source',
      recordBatches
    });
    this.onDataSourceChange({
      data: createStreamingParticleRecordBatchIterator(recordBatches),
      onDataBatch: ({loadedBatchCount}) => {
        if (this.isFinalized) return;
        tableStream.setLoadedBatchCount(loadedBatchCount);
        this.controlPanel.setStreamingBatchStatus(loadedBatchCount, STREAMING_PARTICLE_BATCH_COUNT);
      }
    });
  }

  finalize(): void {
    this.isFinalized = true;
    this.controlPanel.destroy();
    this.panels.finalize();
  }
}
