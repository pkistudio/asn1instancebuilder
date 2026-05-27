import { createInstance, parseAsn1Definition, parseGeneratedDer, resolveDefinedType, validateInstance, validateSchemaModule, type Asn1Field, type Asn1SchemaModule, type Asn1Type, type InstanceDiagnostic, type SchemaDiagnostic } from '../core.js';
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

declare const __ASN1_INSTANCE_BUILDER_VERSION__: string;

export interface Asn1InstanceBuilderAppOptions {
  mount: string | HTMLElement;
  schema?: Asn1SchemaModule;
  input?: unknown;
}

export interface Asn1InstanceBuilderApp {
  build(openViewerWindow?: boolean): Promise<void>;
  loadSchema(schema: Asn1SchemaModule): void;
  loadInput(input: unknown): void;
}

const VIEWER_STORAGE_PREFIX = 'asn1ib-viewer-';
const emptySchema: Asn1SchemaModule = { name: '', tagDefault: 'explicit', types: [] };

interface NamedObjectDefinition {
  id: string;
  label: string;
  typeName: string;
  sourceName: string;
  definition: string;
  sampleInputs: SampleInputMap;
}

type JsonObject = Record<string, unknown>;
type SampleInputMap = Record<string, unknown>;
type InputMode = 'form' | 'json';

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

const namedObjectDefinitions: NamedObjectDefinition[] = [
  { id: 'person', label: 'Person', typeName: 'Person', sourceName: 'person.asn1', definition: personDefinition, sampleInputs: { Person: personSample } },
  { id: 'tagged-person', label: 'TaggedPerson', typeName: 'TaggedPerson', sourceName: 'tagged-person.asn1', definition: taggedPersonDefinition, sampleInputs: { TaggedPerson: taggedPersonSample } },
  { id: 'binary-record', label: 'BinaryRecord', typeName: 'BinaryRecord', sourceName: 'binary-inputs.asn1', definition: binaryInputsDefinition, sampleInputs: { BinaryRecord: binaryRecordSample } },
  { id: 'default-record', label: 'DefaultRecord', typeName: 'DefaultRecord', sourceName: 'defaults-and-enumerated.asn1', definition: defaultsAndEnumeratedDefinition, sampleInputs: { Status: 'warning', DefaultRecord: defaultRecordSample } },
  { id: 'signed-record', label: 'SignedRecord', typeName: 'SignedRecord', sourceName: 'negative-integer.asn1', definition: negativeIntegerDefinition, sampleInputs: { Delta: 'minusOne', SignedRecord: signedRecordSample } },
  { id: 'versioned-serial', label: 'VersionedSerial', typeName: 'VersionedSerial', sourceName: 'module-tags.asn1', definition: moduleTagsDefinition, sampleInputs: { Version: 'v3', VersionedSerial: x509VersionSample } },
  { id: 'tbs-certificate-prefix', label: 'TBSCertificatePrefix', typeName: 'TBSCertificatePrefix', sourceName: 'x509-version.asn1', definition: x509VersionDefinition, sampleInputs: { Version: 'v3', TBSCertificatePrefix: x509VersionSample } },
  { id: 'certificate', label: 'Certificate', typeName: 'Certificate', sourceName: 'minimal-tbs-certificate.asn1', definition: minimalTbsCertificateDefinition, sampleInputs: { ...pkiComponentSamples, Version: 'v3', TBSCertificate: tbsCertificateSample, Certificate: certificateSample } },
  { id: 'certification-request', label: 'CertificationRequest', typeName: 'CertificationRequest', sourceName: 'minimal-csr.asn1', definition: minimalCsrDefinition, sampleInputs: { ...pkiComponentSamples, AttributeValue: attributeValueSample, AttributeValues: attributeValuesSample, Attribute: attributeSample, Attributes: attributesSample, CertificationRequestInfo: certificationRequestSample.certificationRequestInfo, CertificationRequest: certificationRequestSample } },
  { id: 'certificate-list', label: 'CertificateList', typeName: 'CertificateList', sourceName: 'minimal-crl.asn1', definition: minimalCrlDefinition, sampleInputs: { ...pkiComponentSamples, Version: 'v2', RevokedCertificate: revokedCertificateSample, RevokedCertificates: revokedCertificatesSample, TBSCertList: certificateListSample.tbsCertList, CertificateList: certificateListSample } },
  { id: 'algorithm-identifier', label: 'AlgorithmIdentifier', typeName: 'AlgorithmIdentifier', sourceName: 'oid-names.asn1', definition: oidNamesDefinition, sampleInputs: { AlgorithmIdentifier: algorithmIdentifierSample } },
  { id: 'pki-bundle', label: 'PkiBundle', typeName: 'PkiBundle', sourceName: 'pki-components.asn1', definition: pkiComponentsDefinition, sampleInputs: { ...sharedPkiComponentSamples, PkiBundle: pkiBundleSample } }
];

