import { describe, expect, it } from 'vitest';
import { findDefinitionBundleEntry, isRawAsn1BundleSchemaSource, isSchemaModelBundleSchemaSource, type DefinitionBundle } from '../src/app/definition-bundle';

const bundle: DefinitionBundle = {
  id: 'pkistudio.example.person',
  version: '1.0.0',
  label: 'Person Bundle',
  description: 'Example bundle for a Person type.',
  schema: {
    format: 'asn1',
    source: 'Example DEFINITIONS ::= BEGIN Person ::= UTF8String END'
  },
  entries: [
    {
      id: 'person-default',
      typeName: 'Person',
      label: 'Person',
      sampleInput: 'Alice',
      uiProfile: {
        id: 'person-profile',
        typeName: 'Person',
        fields: {
          value: { label: 'Name' }
        }
      }
    },
    {
      id: 'person-alt',
      typeName: 'Person',
      sampleInput: 'Bob'
    }
  ]
};

describe('Definition Bundle helpers', () => {
  it('finds entries by id before falling back to type name', () => {
    expect(findDefinitionBundleEntry(bundle, 'person-alt')?.sampleInput).toBe('Bob');
    expect(findDefinitionBundleEntry(bundle, 'Person')?.sampleInput).toBe('Alice');
    expect(findDefinitionBundleEntry(bundle, 'Missing')).toBeUndefined();
  });

  it('narrows raw ASN.1 schema sources', () => {
    expect(isRawAsn1BundleSchemaSource(bundle.schema)).toBe(true);
    expect(isSchemaModelBundleSchemaSource(bundle.schema)).toBe(false);
  });

  it('narrows parsed Schema Model sources', () => {
    const parsedBundle: DefinitionBundle = {
      id: 'pkistudio.example.schema-model',
      version: '1.0.0',
      label: 'Schema Model Bundle',
      schema: {
        format: 'schema-model',
        schema: {
          name: 'Example',
          tagDefault: 'explicit',
          types: []
        }
      },
      entries: []
    };

    expect(isRawAsn1BundleSchemaSource(parsedBundle.schema)).toBe(false);
    expect(isSchemaModelBundleSchemaSource(parsedBundle.schema)).toBe(true);
  });
});