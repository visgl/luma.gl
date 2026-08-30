#!/usr/bin/env node

// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import {createServer} from 'node:http';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

export async function resolveStaticFilename(root, requestPathname) {
  let decodedPathname;
  try {
    decodedPathname = decodeURIComponent(requestPathname);
  } catch {
    return null;
  }
  const relativePath = decodedPathname.replace(/^\/+/, '');
  const baseFilename = path.resolve(root, relativePath || 'index.html');
  if (baseFilename !== root && !baseFilename.startsWith(`${root}${path.sep}`)) {
    return null;
  }

  const candidates = path.extname(baseFilename)
    ? [baseFilename]
    : [baseFilename, `${baseFilename}.html`, path.join(baseFilename, 'index.html')];
  for (const candidate of candidates) {
    try {
      if ((await stat(candidate)).isFile()) {
        return candidate;
      }
    } catch {
      // Try the next Docusaurus pretty-URL representation.
    }
  }
  return null;
}

export function parseArguments(argv) {
  const parsed = {root: '', host: '127.0.0.1', port: 3000};
  for (let index = 0; index < argv.length; index += 2) {
    const name = argv[index];
    const value = argv[index + 1];
    if (!value) {
      throw new Error(`${name} requires a value.`);
    }
    if (name === '--root') {
      parsed.root = value;
    } else if (name === '--host') {
      parsed.host = value;
    } else if (name === '--port') {
      parsed.port = Number(value);
    } else {
      throw new Error(`Unknown argument: ${name}`);
    }
  }
  if (!parsed.root || !Number.isSafeInteger(parsed.port) || parsed.port < 1 || parsed.port > 65535) {
    throw new Error('A root directory and valid port are required.');
  }
  return parsed;
}

function serveStaticWebsite(options) {
  const rootDirectory = path.resolve(options.root);
  const server = createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || '/', `http://${options.host}:${options.port}`);
      const filename = await resolveStaticFilename(rootDirectory, requestUrl.pathname);
      if (!filename) {
        response.writeHead(404, {'content-type': 'text/plain; charset=utf-8'});
        response.end('Not found\n');
        return;
      }

      const fileStats = await stat(filename);
      response.writeHead(200, {
        'cache-control': 'no-store',
        'content-length': fileStats.size,
        'content-type':
          CONTENT_TYPES[path.extname(filename).toLowerCase()] || 'application/octet-stream'
      });
      if (request.method === 'HEAD') {
        response.end();
      } else {
        createReadStream(filename).pipe(response);
      }
    } catch (error) {
      response.writeHead(500, {'content-type': 'text/plain; charset=utf-8'});
      response.end(`${error instanceof Error ? error.message : String(error)}\n`);
    }
  });

  server.listen(options.port, options.host, () => {
    console.log(`[static-website] Serving ${rootDirectory} at http://${options.host}:${options.port}`);
  });

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => server.close(() => process.exit(0)));
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  serveStaticWebsite(parseArguments(process.argv.slice(2)));
}
