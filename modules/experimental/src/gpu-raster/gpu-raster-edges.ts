// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {Binding, BindingDeclaration} from '@luma.gl/core';
import {Computation} from '@luma.gl/engine';
import type {
  GPUCommandGraph,
  GPUCommandGraphContributor,
  GraphDataView,
  GraphResourceUse
} from '@luma.gl/gpgpu/gpu-core';
import {createTransientView, getViewBinding, getViewElementOffset} from '@luma.gl/gpgpu/gpu-core';
import {
  GPURasterNeighborhood,
  type GPURasterBorderMode,
  type GPURasterNeighborhoodProps
} from './gpu-raster-neighborhood';
import {
  assertRasterStorageBindingFits,
  getRasterDispatchSize,
  getRasterFloatLiteral,
  RASTER_WORKGROUP_DIMENSION
} from './raster-utils';
import type {GPURasterBufferBand} from './types';

/** Signed 3×3 first-derivative stencil. */
export type GPURasterGradientOperator = 'sobel' | 'scharr';

/** Positive x increases rightward; positive y increases downward. */
export type GPURasterGradientDirection = 'x' | 'y';

/** Number of neighbors included by the discrete Laplacian. */
export type GPURasterLaplacianConnectivity = 4 | 8;

/** Shared strict-nodata, graph-native edge-detection contract. */
export type GPURasterEdgeProps = Omit<
  GPURasterNeighborhoodProps,
  'radius' | 'kernel' | 'noDataPolicy' | 'normalize'
> & {
  /** Positive multiplier applied to the raw signed stencil. Defaults to one. */
  scale?: number;
};

/** Explicit Sobel/Scharr operator and derivative direction. */
export type GPURasterGradientProps = GPURasterEdgeProps & {
  operator: GPURasterGradientOperator;
  direction: GPURasterGradientDirection;
};

/** Directional Sobel derivative; the operator is selected by the class. */
export type GPURasterSobelProps = Omit<GPURasterGradientProps, 'operator'>;

/** Directional Scharr derivative; the operator is selected by the class. */
export type GPURasterScharrProps = Omit<GPURasterGradientProps, 'operator'>;

/** Signed second derivative using four or eight adjacent source pixels. */
export type GPURasterLaplacianProps = GPURasterEdgeProps & {
  /** Four-neighbor connectivity is the default. */
  connectivity?: GPURasterLaplacianConnectivity;
};

/** Orientation-independent Sobel or Scharr gradient magnitude. */
export type GPURasterGradientMagnitudeProps = GPURasterEdgeProps & {
  /** Sobel is the default; Scharr provides a stronger, more isotropic response. */
  operator?: GPURasterGradientOperator;
};

const SOBEL_HORIZONTAL_KERNEL = [-1, 0, 1, -2, 0, 2, -1, 0, 1] as const;
const SOBEL_VERTICAL_KERNEL = [-1, -2, -1, 0, 0, 0, 1, 2, 1] as const;
const SCHARR_HORIZONTAL_KERNEL = [-3, 0, 3, -10, 0, 10, -3, 0, 3] as const;
const SCHARR_VERTICAL_KERNEL = [-3, -10, -3, 0, 0, 0, 3, 10, 3] as const;
const LAPLACIAN_FOUR_KERNEL = [0, 1, 0, 1, -4, 1, 0, 1, 0] as const;
const LAPLACIAN_EIGHT_KERNEL = [1, 1, 1, 1, -8, 1, 1, 1, 1] as const;

/**
 * Computes one signed, strict-nodata Sobel or Scharr derivative on the GPU.
 *
 * A unit increasing horizontal or vertical ramp produces eight with Sobel and 32 with Scharr.
 * The optional positive scale multiplies these raw responses without renormalizing signed taps.
 */
export class GPURasterGradient extends GPURasterNeighborhood {
  readonly operator: GPURasterGradientOperator;
  readonly direction: GPURasterGradientDirection;
  readonly scale: number;

