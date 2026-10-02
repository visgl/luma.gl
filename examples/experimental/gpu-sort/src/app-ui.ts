// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

const STYLE_ID = 'gpu-sort-example-style';

export type GPUSortExampleElements = {
  algorithm: HTMLSelectElement;
  compileTime: HTMLElement;
  dataset: HTMLSelectElement;
  direction: HTMLSelectElement;
  inputSample: HTMLElement;
  layout: HTMLSelectElement;
  nodeCount: HTMLElement;
  outputSample: HTMLElement;
  resolvedAlgorithm: HTMLElement;
  reuse: HTMLElement;
  run: HTMLButtonElement;
  status: HTMLElement;
  validation: HTMLElement;
};

export function mountGPUSortExampleUI(root: HTMLElement): GPUSortExampleElements {
  ensureStyles();
  root.innerHTML = EXAMPLE_HTML;
  const get = <ElementType extends HTMLElement>(selector: string): ElementType => {
    const element = root.querySelector<ElementType>(selector);
    if (!element) throw new Error(`GPU sort example is missing ${selector}`);
    return element;
  };
  return {
    algorithm: get('[data-algorithm]'),
    compileTime: get('[data-compile-time]'),
    dataset: get('[data-dataset]'),
    direction: get('[data-direction]'),
    inputSample: get('[data-input-sample]'),
    layout: get('[data-layout]'),
    nodeCount: get('[data-node-count]'),
    outputSample: get('[data-output-sample]'),
    resolvedAlgorithm: get('[data-resolved-algorithm]'),
    reuse: get('[data-reuse]'),
    run: get('[data-run]'),
    status: get('[data-status]'),
    validation: get('[data-validation]')
  };
}

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = EXAMPLE_CSS;
  document.head.appendChild(style);
}

const EXAMPLE_HTML = `
<main class="gpu-sort-example">
  <header>
    <p class="eyebrow">@luma.gl/experimental · GPUCommandGraph</p>
    <h1>Graph-native GPU sort</h1>
    <p>Stable paired uint32 sorting for one global domain or independent streaming batches.</p>
  </header>
  <section class="controls">
    <label>Dataset<select data-dataset><option value="small">16 rows</option><option value="workgroup">256 rows</option><option value="medium">4,096 rows</option><option value="large">131,072 rows</option></select></label>
    <label>Storage<select data-layout><option value="packed">One packed batch</option><option value="streamed" selected>Preserved Arrow batches</option></select></label>
    <label>Algorithm<select data-algorithm><option value="auto">Auto</option><option value="bitonic">Bitonic</option><option value="radix">Radix</option></select></label>
    <label>Direction<select data-direction><option value="ascending">Ascending</option><option value="descending">Descending</option></select></label>
    <button data-run>Compile and run</button>
  </section>
  <p class="status" data-status>Initializing…</p>
  <section class="metrics">
    <article><span>Resolved per batch</span><strong data-resolved-algorithm>—</strong></article>
    <article><span>Graph nodes</span><strong data-node-count>—</strong></article>
    <article><span>Transient reuse</span><strong data-reuse>—</strong></article>
    <article><span>Compile time</span><strong data-compile-time>—</strong></article>
  </section>
  <section class="samples">
    <article><h2>Arrow input <small>key:rowId</small></h2><code data-input-sample>—</code></article>
    <article><h2>GPU output <small>key:rowId</small></h2><code data-output-sample>—</code><p data-validation>Awaiting result</p></article>
  </section>
</main>`;

const EXAMPLE_CSS = `
.gpu-sort-example{box-sizing:border-box;min-height:100%;padding:32px;color:#172033;background:radial-gradient(circle at 85% 0,#dce8ff,transparent 34%),#f7f9fc;font-family:Inter,ui-sans-serif,system-ui,sans-serif}.gpu-sort-example *{box-sizing:border-box}.gpu-sort-example header,.gpu-sort-example>section,.gpu-sort-example>.status{max-width:1120px;margin-left:auto;margin-right:auto}.gpu-sort-example h1{margin:4px 0 8px;font-size:clamp(30px,5vw,54px);letter-spacing:-.04em}.gpu-sort-example .eyebrow{margin:0;color:#315cc5;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.controls{display:flex;flex-wrap:wrap;gap:12px;align-items:end;margin-top:26px;padding:18px;border:1px solid #cbd5e1;border-radius:16px;background:#fff;box-shadow:0 12px 35px #26355414}.controls label{display:grid;gap:6px;color:#526078;font-size:12px;font-weight:700}.controls select,.controls button{min-height:40px;padding:0 12px;border:1px solid #aebbd0;border-radius:9px;background:#fff;color:#172033;font:inherit}.controls button{border-color:#315cc5;background:#315cc5;color:#fff;cursor:pointer}.controls button:disabled{opacity:.55}.status{padding:12px 2px;color:#526078}.status[data-state=error],[data-validation][data-state=error]{color:#b42318}.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.metrics article,.samples article{padding:18px;border:1px solid #d3dbe8;border-radius:14px;background:#fff}.metrics span{display:block;color:#667085;font-size:12px}.metrics strong{display:block;margin-top:8px;font-size:22px}.samples{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}.samples h2{margin:0 0 14px;font-size:17px}.samples small{color:#667085;font-weight:500}.samples code{display:block;min-height:100px;max-height:210px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;color:#244282;line-height:1.6}.samples p{margin:14px 0 0;color:#087443;font-weight:700}@media(max-width:760px){.gpu-sort-example{padding:20px}.metrics{grid-template-columns:1fr 1fr}.samples{grid-template-columns:1fr}}`;
