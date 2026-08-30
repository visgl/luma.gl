// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {CanvasContext, Device} from '@luma.gl/core';
import {AnimationLoopTemplate, type AnimationProps} from '@luma.gl/engine';
import {LLMNetworkRenderer} from './llm-network-renderer';
import './llm-network-styles.css';

export const title = 'Inside a Transformer';
export const description =
  'An interactive, GPU-rendered tour from prompt tokens through attention and next-token prediction.';

const STAGES = [
  {
    name: 'Tokenize',
    kicker: 'Words become indices',
    copy: 'The prompt is split into tokens. Select one to follow its path through the network.',
    formula: 'text → [ t₀, t₁, …, tₙ ]'
  },
  {
    name: 'Embed',
    kicker: 'Indices become directions',
    copy: 'Each token looks up a learned vector, then receives a positional signal so order matters.',
    formula: 'xᵢ = E[tᵢ] + Pᵢ'
  },
  {
    name: 'Attend',
    kicker: 'Tokens exchange context',
    copy: 'Independent heads compare queries with keys, then mix the most relevant value vectors.',
    formula: 'Attention(Q,K,V) = softmax(QKᵀ/√d) V'
  },
  {
    name: 'Transform',
    kicker: 'Features are refined',
    copy: 'A feed-forward network expands and contracts every token vector. Residual paths preserve context.',
    formula: 'h′ = h + W₂ · GELU(W₁h)'
  },
  {
    name: 'Predict',
    kicker: 'Scores become a choice',
    copy: 'The final vector is projected across the vocabulary. Softmax turns logits into probabilities.',
    formula: 'p(next token) = softmax(Wᵤh)'
  },
  {
    name: 'Measure loss',
    kicker: 'Prediction meets the answer',
    copy: 'Training compares the predicted distribution with the actual next token. Surprise becomes a scalar loss.',
    formula: 'L = −log p(target)'
  },
  {
    name: 'Output error',
    kicker: 'Start where the mistake appears',
    copy: 'With softmax and cross-entropy, the output derivative simplifies beautifully: predicted probability minus the target vector.',
    formula: '∂L/∂z = p − one_hot(target)'
  },
  {
    name: 'MLP backward',
    kicker: 'Reverse the feature transformation',
    copy: 'The upstream gradient passes through the output projection, GELU, and input projection. Forward activations determine every local derivative.',
    formula: '∂L/∂W = inputᵀ · upstream_gradient'
  },
  {
    name: 'Attention backward',
    kicker: 'One gradient becomes three',
    copy: 'The signal splits through values and attention scores, then branches again into queries and keys. Masked future-token paths stay zero.',
    formula: 'dQ = dS · K / √d  dK = dSᵀ · Q / √d'
  },
  {
    name: 'Update & repeat',
    kicker: 'Learning changes the weights',
    copy: 'An optimizer scales and combines gradients into a small parameter update. New batches repeat this cycle many times.',
    formula: 'W ← W − η · ∂L/∂W'
  }
] as const;

const PROMPTS = [
  {
    label: 'Language',
    tokens: ['Large', 'language', 'models', 'learn', 'to', '…'],
    candidates: ['predict', 'generate', 'represent', 'reason', 'adapt']
  },
  {
    label: 'Geometry',
    tokens: ['The', 'geometry', 'of', 'meaning', 'is', '…'],
    candidates: ['learned', 'curved', 'contextual', 'hidden', 'vast']
  },
  {
    label: 'WebGPU',
    tokens: ['On', 'the', 'GPU', 'each', 'signal', '…'],
    candidates: ['flows', 'multiplies', 'glows', 'branches', 'converges']
  }
] as const;

type ConceptTooltip = {
  label: string;
  copy: string;
  left: number;
  top: number;
  stages: string;
  align?: 'left';
};

