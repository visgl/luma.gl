/* global document */

import addEvents from '../../../add-events';
import CrosshairCanvas from '../crosshair-canvas';

export default {
  name: '(new) mouse enter/move/leave',
  render(testArea) {
    const containerElement = document.createElement('div');
    const canvasElement = document.createElement('canvas');
    const coverElement = document.createElement('div');
    containerElement.appendChild(coverElement);
    containerElement.appendChild(canvasElement);
    testArea.appendChild(containerElement);
    containerElement.setAttribute('style', 'position: relative;');
    coverElement.innerHtml = '&nbsp;';
    coverElement.setAttribute('style', `
      position: absolute;
      bottom: -20px;
      left: 100px;
      width: 50px;
      height: 100px;
      background: blue;
      opacity: 0.5;
    `);
    const crosshairCanvas = new CrosshairCanvas(canvasElement);
    addEvents(canvasElement, {
      onMouseEnter(eventInfo) {
        console.log(eventInfo);
        crosshairCanvas.reset();
        crosshairCanvas.setCrosshair({
          key: 'enter', position: eventInfo.pointerPosition, color: 'blue'
        });
      },
      onMouseMove(eventInfo) {
        console.log(eventInfo);
        crosshairCanvas.setCrosshair({
          key: 'move', position: eventInfo.pointerPosition, color: 'black'
        });
      },
      onMouseLeave(eventInfo) {
        console.log(eventInfo);
        crosshairCanvas.setCrosshair({
          key: 'leave', position: eventInfo.pointerPosition, color: 'red'
        });
      }
    });
  }
};
