const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

// Configurar transporter de email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'gadiazsaavedra@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

async function verificarAumentosTrimestrales() {
  try {
    const db = admin.firestore();
    const hoy = new Date();
    
    // Obtener todos los clientes activos
    const clientesSnapshot = await db.collection('clientes').where('estado', '==', 'activo').get();
    const clientes = clientesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const clientesParaAumento = [];
    
    for (const cliente of clientes) {
      // Verificar si han pasado 3 meses desde el último aumento
      const ultimoAumento = cliente.fechaUltimoAumento ? new Date(cliente.fechaUltimoAumento) : new Date(cliente.fechaCreacion?.toDate() || hoy);
      const mesesTranscurridos = Math.floor((hoy - ultimoAumento) / (1000 * 60 * 60 * 24 * 30));
      
      if (mesesTranscurridos >= 3) {
        clientesParaAumento.push({
          ...cliente,
          mesesSinAumento: mesesTranscurridos,
          ultimoAumento: ultimoAumento.toLocaleDateString('es-AR')
        });
      }
    }
    
    if (clientesParaAumento.length > 0) {
      await enviarNotificacionAumentos(clientesParaAumento);
      console.log(`✅ Notificación de aumentos enviada para ${clientesParaAumento.length} clientes`);
    } else {
      console.log('ℹ️ No hay clientes que requieran aumento trimestral');
    }
    
    return { success: true, clientesParaAumento: clientesParaAumento.length };
  } catch (error) {
    console.error('Error verificando aumentos trimestrales:', error);
    return { success: false, error: error.message };
  }
}

async function enviarNotificacionAumentos(clientes) {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
      <h2 style="color: #1976d2; text-align: center;">📈 Aumentos Trimestrales Pendientes</h2>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #333;">Resumen</h3>
        <p><strong>${clientes.length} clientes</strong> requieren aumento de precio (3+ meses sin aumento)</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-AR')}</p>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #1976d2; color: white;">
            <th style="padding: 12px; border: 1px solid #ddd;">Cliente</th>
            <th style="padding: 12px; border: 1px solid #ddd;">Precio Actual</th>
            <th style="padding: 12px; border: 1px solid #ddd;">Último Aumento</th>
            <th style="padding: 12px; border: 1px solid #ddd;">Meses Sin Aumento</th>
            <th style="padding: 12px; border: 1px solid #ddd;">Empleado</th>
          </tr>
        </thead>
        <tbody>
          ${clientes.map(cliente => `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px; border: 1px solid #ddd;">
                <strong>${cliente.nombre} ${cliente.apellido}</strong><br>
                <small style="color: #666;">${cliente.telefono}</small>
              </td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                <strong style="color: #2e7d32;">$${cliente.precio?.toLocaleString() || 'N/A'}</strong>
              </td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                ${cliente.ultimoAumento}
              </td>
              <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                <span style="background: ${cliente.mesesSinAumento >= 6 ? '#f44336' : '#ff9800'}; 
                             color: white; padding: 4px 8px; border-radius: 4px;">
                  ${cliente.mesesSinAumento} meses
                </span>
              </td>
              <td style="padding: 10px; border: 1px solid #ddd;">
                ${cliente.empleadoAsignado?.split('@')[0] || 'Sin asignar'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h4 style="color: #1976d2; margin: 0 0 10px 0;">💡 Recomendaciones</h4>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Revisar precios de mercado antes de aplicar aumentos</li>
          <li>Considerar la situación económica de cada cliente</li>
          <li>Aplicar aumentos graduales para clientes sensibles al precio</li>
          <li>Documentar todos los cambios de precio</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0; color: #666;">
        <p>Sistema de Gestión de Cocheras - Notificación Automática</p>
        <p><small>Este email se envía automáticamente el primer día de cada mes</small></p>
      </div>
    </div>
  `;
  
  const mailOptions = {
    from: process.env.EMAIL_USER || 'gadiazsaavedra@gmail.com',
    to: ['gadiazsaavedra@gmail.com', 'c.andrea.lopez@hotmail.com'],
    subject: `📈 Aumentos Trimestrales Pendientes - ${clientes.length} clientes`,
    html: htmlContent
  };
  
  await transporter.sendMail(mailOptions);
}

module.exports = { verificarAumentosTrimestrales };