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
  IonText,
  IonSelect,
  IonSelectOption,
} from "@ionic/react";
import { Profile, Sms, Location, Map, Camera } from "iconsax-react";
import { authAPI, citiesAPI } from "../services/api";
import { Input } from "../components/Input/Input";
import "./EditProfile.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const DOCUMENT_LABELS = {
  selfie: { label: "Selfie", key: "selfie", type: "single" },
  cedulaFront: { label: "Cédula (Frente)", key: "cedula.front", type: "nested" },
  cedulaBack: { label: "Cédula (Atrás)", key: "cedula.back", type: "nested" },
  licenciaFront: { label: "Licencia de Tránsito (Frente)", key: "licenciaTransito.front", type: "nested" },
  licenciaBack: { label: "Licencia de Tránsito (Atrás)", key: "licenciaTransito.back", type: "nested" },
  soat: { label: "SOAT", key: "soat.url", type: "nested" },
  tarjetaFront: { label: "Tarjeta de Propiedad (Frente)", key: "tarjetaPropiedad.front", type: "nested" },
  tarjetaBack: { label: "Tarjeta de Propiedad (Atrás)", key: "tarjetaPropiedad.back", type: "nested" },
  seguro: { label: "Seguro Todo Riesgo", key: "seguroTodoRiesgo.url", type: "nested" },
  gruaPhoto: { label: "Foto de la Grúa", key: "towTruckPhoto", type: "truck" },
};

const getDocUrl = (documents, towTruck, docKey) => {
  const config = DOCUMENT_LABELS[docKey];
  if (!config || !documents) return null;

  if (config.type === "truck") return towTruck?.photoUrl || null;
  if (config.type === "single") return documents[config.key] || null;

  const parts = config.key.split(".");
  return documents[parts[0]]?.[parts[1]] || null;
};

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const MAX = 1200;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width / height > 1) {
            height = Math.round((height * MAX) / width);
            width = MAX;
          } else {
            width = Math.round((width * MAX) / height);
            height = MAX;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });

