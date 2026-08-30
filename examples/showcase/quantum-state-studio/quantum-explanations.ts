// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {QuantumGate} from './quantum-circuit';

export type QuantumExplanation = {
  eyebrow: string;
  title: string;
  body: string;
};

const QUANTUM_EXPLANATIONS: Record<string, QuantumExplanation> = {
  'probability-landscape': {
    eyebrow: 'Computational basis',
    title: 'Probability landscape',
    body: 'Every horizontal position is one basis state |x⟩. Column height is |αₓ|² after the selected gate; hue is the complex phase arg(αₓ). Phase can change while probability stays fixed.'
  },
  'bloch-sphere': {
    eyebrow: 'One-qubit reduced state',
    title: 'Bloch sphere',
    body: 'The arrow is the selected qubit’s reduced Bloch vector. Direction describes its local state; length describes purity. A short vector often means this qubit is entangled with the rest of the globally pure state.'
  },
  correlations: {
    eyebrow: 'Two-qubit structure',
    title: 'Connected Z correlations',
    body: 'Each cell is ⟨ZiZj⟩ − ⟨Zi⟩⟨Zj⟩. Cyan and magenta encode the sign; brightness encodes strength. Connected correlation removes what the two individual qubit averages already explain.'
  },
  'interference-history': {
    eyebrow: 'Circuit evolution',
    title: 'Interference history',
    body: 'Each horizontal band is a GPU-resident state snapshot after one gate. Read upward through circuit time and across basis states to see phase become constructive or destructive probability.'
  },
  'active-circuit': {
    eyebrow: 'Current experiment',
    title: 'Active circuit',
    body: 'A circuit is an ordered list of unitary gates. The simulator stores the initial state plus one full state-vector snapshot after every gate, enabling instant scrubbing without replay.'
  },
  'preset-qft': {
    eyebrow: 'Preset',
    title: 'Quantum Fourier transform',
    body: 'Hadamards and controlled phase rotations convert a basis-domain pattern into phase/frequency structure. Watch the phase hues organize before the final bit-reversal swaps.'
  },
  'preset-bell': {
    eyebrow: 'Preset',
    title: 'Bell pair',
    body: 'A Hadamard creates two branches and CX correlates them. The result has two probability peaks, maximally mixed local qubits, and a strong off-diagonal correlation.'
  },
  'preset-ghz': {
    eyebrow: 'Preset',
    title: 'GHZ entanglement',
    body: 'One Hadamard followed by a CX chain creates a coherent superposition of all-zero and all-one states. Local Bloch vectors contract while correlations spread across many qubits.'
  },
  'preset-interference': {
    eyebrow: 'Preset',
    title: 'Interference echo',
    body: 'Two paths receive a relative phase and are recombined by a Hadamard. This makes the distinction between invisible phase rotation and visible probability redistribution especially clear.'
  },
  'preset-grover': {
    eyebrow: 'Preset',
    title: 'Grover amplitude amplification',
    body: 'An oracle flips the marked state’s phase, then diffusion reflects amplitudes around their mean. The marked basis state grows through interference—not through parallel quantum hardware here.'
  },
  play: {
    eyebrow: 'Timeline control',
    title: 'Animate gate boundaries',
    body: 'Play advances through already-computed GPU-resident snapshots. It does not rerun the simulation each frame; it changes the selected state-history offset used by analysis and rendering.'
  },
  scrubber: {
    eyebrow: 'Timeline control',
    title: 'Scrub gate by gate',
    body: 'Select the initial state or the state immediately after any gate. The probability landscape and history select a new buffer slice; the compact analysis graph recomputes Bloch and correlation observables.'
  },
  'target-qubit': {
    eyebrow: 'Circuit editor',
    title: 'Choose a gate target',
    body: 'The target bit selects which pairs of basis amplitudes a 2×2 complex matrix mixes. q0 is the least-significant bit in this showcase’s computational-basis indexing.'
  },
  'gate-editor': {
    eyebrow: 'Circuit editor',
    title: 'Append a reusable gate',
    body: 'These controls add descriptors over one general GPU kernel: a complex 2×2 matrix, target-bit mask, and optional control-bit mask. The engine then recompiles the circuit graph and its retained history.'
  },
  'observed-qubit': {
    eyebrow: 'Analysis selection',
    title: 'Choose the reduced qubit',
    body: 'This changes which single-qubit density reduction feeds the Bloch sphere. It does not change the circuit or global state—only the compact selected-observables graph.'
  },
  'circuit-track': {
    eyebrow: 'GPU-resident history',
    title: 'Circuit snapshots',
    body: 'Each tile selects the state immediately after that gate. The highlighted tile is the slice currently bound to the linked views.'
  },
  status: {
    eyebrow: 'Resource footprint',
    title: 'Current simulation scale',
    body: 'State count grows as 2^qubits. Retaining every gate boundary multiplies that cost by the snapshot count; complex f32 amplitudes use eight bytes per basis state per snapshot.'
  },
  'metric-qubits': {
    eyebrow: 'Live graph metric',
    title: 'Qubit count',
    body: 'The logical width of the simulated circuit. Adding one qubit doubles the state-vector length and the work performed by each full-state gate pass.'
  },
  'metric-states': {
    eyebrow: 'Live graph metric',
    title: 'Basis-state count',
    body: 'Exactly 2^qubits complex amplitudes describe this ideal pure state. These amplitudes remain in GPU storage buffers through analysis and rendering.'
  },
  'metric-snapshots': {
    eyebrow: 'Live graph metric',
    title: 'Retained snapshots',
    body: 'One initial slice plus one slice per gate. Retention makes scrubbing immediate but makes circuit depth a direct GPU-memory cost.'
  },
  'metric-nodes': {
    eyebrow: 'Live graph metric',
    title: 'Simulation graph nodes',
    body: 'Gate passes plus probability/phase derivation and normalization reduction. GPUCommandGraph derives execution order from declared buffer usage.'
  },
  'metric-memory': {
    eyebrow: 'Live graph metric',
    title: 'Resident GPU memory',
    body: 'The approximate byte footprint of state history, gate descriptors, derived probability/phase data, reductions, analysis outputs, and small control buffers.'
  },
  'graph-initial': {
    eyebrow: 'GPUCommandGraph node',
    title: 'Initial-state upload',
    body: 'The CPU initializes |0…0⟩ once. Every later state transformation, observable derivation, and rendered view consumes GPU-resident buffers.'
  },
  'graph-gates': {
    eyebrow: 'GPUCommandGraph nodes',
    title: 'Dependency-ordered gate passes',
    body: 'Each gate reads snapshot n and writes snapshot n+1. Declared storage usage lets the graph order hazards and compile reusable luma.gl Computations.'
  },
  'graph-probability': {
    eyebrow: 'GPUCommandGraph node',
    title: 'Probability and phase derivation',
    body: 'A parallel pass converts every complex amplitude (real, imaginary) into (probability, phase) for every retained snapshot. Rendering consumes this buffer directly.'
  },
  'graph-normalization': {
    eyebrow: 'GPUCommandGraph publication',
    title: 'Normalization reduction',
    body: 'A workgroup reduction measures Σ|αₓ|² for every snapshot and publishes complete-state-history. The value is visualized honestly rather than silently renormalizing the state.'
  },
  'graph-render': {
    eyebrow: 'luma.gl render node',
    title: 'Direct linked-view rendering',
    body: 'One fullscreen luma.gl Model binds probability, phase, normalization, Bloch, and correlation storage buffers. Only tiny control values cross from JavaScript.'
  },
  'graph-analysis': {
    eyebrow: 'Selected-observables graph',
    title: 'Scrub-triggered analysis branch',
    body: 'Changing the step or observed qubit runs only Bloch and connected-correlation reductions, then publishes selected-observables. The main circuit history is not replayed.'
  }
};

