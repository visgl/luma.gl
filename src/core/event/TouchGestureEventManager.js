import autobind from 'autobind-decorator';
import EventManager from './EventManager';

class TouchGesture {
  constructor(touches) {
    this._touches = touches;
  }

  update(touches) {
    return new this.constructor(touches);
  }
}

class DragGesture extends TouchGesture {
  getEventFields() {
    return {
      gesture: 'drag',
      pointerPosition: this._touches[0].position
    };
  }
}

class PinchGesture extends TouchGesture {
  constructor(touches, baseSpan, baseFocalPoint) {
    super(touches);
    this._span = this._calculateSpan();
    this._focalPoint = this._calculateFocalPoint();
    this._baseSpan = baseSpan || this._span;
    // TODO remove?
    this._baseFocalPoint = baseFocalPoint || this._focalPoint;
    // TODO lastScale === 0 ??
    // TODO divide by zero?
    this._scale = this._span / this._baseSpan;
  }

  update(touches) {
    return new PinchGesture(touches, this._baseSpan, this._focalPoint);
  }

  getEventFields() {
    return {
      gesture: 'pinch',
      scale: this._scale,
      focalPoint: this._focalPoint
    };
  }

  _calculateSpan() {
    // TODO support more than 2 touch points
    const span = {
      x: Math.abs(this._touches[0].position.x - this._touches[1].position.x),
      y: Math.abs(this._touches[0].position.y - this._touches[1].position.y)
    };
    return Math.sqrt(Math.pow(span.x, 2) + Math.pow(span.y, 2));
  }

  _calculateFocalPoint() {
    return {
      x: (this._touches[0].position.x + this._touches[1].position.x) / 2.0,
      y: (this._touches[0].position.y + this._touches[1].position.y) / 2.0
    };
  }
}

export default class TouchGestureEventManager extends EventManager {
  static handledRawEventTypes = [
    'onTouchStart', 'onTouchEnd',
    'onTouchMove'
    // TODO cancel
  ];
  static emittedNextEventTypes = [
    'onTouchGestureStart', 'onTouchGestureEnd',
    'onTouchGestureChange'
  ];

  constructor(nextHandlers) {
    super(nextHandlers);
    this._state = {gesture: null};
  }

  _wrapRawEvent(rawEvent) {
    const gestureFields = this._state.gesture.getEventFields();
    gestureFields.touchEvent = rawEvent.touchEvent;
    gestureFields.rawEvent = rawEvent.rawEvent;
    return gestureFields;
  }

  _getMatchingGestureConstructor(touches) {
    if (touches.length === 1) {
      return DragGesture;
    }
    if (touches.length === 2) {
      return PinchGesture;
    }
    return null;
  }

  _updateGesture(touches) {
    this._state.gesture = this._state.gesture.update(touches);
  }

  _handleTouchChange(rawEvent, currentTouches, currentAndLeavingTouches) {
    const Gesture = this._getMatchingGestureConstructor(currentTouches);
    if (this._state.gesture) {
      // TODO this update could be dangerous,
      // since ammount of touch points might not be whats expected
      this._updateGesture(currentAndLeavingTouches);
      if (this._state.gesture.constructor !== Gesture) {
        this._emitNextEvent('onTouchGestureEnd', rawEvent);
        this._state.gesture = null;
      }
    }
    if (!this._state.gesture && Gesture) {
      this._state.gesture = new Gesture(currentTouches);
      this._emitNextEvent('onTouchGestureStart', rawEvent);
    }
  }

  @autobind onTouchStart(rawEvent) {
    this._handleTouchChange(rawEvent, rawEvent.touchPositions, rawEvent.touchPositions);
  }

  @autobind onTouchEnd(rawEvent) {
    const currentAndLeavingTouches = rawEvent.touchPositions;
    const currentTouches = rawEvent.touchPositions.filter(touch => !touch.wasChanged);
    this._handleTouchChange(rawEvent, currentTouches, currentAndLeavingTouches);
  }

  @autobind onTouchMove(rawEvent) {
    if (this._state.gesture) {
      this._updateGesture(rawEvent.touchPositions);
      this._emitNextEvent('onTouchGestureChange', rawEvent);
    }
  }
}
