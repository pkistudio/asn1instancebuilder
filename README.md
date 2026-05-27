# ASN.1 Instance Builder

ASN.1 Instance Builder is an experimental browser tool and reusable TypeScript
API for creating concrete DER-encoded data from ASN.1-oriented schema models. It
loads supported ASN.1 definitions, accepts instance JSON, validates the schema and
instance, builds DER bytes, and opens generated output in a standalone
PkiStudioJS ASN.1 viewer.

Hosted viewer: https://pkistudio.github.io/asn1instancebuilder/

Documentation: https://github.com/pkistudio/asn1instancebuilder/wiki

Current version: 0.1.6

The package keeps VS Code-specific file access, dialogs, persistence, and
Webview lifecycle outside `@pkistudio/asn1instancebuilder`; hosts can mount the
browser app shell or call the UI-independent core APIs directly.

## Features

- ASN.1 definition parser for a practical subset of modules, primitive types,
  constructed types, defined type references, defaults, named numbers, and
  low-form context-specific tags.
- Module tag defaults from `EXPLICIT TAGS`, `IMPLICIT TAGS`, and
  `AUTOMATIC TAGS` headers.
- DER builder for instance JSON, including `SEQUENCE`, `SET`, `CHOICE`,
  `SEQUENCE OF`, `SET OF`, time values, OIDs, binary values, and PKI-oriented
  fixtures.
- Schema diagnostics through `validateSchemaModule()` and instance diagnostics
  through `validateInstance()` before DER generation.
- Browser app with Definition, hybrid Form/JSON Instance Input, Diagnostics,
  and API Log panes.
- Bundled `Load` -> `NamedObjects` examples for objects such as `Person`,
  `Certificate`, `CertificationRequest`, `CertificateList`, and `PkiBundle`.
- Standalone PkiStudioJS viewer routing for generated DER.
- UI-independent Core API and embeddable browser app API for Webview and browser
  hosts.

See the Wiki for details:

