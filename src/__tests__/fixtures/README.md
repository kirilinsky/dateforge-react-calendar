# v3 test fixtures (Phase A)

Shared, **data-focused** builders for v3 tests. They encode the v3 *contract*
— public value shapes, configs, internal selections — so module tests speak one
vocabulary instead of re-declaring `config` / `point` / `span` helpers per file.

## What these are

- `builders.ts` — `D`, `buildConfig`, `point`, `span`, `extDate`, `extRange`.
- Use them in new module tests (Days, ManualInput, Presets, …) for consistency.

## What these are NOT

- **Not a snapshot of legacy v1/v2 internals.** v3 is a clean rebuild, not a
  migration. Fixtures describe what v3 must do, not what the old reducer did.
- **Not exhaustive legacy capture.** Per the Phase A selectivity rule in
  `.notes/plans/v3.md`, we only fixture behavior v3 *preserves*. Where v3
  deliberately diverges, the divergence is recorded in the **"Intentional v3
  breaks"** section of `.notes/plans/v3.md`, not encoded as a passing fixture.

## Parity vs intentional break

When adding a fixture, state in one line whether it is:

- **parity** — v3 keeps the v1/v2 behavior; or
- **intentional break** — v3 changes it on purpose (then add/cross-reference the
  entry in `.notes/plans/v3.md` → "Intentional v3 breaks").
