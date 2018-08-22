import path from 'path';

export function smartFetch(url, loaders, options) {
  /* global fetch */
  return fetch(url)
    .then(response => response.text())
    .then(text => smartParse(text, url));
}

// Find a loader that works for extension/text
export function smartParse(text, url, loaders, options) {
  const loader = getLoader(url, text, loaders);
  if (!loader.parseText) {
    throw new Error(`${loader.name} loader cannot handle text`);
  }

  return loader.parseText(text, options);
}

// Search the loaders array argument for a loader that matches extension or text
function getLoader(url, text, loaders) {
  // Get extension without
  let extension = path.extname(url) || url;
  if (extension.length && extension[0] === '.') {
    extension = extension.substr(1).toLowerCase();
  }

  for (const loader of loaders) {
    if (loader.extension === extension) {
      return loader;
    }
  }

  for (const loader of loaders) {
    if (loader.name.toLowerCase === extension) {
      return loader;
    }
  }

  for (const loader of loaders) {
    if (loader.testText && loader.testText(text)) {
      return loader;
    }
  }

  return null;
}
