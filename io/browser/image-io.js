// Image loading/saving for browser
/* global document, HTMLCanvasElement, Image */
/* eslint-disable guard-for-in, complexity, no-try-catch */
import assert from 'assert';

/*
 * Returns data bytes representing a compressed image in PNG or JPG format,
 * This data can be saved using file system (f) methods or
 * used in a request.
 * @param {Image}  image - Image or Canvas
 * @param {String} opt.type='png' - png, jpg or image/png, image/jpg are valid
 * @param {String} opt.dataURI= - Whether to include a data URI header
 */
export function compressImage(image, {
  type = 'png',
  dataURI = false
}) {
  if (image instanceof HTMLCanvasElement) {
    const canvas = image;
    return canvas.toDataURL(type);
  }

  assert(image instanceof Image, 'getImageData accepts image or canvas');
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  canvas.getContext('2d').drawImage(image, 0, 0);

  // Get raw image data
  let data = canvas.toDataURL(type);
  if (!dataURI) {
    data = data.replace(/^data:image\/(png|jpg);base64,/, '');
  }
}

/*
 * Loads images asynchronously
 * returns a promise tracking the load
 */
export function loadImage(url) {
  return new Promise(function(resolve, reject) {
    try {
      const image = new Image();
      image.onload = function() {
        resolve(image);
      };
      image.onerror = function() {
        reject(new Error(`Could not load image ${url}.`));
      };
      image.src = url;
    } catch (error) {
      reject(error);
    }
  });
}
