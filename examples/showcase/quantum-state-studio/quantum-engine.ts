// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Buffer, type Device} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import {GPUCommandGraph, type CompiledGPUCommandGraph} from '@luma.gl/gpgpu/gpu-core';
import {encodeQuantumGates, getQuantumStateCount, type QuantumCircuit} from './quantum-circuit';

const WORKGROUP_SIZE = 256;
const MAXIMUM_QUBIT_COUNT = 16;

export type QuantumEngineStats = {
  stateCount: number;
  snapshotCount: number;
  residentByteLength: number;
  simulationNodeCount: number;
};

/** GPU-resident complex state history and derived observables for one editable circuit. */
export class QuantumStateEngine {
  readonly device: Device;
  readonly circuit: QuantumCircuit;
  readonly stateCount: number;
  readonly snapshotCount: number;
  readonly stateHistory: Buffer;
  readonly probabilityPhase: Buffer;
  readonly normalization: Buffer;
  readonly blochVector: Buffer;
  readonly correlations: Buffer;
  readonly controls: Buffer;
  readonly stats: QuantumEngineStats;

  private readonly gates: Buffer;
  private readonly simulationGraph: CompiledGPUCommandGraph<void>;
  private readonly analysisGraph: CompiledGPUCommandGraph<void>;
  private selectedStep = 0;
  private selectedQubit = 0;
  private destroyed = false;

