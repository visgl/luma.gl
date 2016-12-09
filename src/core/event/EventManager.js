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

  _mergeHandlers(eventType, ...handlers) {
    return function handleEventMerged(...args) {
      for (const handler of handlers) {
        try {
          handler(...args);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(
            `Exception occured in member of merged event handler "${eventType}": `,
            err
          );
        }
      }
    };
  }

  getMiddlewareHandlers() {
    const mergedHandlers = {...this._nextHandlers};
    for (const eventType of this.constructor.handledRawEventTypes) {
      const ownHandler = this[eventType];
      if (mergedHandlers[eventType]) {
        mergedHandlers[eventType] =
          this._mergeHandlers(eventType, mergedHandlers[eventType], ownHandler);
      } else {
        mergedHandlers[eventType] = ownHandler;
      }
    }
    return mergedHandlers;
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
