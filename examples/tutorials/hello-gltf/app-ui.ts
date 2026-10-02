// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const INFO_HTML = `\
<p>
  Minimal glTF loading example using <code>@loaders.gl/gltf</code> and
  <code>@luma.gl/gltf</code>.
</p>
<p>Drag to orbit. Use the mouse wheel or trackpad to zoom.</p>
<div id="error" style="color: #b00020; margin-top: 8px;"></div>
`;

export function showError(error?: unknown): void {
  const errorDiv = document.getElementById('error') as HTMLDivElement | null;
  if (!errorDiv) {
    return;
  }

  errorDiv.textContent = error ? `Error loading model: ${getErrorMessage(error)}` : '';
  errorDiv.style.display = error ? 'block' : 'none';
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
