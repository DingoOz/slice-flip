# Error Log

### Level teardown crashed on multi-material meshes — 2026-11-12

- **Severity:** Critical
- **Category:** API Misuse
- **File(s):** `scene.js`
- **Pattern:** Treating `mesh.material` as a single material when Three.js allows an array (e.g. per-face box materials); `material.map` on an array resolves to `Array.prototype.map`, so calling `.dispose()` on it throws.
- **Root cause:** `buildLevel` disposed old textures via `o.material?.map.dispose()`, but end-pillar targets use a 6-material array. The throw happened inside the rAF loop, killing it, so the game froze on a blank screen whenever a second level was built (menu → Play).
- **Fix applied:** Normalise with `[].concat(o.material || []).forEach(m => m.map?.dispose())`.
- **Prevention rule:** Whenever touching `.material` generically (traverse, dispose, clone), normalise to an array first; and test level transitions (menu → play → next level), not just a freshly loaded level.
