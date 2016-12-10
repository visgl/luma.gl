import autobind from 'autobind-decorator';
import EventManager from './EventManager';
import createGetModifierState from './createGetModifierState';

export default class MouseEventManager extends EventManager {
  static handledRawEventTypes = [
    'mouseup', 'mousedown',
    'mousemove',
    'mouseenter', 'mouseleave',
    'mouseover', 'mouseout'
  ];
  static emittedNextEventTypes = [
    'onClick',
    'onMouseUp', 'onMouseDown',
    'onMouseMove',
    'onMouseEnter', 'onMouseLeave',
    'onMouseOver', 'onMouseOut'
  ];
  _clickButtonMap = {
    0: 'left',
    1: 'middle',
    2: 'right'
  }

  constructor(nextHandlers, transformPosition) {
    super(nextHandlers);
    this._transformPosition = transformPosition;
    this._state = {clickButton: null, hovering: false};
  }

  _getPressedButtons(rawEvent) {
    // TODO this only allows one button pressed at a time
    // and does not work during mousemove
    // use event.buttons instead
    return {
      left: rawEvent.type === 'mousedown' && rawEvent.button === 0,
      middle: rawEvent.type === 'mousedown' && rawEvent.button === 1,
      right: rawEvent.type === 'mousedown' && rawEvent.button === 2
    };
  }

  _wrapRawEvent(rawEvent) {
    return {
      rawEvent,
      mouse: {
        pressedButtons: this._getPressedButtons(rawEvent),
        clickButton: this._state.clickButton,
        hovering: this._state.hovering
      },
      pointerPosition: this._transformPosition(rawEvent),
      getModifierState: createGetModifierState(rawEvent)
    };
  }

  @autobind mouseup(rawEvent) {
    if (this._state.clickButton) {
      this._emitNextEvent('onClick', rawEvent);
      this._state.clickButton = null;
    }
    this._emitNextEvent('onMouseUp', rawEvent);
  }

  @autobind mousedown(rawEvent) {
    this._emitNextEvent('onMouseDown', rawEvent);
    this._state.clickButton = this._clickButtonMap[rawEvent.button] || 'unknown';
  }

  @autobind mousemove(rawEvent) {
    this._state.clickButton = null;
    this._emitNextEvent('onMouseMove', rawEvent);
  }

  @autobind mouseenter(rawEvent) {
    this._emitNextEvent('onMouseEnter', rawEvent);
  }

  @autobind mouseleave(rawEvent) {
    this._emitNextEvent('onMouseLeave', rawEvent);
  }

  @autobind mouseover(rawEvent) {
    this._state.hovering = true;
    this._emitNextEvent('onMouseOver', rawEvent);
  }

  @autobind mouseout(rawEvent) {
    this._state.hovering = false;
    this._emitNextEvent('onMouseOut', rawEvent);
  }
}
