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
            <IonBackButton defaultHref="/home" text="Volver" />
          </IonButtons>
          <IonTitle>Términos y Condiciones</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="legal-content">
        <div className="legal-container">
          <p className="legal-updated">Última actualización: Mayo 2026</p>

          <h2>1. Aceptación de los Términos</h2>
          <p>
            Al acceder y utilizar la plataforma Desvare (en adelante "la Plataforma"), el usuario
            acepta de forma expresa estos Términos y Condiciones. Si no está de acuerdo con alguno
            de ellos, debe abstenerse de usar la Plataforma.
          </p>

          <h2>2. Descripción del Servicio</h2>
          <p>
            Desvare es una plataforma tecnológica de intermediación que conecta a personas que
            requieren servicios de grúa o asistencia vehicular ("Clientes") con operadores
            independientes de grúas ("Conductores"). Desvare <strong>no presta directamente el
            servicio de grúa</strong>; actúa exclusivamente como intermediario tecnológico.
          </p>

          <h2>3. Registro y Responsabilidad del Usuario</h2>
          <p>
            Para solicitar servicios, el Cliente debe proporcionar información veraz sobre su
            vehículo y ubicación. El Usuario es responsable de la exactitud de los datos
            ingresados. Desvare no se hace responsable por servicios mal coordinados debido a
            información incorrecta proporcionada por el usuario.
          </p>

          <h2>4. Cotizaciones y Precios</h2>
          <p>
            Los precios son fijados libremente por cada Conductor registrado. Desvare no establece
            tarifas fijas. La cotización aceptada por el Cliente es un acuerdo directo entre el
            Cliente y el Conductor. Desvare no interviene en la negociación del precio ni garantiza
            precios mínimos o máximos.
          </p>

          <h2>5. Responsabilidad de los Conductores</h2>
          <p>
            Los Conductores registrados en Desvare son operadores independientes. Deben contar con
            toda la documentación legal vigente (SOAT, licencia de conducción, tarjeta de propiedad
            del vehículo). Desvare verifica la documentación al momento del registro, pero no
            garantiza la vigencia continua de dichos documentos durante la prestación del servicio.
          </p>

          <h2>6. Limitación de Responsabilidad</h2>
          <p>
            Desvare no es responsable por daños, accidentes, pérdidas o perjuicios que ocurran
            durante la prestación del servicio de grúa. La relación contractual del servicio se
            establece directamente entre el Cliente y el Conductor. En caso de inconvenientes,
            el usuario debe dirigirse directamente al Conductor.
          </p>

          <h2>7. Calificaciones y Comentarios</h2>
          <p>
            Los Clientes pueden calificar a los Conductores después de cada servicio. Desvare
            se reserva el derecho de remover calificaciones que contengan lenguaje ofensivo,
            información falsa o que violen las políticas de la comunidad.
          </p>

          <h2>8. Cancelaciones</h2>
          <p>
            Los Clientes pueden cancelar una solicitud antes de que un Conductor inicie el
            desplazamiento. Los Conductores pueden rechazar o cancelar servicios que consideren
            inseguros. El abuso reiterado del sistema de cancelaciones puede resultar en la
            suspensión de la cuenta.
          </p>

          <h2>9. Prohibiciones</h2>
          <p>Está prohibido:</p>
          <ul>
            <li>Crear solicitudes falsas o fraudulentas.</li>
            <li>Usar la Plataforma para actividades ilegales.</li>
            <li>Acosar o amenazar a Conductores o al equipo de Desvare.</li>
            <li>Intentar acceder a sistemas o datos de otros usuarios.</li>
          </ul>

          <h2>10. Modificaciones al Servicio</h2>
          <p>
            Desvare se reserva el derecho de modificar, suspender o descontinuar cualquier
            aspecto de la Plataforma en cualquier momento, con o sin previo aviso.
          </p>

          <h2>11. Ley Aplicable</h2>
          <p>
            Estos Términos se rigen por las leyes de la República de Colombia. Cualquier disputa
            se someterá a la jurisdicción de los tribunales competentes de Colombia.
          </p>

          <h2>12. Contacto</h2>
          <p>
            Para preguntas sobre estos Términos, escríbenos a:{' '}
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
