// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Options and callbacks used by {@link CanvasObserver}. */
type CanvasObserverProps = {
  /** HTML canvas element whose DOM lifecycle should be observed. */
  canvas?: HTMLCanvasElement;
  /** Whether to poll for canvas position changes. */
  trackPosition: boolean;
  /** ResizeObserver box type passed to `observe()`. */
  resizeObserverBox: ResizeObserverBoxOptions;
  /** Called with ResizeObserver entries for the observed canvas. */
  onResize: (entries: ResizeObserverEntry[]) => void;
  /** Called with IntersectionObserver entries for the observed canvas. */
  onIntersection: (entries: IntersectionObserverEntry[]) => void;
  /** Called when the window device pixel ratio may have changed. */
  onDevicePixelRatioChange: () => void;
  /** Called while canvas position tracking is enabled. */
  onPositionChange: () => void;
};

/**
 * Internal DOM observer orchestration for HTML canvas surfaces.
 *
 * @remarks
 * CanvasSurface owns the tracked state and device callback dispatch. This helper only manages
 * browser observers, timers, and polling loops, then reports events through callbacks.
 */
export class CanvasObserver {
  /** Observer options and event callbacks. */
  readonly props: CanvasObserverProps;

  private _resizeObserver: ResizeObserver | undefined;
  private _intersectionObserver: IntersectionObserver | undefined;
  private _observeDevicePixelRatioTimeout: ReturnType<typeof setTimeout> | null = null;
  private _observeDevicePixelRatioMediaQuery: MediaQueryList | null = null;
  private readonly _handleDevicePixelRatioChange = () => this._refreshDevicePixelRatio();
  private _trackPositionInterval: ReturnType<typeof setInterval> | null = null;
  private _started = false;

  /** Whether the DOM observers and polling loops have been started. */
  get started(): boolean {
    return this._started;
  }

  /**
   * Creates an observer coordinator for one HTML canvas.
   *
   * @param props - Observer options and event callbacks.
   */
  constructor(props: CanvasObserverProps) {
    this.props = props;
  }

  /** Starts DOM observation and optional position polling. */
  start(): void {
    if (this._started || !this.props.canvas) {
      return;
    }

    this._started = true;
    this._intersectionObserver ||= new IntersectionObserver(entries =>
      this.props.onIntersection(entries)
    );
    this._resizeObserver ||= new ResizeObserver(entries => this.props.onResize(entries));

    this._intersectionObserver.observe(this.props.canvas);
    const box = this.props.resizeObserverBox;
    try {
      this._resizeObserver.observe(this.props.canvas, {box});
    } catch {
      this._resizeObserver.observe(this.props.canvas, {box: 'content-box'});
    }

    this._observeDevicePixelRatioTimeout = setTimeout(() => this._refreshDevicePixelRatio(), 0);

    if (this.props.trackPosition) {
      this._trackPosition();
    }
  }

  /** Stops DOM observation, media-query listeners, and position polling. */
  stop(): void {
    if (!this._started) {
      return;
    }

    this._started = false;

    if (this._observeDevicePixelRatioTimeout) {
      clearTimeout(this._observeDevicePixelRatioTimeout);
      this._observeDevicePixelRatioTimeout = null;
    }

    if (this._observeDevicePixelRatioMediaQuery) {
      this._observeDevicePixelRatioMediaQuery.removeEventListener(
        'change',
        this._handleDevicePixelRatioChange
      );
      this._observeDevicePixelRatioMediaQuery = null;
    }

    if (this._trackPositionInterval) {
      clearInterval(this._trackPositionInterval);
      this._trackPositionInterval = null;
    }

    this._resizeObserver?.disconnect();
    this._intersectionObserver?.disconnect();
  }

  /** Reports the current device pixel ratio and arms the media query for its next change. */
  private _refreshDevicePixelRatio(): void {
    if (!this._started) {
      return;
    }

    this.props.onDevicePixelRatioChange();

    this._observeDevicePixelRatioMediaQuery?.removeEventListener(
      'change',
      this._handleDevicePixelRatioChange
    );
    this._observeDevicePixelRatioMediaQuery = matchMedia(
      `(resolution: ${window.devicePixelRatio}dppx)`
    );
    this._observeDevicePixelRatioMediaQuery.addEventListener(
      'change',
      this._handleDevicePixelRatioChange,
      {once: true}
    );
  }

  /**
   * Starts periodic position callbacks while the observer remains active.
   *
   * @param intervalMs - Poll interval in milliseconds.
   */
  private _trackPosition(intervalMs: number = 100): void {
    if (this._trackPositionInterval) {
      return;
    }

    this._trackPositionInterval = setInterval(() => {
      if (!this._started) {
        if (this._trackPositionInterval) {
          clearInterval(this._trackPositionInterval);
          this._trackPositionInterval = null;
        }
      } else {
        this.props.onPositionChange();
      }
    }, intervalMs);
  }
}
