# SPEC — @dateforge/react-calendar

## §G Goal

Modular React calendar/datepicker lib. Zero runtime deps. SSR-safe. Composable modules, swappable themes, accessible. Publish to npm as dual CJS/ESM with per-module subpath exports.

---

## §C Constraints

- C1. Zero runtime deps. Peer: react 18/19.
- C2. SSR-safe — no hydration mismatch on server render.
- C3. No global CSS — styles bundled per module, auto-applied on import.
- C4. TypeScript strict. No `any`. Dual CJS/ESM via tsdown.
- C5. Bundle size gated via size-limit CI.
- C6. React 18 compat required even when using React 19 patterns.
- C7. `npm run verify` must pass before publish.
- C8. Biome for lint+format. No eslint/prettier.

---

## §I External Surfaces

- I.pkg — `@dateforge/react-calendar` (main entry: `Calendar`, `createTheme`, `createDisabled`, `createAppearance`, types)
- I.ctx — `@dateforge/react-calendar/context` (all context hooks: `useConfig`, `useNavigation`, `useSelection`, `useSelectionActions`, `useSelectionHover`, `useSelectionValue`, `useUI`)
- I.modules — `@dateforge/react-calendar/modules` (all module components)
- I.themes — `@dateforge/react-calendar/themes` + `themes/<name>` (34 themes)
- I.appearances — `@dateforge/react-calendar/appearances` + `appearances/<name>` (5 appearances)
- I.api — `CalendarProps<M>`, `CalendarValue<M>`, `CalendarMode`, `DateRange`, `DisabledConfig`, `DisabledRule`, `ThemeTokens`
- I.ci — GitHub Actions: typecheck, lint, build, exports, size, test, SSR, Chromatic, CodeQL, Scorecard
- I.storybook — Storybook 10 + Chromatic visual regression
- I.release — changesets → npm publish with provenance

---

## §V Invariants

- V1. `<Calendar>` with no children renders without crash (useless but valid).
- V2. Any module subset renders without crash. Incomplete UX is consumer's problem.
- V3. Controlled mode (`value` prop present): `onChange` called on commit; state updates via `SYNC_EXTERNAL` only.
- V4. Uncontrolled mode (`defaultValue`): `dispatch` owns state; no `onChange` required.
- V5. `notifySeq` bump → `onChange` fires exactly once per user action. No double-fire.
- V6. SSR render produces same HTML as first client render (no hydration mismatch).
- V7. `timeZone="auto"` → `undefined` on first render, resolved from `Intl` after mount. Explicit IANA validated; invalid falls back to auto with dev warn.
- V8. `createDisabled` never throws — invalid entries emit `warnOnce` and are skipped.
- V9. Generated theme/appearance files are not hand-edited — source is `themes/themes.ts` + `scripts/generate-*.ts`.
- V10. `SelectionHoverContext` is separate from `SelectionStateContext` to prevent re-renders on hover.
- V11. Popup state (`time|month|year|null`) lives in `UIContext`, not reducer.
- V12. `theme="auto"` resolves via `matchMedia` after mount — CSS handles server render via `prefers-color-scheme`, no white flash.
- V13. Module order in JSX = visual order in CSS grid. No implicit ordering.
- V14. No runtime dep added to `dependencies` — only `devDependencies` or `peerDependencies`.
- V15. `tsc --noEmit` passes before every publish (`npm run verify`).

---

## §T Tasks

| id  | status | task                                                              | cites         |
|-----|--------|-------------------------------------------------------------------|---------------|
| T1  | .      | audit all modules for React 19 `use()` + Actions compat          | V6,C6         |
| T2  | .      | add `startOfWeek` prop to `<Calendar>` (0=Sun default)           | I.pkg,I.api   |
| T3  | .      | test coverage: `createDisabled` all rule types + edge cases       | V8            |
| T4  | .      | test coverage: controlled ↔ uncontrolled mode switch at runtime   | V3,V4         |
| T5  | .      | test coverage: `notifySeq` double-fire regression                 | V5            |
| T6  | .      | test coverage: SSR render + hydration (all module combinations)   | V6,C2         |
| T7  | .      | Storybook story: multi-month layout with `cols` prop              | I.storybook   |
| T8  | .      | Storybook story: `createTheme` custom token example               | I.storybook   |
| T9  | .      | validate `minRangeDays` / `maxRangeDays` interaction in reducer   | V3,I.api      |
| T10 | .      | document `useTrack` physics constants (FRICTION, SPRING_K, etc.)  | I.ctx         |
| T11 | .      | knip: remove any dead exports surfaced by `npm run knip`          | C5,C7         |
| T12 | .      | size-limit: verify per-module bundle sizes post-build             | C5            |

---

## §B Bug Log

| id | date | cause | fix |
|----|------|-------|-----|
