// Export core modules for luma.gl
export * from './math';
export * from './webgl';
export * from './core';

import * as math from './math';
import * as webgl from './webgl';
import * as core from './core';

// Export support modules for luma.gl
export * from './geometry';
export * from './io';

import * as geometry from './geometry';
import * as io from './io';

// Experimental modules
import * as experimental from './experimental';

// TODO - deprecated
export * from './deprecated/scenegraph';
import * as scenegraph from './deprecated/scenegraph';
import {default as Shaders} from './deprecated/shaderlib';
import {default as Fx} from './addons/fx';
import * as deprecated from './deprecated';

export {default as Shaders} from './deprecated/shaderlib';
export {default as Fx} from './addons/fx';
export * from './deprecated';

import luma from './globals';

Object.assign(luma,
  math,
  geometry,

  webgl,
  core,

  io,

  experimental,

  // Deprecated
  scenegraph,
  deprecated,
  Shaders,
  {Fx}
);
