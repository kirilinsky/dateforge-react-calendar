---
"@dateforge/react-calendar": patch
---

Improve track and range behavior.

- Stop `useTrack` animation frames when the track is idle, and restart them only for active movement.
- Validate range updates from manual input, presets, track bounds, and selection actions against min/max range length and disabled dates.
- Keep outside-month day styling dominant when a day is also disabled.
