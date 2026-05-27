import { createDefaultInput, isPlainObject, resolveEditableType, stringifyFormPath, type FormPathSegment } from './form-model.js';
import type { Asn1Field, Asn1NamedNumber, Asn1SchemaModule, Asn1Type, InstanceDiagnostic } from '../core.js';

export type InputMode = 'form' | 'json';

export function updateInputModeButtons(buttons: HTMLButtonElement[], mode: InputMode): void {
  for (const button of buttons) {
    const selected = button.dataset.mode === mode;
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-selected', String(selected));
  }
}

export function renderInputForm(container: HTMLElement, schemaModule: Asn1SchemaModule, type: Asn1Type, value: unknown, diagnostics: InstanceDiagnostic[]): void {
  container.innerHTML = '';
  container.append(renderValueEditor(schemaModule, type, value, [], diagnostics, 'Value'));
}

export function readFormControlValue(control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): unknown {
  if (control.dataset.valueKind === 'boolean' && control instanceof HTMLInputElement) return control.checked;
  if (control.dataset.valueKind === 'number') return Number.parseInt(control.value || '0', 10);
  if (control.dataset.valueKind === 'null') return null;
  return control.value;
}

function renderValueEditor(schemaModule: Asn1SchemaModule, type: Asn1Type, value: unknown, path: FormPathSegment[], diagnostics: InstanceDiagnostic[], label: string): HTMLElement {
  const resolved = resolveEditableType(schemaModule, type);
  switch (resolved.kind) {
    case 'sequence':
    case 'set':
      return renderFieldGroup(schemaModule, resolved.fields, value, path, diagnostics, label);
    case 'choice':
      return renderChoiceEditor(schemaModule, resolved, value, path, diagnostics, label);
    case 'sequenceOf':
    case 'setOf':
      return renderArrayEditor(schemaModule, resolved.elementType, value, path, diagnostics, label);
    case 'bitString':
      return renderBitStringEditor(value, path, diagnostics, label);
    case 'octetString':
      return renderByteEditor(value, path, diagnostics, label, 'OCTET STRING');
    default:
      return renderPrimitiveEditor(resolved, value, path, diagnostics, label, schemaModule);
  }
}

function renderFieldGroup(schemaModule: Asn1SchemaModule, fields: Asn1Field[], value: unknown, path: FormPathSegment[], diagnostics: InstanceDiagnostic[], label: string): HTMLElement {
  const group = document.createElement('section');
  group.className = 'asn1ib-form-group';
  group.append(renderFormLegend(label));
  const objectValue = isPlainObject(value) ? value : {};

  for (const field of fields) {
    const fieldPath = [...path, field.name];
    const hasValue = Object.prototype.hasOwnProperty.call(objectValue, field.name);
    const row = document.createElement('section');
    row.className = 'asn1ib-form-field';

    const header = document.createElement('div');
    header.className = 'asn1ib-form-field-header';
    const title = document.createElement('span');
    title.textContent = field.name;
    header.append(title);

    if (field.optional || 'defaultValue' in field) {
      const toggleLabel = document.createElement('label');
      toggleLabel.className = 'asn1ib-form-toggle';
      const toggle = document.createElement('input');
      toggle.type = 'checkbox';
      toggle.checked = hasValue;
      toggle.dataset.action = 'toggle-field';
      toggle.dataset.path = stringifyFormPath(fieldPath);
      toggle.dataset.fieldType = JSON.stringify(field.type);
      toggleLabel.append(toggle, document.createTextNode('Set'));
      header.append(toggleLabel);
    }
    row.append(header);

    if (hasValue || (!field.optional && !('defaultValue' in field))) {
      row.append(renderValueEditor(schemaModule, field.type, objectValue[field.name], fieldPath, diagnostics, field.name));
    } else if ('defaultValue' in field) {
      row.append(renderFormHint('Using ASN.1 DEFAULT value.'));
    } else {
      row.append(renderFormHint('Optional field omitted.'));
    }
    appendFieldDiagnostics(row, diagnostics, fieldPath);
    group.append(row);
  }

  appendFieldDiagnostics(group, diagnostics, path);
  return group;
}

