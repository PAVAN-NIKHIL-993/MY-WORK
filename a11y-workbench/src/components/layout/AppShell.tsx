/**
 * Application chrome: sidebar navigation, top bar, mobile menu and skip link.
 *
 * Layout behaviour:
 *  - desktop (>= 960px): persistent sidebar, sticky top bar, centred content;
 *  - mobile (< 960px): off-canvas sidebar with a scrim, closed on navigation;
 *  - the skip link is the first focusable element on the page.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { paths } from '@/state/router';
import { useWorkspace } from '@/state/workspace-context';
import { workspaceStats } from '@/state/selectors';
import { APP_NAME, APP_VERSION } from '@/config';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { ToastRegion } from '@/components/ui/ToastRegion';

interface NavItem {
  label: string;
  path: string;
  icon: IconName;
  /** Route names that should mark this item as current. */
  matches: string[];
  count?: number;
}

export function AppShell({
  route,
  title,
  actions,
  children,
}: {
  route: { name: string };
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}): JSX.Element {
  const { workspace } = useWorkspace();
  const stats = workspaceStats(workspace);
  const [menuOpen, setMenuOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLDivElement>(null);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [route.name]);

  // Escape closes the mobile menu and returns focus to the toggle.
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        toggleRef.current?.querySelector('button')?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  const primaryNav: NavItem[] = [
    { label: 'Overview', path: paths.overview, icon: 'gauge', matches: ['overview'] },
    { label: 'Projects', path: paths.projects, icon: 'folder', matches: ['projects', 'project'], count: stats.projects },
    { label: 'Findings', path: paths.findings, icon: 'list-checks', matches: ['findings', 'scan'], count: stats.open },
    { label: 'Reports', path: paths.reports, icon: 'file-text', matches: ['reports', 'report'] },
  ];

  const toolNav: NavItem[] = [
    { label: 'Contrast checker', path: paths.contrast, icon: 'palette', matches: ['contrast'] },
    { label: 'Rule reference', path: paths.rules, icon: 'book', matches: ['rules'] },
    { label: 'Settings', path: paths.settings, icon: 'settings', matches: ['settings'] },
  ];

  const renderNav = (items: NavItem[], label: string) => (
    <nav aria-label={label}>
      <p className="nav-group-label">{label}</p>
      <ul className="nav-list">
        {items.map((item) => {
          const isCurrent = item.matches.includes(route.name);
          return (
            <li key={item.path}>
              <a
                href={item.path}
                className="nav-link"
                {...(isCurrent ? { 'aria-current': 'page' as const } : {})}
              >
                <Icon name={item.icon} size={17} />
                <span>{item.label}</span>
                {typeof item.count === 'number' && item.count > 0 ? (
                  <span className="nav-count" aria-hidden="true">
                    {item.count > 999 ? '999+' : item.count}
                  </span>
                ) : null}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <div className="app-shell">
        {menuOpen ? (
          <button
            type="button"
            className="sidebar-scrim"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            tabIndex={-1}
          />
        ) : null}

        <aside
          className="sidebar"
          id="primary-sidebar"
          ref={sidebarRef}
          data-open={menuOpen ? 'true' : 'false'}
          aria-label="Primary"
        >
          <a className="brand" href={paths.overview}>
            <span className="brand-mark" aria-hidden="true">
              <Icon name="sparkle" size={19} />
            </span>
            <span>
              <span className="brand-name">{APP_NAME}</span>
              <span className="brand-meta">v{APP_VERSION} · local</span>
            </span>
          </a>

          {renderNav(primaryNav, 'Workspace')}
          {renderNav(toolNav, 'Tools')}

          <div className="sidebar-footer">
            <p className="text-xs text-muted">
              {stats.projects === 0
                ? 'No projects yet'
                : `${stats.projects} project${stats.projects === 1 ? '' : 's'} · ${stats.scans} scan${stats.scans === 1 ? '' : 's'}`}
            </p>
            <p className="text-xs text-muted">Data stays in this browser.</p>
          </div>
        </aside>

        <div className="main-column">
          <div className="topbar">
            <div className="menu-toggle" ref={toggleRef}>
              <Button
                variant="ghost"
                iconOnly
                icon="menu"
                aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={menuOpen}
                aria-controls="primary-sidebar"
                onClick={() => setMenuOpen((open) => !open)}
              />
            </div>
            <p className="topbar-title">{title}</p>
            {actions ? <div className="topbar-actions">{actions}</div> : null}
          </div>

          <main className="content" id="main-content" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
      <ToastRegion />
    </>
  );
}
