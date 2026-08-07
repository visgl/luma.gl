// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, it, vi} from 'vitest';
import {ComparisonSplitter} from '../../src/controls/comparison-splitter';

type MockBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type MockEventOptions = {
  button?: number;
  clientX?: number;
  key?: string;
  pointerId?: number;
  shiftKey?: boolean;
};

class MockElement {
  readonly attributes = new Map<string, string>();
  readonly children: MockElement[] = [];
  readonly dataset: Record<string, string> = {};
  readonly listeners = new Map<string, Set<(event: Event) => void>>();
  readonly pointerCaptures = new Set<number>();
  readonly style: Record<string, string> = {};
  bounds: MockBounds = {left: 0, top: 0, width: 0, height: 0};
  clientLeft = 0;
  clientTop = 0;
  hidden = false;
  id = '';
  ownerDocument: Document | undefined;
  parent: MockElement | null = null;
  scrollLeft = 0;
  scrollTop = 0;
  tabIndex = -1;
  textContent = '';

  constructor(readonly tagName: string) {}

  addEventListener(type: string, listener: (event: Event) => void): void {
    const listeners = this.listeners.get(type) || new Set<(event: Event) => void>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type: string, listener: (event: Event) => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  append(...children: MockElement[]): void {
    for (const child of children) {
      child.parent = this;
      this.children.push(child);
    }
  }

  remove(): void {
    if (!this.parent) {
      return;
    }
    const index = this.parent.children.indexOf(this);
    if (index >= 0) {
      this.parent.children.splice(index, 1);
    }
    this.parent = null;
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) || null;
  }

  getBoundingClientRect(): DOMRect {
    return {
      ...this.bounds,
      x: this.bounds.left,
      y: this.bounds.top,
      right: this.bounds.left + this.bounds.width,
      bottom: this.bounds.top + this.bounds.height,
      toJSON: () => this.bounds
    } as DOMRect;
  }

  setPointerCapture(pointerId: number): void {
    this.pointerCaptures.add(pointerId);
  }

  hasPointerCapture(pointerId: number): boolean {
    return this.pointerCaptures.has(pointerId);
  }

  releasePointerCapture(pointerId: number): void {
    this.pointerCaptures.delete(pointerId);
  }

  dispatch(
    type: string,
    options: MockEventOptions = {}
  ): {preventDefault: ReturnType<typeof vi.fn>} {
    const event = {
      button: 0,
      clientX: 0,
      pointerId: 1,
      shiftKey: false,
      ...options,
      preventDefault: vi.fn()
    };
    for (const listener of this.listeners.get(type) || []) {
      listener(event as unknown as Event);
    }
    return event;
  }
}

function makeMockDocument(): {
  document: Document;
  body: MockElement;
  createdElements: MockElement[];
  canvas: HTMLCanvasElement;
  canvasElement: MockElement;
} {
  const body = new MockElement('body');
  const createdElements: MockElement[] = [];
  const document = {
    body,
    createElement: (tagName: string) => {
      const element = new MockElement(tagName);
      element.ownerDocument = document as unknown as Document;
      createdElements.push(element);
      return element;
    }
  } as unknown as Document;

  body.ownerDocument = document;
  const canvasElement = new MockElement('canvas');
  canvasElement.bounds = {left: 100, top: 40, width: 400, height: 200};
  canvasElement.ownerDocument = document;

  return {
    document,
    body,
    createdElements,
    canvas: canvasElement as unknown as HTMLCanvasElement,
    canvasElement
  };
}

function getMockElement(splitter: ComparisonSplitter): MockElement {
  return splitter.element as unknown as MockElement;
}

