// Rute sesuai PRD dan Desain UI/UX Figma
// Userflow: Splash -> Onboarding -> Intro -> Masuk/Daftar -> Belajar/Materi/Scan/Profil

import { createBrowserRouter, Navigate } from 'react-router';
import { AppShell } from './AppShell';
import { SplashScreen } from '../features/splash/SplashScreen';
import { BelajarPage } from '../features/belajar/BelajarPage';
import { MateriBabPage } from '../features/belajar/MateriBabPage';
import { PelajaranPage } from '../features/pelajaran/PelajaranPage';
import { ProfilPage } from '../features/profil/ProfilPage';
import { EditProfilPage } from '../features/profil/EditProfilPage';
import { MasukPage } from '../features/akun/MasukPage';
import { IntroPage } from '../features/onboarding/IntroPage';
import { OnboardingPage } from '../features/onboarding/OnboardingPage';

/** handle.layarPenuh = navbar bawah disembunyikan (onboarding, auth, pelajaran, latihan, splash, edit-profil). */
export interface HandleRute {
  layarPenuh?: boolean;
}

const penuh: HandleRute = { layarPenuh: true };

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      // 1. Alur awal aplikasi: Splash Screen di rute utama '/'
      {
        index: true,
        element: <SplashScreen />,
        handle: penuh,
      },
      {
        path: 'splash',
        element: <SplashScreen />,
        handle: penuh,
      },

      // 2. Layar Onboarding 1-3
      {
        path: 'onboarding',
        element: <OnboardingPage />,
        handle: penuh,
      },

      // 3. Layar Intro ("Yuk, mulai cerita aksaramu!")
      {
        path: 'intro',
        element: <IntroPage />,
        handle: penuh,
      },

      // 4. Layar Masuk (LOGIN.png) & Daftar (REGIST.png)
      {
        path: 'masuk',
        element: <MasukPage modeDefault="masuk" />,
        handle: penuh,
      },
      {
        path: 'daftar',
        element: <MasukPage modeDefault="daftar" />,
        handle: penuh,
      },

      // 5. Layar Utama Belajar
      { path: 'belajar', element: <BelajarPage /> },
      { path: 'belajar/materi/:bab', element: <MateriBabPage />, handle: penuh },

      // 6. Layar Pembelajaran & Latihan Menulis
      { path: 'pelajaran/:id', element: <PelajaranPage />, handle: penuh },
      {
        path: 'latihan/:id',
        handle: penuh,
        lazy: async () => ({ Component: (await import('../features/latihan/LatihanPage')).LatihanPage }),
      },

      // 7. Lensa Aksara (Kamera & Pemindai)
      { path: 'scan', lazy: async () => ({ Component: (await import('../features/scanner/ScanPage')).ScanPage }) },
      { path: 'scan/hasil', lazy: async () => ({ Component: (await import('../features/scanner/HasilPage')).HasilPage }) },
      { path: 'scan/kaji', lazy: async () => ({ Component: (await import('../features/scanner/KajiPage')).KajiPage }) },

      // 8. Layar Profil & Edit Profil
      { path: 'profil', element: <ProfilPage /> },
      { path: 'edit-profil', element: <EditProfilPage />, handle: penuh },

      // Fallback
      { path: '*', element: <Navigate to="/belajar" replace /> },
    ],
  },
]);
