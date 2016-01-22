/* Generate script that can be used in browser without browserify */

/* eslint-disable no-try-catch */
/* eslint-disable no-console */
/* global window, console */
try {
  require('babel-polyfill');
} catch (e) {
  console.warn('Already have an instance of babel-polyfill.');
}

import * as LumaGL from './index';
import Fx from './addons/fx';
import WorkerGroup from './addons/workers';

if (typeof window !== 'undefined') {
  window.LumaGL = {
    hasWebGL: LumaGL.hasWebGL,
    createGLContext: LumaGL.createGLContext,
    loadTextures: LumaGL.loadTextures,
    Model: LumaGL.Model,
    Cone: LumaGL.Cone,
    Cube: LumaGL.Cube,
    Cylinder: LumaGL.Cylinder,
    IcoSphere: LumaGL.IcoSphere,
    Plane: LumaGL.Plane,
    Sphere: LumaGL.Sphere,
    TruncatedCone: LumaGL.TruncatedCone,
    Framebuffer: LumaGL.Framebuffer,
    Texture2D: LumaGL.Texture2D,
    Buffer: LumaGL.Buffer,
    Events: LumaGL.Events,
    Mat4: LumaGL.math.Mat4,
    Vec3: LumaGL.math.Vec3,
    Shaders: LumaGL.Shaders,
    IO: LumaGL.IO,
    PerspectiveCamera: LumaGL.PerspectiveCamera,
    OrthoCamera: LumaGL.OrthoCamera,
    Scene: LumaGL.Scene,
    Program: LumaGL.Program,
    Media: {
      Image: LumaGL.Img
    },
    // Add-ons
    WorkerGroup: WorkerGroup,
    Fx: Fx
  };
}
