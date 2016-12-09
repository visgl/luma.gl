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
    const relevantTouches = new Set();
    for (const touch of rawEvent.touches) {
      relevantTouches.add({touch, wasChanged: false});
    }
    // TODO touches should be flagged wasChanged on touchmove
    if (rawEvent.type === 'touchend' || rawEvent.type === 'touchcancel') {
      // TODO these could include touches outside target
      for (const touch of rawEvent.changedTouches) {
        relevantTouches.add({touch, wasChanged: true});
      }
    }
    const touchPositions = [];
    const pointerPosition = {x: 0, y: 0};
    for (const {touch, wasChanged} of relevantTouches) {
      const touchPosition = this._transformPosition(touch);
      touchPositions.push({identifier: touch.identifier, position: touchPosition, wasChanged});
      pointerPosition.x += touchPosition.x / relevantTouches.size;
      pointerPosition.y += touchPosition.y / relevantTouches.size;
    }
    return {
      rawEvent,
      touchPositions,
      pointerPosition: relevantTouches.size ? pointerPosition : undefined,
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
