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