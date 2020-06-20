import {Matrix4} from 'math.gl';

// Simple controller that keeps updating translation and rotation
export default class Controller {
  constructor(canvas, {initialZoom = 3, onDrop = file => {}} = {}) {
    this.mouse = {
      lastX: 0,
      lastY: 0
    };

    this.translate = initialZoom;
    this.rotation = [0, 0];
    this.rotationStart = [0, 0];

    this._initializeEventHandling(canvas);
  }

  getMatrices() {
    const [pitch, roll] = this.rotation;

    const viewMatrix = new Matrix4()
      .translate([0, 0, -this.translate])
      .rotateX(pitch)
      .rotateY(roll);

    return {
      viewMatrix
    };
  }

  _initializeEventHandling(canvas) {
    canvas.onwheel = e => {
      this.translate += e.deltaY / 10;
      if (this.translate < 0.1) {
        this.translate = 0.1;
      }
      e.preventDefault();
    };

    canvas.onpointerdown = e => {
      this.mouse.lastX = e.clientX;
      this.mouse.lastY = e.clientY;

      this.rotationStart[0] = this.rotation[0];
      this.rotationStart[1] = this.rotation[1];

      canvas.setPointerCapture(e.pointerId);
      e.preventDefault();
    };

    canvas.onpointermove = e => {
      if (e.buttons) {
        const dX = e.clientX - this.mouse.lastX;
        const dY = e.clientY - this.mouse.lastY;

        this.rotation[0] = this.rotationStart[0] + dY / 100;
        this.rotation[1] = this.rotationStart[1] + dX / 100;
      }
    };
  }
}
