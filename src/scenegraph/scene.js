// Scene Object management and rendering
/* eslint-disable max-statements */

import {Camera} from '../camera';
import {Program, Framebuffer} from '../webgl';
import {Vec3} from '../math';
import {merge} from '../utils';
import makeProgramFromDefaultShaders from '../addons/helpers';
import * as config from '../config';
import Group from './group';
import assert from 'assert';

function noop() {}

const DEFAULT_SCENE_OPTS = {
  lights: {
    enable: false,
    // ambient light
    ambient: {r: 0.2, g: 0.2, b: 0.2},
    // directional light
    directional: {
      direction: {x: 1, y: 1, z: 1},
      color: {r: 0, g: 0, b: 0}
    }
    // point light
    // points: []
  },
  effects: {
    fog: false
    // { near, far, color }
  },
  clearColor: true,
  clearDepth: true,
  backgroundColor: {r: 0, g: 0, b: 0, a: 1},
  backgroundDepth: 1
};

const INVALID_ARGUMENT = 'LumaGL.Scene invalid argument';

// Scene class
export default class Scene extends Group {

  constructor(gl, opts = {}) {
    assert(gl, INVALID_ARGUMENT);
    assert(!opts.program, 'LumaGL.Scene no longer supports "program" option');

    opts = merge(DEFAULT_SCENE_OPTS, opts);

    super(opts);

    this.gl = gl;
    this.config = opts;
  }

  getProgram(obj) {
    const program = obj ? obj.program : this.program;
    assert(program instanceof Program, 'Scene failed to find valid program');
    program.use();
    return program;
  }

  defineBuffers(obj) {
    const program = this.getProgram(obj);
    const prevDynamic = obj.dynamic;
    obj.dynamic = true;
    obj.setState(program);
    obj.dynamic = prevDynamic;
    obj.unsetState(program);
  }

  // Setup lighting and scene effects like fog, etc.
  beforeRender(program, camera) {
    this.setupLighting(program);
    this.setupEffects(program);
    if (camera) {
      this.camera.setStatus(program);
    }
  }

  clear(gl) {
    if (this.config.clearColor) {
      const bg = this.config.backgroundColor;
      gl.clearColor(bg.r, bg.g, bg.b, bg.a);
    }
    if (this.config.clearDepth) {
      gl.clearDepth(this.config.backgroundDepth);
    }
    if (this.config.clearColor && this.config.clearDepth) {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    } else if (this.config.clearColor) {
      gl.clear(gl.COLOR_BUFFER_BIT);
    } else if (this.config.clearDepth) {
      gl.clear(gl.DEPTH_BUFFER_BIT);
    }
  }

  // Renders all objects in the scene.
  render(gl, {camera, renderProgram,
    onBeforeRender = noop, onAfterRender = noop, ...opts} = {}) {

    assert(!camera || camera instanceof Camera);
    assert(renderProgram instanceof Program);

    this.clear(gl);

    // Go through each model and render it.
    let i = 0;
    for (const model of this.models) {
      if (model.display) {
        const program = renderProgram || this.getProgram(model);

        // Setup the beforeRender method for each object
        // when there are multiple programs to be used.
        this.beforeRender(program);
        model.onBeforeRender(program, camera);
        onBeforeRender(model, i);

        this.renderObject(gl, model, program);

        onAfterRender(model, i);
        model.onAfterRender(program, camera);

        i++;
      }
    }
  }

  renderObject(gl, model, program, camera) {
    model.setState(program);

    // Now set view and normal matrices
    const coordinateUniforms = model.getCoordinateUniforms(camera.view);
    program.setUniforms(coordinateUniforms);

    // Draw
    model.render(gl, program, this.camera);

    model.unsetState(program);
  }

  pick(x, y, opt = {}) {
    const gl = this.gl;

    if (this.pickingFBO === undefined) {
      this.pickingFBO = new Framebuffer(gl, {
        width: gl.canvas.width,
        height: gl.canvas.height
      });
    }

    if (this.pickingProgram === undefined) {
      this.pickingProgram =
        opt.pickingProgram || makeProgramFromDefaultShaders(gl);
    }

    let pickingProgram = this.pickingProgram;

    pickingProgram.use();
    pickingProgram.setUniform('enablePicking', true);
    pickingProgram.setUniform('hasPickingColors', false);

    this.pickingFBO.bind();

    let hash = {};

    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(x, gl.canvas.height - y, 1, 1);

    const oldClearColor = this.clearColor;
    const oldBackgroundColor = this.backgroundColor;
    this.clearColor = true;
    this.backgroundColor = {r: 0, g: 0, b: 0, a: 0};

    this.render({
      renderProgram: pickingProgram,
      onBeforeRender: function(elem, i) {
        i++;
        let r = i % 256;
        let g = ((i / 256) >> 0) % 256;
        let b = ((i / (256 * 256)) >> 0) % 256;
        hash[[r, g, b]] = elem;
        pickingProgram.setUniform('pickColor', [r / 255, g / 255, b / 255]);
      }
    });

    gl.disable(gl.SCISSOR_TEST);

    const pixel = new Uint8Array(4);

    gl.readPixels(
      x, gl.canvas.height - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel
    );

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.clearColor = oldClearColor;
    this.backgroundColor = oldBackgroundColor;

    let r = pixel[0];
    let g = pixel[1];
    let b = pixel[2];

    return hash[[r, g, b]];
  }

