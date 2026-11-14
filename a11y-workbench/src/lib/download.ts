/**
 * Browser file-download helper.
 *
 * Used by every export (CSV, HTML, Markdown, JSON backup). Creating the object
 * URL and revoking it here means exporters stay pure string builders and never
 * touch the DOM, which is what makes them unit-testable.
 */

export type DownloadMime = 'text/csv' | 'text/html' | 'text/markdown' | 'application/json';

export function downloadTextFile(filename: string, contents: string, mime: DownloadMime): void {
  if (typeof document === 'undefined' || typeof URL.createObjectURL !== 'function') return;
  const blob = new Blob([contents], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Filesystem-safe slug for download filenames. */
export function fileSlug(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return slug === '' ? 'export' : slug;
}
