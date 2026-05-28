import React from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle,
  IonContent, IonButtons, IonBackButton,
} from '@ionic/react';
import './LegalPage.css';

const TermsAndConditions = () => {
  return (
    <IonPage>
      <IonHeader mode="ios">
        <IonToolbar mode="ios">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/profile" text="Volver" />
          </IonButtons>
          <IonTitle>Términos y Condiciones</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="legal-content">
        <div className="legal-container">
          <p className="legal-updated">Última actualización: Mayo 2026</p>

          <h2>1. Aceptación de los Términos</h2>
          <p>
            Al registrarte como Conductor en la plataforma Desvare, aceptas expresamente estos
            Términos y Condiciones. Si no estás de acuerdo, debes cesar el uso de la Plataforma.
          </p>

          <h2>2. Descripción del Servicio</h2>
          <p>
            Desvare es una plataforma de intermediación tecnológica que conecta Conductores de grúa
            independientes con Clientes que requieren asistencia vehicular. Desvare <strong>no es
            tu empleador</strong> ni parte en el contrato de prestación del servicio de grúa.
          </p>

          <h2>3. Requisitos para Conductores</h2>
          <p>Para operar en Desvare debes mantener vigentes:</p>
          <ul>
            <li>Licencia de conducción categoría C2 o superior</li>
            <li>SOAT del vehículo grúa</li>
            <li>Tarjeta de propiedad o contrato de arrendamiento del vehículo</li>
            <li>Revisión técnico-mecánica al día</li>
            <li>Permiso de operación o habilitación de transporte especial (donde aplique)</li>
          </ul>
          <p>
            Es responsabilidad exclusiva del Conductor mantener estos documentos vigentes.
            Desvare puede suspender tu cuenta ante el vencimiento de cualquier documento.
          </p>

          <h2>4. Cotizaciones y Precios</h2>
          <p>
            Los Conductores fijan libremente sus tarifas. Desvare no establece precios mínimos
            ni máximos. Al enviar una cotización, el Conductor se compromete a prestar el servicio
            por el valor cotizado si el Cliente lo acepta.
          </p>

          <h2>5. Calidad del Servicio</h2>
          <p>
            Los Conductores deben prestar el servicio con diligencia, seguridad y respeto.
            Desvare puede suspender o eliminar cuentas con calificaciones consistentemente bajas
            o con quejas reiteradas de los Clientes.
          </p>

          <h2>6. Comisiones de Plataforma</h2>
          <p>
            Durante el período de lanzamiento inicial, Desvare <strong>no cobra comisión</strong>
            a los Conductores. Cuando se implemente el sistema de cobro, se notificará con al
            menos 30 días de anticipación.
          </p>

          <h2>7. Conducta Prohibida</h2>
          <ul>
            <li>Cobrar montos distintos al cotizado y aceptado</li>
            <li>Abandonar un servicio sin causa justificada</li>
            <li>Acosar o amenazar a Clientes</li>
            <li>Manipular calificaciones o crear cuentas falsas</li>
            <li>Prestar servicio bajo efectos de alcohol o sustancias</li>
          </ul>

          <h2>8. Responsabilidad</h2>
          <p>
            El Conductor es responsable por los daños causados al vehículo del Cliente o a
            terceros durante la prestación del servicio. Desvare no asume responsabilidad por
            accidentes, daños o perjuicios durante el servicio de grúa.
          </p>

          <h2>9. Modificaciones</h2>
          <p>
            Desvare puede modificar estos Términos con notificación previa de 15 días. El uso
            continuado de la Plataforma implica la aceptación de los cambios.
          </p>

          <h2>10. Ley Aplicable</h2>
          <p>
            Estos Términos se rigen por las leyes de la República de Colombia.
          </p>

          <h2>11. Contacto</h2>
          <p>
            <a href="mailto:desvareweb@gmail.com">desvareweb@gmail.com</a>
          </p>

          <div className="legal-footer">
            <p>© 2026 Desvare. Todos los derechos reservados.</p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default TermsAndConditions;
