/* global document */

import {addEvents} from '../../src/core/event';
import {addEvents as addEventsLegacy} from '../../src/core/eventLegacy';
import prepareTestArea from './prepareTestArea';
import CrosshairCanvas from './CrosshairCanvas';

const crosshairCanvasConfig = {
  backgroundColor: 'green',
  crosshairSizePx: 15
};

const testScenarios = [
  {
    name: '(legacy) basic mouse click',
    prepare: (testArea) => {
      const canvasElement = document.createElement('canvas');
      testArea.appendChild(canvasElement);
      const crosshairCanvas = new CrosshairCanvas(canvasElement, crosshairCanvasConfig);
      addEventsLegacy(canvasElement, {
        onClick: (eventInfo) => {
          console.log(eventInfo);
          crosshairCanvas.setCrosshairPosition({x: eventInfo.x, y: eventInfo.y});
        },
        centerOrigin: false,
      });
    }
  },
  {
    name: '(legacy) basic mouse drag',
    prepare: (testArea) => {
      const canvasElement = document.createElement('canvas');
      testArea.appendChild(canvasElement);
      const crosshairCanvas = new CrosshairCanvas(canvasElement, crosshairCanvasConfig);
      addEventsLegacy(canvasElement, {
        onDragStart: (eventInfo) => {
          console.log(eventInfo);
          crosshairCanvas.setCrosshairPosition({x: eventInfo.x, y: eventInfo.y});
        },
        onDragMove: (eventInfo) => {
          console.log(eventInfo);
          crosshairCanvas.setCrosshairPosition({x: eventInfo.x, y: eventInfo.y});
        },
        onDragCancel: (eventInfo) => {
          console.log(eventInfo);
          crosshairCanvas.setCrosshairPosition(null);
        },
        onDragEnd: (eventInfo) => {
          console.log(eventInfo);
          crosshairCanvas.setCrosshairPosition(null);
        },
        centerOrigin: false,
      });
    }
  },
  {
    name: '(legacy) basic touch drag',
    prepare: (testArea) => {
      const canvasElement = document.createElement('canvas');
      testArea.appendChild(canvasElement);
      const crosshairCanvas = new CrosshairCanvas(canvasElement, crosshairCanvasConfig);
      addEventsLegacy(canvasElement, {
        onTouchStart: (eventInfo) => {
          console.log(eventInfo);
          crosshairCanvas.setCrosshairPosition({x: eventInfo.x, y: eventInfo.y});
        },
        onTouchMove: (eventInfo) => {
          console.log(eventInfo);
          crosshairCanvas.setCrosshairPosition({x: eventInfo.x, y: eventInfo.y});
        },
        onTouchCancel: (eventInfo) => {
          console.log(eventInfo);
          crosshairCanvas.setCrosshairPosition(null);
        },
        onTouchEnd: (eventInfo) => {
          console.log(eventInfo);
          crosshairCanvas.setCrosshairPosition(null);
        },
        centerOrigin: false,
      });
    }
  },
  {
    name: '(legacy) mouse click no cache',
    prepare: (testArea) => {
      const canvasElement = document.createElement('canvas');
      testArea.appendChild(canvasElement);
      const crosshairCanvas = new CrosshairCanvas(canvasElement, crosshairCanvasConfig);
      addEventsLegacy(canvasElement, {
        onClick: (eventInfo) => {
          console.log(eventInfo);
          crosshairCanvas.setCrosshairPosition({x: eventInfo.x, y: eventInfo.y});
        },
        centerOrigin: false,
        cachePosition: false,
        cacheSize: false
      });
    }
  },
  {
    name: '(new) basic mouse click',
    prepare: (testArea) => {
      const canvasElement = document.createElement('canvas');
      testArea.appendChild(canvasElement);
      const crosshairCanvas = new CrosshairCanvas(canvasElement, crosshairCanvasConfig);
      addEvents(canvasElement, {
        onClick(eventInfo) {
          console.log(eventInfo);
          crosshairCanvas.setCrosshairPosition(eventInfo.mouse.position);
        }
      });
    }
  },
  {
    name: '(new) mouse down/up',
    prepare: (testArea) => {
      const canvasElement = document.createElement('canvas');
      testArea.appendChild(canvasElement);
      const crosshairCanvas = new CrosshairCanvas(canvasElement, crosshairCanvasConfig);
      addEvents(canvasElement, {
        onMouseDown(eventInfo) {
          console.log(eventInfo);
          crosshairCanvas.setCrosshairPosition(eventInfo.mouse.position);
        },
        onMouseUp(eventInfo) {
          console.log(eventInfo);
          crosshairCanvas.setCrosshairPosition(eventInfo.mouse.position);
        }
      });
    }
  },
  {
    name: '(new) mouse move',
    prepare: (testArea) => {
      const canvasElement = document.createElement('canvas');
      testArea.appendChild(canvasElement);
      const crosshairCanvas = new CrosshairCanvas(canvasElement, crosshairCanvasConfig);
      addEvents(canvasElement, {
        onMouseMove(eventInfo) {
          console.log(eventInfo);
          crosshairCanvas.setCrosshairPosition(eventInfo.mouse.position);
        },
      });
    }
  },
  {
    name: '(new) mouse over/out',
    prepare: (testArea) => {
      const canvasElement = document.createElement('canvas');
      testArea.appendChild(canvasElement);
      const crosshairCanvas = new CrosshairCanvas(canvasElement, crosshairCanvasConfig);
      addEvents(canvasElement, {
        onMouseOver(eventInfo) {
          console.log(eventInfo);
          crosshairCanvas.setCrosshairPosition(eventInfo.mouse.position);
        },
        onMouseOut(eventInfo) {
          console.log(eventInfo);
          crosshairCanvas.setCrosshairPosition(eventInfo.mouse.position);
        }
      });
    }
  },
  {
    name: '(new) mouse move/over/out',
    prepare: (testArea) => {
      const canvasElement = document.createElement('canvas');
      testArea.appendChild(canvasElement);
      const crosshairCanvas = new CrosshairCanvas(canvasElement, crosshairCanvasConfig);
      addEvents(canvasElement, {
        onMouseMove(eventInfo) {
          console.log(eventInfo);
          crosshairCanvas.setCrosshairPosition(eventInfo.mouse.position);
        },
        onMouseOver(eventInfo) {
          console.log(eventInfo);
          crosshairCanvas.setCrosshairPosition(eventInfo.mouse.position);
        },
        onMouseOut(eventInfo) {
          console.log(eventInfo);
          crosshairCanvas.setCrosshairPosition();
        }
      });
    }
  },
  {
    name: '(new) keyboard keyUp',
    prepare: (testArea) => {
      const keyInfoElement = document.createElement('div');
      testArea.appendChild(keyInfoElement);
      addEvents(keyInfoElement, {
        onKeyUp(eventInfo) {
          console.log(eventInfo);
          keyInfoElement.textContent = JSON.stringify(eventInfo.keyboard);
        }
      });
    }
  }
];

testScenarios[8].prepare(prepareTestArea());
