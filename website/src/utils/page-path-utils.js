function getDocUrl(filename) {
  let url = `docs/${filename}`;
  if (filename.indexOf('markdown') !== -1) {
    url = filename;
  }
  return url;
}

export function generatePaths(tree, {docUrls = false} = {}) {
  if (Array.isArray(tree)) {
    tree.forEach(branch => generatePaths(branch, {docUrls}));
  }
  if (tree.children) {
    generatePaths(tree.children, {docUrls});
  }
  if (tree.name) {
    tree.path = tree.name.match(/(3D|API|WebGL|([A-Z]|^)[a-z]+|\d+)/g).join('-').toLowerCase();
  }
  if (docUrls && typeof tree.content === 'string') {
    tree.content = getDocUrl(tree.content);
  }
  return tree;
}