const CONCEPT_TOOLTIPS: readonly ConceptTooltip[] = [
  {
    label: 'Token ID',
    copy: 'A token is stored as an integer index into the model vocabulary.',
    left: 31,
    top: 26,
    stages: '0,1'
  },
  {
    label: 'Tokenizer',
    copy: 'A tokenizer segments text into reusable subword pieces before the neural network sees it.',
    left: 28,
    top: 48,
    stages: '0'
  },
  {
    label: 'Embedding lookup',
    copy: 'The token ID selects one learned row from the embedding matrix.',
    left: 41,
    top: 39,
    stages: '1'
  },
  {
    label: 'Position',
    copy: 'A positional vector is added so identical tokens at different locations can behave differently.',
    left: 43,
    top: 63,
    stages: '1'
  },
  {
    label: 'Query',
    copy: 'The query describes what the current token is looking for in its context.',
    left: 51,
    top: 35,
    stages: '2'
  },
  {
    label: 'Key',
    copy: 'Keys describe what each earlier token offers for matching.',
    left: 54,
    top: 47,
    stages: '2'
  },
  {
    label: 'Value',
    copy: 'Values carry the information blended after attention scores are normalized.',
    left: 58,
    top: 66,
    stages: '2'
  },
  {
    label: 'Causal mask',
    copy: 'The upper triangle is masked so a token cannot inspect words that come after it.',
    left: 57,
    top: 55,
    stages: '2'
  },
  {
    label: 'Attention head',
    copy: 'Each head learns a different pattern of relationships, such as syntax, reference, or position.',
    left: 55,
    top: 29,
    stages: '2'
  },
  {
    label: 'Residual stream',
    copy: 'A skip connection carries the existing representation around each learned transformation.',
    left: 64,
    top: 39,
    stages: '3'
  },
  {
    label: 'MLP expansion',
    copy: 'The feed-forward block temporarily expands the vector so many features can be tested in parallel.',
    left: 69,
    top: 50,
    stages: '3'
  },
  {
    label: 'GELU',
    copy: 'This smooth activation gates features without the sharp corner of a ReLU.',
    left: 73,
    top: 65,
    stages: '3'
  },
  {
    label: 'Logit',
    copy: 'A logit is an unnormalized score for one possible next token.',
    left: 82,
    top: 36,
    stages: '4'
  },
  {
    label: 'Softmax',
    copy: 'Softmax exponentiates and normalizes logits into a probability distribution.',
    left: 88,
    top: 50,
    stages: '4'
  },
  {
    label: 'Sampling',
    copy: 'Generation chooses from the distribution; temperature controls how peaked that choice is.',
    left: 94,
    top: 28,
    stages: '4',
    align: 'left'
  },
  {
    label: 'Cross-entropy',
    copy: 'For the correct token, the loss is the negative logarithm of the predicted probability.',
    left: 91,
    top: 54,
    stages: '5,6'
  },
  {
    label: 'Output derivative',
    copy: 'Softmax and cross-entropy combine to give p − y, avoiding a large explicit Jacobian.',
    left: 87,
    top: 37,
    stages: '6'
  },
  {
    label: 'Loss surface',
    copy: 'Every point represents a possible setting of two projected parameter directions; height is loss.',
    left: 59,
    top: 35,
    stages: '5,6,7,8,9'
  },
  {
    label: 'Saved activation',
    copy: 'Backprop reuses values recorded during the forward pass to evaluate local derivatives.',
    left: 72,
    top: 48,
    stages: '7'
  },
  {
    label: 'GELU derivative',
    copy: 'The activation derivative gates how much gradient reaches each hidden feature.',
    left: 69,
    top: 62,
    stages: '7'
  },
  {
    label: 'Gradient branch',
    copy: 'Attention sends gradient through both the mixed values and the weights that performed the mixing.',
    left: 58,
    top: 39,
    stages: '8'
  },
  {
    label: 'Masked gradient',
    copy: 'Causal masking blocks forward attention and therefore blocks the corresponding backward path too.',
    left: 54,
    top: 58,
    stages: '8'
  },
  {
    label: 'Parameter vector',
    copy: 'Training moves billions of parameters at once. This surface shows a two-dimensional slice.',
    left: 66,
    top: 58,
    stages: '5,9'
  },
  {
    label: 'Gradient step',
    copy: 'The local slope points uphill, so gradient descent takes a step in the opposite direction.',
    left: 54,
    top: 47,
    stages: '9'
  },
  {
    label: 'Chain rule',
    copy: 'Backpropagation multiplies local derivatives to carry sensitivity through composed operations.',
    left: 57,
    top: 47,
    stages: '6,7,8'
  },
  {
    label: 'Weight gradient',
    copy: 'This derivative estimates how a tiny change to one weight would change the loss.',
    left: 67,
    top: 36,
    stages: '7,8,9'
  },
  {
    label: 'Learning rate',
    copy: 'The learning rate scales every update: too large can overshoot, too small learns slowly.',
    left: 72,
    top: 61,
    stages: '9'
  },
  {
    label: 'Credit assignment',
    copy: 'The highlighted reverse path grows as influence is assigned to earlier operations.',
    left: 48,
    top: 61,
    stages: '6,7,8,9'
  }
];

