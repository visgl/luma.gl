// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

const INPUT_KIND_SELECTOR_ID = 'gpu-vector-storage-particles-input-kind';
const STREAMING_BATCH_STATUS_ROW_ID = 'gpu-vector-storage-particles-streaming-status-row';
const STREAMING_BATCH_FILL_ID = 'gpu-vector-storage-particles-streaming-fill';
const STREAMING_BATCH_STATUS_LABEL_ID = 'gpu-vector-storage-particles-streaming-status-label';

export type ParticleInputKind = 'eager' | 'streaming';

export type GPUVectorStorageParticlesControlPanelState = {
  inputKind: ParticleInputKind;
};

export type GPUVectorStorageParticlesControlPanelHandlers = {
  onInputKindChange: (inputKind: ParticleInputKind) => void;
};

export type GPUVectorStorageParticlesControlPanelOptions = {
  initialState: GPUVectorStorageParticlesControlPanelState;
  handlers: GPUVectorStorageParticlesControlPanelHandlers;
};

export class GPUVectorStorageParticlesControlPanel {
  private readonly handlers: GPUVectorStorageParticlesControlPanelHandlers;
  private state: GPUVectorStorageParticlesControlPanelState;
  private inputKindSelector: HTMLSelectElement | null = null;
  private streamingBatchStatusRow: HTMLElement | null = null;
  private streamingBatchFill: HTMLElement | null = null;
  private streamingBatchStatusLabel: HTMLElement | null = null;

  constructor({initialState, handlers}: GPUVectorStorageParticlesControlPanelOptions) {
    this.state = initialState;
    this.handlers = handlers;
  }

  initialize(): void {
    if (!this.inputKindSelector) {
      this.inputKindSelector = document.getElementById(
        INPUT_KIND_SELECTOR_ID
      ) as HTMLSelectElement | null;
      this.inputKindSelector?.addEventListener('change', this.handleInputKindSelection);
    }

    this.streamingBatchStatusRow = document.getElementById(STREAMING_BATCH_STATUS_ROW_ID);
    this.streamingBatchFill = document.getElementById(STREAMING_BATCH_FILL_ID);
    this.streamingBatchStatusLabel = document.getElementById(STREAMING_BATCH_STATUS_LABEL_ID);
    this.syncControls(this.state);
  }

  destroy(): void {
    this.inputKindSelector?.removeEventListener('change', this.handleInputKindSelection);
    this.inputKindSelector = null;
    this.streamingBatchStatusRow = null;
    this.streamingBatchFill = null;
    this.streamingBatchStatusLabel = null;
  }

  syncControls(state: Partial<GPUVectorStorageParticlesControlPanelState>): void {
    this.state = {...this.state, ...state};
    if (this.inputKindSelector) {
      this.inputKindSelector.value = this.state.inputKind;
    }
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

  private readonly handleInputKindSelection = (): void => {
    const inputKind = parseParticleInputKind(this.inputKindSelector?.value);
    if (inputKind) {
      this.handlers.onInputKindChange(inputKind);
    }
  };
}

export function makeGPUVectorStorageParticlesControlPanelHtml(): string {
  return `\
  <div style="min-width: 280px; max-width: 420px; padding: 14px 16px; border: 1px solid rgba(208, 215, 222, 0.9); border-radius: 10px; background: rgba(255, 255, 255, 0.96); color: #0f172a; font: 14px/1.4 system-ui, sans-serif;">
    <p style="margin: 0 0 12px;">Runs an example-level <code>ArrowParticleLayer</code> over <code>positions</code> and <code>velocities</code> Arrow columns, then updates GPU batches with storage compute on WebGPU or transform feedback on WebGL.</p>
    <label for="${INPUT_KIND_SELECTOR_ID}" style="display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 10px 12px; align-items: center; font-weight: 700;">
      <span>Input</span>
      <select id="${INPUT_KIND_SELECTOR_ID}" style="min-height: 32px; border: 1px solid #94a3b8; border-radius: 6px; background: white;">
        <option value="eager">Arrow table</option>
        <option value="streaming">RecordBatch stream</option>
      </select>
    </label>
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

function parseParticleInputKind(value: string | undefined): ParticleInputKind | null {
  return value === 'eager' || value === 'streaming' ? value : null;
}
