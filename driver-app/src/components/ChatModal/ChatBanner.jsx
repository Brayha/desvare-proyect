import { useEffect, useRef } from 'react';
import { IonIcon } from '@ionic/react';
import { chatbubbleEllipses, close } from 'ionicons/icons';
import './ChatBanner.css';

/**
 * ChatBanner — Banner flotante que aparece cuando llega un mensaje
 * con el modal de chat cerrado.
 *
 * Props:
 *  message     {object|null}  — { senderName, message } o null para ocultar
 *  onTap       {function}     — Al tocar el banner abre el chat
 *  onDismiss   {function}     — Cierra el banner sin abrir el chat
 *  autoHideMs  {number}       — Milisegundos antes de ocultarse (default 5000)
 */
const ChatBanner = ({ message, onTap, onDismiss, autoHideMs = 5000 }) => {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!message) return;

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onDismiss?.();
    }, autoHideMs);

    return () => clearTimeout(timerRef.current);
  }, [message, autoHideMs, onDismiss]);

  if (!message) return null;

  const preview = message.text?.length > 60
    ? message.text.slice(0, 60) + '…'
    : message.text;

  return (
    <div className="chat-banner" onClick={onTap} role="button" tabIndex={0}>
      <div className="chat-banner-icon">
        <IonIcon icon={chatbubbleEllipses} />
      </div>
      <div className="chat-banner-body">
        <p className="chat-banner-sender">{message.senderName}</p>
        <p className="chat-banner-preview">{preview}</p>
      </div>
      <button
        className="chat-banner-close"
        onClick={(e) => { e.stopPropagation(); onDismiss?.(); }}
        aria-label="Cerrar"
      >
        <IonIcon icon={close} />
      </button>
    </div>
  );
};

export default ChatBanner;
