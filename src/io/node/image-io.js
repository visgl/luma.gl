// Use stackgl modules for DOM-less reading and writing of images
import getPixels from 'get-pixels';
import savePixels from 'save-pixels';
import ndarray from 'ndarray';
import {promisify} from '../utils';

const getPixelsAsync = promisify(getPixels);

/**
 * Returns data bytes representing a compressed image in PNG or JPG format,
 * This data can be saved using file system (f) methods or
 * used in a request.
 * @param {Image} image to save
 * @param {String} opt.type='png' - png, jpg or image/png, image/jpg are valid
 * @param {String} opt.dataURI= - Whether to include a data URI header
 * @return {*} bytes
 */
export function compressImage(image, type = 'png') {
  return savePixels(ndarray(
    image.data,
    [image.width, image.height, 4],
    [4, image.width * 4, 1],
    0), type.replace('image/', ''));
}

export function loadImage(url) {
  return getPixelsAsync(url)
  .then(result => ({
    width: result.shape[0],
    height: result.shape[1],
    data: result.data
  }));
}
