import {existsSync, readdirSync, readFileSync, statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const websiteDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildDirectory = path.join(websiteDirectory, 'build');
const llmsTxtPath = path.join(buildDirectory, 'llms.txt');
const llmsFullTxtPath = path.join(buildDirectory, 'llms-full.txt');

function fail(message) {
  throw new Error(`llms.txt output check failed: ${message}`);
}

function requireFile(relativePath) {
  const filePath = path.join(buildDirectory, relativePath);
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    fail(`missing ${relativePath}`);
  }
  return filePath;
}

function findFiles(directory, extension) {
  if (!existsSync(directory)) {
    return [];
  }

  const filePaths = [];
  for (const entry of readdirSync(directory, {withFileTypes: true})) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      filePaths.push(...findFiles(entryPath, extension));
    } else if (entry.isFile() && entryPath.endsWith(extension)) {
      filePaths.push(entryPath);
    }
  }
  return filePaths;
}

function extractMarkdownLinks(markdown) {
  const links = [];
  const markdownLinkPattern = /!?\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  for (const match of markdown.matchAll(markdownLinkPattern)) {
    links.push(match[1].replace(/^<|>$/g, ''));
  }
  return links;
}

function resolveGeneratedMarkdownLink(sourcePath, link) {
  if (link.startsWith('#') || link.startsWith('mailto:')) {
    return null;
  }

  let pathname;
  try {
    const url = new URL(link);
    if (url.hostname !== 'luma.gl') {
      return null;
    }
    pathname = decodeURIComponent(url.pathname);
  } catch {
    const linkWithoutFragment = link.split('#', 1)[0].split('?', 1)[0];
    if (!linkWithoutFragment.endsWith('.md')) {
      return null;
    }
    if (linkWithoutFragment.startsWith('/')) {
      pathname = decodeURIComponent(linkWithoutFragment);
    } else {
      return path.resolve(path.dirname(sourcePath), decodeURIComponent(linkWithoutFragment));
    }
  }

  if (!pathname.endsWith('.md')) {
    return null;
  }
  if (path.isAbsolute(pathname) && pathname.startsWith(buildDirectory)) {
    return pathname;
  }
  return path.join(buildDirectory, pathname.replace(/^\/+/, ''));
}

if (!existsSync(llmsTxtPath)) {
  fail('missing llms.txt');
}
if (existsSync(llmsFullTxtPath)) {
  fail('llms-full.txt must not be generated');
}

const llmsTxt = readFileSync(llmsTxtPath, 'utf8');
if (!llmsTxt.startsWith('# luma.gl\n')) {
  fail('llms.txt has an unexpected title');
}
if (llmsTxt.includes('/docs/legacy/')) {
  fail('llms.txt contains a legacy guide');
}
if (llmsTxt.includes('/examples/')) {
  fail('llms.txt contains a standalone example page');
}

const requiredIndexLinks = [
  'https://luma.gl/docs/getting-started.md',
  'https://luma.gl/docs/tutorials/hello-triangle.md',
  'https://luma.gl/docs/api-guide.md',
  'https://luma.gl/docs/api-reference.md',
  'https://luma.gl/docs/developer-guide/working-with-ai.md'
];
for (const link of requiredIndexLinks) {
  if (!llmsTxt.includes(link)) {
    fail(`llms.txt is missing ${link}`);
  }
}

const gettingStartedPath = requireFile('docs/getting-started.md');
const workingWithAiPath = requireFile('docs/developer-guide/working-with-ai.md');
requireFile('docs/api-guide.md');
requireFile('docs/api-reference.md');

const typedocMarkdownFiles = findFiles(
  path.join(buildDirectory, 'docs/api-reference/generated/core'),
  '.md'
);
if (typedocMarkdownFiles.length === 0) {
  fail('generated TypeDoc Markdown references are missing');
}

const markdownFiles = findFiles(path.join(buildDirectory, 'docs'), '.md');
if (markdownFiles.length < 100) {
  fail(`only ${markdownFiles.length} documentation Markdown files were generated`);
}

const gettingStarted = readFileSync(gettingStartedPath, 'utf8');
for (const expectedText of ['npm create vite', 'yarn create vite', 'pnpm create vite']) {
  if (!gettingStarted.includes(expectedText)) {
    fail(`rendered Getting Started Markdown is missing "${expectedText}"`);
  }
}
if (gettingStarted.includes('<Tabs') || gettingStarted.includes('<TabItem')) {
  fail('rendered Getting Started Markdown contains unprocessed MDX components');
}

const workingWithAi = readFileSync(workingWithAiPath, 'utf8');
if (!workingWithAi.includes('Start from local truth')) {
  fail('Working with AI Markdown extraction is incomplete');
}
if (workingWithAi.includes('<DeveloperDocsTabs')) {
  fail('Working with AI Markdown contains an unprocessed tab component');
}

const brokenLinks = [];
for (const markdownPath of [llmsTxtPath, ...markdownFiles]) {
  const markdown = readFileSync(markdownPath, 'utf8');
  if (markdown.trim().length < 40) {
    fail(`${path.relative(buildDirectory, markdownPath)} has empty extracted content`);
  }

  for (const link of extractMarkdownLinks(markdown)) {
    const targetPath = resolveGeneratedMarkdownLink(markdownPath, link);
    if (targetPath && !existsSync(targetPath)) {
      brokenLinks.push(
        `${path.relative(buildDirectory, markdownPath)} -> ${path.relative(
          buildDirectory,
          targetPath
        )}`
      );
    }
  }
}

if (brokenLinks.length > 0) {
  fail(`broken Markdown links:\n${brokenLinks.slice(0, 20).join('\n')}`);
}

console.log(`Validated llms.txt and ${markdownFiles.length} raw documentation pages.`);
