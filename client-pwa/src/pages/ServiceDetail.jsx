import React, { useState, useEffect } from "react";
import { useHistory, useParams } from "react-router-dom";
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
import {
  Location,
  Car,
  Profile,
  Star1,
  Calendar,
  Clock,
  MoneyRecive,
  ArrowRight,
} from "iconsax-react";
import { requestAPI } from "../services/api";
import "./ServiceDetail.css";

const STATUS_LABELS = {
  pending: { label: "Pendiente", color: "#F59E0B" },
  quoted: { label: "Cotizado", color: "#3B82F6" },
  accepted: { label: "Aceptado", color: "#8B5CF6" },
  in_progress: { label: "En curso", color: "#06B6D4" },
  completed: { label: "Completado", color: "#10B981" },
  cancelled: { label: "Cancelado", color: "#EF4444" },
};

const fmt = (dateStr, opts) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("es-CO", opts);
};

const fmtDate = (d) =>
  fmt(d, { day: "2-digit", month: "long", year: "numeric" });

const fmtTime = (d) =>
  fmt(d, { hour: "2-digit", minute: "2-digit", hour12: true });

const InfoRow = ({ icon, label, value }) => (
  <div className="sd-row">
    <div className="sd-row-icon">{icon}</div>
    <div className="sd-row-texts">
      <span className="sd-row-label">{label}</span>
      <span className="sd-row-value">{value || "—"}</span>
    </div>
  </div>
);

const ServiceDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) { history.replace("/service-history"); return; }
    loadService();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadService = async () => {
    try {
      const res = await requestAPI.getRequestById(id);
      setService(res.data.request || res.data);
    } catch (err) {
      console.error("❌ Error cargando servicio:", err);
      setError("No se pudo cargar el servicio.");
    } finally {
      setLoading(false);
    }
  };

  const acceptedQuote = service?.quotes?.find((q) => q.status === "accepted");
  const driverName = acceptedQuote?.driverName || null;
  const driverRating = acceptedQuote?.driverRating || null;
  const statusInfo = STATUS_LABELS[service?.status] || { label: service?.status, color: "#9CA3AF" };

  const vehicleLabel = () => {
    const v = service?.vehicleSnapshot;
    if (!v) return "—";
    const parts = [];
    if (v.brand?.name) parts.push(v.brand.name);
    if (v.model?.name) parts.push(v.model.name);
    if (v.year) parts.push(v.year);
    return parts.join(" ") || v.category?.name || "—";
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/service-history" />
          </IonButtons>
          <IonTitle>Detalle del servicio</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="sd-content">
        {loading && (
          <div className="sd-center">
            <IonSpinner name="crescent" />
          </div>
        )}

        {!loading && error && (
          <div className="sd-center sd-center--error">
            <p>{error}</p>
            <button className="sd-retry-btn" onClick={loadService}>
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && service && (
          <div className="sd-container">

            {/* ── Estado + fecha ── */}
            <div className="sd-hero">
              <span
                className="sd-status-badge"
                style={{ backgroundColor: statusInfo.color + "1A", color: statusInfo.color }}
              >
                {statusInfo.label}
              </span>
              <p className="sd-hero-date">
                {fmtDate(service.createdAt)}
              </p>
              {service.totalAmount > 0 && (
                <p className="sd-hero-amount">
                  ${service.totalAmount.toLocaleString("es-CO")}
                </p>
              )}
            </div>

            {/* ── Ruta ── */}
            <div className="sd-section">
              <h3 className="sd-section-title">Ruta</h3>
              <div className="sd-route">
                <div className="sd-route-point">
                  <div className="sd-route-dot sd-route-dot--origin" />
                  <div className="sd-route-info">
                    <span className="sd-route-tag">Origen</span>
                    <span className="sd-route-address">
                      {service.origin?.address || service.origin || "—"}
                    </span>
                  </div>
                </div>
                <div className="sd-route-divider">
                  <div className="sd-route-line-vert" />
                  <ArrowRight size="14" color="#9CA3AF" />
                </div>
                <div className="sd-route-point">
                  <div className="sd-route-dot sd-route-dot--dest" />
                  <div className="sd-route-info">
                    <span className="sd-route-tag">Destino</span>
                    <span className="sd-route-address">
                      {service.destination?.address || service.destination || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Tiempos ── */}
            <div className="sd-section">
              <h3 className="sd-section-title">Tiempos</h3>
              <InfoRow
                icon={<Calendar size="18" color="#6B7280" />}
                label="Fecha de solicitud"
                value={fmtDate(service.createdAt)}
              />
              <InfoRow
                icon={<Clock size="18" color="#6B7280" />}
                label="Hora de inicio"
                value={fmtTime(service.startedAt || service.acceptedAt)}
              />
              <InfoRow
                icon={<Clock size="18" color="#10B981" />}
                label="Hora de finalización"
                value={fmtTime(service.completedAt)}
              />
            </div>

            {/* ── Vehículo ── */}
            <div className="sd-section">
              <h3 className="sd-section-title">Vehículo</h3>
              <InfoRow
                icon={<Car size="18" color="#6B7280" />}
                label="Vehículo"
                value={vehicleLabel()}
              />
              {service.vehicleSnapshot?.licensePlate && (
                <InfoRow
                  icon={<Car size="18" color="#6B7280" />}
                  label="Placa"
                  value={service.vehicleSnapshot.licensePlate}
                />
              )}
              {service.vehicleSnapshot?.category?.name && (
                <InfoRow
                  icon={<Car size="18" color="#6B7280" />}
                  label="Categoría"
                  value={service.vehicleSnapshot.category.name}
                />
              )}
            </div>

            {/* ── Conductor ── */}
            {driverName && (
              <div className="sd-section">
                <h3 className="sd-section-title">Conductor</h3>
                <InfoRow
                  icon={<Profile size="18" color="#6B7280" />}
                  label="Nombre"
                  value={driverName}
                />
                {driverRating !== null && (
                  <InfoRow
                    icon={<Star1 size="18" color="#F59E0B" variant="Bold" />}
                    label="Calificación del conductor"
                    value={`${driverRating} / 5`}
                  />
                )}
              </div>
            )}

            {/* ── Calificación del servicio ── */}
            {service.rating?.stars && (
              <div className="sd-section">
                <h3 className="sd-section-title">Tu calificación</h3>
                <div className="sd-stars">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className={`sd-star ${s <= service.rating.stars ? "sd-star--filled" : ""}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                {service.rating.comment && (
                  <p className="sd-rating-comment">"{service.rating.comment}"</p>
                )}
              </div>
            )}

            {/* ── Monto ── */}
            {service.totalAmount > 0 && (
              <div className="sd-section">
                <h3 className="sd-section-title">Pago</h3>
                <InfoRow
                  icon={<MoneyRecive size="18" color="#10B981" />}
                  label="Total del servicio"
                  value={`$${service.totalAmount.toLocaleString("es-CO")}`}
                />
              </div>
            )}

          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ServiceDetail;
