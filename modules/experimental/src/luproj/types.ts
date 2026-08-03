// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Two coordinates in a source or destination coordinate reference system. */
export type ProjectionCoordinates = readonly [number, number];

/** Inclusive source bounds ordered as `[minX, minY, maxX, maxY]`. */
export type ProjectionBounds = readonly [number, number, number, number];

/** Polynomial degrees supported by the portable WebGPU projection evaluator. */
export type ProjectionDegree = 1 | 2 | 3;

/**
 * Existing projection-library interface accepted without introducing a runtime dependency.
 *
 * Mutable arrays deliberately match `@math.gl/proj4` and other existing JavaScript projection
 * libraries. The compiler always supplies a fresh array and never retains the returned array.
 */
export type ProjectionProvider =
  | ((coordinates: number[]) => number[])
  | {
      project: (coordinates: number[]) => number[];
      unproject?: (coordinates: number[]) => number[];
    };

/** One error-bounded local approximation over an axis-aligned source patch. */
export type ProjectionPatch = {
  /** Stable zero-based index into the containing plan and optional GPU patch-ID column. */
  readonly id: number;
  /** Inclusive source-coordinate domain covered by this approximation. */
  readonly bounds: ProjectionBounds;
  /** Binary64 source origin subtracted before coordinates are narrowed to float32. */
  readonly sourceOrigin: ProjectionCoordinates;
  /** Half-width and half-height used to normalize local coordinates to approximately `[-1, 1]`. */
  readonly sourceScale: ProjectionCoordinates;
  /** Binary64 destination projection of the source origin. */
  readonly destinationOrigin: ProjectionCoordinates;
  /** Float32 coefficients ordered as `1, x, y, x², xy, y², x³, x²y, xy², y³`. */
  readonly coefficientsX: Float32Array;
  /** Float32 coefficients using the same triangular ordering as {@link coefficientsX}. */
  readonly coefficientsY: Float32Array;
  /** Maximum total degree retained by both coefficient vectors. */
  readonly degree: ProjectionDegree;
  /** Largest Euclidean destination error observed on the independent validation grid. */
  readonly maxError: number;
};

/** Provider-independent projection program consumed by CPU and GPU evaluators. */
export type ProjectionPlan = {
  /** Inclusive source-coordinate domain covered collectively by the patches. */
  readonly bounds: ProjectionBounds;
  /** Binary64 destination origin shared by float32 GPU output rows. */
  readonly destinationOrigin: ProjectionCoordinates;
  /** Error-bounded patches in deterministic depth-first source-quadtree order. */
  readonly patches: readonly ProjectionPatch[];
  /** Polynomial degree requested when compiling the plan. */
  readonly degree: ProjectionDegree;
  /** Requested maximum destination error, expressed in destination coordinate units. */
  readonly tolerance: number;
  /** Largest sampled float32 output error, including rounding relative to the shared origin. */
  readonly maxError: number;
};

/** Controls adaptive approximation of an arbitrary CPU projection provider. */
export type CompileProjectionPlanOptions = {
  /** Projection callback or existing object exposing `project(number[])`. */
  projection: ProjectionProvider;
  /** Inclusive source-coordinate bounds ordered as `[minX, minY, maxX, maxY]`. */
  bounds: ProjectionBounds;
  /** Maximum Euclidean destination error. Defaults to `0.01`. */
  tolerance?: number;
  /** Maximum quadtree subdivision depth. Defaults to `8`. */
  maxDepth?: number;
  /** Polynomial degree. Defaults to `3`. */
  degree?: ProjectionDegree;
  /** Number of Chebyshev fitting samples along each source axis. Defaults to `7`. */
  sampleCount?: number;
  /** Safety cap on accepted source patches. Defaults to `4096`. */
  maxPatches?: number;
};
