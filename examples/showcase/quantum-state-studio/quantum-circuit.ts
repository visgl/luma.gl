// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** One complex number stored as an interleaved real/imaginary pair. */
export type Complex = readonly [real: number, imaginary: number];

/** A one-qubit unitary, optionally conditioned on one control qubit. */
export type QuantumGate = {
  readonly id: string;
  readonly label: string;
  readonly target: number;
  readonly control?: number;
  /** Row-major 2x2 complex matrix. */
  readonly matrix: readonly [Complex, Complex, Complex, Complex];
};

export type QuantumCircuitPresetIdentifier = 'bell' | 'ghz' | 'interference' | 'grover' | 'qft';

export type QuantumCircuit = {
  readonly name: string;
  readonly description: string;
  readonly qubitCount: number;
  readonly gates: readonly QuantumGate[];
};

const SQRT_HALF = Math.SQRT1_2;
const I: Complex = [0, 1];
const ZERO: Complex = [0, 0];
const ONE: Complex = [1, 0];

export const COMMON_GATE_MATRICES = {
  H: [
    [SQRT_HALF, 0],
    [SQRT_HALF, 0],
    [SQRT_HALF, 0],
    [-SQRT_HALF, 0]
  ],
  X: [ZERO, ONE, ONE, ZERO],
  Y: [ZERO, [0, -1], I, ZERO],
  Z: [ONE, ZERO, ZERO, [-1, 0]],
  S: [ONE, ZERO, ZERO, I],
  T: [ONE, ZERO, ZERO, [SQRT_HALF, SQRT_HALF]]
} as const satisfies Record<string, readonly [Complex, Complex, Complex, Complex]>;

/** Makes a named common one-qubit gate. Qubit zero is the least-significant basis bit. */
export function makeCommonGate(
  label: keyof typeof COMMON_GATE_MATRICES,
  target: number,
  control?: number,
  id = `${label.toLowerCase()}-${target}-${control ?? 'none'}`
): QuantumGate {
  return {
    id,
    label: control === undefined ? label : `C${label}`,
    target,
    control,
    matrix: COMMON_GATE_MATRICES[label]
  };
}

/** Makes a phase rotation `diag(1, exp(i angle))`, optionally controlled. */
export function makePhaseGate(
  angle: number,
  target: number,
  control?: number,
  id = `phase-${target}-${control ?? 'none'}`
): QuantumGate {
  return {
    id,
    label: control === undefined ? 'P' : 'CP',
    target,
    control,
    matrix: [ONE, ZERO, ZERO, [Math.cos(angle), Math.sin(angle)]]
  };
}

/** Makes an X-axis rotation using the standard `exp(-i angle X / 2)` convention. */
export function makeRotationXGate(angle: number, target: number, id = `rx-${target}`): QuantumGate {
  const cosine = Math.cos(angle / 2);
  const sine = Math.sin(angle / 2);
  return {
    id,
    label: 'Rx',
    target,
    matrix: [
      [cosine, 0],
      [0, -sine],
      [0, -sine],
      [cosine, 0]
    ]
  };
}

/** Applies one gate to an interleaved complex state vector; used for tests and documentation. */
export function applyQuantumGate(
  amplitudes: Float32Array,
  qubitCount: number,
  gate: QuantumGate
): Float32Array {
  const stateCount = getQuantumStateCount(qubitCount);
  if (amplitudes.length !== stateCount * 2) {
    throw new Error('Quantum state must contain one complex pair per basis state.');
  }
  validateQuantumGate(gate, qubitCount);
  const output = new Float32Array(amplitudes.length);
  const targetMask = 1 << gate.target;
  const controlMask = gate.control === undefined ? 0 : 1 << gate.control;

  for (let basisIndex = 0; basisIndex < stateCount; basisIndex++) {
    if (gate.control !== undefined && (basisIndex & controlMask) === 0) {
      output[basisIndex * 2] = amplitudes[basisIndex * 2]!;
      output[basisIndex * 2 + 1] = amplitudes[basisIndex * 2 + 1]!;
      continue;
    }
    const row = (basisIndex & targetMask) === 0 ? 0 : 1;
    const zeroIndex = basisIndex & ~targetMask;
    const oneIndex = zeroIndex | targetMask;
    const left = gate.matrix[row * 2]!;
    const right = gate.matrix[row * 2 + 1]!;
    const leftValue: Complex = [amplitudes[zeroIndex * 2]!, amplitudes[zeroIndex * 2 + 1]!];
    const rightValue: Complex = [amplitudes[oneIndex * 2]!, amplitudes[oneIndex * 2 + 1]!];
    const leftProduct = multiplyComplex(left, leftValue);
    const rightProduct = multiplyComplex(right, rightValue);
    output[basisIndex * 2] = leftProduct[0] + rightProduct[0];
    output[basisIndex * 2 + 1] = leftProduct[1] + rightProduct[1];
  }
  return output;
}

