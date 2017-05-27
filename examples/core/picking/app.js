/* global document */
import {
  GL, AnimationLoop, Matrix4, Vector3, radians,
  loadTextures, Buffer, Sphere, Framebuffer, Scene, pickModels
} from 'luma.gl';

const pick = {x: 0, y: 0};

let scene;
let framebuffer = null;

const animationLoop = new AnimationLoop({
  onInitialize: ({gl, canvas}) => {
    gl.enable(GL.DEPTH_TEST);
    gl.depthFunc(GL.LEQUAL);

    framebuffer = new Framebuffer(gl);

    canvas.addEventListener('mousemove', function mousemove(e) {
      pick.x = e.offsetX;
      pick.y = e.offsetY;
    });

    const PLANETS = [
      {name: 'Jupiter', textureUrl: 'jupiter.jpg'},
      {name: 'Mars', textureUrl: 'mars.jpg'},
      {name: 'Mercury', textureUrl: 'mercury.jpg'},
      {name: 'Neptune', textureUrl: 'neptune.jpg'},
      {name: 'Saturn', textureUrl: 'saturn.jpg'},
      {name: 'Uranus', textureUrl: 'uranus.jpg'},
      {name: 'Venus', textureUrl: 'venus.jpg'}
    ];

    return loadTextures(gl, {
      urls: PLANETS.map(planet => planet.textureUrl),
      parameters: {
        magFilter: gl.LINEAR,
        minFilter: gl.LINEAR_MIPMAP_NEAREST,
        generateMipmap: true
      }
    })
    .then(textures => PLANETS.map(
      (planet, i) => new Sphere({
        gl,
        id: planet.name,
        nlat: 32,
        nlong: 32,
        radius: 1,
        pickable: true,
        uniforms: {
          sampler1: textures[i],
          hasTexture1: true,
          hasTextureCube1: false,
          colors: [1, 1, 1, 1],
          position: new Vector3(
            Math.cos(i / PLANETS.length * Math.PI * 2) * 3,
            Math.sin(i / PLANETS.length * Math.PI * 2) * 3,
            0
          )
        },
        attributes: {
          colors: new Buffer(gl, {size: 4, data: new Float32Array(10000)}),
          pickingColors: new Buffer(gl, {size: 3, data: new Float32Array(10000)})
        }
      })
    ))
    .then(planets => ({planets}));
  },
  onRender: ({gl, aspect, planets}) => {
    const uniforms = {
      projectionMatrix: Matrix4.perspective({fov: radians(15), aspect}),
      viewMatrix: Matrix4.lookAt({eye: [0, 0, 32]})
    };

    // for (const item of scene.children) {
    //   item.rotation.y += 0.01;
    //   item.updateMatrix();
    // }

    planets.forEach(planet => planet.render(uniforms));

    // const pickedModel = pickModels(gl, {
    //   group: scene,
    //   uniforms,
    //   x: pick.x,
    //   y: pick.y,
    //   framebuffer
    // });

    // const div = document.getElementById('planet-name');
    // if (pickedModel) {
    //   div.innerHTML = pickedModel.model.id;
    //   div.style.top = `${pick.y}px`;
    //   div.style.left = `${pick.x}px`;
    //   div.style.display = 'block';
    // } else {
    //   div.style.display = 'none';
    // }
  }
});

export default animationLoop;

/* expose on Window for standalone example */
/* global window */
if (typeof window !== 'undefined') {
  window.animationLoop = animationLoop;
}
