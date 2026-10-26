// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Configuration for an accessible, independently styled canvas comparison divider. */
export type ComparisonSplitterProps = {
  /** Canvas whose client rectangle determines the divider's visible bounds. */
  canvas: HTMLCanvasElement;
  /** Optional stable identifier for application styling, automation, or accessibility. */
  id?: string;
  /** Initial horizontal divider position, expressed between zero and one. */
  value: number;
  /** Called immediately while a pointer or keyboard interaction moves the divider. */
  onChange: (value: number) => void;
  /** Called once when a pointer interaction ends or a keyboard move is applied. */
  onCommit?: (value: number) => void;
  /** Accessible description announced for the focusable separator. */
  label?: string;
  /** CSS color applied independently to this divider's line, handle, and glow. */
  accentColor?: string;
  /** CSS background color applied independently to this divider's handle. */
  handleColor?: string;
  /** Optional positioned host; defaults to a fixed overlay in the canvas document body. */
  container?: HTMLElement;
};

const DEFAULT_ACCENT_COLOR = '#33ebff';
const DEFAULT_HANDLE_COLOR = 'rgb(8 47 73 / 92%)';

/** Accessible, self-contained DOM divider for comparing two views of one canvas. */
export class ComparisonSplitter {
  /** Focusable DOM separator. Its children and inline styles are owned by this instance. */
  readonly element: HTMLDivElement;

  private readonly canvas: HTMLCanvasElement;
  private readonly container: HTMLElement | undefined;
  private readonly onChange: (value: number) => void;
  private readonly onCommit: ((value: number) => void) | undefined;
  private readonly dividerLine: HTMLSpanElement;
  private readonly accentColor: string;
  private value: number;
  private visible = true;
  private activePointerId: number | null = null;
  private destroyed = false;

  constructor({
    canvas,
    id,
    value,
    onChange,
    onCommit,
    label = 'Before and after comparison',
    accentColor = DEFAULT_ACCENT_COLOR,
    handleColor = DEFAULT_HANDLE_COLOR,
    container
  }: ComparisonSplitterProps) {
    this.canvas = canvas;
    this.container = container;
    this.value = clampSplit(value);
    this.onChange = onChange;
    this.onCommit = onCommit;
    this.accentColor = accentColor;

    const ownerDocument = canvas.ownerDocument || document;
    this.element = ownerDocument.createElement('div');
    if (id) {
      this.element.id = id;
    }
    this.element.tabIndex = 0;
    this.element.dataset['lumaComparisonSplitter'] = 'true';
    this.element.setAttribute('role', 'separator');
    this.element.setAttribute('aria-label', label);
    this.element.setAttribute('aria-orientation', 'vertical');
    this.element.setAttribute('aria-valuemin', '0');
    this.element.setAttribute('aria-valuemax', '1');
    Object.assign(this.element.style, {
      position: container ? 'absolute' : 'fixed',
      width: '32px',
      transform: 'translateX(-50%)',
      cursor: 'col-resize',
      touchAction: 'none',
      userSelect: 'none',
      outlineOffset: '4px',
      zIndex: '10'
    });

    this.dividerLine = ownerDocument.createElement('span');
    this.dividerLine.setAttribute('aria-hidden', 'true');
    Object.assign(this.dividerLine.style, {
      position: 'absolute',
      top: '0',
      bottom: '0',
      left: '50%',
      width: '2px',
      transform: 'translateX(-50%)',
      backgroundColor: accentColor,
      boxShadow: `0 0 8px ${accentColor}`,
      pointerEvents: 'none'
    });

    const handle = ownerDocument.createElement('span');
    handle.setAttribute('aria-hidden', 'true');
    handle.textContent = '\u2194';
    Object.assign(handle.style, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      width: '20px',
      height: '44px',
      transform: 'translate(-50%, -50%)',
      border: `1px solid ${accentColor}`,
      borderRadius: '8px',
      backgroundColor: handleColor,
      color: accentColor,
      boxShadow: '0 2px 12px rgb(0 0 0 / 45%)',
      font: '16px / 42px system-ui, sans-serif',
      textAlign: 'center',
      pointerEvents: 'none'
    });

