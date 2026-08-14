// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type FlatViewState = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

export type FlatControllerPick = {
  x: number;
  y: number;
  clientX: number;
  clientY: number;
  intent: 'hover' | 'select';
};

export type FlatControllerProps = {
  getView: () => FlatViewState;
  getBounds: () => FlatViewState;
  onViewChange: (view: FlatViewState) => void;
  onPick?: (pick: FlatControllerPick) => void;
  onPointerLeave?: () => void;
  onInteractionStart?: () => void;
  minimumXRange?: number;
  dragThreshold?: number;
  zoomSpeed?: number;
};

/** Pointer controller for flat timelines and other bounded two-dimensional data views. */
export class FlatController {
  readonly canvas: HTMLCanvasElement;
  readonly props: Required<
    Pick<FlatControllerProps, 'minimumXRange' | 'dragThreshold' | 'zoomSpeed'>
  > &
    Omit<FlatControllerProps, 'minimumXRange' | 'dragThreshold' | 'zoomSpeed'>;

  private dragging = false;
  private pointerMoved = false;
  private lastPointer: [number, number] = [0, 0];
  private readonly previousCursor: string;
  private readonly previousTouchAction: string;

  constructor(canvas: HTMLCanvasElement, props: FlatControllerProps) {
    this.canvas = canvas;
    this.props = {
      minimumXRange: props.minimumXRange ?? 0.5,
      dragThreshold: props.dragThreshold ?? 2,
      zoomSpeed: props.zoomSpeed ?? 0.0015,
      ...props
    };
    this.previousCursor = canvas.style.cursor;
    this.previousTouchAction = canvas.style.touchAction;
    canvas.style.cursor = 'grab';
    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerup', this.handlePointerUp);
    canvas.addEventListener('pointercancel', this.handlePointerCancel);
    canvas.addEventListener('pointerleave', this.handlePointerLeave);
    canvas.addEventListener('wheel', this.handleWheel, {passive: false});
  }

  destroy(): void {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerCancel);
    this.canvas.removeEventListener('pointerleave', this.handlePointerLeave);
    this.canvas.removeEventListener('wheel', this.handleWheel);
    this.canvas.style.cursor = this.previousCursor;
    this.canvas.style.touchAction = this.previousTouchAction;
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.dragging = true;
    this.pointerMoved = false;
    this.lastPointer = [event.clientX, event.clientY];
    this.props.onInteractionStart?.();
    this.canvas.setPointerCapture(event.pointerId);
    this.canvas.style.cursor = 'grabbing';
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.dragging) {
      this.emitPick(event, 'hover');
      return;
    }
    const [lastX, lastY] = this.lastPointer;
    const horizontalMovement = event.clientX - lastX;
    const verticalMovement = event.clientY - lastY;
    if (Math.abs(horizontalMovement) + Math.abs(verticalMovement) > this.props.dragThreshold) {
      this.pointerMoved = true;
    }
    const rectangle = this.canvas.getBoundingClientRect();
    const view = this.props.getView();
    const bounds = this.props.getBounds();
    const xRange = view.xMax - view.xMin;
    const yRange = view.yMax - view.yMin;
    const xMin = clamp(
      view.xMin - (horizontalMovement / Math.max(rectangle.width, 1)) * xRange,
      bounds.xMin,
      Math.max(bounds.xMin, bounds.xMax - xRange)
    );
    const yMin = clamp(
      view.yMin - (verticalMovement / Math.max(rectangle.height, 1)) * yRange,
      bounds.yMin,
      Math.max(bounds.yMin, bounds.yMax - yRange)
    );
    this.props.onViewChange({xMin, xMax: xMin + xRange, yMin, yMax: yMin + yRange});
    this.lastPointer = [event.clientX, event.clientY];
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (!this.pointerMoved) {
      this.emitPick(event, 'select');
    }
    this.finishPointerInteraction(event);
  };

  private readonly handlePointerCancel = (event: PointerEvent): void => {
    this.finishPointerInteraction(event);
  };

  private readonly handlePointerLeave = (): void => {
    if (!this.dragging) {
      this.props.onPointerLeave?.();
    }
  };

  private readonly handleWheel = (event: WheelEvent): void => {
    event.preventDefault();
    this.props.onInteractionStart?.();
    const rectangle = this.canvas.getBoundingClientRect();
    const horizontalFraction = clamp(
      (event.clientX - rectangle.left) / Math.max(rectangle.width, 1),
      0,
      1
    );
    const view = this.props.getView();
    const bounds = this.props.getBounds();
    const previousRange = view.xMax - view.xMin;
    const maximumRange = bounds.xMax - bounds.xMin;
    const nextRange = clamp(
      previousRange * Math.exp(event.deltaY * this.props.zoomSpeed),
      Math.min(this.props.minimumXRange, maximumRange),
      maximumRange
    );
    const anchor = view.xMin + previousRange * horizontalFraction;
    const requestedXMin = anchor - nextRange * horizontalFraction;
    const xMin = clamp(requestedXMin, bounds.xMin, Math.max(bounds.xMin, bounds.xMax - nextRange));
    this.props.onViewChange({...view, xMin, xMax: xMin + nextRange});
  };

  private emitPick(event: PointerEvent, intent: FlatControllerPick['intent']): void {
    const rectangle = this.canvas.getBoundingClientRect();
    const horizontalFraction = clamp(
      (event.clientX - rectangle.left) / Math.max(rectangle.width, 1),
      0,
      1
    );
    const verticalFraction = clamp(
      (event.clientY - rectangle.top) / Math.max(rectangle.height, 1),
      0,
      1
    );
    const view = this.props.getView();
    this.props.onPick?.({
      x: view.xMin + horizontalFraction * (view.xMax - view.xMin),
      y: view.yMin + verticalFraction * (view.yMax - view.yMin),
      clientX: event.clientX,
      clientY: event.clientY,
      intent
    });
  }

  private finishPointerInteraction(event: PointerEvent): void {
    this.dragging = false;
    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId);
    }
    this.canvas.style.cursor = 'grab';
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
