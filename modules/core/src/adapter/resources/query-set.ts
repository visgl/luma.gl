// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Device} from '../device';
import {Resource, ResourceProps} from './resource';

/**
 * Properties for creating a QuerySet
 * - 'timestamp' - query the GPU timestamp counter at the start and end of render passes
 *   timestamp queries are available if the 'timestamp-query' feature is present.
 * - 'occlusion' - query the number of fragment samples that pass all per-fragment tests for a set of drawing commands
 *   including scissor, sample mask, alpha to coverage, stencil, and depth tests
 */
export type QuerySetProps = ResourceProps & {
  /**
   * The type of query set
   * occlusion - query the number of fragment samples that pass all the per-fragment tests for a set of drawing commands, including scissor, sample mask, alpha to coverage, stencil, and depth tests
   * timestamp - query the GPU timestamp counter at the start and end of render passes
   */
  type: 'occlusion' | 'timestamp';
  /** The number of queries managed by the query set */
  count: number;
};

/** Immutable QuerySet object */
export abstract class QuerySet extends Resource<QuerySetProps> {
  static override defaultProps: Required<QuerySetProps> = {
    ...Resource.defaultProps,
    type: undefined!,
    count: undefined!
  };

  get [Symbol.toStringTag](): string {
    return 'QuerySet';
  }

  constructor(device: Device, props: QuerySetProps) {
    super(device, props, QuerySet.defaultProps);
  }
}