export function initAsn1InstanceBuilder(options: Asn1InstanceBuilderAppOptions): Asn1InstanceBuilderApp {
  const mount = typeof options.mount === 'string' ? document.querySelector<HTMLElement>(options.mount) : options.mount;
  if (!mount) throw new Error('ASN.1 Instance Builder mount element was not found.');

  mount.className = 'asn1ib-root';
  mount.innerHTML = renderShell();

  const definitionText = mustFind<HTMLTextAreaElement>(mount, '[data-role="definition"]');
  const definitionFileInput = mustFind<HTMLInputElement>(mount, '[data-role="definition-file"]');
  const inputText = mustFind<HTMLTextAreaElement>(mount, '[data-role="input"]');
  const inputForm = mustFind<HTMLElement>(mount, '[data-role="input-form"]');
  const inputModeButtons = Array.from(mount.querySelectorAll<HTMLButtonElement>('[data-role="input-mode"]'));
  const typeSelect = mustFind<HTMLSelectElement>(mount, '[data-role="type"]');
  const diagnosticsList = mustFind<HTMLElement>(mount, '[data-role="diagnostics"]');
  const workspace = mustFind<HTMLElement>(mount, '[data-role="workspace"]');
  const workspaceResizer = mustFind<HTMLElement>(mount, '[data-role="workspace-resizer"]');
  const rightStack = mustFind<HTMLElement>(mount, '[data-role="right-stack"]');
  const diagnosticsResizer = mustFind<HTMLElement>(mount, '[data-role="diagnostics-resizer"]');
  const apiLog = mustFind<HTMLElement>(mount, '[data-role="api-log"]');
  const apiLogResizer = mustFind<HTMLElement>(mount, '[data-role="api-log-resizer"]');
  const clearApiLogButton = mustFind<HTMLButtonElement>(mount, '[data-role="clear-api-log"]');
  const loadDefinitionFileButton = mustFind<HTMLButtonElement>(mount, '[data-role="load-definition-file"]');
  const loadDefinitionClipboardButton = mustFind<HTMLButtonElement>(mount, '[data-role="load-definition-clipboard"]');
  const saveDefinitionFileButton = mustFind<HTMLButtonElement>(mount, '[data-role="save-definition-file"]');
  const closeDefinitionButton = mustFind<HTMLButtonElement>(mount, '[data-role="close-definition"]');
  const namedObjectButtons = Array.from(mount.querySelectorAll<HTMLButtonElement>('[data-role="load-named-object"]'));
  const definitionStatus = mustFind<HTMLElement>(mount, '[data-role="definition-status"]');
  const buildStatus = mustFind<HTMLElement>(mount, '[data-role="build-status"]');
  const buildButton = mustFind<HTMLButtonElement>(mount, '[data-role="build"]');
  const aboutButton = mustFind<HTMLButtonElement>(mount, '[data-role="about"]');
  const aboutDialog = mustFind<HTMLDialogElement>(mount, '[data-role="about-dialog"]');
  const closeAboutButton = mustFind<HTMLButtonElement>(mount, '[data-role="close-about"]');

  let schema = emptySchema;
  let input: unknown;
  let inputMode: InputMode = 'json';
  let currentInstanceDiagnostics: InstanceDiagnostic[] = [];
  let inputFormError: string | undefined;
  let activeSampleInputs: SampleInputMap | undefined;
  const apiLogEntries: ApiLogEntry[] = [];

  initializeWorkspaceResizer(mount, workspace, workspaceResizer);
  initializeDiagnosticsResizer(mount, rightStack, diagnosticsResizer);
  initializeApiLogResizer(mount, apiLogResizer);

  const updateDefinitionActionState = () => {
    const hasDefinition = definitionText.value.trim().length > 0;
    const hasInput = inputText.value.trim().length > 0;
    closeDefinitionButton.disabled = !hasDefinition;
    buildButton.disabled = !hasDefinition || !hasInput || typeSelect.options.length === 0;
  };

  const setInputValue = (nextInput: unknown): void => {
    input = nextInput;
    inputText.value = JSON.stringify(nextInput, null, 2);
    currentInstanceDiagnostics = [];
    inputFormError = undefined;
    renderActiveInputEditor();
    updateDefinitionActionState();
  };

  const createDefaultInputForSelectedType = (): unknown => {
    const typeName = typeSelect.value || schema.types[0]?.name;
    if (!typeName) return {};
    return createDefaultInput(schema, resolveDefinedType(schema, typeName));
  };

  const renderActiveInputEditor = (): void => {
    updateInputModeButtons(inputModeButtons, inputMode);
    inputText.hidden = inputMode !== 'json';
    inputForm.hidden = inputMode !== 'form';
    if (inputMode !== 'form') return;
    if (inputFormError) {
      inputForm.innerHTML = '';
      const message = document.createElement('div');
      message.className = 'asn1ib-form-empty asn1ib-form-error';
      message.textContent = inputFormError;
      inputForm.append(message);
      return;
    }
    const typeName = typeSelect.value || schema.types[0]?.name;
    if (!typeName) {
      inputForm.innerHTML = '<div class="asn1ib-form-empty">Load an ASN.1 definition and select a type.</div>';
      return;
    }
    try {
      const activeInput = input !== undefined ? input : createDefaultInputForSelectedType();
      input = activeInput;
      inputText.value = JSON.stringify(activeInput, null, 2);
      renderInputForm(inputForm, schema, resolveDefinedType(schema, typeName), activeInput, currentInstanceDiagnostics);
    } catch (error) {
      inputForm.innerHTML = '';
      const message = document.createElement('div');
      message.className = 'asn1ib-form-empty asn1ib-form-error';
      message.textContent = error instanceof Error ? error.message : String(error);
      inputForm.append(message);
    }
  };

  const setInputMode = (nextMode: InputMode): void => {
    inputMode = nextMode;
    if (nextMode === 'form') {
      try {
        input = inputText.value.trim().length > 0 ? JSON.parse(inputText.value) as unknown : createDefaultInputForSelectedType();
        inputText.value = JSON.stringify(input, null, 2);
        inputFormError = undefined;
      } catch (error) {
        inputFormError = `JSON input could not be loaded into the form: ${error instanceof Error ? error.message : String(error)}`;
      }
    }
    renderActiveInputEditor();
    updateDefinitionActionState();
  };

  const clearDefinitionWorkspace = () => {
    schema = emptySchema;
    input = undefined;
    currentInstanceDiagnostics = [];
    inputFormError = undefined;
    activeSampleInputs = undefined;
    definitionText.value = '';
    inputText.value = '';
    typeSelect.innerHTML = '';
    diagnosticsList.innerHTML = '';
    definitionStatus.textContent = 'Definition input is ready.';
    buildStatus.textContent = 'Build status is ready.';
    updateDefinitionActionState();
    renderActiveInputEditor();
  };

  const loadDefinitionText = (text: string, source: string, preferredTypeName?: string): boolean => {
    if (definitionText.value.trim().length > 0) clearDefinitionWorkspace();
    definitionText.value = text;
    try {
      schema = parseDefinitionInput(text);
      refreshTypeSelect(preferredTypeName);
      const schemaDiagnostics = validateSchemaModule(schema);
      renderDiagnostics(diagnosticsList, [{ title: 'Schema', diagnostics: schemaDiagnostics }]);
      definitionStatus.textContent = schemaDiagnostics.length > 0 ? `Loaded from ${source}. Definition diagnostics: ${formatDiagnosticSummary(schemaDiagnostics)}` : `Loaded ${schema.types.length} ASN.1 type${schema.types.length === 1 ? '' : 's'} from ${source}.`;
      buildStatus.textContent = 'Definition loaded. Build DER to update the generated output.';
      updateDefinitionActionState();
      renderActiveInputEditor();
      appendApiLog(apiLog, apiLogEntries, { level: schemaDiagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'error' : schemaDiagnostics.length > 0 ? 'warning' : 'success', label: 'loadDefinition', detail: `${source}: ${formatDiagnosticSummary(schemaDiagnostics)}` });
      return true;
    } catch (error) {
      typeSelect.innerHTML = '';
      renderDiagnostics(diagnosticsList, [{ title: 'Definition', diagnostics: [diagnosticFromError(error)] }]);
      definitionStatus.textContent = `Could not load definition from ${source}: ${error instanceof Error ? error.message : String(error)}`;
      buildStatus.textContent = 'Build status is waiting for a valid definition.';
      updateDefinitionActionState();
      appendApiLog(apiLog, apiLogEntries, { level: 'error', label: 'loadDefinition-error', detail: definitionStatus.textContent });
      return false;
    }
  };

  const refreshTypeSelect = (preferredTypeName = typeSelect.value) => {
    typeSelect.innerHTML = '';
    for (const type of schema.types) {
      const option = document.createElement('option');
      option.value = type.name;
      option.textContent = type.name;
      typeSelect.append(option);
    }
    if (preferredTypeName && schema.types.some((type) => type.name === preferredTypeName)) {
      typeSelect.value = preferredTypeName;
    }
  };

  const loadSampleInputForType = (typeName: string): boolean => {
    if (!activeSampleInputs || !Object.prototype.hasOwnProperty.call(activeSampleInputs, typeName)) return false;
    const sampleInput = activeSampleInputs[typeName];
    input = sampleInput;
    inputText.value = JSON.stringify(sampleInput, null, 2);
    currentInstanceDiagnostics = [];
    inputFormError = undefined;
    buildStatus.textContent = `Loaded ${typeName} sample input. Build DER to update the generated output.`;
    updateDefinitionActionState();
    renderActiveInputEditor();
    appendApiLog(apiLog, apiLogEntries, { level: 'success', label: 'loadSampleInput', detail: `${typeName}: loaded sample input.` });
    return true;
  };

  const app: Asn1InstanceBuilderApp = {
    async build(openViewerWindow = true) {
      let handledDiagnosticError = false;
      appendApiLog(apiLog, apiLogEntries, { level: 'info', label: 'build', detail: 'Build DER requested.' });
      try {
        schema = parseDefinitionInput(definitionText.value);
        appendApiLog(apiLog, apiLogEntries, { level: 'success', label: 'parseAsn1Definition', detail: `Loaded ${schema.types.length} type${schema.types.length === 1 ? '' : 's'} from the definition input.` });
        definitionStatus.textContent = `Loaded ${schema.types.length} ASN.1 type${schema.types.length === 1 ? '' : 's'} from the definition.`;
        refreshTypeSelect();
        updateDefinitionActionState();
        const schemaDiagnostics = validateSchemaModule(schema);
        appendApiLog(apiLog, apiLogEntries, { level: schemaDiagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'error' : schemaDiagnostics.length > 0 ? 'warning' : 'success', label: 'validateSchemaModule', detail: formatDiagnosticSummary(schemaDiagnostics) });
        renderDiagnostics(diagnosticsList, [{ title: 'Schema', diagnostics: schemaDiagnostics }]);
        if (schemaDiagnostics.length > 0) {
          definitionStatus.textContent = `Definition diagnostics: ${formatDiagnosticSummary(schemaDiagnostics)}`;
        }
        if (hasDiagnosticErrors(schemaDiagnostics)) {
          handledDiagnosticError = true;
          throw new Error('Schema diagnostics contain errors. Fix them before building DER.');
        }

        input = JSON.parse(inputText.value) as unknown;
        const typeName = typeSelect.value || schema.types[0]?.name;
        if (!typeName) throw new Error('The schema does not define any ASN.1 types.');
        const instanceDiagnostics = validateInstance(schema, typeName, input);
        currentInstanceDiagnostics = instanceDiagnostics;
        renderActiveInputEditor();
        appendApiLog(apiLog, apiLogEntries, { level: instanceDiagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'error' : instanceDiagnostics.length > 0 ? 'warning' : 'success', label: 'validateInstance', detail: `${typeName}: ${formatDiagnosticSummary(instanceDiagnostics)}` });
        renderDiagnostics(diagnosticsList, [
          { title: 'Schema', diagnostics: schemaDiagnostics },
          { title: 'Instance', diagnostics: instanceDiagnostics }
        ]);
        if (hasDiagnosticErrors(instanceDiagnostics)) {
          handledDiagnosticError = true;
          throw new Error('Instance diagnostics contain errors. Fix the input before building DER.');
        }

        const document = createInstance(schema, typeName, input);
        appendApiLog(apiLog, apiLogEntries, { level: 'success', label: 'createInstance', detail: `${document.typeName}: ${document.der.byteLength} DER bytes.` });
        const warningCount = [...schemaDiagnostics, ...instanceDiagnostics].filter((diagnostic) => diagnostic.severity === 'warning').length;
        buildStatus.textContent = warningCount > 0 ? `Built ${document.typeName} as ${document.der.byteLength} DER bytes with ${warningCount} warning${warningCount === 1 ? '' : 's'}.` : `Built ${document.typeName} as ${document.der.byteLength} DER bytes.`;
        if (openViewerWindow) {
          const opened = openPkiStudioViewerWindow(document.der, document.typeName);
          appendApiLog(apiLog, apiLogEntries, { level: opened ? 'success' : 'warning', label: 'openPkiStudioWindow', detail: opened ? `Opened a new PkiStudioJS tab for ${document.typeName}.` : 'The browser blocked the PkiStudioJS window.' });
        }
        await parseGeneratedDer(document.der);
        appendApiLog(apiLog, apiLogEntries, { level: 'success', label: 'parseGeneratedDer', detail: 'PkiStudioJS core parsed the generated DER.' });
      } catch (error) {
        appendApiLog(apiLog, apiLogEntries, { level: 'error', label: 'build-error', detail: error instanceof Error ? error.message : String(error) });
        buildStatus.textContent = error instanceof Error ? error.message : String(error);
        if (!handledDiagnosticError) {
          renderDiagnostics(diagnosticsList, [{ title: 'Build', diagnostics: [diagnosticFromError(error)] }]);
        }
      }
    },
    loadSchema(nextSchema) {
      schema = nextSchema;
      activeSampleInputs = undefined;
      definitionText.value = JSON.stringify(schema, null, 2);
      refreshTypeSelect();
      currentInstanceDiagnostics = [];
      inputFormError = undefined;
      renderActiveInputEditor();
      updateDefinitionActionState();
    },
    loadInput(nextInput) {
      setInputValue(nextInput);
    }
  };

  clearApiLogButton.addEventListener('click', () => {
    apiLogEntries.splice(0);
    renderApiLog(apiLog, apiLogEntries);
  });
  closeDefinitionButton.addEventListener('click', clearDefinitionWorkspace);
  inputText.addEventListener('input', () => {
    currentInstanceDiagnostics = [];
    inputFormError = undefined;
    updateDefinitionActionState();
  });
  for (const button of inputModeButtons) {
    button.addEventListener('click', () => setInputMode(button.dataset.mode === 'form' ? 'form' : 'json'));
  }
  inputForm.addEventListener('input', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement) && !(target instanceof HTMLSelectElement)) return;
    if (!target.dataset.path || !target.dataset.valueKind) return;
    const path = parseFormPath(target.dataset.path);
    input = setFormControlValue(input, path, readControlValue(target));
    inputText.value = JSON.stringify(input, null, 2);
    currentInstanceDiagnostics = [];
    inputFormError = undefined;
    updateDefinitionActionState();
  });
  inputForm.addEventListener('change', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) return;
    if (target instanceof HTMLInputElement && target.dataset.action === 'toggle-field' && target.dataset.path && target.dataset.fieldType) {
      const path = parseFormPath(target.dataset.path);
      input = target.checked ? setValueAtPath(input, path, createDefaultInput(schema, JSON.parse(target.dataset.fieldType) as Asn1Type)) : removeValueAtPath(input, path);
      inputText.value = JSON.stringify(input, null, 2);
      currentInstanceDiagnostics = [];
      inputFormError = undefined;
      renderActiveInputEditor();
      updateDefinitionActionState();
      return;
    }
    if (target.dataset.action === 'choice-selected' && target.dataset.path && target.dataset.choiceType) {
      const path = parseFormPath(target.dataset.path);
      const choice = findChoiceAlternative(schema, JSON.parse(target.dataset.choiceType) as Asn1Type, target.value);
      if (!choice) return;
      input = setValueAtPath(input, path, { selected: target.value, value: createDefaultInput(schema, choice.type) });
      inputText.value = JSON.stringify(input, null, 2);
      currentInstanceDiagnostics = [];
      inputFormError = undefined;
      renderActiveInputEditor();
      updateDefinitionActionState();
      return;
    }
    if (target.dataset.action === 'byte-mode' && target.dataset.path) {
      const path = parseFormPath(target.dataset.path);
      input = setValueAtPath(input, path, { [target.value]: '' });
      inputText.value = JSON.stringify(input, null, 2);
      currentInstanceDiagnostics = [];
      inputFormError = undefined;
      renderActiveInputEditor();
      updateDefinitionActionState();
      return;
    }
    if (target.dataset.path && target.dataset.valueKind) {
      const path = parseFormPath(target.dataset.path);
      input = setFormControlValue(input, path, readControlValue(target));
      inputText.value = JSON.stringify(input, null, 2);
      currentInstanceDiagnostics = [];
      inputFormError = undefined;
      updateDefinitionActionState();
    }
  });
  inputForm.addEventListener('click', (event) => {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button[data-action]') : null;
    if (!button || !button.dataset.path) return;
    const path = parseFormPath(button.dataset.path);
    if (button.dataset.action === 'add-item' && button.dataset.itemType) {
      const current = getValueAtPath(input, path);
      const nextItems = Array.isArray(current) ? [...current] : [];
      nextItems.push(createDefaultInput(schema, JSON.parse(button.dataset.itemType) as Asn1Type));
      input = setValueAtPath(input, path, nextItems);
    } else if (button.dataset.action === 'remove-item' && button.dataset.index) {
      const current = getValueAtPath(input, path);
      if (!Array.isArray(current)) return;
      const nextItems = current.filter((_, index) => index !== Number.parseInt(button.dataset.index ?? '', 10));
      input = setValueAtPath(input, path, nextItems);
    } else {
      return;
    }
    inputText.value = JSON.stringify(input, null, 2);
    currentInstanceDiagnostics = [];
    inputFormError = undefined;
    renderActiveInputEditor();
    updateDefinitionActionState();
  });
  typeSelect.addEventListener('change', () => {
    if (!loadSampleInputForType(typeSelect.value) && inputMode === 'form') {
      setInputValue(createDefaultInputForSelectedType());
    } else {
      renderActiveInputEditor();
    }
  });
  loadDefinitionFileButton.addEventListener('click', () => definitionFileInput.click());
  loadDefinitionClipboardButton.addEventListener('click', async () => {
    try {
      if (definitionText.value.trim().length > 0) clearDefinitionWorkspace();
      const text = await navigator.clipboard.readText();
      loadDefinitionText(text, 'clipboard');
    } catch (error) {
      definitionStatus.textContent = `Could not read definition from clipboard: ${error instanceof Error ? error.message : String(error)}`;
      appendApiLog(apiLog, apiLogEntries, { level: 'error', label: 'clipboard-read-error', detail: definitionStatus.textContent });
    }
  });
  saveDefinitionFileButton.addEventListener('click', () => {
    saveTextFile(definitionText.value, 'asn1-definition.asn1');
    appendApiLog(apiLog, apiLogEntries, { level: 'success', label: 'saveDefinition', detail: 'Saved the definition text to asn1-definition.asn1.' });
  });
  for (const button of namedObjectButtons) {
    button.addEventListener('click', () => {
      const namedObject = namedObjectDefinitions.find((definition) => definition.id === button.dataset.objectId);
      if (!namedObject) return;
      const loaded = loadDefinitionText(namedObject.definition, `NamedObjects: ${namedObject.label} (${namedObject.sourceName})`, namedObject.typeName);
      if (loaded) {
        activeSampleInputs = namedObject.sampleInputs;
        loadSampleInputForType(namedObject.typeName);
      }
      closeMenuAfterSelection(button, definitionText);
    });
  }
  definitionFileInput.addEventListener('change', async () => {
    const file = definitionFileInput.files?.[0];
    definitionFileInput.value = '';
    if (!file) return;
    try {
      if (definitionText.value.trim().length > 0) clearDefinitionWorkspace();
      loadDefinitionText(await file.text(), file.name);
    } catch (error) {
      definitionStatus.textContent = `Could not read definition file: ${error instanceof Error ? error.message : String(error)}`;
      appendApiLog(apiLog, apiLogEntries, { level: 'error', label: 'file-read-error', detail: definitionStatus.textContent });
    }
  });
  buildButton.addEventListener('click', () => void app.build());
  aboutButton.addEventListener('click', () => {
    if (typeof aboutDialog.showModal === 'function') {
      aboutDialog.showModal();
    } else {
      aboutDialog.setAttribute('open', '');
    }
  });
  closeAboutButton.addEventListener('click', () => aboutDialog.close());
  if (options.schema) app.loadSchema(options.schema);
  if (options.input !== undefined) app.loadInput(options.input);
  updateDefinitionActionState();
  renderActiveInputEditor();
  return app;
}

