---
"@dateforge/react-calendar": patch
---

Page-slide animation no longer leaks an unhandled `AbortError` rejection when a slide is cancelled in DOM shims (happy-dom ≥20.14) that do not mark the `finished` promise as handled.
