/* global document */

const testAreaId = 'lumagl-test-area';

function deleteTestAreaIfExists() {
  const existingTestAreaElement = document.getElementById(testAreaId);
  if (existingTestAreaElement) {
    document.body.removeChild(existingTestAreaElement);
  }
}

function createTestArea() {
  const testAreaElement = document.createElement('div');
  testAreaElement.id = testAreaId;
  document.body.appendChild(testAreaElement);
  return testAreaElement;
}

export default function prepareTestArea() {
  deleteTestAreaIfExists();
  return createTestArea();
}