/** Evaluates every circuit prefix, matching the GPU state-history layout used by the showcase. */
export function simulateQuantumCircuit(circuit: QuantumCircuit): Float32Array[] {
  validateQuantumCircuit(circuit);
  let amplitudes: Float32Array<ArrayBufferLike> = new Float32Array(
    getQuantumStateCount(circuit.qubitCount) * 2
  );
  amplitudes[0] = 1;
  const history = [amplitudes];
  for (const gate of circuit.gates) {
    amplitudes = applyQuantumGate(amplitudes, circuit.qubitCount, gate);
    history.push(amplitudes);
  }
  return history;
}

/** Returns total probability. Drift from one indicates accumulated floating-point error. */
export function getProbabilityNormalization(amplitudes: Float32Array): number {
  let probability = 0;
  for (let index = 0; index < amplitudes.length; index += 2) {
    probability += amplitudes[index]! ** 2 + amplitudes[index + 1]! ** 2;
  }
  return probability;
}

/** Encodes gate descriptors in the WGSL-aligned 48-byte layout consumed by the simulator. */
export function encodeQuantumGates(gates: readonly QuantumGate[]): ArrayBuffer {
  const wordCountPerGate = 12;
  const buffer = new ArrayBuffer(Math.max(gates.length, 1) * wordCountPerGate * 4);
  const unsignedValues = new Uint32Array(buffer);
  const floatValues = new Float32Array(buffer);
  gates.forEach((gate, gateIndex) => {
    const wordOffset = gateIndex * wordCountPerGate;
    unsignedValues[wordOffset] = gate.target;
    unsignedValues[wordOffset + 1] = gate.control ?? 0xffffffff;
    for (let matrixIndex = 0; matrixIndex < 4; matrixIndex++) {
      floatValues[wordOffset + 4 + matrixIndex * 2] = gate.matrix[matrixIndex]![0];
      floatValues[wordOffset + 5 + matrixIndex * 2] = gate.matrix[matrixIndex]![1];
    }
  });
  return buffer;
}

export function getQuantumStateCount(qubitCount: number): number {
  if (!Number.isInteger(qubitCount) || qubitCount < 1 || qubitCount > 20) {
    throw new Error('Quantum showcase qubitCount must be an integer from 1 through 20.');
  }
  return 2 ** qubitCount;
}

