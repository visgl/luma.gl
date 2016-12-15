/* global console */

export default class EventManager {
  constructor(outgoingHandlers) {
    this._outgoingHandlers = outgoingHandlers;
  }

  attach(element) {
    for (const eventType of this.constructor.incomingEventTypes) {
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
    const mergedHandlers = {...this._outgoingHandlers};
    for (const eventType of this.constructor.incomingEventTypes) {
      const incomingHandler = this[eventType];
      if (mergedHandlers[eventType]) {
        mergedHandlers[eventType] =
          this._mergeHandlers(eventType, mergedHandlers[eventType], incomingHandler);
      } else {
        mergedHandlers[eventType] = incomingHandler;
      }
    }
    return mergedHandlers;
  }

  _emitOutgoingEvent(outgoingEventName, incomingEvent) {
    const outgoingHandler = this._outgoingHandlers[outgoingEventName];
    if (outgoingHandler) {
      const outgoingEvent = this._incomingToOutgoingEvent(incomingEvent);
      try {
        outgoingHandler(outgoingEvent);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`Exception occured in event handler "${outgoingEventName}": `, err);
      }
    }
  }
}
