// Rute sesuai PRD "Struktur aplikasi & navigasi". Halaman yang memuat model
// (latihan, scanner) di-lazy-load agar bundle awal tetap ringan.

import { createBrowserRouter, Navigate } from 'react-router';
import { AppShell } from './AppShell';
import { BelajarPage } from '../features/belajar/BelajarPage';
import { MateriBabPage } from '../features/belajar/MateriBabPage';
import { PelajaranPage } from '../features/pelajaran/PelajaranPage';
import { ProfilPage } from '../features/profil/ProfilPage';
import { EditProfilPage } from '../features/profil/EditProfilPage';
import { MasukPage } from '../features/akun/MasukPage';
import { SplashPage } from '../features/onboarding/SplashPage';
import { IntroPage } from '../features/onboarding/IntroPage';
import { OnboardingPage } from '../features/onboarding/OnboardingPage';

/** handle.layarPenuh = navbar bawah disembunyikan (pelajaran, latihan, proses scan, materi, onboarding, auth). */
export interface HandleRute {
  layarPenuh?: boolean;
}

const penuh: HandleRute = { layarPenuh: true };

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/splash" replace /> },
      { path: 'splash', element: <SplashPage />, handle: penuh },
      { path: 'intro', element: <IntroPage />, handle: penuh },
      { path: 'onboarding', element: <OnboardingPage />, handle: penuh },
      { path: 'belajar', element: <BelajarPage /> },
      { path: 'belajar/materi/:bab', element: <MateriBabPage />, handle: penuh },
      { path: 'pelajaran/:id', element: <PelajaranPage />, handle: penuh },
      {
        path: 'latihan/:id',
        handle: penuh,
        lazy: async () => ({ Component: (await import('../features/latihan/LatihanPage')).LatihanPage }),
      },
      { path: 'scan', lazy: async () => ({ Component: (await import('../features/scanner/ScanPage')).ScanPage }) },
      { path: 'scan/hasil', lazy: async () => ({ Component: (await import('../features/scanner/HasilPage')).HasilPage }) },
      { path: 'scan/kaji', lazy: async () => ({ Component: (await import('../features/scanner/KajiPage')).KajiPage }) },
      { path: 'profil', element: <ProfilPage /> },
      { path: 'edit-profil', element: <EditProfilPage />, handle: penuh },
      { path: 'masuk', element: <MasukPage />, handle: penuh },
      { path: 'daftar', element: <MasukPage />, handle: penuh },
      { path: '*', element: <Navigate to="/belajar" replace /> },
    ],
  },
]);
