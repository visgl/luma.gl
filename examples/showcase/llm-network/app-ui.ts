// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

type LLMStage = {name: string; kicker: string; copy: string; formula: string};
type LLMPrompt = {label: string};
type LLMConceptTooltip = {
  label: string;
  copy: string;
  left: number;
  top: number;
  stages: string;
  align?: 'left';
};

export function getLLMNetworkMarkup(props: {
  stages: readonly LLMStage[];
  prompts: readonly LLMPrompt[];
  conceptTooltips: readonly LLMConceptTooltip[];
}): string {
  const {stages, prompts, conceptTooltips} = props;
  return `
    <header class="llm-header">
      <div><p class="llm-eyebrow">luma.gl · visual transformer tour</p><h1>Inside a Transformer</h1></div>
      <nav data-prompts aria-label="Example prompts">
        ${prompts.map((prompt, index) => `<button data-prompt="${index}">${prompt.label}</button>`).join('')}
      </nav>
    </header>
    <ol class="llm-stage-rail" data-stages aria-label="Transformer stages">
      ${stages.map((stage, index) => `<li><button data-stage="${index}" title="${stage.name}"><small>${String(index + 1).padStart(2, '0')}</small><span>${stage.name}</span></button></li>`).join('')}
    </ol>
    <section class="llm-token-stack" aria-label="Prompt tokens">
      <p>Prompt tokens</p><div data-token-list></div>
    </section>
    <section class="llm-output-stack" aria-label="Next token probabilities">
      <p>Next token</p><ol data-candidates></ol>
    </section>
    <p class="llm-orbit-hint">Drag to orbit · scroll to zoom</p>
    <div class="llm-hotspots" aria-label="Concept explanations">
      ${conceptTooltips.map((tooltip, index) => `<button data-tooltip-stages="${tooltip.stages}" ${tooltip.align ? `data-align="${tooltip.align}"` : ''} style="--hotspot-left:${tooltip.left}%;--hotspot-top:${tooltip.top}%" aria-describedby="llm-tooltip-${index}"><span aria-hidden="true">i</span><span class="llm-tooltip-card" id="llm-tooltip-${index}" role="tooltip"><strong>${tooltip.label}</strong>${tooltip.copy}</span></button>`).join('')}
    </div>
    <section class="llm-story" data-story aria-label="Transformer story">
      ${stages.map((stage, index) => `<article data-story-stage="${index}"><p><span>${String(index + 1).padStart(2, '0')}</span> ${stage.kicker}</p><h2>${stage.name}</h2><p>${stage.copy}</p><code>${stage.formula}</code><small>Scroll to continue ↓</small></article>`).join('')}
    </section>
    <section class="llm-controls" aria-label="Visualization controls">
      <button data-play>Pause tour</button>
      <label class="stage-scrubber"><span>Pipeline</span><input data-stage-range type="range" min="0" max="9" step="1" value="2" aria-label="Transformer stage"></label>
      <label><span>Layer depth</span><input data-layer type="range" min="1" max="12" step="1" value="6"><output data-layer-output>6 / 12</output></label>
      <label><span>Signal speed</span><input data-speed type="range" min="0.2" max="2.5" step="0.1" value="1"></label>
    </section>
    <footer><span>Illustrative transformer anatomy · not a model trace</span><span>GPU-rendered with one luma.gl model</span></footer>`;
}
