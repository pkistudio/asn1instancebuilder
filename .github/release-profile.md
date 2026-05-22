# asn1instancebuilder Release Profile

## Repository

- GitHub repository: `pkistudio/asn1instancebuilder`
- Product name: `ASN.1 Instance Builder`
- npm package name: `@pkistudio/asn1instancebuilder`
- Hosted Pages URL: `https://pkistudio.github.io/asn1instancebuilder/`
- Documentation URL: `https://github.com/pkistudio/asn1instancebuilder/wiki`
- ADR path: `docs/adr/`

## Version And Build

- Version files:
  - `package.json`
  - `package-lock.json`
  - `README.md` (`Current version:`)
- Version source: `package.json` version is injected into `__ASN1_INSTANCE_BUILDER_VERSION__`, the app About display, and release metadata.
- Install command: `npm ci`
- Build command: `npm run build`
- Verification commands:
  - `npm run check`
  - `npm test`
  - `npm run build`
- Package preview command: `npm run pack:dry-run`
- Published package verification:
  - `npm view @pkistudio/asn1instancebuilder@<version> version dist-tags dist.tarball --json`

## Publishing

- npm publish workflow: `.github/workflows/publish-npm.yml`
- npm publish command in workflow: `npm publish --provenance --access public`
- npm publication requires explicit user approval.
- GitHub Release requires explicit user approval.
- Stable published tags should have a GitHub Release marked as latest unless the user instructs otherwise.
- WordPress post workflow: `.github/workflows/publish-release-to-wordpress.yml`
- WordPress post title pattern: `ASN.1 Instance Builder <tag> をリリースしました`

## Pages And Wiki

- Pages workflow: `.github/workflows/pages.yml`
- Pages artifact path: `dist/app-shell`
- Wiki path in Codespaces: `/workspaces/asn1instancebuilder.wiki`
- Keep Wiki work separate from main repository work unless explicitly requested.

## Special Hooks

- Keep the package browser-first and host-neutral. VS Code-specific file access, dialogs, persistence, and Webview lifecycle belong outside this package.
- Updating `@pkistudio/pkistudiojs` for viewer compatibility is normally a dependency and documentation update, not an ASN.1 Instance Builder feature change.
- Browser verification command: `npm run dev -- --port 5173 --strictPort`.
