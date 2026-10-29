import React from 'react';
import { ICON_PROFIL } from './ProfilPage';

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
  const [tempAvatarId, setTempAvatarId] = React.useState(activeAvatarId);

  // Sync tempAvatarId saat modal dibuka
  React.useEffect(() => {
    if (isOpen) {
      setTempAvatarId(activeAvatarId);
    }
  }, [isOpen, activeAvatarId]);

  if (!isOpen) return null;

  const currentPreview = ICON_PROFIL.find((ic) => ic.id === tempAvatarId) || ICON_PROFIL[0];

  const handleSimpan = () => {
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

        {/* Preview Avatar Terpilih */}
        <div className="avatar-preview-box">
          <div className="avatar-preview-img-wrap">
            <img
              src={currentPreview.src}
              alt={currentPreview.nama}
              className="avatar-preview-img"
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
            return (
              <button
                key={ic.id}
                type="button"
                className={`avatar-choice-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setTempAvatarId(ic.id)}
                aria-label={ic.nama}
                aria-pressed={isSelected}
              >
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
                <div className="avatar-thumb-wrap">
                  <img
                    src={ic.src}
                    alt={ic.nama}
                    className="avatar-thumb-img"
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

        {/* Tombol Aksi */}
        <div className="modal-avatar-actions">
          <button type="button" className="btn-cancel-avatar" onClick={onClose}>
            Batal
          </button>
          <button type="button" className="btn-save-avatar" onClick={handleSimpan}>
            Pakai avatar ini
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

