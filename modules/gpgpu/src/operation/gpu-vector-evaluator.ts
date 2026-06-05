// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '@luma.gl/core';
import {GPUVector, type GPUVectorFormat} from '@luma.gl/tables';
import {GPUDataEvaluator, type GPUDataEvaluatorEvaluateOptions} from './gpu-data-evaluator';

/** Options for materializing one {@link GPUVectorEvaluator}. */
export type GPUVectorEvaluatorEvaluateOptions = GPUDataEvaluatorEvaluateOptions;

/** Options for constructing one vector evaluator from ordered chunk evaluators. */
export type GPUVectorEvaluatorFromGPUDataEvaluatorsOptions = {
  /** Optional debug name used by {@link GPUVectorEvaluator.toString}. */
  id?: string;
  /** Optional memory format preserved for the materialized `GPUVector`. */
  format?: GPUVectorFormat;
};

/** Callback used by {@link GPUVectorEvaluator.mapGPUData}. */
export type GPUVectorEvaluatorMapGPUDataTransform = (
  evaluator: GPUDataEvaluator,
  chunkIndex: number
) => GPUDataEvaluator;

/** Properties used to construct one {@link GPUVectorEvaluator}. */
export type GPUVectorEvaluatorProps = {
  /** Optional debug name used by {@link GPUVectorEvaluator.toString}. */
  id?: string;
  /** Ordered lazy GPUData transforms preserved as GPUVector chunks. */
  gpuDataEvaluators: readonly GPUDataEvaluator[];
  /** Existing GPUVector resource wrapped by this evaluator, when already materialized. */
  gpuVector?: GPUVector;
  /** Optional memory format preserved for GPUVector interop. */
  format?: GPUVectorFormat;
};

/** Input accepted by helpers that normalize `GPUVector` resources into vector evaluators. */
export type GPUVectorEvaluatorInput = GPUVectorEvaluator | GPUVector;

/**
 * Lazy GPUVector transform that preserves ordered GPUData chunk boundaries.
 *
 * @remarks
 * Use {@link GPUDataEvaluator} for one incoming GPUData chunk. Use this class
 * when one logical GPUVector should evaluate the same transform independently
 * over every GPUData chunk without packing them together.
 */
export class GPUVectorEvaluator {
  /** Ordered lazy GPUData transforms preserved as GPUVector chunks. */
  readonly gpuDataEvaluators: readonly GPUDataEvaluator[];
  /** Optional memory format preserved for GPUVector interop. */
  readonly format?: GPUVectorFormat;
  /** Total logical rows across preserved GPUData chunks. */
  readonly length: number;
  /** Optional debug id or source GPUVector name. */
  readonly id?: string;

  private _gpuVector?: GPUVector;
  private readonly _ownsGPUDataEvaluators: boolean;
  private _destroyed = false;

  /**
   * Creates one lazy vector evaluator over an existing fixed-width `GPUVector`.
   *
   * @param vector - Ordered `GPUData` chunks to preserve.
   * @returns One evaluator that borrows the existing vector chunks.
   */
  static fromGPUVector(vector: GPUVector): GPUVectorEvaluator {
    if (vector.bufferLayout) {
      throw new Error(
        `GPUVectorEvaluator.fromGPUVector() does not accept interleaved vector "${vector.name}"`
      );
    }
    if (vector.data.length === 0) {
      throw new Error(`GPUVectorEvaluator.fromGPUVector() requires GPUData for "${vector.name}"`);
    }

    return new GPUVectorEvaluator({
      id: vector.name,
      gpuDataEvaluators: vector.data.map(data =>
        GPUDataEvaluator.fromGPUData(data, {id: vector.name})
      ),
      gpuVector: vector,
      format: vector.format
    });
  }

  /**
   * Creates one lazy vector evaluator from already-built chunk evaluators.
   *
   * @param gpuDataEvaluators - Ordered chunk evaluators to preserve.
   * @param options - Optional debug id and output format.
   * @returns One evaluator that materializes the chunk evaluators as a `GPUVector`.
   */
  static fromGPUDataEvaluators(
    gpuDataEvaluators: readonly GPUDataEvaluator[],
    options: GPUVectorEvaluatorFromGPUDataEvaluatorsOptions = {}
  ): GPUVectorEvaluator {
    return new GPUVectorEvaluator({
      id: options.id,
      gpuDataEvaluators,
      format: options.format
    });
  }

