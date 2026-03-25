export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export function logError(context: string, error: unknown): void {
  if (error instanceof Error) {
    console.error(error);
    console.error(context);
    return;
  }

  console.error(context, error);
}