  constructor(device: Device, circuit: QuantumCircuit) {
    if (device.type !== 'webgpu') throw new Error('Quantum State Studio requires WebGPU.');
    if (circuit.qubitCount > MAXIMUM_QUBIT_COUNT) {
      throw new Error(`Quantum State Studio supports at most ${MAXIMUM_QUBIT_COUNT} qubits.`);
    }
    this.device = device;
    this.circuit = circuit;
    this.stateCount = getQuantumStateCount(circuit.qubitCount);
    this.snapshotCount = circuit.gates.length + 1;

    const initialHistory = new Float32Array(this.stateCount * this.snapshotCount * 2);
    initialHistory[0] = 1;
    this.stateHistory = device.createBuffer({
      id: 'quantum-state-history',
      data: initialHistory,
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    this.gates = device.createBuffer({
      id: 'quantum-gate-descriptors',
      data: new Uint8Array(encodeQuantumGates(circuit.gates)),
      usage: Buffer.STORAGE | Buffer.COPY_DST
    });
    this.probabilityPhase = device.createBuffer({
      id: 'quantum-probability-phase',
      byteLength: this.stateCount * this.snapshotCount * 8,
      usage: Buffer.STORAGE
    });
    this.normalization = device.createBuffer({
      id: 'quantum-probability-normalization',
      byteLength: this.snapshotCount * 4,
      usage: Buffer.STORAGE
    });
    this.blochVector = device.createBuffer({
      id: 'quantum-bloch-vector',
      byteLength: 16,
      usage: Buffer.STORAGE
    });
    this.correlations = device.createBuffer({
      id: 'quantum-correlation-matrix',
      byteLength: MAXIMUM_QUBIT_COUNT * MAXIMUM_QUBIT_COUNT * 4,
      usage: Buffer.STORAGE
    });
    this.controls = device.createBuffer({
      id: 'quantum-controls',
      data: new Uint32Array([0, circuit.qubitCount, 0, this.stateCount]),
      usage: Buffer.UNIFORM | Buffer.COPY_DST
    });

    this.simulationGraph = this.createSimulationGraph();
    this.analysisGraph = this.createAnalysisGraph();
    this.stats = {
      stateCount: this.stateCount,
      snapshotCount: this.snapshotCount,
      residentByteLength:
        this.stateHistory.byteLength +
        this.gates.byteLength +
        this.probabilityPhase.byteLength +
        this.normalization.byteLength +
        this.blochVector.byteLength +
        this.correlations.byteLength +
        this.controls.byteLength,
      simulationNodeCount: this.simulationGraph.stats.nodeOrder.length
    };
    this.executeSimulation();
  }

  /** Selects a state-history slice and recomputes only its reduced observables. */
  setSelection(step: number, qubit: number): void {
    this.assertAvailable();
    this.selectedStep = Math.max(0, Math.min(this.snapshotCount - 1, Math.round(step)));
    this.selectedQubit = Math.max(0, Math.min(this.circuit.qubitCount - 1, Math.round(qubit)));
    this.controls.write(
      new Uint32Array([
        this.selectedStep,
        this.circuit.qubitCount,
        this.selectedQubit,
        this.stateCount
      ])
    );
    const commandEncoder = this.device.createCommandEncoder({id: 'quantum-selected-analysis'});
    this.analysisGraph.encode(commandEncoder, {parameters: undefined});
    this.device.submit(commandEncoder.finish());
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.analysisGraph.destroy();
    this.simulationGraph.destroy();
    this.controls.destroy();
    this.correlations.destroy();
    this.blochVector.destroy();
    this.normalization.destroy();
    this.probabilityPhase.destroy();
    this.gates.destroy();
    this.stateHistory.destroy();
  }

  private executeSimulation(): void {
    const commandEncoder = this.device.createCommandEncoder({id: 'quantum-simulate-circuit'});
    this.simulationGraph.encode(commandEncoder, {parameters: undefined});
    this.analysisGraph.encode(commandEncoder, {parameters: undefined});
    this.device.submit(commandEncoder.finish());
  }

  private createSimulationGraph(): CompiledGPUCommandGraph<void> {
    const graph = new GPUCommandGraph<void>(this.device, {id: 'quantum-state-history-graph'});
    const history = graph.importBuffer(
      {
        id: 'quantum-state-history',
        byteLength: this.stateHistory.byteLength,
        usage: this.stateHistory.usage
      },
      this.stateHistory
    );
    const gates = graph.importBuffer(
      {id: 'quantum-gates', byteLength: this.gates.byteLength, usage: this.gates.usage},
      this.gates
    );
    const probabilityPhase = graph.importBuffer(
      {
        id: 'quantum-probability-phase',
        byteLength: this.probabilityPhase.byteLength,
        usage: this.probabilityPhase.usage
      },
      this.probabilityPhase
    );
    const normalization = graph.importBuffer(
      {
        id: 'quantum-normalization',
        byteLength: this.normalization.byteLength,
        usage: this.normalization.usage
      },
      this.normalization
    );

    for (let gateIndex = 0; gateIndex < this.circuit.gates.length; gateIndex++) {
      graph.addComputePass({
        id: `apply-gate-${gateIndex}-${this.circuit.gates[gateIndex]!.id}`,
        resources: [
          {buffer: history, usage: 'storage-read-write'},
          {buffer: gates, usage: 'storage-read'}
        ],
        workload: {
          operation: 'complex-state-vector-gate',
          commandCount: 1,
          maximumInvocationCount: this.stateCount,
          readByteLength: this.stateCount * 16,
          writeByteLength: this.stateCount * 8
        },
        compile: ({device}) => {
          const computation = new Computation(device, {
            id: `quantum-gate-${gateIndex}`,
            source: getGateShader(this.stateCount, gateIndex),
            shaderLayout: {
              bindings: [
                {name: 'stateHistory', type: 'storage', group: 0, location: 0},
                {name: 'gates', type: 'read-only-storage', group: 0, location: 1}
              ]
            }
          });
          return {
            encode: ({computePass, getBuffer}) => {
              computation.setBindings({stateHistory: getBuffer(history), gates: getBuffer(gates)});
              computation.dispatch(computePass, Math.ceil(this.stateCount / WORKGROUP_SIZE));
            },
            destroy: () => computation.destroy()
          };
        }
      });
    }

    graph.addComputePass({
      id: 'derive-probability-and-phase',
      resources: [
        {buffer: history, usage: 'storage-read'},
        {buffer: probabilityPhase, usage: 'storage-write'}
      ],
      workload: {
        operation: 'complex-probability-phase',
        commandCount: 1,
        maximumInvocationCount: this.stateCount * this.snapshotCount
      },
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: 'quantum-probability-phase',
          source: getProbabilityPhaseShader(this.stateCount * this.snapshotCount),
          shaderLayout: {
            bindings: [
              {name: 'stateHistory', type: 'read-only-storage', group: 0, location: 0},
              {name: 'probabilityPhase', type: 'storage', group: 0, location: 1}
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            computation.setBindings({
              stateHistory: getBuffer(history),
              probabilityPhase: getBuffer(probabilityPhase)
            });
            computation.dispatch(
              computePass,
              Math.ceil((this.stateCount * this.snapshotCount) / WORKGROUP_SIZE)
            );
          },
          destroy: () => computation.destroy()
        };
      }
    });

    graph.addComputePass({
      id: 'reduce-probability-normalization',
      resources: [
        {buffer: probabilityPhase, usage: 'storage-read'},
        {buffer: normalization, usage: 'storage-write'}
      ],
      publication: {id: 'complete-state-history', completeness: 'complete'},
      workload: {
        operation: 'workgroup-probability-reduction',
        commandCount: 1,
        maximumInvocationCount: this.snapshotCount * WORKGROUP_SIZE
      },
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: 'quantum-normalization-reduction',
          source: getNormalizationShader(this.stateCount),
          shaderLayout: {
            bindings: [
              {name: 'probabilityPhase', type: 'read-only-storage', group: 0, location: 0},
              {name: 'normalization', type: 'storage', group: 0, location: 1}
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            computation.setBindings({
              probabilityPhase: getBuffer(probabilityPhase),
              normalization: getBuffer(normalization)
            });
            computation.dispatch(computePass, this.snapshotCount);
          },
          destroy: () => computation.destroy()
        };
      }
    });
    return graph.compile();
  }

