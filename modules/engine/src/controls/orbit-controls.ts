// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type OrbitPosition = [number, number, number];

export type OrbitControlsProps = {
  target?: Readonly<OrbitPosition>;
  distance?: number;
  yaw?: number;
  pitch?: number;
  roll?: number;
  minDistance?: number;
  maxDistance?: number;
  minPitch?: number;
  maxPitch?: number;
  rotateSpeed?: number;
  pitchSpeed?: number;
  zoomSpeed?: number;
  enabled?: boolean;
  enableRotate?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
  panSpeed?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  onInteractionStart?: () => void;
};

type ResolvedOrbitControlsProps = Required<
  Omit<OrbitControlsProps, 'pitchSpeed' | 'onInteractionStart'>
> &
  Pick<OrbitControlsProps, 'pitchSpeed' | 'onInteractionStart'>;

const DEFAULT_PROPS: ResolvedOrbitControlsProps = {
  target: [0, 0, 0],
  distance: 10,
  yaw: 0,
  pitch: 0.25,
  roll: 0,
  minDistance: 1,
  maxDistance: 100,
  minPitch: -Math.PI / 2 + 0.01,
  maxPitch: Math.PI / 2 - 0.01,
  rotateSpeed: 0.006,
  zoomSpeed: 0.001,
  enabled: true,
  enableRotate: false,
  enableZoom: true,
  enablePan: false,
  panSpeed: 0.0018,
  autoRotate: false,
  autoRotateSpeed: 0.1
};

