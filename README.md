# ASN.1 Instance Builder

ASN.1 Instance Builder is an experimental TypeScript module for creating concrete
DER-encoded data from ASN.1-oriented schema models. The project is intended to
fit the PKI Studio family style used by `pvkgadgets` and `certgadgets`: a small
browser app for hands-on work, plus UI-independent core APIs that can be reused
from other browser or Webview hosts.

The repository is private while the initial shape is still settling. The code,
README, fixtures, and API names are written with a future public release in mind.

## Current Direction

The first milestone starts with a hand-written Schema Model and a small ASN.1
definition parser that targets the same model. The parser is intentionally a
subset parser while the instance model and DER builder stabilize.

The intended flow is:

1. Write a supported ASN.1 definition or provide a Schema Model JSON document.
2. Select a defined type.
3. Provide an instance value as JSON-like data.
4. Build DER bytes from the instance value.
5. Inspect the generated DER with PkiStudioJS.

## MVP Scope

The current core prototype supports these schema kinds:

- `BOOLEAN`
- `INTEGER`, including negative values and named integer values such as `v1(0)`
- `BIT STRING`
- `OCTET STRING`
- `NULL`
- `OBJECT IDENTIFIER`
- `UTF8String`
- `PrintableString`
- `IA5String`
- `UTCTime`
- `GeneralizedTime`
- `ENUMERATED`
- `SEQUENCE`
- `SET`
- `CHOICE`
- `SEQUENCE OF`
- `SET OF`
- references to defined types
- low-form context-specific `EXPLICIT` and `IMPLICIT` tags, such as `[0] EXPLICIT UTF8String`
- module tag defaults from `EXPLICIT TAGS`, `IMPLICIT TAGS`, and `AUTOMATIC TAGS` headers
- automatic low-form context-specific tags for untagged `SEQUENCE`, `SET`, and `CHOICE` components
- `DEFAULT` fields for `BOOLEAN`, `INTEGER`, and `ENUMERATED` values
- binary inputs as compact HEX, byte arrays, `{ hex }`, `{ utf8 }`, or `{ base64 }`
- `OBJECT IDENTIFIER` inputs by dotted decimal value, built-in PKI names, or schema-provided `oidNames`
- schema diagnostics through `validateSchemaModule()`
- instance diagnostics through `validateInstance()`

The ASN.1 definition parser currently accepts simple modules shaped like:

```asn1
Example DEFINITIONS ::= BEGIN
Person ::= SEQUENCE {
	name UTF8String,
	age INTEGER OPTIONAL,
	email IA5String OPTIONAL
}
END
```

Tagged fields can be written with explicit tagging mode:

```asn1
TaggedPerson ::= SEQUENCE {
	name [0] EXPLICIT UTF8String,
	age [1] IMPLICIT INTEGER OPTIONAL
}
```

Module headers can define the default tagging mode:

```asn1
ImplicitHeader DEFINITIONS IMPLICIT TAGS ::= BEGIN
VersionedSerial ::= SEQUENCE {
	version [0] Version DEFAULT v1,
	serialNumber INTEGER
}
END
```

When a module uses `EXPLICIT TAGS` or `IMPLICIT TAGS`, manually tagged types can
omit `EXPLICIT` or `IMPLICIT` and the module default is applied. When a module
uses `AUTOMATIC TAGS`, untagged `SEQUENCE`, `SET`, and `CHOICE` components receive
low-form context-specific implicit tags in field order while manually tagged
components keep their existing tag numbers.

Only context-specific low-form tag numbers from `0` through `30` are supported.
Named enumerations and simple defaults are also supported:

```asn1
Status ::= ENUMERATED {
	ok(0),
	warning(1),
	failed(2)
}

DefaultRecord ::= SEQUENCE {
	enabled BOOLEAN DEFAULT TRUE,
	retryCount INTEGER DEFAULT 3,
	status Status DEFAULT ok
}
```

Default fields are omitted when the instance omits the field or provides the
same value as the default. Constraints, extension markers, parameterized types,
value assignments, macros, and full module imports are planned but not part of
this parser slice.

Named integer values support X.509-style definitions:

```asn1
Version ::= INTEGER {
	v1(0),
	v2(1),
	v3(2)
}

TBSCertificatePrefix ::= SEQUENCE {
	version [0] EXPLICIT Version DEFAULT v1,
	serialNumber INTEGER
}
```

Binary values can be provided in several forms:

