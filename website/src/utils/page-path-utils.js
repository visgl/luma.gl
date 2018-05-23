function getDocUrl(filename) {
  let url = `docs/${filename}`;
  if (filename.indexOf('markdown') !== -1) {
    url = filename;
  }
  return url;
}

// mapping from file path in source to generated page url
export const markdownFiles = {};

export function generatePaths(tree, {docUrls = false, parentPath = ''} = {}) {
  if (Array.isArray(tree)) {
    tree.forEach(branch => generatePaths(branch, {docUrls, parentPath}));
  }
  if (tree.name) {
    tree.path = tree.name.match(/(3D|API|WebGL|([A-Z]|^)[a-z]+|\d+)/g).join('-').toLowerCase();
  }
  if (tree.children) {
    generatePaths(tree.children, {docUrls, parentPath: `${parentPath}/${tree.path}`});
  }
  if (docUrls && typeof tree.content === 'string') {
    tree.content = getDocUrl(tree.content);
    const i = tree.content.indexOf('docs/');
    if (i >= 0) {
      markdownFiles[tree.content.slice(i)] = `${parentPath}/${tree.path}`;
    }
  }
  return tree;
}
