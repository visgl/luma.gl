/**
 * Adapted from THREE.js under MIT license
 * @author Don McCurdy / https://www.donmccurdy.com
 */

export function extractUrlBase(url) {
  const index = url.lastIndexOf('/');
  return index === -1 ? './' : url.substr(0, index + 1);
}
