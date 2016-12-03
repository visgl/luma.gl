/* global console */

export default class EventManager {
  constructor(nextHandlers) {
    this._nextHandlers = nextHandlers;
  }

  attach(element) {
    for (const eventType of this.constructor.handledRawEventTypes) {
      element.addEventListener(eventType, this[eventType]);
    }
  }

  _wrapRawEvent(rawEvent) {
    return {rawEvent};
  }

  _emitNextEvent(nextEventName, rawEvent) {
    const nextHandler = this._nextHandlers[nextEventName];
    if (nextHandler) {
      const wrappedEvent = this._wrapRawEvent(rawEvent);
      try {
        nextHandler(wrappedEvent);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`Exception occured in event handler "${nextEventName}": `, err);
      }
    }
  }
}
