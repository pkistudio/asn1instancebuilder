import type { Asn1SchemaModule } from '../core.js';
import type { UiProfile } from './ui-profile.js';

export type DefinitionBundleSchemaSource =
  | {
      format: 'asn1';
      sourceName?: string;
      source: string;
    }
  | {
      format: 'schema-model';
      schema: Asn1SchemaModule;
    };

export interface DefinitionBundleEntry {
  id?: string;
  typeName: string;
  label?: string;
  description?: string;
  sampleInput?: unknown;
  defaultInput?: unknown;
  uiProfile?: UiProfile;
}

/** Internal package shape for schema, entries, sample inputs, and UI metadata. */
export interface DefinitionBundle {
  id: string;
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