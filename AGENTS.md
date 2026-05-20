# Project Guidelines

## Project Overview

ASN.1 Instance Builder is a browser-based ASN.1 instance construction tool and reusable TypeScript API. The package is published as `@pkistudio/asn1instancebuilder`.

Key files:

- `src/core.ts`: public core API barrel for schema parsing, diagnostics, DER building, bytes helpers, and PkiStudioJS adapter helpers.
- `src/core/`: UI-independent ASN.1 schema model, parser, diagnostics, DER encoder, and instance builder implementation.
- `src/app.ts`: browser app package entry.
- `src/app/main.ts`: browser application shell, left definition pane, Instance Input pane, Diagnostics pane, API log, NamedObjects loading, and standalone PkiStudioJS viewer routing.
- `src/viewer.ts`: standalone PkiStudioJS viewer entry for `viewer.html`.
- `src/types/`: local typings for raw bundled assets and `@pkistudio/pkistudiojs` imports.
- `src/styles/styles.css`: application and viewer-host styling.
- `vite.config.ts`: library build configuration and version injection.
- `vite.app.config.ts`: browser app and standalone viewer build configuration.
- `README.md`: user-facing feature, API, package, and release documentation.

## Development Commands

Run these for normal code changes before handing work back:

```sh
npm run check
npm run build
```

Run tests for parser, diagnostics, and DER behavior changes:

```sh
npm test
```

Use this when browser verification is needed:

```sh
npm run dev -- --host 0.0.0.0
```

For package or release-related changes, also run:

```sh
npm run pack:dry-run
```

When checking published package state, use the scoped package name:

```sh
npm view @pkistudio/asn1instancebuilder version --json
```

## Architecture Notes

- Keep the package browser-first and host-neutral. VS Code-specific file access, dialogs, persistence, and Webview lifecycle should remain outside this package.
- Preserve the current Vite and TypeScript build model unless the task explicitly requires changing it.
- Keep UI-specific browser behavior in `src/app/main.ts`; keep reusable ASN.1 parsing, schema diagnostics, instance diagnostics, DER encoding, and byte helpers under `src/core/`.
- `@pkistudio/asn1instancebuilder` and `@pkistudio/asn1instancebuilder/core` expose the UI-independent core API from `dist/index.js` and `dist/core.js`.
- `@pkistudio/asn1instancebuilder/app` exposes `initAsn1InstanceBuilder` from `dist/app.js`, and `@pkistudio/asn1instancebuilder/styles.css` exposes the app stylesheet.
- `package.json` version is the source for `__ASN1_INSTANCE_BUILDER_VERSION__`, the app About display, and release metadata.
- Bundled NamedObjects should stay aligned with the checked-in `.asn1` and `.instance.json` fixtures. Parent objects belong in the `Load -> NamedObjects` menu; child objects should be selectable from the Instance Input type selector after the parent definition loads.
- Generated DER should be passed to the standalone PkiStudioJS viewer through the existing `viewer.html?subtree=<storage-key>` localStorage transfer pattern.
- Updating `@pkistudio/pkistudiojs` for viewer compatibility is normally a dependency and documentation update. Do not infer an ASN.1 Instance Builder feature change from a PkiStudioJS feature release.

## Coding Conventions

- Follow the existing TypeScript style: two-space indentation, semicolons, explicit exported types, and narrow helper functions near their call sites.
- Keep changes focused and avoid broad formatting churn, especially in large UI template or style sections.
- Prefer structured schema/parser/DER helpers over ad hoc byte or string manipulation when implementing ASN.1 behavior.
- Keep browser feature fallbacks intact, including clipboard failures, file input behavior, popup blocking for viewer windows, and browsers without newer APIs.
- Do not introduce Node-only runtime dependencies into code that is shipped to the browser.
- Use `@pkistudio/pkistudiojs` as an external dependency for library builds; do not vendor PkiStudioJS JavaScript assets into this repository.
- Keep npm install, import, and documentation examples using `@pkistudio/asn1instancebuilder`.
- Update README or docs when public API behavior, package exports, browser behavior, NamedObjects behavior, or release workflow expectations change.
- For version bumps, keep at least `package.json`, `package-lock.json`, and the README current version synchronized.

## GitHub And Release Notes

- Prefer `gh` for GitHub issue, PR, tag, and release operations when available.
- The standard release workflow is documented in `.github/prompts/release.prompt.md`.
- Do not merge PRs unless the user explicitly asks to proceed.
- After merge is explicitly approved and required versions, credentials, and checks are in place, proceed with tags, GitHub Releases, npm publication, workflow reruns, and post-publication verification without asking for separate confirmations unless something is blocked or ambiguous.
- For release work, use a PR path: branch, focused commit, push, PR, CI, merge, annotated tag, GitHub Release, npm publication, and final verification.
- npm publication targets `@pkistudio/asn1instancebuilder` and should be verified after publishing with:

  ```sh
  npm view @pkistudio/asn1instancebuilder@<version> version dist-tags dist.tarball --json
  ```

- GitHub Releases should be created for published stable tags and marked as the latest release unless the user instructs otherwise.
- In Codespaces or devcontainers, the default `GITHUB_TOKEN` may not have branch protection administration permissions. Use browser authentication for those operations:

  ```sh
  env -u GITHUB_TOKEN gh auth login --web --scopes repo
  ```