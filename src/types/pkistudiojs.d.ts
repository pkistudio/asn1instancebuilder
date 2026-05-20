declare module '@pkistudio/pkistudiojs/core' {
  export function parseInput(input: Uint8Array | string, options?: Record<string, unknown>): unknown;
}

declare module '@pkistudio/pkistudiojs/viewer' {
  export interface ViewerInstance {
    loadBytes(bytes: Uint8Array, notice?: string): void;
    setEditable(editable: boolean): void;
  }

  export function init(options: Record<string, unknown>): ViewerInstance;
}

declare module '@pkistudio/pkistudiojs/oid-resolver' {
  export function create(overrides?: Record<string, string>): unknown;
}

declare module '@pkistudio/pkistudiojs/core?url' {
  const url: string;
  export default url;
}

declare module '@pkistudio/pkistudiojs/viewer?url' {
  const url: string;
  export default url;
}

declare module '@pkistudio/pkistudiojs/oid-resolver?url' {
  const url: string;
  export default url;
}
