import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { router } from './app/router';
import { ProgresProvider } from './progres/ProgresProvider';
import { Aksa3DDefs } from './app/MaskotAksa';
import './app/app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Aksa3DDefs />
    <ProgresProvider>
      <RouterProvider router={router} />
    </ProgresProvider>
  </StrictMode>,
);
