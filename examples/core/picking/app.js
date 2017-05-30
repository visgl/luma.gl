import {
  GL, AnimationLoop, Matrix4, Vector3, radians,
  loadTextures, Buffer, Sphere, Framebuffer, pickModels
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
      mipmaps: true,
      parameters: {
        [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
        [gl.TEXTURE_MIN_FILTER]: gl.LINEAR_MIPMAP_NEAREST
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
        attributes: {
          colors: new Buffer(gl, {size: 4, data: new Float32Array(10000)}),
          pickingColors: new Buffer(gl, {size: 3, data: new Float32Array(10000)})
        },
        uniforms: {
          sampler1: textures[i],
          hasTexture1: true,
          hasTextureCube1: false,
          colors: [1, 1, 1, 1]
        }
      })
      .setPosition([
        Math.cos(i / PLANETS.length * Math.PI * 2) * 3,
        Math.sin(i / PLANETS.length * Math.PI * 2) * 3,
        0
      ])
      .updateMatrix()
    ))
    .then(planets => ({
      planets
    }));
  },
  onRender: ({gl, aspect, planets}) => {
    const uniforms = {
      projectionMatrix: Matrix4.perspective({fov: radians(75), aspect}),
      viewMatrix: Matrix4.lookAt({eye: [0, 0, 32]})
    };

    for (const planet of planets) {
      planet.rotation.y += 0.01;
      planet.updateMatrix();
    }

    planets.forEach(planet => planet.render(
      Object.assign({}, uniforms, {modelMatrix: planet.matrix})
    ));

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
