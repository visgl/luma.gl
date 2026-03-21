import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {loadOcularConfig} from '../load-ocular-config.mjs';
import {runWebsiteExample} from './run-website-example.mjs';

const DEFAULT_BASE_URL = 'http://127.0.0.1:3000';
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export async function runWebsitePlaywrightCli(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);

  if (options.help) {
    printHelp();
    return;
  }

  const ocularConfig = await loadOcularConfig({cwd: REPO_ROOT});
  const result = await runWebsiteExample({
    ...options,
    cwd: REPO_ROOT,
    ocularConfig
  });

  console.log(`[playwright] Opened ${result.targetUrl}`);
  console.log(`[playwright] Browser mode: ${result.browserMode}`);
  console.log(`[playwright] Screenshot saved to ${result.screenshotPath}`);
  console.log(
    result.usingExistingServer
      ? '[playwright] Reused existing website server'
      : '[playwright] Started website server automatically'
  );

  if (result.endpointURL) {
    console.log(`[playwright] Remote debugging endpoint: ${result.endpointURL}`);
  }

  if (options.keepOpen) {
    console.log('[playwright] Browser left open for inspection. Press Ctrl+C to exit.');
    await new Promise(resolve => {
      const cleanup = async () => {
        process.off('SIGINT', cleanup);
        process.off('SIGTERM', cleanup);
        resolve();
      };
      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);
    });
  }
}

function parseArguments(argv) {
  const parsed = {
    attach: undefined,
    backend: undefined,
    baseUrl: DEFAULT_BASE_URL,
    channel: undefined,
    debugPort: undefined,
    example: undefined,
    headless: false,
    help: false,
    keepOpen: true,
    softwareGpu: false,
    targetTab: undefined,
    watch: false,
    watchInterval: undefined
  };

  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];

    if (argument === '--help' || argument === '-h') {
      parsed.help = true;
      continue;
    }

    if (argument === '--headless') {
      parsed.headless = true;
      parsed.keepOpen = false;
      continue;
    }

    if (argument === '--keep-open') {
      parsed.keepOpen = true;
      continue;
    }

    if (argument === '--no-keep-open') {
      parsed.keepOpen = false;
      continue;
    }

    if (argument === '--software-gpu') {
      parsed.softwareGpu = true;
      continue;
    }

    if (argument === '--watch') {
      parsed.watch = true;
      parsed.keepOpen = true;
      continue;
    }

    if (argument.startsWith('--example=')) {
      parsed.example = argument.split('=').slice(1).join('=');
      continue;
    }

    if (argument === '--example') {
      parsed.example = argv[++index];
      continue;
    }

    if (argument.startsWith('--backend=')) {
      parsed.backend = argument.split('=').slice(1).join('=');
      continue;
    }

    if (argument === '--backend') {
      parsed.backend = argv[++index];
      continue;
    }

    if (argument.startsWith('--channel=')) {
      parsed.channel = argument.split('=').slice(1).join('=');
      continue;
    }

    if (argument === '--channel') {
      parsed.channel = argv[++index];
      continue;
    }

    if (argument.startsWith('--base-url=')) {
      parsed.baseUrl = argument.split('=').slice(1).join('=');
      continue;
    }

    if (argument === '--base-url') {
      parsed.baseUrl = argv[++index];
      continue;
    }

    if (argument.startsWith('--attach=')) {
      parsed.attach = argument.split('=').slice(1).join('=');
      continue;
    }

    if (argument === '--attach') {
      parsed.attach = argv[++index];
      continue;
    }

    if (argument.startsWith('--target-tab=')) {
      parsed.targetTab = argument.split('=').slice(1).join('=');
      continue;
    }

    if (argument === '--target-tab') {
      parsed.targetTab = argv[++index];
      continue;
    }

    if (argument.startsWith('--debug-port=')) {
      parsed.debugPort = Number(argument.split('=').slice(1).join('='));
      continue;
    }

    if (argument === '--debug-port') {
      parsed.debugPort = Number(argv[++index]);
      continue;
    }

    if (argument.startsWith('--watch-interval=')) {
      parsed.watchInterval = Number(argument.split('=').slice(1).join('='));
      continue;
    }

    if (argument === '--watch-interval') {
      parsed.watchInterval = Number(argv[++index]);
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  return parsed;
}

function printHelp() {
  console.log(`
Usage:
  yarn website-debug --example showcase/persistence
  yarn website-debug --example persistence --backend webgl2
  yarn website-debug --attach=http://127.0.0.1:9222 --target-tab persistence

Options:
  --example <value>         Example alias or route segment
  --backend <webgpu|webgl2> Select a device tab explicitly
  --attach <url>            Attach to an existing debug-enabled browser over CDP
  --target-tab <value>      Match a page by URL or title substring when attaching
  --channel <value>         Browser channel to launch
  --debug-port <number>     Remote debugging port for launched browsers
  --base-url <url>          Website base URL
  --headless                Launch headless and close after capture
  --keep-open               Keep the browser open after capture
  --no-keep-open            Close the browser after capture
  --software-gpu            Force software GPU flags
  --watch                   Keep capturing screenshots repeatedly
  --watch-interval <ms>     Interval between watched screenshots
  --help                    Show this help message
`);
}
