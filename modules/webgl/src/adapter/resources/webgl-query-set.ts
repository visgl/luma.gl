// WebGL2 Query (also handles disjoint timer extensions)
import {QuerySet, QuerySetProps} from '@luma.gl/core';
import {GL} from '@luma.gl/constants';
import {WebGLDevice} from '../webgl-device';

/**
 * Asynchronous queries for different kinds of information
 */
export class WEBGLQuerySet extends QuerySet {
  device: WebGLDevice;
  handle: WebGLQuery;

  target: number | null = null;
  _queryPending = false;
  _pollingPromise: Promise<any> | null = null;

  override get [Symbol.toStringTag](): string {
    return 'Query';
  }

  // Create a query class
  constructor(device: WebGLDevice, props: QuerySetProps) {
    super(device, props);
    this.device = device;

    if (props.count > 1) {
      throw new Error('WebGL QuerySet can only have one value');
    }

    this.handle = this.device.gl.createQuery();
    Object.seal(this);
  }

  override destroy() {
    this.device.gl.deleteQuery(this.handle);
  }

  // FOR RENDER PASS AND COMMAND ENCODER

  /**
   * Shortcut for timer query (dependent on extension in both WebGL1 and 2)
   * Measures GPU time delta between this call and a matching `end` call in the
   * GPU instruction stream.
   */
  beginTimestampQuery(): void {
    return this._begin(GL.TIME_ELAPSED_EXT);
  }

  endTimestampQuery(): void {
    this._end();
  }

  // Shortcut for occlusion queries
  beginOcclusionQuery(options?: {conservative?: boolean}): void {
    return this._begin(
      options?.conservative ? GL.ANY_SAMPLES_PASSED_CONSERVATIVE : GL.ANY_SAMPLES_PASSED
    );
  }

  endOcclusionQuery() {
    this._end();
  }

  // Shortcut for transformFeedbackQuery
  beginTransformFeedbackQuery(): void {
    return this._begin(GL.TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN);
  }

  endTransformFeedbackQuery(): void {
    this._end();
  }

  async resolveQuery(): Promise<bigint[]> {
    const value = await this.pollQuery();
    return [value];
  }

  // PRIVATE METHODS

  /**
   * Due to OpenGL API limitations, after calling `begin()` on one Query
   * instance, `end()` must be called on that same instance before
   * calling `begin()` on another query. While there can be multiple
   * outstanding queries representing disjoint `begin()`/`end()` intervals.
   * It is not possible to interleave or overlap `begin` and `end` calls.
   */
  protected _begin(target: number): void {
    // Don't start a new query if one is already active.
    if (this._queryPending) {
      return;
    }

    this.target = target;
    this.device.gl.beginQuery(this.target, this.handle);

    return;
  }

  // ends the current query
  protected _end(): void {
    // Can't end a new query if the last one hasn't been resolved.
    if (this._queryPending) {
      return;
    }

    if (this.target) {
      this.device.gl.endQuery(this.target);
      this.target = null;
      this._queryPending = true;
    }
    return;
  }

  // Returns true if the query result is available
  isResultAvailable(): boolean {
    if (!this._queryPending) {
      return false;
    }

    const resultAvailable = this.device.gl.getQueryParameter(
      this.handle,
      GL.QUERY_RESULT_AVAILABLE
    );
    if (resultAvailable) {
      this._queryPending = false;
    }
    return resultAvailable;
  }

  // Timing query is disjoint, i.e. results are invalid
  isTimerDisjoint(): boolean {
    return this.device.gl.getParameter(GL.GPU_DISJOINT_EXT);
  }

  // Returns query result.
  getResult(): any {
    return this.device.gl.getQueryParameter(this.handle, GL.QUERY_RESULT);
  }

  // Returns the query result, converted to milliseconds to match JavaScript conventions.
  getTimerMilliseconds() {
    return this.getResult() / 1e6;
  }

  // Polls the query
  pollQuery(limit: number = Number.POSITIVE_INFINITY): Promise<any> {
    if (this._pollingPromise) {
      return this._pollingPromise;
    }

    let counter = 0;

    this._pollingPromise = new Promise((resolve, reject) => {
      const poll = () => {
        if (this.isResultAvailable()) {
          resolve(this.getResult());
          this._pollingPromise = null;
        } else if (counter++ > limit) {
          reject('Timed out');
          this._pollingPromise = null;
        } else {
          requestAnimationFrame(poll);
        }
      };

      requestAnimationFrame(poll);
    });

    return this._pollingPromise;
  }
}
