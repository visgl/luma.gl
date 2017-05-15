/* global document */
import {GL, AnimationLoop, Scene, Model, Program, Shaders, Matrix4, radians} from 'luma.gl';
import HeightmapGeometry from './heightmap-geometry';

let scene;
let heightmap;
const pick = {x: 0, y: 0};

const animationLoop = new AnimationLoop({
  onInitialize: ({gl}) => {
    gl.enable(GL.DEPTH_TEST);
    gl.depthFunc(GL.LEQUAL);

    scene = new Scene(gl, {
      lights: {
        points: {
          color: {r: 1, g: 1, b: 1},
          position: {x: 0, y: 0, z: 32}
        },
        ambient: {r: 0.25, g: 0.25, b: 0.25},
        enable: true
      },
      backgroundColor: {r: 0, g: 0, b: 0, a: 0}
    });

    gl.canvas.addEventListener('mousemove', function mousemove(e) {
      pick.x = e.offsetX;
      pick.y = e.offsetY;
    });

    heightmap = new Model({
      id: 'heightmap',
      program: new Program(gl, Shaders),
      geometry: new HeightmapGeometry()
    });

    scene.add(heightmap);
  },
  onRender: ({tick, aspect}) => {
    const projection = Matrix4.perspective({
      fov: radians(60), aspect, near: 0.1, far: 1000
    });

    const view = Matrix4.lookAt({eye: [0, 1.5, 0.75], center: [0, 0.5, 0]});
    const model = new Matrix4().clone(view).rotateY(tick * 0.01);

    const uniforms = {
      projectionMatrix: projection,
      viewMatrix: view,
      modelMatrix: model,
      hasPickingColors: true
    };

    // var div = document.getElementById('altitude');
    // if (div)
    const pickInfo = scene.pickModels({
      uniforms,
      x: pick.x,
      y: pick.y
    });

    // if (pickInfo) {
    //   div.innerHTML = `altitude: ${pickInfo.color[0]}`;
    //   div.style.top = `${pick.y}px`;
    //   div.style.left = `${pick.x}px`;
    //   div.style.display = 'block';
    // } else {
    //   div.style.display = 'none';
    // }

    scene.render(uniforms);
  },
  onAddControls: ({parent}) => {
    const controls = document.createElement('div');
    controls.id = 'controls';
    controls.innerHTML = `title`;
    parent.appendChild(controls);
  }
});

export default animationLoop;

/* expose on Window for standalone example */
/* global window */
if (typeof window !== 'undefined') {
  window.animationLoop = animationLoop;
}

