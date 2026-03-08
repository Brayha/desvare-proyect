import React, { useState, useEffect } from "react";
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
import { ArrowRight2, Car, TickCircle, CloseCircle, Clock, Record } from "iconsax-react";
import { requestAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import "./ServiceHistory.css";

const STATUS_LABELS = {
  pending: { label: "Pendiente", color: "#F59E0B" },
  quoted: { label: "Cotizado", color: "#3B82F6" },
  accepted: { label: "Aceptado", color: "#8B5CF6" },
  in_progress: { label: "En curso", color: "#06B6D4" },
  completed: { label: "Completado", color: "#10B981" },
  cancelled: { label: "Cancelado", color: "#EF4444" },
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const StatusBadge = ({ status }) => {
  const info = STATUS_LABELS[status] || { label: status, color: "#9CA3AF" };
  return (
    <span className="sh-badge" style={{ backgroundColor: info.color + "1A", color: info.color }}>
      {info.label}
    </span>
  );
};

const ServiceHistory = () => {
  const history = useHistory();
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id) {
      history.replace("/tabs/my-account");
      return;
    }
    loadServices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadServices = async () => {
    try {
      const res = await requestAPI.getClientRequests(user.id);
      setServices(res.data.requests || []);
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
            <IonBackButton defaultHref="/tabs/my-account" />
          </IonButtons>
          <IonTitle>Mis servicios</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="sh-content">
        {loading && (
          <div className="sh-center">
            <IonSpinner name="crescent" />
            <p>Cargando historial...</p>
          </div>
        )}

        {!loading && error && (
          <div className="sh-center">
            <CloseCircle size="40" color="#EF4444" />
            <p className="sh-error-text">{error}</p>
            <button className="sh-retry-btn" onClick={loadServices}>
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && services.length === 0 && (
          <div className="sh-center">
            <Car size="52" color="#D1D5DB" />
            <p className="sh-empty-title">Sin servicios aún</p>
            <p className="sh-empty-sub">Aquí aparecerán los servicios que hayas solicitado.</p>
          </div>
        )}

        {!loading && !error && services.length > 0 && (
          <div className="sh-list">
            {services.map((s) => (
              <div
                key={s.id}
                className="sh-card"
                onClick={() => history.push(`/service-detail/${s.id}`)}
              >
                <div className="sh-card-top">
                  <div className="sh-card-info">
                    <p className="sh-card-vehicle">
                      {s.vehicleSnapshot?.brand?.name && s.vehicleSnapshot?.model?.name
                        ? `${s.vehicleSnapshot.brand.name} ${s.vehicleSnapshot.model.name}`
                        : s.vehicleSnapshot?.category?.name || "Vehículo"}
                      {s.vehicleSnapshot?.licensePlate && (
                        <span className="sh-card-plate"> · {s.vehicleSnapshot.licensePlate}</span>
                      )}
                    </p>
                    <p className="sh-card-date">
                      <Clock size="13" color="#9CA3AF" />
                      {formatDate(s.createdAt)}
                    </p>
                  </div>
                  <div className="sh-card-right">
                    <StatusBadge status={s.status} />
                    <ArrowRight2 size="16" color="#9CA3AF" />
                  </div>
                </div>

                <div className="sh-card-route">
                  <div className="sh-route-dot sh-route-dot--origin" />
                  <p className="sh-route-text">{s.origin || "Origen no registrado"}</p>
                </div>
                <div className="sh-route-line" />
                <div className="sh-card-route">
                  <div className="sh-route-dot sh-route-dot--dest" />
                  <p className="sh-route-text">{s.destination || "Destino no registrado"}</p>
                </div>

                <div className="sh-card-footer">
                  {s.driverName && (
                    <span className="sh-card-driver">Conductor: {s.driverName}</span>
                  )}
                  {s.totalAmount > 0 && (
                    <span className="sh-card-amount">
                      ${s.totalAmount.toLocaleString("es-CO")}
                    </span>
                  )}
                  {s.rating && (
                    <span className="sh-card-rating">
                      {"★".repeat(s.rating)}{"☆".repeat(5 - s.rating)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ServiceHistory;
