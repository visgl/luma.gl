/* global document */

export function createEnterVRButton({canvas, title}) {
  const {top, left, width, height} = canvas.getBoundingClientRect();

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = `${top}px`;
  container.style.left = `${left}px`;
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.pointerEvents = 'none';
  container.style.zIndex = '999';
  document.body.appendChild(container);

  const button = document.createElement('button');
  button.style.padding = '16px';
  button.style.border = '1px solid #fff';
  button.style.borderRadius = '8px';
  button.style.background = 'rgba(0,0,0,0.5)';
  button.style.color = '#fff';
  button.style.font = 'normal 20px sans-serif';
  button.style.cursor = 'pointer';
  button.style.margin = '20px auto';
  button.style.display = 'block';
  button.style.pointerEvents = 'all';
  button.textContent = title;
  container.appendChild(button);

  return button;
}
