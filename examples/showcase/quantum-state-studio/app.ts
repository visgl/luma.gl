// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {CanvasContext, Device} from '@luma.gl/core';
import {AnimationLoopTemplate, type AnimationProps} from '@luma.gl/engine';
import './quantum-styles.css';
import {
  getQuantumCircuitPreset,
  makeCommonGate,
  makePhaseGate,
  makeRotationXGate,
  type QuantumCircuit,
  type QuantumCircuitPresetIdentifier,
  type QuantumGate
} from './quantum-circuit';
import {QuantumStateEngine} from './quantum-engine';
import {getQuantumBackgroundMarkup, getQuantumImplementationMarkup} from './quantum-notes';
import {QuantumStateRenderer} from './quantum-renderer';

export const title = 'Quantum State Studio';
export const description =
  'A classical WebGPU state-vector simulator with GPU-resident state history and linked quantum visualizations.';

const PRESET_IDENTIFIERS: QuantumCircuitPresetIdentifier[] = [
  'qft',
  'bell',
  'ghz',
  'interference',
  'grover'
];

type QuantumStudioTab = 'explore' | 'background' | 'implementation';

/** Cinematic luma.gl compute showcase; this is a classical simulator, not a quantum SDK. */
export default class QuantumStateStudioAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = '';

  private readonly device: Device;
  private circuit = getQuantumCircuitPreset('qft');
  private engine: QuantumStateEngine;
  private renderer: QuantumStateRenderer;
  private root: HTMLElement | null = null;
  private circuitTrack: HTMLElement | null = null;
  private stepInput: HTMLInputElement | null = null;
  private stepValue: HTMLElement | null = null;
  private targetSelect: HTMLSelectElement | null = null;
  private qubitSelect: HTMLSelectElement | null = null;
  private status: HTMLElement | null = null;
  private selectedStep = 0;
  private selectedQubit = 0;
  private playing = true;
  private previousAdvanceTime = 0;
  private customGateSequence = 0;

  constructor(animationProps: AnimationProps) {
    super(animationProps);
    if (animationProps.device.type !== 'webgpu') {
      throw new Error('Quantum State Studio requires WebGPU.');
    }
    this.device = animationProps.device;
    this.engine = new QuantumStateEngine(this.device, this.circuit);
    this.renderer = new QuantumStateRenderer(this.device, this.engine);
    this.setSelection(0, 0);
  }

  override async onInitialize({canvas}: AnimationProps): Promise<void> {
    if (!(canvas instanceof HTMLCanvasElement)) return;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute(
      'aria-label',
      'Linked probability landscape, interference history, Bloch sphere, and qubit correlation matrix'
    );
    this.root = document.createElement('section');
    this.root.className = 'quantum-interface';
    this.root.innerHTML = getInterfaceMarkup();
    (canvas.parentElement ?? document.body).appendChild(this.root);
    this.circuitTrack = this.root.querySelector('[data-circuit-track]');
    this.stepInput = this.root.querySelector('[data-step]');
    this.stepValue = this.root.querySelector('[data-step-value]');
    this.targetSelect = this.root.querySelector('[data-target-qubit]');
    this.qubitSelect = this.root.querySelector('[data-observed-qubit]');
    this.status = this.root.querySelector('[data-status]');
    this.installEvents();
    this.setActiveTab('explore');
    this.refreshInterface();
  }

  override onRender({canvasContext, time}: AnimationProps): void {
    if (this.playing && time - this.previousAdvanceTime > 920) {
      this.previousAdvanceTime = time;
      this.setSelection((this.selectedStep + 1) % this.engine.snapshotCount, this.selectedQubit);
    }
    this.renderer.render(canvasContext as CanvasContext, time);
  }

  override onFinalize(): void {
    this.root?.remove();
    this.root = null;
    this.renderer.destroy();
    this.engine.destroy();
  }

  private installEvents(): void {
    this.root?.querySelector('[data-tabs]')?.addEventListener('click', event => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-tab]');
      const tab = button?.dataset.tab;
      if (tab === 'explore' || tab === 'background' || tab === 'implementation') {
        this.setActiveTab(tab);
      }
    });
    this.root?.querySelector('[data-presets]')?.addEventListener('click', event => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-preset]');
      const identifier = button?.dataset.preset;
      if (identifier && isPresetIdentifier(identifier))
        this.loadCircuit(getQuantumCircuitPreset(identifier));
    });
    this.root?.querySelector('[data-gates]')?.addEventListener('click', event => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-add-gate]');
      if (button?.dataset.addGate) this.appendGate(button.dataset.addGate);
    });
    this.root?.querySelector('[data-play]')?.addEventListener('click', event => {
      this.playing = !this.playing;
      (event.currentTarget as HTMLButtonElement).textContent = this.playing ? 'Pause' : 'Play';
    });
    this.root?.querySelector('[data-undo]')?.addEventListener('click', () => {
      if (this.circuit.gates.length === 0) return;
      this.loadCircuit({
        ...this.circuit,
        name: 'Custom circuit',
        gates: this.circuit.gates.slice(0, -1)
      });
    });
    this.stepInput?.addEventListener('input', () => {
      this.playing = false;
      const play = this.root?.querySelector<HTMLButtonElement>('[data-play]');
      if (play) play.textContent = 'Play';
      this.setSelection(Number(this.stepInput?.value), this.selectedQubit);
    });
    this.qubitSelect?.addEventListener('change', () => {
      this.setSelection(this.selectedStep, Number(this.qubitSelect?.value));
    });
    this.circuitTrack?.addEventListener('click', event => {
      const gate = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-gate-step]');
      if (gate) {
        this.playing = false;
        const play = this.root?.querySelector<HTMLButtonElement>('[data-play]');
        if (play) play.textContent = 'Play';
        this.setSelection(Number(gate.dataset.gateStep), this.selectedQubit);
      }
    });
  }

  private appendGate(label: string): void {
    const target = Number(this.targetSelect?.value ?? 0);
    const control = target === 0 ? Math.min(1, this.circuit.qubitCount - 1) : 0;
    const id = `custom-${label.toLowerCase()}-${this.customGateSequence++}`;
    let gate: QuantumGate;
    switch (label) {
      case 'CX':
        gate = makeCommonGate('X', target, control, id);
        break;
      case 'P':
        gate = makePhaseGate(Math.PI / 4, target, undefined, id);
        break;
      case 'Rx':
        gate = makeRotationXGate(Math.PI / 3, target, id);
        break;
      default:
        gate = makeCommonGate(label as 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T', target, undefined, id);
    }
    this.loadCircuit({
      ...this.circuit,
      name: 'Custom circuit',
      description: 'An editable sequence assembled in the showcase.',
      gates: [...this.circuit.gates, gate]
    });
    this.setSelection(this.circuit.gates.length, target);
  }

  private setActiveTab(tab: QuantumStudioTab): void {
    if (!this.root) return;
    this.root.dataset.activeTab = tab;
    this.root.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(button => {
      const selected = button.dataset.tab === tab;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    this.root.querySelectorAll<HTMLElement>('[data-tab-panel]').forEach(panel => {
      panel.hidden = panel.dataset.tabPanel !== tab;
    });
  }

  private loadCircuit(circuit: QuantumCircuit): void {
    const previousEngine = this.engine;
    const previousRenderer = this.renderer;
    this.circuit = circuit;
    this.engine = new QuantumStateEngine(this.device, circuit);
    this.renderer = new QuantumStateRenderer(this.device, this.engine);
    this.selectedStep = Math.min(this.selectedStep, circuit.gates.length);
    this.selectedQubit = Math.min(this.selectedQubit, circuit.qubitCount - 1);
    this.setSelection(this.selectedStep, this.selectedQubit);
    previousRenderer.destroy();
    previousEngine.destroy();
    this.refreshInterface();
  }

  private setSelection(step: number, qubit: number): void {
    this.selectedStep = Math.max(0, Math.min(this.engine.snapshotCount - 1, Math.round(step)));
    this.selectedQubit = Math.max(0, Math.min(this.circuit.qubitCount - 1, Math.round(qubit)));
    this.engine.setSelection(this.selectedStep, this.selectedQubit);
    this.renderer.setSelection(this.selectedStep, this.selectedQubit);
    if (this.stepInput) this.stepInput.value = String(this.selectedStep);
    if (this.stepValue)
      this.stepValue.textContent = `${this.selectedStep} / ${this.circuit.gates.length}`;
    if (this.qubitSelect) this.qubitSelect.value = String(this.selectedQubit);
    this.circuitTrack?.querySelectorAll('[data-gate-step]').forEach(element => {
      element.classList.toggle(
        'active',
        Number((element as HTMLElement).dataset.gateStep) === this.selectedStep
      );
    });
  }

  private refreshInterface(): void {
    const name = this.root?.querySelector('[data-circuit-name]');
    const description = this.root?.querySelector('[data-circuit-description]');
    if (name) name.textContent = this.circuit.name;
    if (description) description.textContent = this.circuit.description;
    if (this.stepInput) {
      this.stepInput.max = String(this.circuit.gates.length);
      this.stepInput.value = String(this.selectedStep);
    }
    const qubitOptions = Array.from(
      {length: this.circuit.qubitCount},
      (_, qubit) => `<option value="${qubit}">q${qubit}</option>`
    ).join('');
    if (this.targetSelect) this.targetSelect.innerHTML = qubitOptions;
    if (this.qubitSelect) {
      this.qubitSelect.innerHTML = qubitOptions;
      this.qubitSelect.value = String(this.selectedQubit);
    }
    if (this.circuitTrack) {
      this.circuitTrack.innerHTML = [
        '<button class="quantum-gate active initial" data-gate-step="0" title="Initial |0…0⟩ state">|0⟩</button>',
        ...this.circuit.gates.map(
          (gate, index) =>
            `<button class="quantum-gate" data-gate-step="${index + 1}" title="${getGateTitle(gate)}"><span>${gate.label}</span><small>${gate.control === undefined ? '' : `q${gate.control}→`}q${gate.target}</small></button>`
        )
      ].join('');
    }
    if (this.status) {
      const mebibytes = this.engine.stats.residentByteLength / 1024 / 1024;
      this.status.textContent = `${this.circuit.qubitCount} qubits · ${this.engine.stateCount.toLocaleString()} basis states · ${this.engine.snapshotCount} GPU-resident snapshots · ${mebibytes.toFixed(2)} MiB`;
      this.setNoteText('[data-note-qubits]', this.circuit.qubitCount.toLocaleString());
      this.setNoteText('[data-note-states]', this.engine.stateCount.toLocaleString());
      this.setNoteText('[data-note-snapshots]', this.engine.snapshotCount.toLocaleString());
      this.setNoteText('[data-note-nodes]', this.engine.stats.simulationNodeCount.toLocaleString());
      this.setNoteText('[data-note-memory]', `${mebibytes.toFixed(2)} MiB`);
    }
    this.setSelection(this.selectedStep, this.selectedQubit);
  }

  private setNoteText(selector: string, text: string): void {
    const element = this.root?.querySelector(selector);
    if (element) element.textContent = text;
  }
}

function isPresetIdentifier(value: string): value is QuantumCircuitPresetIdentifier {
  return PRESET_IDENTIFIERS.includes(value as QuantumCircuitPresetIdentifier);
}

function getGateTitle(gate: QuantumGate): string {
  return gate.control === undefined
    ? `${gate.label} on q${gate.target}`
    : `${gate.label}: q${gate.control} controls q${gate.target}`;
}

function getInterfaceMarkup(): string {
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
      ${PRESET_IDENTIFIERS.map(identifier => `<button data-preset="${identifier}">${identifier === 'qft' ? 'QFT' : identifier[0]!.toUpperCase() + identifier.slice(1)}</button>`).join('')}
    </nav>
    <section class="quantum-copy explore-only">
      <p class="eyebrow">Active circuit</p><h2 data-circuit-name></h2><p data-circuit-description></p>
    </section>
    <section class="visual-label landscape-label explore-only"><span>Probability landscape</span><small>height = probability · hue = complex phase</small></section>
    <section class="visual-label bloch-label explore-only"><span>Reduced qubit</span><small>Bloch vector · radius = purity</small></section>
    <section class="visual-label correlation-label explore-only"><span>Connected correlations</span><small>⟨Zi Zj⟩ − ⟨Zi⟩⟨Zj⟩</small></section>
    <section class="visual-label history-label explore-only"><span>Interference history</span><small>basis state → · circuit step ↑</small></section>
    <section class="quantum-controls explore-only">
      <div class="scrubber"><button data-play>Pause</button><input data-step type="range" min="0" value="0" aria-label="Circuit step"><output data-step-value>0 / 0</output></div>
      <div class="editor" data-gates><span>Add on</span><select data-target-qubit aria-label="Target qubit"></select>${['H', 'X', 'Y', 'Z', 'P', 'Rx', 'CX'].map(gate => `<button data-add-gate="${gate}">${gate}</button>`).join('')}<button data-undo>Undo</button></div>
      <label class="observe">Observe <select data-observed-qubit aria-label="Observed qubit"></select></label>
    </section>
    <div class="quantum-circuit-scroll explore-only"><div class="quantum-circuit" data-circuit-track></div></div>
    <footer><span data-status></span><span>State remains on GPU from gate application through rendering</span></footer>`;
}
