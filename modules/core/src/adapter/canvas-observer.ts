// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

type CanvasObserverProps = {
  canvas?: HTMLCanvasElement;
  trackPosition: boolean;
  onResize: (entries: ResizeObserverEntry[]) => void;
  onIntersection: (entries: IntersectionObserverEntry[]) => void;
  onDevicePixelRatioChange: () => void;
  onPositionChange: () => void;
};

/**
 * Internal DOM observer orchestration for HTML canvas surfaces.
 *
 * CanvasSurface owns the tracked state and device callback dispatch. This helper only manages
 * browser observers, timers, and polling loops, then reports events through callbacks.
 */
export class CanvasObserver {
  readonly props: CanvasObserverProps;

  private _resizeObserver: ResizeObserver | undefined;
  private _intersectionObserver: IntersectionObserver | undefined;
  private _observeDevicePixelRatioTimeout: ReturnType<typeof setTimeout> | null = null;
  private _observeDevicePixelRatioMediaQuery: MediaQueryList | null = null;
  private readonly _handleDevicePixelRatioChange = () => this._refreshDevicePixelRatio();
  private _trackPositionInterval: ReturnType<typeof setInterval> | null = null;
  private _started = false;

  get started(): boolean {
    return this._started;
  }

  constructor(props: CanvasObserverProps) {
    this.props = props;
  }

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
    try {
      this._resizeObserver.observe(this.props.canvas, {box: 'device-pixel-content-box'});
    } catch {
      this._resizeObserver.observe(this.props.canvas, {box: 'content-box'});
    }

    this._observeDevicePixelRatioTimeout = setTimeout(() => this._refreshDevicePixelRatio(), 0);

    if (this.props.trackPosition) {
      this._trackPosition();
    }
  }

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
