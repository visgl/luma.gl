export function collectPageDiagnostics(page, logger = console) {
  const diagnostics = {
    consoleMessages: [],
    pageErrors: [],
    requestFailures: []
  };

  const handleConsole = message => {
    const entry = {
      type: message.type(),
      text: message.text()
    };
    diagnostics.consoleMessages.push(entry);
    logger.log(`[browser:${entry.type}] ${entry.text}`);
  };

  const handlePageError = error => {
    const entry = error.stack || error.message;
    diagnostics.pageErrors.push(entry);
    logger.error(`[pageerror] ${entry}`);
  };

  const handleRequestFailed = request => {
    const entry = {
      method: request.method(),
      url: request.url(),
      errorText: request.failure()?.errorText || ''
    };
    diagnostics.requestFailures.push(entry);
    logger.error(`[requestfailed] ${entry.method} ${entry.url} ${entry.errorText}`);
  };

  page.on('console', handleConsole);
  page.on('pageerror', handlePageError);
  page.on('requestfailed', handleRequestFailed);

  return {
    diagnostics,
    dispose() {
      page.off('console', handleConsole);
      page.off('pageerror', handlePageError);
      page.off('requestfailed', handleRequestFailed);
    }
  };
}

export async function probeWebGPU(page) {
  return await page.evaluate(async () => {
    const result = {
      navigatorGpu: Boolean(globalThis.navigator?.gpu),
      adapter: false,
      features: [],
      isFallbackAdapter: undefined,
      error: null
    };

    if (!globalThis.navigator?.gpu) {
      return result;
    }

    try {
      const adapter = await globalThis.navigator.gpu.requestAdapter();
      result.adapter = Boolean(adapter);
      result.features = adapter ? Array.from(adapter.features.values()) : [];
      result.isFallbackAdapter = adapter?.isFallbackAdapter;
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
    }

    return result;
  });
}
