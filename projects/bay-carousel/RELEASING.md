# Releasing Guide

This document defines release quality gates and the release-notes workflow for `bay-carousel-ng`.

## Release Checklist

1. Ensure tests are green:
   - `npm test -- --watch=false`
2. Verify README sections are up to date:
   - Breaking Change Policy
   - Accessibility Checklist
   - Theme presets
3. Update [`CHANGELOG.md`](./CHANGELOG.md):
   - Added / Changed / Fixed / Deprecated / Removed
   - Migration Notes (required each release)
4. Build package:
   - `npm run build`
   - Optional pack check: `cd dist/bay-carousel && npm pack`
5. Publish release notes in your Git hosting release page:
   - Summary
   - Key changes
   - Migration Notes
6. Publish to npm:
   - `npm publish --access public`

## Release Notes Template

Use this template for every version:

```md
## x.y.z - YYYY-MM-DD

### Added
- ...

### Changed
- ...

### Fixed
- ...

### Deprecated
- ...

### Removed
- ...

### Migration Notes
- ...
```

## Breaking Change Rules (SemVer)

- `PATCH`: no consumer-facing API contract change.
- `MINOR`: only backward-compatible additions.
- `MAJOR`: any contract break in inputs/outputs/default behavior/interaction semantics.

If a release contains a breaking change, `Migration Notes` must include:
- What changed
- Who is affected
- Exact before/after usage
- Step-by-step migration
