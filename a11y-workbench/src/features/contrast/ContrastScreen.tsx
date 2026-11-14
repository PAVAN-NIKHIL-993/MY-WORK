/**
 * Contrast checker.
 *
 * Fills the engine's documented gap: captured markup carries no external CSS, so
 * computed colours must be checked by hand. Inputs accept any CSS colour format
 * the app can parse (`#rgb`, `#rrggbb`, `rgb()`) plus a native colour picker, and
 * the result reports the ratio plus AA/AAA status for three text sizes.
 *
 * Validation is explicit: an unparsable value produces an inline error and no
 * result, rather than a misleading "0:1".
 */

import { useMemo, useState } from 'react';
import { assessContrast, parseColor, toHex, contrastRatio, AA_THRESHOLDS } from '@/lib/color';
import { PageHeader } from '@/components/ui/Feedback';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';

const PRESETS: Array<{ label: string; fg: string; bg: string }> = [
  { label: 'Body text on white', fg: '#16191f', bg: '#ffffff' },
  { label: 'Muted text on white', fg: '#646d7c', bg: '#ffffff' },
  { label: 'White on primary blue', fg: '#ffffff', bg: '#1c4b8f' },
  { label: 'Amber on white (fail)', fg: '#c9a227', bg: '#ffffff' },
  { label: 'Dark theme text', fg: '#f0f2f5', bg: '#161a21' },
];

