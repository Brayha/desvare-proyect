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
  IonText,
  IonSelect,
  IonSelectOption,
} from "@ionic/react";
import { Profile, Sms, Call, Location, Map, Card, Calendar } from "iconsax-react";
import { profileAPI, citiesAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import "./EditAccount.css";

const DOCUMENT_TYPES = ["CC", "CE", "Pasaporte", "NIT"];

const EditAccount = () => {
  const history = useHistory();
  const { user, login } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cities, setCities] = useState([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [errors, setErrors] = useState({});

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");

  useEffect(() => {
    if (!user?.id) {
      history.replace("/tabs/my-account");
      return;
    }
    // Asegurar que nombre y email se actualicen si el contexto ya los tiene
    setName(user.name || "");
    setEmail(user.email || "");
    loadProfile();
    loadCities();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadProfile = async () => {
    try {
      const res = await profileAPI.getProfile(user.id);
      const { profile } = res.data;
      // Actualizar todos los campos con los datos del servidor
      setName(profile.name || user?.name || "");
      setEmail(profile.email || user?.email || "");
      const cp = profile.clientProfile || {};
      setCity(cp.city || "");
      setAddress(cp.address || "");
      setDocumentType(cp.documentType || "");
      setDocumentNumber(cp.documentNumber || "");
      setBirthDate(
        cp.birthDate ? new Date(cp.birthDate).toISOString().split("T")[0] : ""
      );
    } catch (err) {
      // Si el API falla, los campos básicos ya están desde el contexto
      console.warn("⚠️ No se pudo cargar perfil extendido:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCities = async () => {
    try {
      const res = await citiesAPI.getAll();
      if (Array.isArray(res.data)) setCities(res.data);
    } catch {
      setCities([]);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!name || name.trim().length < 2)
      newErrors.name = "Ingresa tu nombre completo";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Email inválido";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setSuccessMsg("");
    setErrors({});
    try {
      const res = await profileAPI.updateProfile(user.id, {
        name,
        email,
        city,
        address,
        documentType,
        documentNumber,
        birthDate: birthDate || null,
      });

      // Actualizar el nombre en el contexto/localStorage
      const updatedUser = { ...user, name: res.data.profile.name, email: res.data.profile.email };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      await login(updatedUser);

      setSuccessMsg("¡Perfil actualizado correctamente!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("❌ Error guardando perfil:", err);
      setErrors({ general: "Error al guardar. Intenta de nuevo." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/tabs/my-account" />
            </IonButtons>
            <IonTitle>Editar perfil</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="edit-account-content ion-text-center ion-padding">
          <IonSpinner name="crescent" />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/my-account" />
          </IonButtons>
          <IonTitle>Editar perfil</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="edit-account-content">
        <div className="edit-account-container">

          {/* ── Datos básicos ── */}
          <div className="ea-section">
            <h2 className="ea-section-title">Datos básicos</h2>

            <div className="ea-field-wrapper">
              <div className={`ea-field ${errors.name ? "ea-field--error" : ""}`}>
                <div className="ea-field-icon">
                  <Profile size="20" color={errors.name ? "#EF4444" : "#9CA3AF"} />
                </div>
                <input
                  className="ea-input"
                  type="text"
                  placeholder="Nombre completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              {errors.name && <span className="ea-error-text">{errors.name}</span>}
            </div>

            <div className="ea-field-wrapper">
              <div className={`ea-field ${errors.email ? "ea-field--error" : ""}`}>
                <div className="ea-field-icon">
                  <Sms size="20" color={errors.email ? "#EF4444" : "#9CA3AF"} />
                </div>
                <input
                  className="ea-input"
                  type="email"
                  placeholder="Email (opcional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {errors.email && <span className="ea-error-text">{errors.email}</span>}
            </div>

            {/* Teléfono — solo lectura */}
            <div className="ea-field ea-field--readonly">
              <div className="ea-field-icon">
                <Call size="20" color="#9CA3AF" />
              </div>
              <span className="ea-input ea-input--readonly">
                {user?.phone || "N/A"}
              </span>
              <span className="ea-readonly-badge">No editable</span>
            </div>
          </div>

          {/* ── Ubicación ── */}
          <div className="ea-section">
            <h2 className="ea-section-title">Ubicación</h2>

            <div className="ea-field">
              <div className="ea-field-icon">
                <Location size="20" color="#9CA3AF" />
              </div>
              <IonSelect
                value={city}
                placeholder="Ciudad"
                onIonChange={(e) => setCity(e.detail.value)}
                interface="action-sheet"
                className="ea-select"
              >
                {cities.map((c, i) => (
                  <IonSelectOption key={i} value={c.name}>
                    {c.name}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </div>

            <div className="ea-field">
              <div className="ea-field-icon">
                <Map size="20" color="#9CA3AF" />
              </div>
              <input
                className="ea-input"
                type="text"
                placeholder="Dirección"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>

          {/* ── Documento ── */}
          <div className="ea-section">
            <h2 className="ea-section-title">Documento de identidad</h2>

            <div className="ea-field">
              <div className="ea-field-icon">
                <Card size="20" color="#9CA3AF" />
              </div>
              <IonSelect
                value={documentType}
                placeholder="Tipo de documento"
                onIonChange={(e) => setDocumentType(e.detail.value)}
                interface="action-sheet"
                className="ea-select"
              >
                {DOCUMENT_TYPES.map((dt) => (
                  <IonSelectOption key={dt} value={dt}>
                    {dt}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </div>

            <div className="ea-field">
              <div className="ea-field-icon">
                <Card size="20" color="#9CA3AF" />
              </div>
              <input
                className="ea-input"
                type="text"
                placeholder="Número de documento"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                inputMode="numeric"
              />
            </div>

            <div className="ea-field">
              <div className="ea-field-icon">
                <Calendar size="20" color="#9CA3AF" />
              </div>
              <input
                className="ea-input ea-input--date"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
              {!birthDate && (
                <span className="ea-date-placeholder">Fecha de nacimiento</span>
              )}
            </div>
          </div>

          {/* ── Mensajes ── */}
          {errors.general && (
            <IonText color="danger">
              <p className="ea-msg">{errors.general}</p>
            </IonText>
          )}
          {successMsg && (
            <div className="ea-success-msg">{successMsg}</div>
          )}

          {/* ── Botón guardar ── */}
          <button
            className="ea-save-btn"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <IonSpinner name="crescent" /> : "Guardar cambios"}
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default EditAccount;
