// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {DeviceCreationError} from '@luma.gl/core';

const positionedContainers = new WeakMap<HTMLElement, {count: number; previousPosition: string}>();

export type CanvasErrorDisplayTarget = HTMLCanvasElement | HTMLElement | string;

/** Options for the browser canvas error display used by AnimationLoop. */
export type CanvasErrorDisplayProps = {
  target?: CanvasErrorDisplayTarget;
};

/** Accessible, per-loop fatal and transient error display for browser canvases. */
export class CanvasErrorDisplay {
  private target?: CanvasErrorDisplayTarget;
  private element: HTMLDivElement | null = null;
  private messageElement: HTMLDivElement | null = null;
  private positionedContainer: HTMLElement | null = null;
  private fadeMessageTimer: ReturnType<typeof setTimeout> | null = null;
  private removeMessageTimer: ReturnType<typeof setTimeout> | null = null;
  private enabled = true;

  constructor(props: CanvasErrorDisplayProps = {}) {
    this.target = props.target;
  }

  setTarget(target: CanvasErrorDisplayTarget | null): void {
    if (target) {
      this.target = target;
    }
  }

  disable(): void {
    this.enabled = false;
    this.clear();
  }

  show(error: Error): void {
    if (!this.enabled || typeof document === 'undefined') {
      return;
    }
    this.clear();

    const target = resolveTarget(this.target);
    const canvas = target instanceof HTMLCanvasElement ? target : null;
    const container = canvas ? canvas.parentElement || document.body : target || document.body;
    if (!container) {
      return;
    }

    const element = document.createElement('div');
    element.dataset['lumaErrorDisplay'] = 'true';
    element.setAttribute('role', 'alert');
    element.setAttribute('aria-live', 'assertive');
    Object.assign(element.style, {
      position: container === document.body ? 'fixed' : 'absolute',
      inset: '0',
      zIndex: '2147483647',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'stretch',
      gap: '12px',
      boxSizing: 'border-box',
      overflow: 'auto',
      padding:
        'max(20px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left))',
      color: '#ffffff',
      background: 'rgba(86, 8, 8, 0.96)',
      font: '500 16px/1.45 system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      overflowWrap: 'anywhere',
      touchAction: 'pan-y'
    });
    if (canvas?.isConnected && container === document.body) {
      const bounds = canvas.getBoundingClientRect();
      Object.assign(element.style, {
        inset: 'auto',
        left: `${bounds.left}px`,
        top: `${bounds.top}px`,
        width: `${bounds.width}px`,
        height: `${bounds.height}px`
      });
    } else if (canvas?.isConnected) {
      const bounds = canvas.getBoundingClientRect();
      const containerBounds = container.getBoundingClientRect();
      Object.assign(element.style, {
        inset: 'auto',
        left: `${bounds.left - containerBounds.left + container.scrollLeft}px`,
        top: `${bounds.top - containerBounds.top + container.scrollTop}px`,
        width: `${bounds.width}px`,
        height: `${bounds.height}px`
      });
    }

    const title = document.createElement('strong');
    title.textContent = getErrorTitle(error);
    title.style.fontSize = 'clamp(20px, 5vw, 30px)';
    element.appendChild(title);

    const message = document.createElement('div');
    message.textContent = error.message || 'An unknown GPU error occurred.';
    element.appendChild(message);

    const technicalDetails = formatTechnicalDetails(error);
    if (technicalDetails) {
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = 'Technical details';
      summary.style.cursor = 'pointer';
      details.appendChild(summary);
      const pre = document.createElement('pre');
      pre.textContent = technicalDetails;
      Object.assign(pre.style, {
        margin: '10px 0 0',
        padding: '12px',
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
        background: 'rgba(0, 0, 0, 0.3)',
        font: '12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace'
      });
      details.appendChild(pre);
      element.appendChild(details);
    }

    if (container !== document.body && acquirePositionedContainer(container)) {
      this.positionedContainer = container;
    }
    container.appendChild(element);
    this.element = element;
  }