/**
 * Pointer orbit, optional pinch roll, wheel and pinch zoom, and automatic rotation controls.
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
  roll: number;
  distance: number;

  private dragging = false;
  private readonly activePointers = new Map<number, [number, number]>();
  private lastPointer: [number, number] = [0, 0];
  private previousPinchDistance: number | null = null;
  private previousPinchAngle: number | null = null;
  private previousTimeMilliseconds: number | null = null;
  private readonly previousCursor: string;
  private readonly previousTouchAction: string;

  constructor(canvas: HTMLCanvasElement, props: OrbitControlsProps = {}) {
    this.canvas = canvas;
    this.props = {...DEFAULT_PROPS, ...props};
    this.props.target = [...this.props.target];
    this.yaw = this.props.yaw;
    this.pitch = clampNumber(this.props.pitch, this.props.minPitch, this.props.maxPitch);
    this.roll = this.props.roll;
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
    if (
      this.previousTimeMilliseconds !== null &&
      this.props.enabled &&
      this.props.autoRotate &&
      !this.dragging
    ) {
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

  /** Returns the camera up direction after applying pitch and optional two-finger roll. */
  getUpDirection(): OrbitPosition {
    return this.getCameraFrame().up;
  }

  private getCameraFrame(): {right: OrbitPosition; up: OrbitPosition} {
    const sineYaw = Math.sin(this.yaw);
    const cosineYaw = Math.cos(this.yaw);
    const sinePitch = Math.sin(this.pitch);
    const cosinePitch = Math.cos(this.pitch);
    const sineRoll = Math.sin(this.roll);
    const cosineRoll = Math.cos(this.roll);
    const right: OrbitPosition = [cosineYaw, 0, -sineYaw];
    const up: OrbitPosition = [-sinePitch * sineYaw, cosinePitch, -sinePitch * cosineYaw];
    return {
      right: [
        right[0] * cosineRoll - up[0] * sineRoll,
        right[1] * cosineRoll - up[1] * sineRoll,
        right[2] * cosineRoll - up[2] * sineRoll
      ],
      up: [
        up[0] * cosineRoll + right[0] * sineRoll,
        up[1] * cosineRoll + right[1] * sineRoll,
        up[2] * cosineRoll + right[2] * sineRoll
      ]
    };
  }

  /** Enables or pauses automatic rotation without losing the current manual angle. */
  setAutoRotate(autoRotate: boolean): void {
    this.props.autoRotate = autoRotate;
  }

  /** Updates orbit configuration and applies supplied camera state immediately. */
  setProps(props: OrbitControlsProps): void {
    Object.assign(this.props, props);
    if (props.enabled === false && this.dragging) {
      this.endPointerInteraction();
    }
    if (props.target) {
      this.props.target = [...props.target];
    }
    if (props.yaw !== undefined) {
      this.yaw = props.yaw;
    }
    if (props.pitch !== undefined || props.minPitch !== undefined || props.maxPitch !== undefined) {
      this.pitch = clampNumber(props.pitch ?? this.pitch, this.props.minPitch, this.props.maxPitch);
    }
    if (props.roll !== undefined) {
      this.roll = props.roll;
    }
    if (
      props.distance !== undefined ||
      props.minDistance !== undefined ||
      props.maxDistance !== undefined
    ) {
      this.distance = clampNumber(
        props.distance ?? this.distance,
        this.props.minDistance,
        this.props.maxDistance
      );
    }
  }

  /** Restores the configured starting orbit, roll, and zoom. */
  reset(): void {
    this.yaw = this.props.yaw;
    this.pitch = clampNumber(this.props.pitch, this.props.minPitch, this.props.maxPitch);
    this.roll = this.props.roll;
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
    this.endPointerInteraction();
    this.canvas.style.cursor = this.previousCursor;
    this.canvas.style.touchAction = this.previousTouchAction;
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (
      !this.props.enabled ||
      event.button !== 0 ||
      this.activePointers.has(event.pointerId) ||
      this.activePointers.size >= 2 ||
      (this.activePointers.size > 0 && event.pointerType !== 'touch')
    ) {
      return;
    }
    if (this.activePointers.size === 0) {
      this.props.onInteractionStart?.();
    }
    this.dragging = true;
    this.activePointers.set(event.pointerId, [event.clientX, event.clientY]);
    if (this.activePointers.size === 1) {
      this.lastPointer = [event.clientX, event.clientY];
    } else {
      const {center, distance, angle} = this.getMultiPointerState();
      this.lastPointer = center;
      this.previousPinchDistance = distance;
      this.previousPinchAngle = distance > 0 ? angle : null;
    }
    this.canvas.setPointerCapture(event.pointerId);
    this.canvas.style.cursor = 'grabbing';
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.props.enabled || !this.dragging || !this.activePointers.has(event.pointerId)) {
      return;
    }

    this.activePointers.set(event.pointerId, [event.clientX, event.clientY]);
    if (this.activePointers.size > 1) {
      const {center, distance, angle} = this.getMultiPointerState();
      if (this.props.enablePan) {
        this.panTarget(center[0] - this.lastPointer[0], center[1] - this.lastPointer[1]);
      }
      if (this.props.enableZoom && this.previousPinchDistance && distance > 0) {
        this.distance = clampNumber(
          (this.distance * this.previousPinchDistance) / distance,
          this.props.minDistance,
          this.props.maxDistance
        );
      }
      if (this.props.enableRotate && this.previousPinchAngle !== null && distance > 0) {
        this.roll += normalizeAngleDelta(angle - this.previousPinchAngle);
      }
      this.lastPointer = center;
      this.previousPinchDistance = distance;
      this.previousPinchAngle = distance > 0 ? angle : null;
      return;
    }

    const deltaX = event.clientX - this.lastPointer[0];
    const deltaY = event.clientY - this.lastPointer[1];
    this.lastPointer = [event.clientX, event.clientY];
    if (this.props.enablePan && event.shiftKey) {
      this.panTarget(deltaX, deltaY);
    } else {
      this.yaw -= deltaX * this.props.rotateSpeed;
      this.pitch = clampNumber(
        this.pitch - deltaY * (this.props.pitchSpeed ?? this.props.rotateSpeed),
        this.props.minPitch,
        this.props.maxPitch
      );
    }
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (!this.activePointers.has(event.pointerId)) {
      return;
    }

    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId);
    }
    this.activePointers.delete(event.pointerId);
    this.previousPinchDistance = null;
    this.previousPinchAngle = null;

    const remainingPointer = this.activePointers.entries().next().value;
    if (remainingPointer) {
      this.lastPointer = remainingPointer[1];
      return;
    }
    this.endPointerInteraction();
  };

  private endPointerInteraction(): void {
    this.dragging = false;
    for (const pointerId of this.activePointers.keys()) {
      if (this.canvas.hasPointerCapture(pointerId)) {
        this.canvas.releasePointerCapture(pointerId);
      }
    }
    this.activePointers.clear();
    this.previousPinchDistance = null;
    this.previousPinchAngle = null;
    this.canvas.style.cursor = 'grab';
  }

  private getMultiPointerState(): {center: [number, number]; distance: number; angle: number} {
    const [firstPointer, secondPointer] = this.activePointers.values();
    const deltaX = secondPointer[0] - firstPointer[0];
    const deltaY = secondPointer[1] - firstPointer[1];
    return {
      center: [(firstPointer[0] + secondPointer[0]) / 2, (firstPointer[1] + secondPointer[1]) / 2],
      distance: Math.hypot(deltaX, deltaY),
      angle: Math.atan2(deltaY, deltaX)
    };
  }

  private panTarget(deltaX: number, deltaY: number): void {
    const panScale = this.distance * this.props.panSpeed;
    const {right, up} = this.getCameraFrame();
    this.props.target = [
      this.props.target[0] + (-right[0] * deltaX + up[0] * deltaY) * panScale,
      this.props.target[1] + (-right[1] * deltaX + up[1] * deltaY) * panScale,
      this.props.target[2] + (-right[2] * deltaX + up[2] * deltaY) * panScale
    ];
  }

  private readonly handleWheel = (event: WheelEvent): void => {
    if (!this.props.enabled || !this.props.enableZoom) {
      return;
    }
    event.preventDefault();
    this.props.onInteractionStart?.();
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

function normalizeAngleDelta(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}
