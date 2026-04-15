# Contributing

Short version: install with `bun install`, type-check with `bun run
typecheck`, run tests with `bun test`, build the distributable with
`bun run build`. Any PR that keeps all three green is a good starting
point for review.

## Local setup

Requires [Bun](https://bun.sh) 1.1 or newer.

```bash
bun install
bun test
bun run typecheck
bun run build
```

Run the examples individually:

```bash
bun run examples/01-hello-world/build.ts
bun run examples/04-full-tour/build.ts
```

## Filing issues

- **Bug reports**: use the bug template. Include the DSL version
  (commit or tag), Bun and Node versions, and the smallest snippet that
  reproduces.
- **Feature requests**: use the feature template. Describe the problem
  first, the proposed solution second.

## Proposing changes

- Open an issue before large refactors so the approach can be discussed
  before you invest time.
- Keep commits focused. Conventional Commits prefixes (`feat:`, `fix:`,
  `docs:`, `test:`, `chore:`) are the house style.
- Update or add tests alongside behavior changes. `bun test` must stay
  green.
- Update the docs under `docs/` if the public API changes.

## Code style

- No additional dependencies without discussion.
- No Node-only APIs when a Bun primitive exists (`Bun.file()`,
  `Bun.write()`).
- The DSL's public API surface is what's re-exported from
  `src/index.ts`. Anything in `src/internal/` is implementation detail
  and can change without notice.
