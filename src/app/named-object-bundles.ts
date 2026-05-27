import type { DefinitionBundle } from './definition-bundle.js';
import binaryInputsDefinition from '../../fixtures/binary-inputs.asn1?raw';
import defaultsAndEnumeratedDefinition from '../../fixtures/defaults-and-enumerated.asn1?raw';
import minimalCrlDefinition from '../../fixtures/minimal-crl.asn1?raw';
import minimalCsrDefinition from '../../fixtures/minimal-csr.asn1?raw';
import minimalTbsCertificateDefinition from '../../fixtures/minimal-tbs-certificate.asn1?raw';
import moduleTagsDefinition from '../../fixtures/module-tags.asn1?raw';
import negativeIntegerDefinition from '../../fixtures/negative-integer.asn1?raw';
import oidNamesDefinition from '../../fixtures/oid-names.asn1?raw';
import personDefinition from '../../fixtures/person.asn1?raw';
import pkiComponentsDefinition from '../../fixtures/pki-components.asn1?raw';
import taggedPersonDefinition from '../../fixtures/tagged-person.asn1?raw';
import x509VersionDefinition from '../../fixtures/x509-version.asn1?raw';
import binaryInputsInput from '../../fixtures/binary-inputs.instance.json?raw';
import defaultsAndEnumeratedInput from '../../fixtures/defaults-and-enumerated.instance.json?raw';
import minimalCertificateInput from '../../fixtures/minimal-certificate.instance.json?raw';
import minimalCrlInput from '../../fixtures/minimal-crl.instance.json?raw';
import minimalCsrInput from '../../fixtures/minimal-csr.instance.json?raw';
import minimalTbsCertificateInput from '../../fixtures/minimal-tbs-certificate.instance.json?raw';
import negativeIntegerInput from '../../fixtures/negative-integer.instance.json?raw';
import oidNamesInput from '../../fixtures/oid-names.instance.json?raw';
import personInput from '../../fixtures/person.instance.json?raw';
import pkiComponentsInput from '../../fixtures/pki-components.instance.json?raw';
import taggedPersonInput from '../../fixtures/tagged-person.instance.json?raw';
import x509VersionInput from '../../fixtures/x509-version.instance.json?raw';

type JsonObject = Record<string, unknown>;
type SampleInputMap = Record<string, unknown>;

interface NamedObjectBundleInput {
  id: string;
  label: string;
  typeName: string;
  sourceName: string;
  definition: string;
  sampleInputs: SampleInputMap;
}

export type NamedObjectDefinitionBundle = DefinitionBundle & {
  schema: Extract<DefinitionBundle['schema'], { format: 'asn1' }> & { sourceName: string };
};

function parseFixtureJson<T = unknown>(source: string): T {
  return JSON.parse(source) as T;
}

const personSample = parseFixtureJson(personInput);
const taggedPersonSample = parseFixtureJson(taggedPersonInput);
const binaryRecordSample = parseFixtureJson(binaryInputsInput);
const defaultRecordSample = parseFixtureJson(defaultsAndEnumeratedInput);
const signedRecordSample = parseFixtureJson(negativeIntegerInput);
const x509VersionSample = parseFixtureJson(x509VersionInput);
const algorithmIdentifierSample = parseFixtureJson(oidNamesInput);
const certificateSample = parseFixtureJson(minimalCertificateInput);
const tbsCertificateSample = parseFixtureJson(minimalTbsCertificateInput);
const certificationRequestSample = parseFixtureJson<JsonObject>(minimalCsrInput);
const certificateListSample = parseFixtureJson<JsonObject>(minimalCrlInput);
const pkiBundleSample = parseFixtureJson<JsonObject>(pkiComponentsInput);

const attributeTypeAndValueSample = {
  type: 'commonName',
  value: { selected: 'utf8String', value: 'Example' }
};
const directoryStringSample = { selected: 'utf8String', value: 'Example' };
const relativeDistinguishedNameSample = [attributeTypeAndValueSample];
const rdnSequenceSample = [relativeDistinguishedNameSample];
const nameSample = pkiBundleSample.issuer;
const timeSample = { selected: 'utcTime', value: '260520000000Z' };
const validitySample = pkiBundleSample.validity;
const sharedSubjectPublicKeyInfoSample = pkiBundleSample.subjectPublicKeyInfo as JsonObject;
const subjectPublicKeyInfoSample = {
  ...sharedSubjectPublicKeyInfoSample,
  algorithm: { algorithm: 'rsaEncryption', parameters: null }
};
const extensionSample = pkiBundleSample.extension;
const extensionsSample = [extensionSample];
const attributeValueSample = { utf8: 'changeit' };
const attributeValuesSample = [attributeValueSample];
const attributeSample = {
  type: '1.2.840.113549.1.9.7',
  values: attributeValuesSample
};
const attributesSample = [attributeSample];
const revokedCertificateSample = {
  userCertificate: 42,
  revocationDate: timeSample
};
const revokedCertificatesSample = [revokedCertificateSample];

const pkiComponentSamples: SampleInputMap = {
  AlgorithmIdentifier: algorithmIdentifierSample,
  AttributeTypeAndValue: attributeTypeAndValueSample,
  DirectoryString: directoryStringSample,
  RelativeDistinguishedName: relativeDistinguishedNameSample,
  RDNSequence: rdnSequenceSample,
  Name: nameSample,
  Time: timeSample,
  Validity: validitySample,
  SubjectPublicKeyInfo: subjectPublicKeyInfoSample,
  Extension: extensionSample,
  Extensions: extensionsSample
};

