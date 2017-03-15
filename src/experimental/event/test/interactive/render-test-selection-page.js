/* global document */

import testPages from './test-pages';
import prepareTestArea from './prepare-test-area';

export default function renderTestSelectionPage() {
  const listContainerElement = prepareTestArea();
  const descriptionElement = document.createElement('div');
  listContainerElement.appendChild(descriptionElement);
  descriptionElement.textContent = `
The following test pages can be used to test the legacy and new event handlers. Events which are
emitted are logged in the console. After you are finished with a test, reload the page to return to
this menu. There is a bug in the legacy position calculations that provides incorrect positions if
the document is scrolled, though position caching may caching may make this seems like it works
sometimes.
  `;
  const listElement = document.createElement('ul');
  listContainerElement.appendChild(listElement);
  for (const testPage of testPages) {
    const listEntryElement = document.createElement('li');
    listContainerElement.appendChild(listEntryElement);
    listEntryElement.textContent = testPage.name;
    listEntryElement.onclick = () => testPage.render(prepareTestArea());
  }
}