  pickCustom(x, y, opt = {}) {
    const gl = this.gl;

    if (this.pickingFBO === undefined) {
      this.pickingFBO = new Framebuffer(gl, {
        width: gl.canvas.width,
        height: gl.canvas.height
      });
    }

    if (this.pickingProgram === undefined) {
      this.pickingProgram =
        opt.pickingProgram || makeProgramFromDefaultShaders(gl);
    }

    let pickingProgram = this.pickingProgram;

    pickingProgram.use();
    pickingProgram.setUniform('enablePicking', true);
    pickingProgram.setUniform('hasPickingColors', true);

    this.pickingFBO.bind();

    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(x, gl.canvas.height - y, 1, 1);

    const oldClearColor = this.clearColor;
    const oldBackgroundColor = this.backgroundColor;
    this.clearColor = true;
    this.backgroundColor = {r: 255, g: 0, b: 0, a: 255};

    this.render({
      renderProgram: pickingProgram
    });

    gl.disable(gl.SCISSOR_TEST);

    const pixel = new Uint8Array(4);

    gl.readPixels(
      x, gl.canvas.height - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel
    );

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.clearColor = oldClearColor;
    this.backgroundColor = oldBackgroundColor;

    let r = pixel[0];
    let g = pixel[1];
    let b = pixel[2];
    let a = pixel[3];

    return [r, g, b, a];
  }

  // Setup the lighting system: ambient, directional, point lights.
  setupLighting(program) {
    // Setup Lighting
    let {enable, ambient, directional, points} = this.config.lights;

    // Set light uniforms. Ambient and directional lights.
    program.setUniform('enableLights', enable);

    if (!enable) {
      return;
    }

    if (ambient) {
      this.setupAmbientLighting(program, ambient);
    }

    if (directional) {
      this.setupDirectionalLighting(program, directional);
    }

    // Set point lights
    if (points) {
      this.setupPointLighting(program, points);
    }
  }

  setupAmbientLighting(program, ambient) {
    program.setUniforms({
      'ambientColor': [ambient.r, ambient.g, ambient.b]
    });
  }

  setupDirectionalLighting(program, directional) {
    let {color, direction} = directional;

    // Normalize lighting direction vector
    const dir = new Vec3(direction.x, direction.y, direction.z)
      .$unit()
      .$scale(-1);

    program.setUniforms({
      'directionalColor': [color.r, color.g, color.b],
      'lightingDirection': [dir.x, dir.y, dir.z]
    });
  }

  setupPointLighting(program, points) {
    points = points instanceof Array ? points : [points];
    const numberPoints = points.length;
    program.setUniform('numberPoints', numberPoints);

    const pointLocations = [];
    const pointColors = [];
    const enableSpecular = [];
    const pointSpecularColors = [];
    for (const point of points) {
      const {position, color, diffuse, specular} = point;
      const pointColor = color || diffuse;

      pointLocations.push(position.x, position.y, position.z);
      pointColors.push(pointColor.r, pointColor.g, pointColor.b);

      // Add specular color
      enableSpecular.push(Number(Boolean(specular)));
      if (specular) {
        pointSpecularColors.push(specular.r, specular.g, specular.b);
      } else {
        pointSpecularColors.push(0, 0, 0);
      }
    }

    if (pointLocations.length) {
      program.setUniforms({
        'pointLocation': pointLocations,
        'pointColor': pointColors
      });
      program.setUniforms({
        'enableSpecular': enableSpecular,
        'pointSpecularColor': pointSpecularColors
      });
    }
  }

  // Setup effects like fog, etc.
  setupEffects(program) {
    const {fog} = this.config.effects;

    if (fog) {
      const {color = {r: 0.5, g: 0.5, b: 0.5}} = fog;
      program.setUniforms({
        'hasFog': true,
        'fogNear': fog.near,
        'fogFar': fog.far,
        'fogColor': [color.r, color.g, color.b]
      });
    } else {
      program.setUniform('hasFog', false);
    }
  }

}

Scene.MAX_TEXTURES = config.MAX_TEXTURES;
Scene.MAX_POINT_LIGHTS = config.MAX_POINT_LIGHTS;
Scene.PICKING_RES = config.PICKING_RES;
