import {saveAs} from 'filesaver.js';
import {default as toBlob} from 'canvas-to-blob';

export function saveBitmap(canvas, filename) {
  const blob = toBlob(canvas.toDataURL());
  saveAs(blob, filename);
}