function renderChoiceEditor(schemaModule: Asn1SchemaModule, type: Extract<Asn1Type, { kind: 'choice' }>, value: unknown, path: FormPathSegment[], diagnostics: InstanceDiagnostic[], label: string): HTMLElement {
  const wrapper = document.createElement('section');
  wrapper.className = 'asn1ib-form-choice';
  wrapper.append(renderFormLegend(label));
  const choiceValue = isPlainObject(value) ? value : { selected: type.alternatives[0]?.name, value: undefined };
  const selectedName = typeof choiceValue.selected === 'string' ? choiceValue.selected : type.alternatives[0]?.name ?? '';
  const selected = type.alternatives.find((alternative) => alternative.name === selectedName) ?? type.alternatives[0];

  const selectRow = document.createElement('label');
  selectRow.className = 'asn1ib-form-control-row';
  const selectLabel = document.createElement('span');
  selectLabel.textContent = 'Alternative';
  const select = document.createElement('select');
  select.dataset.action = 'choice-selected';
  select.dataset.path = stringifyFormPath(path);
  select.dataset.choiceType = JSON.stringify(type);
  for (const alternative of type.alternatives) {
    const option = document.createElement('option');
    option.value = alternative.name;
    option.textContent = alternative.name;
    select.append(option);
  }
  select.value = selected?.name ?? '';
  selectRow.append(selectLabel, select);
  wrapper.append(selectRow);

  if (selected) {
    const nestedValue = selectedName === choiceValue.selected && 'value' in choiceValue ? choiceValue.value : createDefaultInput(schemaModule, selected.type);
    wrapper.append(renderValueEditor(schemaModule, selected.type, nestedValue, [...path, 'value'], diagnostics, selected.name));
  }
  appendFieldDiagnostics(wrapper, diagnostics, path);
  return wrapper;
}

function renderArrayEditor(schemaModule: Asn1SchemaModule, elementType: Asn1Type, value: unknown, path: FormPathSegment[], diagnostics: InstanceDiagnostic[], label: string): HTMLElement {
  const wrapper = document.createElement('section');
  wrapper.className = 'asn1ib-form-array';
  const header = document.createElement('div');
  header.className = 'asn1ib-form-array-header';
  header.append(renderFormLegend(label));
  const addButton = document.createElement('button');
  addButton.type = 'button';
  addButton.textContent = 'Add';
  addButton.dataset.action = 'add-item';
  addButton.dataset.path = stringifyFormPath(path);
  addButton.dataset.itemType = JSON.stringify(elementType);
  header.append(addButton);
  wrapper.append(header);

  const items = Array.isArray(value) ? value : [];
  if (items.length === 0) wrapper.append(renderFormHint('No items.'));
  items.forEach((item, index) => {
    const itemSection = document.createElement('section');
    itemSection.className = 'asn1ib-form-array-item';
    const itemHeader = document.createElement('div');
    itemHeader.className = 'asn1ib-form-array-item-header';
    const itemTitle = document.createElement('span');
    itemTitle.textContent = `Item ${index + 1}`;
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.textContent = 'Remove';
    removeButton.dataset.action = 'remove-item';
    removeButton.dataset.path = stringifyFormPath(path);
    removeButton.dataset.index = String(index);
    itemHeader.append(itemTitle, removeButton);
    itemSection.append(itemHeader, renderValueEditor(schemaModule, elementType, item, [...path, index], diagnostics, `Item ${index + 1}`));
    wrapper.append(itemSection);
  });
  appendFieldDiagnostics(wrapper, diagnostics, path);
  return wrapper;
}