  /**
   * Creates one lazy vector evaluator from ordered chunk evaluators.
   *
   * @param props - Ordered chunk evaluators and optional borrowed vector metadata.
   */
  constructor({id, gpuDataEvaluators, gpuVector, format}: GPUVectorEvaluatorProps) {
    if (gpuDataEvaluators.length === 0) {
      throw new Error('GPUVectorEvaluator requires at least one GPUData evaluator');
    }
    validateMatchingGPUDataEvaluators(gpuDataEvaluators);

    this.id = id;
    this.gpuDataEvaluators = gpuDataEvaluators;
    this.format = format ?? gpuDataEvaluators[0].format;
    this.length = gpuDataEvaluators.reduce((length, evaluator) => length + evaluator.length, 0);
    this._gpuVector = gpuVector;
    this._ownsGPUDataEvaluators = !gpuVector;
  }

  /** Whether a `GPUVector` has been materialized for this evaluator. */
  get evaluated(): boolean {
    return Boolean(this._gpuVector);
  }

  /** Materialized `GPUVector` resource. */
  get gpuVector(): GPUVector {
    if (!this._gpuVector) {
      throw new Error(`${this} not evaluated`);
    }
    return this._gpuVector;
  }

  /**
   * Applies one lazy transform independently to every preserved `GPUData` chunk.
   *
   * @param transform - Callback that returns the transformed evaluator for each chunk.
   * @returns One vector evaluator with the same chunk order and boundaries.
   */
  mapGPUData(transform: GPUVectorEvaluatorMapGPUDataTransform): GPUVectorEvaluator {
    return GPUVectorEvaluator.fromGPUDataEvaluators(
      this.gpuDataEvaluators.map((evaluator, chunkIndex) => transform(evaluator, chunkIndex)),
      {id: this.id}
    );
  }

  /**
   * Materializes every chunk evaluator and returns one chunk-preserving `GPUVector`.
   *
   * @param device - Device used to materialize every chunk evaluator.
   * @param options - Output view metadata for each materialized chunk.
   * @returns One `GPUVector` with the original ordered chunk boundaries.
   */
  async evaluate(
    device: Device,
    options: GPUVectorEvaluatorEvaluateOptions = {}
  ): Promise<GPUVector> {
    if (this._destroyed) {
      throw new Error(`GPUVectorEvaluator ${this} already destroyed`);
    }
    if (this._gpuVector) {
      return this._gpuVector;
    }

    const gpuVectors = await Promise.all(
      this.gpuDataEvaluators.map(evaluator => evaluator.evaluate(device, options))
    );
    const firstVector = gpuVectors[0];
    const data = gpuVectors.map(getSingleGPUVectorData);
    const format = options.format ?? this.format ?? firstVector.format;
    this._gpuVector = new GPUVector({
      type: 'data',
      name: options.name ?? this.id ?? 'vector',
      format,
      data,
      stride: firstVector.stride,
      byteStride: firstVector.byteStride,
      rowByteLength: firstVector.rowByteLength,
      bufferLayout: firstVector.bufferLayout
    });
    return this._gpuVector;
  }

  /** Releases cached GPU resources owned through child `GPUDataEvaluator` instances. */
  destroy(): void {
    if (this._ownsGPUDataEvaluators) {
      for (const evaluator of this.gpuDataEvaluators) {
        evaluator.destroy();
      }
    }
    this._gpuVector = undefined;
    this._destroyed = true;
  }

  /** Returns the debug id or class name. */
  toString(): string {
    return this.id ?? this.constructor.name;
  }
}

/**
 * Returns one vector evaluator, adapting `GPUVector` inputs when needed.
 *
 * @param input - Existing evaluator or fixed-width `GPUVector`.
 * @returns One `GPUVectorEvaluator` that preserves ordered chunk boundaries.
 */
export function getGPUVectorEvaluator(input: GPUVectorEvaluatorInput): GPUVectorEvaluator {
  return input instanceof GPUVectorEvaluator ? input : GPUVectorEvaluator.fromGPUVector(input);
}

function validateMatchingGPUDataEvaluators(gpuDataEvaluators: readonly GPUDataEvaluator[]): void {
  const firstEvaluator = gpuDataEvaluators[0];
  for (const evaluator of gpuDataEvaluators.slice(1)) {
    if (
      evaluator.type !== firstEvaluator.type ||
      evaluator.size !== firstEvaluator.size ||
      evaluator.normalized !== firstEvaluator.normalized ||
      evaluator.format !== firstEvaluator.format
    ) {
      throw new Error('GPUVectorEvaluator requires matching GPUData evaluator layouts');
    }
  }
}

function getSingleGPUVectorData(vector: GPUVector) {
  const [data, ...remainingData] = vector.data;
  if (!data || remainingData.length > 0) {
    throw new Error(`GPUVectorEvaluator requires one GPUData chunk for "${vector.name}"`);
  }
  return data;
}
