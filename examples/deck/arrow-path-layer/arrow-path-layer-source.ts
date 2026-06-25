import {
  makeArrowLineRecordBatches,
  makeArrowLineSourceData,
  PATH_DATASETS
} from '../../arrow/arrow-lines/arrow-line-data';

/** Emits the Arrow record batches used by the deck path example. */
export function initializeArrowPathLayerSource(
  onSourceChange: (data: ReturnType<typeof makeArrowLineRecordBatches>) => void
): void {
  const sourceData = makeArrowLineSourceData(
    PATH_DATASETS['240'],
    'lines',
    'float32',
    'row-colors',
    'none'
  );
  onSourceChange(makeArrowLineRecordBatches(sourceData));
}
