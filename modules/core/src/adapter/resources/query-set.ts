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
   * timestamp - query the GPU timestamp counter. Timestamp queries are available if the
   * `timestamp-query` feature is present.
   */
  type: 'occlusion' | 'timestamp';
  /** The number of queries managed by the query set */
  count: number;
};

/** Immutable QuerySet object */
export abstract class QuerySet extends Resource<QuerySetProps> {
  get [Symbol.toStringTag](): string {
    return 'QuerySet';
  }

  constructor(device: Device, props: QuerySetProps) {
    super(device, props, QuerySet.defaultProps);
  }

  static override defaultProps: Required<QuerySetProps> = {
    ...Resource.defaultProps,
    type: undefined!,
    count: undefined!
  };

  /**
   * Returns true if the requested result has been captured and can be read without blocking.
   * Backends may implement this conservatively.
   */
  abstract isResultAvailable(queryIndex?: number): boolean;

  /** Reads query results as 64-bit values. */
  abstract readResults(options?: {
    firstQuery?: number;
    queryCount?: number;
  }): Promise<bigint[]>;

  /**
   * Reads a timestamp duration in milliseconds between a begin and end query index.
   * Portable duration profiling requires adjacent indices that identify one logical pair.
   */
  abstract readTimestampDuration(beginIndex: number, endIndex: number): Promise<number>;
}
