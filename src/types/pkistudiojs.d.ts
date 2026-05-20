declare module '@pkistudio/pkistudiojs/core' {
  export function parseInput(input: Uint8Array | string, options?: Record<string, unknown>): unknown;
}

declare module '@pkistudio/pkistudiojs/viewer' {
  export interface ViewerInstance {
    loadBytes(bytes: Uint8Array, notice?: string): void;
    setEditable(editable: boolean): void;
  }

  export interface ViewerApi {
    init(options: Record<string, unknown>): ViewerInstance;
    version?: string;
  }

  export function init(options: Record<string, unknown>): ViewerInstance;
  const PkiStudio: ViewerApi;
  export default PkiStudio;
}

declare module '@pkistudio/pkistudiojs/oid-resolver' {
  export interface OidResolverApi {
    create(overrides?: Record<string, string>): unknown;
  }

  export function create(overrides?: Record<string, string>): unknown;
  const PkiStudioOidResolver: OidResolverApi;
  export default PkiStudioOidResolver;
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
