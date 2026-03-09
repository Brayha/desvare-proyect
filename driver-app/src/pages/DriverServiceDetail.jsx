import { useState, useEffect } from "react";
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
  Profile,
  Car,
  Location,
  Calendar,
  Clock,
  MoneyRecive,
  ArrowRight,
  Star1,
} from "iconsax-react";
import { requestAPI } from "../services/api";
import "./DriverServiceDetail.css";

const fmt = (dateStr, opts) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("es-CO", opts);
};
const fmtDate = (d) =>
  fmt(d, { day: "2-digit", month: "long", year: "numeric" });
const fmtTime = (d) =>
  fmt(d, { hour: "2-digit", minute: "2-digit", hour12: true });

const InfoRow = ({ icon, label, value }) => (
  <div className="dsd-row">
    <div className="dsd-row-icon">{icon}</div>
    <div className="dsd-row-texts">
      <span className="dsd-row-label">{label}</span>
      <span className="dsd-row-value">{value || "—"}</span>
    </div>
  </div>
);

const DriverServiceDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) { history.replace("/driver-service-history"); return; }
    loadService();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadService = async () => {
    try {
      const res = await requestAPI.getRequest(id);
      setService(res.data.request || res.data);
    } catch (err) {
      console.error("❌ Error cargando servicio:", err);
      setError("No se pudo cargar el servicio.");
    } finally {
      setLoading(false);
    }
  };

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
            <IonBackButton defaultHref="/driver-service-history" />
          </IonButtons>
          <IonTitle>Detalle del servicio</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="dsd-content">
        {loading && (
          <div className="dsd-center">
            <IonSpinner name="crescent" />
          </div>
        )}

        {!loading && error && (
          <div className="dsd-center">
            <p className="dsd-error">{error}</p>
            <button className="dsd-retry-btn" onClick={loadService}>
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && service && (
          <div className="dsd-container">

            {/* ── Hero: monto + fecha ── */}
            <div className="dsd-hero">
              {service.totalAmount > 0 && (
                <p className="dsd-hero-amount">
                  ${service.totalAmount.toLocaleString("es-CO")}
                </p>
              )}
              <p className="dsd-hero-date">{fmtDate(service.completedAt || service.createdAt)}</p>
              <span className="dsd-hero-badge">Completado</span>
            </div>

            {/* ── Cliente ── */}
            <div className="dsd-section">
              <h3 className="dsd-section-title">Cliente</h3>
              <InfoRow
                icon={<Profile size="18" color="#6B7280" />}
                label="Nombre"
                value={service.clientName}
              />
            </div>

            {/* ── Ruta ── */}
            <div className="dsd-section">
              <h3 className="dsd-section-title">Ruta</h3>
              <div className="dsd-route">
                <div className="dsd-route-point">
                  <div className="dsd-route-dot dsd-route-dot--origin" />
                  <div className="dsd-route-info">
                    <span className="dsd-route-tag">Origen</span>
                    <span className="dsd-route-address">
                      {service.origin?.address || service.origin || "—"}
                    </span>
                  </div>
                </div>
                <div className="dsd-route-divider">
                  <div className="dsd-route-line-vert" />
                  <ArrowRight size="14" color="#9CA3AF" />
                </div>
                <div className="dsd-route-point">
                  <div className="dsd-route-dot dsd-route-dot--dest" />
                  <div className="dsd-route-info">
                    <span className="dsd-route-tag">Destino</span>
                    <span className="dsd-route-address">
                      {service.destination?.address || service.destination || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Tiempos ── */}
            <div className="dsd-section">
              <h3 className="dsd-section-title">Tiempos</h3>
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

            {/* ── Vehículo (sin placa) ── */}
            <div className="dsd-section">
              <h3 className="dsd-section-title">Vehículo atendido</h3>
              <InfoRow
                icon={<Car size="18" color="#6B7280" />}
                label="Vehículo"
                value={vehicleLabel()}
              />
              {service.vehicleSnapshot?.category?.name && (
                <InfoRow
                  icon={<Car size="18" color="#6B7280" />}
                  label="Categoría"
                  value={service.vehicleSnapshot.category.name}
                />
              )}
            </div>

            {/* ── Monto ── */}
            {service.totalAmount > 0 && (
              <div className="dsd-section">
                <h3 className="dsd-section-title">Cobro</h3>
                <InfoRow
                  icon={<MoneyRecive size="18" color="#10B981" />}
                  label="Total cobrado"
                  value={`$${service.totalAmount.toLocaleString("es-CO")}`}
                />
              </div>
            )}

            {/* ── Calificación del cliente ── */}
            {service.rating?.stars && (
              <div className="dsd-section">
                <h3 className="dsd-section-title">Calificación del cliente</h3>
                <div className="dsd-stars">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className={`dsd-star ${s <= service.rating.stars ? "dsd-star--filled" : ""}`}
                    >
                      ★
                    </span>
                  ))}
                  <span className="dsd-stars-label">
                    {service.rating.stars} / 5
                  </span>
                </div>
                {service.rating.comment && (
                  <p className="dsd-rating-comment">"{service.rating.comment}"</p>
                )}
              </div>
            )}

          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default DriverServiceDetail;
