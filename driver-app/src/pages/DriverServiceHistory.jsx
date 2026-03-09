import { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonSpinner,
} from "@ionic/react";
import { Car, ArrowRight2, Clock, CloseCircle } from "iconsax-react";
import { requestAPI } from "../services/api";
import "./DriverServiceHistory.css";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const StarRating = ({ stars }) => {
  if (!stars) return null;
  return (
    <span className="dsh-stars">
      {"★".repeat(stars)}{"☆".repeat(5 - stars)}
    </span>
  );
};

const DriverServiceHistory = () => {
  const history = useHistory();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) { history.replace("/login"); return; }
    const { _id } = JSON.parse(userData);
    loadServices(_id);
  }, [history]);

  const loadServices = async (driverId) => {
    try {
      const res = await requestAPI.getDriverServices(driverId);
      setServices(res.data.services || []);
    } catch (err) {
      console.error("❌ Error cargando historial:", err);
      setError("No se pudo cargar el historial. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/profile" />
          </IonButtons>
          <IonTitle>Mis servicios</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="dsh-content">
        {loading && (
          <div className="dsh-center">
            <IonSpinner name="crescent" />
            <p>Cargando historial...</p>
          </div>
        )}

        {!loading && error && (
          <div className="dsh-center">
            <CloseCircle size="40" color="#EF4444" />
            <p className="dsh-error-text">{error}</p>
          </div>
        )}

        {!loading && !error && services.length === 0 && (
          <div className="dsh-center">
            <Car size="52" color="#D1D5DB" />
            <p className="dsh-empty-title">Sin servicios aún</p>
            <p className="dsh-empty-sub">
              Aquí aparecerán los servicios que hayas completado.
            </p>
          </div>
        )}

        {!loading && !error && services.length > 0 && (
          <div className="dsh-list">
            {services.map((s) => (
              <div
                key={s.id}
                className="dsh-card"
                onClick={() => history.push(`/driver-service-detail/${s.id}`)}
              >
                <div className="dsh-card-top">
                  <div className="dsh-card-info">
                    <p className="dsh-card-client">{s.clientName}</p>
                    <p className="dsh-card-vehicle">
                      {s.vehicleSnapshot?.brand?.name && s.vehicleSnapshot?.model?.name
                        ? `${s.vehicleSnapshot.brand.name} ${s.vehicleSnapshot.model.name}`
                        : s.vehicleSnapshot?.category?.name || "Vehículo"}
                    </p>
                    <p className="dsh-card-date">
                      <Clock size="13" color="#9CA3AF" />
                      {formatDate(s.completedAt || s.createdAt)}
                    </p>
                  </div>
                  <div className="dsh-card-right">
                    {s.totalAmount > 0 && (
                      <span className="dsh-card-amount">
                        ${s.totalAmount.toLocaleString("es-CO")}
                      </span>
                    )}
                    <ArrowRight2 size="16" color="#9CA3AF" />
                  </div>
                </div>

                <div className="dsh-card-route">
                  <div className="dsh-route-dot dsh-route-dot--origin" />
                  <p className="dsh-route-text">{s.origin || "Origen"}</p>
                </div>
                <div className="dsh-route-line" />
                <div className="dsh-card-route">
                  <div className="dsh-route-dot dsh-route-dot--dest" />
                  <p className="dsh-route-text">{s.destination || "Destino"}</p>
                </div>

                {s.rating && (
                  <div className="dsh-card-footer">
                    <StarRating stars={s.rating} />
                    {s.ratingComment && (
                      <span className="dsh-card-comment">"{s.ratingComment}"</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default DriverServiceHistory;
