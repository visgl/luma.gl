// WebGL2 QuerySet (also handles disjoint timer extensions)
import {QuerySet, QuerySetProps} from '@luma.gl/core';
import {GL} from '@luma.gl/constants';
import {WebGLDevice} from '../webgl-device';

type WebGLPendingQuery = {
  handle: WebGLQuery;
  promise: Promise<bigint> | null;
  result: bigint | null;
  disjoint: boolean;
};

type WebGLTimestampPair = {
  activeQuery: WebGLPendingQuery | null;
  completedQueries: WebGLPendingQuery[];
};

/**
 * Asynchronous queries for different kinds of information
 */
export class WEBGLQuerySet extends QuerySet {
  readonly device: WebGLDevice;
  readonly handle: WebGLQuery | null;

  protected _timestampPairs: WebGLTimestampPair[] = [];
  protected _occlusionQuery: WebGLPendingQuery | null = null;
  protected _occlusionActive = false;

  override get [Symbol.toStringTag](): string {
    return 'QuerySet';
  }

  constructor(device: WebGLDevice, props: QuerySetProps) {
    super(device, props);
    this.device = device;

    if (props.type === 'timestamp') {
      if (props.count < 2) {
        throw new Error('Timestamp QuerySet requires at least two query slots');
      }
      this._timestampPairs = new Array(Math.ceil(props.count / 2))
        .fill(null)
        .map(() => ({activeQuery: null, completedQueries: []}));
      this.handle = null;
    } else {
      if (props.count > 1) {
        throw new Error('WebGL occlusion QuerySet can only have one value');
      }
      const handle = this.device.gl.createQuery();
      if (!handle) {
        throw new Error('WebGL query not supported');
      }
      this.handle = handle;
    }

    Object.seal(this);
  }

  override destroy(): void {
    if (this.destroyed) {
      return;
    }

    if (this.handle) {
      this.device.gl.deleteQuery(this.handle);
    }

    for (const pair of this._timestampPairs) {
      if (pair.activeQuery) {
        this.device.gl.deleteQuery(pair.activeQuery.handle);
      }
      for (const query of pair.completedQueries) {
        this.device.gl.deleteQuery(query.handle);
      }
    }

    if (this._occlusionQuery) {
      this.device.gl.deleteQuery(this._occlusionQuery.handle);
    }

    this.destroyResource();
  }

  isResultAvailable(queryIndex?: number): boolean {
    if (this.props.type === 'timestamp') {
      if (queryIndex === undefined) {
        return this._timestampPairs.some((_, pairIndex) =>
          this._isTimestampPairAvailable(pairIndex)
        );
      }
      return this._isTimestampPairAvailable(this._getTimestampPairIndex(queryIndex));
    }

    if (!this._occlusionQuery) {
      return false;
    }

    return this._pollQueryAvailability(this._occlusionQuery);
  }

  async readResults(options?: {firstQuery?: number; queryCount?: number}): Promise<bigint[]> {
    const firstQuery = options?.firstQuery || 0;
    const queryCount = options?.queryCount || this.props.count - firstQuery;
    this._validateRange(firstQuery, queryCount);

    if (this.props.type === 'timestamp') {
      const results = new Array<bigint>(queryCount).fill(0n);
      const startPairIndex = Math.floor(firstQuery / 2);
      const endPairIndex = Math.floor((firstQuery + queryCount - 1) / 2);

      for (let pairIndex = startPairIndex; pairIndex <= endPairIndex; pairIndex++) {
        const duration = await this._consumeTimestampPairResult(pairIndex);
        const beginSlot = pairIndex * 2;
        const endSlot = beginSlot + 1;

        if (beginSlot >= firstQuery && beginSlot < firstQuery + queryCount) {
          results[beginSlot - firstQuery] = 0n;
        }
        if (endSlot >= firstQuery && endSlot < firstQuery + queryCount) {
          results[endSlot - firstQuery] = duration;
        }
      }

      return results;
    }

    if (!this._occlusionQuery) {
      throw new Error('Occlusion query has not been started');
    }

    return [await this._consumeQueryResult(this._occlusionQuery)];
  }

  async readTimestampDuration(beginIndex: number, endIndex: number): Promise<number> {
    if (this.props.type !== 'timestamp') {
      throw new Error('Timestamp durations require a timestamp QuerySet');
    }
    if (beginIndex < 0 || endIndex >= this.props.count || endIndex <= beginIndex) {
      throw new Error('Timestamp duration range is out of bounds');
    }
    if (beginIndex % 2 !== 0 || endIndex !== beginIndex + 1) {
      throw new Error('WebGL timestamp durations require adjacent even/odd query indices');
    }

    const result = await this._consumeTimestampPairResult(this._getTimestampPairIndex(beginIndex));
    return Number(result) / 1e6;
  }

