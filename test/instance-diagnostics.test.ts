import { describe, expect, it } from 'vitest';
import { parseAsn1Definition, validateInstance } from '../src/core';

const definition = `DiagnosticsExample DEFINITIONS ::= BEGIN
Person ::= SEQUENCE {
  name UTF8String,
  age INTEGER,
  emails SEQUENCE OF IA5String OPTIONAL,
  contact CHOICE {
    email IA5String,
    identifier OBJECT IDENTIFIER
  } OPTIONAL
}
END`;

describe('instance diagnostics', () => {
  it('returns no diagnostics for valid input', () => {
    const schema = parseAsn1Definition(definition);
    const diagnostics = validateInstance(schema, 'Person', {
      name: 'Alice',
      age: 42,
      emails: ['alice@example.test'],
      contact: { selected: 'identifier', value: 'sha256WithRSAEncryption' }
    });

    expect(diagnostics).toEqual([]);
  });

  it('collects multiple field diagnostics with stable paths', () => {
    const schema = parseAsn1Definition(definition);
    const diagnostics = validateInstance(schema, 'Person', {
      age: 'not an integer',
      emails: ['alice@example.test', 7],
      contact: { selected: 'phone', value: '123' },
      extra: true
    });

    expect(diagnostics).toEqual([
      { severity: 'error', code: 'missing-field', message: 'Missing required field: name.', path: ['name'] },
      { severity: 'error', code: 'invalid-value', message: 'INTEGER expects a named value, number, bigint, or decimal string.', path: ['age'] },
      { severity: 'error', code: 'invalid-value', message: 'ia5String expects a string.', path: ['emails', '1'] },
      { severity: 'error', code: 'unknown-choice', message: 'Unknown CHOICE alternative: phone.', path: ['contact', 'phone'] },
      { severity: 'warning', code: 'unknown-field', message: 'Input field "extra" is not defined by the selected ASN.1 type.', path: ['extra'] }
    ]);
  });

  it('reports unknown top-level type names', () => {
    const schema = parseAsn1Definition(definition);
    expect(validateInstance(schema, 'Missing', {}).map((diagnostic) => diagnostic.code)).toEqual(['unknown-type']);
  });
});