describe('ComparisonSplitter', () => {
  it('creates an accessible, self-contained canvas overlay without global styles', () => {
    const {canvas, body, createdElements} = makeMockDocument();
    const splitter = new ComparisonSplitter({canvas, value: 0.25, onChange: vi.fn()});
    const element = getMockElement(splitter);

    expect(body.children).toEqual([element]);
    expect(createdElements.map(createdElement => createdElement.tagName)).toEqual([
      'div',
      'span',
      'span'
    ]);
    expect(element.id).toBe('');
    expect(element.tabIndex).toBe(0);
    expect(element.dataset['lumaComparisonSplitter']).toBe('true');
    expect(element.getAttribute('role')).toBe('separator');
    expect(element.getAttribute('aria-label')).toBe('Before and after comparison');
    expect(element.getAttribute('aria-orientation')).toBe('vertical');
    expect(element.getAttribute('aria-valuemin')).toBe('0');
    expect(element.getAttribute('aria-valuemax')).toBe('1');
    expect(element.getAttribute('aria-valuenow')).toBe('0.25');
    expect(element.getAttribute('aria-valuetext')).toBe('25% before');
    expect(element.style).toMatchObject({
      position: 'fixed',
      width: '32px',
      cursor: 'col-resize',
      touchAction: 'none',
      left: '200px',
      top: '40px',
      height: '200px'
    });
    expect(element.children[0]?.style.backgroundColor).toBe('#33ebff');
    expect(element.children[1]?.textContent).toBe('\u2194');

    splitter.destroy();
  });

  it('clamps programmatic updates and responds to visibility and canvas layout changes', () => {
    const {canvas, canvasElement} = makeMockDocument();
    const onChange = vi.fn();
    const splitter = new ComparisonSplitter({canvas, value: -1, onChange});
    const element = getMockElement(splitter);

    expect(element.getAttribute('aria-valuenow')).toBe('0.00');
    expect(element.style.left).toBe('100px');

    splitter.setValue(2);
    expect(element.getAttribute('aria-valuenow')).toBe('1.00');
    expect(element.style.left).toBe('500px');
    expect(onChange).not.toHaveBeenCalled();

    splitter.setVisible(false);
    expect(element.hidden).toBe(true);

    splitter.setVisible(true);
    expect(element.hidden).toBe(false);

    canvasElement.bounds = {left: 15, top: 25, width: 240, height: 120};
    splitter.updateLayout();
    expect(element.style).toMatchObject({left: '255px', top: '25px', height: '120px'});

    canvasElement.bounds.width = 0;
    splitter.updateLayout();
    expect(element.hidden).toBe(true);

    canvasElement.bounds.width = 240;
    canvasElement.bounds.height = 0;
    splitter.updateLayout();
    expect(element.hidden).toBe(true);

    splitter.destroy();
  });

  it('captures one pointer, continuously updates its split, and commits exactly once', () => {
    const {canvas} = makeMockDocument();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    const splitter = new ComparisonSplitter({canvas, value: 0.5, onChange, onCommit});
    const element = getMockElement(splitter);

    element.dispatch('pointerdown', {button: 2, clientX: 200, pointerId: 2});
    expect(onChange).not.toHaveBeenCalled();

    const pointerDown = element.dispatch('pointerdown', {clientX: 200, pointerId: 7});
    expect(pointerDown.preventDefault).toHaveBeenCalledOnce();
    expect(element.pointerCaptures.has(7)).toBe(true);
    expect(element.dataset['dragging']).toBe('true');
    expect(element.children[0]?.style.width).toBe('3px');
    expect(onChange).toHaveBeenLastCalledWith(0.25);

    element.dispatch('pointerdown', {clientX: 480, pointerId: 8});
    element.dispatch('pointermove', {clientX: 480, pointerId: 8});
    element.dispatch('pointerup', {clientX: 480, pointerId: 8});
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onCommit).not.toHaveBeenCalled();

    element.dispatch('pointermove', {clientX: 420, pointerId: 7});
    expect(onChange).toHaveBeenLastCalledWith(0.8);

    element.dispatch('pointerup', {clientX: 800, pointerId: 7});
    expect(onChange).toHaveBeenLastCalledWith(1);
    expect(onCommit).toHaveBeenCalledExactlyOnceWith(1);
    expect(element.pointerCaptures.size).toBe(0);
    expect(element.dataset['dragging']).toBeUndefined();
    expect(element.children[0]?.style).toMatchObject({width: '2px', backgroundColor: '#33ebff'});

    element.dispatch('pointerup', {clientX: 100, pointerId: 7});
    expect(onCommit).toHaveBeenCalledOnce();

    splitter.destroy();
  });

  it('preserves the latest valid split when an active pointer is canceled', () => {
    const {canvas} = makeMockDocument();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    const splitter = new ComparisonSplitter({canvas, value: 0.5, onChange, onCommit});
    const element = getMockElement(splitter);

    element.dispatch('pointerdown', {clientX: 340, pointerId: 4});
    element.dispatch('pointermove', {clientX: 400, pointerId: 4});
    element.dispatch('pointercancel', {clientX: 0, pointerId: 4});

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onCommit).toHaveBeenCalledExactlyOnceWith(0.75);
    expect(element.getAttribute('aria-valuenow')).toBe('0.75');
    expect(element.pointerCaptures.size).toBe(0);

    splitter.destroy();
  });

  it('supports accessible arrow, shift-arrow, Home, and End interactions', () => {
    const {canvas} = makeMockDocument();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    const splitter = new ComparisonSplitter({canvas, value: 0.5, onChange, onCommit});
    const element = getMockElement(splitter);

    const ignoredKey = element.dispatch('keydown', {key: 'Tab'});
    expect(ignoredKey.preventDefault).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();

    const rightKey = element.dispatch('keydown', {key: 'ArrowRight'});
    expect(rightKey.preventDefault).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenLastCalledWith(0.51);

    element.dispatch('keydown', {key: 'ArrowDown', shiftKey: true});
    expect(onChange.mock.lastCall?.[0]).toBeCloseTo(0.46);

    element.dispatch('keydown', {key: 'Home'});
    expect(onChange).toHaveBeenLastCalledWith(0);

    element.dispatch('keydown', {key: 'ArrowLeft'});
    expect(onChange).toHaveBeenLastCalledWith(0);

    element.dispatch('keydown', {key: 'End'});
    expect(onChange).toHaveBeenLastCalledWith(1);

    element.dispatch('keydown', {key: 'ArrowUp'});
    expect(onChange).toHaveBeenLastCalledWith(1);
    expect(onCommit).toHaveBeenCalledTimes(6);
    expect(element.getAttribute('aria-valuetext')).toBe('100% before');

    splitter.destroy();
  });

  it('supports independently styled instances and bordered, positioned, scrollable hosts', () => {
    const {canvas, body} = makeMockDocument();
    const host = new MockElement('section');
    host.bounds = {left: 40, top: 15, width: 600, height: 400};
    host.clientLeft = 6;
    host.clientTop = 4;
    host.scrollLeft = 12;
    host.scrollTop = 9;
    const splitter = new ComparisonSplitter({
      canvas,
      id: 'warm-splitter',
      value: 0.5,
      label: 'Filter comparison',
      accentColor: '#ffdb33',
      handleColor: '#321900',
      container: host as unknown as HTMLElement,
      onChange: vi.fn()
    });
    const element = getMockElement(splitter);
    const defaultSplitter = new ComparisonSplitter({canvas, value: 0.2, onChange: vi.fn()});
    const defaultElement = getMockElement(defaultSplitter);

    expect(host.children).toEqual([element]);
    expect(body.children).toEqual([defaultElement]);
    expect(element.id).toBe('warm-splitter');
    expect(defaultElement.id).toBe('');
    expect(element.getAttribute('aria-label')).toBe('Filter comparison');
    expect(element.style).toMatchObject({position: 'absolute', left: '266px', top: '30px'});
    expect(element.children[0]?.style.backgroundColor).toBe('#ffdb33');
    expect(element.children[1]?.style.backgroundColor).toBe('#321900');
    expect(defaultElement.children[0]?.style.backgroundColor).toBe('#33ebff');

    splitter.destroy();
    defaultSplitter.destroy();
  });

  it('releases pointer capture and removes all owned elements and handlers exactly once', () => {
    const {canvas, body} = makeMockDocument();
    const onChange = vi.fn();
    const onCommit = vi.fn();
    const splitter = new ComparisonSplitter({canvas, value: 0.5, onChange, onCommit});
    const element = getMockElement(splitter);

    element.dispatch('pointerdown', {clientX: 320, pointerId: 3});
    expect(element.pointerCaptures.has(3)).toBe(true);

    splitter.destroy();
    splitter.destroy();

    expect(body.children).toEqual([]);
    expect(element.pointerCaptures.size).toBe(0);
    expect(Array.from(element.listeners.values()).every(listeners => listeners.size === 0)).toBe(
      true
    );
    expect(onCommit).not.toHaveBeenCalled();

    element.dispatch('pointermove', {clientX: 400, pointerId: 3});
    expect(onChange).toHaveBeenCalledOnce();
  });
});