function renderShell(): string {
  return `
    <nav class="asn1ib-toolbar" aria-label="Application toolbar">
      <strong>ASN.1 Instance Builder</strong>
      <button type="button" data-role="about">About</button>
    </nav>
    <main class="asn1ib-workspace" data-role="workspace">
      <section class="asn1ib-panel asn1ib-definition-panel">
        <nav class="asn1ib-pane-menu" aria-label="Definition actions">
          <div class="asn1ib-menu-item">
            <button type="button" aria-haspopup="menu">Load</button>
            <div class="asn1ib-submenu" role="menu">
              <button type="button" role="menuitem" data-role="load-definition-file">from File</button>
              <button type="button" role="menuitem" data-role="load-definition-clipboard">from Clipboard</button>
              <div class="asn1ib-menu-item asn1ib-nested-menu-item" role="none">
                <button type="button" role="menuitem" aria-haspopup="menu">NamedObjects</button>
                <div class="asn1ib-submenu asn1ib-named-objects-menu" role="menu">
                  ${renderNamedObjectMenuItems()}
                </div>
              </div>
            </div>
          </div>
          <div class="asn1ib-menu-item">
            <button type="button" aria-haspopup="menu">Save</button>
            <div class="asn1ib-submenu" role="menu">
              <button type="button" role="menuitem" data-role="save-definition-file">to File</button>
            </div>
          </div>
          <button type="button" data-role="close-definition" disabled>Close</button>
        </nav>
        <div class="asn1ib-left-card">
          <textarea data-role="definition" spellcheck="false" readonly></textarea>
          <input data-role="definition-file" type="file" accept=".asn1,.txt,.json,application/json,text/plain" hidden />
          <p class="asn1ib-notice asn1ib-definition-status" data-role="definition-status">Definition input is ready.</p>
        </div>
      </section>
      <div data-role="workspace-resizer" class="asn1ib-workspace-resizer" role="separator" aria-label="Resize definition pane" aria-orientation="vertical" tabindex="0"></div>
      <section class="asn1ib-right-stack" data-role="right-stack">
        <section class="asn1ib-panel asn1ib-instance-panel">
          <div class="asn1ib-panel-title">
            <span>Instance Input</span>
            <button type="button" data-role="build">Build DER</button>
          </div>
          <div class="asn1ib-instance-controls">
            <select data-role="type" aria-label="ASN.1 type"></select>
            <div class="asn1ib-input-mode-tabs" role="tablist" aria-label="Instance input mode">
              <button type="button" data-role="input-mode" data-mode="form" role="tab">Form</button>
              <button type="button" data-role="input-mode" data-mode="json" role="tab">JSON</button>
            </div>
          </div>
          <div data-role="input-form" class="asn1ib-input-form" hidden></div>
          <textarea data-role="input" spellcheck="false"></textarea>
        </section>
        <div data-role="diagnostics-resizer" class="asn1ib-pane-resizer" role="separator" aria-label="Resize diagnostics pane" aria-orientation="horizontal" tabindex="0"></div>
        <section class="asn1ib-diagnostics-panel">
          <nav class="asn1ib-pane-menu asn1ib-diagnostics-menu" aria-label="Diagnostics pane">
            <span>Diagnostics</span>
          </nav>
          <div class="asn1ib-diagnostics-card">
            <div data-role="diagnostics" class="asn1ib-diagnostics" aria-live="polite"></div>
            <p class="asn1ib-notice asn1ib-build-status" data-role="build-status" aria-live="polite">Build status is ready.</p>
          </div>
        </section>
      </section>
    </main>
    <div data-role="api-log-resizer" class="asn1ib-api-log-resizer" role="separator" aria-label="Resize API log" aria-orientation="horizontal" tabindex="0"></div>
    <section class="asn1ib-log-panel" aria-label="API call log">
      <div class="asn1ib-api-log-header">
        <button type="button" data-role="clear-api-log">Clear</button>
      </div>
      <ol data-role="api-log" class="asn1ib-api-log"></ol>
    </section>
    <dialog class="asn1ib-about-dialog" data-role="about-dialog">
      <section class="asn1ib-about-panel">
        <div>
          <div class="asn1ib-about-name">ASN.1 Instance Builder</div>
          <div class="asn1ib-about-version">Version ${__ASN1_INSTANCE_BUILDER_VERSION__}</div>
        </div>
        <p>Build DER instances from supported ASN.1 definitions and inspect successful output in PkiStudioJS.</p>
        <form method="dialog">
          <button type="button" data-role="close-about">Close</button>
        </form>
      </section>
    </dialog>
  `;
}

