import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonSpinner, IonButton, IonAlert, IonToast } from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { driversAPI } from '../services/adminAPI';
import { ArrowLeft2, LockSlash } from 'iconsax-react';
import './DriverDetail.css';

const TRUCK_TYPES = [
  { value: 'GRUA_MOTO', label: 'Grúa para motos' },
  { value: 'GRUA_LIVIANA', label: 'Grúa liviana' },
  { value: 'GRUA_PESADA', label: 'Grúa pesada' }
];

const VEHICLE_CAPABILITIES = ['MOTOS', 'AUTOS', 'CAMIONETAS', 'CAMIONES', 'BUSES'];

const EMPTY_TRUCK_FORM = {
  truckType: '',
  brand: '',
  model: '',
  licensePlate: '',
  vehicleCapabilities: []
};

const normalizePlate = (value) => value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);

const DriverDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const [driver, setDriver] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [toast, setToast] = useState({ isOpen: false, message: '', color: 'success' });
  const [truckForm, setTruckForm] = useState(EMPTY_TRUCK_FORM);
  const [isSavingTruck, setIsSavingTruck] = useState(false);
  const [isTruckDirty, setIsTruckDirty] = useState(false);

  useEffect(() => {
    loadDriverDetail();
  }, [id]);

  useEffect(() => {
    if (!driver) return;

    const towTruck = driver.driverProfile?.towTruck || {};
    setTruckForm({
      truckType: towTruck.truckType || '',
      brand: towTruck.baseBrand || towTruck.customBrand || towTruck.brand || '',
      model: towTruck.baseModel || towTruck.customModel || towTruck.model || '',
      licensePlate: normalizePlate(towTruck.licensePlate || ''),
      vehicleCapabilities: driver.driverProfile?.vehicleCapabilities || []
    });
    setIsTruckDirty(false);
  }, [driver]);

  const loadDriverDetail = async () => {
    try {
      setIsLoading(true);
      const response = await driversAPI.getById(id);
      setDriver(response.data.driver);
    } catch (error) {
      console.error('❌ Error cargando detalle:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message, color = 'success') => {
    setToast({ isOpen: true, message, color });
  };

  const getMissingTruckFields = () => {
    const missing = [];

    if (!truckForm.truckType) missing.push('tipo de grúa');
    if (!truckForm.brand.trim()) missing.push('marca');
    if (!truckForm.model.trim()) missing.push('modelo/referencia');
    if (!/^[A-Z]{3}(?:\d{3}|\d{2}[A-Z])$/.test(truckForm.licensePlate)) {
      missing.push('placa válida (ABC123 o ABC12D)');
    }
    if (truckForm.vehicleCapabilities.length === 0) missing.push('al menos una capacidad');

    return missing;
  };

  const missingTruckFields = getMissingTruckFields();
  const isTruckFormComplete = missingTruckFields.length === 0;
  const approvalBlockers = [
    ...missingTruckFields,
    ...(isTruckDirty ? ['guardar los cambios de la grúa'] : [])
  ];
  const canApprove = approvalBlockers.length === 0;

  const handleTruckFieldChange = (event) => {
    const { name, value } = event.target;
    setIsTruckDirty(true);
    setTruckForm((current) => ({
      ...current,
      [name]: name === 'licensePlate' ? normalizePlate(value) : value
    }));
  };

  const handleCapabilityChange = (capability) => {
    setIsTruckDirty(true);
    setTruckForm((current) => ({
      ...current,
      vehicleCapabilities: current.vehicleCapabilities.includes(capability)
        ? current.vehicleCapabilities.filter((item) => item !== capability)
        : [...current.vehicleCapabilities, capability]
    }));
  };

  const handleSaveTruck = async (event) => {
    event.preventDefault();

    if (!isTruckFormComplete) {
      showToast(`Completa: ${missingTruckFields.join(', ')}.`, 'warning');
      return;
    }

    try {
      setIsSavingTruck(true);
      const currentTowTruck = driver.driverProfile?.towTruck || {};
      await driversAPI.update(id, {
        towTruck: {
          ...currentTowTruck,
          truckType: truckForm.truckType,
          baseBrand: truckForm.brand.trim(),
          baseModel: truckForm.model.trim(),
          licensePlate: truckForm.licensePlate
        },
        vehicleCapabilities: truckForm.vehicleCapabilities
      });
      await loadDriverDetail();
      showToast('Información de la grúa guardada exitosamente.');
    } catch (error) {
      showToast(
        error.response?.data?.error || error.message || 'No se pudo guardar la información de la grúa.',
        'danger'
      );
    } finally {
      setIsSavingTruck(false);
    }
  };

  const executeAction = async (action, data = {}) => {
    const reason = data.reason?.trim();
    if ((action === 'reject' || action === 'archive') && !reason) {
      showToast('Debes indicar una razón.', 'warning');
      return;
    }

    const requiresCompleteTruck =
      action === 'approve'
      || (action === 'activate' && driver.driverProfile.status === 'rejected');
    if (requiresCompleteTruck && !canApprove) {
      showToast(`No puedes habilitar al conductor todavía. Falta: ${approvalBlockers.join(', ')}.`, 'warning');
      setPendingAction(null);
      return;
    }

    try {
      setIsProcessing(true);
      if (action === 'approve') {
        await driversAPI.approve(id);
        showToast('Conductor aprobado exitosamente.');
      } else if (action === 'reject') {
        await driversAPI.reject(id, reason);
        showToast('Conductor rechazado.');
      } else if (action === 'activate') {
        await driversAPI.activate(id);
        showToast('Conductor activado exitosamente.');
      } else if (action === 'archive') {
        await driversAPI.suspend(id, reason);
        showToast('Conductor suspendido. Su historial se conservó.');
      }
      await loadDriverDetail();
    } catch (error) {
      showToast(error.response?.data?.error || error.message || 'No se pudo completar la acción.', 'danger');
    } finally {
      setIsProcessing(false);
      setPendingAction(null);
    }
  };

  const actionCopy = {
    approve: {
      header: 'Aprobar conductor',
      message: 'El conductor quedará habilitado para operar.',
      confirmText: 'Aprobar'
    },
    reject: {
      header: 'Rechazar conductor',
      message: 'Indica la razón del rechazo.',
      confirmText: 'Rechazar'
    },
    activate: {
      header: 'Activar conductor',
      message: 'El conductor volverá a quedar habilitado.',
      confirmText: 'Activar'
    },
    archive: {
      header: 'Suspender conductor',
      message: 'Se deshabilitará su acceso, pero se conservarán sus documentos y todo su historial.',
      confirmText: 'Suspender'
    }
  };

  const handleImageClick = (imageUrl, title) => {
    setSelectedImage({ url: imageUrl, title });
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    setShowImageModal(false);
    setTimeout(() => setSelectedImage(null), 300);
  };

  if (isLoading) {
    return (
      <IonPage>
        <Sidebar />
        <IonContent>
          <div className="admin-content-wrapper">
            <Header title="Detalle de Conductor" />
            <div className="admin-loading">
              <IonSpinner name="crescent" color="primary" />
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!driver) {
    return (
      <IonPage>
        <Sidebar />
        <IonContent>
          <div className="admin-content-wrapper">
            <Header title="Detalle de Conductor" />
            <div className="empty-state">
              <p>Conductor no encontrado</p>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <Sidebar />
      <IonContent>
        <div className="admin-content-wrapper">
          <div className="detail-header">
          <button className="back-button" onClick={() => history.goBack()}>
            <ArrowLeft2 size="20" />
            Volver
          </button>
        </div>

        <Header title={driver.name} />

        {/* Status Badge */}
        <div className="status-badge-container">
          <span className={`driver-status-badge status-${driver.driverProfile.status}`}>
            {driver.driverProfile.status === 'pending_documents' && '🟡 Pendiente: Completar Documentos'}
            {driver.driverProfile.status === 'pending_review' && '🟡 En Revisión - Requiere Aprobación'}
            {driver.driverProfile.status === 'approved' && '🟢 Aprobado y Activo'}
            {driver.driverProfile.status === 'rejected' && '🔴 Rechazado'}
            {driver.driverProfile.status === 'suspended' && '🔴 Suspendido'}
          </span>
        </div>

        {/* Actions */}
        <div className="driver-actions">
          {driver.driverProfile.status === 'pending_review' && (
            <>
              <IonButton 
                color="success" 
                onClick={() => setPendingAction('approve')}
                disabled={isProcessing || isSavingTruck || !canApprove}
              >
                ✅ Aprobar Conductor
              </IonButton>
              <IonButton 
                color="danger" 
                onClick={() => setPendingAction('reject')}
                disabled={isProcessing}
              >
                ❌ Rechazar
              </IonButton>
            </>
          )}
          
          {(driver.driverProfile.status === 'rejected' || driver.driverProfile.status === 'suspended') && (
            <IonButton 
              color="success" 
              onClick={() => setPendingAction('activate')}
              disabled={
                isProcessing
                || isSavingTruck
                || (driver.driverProfile.status === 'rejected' && !canApprove)
              }
            >
              <LockSlash size="20" style={{ marginRight: '8px' }} />
              Activar Conductor
            </IonButton>
          )}
          
          {driver.driverProfile.status !== 'suspended' && (
            <IonButton
              color="warning"
              onClick={() => setPendingAction('archive')}
              disabled={isProcessing}
            >
              <LockSlash size="20" style={{ marginRight: '8px' }} />
              Suspender / Archivar
            </IonButton>
          )}
        </div>
        {(driver.driverProfile.status === 'pending_review'
          || driver.driverProfile.status === 'rejected') && (
          <div className={`approval-requirements ${canApprove ? 'complete' : 'incomplete'}`}>
            <strong>{canApprove ? 'La información de la grúa está completa.' : 'Aprobación bloqueada.'}</strong>
            <span>
              {canApprove
                ? 'Puedes continuar con la revisión y aprobación.'
                : `Falta: ${approvalBlockers.join(', ')}.`}
            </span>
            <span>SOAT y seguro todo riesgo son opcionales y no bloquean la aprobación.</span>
          </div>
        )}

        {/* Driver Info */}
        <div className="detail-section">
          <h3>Información Personal</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Teléfono</span>
              <span className="info-value">{driver.phone}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Email</span>
              <span className="info-value">{driver.email || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Ciudad</span>
              <span className="info-value">{driver.driverProfile.city}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Tipo</span>
              <span className="info-value">
                {driver.driverProfile.entityType === 'natural' ? 'Persona Natural' : 'Persona Jurídica'}
              </span>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="detail-section">
          <h3>📄 Documentos del Conductor y Grúa</h3>
          <p className="section-subtitle">Revisa cuidadosamente todos los documentos antes de aprobar</p>
          
          {/* Documentos Personales */}
          <h4 className="subsection-title">Documentos Personales</h4>
          <div className="documents-grid">
            {driver.driverProfile.documents.cedula?.front ? (
              <div className="document-item">
                <p className="document-label">✅ Cédula (Frente)</p>
                <img 
                  src={driver.driverProfile.documents.cedula.front} 
                  alt="Cédula Frente" 
                  onClick={() => handleImageClick(driver.driverProfile.documents.cedula.front, 'Cédula (Frente)')}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            ) : (
              <div className="document-item missing">
                <p className="document-label">❌ Cédula (Frente)</p>
                <div className="document-missing">No subido</div>
              </div>
            )}
            
            {driver.driverProfile.documents.cedula?.back ? (
              <div className="document-item">
                <p className="document-label">✅ Cédula (Atrás)</p>
                <img 
                  src={driver.driverProfile.documents.cedula.back} 
                  alt="Cédula Atrás" 
                  onClick={() => handleImageClick(driver.driverProfile.documents.cedula.back, 'Cédula (Atrás)')}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            ) : (
              <div className="document-item missing">
                <p className="document-label">❌ Cédula (Atrás)</p>
                <div className="document-missing">No subido</div>
              </div>
            )}
            
            {driver.driverProfile.documents.selfie ? (
              <div className="document-item">
                <p className="document-label">✅ Selfie</p>
                <img 
                  src={driver.driverProfile.documents.selfie} 
                  alt="Selfie" 
                  onClick={() => handleImageClick(driver.driverProfile.documents.selfie, 'Selfie')}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            ) : (
              <div className="document-item missing">
                <p className="document-label">❌ Selfie</p>
                <div className="document-missing">No subido</div>
              </div>
            )}
          </div>

          {/* Documentos de la Grúa */}
          <h4 className="subsection-title">Documentos de la Grúa</h4>
          <div className="documents-grid">
            {driver.driverProfile.documents.licenciaTransito?.front ? (
              <div className="document-item">
                <p className="document-label">✅ Licencia de Tránsito (Frente)</p>
                <img 
                  src={driver.driverProfile.documents.licenciaTransito.front} 
                  alt="Licencia Frente" 
                  onClick={() => handleImageClick(driver.driverProfile.documents.licenciaTransito.front, 'Licencia de Tránsito (Frente)')}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            ) : (
              <div className="document-item missing">
                <p className="document-label">❌ Licencia de Tránsito (Frente)</p>
                <div className="document-missing">No subido</div>
              </div>
            )}
            
            {driver.driverProfile.documents.licenciaTransito?.back ? (
              <div className="document-item">
                <p className="document-label">✅ Licencia de Tránsito (Atrás)</p>
                <img 
                  src={driver.driverProfile.documents.licenciaTransito.back} 
                  alt="Licencia Atrás" 
                  onClick={() => handleImageClick(driver.driverProfile.documents.licenciaTransito.back, 'Licencia de Tránsito (Atrás)')}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            ) : (
              <div className="document-item missing">
                <p className="document-label">❌ Licencia de Tránsito (Atrás)</p>
                <div className="document-missing">No subido</div>
              </div>
            )}
            
            {driver.driverProfile.documents.soat?.url ? (
              <div className="document-item">
                <p className="document-label">✅ SOAT (Opcional)</p>
                <img 
                  src={driver.driverProfile.documents.soat.url} 
                  alt="SOAT" 
                  onClick={() => handleImageClick(driver.driverProfile.documents.soat.url, 'SOAT')}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            ) : (
              <div className="document-item optional">
                <p className="document-label">SOAT (Opcional)</p>
                <div className="document-missing optional">Opcional · No agregado</div>
              </div>
            )}
            
            {driver.driverProfile.documents.tarjetaPropiedad?.front ? (
              <div className="document-item">
                <p className="document-label">✅ Tarjeta de Propiedad (Frente)</p>
                <img 
                  src={driver.driverProfile.documents.tarjetaPropiedad.front} 
                  alt="Tarjeta Frente" 
                  onClick={() => handleImageClick(driver.driverProfile.documents.tarjetaPropiedad.front, 'Tarjeta de Propiedad (Frente)')}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            ) : (
              <div className="document-item missing">
                <p className="document-label">❌ Tarjeta de Propiedad (Frente)</p>
                <div className="document-missing">No subido</div>
              </div>
            )}
            
            {driver.driverProfile.documents.tarjetaPropiedad?.back ? (
              <div className="document-item">
                <p className="document-label">✅ Tarjeta de Propiedad (Atrás)</p>
                <img 
                  src={driver.driverProfile.documents.tarjetaPropiedad.back} 
                  alt="Tarjeta Atrás" 
                  onClick={() => handleImageClick(driver.driverProfile.documents.tarjetaPropiedad.back, 'Tarjeta de Propiedad (Atrás)')}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            ) : (
              <div className="document-item missing">
                <p className="document-label">❌ Tarjeta de Propiedad (Atrás)</p>
                <div className="document-missing">No subido</div>
              </div>
            )}
            
            {driver.driverProfile.documents.seguroTodoRiesgo?.url ? (
              <div className="document-item">
                <p className="document-label">✅ Seguro Todo Riesgo (Opcional)</p>
                <img 
                  src={driver.driverProfile.documents.seguroTodoRiesgo.url} 
                  alt="Seguro" 
                  onClick={() => handleImageClick(driver.driverProfile.documents.seguroTodoRiesgo.url, 'Seguro Todo Riesgo')}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            ) : (
              <div className="document-item optional">
                <p className="document-label">Seguro Todo Riesgo (Opcional)</p>
                <div className="document-missing optional">Opcional · No agregado</div>
              </div>
            )}
            
            {driver.driverProfile.towTruck?.photoUrl ? (
              <div className="document-item">
                <p className="document-label">✅ Foto de la Grúa</p>
                <img 
                  src={driver.driverProfile.towTruck.photoUrl} 
                  alt="Grúa" 
                  onClick={() => handleImageClick(driver.driverProfile.towTruck.photoUrl, 'Foto de la Grúa')}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            ) : (
              <div className="document-item missing">
                <p className="document-label">❌ Foto de la Grúa</p>
                <div className="document-missing">No subido</div>
              </div>
            )}
          </div>
        </div>

        {/* Tow Truck Details */}
        <div className="detail-section">
          <h3>🚛 Información de la Grúa</h3>
          <p className="section-subtitle">
            Completa y verifica estos datos antes de aprobar al conductor.
          </p>
          <form className="truck-form" onSubmit={handleSaveTruck}>
            <div className="truck-form-grid">
              <label className="truck-field">
                <span>Tipo de grúa *</span>
                <select
                  name="truckType"
                  value={truckForm.truckType}
                  onChange={handleTruckFieldChange}
                  disabled={isSavingTruck}
                >
                  <option value="">Selecciona un tipo</option>
                  {TRUCK_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </label>
              <label className="truck-field">
                <span>Marca *</span>
                <input
                  name="brand"
                  type="text"
                  value={truckForm.brand}
                  onChange={handleTruckFieldChange}
                  placeholder="Ej. Chevrolet"
                  disabled={isSavingTruck}
                />
              </label>
              <label className="truck-field">
                <span>Modelo / referencia *</span>
                <input
                  name="model"
                  type="text"
                  value={truckForm.model}
                  onChange={handleTruckFieldChange}
                  placeholder="Ej. NHR"
                  disabled={isSavingTruck}
                />
              </label>
              <label className="truck-field">
                <span>Placa *</span>
                <input
                  name="licensePlate"
                  type="text"
                  value={truckForm.licensePlate}
                  onChange={handleTruckFieldChange}
                  placeholder="ABC123"
                  maxLength={6}
                  disabled={isSavingTruck}
                  aria-describedby="plate-help"
                />
                <small id="plate-help">Formatos permitidos: ABC123 o ABC12D.</small>
              </label>
            </div>

            <fieldset className="capabilities-fieldset" disabled={isSavingTruck}>
              <legend>Capacidades de transporte *</legend>
              <p>Selecciona al menos un tipo de vehículo.</p>
              <div className="capability-options">
                {VEHICLE_CAPABILITIES.map((capability) => (
                  <label
                    key={capability}
                    className={`capability-option ${
                      truckForm.vehicleCapabilities.includes(capability) ? 'selected' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={truckForm.vehicleCapabilities.includes(capability)}
                      onChange={() => handleCapabilityChange(capability)}
                    />
                    <span>{capability}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {missingTruckFields.length > 0 && (
              <div className="truck-form-warning">
                Completa: {missingTruckFields.join(', ')}.
              </div>
            )}
            {isTruckFormComplete && isTruckDirty && (
              <div className="truck-form-warning">
                Guarda los cambios para habilitar la aprobación.
              </div>
            )}

            <div className="truck-form-actions">
              <IonButton type="submit" disabled={isSavingTruck || isProcessing}>
                {isSavingTruck ? <IonSpinner name="crescent" /> : 'Guardar información de la grúa'}
              </IonButton>
            </div>
          </form>
        </div>
        </div>

        {/* Image Modal */}
        {showImageModal && selectedImage && (
          <div className="image-modal-overlay" onClick={closeImageModal}>
            <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="image-modal-close" onClick={closeImageModal}>
                ✕
              </button>
              <h3 className="image-modal-title">{selectedImage.title}</h3>
              <img 
                src={selectedImage.url} 
                alt={selectedImage.title}
                className="image-modal-img"
              />
            </div>
          </div>
        )}
        <IonAlert
          isOpen={Boolean(pendingAction)}
          onDidDismiss={() => setPendingAction(null)}
          header={pendingAction ? actionCopy[pendingAction].header : ''}
          message={pendingAction ? actionCopy[pendingAction].message : ''}
          inputs={
            pendingAction === 'reject' || pendingAction === 'archive'
              ? [{ name: 'reason', type: 'textarea', placeholder: 'Razón' }]
              : []
          }
          buttons={[
            { text: 'Cancelar', role: 'cancel' },
            {
              text: pendingAction ? actionCopy[pendingAction].confirmText : 'Confirmar',
              role: 'confirm',
              handler: (data) => executeAction(pendingAction, data)
            }
          ]}
        />
        <IonToast
          isOpen={toast.isOpen}
          message={toast.message}
          color={toast.color}
          duration={3000}
          position="top"
          onDidDismiss={() => setToast((current) => ({ ...current, isOpen: false }))}
        />
      </IonContent>
    </IonPage>
  );
};

export default DriverDetail;

