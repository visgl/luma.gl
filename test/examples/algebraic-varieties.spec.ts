// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {AnimationProps} from '@luma.gl/engine';
import {getWebGPUTestDevice} from '@luma.gl/test-utils';
import {describe, expect, test} from 'vitest';
import AlgebraicVarietiesAnimationLoopTemplate from '../../examples/showcase/algebraic-varieties/app';

describe('Algebraic varieties WebGPU showcase', () => {
  test('compiles, draws, and connects the implicit polynomial showcase', async () => {
    const device = await getWebGPUTestDevice('core');
    if (!device) {
      return;
    }
    const width = 96;
    const height = 64;
    const host = document.createElement('div');
    host.innerHTML = `
      <select data-variety-preset></select>
      <input data-variety-deformation>
      <input data-variety-exposure value="1.15">
      <input data-variety-singularities type="checkbox" checked>
      <button data-variety-reset></button>
      <div data-variety-equation></div>
      <p data-variety-description></p>
      <button data-variety-tab="surface" aria-selected="true"></button>
      <button data-variety-tab="background" aria-selected="false"></button>
      <button data-variety-tab="rendering" aria-selected="false"></button>
      <section data-variety-panel="surface"></section>
      <section data-variety-panel="background" hidden></section>
      <section data-variety-panel="rendering" hidden>
        guarded secant and bisection · ∇f · d · never treated as a signed-distance field
      </section>`;
    document.body.append(host);
    const canvas = document.createElement('canvas');
    document.body.append(canvas);
    let viewer: AlgebraicVarietiesAnimationLoopTemplate | null = null;
    try {
      viewer = new AlgebraicVarietiesAnimationLoopTemplate(
        makeAnimationProps(device, width, height, 0)
      );
      await viewer.onInitialize({
        ...makeAnimationProps(device, width, height, 0),
        canvas
      } as AnimationProps);
      viewer.onRender(makeAnimationProps(device, width, height, 1000));
      device.submit();
      expect(viewer.commandGraph.stats.nodeOrder).toEqual(['ray-intersect-and-shade-variety']);
      expect(viewer.model.source).toContain('evaluateBarth');
      expect(viewer.model.source).toContain('intersectImplicitSurface');

      const presetSelect = host.querySelector<HTMLSelectElement>('[data-variety-preset]')!;
      const deformationInput = host.querySelector<HTMLInputElement>('[data-variety-deformation]')!;
      const singularitiesInput = host.querySelector<HTMLInputElement>(
        '[data-variety-singularities]'
      )!;
      expect(presetSelect.options).toHaveLength(10);
      expect(singularitiesInput.checked).toBe(true);
      singularitiesInput.click();
      expect(singularitiesInput.checked).toBe(false);

      presetSelect.value = 'heart';
      presetSelect.dispatchEvent(new Event('change'));
      expect(deformationInput.value).toBe('0');
      expect(host.querySelector('[data-variety-equation]')!.textContent).toContain(
        '(x² + 9y²/4 + z² − 1)³'
      );
      deformationInput.value = '0.2';
      deformationInput.dispatchEvent(new Event('input'));
      presetSelect.value = 'barth';
      presetSelect.dispatchEvent(new Event('change'));
      presetSelect.value = 'heart';
      presetSelect.dispatchEvent(new Event('change'));
      expect(deformationInput.value).toBe('0.2');
      host.querySelector<HTMLButtonElement>('[data-variety-reset]')!.click();
      expect(deformationInput.value).toBe('0');
      expect(singularitiesInput.checked).toBe(true);

      host.querySelector<HTMLButtonElement>('[data-variety-tab="background"]')!.click();
      expect(host.querySelector<HTMLElement>('[data-variety-panel="surface"]')!.hidden).toBe(true);
      expect(host.querySelector<HTMLElement>('[data-variety-panel="background"]')!.hidden).toBe(
        false
      );
      host.querySelector<HTMLButtonElement>('[data-variety-tab="rendering"]')!.click();
      expect(host.querySelector<HTMLElement>('[data-variety-panel="background"]')!.hidden).toBe(
        true
      );
      const renderingPanel = host.querySelector<HTMLElement>('[data-variety-panel="rendering"]')!;
      expect(renderingPanel.hidden).toBe(false);
      expect(renderingPanel.textContent).toContain('∇f · d');
      expect(renderingPanel.textContent).toContain('never treated as a signed-distance field');

      presetSelect.value = 'kummer';
      presetSelect.dispatchEvent(new Event('change'));
      globalThis.dispatchEvent(new Event('pointerdown'));
      viewer.onRender(makeAnimationProps(device, width, height, 20_000));
      expect(presetSelect.value).toBe('kummer');
      globalThis.dispatchEvent(new Event('pointerup'));
      viewer.onRender(makeAnimationProps(device, width, height, 34_000));
      expect(presetSelect.value).toBe('kummer');
      viewer.onRender(makeAnimationProps(device, width, height, 36_000));
      expect(presetSelect.value).toBe('chmutov');
    } finally {
      viewer?.onFinalize();
      canvas.remove();
      host.remove();
    }
  });
});

function makeAnimationProps(
  device: AnimationProps['device'],
  width: number,
  height: number,
  time: number
): AnimationProps {
  return {
    device,
    tick: Math.floor((time / 1000) * 60),
    time,
    width,
    height,
    aspect: width / height
  } as AnimationProps;
}
