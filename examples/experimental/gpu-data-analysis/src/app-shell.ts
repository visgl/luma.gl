// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** The example shell is intentionally readable: it doubles as an approachable integration guide. */
export const GPU_DATA_ANALYSIS_TEMPLATE = `
  <main class="analysis-example">
    <header class="analysis-hero">
      <div>
        <p class="eyebrow"><span class="live-indicator"></span> WEBGPU / ANALYTICS WORKBENCH</p>
        <h1>Data stays on the GPU.</h1>
        <p class="hero-description">
          Start with Arrow columns. Compose a command graph. Explore derived expressions,
          distributions, and spatial patterns without copying rows back to the CPU.
        </p>
      </div>
      <span class="device-badge">GRAPH-NATIVE EXECUTION</span>
    </header>

    <div class="pipeline" aria-label="GPU analytics pipeline">
      <span>01 <strong>ARROW INGEST</strong></span>
      <span>02 <strong>DERIVE</strong></span>
      <span>03 <strong>FILTER</strong></span>
      <span>04 <strong>AGGREGATE</strong></span>
      <span>05 <strong>VISUALIZE</strong></span>
    </div>

    <section class="control-deck" aria-label="Command-graph controls">
      <label>Dataset
        <select data-dataset>
          <option value="small">4,096 rows</option>
          <option value="medium" selected>65,537 rows</option>
          <option value="large">262,144 rows</option>
        </select>
      </label>
      <label>Histogram
        <select data-bins>
          <option value="16">16 uniform bins</option>
          <option value="64" selected>64 uniform bins</option>
          <option value="300">300 uniform bins</option>
          <option value="thresholds">8 threshold bins</option>
        </select>
      </label>
      <label>Group filter
        <select data-group-filter>
          <option value="all">All values</option>
          <option value="positive" selected>Positive values</option>
          <option value="negative">Negative values</option>
        </select>
      </label>
      <label>Spatial grid
        <select data-grid>
          <option>8</option>
          <option selected>16</option>
          <option>17</option>
        </select>
      </label>
      <button class="run-button" data-run>Run command graph <span>→</span></button>
    </section>

    <p class="status" data-status role="status" aria-live="polite"></p>

    <section class="graph-metrics" aria-label="Command-graph diagnostics">
      <article><span>GRAPH NODES</span><strong data-nodes>—</strong></article>
      <article><span>COMPILE TIME</span><strong data-compile-time>—</strong></article>
      <article><span>TRANSIENT REUSE</span><strong data-reuse>—</strong></article>
      <article><span>GPU / CPU VALIDATION</span><strong data-validation>—</strong></article>
    </section>

    <section class="dataframe-lab" aria-label="Interactive luDF derived-column lab">
      <div class="lab-heading">
        <div>
          <p class="eyebrow">LUDF / DERIVED COLUMN LAB</p>
          <h2>Write the expression. Watch the data move.</h2>
          <p>Transform and filter the exact GPU buffers already driving the charts above.</p>
        </div>
        <span class="lab-badge">ZERO ROW COPIES</span>
      </div>

      <div class="expression-editor">
        <div class="editor-titlebar">
          <span class="editor-dots"><i></i><i></i><i></i></span>
          <span>derived-query.ts</span>
          <span>GPU-RESIDENT</span>
        </div>
        <div class="expression-code">
          <p><span>01</span> <i>const</i> query = frame</p>
          <p><span>02</span>   .<b>withColumn</b>(<em>'adjustedValue'</em>, expression)</p>
          <p><span>03</span>   .<b>filter</b>(adjustedValue.greaterThan(threshold));</p>
        </div>
        <div class="live-expression">
          <span>LIVE EXPRESSION</span>
          <strong data-ludf-expression>value × 2 + 1 > 1</strong>
        </div>
      </div>

      <div class="expression-controls">
        <label>Multiplier
          <select data-ludf-multiplier>
            <option value="0.5">0.5×</option>
            <option value="1">1×</option>
            <option value="2" selected>2×</option>
            <option value="4">4×</option>
          </select>
        </label>
        <label>Adjustment
          <input data-ludf-adjustment type="number" value="1" step="0.25">
        </label>
        <label>Threshold
          <input data-ludf-threshold type="number" value="1" step="0.25">
        </label>
        <button class="query-button" data-ludf-run>Execute GPU query <span>→</span></button>
      </div>

      <div class="query-metrics" aria-label="Derived-query results">
        <article><span>SELECTED ROWS</span><strong data-ludf-selected>—</strong></article>
        <article><span>SELECTION RATE</span><strong data-ludf-rate>—</strong></article>
        <article><span>QUERY + READBACK</span><strong data-ludf-execution>—</strong></article>
        <article class="preview-metric"><span>GPU VALUE PREVIEW</span><strong data-ludf-preview>—</strong></article>
      </div>

      <p class="query-status" data-ludf-result role="status" aria-live="polite">
        Derive and filter existing Arrow-backed GPU columns without copying rows.
      </p>
    </section>

    <section class="visualizations" aria-label="GPU-computed analytics">
      <article class="visualization-card histogram-card">
        <p class="eyebrow">DISTRIBUTION / HISTOGRAM + CDF</p>
        <h3>Value distribution</h3>
        <p>GPU-computed histogram with inclusive cumulative counts.</p>
        <div class="histogram" data-histogram></div>
      </article>
      <article class="visualization-card">
        <p class="eyebrow">CATEGORICAL / FILTERED GROUPS</p>
        <h3>Regional breakdown</h3>
        <p>Filtered row counts and means, aggregated entirely on the GPU.</p>
        <div class="groups" data-groups></div>
      </article>
      <article class="visualization-card heatmap-card">
        <p class="eyebrow">SPATIAL / GRID AGGREGATION</p>
        <h3>Density landscape</h3>
        <p>Cell counts, weighted statistics, and segmented row prefixes.</p>
        <div class="heatmap" data-heatmap></div>
      </article>
    </section>

    <footer class="analysis-footer">
      <span>APACHE ARROW → LUMA.GL → WEBGPU</span>
      <span>Explicit graphs. Preserved batches. No hidden transfers.</span>
    </footer>
  </main>
`;

