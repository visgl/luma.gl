/* global document */

import testPages from './testPages';
import prepareTestArea from './prepareTestArea';

export default function renderTestSelectionPage() {
  const listContainerElement = prepareTestArea();
  const listElement = document.createElement('ul');
  listContainerElement.appendChild(listElement);
  for (const testPage of testPages) {
    const listEntryElement = document.createElement('li');
    listContainerElement.appendChild(listEntryElement);
    listEntryElement.textContent = testPage.name;
    listEntryElement.onclick = () => testPage.render(prepareTestArea());
  }
}
