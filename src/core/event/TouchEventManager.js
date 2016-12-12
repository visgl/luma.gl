import autobind from 'autobind-decorator';
import EventManager from './EventManager';
import createGetModifierState from './createGetModifierState';

export default class TouchEventManager extends EventManager {
  static incomingEventTypes = [
    'touchstart', 'touchend',
    'touchmove'
  ];
  static outgoingEventTypes = [
    'onTouchStart', 'onTouchEnd',
    'onTouchMove'
  ];

  constructor(outgoingHandlers, transformPosition) {
    super(outgoingHandlers);
    this._transformPosition = transformPosition;
  }

  _incomingToOutgoingEvent(incomingEvent) {
    const touchesByIdentifier = new Map();
    for (const touch of incomingEvent.touches) {
      touchesByIdentifier.set(touch.identifier, touch);
    }
    const changedTouchesByIdentifier = new Map();
    for (const touch of incomingEvent.changedTouches) {
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
      browserEvent: incomingEvent,
      touchPositions,
      getModifierState: createGetModifierState(incomingEvent)
    };
  }

  @autobind touchstart(incomingEvent) {
    this._emitOutgoingEvent('onTouchStart', incomingEvent);
  }

  @autobind touchend(incomingEvent) {
    this._emitOutgoingEvent('onTouchEnd', incomingEvent);
  }
  @autobind touchmove(incomingEvent) {
    this._emitOutgoingEvent('onTouchMove', incomingEvent);
  }
}
