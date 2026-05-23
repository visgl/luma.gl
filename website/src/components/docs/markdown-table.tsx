import React, {type ComponentProps, type ReactNode} from 'react';
import clsx from 'clsx';

/**
 * Wraps markdown-rendered tables in a scrollable presentation container.
 */
export function MarkdownTable({
  className,
  children,
  ...tableProps
}: ComponentProps<'table'>): ReactNode {
  return (
    <div className="docs-markdown-table">
      <table {...tableProps} className={clsx('docs-markdown-table__table', className)}>
        {children}
      </table>
    </div>
  );
}
