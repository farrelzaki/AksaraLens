import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { router } from './app/router';
import { ProgresProvider } from './progres/ProgresProvider';
import './app/app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProgresProvider>
      <RouterProvider router={router} />
    </ProgresProvider>
  </StrictMode>,
);
