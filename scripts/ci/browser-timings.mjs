// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

/** Extract conservative per-file seconds from timestamped Actions or plain Vitest logs. */
export function collectBrowserTimings(logs) {
  const timings = {};
  for (const log of logs) {
    // gh can render ANSI escape bytes as literal ^[ sequences.
    const plain = log.replace(/(?:\x1b|\^\[)\[[0-9;]*m/g, '');
    for (const line of plain.split('\n')) {
      if (!line.includes('headless (chromium)') && !line.includes('browser (chromium)')) continue;
      const match = line.match(/\s((?:modules|test)\/\S+\.spec\.[jt]s)\s+\([^\n]*?\)\s+(\d+)ms/);
      if (!match) continue;
      const [, path, milliseconds] = match;
      timings[path] = Math.max(timings[path] || 0, Math.ceil(Number(milliseconds) / 1000) + 1);
    }
  }
  return Object.fromEntries(Object.entries(timings).sort(([left], [right]) => left.localeCompare(right)));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length < 3) throw new Error('Usage: node scripts/ci/browser-timings.mjs <log>...');
  console.log(JSON.stringify(collectBrowserTimings(process.argv.slice(2).map(path => readFileSync(path, 'utf8'))), null, 2));
}