    this.element.append(this.dividerLine, handle);
    this.element.addEventListener('pointerdown', this.handlePointerDown);
    this.element.addEventListener('pointermove', this.handlePointerMove);
    this.element.addEventListener('pointerup', this.handlePointerUp);
    this.element.addEventListener('pointercancel', this.handlePointerCancel);
    this.element.addEventListener('keydown', this.handleKeyDown);
    (container || ownerDocument.body).append(this.element);
    this.updateValue(this.value, false);
  }

  /** Releases pointer capture, removes interaction handlers, and detaches this divider. */
  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;

    if (this.activePointerId !== null && this.element.hasPointerCapture(this.activePointerId)) {
      this.element.releasePointerCapture(this.activePointerId);
    }
    this.activePointerId = null;
    this.element.removeEventListener('pointerdown', this.handlePointerDown);
    this.element.removeEventListener('pointermove', this.handlePointerMove);
    this.element.removeEventListener('pointerup', this.handlePointerUp);
    this.element.removeEventListener('pointercancel', this.handlePointerCancel);
    this.element.removeEventListener('keydown', this.handleKeyDown);
    this.element.remove();
  }

  /** Updates the normalized divider position without firing interaction callbacks. */
  setValue(value: number): void {
    this.updateValue(value, false);
  }

  /** Hides or shows the divider while preserving its normalized position. */
  setVisible(visible: boolean): void {
    this.visible = visible;
    this.updateLayout();
  }

  /** Repositions the divider after the canvas or optional host moves, scrolls, or resizes. */
  updateLayout(): void {
    const canvasBounds = this.canvas.getBoundingClientRect();
    const rendered = this.visible && canvasBounds.width > 0 && canvasBounds.height > 0;
    this.element.hidden = !rendered;
    if (!rendered) {
      return;
    }

    const containerBounds = this.container?.getBoundingClientRect();
    const horizontalOffset = containerBounds
      ? containerBounds.left + this.container!.clientLeft - this.container!.scrollLeft
      : 0;
    const verticalOffset = containerBounds
      ? containerBounds.top + this.container!.clientTop - this.container!.scrollTop
      : 0;

    this.element.style.left = `${canvasBounds.left - horizontalOffset + canvasBounds.width * this.value}px`;
    this.element.style.top = `${canvasBounds.top - verticalOffset}px`;
    this.element.style.height = `${canvasBounds.height}px`;
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
    const canvasBounds = this.canvas.getBoundingClientRect();
    if (canvasBounds.width > 0) {
      this.updateValue((clientX - canvasBounds.left) / canvasBounds.width, true);
    }
  }

  private finishPointerInteraction(event: PointerEvent, updatePosition: boolean): void {
    if (event.pointerId !== this.activePointerId) {
      return;
    }

    if (updatePosition) {
      this.updateFromPointer(event.clientX);
    }
    this.activePointerId = null;
    delete this.element.dataset['dragging'];
    this.dividerLine.style.width = '2px';
    this.dividerLine.style.backgroundColor = this.accentColor;
    if (this.element.hasPointerCapture(event.pointerId)) {
      this.element.releasePointerCapture(event.pointerId);
    }
    this.onCommit?.(this.value);
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.button !== 0 || this.activePointerId !== null) {
      return;
    }

    event.preventDefault();
    this.activePointerId = event.pointerId;
    this.element.dataset['dragging'] = 'true';
    this.dividerLine.style.width = '3px';
    this.dividerLine.style.backgroundColor = '#fff';
    this.element.setPointerCapture(event.pointerId);
    this.updateFromPointer(event.clientX);
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerId === this.activePointerId) {
      this.updateFromPointer(event.clientX);
    }
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    this.finishPointerInteraction(event, true);
  };

  private readonly handlePointerCancel = (event: PointerEvent): void => {
    this.finishPointerInteraction(event, false);
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
    this.onCommit?.(this.value);
  };
}

function clampSplit(value: number): number {
  return Math.min(1, Math.max(0, value));
}