  beginOcclusionQuery(): void {
    if (this.props.type !== 'occlusion') {
      throw new Error('Occlusion queries require an occlusion QuerySet');
    }
    if (!this.handle) {
      throw new Error('WebGL occlusion query is not available');
    }
    if (this._occlusionActive) {
      throw new Error('Occlusion query is already active');
    }

    this.device.gl.beginQuery(GL.ANY_SAMPLES_PASSED, this.handle);
    this._occlusionQuery = {
      handle: this.handle,
      promise: null,
      result: null,
      disjoint: false
    };
    this._occlusionActive = true;
  }

  endOcclusionQuery(): void {
    if (!this._occlusionActive) {
      throw new Error('Occlusion query is not active');
    }

    this.device.gl.endQuery(GL.ANY_SAMPLES_PASSED);
    this._occlusionActive = false;
  }

  writeTimestamp(queryIndex: number): void {
    if (this.props.type !== 'timestamp') {
      throw new Error('Timestamp writes require a timestamp QuerySet');
    }

    const pairIndex = this._getTimestampPairIndex(queryIndex);
    const pair = this._timestampPairs[pairIndex];

    if (queryIndex % 2 === 0) {
      if (pair.activeQuery) {
        throw new Error('Timestamp query pair is already active');
      }

      const handle = this.device.gl.createQuery();
      if (!handle) {
        throw new Error('WebGL query not supported');
      }

      const query: WebGLPendingQuery = {
        handle,
        promise: null,
        result: null,
        disjoint: false
      };

      this.device.gl.beginQuery(GL.TIME_ELAPSED_EXT, handle);
      pair.activeQuery = query;
      return;
    }

    if (!pair.activeQuery) {
      throw new Error('Timestamp query pair was ended before it was started');
    }

    this.device.gl.endQuery(GL.TIME_ELAPSED_EXT);
    pair.completedQueries.push(pair.activeQuery);
    pair.activeQuery = null;
  }

  protected _validateRange(firstQuery: number, queryCount: number): void {
    if (firstQuery < 0 || queryCount < 0 || firstQuery + queryCount > this.props.count) {
      throw new Error('Query read range is out of bounds');
    }
  }

  protected _getTimestampPairIndex(queryIndex: number): number {
    if (queryIndex < 0 || queryIndex >= this.props.count) {
      throw new Error('Query index is out of bounds');
    }

    return Math.floor(queryIndex / 2);
  }

  protected _isTimestampPairAvailable(pairIndex: number): boolean {
    const pair = this._timestampPairs[pairIndex];
    if (!pair || pair.completedQueries.length === 0) {
      return false;
    }

    return this._pollQueryAvailability(pair.completedQueries[0]);
  }

  protected _pollQueryAvailability(query: WebGLPendingQuery): boolean {
    if (query.result !== null || query.disjoint) {
      return true;
    }

    const resultAvailable = this.device.gl.getQueryParameter(
      query.handle,
      GL.QUERY_RESULT_AVAILABLE
    );
    if (!resultAvailable) {
      return false;
    }

    const isDisjoint = Boolean(this.device.gl.getParameter(GL.GPU_DISJOINT_EXT));
    query.disjoint = isDisjoint;
    query.result = isDisjoint
      ? 0n
      : BigInt(this.device.gl.getQueryParameter(query.handle, GL.QUERY_RESULT));
    return true;
  }

  protected async _consumeTimestampPairResult(pairIndex: number): Promise<bigint> {
    const pair = this._timestampPairs[pairIndex];
    if (!pair || pair.completedQueries.length === 0) {
      throw new Error('Timestamp query pair has no completed result');
    }

    const query = pair.completedQueries.shift()!;

    try {
      return await this._consumeQueryResult(query);
    } finally {
      this.device.gl.deleteQuery(query.handle);
    }
  }

  protected _consumeQueryResult(query: WebGLPendingQuery): Promise<bigint> {
    if (query.promise) {
      return query.promise;
    }

    query.promise = new Promise((resolve, reject) => {
      const poll = () => {
        if (!this._pollQueryAvailability(query)) {
          requestAnimationFrame(poll);
          return;
        }

        query.promise = null;
        if (query.disjoint) {
          reject(new Error('GPU timestamp query was invalidated by a disjoint event'));
        } else {
          resolve(query.result || 0n);
        }
      };

      poll();
    });

    return query.promise;
  }
}
