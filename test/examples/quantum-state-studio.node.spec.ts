// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  applyQuantumGate,
  encodeQuantumGates,
  getProbabilityNormalization,
  getQuantumCircuitPreset,
  getQuantumStateCount,
  makeCommonGate,
  simulateQuantumCircuit
} from '../../examples/showcase/quantum-state-studio/quantum-circuit';
import {
  getQuantumBackgroundMarkup,
  getQuantumImplementationMarkup
} from '../../examples/showcase/quantum-state-studio/quantum-notes';
import {
  getQuantumExplanation,
  getQuantumGateExplanation
} from '../../examples/showcase/quantum-state-studio/quantum-explanations';

describe('Quantum State Studio state-vector indexing', () => {
  test('treats q0 as the least-significant computational-basis bit', () => {
    const initial = new Float32Array(8);
    initial[0] = 1;
    const xOnQubitZero = applyQuantumGate(initial, 2, makeCommonGate('X', 0));
    const xOnQubitOne = applyQuantumGate(initial, 2, makeCommonGate('X', 1));

    expect(Array.from(xOnQubitZero)).toEqual([0, 0, 1, 0, 0, 0, 0, 0]);
    expect(Array.from(xOnQubitOne)).toEqual([0, 0, 0, 0, 1, 0, 0, 0]);
  });

  test('applies a controlled gate only to basis states with the control bit set', () => {
    const input = new Float32Array([0, 0, 0, 0, 1, 0, 0, 0]); // |10>, q1 set
    const output = applyQuantumGate(input, 2, makeCommonGate('X', 0, 1));
    expect(Array.from(output)).toEqual([0, 0, 0, 0, 0, 0, 1, 0]); // |11>
  });
});

describe('Quantum State Studio circuits', () => {
  test('creates the expected Bell distribution and preserves normalization', () => {
    const history = simulateQuantumCircuit(getQuantumCircuitPreset('bell'));
    const finalState = history.at(-1)!;
    expect(finalState[0]).toBeCloseTo(Math.SQRT1_2, 6);
    expect(finalState[6]).toBeCloseTo(Math.SQRT1_2, 6);
    expect(finalState[2]).toBeCloseTo(0, 7);
    expect(finalState[4]).toBeCloseTo(0, 7);
    expect(getProbabilityNormalization(finalState)).toBeCloseTo(1, 6);
  });

  test.each([
    'bell',
    'ghz',
    'interference',
    'grover',
    'qft'
  ] as const)('%s preserves total probability through every gate', identifier => {
    for (const state of simulateQuantumCircuit(getQuantumCircuitPreset(identifier))) {
      expect(getProbabilityNormalization(state)).toBeCloseTo(1, 5);
    }
  });

  test('Grover preset amplifies the marked |11> state', () => {
    const finalState = simulateQuantumCircuit(getQuantumCircuitPreset('grover')).at(-1)!;
    expect(finalState[6]! ** 2 + finalState[7]! ** 2).toBeGreaterThan(0.999);
  });

  test('QFT of |0> has a uniform probability distribution', () => {
    const circuit = getQuantumCircuitPreset('qft');
    const finalState = simulateQuantumCircuit(circuit).at(-1)!;
    const expectedProbability = 1 / getQuantumStateCount(circuit.qubitCount);
    for (let basisIndex = 0; basisIndex < getQuantumStateCount(circuit.qubitCount); basisIndex++) {
      const real = finalState[basisIndex * 2]!;
      const imaginary = finalState[basisIndex * 2 + 1]!;
      expect(real * real + imaginary * imaginary).toBeCloseTo(expectedProbability, 5);
    }
  });
});

describe('Quantum State Studio GPU descriptor layout', () => {
  test('encodes target, optional control, and a row-major complex matrix in 48 bytes', () => {
    const gate = makeCommonGate('X', 2, 0);
    const encoded = encodeQuantumGates([gate]);
    const unsignedValues = new Uint32Array(encoded);
    const floatValues = new Float32Array(encoded);
    expect(encoded.byteLength).toBe(48);
    expect(unsignedValues[0]).toBe(2);
    expect(unsignedValues[1]).toBe(0);
    expect(Array.from(floatValues.slice(4, 12))).toEqual([0, 0, 1, 0, 1, 0, 0, 0]);
  });
});

describe('Quantum State Studio explanatory tabs', () => {
  test('documents both the visual encodings and graph-first implementation', () => {
    const background = getQuantumBackgroundMarkup();
    const implementation = getQuantumImplementationMarkup();

    expect(background).toContain('Superposition');
    expect(background).toContain('Interference');
    expect(background).toContain('Entanglement');
    expect(implementation).toContain('GPUCommandGraph');
    expect(implementation).toContain('complete-state-history');
    expect(implementation).toContain('selected-observables');
  });

  test('provides contextual explanations for GPU views, graph nodes, and concrete gates', () => {
    expect(getQuantumExplanation('probability-landscape')?.body).toContain('complex phase');
    expect(getQuantumExplanation('graph-normalization')?.body).toContain('Σ|αₓ|²');
    expect(getQuantumGateExplanation(makeCommonGate('H', 2), 4)).toMatchObject({
      eyebrow: 'Gate 4 · state slice 4',
      title: 'H on q2'
    });
    expect(getQuantumImplementationMarkup()).toContain('data-explain="graph-analysis"');
  });
});
