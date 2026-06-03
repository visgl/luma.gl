// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

const STREAMING_BATCH_STATUS_ROW_ID = 'arrow-particles-streaming-status-row';
const STREAMING_BATCH_FILL_ID = 'arrow-particles-streaming-fill';
const STREAMING_BATCH_STATUS_LABEL_ID = 'arrow-particles-streaming-status-label';

export class ArrowParticlesControlPanel {
  private streamingBatchStatusRow: HTMLElement | null = null;
  private streamingBatchFill: HTMLElement | null = null;
  private streamingBatchStatusLabel: HTMLElement | null = null;

  initialize(): void {
    this.streamingBatchStatusRow = document.getElementById(STREAMING_BATCH_STATUS_ROW_ID);
    this.streamingBatchFill = document.getElementById(STREAMING_BATCH_FILL_ID);
    this.streamingBatchStatusLabel = document.getElementById(STREAMING_BATCH_STATUS_LABEL_ID);
  }

  destroy(): void {
    this.streamingBatchStatusRow = null;
    this.streamingBatchFill = null;
    this.streamingBatchStatusLabel = null;
  }

  setStreamingBatchStatus(loadedBatchCount: number | null, streamingBatchCount: number): void {
    if (
      !this.streamingBatchStatusRow ||
      !this.streamingBatchFill ||
      !this.streamingBatchStatusLabel
    ) {
      return;
    }

    if (loadedBatchCount === null) {
      this.streamingBatchStatusRow.style.display = 'none';
      this.streamingBatchFill.style.width = '0%';
      this.streamingBatchStatusLabel.textContent = `Loaded 0 of ${streamingBatchCount} batches`;
      this.streamingBatchStatusRow.setAttribute('aria-valuenow', '0');
      return;
    }

    const safeLoadedBatchCount = Math.min(Math.max(loadedBatchCount, 0), streamingBatchCount);
    const progressPercent = getStreamingBatchProgressPercent(
      safeLoadedBatchCount,
      streamingBatchCount
    );
    this.streamingBatchStatusRow.style.display = 'block';
    this.streamingBatchStatusRow.setAttribute('aria-valuenow', String(safeLoadedBatchCount));
    this.streamingBatchStatusRow.setAttribute('aria-valuemax', String(streamingBatchCount));
    this.streamingBatchFill.style.width = `${progressPercent}%`;
    this.streamingBatchStatusLabel.textContent = `Loaded ${safeLoadedBatchCount} of ${streamingBatchCount} batches`;
  }
}

export function makeArrowParticlesControlPanelHtml(): string {
  return `\
  <div style="min-width: 280px; max-width: 420px; padding: 14px 16px; border: 1px solid rgba(208, 215, 222, 0.9); border-radius: 10px; background: rgba(255, 255, 255, 0.96); color: #0f172a; font: 14px/1.4 system-ui, sans-serif;">
    <p style="margin: 0 0 8px;">Runs an example-level <code>ArrowParticleRenderer</code> over <code>positions</code> and <code>velocities</code> Arrow columns, then updates GPU batches with storage compute on WebGPU or transform feedback on WebGL.</p>
    <p style="margin: 0 0 12px; color: #475569;">Batches stream in every 2 seconds. Each batch keeps a stable color with per-particle variation, making older batches easy to spot as they advance further.</p>
    <div id="${STREAMING_BATCH_STATUS_ROW_ID}" role="progressbar" aria-valuemin="0" aria-valuemax="0" aria-valuenow="0" style="display: none; position: relative; width: 100%; height: 28px; margin-top: 12px; overflow: hidden; border: 1px solid rgba(37, 99, 235, 0.32); border-radius: 8px; background: #dbeafe; color: #0f172a;">
      <span id="${STREAMING_BATCH_FILL_ID}" aria-hidden="true" style="position: absolute; inset: 0 auto 0 0; width: 0%; background: linear-gradient(90deg, #93c5fd 0%, #2563eb 100%); transition: width 220ms ease;"></span>
      <span id="${STREAMING_BATCH_STATUS_LABEL_ID}" aria-live="polite" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 0 8px; font-weight: 700; font-variant-numeric: tabular-nums;">Loaded 0 batches</span>
    </div>
  </div>
  `;
}

function getStreamingBatchProgressPercent(
  loadedBatchCount: number,
  streamingBatchCount: number
): number {
  if (streamingBatchCount <= 0) {
    return 0;
  }
  return (loadedBatchCount / streamingBatchCount) * 100;
}
