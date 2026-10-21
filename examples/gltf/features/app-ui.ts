// luma.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const INFO_HTML = `\
<p>KHR_billboard draft: drag to orbit around camera-facing trees and labels.</p>
<p>Loading the original Khronos BillboardDemo downloads about 68 MB of geometry.</p>
<p>Explicit compatibility enables the original model's legacy Y-axis syntax.</p>
<p>Nik fortress and EFX trees: CC BY 4.0. Roboto by Christian Robertson: Apache 2.0.
Composition by UX3D / Khronos: CC BY 4.0.
<a href="https://github.com/KhronosGroup/glTF-External-Reference/blob/d15ddd159493698a1c1ce2fab448abbfde56c312/demo/Models/BillboardDemo/metadata.json">Source and attribution</a></p>
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
