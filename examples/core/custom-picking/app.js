/* global document */
import {
  GL, AnimationLoop, setParameters, Matrix4, radians,
  Model, project, picking, pickModels} from 'luma.gl';
import HeightmapGeometry from './heightmap-geometry';

const pick = {x: 0, y: 0};

function mousemove(e) {
  pick.x = e.offsetX;
  pick.y = e.offsetY;
}

const animationLoop = new AnimationLoop({
  onInitialize: ({gl}) => {
    addControls();

    setParameters(gl, {
      depthTest: true,
      depthFunc: GL.LEQUAL
    });

    gl.canvas.addEventListener('mousemove', mousemove);

    const heightmap = new Model(gl, {
      id: 'heightmap',
      modules: [project, picking],
      geometry: new HeightmapGeometry()
    });

    return {heightmap};
  },
  onFinalize({gl}) {
    gl.canvas.removeEventListener(mousemove);
  },
  onRender: ({gl, tick, aspect, heightmap}) => {
    const projection = Matrix4.perspective({
      fov: radians(60), aspect, near: 0.1, far: 1000
    });

    const view = Matrix4.lookAt({eye: [0, 1.5, 0.75], center: [0, 0.5, 0]});
    const model = new Matrix4().clone(view).rotateY(tick * 0.01);

    heightmap.setUniforms({
      projectionMatrix: projection,
      viewMatrix: view,
      modelMatrix: model,
      hasPickingColors: true
    });

    const pickInfo = pickModels(gl, {
      models: [heightmap],
      x: pick.x,
      y: pick.y
    });

    updatePickInfo(gl, pickInfo);

    heightmap.render();
  }
});

function updatePickInfo(gl, pickInfo) {
  const div = document.getElementById('pick-info') ||
    gl.canvas.appendChild(document.createElement('div'));
  div.id = 'pick-info';

  if (pickInfo && div) {
    div.innerHTML = `altitude: ${pickInfo.color[0]}`;
    div.style.top = `${pick.y}px`;
    div.style.left = `${pick.x}px`;
    div.style.display = 'block';
  } else {
    div.style.display = 'none';
  }
}

function addControls() {
  /* global document */
  const controlPanel = document.querySelector('.control-panel');
  if (controlPanel) {
    controlPanel.innerHTML = `
      <p>
      Custom Picking on a grid
      <p>
      Uses the luma.gl <code>picking</code> shader module,
      adding detailed picking capabilities to a complex model with
      a few lines of code.
    `;
  }
}

export default animationLoop;

/* expose on Window for standalone example */
/* global window */
if (typeof window !== 'undefined') {
  window.animationLoop = animationLoop;
}

