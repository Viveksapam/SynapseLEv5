# Frontend — System Specification

**Authoritative reference for all frontend code in this repository.**
This file governs both human contributors and AI agents. Every rule here is enforced — not aspirational.

---

## 1. Stack

| Concern | Choice | Note |
|---|---|---|
| Framework | React 18 (JavaScript) | No TypeScript — compensated by mandatory PropTypes |
| Build | Vite 8 | HMR, ESM-native |
| Styling | Plain CSS | No Tailwind, no UI component libraries |
| HTTP Client | Axios | Centralized via `src/api/apiClient.js` |
| Routing | React Router v6 | Client-side SPA routing |
| Type Safety | PropTypes | Required on every exported component |
| 3D / Visual | React Three Fiber, Three.js | Used in theme layer and Verisphere |
| Testing | Vitest + Testing Library (unit/integration), Playwright (E2E) |
| Icons | Lucide React | No other icon libraries |

**Dependency rule:** No new packages without explicit approval. Check bundle size impact first.

---

## 2. Folder Structure

```
frontend/src/
├── api/                  ← All HTTP calls. Never fetch inside components.
│   ├── apiClient.js      ← Axios instance (base URL, interceptors, timeout)
│   ├── config.js         ← API_BASE from env
│   ├── blogApi.js
│   ├── portfolioApi.js
│   ├── projectApi.js
│   ├── productApi.js
│   ├── paymentApi.js
│   ├── userApi.js
│   ├── orderApi.js
│   └── coreApi.js
│
├── components/           ← Truly global UI only (AuthModal, SEO, ScrollToTop)
│
├── hooks/                ← Global custom hooks (useAuth, useThemeContext, etc.)
│
├── data/                 ← Static data files (skillsData, merchandiseData, legacyLinks)
│
├── errors/               ← Error boundary components
│
├── theme/                ← Seasonal theme engine (ThemeLayer, ThemeParticles, ThemeEngine, ThreeVisual)
│
├── Home/                 ← Landing page
│   ├── Home.jsx          ← Orchestrator (< 150 lines)
│   ├── Home.css
│   ├── components/       ← Home-specific: TopNavBar, HomeHero, CapabilitiesCarousel,
│   │                        ContributionsSection, SpotlightSection, MerchandiseSection,
│   │                        HomeFooter, WelcomeOverlay, SkillModal, ContactModal
│   └── templates/        ← Design variant reference files (Classic, Editorial, Minimal)
│
├── Projects/             ← Self-contained sub-applications
│   ├── Classroom/        ← Spatial Learning Environment (interactive slides, quizzes, SCORM)
│   ├── Verisphere/       ← Community platform (posts, comments, reactions, dark/light mode)
│   ├── Merchandise/      ← E-commerce (ShopPage, CartDrawer, ProductGrid, ProductModal, CheckoutPage)
│   └── Synapse_Assessments/ ← Credentials and assessment hub
│
├── tests/                ← Vitest tests
│   ├── unit/             ← API layer, hooks, pure components
│   └── integration/      ← Page-level flows with mocked APIs
│
├── assets/               ← Images, SVGs
├── App.jsx               ← Root router and layout shell
├── main.jsx              ← Entry point
└── index.css             ← Global reset only
```

**Modularity principle:** Each project in `Projects/` is self-contained with its own components, pages, styles, and context. Shared code lives in `src/api/`, `src/hooks/`, `src/components/`, or `src/theme/`. No cross-project imports between projects.

---

## 3. Coding Standards

### 3.1 File Size

| Rule | Limit |
|---|---|
| Hard maximum | 150 lines per file |
| Preferred | Under 100 lines |
| Breach action | Extract immediately — do not merge over-limit files |

### 3.2 Naming Conventions

