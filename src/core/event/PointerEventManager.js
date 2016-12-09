import autobind from 'autobind-decorator';
import EventManager from './EventManager';

export default class PointerEventManager extends EventManager {
  static handledRawEventTypes = [
    'onTouchStart', 'onMouseDown'
  ];
  static emittedNextEventTypes = [
    'onPointerDown'
  ];

  constructor(nextHandlers) {
    super(nextHandlers);
    // TODO change the name of this class, conflicts with 
    // https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
  }

  _wrapRawEvent(rawEvent) {
    return rawEvent;
  }

  @autobind onTouchStart(rawEvent) {
    this._emitNextEvent('onPointerDown', rawEvent);
  }

  @autobind onMouseDown(rawEvent) {
    this._emitNextEvent('onPointerDown', rawEvent);
  }
}
