import autobind from 'autobind-decorator';
import EventManager from './EventManager';

export default class KeyboardEventManager extends EventManager {
  static handledRawEventTypes = ['keyup'];
  static emittedNextEventTypes = ['onKeyUp'];

  constructor(nextHandlers) {
    super(nextHandlers);
  }

  _wrapRawEvent(rawEvent) {
    return {
      rawEvent,
      keyboard: {
        key: rawEvent.key,
        code: rawEvent.code,
        legacyKeyCode: rawEvent.keyCode
      }
    };
  }

  @autobind keyup(rawEvent) {
    this._emitNextEvent('onKeyUp', rawEvent);
  }
}
