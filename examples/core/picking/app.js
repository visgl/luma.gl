import {
  GL, AnimationLoop, setParameters, loadTextures, Buffer, Matrix4, radians,
  Sphere, project, diffuse, picking, pickModels, ShaderCache
} from 'luma.gl';

const PLANETS = [
  {name: 'Jupiter', textureUrl: 'jupiter.jpg'},
  {name: 'Mars', textureUrl: 'mars.jpg'},
  {name: 'Mercury', textureUrl: 'mercury.jpg'},
  {name: 'Neptune', textureUrl: 'neptune.jpg'},
  {name: 'Saturn', textureUrl: 'saturn.jpg'},
  {name: 'Uranus', textureUrl: 'uranus.jpg'},
  {name: 'Venus', textureUrl: 'venus.jpg'}
];

let pickPosition = [0, 0];

const animationLoop = new AnimationLoop({
  onInitialize: ({gl, canvas}) => {
    // Use non zero pickingColor to identify if the model has been picked or not.
    const pickingColorsData = new Float32Array(10000).fill(1.0);

    const shaderCache = new ShaderCache({gl});

    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      clearDepth: 1,
      depthTest: true,
      depthFunc: GL.LEQUAL
    });

    canvas.addEventListener('mousemove', function mousemove(e) {
      pickPosition = [e.offsetX, e.offsetY];
    });

    canvas.addEventListener('mouseleave', function mouseleave(e) {
      pickPosition = null;
    });

    return loadTextures(gl, {
      urls: PLANETS.map(planet => planet.textureUrl),
      mipmaps: true,
      parameters: {
        [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
        [gl.TEXTURE_MIN_FILTER]: gl.LINEAR_MIPMAP_NEAREST
      }
    })
    .then(textures => PLANETS.map(
      (planet, i) => new Sphere(gl, {
        id: planet.name,
        nlat: 32,
        nlong: 32,
        radius: 1,
        pickable: true,
        attributes: {
          colors: new Buffer(gl, {size: 4, data: new Float32Array(10000)}),
          pickingColors: new Buffer(gl, {size: 3, data: pickingColorsData})
        },
        modules: [project, diffuse, picking],
        moduleSettings: {
          diffuseTexture: textures[i],
          pickingThreshold: 0
        },
        shaderCache
      })
      .setPosition([
        Math.cos(i / PLANETS.length * Math.PI * 2) * 3,
        Math.sin(i / PLANETS.length * Math.PI * 2) * 3,
        0
      ])
    ))
    .then(planets => ({
      planets
    }));
  },
  onRender: ({gl, aspect, planets, framebuffer}) => {
    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    const projectionMatrix = new Matrix4().perspective({fov: radians(75), aspect});
    const viewMatrix = new Matrix4().lookAt({eye: [0, 0, 8]});

    for (const planet of planets) {
      planet.rotation[1] += 0.01;
      planet.updateMatrix();
      planet.updateModuleSettings({
        modelMatrix: planet.matrix,
        viewMatrix,
        projectionMatrix
      });
      planet.render();
    }

    const pickedModel = pickPosition && pickModels(gl, {
      models: planets,
      position: pickPosition,
      framebuffer
    });

    const div = document.getElementById('planet-name');
    if (pickedModel && div) {
      div.innerHTML = pickedModel.model.id;
      div.style.top = `${pickPosition[0]}px`;
      div.style.left = `${pickPosition[1]}px`;
      div.style.display = 'block';
      div.style.fontWeight = 'bold';
    } else if (div) {
      div.style.display = 'none';
    }
  }
});

animationLoop.getInfo = () => {
  return `
    <p>
    Basic color picking of multiple models
    <p>
    Uses the luma.gl <code>picking</code> shader module
    <div id='planet-name'/>
  `;
};

export default animationLoop;

/* expose on Window for standalone example */
/* global window */
if (typeof window !== 'undefined') {
  window.animationLoop = animationLoop;
}