const EditProfile = () => {
  const history = useHistory();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cities, setCities] = useState([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");

  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");

  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      history.push("/login");
      return;
    }
    const parsedUser = JSON.parse(userData);
    loadProfile(parsedUser._id);
    loadCities();
  }, [history]);

  const loadProfile = async (driverId) => {
    try {
      const response = await fetch(`${API_URL}/api/drivers/profile/${driverId}`);
      const data = await response.json();
      if (response.ok) {
        const d = data.driver;
        setProfile(d);
        setName(d.name || "");
        setEmail(d.email || "");
        setCity(d.city || "");
        setAddress(d.address || "");
      }
    } catch (error) {
      console.error("❌ Error cargando perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCities = async () => {
    try {
      const response = await citiesAPI.getAll();
      if (Array.isArray(response.data)) setCities(response.data);
    } catch {
      setCities([]);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!name || name.trim().length < 3) newErrors.name = "Ingresa tu nombre completo";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Ingresa un email válido";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setSuccessMsg("");
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      await authAPI.updateProfile(userData._id, { name, email, city, address });
      setSuccessMsg("¡Perfil actualizado correctamente!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      console.error("❌ Error guardando perfil:", error);
      setErrors({ general: "Error al guardar. Intenta de nuevo." });
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentUpload = async (docType, file) => {
    if (!file) return;
    setUploadingDoc(docType);
    try {
      const userData = JSON.parse(localStorage.getItem("user"));
      const base64 = await fileToBase64(file);
      await authAPI.uploadDriverDocuments({
        userId: userData._id,
        documents: [{ file: base64, documentType: docType }],
      });
      await loadProfile(userData._id);
    } catch (error) {
      console.error("❌ Error subiendo documento:", error);
    } finally {
      setUploadingDoc(null);
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/profile" />
            </IonButtons>
            <IonTitle>Editar Perfil</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner name="crescent" />
        </IonContent>
      </IonPage>
    );
  }

  const docUploadMap = {
    selfie: "selfie",
    cedulaFront: "cedula-front",
    cedulaBack: "cedula-back",
    licenciaFront: "licencia-front",
    licenciaBack: "licencia-back",
    soat: "soat",
    tarjetaFront: "tarjeta-front",
    tarjetaBack: "tarjeta-back",
    seguro: "seguro",
    gruaPhoto: "grua-photo",
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/profile" />
          </IonButtons>
          <IonTitle>Editar Perfil</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="edit-profile-content">
        <div className="edit-profile-container">

          {/* ── Datos Personales ── */}
          <div className="edit-section">
            <h2 className="edit-section-title">Datos Personales</h2>

            <Input
              type="text"
              placeholder="Nombre completo"
              value={name}
              onChange={setName}
              error={errors.name}
              icon={<Profile size="20" color={errors.name ? "#EF4444" : "#9CA3AF"} />}
            />

            <Input
              type="email"
              placeholder="Email (opcional)"
              value={email}
              onChange={setEmail}
              error={errors.email}
              icon={<Sms size="20" color={errors.email ? "#EF4444" : "#9CA3AF"} />}
            />

            <div className="modern-input-wrapper">
              <div className="modern-input-group">
                <div className="modern-input-icon">
                  <Location size="20" color="#9CA3AF" />
                </div>
                <IonSelect
                  value={city}
                  placeholder="Selecciona tu ciudad"
                  onIonChange={(e) => setCity(e.detail.value)}
                  interface="action-sheet"
                  className="modern-select-field"
                >
                  {cities.map((c, i) => (
                    <IonSelectOption key={i} value={c.name}>
                      {c.name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </div>
            </div>

            <Input
              type="text"
              placeholder="Dirección"
              value={address}
              onChange={setAddress}
              icon={<Map size="20" color="#9CA3AF" />}
            />

            {errors.general && (
              <IonText color="danger">
                <p className="edit-error-msg">{errors.general}</p>
              </IonText>
            )}

            {successMsg && (
              <div className="edit-success-msg">{successMsg}</div>
            )}

            <button
              className="edit-save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <IonSpinner name="crescent" /> : "Guardar cambios"}
            </button>
          </div>

          {/* ── Documentos y Fotos ── */}
          <div className="edit-section">
            <h2 className="edit-section-title">Documentos y Fotos</h2>
            <p className="edit-section-subtitle">
              Toca cualquier documento para actualizarlo
            </p>

            <div className="docs-grid">
              {Object.entries(DOCUMENT_LABELS).map(([key, { label }]) => {
                const url = getDocUrl(profile?.documents, profile?.towTruck, key);
                const isUploading = uploadingDoc === docUploadMap[key];

                return (
                  <div key={key} className="doc-card">
                    <label className="doc-card-inner">
                      <input
                        type="file"
                        accept="image/*"
                        className="doc-input-hidden"
                        onChange={(e) =>
                          handleDocumentUpload(docUploadMap[key], e.target.files[0])
                        }
                        disabled={isUploading}
                      />

                      {isUploading ? (
                        <div className="doc-uploading">
                          <IonSpinner name="crescent" />
                        </div>
                      ) : url ? (
                        <img
                          src={url}
                          alt={label}
                          className="doc-img"
                          onClick={(e) => {
                            e.preventDefault();
                            setPreviewDoc({ url, label });
                          }}
                        />
                      ) : (
                        <div className="doc-empty">
                          <Camera size="28" color="#9CA3AF" />
                        </div>
                      )}

                      <div className="doc-label-row">
                        <span className="doc-label">{label}</span>
                        {url && (
                          <span className="doc-badge-ok">✓</span>
                        )}
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Modal de previsualización ── */}
        {previewDoc && (
          <div className="doc-preview-overlay" onClick={() => setPreviewDoc(null)}>
            <div className="doc-preview-modal" onClick={(e) => e.stopPropagation()}>
              <div className="doc-preview-header">
                <span>{previewDoc.label}</span>
                <button className="doc-preview-close" onClick={() => setPreviewDoc(null)}>
                  ✕
                </button>
              </div>
              <img src={previewDoc.url} alt={previewDoc.label} className="doc-preview-img" />
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default EditProfile;
