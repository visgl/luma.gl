/* global document */
import GL from '@luma.gl/constants';
import {
  AnimationLoop,
  setParameters,
  Texture2D,
  Buffer,
  Sphere,
  project,
  diffuse,
  picking,
  pickModels,
  _ShaderCache as ShaderCache
} from '@luma.gl/core';
import {Matrix4, radians} from 'math.gl';

const INFO_HTML = `
<p>
  Basic color picking of multiple models
<p>
Uses the luma.gl <code>picking</code> shader module
<div id='planet-name'/>
`;

const PLANETS = [
  {name: 'Jupiter', textureUrl: 'jupiter.jpg'},
  {name: 'Mars', textureUrl: 'mars.jpg'},
  {name: 'Mercury', textureUrl: 'mercury.jpg'},
  {name: 'Neptune', textureUrl: 'neptune.jpg'},
  {name: 'Saturn', textureUrl: 'saturn.jpg'},
  {name: 'Uranus', textureUrl: 'uranus.jpg'},
  {name: 'Venus', textureUrl: 'venus.jpg'}
];

let pickedModelId = '';
function createModelForPlanet(gl, shaderCache, planet) {
  const diffuseTexture = new Texture2D(gl, {
    data: planet.textureUrl,
    mipmaps: true,
    parameters: {
      [gl.TEXTURE_MAG_FILTER]: gl.LINEAR,
      [gl.TEXTURE_MIN_FILTER]: gl.LINEAR_MIPMAP_NEAREST
    }
  });

  return new Sphere(gl, {
    id: planet.name,
    nlat: 32,
    nlong: 32,
    radius: 1,
    pickable: true,
    modules: [project, diffuse, picking],
    moduleSettings: {
      diffuseTexture,
      pickingThreshold: 0
    },
    attributes: {
      // Just use non zero pickingColor to identify if the model has been picked or not.
      // TODO - remove when Scenegraph properly implements picking
      pickingColors: {constant: true, value: new Float32Array([1.0, 1.0, 1.0])}
    },
    shaderCache
  });
}

const animationLoop = new AnimationLoop({
  createFramebuffer: true,
  onInitialize: ({gl, canvas}) => {
    const shaderCache = new ShaderCache({gl});

    setParameters(gl, {
      clearColor: [0, 0, 0, 1],
      clearDepth: 1,
      depthTest: true,
      depthFunc: GL.LEQUAL
    });

    return {
      planets: PLANETS.map((planet, i) =>
        createModelForPlanet(gl, shaderCache, planet).setPosition([
          Math.cos((i / PLANETS.length) * Math.PI * 2) * 3,
          Math.sin((i / PLANETS.length) * Math.PI * 2) * 3,
          0
        ])
      )
    };
  },
  onRender: ({gl, aspect, planets, framebuffer, useDevicePixels, _mousePosition}) => {
    gl.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);

    const projectionMatrix = new Matrix4().perspective({fov: radians(75), aspect});
    const viewMatrix = new Matrix4().lookAt({eye: [0, 0, 8]});

    for (const planet of planets) {
      planet.rotation[1] += 0.01;
      planet.updateMatrix();
      planet.draw({
        moduleSettings: {
          modelMatrix: planet.matrix,
          viewMatrix,
          projectionMatrix,
          pickingSelectedColor: planet.id === pickedModelId ? [1, 1, 1] : null,
          pickingThreshold: 1
        }
      });
    }

    const pickedModel =
      _mousePosition &&
      pickModels(gl, {
        models: planets,
        position: _mousePosition,
        framebuffer,
        useDevicePixels
      });

    pickedModelId = pickedModel ? pickedModel.model.id : null;

    const div = typeof document === 'undefined' ? null : document.getElementById('planet-name');
    if (pickedModel && div) {
      div.innerHTML = pickedModel.model.id;
      div.style.left = `${_mousePosition[0]}px`;
      div.style.top = `${_mousePosition[1]}px`;
      div.style.display = 'block';
      div.style.fontWeight = 'bold';
    } else if (div) {
      div.style.display = 'none';
    }
  }
});

animationLoop.getInfo = () => INFO_HTML;

export default animationLoop;

/* global window */
if (typeof window !== 'undefined' && !window.website) {
  animationLoop.start();
}
