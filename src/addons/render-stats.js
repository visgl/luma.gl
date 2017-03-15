/* eslint-disable */
// An adaptation of the THREE.js stats helpers (MIT licensed)
// https://github.com/mrdoob/stats.js
// https://github.com/jeromeetienne/threex.rendererstats

/**
 * @author mrdoob / http://mrdoob.com/
 */

/* global document, window */
const PR = Math.round(window.devicePixelRatio || 1);

const WIDTH = 80 * PR;
const HEIGHT = 48 * PR;
const TEXT_X = 3 * PR;
const TEXT_Y = 2 * PR;
const GRAPH_X = 3 * PR;
const GRAPH_Y = 15 * PR;
const GRAPH_WIDTH = 74 * PR;
const GRAPH_HEIGHT = 30 * PR;

export class Panel {

  /* eslint-disable max-statements */
  constructor(name, fg, bg) {
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    canvas.style.cssText = 'width:80px;height:48px';

    const context = canvas.getContext('2d');
    context.font = `bold ${9 * PR}px Helvetica,Arial,sans-serif`;
    context.textBaseline = 'top';

    context.fillStyle = bg;
    context.fillRect(0, 0, WIDTH, HEIGHT);

    context.fillStyle = fg;
    context.fillText(name, TEXT_X, TEXT_Y);
    context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);

    context.fillStyle = bg;
    context.globalAlpha = 0.9;
    context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT);

    this.name = name;
    this.fg = fg;
    this.bg = bg;
    this.context = context;
    this.dom = canvas;
  }
  /* eslint-enable max-statements */

  update({value, maxValue}) {
    const min = Math.min(min, value);
    const max = Math.max(max, value);

    this.context.fillStyle = this.bg;
    this.context.globalAlpha = 1;
    this.context.fillRect(0, 0, WIDTH, GRAPH_Y);
    this.context.fillStyle = this.fg;

    const round = Math.round;
    this.context.fillText(
      `${round(value)} ${this.name} (${round(min)}-${round(max)})`,
      TEXT_X,
      TEXT_Y
    );

    this.context.drawImage(
      this.canvas,
      GRAPH_X + PR, GRAPH_Y,
      GRAPH_WIDTH - PR,
      GRAPH_HEIGHT,
      GRAPH_X,
      GRAPH_Y,
      GRAPH_WIDTH - PR,
      GRAPH_HEIGHT
    );

    this.context.fillRect(
      GRAPH_X + GRAPH_WIDTH - PR,
      GRAPH_Y,
      PR,
      GRAPH_HEIGHT
    );

    this.context.fillStyle = this.bg;
    this.context.globalAlpha = 0.9;
    this.context.fillRect(
      GRAPH_X + GRAPH_WIDTH - PR,
      GRAPH_Y,
      PR,
      Math.round((1 - (value / maxValue)) * GRAPH_HEIGHT)
    );
  }
}

export default class Stats {

  constructor() {
    this.performance = window.performance;

    this.mode = 0;

    const container = document.createElement('div');
    container.style.cssText =
      'position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000';

    container.addEventListener('click', event => {
      event.preventDefault();
      this.showPanel(++this.mode % this.container.children.length);
    }, false);

    //
    this.beginTime = (this.performance || Date).now();
    this.prevTime = this.beginTime;
    this.frames = 0;

    this.fpsPanel = this.addPanel(new Stats.Panel('FPS', '#0ff', '#002'));
    this.msPanel = this.addPanel(new Stats.Panel('MS', '#0f0', '#020'));
    if (this.performance && this.performance.memory) {
      this.memPanel = this.addPanel(new Stats.Panel('MB', '#f08', '#201'));
    }

    this.showPanel(0);

    this.dom = container;
  }

  addPanel(panel) {
    this.container.appendChild(panel.dom);
    return panel;

  }

  // Shows selected panel and hides all others
  showPanel(id) {
    this.container.children.forEach(
      (child, i) => child.display = (i === id) ? 'block' : 'none'
    );
    this.mode = id;
  }

  setMode(id) {
    this.showPanel(id);
  }

  beginFrame() {
    this.beginTime = (this.performance || Date).now();
  }

  endFrame() {
    this.frames++;

    const time = (this.performance || Date).now();

    this.msPanel.update(time - this.beginTime, 200);

    const deltaTime = time - this.prevTime;
    if (deltaTime > 1000) {
      this.fpsPanel.update({
        value: this.frames * deltaTime / 1000,
        maxValue: 100
      });

      this.prevTime = time;
      this.frames = 0;

      if (this.memPanel) {
        const memory = this.performance.memory;
        this.memPanel.update({
          value: memory.usedJSHeapSize / 1048576,
          maxValue: memory.jsHeapSizeLimit / 1048576
        });
      }

    }

    return time;
  }

  update() {
    this.beginTime = this.end();
  }
}

/**
 * @author mrdoob / http://mrdoob.com/
 * @author jetienne / http://jetienne.com/
 */
/** global document */

export class RendererStats {
  /**
   * Provide info on THREE.WebGLRenderer
   *
   * @param {Object} renderer the renderer to update
   * @param {Object} Camera the camera to update
  */
  constructor() {
    const container = document.createElement('div');
    container.style.cssText = 'width:80px;opacity:0.9;cursor:pointer';

    const msDiv = document.createElement('div');
    msDiv.style.cssText = 'padding:0 0 3px 3px;text-align:left;backgound-color:#200;';
    container.appendChild(msDiv);

    const msText = document.createElement('div');
    msText.style.cssText = 'color:#f00;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px';
    msText.innerHTML = 'Render Stats';
    msDiv.appendChild(msText);

    this.msTexts = [];
    this.nLines = 9;
    for (let i = 0; i < this.nLines; i++) {
      this.msTexts[i] = document.createElement('div');
      this.msTexts[i].style.cssText = 'color:#f00;background-color:#311;font-family:Helvetica,Arial,sans-serif;font-size:9px;font-weight:bold;line-height:15px';
      this.msTexts[i].innerHTML = '-';
      msDiv.appendChild(this.msTexts[i]);
    }

    this.lastTime = Date.now();
    this.domElement = container;
  }

  update(info) {
    // refresh only 30time per second
    if (Date.now() - this.lastTime < 1000 / 30) {
      return;
    }
    this.lastTime = Date.now();

    let i = 0;
    this.msTexts[i++].textContent = `== Memory ==`;
    this.msTexts[i++].textContent = `Programs: ${info.memory.programs}`;
    this.msTexts[i++].textContent = `Geometries: ${info.memory.geometries}`;
    this.msTexts[i++].textContent = `Textures: ${info.memory.textures}`;

    this.msTexts[i++].textContent = `== Render ==`;
    this.msTexts[i++].textContent = `Calls: ${info.render.calls}`;
    this.msTexts[i++].textContent = `Vertices: ${info.render.vertices}`;
    this.msTexts[i++].textContent = `Faces: ${info.render.faces}`;
    this.msTexts[i++].textContent = `Points: ${info.render.points}`;
  }
}
