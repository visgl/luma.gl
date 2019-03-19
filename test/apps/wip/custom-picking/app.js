/* global document */
import GL from '@luma.gl/constants';
import {AnimationLoop, Model, setParameters, project, picking, pickModels} from '@luma.gl/core';
import {Matrix4, radians} from 'math.gl';
import HeightmapGeometry from './heightmap-geometry';

let pickPosition = [0, 0];

function mousemove(e) {
  pickPosition = [e.offsetX, e.offsetY];
}

const animationLoop = new AnimationLoop({
  onInitialize: ({gl}) => {
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
    gl.canvas.removeEventListener('mousemove', mousemove);
  },
  onRender: ({gl, tick, aspect, heightmap, framebuffer}) => {
    const projection = new Matrix4().perspective({
      fov: radians(60),
      aspect,
      near: 0.1,
      far: 1000
    });
    const view = new Matrix4().lookAt({eye: [0, 1.5, 0.75], center: [0, 0.5, 0]});
    const model = view.clone().rotateY(tick * 0.01);

    heightmap.setUniforms({
      projectionMatrix: projection,
      viewMatrix: view,
      modelMatrix: model,
      hasPickingColors: true
    });

    const pickInfo = pickModels(gl, {
      models: [heightmap],
      position: pickPosition,
      framebuffer
    });

    updatePickInfo(gl, pickInfo);

    heightmap
      .setModuleUniforms({
        selectedPickingColor: pickInfo && pickInfo.color
      })
      .draw();
  }
});

function updatePickInfo(gl, pickInfo) {
  const div =
    document.getElementById('pick-info') || gl.canvas.appendChild(document.createElement('div'));
  div.id = 'pick-info';

  if (pickInfo) {
    div.innerHTML = `altitude: ${pickInfo.color[0]}`;
    div.style.top = `${pickPosition[0]}px`;
    div.style.left = `${pickPosition[1]}px`;
    div.style.display = 'block';
  } else {
    div.style.display = 'none';
  }
}

animationLoop.getInfo = () => {
  return `
    <p>
    Custom Picking on a grid
    <p>
    Uses the luma.gl <code>picking</code> shader module,
    adding detailed picking capabilities to a complex model with
    a few lines of code.
    <div id='pick-info'/>
  `;
};

export default animationLoop;

/* expose on Window for standalone example */
/* global window */
if (typeof window !== 'undefined') {
  window.animationLoop = animationLoop;
}
