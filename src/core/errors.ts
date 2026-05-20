export class Asn1InstanceBuilderError extends Error {
  constructor(message: string, readonly path: string[] = []) {
    super(path.length > 0 ? `${message} at ${path.join('.')}` : message);
    this.name = 'Asn1InstanceBuilderError';
  }
}

export function withPath(error: unknown, segment: string): never {
  if (error instanceof Asn1InstanceBuilderError) {
    throw new Asn1InstanceBuilderError(error.message.replace(/ at .+$/, ''), [segment, ...error.path]);
  }
  throw error;
}
