import { bytesToHex, createInstance, exampleDefinition, exampleInput, exampleSchema, parseAsn1Definition, parseGeneratedDer, validateInstance, validateSchemaModule, type Asn1SchemaModule, type InstanceDiagnostic, type SchemaDiagnostic } from '../core';

declare const __ASN1_INSTANCE_BUILDER_VERSION__: string;

export interface Asn1InstanceBuilderAppOptions {
  mount: string | HTMLElement;
  schema?: Asn1SchemaModule;
  input?: unknown;
}

export interface Asn1InstanceBuilderApp {
  build(): Promise<void>;
  loadSchema(schema: Asn1SchemaModule): void;
  loadInput(input: unknown): void;
}

export function initAsn1InstanceBuilder(options: Asn1InstanceBuilderAppOptions): Asn1InstanceBuilderApp {
  const mount = typeof options.mount === 'string' ? document.querySelector<HTMLElement>(options.mount) : options.mount;
  if (!mount) throw new Error('ASN.1 Instance Builder mount element was not found.');

  mount.className = 'asn1ib-root';
  mount.innerHTML = renderShell();

  const definitionText = mustFind<HTMLTextAreaElement>(mount, '[data-role="definition"]');
  const inputText = mustFind<HTMLTextAreaElement>(mount, '[data-role="input"]');
  const typeSelect = mustFind<HTMLSelectElement>(mount, '[data-role="type"]');
  const outputText = mustFind<HTMLTextAreaElement>(mount, '[data-role="output"]');
  const diagnosticsList = mustFind<HTMLElement>(mount, '[data-role="diagnostics"]');
  const apiLog = mustFind<HTMLElement>(mount, '[data-role="api-log"]');
  const status = mustFind<HTMLElement>(mount, '[data-role="status"]');
  const buildButton = mustFind<HTMLButtonElement>(mount, '[data-role="build"]');
  const viewerNotice = mustFind<HTMLElement>(mount, '[data-role="viewer-notice"]');
  const viewerMount = mustFind<HTMLElement>(mount, '[data-role="viewer"]');

  let schema = options.schema ?? exampleSchema;
  let input: unknown = options.input ?? exampleInput;
  let viewer: { loadBytes(bytes: Uint8Array, notice?: string): void; setEditable(editable: boolean): void } | null = null;
  const apiLogEntries: ApiLogEntry[] = [];

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

  const app: Asn1InstanceBuilderApp = {
    async build() {
      let handledDiagnosticError = false;
      appendApiLog(apiLog, apiLogEntries, { level: 'info', label: 'build', detail: 'Build DER requested.' });
      try {
        schema = parseDefinitionInput(definitionText.value);
        appendApiLog(apiLog, apiLogEntries, { level: 'success', label: 'parseAsn1Definition', detail: `Loaded ${schema.types.length} type${schema.types.length === 1 ? '' : 's'} from the definition input.` });
        refreshTypeSelect();
        const schemaDiagnostics = validateSchemaModule(schema);
        appendApiLog(apiLog, apiLogEntries, { level: schemaDiagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'error' : schemaDiagnostics.length > 0 ? 'warning' : 'success', label: 'validateSchemaModule', detail: formatDiagnosticSummary(schemaDiagnostics) });
        renderDiagnostics(diagnosticsList, [{ title: 'Schema', diagnostics: schemaDiagnostics }]);
        if (hasDiagnosticErrors(schemaDiagnostics)) {
          handledDiagnosticError = true;
          outputText.value = '';
          throw new Error('Schema diagnostics contain errors. Fix them before building DER.');
        }

        input = JSON.parse(inputText.value) as unknown;
        const typeName = typeSelect.value || schema.types[0]?.name;
        if (!typeName) throw new Error('The schema does not define any ASN.1 types.');
        const instanceDiagnostics = validateInstance(schema, typeName, input);
        appendApiLog(apiLog, apiLogEntries, { level: instanceDiagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'error' : instanceDiagnostics.length > 0 ? 'warning' : 'success', label: 'validateInstance', detail: `${typeName}: ${formatDiagnosticSummary(instanceDiagnostics)}` });
        renderDiagnostics(diagnosticsList, [
          { title: 'Schema', diagnostics: schemaDiagnostics },
          { title: 'Instance', diagnostics: instanceDiagnostics }
        ]);
        if (hasDiagnosticErrors(instanceDiagnostics)) {
          handledDiagnosticError = true;
          outputText.value = '';
          throw new Error('Instance diagnostics contain errors. Fix the input before building DER.');
        }

        const document = createInstance(schema, typeName, input);
        appendApiLog(apiLog, apiLogEntries, { level: 'success', label: 'createInstance', detail: `${document.typeName}: ${document.der.byteLength} DER bytes.` });
        outputText.value = bytesToHex(document.der);
        const warningCount = [...schemaDiagnostics, ...instanceDiagnostics].filter((diagnostic) => diagnostic.severity === 'warning').length;
        status.textContent = warningCount > 0 ? `Built ${document.typeName} as ${document.der.byteLength} DER bytes with ${warningCount} warning${warningCount === 1 ? '' : 's'}.` : `Built ${document.typeName} as ${document.der.byteLength} DER bytes.`;
        viewer ??= await initViewer(viewerMount);
        viewer?.loadBytes(document.der, `Loaded ${document.typeName} from ASN.1 Instance Builder.`);
        appendApiLog(apiLog, apiLogEntries, { level: viewer ? 'success' : 'warning', label: 'viewer.loadBytes', detail: viewer ? `Loaded ${document.der.byteLength} bytes into PkiStudioJS Viewer.` : 'PkiStudioJS Viewer is not available.' });
        viewerNotice.textContent = `Viewer loaded ${document.typeName}.`;
        await parseGeneratedDer(document.der);
        appendApiLog(apiLog, apiLogEntries, { level: 'success', label: 'parseGeneratedDer', detail: 'PkiStudioJS core parsed the generated DER.' });
      } catch (error) {
        appendApiLog(apiLog, apiLogEntries, { level: 'error', label: 'build-error', detail: error instanceof Error ? error.message : String(error) });
        outputText.value = '';
        status.textContent = error instanceof Error ? error.message : String(error);
        viewerNotice.textContent = viewer ? 'Viewer shows the last successfully built DER.' : 'Viewer will load after a successful build.';
        if (!handledDiagnosticError) {
          renderDiagnostics(diagnosticsList, [{ title: 'Build', diagnostics: [diagnosticFromError(error)] }]);
        }
      }
    },
    loadSchema(nextSchema) {
      schema = nextSchema;
      definitionText.value = JSON.stringify(schema, null, 2);
      refreshTypeSelect();
    },
    loadInput(nextInput) {
      input = nextInput;
      inputText.value = JSON.stringify(input, null, 2);
    }
  };

  buildButton.addEventListener('click', () => void app.build());
  definitionText.value = exampleDefinition;
  refreshTypeSelect();
  app.loadInput(input);
  void app.build();
  return app;
}