function renderBitStringEditor(value: unknown, path: FormPathSegment[], diagnostics: InstanceDiagnostic[], label: string): HTMLElement {
  const wrapper = document.createElement('section');
  wrapper.className = 'asn1ib-form-byte-compound';
  wrapper.append(renderFormLegend(label));
  const bitStringValue = isPlainObject(value) && 'bytes' in value ? value : { bytes: value ?? { hex: '' }, unusedBits: 0 };
  wrapper.append(renderByteEditor(bitStringValue.bytes, [...path, 'bytes'], diagnostics, 'Bytes', 'BIT STRING'));
  wrapper.append(renderNumberControl(bitStringValue.unusedBits ?? 0, [...path, 'unusedBits'], 'Unused bits', 0, 7));
  appendFieldDiagnostics(wrapper, diagnostics, path);
  return wrapper;
}

function renderByteEditor(value: unknown, path: FormPathSegment[], diagnostics: InstanceDiagnostic[], label: string, typeLabel: string): HTMLElement {
  const wrapper = document.createElement('section');
  wrapper.className = 'asn1ib-form-byte-editor';
  wrapper.append(renderFormLegend(label));
  const mode = getByteMode(value);
  const content = getByteContent(value, mode);

  const modeRow = document.createElement('label');
  modeRow.className = 'asn1ib-form-control-row';
  const modeLabel = document.createElement('span');
  modeLabel.textContent = `${typeLabel} mode`;
  const select = document.createElement('select');
  select.dataset.action = 'byte-mode';
  select.dataset.path = stringifyFormPath(path);
  for (const optionValue of ['hex', 'utf8', 'base64']) {
    const option = document.createElement('option');
    option.value = optionValue;
    option.textContent = optionValue;
    select.append(option);
  }
  select.value = mode;
  modeRow.append(modeLabel, select);

  const inputRow = document.createElement('label');
  inputRow.className = 'asn1ib-form-control-row';
  const inputLabel = document.createElement('span');
  inputLabel.textContent = mode;
  const input = document.createElement('textarea');
  input.rows = 2;
  input.value = content;
  input.dataset.path = stringifyFormPath([...path, mode]);
  input.dataset.valueKind = 'string';
  inputRow.append(inputLabel, input);
  wrapper.append(modeRow, inputRow);
  appendFieldDiagnostics(wrapper, diagnostics, path);
  return wrapper;
}

function renderPrimitiveEditor(type: Asn1Type, value: unknown, path: FormPathSegment[], diagnostics: InstanceDiagnostic[], label: string, schemaModule: Asn1SchemaModule): HTMLElement {
  if (type.kind === 'boolean') return renderCheckboxControl(value === true, path, label, diagnostics);
  if (type.kind === 'integer') {
    if (type.values && type.values.length > 0) return renderNamedNumberSelect(type.values, value, path, label, diagnostics);
    return renderNumberControl(value, path, label);
  }
  if (type.kind === 'enumerated') return renderNamedNumberSelect(type.values, value, path, label, diagnostics);
  if (type.kind === 'null') return renderNullControl(path, label, diagnostics);
  const suggestions = type.kind === 'objectIdentifier' ? Object.keys(schemaModule.oidNames ?? {}) : [];
  return renderTextControl(typeof value === 'string' ? value : '', path, label, type.kind, diagnostics, suggestions);
}

function renderTextControl(value: string, path: FormPathSegment[], label: string, kind: string, diagnostics: InstanceDiagnostic[], suggestions: string[] = []): HTMLElement {
  const row = document.createElement('label');
  row.className = 'asn1ib-form-control-row';
  const text = document.createElement('span');
  text.textContent = label;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = value;
  input.placeholder = kind;
  input.dataset.path = stringifyFormPath(path);
  input.dataset.valueKind = 'string';
  if (suggestions.length > 0) {
    const listId = `asn1ib-oid-${Math.random().toString(16).slice(2)}`;
    input.setAttribute('list', listId);
    const list = document.createElement('datalist');
    list.id = listId;
    for (const suggestion of suggestions) {
      const option = document.createElement('option');
      option.value = suggestion;
      list.append(option);
    }
    row.append(text, input, list);
  } else {
    row.append(text, input);
  }
  appendFieldDiagnostics(row, diagnostics, path);
  return row;
}

