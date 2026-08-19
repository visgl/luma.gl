// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  GPUCommandGraph,
  GPUCommandGraphContributor,
  GraphDataView
} from '../gpu-core/gpu-command-graph';
import {createTransientView} from '../gpu-core/graph-data-view-utils';
import {
  GPURasterNeighborhood,
  type GPURasterBorderMode,
  type GPURasterNeighborhoodProps,
  type GPURasterNoDataPolicy
} from './gpu-raster-neighborhood';
import {assertRasterStorageBindingFits, getRasterFloatLiteral} from './raster-utils';
import type {GPURasterBufferBand} from './types';

/** Row-major direct convolution with an inferred square or explicit odd rectangular kernel. */
export type GPURasterConvolutionProps = Omit<GPURasterNeighborhoodProps, 'radius'> & {
  /** Odd coefficient-row width. Square kernels are inferred when dimensions are omitted. */
  kernelWidth?: number;
  /** Odd coefficient-row count. Square kernels are inferred when dimensions are omitted. */
  kernelHeight?: number;
};

/** Explicit source/destination contract for two-pass separable smoothing. */
export type GPURasterSmoothingProps = Omit<
  GPURasterNeighborhoodProps,
  'radius' | 'kernel' | 'normalize'
> & {
  /** Symmetric source-pixel radius, bounded to zero through eight. */
  radius: number;
};

/** Separable Gaussian smoothing; sigma defaults to max(radius / 2, 0.5). */
export type GPURasterGaussianBlurProps = GPURasterSmoothingProps & {
  /** Positive, finite Gaussian standard deviation in source pixels. */
  sigma?: number;
};

/**
 * Contributes one direct, tiled spatial convolution with explicit signed-kernel behavior.
 *
 * Signed derivative and sharpening kernels remain unnormalized by default. Renormalizing
 * missing neighbors is intentionally restricted to nonnegative smoothing coefficients.
 */
export class GPURasterConvolution extends GPURasterNeighborhood {
  readonly kernelWidth: number;
  readonly kernelHeight: number;

  constructor(props: GPURasterConvolutionProps) {
    const dimensions = getKernelDimensions(props);
    super({
      ...props,
      id: props.id ?? 'gpu-raster-convolution',
      radius: [(dimensions[0] - 1) / 2, (dimensions[1] - 1) / 2]
    });
    this.kernelWidth = dimensions[0];
    this.kernelHeight = dimensions[1];
  }
}

/** Shared graph-native ping-pong contract for explicitly separable spatial kernels. */
abstract class GPURasterSeparableSmoothing implements GPUCommandGraphContributor {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly input: GPURasterBufferBand;
  readonly output: GraphDataView<'float32'>;
  readonly outputValidity: GraphDataView<'uint32'>;
  readonly radius: number;
  readonly requiredHalo: number;
  readonly kernel: readonly number[];
  readonly borderMode: GPURasterBorderMode;
  readonly borderValue: number;
  readonly noDataPolicy: GPURasterNoDataPolicy;

  protected constructor(
    props: GPURasterSmoothingProps,
    kernel: readonly number[],
    defaultId: string
  ) {
    this.id = props.id ?? defaultId;
    const neighborhood = new GPURasterNeighborhood({
      ...props,
      id: this.id,
      radius: [props.radius, 0],
      kernel,
      normalize: true
    });
    this.width = neighborhood.width;
    this.height = neighborhood.height;
    this.input = neighborhood.input;
    this.output = neighborhood.output;
    this.outputValidity = neighborhood.outputValidity;
    this.radius = props.radius;
    this.requiredHalo = props.radius;
    this.kernel = neighborhood.kernel;
    this.borderMode = neighborhood.borderMode;
    this.borderValue = neighborhood.borderValue;
    this.noDataPolicy = neighborhood.noDataPolicy;
  }

