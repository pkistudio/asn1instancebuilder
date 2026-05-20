import { describe, expect, it } from 'vitest';
import { bytesToHex, createInstance, parseAsn1Definition, validateInstance, validateSchemaModule } from '../src/core';

const definition = `MinimalCertificateExample DEFINITIONS EXPLICIT TAGS ::= BEGIN
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
Extensions ::= SEQUENCE OF Extension
Version ::= INTEGER {
  v1(0),
  v2(1),
  v3(2)
}
TBSCertificate ::= SEQUENCE {
  version [0] EXPLICIT Version DEFAULT v1,
  serialNumber INTEGER,
  signature AlgorithmIdentifier,
  issuer Name,
  validity Validity,
  subject Name,
  subjectPublicKeyInfo SubjectPublicKeyInfo,
  extensions [3] EXPLICIT Extensions OPTIONAL
}
END`;

const baseInput = {
  serialNumber: 42,
  signature: { algorithm: 'sha256WithRSAEncryption', parameters: null },
  issuer: { selected: 'rdnSequence', value: [[{ type: 'commonName', value: { selected: 'utf8String', value: 'Example CA' } }]] },
  validity: {
    notBefore: { selected: 'utcTime', value: '260520000000Z' },
    notAfter: { selected: 'utcTime', value: '270520000000Z' }
  },
  subject: { selected: 'rdnSequence', value: [[{ type: 'commonName', value: { selected: 'utf8String', value: 'Example EE' } }]] },
  subjectPublicKeyInfo: { algorithm: { algorithm: 'rsaEncryption', parameters: null }, subjectPublicKey: { bytes: { hex: '00' }, unusedBits: 0 } }
};

describe('minimal TBSCertificate fixture', () => {
  const schema = parseAsn1Definition(definition);

  it('validates the certificate schema', () => {
    expect(validateSchemaModule(schema)).toEqual([]);
  });

  it('builds a v3 TBSCertificate with explicit version and extensions', () => {
    const input = {
      version: 'v3',
      ...baseInput,
      extensions: [{ extnID: 'basicConstraints', critical: true, extnValue: { hex: '30030101ff' } }]
    };
    const document = createInstance(schema, 'TBSCertificate', input);
    const hex = bytesToHex(document.der);

    expect(validateInstance(schema, 'TBSCertificate', input)).toEqual([]);
    expect(hex.startsWith('30818fa00302010202012a')).toBe(true);
    expect(hex.includes('a3133011300f0603551d130101ff040530030101ff')).toBe(true);
  });

  it('omits the default v1 version field', () => {
    const document = createInstance(schema, 'TBSCertificate', baseInput);
    const hex = bytesToHex(document.der);

    expect(validateInstance(schema, 'TBSCertificate', baseInput)).toEqual([]);
    expect(hex.startsWith('3075')).toBe(true);
    expect(hex.includes('a003020100')).toBe(false);
  });
});