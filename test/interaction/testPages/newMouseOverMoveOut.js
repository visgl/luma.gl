/* global document */

import {addEvents} from '../../../src/core/event';
import CrosshairCanvas from '../CrosshairCanvas';

export default {
  name: '(new) mouse over/move/out',
  render(testArea) {
    const canvasElement = document.createElement('canvas');
    testArea.appendChild(canvasElement);
    const crosshairCanvas = new CrosshairCanvas(canvasElement);
    addEvents(canvasElement, {
      onMouseOver(eventInfo) {
        console.log(eventInfo);
        crosshairCanvas.reset();
        crosshairCanvas.setCrosshair({
          key: 'over', position: eventInfo.pointerPosition, color: 'blue'
        });
      },
      onMouseMove(eventInfo) {
        console.log(eventInfo);
        crosshairCanvas.setCrosshair({
          key: 'move', position: eventInfo.pointerPosition, color: 'black'
        });
      },
      onMouseOut(eventInfo) {
        console.log(eventInfo);
        crosshairCanvas.setCrosshair({
          key: 'out', position: eventInfo.pointerPosition, color: 'red'
        });
      }
    });
  }
};