function renderNamedObjectMenuItems(): string {
  return namedObjectDefinitions.map((definition) => `<button type="button" role="menuitem" data-role="load-named-object" data-object-id="${definition.id}">${definition.label}</button>`).join('');
}

type FormPathSegment = string | number;

function updateInputModeButtons(buttons: HTMLButtonElement[], mode: InputMode): void {
  for (const button of buttons) {
    const selected = button.dataset.mode === mode;
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-selected', String(selected));
  }
}

function renderInputForm(container: HTMLElement, schemaModule: Asn1SchemaModule, type: Asn1Type, value: unknown, diagnostics: InstanceDiagnostic[]): void {
  container.innerHTML = '';
  container.append(renderValueEditor(schemaModule, type, value, [], diagnostics, 'Value'));
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

function renderNamedNumberSelect(values: { name: string; value: number }[], value: unknown, path: FormPathSegment[], label: string, diagnostics: InstanceDiagnostic[]): HTMLElement {
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

function createDefaultInput(schemaModule: Asn1SchemaModule, type: Asn1Type): unknown {
  const resolved = resolveEditableType(schemaModule, type);
  switch (resolved.kind) {
    case 'boolean':
      return false;
    case 'integer':
      return resolved.values?.[0]?.name ?? 0;
    case 'enumerated':
      return resolved.values[0]?.name ?? 0;
    case 'bitString':
      return { bytes: { hex: '' }, unusedBits: 0 };
    case 'octetString':
      return { hex: '' };
    case 'null':
      return null;
    case 'objectIdentifier':
    case 'utf8String':
    case 'printableString':
    case 'ia5String':
    case 'utcTime':
    case 'generalizedTime':
      return '';
    case 'sequence':
    case 'set': {
      const record: JsonObject = {};
      for (const field of resolved.fields) {
        if (field.optional || 'defaultValue' in field) continue;
        record[field.name] = createDefaultInput(schemaModule, field.type);
      }
      return record;
    }
    case 'choice': {
      const selected = resolved.alternatives[0];
      return selected ? { selected: selected.name, value: createDefaultInput(schemaModule, selected.type) } : { selected: '', value: null };
    }
    case 'sequenceOf':
    case 'setOf':
      return [];
  }
}

function resolveEditableType(schemaModule: Asn1SchemaModule, type: Asn1Type): Asn1Type {
  if (type.kind === 'defined') return resolveEditableType(schemaModule, resolveDefinedType(schemaModule, type.typeName));
  if (type.kind === 'tagged') return resolveEditableType(schemaModule, type.type);
  return type;
}

function findChoiceAlternative(schemaModule: Asn1SchemaModule, type: Asn1Type, selected: string): Asn1Field | undefined {
  const resolved = resolveEditableType(schemaModule, type);
  return resolved.kind === 'choice' ? resolved.alternatives.find((alternative) => alternative.name === selected) : undefined;
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

function readControlValue(control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): unknown {
  if (control.dataset.valueKind === 'boolean' && control instanceof HTMLInputElement) return control.checked;
  if (control.dataset.valueKind === 'number') return Number.parseInt(control.value || '0', 10);
  if (control.dataset.valueKind === 'null') return null;
  return control.value;
}

function stringifyFormPath(path: FormPathSegment[]): string {
  return JSON.stringify(path);
}

function parseFormPath(value: string): FormPathSegment[] {
  const parsed = JSON.parse(value) as FormPathSegment[];
  return Array.isArray(parsed) ? parsed : [];
}

function getValueAtPath(root: unknown, path: FormPathSegment[]): unknown {
  let current = root;
  for (const segment of path) {
    if (Array.isArray(current) && typeof segment === 'number') current = current[segment];
    else if (isPlainObject(current) && typeof segment === 'string') current = current[segment];
    else return undefined;
  }
  return current;
}

function setValueAtPath(root: unknown, path: FormPathSegment[], value: unknown): unknown {
  if (path.length === 0) return value;
  const [head, ...tail] = path;
  if (typeof head === 'number') {
    const next = Array.isArray(root) ? [...root] : [];
    next[head] = setValueAtPath(next[head], tail, value);
    return next;
  }
  const next: JsonObject = isPlainObject(root) ? { ...root } : {};
  next[head] = setValueAtPath(next[head], tail, value);
  return next;
}

function setFormControlValue(root: unknown, path: FormPathSegment[], value: unknown): unknown {
  if (path[path.length - 1] === 'unusedBits') {
    const parentPath = path.slice(0, -1);
    const parentValue = getValueAtPath(root, parentPath);
    if (!isPlainObject(parentValue) || !('bytes' in parentValue)) {
      return setValueAtPath(root, parentPath, { bytes: parentValue ?? { hex: '' }, unusedBits: value });
    }
  }
  return setValueAtPath(root, path, value);
}

function removeValueAtPath(root: unknown, path: FormPathSegment[]): unknown {
  if (path.length === 0) return undefined;
  const [head, ...tail] = path;
  if (typeof head === 'number') {
    const next = Array.isArray(root) ? [...root] : [];
    if (tail.length === 0) next.splice(head, 1);
    else next[head] = removeValueAtPath(next[head], tail);
    return next;
  }
  const next: JsonObject = isPlainObject(root) ? { ...root } : {};
  if (tail.length === 0) delete next[head];
  else next[head] = removeValueAtPath(next[head], tail);
  return next;
}

function isPlainObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function closeMenuAfterSelection(button: HTMLButtonElement, focusTarget: HTMLElement): void {
  const menuItems = Array.from(button.closest('.asn1ib-pane-menu')?.querySelectorAll('.asn1ib-menu-item') ?? []).filter((element) => element instanceof HTMLElement) as HTMLElement[];
  button.blur();
  focusTarget.focus({ preventScroll: true });
  if (menuItems.length === 0) return;
  for (const menuItem of menuItems) menuItem.classList.add('is-closed');
  const reopen = () => {
    for (const menuItem of menuItems) menuItem.classList.remove('is-closed');
  };
  for (const menuItem of menuItems) menuItem.addEventListener('pointerleave', reopen, { once: true });
  window.setTimeout(reopen, 1000);
}

function parseDefinitionInput(value: string): Asn1SchemaModule {
  const trimmed = value.trim();
  if (trimmed.startsWith('{')) return JSON.parse(trimmed) as Asn1SchemaModule;
  return parseAsn1Definition(trimmed);
}

type AppDiagnostic = SchemaDiagnostic | InstanceDiagnostic;

type ApiLogLevel = 'info' | 'success' | 'warning' | 'error';

interface ApiLogEntry {
  timestamp: Date;
  level: ApiLogLevel;
  label: string;
  detail: string;
}

interface NewApiLogEntry {
  level: ApiLogLevel;
  label: string;
  detail: string;
}

interface DiagnosticSection {
  title: string;
  diagnostics: AppDiagnostic[];
}

function renderDiagnostics(container: HTMLElement, sections: DiagnosticSection[]): void {
  container.innerHTML = '';
  const populatedSections = sections.filter((section) => section.diagnostics.length > 0);
  if (populatedSections.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'asn1ib-diagnostics-empty';
    empty.textContent = 'No diagnostics.';
    container.append(empty);
    return;
  }

  for (const section of populatedSections) {
    const sectionElement = document.createElement('section');
    sectionElement.className = 'asn1ib-diagnostics-section';
    const title = document.createElement('div');
    title.className = 'asn1ib-diagnostics-title';
    title.textContent = section.title;
    sectionElement.append(title);

    const list = document.createElement('ul');
    for (const diagnostic of section.diagnostics) {
      const item = document.createElement('li');
      item.className = `asn1ib-diagnostic asn1ib-diagnostic-${diagnostic.severity}`;
      item.textContent = formatDiagnostic(diagnostic);
      list.append(item);
    }
    sectionElement.append(list);
    container.append(sectionElement);
  }
}

function formatDiagnostic(diagnostic: AppDiagnostic): string {
  const path = diagnostic.path.length > 0 ? ` at ${diagnostic.path.join('.')}` : '';
  return `${diagnostic.severity.toUpperCase()} ${diagnostic.code}${path}: ${diagnostic.message}`;
}

function hasDiagnosticErrors(diagnostics: AppDiagnostic[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === 'error');
}

function formatDiagnosticSummary(diagnostics: AppDiagnostic[]): string {
  const errors = diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length;
  const warnings = diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length;
  if (errors === 0 && warnings === 0) return 'no diagnostics.';
  return `${errors} error${errors === 1 ? '' : 's'}, ${warnings} warning${warnings === 1 ? '' : 's'}.`;
}

function appendApiLog(container: HTMLElement, entries: ApiLogEntry[], entry: NewApiLogEntry): void {
  entries.push({ ...entry, timestamp: new Date() });
  if (entries.length > 80) entries.splice(0, entries.length - 80);
  renderApiLog(container, entries);
}

function renderApiLog(container: HTMLElement, entries: ApiLogEntry[]): void {
  container.innerHTML = '';
  for (const entry of entries) {
    const item = document.createElement('li');
    item.className = `asn1ib-api-log-entry ${entry.level}`;

    const time = document.createElement('time');
    time.dateTime = entry.timestamp.toISOString();
    time.textContent = formatApiLogTimestamp(entry.timestamp);

    const operation = document.createElement('span');
    operation.className = 'asn1ib-api-log-operation';
    operation.textContent = entry.label;

    const detail = document.createElement('span');
    detail.className = 'asn1ib-api-log-detail';
    detail.textContent = entry.detail;

    item.append(time, operation, detail);
    container.append(item);
  }
  container.scrollTop = container.scrollHeight;
}

function initializeWorkspaceResizer(root: HTMLElement, workspace: HTMLElement, resizer: HTMLElement): void {
  const minWidth = 260;
  const minRightWidth = 360;
  let startX = 0;
  let startWidth = 0;

  const stopResize = () => {
    root.classList.remove('resizing-columns');
    document.removeEventListener('pointermove', resize);
    document.removeEventListener('pointerup', stopResize);
  };

  const resize = (event: PointerEvent) => {
    setDefinitionPaneWidth(workspace, startWidth + event.clientX - startX, minWidth, minRightWidth);
  };

  resizer.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    startX = event.clientX;
    startWidth = getDefinitionPaneWidth(workspace);
    root.classList.add('resizing-columns');
    document.addEventListener('pointermove', resize);
    document.addEventListener('pointerup', stopResize, { once: true });
  });

  resizer.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const delta = event.key === 'ArrowRight' ? 16 : -16;
    setDefinitionPaneWidth(workspace, getDefinitionPaneWidth(workspace) + delta, minWidth, minRightWidth);
  });
}

