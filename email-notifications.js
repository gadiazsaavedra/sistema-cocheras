const nodemailer = require('nodemailer');

// Configuración del transportador de email
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Función para enviar email de pago pendiente
async function enviarNotificacionPagoPendiente(pagoData) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('⚠️ Credenciales de email no configuradas');
    return { success: false, error: 'Email no configurado' };
  }

  try {
    const transporter = createEmailTransporter();
    
    const adminEmails = [
      process.env.ADMIN_EMAIL || 'gadiazsaavedra@gmail.com',
      process.env.COADMIN_EMAIL || 'c.andrea.lopez@hotmail.com'
    ];

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1976d2; color: white; padding: 20px; text-align: center;">
          <h1>🔔 Nuevo Pago Pendiente</h1>
        </div>
        
        <div style="padding: 20px; background: #f5f5f5;">
          <h2>Detalles del Pago</h2>
          
          <div style="background: white; padding: 15px; border-radius: 5px; margin: 10px 0;">
            <p><strong>👤 Cliente:</strong> ${pagoData.clienteNombre}</p>
            <p><strong>💰 Monto:</strong> $${pagoData.monto?.toLocaleString()}</p>
            <p><strong>💳 Tipo:</strong> ${pagoData.tipoPago}</p>
            <p><strong>👨‍💼 Empleado:</strong> ${pagoData.empleadoNombre}</p>
            <p><strong>📅 Fecha:</strong> ${new Date().toLocaleString('es-AR')}</p>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="https://sistema-cocheras.netlify.app/" 
               style="background: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              🔍 Ver en Sistema
            </a>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 5px; margin: 15px 0;">
            <p style="margin: 0;"><strong>⚠️ Acción Requerida:</strong> Este pago necesita ser aprobado o rechazado por un administrador.</p>
          </div>
        </div>
        
        <div style="background: #6c757d; color: white; padding: 10px; text-align: center; font-size: 12px;">
          Sistema de Gestión de Cocheras - Notificación Automática
        </div>
      </div>
    `;

    // Enviar email a ambos administradores
    for (const email of adminEmails) {
      await transporter.sendMail({
        from: `"Sistema Cocheras" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `🔔 Nuevo Pago Pendiente - ${pagoData.clienteNombre} ($${pagoData.monto})`,
        html: emailContent
      });
    }

    console.log(`✅ Email enviado a administradores para pago de ${pagoData.clienteNombre}`);
    return { success: true, recipients: adminEmails };

  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return { success: false, error: error.message };
  }
}

// Función para enviar resumen diario de pagos pendientes
async function enviarResumenDiario() {
  return { success: true, message: 'Resumen diario deshabilitado' };
}

module.exports = {
  enviarNotificacionPagoPendiente,
  enviarResumenDiario
};