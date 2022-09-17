import Resource from './resource';

/**
 * Asynchronous queries for different kinds of information
 */
export default class Query extends Resource {
  readonly handle: WebGLQuery;

  static isSupported(gl: WebGLRenderingContext, opts?: any[]): boolean;
  constructor(gl: WebGLRenderingContext, opts?: {});
  beginTimeElapsedQuery(): this;
  beginOcclusionQuery({conservative}?: {conservative?: boolean}): this;
  beginTransformFeedbackQuery(): this;
  begin(target: any): this;
  end(): this;
  isResultAvailable(): any;
  isTimerDisjoint(): any;
  getResult(): any;
  getTimerMilliseconds(): number;
  createPoll(limit?: number): any;
}
