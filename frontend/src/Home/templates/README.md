# Synapse Home — Design Variants

Three alternative homepage designs using DC Logic framework.
Each is a self-contained `.dc.html` file with embedded JavaScript.

## Quick Selector

| Name | Aesthetic | Typography | Color Palette | Use Case |
|------|-----------|-----------|---|----------|
| **Classic** | Sophisticated, serif-forward | EB Garamond + JetBrains Mono | Warm earthy (#fbf9f6) | Academic/prestigious |
| **Editorial** | Publication-style, bold hierarchy | Archivo + Newsreader | High contrast (#141210) | Magazine/journal |
| **Minimal** | Modern, clean, component-driven | Space Grotesk + Hanken Grotesk | Calm blues (#fcfcfb) | Tech-forward/accessible |

## File Index

- `SynapseHome-Classic.dc.html` — 310 lines, sophisticated serif design
- `SynapseHome-Editorial.dc.html` — 229 lines, publication-style layout
- `SynapseHome-Minimal.dc.html` — 253 lines, clean sans-serif modern

## Usage

### Local Preview
Requires HTTP server (templates use Google Fonts, not file://):
```bash
python3 -m http.server 8000
# Then visit: http://localhost:8000/frontend/src/templates/SynapseHome-Classic.dc.html
```

### Integration Strategy

**Option A: Reference Only (Current)**
- Store as design exploration artifacts
- No React integration; used for stakeholder review
- **Effort**: None — files are standalone

**Option B: A/B Test Route (Medium effort)**
- Add `/home/[variant]` route in React Router
- Serve template as alternative homepage
- Track which variant users see
- **Effort**: Modify App.jsx + add template loader

**Option C: Port to React (Highest effort)**
- Convert templates to modular React components
- Replace current Home page variants
- Full design system migration
- **Effort**: Multi-sprint project

## Specifications

### Classic Design
- **Colors**: #fbf9f6 (bg), #1b1c1a (text), #7b581b (accent)
- **Grid**: 1260px max-width, subtle borders
- **Fonts**: Google Fonts (EB Garamond, JetBrains Mono)
- **Vibe**: Refined, library-like, professional

### Editorial Design
- **Colors**: #f6f2ea (bg), #141210 (text), #d23b2a (accent)
- **Grid**: 1240px max-width, bold dividers
- **Fonts**: Google Fonts (Archivo, Newsreader)
- **Vibe**: Journalistic, structured, authoritative

### Minimal Design
- **Colors**: #fcfcfb (bg), #16181d (text), #2a6fdb (accent)
- **Grid**: 1180px max-width, soft shadows
- **Fonts**: Google Fonts (Space Grotesk, Hanken Grotesk)
- **Vibe**: Modern, spacious, accessible

## Maintenance

- All templates source Google Fonts via `<link>` (internet-required)
- `support.js` path must point to server root (`./support.js`)
- Each template is independent; no shared CSS or dependencies
- Update templates when design language/branding changes
- Archive retired variants to `templates/archived/`

## Related Files

- React Home: `frontend/src/pages/Home/Home.jsx`
- Home sub-components: `frontend/src/pages/Home/components/`
- Design rules: `frontend/AI.md` §13 "Styling & Aesthetic Guidelines"
- Accessibility requirements: `frontend/AI.md` §6 "Accessibility (WCAG 2.1 AA)"

## Decision Log

**Date**: 2026-06-29
**Status**: Templates added as reference designs (Option A)
**Next Decision**: Q3 2026 — Revisit adoption strategy if design refresh needed