  private createAnalysisGraph(): CompiledGPUCommandGraph<void> {
    const graph = new GPUCommandGraph<void>(this.device, {id: 'quantum-reduced-observables'});
    const history = graph.importBuffer(
      {
        id: 'analysis-history',
        byteLength: this.stateHistory.byteLength,
        usage: this.stateHistory.usage
      },
      this.stateHistory
    );
    const controls = graph.importBuffer(
      {id: 'analysis-controls', byteLength: this.controls.byteLength, usage: this.controls.usage},
      this.controls
    );
    const bloch = graph.importBuffer(
      {
        id: 'analysis-bloch',
        byteLength: this.blochVector.byteLength,
        usage: this.blochVector.usage
      },
      this.blochVector
    );
    const correlations = graph.importBuffer(
      {
        id: 'analysis-correlations',
        byteLength: this.correlations.byteLength,
        usage: this.correlations.usage
      },
      this.correlations
    );
    graph.addComputePass({
      id: 'reduce-selected-qubit-bloch-vector',
      resources: [
        {buffer: history, usage: 'storage-read'},
        {buffer: controls, usage: 'uniform'},
        {buffer: bloch, usage: 'storage-write'}
      ],
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: 'quantum-bloch-reduction',
          source: getBlochShader(),
          shaderLayout: {
            bindings: [
              {name: 'stateHistory', type: 'read-only-storage', group: 0, location: 0},
              {name: 'controls', type: 'uniform', group: 0, location: 1},
              {name: 'blochVector', type: 'storage', group: 0, location: 2}
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            computation.setBindings({
              stateHistory: getBuffer(history),
              controls: getBuffer(controls),
              blochVector: getBuffer(bloch)
            });
            computation.dispatch(computePass, 1);
          },
          destroy: () => computation.destroy()
        };
      }
    });
    graph.addComputePass({
      id: 'derive-connected-z-correlations',
      resources: [
        {buffer: history, usage: 'storage-read'},
        {buffer: controls, usage: 'uniform'},
        {buffer: correlations, usage: 'storage-write'}
      ],
      publication: {id: 'selected-observables', completeness: 'complete'},
      compile: ({device}) => {
        const computation = new Computation(device, {
          id: 'quantum-correlation-matrix',
          source: getCorrelationShader(),
          shaderLayout: {
            bindings: [
              {name: 'stateHistory', type: 'read-only-storage', group: 0, location: 0},
              {name: 'controls', type: 'uniform', group: 0, location: 1},
              {name: 'correlations', type: 'storage', group: 0, location: 2}
            ]
          }
        });
        return {
          encode: ({computePass, getBuffer}) => {
            computation.setBindings({
              stateHistory: getBuffer(history),
              controls: getBuffer(controls),
              correlations: getBuffer(correlations)
            });
            computation.dispatch(computePass, Math.ceil(MAXIMUM_QUBIT_COUNT ** 2 / 64));
          },
          destroy: () => computation.destroy()
        };
      }
    });
    return graph.compile();
  }

  private assertAvailable(): void {
    if (this.destroyed) throw new Error('Quantum State Engine has been destroyed.');
  }
}

