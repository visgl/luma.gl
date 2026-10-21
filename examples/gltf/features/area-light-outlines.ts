// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';
import type {AreaLight} from '@luma.gl/shadertools';

/** Project diagnostic emitter outlines without adding geometry to the imported model. */
export class AreaLightOutlines {
  private readonly element: SVGSVGElement;

  constructor(canvas: HTMLCanvasElement) {
    this.element = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.element.setAttribute('aria-hidden', 'true');
    this.element.setAttribute('viewBox', '0 0 1000 1000');
    this.element.setAttribute('preserveAspectRatio', 'none');
    Object.assign(this.element.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '2'
    });
    canvas.parentElement?.appendChild(this.element);
  }

  update(lights: readonly AreaLight[], viewProjection: Matrix4): void {
    const paths: string[] = [];
    for (const light of lights) {
      const count = light.type === 'disk' ? 32 : 4;
      const points: string[] = [];
      for (let index = 0; index < count; index++) {
        const horizontal =
          light.type === 'disk' ? Math.cos((index * Math.PI * 2) / count) : [-1, 1, 1, -1][index];
        const vertical =
          light.type === 'disk' ? Math.sin((index * Math.PI * 2) / count) : [-1, -1, 1, 1][index];
        const position = light.position.map(
          (value, axis) =>
            value + horizontal * light.halfAxisX[axis] + vertical * light.halfAxisY[axis]
        );
        const clip = viewProjection.transform([position[0], position[1], position[2], 1]);
        if (clip[3] <= 0) break;
        points.push(`${(clip[0] / clip[3] + 1) * 500},${(1 - clip[1] / clip[3]) * 500}`);
      }
      if (points.length === count) paths.push(`M${points.join('L')}Z`);
    }
    this.element.innerHTML = paths
      .map(
        path =>
          `<path d="${path}" fill="rgba(255,196,64,0.08)" stroke="#ffc440" stroke-width="3" vector-effect="non-scaling-stroke"/>`
      )
      .join('');
  }

  destroy(): void {
    this.element.remove();
  }
}
