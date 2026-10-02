// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Presentation for the example shell. */
export function makeGPT2InfoHtml(props: {
  defaultPrompt: string;
  defaultTemperature: number;
  minimumTemperature: number;
  maximumTemperature: number;
  visualizationColumnCount: number;
  visualizationRowCount: number;
}): string {
  return `
    <section class="gpgpu-shell">
      <style>
        .gpgpu-shell {
          box-sizing: border-box;
          max-width: 1180px;
          height: 100dvh;
          overflow: hidden;
          color: #dbe7f3;
          font-family: Inter, ui-sans-serif, system-ui, sans-serif;
          letter-spacing: 0;
        }
        .gpgpu-workspace {
          display: grid;
          height: 100%;
          gap: 14px;
          grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.95fr);
          align-items: stretch;
        }
        .gpgpu-main-column {
          display: grid;
          gap: 14px;
          grid-template-rows: auto minmax(0, 1fr);
          min-height: 0;
          min-width: 0;
        }
        .gpgpu-output-column {
          display: grid;
          min-height: 0;
          min-width: 0;
        }
        .gpgpu-panel {
          border: 1px solid #294055;
          background: #09131f;
          color: #dbe7f3;
          padding: 18px;
        }
        .gpgpu-hero {
          display: grid;
          gap: 12px;
          background: #08111c;
          border-left: 4px solid #38bdf8;
          padding: 14px 16px;
        }
        .gpgpu-title-row,
        .gpgpu-prompt-row,
        .gpgpu-settings-row,
        .gpgpu-status-grid {
          display: grid;
          gap: 10px;
        }
        .gpgpu-title-row {
          grid-template-columns: minmax(0, 1fr);
        }
        .gpgpu-kicker {
          margin: 0 0 4px 0;
          color: #7dd3fc;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .gpgpu-title {
          margin: 0;
          color: #f8fafc;
          font-size: 22px;
          line-height: 1.1;
        }
        .gpgpu-copy {
          margin: 6px 0 0 0;
          max-width: 760px;
          color: #bfd0e0;
          font-size: 13px;
          line-height: 1.4;
        }
        .gpgpu-actions,
        .gpgpu-shortcuts,
        .gpgpu-toggle-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .gpgpu-actions {
          justify-content: flex-end;
          align-items: end;
        }
        .gpgpu-prompt-row {
          align-items: end;
          grid-template-columns: minmax(320px, 1fr) auto;
        }
        .gpgpu-settings-row {
          align-items: end;
          grid-template-columns: auto auto minmax(180px, 1fr);
        }
        .gpgpu-field,
        .gpgpu-field-row,
        .gpgpu-stack {
          display: grid;
          gap: 6px;
        }
        .gpgpu-setting {
          border: 1px solid #294055;
          border-radius: 8px;
          background: #0b1622;
          padding: 8px 10px;
        }
        .gpgpu-field-row {
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: end;
        }
        .gpgpu-label {
          color: #e2edf7;
          font-size: 13px;
          font-weight: 700;
        }
        .gpgpu-input,
        .gpgpu-select {
          width: 100%;
          min-height: 36px;
          box-sizing: border-box;
          border: 1px solid #486174;
          background: #f8fafc;
          color: #09131f;
          font: inherit;
          padding: 7px 10px;
        }
        .gpgpu-number {
          width: 96px;
        }
        .gpgpu-button {
          min-height: 36px;
          border: 1px solid #567086;
          background: #142536;
          color: #edf6ff;
          cursor: pointer;
          font: inherit;
          font-weight: 650;
          padding: 7px 11px;
        }
        .gpgpu-setting .gpgpu-button {
          border-radius: 999px;
          font-size: 12px;
          min-height: 28px;
          padding: 4px 9px;
        }
        .gpgpu-setting .gpgpu-button[aria-pressed="true"] {
          background: #1f8f72;
          border-color: #67e8c4;
          color: #f0fdfa;
          box-shadow: inset 0 0 0 1px rgba(240, 253, 250, 0.18);
        }
        .gpgpu-setting .gpgpu-shortcuts {
          gap: 6px;
        }
        .gpgpu-setting .gpgpu-label {
          font-size: 12px;
        }
        .gpgpu-actions .gpgpu-button {
          border-radius: 999px;
          padding-inline: 16px;
        }
        .gpgpu-button:hover {
          background: #1a3248;
        }
        .gpgpu-button-primary {
          border-color: #38bdf8;
          background: #0f7498;
          color: #f8fafc;
        }
        .gpgpu-button-danger {
          border-color: #c08457;
          background: #5c3524;
        }
        .gpgpu-button:disabled {
          cursor: not-allowed;
          opacity: 0.45;
        }
        .gpgpu-range {
          width: 100%;
          accent-color: #38bdf8;
        }
        .gpgpu-status-card,
        .gpgpu-download-card,
        .gpgpu-note {
          border: 1px solid #294055;
          background: #0d1a28;
          padding: 14px;
        }
        .gpgpu-output-card {
          display: grid;
          grid-template-rows: minmax(0, 1fr);
          min-height: 0;
          height: 100%;
        }
        .gpgpu-download-card {
          align-content: start;
        }
        .gpgpu-tab-shell {
          background: #0d1a28;
          border: 1px solid #294055;
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
          min-height: 0;
          padding: 14px;
        }
        .gpgpu-tab-shell[data-loading="true"] {
          grid-template-rows: minmax(0, 1fr);
          padding: 0;
        }
        .gpgpu-tab-shell[data-loading="true"] .gpgpu-tabs,
        .gpgpu-tab-shell[data-loading="true"] .gpgpu-tab-panels {
          display: none;
        }
        .gpgpu-loading-stage {
          display: none;
          min-height: 0;
        }
        .gpgpu-tab-shell[data-loading="true"] .gpgpu-loading-stage {
          display: grid;
        }
        .gpgpu-loading-stage .gpgpu-download-card {
          align-content: center;
          border: 0;
          display: grid;
          gap: 18px;
          height: 100%;
          min-height: 0;
          padding: 28px;
        }
        .gpgpu-loading-message {
          color: #edf6ff;
          font-size: 15px;
          font-weight: 650;
          line-height: 1.4;
        }
        .gpgpu-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }
        .gpgpu-tab-button {
          background: #142536;
          border: 1px solid #567086;
          color: #dbe7f3;
          cursor: pointer;
          font: inherit;
          font-size: 13px;
          font-weight: 700;
          min-height: 34px;
          padding: 7px 11px;
        }
        .gpgpu-tab-button[aria-selected="true"] {
          background: #0f7498;
          border-color: #38bdf8;
          color: #f8fafc;
        }
        .gpgpu-tab-panels {
          min-height: 0;
        }
        .gpgpu-tab-panel {
          display: none;
          height: 100%;
          min-height: 0;
          overflow: auto;
        }
        .gpgpu-tab-panel[data-active="true"] {
          display: grid;
          gap: 12px;
          grid-template-rows: auto minmax(0, 1fr);
        }
        .gpgpu-stage-head {
          align-items: center;
          display: flex;
          gap: 10px;
          justify-content: space-between;
        }
        .gpgpu-stage-title {
          color: #f8fafc;
          font-size: 15px;
          font-weight: 750;
        }
        .gpgpu-stage-surface {
          background: #03070d;
          border: 1px solid #294055;
          display: grid;
          min-height: 0;
          overflow: hidden;
          position: relative;
        }
        .gpgpu-visualization-host {
          display: none;
          min-height: 0;
          width: 100%;
        }
        .gpgpu-visualization-host canvas {
          display: block !important;
          height: 100% !important;
          min-height: 0;
          width: 100% !important;
        }
        .gpgpu-device {
          color: #7dd3fc;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 12px;
          margin-bottom: 10px;
        }
        .gpgpu-output {
          color: #edf6ff;
          font-size: 14px;
          line-height: 1.55;
          margin: 0;
          overflow: auto;
          padding-right: 6px;
          white-space: pre-wrap;
        }
        .gpgpu-output-layout {
          display: grid;
          gap: 10px;
        }
        .gpgpu-output-section {
          background: #0b1622;
          border: 1px solid #294055;
          border-radius: 8px;
          padding: 10px 12px;
        }
        .gpgpu-output-section-title {
          color: #f8fafc;
          font-size: 13px;
          font-weight: 750;
          margin: 0 0 6px 0;
        }
        .gpgpu-output-pre {
          background: transparent !important;
          border: 0 !important;
          color: inherit !important;
          font: inherit;
          line-height: inherit;
          margin: 0;
          padding: 0 !important;
          white-space: pre-wrap;
        }
        .gpgpu-model-output {
          color: #9fd7b0;
          font-size: 16px;
          font-weight: 700;
          line-height: 1.6;
        }
        .gpgpu-logits-pre {
          border: 1px solid #294055 !important;
          border-radius: 8px;
          padding: 8px !important;
        }
        .gpgpu-download-row {
          display: grid;
          gap: 6px;
        }
        .gpgpu-download-head {
          align-items: center;
          display: flex;
          gap: 8px;
          justify-content: space-between;
        }
        .gpgpu-spinner {
          animation: gpgpu-loading-spin 0.8s linear infinite;
          border: 2px solid #486174;
          border-radius: 999px;
          border-top-color: #f8fafc;
          display: inline-block;
          height: 12px;
          width: 12px;
        }
        .gpgpu-download-status {
          color: #c5d6e6;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 11px;
        }
        .gpgpu-progress {
          background: #162738;
          height: 8px;
          overflow: hidden;
        }
        .gpgpu-progress > div {
          height: 100%;
          width: 0%;
        }
        .gpgpu-model-bar {
          background: #38bdf8;
        }
        .gpgpu-tokenizer-bar {
          background: #34d399;
        }
        .gpgpu-note {
          color: #b8cadb;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 11px;
          line-height: 1.45;
          margin: 0;
        }
        .gpgpu-details-body {
          border: 1px solid #294055;
          background: #07111c;
          color: #bfd0e0;
          font-size: 12px;
          line-height: 1.5;
          overflow: auto;
          padding: 12px 14px;
        }
        .gpgpu-debug {
          border: 1px solid #294055;
          background: #07111c;
          color: #dbe7f3;
          font-size: 11px;
          line-height: 1.4;
          height: 100%;
          margin: 0;
          min-height: 0;
          overflow: auto;
          padding: 10px;
          white-space: pre-wrap;
        }
        .gpgpu-toggle {
          align-items: center;
          color: #e2edf7;
          display: inline-flex;
          gap: 6px;
          font-size: 13px;
        }
        @keyframes gpgpu-loading-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 900px) {
          .gpgpu-workspace {
            grid-template-columns: 1fr;
            overflow: auto;
          }
          .gpgpu-title-row,
          .gpgpu-prompt-row,
          .gpgpu-settings-row,
          .gpgpu-field-row {
            grid-template-columns: 1fr;
          }
          .gpgpu-actions {
            justify-content: flex-start;
          }
          .gpgpu-number {
            width: 100%;
          }
        }
      </style>
      <div class="gpgpu-workspace">
        <div class="gpgpu-main-column">
          <div class="gpgpu-panel gpgpu-hero">
            <div class="gpgpu-title-row">
              <div>
                <p class="gpgpu-kicker">WebGPU Compute Demo</p>
                <h2 class="gpgpu-title">GPT-2 124M next-token lab</h2>
                <p class="gpgpu-copy">
                  Load the llm.c checkpoint, inspect tensor activity, and sample continuations with
                  luma.gl compute shaders driving the dense projections and language-model head.
                </p>
              </div>
            </div>
            <div class="gpgpu-prompt-row">
              <label class="gpgpu-field">
                <span class="gpgpu-label">Prompt</span>
                <input id="gpgpu-prompt" class="gpgpu-input" value="${props.defaultPrompt}" />
              </label>
              <div class="gpgpu-actions">
                <button id="gpgpu-generate" class="gpgpu-button gpgpu-button-primary" disabled>Generate</button>
                <button id="gpgpu-stop" class="gpgpu-button gpgpu-button-danger" disabled>Stop</button>
              </div>
            </div>
            <div class="gpgpu-settings-row">
              <div class="gpgpu-stack gpgpu-setting">
                <span class="gpgpu-label">Max new tokens</span>
                <div class="gpgpu-shortcuts" aria-label="Max new token shortcuts">
                  <button type="button" class="gpgpu-button" data-gpgpu-token-count="1" aria-label="Generate up to 1 new token">1</button>
                  <button type="button" class="gpgpu-button" data-gpgpu-token-count="16" aria-label="Generate up to 16 new tokens">16</button>
                  <button type="button" class="gpgpu-button" data-gpgpu-token-count="64" aria-label="Generate up to 64 new tokens">64</button>
                  <button type="button" class="gpgpu-button" data-gpgpu-token-count="256" aria-label="Generate up to 256 new tokens">256</button>
                </div>
              </div>
              <div class="gpgpu-stack gpgpu-setting">
                <span class="gpgpu-label">Context window</span>
                <div class="gpgpu-shortcuts" aria-label="Context window shortcuts">
                  <button type="button" class="gpgpu-button" data-gpgpu-context-token-count="16" aria-label="Use a 16 token context window">16</button>
                  <button type="button" class="gpgpu-button" data-gpgpu-context-token-count="32" aria-label="Use a 32 token context window">32</button>
                  <button type="button" class="gpgpu-button" data-gpgpu-context-token-count="64" aria-label="Use a 64 token context window">64</button>
                  <button type="button" class="gpgpu-button" data-gpgpu-context-token-count="128" aria-label="Use a 128 token context window">128</button>
                  <button type="button" class="gpgpu-button" data-gpgpu-context-token-count="256" aria-label="Use a 256 token context window">256</button>
                </div>
              </div>
              <div class="gpgpu-stack gpgpu-setting">
                <label class="gpgpu-field">
                  <span class="gpgpu-label">Temperature <output id="gpgpu-temperature-value">${props.defaultTemperature.toFixed(2)}</output></span>
                  <input id="gpgpu-temperature" class="gpgpu-range" type="range" min="${props.minimumTemperature}" max="${props.maximumTemperature}" step="0.05" value="${props.defaultTemperature}" />
                </label>
              </div>
            </div>
          </div>
          <div id="gpgpu-tab-shell" class="gpgpu-tab-shell" data-loading="true">
            <div id="gpgpu-loading-stage" class="gpgpu-loading-stage">
              <div id="gpgpu-loading" class="gpgpu-download-card">
                <div class="gpgpu-loading-message">
                  Loading GPT-2 124M model and tokenizer from Hugging Face...
                </div>
                <div class="gpgpu-download-row">
                  <div class="gpgpu-download-head">
                    <span style="display: inline-flex; align-items: center; gap: 8px;">
                      <span id="gpgpu-model-spinner" class="gpgpu-spinner" aria-hidden="true"></span>
                      <span>Model</span>
                    </span>
                    <span id="gpgpu-model-download-status" class="gpgpu-download-status">Waiting</span>
                  </div>
                  <div class="gpgpu-progress">
                    <div id="gpgpu-model-download-bar" class="gpgpu-model-bar"></div>
                  </div>
                </div>
                <div class="gpgpu-download-row">
                  <div class="gpgpu-download-head">
                    <span style="display: inline-flex; align-items: center; gap: 8px;">
                      <span id="gpgpu-tokenizer-spinner" class="gpgpu-spinner" aria-hidden="true"></span>
                      <span>Tokenizer</span>
                    </span>
                    <span id="gpgpu-tokenizer-download-status" class="gpgpu-download-status">Waiting</span>
                  </div>
                  <div class="gpgpu-progress">
                    <div id="gpgpu-tokenizer-download-bar" class="gpgpu-tokenizer-bar"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="gpgpu-tabs" role="tablist" aria-label="GPT-2 workspace views">
              <button type="button" class="gpgpu-tab-button" data-gpgpu-tab-target="tensor-atlas" role="tab" aria-selected="true">Tensor Atlas</button>
              <button type="button" class="gpgpu-tab-button" data-gpgpu-tab-target="about-demo" role="tab" aria-selected="false">About Demo</button>
              <button type="button" class="gpgpu-tab-button" data-gpgpu-tab-target="about-atlas" role="tab" aria-selected="false">About Atlas</button>
              <button type="button" class="gpgpu-tab-button" data-gpgpu-tab-target="debug-trace" role="tab" aria-selected="false">Debug Trace</button>
            </div>
            <div class="gpgpu-tab-panels">
              <section class="gpgpu-tab-panel" data-gpgpu-tab-panel="tensor-atlas" data-active="true" role="tabpanel">
                <div class="gpgpu-stage-head">
                  <div class="gpgpu-stage-title">Tensor atlas</div>
                  <div id="gpgpu-device" class="gpgpu-device">Device: initializing...</div>
                </div>
                <div class="gpgpu-stage-surface">
                  <div id="gpgpu-visualization-host" class="gpgpu-visualization-host"></div>
                </div>
                <div id="gpgpu-canvas-hover-readout" class="gpgpu-note">
                  Canvas hover: move over the atlas after a run to inspect the tensor span under the mouse. Scroll to zoom, drag to pan, double-click resets.
                </div>
              </section>
              <section class="gpgpu-tab-panel" data-gpgpu-tab-panel="about-demo" data-active="false" role="tabpanel">
                <div class="gpgpu-details-body">
          <p style="margin: 0 0 6px 0;">
            The prompt is tokenized with byte-level GPT-2 BPE, converted to token plus absolute position embeddings, and run through the selected sliding context window.
            Each transformer block applies layer norm, causal self-attention, a residual add, another layer norm, an MLP with GELU, and a final residual add.
          </p>
          <p style="margin: 0 0 6px 0;">
            WebGPU compute shaders run the tensor-heavy work: layer norms, QKV projections, attention, projection matrices, GELU, residual adds, and the final language-model head.
            The CPU still handles UI, tokenization, sampling, and reading back final logits.
          </p>
          <p style="margin: 0;">
            The final logits are unnormalized token scores. Temperature 0 picks the highest logit; temperatures above 0 convert logits to probabilities and sample from the distribution.
            The logits table shows raw logit, temperature-scaled delta from the best token, probability, and decoded token text.
            During generation, click any generated-token chip to inspect the logits that produced that token; the demo keeps the logits history for the current run.
          </p>
                </div>
              </section>
              <section class="gpgpu-tab-panel" data-gpgpu-tab-panel="about-atlas" data-active="false" role="tabpanel">
                <div class="gpgpu-details-body">
          <p style="margin: 0 0 6px 0;">
            The canvas is a dense tensor atlas. It uses ${props.visualizationColumnCount} by ${props.visualizationRowCount} tiny cells, so the latest forward pass can show token embeddings, position embeddings, sampled matrix weights, activations, and logits across all layers.
            Read it left to right, top to bottom; new tensor spans are appended in the same order the model runs.
          </p>
          <p style="margin: 0 0 6px 0;">
            Each tiny cell is one sampled tensor value: yellow is positive, cyan is negative, dark gray is zero, and red is NaN or infinity.
            Small tensors are shown value-for-value; large matrices are sampled from the whole matrix so every layer and major multiply gets canvas space.
          </p>
          <p style="margin: 0 0 6px 0;">
            The first spans are the selected context token embeddings, position embeddings, and their sum. Then each GPT-2 block adds sampled parameter tensors for layer norm, QKV, attention projection, MLP, and output projection, followed by the activations produced by those WebGPU kernels.
            The final spans show the last layer norm and the language-model-head logits over the vocabulary.
          </p>
          <p style="margin: 0 0 6px 0;">
            Repeated horizontal textures usually mean a matrix is being sampled across rows and columns. Large yellow or cyan bands show strongly signed values; mixed blue/yellow noise means weights or activations are balanced around zero.
            Red is the important failure signal: it means a tensor readback saw NaN or infinity.
          </p>
          <p style="margin: 0;">
            Move the mouse over the canvas to see the tensor span, atlas cell, approximate sampled source index, sign, and intensity under the pointer.
            Context-token spans and the final logits span also show the actual token id and decoded token text under the mouse.
            Scroll on the canvas to zoom around the cursor, drag to pan the zoomed atlas, and double-click the canvas to reset to the full atlas.
            The canvas visualization and Debug Trace have separate controls. Enable Debug Trace to see the exact tensor names, stats, and pixel ranges that correspond to the atlas spans; keep it off for faster generation.
          </p>
                </div>
              </section>
              <section class="gpgpu-tab-panel" data-gpgpu-tab-panel="debug-trace" data-active="false" role="tabpanel">
                <div class="gpgpu-toggle-row">
                  <label class="gpgpu-toggle">
                    <input id="gpgpu-canvas-enabled" type="checkbox" checked />
                    <span>Canvas tensor visualization</span>
                  </label>
                  <label class="gpgpu-toggle">
                    <input id="gpgpu-debug-enabled" type="checkbox" />
                    <span>Debug Trace</span>
                  </label>
                </div>
                <pre id="gpgpu-debug" class="gpgpu-debug">Waiting for model load...</pre>
              </section>
            </div>
          </div>
        </div>
        <aside class="gpgpu-output-column">
          <div class="gpgpu-status-card gpgpu-output-card">
            <div id="gpgpu-output" class="gpgpu-output">
              <div class="gpgpu-output-layout">
                <section class="gpgpu-output-section">
                  <div class="gpgpu-output-section-title">Output</div>
                  <pre class="gpgpu-output-pre">Loading GPT-2 files...</pre>
                </section>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  `;
}
