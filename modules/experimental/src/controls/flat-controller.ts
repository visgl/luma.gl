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

export type RectangleSelection = FlatViewState & {
  clientLeft: number;
  clientTop: number;
  clientWidth: number;
  clientHeight: number;
};

export type RectangleSelectControllerProps = {
  getView: () => FlatViewState;
  onSelect: (selection: RectangleSelection) => void;
  onSelectionChange?: (selection: RectangleSelection | null) => void;
  onInteractionStart?: () => void;
  /** Defaults to primary-button Shift+drag so ordinary canvas interaction remains available. */
  isActivationEvent?: (event: PointerEvent) => boolean;
  minimumPixelSize?: number;
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
    const rangeTolerance = Math.max(maximumRange, 1) * Number.EPSILON * 8;
    if (event.deltaY > 0 && previousRange >= maximumRange - rangeTolerance) {
      return;
    }
    const nextRange = clamp(
      previousRange * Math.exp(event.deltaY * this.props.zoomSpeed),
      Math.min(this.props.minimumXRange, maximumRange),
      maximumRange
    );
    const anchor = view.xMin + previousRange * horizontalFraction;
    const requestedXMin = anchor - nextRange * horizontalFraction;
    const xMin = clamp(requestedXMin, bounds.xMin, Math.max(bounds.xMin, bounds.xMax - nextRange));
    const xMax = xMin + nextRange;
    if (xMin === view.xMin && xMax === view.xMax) {
      return;
    }
    this.props.onInteractionStart?.();
    this.props.onViewChange({...view, xMin, xMax});
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

/** Capture-phase rectangle selector that can coexist with an ordinary canvas controller. */
export class RectangleSelectController {
  readonly canvas: HTMLCanvasElement;
  readonly props: Required<
    Pick<RectangleSelectControllerProps, 'isActivationEvent' | 'minimumPixelSize'>
  > &
    Omit<RectangleSelectControllerProps, 'isActivationEvent' | 'minimumPixelSize'>;

  private pointerId: number | null = null;
  private startClientPosition: [number, number] = [0, 0];
  private currentClientPosition: [number, number] = [0, 0];
  private startView: FlatViewState | null = null;
  private previousCursor = '';

  constructor(canvas: HTMLCanvasElement, props: RectangleSelectControllerProps) {
    this.canvas = canvas;
    this.props = {
      isActivationEvent: props.isActivationEvent ?? (event => event.button === 0 && event.shiftKey),
      minimumPixelSize: props.minimumPixelSize ?? 3,
      ...props
    };
    canvas.addEventListener('pointerdown', this.handlePointerDown, true);
    canvas.addEventListener('pointermove', this.handlePointerMove, true);
    canvas.addEventListener('pointerup', this.handlePointerUp, true);
    canvas.addEventListener('pointercancel', this.handlePointerCancel, true);
  }

  destroy(): void {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown, true);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove, true);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp, true);
    this.canvas.removeEventListener('pointercancel', this.handlePointerCancel, true);
    this.finishSelection();
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (this.pointerId !== null || !this.props.isActivationEvent(event)) return;
    this.captureEvent(event);
    this.pointerId = event.pointerId;
    this.startClientPosition = this.getClampedClientPosition(event);
    this.currentClientPosition = this.startClientPosition;
    this.startView = {...this.props.getView()};
    this.previousCursor = this.canvas.style.cursor;
    this.canvas.style.cursor = 'crosshair';
    this.canvas.setPointerCapture(event.pointerId);
    this.props.onInteractionStart?.();
    this.props.onSelectionChange?.(this.getSelection());
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return;
    this.captureEvent(event);
    this.currentClientPosition = this.getClampedClientPosition(event);
    this.props.onSelectionChange?.(this.getSelection());
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return;
    this.captureEvent(event);
    this.currentClientPosition = this.getClampedClientPosition(event);
    const selection = this.getSelection();
    if (Math.max(selection.clientWidth, selection.clientHeight) >= this.props.minimumPixelSize) {
      this.props.onSelect(selection);
    }
    this.finishSelection();
  };

  private readonly handlePointerCancel = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return;
    this.captureEvent(event);
    this.finishSelection();
  };

  private captureEvent(event: PointerEvent): void {
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  private getClampedClientPosition(event: PointerEvent): [number, number] {
    const rectangle = this.canvas.getBoundingClientRect();
    return [
      clamp(event.clientX, rectangle.left, rectangle.right ?? rectangle.left + rectangle.width),
      clamp(event.clientY, rectangle.top, rectangle.bottom ?? rectangle.top + rectangle.height)
    ];
  }

  private getSelection(): RectangleSelection {
    const rectangle = this.canvas.getBoundingClientRect();
    const view = this.startView ?? this.props.getView();
    const firstHorizontalFraction =
      (this.startClientPosition[0] - rectangle.left) / Math.max(rectangle.width, 1);
    const secondHorizontalFraction =
      (this.currentClientPosition[0] - rectangle.left) / Math.max(rectangle.width, 1);
    const firstVerticalFraction =
      (this.startClientPosition[1] - rectangle.top) / Math.max(rectangle.height, 1);
    const secondVerticalFraction =
      (this.currentClientPosition[1] - rectangle.top) / Math.max(rectangle.height, 1);
    const firstX = view.xMin + firstHorizontalFraction * (view.xMax - view.xMin);
    const secondX = view.xMin + secondHorizontalFraction * (view.xMax - view.xMin);
    const firstY = view.yMin + firstVerticalFraction * (view.yMax - view.yMin);
    const secondY = view.yMin + secondVerticalFraction * (view.yMax - view.yMin);
    return {
      xMin: Math.min(firstX, secondX),
      xMax: Math.max(firstX, secondX),
      yMin: Math.min(firstY, secondY),
      yMax: Math.max(firstY, secondY),
      clientLeft: Math.min(this.startClientPosition[0], this.currentClientPosition[0]),
      clientTop: Math.min(this.startClientPosition[1], this.currentClientPosition[1]),
      clientWidth: Math.abs(this.currentClientPosition[0] - this.startClientPosition[0]),
      clientHeight: Math.abs(this.currentClientPosition[1] - this.startClientPosition[1])
    };
  }

  private finishSelection(): void {
    const pointerId = this.pointerId;
    this.pointerId = null;
    this.startView = null;
    if (pointerId !== null && this.canvas.hasPointerCapture(pointerId)) {
      this.canvas.releasePointerCapture(pointerId);
    }
    if (pointerId !== null) this.canvas.style.cursor = this.previousCursor;
    this.props.onSelectionChange?.(null);
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