/** Educational luma.gl showcase inspired by the visual language of mathematical explainers. */
export default class LLMNetworkAnimationLoopTemplate extends AnimationLoopTemplate {
  static info = '';

  private readonly renderer: LLMNetworkRenderer;
  private root: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private stage = 2;
  private selectedToken = 5;
  private layer = 6;
  private flowSpeed = 1;
  private prompt = 0;
  private playing = true;
  private previousAdvanceTime = 0;
  private pointer: [number, number] = [0.5, 0.5];
  private pointerActive = false;
  private orbitYaw = 0.78;
  private orbitPitch = 0.65;
  private orbitZoom = 1;
  private orbitDragging = false;
  private previousPointerPosition: [number, number] = [0, 0];
  private scrollingStory = false;

  constructor({device}: AnimationProps) {
    super();
    if (device.type !== 'webgpu') throw new Error('Inside a Transformer requires WebGPU.');
    this.renderer = new LLMNetworkRenderer(device as Device);
  }

  override async onInitialize({canvas}: AnimationProps): Promise<void> {
    if (!(canvas instanceof HTMLCanvasElement)) return;
    this.canvas = canvas;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute(
      'aria-label',
      'Animated transformer network connecting prompt tokens, embeddings, attention heads, hidden layers, and next-token probabilities'
    );
    this.root = document.createElement('section');
    this.root.className = 'llm-network-interface';
    this.root.innerHTML = getInterfaceMarkup();
    (canvas.parentElement ?? document.body).appendChild(this.root);
    this.previousAdvanceTime = performance.now();
    this.installEvents();
    this.refreshInterface();
  }

  override onRender({canvasContext, time}: AnimationProps): void {
    if (this.playing && time - this.previousAdvanceTime > 2800) {
      this.previousAdvanceTime = time;
      this.stage = (this.stage + 1) % STAGES.length;
      this.refreshInterface();
      this.scrollToStage();
    }
    this.renderer.render(canvasContext as CanvasContext, time, {
      stage: this.stage,
      selectedToken: this.selectedToken,
      layer: this.layer,
      flowSpeed: this.flowSpeed,
      prompt: this.prompt,
      pointer: this.pointer,
      pointerActive: this.pointerActive,
      orbit: [this.orbitYaw, this.orbitPitch],
      orbitZoom: this.orbitZoom,
      orbitDragging: this.orbitDragging
    });
  }

  override onFinalize(): void {
    this.root?.remove();
    this.root = null;
    this.renderer.destroy();
  }