function getGateShader(stateCount: number, gateIndex: number): string {
  return /* wgsl */ `
struct GateDescriptor {
  targetQubit: u32,
  control: u32,
  padding: vec2u,
  matrix0: vec2f,
  matrix1: vec2f,
  matrix2: vec2f,
  matrix3: vec2f,
};
@group(0) @binding(0) var<storage, read_write> stateHistory: array<vec2f>;
@group(0) @binding(1) var<storage, read> gates: array<GateDescriptor>;

fn multiplyComplex(left: vec2f, right: vec2f) -> vec2f {
  return vec2f(left.x * right.x - left.y * right.y, left.x * right.y + left.y * right.x);
}

@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) invocation: vec3u) {
  let basisIndex = invocation.x;
  if (basisIndex >= ${stateCount}u) { return; }
  let gate = gates[${gateIndex}u];
  let inputOffset = ${gateIndex * stateCount}u;
  let outputOffset = ${(gateIndex + 1) * stateCount}u;
  let controlEnabled = gate.control != 0xffffffffu;
  if (controlEnabled && (basisIndex & (1u << gate.control)) == 0u) {
    stateHistory[outputOffset + basisIndex] = stateHistory[inputOffset + basisIndex];
    return;
  }
  let targetMask = 1u << gate.targetQubit;
  let zeroIndex = basisIndex & ~targetMask;
  let oneIndex = zeroIndex | targetMask;
  let rowOne = (basisIndex & targetMask) != 0u;
  let left = select(gate.matrix0, gate.matrix2, rowOne);
  let right = select(gate.matrix1, gate.matrix3, rowOne);
  stateHistory[outputOffset + basisIndex] =
    multiplyComplex(left, stateHistory[inputOffset + zeroIndex]) +
    multiplyComplex(right, stateHistory[inputOffset + oneIndex]);
}`;
}

function getProbabilityPhaseShader(valueCount: number): string {
  return /* wgsl */ `
@group(0) @binding(0) var<storage, read> stateHistory: array<vec2f>;
@group(0) @binding(1) var<storage, read_write> probabilityPhase: array<vec2f>;
@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) invocation: vec3u) {
  let index = invocation.x;
  if (index >= ${valueCount}u) { return; }
  let amplitude = stateHistory[index];
  probabilityPhase[index] = vec2f(dot(amplitude, amplitude), atan2(amplitude.y, amplitude.x));
}`;
}

function getNormalizationShader(stateCount: number): string {
  return /* wgsl */ `
@group(0) @binding(0) var<storage, read> probabilityPhase: array<vec2f>;
@group(0) @binding(1) var<storage, read_write> normalization: array<f32>;
var<workgroup> partial: array<f32, ${WORKGROUP_SIZE}>;
@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(
  @builtin(workgroup_id) workgroup: vec3u,
  @builtin(local_invocation_id) local: vec3u
) {
  var sum = 0.0;
  var basisIndex = local.x;
  while (basisIndex < ${stateCount}u) {
    sum += probabilityPhase[workgroup.x * ${stateCount}u + basisIndex].x;
    basisIndex += ${WORKGROUP_SIZE}u;
  }
  partial[local.x] = sum;
  workgroupBarrier();
  var stride = ${WORKGROUP_SIZE / 2}u;
  while (stride > 0u) {
    if (local.x < stride) { partial[local.x] += partial[local.x + stride]; }
    workgroupBarrier();
    stride /= 2u;
  }
  if (local.x == 0u) { normalization[workgroup.x] = partial[0]; }
}`;
}

