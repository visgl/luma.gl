// CORE
export type {AnimationLoopProps, AnimationProps} from './lib/animation-loop';
export {default as AnimationLoop} from './lib/animation-loop';
export type {ModelProps} from './lib/model';
export {default as Model} from './lib/model';
export {default as ProgramManager} from './lib/program-manager';
export {default as Transform} from './transform/transform';

// Geometries
export {default as Geometry} from './geometry/geometry';

// Primitives
export type {ConeGeometryProps} from './geometries/cone-geometry';
export {ConeGeometry} from './geometries/cone-geometry';
export type {CubeGeometryProps} from './geometries/cube-geometry';
export {CubeGeometry} from './geometries/cube-geometry';
export type {CylinderGeometryProps} from './geometries/cylinder-geometry';
export {CylinderGeometry} from './geometries/cylinder-geometry';
export type {IcoSphereGeometryProps} from './geometries/ico-sphere-geometry';
export {IcoSphereGeometry} from './geometries/ico-sphere-geometry';
export type {PlaneGeometryProps} from './geometries/plane-geometry';
export {PlaneGeometry} from './geometries/plane-geometry';
export type {SphereGeometryProps} from './geometries/sphere-geometry';
export {SphereGeometry} from './geometries/sphere-geometry';
export type {TruncatedConeGeometryProps} from './geometries/truncated-cone-geometry';
export {TruncatedConeGeometry} from './geometries/truncated-cone-geometry';

// Animation
export {Timeline} from './animation/timeline';
export {KeyFrames} from './animation/key-frames';

// Utils
export {default as ClipSpace} from './utils/clip-space';
