import { encodeValue, resolveDefinedType } from './instance-builder';
import type { Asn1Field, Asn1SchemaModule, Asn1Type } from './schema-model';

export type InstanceDiagnosticSeverity = 'error' | 'warning';

export interface InstanceDiagnostic {
  severity: InstanceDiagnosticSeverity;
  code: string;
  message: string;
  path: string[];
}

export function validateInstance(schemaModule: Asn1SchemaModule, typeName: string, input: unknown): InstanceDiagnostic[] {
  try {
    const type = resolveDefinedType(schemaModule, typeName);
    return validateValue(schemaModule, type, input, []);
  } catch (error) {
    return [diagnosticFromError('unknown-type', error, [])];
  }
}

function validateValue(schemaModule: Asn1SchemaModule, type: Asn1Type, input: unknown, path: string[]): InstanceDiagnostic[] {
  switch (type.kind) {
    case 'defined':
      try {
        return validateValue(schemaModule, resolveDefinedType(schemaModule, type.typeName), input, path);
      } catch (error) {
        return [diagnosticFromError('unknown-type', error, path)];
      }
    case 'tagged':
      return validateValue(schemaModule, type.type, input, path);
    case 'sequence':
    case 'set':
      return validateFields(schemaModule, type.fields, input, path);
    case 'choice':
      return validateChoice(schemaModule, type.alternatives, input, path);
    case 'sequenceOf':
    case 'setOf':
      return validateArrayItems(schemaModule, type.elementType, input, path);
    default:
      return validateLeaf(schemaModule, type, input, path);
  }
}

function validateFields(schemaModule: Asn1SchemaModule, fields: Asn1Field[], input: unknown, path: string[]): InstanceDiagnostic[] {
  if (!isRecord(input)) {
    return [{ severity: 'error', code: 'expected-object', message: 'Constructed values expect an object.', path }];
  }

  const diagnostics: InstanceDiagnostic[] = [];
  const knownFields = new Set(fields.map((field) => field.name));

  for (const field of fields) {
    const value = input[field.name];
    if (value === undefined) {
      if (!field.optional && !('defaultValue' in field)) {
        diagnostics.push({ severity: 'error', code: 'missing-field', message: `Missing required field: ${field.name}.`, path: [...path, field.name] });
      }
      continue;
    }
    diagnostics.push(...validateValue(schemaModule, field.type, value, [...path, field.name]));
  }

  for (const key of Object.keys(input)) {
    if (!knownFields.has(key)) {
      diagnostics.push({ severity: 'warning', code: 'unknown-field', message: `Input field "${key}" is not defined by the selected ASN.1 type.`, path: [...path, key] });
    }
  }

  return diagnostics;
}

function validateChoice(schemaModule: Asn1SchemaModule, alternatives: Asn1Field[], input: unknown, path: string[]): InstanceDiagnostic[] {
  if (!isRecord(input) || typeof input.selected !== 'string' || !('value' in input)) {
    return [{ severity: 'error', code: 'expected-choice', message: 'CHOICE expects { selected, value }.', path }];
  }

  const alternative = alternatives.find((candidate) => candidate.name === input.selected);
  if (!alternative) {
    return [{ severity: 'error', code: 'unknown-choice', message: `Unknown CHOICE alternative: ${input.selected}.`, path: [...path, input.selected] }];
  }

  return validateValue(schemaModule, alternative.type, input.value, [...path, input.selected]);
}

function validateArrayItems(schemaModule: Asn1SchemaModule, elementType: Asn1Type, input: unknown, path: string[]): InstanceDiagnostic[] {
  if (!Array.isArray(input)) {
    return [{ severity: 'error', code: 'expected-array', message: 'SEQUENCE OF and SET OF expect an array.', path }];
  }

  return input.flatMap((item, index) => validateValue(schemaModule, elementType, item, [...path, String(index)]));
}

function validateLeaf(schemaModule: Asn1SchemaModule, type: Asn1Type, input: unknown, path: string[]): InstanceDiagnostic[] {
  try {
    encodeValue(schemaModule, type, input);
    return [];
  } catch (error) {
    return [diagnosticFromError('invalid-value', error, path)];
  }
}

function diagnosticFromError(code: string, error: unknown, path: string[]): InstanceDiagnostic {
  const message = error instanceof Error ? error.message.replace(/ at .+$/, '') : String(error);
  return { severity: 'error', code, message, path };
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}