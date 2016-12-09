/* global document */

import {addEvents} from '../../../src/core/event';
import CrosshairCanvas from '../CrosshairCanvas';

export default {
  name: '(new) pointer',
  render(testArea) {
    const canvasElement = document.createElement('canvas');
    testArea.appendChild(canvasElement);
    const crosshairCanvas = new CrosshairCanvas(canvasElement);
    addEvents(canvasElement, {
      onPointerDown(eventInfo) {
        console.log(eventInfo);
        crosshairCanvas.reset();
        crosshairCanvas.setCrosshair({
          key: 'start',
          position: eventInfo.pointerPosition,
          color: 'blue'
        });
      },
      onPointerMove(eventInfo) {
        console.log(eventInfo);
        crosshairCanvas.setCrosshair({
          key: 'move',
          position: eventInfo.pointerPosition,
          color: 'black'
        });
      },
      onPointerEnd(eventInfo) {
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