| Category | Pattern | Example |
|---|---|---|
| String variable | `str<Name>` | `strUserEmail` |
| Number variable | `num<Name>` | `numRetryCount` |
| Boolean variable | `bool<Name>` | `boolIsLoading` |
| Array variable | `arr<Name>` | `arrProductList` |
| Object variable | `obj<Name>` | `objUserProfile` |
| State variable | `<prefix><Name>State` | `arrItemsState`, `boolIsLoadingState` |
| API functions | `<verb><Resource>` | `fetchProductList()`, `postCreateOrder()` |
| Event handlers | `handle<Event>` | `handleFormSubmit()` |
| Component files | `PascalCase.jsx` | `ProductCard.jsx` |
| CSS classes | `ath-<element>` | `ath-hero-title`, `ath-nav-link` |

### 3.3 Props

- Descriptive names, no abbreviations: `productId`, not `pid`.
- **PropTypes required on every exported component.** Missing PropTypes is a blocking issue.

### 3.4 Imports

- No dead imports. ESLint `no-unused-vars` is enforced.
- No commented-out code. Git history is the archive.
- No `console.log` in committed code.

---

## 4. Architecture Rules

### 4.1 API Isolation

All HTTP calls live in `src/api/`. Components never call `fetch` or `axios` directly.

Every API function must include a `try/catch` block and return a normalized shape:

```js
// Standard pattern
export const fetchResourceList = async () => {
  try {
    const data = await apiClient.get('/resource/');
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message || "Failed to fetch" };
  }
};
```

### 4.2 State Management

- `useState` and `useContext` only. No Redux, Zustand, or external state libraries.
- Server state: loading / data / error triad in every data-fetching component.

### 4.3 Error Handling

**Layer 1 — API errors:** Caught in `src/api/`, surfaced via error state in components.

**Layer 2 — Render errors:** Caught by `PageErrorBoundary`. Every page-level route in `App.jsx` must be wrapped by an error boundary.

### 4.4 Component Ownership

| Location | Contains | Rule |
|---|---|---|
| `src/components/` | AuthModal, SEO, ScrollToTop | Truly global — used across multiple pages/projects |
| `Home/components/` | TopNavBar, HomeHero, ContactModal, SkillModal, etc. | Home-page specific — not imported by projects |
| `Projects/<Name>/components/` | Project-specific UI | Never imported outside that project |

If a component is imported by only one page/project, it belongs in that page/project's folder.

---

## 5. Security

### 5.1 XSS Prevention

`dangerouslySetInnerHTML` requires sanitization. Every usage must wrap content with `DOMPurify.sanitize()`.

**Known debt:** `CapabilitiesCarousel.jsx` and `SkillModal.jsx` render `strIconSvg` from the database without sanitization. Classroom slide components render markdown-parsed HTML without sanitization. These must be addressed.

### 5.2 Authentication & Token Storage

**Current state:** Auth tokens are stored in `localStorage` via `useAuth.js`. This is a known security debt — `localStorage` is vulnerable to XSS exfiltration.

**Target state:** `httpOnly`, `Secure`, `SameSite=Strict` cookies managed server-side. API calls use `credentials: 'include'`.

### 5.3 Environment Variables

- Vite exposes variables prefixed with `VITE_` to the client bundle. Never put secrets in `VITE_*` variables.
- `src/api/config.js` reads `VITE_API_BASE` with fallback to `/api`.

### 5.4 Dependency Auditing

- `npm audit --audit-level=high` before every push.
- No merge with high or critical CVEs unresolved.

---

## 6. Accessibility (WCAG 2.1 AA)

Accessibility is a correctness requirement, not polish.

- Semantic HTML: `<button>` for actions, `<a>` for navigation, `<nav>`, `<main>`, `<header>`.
- All images: meaningful `alt` text. Decorative images: `alt=""`.
- Heading hierarchy: logical and unbroken (`h1` → `h2` → `h3`).
- Colour contrast: 4.5:1 body text, 3:1 large text and UI components.
- All interactive elements: fully keyboard-navigable.
- Visible focus indicators on all focusable elements.
- `prefers-reduced-motion` respected in all CSS animations.

---

## 7. Performance

| Metric | Target |
|---|---|
| LCP (Largest Contentful Paint) | ≤ 2.5s |
| CLS (Cumulative Layout Shift) | ≤ 0.1 |
| INP (Interaction to Next Paint) | ≤ 200ms |