  /** Adds one identity pass or two ordered passes with reusable graph-owned scratch. */
  addToGraph<Parameters>(graph: GPUCommandGraph<Parameters>): void {
    if (this.radius === 0) {
      new GPURasterNeighborhood({
        ...this.getNeighborhoodProps(),
        id: this.id,
        radius: 0,
        kernel: this.kernel,
        normalize: true
      }).addToGraph(graph);
      return;
    }

    const pixelCount = this.width * this.height;
    const intermediateValues = createTransientView(
      graph,
      `${this.id}-intermediate-values`,
      'float32',
      pixelCount
    );
    const intermediateValidity = createTransientView(
      graph,
      `${this.id}-intermediate-validity`,
      'uint32',
      pixelCount
    );
    assertRasterStorageBindingFits(graph.device, intermediateValues, `${this.id} intermediate`);
    assertRasterStorageBindingFits(
      graph.device,
      intermediateValidity,
      `${this.id} intermediate validity`
    );

    new GPURasterNeighborhood({
      ...this.getNeighborhoodProps(),
      id: `${this.id}-horizontal`,
      output: intermediateValues,
      outputValidity: intermediateValidity,
      radius: [this.radius, 0],
      kernel: this.kernel,
      normalize: true
    }).addToGraph(graph);
    new GPURasterNeighborhood({
      ...this.getNeighborhoodProps(),
      id: `${this.id}-vertical`,
      input: {
        id: `${this.id}-intermediate`,
        format: 'float32',
        storage: {kind: 'buffer', values: intermediateValues},
        validity: intermediateValidity
      },
      radius: [0, this.radius],
      kernel: this.kernel,
      normalize: true
    }).addToGraph(graph);
  }

  private getNeighborhoodProps(): Omit<GPURasterNeighborhoodProps, 'radius' | 'kernel'> {
    return {
      width: this.width,
      height: this.height,
      input: this.input,
      output: this.output,
      outputValidity: this.outputValidity,
      borderMode: this.borderMode,
      borderValue: this.borderValue,
      noDataPolicy: this.noDataPolicy
    };
  }
}

/** Two-pass, normalized box smoothing with graph-owned float32 and validity scratch. */
export class GPURasterBoxBlur extends GPURasterSeparableSmoothing {
  constructor(props: GPURasterSmoothingProps) {
    validateSmoothingRadius(props.radius, props.id ?? 'gpu-raster-box-blur');
    const kernel = Array.from({length: props.radius * 2 + 1}, () => 1);
    super(props, kernel, 'gpu-raster-box-blur');
  }
}

/** Two-pass, normalized Gaussian smoothing with no CPU round trip or texture conversion. */
export class GPURasterGaussianBlur extends GPURasterSeparableSmoothing {
  readonly sigma: number;

  constructor(props: GPURasterGaussianBlurProps) {
    const id = props.id ?? 'gpu-raster-gaussian-blur';
    validateSmoothingRadius(props.radius, id);
    const sigma = props.sigma ?? Math.max(props.radius / 2, 0.5);
    if (!Number.isFinite(sigma) || sigma <= 0) {
      throw new Error(`${id} sigma must be finite and positive`);
    }
    getRasterFloatLiteral(sigma);
    const kernel = Array.from({length: props.radius * 2 + 1}, (_, coefficientIndex) => {
      const distance = coefficientIndex - props.radius;
      return Math.exp(-(distance * distance) / (2 * sigma * sigma));
    });
    super(props, kernel, 'gpu-raster-gaussian-blur');
    this.sigma = sigma;
  }
}

function getKernelDimensions(props: GPURasterConvolutionProps): readonly [number, number] {
  const id = props.id ?? 'gpu-raster-convolution';
  const length = Array.isArray(props.kernel) ? props.kernel.length : 0;
  let width = props.kernelWidth;
  let height = props.kernelHeight;
  if (width === undefined && height === undefined) {
    width = Math.sqrt(length);
    height = width;
  } else if (width === undefined) {
    width = length / (height ?? 1);
  } else if (height === undefined) {
    height = length / width;
  }
  if (
    width === undefined ||
    height === undefined ||
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width <= 0 ||
    height <= 0 ||
    width % 2 === 0 ||
    height % 2 === 0 ||
    width * height !== length
  ) {
    throw new Error(`${id} kernel dimensions must be odd and match every coefficient`);
  }
  return [width, height];
}

function validateSmoothingRadius(radius: number, id: string): void {
  if (!Number.isSafeInteger(radius) || radius < 0 || radius > 8) {
    throw new Error(`${id} smoothing radius must be an integer from zero through eight`);
  }
}
