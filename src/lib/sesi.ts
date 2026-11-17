// Hook sesi Supabase + mode demo lokal: siapa yang sedang masuk (null = tamu).
// Tidak butuh provider; tiap pemakai berlangganan sendiri ke perubahan sesi.

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { bacaSesiDemo, EVENT_SESI_DEMO, sinkronkanUserMetadata } from './auth';

export function useSesi(): { pengguna: User | null; memuat: boolean } {
  const [pengguna, setPengguna] = useState<User | null>(() => (supabase ? null : bacaSesiDemo()));
  const [memuat, setMemuat] = useState(supabase !== null);

  useEffect(() => {
    if (!supabase) {
      const syncDemo = () => {
        const user = bacaSesiDemo();
        if (user) sinkronkanUserMetadata(user);
        setPengguna(user);
        setMemuat(false);
      };
      syncDemo();
      window.addEventListener(EVENT_SESI_DEMO, syncDemo);
      window.addEventListener('storage', syncDemo);
      return () => {
        window.removeEventListener(EVENT_SESI_DEMO, syncDemo);
        window.removeEventListener('storage', syncDemo);
      };
    }

    let batal = false;
    // getSession membaca sesi lokal, tidak memanggil jaringan.
    void supabase.auth.getSession().then(({ data }) => {
      if (batal) return;
      const user = data.session?.user ?? null;
      if (user) sinkronkanUserMetadata(user);
      setPengguna(user);
      setMemuat(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, sesi) => {
      const user = sesi?.user ?? null;
      if (user) sinkronkanUserMetadata(user);
      setPengguna(user);
    });
    return () => {
      batal = true;
      data.subscription.unsubscribe();
    };
  }, []);

  return { pengguna, memuat };
}