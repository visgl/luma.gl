// luma.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type OrbitPosition = [number, number, number];

export type OrbitControlsProps = {
  target?: Readonly<OrbitPosition>;
  distance?: number;
  yaw?: number;
  pitch?: number;
  minDistance?: number;
  maxDistance?: number;
  minPitch?: number;
  maxPitch?: number;
  rotateSpeed?: number;
  zoomSpeed?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
};

type ResolvedOrbitControlsProps = Required<OrbitControlsProps>;

const DEFAULT_PROPS: ResolvedOrbitControlsProps = {
  target: [0, 0, 0],
  distance: 10,
  yaw: 0,
  pitch: 0.25,
  minDistance: 1,
  maxDistance: 100,
  minPitch: -Math.PI / 2 + 0.01,
  maxPitch: Math.PI / 2 - 0.01,
  rotateSpeed: 0.006,
  zoomSpeed: 0.001,
  autoRotate: false,
  autoRotateSpeed: 0.1
};

/**
 * Pointer orbit, wheel zoom, and optional automatic rotation controls for an HTML canvas.
 *
 * Call {@link update} once per frame with an animation-loop timestamp in milliseconds before
 * reading {@link getEyePosition}. Manual dragging temporarily pauses automatic rotation and
 * resumes it from the new angle when the pointer is released.
 */
export class OrbitControls {
  readonly canvas: HTMLCanvasElement;
  readonly props: ResolvedOrbitControlsProps;
  yaw: number;
  pitch: number;
  distance: number;

  private dragging = false;
  private pointerId: number | null = null;
  private lastPointer: [number, number] = [0, 0];
  private previousTimeMilliseconds: number | null = null;
  private readonly previousCursor: string;
  private readonly previousTouchAction: string;

  constructor(canvas: HTMLCanvasElement, props: OrbitControlsProps = {}) {
    this.canvas = canvas;
    this.props = {...DEFAULT_PROPS, ...props};
    this.props.target = [...this.props.target];
    this.yaw = this.props.yaw;
    this.pitch = clampNumber(this.props.pitch, this.props.minPitch, this.props.maxPitch);
    this.distance = clampNumber(
      this.props.distance,
      this.props.minDistance,
      this.props.maxDistance
    );
    this.previousCursor = canvas.style.cursor;
    this.previousTouchAction = canvas.style.touchAction;
    canvas.style.cursor = 'grab';
    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerup', this.handlePointerUp);
    canvas.addEventListener('pointercancel', this.handlePointerUp);
    canvas.addEventListener('wheel', this.handleWheel, {passive: false});
  }

  /** Advances optional auto-rotation using an animation-loop timestamp in milliseconds. */
  update(timeMilliseconds: number): void {
    if (this.previousTimeMilliseconds !== null && this.props.autoRotate && !this.dragging) {
      const deltaSeconds = Math.min(
        Math.max(timeMilliseconds - this.previousTimeMilliseconds, 0) / 1000,
        0.1
      );
      this.yaw += this.props.autoRotateSpeed * deltaSeconds;
    }
    this.previousTimeMilliseconds = timeMilliseconds;
  }

  /** Returns the current camera eye around the configured target. */
  getEyePosition(): OrbitPosition {
    const horizontalDistance = this.distance * Math.cos(this.pitch);
    return [
      this.props.target[0] + horizontalDistance * Math.sin(this.yaw),
      this.props.target[1] + this.distance * Math.sin(this.pitch),
      this.props.target[2] + horizontalDistance * Math.cos(this.yaw)
    ];
  }

  /** Enables or pauses automatic rotation without losing the current manual angle. */
  setAutoRotate(autoRotate: boolean): void {
    this.props.autoRotate = autoRotate;
  }

  /** Restores the configured starting angle and zoom. */
  reset(): void {
    this.yaw = this.props.yaw;
    this.pitch = clampNumber(this.props.pitch, this.props.minPitch, this.props.maxPitch);
    this.distance = clampNumber(
      this.props.distance,
      this.props.minDistance,
      this.props.maxDistance
    );
  }

  destroy(): void {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerUp);
    this.canvas.removeEventListener('wheel', this.handleWheel);
    if (this.pointerId !== null && this.canvas.hasPointerCapture(this.pointerId)) {
      this.canvas.releasePointerCapture(this.pointerId);
    }
    this.canvas.style.cursor = this.previousCursor;
    this.canvas.style.touchAction = this.previousTouchAction;
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) {
      return;
    }
    this.dragging = true;
    this.pointerId = event.pointerId;
    this.lastPointer = [event.clientX, event.clientY];
    this.canvas.setPointerCapture(event.pointerId);
    this.canvas.style.cursor = 'grabbing';
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.dragging || event.pointerId !== this.pointerId) {
      return;
    }
    const deltaX = event.clientX - this.lastPointer[0];
    const deltaY = event.clientY - this.lastPointer[1];
    this.lastPointer = [event.clientX, event.clientY];
    this.yaw -= deltaX * this.props.rotateSpeed;
    this.pitch = clampNumber(
      this.pitch - deltaY * this.props.rotateSpeed,
      this.props.minPitch,
      this.props.maxPitch
    );
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) {
      return;
    }
    this.dragging = false;
    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId);
    }
    this.pointerId = null;
    this.canvas.style.cursor = 'grab';
  };

  private readonly handleWheel = (event: WheelEvent): void => {
    event.preventDefault();
    const deltaY = clampNumber(event.deltaY, -240, 240);
    this.distance = clampNumber(
      this.distance * Math.exp(deltaY * this.props.zoomSpeed),
      this.props.minDistance,
      this.props.maxDistance
    );
  };
}

function clampNumber(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
