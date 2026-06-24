import React, {type ReactNode} from 'react';

const gpuColumns = ['positions', 'colors', 'timestamps'];
const gpuBatches = ['GPURecordBatch 0', 'GPURecordBatch 1', 'GPURecordBatch 2'];
const gpuTableDetails = ['schema', 'bufferLayout', 'gpuVectors', 'batches[]'];
const gpuDataDetails = ['type', 'length', 'byteOffset', 'byteStride', 'ownsBuffer'];
const memorySteps = [
  ['GPUTable', 'owns batches'],
  ['GPURecordBatch', 'owns batch-local data chunks'],
  ['GPUVector', 'table-level aggregate view'],
  ['GPUData', 'owns or borrows DynamicBuffer']
];

/**
 * Renders compact diagrams for the luma.gl GPU table object model.
 */
export function GPUTableStructureGraphic(): ReactNode {
  return (
    <div className="docs-arrow-structure" aria-label="luma.gl GPU table object model diagrams">
      <section className="docs-arrow-structure__section">
        <h2 className="docs-arrow-structure__title">GPUTable</h2>
        <div className="docs-arrow-structure__schema">
          <div className="docs-arrow-structure__stack">
            <Block variant="gpu">GPUTable</Block>
            <Detail>numRows</Detail>
            <Detail>numCols</Detail>
          </div>
          <div className="docs-arrow-structure__fields">
            {gpuTableDetails.map(detail => (
              <div className="docs-arrow-structure__card" key={detail}>
                <Block variant={detail === 'batches[]' ? 'recordBatch' : 'metadata'}>
                  {detail}
                </Block>
                <Detail>{getGPUTableDetail(detail)}</Detail>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="docs-arrow-structure__section">
        <h2 className="docs-arrow-structure__title">Batch and Column Matrix</h2>
        <div className="docs-arrow-structure__matrix">
          <div />
          {gpuColumns.map(column => (
            <div className="docs-arrow-structure__column-heading" key={column}>
              <Block variant="vector">GPUVector</Block>
              <Detail>{column}</Detail>
            </div>
          ))}
          {gpuBatches.map(gpuBatch => (
            <React.Fragment key={gpuBatch}>
              <Block variant="recordBatch">{gpuBatch}</Block>
              {gpuColumns.map(column => (
                <Block variant="data" key={`${gpuBatch}-${column}`}>
                  GPUData
                </Block>
              ))}
            </React.Fragment>
          ))}
        </div>
      </section>

      <section className="docs-arrow-structure__section">
        <h2 className="docs-arrow-structure__title">GPUData and Memory</h2>
        <div className="docs-arrow-structure__data">
          <Block variant="data">GPUData</Block>
          <div className="docs-arrow-structure__groups">
            <div className="docs-arrow-structure__card">
              <Block variant="metadata">range metadata</Block>
              {gpuDataDetails.map(detail => (
                <Detail key={detail}>{detail}</Detail>
              ))}
            </div>
            <div className="docs-arrow-structure__card">
              <Block variant="buffer">DynamicBuffer</Block>
              <Detail>GPU allocation wrapper</Detail>
              <Detail>resize/write/read helpers</Detail>
              <Detail>destroy boundary</Detail>
            </div>
            <div className="docs-arrow-structure__card">
              <Block variant="childData">readback metadata</Block>
              <Detail>producer-specific</Detail>
              <Detail>optional</Detail>
              <Detail>adapter-owned</Detail>
            </div>
          </div>
        </div>
      </section>

      <section className="docs-arrow-structure__section">
        <h2 className="docs-arrow-structure__title">Ownership Chain</h2>
        <div className="docs-arrow-structure__flow">
          {memorySteps.map(([owner, note]) => (
            <div className="docs-arrow-structure__mapping" key={owner}>
              <Block variant="gpu">{owner}</Block>
              <Detail>{note}</Detail>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function getGPUTableDetail(detail: string): string {
  switch (detail) {
    case 'schema':
      return 'selected GPU-facing fields';
    case 'bufferLayout':
      return 'model-ready buffer descriptions';
    case 'gpuVectors':
      return 'aggregate logical columns';
    case 'batches[]':
      return 'preserved GPU batches';
    default:
      return '';
  }
}

function Block({
  variant,
  children
}: {
  variant: string;
  children: ReactNode;
}): ReactNode {
  return <div className={`docs-arrow-structure__block docs-arrow-structure__block--${variant}`}>{children}</div>;
}

function Detail({children}: {children: ReactNode}): ReactNode {
  return <div className="docs-arrow-structure__detail">{children}</div>;
}
