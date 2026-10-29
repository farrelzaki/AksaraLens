import { NavLink, Outlet, useLocation, useMatches } from 'react-router';
import type { HandleRute } from './router';

export function AppShell() {
  const matches = useMatches();
  const { pathname } = useLocation();
  const layarPenuh = matches.some((m) => (m.handle as HandleRute | undefined)?.layarPenuh);

  const isScan = pathname.startsWith('/scan');

  return (
    <div className={`shell ${isScan ? 'shell-scan' : ''}`}>
      <main className={`isi ${layarPenuh ? 'layar-penuh' : ''} ${isScan ? 'isi-scan' : ''}`}>
        <Outlet />
      </main>
      {!layarPenuh && (
        <div className={`navbar-container ${isScan ? 'navbar-scan' : ''}`}>
          <nav className="navbar" aria-label="Navigasi utama">
            <NavLink
              to="/belajar"
              className={({ isActive }) => `navbar-item ${isActive ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <span>Belajar</span>
            </NavLink>
            <NavLink
              to="/scan"
              className={({ isActive }) => `navbar-item ${isActive ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 8V6a2 2 0 0 1 2-2h2" />
                <path d="M16 4h2a2 2 0 0 1 2 2v2" />
                <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
                <path d="M8 20H6a2 2 0 0 1-2-2v-2" />
                <line x1="8" y1="12" x2="16" y2="12" strokeWidth="2.5" />
              </svg>
              <span>Lensa Aksara</span>
            </NavLink>
            <NavLink
              to="/profil"
              className={({ isActive }) => `navbar-item ${isActive ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                <polyline points="16 7 22 7 22 13" />
              </svg>
              <span>Progres Saya</span>
            </NavLink>
          </nav>
        </div>
      )}
    </div>
  );
}