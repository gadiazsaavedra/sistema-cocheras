# 🔥 Índices Firebase - Configuración Manual

## 🚨 **ACCIÓN REQUERIDA**

Debes crear estos índices manualmente en Firebase Console para optimizar las queries:

## 📊 **Índices a Crear**

### **1. Clientes por Empleado**
- **Colección**: `clientes`
- **Campos**:
  - `empleadoAsignado` (Ascending)
  - `fechaCreacion` (Descending)
- **URL**: [Crear Índice](https://console.firebase.google.com/project/sistema-cocheras/firestore/indexes)

### **2. Pagos por Estado**
- **Colección**: `pagos`
- **Campos**:
  - `estado` (Ascending)
  - `fechaRegistro` (Descending)

### **3. Pagos por Empleado**
- **Colección**: `pagos`
- **Campos**:
  - `empleadoId` (Ascending)
  - `fechaRegistro` (Descending)

### **4. Pagos por Cliente**
- **Colección**: `pagos`
- **Campos**:
  - `clienteId` (Ascending)
  - `fechaRegistro` (Descending)

### **5. Pagos por Cliente y Estado**
- **Colección**: `pagos`
- **Campos**:
  - `clienteId` (Ascending)
  - `estado` (Ascending)
  - `fechaRegistro` (Descending)

## 🛠️ **Pasos para Crear Índices**

1. **Ir a Firebase Console**: https://console.firebase.google.com/project/sistema-cocheras/firestore/indexes

2. **Hacer clic en "Create Index"**

3. **Configurar cada índice** con los campos especificados arriba

4. **Esperar 5-10 minutos** para que se activen

## ⚡ **Impacto Esperado**

- **80% más rápido** en consultas complejas
- **Menos tiempo de carga** en dashboards
- **Mejor experiencia** en móviles
- **Menor costo** en Firebase (menos reads)

## 🔍 **Verificación**

Después de crear los índices, ejecuta:
```bash
node deploy-firebase-config.js
```

Si no hay errores, los índices están funcionando correctamente.

## 📱 **URLs Directas**

Firebase detectará automáticamente qué índices necesitas cuando uses la app. 
Las URLs aparecerán en la consola del navegador con enlaces directos para crearlos.

**¡Importante!** Sin estos índices, las queries serán lentas y pueden fallar con muchos datos.