  private installEvents(): void {
    this.root?.querySelector('[data-stages]')?.addEventListener('click', event => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-stage]');
      if (button) this.setStage(Number(button.dataset.stage), true);
    });
    this.root?.querySelector('[data-token-list]')?.addEventListener('click', event => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-token]');
      if (button) {
        this.selectedToken = Number(button.dataset.token);
        this.refreshInterface();
      }
    });
    this.root?.querySelector('[data-prompts]')?.addEventListener('click', event => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-prompt]');
      if (button) {
        this.prompt = Number(button.dataset.prompt);
        this.selectedToken = 5;
        this.refreshInterface();
      }
    });
    this.root?.querySelector('[data-play]')?.addEventListener('click', () => {
      this.playing = !this.playing;
      this.refreshInterface();
    });
    this.root
      ?.querySelector<HTMLInputElement>('[data-stage-range]')
      ?.addEventListener('input', event => {
        this.setStage(Number((event.currentTarget as HTMLInputElement).value), true);
      });
    this.root?.querySelector<HTMLInputElement>('[data-layer]')?.addEventListener('input', event => {
      this.layer = Number((event.currentTarget as HTMLInputElement).value);
      this.refreshInterface();
    });
    this.root?.querySelector<HTMLInputElement>('[data-speed]')?.addEventListener('input', event => {
      this.flowSpeed = Number((event.currentTarget as HTMLInputElement).value);
    });
    this.canvas?.addEventListener('pointermove', event => {
      const bounds = this.canvas?.getBoundingClientRect();
      if (!bounds) return;
      this.pointer = [
        (event.clientX - bounds.left) / bounds.width,
        1 - (event.clientY - bounds.top) / bounds.height
      ];
      this.pointerActive = true;
      if (this.orbitDragging) {
        this.orbitYaw += (event.clientX - this.previousPointerPosition[0]) * 0.008;
        this.orbitPitch = Math.max(
          0.15,
          Math.min(
            1.25,
            this.orbitPitch + (event.clientY - this.previousPointerPosition[1]) * 0.006
          )
        );
        this.previousPointerPosition = [event.clientX, event.clientY];
      }
    });
    this.canvas?.addEventListener('pointerleave', () => {
      this.pointerActive = false;
    });
    this.canvas?.addEventListener('pointerdown', event => {
      if (this.stage < 5) return;
      this.orbitDragging = true;
      this.previousPointerPosition = [event.clientX, event.clientY];
      this.canvas?.setPointerCapture(event.pointerId);
      this.root?.classList.add('orbit-dragging');
    });
    this.canvas?.addEventListener('pointerup', event => {
      this.orbitDragging = false;
      if (this.canvas?.hasPointerCapture(event.pointerId))
        this.canvas.releasePointerCapture(event.pointerId);
      this.root?.classList.remove('orbit-dragging');
    });
    this.canvas?.addEventListener(
      'wheel',
      event => {
        if (this.stage < 5) return;
        event.preventDefault();
        this.orbitZoom = Math.max(
          0.68,
          Math.min(1.45, this.orbitZoom * Math.exp(-event.deltaY * 0.001))
        );
      },
      {passive: false}
    );
    this.root?.querySelector('[data-story]')?.addEventListener('scroll', event => {
      if (this.scrollingStory) return;
      const story = event.currentTarget as HTMLElement;
      const storyCenter = story.scrollTop + story.clientHeight * 0.5;
      let closestStage = this.stage;
      let closestDistance = Number.POSITIVE_INFINITY;
      story.querySelectorAll<HTMLElement>('[data-story-stage]').forEach((chapter, index) => {
        const chapterCenter = chapter.offsetTop + chapter.offsetHeight * 0.5;
        const distance = Math.abs(chapterCenter - storyCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestStage = index;
        }
      });
      if (closestStage !== this.stage) {
        this.stage = closestStage;
        this.playing = false;
        this.refreshInterface();
      }
    });
  }

  private setStage(stage: number, scrollStory = false): void {
    this.stage = Math.max(0, Math.min(STAGES.length - 1, Math.round(stage)));
    this.playing = false;
    this.refreshInterface();
    if (scrollStory) this.scrollToStage();
  }

  private scrollToStage(): void {
    const story = this.root?.querySelector<HTMLElement>('[data-story]');
    const chapter = story?.querySelector<HTMLElement>(`[data-story-stage="${this.stage}"]`);
    if (!story || !chapter) return;
    this.scrollingStory = true;
    story.style.scrollBehavior = 'auto';
    story.scrollTop = chapter.offsetTop - story.clientHeight * 0.5 + chapter.offsetHeight * 0.5;
    window.requestAnimationFrame(() => {
      story.style.scrollBehavior = '';
      this.scrollingStory = false;
    });
  }

  private refreshInterface(): void {
    if (!this.root) return;
    const prompt = PROMPTS[this.prompt];
    this.root.dataset.stage = String(this.stage);
    this.canvas?.classList.toggle('llm-orbit-enabled', this.stage >= 5);
    this.root.querySelectorAll<HTMLButtonElement>('[data-stage]').forEach((button, index) => {
      const selected = index === this.stage;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-current', selected ? 'step' : 'false');
    });
    this.root.querySelectorAll<HTMLElement>('[data-story-stage]').forEach((chapter, index) => {
      chapter.classList.toggle('active', index === this.stage);
    });
    this.root.querySelectorAll<HTMLElement>('[data-tooltip-stages]').forEach(hotspot => {
      const stages = hotspot.dataset.tooltipStages?.split(',').map(Number) ?? [];
      const active = stages.includes(this.stage);
      hotspot.classList.toggle('active', active);
      hotspot.tabIndex = active ? 0 : -1;
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-prompt]').forEach((button, index) => {
      button.classList.toggle('active', index === this.prompt);
    });
    const stageRange = this.root.querySelector<HTMLInputElement>('[data-stage-range]');
    if (stageRange) stageRange.value = String(this.stage);
    const playButton = this.root.querySelector<HTMLButtonElement>('[data-play]');
    if (playButton) playButton.textContent = this.playing ? 'Pause tour' : 'Play tour';
    const layerOutput = this.root.querySelector<HTMLOutputElement>('[data-layer-output]');
    if (layerOutput) layerOutput.textContent = `${this.layer} / 12`;
    const tokenList = this.root.querySelector('[data-token-list]');
    if (tokenList) {
      tokenList.innerHTML = prompt.tokens
        .map(
          (token, index) =>
            `<button data-token="${index}" class="${index === this.selectedToken ? 'active' : ''}" aria-label="Follow token ${token}"><span>${token}</span><small>${index}</small></button>`
        )
        .join('');
    }
    const candidateList = this.root.querySelector('[data-candidates]');
    if (candidateList) {
      candidateList.innerHTML = prompt.candidates
        .map(
          (candidate, index) =>
            `<li class="${index === 0 ? 'chosen' : ''}"><span>${candidate}</span><small>${[42, 24, 15, 11, 8][index]}%</small></li>`
        )
        .join('');
    }
  }
}

