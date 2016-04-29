// Browser imports
import {default as toBlob} from 'canvas-to-blob';
import browserFs from './browser-fs';

// Node imports
// import savePixels from 'save-pixels';
// import getPixels from 'get-pixels';

// function isBrowserContext() {
//   return typeof window !== 'undefined';
// }

/*
 *
 */
export async function saveImage(canvas, filename) {
  const blob = toBlob(canvas.toDataURL());
  return await browserFs.writeFile(filename, blob);
}

export async function saveImageBrowser(canvas, filename) {
  const blob = toBlob(canvas.toDataURL());
  return await browserFs.writeFile(filename, blob);
}

// export async function saveImageNode(canvas, filename) {
//   savePixels();
//   return await browserFs.writeFile(filename, blob);
// }
