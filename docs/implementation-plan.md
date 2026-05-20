# ASN.1 Instance Builder Implementation Plan

This document tracks the next features that are likely to make ASN.1 Instance
Builder more useful for PKI-focused workflows. The project is still a subset
builder, so each item should keep the core API small, testable, and compatible
with browser and Webview hosts.

## Recommended Next Features

1. Extend ASN.1 module headers.
   Support `DEFINITIONS EXPLICIT TAGS ::= BEGIN`, `DEFINITIONS IMPLICIT TAGS ::= BEGIN`, and `DEFINITIONS AUTOMATIC TAGS ::= BEGIN`. Store the tagging default in the Schema Model and use it when a manually tagged type omits `EXPLICIT` or `IMPLICIT`.

2. Expand automatic tagging.
   `AUTOMATIC TAGS` now assigns low-form context-specific implicit tags to untagged `SEQUENCE`, `SET`, and `CHOICE` components. Next, refine edge cases such as open types, CHOICE alternatives that require explicit handling, and extension markers.

3. Refine INTEGER support.
   Negative INTEGER values now use DER two's-complement encoding. Next, add bounds diagnostics and larger fixture coverage for serial-like and signed integer values.

4. Improve binary input ergonomics.
   `BIT STRING` and `OCTET STRING` now accept explicit `{ hex }`, `{ utf8 }`, and `{ base64 }` byte inputs with stricter HEX validation. Next, add browser UI controls and byte-length diagnostics for those input modes.

5. Expand OID name helpers.
   `OBJECT IDENTIFIER` inputs now accept a small built-in PKI name table and schema-provided `oidNames`. Next, bridge this to the PkiStudioJS OID resolver so hosts can share the same OID dictionary across builder and viewer surfaces.

6. Expand schema diagnostics.
   `validateSchemaModule()` now returns structured diagnostics for duplicate type names, unknown type references, duplicate field names, duplicate context-specific tags, unsupported tag numbers, and duplicate named numbers. The browser UI now displays schema diagnostics before DER generation. Next, add parser recovery paths.

7. Expand instance diagnostics.
   `validateInstance()` now returns value diagnostics with stable paths before DER generation. The browser UI now displays instance diagnostics and blocks DER generation on errors. Next, add richer code-specific messages for OID, binary, and time values.

8. Expand PKI fixtures.
   Fixtures now cover `AlgorithmIdentifier`, `Name`/`RDNSequence`, `Validity`, `SubjectPublicKeyInfo`, `Extension`, a composed PKI bundle, a minimal `TBSCertificate` subset with version, serial number, issuer, subject, validity, SPKI, and extensions, a full `Certificate` wrapper, variants for omitted default version and optional extensions, a minimal `CertificateList` CRL wrapper, and a minimal `CertificationRequest` CSR wrapper. Next, add more realistic signature and public-key byte fixtures.

9. Add browser load and save workflows.
   Support loading ASN.1 definitions and instance JSON from files, then saving generated DER, HEX, and instance JSON.

10. Prepare public release hygiene.
    Add CI, release workflow notes, supported/unsupported syntax tables, package metadata review, and a privacy/security note.

## Current Focus

The current implementation focus is adding richer code-specific diagnostics for
OID, binary, and time values, then adding more realistic certificate, CRL, and
CSR signature/public-key byte fixtures.
