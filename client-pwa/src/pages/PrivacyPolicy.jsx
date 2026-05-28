import React from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle,
  IonContent, IonButtons, IonBackButton,
} from '@ionic/react';
import './LegalPage.css';

const PrivacyPolicy = () => {
  return (
    <IonPage>
      <IonHeader mode="ios">
        <IonToolbar mode="ios">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" text="Volver" />
          </IonButtons>
          <IonTitle>Política de Privacidad</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="legal-content">
        <div className="legal-container">
          <p className="legal-updated">Última actualización: Mayo 2026</p>

          <p>
            En Desvare nos tomamos muy en serio la privacidad de nuestros usuarios. Esta Política
            describe qué datos recopilamos, cómo los usamos y cómo los protegemos, en cumplimiento
            de la <strong>Ley 1581 de 2012</strong> (Protección de Datos Personales) y el
            <strong> Decreto 1377 de 2013</strong> de Colombia.
          </p>

          <h2>1. Responsable del Tratamiento</h2>
          <p>
            <strong>Desvare</strong><br />
            Correo electrónico: <a href="mailto:desvareweb@gmail.com">desvareweb@gmail.com</a><br />
            Colombia
          </p>

          <h2>2. Datos que Recopilamos</h2>
          <p><strong>De los Clientes:</strong></p>
          <ul>
            <li>Número de teléfono celular (para autenticación y contacto)</li>
            <li>Nombre</li>
            <li>Ubicación GPS en tiempo real (solo durante el servicio activo)</li>
            <li>Dirección de origen y destino del servicio</li>
            <li>Datos del vehículo (marca, modelo, placa, color)</li>
            <li>Historial de servicios solicitados</li>
          </ul>
          <p><strong>De los Conductores (además de lo anterior):</strong></p>
          <ul>
            <li>Fotografía de perfil (selfie)</li>
            <li>Documento de identidad (cédula de ciudadanía)</li>
            <li>Licencia de conducción (frente y reverso)</li>
            <li>SOAT del vehículo</li>
            <li>Tarjeta de propiedad del vehículo</li>
            <li>Ubicación GPS durante la prestación del servicio</li>
          </ul>

          <h2>3. Finalidad del Tratamiento</h2>
          <p>Usamos tus datos exclusivamente para:</p>
          <ul>
            <li>Prestarte el servicio de intermediación de grúas</li>
            <li>Verificar la identidad y documentación de los Conductores</li>
            <li>Conectar Clientes con Conductores cercanos</li>
            <li>Mostrar la ubicación del Conductor al Cliente durante el servicio</li>
            <li>Generar historial de servicios</li>
            <li>Enviarte notificaciones relacionadas con tu solicitud activa</li>
            <li>Mejorar la plataforma mediante análisis agregados (sin identificarte individualmente)</li>
          </ul>

          <h2>4. Compartición de Datos</h2>
          <p>
            <strong>No vendemos ni compartimos</strong> tus datos personales con terceros con fines
            comerciales. Los datos se comparten únicamente:
          </p>
          <ul>
            <li>Entre Clientes y Conductores: el nombre, teléfono y ubicación son visibles
              mutuamente durante un servicio activo.</li>
            <li>Con proveedores de infraestructura técnica (servidores en la nube) bajo acuerdos
              de confidencialidad.</li>
            <li>Con autoridades competentes cuando exista una orden judicial o legal.</li>
          </ul>

          <h2>5. Almacenamiento y Seguridad</h2>
          <p>
            Los datos se almacenan en servidores seguros con cifrado en tránsito (HTTPS/TLS).
            Las contraseñas y PINs se almacenan cifrados con bcrypt. Los documentos de conductores
            se almacenan en servicios de almacenamiento en la nube con acceso restringido.
          </p>

          <h2>6. Retención de Datos</h2>
          <p>
            Conservamos tus datos mientras tu cuenta esté activa. Si solicitas la eliminación de
            tu cuenta, borraremos tus datos personales en un plazo máximo de 30 días hábiles,
            salvo obligación legal de conservarlos.
          </p>

          <h2>7. Tus Derechos (Ley 1581 de 2012)</h2>
          <p>Como titular de datos personales, tienes derecho a:</p>
          <ul>
            <li><strong>Conocer</strong> qué datos tuyos tenemos almacenados</li>
            <li><strong>Actualizar</strong> tus datos si son incorrectos</li>
            <li><strong>Suprimir</strong> tus datos (derecho al olvido)</li>
            <li><strong>Revocar</strong> tu autorización de tratamiento de datos</li>
            <li><strong>Presentar quejas</strong> ante la Superintendencia de Industria y Comercio</li>
          </ul>
          <p>
            Para ejercer estos derechos, escríbenos a{' '}
            <a href="mailto:desvareweb@gmail.com">desvareweb@gmail.com</a> con el asunto
            "Solicitud de datos personales".
          </p>

          <h2>8. Ubicación GPS</h2>
          <p>
            La ubicación en tiempo real se usa exclusivamente para:
          </p>
          <ul>
            <li>Encontrar conductores cercanos a tu solicitud</li>
            <li>Mostrar el seguimiento del conductor en camino</li>
          </ul>
          <p>
            <strong>No rastreamos tu ubicación</strong> fuera de un servicio activo. La app del
            Conductor solicita acceso a ubicación en segundo plano para poder enviar su posición
            mientras conduce hacia el Cliente.
          </p>

          <h2>9. Notificaciones Push</h2>
          <p>
            Enviamos notificaciones push únicamente relacionadas con tu servicio activo (nueva
            cotización recibida, conductor aceptado, servicio completado). No enviamos publicidad
            ni mensajes no solicitados.
          </p>

          <h2>10. Cambios a esta Política</h2>
          <p>
            Podemos actualizar esta Política. Te notificaremos por la app o correo ante cambios
            significativos. El uso continuado de la Plataforma implica la aceptación de la
            Política actualizada.
          </p>

          <h2>11. Contacto</h2>
          <p>
            Para consultas sobre privacidad:{' '}
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

export default PrivacyPolicy;
