import {lumaGlobals} from '../../utils';

// Export node functions matched by browser-fs
function notImplemented(functionName) {
  return () => {
    throw new Error(`${functionName} not available (see luma.gl/headless-io)`);
  }
}

export function readFile(...args) {
  return (lumaGlobals.nodeIO.readFile || notImplemented('readFile'))(...args);
}

export function writeFile(...args) {
  return (lumaGlobals.nodeIO.writeFile || notImplemented('writeFile'))(...args);
}

export function compressImage(...args) {
  const f = lumaGlobals.nodeIO.compressImage || notImplemented('compressImage');
  return f(...args);
}

export function loadImage(...args) {
  return (lumaGlobals.nodeIO.loadImage || notImplemented('loadImage'))(...args);
}
