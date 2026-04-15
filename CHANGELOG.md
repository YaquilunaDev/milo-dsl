# Changelog

All notable changes to this project are documented in this file. The
format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-04-15

Initial release. Graduates the DSL from proof of concept to a
GitHub-installable library.

### Added

- Public API exported from `src/index.ts`: `defineStory`, `build`,
  `loadAssets`, every command builder, `page`, `gallery`, `file`,
  `variable`, `js`, `html`, `duration`, `seconds`, `minutes`, and all
  public types.
- `src/internal/` for private helpers (symbol brands, type guards, the
  `gotoScript` flattener).
- `tsconfig.build.json` that emits `dist/` with `.js`, `.d.ts`,
  declaration maps, and source maps.
- `prepare` script so GitHub installs produce a built `dist/` without
  committing it.
- Examples tiered as `01-hello-world`, `02-variables-and-conditions`,
  `03-assets`, `04-full-tour`, each with its own `story.ts`, `build.ts`,
  and `README.md`.
- Documentation under `docs/`: commands, variables, embedded JS scope,
  asset workflow, migration from raw JSON.
- `LICENSE` (GPL-3.0-only), `CONTRIBUTING.md`, `CHANGELOG.md`,
  `.editorconfig`.
- GitHub Actions workflow running type-check, tests, and build on push
  and pull requests.
- Issue templates for bug reports and feature requests.

### DSL behavior

Unchanged from the PoC; see `DSL_DESIGN.md` for the semantics.