  constructor(props: GPURasterGradientProps) {
    const id = props.id ?? 'gpu-raster-gradient';
    if (props.operator !== 'sobel' && props.operator !== 'scharr') {
      throw new Error(`${id} gradient operator must be sobel or scharr`);
    }
    if (props.direction !== 'x' && props.direction !== 'y') {
      throw new Error(`${id} gradient direction must be x or y`);
    }
    const scale = validateDerivativeScale(props.scale, id);
    const coefficients = getGradientKernel(props.operator, props.direction);
    super({
      ...props,
      id,
      radius: 1,
      kernel: coefficients.map(coefficient => coefficient * scale),
      noDataPolicy: 'propagate',
      normalize: false
    });
    this.operator = props.operator;
    this.direction = props.direction;
    this.scale = scale;
  }
}

/** Signed Sobel derivative whose unscaled response to a unit ramp is eight. */
export class GPURasterSobel extends GPURasterGradient {
  constructor(props: GPURasterSobelProps) {
    super({...props, id: props.id ?? 'gpu-raster-sobel', operator: 'sobel'});
  }
}

/** Signed Scharr derivative whose unscaled response to a unit ramp is 32. */
export class GPURasterScharr extends GPURasterGradient {
  constructor(props: GPURasterScharrProps) {
    super({...props, id: props.id ?? 'gpu-raster-scharr', operator: 'scharr'});
  }
}

/**
 * Computes a signed four- or eight-neighbor discrete Laplacian.
 *
 * Positive unit impulses yield a center response of -4 or -8 respectively; constant regions
 * remain zero. Every nonzero tap participates in strict nodata propagation.
 */
export class GPURasterLaplacian extends GPURasterNeighborhood {
  readonly connectivity: GPURasterLaplacianConnectivity;
  readonly scale: number;

  constructor(props: GPURasterLaplacianProps) {
    const id = props.id ?? 'gpu-raster-laplacian';
    const connectivity = props.connectivity ?? 4;
    if (connectivity !== 4 && connectivity !== 8) {
      throw new Error(`${id} Laplacian connectivity must be four or eight`);
    }
    const scale = validateDerivativeScale(props.scale, id);
    const coefficients = connectivity === 4 ? LAPLACIAN_FOUR_KERNEL : LAPLACIAN_EIGHT_KERNEL;
    super({
      ...props,
      id,
      radius: 1,
      kernel: coefficients.map(coefficient => coefficient * scale),
      noDataPolicy: 'propagate',
      normalize: false
    });
    this.connectivity = connectivity;
    this.scale = scale;
  }
}

/**
 * Composes two signed derivatives and a numerically stable GPU hypot pass.
 *
 * Four graph-owned transient float32/uint32 buffers hold both directional responses and masks.
 * Inputs, outputs, validity, and graph lifetimes remain GPU-resident and caller-controlled.
 */
export class GPURasterGradientMagnitude implements GPUCommandGraphContributor {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly input: GPURasterBufferBand;
  readonly output: GraphDataView<'float32'>;
  readonly outputValidity: GraphDataView<'uint32'>;
  readonly operator: GPURasterGradientOperator;
  readonly borderMode: GPURasterBorderMode;
  readonly borderValue: number;
  readonly scale: number;
  readonly requiredHalo = 1;

  constructor(props: GPURasterGradientMagnitudeProps) {
    const operator = props.operator ?? 'sobel';
    const gradient = new GPURasterGradient({
      ...props,
      id: props.id ?? 'gpu-raster-gradient-magnitude',
      operator,
      direction: 'x'
    });
    this.id = gradient.id;
    this.width = gradient.width;
    this.height = gradient.height;
    this.input = gradient.input;
    this.output = gradient.output;
    this.outputValidity = gradient.outputValidity;
    this.operator = gradient.operator;
    this.borderMode = gradient.borderMode;
    this.borderValue = gradient.borderValue;
    this.scale = gradient.scale;
  }

