function getDocUrl(filename) {
  const url = `docs/${filename}`;
  console.log(url);
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
    tree.path = tree.name.match(/(([A-Z]|^)[a-z]+|\d+)/g).join('-').toLowerCase();
  }
  if (docUrls && typeof tree.content === 'string') {
    tree.content = {path: getDocUrl(tree.content)};
  }
  return tree;
}
