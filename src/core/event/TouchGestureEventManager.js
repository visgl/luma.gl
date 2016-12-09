import autobind from 'autobind-decorator';
import EventManager from './EventManager';

export default class TouchGestureEventManager extends EventManager {
  static handledRawEventTypes = [
    'onTouchStart', 'onTouchEnd',
    'onTouchMove'
    // TODO cancel
  ];
  static emittedNextEventTypes = [
    'onTouchGestureStart', 'onTouchGestureEnd',
    'onTouchGestureMove'
  ];

  constructor(nextHandlers) {
    super(nextHandlers);
    // TODO is this totally correct initial state?
    this._state = {gestureStarted: false, gestureTouchIdentifier: null};
  }

  _getGestureTouchInfo(rawEvent) {
    return rawEvent.touchPositions.find(
      ({identifier}) => identifier === this._state.gestureTouchIdentifier,
    );
  }

  _wrapRawEvent(rawEvent) {
    return {
      // TODO this should be the browser event
      rawEvent,
      pointerPosition: this._getGestureTouchInfo(rawEvent).position
    };
  }

  @autobind onTouchStart(rawEvent) {
    if (!this._state.gestureStarted) {
      this._state.gestureStarted = true;
      this._state.gestureTouchIdentifier = rawEvent.touchPositions[0].identifier;
      this._emitNextEvent('onTouchGestureStart', rawEvent);
    }
  }

  @autobind onTouchEnd(rawEvent) {
    if (this._state.gestureStarted && this._getGestureTouchInfo(rawEvent).wasChanged) {
      this._emitNextEvent('onTouchGestureEnd', rawEvent);
      this._state.gestureStarted = false;
      this._state.gestureTouchIdentifier = null;
    }
  }

  @autobind onTouchMove(rawEvent) {
    // TODO only do if changed
    if (this._state.gestureStarted && this._getGestureTouchInfo(rawEvent)) {
      this._emitNextEvent('onTouchGestureMove', rawEvent);
    }
  }
}
