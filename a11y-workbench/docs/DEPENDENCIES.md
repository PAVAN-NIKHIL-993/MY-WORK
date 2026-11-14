# Dependencies

Total: **2 runtime packages** (React and React DOM) plus 3 runtime entries in the
lockfile, out of **468 total lockfile entries** (the rest are dev tooling and its
transitive dependencies). Lockfile: `package-lock.json`.

## Runtime

| Package | Version | Purpose | Why this one |
| --- | --- | --- | --- |
| `react` | 19.3.1 (exact) | UI runtime | Declarative rendering; hooks fit the small state model |
| `react-dom` | 19.3.1 (exact) | DOM renderer | Required with React; `createRoot` |

Nothing else ships. No router, no state manager, no component library, no icon
package, no CSS framework, no date library, no form library, no validation
library.

### What was deliberately *not* added

| Candidate | Rejected because |
| --- | --- |
| `react-router` | 10 view routes, hash-based, no data loading — ~100 lines of code replaces it (ADR-003) |
| `zustand` / `redux` | One document, five screens, no async — context + a pure repository is simpler and fully testable |
| `tailwindcss` | The design system is ~80 tokens in three CSS files; a build plugin and utility churn add nothing for a UI hand-audited for contrast |
| `@radix-ui/*` / `shadcn` | A large dependency surface for one modal and one select; the custom modal is tested (focus trap, restore, Escape) |
| `jest-axe` / `axe-core` | Using an audit engine to test a product that audits is circular, and axe-core needs layout jsdom does not have |
| `zod` | The schema normaliser must *repair*, not reject; the handwritten version returns repair messages, which is product behaviour |
| `date-fns` | Two `Intl.DateTimeFormat` instances cover all formatting |
| `uuid` | `crypto.randomUUID` with a guarded fallback |
| `papaparse`, `marked` | CSV quoting and Markdown generation are ~120 lines with product-specific escaping; libraries would need configuration to match |
| Any chart or icon package | No charts; icons are 30 inline SVG paths |

## Development

| Package | Version (manifest range) | Purpose |
| --- | --- | --- |
| `vite` | 7.3.8 (exact) | Dev server, build, aliasing |
| `@vitejs/plugin-react` | 5.2.0 (exact) | JSX transform, Fast Refresh |
| `typescript` | 5.9.3 (exact) | Type checking (`noEmit` — Vite transpiles) |
| `vitest` | 3.2.7 (exact) | Test runner (Vite-native) |
| `jsdom` | 26.1.0 (exact) | DOM for component/integration tests |
| `@vitest/coverage-v8` | 3.2.7 (exact) | Coverage reporting |
| `@testing-library/react` | 16.3.3 (exact) | User-centric component queries |
| `@testing-library/dom` | ^10.4.1 | DOM helpers used by the above |
| `@testing-library/jest-dom` | ^6.9.1 | Matchers (`toBeInTheDocument`, `toHaveAttribute` …) |
| `@testing-library/user-event` | 14.6.10 (exact) | Realistic keyboard/pointer events |
| `eslint` | 9.39.5 (exact) | Linting (flat config) |
| `@eslint/js` | 9.39.5 (exact) | Recommended JS rules |
| `typescript-eslint` | 8.72.2 (exact) | Type-aware lint rules |
| `eslint-plugin-react-hooks` | 5.2.0 (exact) | Hook dependency rules |
| `eslint-plugin-jsx-a11y` | 6.10.2 (exact) | Static accessibility lint rules |
| `globals` | 16.5.0 (exact) | Environment globals for the flat config |
| `@types/react`, `@types/react-dom` | 19.3.0 (exact) | Types |
| `@types/node` | 26.6.6 (exact) | Types for `vite.config.ts` |

## Version constraints and the one resolution

| Dependency | Constraint | Reason |
| --- | --- | --- |
| `@testing-library/jest-dom` | `^6.9.1` | The 7.x line's `expect` augmentation did not work with this Vitest setup; the 6.x range was kept and is resolution-pinned by the lockfile |
| `react` / `react-dom` | exact `19.3.1` | Deliberate: a React upgrade must be a reviewed change |
| `node` | `>=20.19.0` | Vite 7 requirement |

No `overrides`, no `resolutions`, no patched packages.

## Transitive risk

| Risk | Assessment |
| --- | --- |
| Supply chain | 468 entries is a normal Vite+React tree; no exotic or unmaintained direct deps |
| Runtime bundle includes only React | A compromised dev dependency can affect the build, but nothing else runs in the browser |
| Deprecation | None of the direct dev dependencies is deprecated at time of writing |

## Update policy

```bash
npm outdated           # review
npm update --save      # minor/patch
npm install pkg@latest # one dependency at a time
npm run verify         # must stay green
```

After any dependency change: run `npm run verify`, then the manual demo path in
[`SETUP.md`](SETUP.md#first-run-checklist).

## Adding a dependency — checklist

1. Can it be done in < 150 lines of product-specific code? (Most can.)
2. Is it needed at **runtime**, or only for the build?
3. Is the license compatible (MIT/ISC/Apache-2.0)?
4. Is it maintained (release in the last 12 months)?
5. Does it add a network call or a privacy concern? (Blocked outright.)
6. Pin the exact version and record it in this file.
