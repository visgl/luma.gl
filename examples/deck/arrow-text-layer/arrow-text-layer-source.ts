import {makeArrowTextSource, type TextDataset} from '../../arrow/arrow-text-2d/arrow-text-data';

const DECK_TEXT_DATASET: TextDataset = {
  labelCount: 800,
  label: '800 Utf8 texts, 24K glyphs',
  textType: 'utf8'
};

/** Emits the Arrow text columns used by the deck text example. */
export function initializeArrowTextLayerSource(
  onSourceChange: (data: ReturnType<typeof makeArrowTextSource>) => void
): void {
  onSourceChange(makeArrowTextSource(DECK_TEXT_DATASET, 'constant'));
}
