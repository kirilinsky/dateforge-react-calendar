# CI / CD

Snapshot of current automation for `@dateforge/react-calendar`. All workflows in `.github/workflows/`.

Last sync: 2026-05-28. Backlog → [`.notes/plans/cleanup.md`](.notes/plans/cleanup.md).

---

## Workflows

| Workflow                                               | Trigger                                  | Job(s)                                                                                      | Skip changeset PR | Required gate |
| ------------------------------------------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------- | ------------- |
| [`ci.yml`](.github/workflows/ci.yml)                   | PR + push main                           | typecheck → biome check → knip → build (+ Codecov bundle upload) → check:exports → test (Node 20+22) → coverage (Node 22 → Codecov) → npm audit (advisory) | no (foundation)   | yes           |
| [`a11y.yml`](.github/workflows/a11y.yml)               | PR + push main                           | `npm run test:storybook` — Storybook via addon-vitest, axe per story in headless Chromium   | yes               | yes           |
| [`ssr.yml`](.github/workflows/ssr.yml)                 | PR + push main                           | `npm run test:ssr` — `renderToString` for Calendar + 11 modules (Node env, no DOM globals)  | yes               | yes           |
| [`codspeed.yml`](.github/workflows/codspeed.yml)       | PR + push main                           | `vitest bench` via `CodSpeedHQ/action` — PR comment with per-bench regression               | yes               | advisory      |
| [`publint.yml`](.github/workflows/publint.yml)         | PR + push main                           | `publint` + `attw --pack . --profile node16`                                                | no                | yes           |
| [`chromatic.yml`](.github/workflows/chromatic.yml)     | PR + push main                           | `chromaui/action` with TurboSnap (`onlyChanged: true`, `exitZeroOnChanges: true`)           | yes               | advisory      |
| [`storybook.yml`](.github/workflows/storybook.yml)     | push main + manual                       | `npm run build-storybook` → upload-pages-artifact → deploy-pages                            | n/a               | n/a           |
| [`codeql.yml`](.github/workflows/codeql.yml)           | PR + push main + cron Mon 06:00 UTC      | CodeQL `javascript-typescript`, `security-extended`                                         | no                | advisory      |
| [`osv-scanner.yml`](.github/workflows/osv-scanner.yml) | PR + push main + cron Mon 06:00 UTC      | OSV Scanner v2 (Google reusable action), SARIF to Security tab                              | no                | advisory      |
| [`scorecard.yml`](.github/workflows/scorecard.yml)     | branch_protection_rule + cron + push main | OpenSSF Scorecard, `publish_results: true` → live badge                                    | no                | advisory      |
| [`release.yml`](.github/workflows/release.yml)         | push main                                | `changesets/action`: open Version PR / publish on merge with `--provenance` (OIDC)          | n/a               | n/a           |

`Skip changeset PR` = `if: github.head_ref != 'changeset-release/main'`. Applied to workflows that check what was already verified in the original PR (visual regression, SSR, a11y, perf). Avoids redundant runs on release-bump PRs from Changesets.

`Required gate` = workflow must be green to merge into main (configured via branch protection in Settings, not in the workflow itself).

---

## Scripts used by CI

| Script          | What it does                                                              | Used by                        |
| --------------- | ------------------------------------------------------------------------- | ------------------------------ |
| `typecheck`     | `tsc --noEmit`                                                            | ci                             |
| `check`         | `biome check .` (lint + format check)                                     | ci                             |
| `knip`          | unused exports                                                            | ci                             |
| `build`         | `tsdown --dts` + theme/appearance gen + Codecov bundle upload             | ci, a11y, chromatic, storybook |
| `check:exports` | `publint && attw --pack . --profile node16`                               | ci, publint                    |
| `size`          | `size-limit` against `dist/` — local hard gate only, not run in CI       | local verify                   |
| `bench`         | `vitest bench --config vitest.bench.config.ts`                            | codspeed                       |
| `test`          | `vitest run --passWithNoTests` (unit + storybook projects)                | ci                             |
| `test:coverage` | `vitest run --coverage` (Node 22 only → Codecov)                          | ci                             |
| `test:ssr`      | `vitest run src/__tests__/integration/ssr.test.tsx` (Node env)            | ssr                            |
| `test:storybook`| `vitest run --project=storybook --passWithNoTests`                        | a11y                           |
| `verify`        | full local CI gate: typecheck + check + knip + build + check:exports + size + test | local pre-push        |

---

## Triggers by type

- **Every PR + push main:** ci, a11y, ssr, publint, chromatic, codeql, scorecard, osv-scanner, codspeed.
- **Push main only:** storybook (deploy), release (Changesets).
- **Cron Mon 06:00 UTC:** codeql, osv-scanner, scorecard.
- **Tag/release-merge:** release (via `changesets/action`).

---

## A11y flow — detail

`@storybook/addon-a11y` via `@storybook/addon-vitest` runs axe-core inside each story in headless Chromium (Playwright). Config in `.storybook/preview.tsx`:

```ts
parameters: {
  a11y: {
    test: "error",                       // violations fail run
    config: {
      rules: [
        { id: "color-contrast", selector: '*:not([aria-hidden="true"], [aria-hidden="true"] *)' },
      ],
    },
  },
}
```

`color-contrast` rule skips `aria-hidden` elements — they are decorative and excluded from the a11y tree (e.g. opacity-faded numbers in the TimeTrack drum picker).

`vitest.config.ts` defines the storybook project (`name: "storybook"`) in browser mode. `npm run test:storybook` runs only that project. Full `npm test` runs unit + storybook both, so an a11y violation will fail both `ci.yml` and `a11y.yml`. Source of truth is `preview.tsx`. `a11y.yml` exists for a dedicated badge in README and focused feedback.

Additionally, `src/__tests__/integration/a11y.test.tsx` runs `jest-axe` against `CalendarDays` + `CalendarTimeGrid` in happy-dom. This is unit-level a11y (faster, no browser). Runs as part of `npm test`.

---

## Security supply chain

- **CodeQL** — `security-extended` queries.
- **OSV Scanner** — Google reusable action v2, SARIF artifact in Security tab.
- **OpenSSF Scorecard** — live badge from securityscorecards.dev.
- **Dependabot** — `.github/dependabot.yml`, npm + github-actions, weekly Mon 08:00 Europe/Belgrade. Groups: storybook / vitest / types / testing-library.
- **`npm audit`** in CI — advisory level (does not block on high).
- **NPM Provenance** — via OIDC `id-token: write` in `release.yml` (Trusted Publisher on npmjs.com).

---

## Release pipeline (Changesets)

1. PR with feature/fix → author adds changeset via `npm run pr` (= `npx changeset`).
2. Merge into main → `release.yml` runs.
3. `changesets/action` detects pending changesets → opens PR `chore: version packages` (changeset-release/main):
   - bumps version in `package.json`
   - updates `CHANGELOG.md`
4. Merge release PR → `release.yml` runs again → `npx changeset publish`:
   - `npm publish --provenance --access=public` via OIDC
   - GitHub Release created automatically

The `changeset-release/main` `head_ref` is used for `if`-skip in advisory workflows (chromatic, ssr, a11y, codspeed). That PR only bumps version + changelog — re-running visual / a11y / perf checks is pointless.

---

## Remaining backlog (see `.notes/plans/cleanup.md`)

- Lighthouse CI (`.lighthouserc.json` + workflow) — B-7.
- Husky + lint-staged — B-9.
- Playwright E2E (`e2e/` folder, real Chromium beyond happy-dom) — B-8.
- Branch protection rules for main (Settings → Branches) — B-3, external.