export function ContrastScreen(): JSX.Element {
  const [foreground, setForeground] = useState('#16191f');
  const [background, setBackground] = useState('#ffffff');

  const fgValid = parseColor(foreground) !== null;
  const bgValid = parseColor(background) !== null;
  const parsedFg = parseColor(foreground);
  const parsedBg = parseColor(background);

  const result = useMemo(
    () => (parsedFg && parsedBg ? contrastRatio(parsedFg, parsedBg) : null),
    [parsedFg, parsedBg],
  );

  const checks = useMemo(() => {
    if (!fgValid || !bgValid) return [];
    return [
      { use: 'normalText' as const, label: 'Normal text — AA (4.5:1)', result: assessContrast(foreground, background, 'normalText') },
      { use: 'largeText' as const, label: 'Large text — AA (3:1)', result: assessContrast(foreground, background, 'largeText') },
      { use: 'uiComponent' as const, label: 'UI component / icon — AA (3:1)', result: assessContrast(foreground, background, 'uiComponent') },
    ];
  }, [foreground, background, fgValid, bgValid]);

  const pass = result !== null && result >= AA_THRESHOLDS.normalText;

  return (
    <>
      <PageHeader
        title="Contrast checker"
        description="Check any foreground/background pair against WCAG 2.2 AA and AAA thresholds. Use this for colours defined in external stylesheets, which a static capture cannot evaluate."
      />

      <div className="contrast-layout">
        <Card ariaLabelledBy="contrast-inputs-heading">
          <CardHeader title="Colours" titleId="contrast-inputs-heading" subtitle="Any CSS colour: hex, rgb() or a named colour." />
          <CardBody>
            <div className="swatch-pair" style={{ marginBottom: 'var(--space-4)' }}>
              <div className="swatch">
                <Field
                  id="contrast-fg"
                  label="Text colour"
                  required
                  error={!fgValid ? 'Enter a valid CSS colour, e.g. #16191f or rgb(22, 25, 31).' : null}
                >
                  {(props) => (
                    <div className="row" style={{ gap: 'var(--space-2)' }}>
                      <input
                        {...props}
                        className="input"
                        type="text"
                        value={foreground}
                        onChange={(event) => setForeground(event.target.value)}
                        spellCheck={false}
                        autoComplete="off"
                      />
                      <input
                        type="color"
                        aria-label="Pick text colour"
                        value={parsedFg ? toHex(parsedFg) : '#000000'}
                        onChange={(event) => setForeground(event.target.value)}
                        style={{ inlineSize: 44, blockSize: 44, padding: 2, background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}
                      />
                    </div>
                  )}
                </Field>
                <div
                  className="swatch-preview"
                  style={{
                    background: bgValid ? background : 'var(--bg-inset)',
                    color: fgValid ? foreground : 'var(--text-primary)',
                  }}
                >
                  Sample
                </div>
              </div>

              <div className="swatch">
                <Field
                  id="contrast-bg"
                  label="Background colour"
                  required
                  error={!bgValid ? 'Enter a valid CSS colour, e.g. #ffffff or rgb(255, 255, 255).' : null}
                >
                  {(props) => (
                    <div className="row" style={{ gap: 'var(--space-2)' }}>
                      <input
                        {...props}
                        className="input"
                        type="text"
                        value={background}
                        onChange={(event) => setBackground(event.target.value)}
                        spellCheck={false}
                        autoComplete="off"
                      />
                      <input
                        type="color"
                        aria-label="Pick background colour"
                        value={parsedBg ? toHex(parsedBg) : '#ffffff'}
                        onChange={(event) => setBackground(event.target.value)}
                        style={{ inlineSize: 44, blockSize: 44, padding: 2, background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}
                      />
                    </div>
                  )}
                </Field>
                <div
                  className="swatch-preview"
                  style={{
                    background: bgValid ? background : 'var(--bg-inset)',
                    color: fgValid ? foreground : 'var(--text-primary)',
                  }}
                >
                  Sample
                </div>
              </div>
            </div>

            <div className="row" style={{ marginBottom: 'var(--space-4)' }}>
              <span className="text-xs text-muted">Presets:</span>
              {PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setForeground(preset.fg);
                    setBackground(preset.bg);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            <Button
              icon="copy"
              size="sm"
              onClick={() => {
                setForeground(background);
                setBackground(foreground);
              }}
            >
              Swap colours
            </Button>
          </CardBody>
        </Card>

        <Card ariaLabelledBy="contrast-result-heading">
          <CardHeader title="Result" titleId="contrast-result-heading" subtitle="WCAG 2.2 contrast ratio and thresholds." />
          <CardBody>
            {result === null ? (
              <p className="text-sm text-secondary">Enter two valid colours to see the ratio.</p>
            ) : (
              <>
                <div className="contrast-result" style={{ marginBottom: 'var(--space-4)' }}>
                  <span
                    className={`contrast-ratio ${pass ? 'contrast-ratio--pass' : 'contrast-ratio--fail'}`}
                    aria-live="polite"
                  >
                    {result.toFixed(2)}
                    <span className="text-md" style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>
                      :1
                    </span>
                  </span>
                  <div>
                    <p className="text-sm" style={{ fontWeight: 600 }}>
                      {pass ? 'Passes AA for normal text' : 'Fails AA for normal text'}
                    </p>
                    <p className="text-xs text-muted">
                      {fgValid ? foreground : '—'} on {bgValid ? background : '—'}
                    </p>
                  </div>
                  <span className={`badge ${pass ? 'badge--success' : 'badge--critical'}`} style={{ marginLeft: 'auto' }}>
                    <Icon name={pass ? 'check-circle' : 'alert-circle'} size={14} />
                    {pass ? 'Pass' : 'Fail'}
                  </span>
                </div>

                <div
                  className="contrast-preview"
                  style={{ background, color: foreground, marginBottom: 'var(--space-4)' }}
                >
                  <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Large heading text</p>
                  <p style={{ fontSize: '1rem', margin: 0 }}>
                    Body copy at 16px. This is how the pair reads in context, including here on a
                    real interface surface.
                  </p>
                  <p style={{ fontSize: '0.75rem', margin: 0 }}>
                    Small print at 12px — the size that fails first.
                  </p>
                </div>

                <ul className="check-list">
                  {checks.map((check) => (
                    <li key={check.use} className={`check-row ${check.result?.pass ? 'check-row--pass' : ''}`.trim()}>
                      <Icon
                        name={check.result?.pass ? 'check-circle' : 'x'}
                        size={16}
                        style={{ color: check.result?.pass ? 'var(--success-fg)' : 'var(--critical-fg)' }}
                      />
                      <span>{check.label}</span>
                      <span className="text-xs text-muted" style={{ marginLeft: 'auto' }}>
                        {check.result ? `${check.result.ratio}:1` : '—'}
                      </span>
                    </li>
                  ))}
                </ul>

                <p className="field-hint" style={{ marginTop: 'var(--space-4)' }}>
                  Large text is 18.66px bold or 24px regular and above. Ratios are rounded to two
                  decimals; a value exactly at the threshold passes.
                </p>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
