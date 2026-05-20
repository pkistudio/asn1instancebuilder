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
   Add validation and UI affordances for `BIT STRING` and `OCTET STRING`, including clearer HEX handling and byte-length diagnostics.

5. Add OID name helpers.
   Let `OBJECT IDENTIFIER` inputs use well-known names through the PkiStudioJS OID resolver while keeping dotted decimal input as the canonical form.

6. Add schema diagnostics.
   Return structured diagnostics for duplicate type names, unknown type references, duplicate field names, unsupported syntax, and unsupported tagging modes.

7. Add instance diagnostics.
   Provide validation results with stable paths such as `tbsCertificate.serialNumber` instead of only throwing errors during DER generation.

8. Expand PKI fixtures.
   Grow fixtures in this order: `AlgorithmIdentifier`, `Name`/`RDNSequence`, `Validity`, `SubjectPublicKeyInfo`, `Extension`, and a minimal `TBSCertificate` subset.

9. Add browser load and save workflows.
   Support loading ASN.1 definitions and instance JSON from files, then saving generated DER, HEX, and instance JSON.

10. Prepare public release hygiene.
    Add CI, release workflow notes, supported/unsupported syntax tables, package metadata review, and a privacy/security note.

## Current Focus

The current implementation focus is expanding realistic PKI fixtures on top of
module header and automatic tagging support.
