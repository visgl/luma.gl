// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

const INSTANCE_SELECTOR_ID = 'arrow-instancing-instance-count';

export type ArrowInstancingControlPanelState = {
  instancesPerSide: number;
};

export type ArrowInstancingControlPanelHandlers = {
  onInstanceCountChange: (instancesPerSide: number) => void;
};

export type ArrowInstancingControlPanelOptions = {
  instanceCountOptions: readonly number[];
  initialState: ArrowInstancingControlPanelState;
  handlers: ArrowInstancingControlPanelHandlers;
};

export class ArrowInstancingControlPanel {
  private readonly instanceCountOptions: readonly number[];
  private readonly handlers: ArrowInstancingControlPanelHandlers;
  private state: ArrowInstancingControlPanelState;
  private selector: HTMLSelectElement | null = null;

  constructor({instanceCountOptions, initialState, handlers}: ArrowInstancingControlPanelOptions) {
    this.instanceCountOptions = instanceCountOptions;
    this.state = initialState;
    this.handlers = handlers;
  }

  initialize(): void {
    if (this.selector) {
      return;
    }

    this.selector = document.getElementById(INSTANCE_SELECTOR_ID) as HTMLSelectElement | null;
    if (!this.selector) {
      return;
    }

    this.selector.replaceChildren();
    for (const instancesPerSide of this.instanceCountOptions) {
      const option = document.createElement('option');
      option.value = String(instancesPerSide);
      option.text = `${instancesPerSide} x ${instancesPerSide} (${(instancesPerSide * instancesPerSide).toLocaleString()} cubes)`;
      this.selector.appendChild(option);
    }

    this.syncControls(this.state);
    this.selector.addEventListener('change', this.handleInstanceCountSelection);
  }

  destroy(): void {
    this.selector?.removeEventListener('change', this.handleInstanceCountSelection);
    this.selector = null;
  }

  syncControls(state: Partial<ArrowInstancingControlPanelState>): void {
    this.state = {...this.state, ...state};
    if (this.selector) {
      this.selector.value = String(this.state.instancesPerSide);
    }
  }

  private readonly handleInstanceCountSelection = (): void => {
    const instancesPerSide = Number(this.selector?.value);
    if (this.instanceCountOptions.includes(instancesPerSide)) {
      this.handlers.onInstanceCountChange(instancesPerSide);
    }
  };
}

export function makeArrowInstancingControlPanelHtml(): string {
  return `\
  <p>
  A luma.gl <code>Cube</code>, rendering up to 4,194,304 instances from Arrow
  <code>FixedSizeList</code> columns in a single GPU draw call.
  The shader declares <code>vec2&lt;f32&gt;</code> positions and
  <code>vec4&lt;f32&gt;</code> colors, while Arrow column types derive
  <code>float32x2</code> and <code>unorm8x4</code> buffer layouts.
  </p>
  <div style="margin-top: 16px; padding: 14px 16px; border: 1px solid rgba(208, 215, 222, 0.9); border-radius: 16px; background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(246, 248, 250, 0.96) 100%); box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);">
    <label for="${INSTANCE_SELECTOR_ID}" style="display: block; margin-bottom: 8px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #57606a;">Grid Size</label>
    <div style="position: relative;">
      <select id="${INSTANCE_SELECTOR_ID}" style="display: block; width: 100%; margin: 0; padding: 10px 42px 10px 14px; border: 1px solid #c9d1d9; border-radius: 12px; background: rgba(255, 255, 255, 0.95); color: #0f172a; font-size: 15px; font-weight: 500; line-height: 1.2; appearance: none; -webkit-appearance: none; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);"></select>
      <span aria-hidden="true" style="position: absolute; right: 14px; top: 50%; width: 9px; height: 9px; border-right: 2px solid #57606a; border-bottom: 2px solid #57606a; transform: translateY(-65%) rotate(45deg); pointer-events: none;"></span>
    </div>
  </div>
  `;
}
