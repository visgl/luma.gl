// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {QuantumCircuitPresetIdentifier} from './quantum-circuit';
import {getQuantumBackgroundMarkup, getQuantumImplementationMarkup} from './quantum-notes';

export const QUANTUM_PRESET_IDENTIFIERS: QuantumCircuitPresetIdentifier[] = [
  'qft',
  'bell',
  'ghz',
  'interference',
  'grover'
];

export function getQuantumStudioMarkup(): string {
  return `
    <header class="quantum-header">
      <div><p class="eyebrow">luma.gl · WebGPU compute showcase</p><h1>Quantum State Studio</h1></div>
      <p class="disclaimer">Classical state-vector simulation · complex f32 pairs · no claim of quantum speedup</p>
    </header>
    <nav class="quantum-tabs" data-tabs role="tablist" aria-label="Quantum State Studio views">
      <button role="tab" data-tab="explore" aria-controls="quantum-explore" aria-selected="true"><span>01</span> Explore</button>
      <button role="tab" data-tab="background" aria-controls="quantum-background" aria-selected="false"><span>02</span> Quantum background</button>
      <button role="tab" data-tab="implementation" aria-controls="quantum-implementation" aria-selected="false"><span>03</span> Implementation notes</button>
    </nav>
    <div id="quantum-explore" data-tab-panel="explore" role="tabpanel" aria-label="Interactive quantum state explorer"></div>
    <section id="quantum-background" class="quantum-notes-panel" data-tab-panel="background" role="tabpanel" aria-label="Quantum background" hidden>
      ${getQuantumBackgroundMarkup()}
    </section>
    <section id="quantum-implementation" class="quantum-notes-panel" data-tab-panel="implementation" role="tabpanel" aria-label="Implementation notes" hidden>
      ${getQuantumImplementationMarkup()}
    </section>
    <nav class="quantum-presets explore-only" data-presets aria-label="Circuit presets">
      ${QUANTUM_PRESET_IDENTIFIERS.map(identifier => `<button data-preset="${identifier}" data-explain="preset-${identifier}">${identifier === 'qft' ? 'QFT' : identifier[0]!.toUpperCase() + identifier.slice(1)}</button>`).join('')}
    </nav>
    <section class="quantum-copy explore-only" data-explain="active-circuit" tabindex="0">
      <p class="eyebrow">Active circuit</p><h2 data-circuit-name></h2><p data-circuit-description></p>
    </section>
    <div class="explain-region landscape-region explore-only" data-explain="probability-landscape" tabindex="0" aria-label="Explain the probability landscape"></div>
    <div class="explain-region bloch-region explore-only" data-explain="bloch-sphere" tabindex="0" aria-label="Explain the reduced-qubit Bloch sphere"></div>
    <div class="explain-region correlation-region explore-only" data-explain="correlations" tabindex="0" aria-label="Explain the connected correlation matrix"></div>
    <div class="explain-region history-region explore-only" data-explain="interference-history" tabindex="0" aria-label="Explain the interference history"></div>
    <section class="visual-label landscape-label explore-only"><span>Probability landscape</span><small>height = probability · hue = complex phase</small></section>
    <section class="visual-label bloch-label explore-only"><span>Reduced qubit</span><small>Bloch vector · radius = purity</small></section>
    <section class="visual-label correlation-label explore-only"><span>Connected correlations</span><small>⟨Zi Zj⟩ − ⟨Zi⟩⟨Zj⟩</small></section>
    <section class="visual-label history-label explore-only"><span>Interference history</span><small>basis state → · circuit step ↑</small></section>
    <section class="quantum-controls explore-only">
      <div class="scrubber" data-explain="scrubber"><button data-play data-explain="play">Pause</button><input data-step data-explain="scrubber" type="range" min="0" value="0" aria-label="Circuit step"><output data-step-value>0 / 0</output></div>
      <div class="editor" data-gates data-explain="gate-editor"><span>Add on</span><select data-target-qubit data-explain="target-qubit" aria-label="Target qubit"></select>${['H', 'X', 'Y', 'Z', 'P', 'Rx', 'CX'].map(gate => `<button data-add-gate="${gate}" data-explain="gate-editor">${gate}</button>`).join('')}<button data-undo data-explain="gate-editor">Undo</button></div>
      <label class="observe" data-explain="observed-qubit">Observe <select data-observed-qubit data-explain="observed-qubit" aria-label="Observed qubit"></select></label>
    </section>
    <div class="quantum-circuit-scroll explore-only" data-explain="circuit-track"><div class="quantum-circuit" data-circuit-track></div></div>
    <footer><span data-status data-explain="status"></span><span class="explanation-hint">Hover or focus glowing regions for an explanation</span></footer>
    <aside id="quantum-context-tooltip" class="quantum-tooltip" data-tooltip role="tooltip" aria-live="polite" hidden>
      <p class="eyebrow" data-tooltip-eyebrow></p><strong data-tooltip-title></strong>
      <p data-tooltip-body></p><code data-tooltip-detail hidden></code>
    </aside>`;
}
