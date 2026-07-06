---
"@dateforge/react-calendar": patch
---

Fix the broken CJS build: `require('@dateforge/react-calendar')` (and `/prebuilt`, `/modules`) failed with `MODULE_NOT_FOUND` for a phantom `layers-*.cjs` chunk the bundler referenced but never emitted; one chunk also carried a literal ESM `import "./style.css"` statement. A post-build repair step now strips both, the stylesheet is exported as `@dateforge/react-calendar/style.css` for CJS consumers, and CI smoke-loads (`require` + `import`) every exports subpath so a dead entry can't ship again.
