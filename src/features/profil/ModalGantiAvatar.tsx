import React from 'react';
import { hargaAvatar } from '../../progres/koin';
import { useProgres } from '../../progres/ProgresProvider';
import { IkonKoin, LencanaKoin } from '../koin/LencanaKoin';

export interface ProfilIcon {
  id: number;
  nama: string;
  sub: string;
  src: string;
}

export const ICON_PROFIL: ProfilIcon[] = [
  { id: 1, nama: 'Aksa', sub: 'Teman belajar aksara Jawa', src: '/assets/icon profile 1.svg' },
  { id: 2, nama: 'Aksa Blangkon', sub: 'Semangat melestarikan budaya', src: '/assets/icon profile 2.svg' },
  { id: 3, nama: 'Aksa Cendekia', sub: 'Rajin membaca dan teliti', src: '/assets/icon profile 3.svg' },
  { id: 4, nama: 'Aksa Ceria', sub: 'Belajar dengan gembira', src: '/assets/icon profile 4.svg' },
  { id: 5, nama: 'Aksa Juara', sub: 'Siap menuntaskan semua bab', src: '/assets/icon profile 5.svg' },
  { id: 6, nama: 'Aksa Penjelajah', sub: 'Mencari aksara di sekitar', src: '/assets/icon profile 6.svg' },
  { id: 7, nama: 'Aksa Bijak', sub: 'Memahami makna tiap goresan', src: '/assets/icon profile 7.svg' },
  { id: 8, nama: 'Aksa Sahabat', sub: 'Setia menemanimu melangkah', src: '/assets/icon profile 8.svg' },
];

interface ModalGantiAvatarProps {
  isOpen: boolean;
  onClose: () => void;
  activeAvatarId: number;
  onSelectAvatar: (avatarId: number) => void;
}

export function ModalGantiAvatar({
  isOpen,
  onClose,
  activeAvatarId,
  onSelectAvatar,
}: ModalGantiAvatarProps) {
  const { koin, punyaAvatar, beliAvatar } = useProgres();
  const [tempAvatarId, setTempAvatarId] = React.useState(activeAvatarId);
  const [konfirmasiBeli, setKonfirmasiBeli] = React.useState(false);

  // Sync tempAvatarId saat modal dibuka
  React.useEffect(() => {
    if (isOpen) {
      setTempAvatarId(activeAvatarId);
      setKonfirmasiBeli(false);
    }
  }, [isOpen, activeAvatarId]);

  if (!isOpen) return null;

  const currentPreview = ICON_PROFIL.find((ic) => ic.id === tempAvatarId) || ICON_PROFIL[0];

  // F8: karakter yang sedang dipakai tetap boleh dipakai walau belum dibeli (pilihan lama pengguna).
  const bisaDipakai = (id: number) => id === activeAvatarId || punyaAvatar(id);
  const harga = hargaAvatar(tempAvatarId) ?? 0;
  const kurang = Math.max(0, harga - koin);

  const pilihAvatar = (id: number) => {
    setTempAvatarId(id);
    setKonfirmasiBeli(false);
  };

  const handleSimpan = () => {
    if (!bisaDipakai(tempAvatarId)) {
      // Beli dua langkah: ketuk pertama meminta konfirmasi, ketuk kedua membeli lalu memakai.
      if (!konfirmasiBeli) {
        setKonfirmasiBeli(true);
        return;
      }
      if (!beliAvatar(tempAvatarId).ok) {
        setKonfirmasiBeli(false);
        return;
      }
    }
    onSelectAvatar(tempAvatarId);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-avatar-card" onClick={(e) => e.stopPropagation()}>
        {/* Header Modal */}
        <div className="modal-avatar-header">
          <div>
            <span className="modal-category-label">PILIH TEMAN BELAJARMU</span>
            <h3 className="modal-avatar-title">Avatar yang paling kamu.</h3>
          </div>
          <button
            type="button"
            className="btn-circle-close"
            onClick={onClose}
            aria-label="Tutup modal"
          >
            ✕
          </button>
        </div>

        <div className="koin-modal-saldo">
          <LencanaKoin />
        </div>

        {/* Preview Avatar Terpilih */}
        <div className="avatar-preview-box">
          <div className="avatar-preview-img-wrap avatar-preview-3d-stage">
            <img
              key={currentPreview.id}
              src={currentPreview.src}
              alt={currentPreview.nama}
              className="avatar-preview-img avatar-preview-3d-img aksa-3d"
              draggable={false}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/icon profile 1.svg';
              }}
            />
          </div>
          <div className="avatar-preview-info">
            <span className="avatar-preview-name">
              {currentPreview.id === 1 ? 'Aksa' : currentPreview.nama}
            </span>
            <span className="avatar-preview-sub">{currentPreview.sub}</span>
          </div>
        </div>

        {/* Grid 8 Pilihan Avatar (MODAL GANTI AVA.png) */}
        <div className="avatar-grid-8">
          {ICON_PROFIL.map((ic) => {
            const isSelected = tempAvatarId === ic.id;
            const terkunci = !bisaDipakai(ic.id);
            return (
              <button
                key={ic.id}
                type="button"
                className={`avatar-choice-card ${isSelected ? 'selected' : ''} ${terkunci ? 'koin-terkunci' : ''}`}
                onClick={() => pilihAvatar(ic.id)}
                aria-label={terkunci ? `${ic.nama}, terkunci, ${hargaAvatar(ic.id) ?? 0} koin` : ic.nama}
                aria-pressed={isSelected}
              >
                {terkunci && (
                  <span className="koin-kunci-lencana" aria-hidden="true">
                    <IkonKoin ukuran={14} />
                    {hargaAvatar(ic.id) ?? 0}
                  </span>
                )}
                {isSelected && (
                  <div className="avatar-check-badge">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="11" height="11">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
                <div className="avatar-thumb-wrap avatar-thumb-3d-stage">
                  <img
                    src={ic.src}
                    alt={ic.nama}
                    className="avatar-thumb-img aksa-3d"
                    draggable={false}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/icon profile 1.svg';
                    }}
                  />
                </div>
                <span className="avatar-choice-name">{ic.nama}</span>
              </button>
            );
          })}
        </div>

        {!bisaDipakai(tempAvatarId) && (
          <p className="koin-pesan" role="status">
            {kurang > 0
              ? `Koinmu kurang ${kurang}. Selesaikan pelajaran untuk mendapat koin.`
              : konfirmasiBeli
                ? `Beli ${currentPreview.nama} seharga ${harga} koin? Ketuk sekali lagi untuk membeli.`
                : `${currentPreview.nama} terkunci. Belilah dengan ${harga} koin.`}
          </p>
        )}

        {/* Tombol Aksi */}
        <div className="modal-avatar-actions">
          <button type="button" className="btn-cancel-avatar" onClick={onClose}>
            Batal
          </button>
          <button
            type="button"
            className="btn-save-avatar"
            onClick={handleSimpan}
            disabled={!bisaDipakai(tempAvatarId) && kurang > 0}
          >
            {bisaDipakai(tempAvatarId)
              ? 'Pakai avatar ini'
              : kurang > 0
                ? 'Koin belum cukup'
                : konfirmasiBeli
                  ? `Ya, beli ${harga} koin`
                  : `Beli ${harga} koin`}
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

