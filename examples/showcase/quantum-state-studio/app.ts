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
import {
  getQuantumExplanation,
  getQuantumGateExplanation,
  type QuantumExplanation
} from './quantum-explanations';
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
  private tooltip: HTMLElement | null = null;
  private explainedTarget: HTMLElement | null = null;
  private tooltipHideTimer: ReturnType<typeof setTimeout> | undefined;
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
    this.tooltip = this.root.querySelector('[data-tooltip]');
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
    clearTimeout(this.tooltipHideTimer);
    this.root?.remove();
    this.root = null;
    this.renderer.destroy();
    this.engine.destroy();
  }

  private installEvents(): void {
    this.root?.addEventListener('pointerover', event => {
      const target = (event.target as HTMLElement).closest<HTMLElement>('[data-explain]');
      if (target) this.showExplanation(target, event);
    });
    this.root?.addEventListener('pointerdown', event => {
      if (event.pointerType !== 'touch') return;
      const target = (event.target as HTMLElement).closest<HTMLElement>('[data-explain]');
      if (!target) return;
      this.showExplanation(target, event);
      clearTimeout(this.tooltipHideTimer);
      this.tooltipHideTimer = setTimeout(() => this.hideExplanation(), 4200);
    });
    this.root?.addEventListener('pointermove', event => {
      if (this.explainedTarget && event.pointerType !== 'touch') {
        this.showExplanation(this.explainedTarget, event);
      }
    });
    this.root?.addEventListener('pointerout', event => {
      if (event.pointerType === 'touch') return;
      const target = (event.target as HTMLElement).closest<HTMLElement>('[data-explain]');
      const relatedTarget = event.relatedTarget as Node | null;
      if (target && (!relatedTarget || !target.contains(relatedTarget))) this.hideExplanation();
    });
    this.root?.addEventListener('focusin', event => {
      const target = (event.target as HTMLElement).closest<HTMLElement>('[data-explain]');
      if (target) this.showExplanation(target);
    });
    this.root?.addEventListener('focusout', event => {
      const target = (event.target as HTMLElement).closest<HTMLElement>('[data-explain]');
      const relatedTarget = event.relatedTarget as Node | null;
      if (target && (!relatedTarget || !target.contains(relatedTarget))) this.hideExplanation();
    });
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
        '<button class="quantum-gate active initial" data-gate-step="0" data-explain="gate">|0⟩</button>',
        ...this.circuit.gates.map(
          (gate, index) =>
            `<button class="quantum-gate" data-gate-step="${index + 1}" data-explain="gate" aria-label="${getGateTitle(gate)}"><span>${gate.label}</span><small>${gate.control === undefined ? '' : `q${gate.control}→`}q${gate.target}</small></button>`
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

  private showExplanation(target: HTMLElement, pointerEvent?: PointerEvent): void {
    if (!this.tooltip) return;
    const explanation = this.getContextualExplanation(target, pointerEvent);
    if (!explanation) return;
    this.explainedTarget?.removeAttribute('aria-describedby');
    this.explainedTarget = target;
    target.setAttribute('aria-describedby', 'quantum-context-tooltip');
    this.setTooltipText('[data-tooltip-eyebrow]', explanation.eyebrow);
    this.setTooltipText('[data-tooltip-title]', explanation.title);
    this.setTooltipText('[data-tooltip-body]', explanation.body);
    this.setTooltipText('[data-tooltip-detail]', explanation.detail ?? '');
    const detail = this.tooltip.querySelector<HTMLElement>('[data-tooltip-detail]');
    if (detail) detail.hidden = !explanation.detail;
    this.tooltip.hidden = false;
    this.positionTooltip(target, pointerEvent);
  }

  private hideExplanation(): void {
    clearTimeout(this.tooltipHideTimer);
    if (this.tooltip) this.tooltip.hidden = true;
    this.explainedTarget?.removeAttribute('aria-describedby');
    this.explainedTarget = null;
  }

  private setTooltipText(selector: string, value: string): void {
    const element = this.tooltip?.querySelector(selector);
    if (element) element.textContent = value;
  }

  private getContextualExplanation(
    target: HTMLElement,
    pointerEvent?: PointerEvent
  ): (QuantumExplanation & {detail?: string}) | undefined {
    const identifier = target.dataset.explain;
    if (!identifier) return undefined;
    if (identifier === 'gate') {
      const step = Number(target.dataset.gateStep ?? 0);
      if (step === 0) {
        return {
          eyebrow: 'Initial state · slice 0',
          title: '|0…0⟩ initialization',
          body: 'Every qubit begins in |0⟩, so basis state zero has amplitude 1 + 0i and every other amplitude is zero. This is the only full-state CPU upload.'
        };
      }
      const gate = this.circuit.gates[step - 1];
      return gate ? getQuantumGateExplanation(gate, step) : undefined;
    }
    const explanation = getQuantumExplanation(identifier);
    if (!explanation) return undefined;
    const detail = this.getPointerDetail(identifier, target, pointerEvent);
    return {...explanation, detail};
  }

  private getPointerDetail(
    identifier: string,
    target: HTMLElement,
    pointerEvent?: PointerEvent
  ): string | undefined {
    if (identifier === 'bloch-sphere') {
      return `Currently reducing q${this.selectedQubit} at snapshot ${this.selectedStep}.`;
    }
    if (identifier === 'scrubber' || identifier === 'circuit-track') {
      return `Selected snapshot ${this.selectedStep} of ${this.circuit.gates.length}.`;
    }
    if (!pointerEvent) return undefined;
    const bounds = target.getBoundingClientRect();
    const horizontal = Math.max(
      0,
      Math.min(0.999999, (pointerEvent.clientX - bounds.left) / bounds.width)
    );
    const vertical = Math.max(
      0,
      Math.min(0.999999, (pointerEvent.clientY - bounds.top) / bounds.height)
    );
    if (identifier === 'probability-landscape' || identifier === 'interference-history') {
      const basisIndex = Math.floor(horizontal * this.engine.stateCount);
      const ket = basisIndex.toString(2).padStart(this.circuit.qubitCount, '0');
      if (identifier === 'interference-history') {
        const step = Math.min(
          this.circuit.gates.length,
          Math.floor((1 - vertical) * this.engine.snapshotCount)
        );
        return `Pointer: |${ket}⟩ (basis ${basisIndex}), near snapshot ${step}.`;
      }
      return `Pointer: |${ket}⟩ (basis index ${basisIndex}) at snapshot ${this.selectedStep}.`;
    }
    if (identifier === 'correlations') {
      const column = Math.min(
        this.circuit.qubitCount - 1,
        Math.floor(horizontal * this.circuit.qubitCount)
      );
      const row = Math.min(
        this.circuit.qubitCount - 1,
        Math.floor(vertical * this.circuit.qubitCount)
      );
      return `Pointer: correlation cell q${row} × q${column} at snapshot ${this.selectedStep}.`;
    }
    return undefined;
  }

  private positionTooltip(target: HTMLElement, pointerEvent?: PointerEvent): void {
    if (!this.tooltip) return;
    const targetBounds = target.getBoundingClientRect();
    const tooltipBounds = this.tooltip.getBoundingClientRect();
    const padding = 12;
    let left = pointerEvent ? pointerEvent.clientX + 18 : targetBounds.right + 14;
    let top = pointerEvent ? pointerEvent.clientY + 18 : targetBounds.top;
    if (left + tooltipBounds.width > window.innerWidth - padding) {
      left = (pointerEvent ? pointerEvent.clientX : targetBounds.left) - tooltipBounds.width - 18;
    }
    if (top + tooltipBounds.height > window.innerHeight - padding) {
      top = window.innerHeight - tooltipBounds.height - padding;
    }
    this.tooltip.style.left = `${Math.max(padding, left)}px`;
    this.tooltip.style.top = `${Math.max(padding, top)}px`;
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
      ${PRESET_IDENTIFIERS.map(identifier => `<button data-preset="${identifier}" data-explain="preset-${identifier}">${identifier === 'qft' ? 'QFT' : identifier[0]!.toUpperCase() + identifier.slice(1)}</button>`).join('')}
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
