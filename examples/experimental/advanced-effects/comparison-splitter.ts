// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

type ComparisonSplitterProps = {
  canvas: HTMLCanvasElement;
  id?: string;
  value: number;
  onChange: (value: number) => void;
  onCommit: (value: number) => void;
};

/** Accessible DOM separator used to compare the raw and processed scene. */
export class ComparisonSplitter {
  readonly element: HTMLDivElement;

  private readonly canvas: HTMLCanvasElement;
  private readonly onChange: (value: number) => void;
  private readonly onCommit: (value: number) => void;
  private value: number;
  private visible = true;
  private dragging = false;

  constructor({
    canvas,
    id = 'advanced-effects-comparison-splitter',
    value,
    onChange,
    onCommit
  }: ComparisonSplitterProps) {
    this.canvas = canvas;
    this.value = clampSplit(value);
    this.onChange = onChange;
    this.onCommit = onCommit;

    this.element = document.createElement('div');
    this.element.id = id;
    this.element.tabIndex = 0;
    this.element.setAttribute('role', 'separator');
    this.element.setAttribute('aria-label', 'Before and after comparison');
    this.element.setAttribute('aria-orientation', 'vertical');
    this.element.setAttribute('aria-valuemin', '0');
    this.element.setAttribute('aria-valuemax', '1');
    this.element.addEventListener('pointerdown', this.handlePointerDown);
    this.element.addEventListener('pointermove', this.handlePointerMove);
    this.element.addEventListener('pointerup', this.handlePointerUp);
    this.element.addEventListener('pointercancel', this.handlePointerUp);
    this.element.addEventListener('keydown', this.handleKeyDown);
    document.body.append(this.element);
    this.updateValue(this.value, false);
  }

  destroy(): void {
    this.element.removeEventListener('pointerdown', this.handlePointerDown);
    this.element.removeEventListener('pointermove', this.handlePointerMove);
    this.element.removeEventListener('pointerup', this.handlePointerUp);
    this.element.removeEventListener('pointercancel', this.handlePointerUp);
    this.element.removeEventListener('keydown', this.handleKeyDown);
    this.element.remove();
  }

  setValue(value: number): void {
    this.updateValue(value, false);
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    this.updateLayout();
  }

  updateLayout(): void {
    const bounds = this.canvas.getBoundingClientRect();
    const rendered = this.visible && bounds.width > 0 && bounds.height > 0;
    this.element.hidden = !rendered;
    if (!rendered) {
      return;
    }
    this.element.style.left = `${bounds.left + bounds.width * this.value}px`;
    this.element.style.top = `${bounds.top}px`;
    this.element.style.height = `${bounds.height}px`;
  }

  private updateValue(value: number, notify: boolean): void {
    this.value = clampSplit(value);
    this.element.setAttribute('aria-valuenow', this.value.toFixed(2));
    this.element.setAttribute('aria-valuetext', `${Math.round(this.value * 100)}% before`);
    this.updateLayout();
    if (notify) {
      this.onChange(this.value);
    }
  }

  private updateFromPointer(clientX: number): void {
    const bounds = this.canvas.getBoundingClientRect();
    if (bounds.width > 0) {
      this.updateValue((clientX - bounds.left) / bounds.width, true);
    }
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    this.dragging = true;
    this.element.dataset.dragging = 'true';
    this.element.setPointerCapture(event.pointerId);
    this.updateFromPointer(event.clientX);
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (this.dragging) {
      this.updateFromPointer(event.clientX);
    }
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (!this.dragging) {
      return;
    }
    this.updateFromPointer(event.clientX);
    this.dragging = false;
    delete this.element.dataset.dragging;
    if (this.element.hasPointerCapture(event.pointerId)) {
      this.element.releasePointerCapture(event.pointerId);
    }
    this.onCommit(this.value);
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const step = event.shiftKey ? 0.05 : 0.01;
    let nextValue = this.value;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      nextValue -= step;
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      nextValue += step;
    } else if (event.key === 'Home') {
      nextValue = 0;
    } else if (event.key === 'End') {
      nextValue = 1;
    } else {
      return;
    }
    event.preventDefault();
    this.updateValue(nextValue, true);
    this.onCommit(this.value);
  };
}

function clampSplit(value: number): number {
  return Math.min(1, Math.max(0, value));
}
