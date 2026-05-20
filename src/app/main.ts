import { bytesToHex, createInstance, exampleDefinition, exampleInput, exampleSchema, parseAsn1Definition, parseGeneratedDer, type Asn1SchemaModule } from '../core';

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
  const status = mustFind<HTMLElement>(mount, '[data-role="status"]');
  const buildButton = mustFind<HTMLButtonElement>(mount, '[data-role="build"]');
  const viewerMount = mustFind<HTMLElement>(mount, '[data-role="viewer"]');

  let schema = options.schema ?? exampleSchema;
  let input: unknown = options.input ?? exampleInput;
  let viewer: { loadBytes(bytes: Uint8Array, notice?: string): void; setEditable(editable: boolean): void } | null = null;

  const refreshTypeSelect = () => {
    typeSelect.innerHTML = '';
    for (const type of schema.types) {
      const option = document.createElement('option');
      option.value = type.name;
      option.textContent = type.name;
      typeSelect.append(option);
    }
  };

  const app: Asn1InstanceBuilderApp = {
    async build() {
      try {
        schema = parseDefinitionInput(definitionText.value);
        input = JSON.parse(inputText.value) as unknown;
        refreshTypeSelect();
        const typeName = typeSelect.value || schema.types[0]?.name;
        if (!typeName) throw new Error('The schema does not define any ASN.1 types.');
        const document = createInstance(schema, typeName, input);
        outputText.value = bytesToHex(document.der);
        status.textContent = `Built ${document.typeName} as ${document.der.byteLength} DER bytes.`;
        viewer ??= await initViewer(viewerMount);
        viewer?.loadBytes(document.der, `Loaded ${document.typeName} from ASN.1 Instance Builder.`);
        await parseGeneratedDer(document.der);
      } catch (error) {
        status.textContent = error instanceof Error ? error.message : String(error);
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
      </section>
      <section class="asn1ib-panel asn1ib-viewer-panel">
        <div class="asn1ib-panel-title">PkiStudioJS Viewer</div>
        <div data-role="viewer" class="asn1ib-viewer"></div>
      </section>
    </main>
    <footer class="asn1ib-status" data-role="status"></footer>
  `;
}

function parseDefinitionInput(value: string): Asn1SchemaModule {
  const trimmed = value.trim();
  if (trimmed.startsWith('{')) return JSON.parse(trimmed) as Asn1SchemaModule;
  return parseAsn1Definition(trimmed);
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
