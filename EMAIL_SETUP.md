# 📧 Configuración de Notificaciones por Email

## ✅ **Sistema Implementado**

Tu sistema ahora envía emails automáticamente cuando:
- 🔔 **Empleado registra pago** → Email inmediato a admin y co-admin
- 📊 **Resumen diario** → 9:00 AM con todos los pagos pendientes

## 🔧 **Configuración Requerida**

### **1. Crear App Password de Gmail**

#### **Para Admin (gadiazsaavedra@gmail.com):**
1. **Ve a**: https://myaccount.google.com/security
2. **Activar "Verificación en 2 pasos"** (si no está activa)
3. **Buscar "Contraseñas de aplicaciones"**
4. **Seleccionar "Correo"** → **"Otro"** → Escribir "Sistema Cocheras"
5. **Copiar la contraseña** generada (16 caracteres)

### **2. Variables de Entorno**

Agregar a tu servidor de producción:
```bash
EMAIL_USER=gadiazsaavedra@gmail.com
EMAIL_PASS=abcd-efgh-ijkl-mnop
ADMIN_EMAIL=gadiazsaavedra@gmail.com
COADMIN_EMAIL=c.andrea.lopez@hotmail.com
```

### **3. En Desarrollo (Local)**
Crear archivo `.env`:
```bash
EMAIL_USER=gadiazsaavedra@gmail.com
EMAIL_PASS=tu-app-password-aqui
ADMIN_EMAIL=gadiazsaavedra@gmail.com
COADMIN_EMAIL=c.andrea.lopez@hotmail.com
```

## 📧 **Emails que se Enviarán**

### **1. Pago Pendiente (Inmediato)**
```
Asunto: 🔔 Nuevo Pago Pendiente - Juan Pérez ($15,000)

Contenido:
- Datos del cliente
- Monto y tipo de pago
- Empleado que registró
- Botón para ir al sistema
```

### **2. Resumen Diario (9:00 AM)**
```
Asunto: 📊 Resumen Diario - 5 Pagos Pendientes ($75,000)

Contenido:
- Total de pagos pendientes
- Lista detallada
- Monto total
- Botón para revisar
```

## 🧪 **Probar el Sistema**

### **Método 1: Registrar Pago de Prueba**
1. **Entrar como empleado** (victor.cocheras@sistema.local)
2. **Registrar un pago**
3. **Verificar que llegue email** a ambos admins

### **Método 2: Probar Manualmente**
```bash
# En tu servidor
node -e "
const { enviarNotificacionPagoPendiente } = require('./email-notifications');
enviarNotificacionPagoPendiente({
  clienteNombre: 'Cliente Prueba',
  monto: 15000,
  tipoPago: 'efectivo',
  empleadoNombre: 'Empleado Prueba',
  fechaRegistro: new Date()
});
"
```

## 📱 **Notificaciones Móviles**

Si tienes **Gmail app** en tu móvil:
- ✅ **Push notifications** automáticas
- ✅ **Sonido de alerta**
- ✅ **Badge en ícono**

## 🔧 **Personalización**

### **Cambiar Horario de Resumen**
```javascript
// En server.js, línea ~XXX
cron.schedule('0 9 * * *', ...); // 9:00 AM
// Cambiar a:
cron.schedule('0 8 * * *', ...); // 8:00 AM
```

### **Agregar Más Destinatarios**
```bash
# Agregar más emails separados por coma
ADMIN_EMAIL=admin1@gmail.com,admin2@gmail.com,admin3@gmail.com
```

## 🚨 **Solución de Problemas**

### **Error: "Invalid login"**
- ✅ Verificar que tienes **App Password** (no contraseña normal)
- ✅ Verificar **2-Step Verification** activada

### **Error: "Less secure app access"**
- ✅ Usar **App Password** en lugar de contraseña normal

### **No llegan emails**
- ✅ Verificar **carpeta Spam**
- ✅ Verificar variables de entorno configuradas

## 🎯 **Próximos Pasos**

1. **Configurar App Password** de Gmail
2. **Agregar variables de entorno** en producción
3. **Probar con pago de prueba**
4. **Verificar que lleguen emails**

**¡Tu sistema ahora notifica automáticamente por email cuando hay pagos pendientes!**