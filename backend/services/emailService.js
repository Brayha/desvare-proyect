const nodemailer = require('nodemailer');

/**
 * Servicio de email transaccional con Gmail.
 * Usa las variables de entorno GMAIL_USER y GMAIL_APP_PASSWORD.
 * 
 * Para configurar Gmail App Password:
 * 1. Ve a myaccount.google.com → Seguridad → Verificación en 2 pasos (debe estar activa)
 * 2. Ve a myaccount.google.com → Seguridad → Contraseñas de aplicación
 * 3. Crea una contraseña para "Desvare Backend" y cópiala en GMAIL_APP_PASSWORD
 */

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.warn('⚠️ GMAIL_USER o GMAIL_APP_PASSWORD no configurados — emails desactivados');
    return null;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  console.log('✅ Servicio de email configurado para:', user);
  return transporter;
};

/**
 * Envía un email al administrador cuando un nuevo conductor completa su registro.
 * @param {Object} driver - Datos del conductor (name, phone, city)
 */
const notifyAdminNewDriver = async (driver) => {
  const t = getTransporter();
  if (!t) return;

  const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER || 'desvareweb@gmail.com';
  const appUrl = process.env.ADMIN_URL || 'https://admin.desvare.app';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .card { background: white; border-radius: 12px; padding: 32px; max-width: 480px; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .badge { display: inline-block; background: #fff3cd; color: #856404; border-radius: 20px; padding: 4px 14px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
        h2 { color: #1a1a2e; margin: 0 0 8px; font-size: 22px; }
        p { color: #555; line-height: 1.6; }
        .info-row { display: flex; align-items: center; gap: 10px; margin: 12px 0; padding: 12px 16px; background: #f8f9fa; border-radius: 8px; }
        .info-label { color: #888; font-size: 13px; min-width: 80px; }
        .info-value { color: #1a1a2e; font-weight: 600; font-size: 15px; }
        .btn { display: inline-block; margin-top: 24px; padding: 14px 28px; background: #0055ff; color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; }
        .footer { margin-top: 24px; font-size: 12px; color: #aaa; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <span class="badge">🚨 Acción requerida</span>
        <h2>Nuevo conductor registrado</h2>
        <p>Un conductor acaba de completar su registro y está esperando que revises sus documentos.</p>

        <div class="info-row">
          <span class="info-label">Nombre</span>
          <span class="info-value">${driver.name || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Teléfono</span>
          <span class="info-value">${driver.phone || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Ciudad</span>
          <span class="info-value">${driver.city || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Registro</span>
          <span class="info-value">${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</span>
        </div>

        <a href="${appUrl}" class="btn">Ir al panel de administración →</a>

        <div class="footer">
          <p>Este es un correo automático de Desvare. No respondas a este mensaje.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await t.sendMail({
      from: `"Desvare" <${process.env.GMAIL_USER}>`,
      to: adminEmail,
      subject: `🚗 Nuevo conductor: ${driver.name || 'Sin nombre'} — Pendiente de revisión`,
      html,
    });
    console.log(`✅ Email de nuevo conductor enviado a ${adminEmail}`);
  } catch (error) {
    console.error('❌ Error enviando email de nuevo conductor:', error.message);
  }
};

/**
 * Notifica al conductor cuando su cuenta es aprobada.
 * @param {Object} driver - Datos del conductor (name, phone)
 */
const notifyDriverApproved = async (driver) => {
  const t = getTransporter();
  if (!t || !driver.email) return;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
        .card { background: white; border-radius: 12px; padding: 32px; max-width: 480px; margin: 0 auto; }
        h2 { color: #1a1a2e; }
        p { color: #555; line-height: 1.6; }
        .check { font-size: 48px; text-align: center; margin-bottom: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="check">✅</div>
        <h2>¡Tu cuenta fue aprobada, ${driver.name}!</h2>
        <p>Ya puedes comenzar a recibir solicitudes de servicio en Desvare. Abre la app, activa tu disponibilidad y empieza a generar ingresos.</p>
        <p>Bienvenido al equipo Desvare.</p>
      </div>
    </body>
    </html>
  `;

  try {
    await t.sendMail({
      from: `"Desvare" <${process.env.GMAIL_USER}>`,
      to: driver.email,
      subject: '✅ Tu cuenta de conductor en Desvare fue aprobada',
      html,
    });
    console.log(`✅ Email de aprobación enviado a ${driver.email}`);
  } catch (error) {
    console.error('❌ Error enviando email de aprobación:', error.message);
  }
};

module.exports = { notifyAdminNewDriver, notifyDriverApproved };
