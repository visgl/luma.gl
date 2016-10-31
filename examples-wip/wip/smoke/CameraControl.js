function CameraControl(camera) {
  this.camera = camera;
  this.dragStart = [];
}

CameraControl.prototype = {
  onMouseWheel: function(e) {
    var position = this.camera.position,
        R = Math.sqrt(position.x * position.x + position.y * position.y + position.z * position.z),
        theta = Math.atan2(position.y, position.x),
        alpha = Math.atan2(position.z, Math.sqrt(position.x * position.x + position.y * position.y));
    R = Math.max(1.5, Math.min(14, R - e.wheel * 0.1));
    position.x = Math.cos(theta) * Math.cos(alpha) * R;
    position.y = Math.sin(theta) * Math.cos(alpha) * R;
    position.z = Math.sin(alpha) * R;
    this.camera.update();
    e.event.preventDefault();
    e.event.stopPropagation();
  },

  onDragStart: function(e) {
    this.dragStart = [e.x, e.y];
  },

  onDragMove: function(e) {
    var dx = e.x - this.dragStart[0],
        dy = e.y - this.dragStart[1];
    this.dragStart = [e.x, e.y];
    var position = this.camera.position,
        R = Math.sqrt(position.x * position.x + position.y * position.y + position.z * position.z),
        theta = Math.atan2(position.y, position.x),
        alpha = Math.atan2(position.z, Math.sqrt(position.x * position.x + position.y * position.y));
    alpha = Math.min(90 / 180 * Math.PI, Math.max(-10 / 180 * Math.PI, alpha - dy / 200));
    theta -= dx / 200;
    position.x = Math.cos(theta) * Math.cos(alpha) * R;
    position.y = Math.sin(theta) * Math.cos(alpha) * R;
    position.z = Math.sin(alpha) * R;
    this.camera.update();
  }
};
