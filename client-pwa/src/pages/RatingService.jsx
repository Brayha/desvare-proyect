import { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonTextarea,
  IonSpinner,
  IonText,
} from "@ionic/react";
import { star as starFilled, starOutline } from "ionicons/icons";
import { useToast } from "@hooks/useToast";
import "./RatingService.css";

import logo from "../assets/img/Desvare.svg";

// ============================================
// API URL Configuration
// ============================================
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const RatingService = () => {
  const history = useHistory();
  const { showSuccess, showError } = useToast();

  const [serviceData, setServiceData] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("🔄 RatingService - Inicializando...");

    // Cargar datos del servicio completado
    const completedServiceData = localStorage.getItem("completedService");

    if (!completedServiceData) {
      showError("No se encontraron datos del servicio completado");
      history.push("/home");
      return;
    }

    const parsedData = JSON.parse(completedServiceData);
    console.log("📦 Servicio completado cargado:", parsedData);

    setServiceData(parsedData);
    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStarClick = (starValue) => {
    setRating(starValue);
  };

  const handleSkip = () => {
    console.log("⏭️ Usuario decidió saltar la calificación");
    localStorage.removeItem("completedService");
    history.replace("/home");
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      showError("Por favor selecciona una calificación");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("📡 Enviando calificación:", {
        requestId: serviceData.requestId,
        rating,
        comment,
      });

      const response = await fetch(
        `${API_URL}/api/requests/${serviceData.requestId}/rate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stars: rating,
            comment: comment.trim() || null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al enviar calificación");
      }

      const data = await response.json();
      console.log("✅ Calificación enviada:", data);

      // Limpiar localStorage
      localStorage.removeItem("completedService");

      showSuccess("¡Gracias por tu calificación! 🎉");

      // Redirigir al home
      setTimeout(() => {
        history.replace("/home");
      }, 1500);
    } catch (error) {
      console.error("❌ Error al enviar calificación:", error);
      showError(error.message || "Error al enviar calificación");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="rating-service-page">
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Cargando...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!serviceData) {
    return null;
  }

  return (
    <IonPage>
      <IonContent className="rating-service-page">
        <div className="rating-container">
          {/* Logo */}
          <div className="rating-logo-container">
            <img src={logo} alt="Desvare" className="rating-logo" />
          </div>

          {/* Título */}
          <div className="rating-header">
            <h1 className="rating-title">¡Servicio Completado!</h1>
            <p className="rating-subtitle">
              ¿Cómo fue tu experiencia con {serviceData.driver?.name || "el conductor"}?
            </p>
          </div>

          {/* Card de Calificación */}
          <div className="rating-card">
              {/* Estrellas */}
              <div className="stars-section">
                <IonText>
                  <p className="stars-label">Califica el servicio</p>
                </IonText>
                <div className="stars-container">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <IonIcon
                      key={star}
                      icon={star <= rating ? starFilled : starOutline}
                      className={`star-icon ${star <= rating ? "filled" : ""}`}
                      onClick={() => handleStarClick(star)}
                    />
                  ))}
                </div>
                {rating > 0 && (
                  <p className="rating-text">
                    {rating === 1 && "Muy malo 😞"}
                    {rating === 2 && "Malo 😕"}
                    {rating === 3 && "Regular 😐"}
                    {rating === 4 && "Bueno 😊"}
                    {rating === 5 && "Excelente 🤩"}
                  </p>
                )}
              </div>

              {/* Comentario */}
              {rating > 0 && (
                <div className="comment-section">
                    <p className="comment-label">
                      Cuéntanos más (opcional)
                    </p>
                  <IonTextarea
                    placeholder="¿Qué te gustó o qué se puede mejorar?"
                    value={comment}
                    onIonInput={(e) => setComment(e.detail.value)}
                    debounce={0}
                    maxlength={500}
                    rows={4}
                    className="comment-textarea"
                  />
                  <p className="comment-counter">{comment.length}/500</p>
                </div>
              )}
          </div>

          {/* Botones de Acción */}
          <div className="action-buttons">
            <IonButton
              expand="block"
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className="submit-button"
            >
              {isSubmitting ? (
                <>
                  <IonSpinner name="crescent" /> Enviando...
                </>
              ) : (
                "Enviar Calificación"
              )}
            </IonButton>

            <IonButton
              expand="block"
              fill="clear"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="skip-button"
            >
              Saltar por ahora
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default RatingService;
