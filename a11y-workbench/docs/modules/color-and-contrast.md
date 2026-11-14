# Module: colour and contrast

**Location.** `src/lib/color.ts`
**Consumers.** `engine/rules/contrast-style.ts`, `features/contrast/ContrastScreen.tsx`,
`src/test/tokens-contrast.test.ts`.
**Depends on.** Nothing (no DOM, no config).

## Purpose

Parse CSS colours and compute WCAG 2.x contrast ratios, with typed failure for
unparsable input so callers can validate instead of showing a misleading number.

## Public interface

| Function | Signature | Notes |
| --- | --- | --- |
| `parseColor` | `(input?: string \| null) => Rgb \| null` | `#abc`, `#aabbcc`, `rgb()`, `rgba()`, 20 named colours; `null` for anything else |
| `toHex` | `(rgb: Rgb) => string` | `#rrggbb` |
| `relativeLuminance` | `(rgb: Rgb) => number` | 0 (black) … 1 (white) |
| `contrastRatio` | `(fg: Rgb, bg: Rgb) => number` | ≥ 1, rounded to 2 dp, symmetric |
| `assessContrast` | `(fg, bg, use, thresholds?) => ContrastAssessment \| null` | `use` ∈ `normalText` \| `largeText` \| `uiComponent` |
| `colorFromStyle` | `(style: string, prop) => string \| null` | Extracts `color` / `background-color` from an inline style |
| `AA_THRESHOLDS` / `AAA_THRESHOLDS` | constants | 4.5/3/3 and 7/4.5/4.5 |

## The maths

```
channel(c)   = c/255 ≤ 0.04045 ? c/12.92 : ((c/255 + 0.055)/1.055) ^ 2.4
luminance    = 0.2126·R + 0.7152·G + 0.0722·B
ratio        = (L_lighter + 0.05) / (L_darker + 0.05)
```

Verified by tests: black on white = **21.00**, identical colours = **1.00**,
symmetry holds.

## Why `null` instead of throwing

Every consumer has a different correct response to bad input:

* the contrast screen shows an inline field error and hides the result;
* the contrast rule skips the element (no finding);
* the token test fails loudly.

Throwing would force every caller into `try/catch` and encourage `catch {}`.
The `null` contract makes the failure explicit in the type system.

## Supported colour syntax

| Syntax | Example | Supported |
| --- | --- | --- |
| 3-digit hex | `#fff` | yes |
| 6-digit hex | `#1c4b8f` | yes |
| `rgb()` / `rgba()` | `rgb(22, 25, 31)` | yes (alpha ignored) |
| Named colours | `white`, `navy` | yes (20 common) |
| `var(--x)` | — | no (needs computed style) |
| `hsl()` | — | no |
| `color-mix()` | — | no |
| `transparent` | — | no (treated as unparsable) |

The unsupported cases are deliberate scope limits: the product evaluates inline
styles from a static capture, and those virtually always use hex or `rgb()`.
A user needing anything else can convert.

## Large-text determination

In the `contrast-inline` rule, "large" means:

```
font-size ≥ 24px            (18pt)
or  font-size ≥ 18.66px and font-weight is bold/700-900
```

The contrast checker applies the same thresholds and states them in the UI.

## Rounding

Ratios are rounded to two decimals before comparison, so a value displayed as
`4.50` passes a 4.5 threshold. Documented in the checker's help text to avoid a
"why did 4.499 pass" question.

## Failure behaviour

| Input | Result |
| --- | --- |
| Empty/null/`transparent` | `null` |
| Unsupported syntax | `null` |
| Out-of-range channel (`rgb(300,-4,20)`) | Clamped to `0…255` |
| Alpha channel | Ignored (composited background is the caller's job) |

## Testing

19 tests in `src/lib/color.test.ts` cover parsing (all syntaxes, invalid,
clamping), luminance endpoints, ratio invariants (21, 1, symmetry), threshold
selection, AAA mode, and inline-style extraction (including that `color` is not
confused with `background-color`).

## Modification risks

* Changing `AA_THRESHOLDS` alters the product's definition of compliance — it is
  a WCAG constant, not a preference.
* Supporting `hsl()` would require also handling alpha and would not change any
  current behaviour; add it only with tests for each form.