const sharedPkiComponentSamples: SampleInputMap = {
  ...pkiComponentSamples,
  AlgorithmIdentifier: pkiBundleSample.signature,
  SubjectPublicKeyInfo: sharedSubjectPublicKeyInfoSample
};

function createNamedObjectDefinitionBundle(input: NamedObjectBundleInput): NamedObjectDefinitionBundle {
  return {
    id: input.id,
    version: '1.0.0',
    label: input.label,
    schema: {
      format: 'asn1',
      sourceName: input.sourceName,
      source: input.definition
    },
    entries: Object.entries(input.sampleInputs).map(([typeName, sampleInput]) => ({
      id: typeName === input.typeName ? input.id : undefined,
      typeName,
      label: typeName === input.typeName ? input.label : typeName,
      sampleInput
    }))
  };
}

/** Built-in NamedObjects exposed as reusable app-level Definition Bundles. */
export const namedObjectDefinitionBundles: readonly NamedObjectDefinitionBundle[] = [
  createNamedObjectDefinitionBundle({ id: 'person', label: 'Person', typeName: 'Person', sourceName: 'person.asn1', definition: personDefinition, sampleInputs: { Person: personSample } }),
  createNamedObjectDefinitionBundle({ id: 'tagged-person', label: 'TaggedPerson', typeName: 'TaggedPerson', sourceName: 'tagged-person.asn1', definition: taggedPersonDefinition, sampleInputs: { TaggedPerson: taggedPersonSample } }),
  createNamedObjectDefinitionBundle({ id: 'binary-record', label: 'BinaryRecord', typeName: 'BinaryRecord', sourceName: 'binary-inputs.asn1', definition: binaryInputsDefinition, sampleInputs: { BinaryRecord: binaryRecordSample } }),
  createNamedObjectDefinitionBundle({ id: 'default-record', label: 'DefaultRecord', typeName: 'DefaultRecord', sourceName: 'defaults-and-enumerated.asn1', definition: defaultsAndEnumeratedDefinition, sampleInputs: { Status: 'warning', DefaultRecord: defaultRecordSample } }),
  createNamedObjectDefinitionBundle({ id: 'signed-record', label: 'SignedRecord', typeName: 'SignedRecord', sourceName: 'negative-integer.asn1', definition: negativeIntegerDefinition, sampleInputs: { Delta: 'minusOne', SignedRecord: signedRecordSample } }),
  createNamedObjectDefinitionBundle({ id: 'versioned-serial', label: 'VersionedSerial', typeName: 'VersionedSerial', sourceName: 'module-tags.asn1', definition: moduleTagsDefinition, sampleInputs: { Version: 'v3', VersionedSerial: x509VersionSample } }),
  createNamedObjectDefinitionBundle({ id: 'tbs-certificate-prefix', label: 'TBSCertificatePrefix', typeName: 'TBSCertificatePrefix', sourceName: 'x509-version.asn1', definition: x509VersionDefinition, sampleInputs: { Version: 'v3', TBSCertificatePrefix: x509VersionSample } }),
  createNamedObjectDefinitionBundle({ id: 'certificate', label: 'Certificate', typeName: 'Certificate', sourceName: 'minimal-tbs-certificate.asn1', definition: minimalTbsCertificateDefinition, sampleInputs: { ...pkiComponentSamples, Version: 'v3', TBSCertificate: tbsCertificateSample, Certificate: certificateSample } }),
  createNamedObjectDefinitionBundle({ id: 'certification-request', label: 'CertificationRequest', typeName: 'CertificationRequest', sourceName: 'minimal-csr.asn1', definition: minimalCsrDefinition, sampleInputs: { ...pkiComponentSamples, AttributeValue: attributeValueSample, AttributeValues: attributeValuesSample, Attribute: attributeSample, Attributes: attributesSample, CertificationRequestInfo: certificationRequestSample.certificationRequestInfo, CertificationRequest: certificationRequestSample } }),
  createNamedObjectDefinitionBundle({ id: 'certificate-list', label: 'CertificateList', typeName: 'CertificateList', sourceName: 'minimal-crl.asn1', definition: minimalCrlDefinition, sampleInputs: { ...pkiComponentSamples, Version: 'v2', RevokedCertificate: revokedCertificateSample, RevokedCertificates: revokedCertificatesSample, TBSCertList: certificateListSample.tbsCertList, CertificateList: certificateListSample } }),
  createNamedObjectDefinitionBundle({ id: 'algorithm-identifier', label: 'AlgorithmIdentifier', typeName: 'AlgorithmIdentifier', sourceName: 'oid-names.asn1', definition: oidNamesDefinition, sampleInputs: { AlgorithmIdentifier: algorithmIdentifierSample } }),
  createNamedObjectDefinitionBundle({ id: 'pki-bundle', label: 'PkiBundle', typeName: 'PkiBundle', sourceName: 'pki-components.asn1', definition: pkiComponentsDefinition, sampleInputs: { ...sharedPkiComponentSamples, PkiBundle: pkiBundleSample } })
];
