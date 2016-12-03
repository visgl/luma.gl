/* global document */

import {addEvents as addEventsLegacy} from '../../../src/core/eventLegacy';
import CrosshairCanvas from '../CrosshairCanvas';

export default {
  name: '(legacy) mouse click - no cache',
  render(testArea) {
    const canvasElement = document.createElement('canvas');
    testArea.appendChild(canvasElement);
    const crosshairCanvas = new CrosshairCanvas(canvasElement);
    addEventsLegacy(canvasElement, {
      onClick: (eventInfo) => {
        console.log(eventInfo);
        crosshairCanvas.setCrosshair({key: 'click', position: {x: eventInfo.x, y: eventInfo.y}});
      },
      centerOrigin: false,
      cachePosition: false,
      cacheSize: false
    });
  }
};
