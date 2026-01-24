import { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardContent,
  IonButton,
  IonSpinner,
  IonText,
  IonIcon,
  IonBadge,
  useIonAlert,
  useIonToast,
} from '@ionic/react';
import { locationOutline, timeOutline, cashOutline, carOutline, alertCircleOutline } from 'ionicons/icons';
import { requestAPI } from '../services/api';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './QuoteDetail.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const QuoteDetail = () => {
  const { requestId } = useParams();
  const history = useHistory();
  const [presentAlert] = useIonAlert();
  const [present] = useIonToast();
  
  const [request, setRequest] = useState(null);
  const [myQuote, setMyQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [routeGeoJSON, setRouteGeoJSON] = useState(null);

  useEffect(() => {
    loadRequestDetail();
  }, [requestId]);

  // Actualizar tiempo transcurrido cada segundo
  useEffect(() => {
    if (!myQuote) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - new Date(myQuote.timestamp).getTime();
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      setTimeElapsed(`${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [myQuote]);

  // Cargar ruta entre origen y destino
  useEffect(() => {
    if (request && request.origin && request.destination) {
      loadRoute();
    }
  }, [request]);

  const loadRequestDetail = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Cargar del backend
      const response = await requestAPI.getRequest(requestId);
      const requestData = response.data.request;
      
      console.log('✅ Request cargado del backend:', requestData);
      
      // Buscar MI cotización
      const quote = requestData.quotes?.find(
        q => q.driverId.toString() === user._id.toString()
      );
      
      if (!quote) {
        console.log('⚠️ No tienes una cotización para esta solicitud');
        present({
          message: 'No tienes una cotización para esta solicitud',
          duration: 2000,
          color: 'warning'
        });
        history.goBack();
        return;
      }

      setMyQuote(quote);
      setRequest(requestData);
      console.log('✅ Cotización encontrada:', quote);
      
    } catch (error) {
      console.error('❌ Error al cargar detalle:', error);
      present({
        message: 'Error al cargar detalle de la cotización',
        duration: 2000,
        color: 'danger'
      });
      history.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadRoute = async () => {
    try {
      // Validar que existan coordenadas válidas
      if (!request.origin?.coordinates || !request.destination?.coordinates) {
        console.log('⚠️ No hay coordenadas disponibles para cargar ruta');
        return;
      }

      const origin = request.origin.coordinates;
      const destination = request.destination.coordinates;

      // Validar que no sean coordenadas [0, 0] (placeholder)
      if ((origin[0] === 0 && origin[1] === 0) || (destination[0] === 0 && destination[1] === 0)) {
        console.log('⚠️ Coordenadas no válidas, esperando datos del backend...');
        return;
      }
      
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        setRouteGeoJSON({
          type: 'Feature',
          geometry: data.routes[0].geometry
        });
      }
    } catch (error) {
      console.error('Error al cargar ruta:', error);
    }
  };

  const handleCancelQuote = () => {
    presentAlert({
      header: '¿Cancelar Cotización?',
      message: 'Selecciona el motivo de la cancelación:',
      inputs: [
        {
          type: 'radio',
          label: 'No puedo atender',
          value: 'no_puedo_atender',
          checked: true
        },
        {
          type: 'radio',
          label: 'Error en el monto',
          value: 'error_monto'
        },
        {
          type: 'radio',
          label: 'Muy lejos',
          value: 'muy_lejos'
        },
        {
          type: 'radio',
          label: 'Cliente sospechoso',
          value: 'cliente_sospechoso'
        },
        {
          type: 'radio',
          label: 'Otro motivo',
          value: 'otro'
        }
      ],
      buttons: [
        {
          text: 'Volver',
          role: 'cancel'
        },
        {
          text: 'Confirmar Cancelación',
          cssClass: 'alert-button-confirm',
          handler: async (reason) => {
            if (!reason) {
              present({
                message: 'Selecciona un motivo',
                duration: 2000,
                color: 'warning'
              });
              return false;
            }
            
            if (reason === 'otro') {
              // Mostrar segundo alert para ingresar motivo personalizado
              presentAlert({
                header: 'Otro Motivo',
                message: 'Describe el motivo de la cancelación:',
                inputs: [
                  {
                    name: 'customReason',
                    type: 'textarea',
                    placeholder: 'Escribe aquí...'
                  }
                ],
                buttons: [
                  {
                    text: 'Cancelar',
                    role: 'cancel'
                  },
                  {
                    text: 'Confirmar',
                    handler: (data) => {
                      if (!data.customReason || data.customReason.trim() === '') {
                        present({
                          message: 'Debes escribir un motivo',
                          duration: 2000,
                          color: 'warning'
                        });
                        return false;
                      }
                      cancelQuote(reason, data.customReason);
                    }
                  }
                ]
              });
            } else {
              await cancelQuote(reason);
            }
          }
        }
      ]
    });
  };

  const cancelQuote = async (reason, customReason = null) => {
    setCancelling(true);
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      await requestAPI.cancelQuote(requestId, user._id, {
        reason,
        customReason
      });

      present({
        message: 'Cotización cancelada exitosamente',
        duration: 2000,
        color: 'success'
      });

      // Remover de localStorage si existe
      const quotedRequests = JSON.parse(localStorage.getItem('quotedRequests') || '[]');
      const updated = quotedRequests.filter(r => r.requestId !== requestId);
      localStorage.setItem('quotedRequests', JSON.stringify(updated));

      history.replace('/home');
      
    } catch (error) {
      console.error('Error al cancelar:', error);
      present({
        message: error.response?.data?.error || 'Error al cancelar cotización',
        duration: 3000,
        color: 'danger'
      });
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = () => {
    if (!myQuote) return null;

    const statusConfig = {
      pending: { color: 'warning', text: 'Pendiente' },
      accepted: { color: 'success', text: 'Aceptada' },
      cancelled: { color: 'danger', text: 'Cancelada' },
      expired: { color: 'medium', text: 'Expirada' }
    };

    const config = statusConfig[myQuote.status] || statusConfig.pending;

    return (
      <IonBadge color={config.color} style={{ fontSize: '14px', padding: '8px 12px' }}>
        {config.text}
      </IonBadge>
    );
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" />
            </IonButtons>
            <IonTitle>Detalle de Cotización</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <IonSpinner name="crescent" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!request || !myQuote) {
    return null;
  }

  // Validar que existan las coordenadas antes de calcular el centro
  if (!request.origin?.coordinates || !request.destination?.coordinates) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/home" />
            </IonButtons>
            <IonTitle>Detalle de Cotización</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: '10px' }}>
            <IonSpinner name="crescent" />
            <IonText color="medium">Cargando coordenadas...</IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Calcular centro del mapa
  const centerLng = (request.origin.coordinates[0] + request.destination.coordinates[0]) / 2;
  const centerLat = (request.origin.coordinates[1] + request.destination.coordinates[1]) / 2;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Detalle de Cotización</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Mapa */}
        <div style={{ height: '300px', position: 'relative' }}>
          <Map
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={{
              longitude: centerLng,
              latitude: centerLat,
              zoom: 11
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/streets-v11"
          >
            {/* Marcador de Origen */}
            <Marker
              longitude={request.origin.coordinates[0]}
              latitude={request.origin.coordinates[1]}
              anchor="bottom"
            >
              <div style={{ 
                backgroundColor: '#3880ff', 
                width: '30px', 
                height: '30px', 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                border: '3px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                A
              </div>
            </Marker>

            {/* Marcador de Destino */}
            <Marker
              longitude={request.destination.coordinates[0]}
              latitude={request.destination.coordinates[1]}
              anchor="bottom"
            >
              <div style={{ 
                backgroundColor: '#10dc60', 
                width: '30px', 
                height: '30px', 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                border: '3px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                B
              </div>
            </Marker>

            {/* Ruta */}
            {routeGeoJSON && (
              <Source id="route" type="geojson" data={routeGeoJSON}>
                <Layer
                  id="route-layer"
                  type="line"
                  paint={{
                    'line-color': '#3880ff',
                    'line-width': 4,
                    'line-opacity': 0.8
                  }}
                />
              </Source>
            )}
          </Map>
        </div>

        <div className="ion-padding">
          {/* Estado de la Cotización */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <IonText>
              <h2 style={{ margin: 0 }}>Tu Cotización</h2>
            </IonText>
            {getStatusBadge()}
          </div>

          {/* Card del Monto Cotizado */}
          <IonCard color="primary" style={{ marginBottom: '16px' }}>
            <IonCardContent style={{ textAlign: 'center', padding: '24px' }}>
              <IonIcon icon={cashOutline} style={{ fontSize: '48px', marginBottom: '8px' }} />
              <h1 style={{ fontSize: '48px', margin: '8px 0', fontWeight: 'bold' }}>
                ${myQuote.amount.toLocaleString()}
              </h1>
              <IonText color="light">
                <p style={{ margin: '4px 0', fontSize: '14px' }}>
                  <IonIcon icon={timeOutline} /> Enviada hace {timeElapsed}
                </p>
              </IonText>
            </IonCardContent>
          </IonCard>

          {/* Información del Cliente */}
          <IonCard>
            <IonCardContent>
              <IonText color="primary">
                <h3 style={{ marginTop: 0 }}>Información del Cliente</h3>
              </IonText>
              
              <div style={{ marginBottom: '12px' }}>
                <IonText color="medium">
                  <p style={{ margin: '4px 0', fontSize: '12px' }}>Cliente</p>
                </IonText>
                <IonText>
                  <p style={{ margin: '0', fontSize: '16px', fontWeight: '500' }}>
                    {request.clientName}
                  </p>
                </IonText>
              </div>

              {request.clientPhone && request.clientPhone !== 'N/A' && (
                <div style={{ marginBottom: '12px' }}>
                  <IonText color="medium">
                    <p style={{ margin: '4px 0', fontSize: '12px' }}>Teléfono</p>
                  </IonText>
                  <IonText>
                    <p style={{ margin: '0', fontSize: '16px' }}>
                      {request.clientPhone}
                    </p>
                  </IonText>
                </div>
              )}
            </IonCardContent>
          </IonCard>

          {/* Información del Vehículo */}
          {request.vehicleSnapshot && (
            <IonCard>
              <IonCardContent>
                <IonText color="primary">
                  <h3 style={{ marginTop: 0 }}>
                    <IonIcon icon={carOutline} /> Vehículo
                  </h3>
                </IonText>
                
                <div style={{ marginBottom: '8px' }}>
                  <IonText>
                    <p style={{ margin: '4px 0', fontSize: '16px', fontWeight: '500' }}>
                      {request.vehicleSnapshot.vehicle?.icon || '🚗'} {request.vehicleSnapshot.brand?.name} {request.vehicleSnapshot.model?.name}
                    </p>
                  </IonText>
                </div>

                {request.vehicleSnapshot.licensePlate && (
                  <div style={{ marginBottom: '8px' }}>
                    <IonText color="medium">
                      <p style={{ margin: '0', fontSize: '14px' }}>
                        Placa: {request.vehicleSnapshot.licensePlate}
                      </p>
                    </IonText>
                  </div>
                )}

                {request.serviceDetails?.problem && (
                  <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f4f5f8', borderRadius: '8px' }}>
                    <IonText color="medium">
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px' }}>
                        <IonIcon icon={alertCircleOutline} /> Problema reportado:
                      </p>
                    </IonText>
                    <IonText>
                      <p style={{ margin: '0', fontSize: '14px' }}>
                        {request.serviceDetails.problem}
                      </p>
                    </IonText>
                  </div>
                )}
              </IonCardContent>
            </IonCard>
          )}

          {/* Información de la Ruta */}
          <IonCard>
            <IonCardContent>
              <IonText color="primary">
                <h3 style={{ marginTop: 0 }}>
                  <IonIcon icon={locationOutline} /> Ruta
                </h3>
              </IonText>
              
              <div style={{ marginBottom: '12px' }}>
                <IonText color="medium">
                  <p style={{ margin: '4px 0', fontSize: '12px' }}>📍 Origen</p>
                </IonText>
                <IonText>
                  <p style={{ margin: '0', fontSize: '14px' }}>
                    {request.origin.address}
                  </p>
                </IonText>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <IonText color="medium">
                  <p style={{ margin: '4px 0', fontSize: '12px' }}>📍 Destino</p>
                </IonText>
                <IonText>
                  <p style={{ margin: '0', fontSize: '14px' }}>
                    {request.destination.address}
                  </p>
                </IonText>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                <div style={{ flex: 1 }}>
                  <IonText color="medium">
                    <p style={{ margin: '0', fontSize: '12px' }}>Distancia</p>
                  </IonText>
                  <IonText>
                    <p style={{ margin: '4px 0', fontSize: '16px', fontWeight: '500' }}>
                      {request.distanceKm || (request.distance / 1000).toFixed(1)} km
                    </p>
                  </IonText>
                </div>
                <div style={{ flex: 1 }}>
                  <IonText color="medium">
                    <p style={{ margin: '0', fontSize: '12px' }}>Tiempo estimado</p>
                  </IonText>
                  <IonText>
                    <p style={{ margin: '4px 0', fontSize: '16px', fontWeight: '500' }}>
                      {request.durationMin || Math.round(request.duration / 60)} min
                    </p>
                  </IonText>
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          {/* Botón Cancelar Cotización (solo si está pendiente) */}
          {myQuote.status === 'pending' && (
            <IonButton 
              expand="block" 
              color="danger"
              onClick={handleCancelQuote}
              disabled={cancelling}
              style={{ marginTop: '16px', marginBottom: '32px' }}
            >
              {cancelling ? (
                <>
                  <IonSpinner name="crescent" style={{ marginRight: '8px' }} />
                  Cancelando...
                </>
              ) : (
                'Cancelar Cotización'
              )}
            </IonButton>
          )}

          {/* Mensaje si ya fue cancelada o expirada */}
          {(myQuote.status === 'cancelled' || myQuote.status === 'expired') && (
            <IonCard color="light">
              <IonCardContent style={{ textAlign: 'center' }}>
                <IonText color="medium">
                  <p style={{ margin: '0' }}>
                    {myQuote.status === 'cancelled' 
                      ? '❌ Esta cotización fue cancelada'
                      : '⏰ Esta cotización expiró'
                    }
                  </p>
                </IonText>
              </IonCardContent>
            </IonCard>
          )}

          {/* Mensaje si fue aceptada */}
          {myQuote.status === 'accepted' && (
            <IonCard color="success">
              <IonCardContent style={{ textAlign: 'center' }}>
                <IonText color="light">
                  <h3 style={{ margin: '8px 0' }}>🎉 ¡Cotización Aceptada!</h3>
                  <p style={{ margin: '8px 0' }}>
                    El cliente aceptó tu cotización. Prepárate para el servicio.
                  </p>
                </IonText>
              </IonCardContent>
            </IonCard>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default QuoteDetail;
