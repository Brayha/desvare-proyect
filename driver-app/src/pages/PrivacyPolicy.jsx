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
            <IonBackButton defaultHref="/profile" text="Volver" />
          </IonButtons>
          <IonTitle>Política de Privacidad</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="legal-content">
        <div className="legal-container">
          <p className="legal-updated">Última actualización: Mayo 2026</p>

          <p>
            Esta Política de Privacidad aplica a los Conductores registrados en Desvare,
            en cumplimiento de la <strong>Ley 1581 de 2012</strong> de Colombia.
          </p>

          <h2>1. Responsable del Tratamiento</h2>
          <p>
            <strong>Desvare</strong><br />
            Correo: <a href="mailto:desvareweb@gmail.com">desvareweb@gmail.com</a><br />
            Colombia
          </p>

          <h2>2. Datos que Recopilamos</h2>
          <ul>
            <li>Nombre completo y número de teléfono</li>
            <li>Fotografía de perfil (selfie)</li>
            <li>Cédula de ciudadanía (frente y reverso)</li>
            <li>Licencia de conducción (frente y reverso)</li>
            <li>SOAT y tarjeta de propiedad del vehículo</li>
            <li>Ubicación GPS durante servicios activos</li>
            <li>Historial de servicios prestados y calificaciones</li>
            <li>Token FCM para notificaciones push</li>
          </ul>

          <h2>3. Finalidad del Tratamiento</h2>
          <ul>
            <li>Verificar tu identidad y habilitación como Conductor</li>
            <li>Conectarte con Clientes que solicitan servicios de grúa</li>
            <li>Mostrar tu ubicación a Clientes durante el servicio activo</li>
            <li>Enviarte notificaciones de nuevas solicitudes</li>
            <li>Mantener historial de servicios y calificaciones</li>
            <li>Cumplir requisitos legales y regulatorios</li>
          </ul>

          <h2>4. Ubicación GPS</h2>
          <p>
            La app solicita acceso a tu ubicación en <strong>segundo plano</strong> exclusivamente
            para enviar tu posición GPS al Cliente mientras vas en camino a prestar el servicio.
            Este acceso se activa solo cuando tienes un servicio aceptado activo y se detiene
            automáticamente al completar el servicio.
          </p>

          <h2>5. Compartición de Datos</h2>
          <p>
            Tu nombre, foto de perfil, calificación y ubicación son compartidos con el Cliente
            durante el servicio activo. <strong>No vendemos tus datos</strong> a terceros. Los
            documentos de verificación son de uso interno y no se comparten con los Clientes.
          </p>

          <h2>6. Almacenamiento y Seguridad</h2>
          <p>
            Tus documentos se almacenan en servidores en la nube con acceso restringido y cifrado.
            El acceso a tus documentos es exclusivo para el equipo de verificación de Desvare.
          </p>

          <h2>7. Retención de Datos</h2>
          <p>
            Conservamos tu información mientras tu cuenta esté activa. Al solicitar la eliminación
            de cuenta, borramos tus datos en 30 días hábiles, salvo obligación legal de retención.
          </p>

          <h2>8. Tus Derechos</h2>
          <p>Tienes derecho a conocer, actualizar, corregir y suprimir tus datos, y a revocar la
          autorización de tratamiento. Escríbenos a{' '}
          <a href="mailto:desvareweb@gmail.com">desvareweb@gmail.com</a>.</p>

          <h2>9. Contacto</h2>
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

export default PrivacyPolicy;