function getBlochShader(): string {
  return /* wgsl */ `
struct Controls { step: u32, qubitCount: u32, selectedQubit: u32, stateCount: u32 };
@group(0) @binding(0) var<storage, read> stateHistory: array<vec2f>;
@group(0) @binding(1) var<uniform> controls: Controls;
@group(0) @binding(2) var<storage, read_write> blochVector: array<vec4f>;
var<workgroup> partialX: array<f32, ${WORKGROUP_SIZE}>;
var<workgroup> partialY: array<f32, ${WORKGROUP_SIZE}>;
var<workgroup> partialZ: array<f32, ${WORKGROUP_SIZE}>;

@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(local_invocation_id) local: vec3u) {
  let offset = controls.step * controls.stateCount;
  let mask = 1u << controls.selectedQubit;
  var x = 0.0;
  var y = 0.0;
  var z = 0.0;
  var index = local.x;
  while (index < controls.stateCount) {
    let amplitude = stateHistory[offset + index];
    let probability = dot(amplitude, amplitude);
    z += select(probability, -probability, (index & mask) != 0u);
    if ((index & mask) == 0u) {
      let paired = stateHistory[offset + (index | mask)];
      x += 2.0 * (amplitude.x * paired.x + amplitude.y * paired.y);
      y += 2.0 * (amplitude.x * paired.y - amplitude.y * paired.x);
    }
    index += ${WORKGROUP_SIZE}u;
  }
  partialX[local.x] = x;
  partialY[local.x] = y;
  partialZ[local.x] = z;
  workgroupBarrier();
  var stride = ${WORKGROUP_SIZE / 2}u;
  while (stride > 0u) {
    if (local.x < stride) {
      partialX[local.x] += partialX[local.x + stride];
      partialY[local.x] += partialY[local.x + stride];
      partialZ[local.x] += partialZ[local.x + stride];
    }
    workgroupBarrier();
    stride /= 2u;
  }
  if (local.x == 0u) {
    let vector = vec3f(partialX[0], partialY[0], partialZ[0]);
    blochVector[0] = vec4f(vector, length(vector));
  }
}`;
}

function getCorrelationShader(): string {
  return /* wgsl */ `
struct Controls { step: u32, qubitCount: u32, selectedQubit: u32, stateCount: u32 };
@group(0) @binding(0) var<storage, read> stateHistory: array<vec2f>;
@group(0) @binding(1) var<uniform> controls: Controls;
@group(0) @binding(2) var<storage, read_write> correlations: array<f32>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) invocation: vec3u) {
  let cell = invocation.x;
  if (cell >= ${MAXIMUM_QUBIT_COUNT ** 2}u) { return; }
  let row = cell / ${MAXIMUM_QUBIT_COUNT}u;
  let column = cell % ${MAXIMUM_QUBIT_COUNT}u;
  if (row >= controls.qubitCount || column >= controls.qubitCount) {
    correlations[cell] = 0.0;
    return;
  }
  let offset = controls.step * controls.stateCount;
  var meanRow = 0.0;
  var meanColumn = 0.0;
  var meanProduct = 0.0;
  for (var index = 0u; index < controls.stateCount; index++) {
    let amplitude = stateHistory[offset + index];
    let probability = dot(amplitude, amplitude);
    let rowSign = select(1.0, -1.0, (index & (1u << row)) != 0u);
    let columnSign = select(1.0, -1.0, (index & (1u << column)) != 0u);
    meanRow += probability * rowSign;
    meanColumn += probability * columnSign;
    meanProduct += probability * rowSign * columnSign;
  }
  correlations[cell] = meanProduct - meanRow * meanColumn;
}`;
}
