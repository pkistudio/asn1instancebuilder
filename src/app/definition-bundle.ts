import type { Asn1SchemaModule } from '../core.js';
import type { UiProfile } from './ui-profile.js';

export type DefinitionBundleSchemaSource =
  | {
  /** Raw ASN.1 module text parsed into a Schema Model before building DER. */
      format: 'asn1';
      /** Optional display name for diagnostics and API log entries. */
      sourceName?: string;
      source: string;
    }
  | {
      /** Already parsed Schema Model for hosts that own parsing or store schema JSON directly. */
      format: 'schema-model';
      schema: Asn1SchemaModule;
    };

/** One loadable top-level type within a Definition Bundle. */
export interface DefinitionBundleEntry {
  /** Stable entry id for host menus or direct loadBundle selection. */
  id?: string;
  /** Top-level ASN.1 type name to select after loading the bundle schema. */
  typeName: string;
  label?: string;
  description?: string;
  /** Example Instance JSON loaded when the entry is selected. Takes precedence over defaultInput. */
  sampleInput?: unknown;
  /** Initial Instance JSON used when no sampleInput exists for the entry type. */
  defaultInput?: unknown;
  /** Optional form-rendering hints for this entry. UI metadata is not used for DER generation. */
  uiProfile?: UiProfile;
}

/**
 * Host-facing app package shape for schema, entries, sample inputs, and UI metadata.
 *
 * The Schema Model and Instance JSON remain the source of truth for diagnostics
 * and DER generation. Unknown bundle fields are ignored by the current helpers
 * so hosts can add private metadata without affecting app loading behavior.
 */
export interface DefinitionBundle {
  /** Globally unique bundle id, usually reverse-DNS style. */
  id: string;
  /** Bundle payload format version, independent from npm package version. */
  version: string;
  label: string;
  description?: string;
  schema: DefinitionBundleSchemaSource;
  entries: DefinitionBundleEntry[];
}

export function parseDefinitionBundleJson(source: string, sourceName = 'Definition Bundle JSON'): DefinitionBundle {
  let value: unknown;
  try {
    value = JSON.parse(source) as unknown;
  } catch (error) {
    throw new Error(`${sourceName} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  return asDefinitionBundle(value, sourceName);
}

export function asDefinitionBundle(value: unknown, sourceName = 'Definition Bundle'): DefinitionBundle {
  const bundle = requireRecord(value, sourceName);
  requireString(bundle.id, `${sourceName}.id`);
  requireString(bundle.version, `${sourceName}.version`);
  requireString(bundle.label, `${sourceName}.label`);
  optionalString(bundle.description, `${sourceName}.description`);
  asDefinitionBundleSchemaSource(bundle.schema, `${sourceName}.schema`);
  if (!Array.isArray(bundle.entries)) throw new Error(`${sourceName}.entries must be an array.`);
  bundle.entries.forEach((entry, index) => validateDefinitionBundleEntry(entry, `${sourceName}.entries[${index}]`));
  return bundle as unknown as DefinitionBundle;
}

export function findDefinitionBundleEntry(bundle: DefinitionBundle, idOrTypeName: string): DefinitionBundleEntry | undefined {
  return bundle.entries.find((entry) => entry.id === idOrTypeName) ?? bundle.entries.find((entry) => entry.typeName === idOrTypeName);
}

export function getDefinitionBundleSampleInputs(bundle: DefinitionBundle): Record<string, unknown> {
  const sampleInputs: Record<string, unknown> = {};
  for (const entry of bundle.entries) {
    if ('sampleInput' in entry && !Object.prototype.hasOwnProperty.call(sampleInputs, entry.typeName)) {
      sampleInputs[entry.typeName] = entry.sampleInput;
    } else if ('defaultInput' in entry && !Object.prototype.hasOwnProperty.call(sampleInputs, entry.typeName)) {
      sampleInputs[entry.typeName] = entry.defaultInput;
    }
  }
  return sampleInputs;
}

export function getDefinitionBundleUiProfiles(bundle: DefinitionBundle): Record<string, UiProfile> {
  const uiProfiles: Record<string, UiProfile> = {};
  for (const entry of bundle.entries) {
    if (entry.uiProfile && !Object.prototype.hasOwnProperty.call(uiProfiles, entry.typeName)) {
      uiProfiles[entry.typeName] = entry.uiProfile;
    }
  }
  return uiProfiles;
}

export function isRawAsn1BundleSchemaSource(source: DefinitionBundleSchemaSource): source is Extract<DefinitionBundleSchemaSource, { format: 'asn1' }> {
  return source.format === 'asn1';
}

export function isSchemaModelBundleSchemaSource(source: DefinitionBundleSchemaSource): source is Extract<DefinitionBundleSchemaSource, { format: 'schema-model' }> {
  return source.format === 'schema-model';
}

function asDefinitionBundleSchemaSource(value: unknown, path: string): DefinitionBundleSchemaSource {
  const source = requireRecord(value, path);
  const format = requireString(source.format, `${path}.format`);
  if (format === 'asn1') {
    const asn1Source = requireString(source.source, `${path}.source`);
    const sourceName = optionalString(source.sourceName, `${path}.sourceName`);
    return sourceName === undefined ? { format: 'asn1', source: asn1Source } : { format: 'asn1', sourceName, source: asn1Source };
  }
  if (format === 'schema-model') {
    return { format: 'schema-model', schema: requireRecord(source.schema, `${path}.schema`) as unknown as Asn1SchemaModule };
  }
  throw new Error(`${path}.format must be "asn1" or "schema-model".`);
}

function validateDefinitionBundleEntry(value: unknown, path: string): void {
  const entry = requireRecord(value, path);
  optionalString(entry.id, `${path}.id`);
  requireString(entry.typeName, `${path}.typeName`);
  optionalString(entry.label, `${path}.label`);
  optionalString(entry.description, `${path}.description`);
  if (entry.uiProfile !== undefined) requireRecord(entry.uiProfile, `${path}.uiProfile`);
}

function requireRecord(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${path} must be an object.`);
  return value as Record<string, unknown>;
}

function requireString(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${path} must be a non-empty string.`);
  return value;
}

function optionalString(value: unknown, path: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') throw new Error(`${path} must be a string when present.`);
  return value;
}