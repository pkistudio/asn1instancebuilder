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

  it('attaches a UI Profile to the Certificate primary entry', () => {
    const certificateBundle = namedObjectDefinitionBundles.find((bundle) => bundle.id === 'certificate');
    const certificateEntry = certificateBundle ? findDefinitionBundleEntry(certificateBundle, 'certificate') : undefined;

    expect(certificateEntry?.uiProfile?.id).toBe('pkistudio.named-object.certificate.ui-profile');
    expect(certificateEntry?.uiProfile?.typeName).toBe('Certificate');
    expect(certificateEntry?.uiProfile?.fields?.tbsCertificate).toMatchObject({
      label: 'TBSCertificate',
      description: 'Signed certificate body.',
      order: 0
    });
    expect(certificateEntry?.uiProfile?.fields?.['tbsCertificate.issuer']).toMatchObject({
      label: 'Issuer',
      collapsed: true,
      order: 3
    });
    expect(certificateEntry?.uiProfile?.fields?.['tbsCertificate.subjectPublicKeyInfo']).toMatchObject({
      label: 'Subject public key info',
      collapsed: true,
      order: 6
    });
    expect(certificateEntry?.uiProfile?.fields?.['signatureValue.bytes']).toMatchObject({
      label: 'Signature bytes',
      inputMode: 'hex'
    });
  });

  it('does not attach the Certificate UI Profile to child sample entries', () => {
    const certificateBundle = namedObjectDefinitionBundles.find((bundle) => bundle.id === 'certificate');
    const tbsCertificateEntry = certificateBundle ? findDefinitionBundleEntry(certificateBundle, 'TBSCertificate') : undefined;

    expect(tbsCertificateEntry?.sampleInput).toBeDefined();
    expect(tbsCertificateEntry?.uiProfile).toBeUndefined();
  });

  it('attaches a UI Profile to the PkiBundle primary entry', () => {
    const pkiBundle = namedObjectDefinitionBundles.find((bundle) => bundle.id === 'pki-bundle');
    const pkiBundleEntry = pkiBundle ? findDefinitionBundleEntry(pkiBundle, 'pki-bundle') : undefined;

    expect(pkiBundleEntry?.uiProfile?.id).toBe('pkistudio.named-object.pki-bundle.ui-profile');
    expect(pkiBundleEntry?.uiProfile?.typeName).toBe('PkiBundle');
    expect(pkiBundleEntry?.uiProfile?.fields?.signature).toMatchObject({
      label: 'Signature algorithm',
      description: 'Algorithm identifier used by the demo PKI object.',
      order: 0
    });
    expect(pkiBundleEntry?.uiProfile?.fields?.issuer).toMatchObject({
      label: 'Issuer',
      collapsed: true,
      order: 1
    });
    expect(pkiBundleEntry?.uiProfile?.fields?.subjectPublicKeyInfo).toMatchObject({
      label: 'Subject public key info',
      collapsed: true,
      order: 3
    });
    expect(pkiBundleEntry?.uiProfile?.fields?.['extension.extnValue']).toMatchObject({
      label: 'Extension value',
      inputMode: 'hex'
    });
  });

  it('does not attach the PkiBundle UI Profile to child sample entries', () => {
    const pkiBundle = namedObjectDefinitionBundles.find((bundle) => bundle.id === 'pki-bundle');
    const algorithmIdentifierEntry = pkiBundle ? findDefinitionBundleEntry(pkiBundle, 'AlgorithmIdentifier') : undefined;

    expect(algorithmIdentifierEntry?.sampleInput).toBeDefined();
    expect(algorithmIdentifierEntry?.uiProfile).toBeUndefined();
  });
});