function getDefinitionPaneWidth(workspace: HTMLElement): number {
  const definitionPane = workspace.firstElementChild;
  if (definitionPane instanceof HTMLElement) return definitionPane.getBoundingClientRect().width;
  return Number.parseFloat(getComputedStyle(workspace).getPropertyValue('--definition-pane-width')) || 340;
}

function setDefinitionPaneWidth(workspace: HTMLElement, width: number, minWidth: number, minRightWidth: number): void {
  const bounds = workspace.getBoundingClientRect();
  const maxWidth = Math.max(minWidth, bounds.width - minRightWidth - 18);
  const nextWidth = clamp(width, minWidth, maxWidth);
  workspace.style.setProperty('--definition-pane-width', `${nextWidth}px`);
}

function initializeDiagnosticsResizer(root: HTMLElement, rightStack: HTMLElement, resizer: HTMLElement): void {
  const minHeight = 76;
  const minInstanceHeight = 96;
  let startY = 0;
  let startHeight = 0;

  const stopResize = () => {
    root.classList.remove('resizing-inner-rows');
    document.removeEventListener('pointermove', resize);
    document.removeEventListener('pointerup', stopResize);
  };

  const resize = (event: PointerEvent) => {
    setDiagnosticsPaneHeight(rightStack, startHeight - (event.clientY - startY), minHeight, minInstanceHeight);
  };

  resizer.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    startY = event.clientY;
    startHeight = getDiagnosticsPaneHeight(rightStack);
    root.classList.add('resizing-inner-rows');
    document.addEventListener('pointermove', resize);
    document.addEventListener('pointerup', stopResize, { once: true });
  });

  resizer.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    const delta = event.key === 'ArrowUp' ? 16 : -16;
    setDiagnosticsPaneHeight(rightStack, getDiagnosticsPaneHeight(rightStack) + delta, minHeight, minInstanceHeight);
  });
}

