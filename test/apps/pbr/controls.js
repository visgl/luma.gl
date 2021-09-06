// ***** Mouse Controls ***** //
// eslint-disable-next-line
class Controls {
  constructor(canvas, redraw) {
    // Set control callbacks
    canvas.onmousedown = (ev) => this._handleMouseDown(ev);
    document.onmouseup = (ev) => this._handleMouseUp(ev);
    document.onmousemove = (ev) => this._handleMouseMove(ev, redraw);
    document.onwheel = (ev) => this._handleWheel(ev, redraw);

    this.lastMouseX = null;
    this.lastMouseY = null;

    this.wheelSpeed = 1.04;

    this.resetCamera();
  }

  resetCamera() {
    this.roll = Math.PI;
    this.pitch = 0.0;
    this.translate = 4.0;
    this.mouseDown = false;
  }

  _handleMouseDown(ev) {
    this.mouseDown = true;
    this.lastMouseX = ev.clientX;
    this.lastMouseY = ev.clientY;
  }

  _handleMouseUp(ev) {
    this.mouseDown = false;
  }

  _handleMouseMove(ev, redraw) {
    if (!this.mouseDown) {
      return;
    }

    const newX = ev.clientX;
    const newY = ev.clientY;

    const deltaX = newX - this.lastMouseX;
    this.roll += deltaX / 100.0;

    const deltaY = newY - this.lastMouseY;
    this.pitch += deltaY / 100.0;

    this.lastMouseX = newX;
    this.lastMouseY = newY;

    redraw();
  }

  _handleWheel(ev, redraw) {
    ev.preventDefault();
    if (ev.deltaY > 0) {
      this.translate *= this.wheelSpeed;
    } else {
      this.translate /= this.wheelSpeed;
    }

    redraw();
  }
}