/** Returns stable educational copy for one interactive showcase element. */
export function getQuantumExplanation(identifier: string): QuantumExplanation | undefined {
  return QUANTUM_EXPLANATIONS[identifier];
}

/** Describes a concrete circuit gate rather than only its short circuit-diagram label. */
export function getQuantumGateExplanation(gate: QuantumGate, step: number): QuantumExplanation {
  const controlled =
    gate.control === undefined ? '' : ` q${gate.control} controls q${gate.target}.`;
  const gateBodies: Record<string, string> = {
    H: 'Hadamard mixes |0⟩ and |1⟩ with equal magnitude. It creates superposition or recombines branches so their relative phase becomes constructive or destructive probability.',
    X: 'Pauli X swaps the target bit’s |0⟩ and |1⟩ amplitudes—the quantum analogue of a NOT operation.',
    Y: 'Pauli Y swaps |0⟩ and |1⟩ while adding opposite imaginary phases.',
    Z: 'Pauli Z leaves |0⟩ unchanged and flips the sign of |1⟩, changing phase without directly changing probability.',
    S: 'The S gate rotates the |1⟩ amplitude by π/2 in complex phase.',
    T: 'The T gate rotates the |1⟩ amplitude by π/4, a finer phase step used by universal gate decompositions.',
    P: 'A phase gate rotates the target’s |1⟩ branch by the circuit-specified angle while preserving magnitude.',
    CP: 'Controlled phase rotates a target branch only when the control bit is set, creating conditional phase structure and often entanglement.',
    Rx: 'Rx rotates the target qubit around the Bloch sphere’s X axis, mixing real and imaginary components of its basis amplitudes.',
    CX: 'Controlled X flips the target only when the control is |1⟩. Acting on a superposed control can create entanglement.'
  };
  return {
    eyebrow: `Gate ${step} · state slice ${step}`,
    title: `${gate.label} on q${gate.target}`,
    body: `${gateBodies[gate.label] ?? 'A complex 2×2 unitary matrix transforms paired target-bit amplitudes.'}${controlled} The resulting full state is retained as GPU snapshot ${step}.`
  };
}