  /** Adds horizontal, vertical, and overflow-resistant magnitude compute passes. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    const borrowedViews = [
      this.input.storage.values,
      this.output,
      this.outputValidity,
      ...(this.input.validity ? [this.input.validity] : [])
    ];
    for (const view of borrowedViews) {
      if (view.buffer.graph !== graph) {
        throw new Error(`${this.id} resources must belong to the target graph`);
      }
      assertRasterStorageBindingFits(graph.device, view, `${this.id} ${view.buffer.id}`);
    }
    if (graph.device.limits.maxStorageBuffersPerShaderStage < 6) {
      throw new Error(`${this.id} magnitude exceeds the device storage binding count`);
    }
    const dispatchSize = getRasterDispatchSize(graph.device, this.width, this.height, this.id);
    const pixelCount = this.width * this.height;
    const horizontalValues = createTransientView(
      graph,
      `${this.id}-horizontal-values`,
      'float32',
      pixelCount
    );
    const horizontalValidity = createTransientView(
      graph,
      `${this.id}-horizontal-validity`,
      'uint32',
      pixelCount
    );
    const verticalValues = createTransientView(
      graph,
      `${this.id}-vertical-values`,
      'float32',
      pixelCount
    );
    const verticalValidity = createTransientView(
      graph,
      `${this.id}-vertical-validity`,
      'uint32',
      pixelCount
    );
    for (const view of [horizontalValues, horizontalValidity, verticalValues, verticalValidity]) {
      assertRasterStorageBindingFits(graph.device, view, `${this.id} ${view.buffer.id}`);
    }

    const gradientProps = {
      width: this.width,
      height: this.height,
      input: this.input,
      operator: this.operator,
      borderMode: this.borderMode,
      borderValue: this.borderValue,
      scale: this.scale
    };
    new GPURasterGradient({
      ...gradientProps,
      id: `${this.id}-horizontal`,
      output: horizontalValues,
      outputValidity: horizontalValidity,
      direction: 'x'
    }).addToGraph(graph);
    new GPURasterGradient({
      ...gradientProps,
      id: `${this.id}-vertical`,
      output: verticalValues,
      outputValidity: verticalValidity,
      direction: 'y'
    }).addToGraph(graph);

    const resources: GraphResourceUse[] = [
      {buffer: horizontalValues, usage: 'storage-read'},
      {buffer: verticalValues, usage: 'storage-read'},
      {buffer: horizontalValidity, usage: 'storage-read'},
      {buffer: verticalValidity, usage: 'storage-read'},
      {buffer: this.output, usage: 'storage-write'},
      {buffer: this.outputValidity, usage: 'storage-write'}
    ];
    graph.addComputePass({
      id: `${this.id}-magnitude`,
      resources,
      compile: ({device}) => {
        const bindings: BindingDeclaration[] = [
          {name: 'horizontalValues', type: 'read-only-storage', group: 0, location: 0},
          {name: 'verticalValues', type: 'read-only-storage', group: 0, location: 1},
          {name: 'horizontalValidity', type: 'read-only-storage', group: 0, location: 2},
          {name: 'verticalValidity', type: 'read-only-storage', group: 0, location: 3},
          {name: 'outputValues', type: 'storage', group: 0, location: 4},
          {name: 'outputValidity', type: 'storage', group: 0, location: 5}
        ];
        const computation = new Computation(device, {
          id: `${this.id}-magnitude`,
          source: this.getMagnitudeShaderSource(
            horizontalValues,
            verticalValues,
            horizontalValidity,
            verticalValidity
          ),
          shaderLayout: {bindings}
        });
        return {
          encode: ({computePass, getBuffer}) => {
            const resolvedBindings: Record<string, Binding> = {
              horizontalValues: getViewBinding(horizontalValues, getBuffer),
              verticalValues: getViewBinding(verticalValues, getBuffer),
              horizontalValidity: getViewBinding(horizontalValidity, getBuffer),
              verticalValidity: getViewBinding(verticalValidity, getBuffer),
              outputValues: getViewBinding(this.output, getBuffer),
              outputValidity: getViewBinding(this.outputValidity, getBuffer)
            };
            computation.setBindings(resolvedBindings);
            computation.dispatch(computePass, dispatchSize[0], dispatchSize[1]);
          },
          destroy: () => computation.destroy()
        };
      }
    });
  }

  private getMagnitudeShaderSource(
    horizontalValues: GraphDataView<'float32'>,
    verticalValues: GraphDataView<'float32'>,
    horizontalValidity: GraphDataView<'uint32'>,
    verticalValidity: GraphDataView<'uint32'>
  ): string {
    return /* wgsl */ `
const WIDTH: u32 = ${this.width}u;
const HEIGHT: u32 = ${this.height}u;
const HORIZONTAL_OFFSET: u32 = ${getViewElementOffset(horizontalValues)}u;
const VERTICAL_OFFSET: u32 = ${getViewElementOffset(verticalValues)}u;
const HORIZONTAL_VALIDITY_OFFSET: u32 = ${getViewElementOffset(horizontalValidity)}u;
const VERTICAL_VALIDITY_OFFSET: u32 = ${getViewElementOffset(verticalValidity)}u;
const OUTPUT_OFFSET: u32 = ${getViewElementOffset(this.output)}u;
const OUTPUT_VALIDITY_OFFSET: u32 = ${getViewElementOffset(this.outputValidity)}u;
@group(0) @binding(0) var<storage, read> horizontalValues: array<f32>;
@group(0) @binding(1) var<storage, read> verticalValues: array<f32>;
@group(0) @binding(2) var<storage, read> horizontalValidity: array<u32>;
@group(0) @binding(3) var<storage, read> verticalValidity: array<u32>;
@group(0) @binding(4) var<storage, read_write> outputValues: array<f32>;
@group(0) @binding(5) var<storage, read_write> outputValidity: array<u32>;

fn isFiniteValue(value: f32) -> bool {
  return value == value && abs(value) <= 3.402823466e+38;
}

fn stableMagnitude(horizontal: f32, vertical: f32) -> f32 {
  let larger = max(abs(horizontal), abs(vertical));
  let smaller = min(abs(horizontal), abs(vertical));
  if (larger == 0.0) { return 0.0; }
  let ratio = smaller / larger;
  return larger * sqrt(1.0 + ratio * ratio);
}

@compute @workgroup_size(${RASTER_WORKGROUP_DIMENSION}, ${RASTER_WORKGROUP_DIMENSION})
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  if (globalId.x >= WIDTH || globalId.y >= HEIGHT) { return; }
  let pixelIndex = globalId.y * WIDTH + globalId.x;
  let horizontal = horizontalValues[HORIZONTAL_OFFSET + pixelIndex];
  let vertical = verticalValues[VERTICAL_OFFSET + pixelIndex];
  let magnitude = stableMagnitude(horizontal, vertical);
  let isValid =
    horizontalValidity[HORIZONTAL_VALIDITY_OFFSET + pixelIndex] != 0u &&
    verticalValidity[VERTICAL_VALIDITY_OFFSET + pixelIndex] != 0u &&
    isFiniteValue(horizontal) && isFiniteValue(vertical) && isFiniteValue(magnitude);
  let invalidValue = bitcast<f32>(0x7fc00000u | (pixelIndex & 0u));
  outputValues[OUTPUT_OFFSET + pixelIndex] = select(invalidValue, magnitude, isValid);
  outputValidity[OUTPUT_VALIDITY_OFFSET + pixelIndex] = select(0u, 1u, isValid);
}`;
  }
}

function getGradientKernel(
  operator: GPURasterGradientOperator,
  direction: GPURasterGradientDirection
): readonly number[] {
  if (operator === 'sobel') {
    return direction === 'x' ? SOBEL_HORIZONTAL_KERNEL : SOBEL_VERTICAL_KERNEL;
  }
  return direction === 'x' ? SCHARR_HORIZONTAL_KERNEL : SCHARR_VERTICAL_KERNEL;
}

function validateDerivativeScale(value: number | undefined, id: string): number {
  const scale = value ?? 1;
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new Error(`${id} derivative scale must be finite and positive`);
  }
  getRasterFloatLiteral(scale);
  if (Math.fround(scale) === 0) {
    throw new Error(`${id} derivative scale must fit in positive float32`);
  }
  return scale;
}