  /** Show a brief nonfatal error message without obscuring or stopping the canvas. */
  showMessage(error: Error): void {
    if (!this.enabled || this.element || typeof document === 'undefined') {
      return;
    }
    this.clearMessage();

    const target = resolveTarget(this.target);
    const canvas = target instanceof HTMLCanvasElement ? target : null;
    const container = canvas ? canvas.parentElement || document.body : target || document.body;
    if (!container) {
      return;
    }

    const element = document.createElement('div');
    element.dataset['lumaErrorMessage'] = 'true';
    element.setAttribute('role', 'status');
    element.setAttribute('aria-live', 'polite');
    element.textContent = error.message || 'An unknown graphics error occurred.';
    Object.assign(element.style, {
      position: container === document.body ? 'fixed' : 'absolute',
      zIndex: '2147483647',
      left: '50%',
      top: 'max(12px, env(safe-area-inset-top))',
      maxWidth: 'min(calc(100% - 24px), 720px)',
      boxSizing: 'border-box',
      transform: 'translateX(-50%)',
      padding: '8px 12px',
      border: '1px solid rgba(255, 100, 100, 0.75)',
      borderRadius: '4px',
      color: '#ff8a8a',
      background: 'rgba(45, 0, 0, 0.9)',
      boxShadow: '0 2px 12px rgba(0, 0, 0, 0.45)',
      font: '600 14px/1.4 system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      overflowWrap: 'anywhere',
      pointerEvents: 'none',
      opacity: '1',
      transition: 'opacity 900ms ease-out'
    });
    if (canvas?.isConnected && container === document.body) {
      const bounds = canvas.getBoundingClientRect();
      Object.assign(element.style, {
        left: `${bounds.left + bounds.width / 2}px`,
        top: `${bounds.top + 12}px`
      });
    } else if (canvas?.isConnected) {
      const bounds = canvas.getBoundingClientRect();
      const containerBounds = container.getBoundingClientRect();
      Object.assign(element.style, {
        left: `${bounds.left - containerBounds.left + container.scrollLeft + bounds.width / 2}px`,
        top: `${bounds.top - containerBounds.top + container.scrollTop + 12}px`
      });
    }

    if (container !== document.body && !this.positionedContainer) {
      if (acquirePositionedContainer(container)) {
        this.positionedContainer = container;
      }
    }
    container.appendChild(element);
    this.messageElement = element;
    this.fadeMessageTimer = setTimeout(() => {
      if (this.messageElement === element) {
        element.style.opacity = '0';
      }
    }, 3000);
    this.removeMessageTimer = setTimeout(() => {
      if (this.messageElement === element) {
        this.clearMessage();
      }
    }, 4000);
  }

  clear(): void {
    this.element?.remove();
    this.element = null;
    this.clearMessage();
    this.releasePositionedContainer();
  }

  clearMessage(): void {
    if (this.fadeMessageTimer) {
      clearTimeout(this.fadeMessageTimer);
      this.fadeMessageTimer = null;
    }
    if (this.removeMessageTimer) {
      clearTimeout(this.removeMessageTimer);
      this.removeMessageTimer = null;
    }
    this.messageElement?.remove();
    this.messageElement = null;
    if (!this.element) {
      this.releasePositionedContainer();
    }
  }

  private releasePositionedContainer(): void {
    if (this.positionedContainer) {
      releasePositionedContainer(this.positionedContainer);
      this.positionedContainer = null;
    }
  }

  destroy(): void {
    this.clear();
  }
}

function acquirePositionedContainer(container: HTMLElement): boolean {
  const existingState = positionedContainers.get(container);
  if (existingState) {
    existingState.count++;
    return true;
  }
  if (getComputedStyle(container).position !== 'static') {
    return false;
  }
  positionedContainers.set(container, {count: 1, previousPosition: container.style.position});
  container.style.position = 'relative';
  return true;
}

function releasePositionedContainer(container: HTMLElement): void {
  const state = positionedContainers.get(container);
  if (!state) {
    return;
  }
  state.count--;
  if (state.count === 0) {
    container.style.position = state.previousPosition;
    positionedContainers.delete(container);
  }
}

function resolveTarget(target?: CanvasErrorDisplayTarget): HTMLElement | null {
  if (typeof document === 'undefined') {
    return null;
  }
  if (typeof target === 'string') {
    return document.getElementById(target);
  }
  return target || null;
}

function getErrorTitle(error: Error): string {
  if (error instanceof DeviceCreationError) {
    return 'Unable to start graphics';
  }
  if (getDeviceLossInfo(error)) {
    return 'Graphics device lost';
  }
  return 'Graphics error';
}

function formatTechnicalDetails(error: Error): string {
  if (error instanceof DeviceCreationError) {
    return error.attempts
      .map((attempt, index) => {
        const profile = attempt.featureLevel ? `/${attempt.featureLevel}` : '';
        const software = attempt.software ? '/software' : '';
        const message = attempt.error?.message || 'Unknown failure';
        return `${index + 1}. ${attempt.backend}${profile}${software} [${attempt.phase}] ${message}`;
      })
      .join('\n');
  }
  const loss = getDeviceLossInfo(error);
  if (loss) {
    return `Device loss [${loss.reason}]\n${loss.message}`;
  }
  return error.stack || '';
}

function getDeviceLossInfo(error: Error): {reason: string; message: string} | undefined {
  return (error as Error & {deviceLossInfo?: {reason: string; message: string}}).deviceLossInfo;
}
