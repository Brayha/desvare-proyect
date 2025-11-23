import React from 'react';
import { IonModal, IonSpinner } from '@ionic/react';
import { CloseCircle, TickCircle } from 'iconsax-react';
import './ConfirmModal.css';

const ConfirmModal = ({ 
  isOpen, 
  onDismiss, 
  onConfirm, 
  title = '¿Estás seguro?',
  message = '',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isLoading = false,
  variant = 'danger' // 'danger' | 'warning' | 'primary'
}) => {
  
  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      onDismiss();
    }
  };

  return (
    <IonModal 
      isOpen={isOpen} 
      onDidDismiss={handleCancel}
      className="confirm-modal"
      backdropDismiss={!isLoading}
    >
      <div className="confirm-modal-inner">
        {/* Ícono según variante */}
        <div className={`confirm-icon confirm-icon-${variant}`}>
          {variant === 'danger' ? (
            <CloseCircle size="48" color="#EF4444" variant="Bold" />
          ) : (
            <TickCircle size="48" color="#F59E0B" variant="Bold" />
          )}
        </div>

        {/* Título */}
        <h2 className="confirm-title">{title}</h2>

        {/* Mensaje */}
        {message && (
          <p className="confirm-message">{message}</p>
        )}

        {/* Botones */}
        <div className="confirm-buttons">
          <button
            className="confirm-btn confirm-btn-cancel"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            className={`confirm-btn confirm-btn-${variant}`}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <IonSpinner name="crescent" />
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </IonModal>
  );
};

export default ConfirmModal;

