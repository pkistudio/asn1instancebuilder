import { normalizeBytes } from './bytes';
import { encodeBitString, encodeBoolean, encodeEnumerated, encodeExplicitContextSpecificTag, encodeImplicitContextSpecificTag, encodeInteger, encodeNull, encodeObjectIdentifier, encodeOctetString, encodeSequence, encodeSet, encodeText } from './der';
import { Asn1InstanceBuilderError, withPath } from './errors';
import type { Asn1Field, Asn1SchemaModule, Asn1Type, BitStringInput, ChoiceInput, InstanceDocument } from './schema-model';

export function createInstance(schemaModule: Asn1SchemaModule, typeName: string, input: unknown): InstanceDocument {
  const type = resolveDefinedType(schemaModule, typeName);
  return {
    moduleName: schemaModule.name,
    typeName,
    der: encodeValue(schemaModule, type, input)
  };
}

export function encodeValue(schemaModule: Asn1SchemaModule, type: Asn1Type, input: unknown): Uint8Array {
  switch (type.kind) {
    case 'tagged':
      return encodeTaggedValue(schemaModule, type, input);
    case 'enumerated':
      return encodeEnumerated(resolveEnumeratedInput(type, input));
    case 'boolean':
      if (typeof input !== 'boolean') throw new Asn1InstanceBuilderError('BOOLEAN expects a boolean value.');
      return encodeBoolean(input);
    case 'integer':
      if (!isIntegerInput(input)) throw new Asn1InstanceBuilderError('INTEGER expects a number, bigint, or decimal string.');
      return encodeInteger(input);
    case 'bitString':
      return encodeBitStringInput(input);
    case 'octetString':
      return encodeOctetString(normalizeBytesInput(input, 'OCTET STRING'));
    case 'null':
      if (input !== null) throw new Asn1InstanceBuilderError('NULL expects null.');
      return encodeNull();
    case 'objectIdentifier':
      if (typeof input !== 'string') throw new Asn1InstanceBuilderError('OBJECT IDENTIFIER expects a dotted decimal string.');
      return encodeObjectIdentifier(input);
    case 'utf8String':
    case 'printableString':
    case 'ia5String':
    case 'utcTime':
    case 'generalizedTime':
      if (typeof input !== 'string') throw new Asn1InstanceBuilderError(`${type.kind} expects a string.`);
      return encodeText(type.kind, input);
    case 'sequence':
      return encodeSequence(encodeFields(schemaModule, type.fields, input));
    case 'set':
      return encodeSet(encodeFields(schemaModule, type.fields, input));
    case 'choice':
      return encodeChoice(schemaModule, type.alternatives, input);
    case 'sequenceOf':
      return encodeSequence(encodeArrayItems(schemaModule, type.elementType, input));
    case 'setOf':
      return encodeSet(encodeArrayItems(schemaModule, type.elementType, input));
    case 'defined':
      return encodeValue(schemaModule, resolveDefinedType(schemaModule, type.typeName), input);
  }
}

function encodeTaggedValue(schemaModule: Asn1SchemaModule, type: Extract<Asn1Type, { kind: 'tagged' }>, input: unknown): Uint8Array {
  const inner = encodeValue(schemaModule, type.type, input);
  if (type.tag.class !== 'context') throw new Asn1InstanceBuilderError('Only context-specific tags are supported.');
  return type.tag.mode === 'explicit' ? encodeExplicitContextSpecificTag(type.tag.number, inner) : encodeImplicitContextSpecificTag(type.tag.number, inner);
}

export function resolveDefinedType(schemaModule: Asn1SchemaModule, typeName: string): Asn1Type {
  const definition = schemaModule.types.find((candidate) => candidate.name === typeName);
  if (!definition) throw new Asn1InstanceBuilderError(`Unknown ASN.1 type: ${typeName}.`);
  return definition.type;
}

function encodeFields(schemaModule: Asn1SchemaModule, fields: Asn1Field[], input: unknown): Uint8Array[] {
  if (!isRecord(input)) throw new Asn1InstanceBuilderError('Constructed values expect an object.');
  const encoded: Uint8Array[] = [];
  for (const field of fields) {
    const value = input[field.name];
    if (value === undefined) {
      if ('defaultValue' in field) continue;
      if (field.optional) continue;
      throw new Asn1InstanceBuilderError(`Missing required field: ${field.name}.`);
    }
    if ('defaultValue' in field && valuesEqual(value, field.defaultValue)) continue;
    try {
      encoded.push(encodeValue(schemaModule, field.type, value));
    } catch (error) {
      withPath(error, field.name);
    }
  }
  return encoded;
}

function resolveEnumeratedInput(type: Extract<Asn1Type, { kind: 'enumerated' }>, input: unknown): number {
  if (typeof input === 'number' && Number.isInteger(input)) return input;
  if (typeof input === 'string') {
    const named = type.values.find((candidate) => candidate.name === input);
    if (named) return named.value;
    if (/^\d+$/.test(input)) return Number.parseInt(input, 10);
  }
  throw new Asn1InstanceBuilderError('ENUMERATED expects a named value or integer value.');
}

function valuesEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function encodeChoice(schemaModule: Asn1SchemaModule, alternatives: Asn1Field[], input: unknown): Uint8Array {
  if (!isChoiceInput(input)) throw new Asn1InstanceBuilderError('CHOICE expects { selected, value }.');
  const alternative = alternatives.find((candidate) => candidate.name === input.selected);
  if (!alternative) throw new Asn1InstanceBuilderError(`Unknown CHOICE alternative: ${input.selected}.`);
  try {
    return encodeValue(schemaModule, alternative.type, input.value);
  } catch (error) {
    withPath(error, input.selected);
  }
}

function encodeArrayItems(schemaModule: Asn1SchemaModule, elementType: Asn1Type, input: unknown): Uint8Array[] {
  if (!Array.isArray(input)) throw new Asn1InstanceBuilderError('SEQUENCE OF and SET OF expect an array.');
  return input.map((item, index) => {
    try {
      return encodeValue(schemaModule, elementType, item);
    } catch (error) {
      withPath(error, String(index));
    }
  });
}

function encodeBitStringInput(input: unknown): Uint8Array {
  if (isBitStringInput(input)) {
    return encodeBitString(normalizeBytes(input.bytes), input.unusedBits ?? 0);
  }
  return encodeBitString(normalizeBytesInput(input, 'BIT STRING'));
}

function normalizeBytesInput(input: unknown, typeName: string): Uint8Array {
  if (input instanceof Uint8Array || Array.isArray(input) || typeof input === 'string') {
    return normalizeBytes(input);
  }
  throw new Asn1InstanceBuilderError(`${typeName} expects HEX text, a number array, or Uint8Array.`);
}

function isIntegerInput(input: unknown): input is bigint | number | string {
  return typeof input === 'bigint' || (typeof input === 'number' && Number.isInteger(input)) || (typeof input === 'string' && /^\d+$/.test(input));
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

function isChoiceInput(input: unknown): input is ChoiceInput {
  return isRecord(input) && typeof input.selected === 'string' && 'value' in input;
}

function isBitStringInput(input: unknown): input is BitStringInput {
  return isRecord(input) && 'bytes' in input;
}
