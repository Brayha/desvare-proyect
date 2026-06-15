import { useState, useEffect, useRef } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonFooter,
  IonIcon,
  IonSpinner,
} from '@ionic/react';
import { close, send } from 'ionicons/icons';
import socketService from '../../services/socket';
import './ChatModal.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.desvare.app';

/**
 * ChatModal para el conductor (driver-app).
 *
 * Props:
 *  isOpen        {boolean}
 *  onClose       {function}
 *  requestId     {string}
 *  currentUserId {string}
 *  otherName     {string} — Nombre del cliente
 */
const ChatModal = ({ isOpen, onClose, requestId, currentUserId, otherName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !requestId) return;

    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/requests/${requestId}/chat`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error('Error cargando historial de chat:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [isOpen, requestId]);

  useEffect(() => {
    if (!isOpen) return;

    const handleIncoming = (msg) => {
      if (msg.requestId?.toString() !== requestId?.toString()) return;
      setMessages((prev) => {
        if (prev.some((m) => m._id?.toString() === msg._id?.toString())) return prev;
        return [...prev, msg];
      });
    };

    socketService.onChatMessage(handleIncoming);
    return () => socketService.offChatMessage(handleIncoming);
  }, [isOpen, requestId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    }
  }, [messages]);

  const handleSend = () => {
    const text = newMessage.trim();
    if (!text || isSending) return;

    setIsSending(true);
    socketService.sendChatMessage({ requestId, message: text });
    setNewMessage('');
    setIsSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="chat-modal">
      <IonHeader>
        <IonToolbar>
          <IonTitle className="chat-modal-title">
            <span className="chat-modal-title-icon">💬</span> {otherName || 'Cliente'}
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="chat-content">
        {isLoading ? (
          <div className="chat-loading">
            <IonSpinner name="dots" />
            <p>Cargando mensajes...</p>
          </div>
        ) : (
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-empty">
                <p>Aún no hay mensajes.</p>
                <p>¡Di hola! 👋</p>
              </div>
            )}
            {messages.map((msg, i) => {
              const isOwn = msg.senderId?.toString() === currentUserId?.toString();
              return (
                <div
                  key={msg._id || i}
                  className={`chat-bubble-wrapper ${isOwn ? 'own' : 'other'}`}
                >
                  {!isOwn && (
                    <p className="chat-sender-name">{msg.senderName}</p>
                  )}
                  <div className={`chat-bubble ${isOwn ? 'chat-bubble--own' : 'chat-bubble--other'}`}>
                    <p className="chat-bubble-text">{msg.message}</p>
                    <span className="chat-bubble-time">{formatTime(msg.createdAt)}</span>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </IonContent>

      <IonFooter className="chat-footer">
        <div className="chat-input-row">
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder="Escribe un mensaje..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            maxLength={500}
          />
          <button
            className={`chat-send-btn ${newMessage.trim() ? 'active' : ''}`}
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
          >
            <IonIcon icon={send} />
          </button>
        </div>
      </IonFooter>
    </IonModal>
  );
};

export default ChatModal;
