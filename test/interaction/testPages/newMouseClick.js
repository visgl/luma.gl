/* global document */

import {addEvents} from '../../../src/core/event';
import CrosshairCanvas from '../CrosshairCanvas';

export default {
  name: '(new) mouse click',
  render(testArea) {
    const canvasElement = document.createElement('canvas');
    testArea.appendChild(canvasElement);
    const crosshairCanvas = new CrosshairCanvas(canvasElement);
    addEvents(canvasElement, {
      onClick(eventInfo) {
        console.log(eventInfo);
        crosshairCanvas.setCrosshair({key: 'click', position: eventInfo.pointerPosition});
      }
    });
  }
};
