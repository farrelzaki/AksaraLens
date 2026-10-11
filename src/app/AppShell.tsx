import { NavLink, Outlet, useMatches } from 'react-router';
import type { HandleRute } from './router';

export function AppShell() {
  const matches = useMatches();
  const layarPenuh = matches.some((m) => (m.handle as HandleRute | undefined)?.layarPenuh);

  return (
    <div className="shell">
      <main className="isi">
        <Outlet />
      </main>
      {!layarPenuh && (
        <nav className="navbar" aria-label="Navigasi utama">
          <NavLink to="/belajar">Pembelajaran</NavLink>
          <NavLink to="/scan">Scanner</NavLink>
          <NavLink to="/profil">Profil</NavLink>
        </nav>
      )}
    </div>
  );
}