```json
{
	"payload": { "hex": "de ad be ef" },
	"label": { "utf8": "hello" },
	"flags": { "bytes": { "base64": "oA==" }, "unusedBits": 5 }
}
```

OID values can use dotted decimal text or known names:

```json
{
	"algorithm": "sha256WithRSAEncryption"
}
```

Hosts can also attach an `oidNames` map to the Schema Model:

```json
{
	"name": "Example",
	"tagDefault": "explicit",
	"oidNames": { "exampleAlgorithm": "1.2.3.4.5" },
	"types": []
}
```

Schema diagnostics can be collected before building DER:

```ts
import { parseAsn1Definition, validateSchemaModule } from '@pkistudio/asn1instancebuilder';

const schema = parseAsn1Definition(source);
const diagnostics = validateSchemaModule(schema);
```

Instance input can also be validated with stable paths before DER generation:

```ts
import { validateInstance } from '@pkistudio/asn1instancebuilder';

const diagnostics = validateInstance(schema, 'Person', input);
```

The browser prototype also surfaces schema and instance diagnostics before DER
generation. Error diagnostics block DER output, while warnings stay visible and
allow the generated value to be inspected.

The app shell includes a bottom API log pane that records schema parsing,
diagnostics, DER building, PkiStudioJS Viewer loading, and generated DER parsing
results for each build attempt.

The checked-in fixtures include PKI-oriented component examples for
`AlgorithmIdentifier`, `Name`/`RDNSequence`, `Validity`, `SubjectPublicKeyInfo`,
and `Extension` under `fixtures/pki-components.asn1`, plus a minimal
`TBSCertificate` and `Certificate` example under
`fixtures/minimal-tbs-certificate.asn1`. Certificate instance variants cover an
explicit v3 certificate, a default v1 certificate without extensions, and a v3
certificate without optional extensions. Minimal CRL and CSR wrappers are also
available under `fixtures/minimal-crl.asn1` and `fixtures/minimal-csr.asn1`.

## Development

Install dependencies:

```sh
npm install
```

Start the browser prototype:

```sh
npm run dev
```

Run the local checks:

```sh
npm run check
npm test
npm run build
```

Check the package contents before publication:

```sh
npm run pack:dry-run
```

## Reusing the Core API

Use the ASN.1 definition parser:

```ts
import { bytesToHex, createInstance, parseAsn1Definition } from '@pkistudio/asn1instancebuilder';

const schema = parseAsn1Definition(`Example DEFINITIONS ::= BEGIN
Person ::= SEQUENCE {
	name UTF8String,
	age INTEGER OPTIONAL
}
END`);

const document = createInstance(schema, 'Person', { name: 'Alice', age: 42 });
console.log(bytesToHex(document.der));
```

The lower-level Schema Model API can also be used directly:

```ts
import { bytesToHex, createInstance, type Asn1SchemaModule } from '@pkistudio/asn1instancebuilder';

const schema: Asn1SchemaModule = {
	name: 'Example',
	types: [
		{
			name: 'Person',
			type: {
				kind: 'sequence',
				fields: [
					{ name: 'name', type: { kind: 'utf8String' } },
					{ name: 'age', type: { kind: 'integer' }, optional: true }
				]
			}
		}
	]
};

const document = createInstance(schema, 'Person', { name: 'Alice', age: 42 });
console.log(bytesToHex(document.der));
```

## PkiStudioJS Dependency

The browser app imports PkiStudioJS from `@pkistudio/pkistudiojs` for DER
inspection and embedded viewer behavior:

- `@pkistudio/pkistudiojs/core`
- `@pkistudio/pkistudiojs/oid-resolver`
- `@pkistudio/pkistudiojs/viewer`

The first core slice keeps the Schema Model to DER builder local so the instance
model can stabilize quickly. PkiStudioJS is already wired in as the DER parser
and viewer adapter, and the adapter can grow as shared encoding APIs become the
right boundary.

## Package API Shape

Planned npm exports follow the sibling PKI Studio packages:

- `@pkistudio/asn1instancebuilder`
- `@pkistudio/asn1instancebuilder/core`
- `@pkistudio/asn1instancebuilder/app`
- `@pkistudio/asn1instancebuilder/styles.css`

Host applications should keep file access, dialogs, persistence, and Webview
lifecycle outside this package and pass host behavior through app options as the
browser shell matures.

## License

ASN.1 Instance Builder is licensed under the MIT License. See [LICENSE](LICENSE).