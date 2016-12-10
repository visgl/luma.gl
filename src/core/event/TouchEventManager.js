import autobind from 'autobind-decorator';
import EventManager from './EventManager';
import createGetModifierState from './createGetModifierState';

export default class TouchEventManager extends EventManager {
  static handledRawEventTypes = [
    'touchstart', 'touchend',
    'touchmove'
  ];
  static emittedNextEventTypes = [
    'onTouchStart', 'onTouchEnd',
    'onTouchMove'
  ];

  constructor(nextHandlers, transformPosition) {
    super(nextHandlers);
    this._transformPosition = transformPosition;
  }

  _wrapRawEvent(rawEvent) {
    const touchesByIdentifier = new Map();
    for (const touch of rawEvent.touches) {
      touchesByIdentifier.set(touch.identifier, touch);
    }
    const changedTouchesByIdentifier = new Map();
    for (const touch of rawEvent.changedTouches) {
      touchesByIdentifier.set(touch.identifier, touch);
      changedTouchesByIdentifier.set(touch.identifier, touch);
    }
    const touchPositions = [];
    for (const touch of touchesByIdentifier.values()) {
      const touchPosition = this._transformPosition(touch);
      touchPositions.push({
        identifier: touch.identifier,
        position: touchPosition,
        wasChanged: changedTouchesByIdentifier.has(touch.identifier)
      });
    }
    return {
      rawEvent,
      touchPositions,
      getModifierState: createGetModifierState(rawEvent)
    };
  }

  @autobind touchstart(rawEvent) {
    this._emitNextEvent('onTouchStart', rawEvent);
  }

  @autobind touchend(rawEvent) {
    this._emitNextEvent('onTouchEnd', rawEvent);
  }
  @autobind touchmove(rawEvent) {
    this._emitNextEvent('onTouchMove', rawEvent);
  }
}
