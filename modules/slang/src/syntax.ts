// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Traverse syntax only; resolved symbol edges can point back into the program. */
export function visitSyntaxChildren(value: object, visit: (child: unknown) => void): void {
  for (const [name, child] of Object.entries(value)) {
    if (name !== 'resolvedCall' && name !== 'resolvedType' && name !== 'valueType') visit(child);
  }
}
