// Scene Object management and rendering
/* eslint-disable max-statements, no-try-catch */

import {Vector3} from '../packages/math';
import {merge} from '../utils';
import Group from '../core/group';
import pickModels from '../core/pick-models';
import assert from 'assert';

export const MAX_TEXTURES = 10;
export const MAX_POINT_LIGHTS = 4;
export const PICKING_RES = 4;

const INVALID_ARGUMENT = 'LumaGL.Scene invalid argument';

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

// Scene class
export default class Scene extends Group {

  constructor(gl, opts) {
    assert(gl, INVALID_ARGUMENT);

    opts = merge(DEFAULT_SCENE_OPTS, opts);

    super(opts);

    this.gl = gl;
    this.config = opts;
    this.needsRedraw = false;
    Object.seal(this);
  }

  setNeedsRedraw(redraw = true) {
    this.needsRedraw = redraw;
    return this;
  }

  getNeedsRedraw({clearRedrawFlags = false} = {}) {
    let redraw = false;
    redraw = redraw || this.needsRedraw;
    this.needsRedraw = this.needsRedraw && !clearRedrawFlags;
    this.traverse(model => {
      redraw = redraw || model.getNeedsRedraw({clearRedrawFlags});
    });
    return redraw;
  }

  clear() {
    const {gl} = this;
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
    return this;
  }

  // Renders all objects in the scene.
  render(uniforms = {}) {
    this.clear();
    // Go through each model and render it.
    this.traverse(model => {
      if (model.display) {
        this.renderObject({model, uniforms});
      }
    });
    return this;
  }

  renderObject({model, uniforms}) {
    // Setup lighting and scene effects like fog, etc.
    uniforms = Object.assign({}, this.getSceneUniforms(), uniforms);
    model.render(uniforms);
    return this;
  }

  pickModels(opts = {}) {
    const {x, y, uniforms = {}} = opts;
    return pickModels(this.gl, Object.assign({
      group: this,
      position: [x, y],
      uniforms
    }, opts));
  }

  // Setup the lighting system: ambient, directional, point lights.
  getSceneUniforms() {
    // Setup Lighting
    const {enable, ambient, directional, points} = this.config.lights;

    // Set light uniforms. Ambient and directional lights.
    return Object.assign({},
      this.getEffectsUniforms(),
      {enableLights: enable},
      (enable && ambient ? this.getAmbientUniforms(ambient) : {}),
      (enable && directional ? this.getDirectionalUniforms(directional) : {}),
      (enable && points ? this.getPointUniforms(points) : {})
    );
  }

  getAmbientUniforms(ambient) {
    return {
      ambientColor: [ambient.r, ambient.g, ambient.b]
    };
  }

  getDirectionalUniforms(directional) {
    const {color, direction} = directional;

    // Normalize lighting direction vector
    const dir = new Vector3(direction.x, direction.y, direction.z)
      .normalize()
      .scale(-1, -1, -1);

    return {
      directionalColor: [color.r, color.g, color.b],
      lightingDirection: [dir.x, dir.y, dir.z]
    };
  }

  getPointUniforms(points) {
    points = points instanceof Array ? points : [points];
    const numberPoints = points.length;
    const uniforms = {numberPoints};

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
      Object.assign(uniforms, {
        pointLocation: pointLocations,
        pointColor: pointColors,
        enableSpecular,
        pointSpecularColor: pointSpecularColors
      });
    }

    return uniforms;
  }

  // Setup effects like fog, etc.
  getEffectsUniforms() {
    const {fog} = this.config.effects;

    if (fog) {
      const {color = {r: 0.5, g: 0.5, b: 0.5}} = fog;
      return {
        hasFog: true,
        fogNear: fog.near,
        fogFar: fog.far,
        fogColor: [color.r, color.g, color.b]
      };
    }
    return {hasFog: false};
  }
}

Scene.MAX_TEXTURES = 4;
Scene.MAX_POINT_LIGHTS = 4;
Scene.PICKING_RES = 4;
