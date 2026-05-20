import { createInstance, exampleDefinition, exampleInput, exampleSchema, parseAsn1Definition, parseGeneratedDer, validateInstance, validateSchemaModule, type Asn1SchemaModule, type InstanceDiagnostic, type SchemaDiagnostic } from '../core';

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

export function initAsn1InstanceBuilder(options: Asn1InstanceBuilderAppOptions): Asn1InstanceBuilderApp {
  const mount = typeof options.mount === 'string' ? document.querySelector<HTMLElement>(options.mount) : options.mount;
  if (!mount) throw new Error('ASN.1 Instance Builder mount element was not found.');

  mount.className = 'asn1ib-root';
  mount.innerHTML = renderShell();

  const definitionText = mustFind<HTMLTextAreaElement>(mount, '[data-role="definition"]');
  const definitionFileInput = mustFind<HTMLInputElement>(mount, '[data-role="definition-file"]');
  const inputText = mustFind<HTMLTextAreaElement>(mount, '[data-role="input"]');
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
  const definitionStatus = mustFind<HTMLElement>(mount, '[data-role="definition-status"]');
  const buildStatus = mustFind<HTMLElement>(mount, '[data-role="build-status"]');
  const buildButton = mustFind<HTMLButtonElement>(mount, '[data-role="build"]');
  const aboutButton = mustFind<HTMLButtonElement>(mount, '[data-role="about"]');
  const aboutDialog = mustFind<HTMLDialogElement>(mount, '[data-role="about-dialog"]');
  const closeAboutButton = mustFind<HTMLButtonElement>(mount, '[data-role="close-about"]');

  let schema = options.schema ?? exampleSchema;
  let input: unknown = options.input ?? exampleInput;
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

  const clearDefinitionWorkspace = () => {
    schema = { name: '', tagDefault: 'explicit', types: [] };
    input = undefined;
    definitionText.value = '';
    inputText.value = '';
    typeSelect.innerHTML = '';
    diagnosticsList.innerHTML = '';
    definitionStatus.textContent = 'Definition input is ready.';
    buildStatus.textContent = 'Build status is ready.';
    updateDefinitionActionState();
  };

  const loadDefinitionText = (text: string, source: string) => {
    if (definitionText.value.trim().length > 0) clearDefinitionWorkspace();
    definitionText.value = text;
    try {
      schema = parseDefinitionInput(text);
      refreshTypeSelect();
      const schemaDiagnostics = validateSchemaModule(schema);
      renderDiagnostics(diagnosticsList, [{ title: 'Schema', diagnostics: schemaDiagnostics }]);
      definitionStatus.textContent = schemaDiagnostics.length > 0 ? `Loaded from ${source}. Definition diagnostics: ${formatDiagnosticSummary(schemaDiagnostics)}` : `Loaded ${schema.types.length} ASN.1 type${schema.types.length === 1 ? '' : 's'} from ${source}.`;
      buildStatus.textContent = 'Definition loaded. Build DER to update the generated output.';
      updateDefinitionActionState();
      appendApiLog(apiLog, apiLogEntries, { level: schemaDiagnostics.some((diagnostic) => diagnostic.severity === 'error') ? 'error' : schemaDiagnostics.length > 0 ? 'warning' : 'success', label: 'loadDefinition', detail: `${source}: ${formatDiagnosticSummary(schemaDiagnostics)}` });
    } catch (error) {
      typeSelect.innerHTML = '';
      renderDiagnostics(diagnosticsList, [{ title: 'Definition', diagnostics: [diagnosticFromError(error)] }]);
      definitionStatus.textContent = `Could not load definition from ${source}: ${error instanceof Error ? error.message : String(error)}`;
      buildStatus.textContent = 'Build status is waiting for a valid definition.';
      updateDefinitionActionState();
      appendApiLog(apiLog, apiLogEntries, { level: 'error', label: 'loadDefinition-error', detail: definitionStatus.textContent });
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
      definitionText.value = JSON.stringify(schema, null, 2);
      refreshTypeSelect();
      updateDefinitionActionState();
    },
    loadInput(nextInput) {
      input = nextInput;
      inputText.value = JSON.stringify(input, null, 2);
      updateDefinitionActionState();
    }
  };

  clearApiLogButton.addEventListener('click', () => {
    apiLogEntries.splice(0);
    renderApiLog(apiLog, apiLogEntries);
  });
  closeDefinitionButton.addEventListener('click', clearDefinitionWorkspace);
  inputText.addEventListener('input', updateDefinitionActionState);
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
  definitionText.value = exampleDefinition;
  refreshTypeSelect();
  updateDefinitionActionState();
  app.loadInput(input);
  void app.build(false);
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
          </div>
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