/** Scoped visual system: the example also renders inside the documentation website. */
export const GPU_DATA_ANALYSIS_STYLES = `
  .analysis-example {
    --surface: rgba(15, 23, 38, 0.84);
    --surface-raised: #111c2e;
    --border: rgba(148, 163, 184, 0.16);
    --muted: #8fa2bc;
    --text: #eaf1fb;
    --green: #55e1a0;
    --blue: #73aafa;
    --amber: #ffca74;
    max-width: 1400px;
    min-height: 100vh;
    margin: 0 auto;
    padding: 54px clamp(18px, 5vw, 72px) 28px;
    color: var(--text);
    background:
      radial-gradient(ellipse at 14% 0%, rgba(53, 110, 133, 0.22), transparent 36%),
      radial-gradient(ellipse at 86% 32%, rgba(91, 68, 143, 0.13), transparent 32%),
      #090e19;
    font: 14px/1.55 'SF Pro Display', 'Segoe UI', system-ui, sans-serif;
  }

  .analysis-example *, .analysis-example *::before, .analysis-example *::after {
    box-sizing: border-box;
  }

  .analysis-hero, .lab-heading, .analysis-footer {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
  }

  .analysis-example .eyebrow {
    margin: 0 0 10px;
    color: var(--green);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.65px;
  }

  .live-indicator {
    display: inline-block;
    width: 8px;
    height: 8px;
    margin-right: 7px;
    border-radius: 50%;
    background: var(--green);
    box-shadow: 0 0 12px rgba(85, 225, 160, 0.7);
  }

  .analysis-hero h1 {
    margin: 0 0 12px;
    font-size: clamp(38px, 6vw, 66px);
    line-height: 1.04;
    letter-spacing: -2.8px;
  }

  .hero-description, .lab-heading > div > p:last-child, .visualization-card > p:last-of-type {
    max-width: 680px;
    margin: 0;
    color: var(--muted);
  }

  .device-badge, .lab-badge {
    padding: 8px 11px;
    border: 1px solid rgba(85, 225, 160, 0.3);
    border-radius: 999px;
    color: var(--green);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.9px;
    white-space: nowrap;
  }

  .pipeline {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    margin: 34px 0 24px;
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--surface);
  }

  .pipeline > span {
    padding: 14px 12px;
    border-right: 1px solid var(--border);
    color: var(--muted);
    font-size: 10px;
    letter-spacing: 0.55px;
    text-align: center;
  }

  .pipeline > span:last-child { border-right: 0; }
  .pipeline strong { margin-left: 5px; color: var(--text); }

  .control-deck, .expression-controls {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr)) minmax(180px, 1.25fr);
    align-items: end;
    gap: 12px;
  }

  .analysis-example label {
    display: grid;
    gap: 7px;
    color: var(--muted);
    font-size: 11px;
    font-weight: 600;
  }

  .analysis-example select, .analysis-example input, .analysis-example button {
    width: 100%;
    min-height: 42px;
    padding: 0 11px;
    border: 1px solid var(--border);
    border-radius: 7px;
    color: var(--text);
    background: var(--surface-raised);
    font: inherit;
  }

  .analysis-example select:focus, .analysis-example input:focus, .analysis-example button:focus {
    outline: 2px solid rgba(115, 170, 250, 0.65);
    outline-offset: 2px;
  }

  .analysis-example button {
    cursor: pointer;
    font-size: 12px;
    font-weight: 700;
  }

  .analysis-example button:disabled { cursor: progress; opacity: 0.55; }
  .analysis-example .run-button { border-color: rgba(115, 170, 250, 0.4); color: var(--blue); }
  .analysis-example button span { float: right; }

  .status {
    min-height: 20px;
    margin: 15px 0 20px;
    color: var(--muted);
    font-size: 11px;
  }

  .status[data-state="error"], .query-status[data-state="error"] { color: #ff8585; }

  .graph-metrics, .query-metrics {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .graph-metrics article, .query-metrics article {
    min-width: 0;
    padding: 15px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
  }

  .graph-metrics article > span, .query-metrics article > span, .live-expression > span {
    display: block;
    margin-bottom: 7px;
    color: var(--muted);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1px;
  }

  .graph-metrics article > strong, .query-metrics article > strong {
    display: block;
    overflow: hidden;
    color: var(--text);
    font-size: 15px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  [data-validation][data-state="ok"] { color: var(--green) !important; }

  .dataframe-lab {
    margin-top: 35px;
    padding: 25px;
    border: 1px solid rgba(85, 225, 160, 0.24);
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(15, 29, 35, 0.95), rgba(13, 18, 30, 0.98));
  }

  .lab-heading h2 {
    margin: 0 0 7px;
    font-size: clamp(19px, 3vw, 26px);
    letter-spacing: -0.55px;
  }

  .expression-editor {
    margin-top: 21px;
    overflow: hidden;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: rgba(7, 12, 21, 0.82);
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
  }

  .editor-titlebar {
    display: flex;
    justify-content: space-between;
    padding: 10px 13px;
    border-bottom: 1px solid var(--border);
    color: var(--muted);
    font-size: 10px;
  }

  .editor-dots { display: flex; align-items: center; gap: 5px; }
  .editor-dots i { width: 8px; height: 8px; border-radius: 50%; background: #ff776d; }
  .editor-dots i:nth-child(2) { background: var(--amber); }
  .editor-dots i:nth-child(3) { background: var(--green); }

  .expression-code { padding: 12px 15px; }
  .expression-code p { margin: 5px 0; color: #d9e4f4; font-size: 12px; }
  .expression-code p > span { display: inline-block; width: 28px; color: #596980; }
  .expression-code i { color: #d297ff; font-style: normal; }
  .expression-code b { color: var(--blue); font-weight: 500; }
  .expression-code em { color: var(--amber); font-style: normal; }

  .live-expression {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 15px;
    border-top: 1px solid var(--border);
  }

  .live-expression > span { margin: 0; }
  .live-expression > strong { color: var(--green); font-size: 14px; }

  .expression-controls {
    grid-template-columns: repeat(3, minmax(0, 1fr)) minmax(190px, 1.3fr);
    margin-top: 17px;
  }

  .analysis-example .query-button {
    border-color: rgba(85, 225, 160, 0.5);
    color: #092014;
    background: var(--green);
  }

  .query-metrics { margin-top: 18px; }
  .query-metrics article { background: rgba(10, 16, 24, 0.6); }
  .query-metrics .preview-metric strong { color: var(--amber); font-size: 12px; }

  .query-status {
    min-height: 18px;
    margin: 13px 0 0;
    color: var(--muted);
    font-size: 11px;
  }

  .query-status[data-state="verified"] { color: var(--green); }

  .visualizations {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 31px;
  }

  .visualization-card {
    min-width: 0;
    padding: 20px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--surface);
  }

  .visualization-card h3 { margin: 0 0 5px; font-size: 19px; }
  .visualization-card > p:last-of-type { font-size: 12px; }

  .histogram {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 160px;
    margin-top: 23px;
  }

  .histogram i {
    flex: 1;
    min-width: 1px;
    border-radius: 3px 3px 0 0;
    background: linear-gradient(180deg, #73aafa, rgba(78, 128, 199, 0.38));
  }

  .groups { display: grid; gap: 13px; margin-top: 25px; }
  .groups > div { position: relative; display: grid; grid-template-columns: 90px 1fr; gap: 6px; }
  .groups > div > span { color: var(--text); font-size: 11px; }
  .groups > div > i {
    align-self: center;
    height: 8px;
    border-radius: 5px;
    background: linear-gradient(90deg, #37a979, var(--green));
  }
  .groups > div > strong { grid-column: 2; color: var(--muted); font-size: 10px; font-weight: 500; }

  .heatmap-card { grid-column: 1 / -1; }
  .heatmap { display: grid; gap: 3px; max-width: 620px; margin: 20px auto 0; }
  .heatmap i { aspect-ratio: 1; border-radius: 2px; background: var(--amber); }

  .analysis-footer {
    margin-top: 25px;
    padding-top: 15px;
    border-top: 1px solid var(--border);
    color: var(--muted);
    font-size: 10px;
    letter-spacing: 0.3px;
  }

  @media (max-width: 900px) {
    .control-deck { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .expression-controls { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .graph-metrics, .query-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .pipeline strong { display: block; margin: 4px 0 0; }
  }

  @media (max-width: 600px) {
    .analysis-example { padding-top: 32px; }
    .analysis-hero, .lab-heading, .analysis-footer { flex-direction: column; gap: 11px; }
    .pipeline { grid-template-columns: 1fr; }
    .pipeline > span { border-right: 0; border-bottom: 1px solid var(--border); text-align: left; }
    .pipeline > span:last-child { border-bottom: 0; }
    .pipeline strong { display: inline; margin-left: 7px; }
    .dataframe-lab { padding: 15px; }
    .visualizations { grid-template-columns: 1fr; }
    .heatmap-card { grid-column: auto; }
    .expression-code p { font-size: 10px; }
    .live-expression { flex-direction: column; align-items: flex-start; gap: 5px; }
  }
`;
