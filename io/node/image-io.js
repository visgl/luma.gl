// Use stackgl modules for DOM-less reading and writing of images
import getPixels from 'get-pixels';
import savePixels from 'save-pixels';

/*
 * Returns data bytes representing a compressed image in PNG or JPG format,
 * This data can be saved using file system (f) methods or
 * used in a request.
 * @param {String} opt.type='png' - png, jpg or image/png, image/jpg are valid
 * @param {String} opt.dataURI= - Whether to include a data URI header
 */
function compressImage(image, {
  type = 'png',
  stream = false
}) {
  type = type.replace('image/', '');
  return savePixels(image);
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    resolve(getPixels(url));
  });
}

export default {
  compressImage,
  loadImage 
}
