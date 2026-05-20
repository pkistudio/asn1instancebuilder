export interface PkiStudioParseSummary {
  nodes?: unknown[];
}

export async function parseGeneratedDer(bytes: Uint8Array): Promise<PkiStudioParseSummary> {
  const core = await import('@pkistudio/pkistudiojs/core');
  return core.parseInput(bytes, { format: 'der' }) as PkiStudioParseSummary;
}
