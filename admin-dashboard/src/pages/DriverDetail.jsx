import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonSpinner, IonButton } from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { driversAPI } from '../services/adminAPI';
import { ArrowLeft2, Trash, LockSlash } from 'iconsax-react';
import './DriverDetail.css';

const DriverDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const [driver, setDriver] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    loadDriverDetail();
  }, [id]);

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

  const handleApprove = async () => {
    if (!confirm('¿Estás seguro de aprobar este conductor?')) return;
    
    try {
      setIsProcessing(true);
      await driversAPI.approve(id);
      alert('✅ Conductor aprobado exitosamente');
      loadDriverDetail();
    } catch (error) {
      alert('❌ Error al aprobar: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Ingresa la razón del rechazo:');
    if (!reason) return;
    
    try {
      setIsProcessing(true);
      await driversAPI.reject(id, reason);
      alert('✅ Conductor rechazado');
      loadDriverDetail();
    } catch (error) {
      alert('❌ Error al rechazar: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActivate = async () => {
    if (!confirm('¿Estás seguro de activar este conductor?')) return;
    
    try {
      setIsProcessing(true);
      await driversAPI.activate(id);
      alert('✅ Conductor activado exitosamente');
      loadDriverDetail();
    } catch (error) {
      alert('❌ Error al activar: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('⚠️ ¿Estás seguro de ELIMINAR permanentemente este conductor?\n\nEsta acción NO se puede deshacer.\n\nSe eliminarán:\n- El conductor\n- Sus documentos\n- Su historial de servicios')) {
      return;
    }

    const confirmText = prompt('Escribe "ELIMINAR" para confirmar:');
    if (confirmText !== 'ELIMINAR') {
      alert('❌ Eliminación cancelada');
      return;
    }
    
    try {
      setIsProcessing(true);
      await driversAPI.delete(id);
      alert('✅ Conductor eliminado exitosamente');
      history.replace('/drivers');
    } catch (error) {
      alert('❌ Error al eliminar: ' + (error.response?.data?.error || error.message));
      setIsProcessing(false);
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
          {(driver.driverProfile.status === 'pending_documents' || 
            driver.driverProfile.status === 'pending_review') && (
            <>
              <IonButton 
                color="success" 
                onClick={handleApprove}
                disabled={isProcessing}
              >
                ✅ Aprobar Conductor
              </IonButton>
              <IonButton 
                color="danger" 
                onClick={handleReject}
                disabled={isProcessing}
              >
                ❌ Rechazar
              </IonButton>
            </>
          )}
          
          {(driver.driverProfile.status === 'rejected' || driver.driverProfile.status === 'suspended') && (
            <IonButton 
              color="success" 
              onClick={handleActivate}
              disabled={isProcessing}
            >
              <LockSlash size="20" style={{ marginRight: '8px' }} />
              Activar Conductor
            </IonButton>
          )}
          
          <IonButton 
            color="danger" 
            onClick={handleDelete}
            disabled={isProcessing}
          >
            <Trash size="20" style={{ marginRight: '8px' }} />
            Eliminar Conductor
          </IonButton>
        </div>

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
                <p className="document-label">✅ SOAT</p>
                <img 
                  src={driver.driverProfile.documents.soat.url} 
                  alt="SOAT" 
                  onClick={() => handleImageClick(driver.driverProfile.documents.soat.url, 'SOAT')}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            ) : (
              <div className="document-item missing">
                <p className="document-label">❌ SOAT</p>
                <div className="document-missing">No subido</div>
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
            
            {driver.driverProfile.documents.seguroTodoRiesgo?.url && (
              <div className="document-item">
                <p className="document-label">✅ Seguro Todo Riesgo (Opcional)</p>
                <img 
                  src={driver.driverProfile.documents.seguroTodoRiesgo.url} 
                  alt="Seguro" 
                  onClick={() => handleImageClick(driver.driverProfile.documents.seguroTodoRiesgo.url, 'Seguro Todo Riesgo')}
                  style={{ cursor: 'pointer' }}
                />
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
        {driver.driverProfile.towTruck && (
          <div className="detail-section">
            <h3>🚛 Información de la Grúa</h3>
            <p className="section-subtitle">Detalles del vehículo de remolque</p>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Tipo de Grúa</span>
                <span className="info-value">
                  {driver.driverProfile.towTruck.truckType === 'GRUA_LIVIANA' ? '🚙 Grúa Liviana' : '🚛 Grúa Pesada'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Marca</span>
                <span className="info-value">{driver.driverProfile.towTruck.baseBrand || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Modelo</span>
                <span className="info-value">{driver.driverProfile.towTruck.baseModel || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Placa</span>
                <span className="info-value">{driver.driverProfile.towTruck.licensePlate || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Vehicle Capabilities */}
        {driver.driverProfile.vehicleCapabilities && driver.driverProfile.vehicleCapabilities.length > 0 && (
          <div className="detail-section">
            <h3>🚚 Capacidades de la Grúa</h3>
            <p className="section-subtitle">Tipos de vehículos que puede transportar</p>
            <div className="capabilities-list">
              {driver.driverProfile.vehicleCapabilities.map((cap, index) => (
                <span key={index} className="capability-badge">
                  {cap}
                </span>
              ))}
            </div>
          </div>
        )}
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
      </IonContent>
    </IonPage>
  );
};

export default DriverDetail;

