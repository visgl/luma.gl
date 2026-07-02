import React, {type ReactNode, useEffect, useMemo, useState} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import CodeBlock from '@theme/CodeBlock';

type SourceFile = {
  path: string;
  source: string;
};

const DEFAULT_FILES = ['app.ts', 'app.tsx', 'index.html', 'package.json'];

/** Renders canonical files copied from an example during the website build. */
export function ExampleSource({
  example,
  files = DEFAULT_FILES,
  title = 'Runnable source'
}: {
  example: string;
  files?: string[];
  title?: string;
}): ReactNode {
  const baseUrl = useBaseUrl('/example-assets/');
  const filesKey = files.join('|');
  const requestedFiles = useMemo(() => files, [filesKey]);
  const [sourceFiles, setSourceFiles] = useState<SourceFile[]>([]);
  const [activePath, setActivePath] = useState(files[0] || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();
    setSourceFiles([]);
    setError(null);

    void Promise.all(
      requestedFiles.map(async path => {
        const response = await fetch(`${baseUrl}${example}/${path}`, {
          signal: abortController.signal
        });
        return response.ok ? {path, source: await response.text()} : null;
      })
    )
      .then(results => {
        const availableFiles = results.filter((file): file is SourceFile => Boolean(file));
        if (availableFiles.length === 0) {
          setError('Unable to load the example source.');
          return;
        }
        setSourceFiles(availableFiles);
        setActivePath(availableFiles[0].path);
      })
      .catch(fetchError => {
        if (!abortController.signal.aborted) {
          setError(fetchError instanceof Error ? fetchError.message : 'Unable to load the source.');
        }
      });

    return () => abortController.abort();
  }, [baseUrl, example, requestedFiles]);

  const activeFile = sourceFiles.find(file => file.path === activePath) || sourceFiles[0];

  return (
    <section className="docs-example-source" aria-label={title}>
      <div className="docs-example-source__header">
        <strong>{title}</strong>
        <a href={`https://github.com/visgl/luma.gl/tree/master/examples/${example}`}>
          View on GitHub
        </a>
      </div>
      {sourceFiles.length > 1 ? (
        <div className="docs-example-source__tabs" role="tablist" aria-label="Source files">
          {sourceFiles.map(file => (
            <button
              key={file.path}
              type="button"
              role="tab"
              aria-selected={file.path === activeFile?.path}
              className={file.path === activeFile?.path ? 'is-active' : undefined}
              onClick={() => setActivePath(file.path)}
            >
              {file.path}
            </button>
          ))}
        </div>
      ) : null}
      {error ? <p className="docs-example-source__error">{error}</p> : null}
      {activeFile ? (
        <CodeBlock language={getSourceLanguage(activeFile.path)}>{activeFile.source}</CodeBlock>
      ) : error ? null : (
        <CodeBlock language="typescript">{'// Loading canonical example source…'}</CodeBlock>
      )}
    </section>
  );
}

function getSourceLanguage(path: string): string {
  if (path.endsWith('.html')) {
    return 'html';
  }
  if (path.endsWith('.json')) {
    return 'json';
  }
  return path.endsWith('.tsx') ? 'tsx' : 'typescript';
}
