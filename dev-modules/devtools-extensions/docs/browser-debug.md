# Browser debug support

`devtools` now supports two browser-debug workflows.

## Launch mode

Launch a Playwright-managed browser with a remote debugging port:

```sh
yarn website-debug --example showcase/persistence --debug-port 9222
```

This is the most reliable mode for automation.

## Attach mode

Attach to an already-running Chrome or Chromium that was started with a remote debugging port:

```sh
yarn website-debug --attach=http://127.0.0.1:9222 --target-tab persistence
```

Attach mode requirements:
- the browser must already be running
- it must have been started with remote debugging enabled
- the target page must already exist, or the runner will open a new page in the attached browser context

What is supported:
- finding a page by URL or title substring
- opening or reusing a tab
- backend switching
- console and page error capture
- screenshot capture

What is not supported:
- attaching to an arbitrary desktop browser that was not launched with remote debugging
- controlling the real Chrome DevTools UI
- live screen streaming or screen sharing

This is a CDP/Playwright automation path, not a replacement for a live remote desktop session.