- [Getting Started](https://github.com/pkistudio/asn1instancebuilder/wiki/Getting-Started)
- [Browser App](https://github.com/pkistudio/asn1instancebuilder/wiki/Browser-App)
- [Core API](https://github.com/pkistudio/asn1instancebuilder/wiki/Core-API)
- [Schema and Instance Model](https://github.com/pkistudio/asn1instancebuilder/wiki/Schema-and-Instance-Model)
- [Embedding](https://github.com/pkistudio/asn1instancebuilder/wiki/Embedding)
- [Testing](https://github.com/pkistudio/asn1instancebuilder/wiki/Testing)
- [Development](https://github.com/pkistudio/asn1instancebuilder/wiki/Development)

## Install

```sh
npm install @pkistudio/asn1instancebuilder
```

Package exports:

- `@pkistudio/asn1instancebuilder`: Core API.
- `@pkistudio/asn1instancebuilder/core`: Core API alias.
- `@pkistudio/asn1instancebuilder/app`: browser application initializer.
- `@pkistudio/asn1instancebuilder/styles.css`: application stylesheet.

## Core API

Use the UI-independent parser, diagnostics, and DER builder when code needs ASN.1
instance construction without mounting the browser app:

```ts
import {
  bytesToHex,
  createInstance,
  parseAsn1Definition,
  validateInstance,
  validateSchemaModule
} from '@pkistudio/asn1instancebuilder';

const schema = parseAsn1Definition(`Example DEFINITIONS ::= BEGIN
Person ::= SEQUENCE {
  name UTF8String,
  age INTEGER OPTIONAL
}
END`);

const input = { name: 'Alice', age: 42 };
const schemaDiagnostics = validateSchemaModule(schema);
const instanceDiagnostics = validateInstance(schema, 'Person', input);

if (schemaDiagnostics.length === 0 && instanceDiagnostics.length === 0) {
  const document = createInstance(schema, 'Person', input);
  console.log(bytesToHex(document.der));
}
```

The Core API exposes the Schema Model, ASN.1 definition parser, diagnostics,
DER builder, byte helpers, OID helpers, example data, and a PkiStudioJS adapter
helper for generated DER parsing. It also exports `pkiComponentDefinition`, a
reusable PKI ASN.1 definition corpus shared by PkiStudio packages.

For full API details, see [Core API](https://github.com/pkistudio/asn1instancebuilder/wiki/Core-API).

## Browser App

Mount the browser application from an embedded Webview or browser app:

```ts
import { initAsn1InstanceBuilder } from '@pkistudio/asn1instancebuilder/app';
import '@pkistudio/asn1instancebuilder/styles.css';

const app = initAsn1InstanceBuilder({ mount: '#app' });

await app.build(false);
```

Hosts can also pass an initial Schema Model and instance input, call
`loadSchema(schema)` and `loadInput(input)`, or load a Definition Bundle with
`loadBundle(bundle, entryIdOrTypeName?)` on the returned app instance. The app
entry also exports the `DefinitionBundle` and `UiProfile` TypeScript types.

```ts
import type { DefinitionBundle } from '@pkistudio/asn1instancebuilder/app';

const rawAsn1Bundle: DefinitionBundle = {
  id: 'pkistudio.example.person',
  version: '1.0.0',
  label: 'Person Example',
  schema: {
    format: 'asn1',
    sourceName: 'person.asn1',
    source: `Example DEFINITIONS ::= BEGIN

Person ::= SEQUENCE {
  name UTF8String,
  age INTEGER OPTIONAL,
  email IA5String OPTIONAL
}

END`
  },
  entries: [{
    id: 'person',
    typeName: 'Person',
    sampleInput: { name: 'Alice', age: 42, email: 'alice@example.test' }
  }]
};

app.loadBundle(rawAsn1Bundle, 'person');
```

Bundles can also carry a parsed Schema Model instead of raw ASN.1 text:

```ts
const schemaModelBundle: DefinitionBundle = {
  id: 'pkistudio.example.person.schema-model',
  version: '1.0.0',
  label: 'Person Schema Model Example',
  schema: {
    format: 'schema-model',
    schema: {
      name: 'Example',
      tagDefault: 'explicit',
      types: [{
        name: 'Person',
        type: {
          kind: 'sequence',
          fields: [{ name: 'name', type: { kind: 'utf8String' } }]
        }
      }]
    }
  },
  entries: [{
    typeName: 'Person',
    defaultInput: { name: 'Alice' },
    uiProfile: {
      id: 'person-profile',
      typeName: 'Person',
      fields: { name: { label: 'Full name', placeholder: 'Alice' } }
    }
  }]
};

app.loadBundle(schemaModelBundle);
```

The built-in `Load` -> `NamedObjects` examples are also exported as reusable
Definition Bundles:

```ts
import { namedObjectDefinitionBundles } from '@pkistudio/asn1instancebuilder/app';

const certificateBundle = namedObjectDefinitionBundles.find((bundle) => bundle.id === 'certificate');
if (certificateBundle) app.loadBundle(certificateBundle, 'certificate');
```

UI Profiles only describe the input experience. Schema diagnostics, instance
diagnostics, and DER generation continue to use the Schema Model and Instance
JSON as the source of truth.

The `DefinitionBundle` and `UiProfile` types are host-facing app API contracts
for `@pkistudio/asn1instancebuilder/app`. In the 0.x series they may gain
additional optional fields, but existing fields are intended to remain
compatible. Bundle `version` describes the bundle payload format, not the npm
package version. Unknown bundle or profile fields are ignored by the current app
helpers so hosts can attach private metadata. When both `sampleInput` and
`defaultInput` are present for an entry type, `sampleInput` is loaded first;
`defaultInput` is the fallback starting value.

See `fixtures/person.definition-bundle.json` for a complete raw ASN.1 bundle
example.

For mounting, app instance methods, host boundaries, and viewer routing, see
[Embedding](https://github.com/pkistudio/asn1instancebuilder/wiki/Embedding).

## Development

Run local checks with:

```sh
npm run check
npm test
npm run build
```

Start the local development server with:

```sh
npm run dev -- --port 5173 --strictPort
```

Then open `http://localhost:5173/`.

For package or release-related changes, also run:

```sh
npm run pack:dry-run
```

For what the standard checks cover and where browser verification is still
needed, see [Testing](https://github.com/pkistudio/asn1instancebuilder/wiki/Testing).

For local server, package entry points, version metadata, release notes, Wiki
preview, and related development details, see
[Development](https://github.com/pkistudio/asn1instancebuilder/wiki/Development).

## PkiStudioJS Dependency

ASN.1 Instance Builder imports PkiStudioJS from the published
`@pkistudio/pkistudiojs` npm package. No vendored PkiStudioJS browser assets are
required under `public/`.

PkiStudioJS is used for generated DER parsing and standalone ASN.1 viewer
behavior. ASN.1 Instance Builder owns schema parsing, instance diagnostics, and
DER construction.

## License

ASN.1 Instance Builder is licensed under the MIT License. See [LICENSE](LICENSE).