function renderNumberControl(value: unknown, path: FormPathSegment[], label: string, min?: number, max?: number): HTMLElement {
  const row = document.createElement('label');
  row.className = 'asn1ib-form-control-row';
  const text = document.createElement('span');
  text.textContent = label;
  const input = document.createElement('input');
  input.type = 'number';
  input.step = '1';
  if (min !== undefined) input.min = String(min);
  if (max !== undefined) input.max = String(max);
  input.value = typeof value === 'number' || typeof value === 'string' ? String(value) : '0';
  input.dataset.path = stringifyFormPath(path);
  input.dataset.valueKind = 'number';
  row.append(text, input);
  return row;
}

function renderCheckboxControl(value: boolean, path: FormPathSegment[], label: string, diagnostics: InstanceDiagnostic[]): HTMLElement {
  const row = document.createElement('label');
  row.className = 'asn1ib-form-checkbox-row';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = value;
  input.dataset.path = stringifyFormPath(path);
  input.dataset.valueKind = 'boolean';
  row.append(input, document.createTextNode(label));
  appendFieldDiagnostics(row, diagnostics, path);
  return row;
}

function renderNamedNumberSelect(values: Asn1NamedNumber[], value: unknown, path: FormPathSegment[], label: string, diagnostics: InstanceDiagnostic[]): HTMLElement {
  const row = document.createElement('label');
  row.className = 'asn1ib-form-control-row';
  const text = document.createElement('span');
  text.textContent = label;
  const select = document.createElement('select');
  select.dataset.path = stringifyFormPath(path);
  select.dataset.valueKind = 'string';
  for (const namedValue of values) {
    const option = document.createElement('option');
    option.value = namedValue.name;
    option.textContent = `${namedValue.name} (${namedValue.value})`;
    select.append(option);
  }
  select.value = typeof value === 'string' ? value : values.find((namedValue) => namedValue.value === value)?.name ?? values[0]?.name ?? '';
  row.append(text, select);
  appendFieldDiagnostics(row, diagnostics, path);
  return row;
}

function renderNullControl(path: FormPathSegment[], label: string, diagnostics: InstanceDiagnostic[]): HTMLElement {
  const row = document.createElement('div');
  row.className = 'asn1ib-form-null-row';
  const text = document.createElement('span');
  text.textContent = label;
  const value = document.createElement('code');
  value.textContent = 'null';
  row.append(text, value);
  appendFieldDiagnostics(row, diagnostics, path);
  return row;
}

function renderFormLegend(label: string): HTMLElement {
  const legend = document.createElement('div');
  legend.className = 'asn1ib-form-legend';
  legend.textContent = label;
  return legend;
}

function renderFormHint(text: string): HTMLElement {
  const hint = document.createElement('div');
  hint.className = 'asn1ib-form-hint';
  hint.textContent = text;
  return hint;
}

function appendFieldDiagnostics(container: HTMLElement, diagnostics: InstanceDiagnostic[], path: FormPathSegment[]): void {
  const matching = diagnostics.filter((diagnostic) => pathsMatch(diagnostic.path, path));
  for (const diagnostic of matching) {
    const message = document.createElement('div');
    message.className = `asn1ib-form-diagnostic asn1ib-form-diagnostic-${diagnostic.severity}`;
    message.textContent = diagnostic.message;
    container.append(message);
  }
}

function pathsMatch(diagnosticPath: string[], formPath: FormPathSegment[]): boolean {
  if (diagnosticPath.length !== formPath.length) return false;
  return diagnosticPath.every((segment, index) => segment === String(formPath[index]));
}

function getByteMode(value: unknown): 'hex' | 'utf8' | 'base64' {
  if (isPlainObject(value)) {
    if (typeof value.utf8 === 'string') return 'utf8';
    if (typeof value.base64 === 'string') return 'base64';
  }
  return 'hex';
}

function getByteContent(value: unknown, mode: 'hex' | 'utf8' | 'base64'): string {
  if (isPlainObject(value) && typeof value[mode] === 'string') return value[mode];
  if (typeof value === 'string' && mode === 'hex') return value;
  return '';
}