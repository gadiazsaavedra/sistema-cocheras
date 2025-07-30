# 🏠 Sistema de Gestión de Cocheras

Sistema integral para la gestión y control del pago mensual de clientes por el alquiler de cocheras con sistema anti-fraude.

## 🚀 Características Principales

### 🔐 Sistema Anti-fraude
- **Doble confirmación**: Los empleados registran pagos que deben ser confirmados por administradores
- **Fotos obligatorias**: Captura de comprobantes/efectivo con geolocalización
- **Estados de pago**: Pendiente → Confirmado/Rechazado
- **Timestamps**: Registro exacto de fecha y hora

### 👥 Roles y Permisos
- **Administrador**: Control total del sistema
- **Co-administrador**: Puede confirmar pagos
- **Empleados**: Solo registro de pagos (Victor, Raul, Carlos, Fernando)

### 🏠 Gestión Completa
- **6 tipos de vehículo**: Moto, Auto, Camioneta, Furgón, Camión, Trailer
- **3 modalidades de tiempo**: Diurna (8-17hs), Nocturna (17-8hs), 24hs
- **2 tipos de cobertura**: Bajo techo, Bajo carpa
- **Precios configurables**: Tabla editable por tipo
- **Control de morosidad**: Automático basado en fechas

### 📊 Reportes Avanzados
- **Cobros del día**: Filtrado por fecha
- **Lista de morosos**: Automática con días vencidos
- **Reporte por empleado**: Estadísticas individuales
- **Reportes con filtros**: Personalizables
- **Historial por cliente**: Completo con estadísticas

### 📱 Tecnología
- **PWA**: Funciona como app móvil y en PC
- **Tiempo real**: Sincronización automática Firebase
- **Offline**: Funcionalidad básica sin conexión
- **Despliegue continuo**: Con migraciones y backups

## 🛠️ Instalación

### Prerrequisitos
- Node.js 16+
- Cuenta de Firebase (gratuita)

### 1. Configuración Firebase
1. Crear proyecto en [Firebase Console](https://console.firebase.google.com)
2. Habilitar Authentication, Firestore y Storage
3. Descargar credenciales y guardar como `firebase-service-account.json`

### 2. Instalación
```bash
# Clonar repositorio
git clone https://github.com/gadiazsaavedra/sistema-cocheras.git
cd sistema-cocheras

# Instalar dependencias
npm install
cd client && npm install && cd ..

# Crear usuarios empleados
npm run setup-empleados

# Ejecutar migraciones
npm run migrate
```

### 3. Ejecución
```bash
# Desarrollo
npm run dev

# Producción
npm run deploy
```

## 👥 Credenciales de Acceso

### Administradores
- **Admin**: gadiazsaavedra@gmail.com
- **Co-admin**: c.andrea.lopez@hotmail.com

### Empleados
- **Victor**: victor.cocheras@sistema.local / 123456
- **Raul**: raul.cocheras@sistema.local / 123456
- **Carlos**: carlos.cocheras@sistema.local / 123456
- **Fernando**: fernando.cocheras@sistema.local / 123456

## 📋 Funcionalidades por Rol

### Empleados
- ✅ Ver clientes asignados
- ✅ Registrar pagos con foto obligatoria
- ✅ Geolocalización automática
- ✅ Seleccionar tipo de pago

### Administradores
- ✅ Dashboard de pagos pendientes
- ✅ Aprobar/rechazar pagos
- ✅ Gestión completa de clientes
- ✅ Configuración de precios
- ✅ Reportes avanzados
- ✅ Control de morosidad
- ✅ Historial de pagos

## 🔧 Scripts Disponibles

```bash
npm start          # Iniciar servidor
npm run dev        # Modo desarrollo
npm run build      # Build frontend
npm run deploy     # Despliegue completo
npm run migrate    # Ejecutar migraciones
npm run backup     # Crear backup
npm run setup-empleados  # Crear usuarios empleados
```

## 🏗️ Estructura del Proyecto

```
sistema-cocheras/
├── server.js              # Servidor Express
├── package.json           # Dependencias backend
├── firebase-service-account.json  # Credenciales (no incluido)
├── migrations/            # Migraciones de BD
├── backups/              # Backups automáticos
├── client/               # Frontend React
│   ├── src/
│   │   ├── components/   # Componentes reutilizables
│   │   ├── pages/        # Páginas principales
│   │   ├── services/     # APIs y Firebase
│   │   └── utils/        # Utilidades
│   └── public/           # PWA y archivos estáticos
└── uploads/              # Fotos de comprobantes
```

## 🚀 Despliegue

### Opciones Gratuitas
- **Frontend**: Netlify, Vercel, Firebase Hosting
- **Backend**: Railway, Render
- **Base de datos**: Firebase Firestore (1GB gratuito)

### Variables de Entorno
```bash
NODE_ENV=production
PORT=3000
FIREBASE_PROJECT_ID=tu-proyecto-id
```

## 🔒 Seguridad

- Autenticación Firebase
- Validación de roles en backend
- Reglas de seguridad Firestore
- Subida segura de archivos
- Geolocalización obligatoria
- Fotos obligatorias para pagos

## 📱 URLs de Acceso

- **App Principal**: http://localhost:3001
- **API Backend**: http://localhost:3000

## 🆘 Soporte

Para soporte técnico contactar al desarrollador.

## 📄 Licencia

Uso privado - Sistema desarrollado específicamente para gestión de cocheras.

---

**Desarrollado con ❤️ para la gestión eficiente de cocheras**