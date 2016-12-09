/* global document */

import {addEvents} from '../../../src/core/event';
import CrosshairCanvas from '../CrosshairCanvas';

export default {
  name: '(new) touch gesture',
  render(testArea) {
    const canvasElement = document.createElement('canvas');
    testArea.appendChild(canvasElement);
    const crosshairCanvas = new CrosshairCanvas(canvasElement);
    addEvents(canvasElement, {
      onTouchGestureStart(eventInfo) {
        console.log(eventInfo);
        crosshairCanvas.reset();
        crosshairCanvas.setCrosshair({
          key: 'start',
          position: eventInfo.pointerPosition,
          color: 'blue'
        });
      },
      onTouchGestureMove(eventInfo) {
        console.log(eventInfo);
        crosshairCanvas.setCrosshair({
          key: 'move',
          position: eventInfo.pointerPosition,
          color: 'black'
        });
      },
      onTouchGestureEnd(eventInfo) {
        console.log(eventInfo);
        crosshairCanvas.setCrosshair({
          key: 'end',
          position: eventInfo.pointerPosition,
          color: 'red'
        });
      }
    });
  }
};
