// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Copyright (c) vis.gl contributors

/** A draft glTF 2.1 implicit shape definition. */
export type GLTFShape = {
  /** Shape discriminator. */
  type:
    | 'box'
    | 'capsule'
    | 'cylinder'
    | 'plane'
    | 'sphere'
    | 'ellipsoid region'
    | 's2'
    | 'cylinder region'
    | string;
  /** Box parameters, when `type` is `box`. */
  box?: {size: [number, number, number]};
  /** Capsule parameters, when `type` is `capsule`. */
  capsule?: {height: number; radiusBottom?: number; radiusTop?: number};
  /** Cylinder parameters, when `type` is `cylinder`. */
  cylinder?: {height: number; radiusBottom?: number; radiusTop?: number};
  /** Plane parameters, when `type` is `plane`. */
  plane?: {sizeX?: number; sizeZ?: number};
  /** Sphere parameters, when `type` is `sphere`. */
  sphere?: {radius: number};
  name?: string;
  extensions?: Record<string, unknown>;
  extras?: unknown;
};

/** A node bounding-volume reference in draft glTF 2.1. */
export type GLTFBoundingVolume = {
  /** Index into the glTF `shapes` array. */
  shape: number;
  /** Optional local transform applied to the referenced shape. */
  matrix?: number[];
  /** Optional local translation, mutually exclusive with `matrix`. */
  translation?: [number, number, number];
  /** Optional local quaternion rotation, mutually exclusive with `matrix`. */
  rotation?: [number, number, number, number];
  /** Optional local scale, mutually exclusive with `matrix`. */
  scale?: [number, number, number];
  extensions?: Record<string, unknown>;
  extras?: unknown;
};
