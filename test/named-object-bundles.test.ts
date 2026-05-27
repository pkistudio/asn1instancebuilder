import { describe, expect, it } from 'vitest';
import { namedObjectDefinitionBundles } from '../src/app/named-object-bundles';
import { findDefinitionBundleEntry, isRawAsn1BundleSchemaSource } from '../src/app/definition-bundle';

describe('NamedObjects Definition Bundle catalog', () => {
  it('exposes the built-in parent object bundles', () => {
    expect(namedObjectDefinitionBundles.map((bundle) => bundle.id)).toEqual([
      'person',
      'tagged-person',
      'binary-record',
      'default-record',
      'signed-record',
      'versioned-serial',
      'tbs-certificate-prefix',
      'certificate',
      'certification-request',
      'certificate-list',
      'algorithm-identifier',
      'pki-bundle'
    ]);
  });

  it('keeps each primary entry selectable by bundle id', () => {
    for (const bundle of namedObjectDefinitionBundles) {
      const entry = findDefinitionBundleEntry(bundle, bundle.id);

      expect(entry?.label).toBe(bundle.label);
      expect(entry?.sampleInput).toBeDefined();
    }
  });

  it('uses raw ASN.1 schema sources with display source names', () => {
    for (const bundle of namedObjectDefinitionBundles) {
      expect(isRawAsn1BundleSchemaSource(bundle.schema)).toBe(true);
      expect(bundle.schema.sourceName).toMatch(/\.asn1$/);
      expect(bundle.schema.source).toContain('DEFINITIONS');
    }
  });
});
