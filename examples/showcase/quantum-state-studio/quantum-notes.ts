// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Rich, visual-first background material shown without leaving the running showcase. */
export function getQuantumBackgroundMarkup(): string {
  return `
    <div class="notes-hero">
      <div>
        <p class="eyebrow">A visual language for quantum state</p>
        <h2>Read the state, not just the circuit.</h2>
      </div>
      <p>Circuits describe operations. These linked views reveal what those operations do to every
      computational-basis amplitude—magnitude, phase, interference, and correlation—at each gate boundary.</p>
    </div>
    <div class="concept-grid">
      <article class="concept-card concept-superposition">
        <span class="concept-index">01</span><p class="eyebrow">Superposition</p>
        <h3>One state, many complex amplitudes</h3>
        <div class="formula">|ψ⟩ = Σ<sub>x</sub> α<sub>x</sub>|x⟩</div>
        <p>The landscape allocates one column to each basis state. Height is
        <strong>|α<sub>x</sub>|²</strong>; cyclic hue preserves the otherwise invisible complex phase.</p>
      </article>
      <article class="concept-card concept-interference">
        <span class="concept-index">02</span><p class="eyebrow">Interference</p>
        <h3>Amplitudes combine before probabilities</h3>
        <div class="phase-orbit" aria-hidden="true"><i></i><i></i><i></i></div>
        <p>Equal magnitudes can reinforce or cancel depending on phase. Scrub the history to see a
        phase rotation redirect probability when a later Hadamard recombines branches.</p>
      </article>
      <article class="concept-card concept-entanglement">
        <span class="concept-index">03</span><p class="eyebrow">Entanglement</p>
        <h3>The whole can be pure while one qubit is mixed</h3>
        <div class="formula">ρ<sub>q</sub> = Tr<sub>rest</sub>(|ψ⟩⟨ψ|)</div>
        <p>The selected qubit's Bloch vector contracts toward the sphere center as it entangles.
        Connected Z correlations reveal which qubits share structure beyond their individual means.</p>
      </article>
      <article class="concept-card concept-indexing">
        <span class="concept-index">04</span><p class="eyebrow">Basis indexing</p>
        <h3>Qubit zero is the least-significant bit</h3>
        <div class="basis-strip"><span>|000⟩</span><span>|001⟩</span><span>|010⟩</span><span>…</span><span>|111⟩</span></div>
        <p>Basis index <strong>x</strong> maps directly to the bit pattern of |x⟩. A target-bit mask
        pairs indices for each one-qubit matrix application; a control mask gates the same primitive.</p>
      </article>
    </div>
    <section class="preset-field-guide">
      <div><p class="eyebrow">Field guide</p><h3>What to watch in each preset</h3></div>
      <dl>
        <div><dt>QFT</dt><dd>Phase gradients become a frequency-domain probability pattern.</dd></div>
        <div><dt>Bell</dt><dd>Two distant peaks, a collapsed local Bloch vector, and perfect correlation.</dd></div>
        <div><dt>GHZ</dt><dd>One coherent branch fans out into a ten-qubit correlation constellation.</dd></div>
        <div><dt>Interference</dt><dd>A phase shift becomes visible probability only after recombination.</dd></div>
        <div><dt>Grover</dt><dd>The marked basis state is amplified by oracle phase and diffusion.</dd></div>
      </dl>
    </section>`;
}

/** Implementation notes that mirror the actual GPUCommandGraph and storage-buffer architecture. */
export function getQuantumImplementationMarkup(): string {
  return `
    <div class="notes-hero implementation-hero">
      <div><p class="eyebrow">Inside the showcase</p><h2>A graph of GPU-resident state transformations.</h2></div>
      <p>This is a classical state-vector simulator designed to showcase luma.gl compute and rendering.
      It does not claim quantum acceleration and intentionally keeps quantum-domain APIs out of core.</p>
    </div>
    <div class="implementation-metrics" aria-label="Current circuit GPU statistics">
      <div><strong data-note-qubits>–</strong><span>qubits</span></div>
      <div><strong data-note-states>–</strong><span>basis states</span></div>
      <div><strong data-note-snapshots>–</strong><span>resident snapshots</span></div>
      <div><strong data-note-nodes>–</strong><span>simulation graph nodes</span></div>
      <div><strong data-note-memory>–</strong><span>resident GPU memory</span></div>
    </div>
    <section class="graph-notes">
      <div class="graph-title"><p class="eyebrow">Compiled GPUCommandGraph</p><h3>Circuit evolution graph</h3></div>
      <div class="graph-flow" role="img" aria-label="Initial state flows through gate nodes, probability and phase derivation, normalization reduction, and direct rendering">
        <div class="graph-node source"><small>upload once</small><strong>|0…0⟩</strong><span>slice 0</span></div>
        <b>→</b>
        <div class="graph-node repeated"><small>compute × gate count</small><strong>Gate nodes</strong><span>slice n → n+1</span></div>
        <b>→</b>
        <div class="graph-node"><small>compute</small><strong>Probability + phase</strong><span>all snapshots</span></div>
        <b>→</b>
        <div class="graph-node publication"><small>reduction + publication</small><strong>Normalization</strong><span>complete history</span></div>
        <b>→</b>
        <div class="graph-node render"><small>luma.gl Model</small><strong>Linked views</strong><span>zero amplitude readback</span></div>
      </div>
      <div class="analysis-branch"><span>On scrub / observed-qubit change</span><b>Selected history slice</b><i>→</i><b>Bloch reduction</b><i>+</i><b>Connected Z correlations</b></div>
    </section>
    <div class="implementation-grid">
      <article><p class="eyebrow">Storage layout</p><h3>Complex f32 pairs</h3>
        <code>stateHistory[step · 2^q + basis] = vec2&lt;f32&gt;(real, imaginary)</code>
        <p>Every gate boundary owns a contiguous slice. Scrubbing changes an offset and runs only the
        compact selected-observables graph; it never replays the circuit.</p></article>
      <article><p class="eyebrow">Reusable gate primitive</p><h3>2×2 complex matrix + bit masks</h3>
        <code>output[i] = M[row,0] · input[i₀] + M[row,1] · input[i₁]</code>
        <p>H, X, Y, Z, S, T, phase, and Rx are descriptors over one kernel. An optional control bit
        turns the same operation into CX, CZ, or controlled phase.</p></article>
      <article><p class="eyebrow">Graph architecture</p><h3>Hazards become dependencies</h3>
        <p>Each gate declares state-history read/write usage. GPUCommandGraph infers ordering, compiles
        reusable computations, annotates workload, and publishes <code>complete-state-history</code>
        only after reduction. The scrub branch similarly publishes <code>selected-observables</code>.</p></article>
      <article><p class="eyebrow">Render path</p><h3>Storage buffer to pixels</h3>
        <p>The visualization Model binds probability, phase, normalization, Bloch, and correlation
        buffers directly. JavaScript uploads tiny controls; amplitude data never crosses back to the CPU.</p></article>
      <article><p class="eyebrow">Numerics</p><h3>Honest f32 behavior</h3>
        <p>Probability normalization is measured, not silently repaired. Drift grows with circuit depth.
        The current ideal pure-state model has no noise channels or density-matrix evolution.</p></article>
      <article><p class="eyebrow">Performance envelope</p><h3>Exponential by design</h3>
        <code>history bytes = 2^q · snapshots · 8</code>
        <p>The interaction target is 8–16 qubits. At 16 qubits, state plus derived visualization data
        costs roughly 1 MiB per retained snapshot, so depth is the practical constraint.</p></article>
    </div>`;
}
