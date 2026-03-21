const DEFAULT_BASE_URL = 'http://127.0.0.1:3000';
const DEFAULT_EXAMPLE_BASE_PATH = '/examples';
const DEFAULT_EXAMPLE_PATH = '/examples/showcase/persistence';

function getPlaywrightConfig(ocularConfig = {}) {
  return ocularConfig.devtools?.playwright || {};
}

function normalizeExamplePath(value) {
  if (!value) {
    return DEFAULT_EXAMPLE_PATH;
  }

  return value.startsWith('/') ? value : `/${value}`;
}

export function resolveExamplePath(example, ocularConfig = {}) {
  const playwrightConfig = getPlaywrightConfig(ocularConfig);
  const defaultExamplePath = playwrightConfig.defaultExamplePath || DEFAULT_EXAMPLE_PATH;
  const exampleBasePath = playwrightConfig.exampleBasePath || DEFAULT_EXAMPLE_BASE_PATH;
  const configuredExamples = playwrightConfig.examples || {};

  if (!example) {
    return defaultExamplePath;
  }

  const aliasedPath = configuredExamples[example] || configuredExamples[example.toLowerCase()];
  if (aliasedPath) {
    return normalizeExamplePath(aliasedPath);
  }

  if (example.startsWith('http://') || example.startsWith('https://')) {
    return example;
  }

  if (example.startsWith('/')) {
    return example;
  }

  if (example.startsWith('examples/')) {
    return normalizeExamplePath(example);
  }

  return `${exampleBasePath}/${example}`;
}

export function resolveExampleUrl(example, baseUrl = DEFAULT_BASE_URL, ocularConfig = {}) {
  const resolvedExamplePath = resolveExamplePath(example, ocularConfig);

  if (resolvedExamplePath.startsWith('http://') || resolvedExamplePath.startsWith('https://')) {
    return resolvedExamplePath;
  }

  return new URL(resolvedExamplePath, baseUrl).toString();
}