function formatApiLogTimestamp(date: Date): string {
  const pad = (value: number, length = 2) => String(value).padStart(length, '0');
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
}

function getDiagnosticsPaneHeight(rightStack: HTMLElement): number {
  const diagnosticsPane = rightStack.lastElementChild;
  if (diagnosticsPane instanceof HTMLElement) return diagnosticsPane.getBoundingClientRect().height;
  return Number.parseFloat(getComputedStyle(rightStack).getPropertyValue('--diagnostics-pane-height')) || 220;
}

function setDiagnosticsPaneHeight(rightStack: HTMLElement, height: number, minHeight: number, minInstanceHeight: number): void {
  const bounds = rightStack.getBoundingClientRect();
  const maxHeight = Math.max(minHeight, bounds.height - minInstanceHeight - 18);
  const nextHeight = clamp(height, minHeight, maxHeight);
  rightStack.style.setProperty('--diagnostics-pane-height', `${nextHeight}px`);
}

function saveTextFile(text: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function initializeApiLogResizer(root: HTMLElement, resizer: HTMLElement): void {
  const minHeight = 86;
  const minWorkspaceHeight = 220;
  let startY = 0;
  let startHeight = 0;

  const stopResize = () => {
    root.classList.remove('resizing-rows');
    document.removeEventListener('pointermove', resize);
    document.removeEventListener('pointerup', stopResize);
  };

  const resize = (event: PointerEvent) => {
    const nextHeight = clamp(startHeight - (event.clientY - startY), minHeight, getMaxApiLogHeight(root, minWorkspaceHeight, minHeight));
    root.style.setProperty('--api-log-height', `${nextHeight}px`);
  };

  resizer.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    startY = event.clientY;
    const currentHeight = getComputedStyle(root).getPropertyValue('--api-log-height').trim();
    startHeight = Number.parseFloat(currentHeight) || 156;
    root.classList.add('resizing-rows');
    document.addEventListener('pointermove', resize);
    document.addEventListener('pointerup', stopResize, { once: true });
  });

  resizer.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    const currentHeight = Number.parseFloat(getComputedStyle(root).getPropertyValue('--api-log-height')) || 156;
    const delta = event.key === 'ArrowUp' ? 16 : -16;
    const nextHeight = clamp(currentHeight + delta, minHeight, getMaxApiLogHeight(root, minWorkspaceHeight, minHeight));
    root.style.setProperty('--api-log-height', `${nextHeight}px`);
  });
}

