import {makeArrowPolygonExampleData} from '../../arrow/arrow-polygons/arrow-polygon-data';

/** Emits the Arrow polygon source used by the deck polygon example. */
export function initializeArrowPolygonLayerSource(
  onSourceChange: (data: ReturnType<typeof makeArrowPolygonExampleData>) => void
): void {
  onSourceChange(makeArrowPolygonExampleData('10k-stream', 'polygon', 'row-colors'));
}
