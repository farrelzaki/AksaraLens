// Hook sesi Supabase: siapa yang sedang masuk (null = tamu).
// Tidak butuh provider; tiap pemakai berlangganan sendiri ke perubahan sesi.

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export function useSesi(): { pengguna: User | null; memuat: boolean } {
  const [pengguna, setPengguna] = useState<User | null>(null);
  const [memuat, setMemuat] = useState(supabase !== null);

  useEffect(() => {
    if (!supabase) return;
    let batal = false;
    // getSession membaca sesi lokal, tidak memanggil jaringan.
    void supabase.auth.getSession().then(({ data }) => {
      if (batal) return;
      setPengguna(data.session?.user ?? null);
      setMemuat(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, sesi) => {
      setPengguna(sesi?.user ?? null);
    });
    return () => {
      batal = true;
      data.subscription.unsubscribe();
    };
  }, []);

  return { pengguna, memuat };
}