function getMaxApiLogHeight(root: HTMLElement, minWorkspaceHeight: number, minApiLogHeight: number): number {
  const toolbarHeight = root.querySelector('.asn1ib-toolbar')?.getBoundingClientRect().height ?? 0;
  const splitterHeight = root.querySelector('.asn1ib-api-log-resizer')?.getBoundingClientRect().height ?? 6;
  const availableHeight = root.getBoundingClientRect().height || window.innerHeight;
  return Math.max(minApiLogHeight, Math.floor(availableHeight - toolbarHeight - splitterHeight - minWorkspaceHeight));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function diagnosticFromError(error: unknown): AppDiagnostic {
  return {
    severity: 'error',
    code: 'build-error',
    message: error instanceof Error ? error.message : String(error),
    path: []
  };
}

function openPkiStudioViewerWindow(bytes: Uint8Array, typeName: string): boolean {
  const key = `${VIEWER_STORAGE_PREFIX}${createStorageKey()}`;
  const payload = {
    label: `${typeName} from ASN.1 Instance Builder`,
    bytes: bytesToBase64(bytes)
  };
  try {
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    return false;
  }

  const viewerPageUrl = new URL('viewer.html', window.location.href);
  viewerPageUrl.searchParams.set('subtree', key);
  viewerPageUrl.hash = '';
  const childWindow = window.open(viewerPageUrl.toString(), '_blank');
  if (!childWindow) {
    localStorage.removeItem(key);
    return false;
  }
  childWindow.opener = null;
  window.setTimeout(() => localStorage.removeItem(key), 60_000);
  return true;
}

function createStorageKey(): string {
  return typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.slice(index, index + 0x8000));
  }
  return btoa(binary);
}

function mustFind<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing app element: ${selector}.`);
  return element;
}
