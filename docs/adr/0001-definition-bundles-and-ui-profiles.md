# ADR-0001: Separate Definition Bundles and UI Profiles

## Status

Proposed

## Context

ASN.1 Instance Builder currently uses three related concepts when generating DER from user input:

- The Schema Model, produced from ASN.1 definition text or JSON-shaped schema data.
- Instance JSON, the canonical value shape consumed by `validateInstance()` and `createInstance()`.
- Browser app form generation logic, which helps users create and edit Instance JSON.

The 0.1.4 browser app added a schema-driven hybrid Form/JSON Instance Input editor. That made the input experience more approachable, but the form generation behavior still lives inside the browser app implementation. Future PkiStudio modules should be able to reuse consistent input experiences without copying module-specific UI code or changing the DER builder contract.

The project also has bundled NamedObjects that combine ASN.1 definitions and sample inputs in app code. As these grow toward PKI-specific workflows, the package needs a clearer boundary between reusable definition data, canonical instance data, and optional UI metadata.

## Decision

Use the following terms and responsibilities for future design work:

- **Schema Model** remains the canonical schema contract for ASN.1 parsing, schema diagnostics, instance diagnostics, and DER generation.
- **Instance JSON** remains the canonical value contract passed to `validateInstance()` and `createInstance()`.
- **UI Profile** is optional metadata that decorates a Schema Model with input-experience hints such as labels, preferred widgets, placeholders, field order, collapsed state, default input helpers, and byte or time input preferences.
- **Definition Bundle** is a portable packaging unit that can group schema information, named entries, sample or default Instance JSON values, and UI Profiles.

UI Profiles must not become a second DER-generation source of truth. A form renderer should be able to generate a usable generic form from the Schema Model alone, then use a UI Profile to improve the input experience when one is available.

Definition Bundles should begin as an internal data shape before becoming a public package format. The existing NamedObjects feature is the first likely candidate to be reshaped toward Definition Bundles.

## Alternatives

### Keep Form Generation Fully App-Local

The app could keep all form generation behavior in `src/app/main.ts` and let other modules build their own UI. This is simple in the short term but encourages duplicated UI behavior and inconsistent input experiences across PkiStudio tools.

### Make UI JSON a Peer Source of Truth

The project could define a large UI-generation JSON format that describes layout, behavior, validation, and widgets independently from the Schema Model. This would be expressive, but it risks creating a second schema language and weakening the current Schema Model plus Instance JSON contract.

### Build PKI-Specific Wizards First

The project could focus directly on certificate, CSR, CRL, and extension wizards. Those workflows are valuable, but they should layer on top of generic ASN.1 form primitives instead of replacing them.

## Consequences

Positive effects:

- Schema, value, and UI concerns have explicit names and boundaries.
- Existing Core API behavior can remain stable while the browser UI becomes more capable.
- Form generation can evolve toward reusable components without requiring hosts to adopt a complete UI DSL.
- NamedObjects can become data-driven over time.
- PKI-specific widgets can be introduced later as profile-driven enhancements on top of generic ASN.1 widgets.

Trade-offs and constraints:

- The project needs to define path addressing for UI Profile fields, such as dot paths, stable schema node identifiers, or both.
- UI Profile support must remain optional so profile-free Schema Model rendering continues to work.
- Definition Bundle loading should not introduce Node-only runtime dependencies into browser-shipped code.
- The first implementation slices should avoid broad public API commitments until the shapes are proven by internal use.

## Rollout

Suggested rollout order:

1. Refactor the existing form implementation into clearer internal pieces: schema-to-form model mapping, rendering, form edits to Instance JSON updates, and diagnostics path mapping.
2. Draft a minimal internal `UiProfile` TypeScript shape with field-level hints only.
3. Draft an internal `DefinitionBundle` shape that can represent current NamedObjects.
4. Recast NamedObjects toward the bundle shape without changing user-facing behavior.
5. Allow the form renderer to consume optional UI Profile metadata.
6. Add a host or browser-app path for loading Definition Bundles.
7. Revisit whether stable bundle/profile shapes should become public exports or move to a shared PkiStudio definitions package.

## Related

- Issue #16: Plan Definition Bundles and UI Profiles for reusable form generation.
- Issue #13: Add schema-driven hybrid form editing for instance input.
- PR #14: Add hybrid form instance input editor.