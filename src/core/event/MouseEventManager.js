import autobind from 'autobind-decorator';
import EventManager from './EventManager';
import createGetModifierState from './createGetModifierState';

export default class MouseEventManager extends EventManager {
  static incomingEventTypes = [
    'mouseup', 'mousedown',
    'mousemove',
    'mouseenter', 'mouseleave',
    'mouseover', 'mouseout'
  ];
  static outgoingEventTypes = [
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

  constructor(outgoingHandlers, transformPosition) {
    super(outgoingHandlers);
    this._transformPosition = transformPosition;
    this._state = {clickButton: null, hovering: false};
  }

  _getPressedButtons(incomingEvent) {
    // TODO this only allows one button pressed at a time
    // and does not work during mousemove
    // use event.buttons instead
    return {
      left: incomingEvent.type === 'mousedown' && incomingEvent.button === 0,
      middle: incomingEvent.type === 'mousedown' && incomingEvent.button === 1,
      right: incomingEvent.type === 'mousedown' && incomingEvent.button === 2
    };
  }

  _incomingToOutgoingEvent(incomingEvent) {
    return {
      rawEvent: incomingEvent,
      mouse: {
        pressedButtons: this._getPressedButtons(incomingEvent),
        clickButton: this._state.clickButton,
        hovering: this._state.hovering
      },
      pointerPosition: this._transformPosition(incomingEvent),
      getModifierState: createGetModifierState(incomingEvent)
    };
  }

  @autobind mouseup(incomingEvent) {
    if (this._state.clickButton) {
      this._emitOutgoingEvent('onClick', incomingEvent);
      this._state.clickButton = null;
    }
    this._emitOutgoingEvent('onMouseUp', incomingEvent);
  }

  @autobind mousedown(incomingEvent) {
    this._emitOutgoingEvent('onMouseDown', incomingEvent);
    this._state.clickButton = this._clickButtonMap[incomingEvent.button] || 'unknown';
  }

  @autobind mousemove(incomingEvent) {
    this._state.clickButton = null;
    this._emitOutgoingEvent('onMouseMove', incomingEvent);
  }

  @autobind mouseenter(rawEvent) {
    this._emitOutgoingEvent('onMouseEnter', rawEvent);
  }

  @autobind mouseleave(rawEvent) {
    this._emitOutgoingEvent('onMouseLeave', rawEvent);
  }

  @autobind mouseover(rawEvent) {
    this._state.hovering = true;
    this._emitOutgoingEvent('onMouseOver', rawEvent);
  }

  @autobind mouseout(rawEvent) {
    this._state.hovering = false;
    this._emitOutgoingEvent('onMouseOut', rawEvent);
  }
}
