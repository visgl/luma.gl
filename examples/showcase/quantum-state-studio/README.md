# Quantum State Studio

Quantum State Studio is a luma.gl WebGPU compute and rendering showcase. It is deliberately a
classical state-vector simulator for teaching and visual exploration, not a production quantum SDK
and not evidence of quantum speedup.

## Architecture

- Each amplitude is one `vec2<f32>` (`real`, `imaginary`). Qubit zero is the least-significant bit
  of the computational-basis index.
- The initial state and every gate result occupy consecutive slices of one GPU storage buffer.
  Scrubbing therefore selects an existing GPU-resident snapshot; it does not replay the circuit or
  download amplitudes.
- A reusable gate kernel applies any 2x2 complex one-qubit matrix, optionally conditioned on one
  control bit. The showcase instantiates H, X, Y, Z, S, T, phase, Rx, controlled-X, and controlled
  phase from that primitive.
- A `GPUCommandGraph` records gate dependencies, probability/phase derivation, and a workgroup
  normalization reduction. A second small graph derives the selected qubit's reduced Bloch vector
  and the connected Z-correlation matrix.
- The luma.gl `Model` reads those storage buffers directly. No amplitude or probability buffer is
  mapped to JavaScript between simulation and visualization.

## Visual encodings

- **Probability landscape:** height is normalized basis-state probability; hue is complex phase.
- **Interference history:** every row is a gate boundary and reveals amplitude migration and
  cancellation across the complete circuit.
- **Reduced-qubit sphere:** direction is the selected qubit's Bloch vector and length visualizes
  mixedness caused by entanglement with the other simulated qubits.
- **Correlation matrix:** cyan and magenta encode positive and negative connected
  `Z` correlations, `E[Zi Zj] - E[Zi] E[Zj]`.

The Bell, GHZ, interference, two-qubit Grover, and QFT presets are intentionally compact enough to
scrub gate by gate. The circuit strip is editable with common gates.

## Limits and numerical behavior

Memory and work scale exponentially: `2^qubits * (gateCount + 1) * 8` bytes for state history,
plus derived buffers. The UI is designed for fluid 8–16 qubit exploration, but circuit depth and
adapter storage limits still matter. The current guard is 16 qubits. Every gate uses `f32`, so small
normalization drift accumulates with depth; normalization is measured for visualization but the
state is not silently renormalized. The simulator models ideal pure states and unitary gates only.

## Follow-ups

- Density matrices and explicit noise/decoherence channels for very small systems.
- Tensor-network or sparse-state backends for circuits whose structure permits them.
- Complex phase-space, Wigner/quasi-probability, and entanglement-entropy views.
- Multi-control gate decomposition helpers and richer editable circuit interactions.
- Import adapters for OpenQASM/QIR and external circuit formats, kept outside luma.gl core.
- Progressive command-graph execution for deeper circuits and optional compact snapshot policies.