function getInterfaceMarkup(): string {
  return `
    <header class="llm-header">
      <div><p class="llm-eyebrow">luma.gl · visual transformer tour</p><h1>Inside a Transformer</h1></div>
      <nav data-prompts aria-label="Example prompts">
        ${PROMPTS.map((prompt, index) => `<button data-prompt="${index}">${prompt.label}</button>`).join('')}
      </nav>
    </header>
    <ol class="llm-stage-rail" data-stages aria-label="Transformer stages">
      ${STAGES.map((stage, index) => `<li><button data-stage="${index}" title="${stage.name}"><small>${String(index + 1).padStart(2, '0')}</small><span>${stage.name}</span></button></li>`).join('')}
    </ol>
    <section class="llm-token-stack" aria-label="Prompt tokens">
      <p>Prompt tokens</p><div data-token-list></div>
    </section>
    <section class="llm-output-stack" aria-label="Next token probabilities">
      <p>Next token</p><ol data-candidates></ol>
    </section>
    <p class="llm-orbit-hint">Drag to orbit · scroll to zoom</p>
    <div class="llm-hotspots" aria-label="Concept explanations">
      ${CONCEPT_TOOLTIPS.map((tooltip, index) => `<button data-tooltip-stages="${tooltip.stages}" ${tooltip.align ? `data-align="${tooltip.align}"` : ''} style="--hotspot-left:${tooltip.left}%;--hotspot-top:${tooltip.top}%" aria-describedby="llm-tooltip-${index}"><span aria-hidden="true">i</span><span class="llm-tooltip-card" id="llm-tooltip-${index}" role="tooltip"><strong>${tooltip.label}</strong>${tooltip.copy}</span></button>`).join('')}
    </div>
    <section class="llm-story" data-story aria-label="Transformer story">
      ${STAGES.map((stage, index) => `<article data-story-stage="${index}"><p><span>${String(index + 1).padStart(2, '0')}</span> ${stage.kicker}</p><h2>${stage.name}</h2><p>${stage.copy}</p><code>${stage.formula}</code><small>Scroll to continue ↓</small></article>`).join('')}
    </section>
    <section class="llm-controls" aria-label="Visualization controls">
      <button data-play>Pause tour</button>
      <label class="stage-scrubber"><span>Pipeline</span><input data-stage-range type="range" min="0" max="9" step="1" value="2" aria-label="Transformer stage"></label>
      <label><span>Layer depth</span><input data-layer type="range" min="1" max="12" step="1" value="6"><output data-layer-output>6 / 12</output></label>
      <label><span>Signal speed</span><input data-speed type="range" min="0.2" max="2.5" step="0.1" value="1"></label>
    </section>
    <footer><span>Illustrative transformer anatomy · not a model trace</span><span>GPU-rendered with one luma.gl model</span></footer>`;
}