- Route-level code splitting via `React.lazy()` + `Suspense` is the target architecture for `App.jsx`.
- No dependency added without checking its minified + gzipped size cost.

---

## 8. Testing

### 8.1 Test Pyramid

```
         ┌──────────┐
         │   E2E    │  Playwright — critical user journeys (tests/e2e/)
        ┌┴──────────┴┐
        │Integration │  Testing Library — page-level flows (src/tests/integration/)
       ┌┴────────────┴┐
       │  Unit Tests  │  Vitest — API layer, hooks, pure logic (src/tests/unit/)
       └──────────────┘
```

### 8.2 Coverage Targets

| Layer | Target | Scope |
|---|---|---|
| Unit | ≥ 80% | `src/api/`, `src/hooks/` |
| Integration | Key flows | Page happy path + error path |
| E2E | Critical journeys | Home load, shop flow, auth modal, navigation |

### 8.3 Placement

Unit and integration tests live in `src/tests/`. E2E tests live in `tests/e2e/`. These are separate test runners (Vitest vs Playwright) and must not be mixed.

### 8.4 Mocking

Mock at network/module level. Never mock the component under test.

---

## 9. Styling Guidelines

- Custom, intentional aesthetic. No generic Bootstrap/Material patterns.
- All CSS classes use the `ath-*` prefix (Scholarly Athenaeum design system).
- CSS is co-located: each component's `.css` file lives beside its `.jsx` file.
- No global stylesheet except `index.css` (reset only).
- Each project in `Projects/` owns its own styles — no cross-project CSS bleeding.
- Colour choices must satisfy WCAG 2.1 AA contrast ratios.
- `prefers-color-scheme` considered for dark/light theming decisions.

---

## 10. Template Integration Protocol

When merging external design templates (HTML/CSS from Figma, AI tools, or premade templates):

1. **Business content is sacred.** All user-facing text, messaging, and copy must be preserved exactly. Templates change presentation, never content.
2. **One component per commit.** Migrate one component at a time, test after each.
3. **Delete old only after new is verified.** Never delete v1 patterns until all v2 migrations are complete and tested.
4. **CSS scoping.** New templates must use the `ath-*` prefix or CSS modules. No global class pollution.
5. **Reference templates** live in `Home/templates/` as static HTML for comparison — they are not imported into the React tree.

See `docs/TEMPLATE_ARCHITECTURE.md` for the full business ↔ presentation isolation protocol.

---

## 11. Agent Rules (AI-Assisted Development)

These rules apply to any AI agent (Claude, Copilot, or other) working in this codebase:

1. **Read this file and `backend/AI.md` before any refactoring or structural change.**
2. **Show a file-level plan before changing multiple files.** Get confirmation.
3. **Never install packages without explicit confirmation.**
4. **Never delete files without confirmation.**
5. **Flag security violations on sight:** `dangerouslySetInnerHTML` without sanitization, tokens in localStorage, `eval()`, hardcoded secrets.
6. **Flag naming convention violations** in any file you touch. Fix in the same change.
7. **Flag files exceeding 150 lines** in any file you touch. Extract in the same change.
8. **Verify build passes** after any structural refactoring (`npm run build`).
9. **Run tests** after any logic change (`npm run test`).
10. **Prefer clarity over cleverness.** Optimize for the next engineer reading the code.

---

## 12. Commit Messages

Follow Conventional Commits:

```
feat(cart): add quantity selector to CartItem
fix(auth): clear token on session expiry
refactor(home): extract hero section to separate component
chore(deps): update react to 18.3.1
```

---

## 13. Definition of Done

A task is complete when:

- [ ] No file exceeds 150 lines.
- [ ] All new components have PropTypes
- [ ] No commented-out code
- [ ] No dead imports
- [ ] No `console.log` in production paths
- [ ] Every new CSS class is used in JSX
- [ ] Old files deleted if replaced
- [ ] Build passes: `npm run build`
- [ ] Tests pass: `npm run test`
