/* global document */

import addEvents from '../../../add-events';
import CrosshairCanvas from '../CrosshairCanvas';

export default {
  name: '(new) mouse down/up',
  render(testArea) {
    const canvasElement = document.createElement('canvas');
    testArea.appendChild(canvasElement);
    const crosshairCanvas = new CrosshairCanvas(canvasElement);
    addEvents(canvasElement, {
      onMouseDown(eventInfo) {
        console.log(eventInfo);
        crosshairCanvas.reset();
        crosshairCanvas.setCrosshair({key: 'down', position: eventInfo.pointerPosition, color: 'blue'});
      },
      onMouseUp(eventInfo) {
        console.log(eventInfo);
        crosshairCanvas.setCrosshair({key: 'up', position: eventInfo.pointerPosition, color: 'red'});
      }
    });
  }
};
