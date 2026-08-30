// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {
  StructuredVolumeRenderer,
  type StructuredVolumeRendererPrepareOptions,
  type StructuredVolumeSources
} from '@luma.gl/scene/raymarch';
import {Matrix4, radians} from '@math.gl/core';
import type {VectorFieldBuffers} from './vector-field-engine';

export type VectorFieldRenderOptions = {
  scalarMode: boolean;
  eye: readonly [number, number, number];
};

const SCALAR_SEQUENTIAL = {
  transferFunction: 'sequential' as const,
  lowColor: [0.04, 0.22, 0.5] as const,
  highColor: [1, 0.7, 0.16] as const,
  densityScale: 2.1
};
const LAPLACIAN_STYLE = {
  transferFunction: 'signed' as const,
  valueScale: 0.16,
  densityScale: 0.32
};
const DIVERGENCE_STYLE = {
  transferFunction: 'signed' as const,
  valueScale: 0.35,
  densityScale: 0.09
};
const VECTOR_STYLE = {densityScale: 0.2, magnitudeScale: 1} as const;
const GLYPHS = {enabled: true, gridDimensions: [6, 6, 6] as const} as const;

/** Four synchronized views built from the reusable structured-volume renderer. */
export class VectorFieldRenderer {
  readonly device: Device;
  readonly resolution: number;
  readonly renderers: readonly StructuredVolumeRenderer[];

  private readonly buffers: VectorFieldBuffers;

  constructor(device: Device, buffers: VectorFieldBuffers, resolution: number) {
    this.device = device;
    this.buffers = buffers;
    this.resolution = resolution;
    const dimensions = [resolution, resolution, resolution] as const;
    this.renderers = [
      new StructuredVolumeRenderer(device, {
        id: 'vector-field-base-volume',
        dimensions,
        scalar: scalarSource(buffers.scalar),
        vector: vectorSource(buffers.vector)
      }),
      new StructuredVolumeRenderer(device, {
        id: 'vector-field-first-derivative-volume',
        dimensions,
        scalar: scalarSource(buffers.divergence),
        vector: vectorSource(buffers.gradient)
      }),
      new StructuredVolumeRenderer(device, {
        id: 'vector-field-second-derivative-volume',
        dimensions,
        scalar: scalarSource(buffers.laplacian),
        vector: vectorSource(buffers.curl)
      }),
      new StructuredVolumeRenderer(device, {
        id: 'vector-field-topology-volume',
        dimensions,
        scalar: scalarSource(buffers.scalar),
        vector: vectorSource(buffers.gradient)
      })
    ];
  }

  render(options: VectorFieldRenderOptions): void {
    const canvasContext = this.device.getDefaultCanvasContext();
    const [width, height] = canvasContext.getDrawingBufferSize();
    const panelWidth = Math.ceil(width / 2);
    const panelHeight = Math.ceil(height / 2);
    const projection = new Matrix4().perspective({
      fovy: radians(46),
      aspect: panelWidth / Math.max(panelHeight, 1),
      near: 0.1,
      far: 20
    });
    const view = new Matrix4().lookAt({eye: options.eye, center: [0, 0, 0], up: [0, 1, 0]});
    const inverseViewProjectionMatrix = new Matrix4(projection).multiplyRight(view).invert();
    const viewports = getPanelViewports(width, height);
    const common = {
      inverseViewProjectionMatrix,
      cameraPosition: options.eye,
      sampleCount: 72
    } as const;
    const prepareOptions = options.scalarMode
      ? this.getScalarPrepareOptions(common, viewports)
      : this.getVectorPrepareOptions(common, viewports);

    const topologySources: StructuredVolumeSources = options.scalarMode
      ? {scalar: scalarSource(this.buffers.scalar), vector: vectorSource(this.buffers.gradient)}
      : {scalar: scalarSource(this.buffers.divergence), vector: vectorSource(this.buffers.curl)};
    this.renderers[3].setSources(topologySources);
    for (let index = 0; index < this.renderers.length; index++) {
      this.renderers[index].prepare(this.device.commandEncoder, prepareOptions[index]);
    }

    const renderPass = this.device.beginRenderPass({
      id: 'vector-field-volume-pass',
      framebuffer: canvasContext.getCurrentFramebuffer(),
      clearColor: [0.004, 0.008, 0.018, 1]
    });
    try {
      for (const renderer of this.renderers) renderer.draw(renderPass);
    } finally {
      renderPass.end();
    }
  }

  destroy(): void {
    for (const renderer of this.renderers) renderer.destroy();
  }

  private getScalarPrepareOptions(
    common: Pick<
      StructuredVolumeRendererPrepareOptions,
      'inverseViewProjectionMatrix' | 'cameraPosition' | 'sampleCount'
    >,
    viewports: readonly (readonly [number, number, number, number])[]
  ): StructuredVolumeRendererPrepareOptions[] {
    return [
      {...common, viewport: viewports[0], mode: 'scalar', scalarStyle: SCALAR_SEQUENTIAL},
      {
        ...common,
        viewport: viewports[1],
        mode: 'vector',
        vectorStyle: VECTOR_STYLE,
        glyphs: GLYPHS
      },
      {...common, viewport: viewports[2], mode: 'scalar', scalarStyle: LAPLACIAN_STYLE},
      {
        ...common,
        viewport: viewports[3],
        mode: 'hybrid',
        scalarStyle: {...SCALAR_SEQUENTIAL, densityScale: 0.75},
        vectorStyle: {...VECTOR_STYLE, densityScale: 0.08}
      }
    ];
  }

  private getVectorPrepareOptions(
    common: Pick<
      StructuredVolumeRendererPrepareOptions,
      'inverseViewProjectionMatrix' | 'cameraPosition' | 'sampleCount'
    >,
    viewports: readonly (readonly [number, number, number, number])[]
  ): StructuredVolumeRendererPrepareOptions[] {
    return [
      {
        ...common,
        viewport: viewports[0],
        mode: 'vector',
        vectorStyle: {...VECTOR_STYLE, densityScale: 0.3},
        glyphs: GLYPHS
      },
      {...common, viewport: viewports[1], mode: 'scalar', scalarStyle: DIVERGENCE_STYLE},
      {
        ...common,
        viewport: viewports[2],
        mode: 'vector',
        vectorStyle: {...VECTOR_STYLE, densityScale: 0.18},
        glyphs: GLYPHS
      },
      {
        ...common,
        viewport: viewports[3],
        mode: 'hybrid',
        scalarStyle: {...DIVERGENCE_STYLE, densityScale: 0.05},
        vectorStyle: {...VECTOR_STYLE, densityScale: 0.1}
      }
    ];
  }
}

function scalarSource(buffer: VectorFieldBuffers[keyof VectorFieldBuffers]) {
  return {type: 'buffer' as const, format: 'float32' as const, buffer};
}

function vectorSource(buffer: VectorFieldBuffers[keyof VectorFieldBuffers]) {
  return {type: 'buffer' as const, format: 'float32x4' as const, buffer};
}

function getPanelViewports(
  width: number,
  height: number
): readonly (readonly [number, number, number, number])[] {
  const leftWidth = Math.ceil(width / 2);
  const rightWidth = width - leftWidth;
  const topHeight = Math.ceil(height / 2);
  const bottomHeight = height - topHeight;
  return [
    [0, 0, leftWidth, topHeight],
    [leftWidth, 0, rightWidth, topHeight],
    [0, topHeight, leftWidth, bottomHeight],
    [leftWidth, topHeight, rightWidth, bottomHeight]
  ];
}
