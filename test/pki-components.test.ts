import { describe, expect, it } from 'vitest';
import { bytesToHex, createInstance, parseAsn1Definition, validateInstance, validateSchemaModule } from '../src/core';

const definition = `PkiComponentExample DEFINITIONS EXPLICIT TAGS ::= BEGIN
AlgorithmIdentifier ::= SEQUENCE {
  algorithm OBJECT IDENTIFIER,
  parameters NULL OPTIONAL
}
AttributeTypeAndValue ::= SEQUENCE {
  type OBJECT IDENTIFIER,
  value DirectoryString
}
DirectoryString ::= CHOICE {
  utf8String UTF8String,
  printableString PrintableString
}
RelativeDistinguishedName ::= SET OF AttributeTypeAndValue
RDNSequence ::= SEQUENCE OF RelativeDistinguishedName
Name ::= CHOICE {
  rdnSequence RDNSequence
}
Time ::= CHOICE {
  utcTime UTCTime,
  generalTime GeneralizedTime
}
Validity ::= SEQUENCE {
  notBefore Time,
  notAfter Time
}
SubjectPublicKeyInfo ::= SEQUENCE {
  algorithm AlgorithmIdentifier,
  subjectPublicKey BIT STRING
}
Extension ::= SEQUENCE {
  extnID OBJECT IDENTIFIER,
  critical BOOLEAN DEFAULT FALSE,
  extnValue OCTET STRING
}
END`;

describe('PKI component fixtures', () => {
  const schema = parseAsn1Definition(definition);

  it('validates the PKI component schema', () => {
    expect(validateSchemaModule(schema)).toEqual([]);
  });

  it('builds AlgorithmIdentifier values with OID names', () => {
    const document = createInstance(schema, 'AlgorithmIdentifier', { algorithm: 'sha256WithRSAEncryption', parameters: null });
    expect(bytesToHex(document.der)).toBe('300d06092a864886f70d01010b0500');
  });

  it('builds Name values using RDNSequence and DirectoryString choices', () => {
    const document = createInstance(schema, 'Name', {
      selected: 'rdnSequence',
      value: [[{ type: 'commonName', value: { selected: 'utf8String', value: 'Example CA' } }]]
    });
    expect(bytesToHex(document.der)).toBe('30153113301106035504030c0a4578616d706c65204341');
  });

  it('builds Validity values with Time choices', () => {
    const document = createInstance(schema, 'Validity', {
      notBefore: { selected: 'utcTime', value: '260520000000Z' },
      notAfter: { selected: 'utcTime', value: '270520000000Z' }
    });
    expect(bytesToHex(document.der)).toBe('301e170d3236303532303030303030305a170d3237303532303030303030305a');
  });

  it('builds SubjectPublicKeyInfo values with BIT STRING input objects', () => {
    const document = createInstance(schema, 'SubjectPublicKeyInfo', {
      algorithm: { algorithm: 'rsaEncryption', parameters: null },
      subjectPublicKey: { bytes: { hex: '00' }, unusedBits: 0 }
    });
    expect(bytesToHex(document.der)).toBe('3013300d06092a864886f70d010101050003020000');
  });

  it('builds Extension values and omits default critical when false', () => {
    const explicitCritical = createInstance(schema, 'Extension', {
      extnID: 'basicConstraints',
      critical: true,
      extnValue: { hex: '30030101ff' }
    });
    const defaultCritical = createInstance(schema, 'Extension', {
      extnID: 'basicConstraints',
      extnValue: { hex: '3000' }
    });

    expect(bytesToHex(explicitCritical.der)).toBe('300f0603551d130101ff040530030101ff');
    expect(bytesToHex(defaultCritical.der)).toBe('30090603551d1304023000');
  });

  it('validates a composed PKI bundle instance', () => {
    const bundleSchema = parseAsn1Definition(`${definition.replace('END', '')}
PkiBundle ::= SEQUENCE {
  signature AlgorithmIdentifier,
  issuer Name,
  validity Validity,
  subjectPublicKeyInfo SubjectPublicKeyInfo,
  extension Extension OPTIONAL
}
END`);

    const input = {
      signature: { algorithm: 'sha256WithRSAEncryption', parameters: null },
      issuer: { selected: 'rdnSequence', value: [[{ type: 'commonName', value: { selected: 'utf8String', value: 'Example CA' } }]] },
      validity: {
        notBefore: { selected: 'utcTime', value: '260520000000Z' },
        notAfter: { selected: 'utcTime', value: '270520000000Z' }
      },
      subjectPublicKeyInfo: { algorithm: { algorithm: 'rsaEncryption', parameters: null }, subjectPublicKey: { bytes: { hex: '00' }, unusedBits: 0 } },
      extension: { extnID: 'basicConstraints', critical: true, extnValue: { hex: '30030101ff' } }
    };

    expect(validateInstance(bundleSchema, 'PkiBundle', input)).toEqual([]);
    expect(bytesToHex(createInstance(bundleSchema, 'PkiBundle', input).der).startsWith('30')).toBe(true);
  });
});