function renderShell(): string {
  return `
    <header class="asn1ib-header">
      <div>
        <h1>ASN.1 Instance Builder</h1>
        <p>ASN.1 definition to DER prototype, version ${__ASN1_INSTANCE_BUILDER_VERSION__}</p>
      </div>
      <button type="button" data-role="build">Build DER</button>
    </header>
    <main class="asn1ib-workspace">
      <section class="asn1ib-panel">
        <div class="asn1ib-panel-title">ASN.1 Definition or Schema Model</div>
        <textarea data-role="definition" spellcheck="false"></textarea>
      </section>
      <section class="asn1ib-panel">
        <div class="asn1ib-panel-title">Instance Input</div>
        <select data-role="type" aria-label="ASN.1 type"></select>
        <textarea data-role="input" spellcheck="false"></textarea>
        <div class="asn1ib-output-label">DER HEX</div>
        <textarea data-role="output" spellcheck="false" readonly></textarea>
        <div class="asn1ib-output-label">Diagnostics</div>
        <div data-role="diagnostics" class="asn1ib-diagnostics" aria-live="polite"></div>
      </section>
      <section class="asn1ib-panel asn1ib-viewer-panel">
        <div class="asn1ib-panel-title">PkiStudioJS Viewer</div>
        <div data-role="viewer-notice" class="asn1ib-viewer-notice"></div>
        <div data-role="viewer" class="asn1ib-viewer"></div>
      </section>
    </main>
    <section class="asn1ib-log-panel" aria-label="API call log">
      <div class="asn1ib-log-title">API Log</div>
      <ol data-role="api-log" class="asn1ib-api-log"></ol>
    </section>
    <footer class="asn1ib-status" data-role="status"></footer>
  `;
}

function parseDefinitionInput(value: string): Asn1SchemaModule {
  const trimmed = value.trim();
  if (trimmed.startsWith('{')) return JSON.parse(trimmed) as Asn1SchemaModule;
  return parseAsn1Definition(trimmed);
}

type AppDiagnostic = SchemaDiagnostic | InstanceDiagnostic;

type ApiLogLevel = 'info' | 'success' | 'warning' | 'error';

interface ApiLogEntry {
  time: string;
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
  entries.push({ ...entry, time: new Date().toLocaleTimeString() });
  if (entries.length > 80) entries.splice(0, entries.length - 80);
  renderApiLog(container, entries);
}

function renderApiLog(container: HTMLElement, entries: ApiLogEntry[]): void {
  container.innerHTML = '';
  for (const entry of entries) {
    const item = document.createElement('li');
    item.className = `asn1ib-api-log-entry asn1ib-api-log-${entry.level}`;

    const meta = document.createElement('span');
    meta.className = 'asn1ib-api-log-meta';
    meta.textContent = `${entry.time} ${entry.label}`;

    const detail = document.createElement('span');
    detail.className = 'asn1ib-api-log-detail';
    detail.textContent = entry.detail;

    item.append(meta, detail);
    container.append(item);
  }
  container.scrollTop = container.scrollHeight;
}

function diagnosticFromError(error: unknown): AppDiagnostic {
  return {
    severity: 'error',
    code: 'build-error',
    message: error instanceof Error ? error.message : String(error),
    path: []
  };
}

async function initViewer(mount: HTMLElement): Promise<{ loadBytes(bytes: Uint8Array, notice?: string): void; setEditable(editable: boolean): void } | null> {
  try {
    const viewer = await import('@pkistudio/pkistudiojs/viewer');
    const oidResolver = await import('@pkistudio/pkistudiojs/oid-resolver');
    const instance = viewer.init({ mount, editable: false, oidResolver: oidResolver.create() });
    instance.setEditable(false);
    return instance;
  } catch (error) {
    mount.textContent = error instanceof Error ? error.message : String(error);
    return null;
  }
}

function mustFind<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing app element: ${selector}.`);
  return element;
}