export function getQuantumCircuitPreset(
  identifier: QuantumCircuitPresetIdentifier
): QuantumCircuit {
  switch (identifier) {
    case 'bell':
      return makeCircuit(
        'Bell pair',
        'Maximal two-qubit entanglement from H then controlled-X.',
        2,
        [makeCommonGate('H', 0, undefined, 'bell-h'), makeCommonGate('X', 1, 0, 'bell-cx')]
      );
    case 'ghz':
      return makeCircuit('GHZ constellation', 'One coherent branch shared across ten qubits.', 10, [
        makeCommonGate('H', 0, undefined, 'ghz-h'),
        ...Array.from({length: 9}, (_, index) =>
          makeCommonGate('X', index + 1, index, `ghz-cx-${index}`)
        )
      ]);
    case 'interference':
      return makeCircuit(
        'Interference echo',
        'A relative phase turns two Hadamards from identity into inversion.',
        5,
        [
          makeCommonGate('H', 0, undefined, 'interference-h-0'),
          makeCommonGate('H', 1, undefined, 'interference-h-1'),
          makePhaseGate(Math.PI * 0.72, 0, undefined, 'interference-phase'),
          makeCommonGate('X', 1, 0, 'interference-cx'),
          makeCommonGate('H', 0, undefined, 'interference-h-2'),
          makeRotationXGate(Math.PI * 0.36, 1, 'interference-rx')
        ]
      );
    case 'grover':
      return makeCircuit(
        'Grover search · |11⟩',
        'A complete two-qubit amplitude-amplification iteration.',
        2,
        [
          makeCommonGate('H', 0, undefined, 'grover-h0'),
          makeCommonGate('H', 1, undefined, 'grover-h1'),
          makeCommonGate('Z', 1, 0, 'grover-oracle'),
          makeCommonGate('H', 0, undefined, 'grover-diffuse-h0a'),
          makeCommonGate('H', 1, undefined, 'grover-diffuse-h1a'),
          makeCommonGate('X', 0, undefined, 'grover-diffuse-x0a'),
          makeCommonGate('X', 1, undefined, 'grover-diffuse-x1a'),
          makeCommonGate('Z', 1, 0, 'grover-diffuse-cz'),
          makeCommonGate('X', 0, undefined, 'grover-diffuse-x0b'),
          makeCommonGate('X', 1, undefined, 'grover-diffuse-x1b'),
          makeCommonGate('H', 0, undefined, 'grover-diffuse-h0b'),
          makeCommonGate('H', 1, undefined, 'grover-diffuse-h1b')
        ]
      );
    case 'qft': {
      const qubitCount = 8;
      const gates: QuantumGate[] = [];
      for (let target = 0; target < qubitCount; target++) {
        gates.push(makeCommonGate('H', target, undefined, `qft-h-${target}`));
        for (let control = target + 1; control < qubitCount; control++) {
          gates.push(
            makePhaseGate(
              Math.PI / 2 ** (control - target),
              target,
              control,
              `qft-cp-${control}-${target}`
            )
          );
        }
      }
      for (let first = 0; first < qubitCount / 2; first++) {
        const second = qubitCount - first - 1;
        gates.push(...makeSwapGates(first, second, `qft-swap-${first}-${second}`));
      }
      return makeCircuit(
        'Quantum Fourier transform',
        'An eight-qubit QFT with controlled phase rotations and bit reversal.',
        qubitCount,
        gates
      );
    }
  }
}

function makeCircuit(
  name: string,
  description: string,
  qubitCount: number,
  gates: QuantumGate[]
): QuantumCircuit {
  return {name, description, qubitCount, gates};
}

function makeSwapGates(first: number, second: number, id: string): QuantumGate[] {
  return [
    makeCommonGate('X', second, first, `${id}-a`),
    makeCommonGate('X', first, second, `${id}-b`),
    makeCommonGate('X', second, first, `${id}-c`)
  ];
}

function validateQuantumCircuit(circuit: QuantumCircuit): void {
  getQuantumStateCount(circuit.qubitCount);
  for (const gate of circuit.gates) validateQuantumGate(gate, circuit.qubitCount);
}

function validateQuantumGate(gate: QuantumGate, qubitCount: number): void {
  if (!Number.isInteger(gate.target) || gate.target < 0 || gate.target >= qubitCount) {
    throw new Error(`Gate ${gate.id} target is outside the circuit.`);
  }
  if (
    gate.control !== undefined &&
    (!Number.isInteger(gate.control) ||
      gate.control < 0 ||
      gate.control >= qubitCount ||
      gate.control === gate.target)
  ) {
    throw new Error(`Gate ${gate.id} control must address a different circuit qubit.`);
  }
}

function multiplyComplex(left: Complex, right: Complex): Complex {
  return [left[0] * right[0] - left[1] * right[1], left[0] * right[1] + left[1] * right[0]];
}
